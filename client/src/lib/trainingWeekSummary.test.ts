import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  relativeDayLabel,
  startOfTrainingWeek,
  summarizeTrainingWeek,
  type TrainingSession,
} from "./trainingWeekSummary";

const tour = readFileSync(join(process.cwd(), "client/src/components/FeatureTour.tsx"), "utf8");
const home = readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

// Wednesday, so the week boundary is two days back.
const now = new Date(2026, 8, 16, 9, 0, 0);

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 1,
    title: "Push Day A",
    status: "completed",
    startedAt: new Date(2026, 8, 15, 18, 0, 0),
    completedAt: new Date(2026, 8, 15, 19, 0, 0),
    completedSetCount: 12,
    ...overrides,
  };
}

describe("startOfTrainingWeek", () => {
  it("starts the week on Monday", () => {
    expect(startOfTrainingWeek(new Date(2026, 8, 16)).getDay()).toBe(1);
  });

  it("treats Sunday as the end of the week it began, not the start of a new one", () => {
    // Sunday 2026-09-20 belongs to the week starting Monday 2026-09-14.
    const start = startOfTrainingWeek(new Date(2026, 8, 20, 22, 0, 0));
    expect(start.getDate()).toBe(14);
  });

  it("returns midnight, so a session earlier that Monday still counts", () => {
    const start = startOfTrainingWeek(now);
    expect([start.getHours(), start.getMinutes(), start.getSeconds()]).toEqual([0, 0, 0]);
  });
});

describe("summarizeTrainingWeek", () => {
  it("counts sessions finished inside this week", () => {
    const result = summarizeTrainingWeek([session(), session({ id: 2 })], 4, now);
    expect(result.completedThisWeek).toBe(2);
    expect(result.setsThisWeek).toBe(24);
  });

  it("excludes a session finished before the week started", () => {
    const lastWeek = session({ id: 3, startedAt: new Date(2026, 8, 10), completedAt: new Date(2026, 8, 10) });
    const result = summarizeTrainingWeek([lastWeek], 4, now);
    expect(result.completedThisWeek).toBe(0);
    // It is still the most recent finished session.
    expect(result.lastCompleted?.id).toBe(3);
  });

  it("counts a session for the week it finished in, not the week it opened", () => {
    // Started Sunday night, finished Monday morning.
    const overnight = session({ startedAt: new Date(2026, 8, 13, 23, 0), completedAt: new Date(2026, 8, 14, 0, 30) });
    expect(summarizeTrainingWeek([overnight], 4, now).completedThisWeek).toBe(1);
  });

  it("does not count an unfinished session as done", () => {
    const result = summarizeTrainingWeek([session({ status: "active", completedAt: null })], 4, now);
    expect(result.completedThisWeek).toBe(0);
  });

  it("surfaces the open session so it can be picked back up", () => {
    const open = session({ id: 9, status: "active", completedAt: null, title: "Lower Body B" });
    expect(summarizeTrainingWeek([open], 4, now).resumable?.title).toBe("Lower Body B");
  });

  it("offers the most recently started session when several are open", () => {
    const older = session({ id: 1, status: "active", completedAt: null, startedAt: new Date(2026, 8, 14) });
    const newer = session({ id: 2, status: "active", completedAt: null, startedAt: new Date(2026, 8, 16, 8) });
    expect(summarizeTrainingWeek([older, newer], 4, now).resumable?.id).toBe(2);
  });

  it("ignores an abandoned session entirely", () => {
    const result = summarizeTrainingWeek([session({ status: "abandoned", completedAt: null })], 4, now);
    expect(result.completedThisWeek).toBe(0);
    expect(result.resumable).toBeNull();
  });

  it("reports an empty week as zero rather than an encouraging number", () => {
    const result = summarizeTrainingWeek([], 4, now);
    expect(result).toMatchObject({
      completedThisWeek: 0, setsThisWeek: 0, resumable: null,
      lastCompleted: null, daysSinceLastSession: null,
    });
  });

  it("counts whole days since the last session", () => {
    const result = summarizeTrainingWeek([session()], 4, now);
    expect(result.daysSinceLastSession).toBe(0);
  });

  it("survives a malformed timestamp without throwing", () => {
    const broken = session({ startedAt: "not-a-date", completedAt: "also-not-a-date" });
    expect(() => summarizeTrainingWeek([broken], 4, now)).not.toThrow();
  });
});

describe("relativeDayLabel", () => {
  it("uses the words someone would actually say", () => {
    expect(relativeDayLabel(0)).toBe("today");
    expect(relativeDayLabel(1)).toBe("yesterday");
    expect(relativeDayLabel(3)).toBe("3 days ago");
    expect(relativeDayLabel(9)).toBe("last week");
    expect(relativeDayLabel(21)).toBe("3 weeks ago");
  });

  it("says nothing when there is nothing to date", () => {
    expect(relativeDayLabel(null)).toBe("");
  });
});

/**
 * The previous guide sent athletes to a "left rail" seven times. There is no left
 * rail anywhere in this app - navigation is a bottom tab bar - so those steps could
 * not be followed at all.
 */
describe("the guide describes navigation that exists", () => {
  it("never sends an athlete to a left rail", () => {
    // Scoped to the step data: the file's own comment records why those steps went,
    // and that history is worth keeping.
    const stepData = tour.slice(tour.indexOf("const steps = ["), tour.indexOf("] as const;"));
    expect(stepData.toLowerCase()).not.toContain("left rail");
    expect(stepData.toLowerCase()).not.toContain("rail");
  });

  it("names the real tabs", () => {
    for (const tab of ["Home", "Train", "Body Lab", "Progress"]) {
      expect(tour).toContain(`tab: "${tab}"`);
    }
  });

  it("routes every step to a workspace the app actually has", () => {
    const workspaces = new Set(
      [...home.matchAll(/workspace === "([a-z]+)"/g)].map(match => match[1])
    );
    const targets = [...tour.matchAll(/view: "([a-z]+)"/g)].map(match => match[1]);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(workspaces.has(target), `${target} is not a real workspace`).toBe(true);
    }
  });

  it("covers Strength Genome, where a logged lift actually goes", () => {
    // The old guide had ten steps and never mentioned it.
    expect(tour).toContain('view: "strength"');
  });

  it("stays short enough to finish", () => {
    const steps = [...tour.matchAll(/^\s{4}view: "/gm)].length;
    expect(steps).toBeLessThanOrEqual(5);
    expect(steps).toBeGreaterThanOrEqual(3);
  });

  it("gives each step one thing to do, not a checklist", () => {
    expect(tour).not.toContain("tasks:");
    expect([...tour.matchAll(/^\s{4}task: "/gm)].length).toBe(
      [...tour.matchAll(/^\s{4}view: "/gm)].length
    );
  });
});
