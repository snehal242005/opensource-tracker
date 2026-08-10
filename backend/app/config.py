import os

from dotenv import load_dotenv

# Load backend/.env explicitly by path, and override=True so a stray
# OS-level env var of the same name (e.g. left over from earlier manual
# `$env:GITHUB_CLIENT_ID = ...` testing, or a Windows user/system env var)
# can never silently shadow what's in the file -- .env is always the source
# of truth for this project.
_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=_ENV_PATH, override=True)

GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
GITHUB_CALLBACK_URL = os.environ.get("GITHUB_CALLBACK_URL", "http://localhost:8001/auth/github/callback")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
TOKEN_ENCRYPTION_KEY = os.environ.get("TOKEN_ENCRYPTION_KEY", "")

# read:user is the minimal scope that reliably resolves the caller's GitHub
# login. We deliberately do NOT request `repo` (full read/write on private
# repos) or `public_repo` (write on public repos) — PR data is fetched via
# the public Search API, which needs no special scope at all. See README.
GITHUB_OAUTH_SCOPE = "read:user"


def github_oauth_configured() -> bool:
    return bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)
