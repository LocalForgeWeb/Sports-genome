import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("./AnatomyMap.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../anatomy-clean.css", import.meta.url), "utf8");

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
    expect(source).toContain("anatomyRoleRenderState");
    expect(source).toContain("anatomyRoleRenderState.primary");
    expect(source).toContain("anatomyRoleRenderState.supporting");
    expect(source).not.toContain("heatSolid");
    expect(source).not.toContain("muscleScoreIntensity");
    expect(source).toContain("qualitative role map");
    expect(source).not.toContain("involvement heat map");
  });

  it("keeps the default anatomy canvas concise while preserving its qualitative-role boundary", () => {
    expect(source).toContain("Selected action <em>role map.</em>");
    expect(source).toContain("Color shows qualitative action roles, not activation or strength.");
    expect(source).not.toContain("Precise anatomical SVG with 70+ muscle regions");
    expect(source).not.toContain("See the work. <em>Then inspect the why.</em>");
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

  it("groups compact role rows by importance and progressively discloses lower-priority worked muscles", async () => {
    const { AnatomyMap } = await import("./AnatomyMap");
    const markup = renderToStaticMarkup(createElement(AnatomyMap, {
      primary: ["chest", "front delts", "triceps", "abs", "quads", "glutes"],
      secondary: ["serratus anterior", "obliques"],
      onSelect: vi.fn(),
    }));

    expect(markup).toContain("Key muscle roles");
    expect(markup).toContain("muscles involved");
    expect(markup).toContain("Primary movers");
    expect(markup).toContain("+ 3 supporting muscles");
    expect(markup).toContain("How muscle roles are classified");
    expect(markup).toContain("Supporting role");
    expect(markup).toContain("Primary role");
  });

  it("uses source-recorded action phase context instead of fabricating timing or force values", () => {
    expect(source).toContain("Action phase context");
    expect(source).toContain("qualitative contraction-phase description");
  });

  it("orders rendered Key Muscle Roles from source-recorded qualitative role order rather than a numeric heat score", () => {
    expect(source).toContain("detail?.roleOrder.indexOf(firstRole)");
    expect(source).toContain("const fallbackOrder: Record<Role, number>");
    expect(source).not.toContain("muscleScores?.[entry.key]");
  });

  it("renders qualitative primary, stabilizer, and synergist roles in their supplied phase-sensitive order", async () => {
    const { AnatomyMap } = await import("./AnatomyMap");
    const roleOrder = ["Primary Mover", "Stabilizer", "Synergist", "Supporting"] as const;
    const roleDetails = {
      glutes: { roles: ["Primary Mover"], roleOrder: [...roleOrder], confidence: "Direct evidence", sourceScope: "Movement-specific evidence" as const, sources: [], explanation: "Propulsion context." },
      obliques: { roles: ["Stabilizer"], roleOrder: [...roleOrder], confidence: "Strong indirect evidence", sourceScope: "Movement-specific evidence" as const, sources: [], explanation: "Bracing context." },
      hamstrings: { roles: ["Synergist"], roleOrder: [...roleOrder], confidence: "Moderate biomechanical inference", sourceScope: "Movement-specific evidence" as const, sources: [], explanation: "Assisting context." },
    };
    const markup = renderToStaticMarkup(createElement(AnatomyMap, { primary: ["glutes"], secondary: ["obliques", "hamstrings"], roleDetails, onSelect: vi.fn() }));

    expect(markup.indexOf("Gluteal complex")).toBeLessThan(markup.indexOf("External oblique"));
    expect(markup.indexOf("External oblique")).toBeLessThan(markup.indexOf("Hamstrings"));
    expect(markup).toContain("Stabilizers");
    expect(markup).not.toContain("Stabilizer · Strong indirect evidence");
  });

  it("forces the third-party portrait SVG to fit the full mobile canvas height without clipping", () => {
    expect(styles).toContain(".atlas-body-chart svg{height:100%!important;width:auto!important;max-width:100%!important;max-height:100%;object-fit:contain}");
    expect(styles).toContain(".atlas-body-chart-wrap{min-height:clamp(440px,138vw,560px);border-radius:12px}");
    expect(styles).toContain(".atlas-body-chart{height:clamp(440px,138vw,560px)}");
  });
});
