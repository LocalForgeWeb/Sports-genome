import { useEffect } from "react";
import { dismissBootSplash } from "@/lib/bootSplash";
import { bootPresentationMs, hasLaunchedBefore, rememberLaunch } from "@/lib/bootExperience";

/** This has no visual app-layer output: the screen itself exists in index.html before React loads. */
export function BootSplashLifecycle() {
  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      dismissBootSplash();
      return;
    }
    const documentStartedAt = Number(document.documentElement.dataset.sportsGenomeBootStartedAt);
    const elapsedMs = Number.isFinite(documentStartedAt) ? Math.max(0, Date.now() - documentStartedAt) : 0;
    // The full choreography introduces the product once. After that the screen holds
    // only long enough to cover the mount, so a daily athlete is not paying to watch
    // an animation they have already seen.
    const presentationMs = bootPresentationMs(hasLaunchedBefore());
    const timeout = window.setTimeout(() => {
      dismissBootSplash();
      rememberLaunch();
    }, Math.max(0, presentationMs - elapsedMs));
    return () => window.clearTimeout(timeout);
  }, []);
  return null;
}
