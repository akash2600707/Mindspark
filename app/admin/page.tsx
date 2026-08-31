'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import AdminGuard from '@/components/AdminGuard';
import AdminNav from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSection } from '@/lib/quiz-config';

function Dashboard() {
  const sb = supabaseBrowser();
  const [q, setQ] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function authHeaders() {
    const { data } = await sb.auth.getSession();
    if (!data.session) throw new Error('Admin session expired. Please sign in again.');
    return { authorization: `Bearer ${data.session.access_token}` };
  }

  async function load() {
    try {
      const headers = await authHeaders();
      const r = await fetch('/api/admin/quiz-control', { headers, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unable to load quiz.');
      setQ(j.quiz);
      setState(j.state);
      setQuestions(j.questions || []);
      setCount(j.participantCount || 0);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Unable to load quiz.');
    }
  }

  useEffect(() => {
    load();
    // This poll also drives the server-side auto-advance, so the quiz keeps
    // moving while an organizer has the dashboard open.
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function control(action: string) {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const headers = { ...(await authHeaders()), 'content-type': 'application/json' };
      const r = await fetch('/api/admin/quiz-control', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Quiz control failed.');
      setMsg(j.message || 'Updated.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Quiz control failed.');
    } finally {
      setBusy(false);
    }
  }

  const current = questions.find((x) => x.id === state?.current_question_id);

  return (
    <main className="pb-16">
      <AdminNav />
      <p className="eyebrow">Organizer dashboard</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{q?.title || 'Quiz'}</h1>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ['Status', state?.status || '—'],
          ['Participants', count],
          ['Questions', questions.length],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardContent>
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
                {label}
              </p>
              <p className="text-navy mt-1.5 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button variant="outline" disabled={busy} onClick={() => control('OPEN_REGISTRATION')}>
          Open Registration
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => control('CLOSE_REGISTRATION')}>
          Close Registration
        </Button>
        <Button disabled={busy} onClick={() => control('START')}>
          Start Quiz
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => control('PAUSE')}>
          Pause
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => control('RESUME')}>
          Resume
        </Button>
        <Button variant="gold" disabled={busy} onClick={() => control('NEXT')}>
          Next / Finish
        </Button>
      </div>

      {msg && (
        <Alert variant="info" className="mt-5">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-7">
        <CardContent>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Live question</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Current: {current?.question_number ?? '—'}
                {current ? ` · ${getSection(current.section)?.label ?? '—'}` : ''}
              </p>
            </div>
            <Badge variant="secondary">{state?.status || '—'}</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((x) => (
                <TableRow
                  key={x.id}
                  className={x.id === state?.current_question_id ? 'bg-gold/10' : undefined}
                >
                  <TableCell>{x.question_number}</TableCell>
                  <TableCell>{getSection(x.section)?.label ?? '—'}</TableCell>
                  <TableCell className="max-w-md whitespace-normal">{x.question_text}</TableCell>
                  <TableCell>{x.points}</TableCell>
                  <TableCell>{x.time_limit_seconds}s</TableCell>
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
      <Dashboard />
    </AdminGuard>
  );
}
