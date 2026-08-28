export const launchExperiencePreferenceKey = "sports-genome-launch-experience-enabled-v1";
export const launchExperienceSeenKey = "sports-genome-launch-experience-seen-v1";

/** The launch screen is opt-in by default and only runs once until manually replayed. */
export function isLaunchExperienceEnabled(storedValue: string | null) {
  return storedValue !== "off";
}

export function shouldShowLaunchExperience(enabled: boolean, hasBeenSeen: boolean, prefersReducedMotion = false) {
  return enabled && !hasBeenSeen && !prefersReducedMotion;
}
