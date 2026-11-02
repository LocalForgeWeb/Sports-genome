// @vitest-environment jsdom
import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { diagnosticsText, ownerToSupply, PrivacyPage, SupportPage } from "./InfoPages";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * iOS readiness audit, A04: Privacy and Support have their own addresses, open without the
 * workspace or a sign-in, say only what the app does, and mark what the owner must supply.
 */
afterEach(cleanup);

describe("Privacy and Support", () => {
  it("are routes of their own, outside the workspace, with no intro in front of them", () => {
    const app = readFileSync(join(process.cwd(), "client/src/App.tsx"), "utf8");
    expect(app).toContain('<Route path={"/privacy"}>');
    expect(app).toContain('<Route path={"/support"}>');
    const html = readFileSync(join(process.cwd(), "client/index.html"), "utf8");
    expect(html).toContain("/^\\/(s\\/|privacy$|support$)/.test(location.pathname)");
    // Reachable from About me and from the sign-in screen.
    expect(readFileSync(join(process.cwd(), "client/src/components/AthleteAboutMePanel.tsx"), "utf8")).toContain('<a href="/privacy">Privacy</a><a href="/support">Support</a>');
    expect(readFileSync(join(process.cwd(), "client/src/components/EmailAuthScreen.tsx"), "utf8")).toContain('<a href="/privacy">Privacy</a><a href="/support">Support</a>');
  });

  it("says it is a draft and shows what the owner has not supplied, instead of inventing it", () => {
    render(createElement(PrivacyPage));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Privacy");
    expect(screen.getByRole("note").textContent).toContain("Draft for the owner's review");
    for (const missing of Object.values(ownerToSupply)) expect(document.body.textContent).toContain(missing);
    expect(document.body.textContent).toContain("no analytics or tracking scripts");
    expect(document.body.textContent).toContain("Delete my data");
  });

  it("offers diagnostics that carry the build and device shape, never workouts or identities", () => {
    window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify([{ id: "w1", title: "Secret Upper", status: "completed", startedAt: "2026-10-01", exercises: [] }]));
    window.localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ baseline: { preferredName: "Gabe" } }));
    const text = diagnosticsText(new Date("2026-11-02T12:00:00.000Z"));
    expect(text).toContain("Workouts saved on this device: 1");
    expect(text).not.toContain("Secret Upper");
    expect(text).not.toContain("Gabe");
    render(createElement(SupportPage));
    expect(screen.getByRole("button", { name: "Copy details" })).toBeTruthy();
    expect(document.body.textContent).toContain(ownerToSupply.contact);
  });
});
