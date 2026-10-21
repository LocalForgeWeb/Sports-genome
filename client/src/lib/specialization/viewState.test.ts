import { describe, expect, it } from "vitest";
import { clearSpecializationParams, defaultSpecializationState, specializationStateFromParams, writeSpecializationParams } from "./viewState";

const regions = new Set(["forearm", "deltoid"]);

describe("specialization view state in the URL (brief §6: persist region, muscle, side, window, mode and view)", () => {
  it("round-trips every field it owns", () => {
    const state = { ...defaultSpecializationState("forearm"), nodeId: "forearm.fcu", window: "custom" as const, from: "2026-10-05", to: "2026-10-18", mode: "planned" as const, view: "back" as const, layer: "deep" as const, map: "target" as const, figure: "drawing" as const, planWeek: 2 };
    const params = new URLSearchParams("workspace=specialization");
    writeSpecializationParams(params, state);
    expect(params.get("workspace")).toBe("specialization");
    expect(specializationStateFromParams(params, "forearm", regions)).toEqual(state);
  });

  it("drops an old address's arm: both arms are counted as one (20 Oct 2026)", () => {
    const params = new URLSearchParams("region=forearm&node=forearm.fcu&limb=left");
    const state = specializationStateFromParams(params, "forearm", regions);
    expect(state).not.toHaveProperty("limb");
    writeSpecializationParams(params, state);
    expect(params.toString()).toBe("region=forearm&node=forearm.fcu");
  });

  it("keeps the URL short by leaving defaults out", () => {
    const params = new URLSearchParams();
    writeSpecializationParams(params, defaultSpecializationState("forearm"));
    expect(params.toString()).toBe("region=forearm");
  });

  it("falls back field by field instead of trusting a hand-edited URL", () => {
    const params = new URLSearchParams("region=calves&limb=up&window=custom&from=2026-10-20&to=2026-10-01&view=Side%20view&layer=bones&pweek=-1&map=x");
    expect(specializationStateFromParams(params, "forearm", regions)).toEqual(defaultSpecializationState("forearm"));
  });

  it("leaves other workspaces' params alone and clears only its own", () => {
    const params = new URLSearchParams("workspace=catalog&muscle=forearms&node=forearm.fcu&limb=left&mode=planned");
    clearSpecializationParams(params);
    expect(params.toString()).toBe("workspace=catalog&muscle=forearms");
  });
});

describe("the view is the drawing's own id", () => {
  const read = (query: string) => specializationStateFromParams(new URLSearchParams(query), "forearm", regions);

  it("opens on the drawing's first view: no view in the state, none in the address", () => {
    expect(defaultSpecializationState("forearm").view).toBeNull();
    expect(defaultSpecializationState("deltoid").view).toBeNull();
    expect(read("region=forearm").view).toBeNull();
  });

  it("keeps any well-formed id, the forearm's or another region's, and leaves it to the page to know which views exist", () => {
    for (const view of ["palm", "back", "thumb", "front", "side", "rear", "lateral_2"]) expect(read(`region=deltoid&view=${view}`).view, view).toBe(view);
  });

  it("drops an id of the wrong shape, as the database would refuse it", () => {
    for (const view of ["", "Front", "front view", "2nd", "front-left", "palm;"]) expect(read(`view=${encodeURIComponent(view)}`).view, JSON.stringify(view)).toBeNull();
  });

  it("writes a view only when one is chosen, and reads it back", () => {
    const params = new URLSearchParams();
    writeSpecializationParams(params, { ...defaultSpecializationState("deltoid"), view: "rear" });
    expect(params.toString()).toBe("region=deltoid&view=rear");
    expect(specializationStateFromParams(params, "forearm", regions).view).toBe("rear");
  });
});

describe("a custom window from a hand-edited address", () => {
  const read = (from: string, to: string) => specializationStateFromParams(new URLSearchParams(`window=custom&from=${from}&to=${to}`), "forearm", new Set(["forearm"]));
  it("keeps real calendar dates", () => {
    expect(read("2026-02-01", "2026-02-28")).toMatchObject({ window: "custom", from: "2026-02-01", to: "2026-02-28" });
  });
  it("drops dates that do not exist, or that leave no next day, back to this week", () => {
    for (const [from, to] of [["2026-02-30", "2026-03-02"], ["2026-13-01", "2026-13-05"], ["2026-01-01", "9999-12-31"], ["2026-04-31", "2026-05-01"]]) {
      expect(read(from, to), `${from}..${to}`).toMatchObject({ window: "week", from: null, to: null });
    }
  });
});
