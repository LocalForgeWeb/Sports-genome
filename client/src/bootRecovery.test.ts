// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { bootSplashId, dismissBootSplash } from "@/lib/bootSplash";

// jsdom does not hand back a file: URL for import.meta.url, so these resolve from the
// project root instead.
const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const indexHtml = read("client/index.html");
const mainSource = read("client/src/main.tsx");
const appSource = read("client/src/App.tsx");
const errorBoundarySource = read("client/src/components/ErrorBoundary.tsx");

/**
 * The boot screen is fixed, opaque, and sits above everything until the app-ready
 * class lands. Every path that can stop React from adding it has to have its own way
 * out, or the athlete watches the intro finish and then nothing.
 */
describe("boot screen always lifts", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.body.innerHTML = `<div id="${bootSplashId}"></div>`;
  });
  afterEach(() => {
    document.documentElement.className = "";
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("reveals the app from the document itself, without waiting for React", () => {
    // The failsafe must live in index.html: a chunk that never loads, a blocked
    // script, or a crash before hydration all leave no React to rely on.
    expect(indexHtml).toContain('classList.add("sports-genome-app-ready")');
    const failsafe = indexHtml.match(/setTimeout\(function\(\)\{document\.documentElement\.classList\.add\("sports-genome-app-ready"\)\},(\d+)\)/);
    expect(failsafe, "a document-level timeout reveals the app").toBeTruthy();
    expect(Number(failsafe![1])).toBeGreaterThan(2000);
    expect(Number(failsafe![1])).toBeLessThanOrEqual(10000);
  });

  it("hides the splash through a rule the failsafe class alone satisfies", () => {
    // The class must be sufficient on its own - the failsafe never removes the node.
    expect(indexHtml).toContain("html.sports-genome-app-ready #sports-genome-boot-splash{opacity:0;visibility:hidden;pointer-events:none}");
  });

  it("dismisses on a render error so the error message is not covered", () => {
    expect(errorBoundarySource).toContain("componentDidCatch");
    expect(errorBoundarySource).toContain("dismissBootSplash()");
  });

  it("keeps the dismissing component outside the providers it must not depend on", () => {
    const lifecycle = appSource.indexOf("<BootSplashLifecycle />");
    const themeProvider = appSource.indexOf("<ThemeProvider");
    const tooltipProvider = appSource.indexOf("<TooltipProvider>");
    expect(lifecycle).toBeGreaterThan(-1);
    expect(lifecycle).toBeLessThan(themeProvider);
    expect(lifecycle).toBeLessThan(tooltipProvider);
  });

  it("dismissBootSplash marks the document ready and clears the node", () => {
    vi.useFakeTimers();
    dismissBootSplash();
    expect(document.documentElement.classList.contains("sports-genome-app-ready")).toBe(true);
    vi.advanceTimersByTime(400);
    expect(document.getElementById(bootSplashId)).toBeNull();
  });

  it("is safe to call when the splash is already gone", () => {
    document.body.innerHTML = "";
    expect(() => dismissBootSplash()).not.toThrow();
  });
});

describe("startup failures surface instead of rejecting silently", () => {
  it("retries the workspace chunk once before giving up", () => {
    // A stale chunk reference after a deploy is the common cause, and one retry picks
    // up the new manifest.
    expect(mainSource).toContain("retrying once");
    expect(mainSource.match(/await import\("\.\/App"\)/g)?.length).toBe(2);
  });

  it("renders a reload path rather than leaving the boot screen up", () => {
    expect(mainSource).toContain("renderStartupFailure");
    expect(mainSource).toContain("dismissBootSplash()");
    expect(mainSource).toContain('reload.addEventListener("click", () => window.location.reload())');
    expect(mainSource).toContain('setAttribute("role", "alert")');
  });

  it("catches a mount failure as well as a load failure", () => {
    const loadCatch = mainSource.indexOf("workspace chunk could not be loaded");
    const mountCatch = mainSource.indexOf("workspace failed to mount");
    expect(loadCatch).toBeGreaterThan(-1);
    expect(mountCatch).toBeGreaterThan(loadCatch);
  });

  it("gives the failure a reachable tap target", () => {
    expect(mainSource).toContain("min-height:44px");
  });
});

describe("the deferred workspace import keeps its guard rails", () => {
  it("still defers the heavy import so the intro cannot stutter", () => {
    // This deferral is deliberate and predates the boot fix; the recovery paths were
    // what was missing, not the timing.
    expect(mainSource).toContain("const workspaceMountDelayMs = Math.max(0, 1_580 - elapsedBootMs)");
    expect(mainSource).toContain("window.setTimeout(() => { void mountWorkspace(); }, workspaceMountDelayMs)");
  });

  it("holds the screen for its minimum presentation time", () => {
    const lifecycle = read("client/src/components/BootSplashLifecycle.tsx");
    expect(lifecycle).toContain("minimumBootPresentationMs");
  });
});
