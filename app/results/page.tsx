'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteShell from '@/components/SiteShell';
import AchievementBadge from '@/components/results/AchievementBadge';
import ScoreBreakdown from '@/components/results/ScoreBreakdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabaseBrowser } from '@/lib/supabase-browser';

/**
 * Results.
 *
 * With a session: the participant's own verified result, read from
 * final_results server-side. Without one: the public leaderboard, which the
 * organizers gate behind RESULTS_PUBLISHED.
 */
export default function Results() {
  const [own, setOwn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<any[]>([]);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function loadOwn() {
      const code = sessionStorage.getItem('participant_code');
      const token = sessionStorage.getItem('participant_session');
      if (!code || !token) return false;

      const r = await fetch('/api/participant/result', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ participantCode: code, sessionToken: token }),
      });
      if (!r.ok) return false;
      const j = await r.json();
      if (cancelled) return true;
      setOwn(j);
      // Keep polling until the organizer runs the calculation.
      if (j.ready && timer) {
        clearInterval(timer);
        timer = null;
      }
      return true;
    }

    async function loadBoard() {
      const sb = supabaseBrowser();
      const { data: q } = await sb
        .from('quizzes')
        .select('id,status')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!q || cancelled) return;
      setPublished(q.status === 'RESULTS_PUBLISHED');
      if (q.status === 'RESULTS_PUBLISHED') {
        const { data } = await sb
          .from('final_results')
          .select('rank,score,achievement,participants(full_name,club_name,challenge_id)')
          .eq('quiz_id', q.id)
          .order('rank')
          .limit(100);
        if (!cancelled) setBoard(data ?? []);
      }
    }

    (async () => {
      const hasSession = await loadOwn();
      await loadBoard();
      if (!cancelled) setLoading(false);
      if (hasSession) timer = setInterval(loadOwn, 5000);
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  if (loading) {
    return (
      <SiteShell>
        <main className="text-muted-foreground py-20 text-center">Loading your result…</main>
      </SiteShell>
    );
  }

  // Participant view — quiz done, calculation pending.
  if (own && !own.ready) {
    return (
      <SiteShell>
        <main className="py-20 text-center">
          <p className="eyebrow">Challenge Complete</p>
          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-tight uppercase sm:text-5xl">
            Your result is being calculated
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-md">
            You&rsquo;ve completed all the questions. This page will update automatically once the
            organizers publish the results.
          </p>
        </main>
      </SiteShell>
    );
  }

  // Participant view — verified result.
  if (own?.ready) {
    const r = own.result;
    return (
      <SiteShell>
        <main className="py-14 sm:py-20">
          <div className="enter mx-auto max-w-xl">
            <div className="pb-10 text-center">
              <p className="eyebrow">Your Result</p>
              <p className="text-navy mt-4 text-7xl font-extrabold tracking-tight sm:text-8xl">
                {r.score}
                <span className="text-gold"> / {r.totalPoints}</span>
              </p>
              <div className="mt-7">
                <AchievementBadge achievement={r.achievement} />
              </div>
              <p className="text-muted-foreground mt-6 text-[15px]">
                {own.participant.fullName} · Challenge ID {own.participant.challengeId}
                {r.rank ? ` · Rank ${r.rank}` : ''}
              </p>
            </div>

            <ScoreBreakdown sections={r.sections} />

            <div className="bg-card mt-5 overflow-hidden rounded-2xl border shadow-sm">
              {[
                ['Correct', r.correctCount],
                ['Wrong', r.wrongCount],
                ['Unanswered', r.unansweredCount],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4 border-b px-6 py-5 last:border-b-0"
                >
                  <span className="text-xs font-semibold tracking-[0.16em] uppercase">{label}</span>
                  <span className="text-navy text-xl font-semibold tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href={`/certificate?id=${encodeURIComponent(own.participant.challengeId)}`}>
                  Download Certificate
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </div>
        </main>
      </SiteShell>
    );
  }

  // No session — public leaderboard.
  return (
    <SiteShell>
      <main className="py-14 sm:py-20">
        <div className="mb-10 text-center">
          <p className="eyebrow">Final Results</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight uppercase sm:text-4xl">
            {published ? 'Leaderboard' : 'Results not yet published'}
          </h2>
        </div>

        {!published ? (
          <Card className="mx-auto max-w-xl text-center">
            <CardContent>
              <p className="text-muted-foreground">
                The organizers control when the final leaderboard becomes public. If you took part,
                you can retrieve your own result and certificate with your Challenge ID.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/certificate">Find my certificate</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Achievement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {board.map((x: any) => (
                    <TableRow key={x.rank}>
                      <TableCell>{x.rank}</TableCell>
                      <TableCell>{x.participants?.challenge_id}</TableCell>
                      <TableCell>{x.participants?.full_name}</TableCell>
                      <TableCell>{x.participants?.club_name}</TableCell>
                      <TableCell className="font-semibold">{x.score}</TableCell>
                      <TableCell>{x.achievement}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </SiteShell>
  );
}
