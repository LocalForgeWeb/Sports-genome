/**
 * The Higgsfield REST client: submit, status, cancel and signed-upload tickets.
 *
 * Adapted from higgsfield-ai/app-templates `generation/platform.ts` (commit
 * 9288d98). Same wire contract; the differences are for a shell tool: nothing
 * is logged unless the caller asks, rate limits surface with their retry hint,
 * and the upload PUT is performed here (Node) rather than in a browser.
 *
 * Contract, as documented at the time of vendoring (not re-verified live from
 * this environment, see README.md):
 *   POST {base}/{model-path}                  body: model input      -> { request_id, status_url, cancel_url }
 *   GET  {base}/requests/{id}/status                                  -> { status, images[].url | video.url, error? }
 *   POST {base}/requests/{id}/cancel          (queued requests)       -> 202, status turns "canceled"
 *   POST {base}/files/generate-upload-url     { content_type }        -> { upload_url, upload_headers, public_url, content_type }
 *   PUT  upload_url with upload_headers only  (no Authorization)
 */
import { toAuthorizationHeader } from "./credentials";
import { parseUploadTicket, requireUploadContentType, type UploadTicket } from "./upload-contract";

const UPLOAD_PATH = "/files/generate-upload-url";
const MODEL_PATH = /^[a-z0-9][a-z0-9._/-]*$/i;

export const TERMINAL_STATUSES = new Set(["completed", "failed", "nsfw", "canceled"]);

export class PlatformError extends Error {
  readonly status: number;
  readonly body: unknown;
  /** Seconds the platform asked us to wait, when it said (429 / 503). */
  readonly retryAfterSeconds: number | undefined;

  constructor(status: number, body: unknown, retryAfterSeconds?: number) {
    super(messageFromBody(status, body));
    this.name = "PlatformError";
    this.status = status;
    this.body = body;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isRateLimit(): boolean {
    return this.status === 429;
  }

  /** Worth asking again later: rate limits and server-side hiccups. Never a 4xx we caused. */
  get isTransient(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

export type QueuedGeneration = {
  status: string;
  requestId: string;
  statusUrl: string;
  cancelUrl: string;
};

export type GenerationStatus = {
  status: string;
  requestId: string;
  images?: Array<{ url: string }>;
  video?: { url: string };
  error?: unknown;
  /** The whole payload, for a manifest; the fields above are the ones the tool acts on. */
  raw: unknown;
};

export type PlatformClientOptions = {
  apiKey: string;
  baseUrl: string;
  fetch?: typeof fetch;
  /** Called with request/response summaries. Never receives the key or a signed URL. */
  log?: (line: string) => void;
};

export function isModelPath(model: string): boolean {
  return MODEL_PATH.test(model) && !model.includes("..");
}

export function createPlatformClient(options: PlatformClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  const fetchImpl = options.fetch ?? fetch;
  const auth = toAuthorizationHeader(options.apiKey);
  const log = options.log ?? (() => {});

  async function send(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<unknown> {
    const url = `${baseUrl}${path}`;
    log(`${method} ${url}${body && path !== UPLOAD_PATH ? ` ${JSON.stringify(body)}` : ""}`);
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: auth,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await readJson(response);
    // Signed upload URLs are credentials; they never reach the log.
    log(`${response.status} ${method} ${url}${path === UPLOAD_PATH ? "" : ` ${truncate(JSON.stringify(payload))}`}`);
    if (!response.ok) throw new PlatformError(response.status, payload, retryAfter(response));
    return payload;
  }

  return {
    async createUpload(contentType: unknown): Promise<UploadTicket> {
      const type = requireUploadContentType(contentType);
      return parseUploadTicket(await send("POST", UPLOAD_PATH, { content_type: type }), type);
    },

    /**
     * Puts the bytes where the ticket says, with exactly the headers the ticket
     * returned and nothing else: no Authorization, no cookies. The public URL is
     * only handed back once the storage service has accepted the object.
     */
    async uploadWithTicket(ticket: UploadTicket, bytes: Uint8Array): Promise<{ url: string }> {
      const body = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: ticket.content_type });
      const uploaded = await fetchImpl(ticket.upload_url, {
        method: "PUT",
        headers: ticket.upload_headers,
        body,
        credentials: "omit",
      });
      if (!uploaded.ok) throw new Error(`Reference upload failed (${uploaded.status}). Try uploading the file again.`);
      return { url: ticket.public_url };
    },

    async submit(modelPath: string, input: Record<string, unknown>): Promise<QueuedGeneration> {
      if (!isModelPath(modelPath)) throw new PlatformError(400, { detail: `Invalid model path: ${modelPath}` });
      return mapQueued(await send("POST", `/${modelPath}`, input));
    },

    async status(requestId: string): Promise<GenerationStatus> {
      if (!requestId) throw new PlatformError(400, { detail: "Missing request id" });
      return mapStatus(await send("GET", `/requests/${encodeURIComponent(requestId)}/status`));
    },

    /** Reaches the platform; a request that is already running may be refused, and that is reported, not hidden. */
    async cancel(requestId: string): Promise<void> {
      if (!requestId) throw new PlatformError(400, { detail: "Missing request id" });
      await send("POST", `/requests/${encodeURIComponent(requestId)}/cancel`, {});
    },
  };
}

export type PlatformClient = ReturnType<typeof createPlatformClient>;

function mapQueued(payload: unknown): QueuedGeneration {
  const data = asRecord(payload);
  const requestId = stringField(data, "request_id");
  if (!requestId) throw new PlatformError(502, { detail: "Platform response missing request_id" });
  return {
    status: stringField(data, "status") ?? "queued",
    requestId,
    statusUrl: stringField(data, "status_url") ?? "",
    cancelUrl: stringField(data, "cancel_url") ?? "",
  };
}

function mapStatus(payload: unknown): GenerationStatus {
  const data = asRecord(payload);
  const images = Array.isArray(data.images)
    ? data.images.flatMap((item) => {
        const url = asRecord(item).url;
        return typeof url === "string" ? [{ url }] : [];
      })
    : undefined;
  const videoUrl = asRecord(data.video).url;
  return {
    status: stringField(data, "status") ?? "unknown",
    requestId: stringField(data, "request_id") ?? "",
    ...(images?.length ? { images } : {}),
    ...(typeof videoUrl === "string" ? { video: { url: videoUrl } } : {}),
    ...(data.error !== undefined ? { error: data.error } : {}),
    raw: payload,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringField(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key];
  return typeof field === "string" ? field : undefined;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function retryAfter(response: Response): number | undefined {
  const header = response.headers.get("retry-after");
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const at = Date.parse(header);
  return Number.isNaN(at) ? undefined : Math.max(0, (at - Date.now()) / 1000);
}

function messageFromBody(status: number, body: unknown): string {
  // A non-JSON body is something in between us and the platform speaking - a
  // proxy, a network allowlist, an HTML error page. Its words beat a guess.
  if (typeof body === "string" && body.trim() && !/^\s*</.test(body)) return `${truncate(body.trim(), 300)} (${status})`;
  const detail = asRecord(body).detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = asRecord(detail[0]);
    const loc = Array.isArray(first.loc) ? first.loc.join(".") : "";
    const msg = typeof first.msg === "string" ? first.msg : JSON.stringify(first);
    return `Platform rejected the request (${status}): ${loc ? `${loc}: ` : ""}${msg}`;
  }
  if (status === 401 || status === 403) return `Higgsfield rejected the API key (${status}). Check HF_API_KEY.`;
  if (status === 429) return "Higgsfield rate limit reached (429). Wait and try again.";
  return `Platform request failed (${status})`;
}

function truncate(text: string | undefined, max = 600): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
