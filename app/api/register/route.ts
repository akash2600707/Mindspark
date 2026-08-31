import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { registerSchema } from '@/lib/validation';
import { participantCode, sessionToken, generateUniqueChallengeId } from '@/lib/codes';

const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

export async function POST(req: Request) {
  try {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check the registration details.' }, { status: 400 });
    }

    const db = supabaseAdmin();

    const { data: quiz, error: qerr } = await db
      .from('quizzes')
      .select('id,registration_open,max_participants,status')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (qerr) throw qerr;
    if (!quiz || !quiz.registration_open || quiz.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json({ error: 'Registration is currently closed.' }, { status: 400 });
    }

    const { count } = await db
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id)
      .neq('status', 'DISQUALIFIED');
    if ((count ?? 0) >= quiz.max_participants) {
      return NextResponse.json({ error: 'Registration capacity has been reached.' }, { status: 400 });
    }

    // Public display id. Uniqueness is checked against the database here and
    // guaranteed by the unique index if two registrations race.
    const publicId = await generateUniqueChallengeId(parsed.data.fullName, async (candidate) => {
      const { data } = await db
        .from('participants')
        .select('id')
        .eq('challenge_id', candidate)
        .maybeSingle();
      return Boolean(data);
    });

    // Long secret used to re-establish a session. Never displayed as the
    // Challenge ID and never guessable.
    const code = participantCode();

    const { data: inserted, error } = await db
      .from('participants')
      .insert({
        quiz_id: quiz.id,
        participant_code: code,
        challenge_id: publicId,
        full_name: parsed.data.fullName,
        designation: parsed.data.designation,
        club_name: parsed.data.clubName,
        email: parsed.data.email,
        city: parsed.data.city || null,
        mobile: parsed.data.mobile || null,
        status: 'REGISTERED',
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'That registration could not be completed. Please try again.' },
          { status: 409 },
        );
      }
      throw error;
    }

    // Mint the quiz session immediately so the participant moves straight into
    // the waiting room without re-entering anything.
    const token = sessionToken();
    const { error: se } = await db.from('sessions').insert({
      participant_id: inserted.id,
      session_token_hash: hash(token),
      active: true,
    });
    if (se) throw se;

    await db.from('participants').update({ status: 'WAITING' }).eq('id', inserted.id);

    return NextResponse.json(
      {
        challengeId: publicId,
        participantCode: code,
        fullName: parsed.data.fullName,
        sessionToken: token,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error while registering.' }, { status: 500 });
  }
}
