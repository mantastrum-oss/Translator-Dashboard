from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.config import get_settings
from app.schemas import BillingResponse, MonthParam, DashboardErrorsResponse, DashboardSummaryResponse, GuildsResponse, PaginatedUsersResponse, RateLimitAbusersResponse, SourcesResponse, TimeseriesResponse, TopAbusersResponse
from app.services.billing_service import billing_for_month
from app.services.metrics_service import MetricsService
from app.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _dates(start: date | None, end: date | None) -> tuple[date, date]:
    resolved_end = end or date.today()
    resolved_start = start or (resolved_end - timedelta(days=29))
    if resolved_start > resolved_end:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="start must be on or before end")
    return resolved_start, resolved_end


@router.get("/summary", response_model=DashboardSummaryResponse)
def summary(start: date | None = None, end: date | None = None, guild_id: str | None = Query(default=None, max_length=128), db: Session = Depends(get_db)):
    return MetricsService(db).dashboard_summary(*_dates(start, end), guild_id)


@router.get("/timeseries", response_model=TimeseriesResponse)
def timeseries(start: date | None = None, end: date | None = None, guild_id: str | None = Query(default=None, max_length=128), db: Session = Depends(get_db)):
    return MetricsService(db).dashboard_timeseries(*_dates(start, end), guild_id)


@router.get("/languages", response_model=SourcesResponse)
def languages(start: date | None = None, end: date | None = None, guild_id: str | None = Query(default=None, max_length=128), db: Session = Depends(get_db)):
    return MetricsService(db).dashboard_languages(*_dates(start, end), guild_id)


@router.get("/errors", response_model=DashboardErrorsResponse)
def errors(start: date | None = None, end: date | None = None, guild_id: str | None = Query(default=None, max_length=128), db: Session = Depends(get_db)):
    return MetricsService(db).dashboard_errors(*_dates(start, end), guild_id)


@router.get("/guilds", response_model=GuildsResponse)
def guilds(
    start: date | None = None,
    end: date | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    q: str | None = Query(default=None, max_length=32, description="Part of a server ID; searches every server, not one page"),
    db: Session = Depends(get_db),
):
    resolved_start, resolved_end = _dates(start, end)
    return MetricsService(db).dashboard_guilds(resolved_start, resolved_end, page, page_size, (q or "").strip() or None)


@router.get("/users", response_model=PaginatedUsersResponse)
def users(
    start: date | None = None,
    end: date | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    q: str | None = Query(default=None, max_length=32, description="Part of a user ID; searches every user, not one page"),
    db: Session = Depends(get_db),
):
    resolved_start, resolved_end = _dates(start, end)
    return MetricsService(db).dashboard_users(resolved_start, resolved_end, page, page_size, (q or "").strip() or None)


@router.get("/rate-limit-abusers", response_model=RateLimitAbusersResponse)
def rate_limit_abusers(
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    resolved_start, resolved_end = _dates(start, end)
    return MetricsService(db).dashboard_rate_limit_abusers(resolved_start, resolved_end, limit)


@router.get("/top-abusers", response_model=TopAbusersResponse)
def top_abusers(
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    resolved_start, resolved_end = _dates(start, end)
    return MetricsService(db).dashboard_top_abusers(resolved_start, resolved_end, limit)


@router.get("/billing", response_model=BillingResponse)
def billing(month: MonthParam) -> BillingResponse:
    """Packs sold (revenue) and users who used up the free allowance, for one UTC month."""
    return billing_for_month(get_supabase_admin_client(), month, get_settings().free_monthly_chars)
