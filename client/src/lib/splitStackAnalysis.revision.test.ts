import { describe, expect, it } from "vitest";
import { COVERAGE_TARGET_REVISION, analyzeSplitStack, getSplitRequirements } from "@/lib/splitStackAnalysis";
import type { TrainingSplit } from "@/lib/splitAssignment";

const splits: TrainingSplit[] = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];

/** Every target, in a stable text form. */
const targetsText = () => splits.map((split) => `${split}:${getSplitRequirements(split).map((r) => `${r.muscle}/${r.role}/${r.target}`).join(",")}`).join("|");

/**
 * B109: a coverage result has to say which targets graded it. The fingerprint below is the
 * targets this revision was published with; change a target and this fails until the revision
 * (and this pair) is bumped, so a moved goalpost is never read as changed training.
 */
const PUBLISHED: Record<string, string> = {
  split_targets_v1: "Push:chest/primary/90,frontDelts/primary/75,triceps/primary/70,sideDelts/support/45,serratusAnterior/support/35|Pull:lats/primary/85,rhomboids/primary/65,traps/primary/60,rearDelts/support/45,biceps/support/55,forearms/support/40|Legs:quads/primary/80,hamstrings/primary/75,glutes/primary/70,calves/support/40,adductors/support/35|Upper:chest/primary/60,lats/primary/60,frontDelts/support/45,rearDelts/support/45,triceps/support/45,biceps/support/45|Lower:quads/primary/75,hamstrings/primary/75,glutes/primary/70,calves/support/40,tibialis/support/25|Full Body:chest/primary/45,lats/primary/45,quads/primary/50,hamstrings/primary/45,glutes/primary/45,abs/support/35|Sport Transfer:glutes/primary/50,abs/primary/45,obliques/primary/45,traps/support/35,rotatorCuff/support/30",
};

describe("coverage target revision", () => {
  it("names the targets each analysis was graded against", () => {
    expect(analyzeSplitStack([], [], "Push").targetRevision).toBe(COVERAGE_TARGET_REVISION);
  });

  it("cannot change a target without a new revision", () => {
    expect(PUBLISHED[COVERAGE_TARGET_REVISION]).toBe(targetsText());
  });
});
