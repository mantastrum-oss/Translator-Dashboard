import time
from threading import Lock

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.auth import check_password, issue_session_token, login_configured

router = APIRouter(prefix="/api/auth", tags=["auth"])

# One owner logs in, so a global limit is enough and works behind Render's proxy
# (client IPs there are the proxy's unless forwarded headers are trusted).
_MAX_ATTEMPTS_PER_MINUTE = 10
_lock = Lock()
_attempts: list[float] = []


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_at: int


def _too_many_attempts() -> bool:
    now = time.monotonic()
    with _lock:
        _attempts[:] = [moment for moment in _attempts if now - moment < 60]
        _attempts.append(now)
        return len(_attempts) > _MAX_ATTEMPTS_PER_MINUTE


def reset_login_attempts() -> None:
    with _lock:
        _attempts.clear()


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    if not login_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Login is not configured")
    if _too_many_attempts():
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts")
    if not check_password(body.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong password")
    token, expires_at = issue_session_token()
    return LoginResponse(token=token, expires_at=expires_at)
