/**
 * The run ledger: one JSON file recording every generation this tool submits,
 * keyed by an idempotency key derived from the model path and the exact body.
 *
 * Its job is to make an ambiguous failure safe. A submit that times out after
 * the platform may have accepted it is recorded as `submitting` before the
 * POST goes out; the next attempt with the same inputs finds that entry and
 * refuses to POST again until the operator resolves it (`--force` for a
 * deliberate re-run, or `status`/`cancel` on the recorded id). A completed
 * entry is returned instead of resubmitted, so the same illustration is not
 * paid for twice by accident.
 *
 * Nothing secret goes in here: model path, body, request id, status, output
 * paths. Signed upload URLs are not recorded; public reference URLs are.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type LedgerEntry = {
  key: string;
  label: string | undefined;
  modelId: string;
  modelPath: string;
  body: Record<string, unknown>;
  state: "submitting" | "queued" | "completed" | "failed" | "nsfw" | "canceled" | "timed_out";
  requestId?: string;
  statusUrl?: string;
  cancelUrl?: string;
  createdAt: string;
  updatedAt: string;
  outputs?: string[];
  error?: string;
};

export type Ledger = { version: 1; runs: LedgerEntry[] };

export function idempotencyKey(modelPath: string, body: Record<string, unknown>): string {
  return createHash("sha256").update(`${modelPath}\n${stableJson(body)}`).digest("hex").slice(0, 24);
}

export class RunLedger {
  private data: Ledger;

  constructor(readonly path: string) {
    this.data = existsSync(path) ? parse(readFileSync(path, "utf8")) : { version: 1, runs: [] };
  }

  all(): readonly LedgerEntry[] {
    return this.data.runs;
  }

  find(key: string): LedgerEntry | undefined {
    return this.data.runs.find((run) => run.key === key);
  }

  findByRequestId(requestId: string): LedgerEntry | undefined {
    return this.data.runs.find((run) => run.requestId === requestId);
  }

  /** Records an entry and writes it to disk before any network request is made. */
  begin(entry: Omit<LedgerEntry, "state" | "createdAt" | "updatedAt">): LedgerEntry {
    const now = new Date().toISOString();
    const next: LedgerEntry = { ...entry, state: "submitting", createdAt: now, updatedAt: now };
    this.data.runs = [...this.data.runs.filter((run) => run.key !== entry.key), next];
    this.save();
    return next;
  }

  update(key: string, patch: Partial<LedgerEntry>): LedgerEntry {
    const current = this.find(key);
    if (!current) throw new Error(`Ledger has no run ${key}`);
    const next: LedgerEntry = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.data.runs = this.data.runs.map((run) => (run.key === key ? next : run));
    this.save();
    return next;
  }

  private save(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(this.data, null, 2)}\n`);
    renameSync(tmp, this.path);
  }
}

function parse(text: string): Ledger {
  const parsed = JSON.parse(text) as Partial<Ledger>;
  if (parsed.version !== 1 || !Array.isArray(parsed.runs)) throw new Error("Unrecognised ledger format");
  return { version: 1, runs: parsed.runs };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
