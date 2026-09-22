// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { WarmupPanel } from "./WarmupPanel";

afterEach(() => { document.body.innerHTML = ""; });

const draw = () => render(React.createElement(WarmupPanel, { workout: exercises.slice(0, 6), goal: "Max strength" }));

/**
 * Review's question is "is this day any good?". The warm-up answered it with six
 * drill cards - number, name, phase, cue and dose each - measured at 1,010px on a
 * 390px-wide screen: a script for a session you are not doing yet, opened on a
 * page you came to in order to read.
 */
describe("Review's warm-up states what, before how", () => {
  it("names every drill in order without opening the script", () => {
    draw();
    const detail = document.querySelector(".warmup-drills-detail") as HTMLDetailsElement | null;
    expect(detail, "the drills are a disclosure").toBeTruthy();
    expect(detail!.open, "and it is closed").toBe(false);
    const summary = detail!.querySelector("summary small")?.textContent || "";
    const drills = [...detail!.querySelectorAll(".warmup-drill strong")].map((node) => node.textContent || "");
    expect(drills.length, "there are drills to name").toBeGreaterThan(1);
    // Every one of them, not a truncated sample: the summary is the answer to
    // "what would I warm up", and a partial list is a different answer.
    for (const name of drills) expect(summary, `${name} is named in the summary`).toContain(name);
  });

  it("keeps the estimate and the stack signals in front, where the question is", () => {
    draw();
    expect(document.querySelector(".warmup-time")?.textContent).toMatch(/~\d+ min/);
    expect(document.querySelector(".warmup-focus")).toBeTruthy();
    // The cues and doses are behind the tap, with the drills they belong to.
    expect(document.querySelectorAll(".warmup-drills-detail .warmup-dose").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".warmup-head .warmup-dose").length).toBe(0);
  });

  it("still says this is preparation rather than a screening", () => {
    draw();
    expect(document.querySelector(".warmup-footer")?.textContent).toContain("not a medical screening");
  });
});
