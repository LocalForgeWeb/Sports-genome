// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const workout = [exercises[0], exercises[1]];
const prescriptions = { [exercises[0].id]: "3 × 8", [exercises[1].id]: "2 × 10" };

function mount() {
  return render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: "Athleticism", dayLabel: "Week 1 · Push" }));
}

function startWorkout() {
  mount();
  fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/**
 * The head states progress as a bar with its count beside it, and the live card
 * states the set position and the target as two elements. Asserting the exact
 * rendered string pinned the punctuation between them, so these check the facts
 * a reader has to be able to get, and leave the typography free to change.
 */
function expectSet(line: string | null, set: number, of: number, target: string) {
  expect(line).toContain(`Set ${set} of ${of}`);
  expect(line).toContain(target);
}

function expectTally(done: number, planned: number) {
  const head = document.querySelector(".execution-head")!;
  expect(head.textContent).toContain(`${done}/${planned} sets`);
  const fill = head.querySelector(".session-progress-track i") as HTMLElement | null;
  expect(fill, "the count is paired with a bar").toBeTruthy();
  expect(fill!.style.width).toBe(`${planned ? Math.round((done / planned) * 100) : 0}%`);
}

describe("live workout glance contract", () => {
  // "The first view must make active exercise/set, prescribed or entered
  // progression variable, completion/rest state, and one dominant next action
  // immediately legible."
  it("leads with the active exercise, its set position, its prescription and the rest state", () => {
    startWorkout();
    const card = document.querySelector(".live-set-card")!;
    expect(card).toBeTruthy();
    expect(within(card as HTMLElement).getByRole("heading").textContent).toBe(exercises[0].name);
    expect(card.textContent).toContain("Set 1 of 3");
    expect(card.textContent).toContain("8");
    expect(document.querySelector(".live-rest-row")).toBeTruthy();
  });

  /**
   * The planner can now ask for a different target per set. Restating the whole
   * "3 × 10/8/6" on every set would make the athlete count through it mid-lift,
   * so the card states what this set is for.
   */
  it("states this set's own target when the sets differ", () => {
    render(createElement(DeviceWorkoutTracker, {
      workout: [exercises[0]],
      prescriptions: { [exercises[0].id]: "3 × 10/8/6" },
      settings: {}, goal: "Athleticism", dayLabel: "Week 1 · Push",
    }));
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    const line = () => document.querySelector(".live-set-prescription")!.textContent;
    expectSet(line(), 1, 3, "10");
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    expectSet(line(), 2, 3, "8");
    fireEvent.click(screen.getByRole("button", { name: /log set 2/i }));
    expectSet(line(), 3, 3, "6");
  });

  it("offers exactly one dominant next action, not one per planned set", () => {
    startWorkout();
    // The whole session is reachable, but behind an explicit drill-down, so the
    // glance surface is not competing with eleven other commit buttons.
    expect(document.querySelectorAll(".live-set-commit")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /log set 1/i })).toBeTruthy();
    expect(document.querySelector(".live-session-queue")?.hasAttribute("open")).toBe(false);
  });

  // "timer controls may not overlap, occlude, or create a competing tap target
  // beside reps/load/completion"
  it("keeps every rest control out of the set-entry and completion zone", () => {
    startWorkout();
    const entry = document.querySelector(".live-set-entry")!;
    const commit = document.querySelector(".live-set-commit")!;
    document.querySelectorAll(".live-rest-controls button").forEach((control) => {
      expect(entry.contains(control), "a rest control sits inside the entry zone").toBe(false);
      expect(commit.contains(control), "a rest control sits inside the commit action").toBe(false);
    });
    // And the rest row is a sibling below the action, not inside the card.
    expect(document.querySelector(".live-set-card")!.contains(document.querySelector(".live-rest-row"))).toBe(false);
  });

  it("advances to the next set and starts rest when a set is logged", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    expect(document.querySelector(".live-set-card")!.textContent).toContain("Set 2 of 3");
    expect(document.querySelector(".live-rest-row")!.textContent).toContain("Resting");
  });

  it("moves to the next exercise once its sets are confirmed, then to the finish state", () => {
    startWorkout();
    // Scoped to the card: jsdom renders a closed <details>, so the queue's own
    // per-set buttons are present in the tree even while the drill-down is shut.
    const commit = () => fireEvent.click(document.querySelector(".live-set-commit")!);
    for (let i = 0; i < 3; i++) commit();
    expect(document.querySelector(".live-set-card")!.textContent).toContain(exercises[1].name);
    for (let i = 0; i < 2; i++) commit();
    expect(document.querySelector(".live-set-card-done")).toBeTruthy();
    expect(document.querySelectorAll(".live-set-commit")).toHaveLength(0);
  });

  // "Secondary ... history ... use explicit drill-down that preserves
  // active-set context."
  it("does not move the active set when the full session is opened", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    const before = document.querySelector(".live-set-card")!.textContent;
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    expect(document.querySelector(".live-session-queue")?.hasAttribute("open")).toBe(true);
    expect(document.querySelector(".live-set-card")!.textContent).toBe(before);
  });
});

describe("progressive disclosure on the live surface", () => {
  const head = () => document.querySelector(".execution-head")!;
  const completedSessions = () =>
    (JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]") as { status: string }[]).filter((s) => s.status === "completed");

  it("puts no button in the head while sets remain", () => {
    startWorkout();
    expect(head().querySelector("button")).toBeNull();
    expect(document.querySelectorAll(".live-set-commit")).toHaveLength(1);
  });

  it("keeps the early finish below the full-session queue, and says what it keeps", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    const early = document.querySelector(".live-session-finish")!;
    const queue = document.querySelector(".live-session-queue")!;
    expect(queue.compareDocumentPosition(early) & Node.DOCUMENT_POSITION_FOLLOWING, "finish comes after the queue").toBeTruthy();
    expect(early.textContent).toContain("keeps the 1 logged set");
    fireEvent.click(early as HTMLElement);
    expect(completedSessions()).toHaveLength(1);
  });

  it("makes finishing the dominant action once every set is logged", () => {
    startWorkout();
    for (let i = 0; i < 5; i++) fireEvent.click(document.querySelector(".live-set-commit")!);
    expect(head().querySelector("button")).toBeNull();
    // One finish control now, on the completion card, not a second one below.
    const finishes = document.querySelectorAll(".live-session-finish");
    expect(finishes).toHaveLength(1);
    expect(document.querySelector(".live-set-card-done")!.contains(finishes[0])).toBe(true);
    expect(finishes[0].textContent).toContain("add 5 sets to Progress");
    // No next set to rest for, so no rest row counting down beside the finish.
    expect(document.querySelector(".live-rest-row")).toBeNull();
    fireEvent.click(finishes[0] as HTMLElement);
    expect(completedSessions()).toHaveLength(1);
  });
});

describe("live-set commitment semantics contract", () => {
  it("marks a typed-but-unlogged set as a draft rather than counting it", () => {
    startWorkout();
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "135" } });
    expectTally(0, 5);
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    expect(document.querySelector(".session-set-draft")!.textContent).toContain("typed, not logged");
  });

  it("excludes drafts at finish and says how many were left out", () => {
    startWorkout();
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    // Set 2 gets a value but is never logged.
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/reps/i), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: /finish workout/i }));

    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!);
    const saved = stored.find((session: { status: string }) => session.status === "completed");
    const savedSets = saved.exercises.flatMap((exercise: { sets: unknown[] }) => exercise.sets);
    expect(savedSets).toHaveLength(1);
    expect(savedSets[0]).toMatchObject({ weight: "135", completed: true });
  });

  it("keeps completion reversible from the full session", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    fireEvent.click(screen.getAllByRole("button", { name: /undo/i })[0]);
    expectTally(0, 5);
  });
});

describe("carried-forward entry", () => {
  it("prefills the next set with the load just confirmed, and records it on completion", () => {
    startWorkout();
    const entry = () => within(document.querySelector(".live-set-entry") as HTMLElement);
    fireEvent.change(entry().getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.change(entry().getByLabelText(/reps/i), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));

    expect((entry().getByLabelText(/weight/i) as HTMLInputElement).value).toBe("135");
    expect(document.querySelector(".live-set-last")!.textContent).toContain("Last set: 135 lb × 8");

    // Committing an untouched carried default records it as a real observation.
    fireEvent.click(screen.getByRole("button", { name: /log set 2/i }));
    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!);
    const sets = stored[0].exercises[0].sets;
    expect(sets[1]).toMatchObject({ weight: "135", reps: "8", completed: true });
  });

  it("does not count an untouched prefill as a typed-but-unlogged set", () => {
    startWorkout();
    const entry = () => within(document.querySelector(".live-set-entry") as HTMLElement);
    fireEvent.change(entry().getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    // Set 2 shows 135 as a default but was never touched.
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    expect(document.querySelector(".session-set-draft")).toBeNull();
  });
});

describe("clearing a carried-forward entry", () => {
  const entry = () => within(document.querySelector(".live-set-entry") as HTMLElement);
  const weight = () => entry().getByLabelText(/weight/i) as HTMLInputElement;

  function logFirstSetAt(load: string, reps: string) {
    startWorkout();
    fireEvent.change(weight(), { target: { value: load } });
    fireEvent.change(entry().getByLabelText(/reps/i), { target: { value: reps } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
  }

  // Reported from the gym: "it's not letting me delete the pounds so I can
  // enter the weight of the new exercise, it keeps going back to 135".
  // The carry was applied as `stored || carried`, so clearing the box wrote ""
  // to the set, "" is falsy, and the carry fell straight back in. There was no
  // state in which the field could be empty while a carry existed.
  it("stays empty when the athlete clears it", () => {
    logFirstSetAt("135", "15");
    expect(weight().value).toBe("135");

    fireEvent.change(weight(), { target: { value: "" } });
    expect(weight().value).toBe("");
  });

  it("accepts a new value typed after clearing", () => {
    logFirstSetAt("135", "15");
    fireEvent.change(weight(), { target: { value: "" } });
    fireEvent.change(weight(), { target: { value: "95" } });
    expect(weight().value).toBe("95");
  });

  it("survives deleting one digit at a time down to nothing", () => {
    logFirstSetAt("135", "15");
    ["13", "1", ""].forEach((step) => {
      fireEvent.change(weight(), { target: { value: step } });
      expect(weight().value, `clearing through "${step}"`).toBe(step);
    });
  });

  it("logs the emptied field as empty, not as the carried value", () => {
    logFirstSetAt("135", "15");
    fireEvent.change(weight(), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 2/i }));

    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!);
    expect(stored[0].exercises[0].sets[1]).toMatchObject({ weight: "", reps: "15", completed: true });
  });

  it("still logs the carry when the athlete never touches the field", () => {
    logFirstSetAt("135", "15");
    fireEvent.click(screen.getByRole("button", { name: /log set 2/i }));

    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!);
    expect(stored[0].exercises[0].sets[1]).toMatchObject({ weight: "135", reps: "15", completed: true });
  });

  it("does not leave the next set stuck on the cleared state", () => {
    // The touched marker is per field per set, so set 3 starts untouched and
    // takes the carry from set 2 rather than inheriting set 2's edited state.
    logFirstSetAt("135", "15");
    fireEvent.change(weight(), { target: { value: "" } });
    fireEvent.change(weight(), { target: { value: "95" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 2/i }));
    expect(weight().value).toBe("95");
  });

  it("carries an emptied weight forward, because that is what was confirmed", () => {
    // Logging set 2 with no weight means the set was done unloaded, so set 3
    // offers no weight. The carry follows the last confirmed set, not the last
    // non-empty number someone typed.
    logFirstSetAt("135", "15");
    fireEvent.change(weight(), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 2/i }));
    expect(weight().value).toBe("");
    expect((entry().getByLabelText(/reps/i) as HTMLInputElement).value).toBe("15");
  });
});

describe("half-typed numeric entry", () => {
  const entry = () => within(document.querySelector(".live-set-entry") as HTMLElement);
  const weight = () => entry().getByLabelText(/weight/i) as HTMLInputElement;

  // A controlled type="number" reports value="" for anything not yet a valid
  // number, so "2." — on the way to 2.5 — came back empty and the next render
  // wiped the keystroke. These are text inputs with a decimal keypad instead.
  it("keeps a trailing decimal point while the number is still being typed", () => {
    startWorkout();
    fireEvent.change(weight(), { target: { value: "2" } });
    fireEvent.change(weight(), { target: { value: "2." } });
    expect(weight().value).toBe("2.");
    fireEvent.change(weight(), { target: { value: "2.5" } });
    expect(weight().value).toBe("2.5");
  });

  it("filters anything that is not a number out of the field", () => {
    startWorkout();
    fireEvent.change(weight(), { target: { value: "abc12x.3.9def" } });
    expect(weight().value).toBe("12.39");
  });

  it("keeps reps whole", () => {
    startWorkout();
    fireEvent.change(entry().getByLabelText(/reps/i), { target: { value: "1o.5" } });
    expect((entry().getByLabelText(/reps/i) as HTMLInputElement).value).toBe("15");
  });

  it("uses a decimal keypad without the number spinner", () => {
    startWorkout();
    expect(weight().getAttribute("type")).toBe("text");
    expect(weight().getAttribute("inputMode")).toBe("decimal");
  });
});

describe("skipping an exercise from the live card", () => {
  it("moves to the next exercise and records nothing for the one passed", () => {
    startWorkout();
    const card = () => document.querySelector(".live-set-card")!;
    expect(card().textContent).toContain(exercises[0].name);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(`skip ${exercises[0].name}`, "i") }));
    expect(card().textContent).toContain(exercises[1].name);
    expect(card().textContent).toContain("Set 1 of 2");
    expectTally(0, 5);
  });

  it("keeps the skip action subordinate to logging the set", () => {
    startWorkout();
    // One dominant action stays one dominant action.
    expect(document.querySelectorAll(".live-set-commit")).toHaveLength(1);
    const skip = document.querySelector(".live-set-skip")!;
    expect(document.querySelector(".live-set-entry")!.contains(skip)).toBe(false);
  });

  it("shows the skip in the full session and puts it back on request", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`skip ${exercises[0].name}`, "i") }));
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);

    const skippedRow = document.querySelector(".session-exercise-skipped")!;
    expect(skippedRow.textContent).toContain("Skipped · nothing recorded");

    fireEvent.click(within(skippedRow as HTMLElement).getByRole("button", { name: /put back/i }));
    expect(document.querySelector(".live-set-card")!.textContent).toContain(exercises[0].name);
  });

  it("leaves a logged set logged when the rest of the exercise is skipped", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`skip ${exercises[0].name}`, "i") }));
    expectTally(1, 5);
  });
});

describe("what the entry boxes record", () => {
  const boxJump = exercises.find((exercise) => exercise.name === "Box Jump")!;
  const weightedBoxJump = exercises.find((exercise) => exercise.name === "Weighted Box Jump")!;

  function startWith(list: typeof exercises) {
    render(createElement(DeviceWorkoutTracker, {
      workout: list, prescriptions: Object.fromEntries(list.map((e) => [e.id, "3 × 5"])), settings: {}, dayLabel: "Week 1 · Power",
    }));
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
  }
  const labels = () => [...document.querySelectorAll(".live-set-entry label > span")].map((el) => el.textContent);

  it("asks a plain box jump for height and reps, never weight", () => {
    startWith([boxJump]);
    expect(labels()).toEqual(["Box height", "Reps"]);
    expect(document.querySelector(".live-set-entry")!.textContent).not.toContain("Weight");
  });

  it("asks a weighted box jump for weight, height and reps", () => {
    startWith([weightedBoxJump]);
    expect(labels()).toEqual(["Added weight", "Box height", "Reps"]);
  });

  it("records the height it asked for", () => {
    startWith([boxJump]);
    const entry = within(document.querySelector(".live-set-entry") as HTMLElement);
    fireEvent.change(entry.getByLabelText(/box height/i), { target: { value: "30" } });
    fireEvent.change(entry.getByLabelText(/reps/i), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));

    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!);
    expect(stored[0].exercises[0].sets[0]).toMatchObject({ height: "30", reps: "5", weight: "", completed: true });
  });
});

describe("active workout continuity contract", () => {
  // "Every consequential athlete action ... must checkpoint on-device before
  // the UI treats it as safely saved."
  it("says so when the device refuses the checkpoint, instead of claiming it saved", () => {
    startWorkout();
    expect(screen.queryByRole("alert")).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));

    expect(screen.getByRole("alert").textContent).toMatch(/would not store/i);
    // The typed work is still on screen — a failed write must not also lose it.
    expect(document.querySelector(".live-set-card")!.textContent).toContain("Set 2 of 3");
  });

  // "On interruption or reconnect, restore last confirmed execution position...
  // the resume cue says what is confirmed and what needs verification."
  it("restores the confirmed position on a fresh mount and names the unverified work", () => {
    startWorkout();
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "145" } });
    cleanup();

    act(() => { mount(); });
    expect(document.querySelector(".live-set-card")!.textContent).toContain("Set 2 of 3");
    const cue = document.querySelector(".tracker-resume-cue")!.textContent!;
    expect(cue).toContain("1 set is confirmed");
    expect(cue).toMatch(/1 set was typed but never logged/);
  });

  it("shows no resume cue for a workout started in this sitting", () => {
    startWorkout();
    expect(document.querySelector(".tracker-resume-cue")).toBeNull();
  });
});
