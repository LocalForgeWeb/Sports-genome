import type { AnatomyNode } from "../../types";
import { UPPER_ARM_REGION_ID, upperArmAdjacentIds, upperArmGroupIds, upperArmMuscleIds as m } from "./ids";

/**
 * The upper arm's anatomy nodes (docs/specialization-atlas/10-multi-region.md §1.2): ids, names,
 * short names, kinds, roles, layers and parents as §1.2 fixes them. The descriptive fields come from
 * the upper arm's evidence review of 19 Oct 2026 (docs/specialization-atlas/regions/upper_arm/
 * anatomy-evidence.md), and every claim behind them is in claims.ts.
 *
 * The biceps and brachialis shipped with the forearm atlas (seed v1) and are frozen there: their
 * ids, region, catalog key and the stored role `external` stay as they are for good (§1.3). Here
 * they are what they are in their home region, targets, and `storedRole` keeps the value the
 * database holds. Their text is neutral anatomy: the sentences that spoke from the forearm's page
 * ("does not add forearm size", "not a forearm target") are the forearm's membership caveats
 * (regions/forearm/members.ts), said only there.
 *
 * `databaseMuscle` is the `public.muscles.canonical_name` a node refines: the biceps' and
 * brachialis' as shipped, and the three triceps heads' as the app names them (shared/
 * capabilityRank.ts). The triceps parent and the coracobrachialis refine none.
 *
 * The triceps is a parent (kind `muscle`, role `group`): neither drawn nor selectable, its layer
 * "—" in §1.2, written `mixed` as the forearm's groups are. Its three heads are the targets.
 *
 * How the copy is written (brief §3, §6; 10-multi-region.md §8):
 * - Directions are anatomical: front and back, inner and outer, toward the shoulder or the elbow.
 *   Never screen-left or screen-right: the drawing shows one arm.
 * - `whatItDoes` is the physical action only. `shapeNote` is a separate, qualified inference from
 *   location and depth ("may contribute to"), never a forecast of growth, and says that visible
 *   shape also depends on neighbouring muscles, body fat and individual anatomy.
 * - Deep muscles say plainly that they have little or no contour of their own.
 * - A node is `reviewed` only when every function claim behind it was reviewed, the forearm's
 *   shipped claims on the biceps and brachialis included (client/src/lib/specialization/
 *   regionContent.test.ts).
 */
type NodeSeed = Pick<AnatomyNode, "id" | "parentId" | "kind" | "role" | "name" | "shortName" | "aliases" | "layer" | "surfaceVisibility" | "catalogMuscleKey" | "databaseMuscle" | "location" | "whatItDoes" | "shapeNote"> & Partial<AnatomyNode>;

const upperArm = (seed: NodeSeed): AnatomyNode => ({
  regionId: UPPER_ARM_REGION_ID,
  status: "draft",
  border: null,
  caveats: [],
  ...seed,
});

/** Said wherever a contour is mentioned, so no single muscle is credited with the outline. */
const NEIGHBOURS = "Visible shape also depends on neighbouring muscles, body fat and individual anatomy.";

export const upperArmNodes: AnatomyNode[] = [
  upperArm({
    id: m.biceps, parentId: null, kind: "muscle", role: "target", storedRole: "external",
    name: "Biceps brachii", shortName: "Biceps", aliases: ["biceps"],
    layer: "surface", surfaceVisibility: "clear", catalogMuscleKey: "biceps", databaseMuscle: "biceps_brachii",
    status: "reviewed",
    location: "Front of the upper arm, at the surface: its two heads start on the shoulder blade, and it crosses the elbow to the radius.",
    whatItDoes: "Bends your elbow and turns your palm up; with the elbow bent it is the strongest palm-up muscle. It also crosses the shoulder, where references describe only weak help raising the arm forward.",
    shapeNote: `May contribute most of the front contour of the upper arm above the elbow crease, since it is the surface muscle there. ${NEIGHBOURS}`,
    caveats: [
      "Its two heads are counted as one muscle here; anatomy references describe their elbow and forearm actions together.",
      "Its help raising the arm forward is weak, and studies disagree on whether its long head works in shoulder movement at all, so it is listed only as helping there.",
      "Some people have an extra head; it usually causes no symptoms.",
    ],
  }),
  upperArm({
    id: m.brachialis, parentId: null, kind: "muscle", role: "target", storedRole: "external",
    name: "Brachialis", shortName: "Brachialis", aliases: ["brachialis"],
    layer: "deep", surfaceVisibility: "partial", catalogMuscleKey: "brachialis", databaseMuscle: "brachialis",
    status: "reviewed",
    location: "Front of the lower half of the upper arm, under the biceps, crossing the elbow to the ulna.",
    whatItDoes: "Bends your elbow, whichever way the palm faces. It does not turn the forearm.",
    shapeNote: `Mostly covered by the biceps, so most of it has little or no contour of its own. Its outer edge and lower end lie close to the surface and may add to the outer side of the lower upper arm, beside the biceps. ${NEIGHBOURS}`,
    caveats: ["It bends the elbow whatever the grip, so curls with the palm down or the thumb up load it too."],
  }),

  upperArm({
    id: upperArmGroupIds.triceps, parentId: null, kind: "muscle", role: "group",
    name: "Triceps brachii", shortName: "Triceps", aliases: ["triceps"],
    layer: "mixed", surfaceVisibility: "partial", catalogMuscleKey: "triceps", databaseMuscle: null,
    status: "reviewed",
    location: "Back of the upper arm, from the shoulder blade and the upper-arm bone to the point of the elbow.",
    whatItDoes: "Straightens your elbow. Its long head also helps move the arm down and back at the shoulder.",
    shapeNote: `May make up most of the back-of-arm contour, mostly through its long and lateral heads at the surface. ${NEIGHBOURS}`,
    caveats: ["A muscle with three heads, not a target itself: work is counted for the heads inside it."],
  }),
  upperArm({
    id: m.tricepsLong, parentId: upperArmGroupIds.triceps, kind: "head", role: "target",
    name: "Triceps, long head", shortName: "TriLong", aliases: ["long head of triceps", "triceps long head"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "triceps", databaseMuscle: "triceps_brachii_long_head",
    status: "reviewed",
    location: "Back of the upper arm, at the surface, from the shoulder blade just below the shoulder joint down to the common tendon at the point of the elbow.",
    whatItDoes:
      "Straightens your elbow with the other two heads. It is the only head that crosses the shoulder, where it helps move the arm down and back (some references add toward the body) and helps hold the top of the upper-arm bone in its socket.",
    shapeNote: `May contribute to the back-of-arm contour from below the shoulder toward the elbow, as one of the two surface heads. ${NEIGHBOURS}`,
    caveats: [
      "Its actions at the shoulder are small next to its work at the elbow.",
      "One short-term study found that its share of the work changes with arm position; that is activity and modelled force, not growth, and it is not used to weight credit.",
    ],
  }),
  upperArm({
    id: m.tricepsLateral, parentId: upperArmGroupIds.triceps, kind: "head", role: "target",
    name: "Triceps, lateral head", shortName: "TriLat", aliases: ["lateral head of triceps", "triceps lateral head"],
    layer: "surface", surfaceVisibility: "partial", catalogMuscleKey: "triceps", databaseMuscle: "triceps_brachii_lateral_head",
    status: "reviewed",
    location: "Back of the upper arm on the outer side, at the surface, from the upper half of the upper-arm bone to the common tendon at the point of the elbow.",
    whatItDoes: "Straightens your elbow. It does not cross the shoulder.",
    shapeNote: `May contribute to the outer part of the back-of-arm contour, as one of the two surface heads. ${NEIGHBOURS}`,
    caveats: ["It shares every action with the medial head, so their work is counted together and not split between them."],
  }),
  upperArm({
    id: m.tricepsMedial, parentId: upperArmGroupIds.triceps, kind: "head", role: "target",
    name: "Triceps, medial head", shortName: "TriMed", aliases: ["medial head of triceps", "triceps medial head"],
    layer: "deep", surfaceVisibility: "partial", catalogMuscleKey: "triceps", databaseMuscle: "triceps_brachii_medial_head",
    status: "reviewed",
    location: "Back of the upper arm, deep layer, on the lower half of the upper-arm bone under the long and lateral heads; its lower part reaches closer to the elbow than theirs.",
    whatItDoes: "Straightens your elbow. It does not cross the shoulder. Some of its deepest fibres attach to the back of the elbow joint's capsule; what they do there is debated.",
    shapeNote: `Mostly covered by the long and lateral heads, so it has little or no contour of its own. ${NEIGHBOURS}`,
    caveats: [
      "It shares every action with the lateral head, so their work is counted together and not split between them.",
      "Whether any of it shows at the surface just above the elbow was not confirmed; one anatomy reference says it cannot be felt.",
    ],
  }),

  upperArm({
    id: upperArmAdjacentIds.coracobrachialis, parentId: null, kind: "muscle", role: "adjacent",
    name: "Coracobrachialis", shortName: "CB", aliases: ["coracobrachialis"],
    layer: "deep", surfaceVisibility: "not_distinct", catalogMuscleKey: null, databaseMuscle: null,
    status: "reviewed",
    location: "Inner side of the upper part of the upper arm, from the front of the shoulder blade to about halfway down the upper-arm bone; behind the chest muscle near the shoulder and on the inner side of the biceps below it.",
    whatItDoes: "Raises your arm forward at the shoulder and helps draw it in toward your body.",
    shapeNote: `Slender and mostly hidden near the shoulder, so it has little or no contour of its own. It can be felt in the armpit. ${NEIGHBOURS}`,
    caveats: ["Shown beside the upper-arm muscles because of where it sits; upper-arm specialization does not target it."],
  }),
];
