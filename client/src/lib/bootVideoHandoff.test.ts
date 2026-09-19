import { describe, expect, it, vi } from "vitest";
import {
  bootDocumentBackstopMs,
  bootDocumentBackstopRecheckMs,
  bootVideoCeilingMs,
  bootVideoDoneEvent,
  bootVideoStartCutoffMs,
  canStartBootVideo,
  introSettleReason,
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

  it("keeps the ceiling generous enough that a real intro never reaches it", () => {
    // It was 4_000, which cut a six-second intro at 4.41s. The ceiling must be long
    // enough that no plausible brand intro can be the thing it ends.
    expect(bootVideoCeilingMs).toBeGreaterThanOrEqual(12_000);
  });

  it("keeps the document backstop short for a startup failure, and defers it only while the intro runs", () => {
    // Stretching the backstop past the intro's ceiling would make every genuine
    // failure a longer blank stare, so it stays where it was and re-checks instead.
    expect(firstLaunchPresentationMs + bootFadeMs).toBeLessThan(bootDocumentBackstopMs);
    expect(bootDocumentBackstopMs).toBeLessThan(bootVideoCeilingMs);
    expect(bootDocumentBackstopRecheckMs).toBeLessThan(bootDocumentBackstopMs);
  });
});

/**
 * The policy that replaced the flat cap. One 4-second number was answering two
 * unrelated questions - "did it ever start?" and "is it still going?" - and the
 * answer that was right for the first was what cut the second short.
 */
describe("introSettleReason", () => {
  const playing = { ended: false, playing: true, msSinceProgress: 0, msSinceStart: 0, durationMs: 6_000 };

  it("ends on the video's own end, whenever that is", () => {
    expect(introSettleReason({ ...playing, ended: true, msSinceStart: 6_050 })).toBe("ended");
    expect(introSettleReason({ ...playing, ended: true, msSinceStart: 900 })).toBe("ended");
  });

  /** The reported bug, as a test: six seconds of intro, four seconds in, still playing. */
  it("keeps waiting on a six-second intro at the moment the old cap cut it", () => {
    expect(introSettleReason({ ...playing, msSinceStart: 4_000, msSinceProgress: 30 })).toBeNull();
    expect(introSettleReason({ ...playing, msSinceStart: 4_410, msSinceProgress: 30 })).toBeNull();
    expect(introSettleReason({ ...playing, msSinceStart: 5_900, msSinceProgress: 30 })).toBeNull();
  });

  it("waits out a long intro as long as its clock is still advancing", () => {
    expect(introSettleReason({ ended: false, playing: true, msSinceProgress: 40, msSinceStart: 11_000, durationMs: 12_000 })).toBeNull();
  });

  it("gives up on a download that stops progressing", () => {
    expect(introSettleReason({ ...playing, msSinceStart: 2_000, msSinceProgress: 1_600 })).toBe("stalled");
    // A brief decode hiccup is not a stall.
    expect(introSettleReason({ ...playing, msSinceStart: 2_000, msSinceProgress: 400 })).toBeNull();
  });

  it("stops a little past a known duration, for the gap before `ended` arrives", () => {
    expect(introSettleReason({ ...playing, msSinceStart: 8_100, msSinceProgress: 10 })).toBe("overran");
    expect(introSettleReason({ ...playing, msSinceStart: 7_000, msSinceProgress: 10 })).toBeNull();
  });

  it("has an absolute ceiling for a video that declares no duration at all", () => {
    expect(introSettleReason({ ended: false, playing: true, msSinceProgress: 10, msSinceStart: 15_100, durationMs: null })).toBe("overran");
    expect(introSettleReason({ ended: false, playing: true, msSinceProgress: 10, msSinceStart: 9_000, durationMs: null })).toBeNull();
  });

  it("abandons an intro that never begins, on the ceiling the flat cap was right for", () => {
    const idle = { ended: false, playing: false, msSinceProgress: 0, durationMs: null };
    expect(introSettleReason({ ...idle, msSinceStart: 3_900 })).toBeNull();
    expect(introSettleReason({ ...idle, msSinceStart: 4_100 })).toBe("never-started");
  });

  it("waits longer for a replay to start, because watching it is the point", () => {
    const idle = { ended: false, playing: false, msSinceProgress: 0, durationMs: null, replay: true };
    expect(introSettleReason({ ...idle, msSinceStart: 6_000 })).toBeNull();
    expect(introSettleReason({ ...idle, msSinceStart: 8_100 })).toBe("never-started");
  });

  it("never lets the start ceiling apply to a video that is already playing", () => {
    // This inversion is the entire bug: the guard for "it never started" was ending
    // an intro that had started and was running fine.
    expect(introSettleReason({ ...playing, msSinceStart: 4_500, msSinceProgress: 20 })).toBeNull();
  });
});

describe("canStartBootVideo", () => {
  it("lets a replay start however late it became playable", () => {
    expect(canStartBootVideo(5_000)).toBe(false);
    expect(canStartBootVideo(5_000, { replay: true })).toBe(true);
  });
});
