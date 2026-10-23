import { constraintChoices } from "@/lib/areaQuestion";
import { capacityTargetForMuscle } from "@/lib/capacityTargets";
import { scopedKey } from "@/lib/deviceStorageScope";
import type { ConstraintType } from "@shared/resilienceContext";
import { regionIndexEntry } from "@shared/specialization/regionIndex";
import { isDateKey } from "@shared/specialization/time";
import type { DiagramLayerId, DiagramViewId, RegionId, SpecializationRegion, SummaryMode } from "@shared/specialization/types";

/**
 * What the specialization page is showing, kept in the URL so Back, a reload and a
 * return from an add/swap land on the same muscle, window and view (brief §6,
 * "Persist region, selected muscle, side, time window, planned/completed mode, and
 * view in navigation state/URL"). No side is kept: both sides are counted as one (owner,
 * 20 Oct 2026), so there is no side to choose.
 *
 * Parameter names avoid the ones other workspaces own (`muscle`, `sport`, `movement`,
 * `discover`, `scope`, `session`): Home strips these on every other workspace.
 */
export type SpecializationWindow = "week" | "7d" | "custom";
export type SpecializationMapMode = "volume" | "target";
/**
 * How the map card draws the region: the 3D model, or the drawing. Null is automatic: the 3D
 * model when the region has one and the browser can show it, else the drawing. The address
 * names a figure only when the athlete chose one.
 */
export type SpecializationFigure = "model" | "drawing";
/**
 * A part of the page an entry point from elsewhere asks to open: the stack card, from Plan's
 * "Week N generated" notice (the stack design note, docs/specialization-atlas/11, §3.2, "Plan says so too"). The page
 * opens it and brings it into view; absent, the page opens as it was left.
 */
export type SpecializationSection = "stack";

export type SpecializationViewState = {
  regionId: RegionId;
  nodeId: string | null;
  window: SpecializationWindow;
  /** Custom window, local dates YYYY-MM-DD (inclusive). */
  from: string | null;
  to: string | null;
  mode: SummaryMode;
  /**
   * The drawing's view, by its own id (`front`, `palm`). Null is the drawing's first view, the
   * one the page opens on; the address names a view only when another one is chosen, and the
   * page falls back to the first view when the drawing has no view by that id.
   */
  view: DiagramViewId | null;
  layer: DiagramLayerId;
  map: SpecializationMapMode;
  figure: SpecializationFigure | null;
  /** The plan week planned exposure reads; null = the week Home trains from. */
  planWeek: number | null;
  /** A section an entry point asked the page to open (`open=stack`); absent when none was. */
  open?: SpecializationSection;
};

/**
 * The page's parameters. `limb` (an arm, later a leg) is no longer part of the page: both sides
 * are counted as one (owner, 20 Oct 2026). It stays in this list so an old address loses it on
 * the page's first rewrite, and so every other page strips it.
 */
export const specializationParamNames = ["region", "node", "limb", "window", "from", "to", "mode", "view", "layer", "map", "fig", "pweek", "open"] as const;

/** A view id's shape (the database checks the same): which views exist is the drawing's business. */
const VIEW_ID = /^[a-z][a-z0-9_]*$/;
const LAYERS: readonly DiagramLayerId[] = ["surface", "intermediate", "deep"];
/** The last date a custom window may end on: a day after it has no next day to end at. */
const LAST_DATE = "9999-12-30";

export function defaultSpecializationState(regionId: RegionId): SpecializationViewState {
  return { regionId, nodeId: null, window: "week", from: null, to: null, mode: "completed", view: null, layer: "surface", map: "volume", figure: null, planWeek: null };
}

/** Reads the page state from a URL, falling back field by field to the defaults. */
export function specializationStateFromParams(params: URLSearchParams, defaultRegionId: RegionId, knownRegions: ReadonlySet<RegionId>): SpecializationViewState {
  const regionParam = params.get("region");
  const regionId = regionParam && knownRegions.has(regionParam) ? regionParam : defaultRegionId;
  const base = defaultSpecializationState(regionId);
  const windowParam = params.get("window");
  const mode = params.get("mode");
  const view = params.get("view");
  const layer = params.get("layer");
  const map = params.get("map");
  const figure = params.get("fig");
  const from = params.get("from");
  const to = params.get("to");
  const planWeek = Number.parseInt(params.get("pweek") ?? "", 10);
  // Real calendar dates only (2026-02-30 is not one), so a hand-edited address can never reach the calculator.
  const custom = windowParam === "custom" && isDateKey(from) && isDateKey(to) && from <= to && to <= LAST_DATE;
  return {
    regionId,
    nodeId: params.get("node") || null,
    window: windowParam === "7d" ? "7d" : custom ? "custom" : "week",
    from: custom ? from : null,
    to: custom ? to : null,
    mode: mode === "planned" || mode === "completed" ? mode : base.mode,
    view: view && VIEW_ID.test(view) ? view : base.view,
    layer: LAYERS.includes(layer as DiagramLayerId) ? (layer as DiagramLayerId) : base.layer,
    map: map === "target" ? "target" : "volume",
    figure: figure === "model" || figure === "drawing" ? figure : null,
    planWeek: Number.isInteger(planWeek) && planWeek > 0 ? planWeek : null,
    ...(params.get("open") === "stack" ? { open: "stack" as const } : {}),
  };
}

/**
 * Another region, picked on the page (10-multi-region.md §6.1): its muscle (none, unless one is
 * named) and its first view and surface layer, since those were the old region's; the mode, the
 * window and its dates, the plan week, what the map shows and the figure carry over. A section the
 * old region was asked to open does not: it was asked of that region.
 */
export function withRegion(state: SpecializationViewState, regionId: RegionId, nodeId: string | null = null): SpecializationViewState {
  const { open: _open, ...rest } = state;
  return { ...rest, regionId, nodeId, view: null, layer: "surface" };
}

/** Writes the page state into URL params, leaving every other param untouched. */
export function writeSpecializationParams(params: URLSearchParams, state: SpecializationViewState): void {
  clearSpecializationParams(params);
  const base = defaultSpecializationState(state.regionId);
  params.set("region", state.regionId);
  if (state.nodeId) params.set("node", state.nodeId);
  if (state.window !== "week") params.set("window", state.window);
  if (state.window === "custom" && state.from && state.to) { params.set("from", state.from); params.set("to", state.to); }
  if (state.mode !== base.mode) params.set("mode", state.mode);
  if (state.view) params.set("view", state.view);
  if (state.layer !== base.layer) params.set("layer", state.layer);
  if (state.map !== base.map) params.set("map", state.map);
  if (state.figure) params.set("fig", state.figure);
  if (state.planWeek !== null) params.set("pweek", String(state.planWeek));
  if (state.open) params.set("open", state.open);
}

/**
 * The region this account last opened on this device, so the page opens on it again
 * (10-multi-region.md §6.1). Device storage can be missing, full or refused (a private window),
 * so every read and write is guarded: without it the page opens on the default region.
 */
export const specializationRegionKeyBase = "sports-genome-specialization-region-v1";

export function readRememberedRegion(accountId: string | number | null | undefined, knownRegions: ReadonlySet<RegionId>): RegionId | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(scopedKey(specializationRegionKeyBase, accountId));
    return stored && knownRegions.has(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function rememberRegion(accountId: string | number | null | undefined, regionId: RegionId): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(scopedKey(specializationRegionKeyBase, accountId), regionId);
  } catch {
    // Not remembered: the next visit opens on the default region, which is all that is lost.
  }
}

/** Removes the page's params, for every workspace that is not the specialization page. */
export function clearSpecializationParams(params: URLSearchParams): void {
  for (const name of specializationParamNames) params.delete(name);
}

/**
 * A change to the plan asked for from the page: add an exercise to an exact slot of an exact
 * day, or swap one already there (brief §7, "Choose exact week/day and exercise slot before
 * save"). Home owns the plan, so it applies this (lib/specialization/planChange) and answers.
 */
export type SpecializationPlanChange = {
  week: number;
  slotIndex: number;
  dayKey: string;
  catalogExerciseId: number;
  /** The plan entry to replace; absent for an add. A swap takes that entry's place in the day. */
  replaceEntryId?: number;
  /**
   * Where an add goes in the day: 0 = first, 2 = after the second exercise; absent = at the
   * end. Clamped to the day. A swap ignores it: the incoming exercise takes the replaced one's place.
   */
  insertAt?: number;
  /**
   * An explicit prescription for an added exercise. Absent (as the page sends it), the entry has
   * none of its own and reads as the goal's default for its position, as every plan reader does.
   * A swap ignores it and carries over the replaced entry's own prescription, if it had one.
   */
  prescription?: string;
};

export type SpecializationPlanChangeResult = { ok: true; undo: () => void } | { ok: false; reason: string };

/**
 * An entry already in the plan that a batch change acts on: the day it is in, the entry's own id
 * in that day (`Exercise.id` there, as `replaceEntryId`; a duplicated entry has one of its own),
 * and the catalog exercise it is. A change whose entry is gone, or is another exercise by now,
 * refuses the batch.
 */
export type SpecializationPlannedEntry = {
  dayKey: string;
  entryId: number;
  catalogExerciseId: number;
};

/**
 * One change in a batch (the stack design note, §3.7). Every change is on the batch's
 * week and names its day by its key (`DaySlot.key`); each carries its `prescription`:
 * - `add`: an add, or a swap when `replaceEntryId` is set, exactly as a single change from the page
 *   (`SpecializationPlanChange`): `prescription` is written as the incoming entry's own; absent, it
 *   has none and reads as the goal's default for its position. Never into a day that already holds
 *   the exercise.
 * - `remove`: takes an entry out, only while it is still as written: the same exercise with the same
 *   prescription of its own (`prescription`; absent when it had none). For the stack's Change the
 *   total and Take it out, and the tendon section's Take out.
 * - `sets`: the entry's set count, `sets` (1 to 12). `prescription` is the entry's prescription as the
 *   page reads it (its own, or the default it reads as); the count is written into the entry's own
 *   prescription when it has one, else into this one, and the result becomes its own. For the
 *   tendon section's −1 set.
 * - `move`: the entry to another day of the week (`toDayKey`, at `insertAt` as an add places it, the
 *   end when absent), as a remove and an add in one: with its settings, and its own prescription, or
 *   `prescription` when it has none of its own, so its sets do not change with its position. Never
 *   into a day that already holds the exercise.
 */
export type SpecializationPlanBatchChange =
  | ({ kind: "add" } & Omit<SpecializationPlanChange, "week" | "slotIndex">)
  | ({ kind: "remove"; prescription?: string } & SpecializationPlannedEntry)
  | ({ kind: "sets"; sets: number; prescription: string } & SpecializationPlannedEntry)
  | ({ kind: "move"; toDayKey: string; insertAt?: number; prescription?: string } & SpecializationPlannedEntry);

/**
 * Several changes to one plan week, applied together or not at all (lib/specialization/planBatch
 * `applyPlanBatch`): the stack's Add, Change the total and Take it out, and the tendon section's
 * planned-entry actions. Home applies it and offers one Undo for all of it.
 */
export type SpecializationPlanBatch = { week: number; changes: SpecializationPlanBatchChange[] };

/**
 * Home's answer to a batch. Applied: `undo` takes every change back (newest first, on the days as
 * they stand when it is pressed; a second press does nothing), and `message` is the toast's own
 * words ("Added 11 sets: 11 exercises on Day 01, Day 02, Day 03 of Week 1"), for the page to say the
 * same. Refused: nothing was written, and `reason` says why.
 */
export type SpecializationPlanBatchResult = { ok: true; undo: () => void; message: string } | { ok: false; reason: string };

/**
 * About me's answer to its area question ("How is your … feeling?") for the page's region:
 * the answer's identifier and its words as About me shows them ("Bothering me now"). The page says
 * it once and changes nothing because of it (the stack design note, §3.2 item 10).
 */
export type SpecializationAreaReport = { constraintType: ConstraintType; answer: string };

/**
 * What Home hands the page for the stack (lane S3 → S4): the batch apply and About me's answer for
 * the page's region. The page's props take these beside `SpecializationPanelProps`.
 */
export type SpecializationStackProps = {
  /**
   * Applies a batch (Home fetches the batch code, planBatch.ts, when one arrives, so the closed page
   * never downloads it). `onUndo` runs once the batch is taken back, from the page's Undo or the
   * notice's, so the page can forget a stack it recorded.
   */
  onApplyPlanChanges: (batch: SpecializationPlanBatch, options?: { onUndo?: () => void }) => Promise<SpecializationPlanBatchResult>;
  /** Null when About me has no answer for this region's area, or says "Feels fine". */
  aboutMeArea: SpecializationAreaReport | null;
};

/**
 * About me's answer for a region, when its area is the region's: one of the region's body-map keys
 * names that area in About me's catalog (`capacityTargetForMuscle`), and the answer is anything but
 * "Feels fine". About me holds one area at a time, and no side is read (both sides are one, owner,
 * 20 Oct 2026).
 */
export function areaReportForRegion(
  constraint: { targetKey: string; constraintType: ConstraintType } | null | undefined,
  bodyMapKeys: readonly string[],
): SpecializationAreaReport | null {
  if (!constraint || constraint.constraintType === "proactive_none") return null;
  if (!bodyMapKeys.some((key) => capacityTargetForMuscle[key]?.targetKey === constraint.targetKey)) return null;
  const answer = constraintChoices.find((choice) => choice.value === constraint.constraintType)?.label;
  return answer ? { constraintType: constraint.constraintType, answer } : null;
}

/**
 * A plan week of a region that holds the athlete's stack: what Plan reads of the stack record
 * (`stackStore.ts`, `stacksOnDevice`) to say a newly generated week does not have it.
 */
export type StackOnDevice = { regionId: RegionId; planWeek: number };

/** The region as a word before "stack" or "sets": its heading's first words ("Hip specialization" → "hip"), else its label. */
export function regionStackWord(region: Pick<SpecializationRegion, "heading" | "label">): string {
  const named = /^(.+?)\s+specialization$/i.exec(region.heading ?? "")?.[1] ?? region.label;
  return named.charAt(0).toLowerCase() + named.slice(1);
}

export type StackNote = { regionId: RegionId; fromWeek: number; sentence: string };

/**
 * Plan says so too (the stack design note, §3.2): Plan builds each week fresh and never
 * copies a stack, so when a new week is generated and an earlier week holds a region's stack, the
 * notice says the new week does not have it: "Your {region} stack from Week 1 is not in it; design
 * one on Specialize." One note per region with a page, naming its latest earlier week.
 */
export function stackNotesForNewWeek(stacks: readonly StackOnDevice[], newWeek: number): StackNote[] {
  const latest = new Map<RegionId, number>();
  for (const stack of stacks) {
    if (stack.planWeek >= newWeek) continue;
    latest.set(stack.regionId, Math.max(latest.get(stack.regionId) ?? 0, stack.planWeek));
  }
  return Array.from(latest, ([regionId, fromWeek]) => ({ regionId, fromWeek, region: regionIndexEntry(regionId) }))
    .filter((note): note is { regionId: RegionId; fromWeek: number; region: SpecializationRegion } => note.region !== null && note.region.status === "production")
    .sort((left, right) => left.region.sortOrder - right.region.sortOrder)
    .map(({ regionId, fromWeek, region }) => ({ regionId, fromWeek, sentence: `Your ${regionStackWord(region)} stack from Week ${fromWeek} is not in it; design one on Specialize.` }));
}
