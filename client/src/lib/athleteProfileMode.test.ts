import { beforeEach, describe, expect, it, vi } from "vitest";

const upserts: Record<string, unknown>[] = [];

vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      upsert: (row: Record<string, unknown>) => { upserts.push(row); return Promise.resolve({ error: null }); },
    }),
  }),
}));

const { upsertAthleteProfile } = await import("./athleteIdentity");

beforeEach(() => { upserts.length = 0; });

const last = () => upserts[upserts.length - 1];

/**
 * `athlete_profiles.sport_context_mode` exists and the app never wrote it, so
 * every athlete was stored as `undecided` — the column's default — including the
 * ones who had chosen a sport. That is the exact distinction
 * `sport-optional-context-not-fake-sport` exists to keep: "general" and "not yet
 * answered" are different rows, not a null check.
 *
 * The column does not travel alone. `athlete_profiles_mode_sport_agreement_check`
 * requires a sport in `sport` mode and forbids one in `general` or `undecided`,
 * and a rejected upsert loses the whole row — sex, weight and all — not just the
 * two columns that disagreed.
 */
describe("the sport context mode is written, and written consistently", () => {
  it("records the mode alongside the sport in sport mode", async () => {
    await upsertAthleteProfile("user-1", { sportContextMode: "sport", primarySportId: "sport-uuid" });
    expect(last().sport_context_mode).toBe("sport");
    expect(last().primary_sport_id).toBe("sport-uuid");
  });

  it("clears the sport when the athlete is not in sport mode", async () => {
    // Not "leaves it out": a general athlete whose row still carries a previous
    // sport id fails the check, and the upsert takes everything else with it.
    for (const mode of ["general", "undecided"] as const) {
      await upsertAthleteProfile("user-1", { sportContextMode: mode, primarySportId: "stale-uuid" });
      expect(last().sport_context_mode).toBe(mode);
      expect(last().primary_sport_id, `${mode} mode must null the sport`).toBeNull();
    }
  });

  /**
   * The sport uuid is resolved from a reference map that arrives after the first
   * render. Declaring `sport` mode in that window, with no sport to declare,
   * fails the same check.
   */
  it("waits rather than declaring sport mode with no sport resolved yet", async () => {
    await upsertAthleteProfile("user-1", { sportContextMode: "sport", primarySportId: undefined });
    expect(last()).not.toHaveProperty("sport_context_mode");
    expect(last()).not.toHaveProperty("primary_sport_id");
    // The rest of the profile still goes, because none of it is in dispute.
    expect(last()).toHaveProperty("sex_code");
  });

  it("still writes a sport on its own for callers that declare no mode", async () => {
    await upsertAthleteProfile("user-1", { primarySportId: "sport-uuid" });
    expect(last().primary_sport_id).toBe("sport-uuid");
    expect(last()).not.toHaveProperty("sport_context_mode");
  });
});
