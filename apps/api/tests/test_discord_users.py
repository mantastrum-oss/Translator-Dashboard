from app.services import discord_users
from app.services.discord_users import DiscordUserCache, avatar_url

ALICE = "123456789012345678"
GONE = "223456789012345678"


class FakeDiscord:
    def __init__(self, responses):
        self.responses = responses
        self.calls = []

    def __call__(self, user_id):
        self.calls.append(user_id)
        return self.responses[user_id]


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def test_profiles_are_cached_for_a_day():
    fake = FakeDiscord({ALICE: (200, {"username": "alice", "global_name": "Alice", "avatar": "abc"})})
    clock = Clock()
    cache = DiscordUserCache(fake, clock)

    first = cache.lookup([ALICE])[ALICE]
    assert first.display_name == "Alice"
    assert first.username == "alice"
    assert first.avatar_url == f"https://cdn.discordapp.com/avatars/{ALICE}/abc.png?size=64"

    clock.now += 23 * 3600
    cache.lookup([ALICE])
    assert fake.calls == [ALICE]

    clock.now += 2 * 3600
    cache.lookup([ALICE])
    assert fake.calls == [ALICE, ALICE]


def test_unknown_users_and_errors_return_none():
    fake = FakeDiscord({GONE: (404, None), ALICE: (429, None)})
    clock = Clock()
    cache = DiscordUserCache(fake, clock)
    assert cache.lookup([GONE, ALICE]) == {GONE: None, ALICE: None}

    # A rate-limited lookup is retried after a few minutes, a missing user is not.
    clock.now += 6 * 60
    cache.lookup([GONE, ALICE])
    assert fake.calls.count(GONE) == 1
    assert fake.calls.count(ALICE) == 2


def test_display_name_falls_back_to_username_and_default_avatar():
    fake = FakeDiscord({ALICE: (200, {"username": "alice", "global_name": None, "avatar": None})})
    profile = DiscordUserCache(fake).lookup([ALICE])[ALICE]
    assert profile.display_name == "alice"
    assert profile.avatar_url == avatar_url(ALICE, None)
    assert profile.avatar_url.startswith("https://cdn.discordapp.com/embed/avatars/")


def test_endpoint_requires_a_session(client):
    assert client.get("/api/discord/users", params={"ids": ALICE}).status_code == 401


def test_endpoint_without_token_shows_ids_only(client, api_key, monkeypatch):
    monkeypatch.setattr("app.routes.discord.get_user_cache", lambda token: None)
    response = client.get("/api/discord/users", params={"ids": ALICE}, headers=api_key)
    assert response.status_code == 200
    assert response.json() == {"available": False, "users": {}}


def test_endpoint_returns_profiles(client, api_key, monkeypatch):
    cache = DiscordUserCache(FakeDiscord({ALICE: (200, {"username": "alice", "global_name": "Alice", "avatar": None}), GONE: (404, None)}))
    monkeypatch.setattr("app.routes.discord.get_user_cache", lambda token: cache)
    response = client.get("/api/discord/users", params={"ids": f"{ALICE},{GONE},{ALICE}"}, headers=api_key)
    body = response.json()
    assert body["available"] is True
    assert body["users"][ALICE]["display_name"] == "Alice"
    assert body["users"][GONE] is None


def test_endpoint_rejects_bad_ids(client, api_key):
    assert client.get("/api/discord/users", params={"ids": "abc"}, headers=api_key).status_code == 422
    too_many = ",".join(str(10**17 + i) for i in range(101))
    assert client.get("/api/discord/users", params={"ids": too_many}, headers=api_key).status_code == 422


def test_cache_is_created_only_with_a_token():
    assert discord_users.get_user_cache("") is None
    assert discord_users.get_user_cache("token") is discord_users.get_user_cache("token")
