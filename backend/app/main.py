from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .firebase_config import init_firebase, is_ready
from .routers import auth, pull_requests

app = FastAPI(title="Open Source Tracker API", version="0.1.0")

# Always allow local dev, plus whatever FRONTEND_URL is set to (e.g. the
# deployed Vercel URL on Render) -- so both keep working at the same time.
# .rstrip("/") guards against a trailing slash in the env var, since the
# browser's Origin header never has one and CORSMiddleware does an exact
# string match against allow_origins.
_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
_ALLOWED_ORIGINS = list(dict.fromkeys([*_DEV_ORIGINS, config.FRONTEND_URL.rstrip("/")]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pull_requests.router)


@app.on_event("startup")
async def on_startup():
    init_firebase()


@app.get("/")
async def root():
    return {"service": "Open Source Tracker API", "status": "ok"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "firebase_configured": is_ready(),
    }
