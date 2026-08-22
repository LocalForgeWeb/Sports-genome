import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  let calls = 0;
  return {
    ...actual,
    default: actual,
    useState: <T,>(initial: T) => {
      const value = calls++ === 1 ? "hamstrings" : initial;
      return [value as T, vi.fn()] as [T, ReturnType<typeof vi.fn>];
    },
  };
});

describe("Body Lab architecture mechanics disclosure", () => {
  it("renders selected-muscle architecture, leverage, source, and model boundary context", async () => {
    const { AnatomyMap } = await import("./AnatomyMap");
    const markup = renderToStaticMarkup(createElement(AnatomyMap, {
      primary: ["hamstrings"],
      secondary: [],
      onSelect: vi.fn(),
    }));

    expect(markup).toContain("Architecture + leverage context");
    expect(markup).toContain("not mechanically interchangeable");
    expect(markup).toContain("PMID 30117053");
    expect(markup).toContain("force or injury risk");
  });
});
