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
 *
 * That was the intent; the first attempt did not carry it out. It replaced one
 * fixed duration with another - a flat 4-second ceiling applied whether the video
 * was stalled or playing perfectly - so a six-second intro was still cut, at 4.41s.
 * The fix is to stop asking "how long has it been?" and ask "is it still going?".
 */

/** What the document script records about the intro, read by the React side. */
export type BootVideoState = "playing" | "done" | "skipped";

export const bootVideoStateAttribute = "sportsGenomeBootVideo";
export const bootVideoDoneEvent = "sports-genome-boot-video-done";

/**
 * Two different failures were being guarded by one number, and that is what clipped
 * the intro.
 *
 * A single 4-second cap covered both "the download never started" and "the video is
 * playing" - so a six-second intro that was running perfectly well got cut at 4.41s,
 * two thirds of the way through, and the splash wiped mid-frame. The cases need
 * different answers: an intro that never starts should be abandoned quickly, and an
 * intro that IS playing should be left alone until it ends.
 */

/** Abandon an intro that has not begun playing by now. This is the old cap, kept for the case it was right for. */
export const bootVideoStartCeilingMs = 4_000;

/** An explicit replay is worth waiting longer for: the athlete asked to watch it. */
export const bootVideoReplayStartCeilingMs = 8_000;

/**
 * Once it is playing, the only thing that cuts it short is a download that stops
 * progressing. Chosen to be longer than a decode hiccup and shorter than a viewer's
 * patience with a frozen frame.
 */
export const bootVideoStallMs = 1_500;

/** Grace past a known duration, for the gap between the last frame and the `ended` event. */
export const bootVideoOverrunMarginMs = 2_000;

/**
 * Absolute last resort, only reachable by a video whose time keeps advancing - which
 * is to say, one that is genuinely still playing. Long enough for any plausible brand
 * intro, so it can no longer be the thing that decides when the intro ends.
 */
export const bootVideoHardCeilingMs = 15_000;

/** The longest the app will wait on the intro before handing off regardless. */
export const bootVideoCeilingMs = bootVideoHardCeilingMs;

/**
 * The document's own last-resort backstop, for a React that never arrives. It reveals
 * the app with no cross-fade.
 *
 * It keeps its nine seconds rather than being stretched past the intro's ceiling:
 * extending it would make every genuine startup failure a longer blank stare. Instead
 * it re-checks while the intro's clock is advancing, so it can never be the thing that
 * cuts a playing video, and never waits on one that has stopped.
 */
export const bootDocumentBackstopMs = 9_000;

/** How often the backstop looks again while the intro is still running. */
export const bootDocumentBackstopRecheckMs = 1_000;

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

export function canStartBootVideo(elapsedMs: number, { replay = false }: { replay?: boolean } = {}): boolean {
  // A replay is a deliberate request to watch it, so "you asked too late" does not apply.
  return replay || elapsedMs <= bootVideoStartCutoffMs;
}

export type IntroSettleReason = "ended" | "stalled" | "overran" | "never-started";

/**
 * Whether the intro is finished with, and why - or `null` to keep waiting.
 *
 * This is the whole timing policy in one place so it can be reasoned about and tested
 * directly, rather than inferred from three timers in three files.
 */
export function introSettleReason(state: {
  ended: boolean;
  playing: boolean;
  msSinceProgress: number;
  msSinceStart: number;
  durationMs: number | null;
  replay?: boolean;
}): IntroSettleReason | null {
  if (state.ended) return "ended";
  if (!state.playing) {
    const ceiling = state.replay ? bootVideoReplayStartCeilingMs : bootVideoStartCeilingMs;
    return state.msSinceStart > ceiling ? "never-started" : null;
  }
  if (state.msSinceProgress > bootVideoStallMs) return "stalled";
  if (state.durationMs !== null && state.msSinceStart > state.durationMs + bootVideoOverrunMarginMs) return "overran";
  if (state.msSinceStart > bootVideoHardCeilingMs) return "overran";
  return null;
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
