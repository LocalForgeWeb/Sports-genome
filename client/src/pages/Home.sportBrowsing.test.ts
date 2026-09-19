import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

/**
 * Reading a sport must not be able to reach the athlete's own.
 *
 * Measured against the build this replaces: opening "Soccer" from search with
 * four saved days and six staged exercises left the profile on soccer with
 * zero saved days, zero staged exercises and zero prescriptions. One tap on a
 * search result, and the only recourse was an Undo toast.
 */
describe("browsing a sport never changes the athlete's own", () => {
  it("opens a sport from search into the reference library, not into the profile", () => {
    expect(source).toContain('setSportBrowse(browseSport(result.id, activeSportId));');
    expect(source).not.toMatch(/result\.type === "sport"\)\s*\{\s*chooseSport/);
  });

  it("opens a sport action the same way, carrying the sport it belongs to", () => {
    expect(source).toContain("const browse = browseAction(action, activeSportId);");
    expect(source).not.toContain("if (action.sportId !== sportId) chooseSport(action.sportId);");
  });

  it("gives the Movement Atlas and the Body Lab a sport picker that browses", () => {
    // Both are the reference library; neither may call the profile's handler.
    expect(source).toContain("onSport={(id) => { setSportBrowse(browseSport(id, activeSportId)); setAtlasQuery(\"\"); setAtlasFamily(\"All\"); }}");
    expect(source).toContain("onSport={(id) => setSportBrowse(browseSport(id, activeSportId))}");
    // About Me keeps the profile handler: that screen IS the athlete's sport,
    // and changing it there is the deliberate act browsing was confused with.
    const aboutMe = source.slice(source.indexOf("<AthleteAboutMePanel"));
    expect(aboutMe.slice(0, aboutMe.indexOf("/>"))).toContain("onSport={chooseSport}");
  });

  it("feeds those two screens the browsed sport and leaves every plan surface on the athlete's", () => {
    expect(source).toContain("sportId={browseSportId} sports={sportProfiles} movements={referenceMovements} selectedMovement={referenceMovement}");
    expect(source).toContain("activeSportId={browseSportId} movements={referenceMovements} selectedMovement={referenceMovement}");
    // The session, the generated week and the smart draft all still read the
    // athlete's own sport, which is what browsing must never touch.
    expect(source).toContain("getSportSession(activeSportId, goal, gymTimeBudget.recommendationLimit");
    expect(source).toContain("buildGeneratedWeekSportSeed(activeSportId, goal");
  });

  it("says which sport is on screen whenever it is not the athlete's", () => {
    expect(source).toContain("<SportBrowseNotice browsing={browsingOtherSport}");
    expect(source).toContain("ownSportLabel={selectedSport.label}");
  });

  it("keeps adopting a sport a separate, deliberate act", () => {
    // The one path that reaches chooseSport from a reference screen is the
    // explicit button, and it clears the overlay it came from.
    expect(source).toContain("onAdopt={() => { chooseSport(browseSportId); setSportBrowse(followProfileSport); }}");
  });

  it("drops the overlay on leaving the reference library, so it never becomes a hidden mode", () => {
    expect(source).toContain('if (primaryDestinationForWorkspace(next) !== "body") setSportBrowse(followProfileSport);');
  });
});
