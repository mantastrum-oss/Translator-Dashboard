from types import SimpleNamespace

from app.services.billing_service import billing_for_month


class FakeQuery:
    """Just enough of the supabase-py query builder: filters are recorded,
    rows come back in pages like PostgREST."""

    def __init__(self, rows):
        self.rows = rows
        self.filters = []

    def select(self, _columns):
        return self

    def gte(self, column, value):
        self.filters.append(("gte", column, value))
        return self

    def lt(self, column, value):
        self.filters.append(("lt", column, value))
        return self

    def eq(self, column, value):
        self.filters.append(("eq", column, value))
        return self

    def order(self, _column):
        return self

    def range(self, start, end):
        self._slice = (start, end + 1)
        return self

    def execute(self):
        start, stop = self._slice
        return SimpleNamespace(data=self.rows[start:stop])


class FakeClient:
    def __init__(self, packs, usage, events=()):
        self.queries = {
            "user_packs": FakeQuery(packs),
            "user_monthly_usage": FakeQuery(usage),
            "translation_events": FakeQuery(list(events)),
        }

    def table(self, name):
        return self.queries[name]


def test_without_supabase_billing_is_unavailable():
    result = billing_for_month(None, "2026-11", 15000)
    assert result.available is False
    assert result.packs_sold == 0


def test_revenue_counts_only_packs_that_were_not_refunded():
    client = FakeClient(
        packs=[
            {"user_id": "a", "amount_cents": 300, "currency": "eur", "refunded_at": None},
            {"user_id": "b", "amount_cents": 500, "currency": "eur", "refunded_at": None},
            {"user_id": "c", "amount_cents": 500, "currency": "eur", "refunded_at": "2026-11-10T00:00:00Z"},
        ],
        usage=[],
    )
    result = billing_for_month(client, "2026-11", 15000)
    assert result.available is True
    assert result.packs_sold == 2
    assert result.revenue_cents == 800
    assert result.buyers == 2  # c refunded
    assert result.currency == "eur"
    assert ("gte", "purchased_at", "2026-11-01T00:00:00+00:00") in client.queries["user_packs"].filters
    assert ("lt", "purchased_at", "2026-12-01T00:00:00+00:00") in client.queries["user_packs"].filters


def test_free_limit_counts_only_free_characters():
    client = FakeClient(
        packs=[{"user_id": "a", "amount_cents": 300, "currency": "eur", "refunded_at": None}],
        usage=[
            {"user_id": "a", "used_chars": 20000, "paid_chars": 5000},   # 15k free: reached, bought
            {"user_id": "b", "used_chars": 15000, "paid_chars": 0},      # reached, did not buy
            {"user_id": "c", "used_chars": 20000, "paid_chars": 10000},  # only 10k free: not reached
        ],
    )
    result = billing_for_month(client, "2026-11", 15000)
    assert result.users_reached_free_limit == 2
    assert result.users_reached_and_bought == 1
    assert result.buyers == 1
    assert ("eq", "month", "2026-11") in client.queries["user_monthly_usage"].filters


def test_more_than_one_page_of_usage_rows_is_read():
    usage = [{"user_id": str(i), "used_chars": 15000, "paid_chars": 0} for i in range(2500)]
    result = billing_for_month(FakeClient(packs=[], usage=usage), "2026-11", 15000)
    assert result.users_reached_free_limit == 2500


def test_users_refused_for_quota_count_as_reached():
    client = FakeClient(
        packs=[{"user_id": "b", "amount_cents": 300, "currency": "eur", "refunded_at": None}],
        usage=[
            {"user_id": "a", "used_chars": 15200, "paid_chars": 0},  # reached by usage
            {"user_id": "b", "used_chars": 14990, "paid_chars": 0},  # refused, then bought
        ],
        events=[{"user_id": "a"}, {"user_id": "b"}, {"user_id": "b"}, {"user_id": 7}],
    )
    result = billing_for_month(client, "2026-11", 15000)
    assert result.users_reached_free_limit == 3  # a, b and 7 (no usage row), each once
    assert result.users_reached_and_bought == 1
    filters = client.queries["translation_events"].filters
    assert ("eq", "error_code", "quota_exceeded") in filters
    assert ("gte", "created_at", "2026-11-01T00:00:00+00:00") in filters
    assert ("lt", "created_at", "2026-12-01T00:00:00+00:00") in filters

def test_billing_endpoint_requires_a_session(client):
    assert client.get("/api/dashboard/billing", params={"month": "2026-11"}).status_code == 401


def test_billing_endpoint_without_supabase(client, api_key, monkeypatch):
    monkeypatch.setattr("app.routes.dashboard.get_supabase_admin_client", lambda: None)
    response = client.get("/api/dashboard/billing", params={"month": "2026-11"}, headers=api_key)
    assert response.status_code == 200
    assert response.json()["available"] is False
    assert response.json()["free_monthly_chars"] == 15000
