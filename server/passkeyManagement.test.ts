import { describe, expect, it, vi } from "vitest";

const whereDelete = vi.fn(async () => undefined);
const rows = [{ id: 7, credentialId: "credential-ending-abc123", createdAt: new Date("2026-01-01T00:00:00Z"), lastUsedAt: null }];

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({ from: () => ({ where: async () => rows }) }),
    delete: () => ({ where: whereDelete }),
  })),
}));

import { listAccountPasskeys, removeAccountPasskey } from "./localAuth";

describe("account passkey management", () => {
  it("returns a privacy-safe enrolled device label without exposing credential material", async () => {
    const passkeys = await listAccountPasskeys(12);
    expect(passkeys).toEqual([{ id: 7, label: "Device ending abc123", createdAt: rows[0].createdAt, lastUsedAt: null }]);
    expect(JSON.stringify(passkeys)).not.toContain("credential-ending");
  });

  it("removes a selected credential through a user-scoped deletion path", async () => {
    await expect(removeAccountPasskey(12, 7)).resolves.toEqual({ ok: true });
    expect(whereDelete).toHaveBeenCalledTimes(1);
  });
});
