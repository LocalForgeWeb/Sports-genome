export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// One-time nonce cookie that binds an OAuth login to the browser that started
// it. The `__Host-` prefix forces the cookie host-only (Secure, Path=/, no
// Domain), so a sibling *.manus.space site cannot plant a matching value in a
// victim's browser.
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";

// `state` carries the callback redirect URI (used at token exchange) plus the
// CSRF nonce. Defined here so the client encoder and server decoder never drift.
//
// `native` marks a login started from the iOS app. The nonce cookie guard the
// web flow relies on cannot work there: the login opens in an out-of-process
// ASWebAuthenticationSession, so the app's webview cookies never reach us. The
// native flow checks the nonce on the client instead (RFC 8252 s8.9) and the
// server hands the session back over the app's custom URL scheme rather than a
// cookie. See `registerOAuthRoutes` for why that is not a CSRF bypass.
export type OAuthState = { redirectUri: string; nonce?: string; native?: boolean };

export const encodeOAuthState = (state: OAuthState): string =>
  btoa(JSON.stringify(state));

export const decodeOAuthState = (state: string): OAuthState => {
  let decoded: string;
  try {
    decoded = atob(state);
  } catch {
    // Malformed base64 (e.g. attacker-supplied garbage). Return no nonce so the
    // callback's CSRF guard rejects it with 403 — never throw, since the caller
    // runs outside the request handler's try/catch.
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") {
      return {
        redirectUri: parsed.redirectUri,
        nonce: typeof parsed.nonce === "string" ? parsed.nonce : undefined,
        // Coerce rather than trust: `state` is attacker-controllable, and the
        // server branches on this flag.
        native: parsed.native === true,
      };
    }
  } catch {
    // Legacy links: `state` was a bare base64(redirectUri) with no nonce.
  }
  return { redirectUri: decoded };
};

// --- Native (iOS) auth hand-back -------------------------------------------
// The web flow ends by setting an httpOnly session cookie and redirecting to
// `/`. That cannot work in the app: the webview's origin (capacitor://localhost)
// is not the API origin, so WKWebView's tracking prevention drops the cookie.
// The native flow instead hands the session token back over the app's own URL
// scheme, and the app stores it and sends it as `Authorization: Bearer`, a path
// `sdk.authenticateRequest` already supports.
export const DEFAULT_NATIVE_APP_SCHEME = "sportsgenome";
export const NATIVE_AUTH_CALLBACK_HOST = "auth";
export const NATIVE_AUTH_CALLBACK_PATH = "/callback";
