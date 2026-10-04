// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import type { ShareSnapshot } from "@shared/workoutShare";

type QueryState = { isLoading?: boolean; isError?: boolean; isFetching?: boolean; error?: { message: string } | null; data?: unknown; refetch?: () => void };
const mocks = vi.hoisted(() => ({ query: {} as QueryState, navigate: vi.fn(), lastInput: null as unknown, lastOptions: null as unknown }));
vi.mock("@/components/ExerciseMedia", () => ({ ExerciseMedia: () => null }));
vi.mock("wouter", () => ({ useLocation: () => ["/s/x", mocks.navigate] }));
vi.mock("@/lib/trpc", () => ({ trpc: { shares: { get: { useQuery: (input: unknown, options: unknown) => { mocks.lastInput = input; mocks.lastOptions = options; return { refetch: vi.fn(), isFetching: false, error: null, ...mocks.query }; } } } } }));
const { default: SharedWorkoutPage } = await import("./SharedWorkoutPage");

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const [a, b] = exercises;
const token = "AbCdEfGhIjKlMnOpQrStUv";
const snapshot: ShareSnapshot = { schema: 1, scope: "day", title: "Pull · Week 1", attribution: "Coach Sam", description: "Short rests.", week: 1, days: [{ order: 1, label: "Pull", exercises: [
  { order: 1, catalogId: a.id, name: a.name, prescription: "4 × 3–6", rpe: "RPE 8", rest: "120 sec" },
  { order: 2, catalogId: b.id, name: b.name, prescription: "3 × 8–12", prescriptionIsDefault: true },
] }] };
const active = (extra = {}) => ({ data: { state: "active", token, snapshot, createdAt: "2026-10-04T10:00:00.000Z", version: 1, newerToken: null, ...extra } });
const open = (id = token) => render(createElement(SharedWorkoutPage, { params: { token: id } }));

/** Oct 4 sharing brief, recipient page: readable without an account; one clear Save; every failure says what to do. */
describe("A shared workout's page", () => {
  beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); mocks.navigate.mockReset(); mocks.query = {}; });
  afterEach(cleanup);

  it("shows the workout first: its name, who shared it, and every exercise in order with its prescription", () => {
    mocks.query = active();
    open();
    expect(screen.getByRole("heading", { level: 1, name: "Pull · Week 1" })).toBeTruthy();
    const page = document.body.textContent ?? "";
    expect(page).toContain("Shared by Coach Sam");
    expect(page).toContain("Short rests.");
    expect(page.indexOf(a.name)).toBeLessThan(page.indexOf(b.name));
    expect(page).toContain("4 × 3–6 · RPE 8 · Rest 120 sec");
    expect(page).toContain("· plan default");
    expect(document.title).toBe("Pull · Week 1 · Shared workout · Sports Genome");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
  });

  it("hands the workout to the app on Save a copy, which asks where it goes before anything changes", () => {
    mocks.query = active();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Save a copy to my plan" }));
    const pending = JSON.parse(window.sessionStorage.getItem("sg-pending-shared-save-v1") ?? "null");
    expect(pending).toMatchObject({ token, version: 1, snapshot: { title: "Pull · Week 1" } });
    expect(mocks.navigate).toHaveBeenCalledWith("/");
    expect(document.body.textContent).toContain("nothing in your plan is replaced unless you choose that");
  });

  it("says where it was already saved, and offers another copy rather than quietly making one", () => {
    window.localStorage.setItem("sg-saved-shares-v1", JSON.stringify({ [token]: { token, savedAt: "2026-10-04T11:00:00Z", destination: "Week 1 · Day 02 · Pull", week: 1, slotIndex: 1 } }));
    mocks.query = active();
    open();
    expect(document.body.textContent).toContain("You saved a copy to Week 1 · Day 02 · Pull.");
    expect(screen.getByRole("button", { name: "Save another copy" })).toBeTruthy();
  });

  it("copies the workout as text that pastes back into a plan", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    mocks.query = active();
    open();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy as text" })); });
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain(`1. ${a.name} — 4 × 3–6 · RPE 8 · Rest 120 sec`);
    expect(text).toContain(`Open it or save a copy: ${window.location.origin}/s/${token}`);
    expect(screen.getByRole("button", { name: "Copied as text" })).toBeTruthy();
  });

  it("points to a newer version when the sender published one", () => {
    mocks.query = active({ newerToken: "NewerTokenNewerTokenNe" });
    open();
    fireEvent.click(screen.getByRole("link", { name: "View the newer version" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/s/NewerTokenNewerTokenNe");
  });

  it("prints", () => {
    mocks.query = active();
    const print = vi.fn();
    window.print = print;
    open();
    fireEvent.click(screen.getByRole("button", { name: "Print or save PDF" }));
    expect(print).toHaveBeenCalled();
  });

  it("is a skeleton while loading, not a blank page", () => {
    mocks.query = { isLoading: true };
    open();
    expect(document.querySelector('[aria-busy="true"] .sp-skeleton')).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Loading the shared workout…");
  });

  it("says a turned-off link is no longer available, and that saved copies are unaffected", () => {
    mocks.query = { data: { state: "disabled" } };
    open();
    expect(screen.getByRole("heading", { level: 1, name: "This shared workout is no longer available" })).toBeTruthy();
    expect(document.body.textContent).toContain("Copies that were already saved to plans aren't affected.");
    expect(document.body.textContent).not.toContain("Pull · Week 1");
  });

  it("says a link that leads nowhere is mistyped or partial, without asking the server about an impossible token", () => {
    open("not-a-token");
    expect((mocks.lastOptions as { enabled: boolean }).enabled).toBe(false);
    expect(screen.getByRole("heading", { level: 1, name: "This link doesn't lead to a workout" })).toBeTruthy();
    cleanup();
    mocks.query = { data: { state: "missing" } };
    open();
    expect(screen.getByRole("heading", { level: 1, name: "This link doesn't lead to a workout" })).toBeTruthy();
  });

  it("offers Try again when the workout couldn't load", () => {
    const refetch = vi.fn();
    mocks.query = { isError: true, error: { message: "Failed to fetch" }, refetch };
    open();
    expect(screen.getByRole("heading", { level: 1, name: "This workout couldn't load" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("won't show a payload that doesn't pass the schema", () => {
    mocks.query = { data: { state: "active", token, snapshot: { ...snapshot, schema: 99 }, createdAt: "", version: 1, newerToken: null } };
    open();
    expect(screen.getByRole("heading", { level: 1, name: "This shared workout can't be shown" })).toBeTruthy();
  });
});
