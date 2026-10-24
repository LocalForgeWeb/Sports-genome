import type { ExerciseVariant } from "../types";

/**
 * The variants of the four catalog rows the owner's forearm research package brings (release F3,
 * 24 Oct 2026; docs/specialization-atlas/11-forearm-research-and-stack.md §1.2, §6 and §10 decision
 * 2): one default variant `cat-<id>` each, mapped first by `forearm_mappings_v2`, whose publication
 * freezes every attribute written here.
 *
 * Read as the forearm's 119 are read (variants/forearm.ts; 05-mappings.md "Method"): the definition
 * decides, then the photograph where the catalog shows one ("(as photographed)"). Every column is
 * written out, nothing is defaulted, and the counting attribute `sidedBy` is written on each record:
 * `none` for the two-handed rows, `arm` for the one-hand drill, as the forearm's were written at
 * wave 0. Only the attributes the forearm reads are written: no descriptive dimension (the forearm's
 * mappings cite none) and no leg-only attribute (`legLaterality`, `sideAnchor`), which are the leg
 * waves' to write.
 */
export const forearmResearchVariants: ExerciseVariant[] = [
  {
    id: "cat-417",
    catalogExerciseId: 417,
    catalogName: "Cable Wrist Curl",
    organization: "single_joint",
    forearmOrientation: "supinated",
    wristPosition: "changing",
    gripType: "underhand",
    straps: "not_applicable",
    laterality: "bilateral",
    phase: "concentric_eccentric",
    measure: "reps",
    deliberateHold: false,
    elbowAngleDeg: null,
    notes: "Seated facing a low pulley, a short straight bar in both hands, palms up, forearms on the thighs and the wrists just past the knees; the wrists curl the bar up and lower it (as photographed). The package's fa-23.",
    sidedBy: "none",
  },
  {
    id: "cat-418",
    catalogExerciseId: 418,
    catalogName: "Behind-the-Back Wrist Curl",
    organization: "single_joint",
    forearmOrientation: "pronated",
    wristPosition: "changing",
    gripType: "overhand",
    straps: "not_applicable",
    laterality: "bilateral",
    phase: "concentric_eccentric",
    measure: "reps",
    deliberateHold: false,
    elbowAngleDeg: null,
    notes: "Standing, a barbell held behind the thighs at arm's length, hands shoulder-width, palms facing back; the wrists curl the bar up and back toward the ceiling and lower it (as photographed). With the palms facing back this bends the wrists toward the palm: a wrist curl, not a reverse wrist curl. The package's fa-03.",
    sidedBy: "none",
  },
  {
    id: "cat-419",
    catalogExerciseId: 419,
    catalogName: "Barbell Hold",
    organization: "task",
    forearmOrientation: "pronated",
    wristPosition: "neutral",
    gripType: "overhand",
    straps: "unknown",
    laterality: "bilateral",
    phase: "unspecified",
    measure: "seconds",
    deliberateHold: true,
    elbowAngleDeg: null,
    notes: "A loaded barbell held still at arm's length in front of the thighs, both hands overhand (double overhand), standing; the hold is the purpose of the set and its time is recorded. Straps can be used and are not recorded, as on the hangs and carries. The package's fa-06.",
    sidedBy: "none",
  },
  {
    id: "cat-420",
    catalogExerciseId: 420,
    catalogName: "Band Index and Little Finger Extension",
    organization: "single_joint",
    forearmOrientation: "unknown",
    wristPosition: "neutral",
    gripType: "open_hand",
    straps: "not_applicable",
    laterality: "unilateral",
    phase: "concentric_eccentric",
    measure: "reps",
    deliberateHold: false,
    elbowAngleDeg: null,
    notes: "A light band around the index and little fingers of one hand; those two fingers straighten against it while the middle and ring fingers stay bent into the palm. The hand's own muscles also work, and the other fingers cannot be kept wholly out of it; neither is credited to the forearm (11-forearm §10 decision 2).",
    sidedBy: "arm",
  },
];
