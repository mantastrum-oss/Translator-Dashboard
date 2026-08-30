from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.db import get_db
from app.schemas import (
    ErrorsResponse,
    LanguagesResponse,
    MonthParam,
    OverviewResponse,
    PaginatedServersResponse,
    PaginatedUsersResponse,
)
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/v1/metrics", tags=["metrics"])


def _validated_tz(tz: str) -> str:
    try:
        ZoneInfo(tz)
    except ZoneInfoNotFoundError as exc:
        raise HTTPException(status_code=422, detail="Invalid timezone") from exc
    return tz


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    month: MonthParam,
    tz: str = "UTC",
    db: Session = Depends(get_db),
) -> OverviewResponse:
    return MetricsService(db).overview(month=month, tz=_validated_tz(tz))


@router.get("/users", response_model=PaginatedUsersResponse)
def get_users(
    month: MonthParam,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    tz: str = "UTC",
    db: Session = Depends(get_db),
) -> PaginatedUsersResponse:
    return MetricsService(db).users(month=month, tz=_validated_tz(tz), page=page, page_size=page_size)


@router.get("/servers", response_model=PaginatedServersResponse)
def get_servers(
    month: MonthParam,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    tz: str = "UTC",
    db: Session = Depends(get_db),
) -> PaginatedServersResponse:
    return MetricsService(db).servers(month=month, tz=_validated_tz(tz), page=page, page_size=page_size)


@router.get("/errors", response_model=ErrorsResponse)
def get_errors(month: MonthParam, tz: str = "UTC", db: Session = Depends(get_db)) -> ErrorsResponse:
    return MetricsService(db).errors(month=month, tz=_validated_tz(tz))


@router.get("/languages", response_model=LanguagesResponse)
def get_languages(month: MonthParam, tz: str = "UTC", db: Session = Depends(get_db)) -> LanguagesResponse:
    return MetricsService(db).languages(month=month, tz=_validated_tz(tz))
