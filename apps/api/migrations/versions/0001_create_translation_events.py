"""create translation events

Revision ID: 0001_create_translation_events
Revises:
Create Date: 2026-08-12 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0001_create_translation_events"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "translation_events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("guild_id", sa.Text(), nullable=True),
        sa.Column("channel_id", sa.Text(), nullable=True),
        sa.Column("user_id", sa.Text(), nullable=False),
        sa.Column("target_lang", sa.Text(), nullable=True),
        sa.Column("char_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("error_code", sa.Text(), nullable=True),
        sa.Column("ingested_at_utc", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("char_count >= 0", name="ck_translation_events_char_count_non_negative"),
    )

    op.create_index("idx_events_created_at", "translation_events", ["created_at"])
    op.create_index("idx_events_month_user", "translation_events", ["created_at", "user_id"])
    op.create_index("idx_events_month_guild", "translation_events", ["created_at", "guild_id"])
    op.create_index("idx_events_success", "translation_events", ["success"])
    op.create_index("idx_events_source", "translation_events", ["source"])


def downgrade() -> None:
    op.drop_index("idx_events_source", table_name="translation_events")
    op.drop_index("idx_events_success", table_name="translation_events")
    op.drop_index("idx_events_month_guild", table_name="translation_events")
    op.drop_index("idx_events_month_user", table_name="translation_events")
    op.drop_index("idx_events_created_at", table_name="translation_events")
    op.drop_table("translation_events")
