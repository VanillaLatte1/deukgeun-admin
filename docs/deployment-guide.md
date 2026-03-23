# Deployment Guide

This document explains the standard workflow for local development and Vercel deployment.

## 1. Prerequisites

Required tools:
- Node.js / npm
- Vercel account
- Vercel CLI

Required local environment variables in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_KEY`

## 2. Local Development Flow

Install dependencies:

```powershell
npm install
```

Run the dev server:

```powershell
npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/login`

Check the production build before deploying:

```powershell
npm run build
```

Optional validation:

```powershell
npm run lint
```

## 3. First-Time Vercel Setup

Login once:

```powershell
npx vercel login
```

Link this folder to a Vercel project:

```powershell
npx vercel link
```

After linking, `.vercel/project.json` should exist.

## 4. Vercel Environment Variables

List current variables:

```powershell
npx vercel env ls
```

Add required production variables:

```powershell
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add ADMIN_DASHBOARD_KEY production
```

Update a value:

```powershell
npx vercel env rm ADMIN_DASHBOARD_KEY production
npx vercel env add ADMIN_DASHBOARD_KEY production
```

Notes:
- `NEXT_PUBLIC_*` values may be visible in the browser.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.

## 5. Production Deployment

Direct deploy:

```powershell
npx vercel deploy --prod --yes
```

Deploy with the project script:

```powershell
npm run deploy:prod
```

Deploy and assign an alias:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vercel.ps1 -Alias deukgeun-admin.vercel.app
```

## 6. Deploy Script Behavior

`scripts/deploy-vercel.ps1` does the following:

1. Checks that `.env` exists
2. Runs `npm run build`
3. Runs `npx vercel deploy --prod --yes`
4. Optionally assigns an alias if `-Alias` is provided

This script does not auto-sync Vercel environment variables.
Make sure these are already done:

- `npx vercel login`
- `npx vercel link`
- `npx vercel env add ...`

## 7. Release Checklist

Before deploy:
- Confirm `.env` is up to date
- Confirm `npm run build` passes
- Confirm Vercel production env vars are correct

After deploy:
- Open the production URL
- Test `/login`
- Check major pages and core flows

## 8. Alias Management

Assign an alias:

```powershell
npx vercel alias set <deployment-url> deukgeun-admin.vercel.app
```

List aliases:

```powershell
npx vercel alias list
```

Remove an alias:

```powershell
npx vercel alias remove <alias-domain> --yes
```
