import crypto from 'crypto';

/**
 * Long, unguessable code minted at registration.
 *
 * This is the participant's SECRET. It is what /api/join accepts to mint a
 * session, so it must not be brute-forceable — 4 random bytes of entropy on
 * top of a fixed prefix. The short Challenge ID is deliberately NOT usable
 * for this purpose.
 */
export function participantCode() {
  return `MM26-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function sessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Public Challenge ID: first three letters of the name + two digits (VIN47).
 *
 * This is a DISPLAY and certificate-lookup identifier only. It is short and
 * therefore guessable, which is why it never grants a session.
 *
 * Uniqueness is NOT guaranteed by this function — the caller must retry
 * against the database's unique index. See `generateUniqueChallengeId`.
 */
export function challengeId(fullName: string, digits = 2): string {
  const letters = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accents
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();

  // Pad short or non-Latin names so the prefix is always three characters.
  const stem = (letters + 'XXX').slice(0, 3);

  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return stem + String(n).padStart(digits, '0');
}

/**
 * Mint a Challenge ID that does not already exist.
 *
 * A three-letter stem has only 100 two-digit slots, and common first names
 * collide heavily at a 1,000-participant event. After exhausting the
 * two-digit attempts we widen to three digits (VIN472), which gives the same
 * stem 1,000 slots. The database's unique index is the real guarantee; this
 * loop just avoids hitting it.
 *
 * @param exists callback that reports whether an id is already taken
 */
export async function generateUniqueChallengeId(
  fullName: string,
  exists: (id: string) => Promise<boolean>,
): Promise<string> {
  const attempts: Array<{ digits: number; tries: number }> = [
    { digits: 2, tries: 40 },
    { digits: 3, tries: 40 },
    { digits: 4, tries: 20 },
  ];

  for (const { digits, tries } of attempts) {
    for (let i = 0; i < tries; i++) {
      const id = challengeId(fullName, digits);
      if (!(await exists(id))) return id;
    }
  }

  // Every stem is saturated to 4 digits, which should be unreachable.
  // Fall back to raw entropy rather than failing a live registration.
  return challengeId(fullName, 2).slice(0, 3) + crypto.randomBytes(3).toString('hex').toUpperCase();
}
