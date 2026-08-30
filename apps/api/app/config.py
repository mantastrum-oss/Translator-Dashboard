from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://translator:translator@localhost:5432/translator_analytics"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    analytics_api_key: str = ""
    dashboard_api_key: str = ""
    api_key: str = ""
    app_env: str = "development"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"

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
