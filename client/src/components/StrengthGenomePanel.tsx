import React, { useEffect, useMemo, useRef, useState } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { Activity, ChevronRight, CircleHelp, Dumbbell, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { getStrengthCatalogSelectionContext, strengthRegionDefinitions, type StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { StrengthGenomeBodyMap } from "@/components/StrengthGenomeBodyMap";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { displayWeightToKilograms, formatDisplayWeight, kilogramsToDisplayWeight, weightUnitLabel, type DisplayWeightUnit } from "@/lib/weightUnits";
import { deviceStrengthObservationEvent, loadDeviceStrengthObservations, prependDeviceStrengthObservation, saveDeviceStrengthObservations, setDeviceStrengthObservationBodyMass, type DeviceStrengthObservation, removeDeviceStrengthObservation } from "@/lib/deviceStrengthObservations";
import { getPiper2021PreacherCurlReference, piper2021PreacherCurlReferenceId, type Piper2021PreacherCurlContext } from "../../../shared/piper2021PreacherCurlReference";
import { powerliftingRankMissingCopy, powerliftingRankNoPopulationCopy, rankAgainstPowerliftingNorms, getVanDenHoek2024PowerliftingReference, vanDenHoek2024ReferenceId, type PowerliftingRankMissing, type PowerliftingReferenceDeclaration } from "@/lib/powerliftingReference";
import type { PowerliftingNormRow } from "@shared/powerliftingNormsReference";
import type { NormsReferenceRow } from "@shared/normsReference";
import { studyGroupLabel } from "@/lib/studyGroupLabel";
import { getRegistryReferenceForObservation, registryConnectionNotice, registryUnavailableExplanation, type RegistryConnectionState, type RegistryReferenceProfile } from "@/lib/registryReference";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";
import { summarizeWithinAthleteStrengthComparisons, type ChangeState, type ComparableStrengthObservation, type WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { strengthRegionIdsForExerciseName, workoutStrengthObservations } from "@/lib/workoutStrengthRecord";
import { bodyWeightKgAt, bodyWeightLogEvent, loadBodyWeightLog, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { catalogExerciseIdForName, strengthPercentileCard, strengthPercentileGapCopy } from "@/lib/strengthPercentileCard";

const changeStateCopy: Record<ChangeState, { label: string; tone: string }> = {
  insufficient_history: { label: "Not enough history yet", tone: "#9eb3cb" },
  stable: { label: "Stable", tone: "#9eb3cb" },
  directional_signal_emerging: { label: "Starting to move", tone: "#f2c14d" },
  meaningful_change_supported: { label: "Confirmed change", tone: "#5bc07a" },
};

function normalizedName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

type MeasurementType =
  | "MEASURED_1RM"
  | "MULTI_REP"
  | "BODYWEIGHT"
  | "ISOMETRIC"
  | "DYNAMOMETRY"
  | "JUMP"
  | "FORCE_PLATE"
  | "VELOCITY";

type ObservationDataQuality = "SELF_REPORTED" | "STANDARDIZED" | "VERIFIED" | "UNCERTAIN";

type StrengthObservationRecord = { id: string | number; exerciseName: string; observedAt: Date | string; measurementType: string; loadKg?: number | null; repetitions?: number | null; bodyMassKgAtTest?: number | null; equipment?: string | null; romStandard?: string | null; dataQuality?: string | null; referenceContextJson?: string | null;
  /** Present when the entry was carried across from a finished workout rather than typed into the log form. */
  source?: "workout"; sessionLabel?: string; setCount?: number };

type PiperReferenceDeclaration = Pick<Piper2021PreacherCurlContext, "sex" | "ageYears" | "collegeStudentConfirmed" | "preTrainingConfirmed" | "exactProtocolConfirmed" | "directlyObservedConfirmed">;

const emptyPiperDeclaration: PiperReferenceDeclaration = { sex: undefined, ageYears: undefined, collegeStudentConfirmed: false, preTrainingConfirmed: false, exactProtocolConfirmed: false, directlyObservedConfirmed: false };
const emptyPowerliftingDeclaration: PowerliftingReferenceDeclaration = { sex: undefined, ageYears: undefined, drugTestedCompetitionConfirmed: false, unequippedCompetitionConfirmed: false, maximumSuccessfulLiftConfirmed: false };

function parsePiperReferenceDeclaration(value?: string | null): PiperReferenceDeclaration | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PiperReferenceDeclaration & { referenceId?: string }>;
    if (parsed.referenceId !== piper2021PreacherCurlReferenceId) return null;
    return { sex: parsed.sex, ageYears: parsed.ageYears, collegeStudentConfirmed: parsed.collegeStudentConfirmed === true, preTrainingConfirmed: parsed.preTrainingConfirmed === true, exactProtocolConfirmed: parsed.exactProtocolConfirmed === true, directlyObservedConfirmed: parsed.directlyObservedConfirmed === true };
  } catch { return null; }
}

function parsePowerliftingReferenceDeclaration(value?: string | null): PowerliftingReferenceDeclaration | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PowerliftingReferenceDeclaration & { referenceId?: string }>;
    if (parsed.referenceId !== vanDenHoek2024ReferenceId) return null;
    return {
      sex: parsed.sex === "female" || parsed.sex === "male" ? parsed.sex : undefined,
      ageYears: parsed.ageYears,
      drugTestedCompetitionConfirmed: parsed.drugTestedCompetitionConfirmed === true,
      unequippedCompetitionConfirmed: parsed.unequippedCompetitionConfirmed === true,
      maximumSuccessfulLiftConfirmed: parsed.maximumSuccessfulLiftConfirmed === true,
    };
  } catch { return null; }
}

export function getPiperReferenceForObservation(observation: StrengthObservationRecord) {
  const declaration = parsePiperReferenceDeclaration(observation.referenceContextJson);
  if (!declaration || observation.loadKg == null || observation.bodyMassKgAtTest == null) return null;
  return getPiper2021PreacherCurlReference({ exerciseName: observation.exerciseName, measurementType: observation.measurementType, repetitions: observation.repetitions, loadLb: kilogramsToDisplayWeight(Number(observation.loadKg), "lb"), bodyMassLb: kilogramsToDisplayWeight(Number(observation.bodyMassKgAtTest), "lb"), ...declaration });
}

export function getPowerliftingReferenceForObservation(observation: StrengthObservationRecord, registryNorms: readonly PowerliftingNormRow[] = []) {
  const declaration = parsePowerliftingReferenceDeclaration(observation.referenceContextJson);
  if (!declaration) return null;
  return getVanDenHoek2024PowerliftingReference({ exerciseName: observation.exerciseName, measurementType: observation.measurementType, loadKg: observation.loadKg, bodyMassKgAtTest: observation.bodyMassKgAtTest, declaration }, registryNorms);
}

export function selectStrengthRegionRecord<T extends { id: string | number; observedAt?: string | Date }>(records: T[], selectedRecordId: string) {
  const chosen = records.find((record) => String(record.id) === selectedRecordId);
  if (chosen) return chosen;
  // Both callers hand these over newest-first today, but nothing in the type enforces it,
  // so resolve the newest test by its date rather than trusting array order.
  return records.reduce<T | undefined>((newest, record) => {
    if (!newest) return record;
    const candidate = record.observedAt ? new Date(record.observedAt).getTime() : Number.NaN;
    const incumbent = newest.observedAt ? new Date(newest.observedAt).getTime() : Number.NaN;
    if (Number.isNaN(candidate)) return newest;
    if (Number.isNaN(incumbent)) return record;
    return candidate > incumbent ? record : newest;
  }, undefined);
}

export function StrengthCatalogSelectionPreview({ context }: { context: ReturnType<typeof getStrengthCatalogSelectionContext> }) {
  return <div className="strength-selected-exercise" aria-live="polite"><strong>{context.exerciseName}</strong><span>Primary: {context.primaryMuscles.join(" · ")}{context.supportingMuscles.length ? ` · Supporting: ${context.supportingMuscles.join(" · ")}` : ""}</span><small>{context.domainLabels.length ? `Recorded context: ${context.domainLabels.join(" · ")}` : "Recorded context unavailable"}</small><small>{context.boundary}</small></div>;
}

export function StrengthLoadInput({ weightUnit, value, requiresLoad, onChange }: { weightUnit: DisplayWeightUnit; value: string; requiresLoad: boolean; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Load in {weightUnitLabel(weightUnit)} {requiresLoad ? "· required" : "· optional"}</span><input aria-label={`Load in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={requiresLoad ? `Enter ${weightUnit}` : "Optional"} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

export function StrengthBodyMassInput({ weightUnit, value, onChange }: { weightUnit: DisplayWeightUnit; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Body mass at test ({weightUnit})</span><input aria-label={`Body mass at test in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

export function StrengthObservationReviewButton({ observation, onReview }: { observation: StrengthObservationRecord; onReview: (observation: StrengthObservationRecord) => void }) {
  return <button type="button" onClick={() => { emitInteractionFeedback(); onReview(observation); }} className="strength-observation-review">Review</button>;
}

export function StrengthRegionRecordDetail({ region, observations, onClose, weightUnit, baselineBodyWeight, directAccess, onSetDeviceBodyMass, initialRecordId = "", powerliftingNorms = [], strengthChanges = [], referenceRows = [], athleteProfile = null, bodyWeightHistory = [], onRankProfile }: { region: StrengthRegionDefinition; observations: StrengthObservationRecord[]; onClose: () => void; weightUnit: DisplayWeightUnit; baselineBodyWeight?: number; directAccess: boolean; onSetDeviceBodyMass: (observationId: string, bodyMassKgAtTest: number) => void; initialRecordId?: string; powerliftingNorms?: readonly PowerliftingNormRow[]; strengthChanges?: readonly WithinAthleteStrengthChange[]; referenceRows?: readonly NormsReferenceRow[]; athleteProfile?: RegistryReferenceProfile; bodyWeightHistory?: readonly BodyWeightEntry[]; onRankProfile?: (patch: RankProfilePatch) => void }) {
  const records = useMemo(() => observations.filter((observation) => strengthRegionIdsForExerciseName(observation.exerciseName).includes(region.id)).sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()), [observations, region.id]);
  const utils = trpc.useUtils();
  const matchedReferenceRef = useRef<HTMLElement>(null);
  const [bodyMassEntry, setBodyMassEntry] = useState("");
  const [bodyMassSaveError, setBodyMassSaveError] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecordId);
  useEffect(() => {
    setSelectedRecordId((current) => records.some((record) => String(record.id) === current) ? current : String(records[0]?.id || ""));
  }, [records]);
  const setObservationBodyMass = trpc.strengthGenome.setObservationBodyMass.useMutation({ onSuccess: async () => { emitInteractionFeedback([10, 30, 10]); setBodyMassSaveError(null); setBodyMassEntry(""); toast.success("Test body mass saved. Your recorded ratio is ready."); await Promise.all([utils.strengthGenome.observations.invalidate(), utils.strengthGenome.overview.invalidate()]); }, onError: () => { setBodyMassSaveError("Body mass was not saved. Your entry is still here—check your connection and try again."); toast.error("Could not save test body mass. Check your connection and try again."); } });
  const latestRecord = selectStrengthRegionRecord(records, selectedRecordId);
  /**
   * Offering today's weight for a lift from three months ago is offering the
   * wrong number, which is why this used to carry a warning telling the athlete
   * to check it themselves. The weight log knows what they weighed that week, so
   * the field offers that instead and says which day it came from.
   */
  const weightOnRecordDay = latestRecord ? bodyWeightKgAt(bodyWeightHistory, latestRecord.observedAt) : undefined;
  const offeredBodyMass = weightOnRecordDay ?? (baselineBodyWeight != null ? displayWeightToKilograms(baselineBodyWeight, weightUnit) : undefined);
  const offeredIsDated = weightOnRecordDay !== undefined;
  /**
   * The body weight this lift is read against, and where it came from.
   *
   * The athlete gave a weight in the questionnaire, so asking for it again
   * before anything would show was asking twice. Worse, the weight log only
   * looks backwards - a weight entered today applies to no lift logged before
   * today - so the dated route misses on exactly the lifts an athlete records
   * first, and every one of them landed on an empty-feeling form with a Save
   * button between them and their ratio.
   *
   * So the best weight available is used, and the line says which one it is.
   * A borrowed weight is a real caveat, and it is answered by naming it and
   * leaving the correction one tap away - not by showing nothing until the
   * athlete retypes a number the app already has.
   */
  const bodyMassSource: "recorded" | "dated" | "profile" | null = latestRecord?.loadKg == null ? null
    : latestRecord.bodyMassKgAtTest != null && latestRecord.bodyMassKgAtTest > 0 ? "recorded"
    : weightOnRecordDay !== undefined ? "dated"
    : offeredBodyMass !== undefined ? "profile"
    : null;
  const effectiveBodyMassKg = bodyMassSource === "recorded" ? Number(latestRecord!.bodyMassKgAtTest)
    : bodyMassSource === null ? undefined
    : offeredBodyMass;
  const bodyMassRatio = latestRecord?.loadKg != null && effectiveBodyMassKg != null && effectiveBodyMassKg > 0
    ? latestRecord.loadKg / effectiveBodyMassKg
    : null;
  useEffect(() => {
    setBodyMassEntry(offeredBodyMass === undefined ? "" : String(Number(kilogramsToDisplayWeight(offeredBodyMass, weightUnit).toFixed(1))));
  }, [offeredBodyMass, weightUnit, latestRecord?.id]);
  const piperReference = latestRecord ? getPiperReferenceForObservation(latestRecord) : null;
  const powerliftingReference = latestRecord ? getPowerliftingReferenceForObservation(latestRecord, powerliftingNorms) : null;
  /**
   * Where this lift ranks, from what the athlete already has.
   *
   * The declaration-gated route above answers "does this match the study's
   * population exactly?", and for a gym log the answer is always no - so the
   * screen used to explain the protocol instead of giving a number that was
   * sitting in the table the whole time. This ranks the lift and names the
   * population it is ranked against.
   */
  const powerliftingRank = latestRecord ? rankAgainstPowerliftingNorms({
    exerciseName: latestRecord.exerciseName,
    measurementType: latestRecord.measurementType,
    loadKg: latestRecord.loadKg == null ? null : Number(latestRecord.loadKg),
    repetitions: latestRecord.repetitions,
    // The same weight the ratio above is read against, borrowed provenance
    // included: ranking off a weight the athlete has already given beats
    // withholding the rank until they type it a second time. Where it is
    // borrowed, the card says so.
    bodyMassKgAtTest: effectiveBodyMassKg ?? null,
    // The athlete's own answer, unmapped: narrowing it to male/female here made
    // "Intersex" and "Prefer not to say" arrive as an empty field, and the
    // screen answered them by asking for the field again.
    sex: (athleteProfile?.sexForReference as SexForReference | undefined) || undefined,
    ageYears: ageFromBirthYear(athleteProfile?.birthYear ?? undefined),
  }, powerliftingNorms) : null;
  // The registry resolves every approved source, so it leads. The two hand-written
  // routes stay as the offline fallback for the sources they already cover.
  const registryReference = useMemo(
    () => latestRecord ? getRegistryReferenceForObservation(latestRecord, referenceRows, athleteProfile, new Date(latestRecord.observedAt)) : null,
    [latestRecord, referenceRows, athleteProfile]
  );
  const registryMatch = registryReference?.status === "matched" ? registryReference : null;
  const hasOutsideComparison = registryMatch != null || powerliftingReference?.status === "matched" || piperReference?.status === "matched";
  /**
   * The rank only renders where no stricter, exactly-matched source already did.
   *
   * It also takes over the body-weight ratio line above it, which reads "for
   * your own context, not a rank" - true when nothing ranked the lift, and a
   * direct contradiction of the card underneath once something does. The rank
   * card states the same ratio itself, so the line is not lost.
   */
  const showRank = !hasOutsideComparison && powerliftingRank?.status === "ranked";
  // When the registry closed the comparison, say which gate closed it. "Add your test
  // body weight" is worth far more to an athlete than the general explanation alone.
  const registryGateExplanation = !hasOutsideComparison && registryReference?.status === "unavailable"
    ? registryUnavailableExplanation[registryReference.reason] ?? null
    : null;
  /**
   * Where this lift sits against sex-matched community curves.
   *
   * Published research covers three barbell lifts, so every other exercise in the catalog ended
   * at "no ranking for this lift yet" - true, and useless to someone who just logged a row. The
   * community curves cover a hundred more, and this is the route that reads them. It stays the
   * last route asked: anything exactly matched to a study is a stricter answer and keeps its
   * place above.
   */
  const percentileSex: "male" | "female" | null =
    athleteProfile?.sexForReference === "male" || athleteProfile?.sexForReference === "female"
      ? athleteProfile.sexForReference
      : null;
  const measuredOneRm = latestRecord?.measurementType === "MEASURED_1RM";
  const betaPercentile = trpc.strengthPercentile.forLift.useQuery(
    {
      catalogExerciseId: latestRecord ? catalogExerciseIdForName(latestRecord.exerciseName) ?? null : null,
      exerciseName: latestRecord?.exerciseName ?? null,
      sex: percentileSex,
      bodyMassKg: effectiveBodyMassKg ?? null,
      measuredOneRmKg: measuredOneRm && latestRecord?.loadKg != null ? Number(latestRecord.loadKg) : null,
      loadKg: !measuredOneRm && latestRecord?.loadKg != null ? Number(latestRecord.loadKg) : null,
      repetitions: !measuredOneRm && latestRecord?.repetitions ? Number(latestRecord.repetitions) : null,
    },
    // Nothing to place without a load, and the route would only answer `load_required`.
    { enabled: Boolean(latestRecord?.loadKg), staleTime: 5 * 60 * 1000, retry: false }
  );
  const percentileCard = betaPercentile.data && percentileSex
    ? strengthPercentileCard(betaPercentile.data, { sex: percentileSex, bodyMassKg: effectiveBodyMassKg })
    : null;
  const percentileGap = betaPercentile.data?.status === "unavailable"
    ? strengthPercentileGapCopy[betaPercentile.data.reason] ?? null
    : null;
  // The stricter routes lead. This one fills the space they leave rather than sitting beside them.
  const showPercentile = !hasOutsideComparison && !showRank && percentileCard != null;
  const strengthTrend = latestRecord ? strengthChanges.find((change) => normalizedName(change.exerciseName) === normalizedName(latestRecord.exerciseName)) : undefined;
  useEffect(() => {
    if ((!registryMatch && piperReference?.status !== "matched") || !matchedReferenceRef.current) return;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => matchedReferenceRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" }));
  }, [latestRecord?.id, piperReference?.status, registryMatch?.referenceKey]);
  const parsedBodyMassEntry = Number(bodyMassEntry);
  return <section className="strength-region-record-detail" aria-label={`${region.label} recorded strength context`}>
    <div className="strength-region-record-heading"><div><p className="metric-label">Your record</p><h2 tabIndex={-1} data-strength-region-heading>{region.label}</h2></div><button type="button" onClick={() => { emitInteractionFeedback(); onClose(); }} className="strength-region-close" aria-label={`Close ${region.label} detail`}><X className="h-4 w-4" /></button></div>
    {latestRecord ? <>
      <article className="strength-region-record-card">
        {records.length > 1 ? <label className="strength-region-record-picker"><span>Which lift</span><select aria-label="Choose recorded test" value={selectedRecordId || String(latestRecord.id)} onChange={(event) => setSelectedRecordId(event.target.value)}>{records.map((record) => <option key={record.id} value={String(record.id)}>{record.exerciseName} · {new Date(record.observedAt).toLocaleDateString()}</option>)}</select></label> : <span className="strength-region-test-name">{latestRecord.exerciseName}</span>}
        {strengthTrend ? <article className="strength-reference-matched strength-reference-primary strength-rating-card" style={{ borderColor: changeStateCopy[strengthTrend.changeState].tone }}>
          <p className="metric-label">Your rating on this lift</p>
          <strong className="strength-body-mass-ratio" style={{ color: changeStateCopy[strengthTrend.changeState].tone }}>{strengthTrend.relativeChangePercent >= 0 ? "+" : ""}{strengthTrend.relativeChangePercent.toFixed(0)}%</strong>
          <span className="strength-rating-state" style={{ color: changeStateCopy[strengthTrend.changeState].tone }}>{changeStateCopy[strengthTrend.changeState].label}</span>
          <p>Change in your estimated one-rep max across {strengthTrend.observationCount} logs since {strengthTrend.firstPoint.observedAt.toLocaleDateString()}.</p>
        </article> : <p className="strength-rating-empty">Log this lift once more and your progress rating shows up here.</p>}
        {bodyMassRatio != null && !showRank && !showPercentile && <p className="strength-region-ratio-inline">{bodyMassRatio.toFixed(2)}× {bodyMassWeightPhrase[bodyMassSource!]} — for your own context, not a rank.</p>}
        {registryMatch ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Compared to that study group</p><strong>{registryMatch.percentileBandLabel}</strong><p>{registryMatch.unit === "x_bodyweight" ? `${registryMatch.observedValue.toFixed(2)}× body mass` : `${registryMatch.observedValue.toFixed(1)} ${registryMatch.unit}`}{studyGroupLabel(registryMatch.populationDefinition) ? ` · ${studyGroupLabel(registryMatch.populationDefinition)}` : ""}{registryMatch.sampleSize ? ` · ${registryMatch.sampleSize.toLocaleString()} people` : ""}. This exact test only.</p>{registryMatch.sourceUrl && <a href={registryMatch.sourceUrl} target="_blank" rel="noreferrer">View the source study</a>}</article> : powerliftingReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Compared to that competition group</p><strong>{powerliftingReference.percentileBandLabel}</strong><p>{powerliftingReference.relativeStrength.toFixed(2)}× body mass · {powerliftingReference.sourceLabel}. Exact competition context only.</p><a href={powerliftingReference.sourceUrl} target="_blank" rel="noreferrer">View van den Hoek et al. 2024 source</a></article> : piperReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Source-sample rank range</p><strong>{piperReference.comparison}</strong><p>{piperReference.sourceLabel} · {piperReference.bodyMassBand}. This is the primary result for this exact matched test only.</p><a href="https://doi.org/10.47206/ijsc.v1i1.40" target="_blank" rel="noreferrer">View Piper et al. 2021 source</a></article> : null}
        {showRank && powerliftingRank?.status === "ranked" && <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary strength-rank-card"><p className="metric-label">Where this ranks</p><strong>{powerliftingRank.percentileBandLabel}</strong><p>{powerliftingRank.relativeStrength.toFixed(2)}× body weight{bodyMassSource !== "recorded" ? ` (${bodyMassSourceNote[bodyMassSource!]})` : ""}{powerliftingRank.basis === "estimated" ? ", from an estimated one-rep max" : ""} · {powerliftingRank.population}.</p><a href={powerliftingRank.sourceUrl} target="_blank" rel="noreferrer">View van den Hoek et al. 2024 source</a></article>}
        {showPercentile && percentileCard && <article className="strength-reference-matched strength-reference-primary strength-rank-card"><p className="metric-label">Where this sits</p><strong>{percentileCard.headline}</strong><p>{percentileCard.detail}{bodyMassSource !== null && bodyMassSource !== "recorded" ? ` Read against ${bodyMassWeightPhrase[bodyMassSource]}.` : ""}</p></article>}
        {!hasOutsideComparison && !showRank && !showPercentile && percentileGap && <p className="strength-rank-needs">{percentileGap}</p>}
        {!hasOutsideComparison && !showPercentile && powerliftingRank?.status === "needs" && <RankGate missing={powerliftingRank.missing} birthYear={athleteProfile?.birthYear ?? undefined} onProfile={onRankProfile} />}
        {!hasOutsideComparison && !showPercentile && powerliftingRank?.status === "no_matching_population" && <p className="strength-rank-needs">{powerliftingRankNoPopulationCopy}</p>}
        {bodyMassSource !== "recorded" && <details className="strength-recorded-measurement"><summary>{bodyMassSource === null ? "Add test body weight" : "Not your weight that day?"}</summary><form className="strength-ratio-entry" onSubmit={(event) => { event.preventDefault(); if (!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0) return; const bodyMassKgAtTest = displayWeightToKilograms(parsedBodyMassEntry, weightUnit); if (directAccess) { onSetDeviceBodyMass(String(latestRecord.id), bodyMassKgAtTest); setBodyMassEntry(""); emitInteractionFeedback([10, 30, 10]); toast.success("Saved profile body weight attached to this test on this device."); return; } setBodyMassSaveError(null); setObservationBodyMass.mutate({ observationId: Number(latestRecord.id), bodyMassKgAtTest }); }}><label><span>{`Body weight on ${new Date(latestRecord.observedAt).toLocaleDateString()} (${weightUnit})`}</span><input aria-label={`Body weight on the day of this lift, in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={bodyMassEntry} onChange={(event) => { setBodyMassSaveError(null); setBodyMassEntry(event.target.value.replace(/[^0-9.]/g, "")); }} placeholder={weightUnit === "lb" ? "e.g. 180" : "e.g. 82"} /></label><button type="submit" aria-busy={!directAccess && setObservationBodyMass.isPending} disabled={!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0 || (!directAccess && setObservationBodyMass.isPending)}>{!directAccess && setObservationBodyMass.isPending ? "Saving" : "Save this body weight"}</button>{offeredBodyMass !== undefined && <small>{offeredIsDated ? "This lift is already read against what you weighed that week. Save a different number only if you know it was different that day." : "This lift is already read against your profile weight. Save the weight you were that day if you know it was different."}</small>}{!directAccess && setObservationBodyMass.isPending && <p className="strength-ratio-status" role="status">Saving body mass for this test…</p>}{bodyMassSaveError && <p className="strength-ratio-error" role="alert">{bodyMassSaveError}</p>}</form></details>}
        <details className="strength-region-boundary"><summary>{hasOutsideComparison || showRank || showPercentile ? "About this comparison" : "No ranking for this lift yet"}</summary>{registryGateExplanation && <p className="strength-region-gate-reason">{registryGateExplanation}</p>}<p>{hasOutsideComparison ? "This matches one specific study, for this exact test only — not a general claim about how strong you are." : showRank ? "Ranked against the published group named above, not against everyone. It places your lift on that study's own reported cut points." : showPercentile ? "Placed against lifting data from people of the same sex, on this exercise. It is a comparison on this lift alone, not a general claim about how strong you are." : "Rankings come from published research, which so far covers the barbell squat, bench press and deadlift. Your rating above is measured from your own logs."}</p></details>
        <span className="strength-region-test-meta">{latestRecord.loadKg != null ? formatDisplayWeight(latestRecord.loadKg, weightUnit) : "No load"}{latestRecord.repetitions ? ` · ${latestRecord.repetitions} reps` : ""} · {new Date(latestRecord.observedAt).toLocaleDateString()}{/* The weight this lift was read against, said out loud: it was saved with the lift and does not move when the profile weight changes. */}{effectiveBodyMassKg != null ? ` · at ${formatDisplayWeight(effectiveBodyMassKg, weightUnit)}` : ""}{latestRecord.source === "workout" ? ` · top set of ${latestRecord.setCount} from ${latestRecord.sessionLabel || "a workout"}` : ""}</span>
      </article>
    </> : <div className="strength-region-record-empty"><p>Nothing logged for this muscle group yet.</p><p>Log a lift that trains it and your progress will show up here.</p></div>}
  </section>;
}

const measurementOptions: { value: MeasurementType; label: string }[] = [
  { value: "MEASURED_1RM", label: "Measured 1RM" },
  { value: "MULTI_REP", label: "Working set" },
  { value: "BODYWEIGHT", label: "Bodyweight exercise" },
  { value: "ISOMETRIC", label: "Isometric test" },
  { value: "DYNAMOMETRY", label: "Dynamometry" },
  { value: "JUMP", label: "Jump test" },
  { value: "FORCE_PLATE", label: "Force-plate test" },
  { value: "VELOCITY", label: "Velocity test" },
];

function measurementTypeLabel(value: string): string {
  return measurementOptions.find((option) => option.value === value)?.label || value.replace(/_/g, " ");
}

const dataQualityOptions: { value: ObservationDataQuality; label: string }[] = [
  { value: "SELF_REPORTED", label: "Self-reported" },
  { value: "STANDARDIZED", label: "Standardized setup" },
  { value: "VERIFIED", label: "Verified result" },
  { value: "UNCERTAIN", label: "Setup uncertain" },
];

function mapSexForPiper(sexForReference?: SexForReference): PiperReferenceDeclaration["sex"] {
  if (sexForReference === "female" || sexForReference === "male" || sexForReference === "intersex") return sexForReference;
  if (sexForReference === "unspecified") return "prefer_not_to_say";
  return undefined;
}

function mapSexForPowerlifting(sexForReference?: SexForReference): PowerliftingReferenceDeclaration["sex"] {
  return sexForReference === "female" || sexForReference === "male" ? sexForReference : undefined;
}

function ageFromBirthYear(birthYear?: number): number | undefined {
  return birthYear ? new Date().getFullYear() - birthYear : undefined;
}

/**
 * Which body weight the ratio is read against, in the sentence it appears in.
 *
 * Only the recorded one can honestly say "on that day". The other two are the
 * app filling in for the athlete, and say which number it used.
 */
const bodyMassWeightPhrase: Record<"recorded" | "dated" | "profile", string> = {
  recorded: "your body weight on that day",
  dated: "what you weighed that week",
  profile: "your profile weight",
};

/** The same provenance, as a short aside inside the rank card's own sentence. */
const bodyMassSourceNote: Record<"recorded" | "dated" | "profile", string> = {
  recorded: "recorded with this lift",
  dated: "from what you weighed that week",
  profile: "from your profile weight",
};

/** What the rank still needs, asked where the rank would have been. */
export type RankProfilePatch = { sexForReference?: SexForReference; birthYear?: number };

/**
 * Keeps the record sheet on screen long enough to leave on its own terms.
 *
 * Closing it used to unmount it on the same tap, so a panel occupying the lower
 * third of a phone disappeared between two frames - nothing to follow, and no
 * sense of where it went. This holds the last region after the selection
 * clears, marked as leaving, and drops it when the exit animation is over.
 *
 * Swapping straight to another region is not a close: the incoming region wins
 * immediately and nothing lingers behind it.
 *
 * The timer is the cleanup, not the animation's own `animationend`: that event
 * never arrives if the element is hidden, the tab is backgrounded, or the
 * animation is suppressed, and a sheet that never unmounted would swallow the
 * taps underneath it. Reduced motion collapses the CSS duration to 1ms, so it
 * collapses here too and the sheet just goes.
 */
/**
 * The CSS exit is --sg-motion-slow (320ms), and this waits a little past it.
 * Unmounting on the exact frame the animation ends risks clipping its last
 * frame; waiting 40ms longer costs nothing, because the sheet is already
 * invisible and untappable by then.
 */
const sheetExitMs = 360;
function useSheetPresence<T>(selected: T | null, exitMs = sheetExitMs) {
  const [leaving, setLeaving] = useState<T | null>(null);
  const previous = useRef<T | null>(selected);
  useEffect(() => {
    const departing = previous.current;
    previous.current = selected;
    if (selected || !departing) { setLeaving(null); return; }
    setLeaving(departing);
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setLeaving(null), reduced ? 0 : exitMs);
    return () => window.clearTimeout(timer);
  }, [selected, exitMs]);
  return { shown: selected ?? leaving, isLeaving: !selected && leaving != null };
}

/**
 * The last step to a rank, taken here.
 *
 * "Add the sex to compare against in About Me to see where this ranks" is a
 * true sentence and a dead end: the athlete is inside a record sheet on the
 * Progress tab, and the field is behind the bottom bar, in Profile, under
 * About Me, four taps away - after which nothing returns them to the lift they
 * were looking at. The same gate answered in place turns the rank on while the
 * card is still on screen.
 *
 * Only the two profile fields are offered. Load and test body weight belong to
 * the observation, not to the athlete, and the card already carries its own
 * form for the body weight directly underneath.
 */
function RankGate({ missing, birthYear, onProfile }: { missing: PowerliftingRankMissing; birthYear?: number; onProfile?: (patch: RankProfilePatch) => void }) {
  const [year, setYear] = useState(birthYear ? String(birthYear) : "");
  if (!onProfile || (missing !== "sex" && missing !== "age")) {
    return <p className="strength-rank-needs">{powerliftingRankMissingCopy[missing]}</p>;
  }
  if (missing === "sex") {
    return <div className="strength-rank-gate">
      <p>{powerliftingRankMissingCopy.sex}</p>
      <label><span>Compare against</span><select
        value=""
        aria-label="Group to compare this lift against"
        onChange={(event) => { if (!event.target.value) return; emitInteractionFeedback(); onProfile({ sexForReference: event.target.value as SexForReference }); }}
      >
        <option value="">Choose a group</option>
        <option value="female">Female competitors</option>
        <option value="male">Male competitors</option>
        <option value="unspecified">Prefer not to say</option>
      </select></label>
      <small>Used only to pick which published group this lift is read against. It is saved to About Me.</small>
    </div>;
  }
  const parsed = Number(year);
  const currentYear = new Date().getFullYear();
  const valid = Number.isFinite(parsed) && parsed > currentYear - 100 && parsed <= currentYear;
  return <form className="strength-rank-gate" onSubmit={(event) => { event.preventDefault(); if (!valid) return; emitInteractionFeedback(); onProfile({ birthYear: parsed }); }}>
    <p>{powerliftingRankMissingCopy.age}</p>
    <label><span>Birth year</span><input inputMode="numeric" value={year} placeholder="e.g. 1998" aria-label="Birth year" onChange={(event) => setYear(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} /></label>
    <button type="submit" disabled={!valid}>Save</button>
    <small>Used only to pick the age band. It is saved to About Me.</small>
  </form>;
}

export function StrengthGenomePanel({ onOpenTraining = () => {}, weightUnit = "lb", baselineBodyWeight, sexForReference, birthYear, defaultTestingDetailOpen = false, directAccess = false, onRankProfile }: { onOpenTraining?: () => void; weightUnit?: DisplayWeightUnit; baselineBodyWeight?: number; sexForReference?: SexForReference; birthYear?: number; defaultTestingDetailOpen?: boolean; directAccess?: boolean; onRankProfile?: (patch: RankProfilePatch) => void }) {
  const utils = trpc.useUtils();
  const overview = trpc.strengthGenome.overview.useQuery(undefined, { enabled: !directAccess });
  const observations = trpc.strengthGenome.observations.useQuery(undefined, { enabled: !directAccess });
  const priorities = trpc.strengthGenome.priorities.useQuery(undefined, { enabled: !directAccess });
  const supabaseEvidenceInventory = trpc.researchEvidence.supabaseInventory.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const powerliftingNormsQuery = trpc.strengthGenome.powerliftingNorms.useQuery(undefined, { staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false });
  const powerliftingNorms = powerliftingNormsQuery.data || [];
  // Public, and cached for the hour the server caches it: these are published cut
  // points, so a direct-access athlete gets the same gated comparison as an account.
  const referenceRowsQuery = trpc.strengthGenome.referenceRows.useQuery(undefined, { staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false });
  const referenceRows = referenceRowsQuery.data || [];
  // The registry's own availability, kept apart from the per-lift gates: an offline
  // library must not read as "your lift did not qualify".
  const registryStatusQuery = trpc.strengthGenome.referenceRegistryStatus.useQuery(undefined, { staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false });
  const registryOfflineNotice = registryConnectionNotice(registryStatusQuery.data?.connection as RegistryConnectionState | undefined);
  const athleteProfile = useMemo<RegistryReferenceProfile>(() => ({ sexForReference, birthYear }), [sexForReference, birthYear]);
  const approvedReferenceExercises = useMemo(
    () => Array.from(new Set(referenceRows.map((row) => row.exerciseName).filter((name): name is string => Boolean(name)))).sort(),
    [referenceRows]
  );
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery(undefined, { enabled: !directAccess });
  /**
   * Removing an observation the athlete got wrong.
   *
   * Two stores, so two paths: an account record goes through the
   * ownership-checked repair endpoint, and a direct-access record only ever
   * existed on this device. Without the device branch the pre-sign-in athlete -
   * the one most likely to be experimenting and mistyping - would be the only
   * person who could not take a number back.
   */
  const [pendingObservationRemoval, setPendingObservationRemoval] = useState<ConfirmDialogRequest | null>(null);
  const [observationRemovalError, setObservationRemovalError] = useState<string | null>(null);
  const removeObservation = trpc.repair.deleteStrengthObservation.useMutation({
    onSuccess: async () => {
      setObservationRemovalError(null);
      toast.success("Test removed. Your history and comparisons no longer count it.");
      await Promise.all([utils.strengthGenome.observations.invalidate(), utils.strengthGenome.overview.invalidate()]);
    },
    onError: () => setObservationRemovalError("That test was not removed. Check your connection and try again."),
  });
  const prefilledPiperDeclaration: PiperReferenceDeclaration = { ...emptyPiperDeclaration, sex: mapSexForPiper(sexForReference), ageYears: ageFromBirthYear(birthYear) };
  const prefilledPowerliftingDeclaration: PowerliftingReferenceDeclaration = { ...emptyPowerliftingDeclaration, sex: mapSexForPowerlifting(sexForReference), ageYears: ageFromBirthYear(birthYear) };
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [measurementType, setMeasurementType] = useState<MeasurementType>("MEASURED_1RM");
  const [loadKg, setLoadKg] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [observedDate, setObservedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bodyMassKg, setBodyMassKg] = useState(() => baselineBodyWeight != null ? String(baselineBodyWeight) : "");
  const [equipment, setEquipment] = useState("");
  const [romStandard, setRomStandard] = useState("");
  const [techniqueVariant, setTechniqueVariant] = useState("");
  const [tempo, setTempo] = useState("");
  const [laterality, setLaterality] = useState<"BILATERAL" | "LEFT" | "RIGHT">("BILATERAL");
  const [externalAssistance, setExternalAssistance] = useState("");
  const [dataQuality, setDataQuality] = useState<ObservationDataQuality>("SELF_REPORTED");
  const [notes, setNotes] = useState("");
  const [piperReferenceOpen, setPiperReferenceOpen] = useState(false);
  const [piperDeclaration, setPiperDeclaration] = useState<PiperReferenceDeclaration>(prefilledPiperDeclaration);
  const [powerliftingReferenceOpen, setPowerliftingReferenceOpen] = useState(false);
  const [powerliftingDeclaration, setPowerliftingDeclaration] = useState<PowerliftingReferenceDeclaration>(prefilledPowerliftingDeclaration);
  const [advancedOpen, setAdvancedOpen] = useState(defaultTestingDetailOpen);
  const [selectedRegion, setSelectedRegion] = useState<StrengthRegionDefinition | null>(null);
  // The sheet outlives the selection by the length of its exit animation.
  const { shown: sheetRegion, isLeaving: sheetLeaving } = useSheetPresence(selectedRegion);
  const [selectedObservationId, setSelectedObservationId] = useState("");
  const regionDetailRef = useRef<HTMLDivElement | null>(null);
  const [deviceObservations, setDeviceObservations] = useState<DeviceStrengthObservation[]>(() => loadDeviceStrengthObservations());
  useEffect(() => {
    if (!directAccess) return;
    const refresh = () => setDeviceObservations(loadDeviceStrengthObservations());
    window.addEventListener(deviceStrengthObservationEvent, refresh);
    return () => window.removeEventListener(deviceStrengthObservationEvent, refresh);
  }, [directAccess]);
  // Finished workouts are part of the record, not a separate app. Re-read them
  // on the same event the tracker fires so finishing a session updates this
  // screen without a reload.
  const [workoutSessions, setWorkoutSessions] = useState<DeviceWorkoutSession[]>(() => loadDeviceWorkoutSessions());
  useEffect(() => {
    const refresh = () => setWorkoutSessions(loadDeviceWorkoutSessions());
    refresh();
    window.addEventListener(deviceWorkoutHistoryEvent, refresh);
    return () => window.removeEventListener(deviceWorkoutHistoryEvent, refresh);
  }, []);
  // Body weight is a dated measurement, not a setting, so a lift is stamped with
  // the weight in effect on its own day. Changing weight later leaves every
  // earlier ratio exactly as it was measured.
  const [bodyWeightHistory, setBodyWeightHistory] = useState<BodyWeightEntry[]>(() => loadBodyWeightLog());
  useEffect(() => {
    const refresh = () => setBodyWeightHistory(loadBodyWeightLog());
    refresh();
    window.addEventListener(bodyWeightLogEvent, refresh);
    return () => window.removeEventListener(bodyWeightLogEvent, refresh);
  }, []);
  const workoutObservations = useMemo(
    () => workoutStrengthObservations(workoutSessions, weightUnit, bodyWeightHistory),
    [workoutSessions, weightUnit, bodyWeightHistory],
  );
  const addObservation = trpc.strengthGenome.addObservation.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.strengthGenome.overview.invalidate(),
        utils.strengthGenome.observations.invalidate(),
      ]);
      setExerciseName("");
      setExerciseSearch("");
      setSelectedExercise(null);
      setLoadKg("");
      setRepetitions("");
      setBodyMassKg("");
      setEquipment("");
      setRomStandard("");
      setTechniqueVariant("");
      setTempo("");
      setLaterality("BILATERAL");
      setExternalAssistance("");
      setDataQuality("SELF_REPORTED");
      setPiperReferenceOpen(false);
      setPiperDeclaration(prefilledPiperDeclaration);
      setPowerliftingReferenceOpen(false);
      setPowerliftingDeclaration(prefilledPowerliftingDeclaration);
      setNotes("");
      toast.success("Lift saved. Your progress updates as you log more.");
    },
  });

  const parsedLoad = useMemo(() => Number(loadKg), [loadKg]);
  const parsedRepetitions = useMemo(() => Number(repetitions), [repetitions]);
  const parsedBodyMass = useMemo(() => Number(bodyMassKg), [bodyMassKg]);
  const needsLoad = ["MEASURED_1RM", "MULTI_REP"].includes(measurementType);
  const exerciseMatches = useMemo(() => exercises.filter((exercise) => exercise.name.toLowerCase().includes(exerciseSearch.trim().toLowerCase())).slice(0, 8), [exerciseSearch]);
  const selectedExerciseContext = useMemo(() => selectedExercise ? getStrengthCatalogSelectionContext(selectedExercise) : null, [selectedExercise]);
  const piperCaptureAvailable = exerciseName === "Preacher Curl" && measurementType === "MULTI_REP";
  const powerliftingCaptureAvailable = ["Back Squat", "Barbell Bench Press", "Conventional Deadlift"].includes(exerciseName) && measurementType === "MEASURED_1RM";
  const canSave = Boolean(selectedExercise) && (!needsLoad || (Number.isFinite(parsedLoad) && parsedLoad >= 0));
  // Lifts typed into the form and lifts carried across from finished workouts are
  // one record. The device tracker writes to this device in both access modes, so
  // its sessions are merged in both — they are never mirrored server-side, so
  // nothing is counted twice.
  const loggedObservations = directAccess ? deviceObservations : (observations.data || []) as StrengthObservationRecord[];
  const activeObservations: StrengthObservationRecord[] = useMemo(
    () => [...loggedObservations as StrengthObservationRecord[], ...workoutObservations]
      .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()),
    [loggedObservations, workoutObservations],
  );
  // Labeled "Recent lifts", so order by date here instead of trusting how the caller
  // built the array.
  const recentObservations = activeObservations.slice(0, 6);
  const unifiedStrengthHistory = useMemo(
    () => mergeStrengthHistory(
      activeObservations.map((observation) => ({ ...observation, loadKg: observation.loadKg ?? null, repetitions: observation.repetitions ?? null })),
      trackedSets.data || []
    ),
    [activeObservations, trackedSets.data]
  );
  const comparableStrengthChanges = useMemo(
    () => summarizeWithinAthleteStrengthComparisons(unifiedStrengthHistory).comparable,
    [unifiedStrengthHistory]
  );
  // Covered means "you have recorded work here", never a rank or a score. A
  // locally recorded lift counts in both access modes, so the server overview can
  // only add regions, never take one away that this device can see.
  const regionHasLocalRecord = (regionId: string) => activeObservations.some((observation) => strengthRegionIdsForExerciseName(observation.exerciseName).includes(regionId));
  const regionOverview = (regionId: string) => {
    if (regionHasLocalRecord(regionId)) return { state: "OBSERVED_TEST_CONTEXT" as const };
    if (directAccess) return { state: "INSUFFICIENT_DATA" as const };
    return overview.data?.regions.find((region) => region.id === regionId);
  };
  const observedRegionCount = strengthRegionDefinitions.filter((region) => regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT").length;
  const sourceMatchedObservationCount = activeObservations.filter((observation) => getRegistryReferenceForObservation(observation, referenceRows, athleteProfile, new Date(observation.observedAt))?.status === "matched" || getPiperReferenceForObservation(observation)?.status === "matched" || getPowerliftingReferenceForObservation(observation, powerliftingNorms)?.status === "matched").length;
  const recordedCoveragePercent = Math.round((observedRegionCount / strengthRegionDefinitions.length) * 100);
  const activePriorityIds = new Set(priorities.data?.map(priority => priority.regionId) || overview.data?.athleteConfirmedPriorityRegionIds || []);
  const persistDeviceObservations = (next: DeviceStrengthObservation[]) => { setDeviceObservations(next); saveDeviceStrengthObservations(next); };
  const setDeviceBodyMass = (observationId: string, bodyMassKgAtTest: number) => persistDeviceObservations(setDeviceStrengthObservationBodyMass(deviceObservations, observationId, bodyMassKgAtTest));

  const requestObservationRemoval = (observation: StrengthObservationRecord) =>
    setPendingObservationRemoval({
      title: "Remove this test?",
      body: `The ${observation.exerciseName} test from ${new Date(observation.observedAt).toLocaleDateString()} is deleted. It stops counting in your history, your change tracking, and any comparison drawn from it. This cannot be undone.`,
      confirmLabel: "Remove test",
      onConfirm: () => {
        setPendingObservationRemoval(null);
        setObservationRemovalError(null);
        if (directAccess) {
          persistDeviceObservations(removeDeviceStrengthObservation(deviceObservations, String(observation.id)));
          emitInteractionFeedback([10, 30, 10]);
          toast.success("Test removed from this device.");
          return;
        }
        removeObservation.mutate({ observationId: Number(observation.id) });
      },
    });
  useEffect(() => { if (baselineBodyWeight != null && bodyMassKg === "") setBodyMassKg(String(baselineBodyWeight)); }, [baselineBodyWeight, bodyMassKg]);
  const openSavedObservation = (observation: StrengthObservationRecord) => {
    const regionId = strengthRegionIdsForExerciseName(observation.exerciseName)[0];
    const region = strengthRegionDefinitions.find((candidate) => candidate.id === regionId);
    if (!region) return;
    setSelectedObservationId(String(observation.id));
    setSelectedRegion(region);
  };
  // Below the dock's breakpoint the record is pinned above the bottom bar, so it
  // is already on screen the instant a muscle is tapped. Scrolling there would
  // throw the figure the athlete just tapped off the top of the screen to reach
  // a panel that had not moved. Only the wide layout, where the record really
  // does sit further down the page, scrolls to it.
  useEffect(() => {
    const detail = regionDetailRef.current;
    if (!selectedRegion || !detail || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      if (!window.matchMedia?.("(max-width: 1023px)").matches) {
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        // The old 28px offset was measured against the top of the window, not the
        // bottom of the pinned chrome, so the scroll parked the record's own
        // heading behind the top bar. `--sg-pinned-chrome` is that height.
        const pinnedChrome = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sg-pinned-chrome")) || 0;
        const targetTop = Math.max(0, window.scrollY + detail.getBoundingClientRect().top - pinnedChrome - 16);
        window.scrollTo({ top: targetTop, behavior: reduceMotion ? "auto" : "smooth" });
      }
      detail.querySelector<HTMLElement>("[data-strength-region-heading]")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedRegion?.id, selectedObservationId]);
  // Escape closes the pinned record, the way it closes any other layer that sits
  // over the page. The figure stays tappable while it is open, so this is the
  // only dismissal a keyboard needs beyond the close button.
  useEffect(() => {
    if (!selectedRegion || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedRegion(null);
      setSelectedObservationId("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRegion]);
  const setPriority = trpc.strengthGenome.setPriority.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.strengthGenome.overview.invalidate(), utils.strengthGenome.priorities.invalidate()]);
    },
  });

  const submit = () => {
    if (!canSave || !observedDate) return;
    const nextObservation = {
      exerciseName: exerciseName.trim(),
      observedAt: new Date(`${observedDate}T12:00:00`),
      measurementType,
      loadKg: Number.isFinite(parsedLoad) && loadKg !== "" ? displayWeightToKilograms(parsedLoad, weightUnit) : undefined,
      repetitions: Number.isFinite(parsedRepetitions) && repetitions !== "" ? parsedRepetitions : undefined,
      measuredOneRmKg: measurementType === "MEASURED_1RM" && Number.isFinite(parsedLoad) ? displayWeightToKilograms(parsedLoad, weightUnit) : undefined,
      bodyMassKgAtTest: Number.isFinite(parsedBodyMass) && bodyMassKg !== "" ? displayWeightToKilograms(parsedBodyMass, weightUnit) : undefined,
      equipment: equipment.trim() || undefined,
      romStandard: romStandard.trim() || undefined,
      techniqueVariant: techniqueVariant.trim() || undefined,
      tempo: tempo.trim() || undefined,
      laterality,
      externalAssistance: externalAssistance.trim() || undefined,
      dataQuality,
      referenceContextJson: powerliftingCaptureAvailable && powerliftingReferenceOpen ? JSON.stringify({ referenceId: vanDenHoek2024ReferenceId, ...powerliftingDeclaration }) : piperCaptureAvailable && piperReferenceOpen ? JSON.stringify({ referenceId: piper2021PreacherCurlReferenceId, ...piperDeclaration }) : undefined,
      notes: notes.trim() || undefined,
    };
    if (directAccess) {
      persistDeviceObservations(prependDeviceStrengthObservation(deviceObservations, { ...nextObservation, id: `device-strength-${Date.now()}`, observedAt: nextObservation.observedAt.toISOString() }));
      setExerciseName(""); setExerciseSearch(""); setSelectedExercise(null); setLoadKg(""); setRepetitions(""); setBodyMassKg(""); setEquipment(""); setRomStandard(""); setTechniqueVariant(""); setTempo(""); setLaterality("BILATERAL"); setExternalAssistance(""); setDataQuality("SELF_REPORTED"); setPiperReferenceOpen(false); setPiperDeclaration(prefilledPiperDeclaration); setPowerliftingReferenceOpen(false); setPowerliftingDeclaration(prefilledPowerliftingDeclaration); setNotes("");
      emitInteractionFeedback([10, 30, 10]); toast.success("Lift saved on this device.");
      return;
    }
    addObservation.mutate(nextObservation);
  };

  return <section className="strength-genome-workspace space-y-5">
    <div className="view-header">
      <div>
        <p className="metric-label">Your lifts</p>
        <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[var(--sg-text-on-light)]">Your Strength<br /><em className="text-[var(--sg-info)]">Genome.</em></h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#53718d]">Log what you lift and watch it move over time.</p>
      </div>
      <div className="view-header-note"><ShieldCheck className="h-5 w-5 text-[var(--sg-info-strong)]" /><p>Your own progress and any outside comparison stay separate—never blended into one made-up score.</p></div>
    </div>

      <section className="strength-profile-status">
        <div className="strength-profile-status-overview">
          <p className="metric-label">Your record</p>
          <h2>{activeObservations.length ? "Your lifts so far" : "Start your record"}</h2>
          <div className="strength-profile-figures">
            <div className={`strength-profile-coverage-ring ${sourceMatchedObservationCount ? "is-source-qualified" : ""}`} style={{ "--coverage-progress": `${recordedCoveragePercent}%` } as CSSProperties} aria-hidden="true"><div><strong>{recordedCoveragePercent}</strong><span>%</span></div></div>
            <dl className="strength-profile-facts">
              <div><dt>Muscle groups covered</dt><dd>{observedRegionCount} <span>of {strengthRegionDefinitions.length}</span></dd></div>
              <div><dt>Lifts on record</dt><dd>{activeObservations.length}{workoutObservations.length ? <span>{workoutObservations.length} from workouts</span> : null}</dd></div>
            </dl>
          </div>
          <p className="strength-profile-coverage-note">Covered means you have lifts recorded there. It is not a rank or a score.</p>
          <div className="strength-profile-status-footnote">
            <span className="strength-profile-device-boundary"><CircleHelp className="h-3.5 w-3.5" /> {directAccess ? "This device" : "Private record"}</span>
            {sourceMatchedObservationCount > 0 && <span className="strength-profile-reference-summary">Comparison ready on {sourceMatchedObservationCount} lift{sourceMatchedObservationCount === 1 ? "" : "s"}</span>}
          </div>
        </div>
        <details className="strength-profile-reference-details"><summary>How comparison works</summary>{registryOfflineNotice && <p className="strength-profile-reference-offline" role="status">{registryOfflineNotice}</p>}<p>Your own progress is always tracked from your logs. A comparison against published numbers only appears when your exact lift, setup, and body weight line up with a study — most everyday gym lifts will not, and that is normal.</p>{supabaseEvidenceInventory.data?.status === "connected" && <p className="mt-2">Research on file: {supabaseEvidenceInventory.data.strengthNorms} strength norms, {supabaseEvidenceInventory.data.performanceNorms} performance norms, and {supabaseEvidenceInventory.data.performanceTests} test protocols. Having them on file does not by itself create a rank for you.</p>}{approvedReferenceExercises.length > 0 && <p className="mt-2">Reviewed and approved for comparison so far: {approvedReferenceExercises.join(", ")}. Every other study on file stays under review until its exact population and protocol are checked.</p>}</details>
      </section>
      <StrengthGenomeBodyMap regions={strengthRegionDefinitions.map((region) => ({ ...region, state: regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT" ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const }))} activePriorityIds={activePriorityIds} selectedRegionId={selectedRegion?.id} onSelect={(region) => { setSelectedRegion(region || null); if (!region) setSelectedObservationId(""); }} />
      {pendingObservationRemoval && <ConfirmDialog {...pendingObservationRemoval} onCancel={() => setPendingObservationRemoval(null)} />}
      {sheetRegion && <div ref={regionDetailRef} className={`strength-region-sheet${sheetLeaving ? " is-leaving" : ""}`} role="group" aria-label={`${sheetRegion.label} record`} aria-hidden={sheetLeaving || undefined}><StrengthRegionRecordDetail key={`${sheetRegion.id}-${selectedObservationId}`} region={sheetRegion} observations={activeObservations as StrengthObservationRecord[]} onClose={() => { setSelectedRegion(null); setSelectedObservationId(""); }} weightUnit={weightUnit} baselineBodyWeight={baselineBodyWeight} directAccess={directAccess} onSetDeviceBodyMass={setDeviceBodyMass} initialRecordId={selectedObservationId} powerliftingNorms={powerliftingNorms} strengthChanges={comparableStrengthChanges} referenceRows={referenceRows} athleteProfile={athleteProfile} bodyWeightHistory={bodyWeightHistory} onRankProfile={onRankProfile} />
        <div className="strength-region-focus-row"><p><strong>Want to prioritize this?</strong> Optional. It will not change today&apos;s workout on its own.</p><div><button type="button" onClick={() => { emitInteractionFeedback(); onOpenTraining(); }} className="strength-focus-secondary">Review training</button><button type="button" disabled={setPriority.isPending} onClick={() => { emitInteractionFeedback(); setPriority.mutate({ regionId: sheetRegion.id, active: !activePriorityIds.has(sheetRegion.id) }); }} className={`strength-focus-primary ${activePriorityIds.has(sheetRegion.id) ? "is-active" : ""}`}>{activePriorityIds.has(sheetRegion.id) ? "Focused" : "Set focus"}</button></div></div>
      </div>}
      <div className="strength-observation-summary"><strong>{activeObservations.length} saved</strong><span>{activeObservations.length ? `${workoutObservations.length} carried across from finished workouts${directAccess ? ", saved on this device only" : ""}.` : (directAccess ? "Finish a workout in the tracker, or log a lift below, to start your record." : (overview.data?.nextAction || "Log a lift to start your record."))}</span></div>

    <div className="strength-progress-grid grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="strength-log-entry dark-panel p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Add to your record</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Log a lift.</h2><p className="mt-3 max-w-xl text-xs leading-5 text-[var(--sg-text-muted-on-dark)]">For a lift the tracker did not record — a max you tested, or a session you did not log.</p></div><Dumbbell className="h-7 w-7 shrink-0 text-[var(--sg-focus-on-dark)]" /></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Choose exercise</span><input aria-label="Search and choose a catalog exercise" value={exerciseSearch} onChange={(event) => { setExerciseSearch(event.target.value); setSelectedExercise(null); setExerciseName(""); }} placeholder="Search catalog, then select" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label><LocalSearchScope scope="Searching the exercise catalog for a lift to record." query={exerciseSearch} />{exerciseSearch.trim() && !selectedExercise && <div className="strength-exercise-picker" role="listbox" aria-label="Catalog exercise results">{exerciseMatches.length ? exerciseMatches.map((exercise) => <button type="button" role="option" key={exercise.id} onClick={() => { emitInteractionFeedback(); setSelectedExercise(exercise); setExerciseName(exercise.name); setExerciseSearch(exercise.name); }}><strong>{exercise.name}</strong><span>{exercise.primaryMuscles.join(" · ")}</span></button>) : <p>No matching catalog exercise.</p>}</div>}{selectedExerciseContext && <StrengthCatalogSelectionPreview context={selectedExerciseContext} />}</div>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">How you measured it</span><select value={measurementType} onChange={(event) => setMeasurementType(event.target.value as MeasurementType)} className="h-12 rounded-xl border border-white/20 bg-[var(--sg-surface-raised)] px-3 text-sm text-white outline-none focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30">{measurementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Date</span><input type="date" value={observedDate} onChange={(event) => setObservedDate(event.target.value)} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <StrengthLoadInput weightUnit={weightUnit} value={loadKg} requiresLoad={needsLoad} onChange={setLoadKg} />
          {measurementType === "MULTI_REP" && <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Repetitions</span><input inputMode="numeric" value={repetitions} onChange={(event) => setRepetitions(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Enter reps" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>}
        </div>
        <button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="mt-4 block text-[11px] font-bold uppercase tracking-[.12em] text-[#9fc8f4] hover:text-white">{advancedOpen ? "Hide" : "Show"} more options</button>
        {advancedOpen && <div className="mt-3 grid gap-3 border-l-2 border-[var(--sg-focus-on-dark)] pl-3 sm:grid-cols-2">
          <StrengthBodyMassInput weightUnit={weightUnit} value={bodyMassKg} onChange={setBodyMassKg} />
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">How it was set up</span><select value={dataQuality} onChange={(event) => setDataQuality(event.target.value as ObservationDataQuality)} className="h-11 rounded-xl border border-white/20 bg-[var(--sg-surface-raised)] px-3 text-sm text-white outline-none focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30">{dataQualityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Which side</span><select value={laterality} onChange={(event) => setLaterality(event.target.value as typeof laterality)} className="h-11 rounded-xl border border-white/20 bg-[var(--sg-surface-raised)] px-3 text-sm text-white outline-none focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30"><option value="BILATERAL">Bilateral</option><option value="LEFT">Left</option><option value="RIGHT">Right</option></select></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Equipment</span><input value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="e.g. barbell, rack" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Range of motion</span><input value={romStandard} onChange={(event) => setRomStandard(event.target.value)} placeholder="e.g. full depth" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Variation</span><input value={techniqueVariant} onChange={(event) => setTechniqueVariant(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Tempo</span><input value={tempo} onChange={(event) => setTempo(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Assistance used</span><input value={externalAssistance} onChange={(event) => setExternalAssistance(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5 sm:col-span-2"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context for this result" className="min-h-20 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <p className="sm:col-span-2 text-xs leading-5 text-[var(--sg-text-muted-on-dark)]">All optional. They just help you compare like with like later on.</p>
        </div>}
        {piperCaptureAvailable && <details className="strength-piper-capture" open={piperReferenceOpen} onToggle={(event) => setPiperReferenceOpen(event.currentTarget.open)}><summary>Check exact Piper 2021 preacher-curl 10RM conditions</summary><p>This is optional. It is the only route to the source’s narrow adult-male college sample reference; it does not rate generic curls.</p>{piperReferenceOpen && <div className="strength-piper-fields"><label><span>Sex in this source comparison</span><select value={piperDeclaration.sex || ""} onChange={(event) => setPiperDeclaration((current) => ({ ...current, sex: (event.target.value || undefined) as PiperReferenceDeclaration["sex"] }))}><option value="">Choose</option><option value="male">Male</option><option value="female">Female</option><option value="intersex">Intersex</option><option value="self_described">Self-described</option><option value="prefer_not_to_say">Prefer not to say</option></select></label><label><span>Age on test day</span><input aria-label="Age on test day for Piper 2021 reference" inputMode="numeric" value={piperDeclaration.ageYears || ""} onChange={(event) => setPiperDeclaration((current) => ({ ...current, ageYears: Number(event.target.value.replace(/[^0-9]/g, "")) || undefined }))} placeholder="18–25" /></label><label><input type="checkbox" checked={piperDeclaration.collegeStudentConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, collegeStudentConfirmed: event.target.checked }))} /> I am male, 18–25, and a college student — the same group the study used.</label><label><input type="checkbox" checked={piperDeclaration.preTrainingConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, preTrainingConfirmed: event.target.checked }))} /> I did this lift before starting a training program for it, as the study group did.</label><label><input type="checkbox" checked={piperDeclaration.directlyObservedConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, directlyObservedConfirmed: event.target.checked }))} /> This 10RM was directly observed with valid technique and no assistance.</label><label><input type="checkbox" checked={piperDeclaration.exactProtocolConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, exactProtocolConfirmed: event.target.checked }))} /> I used the source’s Body Masters BE 207 seated 40° pad, 22 lb York EZ-bar, and stated technique protocol.</label></div>}</details>}
        {powerliftingCaptureAvailable && <details className="strength-piper-capture strength-powerlifting-capture" open={powerliftingReferenceOpen} onToggle={(event) => setPowerliftingReferenceOpen(event.currentTarget.open)}><summary>Competitive powerlifting reference</summary><p>Optional. This compares one exact maximum under drug-tested, unequipped competition standards for adults aged 18–35; it does not rate everyday gym lifts.</p>{powerliftingReferenceOpen && <div className="strength-piper-fields strength-powerlifting-fields"><label><span>Which competition category?</span><select value={powerliftingDeclaration.sex || ""} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, sex: (event.target.value || undefined) as PowerliftingReferenceDeclaration["sex"] }))}><option value="">Choose a category</option><option value="female">Women.s competition</option><option value="male">Men.s competition</option></select></label><label><span>Age on test day</span><input aria-label="Age on test day for powerlifting reference" inputMode="numeric" value={powerliftingDeclaration.ageYears || ""} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, ageYears: Number(event.target.value.replace(/[^0-9]/g, "")) || undefined }))} placeholder="18–35" /></label><label><input type="checkbox" checked={powerliftingDeclaration.drugTestedCompetitionConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, drugTestedCompetitionConfirmed: event.target.checked }))} /> This was a drug-tested powerlifting competition lift.</label><label><input type="checkbox" checked={powerliftingDeclaration.unequippedCompetitionConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, unequippedCompetitionConfirmed: event.target.checked }))} /> The lift was unequipped under the competition standard.</label><label><input type="checkbox" checked={powerliftingDeclaration.maximumSuccessfulLiftConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, maximumSuccessfulLiftConfirmed: event.target.checked }))} /> This was the maximum successful competition lift.</label><p>Use the saved profile weight only if it matches your body mass on this test day.</p></div>}</details>}
        <div className="strength-log-submit">
          <button type="button" disabled={!canSave || addObservation.isPending} onClick={submit} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--sg-action-fill)] px-4 text-[11px] font-bold uppercase tracking-[.12em] text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Plus className="h-4 w-4" /> {addObservation.isPending ? "Saving" : "Save this lift"}</button>
          {!canSave && <p className="strength-log-blocked" role="status">{!selectedExercise ? "Choose an exercise from the catalog above to save this." : `Enter the load in ${weightUnitLabel(weightUnit)} to save this.`}</p>}
        </div>
      </section>

      <aside className="strength-progress-log light-panel p-5"><p className="metric-label">Your history</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[var(--sg-text-on-light)]">Recent lifts</h2>{recentObservations.length ? <div className="mt-4 divide-y divide-[var(--sg-divider-on-light)]">{recentObservations.map((observation) => <div key={observation.id} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div><p className="text-sm font-bold text-[#153b61]">{observation.exerciseName}</p><p className="mt-1 text-[11px] text-[var(--sg-text-subtle-on-light)]">{observation.source === "workout" ? `From ${observation.sessionLabel || "a workout"}` : measurementTypeLabel(observation.measurementType)} · {new Date(observation.observedAt).toLocaleDateString()}</p></div><div className="strength-log-row-actions">{strengthRegionIdsForExerciseName(observation.exerciseName).length > 0 && <StrengthObservationReviewButton observation={observation as StrengthObservationRecord} onReview={openSavedObservation} />}{observation.source !== "workout" && <button type="button" className="strength-log-remove" disabled={removeObservation.isPending} onClick={() => requestObservationRemoval(observation as StrengthObservationRecord)} aria-label={`Remove the ${observation.exerciseName} test from ${new Date(observation.observedAt).toLocaleDateString()}`} title="Remove this test"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div>)}</div> : <div className="strength-log-empty"><Activity className="h-5 w-5" /><p><strong>Nothing logged yet</strong></p><p>Log your first lift and your progress starts tracking from there.</p></div>}{observationRemovalError && <p className="strength-log-remove-error" role="alert">{observationRemovalError}</p>}</aside>
    </div>
  </section>;
}
