"""Public Discord username and avatar for user IDs shown in the dashboard.

Looked up with the bot token (GET /users/{id}) and kept in memory only, for
up to 24 hours: nothing is written to the database (privacy notice §1 and §4).
"""

import json
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

from pydantic import BaseModel

API_URL = "https://discord.com/api/v10/users/{user_id}"
CDN = "https://cdn.discordapp.com"

FOUND_TTL = 24 * 3600
MISSING_TTL = 24 * 3600  # unknown user (404)
ERROR_TTL = 5 * 60  # rate limit or network error: try again soon
MAX_ENTRIES = 5000
WORKERS = 4


class DiscordUser(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: str


Fetcher = Callable[[str], tuple[int, dict | None]]


def avatar_url(user_id: str, avatar_hash: str | None) -> str:
    if avatar_hash:
        return f"{CDN}/avatars/{user_id}/{avatar_hash}.png?size=64"
    # Discord's default avatar for accounts without one.
    return f"{CDN}/embed/avatars/{(int(user_id) >> 22) % 6}.png"


def to_profile(user_id: str, body: dict) -> DiscordUser:
    username = str(body.get("username") or user_id)
    return DiscordUser(
        id=user_id,
        username=username,
        display_name=str(body.get("global_name") or username),
        avatar_url=avatar_url(user_id, body.get("avatar")),
    )


def http_fetcher(token: str) -> Fetcher:
    def fetch(user_id: str) -> tuple[int, dict | None]:
        request = urllib.request.Request(
            API_URL.format(user_id=user_id),
            headers={"Authorization": f"Bot {token}", "User-Agent": "DiscordBot (translator-dashboard, 1.0)"},
        )
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            return error.code, None
        except (urllib.error.URLError, TimeoutError, ValueError):
            return 0, None

    return fetch


class DiscordUserCache:
    def __init__(self, fetcher: Fetcher, clock: Callable[[], float] = time.monotonic):
        self._fetch = fetcher
        self._clock = clock
        self._lock = threading.Lock()
        self._entries: dict[str, tuple[float, DiscordUser | None]] = {}

    def _cached(self, user_id: str) -> tuple[bool, DiscordUser | None]:
        entry = self._entries.get(user_id)
        if entry and entry[0] > self._clock():
            return True, entry[1]
        return False, None

    def _store(self, user_id: str, ttl: float, profile: DiscordUser | None) -> None:
        with self._lock:
            if len(self._entries) >= MAX_ENTRIES:
                now = self._clock()
                self._entries = {key: value for key, value in self._entries.items() if value[0] > now}
                if len(self._entries) >= MAX_ENTRIES:
                    self._entries.pop(next(iter(self._entries)))
            self._entries[user_id] = (self._clock() + ttl, profile)

    def _load(self, user_id: str) -> DiscordUser | None:
        status, body = self._fetch(user_id)
        if status == 200 and body is not None:
            profile = to_profile(user_id, body)
            self._store(user_id, FOUND_TTL, profile)
            return profile
        self._store(user_id, MISSING_TTL if status == 404 else ERROR_TTL, None)
        return None

    def lookup(self, user_ids: list[str]) -> dict[str, DiscordUser | None]:
        result: dict[str, DiscordUser | None] = {}
        missing: list[str] = []
        with self._lock:
            for user_id in user_ids:
                hit, profile = self._cached(user_id)
                if hit:
                    result[user_id] = profile
                else:
                    missing.append(user_id)
        if missing:
            with ThreadPoolExecutor(max_workers=WORKERS) as pool:
                for user_id, profile in zip(missing, pool.map(self._load, missing)):
                    result[user_id] = profile
        return result


_cache: DiscordUserCache | None = None
_cache_token: str | None = None
_cache_lock = threading.Lock()


def get_user_cache(token: str) -> DiscordUserCache | None:
    """One cache per process; None when no bot token is configured."""
    global _cache, _cache_token
    if not token:
        return None
    with _cache_lock:
        if _cache is None or _cache_token != token:
            _cache = DiscordUserCache(http_fetcher(token))
            _cache_token = token
        return _cache
