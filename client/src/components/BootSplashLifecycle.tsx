import { useEffect } from "react";
import { dismissBootSplash, minimumBootPresentationMs } from "@/lib/bootSplash";

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
    const timeout = window.setTimeout(() => dismissBootSplash(), Math.max(0, minimumBootPresentationMs - elapsedMs));
    return () => window.clearTimeout(timeout);
  }, []);
  return null;
}
