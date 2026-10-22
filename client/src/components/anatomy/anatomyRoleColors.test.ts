import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Sep 28 regression brief §10: a muscle's role colour is never read as a Strength rank. Body
 * Lab's supporting gold was ΔE00 4 from the State rank, and a row dot 3.8 from Prospect.
 */
const figureCss = readFileSync(resolve(process.cwd(), "client/src/components/anatomy/anatomy-figure.css"), "utf8");
const rankCss = readFileSync(resolve(process.cwd(), "client/src/capability-rank.css"), "utf8");
const mapSource = readFileSync(resolve(process.cwd(), "client/src/components/AnatomyMap.tsx"), "utf8");

const token = (css: string, name: string) => css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];

function lab(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = f(r * 0.2126 + g * 0.7152 + b * 0.0722), z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIEDE2000 colour difference. */
function deltaE(one: string, two: string) {
  const [L1, a1, b1] = lab(one), [L2, a2, b2] = lab(two);
  const rad = Math.PI / 180;
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hue = (x: number, y: number) => { if (!x && !y) return 0; const t = Math.atan2(y, x) / rad; return t >= 0 ? t : t + 360; };
  const h1p = hue(a1p, b1), h2p = hue(a2p, b2);
  let dhp = 0;
  if (C1p * C2p) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p) hbp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T;
  const RT = -Math.sin(2 * dTh * rad) * RC;
  const dL = (L2 - L1) / SL, dC = (C2p - C1p) / SC, dH = dHp / SH;
  return Math.sqrt(dL ** 2 + dC ** 2 + dH ** 2 + RT * dC * dH);
}

const ranks = ["prospect", "jv", "varsity", "regional", "state", "national", "world-stage"].map((rank) => [rank, token(rankCss, `--sg-rank-${rank}-color`)!] as const);
const role = (name: string) => token(figureCss, `--sg-role-${name}`)!;
const chroma = (hex: string) => { const [, a, b] = lab(hex); return Math.hypot(a, b); };
const lightness = (hex: string) => lab(hex)[0];

/**
 * October 21 (owner, "Red muscle palette"): the roles are one red family on the navy, primary the
 * vivid red, supporting the muted red, stabilizing the dusty rose, "No role recorded" slate.
 */
describe("role colours", () => {
  it("measures a known pair the way the diagnosis did", () => {
    // The old supporting gold against State: the collision that started the rank guard.
    expect(deltaE("#e9be55", "#DCAF3C")).toBeCloseTo(4.0, 0);
  });

  it("are the owner's palette", () => {
    expect([role("primary"), role("supporting"), role("stabilizing"), role("neutral-on-dark")].map((hex) => hex.toLowerCase())).toEqual(["#ff364a", "#cd6570", "#956570", "#34465a"]);
  });

  it("step down from primary: each role less saturated, and none lighter, than the one before", () => {
    const [primary, supporting, stabilizing, none] = [role("primary"), role("supporting"), role("stabilizing"), role("neutral-on-dark")];
    expect(chroma(primary)).toBeGreaterThan(chroma(supporting));
    expect(chroma(supporting)).toBeGreaterThan(chroma(stabilizing));
    expect(lightness(primary)).toBeGreaterThanOrEqual(lightness(supporting));
    expect(lightness(supporting)).toBeGreaterThan(lightness(stabilizing));
    expect(lightness(stabilizing)).toBeGreaterThan(lightness(none));
  });

  it("keeps the three reds and the slate apart from one another", () => {
    // One hue family, so the reds are told apart by saturation and lightness; each pair is still a
    // clear step (ΔE00 above 10), and "No role recorded" is nowhere near a red.
    const [primary, supporting, stabilizing, none] = [role("primary"), role("supporting"), role("stabilizing"), role("neutral-on-dark")];
    expect(deltaE(primary, supporting)).toBeGreaterThanOrEqual(10);
    expect(deltaE(supporting, stabilizing)).toBeGreaterThanOrEqual(10);
    expect(deltaE(primary, stabilizing)).toBeGreaterThanOrEqual(20);
    for (const red of [primary, supporting, stabilizing]) expect(deltaE(red, none)).toBeGreaterThanOrEqual(25);
  });

  it("stays at least 15 from every rank colour but National's crimson, which it sits near by choice", () => {
    // Sep 28 regression brief §10 kept every role 15 from every rank. A red family cannot clear
    // National's crimson by that much (primary 12.3, supporting 10.5, stabilizing 15.3); the owner
    // chose these reds and kept the rank palette as it is. Role views draw no rank colours, and
    // every role is named beside its colour, so the floor for National is a clear 10.
    expect(ranks.every(([, hex]) => hex)).toBe(true);
    for (const name of ["primary", "supporting", "stabilizing"]) {
      for (const [rank, rankHex] of ranks) expect(deltaE(role(name), rankHex), `${name} vs ${rank}`).toBeGreaterThanOrEqual(rank === "national" ? 10 : 15);
    }
  });

  it("has one owner: the figure, the legend and the row dots all read the tokens, flat", () => {
    expect(figureCss).toContain("--anatomy-primary-1: var(--sg-role-primary);");
    expect(figureCss).toContain("--anatomy-primary-2: var(--sg-role-primary);");
    expect(figureCss).toContain("--anatomy-supporting-1: var(--sg-role-supporting);");
    expect(figureCss).toContain("--anatomy-stabilizing-1: var(--sg-role-stabilizing);");
    for (const name of ["primary", "supporting", "stabilizing"]) expect(mapSource).toContain(`style={{ background: "var(--sg-role-${name})" }}`);
    expect(mapSource).toContain('Primary: "var(--sg-role-primary)", Stabilizer: "var(--sg-role-stabilizing)", Synergist: "var(--sg-role-supporting)"');
    // No gradient swatches, and none of the old orange, teal or champagne anywhere it could leak back.
    expect(mapSource).not.toContain("linear-gradient(180deg,var(--sg-role-");
    expect(`${figureCss}\n${mapSource}`).not.toMatch(/#ff783d|#f06c35|#25bcc3|#1e9ea6|#fce3a8|#f4deaa|#e9be55|#c08f24|#d5ad43|#7791a8/i);
  });

  it("never repaints a focused or selected muscle: both are outlines, so its colour keeps its meaning", () => {
    expect(figureCss).not.toMatch(/data-focused="true"\]\s*>\s*path\s*\{[^}]*fill/);
    expect(figureCss).not.toMatch(/data-selected="true"\]\s*>\s*path\s*\{[^}]*fill/);
  });
});
