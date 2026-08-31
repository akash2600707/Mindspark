import SiteShell from '@/components/SiteShell';
import Hero from '@/components/landing/Hero';
import ChallengeTopics from '@/components/landing/ChallengeTopics';
import HowItWorks from '@/components/landing/HowItWorks';
import AchievementSection from '@/components/landing/AchievementSection';

export default function Home() {
  return (
    <SiteShell autoOpenRules>
      <main>
        <Hero />
        <ChallengeTopics />
        <HowItWorks />
        <AchievementSection />
      </main>
    </SiteShell>
  );
}
