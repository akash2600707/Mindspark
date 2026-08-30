import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { certificateLookupSchema } from '@/lib/validation';
import { SECTIONS, TOTAL_POINTS, getAchievement, EVENT } from '@/lib/quiz-config';

/**
 * Certificate lookup by public Challenge ID.
 *
 * Every value on the certificate is read from the database here. The client
 * sends only an id — it can never supply a name, a score or a tier and have
 * them rendered.
 *
 * A certificate is released only once the organizers publish results.
 */
export async function POST(req: Request) {
  try {
    const parsed = certificateLookupSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Enter a valid Challenge ID, for example VIN47.' },
        { status: 400 },
      );
    }

    const db = supabaseAdmin();
    const { data: p } = await db
      .from('participants')
      .select('id,quiz_id,challenge_id,full_name,designation,club_name,status')
      .eq('challenge_id', parsed.data.challengeId)
      .maybeSingle();

    if (!p || p.status === 'DISQUALIFIED') {
      return NextResponse.json(
        { error: 'No certificate found for that Challenge ID.' },
        { status: 404 },
      );
    }

    const { data: quiz } = await db
      .from('quizzes')
      .select('id,status')
      .eq('id', p.quiz_id)
      .maybeSingle();

    const { data: result } = await db
      .from('final_results')
      .select(
        'score,correct_count,wrong_count,unanswered_count,rank,achievement,rotaract_score,world_sports_score,current_affairs_score',
      )
      .eq('quiz_id', p.quiz_id)
      .eq('participant_id', p.id)
      .maybeSingle();

    if (!result || quiz?.status !== 'RESULTS_PUBLISHED') {
      return NextResponse.json({
        ready: false,
        message:
          'Your certificate will be available once the organizers publish the results.',
        participant: { fullName: p.full_name, challengeId: p.challenge_id },
      });
    }

    const tier = getAchievement(result.achievement);

    return NextResponse.json({
      ready: true,
      event: EVENT,
      participant: {
        fullName: p.full_name,
        designation: p.designation,
        clubName: p.club_name,
        challengeId: p.challenge_id,
      },
      result: {
        score: result.score,
        totalPoints: TOTAL_POINTS,
        rank: result.rank,
        achievement: tier.key,
        achievementLabel: tier.label,
        achievementColor: tier.color,
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
    return NextResponse.json({ error: 'Server error while retrieving the certificate.' }, { status: 500 });
  }
}
