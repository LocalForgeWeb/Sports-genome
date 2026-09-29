import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ createStrengthObservation: vi.fn() }));

// The resolver is stood in for so an in-range date can be shown to pass the
// input check without a database; the out-of-range cases never reach it.
vi.mock("./strengthGenome", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./strengthGenome")>()),
  createStrengthObservation: mocks.createStrengthObservation,
}));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

const lift = (observedAt: Date) => ({
  exerciseName: "Back Squat",
  observedAt,
  measurementType: "MEASURED_1RM" as const,
  loadKg: 100,
  measuredOneRmKg: 100,
});

describe("strengthGenome.addObservation lift date", () => {
  beforeEach(() => {
    mocks.createStrengthObservation.mockReset();
    mocks.createStrengthObservation.mockResolvedValue({ id: 1 });
  });

  it.each([
    ["a typo year before 1970", new Date("0202-01-01T12:00:00")],
    ["a year past what the record can hold", new Date("2100-01-01T12:00:00")],
    ["a date days ahead", new Date(Date.now() + 5 * 86_400_000)],
  ])("refuses %s as a bad request, before anything is written", async (_label, observedAt) => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.strengthGenome.addObservation(lift(observedAt))).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.createStrengthObservation).not.toHaveBeenCalled();
  });

  it("accepts today's lift", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await caller.strengthGenome.addObservation(lift(new Date()));
    expect(mocks.createStrengthObservation).toHaveBeenCalledTimes(1);
  });
});
