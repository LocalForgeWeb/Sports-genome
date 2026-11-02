import { platform } from "@/lib/platform";

/**
 * Best-effort tactile acknowledgement for user-initiated mobile interactions.
 * Safari may ignore this API, so all callers must retain visible pressed states.
 */
export function emitInteractionFeedback(pattern: number | number[] = 12) {
  // Through the platform adapter, so the iOS shell can use real haptics (lib/platform.ts, A09).
  platform().haptic(pattern);
}
