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
