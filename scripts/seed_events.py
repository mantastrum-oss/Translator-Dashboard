import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "apps" / "api"
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.models import TranslationEvent


def seed() -> None:
    database_url = os.getenv(
        "DATABASE_URL", "postgresql+psycopg://translator:translator@localhost:5432/translator_analytics"
    )
    engine = create_engine(database_url)

    now = datetime.now(timezone.utc)
    sources = ["button", "context_menu", "language_select_button"]
    langs = ["es", "fr", "de", "ja", "pt-BR"]
    errors = [None, "RATE_LIMIT", "UPSTREAM_TIMEOUT", "LANG_UNAVAILABLE"]

    rows = []
    for i in range(500):
        created = now - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))
        success = random.random() > 0.12
        rows.append(
            TranslationEvent(
                created_at_utc=created,
                source=random.choice(sources),
                guild_id=f"guild-{random.randint(1, 30)}",
                channel_id=f"channel-{random.randint(1, 200)}",
                user_id=f"user-{random.randint(1, 100)}",
                target_lang=random.choice(langs),
                char_count=random.randint(10, 600),
                success=success,
                error_code=None if success else random.choice(errors[1:]),
            )
        )

    with Session(engine) as session:
        session.add_all(rows)
        session.commit()

    print("Seeded 500 translation_events rows")


if __name__ == "__main__":
    seed()
