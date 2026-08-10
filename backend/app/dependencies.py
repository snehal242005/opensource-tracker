from fastapi import Depends, Header, HTTPException, status

from .firebase_config import get_firebase_auth, get_firestore


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Verify the Firebase ID token from the Authorization header and return
    the caller's identity plus their role from Firestore `users/{uid}`.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: Bearer <id_token>",
        )
    token = authorization.removeprefix("Bearer ").strip()

    try:
        fb_auth = get_firebase_auth()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    try:
        decoded = fb_auth.verify_id_token(token)
    except Exception as exc:  # noqa: BLE001 - any verification failure is an auth failure
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
        ) from exc

    uid = decoded["uid"]

    try:
        db = get_firestore()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    user_snapshot = db.collection("users").document(uid).get()
    if not user_snapshot.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user profile found in Firestore for this account. Complete signup first.",
        )

    user_data = user_snapshot.to_dict()
    return {
        "uid": uid,
        "email": decoded.get("email"),
        "name": user_data.get("name"),
        "role": user_data.get("role"),
    }


def require_role(*allowed_roles: str):
    """Dependency factory: raise 403 unless the current user's role is allowed."""

    async def _checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return _checker
