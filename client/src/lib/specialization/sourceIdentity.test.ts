import { describe, expect, it } from "vitest";
import { sourceLibrary } from "@shared/specialization/sources";
import type { Source } from "@shared/specialization/types";

/**
 * One paper, one key (11-forearm-research-and-stack.md §1.5, "A test the library lacks"): the URL
 * test cannot see a paper filed twice under a PubMed, a PMC and a doi.org URL. This refuses two
 * library sources with one DOI, one PubMed id (from a `pmid.` key or a PubMed URL) or one PMC
 * article, with A4 and M1, the shipped pair, the one listed exception. It runs before any new
 * source key joins the library.
 */

const shippedDuplicates = [["A4", "M1"]];

/** Every identity a source claims: its DOI, its PubMed id, its PMC article. */
function identitiesOf(source: Source): string[] {
  const out = new Set<string>();
  const doi = source.doi ?? /doi\.org\/(10\.[^\s?#]+)/i.exec(source.url)?.[1] ?? null;
  if (doi) out.add(`doi:${doi.toLowerCase().replace(/\/+$/, "")}`);
  const pmidFromKey = /^pmid\.(\d+)$/.exec(source.id)?.[1];
  const pmidFromUrl = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i.exec(source.url)?.[1];
  for (const pmid of [pmidFromKey, pmidFromUrl]) if (pmid) out.add(`pmid:${pmid}`);
  const pmc = /(PMC\d+)/i.exec(source.url)?.[1];
  if (pmc) out.add(`pmc:${pmc.toUpperCase()}`);
  return Array.from(out);
}

describe("the source library: one paper, one key", () => {
  it("reads a source's DOI, PubMed id and PMC article", () => {
    expect(identitiesOf({ id: "pmid.27174923", url: "https://pubmed.ncbi.nlm.nih.gov/27174923/", title: "", doi: "10.1152/japplphysiol.00154.2016", evidenceType: "longitudinal", retrievedOn: "2026-10-21", notes: null }).sort()).toEqual(["doi:10.1152/japplphysiol.00154.2016", "pmid:27174923"]);
    expect(identitiesOf({ id: "x.y", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4526813/", title: "", doi: null, evidenceType: "emg", retrievedOn: "2026-10-21", notes: null })).toEqual(["pmc:PMC4526813"]);
    expect(identitiesOf({ id: "x.z", url: "https://doi.org/10.1007/S40279-025-02344-W", title: "", doi: null, evidenceType: "systematic_review", retrievedOn: "2026-10-21", notes: null })).toEqual(["doi:10.1007/s40279-025-02344-w"]);
  });

  it("files no paper under two keys, but the shipped pair", () => {
    const byIdentity = new Map<string, string[]>();
    for (const source of sourceLibrary) for (const identity of identitiesOf(source)) byIdentity.set(identity, [...(byIdentity.get(identity) ?? []), source.id]);
    const duplicates = Array.from(new Set(Array.from(byIdentity.values()).filter((keys) => keys.length > 1).map((keys) => JSON.stringify([...keys].sort())))).map((text) => JSON.parse(text) as string[]);
    expect(duplicates).toEqual(shippedDuplicates);
  });
});
