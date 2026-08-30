"""add index for rate-limited event lookups

Revision ID: 0003_add_rate_limited_index
Revises: 0002_create_blocked_users
"""

from collections.abc import Sequence

from alembic import op


revision: str = "0003_add_rate_limited_index"
down_revision: str | None = "0002_create_blocked_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "idx_events_error_code_created_at_user",
        "translation_events",
        ["error_code", "created_at", "user_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_events_error_code_created_at_user", table_name="translation_events")
