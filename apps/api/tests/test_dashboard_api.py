from datetime import datetime, timezone


def test_dashboard_requires_authentication(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 401


def test_dashboard_summary_supports_date_and_guild_filters(client, api_key):
    payload = {
        "created_at_utc": datetime(2026, 8, 10, 12, tzinfo=timezone.utc).isoformat(),
        "source": "command",
        "guild_id": "g1",
        "channel_id": "c1",
        "user_id": "u1",
        "target_lang": "de",
        "char_count": 25,
        "success": True,
        "error_code": None,
    }
    assert client.post("/v1/events/translation", json=payload, headers=api_key).status_code == 202

    response = client.get(
        "/api/dashboard/summary",
        params={"start": "2026-08-10", "end": "2026-08-10", "guild_id": "g1"},
        headers=api_key,
    )
    assert response.status_code == 200
    assert response.json()["total_translations"] == 1
    assert response.json()["success_rate"] == 1.0


def test_rate_limit_abusers_ranks_only_rate_limited_events(client, api_key):
    events = [
        {
            "created_at_utc": datetime(2026, 8, 10, 12, tzinfo=timezone.utc).isoformat(),
            "source": "button",
            "guild_id": "g1",
            "channel_id": "c1",
            "user_id": "abuser",
            "target_lang": "de",
            "char_count": 120,
            "success": False,
            "error_code": "rate_limited",
        },
        {
            "created_at_utc": datetime(2026, 8, 11, 12, tzinfo=timezone.utc).isoformat(),
            "source": "context_menu",
            "guild_id": "g2",
            "channel_id": "c2",
            "user_id": "abuser",
            "target_lang": "de",
            "char_count": 80,
            "success": False,
            "error_code": "rate_limited",
        },
        {
            "created_at_utc": datetime(2026, 8, 10, 13, tzinfo=timezone.utc).isoformat(),
            "source": "button",
            "guild_id": "g1",
            "channel_id": "c1",
            "user_id": "normal-user",
            "target_lang": "de",
            "char_count": 25,
            "success": True,
            "error_code": None,
        },
    ]
    for event in events:
        assert client.post("/v1/events/translation", json=event, headers=api_key).status_code == 202

    response = client.get(
        "/api/dashboard/rate-limit-abusers",
        params={"start": "2026-08-01", "end": "2026-08-31", "limit": 20},
        headers=api_key,
    )
    assert response.status_code == 200
    rows = response.json()["rows"]
    assert len(rows) == 1
    assert rows[0]["user_id"] == "abuser"
    assert rows[0]["rank"] == 1
    assert rows[0]["blocked_attempts"] == 2
    assert rows[0]["attempted_characters"] == 200
    assert rows[0]["guild_count"] == 2


def test_top_abusers_ranks_by_request_count(client, api_key):
    events = [
        {
            "created_at_utc": datetime(2026, 8, 10, 12, tzinfo=timezone.utc).isoformat(),
            "source": "button",
            "guild_id": "g1",
            "channel_id": "c1",
            "user_id": "heavy-user",
            "target_lang": "de",
            "char_count": 25,
            "success": True,
            "error_code": None,
        },
        {
            "created_at_utc": datetime(2026, 8, 10, 13, tzinfo=timezone.utc).isoformat(),
            "source": "button",
            "guild_id": "g1",
            "channel_id": "c1",
            "user_id": "heavy-user",
            "target_lang": "de",
            "char_count": 0,
            "success": False,
            "error_code": "provider_error",
        },
        {
            "created_at_utc": datetime(2026, 8, 10, 14, tzinfo=timezone.utc).isoformat(),
            "source": "button",
            "guild_id": "g1",
            "channel_id": "c1",
            "user_id": "light-user",
            "target_lang": "de",
            "char_count": 25,
            "success": True,
            "error_code": None,
        },
    ]
    for event in events:
        assert client.post("/v1/events/translation", json=event, headers=api_key).status_code == 202

    response = client.get(
        "/api/dashboard/top-abusers",
        params={"start": "2026-08-01", "end": "2026-08-31", "limit": 20},
        headers=api_key,
    )
    assert response.status_code == 200
    rows = response.json()["rows"]
    assert rows[0]["user_id"] == "heavy-user"
    assert rows[0]["rank"] == 1
    assert rows[0]["request_count"] == 2
    assert rows[0]["successful_count"] == 1
    assert rows[0]["failed_count"] == 1
    assert rows[0]["success_rate"] == 0.5

def test_user_and_server_search_covers_every_page(client, api_key):
    base = {
        "created_at_utc": "2026-08-05T12:00:00+00:00",
        "source": "button",
        "channel_id": "c1",
        "target_lang": "es",
        "char_count": 10,
        "success": True,
        "error_code": None,
    }
    for index in range(30):
        event = {**base, "user_id": f"10000000000000{index:04d}", "guild_id": f"90000000000000{index:04d}", "char_count": 100 - index}
        assert client.post("/v1/events/translation", json=event, headers=api_key).status_code == 202

    # The match ranks last by characters, i.e. it is not on the first page.
    users = client.get(
        "/api/dashboard/users",
        params={"start": "2026-08-01", "end": "2026-08-31", "page": 1, "page_size": 10, "q": "0029"},
        headers=api_key,
    ).json()
    assert users["total_rows"] == 1
    assert users["rows"][0]["user_id"] == "100000000000000029"

    servers = client.get(
        "/api/dashboard/guilds",
        params={"start": "2026-08-01", "end": "2026-08-31", "page": 1, "page_size": 10, "q": "0029"},
        headers=api_key,
    ).json()
    assert servers["total_rows"] == 1
    assert servers["rows"][0]["guild_id"] == "900000000000000029"


def test_search_treats_wildcards_literally(client, api_key):
    response = client.get(
        "/api/dashboard/users",
        params={"start": "2026-08-01", "end": "2026-08-31", "q": "%"},
        headers=api_key,
    )
    assert response.status_code == 200
    assert response.json()["total_rows"] == 0
