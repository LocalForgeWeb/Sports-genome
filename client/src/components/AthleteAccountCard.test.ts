import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/athleteIdentity", () => ({
  attachEmailToIdentity: vi.fn(async () => ({ ok: true })),
  upsertAthleteProfile: vi.fn(async () => true),
}));

import { AthleteAccountCard } from "./AthleteAccountCard";

/**
 * The card promised a way into the account from another device, and the expiry notice
 * sent the athlete to About me to sign in again. This build has neither: the only
 * Supabase sign-in is anonymous and the account sign-in screen is unreachable. Revert
 * these checks when a real sign-in path ships.
 */
const render = (anonymous: boolean) => renderToStaticMarkup(createElement(AthleteAccountCard, {
  identity: { userId: "u1", anonymous },
  pending: 0,
  optedIn: false,
  onOptIn: vi.fn(),
}));

describe("the account card says only what this build can do", () => {
  it("offers an email without promising another device, before an email is attached", () => {
    const markup = render(true);
    expect(markup).not.toContain("from another one");
    expect(markup).not.toContain("a way back into");
    expect(markup).toContain("not available in this build");
    expect(markup).toContain("This attaches an email to the account you already have.");
  });

  it("does not claim every device can reach the account once an email is attached", () => {
    const markup = render(false);
    expect(markup).not.toContain("reachable from any device");
    expect(markup).toContain("not available in this build");
  });

  it("does not point an expired sign-in at a sign-in control that is not there", () => {
    const main = readFileSync(new URL("../main.tsx", import.meta.url), "utf8");
    expect(main).not.toContain("Sign in again from About me");
  });
});
