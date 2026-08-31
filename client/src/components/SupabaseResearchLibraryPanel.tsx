import React from "react";
import { trpc } from "@/lib/trpc";

export function SupabaseResearchLibraryPanel() {
  const library = trpc.researchEvidence.supabaseLibrary.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (library.isLoading) {
    return <section className="launch-setting" aria-busy="true"><p className="metric-label">Research library</p><p>Loading connected source records…</p></section>;
  }
  if (library.data?.status !== "connected") {
    return <section className="launch-setting"><p className="metric-label">Research library</p><p>Connected source records are temporarily unavailable. Existing reviewed app evidence remains in use.</p></section>;
  }

  return <details className="launch-setting" aria-label="Connected research library">
    <summary><span><strong>Research library</strong><small>{library.data.sources.length} highlighted source records</small></span><em>Browse</em></summary>
    <div className="mt-3 space-y-3">
      <p className="text-xs leading-5 text-[#536b84]">{library.data.boundary}</p>
      <div className="grid gap-2 md:grid-cols-2">
        {library.data.sources.map((source) => <article key={source.id} className="border border-[#d7e3f0] bg-white p-3 text-xs leading-5 text-[#405b77]">
          <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-[#153b61] underline underline-offset-2">{source.title}{source.publicationYear ? ` (${source.publicationYear})` : ""}</a>
          {source.studyType && <p className="mt-1">{source.studyType}</p>}
          {source.populationSummary && <p className="mt-1">{source.populationSummary}</p>}
          <p className="mt-2 font-bold text-[#355b80]">{source.linkedExerciseCount} linked exercise record{source.linkedExerciseCount === 1 ? "" : "s"} · {source.sourceOutcomeCount} indexed outcome{source.sourceOutcomeCount === 1 ? "" : "s"}</p>
        </article>)}
      </div>
    </div>
  </details>;
}
