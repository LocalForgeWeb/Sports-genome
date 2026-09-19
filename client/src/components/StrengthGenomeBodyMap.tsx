import { useCallback, useMemo } from "react";
import React from "react";
import type { StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { catalogMuscleRegionIds } from "../../../shared/strengthGenomeDefinitions";
import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure";
import { AnatomyRegionGrid, type AnatomyRegionRow } from "@/components/anatomy/AnatomyRegionGrid";
import { buildStrengthRegionMap, type AnatomyRole } from "@/lib/anatomyRegions";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";

type RegionState = "OBSERVED_TEST_CONTEXT" | "INSUFFICIENT_DATA";

/**
 * Strength region → the regions this figure draws for it, inverted from the
 * canonical `catalogMuscleRegionIds`. The map this replaces restated the whole
 * relationship against third-party path IDs, and had drifted: it referenced
 * `rhomboids-left`/`rhomboids-right`, which that library never defined, so the
 * upper-back region highlighted only its trapezius half.
 */
const regionToMuscles = buildStrengthRegionMap(catalogMuscleRegionIds);

export function StrengthGenomeBodyMap({ regions, activePriorityIds: _activePriorityIds, selectedRegionId, onSelect }: { regions: (StrengthRegionDefinition & { state: RegionState })[]; activePriorityIds: Set<string>; selectedRegionId?: string; onSelect: (region?: StrengthRegionDefinition) => void }) {
  const regionByMuscle = useMemo(() => new Map(Object.entries(regionToMuscles).flatMap(([regionId, keys]) => keys.map((key) => [key, regionId] as const))), []);
  const regionById = useMemo(() => new Map(regions.map((region) => [region.id, region])), [regions]);
  const labelByMuscle = useMemo(() => new Map(Object.entries(regionToMuscles).flatMap(([regionId, keys]) => keys.map((key) => [key, regionById.get(regionId)?.label ?? regionId] as const))), [regionById]);

  /**
   * Coverage only. Highlighting says a region has lifts on record, never how
   * strong the athlete is, so there is one state here and no magnitude scale.
   * Selection is carried by the figure's outline rather than a second colour.
   */
  const roles = useMemo<Record<string, AnatomyRole>>(() => {
    const map: Record<string, AnatomyRole> = {};
    regions.forEach((region) => {
      if (region.state !== "OBSERVED_TEST_CONTEXT") return;
      (regionToMuscles[region.id] || []).forEach((key) => { map[key] = "primary"; });
    });
    return map;
  }, [regions]);

  const selectedMuscleKeys = useMemo(() => (selectedRegionId ? regionToMuscles[selectedRegionId] ?? [] : []), [selectedRegionId]);

  const chooseMuscle = useCallback((muscleKey: string) => {
    const region = regionById.get(regionByMuscle.get(muscleKey) || "");
    if (!region) return;
    emitInteractionFeedback();
    onSelect(selectedRegionId === region.id ? undefined : region);
  }, [onSelect, regionById, regionByMuscle, selectedRegionId]);

  const chooseRegion = useCallback((regionId: string) => {
    const region = regionById.get(regionId);
    if (!region) return;
    emitInteractionFeedback();
    onSelect(selectedRegionId === region.id ? undefined : region);
  }, [onSelect, regionById, selectedRegionId]);

  const rows = useMemo<AnatomyRegionRow[]>(() => regions.map((region) => ({
    id: region.id,
    label: region.label,
    muscleKeys: regionToMuscles[region.id] ?? [],
    state: region.state === "OBSERVED_TEST_CONTEXT" ? "On record" : "Nothing yet",
    active: region.state === "OBSERVED_TEST_CONTEXT",
  })), [regions]);

  const recordedCount = rows.filter((row) => row.active).length;

  return <section className="strength-body-map" aria-label="Interactive strength context body map">
    <div className="strength-body-map-head"><div><p className="metric-label">Your body</p><h2>Tap a muscle group to see <em>your lifts.</em></h2></div><div className="strength-body-map-actions">{selectedRegionId && <button type="button" aria-label="Clear selected strength region" onClick={() => { emitInteractionFeedback(); onSelect(undefined); }}>Clear</button>}</div></div>
    {/* Front and back together. The flip this replaces was a mode with no
        upside: half your body was always hidden, and a region selected on the
        other side left the card naming a muscle you could not see. */}
    <div className="strength-body-chart">
      <AnatomyFigure
        view="both"
        roles={roles}
        selectedKeys={selectedMuscleKeys}
        onSelect={chooseMuscle}
        labelFor={(key) => labelByMuscle.get(key) ?? key}
      />
      <p className="strength-body-chart-views" aria-hidden="true"><span>Front</span><span>Back</span></p>
    </div>
    <div className="strength-map-legend">
      <span className="strength-map-legend-on"><i />On record</span>
      <span className="strength-map-legend-off"><i />Nothing logged yet</span>
      <small>{recordedCount} of {rows.length} regions</small>
    </div>
    <AnatomyRegionGrid
      rows={rows}
      selectedId={selectedRegionId}
      onSelect={chooseRegion}
      label="Strength Genome regions"
    />
    <p className="strength-body-map-boundary">Tap any muscle group to see what you have logged there. Highlighting shows where you have lifts on record, not how strong you are.</p>
  </section>;
}
