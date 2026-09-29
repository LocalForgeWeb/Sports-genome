/**
 * When to tell the athlete their sign-in has expired.
 *
 * A lapse needs a sign-in to have existed. The device workspace
 * (`directWorkspaceAccess` in Home.tsx) has no sign-in anywhere, so a refused
 * account-only request there means "no account", not "expired", and saying
 * otherwise sends the athlete looking for a sign-in that is not there. So the
 * notice waits until `auth.me` has answered with a real account in this visit
 * (useAuth marks it), forgets it on sign-out, and speaks at most once a minute.
 */
let sessionSeen = false;
let lastNoticeAt = Number.NEGATIVE_INFINITY;

const NOTICE_GAP_MS = 60_000;

/**
 * The words of the notice. It says nothing about signing in again: this build has no
 * sign-in control for the athlete to go to, so the only promise it makes is the true
 * one, that nothing on the device is lost.
 */
export const expiryNotice = {
  title: "Your sign-in has expired",
  description: "Everything stays saved on this device.",
} as const;

export function isExpiryError(error: unknown): boolean {
  return (error as { data?: { code?: string } } | null)?.data?.code === "UNAUTHORIZED";
}

/** `auth.me` answered with an account: a later refusal really is a lapse. */
export function markSessionSeen(): void {
  sessionSeen = true;
}

/** The athlete signed out on purpose; a refusal after that is not news. */
export function forgetSession(): void {
  sessionSeen = false;
}

export function shouldNoticeExpiry(error: unknown, now = Date.now()): boolean {
  if (!isExpiryError(error)) return false;
  if (!sessionSeen) return false;
  if (now - lastNoticeAt < NOTICE_GAP_MS) return false;
  lastNoticeAt = now;
  return true;
}

export function resetSessionExpiryNoticeForTests(): void {
  sessionSeen = false;
  lastNoticeAt = Number.NEGATIVE_INFINITY;
}
