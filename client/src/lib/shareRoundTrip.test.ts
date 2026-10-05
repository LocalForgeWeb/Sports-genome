import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { parseRoutine } from "@/components/StackImportPanel";
import { buildWorkoutExport, workoutSummaryText } from "@/lib/workoutExport";
import { buildShareSnapshot, type ShareSource } from "@/lib/shareSnapshot";
import { draftDaysFromSnapshot, storedPrescription, writeIncomingDay } from "@/lib/planImport";
import { readSharedWorkoutText } from "@/lib/sharedWorkoutText";
import { shareSnapshotText } from "@shared/workoutShareFormat";
import type { DayRecord } from "@/lib/trainingDayPlan";

const named = (pattern: RegExp, skip = 0) => exercises.filter((exercise) => pattern.test(exercise.name))[skip]!;
const bench = named(/^barbell bench press$/i) ?? named(/bench press/i);
const row = named(/row/i);
const squat = named(/squat/i);
const plank = named(/plank/i);
const curl = named(/curl/i);

const source: ShareSource = {
  week: 2, sport: "Wrestling", goal: "Strength", activeIndex: 0,
  days: [
    { key: "0-Upper", index: 0, ordinal: "Day 01", label: "Upper", exercises: [
      { exercise: bench, prescription: "4 × 3–6", prescriptionIsDefault: false, rpe: "RPE 8", rest: "120 sec", notes: "Pause on the chest · 1 sec" },
      { exercise: row, prescription: "3 × 10/8/6", prescriptionIsDefault: false, rpe: "RPE 7" },
      { exercise: curl, prescription: "3 × 8–12", prescriptionIsDefault: true },
    ] },
    { key: "1-Lower", index: 1, ordinal: "Day 02", label: "Lower", exercises: [
      { exercise: squat, prescription: "5 × 5", prescriptionIsDefault: false, rest: "3 min" },
      { exercise: plank, prescription: "3 × 30–45 sec", prescriptionIsDefault: false },
    ] },
  ],
};
const weekSnapshot = buildShareSnapshot(source, { scope: "week", title: "Week 2 · Upper, Lower", description: "Heavy week.\nDeload next.", attribution: "Coach Sam", includeNotes: true })!;
const empty: DayRecord = { workout: [], prescriptions: {}, settings: {}, context: [] };

/**
 * The user's ask on Oct 4: copy a workout out of Sports Genome and paste it into a plan,
 * and get exactly that workout - every exercise, in order, with its own sets and reps,
 * RPE, rest and note. Before this, a pasted copy lost every prescription to "3 × 8–12"
 * and turned each muscle line into a day of its own.
 */
describe("copy as text, then paste into a plan", () => {
  const text = shareSnapshotText(weekSnapshot, "https://example.app/s/AbCdEfGhIjKlMnOpQrStUv");

  it("writes one readable line per exercise under its day", () => {
    expect(text.split("\n").slice(0, 4)).toEqual(["Week 2 · Upper, Lower", "Shared from Sports Genome · 2 days · 5 exercises", "By Coach Sam", "Heavy week. Deload next."]);
    expect(text).toContain(`Day 1 · Upper\n1. ${bench.name} — 4 × 3–6 · RPE 8 · Rest 120 sec · Note: Pause on the chest · 1 sec`);
    expect(text).toContain(`Day 2 · Lower\n1. ${squat.name} — 5 × 5 · Rest 3 min\n2. ${plank.name} — 3 × 30–45 sec`);
    expect(text.endsWith("Open it or save a copy: https://example.app/s/AbCdEfGhIjKlMnOpQrStUv")).toBe(true);
  });

  it("reads back as the same days, exercises, order and prescriptions", () => {
    const routine = parseRoutine(text, {});
    expect(routine.source).toBe("sports-genome");
    expect(routine.title).toBe("Week 2 · Upper, Lower");
    expect(routine.unmatched).toEqual([]);
    expect(routine.days.map((day) => day.label)).toEqual(["Upper", "Lower"]);
    const got = routine.days.map((day) => day.items.map((item) => ({ id: item.exercise.id, prescription: item.prescription, rpe: item.rpe, rest: item.rest, notes: item.notes })));
    expect(got).toEqual([
      [
        { id: bench.id, prescription: "4 × 3–6", rpe: "RPE 8", rest: "120 sec", notes: "Pause on the chest · 1 sec" },
        { id: row.id, prescription: storedPrescription("3 × 10/8/6"), rpe: "RPE 7", rest: undefined, notes: undefined },
        { id: curl.id, prescription: "3 × 8–12", rpe: undefined, rest: undefined, notes: undefined },
      ],
      [
        { id: squat.id, prescription: "5 × 5", rpe: undefined, rest: "3 min", notes: undefined },
        { id: plank.id, prescription: "3 × 30–45 sec", rpe: undefined, rest: undefined, notes: undefined },
      ],
    ]);
  });

  it("lands in a day exactly as written, with nothing filled in that the copy didn't say", () => {
    const routine = parseRoutine(text, {});
    const lower = writeIncomingDay(empty, { label: "Lower", items: routine.days[1].items }, "append").record;
    expect(lower.workout.map((exercise) => exercise.id)).toEqual([squat.id, plank.id]);
    expect(lower.prescriptions).toEqual({ [squat.id]: "5 × 5", [plank.id]: "3 × 30–45 sec" });
    // The squat's rest was given; its RPE was not, so it gets the app's own default like any new row. The plank had neither.
    expect(lower.settings[squat.id]).toMatchObject({ rest: "3 min", notes: "" });
    expect(lower.settings[plank.id]).toBeUndefined();
  });

  it("survives what message apps do to a paste: CRLF line ends, non-breaking spaces, extra blank lines", () => {
    const mangled = text.replace(/\n/g, "\r\n").replace(/ — /g, " — ").replace(/\r\n\r\n/g, "\r\n\r\n\r\n");
    const routine = parseRoutine(mangled, {});
    expect(routine.days.map((day) => day.items.length)).toEqual([3, 2]);
    expect(routine.days[0].items[0].prescription).toBe("4 × 3–6");
  });

  it("keeps an exercise this catalog doesn't hold by its name and prescription, for the athlete to resolve", () => {
    const routine = parseRoutine(text.replace(plank.name, "Towel Grip Dead Hang"), {});
    expect(routine.days[1].items).toHaveLength(1);
    expect(routine.days[1].unmatched).toEqual([expect.objectContaining({ name: "Towel Grip Dead Hang", prescription: "3 × 30–45 sec" })]);
  });

  it("reads just the exercise lines, copied without the header, through the general reader", () => {
    const lines = text.split("\n").filter((line) => /^\d+\. /.test(line)).slice(0, 2).join("\n");
    const routine = parseRoutine(lines, {});
    const items = routine.days.flatMap((day) => day.items);
    expect(items.map((item) => item.exercise.id)).toEqual([bench.id, row.id]);
    expect(items[0].prescription).toBe("4 × 3–6");
    expect(items[0].rpe).toBe("RPE 8");
  });

  it("reads a copy made before this change without losing its prescriptions or inventing days from muscle lines", () => {
    const plan = buildWorkoutExport({
      workout: [bench, row, squat], week: 1, dayOrdinal: "Day 02", dayName: "Pull", sport: "Wrestling", goal: "Athleticism",
      prescriptionFor: (exercise) => (exercise.id === squat.id ? "5 × 5" : "4 × 3–6"), settingsFor: () => ({ rpe: "RPE 7", rest: "90 sec", notes: "" }), muscleLabel: (key) => key, now: new Date("2026-10-02T15:00:00Z"),
    });
    const legacy = workoutSummaryText(plan);
    expect(readSharedWorkoutText(legacy)?.days).toHaveLength(1);
    const routine = parseRoutine(legacy, {});
    expect(routine.days).toHaveLength(1);
    expect(routine.days[0].label).toBe("Pull");
    expect(routine.days[0].items.map((item) => [item.exercise.id, item.prescription, item.rpe, item.rest])).toEqual([
      [bench.id, "4 × 3–6", "RPE 7", "90 sec"], [row.id, "4 × 3–6", "RPE 7", "90 sec"], [squat.id, "5 × 5", "RPE 7", "90 sec"],
    ]);
  });

  it("gives a pasted line with no sets and reps no prescription, rather than one nobody wrote", () => {
    const routine = parseRoutine(`Upper\n${bench.name}\n${row.name} 3x10`, {});
    const items = routine.days.flatMap((day) => day.items);
    expect(items.find((item) => item.exercise.id === bench.id)?.prescription).toBe("");
    expect(items.find((item) => item.exercise.id === row.id)?.prescription).toBe("3 × 10");
  });
});

describe("saving into a plan", () => {
  const existing: DayRecord = { workout: [bench, curl], prescriptions: { [bench.id]: "5 × 5" }, settings: {}, context: [] };

  it("adds after what is planned by default, keeping the day's own rows and prescriptions, and not adding a duplicate", () => {
    const outcome = writeIncomingDay(existing, { label: "Upper", items: [{ exercise: bench, prescription: "4 × 3–6" }, { exercise: row, prescription: "3 × 10" }] }, "append");
    expect(outcome.record.workout.map((exercise) => exercise.id)).toEqual([bench.id, curl.id, row.id]);
    expect(outcome.record.prescriptions).toEqual({ [bench.id]: "5 × 5", [row.id]: "3 × 10" });
    expect(outcome.added.map((exercise) => exercise.id)).toEqual([row.id]);
    expect(outcome.alreadyThere.map((exercise) => exercise.id)).toEqual([bench.id]);
  });

  it("replaces only when asked, and then holds just the incoming day", () => {
    const outcome = writeIncomingDay(existing, { label: "Upper", items: [{ exercise: row, prescription: "3 × 10", rpe: "RPE 9" }] }, "replace");
    expect(outcome.record.workout.map((exercise) => exercise.id)).toEqual([row.id]);
    expect(outcome.record.prescriptions).toEqual({ [row.id]: "3 × 10" });
    expect(outcome.record.settings[row.id]).toMatchObject({ rpe: "RPE 9", notes: "", completed: false });
  });

  it("finds a shared exercise by its catalog id even when the name it was shared under has changed", () => {
    const snapshot = { ...weekSnapshot, days: [{ ...weekSnapshot.days[0], exercises: [{ ...weekSnapshot.days[0].exercises[0], name: "Old name for the bench" }] }] };
    const [day] = draftDaysFromSnapshot(snapshot);
    expect(day.items.map((item) => item.exercise.id)).toEqual([bench.id]);
    expect(day.items[0]).toMatchObject({ prescription: "4 × 3–6", rpe: "RPE 8", rest: "120 sec", notes: "Pause on the chest · 1 sec" });
  });

  it("keeps a shared exercise this catalog lacks, by name, with candidates - never dropped or swapped silently", () => {
    const snapshot = { ...weekSnapshot, days: [{ ...weekSnapshot.days[0], exercises: [{ order: 1, catalogId: 999999, name: "Barbell Bench Press Variant X", prescription: "4 × 6" }] }] };
    const [day] = draftDaysFromSnapshot(snapshot);
    expect(day.items).toEqual([]);
    expect(day.unresolved[0]).toMatchObject({ name: "Barbell Bench Press Variant X", prescription: "4 × 6" });
    expect(day.unresolved[0].candidates.length).toBeGreaterThan(0);
  });
});
