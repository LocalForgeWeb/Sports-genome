import type { RequestHandler } from "express";

/**
 * Cross-origin access for the native iOS shell, and nothing else (iOS readiness audit, A02).
 *
 * The website calls the API from its own origin and needs no CORS at all. A native shell serves
 * the bundled app from its own origin (Capacitor's default is capacitor://localhost) and calls the
 * API across origins, so the API must say which origins may do that. They are listed exactly, in
 * NATIVE_APP_ORIGINS (comma-separated); there is no wildcard, and with the variable unset this
 * middleware does nothing, so the website behaves exactly as before.
 *
 * Mutations still have to be JSON (requireJsonMutations), which keeps a cross-site form from
 * calling one; a listed origin is only allowed to send the headers tRPC uses.
 *
 * This answers the CORS half of the native boundary only. Whether WKWebView sends the session
 * cookie cross-site, or the shell needs a bearer token held in the Keychain instead, has to be
 * settled on a device (docs/ios-readiness/native-build.md).
 */

export function parseNativeOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter((item) => {
    if (!item || item === "*" || item.includes("*")) return false;
    try {
      const url = new URL(item);
      // An origin only: scheme and host, no path. capacitor:// and ionic:// are the shells' own schemes.
      if (!["https:", "capacitor:", "ionic:"].includes(url.protocol)) return false;
      return item === `${url.protocol}//${url.host}`;
    } catch {
      return false;
    }
  })));
}

export function nativeOriginAccess(allowed: readonly string[] = parseNativeOrigins(process.env.NATIVE_APP_ORIGINS)): RequestHandler {
  const origins = new Set(allowed);
  return (req, res, next) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
    // Responses differ by origin once any origin is allowed, so caches must key on it.
    if (origins.size) res.vary("Origin");
    if (!origin || !origins.has(origin)) return next();
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "content-type, authorization, trpc-accept, x-trpc-source");
      res.setHeader("Access-Control-Max-Age", "600");
      res.status(204).end();
      return;
    }
    next();
  };
}
