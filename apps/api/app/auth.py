from fastapi import Header, HTTPException, status

from app.config import get_settings


def require_analytics_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    settings = get_settings()
    if not x_api_key or x_api_key != (settings.analytics_api_key or settings.api_key or settings.dashboard_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def require_dashboard_auth(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    settings = get_settings()
    if not x_api_key or x_api_key != (settings.dashboard_api_key or settings.analytics_api_key or settings.api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
