// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Body Lab's muscle roles are worked out from the enriched movement record,
 * which is not cheap. Computed inline, Home worked them out again on every
 * render, and the muscle count memo keyed on the result never held. They are
 * now worked out once per sport and action, and again only when either changes,
 * including when the athlete browses another sport.
 */

vi.mock("sonner", () => {
  const record = () => {};
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, error: null, isAuthenticated: false, logout: async () => {}, refresh: async () => ({}) }),
}));
vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClient: () => null, supabaseConfigured: false }));
vi.mock("@/lib/trpc", () => {
  const query = () => ({ data: undefined, isLoading: false, isPending: false, isError: false, isFetching: false, error: null, refetch: async () => ({}) });
  const mutation = () => ({ mutate: () => {}, mutateAsync: async () => ({ status: "saved", revision: 1, updatedAt: new Date() }), isPending: false, error: null, reset: () => {} });
  const node: unknown = new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === "useQuery" || prop === "useSuspenseQuery") return query;
      if (prop === "useMutation") return mutation;
      if (prop === "then") return undefined;
      return node;
    },
    apply() { return node; },
  });
  return { trpc: new Proxy({}, { get(_target, prop) { return prop === "useUtils" || prop === "useContext" ? () => node : node; } }) };
});
vi.mock("@/lib/bodyLabRoleContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bodyLabRoleContext")>();
  return { ...actual, getBodyLabRoleContext: vi.fn(actual.getBodyLabRoleContext) };
});

import Home from "@/pages/Home";
import { getBodyLabRoleContext } from "@/lib/bodyLabRoleContext";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const roleContext = vi.mocked(getBodyLabRoleContext);
const roleRows = () => Array.from(document.querySelectorAll(".atlas-role-rows .atlas-role-row")).map((row) => row.textContent);

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ version: 3, sportId: "wrestling", sportContextMode: "sport", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" } }));
  roleContext.mockClear();
});
afterEach(() => { cleanup(); });

// The Body Lab draws a full anatomy map, which makes role queries over the
// whole page slow in jsdom, so its controls are found directly.
describe("Body Lab muscle roles", () => {
  it("are worked out once per sport and action, not on renders that change neither", async () => {
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    const firstRow = await waitFor(() => { const row = document.querySelector<HTMLButtonElement>(".atlas-role-rows .atlas-role-row"); if (!row) throw new Error("Body Lab not ready"); return row; }, { timeout: 15000 });
    expect(roleContext).toHaveBeenCalled();
    expect(roleContext.mock.calls.every(([sportId]) => sportId === "wrestling")).toBe(true);
    const wrestlingRows = roleRows();

    // Picking a muscle re-renders Home; the sport and the action are unchanged.
    const callsBefore = roleContext.mock.calls.length;
    await act(async () => { fireEvent.click(firstRow); });
    expect(document.querySelector(".atlas-role-rows .atlas-role-row.is-selected")).not.toBeNull();
    expect(document.querySelector(".body-lab-next-step")?.textContent).not.toContain("Choose a muscle above");
    expect(roleContext.mock.calls.length).toBe(callsBefore);

    // Browsing another sport is a change of sport, so the roles are worked out for it.
    await act(async () => { fireEvent.click(document.querySelector(".body-lab-selection-change")!); });
    await act(async () => { fireEvent.change(document.querySelector("#body-lab-selection-controls select")!, { target: { value: "soccer" } }); });
    expect(roleContext.mock.calls.slice(callsBefore).some(([sportId]) => sportId === "soccer")).toBe(true);
    expect(roleRows()).not.toEqual(wrestlingRows);
  }, 30000);
});
