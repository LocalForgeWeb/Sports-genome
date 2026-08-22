import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StackImportPanel } from "./StackImportPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("routine import confidence editing", () => {
  it("renders a reviewed import flow that preserves programming details and resolves ambiguity before loading", () => {
    const markup = renderToStaticMarkup(createElement(StackImportPanel, { onClose: vi.fn(), onImport: vi.fn() }));
    expect(markup).toContain("Paste the full plan.");
    expect(markup).toContain("optional sets, reps, RPE, rest, or notes");
    expect(markup).toContain("ambiguous exercise names can be corrected before loading");
    expect(markup).toContain("Exercises and plan context are separated.");
    expect(markup).toContain("Exact catalog match");
  });
});
