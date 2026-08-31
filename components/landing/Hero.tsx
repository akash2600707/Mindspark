import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CHALLENGE_STATS } from '@/lib/quiz-config';
import RulesButton from './RulesButton';

/**
 * Hero.
 *
 * Centered, typography-only — no decorative element. The headline and the two
 * highlighted topic phrases share one 180deg gradient (#582515 -> #dd7900);
 * the supporting paragraph is navy (#00133b).
 */
export default function Hero() {
  return (
    <section className="py-16 text-center sm:py-24">
      <p className="eyebrow enter">International Service · Quiz Contest</p>

      <h1 className="enter enter-2 mx-auto mt-6 max-w-4xl text-5xl leading-[0.95] font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
        <span className="text-gradient block">Think.</span>
        <span className="text-gradient block">Connect.</span>
        <span className="text-gradient block">Collaborate.</span>
      </h1>

      <p className="enter enter-3 text-navy mx-auto mt-8 max-w-2xl text-base leading-relaxed sm:text-lg">
        A dynamic quiz contest on{' '}
        <span className="text-gradient font-semibold">Rotary &amp; Rotaract</span>,{' '}
        <span className="text-gradient font-semibold">Current Affairs &amp; News</span> that
        challenges your knowledge, sparks your curiosity and creates impact.
      </p>

      <div className="enter enter-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/register">
            Start the Challenge <ArrowRight className="size-4" />
          </Link>
        </Button>
        <RulesButton />
      </div>

      <dl className="enter enter-3 mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {CHALLENGE_STATS.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border px-4 py-6 shadow-sm">
            <dt className="sr-only">{s.label}</dt>
            <dd className="m-0">
              <span className="text-navy block text-4xl font-semibold tracking-tight">
                {s.value}
              </span>
              <span className="text-muted-foreground mt-2 block text-[11px] font-semibold tracking-[0.2em] uppercase">
                {s.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
