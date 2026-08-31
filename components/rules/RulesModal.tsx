'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CHALLENGE_STATS } from '@/lib/quiz-config';
import { RULES } from '@/lib/rules';

const ACK_KEY = 'mindspark_rules_ack';

const RulesContext = createContext<{ openRules: () => void }>({ openRules: () => {} });

/** Lets any component (e.g. the nav) open the rules dialog. */
export function useRules() {
  return useContext(RulesContext);
}

/**
 * Rules dialog.
 *
 * There is no /rules page — this is the only place the rules live. It opens
 * automatically on a first visit and can be reopened from the navigation at
 * any time. Acknowledgement is remembered in localStorage so a refresh does
 * not re-interrupt someone who has already read it.
 *
 * Radix Dialog handles focus trapping, Escape, scroll locking and aria wiring.
 */
export function RulesProvider({
  children,
  autoOpen = false,
}: {
  children: React.ReactNode;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!autoOpen) return;
    try {
      if (!localStorage.getItem(ACK_KEY)) setOpen(true);
    } catch {
      // Private browsing or blocked storage: show it, just don't remember.
      setOpen(true);
    }
  }, [autoOpen]);

  const acknowledge = useCallback(() => {
    try {
      localStorage.setItem(ACK_KEY, String(Date.now()));
    } catch {
      /* nothing to do — the dialog simply reappears next visit */
    }
  }, []);

  const openRules = useCallback(() => setOpen(true), []);

  return (
    <RulesContext.Provider value={{ openRules }}>
      {children}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) acknowledge();
        }}
      >
        {/* Wider than the shadcn default so the rule list reads comfortably;
            the dialog itself scrolls when the viewport is short. */}
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <p className="eyebrow">Before you begin</p>
            <DialogTitle className="text-3xl sm:text-4xl">The Rules</DialogTitle>
            <DialogDescription className="sr-only">
              Challenge format and rules for MIND SPARK.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CHALLENGE_STATS.map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-2xl border px-4 py-4 text-center shadow-sm"
              >
                <p className="text-navy text-3xl font-semibold">{s.value}</p>
                <p className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          <ul className="grid gap-3">
            {RULES.map((r) => (
              <li key={r} className="text-foreground/80 flex gap-3 text-[15px] leading-relaxed">
                <span className="bg-gold mt-2 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button asChild size="lg" onClick={acknowledge}>
              <Link href="/register">
                Register &amp; Start Challenge <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RulesContext.Provider>
  );
}
