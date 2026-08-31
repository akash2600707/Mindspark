'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) router.replace('/admin/login');
        else setReady(true);
      });
  }, [router]);

  if (!ready) {
    return (
      <main className="text-muted-foreground grid min-h-screen place-items-center">
        Checking admin session…
      </main>
    );
  }
  return <>{children}</>;
}
