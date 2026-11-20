create table if not exists public.weekly_exceptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  week_start date not null,
  reason text null,
  created_at timestamptz not null default now(),
  unique (member_id, week_start)
);

create index if not exists weekly_exceptions_week_start_idx
  on public.weekly_exceptions (week_start);

create index if not exists weekly_exceptions_member_id_idx
  on public.weekly_exceptions (member_id);
