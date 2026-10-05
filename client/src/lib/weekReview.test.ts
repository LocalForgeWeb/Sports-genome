import { describe, expect, it } from "vitest";
import { analyzeWeek, commonMovements, exposureByRegion, exposureStep, setsFigure, WEEK_REVIEW_REVISION, type WeekReviewInput } from "./weekReview";
import { exercises, type Exercise } from "./exerciseCatalog";
import { getWeeklyMuscleVolume } from "./weeklyVolume";
import { getRecoverySpacingAlerts, getRecoverySpacingCoverage } from "./recoverySpacing";
import { buildDaySlots } from "./trainingDayPlan";
import { splitDaysForFrequency } from "./splitCycle";
import { logicCalibration } from "./evidenceTraceability";

const byId = (id: number) => { const found = exercises.find((exercise) => exercise.id === id); if (!found) throw new Error(`no exercise ${id}`); return found; };
const slots = buildDaySlots(splitDaysForFrequency(5));
const key = (index: number) => slots[index].key;

/** The recording's shape: five slots, Upper not built. */
const fullPlan = {
  [key(0)]: [1, 101, 26, 111, 40].map(byId),
  [key(1)]: [57, 43, 87, 126].map(byId),
  [key(2)]: [161, 169, 194, 186].map(byId),
  [key(4)]: [66, 21].map(byId),
};
const input = (overrides: Partial<WeekReviewInput> = {}): WeekReviewInput => ({ slots, plan: fullPlan, prescriptions: {}, goal: "Athleticism", catalog: exercises, ...overrides });

describe("analyzeWeek: one result for the week", () => {
  it("carries its revision and one session per slot in plan order, built or not", () => {
    const week = analyzeWeek(input());
    expect(week.revision).toBe(WEEK_REVIEW_REVISION);
    expect(week.sessions.map((session) => [session.day, session.state])).toEqual([["Push", "built"], ["Pull", "built"], ["Legs", "built"], ["Upper", "empty"], ["Sport Transfer", "built"]]);
    expect(week.builtCount).toBe(4);
    // Planned work sets are sets to perform: the goal default gives 4 to the first two
    // exercises and 3 after, so 5 + 4 + 4 + 2 exercises is 17 + 14 + 14 + 8.
    expect(week.sessions.map((session) => session.workSets)).toEqual([17, 14, 14, 0, 8]);
    expect(week.workSets).toBe(53);
  });

  it("agrees with the muscle volume map on every muscle, every day", () => {
    const week = analyzeWeek(input());
    const volumes = getWeeklyMuscleVolume(fullPlan, {}, "Athleticism");
    expect(volumes.length).toBeGreaterThan(8);
    for (const volume of volumes) {
      const row = week.muscles.find((muscle) => muscle.key === volume.muscle);
      expect(row, volume.muscle).toBeTruthy();
      expect(row!.direct, `${volume.muscle} direct`).toBe(volume.directSets);
      expect(row!.supporting, `${volume.muscle} supporting`).toBe(volume.supportSets);
      expect(row!.total, `${volume.muscle} total`).toBe(volume.equivalentSets);
      for (const [dayKey, sets] of Object.entries(volume.daySets)) {
        expect(row!.byDay.find((entry) => entry.sessionKey === dayKey)?.total, `${volume.muscle} on ${dayKey}`).toBe(sets);
      }
    }
    // The 344.5-style total is the sum the old panel printed, kept for the methodology note.
    expect(week.attributedTotal).toBe(Number(volumes.reduce((sum, volume) => sum + volume.equivalentSets, 0).toFixed(1)));
    expect(week.attributedTotal).toBeGreaterThan(week.workSets);
  });

  it("applies the half-set convention once, to supporting sets only, and never counts a muscle twice for one exercise", () => {
    const shared = exercises.find((exercise) => exercise.secondaryMuscles.some((muscle) => exercise.primaryMuscles.includes(muscle)));
    expect(shared, "an exercise tagging one muscle as both primary and secondary").toBeTruthy();
    const week = analyzeWeek(input({ plan: { [key(0)]: [shared!] }, prescriptions: { [key(0)]: { [shared!.id]: "4 × 8" } } }));
    const both = shared!.primaryMuscles.find((muscle) => shared!.secondaryMuscles.includes(muscle))!;
    const row = week.muscles.find((muscle) => muscle.key === both)!;
    expect(row.direct).toBe(4);
    expect(row.supporting).toBe(0);
    const supporting = week.muscles.find((muscle) => muscle.key === shared!.secondaryMuscles.find((m) => !shared!.primaryMuscles.includes(m)));
    if (supporting) {
      expect(supporting.supporting).toBe(4 * logicCalibration.exposure.secondarySetConvention);
      expect(supporting.supportingPerformed).toBe(4);
      expect(supporting.total).toBe(supporting.direct + supporting.supporting);
    }
  });

  it("reads the saved prescription's leading count, counts an unreadable one as the default and says so", () => {
    const bench = byId(1);
    const week = analyzeWeek(input({ plan: { [key(0)]: [bench, byId(101)] }, prescriptions: { [key(0)]: { [bench.id]: "5 x 5", [101]: "AMRAP to technical failure" } } }));
    expect(week.sessions[0].workSets).toBe(5 + 3);
    expect(week.dataNotes.join(" ")).toMatch(/1 saved prescription does not start with a set count and is counted as 3 sets/);
    // "0 x 10" is read as the default too (the parser treats a zero count as unset), and is said.
    const zero = analyzeWeek(input({ plan: { [key(0)]: [bench] }, prescriptions: { [key(0)]: { [bench.id]: "0 x 10" } } }));
    expect(zero.sessions[0].workSets).toBe(3);
    expect(zero.dataNotes.join(" ")).toMatch(/1 saved prescription/);
    // A plan key outside the split's slots (a day hidden by a lower training frequency) is not the week's.
    const hidden = analyzeWeek(input({ plan: { [key(0)]: [bench], "5-Lower": [byId(161)] } }));
    expect(hidden.sessions).toHaveLength(5);
    expect(hidden.workSets).toBe(4);
    expect(hidden.muscles.find((muscle) => muscle.key === "quads")!.total).toBe(0);
    const second = byId(101).primaryMuscles[0];
    expect(week.muscles.find((muscle) => muscle.key === second)!.direct).toBe((bench.primaryMuscles.includes(second) ? 5 : 0) + 3);
    expect(week.muscles.find((muscle) => muscle.key === "chest")!.direct).toBe(5 + (byId(101).primaryMuscles.includes("chest") ? 3 : 0));
  });

  it("lists an exercise with no muscle mapping in the session total and in no muscle", () => {
    const ghost: Exercise = { ...byId(1), id: 99901, name: "Imported row (unmapped)", primaryMuscles: [], secondaryMuscles: [] };
    const week = analyzeWeek(input({ plan: { [key(0)]: [byId(1), ghost] } }));
    expect(week.unmapped.map((item) => item.exercise.name)).toEqual(["Imported row (unmapped)"]);
    expect(week.sessions[0].workSets).toBe(8);
    expect(week.muscles.every((muscle) => muscle.exercises.every((row) => row.exercise.id !== ghost.id))).toBe(true);
    expect(week.dataNotes[0]).toMatch(/1 exercise has no muscle mapping \(Imported row \(unmapped\)\)/);
  });

  it("puts a zero row on the board for every split-target muscle nothing trains", () => {
    const week = analyzeWeek(input({ plan: { [key(0)]: [byId(1)] } }));
    const hamstrings = week.muscles.find((muscle) => muscle.key === "hamstrings")!;
    expect(hamstrings.total).toBe(0);
    expect(hamstrings.targetOnly).toBe(true);
    expect(hamstrings.byDay.map((entry) => entry.total)).toEqual([0]);
    // The register's "rhomboids" is the catalog's upperBack: one row, under the catalog key.
    expect(week.muscles.filter((muscle) => muscle.key === "rhomboids")).toHaveLength(0);
    expect(week.muscles.some((muscle) => muscle.key === "upperBack")).toBe(true);
    expect(week.muscles[week.muscles.length - 1].total).toBe(0);
  });

  it("gives every muscle a day entry for every built session, zero included, in plan order", () => {
    const week = analyzeWeek(input());
    for (const muscle of week.muscles) {
      expect(muscle.byDay.map((entry) => entry.day)).toEqual(["Push", "Pull", "Legs", "Sport Transfer"]);
      expect(Number(muscle.byDay.reduce((sum, entry) => sum + entry.total, 0).toFixed(1))).toBe(muscle.total);
    }
    expect(week.max.total).toBe(week.muscles[0].total);
    expect(week.max.direct).toBe(Math.max(...week.muscles.map((muscle) => muscle.direct)));
  });

  it("maps umbrella keys onto the regions the figure draws and the three catalog keys the labels lacked", () => {
    const week = analyzeWeek(input());
    const shoulders = week.muscles.find((muscle) => muscle.key === "shoulders");
    if (shoulders) expect(shoulders.figureKeys).toEqual(["frontDelts", "sideDelts", "rearDelts"]);
    expect(week.muscles.find((muscle) => muscle.key === "upperBack")!.figureKeys).toEqual(["upperBack"]);
    const knee = exercises.find((exercise) => exercise.primaryMuscles.includes("hipFlexors"))!;
    const hip = analyzeWeek(input({ plan: { [key(0)]: [knee] } })).muscles.find((muscle) => muscle.key === "hipFlexors")!;
    expect(hip.label).toBe("Hip flexors");
  });
});

describe("analyzeWeek: movement coverage from the catalog's own taxonomy", () => {
  it("names the patterns present with their sessions, and the commonest catalog patterns absent", () => {
    const week = analyzeWeek(input());
    expect(week.patterns.find((pattern) => pattern.movement === "Horizontal push")!.sessionKeys).toContain(key(0));
    expect(commonMovements(exercises)).toHaveLength(12);
    expect(commonMovements(exercises)[0]).toBe("Horizontal push");
    for (const movement of week.notPlanned) expect(week.patterns.some((pattern) => pattern.movement === movement)).toBe(false);
    expect(week.unknownPattern).toEqual([]);
  });

  it("lists an exercise with no movement value as unknown rather than under a pattern", () => {
    const blank: Exercise = { ...byId(1), id: 99902, movement: "" };
    const week = analyzeWeek(input({ plan: { [key(0)]: [blank] } }));
    expect(week.unknownPattern.map((item) => item.exercise.id)).toEqual([99902]);
    expect(week.patterns).toEqual([]);
  });
});

describe("analyzeWeek: session overlap in plan order", () => {
  it("compares the same pairs as the spacing check, with the same shared muscles and sets", () => {
    const week = analyzeWeek(input());
    const alerts = getRecoverySpacingAlerts(fullPlan, {}, "Athleticism");
    const coverage = getRecoverySpacingCoverage(fullPlan);
    expect(week.overlap.pairs.map((pair) => [pair.aDay, pair.bDay])).toEqual(coverage.compared);
    expect(week.overlap.skipped.map((pair) => [pair.aDay, pair.bDay])).toEqual(coverage.skipped);
    // The same muscles and sets; the spacing check orders ties by first encounter, this by label.
    const asSet = (items: [string, number, number][]) => [...items].sort((a, b) => a[0].localeCompare(b[0]));
    for (const alert of alerts) {
      const pair = week.overlap.pairs.find((item) => item.aDay === alert.previousDay && item.bDay === alert.nextDay)!;
      expect(pair.heavy).toBe(alert.severity === "priority");
      expect(asSet(pair.shared.map((item) => [item.key, item.aSets, item.bSets]))).toEqual(asSet(alert.sharedMuscles.map((item) => [item.muscle, item.previousSets, item.nextSets])));
      expect(pair.sharedExposure).toBe(Number(alert.sharedMuscles.reduce((sum, item) => sum + Math.min(item.previousSets, item.nextSets), 0).toFixed(1)));
    }
    for (const pair of week.overlap.pairs.filter((item) => item.shared.length)) expect(alerts.some((alert) => alert.previousDay === pair.aDay && alert.nextDay === pair.bDay)).toBe(true);
  });

  it("skips a pair with an unbuilt slot between them and never calls the gap a rest day", () => {
    const week = analyzeWeek(input({ plan: { [key(0)]: fullPlan[key(0)], [key(2)]: fullPlan[key(2)] } }));
    expect(week.overlap.pairs).toEqual([]);
    expect(week.overlap.skipped).toEqual([{ aDay: "Push", bDay: "Legs" }]);
    expect(week.sessions[1].state).toBe("empty");
    expect(JSON.stringify(week)).not.toMatch(/rest day/i);
  });
});

describe("analyzeWeek: findings", () => {
  it("flags a heavy overlap only when the register's criterion is met, with a pair to compare", () => {
    const bench = byId(1); const incline = byId(101);
    const week = analyzeWeek(input({ plan: { [key(0)]: [bench, incline], [key(1)]: [bench, incline] }, prescriptions: { [key(0)]: { 1: "5 x 5", 101: "5 x 5" }, [key(1)]: { 1: "5 x 5", 101: "5 x 5" } } }));
    const heavy = week.findings.find((finding) => finding.rule === "heavy-overlap")!;
    expect(heavy.kind).toBe("review");
    expect(heavy.headline).toMatch(/^Push and Pull share heavy exposure: /);
    expect(heavy.action).toEqual({ type: "select-pair", pairId: `${key(0)}|${key(1)}`, label: "Compare sessions" });
    const light = analyzeWeek(input({ plan: { [key(0)]: [bench], [key(1)]: [bench] }, prescriptions: { [key(0)]: { 1: "3 x 8" }, [key(1)]: { 1: "3 x 8" } } }));
    expect(light.overlap.pairs[0].shared.map((item) => item.key)).toContain("chest");
    expect(light.overlap.pairs[0].heavy).toBe(false);
    expect(light.findings.some((finding) => finding.rule === "heavy-overlap")).toBe(false);
  });

  it("reports a split-target gap from the existing coverage model with an Add exercises action on that day", () => {
    const week = analyzeWeek(input({ plan: { [key(2)]: [byId(161)] } }));
    const gap = week.findings.find((finding) => finding.rule === "target-gap")!;
    expect(gap.headline).toMatch(/^Legs leaves .+ under its target\.$/);
    expect(gap.source).toContain("split_targets_v1");
    expect(gap.action).toEqual({ type: "edit-day", dayKey: key(2), label: "Add exercises to Legs", addExercises: true });
  });

  it("names a concentrated muscle only when the split asks two built sessions for it and one carries most of it", () => {
    const bench = byId(1);
    // Push and Upper both list the chest as a primary target; Push carries nearly all of it.
    const week = analyzeWeek(input({ plan: { [key(0)]: [bench, bench, bench], [key(3)]: [bench] }, prescriptions: { [key(0)]: { 1: "5 x 5" }, [key(3)]: { 1: "1 x 5" } } }));
    const finding = week.findings.find((finding) => finding.rule === "concentration")!;
    expect(finding.headline).toBe("Most pectoralis major exposure falls on Push.");
    expect(finding.reason).toMatch(/^15 of 16 attributed sets \(94%\) on Push, though 2 of the built sessions have it as a split target\.$/);
    expect(finding.action).toEqual({ type: "select-muscle", muscle: "chest", label: "Review distribution" });
    // Push and Pull: only Push targets the chest, so most chest work on Push is the split, not a finding.
    const split = analyzeWeek(input({ plan: { [key(0)]: [bench, bench, bench], [key(1)]: [bench] }, prescriptions: { [key(0)]: { 1: "5 x 5" }, [key(1)]: { 1: "1 x 5" } } }));
    expect(split.findings.some((finding) => finding.rule === "concentration")).toBe(false);
    const single = analyzeWeek(input({ plan: { [key(0)]: [bench] } }));
    expect(single.findings.some((finding) => finding.rule === "concentration")).toBe(false);
  });

  it("states a strength only when it is true, and never on an empty week", () => {
    const empty = analyzeWeek(input({ plan: {} }));
    expect(empty.findings).toEqual([]);
    expect(empty.builtCount).toBe(0);
    expect(empty.muscles.every((muscle) => muscle.total === 0)).toBe(true);
    const week = analyzeWeek(input());
    const strength = week.findings.filter((finding) => finding.kind === "strength");
    for (const finding of strength) expect(["targets-met", "spread"]).toContain(finding.rule);
    expect(week.findings.indexOf(week.findings.find((finding) => finding.kind === "review")!)).toBeGreaterThanOrEqual(strength.length);
    // One muscle is never both "spread across sessions" and "concentrated on one" (the recording's upper back).
    const concentrated = week.findings.filter((finding) => finding.rule === "concentration").map((finding) => finding.id.split(":")[1]);
    const spread = week.findings.find((finding) => finding.rule === "spread");
    if (spread) expect(concentrated).not.toContain(spread.id.split(":")[1]);
  });
});

describe("exposure helpers", () => {
  it("sums muscles onto the regions they paint and quantises against the week's maximum", () => {
    const week = analyzeWeek(input());
    const regions = exposureByRegion(week.muscles, "total");
    const chest = week.muscles.find((muscle) => muscle.key === "chest")!;
    expect(regions.chest).toBe(chest.total);
    expect(exposureStep(0, 20)).toBe(0);
    expect(exposureStep(1, 20)).toBe(1);
    expect(exposureStep(20, 20)).toBe(5);
    expect(exposureStep(8.5, 20)).toBe(3);
    expect(exposureStep(5, 0)).toBe(0);
    expect(setsFigure(18.5)).toBe("18.5");
    expect(setsFigure(20)).toBe("20");
  });
});
