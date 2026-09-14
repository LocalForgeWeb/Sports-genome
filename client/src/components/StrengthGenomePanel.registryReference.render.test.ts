// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NormsReferenceRow } from "@shared/normsReference";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthGenome: {
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
    },
  },
}));
vi.mock("body-muscles", () => ({ ViewSide: { FRONT: "front", BACK: "back" }, BodyChart: class { update() {} destroy() {} } }));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { strengthRegionDefinitions } from "@shared/strengthGenomeDefinitions";
import { StrengthRegionRecordDetail } from "./StrengthGenomePanel";

/** Three cut points from the approved van den Hoek male 18-35 back-squat ladder. */
const squatLadder: NormsReferenceRow[] = [
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
  sourceUrl: "https://example.org/van-den-hoek-2024",
  boundary: "Competitive drug-tested unequipped powerlifting only.",
}));

const confirmedDeclaration = JSON.stringify({
  referenceId: "van_den_hoek_2024_powerlifting_relative_strength",
  drugTestedCompetitionConfirmed: true,
  unequippedCompetitionConfirmed: true,
  maximumSuccessfulLiftConfirmed: true,
});

/** 200 kg at 80 kg body mass is 2.50x - above the 50th cut point, below the 90th. */
const squatRecord = {
  id: "device-squat",
  exerciseName: "Back Squat",
  observedAt: "2026-06-01T12:00:00.000Z",
  measurementType: "MEASURED_1RM",
  loadKg: 200,
  bodyMassKgAtTest: 80,
  referenceContextJson: confirmedDeclaration,
};

// A Back Squat test routes to the quadriceps region.
const legRegion = strengthRegionDefinitions.find(region => region.id === "quadriceps")!;

function renderDetail(props: Record<string, unknown>) {
  return render(
    React.createElement(StrengthRegionRecordDetail, {
      region: legRegion,
      observations: [squatRecord],
      onClose: () => {},
      weightUnit: "kg",
      directAccess: true,
      onSetDeviceBodyMass: () => {},
      ...props,
    } as never)
  );
}

describe("Strength Genome registry comparison", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    // jsdom does not implement scrollIntoView; the matched card scrolls itself into view.
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => { document.body.innerHTML = ""; vi.unstubAllGlobals(); });

  it("shows the approved study band for a fully qualified test", () => {
    renderDetail({ referenceRows: squatLadder, athleteProfile: { sexForReference: "male", birthYear: 1999 } });

    expect(screen.getByText("50th-90th percentile")).toBeTruthy();
    expect(screen.getByText(/2\.50× body mass/)).toBeTruthy();
    // The source's own population and sample stay attached to the number.
    expect(screen.getByText(/powerlifting; strength-trained competitive/)).toBeTruthy();
    expect(screen.getByText(/103,984 people/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /source study/i }).getAttribute("href")).toBe(
      "https://example.org/van-den-hoek-2024"
    );
  });

  it("shows no comparison when the athlete never confirmed the study's population", () => {
    renderDetail({
      referenceRows: squatLadder,
      athleteProfile: { sexForReference: "male", birthYear: 1999 },
      observations: [{ ...squatRecord, referenceContextJson: null }],
    });

    expect(screen.queryByText("Compared to that study group")).toBeNull();
    expect(screen.getByText("Why no comparison to other people?")).toBeTruthy();
  });

  it("shows no comparison when the athlete's age falls outside the reported band", () => {
    renderDetail({ referenceRows: squatLadder, athleteProfile: { sexForReference: "male", birthYear: 1960 } });

    expect(screen.queryByText("Compared to that study group")).toBeNull();
    expect(screen.getByText("Why no comparison to other people?")).toBeTruthy();
  });

  it("shows no comparison while the registry has not loaded", () => {
    renderDetail({ referenceRows: [], athleteProfile: { sexForReference: "male", birthYear: 1999 } });

    expect(screen.queryByText("Compared to that study group")).toBeNull();
  });
});
