from fastapi import APIRouter, Depends

from ..dependencies import require_role
from ..firebase_config import get_firestore
from ..models import UserOut

router = APIRouter(prefix="/users", tags=["users"])


def _doc_to_out(doc) -> UserOut:
    data = doc.to_dict()
    return UserOut(
        uid=doc.id,
        name=data.get("name"),
        email=data.get("email"),
        role=data.get("role"),
        roll_number=data.get("roll_number"),
        college_name=data.get("college_name"),
        year=data.get("year"),
        mentor_id=data.get("mentor_id"),
    )


@router.get("", response_model=list[UserOut])
async def list_users(current_user: dict = Depends(require_role("mentor", "admin"))):
    """Used by the mentor dashboard to show student profile details.

    Admins see every user. Mentors only see the students who picked them at
    signup (`mentor_id == their uid`) -- not the whole program roster.
    """
    db = get_firestore()

    if current_user["role"] == "mentor":
        docs = (
            db.collection("users")
            .where("role", "==", "student")
            .where("mentor_id", "==", current_user["uid"])
            .stream()
        )
    else:
        docs = db.collection("users").stream()

    return [_doc_to_out(doc) for doc in docs]
