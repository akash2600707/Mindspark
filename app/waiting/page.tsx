'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MindSparkLogo from '@/components/branding/MindSparkLogo';
import { cn } from '@/lib/utils';
import { EVENT } from '@/lib/quiz-config';

type Conn = 'connecting' | 'connected' | 'offline';

/**
 * Waiting room.
 *
 * Participants cannot start the quiz themselves — this page only reacts to
 * the server-held quiz_state. When the organizer starts the challenge, the
 * next poll redirects everyone into /quiz.
 */
export default function Waiting() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [conn, setConn] = useState<Conn>('connecting');
  const [message, setMessage] = useState('Challenge starting soon');
  const failures = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const code = sessionStorage.getItem('participant_code');
      const token = sessionStorage.getItem('participant_session');
      if (!code || !token) {
        router.replace('/register');
        return;
      }

      try {
        const res = await fetch('/api/join', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ participantCode: code, sessionToken: token }),
        });
        const j = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          if (res.status === 401) {
            setConn('offline');
            setMessage(j.error || 'Your session expired. Please register again.');
            return;
          }
          throw new Error(j.error || 'Unable to reach the server');
        }

        failures.current = 0;
        setConn('connected');
        setName(j.fullName ?? null);
        setChallengeId(j.challengeId ?? null);

        if (j.status === 'LIVE') {
          router.replace('/quiz');
          return;
        }
        if (j.status === 'COMPLETED' || j.status === 'RESULTS_PUBLISHED') {
          router.replace('/results');
          return;
        }
        setMessage(j.status === 'PAUSED' ? 'The challenge is paused' : 'Challenge starting soon');
      } catch {
        if (cancelled) return;
        failures.current += 1;
        // One dropped poll is normal on mobile networks; don't alarm anyone.
        if (failures.current >= 2) setConn('offline');
      }
    }

    poll();
    const timer = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [router]);

  return (
    <div className="mx-auto w-[min(1180px,calc(100%-2.5rem))]">
      <main className="grid min-h-screen place-items-center py-16 text-center">
        <div className="enter max-w-lg">
          <div className="flex justify-center">
            <MindSparkLogo size="lg" showSub priority />
          </div>

          <h1 className="mt-10 text-6xl font-extrabold tracking-tight uppercase sm:text-7xl">
            You&rsquo;re in.
          </h1>

          {challengeId && (
            <div className="mt-8">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
                Challenge ID
              </p>
              <p className="text-navy mt-1.5 text-5xl font-extrabold tracking-widest">
                {challengeId}
              </p>
            </div>
          )}

          <div className="bg-gold/60 mx-auto my-8 h-px w-40" aria-hidden="true" />

          <p className="text-navy text-xs font-semibold tracking-[0.28em] uppercase" aria-live="polite">
            {message}
          </p>

          <p
            className={cn(
              'mt-6 inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.2em] uppercase',
              conn === 'connected' ? 'text-success' : 'text-destructive',
            )}
            aria-live="polite"
          >
            <span
              className={cn(
                'size-2 rounded-full bg-current',
                conn === 'connected' && 'animate-pulse',
              )}
              aria-hidden="true"
            />
            {conn === 'connected' ? 'Connected' : conn === 'connecting' ? 'Connecting' : 'Reconnecting'}
          </p>

          <p className="text-muted-foreground mt-8 text-[15px]">
            Please keep this window open.
            <br />
            The challenge will begin when the host starts the quiz.
          </p>

          {name && (
            <p className="text-muted-foreground mt-6 text-xs">
              {name} · {EVENT.organizer}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
