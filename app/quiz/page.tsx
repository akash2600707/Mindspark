'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import MindSparkLogo from '@/components/branding/MindSparkLogo';
import QuestionProgress from '@/components/quiz/QuestionProgress';
import SectionTransition from '@/components/quiz/SectionTransition';
import { useAntiCheat } from '@/components/quiz/useAntiCheat';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { SECTIONS, TOTAL_QUESTIONS, getSection } from '@/lib/quiz-config';

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

export default function Quiz() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);

  const questionId: string | null = data?.question?.id ?? null;
  const isLive = data?.status === 'LIVE';

  useAntiCheat({ active: isLive, questionId });

  const load = useCallback(async () => {
    const code = sessionStorage.getItem('participant_code');
    const token = sessionStorage.getItem('participant_session');
    if (!code || !token) {
      router.replace('/register');
      return;
    }

    try {
      const r = await fetch('/api/quiz/current', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ participantCode: code, sessionToken: token }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to load the question');

      if (j.status === 'WAITING') {
        router.replace('/waiting');
        return;
      }
      if (j.status === 'COMPLETED' || j.status === 'RESULTS_PUBLISHED') {
        router.replace('/completed');
        return;
      }

      setData(j);
      setError('');
      // Clear the local selection when the server moves to a new question.
      setSelected((prev) => (j.question?.id === questionId ? prev : ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection problem');
    }
  }, [router, questionId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  // Display-only countdown toward the server-issued deadline. The server
  // decides whether an answer is still valid — this never gates scoring.
  useEffect(() => {
    if (!data?.questionEndsAt) return;
    const tick = () =>
      setSeconds(
        Math.max(0, Math.ceil((new Date(data.questionEndsAt).getTime() - Date.now()) / 1000)),
      );
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [data?.questionEndsAt]);

  const answer = useCallback(
    async (opt: string) => {
      if (!data?.question || data.answer || seconds <= 0 || sending) return;
      setSelected(opt);
      setSending(true);
      setError('');
      try {
        const r = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            participantCode: sessionStorage.getItem('participant_code'),
            sessionToken: sessionStorage.getItem('participant_session'),
            questionId: data.question.id,
            selectedOption: opt,
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Answer failed');
        await load();
      } catch (e) {
        setSelected('');
        setError(e instanceof Error ? e.message : 'Answer failed');
      } finally {
        setSending(false);
      }
    },
    [data, seconds, sending, load],
  );

  // Keyboard: A-D or 1-4 select an answer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isLive || data?.answer || seconds <= 0 || sending) return;
      const k = e.key.toUpperCase();
      const byLetter = OPTIONS.indexOf(k as (typeof OPTIONS)[number]);
      const byNumber = ['1', '2', '3', '4'].indexOf(k);
      const idx = byLetter >= 0 ? byLetter : byNumber;
      if (idx >= 0) answer(OPTIONS[idx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLive, data?.answer, seconds, sending, answer]);

  if (!data) {
    return (
      <div className="text-muted-foreground grid min-h-screen place-items-center">
        Loading the challenge…
      </div>
    );
  }

  if (data.status === 'PAUSED') {
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <div className="flex justify-center">
            <MindSparkLogo size="lg" />
          </div>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight uppercase">Paused</h1>
          <p className="text-muted-foreground mt-4">
            The host has paused the challenge. Keep this window open.
          </p>
        </div>
      </div>
    );
  }

  const q = data.question;
  if (!q) {
    return (
      <div className="text-muted-foreground grid min-h-screen place-items-center">
        Waiting for the next question…
      </div>
    );
  }

  const section = data.section;
  const locked = Boolean(data.answer) || seconds <= 0;
  const chosen = data.answer?.selected_option || selected;

  // Section interstitial.
  //
  // Shown only once this question is finished for this participant AND it is
  // the last question of its section — i.e. during time they could not have
  // spent answering anyway. It disappears by itself when the server advances,
  // so it never consumes any of the next question's clock. Progression stays
  // server-driven; nothing here can be dismissed to move ahead.
  if (section?.isLastInSection && locked) {
    const completed = getSection(section.key);
    const next = SECTIONS.find((s) => s.order === section.order + 1) ?? null;
    if (completed) return <SectionTransition completed={completed} next={next} />;
  }

  return (
    // select-none is a deterrent only. The server is the real boundary.
    <div className="flex min-h-screen flex-col select-none">
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex w-[min(1180px,calc(100%-2.5rem))] items-center justify-between gap-5 py-3">
          <div className="hidden sm:block">
            <MindSparkLogo size="sm" priority />
          </div>

          <div className="min-w-0 flex-1 sm:flex-none">
            <p className="text-gold text-[11px] font-semibold tracking-[0.22em] uppercase">
              {section?.label ?? '—'}
            </p>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
              Question {String(q.question_number).padStart(2, '0')} / {TOTAL_QUESTIONS}
            </p>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground flex items-center justify-center gap-1 text-[10px] font-semibold tracking-[0.18em] uppercase">
              <Clock className="size-3" /> Time
            </p>
            <p
              className={cn(
                'text-navy text-4xl font-bold tabular-nums transition-colors sm:text-5xl',
                seconds <= 10 && seconds > 5 && 'text-gold',
                seconds <= 5 && 'text-destructive animate-pulse',
              )}
            >
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:
              {String(seconds % 60).padStart(2, '0')}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(860px,calc(100%-2.5rem))] flex-1 py-10 sm:py-14">
        <h1 className="text-2xl leading-snug font-semibold tracking-tight sm:text-3xl lg:text-[2.1rem]">
          {q.question_text}
        </h1>

        {q.image_url && (
          <img src={q.image_url} alt="" className="mt-7 max-w-full rounded-2xl border" />
        )}

        <div className="mt-9 grid gap-3.5" role="group" aria-label="Answer options">
          {OPTIONS.map((key) => {
            const text = q[`option_${key.toLowerCase()}`];
            const isChosen = chosen === key;
            return (
              <button
                key={key}
                type="button"
                disabled={locked || sending}
                aria-pressed={isChosen}
                onClick={() => answer(key)}
                className={cn(
                  'bg-card flex w-full items-start gap-4 rounded-2xl border p-5 text-left text-[17px] leading-snug shadow-xs transition-all',
                  'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
                  !locked && 'hover:border-gold hover:translate-x-1 hover:shadow-sm',
                  isChosen && 'border-gold bg-gold/10',
                  locked && 'cursor-not-allowed',
                  locked && !isChosen && 'opacity-50',
                )}
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold transition-colors',
                    isChosen && 'bg-gold border-gold text-navy',
                  )}
                  aria-hidden="true"
                >
                  {key}
                </span>
                <span className="pt-0.5">{text}</span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="mt-6 grid gap-3">
          {data.answer && (
            <Alert variant="success">
              <CircleCheck />
              <AlertDescription>Answer submitted. Waiting for the next question…</AlertDescription>
            </Alert>
          )}
          {seconds === 0 && !data.answer && (
            <Alert variant="info">
              <Clock />
              <AlertDescription>
                Time is up. The next question will start automatically.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <QuestionProgress current={q.question_number} answered={data.answeredNumbers ?? []} />

        <p className="text-muted-foreground pb-8 text-center text-xs">
          Keep this window open. Leaving the quiz window may be recorded.
        </p>
      </main>
    </div>
  );
}
