// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AthleteBaselineQuiz } from "./AthleteBaselineQuiz";
import { areaQuestion, constraintChoices } from "@/lib/areaQuestion";
import { resolveConstraintPosture, type ResilienceTargetCatalog, type ResilienceTargetCatalogEntry } from "@shared/resilienceContext";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const target = (targetKey: string, name: string, targetType: ResilienceTargetCatalogEntry["targetType"], lateralitySupported: boolean): ResilienceTargetCatalogEntry => ({ targetId: `id-${targetKey}`, targetKey, name, region: "", targetType, lateralitySupported, supportedRoutes: ["general"] });
const catalog: ResilienceTargetCatalog = {
  status: "connected",
  boundary: "",
  targets: [
    target("shoulder", "Shoulder", "body_region", true),
    target("knee", "Knee", "body_region", true),
    target("lumbar_spine", "Low back", "body_region", false),
    target("sprinting", "Sprinting", "functional_task", false),
  ],
};

const continueButton = () => screen.getByRole("button", { name: /^Continue/ }) as HTMLButtonElement;
const advance = () => fireEvent.click(screen.getByRole("button", { name: /^(Continue|Skip for now)$/ }));
const pick = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));

/** General mode, then an area (and side), stopping on the question about it. */
function toQuestion(area: string, side?: string) {
  const onComplete = vi.fn();
  render(React.createElement(AthleteBaselineQuiz, { sports: [], targetCatalog: catalog, onComplete }));
  advance();
  pick(/General strength and resilience/);
  advance();
  pick(new RegExp(`^${area}`));
  if (side) pick(new RegExp(`^${side}$`));
  advance();
  return onComplete;
}

/**
 * Oct 5 brief, intro quiz clarity: name the area, offer plain answers with none chosen in
 * advance, and make Continue obvious - available once an answer is chosen, and saying so
 * until then.
 */
describe("How is your <area> feeling?", () => {
  afterEach(() => cleanup());

  it("names the area and the side the athlete chose, in one colour, with no eyebrow", () => {
    toQuestion("Shoulder", "Left");
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("How is your left shoulder feeling?");
    expect(heading.querySelector("em")).toBeNull();
    expect(screen.queryByText("Right now")).toBeNull();
    expect(screen.getByText("Choose the closest match so we can understand what you want to work around.")).toBeTruthy();
    expect(screen.getByText("Select one")).toBeTruthy();
    expect(document.body.textContent).not.toContain("never implied");
    expect(screen.getByText("Step 4 of 12")).toBeTruthy();
  });

  it("asks about both sides together, in the plural, when both were chosen", () => {
    toQuestion("Shoulder", "Both sides");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("How are your shoulders feeling?");
  });

  it("offers the six answers as one labelled radio group with nothing chosen yet", () => {
    toQuestion("Low back");
    const group = screen.getByRole("radiogroup", { name: "How is your low back feeling? Select one" });
    const radios = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(radios.map((radio) => radio.closest("label")?.querySelector("strong")?.textContent)).toEqual(["Feels fine", "Bothering me now", "Returning after an issue", "An issue that comes and goes", "A clinician has limited what I can do", "Not sure"]);
    expect(radios.every((radio) => !radio.checked)).toBe(true);
    for (const old of ["A proactive target", "Loading gets qualified", "Exposure gets rebuilt gradually"]) expect(document.body.textContent).not.toContain(old);
  });

  it("holds Continue until an answer is chosen, says why beside it, and never moves on by itself", () => {
    toQuestion("Knee", "Right");
    expect(continueButton().disabled).toBe(true);
    expect(screen.getByText("Choose one option to continue")).toBeTruthy();
    expect(continueButton().getAttribute("aria-describedby")).toBe("athlete-quiz-continue-hint");
    fireEvent.click(screen.getByRole("radio", { name: /Bothering me now/ }));
    // Choosing does not advance: the athlete confirms with Continue.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("How is your right knee feeling?");
    expect(continueButton().disabled).toBe(false);
    expect(screen.queryByText("Choose one option to continue")).toBeNull();
    // One answer at a time, and it can be changed.
    fireEvent.click(screen.getByRole("radio", { name: /Feels fine/ }));
    expect((screen.getByRole("radio", { name: /Feels fine/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("radio", { name: /Bothering me now/ }) as HTMLInputElement).checked).toBe(false);
  });

  it("keeps the answer through Back and Continue, and moves exactly one step", () => {
    toQuestion("Knee", "Right");
    fireEvent.click(screen.getByRole("radio", { name: /Returning after an issue/ }));
    advance();
    expect(screen.getByText("Step 5 of 12")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByText("Step 4 of 12")).toBeTruthy();
    expect((screen.getByRole("radio", { name: /Returning after an issue/ }) as HTMLInputElement).checked).toBe(true);
  });

  it("asks again, instead of carrying the answer over, when the area or its side changes", () => {
    toQuestion("Knee", "Right");
    fireEvent.click(screen.getByRole("radio", { name: /Bothering me now/ }));
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    pick(/^Shoulder/);
    advance();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("shoulder");
    expect(screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    expect(continueButton().disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: /Bothering me now/ }));
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    pick(/^Left$/);
    advance();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("How is your left shoulder feeling?");
    expect(screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
  });

  it("follows Not sure with the same red-flag check, and saves it as its own answer", () => {
    const onComplete = toQuestion("Knee", "Right");
    fireEvent.click(screen.getByRole("radio", { name: /Not sure/ }));
    expect(screen.getByRole("group", { name: /Do any of these apply\?/ })).toBeTruthy();
    advance();
    for (let guard = 0; guard < 12 && !screen.queryByRole("button", { name: "Open my plan" }); guard += 1) advance();
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Open my plan" })); });
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ constraint: { targetKey: "knee", constraintType: "unsure", laterality: "right" }, reportedSignals: [] }));
  });

  it("drops a ticked red flag when the answer becomes Feels fine", () => {
    const onComplete = toQuestion("Knee", "Right");
    fireEvent.click(screen.getByRole("radio", { name: /Bothering me now/ }));
    pick(/It is severe, or getting worse quickly/);
    expect(screen.getByText("Sports Genome will not build around this on its own.")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Feels fine/ }));
    expect(screen.queryByText("Sports Genome will not build around this on its own.")).toBeNull();
    advance();
    for (let guard = 0; guard < 12 && !screen.queryByRole("button", { name: "Open my plan" }); guard += 1) advance();
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Open my plan" })); });
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ constraint: expect.objectContaining({ constraintType: "proactive_none" }), reportedSignals: [] }));
  });
});

describe("The area, in the words a person would use", () => {
  const entry = (targetKey: string, name: string, type: ResilienceTargetCatalogEntry["targetType"] = "body_region", sides = true) => target(targetKey, name, type, sides);

  it("names a body part, its side, and both sides in the plural", () => {
    expect(areaQuestion(entry("shoulder", "Shoulder"), "shoulder", "right")).toBe("How is your right shoulder feeling?");
    expect(areaQuestion(entry("shoulder", "Shoulder"), "shoulder", "unspecified")).toBe("How is your shoulder feeling?");
    expect(areaQuestion(entry("foot", "Foot"), "foot", "bilateral")).toBe("How are your feet feeling?");
    expect(areaQuestion(entry("wrist_hand", "Wrist and hand"), "wrist_hand", "left")).toBe("How are your left wrist and hand feeling?");
    expect(areaQuestion(entry("lower_limb_general", "Lower limb (general)"), "lower_limb_general", "bilateral")).toBe("How are your legs feeling?");
  });

  it("ignores a side for an area that has none", () => {
    expect(areaQuestion(entry("lumbar_spine", "Low back", "body_region", false), "lumbar_spine", "bilateral")).toBe("How is your low back feeling?");
    expect(areaQuestion(entry("thoracic_spine", "Thoracic spine", "body_region", false), "thoracic_spine", "bilateral")).toBe("How is your upper back feeling?");
  });

  it("asks how a movement task feels, on a side when one was given", () => {
    expect(areaQuestion(entry("sprinting", "Sprinting", "functional_task", false), "sprinting", "bilateral")).toBe("How does sprinting feel right now?");
    expect(areaQuestion(entry("overhead_reaching", "Overhead reaching and throwing", "functional_task"), "overhead_reaching", "left")).toBe("How does overhead reaching and throwing feel on your left side?");
  });

  it("reads a target it doesn't know yet from its name, and never prints an empty area", () => {
    expect(areaQuestion(entry("rib_cage", "Rib cage (general)", "body_region", false), "rib_cage", "bilateral")).toBe("How is your rib cage feeling?");
    expect(areaQuestion(entry("jumping", "Jumping", "functional_task", false), "jumping", "bilateral")).toBe("How does jumping feel right now?");
    expect(areaQuestion(undefined, "shoulder", "left")).toBe("How is your left shoulder feeling?");
    expect(areaQuestion(undefined, "", "bilateral")).toBe("How is the area you chose feeling?");
  });

  it("keeps every stored answer, adds Not sure, and never reads Not sure as fine", () => {
    expect(constraintChoices.map((choice) => choice.value)).toEqual(["proactive_none", "symptomatic", "recent_or_returning", "prior_recurrent", "clinician_restricted", "unsure"]);
    expect(resolveConstraintPosture("unsure")).toBe("qualified_action");
    expect(resolveConstraintPosture("proactive_none")).toBe("ordinary_action");
    expect(resolveConstraintPosture("unsure", ["severe_or_worsening"])).toBe("withhold");
  });
});
