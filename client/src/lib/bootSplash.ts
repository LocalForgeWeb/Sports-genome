import { replayIntroStorageKey } from "@/lib/bootExperience";

export const bootSplashId = "sports-genome-boot-splash";

/** Matches the CSS cross-fade; the fallback below only runs if transitionend never fires. */
export const bootFadeMs = 420;

/** Ceiling on waiting for the first paint before the fade starts regardless. */
export const paintWaitFallbackMs = 80;

/**
 * Removes the document-level boot screen once React has mounted the app.
 *
 * The timing here is the whole point. This is called from an effect, and effects run
 * after React commits but *before* the browser paints. Starting the cross-fade there
 * put a full-screen compositor animation in direct contention with the heaviest
 * paint the app ever does - which is what made the hand-off stutter.
 *
 * Waiting two animation frames lets that first paint land, so the fade runs against
 * an idle main thread and the app underneath is already drawn when it becomes
 * visible. The cost is roughly 32ms; the gain is a fade that does not drop frames.
 */
export function dismissBootSplash(options: { immediate?: boolean } = {}) {
  if (typeof document === "undefined") return;
  const splash = document.getElementById(bootSplashId);
  if (!splash) return;

  const begin = () => {
    document.documentElement.classList.add("sports-genome-app-ready");

    // Remove when the fade actually finishes rather than on a timer racing it: a
    // timeout equal to the duration can clip the final frame.
    let removed = false;
    const finish = () => {
      if (removed) return;
      removed = true;
      splash.remove();
    };
    splash.addEventListener("transitionend", event => {
      if ((event as TransitionEvent).propertyName === "opacity") finish();
    });
    // A backstop for a browser that never fires the event - a background tab, or a
    // splash already hidden when the class lands.
    window.setTimeout(finish, bootFadeMs + 120);
  };

  // The error paths dismiss immediately: a splash covering a failure message is
  // worse than a fade that drops a frame, and there is no app paint to wait for.
  if (options.immediate || typeof requestAnimationFrame !== "function") {
    begin();
    return;
  }

  // Two frames is the signal that the paint landed, but frame callbacks do not run
  // in a background tab and are throttled in some headless contexts - so whichever
  // arrives first wins. In a normal foreground load that is the frames; anywhere
  // else the timer guarantees the screen still lifts.
  let started = false;
  const startOnce = () => {
    if (started) return;
    started = true;
    begin();
  };
  requestAnimationFrame(() => requestAnimationFrame(startOnce));
  window.setTimeout(startOnce, paintWaitFallbackMs);
}

/**
 * A replay deliberately reloads the document so the boot screen occurs before the
 * workspace opens - and asks, on the way out, for the intro to actually play.
 *
 * Without the flag the reload lands as a returning visit, which is the one state that
 * skips the video: the preview button reliably previewed nothing.
 */
export function replayBootSplash() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(replayIntroStorageKey, "yes");
  } catch {
    // Without storage the reload still replays the static choreography.
  }
  window.location.reload();
}
