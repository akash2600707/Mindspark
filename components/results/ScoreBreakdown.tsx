export default function ScoreBreakdown({
  sections,
}: {
  sections: { key: string; label: string; score: number; points: number }[];
}) {
  return (
    <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      {sections.map((s) => (
        <div
          key={s.key}
          className="flex items-center justify-between gap-4 border-b px-6 py-5 last:border-b-0"
        >
          <span className="text-xs font-semibold tracking-[0.16em] uppercase">{s.label}</span>
          <span className="text-navy text-xl font-semibold tabular-nums">
            {s.score} <span className="text-muted-foreground text-sm">/ {s.points}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
