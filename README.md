# Rotaract International Service Live Quiz

A lightweight live quiz platform for Rotaract Club of Madras Millenia.

## Stack
- Next.js + TypeScript
- Tailwind-style custom CSS (no UI framework dependency)
- Supabase PostgreSQL + Realtime + Auth
- Vercel

## Participant flow
Register → receive random participant code → enter code on event day → waiting room → live quiz → completion/results.

Participants do **not** create accounts or passwords.

## Admin flow
Admin login → dashboard → add questions → open registration → start/pause/resume/advance → calculate results → publish results.

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/migrations/001_initial.sql`.
4. Create an admin user in Supabase Authentication.
5. Insert that user's UUID into `public.admin_users`:

```sql
insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
```

6. Add environment variables from `.env.example` to `.env.local` during local development and to Vercel in production.

Required variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.**

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Important production note
The event logic is server-authoritative for answer validation and the official timer. Before running a real event with hundreds of simultaneous users, perform a load test and verify Supabase/Vercel free-tier quotas for the exact event configuration.

## First setup content
The migration creates one public quiz titled `International Service Quiz 2026`, capped at 1,000 participants, and opens registration. Add the real questions from the admin panel before the event.
