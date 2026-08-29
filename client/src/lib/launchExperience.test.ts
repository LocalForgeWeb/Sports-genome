import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLaunchExperienceEnabled } from "./launchExperience";

const bootSplashSource = readFileSync(resolve(process.cwd(), "client/src/lib/bootSplash.ts"), "utf8");
const bootLifecycleSource = readFileSync(resolve(process.cwd(), "client/src/components/BootSplashLifecycle.tsx"), "utf8");
const bootDocumentSource = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("launch experience preference", () => {
  it("defaults to enabled unless the athlete explicitly turns it off", () => {
    expect(isLaunchExperienceEnabled(null)).toBe(true); expect(isLaunchExperienceEnabled("on")).toBe(true); expect(isLaunchExperienceEnabled("off")).toBe(false);
  });
  it("has no workspace-overlay or seen-once state because the document handles the boot screen before React mounts", () => expect("shouldShowLaunchExperience" in { isLaunchExperienceEnabled }).toBe(false));
  it("uses a staged S, then DNA, then wordmark launch while immediately bypassing it for reduced-motion users", () => {
    expect(bootSplashSource).toContain("export const minimumBootPresentationMs = 1_720"); expect(bootSplashSource).toContain("window.setTimeout(() => splash.remove(), 300)"); expect(bootLifecycleSource).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)").matches'); expect(bootLifecycleSource).toContain("Math.max(0, minimumBootPresentationMs - elapsedMs)");
    expect(bootDocumentSource).toContain("boot-mark-form 500ms 80ms"); expect(bootDocumentSource).toContain("boot-dna-lines-in 420ms 560ms"); expect(bootDocumentSource).toContain("boot-wordmark-in 480ms 1.03s"); expect(bootDocumentSource).toContain("transition:opacity 300ms");
  });
  it("uses the supplied upright S/DNA layers and a muted short video with a held final frame", () => {
    expect(bootDocumentSource).toContain("sports-genome-upright-s-silhouette-exact_349405db.png"); expect(bootDocumentSource).toContain("sports-genome-upright-dna-detail-exact_8e94e37f.png"); expect(bootDocumentSource).toContain('muted playsinline preload="auto" disablepictureinpicture'); expect(bootDocumentSource).toContain("video.muted=true"); expect(bootDocumentSource).toContain('window.setTimeout(stopVideo,Math.max(0,1_680-(Date.now()-startedAt)))'); expect(bootDocumentSource).toContain("sports-genome-boot-video-held");
  });
  it("keeps launch motion composited and excludes retired mark, orbit, and costly blur treatments", () => {
    expect(bootDocumentSource).toContain("contain:layout paint style"); expect(bootDocumentSource).toContain("will-change:transform,opacity"); expect(bootDocumentSource).not.toContain("filter:blur(64px)"); expect(bootDocumentSource).not.toContain("drop-shadow(0 10px 18px"); expect(bootDocumentSource).not.toContain("boot-mark-orbit"); expect(bootDocumentSource).not.toContain("sports-genome-boot-strand");
  });
});
