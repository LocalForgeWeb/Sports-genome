import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bootPresentationMs,
  firstLaunchPresentationMs,
  hasLaunchedBefore,
  rememberLaunch,
  returningLaunchPresentationMs,
  returningVisitStorageKey,
} from "./bootExperience";

const indexHtml = readFileSync(join(process.cwd(), "client/index.html"), "utf8");
const main = readFileSync(join(process.cwd(), "client/src/main.tsx"), "utf8");
const plugin = readFileSync(join(process.cwd(), "client/vite/preloadWorkspaceChunk.ts"), "utf8");

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    read: () => Object.fromEntries(map),
  };
}

/**
 * The launch sequence ran at full length on every visit. That is right once; after
 * that a daily athlete was paying about 1.7 seconds to watch an animation they had
 * already seen before they could read anything.
 */
describe("bootPresentationMs", () => {
  it("gives a first launch the full choreography", () => {
    expect(bootPresentationMs(false)).toBe(firstLaunchPresentationMs);
    expect(firstLaunchPresentationMs).toBe(1_720);
  });

  it("holds a returning launch only long enough to cover the mount", () => {
    expect(bootPresentationMs(true)).toBe(returningLaunchPresentationMs);
    expect(returningLaunchPresentationMs).toBeLessThan(firstLaunchPresentationMs);
  });

  it("keeps the returning hold long enough to read as a fade rather than a flash", () => {
    // Under roughly 400ms a cross-fade reads as a glitch.
    expect(returningLaunchPresentationMs).toBeGreaterThanOrEqual(400);
  });
});

describe("remembering a launch", () => {
  it("reports a fresh browser as never having launched", () => {
    expect(hasLaunchedBefore(memoryStorage())).toBe(false);
  });

  it("reports a return once a launch is recorded", () => {
    const store = memoryStorage();
    rememberLaunch(store);
    expect(store.read()[returningVisitStorageKey]).toBe("yes");
    expect(hasLaunchedBefore(store)).toBe(true);
  });

  it("treats a browser that refuses storage as a first launch", () => {
    // Showing the full intro to a returning athlete is a worse outcome than never
    // showing it, so the failure leans toward showing it.
    const throwing = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(hasLaunchedBefore(throwing)).toBe(false);
    expect(() => rememberLaunch(throwing)).not.toThrow();
  });

  it("ignores an unrelated value under the key", () => {
    expect(hasLaunchedBefore(memoryStorage({ [returningVisitStorageKey]: "maybe" }))).toBe(false);
  });
});

/**
 * A returning launch plays no video, so cutting one off mid-play - and fetching it
 * at all - are both avoidable.
 */
describe("the document knows about the return before it paints", () => {
  it("records the return visit in the first boot script", () => {
    expect(indexHtml).toContain("sportsGenomeBootReturn");
    expect(indexHtml).toContain('localStorage.getItem("sports-genome-launched-before-v1")');
  });

  it("does not play the intro video on a returning launch", () => {
    expect(indexHtml).toContain('document.documentElement.dataset.sportsGenomeBootReturn!=="yes"');
  });

  it("does not preload a video it will not play", () => {
    // The tag is added by script only on a first launch, rather than sitting in the
    // markup where every visit would fetch it.
    expect(indexHtml).not.toContain('<link rel="preload" as="video"');
    expect(indexHtml).toContain('l.as="video"');
  });

  it("mounts immediately on a return, since there is no video to protect", () => {
    expect(main).toContain("returningLaunch ? 0 :");
  });
});

/**
 * main.tsx defers importing ./App so chunk evaluation cannot stutter the video. That
 * was also deferring the download, so the intro covered none of the work.
 */
describe("the workspace chunk downloads during the intro", () => {
  it("preloads the chunk main.tsx will import", () => {
    expect(plugin).toContain('rel: "modulepreload"');
    expect(plugin).toContain('chunk.name === "App"');
  });

  it("reads the hashed filename from the finished bundle rather than hardcoding it", () => {
    expect(plugin).toContain("ctx.bundle");
    expect(plugin).toContain('order: "post"');
  });

  it("skips entry chunks, which the document already loads", () => {
    expect(plugin).toContain("chunk.isEntry");
  });

  it("is registered in the vite config", () => {
    const config = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");
    expect(config).toContain("preloadWorkspaceChunkPlugin()");
  });
});
