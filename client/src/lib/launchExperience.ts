export const launchExperiencePreferenceKey = "sports-genome-launch-experience-enabled-v1";

/** The document boot screen is on by default and can be disabled before React mounts. */
export function isLaunchExperienceEnabled(storedValue: string | null) {
  return storedValue !== "off";
}
