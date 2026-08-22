import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { corsMiddleware } from "./cors";

function run(origin: string | undefined, method = "POST") {
  const headers: Record<string, string> = {};
  let sentStatus: number | null = null;

  const req = { method, headers: origin ? { origin } : {} } as unknown as Request;
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    sendStatus: (status: number) => {
      sentStatus = status;
    },
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;

  corsMiddleware(req, res, next);

  return { headers, sentStatus, next: next as unknown as ReturnType<typeof vi.fn> };
}

describe("corsMiddleware", () => {
  it("allows the iOS webview origin with credentials", () => {
    const { headers, next } = run("capacitor://localhost");

    expect(headers["Access-Control-Allow-Origin"]).toBe("capacitor://localhost");
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
    expect(headers["Vary"]).toBe("Origin");
    expect(next).toHaveBeenCalled();
  });

  it("answers a preflight without falling through to the router", () => {
    const { sentStatus, next } = run("capacitor://localhost", "OPTIONS");

    expect(sentStatus).toBe(204);
    expect(next).not.toHaveBeenCalled();
  });

  it("sends no CORS headers for an untrusted origin", () => {
    const { headers, next } = run("https://evil.example.com");

    // No headers at all is what makes the browser block the response — never a
    // wildcard, which cannot be combined with credentials anyway.
    expect(headers).toEqual({});
    expect(next).toHaveBeenCalled();
  });

  it("leaves same-origin web requests untouched", () => {
    const { headers, next } = run(undefined);

    expect(headers).toEqual({});
    expect(next).toHaveBeenCalled();
  });
});
