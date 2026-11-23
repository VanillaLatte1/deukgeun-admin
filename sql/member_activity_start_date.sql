-- Nullable: existing members retain their previous behavior until a start date is set.
alter table public.members add column if not exists activity_start_date date;
