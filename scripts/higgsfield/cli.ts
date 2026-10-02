/**
 * Higgsfield generation tool for the coding agent.
 *
 *   HF_API_KEY=... npx tsx scripts/higgsfield/cli.ts <command> [options]
 *   pnpm higgsfield <command> [options]
 *
 * Commands
 *   models [--surface image|video]        list the installed catalog with each model's settings
 *   generate --model <id> --prompt "..."  submit, wait, download into design/higgsfield/runs/<label>/
 *       [--label name] [--set key=value ...] [--ref file|url ...] [--start file|url] [--end file|url]
 *       [--mode <inputMode>] [--force] [--no-wait] [--timeout <seconds>] [--verbose]
 *   upload <file>                         upload a reference and print its public URL
 *   status <request_id>                   one status read, printed as JSON
 *   wait <request_id> [--label name]      wait for a terminal status and download the result
 *   cancel <request_id>                   ask the platform to cancel a queued request
 *   runs                                  the ledger, newest last
 *
 * The key is read from HF_API_KEY only. It is never printed, and no output
 * file contains it.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnvFile } from "dotenv";
import { readCredentials } from "./credentials";
import { describeFailure, downloadOutputs, DuplicateSubmitError, generate, listModels } from "./generate";
import { RunLedger } from "./ledger";
import { createPlatformClient, PlatformError } from "./platform";
import { waitForRequest } from "./poll";
import { uploadReferenceFile } from "./upload";
import { getModel, type MediaRole } from "./catalog";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
export const RUNS_DIR = resolve(REPO_ROOT, "design/higgsfield/runs");
export const LEDGER_PATH = resolve(RUNS_DIR, "ledger.json");

type Parsed = { command: string; positional: string[]; flags: Record<string, string[] | true> };

export function parseArgs(argv: string[]): Parsed {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string[] | true> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]!;
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    const next = rest[index + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[name] = true;
      continue;
    }
    const current = flags[name];
    flags[name] = Array.isArray(current) ? [...current, next] : [next];
    index += 1;
  }
  return { command, positional, flags };
}

function one(flags: Parsed["flags"], name: string): string | undefined {
  const value = flags[name];
  return Array.isArray(value) ? value[value.length - 1] : undefined;
}

function many(flags: Parsed["flags"], name: string): string[] {
  const value = flags[name];
  return Array.isArray(value) ? value : [];
}

/** `key=value` settings, coerced to the type the model's setting declares. */
export function parseSettingFlags(modelId: string, pairs: string[]): Record<string, unknown> {
  const model = getModel(modelId);
  const settings: Record<string, unknown> = {};
  for (const pair of pairs) {
    const at = pair.indexOf("=");
    if (at < 1) throw new Error(`Setting must be key=value, got "${pair}"`);
    const key = pair.slice(0, at);
    const raw = pair.slice(at + 1);
    const field = model.settings[key];
    if (!field) throw new Error(`${model.label} has no setting "${key}". Available: ${Object.keys(model.settings).join(", ") || "none"}`);
    settings[key] = field.type === "range" ? Number(raw) : field.type === "boolean" ? raw === "true" : raw;
  }
  return settings;
}

const isUrl = (value: string) => /^https?:\/\//i.test(value);

async function main(argv: string[]): Promise<number> {
  const { command, positional, flags } = parseArgs(argv);
  if (command === "help" || flags.help) {
    console.log(usage());
    return 0;
  }
  if (command === "models") {
    const surface = one(flags, "surface");
    if (surface && surface !== "image" && surface !== "video") throw new Error("--surface must be image or video");
    for (const model of listModels(surface as "image" | "video" | undefined)) {
      const settings = Object.entries(model.settings)
        .map(([key, field]) => (field.type === "enum" ? `${key}=${field.values.join("|")} (${field.default})` : field.type === "range" ? `${key}=${field.min}..${field.max} (${field.default})` : `${key}=true|false (${field.default})`))
        .join("  ");
      const roles = Object.entries(model.roles).map(([role, max]) => `${role}×${max}`).join(",");
      console.log(`${model.id.padEnd(22)} ${model.surface.padEnd(5)} ${model.label.padEnd(30)} ${roles ? `[${roles}] ` : ""}${settings}`);
    }
    return 0;
  }

  const verbose = Boolean(flags.verbose);
  const log = (line: string) => console.error(line);
  loadLocalEnv();
  const client = createPlatformClient({ ...readCredentials(), log: verbose ? log : undefined });
  const ledger = new RunLedger(LEDGER_PATH);

  if (command === "upload") {
    const [file] = positional;
    if (!file) throw new Error("upload needs a file path");
    const { url } = await uploadReferenceFile(client, file);
    console.log(url);
    return 0;
  }

  if (command === "status") {
    const [requestId] = positional;
    if (!requestId) throw new Error("status needs a request id");
    console.log(JSON.stringify(await client.status(requestId), null, 2));
    return 0;
  }

  if (command === "cancel") {
    const [requestId] = positional;
    if (!requestId) throw new Error("cancel needs a request id");
    await client.cancel(requestId);
    const entry = ledger.findByRequestId(requestId);
    if (entry) ledger.update(entry.key, { state: "canceled", error: "Canceled." });
    console.log(`Cancel requested for ${requestId}; the platform reports "canceled" once it takes effect.`);
    return 0;
  }

  if (command === "wait") {
    const [requestId] = positional;
    if (!requestId) throw new Error("wait needs a request id");
    const status = await waitForRequest(client, requestId, { onStatus: (current) => log(`  ${requestId}: ${current.status}`), deadlineMs: timeoutMs(flags) });
    const entry = ledger.findByRequestId(requestId);
    const files = status.status === "completed" ? await downloadOutputs(status, RUNS_DIR, one(flags, "label") ?? entry?.label ?? requestId) : [];
    if (entry) ledger.update(entry.key, { state: status.status as never, outputs: files, ...(status.status !== "completed" ? { error: describeFailure(status) } : {}) });
    return report(status.status, files, status);
  }

  if (command === "runs") {
    for (const run of ledger.all()) console.log(`${run.updatedAt}  ${run.state.padEnd(10)} ${run.modelId.padEnd(18)} ${run.requestId ?? "-"}  ${run.label ?? run.key}${run.outputs?.length ? `  → ${run.outputs.join(", ")}` : ""}${run.error ? `  (${run.error})` : ""}`);
    return 0;
  }

  if (command === "generate") {
    const modelId = one(flags, "model");
    const prompt = one(flags, "prompt") ?? "";
    if (!modelId) throw new Error("generate needs --model <id>; see `models`");
    const media: Partial<Record<MediaRole, string[]>> = {};
    const attach = async (role: MediaRole, values: string[]) => {
      if (!values.length) return;
      media[role] = [];
      for (const value of values) {
        const url = isUrl(value) ? value : (await uploadReferenceFile(client, value)).url;
        if (!isUrl(value)) log(`Uploaded ${value} for ${role}`);
        media[role]!.push(url);
      }
    };
    await attach("reference", many(flags, "ref"));
    await attach("start", many(flags, "start"));
    await attach("end", many(flags, "end"));
    await attach("video", many(flags, "video"));
    await attach("audio", many(flags, "audio"));
    await attach("source", many(flags, "source"));

    try {
      const outcome = await generate(client, ledger, {
        modelId,
        prompt,
        media,
        inputMode: one(flags, "mode"),
        settings: parseSettingFlags(modelId, many(flags, "set")),
        label: one(flags, "label"),
        force: Boolean(flags.force),
      }, { outDir: RUNS_DIR, log, wait: { deadlineMs: timeoutMs(flags) } });
      return report(outcome.status.status, outcome.files, outcome.status);
    } catch (caught) {
      if (caught instanceof DuplicateSubmitError) {
        console.error(caught.message);
        return 3;
      }
      throw caught;
    }
  }

  throw new Error(`Unknown command "${command}".\n${usage()}`);
}

/** A shell variable wins; otherwise the untracked .env.local, then .env, at the repo root supply HF_API_KEY. */
function loadLocalEnv(): void {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(REPO_ROOT, name);
    if (existsSync(path)) loadEnvFile({ path, override: false, quiet: true });
  }
}

function timeoutMs(flags: Parsed["flags"]): number | undefined {
  const seconds = one(flags, "timeout");
  if (seconds === undefined) return undefined;
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) throw new Error("--timeout must be a positive number of seconds");
  return value * 1000;
}

function report(state: string, files: string[], status: { requestId: string; error?: unknown }): number {
  if (state === "completed") {
    console.log(JSON.stringify({ requestId: status.requestId, status: state, files }, null, 2));
    return 0;
  }
  console.error(`Request ${status.requestId} ended ${state}: ${describeFailure({ status: state, requestId: status.requestId, error: status.error, raw: null })}`);
  return 2;
}

function usage(): string {
  return `Usage: pnpm higgsfield <command> [options]

  models [--surface image|video]
  generate --model <id> --prompt "..." [--label name] [--set key=value]... [--ref file|url]... [--start ...] [--end ...] [--mode id] [--force] [--timeout seconds] [--verbose]
  upload <file>
  status <request_id>
  wait <request_id> [--label name] [--timeout seconds]
  cancel <request_id>
  runs

Set HF_API_KEY to the complete key copied from open.higgsfield.ai/api-keys. Outputs land in design/higgsfield/runs/.`;
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error: unknown) => {
      if (error instanceof PlatformError) {
        console.error(error.message);
        if (error.isRateLimit && error.retryAfterSeconds) console.error(`Retry after ${error.retryAfterSeconds}s.`);
        process.exit(error.isAuth ? 4 : 1);
      }
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    },
  );
}
