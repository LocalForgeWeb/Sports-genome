import type { ArmSide, DiagramLayerId, DiagramViewId, RegionId, SummaryMode } from "@shared/specialization/types";

/**
 * What the specialization page is showing, kept in the URL so Back, a reload and a
 * return from an add/swap land on the same muscle, arm, window and view (brief §6,
 * "Persist region, selected muscle, side, time window, planned/completed mode, and
 * view in navigation state/URL").
 *
 * Parameter names avoid the ones other workspaces own (`muscle`, `sport`, `movement`,
 * `discover`, `scope`, `session`): Home strips these on every other workspace.
 */
export type SpecializationWindow = "week" | "7d" | "custom";
export type SpecializationMapMode = "volume" | "target";

export type SpecializationViewState = {
  regionId: RegionId;
  nodeId: string | null;
  limb: ArmSide;
  window: SpecializationWindow;
  /** Custom window, local dates YYYY-MM-DD (inclusive). */
  from: string | null;
  to: string | null;
  mode: SummaryMode;
  view: DiagramViewId;
  layer: DiagramLayerId;
  map: SpecializationMapMode;
  /** The plan week planned exposure reads; null = the week Home trains from. */
  planWeek: number | null;
};

export const specializationParamNames = ["region", "node", "limb", "window", "from", "to", "mode", "view", "layer", "map", "pweek"] as const;

const VIEWS: readonly DiagramViewId[] = ["palm", "back", "thumb"];
const LAYERS: readonly DiagramLayerId[] = ["surface", "intermediate", "deep"];
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function defaultSpecializationState(regionId: RegionId): SpecializationViewState {
  return { regionId, nodeId: null, limb: "right", window: "week", from: null, to: null, mode: "completed", view: "palm", layer: "surface", map: "volume", planWeek: null };
}

/** Reads the page state from a URL, falling back field by field to the defaults. */
export function specializationStateFromParams(params: URLSearchParams, defaultRegionId: RegionId, knownRegions: ReadonlySet<RegionId>): SpecializationViewState {
  const regionParam = params.get("region");
  const regionId = regionParam && knownRegions.has(regionParam) ? regionParam : defaultRegionId;
  const base = defaultSpecializationState(regionId);
  const limb = params.get("limb");
  const windowParam = params.get("window");
  const mode = params.get("mode");
  const view = params.get("view");
  const layer = params.get("layer");
  const map = params.get("map");
  const from = params.get("from");
  const to = params.get("to");
  const planWeek = Number.parseInt(params.get("pweek") ?? "", 10);
  const custom = windowParam === "custom" && from && to && DATE_KEY.test(from) && DATE_KEY.test(to) && from <= to;
  return {
    regionId,
    nodeId: params.get("node") || null,
    limb: limb === "left" || limb === "right" ? limb : base.limb,
    window: windowParam === "7d" ? "7d" : custom ? "custom" : "week",
    from: custom ? from : null,
    to: custom ? to : null,
    mode: mode === "planned" || mode === "completed" ? mode : base.mode,
    view: VIEWS.includes(view as DiagramViewId) ? (view as DiagramViewId) : base.view,
    layer: LAYERS.includes(layer as DiagramLayerId) ? (layer as DiagramLayerId) : base.layer,
    map: map === "target" ? "target" : "volume",
    planWeek: Number.isInteger(planWeek) && planWeek > 0 ? planWeek : null,
  };
}

/** Writes the page state into URL params, leaving every other param untouched. */
export function writeSpecializationParams(params: URLSearchParams, state: SpecializationViewState): void {
  clearSpecializationParams(params);
  const base = defaultSpecializationState(state.regionId);
  params.set("region", state.regionId);
  if (state.nodeId) params.set("node", state.nodeId);
  if (state.limb !== base.limb) params.set("limb", state.limb);
  if (state.window !== "week") params.set("window", state.window);
  if (state.window === "custom" && state.from && state.to) { params.set("from", state.from); params.set("to", state.to); }
  if (state.mode !== base.mode) params.set("mode", state.mode);
  if (state.view !== base.view) params.set("view", state.view);
  if (state.layer !== base.layer) params.set("layer", state.layer);
  if (state.map !== base.map) params.set("map", state.map);
  if (state.planWeek !== null) params.set("pweek", String(state.planWeek));
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
