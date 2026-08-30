import type { SectionConfig } from '@/lib/quiz-config';

/**
 * Between-section interstitial.
 *
 * Purely presentational — it does not advance anything. Progression stays
 * entirely with the server's quiz_state, so a participant cannot skip ahead
 * by dismissing this screen.
 */
export default function SectionTransition({
  completed,
  next,
}: {
  completed: SectionConfig;
  next: SectionConfig | null;
}) {
  return (
    <div className="animate-in fade-in-0 grid min-h-screen place-items-center px-5 py-10 text-center duration-500">
      <div>
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.3em] uppercase">
          Section Complete
        </p>
        <h2 className="mt-4 text-5xl font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
          {completed.label}
        </h2>
        <p className="text-navy mt-4 text-xs font-semibold tracking-[0.28em] uppercase">
          {completed.questionCount} / {completed.questionCount} Questions
        </p>

        {next && (
          <div className="mt-12 border-t pt-8">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.3em] uppercase">
              Next Up
            </p>
            <h2 className="text-gradient mt-4 text-4xl font-extrabold tracking-tight uppercase sm:text-5xl">
              {next.label}
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              {next.questionCount} questions · {next.timeLimitSeconds} seconds each
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
