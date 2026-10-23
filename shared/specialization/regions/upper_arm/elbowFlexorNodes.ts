import type { AnatomyNode } from "../../types";
import { UPPER_ARM_REGION_ID, upperArmMuscleIds as m } from "./ids";

/**
 * The upper arm's first two nodes, the biceps and the brachialis, and the helpers every upper-arm
 * node is written with (nodes.ts lists all of them, these two first). Kept in a module of their own
 * at wave A's integration (23 Oct 2026), unchanged, so that the forearm's page, which lists these two
 * as external members (docs/specialization-atlas/10-multi-region.md §1.2, §1.3), loads them without
 * the triceps and the coracobrachialis (§6.1's download gate; regions/forearm/upperArmHome.ts).
 * How they are written is said in nodes.ts.
 */
type NodeSeed = Pick<AnatomyNode, "id" | "parentId" | "kind" | "role" | "name" | "shortName" | "aliases" | "layer" | "surfaceVisibility" | "catalogMuscleKey" | "databaseMuscle" | "location" | "whatItDoes" | "shapeNote"> & Partial<AnatomyNode>;

export const upperArm = (seed: NodeSeed): AnatomyNode => ({
  regionId: UPPER_ARM_REGION_ID,
  status: "draft",
  border: null,
  caveats: [],
  ...seed,
});

/** Said wherever a contour is mentioned, so no single muscle is credited with the outline. */
export const NEIGHBOURS = "Visible shape also depends on neighbouring muscles, body fat and individual anatomy.";

export const upperArmElbowFlexorNodes: AnatomyNode[] = [
  upperArm({
    id: m.biceps, parentId: null, kind: "muscle", role: "target", storedRole: "external",
    name: "Biceps brachii", shortName: "Biceps", aliases: ["biceps"],
    layer: "surface", surfaceVisibility: "clear", catalogMuscleKey: "biceps", databaseMuscle: "biceps_brachii",
    status: "reviewed",
    location: "Front of the upper arm, at the surface: its two heads start on the shoulder blade, and it crosses the elbow to the radius.",
    whatItDoes: "Bends your elbow and turns your palm up; with the elbow bent it is the strongest palm-up muscle. It also crosses the shoulder, where references describe only weak help raising the arm forward.",
    shapeNote: `May contribute most of the front contour of the upper arm above the elbow crease, since it is the surface muscle there. ${NEIGHBOURS}`,
    caveats: [
      "Its two heads are counted as one muscle; anatomy references describe their elbow and forearm actions together.",
      "Its help raising the arm forward is weak, and studies disagree on whether its long head works in shoulder movement at all.",
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
];
