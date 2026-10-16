import { describe, expect, it } from "vitest";
import { shouldRetryQuery } from "./queryRetry";

const trpcError = (httpStatus: number, code: string) => Object.assign(new Error(code), { data: { httpStatus, code } });

describe("which failed queries the browser retries (RUN02, RL07)", () => {
  it("retries a network failure and a server fault, at most three attempts", () => {
    const network = new TypeError("Failed to fetch");
    expect(shouldRetryQuery(0, network)).toBe(true);
    expect(shouldRetryQuery(2, network)).toBe(true);
    expect(shouldRetryQuery(3, network)).toBe(false);
    expect(shouldRetryQuery(0, trpcError(500, "INTERNAL_SERVER_ERROR"))).toBe(true);
    expect(shouldRetryQuery(0, trpcError(503, "SERVICE_UNAVAILABLE"))).toBe(true);
  });

  it("never retries an answer about the request itself", () => {
    for (const [status, code] of [[400, "BAD_REQUEST"], [401, "UNAUTHORIZED"], [403, "FORBIDDEN"], [404, "NOT_FOUND"], [429, "TOO_MANY_REQUESTS"]] as const) {
      expect(shouldRetryQuery(0, trpcError(status, code)), code).toBe(false);
    }
    // A throttle recognised by its code alone, as some links report it.
    expect(shouldRetryQuery(0, Object.assign(new Error("slow down"), { data: { code: "TOO_MANY_REQUESTS" } }))).toBe(false);
  });
});
