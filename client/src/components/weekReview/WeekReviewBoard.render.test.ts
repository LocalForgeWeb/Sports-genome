// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeekReviewBoard } from "./WeekReviewBoard";
import { ReviewHead, ReviewWeekPills } from "./ReviewHead";
import { analyzeWeek, figureExposure, type WeekAnalysis } from "@/lib/weekReview";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots } from "@/lib/trainingDayPlan";
import { splitDaysForFrequency } from "@/lib/splitCycle";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
afterEach(cleanup);

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const slots = buildDaySlots(splitDaysForFrequency(5));
const key = (index: number) => slots[index].key;
const fullPlan = { [key(0)]: [1, 101, 26, 111, 40].map(byId), [key(1)]: [57, 43, 87, 126].map(byId), [key(2)]: [161, 169, 194, 186].map(byId), [key(4)]: [66, 21].map(byId) };
const analyse = (plan: Record<string, ReturnType<typeof byId>[]>, prescriptions = {}) => analyzeWeek({ slots, plan, prescriptions, goal: "Athleticism", catalog: exercises });

const draw = (analysis: WeekAnalysis, props: Partial<Parameters<typeof WeekReviewBoard>[0]> = {}) => {
  const handlers = { onEditWeek: vi.fn(), onEditDay: vi.fn(), onInspectExercise: vi.fn(), onFindExercises: vi.fn() };
  const view = render(createElement(WeekReviewBoard, { analysis, ready: true, ...handlers, ...props }));
  return { ...view, ...handlers };
};

describe("the week board", () => {
  it("shows every session in plan order, built or not, and never calls an empty slot rest", () => {
    const { container } = draw(analyse(fullPlan));
    const strip = screen.getByRole("list", { name: "Sessions in plan order" });
    const chips = within(strip).getAllByRole("listitem").map((item) => item.textContent);
    expect(chips).toHaveLength(5);
    expect(chips[0]).toMatch(/^Push5 exercises · 17 sets$/);
    expect(chips[3]).toBe("UpperNot built");
    expect(container.textContent).not.toMatch(/rest day/i);
  });

  it("ranks six muscles first, on one scale, with direct and supporting apart, and opens the rest on request", () => {
    const analysis = analyse(fullPlan);
    draw(analysis);
    const list = screen.getByRole("list", { name: /Muscles ranked by direct sets/ });
    expect(within(list).getAllByRole("listitem")).toHaveLength(6);
    const first = within(list).getAllByRole("button")[0];
    const top = [...analysis.muscles].sort((a, b) => b.direct - a.direct)[0];
    expect(first.textContent).toContain(top.label);
    expect(first.textContent).toMatch(/\d+ direct/);
    expect(within(first).getByRole("img").getAttribute("aria-label")).toBe(`${top.label}: ${top.direct} of the week's largest ${analysis.max.direct}`);
    fireEvent.click(screen.getByRole("button", { name: `View all muscles (${analysis.muscles.length})` }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(analysis.muscles.length);
    // A split-target muscle nothing trains is a zero on the board, not an absence.
    const zero = analysis.muscles.find((muscle) => muscle.total === 0);
    if (zero) expect(within(list).getByText(zero.label).closest("button")!.textContent).toContain("Not planned");
  });

  it("applies the metric to the figure, the chart and the legend together", () => {
    const analysis = analyse(fullPlan);
    const { container } = draw(analysis);
    expect(container.querySelector("svg.anatomy-figure")!.getAttribute("data-encoding")).toBe("exposure");
    expect(screen.queryByText(/Supporting contribution, estimated/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "With support (est.)" }));
    expect(screen.getByText(/Supporting contribution, estimated: each supporting set adds 0.5/)).not.toBeNull();
    expect(screen.getByRole("list", { name: /Muscles ranked by attributed sets/ })).not.toBeNull();
    const top = [...analysis.muscles].sort((a, b) => b.total - a.total)[0];
    expect(within(screen.getByRole("list", { name: /Muscles ranked by attributed sets/ })).getAllByRole("button")[0].textContent).toContain(top.label);
    // The figure's legend states the figure's own top step: its largest painted region.
    expect(screen.getByText(/the top step is/).textContent).toContain(String(figureExposure(analysis, "total").max));
  });

  it("selects a muscle from the chart, rings it on the figure and opens its sessions with actions", () => {
    const analysis = analyse(fullPlan);
    const { container, onEditDay, onInspectExercise, onFindExercises } = draw(analysis);
    const chest = analysis.muscles.find((muscle) => muscle.key === "chest")!;
    fireEvent.click(screen.getByRole("button", { name: `View all muscles (${analysis.muscles.length})` }));
    fireEvent.click(within(screen.getByRole("list", { name: /Muscles ranked/ })).getByText(chest.label).closest("button")!);
    const detail = screen.getByRole("region", { name: `${chest.label} by session` });
    expect(container.querySelector('.anatomy-muscle[data-muscle="chest"]')!.getAttribute("data-selected")).toBe("true");
    const days = within(detail).getByRole("list", { name: /by session, as a share of its week/ });
    expect(within(days).getAllByRole("listitem").map((item) => item.textContent)).toHaveLength(analysis.builtCount);
    fireEvent.click(within(days).getAllByRole("button", { name: /^Edit / })[1]);
    expect(onEditDay).toHaveBeenCalledWith(key(1));
    fireEvent.click(within(detail).getByRole("button", { name: `Inspect ${chest.exercises[0].exercise.name}` }));
    expect(onInspectExercise).toHaveBeenCalledWith(chest.exercises[0].exercise);
    fireEvent.click(within(detail).getByRole("button", { name: /Find exercises for pectoralis major/ }));
    expect(onFindExercises).toHaveBeenCalledWith("chest");
    // Selecting it on the figure again closes it; one detail at a time.
    fireEvent.click(container.querySelector('.anatomy-hit[aria-label^="Pectoralis major"]')!);
    expect(screen.queryByRole("region", { name: `${chest.label} by session` })).toBeNull();
  });

  it("marks movement coverage per session from the catalog's own values and lists what is not planned", () => {
    const analysis = analyse(fullPlan);
    draw(analysis);
    const push = analysis.patterns.find((pattern) => pattern.movement === "Horizontal push")!;
    const row = screen.getByText("Horizontal push").closest("li")!;
    expect(within(row).getByLabelText("Push: present")).not.toBeNull();
    expect(within(row).getAllByLabelText(/not in this session/).length).toBe(analysis.builtCount - push.sessionKeys.length);
    // The row opens to the exercises carrying the pattern, with the sheet a tap away.
    const exercises = within(row).getByRole("list", { name: "Horizontal push exercises" });
    expect(within(exercises).getAllByRole("listitem")).toHaveLength(push.exercises.length);
    // Each Inspect names its exercise, so a screen reader does not hear "Inspect" fifteen times.
    expect(within(exercises).getAllByRole("button", { name: /^Inspect / }).map((button) => button.getAttribute("aria-label"))).toEqual(push.exercises.map((row) => `Inspect ${row.exercise.name}`));
    if (analysis.notPlanned.length) expect(screen.getByText("Not planned").parentElement!.textContent).toContain(analysis.notPlanned[0]);
  });

  it("compares a selected pair of neighbouring sessions side by side with the criterion and two edits", () => {
    const bench = byId(1); const incline = byId(101);
    const analysis = analyse({ [key(0)]: [bench, incline], [key(1)]: [bench, incline], [key(3)]: [bench] }, { [key(0)]: { 1: "5 x 5", 101: "5 x 5" }, [key(1)]: { 1: "5 x 5", 101: "5 x 5" } });
    const { onEditDay } = draw(analysis);
    expect(screen.getByText(/Not compared: Pull and Upper, with an unbuilt day between them/)).not.toBeNull();
    const pair = within(screen.getByRole("list", { name: "Neighbouring session pairs" })).getAllByRole("button")[0];
    expect(pair.textContent).toContain("heavy");
    fireEvent.click(pair);
    const detail = screen.getByRole("region", { name: "Push and Pull compared" });
    expect(detail.textContent).toContain("at least 3 attributed sets");
    expect(detail.textContent).toContain("heavy from 8 summed shared sets");
    fireEvent.click(within(detail).getByRole("button", { name: /Edit Pull/ }));
    expect(onEditDay).toHaveBeenCalledWith(key(1));
    expect(screen.queryByText(/Move session/)).toBeNull();
  });

  it("limits suggested adjustments to three evidence-linked findings with an action each, and routes the action", () => {
    const analysis = analyse(fullPlan);
    const { onEditDay } = draw(analysis);
    const review = analysis.findings.filter((finding) => finding.kind === "review");
    const shown = document.querySelectorAll(".wr-findings > li");
    expect(shown.length).toBe(Math.min(3, review.length));
    shown.forEach((item, index) => {
      expect(item.textContent).toContain(review[index].headline);
      expect(item.textContent).toContain(review[index].source);
      expect(within(item as HTMLElement).getByRole("button").textContent).toContain(review[index].action.label);
    });
    const gap = review.find((finding) => finding.rule === "target-gap");
    if (gap && gap.action.type === "edit-day") {
      fireEvent.click(within(document.querySelector(`.wr-finding[data-rule="target-gap"]`) as HTMLElement).getByRole("button"));
      expect(onEditDay).toHaveBeenCalledWith(gap.action.dayKey, { addExercises: true });
    }
  });

  it("shows three findings first and the rest on request", () => {
    // A week with a heavy overlap and target gaps on several days: more than three review points.
    const bench = byId(1); const incline = byId(101);
    const busy = analyse({ [key(0)]: [bench, incline], [key(1)]: [bench, incline], [key(2)]: [byId(161)], [key(3)]: [bench], [key(4)]: [byId(66)] }, { [key(0)]: { 1: "5 x 5", 101: "5 x 5" }, [key(1)]: { 1: "5 x 5", 101: "5 x 5" } });
    const review = busy.findings.filter((finding) => finding.kind === "review");
    expect(review.length).toBeGreaterThan(3);
    draw(busy);
    expect(document.querySelectorAll(".wr-findings > li")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Show ${review.length - 3} more`) }));
    expect(document.querySelectorAll(".wr-findings > li")).toHaveLength(review.length);
  });

  it("selecting a muscle on the figure shows its chart row, even below the first six", () => {
    const analysis = analyse(fullPlan);
    const { container } = draw(analysis);
    const ranked = [...analysis.muscles].sort((a, b) => b.direct - a.direct || b.total - a.total || a.label.localeCompare(b.label));
    const low = ranked.slice(6).find((muscle) => muscle.figureKeys.length === 1 && container.querySelector(`.anatomy-hit[aria-label^="${muscle.label}"]`))
      ?? ranked.slice(6).find((muscle) => container.querySelector(`.anatomy-hit[id$="-hit-${muscle.figureKeys[0]}"]`))!;
    const hit = container.querySelector(`.anatomy-hit[id$="-hit-${low.figureKeys[0]}"]`)!;
    fireEvent.click(hit);
    const row = within(screen.getByRole("list", { name: /Muscles ranked/ })).getByText(low.label).closest("button")!;
    expect(row.getAttribute("aria-pressed")).toBe("true");
  });

  it("hands focus back to what opened a detail when it closes", async () => {
    const analysis = analyse(fullPlan);
    draw(analysis);
    const row = within(screen.getByRole("list", { name: /Muscles ranked/ })).getAllByRole("button")[0];
    row.focus();
    fireEvent.click(row);
    const detail = screen.getByRole("region", { name: /by session$/ });
    within(detail).getByRole("button", { name: /^Close / }).focus();
    fireEvent.click(within(detail).getByRole("button", { name: /^Close / }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(row);
  });

  it("shows one strength and one review point only when the data supports them", () => {
    const analysis = analyse(fullPlan);
    draw(analysis);
    const strength = analysis.findings.find((finding) => finding.kind === "strength");
    const review = analysis.findings.find((finding) => finding.kind === "review");
    if (strength) expect(screen.getByText(strength.headline)).not.toBeNull();
    if (review) expect(screen.getAllByText(review.headline).length).toBeGreaterThan(0);
    cleanup();
    const single = analyse({ [key(0)]: [byId(1)] });
    draw(single);
    const expected = (single.findings.some((finding) => finding.kind === "strength") ? 1 : 0) + (single.findings.some((finding) => finding.kind === "review") ? 1 : 0);
    expect(document.querySelectorAll(".wr-point")).toHaveLength(expected);
  });

  it("holds an empty week to the strip and one way to begin, and a loading week to its layout", () => {
    const { onEditWeek } = draw(analyse({}));
    expect(screen.getByRole("list", { name: "Sessions in plan order" })).not.toBeNull();
    expect(document.querySelector("svg.anatomy-figure")).toBeNull();
    expect(screen.queryByText("Muscle exposure")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Add a workout/ }));
    expect(onEditWeek).toHaveBeenCalled();
    cleanup();
    draw(analyse(fullPlan), { ready: false });
    expect(screen.getByRole("status", { name: "Loading the week" })).not.toBeNull();
    expect(document.querySelector("svg.anatomy-figure")).toBeNull();
  });

  it("keeps a known zero and an unknown region distinct, and says so for an unmapped exercise", () => {
    const ghost = { ...byId(1), id: 99901, name: "Imported row", primaryMuscles: [], secondaryMuscles: [] };
    const analysis = analyse({ [key(0)]: [byId(1), ghost] });
    const { container } = draw(analysis);
    expect(screen.getByText(/1 exercise has no muscle mapping \(Imported row\)/)).not.toBeNull();
    // Quadriceps: nothing trains them, and the chart and the figure say the same (zero, resting).
    expect(container.querySelector('.anatomy-muscle[data-muscle="quads"]')!.hasAttribute("data-exposure")).toBe(false);
    expect(container.querySelector('.anatomy-hit[aria-label^="Quadriceps"]')!.getAttribute("aria-label")).toMatch(/no planned work/);
    // Soleus: no catalog exercise can tag it, so it is unknown (hatched), not a zero.
    expect(container.querySelector('.anatomy-muscle[data-muscle="soleus"]')!.getAttribute("data-exposure")).toBe("unknown");
    expect(container.querySelector('.anatomy-hit[aria-label^="Soleus"]')!.getAttribute("aria-label")).toMatch(/not counted/);
    expect(container.querySelector('.anatomy-muscle[data-muscle="chest"]')!.getAttribute("data-exposure")).toBe("5");
    expect(screen.getByText(/Not counted: no catalog exercise is tagged with this muscle/)).not.toBeNull();
  });
});

describe("the review head", () => {
  it("names the scope with one two-way control that reports its state", () => {
    const onScope = vi.fn();
    render(createElement(ReviewHead, { title: "Week 1 · 5-day plan", detail: "4 of 5 days built", scope: "week", onScope }));
    const control = screen.getByRole("group", { name: "Review scope" });
    expect(within(control).getByRole("button", { name: "Week" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(control).getByRole("button", { name: "Day" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(within(control).getByRole("button", { name: "Day" }));
    expect(onScope).toHaveBeenCalledWith("day");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Week 1 · 5-day plan");
  });

  it("offers the other generated weeks as pills and none when there is only one", () => {
    const onSelect = vi.fn();
    const { container } = render(createElement(ReviewWeekPills, { weeks: [{ week: 1, ready: true, savedDays: 4 }, { week: 2, ready: true, savedDays: 0 }, { week: 3, ready: false, savedDays: 0 }], activeWeek: 1, onSelect }));
    const group = screen.getByRole("group", { name: "Review week" });
    expect(within(group).getAllByRole("button").map((button) => button.textContent)).toEqual(["Week 14 saved", "Week 2Empty"]);
    fireEvent.click(within(group).getByRole("button", { name: /Week 2/ }));
    expect(onSelect).toHaveBeenCalledWith(2);
    cleanup();
    render(createElement(ReviewWeekPills, { weeks: [{ week: 1, ready: true, savedDays: 4 }], activeWeek: 1, onSelect }));
    expect(container.querySelector(".wr-weeks")).toBeNull();
  });
});
