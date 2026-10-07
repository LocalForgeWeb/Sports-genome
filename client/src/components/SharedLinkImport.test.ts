// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { shareTokenFromText } from "@/lib/shareLinks";
import type { ShareSnapshot } from "@shared/workoutShare";
import { shareSnapshotText } from "@shared/workoutShareFormat";

type QueryState = { isLoading?: boolean; isError?: boolean; isFetching?: boolean; error?: { message: string } | null; data?: unknown };
const mocks = vi.hoisted(() => ({ byToken: {} as Record<string, QueryState>, inputs: [] as unknown[], refetch: vi.fn(), navigate: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { shares: { get: { useQuery: (input: { token: string }) => { mocks.inputs.push(input); return { refetch: mocks.refetch, isFetching: false, isLoading: false, isError: false, error: null, ...(mocks.byToken[input.token] ?? {}) }; } } } } }));
vi.mock("wouter/use-browser-location", () => ({ navigate: mocks.navigate }));
const { StackImportPanel } = await import("./StackImportPanel");
const { UniversalSearch } = await import("./UniversalSearch");

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const token = "AbCdEfGhIjKlMnOpQrStUv";
const newer = "ZyXwVuTsRqPoNmLkJiHgFe";
const [a, b] = exercises;
const snapshot: ShareSnapshot = { schema: 1, scope: "day", title: "Pull · Week 1", attribution: "Coach Sam", week: 1, days: [{ order: 1, label: "Pull", exercises: [
  { order: 1, catalogId: a.id, name: a.name, prescription: "4 × 3–6", rpe: "RPE 8", rest: "120 sec" },
  { order: 2, catalogId: b.id, name: b.name, prescription: "3 × 8–12" },
] }] };
const active = (extra = {}): QueryState => ({ data: { state: "active", token, snapshot, createdAt: "2026-10-04T10:00:00.000Z", version: 2, newerToken: null, ...extra } });
const link = `https://sports-genome.example/s/${token}`;
const message = `Pull · Week 1 — 2 exercises. View the workout or save a copy in Sports Genome. ${link}`;

function openImport(onAddShared = vi.fn(), onImport = vi.fn()) {
  render(createElement(StackImportPanel, { onClose: vi.fn(), onImport, onAddShared }));
  const box = screen.getByLabelText("Paste a link or routine") as HTMLTextAreaElement;
  return { box, onAddShared, onImport, paste: (text: string) => fireEvent.change(box, { target: { value: text } }) };
}

describe("finding a shared link in what was pasted", () => {
  it("reads the token from a bare link, the message it was sent in, and a workout copied as text", () => {
    expect(shareTokenFromText(link)).toBe(token);
    expect(shareTokenFromText(message)).toBe(token);
    expect(shareTokenFromText(shareSnapshotText(snapshot, link))).toBe(token);
    // Punctuation after the link in a message is not part of the token.
    expect(shareTokenFromText(`Try this (${link}).`)).toBe(token);
    expect(shareTokenFromText(`localhost:5173/s/${token}?ref=chat`)).toBe(token);
  });

  it("finds nothing in a plan, a cut-short link or another path", () => {
    expect(shareTokenFromText("Push Day\nBarbell Bench Press — 3 x 8")).toBeNull();
    expect(shareTokenFromText("https://sports-genome.example/s/AbCdEf")).toBeNull();
    expect(shareTokenFromText(`https://sports-genome.example/x/${token}`)).toBeNull();
  });
});

/** Oct 7: a link someone sent you is added to your plan from inside the app, by pasting it. */
describe("Import plan with a shared link", () => {
  beforeEach(() => { window.localStorage.clear(); mocks.byToken = {}; mocks.inputs = []; mocks.refetch.mockReset(); });
  afterEach(cleanup);

  it("turns a pasted message with a link into the shared workout, added with one tap through the save dialog", () => {
    mocks.byToken[token] = active();
    const { paste, onAddShared } = openImport();
    paste(message);
    expect(mocks.inputs).toContainEqual({ token });
    const card = screen.getByRole("region", { name: "Shared link" });
    expect(card.textContent).toContain("Pull · Week 1");
    expect(card.textContent).toContain("Workout · 2 exercises · Shared by Coach Sam");
    fireEvent.click(screen.getByRole("button", { name: "Add to my plan" }));
    expect(onAddShared).toHaveBeenCalledWith({ token, version: 2, snapshot });
  });

  it("shows only the link's workout when the paste has nothing else to read, so there is one action", () => {
    mocks.byToken[token] = active();
    const { paste } = openImport();
    paste(link);
    expect(screen.queryByText("Parsed preview")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Load/ })).toBeNull();
    expect(document.body.textContent).toContain("Add it with the shared link above.");
  });

  it("keeps the line-by-line reading of a copied workout next to its link", () => {
    mocks.byToken[token] = active();
    const { paste } = openImport();
    paste(shareSnapshotText(snapshot, link));
    expect(screen.getByRole("button", { name: "Add to my plan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Load workout/ })).toBeTruthy();
  });

  it("says where it was already saved and offers another copy", () => {
    window.localStorage.setItem("sg-saved-shares-v1", JSON.stringify({ [token]: { token, savedAt: "2026-10-04T11:00:00Z", destination: "Week 1 · Day 02 · Pull", week: 1, slotIndex: 1 } }));
    mocks.byToken[token] = active();
    const { paste } = openImport();
    paste(link);
    expect(document.body.textContent).toContain("You saved a copy to Week 1 · Day 02 · Pull.");
    expect(screen.getByRole("button", { name: "Add another copy" })).toBeTruthy();
  });

  it("follows the sender's newer version only when asked", () => {
    mocks.byToken[token] = active({ newerToken: newer });
    mocks.byToken[newer] = { data: { state: "active", token: newer, snapshot: { ...snapshot, title: "Pull · Week 2" }, createdAt: "2026-10-05T10:00:00.000Z", version: 3, newerToken: null } };
    const { paste, onAddShared } = openImport();
    paste(link);
    expect(document.body.textContent).toContain("The sender has shared a newer version.");
    fireEvent.click(screen.getByRole("button", { name: "Use the newer version" }));
    expect(screen.getByRole("region", { name: "Shared link" }).textContent).toContain("Pull · Week 2");
    fireEvent.click(screen.getByRole("button", { name: "Add to my plan" }));
    expect(onAddShared).toHaveBeenCalledWith(expect.objectContaining({ token: newer, version: 3 }));
  });

  it("says what happened when the link can't be added, and never offers Add", () => {
    const { paste } = openImport();
    mocks.byToken[token] = { data: { state: "missing" } };
    paste(link);
    expect(document.body.textContent).toContain("This link doesn't lead to a workout");
    mocks.byToken[token] = { data: { state: "disabled" } };
    paste(`${link} `);
    expect(document.body.textContent).toContain("The person who shared it turned the link off.");
    mocks.byToken[token] = { isError: true, error: { message: "Failed to fetch" } };
    paste(link);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetch).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Add to my plan" })).toBeNull();
  });

  it("does not look links up where no one can add them", () => {
    render(createElement(StackImportPanel, { onClose: vi.fn(), onImport: vi.fn() }));
    fireEvent.change(screen.getByLabelText("Paste a link or routine"), { target: { value: link } });
    expect(mocks.inputs).toEqual([]);
    expect(screen.queryByRole("region", { name: "Shared link" })).toBeNull();
  });
});

describe("the import's Paste button", () => {
  const clipboard = navigator.clipboard;
  afterEach(() => { cleanup(); Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true }); });

  it("replaces the example with what was copied, so a link is one tap", async () => {
    mocks.byToken[token] = active();
    Object.defineProperty(navigator, "clipboard", { value: { readText: vi.fn().mockResolvedValue(message) }, configurable: true });
    const { box } = openImport();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Paste" })); });
    expect(box.value).toBe(message);
    expect(screen.getByRole("button", { name: "Add to my plan" })).toBeTruthy();
  });

  it("says to paste into the box when the browser refuses, and selects it", async () => {
    Object.defineProperty(navigator, "clipboard", { value: { readText: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")) }, configurable: true });
    const { box } = openImport();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Paste" })); });
    expect(document.body.textContent).toContain("Paste into the box instead.");
    expect(document.activeElement).toBe(box);
  });
});

describe("a shared link pasted into search", () => {
  beforeEach(() => mocks.navigate.mockReset());
  afterEach(cleanup);

  it("offers the shared workout, and Enter opens it", () => {
    render(createElement(UniversalSearch, { onOpenResult: vi.fn() }));
    fireEvent.click(screen.getByRole("button", { name: "Search Sports Genome" }));
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: message } });
    expect(screen.getByRole("button", { name: /Open the shared workout/ })).toBeTruthy();
    expect(document.body.textContent).not.toContain("No match for");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.navigate).toHaveBeenCalledWith(`/s/${token}`);
  });
});
