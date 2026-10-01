// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  observations: [] as unknown[],
  trackedSets: [] as unknown[],
  referenceRows: [] as unknown[],
  staged: 0,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    strengthGenome: {
      overview: { useQuery: () => ({ data: { observationCount: 2 } }) },
      observations: { useQuery: () => ({ data: mocks.observations }) },
      referenceRows: { useQuery: () => ({ data: mocks.referenceRows }) },
    },
    workoutLog: {
      list: { useQuery: () => ({ data: [] }) },
      progressionHistory: { useQuery: () => ({ data: mocks.trackedSets }) },
    },
  },
}));

import { TodayActionPanel } from "./TodayActionPanel";
import { todayPlan } from "./todayPlanFixture";

/**
 * Two logs of the same lift, far enough apart that the within-athlete model rates the
 * change confirmed: 100 kg x 5 to 145 kg x 5 is well past the meaningful threshold.
 */
function observation(id: number, loadKg: number, observedAt: string) {
  return {
    id,
    exerciseName: "Back Squat",
    observedAt,
    measurementType: "MULTI_REP",
    loadKg,
    repetitions: 5,
    laterality: "BILATERAL",
  };
}

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";
import type { LiveSession } from "@/lib/liveSession";

function renderPanel(overrides: Partial<React.ComponentProps<typeof TodayActionPanel>> = {}) {
  return render(
    React.createElement(TodayActionPanel, {
      // Push is Day 01 of a four-day split; `mocks.staged` exercises are built on it.
      plan: todayPlan({ Push: mocks.staged }),
      onOpenWorkout: () => {},
      onOpenTraining: () => {},
      onOpenStrength: () => {},
      hour: 9,
      ...overrides,
    })
  );
}

const live: LiveSession = { id: "s1", dayLabel: "Week 2 · Day 02 · Pull", startedAt: new Date().toISOString(), completedSets: 3, plannedSets: 12, exerciseNumber: 2, exerciseCount: 5, exerciseName: "Chin-up", setNumber: 2, setCount: 4, finishedExercises: ["Barbell Row"] };

function seedDevice(lifts: number, finishedWorkouts: number) {
  const now = Date.now();
  localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(Array.from({ length: lifts }, (_, index) => ({ id: `d${index}`, exerciseName: "Back Squat", observedAt: new Date(now - index * 86_400_000).toISOString(), measurementType: "MEASURED_1RM", loadKg: 100, laterality: "BILATERAL", dataQuality: "SELF_REPORTED" }))));
  localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(Array.from({ length: finishedWorkouts }, (_, index) => ({ id: `w${index}`, title: "Push", dayLabel: "Week 1 · Day 01 · Push", startedAt: new Date(now - 3_600_000).toISOString(), completedAt: new Date(now).toISOString(), status: "completed", exercises: [{ id: "e", exerciseName: "Barbell Bench Press", plannedPrescription: "3 × 5", sets: [{ weight: "80", reps: "5", completed: true }] }] }))));
}

describe("Today action panel: where you are and what to do", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    mocks.observations = [];
    mocks.trackedSets = [];
    mocks.referenceRows = [];
    mocks.staged = 0;
  });

  it("names the page and greets the athlete by the name they gave, or plainly", () => {
    renderPanel({ athleteName: "Gabe" });
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Good morning, Gabe" })).toBeTruthy();
    document.body.innerHTML = "";
    renderPanel({ hour: 20 });
    expect(screen.getByRole("heading", { level: 1, name: "Good evening" })).toBeTruthy();
  });

  it("puts a workout under way first, with resume as the one primary action and no first-lift prompt", () => {
    renderPanel({ live });
    const heading = screen.getByRole("heading", { level: 2, name: "Pull" });
    expect(heading).toBeTruthy();
    expect(screen.getByText("Continue your workout")).toBeTruthy();
    expect(screen.getByText(/3 of 12 sets logged · next: Chin-up, set 2/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Resume Pull workout/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /View workout details/ })).toBeTruthy();
    expect(screen.queryByText(/Log your first lift/)).toBeNull();
    expect(screen.queryByText(/Nothing recorded yet/)).toBeNull();
    // The primary module precedes the week summary in the document.
    const primary = document.querySelector(".today-action-primary")!;
    const week = document.querySelector(".home-week")!;
    expect(primary.compareDocumentPosition(week) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelectorAll(".today-action-cta")).toHaveLength(1);
  });

  it("names the next workout, its place in the plan and its size, with Review and Edit for that day", () => {
    mocks.staged = 6;
    renderPanel();
    expect(screen.getByRole("heading", { name: "Push" })).toBeTruthy();
    expect(screen.getByText("Week 1 · Day 01")).toBeTruthy();
    expect(screen.getByText("6 exercises")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open next workout/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Edit plan/i })).toBeTruthy();
  });

  /**
   * Home names a built day even when other days are empty; there is no "choose your next workout"
   * state, because the day Plan is showing never becomes Home's (Sep 28 regression brief §4).
   */
  it("names the first built day when others are empty, and offers to build when nothing is", () => {
    renderPanel({ plan: todayPlan({ Push: 0, Pull: 3, Upper: 0 }), onOpenCatalog: () => {} });
    expect(screen.getByRole("heading", { level: 2, name: "Pull" })).toBeTruthy();
    expect(screen.queryByText("Choose your next workout")).toBeNull();
    document.body.innerHTML = "";
    renderPanel({ plan: todayPlan({}), onOpenCatalog: () => {} });
    expect(screen.getByText("Build training around your goals")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Build your first workout/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Explore exercises/i })).toBeTruthy();
  });

  it("holds its shape and claims nothing while the plan is still being read", () => {
    renderPanel({ plan: todayPlan({ Push: 5 }, { ready: false }) });
    expect(screen.getByRole("status", { name: "Loading your plan" })).toBeTruthy();
    expect(document.querySelector(".home-week-strip")).toBeNull();
  });

  it("reads the week as one fraction and the lifetime record from the same store Strength reads", () => {
    seedDevice(2, 1);
    mocks.staged = 3;
    renderPanel();
    expect(screen.getByText("Your week")).toBeTruthy();
    // Plain text, read as written: the number is no longer hidden behind an aria-label.
    expect(document.querySelector(".home-week-line")?.textContent).toBe("1 of 4 planned workouts done this week");
    // Two typed lifts plus one lift carried from the finished workout: the Strength definition.
    expect(screen.getByRole("button", { name: /3 lifts logged · 1 workout recorded, all time/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /View plan/ })).toBeTruthy();
  });

  it("reads zero as a number, not a verdict, with nothing recorded", () => {
    renderPanel();
    expect(document.querySelector(".home-week-line")?.textContent).toBe("0 of 4 planned workouts done this week");
    expect(screen.getByRole("button", { name: /0 lifts logged · 0 workouts recorded/ })).toBeTruthy();
    expect(screen.queryByText(/Nothing recorded/)).toBeNull();
    expect(screen.queryByText(/Log your first lift/)).toBeNull();
    expect(screen.queryByText("Where you are now")).toBeNull();
  });
});

describe("Today action panel: the one insight", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    mocks.observations = [];
    mocks.trackedSets = [];
    mocks.referenceRows = [];
    mocks.staged = 0;
  });

  it("headlines a larger change with its direction and its boundary", () => {
    mocks.observations = [observation(1, 100, "2026-01-05T12:00:00.000Z"), observation(2, 145, "2026-06-05T12:00:00.000Z")];
    renderPanel({ directAccess: false });
    expect(screen.getByText("Where you are now")).toBeTruthy();
    expect(screen.getByText("Back Squat")).toBeTruthy();
    expect(screen.getByText(/^\+\d+%$/)).toBeTruthy();
    // Sep 30 §6: named from the shared change-state table, never "Confirmed".
    expect(screen.getByText("Larger gain (15% or more)")).toBeTruthy();
    expect(screen.getByText(/not a rank against other people/)).toBeTruthy();
  });

  it("reads a larger decline as a decline, in the losing colour, never amplified", () => {
    mocks.observations = [observation(1, 145, "2026-01-05T12:00:00.000Z"), observation(2, 100, "2026-06-05T12:00:00.000Z")];
    const { container } = renderPanel({ directAccess: false });
    // Sep 30 §6: named from the shared change-state table, never "Confirmed".
    expect(screen.getByText("Larger decline (15% or more)")).toBeTruthy();
    expect(screen.getByText(/^-\d+%$/)).toBeTruthy();
    expect(screen.queryByText("Larger gain (15% or more)")).toBeNull();
    expect(container.textContent).not.toMatch(/confirmed/i);
    expect(container.querySelector('[data-sg-change="loss"]')).toBeTruthy();
    expect(container.querySelector('[data-sg-change-intensity="pronounced"]')).toBeNull();
  });

  it("marks a large gain for the pronounced reveal, and a modest one for the standard reveal", () => {
    mocks.observations = [observation(1, 100, "2026-01-05T12:00:00.000Z"), observation(2, 145, "2026-06-05T12:00:00.000Z")];
    const large = renderPanel({ directAccess: false });
    expect(large.container.querySelector('[data-sg-change-intensity="pronounced"]')).toBeTruthy();
    document.body.innerHTML = "";
    mocks.observations = [observation(1, 100, "2026-01-05T12:00:00.000Z"), observation(2, 118, "2026-06-05T12:00:00.000Z")];
    const modest = renderPanel({ directAccess: false });
    expect(modest.container.querySelector('[data-sg-change="gain"]')).toBeTruthy();
    expect(modest.container.querySelector('[data-sg-change-intensity="standard"]')).toBeTruthy();
  });

  it("says nothing at all when the movement sits inside normal variation", () => {
    mocks.observations = [observation(1, 100, "2026-01-05T12:00:00.000Z"), observation(2, 102, "2026-06-05T12:00:00.000Z")];
    renderPanel({ directAccess: false });
    expect(screen.queryByText(/^Confirmed (gain|decline)$/)).toBeNull();
    expect(screen.queryByText("Where you are now")).toBeNull();
  });
});
/** The approved back-squat ladder, so a real gate can be produced from real matching. */
const squatLadder = [
  [10, 1.75],
  [50, 2.28],
  [90, 2.83],
].map(([percentile, value]) => ({
  referenceKey: `ref-${percentile}`,
  sourceRecordId: `src-${percentile}`,
  sourceTable: "strength_norms",
  referenceFamily: "strength_norm",
  exerciseId: "exercise-back-squat",
  exerciseName: "Back Squat",
  localCatalogIds: [],
  measurementType: "direct_relative_1rm_by_age_sex",
  unit: "x_bodyweight",
  sex: "male",
  ageMin: 18,
  ageMax: 35,
  bodyweightMinKg: null,
  bodyweightMaxKg: null,
  trainingStatus: "strength-trained competitive",
  equipment: null,
  protocol: "Competition 1RM/bodyweight percentile.",
  competitionConditions: "powerlifting; drug-tested unequipped competition",
  normalizationMethod: "direct_relative_1rm_by_age_sex",
  populationDefinition: "powerlifting; strength-trained competitive",
  percentile,
  value,
  sampleSize: 103984,
  sourceText: "van den Hoek et al. 2024",
  sourceStudyId: "study-1",
  sourceUrl: "https://example.org/study",
  boundary: "Competitive drug-tested unequipped powerlifting only.",
}));

describe("Today action panel: the record prompt", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    mocks.observations = [];
    mocks.trackedSets = [];
    mocks.referenceRows = [];
    mocks.staged = 0;
  });

  it("asks for the body weight that is blocking a real comparison, below the primary action", () => {
    mocks.staged = 6;
    mocks.referenceRows = squatLadder;
    mocks.observations = [{
      id: 1,
      exerciseName: "Back Squat",
      observedAt: "2026-06-01T12:00:00.000Z",
      measurementType: "MEASURED_1RM",
      loadKg: 200,
      bodyMassKgAtTest: null,
      laterality: "BILATERAL",
      referenceContextJson: JSON.stringify({ referenceId: "van_den_hoek_2024_powerlifting_relative_strength", drugTestedCompetitionConfirmed: true, unequippedCompetitionConfirmed: true, maximumSuccessfulLiftConfirmed: true, sex: "male", ageYears: 27 }),
    }];
    renderPanel({ directAccess: false });
    expect(screen.getByText("Next for your record")).toBeTruthy();
    expect(screen.getByText("Add your test-day body weight")).toBeTruthy();
    const primary = document.querySelector(".today-action-primary")!;
    const prompt = document.querySelector(".today-action-priority")!;
    expect(primary.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelectorAll(".today-action-cta")).toHaveLength(1);
  });

  it("never prompts to log a first lift or to stage a day: the primary action already says so", () => {
    renderPanel();
    expect(screen.queryByText(/first lift/i)).toBeNull();
    expect(screen.queryByText(/Stage your next training day/)).toBeNull();
    expect(screen.queryByText("Next for your record")).toBeNull();
  });
});
