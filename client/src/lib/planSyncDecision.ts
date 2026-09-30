/**
 * Which plan an athlete should see when the device and the account disagree.
 *
 * Both copies exist for good reasons. The device copy is what they built last,
 * possibly offline. The account copy is what another device saved. Picking wrongly
 * in either direction silently deletes real work, so the choice is made here, in one
 * pure function, rather than inside an effect.
 */

export type PlanCandidate = {
  /** The serialised plan, or null when this side has nothing. */
  planJson: string | null;
  /** When this copy was last written, if known. */
  updatedAt: Date | null;
};

export type PlanChoice =
  | { use: "server"; reason: "only-copy" | "newer" }
  | { use: "device"; reason: "only-copy" | "newer" | "same" }
  | { use: "neither" };

/**
 * A device write within this window of the server's is treated as the same edit
 * arriving twice rather than as a genuine conflict - the device just saved what it
 * then pushed, and clocks between a phone and a server are never exactly aligned.
 */
export const sameEditToleranceMs = 5_000;

export function choosePlan(device: PlanCandidate, server: PlanCandidate): PlanChoice {
  const hasDevice = Boolean(device.planJson);
  const hasServer = Boolean(server.planJson);

  if (!hasDevice && !hasServer) return { use: "neither" };
  if (!hasDevice) return { use: "server", reason: "only-copy" };
  if (!hasServer) return { use: "device", reason: "only-copy" };

  // Identical content is not a conflict, whatever the timestamps say.
  if (device.planJson === server.planJson) return { use: "device", reason: "same" };

  const deviceAt = device.updatedAt?.getTime() ?? null;
  const serverAt = server.updatedAt?.getTime() ?? null;

  // An unknown timestamp cannot win a comparison: preferring the copy that can
  // prove when it was written is the safer of two bad options.
  if (deviceAt === null && serverAt === null) return { use: "device", reason: "same" };
  if (deviceAt === null) return { use: "server", reason: "newer" };
  if (serverAt === null) return { use: "device", reason: "newer" };

  if (Math.abs(deviceAt - serverAt) <= sameEditToleranceMs) return { use: "device", reason: "same" };
  return deviceAt > serverAt ? { use: "device", reason: "newer" } : { use: "server", reason: "newer" };
}

/**
 * The device's own record of its last agreement with the account: the revision it last
 * synced from, and a fingerprint of the plan as it was then. Without it the device could
 * not tell "I changed" from "the account changed", and every difference was settled by
 * timestamps the device never kept - the account's copy always won (PS-04, SV-04).
 */
export type PlanSyncBase = { revision: number | null; syncedHash: string | null };

export type Reconciliation =
  | { use: "neither" }
  | { use: "same" }
  | { use: "device"; reason: "only-copy" | "account-unchanged" }
  | { use: "server"; reason: "only-copy" | "device-unchanged" }
  | { use: "conflict" };

/** A short, stable fingerprint of a plan document (FNV-1a, 32-bit). */
export function planFingerprint(planJson: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < planJson.length; index += 1) {
    hash ^= planJson.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * A three-way decision between this device, the account, and the point they last agreed.
 *
 * - Only one side has a plan: that one.
 * - Same content: nothing to do.
 * - The account has not moved since this device last synced: this device's edits win.
 * - This device has not changed since it last synced: the account's copy wins.
 * - Both changed, or this device has no record of ever agreeing: a conflict, for the athlete
 *   to settle. Neither copy is replaced without asking.
 */
export function reconcilePlans(device: { planJson: string | null }, server: { planJson: string | null; revision: number | null }, base: PlanSyncBase | null): Reconciliation {
  const hasDevice = Boolean(device.planJson);
  const hasServer = Boolean(server.planJson);
  if (!hasDevice && !hasServer) return { use: "neither" };
  if (!hasDevice) return { use: "server", reason: "only-copy" };
  if (!hasServer) return { use: "device", reason: "only-copy" };
  if (device.planJson === server.planJson) return { use: "same" };
  if (!base || base.revision === null) return { use: "conflict" };
  const deviceChanged = base.syncedHash !== planFingerprint(device.planJson!);
  const accountChanged = server.revision !== base.revision;
  if (!accountChanged) return { use: "device", reason: "account-unchanged" };
  if (!deviceChanged) return { use: "server", reason: "device-unchanged" };
  return { use: "conflict" };
}
