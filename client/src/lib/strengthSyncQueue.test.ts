import { describe, expect, it } from "vitest";
import { enqueueLifts, type QueuedLift } from "./strengthSyncQueue";
import { matchSportUuids } from "./supabaseReferenceMap";

const lift = (key: string): QueuedLift => ({
  key,
  queuedAt: "2026-09-18T12:00:00.000Z",
  athlete: { sexForReference: "male", birthYear: 1998 },
  lift: { catalogExerciseId: 1, observedAt: "2026-09-18T12:00:00.000Z", measurementType: "MULTI_REP", reportedLoad: 225, reportedUnit: "lb", repetitions: 8, source: "device" },
});

describe("the outbox between a logged lift and Supabase", () => {
  it("queues a lift that has neither been queued nor sent", () => {
    expect(enqueueLifts([], [], [lift("a"), lift("b")]).map((item) => item.key)).toEqual(["a", "b"]);
  });

  it("never re-queues something already sent, which is what stops duplicates on re-derivation", () => {
    // Observations are re-derived from the session log on every launch, so the
    // same key arrives again and again; only the sent-set makes that safe.
    expect(enqueueLifts([], ["a"], [lift("a"), lift("b")]).map((item) => item.key)).toEqual(["b"]);
  });

  it("does not double-queue something already waiting", () => {
    expect(enqueueLifts([lift("a")], [], [lift("a")]).map((item) => item.key)).toEqual(["a"]);
  });

  it("drops an entry with no key rather than queueing something it cannot dedupe", () => {
    expect(enqueueLifts([], [], [lift(""), lift("b")]).map((item) => item.key)).toEqual(["b"]);
  });
});

describe("bridging app ids to the uuids the foreign keys need", () => {
  const supabaseSports = [
    { id: "uuid-wrestling", name: "Wrestling" },
    { id: "uuid-bjj", name: "Brazilian Jiu-Jitsu" },
    { id: "uuid-track", name: "Track and field" },
  ];

  it("matches on normalised names, across punctuation and case", () => {
    const map = matchSportUuids(
      [{ id: "wrestling", label: "Wrestling" }, { id: "brazilian-jiu-jitsu", label: "Brazilian jiu-jitsu" }, { id: "track-and-field", label: "Track & field" }],
      supabaseSports,
    );
    expect(map["wrestling"]).toBe("uuid-wrestling");
    expect(map["brazilian-jiu-jitsu"]).toBe("uuid-bjj");
  });

  it("leaves a sport with no Supabase row unmapped instead of guessing a neighbour", () => {
    // skiing and Olympic weightlifting have no row in public.sports yet, and a
    // lift filed under the wrong sport would poison the cohort.
    const map = matchSportUuids([{ id: "skiing", label: "Skiing" }], supabaseSports);
    expect(map["skiing"]).toBeUndefined();
  });

  it("falls back to the slug when the label does not match but the id does", () => {
    const map = matchSportUuids([{ id: "wrestling", label: "Folkstyle" }], supabaseSports);
    expect(map["wrestling"]).toBe("uuid-wrestling");
  });
});
