'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.replace('/admin');
    setLoading(false);
  }

  return (
    <main className="grid min-h-screen place-items-center py-14">
      <Card className="w-full max-w-md">
        <CardContent>
          <p className="eyebrow">Organizer access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Admin Login</h1>
          <p className="text-muted-foreground mt-3 mb-7 text-sm">
            Participants do not use this login. This is for quiz organizers only.
          </p>

          <form className="grid gap-5" onSubmit={submit}>
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
