"""In-memory fixed-window rate limiter for the analytics ingest endpoint.

Scoped per API key (falling back to client IP) so a single abusive caller
cannot exhaust ingestion capacity for everyone else. Single-process only —
if the API runs with multiple workers/replicas, back this with a shared
store (e.g. Redis) instead.
"""

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status

from app.config import get_settings

_WINDOW_SECONDS = 60
_lock = Lock()
_counters: dict[str, tuple[float, int]] = defaultdict(lambda: (0.0, 0))


def _client_key(request: Request) -> str:
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"key:{api_key}"
    client_host = request.client.host if request.client else "unknown"
    return f"ip:{client_host}"


def enforce_analytics_rate_limit(request: Request) -> None:
    settings = get_settings()
    limit = settings.analytics_rate_limit_per_minute
    if limit <= 0:
        return

    key = _client_key(request)
    now = time.monotonic()
    with _lock:
        window_start, count = _counters[key]
        if now - window_start >= _WINDOW_SECONDS:
            window_start, count = now, 0
        count += 1
        _counters[key] = (window_start, count)
        if count > limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests")
