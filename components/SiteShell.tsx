import SiteHeader from './SiteHeader';
import MindSparkLogo from './branding/MindSparkLogo';
import { RulesProvider } from './rules/RulesModal';
import { EVENT } from '@/lib/quiz-config';

/**
 * Participant-facing page shell: navigation, content well, footer.
 *
 * Wraps everything in RulesProvider so the nav can open the rules dialog from
 * any page. `autoOpen` is set only on the homepage, where the dialog appears
 * on a first visit.
 *
 * The live quiz deliberately does NOT use this — it renders its own focused
 * chrome with no navigation to leave by.
 */
export default function SiteShell({
  children,
  autoOpenRules = false,
}: {
  children: React.ReactNode;
  autoOpenRules?: boolean;
}) {
  return (
    <RulesProvider autoOpen={autoOpenRules}>
      <div className="mx-auto w-[min(1180px,calc(100%-2.5rem))]">
        <SiteHeader />
        {children}
        <footer className="flex flex-wrap items-start justify-between gap-8 border-t py-12">
          <div>
            <MindSparkLogo size="sm" />
            <p className="text-muted-foreground mt-3 text-xs">{EVENT.subtitle}</p>
          </div>
          <div className="text-muted-foreground text-xs leading-7">
            {EVENT.organizer}
            <br />
            {EVENT.district}
          </div>
          <div className="text-muted-foreground text-xs leading-7">
            © {EVENT.year} {EVENT.organizer}
          </div>
        </footer>
      </div>
    </RulesProvider>
  );
}
