import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("./AnatomyMap.tsx", import.meta.url), "utf8");

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
  it("uses categorical role states instead of a numeric heat scale", () => {
    expect(source).toContain('applyKey(key, 9)');
    expect(source).toContain('applyKey(key, 6)');
    expect(source).not.toContain("heatSolid");
    expect(source).not.toContain("muscleScoreIntensity");
  });

  it("renders a visible, selectable in-app vector fallback when the detailed anatomy chart is unavailable", async () => {
    const { VectorAnatomyFallback } = await import("./AnatomyMap");
    const markup = renderToStaticMarkup(createElement(VectorAnatomyFallback, {
      view: "FRONT",
      ranked: [{ key: "chest", label: "Pectoralis major", role: "Primary" }],
      onSelect: vi.fn(),
      onRetry: vi.fn(),
    }));

    expect(markup).toContain("Vector anatomy fallback");
    expect(markup).toContain("Pectoralis major · Primary role · Low-confidence inference");
    expect(markup).toContain("Retry detailed anatomy chart");
  });

  it("renders role-only fallback context without fabricating an involvement percentage", async () => {
    const { VectorAnatomyFallback } = await import("./AnatomyMap");
    const markup = renderToStaticMarkup(createElement(VectorAnatomyFallback, {
      view: "BACK",
      ranked: [{ key: "lats", label: "Latissimus dorsi", role: "Primary" }],
      onSelect: vi.fn(),
      onRetry: vi.fn(),
    }));

    expect(markup).toContain("Latissimus dorsi · Primary role");
    expect(markup).not.toContain("Latissimus dorsi · 90%");
  });

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

  it("uses qualitative role context without rendering numeric role indices when exercise or stack context is supplied", () => {
    expect(source).toContain('hasLinkedExerciseOrStackContext = selectedKey ? muscleScores?.[selectedKey] != null : false');
    expect(source).toContain("Exercise / stack context");
    expect(source).toContain("The role shown remains qualitative");
    expect(source).not.toContain("Relative model index");
    expect(source).not.toContain("Tier</i>");
    expect(source).not.toContain('selectedKey ? (muscleScores?.[selectedKey] ?? (matches(selectedKey, primary) ? 90 : 55)) : 0');
  });

  it("keeps the anatomy canvas focused by progressively disclosing lower-ranked worked muscles", async () => {
    const { AnatomyMap } = await import("./AnatomyMap");
    const markup = renderToStaticMarkup(createElement(AnatomyMap, {
      primary: ["chest", "front delts", "triceps", "abs", "quads", "glutes"],
      secondary: ["serratus anterior", "obliques"],
      onSelect: vi.fn(),
    }));

    expect(markup).toContain("Key muscle roles");
    expect(markup).toContain("Expand only when you need the lower-ranked relevant muscles.");
    expect(markup).toContain("Show 3 more muscle roles");
    expect(markup).toContain("How muscle roles are classified");
    expect(markup).toContain("Supporting role");
    expect(markup).toContain("Primary role");
  });

  it("uses source-recorded action phase context instead of fabricating timing or force values", () => {
    expect(source).toContain("Action phase context");
    expect(source).toContain("qualitative contraction-phase description");
  });
});
