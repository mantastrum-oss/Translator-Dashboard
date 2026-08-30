import os
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://translator:translator@postgres:5432/translator_analytics",
)
os.environ.setdefault("API_KEY", "test-key")
# override so real Supabase keys in the repo .env can't leak into test auth
os.environ["ANALYTICS_API_KEY"] = "test-key"
os.environ["DASHBOARD_API_KEY"] = "test-key"
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def setup_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def clean_events_table():
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE translation_events RESTART IDENTITY"))
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def api_key() -> dict[str, str]:
    return {"X-API-Key": os.environ["API_KEY"]}


@pytest.fixture
def sample_event() -> dict:
    return {
        "created_at_utc": datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc).isoformat(),
        "source": "button",
        "guild_id": "g1",
        "channel_id": "c1",
        "user_id": "u1",
        "target_lang": "es",
        "char_count": 100,
        "success": True,
        "error_code": None,
    }
