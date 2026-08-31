import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SECTIONS } from '@/lib/quiz-config';

export default function ChallengeTopics() {
  return (
    <section className="py-16 sm:py-20" id="challenge">
      <div className="mb-12 text-center">
        <p className="eyebrow">The Challenge</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight uppercase sm:text-4xl">
          Three topics. One challenge.
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {SECTIONS.map((s) => (
          <Card
            key={s.key}
            className="hover:border-gold/50 group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <CardContent className="flex flex-col gap-5">
              <p className="text-gold text-xs font-bold tracking-[0.22em]">
                {String(s.order).padStart(2, '0')}
              </p>

              <h3 className="text-2xl font-semibold tracking-tight uppercase">{s.label}</h3>

              <Separator />

              <div className="text-navy flex gap-5 text-[11px] font-semibold tracking-[0.16em] uppercase">
                <span>{s.questionCount} Questions</span>
                <span>{s.points} Points</span>
              </div>

              <Separator />

              <p className="text-muted-foreground text-[15px] leading-relaxed">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
