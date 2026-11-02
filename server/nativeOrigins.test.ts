import express from "express";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { nativeOriginAccess, parseNativeOrigins } from "./_core/nativeOrigins";

/**
 * iOS readiness audit, A02: the API answers cross-origin only to the native shell origins it is
 * told, exactly, with credentials; never to a wildcard; and the website (same origin) is untouched.
 */
describe("the native origin list", () => {
  it("keeps exact https and shell-scheme origins, and drops wildcards, paths and junk", () => {
    expect(parseNativeOrigins(undefined)).toEqual([]);
    expect(parseNativeOrigins("capacitor://localhost, https://app.example.com ,capacitor://localhost")).toEqual(["capacitor://localhost", "https://app.example.com"]);
    expect(parseNativeOrigins("*")).toEqual([]);
    expect(parseNativeOrigins("https://*.example.com")).toEqual([]);
    expect(parseNativeOrigins("https://app.example.com/path")).toEqual([]);
    expect(parseNativeOrigins("http://app.example.com")).toEqual([]);
    expect(parseNativeOrigins("not a url")).toEqual([]);
  });
});

function serve(allowed: string[]) {
  const app = express();
  app.use("/api/trpc", nativeOriginAccess(allowed), (_req, res) => { res.json({ ok: true }); });
  return app;
}

describe("cross-origin access to the API", () => {
  let open: Server;
  let closed: Server;
  let openBase = "";
  let closedBase = "";
  const listen = async (server: Server) => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    return address && typeof address === "object" ? `http://127.0.0.1:${address.port}` : "";
  };

  beforeAll(async () => {
    open = createServer(serve(["capacitor://localhost"]));
    closed = createServer(serve([]));
    openBase = await listen(open);
    closedBase = await listen(closed);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => open.close(() => resolve()));
    await new Promise<void>((resolve) => closed.close(() => resolve()));
  });

  it("answers the listed shell origin with its own origin and credentials, never a wildcard", async () => {
    const response = await fetch(`${openBase}/api/trpc/x`, { headers: { Origin: "capacitor://localhost" } });
    expect(response.headers.get("access-control-allow-origin")).toBe("capacitor://localhost");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(response.headers.get("vary")).toMatch(/Origin/);
  });

  it("answers a preflight from the listed origin, with only the methods and headers tRPC uses", async () => {
    const response = await fetch(`${openBase}/api/trpc/x`, { method: "OPTIONS", headers: { Origin: "capacitor://localhost", "Access-Control-Request-Method": "POST" } });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toBe("GET, POST, OPTIONS");
    expect(response.headers.get("access-control-allow-headers")).toContain("content-type");
  });

  it("gives an unlisted origin nothing, so the browser refuses it", async () => {
    const response = await fetch(`${openBase}/api/trpc/x`, { headers: { Origin: "https://evil.example" } });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("access-control-allow-credentials")).toBeNull();
  });

  it("changes nothing for the website, or when no origin is configured", async () => {
    const sameOrigin = await fetch(`${openBase}/api/trpc/x`);
    expect(sameOrigin.headers.get("access-control-allow-origin")).toBeNull();
    expect(await sameOrigin.json()).toEqual({ ok: true });
    const unconfigured = await fetch(`${closedBase}/api/trpc/x`, { headers: { Origin: "capacitor://localhost" } });
    expect(unconfigured.headers.get("access-control-allow-origin")).toBeNull();
    expect(unconfigured.headers.get("vary")).toBeNull();
  });
});
