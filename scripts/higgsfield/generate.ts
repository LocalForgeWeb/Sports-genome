/**
 * One generation, end to end: resolve the model, build the platform request
 * from the vendored catalog mappers, guard against a duplicate submit, submit,
 * wait, download the result, and record every step in the ledger.
 *
 * Everything here is Node-only and takes the client as a parameter, so the
 * tests drive it with a fake fetch and a temp directory.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { getModel, MODELS, parseSettings, type GenerationPlane, type MediaItem, type MediaRole, type ModelEntry } from "./catalog";
import { mapByPaths } from "./catalog/mappers";
import { validateMedia } from "./catalog/media-inputs";
import { idempotencyKey, RunLedger, type LedgerEntry } from "./ledger";
import { PlatformError, type GenerationStatus, type PlatformClient } from "./platform";
import { waitForRequest, type WaitOptions } from "./poll";

export type GenerateRequest = {
  modelId: string;
  prompt: string;
  /** Media already uploaded (public URLs), by role. */
  media?: Partial<Record<MediaRole, string[]>>;
  inputMode?: string;
  /** Model settings by the catalog's camelCase keys (aspectRatio, resolution, duration, ...). */
  settings?: Record<string, unknown>;
  label?: string;
  /** Resubmit even when the ledger already holds this exact request. */
  force?: boolean;
};

export type GenerateOutcome = {
  entry: LedgerEntry;
  status: GenerationStatus;
  files: string[];
};

export class DuplicateSubmitError extends Error {
  constructor(readonly entry: LedgerEntry) {
    super(
      entry.state === "submitting"
        ? `An identical request was being submitted (${entry.key}) and its outcome is unknown; it may be running. Check "status ${entry.requestId ?? "<unknown>"}" or pass --force to submit again.`
        : `An identical request already ran (${entry.key}, ${entry.state}${entry.requestId ? `, request ${entry.requestId}` : ""}). Pass --force to generate it again.`,
    );
    this.name = "DuplicateSubmitError";
  }
}

export function listModels(surface?: "image" | "video"): readonly ModelEntry[] {
  return surface ? MODELS.filter((model) => model.surface === surface) : MODELS;
}

/** The platform path and body for a request, exactly as the Studio template would send them. */
export function buildPlatformRequest(request: GenerateRequest): { model: ModelEntry; path: string; body: Record<string, unknown> } {
  const model = getModel(request.modelId);
  const media: GenerationPlane["media"] = {};
  for (const [role, urls] of Object.entries(request.media ?? {}) as [MediaRole, string[]][]) {
    media[role] = urls.map((url, index): MediaItem => ({ id: `${role}-${index}`, url, role }));
  }
  const plane: GenerationPlane = {
    model: model.id,
    inputMode: request.inputMode,
    prompt: { text: request.prompt },
    media,
    settings: parseSettings(model, request.settings ?? {}),
  };
  validateMedia(model, plane.media, plane.inputMode);
  if (model.requirePrompt && !plane.prompt.text.trim()) throw new Error(`A prompt is required for ${model.label}.`);
  const mapped = model.toPlatform ? model.toPlatform(plane) : model.paths ? mapByPaths(plane, model.paths) : null;
  if (!mapped) throw new Error(`No platform map for ${model.id}`);
  return { model, path: mapped.path, body: mapped.body };
}

export async function generate(
  client: PlatformClient,
  ledger: RunLedger,
  request: GenerateRequest,
  options: { outDir: string; wait?: WaitOptions; fetch?: typeof fetch; log?: (line: string) => void } ,
): Promise<GenerateOutcome> {
  const log = options.log ?? (() => {});
  const { model, path, body } = buildPlatformRequest(request);
  const key = idempotencyKey(path, body);
  const existing = ledger.find(key);
  if (existing && !request.force) {
    if (existing.state === "completed" && existing.requestId) {
      log(`Reusing completed run ${existing.requestId} for identical inputs (pass --force to regenerate).`);
      const status = await client.status(existing.requestId);
      const files = await downloadOutputs(status, options.outDir, request.label ?? existing.label ?? key, options.fetch);
      return { entry: ledger.update(key, { outputs: files }), status, files };
    }
    throw new DuplicateSubmitError(existing);
  }

  let entry = ledger.begin({ key, label: request.label, modelId: model.id, modelPath: path, body });
  let queued;
  try {
    queued = await client.submit(path, body);
  } catch (caught) {
    // A clear platform refusal is settled: record it so the same inputs are not
    // resubmitted by reflex. An ambiguous failure (network) stays `submitting`.
    if (caught instanceof PlatformError && !caught.isTransient) {
      ledger.update(key, { state: "failed", error: caught.message });
    } else {
      ledger.update(key, { error: caught instanceof Error ? caught.message : String(caught) });
    }
    throw caught;
  }
  entry = ledger.update(key, { state: "queued", requestId: queued.requestId, statusUrl: queued.statusUrl, cancelUrl: queued.cancelUrl });
  log(`Submitted ${model.label} as request ${queued.requestId}`);

  let status: GenerationStatus;
  try {
    status = await waitForRequest(client, queued.requestId, {
      ...options.wait,
      onStatus: (current) => {
        log(`  ${queued.requestId}: ${current.status}`);
        options.wait?.onStatus?.(current);
      },
    });
  } catch (caught) {
    ledger.update(key, { state: "timed_out", error: caught instanceof Error ? caught.message : String(caught) });
    throw caught;
  }

  const files = status.status === "completed" ? await downloadOutputs(status, options.outDir, request.label ?? key, options.fetch) : [];
  entry = ledger.update(key, {
    state: status.status as LedgerEntry["state"],
    outputs: files,
    ...(status.status !== "completed" ? { error: describeFailure(status) } : {}),
  });
  return { entry, status, files };
}

export function describeFailure(status: GenerationStatus): string {
  if (status.status === "nsfw") return "Blocked by the platform's content filter (nsfw).";
  if (status.status === "canceled") return "Canceled.";
  const error = status.error;
  if (typeof error === "string" && error) return error;
  if (error && typeof error === "object") return JSON.stringify(error);
  return `Generation ${status.status}.`;
}

/** Downloads every output URL into outDir and writes a manifest beside them. */
export async function downloadOutputs(status: GenerationStatus, outDir: string, label: string, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const urls = [...(status.images?.map((image) => image.url) ?? []), ...(status.video ? [status.video.url] : [])];
  if (!urls.length) return [];
  const safe = label.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || status.requestId;
  const dir = join(outDir, safe);
  mkdirSync(dir, { recursive: true });
  const files: string[] = [];
  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index]!;
    const response = await fetchImpl(url);
    if (!response.ok) throw new Error(`Could not download output ${index + 1} (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const ext = extensionFor(response.headers.get("content-type"), url);
    const file = join(dir, `${safe}-${index + 1}${ext}`);
    writeFileSync(file, bytes);
    files.push(file);
  }
  writeFileSync(join(dir, "manifest.json"), `${JSON.stringify({ requestId: status.requestId, status: status.status, urls, files, response: status.raw }, null, 2)}\n`);
  return files;
}

function extensionFor(contentType: string | null, url: string): string {
  const byType: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif", "video/mp4": ".mp4", "video/webm": ".webm" };
  const type = contentType?.split(";")[0]?.trim().toLowerCase();
  if (type && byType[type]) return byType[type];
  try {
    const fromUrl = extname(new URL(url).pathname).toLowerCase();
    if (fromUrl && fromUrl.length <= 5) return fromUrl;
  } catch {
    /* fall through */
  }
  return ".bin";
}
