import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resolveSection, TOTAL_QUESTIONS } from '@/lib/quiz-config';
import { advanceIfExpired } from '@/lib/quiz-advance';

const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

export async function POST(req: Request) {
  try {
    const { participantCode, sessionToken } = await req.json();
    if (!participantCode || !sessionToken) {
      return NextResponse.json({ error: 'Missing session.' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: p } = await db
      .from('participants')
      .select('id,quiz_id,challenge_id,full_name,status')
      .eq('participant_code', String(participantCode).toUpperCase())
      .maybeSingle();
    if (!p) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

    const { data: s } = await db
      .from('sessions')
      .select('id,active')
      .eq('participant_id', p.id)
      .eq('session_token_hash', hash(sessionToken))
      .maybeSingle();
    if (!s?.active) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    await db.from('sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', s.id);

    const identity = {
      fullName: p.full_name,
      challengeId: p.challenge_id,
      totalQuestions: TOTAL_QUESTIONS,
    };

    const { data: initialState } = await db
      .from('quiz_state')
      .select('quiz_id,status,current_question_id,question_started_at,question_ends_at')
      .eq('quiz_id', p.quiz_id)
      .maybeSingle();
    if (!initialState) return NextResponse.json({ status: 'WAITING', ...identity });

    const state: any = await advanceIfExpired(db, p.quiz_id, initialState);

    let question = null;
    let section = null;
    if (state.current_question_id) {
      // correct_option is deliberately excluded from this projection.
      const { data: q } = await db
        .from('questions')
        .select(
          'id,question_number,question_text,option_a,option_b,option_c,option_d,points,time_limit_seconds,image_url,category,section',
        )
        .eq('id', state.current_question_id)
        .maybeSingle();
      if (q) {
        question = q;
        const cfg = resolveSection(q);
        section = {
          key: cfg.key,
          label: cfg.label,
          order: cfg.order,
          questionCount: cfg.questionCount,
          startNumber: cfg.startNumber,
          endNumber: cfg.endNumber,
          // 1-based position of this question inside its section
          indexInSection: q.question_number - cfg.startNumber + 1,
          isLastInSection: q.question_number === cfg.endNumber,
        };
      }
    }

    let answer = null;
    if (question) {
      // Only the participant's own selection is returned — never correctness
      // and never the correct option, until the quiz is over.
      const { data: a } = await db
        .from('answers')
        .select('selected_option')
        .eq('participant_id', p.id)
        .eq('question_id', question.id)
        .maybeSingle();
      answer = a || null;
    }

    // Which question numbers this participant has already answered, for the
    // progress dots. No correctness is exposed.
    const { data: answered } = await db
      .from('answers')
      .select('question_id,questions(question_number)')
      .eq('participant_id', p.id)
      .eq('quiz_id', p.quiz_id);
    const answeredNumbers = (answered ?? [])
      .map((r: any) => r.questions?.question_number)
      .filter((n: any) => typeof n === 'number');

    return NextResponse.json({
      status: state.status,
      ...identity,
      question,
      section,
      questionStartedAt: state.question_started_at,
      questionEndsAt: state.question_ends_at,
      answer,
      answeredNumbers,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
