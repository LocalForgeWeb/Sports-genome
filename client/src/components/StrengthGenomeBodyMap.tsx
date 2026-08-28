import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { BodyChart, ViewSide } from "body-muscles";
import { RotateCw } from "lucide-react";
import type { StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";

type RegionState = "OBSERVED_TEST_CONTEXT" | "INSUFFICIENT_DATA";

const regionToMuscles: Record<string, string[]> = {
  shoulders: ["shoulder-front-left", "shoulder-front-right", "shoulder-side-left", "shoulder-side-right", "deltoid-rear-left", "deltoid-rear-right"],
  chest: ["chest-upper-left", "chest-upper-right", "chest-lower-left", "chest-lower-right"],
  upper_back: ["traps-upper-left", "traps-upper-right", "traps-mid-left", "traps-mid-right", "rhomboids-left", "rhomboids-right"],
  lats: ["lats-upper-left", "lats-upper-right", "lats-mid-left", "lats-mid-right", "lats-lower-left", "lats-lower-right"],
  biceps: ["biceps-left", "biceps-right"], triceps: ["triceps-long-left", "triceps-long-right", "triceps-lateral-left", "triceps-lateral-right"],
  forearms_grip: ["forearm-left", "forearm-right", "forearm-flexors-left", "forearm-flexors-right", "forearm-extensors-left", "forearm-extensors-right"],
  abdominals: ["abs-upper-left", "abs-upper-right", "abs-lower-left", "abs-lower-right"], obliques: ["obliques-left", "obliques-right"],
  spinal_erectors: ["lower-back-erectors-left", "lower-back-erectors-right", "lower-back-ql-left", "lower-back-ql-right"],
  glutes: ["gluteus-maximus-left", "gluteus-maximus-right"], hip_flexors: ["hip-flexor-left", "hip-flexor-right"],
  hip_adductors: ["adductors-left", "adductors-right"], hip_abductors: ["gluteus-medius-left", "gluteus-medius-right"],
  quadriceps: ["quads-left", "quads-right"], hamstrings: ["hamstrings-medial-left", "hamstrings-medial-right", "hamstrings-lateral-left", "hamstrings-lateral-right"],
  calves: ["calves-gastroc-medial-left", "calves-gastroc-medial-right", "calves-gastroc-lateral-left", "calves-gastroc-lateral-right", "calves-soleus-left", "calves-soleus-right"],
  tibialis_anterior: ["tibialis-anterior-left", "tibialis-anterior-right"],
};

export function StrengthGenomeBodyMap({ regions, activePriorityIds, selectedRegionId, onSelect }: { regions: (StrengthRegionDefinition & { state: RegionState })[]; activePriorityIds: Set<string>; selectedRegionId?: string; onSelect: (region: StrengthRegionDefinition) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const [view, setView] = useState<"FRONT" | "BACK">("FRONT");
  const [failed, setFailed] = useState(false);
  const regionByMuscle = useMemo(() => new Map(Object.entries(regionToMuscles).flatMap(([regionId, ids]) => ids.map((id) => [id, regionId]))), []);
  const regionById = useMemo(() => new Map(regions.map((region) => [region.id, region])), [regions]);
  const bodyState = useMemo(() => {
    const state: Record<string, { intensity: number; selected: boolean }> = {};
    regions.forEach((region) => {
      const intensity = region.state === "OBSERVED_TEST_CONTEXT" ? 9 : activePriorityIds.has(region.id) ? 6 : 0;
      (regionToMuscles[region.id] || []).forEach((muscleId) => { state[muscleId] = { intensity, selected: selectedRegionId === region.id }; });
    });
    return state;
  }, [activePriorityIds, regions, selectedRegionId]);

  useEffect(() => {
    if (failed || !mapRef.current) return;
    chartRef.current?.destroy();
    try {
      chartRef.current = new BodyChart(mapRef.current, { view: view === "FRONT" ? ViewSide.FRONT : ViewSide.BACK, bodyState, enableTransitions: true, onMuscleClick: (muscleId: string) => {
        const region = regionById.get(regionByMuscle.get(muscleId) || "");
        if (region) onSelect(region);
      } });
    } catch { setFailed(true); }
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [failed, onSelect, regionById, regionByMuscle, view]);
  useEffect(() => { chartRef.current?.update({ bodyState }); }, [bodyState]);

  return <section className="strength-body-map" aria-label="Interactive strength context body map">
    <div className="strength-body-map-head"><div><p className="metric-label">Regional context map</p><h2>Tap a region to inspect <em>your record.</em></h2></div><button type="button" onClick={() => setView((current) => current === "FRONT" ? "BACK" : "FRONT")}><RotateCw className="h-4 w-4" /> {view === "FRONT" ? "Back" : "Front"}</button></div>
    {failed ? <p className="strength-body-map-fallback">The anatomy view is unavailable. Use a standardized observation to build your record.</p> : <div ref={mapRef} className="strength-body-chart" />}
    <details className="strength-map-region-selector">
      <summary>Choose a region</summary>
      <div role="list" aria-label="Strength Genome regions">
        {regions.map((region) => <button key={region.id} type="button" role="listitem" aria-pressed={selectedRegionId === region.id} onClick={() => onSelect(region)}><span>{region.label}</span><small>{region.state === "OBSERVED_TEST_CONTEXT" ? "Recorded" : "No test"}</small></button>)}
      </div>
    </details>
    <div className="strength-body-map-legend"><span><i className="strength-map-observed" /> Recorded test context</span><span><i className="strength-map-focus" /> Athlete-selected focus</span><span><i className="strength-map-empty" /> No mapped test context</span></div>
    <p className="strength-body-map-boundary">Map color shows available record context only. It is not muscle activation, a strength rank, or a percentile.</p>
  </section>;
}
