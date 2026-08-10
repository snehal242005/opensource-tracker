"""Maps a GitHub pull request's raw state + reviews onto our 8-stage enum.

See the "How the GitHub -> stage mapping works" section in README.md for the
human-readable version of this logic.
"""

TERMINAL_REVIEW_STATES = ("APPROVED", "CHANGES_REQUESTED")


def map_github_pr_to_stage(pr_detail: dict, reviews: list[dict], latest_commit_iso: str | None) -> str:
    # "Registered" has no GitHub equivalent -- it's for PRs a student is
    # still planning to open, so auto-sync never produces it.

    if pr_detail.get("state") == "closed":
        return "Merged" if pr_detail.get("merged") else "Closed/Rejected"

    if not reviews:
        if pr_detail.get("requested_reviewers") or pr_detail.get("requested_teams"):
            return "Under Review"
        return "PR Raised"

    # Only each reviewer's most recent APPROVED/CHANGES_REQUESTED review
    # counts -- an old "changes requested" that was later superseded by that
    # same reviewer's approval shouldn't still count against the PR.
    latest_by_reviewer: dict[str, dict] = {}
    for review in sorted(reviews, key=lambda r: r.get("submitted_at") or ""):
        state = review.get("state")
        if state in TERMINAL_REVIEW_STATES:
            reviewer_id = (review.get("user") or {}).get("id")
            latest_by_reviewer[reviewer_id] = review

    states = {r["state"] for r in latest_by_reviewer.values()}

    if "CHANGES_REQUESTED" in states:
        latest_changes_requested_at = max(
            r["submitted_at"] for r in latest_by_reviewer.values() if r["state"] == "CHANGES_REQUESTED"
        )
        # If the author pushed a new commit after the most recent
        # "changes requested" review, treat it as addressed and awaiting
        # another look, rather than still blocked.
        if latest_commit_iso and latest_commit_iso > latest_changes_requested_at:
            return "Re-submitted"
        return "Changes Requested"

    if "APPROVED" in states:
        return "Approved"

    return "Under Review"
