-- Member detail fields required by the members create/edit form.
alter table public.members add column if not exists gender text;
alter table public.members add column if not exists overall_goal_title text;
alter table public.members add column if not exists overall_goal_value text;
alter table public.members add column if not exists overall_goal_note text;
alter table public.members add column if not exists overall_goal_achieved boolean;
alter table public.members add column if not exists penalty_amount integer not null default 100000;
alter table public.members add column if not exists june_goal_proof_achieved boolean not null default false;
alter table public.members add column if not exists june_goal_proof_date date;
alter table public.members add column if not exists june_goal_proof_note text;

alter table public.members drop constraint if exists members_penalty_amount_check;
alter table public.members add constraint members_penalty_amount_check check (penalty_amount >= 0);

-- Ask Supabase PostgREST to refresh its schema cache after DDL changes.
notify pgrst, 'reload schema';
