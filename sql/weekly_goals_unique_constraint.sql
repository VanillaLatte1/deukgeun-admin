-- Ensures weekly goal upserts can target one row per member/week.
-- If duplicate rows already exist, this keeps the newest row and removes older duplicates.
alter table public.weekly_goals add column if not exists updated_at timestamptz not null default now();

with ranked_goals as (
  select
    id,
    row_number() over (
      partition by member_id, week_start
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as duplicate_rank
  from public.weekly_goals
)
delete from public.weekly_goals goals
using ranked_goals ranked
where goals.id = ranked.id
  and ranked.duplicate_rank > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'weekly_goals_member_id_week_start_key'
      and conrelid = 'public.weekly_goals'::regclass
  ) then
    alter table public.weekly_goals
      add constraint weekly_goals_member_id_week_start_key unique (member_id, week_start);
  end if;
end $$;
