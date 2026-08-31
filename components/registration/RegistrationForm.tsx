'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Fields {
  fullName: string;
  designation: string;
  clubName: string;
  email: string;
}

const EMPTY: Fields = { fullName: '', designation: '', clubName: '', email: '' };

// Stricter than a bare "@" check, but not so strict that it rejects valid
// addresses. The server re-validates with zod regardless.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function validate(f: Fields) {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (f.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (f.designation.trim().length < 2) errors.designation = 'Enter your designation.';
  if (f.clubName.trim().length < 2) errors.clubName = 'Enter your club name.';
  if (!EMAIL_RE.test(f.email.trim())) errors.email = 'Enter a valid email address.';
  return errors;
}

export default function RegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Registration failed');

      // The session is minted server-side at registration, so the participant
      // goes straight into the waiting room without re-entering a code.
      sessionStorage.setItem('participant_code', j.participantCode);
      sessionStorage.setItem('participant_session', j.sessionToken);
      sessionStorage.setItem('participant_name', j.fullName);
      sessionStorage.setItem('challenge_id', j.challengeId);

      router.push('/register/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const field = (
    key: keyof Fields,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="grid gap-2">
      <Label htmlFor={key}>{label} *</Label>
      <Input
        id={key}
        name={key}
        required
        value={form[key]}
        onChange={set(key)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        {...extra}
      />
      {errors[key] && (
        <p className="text-destructive text-sm" id={`${key}-error`} role="alert">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {field('fullName', 'Full Name', { maxLength: 120, autoComplete: 'name' })}
      {field('designation', 'Designation', {
        maxLength: 120,
        autoComplete: 'organization-title',
        placeholder: 'e.g. President, Secretary, Member',
      })}
      {field('clubName', 'Club Name', { maxLength: 160, autoComplete: 'organization' })}
      {field('email', 'Email Address', {
        type: 'email',
        maxLength: 160,
        autoComplete: 'email',
        inputMode: 'email',
      })}

      <Button type="submit" size="lg" disabled={loading} className="mt-2 justify-self-start">
        {loading ? 'Registering…' : 'Continue'}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
