import { useEffect, useState } from "react";

/**
 * How much of the layout viewport the on-screen keyboard covers, in CSS pixels.
 *
 * iOS Safari does not shrink the layout viewport (or `dvh`) when the keyboard
 * opens: it lays the keyboard over the bottom of the page, so a sheet anchored
 * to the bottom keeps its footer and its last results under the keys. The
 * visual viewport does shrink, and the difference between the two is the
 * keyboard. A sheet can pad itself by this amount while a field inside it has
 * focus, and drops back to its full height the moment the keyboard closes.
 */
export function keyboardInsetFrom(layoutHeight: number, viewport: { height: number; offsetTop: number } | null | undefined): number {
  if (!viewport) return 0;
  const inset = Math.round(layoutHeight - viewport.height - viewport.offsetTop);
  // Below ~80px it is browser chrome settling (the URL bar), not a keyboard.
  return inset > 80 ? inset : 0;
}

export function useKeyboardInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.visualViewport) { setInset(0); return; }
    const viewport = window.visualViewport;
    const update = () => setInset(keyboardInsetFrom(window.innerHeight, viewport));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => { viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); setInset(0); };
  }, [enabled]);
  return inset;
}
