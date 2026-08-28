import React, { createElement } from "react";
import { readFileSync } from "node:fs";
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

describe("Home decision-first planning surfaces", () => {
  beforeEach(() => { stateCalls = 0; });

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
      expect(markup).not.toContain("Programming boundary");
    });
  }

  it("renders the selected Exercise Genome primary-muscle handoff to Body Lab", async () => {
    workspace = "genome";
    const { default: Home } = await import("./Home");
    const markup = renderToStaticMarkup(createElement(Home));

    expect(markup).toContain("Exercise Genome");
    expect(readFileSync(new URL("./Home.tsx", import.meta.url), "utf8")).toContain("<ExerciseGenomeWorkspace");
    expect(readFileSync(new URL("../components/ExerciseGenomeWorkspace.tsx", import.meta.url), "utf8")).toContain("Open leading muscle in Body Lab");
  });
});
