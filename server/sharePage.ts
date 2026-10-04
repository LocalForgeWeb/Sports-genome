import { readFile } from "node:fs/promises";
import path from "node:path";
import { readShare } from "./workoutShares";
import { shareExerciseCount } from "../shared/workoutShareFormat";

/**
 * The HTML for /s/<token>: the app's own page with the shared workout's name in the
 * head, so a link pasted into a message reads as the workout it is.
 *
 * Message apps and their link previews don't run the app; they read the title and
 * Open Graph tags of the HTML they're served. So this reads the share and writes its
 * title, a one-line description (what it is, who shared it if they said) and the
 * app's mark as the image into the page head. Nothing else from the workout is put in
 * the head: no notes, no exercise list. A link that's off, missing or unreadable gets
 * the generic text, never the old title. Every shared page is noindex - a link is
 * meant for the people it's sent to, not search.
 */
export const SHARE_PREVIEW_IMAGE = "https://qiccnqkypbhlwpmjcsri.supabase.co/storage/v1/object/public/sports-genome-assets/sports-genome-upright-s-dna-512_1a0f292a.png";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export type SharePageMeta = { title: string; description: string; url: string; image: string; found: boolean };

export function sharePageMeta(share: Awaited<ReturnType<typeof readShare>> | null, url: string): SharePageMeta {
  if (share?.state === "active") {
    const { snapshot } = share;
    const count = shareExerciseCount(snapshot);
    const what = snapshot.scope === "day" ? `A workout · ${count} exercise${count === 1 ? "" : "s"}` : `A week of training · ${snapshot.days.length} days · ${count} exercises`;
    const by = snapshot.attribution ? `, shared by ${snapshot.attribution}` : "";
    return { title: `${snapshot.title} · Sports Genome`, description: `${what}${by}. View it or save a copy to your plan in Sports Genome.`, url, image: SHARE_PREVIEW_IMAGE, found: true };
  }
  return { title: "Shared workout · Sports Genome", description: "A workout shared from Sports Genome.", url, image: SHARE_PREVIEW_IMAGE, found: false };
}

/** The app's index.html with the head rewritten for one shared page. */
export function sharePageHtml(template: string, meta: SharePageMeta): string {
  const tags = [
    `<meta name="robots" content="noindex, nofollow" />`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Sports Genome" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title.replace(/ · Sports Genome$/, ""))}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    `<meta property="og:image:width" content="512" />`,
    `<meta property="og:image:height" content="512" />`,
    `<meta property="og:image:alt" content="Sports Genome" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title.replace(/ · Sports Genome$/, ""))}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
  ].join("\n    ");
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`)
    // The app's own description, social tags and canonical give way to the workout's.
    .replace(/\s*<meta\s+(?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*)"[^>]*>/gi, "")
    .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, "")
    // The launch intro doesn't play on a shared page, so its artwork isn't fetched ahead.
    .replace(/\s*<link\s+rel="preload"\s+as="image"[^>]*>/gi, "")
    .replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

/**
 * Where the built index.html is: on disk beside the server when it was shipped with it
 * (the local server, and the function when the platform includes it), or else fetched
 * from the site itself and kept for a few minutes per running instance.
 */
let cached: { html: string; at: number } | null = null;
const TEMPLATE_TTL_MS = 5 * 60_000;

async function templateFromDisk(): Promise<string | null> {
  const here = typeof __dirname === "string" ? __dirname : process.cwd();
  for (const candidate of [path.resolve(process.cwd(), "dist/public/index.html"), path.resolve(here, "public/index.html"), path.resolve(here, "../dist/public/index.html")]) {
    try { return await readFile(candidate, "utf8"); } catch { /* next */ }
  }
  return null;
}

/** The hosts this deployment is reached at, as the platform names them. A request's own Host is used only when it is one of them. */
export function trustedOrigin(requestHost: string | undefined, env: NodeJS.ProcessEnv = process.env): string | null {
  const known = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_BRANCH_URL, env.VERCEL_URL, ...(env.SHARE_PAGE_HOSTS ?? "").split(",")].map((value) => value?.trim().toLowerCase()).filter((value): value is string => Boolean(value));
  const host = requestHost?.trim().toLowerCase();
  if (host && known.includes(host)) return `https://${host}`;
  return env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
}

export async function loadIndexTemplate(origin: string | null, fetcher: typeof fetch = fetch, now = Date.now()): Promise<string | null> {
  // From disk it is read each time: a rebuild beside a running server is then served at once.
  const local = await templateFromDisk();
  if (local && /<\/head>/i.test(local)) return local;
  if (cached && now - cached.at < TEMPLATE_TTL_MS) return cached.html;
  if (!origin) return null;
  try {
    const response = await fetcher(`${origin}/index.html`, { headers: { accept: "text/html" }, signal: AbortSignal.timeout(4000) });
    const html = response.ok ? await response.text() : "";
    if (/<\/head>/i.test(html)) { cached = { html, at: now }; return html; }
  } catch { /* none to hand */ }
  return null;
}
export function clearIndexTemplateCache() { cached = null; }

type HeaderBag = Record<string, string | string[] | undefined>;
type ShareResponse = { status(code: number): ShareResponse; setHeader(name: string, value: string): unknown; send(body: string): unknown };
const firstHeader = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Answers GET /s/<token> with the app, its head written for that share. */
export async function serveSharePage(rawToken: string, headers: HeaderBag, res: ShareResponse, fetcher: typeof fetch = fetch): Promise<void> {
  const token = /^[A-Za-z0-9_-]{1,80}$/.test(rawToken) ? rawToken : "";
  const host = firstHeader(headers["x-forwarded-host"]) ?? firstHeader(headers.host);
  // The template is fetched only from a host this deployment is known by; the page's own
  // address (og:url) is the one it was asked for, escaped, wherever it is served.
  const origin = trustedOrigin(host);
  const proto = firstHeader(headers["x-forwarded-proto"]) === "http" || (!headers["x-forwarded-proto"] && /^(localhost|127\.0\.0\.1)(:|$)/.test(host ?? "")) ? "http" : "https";
  const asked = host && /^[A-Za-z0-9.-]+(?::\d+)?$/.test(host) ? `${proto}://${host}` : null;
  let share: Awaited<ReturnType<typeof readShare>> | null = null;
  try { share = token ? await readShare(token) : { state: "missing" }; } catch { share = null; }
  const meta = sharePageMeta(share, `${asked ?? origin ?? ""}/s/${token}`);
  const template = await loadIndexTemplate(origin, fetcher);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // The page's state is read by the app when it opens; only the head is from now, so it isn't kept anywhere.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (template) { res.status(200).send(sharePageHtml(template, meta)); return; }
  // No template to hand: the head still describes the share, and the app is loaded in place.
  res.status(200).send(sharePageHtml(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title></title></head><body style="background:#07182e"><script>fetch("/index.html").then(function(r){return r.text()}).then(function(h){document.open();document.write(h);document.close()})</script></body></html>`, meta));
}
