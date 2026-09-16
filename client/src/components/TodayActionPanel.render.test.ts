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

function renderPanel() {
  return render(
    React.createElement(TodayActionPanel, {
      stagedExerciseCount: mocks.staged,
      trainingDays: 4,
      activeDayLabel: "Week 1 · Push",
      onOpenTraining: () => {},
      onOpenStrength: () => {},
    })
  );
}

describe("Today action panel state layer", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    mocks.observations = [];
    mocks.trackedSets = [];
    mocks.referenceRows = [];
    mocks.staged = 0;
  });

  it("headlines a confirmed change with its direction and its boundary", () => {
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 145, "2026-06-05T12:00:00.000Z"),
    ];
    renderPanel();

    expect(screen.getByText("Back Squat")).toBeTruthy();
    expect(screen.getByText(/^\+\d+%$/)).toBeTruthy();
    expect(screen.getByText("Confirmed gain")).toBeTruthy();
    expect(screen.getByText(/not a rank against other people/)).toBeTruthy();
  });

  it("reads a confirmed decline as a decline, in the losing colour", () => {
    // This rendered in the positive-state green with a "Confirmed change" badge, so a
    // regression and a gain were visually identical.
    mocks.observations = [
      observation(1, 145, "2026-01-05T12:00:00.000Z"),
      observation(2, 100, "2026-06-05T12:00:00.000Z"),
    ];
    const { container } = renderPanel();

    expect(screen.getByText("Confirmed decline")).toBeTruthy();
    expect(screen.getByText(/^-\d+%$/)).toBeTruthy();
    expect(screen.queryByText("Confirmed gain")).toBeNull();
    // The direction is on the element the colour rule keys off.
    expect(container.querySelector('[data-sg-change="loss"]')).toBeTruthy();
    // A decline never takes the amplified reveal.
    expect(container.querySelector('[data-sg-change-intensity="pronounced"]')).toBeNull();
  });

  it("marks a large gain for the pronounced reveal, and a modest one for the standard reveal", () => {
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 145, "2026-06-05T12:00:00.000Z"),
    ];
    const large = renderPanel();
    expect(large.container.querySelector('[data-sg-change-intensity="pronounced"]')).toBeTruthy();
    document.body.innerHTML = "";

    // ~18%: confirmed, but not rare enough to amplify.
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 118, "2026-06-05T12:00:00.000Z"),
    ];
    const modest = renderPanel();
    expect(modest.container.querySelector('[data-sg-change="gain"]')).toBeTruthy();
    expect(modest.container.querySelector('[data-sg-change-intensity="standard"]')).toBeTruthy();
  });

  it("states no direction when the movement sits inside normal variation", () => {
    // A ~2% difference is well inside the estimator's own error.
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 102, "2026-06-05T12:00:00.000Z"),
    ];
    renderPanel();

    expect(screen.queryByText(/^Confirmed (gain|decline)$/)).toBeNull();
    expect(
      screen.getByText("No change yet is large enough to call a real one rather than normal variation.")
    ).toBeTruthy();
  });

  it("invites a first comparison rather than showing an empty metric", () => {
    renderPanel();

    expect(screen.getByText("No tracked lifts yet")).toBeTruthy();
    expect(screen.getByText("Log the same lift twice and your change starts tracking here.")).toBeTruthy();
    expect(screen.queryByText(/^Confirmed (gain|decline)$/)).toBeNull();
  });

  it("still carries the next action beneath the state layer", () => {
    renderPanel();
    expect(screen.getByText("Choose the next useful move.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Design training day/i })).toBeTruthy();
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

describe("Today action panel priority slot", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    mocks.observations = [];
    mocks.trackedSets = [];
    mocks.referenceRows = [];
    mocks.staged = 0;
  });

  it("asks for a first measurement when nothing is logged", () => {
    renderPanel();
    expect(screen.getByText("Where attention goes · Measure")).toBeTruthy();
    expect(screen.getByText("Log your first lift")).toBeTruthy();
  });

  it("prompts to stage a day once lifts exist but no session is built", () => {
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 145, "2026-06-05T12:00:00.000Z"),
    ];
    renderPanel();
    expect(screen.getByText("Where attention goes · Act")).toBeTruthy();
    expect(screen.getByText("Stage your next training day")).toBeTruthy();
  });

  it("asks for the body weight that is blocking a real comparison, ahead of any prescription", () => {
    mocks.staged = 0; // a staged-day prompt would otherwise apply
    mocks.referenceRows = squatLadder;
    mocks.observations = [
      {
        id: 1,
        exerciseName: "Back Squat",
        observedAt: "2026-06-01T12:00:00.000Z",
        measurementType: "MEASURED_1RM",
        loadKg: 200,
        bodyMassKgAtTest: null,
        laterality: "BILATERAL",
        referenceContextJson: JSON.stringify({
          referenceId: "van_den_hoek_2024_powerlifting_relative_strength",
          drugTestedCompetitionConfirmed: true,
          unequippedCompetitionConfirmed: true,
          maximumSuccessfulLiftConfirmed: true,
          sex: "male",
          ageYears: 27,
        }),
      },
    ];
    renderPanel();

    expect(screen.getByText("Where attention goes · Measure")).toBeTruthy();
    expect(screen.getByText("Add your test-day body weight")).toBeTruthy();
    expect(screen.getByText(/Back Squat/)).toBeTruthy();
    expect(screen.queryByText("Stage your next training day")).toBeNull();
  });

  it("sends a confirmed change to inspection rather than a prescription", () => {
    mocks.staged = 4;
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 145, "2026-06-05T12:00:00.000Z"),
    ];
    renderPanel();
    expect(screen.getByText("Where attention goes · Inspect")).toBeTruthy();
    expect(screen.getByText("Review the change on your record")).toBeTruthy();
  });

  it("shows exactly one priority", () => {
    mocks.observations = [observation(1, 100, "2026-01-05T12:00:00.000Z")];
    const { container } = renderPanel();
    expect(container.querySelectorAll(".today-action-priority")).toHaveLength(1);
  });
});
