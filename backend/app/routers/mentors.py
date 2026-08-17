from fastapi import APIRouter

from ..firebase_config import get_firestore
from ..models import MentorOut

router = APIRouter(prefix="/mentors", tags=["mentors"])


@router.get("", response_model=list[MentorOut])
async def list_mentors():
    """Public, unauthenticated -- the signup form needs to populate the
    mentor dropdown before the student's Firebase Auth account (and thus
    ID token) exists yet. Only minimal, non-sensitive fields are returned.
    """
    db = get_firestore()
    docs = db.collection("users").where("role", "==", "mentor").stream()
    return [
        MentorOut(uid=doc.id, name=doc.to_dict().get("name"), email=doc.to_dict().get("email"))
        for doc in docs
    ]
