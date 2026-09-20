// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import type { WeeklyPlan, WeeklyPrescriptionStore } from "@/lib/weeklyVolume";
import { WeeklyMuscleVolumePanel } from "./WeeklyMuscleVolumePanel";

afterEach(() => { document.body.innerHTML = ""; });

const pick = (n: number) => exercises.slice(0, n);

const draw = (plan: WeeklyPlan, prescriptions: WeeklyPrescriptionStore = {}) =>
  render(React.createElement(WeeklyMuscleVolumePanel, { plan, prescriptions, goal: "Muscle growth" }));

describe("weekly muscle volume rows", () => {
  it("drops the per-day breakdown when a single day is the whole of it", () => {
    // With one saved day the breakdown has one part, which is the row's own
    // total printed again beside it - eight rows reading "Push 10.5" next to a
    // 10.5 already on the row.
    draw({ "1-Push": pick(4) });
    expect(document.querySelectorAll(".weekly-volume-list article").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".weekly-volume-days")).toHaveLength(0);
  });

  it("names that day once, in the header, rather than on every row", () => {
    draw({ "1-Push": pick(4) });
    expect(screen.getByText("Push is the one saved training day feeding this estimate.")).toBeTruthy();
  });

  it("keeps the breakdown when more than one day feeds a muscle", () => {
    // Two days is a real breakdown: the parts differ from the total.
    draw({ "1-Push": pick(4), "2-Pull": pick(4) });
    expect(document.querySelectorAll(".weekly-volume-days").length).toBeGreaterThan(0);
    expect(screen.getByText("2 saved training days feed this estimate.")).toBeTruthy();
  });

  it("still asks for a saved day when there is none", () => {
    draw({});
    expect(screen.getByText("Save a training day to begin the weekly volume map.")).toBeTruthy();
  });
});
