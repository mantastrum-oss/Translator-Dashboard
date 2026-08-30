create table if not exists public.translation_events (
    id bigint generated always as identity primary key,
    created_at timestamptz not null default now(),
    source text not null,
    guild_id text,
    channel_id text,
    user_id text not null,
    target_lang text,
    char_count integer not null default 0,
    success boolean not null,
    error_code text
);

create index if not exists translation_events_created_at_idx on public.translation_events (created_at);
create index if not exists translation_events_guild_id_idx on public.translation_events (guild_id);
create index if not exists translation_events_user_id_idx on public.translation_events (user_id);
create index if not exists translation_events_source_idx on public.translation_events (source);
create index if not exists translation_events_success_idx on public.translation_events (success);

alter table public.translation_events enable row level security;

revoke all on table public.translation_events from anon, authenticated;
grant select, insert, update, delete on table public.translation_events to service_role;
