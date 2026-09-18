/**
 * Letting the intro finish, and handing off when it does.
 *
 * The launch screen used to be cut by two independent timers a frame apart: the
 * document script paused the video at 1680ms - mid-frame, whatever its real
 * length - and the React lifecycle lifted the whole splash at 1720ms. So the
 * intro froze, then the screen wiped. That is the "cuts off", and the freeze is
 * most of the "choppy": a paused video under a fade is two competing motions
 * where there should be one.
 *
 * A fixed duration was the wrong instrument. Nothing in the app knows how long
 * the asset is, and hard-coding a guess means every future edit to the video
 * silently gets clipped again. The video's own `ended` event is the signal, and
 * the ceiling below exists only so a stalled download cannot hold the app.
 */

/** What the document script records about the intro, read by the React side. */
export type BootVideoState = "playing" | "done" | "skipped";

export const bootVideoStateAttribute = "sportsGenomeBootVideo";
export const bootVideoDoneEvent = "sports-genome-boot-video-done";

/**
 * The longest the app will wait on the intro, measured from the end of the hold.
 *
 * Guards only against a video that stalls mid-download; the normal path ends well
 * before it. It has to clear the document's own last-resort backstop by a wide
 * margin: at 5_200 the two landed 80ms apart, so the backstop - which slams the
 * screen off with no cross-fade - could win the race and undo the point of this.
 */
export const bootVideoCeilingMs = 4_000;

/**
 * How late the intro may still start.
 *
 * A video that becomes playable at 300ms should play; one that becomes playable
 * at three seconds should not, because by then the static choreography has
 * already told the story and starting over would be the jarring thing. The old
 * gate was 360ms, which on a mid-range connection skipped the intro far more
 * often than it was meant to.
 */
export const bootVideoStartCutoffMs = 1_100;

export function canStartBootVideo(elapsedMs: number): boolean {
  return elapsedMs <= bootVideoStartCutoffMs;
}

export function readBootVideoState(root: Pick<HTMLElement, "dataset">): BootVideoState {
  const value = root.dataset[bootVideoStateAttribute];
  return value === "playing" || value === "done" || value === "skipped" ? value : "skipped";
}

/**
 * Resolves when the intro is finished, or immediately when there is none.
 *
 * Returns a cancel function rather than a bare promise so the caller can detach
 * on unmount without leaving a listener and a timer behind.
 */
export function whenBootVideoSettles(
  onSettled: () => void,
  {
    root = typeof document === "undefined" ? null : document.documentElement,
    ceilingMs = bootVideoCeilingMs,
    target = typeof window === "undefined" ? null : window,
  }: { root?: Pick<HTMLElement, "dataset"> | null; ceilingMs?: number; target?: Pick<Window, "addEventListener" | "removeEventListener" | "setTimeout" | "clearTimeout"> | null } = {}
): () => void {
  if (!root || !target) {
    onSettled();
    return () => undefined;
  }

  if (readBootVideoState(root) !== "playing") {
    onSettled();
    return () => undefined;
  }

  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    target.removeEventListener(bootVideoDoneEvent, settle);
    target.clearTimeout(timer);
    onSettled();
  };

  target.addEventListener(bootVideoDoneEvent, settle);
  const timer = target.setTimeout(settle, ceilingMs);
  return () => {
    if (done) return;
    done = true;
    target.removeEventListener(bootVideoDoneEvent, settle);
    target.clearTimeout(timer);
  };
}
