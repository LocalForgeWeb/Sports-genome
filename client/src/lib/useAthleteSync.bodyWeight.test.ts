// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AthleteProfileUpsert } from "./athleteIdentity";
import { loadBodyWeightLog, recordBodyWeight, saveBodyWeightLog } from "./bodyWeightLog";

/**
 * The account's default body weight used to be read only when some other profile field
 * changed, so a weight logged in About me stayed off the account until the next launch.
 */
const account = vi.hoisted(() => ({ upserts: [] as AthleteProfileUpsert[] }));
vi.mock("@/lib/athleteIdentity", () => ({
  ensureAthleteIdentity: async () => ({ userId: "u1", anonymous: true }),
  upsertAthleteProfile: async (_userId: string, profile: AthleteProfileUpsert) => { account.upserts.push(profile); return true; },
}));
vi.mock("@/lib/supabaseReferenceMap", () => ({ loadCachedReferenceMap: () => null, refreshReferenceMap: async () => null }));
vi.mock("@/lib/resilienceCatalogClient", () => ({ fetchTargetCatalogAsAthlete: async () => null }));

import { useAthleteSync } from "./useAthleteSync";

const appSports = [{ id: "wrestling", label: "Wrestling" }] as const;
const mount = () => renderHook(() => useAthleteSync({ weightUnit: "kg", appSports, enabled: true }));
const settle = async () => { await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); }); };
const lastUpsert = () => account.upserts.at(-1);

beforeEach(() => {
  window.localStorage.clear();
  account.upserts.length = 0;
  saveBodyWeightLog(recordBodyWeight([], 80, "kg", "2026-09-20T08:00:00.000Z"));
});

afterEach(() => { cleanup(); });

describe("The account's default body weight", () => {
  it("follows a newly logged weight without a reload", async () => {
    mount();
    await waitFor(() => expect(lastUpsert()?.defaultBodyWeightKg).toBe(80));

    act(() => { saveBodyWeightLog(recordBodyWeight(loadBodyWeightLog(), 84, "kg", "2026-09-28T08:00:00.000Z")); });
    await settle();
    expect(lastUpsert()?.defaultBodyWeightKg).toBe(84);
  });

  it("is not sent again when the log is saved with the same weight", async () => {
    mount();
    await waitFor(() => expect(lastUpsert()?.defaultBodyWeightKg).toBe(80));
    const sent = account.upserts.length;

    act(() => { saveBodyWeightLog(loadBodyWeightLog()); });
    await settle();
    expect(account.upserts).toHaveLength(sent);
  });
});
