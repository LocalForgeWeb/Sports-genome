import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLaunchExperienceEnabled } from "./launchExperience";

const bootSplashSource = readFileSync(resolve(process.cwd(), "client/src/lib/bootSplash.ts"), "utf8");
const bootLifecycleSource = readFileSync(resolve(process.cwd(), "client/src/components/BootSplashLifecycle.tsx"), "utf8");
const bootDocumentSource = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("launch experience preference", () => {
  it("defaults to enabled unless the athlete explicitly turns it off", () => {
    expect(isLaunchExperienceEnabled(null)).toBe(true);
    expect(isLaunchExperienceEnabled("on")).toBe(true);
    expect(isLaunchExperienceEnabled("off")).toBe(false);
  });

  it("has no workspace-overlay or seen-once state because the document handles the boot screen before React mounts", () => {
    expect("shouldShowLaunchExperience" in { isLaunchExperienceEnabled }).toBe(false);
  });

  it("uses a brief staged launch while immediately bypassing it for reduced-motion users", () => {
    expect(bootSplashSource).toContain("export const minimumBootPresentationMs = 1_900");
	    expect(bootSplashSource).toContain("window.setTimeout(() => splash.remove(), 280)");
    expect(bootLifecycleSource).toContain("minimumBootPresentationMs");
    expect(bootLifecycleSource).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)").matches');
    expect(bootLifecycleSource).toContain("document.documentElement.dataset.sportsGenomeBootStartedAt");
    expect(bootLifecycleSource).toContain("Math.max(0, minimumBootPresentationMs - elapsedMs)");
  });

  it("uses the supplied upright S/DNA Sports Genome mark rather than the retired sideways strand drawing", () => {
    expect(bootDocumentSource).toContain("sports-genome-upright-s-silhouette-exact_349405db.png");
    expect(bootDocumentSource).toContain("sports-genome-upright-dna-detail-exact_8e94e37f.png");
    expect(bootDocumentSource).toContain('rel="preload" as="image" href="/manus-storage/sports-genome-upright-s-silhouette-exact_349405db.png" fetchpriority="high"');
    expect(bootDocumentSource).toContain('rel="preload" as="image" href="/manus-storage/sports-genome-upright-dna-detail-exact_8e94e37f.png" fetchpriority="high"');
    expect(bootDocumentSource).not.toContain("sports-genome-upright-s-dna-logo_53affec0.jpg");
    expect(bootDocumentSource).toContain('class="sports-genome-boot-logo"');
    expect(bootDocumentSource).toContain("boot-mark-form");
    expect(bootDocumentSource).toContain("boot-dna-lines-in");
    expect(bootDocumentSource).toContain("boot-wordmark-in");
    expect(bootDocumentSource).toContain('class="sports-genome-boot-dna-detail"');
    expect(bootDocumentSource).not.toContain("sports-genome-boot-dna-mask");
    expect(bootDocumentSource).toContain("sportsGenomeBootStartedAt=String(Date.now())");
    expect(bootDocumentSource).toContain("background:#07182e");
    expect(bootDocumentSource).not.toContain("boot-content-in");
    expect(bootDocumentSource).not.toContain("boot-upright-logo");
    expect(bootDocumentSource).not.toContain("sports-genome-boot-strand");
    expect(bootDocumentSource).not.toContain("boot-mark-orbit");
    expect(bootDocumentSource).not.toContain("M22 105C65 105");
  });

  it("uses the supplied clip only as a muted, short intro and retains the exact layered mark as its non-video fallback", () => {
    expect(bootDocumentSource).toContain('rel="preload" as="video" href="/manus-storage/sports-genome-intro-source_07000a26.mp4" type="video/mp4" fetchpriority="high"');
    expect(bootDocumentSource).toContain('id="sports-genome-boot-video"');
    expect(bootDocumentSource).toContain('muted playsinline preload="auto" disablepictureinpicture');
    expect(bootDocumentSource).toContain('object-fit:contain;background:#07182e');
    expect(bootDocumentSource).toContain('video.muted=true');
    expect(bootDocumentSource).toContain('sports-genome-boot-video-ready');
    expect(bootDocumentSource).toContain('if(video.currentTime>=1.82)video.pause()');
	    expect(bootDocumentSource).toContain("boot-video-in 320ms");
    expect(bootDocumentSource).toContain("boot-wordmark-in 420ms .84s");
    expect(bootDocumentSource).toContain("transition:opacity 280ms");
	    expect(bootDocumentSource).toContain("@media (min-width:641px){html.sports-genome-boot-video-ready .sports-genome-boot-video");
	    expect(bootDocumentSource).toContain("width:min(100%,620px);height:min(100%,620px)");
    expect(bootDocumentSource).toContain('if(video&&!reduced&&document.documentElement.dataset.sportsGenomeBoot!=="off")');
    expect(bootDocumentSource).toContain('bottom:17%');
    expect(bootDocumentSource).toContain('bottom:12.8%');
    expect(bootDocumentSource).toContain('sports-genome-upright-s-silhouette-exact_349405db.png');
    expect(bootDocumentSource).toContain('sports-genome-upright-dna-detail-exact_8e94e37f.png');
  });
});
