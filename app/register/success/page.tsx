import { Suspense } from 'react';
import SiteShell from '@/components/SiteShell';
import RegistrationSuccessClient from './RegistrationSuccessClient';

export const metadata = { title: 'Your Challenge ID · MIND SPARK' };

export default function RegistrationSuccessPage() {
  return (
    <SiteShell>
      <Suspense
        fallback={<main className="text-muted-foreground py-20 text-center">Loading…</main>}
      >
        <RegistrationSuccessClient />
      </Suspense>
    </SiteShell>
  );
}
