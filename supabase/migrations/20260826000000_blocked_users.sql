create table if not exists public.blocked_users (
    user_id text primary key,
    blocked_at timestamptz not null default now()
);

create index if not exists blocked_users_blocked_at_idx on public.blocked_users (blocked_at desc);

alter table public.blocked_users enable row level security;
revoke all on table public.blocked_users from anon, authenticated;
grant all on table public.blocked_users to service_role;