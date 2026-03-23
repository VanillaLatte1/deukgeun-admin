-- 관리자 계정 로그인용 테이블
create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  admin_id text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 정책 미정이면 전부 거부되도록 RLS 활성화
alter table public.admin_accounts enable row level security;

-- 초기 관리자 계정 예시 (비밀번호: change-me-1234)
-- sha256('change-me-1234') = 4e7d79d7f15de2fd7ba43f2f70f9cb7b4f2db7f6f2ff5cf49f84e9f8fdbf4d98
insert into public.admin_accounts (admin_id, password_hash)
values ('admin', '4e7d79d7f15de2fd7ba43f2f70f9cb7b4f2db7f6f2ff5cf49f84e9f8fdbf4d98')
on conflict (admin_id) do nothing;
