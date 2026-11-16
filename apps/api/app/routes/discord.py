import re

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import get_settings
from app.services.discord_users import DiscordUser, get_user_cache

router = APIRouter(prefix="/api/discord", tags=["discord"])

MAX_IDS = 100
_snowflake = re.compile(r"^\d{17,20}$")


class DiscordUsersResponse(BaseModel):
    available: bool
    users: dict[str, DiscordUser | None]


@router.get("/users", response_model=DiscordUsersResponse)
def discord_users(ids: str = Query(max_length=MAX_IDS * 21, description="Comma-separated Discord user IDs")) -> DiscordUsersResponse:
    """Username and avatar for the user IDs on screen (owner-only; kept in memory, never stored)."""
    wanted = list(dict.fromkeys(part.strip() for part in ids.split(",") if part.strip()))
    if len(wanted) > MAX_IDS or any(not _snowflake.match(user_id) for user_id in wanted):
        raise HTTPException(status_code=422, detail=f"Up to {MAX_IDS} Discord user IDs")
    cache = get_user_cache(get_settings().discord_token)
    if cache is None:
        return DiscordUsersResponse(available=False, users={})
    return DiscordUsersResponse(available=True, users=cache.lookup(wanted))
