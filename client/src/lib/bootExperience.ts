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

/**
 * A one-shot request to watch the intro again.
 *
 * "Preview intro video" reloaded the page and nothing played, because a reload of a
 * browser that has launched before is by definition a returning visit - the one state
 * in which the intro is deliberately skipped. The button existed to replay something
 * it had just guaranteed would not run. This flag is set before the reload and cleared
 * by the document script that reads it, so the replay happens exactly once.
 */
export const replayIntroStorageKey = "sports-genome-replay-intro-v1";

/** Set by the document script when this load is an explicit replay. */
export function isIntroReplay(root?: Pick<HTMLElement, "dataset">): boolean {
  const element = root ?? (typeof document === "undefined" ? null : document.documentElement);
  return element?.dataset.sportsGenomeBootReplay === "yes";
}

/** Full choreography: mark forms, DNA lines settle, wordmark arrives. */
export const firstLaunchPresentationMs = 1_720;

/**
 * When the choreography began - which is when its artwork could first be drawn,
 * not when the document started.
 *
 * Those are the same instant only on a warm cache. Measured against a 1.2s asset
 * delay, the mark's 500ms entrance had run to completion before the PNG existed,
 * and the image then appeared at full opacity with no animation left to play; at
 * 2.5s the splash lifted at 2466ms having never shown the mark at all. The
 * document script starts the sequence when both images have decoded and stamps
 * the moment here, so the hold below covers the animation that actually ran.
 *
 * Falling back to the document's own start keeps every path working if the stamp
 * is missing - a browser with no `decode`, or the ceiling firing first.
 */
/** Announced by the document script the moment the sequence may begin. */
export const bootArtReadyEvent = "sports-genome-boot-art-ready";

/**
 * How long the document script waits on a stalled asset before starting anyway.
 * Mirrored here so the React side cannot outlive it if that script never ran.
 */
export const bootArtCeilingMs = 2_500;

/**
 * Runs `onReady` when the choreography may begin, or at once if it already has.
 *
 * Sampling `bootChoreographyStartedAt` once at mount was not enough. React can
 * mount well before the artwork arrives - measured with a 2.5s asset delay, the
 * effect ran at around 800ms, read no stamp, fell back to the document's own
 * start and lifted the splash at 2466ms, before the mark had ever been drawn.
 * The hold has to start when the sequence does, so it waits for the signal.
 *
 * Returns a cancel function, so an unmount leaves no listener or timer behind.
 */
export function whenBootArtReady(
  onReady: () => void,
  {
    root = typeof document === "undefined" ? null : document.documentElement,
    target = typeof window === "undefined" ? null : window,
    ceilingMs = bootArtCeilingMs,
  }: {
    root?: Pick<HTMLElement, "dataset"> | null;
    target?: Pick<Window, "addEventListener" | "removeEventListener" | "setTimeout" | "clearTimeout"> | null;
    ceilingMs?: number;
  } = {}
): () => void {
  if (!root || !target || root.dataset.sportsGenomeBootArtAt) {
    onReady();
    return () => undefined;
  }

  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    target.removeEventListener(bootArtReadyEvent, settle);
    target.clearTimeout(timer);
    onReady();
  };
  target.addEventListener(bootArtReadyEvent, settle);
  // Its own backstop, for a document script that threw before it could listen.
  const timer = target.setTimeout(settle, ceilingMs);
  return () => {
    if (done) return;
    done = true;
    target.removeEventListener(bootArtReadyEvent, settle);
    target.clearTimeout(timer);
  };
}

export function bootChoreographyStartedAt(root?: Pick<HTMLElement, "dataset">): number | null {
  const element = root ?? (typeof document === "undefined" ? null : document.documentElement);
  if (!element) return null;
  const art = Number(element.dataset.sportsGenomeBootArtAt);
  if (Number.isFinite(art) && art > 0) return art;
  const started = Number(element.dataset.sportsGenomeBootStartedAt);
  return Number.isFinite(started) && started > 0 ? started : null;
}

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
