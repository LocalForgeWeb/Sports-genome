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

  /**
   * "Where does the week's volume land" was answered with eight full rows - name,
   * split, status chip, number and a two-tone bar each - measured at 1,288px on a
   * 390px-wide screen. The answer is the muscles carrying most of it; the rest are
   * evidence for it, and now sit behind one tap in the same order.
   */
  it("leads with the muscles carrying the most, and keeps the rest one tap down", () => {
    draw({ "1-Push": pick(10), "2-Pull": exercises.slice(20, 32), "3-Legs": exercises.slice(40, 52) });
    // The first list is what the page opens with; the second is behind the tap.
    expect(document.querySelectorAll(".weekly-volume-panel > .weekly-volume-list > article").length).toBe(4);
    const more = document.querySelector(".weekly-volume-more");
    expect(more, "the remaining muscles are still reachable").toBeTruthy();
    expect((more as HTMLDetailsElement).open, "and are not opened by default").toBe(false);
    // Named in the summary, so what is behind the tap is not a mystery.
    expect(more!.querySelector("summary small")?.textContent?.length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".weekly-volume-more article").length).toBeGreaterThan(0);
  });

  it("does not offer a tap that opens nothing", () => {
    // A three-muscle week has no remainder, and a disclosure over an empty list
    // is a control that lies about having something behind it.
    draw({ "1-Push": exercises.slice(0, 1) });
    const rows = document.querySelectorAll(".weekly-volume-list > article").length;
    if (rows < 4) expect(document.querySelector(".weekly-volume-more")).toBeNull();
  });
});
