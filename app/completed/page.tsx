'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MindSparkLogo from '@/components/branding/MindSparkLogo';
import { TOTAL_QUESTIONS } from '@/lib/quiz-config';

/**
 * Completion interstitial.
 *
 * Held briefly so the end of the challenge reads as a moment, then moves on
 * to the result, which polls until the organizers calculate scores.
 */
export default function Completed() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/results'), 3200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div className="enter">
        <div className="flex justify-center">
          <MindSparkLogo size="lg" showSub priority />
        </div>
        <h1 className="mt-10 text-5xl font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
          Challenge
          <br />
          Complete
        </h1>
        <div className="bg-gold/60 mx-auto my-8 h-px w-40" aria-hidden="true" />
        <p className="text-muted-foreground">
          You&rsquo;ve completed all {TOTAL_QUESTIONS} questions.
        </p>
        <p className="text-navy mt-5 text-xs font-semibold tracking-[0.28em] uppercase">
          Your result is being calculated…
        </p>
      </div>
    </div>
  );
}
