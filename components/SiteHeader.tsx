'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import MindSparkLogo from './branding/MindSparkLogo';
import { Button } from '@/components/ui/button';
import { useRules } from '@/components/rules/RulesModal';
import { TOTAL_QUESTIONS, MAX_DURATION_MINUTES } from '@/lib/quiz-config';

/**
 * Participant-facing navigation.
 *
 * "Register" is deliberately absent — START CHALLENGE is the single primary
 * CTA. "Rules" opens the dialog rather than navigating; there is no rules page.
 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { openRules } = useRules();

  const showRules = () => {
    setOpen(false);
    openRules();
  };

  return (
    <header>
      <nav className="flex items-center justify-between gap-6 border-b py-5" aria-label="Primary">
        <Link href="/" aria-label="MIND SPARK home" className="shrink-0">
          <MindSparkLogo size="md" priority />
        </Link>

        <span className="text-muted-foreground hidden text-[11px] font-medium tracking-[0.2em] whitespace-nowrap uppercase lg:inline">
          {TOTAL_QUESTIONS} Questions · {MAX_DURATION_MINUTES} Minutes
        </span>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" onClick={showRules}>
            Rules
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/certificate">Certificate</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Start Challenge</Link>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="grid gap-2 border-b py-4 md:hidden [&:not([hidden])]:animate-in [&:not([hidden])]:fade-in-0"
      >
        <Button variant="ghost" className="justify-start" onClick={showRules}>
          Rules
        </Button>
        <Button variant="ghost" className="justify-start" asChild>
          <Link href="/certificate" onClick={() => setOpen(false)}>
            Certificate
          </Link>
        </Button>
        <Button asChild>
          <Link href="/register" onClick={() => setOpen(false)}>
            Start Challenge
          </Link>
        </Button>
      </div>
    </header>
  );
}
