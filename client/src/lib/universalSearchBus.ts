/**
 * Lets a bounded local search hand its query up to universal search, which the
 * philosophy's "Universal search and retrieval contract" (FIXED) requires:
 *
 *   "Local inline search remains allowed inside bounded collections but must
 *    state its scope and offer broadening when appropriate."
 *
 * A window event rather than a context provider, because the local searches are
 * spread across lazily-loaded workspaces and only need one direction of travel.
 */
export const UNIVERSAL_SEARCH_OPEN_EVENT = "sports-genome:open-universal-search";

export type UniversalSearchOpenDetail = { query: string };

export function openUniversalSearch(query = "") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UniversalSearchOpenDetail>(UNIVERSAL_SEARCH_OPEN_EVENT, { detail: { query } }));
}
