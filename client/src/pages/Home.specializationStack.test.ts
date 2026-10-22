// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Home's side of the stack (docs/specialization-atlas/11-forearm-research-and-stack.md §3.2, §3.7):
 * a batch of plan changes from the specialization page, applied together or not at all, into the
 * exact week (the one Plan has open or a stored one), with one notice and one Undo that takes every
 * change back on the days as they stand when it is pressed; About me's area answer handed to the
 * page; and Plan's "Week N generated" notice saying that a stack in an earlier week is not in the
 * new one. The page's use of all this is the stack card's (lane S4), so the page is a stand-in here
 * that shows what Home handed it and lets the test call it.
 */

type ToastOptions = { id?: string; description?: unknown; action?: { label: string; onClick: () => void }; cancel?: { label: string; onClick: () => void } };
const toasts = vi.hoisted(() => [] as { title: string; options?: ToastOptions }[]);
vi.mock("sonner", () => {
  const record = (title: string, options?: ToastOptions) => { toasts.push({ title, options }); };
  return { toast: Object.assign(record, { success: record, error: record, message: record, dismiss: () => {} }), Toaster: () => null };
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

/** The page, as a stand-in: Home still loads it lazily, and it keeps the props of its latest render. */
type PageProps = SpecializationPanelProps & Partial<SpecializationStackProps>;
const page = vi.hoisted(() => ({ props: null as unknown }));
vi.mock("@/components/specialization/SpecializationPanel", async () => {
  const react = await import("react");
  return {
    SpecializationPanel: (props: PageProps) => {
      page.props = props;
      const { regionId, mode, planWeek, open } = props.state;
      return react.createElement("section", { "aria-label": "Specialization page" }, `${regionId} · ${mode} · ${planWeek ?? "training week"} · ${open ?? "nothing asked open"}`);
    },
  };
});

import Home from "@/pages/Home";
import type { SpecializationPanelProps } from "@/components/specialization/SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import type { SpecializationPlanBatch, SpecializationPlanBatchChange, SpecializationPlanBatchResult, SpecializationStackProps } from "@/lib/specialization/viewState";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!("IntersectionObserver" in globalThis)) (globalThis as Record<string, unknown>).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

const PROFILE_KEY = "gym-optimizer-athlete-profile-v1";
const PLAN_KEY = "gym-optimizer-workout-plan-v1";
const STACKS_KEY = "sports-genome-specialization-stacks-v1";
const [e0, e1, e2, e3] = exercises;
const WRIST_CURL = 139;
const REVERSE_WRIST_CURL = 140;
const HAMMER_CURL = 132;
const nameOf = (id: number) => exercises.find((exercise) => exercise.id === id)!.name;

type Focus = { targetKey: string; constraintType: string };
const profile = (focus?: Focus) => JSON.stringify({
  version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb" },
  ...(focus ? { capacityFocus: { focus: { targetKey: focus.targetKey, intent: "build_capacity", laterality: "bilateral" }, constraint: { ...focus, laterality: "bilateral" }, reportedSignals: [] } } : {}),
});
const weekWith = (days: Record<string, number[]>) => ({ customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(days).map(([key, ids]) => [key, ids.map((id) => ({ entryId: id, catalogExerciseId: id }))])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 });
// Week 1, the one Plan has open on Day 01 · Push: Push holds two exercises, Pull one. Week 2 is stored.
const week1 = weekWith({ "0-Push": [e0.id, e1.id], "1-Pull": [e2.id] });
const week2 = weekWith({ "0-Push": [e2.id] });
const plan = JSON.stringify({ version: 2, ...week1, weeks: { "1": week1, "2": week2 }, activeWeek: 1 });
/** A stack the stack card added to Week 1, as its device record keeps it (§3.9). */
const stackRecord = JSON.stringify({ regions: [{ regionId: "forearm", total: 14, settings: {}, updatedAt: "2026-10-21T10:00:00.000Z" }], stacks: [{ id: "stack-1", regionId: "forearm", planWeek: 1, mappingVersion: "forearm_mappings_v1", total: 14, createdAt: "2026-10-21T10:00:00.000Z", settings: {}, entries: [{ dayKey: "0-Push", catalogExerciseId: WRIST_CURL, prescription: "1 × 10–25" }] }] });

const tick = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
const storedWeek = (week: number) => JSON.parse(window.localStorage.getItem(PLAN_KEY) ?? "{}").weeks?.[String(week)] ?? {};
const dayIds = (week: number, key: string) => ((storedWeek(week).weeklyPlanEntries?.[key] ?? []) as { catalogExerciseId: number }[]).map((entry) => entry.catalogExerciseId);
const dayPrescriptions = (week: number, key: string) => (storedWeek(week).weeklyPrescriptions?.[key] ?? {}) as Record<string, string>;
const planAddToasts = () => toasts.filter((item) => item.options?.id === "plan-add");
const props = () => page.props as PageProps;
const add = (dayKey: string, catalogExerciseId: number, prescription: string): SpecializationPlanBatchChange => ({ kind: "add", dayKey, catalogExerciseId, prescription });
/** Three adds over two days: Wrist Curl and Reverse Wrist Curl on Day 01, Hammer Curl on Day 02. */
const stackBatch = (week: number): SpecializationPlanBatch => ({ week, changes: [add("0-Push", WRIST_CURL, "1 × 10–25"), add("0-Push", REVERSE_WRIST_CURL, "1 × 10–25"), add("1-Pull", HAMMER_CURL, "3 × 8–12")] });

beforeEach(() => {
  toasts.length = 0;
  page.props = null;
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_KEY, profile());
  window.localStorage.setItem(PLAN_KEY, plan);
});
afterEach(() => { cleanup(); });

/** Opens the page and waits for it; the page is loaded lazily, so it is found outside act. */
async function openPage(query = "region=forearm") {
  window.history.replaceState({}, "", `/?workspace=specialization&${query}`);
  render(createElement(Home));
  await screen.findByRole("region", { name: "Specialization page" }, { timeout: 15000 });
  await tick();
}

async function apply(batch: SpecializationPlanBatch): Promise<SpecializationPlanBatchResult> {
  let result: SpecializationPlanBatchResult | undefined;
  await act(async () => { result = props().onApplyPlanChanges!(batch); });
  await tick();
  return result!;
}

describe("a batch from the specialization page, as Home writes it", () => {
  it("writes nothing before it is applied; then writes three adds over two days of the open week, says so once, and one Undo takes them all back", async () => {
    await openPage();
    expect(typeof props().onApplyPlanChanges).toBe("function");
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
    expect(planAddToasts()).toEqual([]);

    const result = await apply(stackBatch(1));
    const title = "Added 5 sets: 3 exercises on Day 01, Day 02 of Week 1";
    expect(result).toMatchObject({ ok: true, message: title });
    // Day 01 is the day Plan has open (its working draft); Day 02 is stored: both are written, once each.
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id, WRIST_CURL, REVERSE_WRIST_CURL]);
    expect(dayPrescriptions(1, "0-Push")).toEqual({ [WRIST_CURL]: "1 × 10–25", [REVERSE_WRIST_CURL]: "1 × 10–25" });
    expect(dayIds(1, "1-Pull")).toEqual([e2.id, HAMMER_CURL]);
    expect(dayPrescriptions(1, "1-Pull")).toEqual({ [HAMMER_CURL]: "3 × 8–12" });
    expect(dayIds(2, "0-Push")).toEqual([e2.id]);

    // One notice, in the design's words, every option named (sonner merges notices that share an id).
    expect(planAddToasts()).toHaveLength(1);
    const [notice] = planAddToasts();
    expect(notice.title).toBe(title);
    expect(notice.options).toMatchObject({ id: "plan-add", description: "Your own exercises are unchanged.", cancel: { label: "Undo" } });
    expect(Object.prototype.hasOwnProperty.call(notice.options, "action")).toBe(true);
    expect(notice.options!.action).toBeUndefined();

    await act(async () => { notice.options!.cancel!.onClick(); });
    await tick();
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
    expect(dayPrescriptions(1, "0-Push")).toEqual({});
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
    expect(dayPrescriptions(1, "1-Pull")).toEqual({});
    // The page's own Undo after the notice's does nothing more.
    await act(async () => { if (result.ok) result.undo(); });
    await tick();
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
  }, 30000);

  it("writes into a stored week, not the one Plan has open, and its Undo takes back only that week's changes", async () => {
    await openPage();
    const result = await apply(stackBatch(2));
    expect(result).toMatchObject({ ok: true, message: "Added 5 sets: 3 exercises on Day 01, Day 02 of Week 2" });
    expect(dayIds(2, "0-Push")).toEqual([e2.id, WRIST_CURL, REVERSE_WRIST_CURL]);
    expect(dayIds(2, "1-Pull")).toEqual([HAMMER_CURL]);
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
    await act(async () => { planAddToasts()[0].options!.cancel!.onClick(); });
    await tick();
    expect(dayIds(2, "0-Push")).toEqual([e2.id]);
    expect(dayIds(2, "1-Pull")).toEqual([]);
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
  }, 30000);

  it("undoes on the days as they stand: an add made since stays, and the batch's own come out", async () => {
    await openPage();
    await apply(stackBatch(1));
    const batchNotice = planAddToasts()[0];
    // Since: one more exercise, first in Day 01, from the page's single add.
    await act(async () => { props().onApplyPlanChange({ week: 1, slotIndex: 0, dayKey: "0-Push", catalogExerciseId: e3.id, insertAt: 0 }); });
    await tick();
    expect(dayIds(1, "0-Push")).toEqual([e3.id, e0.id, e1.id, WRIST_CURL, REVERSE_WRIST_CURL]);
    await act(async () => { batchNotice.options!.cancel!.onClick(); });
    await tick();
    expect(dayIds(1, "0-Push")).toEqual([e3.id, e0.id, e1.id]);
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
  }, 30000);

  it("undoes in the week it was applied to after Plan has opened another week", async () => {
    await openPage();
    await apply(stackBatch(1));
    const batchNotice = planAddToasts()[0];
    // Plan opens Week 2: Week 1 is stored from then on.
    await act(async () => { fireEvent.click(within(screen.getByRole("navigation", { name: "Primary mobile navigation" })).getByRole("button", { name: "Train" })); });
    await tick();
    const weeks = within(await screen.findByRole("group", { name: "Training week" }, { timeout: 15000 }));
    await act(async () => { fireEvent.click(weeks.getByRole("button", { name: /^Week 2/ })); });
    await tick();
    expect(JSON.parse(window.localStorage.getItem(PLAN_KEY) ?? "{}").activeWeek).toBe(2);
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id, WRIST_CURL, REVERSE_WRIST_CURL]);
    await act(async () => { batchNotice.options!.cancel!.onClick(); });
    await tick();
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
    expect(dayIds(2, "0-Push")).toEqual([e2.id]);
  }, 30000);

  it("refuses the whole batch with the first reason when any change cannot apply, and writes nothing", async () => {
    await openPage();
    const result = await apply({ week: 1, changes: [add("1-Pull", WRIST_CURL, "1 × 10–25"), add("0-Push", e0.id, "1 × 10–25"), add("0-Push", HAMMER_CURL, "1 × 10–25")] });
    expect(result).toEqual({ ok: false, reason: `Day 01 · Push: ${e0.name} is already in that day. Nothing was changed.` });
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
    expect(planAddToasts()).toEqual([]);
  }, 30000);

  it("refuses a week that is not built, and acts on the athlete's entries only as the batch names them", async () => {
    await openPage();
    expect(await apply(stackBatch(3))).toEqual({ ok: false, reason: "Week 3 is not built yet. Build it in Plan first." });
    expect(planAddToasts()).toEqual([]);
    // Take out, −1 set and Move, each one change, each with its notice and its Undo.
    const takeOut = await apply({ week: 1, changes: [{ kind: "remove", dayKey: "0-Push", entryId: e1.id, catalogExerciseId: e1.id }] });
    expect(takeOut).toMatchObject({ ok: true, message: `${e1.name} taken out of Day 01 of Week 1` });
    expect(dayIds(1, "0-Push")).toEqual([e0.id]);
    const fewer = await apply({ week: 1, changes: [{ kind: "sets", dayKey: "1-Pull", entryId: e2.id, catalogExerciseId: e2.id, sets: 2, prescription: "3 × 8–12" }] });
    expect(fewer).toMatchObject({ ok: true, message: `${e2.name} on Day 02 of Week 1: 3 → 2 sets` });
    expect(dayPrescriptions(1, "1-Pull")).toEqual({ [e2.id]: "2 × 8–12" });
    const moved = await apply({ week: 1, changes: [{ kind: "move", dayKey: "0-Push", entryId: e0.id, catalogExerciseId: e0.id, toDayKey: "2-Legs" }] });
    expect(moved).toMatchObject({ ok: true, message: `${e0.name} moved from Day 01 to Day 03 of Week 1` });
    expect(dayIds(1, "0-Push")).toEqual([]);
    expect(dayIds(1, "2-Legs")).toEqual([e0.id]);
    for (const result of [moved, fewer, takeOut]) await act(async () => { if (result.ok) result.undo(); });
    await tick();
    expect(dayIds(1, "0-Push")).toEqual([e0.id, e1.id]);
    expect(dayIds(1, "1-Pull")).toEqual([e2.id]);
    expect(dayPrescriptions(1, "1-Pull")).toEqual({});
    expect(dayIds(1, "2-Legs")).toEqual([]);
  }, 30000);
});

describe("About me's area answer, handed to the page", () => {
  it("is the forearm answer when About me's area is the forearm and it is not Feels fine", async () => {
    window.localStorage.setItem(PROFILE_KEY, profile({ targetKey: "forearm", constraintType: "symptomatic" }));
    await openPage();
    expect(props().aboutMeArea).toEqual({ constraintType: "symptomatic", answer: "Bothering me now" });
  }, 30000);

  it("is nothing for Feels fine, for another area, and with no answer", async () => {
    for (const focus of [{ targetKey: "forearm", constraintType: "proactive_none" }, { targetKey: "shoulder", constraintType: "symptomatic" }, undefined]) {
      cleanup();
      page.props = null;
      window.localStorage.setItem(PROFILE_KEY, profile(focus));
      await openPage();
      expect(props().aboutMeArea, JSON.stringify(focus)).toBeNull();
    }
  }, 45000);
});

describe("Plan's notice for a generated week, when an earlier week holds a stack (§3.2, Plan says so too)", () => {
  async function generateWeek3() {
    window.history.replaceState({}, "", "/?workspace=day-plan");
    render(createElement(Home));
    const weeks = within(await screen.findByRole("group", { name: "Training week" }, { timeout: 15000 }));
    await act(async () => { fireEvent.click(weeks.getByRole("button", { name: /^Week 3\s*Generate$/ })); });
    await tick();
    return toasts.find((item) => item.title === "Week 3 generated")!;
  }

  it("adds that the stack is not in the new week, and its action opens the stack card for that week", async () => {
    window.localStorage.setItem(STACKS_KEY, stackRecord);
    const notice = await generateWeek3();
    expect(notice.options!.description).toMatch(/^3 training days were built around your athleticism goal and .+ budget\. Your forearm stack from Week 1 is not in it; design one on Specialize\.$/);
    expect(notice.options!.action!.label).toBe("Design for Week 3");
    await act(async () => { notice.options!.action!.onClick(); });
    await screen.findByRole("region", { name: "Specialization page" }, { timeout: 15000 });
    await tick();
    expect(props().state).toMatchObject({ regionId: "forearm", mode: "planned", planWeek: 3, open: "stack" });
    const address = new URLSearchParams(window.location.search);
    expect([address.get("workspace"), address.get("region"), address.get("mode"), address.get("pweek"), address.get("open")]).toEqual(["specialization", "forearm", "planned", "3", "stack"]);
  }, 30000);

  it("says what it said before when no earlier week holds a stack", async () => {
    const notice = await generateWeek3();
    expect(notice.options!.description).toMatch(/^3 training days were built around your athleticism goal and .+ budget\.$/);
    expect(notice.options).not.toHaveProperty("action");
  }, 30000);
});
