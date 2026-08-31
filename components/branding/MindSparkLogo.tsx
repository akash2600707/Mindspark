import Image from 'next/image';
import { EVENT } from '@/lib/quiz-config';

/**
 * MIND SPARK wordmark — the supplied brand asset.
 *
 * `public/mindspark-wordmark.png` is the original `mindspark-logo.png` with its
 * transparent padding trimmed (29% of that canvas was empty, which would
 * otherwise inflate the mark's layout box) and resized for the web. The
 * full-resolution original is kept alongside it.
 *
 * Sized by height so the mark keeps its 2.3156:1 aspect at every scale.
 */

const ASPECT = 2.3156;

// Enlarged: the wordmark is the primary brand cue in the nav.
const HEIGHTS = { sm: 26, md: 44, lg: 76 } as const;

export default function MindSparkLogo({
  size = 'md',
  showSub = false,
  className = '',
  priority = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showSub?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const height = HEIGHTS[size];
  const width = Math.round(height * ASPECT);

  return (
    <span className={className} style={{ display: 'inline-block' }}>
      <Image
        src="/mindspark-wordmark.png"
        alt={`${EVENT.name} — ${EVENT.subtitle}`}
        width={width}
        height={height}
        priority={priority}
        style={{ display: 'block', height, width: 'auto' }}
      />
      {showSub && (
        <span className="text-muted-foreground mt-2 block text-[10px] font-semibold tracking-[0.22em] uppercase">
          {EVENT.subtitle}
        </span>
      )}
    </span>
  );
}
