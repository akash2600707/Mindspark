'use client';

import { Button } from '@/components/ui/button';
import { useRules } from '@/components/rules/RulesModal';

/** Opens the rules dialog. There is no rules page to link to. */
export default function RulesButton() {
  const { openRules } = useRules();
  return (
    <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={openRules}>
      View Rules
    </Button>
  );
}
