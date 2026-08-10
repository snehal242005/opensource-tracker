import httpx

GITHUB_API = "https://api.github.com"
GITHUB_OAUTH_HOST = "https://github.com"
_TIMEOUT = 15

# Cap how many PRs a single "Sync Now" click processes. Each PR costs 1-3
# extra GitHub API calls (detail + reviews + optionally commits), so this
# keeps a sync request fast and well within GitHub's rate limits. Clicking
# Sync Now again re-fetches the most recently updated PRs first.
MAX_PRS_PER_SYNC = 30


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}


async def exchange_code_for_token(*, client_id: str, client_secret: str, code: str, redirect_uri: str) -> str | None:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        res = await client.post(
            f"{GITHUB_OAUTH_HOST}/login/oauth/access_token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        res.raise_for_status()
        return res.json().get("access_token")


async def fetch_github_username(token: str) -> str | None:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        res = await client.get(f"{GITHUB_API}/user", headers=_auth_headers(token))
        res.raise_for_status()
        return res.json().get("login")


async def search_authored_prs(username: str, token: str) -> list[dict]:
    """All PRs authored by `username`, across every repo, most-recently-updated first.

    Uses the Search API (`author:` qualifier) rather than iterating the
    user's repos + org repos one by one — that would miss PRs opened against
    repos the student doesn't own (the common open-source contribution
    case), and would need many more API calls.
    """
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        res = await client.get(
            f"{GITHUB_API}/search/issues",
            params={
                "q": f"author:{username} type:pr",
                "sort": "updated",
                "order": "desc",
                "per_page": MAX_PRS_PER_SYNC,
            },
            headers=_auth_headers(token),
        )
        res.raise_for_status()
        return res.json().get("items", [])


def parse_repo_and_number(search_item: dict) -> tuple[str, str, int]:
    # repository_url looks like https://api.github.com/repos/{owner}/{repo}
    owner, repo = search_item["repository_url"].rstrip("/").split("/")[-2:]
    return owner, repo, search_item["number"]


async def fetch_pr_detail(owner: str, repo: str, number: int, token: str) -> dict:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{number}", headers=_auth_headers(token))
        res.raise_for_status()
        return res.json()


async def fetch_pr_reviews(owner: str, repo: str, number: int, token: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        res = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{number}/reviews",
            headers=_auth_headers(token),
            params={"per_page": 100},
        )
        res.raise_for_status()
        return res.json()


async def fetch_latest_commit_date(owner: str, repo: str, number: int, token: str) -> str | None:
    """ISO timestamp of the most recent commit on the PR, or None.

    Only called when a review is CHANGES_REQUESTED, to tell "Changes
    Requested" apart from "Re-submitted" (see stage_mapping.py).
    """
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        res = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{number}/commits",
            headers=_auth_headers(token),
            params={"per_page": 100},
        )
        res.raise_for_status()
        commits = res.json()

    dates = [
        c["commit"]["committer"]["date"]
        for c in commits
        if c.get("commit", {}).get("committer", {}).get("date")
    ]
    return max(dates) if dates else None
