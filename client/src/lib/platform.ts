import { Capacitor } from "@capacitor/core";

/**
 * Runtime host detection. Every native-only branch in the client funnels
 * through here so the web build keeps its existing behaviour untouched: on web
 * `Capacitor.isNativePlatform()` is a plain `false` and nothing else changes.
 *
 * These are wrapped in try/catch because they also run during SSR-less test
 * environments (vitest/jsdom) where the Capacitor global may not be installed.
 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getPlatform(): "ios" | "android" | "web" {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "ios" || platform === "android") return platform;
  } catch {
    // fall through to web
  }
  return "web";
}

export const isIOS = (): boolean => getPlatform() === "ios";
