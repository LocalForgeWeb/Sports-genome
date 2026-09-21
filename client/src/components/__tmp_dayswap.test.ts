// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExercisePrescriptionRow } from "./ExercisePrescriptionRow";

const exercise = exercises.find((item) => item.name === "Barbell Bench Press") || exercises[0];
const props = (prescription: string) => ({
  exercise, index: 0, prescription,
  settings: { rpe: "RPE 8", rest: "90 sec", notes: "", completed: false },
  onPrescription: vi.fn(), onSettings: vi.fn(), onInspect: vi.fn(), onRemove: vi.fn(),
});

describe("day swap", () => {
  it("resets per-set mode when the prescription prop changes", () => {
    const { rerender } = render(React.createElement(ExercisePrescriptionRow, props("3 × 8")));
    fireEvent.click(screen.getByRole("button", { name: "Vary by set" }));
    expect(screen.queryByLabelText(`${exercise.name} set 3 repetitions`)).toBeTruthy();
    rerender(React.createElement(ExercisePrescriptionRow, props("4 × 5")));
    expect(screen.queryByLabelText(`${exercise.name} set 3 repetitions`)).toBeNull();
    expect(screen.queryByRole("button", { name: "Same every set" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Vary by set" })).toBeTruthy();
    expect((screen.getByLabelText(`${exercise.name} repetitions or target, every set`) as HTMLInputElement).value).toBe("5");
  });
});
