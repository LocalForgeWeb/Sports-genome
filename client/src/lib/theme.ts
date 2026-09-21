/**
 * Which way the app is painted, and how that choice is remembered.
 *
 * The app already renders dark: measured from the rendered pixels at 390x844,
 * every destination is 75-86% dark. What was not dark was the chrome - the top
 * bar, the workspace tabs and the sport chips, about 151px at the top of every
 * screen - plus a handful of panels that kept a light surface on a dark ground.
 * There was a ThemeProvider, but it toggled a `.dark` class that no rule in any
 * of the twenty-six stylesheets used, so the switch it offered did nothing.
 *
 * `dark` finishes the job: the chrome and those panels go dark with the rest.
 * `light` is the appearance the app has always had - a light top bar over dark
 * workspaces - kept because light chrome is easier to read outdoors, which is
 * where a gym app gets used. It is deliberately not called a light theme: the
 * workspaces stay dark in both, and claiming otherwise would be a lie.
 */

export type ThemePreference = "system" | "dark" | "light";
export type ResolvedTheme = "dark" | "light";

export const themeStorageKey = "sports-genome-theme-v1";
export const defaultThemePreference: ThemePreference = "system";

export const themePreferences: readonly ThemePreference[] = ["system", "dark", "light"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "dark" || value === "light";
}

/** A stored value written by an older build, or by hand, is not trusted. */
export function readStoredPreference(raw: string | null): ThemePreference {
  return isThemePreference(raw) ? raw : defaultThemePreference;
}

/**
 * What a preference actually paints, given what the device asks for.
 *
 * Only `system` consults the device. An explicit choice is an instruction, so a
 * phone switching to night mode does not overrule an athlete who picked light.
 */
export function resolveTheme(preference: ThemePreference, devicePrefersDark: boolean): ResolvedTheme {
  if (preference === "system") return devicePrefersDark ? "dark" : "light";
  return preference;
}

/** How the choice is described where it is made. */
export const themeOptionCopy: Record<ThemePreference, { label: string; detail: string }> = {
  system: { label: "Match my device", detail: "Follows your phone's light or dark setting." },
  dark: { label: "Dark", detail: "Dark through the whole app, including the top bar." },
  light: { label: "Light chrome", detail: "A light top bar over the same dark workspaces. Easier to read outdoors." },
};

/**
 * Paints the document.
 *
 * Both the attribute and the class are set: the stylesheets key off
 * `data-theme`, and the `dark` class is what the Tailwind variant declared in
 * index.css is bound to, so anything written with it keeps working.
 */
export function applyTheme(root: HTMLElement, resolved: ResolvedTheme): void {
  root.dataset.theme = resolved;
  root.classList.toggle("dark", resolved === "dark");
}
