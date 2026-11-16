"""Packs sold and free-allowance usage, read from the bot's Supabase tables
(`user_packs`, `user_monthly_usage`; see the bot's schema_user_packs.sql)."""

from typing import Any, Protocol

from app.schemas import BillingResponse
from app.utils.time import month_bounds_utc


class _Table(Protocol):
    def select(self, columns: str) -> Any: ...


class _SupabaseLike(Protocol):
    def table(self, name: str) -> _Table: ...


_PAGE = 1000


def _all_rows(query: Any) -> list[dict]:
    """PostgREST returns at most 1000 rows per request: page through them."""
    rows: list[dict] = []
    offset = 0
    while True:
        batch = query.range(offset, offset + _PAGE - 1).execute().data or []
        rows.extend(batch)
        if len(batch) < _PAGE:
            return rows
        offset += _PAGE


def billing_for_month(client: _SupabaseLike | None, month: str, free_monthly_chars: int) -> BillingResponse:
    empty = BillingResponse(
        month=month, available=False, free_monthly_chars=free_monthly_chars, packs_sold=0,
        revenue_cents=0, currency="eur", users_reached_free_limit=0, users_reached_and_bought=0, buyers=0,
    )
    if client is None:
        return empty

    start_utc, end_utc = month_bounds_utc(month, "UTC")
    packs = _all_rows(
        client.table("user_packs")
        .select("user_id,amount_cents,currency,refunded_at")
        .gte("purchased_at", start_utc.isoformat())
        .lt("purchased_at", end_utc.isoformat())
        .order("id")
    )
    kept = [pack for pack in packs if not pack.get("refunded_at")]

    usage = _all_rows(
        client.table("user_monthly_usage")
        .select("user_id,used_chars,paid_chars")
        .eq("month", month)
        .order("user_id")
    )
    # Free characters used = everything translated minus what packs paid for.
    reached = {
        row["user_id"]
        for row in usage
        if int(row.get("used_chars") or 0) - int(row.get("paid_chars") or 0) >= free_monthly_chars
    }
    buyers = {pack["user_id"] for pack in kept}

    currencies = {str(pack.get("currency") or "eur").lower() for pack in kept}
    return BillingResponse(
        month=month,
        available=True,
        free_monthly_chars=free_monthly_chars,
        packs_sold=len(kept),
        revenue_cents=sum(int(pack.get("amount_cents") or 0) for pack in kept),
        currency=currencies.pop() if len(currencies) == 1 else "eur",
        users_reached_free_limit=len(reached),
        users_reached_and_bought=len(reached & buyers),
        buyers=len(buyers),
    )
