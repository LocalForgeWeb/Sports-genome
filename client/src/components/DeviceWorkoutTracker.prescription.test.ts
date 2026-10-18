// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { getGoalPrescription } from "@/lib/workoutPlanner";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * One set count for an unset prescription (Backend V1 TR-05, B093, B114). The Plan showed
 * "4 × 3–6" for the first two exercises of an athleticism day while the tracker started
 * "3 × 8–12", so a day planned at 14 sets began as a 12-set workout.
 */
beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

describe("A workout started from an unset plan", () => {
  it("takes the Plan's goal default for each exercise's place in the day", () => {
    const workout = exercises.slice(0, 3);
    render(createElement(DeviceWorkoutTracker, { workout, prescriptions: {}, settings: {}, goal: "Athleticism", dayLabel: "Day 01 · Legs" }));
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    const [session] = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]") as DeviceWorkoutSession[];
    expect(session.exercises.map((exercise) => exercise.plannedPrescription)).toEqual([0, 1, 2].map((index) => getGoalPrescription("Athleticism", index)));
    expect(session.exercises.map((exercise) => exercise.sets.length)).toEqual([4, 4, 3]);
  });
});

describe("Every Training Day surface is handed the same prescriptions", () => {
  it("passes the resolved map to the picker and the review panels, and the saved map to the tracker, which reads it the same way", () => {
    const home = readFileSync(`${process.cwd()}/client/src/pages/Home.tsx`, "utf8");
    expect(home).toContain("[exercise.id, prescriptionFor(exercise, index, goal, prescriptions[exercise.id])])),");
    // Home's reading is the planner's one reading, with the exercise's measure.
    expect(home).toContain("return prescriptionOf(saved, index, goal, catalogMeasureOf(catalogIdOf(exercise)));");
    expect(home.match(/prescriptions=\{dayPrescriptions\}/g)).toHaveLength(4);
    const tracker = home.split("\n").filter((line) => line.includes("<DeviceWorkoutTracker "));
    expect(tracker).toHaveLength(1);
    expect(tracker[0]).toContain("prescriptions={prescriptions}");
    expect(home.match(/prescriptions=\{prescriptions\}/g)).toHaveLength(1);
    // The tracker resolves every entry through that same function.
    const source = readFileSync(`${process.cwd()}/client/src/components/DeviceWorkoutTracker.tsx`, "utf8");
    expect(source).toContain("prescription: prescriptionOf(prescriptions[exercise.id], index, goal, policy.measure)");
  });

  it("gives the tracker the very sets the resolved map gives every other surface", () => {
    const workout = [exercises.find((exercise) => exercise.id === 143)!, ...exercises.slice(0, 2)];
    render(createElement(DeviceWorkoutTracker, { workout, prescriptions: {}, settings: {}, goal: "Max strength", dayLabel: "Day 01 · Pull" }));
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    const [session] = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]") as DeviceWorkoutSession[];
    // A hang in first place: the goal's 4 sets, as a hold's target; the rest as the goal says.
    expect(session.exercises.map((exercise) => exercise.plannedPrescription)).toEqual(["4 × 30 sec", getGoalPrescription("Max strength", 1), getGoalPrescription("Max strength", 2)]);
  });
});
