import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    researchEvidence: {
      supabaseLibrary: {
        useQuery: () => ({
          isLoading: false,
          data: {
            status: "connected",
            boundary: "Metadata only; no athlete rank.",
            sources: [{ id: "study-1", title: "Source-bound study", publicationYear: 2025, sourceUrl: "https://example.org/study", studyType: "intervention", populationSummary: "Adults", evidenceLevel: "direct", linkedExerciseCount: 3, sourceOutcomeCount: 4 }],
          },
        }),
      },
    },
  },
}));

import { SupabaseResearchLibraryPanel } from "./SupabaseResearchLibraryPanel";

describe("Supabase research library panel", () => {
  it("renders citation metadata and record counts without turning source data into an athlete score", () => {
    const markup = renderToStaticMarkup(React.createElement(SupabaseResearchLibraryPanel));
    expect(markup).toContain("Research library");
    expect(markup).toContain("Source-bound study (2025)");
    expect(markup).toContain("3 linked exercise records");
    expect(markup).toContain("4 indexed outcomes");
    expect(markup).toContain("Metadata only; no athlete rank.");
    expect(markup).not.toContain("percentile");
  });
});
