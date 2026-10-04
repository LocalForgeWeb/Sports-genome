import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// No built page on disk here: the template comes from the site, as on a function without it.
vi.mock("node:fs/promises", () => ({ readFile: async () => { throw Object.assign(new Error("ENOENT"), { code: "ENOENT" }); } }));
const { clearIndexTemplateCache, loadIndexTemplate, serveSharePage, sharePageHtml, sharePageMeta, trustedOrigin } = await import("./sharePage");
import { createShare, disableShare, MemoryShareStore, useShareStore } from "./workoutShares";
import type { ShareSnapshot } from "../shared/workoutShare";

const template = `<!doctype html><html><head><meta charset="UTF-8" />
<title>Sports Genome — Decoding Performance</title>
<meta name="description" content="Build sport-aware workouts." />
<link rel="preload" as="image" href="https://example.com/boot.png" fetchpriority="high" />
</head><body><div id="root"></div><script type="module" src="/assets/index-abc.js"></script></body></html>`;

const snapshot: ShareSnapshot = { schema: 1, scope: "week", title: `Coach's "Upper" <Week>`, attribution: "Sam & Co", days: [
  { order: 1, label: "Upper", exercises: [{ order: 1, catalogId: 1, name: "Bench Press", prescription: "4 × 5", notes: "Private cue" }] },
  { order: 2, label: "Lower", exercises: [{ order: 1, catalogId: 2, name: "Squat", prescription: "5 × 5" }] },
] };

type Sent = { status: number; headers: Record<string, string>; body: string };
const response = () => {
  const sent: Sent = { status: 0, headers: {}, body: "" };
  const res = { status(code: number) { sent.status = code; return res; }, setHeader(name: string, value: string) { sent.headers[name.toLowerCase()] = value; }, send(body: string) { sent.body = body; } };
  return { res, sent };
};

/** Oct 4 sharing brief, message previews: the link reads as the workout, says nothing private, and is never indexed. */
describe("shared page head", () => {
  beforeEach(() => { useShareStore(new MemoryShareStore()); clearIndexTemplateCache(); });
  afterEach(() => { useShareStore(undefined); vi.unstubAllEnvs(); });

  it("names the workout, what it is and who shared it - and nothing from inside it", () => {
    const meta = sharePageMeta({ state: "active", token: "t", snapshot, createdAt: "", version: 1, newerToken: null }, "https://app.example/s/t");
    expect(meta.title).toBe(`Coach's "Upper" <Week> · Sports Genome`);
    expect(meta.description).toBe("A week of training · 2 days · 2 exercises, shared by Sam & Co. View it or save a copy to your plan in Sports Genome.");
    const html = sharePageHtml(template, meta);
    expect(html).toContain(`<title>Coach&#39;s &quot;Upper&quot; &lt;Week&gt; · Sports Genome</title>`);
    expect(html).toContain(`<meta property="og:title" content="Coach&#39;s &quot;Upper&quot; &lt;Week&gt;" />`);
    expect(html).toContain(`<meta name="robots" content="noindex, nofollow" />`);
    expect(html).toContain(`<meta property="og:url" content="https://app.example/s/t" />`);
    expect(html).toContain(`<meta name="twitter:card" content="summary" />`);
    expect(html).not.toContain("Private cue");
    expect(html).not.toContain("Bench Press");
    // The app's own description gives way, and there is one of each tag.
    expect(html).not.toContain("Build sport-aware workouts.");
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    // The intro's artwork isn't fetched ahead on a shared page; the app still loads.
    expect(html).not.toContain("boot.png");
    expect(html).toContain(`<script type="module" src="/assets/index-abc.js"></script>`);
  });

  it("gives a link that's off or missing the generic text, never its old title", async () => {
    const made = await createShare({ requestKey: "request-key-000001", manageSecret: "s".repeat(43), snapshot });
    await disableShare(made.token, "s".repeat(43));
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "app.example");
    for (const token of [made.token, "NoSuchTokenNoSuchToken", "<bad>"]) {
      const { res, sent } = response();
      await serveSharePage(token, { host: "app.example" }, res, (async () => new Response(template)) as unknown as typeof fetch);
      expect(sent.status).toBe(200);
      expect(sent.body).toContain("<title>Shared workout · Sports Genome</title>");
      expect(sent.body).not.toContain("Upper");
      expect(sent.headers["x-robots-tag"]).toBe("noindex, nofollow");
      expect(sent.headers["cache-control"]).toBe("no-store");
    }
  });

  it("serves an active share's head, and still describes it when the page template can't be had", async () => {
    const made = await createShare({ requestKey: "request-key-000002", manageSecret: "s".repeat(43), snapshot });
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "app.example");
    const { res, sent } = response();
    await serveSharePage(made.token, { host: "app.example" }, res, (async () => new Response("", { status: 500 })) as unknown as typeof fetch);
    expect(sent.body).toContain(`<meta property="og:url" content="https://app.example/s/${made.token}" />`);
    expect(sent.body).toContain("Sports Genome</title>");
    expect(sent.body).toContain('fetch("/index.html")');
  });

  it("fetches the template only from a host this deployment is known by", () => {
    const env = { VERCEL_PROJECT_PRODUCTION_URL: "app.example", VERCEL_BRANCH_URL: "app-git-main.example", VERCEL_URL: "app-abc123.example" } as NodeJS.ProcessEnv;
    expect(trustedOrigin("app-git-main.example", env)).toBe("https://app-git-main.example");
    expect(trustedOrigin("evil.example", env)).toBe("https://app.example");
    expect(trustedOrigin(undefined, {} as NodeJS.ProcessEnv)).toBeNull();
  });

  it("keeps the template it fetched rather than fetching it for every link", async () => {
    const fetcher = vi.fn(async () => new Response(template));
    expect(await loadIndexTemplate("https://app.example", fetcher as unknown as typeof fetch, 1000)).toBe(template);
    expect(await loadIndexTemplate("https://app.example", fetcher as unknown as typeof fetch, 2000)).toBe(template);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
