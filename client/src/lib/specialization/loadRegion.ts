import type { RegionId, SpecializationRegionData } from "@shared/specialization/types";

/**
 * A production region's page data, loaded when the page shows that region
 * (docs/specialization-atlas/10-multi-region.md §6.1): the region's content and drawing, composed
 * with the content (never the drawings) of its external members' home regions, as its folder's
 * `index.ts` composes it. Each loader is its own dynamic import, so opening the forearm downloads
 * the forearm and nothing of a region it does not list; the region picker reads only the light
 * index (`regionIndex.ts`).
 *
 * A wave that ships a region adds one line here; client/src/lib/specialization/loadRegion.test.ts
 * holds this table to the production regions of the index, and each loader to the registry's data.
 */
const loaders: Readonly<Record<RegionId, () => Promise<SpecializationRegionData>>> = {
  forearm: () => import("@shared/specialization/regions/forearm").then((module) => module.forearmRegionData),
};

/** The regions this build can load, for the test that holds the table to the index. */
export const loadableRegionIds: readonly RegionId[] = Object.keys(loaders);

const loaded = new Map<RegionId, SpecializationRegionData>();
const pending = new Map<RegionId, Promise<SpecializationRegionData | null>>();

/** A region's data when it has already loaded in this visit, so returning to it shows it at once. */
export function loadedRegionData(id: RegionId): SpecializationRegionData | null {
  return loaded.get(id) ?? null;
}

/** Loads a region's page data once per visit; null for a region with no page. A failed load is not kept, so the next call tries again. */
export function loadRegionData(id: RegionId): Promise<SpecializationRegionData | null> {
  const ready = loaded.get(id);
  if (ready) return Promise.resolve(ready);
  const running = pending.get(id);
  if (running) return running;
  const loader = Object.prototype.hasOwnProperty.call(loaders, id) ? loaders[id] : null;
  if (!loader) return Promise.resolve(null);
  const next = loader().then(
    (data) => { loaded.set(id, data); pending.delete(id); return data; },
    (error: unknown) => { pending.delete(id); throw error; },
  );
  pending.set(id, next);
  return next;
}

/**
 * Starts loading a region's page data without waiting for it. Home calls it as it renders the
 * page, so the region's chunk downloads beside the page's own: loaded from the page's effect, it
 * waited for the page's first commit, which React holds back by its Suspense reveal throttle
 * (about 300 ms), and the summary then rendered after it instead of during it. A failure is left
 * to the page, which asks again (a failed load is not kept) and says so.
 */
export function preloadRegionData(id: RegionId): void {
  loadRegionData(id).catch(() => undefined);
}

/** Settles once every load started so far has, loaded or failed: the page's lazy import waits for it, so its first render has its region. */
export function regionLoadsSettled(): Promise<void> {
  return Promise.allSettled(Array.from(pending.values())).then(() => undefined);
}
