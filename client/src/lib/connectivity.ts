import { Network } from "@capacitor/network";
import { isNativePlatform } from "./platform";

/**
 * Connectivity, used to decide when to flush the pending-write outbox.
 *
 * Native goes through `@capacitor/network`, which reflects the real radio state.
 * Web falls back to `navigator.onLine`, which is weaker — it reports "online"
 * for a connected interface with no working route — so it is treated as a hint
 * that flushing is worth attempting, never as a guarantee. A flush that fails
 * simply leaves the entries queued.
 */
let nativeOnline = true;

export function isOnline(): boolean {
  if (isNativePlatform()) return nativeOnline;
  try {
    return navigator.onLine;
  } catch {
    return true;
  }
}

/**
 * Subscribe to connectivity changes. `onOnline` fires on each offline→online
 * transition. Returns an unsubscribe function.
 */
export function onConnectivityRestored(onOnline: () => void): () => void {
  if (isNativePlatform()) {
    const handle = Network.addListener("networkStatusChange", status => {
      const wasOffline = !nativeOnline;
      nativeOnline = status.connected;
      if (wasOffline && status.connected) onOnline();
    });

    // Seed the cached value; until this resolves we optimistically assume online
    // so a flush is attempted rather than skipped.
    void Network.getStatus().then(status => {
      nativeOnline = status.connected;
    });

    return () => {
      void handle.then(listener => listener.remove());
    };
  }

  const handler = () => onOnline();
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
