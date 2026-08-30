import { timeLimitFor } from './quiz-config';

/**
 * Advance the quiz when the server-issued deadline has passed.
 *
 * This is the single implementation of the auto-advance transition, shared by
 * the participant poll (/api/quiz/current) and the organizer dashboard poll
 * (GET /api/admin/quiz-control). Having the dashboard drive it too means the
 * event cannot stall just because every participant stopped polling — while an
 * organizer has the dashboard open, the quiz keeps moving. The manual NEXT
 * control remains available regardless.
 *
 * CONCURRENCY: the update is a compare-and-swap on
 * (quiz_id, status, current_question_id). Many callers may race; only the one
 * whose predicate still matches wins, so a question is never skipped and the
 * quiz never advances twice for one expiry. Do not relax these predicates.
 *
 * A question that expires with no answer row simply stays unanswered — the
 * result calculation derives unanswered_count from the question total, so no
 * placeholder rows are written.
 */
export async function advanceIfExpired(db: any, quizId: string, state: any) {
  if (!state || state.status !== 'LIVE' || !state.current_question_id || !state.question_ends_at) {
    return state;
  }
  if (Date.now() < new Date(state.question_ends_at).getTime()) return state;

  const { data: currentQuestion } = await db
    .from('questions')
    .select('id,question_number')
    .eq('id', state.current_question_id)
    .maybeSingle();
  if (!currentQuestion) return state;

  const { data: nextQuestion } = await db
    .from('questions')
    .select('id,question_number,time_limit_seconds,section')
    .eq('quiz_id', quizId)
    .gt('question_number', currentQuestion.question_number)
    .order('question_number', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Last question: finish the quiz.
  if (!nextQuestion) {
    const { error } = await db
      .from('quiz_state')
      .update({
        status: 'COMPLETED',
        current_question_id: null,
        question_started_at: null,
        question_ends_at: null,
      })
      .eq('quiz_id', quizId)
      .eq('status', 'LIVE')
      .eq('current_question_id', state.current_question_id);
    if (!error) {
      await db.from('quizzes').update({ status: 'COMPLETED' }).eq('id', quizId).eq('status', 'LIVE');
    }
    return {
      ...state,
      status: 'COMPLETED',
      current_question_id: null,
      question_started_at: null,
      question_ends_at: null,
    };
  }

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + timeLimitFor(nextQuestion) * 1000);

  const { data: updated, error } = await db
    .from('quiz_state')
    .update({
      status: 'LIVE',
      current_question_id: nextQuestion.id,
      question_started_at: startedAt.toISOString(),
      question_ends_at: endsAt.toISOString(),
    })
    .eq('quiz_id', quizId)
    .eq('status', 'LIVE')
    .eq('current_question_id', state.current_question_id)
    .select('*')
    .maybeSingle();

  if (!error && updated) return updated;

  // Another caller won the race; read back whatever they set.
  const { data: fresh } = await db.from('quiz_state').select('*').eq('quiz_id', quizId).maybeSingle();
  return fresh || state;
}
