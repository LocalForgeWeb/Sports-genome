/**
 * Per-account scoping for device storage.
 *
 * The workout plan, athlete profile and favourites were all stored under fixed keys
 * ("gym-optimizer-workout-plan-v1" and friends). On a shared device - a gym tablet,
 * a coach and an athlete on one laptop, or simply one person with two accounts -
 * every one of them read and overwrote the same record. Signing in as someone else
 * showed you their stack, and building your own replaced theirs.
 *
 * Keys are now namespaced by account. A signed-out or direct-access session keeps
 * the shared namespace, because that is the only sensible home for work done before
 * anyone is identified.
 */

/** What the plan was stored under before any of this existed. */
export function legacyKey(base: string): string {
  return base;
}

/**
 * The key this account reads and writes. Undefined identity keeps the shared key, so
 * nothing written before sign-in becomes unreachable.
 */
export function scopedKey(base: string, accountId?: string | number | null): string {
  if (accountId === null || accountId === undefined || accountId === "") return base;
  return `${base}::${accountId}`;
}

/**
 * Moves a pre-namespace record into the first account that signs in on this device.
 *
 * Without this, shipping the namespace would look exactly like data loss: the plan
 * is still on the device, under a key nothing reads any more. It runs once - a
 * scoped record already present is never overwritten, so a second account cannot
 * inherit the first one's stack.
 */
export function migrateLegacyRecord(
  base: string,
  accountId: string | number | null | undefined,
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">
): "migrated" | "kept" | "nothing-to-move" {
  if (accountId === null || accountId === undefined || accountId === "") return "nothing-to-move";
  const target = scopedKey(base, accountId);
  try {
    if (storage.getItem(target) !== null) return "kept";
    const legacy = storage.getItem(legacyKey(base));
    if (legacy === null) return "nothing-to-move";
    storage.setItem(target, legacy);
    // Claimed, so it is removed. Leaving it would let the next account to sign in
    // claim the same record - which is the cross-account leak this exists to close.
    storage.removeItem(legacyKey(base));
    return "migrated";
  } catch {
    return "nothing-to-move";
  }
}

/**
 * Reads an account's record, claiming any pre-namespace copy first.
 *
 * Migration has to happen before the read, not alongside it. Running it in a
 * separate effect meant hydration could read the scoped key before the legacy record
 * had moved - which showed an existing athlete the onboarding quiz and an empty
 * plan, as though their data were gone. Doing both here makes that ordering
 * impossible to get wrong.
 */
export function readScopedRecord(
  base: string,
  accountId: string | number | null | undefined,
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">
): string | null {
  migrateLegacyRecord(base, accountId, storage);
  try {
    return storage.getItem(scopedKey(base, accountId));
  } catch {
    return null;
  }
}
