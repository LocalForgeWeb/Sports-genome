/**
 * Best-effort tactile acknowledgement for user-initiated mobile interactions.
 * Safari may ignore this API, so all callers must retain visible pressed states.
 */
export function emitInteractionFeedback(pattern: number | number[] = 12) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration is intentionally optional; interaction remains fully functional.
  }
}
