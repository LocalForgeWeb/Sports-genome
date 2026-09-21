// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { replayIntroStorageKey } from "@/lib/bootExperience";

/**
 * "I tried clicking the preview video 2 times and the whole app glitched."
 *
 * A reload takes a moment to commit and the button stays under the finger for
 * all of it, so the second tap called `reload()` again on a document that was
 * already unloading - two navigations racing over one page.
 */
describe("replayBootSplash", () => {
  let reloads: number;

  beforeEach(async () => {
    vi.resetModules();
    reloads = 0;
    // `location.reload` is a platform-object property and resists redefinition
    // in a real browser, so the whole `location` is replaced here instead.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: () => { reloads += 1; } },
    });
    localStorage.clear();
  });

  afterEach(() => { localStorage.clear(); });

  it("reloads once however many times it is called", async () => {
    const { replayBootSplash, bootSplashReplayRequested } = await import("@/lib/bootSplash");
    expect(bootSplashReplayRequested()).toBe(false);

    replayBootSplash();
    replayBootSplash();
    replayBootSplash();

    expect(reloads).toBe(1);
    expect(bootSplashReplayRequested()).toBe(true);
  });

  it("still asks for the intro to actually play", async () => {
    // Without the flag the reload lands as a returning visit, which is the one
    // state that skips the video: the button previewed nothing.
    const { replayBootSplash } = await import("@/lib/bootSplash");
    replayBootSplash();
    expect(localStorage.getItem(replayIntroStorageKey)).toBe("yes");
  });

  it("reloads even when storage refuses, and still only once", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { replayBootSplash } = await import("@/lib/bootSplash");

    replayBootSplash();
    replayBootSplash();

    // A browser with site data blocked still gets the static choreography.
    expect(reloads).toBe(1);
    setItem.mockRestore();
  });

  it("starts each document fresh, because the guard dies with the page", async () => {
    const first = await import("@/lib/bootSplash");
    first.replayBootSplash();
    expect(reloads).toBe(1);

    // A new document is a new module instance: the athlete can replay again.
    vi.resetModules();
    const second = await import("@/lib/bootSplash");
    expect(second.bootSplashReplayRequested()).toBe(false);
    second.replayBootSplash();
    expect(reloads).toBe(2);
  });
});
