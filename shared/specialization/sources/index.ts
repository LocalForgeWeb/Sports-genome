import type { Source, SourceId } from "../types";
import { forearmSources } from "./forearm";
import { forearmMappingSources } from "./forearmMappings";

/**
 * The shared source library (docs/specialization-atlas/10-multi-region.md §1.3): every source
 * any region cites, each under one key. The forearm's keys (S1–S8, A1–A55, M1–M8) are kept as
 * shipped; new keys are stable slugs, `<publisher>.<topic>` (`statpearls.deltoid`) or
 * `pmid.<number>`, in `sources/<region>.ts`, and a source two lanes both add moves to
 * `sources/shared.ts`. A key is never reused and a URL is never filed under a second key
 * (client/src/lib/specialization/regionContent.test.ts).
 *
 * This index is for readers of the whole library (tests, the seed). A region's page data lists
 * the sources it cites from the library files themselves, so a page never loads every region's
 * sources.
 */
export const sourceLibrary: readonly Source[] = [...forearmSources, ...forearmMappingSources];

export const sourceById: ReadonlyMap<SourceId, Source> = new Map(sourceLibrary.map((source) => [source.id, source]));
