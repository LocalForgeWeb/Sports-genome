import type { Express, NextFunction, Request, Response } from "express";
import { ENV } from "./env";

/**
 * Cross-origin access for the native app.
 *
 * On web the SPA and the API are the same origin and no CORS headers are needed
 * — requests without an `Origin` header fall straight through untouched.
 *
 * The iOS app's webview serves the bundle from `capacitor://localhost`, so every
 * API call is cross-origin. Only the fixed native origins plus anything
 * explicitly listed in `ALLOWED_ORIGINS` are echoed back; unknown origins get no
 * CORS headers at all, which is what makes the browser block them.
 */
const NATIVE_ORIGINS = [
  "capacitor://localhost", // iOS
  "http://localhost", // Android WebView, and `npx cap run` livereload
  "ionic://localhost", // legacy Capacitor scheme
];

function isAllowedOrigin(origin: string): boolean {
  return (
    NATIVE_ORIGINS.includes(origin) || ENV.extraAllowedOrigins.includes(origin)
  );
}

export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const origin = req.headers.origin;

  if (typeof origin !== "string" || !isAllowedOrigin(origin)) {
    // Same-origin web request, or an origin we do not trust. Either way, no
    // CORS headers — never fall back to a wildcard, which would be unusable
    // with credentials anyway.
    next();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  // Origin-dependent response: without this a shared cache could serve one
  // origin's headers to another.
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}

export function registerCors(app: Express): void {
  app.use(corsMiddleware);
}
