import { describe, expect, it, vi } from "vitest";
import {
  bootVideoCeilingMs,
  bootVideoDoneEvent,
  bootVideoStartCutoffMs,
  canStartBootVideo,
  readBootVideoState,
  whenBootVideoSettles,
} from "@/lib/bootVideoHandoff";
import { firstLaunchPresentationMs } from "@/lib/bootExperience";
import { bootFadeMs } from "@/lib/bootSplash";

const rootWith = (value?: string) => ({ dataset: value === undefined ? {} : { sportsGenomeBootVideo: value } } as unknown as HTMLElement);

/** A window stand-in that lets a test fire the event and run the ceiling by hand. */
function fakeWindow() {
  const listeners = new Map<string, Set<() => void>>();
  const timers = new Map<number, () => void>();
  let nextTimer = 1;
  return {
    addEventListener: (type: string, handler: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(handler);
    },
    removeEventListener: (type: string, handler: () => void) => listeners.get(type)?.delete(handler),
    setTimeout: ((handler: () => void) => {
      const id = nextTimer++;
      timers.set(id, handler);
      return id;
    }) as unknown as Window["setTimeout"],
    clearTimeout: ((id: number) => void timers.delete(id)) as unknown as Window["clearTimeout"],
    fire: (type: string) => listeners.get(type)?.forEach((handler) => handler()),
    runTimers: () => Array.from(timers.values()).forEach((handler) => handler()),
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    timerCount: () => timers.size,
  };
}

describe("canStartBootVideo", () => {
  it("starts an intro that is ready promptly", () => {
    expect(canStartBootVideo(0)).toBe(true);
    expect(canStartBootVideo(300)).toBe(true);
  });

  it("is more forgiving than the 360ms gate that skipped the intro on a normal connection", () => {
    expect(bootVideoStartCutoffMs).toBeGreaterThan(360);
    expect(canStartBootVideo(900)).toBe(true);
  });

  it("refuses to start once the static choreography has told the story", () => {
    // Beginning the video three seconds in is the jarring thing, not skipping it.
    expect(canStartBootVideo(3_000)).toBe(false);
  });
});

describe("readBootVideoState", () => {
  it("reads the state the document script recorded", () => {
    expect(readBootVideoState(rootWith("playing"))).toBe("playing");
    expect(readBootVideoState(rootWith("done"))).toBe("done");
  });

  it("treats an absent or unknown flag as nothing to wait for", () => {
    // A missing flag must never make the app wait on an intro that is not running.
    expect(readBootVideoState(rootWith())).toBe("skipped");
    expect(readBootVideoState(rootWith("nonsense"))).toBe("skipped");
  });
});

describe("whenBootVideoSettles", () => {
  it("hands off immediately when no intro is playing", () => {
    const settled = vi.fn();
    whenBootVideoSettles(settled, { root: rootWith("skipped"), target: fakeWindow() });
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("hands off immediately when the intro already finished", () => {
    const settled = vi.fn();
    whenBootVideoSettles(settled, { root: rootWith("done"), target: fakeWindow() });
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("waits while the intro is playing, rather than cutting it", () => {
    // The whole complaint: the splash used to lift at a fixed time mid-video.
    const settled = vi.fn();
    whenBootVideoSettles(settled, { root: rootWith("playing"), target: fakeWindow() });
    expect(settled).not.toHaveBeenCalled();
  });

  it("hands off when the intro reports it ended", () => {
    const settled = vi.fn();
    const target = fakeWindow();
    whenBootVideoSettles(settled, { root: rootWith("playing"), target });
    target.fire(bootVideoDoneEvent);
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("hands off on the ceiling, so a stalled download cannot hold the app", () => {
    const settled = vi.fn();
    const target = fakeWindow();
    whenBootVideoSettles(settled, { root: rootWith("playing"), target });
    target.runTimers();
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("hands off once even if the event and the ceiling both arrive", () => {
    const settled = vi.fn();
    const target = fakeWindow();
    whenBootVideoSettles(settled, { root: rootWith("playing"), target });
    target.fire(bootVideoDoneEvent);
    target.runTimers();
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("detaches the listener and the timer once it has handed off", () => {
    const target = fakeWindow();
    whenBootVideoSettles(() => undefined, { root: rootWith("playing"), target });
    target.fire(bootVideoDoneEvent);
    expect(target.listenerCount(bootVideoDoneEvent)).toBe(0);
    expect(target.timerCount()).toBe(0);
  });

  it("cancels cleanly, leaving nothing attached and never firing", () => {
    const settled = vi.fn();
    const target = fakeWindow();
    const cancel = whenBootVideoSettles(settled, { root: rootWith("playing"), target });
    cancel();
    target.fire(bootVideoDoneEvent);
    target.runTimers();
    expect(settled).not.toHaveBeenCalled();
    expect(target.listenerCount(bootVideoDoneEvent)).toBe(0);
  });

  it("hands off rather than hanging when there is no document to read", () => {
    const settled = vi.fn();
    whenBootVideoSettles(settled, { root: null, target: fakeWindow() });
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("keeps the ceiling generous enough that the normal path never reaches it", () => {
    expect(bootVideoCeilingMs).toBeGreaterThan(3_000);
  });

  it("leaves room for the cross-fade before the document's last-resort backstop", () => {
    // hold + ceiling + fade must land well under the 9s backstop, or the screen
    // gets slammed off with no fade and the whole hand-off reads as a cut.
    const worstCase = firstLaunchPresentationMs + bootVideoCeilingMs + bootFadeMs;
    expect(worstCase).toBeLessThan(9_000 - 1_000);
  });
});
