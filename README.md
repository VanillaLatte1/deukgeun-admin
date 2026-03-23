# Workout Admin Backoffice

MVP backoffice for workout club admins.

## Features
- Admin login with a shared dashboard key
- Member registration
- Weekly goal setup by member
- Workout record registration with proof images
- Weekly dashboard for progress tracking

## Tech Stack
- Next.js (App Router)
- Supabase (Postgres + Storage)

## 1) Environment Variables
Copy `.env.example` and create `.env`.

Required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_KEY`

## 2) Supabase SQL
Run the following file in the Supabase SQL Editor:

- `supabase/schema.sql`

This creates:
- `members`
- `weekly_goals`
- `workout_sessions`
- Storage bucket: `workout-proofs`

## 3) Local Development
```bash
npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/login`

## 4) Deployment
See the full deployment guide here:

- [docs/deployment-guide.md](./docs/deployment-guide.md)

Quick production deploy:

```powershell
npm run deploy:prod
```

Deploy and assign an alias:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vercel.ps1 -Alias deukgeun-admin.vercel.app
```

## Security Notes
- `ADMIN_DASHBOARD_KEY` is the shared admin login key.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the client.
- If you need per-admin permissions later, migrate to Supabase Auth + RBAC.
