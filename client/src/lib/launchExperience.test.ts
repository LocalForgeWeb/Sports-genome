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

  /**
   * The previous ceiling asked "has it been long enough?" and answered with one flat
   * number for two unrelated failures. A six-second intro that was playing perfectly
   * was cut at 4.41s by the guard meant for a download that never started.
   */
  it("abandons an intro that never starts, and never cuts one that is playing", () => {
    // The guard for "it never started" keeps the old four seconds - that is the case
    // it was right for - and applies only while nothing is playing.
    expect(bootDocumentSource).toContain("if (!playing) {");
    expect(bootDocumentSource).toContain('if (sinceStart > (replay ? 8000 : 4000)) { window.clearInterval(watch); settle("skipped"); }');
    // Once it is playing, only a stalled clock or its own declared length ends
    // it - and that length is measured against playback, not against the
    // document. The video starts when enough of it has downloaded, not when the
    // page did, and charging it for that wait cut a six-second intro at 5.41s.
    expect(bootDocumentSource).toContain("var stalled = now - lastProgressAt > 1500;");
    expect(bootDocumentSource).toContain("var playedMs = playbackStartedAt ? now - playbackStartedAt : sinceStart;");
    expect(bootDocumentSource).toContain("var overran = (durationMs && playedMs > durationMs + 2000) || playedMs > 15000;");
    expect(bootDocumentSource).toContain('video.addEventListener("playing"');
    // No flat timer may settle the intro on elapsed time alone.
    expect(bootDocumentSource).not.toContain('window.setTimeout(function () { settle("done"); }, 4000)');
  });

  it("keeps the document's last-resort backstop clear of a playing intro without slowing a real failure", () => {
    // At a flat 9s it could beat a video that was still running, and it reveals the app
    // with no cross-fade - so it would undo the waiting entirely. Extending it instead
    // would make every genuine startup failure a longer blank stare, so it re-checks.
    expect(bootDocumentSource).toContain('dataset.sportsGenomeBootVideo==="playing"');
    expect(bootDocumentSource).toContain("window.setTimeout(check,1000)");
    expect(bootDocumentSource).toContain("window.setTimeout(check,9000)");
  });

  /**
   * "Preview intro video" reloaded the page, and a reload of a browser that has
   * launched before is exactly the state in which the intro is skipped. The button
   * reliably previewed nothing.
   */
  it("lets an explicit replay through the returning-visit skip", () => {
    expect(bootSplashSource).toContain('window.localStorage.setItem(replayIntroStorageKey, "yes")');
    expect(bootDocumentSource).toContain('localStorage.getItem("sports-genome-replay-intro-v1")==="yes"');
    expect(bootDocumentSource).toContain('localStorage.removeItem("sports-genome-replay-intro-v1")');
    expect(bootDocumentSource).toContain('r.dataset.sportsGenomeBootReturn=(!replay&&localStorage.getItem("sports-genome-launched-before-v1")==="yes")?"yes":"no"');
    // And a replay is not held to the "you asked too late to start" gate. That
    // gate now counts from when the static choreography began rather than from
    // when the document did: the two differ by however long the artwork took,
    // and counting that delay against the video punished a slow connection
    // twice. No stamp means the sequence has not begun, so nothing is late.
    expect(bootDocumentSource).toContain("if (!replay && storyStartedAt && Date.now() - storyStartedAt > 1100)");
    expect(bootDocumentSource).toContain("var artAt = Number(root.dataset.sportsGenomeBootArtAt);");
    expect(bootLifecycleSource).toContain("bootPresentationMs(hasLaunchedBefore() && !isIntroReplay())");
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

/**
 * The sequence used to run on a clock that had nothing to do with whether there
 * was anything to show.
 *
 * Measured on the built app at 390x844, with the splash artwork held back to
 * simulate a connection that is not a warm cache:
 *
 *   asset delay   mark's entrance          splash lifted
 *   0ms           424ms, art present       2275ms
 *   1200ms        424ms, art ABSENT        3388ms   (art landed at 1220ms, at
 *                                                    full opacity, no animation)
 *   2500ms        never ran                2466ms   (mark never appeared)
 *
 * The 500ms entrance animating an empty box, and then the PNG snapping in after
 * it had finished, is the "not fully completing". The fix is the same idea in
 * three places: the animations start when the artwork can be drawn, the hold is
 * measured from that same moment, and the video's own "too late" gate counts
 * from it too.
 */
describe("the launch sequence waits for something to show", () => {
  it("starts the choreography when the artwork can be drawn, not when the document paints", () => {
    // Every one of the four animations moved behind the gate together: leaving
    // the wordmark on the old clock would have split the sequence in half.
    for (const step of ["boot-mark-form 500ms 80ms", "boot-dna-lines-in 420ms 560ms", "boot-wordmark-in 480ms 1.03s", "boot-wordmark-in 400ms 1.2s"]) {
      expect(bootDocumentSource, `${step} is gated`).toContain(`html.sports-genome-boot-art-ready .sports-genome-boot-${step.startsWith("boot-mark") ? "logo" : step.startsWith("boot-dna") ? "dna-detail" : step.includes("1.03s") ? "name" : "label"}{animation:${step}`);
    }
    // `decode`, not `load`: load resolves before the bitmap is paintable, and
    // the first frame of a scale-up is exactly where that gap shows.
    expect(bootDocumentSource).toContain('typeof img.decode === "function"');
    // A dead asset must not hold the screen, so the gate opens regardless.
    expect(bootDocumentSource).toContain("window.setTimeout(begin, 2500);");
    expect(bootExperienceSource).toContain("export const bootArtCeilingMs = 2_500");
  });

  it("measures the hold from when the sequence began, and waits to find out when that was", () => {
    // Sampling the stamp once at mount was not enough: React can mount well
    // before the artwork arrives, read nothing, fall back to the document's own
    // start and lift the splash before the mark was ever drawn.
    expect(bootExperienceSource).toContain("export function bootChoreographyStartedAt");
    expect(bootExperienceSource).toContain("export function whenBootArtReady");
    expect(bootDocumentSource).toContain('window.dispatchEvent(new Event("sports-genome-boot-art-ready"))');
    expect(bootLifecycleSource).toContain("const cancelArtWait = whenBootArtReady(() => {");
    expect(bootLifecycleSource).toContain("const choreographyStartedAt = bootChoreographyStartedAt();");
    // And it still measures a hold rather than firing a deadline.
    expect(bootLifecycleSource).toContain("Math.max(0, presentationMs - elapsedMs)");
    // The wait is detached on unmount, like the video wait beside it.
    expect(bootLifecycleSource).toContain("cancelArtWait();");
  });

  it("falls back to the document's own start when no stamp was ever written", () => {
    // A browser without `decode`, a script that threw, the ceiling firing
    // first: every path still produces a hold rather than an immediate wipe.
    expect(bootExperienceSource).toContain("dataset.sportsGenomeBootStartedAt");
    expect(bootExperienceSource).toMatch(/return Number\.isFinite\(started\) && started > 0 \? started : null;/);
  });
});
