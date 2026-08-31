import { TOTAL_QUESTIONS, SECTIONS } from '@/lib/quiz-config';

const STEPS = [
  { title: 'Register', body: 'Enter your name, designation, club and email.' },
  { title: 'Get your Challenge ID', body: 'A unique ID is generated for you.' },
  {
    title: 'Wait for the challenge',
    body: 'Enter the waiting room until the administrator starts the quiz.',
  },
  {
    title: 'Take the challenge',
    body: `Answer ${TOTAL_QUESTIONS} synchronized questions across ${SECTIONS.length} sections.`,
  },
  { title: 'Get your certificate', body: 'View your result and download your certificate.' },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mb-12 text-center">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight uppercase sm:text-4xl">
          From sign-up to certificate
        </h2>
      </div>

      <ol className="bg-card mx-auto max-w-3xl overflow-hidden rounded-2xl border shadow-sm">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="grid items-start gap-4 border-b p-6 last:border-b-0 sm:grid-cols-[110px_1fr] sm:gap-6"
          >
            <span className="text-gold pt-1 text-xs font-bold tracking-[0.22em] uppercase">
              Step {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-lg font-semibold tracking-tight uppercase">{s.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-[15px]">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
