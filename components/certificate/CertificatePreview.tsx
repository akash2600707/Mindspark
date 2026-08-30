import { EVENT } from '@/lib/quiz-config';

export interface CertificateData {
  participant: {
    fullName: string;
    designation?: string | null;
    clubName?: string | null;
    challengeId: string;
  };
  result: {
    score: number;
    totalPoints: number;
    achievementLabel: string;
    achievementColor: string;
  };
}

/**
 * The certificate itself.
 *
 * Every value here comes from the server response — the component takes no
 * client-supplied name, score or tier. Sized as an A4 landscape sheet and laid
 * out in container units (cqw) so it scales cleanly on screen and prints 1:1.
 */
export default function CertificatePreview({ data }: { data: CertificateData }) {
  const { participant: p, result: r } = data;

  return (
    <div className="certificate bg-card relative flex flex-col rounded-2xl border p-[clamp(20px,4.2vw,52px)] shadow-sm">
      <div
        className="pointer-events-none absolute inset-[clamp(10px,1.6vw,18px)] rounded-xl border"
        style={{ borderColor: 'rgba(196,127,30,0.35)' }}
        aria-hidden="true"
      />

      <div className="relative z-1 text-center">
        {/* Plain img, not next/image: the certificate scales in container
            units, so the mark must scale with it rather than sit at a fixed
            pixel size, and it must print at full resolution. */}
        <img
          src="/mindspark-wordmark.png"
          alt={`${EVENT.name} — ${EVENT.subtitle}`}
          style={{ width: '26cqw', height: 'auto', margin: '0 auto', display: 'block' }}
        />
        <p
          className="text-muted-foreground uppercase"
          style={{ fontSize: '1.9cqw', letterSpacing: '0.1em', marginTop: '1.2cqw' }}
        >
          {EVENT.subtitle}
        </p>
      </div>

      <div
        className="relative z-1 flex flex-1 flex-col items-center justify-center text-center"
        style={{ gap: '2.4cqw' }}
      >
        <p
          className="text-muted-foreground uppercase"
          style={{ fontSize: '1.9cqw', letterSpacing: '0.1em' }}
        >
          This is to certify that
        </p>

        <p
          className="text-navy font-serif font-bold"
          style={{ fontSize: '7.4cqw', lineHeight: 1.1 }}
        >
          {p.fullName}
        </p>

        <p
          className="text-muted-foreground uppercase"
          style={{ fontSize: '1.9cqw', letterSpacing: '0.1em' }}
        >
          {[p.designation, p.clubName].filter(Boolean).join(' · ')}
        </p>

        <div
          style={{
            width: '38cqw',
            height: 1,
            margin: '0.6cqw auto',
            background:
              'linear-gradient(90deg, transparent, var(--gold), transparent)',
          }}
          aria-hidden="true"
        />

        <p
          className="text-muted-foreground uppercase"
          style={{ fontSize: '1.9cqw', letterSpacing: '0.1em', maxWidth: '62cqw', lineHeight: 1.7 }}
        >
          participated in the International Service Quiz 2026 and scored{' '}
          <strong className="text-navy">
            {r.score} out of {r.totalPoints}
          </strong>
          , earning
        </p>

        <p
          className="font-extrabold uppercase"
          style={{ fontSize: '4.2cqw', letterSpacing: '0.2em', color: r.achievementColor }}
        >
          {r.achievementLabel}
        </p>
      </div>

      <div
        className="text-muted-foreground relative z-1 flex items-end justify-between"
        style={{ fontSize: '1.7cqw', gap: '3cqw' }}
      >
        <div>
          <p className="text-navy font-semibold">{EVENT.organizer}</p>
          <p>{EVENT.district}</p>
          <p style={{ marginTop: '0.6cqw' }}>Challenge ID · {p.challengeId}</p>
        </div>

        <div className="text-center" style={{ minWidth: '24cqw' }}>
          <div className="border-navy border-t" style={{ marginBottom: '0.8cqw' }} />
          <p>President</p>
        </div>
        <div className="text-center" style={{ minWidth: '24cqw' }}>
          <div className="border-navy border-t" style={{ marginBottom: '0.8cqw' }} />
          <p>Secretary</p>
        </div>
      </div>
    </div>
  );
}
