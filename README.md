# Translator Analytics Platform

Production-style analytics stack for a Discord Translator bot.

## Privacy And Security

- Message text is never ingested or stored.
- API key authentication is required for all `/v1/*` endpoints.
- API key is provided in `X-API-Key`.
- Secrets are environment-driven.

## Architecture

Services:

1. `postgres` (PostgreSQL 16)
2. `api` (FastAPI + SQLAlchemy + Alembic)
3. `web` (React + TypeScript + Vite + Tailwind + Recharts)

Data flow:

1. Bot sends events to `POST /v1/events/translation`.
2. API stores event metadata in PostgreSQL (`translation_events`).
3. Dashboard calls `/api/dashboard/*` with date-range filters.
4. Dashboard block controls manage `blocked_users` through the backend API.

## Repository Layout

- `apps/api`: backend API, models, migrations, tests
- `apps/web`: dashboard frontend, hooks/components, tests
- `scripts`: utility scripts (seed data)
- `infra`: reserved for infra helpers
- `docs`: reserved for additional docs

## Local Setup

### 1. Environment

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

Required root vars:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `APP_ENV` (`development` or `production`)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the selected environment
- `ANALYTICS_API_KEY`
- `DASHBOARD_API_KEY`
- `API_PORT`
- `WEB_PORT`

Use separate deployment secrets for Dev and Production. Each deployment must point `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` at the same environment's Supabase project. The service-role key is backend-only and must never use a `VITE_` name.

### 2. Run Everything With Docker Compose

```bash
docker compose up --build
```

### Local development without Docker

From the repository root, run:

```powershell
.\start-analytics.ps1
```

This opens the API and dashboard in separate PowerShell windows. Open `http://localhost:5173` in your browser. Close both service windows to stop them. Use `-ApiPort` or `-WebPort` if either port is already in use.

What this does:

1. Starts PostgreSQL.
2. Waits for DB healthcheck.
3. API container runs `alembic upgrade head` automatically.
4. Starts FastAPI at `http://localhost:8000`.
5. Starts web dashboard at `http://localhost:5173`.

## API Endpoints

Open:

- `GET /health`

Protected (`X-API-Key` required):

- `POST /v1/events/translation`
- `GET /api/dashboard/summary?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/dashboard/timeseries?start=YYYY-MM-DD&end=YYYY-MM-DD&guild_id=...`
- `GET /api/dashboard/languages?start=YYYY-MM-DD&end=YYYY-MM-DD&guild_id=...`
- `GET /api/dashboard/errors?start=YYYY-MM-DD&end=YYYY-MM-DD&guild_id=...`
- `GET /api/dashboard/guilds?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `POST /api/blocks/users` with `{"user_id":"123456789012345678"}`
- `GET /api/blocks/users?page=1&page_size=50`
- `DELETE /api/blocks/users/{user_id}`
- `GET /v1/metrics/overview?month=YYYY-MM&tz=UTC`
- `GET /v1/metrics/users?month=YYYY-MM&page=1&page_size=50&tz=UTC`
- `GET /v1/metrics/servers?month=YYYY-MM&page=1&page_size=50&tz=UTC`
- `GET /v1/metrics/errors?month=YYYY-MM&tz=UTC`
- `GET /v1/metrics/languages?month=YYYY-MM&tz=UTC`

## Bot Configuration

Set bot env vars:

- `ANALYTICS_COLLECTOR_URL=http://localhost:8000`
- `ANALYTICS_API_KEY=<same value as the backend ANALYTICS_API_KEY>`

Also supported on bot side:

- `ANALYTICS_TIMEOUT_SECONDS`
- `ANALYTICS_MAX_QUEUE_SIZE`
- `ANALYTICS_RETRY_LIMIT`

## Example cURL

Ingest:

```bash
curl -X POST "http://localhost:8000/v1/events/translation" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: change-me" \
  -d '{
    "created_at_utc": "2026-08-12T11:30:00Z",
    "source": "button",
    "guild_id": "123456",
    "channel_id": "8888",
    "user_id": "9999",
    "target_lang": "es",
    "char_count": 240,
    "success": true,
    "error_code": null
  }'
```

Overview:

```bash
curl "http://localhost:8000/v1/metrics/overview?month=2026-08&tz=UTC" \
  -H "X-API-Key: change-me"
```

Top users:

```bash
curl "http://localhost:8000/v1/metrics/users?month=2026-08&page=1&page_size=50&tz=UTC" \
  -H "X-API-Key: change-me"
```

## Seeding Data

From API container or with Python environment that can import `apps/api` modules:

```bash
python scripts/seed_events.py
```

## Testing

Backend:

```bash
cd apps/api
pytest
```

Frontend:

```bash
cd apps/web
npm test
```

## Troubleshooting

### 401 Unauthorized

- Confirm `X-API-Key` header is present.
- Confirm it matches root `.env` value for `API_KEY`.

### CORS Errors

- Ensure API `CORS_ORIGINS` includes `http://localhost:5173`.
- Restart API container after env changes.

### Database Connection Errors

- Verify `postgres` container is healthy.
- Check `DATABASE_URL` points to `postgres:5432` from API container.
- Confirm DB credentials match root `.env`.

## Notes

- Timestamps are stored in UTC.
- Month filtering is based on the selected timezone and converted to UTC bounds in backend queries.
- Dashboard shows display time in selected timezone.