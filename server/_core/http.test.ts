import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

/**
 * The deployed function's HTTP behaviour, exercised over a real socket (Infrastructure V2,
 * CI04/CI05/RUN05/OBS05/OBS06): the bundle's own `app`, not a mock of it.
 */
let server: Server;
let base = "";

beforeAll(async () => {
  process.env.HEALTH_CHECK_TOKEN = "test-health-token";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { app } = await import("./serverless");
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => { server?.close(); delete process.env.HEALTH_CHECK_TOKEN; });

describe("the deployed API answers in JSON, identified, and never cached", () => {
  it("serves a cheap liveness check from the backend, not the app shell", async () => {
    const response = await fetch(`${base}/api/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(Object.keys(body.release).sort()).toEqual(["commit", "deploymentId", "environment", "region"]);
  });

  it("hides readiness without the token, and reports degraded (not ready) without config", async () => {
    expect((await fetch(`${base}/api/health/ready`)).status).toBe(404);
    expect((await fetch(`${base}/api/health/ready`, { headers: { "x-health-token": "wrong" } })).status).toBe(404);
    const response = await fetch(`${base}/api/health/ready`, { headers: { "x-health-token": "test-health-token" } });
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.config.missingRequired).toContain("SUPABASE_SERVICE_ROLE_KEY");
    // Names only: no value of any variable appears in the answer.
    expect(JSON.stringify(body)).not.toContain("test-health-token");
  });

  it("gives every response a request id, keeping a well-formed caller id and refusing junk", async () => {
    const own = await fetch(`${base}/api/health`, { headers: { "x-request-id": "smoke-check-0001" } });
    expect(own.headers.get("x-request-id")).toBe("smoke-check-0001");
    const junk = await fetch(`${base}/api/health`, { headers: { "x-request-id": "<script>alert(1)</script>" } });
    expect(junk.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("answers an unknown API path with a JSON 404 that does not echo the query", async () => {
    const response = await fetch(`${base}/api/nope?token=secret-looking-value`);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: "Not found", path: "/api/nope" });
    expect(response.headers.get("x-powered-by")).toBeNull();
  });

  it("turns malformed and oversized JSON into controlled 400 and 413 answers, never an HTML stack", async () => {
    const malformed = await fetch(`${base}/api/trpc/auth.logout`, { method: "POST", headers: { "content-type": "application/json" }, body: "{not json" });
    expect(malformed.status).toBe(400);
    expect(malformed.headers.get("content-type")).toContain("application/json");
    const text = await malformed.text();
    expect(text).not.toMatch(/<html|at .*\.js:\d+/i);
    expect(JSON.parse(text).error.code).toBe("BAD_REQUEST");

    const huge = await fetch(`${base}/api/trpc/auth.logout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ blob: "x".repeat(5 * 1024 * 1024) }) });
    expect(huge.status).toBe(413);
    expect((await huge.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("refuses a non-JSON mutation and an unknown procedure without a 200", async () => {
    const form = await fetch(`${base}/api/trpc/auth.logout`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "a=1" });
    expect(form.status).toBe(415);
    const unknown = await fetch(`${base}/api/trpc/no.such.procedure`);
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get("cache-control")).toBe("no-store");
  });

  it("does not answer an unsupported method on a known path with success", async () => {
    const response = await fetch(`${base}/api/health`, { method: "PUT" });
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("upstream calls have a time budget", () => {
  it("aborts a call that outlives its budget with a TimeoutError", async () => {
    const { upstreamFetch } = await import("./http");
    const { createServer } = await import("node:http");
    const slow = createServer((_req, res) => { setTimeout(() => res.end("late"), 2000); }).listen(0);
    await new Promise((resolve) => slow.once("listening", resolve));
    const started = Date.now();
    const error = await upstreamFetch(`http://127.0.0.1:${(slow.address() as AddressInfo).port}/`, {}, 150).then(() => null, (failure) => failure);
    slow.close();
    expect(error?.name).toBe("TimeoutError");
    expect(Date.now() - started).toBeLessThan(1500);
  });
});
