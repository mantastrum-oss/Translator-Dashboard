from datetime import datetime, timedelta, timezone
from threading import Lock

from app.schemas import BotHeartbeatRequest, BotStatusResponse

_lock = Lock()
_latest: tuple[BotHeartbeatRequest, datetime] | None = None
_STALE_AFTER = timedelta(seconds=90)


def record_heartbeat(heartbeat: BotHeartbeatRequest) -> None:
    global _latest
    with _lock:
        _latest = (heartbeat, datetime.now(timezone.utc))


def current_status() -> BotStatusResponse:
    with _lock:
        latest = _latest
    if latest is None:
        return BotStatusResponse(status="offline", online=False, guild_count=0, started_at_utc=None, last_heartbeat_utc=None)
    heartbeat, received_at = latest
    is_fresh = datetime.now(timezone.utc) - received_at <= _STALE_AFTER
    is_online = is_fresh and heartbeat.status == "online"
    return BotStatusResponse(
        status=heartbeat.status if is_fresh else "offline",
        online=is_online,
        guild_count=heartbeat.guild_count,
        started_at_utc=heartbeat.started_at_utc,
        last_heartbeat_utc=received_at,
    )