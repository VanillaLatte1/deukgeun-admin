create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  week_start date not null,
  target_sessions integer not null default 0 check (target_sessions >= 0),
  target_minutes integer not null default 0 check (target_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, week_start)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  workout_date date not null,
  session_no integer not null check (session_no > 0),
  exercise_type text not null default 'general',
  duration_minutes integer not null check (duration_minutes >= 0),
  start_image_path text not null,
  end_image_path text,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_sessions_member_date
  on public.workout_sessions(member_id, workout_date);

insert into storage.buckets (id, name, public)
values ('workout-proofs', 'workout-proofs', false)
on conflict (id) do nothing;

alter table public.members enable row level security;
alter table public.weekly_goals enable row level security;
alter table public.workout_sessions enable row level security;

-- 백오피스 서버는 service_role 키를 사용하므로 RLS를 모두 차단해도 관리 기능은 동작합니다.
drop policy if exists deny_all_members on public.members;
create policy deny_all_members on public.members
for all
using (false)
with check (false);

drop policy if exists deny_all_weekly_goals on public.weekly_goals;
create policy deny_all_weekly_goals on public.weekly_goals
for all
using (false)
with check (false);

drop policy if exists deny_all_workout_sessions on public.workout_sessions;
create policy deny_all_workout_sessions on public.workout_sessions
for all
using (false)
with check (false);

-- Storage도 동일하게 차단 (service_role만 접근).
drop policy if exists deny_all_storage_objects on storage.objects;
create policy deny_all_storage_objects on storage.objects
for all
using (bucket_id = 'workout-proofs' and false)
with check (bucket_id = 'workout-proofs' and false);



alter table public.members add column if not exists gender text;
alter table public.workout_sessions add column if not exists exercise_type text not null default 'general';
alter table public.workout_sessions alter column end_image_path drop not null;


