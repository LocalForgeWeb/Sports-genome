// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import NotFound from "./NotFound";

const source = readFileSync(resolve(__dirname, "NotFound.tsx"), "utf8");

function renderAt(path: string) {
  const location = memoryLocation({ path, record: true });
  render(React.createElement(Router, { hook: location.hook }, React.createElement(NotFound)));
  return location;
}

describe("NotFound", () => {
  afterEach(() => {
    cleanup();
  });

  it("speaks in the app's voice, without an apology", () => {
    renderAt("/nope");
    expect(screen.getByRole("heading", { level: 1, name: "Nothing lives at this address." })).toBeTruthy();
    expect(screen.getByText("404 · Not found")).toBeTruthy();
    expect(screen.getByText("Every screen in Sports Genome is reachable from Home.")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/sorry/i);
    expect(document.body.textContent).not.toMatch(/Page Not Found/);
  });

  it("does not raise a pulsing alarm", () => {
    renderAt("/nope");
    expect(document.querySelector(".animate-pulse")).toBeNull();
  });

  it("takes the athlete back to Home", () => {
    const location = renderAt("/nope");
    fireEvent.click(screen.getByRole("button", { name: "Go to Home" }));
    expect(location.history.at(-1)).toBe("/");
  });

  it("uses theme tokens rather than fixed Tailwind palette colours, and follows the dark theme", () => {
    expect(source).not.toMatch(/\b(slate|blue|red)-\d{2,3}\b/);
    expect(source).toMatch(/dark:bg-\[var\(--sg-/);
    expect(source).toMatch(/bg-\[var\(--sg-action-fill\)\]/);
  });
});
