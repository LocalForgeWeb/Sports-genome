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

describe("mobile athlete presentation", () => {
  it("keeps source and hierarchy methodology available through compact disclosure controls", () => {
    expect(evidence).toContain('<details className="planning-evidence-card"');
    expect(evidence).toContain("Evidence: reviewed");
    expect(hierarchy).toContain('<details className="planning-disclosure-card">');
    expect(hierarchy).toContain("View methodology");
  });

  it("renders catalog rows as ranked tappable cards and preserves the phone single-column layout", () => {
    expect(catalog).toContain('className="catalog-discovery-tier"');
    expect(catalog).toContain('aria-label={`Inspect ${exercise.name}`}');
    expect(catalogStyles).toContain(".catalog-discovery-list { grid-template-columns: 1fr; }");
    expect(catalogStyles).toContain(".catalog-discovery-search { top: 94px");
  });

  it("uses compact safe-area-aware controls for the guide, header, and Genome disclosure", () => {
    expect(mobileStyles).toContain("env(safe-area-inset-bottom)");
    expect(mobileStyles).toContain(".feature-guide-button span { display: none; }");
    expect(mobileStyles).toContain(".genome-methodology");
    expect(mobileStyles).toContain(".apex-topbar { min-height: 82px");
  });

  it("keeps disclosure and tab motion brief while respecting reduced-motion preferences", () => {
    expect(mobileStyles).toContain("mobile-disclosure-in 180ms");
    expect(mobileStyles).toContain("mobile-tab-in 170ms");
    expect(mobileStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps recommendation cards decision-first on phones while retaining full reasoning behind one disclosure", () => {
    expect(home).toContain('<summary>Why this match?</summary>');
    expect(home).toContain('aria-label={`Inspect ${result.exercise.name}`}');
    expect(home).toContain('relative match for ${result.exercise.name}');
    expect(appStyles).toContain('.recommendation-row-main { grid-template-columns: 26px minmax(0, 1fr) 36px auto 44px;');
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
    expect(trainingCardStyles).toContain("width: 34px; min-width: 34px; height: 34px; min-height: 34px");
  });

  it("keeps mobile navigation opaque and Training Day dark-surface controls legible against navy panels", () => {
    expect(appStyles).toContain(".apex-topbar, .workspace-top-switcher { background: #fffdf8;");
    expect(plannerStyles).toContain(".day-order-controls button { border-color: var(--sg-control-border-on-dark); color: var(--sg-text-muted-on-dark); }");
  });

  it("keeps the Strength Genome heading and evidence-gated status rail readable on the blue Explore surface", () => {
    expect(appStyles).toContain(".destination-explore .strength-genome-workspace .view-header { background: linear-gradient(145deg, var(--sg-surface-panel), var(--sg-surface-deep));");
    expect(appStyles).toContain(".destination-explore .strength-genome-workspace .view-header h1 { color: #f7fbff; }");
    expect(appStyles).toContain(".destination-explore .strength-genome-workspace .view-header em { color: #f2c14d; }");
    expect(appStyles).toContain(".destination-explore .strength-genome-workspace .view-header > div > p:not(.metric-label) { color: var(--sg-text-muted-on-dark); }");
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
