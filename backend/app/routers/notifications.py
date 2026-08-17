from fastapi import APIRouter, Depends, status

from ..dependencies import get_current_user
from ..firebase_config import get_firestore
from ..models import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])

COLLECTION = "notifications"
MAX_RETURNED = 20


def _doc_to_out(doc) -> NotificationOut:
    data = doc.to_dict()
    created_at = data.get("created_at")
    return NotificationOut(
        id=doc.id,
        user_id=data.get("user_id"),
        message=data.get("message"),
        read=data.get("read", False),
        related_pr_id=data.get("related_pr_id"),
        created_at=created_at.isoformat() if hasattr(created_at, "isoformat") else created_at,
    )


@router.get("", response_model=list[NotificationOut])
async def list_notifications(current_user: dict = Depends(get_current_user)):
    db = get_firestore()
    docs = db.collection(COLLECTION).where("user_id", "==", current_user["uid"]).stream()
    items = [_doc_to_out(doc) for doc in docs]
    items.sort(key=lambda n: n.created_at or "", reverse=True)
    return items[:MAX_RETURNED]


@router.post("/mark_read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notifications_read(current_user: dict = Depends(get_current_user)):
    """Marks every unread notification for the caller as read (called when
    the notification dropdown is opened)."""
    db = get_firestore()
    docs = (
        db.collection(COLLECTION)
        .where("user_id", "==", current_user["uid"])
        .where("read", "==", False)
        .stream()
    )
    for doc in docs:
        doc.reference.update({"read": True})
    return None
