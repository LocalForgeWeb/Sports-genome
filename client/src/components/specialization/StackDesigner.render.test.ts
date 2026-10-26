// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement, useRef, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, preloadStackModel, type SpecializationPanelProps } from "./SpecializationPanel";
import { ModelMusclePanel } from "./anatomy3d/ModelMusclePanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { applyPlanBatch } from "@/lib/specialization/planBatch";
import { loadRegionExtras } from "@/lib/specialization/regionExtras";
import { designStack } from "@/lib/specialization/stack";
import { loadStackStore } from "@/lib/specialization/stackStore";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationAreaReport, type SpecializationPlanBatch, type SpecializationPlanBatchResult, type SpecializationViewState } from "@/lib/specialization/viewState";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore, loadDay, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { catalogIdOf } from "@/lib/workoutSwap";
import { prescriptionOf, type TrainingGoal } from "@/lib/workoutPlanner";
import { saveStackRecord } from "@/lib/specialization/stackStore";

/**
 * The stack card on the forearm page (docs/specialization-atlas/11-forearm-research-and-stack.md §3.2–
 * §3.12, lane S4), on the prototype's plan A (architect-v3/run.ts: 3 days, 60 min, Muscle growth, a
 * commercial gym, Hammer Curl on Day 03), with Home's batch apply stood in by the same pure batch
 * (`applyPlanBatch`) on a week this harness holds, so the card sees the plan change as it would.
 *
 * Read here: the card closed (its two lines, its place under the map, nothing of the designer
 * downloaded) and open (the number, its effect and Add first, in that order); the total control
 * (− and + commit at once, typing commits on blur, Enter or Done and clamps then, out of range said in
 * place and never replaced mid-typing); What changes; Add → one batch → the notice and the card's own
 * Undo; Leave out with its Undo and the total dropping by its sets; Change in place; Settings; Take it
 * out; Change the total; the ways in and `open=stack`; no confirm dialog; the words. The 44 px sweep
 * and the first screen are the phone evidence's (evidence/stack-2026-10/).
 */

vi.mock("@/lib/specialization/stack", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/specialization/stack")>();
  return { ...actual, designStack: vi.fn(actual.designStack) };
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;
window.scrollTo = (() => {}) as typeof window.scrollTo;

const byId = (id: number) => exercises.find((item) => item.id === id)!;
const slots = buildDaySlots(splitDaysForFrequency(3));
const weekOf = (days: number[][]): WeeklyDayStore => days.reduce((store, ids, index) => commitDay(store, slots[index].key, { workout: ids.map(byId), prescriptions: {}, settings: {}, context: [] }), emptyDayStore());
/** Plan A: full-body content in the app's Push / Pull / Legs slots; the Hammer Curl is the plan's own direct forearm work. */
const planA = weekOf([[161, 1, 43, 103, 150], [41, 4, 66, 111, 121], [173, 2, 54, 186, 132]]);

const notices: { title: string; description?: string; undo: () => void }[] = [];
const batches: SpecializationPlanBatch[] = [];
let lastState: SpecializationViewState | null = null;
let shownWeeks: Record<number, WeeklyDayStore> = {};
/** Runs before Home's stand-in applies a batch: to hold it (the batch code still arriving) or to fail. */
let beforeApply: (() => Promise<void>) | null = null;

function Harness({ initial = {}, weeks = { 1: planA }, aboutMeArea = null, ready = true, chooseWeek, goal = "Muscle growth" }: { initial?: Partial<SpecializationViewState>; weeks?: Record<number, WeeklyDayStore>; aboutMeArea?: SpecializationAreaReport | null; ready?: boolean; chooseWeek?: number; goal?: TrainingGoal }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...initial });
  const [plan, setPlan] = useState(weeks);
  const planRef = useRef(plan);
  planRef.current = plan;
  lastState = state;
  shownWeeks = plan;
  /** Home's batch apply, as Home.tsx does it: the pure batch on the week as it stands, one notice, one Undo, then the page's onUndo. */
  const onApplyPlanChanges = async (batch: SpecializationPlanBatch, options?: { onUndo?: () => void }): Promise<SpecializationPlanBatchResult> => {
    batches.push(batch);
    if (beforeApply) await beforeApply();
    const store = planRef.current[batch.week];
    if (!store) return { ok: false, reason: `Week ${batch.week} is not built yet. Build it in Plan first.` };
    // As Home applies it: with the goal, so entries that move a place keep how they read.
    const outcome = applyPlanBatch(store, batch, { slots, catalog: exercises, goal });
    if (!outcome.ok) return { ok: false, reason: outcome.reason };
    setPlan((current) => ({ ...current, [batch.week]: outcome.store }));
    let undone = false;
    const undo = () => {
      if (undone) return;
      undone = true;
      setPlan((current) => ({ ...current, [batch.week]: [...outcome.days].reverse().reduce((week, day) => commitDay(week, day.slot.key, day.revert(loadDay(week, day.slot.key))), current[batch.week]) }));
      options?.onUndo?.();
    };
    notices.push({ title: outcome.message.title, description: outcome.message.description, undo });
    return { ok: true, undo, message: outcome.message.title };
  };
  const props: SpecializationPanelProps = {
    state, onStateChange: setState,
    plan: { ready, slots, weeks: plan, choice: chooseWeek ? { week: chooseWeek, index: 0, day: "Push", madeAt: "2026-10-21T08:00:00.000Z" } : null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal, weightUnit: "lb", gymMinutes: 60,
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onApplyPlanChanges, aboutMeArea,
    onInspectExercise: () => {}, onOpenSession: () => {}, backLabel: null, onBack: null,
  };
  return createElement(SpecializationPanel, props);
}

const card = () => document.querySelector("details.spz-stack") as HTMLDetailsElement;
const summaryLines = () => Array.from(card().querySelectorAll(":scope > summary b, :scope > summary small")).map((item) => item.textContent);
const said = () => document.querySelector(".spz-page > [aria-live='polite']")!.textContent ?? "";
const click = async (element: Element) => { await act(async () => { fireEvent.click(element); }); await act(async () => {}); };
async function openCard() {
  await act(async () => { card().open = true; fireEvent(card(), new Event("toggle")); });
  await screen.findByText("Pick a weekly number; the app picks the exercises and days.", undefined, { timeout: 10000 });
}
const totalField = () => within(card()).getByRole("spinbutton", { name: "Direct forearm sets a week" }) as HTMLInputElement;
const changes = () => Array.from(card().querySelectorAll(".spz-stack-changes p")).map((item) => item.textContent);
const addButton = () => within(card()).getByRole("button", { name: /^(Add|Replace your stack)/ });
const rowButtons = () => Array.from(card().querySelectorAll<HTMLButtonElement>(".spz-stack-row"));
const rowNamed = (name: RegExp) => rowButtons().find((row) => name.test(row.textContent ?? ""))!;
const directIn = (store: WeeklyDayStore) => slots.flatMap((slot) => loadDay(store, slot.key).workout.map((entry) => catalogIdOf(entry)));
const windowLine = () => document.querySelector(".spz-window")!.textContent;

beforeAll(async () => { await loadRegionData("forearm"); await loadRegionExtras("forearm"); await preloadStackModel(); });
beforeEach(() => {
  window.localStorage.clear();
  clearSummaryCache();
  notices.length = 0;
  batches.length = 0;
  beforeApply = null;
  lastState = null;
  vi.mocked(designStack).mockClear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("the card, closed", () => {
  it("sits right under the map, in both modes, and says the plan week's direct moving sets in two lines", async () => {
    for (const mode of ["planned", "completed"] as const) {
      render(createElement(Harness, { initial: { mode } }));
      await act(async () => {});
      const map = document.querySelector(".spz-map")!;
      expect(map.nextElementSibling).toBe(card());
      expect(card().compareDocumentPosition(screen.getByRole("heading", { name: "Muscles" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(card().open).toBe(false);
      expect(summaryLines()).toEqual(["Design a stack", "Plan Week 1 · 3 direct moving sets now"]);
      // Nothing of the designer is on the page until the card opens.
      expect(card().querySelector(".spz-stack-body")).toBeNull();
      expect(vi.mocked(designStack)).not.toHaveBeenCalled();
      cleanup();
    }
  });

  it("names the week to build when the card's week is not built, and the plan loading while it loads", async () => {
    render(createElement(Harness, { initial: { mode: "planned", planWeek: 2 }, weeks: { 1: planA, 2: planA } }));
    await act(async () => {});
    expect(summaryLines()).toEqual(["Design a stack", "Plan Week 2 · 3 direct moving sets now"]);
    cleanup();
    render(createElement(Harness, { ready: false }));
    await act(async () => {});
    expect(summaryLines()).toEqual(["Design a stack", "Your plan is still loading."]);
    await openCardLoose();
    // Said in the card too, with no controls.
    await waitFor(() => expect(Array.from(card().querySelectorAll(":scope > p")).map((item) => item.textContent)).toEqual(["Your plan is still loading."]), { timeout: 10000 });
    expect(within(card()).queryAllByRole("button")).toEqual([]);
  });

  it("in Planned mode, the window line and the 3D model's Overview say the same number in the same words", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    expect(windowLine()).toBe("Plan Week 1, as written: 21 sets planned · 3 direct moving");
    cleanup();
    // The model's panel with nothing selected is given the page's planned line (jsdom draws no model, so it is rendered on its own here).
    render(createElement(ModelMusclePanel, { data: null, mode: "planned", windowLabel: "Plan Week 1, as written", regionLine: "21 sets planned for the forearms in Plan Week 1; 3 are direct moving sets.", bothSides: "both arms", countedTogether: "", onViewContributions: () => {}, onAddExercise: () => {}, onViewExercise: () => {}, onOpenMethod: () => {}, onSeeRegionSets: () => {}, onDesignStack: () => {}, credits: null }));
    expect(screen.getByText(/^21 sets planned for the forearms in Plan Week 1; 3 are direct moving sets\./)).not.toBeNull();
    const design = screen.getByRole("button", { name: "Design a stack" });
    // Outlined (the page's bordered button, 44 px), beside See these sets.
    expect(design.className).toBe("spz-button");
    expect(design.previousElementSibling?.textContent).toMatch(/^See these sets/);
  });
});

/** Opens the card without waiting for the designer (states with no design to show). */
async function openCardLoose() {
  await act(async () => { card().open = true; fireEvent(card(), new Event("toggle")); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
}

describe("the card, open", () => {
  it("leads with the number, its effect and Add, in that order, then the days and the rows", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    const body = card().querySelector(".spz-stack-body")!;
    const order = [
      within(body).getByText(/^Pick a weekly number/),
      totalField(),
      within(body).getByText("From 3 (your plan's own) to 30 · about 28 fit your gym time"),
      // F3 (forearm_mappings_v2): 420 reaches the index and little finger extensors, a twelfth movement, which leaves the ulnar
      // deviation lever without room at 4 forearm exercises a day.
      within(body).getByText("It starts at 14: your plan's 3, and one set for 11 of the 12 movements your plan does not train directly yet; one does not fit at 4 forearm exercises a day. No number suits everyone; change it any time."),
      body.querySelector(".spz-stack-changes")!,
      addButton(),
      within(body).getByText("Your own exercises stay as they are."),
      body.querySelector(".spz-stack-daylines")!,
      within(body).getByRole("heading", { name: "The stack, by day" }),
    ];
    for (let index = 1; index < order.length; index += 1) expect(order[index - 1].compareDocumentPosition(order[index]) & Node.DOCUMENT_POSITION_FOLLOWING, String(index)).toBeTruthy();
    expect(totalField().value).toBe("14");
    expect(changes()).toEqual(["What changes", "Direct moving sets 3 → 14 · muscles with direct work 1 → 18 of 19"]);
    expect(addButton().textContent).toBe("Add 11 sets (11 exercises, 3 days) to Week\u00a01");
    // The days, in the Plan's own minutes, with the second arm's beside them.
    expect(Array.from(body.querySelectorAll(".spz-stack-daylines > li > p:first-child")).map((line) => line.textContent)).toEqual([
      "Day 01 · Push: +4 · 5 → 9 exercises · about 48 of your 60 min, plus about 1 min for the second arm on one-arm sets",
      "Day 02 · Pull: +4 · 5 → 9 exercises · about 48 of your 60 min, plus about 4 min for the second arm on one-arm sets",
      "Day 03 · Legs: +3 · 5 → 8 exercises · about 46 of your 60 min, plus about 3 min for the second arm on one-arm sets",
    ]);
    // Rows one line closed: the name, the prescription, "each arm" on a one-arm exercise.
    expect(rowButtons()).toHaveLength(11);
    expect(rowButtons().every((row) => row.getAttribute("aria-expanded") === "false")).toBe(true);
    expect(rowNamed(/^Wrist Curl/).textContent).toBe("Wrist Curl · 1 × 10–25");
    expect(rowNamed(/^Lever Pronation/).textContent).toBe("Lever Pronation · 1 × 10–20 · each arm");
    // What no reviewed exercise trains directly, in the region's plain words (§3.11).
    // Since F3 only the palmaris longus: 420 trains the little and index finger extensors directly (§10 decision 2).
    expect(Array.from(body.querySelectorAll(".spz-stack-out li")).map((item) => item.textContent).find((text) => text!.startsWith("No reviewed exercise"))).toBe("No reviewed exercise trains these directly, so the stack cannot give them direct sets: palmaris longus, which tenses the sheet of connective tissue under the skin of the palm. Wrist Curl, One-Arm Dumbbell Wrist Curl, Cable Wrist Curl and 1 more work them as helpers. Palmaris longus is missing in some people.");
    // The number field: 16 px (stack.css), numeric keypad, Done on the keyboard.
    expect(totalField().getAttribute("inputmode")).toBe("numeric");
    expect(totalField().getAttribute("enterkeyhint")).toBe("done");
    expect(readFileSync(join(process.cwd(), "client/src/components/specialization/stack.css"), "utf8")).toMatch(/\.spz-stack-number \{[^}]*font-size: max\(16px, var\(--sg-text-lg\)\)/);
  });

  it("− and + commit at once, and the live region says the design", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    await click(within(card()).getByRole("button", { name: "One set more" }));
    expect(totalField().value).toBe("15");
    expect(changes()[1]).toBe("Direct moving sets 3 → 15 · muscles with direct work 1 → 18 of 19");
    expect(said()).toBe("15 direct moving sets a week: 11 exercises over 3 days");
    await click(within(card()).getByRole("button", { name: "One set fewer" }));
    await click(within(card()).getByRole("button", { name: "One set fewer" }));
    expect(totalField().value).toBe("13");
    expect(addButton().textContent).toBe("Add 10 sets (10 exercises, 3 days) to Week\u00a01");
    // A movement the total does not reach is said, with what reaches it.
    expect(card().querySelector(".spz-stack-out")!.textContent).toMatch(/Left out at this total: .+\. Raise the total by \d+ to reach (it|them)\./);
  });

  it("keeps − and + at full contrast at their limits, says why in place, and never fades them", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    totalField().focus();
    await act(async () => { fireEvent.change(totalField(), { target: { value: "3" } }); });
    await act(async () => { fireEvent.blur(totalField()); });
    const fewer = within(card()).getByRole("button", { name: "One set fewer" });
    expect(fewer.getAttribute("aria-disabled")).toBe("true");
    expect(fewer.hasAttribute("disabled")).toBe(false);
    await click(fewer);
    expect(totalField().value).toBe("3");
    expect(within(card()).getByText("The lowest is 3: your plan's own.")).not.toBeNull();
    expect(said()).toBe("The lowest is 3: your plan's own.");
    await act(async () => { fireEvent.change(totalField(), { target: { value: "30" } }); });
    await act(async () => { fireEvent.keyDown(totalField(), { key: "Enter" }); });
    const more = within(card()).getByRole("button", { name: "One set more" });
    expect(more.getAttribute("aria-disabled")).toBe("true");
    await click(more);
    expect(totalField().value).toBe("30");
    expect(within(card()).getByText("These settings place at most 30. Allow another day or more forearm exercises a day to place more.")).not.toBeNull();
    // stack.css keeps a control at its limit at full opacity.
    expect(readFileSync(join(process.cwd(), "client/src/components/specialization/stack.css"), "utf8")).toMatch(/\.spz-icon-button\[aria-disabled="true"\] \{ opacity: 1;/);
  });

  it("commits a typed number only on blur, Enter or Done, clamps it then, and says out of range in place without replacing it", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    vi.mocked(designStack).mockClear();
    totalField().focus();
    await act(async () => { fireEvent.change(totalField(), { target: { value: "2" } }); });
    // Below the lowest, said in place while typing; the field keeps what is typed and the design stays.
    expect(totalField().value).toBe("2");
    expect(within(card()).getByText("The lowest is 3: your plan's own.")).not.toBeNull();
    expect(changes()[1]).toBe("Direct moving sets 3 → 14 · muscles with direct work 1 → 18 of 19");
    await act(async () => { fireEvent.change(totalField(), { target: { value: "20" } }); });
    expect(within(card()).queryByText("The lowest is 3: your plan's own.")).toBeNull();
    expect(changes()[1]).toBe("Direct moving sets 3 → 14 · muscles with direct work 1 → 18 of 19");
    await act(async () => { fireEvent.blur(totalField()); });
    expect(totalField().value).toBe("20");
    expect(changes()[1]).toBe("Direct moving sets 3 → 20 · muscles with direct work 1 → 18 of 19");
    // Typing "2", "0" designed once, at 20, and nothing in between.
    const totals = vi.mocked(designStack).mock.calls.map(([input]) => input.total);
    expect(totals.filter((total) => total !== 20 && total !== 14)).toEqual([]);
    expect(totals).toContain(20);
    // Above the top: clamped when committed, with the reason.
    await act(async () => { fireEvent.change(totalField(), { target: { value: "99" } }); });
    expect(within(card()).getByText("These settings place at most 30. Allow another day or more forearm exercises a day to place more.")).not.toBeNull();
    expect(totalField().value).toBe("99");
    await act(async () => { fireEvent.keyDown(totalField(), { key: "Enter" }); });
    expect(totalField().value).toBe("30");
    expect(within(card()).getByText("These settings place at most 30. Allow another day or more forearm exercises a day to place more.")).not.toBeNull();
  });

  it("opens a row in place, one at a time, with its muscles, why it is here, its definition and three controls", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    await click(rowNamed(/^Lever Pronation/));
    const pronation = rowNamed(/^Lever Pronation/).closest("li")!;
    expect(rowNamed(/^Lever Pronation/).getAttribute("aria-expanded")).toBe("true");
    expect(pronation.textContent).toContain("Direct work for pronator teres and pronator quadratus (shared; the evidence does not split it)");
    expect(pronation.textContent).toContain("None in your plan this week (pronation).");
    expect(pronation.textContent).toContain("The app's starting range for rotation work, not a tested one.");
    expect(within(pronation).getAllByRole("button").map((button) => button.getAttribute("aria-label") ?? button.textContent)).toEqual(["Lever Pronation · 1 × 10–20 · each arm", "One set fewer: Lever Pronation, Day 02 · Pull", "One set more: Lever Pronation, Day 02 · Pull", "Change", "Leave out"]);
    // One open at a time.
    await click(rowNamed(/^Band Thumb Extension/));
    expect(rowNamed(/^Lever Pronation/).getAttribute("aria-expanded")).toBe("false");
    const thumb = rowNamed(/^Band Thumb Extension/).closest("li")!;
    expect(thumb.textContent).toContain("One set: these drills are for coverage, not volume. Raise it here if you want more.");
    // Sets: 1 is the fewest, said in place at full contrast; + raises this row and the total by one.
    const fewer = within(thumb).getByRole("button", { name: /^One set fewer/ });
    expect(fewer.getAttribute("aria-disabled")).toBe("true");
    await click(fewer);
    expect(within(thumb).getByText("1 is the fewest; use Leave out.")).not.toBeNull();
    await click(within(thumb).getByRole("button", { name: /^One set more/ }));
    expect(totalField().value).toBe("15");
    expect(rowNamed(/^Band Thumb Extension/).textContent).toBe("Band Thumb Extension · 2 × 12–25 · each arm");
  });

  it("changes a row in place, never in a sheet: its day, or another reviewed exercise for its movement", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    await click(rowNamed(/^Wrist Curl/));
    const row = rowNamed(/^Wrist Curl/).closest("li")!;
    await click(within(row).getByRole("button", { name: "Change" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(row).getByRole("button", { name: "Change" }).getAttribute("aria-expanded")).toBe("true");
    const days = within(row).getAllByRole("button").filter((button) => /^Day 0\d/.test(button.textContent ?? ""));
    expect(days.find((button) => button.getAttribute("aria-pressed") === "true")!.textContent).toBe("Day 01 · Push");
    const exercisesOffered = Array.from(row.querySelectorAll(".spz-stack-change .spz-chip")).filter((chip) => chip.querySelector("small"));
    expect(exercisesOffered.length).toBeGreaterThan(1);
    expect(exercisesOffered.find((chip) => chip.getAttribute("aria-pressed") === "true")!.textContent).toBe("Wrist CurlBarbell");
    const other = exercisesOffered.find((chip) => chip.getAttribute("aria-pressed") === "false")!;
    const otherName = other.querySelector("span")!.textContent!;
    await click(other);
    expect(rowButtons().some((button) => button.textContent!.startsWith(`${otherName} ·`))).toBe(true);
    expect(rowButtons().some((button) => button.textContent!.startsWith("Wrist Curl ·"))).toBe(false);
    expect(totalField().value).toBe("14");
  });

  it("leaves a movement out at once: the total drops by its sets, no other row changes, and Undo is where the row was", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    const before = rowButtons().map((row) => row.textContent);
    await click(rowNamed(/^Band Thumb Abduction/));
    await click(within(rowNamed(/^Band Thumb Abduction/).closest("li")!).getByRole("button", { name: "Leave out" }));
    const undo = within(card()).getByRole("button", { name: "Undo" });
    expect(undo.closest("p")!.textContent).toBe("Thumb abduction left out · total 14 → 13Undo");
    expect(document.activeElement).toBe(undo);
    expect(undo.closest(".spz-stack-day")!.querySelector("h4")!.textContent).toBe("Day 03 · Legs");
    expect(totalField().value).toBe("13");
    expect(rowButtons().map((row) => row.textContent)).toEqual(before.filter((text) => !text!.startsWith("Band Thumb Abduction")));
    // Listed as not in this stack, with Bring back.
    expect(within(card().querySelector(".spz-stack-out") as HTMLElement).getByRole("button", { name: "Bring back Thumb abduction" })).not.toBeNull();
    await click(undo);
    expect(totalField().value).toBe("14");
    expect(rowButtons().map((row) => row.textContent)).toEqual(before);
    // Focus goes to the row that came back, never to the page.
    expect(document.activeElement).toBe(rowNamed(/^Band Thumb Abduction/));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ends Leave out's Undo at the next change, so it never throws a later change away; Bring back keeps it and focuses the row", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    await click(rowNamed(/^Band Thumb Abduction/));
    await click(within(rowNamed(/^Band Thumb Abduction/).closest("li")!).getByRole("button", { name: "Leave out" }));
    expect(totalField().value).toBe("13");
    for (let press = 0; press < 3; press += 1) await click(within(card()).getByRole("button", { name: "One set more" }));
    expect(totalField().value).toBe("16");
    // The Undo that would put back 14 is gone; the three sets stay.
    expect(within(card()).queryByRole("button", { name: "Undo" })).toBeNull();
    expect(totalField().value).toBe("16");
    await click(within(card().querySelector(".spz-stack-out") as HTMLElement).getByRole("button", { name: "Bring back Thumb abduction" }));
    expect(totalField().value).toBe("17");
    expect(document.activeElement).toBe(rowNamed(/^Band Thumb Abduction/));
  });

  it("states each setting's effect as it changes it, in a closed row that shows the current values", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    const settings = card().querySelector(".spz-stack-settings") as HTMLDetailsElement;
    expect(settings.open).toBe(false);
    expect(settings.querySelector("summary")!.textContent).toBe("Settings3 days · 4 forearm exercises a day · holds off");
    await act(async () => { settings.open = true; });
    expect(within(settings).getAllByRole("button", { pressed: true }).map((button) => button.textContent)).toEqual(["Day 01 · Push", "Day 02 · Pull", "Day 03 · Legs", "Off"]);
    await click(within(settings).getByRole("button", { name: "One more forearm exercise a day" }));
    expect(settings.querySelector("summary")!.textContent).toBe("Settings3 days · 5 forearm exercises a day · holds off");
    expect(within(card()).getByText(/^5 forearm exercises a day: these settings place at most \d+; 14 direct moving sets now, 11 exercises over 3 days\.$/)).not.toBeNull();
    await click(within(settings).getByRole("button", { name: "On" }));
    expect(settings.querySelector("summary")!.textContent).toMatch(/holds on$/);
    expect(changes()).toContain("Holds: + 1 (30 s), not part of the total");
    // The holds stay out of the total.
    expect(totalField().value).toBe("14");
  });

  it("adds in one batch, says so in the card and the notice, and the card's Undo takes it all back", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    const confirm = vi.spyOn(window, "confirm");
    await click(addButton());
    expect(batches).toHaveLength(1);
    expect(batches[0].changes).toHaveLength(11);
    expect(batches[0].changes.every((change) => change.kind === "add" && typeof change.prescription === "string")).toBe(true);
    expect(notices.map((notice) => notice.title)).toEqual(["Added 11 sets: 11 exercises on Day 01, Day 02, Day 03 of Week 1"]);
    // In the card: what was added, with Undo, focus on it; and the number the page now shows.
    const undo = within(card()).getByRole("button", { name: "Undo" });
    expect(undo.closest("p")!.textContent).toBe("Added 11 sets to Plan Week 1Undo");
    expect(document.activeElement).toBe(undo);
    expect(within(card()).getByText("The page now shows 14 direct moving sets for Plan Week 1.")).not.toBeNull();
    await waitFor(() => expect(summaryLines()).toEqual(["Design a stack", "Your stack: 14 direct moving sets in Week 1"]));
    expect(windowLine()).toBe("Plan Week 1, as written: 32 sets planned · 14 direct moving");
    expect(within(card()).getByRole("button", { name: "Change the total" })).not.toBeNull();
    expect(within(card()).getByRole("button", { name: "Take it out" })).not.toBeNull();
    // The device record: the stack, its 11 entries as written, and the region's last total.
    const stored = loadStackStore(null);
    expect(stored.stacks).toHaveLength(1);
    expect(stored.stacks[0]).toMatchObject({ regionId: "forearm", planWeek: 1, total: 14 });
    expect(stored.stacks[0].entries).toHaveLength(11);
    expect(stored.choices[0]).toMatchObject({ regionId: "forearm", total: 14 });
    // The stack as the plan holds it, a one-arm exercise said as its row was.
    expect(Array.from(card().querySelectorAll(".spz-stack-entries li li")).map((item) => item.textContent)).toEqual([
      "Reverse Wrist Curl · 1 × 10–25", "Wrist Curl · 1 × 10–25", "Lever Radial Deviation · 1 × 10–25 · each arm", "Finger Curl · 1 × 10–25",
      "Lever Pronation · 1 × 10–20 · each arm", "Band Index and Little Finger Extension · 1 × 10–25 · each arm", "Band Finger Extension · 1 × 10–25 · each arm", "Band Thumb Extension · 1 × 12–25 · each arm",
      "Lever Supination · 1 × 10–20 · each arm", "Band Thumb Flexion · 1 × 12–25 · each arm", "Band Thumb Abduction · 1 × 12–25 · each arm",
    ]);
    expect(said()).toMatch(/^Added 11 sets to Plan Week 1\./);
    await click(undo);
    expect(directIn(shownWeeks[1])).toEqual(directIn(planA));
    expect(shownWeeks[1]).toEqual(planA);
    expect(loadStackStore(null).stacks).toEqual([]);
    expect(within(card()).getByText("Undone: Plan Week 1 is as it was.")).not.toBeNull();
    await waitFor(() => expect(summaryLines()).toEqual(["Design a stack", "Plan Week 1 · 3 direct moving sets now"]));
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("forgets the stack when the notice's Undo takes the batch back", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    await click(addButton());
    expect(loadStackStore(null).stacks).toHaveLength(1);
    await act(async () => { notices[0].undo(); });
    expect(loadStackStore(null).stacks).toEqual([]);
    expect(shownWeeks[1]).toEqual(planA);
    // The card says it too, as its own Undo does: never "Added" over a plan without the stack.
    expect(card().querySelector(".spz-stack-done")!.textContent).toBe("Undone: Plan Week 1 is as it was.");
    expect(within(card()).queryByRole("button", { name: "Undo" })).toBeNull();
    expect(within(card()).queryByText(/^Your stack:/)).toBeNull();
    expect(within(card()).queryByText(/^The page now shows/)).toBeNull();
    expect(addButton().textContent).toBe("Add 11 sets (11 exercises, 3 days) to Week\u00a01");
    await waitFor(() => expect(summaryLines()).toEqual(["Design a stack", "Plan Week 1 · 3 direct moving sets now"]));
  });

  it("says Adding… on the button while the plan change is on its way, and an error in the card if it fails", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    let release: () => void = () => {};
    beforeApply = () => new Promise<void>((resolve) => { release = resolve; });
    await click(addButton());
    expect(addButton().textContent).toBe("Adding…");
    expect(addButton().getAttribute("aria-busy")).toBe("true");
    await act(async () => { release(); });
    await act(async () => {});
    expect(card().querySelector(".spz-stack-done")!.textContent).toBe("Added 11 sets to Plan Week 1Undo");
    await click(within(card()).getByRole("button", { name: "Undo" }));
    beforeApply = async () => { throw new Error("chunk failed"); };
    await click(addButton());
    expect(within(card()).getByRole("alert").textContent).toBe("The change did not finish. Check Plan Week 1 before trying again; reloading usually fixes this.");
    expect(addButton().textContent).toBe("Add 11 sets (11 exercises, 3 days) to Week\u00a01");
    expect(addButton().getAttribute("aria-busy")).toBeNull();
  });

  it("takes the stack out at once, with Undo, and only the entries still as it wrote them", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    await click(addButton());
    await waitFor(() => expect(within(card()).getByRole("button", { name: "Take it out" })).not.toBeNull());
    const added = shownWeeks[1];
    await click(within(card()).getByRole("button", { name: "Take it out" }));
    expect(batches[1].changes).toHaveLength(11);
    expect(batches[1].changes.every((change) => change.kind === "remove" && change.prescription)).toBe(true);
    expect(shownWeeks[1]).toEqual(planA);
    expect(loadStackStore(null).stacks).toEqual([]);
    const undo = within(card()).getByRole("button", { name: "Undo" });
    expect(undo.closest("p")!.textContent).toBe("Took your stack out of Plan Week 1Undo");
    expect(document.activeElement).toBe(undo);
    expect(within(card()).getByText("The page now shows 3 direct moving sets for Plan Week 1.")).not.toBeNull();
    await click(undo);
    expect(directIn(shownWeeks[1])).toEqual(directIn(added));
    expect(loadStackStore(null).stacks).toHaveLength(1);
  });

  it("under Max strength, Take it out keeps the plan's own exercises as they read, so the notice's 'unchanged' is true, and Undo gives the week back exactly", async () => {
    // Day 01 with the stack's One-Arm Dumbbell Wrist Curl first (as it wrote it), then the plan's own five with none of their own: by place 4 × 3–5, 4 × 3–5, 3 × 6–8, ….
    const week = commitDay(planA, slots[0].key, { workout: [410, 161, 1, 43, 103, 150].map(byId), prescriptions: { 410: "2 × 10–25" }, settings: {}, context: [] });
    expect(saveStackRecord({ id: "stack-strength", regionId: "forearm", planWeek: 1, mappingVersion: "forearm_mappings_v1", total: 5, createdAt: "2026-10-20T08:00:00.000Z", settings: { days: null, perDay: 2, holds: null }, entries: [{ dayKey: slots[0].key, catalogExerciseId: 410, prescription: "2 × 10–25" }] }, null).ok).toBe(true);
    const readings = (store: WeeklyDayStore) => { const day = loadDay(store, slots[0].key); return Object.fromEntries(day.workout.map((entry, index) => [entry.id, prescriptionOf(day.prescriptions[entry.id], index, "Max strength")])); };
    render(createElement(Harness, { initial: { mode: "planned" }, weeks: { 1: week }, goal: "Max strength" }));
    await act(async () => {});
    await act(async () => { card().open = true; fireEvent(card(), new Event("toggle")); });
    await waitFor(() => expect(within(card()).getByRole("button", { name: "Take it out" })).not.toBeNull(), { timeout: 10000 });
    const before = readings(week);
    await click(within(card()).getByRole("button", { name: "Take it out" }));
    expect(batches.at(-1)!.changes).toEqual([{ kind: "remove", dayKey: slots[0].key, entryId: 410, catalogExerciseId: 410, prescription: "2 × 10–25" }]);
    // Bench Press moves from third place (3 × 6–8) to second (4 × 3–5 under Max strength): pinned to what it read.
    expect(loadDay(shownWeeks[1], slots[0].key).prescriptions).toEqual({ 1: "3 × 6–8" });
    const { 410: _gone, ...others } = before;
    expect(readings(shownWeeks[1])).toEqual(others);
    expect(notices.at(-1)).toMatchObject({ title: "One-Arm Dumbbell Wrist Curl taken out of Day 01 of Week 1", description: "Your other exercises are unchanged." });
    await click(within(card()).getByRole("button", { name: "Undo" }));
    expect(shownWeeks[1]).toEqual(week);
  });

  it("changes the total by designing again on the week without the stack, and replaces the stack's own entries in one batch with one Undo", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    await openCard();
    await click(addButton());
    await waitFor(() => expect(within(card()).getByRole("button", { name: "Change the total" })).not.toBeNull());
    const added = shownWeeks[1];
    await click(within(card()).getByRole("button", { name: "Change the total" }));
    expect(totalField().value).toBe("14");
    expect(within(card()).getByText("It starts at your stack's 14. No number suits everyone; change it any time.")).not.toBeNull();
    expect(changes()[1]).toBe("Direct moving sets 3 → 14 · muscles with direct work 1 → 18 of 19");
    await click(within(card()).getByRole("button", { name: "One set more" }));
    expect(addButton().textContent).toBe("Replace your stack: 12 sets (11 exercises, 3 days) in Week\u00a01");
    await click(addButton());
    expect(batches[1].changes.filter((change) => change.kind === "remove")).toHaveLength(11);
    expect(batches[1].changes.filter((change) => change.kind === "add")).toHaveLength(11);
    expect(within(card()).getByRole("button", { name: "Undo" }).closest("p")!.textContent).toBe("Changed your stack in Plan Week 1: 14 → 15 direct moving setsUndo");
    await waitFor(() => expect(summaryLines()).toEqual(["Design a stack", "Your stack: 15 direct moving sets in Week 1"]));
    expect(loadStackStore(null).stacks).toHaveLength(1);
    expect(loadStackStore(null).stacks[0].total).toBe(15);
    // One Undo puts the earlier stack back, and its record.
    await click(within(card()).getByRole("button", { name: "Undo" }));
    expect(directIn(shownWeeks[1])).toEqual(directIn(added));
    expect(loadStackStore(null).stacks[0].total).toBe(14);
  });

  it("offers the full design for another built week, starting at the last total, when the stack is in another week", async () => {
    render(createElement(Harness, { initial: { mode: "planned" }, weeks: { 1: planA, 2: planA } }));
    await act(async () => {});
    await openCard();
    await click(addButton());
    await waitFor(() => expect(summaryLines()[1]).toBe("Your stack: 14 direct moving sets in Week 1"));
    await click(within(screen.getByRole("group", { name: "Plan week" })).getByRole("button", { name: "Week 2" }));
    expect(lastState?.planWeek).toBe(2);
    await waitFor(() => expect(within(card()).getByText("Your stack is in Week 1, not Week 2")).not.toBeNull());
    expect(summaryLines()).toEqual(["Design a stack", "Plan Week 2 · 3 direct moving sets now"]);
    await click(within(card()).getByRole("button", { name: "Design for Week 2" }));
    expect(totalField().value).toBe("14");
    expect(within(card()).getByText("It starts at 14, your last total here. No number suits everyone; change it any time.")).not.toBeNull();
    expect(addButton().textContent).toBe("Add 11 sets (11 exercises, 3 days) to Week\u00a02");
  });

  it("in Completed mode reads the week being trained, as written", async () => {
    render(createElement(Harness, { initial: { mode: "completed" } }));
    await act(async () => {});
    await openCard();
    expect(within(card()).getByText("From your plan as written, not your logged sets.")).not.toBeNull();
    expect(addButton().textContent).toBe("Add 11 sets (11 exercises, 3 days) to Week\u00a01");
  });

  it("says About me's answer in its own words, and changes nothing because of it", async () => {
    render(createElement(Harness, { initial: { mode: "planned" }, aboutMeArea: { constraintType: "clinician_restricted", answer: "A clinician has limited what I can do" } }));
    await act(async () => {});
    await openCard();
    expect(within(card()).getByText("Your answer in About me for the forearms: “A clinician has limited what I can do”. You can start lower or leave movements out.")).not.toBeNull();
    expect(totalField().value).toBe("14");
  });

  it("uses no word of a recommendation, an optimum or a risk, names no side, and gives no muscle a number of its own", async () => {
    render(createElement(Harness, { initial: { mode: "planned" }, weeks: { 1: planA } }));
    await act(async () => {});
    await openCard();
    for (const details of Array.from(card().querySelectorAll("details"))) await act(async () => { details.open = true; fireEvent(details, new Event("toggle")); });
    await click(rowButtons()[0]);
    const text = [card().textContent ?? "", ...Array.from(card().querySelectorAll("[aria-label]")).map((element) => element.getAttribute("aria-label") ?? "")].join("\n");
    expect(text).toMatch(/How the stack is built/);
    expect(text).not.toMatch(/\b(optimal|optimum|ideal|best|should|need to|enough|too much|too little|risk|safe)\b|%/i);
    expect(text).not.toMatch(/\b(left|right)\b(?! out)/i);
    // The only per-muscle numbers are the athlete's own targets (none here) and the planned before → after counts.
    expect(text).not.toMatch(/sets? (a|per) week for [a-z]/i);
  });
});

describe("the ways in", () => {
  it("the drawing's strip with nothing selected opens the card and brings it into view", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    const strip = screen.getByRole("group", { name: "Selected muscle" });
    const button = within(strip).getByRole("button", { name: "Design a stack" });
    expect(button.className).toBe("spz-button");
    await click(button);
    expect(card().open).toBe(true);
    await screen.findByText(/^Pick a weekly number/, undefined, { timeout: 10000 });
    await act(async () => { await new Promise((resolve) => requestAnimationFrame(() => resolve(null))); });
    expect(document.activeElement).toBe(card().querySelector("summary"));
  });

  it("Planned mode's Coverage to review leads with the movements with no direct moving work, and opens the card; Completed mode does not", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await act(async () => {});
    const findings = screen.getByRole("heading", { name: "Coverage to review" }).closest("section")!;
    const first = findings.querySelector(".spz-finding")!;
    // 12 since F3: 420 makes the index and little finger extension a movement the reviewed catalog trains directly.
    expect(first.querySelector("strong")!.textContent).toBe("12 movements have no direct moving work in Plan Week 1");
    await click(within(first as HTMLElement).getByRole("button", { name: /Design a stack/ }));
    expect(card().open).toBe(true);
    cleanup();
    render(createElement(Harness, { initial: { mode: "completed" } }));
    await act(async () => {});
    expect(screen.queryByText(/movements have no direct moving work/)).toBeNull();
  });

  it("open=stack opens the card once, and the address forgets the ask", async () => {
    render(createElement(Harness, { initial: { mode: "planned", open: "stack" } }));
    await act(async () => {});
    expect(card().open).toBe(true);
    expect(lastState?.open).toBeUndefined();
    await screen.findByText(/^Pick a weekly number/, undefined, { timeout: 10000 });
  });
});
