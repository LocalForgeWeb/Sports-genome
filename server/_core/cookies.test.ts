import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./cookies";

function request(protocol: string, headers: Record<string, string> = {}) {
  return { protocol, headers } as unknown as Request;
}

const httpsDirect = request("https");
const forwardedHttps = request("http", { "x-forwarded-proto": "https" });
const forwardedList = request("http", { "x-forwarded-proto": "http, https" });
const plainHttp = request("http");

describe("the session cookie a browser will keep", () => {
  it("stays SameSite=None and Secure on an HTTPS request", () => {
    expect(getSessionCookieOptions(httpsDirect)).toEqual({ httpOnly: true, path: "/", sameSite: "none", secure: true });
  });

  it("treats a request the proxy forwarded from HTTPS as secure", () => {
    expect(getSessionCookieOptions(forwardedHttps)).toMatchObject({ sameSite: "none", secure: true });
    expect(getSessionCookieOptions(forwardedList)).toMatchObject({ sameSite: "none", secure: true });
  });

  it("falls back to Lax on plain http, where a None cookie without Secure is dropped", () => {
    expect(getSessionCookieOptions(plainHttp)).toEqual({ httpOnly: true, path: "/", sameSite: "lax", secure: false });
  });

  it("never pairs SameSite=None with an insecure cookie", () => {
    for (const req of [httpsDirect, forwardedHttps, forwardedList, plainHttp]) {
      const options = getSessionCookieOptions(req);
      if (options.sameSite === "none") expect(options.secure).toBe(true);
    }
  });
});
