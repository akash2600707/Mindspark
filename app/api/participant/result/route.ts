import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  SECTIONS,
  TOTAL_POINTS,
  TOTAL_QUESTIONS,
  getAchievement,
} from '@/lib/quiz-config';

const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

/**
 * A participant's own result, verified by session.
 *
 * Scores are read from `final_results`, which only the organizer can populate.
 * Nothing here is derived from anything the client sent, so a participant
 * cannot influence their own score or tier.
 */
export async function POST(req: Request) {
  try {
    const { participantCode, sessionToken } = await req.json();
    if (!participantCode || !sessionToken) {
      return NextResponse.json({ error: 'Missing session.' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: p } = await db
      .from('participants')
      .select('id,quiz_id,challenge_id,full_name,designation,club_name')
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

    const { data: state } = await db
      .from('quiz_state')
      .select('status')
      .eq('quiz_id', p.quiz_id)
      .maybeSingle();

    const { data: result } = await db
      .from('final_results')
      .select(
        'score,correct_count,wrong_count,unanswered_count,rank,achievement,rotaract_score,world_sports_score,current_affairs_score,calculated_at',
      )
      .eq('quiz_id', p.quiz_id)
      .eq('participant_id', p.id)
      .maybeSingle();

    const participant = {
      fullName: p.full_name,
      designation: p.designation,
      clubName: p.club_name,
      challengeId: p.challenge_id,
    };

    if (!result) {
      // Quiz finished but the organizer has not calculated yet.
      return NextResponse.json({
        ready: false,
        quizStatus: state?.status ?? 'WAITING',
        participant,
      });
    }

    const tier = getAchievement(result.achievement);

    return NextResponse.json({
      ready: true,
      quizStatus: state?.status ?? 'COMPLETED',
      participant,
      result: {
        score: result.score,
        totalPoints: TOTAL_POINTS,
        totalQuestions: TOTAL_QUESTIONS,
        correctCount: result.correct_count,
        wrongCount: result.wrong_count,
        unansweredCount: result.unanswered_count,
        rank: result.rank,
        achievement: tier.key,
        achievementLabel: tier.label,
        sections: SECTIONS.map((sec) => ({
          key: sec.key,
          label: sec.label,
          points: sec.points,
          score:
            sec.key === 'ROTARACT'
              ? result.rotaract_score
              : sec.key === 'WORLD_SPORTS'
                ? result.world_sports_score
                : result.current_affairs_score,
        })),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
