// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Strength record's hierarchy (Sep 30 brief §6): the region's rank with the lifts behind
 * it, then the lift on show with its own comparison row, its own progress and its own ratio,
 * kept apart and switched together.
 */

type QueryResult = { data?: unknown; isPending?: boolean; isFetching?: boolean; fetchStatus?: string; isPlaceholderData?: boolean; isError?: boolean };
type RankInput = { sex: string | null; lifts: { exerciseName: string; bodyMassKg: number | null }[] };
type RankOptions = { enabled?: boolean; placeholderData?: unknown };

const mocks = vi.hoisted(() => ({
  feedback: vi.fn(),
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  // Each answers for its own request, set per case.
  forLift: vi.fn<(input: { exerciseName: string | null }) => QueryResult>(),
  ranks: vi.fn<(input: RankInput, options?: RankOptions) => QueryResult>(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: { forLift: { useQuery: (input: { exerciseName: string | null }) => mocks.forLift(input) } },
    strengthProfile: { muscleRanks: { useQuery: (input: RankInput, options?: RankOptions) => mocks.ranks(input, options) } },
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    repair: { deleteStrengthObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { regions: [], athleteConfirmedPriorityRegionIds: [], nextAction: "Add a result" } }) },
      observations: { useQuery: () => ({ data: [] }) },
      priorities: { useQuery: () => ({ data: [] }) },
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: mocks.feedback }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deviceStrengthObservationEvent, deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { bodyWeightLogKey } from "@/lib/bodyWeightLog";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

/** The recording's case: a Bench-driven Chest rank, and two Pec Deck logs (40 x 10, then 50 x 10). */
const bench = { id: "device-bench", exerciseName: "Barbell Bench Press", observedAt: "2026-09-12T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 100, repetitions: 5, bodyMassKgAtTest: 80 };
const pecDeckFirst = { id: "device-pec-1", exerciseName: "Pec Deck Fly", observedAt: "2026-09-01T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 40, repetitions: 10 };
const pecDeckLatest = { id: "device-pec-2", exerciseName: "Pec Deck Fly", observedAt: "2026-09-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 50, repetitions: 10 };

// As the route answers: a muscle is aggregated only from exercises that placed, so Pec Deck,
// with no comparison curve, is in `unranked` and never in the evidence.
const chestMuscle = {
  muscleId: "m1", canonicalName: "pectoralis_major_sternocostal", name: "Pectoralis major (sternal)", percentile: 84.2, confidence01: 0.62, evidenceCount: 1, movementPatternCount: 1,
  evidence: [{ exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 86 }],
  referenceGroups: [{ label: "Strength Level lifters", sex: "male" }],
};
const scored = { status: "ok", muscles: [chestMuscle], unranked: [{ exerciseName: "Pec Deck Fly", reason: "missing_percentile" }], ageAdjustment: { applied: 0, outsideTable: 0, noAge: 1 } };
const settled = (data: unknown): QueryResult => ({ data, isPending: false, isFetching: false, fetchStatus: "idle", isPlaceholderData: false });

const benchPlaced = {
  status: "resolved", percentile: 63, observedValue: 1.41, unit: "x_bodyweight",
  ageAdjustment: { status: "not_applied", reason: "age_missing", ageYears: null },
  estimate: { valueKg: 112.5, basis: "estimated", confidence: 0.65, effectiveReps: 5, repsInReserve: null },
  confidence: 0.65, scoringVersion: "strength_beta_v1", route: "beta_community_curve", normalizationMethod: "direct_community_relative_1rm_percentile",
  sourceRole: "beta_fallback", exerciseId: "uuid-bench", aliasOfExerciseId: null, borrowedCurve: false,
};
const answerByLift = (input: { exerciseName: string | null }): QueryResult =>
  settled(input.exerciseName === "Pec Deck Fly" ? { status: "unavailable", reason: "no_curve_for_exercise" } : benchPlaced);

/**
 * The rank query the way TanStack v5 runs it when the request changes: the answer for the request
 * it last settled, and for any other request whatever the placeholderData option makes of that
 * answer - handed to a disabled query too - until `answer()` lets the current request settle.
 */
function rankQuery(answerFor: (input: RankInput) => unknown = () => scored) {
  let last: { key: string; input: RankInput; data: unknown } | null = null;
  let answerNext = true;
  const query = (input: RankInput, options?: RankOptions): QueryResult => {
    const key = JSON.stringify(input);
    const enabled = options?.enabled !== false;
    if (last?.key === key) return settled(last.data);
    if (answerNext && enabled) {
      answerNext = false;
      last = { key, input, data: answerFor(input) };
      return settled(last.data);
    }
    const placeholder = typeof options?.placeholderData === "function"
      ? (options.placeholderData as (previous: unknown, query: { queryKey: unknown[] }) => unknown)(last?.data, { queryKey: [["strengthProfile", "muscleRanks"], { input: last?.input, type: "query" }] })
      : options?.placeholderData;
    const fetchStatus = enabled ? "fetching" : "idle";
    return placeholder === undefined
      ? { data: undefined, isPending: true, isFetching: enabled, fetchStatus, isPlaceholderData: false }
      : { data: placeholder, isPending: false, isFetching: enabled, fetchStatus, isPlaceholderData: true };
  };
  return { query, answer: () => { answerNext = true; } };
}

function renderPanel(observations: object[], props: Record<string, unknown> = {}) {
  localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(observations));
  const panelProps = { directAccess: true, weightUnit: "kg", sexForReference: "male", baselineBodyWeight: 80, ...props };
  const view = render(React.createElement(StrengthGenomePanel, panelProps));
  return { ...view, rerenderWith: (next: Record<string, unknown>) => view.rerender(React.createElement(StrengthGenomePanel, { ...panelProps, ...next })) };
}

function openChest() {
  fireEvent.click(within(screen.getByRole("group", { name: "Strength Genome regions" })).getByRole("button", { name: /^Chest,/ }));
  return screen.getByRole("region", { name: "Chest recorded strength context" });
}

const row = (record: HTMLElement, name: "comparison" | "progress" | "ratio") => record.querySelector<HTMLElement>(`[data-lift-row="${name}"]`)!;
const rankSection = (record: HTMLElement) => within(record).getByRole("region", { name: "Chest rank" });
const liftSection = (record: HTMLElement, lift: string) => within(record).getByRole("region", { name: lift });

describe("the Strength record keeps the region's rank and the lift on show apart", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    mocks.forLift.mockReset().mockImplementation(answerByLift);
    mocks.ranks.mockReset().mockReturnValue(settled(scored));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("names the lift behind the region's rank, with its date, load and reps and what it was read against", () => {
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    const rank = rankSection(openChest());
    expect(within(rank).getByText("84th percentile")).toBeTruthy();
    const provenance = rank.querySelector("[data-rank-provenance]")!;
    expect(within(provenance as HTMLElement).getByText("Barbell Bench Press")).toBeTruthy();
    expect(provenance.textContent).toContain("86th percentile on its own");
    const liftLine = provenance.querySelector(".rank-provenance-lift")?.textContent ?? "";
    expect(liftLine).toMatch(/^100 kg × 5 · Sep 12(, 2026)? · read against 80 kg, recorded with the lift$/);
    // One lift was sent for the bench, so there is no "best of".
    expect(provenance.textContent).not.toMatch(/Best of/);
    // The region's lift the ranks left out is named as not counted, with the route's reason.
    // Read from `unranked` now: the route never puts an unplaced exercise in a muscle's evidence.
    expect(provenance.querySelector("[data-rank-not-counted]")?.textContent).toBe("Not counted: Pec Deck Fly (no comparison group for this lift yet).");
  });

  it("opens on the lift that produced the rank, not the most relevant unranked one", () => {
    const { container } = renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    const record = openChest();
    expect(container.querySelector(".strength-region-record-lift")?.textContent).toMatch(/^Barbell Bench Press · /);
    expect((within(record).getByLabelText("Which lift to show") as HTMLSelectElement).value).toBe("device-bench");
    const lift = liftSection(record, "Barbell Bench Press");
    expect(within(row(lift, "comparison")).getByText("63rd percentile")).toBeTruthy();
    expect(row(lift, "comparison").textContent).toContain("Counts toward the Chest rank.");
  });

  it("says each lift sent for an exercise was considered when more than one was, since only the best counts", () => {
    // The best relative and the best absolute bench are different lifts, so both are sent.
    const light = { ...bench, id: "device-bench-light", loadKg: 90, bodyMassKgAtTest: 70 };
    const heavy = { ...bench, id: "device-bench-heavy", loadKg: 100, bodyMassKgAtTest: 95, observedAt: "2026-08-01T12:00:00.000Z" };
    renderPanel([light, heavy]);
    const record = openChest();
    expect(within(rankSection(record)).getByText("Best of 2 lifts:")).toBeTruthy();
    const line = "One of 2 lifts considered for the Chest rank; the best of them counts.";
    expect(row(liftSection(record, "Barbell Bench Press"), "comparison").textContent).toContain(line);
    fireEvent.change(within(record).getByLabelText("Which lift to show"), { target: { value: "device-bench-heavy" } });
    expect(row(liftSection(record, "Barbell Bench Press"), "comparison").textContent).toContain(line);
    expect(record.textContent).not.toContain("Counts toward the Chest rank.");
  });

  it("says nothing about a lift's part in the rank when the rank's exercises cannot be traced to the lifts sent", () => {
    mocks.ranks.mockReturnValue(settled({ ...scored, muscles: [{ ...chestMuscle, evidence: [{ exerciseName: "Machine Chest Press", role: "primary", exercisePercentile: 86 }] }] }));
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    const record = openChest();
    expect(within(rankSection(record)).getByText("84th percentile")).toBeTruthy();
    expect(record.textContent).not.toMatch(/Counts toward|Not part of|considered for the Chest rank/);
  });

  it("shows an unranked lift's own row and its estimated progress, never as a rating or a confirmed change", () => {
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    const record = openChest();
    fireEvent.change(within(record).getByLabelText("Which lift to show"), { target: { value: "device-pec-2" } });
    const lift = liftSection(record, "Pec Deck Fly");

    const comparison = row(lift, "comparison");
    expect(within(comparison).getByText("Comparison rank for this lift")).toBeTruthy();
    expect(within(comparison).getByText("No comparison rank available for this lift")).toBeTruthy();
    expect(within(comparison).getByText("No comparison data for Pec Deck Fly yet.")).toBeTruthy();
    expect(comparison.textContent).toContain("Not part of the Chest rank.");

    const progress = row(lift, "progress");
    expect(within(progress).getByText("Your progress on this lift")).toBeTruthy();
    expect(progress.querySelector(".strength-lift-value")?.textContent).toBe("Estimated 1RM change +25%");
    expect(within(progress).getByText("Larger change (15% or more)")).toBeTruthy();
    expect(progress.querySelector(".strength-lift-points")?.textContent).toMatch(/^53 kg \(.+\) → 67 kg \(.+\) · 2 logs$/);

    // The ratio is its own fact, with the weight it was read against and where that came from.
    const ratio = row(lift, "ratio");
    expect(within(ratio).getByText("Load lifted: 0.63× your profile weight — for your own context, not a rank.")).toBeTruthy();
    expect(within(ratio).getByText("80 kg, your current profile weight. This ratio moves if you change it.")).toBeTruthy();

    expect(record.textContent).not.toMatch(/Your rating|Confirmed|No ranking for this lift/);
  });

  it("switches every value and sentence together when another lift is picked", () => {
    const { container } = renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    const record = openChest();
    // On the bench: its percentile, one log so far, its own saved weight.
    expect(within(record).getByText("63rd percentile")).toBeTruthy();
    expect(within(record).getByText(/^One log so far: estimated 1RM 113 kg on Sep 12(, 2026)?\. Log it again to see your progress\.$/)).toBeTruthy();
    expect(within(record).getByText("Load lifted: 1.25× your body weight on that day — for your own context, not a rank.")).toBeTruthy();

    fireEvent.change(within(record).getByLabelText("Which lift to show"), { target: { value: "device-pec-2" } });

    // One render later nothing of the bench is left: header, title, rows and notes all moved.
    expect(container.querySelector(".strength-region-record-lift")?.textContent).toMatch(/^Pec Deck Fly · /);
    expect(within(record).queryByRole("region", { name: "Barbell Bench Press" })).toBeNull();
    expect(within(record).queryByText("63rd percentile")).toBeNull();
    expect(within(record).queryByText(/One log so far/)).toBeNull();
    expect(within(record).queryByText(/1\.25×/)).toBeNull();
    expect(within(record).queryByText("Counts toward the Chest rank.")).toBeNull();
    expect(within(record).getByText("No comparison rank available for this lift")).toBeTruthy();
    expect(row(liftSection(record, "Pec Deck Fly"), "progress").textContent).toContain("+25%");
    // The region's rank does not move with the lift.
    expect(within(rankSection(record)).getByText("84th percentile")).toBeTruthy();
  });

  it("does not call a lift logged twice 'one log so far' when only one of its logs can be estimated", () => {
    // 25 x 20 is past the reps an estimated 1RM is read from, so there is no trend to show.
    const pecDeckHighReps = { ...pecDeckLatest, loadKg: 25, repetitions: 20 };
    renderPanel([bench, pecDeckFirst, pecDeckHighReps]);
    const record = openChest();
    fireEvent.change(within(record).getByLabelText("Which lift to show"), { target: { value: "device-pec-1" } });
    const progress = row(liftSection(record, "Pec Deck Fly"), "progress");
    expect(progress.textContent).toMatch(/^Your progress on this liftOnly one of your 2 logs of this lift can be turned into an estimated 1RM \(sets over 15 reps, or without a weight, are not\), so there is no progress line yet\. This one: estimated 1RM 53 kg on Sep 1(, 2026)?\.$/);
    expect(progress.textContent).not.toMatch(/One log so far/);
  });

  it("names a weight from the log by its date, never as what was weighed that week", () => {
    // The log's last entry before the lift is six weeks older than it.
    localStorage.setItem(bodyWeightLogKey, JSON.stringify([{ bodyMassKg: 82, enteredUnit: "kg", observedAt: "2026-08-01T12:00:00.000Z", source: "athlete_entry" }]));
    renderPanel([{ ...bench, bodyMassKgAtTest: undefined }]);
    const ratio = row(liftSection(openChest(), "Barbell Bench Press"), "ratio");
    expect(within(ratio).getByText("Load lifted: 1.22× your logged weight — for your own context, not a rank.")).toBeTruthy();
    expect(within(ratio).getByText(/^82 kg, from your weight log on Aug 1(, 2026)?\.$/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/that week/);
  });

  it("says it is checking the lift's comparison while it loads, not that the lift has none", () => {
    mocks.forLift.mockImplementation((input) => input.exerciseName === "Pec Deck Fly"
      ? { data: undefined, isPending: true, isFetching: true, fetchStatus: "fetching" }
      : answerByLift(input));
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    const record = openChest();
    fireEvent.change(within(record).getByLabelText("Which lift to show"), { target: { value: "device-pec-2" } });
    const comparison = row(liftSection(record, "Pec Deck Fly"), "comparison");
    expect(within(comparison).getByText("Checking comparison…").getAttribute("role")).toBe("status");
    expect(within(comparison).queryByText("No comparison rank available for this lift")).toBeNull();
  });

  it("says when a lift has no body weight anywhere, and asks for it where the ratio would be", () => {
    mocks.forLift.mockReturnValue(settled({ status: "unavailable", reason: "body_mass_required" }));
    mocks.ranks.mockReturnValue(settled({ ...scored, muscles: [], unranked: [{ exerciseName: "Barbell Bench Press", reason: "body_mass_required" }] }));
    renderPanel([{ ...bench, bodyMassKgAtTest: null }], { baselineBodyWeight: undefined });
    const record = openChest();
    // Ranked nothing: unscored, in words, not a loading state.
    expect(within(rankSection(record)).getByText("Not scored")).toBeTruthy();
    const lift = liftSection(record, "Barbell Bench Press");
    expect(within(row(lift, "comparison")).getByText("Add your body weight and this lift gets a percentile.")).toBeTruthy();
    const ratio = row(lift, "ratio");
    expect(within(ratio).getByText("No body weight to read this lift against yet.")).toBeTruthy();
    expect(within(ratio).getByText("Add test body weight")).toBeTruthy();
    expect(record.textContent).not.toMatch(/Load lifted/);
  });

  it("keeps a lift's own logged body weight when the profile weight changes", () => {
    const { rerenderWith } = renderPanel([bench], { baselineBodyWeight: 100 });
    const record = openChest();
    const readBack = () => ({
      ratio: row(liftSection(record, "Barbell Bench Press"), "ratio").textContent,
      meta: record.querySelector(".strength-region-test-meta")?.textContent,
      sent: mocks.ranks.mock.calls.at(-1)?.[0].lifts.map((lift) => lift.bodyMassKg),
    });
    const before = readBack();
    expect(before.ratio).toContain("Load lifted: 1.25× your body weight on that day");
    expect(before.ratio).toContain("80 kg, recorded with this lift.");
    expect(before.meta).toContain("· at 80 kg");
    expect(before.sent).toEqual([80]);

    rerenderWith({ baselineBodyWeight: 60 });
    expect(readBack()).toEqual(before);
  });

  it("says ranks are on their way, in the record as on the map, instead of showing nothing or unscored", () => {
    mocks.ranks.mockReturnValue({ data: undefined, isPending: true, isFetching: true, fetchStatus: "fetching" });
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    expect(screen.getByText(/^Ranking your lifts… the map shows where lifts are on record/)).toBeTruthy();
    const rank = rankSection(openChest());
    expect(within(rank).getByText("Ranking your lifts…").getAttribute("role")).toBe("status");
    expect(within(rank).queryByText("Not scored")).toBeNull();
  });

  it("keeps the previous ranks drawn while new ones load, and says they are updating", () => {
    mocks.ranks.mockReturnValue({ ...settled(scored), isFetching: true, fetchStatus: "fetching", isPlaceholderData: true });
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    expect(document.querySelector(".strength-body-map")?.getAttribute("data-mode")).toBe("rank");
    expect(document.querySelector("[data-rank-updating]")?.textContent).toBe("Updating ranks…");
    const rank = rankSection(openChest());
    expect(within(rank).getByText("84th percentile")).toBeTruthy();
    expect(within(rank).getByText("Updating ranks…")).toBeTruthy();
  });

  it("lets the ranks go when the last lift that could be ranked is removed, instead of keeping them drawn", () => {
    const ranks = rankQuery();
    mocks.ranks.mockImplementation(ranks.query);
    renderPanel([bench]);
    openChest();
    expect(document.querySelector(".strength-body-map")?.getAttribute("data-mode")).toBe("rank");

    localStorage.setItem(deviceStrengthObservationKey, "[]");
    act(() => { window.dispatchEvent(new Event(deviceStrengthObservationEvent)); });

    // Nothing is left to rank, so no answer is coming: the map goes back to coverage and the
    // record has no rank for a lift that no longer exists.
    expect(document.querySelector(".strength-body-map")?.getAttribute("data-mode")).toBe("coverage");
    const record = screen.getByRole("region", { name: "Chest recorded strength context" });
    expect(within(record).queryByRole("region", { name: "Chest rank" })).toBeNull();
    expect(record.querySelector(".rank-card")).toBeNull();
    expect(document.querySelector("[data-rank-updating]")).toBeNull();
  });

  it("keeps naming the lifts behind the ranks on screen while new ones load, not the lifts just changed", () => {
    const ranks = rankQuery();
    mocks.ranks.mockImplementation(ranks.query);
    const { rerenderWith } = renderPanel([{ ...bench, bodyMassKgAtTest: undefined }]);
    const record = openChest();
    const provenanceLine = () => record.querySelector("[data-rank-provenance] .rank-provenance-lift")?.textContent ?? "";
    const notesSummary = () => document.querySelector("[data-rank-data-notes] summary")?.textContent ?? "";
    expect(provenanceLine()).toMatch(/ · read against 80 kg, your current profile weight$/);

    // "Not your weight that day?": saving 85 kg for the bench changes what is sent.
    const lift = liftSection(record, "Barbell Bench Press");
    fireEvent.change(within(lift).getByLabelText("Body weight on the day of this lift, in kilograms"), { target: { value: "85" } });
    fireEvent.click(within(lift).getByRole("button", { name: "Save this body weight" }));
    expect(mocks.ranks.mock.calls.at(-1)?.[0].lifts.map((sent) => sent.bodyMassKg)).toEqual([85]);

    // The rank on screen is still the one worked out against 80 kg, and says so.
    expect(within(rankSection(record)).getByText("Updating ranks…")).toBeTruthy();
    expect(provenanceLine()).toMatch(/ · read against 80 kg, your current profile weight$/);
    expect(notesSummary()).toContain("1 on your profile weight");
    expect(row(lift, "comparison").textContent).not.toMatch(/Counts toward|Not part of/);

    // The new answer arrives, and only now is the rank read against the saved weight.
    ranks.answer();
    rerenderWith({});
    expect(within(rankSection(record)).queryByText("Updating ranks…")).toBeNull();
    expect(provenanceLine()).toMatch(/ · read against 85 kg, recorded with the lift$/);
    expect(notesSummary()).not.toContain("profile weight");
    expect(row(lift, "comparison").textContent).toContain("Counts toward the Chest rank.");
  });

  it("says it is waiting for a connection when kept ranks cannot be updated offline", () => {
    mocks.ranks.mockReturnValue({ ...settled(scored), fetchStatus: "paused", isPlaceholderData: true });
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    expect(document.querySelector(".strength-body-map")?.getAttribute("data-mode")).toBe("rank");
    expect(document.querySelector("[data-rank-updating]")?.textContent).toBe("Waiting for a connection to update ranks. The colours are your previous ranks.");
    const rank = rankSection(openChest());
    expect(within(rank).getByText("84th percentile")).toBeTruthy();
    expect(within(rank).getByText("Waiting for a connection to update ranks. This is your previous rank.")).toBeTruthy();
    expect(within(rank).queryByText("Updating ranks…")).toBeNull();
  });

  it("puts every limitation of the map's ranks in one Data notes disclosure, with its counts in view", () => {
    renderPanel([bench, pecDeckFirst, pecDeckLatest]);
    const notes = document.querySelectorAll("[data-rank-data-notes]");
    expect(notes).toHaveLength(1);
    expect(notes[0].querySelector("summary")?.textContent).toBe("Data notes1 not in these ranks · 1 on your profile weight");
    expect(notes[0].querySelector("[data-rank-unranked-note]")?.textContent).toContain("Pec Deck Fly — no comparison group for this lift yet");
    expect(notes[0].querySelector("[data-rank-body-mass-note] b")?.textContent).toBe("1 lift uses your current profile weight and will move if you change it");
  });
});
