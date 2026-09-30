// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A lift is read against the body weight saved with it. The quiz asks for a weight, but it
 * only reached the weight log on the next launch, dated that launch - so a workout finished
 * in the same session as onboarding had no weight in effect, then or ever after.
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

import Home from "@/pages/Home";
import { bodyWeightKgAt, loadBodyWeightLog } from "@/lib/bodyWeightLog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const settle = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); }); };
const advance = () => fireEvent.click(screen.getByRole("button", { name: /^(Continue|Skip for now)$/ }));

/** Answers the quiz with its defaults and no sport, typing `weight` (in pounds, the default) if given. */
async function finishOnboarding(weight?: string) {
  render(createElement(Home));
  await screen.findByRole("button", { name: /^(Continue|Skip for now)$/ }, { timeout: 15000 });
  advance();
  fireEvent.click(screen.getByRole("button", { name: /General strength and resilience/ }));
  for (let guard = 0; guard < 20 && !screen.queryByText("if you want."); guard += 1) advance();
  if (weight) fireEvent.change(screen.getByRole("textbox", { name: "Body weight in lb" }), { target: { value: weight } });
  advance();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Open my plan" })); });
  await settle();
}

beforeEach(() => { window.localStorage.clear(); window.history.replaceState({}, "", "/?workspace=command"); });
afterEach(() => cleanup());

describe("The weight given at onboarding", () => {
  it("is in the weight log as soon as onboarding finishes, so a lift logged straight after is read against it", async () => {
    await finishOnboarding("180");
    const log = loadBodyWeightLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ enteredUnit: "lb", source: "onboarding" });
    expect(bodyWeightKgAt(log, new Date(Date.now() + 60_000))).toBeCloseTo(81.65, 1);

    // The next launch reads the saved profile, and its seed leaves the entry as it is.
    cleanup();
    render(createElement(Home));
    await screen.findByRole("heading", { level: 1 }, { timeout: 15000 });
    await settle();
    expect(loadBodyWeightLog()).toEqual(log);
  });

  it("adds nothing when the athlete skipped it", async () => {
    await finishOnboarding();
    expect(loadBodyWeightLog()).toEqual([]);
  });
});
