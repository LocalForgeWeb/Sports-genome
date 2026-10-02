import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  defaultThemePreference,
  readStoredPreference,
  resolveTheme,
  themeStorageKey,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeContextType {
  /** What the athlete chose. */
  preference: ThemePreference;
  /** What that choice paints right now. */
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const darkQuery = "(prefers-color-scheme: dark)";

function devicePrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(darkQuery).matches;
}

function storedPreference(): ThemePreference {
  if (typeof window === "undefined") return defaultThemePreference;
  // Private mode and blocked site data both throw rather than return null.
  try {
    return readStoredPreference(window.localStorage.getItem(themeStorageKey));
  } catch {
    return defaultThemePreference;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(storedPreference);
  const [deviceDark, setDeviceDark] = useState<boolean>(devicePrefersDark);

  // The device can change its mind while the app is open - a phone crossing into
  // its night schedule - and a "match my device" choice has to follow it.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(darkQuery);
    const onChange = (event: MediaQueryListEvent) => setDeviceDark(event.matches);
    query.addEventListener("change", onChange);
    setDeviceDark(query.matches);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme = resolveTheme(preference, deviceDark);

  useEffect(() => {
    if (typeof document === "undefined") return;
    applyTheme(document.documentElement, theme);
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(themeStorageKey, next);
    } catch {
      // A choice that cannot be written still applies for this visit.
    }
  }, []);

  const value = useMemo(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
