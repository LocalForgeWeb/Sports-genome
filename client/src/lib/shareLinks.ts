import type { ShareSnapshot } from "@shared/workoutShare";

/**
 * What this device remembers about sharing.
 *
 * Links it created ("Shared by you"): each with the secret only this device holds,
 * which is what lets it turn the link off or publish a new version. Links it saved
 * from: so a second Save shows "already saved" instead of quietly making a second
 * copy. And a save in progress: the shared workout a recipient chose to save, kept
 * for the length of the visit so it survives onboarding before it lands in the plan.
 *
 * All of it is optional: storage can be full, blocked or cleared, and every reader
 * here returns an empty answer rather than throwing.
 */
const OWNED_KEY = "sg-shared-by-me-v1";
const SAVED_KEY = "sg-saved-shares-v1";
const PENDING_KEY = "sg-pending-shared-save-v1";

export type OwnedShareRecord = {
  token: string;
  manageSecret: string;
  title: string;
  scope: "day" | "week";
  version: number;
  createdAt: string;
  exerciseCount: number;
  dayCount: number;
  /** The plan day or week it was made from ("w1:day:0-Push", "w1:week"), for publishing an update. */
  sourceKey?: string;
  /** Set on this device when it turned the link off. The server is the authority. */
  disabledAt?: string;
};

export type SavedShareRecord = { token: string; savedAt: string; destination: string; week: number; slotIndex: number };
export type PendingSharedSave = { token: string; version: number; snapshot: ShareSnapshot };

/** URL-safe random text from the platform's cryptographic source. */
export function randomKey(bytes = 24): string {
  const values = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(values);
  let binary = "";
  values.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function shareUrl(token: string, origin = typeof window === "undefined" ? "" : window.location.origin): string {
  return `${origin}/s/${token}`;
}

function read<T>(storage: Storage | undefined, key: string, fallback: T): T {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function write(storage: Storage | undefined, key: string, value: unknown) {
  try { storage?.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked: nothing to keep */ }
}
const local = () => (typeof window === "undefined" ? undefined : window.localStorage);
const session = () => (typeof window === "undefined" ? undefined : window.sessionStorage);

export function ownedShares(): OwnedShareRecord[] {
  const list = read<OwnedShareRecord[]>(local(), OWNED_KEY, []);
  return Array.isArray(list) ? list.filter((item) => item && typeof item.token === "string" && typeof item.manageSecret === "string") : [];
}
export function rememberOwnedShare(record: OwnedShareRecord) {
  write(local(), OWNED_KEY, [record, ...ownedShares().filter((item) => item.token !== record.token)].slice(0, 50));
}
export function markOwnedShareDisabled(token: string, at = new Date().toISOString()) {
  write(local(), OWNED_KEY, ownedShares().map((item) => (item.token === token ? { ...item, disabledAt: at } : item)));
}
export function forgetOwnedShare(token: string) {
  write(local(), OWNED_KEY, ownedShares().filter((item) => item.token !== token));
}

export function savedShare(token: string): SavedShareRecord | null {
  const saved = read<Record<string, SavedShareRecord>>(local(), SAVED_KEY, {});
  return saved && typeof saved === "object" ? saved[token] ?? null : null;
}
export function rememberSavedShare(record: SavedShareRecord) {
  const saved = read<Record<string, SavedShareRecord>>(local(), SAVED_KEY, {});
  write(local(), SAVED_KEY, { ...(saved && typeof saved === "object" ? saved : {}), [record.token]: record });
}

export function pendingSharedSave(): PendingSharedSave | null {
  const pending = read<PendingSharedSave | null>(session(), PENDING_KEY, null);
  return pending && typeof pending.token === "string" && pending.snapshot ? pending : null;
}
export function setPendingSharedSave(pending: PendingSharedSave | null) {
  if (!pending) { try { session()?.removeItem(PENDING_KEY); } catch { /* nothing kept */ } return; }
  write(session(), PENDING_KEY, pending);
}
