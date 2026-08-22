import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SplitDraftControls } from "./SplitDraftControls";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("SplitDraftControls", () => {
  it("keeps the planner compact, dismissible, and repositionable without leaving the builder", () => {
    const markup = renderToStaticMarkup(createElement(SplitDraftControls, {
      days: ["Push", "Pull"], activeDay: "Push", activeLoadout: "Athletic Power",
      onDay: () => undefined, onLoadout: () => undefined, onDraft: () => undefined,
      onClose: () => undefined, onMove: () => undefined,
    }));
    expect(markup).toContain('aria-label="Move planner"');
    expect(markup).toContain('aria-label="Close planner"');
    expect(markup).toContain("Collapse planner");
    expect(markup).toContain("Draft without leaving your work.");
  });
});
