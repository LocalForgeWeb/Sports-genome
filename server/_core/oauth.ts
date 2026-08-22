import {
  COOKIE_NAME,
  NATIVE_AUTH_CALLBACK_HOST,
  NATIVE_AUTH_CALLBACK_PATH,
  ONE_YEAR_MS,
  OAUTH_STATE_COOKIE,
  decodeOAuthState,
} from "@shared/const";
import { ENV } from "./env";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    const { nonce, native } = decodeOAuthState(state);

    if (native) {
      // Native logins run in an out-of-process browser tab, so the app's cookies
      // never reach us and the cookie guard below cannot apply. The nonce still
      // round-trips: it goes back out on the deep link and the app rejects any
      // callback whose nonce it did not mint (RFC 8252 s8.9).
      //
      // This is not a way to bypass the web guard. The native branch sets no
      // cookie, so it cannot log a victim's browser into an attacker's account.
      // It only ever redirects to ENV.nativeAppScheme — a server-side value —
      // so `state` cannot steer the token to an attacker-controlled scheme.
      if (!nonce) {
        res.status(403).json({ error: "invalid oauth state" });
        return;
      }
    } else {
      // CSRF guard: the nonce in `state` must match the one-time cookie that
      // startLogin set in the browser that began this login. An attacker can
      // forge `state`, but cannot plant this cookie in the victim's browser.
      const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
      if (!nonce || nonce !== expectedNonce) {
        res.status(403).json({ error: "invalid oauth state" });
        return;
      }
      res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      if (native) {
        // Hand the session back to the app over its own URL scheme. The token
        // rides in the fragment so it stays out of server access logs and
        // Referer headers on the way through.
        const params = new URLSearchParams({ token: sessionToken, nonce });
        const target =
          `${ENV.nativeAppScheme}://${NATIVE_AUTH_CALLBACK_HOST}` +
          `${NATIVE_AUTH_CALLBACK_PATH}#${params.toString()}`;
        res.redirect(302, target);
        return;
      }

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
