import json
import os

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "firebase-admin-key.json",
)
SERVICE_ACCOUNT_ENV_VAR = "FIREBASE_ADMIN_KEY_JSON"

_firebase_app = None
_firestore_client = None
init_error: str | None = None


def _friendly_error(detail: str) -> str:
    return (
        "Firebase Admin SDK is not configured correctly.\n"
        f"Set the {SERVICE_ACCOUNT_ENV_VAR} environment variable to the full "
        "service account JSON (recommended for deployments like Render), or "
        f"place the key file at: {SERVICE_ACCOUNT_PATH}\n"
        "Go to Firebase Console > Project Settings > Service Accounts > "
        "Generate new private key, then save the downloaded file as "
        "backend/firebase-admin-key.json (see README.md for details).\n"
        f"Details: {detail}"
    )


def _load_credentials() -> credentials.Certificate:
    """Load service account credentials, preferring the env var over the local file."""
    raw_json = os.environ.get(SERVICE_ACCOUNT_ENV_VAR)
    if raw_json:
        try:
            key_data = json.loads(raw_json)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{SERVICE_ACCOUNT_ENV_VAR} is not valid JSON: {exc}") from exc
        return credentials.Certificate(key_data)

    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        raise FileNotFoundError(
            f"No {SERVICE_ACCOUNT_ENV_VAR} env var set and no file found at "
            f"{SERVICE_ACCOUNT_PATH}."
        )
    return credentials.Certificate(SERVICE_ACCOUNT_PATH)


def init_firebase() -> None:
    """Initialize the Firebase Admin SDK. Safe to call multiple times.

    Never raises: on failure it records init_error so routes can return a
    clear 500 instead of the whole app crashing on startup.
    """
    global _firebase_app, _firestore_client, init_error

    if _firebase_app is not None:
        return

    try:
        cred = _load_credentials()
        _firebase_app = firebase_admin.initialize_app(cred)
        _firestore_client = firestore.client()
        init_error = None
    except Exception as exc:  # noqa: BLE001 - surface any init failure as a friendly message
        _firebase_app = None
        _firestore_client = None
        init_error = _friendly_error(str(exc))


def is_ready() -> bool:
    return _firebase_app is not None


def get_firestore():
    if _firestore_client is None:
        raise RuntimeError(init_error or "Firebase has not been initialized yet.")
    return _firestore_client


def get_firebase_auth():
    if _firebase_app is None:
        raise RuntimeError(init_error or "Firebase has not been initialized yet.")
    return firebase_auth
