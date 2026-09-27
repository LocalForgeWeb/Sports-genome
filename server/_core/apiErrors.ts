import { randomUUID } from "node:crypto";
import type { TRPCError } from "@trpc/server";

/**
 * What an API error says to the caller, and what it leaves in the log.
 *
 * An unexpected failure used to reach the caller verbatim. For a database error that
 * meant Drizzle's own message - "Failed query: <sql> params: <values>" - so a sign-in
 * that hit a connection problem answered with the email and the session-token hash
 * it had bound, and a failed write could echo a password hash or a whole plan. And it
 * was logged nowhere, so the only record of a server fault was in the response.
 *
 * Now: a deliberate error (bad input, not found, conflict, not signed in) keeps its
 * message, because it was written for the caller. An unexpected one answers with a
 * fixed sentence and a short reference, and the log carries that reference with the
 * procedure, the error class and the driver's error code - never the SQL, the bound
 * values, the input or the driver's message, which for a duplicate key quotes the
 * duplicated value.
 */

const references = new WeakMap<object, string>();

/** One reference per error, whichever of the logger and the formatter asks first. */
export function errorReference(error: object): string {
  let reference = references.get(error);
  if (!reference) {
    reference = randomUUID().replace(/-/g, "").slice(0, 10);
    references.set(error, reference);
  }
  return reference;
}

export const unexpectedErrorMessage = (reference: string) =>
  `Something went wrong on our side. If it keeps happening, quote reference ${reference}.`;

export function publicErrorMessage(error: Pick<TRPCError, "code" | "message">): string {
  return error.code === "INTERNAL_SERVER_ERROR" ? unexpectedErrorMessage(errorReference(error)) : error.message;
}

type Describable = { name?: unknown; code?: unknown; errno?: unknown; cause?: unknown };

/**
 * The parts of a failure that identify it without repeating it: the error class and
 * the driver's code at each level of the cause chain. Messages are dropped on purpose.
 */
export function describeFailure(error: unknown, depth = 0): Record<string, unknown>[] {
  if (!error || typeof error !== "object" || depth > 4) return [];
  const { name, code, errno, cause } = error as Describable;
  const entry: Record<string, unknown> = {};
  if (typeof name === "string") entry.name = name;
  if (typeof code === "string" || typeof code === "number") entry.code = code;
  if (typeof errno === "number") entry.errno = errno;
  return [entry, ...describeFailure(cause, depth + 1)];
}

/** For tRPC's onError: server faults only, one JSON line each, nothing private in it. */
export function logApiError(error: TRPCError, path: string | undefined, type: string): void {
  if (error.code !== "INTERNAL_SERVER_ERROR") return;
  console.error(JSON.stringify({
    scope: "api",
    reference: errorReference(error),
    procedure: path ?? null,
    type,
    code: error.code,
    failure: describeFailure(error.cause),
  }));
}
