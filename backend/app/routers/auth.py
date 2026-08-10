import secrets
import time
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from .. import config
from ..crypto_utils import encrypt_token
from ..dependencies import get_current_user
from ..firebase_config import get_firestore
from ..github_client import exchange_code_for_token, fetch_github_username

router = APIRouter(prefix="/auth/github", tags=["auth"])

STATE_COLLECTION = "oauth_states"
TOKENS_COLLECTION = "github_tokens"
STATE_TTL_SECONDS = 600  # OAuth round trip has 10 minutes to complete


@router.get("/login")
async def github_login(current_user: dict = Depends(get_current_user)):
    """Returns a GitHub authorize URL for the frontend to redirect to.

    A random `state` value is minted and stored server-side (mapped to the
    caller's uid) so the callback -- which GitHub redirects to as a plain
    browser navigation, with no Authorization header -- can still tell which
    Firestore user to attach the token to, and so the flow is protected
    against CSRF (an attacker can't forge a callback with a state we didn't
    issue).
    """
    if not config.github_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth is not configured on the backend (missing GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET).",
        )

    db = get_firestore()
    state = secrets.token_urlsafe(24)
    db.collection(STATE_COLLECTION).document(state).set(
        {"uid": current_user["uid"], "created_at": time.time()}
    )

    params = {
        "client_id": config.GITHUB_CLIENT_ID,
        "redirect_uri": config.GITHUB_CALLBACK_URL,
        "scope": config.GITHUB_OAUTH_SCOPE,
        "state": state,
        "allow_signup": "false",
    }
    authorize_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return {"authorize_url": authorize_url}


@router.get("/callback")
async def github_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    """GitHub redirects the user's browser here after they approve/deny access."""

    def redirect_to_dashboard(result: str) -> RedirectResponse:
        return RedirectResponse(f"{config.FRONTEND_URL}/dashboard?github={result}")

    if error or not code or not state:
        return redirect_to_dashboard("error")

    db = get_firestore()
    state_ref = db.collection(STATE_COLLECTION).document(state)
    state_doc = state_ref.get()
    if not state_doc.exists:
        return redirect_to_dashboard("error")

    state_data = state_doc.to_dict()
    state_ref.delete()  # one-time use
    if time.time() - state_data.get("created_at", 0) > STATE_TTL_SECONDS:
        return redirect_to_dashboard("error")

    uid = state_data["uid"]

    try:
        access_token = await exchange_code_for_token(
            client_id=config.GITHUB_CLIENT_ID,
            client_secret=config.GITHUB_CLIENT_SECRET,
            code=code,
            redirect_uri=config.GITHUB_CALLBACK_URL,
        )
        if not access_token:
            return redirect_to_dashboard("error")
        github_username = await fetch_github_username(access_token)
    except httpx.HTTPError:
        return redirect_to_dashboard("error")

    now_iso = datetime.now(timezone.utc).isoformat()
    db.collection(TOKENS_COLLECTION).document(uid).set(
        {"encrypted_token": encrypt_token(access_token), "updated_at": now_iso}
    )
    db.collection("users").document(uid).update(
        {
            "github_connected": True,
            "github_username": github_username,
            "github_connected_at": now_iso,
        }
    )

    return redirect_to_dashboard("connected")
