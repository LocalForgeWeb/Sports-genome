import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MODELS } from "./catalog";
import { parseArgs, parseSettingFlags } from "./cli";
import { readCredentials, toAuthorizationHeader } from "./credentials";
import { buildPlatformRequest, DuplicateSubmitError, generate, listModels } from "./generate";
import { idempotencyKey, RunLedger } from "./ledger";
import { createPlatformClient, PlatformError } from "./platform";
import { waitForRequest, WaitTimeoutError } from "./poll";
import { uploadReferenceFile } from "./upload";

const KEY = "hf_test_key_abc123";
const BASE = "https://api.higgsfield.ai";

type Call = { url: string; init: RequestInit };

function fakeFetch(handler: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const impl = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const call = { url: String(input), init };
    calls.push(call);
    return handler(call);
  });
  return { calls, fetch: impl as unknown as typeof fetch };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hf-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("credentials", () => {
  it("reads the complete key from HF_API_KEY and sends it under the Key scheme", () => {
    const creds = readCredentials({ HF_API_KEY: ` ${KEY} ` });
    expect(creds).toEqual({ apiKey: KEY, baseUrl: BASE });
    expect(toAuthorizationHeader(creds.apiKey)).toBe(`Key ${KEY}`);
  });

  it("refuses a missing key, a doubled scheme and a non-https base", () => {
    expect(() => readCredentials({})).toThrow(/HF_API_KEY/);
    expect(() => readCredentials({ HF_API_KEY: `Key ${KEY}` })).toThrow(/scheme/);
    expect(() => readCredentials({ HF_API_KEY: KEY, HF_API_BASE_URL: "http://api.higgsfield.ai" })).toThrow(/https/);
  });

  it("trims a trailing slash from a configured base URL", () => {
    expect(readCredentials({ HF_API_KEY: KEY, HF_API_BASE_URL: "https://api.higgsfield.ai/" }).baseUrl).toBe(BASE);
  });
});

describe("platform client", () => {
  it("submits to the model path with the Key header and maps the queued response", async () => {
    const { calls, fetch } = fakeFetch(() => json({ request_id: "req_1", status_url: `${BASE}/requests/req_1/status`, cancel_url: `${BASE}/requests/req_1/cancel` }));
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch });
    const queued = await client.submit("higgsfield-ai/soul/v2/standard", { prompt: "x" });
    expect(queued).toEqual({ status: "queued", requestId: "req_1", statusUrl: `${BASE}/requests/req_1/status`, cancelUrl: `${BASE}/requests/req_1/cancel` });
    expect(calls[0]!.url).toBe(`${BASE}/higgsfield-ai/soul/v2/standard`);
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Key ${KEY}`);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(calls[0]!.init.body).toBe(JSON.stringify({ prompt: "x" }));
  });

  it("rejects a path that could escape the model namespace", async () => {
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch: fakeFetch(() => json({})).fetch });
    await expect(client.submit("../requests", {})).rejects.toThrow(/Invalid model path/);
  });

  it("reads status, cancel and rate-limit details", async () => {
    const { calls, fetch } = fakeFetch(({ url }) => {
      if (url.endsWith("/status")) return json({ request_id: "req_1", status: "completed", images: [{ url: "https://cdn.example/a.png" }, { bad: true }] });
      if (url.endsWith("/cancel")) return new Response("", { status: 202 });
      return json({ detail: "slow down" }, 429, { "retry-after": "7" });
    });
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch });
    const status = await client.status("req_1");
    expect(status.images).toEqual([{ url: "https://cdn.example/a.png" }]);
    await client.cancel("req_1");
    expect(calls[1]!.url).toBe(`${BASE}/requests/req_1/cancel`);
    expect(calls[1]!.init.method).toBe("POST");
    const failure = await client.submit("flux-2-pro", { prompt: "x" }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(PlatformError);
    expect((failure as PlatformError).retryAfterSeconds).toBe(7);
    expect((failure as PlatformError).isRateLimit).toBe(true);
    expect((failure as PlatformError).message).toBe("slow down");
  });

  it("passes a plain-text refusal from the network through instead of blaming the key", async () => {
    const { fetch } = fakeFetch(() => new Response("Host not in allowlist: api.higgsfield.ai", { status: 403 }));
    await expect(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch }).status("r")).rejects.toThrow(/Host not in allowlist.*\(403\)/);
  });

  it("never writes the key or a signed upload URL to the log", async () => {
    const lines: string[] = [];
    const { fetch } = fakeFetch(({ url }) =>
      url.endsWith("/files/generate-upload-url")
        ? json({ upload_url: "https://storage.example/signed?sig=SECRET", public_url: "https://cdn.example/pub.png", content_type: "image/png", upload_headers: { "Content-Type": "image/png" } })
        : json({ request_id: "r" }),
    );
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch, log: (line) => lines.push(line) });
    await client.createUpload("image/png");
    await client.submit("flux-2-pro", { prompt: "hello" });
    expect(lines.join("\n")).not.toContain(KEY);
    expect(lines.join("\n")).not.toContain("SECRET");
    expect(lines.join("\n")).toContain("hello");
  });
});

describe("reference upload", () => {
  it("requests a ticket with the key, then PUTs with only the ticket headers", async () => {
    const file = join(dir, "ref.png");
    writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const { calls, fetch } = fakeFetch(({ url }) =>
      url.endsWith("/files/generate-upload-url")
        ? json({ upload_url: "https://storage.example/signed", public_url: "https://cdn.example/ref.png", content_type: "image/png", upload_headers: { "Content-Type": "image/png", "x-goog-meta": "1" } })
        : new Response("", { status: 200 }),
    );
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch });
    const result = await uploadReferenceFile(client, file);
    expect(result).toEqual({ url: "https://cdn.example/ref.png", contentType: "image/png" });
    expect(calls[0]!.init.body).toBe(JSON.stringify({ content_type: "image/png" }));
    const put = calls[1]!;
    expect(put.url).toBe("https://storage.example/signed");
    expect(put.init.method).toBe("PUT");
    expect(put.init.credentials).toBe("omit");
    expect(put.init.headers).toEqual({ "Content-Type": "image/png", "x-goog-meta": "1" });
  });

  it("does not report a public URL when the storage PUT fails", async () => {
    const file = join(dir, "ref.jpg");
    writeFileSync(file, "x");
    const { fetch } = fakeFetch(({ url }) =>
      url.endsWith("/files/generate-upload-url")
        ? json({ upload_url: "https://storage.example/signed", public_url: "https://cdn.example/ref.jpg", content_type: "image/jpeg", upload_headers: { "Content-Type": "image/jpeg" } })
        : new Response("", { status: 403 }),
    );
    await expect(uploadReferenceFile(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch }), file)).rejects.toThrow(/upload failed \(403\)/);
  });

  it("refuses a file type the platform does not accept", async () => {
    const file = join(dir, "ref.svg");
    writeFileSync(file, "<svg/>");
    await expect(uploadReferenceFile(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch: fakeFetch(() => json({})).fetch }), file)).rejects.toThrow(/Unsupported/);
  });
});

describe("polling", () => {
  const sleep = async () => {};

  it("returns the first terminal status", async () => {
    const statuses = ["queued", "in_progress", "completed"];
    const { fetch } = fakeFetch(() => json({ request_id: "r", status: statuses.shift() }));
    const status = await waitForRequest(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch }), "r", { sleep, intervalMs: 1 });
    expect(status.status).toBe("completed");
  });

  it("keeps nsfw, failed and canceled as terminal answers rather than errors", async () => {
    for (const terminal of ["nsfw", "failed", "canceled"]) {
      const { fetch } = fakeFetch(() => json({ request_id: "r", status: terminal }));
      await expect(waitForRequest(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch }), "r", { sleep })).resolves.toMatchObject({ status: terminal });
    }
  });

  it("backs off on rate limits and gives up after repeated transient failures", async () => {
    const waits: number[] = [];
    let n = 0;
    const { fetch } = fakeFetch(() => (n++ < 2 ? json({ detail: "busy" }, 429, { "retry-after": "10" }) : json({ request_id: "r", status: "completed" })));
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch });
    await waitForRequest(client, "r", { intervalMs: 100, sleep: async (ms) => void waits.push(ms) });
    expect(waits).toEqual([10_000, 10_000]);

    const always = fakeFetch(() => json({ detail: "down" }, 503));
    await expect(waitForRequest(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch: always.fetch }), "r", { intervalMs: 1, sleep })).rejects.toThrow(/503|down/);
    expect(always.calls).toHaveLength(3);
  });

  it("stops at once on an authorization failure", async () => {
    const { calls, fetch } = fakeFetch(() => json({ detail: "bad key" }, 401));
    await expect(waitForRequest(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch }), "r", { sleep })).rejects.toThrow(/bad key/);
    expect(calls).toHaveLength(1);
  });

  it("times out without cancelling, naming the request id", async () => {
    let clock = 0;
    const { fetch } = fakeFetch(() => json({ request_id: "r", status: "in_progress" }));
    const failure = await waitForRequest(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch }), "r", { intervalMs: 1000, deadlineMs: 2500, sleep: async (ms) => void (clock += ms), now: () => clock }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WaitTimeoutError);
    expect((failure as Error).message).toContain("status r");
  });
});

describe("catalog", () => {
  it("keeps every vendored model installed and mapped", () => {
    expect(MODELS.length).toBe(38);
    expect(listModels("image").map((model) => model.id)).toEqual(expect.arrayContaining(["soul-2", "soul-cinema", "flux-2", "z-image-turbo", "qwen-image-3", "ideogram-4", "recraft-4.1", "grok-imagine-2"]));
    expect(listModels("video").map((model) => model.id)).toEqual(expect.arrayContaining(["seedance-2", "seedance-2.5", "kling-3-pro", "wan-3"]));
    for (const model of MODELS) expect(Boolean(model.toPlatform || model.paths), model.id).toBe(true);
  });

  it("builds the documented Seedance text-to-video body from the defaults", () => {
    const { path, body } = buildPlatformRequest({ modelId: "seedance-2", prompt: "A cinematic tracking shot", settings: { generateAudio: true } });
    expect(path).toBe("bytedance/seedance-2.0/text-to-video");
    expect(body).toEqual({ prompt: "A cinematic tracking shot", resolution: "720p", generate_audio: true, duration: 5, aspect_ratio: "16:9" });
  });

  it("builds an image request and routes a start frame to image-to-video", () => {
    expect(buildPlatformRequest({ modelId: "flux-2", prompt: "a kettlebell", settings: { aspectRatio: "4:3" } })).toMatchObject({ path: "flux-2-pro", body: { prompt: "a kettlebell", aspect_ratio: "4:3", resolution: "1k" } });
    expect(buildPlatformRequest({ modelId: "kling-2.6", prompt: "swing", media: { start: ["https://cdn.example/s.png"] } })).toMatchObject({ path: "kling-video/v2.6/pro/image-to-video", body: { image_url: "https://cdn.example/s.png" } });
  });

  it("validates settings against the model schema", () => {
    expect(() => buildPlatformRequest({ modelId: "soul-2", prompt: "x", settings: { aspectRatio: "7:1" } })).toThrow(/Invalid aspectRatio/);
    expect(() => parseSettingFlags("soul-2", ["nope=1"])).toThrow(/no setting/);
    expect(parseSettingFlags("seedance-2", ["duration=8", "generateAudio=false", "resolution=1080p"])).toEqual({ duration: 8, generateAudio: false, resolution: "1080p" });
  });
});

describe("generate with the ledger", () => {
  const statusCompleted = (id: string) => json({ request_id: id, status: "completed", images: [{ url: "https://cdn.example/out.png" }] });
  const png = () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } });

  it("submits once, downloads the output and records the run", async () => {
    const { calls, fetch } = fakeFetch(({ url }) => (url.endsWith("/status") ? statusCompleted("req_9") : url.startsWith("https://cdn.example") ? png() : json({ request_id: "req_9", status_url: "", cancel_url: "" })));
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch });
    const ledger = new RunLedger(join(dir, "ledger.json"));
    const outcome = await generate(client, ledger, { modelId: "soul-2", prompt: "front squat", label: "front-squat" }, { outDir: dir, fetch, wait: { sleep: async () => {}, intervalMs: 1 } });
    expect(outcome.entry.state).toBe("completed");
    expect(outcome.files).toEqual([join(dir, "front-squat", "front-squat-1.png")]);
    expect(existsSync(join(dir, "front-squat", "manifest.json"))).toBe(true);
    expect(calls.filter((call) => call.url === `${BASE}/higgsfield-ai/soul/v2/standard`)).toHaveLength(1);
    const saved = JSON.parse(readFileSync(join(dir, "ledger.json"), "utf8")) as { runs: Array<Record<string, unknown>> };
    expect(saved.runs[0]).toMatchObject({ state: "completed", requestId: "req_9", modelPath: "higgsfield-ai/soul/v2/standard" });
    expect(JSON.stringify(saved)).not.toContain(KEY);
  });

  it("does not resubmit identical inputs: a completed run is reused, an unknown one is refused", async () => {
    const { calls, fetch } = fakeFetch(({ url }) => (url.endsWith("/status") ? statusCompleted("req_9") : url.startsWith("https://cdn.example") ? png() : json({ request_id: "req_9" })));
    const client = createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch });
    const ledger = new RunLedger(join(dir, "ledger.json"));
    const request = { modelId: "soul-2", prompt: "front squat" };
    await generate(client, ledger, request, { outDir: dir, fetch, wait: { sleep: async () => {} } });
    await generate(client, ledger, request, { outDir: dir, fetch, wait: { sleep: async () => {} } });
    expect(calls.filter((call) => call.url === `${BASE}/higgsfield-ai/soul/v2/standard`)).toHaveLength(1);

    const key = idempotencyKey("higgsfield-ai/soul/v2/standard", { prompt: "ambiguous", batch_size: 1, resolution: "720p", aspect_ratio: "1:1", enhance_prompt: false });
    ledger.begin({ key, label: undefined, modelId: "soul-2", modelPath: "higgsfield-ai/soul/v2/standard", body: {} });
    await expect(generate(client, ledger, { modelId: "soul-2", prompt: "ambiguous" }, { outDir: dir, fetch })).rejects.toBeInstanceOf(DuplicateSubmitError);
  });

  it("leaves an ambiguous submit as submitting and a refused one as failed", async () => {
    const ledger = new RunLedger(join(dir, "ledger.json"));
    const network = fakeFetch(() => {
      throw new Error("socket hang up");
    });
    await expect(generate(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch: network.fetch }), ledger, { modelId: "flux-2", prompt: "a" }, { outDir: dir })).rejects.toThrow(/socket/);
    expect(ledger.all()[0]).toMatchObject({ state: "submitting", error: "socket hang up" });

    const refused = fakeFetch(() => json({ detail: [{ loc: ["body", "prompt"], msg: "field required" }] }, 422));
    await expect(generate(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch: refused.fetch }), ledger, { modelId: "flux-2", prompt: "b" }, { outDir: dir })).rejects.toThrow(/prompt: field required/);
    expect(ledger.all()[1]).toMatchObject({ state: "failed" });
  });

  it("keeps a content-filtered run visible as nsfw with no files", async () => {
    const { fetch } = fakeFetch(({ url }) => (url.endsWith("/status") ? json({ request_id: "req_n", status: "nsfw" }) : json({ request_id: "req_n" })));
    const ledger = new RunLedger(join(dir, "ledger.json"));
    const outcome = await generate(createPlatformClient({ apiKey: KEY, baseUrl: BASE, fetch }), ledger, { modelId: "flux-2", prompt: "x" }, { outDir: dir, wait: { sleep: async () => {} } });
    expect(outcome.entry).toMatchObject({ state: "nsfw", error: expect.stringContaining("content filter") });
    expect(outcome.files).toEqual([]);
  });
});

describe("cli argument parsing", () => {
  it("collects repeated flags and positionals", () => {
    expect(parseArgs(["generate", "--model", "soul-2", "--ref", "a.png", "--ref", "b.png", "--force", "--prompt", "p"])).toEqual({
      command: "generate",
      positional: [],
      flags: { model: ["soul-2"], ref: ["a.png", "b.png"], force: true, prompt: ["p"] },
    });
    expect(parseArgs(["status", "req_1"])).toEqual({ command: "status", positional: ["req_1"], flags: {} });
  });
});
