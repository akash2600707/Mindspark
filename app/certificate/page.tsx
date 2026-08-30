import { Suspense } from 'react';
import SiteShell from '@/components/SiteShell';
import CertificateClient from './CertificateClient';

export const metadata = { title: 'Certificate · MIND SPARK' };

export default function CertificatePage() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <main className="text-muted-foreground py-20 text-center">Loading…</main>
        }
      >
        <CertificateClient />
      </Suspense>
    </SiteShell>
  );
}
