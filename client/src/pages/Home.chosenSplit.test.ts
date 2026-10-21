import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The athlete picks each training day's type (Train → Edit days); the frequency no longer
 * forces a split. These pin how Home carries that choice: in the plan it names the keys of,
 * read back before anything compares splits, and applied to every week.
 */
const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const hydration = home.slice(home.indexOf("const plan = JSON.parse(stored) as StoredWorkoutPlan;"), home.indexOf("}, [workoutPlanKey, loading, profileHydrated, planReadRequest]);"));

describe("the athlete's chosen days in Home", () => {
  it("derives the week from the chosen days, falling back to the frequency's split", () => {
    expect(home).toContain("const splitDays = useMemo(() => effectiveSplit(trainingDays, splitPreference), [trainingDays, splitPreference]);");
    expect(home).not.toContain("splitDaysForFrequency(trainingDays), [trainingDays]");
  });

  it("stores only a chosen week, alongside the plan whose keys it names", () => {
    expect(home).toContain("...(isRecommendedSplit(splitDays) ? {} : { split: splitDays }),");
  });

  it("reads the stored days back before the week, and tells the remap they are not a change", () => {
    const read = hydration.indexOf("const chosen = readStoredSplit(plan.split);");
    expect(read).toBeGreaterThan(-1);
    expect(hydration.indexOf("splitDaysRef.current = split;")).toBeGreaterThan(read);
    expect(hydration).toContain("if (chosen) setTrainingDays(chosen.length);");
    // Every week is read against the stored days, not the split the last render had.
    expect(hydration).toContain("restoreWeekSnapshot(snapshot, split)");
    expect(hydration).toContain("resolveActiveSlot(split, activeSnapshot.activeDayIndex");
  });

  it("moves every week's records when the days change, not only the open week's", () => {
    const effect = home.slice(home.indexOf("const previous = splitDaysRef.current;"), home.indexOf("}, [splitDays, profileHydrated, planHydrated]);"));
    expect(effect).toContain("remapDaysForFrequency(snapshot.days, previous, splitDays)");
    expect(effect).toContain("carriedDayIndex(previous, splitDays, snapshot.activeDayIndex, remapped.moved)");
  });

  it("reads the plan again when the account's copy is adopted", () => {
    const adopt = home.slice(home.indexOf("const adoptServerPlan = useCallback("), home.indexOf("const planSync = usePlanSync("));
    expect(adopt).toContain("setPlanReadRequest((count) => count + 1);");
  });

  it("opens the day editor from the training plan", () => {
    expect(home).toContain("onEditDays={() => setSplitEditorOpen(true)}");
    expect(home).toContain("{splitEditorOpen && <Suspense fallback={null}><SplitEditorSheet current={splitDays}");
  });
});
