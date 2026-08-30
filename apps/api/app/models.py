from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TranslationEvent(Base):
    __tablename__ = "translation_events"
    __table_args__ = (
        CheckConstraint("char_count >= 0", name="ck_translation_events_char_count_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    created_at_utc: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    guild_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    channel_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[str] = mapped_column(Text, nullable=False)
    target_lang: Mapped[str | None] = mapped_column(Text, nullable=True)
    char_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error_code: Mapped[str | None] = mapped_column(Text, nullable=True)


class BlockedUser(Base):
    __tablename__ = "blocked_users"

    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    blocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
