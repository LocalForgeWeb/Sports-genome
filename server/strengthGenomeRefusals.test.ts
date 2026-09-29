import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

/**
 * Two Strength Genome writes that name something this account does not have. Each is a
 * deliberate refusal with its own code, not a server fault, and neither reaches a write.
 * The stand-in database holds no rows, so every lookup comes back empty.
 */
const db = vi.hoisted(() => {
  const empty = () => {
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = async () => [];
    return chain;
  };
  return {
    getDb: vi.fn(),
    fake: {
      select: vi.fn(empty),
      update: vi.fn(),
      insert: vi.fn(),
    },
  };
});

vi.mock("./db", () => ({ getDb: db.getDb }));

const { appRouter } = await import("./routers");

function signedInCaller() {
  const ctx: TrpcContext = {
    user: {
      id: 22,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

beforeEach(() => {
  db.getDb.mockReset();
  db.getDb.mockImplementation(async () => db.fake);
  db.fake.select.mockClear();
  db.fake.update.mockReset();
  db.fake.insert.mockReset();
});

describe("Strength Genome refusals", () => {
  it("answers a body mass for a test that is not on this account with NOT_FOUND, and writes nothing", async () => {
    const attempt = signedInCaller().strengthGenome.setObservationBodyMass({ observationId: 9, bodyMassKgAtTest: 80 });

    await expect(attempt).rejects.toMatchObject({ code: "NOT_FOUND", message: "That record is not available on this account." });
    expect(db.fake.select).toHaveBeenCalled();
    expect(db.fake.update).not.toHaveBeenCalled();
    expect(db.fake.insert).not.toHaveBeenCalled();
  });

  it("answers a priority on an unknown region with BAD_REQUEST before it reaches the database", async () => {
    const attempt = signedInCaller().strengthGenome.setPriority({ regionId: "not_a_region", active: true });

    await expect(attempt).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.getDb).not.toHaveBeenCalled();
    expect(db.fake.insert).not.toHaveBeenCalled();
  });
});
