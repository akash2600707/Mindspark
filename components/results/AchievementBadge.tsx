import { Badge } from '@/components/ui/badge';
import { getAchievement } from '@/lib/quiz-config';

export default function AchievementBadge({ achievement }: { achievement: string }) {
  const tier = getAchievement(achievement);
  return (
    <Badge
      variant="tier"
      className="px-7 py-2.5 text-base tracking-[0.24em] uppercase"
      style={{ borderColor: tier.color, color: tier.color }}
    >
      {tier.label}
    </Badge>
  );
}
