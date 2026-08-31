import { Card, CardContent } from '@/components/ui/card';
import { ACHIEVEMENT_TIERS, TOTAL_QUESTIONS, TOTAL_POINTS } from '@/lib/quiz-config';

export default function AchievementSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mb-12 text-center">
        <p className="eyebrow">Your score. Your achievement.</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight uppercase sm:text-4xl">
          Every point counts
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-[17px]">
          {TOTAL_QUESTIONS} questions. {TOTAL_POINTS} possible points. Your certificate tier is
          awarded on your final score.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ACHIEVEMENT_TIERS.map((t) => (
          <Card
            key={t.key}
            className="gap-4 overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="h-1.5 w-full" style={{ background: t.color }} aria-hidden="true" />
            <CardContent>
              <h3 className="text-xl font-semibold tracking-tight uppercase" style={{ color: t.color }}>
                {t.label}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm font-medium">
                {t.min}–{t.max} points
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
