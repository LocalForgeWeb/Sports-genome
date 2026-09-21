// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  applyTheme,
  defaultThemePreference,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  themeOptionCopy,
  themePreferences,
} from "@/lib/theme";

describe("which way the app is painted", () => {
  it("follows the device only when asked to", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    // An explicit choice is an instruction: a phone crossing into night mode
    // does not overrule an athlete who picked one.
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("opens on the device's setting until a choice is made", () => {
    expect(defaultThemePreference).toBe("system");
    expect(themePreferences).toEqual(["system", "dark", "light"]);
  });

  it("does not trust what it reads back from storage", () => {
    expect(readStoredPreference("dark")).toBe("dark");
    expect(readStoredPreference(null)).toBe("system");
    expect(readStoredPreference("")).toBe("system");
    expect(readStoredPreference("DARK")).toBe("system");
    expect(readStoredPreference("midnight")).toBe("system");
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference(undefined)).toBe(false);
  });

  it("paints with both the attribute the stylesheets use and the class the Tailwind variant is bound to", () => {
    const root = document.createElement("html");
    applyTheme(root, "dark");
    expect(root.dataset.theme).toBe("dark");
    expect(root.classList.contains("dark")).toBe(true);
    applyTheme(root, "light");
    expect(root.dataset.theme).toBe("light");
    expect(root.classList.contains("dark")).toBe(false);
  });

  it("does not describe the light choice as a light app, because it is not one", () => {
    // Measured from rendered pixels: every workspace is dark in both settings.
    // Only the chrome changes, so the copy says chrome.
    expect(themeOptionCopy.light.label).toBe("Light chrome");
    expect(themeOptionCopy.light.detail).toContain("same dark workspaces");
    expect(themeOptionCopy.dark.detail).toContain("top bar");
  });

  it("is applied before the first frame, by the document itself", () => {
    // Resolving only in React shows the default chrome for a beat and repaints
    // it - the flash every theme switch is judged by. The inline script has to
    // agree with resolveTheme(), so both are checked here.
    const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
    expect(html).toContain('localStorage.getItem("sports-genome-theme-v1")');
    expect(html).toContain('prefers-color-scheme: dark');
    expect(html).toContain('document.documentElement.dataset.theme=t');
    // And it falls back rather than leaving the document unthemed.
    expect(html).toContain('catch(e){document.documentElement.dataset.theme="light"}');
  });
});
