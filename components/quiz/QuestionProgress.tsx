import { cn } from '@/lib/utils';
import { SECTIONS, TOTAL_QUESTIONS } from '@/lib/quiz-config';

/**
 * Per-question progress dots with visible section boundaries.
 *
 * States: answered (filled navy), current (gold, enlarged), missed (a passed
 * question with no answer), upcoming (outline).
 */
export default function QuestionProgress({
  current,
  answered,
}: {
  current: number;
  answered: number[];
}) {
  const answeredSet = new Set(answered);
  const numbers = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1);
  const boundaries = new Set(SECTIONS.slice(0, -1).map((s) => s.endNumber));

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 py-6"
      role="img"
      aria-label={`Question ${current} of ${TOTAL_QUESTIONS}. ${answered.length} answered.`}
    >
      {numbers.map((n) => {
        const isCurrent = n === current;
        const isAnswered = answeredSet.has(n);
        const isMissed = !isCurrent && !isAnswered && n < current;

        return (
          <span key={n} className="contents">
            <span
              className={cn(
                'size-2.5 shrink-0 rounded-full border transition-all',
                isCurrent && 'bg-gold border-gold scale-150',
                !isCurrent && isAnswered && 'bg-navy border-navy',
                isMissed && 'bg-border border-border',
                !isCurrent && !isAnswered && !isMissed && 'border-input bg-transparent',
              )}
            />
            {boundaries.has(n) && (
              <span className="bg-gold/50 mx-2 h-3.5 w-px shrink-0" aria-hidden="true" />
            )}
          </span>
        );
      })}
    </div>
  );
}
