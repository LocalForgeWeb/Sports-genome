import { isUnauthorized } from "@/lib/sessionNotice";

/**
 * Which failed queries the browser tries again (Infrastructure V2, RUN02/RUN03, RL07).
 *
 * Only a failure that can pass on its own is retried: the network, or the server (5xx). A
 * 4xx is the server's answer about THIS request - bad input, not signed in, not allowed, not
 * found, or too many requests (429, which asks for less traffic) - and it would come back the
 * same on the third try, three times the load. The browser is the only layer that retries reads
 * (the server and the SDK do not), so this is where the count is bounded: three attempts.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  if (isUnauthorized(error)) return false;
  const data = (error as { data?: { code?: string; httpStatus?: number } } | null)?.data;
  if (data?.code === "TOO_MANY_REQUESTS") return false;
  const status = data?.httpStatus;
  return !(typeof status === "number" && status >= 400 && status < 500);
}
