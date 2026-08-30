-- MIND SPARK · International Service Quiz 2026
-- Rotaract Club of Madras Millennia (RID 3234)
--
-- Additive migration. Safe to run more than once.
-- Nothing here drops a column or deletes a row.

-- ---------------------------------------------------------------
-- 1. PARTICIPANTS: designation + public challenge id
-- ---------------------------------------------------------------
-- dob is no longer collected by the registration form. The column and any
-- existing values are kept; it simply becomes optional.
alter table public.participants alter column dob drop not null;

alter table public.participants add column if not exists designation text;
alter table public.participants add column if not exists challenge_id text;

-- Backfill any pre-existing rows so no participant is left without an id.
-- row_number() guarantees the generated ids are distinct within each
-- three-letter stem, so this cannot violate the unique index created below.
with numbered as (
  select
    id,
    upper(substr(regexp_replace(coalesce(full_name, 'XXX'), '[^A-Za-z]', '', 'g') || 'XXX', 1, 3)) as stem,
    row_number() over (
      partition by upper(substr(regexp_replace(coalesce(full_name, 'XXX'), '[^A-Za-z]', '', 'g') || 'XXX', 1, 3))
      order by created_at, id
    ) as seq
  from public.participants
  where challenge_id is null
)
update public.participants p
   set challenge_id = n.stem || case
         when n.seq < 100 then lpad(n.seq::text, 2, '0')
         else n.seq::text
       end
  from numbered n
 where p.id = n.id;

-- Public, human-readable id (VIN47). Uniqueness is enforced here, in the
-- database, because the generator in lib/codes.ts cannot guarantee it.
-- Created after the backfill so existing rows are already distinct.
create unique index if not exists participants_challenge_id_key
  on public.participants(challenge_id) where challenge_id is not null;

-- ---------------------------------------------------------------
-- 2. QUESTIONS: sections, and 1 point per question
-- ---------------------------------------------------------------
alter table public.questions add column if not exists section text;

do $do$
begin
  if not exists (select 1 from pg_constraint where conname = 'questions_section_check') then
    alter table public.questions add constraint questions_section_check
      check (section is null or section in ('ROTARACT','WORLD_SPORTS','CURRENT_AFFAIRS'));
  end if;
end
$do$;

-- Derive the section from question_number for anything already entered.
-- 1-15 Rotaract, 16-30 World & Sports, 31-50 Current Affairs.
update public.questions
   set section = case
     when question_number between 1 and 15  then 'ROTARACT'
     when question_number between 16 and 30 then 'WORLD_SPORTS'
     else 'CURRENT_AFFAIRS'
   end
 where section is null;

create index if not exists questions_section_idx on public.questions(quiz_id, section);

-- Every question in MIND SPARK carries exactly 1 point (50 questions = 50 points).
alter table public.questions alter column points set default 1;
update public.questions set points = 1 where points <> 1;

-- Section-appropriate default timings for anything still on the old 15s default.
update public.questions set time_limit_seconds = 20 where section = 'ROTARACT'        and time_limit_seconds = 15;
update public.questions set time_limit_seconds = 25 where section = 'WORLD_SPORTS'    and time_limit_seconds = 15;
update public.questions set time_limit_seconds = 30 where section = 'CURRENT_AFFAIRS' and time_limit_seconds = 15;

-- ---------------------------------------------------------------
-- 3. FINAL RESULTS: per-section breakdown + achievement tier
-- ---------------------------------------------------------------
alter table public.final_results add column if not exists rotaract_score integer not null default 0;
alter table public.final_results add column if not exists world_sports_score integer not null default 0;
alter table public.final_results add column if not exists current_affairs_score integer not null default 0;
alter table public.final_results add column if not exists achievement text;
alter table public.final_results add column if not exists calculated_at timestamptz;

do $do$
begin
  if not exists (select 1 from pg_constraint where conname = 'final_results_achievement_check') then
    alter table public.final_results add constraint final_results_achievement_check
      check (achievement is null or achievement in ('GOLD','SILVER','BRONZE','PARTICIPATION'));
  end if;
end
$do$;

-- ---------------------------------------------------------------
-- 4. PARTICIPANT EVENTS: anti-cheating telemetry
-- ---------------------------------------------------------------
-- Deterrent signals for organizers to review, not a security boundary.
-- The server remains the actual boundary.
create table if not exists public.participant_events (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  event_type text not null check (event_type in ('TAB_HIDDEN','TAB_VISIBLE','WINDOW_BLUR','COPY_ATTEMPT','BACK_ATTEMPT','FULLSCREEN_EXIT')),
  occurred_at timestamptz not null default now()
);
create index if not exists participant_events_participant_idx
  on public.participant_events(participant_id, occurred_at);

alter table public.participant_events enable row level security;

do $do$
begin
  if not exists (select 1 from pg_policies where tablename='participant_events' and policyname='admins read participant events') then
    create policy "admins read participant events" on public.participant_events
      for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename='participant_events' and policyname='admins manage participant events') then
    create policy "admins manage participant events" on public.participant_events
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end
$do$;

-- ---------------------------------------------------------------
-- 5. SERVER-SIDE RESULT CALCULATION
-- ---------------------------------------------------------------
-- Replaces the ~1000 sequential client-side queries the admin browser used to
-- run. One set-based statement, idempotent, safe to retry.
create or replace function public.calculate_final_results(p_quiz_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_total_questions integer;
  v_rows integer;
begin
  select count(*) into v_total_questions from public.questions where quiz_id = p_quiz_id;

  with base as (
    select
      p.id as participant_id,
      coalesce(sum(a.points_awarded), 0)::integer as score,
      count(a.id) filter (where a.is_correct)::integer as correct_count,
      count(a.id) filter (where a.is_correct is false)::integer as wrong_count,
      coalesce(sum(a.response_time_ms), 0)::bigint as total_response_time_ms,
      coalesce(sum(a.points_awarded) filter (where q.section = 'ROTARACT'), 0)::integer as rotaract_score,
      coalesce(sum(a.points_awarded) filter (where q.section = 'WORLD_SPORTS'), 0)::integer as world_sports_score,
      coalesce(sum(a.points_awarded) filter (where q.section = 'CURRENT_AFFAIRS'), 0)::integer as current_affairs_score
    from public.participants p
    left join public.answers a on a.participant_id = p.id and a.quiz_id = p_quiz_id
    left join public.questions q on q.id = a.question_id
    where p.quiz_id = p_quiz_id and p.status <> 'DISQUALIFIED'
    group by p.id
  ),
  ranked as (
    -- Tie-break preserved from the original implementation:
    -- higher score first, then lower cumulative response time.
    select b.*,
           row_number() over (order by b.score desc, b.total_response_time_ms asc, b.participant_id asc)::integer as rnk
    from base b
  )
  insert into public.final_results (
    quiz_id, participant_id, score, correct_count, wrong_count, unanswered_count,
    total_response_time_ms, rotaract_score, world_sports_score, current_affairs_score,
    achievement, rank, calculated_at
  )
  select
    p_quiz_id, r.participant_id, r.score, r.correct_count, r.wrong_count,
    greatest(0, v_total_questions - r.correct_count - r.wrong_count),
    r.total_response_time_ms, r.rotaract_score, r.world_sports_score, r.current_affairs_score,
    case
      when r.score >= 40 then 'GOLD'
      when r.score >= 30 then 'SILVER'
      when r.score >= 20 then 'BRONZE'
      else 'PARTICIPATION'
    end,
    r.rnk, now()
  from ranked r
  on conflict (quiz_id, participant_id) do update set
    score                  = excluded.score,
    correct_count          = excluded.correct_count,
    wrong_count            = excluded.wrong_count,
    unanswered_count       = excluded.unanswered_count,
    total_response_time_ms = excluded.total_response_time_ms,
    rotaract_score         = excluded.rotaract_score,
    world_sports_score     = excluded.world_sports_score,
    current_affairs_score  = excluded.current_affairs_score,
    achievement            = excluded.achievement,
    rank                   = excluded.rank,
    calculated_at          = excluded.calculated_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end
$fn$;

-- Callable only by the service role, i.e. only from a server route that has
-- already verified the caller is an organizer. Never from the browser.
revoke all on function public.calculate_final_results(uuid) from public, anon, authenticated;
grant execute on function public.calculate_final_results(uuid) to service_role;
