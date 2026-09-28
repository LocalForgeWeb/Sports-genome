import { beforeEach, describe, expect, it } from "vitest";
import { BoundedCache, mapWithConcurrency, withTimeout } from "./boundedCache";
import { COSTLY_ROUTE_LIMIT, clientKeyOf, resetCostlyCallWindows, takeCostlyCall } from "./_core/rateLimit";

describe("A cache keyed by caller input", () => {
  it("never holds more than its limit, dropping the least recently used first", () => {
    const cache = new BoundedCache<string, number>(3, 60_000);
    cache.set("a", 1); cache.set("b", 2); cache.set("c", 3);
    expect(cache.get("a")).toBe(1); // a is now the most recent
    cache.set("d", 4);
    expect(cache.size).toBe(3);
    expect(cache.get("b")).toBeUndefined();
    expect([cache.get("a"), cache.get("c"), cache.get("d")]).toEqual([1, 3, 4]);
  });

  it("forgets an entry once it expires", () => {
    const cache = new BoundedCache<string, number>(3, 1000);
    cache.set("a", 1, 0);
    expect(cache.get("a", 999)).toBe(1);
    expect(cache.get("a", 1000)).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("can cache a deliberate null, such as an exercise with no curve", () => {
    const cache = new BoundedCache<string, null>(3, 60_000);
    cache.set("no-curve", null);
    expect(cache.get("no-curve")).toBeNull();
    expect(cache.get("never-asked")).toBeUndefined();
  });
});

describe("Upstream calls", () => {
  it("run at most the limit at once and keep their order", async () => {
    let inFlight = 0; let peak = 0;
    const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, async (n) => {
      inFlight += 1; peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return n * 10;
    });
    expect(peak).toBe(4);
    expect(results).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  });

  it("carry a deadline unless the caller set one", () => {
    expect(withTimeout({}).signal).toBeInstanceOf(AbortSignal);
    const own = new AbortController().signal;
    expect(withTimeout({ signal: own }).signal).toBe(own);
  });
});

describe("The allowance for costly public routes", () => {
  beforeEach(() => resetCostlyCallWindows());

  it("lets a client make its allowance in a window and refuses the next", () => {
    for (let call = 0; call < COSTLY_ROUTE_LIMIT.maxCalls; call += 1) expect(takeCostlyCall("10.0.0.1", 1000)).toBe(true);
    expect(takeCostlyCall("10.0.0.1", 1000)).toBe(false);
    // Another client is counted separately.
    expect(takeCostlyCall("10.0.0.2", 1000)).toBe(true);
  });

  it("starts a fresh allowance when the window passes", () => {
    for (let call = 0; call <= COSTLY_ROUTE_LIMIT.maxCalls; call += 1) takeCostlyCall("10.0.0.1", 0);
    expect(takeCostlyCall("10.0.0.1", COSTLY_ROUTE_LIMIT.windowMs)).toBe(true);
  });

  it("keys on the client address", () => {
    expect(clientKeyOf({ ip: "203.0.113.9" })).toBe("203.0.113.9");
    expect(clientKeyOf({ socket: { remoteAddress: "::1" } })).toBe("::1");
    expect(clientKeyOf(undefined)).toBe("unknown");
  });
});
