import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Saving the reference profile against a stand-in database that records the row it would
 * insert and the SET it would apply when the athlete already has a profile.
 */
const state = {
  values: [] as unknown[],
  sets: [] as unknown[],
};

const fakeDb = {
  insert: () => ({
    values: (values: unknown) => {
      state.values.push(values);
      return { onDuplicateKeyUpdate: async ({ set }: { set: unknown }) => { state.sets.push(set); } };
    },
  }),
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
};

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

const { athleteStrengthProfileInputSchema, upsertAthleteStrengthProfile } = await import("./athleteStrengthProfile");

beforeEach(() => {
  state.values = [];
  state.sets = [];
});

describe("saving part of the reference profile", () => {
  it("changes only sex when only sex is sent, keeping the saved birth date", async () => {
    await upsertAthleteStrengthProfile(7, { sexForReference: "female" });

    expect(state.sets).toEqual([{ sexForReference: "female" }]);
    // A first save still writes a whole row.
    expect(state.values).toEqual([{ userId: 7, dateOfBirth: null, sexForReference: "female" }]);
  });

  it("changes only the birth date when only the birth date is sent, keeping the saved sex", async () => {
    await upsertAthleteStrengthProfile(7, { dateOfBirth: "1990-05-01" });

    expect(state.sets).toEqual([{ dateOfBirth: new Date("1990-05-01T00:00:00Z") }]);
    expect(state.sets[0]).not.toHaveProperty("sexForReference");
  });

  it("clears the birth date when null is sent", async () => {
    await upsertAthleteStrengthProfile(7, { dateOfBirth: null });

    expect(state.sets).toEqual([{ dateOfBirth: null }]);
  });

  it("changes nothing when neither field is sent", async () => {
    await upsertAthleteStrengthProfile(7, {});

    expect(state.sets).toEqual([{ userId: 7 }]);
  });
});

describe("the birth date the profile accepts", () => {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  it.each(["2000-13-01", "2000-02-30", tomorrow, "1850-01-01"])("refuses %s", (dateOfBirth) => {
    const parsed = athleteStrengthProfileInputSchema.safeParse({ dateOfBirth });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Enter a real birth date in the past.");
  });

  it("accepts a real past date, a null that clears it, and leaving it out", () => {
    expect(athleteStrengthProfileInputSchema.safeParse({ dateOfBirth: "1990-05-01" }).success).toBe(true);
    expect(athleteStrengthProfileInputSchema.safeParse({ dateOfBirth: "2000-02-29" }).success).toBe(true);
    expect(athleteStrengthProfileInputSchema.safeParse({ dateOfBirth: null }).success).toBe(true);
    expect(athleteStrengthProfileInputSchema.safeParse({ sexForReference: "male" }).success).toBe(true);
  });
});
