import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { participantEventSchema } from '@/lib/validation';

const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

/**
 * Records anti-cheating telemetry (tab switches, copy attempts, back-navigation).
 *
 * These are signals for organizers to review after the event, not an
 * enforcement mechanism — a determined participant can suppress them. The
 * server-side answer validation in /api/answer remains the real boundary.
 *
 * Always returns 204 so a failure here can never disrupt a live quiz.
 */
export async function POST(req: Request) {
  try {
    const parsed = participantEventSchema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(null, { status: 204 });

    const db = supabaseAdmin();
    const { data: p } = await db
      .from('participants')
      .select('id,quiz_id')
      .eq('participant_code', parsed.data.participantCode.toUpperCase())
      .maybeSingle();
    if (!p) return new NextResponse(null, { status: 204 });

    const { data: s } = await db
      .from('sessions')
      .select('id,active')
      .eq('participant_id', p.id)
      .eq('session_token_hash', hash(parsed.data.sessionToken))
      .maybeSingle();
    if (!s?.active) return new NextResponse(null, { status: 204 });

    await db.from('participant_events').insert({
      quiz_id: p.quiz_id,
      participant_id: p.id,
      question_id: parsed.data.questionId ?? null,
      event_type: parsed.data.eventType,
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new NextResponse(null, { status: 204 });
  }
}
