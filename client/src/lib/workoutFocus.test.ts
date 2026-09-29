import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { focusSummary, workoutFocus } from "@/lib/workoutFocus";

const byName = (name: string) => {
  const found = exercises.find((exercise) => exercise.name === name);
  if (!found) throw new Error(`no catalog exercise ${name}`);
  return found;
};
/** Sets as the drafted days had them: 4, 4, then 3 each. */
const drafted = (index: number) => (index < 2 ? 4 : 3);

/** The recording's wrestling Push day (Smart Draft). */
const push = ["Cable Standing Punch", "Cable Press-Out", "Half-Kneeling Cable Chest Press", "Barbell Overhead Press", "Scapular Wall Slide"].map(byName);
const pull = ["Lat Pulldown", "Seated Cable Row"].map(byName);
const legs = ["Back Squat", "Romanian Deadlift"].map(byName);

describe("workoutFocus", () => {
  it("ranks the Push day's regions by direct sets and shows it from the front, upper body", () => {
    const focus = workoutFocus(push, (_, index) => drafted(index))!;
    expect(focus.regions[0].label).toBe("Chest");
    expect(focus.figure?.side).toBe("front");
    expect(focus.figure?.frame).toBe("upper");
    // Triceps are drawn on the back only; no front arm region stands in for them.
    expect(Object.keys(focus.figure!.roles)).not.toContain("biceps");
    expect(Object.keys(focus.figure!.roles)).not.toContain("brachioradialis");
    // Still named in the summary, which is not limited to the side drawn.
    expect(focus.regions.map((region) => region.label)).toContain("Triceps");
  });

  it("turns a pulling day to the back, where its work is", () => {
    const focus = workoutFocus(pull, (_, index) => drafted(index))!;
    expect(focus.figure?.side).toBe("back");
    expect(Object.keys(focus.figure!.roles)).toEqual(expect.arrayContaining(["lats"]));
  });

  it("frames a lower-body day on the legs and a mixed day on the whole body", () => {
    expect(workoutFocus(legs, (_, index) => drafted(index))!.figure?.frame).toBe("lower");
    expect(workoutFocus([...push, ...legs], (_, index) => drafted(index))!.figure?.frame).toBe("full");
  });

  it("counts an exercise once per region, however many of its muscles land there", () => {
    const press = byName("Barbell Overhead Press");
    const focus = workoutFocus([press], () => 3)!;
    expect(focus.regions.find((region) => region.id === "shoulders")?.directSets).toBe(3);
  });

  it("draws no empty body when nothing the day trains is drawn", () => {
    const focus = workoutFocus([byName("Cable Serratus Punch")], () => 3)!;
    expect(focus.figure).toBeNull();
    expect(focus.regions.map((region) => region.label)).toEqual(["Chest"]);
    expect(workoutFocus([], () => 3)).toBeNull();
  });

  it("names three regions and counts the rest", () => {
    const focus = workoutFocus(push, (_, index) => drafted(index));
    expect(focusSummary(focus)).toMatch(/^Chest · \w[\w ]* · \w[\w ]*( · \+\d+ more)?$/);
    expect(focusSummary(null)).toBe("");
  });
});
