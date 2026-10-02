// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * The screen an athlete sees when anything in the app throws while rendering. It said
 * "An unexpected error occurred." over the minified production stack, told them nothing
 * about their record, and was not announced to assistive technology.
 */
const thrown = new Error("boom");
function Broken(): never {
  throw thrown;
}

const mount = () => render(createElement(ErrorBoundary, null, createElement(Broken)));

beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("the app-wide crash screen", () => {
  it("is announced, and says what happened in plain words", () => {
    mount();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Sports Genome hit a problem");
    expect(alert.textContent).toContain("Nothing you have saved was changed");
  });

  it("offers a reload and keeps the error message behind a technical detail", () => {
    mount();
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(screen.getByText("Technical detail").tagName).toBe("SUMMARY");
    expect(screen.getByText("boom")).toBeTruthy();
  });

  it("leaves the stack out of a production build", () => {
    vi.stubEnv("DEV", false);
    mount();
    const frame = thrown.stack!.split("\n").find((line) => line.trim().startsWith("at "))!;
    expect(frame).toBeTruthy();
    expect(document.body.textContent).not.toContain(frame.trim());
  });

  it("shows the stack while developing", () => {
    vi.stubEnv("DEV", true);
    mount();
    const frame = thrown.stack!.split("\n").find((line) => line.trim().startsWith("at "))!;
    expect(document.body.textContent).toContain(frame.trim());
  });
});
