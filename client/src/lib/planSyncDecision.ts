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
