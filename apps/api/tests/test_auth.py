import time

import pytest

from app.auth import issue_session_token, verify_session_token
from app.routes.auth import reset_login_attempts


@pytest.fixture(autouse=True)
def fresh_login_limit():
    reset_login_attempts()
    yield
    reset_login_attempts()


def test_login_with_right_password_returns_working_token(client):
    response = client.post("/api/auth/login", json={"password": "test-password"})
    assert response.status_code == 200
    token = response.json()["token"]
    assert response.json()["expires_at"] > time.time()

    overview = client.get(
        "/v1/metrics/overview",
        params={"month": "2026-08", "tz": "UTC"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert overview.status_code == 200


def test_login_with_wrong_password_is_rejected(client):
    response = client.post("/api/auth/login", json={"password": "nope"})
    assert response.status_code == 401
    assert "token" not in response.json()


def test_login_attempts_are_rate_limited(client):
    statuses = [client.post("/api/auth/login", json={"password": "nope"}).status_code for _ in range(11)]
    assert statuses[:10] == [401] * 10
    assert statuses[10] == 429


def test_analytics_key_no_longer_opens_the_dashboard(client):
    response = client.get(
        "/v1/metrics/overview",
        params={"month": "2026-08", "tz": "UTC"},
        headers={"X-API-Key": "test-key"},
    )
    assert response.status_code == 401


def test_blocking_requires_a_session(client):
    response = client.post("/api/blocks/users", json={"user_id": "123456789012345678"}, headers={"X-API-Key": "test-key"})
    assert response.status_code == 401


def test_expired_token_is_rejected():
    token, expires_at = issue_session_token(now=1_000)
    assert verify_session_token(token, now=expires_at - 1)
    assert not verify_session_token(token, now=expires_at)


@pytest.mark.parametrize("token", ["", "abc", "a.b.c", "eyJleHAiOjk5OTk5OTk5OTl9.forged", "ü.ü"])
def test_malformed_or_forged_tokens_are_rejected(token):
    assert not verify_session_token(token)


def test_tampered_expiry_is_rejected():
    token, _ = issue_session_token(now=1_000)
    _, signature = token.split(".")
    forged_payload = "eyJleHAiOjk5OTk5OTk5OTk5fQ"  # {"exp":99999999999}
    assert not verify_session_token(f"{forged_payload}.{signature}", now=2_000)
