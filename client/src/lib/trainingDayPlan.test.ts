import { describe, expect, it } from "vitest";
import {
  buildDaySlots,
  clearDay,
  commitDay,
  dayExerciseCount,
  dayPlanKey,
  emptyDayStore,
  hasDayContent,
  loadDay,
  placeImportedDays,
  remapDaysForFrequency,
  resolveActiveSlot,
  slotForKey,
  visibleDayPlan,
  type WeeklyDayStore,
} from "@/lib/trainingDayPlan";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";

const exercise = (id: number, name: string): Exercise => ({
  id,
  name,
  sourceGroup: "test",
  category: "Compound",
  equipment: "Barbell",
  movement: "Horizontal press",
  primaryMuscles: ["chest"],
  secondaryMuscles: ["triceps"],
  qualities: ["strength"],
  muscleGrade: "A",
  sportFit: {
    tennis: { grade: "B", movementHelp: "" },
    basketball: { grade: "B", movementHelp: "" },
    soccer: { grade: "B", movementHelp: "" },
    baseball: { grade: "B", movementHelp: "" },
    combat: { grade: "B", movementHelp: "" },
  },
});

const bench = exercise(1, "Barbell Bench Press");
const row = exercise(2, "Cable Row");
const squat = exercise(3, "Back Squat");
const settings = (notes: string): ExerciseSettings => ({ rpe: "RPE 8", rest: "120 sec", notes, completed: false });

describe("training day slots", () => {
  it("addresses a day by its position, so a repeated split label cannot move an athlete off the day they are editing", () => {
    const days = splitDaysForFrequency(4);
    expect(days).toEqual(["Upper", "Lower", "Upper", "Lower"]);
    const slots = buildDaySlots(days);
    expect(slots.map((slot) => slot.key)).toEqual(["0-Upper", "1-Lower", "2-Upper", "3-Lower"]);
    // The second Upper is Day 03, not Day 01.
    expect(resolveActiveSlot(days, 2, "Upper").key).toBe("2-Upper");
    expect(resolveActiveSlot(days, 2, "Upper").ordinal).toBe("Day 03");
  });

  it("re-homes an active day whose label no longer exists instead of leaving an unreachable slot", () => {
    const days = splitDaysForFrequency(3);
    // Was on Day 05 of a longer week; the week is three days now.
    expect(resolveActiveSlot(days, 4, "Sport Transfer").key).toBe("2-Legs");
    // Label survives at a new position.
    expect(resolveActiveSlot(splitDaysForFrequency(6), 4, "Sport Transfer").key).toBe("5-Sport Transfer");
  });

  it("resolves a stored key back to its slot and reports an unknown key rather than guessing", () => {
    const days = splitDaysForFrequency(3);
    expect(slotForKey(days, "1-Pull")?.index).toBe(1);
    expect(slotForKey(days, "9-Legs")).toBeNull();
  });
});

describe("saving and reading one training day", () => {
  it("keeps a day's exercises, prescriptions, effort settings and imported context together under its own key", () => {
    const store = commitDay(emptyDayStore(), dayPlanKey(0, "Push"), {
      workout: [bench, row],
      prescriptions: { [bench.id]: "4 × 5", [row.id]: "3 × 10" },
      settings: { [bench.id]: settings("top set"), [row.id]: settings("slow eccentric") },
      context: [{ raw: "5 min bike", kind: "warm-up" }],
    });
    const restored = loadDay(store, "0-Push");
    expect(restored.workout.map((item) => item.name)).toEqual(["Barbell Bench Press", "Cable Row"]);
    expect(restored.prescriptions[bench.id]).toBe("4 × 5");
    expect(restored.settings[row.id].notes).toBe("slow eccentric");
    expect(restored.context[0].raw).toBe("5 min bike");
    expect(dayExerciseCount(store, "0-Push")).toBe(2);
    expect(hasDayContent(store, "1-Pull")).toBe(false);
  });

  it("loads a day as a replacement, so the day you just left cannot leave its sets on the day you just opened", () => {
    let store = commitDay(emptyDayStore(), "0-Push", {
      workout: [bench],
      prescriptions: { [bench.id]: "4 × 5" },
      settings: { [bench.id]: settings("push day note") },
    });
    store = commitDay(store, "1-Pull", {
      workout: [row],
      prescriptions: { [row.id]: "3 × 12" },
      settings: { [row.id]: settings("pull day note") },
    });

    const pull = loadDay(store, "1-Pull");
    expect(Object.keys(pull.prescriptions)).toEqual([String(row.id)]);
    expect(pull.prescriptions[bench.id]).toBeUndefined();
    expect(pull.settings[bench.id]).toBeUndefined();
    // And the day left behind is unchanged.
    expect(loadDay(store, "0-Push").prescriptions[bench.id]).toBe("4 × 5");
  });

  it("gives the same exercise independent prescriptions on two different days", () => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [bench], prescriptions: { [bench.id]: "5 × 3" }, settings: { [bench.id]: settings("heavy") } });
    store = commitDay(store, "3-Upper", { workout: [bench], prescriptions: { [bench.id]: "3 × 12" }, settings: { [bench.id]: settings("light") } });
    expect(loadDay(store, "0-Push").prescriptions[bench.id]).toBe("5 × 3");
    expect(loadDay(store, "3-Upper").prescriptions[bench.id]).toBe("3 × 12");
    expect(loadDay(store, "0-Push").settings[bench.id].notes).toBe("heavy");
  });

  it("drops the prescription of a removed exercise rather than resurrecting it on the next save", () => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [bench, row], prescriptions: { [bench.id]: "4 × 5", [row.id]: "3 × 10" }, settings: {} });
    store = commitDay(store, "0-Push", { workout: [bench], prescriptions: { [bench.id]: "4 × 5", [row.id]: "3 × 10" }, settings: {} });
    expect(loadDay(store, "0-Push").prescriptions).toEqual({ [bench.id]: "4 × 5" });
  });

  it("keeps a committed day when the next commit only changes one facet", () => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [bench, row], prescriptions: { [bench.id]: "4 × 5" }, settings: {}, context: [] });
    store = commitDay(store, "0-Push", { prescriptions: { [bench.id]: "5 × 5" } });
    expect(dayExerciseCount(store, "0-Push")).toBe(2);
    expect(loadDay(store, "0-Push").prescriptions[bench.id]).toBe("5 × 5");
  });

  it("empties one day without touching the rest of the week", () => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [bench], prescriptions: {}, settings: {} });
    store = commitDay(store, "1-Pull", { workout: [row], prescriptions: {}, settings: {} });
    store = clearDay(store, "0-Push");
    expect(hasDayContent(store, "0-Push")).toBe(false);
    expect(dayExerciseCount(store, "1-Pull")).toBe(1);
  });
});

describe("changing the training frequency", () => {
  const threeDayWeek = (): WeeklyDayStore => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [bench], prescriptions: { [bench.id]: "4 × 5" }, settings: { [bench.id]: settings("push") } });
    store = commitDay(store, "1-Pull", { workout: [row], prescriptions: { [row.id]: "3 × 10" }, settings: {} });
    store = commitDay(store, "2-Legs", { workout: [squat], prescriptions: { [squat.id]: "5 × 5" }, settings: {} });
    return store;
  };

  it("carries every saved day across a split whose labels all change, rather than orphaning the week", () => {
    const { store, moved } = remapDaysForFrequency(threeDayWeek(), splitDaysForFrequency(3), splitDaysForFrequency(4));
    expect(moved["2-Legs"]).toBe("2-Upper");
    expect(dayExerciseCount(store, "0-Upper")).toBe(1);
    expect(dayExerciseCount(store, "1-Lower")).toBe(1);
    expect(loadDay(store, "2-Upper").workout[0].name).toBe("Back Squat");
    expect(loadDay(store, "2-Upper").prescriptions[squat.id]).toBe("5 × 5");
    expect(loadDay(store, "0-Upper").settings[bench.id].notes).toBe("push");
    // Nothing is left behind under a key the week can no longer address.
    expect(Object.keys(store.plan).filter((key) => store.plan[key].length).sort()).toEqual(["0-Upper", "1-Lower", "2-Upper"]);
  });

  it("follows a surviving day label to its new position instead of handing its stack to a different day", () => {
    const store = commitDay(emptyDayStore(), "4-Sport Transfer", { workout: [squat], prescriptions: {}, settings: {} });
    const remapped = remapDaysForFrequency(store, splitDaysForFrequency(5), splitDaysForFrequency(6));
    expect(remapped.moved["4-Sport Transfer"]).toBe("5-Sport Transfer");
    expect(dayExerciseCount(remapped.store, "5-Sport Transfer")).toBe(1);
    expect(dayExerciseCount(remapped.store, "4-Lower")).toBe(0);
  });

  it("hides a day that no longer fits the week rather than deleting it, and restores it when the frequency goes back up", () => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [bench], prescriptions: {}, settings: {} });
    store = commitDay(store, "1-Pull", { workout: [row], prescriptions: {}, settings: {} });
    store = commitDay(store, "2-Legs", { workout: [squat], prescriptions: {}, settings: {} });

    const narrowed = remapDaysForFrequency(store, splitDaysForFrequency(3), splitDaysForFrequency(2)).store;
    expect(dayExerciseCount(narrowed, "0-Upper")).toBe(1);
    expect(dayExerciseCount(narrowed, "1-Lower")).toBe(1);
    // Day 03 has nowhere to live in a two-day week, so it is not shown...
    expect(Object.keys(visibleDayPlan(narrowed, splitDaysForFrequency(2)).plan)).toEqual(["0-Upper", "1-Lower"]);
    // ...but it was not thrown away either.
    expect(dayExerciseCount(narrowed, "2-Legs")).toBe(1);

    const widened = remapDaysForFrequency(narrowed, splitDaysForFrequency(2), splitDaysForFrequency(3)).store;
    expect(loadDay(widened, "2-Legs").workout[0].name).toBe("Back Squat");
  });

  it("leaves the week untouched when the split has not actually changed", () => {
    const store = threeDayWeek();
    const result = remapDaysForFrequency(store, splitDaysForFrequency(3), splitDaysForFrequency(3));
    expect(result.store).toBe(store);
    expect(result.moved).toEqual({});
  });

  it("never lets two saved days land on the same slot", () => {
    const store = threeDayWeek();
    for (const frequency of [1, 2, 4, 5, 6, 7]) {
      const { moved } = remapDaysForFrequency(store, splitDaysForFrequency(3), splitDaysForFrequency(frequency));
      const targets = Object.values(moved);
      expect(new Set(targets).size, `frequency ${frequency}`).toBe(targets.length);
    }
  });
});

describe("placing a pasted routine into the week", () => {
  it("gives two same-family pasted days separate slots instead of letting the second overwrite the first", () => {
    const { placements, unplacedLabels } = placeImportedDays(["Upper A", "Lower A", "Upper B", "Lower B"], splitDaysForFrequency(4));
    expect(placements.map((placement) => placement.slotIndex)).toEqual([0, 1, 2, 3]);
    expect(unplacedLabels).toEqual([]);
  });

  it("matches a pasted label to its split day, and fills the rest in pasted order", () => {
    const { placements } = placeImportedDays(["Legs", "Conditioning", "Chest & Arms"], splitDaysForFrequency(3));
    expect(placements.find((placement) => placement.pastedIndex === 0)?.slotIndex).toBe(2);
    expect(new Set(placements.map((placement) => placement.slotIndex)).size).toBe(3);
  });

  it("reports a pasted day that does not fit the week instead of silently dropping it onto the last slot", () => {
    const { placements, unplacedLabels } = placeImportedDays(["Push", "Pull", "Legs", "Arms", "Conditioning"], splitDaysForFrequency(3));
    expect(placements).toHaveLength(3);
    expect(placements.map((placement) => placement.slotIndex).sort()).toEqual([0, 1, 2]);
    expect(unplacedLabels).toEqual(["Arms", "Conditioning"]);
  });
});

describe("the weekly volume view of the week", () => {
  it("counts only the days the current split can address", () => {
    let store = commitDay(emptyDayStore(), "0-Push", { workout: [bench], prescriptions: { [bench.id]: "4 × 5" }, settings: {} });
    store = commitDay(store, "5-Sport Transfer", { workout: [squat], prescriptions: { [squat.id]: "3 × 8" }, settings: {} });
    const visible = visibleDayPlan(store, splitDaysForFrequency(3));
    expect(Object.keys(visible.plan)).toEqual(["0-Push"]);
    expect(visible.prescriptions["0-Push"][bench.id]).toBe("4 × 5");
  });
});
