/**
 * How long the intro should hold, given whether this browser has been here before.
 *
 * The launch sequence runs at full length on every visit. That is right once - it
 * is the product introducing itself - and a tax on every morning after. A daily
 * athlete opening the app before training was paying about 1.7 seconds to watch an
 * animation they had already seen, before they could read anything.
 *
 * So the first launch keeps the full choreography, and later launches hold only long
 * enough to cover the mount and cross-fade rather than to perform. Nothing is
 * skipped or hidden: the same screen appears, for less time.
 *
 * This is the same trade the compact Home hero makes - adapt the density of the
 * introduction, never the substance of what follows.
 */

export const returningVisitStorageKey = "sports-genome-launched-before-v1";

/** Full choreography: mark forms, DNA lines settle, wordmark arrives. */
export const firstLaunchPresentationMs = 1_720;

/**
 * Long enough for the cross-fade to read as deliberate rather than as a flash, short
 * enough that nobody waits on it. Below roughly 400ms a fade reads as a glitch.
 */
export const returningLaunchPresentationMs = 620;

export function bootPresentationMs(hasLaunchedBefore: boolean): number {
  return hasLaunchedBefore ? returningLaunchPresentationMs : firstLaunchPresentationMs;
}

/**
 * Whether this browser has completed a launch before.
 *
 * Storage can throw in a private window or with site data blocked, and a first
 * launch is the safe answer there: showing the full intro to a returning athlete is
 * a worse outcome than never showing it at all.
 */
export function hasLaunchedBefore(storage?: Pick<Storage, "getItem" | "setItem">): boolean {
  const store = storage ?? safeStorage();
  if (!store) return false;
  try {
    return store.getItem(returningVisitStorageKey) === "yes";
  } catch {
    return false;
  }
}

export function rememberLaunch(storage?: Pick<Storage, "getItem" | "setItem">): void {
  const store = storage ?? safeStorage();
  if (!store) return;
  try {
    store.setItem(returningVisitStorageKey, "yes");
  } catch {
    // A browser that will not remember simply gets the full intro again.
  }
}

function safeStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
