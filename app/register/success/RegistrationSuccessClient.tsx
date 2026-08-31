'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Challenge ID reveal.
 *
 * Reads from sessionStorage (written by the registration form). The `code`
 * query parameter is still honoured so links produced by the previous version
 * of this flow keep working, but nothing sensitive is ever put in the URL.
 */
export default function RegistrationSuccessClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem('challenge_id') || params.get('code');
    if (!id) {
      router.replace('/register');
      return;
    }
    setChallengeId(id);
    setName(sessionStorage.getItem('participant_name'));
    setRecovery(sessionStorage.getItem('participant_code'));
  }, [params, router]);

  if (!challengeId) return null;

  return (
    <main className="py-14 sm:py-20">
      <div className="enter mx-auto max-w-xl">
        <p className="eyebrow text-center">You&rsquo;re registered</p>

        <Card className="border-gold/40 mt-6 text-center">
          <CardContent>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
              Your Challenge ID
            </p>
            <p className="text-navy my-5 text-6xl font-extrabold tracking-widest sm:text-7xl">
              {challengeId}
            </p>
            <div className="bg-gold/60 mx-auto mb-5 h-px w-32" aria-hidden="true" />
            <p className="text-muted-foreground text-[15px]">
              {name ? `${name}, keep ` : 'Keep '}this ID safe. You&rsquo;ll use it to access your
              certificate.
            </p>
          </CardContent>
        </Card>

        {recovery && (
          <Card className="mt-5">
            <CardContent>
              <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
                Recovery code
              </p>
              <p className="text-muted-foreground mt-2.5 mb-4 text-sm">
                If you close this browser or switch devices, this is what gets you back into the
                challenge. Your Challenge ID alone cannot restore a session.
              </p>
              <Separator className="mb-4" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <code className="bg-secondary rounded-xl border border-dashed px-4 py-3 font-mono text-sm tracking-widest break-all">
                  {recovery}
                </code>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(recovery);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      /* clipboard blocked — the code is visible on screen anyway */
                    }
                  }}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/waiting">
              Enter Waiting Room <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
