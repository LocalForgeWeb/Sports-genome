import { Preferences } from "@capacitor/preferences";
import { COOKIE_NAME } from "@shared/const";
import { isNativePlatform } from "./platform";

/**
 * Session token storage.
 *
 * Web keeps exactly the behaviour it had before: the httpOnly cookie is the real
 * session, and the only token we ever read is the `manus-cookie` sessionStorage
 * mirror the preview runtime writes when a browser blocks iframe cookies.
 *
 * Native has no cookie at all — the token handed back by the OAuth deep link is
 * the whole session, so it has to persist across app launches.
 *
 * SECURITY NOTE: `@capacitor/preferences` is backed by `UserDefaults`, which is
 * included in device backups and is only protected by the device's own file
 * protection. That is acceptable for a training log but not ideal. Hardening
 * this to the iOS Keychain means replacing the two functions below
 * (`readNativeToken` / `writeNativeToken`) with a Keychain plugin — nothing else
 * in the app touches storage directly.
 */
const NATIVE_TOKEN_KEY = "session-token";
const WEB_MIRROR_KEY = "manus-cookie";

// Cached in memory so `headers()` on every tRPC request stays synchronous.
let cachedToken: string | null = null;

async function readNativeToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: NATIVE_TOKEN_KEY });
  return value ?? null;
}

async function writeNativeToken(token: string | null): Promise<void> {
  if (token === null) {
    await Preferences.remove({ key: NATIVE_TOKEN_KEY });
    return;
  }
  await Preferences.set({ key: NATIVE_TOKEN_KEY, value: token });
}

/**
 * Preview auto-login fallback, unchanged from the original inline implementation
 * in `main.tsx`: when the browser blocks iframe cookies (Safari ITP, private
 * browsing, WebView), the runtime mirrors the session into sessionStorage.
 */
function readWebMirrorToken(): string | null {
  try {
    const raw = sessionStorage.getItem(WEB_MIRROR_KEY);
    if (!raw) return null;

    const prefix = `${COOKIE_NAME}=`;
    const pair = raw.split(";").find(entry => entry.trim().startsWith(prefix));
    return pair?.trim().slice(prefix.length) || null;
  } catch {
    // sessionStorage unavailable
    return null;
  }
}

/**
 * Hydrate the in-memory token. Call once before the first render so the very
 * first query already carries credentials — otherwise it 401s and bounces the
 * user into a login they do not need.
 */
export async function loadAuthToken(): Promise<string | null> {
  cachedToken = isNativePlatform()
    ? await readNativeToken()
    : readWebMirrorToken();
  return cachedToken;
}

/** Synchronous read of the hydrated token, for use in request headers. */
export function getAuthToken(): string | null {
  // Web re-reads each time: the preview runtime can populate the mirror after
  // startup, and the read is a cheap sessionStorage hit.
  if (!isNativePlatform()) return readWebMirrorToken();
  return cachedToken;
}

export async function setAuthToken(token: string): Promise<void> {
  cachedToken = token;
  if (isNativePlatform()) await writeNativeToken(token);
}

export async function clearAuthToken(): Promise<void> {
  cachedToken = null;
  if (isNativePlatform()) await writeNativeToken(null);
}

/** Header block for tRPC requests. Empty on web when the cookie is doing its job. */
export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
