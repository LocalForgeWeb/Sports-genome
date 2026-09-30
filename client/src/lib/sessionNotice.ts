import { useSyncExternalStore } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { accountSignInAvailable } from "@/lib/accountAccess";
import { expiryNotice, isExpiryError } from "@/lib/sessionExpiryNotice";

/**
 * "You're signed out of your account": said once per lapse, never on a timer (Sep 28
 * regression brief §7).
 *
 * The notice used to fire on any UNAUTHORIZED answer, held back only by a 60 s window kept
 * in module state. So it came back on every About me visit, tab refocus and reload once the
 * minute was up, and it told a device-store athlete who had never signed in that their
 * sign-in had "expired". It had no close button, and on a phone a tap on it paused its
 * timer until the next tap elsewhere.
 *
 * Now it follows the sign-in itself:
 * - It fires only when the auth.me cache holds a user and a protected call is then refused.
 *   On the device store auth.me is always null, so a stray protected call can never raise it.
 * - It fires once per lapse. The latch clears only when auth.me next answers with a user,
 *   and the notice is dismissed then too.
 * - It carries a close button and one action: "Sign in" where this build has a sign-in
 *   screen, otherwise "Account & sync", which opens About me on that group.
 * - While latched, About me's Account & sync row and a dot on the Profile button say so
 *   (useSessionLapsed); that is the lasting status, not the toast.
 *
 * auth.me is never overwritten with null here: accountId comes from it, and clearing it
 * would hide the account's plan mid-session. What is written during a lapse stays in this
 * device's account-scoped records.
 */

/** The same id as the per-control messages (lib/sessionExpiryNotice.ts), which replace it. */
export const sessionNoticeId = expiryNotice.id;
const authMeKey = [["auth", "me"]];
const isAuthMe = (queryKey: readonly unknown[]) => JSON.stringify(queryKey[0]) === JSON.stringify(authMeKey[0]);

export const isUnauthorized = isExpiryError;

export type SessionNoticeToast = {
  show: (title: string, options: { id: string; description: string; closeButton: boolean; duration: number; action: { label: string; onClick: () => void } }) => void;
  dismiss: (id: string) => void;
};

export type SessionNotice = {
  onError: (error: unknown) => void;
  isLapsed: () => boolean;
  subscribe: (listener: () => void) => () => void;
  /** Where "Account & sync" goes. Home registers it; without it the action does nothing. */
  setOpenAccount: (open: (() => void) | null) => void;
  dispose: () => void;
};

export function createSessionNotice(queryClient: QueryClient, notify: SessionNoticeToast = { show: (title, options) => toast(title, options), dismiss: (id) => toast.dismiss(id) }): SessionNotice {
  let lapsed = false;
  let openAccount: (() => void) | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const signedIn = () => queryClient.getQueriesData({ queryKey: authMeKey }).some(([, data]) => Boolean(data));

  const onError = (error: unknown) => {
    if (!isUnauthorized(error) || lapsed || !signedIn()) return;
    lapsed = true;
    notify.show(expiryNotice.title, {
      id: sessionNoticeId,
      description: accountSignInAvailable
        ? `${expiryNotice.description} Sign in to sync them.`
        : `${expiryNotice.description} This version can't sign in again, so account sync has stopped.`,
      closeButton: true,
      duration: 8000,
      action: accountSignInAvailable
        // auth.me answers null now, so Home shows its sign-in screen; nothing else is rebuilt.
        ? { label: "Sign in", onClick: () => { void queryClient.invalidateQueries({ queryKey: authMeKey }); } }
        : { label: "Account & sync", onClick: () => openAccount?.() },
    });
    emit();
  };

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (!lapsed || event.type !== "updated" || event.action.type !== "success" || !isAuthMe(event.query.queryKey)) return;
    if (!event.query.state.data) return;
    lapsed = false;
    notify.dismiss(sessionNoticeId);
    emit();
  });

  return {
    onError,
    isLapsed: () => lapsed,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setOpenAccount: (open) => { openAccount = open; },
    dispose: unsubscribe,
  };
}

/**
 * The one instance the app runs, installed by main.tsx beside its QueryClient. Installing
 * again (a hot reload) disposes the previous one first, so no second cache listener survives
 * to raise or restore the notice.
 */
let current: SessionNotice | null = null;
const noop = () => () => {};
export function installSessionNotice(queryClient: QueryClient) {
  current?.dispose();
  current = createSessionNotice(queryClient);
  return current;
}
export const sessionNotice = () => current;

/** True from a lapse until auth.me next answers with a user. */
export function useSessionLapsed() {
  return useSyncExternalStore(current?.subscribe ?? noop, () => current?.isLapsed() ?? false, () => false);
}
