import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { legacyKey, migrateLegacyRecord, readScopedRecord, scopedKey } from "./deviceStorageScope";

function storage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    snapshot: () => Object.fromEntries(map),
  };
}

const PLAN = "gym-optimizer-workout-plan-v1";

/**
 * The plan, profile and favourites were stored under fixed keys. On a shared device
 * every account read and overwrote the same record: signing in as someone else
 * showed you their stack, and building your own replaced theirs.
 */
describe("scopedKey", () => {
  it("namespaces a record by account", () => {
    expect(scopedKey(PLAN, 42)).toBe(`${PLAN}::42`);
  });

  it("keeps two accounts apart", () => {
    expect(scopedKey(PLAN, 1)).not.toBe(scopedKey(PLAN, 2));
  });

  it("keeps the shared key while nobody is identified", () => {
    // Work done before sign-in has nowhere else to live.
    for (const id of [null, undefined, ""]) {
      expect(scopedKey(PLAN, id as null)).toBe(PLAN);
    }
  });

  it("treats a numeric and string id as the same account", () => {
    expect(scopedKey(PLAN, 7)).toBe(scopedKey(PLAN, "7"));
  });
});

/**
 * Shipping the namespace without this would look exactly like data loss: the plan is
 * still on the device, under a key nothing reads any more.
 */
describe("migrateLegacyRecord", () => {
  it("moves a pre-namespace record to the first account that signs in", () => {
    const store = storage({ [PLAN]: '{"version":2}' });
    expect(migrateLegacyRecord(PLAN, 1, store)).toBe("migrated");
    expect(store.getItem(scopedKey(PLAN, 1))).toBe('{"version":2}');
  });

  it("claims it once, so a second account cannot inherit the first one's stack", () => {
    const store = storage({ [PLAN]: '{"version":2}' });
    migrateLegacyRecord(PLAN, 1, store);
    expect(migrateLegacyRecord(PLAN, 2, store)).toBe("nothing-to-move");
    expect(store.getItem(scopedKey(PLAN, 2))).toBeNull();
  });

  it("never overwrites a record the account already has", () => {
    const store = storage({ [PLAN]: "legacy", [scopedKey(PLAN, 1)]: "mine" });
    expect(migrateLegacyRecord(PLAN, 1, store)).toBe("kept");
    expect(store.getItem(scopedKey(PLAN, 1))).toBe("mine");
  });

  it("does nothing when there is nothing to move", () => {
    const store = storage();
    expect(migrateLegacyRecord(PLAN, 1, store)).toBe("nothing-to-move");
  });

  it("does nothing while nobody is signed in", () => {
    const store = storage({ [PLAN]: "legacy" });
    expect(migrateLegacyRecord(PLAN, null, store)).toBe("nothing-to-move");
    expect(store.getItem(PLAN)).toBe("legacy");
  });

  it("survives a browser that refuses storage", () => {
    const throwing = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(() => migrateLegacyRecord(PLAN, 1, throwing)).not.toThrow();
  });

  it("leaves the legacy name unchanged, so an old build still finds its own record", () => {
    expect(legacyKey(PLAN)).toBe(PLAN);
  });
});

/**
 * Hydration used to run once on mount, before auth resolved, so it always read the
 * unscoped key. With per-account keys that would hand a returning athlete an empty
 * plan while their real one sat under their own key - and worse, the writer could
 * save the previous account's in-memory plan into the new account's record.
 */
describe("Home hydrates and writes against the same account", () => {
  const home = readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("waits for auth before hydrating", () => {
    expect(home).toContain("if (loading) return;");
  });

  it("re-hydrates when the account changes", () => {
    expect(home).toContain("}, [workoutPlanKey, loading]);");
  });

  it("does not re-read the same account's plan on every render", () => {
    expect(home).toContain("if (hydratedPlanKeyRef.current === workoutPlanKey) return;");
  });

  it("refuses to write until hydration for that key has happened", () => {
    // Otherwise the plan still in memory from the previous account lands in this one.
    expect(home).toContain("if (hydratedPlanKeyRef.current !== workoutPlanKey) return;");
  });

  it("scopes the plan, the profile and favourites", () => {
    for (const base of ["athleteProfileKeyBase", "workoutPlanKeyBase", "favoriteExerciseKeyBase"]) {
      expect(home).toContain(`scopedKey(${base}, accountId)`);
    }
  });

  it("claims any pre-namespace record on sign-in", () => {
    // Migration is part of the read, not a separate effect that could run after it.
    for (const base of ["athleteProfileKeyBase", "workoutPlanKeyBase"]) {
      expect(home).toContain(`readScopedRecord(${base}, accountId, window.localStorage)`);
    }
  });
});

/**
 * The first attempt at this ran migration in its own effect. Hydration read the
 * scoped key first, found nothing, and showed a returning athlete the onboarding
 * quiz. Reading and migrating have to be one operation.
 */
describe("readScopedRecord", () => {
  it("returns a pre-namespace record on the first read after sign-in", () => {
    const store = storage({ [PLAN]: '{"version":2}' });
    expect(readScopedRecord(PLAN, 1, store)).toBe('{"version":2}');
  });

  it("returns the account's own record when it already has one", () => {
    const store = storage({ [PLAN]: "legacy", [scopedKey(PLAN, 1)]: "mine" });
    expect(readScopedRecord(PLAN, 1, store)).toBe("mine");
  });

  it("gives a second account nothing the first one already claimed", () => {
    const store = storage({ [PLAN]: '{"version":2}' });
    readScopedRecord(PLAN, 1, store);
    expect(readScopedRecord(PLAN, 2, store)).toBeNull();
  });

  it("reads the shared key while nobody is signed in", () => {
    const store = storage({ [PLAN]: "anonymous" });
    expect(readScopedRecord(PLAN, null, store)).toBe("anonymous");
  });

  it("survives a browser that refuses storage", () => {
    const throwing = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(readScopedRecord(PLAN, 1, throwing)).toBeNull();
  });
});
