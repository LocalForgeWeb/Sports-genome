import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval } from "@shared/specialization/time";
import type { ExposureBout } from "@shared/specialization/types";
import { adapterNotesFor, boutsFromSessions, excludedRecordsFromSessions } from "./bouts";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { exercise, finished, workSet } from "./__fixtures__/syntheticForearm";

/**
 * The two lists "How this is counted" names once on every region's page (11-forearm-research-and-stack.md
 * §7.1), from the adapter and never from a summary: sets the app could not identify, and a set id
 * that arrived twice with different values. The package's Example C and the duplicate half of B.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const deps = { catalog: exercises, fallbackUnit: "kg" as const };
const WEEK = calendarWeekInterval(NOW, "Europe/London");

describe("adapterNotesFor", () => {
  it("lists a set the app could not identify, by the name logged, and no page counts it (Example C)", () => {
    const sessions = [finished("s1", "2026-10-14T18:00:00.000Z", [
      exercise("e1", "Barbell wrist roll", undefined, [workSet({ id: "x1" })]),
      exercise("e2", "Wrist Curl", undefined, [workSet({ id: "n1" })]),
      exercise("e3", "Barbell wrist roll", undefined, [workSet({ id: "x2", warmup: true }), workSet({ id: "x3", completed: false, skipped: true })]),
    ])];
    const bouts = [...boutsFromSessions(sessions, deps), ...excludedRecordsFromSessions(sessions, deps)];
    const notes = adapterNotesFor(bouts, WEEK);
    // The exact-name match (Wrist Curl) is identified; the warm-up and the skipped set are not work.
    expect(notes.unidentified).toEqual([{ exerciseName: "Barbell wrist roll", sets: 1, boutIds: ["x1"] }]);
    expect(notes.conflictingDuplicates).toEqual([]);
    const summary = getSpecializationSummary({ region: forearmRegionData, bouts: bouts.filter((bout) => bout.id === "x1"), interval: WEEK, side: "both", mode: "completed", goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });
    expect(summary.completeness.boutsConsidered).toBe(0);
    expect(summary.regionDistinctBouts).toBe(0);
  });

  it("lists a set id that arrived twice with different values once, the first counted; the same set twice is not listed", () => {
    const first = boutsFromSessions([finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "One-Arm Dumbbell Wrist Curl", 410, [workSet({ id: "d1", reps: "12" }), workSet({ id: "same" })])])], deps);
    const copy = boutsFromSessions([finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "One-Arm Dumbbell Wrist Curl", 410, [workSet({ id: "d1", reps: "15" }), workSet({ id: "same" })])])], deps);
    const reordered: ExposureBout[] = copy.map((bout) => Object.fromEntries(Object.entries(bout).reverse()) as ExposureBout);
    const notes = adapterNotesFor([...first, ...reordered]);
    expect(notes.conflictingDuplicates).toEqual([{ boutId: "d1", exerciseName: "One-Arm Dumbbell Wrist Curl", copies: 2 }]);
    expect(notes.unidentified).toEqual([]);
    // The calculator reads the first record of each id, as before.
    const summary = getSpecializationSummary({ region: forearmRegionData, bouts: [...first, ...reordered], interval: WEEK, side: "both", mode: "completed", goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });
    expect(summary.nodes.find((node) => node.nodeId === "forearm.fcr")!.directDynamicReps).toBe(24);
  });

  it("keeps to the window when one is given", () => {
    const bouts = boutsFromSessions([
      finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "Rice bucket", undefined, [workSet({ id: "in" })])]),
      finished("s0", "2026-10-01T18:00:00.000Z", [exercise("e1", "Rice bucket", undefined, [workSet({ id: "out" })])]),
    ], deps);
    expect(adapterNotesFor(bouts, WEEK).unidentified).toEqual([{ exerciseName: "Rice bucket", sets: 1, boutIds: ["in"] }]);
    expect(adapterNotesFor(bouts).unidentified[0].sets).toBe(2);
  });
});
