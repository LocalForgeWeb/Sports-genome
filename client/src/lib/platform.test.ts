// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { platform, resetPlatformAdapter, setPlatformAdapter, webPlatform } from "./platform";
import { emitInteractionFeedback } from "./interactionFeedback";
import { savePdf } from "./workoutShare";

/**
 * iOS readiness audit, A09: the browser's device APIs are reached through one adapter, which the
 * native shell replaces. The web behaviour is the app's behaviour today.
 */
afterEach(() => {
  resetPlatformAdapter();
  vi.unstubAllGlobals();
});

describe("the platform adapter", () => {
  it("is the web one until a native shell registers its own", () => {
    expect(platform()).toBe(webPlatform);
    expect(platform().kind).toBe("web");
  });

  it("sends haptics, saved files and printing to the native shell once registered, and keeps web for the rest", () => {
    const haptic = vi.fn();
    const saveFile = vi.fn(() => "saved" as const);
    setPlatformAdapter({ kind: "native", haptic, saveFile });
    emitInteractionFeedback([10, 30]);
    expect(haptic).toHaveBeenCalledWith([10, 30]);
    const file = new File(["%PDF"], "day.pdf", { type: "application/pdf" });
    expect(savePdf(file)).toBe("saved");
    expect(saveFile).toHaveBeenCalledWith(file);
    expect(platform().kind).toBe("native");
    expect(platform().print).toBe(webPlatform.print);
  });

  it("reports a dismissed share sheet as cancelled, and a refused one as failed", async () => {
    vi.stubGlobal("navigator", { share: () => Promise.reject(new DOMException("closed", "AbortError")) });
    expect(await platform().share({ url: "https://example.test/s/a" })).toBe("cancelled");
    vi.stubGlobal("navigator", { share: () => Promise.reject(new Error("no")) });
    expect(await platform().share({ url: "https://example.test/s/a" })).toBe("failed");
    vi.stubGlobal("navigator", { share: () => Promise.resolve() });
    expect(await platform().share({ url: "https://example.test/s/a" })).toBe("shared");
    vi.stubGlobal("navigator", {});
    expect(platform().canShare()).toBe(false);
    expect(await platform().share({ url: "https://example.test/s/a" })).toBe("failed");
  });

  it("asks the browser whether files can be shared, and never throws", () => {
    vi.stubGlobal("navigator", { share: () => Promise.resolve(), canShare: () => { throw new Error("odd browser"); } });
    expect(platform().canShare({ files: [new File(["x"], "x.pdf")] })).toBe(false);
    expect(platform().canShare()).toBe(true);
  });
});

describe("device APIs outside the adapter", () => {
  it("are not called directly anywhere in the app", () => {
    const root = join(process.cwd(), "client/src");
    const files = (function walk(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return walk(path);
        return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
      });
    })(root);
    const offenders = files
      .filter((file) => !file.endsWith("lib/platform.ts"))
      .filter((file) => /navigator\.vibrate|navigator\.share\(|window\.print\(\)/.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file));
    expect(offenders).toEqual([]);
  });
});
