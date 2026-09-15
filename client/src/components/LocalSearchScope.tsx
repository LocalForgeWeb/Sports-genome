import React from "react";
import { openUniversalSearch } from "@/lib/universalSearchBus";

/**
 * The scope-and-broaden line every bounded local search carries, per the
 * "Universal search and retrieval contract" (FIXED): local search "must state
 * its scope and offer broadening when appropriate."
 *
 * One muted line, not a banner — calm_precision's anti-pattern is "excessive
 * badges, competing highlights". Colour comes from the inherited label and link
 * variables, so the same component reads correctly on a light card and on a
 * dark panel without a tone prop to keep in sync.
 */
export function LocalSearchScope({ scope, query = "" }: { scope: string; query?: string }) {
  return <p className="local-search-scope">
    <span>{scope}</span>
    <button type="button" onClick={() => openUniversalSearch(query)}>Search everything</button>
  </p>;
}
