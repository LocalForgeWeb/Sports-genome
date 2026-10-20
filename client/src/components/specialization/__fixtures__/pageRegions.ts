import type { SpecializationRegion, SpecializationRegionData } from "@shared/specialization/types";
import { deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { fxBack, fxCore, fxShoulder, fxThigh } from "@/lib/specialization/__fixtures__/multiRegion";

/**
 * Test regions given a page, for the page's tests of several regions before a second region ships
 * (docs/specialization-atlas/10-multi-region.md §9.1: wave 0 has the forearm alone). A test mocks
 * the light index (`@shared/specialization/regionIndex`) with `indexWith` and the loader
 * (`@/lib/specialization/loadRegion`) with `loaderWith`, so the page, Home and search meet these
 * regions exactly as they will meet a production one; nothing here is registered, and no
 * component takes a prop for them.
 *
 * Their shapes: the deltoid fixture (paired by the arm, with a drawing), and the calculator's
 * fixture regions (__fixtures__/multiRegion.ts): a thigh paired by the leg, a back paired by the
 * arm with the side word "side", a shoulder paired by the arm, and a midline core.
 */

const asPage = (data: SpecializationRegionData): SpecializationRegionData => ({ ...data, region: { ...data.region, status: "production" } });

export const pageFixtures: Readonly<Record<string, SpecializationRegionData>> = Object.fromEntries(
  [deltoidRegionData, fxThigh, fxBack, fxShoulder, fxCore].map((data) => [data.region.id, asPage(data)] as const),
);

type IndexModule = typeof import("@shared/specialization/regionIndex");
type LoaderModule = typeof import("@/lib/specialization/loadRegion");

/**
 * The light index with these fixture regions given pages, in body order after the registered ones.
 * `only` leaves the registered regions out (a page of fixture regions alone).
 */
export function indexWith(actual: IndexModule, ids: readonly string[], options: { only?: boolean } = {}): IndexModule {
  const extra: SpecializationRegion[] = ids.map((id) => pageFixtures[id].region);
  const registered = [...(options.only ? [] : actual.registeredRegionIndex), ...extra].sort((left, right) => left.sortOrder - right.sortOrder);
  const production = registered.filter((region) => region.status === "production");
  return {
    ...actual,
    registeredRegionIndex: registered,
    specializationRegionIndex: production,
    regionIndexEntry: (id) => (id ? registered.find((region) => region.id === id) ?? null : null),
    regionForBodyMapKey: (key) => (key ? production.find((region) => region.bodyMapKeys.includes(key)) ?? null : null),
  };
}

/** The loader, handing out these fixture regions' data as a region's own import would. */
export function loaderWith(actual: LoaderModule, ids: readonly string[]): LoaderModule {
  const own = new Map(ids.map((id) => [id, pageFixtures[id]] as const));
  return {
    ...actual,
    loadableRegionIds: [...actual.loadableRegionIds, ...ids],
    loadedRegionData: (id) => own.get(id) ?? actual.loadedRegionData(id),
    loadRegionData: (id) => (own.has(id) ? Promise.resolve(own.get(id)!) : actual.loadRegionData(id)),
  };
}
