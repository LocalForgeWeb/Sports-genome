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
    const timeout = window.setTimeout(() => dismissBootSplash(), minimumBootPresentationMs);
    return () => window.clearTimeout(timeout);
  }, []);
  return null;
}
