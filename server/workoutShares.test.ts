import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createShare, disableShare, hashSecret, MemoryShareStore, ownedShares, readShare, ShareError, SupabaseShareStore, tokenPattern, useShareStore, type ShareRow } from "./workoutShares";
import { parseShareSnapshot, shareLimits, type ShareSnapshot } from "../shared/workoutShare";

const snapshot = (overrides: Partial<ShareSnapshot> = {}): ShareSnapshot => ({
  schema: 1,
  scope: "day",
  title: "Pull · Week 1",
  week: 1,
  days: [{ order: 1, label: "Pull", exercises: [
    { order: 1, catalogId: 12, name: "Barbell Row", prescription: "4 × 6–8", rpe: "RPE 8", rest: "120 sec" },
    { order: 2, catalogId: null, name: "Towel Grip Hang", prescription: "3 × 30–45 sec" },
  ] }],
  ...overrides,
});
const secret = "s".repeat(43);
const otherSecret = "o".repeat(43);
const key = (n: number) => `request-key-${String(n).padStart(6, "0")}`;

/**
 * Oct 4 sharing brief, engineering requirements: a share is a validated snapshot, made
 * once per request however often it is retried, readable by anyone with the token, and
 * managed only by the device holding its secret.
 */
describe("workout shares", () => {
  let store: MemoryShareStore;
  beforeEach(() => { store = new MemoryShareStore(); useShareStore(store); });
  afterEach(() => useShareStore(undefined));

  it("stores a validated copy under an unguessable token and reads it back exactly", async () => {
    const made = await createShare({ requestKey: key(1), manageSecret: secret, snapshot: snapshot() }, new Date("2026-10-04T10:00:00Z"));
    expect(made).toMatchObject({ version: 1, createdAt: "2026-10-04T10:00:00.000Z", reused: false });
    expect(made.token).toMatch(tokenPattern);
    const read = await readShare(made.token);
    expect(read).toEqual({ state: "active", token: made.token, snapshot: snapshot(), createdAt: "2026-10-04T10:00:00.000Z", version: 1, newerToken: null });
    // Only the secret's hash is kept.
    const row = store.rows.get(made.token)!;
    expect(row.manage_hash).toBe(hashSecret(secret));
    expect(JSON.stringify(row)).not.toContain(secret);
    expect(row).toMatchObject({ exercise_count: 2, day_count: 1, scope: "day", status: "active" });
  });

  it("returns the same share for the same request, so a retried or double-sent create makes one link", async () => {
    const first = await createShare({ requestKey: key(2), manageSecret: secret, snapshot: snapshot() });
    const again = await createShare({ requestKey: key(2), manageSecret: secret, snapshot: snapshot() });
    expect(again).toMatchObject({ token: first.token, reused: true });
    expect(store.rows.size).toBe(1);
    // A request key is no way into someone else's share.
    await expect(createShare({ requestKey: key(2), manageSecret: otherSecret, snapshot: snapshot() })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("answers both halves of a race with the one share that was stored", async () => {
    const racing = new MemoryShareStore();
    const lookups = vi.spyOn(racing, "byRequestKey").mockResolvedValueOnce(null);
    useShareStore(racing);
    const winner: ShareRow = { token: "WinnerTokenWinnerToken", manage_hash: hashSecret(secret), request_key: key(3), schema_version: 1, scope: "day", title: "Pull · Week 1", payload: snapshot(), exercise_count: 2, day_count: 1, version: 1, supersedes_token: null, status: "active", created_at: "2026-10-04T10:00:00.000Z", disabled_at: null };
    await racing.insert(winner);
    const result = await createShare({ requestKey: key(3), manageSecret: secret, snapshot: snapshot() });
    expect(result).toMatchObject({ token: winner.token, reused: true });
    expect(racing.rows.size).toBe(1);
    lookups.mockRestore();
  });

  it("refuses what isn't a workout: wrong schema, empty days, a day share with two days, repeated order, oversized payloads", async () => {
    const bad: unknown[] = [
      { ...snapshot(), schema: 2 },
      { ...snapshot(), days: [] },
      { ...snapshot(), days: [snapshot().days[0], { ...snapshot().days[0], order: 2 }] },
      { ...snapshot(), days: [{ ...snapshot().days[0], exercises: [snapshot().days[0].exercises[0], { ...snapshot().days[0].exercises[1], order: 1 }] }] },
      { ...snapshot(), title: "" },
      { ...snapshot(), description: "x".repeat(shareLimits.description + 1) },
      "not a workout",
    ];
    for (const [index, value] of bad.entries()) {
      await expect(createShare({ requestKey: key(10 + index), manageSecret: secret, snapshot: value })).rejects.toBeInstanceOf(ShareError);
    }
    const huge = { ...snapshot(), scope: "week", days: Array.from({ length: 7 }, (_, day) => ({ order: day + 1, label: `Day ${day + 1}`, exercises: Array.from({ length: 30 }, (_, n) => ({ order: n + 1, catalogId: null, name: "x".repeat(120), prescription: "y".repeat(60), notes: "z".repeat(300) })) })) };
    await expect(createShare({ requestKey: key(30), manageSecret: secret, snapshot: huge })).rejects.toMatchObject({ code: "too-large" });
    expect(store.rows.size).toBe(0);
  });

  it("keeps text as text: control characters are dropped and markup is stored as typed, never interpreted", () => {
    const parsed = parseShareSnapshot({ ...snapshot(), title: "Pull\u0007 <script>alert(1)</script>" });
    expect(parsed.ok && parsed.snapshot.title).toBe("Pull <script>alert(1)</script>");
  });

  it("reads exercises and days in their stated order, whatever order the array holds", () => {
    const shuffled = snapshot({ days: [{ ...snapshot().days[0], exercises: [...snapshot().days[0].exercises].reverse() }] });
    const parsed = parseShareSnapshot(shuffled);
    expect(parsed.ok && parsed.snapshot.days[0].exercises.map((exercise) => exercise.order)).toEqual([1, 2]);
  });

  it("turns a share off only for the device holding its secret, and then says it is off", async () => {
    const made = await createShare({ requestKey: key(4), manageSecret: secret, snapshot: snapshot() });
    await expect(disableShare(made.token, otherSecret)).rejects.toMatchObject({ code: "forbidden" });
    expect((await readShare(made.token)).state).toBe("active");
    await expect(disableShare(made.token, secret)).resolves.toEqual({ state: "disabled" });
    // Nothing of the workout is served once it is off.
    expect(await readShare(made.token)).toEqual({ state: "disabled" });
    await expect(disableShare("NoSuchTokenNoSuchToken", secret)).rejects.toMatchObject({ code: "not-found" });
  });

  it("publishes an updated version at a new link that the old link points to", async () => {
    const first = await createShare({ requestKey: key(5), manageSecret: secret, snapshot: snapshot() });
    await expect(createShare({ requestKey: key(6), manageSecret: secret, snapshot: snapshot({ title: "Pull v2" }), supersedes: { token: first.token, manageSecret: otherSecret } })).rejects.toMatchObject({ code: "forbidden" });
    const second = await createShare({ requestKey: key(7), manageSecret: secret, snapshot: snapshot({ title: "Pull v2" }), supersedes: { token: first.token, manageSecret: secret } });
    expect(second.version).toBe(2);
    expect(second.token).not.toBe(first.token);
    const old = await readShare(first.token);
    expect(old.state === "active" && old.newerToken).toBe(second.token);
    expect(old.state === "active" && old.snapshot.title).toBe("Pull · Week 1");
  });

  it("tells the holder of each secret the state of its share, and a wrong secret nothing", async () => {
    const made = await createShare({ requestKey: key(8), manageSecret: secret, snapshot: snapshot() });
    const result = await ownedShares([{ token: made.token, manageSecret: secret }, { token: made.token, manageSecret: otherSecret }, { token: "GoneTokenGoneTokenGone", manageSecret: secret }]);
    expect(result[0]).toMatchObject({ state: "active", title: "Pull · Week 1", version: 1, exerciseCount: 2, newerToken: null });
    expect(result[1]).toEqual({ token: made.token, state: "forbidden" });
    expect(result[2]).toEqual({ token: "GoneTokenGoneTokenGone", state: "missing" });
  });

  it("says a token that can't exist is missing without asking the store", async () => {
    const lookup = vi.spyOn(store, "byToken");
    expect(await readShare("../../etc/passwd")).toEqual({ state: "missing" });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("is unavailable, not pretending, where no store is configured", async () => {
    useShareStore(null);
    await expect(createShare({ requestKey: key(9), manageSecret: secret, snapshot: snapshot() })).rejects.toMatchObject({ code: "unavailable" });
    await expect(readShare("AbCdEfGhIjKlMnOpQrStUv")).rejects.toMatchObject({ code: "unavailable" });
  });
});

describe("Supabase share store", () => {
  const row: ShareRow = { token: "AbCdEfGhIjKlMnOpQrStUv", manage_hash: hashSecret(secret), request_key: key(1), schema_version: 1, scope: "day", title: "Pull", payload: snapshot(), exercise_count: 2, day_count: 1, version: 1, supersedes_token: null, status: "active", created_at: "2026-10-04T10:00:00.000Z", disabled_at: null };

  it("writes through PostgREST with the server key, and reads a duplicate request as a duplicate", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => new Response(null, { status: init?.method === "POST" ? 409 : 200 }));
    const supabase = new SupabaseShareStore("https://example.supabase.co/", "service-key", fetcher as unknown as typeof fetch);
    expect(await supabase.insert(row)).toBe("duplicate-request");
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://example.supabase.co/rest/v1/workout_shares");
    expect(new Headers(init?.headers).get("apikey")).toBe("service-key");
    expect(JSON.parse(String(init?.body))).toMatchObject({ token: row.token, manage_hash: row.manage_hash });
  });

  it("encodes what it looks up, and reports a store that is down as unavailable", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify([row]), { status: 200 }));
    const supabase = new SupabaseShareStore("https://example.supabase.co", "service-key", fetcher as unknown as typeof fetch);
    expect(await supabase.byToken(row.token)).toEqual(row);
    expect(String(fetcher.mock.calls[0][0])).toBe(`https://example.supabase.co/rest/v1/workout_shares?token=eq.${row.token}&limit=1`);
    await supabase.byRequestKey("a&b=c");
    expect(String(fetcher.mock.calls[1][0])).toContain("request_key=eq.a%26b%3Dc");
    const down = new SupabaseShareStore("https://example.supabase.co", "service-key", (async () => new Response("", { status: 503 })) as unknown as typeof fetch);
    await expect(down.byToken(row.token)).rejects.toMatchObject({ code: "unavailable" });
  });
});
