import { describe, expect, it } from "vitest";
import { clearSpecializationParams, defaultSpecializationState, specializationStateFromParams, writeSpecializationParams } from "./viewState";

const regions = new Set(["forearm", "deltoid"]);

describe("specialization view state in the URL (brief §6: persist region, muscle, side, window, mode and view)", () => {
  it("round-trips every field it owns", () => {
    const state = { ...defaultSpecializationState("forearm"), nodeId: "forearm.fcu", limb: "left" as const, window: "custom" as const, from: "2026-10-05", to: "2026-10-18", mode: "planned" as const, view: "back" as const, layer: "deep" as const, map: "target" as const, planWeek: 2 };
    const params = new URLSearchParams("workspace=specialization");
    writeSpecializationParams(params, state);
    expect(params.get("workspace")).toBe("specialization");
    expect(specializationStateFromParams(params, "forearm", regions)).toEqual(state);
  });

  it("keeps the URL short by leaving defaults out", () => {
    const params = new URLSearchParams();
    writeSpecializationParams(params, defaultSpecializationState("forearm"));
    expect(params.toString()).toBe("region=forearm");
  });

  it("falls back field by field instead of trusting a hand-edited URL", () => {
    const params = new URLSearchParams("region=calves&limb=up&window=custom&from=2026-10-20&to=2026-10-01&view=side&layer=bones&pweek=-1&map=x");
    expect(specializationStateFromParams(params, "forearm", regions)).toEqual(defaultSpecializationState("forearm"));
  });

  it("leaves other workspaces' params alone and clears only its own", () => {
    const params = new URLSearchParams("workspace=catalog&muscle=forearms&node=forearm.fcu&limb=left&mode=planned");
    clearSpecializationParams(params);
    expect(params.toString()).toBe("workspace=catalog&muscle=forearms");
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
