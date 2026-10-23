import { useEffect, useState } from "react";
import type { RegionExtras, RegionId } from "@shared/specialization/types";

/**
 * A region's extras, loaded only when a section that reads them opens (docs/specialization-atlas/
 * note 11, §3.10): its rep profiles (`regions/<region>/repProfiles.ts`) and,
 * from F2, its tendon areas (`regions/<region>/tendonAreas.ts`). Region-agnostic: the files are found
 * by their place in the tree (`import.meta.glob`), so a later region gets the stack by adding its
 * file, with no code. Each file is its own chunk, fetched on first use and kept for the visit; the
 * page's closed state downloads none of them.
 *
 * A file exports its part under any name (`repProfileExtras`); every exported object that names a
 * region is read, and a region's parts are merged into one `RegionExtras`. A region whose content
 * sets `sections.stack` has a profile file, and one that sets `sections.tendonExposure` a tendon file
 * (regionExtras.test.ts holds both ways).
 */

type ExtrasModule = Record<string, unknown>;
export type RegionExtrasKind = "repProfiles" | "tendonAreas";

const loaders: Record<RegionExtrasKind, Record<string, () => Promise<ExtrasModule>>> = {
  repProfiles: import.meta.glob<ExtrasModule>("../../../../shared/specialization/regions/*/repProfiles.ts"),
  tendonAreas: import.meta.glob<ExtrasModule>("../../../../shared/specialization/regions/*/tendonAreas.ts"),
};

const regionOfPath = (path: string): RegionId | null => /regions\/([^/]+)\/[^/]+\.ts$/.exec(path)?.[1] ?? null;

/** The extras files this build has, by region and kind. */
export function regionExtrasFiles(): { regionId: RegionId; kind: RegionExtrasKind }[] {
  return (Object.keys(loaders) as RegionExtrasKind[]).flatMap((kind) => Object.keys(loaders[kind]).map((path) => ({ regionId: regionOfPath(path)!, kind })).filter((file) => file.regionId !== null));
}

/** Whether the region has an extras file (of that kind, or of any). */
export function hasRegionExtras(regionId: RegionId, kind?: RegionExtrasKind): boolean {
  return regionExtrasFiles().some((file) => file.regionId === regionId && (!kind || file.kind === kind));
}

const isExtras = (value: unknown, regionId: RegionId): value is RegionExtras => typeof value === "object" && value !== null && (value as RegionExtras).regionId === regionId;

function merge(regionId: RegionId, parts: readonly RegionExtras[]): RegionExtras | null {
  if (!parts.length) return null;
  const out: RegionExtras = { regionId };
  for (const part of parts) {
    const sources = [...(out.referenceSources ?? []), ...(part.referenceSources ?? [])];
    Object.assign(out, part);
    if (sources.length) out.referenceSources = sources.filter((source, index) => sources.findIndex((other) => other.id === source.id) === index);
  }
  return out;
}

const loaded = new Map<RegionId, RegionExtras | null>();
const pending = new Map<RegionId, Promise<RegionExtras | null>>();

/** The region's extras if they have been loaded this visit; `undefined` when they have not (null: the region has none). */
export function loadedRegionExtras(regionId: RegionId): RegionExtras | null | undefined {
  if (loaded.has(regionId)) return loaded.get(regionId) ?? null;
  return hasRegionExtras(regionId) ? undefined : null;
}

/** Loads the region's extras (each of its files once), merged; null for a region with none. A failed import rejects, and is tried again on the next call. */
export function loadRegionExtras(regionId: RegionId): Promise<RegionExtras | null> {
  const known = loadedRegionExtras(regionId);
  if (known !== undefined) return Promise.resolve(known);
  const inFlight = pending.get(regionId);
  if (inFlight) return inFlight;
  const files = (Object.keys(loaders) as RegionExtrasKind[]).flatMap((kind) => Object.entries(loaders[kind]).filter(([path]) => regionOfPath(path) === regionId).map(([, load]) => load));
  const load = Promise.all(files.map((file) => file()))
    .then((modules) => {
      const extras = merge(regionId, modules.flatMap((module) => Object.values(module).filter((value) => isExtras(value, regionId))));
      loaded.set(regionId, extras);
      return extras;
    })
    .finally(() => { pending.delete(regionId); });
  pending.set(regionId, load);
  return load;
}

export type RegionExtrasState = { status: "loading"; extras: null } | { status: "ready"; extras: RegionExtras | null } | { status: "error"; extras: null };

/** The region's extras for a component: loading until they arrive (never a default in their place), then ready, or an error. */
export function useRegionExtras(regionId: RegionId, enabled = true): RegionExtrasState {
  const initial = (): RegionExtrasState => {
    const known = loadedRegionExtras(regionId);
    return known === undefined ? { status: "loading", extras: null } : { status: "ready", extras: known };
  };
  const [state, setState] = useState<RegionExtrasState>(initial);
  useEffect(() => {
    if (!enabled) return;
    const known = loadedRegionExtras(regionId);
    if (known !== undefined) { setState((current) => (current.status === "ready" && current.extras === known ? current : { status: "ready", extras: known })); return; }
    let live = true;
    setState({ status: "loading", extras: null });
    loadRegionExtras(regionId).then(
      (extras) => { if (live) setState({ status: "ready", extras }); },
      () => { if (live) setState({ status: "error", extras: null }); },
    );
    return () => { live = false; };
  }, [regionId, enabled]);
  return state;
}
