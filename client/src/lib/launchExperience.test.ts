import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLaunchExperienceEnabled } from "./launchExperience";

const bootSplashSource = readFileSync(resolve(process.cwd(), "client/src/lib/bootSplash.ts"), "utf8");
const bootExperienceSource = readFileSync(resolve(process.cwd(), "client/src/lib/bootExperience.ts"), "utf8");
const bootLifecycleSource = readFileSync(resolve(process.cwd(), "client/src/components/BootSplashLifecycle.tsx"), "utf8");
const bootDocumentSource = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("launch experience preference", () => {
  it("defaults to enabled unless the athlete explicitly turns it off", () => {
    expect(isLaunchExperienceEnabled(null)).toBe(true); expect(isLaunchExperienceEnabled("on")).toBe(true); expect(isLaunchExperienceEnabled("off")).toBe(false);
  });
  it("has no workspace-overlay or seen-once state because the document handles the boot screen before React mounts", () => expect("shouldShowLaunchExperience" in { isLaunchExperienceEnabled }).toBe(false));
  it("uses a staged S, then DNA, then wordmark launch while immediately bypassing it for reduced-motion users", () => {
    // The hold now lives in bootExperience, where it varies by first vs returning launch.
    expect(bootExperienceSource).toContain("export const firstLaunchPresentationMs = 1_720"); // Removal now waits for the fade to actually end rather than racing it.
    expect(bootSplashSource).toContain('splash.addEventListener("transitionend"'); expect(bootLifecycleSource).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)").matches'); expect(bootLifecycleSource).toContain("Math.max(0, presentationMs - elapsedMs)");
    expect(bootDocumentSource).toContain("boot-mark-form 500ms 80ms"); expect(bootDocumentSource).toContain("boot-dna-lines-in 420ms 560ms"); expect(bootDocumentSource).toContain("boot-wordmark-in 480ms 1.03s"); // Softened: a 300ms strong ease-out read as a cut rather than a cross-fade.
    expect(bootDocumentSource).toContain("transition:opacity 420ms cubic-bezier(.4,0,.2,1)");
  });
  it("uses the supplied upright S/DNA layers and a muted intro that plays to its end", () => {
    expect(bootDocumentSource).toContain("sports-genome-upright-s-silhouette-exact_349405db.png");
    expect(bootDocumentSource).toContain("sports-genome-upright-dna-detail-exact_8e94e37f.png");
    expect(bootDocumentSource).toContain('muted playsinline preload="auto" disablepictureinpicture');
    expect(bootDocumentSource).toContain("video.muted = true");
  });

  /**
   * The intro used to be cut by two timers a frame apart: the document paused the
   * video at 1680ms - mid-frame, whatever its real length - and the lifecycle
   * lifted the splash at 1720ms. It froze, then the screen wiped.
   */
  it("never pauses the intro partway through", () => {
    expect(bootDocumentSource).not.toContain("stopVideo");
    expect(bootDocumentSource).not.toContain("1_680");
    expect(bootDocumentSource).not.toContain("sports-genome-boot-video-held");
    expect(bootDocumentSource).not.toMatch(/video\.pause\(\)/);
  });

  it("hands off on the video's own end, not on a duration guessed in the markup", () => {
    // A hard-coded length means every future edit to the asset gets clipped again.
    expect(bootDocumentSource).toContain('video.addEventListener("ended"');
    expect(bootDocumentSource).toContain('settle("done")');
    expect(bootDocumentSource).toContain("sports-genome-boot-video-done");
  });

  it("records a state the app can wait on, and reports one even when the intro never runs", () => {
    expect(bootDocumentSource).toContain('root.dataset.sportsGenomeBootVideo = "playing"');
    expect(bootDocumentSource).toContain('root.dataset.sportsGenomeBootVideo = "skipped"');
    expect(bootDocumentSource).toContain('video.addEventListener("error"');
  });

  it("keeps a ceiling so a stalled download cannot hold the screen", () => {
    expect(bootDocumentSource).toContain("window.setTimeout(function () { settle(\"done\"); }, 4000)");
    // The document's last-resort backstop must not beat the designed cross-fade.
    expect(bootDocumentSource).toContain('add("sports-genome-app-ready")},9000)');
  });

  it("makes the hold a floor rather than a deadline", () => {
    // The lifecycle used to fire dismissBootSplash directly on that timer.
    expect(bootLifecycleSource).toContain("whenBootVideoSettles(finish)");
    expect(bootLifecycleSource).not.toMatch(/setTimeout\(\(\) => \{\s*dismissBootSplash\(\);/);
  });
  it("expands public launch asset URLs for static GitHub/Vercel builds", () => {
    expect(bootDocumentSource).not.toContain("%VITE_SUPABASE_URL%");
    expect(bootDocumentSource).toContain("https://qiccnqkypbhlwpmjcsri.supabase.co/storage/v1/object/public/sports-genome-assets/sports-genome-intro-source_07000a26.mp4");
  });
  it("keeps launch motion composited and excludes retired mark, orbit, and costly blur treatments", () => {
    expect(bootDocumentSource).toContain("contain:layout paint style"); expect(bootDocumentSource).toContain("will-change:transform,opacity"); expect(bootDocumentSource).not.toContain("filter:blur(64px)"); expect(bootDocumentSource).not.toContain("drop-shadow(0 10px 18px"); expect(bootDocumentSource).not.toContain("boot-mark-orbit"); expect(bootDocumentSource).not.toContain("sports-genome-boot-strand");
  });
});
