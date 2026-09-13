import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Exercise } from "@/lib/exerciseCatalog";
import type {
  SupabaseSportExerciseRecommendation,
  SupabaseSportMovementDemand,
  SupabaseSportMuscleDemand,
} from "@shared/supabaseSportProfile";

function formatLabel(value: string | null) {
  return value ? value.replace(/_/g, " ") : null;
}

/**
 * Ordinal, not numeric: the philosophy blueprint's Confidence & Uncertainty domain
 * (Compact confidence display contract) prohibits showing a raw "confidence %" unless
 * the number is a formally calibrated probability. The registry's confidence_score is
 * an evidence-quality judgment, not that, so it renders as Low/Moderate/High only.
 */
function confidenceLabel(value: number | null): "Low" | "Moderate" | "High" | null {
  if (value === null) return null;
  if (value >= 0.85) return "High";
  if (value >= 0.6) return "Moderate";
  return "Low";
}

function shortReason(recommendation: SupabaseSportExerciseRecommendation) {
  const role = formatLabel(recommendation.recommendationRole);
  if (role) return role;
  const firstSentence = recommendation.rationale?.split(/(?<=\.)\s+/)[0];
  return firstSentence || null;
}

/**
 * Aligned label+bar rows, not a radar/spider chart: the philosophy blueprint's Data
 * Visualization domain (Sport Profile demand-map contract) explicitly prohibits radar
 * as the primary quantitative view because polygon area misleadingly implies overall
 * fit. A single-value, magnitude-from-zero bar per row is the compliant fallback here
 * since athlete capability isn't paired against it (that's a larger future feature).
 */
function DemandMapSection({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; region?: string | null; importanceWeight: number | null }[];
}) {
  if (!rows.length) return null;
  return (
    <div>
      <p className="metric-label !text-[#91a09a]">{title}</p>
      <div className="mt-2 space-y-2">
        {rows.map(row => (
          <div key={row.name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs text-[#c5d1c9]" title={row.name}>
              {row.name}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              {row.importanceWeight !== null && (
                <span
                  className="block h-full rounded-full bg-[var(--sg-seq-4)]"
                  style={{ width: `${Math.round(Math.min(1, Math.max(0, row.importanceWeight)) * 100)}%` }}
                />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemandMap({
  movementDemands,
  muscleDemands,
}: {
  movementDemands: SupabaseSportMovementDemand[];
  muscleDemands: SupabaseSportMuscleDemand[];
}) {
  if (!movementDemands.length && !muscleDemands.length) return null;
  return (
    <div className="grid gap-5 border-b border-white/10 p-5 sm:grid-cols-2">
      <DemandMapSection
        title="Highest-weighted movement demands"
        rows={movementDemands.map(demand => ({
          name: demand.patternName,
          importanceWeight: demand.importanceWeight,
        }))}
      />
      <DemandMapSection
        title="Highest-weighted muscle demands"
        rows={muscleDemands.map(demand => ({
          name: demand.muscleName,
          importanceWeight: demand.importanceWeight,
        }))}
      />
    </div>
  );
}

function RecommendationRow({
  recommendation,
  exercise,
  onAdd,
  onInspect,
}: {
  recommendation: SupabaseSportExerciseRecommendation;
  exercise: Exercise | undefined;
  onAdd: (exercise: Exercise) => void;
  onInspect: (exercise: Exercise) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const confidence = confidenceLabel(recommendation.confidenceScore);
  const hasDetail = Boolean(recommendation.rationale || recommendation.doseSummary);

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="metric-label !text-[#91a09a]">
            {formatLabel(recommendation.recommendationGoal) || "Recommendation"}
          </p>
          <h4 className="mt-1 font-display text-xl font-bold uppercase text-white">
            {recommendation.exerciseName}
          </h4>
          {shortReason(recommendation) && (
            <p className="mt-1 text-xs leading-5 text-[#c5d1c9]">
              {shortReason(recommendation)}
            </p>
          )}
        </div>
        {confidence && (
          <span
            className="shrink-0 border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#c5d1c9]"
            title="Evidence-quality judgment, not a calibrated probability"
          >
            {confidence} confidence
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {exercise && (
          <>
            <button
              type="button"
              onClick={() => onAdd(exercise)}
              className="border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-white"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => onInspect(exercise)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--sg-info)]"
            >
              Inspect <ArrowUpRight className="h-3 w-3" />
            </button>
          </>
        )}
        {hasDetail && (
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            aria-expanded={expanded}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#8d9c95]"
          >
            {expanded ? "Hide reasoning" : "Why this exercise"}
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-l-2 border-white/15 pl-3">
          {recommendation.rationale && (
            <p className="text-xs leading-5 text-[#c5d1c9]">{recommendation.rationale}</p>
          )}
          {recommendation.effectMetric && (
            <p className="text-[11px] leading-5 text-[#8d9c95]">
              <strong className="text-[#b6c3bc]">Measured effect:</strong> {recommendation.effectMetric}
              {recommendation.effectSize !== null ? ` (${recommendation.effectSize})` : ""}
            </p>
          )}
          {recommendation.doseSummary && (
            <p className="text-[11px] leading-5 text-[#8d9c95]">
              <strong className="text-[#b6c3bc]">Studied dose:</strong> {recommendation.doseSummary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Surfaces evidence-backed sport recommendations from the Sports Genome research
 * registry (Supabase) alongside the local movement-match logic. Quietly renders
 * nothing when the registry has no matching sport or the connection is unavailable.
 */
export function SportEvidencePanel({
  sportId,
  exercises,
  onAdd,
  onInspect,
}: {
  sportId: string;
  exercises: Exercise[];
  onAdd: (exercise: Exercise) => void;
  onInspect: (exercise: Exercise) => void;
}) {
  const { data } = trpc.sportsGenome.profile.useQuery(
    { sportId },
    { staleTime: 5 * 60 * 1000 }
  );

  if (!data || data.status !== "connected") return null;
  if (!data.recommendations.length) return null;

  return (
    <div className="dark-panel overflow-hidden">
      <div className="border-b border-white/10 p-5">
        <p className="metric-label !text-[#91a09a]">
          Sport evidence registry / {data.sportName}
        </p>
        <h3 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">
          Reasoning from the research registry
        </h3>
        <p className="mt-2 text-xs leading-5 text-[#c5d1c9]">
          Population-level evidence, not an individual measurement — it adds reasoning
          context and does not replace the local catalog or your own recommendation scoring.
        </p>
        {data.qualityDemands.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.qualityDemands.map(quality => (
              <span
                key={quality.qualityName}
                className="border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--sg-info)]"
              >
                {quality.qualityName}
              </span>
            ))}
          </div>
        )}
      </div>
      <DemandMap movementDemands={data.movementDemands} muscleDemands={data.muscleDemands} />
      <div className="divide-y divide-white/10">
        {data.recommendations.map((recommendation, index) => (
          <RecommendationRow
            key={`${recommendation.exerciseName}-${index}`}
            recommendation={recommendation}
            exercise={
              recommendation.catalogExerciseId !== null
                ? exercises.find(item => item.id === recommendation.catalogExerciseId)
                : undefined
            }
            onAdd={onAdd}
            onInspect={onInspect}
          />
        ))}
      </div>
    </div>
  );
}
