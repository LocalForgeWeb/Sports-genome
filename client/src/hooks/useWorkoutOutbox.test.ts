import { describe, expect, it } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { classifyFailure } from "./useWorkoutOutbox";

function trpcError(httpStatus?: number) {
  const error = new TRPCClientError("rejected");
  Object.assign(error, { data: httpStatus === undefined ? null : { httpStatus } });
  return error;
}

describe("classifyFailure", () => {
  it("retries a transport failure", () => {
    // The write never reached the server — this is the ordinary no-signal case,
    // and the athlete's set must not be thrown away.
    expect(classifyFailure(new TypeError("Failed to fetch"))).toBe("retry");
  });

  it("retries when the error carries no HTTP status", () => {
    expect(classifyFailure(trpcError())).toBe("retry");
  });

  it("retries an expired session, which a re-login fixes", () => {
    expect(classifyFailure(trpcError(401))).toBe("retry");
  });

  it("retries explicit back-off responses", () => {
    expect(classifyFailure(trpcError(408))).toBe("retry");
    expect(classifyFailure(trpcError(429))).toBe("retry");
  });

  it("retries a server error", () => {
    expect(classifyFailure(trpcError(500))).toBe("retry");
  });

  it("drops a write the server refused", () => {
    // 403 is what a set logged against an already-finished session returns.
    // Replaying it forever would wedge every write behind it.
    expect(classifyFailure(trpcError(403))).toBe("drop");
    expect(classifyFailure(trpcError(400))).toBe("drop");
    expect(classifyFailure(trpcError(404))).toBe("drop");
  });
});
