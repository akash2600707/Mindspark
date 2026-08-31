'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CircleAlert, Download, Info, Search } from 'lucide-react';
import CertificatePreview, {
  type CertificateData,
} from '@/components/certificate/CertificatePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CertificateClient() {
  const params = useSearchParams();
  const [value, setValue] = useState('');
  const [data, setData] = useState<CertificateData | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (challengeId: string) => {
    setLoading(true);
    setError('');
    setPending(null);
    setData(null);
    try {
      const r = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Certificate not found');
      if (!j.ready) {
        setPending(j.message);
        return;
      }
      setData({ participant: j.participant, result: j.result });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Certificate not found');
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep link from the results page.
  useEffect(() => {
    const id = params.get('id');
    if (id) {
      setValue(id.toUpperCase());
      lookup(id.toUpperCase());
    }
  }, [params, lookup]);

  if (data) {
    return (
      <main className="py-10 sm:py-14">
        <div className="no-print mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your Certificate</p>
            <h1 className="mt-2.5 text-3xl font-semibold tracking-tight uppercase">
              {data.participant.fullName}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="gold" size="lg" onClick={() => window.print()}>
              <Download className="size-4" /> Download Certificate
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setData(null);
                setValue('');
              }}
            >
              Look up another
            </Button>
          </div>
        </div>

        <CertificatePreview data={data} />

        <p className="text-muted-foreground no-print mt-6 text-center text-sm">
          Choose &ldquo;Save as PDF&rdquo; as the destination in the print dialog. Landscape A4 is
          preselected.
        </p>
      </main>
    );
  }

  return (
    <main className="py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <p className="eyebrow">Certificate</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight uppercase sm:text-5xl">
          Get your certificate
        </h1>
        <p className="text-muted-foreground mt-4 mb-9">
          Enter the Challenge ID you received when you registered.
        </p>

        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) lookup(value.trim().toUpperCase());
          }}
        >
          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {pending && (
            <Alert variant="info">
              <Info />
              <AlertDescription>{pending}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="challengeId">Challenge ID</Label>
            <Input
              id="challengeId"
              value={value}
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              placeholder="VIN47"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={12}
              required
              className="h-16 text-center text-2xl font-bold tracking-[0.18em]"
            />
          </div>

          <Button type="submit" size="lg" disabled={loading}>
            <Search className="size-4" />
            {loading ? 'Searching…' : 'Find Certificate'}
          </Button>
        </form>

        <p className="text-muted-foreground mt-7 text-sm">
          Lost your ID?{' '}
          <Link href="/" className="decoration-gold underline underline-offset-4">
            Contact the organizers
          </Link>{' '}
          with your registered email address.
        </p>
      </div>
    </main>
  );
}
