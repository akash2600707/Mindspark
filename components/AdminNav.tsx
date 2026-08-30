'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/questions', label: 'Questions' },
  { href: '/admin/participants', label: 'Participants' },
  { href: '/admin/results', label: 'Results' },
];

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace('/admin/login');
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b py-5">
      <div className="flex flex-wrap gap-2">
        {LINKS.map((l) => (
          <Button
            key={l.href}
            asChild
            size="sm"
            variant={pathname === l.href ? 'default' : 'ghost'}
            className={cn(pathname !== l.href && 'text-muted-foreground')}
          >
            <Link href={l.href}>{l.label}</Link>
          </Button>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}
