import { describe, expect, it, vi } from "vitest";
import { searchEverything, type SearchResult } from "./universalSearch";

/**
 * Search reaches each region's page (docs/specialization-atlas/10-multi-region.md §6.2): one
 * destination per production region, `specialization#<region>`, named by the page's heading and
 * found by the region's label, its body-map keys and those muscles' names; and "Specialize", the
 * page as a place. The test regions reach the index as production regions through the mocked
 * light index; the reference upper arm has no page and no destination.
 */

vi.mock("@shared/specialization/regionIndex", async (importOriginal) => {
  const { indexWith } = await import("@/components/specialization/__fixtures__/pageRegions");
  return indexWith(await importOriginal(), ["deltoid", "fx_thigh"]);
});

const found = (query: string): SearchResult[] => searchEverything(query, 20).flatMap((group) => group.results);
const destination = (query: string, id: string) => found(query).find((result) => result.type === "destination" && result.id === id) ?? null;

describe("the specialization page in search", () => {
  it("is a place of its own, Specialize, in Body Lab", () => {
    expect(destination("specialize", "specialization")).toMatchObject({ label: "Specialize", context: "Body Lab" });
  });

  it("offers each region's page by its heading, under Body Lab · Specialize", () => {
    expect(destination("forearm specialization", "specialization#forearm")).toMatchObject({ label: "Forearm specialization", context: "Body Lab · Specialize" });
    expect(destination("deltoid specialization", "specialization#deltoid")).toMatchObject({ label: "Deltoid specialization", context: "Body Lab · Specialize" });
  });

  it("finds a region's page by its label, its body-map keys and their muscles' names", () => {
    expect(destination("forearms", "specialization#forearm")).not.toBeNull();
    expect(destination("grip", "specialization#forearm")).not.toBeNull();
    expect(destination("brachioradialis", "specialization#forearm")).not.toBeNull();
    // As before each region had a destination of its own (8e746b4: "wrist" found the forearm page).
    expect(destination("wrist", "specialization#forearm")).not.toBeNull();
    expect(destination("deltoids", "specialization#deltoid")).not.toBeNull();
    expect(destination("fixture thighs", "specialization#fx_thigh")).toMatchObject({ label: "Fixture thighs specialization" });
  });

  it("offers no page for a region that has none", () => {
    expect(found("upper arm").some((result) => result.id === "specialization#upper_arm")).toBe(false);
    expect(found("upper-arm specialization").some((result) => result.id === "specialization#upper_arm")).toBe(false);
  });
});
