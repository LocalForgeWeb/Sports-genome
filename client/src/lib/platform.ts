/**
 * The device capabilities the app uses, behind one seam (iOS readiness audit, A09).
 *
 * Haptics, the share sheet, saving a file and printing were called straight on the browser
 * (`navigator.vibrate`, `navigator.share`, an `<a download>`, `window.print`) from wherever they
 * were needed. In a native iOS shell each of those has a different, better implementation:
 * real haptics where Safari has none, the system share sheet for files, the Files app for a
 * saved backup, AirPrint. The native shell registers those here once, with
 * `setPlatformAdapter`, and nothing else in the app changes.
 *
 * The web implementation below is the app's behaviour today, unchanged. Each call reads the
 * browser at call time, so a page without a capability (Safari has no vibration; most desktops
 * cannot share files) degrades to doing nothing or to the fallback the caller already offers.
 */

export type PlatformShareResult = "shared" | "cancelled" | "failed";

export type PlatformAdapter = {
  /** "web" in a browser; the native shell says "native". */
  kind: "web" | "native";
  /** A short tactile acknowledgement. Optional everywhere: every caller keeps a visible pressed state. */
  haptic(pattern?: number | number[]): void;
  /** Whether the system share sheet can take this. */
  canShare(data?: ShareData): boolean;
  share(data: ShareData): Promise<PlatformShareResult>;
  /** Hands a file to the person: a download in a browser, the Files app or share sheet natively. */
  saveFile(file: File): "saved" | "failed";
  print(): void;
};

type ShareCapableNavigator = Navigator & { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };
const browserNavigator = (): ShareCapableNavigator | undefined => (typeof navigator === "undefined" ? undefined : (navigator as ShareCapableNavigator | undefined) ?? undefined);

export const webPlatform: PlatformAdapter = {
  kind: "web",
  haptic(pattern = 12) {
    const nav = browserNavigator();
    if (!nav || typeof nav.vibrate !== "function") return;
    try {
      nav.vibrate(pattern);
    } catch {
      // Vibration is optional; the interaction works without it.
    }
  },
  canShare(data) {
    const nav = browserNavigator();
    if (!nav || typeof nav.share !== "function") return false;
    if (!data?.files) return true;
    try { return Boolean(nav.canShare?.(data)); } catch { return false; }
  },
  async share(data) {
    const nav = browserNavigator();
    if (!nav || typeof nav.share !== "function") return "failed";
    try {
      await nav.share(data);
      return "shared";
    } catch (error) {
      // Closing the share sheet is a choice, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      return "failed";
    }
  },
  saveFile(file) {
    if (typeof document === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return "failed";
    try {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Long enough for the download to start everywhere.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return "saved";
    } catch {
      return "failed";
    }
  },
  print() {
    if (typeof window !== "undefined" && typeof window.print === "function") window.print();
  },
};

let current: PlatformAdapter = webPlatform;

/** The adapter in use. */
export function platform(): PlatformAdapter {
  return current;
}

/**
 * Called once by the native shell at start-up. Anything it does not provide keeps the web
 * behaviour, so a shell can adopt capabilities one at a time.
 */
export function setPlatformAdapter(adapter: Partial<Omit<PlatformAdapter, "kind">> & { kind: PlatformAdapter["kind"] }) {
  current = { ...webPlatform, ...adapter };
}

/** For tests. */
export function resetPlatformAdapter() {
  current = webPlatform;
}
