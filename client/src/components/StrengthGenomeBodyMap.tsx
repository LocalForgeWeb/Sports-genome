import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import React from "react";
import type { StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { catalogMuscleRegionIds } from "../../../shared/strengthGenomeDefinitions";
import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure";
import { AnatomyRegionGrid, type AnatomyRegionRow } from "@/components/anatomy/AnatomyRegionGrid";
import { buildStrengthRegionMap, type AnatomyRole } from "@/lib/anatomyRegions";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { anatomySides, defaultAnatomySide, sideForSelection, sideLabel, turnToSideLabel, type AnatomySide } from "@/lib/anatomySide";
import { confidenceLabel, type RankId, type RegionRank } from "@shared/capabilityRank";
import { RankLegend, displayPercentile, rankPercentileText } from "@/components/CapabilityRank";
import { ordinal } from "@/lib/strengthPercentileCard";

type RegionState = "OBSERVED_TEST_CONTEXT" | "INSUFFICIENT_DATA";

/**
 * Strength region → the regions this figure draws for it, inverted from the
 * canonical `catalogMuscleRegionIds`. The map this replaces restated the whole
 * relationship against third-party path IDs, and had drifted: it referenced
 * `rhomboids-left`/`rhomboids-right`, which that library never defined, so the
 * upper-back region highlighted only its trapezius half.
 */
const regionToMuscles = buildStrengthRegionMap(catalogMuscleRegionIds);

/**
 * Two encodings, one figure. With `regionRanks` the map is in Strength/Rank mode: fill is the
 * athlete's estimated capability rank, unscored groups are hatched outside the scale, and the
 * legend becomes the seven labelled bands. Without it the map is the coverage view it always
 * was - where lifts are on record, and nothing about how strong - with its own legend. Each
 * mode keeps its own meaning; neither borrows the other's colours.
 */
export function StrengthGenomeBodyMap({ regions, activePriorityIds: _activePriorityIds, selectedRegionId, onSelect, regionRanks = null, rankNotice = null }: { regions: (StrengthRegionDefinition & { state: RegionState })[]; activePriorityIds: Set<string>; selectedRegionId?: string; onSelect: (region?: StrengthRegionDefinition) => void; regionRanks?: ReadonlyMap<string, RegionRank> | null; rankNotice?: ReactNode }) {
  const rankMode = regionRanks !== null;
  const [activeBand, setActiveBand] = useState<RankId | null>(null);
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

  /**
   * Every drawn key of every Strength Genome region: its region's rank, or "unscored". Keys that
   * belong to no region are left out, so the figure draws them as plain anatomy.
   */
  const rankFor = useMemo<Record<string, RankId | "unscored"> | undefined>(() => {
    if (!regionRanks) return undefined;
    const map: Record<string, RankId | "unscored"> = {};
    Object.entries(regionToMuscles).forEach(([regionId, keys]) => {
      const rankId = regionRanks.get(regionId)?.rank.id ?? "unscored";
      keys.forEach((key) => { map[key] = rankId; });
    });
    return map;
  }, [regionRanks]);

  /** The figure's accessible name for a region, carrying rank, percentile and confidence as words. */
  const describeRegion = useCallback((regionId: string, label: string) => {
    const regionRank = regionRanks?.get(regionId);
    return regionRank
      ? `${label}, ${regionRank.rank.fullName} rank, ${rankPercentileText(regionRank).toLowerCase()}, estimated, ${confidenceLabel[regionRank.confidence].toLowerCase()}`
      : `${label}, not scored`;
  }, [regionRanks]);

  const rows = useMemo<AnatomyRegionRow[]>(() => regions.map((region) => {
    const regionRank = regionRanks?.get(region.id);
    if (rankMode) {
      return {
        id: region.id,
        label: region.label,
        muscleKeys: regionToMuscles[region.id] ?? [],
        state: regionRank ? `${regionRank.rank.shortName} · ${ordinal(displayPercentile(regionRank.representative.percentile))}` : "Not scored",
        active: Boolean(regionRank),
        rankId: regionRank?.rank.id,
        highlighted: Boolean(activeBand && regionRank?.rank.id === activeBand),
      };
    }
    return {
      id: region.id,
      label: region.label,
      muscleKeys: regionToMuscles[region.id] ?? [],
      state: region.state === "OBSERVED_TEST_CONTEXT" ? "On record" : "Nothing yet",
      active: region.state === "OBSERVED_TEST_CONTEXT",
    };
  }), [regions, regionRanks, rankMode, activeBand]);

  const regionLabelsByRank = useMemo(() => {
    const map = new Map<RankId, string[]>();
    regions.forEach((region) => {
      const rankId = regionRanks?.get(region.id)?.rank.id;
      if (rankId) map.set(rankId, [...(map.get(rankId) ?? []), region.label]);
    });
    return map;
  }, [regions, regionRanks]);

  const recordedCount = rows.filter((row) => row.active).length;

  // One body at a time, front first. The figure turns around by itself only when
  // the selection is drawn on the side facing away, so choosing a region from
  // the list below can never leave the card naming a muscle that is not on
  // screen - the failure the side-by-side layout existed to avoid.
  const [side, setSide] = useState<AnatomySide>(defaultAnatomySide);
  useEffect(() => { setSide((current) => sideForSelection(current, selectedMuscleKeys)); }, [selectedMuscleKeys]);

  return <section className="strength-body-map" aria-label="Interactive strength context body map">
    {/* Front / Back are the map's own local tabs, the reference's composition. The
        selection follows the turn: a region drawn on the side facing away turns
        the figure by itself, so the caption below can never name a muscle that
        is not on screen. */}
    <div className="strength-body-map-head">
      <div className="strength-body-chart-views" role="group" aria-label="Side of the body shown">
        {anatomySides.map((candidate) => <button key={candidate} type="button" className="strength-body-side-toggle" aria-pressed={side === candidate} aria-label={side === candidate ? `${sideLabel(candidate)} of the body, shown` : `${turnToSideLabel(side)} of the body`} onClick={() => { if (side === candidate) return; emitInteractionFeedback(); setSide(candidate); }}>{sideLabel(candidate)}</button>)}
      </div>
      <div className="strength-body-map-actions">{selectedRegionId && <button type="button" aria-label="Clear selected strength region" onClick={() => { emitInteractionFeedback(); onSelect(undefined); }}>Clear</button>}</div>
    </div>
    <div className="strength-body-map-stage">
      <div className="strength-body-chart">
        <AnatomyFigure
          view={side}
          roles={roles}
          selectedKeys={selectedMuscleKeys}
          onSelect={chooseMuscle}
          labelFor={(key) => labelByMuscle.get(key) ?? key}
          rankFor={rankFor}
          describeFor={rankMode ? (key) => { const regionId = regionByMuscle.get(key); if (regionId) return describeRegion(regionId, labelByMuscle.get(key) ?? key); const name = labelByMuscle.get(key) ?? key; return `${name.charAt(0).toUpperCase()}${name.slice(1)}, not part of any strength region`; } : undefined}
        />
      </div>
      {rankMode ? (
        <RankLegend activeBand={activeBand} onBand={setActiveBand} regionLabelsByRank={regionLabelsByRank} />
      ) : (
        <div className="strength-map-legend">
          <p className="metric-label">Your body</p>
          <span className="strength-map-legend-on"><i />On record</span>
          <span className="strength-map-legend-off"><i />Nothing logged yet</span>
          <small>{recordedCount} of {rows.length} regions</small>
        </div>
      )}
    </div>
    <p className="strength-body-map-caption">Tap a muscle group to see <em>{rankMode ? "your rank." : "your lifts."}</em></p>
    {rankNotice}
    <AnatomyRegionGrid
      rows={rows}
      selectedId={selectedRegionId}
      onSelect={chooseRegion}
      label="Strength Genome regions"
    />
    <p className="strength-body-map-boundary">{rankMode
      ? "Colour is each muscle group's estimated rank against the comparison group named in its detail. Hatched groups have no percentile yet."
      : "Highlighting shows where you have lifts on record, not how strong you are."}</p>
  </section>;
}
