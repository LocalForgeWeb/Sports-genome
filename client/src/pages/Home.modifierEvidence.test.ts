import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let workspace = "recommended";
let stateCalls = 0;

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    default: actual,
    useState: <T,>(initial: T) => {
      const call = stateCalls++;
      const initialValue = typeof initial === "function" ? (initial as unknown as () => T)() : initial;
      const value = call === 0 ? workspace : call === 6 ? true : initialValue;
      return [value as T, vi.fn()] as [T, ReturnType<typeof vi.fn>];
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
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("Home planning-surface modifier evidence", () => {
  beforeEach(() => { stateCalls = 0; });

  for (const target of ["recommended", "custom", "day-plan"] as const) {
    it(`renders selected modifier sources in the ${target} planning surface`, async () => {
      workspace = target;
      const { default: Home } = await import("./Home");
      const markup = renderToStaticMarkup(createElement(Home));

      expect(markup).toContain("Active sport modifier evidence");
      expect(markup).toContain("recommendations, smart drafts, and generated weeks");
      expect(markup).toContain("General sport evidence inventory");
      expect(markup).toContain("Automatic stack filter");
      expect(markup).toContain("active training days");
      expect(markup).toContain("Sport-to-program hierarchy");
      expect(markup).toContain("Movement:");
      expect(markup).toContain("Physiological demand:");
      expect(markup).toContain("Physical quality");
      expect(markup).toContain("Adaptation target:");
      expect(markup).toContain("Modality:");
      expect(markup).toContain("Exercise role:");
      expect(markup).toContain("Programming boundary");
      if (target === "recommended") expect(markup).toContain("Hierarchy trace");
    });
  }

  it("renders the selected Exercise Genome primary-muscle handoff to Body Lab", async () => {
    workspace = "genome";
    const { default: Home } = await import("./Home");
    const markup = renderToStaticMarkup(createElement(Home));

    expect(markup).toContain("Open leading muscle in Body Lab");
  });
});
