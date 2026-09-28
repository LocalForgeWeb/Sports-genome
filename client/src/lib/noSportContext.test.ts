import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sportProfiles } from "./sportMovementDatabase";
import { findSportMovement } from "./movementRecommendations";
import { noSportActionRoleContext } from "./bodyLabRoleContext";

const home = readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

/**
 * Reported: an athlete chose "no sport", set a lower-back focus, and the Body Lab
 * showed them the wrestling penetration step.
 *
 * Nothing was random about it. Three ordinary fallbacks ran in a row:
 *
 *   selectedSport   = sportProfiles.find(id === sportId) || sportProfiles[0]   -> Wrestling
 *   activeSportId   = sportId || selectedSport.id                              -> "wrestling"
 *   selectedMovement= ... || findSportMovement(activeSportId)                  -> penetration step
 *
 * Each is reasonable alone. Together they turn "no answer" into a confident wrong
 * one, and the screen then presents that sport's first action as the athlete's.
 *
 * These tests pin the fallbacks that make the bug reachable, so the fix is not
 * quietly undone by a reordering of the sport catalog.
 */
describe("the fallback chain that produced a wrestling action from no sport", () => {
  it("still resolves an empty sport to the catalog's first sport", () => {
    // Not a bug in itself - it is why `hasSportContext` has to be the gate.
    const noSport = "";
    const selectedSport = sportProfiles.find((profile) => profile.id === noSport) || sportProfiles[0];
    expect(selectedSport).toBe(sportProfiles[0]);
    expect(noSport || selectedSport.id).toBe(sportProfiles[0].id);
  });

  it("still resolves an empty movement to that sport's first action", () => {
    const fallback = findSportMovement(sportProfiles[0].id);
    expect(fallback.sportId).toBe(sportProfiles[0].id);
    expect(fallback.label.length).toBeGreaterThan(0);
  });
});

describe("what the Body Lab shows when no sport is chosen", () => {
  it("claims no muscle for an action the athlete never picked", () => {
    expect(noSportActionRoleContext.primary).toEqual([]);
    expect(noSportActionRoleContext.supporting).toEqual([]);
    expect(Object.keys(noSportActionRoleContext.rolesByMuscle)).toEqual([]);
    // Says why it is empty rather than reading as a failure to load.
    expect(noSportActionRoleContext.methodology).toContain("No sport action is selected");
  });

  it("gates the role context on the sport the athlete actually chose", () => {
    // `activeSportId` is never empty, so it must not be the gate. `hasSportContext`
    // is, and its own comment in Home.tsx says so.
    expect(home).toContain("const bodyLabRoleContext = hasSportContext");
    expect(home).toContain(": noSportActionRoleContext;");
  });

  it("shows no sport-action navigator when there is no sport action", () => {
    expect(home).toContain("const showsSportAction = hasSportContext || browsingOtherSport;");
    expect(home).toContain("{showsSportAction && <BodyLabNavigator");
    expect(home).toContain("{!showsSportAction && <BodyLabPickSport");
  });

  it("never names a borrowed action in the next-step line", () => {
    // It used to read "Train what penetration step uses most" to an athlete who had
    // never chosen wrestling. Without an action there is no muscle to seed from, so
    // the line only appears once the athlete taps one.
    expect(home).toContain('(showsSportAction ? getMovementMuscles(referenceMovement)[0] : "")');
    expect(home).toContain("if (!target) return null;");
  });

  it("leaves the body map itself reachable, because it needs no sport", () => {
    // The Body Lab is the reference library. The fix removes a false claim; it must
    // not remove the screen.
    const body = home.slice(home.indexOf('{workspace === "body" &&'));
    const section = body.slice(0, body.indexOf("</section>}"));
    expect(section).toContain("<AnatomyMap");
    expect(section).toContain("onSelect={setActiveMuscle}");
  });
});
