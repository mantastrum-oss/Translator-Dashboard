-- rate-limit abuse lookups filter by error_code + time range, then rank per user
create index if not exists translation_events_error_code_created_at_user_idx
on public.translation_events (error_code, created_at, user_id);
