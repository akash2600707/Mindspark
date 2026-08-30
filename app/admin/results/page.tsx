'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import AdminGuard from '@/components/AdminGuard';
import AdminNav from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAchievement } from '@/lib/quiz-config';

function Results() {
  const sb = supabaseBrowser();
  const [quiz, setQuiz] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: q } = await sb
      .from('quizzes')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setQuiz(q);
    if (q) {
      const { data } = await sb
        .from('final_results')
        .select('*,participants(full_name,club_name,designation,participant_code,challenge_id)')
        .eq('quiz_id', q.id)
        .order('rank');
      setItems(data ?? []);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Triggers the server-side calculation.
   *
   * The previous version looped over every participant from this browser —
   * around 2,000 sequential requests at full capacity. All of that now runs in
   * one Postgres function, so this is a single call that is safe to retry.
   */
  async function calculate() {
    setBusy(true);
    setMsg('Calculating…');
    try {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) throw new Error('Your organizer session expired. Sign in again.');

      const r = await fetch('/api/admin/calculate-results', {
        method: 'POST',
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Calculation failed');
      setMsg(`${j.message} (${j.durationMs}ms)`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Calculation failed');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!quiz) return;
    setBusy(true);
    try {
      await sb.from('quizzes').update({ status: 'RESULTS_PUBLISHED' }).eq('id', quiz.id);
      await sb.from('quiz_state').update({ status: 'RESULTS_PUBLISHED' }).eq('quiz_id', quiz.id);
      setMsg('Results published. Participants can now download certificates.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pb-16">
      <AdminNav />
      <p className="eyebrow">Results control</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Results</h1>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button onClick={calculate} disabled={busy}>
          Calculate Results
        </Button>
        <Button variant="gold" onClick={publish} disabled={busy}>
          Publish Results
        </Button>
      </div>

      {msg && (
        <Alert variant="info" className="mt-5">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-7">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Rotaract</TableHead>
                <TableHead>World &amp; Sports</TableHead>
                <TableHead>Current Affairs</TableHead>
                <TableHead>Correct</TableHead>
                <TableHead>Wrong</TableHead>
                <TableHead>Unanswered</TableHead>
                <TableHead>Achievement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((x: any) => (
                <TableRow key={x.id}>
                  <TableCell>{x.rank}</TableCell>
                  <TableCell className="font-semibold tracking-wider">
                    {x.participants?.challenge_id}
                  </TableCell>
                  <TableCell>{x.participants?.full_name}</TableCell>
                  <TableCell>{x.participants?.club_name}</TableCell>
                  <TableCell className="font-semibold">{x.score}</TableCell>
                  <TableCell>{x.rotaract_score}</TableCell>
                  <TableCell>{x.world_sports_score}</TableCell>
                  <TableCell>{x.current_affairs_score}</TableCell>
                  <TableCell>{x.correct_count}</TableCell>
                  <TableCell>{x.wrong_count}</TableCell>
                  <TableCell>{x.unanswered_count}</TableCell>
                  <TableCell
                    className="font-semibold"
                    style={{ color: getAchievement(x.achievement).color }}
                  >
                    {x.achievement}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <Results />
    </AdminGuard>
  );
}
