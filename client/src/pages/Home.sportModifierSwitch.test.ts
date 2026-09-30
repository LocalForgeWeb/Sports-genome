// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A role or style belongs to the sport it was chosen in. Only Profile's sport
 * select used to clear it; Matches and "Make X my sport" kept it, and because
 * ids repeat across sports a Freestyle wrestler who switched to swimming was
 * ranked as a freestyle swimmer without ever choosing that stroke.
 */

type ToastOptions = { description?: string; action?: { label: string; onClick: () => void } };
const toasts: { title: string; options?: ToastOptions }[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: ToastOptions) => { toasts.push({ title, options }); };
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
import { getSportModifiers } from "@/lib/hierarchicalSportModel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const savedModifier = () => JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null")?.baseline?.sportModifierId;
const lensNote = () => document.querySelector(".matches-lens-note")?.textContent || "";

const saveWrestler = (sportModifierId?: string) => window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ version: 3, sportId: "wrestling", sportContextMode: "sport", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", ...(sportModifierId ? { sportModifierId } : {}) } }));

beforeEach(() => {
  window.localStorage.clear();
  toasts.length = 0;
  saveWrestler("freestyle");
});
afterEach(() => { cleanup(); });

describe("Changing sport from Matches", () => {
  it("drops the old sport's style, even where the new sport has one with the same id, and Undo brings it back", async () => {
    // Why an id cannot travel: the same one names a different thing in each sport.
    expect(getSportModifiers("wrestling").some((modifier) => modifier.id === "freestyle")).toBe(true);
    expect(getSportModifiers("swimming").some((modifier) => modifier.id === "freestyle")).toBe(true);

    window.history.replaceState({}, "", "/?workspace=recommended");
    render(createElement(Home));
    const select = await screen.findByRole("combobox", { name: "Sport" }, { timeout: 15000 });
    // Intentional change, Sep 28 regression brief §11: the priorities are named as the sport's,
    // not as what ranks this list.
    expect(lensNote()).toMatch(/from Wrestling, freestyle\. They shape your plan's drafts, not this list\.$/);

    await act(async () => { fireEvent.change(select, { target: { value: "swimming" } }); });
    expect(lensNote()).toMatch(/from Swimming, general sport profile\. They shape your plan's drafts, not this list\.$/);
    expect(savedModifier()).toBeUndefined();

    const changed = toasts.find((entry) => entry.title === "Sport changed");
    expect(changed?.options?.description).toMatch(/role or style/);
    await act(async () => { changed!.options!.action!.onClick(); });
    expect(lensNote()).toMatch(/from Wrestling, freestyle\. They shape your plan's drafts, not this list\.$/);
    expect(savedModifier()).toBe("freestyle");
  });
});

describe("What a sport change says it cleared", () => {
  it("does not claim a role or style was cleared when the athlete never chose one", async () => {
    saveWrestler();
    window.history.replaceState({}, "", "/?workspace=recommended");
    render(createElement(Home));
    const select = await screen.findByRole("combobox", { name: "Sport" }, { timeout: 15000 });
    await act(async () => { fireEvent.change(select, { target: { value: "swimming" } }); });

    const changed = toasts.find((entry) => entry.title === "Sport changed");
    expect(changed?.options?.description).toBe("Saved training days for the previous sport were cleared.");
  });
});

describe("Making a browsed sport your own says what it clears before the tap", () => {
  // The Body Lab draws a full anatomy map, which makes role queries over the
  // whole page slow in jsdom; the navigator's own controls are found directly.
  const browseTo = async (sportId: string) => {
    window.history.replaceState({}, "", "/?workspace=body");
    render(createElement(Home));
    const change = await waitFor(() => { const button = document.querySelector<HTMLButtonElement>(".body-lab-selection-change"); if (!button) throw new Error("Body Lab not ready"); return button; }, { timeout: 15000 });
    await act(async () => { fireEvent.click(change); });
    await act(async () => { fireEvent.change(document.querySelector("#body-lab-selection-controls select")!, { target: { value: sportId } }); });
    const adopt = document.querySelector(".sport-browse-notice-adopt");
    expect(adopt?.textContent).toMatch(/^Make .+ my sport/);
    return document.getElementById(adopt!.getAttribute("aria-describedby")!)?.textContent ?? "";
  };

  it("names the role or style a Freestyle wrestler would lose", async () => {
    expect(await browseTo("soccer")).toMatch(/clears your saved training days and your role or style\./);
  }, 30000);

  it("names only the days when there is no role or style to lose", async () => {
    saveWrestler();
    const consequence = await browseTo("soccer");
    expect(consequence).toMatch(/clears your saved training days\./);
    expect(consequence).not.toContain("role or style");
  }, 30000);
});
