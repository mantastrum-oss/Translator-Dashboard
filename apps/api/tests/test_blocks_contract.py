from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas import BlockUserRequest, BlockedUserRow


def test_block_request_accepts_discord_snowflake_string():
    request = BlockUserRequest(user_id="123456789012345678")
    assert request.user_id == "123456789012345678"


@pytest.mark.parametrize("user_id", ["", "123", "-123456789012345678", "123.45", "abc123", "12345678901234567890a"])
def test_block_request_rejects_malformed_ids(user_id):
    with pytest.raises(ValidationError):
        BlockUserRequest(user_id=user_id)


def test_blocked_user_response_contains_only_id_and_timestamp():
    row = BlockedUserRow(user_id="123456789012345678", blocked_at=datetime.now(timezone.utc))
    assert set(row.model_dump()) == {"user_id", "blocked_at"}