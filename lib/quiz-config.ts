/**
 * MIND SPARK · International Service Quiz 2026
 *
 * Single source of truth for the event's structure, timing and grading.
 * Nothing in the app should hard-code a section name, a question count, a
 * per-question duration or an achievement threshold — import it from here.
 *
 * Changing a value here changes it everywhere, including the timings the
 * server issues for new questions.
 */

export const EVENT = {
  name: 'MIND SPARK',
  subtitle: 'International Service Quiz 2026',
  organizer: 'Rotaract Club of Madras Millennia',
  district: 'RID 3234',
  year: 2026,
} as const;

export type SectionKey = 'ROTARACT' | 'WORLD_SPORTS' | 'CURRENT_AFFAIRS';

export interface SectionConfig {
  key: SectionKey;
  /** Display name, e.g. "World & Sports" */
  label: string;
  /** Short description used on the landing page cards */
  description: string;
  /** 1-based index of this section in the run order */
  order: number;
  questionCount: number;
  points: number;
  /** Server-issued deadline length for each question in this section */
  timeLimitSeconds: number;
  /** Inclusive question_number range this section occupies */
  startNumber: number;
  endNumber: number;
}

export const SECTIONS: readonly SectionConfig[] = [
  {
    key: 'ROTARACT',
    label: 'Rotaract',
    description:
      'Questions covering Rotary, Rotaract, the movement, initiatives, service and impact.',
    order: 1,
    questionCount: 15,
    points: 15,
    timeLimitSeconds: 20,
    startNumber: 1,
    endNumber: 15,
  },
  {
    key: 'WORLD_SPORTS',
    label: 'World & Sports',
    description:
      'Questions spanning global knowledge, world events, culture and sports.',
    order: 2,
    questionCount: 15,
    points: 15,
    timeLimitSeconds: 25,
    startNumber: 16,
    endNumber: 30,
  },
  {
    key: 'CURRENT_AFFAIRS',
    label: 'Current Affairs',
    description:
      'Questions covering recent news, events and stories shaping the world.',
    order: 3,
    questionCount: 20,
    points: 20,
    timeLimitSeconds: 30,
    startNumber: 31,
    endNumber: 50,
  },
] as const;

/** Every question carries exactly 1 point. */
export const POINTS_PER_QUESTION = 1;

export const TOTAL_QUESTIONS = SECTIONS.reduce((n, s) => n + s.questionCount, 0); // 50
export const TOTAL_POINTS = SECTIONS.reduce((n, s) => n + s.points, 0); // 50

/** Advertised maximum wall-clock duration of the challenge, in minutes. */
export const MAX_DURATION_MINUTES = 25;

/**
 * Sum of every question's server-issued deadline.
 * 15x20 + 15x25 + 20x30 = 1275s ≈ 21.3 min, inside the 25 min budget.
 */
export const TOTAL_TIMED_SECONDS = SECTIONS.reduce(
  (n, s) => n + s.questionCount * s.timeLimitSeconds,
  0,
);

export function getSection(key: string | null | undefined): SectionConfig | null {
  if (!key) return null;
  return SECTIONS.find((s) => s.key === key) ?? null;
}

/** Fallback when a question row has no explicit section set. */
export function sectionForQuestionNumber(n: number): SectionConfig {
  return (
    SECTIONS.find((s) => n >= s.startNumber && n <= s.endNumber) ??
    SECTIONS[SECTIONS.length - 1]
  );
}

/**
 * Resolve a question's section, preferring the stored column and falling back
 * to its position. Always returns a section so callers never branch on null.
 */
export function resolveSection(q: {
  section?: string | null;
  question_number: number;
}): SectionConfig {
  return getSection(q.section) ?? sectionForQuestionNumber(q.question_number);
}

/**
 * The authoritative per-question duration. Used wherever the server computes
 * `question_ends_at`. A value stored on the row wins; otherwise the section
 * default applies.
 */
export function timeLimitFor(q: {
  section?: string | null;
  question_number: number;
  time_limit_seconds?: number | null;
}): number {
  if (typeof q.time_limit_seconds === 'number' && q.time_limit_seconds > 0) {
    return q.time_limit_seconds;
  }
  return resolveSection(q).timeLimitSeconds;
}

/** True when this question is the last one in its section. */
export function isSectionBoundary(questionNumber: number): boolean {
  return SECTIONS.some((s) => s.endNumber === questionNumber);
}

// ---------------------------------------------------------------
// Achievement tiers
// ---------------------------------------------------------------

export type AchievementKey = 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPATION';

export interface AchievementTier {
  key: AchievementKey;
  label: string;
  min: number;
  max: number;
  /** Certificate + badge treatment */
  color: string;
}

export const ACHIEVEMENT_TIERS: readonly AchievementTier[] = [
  { key: 'GOLD', label: 'Gold', min: 40, max: 50, color: '#C47F1E' },
  { key: 'SILVER', label: 'Silver', min: 30, max: 39, color: '#8A8F9A' },
  { key: 'BRONZE', label: 'Bronze', min: 20, max: 29, color: '#A9673A' },
  { key: 'PARTICIPATION', label: 'Participation', min: 0, max: 19, color: '#00133B' },
] as const;

export function achievementForScore(score: number): AchievementTier {
  return (
    ACHIEVEMENT_TIERS.find((t) => score >= t.min && score <= t.max) ??
    ACHIEVEMENT_TIERS[ACHIEVEMENT_TIERS.length - 1]
  );
}

export function getAchievement(key: string | null | undefined): AchievementTier {
  return (
    ACHIEVEMENT_TIERS.find((t) => t.key === key) ??
    ACHIEVEMENT_TIERS[ACHIEVEMENT_TIERS.length - 1]
  );
}

/** Landing-page metadata strip. */
export const CHALLENGE_STATS = [
  { value: String(TOTAL_QUESTIONS), label: 'Questions' },
  { value: String(SECTIONS.length), label: 'Sections' },
  { value: String(TOTAL_POINTS), label: 'Points' },
  { value: String(MAX_DURATION_MINUTES), label: 'Minutes' },
] as const;
