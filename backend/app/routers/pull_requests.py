from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from ..crypto_utils import decrypt_token
from ..dependencies import get_current_user
from ..firebase_config import get_firestore
from ..github_client import (
    fetch_latest_commit_date,
    fetch_pr_detail,
    fetch_pr_reviews,
    parse_repo_and_number,
    search_authored_prs,
)
from ..models import PullRequestCreate, PullRequestOut, PullRequestUpdate, SyncSummary
from ..stage_mapping import map_github_pr_to_stage

router = APIRouter(prefix="/pull_requests", tags=["pull_requests"])

COLLECTION = "pull_requests"


def _doc_to_out(doc) -> PullRequestOut:
    data = doc.to_dict()
    created_at = data.get("created_at")
    return PullRequestOut(
        id=doc.id,
        student_id=data.get("student_id"),
        repo=data.get("repo"),
        url=data.get("url"),
        title=data.get("title"),
        stage=data.get("stage"),
        source=data.get("source", "manual"),
        created_at=created_at.isoformat() if hasattr(created_at, "isoformat") else created_at,
    )


def _chunked(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


@router.get("", response_model=list[PullRequestOut])
async def list_pull_requests(current_user: dict = Depends(get_current_user)):
    db = get_firestore()
    collection_ref = db.collection(COLLECTION)

    if current_user["role"] == "student":
        docs = collection_ref.where("student_id", "==", current_user["uid"]).stream()
        return [_doc_to_out(doc) for doc in docs]

    if current_user["role"] == "mentor":
        # Only PRs belonging to students who picked this mentor at signup --
        # not every student in the program. `in` queries are capped at 30
        # values, so chunk in case a mentor has more assigned students than that.
        student_ids = [
            doc.id
            for doc in db.collection("users")
            .where("role", "==", "student")
            .where("mentor_id", "==", current_user["uid"])
            .stream()
        ]
        if not student_ids:
            return []
        docs = []
        for chunk in _chunked(student_ids, 30):
            docs.extend(collection_ref.where("student_id", "in", chunk).stream())
        return [_doc_to_out(doc) for doc in docs]

    # admin: every submission
    docs = collection_ref.stream()
    return [_doc_to_out(doc) for doc in docs]


@router.post("", response_model=PullRequestOut, status_code=status.HTTP_201_CREATED)
async def create_pull_request(
    payload: PullRequestCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can register pull requests.",
        )

    db = get_firestore()
    doc_ref = db.collection(COLLECTION).document()
    data = {
        "student_id": current_user["uid"],
        "repo": payload.repo,
        "url": payload.url,
        "title": payload.title,
        "stage": payload.stage.value,
        "source": "manual",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    doc_ref.set(data)
    return PullRequestOut(id=doc_ref.id, **data)


@router.post("/sync", response_model=SyncSummary)
async def sync_github_pull_requests(current_user: dict = Depends(get_current_user)):
    """Fetch the caller's PRs from GitHub and upsert them into `pull_requests`.

    Matches existing docs by (student_id, url) so re-syncing never creates
    duplicates. A doc that already exists with source="manual" has its
    stage/title/repo refreshed to match GitHub reality but keeps its
    "manual" label -- it's the same PR, so it should stay in sync, but we
    don't want to silently relabel something the student typed in by hand.
    Everything else is written/updated with source="auto".
    """
    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can sync pull requests.",
        )

    db = get_firestore()
    uid = current_user["uid"]

    token_doc = db.collection("github_tokens").document(uid).get()
    if not token_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account is not connected yet. Click \"Connect GitHub\" first.",
        )

    try:
        token = decrypt_token(token_doc.to_dict()["encrypted_token"])
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    user_doc = db.collection("users").document(uid).get()
    github_username = (user_doc.to_dict() or {}).get("github_username")
    if not github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub username on file; try reconnecting GitHub.",
        )

    try:
        items = await search_authored_prs(github_username, token)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch pull requests from GitHub: {exc}",
        ) from exc

    collection_ref = db.collection(COLLECTION)
    created = updated = synced_manual = 0

    for item in items:
        owner, repo, number = parse_repo_and_number(item)
        try:
            pr_detail = await fetch_pr_detail(owner, repo, number, token)
            reviews = await fetch_pr_reviews(owner, repo, number, token)
            latest_commit_iso = None
            if any(r.get("state") == "CHANGES_REQUESTED" for r in reviews):
                latest_commit_iso = await fetch_latest_commit_date(owner, repo, number, token)
            stage = map_github_pr_to_stage(pr_detail, reviews, latest_commit_iso)
        except httpx.HTTPError:
            # Skip PRs we can't fully fetch (e.g. a transient GitHub error)
            # rather than failing the whole sync.
            continue

        url = item["html_url"]
        title = item["title"]
        repo_full_name = f"{owner}/{repo}"
        now_iso = datetime.now(timezone.utc).isoformat()

        existing = list(
            collection_ref.where("student_id", "==", uid).where("url", "==", url).limit(1).stream()
        )

        if existing:
            doc = existing[0]
            update_fields = {
                "repo": repo_full_name,
                "title": title,
                "stage": stage,
                "last_synced_at": now_iso,
            }
            if doc.to_dict().get("source") == "manual":
                synced_manual += 1
            else:
                update_fields["source"] = "auto"
                updated += 1
            doc.reference.update(update_fields)
        else:
            collection_ref.document().set(
                {
                    "student_id": uid,
                    "repo": repo_full_name,
                    "url": url,
                    "title": title,
                    "stage": stage,
                    "source": "auto",
                    "created_at": now_iso,
                    "last_synced_at": now_iso,
                }
            )
            created += 1

    db.collection("users").document(uid).update({"last_synced_at": datetime.now(timezone.utc).isoformat()})

    return SyncSummary(fetched=len(items), created=created, updated=updated, synced_manual=synced_manual)


def _get_owned_doc(db, pr_id: str, current_user: dict):
    doc_ref = db.collection(COLLECTION).document(pr_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pull request not found.")

    data = doc.to_dict()
    is_owner = data.get("student_id") == current_user["uid"]
    is_staff = current_user["role"] in ("mentor", "admin")
    if not (is_owner or is_staff):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this pull request.")

    return doc_ref, doc


@router.get("/{pr_id}", response_model=PullRequestOut)
async def get_pull_request(pr_id: str, current_user: dict = Depends(get_current_user)):
    db = get_firestore()
    _, doc = _get_owned_doc(db, pr_id, current_user)
    return _doc_to_out(doc)


@router.put("/{pr_id}", response_model=PullRequestOut)
async def update_pull_request(
    pr_id: str, payload: PullRequestUpdate, current_user: dict = Depends(get_current_user)
):
    db = get_firestore()
    doc_ref, doc = _get_owned_doc(db, pr_id, current_user)

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "stage" in updates:
        updates["stage"] = updates["stage"].value if hasattr(updates["stage"], "value") else updates["stage"]

    if updates:
        doc_ref.update(updates)

    return _doc_to_out(doc_ref.get())


@router.delete("/{pr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pull_request(pr_id: str, current_user: dict = Depends(get_current_user)):
    db = get_firestore()
    doc_ref, doc = _get_owned_doc(db, pr_id, current_user)

    data = doc.to_dict()
    is_owner = data.get("student_id") == current_user["uid"]
    is_admin = current_user["role"] == "admin"
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owning student or an admin can delete this pull request.",
        )

    doc_ref.delete()
    return None
