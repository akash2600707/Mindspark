import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { joinSchema } from '@/lib/validation';
import { sessionToken } from '@/lib/codes';

const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

/**
 * Mints or refreshes a participant session.
 *
 * `participantCode` here is the long secret (MM26-XXXXXXXX), NOT the short
 * public Challenge ID. Accepting the short id would let anyone enumerate a
 * few hundred candidates and displace a live participant's session.
 */
export async function POST(req: Request) {
  try {
    const parsed = joinSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid participant code.' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: p, error } = await db
      .from('participants')
      .select('id,quiz_id,participant_code,challenge_id,full_name,status')
      .eq('participant_code', parsed.data.participantCode.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    if (!p || p.status === 'DISQUALIFIED') {
      return NextResponse.json(
        { error: 'Participant code is invalid or unavailable.' },
        { status: 404 },
      );
    }

    const identity = {
      participantCode: p.participant_code,
      challengeId: p.challenge_id,
      fullName: p.full_name,
    };

    // Existing session: verify and refresh its heartbeat.
    if (parsed.data.sessionToken) {
      const { data: s } = await db
        .from('sessions')
        .select('id,active')
        .eq('participant_id', p.id)
        .eq('session_token_hash', hash(parsed.data.sessionToken))
        .maybeSingle();
      if (!s || !s.active) {
        return NextResponse.json({ error: 'Session expired. Please join again.' }, { status: 401 });
      }
      await db.from('sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', s.id);

      const { data: q } = await db
        .from('quiz_state')
        .select('status,current_question_id')
        .eq('quiz_id', p.quiz_id)
        .maybeSingle();
      return NextResponse.json({ ...identity, status: q?.status || 'WAITING' });
    }

    // No token: deactivate prior sessions and mint a fresh one.
    await db.from('sessions').update({ active: false }).eq('participant_id', p.id);
    const token = sessionToken();
    const { error: se } = await db.from('sessions').insert({
      participant_id: p.id,
      session_token_hash: hash(token),
      device_identifier: null,
      active: true,
    });
    if (se) throw se;

    const { data: q } = await db
      .from('quiz_state')
      .select('status,current_question_id')
      .eq('quiz_id', p.quiz_id)
      .maybeSingle();

    return NextResponse.json({ ...identity, sessionToken: token, status: q?.status || 'WAITING' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error while joining.' }, { status: 500 });
  }
}
