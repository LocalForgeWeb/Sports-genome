import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";
import { getPlatform, isNativePlatform } from "./platform";

/**
 * Native chrome setup, run once at startup before the first render.
 *
 * Every call is individually guarded: these plugins are unavailable on web, and
 * a rejected promise here would take the whole bootstrap down with it.
 */
export async function initNativeShell(): Promise<void> {
  if (!isNativePlatform()) return;

  // Gate for `native-shell.css`. Set before the first render so safe-area
  // padding is in place on the first paint rather than after a visible shift.
  document.documentElement.classList.add(
    "is-native",
    `platform-${getPlatform()}`
  );

  // `Style.Light` means light background / dark content — matching the app's
  // default light theme (see ThemeProvider in App.tsx). If the theme is ever
  // made switchable, this needs to follow it.
  await StatusBar.setStyle({ style: Style.Light }).catch(() => {});

  // Resize the webview rather than the body when the keyboard appears, so
  // position:fixed chrome (the training card action bar) stays put.
  await Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
  await Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});
}

/**
 * Haptic feedback. No-ops on web, so callers never need to branch.
 *
 * Used for the moments where a phone in a gym is being tapped without being
 * looked at closely — completing a set, finishing a session.
 */
export const haptics = {
  /** A logged set — the most common confirmation in the app. */
  async tap(): Promise<void> {
    if (!isNativePlatform()) return;
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  },
  /** A completed session or other meaningful milestone. */
  async success(): Promise<void> {
    if (!isNativePlatform()) return;
    await Haptics.notification({ type: NotificationType.Success }).catch(
      () => {}
    );
  },
  /** A rejected action. */
  async warn(): Promise<void> {
    if (!isNativePlatform()) return;
    await Haptics.notification({ type: NotificationType.Warning }).catch(
      () => {}
    );
  },
};
