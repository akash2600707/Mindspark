'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import AdminGuard from '@/components/AdminGuard';
import AdminNav from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  SECTIONS,
  POINTS_PER_QUESTION,
  TOTAL_QUESTIONS,
  sectionForQuestionNumber,
  getSection,
} from '@/lib/quiz-config';

const BLANK = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  section: SECTIONS[0].key as string,
  time_limit_seconds: String(SECTIONS[0].timeLimitSeconds),
};

function Questions() {
  const sb = supabaseBrowser();
  const [quiz, setQuiz] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [msg, setMsg] = useState('');

  async function load() {
    const { data: q } = await sb
      .from('quizzes')
      .select('id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setQuiz(q);
    if (q) {
      const { data } = await sb
        .from('questions')
        .select('*')
        .eq('quiz_id', q.id)
        .order('question_number');
      setItems(data ?? []);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextNumber = (items.at(-1)?.question_number || 0) + 1;
  const suggested = sectionForQuestionNumber(nextNumber);

  /** Selecting a section pulls in that section's default timing. */
  function pickSection(key: string) {
    const cfg = getSection(key);
    setForm((f) => ({
      ...f,
      section: key,
      time_limit_seconds: String(cfg?.timeLimitSeconds ?? f.time_limit_seconds),
    }));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    const { error } = await sb.from('questions').insert({
      ...form,
      quiz_id: quiz.id,
      question_number: nextNumber,
      points: POINTS_PER_QUESTION,
      time_limit_seconds: Number(form.time_limit_seconds),
      category: getSection(form.section)?.label ?? null,
    });
    setMsg(error?.message || `Question ${nextNumber} added.`);
    if (!error) {
      setForm({
        ...BLANK,
        section: suggested.key,
        time_limit_seconds: String(suggested.timeLimitSeconds),
      });
      load();
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this question?')) return;
    await sb.from('questions').delete().eq('id', id);
    load();
  }

  const counts = SECTIONS.map((s) => ({
    ...s,
    actual: items.filter((i) => i.section === s.key).length,
  }));

  return (
    <main className="pb-16">
      <AdminNav />
      <p className="eyebrow">Question bank</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Questions</h1>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((c) => (
          <Card key={c.key}>
            <CardContent>
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
                {c.label}
              </p>
              <p
                className={cn(
                  'mt-1.5 text-3xl font-semibold',
                  c.actual === c.questionCount ? 'text-success' : 'text-navy',
                )}
              >
                {c.actual} / {c.questionCount}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
              Total
            </p>
            <p
              className={cn(
                'mt-1.5 text-3xl font-semibold',
                items.length === TOTAL_QUESTIONS ? 'text-success' : 'text-gold',
              )}
            >
              {items.length} / {TOTAL_QUESTIONS}
            </p>
          </CardContent>
        </Card>
      </div>

      {msg && (
        <Alert variant="info" className="mt-5">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-7">
        <CardContent>
          <h3 className="mb-5 text-lg font-semibold">Add question {nextNumber}</h3>
          <form className="grid gap-5" onSubmit={add}>
            <div className="grid gap-2">
              <Label htmlFor="qtext">Question</Label>
              <Textarea
                id="qtext"
                required
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                className="min-h-24"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(['a', 'b', 'c', 'd'] as const).map((k) => (
                <div className="grid gap-2" key={k}>
                  <Label htmlFor={`option_${k}`}>Option {k.toUpperCase()}</Label>
                  <Input
                    id={`option_${k}`}
                    required
                    value={(form as any)[`option_${k}`]}
                    onChange={(e) => setForm({ ...form, [`option_${k}`]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="correct">Correct option</Label>
                <Select
                  value={form.correct_option}
                  onValueChange={(v) => setForm({ ...form, correct_option: v })}
                >
                  <SelectTrigger id="correct">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="section">Section</Label>
                <Select value={form.section} onValueChange={pickSection}>
                  <SelectTrigger id="section">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label} (Q{s.startNumber}–{s.endNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                  Suggested for question {nextNumber}: {suggested.label}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="time">Time (seconds)</Label>
                <Input
                  id="time"
                  type="number"
                  min={5}
                  max={300}
                  value={form.time_limit_seconds}
                  onChange={(e) => setForm({ ...form, time_limit_seconds: e.target.value })}
                />
                <p className="text-muted-foreground text-sm">
                  Section default: {getSection(form.section)?.timeLimitSeconds}s
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="points">Points</Label>
                <Input id="points" value={POINTS_PER_QUESTION} disabled />
                <p className="text-muted-foreground text-sm">
                  Every MIND SPARK question carries exactly 1 point.
                </p>
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-1 justify-self-start">
              Add Question
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Correct</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Time</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>{x.question_number}</TableCell>
                  <TableCell>{getSection(x.section)?.label ?? '—'}</TableCell>
                  <TableCell className="max-w-md whitespace-normal">{x.question_text}</TableCell>
                  <TableCell className="font-semibold">{x.correct_option}</TableCell>
                  <TableCell>{x.points}</TableCell>
                  <TableCell>{x.time_limit_seconds}s</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete question ${x.question_number}`}
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => del(x.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
      <Questions />
    </AdminGuard>
  );
}
