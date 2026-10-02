import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { getExerciseSettings, getGoalPrescription } from "@/lib/workoutPlanner";
import { displayPrescription } from "@/lib/setPrescription";
import { buildWorkoutExport, exportFileName, exportTitle, shareMessage, workoutSummaryText } from "./workoutExport";

const byName = (name: string) => exercises.find((exercise) => exercise.name === name) as Exercise;
const pull = ["Wide-Grip Cable Lat Pulldown", "Machine Low Row", "Chest-Supported Dumbbell Row", "Face Pull", "Neutral-Grip Pull-Up", "Barbell Curl", "Bent-Over Rear-Delt Fly", "Hammer Curl"].map(byName);
const labels: Record<string, string> = { lats: "Latissimus dorsi", upperBack: "Upper back", rearDelts: "Posterior deltoid", traps: "Trapezius", biceps: "Biceps brachii", brachialis: "Brachialis" };

/** Built the way Home builds it: the Plan row's own prescription and settings expressions. */
function build(prescriptions: Record<number, string> = {}, settings: Record<number, { rpe?: string; rest: string; notes: string; completed: boolean }> = {}) {
  return buildWorkoutExport({
    workout: pull, week: 1, dayOrdinal: "Day 02", dayName: "Pull", sport: "Wrestling", goal: "Athleticism",
    prescriptionFor: (exercise, index) => prescriptions[exercise.id] || getGoalPrescription("Athleticism", index),
    settingsFor: (exercise) => getExerciseSettings(settings, exercise.id),
    muscleLabel: (key) => labels[key] || key,
    now: new Date("2026-10-02T15:00:00Z"),
  });
}

/**
 * Oct 2 brief §5–14: one model behind the PDF, the share note and the copied
 * summary, made from the same values the Plan rows print, in the same order.
 */
describe("the exported training day", () => {
  it("carries the rows' own values, in the rows' order", () => {
    const plan = build({ [pull[0].id]: "4 × 3-6" }, { [pull[0].id]: { rpe: "RPE 8", rest: "120 sec", notes: "Pause at the top", completed: false } });
    expect(plan.exercises.map((exercise) => exercise.name)).toEqual(pull.map((exercise) => exercise.name));
    expect(plan.exercises[0]).toMatchObject({ order: 1, prescription: displayPrescription("4 × 3-6"), rpe: "RPE 8", rest: "120 sec", notes: "Pause at the top", movement: "Vertical pull", muscles: ["Latissimus dorsi", "Upper back"] });
    // An exercise with nothing saved shows what its row shows: the goal's default and the default settings.
    expect(plan.exercises[1]).toMatchObject({ prescription: displayPrescription(getGoalPrescription("Athleticism", 1)), rpe: getExerciseSettings({}, pull[1].id).rpe, rest: getExerciseSettings({}, pull[1].id).rest });
    expect(plan.exercises[0].tracking).toHaveLength(4);
  });

  it("names the file and the document after the day, never with a random id", () => {
    const plan = build();
    expect(exportFileName(plan)).toBe("Sports Genome - Week 1 Pull.pdf");
    expect(exportTitle(plan)).toBe("Sports Genome · Week 1 · Pull");
    expect(exportFileName({ ...plan, dayName: "Push/Pull: A?" })).toBe("Sports Genome - Week 1 Push Pull A.pdf");
  });

  it("sends a short note with the PDF, not the workout itself", () => {
    const note = shareMessage(build(), { attached: true });
    expect(note).toBe("Week 1 · Pull — Sports Genome\n8 exercises · Wrestling · Athleticism\nFull workout attached.");
    expect(note.split("\n").length).toBeLessThanOrEqual(3);
    for (const exercise of pull) expect(note).not.toContain(exercise.name);
  });

  it("copies a plain-text summary with the app's numbering and nothing from the screen's controls", () => {
    const text = workoutSummaryText(build());
    expect(text.startsWith("SPORTS GENOME\nWeek 1 · Day 02 · Pull\nWrestling · Athleticism\n\n01 Wide-Grip Cable Lat Pulldown\n")).toBe(true);
    expect(text).toContain("08 Hammer Curl");
    expect(text).toContain("Latissimus dorsi · Upper back");
    for (const control of ["Edit sets", "Add", "Done", "Search", "Reorder", "undefined", "null"]) expect(text).not.toContain(control);
    // Every line is a heading, a numbered exercise, its dose, or its muscles: no ids, labels or controls.
    const allowed = [/^SPORTS GENOME$/, /^Week \d+ · Day \d+ · .+$/, /^Wrestling · Athleticism$/, /^\d{2} [A-Z].+$/, /^\d+ × [^·]+ · RPE \d+ · \d+ sec$/, /^[A-Z][a-z]+( [a-z]+)?( · [A-Z][a-z]+( [a-z]+)?)*$/, /^$/];
    for (const line of text.split("\n")) expect(allowed.some((pattern) => pattern.test(line)), line).toBe(true);
  });
});
