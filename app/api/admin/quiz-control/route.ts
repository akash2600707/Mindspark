import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server environment variables are missing.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getUser(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase public environment variables are missing.');
  const publicDb = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await publicDb.auth.getUser(token);
  if (error) throw error;
  return data.user ?? null;
}

async function assertAdmin(db: ReturnType<typeof adminDb>, userId: string) {
  const { data, error } = await db.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You are not authorized as an organizer.');
}

async function getQuiz(db: ReturnType<typeof adminDb>) {
  const { data, error } = await db.from('quizzes').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('No public quiz found.');
  return data;
}

export async function GET(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    const db = adminDb();
    await assertAdmin(db, user.id);
    const quiz = await getQuiz(db);
    const [{ data: state, error: se }, { data: questions, error: qe }, { count, error: pe }] = await Promise.all([
      db.from('quiz_state').select('*').eq('quiz_id', quiz.id).maybeSingle(),
      db.from('questions').select('id,question_number,question_text,points,time_limit_seconds').eq('quiz_id', quiz.id).order('question_number'),
      db.from('participants').select('id', { count: 'exact', head: true }).eq('quiz_id', quiz.id),
    ]);
    if (se) throw se;
    if (qe) throw qe;
    if (pe) throw pe;
    return NextResponse.json({ quiz, state, questions: questions ?? [], participantCount: count ?? 0 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to load quiz.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    const body = await req.json();
    const action = String(body.action || '');
    const db = adminDb();
    await assertAdmin(db, user.id);
    const quiz = await getQuiz(db);
    const { data: questions, error: qe } = await db.from('questions').select('id,question_number,time_limit_seconds').eq('quiz_id', quiz.id).order('question_number');
    if (qe) throw qe;
    const { data: current, error: ce } = await db.from('quiz_state').select('*').eq('quiz_id', quiz.id).maybeSingle();
    if (ce) throw ce;

    if (action === 'OPEN_REGISTRATION') {
      const { error } = await db.from('quizzes').update({ status: 'REGISTRATION_OPEN', registration_open: true }).eq('id', quiz.id);
      if (error) throw error;
      const { error: se } = await db.from('quiz_state').update({ status: 'WAITING' }).eq('quiz_id', quiz.id);
      if (se) throw se;
      return NextResponse.json({ ok: true, message: 'Registration opened.' });
    }
    if (action === 'CLOSE_REGISTRATION') {
      const { error } = await db.from('quizzes').update({ status: 'REGISTRATION_CLOSED', registration_open: false }).eq('id', quiz.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: 'Registration closed.' });
    }
    if (action === 'START') {
      const first = questions?.[0];
      if (!first) return NextResponse.json({ error: 'Add at least one question first.' }, { status: 400 });
      const now = new Date();
      const end = new Date(now.getTime() + (first.time_limit_seconds || 15) * 1000);
      const stateUpdate = await db.from('quiz_state').update({ status: 'LIVE', current_question_id: first.id, question_started_at: now.toISOString(), question_ends_at: end.toISOString() }).eq('quiz_id', quiz.id).select('quiz_id').maybeSingle();
      if (stateUpdate.error) throw stateUpdate.error;
      if (!stateUpdate.data) {
        const { error: insertStateError } = await db.from('quiz_state').insert({ quiz_id: quiz.id, status: 'LIVE', current_question_id: first.id, question_started_at: now.toISOString(), question_ends_at: end.toISOString() });
        if (insertStateError) throw insertStateError;
      }
      const { error: qe2 } = await db.from('quizzes').update({ status: 'LIVE', registration_open: false }).eq('id', quiz.id);
      if (qe2) throw qe2;
      return NextResponse.json({ ok: true, message: 'Quiz started.' });
    }
    if (action === 'PAUSE') {
      const { error } = await db.from('quiz_state').update({ status: 'PAUSED' }).eq('quiz_id', quiz.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: 'Quiz paused.' });
    }
    if (action === 'RESUME') {
      if (!current?.current_question_id) return NextResponse.json({ error: 'No active question.' }, { status: 400 });
      const currentQuestion = questions?.find((x) => x.id === current.current_question_id);
      const now = new Date();
      const end = new Date(now.getTime() + (currentQuestion?.time_limit_seconds || 15) * 1000);
      const { error } = await db.from('quiz_state').update({ status: 'LIVE', question_started_at: now.toISOString(), question_ends_at: end.toISOString() }).eq('quiz_id', quiz.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: 'Quiz resumed.' });
    }
    if (action === 'NEXT') {
      if (!current?.current_question_id) return NextResponse.json({ error: 'No active question.' }, { status: 400 });
      const index = questions?.findIndex((x) => x.id === current.current_question_id) ?? -1;
      const next = questions?.[index + 1];
      if (!next) {
        const { error: se } = await db.from('quiz_state').update({ status: 'COMPLETED', current_question_id: null, question_started_at: null, question_ends_at: null }).eq('quiz_id', quiz.id);
        if (se) throw se;
        const { error: qe2 } = await db.from('quizzes').update({ status: 'COMPLETED' }).eq('id', quiz.id);
        if (qe2) throw qe2;
        return NextResponse.json({ ok: true, message: 'Quiz completed.' });
      }
      const now = new Date();
      const end = new Date(now.getTime() + (next.time_limit_seconds || 15) * 1000);
      const { error } = await db.from('quiz_state').update({ status: 'LIVE', current_question_id: next.id, question_started_at: now.toISOString(), question_ends_at: end.toISOString() }).eq('quiz_id', quiz.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: `Question ${next.question_number} started.` });
    }
    return NextResponse.json({ error: 'Unknown quiz action.' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Quiz control failed.' }, { status: 500 });
  }
}
