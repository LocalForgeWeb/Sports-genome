// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StackAnalysisPage, describeRelativeInvolvement } from "./StackAnalysisPage";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import { exercises } from "@/lib/exerciseCatalog";

/**
 * The Sep 30 recording's Push day: Barbell Bench Press (1), Machine Chest Press (11),
 * Barbell Overhead Press (101) and Cable Triceps Pushdown (150). The figures below come
 * from the catalog's tags and the genome's scores (see stackMuscleAnalysis.test.ts).
 */
const workout = [1, 11, 101, 150].map((id) => exercises.find((exercise) => exercise.id === id)!);

function renderPage(sets = 3) {
  const analysis = analyzeSplitStack(workout, exercises, "Push");
  return render(React.createElement(StackAnalysisPage, {
    workout,
    split: "Push" as const,
    dayLabel: "Week 1 · Day 01 · Push",
    targetIndex: analysis.score,
    suggestions: analysis.suggestions,
    catalog: exercises,
    sportId: "wrestling",
    prescriptions: Object.fromEntries(workout.map((exercise) => [exercise.id, `${sets} × 8`])),
    onAddSuggestion: () => undefined,
    onClose: () => undefined,
  }));
}

const inspect = () => document.querySelector<HTMLDetailsElement>(".stack-analysis-detail-disclosure")!;
const summaryText = () => inspect().querySelector("summary")!.textContent;
const section = (name: string) => screen.getByRole("heading", { level: 2, name }).closest("section")!;

describe("Training Day analysis, Sep 30 brief §7", () => {
  let scrolled: Element[];
  beforeEach(() => {
    scrolled = [];
    // jsdom has no layout, so no scrollIntoView; record which element asked to be shown.
    Element.prototype.scrollIntoView = vi.fn(function (this: Element) { scrolled.push(this); });
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    document.body.style.overflow = "";
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it("names three sections: Coverage, Workload and Muscle breakdown, each with its basis", () => {
    renderPage();
    expect(within(section("Coverage")).getByText("Catalog muscle tags against the push targets. Not sets.")).toBeTruthy();
    expect(within(section("Workload")).getByText("Sets per muscle from your prescriptions. Not coverage points.")).toBeTruthy();
    expect(within(section("Muscle breakdown")).getByText(/From exercise roles in the catalog genome, as a share of the day's highest muscle\. Not sets\./)).toBeTruthy();
    // Relative involvement lives in Muscle breakdown only, not inside Coverage.
    expect(within(section("Coverage")).queryByText("Supporting involvement")).toBeNull();
    expect(within(section("Muscle breakdown")).getByText("Supporting involvement")).toBeTruthy();
  });

  it("counts the split's targets the day trains against all of them", () => {
    renderPage();
    // Push has five targets; this day trains four of them (no serratus anterior).
    expect(within(section("Coverage")).getByText("4 of 5 targets trained")).toBeTruthy();
  });

  it("opens Inspect on the day's highest muscle, said as such, with its basis in the detail", () => {
    renderPage();
    expect(inspect().open).toBe(false);
    expect(summaryText()).toBe("Inspect Triceps brachiiHighest relative involvement in this day");
    expect(inspect().textContent).toContain("From exercise roles in the catalog genome: prime mover ×1, synergist ×0.65, stabilizer ×0.4, summed over this day's exercises. Set counts are not included; see Workload for sets.");
    expect(inspect().textContent).toContain("contribution index, 0–100, before role weighting");
    expect(document.body.textContent).not.toContain("most-worked");
  });

  it("opens Inspect and brings it into view when a coverage row is tapped", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Pectoralis major, Primary target/ }));
    expect(inspect().open).toBe(true);
    expect(summaryText()).toBe("Inspect Pectoralis major77% of Triceps brachii's involvement, the day's highest");
    expect(scrolled).toEqual([inspect()]);
    expect(document.activeElement).toBe(inspect().querySelector("summary"));
    // The row it came from now reads as the selected one.
    expect(screen.getByRole("button", { name: /^Pectoralis major, Primary target/ }).className).toContain("stack-analysis-row-active");
  });

  it("opens Inspect from the map without moving the figure or focus, directly below the map", () => {
    renderPage();
    const breakdown = section("Muscle breakdown");
    const map = breakdown.querySelector<HTMLDetailsElement>(".stack-analysis-map-disclosure")!;
    // The map comes first, so the summary a map tap opens sits right under the figure.
    expect(map.compareDocumentPosition(inspect()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const pectoralis = Array.from(map.querySelectorAll<HTMLButtonElement>(".atlas-role-rows button"))
      .find((button) => button.textContent?.startsWith("Pectoralis major"))!;
    pectoralis.focus();
    fireEvent.click(pectoralis);
    expect(inspect().open).toBe(true);
    expect(summaryText()).toBe("Inspect Pectoralis major77% of Triceps brachii's involvement, the day's highest");
    // Scrolling to Inspect from the map pushed the figure off-screen on every tap, and moved focus off it.
    expect(scrolled).toEqual([]);
    expect(document.activeElement).toBe(pectoralis);
  });

  it("keeps Workload and Muscle breakdown together in one column, apart from Coverage", () => {
    renderPage();
    const aside = section("Workload").parentElement!;
    expect(aside.className).toBe("stack-analysis-aside");
    expect(section("Muscle breakdown").parentElement).toBe(aside);
    expect(aside.contains(section("Coverage"))).toBe(false);
  });

  it("keeps the overhead press once for anterior deltoid, as a prime mover, in Where this comes from", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Anterior deltoid, Primary target/ }));
    expect(summaryText()).toBe("Inspect Anterior deltoid99% of Triceps brachii's involvement, the day's highest");
    const rows = Array.from(inspect().querySelectorAll(".stack-analysis-contributions article"), (row) => row.textContent);
    expect(rows.filter((text) => text?.includes("Barbell Overhead Press"))).toHaveLength(1);
    expect(rows.find((text) => text?.includes("Barbell Overhead Press"))).toContain("Prime mover");
    // Static rows: nothing in the list pretends to be a control.
    expect(inspect().querySelectorAll(".stack-analysis-contributions button")).toHaveLength(0);
  });

  it("shows direct and supporting sets for each muscle on one scale", () => {
    renderPage();
    const workload = section("Workload");
    const frontDelts = within(workload).getByLabelText(/^Anterior deltoid:/);
    expect(frontDelts.textContent).toContain("3 direct");
    expect(frontDelts.textContent).toContain("+ 9 supporting sets (counted as 4.5)");
    const chest = within(workload).getByLabelText(/^Pectoralis major:/);
    expect(chest.textContent).toContain("6 direct");
    expect(chest.querySelector(".session-volume-supporting")).toBeNull();
    // One scale: the widest bar is 3 direct + 4.5 counted supporting = 7.5 sets.
    expect(workload.textContent).toContain("Every bar is on one scale, 0 to 7.5 sets.");
    const width = (row: HTMLElement, part: string) => (row.querySelector(`.session-volume-${part}`) as HTMLElement).style.width;
    expect([width(frontDelts, "direct"), width(frontDelts, "support")]).toEqual(["40%", "60%"]);
    expect([width(chest, "direct"), width(chest, "support")]).toEqual(["80%", "0%"]);
  });

  it("does not move relative involvement when the set counts change; Workload does", () => {
    const breakdown = (sets: number) => {
      renderPage(sets);
      const text = { breakdown: section("Muscle breakdown").textContent, workload: section("Workload").textContent };
      cleanup();
      document.body.innerHTML = "";
      return text;
    };
    const three = breakdown(3);
    const six = breakdown(6);
    expect(six.breakdown).toBe(three.breakdown);
    expect(six.workload).not.toBe(three.workload);
    expect(six.workload).toContain("12 direct");
  });
});

describe("describeRelativeInvolvement", () => {
  const name = (muscle: string) => ({ abs: "Rectus abdominis", triceps: "Triceps brachii" })[muscle] || muscle;

  it("names the day's highest muscle as the reference, in the possessive", () => {
    expect(describeRelativeInvolvement({ involvement: 40, rawInvolvement: 72 }, { muscle: "triceps", rawInvolvement: 178 }, name)).toBe("40% of Triceps brachii's involvement, the day's highest");
    expect(describeRelativeInvolvement({ involvement: 40, rawInvolvement: 72 }, { muscle: "abs", rawInvolvement: 178 }, name)).toBe("40% of Rectus abdominis' involvement, the day's highest");
  });

  it("says the muscle is the highest rather than '100% of' itself, including a tie", () => {
    expect(describeRelativeInvolvement({ involvement: 100, rawInvolvement: 178 }, { muscle: "triceps", rawInvolvement: 178 }, name)).toBe("Highest relative involvement in this day");
    // A rounded 100 that is not the highest still names the muscle it is measured against.
    expect(describeRelativeInvolvement({ involvement: 100, rawInvolvement: 177.5 }, { muscle: "triceps", rawInvolvement: 178 }, name)).toBe("100% of Triceps brachii's involvement, the day's highest");
  });
});
