import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./index.css", import.meta.url), "utf8");

describe("Train destination operational surfaces", () => {
  it("keeps weekly planning and Tracker execution on layered navy surfaces", () => {
    expect(source).toContain(".destination-train .three-week-planner, .destination-train .weekly-plan-board");
    expect(source).toContain(".destination-train .three-week-tabs button, .destination-train .weekly-day-card");
    expect(source).toContain('.destination-train .three-week-tabs button[aria-pressed="true"], .destination-train .weekly-day-card[aria-pressed="true"]');
    expect(source).toContain(".destination-train .device-workout-tracker .session-exercise");
    expect(source).toContain(".destination-train .device-workout-tracker .session-set-row input");
    expect(source).toContain("#f2c14d");
  });
});
