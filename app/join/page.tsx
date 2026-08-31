'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import SiteShell from '@/components/SiteShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Reconnect flow.
 *
 * Takes the long recovery code (MM26-XXXXXXXX), not the short Challenge ID —
 * this endpoint mints a session, so it must not accept a guessable value.
 * Kept at /join so any links handed out before the redesign still work.
 */
export default function Join() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ participantCode: code.trim().toUpperCase() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Unable to rejoin');

      sessionStorage.setItem('participant_session', j.sessionToken);
      sessionStorage.setItem('participant_code', j.participantCode);
      sessionStorage.setItem('participant_name', j.fullName);
      if (j.challengeId) sessionStorage.setItem('challenge_id', j.challengeId);

      router.push(j.status === 'LIVE' ? '/quiz' : '/waiting');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to rejoin');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <main className="py-14 sm:py-20">
        <div className="mx-auto max-w-md">
          <p className="eyebrow">Event day</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight uppercase sm:text-5xl">
            Rejoin the challenge
          </h1>
          <p className="text-muted-foreground mt-4 mb-9">
            Enter the recovery code shown when you registered. This is the long code beginning
            MM26 — not your short Challenge ID.
          </p>

          <form className="grid gap-5" onSubmit={submit}>
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="code">Recovery Code</Label>
              <Input
                id="code"
                required
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="MM26-XXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Rejoining…' : 'Rejoin'}
            </Button>
          </form>

          <p className="text-muted-foreground mt-7 text-sm">
            Haven&rsquo;t registered yet?{' '}
            <Link href="/register" className="decoration-gold underline underline-offset-4">
              Start the challenge
            </Link>
            .
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
