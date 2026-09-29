import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sep 28 regression brief §7. About me asked for the account's passkeys on every open, with no
 * account session on the device store; the refusal raised "Your sign-in has expired" on the
 * screen that notice pointed to. Enrolling a passkey sent a second refused call.
 */
const asked = vi.hoisted(() => ({ passkeys: undefined as { enabled?: boolean } | undefined }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      passkeyRegistrationOptions: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeyRegistrationVerify: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      passkeys: { useQuery: (_input: unknown, options?: { enabled?: boolean }) => { asked.passkeys = options; return { data: undefined, refetch: vi.fn() }; } },
      removePasskey: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import { AthleteAboutMePanel } from "./AthleteAboutMePanel";
import { ThemeProvider } from "@/contexts/ThemeContext";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const render = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(ThemeProvider, null, createElement(AthleteAboutMePanel, {
  baseline: { experience: "Intermediate", weightUnit: "lb", equipment: { gymAccess: "Commercial gym", availableEquipment: ["Bodyweight"] } },
  goal: "Athleticism", trainingDays: 3, sportId: "", sports: [],
  onBaseline: vi.fn(), onGoal: vi.fn(), onDays: vi.fn(), onSport: vi.fn(),
  ...props,
} as never)));

describe("About me without an account session", () => {
  beforeEach(() => { asked.passkeys = undefined; });

  it("does not ask for passkeys or offer to enroll one", () => {
    const markup = render({});
    expect(asked.passkeys?.enabled).toBe(false);
    // The group says so in one static line rather than offering a control that cannot work.
    expect(markup).toContain("Face ID and passkey sign-in is not available in this build yet.");
    expect(markup).not.toContain("Enable Face ID / passkey");
  });

  it("does both with one", () => {
    render({ accountSignedIn: true });
    expect(asked.passkeys?.enabled).toBe(true);
  });

  it("says a lapse in Account & sync for as long as it lasts", () => {
    const quiet = render({ accountSignedIn: true });
    expect(quiet).not.toContain("Signed out of your account");
    const lapsed = render({ accountSignedIn: true, sessionLapsed: true });
    expect(lapsed).toContain("Signed out of your account");
    expect(lapsed).toContain("Changes you make are kept on this device");
  });

  it("returns before the enroll call without a session", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AthleteAboutMePanel.tsx"), "utf8");
    const enroll = source.slice(source.indexOf("const enrollPasskey = async () => {"), source.indexOf("passkeyOptions.mutateAsync()"));
    expect(enroll).toContain("if (!accountSignedIn) return;");
  });
});

describe("the rest of the device store's account-only paths", () => {
  const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
  const strength = readFileSync(resolve(process.cwd(), "client/src/components/StrengthGenomePanel.tsx"), "utf8");

  it("keeps a favourite on this device and sends it on only with a session", () => {
    const toggle = home.slice(home.indexOf("const toggleFavorite = (exercise: Exercise) => {"), home.indexOf("const importRoutine"));
    expect(toggle.indexOf("setLocalFavoriteIds(")).toBeLessThan(toggle.indexOf("if (!isAuthenticated) {"));
    expect(toggle.indexOf("if (!isAuthenticated) {")).toBeLessThan(toggle.indexOf("favoriteMutation.mutate("));
    expect(toggle).not.toContain("will sync when account storage is available");
  });

  it("does not offer Set focus on the device store, where a focus cannot be kept", () => {
    const row = strength.slice(strength.indexOf('className="strength-region-focus-row">'));
    expect(row).toContain("{!directAccess && <button type=\"button\" disabled={setPriority.isPending}");
    expect(strength).toContain('<div ref={feedbackSurfaceRef} className="strength-region-focus-row">');
  });
});
