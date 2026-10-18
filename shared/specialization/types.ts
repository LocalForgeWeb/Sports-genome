/**
 * The specialization atlas's reference model (brief of 16 Oct 2026, §3, §5, §8).
 *
 * Region-agnostic on purpose: a forearm, a deltoid or a calf is data that fills these
 * types, never a branch in the code that reads them (brief §1, "Deltoid specialization
 * can be added without a new schema or calculator"). The shapes mirror the tables in
 * schema `specialization` (docs/specialization-atlas/02-design.md §9), so the seed SQL
 * can be generated from the TypeScript content rather than written twice.
 */

// ---------------------------------------------------------------- reference content

export type RegionId = string;
export type NodeId = string;
export type ActionId = string;
export type SourceId = string;
export type VariantId = string;

export type ReviewStatus = "draft" | "reviewed" | "rejected";
export type NodeKind = "group" | "muscle" | "head" | "compartment";
export type AnatomicalLayer = "surface" | "intermediate" | "deep" | "mixed";
export type SurfaceVisibility = "clear" | "partial" | "not_distinct" | "variable";

/**
 * Why a node is in a region. `target` nodes are what a specialization block trains;
 * `adjacent` ones sit beside them (the anconeus at the elbow) and are explained but
 * never targeted; `external` ones belong to another region and appear only as
 * "also loaded" contributors (biceps and brachialis on a curl).
 */
export type NodeRole = "target" | "adjacent" | "external" | "group";

/** Thumb side or pinky side, in anatomical terms; never screen-left or screen-right. */
export type ForearmBorder = "radial" | "ulnar" | "central" | "both";

export interface SpecializationRegion {
  id: RegionId;
  label: string;
  /** The page heading, e.g. "Forearm specialization". */
  heading: string;
  sortOrder: number;
  /** `fixture` regions exist only in tests; production never registers one. */
  status: "production" | "fixture";
  /** Body-map and catalog keys this region refines; selecting one on the map offers the page. */
  bodyMapKeys: string[];
  /** The link from other screens: "Explore forearm coverage". */
  entryLabel: string;
  /**
   * A body-map key that names exactly one of the region's muscles opens the page with that
   * muscle selected ("brachioradialis" → BR); a broader key ("forearms") opens the region.
   */
  nodeForBodyMapKey?: Record<string, NodeId>;
  /** What the page says about this region in its own words, so no component names one (design §10). */
  wording: RegionWording;
  /**
   * What Progress offers to record for this region, in this order (the forearm: circumference,
   * then grip on a dynamometer). A measure the region does not list is never offered.
   */
  measurementMetrics: MeasurementMetric[];
}

/** The page's region-specific words. Plain text; the page adds no region words of its own. */
export interface RegionWording {
  /** The list's heading over the muscles of another region credited here: "Upper-arm muscles credited here". */
  externalGroup: string;
  /**
   * The kind of incidental work, said on the muscle bars and in their key: "grip" gives
   * "Incidental grip" in the key and "3 grip" on a bar.
   */
  incidentalWork: string;
  /** The line under "Progress": "Circumference and grip, by arm". */
  progressSubtitle: string;
}

export interface AnatomyNode {
  id: NodeId;
  regionId: RegionId;
  parentId: NodeId | null;
  kind: NodeKind;
  role: NodeRole;
  name: string;
  /** Abbreviation shown in tight places (FCU, ECRL). */
  shortName: string;
  aliases: string[];
  layer: AnatomicalLayer;
  surfaceVisibility: SurfaceVisibility;
  status: ReviewStatus;
  /** The existing catalog / body-map key this node refines ("forearms", "biceps"). */
  catalogMuscleKey: string | null;
  /** The `public.muscles.canonical_name` this node refines, where one exists. */
  databaseMuscle: string | null;
  border: ForearmBorder | null;
  /** One short location line: "Palm side, pinky-side edge". */
  location: string;
  /** Plain-language "What it does". */
  whatItDoes: string;
  /** Qualified "How it contributes to shape". */
  shapeNote: string;
  /** Appearance or anatomy caveats worth saying (variable presence, deep, tendon vs belly). */
  caveats: string[];
}

export interface JointAction {
  id: ActionId;
  joint: string;
  label: string;
  plainDescription: string;
}

export interface NodeAction {
  nodeId: NodeId;
  actionId: ActionId;
  /** `prime`: a main action of the muscle; `assist`: it helps. */
  role: "prime" | "assist";
  /** The function claim this rests on. Must belong to the same node. */
  claimId: string;
}

export type ClaimKind = "function" | "appearance" | "selectivity" | "variation";
export type ClaimBasis = "established_anatomy" | "experimental" | "anatomical_inference" | "product_assumption" | "unknown";

export interface ClaimSourceRef {
  sourceId: SourceId;
  /** Where in the source: a section, table row, figure or page. */
  locator: string | null;
  /** What the source does not support, or the population/task it was measured in. */
  qualification: string | null;
}

export interface Claim {
  id: string;
  nodeId: NodeId;
  kind: ClaimKind;
  statement: string;
  basis: ClaimBasis;
  reviewStatus: ReviewStatus;
  /** ISO date of review; null while draft. */
  reviewedAt: string | null;
  /** Who or what reviewed it and how, said plainly. */
  reviewNote: string | null;
  sources: ClaimSourceRef[];
}

export type EvidenceType = "anatomy" | "biomechanics" | "emg" | "longitudinal" | "systematic_review" | "product_assumption";

export interface Source {
  id: SourceId;
  url: string;
  title: string;
  doi: string | null;
  evidenceType: EvidenceType;
  /** ISO date the source was retrieved or checked. */
  retrievedOn: string;
  notes: string | null;
}

// ---------------------------------------------------------------- variants and mappings

export type Organization = "single_joint" | "multi_joint" | "task" | "mixed";
export type ForearmOrientation = "supinated" | "neutral" | "pronated" | "changing" | "unknown";
export type WristPosition = "flexed" | "neutral" | "extended" | "changing" | "unknown";
export type GripType =
  | "overhand" | "underhand" | "neutral" | "mixed" | "hook" | "pinch" | "crush" | "open_hand"
  | "fingers_only" | "thumb" | "none" | "unknown";
export type StrapsUse = "yes" | "no" | "unknown" | "not_applicable";
/** `bilateral`: both arms work in every set by the definition of the exercise (a barbell). */
export type Laterality = "bilateral" | "unilateral" | "either";
export type Phase = "concentric_eccentric" | "eccentric_only" | "concentric_only" | "unspecified";
export type SetMeasure = "reps" | "seconds";

/**
 * One way of doing a catalog exercise, with its execution spelled out. The catalog has
 * no variant model, so each mapped catalog id has one default variant (`cat-<id>`); a
 * logged set may still override what varies between sets (side, straps).
 */
export interface ExerciseVariant {
  id: VariantId;
  catalogExerciseId: number;
  /** The catalog name at the time of mapping, checked by test against the catalog. */
  catalogName: string;
  organization: Organization;
  forearmOrientation: ForearmOrientation;
  wristPosition: WristPosition;
  gripType: GripType;
  straps: StrapsUse;
  laterality: Laterality;
  phase: Phase;
  measure: SetMeasure;
  /** True when the task is an intentional hold (a hang, a carry, a pinch). */
  deliberateHold: boolean;
  /** Degrees, only when the exercise defines it. Never a fabricated default. */
  elbowAngleDeg: number | null;
  notes: string | null;
}

export type Relationship = "direct" | "contributing" | "stabilizer" | "incidental" | "unknown";
export type MuscleMode = "dynamic" | "isometric" | "mixed" | "unknown";
export type MappingEvidenceBasis = "anatomy" | "biomechanics" | "emg" | "longitudinal" | "inference" | "unknown";

export interface MappingSourceRef {
  sourceId: SourceId;
  locator: string | null;
  /** What the source cannot show for this exact claim. */
  limitation: string | null;
}

export interface VariantMapping {
  id: string;
  versionKey: string;
  variantId: VariantId;
  nodeId: NodeId;
  actionId: ActionId | null;
  relationship: Relationship;
  muscleMode: MuscleMode;
  evidenceBasis: MappingEvidenceBasis;
  /** `shared`: the work is real but cannot be split between the listed nodes (FDS vs FDP). */
  allocation: "individual" | "shared";
  /** A grip mapping that a strapped set does not earn. */
  requiresNoStraps: boolean;
  rationale: string;
  reviewStatus: ReviewStatus;
  sources: MappingSourceRef[];
}

export interface MappingVersion {
  key: string;
  state: "draft" | "published" | "retired";
  publishedAt: string | null;
  methodNotes: string;
}

// ---------------------------------------------------------------- accounting rule

export type ExposureCategory =
  | "direct_dynamic"
  | "contributing_dynamic"
  | "deliberate_isometric"
  | "incidental_isometric"
  | "mixed"
  | "unknown";

export interface ExposureRuleSpec {
  bout: string;
  dropSet: string;
  excludedFromCompleted: string[];
  categories: Record<ExposureCategory, string>;
  perNodeBout: string;
  sides: string;
  straps: string;
  holds: string;
  unmapped: string;
  regionTotal: string;
  notConverted: string[];
}

export interface RuleVersion {
  id: string;
  publishedAt: string | null;
  notes: string;
  specification: ExposureRuleSpec;
}

// ---------------------------------------------------------------- diagram

/**
 * A view's id is the drawing's own: lowercase letters, digits and underscores, starting with a
 * letter (`^[a-z][a-z0-9_]*$`, the shape the database checks). The forearm is drawn from the
 * palm, the back and the thumb side; another region may be drawn from the front, side and rear.
 */
export type DiagramViewId = string;

export interface DiagramView {
  id: DiagramViewId;
  /** The words on its button and in captions: "Palm", "Thumb side", "Rear". */
  label: string;
}
/**
 * `intermediate` exists where anatomy really has a middle layer (the palm side: FDS lies
 * between the superficial flexors and FDP/FPL/PQ). Views without one offer surface and deep.
 */
export type DiagramLayerId = "surface" | "intermediate" | "deep";
export type DiagramPathKind = "belly" | "tendon" | "outline" | "bone" | "ghost" | "skin";

export interface DiagramPath {
  /** Stable path id: `<view>__<layer>__<nodeShort>__<n>` for selectable paths. */
  id: string;
  /**
   * The node a belly or tendon belongs to; null for structure. Only `belly` paths are
   * selectable and painted with exposure; a tendon keeps its node so the selection
   * outline can include it, but it is never coloured as muscle bulk (brief §6).
   */
  nodeId: NodeId | null;
  kind: DiagramPathKind;
  d: string;
}

export interface DiagramLabel {
  /** "Thumb side" / "Pinky side" / "Elbow" / "Wrist". */
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export interface DiagramLayer {
  paths: DiagramPath[];
  labels: DiagramLabel[];
}

/**
 * Drawn for the subject's RIGHT arm. The left arm is the mirror image, and the page
 * flips the drawing — never the anatomy labels, which are re-placed by the mirror.
 */
export interface DiagramAsset {
  key: string;
  version: number;
  regionId: RegionId;
  viewBox: { width: number; height: number };
  /**
   * The drawing's views in the order the page offers them, each with the words on its button
   * (the forearm: Palm · Back · Thumb side). It lists every key of `views`, once each, and
   * nothing else; the first is the view the page opens on.
   */
  viewOrder: DiagramView[];
  views: Partial<Record<DiagramViewId, Partial<Record<DiagramLayerId, DiagramLayer>>>>;
  licenseNote: string;
}

// ---------------------------------------------------------------- one region's data

export interface SpecializationRegionData {
  region: SpecializationRegion;
  nodes: AnatomyNode[];
  actions: JointAction[];
  nodeActions: NodeAction[];
  claims: Claim[];
  sources: Source[];
  variants: ExerciseVariant[];
  mappings: VariantMapping[];
  mappingVersion: MappingVersion;
  diagram: DiagramAsset | null;
}

// ---------------------------------------------------------------- calculator input

export type BoutSide = "left" | "right" | "bilateral" | "unknown";
/** Where a bout's side came from, so the ledger can say it. */
export type SideSource = "recorded" | "structural" | "plan_assumption" | "unknown";
export type SummaryMode = "planned" | "completed";

export interface ExposureSegment {
  id: string;
  reps: number | null;
  /** External load in kilograms as logged (per the exercise's load convention). */
  loadKg: number | null;
  holdSeconds: number | null;
}

export interface ExposureBout {
  id: string;
  mode: SummaryMode;
  /** ISO time the work happened (completed) — null for planned work. */
  performedAt: string | null;
  sessionId: string | null;
  /** "Week 2 · Day 03 · Pull" or the session title. */
  sessionLabel: string;
  planWeek: number | null;
  dayKey: string | null;
  /** The plan entry or session exercise this bout belongs to. */
  exerciseEntryId: string;
  catalogExerciseId: number | null;
  exerciseName: string;
  matchedBy: "id" | "name" | "none";
  side: BoutSide;
  sideSource: SideSource;
  straps: "yes" | "no" | "unknown";
  warmup: boolean;
  effort: "failure" | "not_to_failure" | null;
  kind: "standard" | "drop";
  segments: ExposureSegment[];
  /**
   * Set only on a record passed along to be counted as excluded and never credited: a
   * skipped set, or a set logged in a workout that is not finished. It lets the summary's
   * completeness say what was left out (design §3) without the calculator reading storage.
   */
  excluded?: "not_completed";
}

export type GoalMetric = "direct_dynamic_bouts" | "deliberate_hold_bouts" | "deliberate_hold_seconds";
export type GoalPeriod = "calendar_week" | "rolling_7d";
export type ArmSide = "left" | "right";

export interface SpecializationGoal {
  id: string;
  regionId: RegionId;
  /** Exactly one of nodeId and actionId is set. */
  nodeId: NodeId | null;
  actionId: ActionId | null;
  side: ArmSide;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  /** Local dates, YYYY-MM-DD. */
  startsOn: string;
  endsOn: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export type MeasurementMetric = "circumference_cm" | "grip_force_n";

export interface MeasurementProtocol {
  /** "Thickest point of the forearm" or "Distance below the elbow crease". */
  landmark: string;
  distanceFromLandmarkCm: number | null;
  posture: "arm_relaxed_hanging" | "arm_extended_supported" | "elbow_90_supported" | "other";
  condition: "unpumped" | "pumped" | "unknown";
  /** Dynamometer or tape used. */
  device: string | null;
  /** HH:MM local time, for repeatability. */
  timeOfDay: string | null;
}

export interface SpecializationMeasurement {
  id: string;
  regionId: RegionId;
  side: ArmSide;
  measuredAt: string;
  metric: MeasurementMetric;
  value: number;
  protocol: MeasurementProtocol;
  notes: string | null;
}

// ---------------------------------------------------------------- calculator output

export type IntervalKind = "calendar_week" | "rolling_7d" | "custom" | "plan_week";

export interface SummaryInterval {
  kind: IntervalKind;
  startAt: string | null;
  endAtExclusive: string | null;
  timezone: string;
  planWeek: number | null;
  label: string;
}

export interface ContributionSegment {
  id: string;
  reps: number | null;
  loadKg: number | null;
  holdSeconds: number | null;
}

/** One bout's contribution to one node: the ledger row behind every number. */
export interface Contribution {
  boutId: string;
  nodeId: NodeId;
  category: ExposureCategory;
  /** The mappings that produced it (more than one only when the category is `mixed`). */
  parts: { mappingId: string; actionId: ActionId | null; relationship: Relationship; muscleMode: MuscleMode; category: ExposureCategory }[];
  side: BoutSide;
  sideSource: SideSource;
  catalogExerciseId: number | null;
  exerciseName: string;
  matchedBy: "id" | "name" | "none";
  sessionId: string | null;
  sessionLabel: string;
  performedAt: string | null;
  kind: "standard" | "drop";
  segments: ContributionSegment[];
  reps: number;
  holdSeconds: number;
  /** "Strapped: grip not counted", "Straps not recorded", "Each side assumed" ... */
  notes: string[];
  /** Mapping allocation is shared with these nodes (FDS with FDP). */
  sharedWith: NodeId[];
}

export type MappingCoverage = "reviewed" | "pending_review" | "none";

export interface NodeExposure {
  nodeId: NodeId;
  directDynamicBouts: number;
  contributingDynamicBouts: number;
  deliberateHoldBouts: number;
  deliberateHoldSeconds: number;
  incidentalBouts: number;
  mixedBouts: number;
  unknownBouts: number;
  directDynamicReps: number;
  contributingDynamicReps: number;
  /** Bouts mapped to this node whose side is unknown — never added to either arm. */
  unknownSide: {
    bouts: number;
    directDynamicBouts: number;
    deliberateHoldBouts: number;
    deliberateHoldSeconds: number;
    /**
     * Bouts with no arm recorded that matched only a draft mapping for this node: shown as
     * "no arm recorded", never counted, and never in either arm's `pendingReviewBouts`. Always
     * set by `getSpecializationSummary`; not part of `bouts`, which counts credited work.
     */
    pendingReviewBouts?: number;
  };
  /** Bouts on this arm (or two-handed) that matched only a draft mapping for this node: shown, not counted. Bouts with no arm recorded are in `unknownSide.pendingReviewBouts` instead. */
  pendingReviewBouts: number;
  /** Whether any reviewed mapping can credit this node at all. */
  mappingCoverage: MappingCoverage;
  contributions: Contribution[];
  /**
   * Bouts a mapping matched but that earned this node nothing: grip credit withheld from a
   * strapped set ("Strapped: grip not counted"), or a mapping still pending review. Listed
   * so the ledger can say so; never part of any total above.
   */
  notCounted?: Contribution[];
}

export interface GoalProgress {
  goal: SpecializationGoal;
  /** The value for the goal's metric, target and side over the goal's own period. */
  value: number;
  /** value / target, unbounded above (above-target stays visible). */
  fraction: number;
  /** "8 of your 20" */
  label: string;
}

export interface SummaryCompleteness {
  boutsConsidered: number;
  boutsWithReviewedMapping: number;
  boutsPendingReview: number;
  /** Bouts tagged with the region's catalog key that the atlas has no mapping for. */
  boutsRegionOnly: number;
  boutsNameMatched: number;
  boutsUnknownSide: number;
  boutsExcluded: { notCompleted: number; warmup: number };
}

/**
 * One bout behind a region-level total: the set record a region count is made of (brief §1,
 * "Every total opens the contributing exercises and actual set records"; §9 source bout ids).
 * No node and no category: a region total is distinct bouts, not credit to any one muscle.
 */
export interface RegionBoutRow {
  boutId: string;
  side: BoutSide;
  sideSource: SideSource;
  catalogExerciseId: number | null;
  exerciseName: string;
  matchedBy: "id" | "name" | "none";
  sessionId: string | null;
  sessionLabel: string;
  performedAt: string | null;
  kind: "standard" | "drop";
  segments: ContributionSegment[];
}

export interface SpecializationSummary {
  regionId: RegionId;
  interval: SummaryInterval;
  side: ArmSide;
  mode: SummaryMode;
  mappingVersion: string;
  ruleVersion: string;
  sourceRevision: string;
  planRevision: string | null;
  nodes: NodeExposure[];
  /** Distinct bouts touching any node of the region on this arm. Not a sum of nodes. */
  regionDistinctBouts: number;
  regionUnknownSideBouts: number;
  /** Region-level work the atlas cannot attribute to a node (generic "forearms" tags). */
  regionUnclassified: { bouts: number; exercises: { name: string; catalogExerciseId: number | null; bouts: number }[] };
  /** The bouts behind `regionDistinctBouts`, one row each, oldest first. */
  regionBoutRows?: RegionBoutRow[];
  /** The bouts behind `regionUnknownSideBouts`, one row each, oldest first. */
  regionUnknownSideRows?: RegionBoutRow[];
  /** The bouts behind `regionUnclassified`, one row each (each names its exercise), oldest first. */
  regionUnclassifiedRows?: RegionBoutRow[];
  goals: GoalProgress[];
  completeness: SummaryCompleteness;
  calculatedAt: string;
}

// ---------------------------------------------------------------- calculator request

/**
 * What `getSpecializationSummary` needs. Bouts are the plain records the device
 * adapters build from the plan and the workout log; the calculator filters completed
 * bouts to the interval itself, so one bout list serves every window and goal period.
 */
export interface SummaryRequest {
  region: SpecializationRegionData;
  bouts: readonly ExposureBout[];
  interval: SummaryInterval;
  side: ArmSide;
  mode: SummaryMode;
  goals: readonly SpecializationGoal[];
  /**
   * The catalog's muscle tags for an exercise, so work tagged with the region's catalog
   * key ("forearms") but not mapped by the atlas lands in the region-level bucket.
   */
  catalogMusclesFor: (catalogExerciseId: number | null, exerciseName: string) => { primary: readonly string[]; secondary: readonly string[] } | null;
  sourceRevision: string;
  planRevision: string | null;
  /** ISO time used for rolling windows and goal periods. */
  now: string;
}
