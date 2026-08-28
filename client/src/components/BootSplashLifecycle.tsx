import { useEffect } from "react";
import { dismissBootSplash } from "@/lib/bootSplash";

/** This has no visual app-layer output: the screen itself exists in index.html before React loads. */
export function BootSplashLifecycle() {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => dismissBootSplash());
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return null;
}
