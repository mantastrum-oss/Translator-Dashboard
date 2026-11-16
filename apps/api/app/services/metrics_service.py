from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import case, cast, Date, func, select
from sqlalchemy.orm import Session

from app.models import TranslationEvent
from app.schemas import (
    ErrorRow,
    ErrorsResponse,
    LanguageRow,
    LanguagesResponse,
    OverviewResponse,
    OverviewTotals,
    PaginatedServersResponse,
    PaginatedUsersResponse,
    ServerRow,
    UserRow,
    DashboardErrorsResponse,
    DashboardSummaryResponse,
    GuildRow,
    GuildsResponse,
    RateLimitAbuserRow,
    RateLimitAbusersResponse,
    SourceRow,
    SourcesResponse,
    TimeseriesResponse,
    TimeseriesRow,
    TopAbuserRow,
    TopAbusersResponse,
)
from app.utils.time import month_bounds_utc, now_utc


class MetricsService:
    def __init__(self, db: Session):
        self.db = db

    def _range(self, month: str, tz: str):
        return month_bounds_utc(month, tz)

    def _dashboard_filter(self, start: date, end: date, guild_id: str | None):
        start_utc = datetime.combine(start, time.min, tzinfo=timezone.utc)
        end_utc = datetime.combine(end + timedelta(days=1), time.min, tzinfo=timezone.utc)
        filters = [TranslationEvent.created_at_utc >= start_utc, TranslationEvent.created_at_utc < end_utc]
        if guild_id:
            filters.append(TranslationEvent.guild_id == guild_id)
        return filters

    def dashboard_summary(self, start: date, end: date, guild_id: str | None) -> DashboardSummaryResponse:
        filters = self._dashboard_filter(start, end, guild_id)
        stmt = select(
            func.count(TranslationEvent.id),
            func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)),
            func.sum(case((TranslationEvent.success.is_(False), 1), else_=0)),
            func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)),
            func.count(func.distinct(TranslationEvent.user_id)),
            func.count(func.distinct(TranslationEvent.guild_id)),
        ).where(*filters)
        total, successful, failed, characters, users, guilds = self.db.execute(stmt).one()
        total = int(total or 0)
        successful = int(successful or 0)
        return DashboardSummaryResponse(
            start=start, end=end, guild_id=guild_id, generated_at=now_utc(),
            total_translations=total, successful_translations=successful,
            failed_translations=int(failed or 0), total_characters=int(characters or 0),
            success_rate=round(successful / total, 4) if total else 0.0,
            unique_users=int(users or 0), unique_guilds=int(guilds or 0),
        )

    def dashboard_timeseries(self, start: date, end: date, guild_id: str | None) -> TimeseriesResponse:
        filters = self._dashboard_filter(start, end, guild_id)
        day = cast(TranslationEvent.created_at_utc, Date).label("date")
        stmt = select(
            day, func.count(TranslationEvent.id).label("total"),
            func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)).label("successful"),
            func.sum(case((TranslationEvent.success.is_(False), 1), else_=0)).label("failed"),
            func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).label("characters"),
        ).where(*filters).group_by(day).order_by(day)
        rows = [TimeseriesRow(date=row.date, total=int(row.total or 0), successful=int(row.successful or 0), failed=int(row.failed or 0), characters=int(row.characters or 0)) for row in self.db.execute(stmt)]
        return TimeseriesResponse(start=start, end=end, rows=rows)

    def dashboard_languages(self, start: date, end: date, guild_id: str | None) -> SourcesResponse:
        filters = self._dashboard_filter(start, end, guild_id) + [TranslationEvent.success.is_(True)]
        stmt = select(TranslationEvent.target_lang.label("source"), func.count(TranslationEvent.id).label("count")).where(*filters).group_by(TranslationEvent.target_lang).order_by(func.count(TranslationEvent.id).desc())
        rows = [SourceRow(source=row.source or "unknown", count=int(row.count or 0)) for row in self.db.execute(stmt)]
        return SourcesResponse(start=start, end=end, rows=rows)

    def dashboard_errors(self, start: date, end: date, guild_id: str | None) -> DashboardErrorsResponse:
        filters = self._dashboard_filter(start, end, guild_id) + [TranslationEvent.success.is_(False)]
        error = func.coalesce(func.nullif(TranslationEvent.error_code, ""), "unknown")
        stmt = select(error.label("error_code"), func.count(TranslationEvent.id).label("count")).where(*filters).group_by(error).order_by(func.count(TranslationEvent.id).desc())
        return DashboardErrorsResponse(start=start, end=end, rows=[ErrorRow(error_code=row.error_code, count=int(row.count or 0)) for row in self.db.execute(stmt)])

    def dashboard_guilds(self, start: date, end: date, page: int, page_size: int, q: str | None = None) -> GuildsResponse:
        filters = self._dashboard_filter(start, end, None) + [TranslationEvent.guild_id.is_not(None)]
        if q:
            filters.append(TranslationEvent.guild_id.contains(q, autoescape=True))
        stmt = select(
            TranslationEvent.guild_id, func.count(TranslationEvent.id).label("translations"),
            func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)).label("successful"),
            func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).label("characters"),
        ).where(*filters).group_by(TranslationEvent.guild_id).order_by(func.count(TranslationEvent.id).desc())
        total_rows = int(self.db.execute(select(func.count()).select_from(stmt.with_only_columns(TranslationEvent.guild_id).order_by(None).subquery())).scalar_one())
        rows_stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = [GuildRow(guild_id=str(row.guild_id), translations=int(row.translations or 0), successful=int(row.successful or 0), characters=int(row.characters or 0)) for row in self.db.execute(rows_stmt)]
        return GuildsResponse(start=start, end=end, page=page, page_size=page_size, total_rows=total_rows, rows=rows)

    def dashboard_rate_limit_abusers(self, start: date, end: date, limit: int) -> RateLimitAbusersResponse:
        filters = self._dashboard_filter(start, end, None) + [TranslationEvent.error_code == "rate_limited"]
        stmt = (
            select(
                TranslationEvent.user_id,
                func.count(TranslationEvent.id).label("blocked_attempts"),
                func.sum(TranslationEvent.char_count).label("attempted_characters"),
                func.count(func.distinct(TranslationEvent.guild_id)).filter(TranslationEvent.guild_id.is_not(None)).label("guild_count"),
                func.min(TranslationEvent.created_at_utc).label("first_blocked_at"),
                func.max(TranslationEvent.created_at_utc).label("last_blocked_at"),
            )
            .where(*filters)
            .group_by(TranslationEvent.user_id)
            .order_by(func.count(TranslationEvent.id).desc(), func.max(TranslationEvent.created_at_utc).desc())
            .limit(limit)
        )
        rows = [
            RateLimitAbuserRow(
                rank=index + 1,
                user_id=row.user_id,
                blocked_attempts=int(row.blocked_attempts or 0),
                attempted_characters=int(row.attempted_characters or 0),
                guild_count=int(row.guild_count or 0),
                first_blocked_at=row.first_blocked_at,
                last_blocked_at=row.last_blocked_at,
            )
            for index, row in enumerate(self.db.execute(stmt))
        ]
        return RateLimitAbusersResponse(start=start, end=end, rows=rows)

    def dashboard_top_abusers(self, start: date, end: date, limit: int) -> TopAbusersResponse:
        filters = self._dashboard_filter(start, end, None)
        stmt = (
            select(
                TranslationEvent.user_id,
                func.count(TranslationEvent.id).label("request_count"),
                func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)).label("successful_count"),
                func.sum(case((TranslationEvent.success.is_(False), 1), else_=0)).label("failed_count"),
            )
            .where(*filters)
            .group_by(TranslationEvent.user_id)
            .order_by(func.count(TranslationEvent.id).desc())
            .limit(limit)
        )
        rows = []
        for index, row in enumerate(self.db.execute(stmt)):
            request_count = int(row.request_count or 0)
            successful_count = int(row.successful_count or 0)
            failed_count = int(row.failed_count or 0)
            rows.append(
                TopAbuserRow(
                    rank=index + 1,
                    user_id=row.user_id,
                    request_count=request_count,
                    successful_count=successful_count,
                    failed_count=failed_count,
                    success_rate=round(successful_count / request_count, 4) if request_count else 0.0,
                )
            )
        return TopAbusersResponse(start=start, end=end, rows=rows)

    def dashboard_users(self, start: date, end: date, page: int, page_size: int, q: str | None = None) -> PaginatedUsersResponse:
        filters = self._dashboard_filter(start, end, None)
        if q:
            filters.append(TranslationEvent.user_id.contains(q, autoescape=True))
        base = (
            select(
                TranslationEvent.user_id.label("user_id"),
                func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).label("translated_characters"),
                func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)).label("successful_events"),
                func.sum(case((TranslationEvent.success.is_(False), 1), else_=0)).label("failed_events"),
            ).where(*filters).group_by(TranslationEvent.user_id)
        )
        total_rows = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        rows_stmt = base.order_by(
            func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).desc()
        ).offset((page - 1) * page_size).limit(page_size)
        rows = [
            UserRow(
                user_id=row.user_id,
                translated_characters=int(row.translated_characters or 0),
                successful_events=int(row.successful_events or 0),
                failed_events=int(row.failed_events or 0),
            )
            for row in self.db.execute(rows_stmt)
        ]
        return PaginatedUsersResponse(
            month=f"{start:%Y-%m}-{end:%d}", timezone="UTC", page=page,
            page_size=page_size, total_rows=total_rows, rows=rows,
        )

    def overview(self, month: str, tz: str) -> OverviewResponse:
        start_utc, end_utc = self._range(month, tz)

        stmt = select(
            func.count(TranslationEvent.id),
            func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)),
            func.sum(case((TranslationEvent.success.is_(False), 1), else_=0)),
            func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)),
            func.count(func.distinct(TranslationEvent.user_id)),
            func.count(func.distinct(TranslationEvent.guild_id)),
        ).where(
            TranslationEvent.created_at_utc >= start_utc,
            TranslationEvent.created_at_utc < end_utc,
        )

        total, successful, failed, chars, users, servers = self.db.execute(stmt).one()
        total = int(total or 0)
        successful = int(successful or 0)
        failed = int(failed or 0)
        chars = int(chars or 0)
        users = int(users or 0)
        servers = int(servers or 0)
        success_rate = round((successful / total) if total else 0.0, 4)

        return OverviewResponse(
            month=month,
            timezone=tz,
            generated_at=now_utc(),
            totals=OverviewTotals(
                total_events=total,
                successful_events=successful,
                failed_events=failed,
                success_rate=success_rate,
                total_characters=chars,
                unique_users=users,
                unique_servers=servers,
            ),
        )

    def users(self, month: str, tz: str, page: int, page_size: int) -> PaginatedUsersResponse:
        start_utc, end_utc = self._range(month, tz)
        base = (
            select(
                TranslationEvent.user_id.label("user_id"),
                func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).label(
                    "translated_characters"
                ),
                func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)).label("successful_events"),
                func.sum(case((TranslationEvent.success.is_(False), 1), else_=0)).label("failed_events"),
            )
            .where(
                TranslationEvent.created_at_utc >= start_utc,
                TranslationEvent.created_at_utc < end_utc,
            )
            .group_by(TranslationEvent.user_id)
        )

        total_rows = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        offset = (page - 1) * page_size

        rows_stmt = base.order_by(func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).desc()).offset(offset).limit(page_size)
        rows = [
            UserRow(
                user_id=row.user_id,
                translated_characters=int(row.translated_characters or 0),
                successful_events=int(row.successful_events or 0),
                failed_events=int(row.failed_events or 0),
            )
            for row in self.db.execute(rows_stmt)
        ]

        return PaginatedUsersResponse(
            month=month,
            timezone=tz,
            page=page,
            page_size=page_size,
            total_rows=total_rows,
            rows=rows,
        )

    def servers(self, month: str, tz: str, page: int, page_size: int) -> PaginatedServersResponse:
        start_utc, end_utc = self._range(month, tz)
        base = (
            select(
                TranslationEvent.guild_id.label("guild_id"),
                func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).label(
                    "translated_characters"
                ),
                func.sum(case((TranslationEvent.success.is_(True), 1), else_=0)).label("successful_events"),
                func.sum(case((TranslationEvent.success.is_(False), 1), else_=0)).label("failed_events"),
            )
            .where(
                TranslationEvent.created_at_utc >= start_utc,
                TranslationEvent.created_at_utc < end_utc,
                TranslationEvent.guild_id.is_not(None),
            )
            .group_by(TranslationEvent.guild_id)
        )

        total_rows = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        offset = (page - 1) * page_size

        rows_stmt = base.order_by(func.sum(case((TranslationEvent.success.is_(True), TranslationEvent.char_count), else_=0)).desc()).offset(offset).limit(page_size)
        rows = [
            ServerRow(
                guild_id=str(row.guild_id),
                translated_characters=int(row.translated_characters or 0),
                successful_events=int(row.successful_events or 0),
                failed_events=int(row.failed_events or 0),
            )
            for row in self.db.execute(rows_stmt)
        ]

        return PaginatedServersResponse(
            month=month,
            timezone=tz,
            page=page,
            page_size=page_size,
            total_rows=total_rows,
            rows=rows,
        )

    def errors(self, month: str, tz: str) -> ErrorsResponse:
        start_utc, end_utc = self._range(month, tz)

        error_code = func.coalesce(func.nullif(TranslationEvent.error_code, ""), "unknown")
        stmt = (
            select(error_code.label("error_code"), func.count(TranslationEvent.id).label("count"))
            .where(
                TranslationEvent.created_at_utc >= start_utc,
                TranslationEvent.created_at_utc < end_utc,
                TranslationEvent.success.is_(False),
            )
            .group_by(error_code)
            .order_by(func.count(TranslationEvent.id).desc())
        )

        rows = [ErrorRow(error_code=row.error_code, count=int(row.count or 0)) for row in self.db.execute(stmt)]
        return ErrorsResponse(month=month, timezone=tz, generated_at=now_utc(), rows=rows)

    def languages(self, month: str, tz: str) -> LanguagesResponse:
        start_utc, end_utc = self._range(month, tz)

        stmt = (
            select(
                TranslationEvent.target_lang,
                func.sum(TranslationEvent.char_count).label("successful_characters"),
            )
            .where(
                TranslationEvent.created_at_utc >= start_utc,
                TranslationEvent.created_at_utc < end_utc,
                TranslationEvent.success.is_(True),
            )
            .group_by(TranslationEvent.target_lang)
            .order_by(func.sum(TranslationEvent.char_count).desc())
        )

        rows = [
            LanguageRow(target_lang=row.target_lang, successful_characters=int(row.successful_characters or 0))
            for row in self.db.execute(stmt)
        ]
        return LanguagesResponse(month=month, timezone=tz, generated_at=now_utc(), rows=rows)
