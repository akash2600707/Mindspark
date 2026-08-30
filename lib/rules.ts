/**
 * Challenge rules, shown in the homepage modal and on /rules.
 *
 * Kept out of the client component so server components can import the array
 * itself rather than a client-reference proxy.
 */
export const RULES = [
  'One answer per question.',
  'Each question carries 1 point.',
  'Questions are controlled by the server.',
  'The timer is server controlled.',
  'Once the question ends, the answer can no longer be submitted.',
  'Participants cannot go back to previous questions.',
  'Keep the quiz window open during the challenge.',
  'Leaving the quiz window may be recorded.',
  'Do not use external assistance during the challenge.',
] as const;
