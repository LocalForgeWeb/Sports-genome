export const bootSplashId = "sports-genome-boot-splash";
export const minimumBootPresentationMs = 3_200;

/** Removes the document-level boot screen only after React has mounted the app. */
export function dismissBootSplash() {
  if (typeof document === "undefined") return;
  const splash = document.getElementById(bootSplashId);
  if (!splash) return;
  document.documentElement.classList.add("sports-genome-app-ready");
  window.setTimeout(() => splash.remove(), 560);
}

/** A replay deliberately reloads the document so the boot screen occurs before the workspace opens. */
export function replayBootSplash() {
  if (typeof window === "undefined") return;
  window.location.reload();
}
