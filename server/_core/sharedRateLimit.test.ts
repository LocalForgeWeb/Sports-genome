import { afterEach, describe, expect, it, vi } from "vitest";
import { createSharedRateLimiter, SHARED_LIMITS } from "./sharedRateLimit";

const okResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

afterEach(() => vi.restoreAllMocks());

describe("the shared rate limit (RL02, RL06, RL10)", () => {
  it("asks the database counter with a hashed bucket, never the address", async () => {
    const fetcher = vi.fn(async (_url: unknown, _init?: RequestInit) => okResponse({ allowed: true, retry_after_seconds: 0 }));
    const limiter = createSharedRateLimiter({ url: "https://example.supabase.co/", key: "service-key", fetcher: fetcher as never });
    const verdict = await limiter.hit(SHARED_LIMITS.costly, "203.0.113.7");
    expect(verdict).toEqual({ allowed: true, retryAfterSeconds: 0, source: "shared" });
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://example.supabase.co/rest/v1/rpc/sg_rate_limit_hit");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ p_window_seconds: 60, p_max_calls: 600 });
    expect(body.p_bucket).toMatch(/^costly:[0-9a-f]{32}$/);
    expect(String(init?.body)).not.toContain("203.0.113.7");
    // Same address, same bucket; a different service key gives a different, unlinkable one.
    expect(limiter.bucketFor("costly", "203.0.113.7")).toBe(body.p_bucket);
    expect(createSharedRateLimiter({ url: "https://x", key: "other-key" }).bucketFor("costly", "203.0.113.7")).not.toBe(body.p_bucket);
  });

  it("passes on the database's refusal with its retry interval", async () => {
    const limiter = createSharedRateLimiter({ url: "https://x", key: "k", fetcher: (async () => okResponse({ allowed: false, retry_after_seconds: 17 })) as never });
    expect(await limiter.hit(SHARED_LIMITS.shareCreate, "a")).toEqual({ allowed: false, retryAfterSeconds: 17, source: "shared" });
  });

  it("fails open on an error, a missing function or a timeout, and stops asking for a minute after three in a row", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let clock = 1_000_000;
    const fetcher = vi.fn(async () => new Response("{}", { status: 404 }));
    const limiter = createSharedRateLimiter({ url: "https://x", key: "k", fetcher: fetcher as never, now: () => clock });
    expect(await limiter.hit(SHARED_LIMITS.costly, "a")).toEqual({ allowed: true, retryAfterSeconds: 0, source: "unavailable" });
    await limiter.hit(SHARED_LIMITS.costly, "a");
    await limiter.hit(SHARED_LIMITS.costly, "a");
    expect(fetcher).toHaveBeenCalledTimes(3);
    // The third failure in a row opens the breaker: the store is left alone for a minute.
    expect(await limiter.hit(SHARED_LIMITS.costly, "a")).toMatchObject({ source: "unavailable" });
    expect(fetcher).toHaveBeenCalledTimes(3);
    clock += 61_000;
    await limiter.hit(SHARED_LIMITS.costly, "a");
    expect(fetcher).toHaveBeenCalledTimes(4);

    const timeout = createSharedRateLimiter({ url: "https://x", key: "k", fetcher: (async () => { throw Object.assign(new Error("slow"), { name: "TimeoutError" }); }) as never });
    expect(await timeout.hit(SHARED_LIMITS.auth, "a")).toMatchObject({ allowed: true, source: "unavailable" });
    const warning = JSON.parse(String((console.warn as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0]));
    expect(warning).toMatchObject({ event: "rate_limit_store_unavailable", reason: "timeout" });
  });

  it("keeps asking after one slow cold call, as a new instance's first call was in production", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let calls = 0;
    const fetcher = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw Object.assign(new Error("slow"), { name: "TimeoutError" });
      return okResponse({ allowed: false, retry_after_seconds: 9 });
    });
    const limiter = createSharedRateLimiter({ url: "https://x", key: "k", fetcher: fetcher as never });
    expect(await limiter.hit(SHARED_LIMITS.costly, "a")).toMatchObject({ source: "unavailable" });
    expect(JSON.parse(String((console.warn as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0]))).toMatchObject({ reason: "timeout", pausedForMs: 0 });
    expect(await limiter.hit(SHARED_LIMITS.costly, "a")).toEqual({ allowed: false, retryAfterSeconds: 9, source: "shared" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("refuses a malformed answer rather than trusting it", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const limiter = createSharedRateLimiter({ url: "https://x", key: "k", fetcher: (async () => okResponse({ calls: 3 })) as never });
    expect(await limiter.hit(SHARED_LIMITS.costly, "a")).toMatchObject({ source: "unavailable" });
  });
});

describe("the client address behind the platform proxy (RL04)", () => {
  it("takes the address the proxy saw, not one the client wrote into X-Forwarded-For", async () => {
    const express = (await import("express")).default;
    const { clientKeyOf } = await import("./rateLimit");
    const app = express();
    app.set("trust proxy", 1);
    app.get("/", (req, res) => res.send(clientKeyOf(req)));
    const server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    const port = (server.address() as { port: number }).port;
    // A client prepends a fake address; the platform appends the real one last.
    const seen = await (await fetch(`http://127.0.0.1:${port}/`, { headers: { "x-forwarded-for": "1.2.3.4, 198.51.100.20" } })).text();
    server.close();
    expect(seen).toBe("198.51.100.20");
  });
});
