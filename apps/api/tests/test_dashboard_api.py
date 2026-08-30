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