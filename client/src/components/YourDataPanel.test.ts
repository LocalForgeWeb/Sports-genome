// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ disable: vi.fn(), saved: [] as File[] }));
vi.mock("@/lib/trpc", () => ({ trpc: { shares: { disable: { useMutation: () => ({ mutateAsync: mocks.disable }) } } } }));
vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClient: () => null }));

const { YourDataPanel } = await import("./YourDataPanel");
const { setPlatformAdapter, resetPlatformAdapter } = await import("@/lib/platform");
const { resetDeviceRecordStoreForTests } = await import("@/lib/deviceRecordStore");
const { backupFormat } = await import("@/lib/deviceBackup");

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * iOS readiness audit, A03 and A04, in the screen itself: a backup is saved as a file, a restore
 * shows what it would change before anything is written and can be undone, unreadable data is
 * offered for recovery, and deleting asks once, says what it did, and leaves preferences alone.
 */
const HISTORY = "sports-genome-device-workout-history-v1";
const workout = (id: string) => ({ id, title: "Upper", dayLabel: "Day 1", startedAt: "2026-10-01T15:00:00.000Z", completedAt: "2026-10-01T16:00:00.000Z", status: "completed", exercises: [] });
const backupFile = (workouts: unknown[]) => new File([JSON.stringify({ format: backupFormat, version: 1, exportedAt: "2026-10-30T12:00:00.000Z", build: { commit: "abc1234", builtAt: "" }, records: { workouts } })], "sports-genome-backup-2026-10-30.json", { type: "application/json" });
const chooseFile = (file: File) => {
  const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  fireEvent.change(input);
};

beforeEach(() => {
  window.localStorage.clear();
  resetDeviceRecordStoreForTests();
  mocks.saved.length = 0;
  mocks.disable.mockReset().mockResolvedValue({ state: "disabled" });
  setPlatformAdapter({ kind: "web", saveFile: (file) => { mocks.saved.push(file); return "saved"; } });
});
afterEach(() => { cleanup(); resetPlatformAdapter(); });

describe("Your data", () => {
  it("saves a backup file of what the device holds and says what is in it", async () => {
    window.localStorage.setItem(HISTORY, JSON.stringify([workout("w1"), workout("w2")]));
    render(createElement(YourDataPanel));
    fireEvent.click(screen.getByRole("button", { name: "Save a backup" }));
    expect(mocks.saved).toHaveLength(1);
    expect(mocks.saved[0].name).toMatch(/^sports-genome-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const saved = JSON.parse(await mocks.saved[0].text());
    expect(saved.records.workouts.map((item: { id: string }) => item.id)).toEqual(["w1", "w2"]);
    expect(screen.getByRole("status").textContent).toContain("2 workouts");
  });

  it("previews a restore, imports only on request, and undoes it", async () => {
    window.localStorage.setItem(HISTORY, JSON.stringify([workout("w1")]));
    render(createElement(YourDataPanel));
    chooseFile(backupFile([workout("w1"), workout("w2"), workout("w3")]));
    await screen.findByRole("region", { name: "What this backup would change" });
    expect(document.body.textContent).toContain("Workouts: 2 to add, 1 already here");
    // Nothing is written by the preview.
    expect(JSON.parse(window.localStorage.getItem(HISTORY)!)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    expect(JSON.parse(window.localStorage.getItem(HISTORY)!)).toHaveLength(3);
    expect(document.body.textContent).toContain("Imported 2 records");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(JSON.parse(window.localStorage.getItem(HISTORY)!)).toHaveLength(1);
    expect(document.body.textContent).toContain("The import was undone.");
  });

  it("refuses a file that is not a backup, and changes nothing", async () => {
    window.localStorage.setItem(HISTORY, JSON.stringify([workout("w1")]));
    render(createElement(YourDataPanel));
    chooseFile(new File(["{\"hello\":1}"], "notes.json", { type: "application/json" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("isn't a Sports Genome backup"));
    expect(JSON.parse(window.localStorage.getItem(HISTORY)!)).toHaveLength(1);
  });

  it("offers data the device couldn't read for recovery, and lets its removal be undone", () => {
    window.localStorage.setItem(`${HISTORY}::unreadable::2026-10-01T00:00:00.000Z`, JSON.stringify({ savedAt: "2026-10-01T00:00:00.000Z", raw: "[{broken" }));
    render(createElement(YourDataPanel));
    expect(screen.getByRole("region", { name: "Data this device couldn't read" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Save the copy/ }));
    expect(mocks.saved[0].name).toBe("sports-genome-unreadable-2026-10-01.txt");
    fireEvent.click(screen.getByRole("button", { name: "Remove it" }));
    expect(Object.keys({ ...window.localStorage }).some((key) => key.includes("::unreadable"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(Object.keys({ ...window.localStorage }).some((key) => key.includes("::unreadable"))).toBe(true);
  });

  it("says what deleting removes, offers a backup first, confirms once, and reports each step", async () => {
    window.localStorage.setItem(HISTORY, JSON.stringify([workout("w1")]));
    window.localStorage.setItem("sg-shared-by-me-v1", JSON.stringify([{ token: "AaaaAaaaAaaaAaaaAaaaAa", manageSecret: "s".repeat(43) }]));
    window.localStorage.setItem("sports-genome-theme-v1", "dark");
    render(createElement(YourDataPanel));
    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    const section = screen.getByRole("region", { name: "Delete my data" });
    expect(section.textContent).toContain("Turned off: every workout link you shared from this device.");
    expect(section.textContent).toContain("Nothing of yours is stored in the cloud from this device.");
    expect(screen.getByRole("button", { name: "Save a backup first" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete everything" }));
    // The one dialog, and nothing is gone until it is confirmed.
    const dialog = await screen.findByRole("alertdialog").catch(() => screen.getByRole("dialog"));
    expect(window.localStorage.getItem(HISTORY)).not.toBeNull();
    fireEvent.click(Array.from(dialog.querySelectorAll("button")).find((button) => button.textContent?.includes("Delete everything"))!);
    await screen.findByRole("status", { name: "Deletion result" });
    expect(mocks.disable).toHaveBeenCalledWith({ token: "AaaaAaaaAaaaAaaaAaaaAa", manageSecret: "s".repeat(43) });
    expect(document.body.textContent).toContain("Your data was deleted");
    expect(document.body.textContent).toContain("1 shared link turned off.");
    expect(window.localStorage.getItem(HISTORY)).toBeNull();
    expect(window.localStorage.getItem("sports-genome-theme-v1")).toBe("dark");
    expect(screen.getByRole("button", { name: "Start fresh" })).toBeTruthy();
  });
});
