import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { describeFailure, errorReference, logApiError, publicErrorMessage } from "./apiErrors";

/** Shaped like the error Drizzle raises when a query fails: SQL and bound values in the message. */
const drizzleFailure = () => Object.assign(
  new Error("Failed query: select `id` from `users` where `email` = ? and `tokenHash` = ?\nparams: athlete@example.com,5f2c9a"),
  { name: "DrizzleQueryError", cause: Object.assign(new Error("Duplicate entry 'athlete@example.com' for key 'users.email'"), { code: "ER_DUP_ENTRY", errno: 1062 }) },
);

afterEach(() => vi.restoreAllMocks());

describe("What an unexpected failure tells the caller", () => {
  it("answers with a fixed sentence and a reference, never the SQL or its values", () => {
    const error = new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: drizzleFailure().message, cause: drizzleFailure() });
    const message = publicErrorMessage(error);
    expect(message).toMatch(/^Something went wrong on our side\. If it keeps happening, quote reference [0-9a-f]{10}\.$/);
    expect(message).not.toMatch(/select|athlete@example\.com|5f2c9a/);
  });

  it("keeps the message of a deliberate error, which was written for the caller", () => {
    expect(publicErrorMessage(new TRPCError({ code: "BAD_REQUEST", message: "Pick a day first." }))).toBe("Pick a day first.");
    expect(publicErrorMessage(new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in" }))).toBe("Please sign in");
  });

  it("gives the caller and the log the same reference", () => {
    const error = new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: drizzleFailure() });
    expect(publicErrorMessage(error)).toContain(errorReference(error));
  });
});

describe("What the log keeps", () => {
  it("records the procedure, the reference and the driver code, and none of the private detail", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: drizzleFailure() });
    logApiError(error, "auth.signIn", "mutation");
    const line = String(spy.mock.calls[0][0]);
    expect(JSON.parse(line)).toMatchObject({ scope: "api", procedure: "auth.signIn", reference: errorReference(error), code: "INTERNAL_SERVER_ERROR" });
    expect(line).toContain("ER_DUP_ENTRY");
    expect(line).not.toMatch(/select|athlete@example\.com|5f2c9a|Duplicate entry/);
  });

  it("does not log deliberate errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logApiError(new TRPCError({ code: "NOT_FOUND", message: "No such session" }), "workoutLog.complete", "mutation");
    expect(spy).not.toHaveBeenCalled();
  });

  it("walks the cause chain for class and code only", () => {
    expect(describeFailure(drizzleFailure())).toEqual([{ name: "DrizzleQueryError" }, { name: "Error", code: "ER_DUP_ENTRY", errno: 1062 }]);
  });
});
