import { useEffect } from "react";
import { dismissBootSplash } from "@/lib/bootSplash";
import { bootPresentationMs, hasLaunchedBefore, isIntroReplay, rememberLaunch } from "@/lib/bootExperience";
import { whenBootVideoSettles } from "@/lib/bootVideoHandoff";

/** This has no visual app-layer output: the screen itself exists in index.html before React loads. */
export function BootSplashLifecycle() {
  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // Nothing is animating, so there is no paint to wait for.
      dismissBootSplash({ immediate: true });
      return;
    }

    let cancelVideoWait: (() => void) | null = null;
    const finish = () => {
      dismissBootSplash();
      rememberLaunch();
    };

    const documentStartedAt = Number(document.documentElement.dataset.sportsGenomeBootStartedAt);
    const elapsedMs = Number.isFinite(documentStartedAt) ? Math.max(0, Date.now() - documentStartedAt) : 0;
    // The minimum hold. A returning athlete gets only enough to cover the mount;
    // a first launch gets the full choreography. Either way this is a floor now,
    // not a deadline - it used to fire at 1720ms and wipe the intro mid-frame.
    // A replay is asking for the introduction, not for the returning athlete's shortcut.
    const presentationMs = bootPresentationMs(hasLaunchedBefore() && !isIntroReplay());
    const timeout = window.setTimeout(() => {
      // Whichever runs longer wins: the hold, or the intro playing out. Waiting on
      // the video's own end is what stops it being cut at an arbitrary moment.
      cancelVideoWait = whenBootVideoSettles(finish);
    }, Math.max(0, presentationMs - elapsedMs));

    return () => {
      window.clearTimeout(timeout);
      cancelVideoWait?.();
    };
  }, []);
  return null;
}
