import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const catalog = readFileSync(new URL("./CatalogDiscoveryPanel.tsx", import.meta.url), "utf8");
const evidence = readFileSync(new URL("./ModifierEvidenceDisclosure.tsx", import.meta.url), "utf8");
const hierarchy = readFileSync(new URL("./HierarchyPlanningDisclosure.tsx", import.meta.url), "utf8");
const mobileStyles = readFileSync(new URL("../mobile-navigation.css", import.meta.url), "utf8");
const catalogStyles = readFileSync(new URL("../catalog-discovery.css", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const appStyles = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const plannerStyles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");
const trainingCardStyles = readFileSync(new URL("../mobile-training-card.css", import.meta.url), "utf8");
const stackAnalysisStyles = readFileSync(new URL("../stack-analysis.css", import.meta.url), "utf8");

describe("mobile athlete presentation", () => {
  it("keeps source and hierarchy methodology available through compact disclosure controls", () => {
    expect(evidence).toContain('<details className="planning-evidence-card"');
    expect(evidence).toContain("Evidence: reviewed");
    expect(hierarchy).toContain('<details className="planning-disclosure-card">');
    expect(hierarchy).toContain("View methodology");
  });

  it("renders catalog rows as ranked tappable cards and preserves the phone single-column layout", () => {
    // Sep 30 brief §5: the catalog's tier letter is off the rows; it is shown, explained, in the details only.
    expect(catalog).not.toContain("catalog-discovery-tier");
    expect(catalog).toContain('aria-label={`Inspect ${exercise.name}`}');
    expect(catalogStyles).toContain(".catalog-discovery-list { grid-template-columns: 1fr; }");
    // One main scroll: the search field scrolls with the page rather than
    // stacking a second sticky bar under the tab row.
    expect(catalogStyles).not.toContain("position: sticky");
  });

  it("uses compact safe-area-aware controls for the header and Genome disclosure", () => {
    expect(mobileStyles).toContain("env(safe-area-inset-bottom)");
    // The floating guide button is gone (the guide opens from Profile), so no
    // stylesheet should keep laying it out.
    for (const styles of [mobileStyles, appStyles]) expect(styles).not.toContain("feature-guide-button");
    expect(mobileStyles).toContain(".genome-methodology");
    // No header to make safe-area-aware any more; the tab row it left behind is the
    // top of the page, and pads for the notch itself.
    expect(mobileStyles).not.toContain(".apex-topbar");
    expect(mobileStyles).toContain(".workspace-top-switcher { top: 0;");
  });

  it("keeps the retired day switcher and sticky session strip out of the stylesheets", () => {
    // Neither is rendered any more; their rules pinned hand-picked sticky offsets
    // that --sg-pinned-chrome replaced, so they must not come back as dead layout.
    for (const styles of [plannerStyles, appStyles]) {
      expect(styles).not.toContain("training-day-nav");
      expect(styles).not.toContain("session-execution-strip");
      expect(styles).not.toContain("day-session-mode");
    }
  });

  it("keeps full-screen overlay headers below the status bar", () => {
    // The installed app draws under a translucent status bar, so a close control
    // pinned to the top edge of a full-screen overlay sits beneath the clock and
    // notch. Each of these headers pads itself down by the inset, as the Exercise
    // Intelligence bar already does.
    const compareBar = appStyles.match(/\.exercise-compare-bar \{[^}]*\}/)?.[0];
    expect(compareBar).toContain("padding: max(.85rem, env(safe-area-inset-top, 0px))");
    const stackHead = stackAnalysisStyles.match(/^\.stack-analysis-head \{[^}]*\}/m)?.[0];
    expect(stackHead).toContain("env(safe-area-inset-top");
    // The phone rule resets padding with a shorthand, so it carries its own inset.
    const phoneStackHead = stackAnalysisStyles.match(/@media \(max-width: 760px\) \{ \.stack-analysis-head \{[^}]*\}/)?.[0];
    expect(phoneStackHead).toContain("env(safe-area-inset-top");
    const phoneImportScrim = appStyles.match(/\.routine-import-scrim \{ display: block;[^}]*\}/)?.[0];
    expect(phoneImportScrim).toContain("env(safe-area-inset-top");
  });

  it("gives the first-run guide and the confirm dialog 44px tap targets of their own", () => {
    // These two modals mount at the Home root, outside main.apex-content, so the
    // app-wide tap floor never reaches them. Where the floor does reach, it sets a
    // height but not a width, so the close buttons declare both.
    expect(appStyles).toMatch(/\.confirm-dialog-close\{[^}]*width:2\.75rem;height:2\.75rem/);
    expect(appStyles).toMatch(/\.feature-tour-close\{[^}]*width:2\.75rem;height:2\.75rem/);
    expect(appStyles).toMatch(/\.feature-tour-skip,\.feature-tour-back\{[^}]*min-height:2\.75rem/);
    expect(appStyles).toMatch(/\.feature-tour-next\{[^}]*min-height:2\.75rem/);
    expect(appStyles).toMatch(/\.confirm-dialog-cancel\{[^}]*min-height:2\.75rem/);
    expect(appStyles).toMatch(/\.confirm-dialog-confirm\{[^}]*min-height:2\.75rem/);
  });

  it("caps the guide and confirm dialog cards at the viewport so a tall card scrolls", () => {
    // The four-step guide opens by itself after onboarding. On a short or
    // landscape screen the card is taller than the view, and a centred card in a
    // fixed layer cannot be scrolled to, so the close, Skip and Next controls must
    // stay reachable by scrolling inside the card.
    expect(appStyles).toMatch(/\.feature-tour-card\{[^}]*max-height:calc\(100dvh - 2rem\)[^}]*overflow-y:auto/);
    expect(appStyles).toMatch(/\.confirm-dialog-card\{[^}]*max-height:calc\(100dvh - 2rem\)[^}]*overflow-y:auto/);
  });

  it("keeps disclosure and tab motion brief while respecting reduced-motion preferences", () => {
    // Both were inline timings (180ms, 170ms) that no longer collapsed under the
    // reduced-motion preference. On the shared token they are still brief and now
    // shorten with everything else.
    expect(mobileStyles).toContain("mobile-disclosure-in var(--sg-motion-fast)");
    expect(mobileStyles).toContain("mobile-tab-in var(--sg-motion-fast)");
    expect(mobileStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps recommendation cards decision-first on phones while retaining full reasoning behind one disclosure", () => {
    // One disclosure per card, and it now carries the marker that says so: the
    // stylesheet hides the webkit one and `display: flex` suppresses Chrome's.
    // Intentional change, Sep 28 regression brief §11: each summary names its exercise, and
    // the number names its scale.
    expect(home).toContain('<details className="recommendation-why"><summary aria-label={`Why ${name} matches`}>Why this match?');
    expect(home).toContain('>Why this match?<ChevronDown');
    expect(home).toContain('aria-label={`Inspect ${name}`}');
    expect(home).toContain('aria-label={`Match ${score} of 99 for ${name}: open details`}');
    expect(appStyles).toContain('.recommendation-row-main { grid-template-columns: 26px minmax(0, 1fr) 44px auto 44px;');
    expect(appStyles).toContain('.recommendation-score { display: grid; }');
    expect(appStyles).toContain('.recommendation-add { width: 44px; height: 44px; }');
    expect(appStyles).toContain('.apex-content > section.space-y-5 > div.border-l-2 { display: none; }');
    expect(appStyles).toContain('.apex-content > section.space-y-5 .view-header-note { display: none; }');
    expect(home).not.toContain('<details className="plan-context">');
    expect(home).not.toContain('<HierarchyPlanningDisclosure');
  });

  it("keeps Training Day prescription-first and makes reordering a compact in-row control on phones", () => {
    expect(plannerStyles).toContain(".day-design-main > .grid > div:first-child { order: 2; }");
    expect(plannerStyles).toContain(".day-design-main > .grid > .day-programming-panel { order: 1; }");
    expect(plannerStyles).toContain(".day-programming-head p:last-child { display: none; }");
    expect(trainingCardStyles).toContain("position: absolute !important; top: .7rem; right: .7rem");
    // 44 square: the app's tap floor overrules a height but not a width, so the
    // pair declares both.
    expect(trainingCardStyles).toContain("width: 44px; min-width: 44px; height: 44px");
  });

  it("keeps mobile navigation opaque and Training Day dark-surface controls legible against navy panels", () => {
    expect(appStyles).toContain(".workspace-top-switcher, .workspace-top-actions { background: var(--sg-surface-light);");
    expect(plannerStyles).toContain(".day-order-controls button { border-color: var(--sg-control-border-on-dark); color: var(--sg-text-muted-on-dark); }");
  });

  it("keeps the Strength Genome heading and evidence-gated status rail readable on the blue Body Lab surface", () => {
    expect(appStyles).toContain(".destination-body .strength-genome-workspace .view-header { background: linear-gradient(145deg, var(--sg-surface-panel), var(--sg-surface-deep));");
    expect(appStyles).toContain(".destination-body .strength-genome-workspace .view-header h1 { color: var(--sg-text-on-dark); }");
    expect(appStyles).toContain(".destination-body .strength-genome-workspace .view-header em { color: var(--sg-focus-on-dark); }");
    expect(appStyles).toContain(".destination-body .strength-genome-workspace .view-header > div > p:not(.metric-label) { color: var(--sg-text-muted-on-dark); }");
    expect(appStyles).toContain(".strength-profile-status { overflow: hidden;");
  });

  it("defines semantic readable-text roles for active light and dark destination surfaces", () => {
    expect(appStyles).toContain("--sg-text-on-dark: #f7fbff;");
    expect(appStyles).toContain("--sg-text-muted-on-dark: #c3d7ea;");
    expect(appStyles).toContain("--sg-text-on-light: #102947;");
    expect(appStyles).toContain("--sg-text-muted-on-light: #355774;");
    expect(appStyles).toContain(".destination-progress .progress-review { color: var(--sg-text-on-dark);");
  });
});
