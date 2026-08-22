import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Preferences } from "@capacitor/preferences";
import {
  DEFAULT_NATIVE_APP_SCHEME,
  NATIVE_AUTH_CALLBACK_HOST,
  encodeOAuthState,
} from "@shared/const";
import { apiUrl } from "./apiBase";
import { setAuthToken } from "./authToken";
import { isNativePlatform } from "./platform";

/**
 * Native OAuth.
 *
 * The web flow (see `client/src/const.ts`) navigates the page to the Manus
 * portal and finishes with an httpOnly cookie on our own origin. Neither half
 * survives in the app: there is no page to navigate, and the webview origin is
 * `capacitor://localhost`, which is cross-site to the API.
 *
 * So the app opens the portal in an in-app browser tab
 * (SFSafariViewController via `@capacitor/browser`) and the server hands the
 * session back through a custom URL scheme the app registers. Apple treats an
 * in-app browser tab as an acceptable OAuth surface; a raw webview would not be.
 *
 * CSRF: the web flow binds a login to the browser that started it with a
 * one-time `__Host-` nonce cookie. That cookie cannot reach us here — the login
 * runs out-of-process — so the nonce round-trips through the deep link and is
 * verified on this side instead, which is the check RFC 8252 s8.9 prescribes for
 * native clients.
 */
const PENDING_NONCE_KEY = "oauth-pending-nonce";

const appScheme = (): string =>
  (import.meta.env.VITE_NATIVE_APP_SCHEME || DEFAULT_NATIVE_APP_SCHEME).trim();

// Re-entrancy guard. `startLogin()` is called from the query-cache error handler
// in main.tsx, so a batch of failing requests calls it several times in a row.
// On web that self-limits — the first call navigates the page away. Here it
// would stack up browser tabs AND overwrite the pending nonce, desyncing it from
// the login already in flight so the eventual callback gets rejected.
let loginInFlight = false;

/** Begin a login from the iOS app. Side-effecting; call from an event handler. */
export async function startNativeLogin(): Promise<void> {
  if (loginInFlight) return;
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!oauthPortalUrl || !appId) {
    console.error(
      "[nativeAuth] VITE_OAUTH_PORTAL_URL / VITE_APP_ID missing; cannot start login."
    );
    return;
  }

  loginInFlight = true;

  // The portal only ever redirects to the registered https callback. The hop to
  // the app happens afterwards, server-side.
  const redirectUri = apiUrl("/api/oauth/callback");

  const nonce = crypto.randomUUID();
  await Preferences.set({ key: PENDING_NONCE_KEY, value: nonce });

  const state = encodeOAuthState({ redirectUri, nonce, native: true });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  try {
    await Browser.open({ url: url.toString(), presentationStyle: "popover" });
  } catch (error) {
    // The tab never opened, so nothing will ever clear the guard for us.
    loginInFlight = false;
    throw error;
  }
}

function parseCallback(url: string): {
  token: string | null;
  nonce: string | null;
} {
  const parsed = new URL(url);

  // Token and nonce ride in the fragment: fragments are not written to server
  // access logs or Referer headers on the way through.
  const params = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  return { token: params.get("token"), nonce: params.get("nonce") };
}

async function consumePendingNonce(): Promise<string | null> {
  const { value } = await Preferences.get({ key: PENDING_NONCE_KEY });
  await Preferences.remove({ key: PENDING_NONCE_KEY });
  return value ?? null;
}

/**
 * Register the deep link handler that completes a native login. Call once at
 * startup. `onAuthenticated` runs after the token is persisted so the caller can
 * refetch anything that failed while logged out.
 */
export async function registerNativeAuthListener(
  onAuthenticated: () => void
): Promise<void> {
  if (!isNativePlatform()) return;

  // Dismissing the tab without finishing (user hit Done, or the portal errored)
  // must release the guard, or login is dead until the app restarts.
  await Browser.addListener("browserFinished", () => {
    loginInFlight = false;
  });

  await App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(event.url);
    } catch {
      return;
    }

    const isAuthCallback =
      parsedUrl.protocol === `${appScheme()}:` &&
      parsedUrl.host === NATIVE_AUTH_CALLBACK_HOST;
    if (!isAuthCallback) return;

    // Dismiss the browser tab regardless of outcome so the user is never left
    // staring at a blank page.
    loginInFlight = false;
    await Browser.close().catch(() => {});

    const { token, nonce } = parseCallback(event.url);
    const expectedNonce = await consumePendingNonce();

    if (!token) {
      console.error("[nativeAuth] Callback carried no token.");
      return;
    }

    if (!nonce || !expectedNonce || nonce !== expectedNonce) {
      // Either a stale callback or a link this app did not initiate. Dropping it
      // is the whole point of the nonce.
      console.error("[nativeAuth] Rejected auth callback: nonce mismatch.");
      return;
    }

    await setAuthToken(token);
    onAuthenticated();
  });
}
