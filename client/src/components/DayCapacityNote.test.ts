import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DayCapacityNote } from "./DayCapacityNote";
import type { ResilienceTargetCatalog } from "@shared/resilienceContext";
import type { CapacityFocusState } from "./CapacityFocusCard";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

const catalog: ResilienceTargetCatalog = {
  status: "connected",
  boundary: "These are selectable training targets, not diagnoses.",
  targets: [{
    targetId: "26cd0dfa-6859-4532-8a66-9eaa10902a00",
    targetKey: "shoulder",
    name: "Shoulder",
    region: "shoulder",
    targetType: "body_region",
    lateralitySupported: true,
    supportedRoutes: ["sport_specific"],
  }],
};

const offline: ResilienceTargetCatalog = { status: "unavailable", targets: [], boundary: "The target catalog is unavailable." };

const render = (capacity: CapacityFocusState, targetCatalog: ResilienceTargetCatalog | undefined = catalog) =>
  renderToStaticMarkup(createElement(DayCapacityNote, { capacity, catalog: targetCatalog, onOpenProfile: () => undefined }));

const focusOn = (constraintType: CapacityFocusState["constraint"] extends undefined ? never : NonNullable<CapacityFocusState["constraint"]>["constraintType"], reportedSignals: CapacityFocusState["reportedSignals"] = []): CapacityFocusState => ({
  focus: { targetKey: "shoulder", intent: "build_capacity", laterality: "right" },
  constraint: { targetKey: "shoulder", constraintType, laterality: "right" },
  reportedSignals,
});

/**
 * The reported defect was that this feature never shows up. It had two halves.
 *
 * The first is in this repository: `capacityFocus` was written to local storage by
 * onboarding and by the profile card, and read by nothing at all - an athlete who
 * named a shoulder never saw it mentioned again on any training screen.
 *
 * The second was a deployment setting: the catalog was read only behind
 * `SUPABASE_SERVICE_ROLE_KEY`, which is unset on the production project, so it
 * answered "unavailable" and every surface collapsed to a boundary sentence. The
 * athlete's own session can read the same view under its row-level security, and
 * now does when the server route cannot — but onboarding still runs before there
 * is a session, and the catalog can still be genuinely offline. The last case
 * here is what the athlete sees when that happens.
 */
describe("what you told us you are working on reaches the day you build", () => {
  it("is read on the Training Day, not only written by the profile", () => {
    expect(home).toContain("<DayCapacityNote capacity={capacityFocus}");
    expect(home).toContain("catalog={resilienceCatalog}");
    // Inside the day being built, above the panels that read it.
    const day = home.indexOf('{workspace === "day-plan"');
    expect(home.indexOf("<DayCapacityNote", day)).toBeLessThan(home.indexOf("<DayExercisePicker", day));
  });

  it("names the declared target and the side, from the catalog's own wording", () => {
    const markup = render(focusOn("recent_or_returning"));
    expect(markup).toContain("Shoulder");
    expect(markup).toContain("right side");
  });

  it("echoes what the athlete reported rather than restating it as a finding", () => {
    expect(render(focusOn("symptomatic"))).toContain("You said it bothers you at the moment");
    expect(render(focusOn("prior_recurrent"))).toContain("You said it has been a recurring issue");
  });

  it("says plainly that a reported constraint does not silently change the day", () => {
    const markup = render(focusOn("recent_or_returning"));
    expect(markup).toContain("day-capacity-note-qualified");
    expect(markup).toContain("not adjusted for it automatically");
  });

  /**
   * A reported red flag stops automated progression. The panel must not soften
   * that into a suggestion, and must not name a condition while it does it.
   */
  it("withholds on a reported high-consequence signal, without diagnosing anything", () => {
    const markup = render(focusOn("symptomatic", ["neurological_or_systemic"]));
    expect(markup).toContain("day-capacity-note-withhold");
    expect(markup).toContain("will not progress loading on that area by itself");
    expect(markup).toContain("nothing here is telling you what the problem is");
  });

  it("stays out of the way when nothing is going on there", () => {
    const markup = render(focusOn("proactive_none"));
    expect(markup).toContain("day-capacity-note-ordinary");
    expect(markup).toContain("planned the ordinary way");
    expect(markup).not.toContain("day-capacity-note-withhold");
  });

  /**
   * A feature nobody can find is the same as a feature that is not there, and the
   * day screen is where the thought "my shoulder" actually occurs.
   */
  it("offers the setting to an athlete who has never set one", () => {
    const markup = render({ reportedSignals: [] });
    expect(markup).toContain("Name it in your profile");
    expect(markup).toContain("day-capacity-note-empty");
  });

  it("still states what was saved when the target catalog is offline, and says so", () => {
    const markup = render(focusOn("recent_or_returning"), offline);
    // Read back from the stored key rather than showing the athlete a blank or a
    // raw identifier, because the catalog only ever supplied the display name.
    expect(markup).toContain("Shoulder");
    expect(markup).toContain("The target list is offline right now");
    expect(markup).toContain("Everything else on this day is unaffected");
  });
});
