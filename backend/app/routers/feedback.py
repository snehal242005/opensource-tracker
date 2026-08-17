from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_current_user
from ..firebase_config import get_firestore
from ..models import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["feedback"])

COLLECTION = "feedback"
PR_COLLECTION = "pull_requests"
NOTIFICATIONS_COLLECTION = "notifications"


def _doc_to_out(doc) -> FeedbackOut:
    data = doc.to_dict()
    created_at = data.get("created_at")
    return FeedbackOut(
        id=doc.id,
        pr_id=data.get("pr_id"),
        student_id=data.get("student_id"),
        mentor_id=data.get("mentor_id"),
        mentor_name=data.get("mentor_name"),
        author_id=data.get("author_id"),
        author_name=data.get("author_name"),
        author_role=data.get("author_role"),
        comment=data.get("comment"),
        status_recommendation=data.get("status_recommendation"),
        parent_id=data.get("parent_id"),
        created_at=created_at.isoformat() if hasattr(created_at, "isoformat") else created_at,
    )


@router.post("", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
async def create_feedback(payload: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    """Create a feedback entry on a PR.

    Replies are stored as their own `feedback` docs linked via `parent_id`
    rather than a nested field on the parent -- that lets both mentors and
    the owning student post into the same thread through this one endpoint,
    instead of needing a separate reply endpoint/schema.
    """
    db = get_firestore()

    pr_doc = db.collection(PR_COLLECTION).document(payload.pr_id).get()
    if not pr_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pull request not found.")
    pr_data = pr_doc.to_dict()
    pr_student_id = pr_data.get("student_id")

    role = current_user["role"]
    is_staff = role in ("mentor", "admin")
    is_owner = current_user["uid"] == pr_student_id

    if is_staff:
        mentor_id = current_user["uid"]
        mentor_name = current_user["name"]
        status_recommendation = (
            payload.status_recommendation.value if payload.status_recommendation else None
        )
    elif is_owner:
        # Students can only reply into an existing thread, not open a new one.
        if not payload.parent_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can reply to existing feedback but can't start a new feedback thread.",
            )
        parent_doc = db.collection(COLLECTION).document(payload.parent_id).get()
        if not parent_doc.exists or parent_doc.to_dict().get("pr_id") != payload.pr_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback thread not found.")
        mentor_id = None
        mentor_name = None
        status_recommendation = None
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to leave feedback on this pull request.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    doc_ref = db.collection(COLLECTION).document()
    data = {
        "pr_id": payload.pr_id,
        "student_id": pr_student_id,
        "mentor_id": mentor_id,
        "mentor_name": mentor_name,
        "author_id": current_user["uid"],
        "author_name": current_user["name"],
        "author_role": role,
        "comment": payload.comment,
        "status_recommendation": status_recommendation,
        "parent_id": payload.parent_id,
        "created_at": now_iso,
    }
    doc_ref.set(data)

    if is_staff and pr_student_id:
        db.collection(NOTIFICATIONS_COLLECTION).document().set(
            {
                "user_id": pr_student_id,
                "message": f"{current_user['name']} left feedback on \"{pr_data.get('title')}\".",
                "read": False,
                "related_pr_id": payload.pr_id,
                "created_at": now_iso,
            }
        )

    return FeedbackOut(id=doc_ref.id, **data)


@router.get("/pr/{pr_id}", response_model=list[FeedbackOut])
async def list_feedback_for_pr(pr_id: str, current_user: dict = Depends(get_current_user)):
    db = get_firestore()

    pr_doc = db.collection(PR_COLLECTION).document(pr_id).get()
    if not pr_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pull request not found.")

    pr_data = pr_doc.to_dict()
    is_owner = pr_data.get("student_id") == current_user["uid"]
    is_staff = current_user["role"] in ("mentor", "admin")
    if not (is_owner or is_staff):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to view feedback on this pull request.",
        )

    # Sorted in Python rather than via Firestore order_by to avoid needing a
    # composite index for an equality filter + order-by-different-field query.
    docs = db.collection(COLLECTION).where("pr_id", "==", pr_id).stream()
    items = [_doc_to_out(doc) for doc in docs]
    items.sort(key=lambda f: f.created_at or "")
    return items
