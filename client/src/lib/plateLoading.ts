/**
 * Plate loading: what to put on each side of a bar for a target total.
 *
 * Deterministic arithmetic only. It never logs a set, changes a prescription or
 * starts a timer: the answer is text and a picture of a bar, nothing more.
 *
 * - The target is the TOTAL on the bar, bar included:
 *   total = bar + collars (only when the athlete includes them) + 2 × (plates on one side).
 * - Plate counts are individual plates. A pair is two of the same plate; one plate of a
 *   size cannot be used, because the bar has to be loaded the same on both sides.
 * - lb and kg are separate inventories. A 45 lb plate is never relabelled as a 20 kg one,
 *   and a target typed in one unit is never read in the other.
 * - Weights are integers in hundredths of the unit, divided by the greatest common factor
 *   of the plates on the bar, so 1.25 and 2.5 plates add up exactly (no floating point).
 * - The exact answer is found by an exhaustive bounded search, not greedily: 165 lb on a
 *   45 lb bar with one pair of 45s and two pairs of 30s is 30 + 30 a side, which a
 *   "heaviest plate first" rule never finds. Among exact answers the fewest plates win,
 *   then the one with more of the larger plates.
 * - When the exact total cannot be loaded, the nearest loadable totals below and above
 *   are offered; the target itself is never silently rounded.
 */

export type PlateUnit = "lb" | "kg";
/** One plate size and how many individual plates of it there are. */
export type PlateStock = { weight: number; count: number };
export type PlateProfile = {
  bar: number;
  plates: PlateStock[];
  /** Collars count only when the athlete says so; their weight is per collar. */
  collars: { included: boolean; each: number };
};

/** Editable starting points, not assumptions: every value here can be changed in the sheet. */
export const defaultPlateProfiles: Readonly<Record<PlateUnit, PlateProfile>> = {
  lb: { bar: 45, plates: [{ weight: 45, count: 8 }, { weight: 35, count: 2 }, { weight: 25, count: 4 }, { weight: 10, count: 4 }, { weight: 5, count: 4 }, { weight: 2.5, count: 4 }], collars: { included: false, each: 2.5 } },
  kg: { bar: 20, plates: [{ weight: 25, count: 4 }, { weight: 20, count: 6 }, { weight: 15, count: 2 }, { weight: 10, count: 4 }, { weight: 5, count: 4 }, { weight: 2.5, count: 4 }, { weight: 1.25, count: 4 }], collars: { included: false, each: 2.5 } },
};

/** Common bars to pick from, as chips; any positive weight can be typed instead. */
export const barPresets: Readonly<Record<PlateUnit, number[]>> = { lb: [45, 35, 25, 15], kg: [20, 15, 10] };

/** The largest target this handles; far beyond any bar a gym loads, small enough to stay instant. */
export const maxPlateTarget: Readonly<Record<PlateUnit, number>> = { lb: 2000, kg: 1000 };

const HUNDREDTHS = 100;

/** A typed amount in hundredths of the unit; null when it is not a plain non-negative number with at most two decimals. */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$|^\.\d+$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > 2) return null;
  const value = Number(whole || "0") * HUNDREDTHS + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(value) ? value : null;
}

/** Hundredths back to the way a person writes a weight: 45, 2.5, 1.25, 102.5. */
export function formatAmount(hundredths: number): string {
  const whole = Math.trunc(hundredths / HUNDREDTHS);
  const fraction = Math.abs(hundredths % HUNDREDTHS);
  if (!fraction) return String(whole);
  return `${whole}.${String(fraction).padStart(2, "0").replace(/0$/, "")}`;
}

const toHundredths = (value: number) => Math.round(value * HUNDREDTHS);

export type PlateLoad = {
  /** The total on the bar, in the unit. */
  total: number;
  /** Plates on ONE side, heaviest (innermost) first. The other side is the same. */
  perSide: number[];
  /** The same plates grouped: size and how many on each side. */
  grouped: { weight: number; perSide: number }[];
};

export type PlateResult =
  | { kind: "empty" }
  | { kind: "invalid"; field: "target" | "bar" | "plates" | "collars"; message: string }
  | { kind: "below-bar"; target: number; base: number }
  | { kind: "exact"; target: number; base: number; load: PlateLoad }
  | { kind: "inexact"; target: number; base: number; lower: PlateLoad | null; higher: PlateLoad | null; maxTotal: number };

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** The plate sizes as integer hundredths and pairs, largest first; a size with fewer than two plates cannot be paired. */
function pairsOf(plates: PlateStock[]): { size: number; pairs: number }[] {
  const bySize = new Map<number, number>();
  for (const plate of plates) {
    const size = toHundredths(plate.weight);
    if (size <= 0 || !Number.isFinite(plate.count) || plate.count <= 0) continue;
    bySize.set(size, (bySize.get(size) ?? 0) + Math.floor(plate.count));
  }
  return Array.from(bySize.entries()).map(([size, count]) => ({ size, pairs: Math.floor(count / 2) })).filter((entry) => entry.pairs > 0).sort((a, b) => b.size - a.size);
}

function validateProfile(profile: PlateProfile, unit: PlateUnit): PlateResult | null {
  if (!Number.isFinite(profile.bar) || profile.bar <= 0 || toHundredths(profile.bar) / HUNDREDTHS !== profile.bar) return { kind: "invalid", field: "bar", message: "Enter the bar's weight as a positive number, like 45 or 20." };
  if (profile.bar > maxPlateTarget[unit]) return { kind: "invalid", field: "bar", message: `A bar over ${maxPlateTarget[unit]} ${unit} isn't supported.` };
  for (const plate of profile.plates) {
    if (!Number.isFinite(plate.weight) || plate.weight <= 0 || toHundredths(plate.weight) / HUNDREDTHS !== plate.weight) return { kind: "invalid", field: "plates", message: "Each plate size must be a positive number with at most two decimals." };
    if (!Number.isInteger(plate.count) || plate.count < 0 || plate.count > 200) return { kind: "invalid", field: "plates", message: "Plate counts must be whole numbers from 0 to 200." };
  }
  if (profile.collars.included && (!Number.isFinite(profile.collars.each) || profile.collars.each < 0 || toHundredths(profile.collars.each) / HUNDREDTHS !== profile.collars.each)) return { kind: "invalid", field: "collars", message: "Enter each collar's weight as a number, or leave collars out." };
  return null;
}

/**
 * Fewest-plates table over the plate sizes from `index` onward: best[index][s] is the fewest
 * pairs that make side weight s (in steps of the common factor) using only those sizes.
 */
function fewestPairsTables(sizes: { size: number; pairs: number }[], limit: number): Int32Array[] {
  const INF = 1 << 29;
  const tables: Int32Array[] = new Array(sizes.length + 1);
  const last = new Int32Array(limit + 1).fill(INF);
  last[0] = 0;
  tables[sizes.length] = last;
  for (let index = sizes.length - 1; index >= 0; index--) {
    const { size, pairs } = sizes[index];
    const next = tables[index + 1];
    const table = new Int32Array(limit + 1).fill(INF);
    for (let sum = 0; sum <= limit; sum++) {
      let best = INF;
      for (let used = 0; used <= pairs && used * size <= sum; used++) {
        const rest = next[sum - used * size];
        if (rest + used < best) best = rest + used;
      }
      table[sum] = best;
    }
    tables[index] = table;
  }
  return tables;
}

/** Reads one loading back from the tables: at each size, the most of it that still leaves the fewest plates. */
function rebuild(sizes: { size: number; pairs: number }[], tables: Int32Array[], sum: number, factor: number, base: number): PlateLoad {
  const perSide: number[] = [];
  const grouped: { weight: number; perSide: number }[] = [];
  let remaining = sum;
  for (let index = 0; index < sizes.length; index++) {
    const { size, pairs } = sizes[index];
    const target = tables[index][remaining];
    for (let used = Math.min(pairs, Math.floor(remaining / size)); used >= 0; used--) {
      if (tables[index + 1][remaining - used * size] + used === target) {
        if (used) grouped.push({ weight: (size * factor) / HUNDREDTHS, perSide: used });
        for (let n = 0; n < used; n++) perSide.push((size * factor) / HUNDREDTHS);
        remaining -= used * size;
        break;
      }
    }
  }
  return { total: (base + 2 * sum * factor) / HUNDREDTHS, perSide, grouped };
}

/**
 * The loading for a typed target. `targetText` is what the athlete typed, so an empty box
 * reads as "nothing asked yet" rather than as an error.
 */
export function calculatePlates(targetText: string, profile: PlateProfile, unit: PlateUnit): PlateResult {
  if (!targetText.trim()) return { kind: "empty" };
  const target = parseAmount(targetText);
  if (target === null) {
    return { kind: "invalid", field: "target", message: /\.\d{3,}/.test(targetText) ? "Use at most two decimal places." : "Enter the total as a number, like 185 or 102.5." };
  }
  if (target > maxPlateTarget[unit] * HUNDREDTHS) return { kind: "invalid", field: "target", message: `Enter a total up to ${maxPlateTarget[unit]} ${unit}.` };
  const problem = validateProfile(profile, unit);
  if (problem) return problem;
  const base = toHundredths(profile.bar) + (profile.collars.included ? 2 * toHundredths(profile.collars.each) : 0);
  if (target < base) return { kind: "below-bar", target: target / HUNDREDTHS, base: base / HUNDREDTHS };

  const pairs = pairsOf(profile.plates);
  const fullSide = pairs.reduce((sum, entry) => sum + entry.size * entry.pairs, 0);
  const maxTotal = (base + 2 * fullSide) / HUNDREDTHS;
  if (target === base) return { kind: "exact", target: target / HUNDREDTHS, base: base / HUNDREDTHS, load: { total: base / HUNDREDTHS, perSide: [], grouped: [] } };
  if (!pairs.length) return { kind: "inexact", target: target / HUNDREDTHS, base: base / HUNDREDTHS, lower: { total: base / HUNDREDTHS, perSide: [], grouped: [] }, higher: null, maxTotal };

  // Work in steps of the plates' common factor: 45/25/10/5/2.5 lb is steps of 2.5 lb.
  const factor = pairs.reduce((acc, entry) => gcd(acc, entry.size), 0);
  const sizes = pairs.map((entry) => ({ size: entry.size / factor, pairs: entry.pairs }));
  const sideHundredths = (target - base) / 2;
  const sideSteps = sideHundredths / factor;
  const largest = sizes[0].size;
  const fullSteps = fullSide / factor;
  // The nearest loadable side above the target is at most one plate heavier (remove plates
  // from any heavier loading one at a time), so the table never needs to reach further.
  const limit = Math.min(fullSteps, Math.floor(sideSteps) + largest);
  const tables = fewestPairsTables(sizes, limit);
  const reachable = (steps: number) => steps >= 0 && steps <= limit && tables[0][steps] < 1 << 29;

  if (Number.isInteger(sideSteps) && reachable(sideSteps)) {
    return { kind: "exact", target: target / HUNDREDTHS, base: base / HUNDREDTHS, load: rebuild(sizes, tables, sideSteps, factor, base) };
  }
  let lower: PlateLoad | null = null;
  for (let steps = Math.min(Math.ceil(sideSteps) - 1, limit); steps >= 0; steps--) {
    if (reachable(steps)) { lower = rebuild(sizes, tables, steps, factor, base); break; }
  }
  let higher: PlateLoad | null = null;
  for (let steps = Math.floor(sideSteps) + 1; steps <= limit; steps++) {
    if (reachable(steps)) { higher = rebuild(sizes, tables, steps, factor, base); break; }
  }
  return { kind: "inexact", target: target / HUNDREDTHS, base: base / HUNDREDTHS, lower, higher, maxTotal };
}

/** "45 + 25 lb", or "No plates" for an empty bar. */
export function eachSideText(load: PlateLoad, unit: PlateUnit): string {
  return load.perSide.length ? `${load.perSide.map((weight) => formatAmount(toHundredths(weight))).join(" + ")} ${unit}` : "No plates";
}

/** "Total: 185 lb, including the 45 lb bar" (and the collars when they count). */
export function totalText(load: PlateLoad, profile: PlateProfile, unit: PlateUnit): string {
  const bar = `the ${formatAmount(toHundredths(profile.bar))} ${unit} bar`;
  const collars = profile.collars.included ? ` and two ${formatAmount(toHundredths(profile.collars.each))} ${unit} collars` : "";
  return `Total: ${formatAmount(toHundredths(load.total))} ${unit}, including ${bar}${collars}`;
}

/** The copyable instructions; the screen's text is built from the same result. */
export function loadingInstructions(result: PlateResult, profile: PlateProfile, unit: PlateUnit, exerciseName?: string): string | null {
  const heading = (total: number) => `${exerciseName ? `${exerciseName} — ` : ""}${formatAmount(toHundredths(total))} ${unit}`;
  const lines = (load: PlateLoad) => [`Each side: ${eachSideText(load, unit)}`, totalText(load, profile, unit)];
  if (result.kind === "exact") return [heading(result.load.total), ...lines(result.load)].join("\n");
  if (result.kind === "inexact") {
    const options = [result.lower, result.higher].filter((load): load is PlateLoad => Boolean(load));
    if (!options.length) return null;
    return [`${formatAmount(toHundredths(result.target))} ${unit} can't be loaded exactly with these plates.`, ...options.flatMap((load) => ["", heading(load.total), ...lines(load)])].join("\n");
  }
  return null;
}

/** Pairs available of each size, for the inventory list ("4 plates · 2 pairs"). */
export function pairsText(count: number): string {
  const pairs = Math.floor(count / 2);
  return `${count} plate${count === 1 ? "" : "s"} · ${pairs} pair${pairs === 1 ? "" : "s"}${count % 2 ? " (one spare can't be paired)" : ""}`;
}
