// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildWorkoutExport } from "@/lib/workoutExport";
import { buildShareSnapshot, type ShareSource } from "@/lib/shareSnapshot";
import { shareSnapshotText } from "@shared/workoutShareFormat";
import { parseShareSnapshot, type ShareSnapshot } from "@shared/workoutShare";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/pdfBrandLogo", () => ({ loadPdfLogo: async () => null }));
vi.mock("@/components/ExerciseMedia", () => ({ ExerciseMedia: () => null }));
vi.mock("@/lib/trpc", () => ({
  trpc: { shares: {
    create: { useMutation: () => ({ mutateAsync: mocks.create }) },
    mine: { useMutation: () => ({ mutateAsync: async () => [] }) },
    disable: { useMutation: () => ({ mutateAsync: async () => ({ state: "disabled" }) }) },
  } },
}));
const { WorkoutShareSheet } = await import("./WorkoutShareSheet");

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const pulls = exercises.filter((exercise) => /pull/i.test(exercise.movement)).slice(0, 5);
const pushes = exercises.filter((exercise) => /push/i.test(exercise.movement)).slice(0, 4);
const plan = buildWorkoutExport({
  workout: pulls, week: 1, dayOrdinal: "Day 02", dayName: "Pull", sport: "Wrestling", goal: "Athleticism",
  prescriptionFor: () => "4 × 3–6", settingsFor: () => ({ rpe: "RPE 7", rest: "90 sec", notes: "" }), muscleLabel: (key) => key, now: new Date("2026-10-02T15:00:00Z"),
});
const source: ShareSource = {
  week: 1, sport: "Wrestling", goal: "Athleticism", activeIndex: 1,
  days: [
    { key: "0-Push", index: 0, ordinal: "Day 01", label: "Push", exercises: pushes.map((exercise) => ({ exercise, prescription: "3 × 8–12", prescriptionIsDefault: false, rpe: "RPE 8", rest: "120 sec" })) },
    { key: "1-Pull", index: 1, ordinal: "Day 02", label: "Pull", exercises: pulls.map((exercise, index) => ({ exercise, prescription: "4 × 3–6", prescriptionIsDefault: index === 4, rpe: "RPE 7", rest: "90 sec", notes: index === 0 ? "Pause at the top" : undefined })) },
    { key: "2-Legs", index: 2, ordinal: "Day 03", label: "Legs", exercises: [] },
  ],
};
type Nav = Navigator & { share?: unknown; canShare?: unknown };
const nav = navigator as Nav;
const token = "AbCdEfGhIjKlMnOpQrStUv";
const sent = (call = 0) => mocks.create.mock.calls[call][0] as { requestKey: string; manageSecret: string; snapshot: ShareSnapshot };

/**
 * Oct 4 sharing brief: say what is shared, show it as it will be seen, and make the link
 * only when asked - once, however many taps - then hand it over by the system sheet or Copy.
 */
describe("Share composer", () => {
  let share: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    window.localStorage.clear();
    mocks.create.mockReset();
    mocks.create.mockImplementation(async () => ({ token, version: 1, createdAt: "2026-10-04T12:00:00.000Z", reused: false }));
    share = vi.fn(async () => undefined);
    nav.share = share;
    nav.canShare = (data: ShareData) => Boolean(data.files?.length);
  });
  afterEach(() => { cleanup(); delete nav.share; delete nav.canShare; });

  const open = (with_: ShareSource | null = source) => {
    const onClose = vi.fn();
    render(createElement(WorkoutShareSheet, { plan, source: with_, weightUnit: "lb", onClose }));
    return onClose;
  };
  const createLink = async () => { await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Create link|Try again/ })); }); };

  it("says what is shared and previews it as recipients will see it, before any link exists", () => {
    open();
    const dialog = screen.getByRole("dialog", { name: "Share" });
    expect((screen.getByRole("radio", { name: /This workout/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value).toBe("Pull · Week 1");
    expect(dialog.textContent).toContain("Day 02 · Pull · 5 exercises");
    // The compact preview: three rows, then how many more.
    expect(dialog.textContent).toContain("+ 2 more in this day");
    expect(dialog.textContent).toContain("Never your logged sets, history, body measures or profile.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("leaves notes out unless the sender includes them, and shows which ones first", async () => {
    open();
    await createLink();
    expect(sent().snapshot.days[0].exercises[0].notes).toBeUndefined();
    cleanup(); mocks.create.mockClear();
    open();
    fireEvent.click(screen.getByRole("checkbox", { name: /Include exercise notes \(1\)/ }));
    expect(screen.getByRole("dialog").textContent).toContain("Pause at the top");
    await createLink();
    expect(sent().snapshot.days[0].exercises[0].notes).toBe("Pause at the top");
  });

  it("shares the week as its planned days in order, under the week's title", async () => {
    open();
    fireEvent.click(screen.getByRole("radio", { name: /Week 1/ }));
    expect((screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value).toBe("Week 1 · Push, Pull");
    await createLink();
    const { snapshot } = sent();
    expect(snapshot.scope).toBe("week");
    expect(snapshot.days.map((day) => day.label)).toEqual(["Push", "Pull"]);
    expect(snapshot.days[1].exercises[4].prescriptionIsDefault).toBe(true);
    expect(parseShareSnapshot(snapshot).ok).toBe(true);
  });

  it("makes one link however many times Create is tapped, and keeps it on this device to manage", async () => {
    let finish: (value: unknown) => void = () => undefined;
    mocks.create.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    open();
    const button = screen.getByRole("button", { name: /Create link/ });
    await act(async () => { fireEvent.click(button); fireEvent.click(button); });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ token, version: 1, createdAt: "2026-10-04T12:00:00.000Z", reused: false }); });
    expect((screen.getByRole("textbox", { name: "Share link" }) as HTMLInputElement).value).toBe(`${window.location.origin}/s/${token}`);
    const owned = JSON.parse(window.localStorage.getItem("sg-shared-by-me-v1") ?? "[]");
    expect(owned[0]).toMatchObject({ token, manageSecret: sent().manageSecret, title: "Pull · Week 1", scope: "day", sourceKey: "w1:day:1-Pull" });
  });

  it("keeps what was entered when creating fails, and retries the same request so a retry cannot make a second link", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Failed to fetch"));
    open();
    fireEvent.change(screen.getByRole("textbox", { name: /Note for the people/ }), { target: { value: "Short rests." } });
    await createLink();
    expect(screen.getByRole("alert").textContent).toContain("what you entered is kept");
    expect((screen.getByRole("textbox", { name: /Note for the people/ }) as HTMLTextAreaElement).value).toBe("Short rests.");
    await createLink();
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(sent(1).requestKey).toBe(sent(0).requestKey);
    expect(sent(1).snapshot.description).toBe("Short rests.");
  });

  it("treats a change after a failure as a new request", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Failed to fetch"));
    open();
    await createLink();
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Pull day" } });
    await createLink();
    expect(sent(1).requestKey).not.toBe(sent(0).requestKey);
  });

  it("says plainly when sharing by link is unavailable, and points to the other ways", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Sharing by link isn't available right now."));
    open();
    await createLink();
    expect(screen.getByRole("alert").textContent).toContain("You can still copy the workout as text below, or save the PDF.");
  });

  it("hands the system share sheet the link and a short line, never the workout written out", async () => {
    open();
    await createLink();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Share link" })); });
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0][0] as ShareData;
    expect(data.url).toBe(`${window.location.origin}/s/${token}`);
    expect(data.text).toBe("Pull · Week 1 — 5 exercises. View the workout or save a copy in Sports Genome.");
    for (const exercise of pulls) expect(data.text).not.toContain(exercise.name);
    expect(screen.getByRole("status").textContent).toBe("Passed to the app you chose.");
  });

  it("treats a dismissed share sheet as a choice: nothing is reported", async () => {
    share.mockRejectedValueOnce(new DOMException("Share canceled", "AbortError"));
    const onClose = open();
    await createLink();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Share link" })); });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Link ready.");
  });

  it("says Link copied only when the copy happened, and otherwise selects the link to copy by hand", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    open();
    await createLink();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy link" })); });
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/s/${token}`);
    expect(screen.getByRole("button", { name: "Link copied" })).toBeTruthy();
    cleanup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn(async () => { throw new Error("denied"); }) }, configurable: true });
    document.execCommand = vi.fn(() => false);
    open();
    await createLink();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy link" })); });
    expect(screen.queryByRole("button", { name: "Link copied" })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("copy it from there");
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Share link" }));
  });

  it("copies the workout as text that names every exercise with its whole prescription", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    open();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Copy as text/ })); });
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain("Shared from Sports Genome · 5 exercises");
    expect(text).toContain(`1. ${pulls[0].name} — 4 × 3–6 · RPE 7 · Rest 90 sec`);
    expect(text).toBe(shareSnapshotText(buildShareSnapshot(source, { scope: "day", title: "Pull · Week 1", description: "", attribution: "", includeNotes: false })!));
    expect(screen.getByRole("status").textContent).toContain("Paste it into Sports Genome's Import plan");
  });

  it("says a day with nothing planned has nothing to share", () => {
    open({ ...source, activeIndex: 2, days: source.days.map((day) => ({ ...day, exercises: [] })) });
    expect(screen.getByRole("dialog").textContent).toContain("Legs has no exercises yet.");
    expect(screen.queryByRole("button", { name: /Create link/ })).toBeNull();
  });

  it("keeps Tab inside, closes on Escape, and lives in the modal layer on an opaque dark surface", () => {
    const onClose = open();
    const dialog = screen.getByRole("dialog", { name: "Share" });
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog.className).toContain("sg-surface-dark");
    dialog.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(dialog);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
