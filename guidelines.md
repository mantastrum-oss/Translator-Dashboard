# Dashboard Guidelines

## Scope
The dashboard reports usage and reliability of the Translator bot using analytics events only.  
Do not ingest or store message content.

## Data Contract
Each translation event contains:
- created_at_utc
- source
- guild_id
- channel_id
- user_id
- target_lang
- char_count
- success
- error_code

## Privacy Rules
- Never store message text.
- Never store Discord usernames unless explicitly required.
- Prefer IDs and aggregated stats.
- Redact secrets from logs.
- Protect all metric endpoints with auth.

## Security Rules
- Use HTTPS in production.
- Require API key (or stronger auth) for dashboard and metrics APIs.
- Keep secrets in environment variables only.
- Add rate limits to ingest and metrics endpoints.

## Reliability Rules
- Dashboard must tolerate temporary API downtime gracefully.
- Show last updated timestamp.
- Use retry with backoff in frontend fetch layer.
- Handle partial failures without crashing whole UI.

## Metric Definitions
- Monthly bucket: based on created_at_utc normalized to selected timezone.
- Unique users per month: distinct user_id with at least one event in month.
- Characters per user/month: sum(char_count) where success = true.
- Characters per server/month: sum(char_count) where success = true and guild_id is not null.
- Errors per month: count where success = false.
- Success rate: successful events / total events.

## API Shape Recommendations
- Return JSON with:
  - month
  - generated_at
  - totals
  - rows
  - pagination (for lists)
- Keep fields stable and typed.
- Validate query params strictly (YYYY-MM, page bounds).

## Database Guidelines
- Use relational DB (SQLite initially, Postgres-ready schema).
- Add indexes:
  - created_at_utc
  - user_id
  - guild_id
  - success
  - source
- Consider materialized monthly aggregates if volume grows.

## UI Guidelines
- Overview cards:
  - Total users
  - Total translated characters
  - Error count
  - Success rate
- Charts:
  - daily trend for current month
  - error trend
  - top languages
- Tables:
  - top users by characters
  - top servers by characters
- Controls:
  - month picker
  - timezone selector
  - refresh interval

## Performance Targets
- Typical metrics response under 500ms for medium datasets.
- Dashboard first meaningful paint under 2s on broadband.
- Auto-refresh should not flood the API.

## Testing Requirements
- Unit tests for aggregation logic.
- Integration tests for metrics endpoints.
- Seed-data smoke test for dashboard rendering.

## Deployment Checklist
- Configure env vars.
- Run migrations.
- Start collector API.
- Start dashboard web app.
- Verify /health.
- Verify metrics endpoints with sample data.
- Verify dashboard displays expected monthly values.