from datetime import datetime, timezone


def _post_event(client, headers, created_at, user, guild, chars, success, error_code=None, lang="es"):
    payload = {
        "created_at_utc": created_at.isoformat(),
        "source": "button",
        "guild_id": guild,
        "channel_id": "c1",
        "user_id": user,
        "target_lang": lang,
        "char_count": chars,
        "success": success,
        "error_code": error_code,
    }
    res = client.post("/v1/events/translation", json=payload, headers=headers)
    assert res.status_code == 202


def test_metrics_require_api_key(client):
    response = client.get("/v1/metrics/overview", params={"month": "2026-08", "tz": "UTC"})
    assert response.status_code == 401


def test_monthly_overview_and_errors(client, api_key):
    _post_event(client, api_key, datetime(2026, 8, 1, 1, 0, tzinfo=timezone.utc), "u1", "g1", 120, True)
    _post_event(client, api_key, datetime(2026, 8, 2, 1, 0, tzinfo=timezone.utc), "u2", "g2", 50, True)
    _post_event(
        client,
        api_key,
        datetime(2026, 8, 3, 1, 0, tzinfo=timezone.utc),
        "u1",
        "g1",
        20,
        False,
        error_code="RATE_LIMIT",
    )
    _post_event(
        client,
        api_key,
        datetime(2026, 7, 31, 23, 0, tzinfo=timezone.utc),
        "u9",
        "g9",
        999,
        True,
    )

    overview = client.get("/v1/metrics/overview", params={"month": "2026-08", "tz": "UTC"}, headers=api_key)
    assert overview.status_code == 200
    body = overview.json()

    assert body["month"] == "2026-08"
    assert body["timezone"] == "UTC"
    assert body["totals"]["total_events"] == 3
    assert body["totals"]["successful_events"] == 2
    assert body["totals"]["failed_events"] == 1
    assert body["totals"]["total_characters"] == 170
    assert body["totals"]["unique_users"] == 2
    assert body["totals"]["unique_servers"] == 2

    errors = client.get("/v1/metrics/errors", params={"month": "2026-08", "tz": "UTC"}, headers=api_key)
    assert errors.status_code == 200
    assert errors.json()["rows"][0]["error_code"] == "RATE_LIMIT"


def test_users_and_servers_pagination(client, api_key):
    for i in range(1, 6):
        _post_event(
            client,
            api_key,
            datetime(2026, 8, i, 1, 0, tzinfo=timezone.utc),
            user=f"u{i}",
            guild=f"g{i}",
            chars=i * 10,
            success=True,
        )

    users = client.get(
        "/v1/metrics/users",
        params={"month": "2026-08", "page": 1, "page_size": 2, "tz": "UTC"},
        headers=api_key,
    )
    assert users.status_code == 200
    users_body = users.json()
    assert users_body["total_rows"] == 5
    assert len(users_body["rows"]) == 2
    assert users_body["rows"][0]["translated_characters"] >= users_body["rows"][1]["translated_characters"]

    servers = client.get(
        "/v1/metrics/servers",
        params={"month": "2026-08", "page": 2, "page_size": 2, "tz": "UTC"},
        headers=api_key,
    )
    assert servers.status_code == 200
    servers_body = servers.json()
    assert servers_body["total_rows"] == 5
    assert len(servers_body["rows"]) == 2
