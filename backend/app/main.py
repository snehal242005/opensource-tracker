from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .firebase_config import init_firebase, is_ready
from .routers import auth, pull_requests

app = FastAPI(title="Open Source Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
