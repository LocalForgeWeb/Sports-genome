import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The identity chain must never be able to stop an athlete logging a set, so
 * these exercise the failure paths as carefully as the happy one.
 */
const mockClient = (overrides: Record<string, unknown> = {}) => {
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    ...(overrides.auth as object || {}),
  };
  const upsert = vi.fn().mockResolvedValue({ error: null });
  return { client: { auth, from: vi.fn(() => ({ upsert })) }, auth, upsert };
};

async function withClient(client: unknown) {
  vi.resetModules();
  vi.doMock("@/lib/supabaseClient", () => ({ getSupabaseClient: () => client, supabaseConfigured: Boolean(client) }));
  return import("./athleteIdentity");
}

afterEach(() => { vi.doUnmock("@/lib/supabaseClient"); vi.resetModules(); });

describe("giving every athlete a durable Supabase id", () => {
  it("creates one anonymously on first launch, so history is owned from the first lift", async () => {
    const { client, auth } = mockClient();
    const { ensureAthleteIdentity } = await withClient(client);
    await expect(ensureAthleteIdentity()).resolves.toEqual({ userId: "user-1", anonymous: true });
    expect(auth.signInAnonymously).toHaveBeenCalledOnce();
  });

  it("reuses the existing session instead of making a second account", async () => {
    const { client, auth } = mockClient({ auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-9", email: "a@b.c" } } } }) } });
    const { ensureAthleteIdentity } = await withClient(client);
    await expect(ensureAthleteIdentity()).resolves.toEqual({ userId: "user-9", anonymous: false });
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("reports the project setting rather than failing silently when anonymous sign-ins are off", async () => {
    const { client } = mockClient({ auth: { signInAnonymously: vi.fn().mockResolvedValue({ data: {}, error: { message: "Anonymous sign-ins are disabled", status: 422 } }) } });
    const { ensureAthleteIdentity } = await withClient(client);
    const state = await ensureAthleteIdentity();
    expect(state.userId).toBeNull();
    expect(state.reason).toBe("anonymous_sign_ins_disabled");
  });

  it("degrades to on-device when there is no network, and never throws", async () => {
    const { client } = mockClient({ auth: { getSession: vi.fn().mockRejectedValue(new Error("offline")) } });
    const { ensureAthleteIdentity } = await withClient(client);
    await expect(ensureAthleteIdentity()).resolves.toMatchObject({ userId: null, reason: "unreachable" });
  });

  it("says so when the build has no Supabase credentials at all", async () => {
    const { ensureAthleteIdentity } = await withClient(null);
    await expect(ensureAthleteIdentity()).resolves.toMatchObject({ userId: null, reason: "not_configured" });
  });
});

describe("the profile row", () => {
  it("sends the athlete's defaults with the database's own sex code", async () => {
    const { client, upsert } = mockClient();
    const { upsertAthleteProfile } = await withClient(client);
    await upsertAthleteProfile("user-1", { sexForReference: "female", birthYear: 1998, defaultBodyWeightKg: 81.6532, primarySportId: "sport-uuid" });
    const row = upsert.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBe("user-1");
    expect(row.sex_code).toBe(2);
    expect(row.default_bodyweight_kg).toBe(81.65);
    expect(row.primary_sport_id).toBe("sport-uuid");
  });

  it("never writes the norms-pool consent unless the athlete actually answered", async () => {
    const { client, upsert } = mockClient();
    const { upsertAthleteProfile } = await withClient(client);
    await upsertAthleteProfile("user-1", { sexForReference: "male" });
    expect(upsert.mock.calls[0][0]).not.toHaveProperty("benchmark_pool_opt_in");

    await upsertAthleteProfile("user-1", { benchmarkPoolOptIn: true });
    expect(upsert.mock.calls[1][0]).toHaveProperty("benchmark_pool_opt_in", true);
  });

  it("adds an email to the id the athlete already has, rather than making a new one", async () => {
    const { client, auth } = mockClient();
    const { attachEmailToIdentity } = await withClient(client);
    await expect(attachEmailToIdentity("a@b.c")).resolves.toEqual({ ok: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ email: "a@b.c" });
  });
});
