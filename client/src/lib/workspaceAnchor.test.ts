// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { anchorPollCeilingMs, anchorPollIntervalMs, revealWorkspaceAnchor } from "./workspaceAnchor";

/**
 * Search results and the "Set it as a target" hand-off land on a section of a workspace that
 * mounts a frame or two after navigation. The landing has to wait for it, move focus to it
 * without cutting the smooth scroll short, and stop looking after a ceiling.
 */
function makeSection(id: string) {
  const section = document.createElement("section");
  section.id = id;
  section.tabIndex = -1;
  // jsdom does not implement scrollIntoView.
  const scrollIntoView = vi.fn();
  section.scrollIntoView = scrollIntoView;
  return { section, scrollIntoView };
}

describe("revealWorkspaceAnchor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps looking until the section mounts, then scrolls to it and focuses it once", () => {
    revealWorkspaceAnchor("targeted-capacity");
    vi.advanceTimersByTime(120);

    const { section, scrollIntoView } = makeSection("targeted-capacity");
    const focus = vi.spyOn(section, "focus");
    document.body.appendChild(section);
    vi.advanceTimersByTime(anchorPollIntervalMs);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(section);

    vi.advanceTimersByTime(2000);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("lands on a section that is already there on the first tick", () => {
    const { section, scrollIntoView } = makeSection("targeted-capacity");
    document.body.appendChild(section);

    revealWorkspaceAnchor("targeted-capacity");
    vi.advanceTimersByTime(0);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(section);

    // jsdom's focus() queues its own selectionchange task; let it and any poll run.
    vi.advanceTimersByTime(anchorPollIntervalMs);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops looking at the ceiling", () => {
    revealWorkspaceAnchor("never-mounts");
    vi.advanceTimersByTime(anchorPollCeilingMs + anchorPollIntervalMs);
    expect(vi.getTimerCount()).toBe(0);

    const { section, scrollIntoView } = makeSection("never-mounts");
    document.body.appendChild(section);
    vi.advanceTimersByTime(1000);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(section);
  });

  it("honours a shorter ceiling", () => {
    revealWorkspaceAnchor("never-mounts", { ceilingMs: 100 });
    vi.advanceTimersByTime(200);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("can be cancelled before the section mounts", () => {
    const cancel = revealWorkspaceAnchor("targeted-capacity");
    vi.advanceTimersByTime(100);
    cancel();

    const { section, scrollIntoView } = makeSection("targeted-capacity");
    document.body.appendChild(section);
    vi.advanceTimersByTime(1000);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does nothing without an id or a document", () => {
    const withoutId = revealWorkspaceAnchor("");
    expect(vi.getTimerCount()).toBe(0);
    expect(() => withoutId()).not.toThrow();

    // `undefined` would fall back to the global document; null is the missing one.
    const withoutDocument = revealWorkspaceAnchor("x", { document: null as unknown as Document });
    expect(vi.getTimerCount()).toBe(0);
    expect(() => withoutDocument()).not.toThrow();
  });
});
