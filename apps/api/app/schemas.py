from datetime import date, datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, field_validator


class TranslationEventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    created_at_utc: datetime
    source: str = Field(min_length=1, max_length=64)
    guild_id: str | None = Field(default=None, max_length=128)
    channel_id: str | None = Field(default=None, max_length=128)
    user_id: str = Field(min_length=1, max_length=128)
    target_lang: str | None = Field(default=None, max_length=32)
    char_count: StrictInt = Field(ge=0, le=10_000_000)
    success: StrictBool
    error_code: str | None = Field(default=None, max_length=128)

    @field_validator("created_at_utc")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("created_at_utc must include a timezone")
        return value.astimezone(timezone.utc)


class IngestResult(BaseModel):
    status: str


class BotHeartbeatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["starting", "online", "degraded", "shutting_down", "offline"]
    event_type: Literal["heartbeat"]
    guild_count: StrictInt = Field(ge=0, le=1_000_000)
    started_at_utc: datetime

    @field_validator("started_at_utc")
    @classmethod
    def require_heartbeat_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("started_at_utc must include a timezone")
        return value.astimezone(timezone.utc)


class BotStatusResponse(BaseModel):
    status: str
    online: bool
    guild_count: int
    started_at_utc: datetime | None
    last_heartbeat_utc: datetime | None


class BlockUserRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: str = Field(min_length=17, max_length=20, pattern=r"^\d{17,20}$")


class BlockedUserRow(BaseModel):
    user_id: str
    blocked_at: datetime


class BlockedUsersResponse(BaseModel):
    rows: list[BlockedUserRow]
    page: int
    page_size: int
    total_rows: int


MonthParam = Annotated[str, Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")]


class OverviewTotals(BaseModel):
    total_events: int
    successful_events: int
    failed_events: int
    success_rate: float
    total_characters: int
    unique_users: int
    unique_servers: int


class OverviewResponse(BaseModel):
    month: str
    timezone: str
    generated_at: datetime
    totals: OverviewTotals


class UserRow(BaseModel):
    user_id: str
    translated_characters: int
    successful_events: int
    failed_events: int


class ServerRow(BaseModel):
    guild_id: str
    translated_characters: int
    successful_events: int
    failed_events: int


class ErrorRow(BaseModel):
    error_code: str
    count: int


class LanguageRow(BaseModel):
    target_lang: str
    successful_characters: int


class PaginatedUsersResponse(BaseModel):
    month: str
    timezone: str
    page: int
    page_size: int
    total_rows: int
    rows: list[UserRow]


class PaginatedServersResponse(BaseModel):
    month: str
    timezone: str
    page: int
    page_size: int
    total_rows: int
    rows: list[ServerRow]


class ErrorsResponse(BaseModel):
    month: str
    timezone: str
    generated_at: datetime
    rows: list[ErrorRow]


class LanguagesResponse(BaseModel):
    month: str
    timezone: str
    generated_at: datetime
    rows: list[LanguageRow]


class DashboardRange(BaseModel):
    start: date
    end: date
    guild_id: str | None = None


class DashboardSummaryResponse(BaseModel):
    start: date
    end: date
    guild_id: str | None = None
    generated_at: datetime
    total_translations: int
    successful_translations: int
    failed_translations: int
    total_characters: int
    success_rate: float
    unique_users: int
    unique_guilds: int


class TimeseriesRow(BaseModel):
    date: date
    total: int
    successful: int
    failed: int
    characters: int


class TimeseriesResponse(BaseModel):
    start: date
    end: date
    rows: list[TimeseriesRow]


class SourceRow(BaseModel):
    source: str
    count: int


class SourcesResponse(BaseModel):
    start: date
    end: date
    rows: list[SourceRow]


class DashboardErrorsResponse(BaseModel):
    start: date
    end: date
    rows: list[ErrorRow]


class GuildRow(BaseModel):
    guild_id: str
    translations: int
    successful: int
    characters: int


class GuildsResponse(BaseModel):
    start: date
    end: date
    rows: list[GuildRow]


class MetricsQuery(BaseModel):
    month: MonthParam
    tz: str = "UTC"

    @field_validator("tz")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        from zoneinfo import ZoneInfo

        ZoneInfo(value)
        return value
