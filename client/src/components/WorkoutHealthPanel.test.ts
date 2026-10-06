import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { WorkoutHealthPanel } from "./WorkoutHealthPanel";

const source = readFileSync(new URL("./WorkoutHealthPanel.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

describe("WorkoutHealthPanel progressive disclosure", () => {
  it("keeps diagnostic detail closed by default while preserving an accessible Stack Review summary", () => {
    expect(source).toContain('id="stack-review"');
    expect(source).toContain('<details className="workout-health-disclosure">');
    expect(source).toContain("<summary>");
    expect(source).toContain("Stack review");
    expect(source).toContain("Coach scan");
    expect(source).toContain("planning signal");
    expect(source).toContain("Review");
    expect(source).not.toContain('<details className="workout-health-disclosure" open>');
  });

  it("retains all diagnostic content inside the expandable disclosure with keyboard-focusable summary styling", () => {
    expect(source).toContain('className="workout-health-content"');
    expect(source).toContain("planned work sets");
    // Renamed from "muscle overlap": muscles carry 40 of its 100 points (5 October 2026 brief §8).
    expect(source).toContain("exercise overlap index, 0–100");
    expect(source).toContain("These are planning estimates from the workout as written");
    expect(styles).toContain(".workout-health-disclosure > summary");
    expect(styles).toContain(".workout-health-disclosure > summary:focus-visible");
    expect(styles).toContain("cursor: pointer");
    expect(styles).toContain("min-height: 72px");
  });
});

/**
 * The equipment line used to come from the device's unscoped profile key. Once
 * an account signs in, that record moves under the account's own key, so the
 * line vanished for signed-in athletes, or showed another session's gym. It now
 * comes only from the profile Home is planning with.
 */
describe("the stack review's equipment line", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores a gym saved under the device's unscoped key", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => JSON.stringify({ baseline: { equipment: { gymAccess: "Garage gym", availableEquipment: ["Bodyweight"] } } }) } });
    const html = renderToStaticMarkup(createElement(WorkoutHealthPanel, { workout: [], prescriptions: {}, settings: {} }));
    expect(html).not.toContain("Garage gym profile");
    expect(html).not.toContain("Automatic stack equipment");
  });

  it("shows the summary it is handed", () => {
    const html = renderToStaticMarkup(createElement(WorkoutHealthPanel, { workout: [], prescriptions: {}, settings: {}, equipmentSummary: "Small gym profile: automatic stacks use only your 3 selected equipment categories." }));
    expect(html).toContain("Automatic stack equipment");
    expect(html).toContain("Small gym profile: automatic stacks use only your 3 selected equipment categories.");
  });

  it("reads no storage itself, and Home hands it the profile it plans with", () => {
    expect(source).not.toContain("localStorage");
    const element = home.slice(home.indexOf("<WorkoutHealthPanel"));
    expect(element.slice(0, element.indexOf("/>"))).toContain("equipmentSummary={equipmentProfileSummary(athleteBaseline.equipment)}");
  });
});
