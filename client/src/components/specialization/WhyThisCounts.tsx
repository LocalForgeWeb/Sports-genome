import { ChevronDown } from "lucide-react";
import { categoryFor, currentExposureRule } from "@shared/specialization/rules";
import type { SpecializationRegionData } from "@shared/specialization/types";
import { categoryLabel, evidenceBasisLabels, mappingAction, mappingsBehind, muscleModeLabels, relationshipLabels } from "./model";

/**
 * "Why this counts": the reviewed mapping(s) behind an exercise's credit, said plainly (brief
 * §2 "Mark anatomical inference, experimental evidence, and product accounting choices
 * distinctly", §3 "Source citations at the claim or mapping level", §4 keep anatomy action
 * evidence apart from hypertrophy evidence). For each mapping: the muscle and movement, the
 * relationship and mode, what kind of work the counting rule makes of it, what it rests on
 * (inferred from anatomy, an anatomy reference, measured by EMG …), the written rationale, and
 * each source with where in it and what it cannot show. Closed until opened, so the ledger and
 * the suggestions stay short; nothing in it is hidden behind hover.
 */
export function WhyThisCounts({ data, mappingIds }: { data: SpecializationRegionData; mappingIds: readonly string[] }) {
  const mappings = mappingsBehind(data, mappingIds);
  if (!mappings.length) return null;
  const nodeName = (id: string) => data.nodes.find((node) => node.id === id)?.name ?? id;
  const variantById = new Map(data.variants.map((variant) => [variant.id, variant] as const));
  const sourceById = new Map(data.sources.map((source) => [source.id, source] as const));
  const bases = Array.from(new Set(mappings.map((mapping) => evidenceBasisLabels[mapping.evidenceBasis])));
  return <details className="spz-disclosure spz-why">
    <summary><span><b>Why this counts</b><small>{bases.join(" · ")}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
    <ul className="spz-why-list">
      {mappings.map((mapping) => {
        const action = mappingAction(data, mapping)?.label ?? null;
        const variant = variantById.get(mapping.variantId);
        const counted = variant ? categoryLabel(categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold), data.region.wording) : null;
        return <li key={`${mapping.versionKey}/${mapping.id}`}>
          <p className="spz-why-head"><b>{nodeName(mapping.nodeId)}{action ? ` · ${action}` : ""}</b></p>
          <p className="spz-why-line">{relationshipLabels[mapping.relationship]}, {muscleModeLabels[mapping.muscleMode]}{counted ? `. Counted as ${counted.toLowerCase()}.` : "."}</p>
          <p className="spz-why-basis"><span className="spz-badge">{evidenceBasisLabels[mapping.evidenceBasis]}</span>{mapping.reviewStatus !== "reviewed" ? <small>Not reviewed yet</small> : null}</p>
          <p className="spz-why-rationale">{mapping.rationale}</p>
          {mapping.sources.length ? <ul className="spz-sources">
            {mapping.sources.map((ref) => {
              const source = sourceById.get(ref.sourceId);
              if (!source) return null;
              return <li key={`${mapping.id}-${ref.sourceId}`}>
                <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>{ref.locator ? ` · ${ref.locator}` : ""}
                {ref.limitation ? <small> Limit: {ref.limitation}</small> : null}
              </li>;
            })}
          </ul> : <p className="spz-note">No source is recorded for this mapping.</p>}
        </li>;
      })}
    </ul>
    <p className="spz-note">Which kind of work a mapping counts as is set by the counting rule ({currentExposureRule.id}), a Sports Genome choice; the sources speak to what the muscle does, not to how much it grows.</p>
  </details>;
}
