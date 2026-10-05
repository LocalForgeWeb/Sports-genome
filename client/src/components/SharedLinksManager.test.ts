// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShareSnapshot } from "@shared/workoutShare";

const mocks = vi.hoisted(() => ({ mine: vi.fn(), disable: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { shares: {
  mine: { useMutation: () => ({ mutateAsync: mocks.mine }) },
  disable: { useMutation: () => ({ mutateAsync: mocks.disable }) },
  create: { useMutation: () => ({ mutateAsync: mocks.create }) },
} } }));
const { SharedLinksManager } = await import("./SharedLinksManager");

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const record = (token: string, extra = {}) => ({ token, manageSecret: "s".repeat(43), title: `Share ${token.slice(0, 4)}`, scope: "day", version: 1, createdAt: "2026-10-04T10:00:00.000Z", exerciseCount: 5, dayCount: 1, sourceKey: "w1:day:1-Pull", ...extra });
const tokenA = "AaaaAaaaAaaaAaaaAaaaAa";
const tokenB = "BbbbBbbbBbbbBbbbBbbbBb";
const owned = () => JSON.parse(window.localStorage.getItem("sg-shared-by-me-v1") ?? "[]");
const snapshot: ShareSnapshot = { schema: 1, scope: "day", title: "Pull v2", days: [{ order: 1, label: "Pull", exercises: [{ order: 1, catalogId: 1, name: "Row", prescription: "4 × 6" }] }] };

/** Oct 4 sharing brief, sender management: what each link is now, turning one off, publishing an update. */
describe("Shared by you", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("sg-shared-by-me-v1", JSON.stringify([record(tokenA), record(tokenB)]));
    mocks.mine.mockReset().mockResolvedValue([{ token: tokenA, state: "active", version: 1, newerToken: null }, { token: tokenB, state: "disabled" }]);
    mocks.disable.mockReset().mockResolvedValue({ state: "disabled" });
    mocks.create.mockReset().mockResolvedValue({ token: "CcccCcccCcccCcccCcccCc", version: 2, createdAt: "2026-10-05T10:00:00.000Z", reused: false });
  });
  afterEach(cleanup);

  it("lists this device's links with what each one is now, checked with the server", async () => {
    render(createElement(SharedLinksManager));
    await waitFor(() => expect(document.body.textContent).toContain("Active · anyone with the link can view"));
    expect(mocks.mine).toHaveBeenCalledWith({ items: [{ token: tokenA, manageSecret: "s".repeat(43) }, { token: tokenB, manageSecret: "s".repeat(43) }] });
    expect(document.body.textContent).toContain("Turned off · the link shows it's no longer available");
    expect(document.body.textContent).toContain("Only this device can turn them off or publish an update.");
  });

  it("still lists them, marked unchecked, when the server can't be reached", async () => {
    mocks.mine.mockRejectedValueOnce(new Error("offline"));
    render(createElement(SharedLinksManager));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Couldn't check these links right now."));
    expect(document.body.textContent).toContain("Share Aaaa");
  });

  it("turns a link off only after confirming, and says what recipients will see", async () => {
    render(createElement(SharedLinksManager));
    await waitFor(() => expect(screen.getByRole("button", { name: "Turn off link" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Turn off link" }));
    expect(mocks.disable).not.toHaveBeenCalled();
    const confirm = screen.getByRole("group", { name: "Turn off Share Aaaa" });
    expect(confirm.textContent).toContain("Copies they already saved stay in their plans.");
    fireEvent.click(screen.getByRole("button", { name: "Keep it on" }));
    expect(screen.queryByRole("group", { name: "Turn off Share Aaaa" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Turn off link" }));
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: "Turn off link" }).at(-1)!); });
    expect(mocks.disable).toHaveBeenCalledWith({ token: tokenA, manageSecret: "s".repeat(43) });
    expect(owned()[0].disabledAt).toBeTruthy();
    expect(document.body.textContent).toContain("Share Aaaa is turned off.");
  });

  it("publishes an update of the open day as a new version the old link points to", async () => {
    render(createElement(SharedLinksManager, { current: { key: "w1:day:1-Pull", snapshot } }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Publish updated version" })).toBeTruthy());
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Publish updated version" })); });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ snapshot, manageSecret: "s".repeat(43), supersedes: { token: tokenA, manageSecret: "s".repeat(43) } }));
    expect(owned()[0]).toMatchObject({ token: "CcccCcccCcccCcccCcccCc", version: 2, title: "Pull v2", sourceKey: "w1:day:1-Pull" });
    expect(document.body.textContent).toContain("Version 2 published at a new link.");
    expect(document.body.textContent).toContain("Active · a newer version replaces it");
  });

  it("offers no update for a link made from a different day", async () => {
    render(createElement(SharedLinksManager, { current: { key: "w1:day:0-Push", snapshot } }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Turn off link" })).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Publish updated version" })).toBeNull();
  });

  it("lets a link that's off be removed from the list", async () => {
    render(createElement(SharedLinksManager));
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove from list" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Remove from list" }));
    expect(owned().map((item: { token: string }) => item.token)).toEqual([tokenA]);
  });

  it("says so when nothing has been shared from this device", () => {
    window.localStorage.clear();
    render(createElement(SharedLinksManager));
    expect(document.body.textContent).toContain("You haven't shared a link from this device yet.");
    expect(mocks.mine).not.toHaveBeenCalled();
  });
});
