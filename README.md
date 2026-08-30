# MIND SPARK · International Service Quiz 2026

Live synchronized quiz platform for the Rotaract Club of Madras Millennia (RID 3234).

**50 questions · 3 sections · 50 points · 25 minutes**

| Section | Questions | Points | Timer |
|---|---|---|---|
| Rotaract | 15 | 15 | 20s / question |
| World & Sports | 15 | 15 | 25s / question |
| Current Affairs | 20 | 20 | 30s / question |

Every question carries exactly 1 point. All of the above lives in
`lib/quiz-config.ts` — change it there and it changes everywhere, including
the deadlines the server issues.

## Stack
- Next.js + TypeScript
- Tailwind-style custom CSS (no UI framework dependency)
- Supabase PostgreSQL + Realtime + Auth
- Vercel

## Participant flow
Rules modal → register → Challenge ID → waiting room → *host starts* → live quiz
(3 sections) → challenge complete → result → certificate.

Participants do **not** create accounts or passwords, and cannot start the quiz
themselves — the organizer controls when it begins.

### Two identifiers, on purpose

| | Example | Purpose |
|---|---|---|
| **Challenge ID** | `VIN47` | Public. Shown to the participant, used for certificate lookup. |
| **Recovery code** | `MM26-3B0BA5AC` | Secret. The only thing `/api/join` accepts to mint a session. |

The Challenge ID is short and therefore guessable (~100 combinations per name
prefix). It never grants a session, so it cannot be used to displace a live
participant. Uniqueness is enforced by a database unique index, with the
generator widening to three digits when a name prefix saturates.

## Admin flow
Admin login → dashboard → add questions → open registration → start/pause/resume/advance → calculate results → publish results.

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/migrations/001_initial.sql`, then
   `supabase/migrations/002_mindspark.sql`.
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

## Server authority

The client renders a countdown; it never decides anything. `/api/answer`
independently re-verifies the session, that the quiz is `LIVE`, that the
submitted question is the current one, that the server-issued deadline has not
passed, and that no answer already exists — backed by a unique constraint on
`(participant_id, question_id)`. The correct option is never sent to the
browser, and the answer response does not reveal correctness.

Question advance is a compare-and-swap on `(status, current_question_id)`
(`lib/quiz-advance.ts`), so concurrent pollers can never skip or double-advance
a question. Both the participant poll and the organizer dashboard poll drive it,
so the quiz keeps moving even if every participant disconnects. The organizer
can always advance manually.

Result calculation runs entirely in Postgres (`calculate_final_results`),
granted to `service_role` only and triggered through
`POST /api/admin/calculate-results`. It is idempotent and safe to retry.

## Important production note
Before running a real event with hundreds of simultaneous users, perform a load
test and verify Supabase/Vercel quotas for the exact event configuration.

## First setup content
Migration 001 creates one public quiz capped at 1,000 participants. Migration
002 applies the MIND SPARK schema. Add the 50 questions from the admin panel
(Admin → Questions) before the event; the form assigns sections and per-section
timings automatically.
