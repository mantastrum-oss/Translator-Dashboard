"""Authentication.

- The bot sends analytics and heartbeats with the analytics key (`X-API-Key`).
- The dashboard logs in with a password and gets a signed, expiring session
  token (`Authorization: Bearer …`). No secret is ever shipped to the browser.
"""

import base64
import hashlib
import hmac
import json
import time

from fastapi import Header, HTTPException, status

from app.config import get_settings


def require_analytics_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    settings = get_settings()
    expected = settings.analytics_api_key or settings.api_key
    if not expected or not x_api_key or not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _sign(payload: str, secret: str) -> str:
    return _b64(hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest())


def login_configured() -> bool:
    settings = get_settings()
    return bool(settings.dashboard_password and settings.session_secret)


def check_password(password: str) -> bool:
    settings = get_settings()
    if not login_configured():
        return False
    return hmac.compare_digest(password.encode("utf-8"), settings.dashboard_password.encode("utf-8"))


def issue_session_token(now: float | None = None) -> tuple[str, int]:
    """Returns (token, expires_at as a Unix timestamp)."""
    settings = get_settings()
    expires_at = int((now if now is not None else time.time()) + settings.session_ttl_hours * 3600)
    payload = _b64(json.dumps({"exp": expires_at}, separators=(",", ":")).encode("utf-8"))
    return f"{payload}.{_sign(payload, settings.session_secret)}", expires_at


def verify_session_token(token: str, now: float | None = None) -> bool:
    settings = get_settings()
    if not settings.session_secret or token.count(".") != 1:
        return False
    payload, signature = token.split(".")
    if not hmac.compare_digest(signature.encode("utf-8"), _sign(payload, settings.session_secret).encode("utf-8")):
        return False
    try:
        expires_at = int(json.loads(_unb64(payload))["exp"])
    except (ValueError, KeyError, TypeError):
        return False
    return (now if now is not None else time.time()) < expires_at


def require_dashboard_auth(authorization: str | None = Header(default=None)) -> None:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not verify_session_token(token.strip()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
