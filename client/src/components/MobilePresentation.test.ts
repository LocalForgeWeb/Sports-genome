import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const catalog = readFileSync(new URL("./CatalogDiscoveryPanel.tsx", import.meta.url), "utf8");
const evidence = readFileSync(new URL("./ModifierEvidenceDisclosure.tsx", import.meta.url), "utf8");
const hierarchy = readFileSync(new URL("./HierarchyPlanningDisclosure.tsx", import.meta.url), "utf8");
const mobileStyles = readFileSync(new URL("../mobile-navigation.css", import.meta.url), "utf8");
const catalogStyles = readFileSync(new URL("../catalog-discovery.css", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const appStyles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

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
    expect(mobileStyles).toContain(".apex-topbar { min-height: 76px");
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
    expect(home).toContain('<details className="plan-context">');
    expect(home).toContain('Plan context</span><small>Equipment & evidence</small>');
    expect(home).toContain('<HierarchyPlanningDisclosure');
  });
});
