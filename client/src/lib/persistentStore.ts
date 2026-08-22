import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "./platform";

/**
 * Small async key/value store for data that must survive an app relaunch:
 * the pending-write outbox and the active session snapshot.
 *
 * Native uses `Preferences` (UserDefaults); web uses `localStorage`. The async
 * signature is native's, and web simply resolves immediately — callers never
 * branch on platform.
 *
 * Nothing stored here is secret. Session tokens go through `authToken.ts`,
 * which is documented separately.
 */
export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = isNativePlatform()
      ? (await Preferences.get({ key })).value
      : localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Unparseable or unavailable storage. Treating it as empty is always safe
    // here: the outbox re-queues and the session snapshot refetches.
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    const raw = JSON.stringify(value);
    if (isNativePlatform()) {
      await Preferences.set({ key, value: raw });
      return;
    }
    localStorage.setItem(key, raw);
  } catch {
    // Quota exhausted or storage disabled. The in-memory copy still works for
    // this session; only durability across a relaunch is lost.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    if (isNativePlatform()) {
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  } catch {
    // Nothing to do — the key is unreachable either way.
  }
}
