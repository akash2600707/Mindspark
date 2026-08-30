import { NextResponse } from 'next/server';
import { adminDb, getUser, assertAdmin, getPublicQuiz } from '@/lib/admin-auth';

/**
 * Server-side result calculation.
 *
 * Replaces the previous approach, which ran roughly one query per participant
 * plus one upsert per participant from the organizer's browser — around 2,000
 * sequential round trips at a 1,000-participant event.
 *
 * All of the work now happens inside a single set-based Postgres function
 * (`calculate_final_results`). It is idempotent: running it twice produces the
 * same rows, so it is safe to retry after a timeout or a lost connection.
 */
export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }

    const db = adminDb();
    await assertAdmin(db, user.id);
    const quiz = await getPublicQuiz(db);

    const started = Date.now();
    // The function is granted to service_role only, never to anon/authenticated.
    const { data, error } = await db.rpc('calculate_final_results', { p_quiz_id: quiz.id });
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      participantsScored: data ?? 0,
      durationMs: Date.now() - started,
      message: `Calculated results for ${data ?? 0} participants.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Result calculation failed.' },
      { status: 500 },
    );
  }
}
