/** Renders the built figures to PNG so the anatomy can be reviewed visually. */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");
const front = readFileSync(join(out, "body_front.svg"), "utf8");
const back = readFileSync(join(out, "body_back.svg"), "utf8");

const scale = Number(process.argv[2] || 1.6);
const html = `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#0d1b2e;display:flex;gap:28px;justify-content:center;padding:24px;font:11px system-ui;color:#8fa6bd">
  <figure style="margin:0;text-align:center"><div style="width:${232 * scale}px">${front}</div><figcaption>ANTERIOR</figcaption></figure>
  <figure style="margin:0;text-align:center"><div style="width:${232 * scale}px">${back}</div><figcaption>POSTERIOR</figcaption></figure>
</body>`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: Math.ceil(232 * scale * 2 + 100), height: Math.ceil(560 * scale + 90) }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.waitForTimeout(250);
await page.screenshot({ path: join(out, "preview.png") });
await browser.close();
console.log("wrote", join(out, "preview.png"));
