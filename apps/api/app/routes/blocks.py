from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import BlockedUser
from app.schemas import BlockUserRequest, BlockedUserRow, BlockedUsersResponse, IngestResult
from app.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/api/blocks", tags=["blocks"])
UserId = Annotated[str, Path(min_length=17, max_length=20, pattern=r"^\d{17,20}$")]


@router.post("/users", response_model=IngestResult, status_code=201)
def block_user(payload: BlockUserRequest, db: Session = Depends(get_db)) -> IngestResult:
    client = get_supabase_admin_client()
    if client is not None:
        client.table("blocked_users").upsert({"user_id": payload.user_id}).execute()
    else:
        db.merge(BlockedUser(user_id=payload.user_id))
        db.commit()
    return IngestResult(status="blocked")


@router.delete("/users/{user_id}", response_model=IngestResult)
def unblock_user(user_id: UserId, db: Session = Depends(get_db)) -> IngestResult:
    client = get_supabase_admin_client()
    if client is not None:
        client.table("blocked_users").delete().eq("user_id", user_id).execute()
    else:
        db.execute(delete(BlockedUser).where(BlockedUser.user_id == user_id))
        db.commit()
    return IngestResult(status="unblocked")


@router.get("/users", response_model=BlockedUsersResponse)
def list_blocked_users(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    db: Session = Depends(get_db),
) -> BlockedUsersResponse:
    client = get_supabase_admin_client()
    offset = (page - 1) * page_size
    if client is not None:
        count_result = client.table("blocked_users").select("user_id", count="exact").execute()
        result = client.table("blocked_users").select("user_id,blocked_at").order("blocked_at", desc=True).range(offset, offset + page_size - 1).execute()
        total = count_result.count or 0
        rows = [BlockedUserRow.model_validate(row) for row in (result.data or [])]
    else:
        total = int(db.scalar(select(func.count()).select_from(BlockedUser)) or 0)
        result = db.execute(select(BlockedUser).order_by(BlockedUser.blocked_at.desc()).offset(offset).limit(page_size))
        rows = [BlockedUserRow(user_id=row.user_id, blocked_at=row.blocked_at) for row in result.scalars()]
    return BlockedUsersResponse(rows=rows, page=page, page_size=page_size, total_rows=total)
