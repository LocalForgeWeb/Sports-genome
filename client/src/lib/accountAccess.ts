/**
 * Temporary product-access switch. With it on, the workspace opens straight onto the device
 * store and no sign-in screen is shown; the email/password and passkey implementation remains
 * intact and comes back by setting this to false.
 *
 * Here rather than in Home.tsx because the sign-in notice (lib/sessionNotice.ts) has to know
 * whether "Sign in" is something the athlete can actually do in this build.
 */
export const directWorkspaceAccess = true;

/** Whether this build shows a sign-in screen at all. */
export const accountSignInAvailable = !directWorkspaceAccess;
