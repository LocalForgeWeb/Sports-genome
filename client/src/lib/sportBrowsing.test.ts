import { describe, expect, it } from "vitest";
import {
  browseAction,
  browseMovement,
  browseSport,
  followProfileSport,
  isBrowsingOtherSport,
  referenceMovementId,
  referenceSportId,
  type SportBrowseState,
} from "@/lib/sportBrowsing";

const browsing: SportBrowseState = { sportId: "soccer", movementId: "soccer-3" };

describe("referenceSportId", () => {
  it("follows the athlete's own sport when nothing is being browsed", () => {
    expect(referenceSportId("wrestling", followProfileSport)).toBe("wrestling");
  });

  it("shows the browsed sport on the reference screens", () => {
    expect(referenceSportId("wrestling", browsing)).toBe("soccer");
  });
});

describe("isBrowsingOtherSport", () => {
  it("is false at rest, so nothing announces a state the athlete is not in", () => {
    expect(isBrowsingOtherSport("wrestling", followProfileSport)).toBe(false);
  });

  it("is true while a different sport is open", () => {
    expect(isBrowsingOtherSport("wrestling", browsing)).toBe(true);
  });

  it("is false when the browsed sport is the athlete's own", () => {
    // Opening Wrestling while Wrestling is your sport is not browsing, and must
    // not raise a banner offering to return you to where you already are.
    expect(isBrowsingOtherSport("wrestling", { sportId: "wrestling", movementId: null })).toBe(false);
  });
});

describe("browseSport", () => {
  it("records the sport to read without touching the athlete's own", () => {
    expect(browseSport("soccer", "wrestling")).toEqual({ sportId: "soccer", movementId: null });
  });

  it("clears the overlay when the athlete selects their own sport again", () => {
    expect(browseSport("wrestling", "wrestling")).toEqual(followProfileSport);
  });

  it("treats an empty selection as following the profile, never as a reset prompt", () => {
    // The profile's own sport control reads "" as "clear my sport", which asks to
    // delete every saved day. A reference screen must never reach that path.
    expect(browseSport("", "wrestling")).toEqual(followProfileSport);
  });
});

describe("browseAction", () => {
  it("carries the sport the action belongs to, and the action itself", () => {
    expect(browseAction({ id: "soccer-3", sportId: "soccer" }, "wrestling")).toEqual({ sportId: "soccer", movementId: "soccer-3" });
  });

  it("stays on the profile sport for an action that already belongs to it", () => {
    expect(browseAction({ id: "wrestling-4", sportId: "wrestling" }, "wrestling")).toEqual(followProfileSport);
  });
});

describe("browseMovement", () => {
  it("keeps the browsed sport when moving between its actions", () => {
    expect(browseMovement("soccer-7", browsing)).toEqual({ sportId: "soccer", movementId: "soccer-7" });
  });

  it("changes nothing when the athlete is on their own sport", () => {
    // The athlete's own movement selection is ordinary state; it does not become
    // a browse overlay just because they picked a different action.
    expect(browseMovement("wrestling-4", followProfileSport)).toEqual(followProfileSport);
  });
});

describe("referenceMovementId", () => {
  it("uses the athlete's own selection while not browsing", () => {
    expect(referenceMovementId("wrestling-2", followProfileSport)).toBe("wrestling-2");
  });

  it("uses the browsed action once a sport is open for reading", () => {
    expect(referenceMovementId("wrestling-2", browsing)).toBe("soccer-3");
  });

  it("falls through to the sport's own first action when a sport was opened without one", () => {
    // An empty id lets the caller resolve the sport's default rather than
    // carrying a wrestling action into soccer.
    expect(referenceMovementId("wrestling-2", { sportId: "soccer", movementId: null })).toBe("");
  });
});
