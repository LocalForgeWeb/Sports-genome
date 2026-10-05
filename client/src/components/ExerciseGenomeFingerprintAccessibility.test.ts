import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getExerciseGenome, goalDimensionFor, type ExerciseGenome } from "@/lib/exerciseGenome";
import { ExerciseGenomePanel, profileScore, profileSummary, workoutFitSummary } from "./ExerciseGenomePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const byName = (name: string) => exercises.find((item) => item.name === name) || exercises[0];
const seatedCurl = byName("Seated Leg Curl");
const draw = (exercise = seatedCurl, extra: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] }, ...extra }));
const fullLabels = ["Hypertrophy potential", "Strength expression", "Power expression", "Stability demand", "Mobility demand", "Stimulus-to-fatigue ratio", "Technical skill demand", "Practicality"];

/**
 * October 4 (Exercise Intelligence brief §4-5). The profile is a list of all eight
 * scores - the reliable reading surface - grouped by what a higher number means, with
 * the radar as an overview. It used to be four bars beside a radar whose labels ran
 * into one another, a low-to-high colour ramp for a chart that encodes magnitude by
 * radius, and "View the other four dimensions" without naming them.
 */
describe("the profile, as rows", () => {
  it("names every dimension once, as a row with its own help control", () => {
    // The rows, not the chart: the radar's own axis label for practicality is the same word.
    const markup = draw().replace(/<svg class="ei-radar-svg"[\s\S]*?<\/svg>/, "");
    const occurrences = (needle: string) => markup.split(needle).length - 1;
    for (const label of fullLabels) {
      expect(occurrences(`>${label}<`), `${label} is printed once`).toBe(1);
      expect(markup).toContain(`aria-label="Learn about ${label}"`);
    }
    // Help is an icon with a name, not every label underlined as if it were a link.
    expect(markup).not.toContain("genome-term-button");
  });

  it("shows the model's own eight values, in their groups' fixed order", () => {
    for (const name of ["Barbell Bench Press", "Seated Leg Curl", "Kettlebell Swing"]) {
      const exercise = byName(name);
      const genome = getExerciseGenome(exercise) as ExerciseGenome;
      const markup = draw(exercise);
      const values = [...markup.matchAll(/class="ei-row-value">(\d+)</g)].map((match) => Number(match[1]));
      expect(values, name).toEqual(["hypertrophy", "strength", "power", "stability", "mobility", "skill", "sfr", "practicality"].map((key) => genome.fingerprint[key as keyof typeof genome.fingerprint]));
    }
  });

  it("says once what the scale is, and never calls a score a percentage", () => {
    const markup = draw();
    expect(markup).toContain("Each score is out of 100 and compares this exercise with the others in the catalog. They are not percentages.");
    expect(markup).not.toMatch(/class="ei-row-value">\d+%/);
  });

  it("separates what an exercise can develop from what it asks, and says what higher means for each", () => {
    const markup = draw();
    expect(markup).toContain(">Training potential<");
    expect(markup).toContain("Higher means more potential.");
    expect(markup).toContain(">Demands<");
    expect(markup).toContain("Higher means it asks more, not that it is better.");
    expect(markup).toContain(">Trade-offs<");
  });

  it("names the four rows a narrow sheet holds back, on the control that shows them", () => {
    const markup = draw();
    expect(markup).toContain("Show all 8 dimensions");
    expect(markup).toContain("Also mobility demand, stimulus-to-fatigue ratio, technical skill demand and practicality");
    expect(markup).not.toContain("View the other four dimensions");
  });
});

describe("the radar", () => {
  it("is a picture with a text alternative, labelled with short axis names outside the plot", () => {
    const exercise = byName("Barbell Bench Press");
    const genome = getExerciseGenome(exercise) as ExerciseGenome;
    const markup = draw(exercise);
    expect(markup).toMatch(/<svg class="ei-radar-svg"[^>]*role="img"/);
    expect(markup).toContain(`Hypertrophy potential ${genome.fingerprint.hypertrophy}, Strength expression ${genome.fingerprint.strength}`);
    const axisLabels = [...markup.matchAll(/<text class="ei-radar-label"[^>]*>(.*?)<\/text>/g)].map((match) => match[1].replace(/<[^>]+>/g, ""));
    expect(axisLabels).toEqual(["Hypertrophy", "Strength", "Power", "Stability", "Mobility", "Stimulus/fatigue", "Skill", "Practicality"]);
    // Not "Fatigue cost": the axis is the stimulus-to-fatigue ratio, where higher is the better trade-off.
    expect(markup).not.toContain("Fatigue cost");
  });

  it("explains its radial scale instead of a colour ramp, and computes no overall score", () => {
    const markup = draw();
    expect(markup).not.toContain("genome-scale-key");
    expect(markup).toContain("Distance from the centre is the score: 0 at the centre, 100 at the outer edge, rings every 25.");
    expect(markup.match(/class="ei-radar-(ring|edge)"/g)).toHaveLength(4);
    expect(markup).not.toMatch(/overall|average/i);
  });
});

describe("a score that is not there", () => {
  it("is unavailable, never a zero or a clamped number", () => {
    expect(profileScore(80)).toBe(80);
    expect(profileScore(0)).toBe(0);
    for (const value of [null, undefined, Number.NaN, -1, 101, "80", Number.POSITIVE_INFINITY]) expect(profileScore(value), String(value)).toBeNull();
  });

  it("says so in the row and leaves the chart out rather than drawing a gap as zero", async () => {
    const { buildExerciseGenome } = await import("@/lib/exerciseGenome");
    const real = buildExerciseGenome(seatedCurl);
    const broken = { ...real, fingerprint: { ...real.fingerprint, power: Number.NaN, skill: 140 } } as ExerciseGenome;
    expect(profileSummary(broken)).not.toMatch(/power|skill/i);
    expect(profileSummary(undefined)).toBe("No analysis profile is recorded for this exercise in the catalog.");
  });
});

describe("the summary", () => {
  it("quotes the highest and lowest scores and calls nothing high or low by a threshold", () => {
    const genome = getExerciseGenome(byName("Barbell Bench Press")) as ExerciseGenome;
    const text = profileSummary(genome);
    expect(text).toMatch(/^Highest in [a-z -]+ \(\d+\) and [a-z -]+ \(\d+\); lowest in [a-z -]+ \(\d+\)\.$/);
    expect(text).toContain(`strength expression (${genome.fingerprint.strength})`);
    expect(text).toContain(`power expression (${genome.fingerprint.power})`);
  });

  it("claims no comparison with the day when the day has nothing to compare with", () => {
    const bench = byName("Barbell Bench Press");
    const empty = workoutFitSummary({ exercise: bench, context: { goal: "Max strength", currentWorkout: [] }, workoutLabel: "Week 1 · Push", redundancy: null });
    expect(empty).toBe("Nothing is in Week 1 · Push yet, so there is nothing to compare it with.");
    expect(empty).not.toMatch(/without repeating/);
    const alone = workoutFitSummary({ exercise: bench, context: { goal: "Max strength", currentWorkout: [bench] }, workoutLabel: "Week 1 · Push", redundancy: null });
    expect(alone).toBe("Already in Week 1 · Push. Nothing else is in it yet, so there is nothing to compare it with.");
    const others = [byName("Incline Dumbbell Bench Press"), byName("Cable Lateral Raise")];
    const compared = workoutFitSummary({ exercise: bench, context: { goal: "Max strength", currentWorkout: others }, workoutLabel: "Week 1 · Push", redundancy: 40 });
    expect(compared).toBe("Adds a relatively distinct exposure next to the 2 other exercises in Week 1 · Push.");
    const overlapping = workoutFitSummary({ exercise: bench, context: { goal: "Max strength", currentWorkout: others }, workoutLabel: "Week 1 · Push", redundancy: 80 });
    expect(overlapping).toMatch(/^Overlaps with the 2 other exercises in Week 1 · Push/);
  });

  it("names the movement it is read against, and says an absent mapping is an absent mapping", () => {
    const markup = draw(byName("Barbell Bench Press"), { context: { goal: "Max strength", currentWorkout: [], sportMovement: { id: "wrestling-17", sportId: "wrestling", label: "Hand fighting" } } });
    expect(markup).toContain(">At a glance<");
    expect(markup).not.toContain("Fast read");
    expect(markup).toContain("No mapped link to Hand fighting in this catalog.");
    expect(markup).not.toMatch(/Demand<\/strong> what the exercise asks/);
  });

  it("reads the goal against the same dimension the model's goal alignment uses", () => {
    expect(goalDimensionFor("Muscle growth")).toBe("hypertrophy");
    expect(goalDimensionFor("Max strength")).toBe("strength");
    expect(goalDimensionFor("Work capacity")).toBe("sfr");
    expect(goalDimensionFor("Athleticism")).toBe("power");
  });
});

describe("Exercise Genome view tabs", () => {
  it("says which of the four views is showing, as tabs that control their panels", () => {
    const markup = draw();
    const occurrences = (needle: string) => markup.split(needle).length - 1;
    expect(markup).toContain('role="tablist"');
    expect(occurrences('aria-selected="true"')).toBe(1);
    expect(occurrences('aria-selected="false"')).toBe(3);
    expect(markup).toMatch(/<button id="exercise-analysis-tab-fingerprint" type="button" role="tab" aria-selected="true" aria-controls="exercise-analysis-panel-fingerprint" tabindex="0"/);
    expect(markup).toContain('id="exercise-analysis-panel-fingerprint" role="tabpanel" aria-labelledby="exercise-analysis-tab-fingerprint"');
  });
});
