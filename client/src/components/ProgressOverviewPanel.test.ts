import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProgressOverviewPanel.tsx", import.meta.url), "utf8");

describe("Progress overview", () => {
  it("summarizes saved session and observation records, merged with tracker history, without invented performance outcomes", () => {
    expect(source).toContain("trpc.workoutLog.list.useQuery()");
    expect(source).toContain("trpc.strengthGenome.observations.useQuery()");
    expect(source).toContain("trpc.workoutLog.progressionHistory.useQuery()");
    // Account observations, lifts saved on this device, and finished tracker
    // workouts are one record here — counting only the server's rows showed a
    // device athlete zero lifts under a list of completed sessions.
    expect(source).toContain("mergeStrengthHistory(loggedObservations.map(");
    // Read at each session's own date against the weight log, the way the
    // Strength Genome reads them, so both screens stamp a lift with one weight.
    expect(source).toContain("workoutStrengthObservations(deviceSessions, weightUnit, bodyWeightLog)");
    expect(source).toContain("loadDeviceStrengthObservations()");
    expect(source).toContain("{loggedObservations.length}");
    expect(source).toContain("loadDeviceWorkoutSessions()");
    expect(source).toContain("deviceWorkoutHistoryEvent");
    expect(source).toContain('status === "completed"');
    expect(source).toContain("completedSetCount");
    expect(source).toContain("Your completed sessions.");
    expect(source).toContain("b.completedAt.getTime() - a.completedAt.getTime()");
    expect(source).toContain('session.storage === "device" ? "Device" : "Account"');
    expect(source).toContain("No comparable history yet.");
    expect(source).toContain("summarizeWithinAthleteStrengthComparisons(unifiedHistory)");
    expect(source).toContain("Estimated change since your first log");
    expect(source).toContain("tracks you against your own past only — never against anyone else");
    expect(source).toContain("Epley formula");
    expect(source).toContain("outside the validated rep range for estimation");
    expect(source).not.toContain("readiness score");
    expect(source).not.toContain("Personal record");
  });
});

/**
 * The engine, the curves and the card copy were wired to one screen: the Strength
 * Genome's record sheet, one lift at a time, after a Review tap. The Progress section
 * computed a trend for every lift and never asked where any of them sat.
 */
describe("Progress places each trend's latest lift on the community curves", () => {
  const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

  it("asks the same route the record sheet asks, for every trend at once", () => {
    expect(source).toContain("trpc.strengthPercentile.forLifts.useQuery(");
    expect(source).toContain("liftsToPlace(comparableStrengthChanges.slice(0, 4), unifiedHistory, bodyMassKgById, { sex: percentileSex, fallbackBodyMassKg })");
    // Nothing to ask without a lift, and the route would only answer `load_required`.
    expect(source).toContain("enabled: liftsForPercentile.length > 0");
  });

  it("puts the placement on the trend's own card, and says when the weight is borrowed", () => {
    expect(source).toContain("placements.cards.get(trendKey(change))");
    expect(source).toContain('<em className="progress-percentile"><b>{placement.headline}</b> {placement.detail}');
    expect(source).toContain('placement.bodyMassSource === "profile" ? " Read against your profile weight." : ""');
  });

  it("asks once for the one input that would unlock placements, and names the strongest", () => {
    expect(source).toContain('{placements.gap && <p className="progress-percentile-gap">{placements.gap}</p>}');
    expect(source).toContain("Strongest placement: {placements.best.headline} · {placements.best.exerciseName}.");
  });

  it("keeps the two readings distinct in the method note", () => {
    expect(source).toContain("The change tracks you against your own past only — never against anyone else.");
    expect(source).toContain("Where a lift sits is a separate reading");
  });

  it("is given the athlete's sex and profile weight by the page, the way the Strength Genome is", () => {
    expect(home).toContain("<ProgressOverviewPanel onOpenStrength={() => navigateWorkspace(\"strength\")} onOpenTraining={() => navigateWorkspace(\"day-plan\")} sexForReference={athleteBaseline.sexForReference} baselineBodyWeight={athleteBaseline.bodyWeight} weightUnit={athleteBaseline.weightUnit} />");
  });
});
