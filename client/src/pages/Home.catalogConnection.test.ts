import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(import.meta.dirname, "Home.tsx"), "utf8");
const catalogSource = readFileSync(resolve(import.meta.dirname, "../components/CatalogDiscoveryPanel.tsx"), "utf8");
const catalogStyles = readFileSync(resolve(import.meta.dirname, "../catalog-discovery.css"), "utf8");
const globalStyles = readFileSync(resolve(import.meta.dirname, "../index.css"), "utf8");

describe("canonical connected exercise catalog", () => {
  it("uses Catalog Discovery with the selected sport-action connection helper", () => {
    expect(homeSource).toContain("connectionForExercise={connectionForExercise}");
    // One cached lookup per selected action, so a keystroke or an unrelated render reuses it.
    expect(homeSource).toContain("createActionConnectionLookup(enrichedSelectedMovement), [enrichedSelectedMovement]");
    expect(homeSource).toContain("selectedActionLabel={selectedMovement.label}");
    expect(catalogSource).toContain("catalog-action-link");
    expect(catalogSource).toContain("connection.label");
    expect(catalogSource).toContain("All action links");
    expect(catalogSource).toContain("Direct support");
    expect(catalogSource).toContain("Supporting link");
    expect(catalogSource).not.toContain("Any sport fit");
    expect(catalogSource).not.toContain("A-grade or higher");
  });

  it("mounts the exercise overlay with the same selected action the catalog is measured against", () => {
    // The Genome page folded into this overlay: one place per exercise, not two.
    expect(homeSource).not.toContain("<ExerciseGenomeWorkspace");
    expect(homeSource).toContain("<SelectedActionConnectionCard exercise={inspectedExercise} selectedMovement={selectedMovement} enrichedSelectedMovement={enrichedSelectedMovement}");
    expect(homeSource).toContain('if (value === "genome") return "catalog";');
  });

	  it("keeps only actionable mobile Catalog connection states visible and visually distinct without presenting them as performance ratings", () => {
    // The connection state itself is per-card; the action it is measured against
    // is one fact about the whole grid. Repeating the action name on every card
    // made all 36 chips read "SUPPORTING LINK · PE..." - identical and truncated,
    // because the suffix never fit - so it is stated once in the header instead.
    // October 1: the label stays, followed by what the relationship is, as text that wraps.
    expect(catalogSource).toContain("<span>{connection.label}</span> · {connection.detail");
    expect(catalogSource).not.toContain("${selectedActionLabel}`");
    expect(catalogSource).toContain("Action links below are measured against");
	    expect(catalogSource).toContain('connection && connection.label !== "Not mapped"');
    expect(catalogStyles).toContain(".catalog-action-link-direct-support");
    expect(catalogStyles).toContain(".catalog-action-link-supporting-link");
	    expect(catalogStyles).not.toContain(".catalog-action-link-not-mapped");
    expect(catalogStyles).toContain(".catalog-discovery-list { grid-template-columns: 1fr; }");
    // A sentence that wraps, not a pill that truncated to "SUPPORTING LINK · SHARE…" (October 1 brief §3).
    expect(catalogStyles).toContain(".catalog-action-link { display: block;");
    expect(catalogStyles).not.toContain("text-overflow: ellipsis");
  });

  it("keeps Movement Atlas labels readable after the Body Lab workspace applies its dark operational surface", () => {
    expect(globalStyles).toContain(".destination-body .atlas-action-item strong { color: var(--sg-text-on-dark); }");
    expect(globalStyles).toContain(".destination-body .atlas-action-item > span { color: #d3e5f5; }");
    expect(globalStyles).toContain(".destination-body .atlas-action-item svg { color: #84b6ff; }");
  });

  it("does not restore the duplicate cramped legacy catalog grid", () => {
    expect(homeSource).not.toContain('300 tools.<br /><em className="text-[#e4512e]">Mapped on purpose.</em>');
    expect(homeSource).not.toContain('className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{filteredCatalog.map');
  });

  it("builds a day in one place, with no competing legacy panels", () => {
    expect(homeSource).not.toContain('className="custom-row"');
    expect(homeSource).not.toContain('className="finder-row"');
    expect(homeSource).not.toContain('<p className="metric-label">Exercise finder</p>');
    // The Builder page was a second copy of Training Day - seven panels rendered in
    // both - so it is gone rather than deduplicated panel by panel.
    expect(homeSource).not.toContain('className="builder-upgrade-head"');
    expect(homeSource).not.toContain('workspace === "custom"');
    // The workspace no longer carries a session-mode modifier: the inline logger
    // was a second copy of the tracker the Session destination already owns.
    expect(homeSource).toContain('{workspace === "day-plan" && <section className="day-design-workspace">');
  });
});
