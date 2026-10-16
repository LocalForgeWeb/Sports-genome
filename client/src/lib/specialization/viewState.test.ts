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
