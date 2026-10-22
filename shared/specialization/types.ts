/**
 * The specialization atlas's reference model (brief of 16 Oct 2026, §3, §5, §8).
 *
 * Region-agnostic on purpose: a forearm, a deltoid or a calf is data that fills these
 * types, never a branch in the code that reads them (brief §1, "Deltoid specialization
 * can be added without a new schema or calculator"). The shapes mirror the tables in
 * schema `specialization` (docs/specialization-atlas/02-design.md §9), so the seed SQL
 * can be generated from the TypeScript content rather than written twice.
 */
import type { VariantDimensions } from "./variants/dimensions";

export type { VariantDimensions };

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
 *
 * A node has one home region and a role there, which is never `external`; every other region
 * that lists it lists it as `external` (docs/specialization-atlas/10-multi-region.md §1.3).
 * The role is a property of the listing: `memberRole` in compose.ts derives it.
 */
export type NodeRole = "target" | "adjacent" | "external" | "group";

/** Thumb side or pinky side, in anatomical terms; never screen-left or screen-right. */
export type ForearmBorder = "radial" | "ulnar" | "central" | "both";

/**
 * `production` regions have a page; `reference` regions are registered only as the home of
 * another region's external members until a wave promotes them (the upper arm through wave 0,
 * 10-multi-region.md §1.3); `fixture` regions exist only in tests and are never registered.
 */
export type RegionStatus = "production" | "reference" | "fixture";

/** The limb whose side the logger records for a paired region. */
export type Limb = "arm" | "leg";

/**
 * How a region counts sides (10-multi-region.md §2.1): `paired` regions count each side of the
 * named limb (the forearm, upper arm, shoulders, chest and back by the arm; the hips, thigh and
 * lower leg by the leg); a `midline` region (the core) counts every bout once, with no side.
 */
export type RegionSides = { model: "paired"; limb: Limb } | { model: "midline" };

/**
 * Which catalog tags put an unmapped exercise in the region-only bucket: `any` reads primary and
 * secondary tags (the forearm, as shipped); `primary` reads primary tags only (every new region,
 * 10-multi-region.md §1.1).
 */
export type RegionOnlyTagScope = "any" | "primary";

/** Where and how a measure is first taken on this region's page (10-multi-region.md §4.4). */
export interface MeasurementDefault {
  /** "Thickest point", "Widest point of the calf". */
  landmark: string;
  posture: MeasurementPosture;
}

export interface SpecializationRegion {
  id: RegionId;
  label: string;
  /** The page heading, e.g. "Forearm specialization". */
  heading: string;
  /** Body order; gaps are left for regions added later (the forearm is 10, 10-multi-region.md §1.1). */
  sortOrder: number;
  status: RegionStatus;
  sides: RegionSides;
  /** Body-map and Review keys that open this region's page; selecting one on the map offers the page. */
  bodyMapKeys: string[];
  /**
   * Catalog muscle keys whose tagged work is this region's work (the region-only bucket, rule
   * `unmapped`), written out rather than read from the target nodes (10-multi-region.md §1.1).
   * The forearm's is `["forearms"]`, which is what its target nodes' keys gave before.
   */
  catalogKeys: string[];
  regionOnlyTagScope: RegionOnlyTagScope;
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
  /** The landmark and posture a first reading of each listed measure starts from. */
  measurementDefaults: Partial<Record<MeasurementMetric, MeasurementDefault>>;
}

/**
 * The page's region-specific words. Plain text the database can store; the page adds no region
 * words of its own.
 */
export interface RegionWording {
  /**
   * The list's heading over the muscles of another region credited here: "Upper-arm muscles
   * credited here". Kept as the fallback; pages group external rows by home region under each
   * home's `externalHeading`.
   */
  externalGroup: string;
  /** The heading another region's page puts over this region's muscles: "Forearm muscles credited here". */
  externalHeading: string;
  /**
   * The kind of incidental work, said on the muscle bars and in their key: "grip" gives
   * "Incidental grip" in the key and "3 grip" on a bar.
   */
  incidentalWork: string;
  /** The line under "Progress": "Circumference and grip". */
  progressSubtitle: string;
  /**
   * A paired region's word for one side and for both, from the limb the logger asks about:
   * "arm" and "arms" ("Left arm · Right arm"), "side" and "sides" on the chest and back, "leg"
   * and "legs". A midline region has none.
   */
  sideWord?: string;
  sideWordPlural?: string;
  /**
   * The region and a side in a sentence, `{side}` standing for "left" or "right": "your {side}
   * forearm", "the {side} side of your chest". A midline region's has no slot ("your core").
   * Rendered by `onSide` (regionIndex.ts).
   *
   * The seed writes it to `regions.on_side_template` (schema v2), which holds `{side}` once on a
   * paired region and never on a midline one, as every other word here has its column.
   */
  onSideTemplate: string;
}

export interface AnatomyNode {
  id: NodeId;
  /** The node's home region (one per node). A page's copy of another region's node keeps it. */
  regionId: RegionId;
  parentId: NodeId | null;
  kind: NodeKind;
  /**
   * The role in the home region. A region's page data holds copies with the role in that
   * region (`external` for another region's node), from `composeRegionData`.
   */
  role: NodeRole;
  /**
   * The value the database's `nodes.role` keeps where it differs from the home role: only the
   * frozen `upper_arm.biceps` and `upper_arm.brachialis`, shipped as `external` in seed v1
   * (10-multi-region.md §1.3). The seed writes `storedRole ?? role`.
   */
  storedRole?: "external";
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

/**
 * One region's listing of a node (10-multi-region.md §1.3): the region's own nodes and other
 * regions' (external) ones, each once. The role is not stored: it is the node's home role in
 * its home region and `external` everywhere else (`memberRole`).
 */
export interface RegionMember {
  nodeId: NodeId;
  /** Place in the region's list, lowest first. */
  sortOrder: number;
  /**
   * Words about the node that belong to this region's page, not to the node ("not a forearm
   * target"), said after the node's own caveats.
   */
  caveats?: string[];
}

export interface JointAction {
  id: ActionId;
  joint: string;
  label: string;
  plainDescription: string;
}

/**
 * A node's joint action. Global: one per node and action, declared by the node's home region
 * (the forearm's shipped rows for the biceps and brachialis are in `regions/upper_arm/`).
 */
export interface NodeAction {
  nodeId: NodeId;
  actionId: ActionId;
  /** `prime`: a main action of the muscle; `assist`: it helps. */
  role: "prime" | "assist";
  /** The id of the function claim this rests on, within its owner's claims. Must belong to the same node. */
  claimId: string;
  /** The same claim's full key, `<owner region>:<claim id>` ("forearm:biceps.function"). */
  claimKey: string;
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
  /**
   * Unique within its owner's claims. Shipped forearm ids are `<node id without its region>.<kind>`
   * (`fcu.function`); new ids are the full node id and the kind (`upper_arm.biceps.appearance`).
   */
  id: string;
  /**
   * The region that owns the claim, wherever its record is kept: the four claims on the biceps
   * and brachialis are the forearm's, kept beside the nodes in `regions/upper_arm/`. The claim's
   * key is `<ownerRegionId>:<id>` (`claimKeyOf`), never derived from the file that lists it.
   */
  ownerRegionId: RegionId;
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
/** `not_applicable` where the hands hold nothing (a leg press), on variants added after the forearm's. */
export type ForearmOrientation = "supinated" | "neutral" | "pronated" | "changing" | "unknown" | "not_applicable";
export type WristPosition = "flexed" | "neutral" | "extended" | "changing" | "unknown" | "not_applicable";
export type GripType =
  | "overhand" | "underhand" | "neutral" | "mixed" | "hook" | "pinch" | "crush" | "open_hand"
  | "fingers_only" | "thumb" | "none" | "unknown";
export type StrapsUse = "yes" | "no" | "unknown" | "not_applicable";
/**
 * The arms: `bilateral` when both arms work in every set by the definition of the exercise (a
 * barbell); `not_applicable` where the hands do no work (a leg extension), on variants added
 * after the forearm's 119, which are frozen.
 */
export type Laterality = "bilateral" | "unilateral" | "either" | "not_applicable";
/** The legs' counterpart of `laterality`, set by review from the exercise (10-multi-region.md §3). */
export type LegLaterality = "bilateral" | "unilateral" | "either" | "not_applicable";
/** The limb whose side the logger records for a variant, and the limb a planned set is split on; `none` records no side. */
export type SidedBy = "arm" | "leg" | "none";
/**
 * Which leg a recorded leg side names (10-multi-region.md §2.1): the working leg, the front leg
 * of a split stance, the standing leg of a single-leg hinge, the top or bottom leg of side-lying
 * work. The arm's side is always the hand holding the load, so it has no anchor.
 */
export type SideAnchor = "working_leg" | "front_leg" | "stance_leg" | "top_leg" | "bottom_leg";
export type Phase = "concentric_eccentric" | "eccentric_only" | "concentric_only" | "unspecified";
export type SetMeasure = "reps" | "seconds";

/**
 * One way of doing a catalog exercise, with its execution spelled out. The catalog has
 * no variant model, so each mapped catalog id has one default variant (`cat-<id>`); a
 * logged set may still override what varies between sets (side, straps).
 */
export interface ExerciseVariant {
  id: VariantId;
  /**
   * The variant this one replaces for the same catalog exercise. The library holds a replaced
   * variant only behind such a link, and `variantFor` returns the current one (10-multi-region.md §3).
   */
  replaces?: VariantId;
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
  /**
   * Counting attributes (10-multi-region.md §3), always written out: nothing defaults them at
   * run time. `sidedBy` is on every variant; `legLaterality` wherever a leg region maps the
   * variant or `sidedBy` is `leg`; `sideAnchor` with a one-sided or either leg variant a leg
   * region maps, or `sidedBy: "leg"`.
   */
  sidedBy: SidedBy;
  legLaterality?: LegLaterality;
  sideAnchor?: SideAnchor;
  /** Descriptive dimensions (knee, hip, torso, bench, plane, grip width, stance, range); read by no rule, cited by mapping rationales. */
  dimensions?: VariantDimensions;
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

/**
 * Where a mapping's muscle is loaded, relative to the side the variant's limb recorded
 * (10-multi-region.md §2.1): the same side, the opposite side (a suitcase carry in the left hand
 * loads the right quadratus lumborum), or both. Read through `sideRelationOf`: absent is `same`.
 */
export type SideRelation = "same" | "opposite" | "both";

export interface VariantMapping {
  /** `cat-<id>:<nodeId>`, unique within its version. Where two versions' mappings meet, key them by `versionedMappingKey`. */
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
  sideRelation?: SideRelation;
}

export interface MappingVersion {
  key: string;
  state: "draft" | "published" | "retired";
  publishedAt: string | null;
  /** What a reviewed mapping of this version does and does not claim; every version has them (10-multi-region.md §4.1, §8). */
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
 * `one_side`: drawn for the subject's RIGHT side, the left being the mirror image; `both_sides`:
 * drawn whole and never mirrored (the core, 10-multi-region.md §7.3).
 */
export type DiagramSides = "one_side" | "both_sides";

/**
 * Drawn for the subject's RIGHT arm. The left arm is the mirror image, and the page
 * flips the drawing — never the anatomy labels, which are re-placed by the mirror.
 */
export interface DiagramAsset {
  key: string;
  version: number;
  regionId: RegionId;
  /**
   * Absent means `one_side` (`diagramSidesOf`). The forearm's drawing leaves it out on purpose,
   * to keep its published file byte for byte; every other region's config sets it, and the
   * drawing contract test ties it to the region's side model (midline: `both_sides`).
   */
  sides?: DiagramSides;
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

/** A catalog exercise tagged with a region's keys that the region deliberately leaves unmapped, and why. */
export interface UnmappedTaggedExercise {
  catalogId: number;
  reason: string;
}

/**
 * Another region's current mapping version, as it credits this region's external members
 * (10-multi-region.md §4.2): the home region speaks for its muscles.
 */
export interface ExternalMappingVersion {
  /** The home region of the members these mappings credit. */
  regionId: RegionId;
  version: MappingVersion;
  /** The home version's mappings of this region's external members only; each keeps its `versionKey`. */
  mappings: VariantMapping[];
  /**
   * The home region's joint actions these mappings name, so the page can name every action it
   * credits (the upper arm credits the biceps for shoulder flexion, which is no forearm action).
   * Not this region's actions: `SpecializationRegionData.actions`, which movement targets read.
   */
  actions: JointAction[];
}

/**
 * One region as its folder declares it (`regions/<region>/index.ts`), before composition: its
 * own nodes and the records kept with them, its members and its mapping version. A region's page
 * data is composed from its content and the content of its external members' home regions
 * (`composeRegionData`, compose.ts). A reference region has no mapping version.
 */
export interface RegionContent {
  region: SpecializationRegion;
  /** The nodes whose home is this region, each with its home role (never `external`). */
  nodes: AnatomyNode[];
  /** Every node the region lists, its own and other regions', in page order. */
  members: RegionMember[];
  /** The region's joint actions, records from the shared library (`actions/`), in page order. */
  actions: JointAction[];
  /** The node actions of this region's own nodes. */
  nodeActions: NodeAction[];
  /** The claim records kept with this region's nodes, whichever region owns each (`ownerRegionId`). */
  claims: Claim[];
  /** The library sources this region's claims and mappings cite, in the page's order. */
  sources: Source[];
  /** The library variants this region's mapping version maps (`variantsMappedBy`). */
  variants: ExerciseVariant[];
  mappings: VariantMapping[];
  mappingVersion: MappingVersion | null;
  unmappedTagged: UnmappedTaggedExercise[];
  diagram: DiagramAsset | null;
}

/**
 * A region's content without its drawing (`regions/<region>/content.ts`): what another region's
 * page reads of it as the home of its external members (10-multi-region.md §6.1: a region's chunk
 * carries its homes' content, never their drawings).
 */
export type RegionHomeContent = Omit<RegionContent, "diagram">;

export interface SpecializationRegionData {
  region: SpecializationRegion;
  /** Region-relative copies, in page order: role as this region lists the node, `regionId` still the node's home. */
  nodes: AnatomyNode[];
  actions: JointAction[];
  nodeActions: NodeAction[];
  claims: Claim[];
  sources: Source[];
  variants: ExerciseVariant[];
  /** The region's own current version's mappings (`mappingVersion`), including any it holds for external members. */
  mappings: VariantMapping[];
  mappingVersion: MappingVersion;
  /**
   * The current versions of the external members' home regions, where a home has a published
   * one. A node is credited by exactly one version: its home's here, or, where the home has
   * none, this region's own rows (the forearm's biceps and brachialis rows until the upper arm
   * publishes, 10-multi-region.md §4.2).
   */
  externalMappingVersions: ExternalMappingVersion[];
  /** Catalog exercises tagged with the region's keys and deliberately left unmapped, each with its reason (§3). */
  unmappedTagged: UnmappedTaggedExercise[];
  diagram: DiagramAsset | null;
}

// ---------------------------------------------------------------- calculator input

/**
 * A summary's single reading of a row's side, as the page read it before sides were resolved per
 * mapping (`Contribution.side`): `bilateral` for a row counted on both sides (or on a plan's
 * assumed sides), `unknown` for a row kept apart. `countedSide` is the reading per mapping.
 */
export type BoutSide = "left" | "right" | "bilateral" | "unknown";
/** Where a bout's side came from, so the ledger can say it. */
export type SideSource = "recorded" | "structural" | "plan_assumption" | "unknown";
export type SummaryMode = "planned" | "completed";

/** A side as a set records it for one limb: `both` when the athlete chose Both. */
export type RecordedSideValue = "left" | "right" | "both";

/**
 * One limb's side as a bout carries it, before any region reads it (10-multi-region.md §2.1):
 * what the athlete recorded on the set, or what the plan assumes for a planned one-sided set.
 */
export interface LimbSideRecord {
  side: RecordedSideValue;
  source: "recorded" | "plan_assumption";
}

/** A recorded side together with the limb it was recorded for, as a contribution reports it. */
export interface RecordedSide extends LimbSideRecord {
  limb: Limb;
}

/**
 * The side a summary counts a row on (`nodeSideFor`, exposure.ts): the summary's own side (`both`
 * on the page for a paired region), `midline` in a midline region, or `unknown` for a row kept apart
 * and counted on neither side, which only a per-side summary does.
 */
export type CountedSide = SummarySide | "unknown";

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
  /**
   * The arm's side as the set recorded it (the set's `side`), or as the plan assumes it; null
   * when none was recorded. Never resolved here: the calculator reads it per region and mapping.
   */
  armSide: LimbSideRecord | null;
  /** The leg's side (the set's `legSide`, named by the variant's anchor), or the plan's assumption; null when none. */
  legSide: LimbSideRecord | null;
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
/** A side of a paired region (10-multi-region.md §2.1). */
export type BodySide = "left" | "right";
/**
 * A side as a record holds it, and as one mapping's work is read on (`nodeSideFor`): a side of a
 * paired region, or `midline`. Goals and measurements store one; since both sides are counted as
 * one (owner, 20 Oct 2026) a paired region's new goal or measurement stores `right` as a
 * placeholder that nothing reads (10-multi-region.md, appendix "Both sides as one").
 */
export type StoredSide = BodySide | "midline";
/**
 * The side a summary counts. `both` is what the page shows for a paired region (owner, 20 Oct
 * 2026: "there's no reason for a left and right arm"): each set counts once per muscle whichever
 * side did it, a set with no side recorded included, and nothing is kept apart for want of a side.
 * `midline` is a midline region's. `left` / `right` are the per-side counts the atlas was built
 * with, kept as dormant, tested capability; the product shows no per-side number.
 */
export type SummarySide = StoredSide | "both";
/** The name this type had when every region was an arm; kept while code still uses it. */
export type ArmSide = BodySide;

export interface SpecializationGoal {
  id: string;
  regionId: RegionId;
  /** Exactly one of nodeId and actionId is set. */
  nodeId: NodeId | null;
  actionId: ActionId | null;
  side: StoredSide;
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

/**
 * `circumference_cm` goes around a limb and is taken per side; `girth_cm` goes around the trunk
 * (shoulders, chest, hips) and is always side `midline` (10-multi-region.md §4.4).
 */
export type MeasurementMetric = "circumference_cm" | "grip_force_n" | "girth_cm";
export type MeasurementPosture = "arm_relaxed_hanging" | "arm_extended_supported" | "elbow_90_supported" | "arm_flexed" | "standing_relaxed" | "other";

export interface MeasurementProtocol {
  /** "Thickest point of the forearm" or "Distance below the elbow crease". */
  landmark: string;
  distanceFromLandmarkCm: number | null;
  posture: MeasurementPosture;
  condition: "unpumped" | "pumped" | "unknown";
  /** Dynamometer or tape used. */
  device: string | null;
  /** HH:MM local time, for repeatability. */
  timeOfDay: string | null;
}

export interface SpecializationMeasurement {
  id: string;
  regionId: RegionId;
  side: StoredSide;
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
  /** The summary's single reading of the side (`BoutSide`); `countedSide` is the reading per mapping. */
  side: BoutSide;
  sideSource: SideSource;
  /** The side this row is counted on: the summary's side, `midline`, or `unknown` (kept apart, counted on neither side). */
  countedSide: CountedSide;
  /** The side the set recorded for the limb that decided `countedSide`; null when none was recorded. */
  recordedSide: RecordedSide | null;
  /** Where the counted mappings' muscle is loaded relative to the recorded side (the first part's, where they differ). */
  sideRelation: SideRelation;
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
  /** "Strapped: grip not counted", "Straps not recorded", "Matched by name"; never a side (both sides as one). */
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
  /**
   * Sets in the window whose exercise tags the region outside its tag scope (a secondary tag where
   * the region reads primary tags only), or is one of its listed unmapped exercises, and that are
   * not counted here (10-multi-region.md §8). Not part of `boutsConsidered`; the rows are
   * `listedUnmappedRows`.
   */
  boutsListedUnmapped: number;
}

/**
 * One bout behind a region-level total: the set record a region count is made of (brief §1,
 * "Every total opens the contributing exercises and actual set records"; §9 source bout ids).
 * No node and no category: a region total is distinct bouts, not credit to any one muscle.
 */
export interface RegionBoutRow {
  boutId: string;
  /** The summary's single reading of the side, as on a contribution. */
  side: BoutSide;
  sideSource: SideSource;
  /**
   * The side the region counts the bout on, or `unknown` for a bout in the unknown-side set or
   * with no side. Always set by `getSpecializationSummary`.
   */
  countedSide?: CountedSide;
  /**
   * The side the set recorded for the limb that decided `countedSide`, else for another limb;
   * null when none was. Always set by `getSpecializationSummary`.
   */
  recordedSide?: RecordedSide | null;
  catalogExerciseId: number | null;
  exerciseName: string;
  matchedBy: "id" | "name" | "none";
  sessionId: string | null;
  sessionLabel: string;
  performedAt: string | null;
  kind: "standard" | "drop";
  segments: ContributionSegment[];
}

/** A set the region does not count although its exercise tags the region (10-multi-region.md §8). */
export interface ListedUnmappedRow extends RegionBoutRow {
  /** `secondary`: tagged as a secondary muscle, outside the region's tag scope; `listed`: one of the region's listed unmapped exercises. */
  tag: "secondary" | "listed";
  /** The region's listed reason for leaving the exercise unmapped; null where none is listed. */
  reason: string | null;
  /**
   * The external members whose rows show this set on this side, counted or kept apart with no
   * side: their home region's version credits it, though this region counts it nowhere. Empty for
   * a set no mapping speaks for.
   */
  creditedTo: NodeId[];
}

export interface SpecializationSummary {
  regionId: RegionId;
  interval: SummaryInterval;
  side: SummarySide;
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
  /** The bouts behind `completeness.boutsListedUnmapped`, each with its exercise's listed reason (null where none is listed), oldest first. */
  listedUnmappedRows?: ListedUnmappedRow[];
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
  /** `both` (what the page shows), or `left` / `right` (per side, dormant) for a paired region; `midline` for a midline one. */
  side: SummarySide;
  mode: SummaryMode;
  /** The published rule the summary applies; the region's current rule (`exposureRuleFor`) when absent. */
  rule?: RuleVersion;
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
