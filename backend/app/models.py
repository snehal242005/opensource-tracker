from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PRStage(str, Enum):
    REGISTERED = "Registered"
    PR_RAISED = "PR Raised"
    UNDER_REVIEW = "Under Review"
    CHANGES_REQUESTED = "Changes Requested"
    RESUBMITTED = "Re-submitted"
    APPROVED = "Approved"
    MERGED = "Merged"
    CLOSED_REJECTED = "Closed/Rejected"


class PullRequestCreate(BaseModel):
    repo: str = Field(..., min_length=1)
    url: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    stage: PRStage = PRStage.REGISTERED


class PullRequestUpdate(BaseModel):
    repo: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    stage: Optional[PRStage] = None


class PullRequestOut(BaseModel):
    id: str
    student_id: str
    repo: str
    url: str
    title: str
    stage: PRStage
    source: str
    created_at: Optional[str] = None


class UserRole(str, Enum):
    STUDENT = "student"
    MENTOR = "mentor"
    ADMIN = "admin"


class SyncSummary(BaseModel):
    fetched: int
    created: int
    updated: int
    synced_manual: int


class UserOut(BaseModel):
    uid: str
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    roll_number: Optional[str] = None
    college_name: Optional[str] = None
    year: Optional[str] = None
    mentor_id: Optional[str] = None


class MentorOut(BaseModel):
    """Minimal, public-safe mentor info for the signup mentor dropdown."""

    uid: str
    name: Optional[str] = None
    email: Optional[str] = None


class FeedbackStatus(str, Enum):
    APPROVE = "approve"
    REQUEST_CHANGES = "request_changes"
    COMMENT = "comment"


class FeedbackCreate(BaseModel):
    pr_id: str = Field(..., min_length=1)
    comment: str = Field(..., min_length=1)
    status_recommendation: Optional[FeedbackStatus] = None
    parent_id: Optional[str] = None


class FeedbackOut(BaseModel):
    id: str
    pr_id: str
    student_id: str
    mentor_id: Optional[str] = None
    mentor_name: Optional[str] = None
    author_id: str
    author_name: Optional[str] = None
    author_role: str
    comment: str
    status_recommendation: Optional[FeedbackStatus] = None
    parent_id: Optional[str] = None
    created_at: Optional[str] = None


class NotificationOut(BaseModel):
    id: str
    user_id: str
    message: str
    read: bool
    related_pr_id: Optional[str] = None
    created_at: Optional[str] = None
