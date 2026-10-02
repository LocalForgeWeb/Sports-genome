/**
 * Waits for one request to reach a terminal status.
 *
 * Polls GET /requests/{id}/status at a steady interval; a rate limit or a
 * server error backs the interval off (honouring Retry-After when given) and
 * is tolerated up to `maxConsecutiveErrors` times before the wait gives up.
 * A 4xx that is not 429 is our fault and stops the wait at once.
 *
 * Giving up here never cancels the generation: the request keeps running on
 * the platform, and the caller gets the request id back to check later or to
 * cancel explicitly.
 */
import { PlatformError, TERMINAL_STATUSES, type GenerationStatus, type PlatformClient } from "./platform";

export type WaitOptions = {
  intervalMs?: number;
  deadlineMs?: number;
  maxConsecutiveErrors?: number;
  signal?: AbortSignal;
  onStatus?: (status: GenerationStatus) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export class WaitTimeoutError extends Error {
  readonly requestId: string;
  readonly lastStatus: string | undefined;
  constructor(requestId: string, lastStatus: string | undefined, deadlineMs: number) {
    super(`Timed out after ${Math.round(deadlineMs / 1000)}s waiting for request ${requestId}${lastStatus ? ` (last status: ${lastStatus})` : ""}. It may still be running; check it with "status ${requestId}" or cancel it.`);
    this.name = "WaitTimeoutError";
    this.requestId = requestId;
    this.lastStatus = lastStatus;
  }
}

export const DEFAULT_POLL_INTERVAL_MS = 4000;
export const DEFAULT_POLL_DEADLINE_MS = 10 * 60_000;

export async function waitForRequest(client: PlatformClient, requestId: string, options: WaitOptions = {}): Promise<GenerationStatus> {
  const interval = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const deadlineMs = options.deadlineMs ?? DEFAULT_POLL_DEADLINE_MS;
  const maxErrors = options.maxConsecutiveErrors ?? 3;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const started = now();
  let errors = 0;
  let last: string | undefined;

  for (;;) {
    if (options.signal?.aborted) throw new Error(`Stopped waiting for request ${requestId}; it is still running on the platform unless you cancel it.`);
    let wait = interval;
    try {
      const status = await client.status(requestId);
      errors = 0;
      last = status.status;
      options.onStatus?.(status);
      if (TERMINAL_STATUSES.has(status.status)) return status;
    } catch (caught) {
      if (!(caught instanceof PlatformError) || !caught.isTransient) throw caught;
      errors += 1;
      if (errors >= maxErrors) throw caught;
      wait = Math.max(interval * 2 ** errors, (caught.retryAfterSeconds ?? 0) * 1000);
    }
    if (now() - started + wait > deadlineMs) throw new WaitTimeoutError(requestId, last, deadlineMs);
    await sleep(wait);
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
