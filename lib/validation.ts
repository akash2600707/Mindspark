import { z } from 'zod';

/**
 * Registration for MIND SPARK.
 *
 * Date of birth is no longer collected. Email is now required — it is the
 * only way organizers can reach a participant who loses their code.
 */
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(120),
  clubName: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(160),
  // Retained as optional so the older registration payload still validates.
  city: z.string().trim().max(100).optional(),
  mobile: z.string().trim().max(25).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
});

/**
 * Session minting. `participantCode` is the long secret (MM26-XXXXXXXX),
 * never the short public Challenge ID.
 */
export const joinSchema = z.object({
  participantCode: z.string().trim().min(6).max(30),
  sessionToken: z.string().trim().min(20).optional(),
});

export const answerSchema = z.object({
  participantCode: z.string().trim().min(6).max(30),
  sessionToken: z.string().trim().min(20),
  questionId: z.string().uuid(),
  selectedOption: z.enum(['A', 'B', 'C', 'D']),
});

/** Certificate lookup by public Challenge ID, e.g. VIN47 or VIN472. */
export const certificateLookupSchema = z.object({
  challengeId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}[A-Z0-9]{2,6}$/, 'Enter a valid Challenge ID, e.g. VIN47.'),
});

/** Anti-cheating telemetry emitted by the quiz page. */
export const participantEventSchema = z.object({
  participantCode: z.string().trim().min(6).max(30),
  sessionToken: z.string().trim().min(20),
  eventType: z.enum([
    'TAB_HIDDEN',
    'TAB_VISIBLE',
    'WINDOW_BLUR',
    'COPY_ATTEMPT',
    'BACK_ATTEMPT',
    'FULLSCREEN_EXIT',
  ]),
  questionId: z.string().uuid().optional(),
});
