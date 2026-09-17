/**
 * The loading profile as one shape instead of four tiles.
 *
 * The four demand indices - tension through the range, load near the stretch,
 * load near the shortened position, positional control - were drawn as four
 * separate bordered boxes, each with a label, a number and a hairline bar, and
 * then repeated four-per-exercise underneath. Twelve near-identical widgets to
 * carry twelve numbers, and the one thing they are for was invisible: these
 * measures are only interesting *relative to each other*. A muscle loaded 80 in
 * the stretch and 25 at the top is a different exercise from the reverse, and
 * the old layout made those look the same.
 *
 * So: one shared axis, one hue, length carries the value, and the contrast that
 * matters gets said out loud. Nothing here invents data - the sentence is a
 * reading of the same four numbers already on screen.
 */

export type LoadingMetrics = {
  mechanicalLoading: number;
  longLengthLoading: number;
  peakContraction: number;
  stabilizationDemand: number;
};

export type ProfileBar = {
  key: keyof LoadingMetrics;
  /** Short enough to sit in a fixed label column. */
  label: string;
  /** What the index actually means, for the title attribute. */
  meaning: string;
  value: number;
};

/**
 * Fixed order, never sorted by value.
 *
 * Re-ordering per muscle would make the shape unreadable across rows: the whole
 * point is that the same position means the same measure every time. Stretch and
 * shortened sit adjacent because their difference is the comparison worth making.
 */
export const profileOrder: readonly { key: keyof LoadingMetrics; label: string; meaning: string }[] = [
  { key: "mechanicalLoading", label: "Tension", meaning: "Tension opportunity through the range." },
  { key: "longLengthLoading", label: "Stretched", meaning: "Load available near the stretched position." },
  { key: "peakContraction", label: "Shortened", meaning: "Load available near the shortened position." },
  { key: "stabilizationDemand", label: "Control", meaning: "Positional control asked of this muscle." },
];

export function buildProfileBars(metrics: LoadingMetrics): ProfileBar[] {
  return profileOrder.map((entry) => ({ ...entry, value: Math.max(0, Math.min(100, Math.round(metrics[entry.key]))) }));
}

export type ProfileShape = {
  /** Which end of the range carries more load, or neither. */
  bias: "stretch" | "shortened" | "even";
  /** The gap between the two ends, in index points. */
  spread: number;
  /** One sentence describing the four numbers. Never a training claim. */
  summary: string;
};

/**
 * A gap this small is not a shape.
 *
 * These are authored catalog indices in steps of a few points, so calling a
 * 4-point difference a "stretch-biased" exercise would be reading noise as
 * signal.
 */
export const profileBiasThreshold = 12;

export function describeProfileShape(metrics: LoadingMetrics): ProfileShape {
  const spread = Math.round(metrics.longLengthLoading - metrics.peakContraction);
  const bias = Math.abs(spread) < profileBiasThreshold ? "even" : spread > 0 ? "stretch" : "shortened";
  const control = metrics.stabilizationDemand >= 55 ? " Heavy positional control." : "";
  const summary =
    bias === "stretch"
      ? `Loaded most near the stretch, by ${Math.abs(spread)} points.${control}`
      : bias === "shortened"
        ? `Loaded most near the top, by ${Math.abs(spread)} points.${control}`
        : `Loaded evenly across the range.${control}`;
  return { bias, spread, summary };
}

/**
 * Axis ticks for the shared scale.
 *
 * One midpoint gridline is enough to read a bar against; more would be chart junk
 * on a mark this thin.
 */
export const profileAxisTicks = [50] as const;

/** A compact, fixed-width sparkline path for one profile, for the per-exercise rows. */
export function profileSparkPoints(metrics: LoadingMetrics, width = 44, height = 16): string {
  const bars = buildProfileBars(metrics);
  const step = width / (bars.length - 1);
  return bars
    .map((bar, index) => `${(index * step).toFixed(1)},${(height - (bar.value / 100) * height).toFixed(1)}`)
    .join(" ");
}
