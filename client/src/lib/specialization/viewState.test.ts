import { afterEach, describe, expect, it, vi } from "vitest";
import { scopedKey } from "@/lib/deviceStorageScope";
import { specializationStacksKeyBase, stacksOnDevice } from "./stackStore";
import { areaReportForRegion, clearSpecializationParams, defaultSpecializationState, specializationStateFromParams, stackNotesForNewWeek, withRegion, writeSpecializationParams } from "./viewState";

const regions = new Set(["forearm", "deltoid"]);

describe("specialization view state in the URL (brief §6: persist region, muscle, side, window, mode and view)", () => {
  it("round-trips every field it owns", () => {
    const state = { ...defaultSpecializationState("forearm"), nodeId: "forearm.fcu", window: "custom" as const, from: "2026-10-05", to: "2026-10-18", mode: "planned" as const, view: "back" as const, layer: "deep" as const, map: "target" as const, figure: "drawing" as const, planWeek: 2, open: "stack" as const };
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

describe("a section asked for from elsewhere (11-forearm-research-and-stack.md §3.2: Plan's notice opens the stack card)", () => {
  const read = (query: string) => specializationStateFromParams(new URLSearchParams(query), "forearm", regions);

  it("is read and written only as the stack, and is absent otherwise", () => {
    expect(read("region=forearm&open=stack").open).toBe("stack");
    for (const value of ["", "Stack", "tendon", "stack;"]) expect(read(`region=forearm&open=${encodeURIComponent(value)}`), value).not.toHaveProperty("open");
    expect(defaultSpecializationState("forearm")).not.toHaveProperty("open");
    const params = new URLSearchParams();
    writeSpecializationParams(params, { ...defaultSpecializationState("forearm"), mode: "planned", planWeek: 2, open: "stack" });
    expect(params.toString()).toBe("region=forearm&mode=planned&pweek=2&open=stack");
  });

  it("does not carry to another region, and every other page strips it", () => {
    expect(withRegion({ ...defaultSpecializationState("forearm"), open: "stack" }, "deltoid")).not.toHaveProperty("open");
    const params = new URLSearchParams("workspace=day-plan&open=stack");
    clearSpecializationParams(params);
    expect(params.toString()).toBe("workspace=day-plan");
  });
});

describe("About me's area answer, for the page's region (§3.2 item 10)", () => {
  const forearmKeys = ["forearms", "brachioradialis"];

  it("is the answer in About me's words when its area is the region's and it says anything but Feels fine", () => {
    expect(areaReportForRegion({ targetKey: "forearm", constraintType: "symptomatic" }, forearmKeys)).toEqual({ constraintType: "symptomatic", answer: "Bothering me now" });
    expect(areaReportForRegion({ targetKey: "forearm", constraintType: "recent_or_returning" }, forearmKeys)).toEqual({ constraintType: "recent_or_returning", answer: "Returning after an issue" });
    expect(areaReportForRegion({ targetKey: "forearm", constraintType: "unsure" }, forearmKeys)).toEqual({ constraintType: "unsure", answer: "Not sure" });
  });

  it("is nothing for Feels fine, another area, no answer, or a region About me has no area for", () => {
    expect(areaReportForRegion({ targetKey: "forearm", constraintType: "proactive_none" }, forearmKeys)).toBeNull();
    expect(areaReportForRegion({ targetKey: "shoulder", constraintType: "symptomatic" }, forearmKeys)).toBeNull();
    expect(areaReportForRegion(undefined, forearmKeys)).toBeNull();
    expect(areaReportForRegion(null, forearmKeys)).toBeNull();
    expect(areaReportForRegion({ targetKey: "forearm", constraintType: "symptomatic" }, ["biceps", "brachialis", "triceps"])).toBeNull();
    // Another region's area, by its own keys: the deltoids are the shoulder's.
    expect(areaReportForRegion({ targetKey: "shoulder", constraintType: "clinician_restricted" }, ["frontDelts", "sideDelts", "rearDelts"])).toEqual({ constraintType: "clinician_restricted", answer: "A clinician has limited what I can do" });
  });
});

describe("Plan's note when a new week is generated and an earlier week holds a stack (§3.2, Plan says so too)", () => {
  const store = new Map<string, string>();
  const stubStorage = (getItem: (key: string) => string | null = (key) => store.get(key) ?? null) => vi.stubGlobal("window", { localStorage: { getItem } });
  const stack = (regionId: string, planWeek: number, entries: unknown[] = [{ dayKey: "0-Push", catalogExerciseId: 139, prescription: "1 × 10–25" }]) => ({ id: `${regionId}-${planWeek}`, regionId, planWeek, mappingVersion: "forearm_mappings_v1", total: 14, createdAt: "2026-10-21T10:00:00.000Z", settings: {}, entries });
  afterEach(() => { store.clear(); vi.unstubAllGlobals(); });

  // Plan reads the stack record with the store's own reader (stackStore.ts, `stacksOnDevice`), since S4 swapped S3's tolerant reader for it.
  const stored = (planWeek: number, entries: unknown[] = [{ dayKey: "0-Push", catalogExerciseId: 139, prescription: "1 × 10–25" }]) => ({ kind: "stack", ...stack("forearm", planWeek, entries), settings: { days: null, perDay: 4, holds: null } });

  it("reads which weeks hold a stack with the store's own reader, for this account only", () => {
    stubStorage();
    store.set(scopedKey(specializationStacksKeyBase, 7), JSON.stringify([{ kind: "choice", regionId: "forearm", total: 14, settings: { days: null, perDay: 4, holds: null }, updatedAt: "2026-10-21T10:00:00.000Z" }, stored(1)]));
    expect(stacksOnDevice(7)).toEqual([{ regionId: "forearm", planWeek: 1 }]);
    // Another account's record is not this one's.
    expect(stacksOnDevice(8)).toEqual([]);
  });

  it("reads a stack with no entries left, a malformed one, corrupt or missing storage, and refused storage as no stack", () => {
    stubStorage();
    const key = scopedKey(specializationStacksKeyBase, null);
    store.set(key, JSON.stringify([stored(1, []), { ...stored(2), planWeek: 0 }, { ...stored(2), regionId: "" }, { ...stored(2), entries: "x" }, stack("forearm", 3)]));
    expect(stacksOnDevice(null)).toEqual([]);
    store.set(key, "{not json");
    expect(stacksOnDevice(null)).toEqual([]);
    store.delete(key);
    expect(stacksOnDevice(null)).toEqual([]);
    stubStorage(() => { throw new Error("SecurityError"); });
    expect(stacksOnDevice(null)).toEqual([]);
  });

  it("names the region's latest earlier week, in the design's words, for a region with a page only", () => {
    // A region with no page: from wave A the upper arm has one, so a region not yet registered stands for it.
    const stacks = [{ regionId: "forearm", planWeek: 1 }, { regionId: "forearm", planWeek: 2 }, { regionId: "lower_leg", planWeek: 1 }, { regionId: "nowhere", planWeek: 1 }];
    expect(stackNotesForNewWeek(stacks, 3)).toEqual([{ regionId: "forearm", fromWeek: 2, sentence: "Your forearm stack from Week 2 is not in it; design one on Specialize." }]);
    expect(stackNotesForNewWeek([{ regionId: "forearm", planWeek: 1 }], 2)).toEqual([{ regionId: "forearm", fromWeek: 1, sentence: "Your forearm stack from Week 1 is not in it; design one on Specialize." }]);
    // A stack in the new week or a later one is not an earlier week's.
    expect(stackNotesForNewWeek([{ regionId: "forearm", planWeek: 2 }, { regionId: "forearm", planWeek: 3 }], 2)).toEqual([]);
    expect(stackNotesForNewWeek([], 2)).toEqual([]);
  });

  it("says no side", () => {
    const note = stackNotesForNewWeek([{ regionId: "forearm", planWeek: 1 }], 2)[0];
    expect(note.sentence).not.toMatch(/\b(left|right|arms?|side|each)\b/i);
  });
});
