import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let workspace = "recommended";
let falseStates = 0;

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * renderToStaticMarkup runs no effects, so two pieces of Home state have to be
 * forced or every render returns the onboarding quiz instead of the surface under
 * test. Both are identified by their initial value rather than by call order:
 * an earlier version keyed off absolute useState indices, and adding one state to
 * Home silently turned all of these assertions into quiz renders.
 */
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    default: actual,
    useState: <T,>(initial: T) => {
      const initialValue = typeof initial === "function" ? (initial as unknown as () => T)() : initial;
      // workspaceFromLocation falls back to "command", and no other state starts there.
      if (initialValue === "command") return [workspace as T, vi.fn()] as [T, ReturnType<typeof vi.fn>];
      // onboardingComplete is the first state Home initialises to false.
      if (initialValue === false && falseStates++ === 0) return [true as T, vi.fn()] as [T, ReturnType<typeof vi.fn>];
      return [initialValue, vi.fn()] as [T, ReturnType<typeof vi.fn>];
    },
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, name: "Test athlete" }, loading: false, error: null, isAuthenticated: true, logout: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    favorites: {
      list: { useQuery: () => ({ data: [] }) },
      set: { useMutation: () => ({ mutate: vi.fn() }) },
    },
    sportsGenome: {
      profile: { useQuery: () => ({ data: undefined }) },
    },
    // The target catalog is optional context: undefined is the unavailable state the quiz
    // renders, so this mock also covers the failure path.
    resilience: {
      targetCatalog: { useQuery: () => ({ data: undefined }) },
    },
    // Plan sync is disabled in these tests (no auth), but the hook still resolves
    // the procedures on render.
    workoutPlan: {
      get: { useQuery: () => ({ data: null, isLoading: false, isError: false }) },
      save: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("Home decision-first planning surfaces", () => {
  beforeEach(() => { falseStates = 0; });

  for (const target of ["recommended", "custom", "day-plan"] as const) {
    it(`keeps equipment and methodology detail off the initial ${target} planning surface`, async () => {
      workspace = target;
      const { default: Home } = await import("./Home");
      const markup = renderToStaticMarkup(createElement(Home));

      expect(markup).not.toContain("Active sport modifier evidence");
      expect(markup).not.toContain("Automatic stacks:");
      expect(markup).not.toContain('aria-label="Edit available equipment"');
      expect(markup).not.toContain("Sport-to-program hierarchy");
      expect(markup).not.toContain("Physiological demand:");
      expect(markup).not.toContain("Planning note:");
    });
  }

  it("lands an old Genome link on the Exercises page, where the overlay carries the muscle handoff", async () => {
    workspace = "catalog";
    const { default: Home, workspaceFromLocation } = await import("./Home");
    expect(workspaceFromLocation("genome")).toBe("catalog");
    const markup = renderToStaticMarkup(createElement(Home));
    /**
     * The Genome page is gone: its per-exercise analysis, evidence and the
     * handoff to Body Lab live in the exercise overlay, opened from Exercises.
     * Static markup can prove the destination and the current tab.
     */
    expect(markup).toContain('class="apex-shell shell-body');
    expect(markup).toMatch(/aria-current="page"[^>]*>Exercises</);
    expect(readFileSync(new URL("./Home.tsx", import.meta.url), "utf8")).toContain("Explore in Body Lab");
  });
});
