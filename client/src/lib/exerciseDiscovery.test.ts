import { describe, expect, it } from "vitest";
import { allExercisesDiscovery, discoveryFromParams, discoveryKey, discoveryMovementProfile, discoveryTitle, validDiscovery, writeDiscoveryParams, type ExerciseDiscoveryContext } from "./exerciseDiscovery";

/**
 * The catalog's three modes travel by id and are checked whenever they come in, so
 * a stale or hand-edited address can only ever open the whole catalog, never a
 * movement under another sport or a muscle the app has no name for.
 */

const muscles: ReadonlySet<string> = new Set(["glutes", "hamstrings", "shoulders"]);
const labels = { glutes: "Gluteal complex", hamstrings: "Hamstrings" };
const bridge: ExerciseDiscoveryContext = { mode: "movement", sportId: "wrestling", movementId: "wrestling-19" };
const params = (query: string) => new URLSearchParams(query);

describe("validDiscovery", () => {
  it("keeps a movement only in the sport it belongs to", () => {
    expect(validDiscovery(bridge, muscles)).toEqual(bridge);
    expect(validDiscovery({ mode: "movement", sportId: "soccer", movementId: "wrestling-19" }, muscles)).toEqual(allExercisesDiscovery);
    expect(validDiscovery({ mode: "movement", sportId: "wrestling", movementId: "no-such-movement" }, muscles)).toEqual(allExercisesDiscovery);
  });

  it("keeps a muscle only when it is a known key", () => {
    expect(validDiscovery({ mode: "muscle", muscleId: "glutes" }, muscles)).toEqual({ mode: "muscle", muscleId: "glutes" });
    expect(validDiscovery({ mode: "muscle", muscleId: "Gluteal complex" }, muscles)).toEqual(allExercisesDiscovery);
  });

  it("returns only the mode's own fields", () => {
    const mixed = { ...bridge, muscleId: "glutes" } as ExerciseDiscoveryContext;
    expect(validDiscovery(mixed, muscles)).toEqual(bridge);
  });
});

describe("the catalog address", () => {
  it("reads a valid movement or muscle and nothing else", () => {
    expect(discoveryFromParams(params("workspace=catalog&discover=movement&sport=wrestling&movement=wrestling-19"), muscles)).toEqual(bridge);
    expect(discoveryFromParams(params("workspace=catalog&discover=muscle&muscle=glutes"), muscles)).toEqual({ mode: "muscle", muscleId: "glutes" });
    expect(discoveryFromParams(params("workspace=catalog"), muscles)).toEqual(allExercisesDiscovery);
  });

  it("opens the whole catalog for anything it cannot resolve", () => {
    expect(discoveryFromParams(params("discover=movement&sport=soccer&movement=wrestling-19"), muscles)).toEqual(allExercisesDiscovery);
    expect(discoveryFromParams(params("discover=movement&movement=wrestling-19"), muscles)).toEqual(allExercisesDiscovery);
    expect(discoveryFromParams(params("discover=muscle&muscle=notAMuscle"), muscles)).toEqual(allExercisesDiscovery);
    expect(discoveryFromParams(params("discover=somethingElse&muscle=glutes"), muscles)).toEqual(allExercisesDiscovery);
    // A muscle parameter is not read in movement mode, so it cannot mix into it.
    expect(discoveryFromParams(params("discover=movement&sport=wrestling&movement=wrestling-19&muscle=glutes"), muscles)).toEqual(bridge);
  });

  it("writes each mode's parameters and removes the other mode's", () => {
    const query = params("workspace=catalog&discover=muscle&muscle=glutes&keep=1");
    writeDiscoveryParams(query, bridge);
    expect(query.toString()).toBe("workspace=catalog&keep=1&discover=movement&sport=wrestling&movement=wrestling-19");
    writeDiscoveryParams(query, { mode: "muscle", muscleId: "hamstrings" });
    expect(query.toString()).toBe("workspace=catalog&keep=1&discover=muscle&muscle=hamstrings");
    writeDiscoveryParams(query, allExercisesDiscovery);
    expect(query.toString()).toBe("workspace=catalog&keep=1");
  });

  it("reads back what it writes", () => {
    for (const context of [bridge, { mode: "muscle", muscleId: "glutes" }, allExercisesDiscovery] as ExerciseDiscoveryContext[]) {
      const query = params("workspace=catalog");
      writeDiscoveryParams(query, context);
      expect(discoveryFromParams(query, muscles)).toEqual(context);
    }
  });
});

describe("labels and keys come from the ids", () => {
  it("titles each mode", () => {
    expect(discoveryTitle(bridge, labels)).toBe("Exercises for Bridge");
    expect(discoveryTitle({ mode: "muscle", muscleId: "glutes" }, labels)).toBe("Gluteal complex exercises");
    expect(discoveryTitle(allExercisesDiscovery, labels)).toBe("Exercise catalog");
  });

  it("resolves the movement profile only for a movement in its sport", () => {
    expect(discoveryMovementProfile(bridge)?.label).toBe("bridge");
    expect(discoveryMovementProfile({ mode: "movement", sportId: "soccer", movementId: "wrestling-19" })).toBeNull();
    expect(discoveryMovementProfile({ mode: "muscle", muscleId: "glutes" })).toBeNull();
  });

  it("gives each context its own key", () => {
    const keys = [bridge, { mode: "movement", sportId: "wrestling", movementId: "wrestling-1" }, { mode: "muscle", muscleId: "glutes" }, allExercisesDiscovery].map((context) => discoveryKey(context as ExerciseDiscoveryContext));
    expect(new Set(keys).size).toBe(keys.length);
    expect(discoveryKey(bridge)).toBe("movement:wrestling/wrestling-19");
  });
});
