import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(import.meta.dirname, "Home.tsx"), "utf8");
const catalogSource = readFileSync(resolve(import.meta.dirname, "../components/CatalogDiscoveryPanel.tsx"), "utf8");
const catalogStyles = readFileSync(resolve(import.meta.dirname, "../catalog-discovery.css"), "utf8");
const globalStyles = readFileSync(resolve(import.meta.dirname, "../index.css"), "utf8");

describe("canonical connected exercise catalog", () => {
  it("uses Catalog Discovery with the selected sport-action connection helper", () => {
    expect(homeSource).toContain("connectionForExercise={(exercise) => getExerciseActionConnection(exercise, enrichedSelectedMovement)}");
    expect(homeSource).toContain("selectedActionLabel={selectedMovement.label}");
    expect(catalogSource).toContain("catalog-action-link");
    expect(catalogSource).toContain("connection.label");
    expect(catalogSource).toContain("All action links");
    expect(catalogSource).toContain("Direct support");
    expect(catalogSource).toContain("Supporting link");
    expect(catalogSource).not.toContain("Any sport fit");
    expect(catalogSource).not.toContain("A-grade or higher");
  });

  it("mounts the canonical connection-aware Exercise Genome workspace with the same selected action", () => {
    expect(homeSource).toContain("<ExerciseGenomeWorkspace exercises={filteredCatalog}");
    expect(homeSource).toContain("enrichedSelectedMovement={enrichedSelectedMovement}");
    expect(homeSource).toContain("selectedMovement={selectedMovement}");
  });

	  it("keeps only actionable mobile Catalog connection states visible and visually distinct without presenting them as performance ratings", () => {
    expect(catalogSource).toContain("connection.label}{selectedActionLabel ? ` · ${selectedActionLabel}` : \"\"}");
	    expect(catalogSource).toContain('connection && connection.label !== "Not mapped"');
    expect(catalogStyles).toContain(".catalog-action-link-direct-support");
    expect(catalogStyles).toContain(".catalog-action-link-supporting-link");
	    expect(catalogStyles).not.toContain(".catalog-action-link-not-mapped");
    expect(catalogStyles).toContain(".catalog-discovery-list { grid-template-columns: 1fr; }");
    expect(catalogStyles).toContain(".catalog-action-link { display: inline-flex; width: fit-content; max-width: 100%;");
  });

  it("keeps Movement Atlas labels readable after the Explore workspace applies its dark operational surface", () => {
    expect(globalStyles).toContain(".destination-explore .atlas-action-item strong { color: #f7fbff; }");
    expect(globalStyles).toContain(".destination-explore .atlas-action-item > span { color: #d3e5f5; }");
    expect(globalStyles).toContain(".destination-explore .atlas-action-item svg { color: #84b6ff; }");
  });

  it("does not restore the duplicate cramped legacy catalog grid", () => {
    expect(homeSource).not.toContain('300 tools.<br /><em className="text-[#e4512e]">Mapped on purpose.</em>');
    expect(homeSource).not.toContain('className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{filteredCatalog.map');
  });

  it("renders one canonical Custom Builder instead of competing legacy panels", () => {
    expect(homeSource).not.toContain('className="custom-row"');
    expect(homeSource).not.toContain('className="finder-row"');
    expect(homeSource).not.toContain('<p className="metric-label">Exercise finder</p>');
    expect(homeSource).toContain('className="builder-upgrade-head"');
  });
});
