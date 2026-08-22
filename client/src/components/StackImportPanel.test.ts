import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { parseRoutine, StackImportPanel } from "./StackImportPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("routine import confidence editing", () => {
  it("preserves named days, prescriptions, effort, rest, and plan context across a multi-day routine", () => {
    const routine = parseRoutine(`Push Day\nBarbell Bench Press — 3 x 8 @ RPE 8 · Rest 120 sec\nWarm-up: band shoulder series\n\nLower Day\nRomanian Deadlift — 4 x 6 @ RPE 7\nNotes: deliberate eccentric`, {});

    expect(routine.days).toHaveLength(2);
    expect(routine.days[0]).toMatchObject({ label: "Push", items: [{ exercise: { name: "Barbell Bench Press" }, prescription: "3 × 8", rpe: "RPE 8", rest: "120 sec" }] });
    expect(routine.days[0].context).toEqual([{ raw: "Warm-up: band shoulder series", kind: "warm-up" }]);
    expect(routine.days[1]).toMatchObject({ label: "Lower", items: [{ exercise: { name: "Romanian Deadlift" }, prescription: "4 × 6", rpe: "RPE 7" }] });
    expect(routine.days[1].context).toEqual([{ raw: "Notes: deliberate eccentric", kind: "plan note" }]);
  });

  it("renders a reviewed import flow that preserves programming details and resolves ambiguity before loading", () => {
    const markup = renderToStaticMarkup(createElement(StackImportPanel, { onClose: vi.fn(), onImport: vi.fn() }));
    expect(markup).toContain("Paste the full plan.");
    expect(markup).toContain("optional sets, reps, RPE, rest, or notes");
    expect(markup).toContain("ambiguous exercise names can be corrected before loading");
    expect(markup).toContain("Exercises and plan context are separated.");
    expect(markup).toContain("Exact catalog match");
  });
});
