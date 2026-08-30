from sqlalchemy import text

from app.db import engine


def test_ingest_requires_api_key(client, sample_event):
    response = client.post("/v1/events/translation", json=sample_event)
    assert response.status_code == 401


def test_ingest_validation_rejects_negative_chars(client, api_key, sample_event):
    sample_event["char_count"] = -1
    response = client.post("/v1/events/translation", json=sample_event, headers=api_key)
    assert response.status_code == 422


def test_ingest_rejects_unknown_fields_and_message_content(client, api_key, sample_event):
    sample_event["message_content"] = "private message"
    response = client.post("/v1/events/translation", json=sample_event, headers=api_key)

    assert response.status_code == 422

    with engine.connect() as conn:
        row_count = conn.execute(text("SELECT COUNT(*) FROM translation_events")).scalar_one()
    assert row_count == 0


def test_ingest_accepts_event_and_persists(client, api_key, sample_event):
    response = client.post("/v1/events/translation", json=sample_event, headers=api_key)

    assert response.status_code == 202
    assert response.json() == {"status": "accepted"}

    with engine.connect() as conn:
        row_count = conn.execute(text("SELECT COUNT(*) FROM translation_events")).scalar_one()
    assert row_count == 1
