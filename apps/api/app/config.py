from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


_parents = Path(__file__).resolve().parents
ROOT_ENV_FILE = (_parents[3] if len(_parents) > 3 else _parents[-1]) / ".env"

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://translator:translator@localhost:5432/translator_analytics"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    analytics_api_key: str = ""
    dashboard_password: str = ""
    session_secret: str = ""
    session_ttl_hours: int = 168
    # Must match the bot's USER_MONTHLY_CHARACTER_LIMIT.
    free_monthly_chars: int = 15000
    # The bot token, only to look up usernames and avatars (GET /users/{id}). Optional.
    discord_token: str = ""
    api_key: str = ""
    app_env: str = "development"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"
    analytics_rate_limit_per_minute: int = 120

    model_config = SettingsConfigDict(
        env_file=ROOT_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def environment_label(self) -> str:
        return "Production" if self.app_env.lower() in {"production", "prod"} else "Development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
