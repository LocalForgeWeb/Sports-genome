/**
 * The words of a lapsed sign-in, shared by the app-wide notice (lib/sessionNotice.ts) and by
 * the controls whose own save was refused, which replace that notice with what the refusal
 * cost them ("This lift was not saved…"). One toast id, so the two never stack.
 *
 * When to say it is lib/sessionNotice.ts's job: only after auth.me has answered with an
 * account, once per lapse (Sep 28 regression brief §7). This module used to decide that too,
 * with a flag set by useAuth and a 60-second window; the notice then returned every minute.
 */
export const expiryNotice = {
  id: "session-expired",
  title: "You're signed out of your account",
  description: "Changes you make are kept on this device.",
} as const;

export function isExpiryError(error: unknown): boolean {
  return (error as { data?: { code?: string } } | null)?.data?.code === "UNAUTHORIZED";
}
