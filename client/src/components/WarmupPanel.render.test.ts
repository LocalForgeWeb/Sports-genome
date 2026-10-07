// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getStackWarmup, mobilityTagLabel, preTrainingMobilityLibrary } from "@/lib/preTrainingMobility";
import { drillPhotoSet } from "@/lib/exercisePhotos";
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

  it("names the stack signals in the same plain words as the sentence above them", () => {
    draw();
    const chips = [...document.querySelectorAll(".warmup-focus b")].map((node) => node.textContent);
    // Splitting the identifiers on capitals printed "horizontal Push" and "single Leg".
    expect(chips).toEqual(getStackWarmup(exercises.slice(0, 6), "Max strength").focusTags.slice(0, 5).map(mobilityTagLabel));
    expect(chips).toContain("horizontal push");
  });
});

/**
 * October 7: the drills and stretches had no pictures at all. A drill the source photographs
 * shows its start frame beside its name, and opens its start and finish under the cue; a drill
 * it does not shows the same frame with an icon, never another drill's photo.
 */
describe("the warm-up's drill photographs", () => {
  // A day whose warm-up includes a photographed drill and one without a photograph.
  const day = (() => {
    for (let start = 0; start < exercises.length; start += 3) {
      const workout = exercises.slice(start, start + 6);
      const drills = getStackWarmup(workout, "Athleticism").drills;
      if (drills.some((drill) => drillPhotoSet(drill.id)) && drills.some((drill) => !drillPhotoSet(drill.id))) return { workout, drills };
    }
    throw new Error("no day has both kinds of drill");
  })();

  it("opens a photographed drill's start and finish under its cue, one drill at a time", () => {
    render(React.createElement(WarmupPanel, { workout: day.workout, goal: "Athleticism" }));
    const shown = day.drills.find((drill) => drillPhotoSet(drill.id))!;
    const toggle = screen.getByRole("button", { name: `Show photos of ${shown.name}` });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.querySelector(".exercise-media-thumb img")?.getAttribute("src")).toBe(drillPhotoSet(shown.id)!.thumbUrl);
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: `Hide photos of ${shown.name}` })).toBe(toggle);
    const photos = screen.getAllByRole("img", { name: new RegExp(`^${shown.name.replace(/[()]/g, "\\$&")}, (start|finish) position$`) });
    expect(photos.map((photo) => photo.getAttribute("alt"))).toEqual([`${shown.name}, start position`, `${shown.name}, finish position`]);
    expect(document.querySelector(".warmup-drill-photos figcaption")?.textContent).toContain("identify the drill");
    fireEvent.click(toggle);
    expect(document.querySelector(".warmup-drill-photos")).toBeNull();
  });

  it("gives a drill without a photograph the same frame with an icon, and nothing to open", () => {
    render(React.createElement(WarmupPanel, { workout: day.workout, goal: "Athleticism" }));
    const bare = day.drills.find((drill) => !drillPhotoSet(drill.id))!;
    expect(screen.queryByRole("button", { name: `Show photos of ${bare.name}` })).toBeNull();
    const row = [...document.querySelectorAll(".warmup-drill")].find((article) => article.querySelector("strong")?.textContent === bare.name)!;
    expect(row.querySelector(".exercise-media-thumb")?.getAttribute("data-state")).toBe("placeholder");
    expect(row.querySelector("img")).toBeNull();
  });

  it("puts the same frame on every card in the library", () => {
    render(React.createElement(WarmupPanel, { workout: day.workout, goal: "Athleticism" }));
    const cards = document.querySelectorAll(".warmup-library article");
    expect(cards.length).toBe(preTrainingMobilityLibrary.length);
    for (const card of cards) expect(card.querySelector(".exercise-media-thumb"), card.textContent ?? "").toBeTruthy();
    const photographed = [...cards].filter((card) => card.querySelector(".exercise-media-thumb img")).length;
    expect(photographed).toBe(preTrainingMobilityLibrary.filter((drill) => drillPhotoSet(drill.id)).length);
  });
});
