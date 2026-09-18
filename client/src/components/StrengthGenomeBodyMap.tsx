import { useCallback, useMemo, useState } from "react";
import React from "react";
import { RotateCw } from "lucide-react";
import type { StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { catalogMuscleRegionIds } from "../../../shared/strengthGenomeDefinitions";
import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure";
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
  const [view, setView] = useState<"front" | "back">("front");
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

  return <section className="strength-body-map" aria-label="Interactive strength context body map">
    <div className="strength-body-map-head"><div><p className="metric-label">Your body</p><h2>Tap a muscle group to see <em>your lifts.</em></h2></div><div className="strength-body-map-actions"><button type="button" onClick={() => { emitInteractionFeedback(); setView((current) => current === "front" ? "back" : "front"); }}><RotateCw className="h-4 w-4" /> {view === "front" ? "Back" : "Front"}</button>{selectedRegionId && <button type="button" aria-label="Clear selected strength region" onClick={() => { emitInteractionFeedback(); onSelect(undefined); }}>Clear</button>}</div></div>
    <div className="strength-body-chart">
      <AnatomyFigure
        view={view}
        roles={roles}
        selectedKeys={selectedMuscleKeys}
        onSelect={chooseMuscle}
        labelFor={(key) => labelByMuscle.get(key) ?? key}
      />
    </div>
    <details className="strength-map-region-selector">
      <summary>Choose a region</summary>
      <div role="list" aria-label="Strength Genome regions">
        {regions.map((region) => <button key={region.id} type="button" role="listitem" aria-pressed={selectedRegionId === region.id} onClick={() => { emitInteractionFeedback(); onSelect(selectedRegionId === region.id ? undefined : region); }}><span>{region.label}</span><small>{region.state === "OBSERVED_TEST_CONTEXT" ? "On record" : "Nothing yet"}</small></button>)}
      </div>
    </details>
    <p className="strength-body-map-boundary">Tap any muscle group to see what you have logged there. Highlighting shows where you have lifts on record, not how strong you are.</p>
  </section>;
}
