"""create blocked users

Revision ID: 0002_create_blocked_users
Revises: 0001_create_translation_events
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0002_create_blocked_users"
down_revision: str | None = "0001_create_translation_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "blocked_users",
        sa.Column("user_id", sa.Text(), primary_key=True),
        sa.Column("blocked_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_blocked_users_blocked_at", "blocked_users", ["blocked_at"])


def downgrade() -> None:
    op.drop_index("idx_blocked_users_blocked_at", table_name="blocked_users")
    op.drop_table("blocked_users")