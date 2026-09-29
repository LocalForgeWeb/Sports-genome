import { plural } from "@/lib/plural";
import { loadConventionFor, type LoadConvention } from "@shared/loadConventions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { Activity, ChevronDown, CircleHelp, Dumbbell, Info, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { getStrengthCatalogSelectionContext, strengthRegionDefinitions, type StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { StrengthGenomeBodyMap } from "@/components/StrengthGenomeBodyMap";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { searchExercises } from "@/lib/exerciseSearch";
import { displayWeightToKilograms, formatDisplayWeight, kilogramsToDisplayWeight, weightUnitLabel, type DisplayWeightUnit } from "@/lib/weightUnits";
import { deviceStrengthObservationEvent, loadDeviceStrengthObservations, prependDeviceStrengthObservation, saveDeviceStrengthObservations, setDeviceStrengthObservationBodyMass, type DeviceStrengthObservation, removeDeviceStrengthObservation } from "@/lib/deviceStrengthObservations";
import { getPiper2021PreacherCurlReference, piper2021PreacherCurlReferenceId, type Piper2021PreacherCurlContext } from "../../../shared/piper2021PreacherCurlReference";
import { getVanDenHoek2024PowerliftingReference, vanDenHoek2024ReferenceId, type PowerliftingReferenceDeclaration } from "@/lib/powerliftingReference";
import type { PowerliftingNormRow } from "@shared/powerliftingNormsReference";
import type { NormsReferenceRow } from "@shared/normsReference";
import { studyGroupLabel } from "@/lib/studyGroupLabel";
import { getRegistryReferenceForObservation, registryConnectionNotice, registryUnavailableExplanation, type RegistryConnectionState, type RegistryReferenceProfile } from "@/lib/registryReference";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";
import { summarizeWithinAthleteStrengthComparisons, type ChangeState, type ComparableStrengthObservation, type WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { strengthRegionIdsForExerciseName, workoutStrengthObservations, compareRegionRecordRelevance } from "@/lib/workoutStrengthRecord";
import { bodyWeightKgAt, bodyWeightLogEvent, loadBodyWeightLog, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { catalogExerciseIdForName, strengthPercentileCard, strengthPercentileGapCopy } from "@/lib/strengthPercentileCard";
import { regionRanksFromMuscles, type RegionRank } from "@shared/capabilityRank";
import { RankCard, UnscoredRankCard } from "@/components/CapabilityRank";
import { RankIcon } from "@/components/RankIcon";
import { RANKS, rankRangeLabel } from "@shared/capabilityRank";
import { muscleRankLifts } from "@/lib/muscleRankLifts";
import { ageAtLift } from "@/lib/normsCohort";
import { countCoveredRegions } from "@/lib/athleteRecord";
import { decimalEntryText } from "@/lib/numericEntry";
import { parseBirthYear } from "@/lib/birthYear";
import { localDateKey } from "@/lib/localDate";

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

/** What the load box asks for, by the scoring policy's convention for the exercise (EN-07, EN-09). */
const loadInputLabel = (convention: LoadConvention, unitLabel: string) =>
  convention === "per_implement" ? `Weight of one dumbbell in ${unitLabel}`
    : convention === "per_hand" ? `Weight in each hand in ${unitLabel}`
      : convention === "bodyweight_reps" ? `Added weight in ${unitLabel}`
        : `Load in ${unitLabel}`;

export function StrengthLoadInput({ weightUnit, value, requiresLoad, onChange, convention = "total_external_load" }: { weightUnit: DisplayWeightUnit; value: string; requiresLoad: boolean; onChange: (value: string) => void; convention?: LoadConvention }) {
  const label = loadInputLabel(convention, weightUnitLabel(weightUnit));
  return <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">{label} {requiresLoad ? "· required" : "· optional"}</span><input aria-label={label} inputMode="decimal" value={value} onChange={(event) => onChange(decimalEntryText(event.target.value))} placeholder={requiresLoad ? `Enter ${weightUnit}` : "Optional"} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

export function StrengthBodyMassInput({ weightUnit, value, onChange }: { weightUnit: DisplayWeightUnit; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Body mass at test ({weightUnit})</span><input aria-label={`Body mass at test in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={value} onChange={(event) => onChange(decimalEntryText(event.target.value))} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

// The visible name stays "Review"; `describedBy` points at the row's lift and
// date so a screen reader hears which lift each Review opens.
export function StrengthObservationReviewButton({ observation, onReview, describedBy }: { observation: StrengthObservationRecord; onReview: (observation: StrengthObservationRecord) => void; describedBy?: string }) {
  return <button type="button" onClick={() => { emitInteractionFeedback(); onReview(observation); }} className="strength-observation-review" aria-describedby={describedBy}>Review</button>;
}

export function StrengthRegionRecordDetail({ region, observations, onClose, weightUnit, baselineBodyWeight, directAccess, onSetDeviceBodyMass, initialRecordId = "", powerliftingNorms = [], strengthChanges = [], referenceRows = [], athleteProfile = null, bodyWeightHistory = [], onRankProfile, regionRank = null, rankMode = false, onLogLift, registryOffline = false }: { regionRank?: RegionRank | null; rankMode?: boolean; /** The research library could not be reached, so no comparison is a fact about the library, not the lift. */ registryOffline?: boolean; /** Opens the lift log on this page, for a region with nothing recorded yet. */ onLogLift?: () => void; region: StrengthRegionDefinition; observations: StrengthObservationRecord[]; onClose: () => void; weightUnit: DisplayWeightUnit; baselineBodyWeight?: number; directAccess: boolean; onSetDeviceBodyMass: (observationId: string, bodyMassKgAtTest: number) => void; initialRecordId?: string; powerliftingNorms?: readonly PowerliftingNormRow[]; strengthChanges?: readonly WithinAthleteStrengthChange[]; referenceRows?: readonly NormsReferenceRow[]; athleteProfile?: RegistryReferenceProfile; bodyWeightHistory?: readonly BodyWeightEntry[]; onRankProfile?: (patch: RankProfilePatch) => void }) {
  const records = useMemo(() => observations.filter((observation) => strengthRegionIdsForExerciseName(observation.exerciseName).includes(region.id)).sort((a, b) => compareRegionRecordRelevance(region.id, a, b)), [observations, region.id]);
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
  /*
   * No competitor rank for gym logs. A squat, bench or deadlift logged in the gym was
   * ranked against drug-tested, unequipped powerlifting competitors (van den Hoek 2024),
   * a population the reference policy excludes from default ranking and the brief rules
   * out as a default (B065) - and once a birth year was known that rank replaced the
   * community percentile. That table now answers only on the declared competitor path
   * (`powerliftingReference` above), where the athlete has said they compete.
   */
  // The registry resolves every approved source, so it leads. The two hand-written
  // routes stay as the offline fallback for the sources they already cover.
  const registryReference = useMemo(
    () => latestRecord ? getRegistryReferenceForObservation(latestRecord, referenceRows, athleteProfile, new Date(latestRecord.observedAt)) : null,
    [latestRecord, referenceRows, athleteProfile]
  );
  const registryMatch = registryReference?.status === "matched" ? registryReference : null;
  const hasOutsideComparison = registryMatch != null || powerliftingReference?.status === "matched" || piperReference?.status === "matched";
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
      // Age on the day of this lift, so a birth year given after it still counts.
      ageYears: latestRecord ? ageAtLift(athleteProfile?.birthYear ?? undefined, latestRecord.observedAt) ?? null : null,
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
  const showPercentile = !hasOutsideComparison && percentileCard != null;
  // With the library unreachable there are no rows to gate on, so say that
  // plainly rather than let the lift read as one that did not qualify.
  const registryOfflineReason = registryOffline && !hasOutsideComparison && !showPercentile ? registryUnavailableExplanation.registry_unavailable : null;
  /*
   * What the community comparison still needs, asked where the comparison would be. A
   * group the curves do not split by is a complete answer, not a missing one, so it gets
   * an explanation instead of the question again.
   */
  const needsGroup = !hasOutsideComparison && betaPercentile.data?.status === "unavailable" && betaPercentile.data.reason === "sex_required";
  const groupWithoutCurve = needsGroup && Boolean(athleteProfile?.sexForReference) && percentileSex === null;
  const strengthTrend = latestRecord ? strengthChanges.find((change) => normalizedName(change.exerciseName) === normalizedName(latestRecord.exerciseName)) : undefined;
  useEffect(() => {
    if ((!registryMatch && piperReference?.status !== "matched") || !matchedReferenceRef.current) return;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => matchedReferenceRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" }));
  }, [latestRecord?.id, piperReference?.status, registryMatch?.referenceKey]);
  const parsedBodyMassEntry = Number(bodyMassEntry);
  return <section className="strength-region-record-detail" aria-label={`${region.label} recorded strength context`}>
    <div className="strength-region-record-heading"><div><p className="metric-label">Your record</p><h2 tabIndex={-1} data-strength-region-heading>{region.label}</h2></div><button type="button" onClick={() => { emitInteractionFeedback(); onClose(); }} className="strength-region-close" aria-label={`Close ${region.label} detail`}><X className="h-4 w-4" /></button></div>
    {rankMode && (regionRank ? <RankCard regionRank={regionRank} /> : <UnscoredRankCard hasRecords={records.length > 0} />)}
    {latestRecord ? <>
      <article className="strength-region-record-card">
        {records.length > 1 ? <label className="strength-region-record-picker"><span>Which lift</span><select aria-label="Which lift to show" value={selectedRecordId || String(latestRecord.id)} onChange={(event) => setSelectedRecordId(event.target.value)}>{records.map((record) => <option key={record.id} value={String(record.id)}>{record.exerciseName} · {new Date(record.observedAt).toLocaleDateString()}</option>)}</select></label> : <span className="strength-region-test-name">{latestRecord.exerciseName}</span>}
        {strengthTrend ? <article className="strength-reference-matched strength-reference-primary strength-rating-card" style={{ borderColor: changeStateCopy[strengthTrend.changeState].tone }}>
          <p className="metric-label">Your rating on this lift</p>
          <strong className="strength-body-mass-ratio" style={{ color: changeStateCopy[strengthTrend.changeState].tone }}>{strengthTrend.relativeChangePercent >= 0 ? "+" : ""}{strengthTrend.relativeChangePercent.toFixed(0)}%</strong>
          <span className="strength-rating-state" style={{ color: changeStateCopy[strengthTrend.changeState].tone }}>{changeStateCopy[strengthTrend.changeState].label}</span>
          <p>Change in your estimated one-rep max across {strengthTrend.observationCount} logs since {strengthTrend.firstPoint.observedAt.toLocaleDateString()}.</p>
        </article> : <p className="strength-rating-empty">Log this lift once more and your progress rating shows up here.</p>}
        {bodyMassRatio != null && !showPercentile && <p className="strength-region-ratio-inline">{bodyMassRatio.toFixed(2)}× {bodyMassWeightPhrase[bodyMassSource!]} — for your own context, not a rank.</p>}
        {registryMatch ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Compared to that study group</p><strong>{registryMatch.percentileBandLabel}</strong><p>{registryMatch.unit === "x_bodyweight" ? `${registryMatch.observedValue.toFixed(2)}× body mass` : `${registryMatch.observedValue.toFixed(1)} ${registryMatch.unit}`}{studyGroupLabel(registryMatch.populationDefinition) ? ` · ${studyGroupLabel(registryMatch.populationDefinition)}` : ""}{registryMatch.sampleSize ? ` · ${registryMatch.sampleSize.toLocaleString()} people` : ""}. This exact test only.</p>{registryMatch.sourceUrl && <a href={registryMatch.sourceUrl} target="_blank" rel="noreferrer">View the source study</a>}</article> : powerliftingReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Compared to that competition group</p><strong>{powerliftingReference.percentileBandLabel}</strong><p>{powerliftingReference.relativeStrength.toFixed(2)}× body mass · {powerliftingReference.sourceLabel}. Exact competition context only.</p><a href={powerliftingReference.sourceUrl} target="_blank" rel="noreferrer">View van den Hoek et al. 2024 source</a></article> : piperReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Source-sample rank range</p><strong>{piperReference.comparison}</strong><p>{piperReference.sourceLabel} · {piperReference.bodyMassBand}. This is the primary result for this exact matched test only.</p><a href="https://doi.org/10.47206/ijsc.v1i1.40" target="_blank" rel="noreferrer">View Piper et al. 2021 source</a></article> : null}
        {showPercentile && percentileCard && <article className="strength-reference-matched strength-reference-primary strength-rank-card"><p className="metric-label">Where this sits</p><strong>{percentileCard.headline}</strong><p>{percentileCard.detail}{bodyMassSource !== null && bodyMassSource !== "recorded" ? ` Read against ${bodyMassWeightPhrase[bodyMassSource]}.` : ""}</p></article>}
        {!hasOutsideComparison && !showPercentile && percentileGap && !needsGroup && <p className="strength-rank-needs">{percentileGap}</p>}
        {needsGroup && (groupWithoutCurve
          ? <p className="strength-rank-needs">{communityGroupWithoutCurveCopy}</p>
          : <ComparisonGate need="group" onProfile={onRankProfile} fallback={percentileGap} />)}
        {showPercentile && !athleteProfile?.birthYear && <ComparisonGate need="birthYear" onProfile={onRankProfile} />}
        {bodyMassSource !== "recorded" && <details className="strength-recorded-measurement"><summary>{bodyMassSource === null ? "Add test body weight" : "Not your weight that day?"}</summary><form className="strength-ratio-entry" onSubmit={(event) => { event.preventDefault(); if (!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0) return; const bodyMassKgAtTest = displayWeightToKilograms(parsedBodyMassEntry, weightUnit); if (directAccess) { onSetDeviceBodyMass(String(latestRecord.id), bodyMassKgAtTest); setBodyMassEntry(""); emitInteractionFeedback([10, 30, 10]); toast.success("Saved profile body weight attached to this test on this device."); return; } setBodyMassSaveError(null); setObservationBodyMass.mutate({ observationId: Number(latestRecord.id), bodyMassKgAtTest }); }}><label><span>{`Body weight on ${new Date(latestRecord.observedAt).toLocaleDateString()} (${weightUnit})`}</span><input aria-label={`Body weight on the day of this lift, in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={bodyMassEntry} onChange={(event) => { setBodyMassSaveError(null); setBodyMassEntry(decimalEntryText(event.target.value)); }} placeholder={weightUnit === "lb" ? "e.g. 180" : "e.g. 82"} /></label><button type="submit" aria-busy={!directAccess && setObservationBodyMass.isPending} disabled={!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0 || (!directAccess && setObservationBodyMass.isPending)}>{!directAccess && setObservationBodyMass.isPending ? "Saving" : "Save this body weight"}</button>{offeredBodyMass !== undefined && <small>{offeredIsDated ? "This lift is already read against what you weighed that week. Save a different number only if you know it was different that day." : "This lift is already read against your profile weight. Save the weight you were that day if you know it was different."}</small>}{!directAccess && setObservationBodyMass.isPending && <p className="strength-ratio-status" role="status">Saving body mass for this test…</p>}{bodyMassSaveError && <p className="strength-ratio-error" role="alert">{bodyMassSaveError}</p>}</form></details>}
        <details className="strength-region-boundary"><summary>{hasOutsideComparison || showPercentile ? "About this comparison" : "No ranking for this lift yet"}</summary>{(registryGateExplanation ?? registryOfflineReason) && <p className="strength-region-gate-reason">{registryGateExplanation ?? registryOfflineReason}</p>}<p>{hasOutsideComparison ? "This matches one specific study, for this exact test only — not a general claim about how strong you are." : showPercentile ? "Placed against lifting data from people of the same sex, on this exercise. It is a comparison on this lift alone, not a general claim about how strong you are." : "Rankings come from published research, which so far covers the barbell squat, bench press and deadlift. Your rating above is measured from your own logs."}</p></details>
        <span className="strength-region-test-meta">{latestRecord.loadKg != null ? formatDisplayWeight(latestRecord.loadKg, weightUnit) : "No load"}{latestRecord.repetitions ? ` · ${plural(latestRecord.repetitions, "rep")}` : ""} · {new Date(latestRecord.observedAt).toLocaleDateString()}{/* The weight this lift was read against, said out loud: it was saved with the lift and does not move when the profile weight changes. */}{effectiveBodyMassKg != null ? ` · at ${formatDisplayWeight(effectiveBodyMassKg, weightUnit)}` : ""}{latestRecord.source === "workout" ? ` · top set of ${latestRecord.setCount} from ${latestRecord.sessionLabel || "a workout"}` : ""}</span>
      </article>
    </> : <div className="strength-region-record-empty"><p>Nothing logged for this muscle group yet.</p><p>Log a lift that trains it and your progress will show up here.</p>{onLogLift && <button type="button" onClick={() => { emitInteractionFeedback(); onLogLift(); }}>Log a lift for {region.label.toLowerCase()} <Plus className="h-4 w-4" aria-hidden="true" /></button>}</div>}
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

/** Said instead of asking again when the athlete chose a group the curves are not split by. */
const communityGroupWithoutCurveCopy =
  "The community comparisons are split into men and women who lift, so this lift has no percentile for the group you chose. It still counts toward your own progress.";

/**
 * The last step to a percentile, taken here.
 *
 * "Add the sex to compare against in About Me" is a true sentence and a dead end: the
 * athlete is inside a record sheet on the Progress tab, and the field is four taps away
 * in Profile, after which nothing returns them to the lift they were looking at. The
 * same question answered in place turns the comparison on while the card is on screen.
 *
 * Two profile fields only: the group the community curves are split by, which the
 * comparison cannot run without, and - once it runs - the optional birth year that
 * applies the published age adjustment. Load and test body weight belong to the
 * observation, and the card carries its own body-weight form directly underneath.
 */
function ComparisonGate({ need, onProfile, fallback = null }: { need: "group" | "birthYear"; onProfile?: (patch: RankProfilePatch) => void; fallback?: string | null }) {
  const [year, setYear] = useState("");
  if (!onProfile) return fallback ? <p className="strength-rank-needs">{fallback}</p> : null;
  if (need === "group") {
    return <div className="strength-rank-gate">
      <p>Choose the group to compare against and this lift gets a percentile.</p>
      <label><span>Compare against</span><select
        value=""
        aria-label="Group to compare this lift against"
        onChange={(event) => { if (!event.target.value) return; emitInteractionFeedback(); onProfile({ sexForReference: event.target.value as SexForReference }); }}
      >
        <option value="">Choose a group</option>
        <option value="female">Women who lift</option>
        <option value="male">Men who lift</option>
        <option value="unspecified">Prefer not to say</option>
      </select></label>
      <small>Used only to pick which community curve this lift is read against. It is saved to About Me.</small>
    </div>;
  }
  // Read the same way as in onboarding and About Me, so a year one takes the others take too.
  const parsed = parseBirthYear(year);
  const valid = parsed !== undefined;
  return <form className="strength-rank-gate" onSubmit={(event) => { event.preventDefault(); if (parsed === undefined) return; emitInteractionFeedback(); onProfile({ birthYear: parsed }); }}>
    <p>Optional: add your birth year and this comparison is adjusted for your age at each lift.</p>
    <label><span>Birth year</span><input inputMode="numeric" value={year} placeholder="e.g. 1998" aria-label="Birth year" onChange={(event) => setYear(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} /></label>
    <button type="submit" disabled={!valid}>Save</button>
    <small>Used only for the published age adjustment (ages 15 to 90). It is saved to About Me.</small>
  </form>;
}

/** Why a lift is not behind any rank, in the athlete's words. Unknown reasons fall back to a plain "could not be scored". */
const unrankedReasonCopy: Record<string, string> = {
  exercise_not_recognised: "not in the comparison library yet",
  body_mass_required: "needs your body weight that day",
  estimated_only: "no comparison group for this lift yet",
  missing_percentile: "no comparison group for this lift yet",
  invalid_input: "could not be read",
  invalid_observation: "could not be read",
  // A pull-up or dip is compared on reps; its comparison has no way to count added weight yet.
  added_load_not_scored: "compared on reps alone, so sets with added weight are not ranked yet",
  load_required: "needs the weight lifted",
};

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
  // A request that failed outright (no signal, or the API down) is the library
  // being out of reach too. While loading or retrying, isError stays false.
  const registryFetchFailed = registryStatusQuery.isError || referenceRowsQuery.isError;
  const registryOfflineNotice = registryConnectionNotice(registryFetchFailed ? { state: "unreachable", detail: "" } : registryStatusQuery.data?.connection as RegistryConnectionState | undefined);
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
      toast.success("Lift removed. Your history and comparisons no longer count it.");
      await Promise.all([utils.strengthGenome.observations.invalidate(), utils.strengthGenome.overview.invalidate()]);
    },
    onError: () => setObservationRemovalError("That lift was not removed. Check your connection and try again."),
  });
  const prefilledPiperDeclaration: PiperReferenceDeclaration = { ...emptyPiperDeclaration, sex: mapSexForPiper(sexForReference), ageYears: ageFromBirthYear(birthYear) };
  const prefilledPowerliftingDeclaration: PowerliftingReferenceDeclaration = { ...emptyPowerliftingDeclaration, sex: mapSexForPowerlifting(sexForReference), ageYears: ageFromBirthYear(birthYear) };
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [measurementType, setMeasurementType] = useState<MeasurementType>("MEASURED_1RM");
  const [loadKg, setLoadKg] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [observedDate, setObservedDate] = useState(() => localDateKey());
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
  // The form opens from the one primary action and closes with it; the fields
  // keep their values either way, so closing is never losing a half-typed lift.
  const [logOpen, setLogOpen] = useState(false);
  const logFormRef = useRef<HTMLDetailsElement | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<StrengthRegionDefinition | null>(null);
  // The sheet outlives the selection by the length of its exit animation.
  const { shown: sheetRegion, isLeaving: sheetLeaving } = useSheetPresence(selectedRegion);
  const [selectedObservationId, setSelectedObservationId] = useState("");
  const regionDetailRef = useRef<HTMLDivElement | null>(null);
  // Whatever opened the record (a muscle, a region button, a Review button) gets
  // focus back when the record closes, instead of focus falling to the page.
  const regionOpenerRef = useRef<HTMLElement | SVGElement | null>(null);
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
  // A lift that did not save says so beside the button, in either access mode,
  // and the entry stays in the form so nothing typed is lost.
  const [saveError, setSaveError] = useState<string | null>(null);
  const addObservation = trpc.strengthGenome.addObservation.useMutation({
    onSuccess: async () => {
      setSaveError(null);
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
    // Every failure is reported here in fixed words: the server message is either
    // a validation list or a generic fault notice, neither of them for athletes.
    // An expired sign-in gets no toast of its own: main.tsx says that app-wide,
    // but at most once a minute, so the reason is still written beside the button.
    // It names no place to sign in again: this build has none (see sessionExpiryNotice).
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        setSaveError("This lift was not saved because your sign-in has expired. Your entry is still here.");
        return;
      }
      setSaveError(error.data?.code === "BAD_REQUEST"
        ? "This lift was not saved: check the date and the numbers, then save again. Your entry is still here."
        : "This lift was not saved. Your entry is still here. Check your connection and save again.");
      toast.error("Could not save this lift.");
    },
  });

  const parsedLoad = useMemo(() => Number(loadKg), [loadKg]);
  const parsedRepetitions = useMemo(() => Number(repetitions), [repetitions]);
  const parsedBodyMass = useMemo(() => Number(bodyMassKg), [bodyMassKg]);
  const needsLoad = ["MEASURED_1RM", "MULTI_REP"].includes(measurementType);
  // Tolerant of spacing, abbreviations and a letter out of place, like every other
  // place a lift is typed: a "romanain deadlift" logged here is the same lift.
  const exerciseMatches = useMemo(() => searchExercises(exercises, exerciseSearch).slice(0, 8), [exerciseSearch]);
  const selectedExerciseContext = useMemo(() => selectedExercise ? getStrengthCatalogSelectionContext(selectedExercise) : null, [selectedExercise]);
  const piperCaptureAvailable = exerciseName === "Preacher Curl" && measurementType === "MULTI_REP";
  const powerliftingCaptureAvailable = ["Back Squat", "Barbell Bench Press", "Conventional Deadlift"].includes(exerciseName) && measurementType === "MEASURED_1RM";
  // A real day the record can hold: not before 1970 and not after the athlete's own
  // today, the picker's own min and max, which a typed date can get past. A typo year
  // such as 0202 or 2100 would otherwise be saved as it stands, or refused by the
  // server. The day is read back to refuse one the month does not have, which Date
  // would roll over (2021-02-30 into March). The server keeps two days of slack
  // because it cannot know the athlete's time zone; this form knows it, so it keeps none.
  const liftDateAt = new Date(`${observedDate}T12:00:00`).getTime();
  const liftDateInRange = /^\d{4}-\d{2}-\d{2}$/.test(observedDate)
    && Number.isFinite(liftDateAt)
    && localDateKey(new Date(liftDateAt)) === observedDate
    && observedDate >= "1970-01-02"
    && observedDate <= localDateKey();
  // The load is required where its label says so, and a blank box is not 0 kg:
  // Number("") is 0, which would save a 0 kg max. A working set needs its reps
  // to be read at all. A pull-up or push-up is scored on reps, so its load stays optional.
  const loadConvention = loadConventionFor(selectedExercise?.id);
  const loadRequired = needsLoad && loadConvention !== "bodyweight_reps";
  const hasLoad = loadKg.trim() !== "" && Number.isFinite(parsedLoad);
  // Only a lone separator reaches this: the load box's decimalEntryText reads a ","
  // as "." and folds any later points into the decimals ("1.2.3" becomes "1.23"), so
  // a bare "." is the one entry it lets through that is not a number. In an optional
  // box it is named by the box's own label, since "enter the load" would ask for a
  // value the label says is not needed.
  const loadInvalid = loadKg.trim() !== "" && !Number.isFinite(parsedLoad);
  const loadLabel = loadInputLabel(loadConvention, weightUnitLabel(weightUnit));
  const loadMissing = loadRequired && !(hasLoad && parsedLoad > 0);
  const repsMissing = measurementType === "MULTI_REP" && !(repetitions !== "" && Number.isInteger(parsedRepetitions) && parsedRepetitions >= 1);
  const canSave = Boolean(selectedExercise) && !loadMissing && !loadInvalid && !repsMissing && liftDateInRange;
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

  /**
   * Strength/Rank mode. The athlete's lifts, each at the body weight saved with it, scored and
   * aggregated per muscle by the database; the map draws each region from the muscle best
   * supported by evidence. Without a sex to compare against, or with no reachable service, the
   * map stays in its coverage view rather than drawing ranks it cannot justify.
   */
  const rankSex: "male" | "female" | null = sexForReference === "male" || sexForReference === "female" ? sexForReference : null;
  const rankLifts = useMemo(
    () => muscleRankLifts(activeObservations, bodyWeightHistory, baselineBodyWeight != null ? displayWeightToKilograms(baselineBodyWeight, weightUnit) : null, birthYear),
    [activeObservations, bodyWeightHistory, baselineBodyWeight, weightUnit, birthYear]
  );
  const muscleRanks = trpc.strengthProfile.muscleRanks.useQuery(
    { sex: rankSex, lifts: rankLifts },
    { enabled: rankSex !== null && rankLifts.length > 0, staleTime: 5 * 60 * 1000, retry: false }
  );
  // A failed rank request says so and can be tried again. The server answers a
  // database outage as "unavailable: service_error" rather than as an error, so
  // both count. A missing server setting stays quiet: trying again cannot fix it.
  // Offline, the request waits for a connection and says that instead. Both
  // speak only while no ranks are drawn: a background refetch that fails, or
  // waits offline, keeps the ranks already on the map, and they still stand.
  const ranksWanted = rankSex !== null && rankLifts.length > 0;
  const rankProfile = muscleRanks.data && muscleRanks.data.status !== "unavailable" ? muscleRanks.data : null;
  const ranksFailed = ranksWanted && rankProfile === null && (muscleRanks.isError || (muscleRanks.data?.status === "unavailable" && muscleRanks.data.reason === "service_error"));
  const ranksOffline = ranksWanted && muscleRanks.isPending && muscleRanks.fetchStatus === "paused";
  const regionRanks = useMemo(() => (rankProfile ? regionRanksFromMuscles(rankProfile.muscles) : null), [rankProfile]);
  const unrankedLifts = useMemo(() => {
    const counts = new Map<string, { exerciseName: string; reason: string; count: number }>();
    (rankProfile?.unranked ?? []).forEach((item) => {
      const key = `${item.exerciseName}|${item.reason}`;
      counts.set(key, { ...item, count: (counts.get(key)?.count ?? 0) + 1 });
    });
    return Array.from(counts.values());
  }, [rankProfile]);
  // While the ranks are being computed the map shows coverage, which is true
  // and says so in its own legend; the line below says ranks are on the way so
  // the coverage colours are not read as ranks.
  const rankNotice = ranksFailed
    ? <p className="rank-profile-partial" role="status">Ranks could not be worked out just now, so the map shows where lifts are on record. <button type="button" className="rank-profile-retry" disabled={muscleRanks.isFetching} onClick={() => { emitInteractionFeedback(); void muscleRanks.refetch(); }}>{muscleRanks.isFetching ? "Trying again…" : "Try again"}</button></p>
    : ranksOffline
    ? <p className="rank-profile-partial" role="status">Waiting for a connection to rank your lifts. Until then the map shows where lifts are on record.</p>
    : rankSex !== null && rankLifts.length > 0 && muscleRanks.isPending
    ? <p className="rank-profile-partial" role="status">Ranking your lifts… the map shows where lifts are on record until the ranks arrive.</p>
    : rankSex === null && rankLifts.length > 0
    ? <p className="rank-profile-partial">Ranks on this map need the sex to compare against — set it in About Me.</p>
    : unrankedLifts.length > 0
      ? <details className="rank-profile-partial">
          <summary>{rankProfile!.unranked.length} {rankProfile!.unranked.length === 1 ? "lift is" : "lifts are"} not in these ranks</summary>
          <ul>{unrankedLifts.map((item) => <li key={`${item.exerciseName}-${item.reason}`}>{item.exerciseName}{item.count > 1 ? ` ×${item.count}` : ""} — {unrankedReasonCopy[item.reason] ?? "could not be scored"}</li>)}</ul>
        </details>
      : null;
  /**
   * What age did to the ranks. The map's colours already include it; this says so, and says
   * which lifts it could not reach, rather than leaving a birth year that seemed to do nothing.
   */
  const ageSummary = rankProfile?.ageAdjustment;
  const ageSentences = birthYear && ageSummary ? [
    ageSummary.applied > 0 ? "Ranks are adjusted for your age at each lift." : null,
    ageSummary.outsideTable > 0
      ? `${ageSummary.outsideTable} ${ageSummary.outsideTable === 1 ? "lift was" : "lifts were"} made at an age the published age adjustment does not cover (15 to 90), so ${ageSummary.outsideTable === 1 ? "it is" : "they are"} compared without one.`
      : null,
  ].filter(Boolean) : [];
  const ageNotice = ageSentences.length ? <p className="rank-profile-partial" data-rank-age-note>{ageSentences.join(" ")}</p> : null;
  // Covered means "you have recorded work here", never a rank or a score. A
  // locally recorded lift counts in both access modes, so the server overview can
  // only add regions, never take one away that this device can see.
  const regionHasLocalRecord = (regionId: string) => activeObservations.some((observation) => strengthRegionIdsForExerciseName(observation.exerciseName).includes(regionId));
  const regionOverview = (regionId: string) => {
    if (regionHasLocalRecord(regionId)) return { state: "OBSERVED_TEST_CONTEXT" as const };
    if (directAccess) return { state: "INSUFFICIENT_DATA" as const };
    return overview.data?.regions.find((region) => region.id === regionId);
  };
  // The one definition Home and Progress read too: a region is covered when any
  // recorded lift lands in it. An account can only add regions this device
  // cannot see, never take one away.
  const observedRegionCount = directAccess ? countCoveredRegions(activeObservations) : strengthRegionDefinitions.filter((region) => regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT").length;
  const sourceMatchedObservationCount = activeObservations.filter((observation) => getRegistryReferenceForObservation(observation, referenceRows, athleteProfile, new Date(observation.observedAt))?.status === "matched" || getPiperReferenceForObservation(observation)?.status === "matched" || getPowerliftingReferenceForObservation(observation, powerliftingNorms)?.status === "matched").length;
  const activePriorityIds = new Set(priorities.data?.map(priority => priority.regionId) || overview.data?.athleteConfirmedPriorityRegionIds || []);
  // The view follows the device: a refused write keeps the old list and is
  // reported, so nothing on screen claims a record the device does not hold.
  const persistDeviceObservations = (next: DeviceStrengthObservation[]): boolean => { const written = saveDeviceStrengthObservations(next); if (written) setDeviceObservations(next); return written; };
  const setDeviceBodyMass = (observationId: string, bodyMassKgAtTest: number) => persistDeviceObservations(setDeviceStrengthObservationBodyMass(deviceObservations, observationId, bodyMassKgAtTest));

  const requestObservationRemoval = (observation: StrengthObservationRecord) =>
    setPendingObservationRemoval({
      title: "Remove this lift?",
      body: `The ${observation.exerciseName} lift from ${new Date(observation.observedAt).toLocaleDateString()} is deleted. It stops counting in your history, your change tracking, and any comparison drawn from it. This cannot be undone.`,
      confirmLabel: "Remove lift",
      onConfirm: () => {
        setPendingObservationRemoval(null);
        setObservationRemovalError(null);
        if (directAccess) {
          persistDeviceObservations(removeDeviceStrengthObservation(deviceObservations, String(observation.id)));
          emitInteractionFeedback([10, 30, 10]);
          toast.success("Lift removed from this device.");
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
    // However the record closed (the close button, Escape, a second tap on the
    // muscle, Log a lift), its opener is forgotten, so a later open whose click
    // leaves focus on the page never hands focus to a control from an old visit.
    if (!selectedRegion) { regionOpenerRef.current = null; return; }
    const detail = regionDetailRef.current;
    if (!detail || typeof window === "undefined") return;
    // Remember the opener before focus moves into the record. Focus already
    // inside the record (a second lift reviewed from it) is never the opener.
    const active = document.activeElement;
    if ((active instanceof HTMLElement || active instanceof SVGElement) && active !== document.body && !detail.contains(active)) regionOpenerRef.current = active;
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
  // Closing hands focus back to the opener. The record stays mounted, hidden,
  // for its exit animation, so focus left in it would sit in hidden content.
  // Focus anywhere else stays put: Escape is heard page-wide, and pressing it in
  // the exercise search must not pull focus to a muscle further up the page.
  const closeRegionRecord = () => {
    const active = document.activeElement;
    const focusWasInRecord = !active || active === document.body || Boolean(regionDetailRef.current?.contains(active));
    setSelectedRegion(null);
    setSelectedObservationId("");
    const opener = regionOpenerRef.current;
    regionOpenerRef.current = null;
    if (focusWasInRecord && opener?.isConnected) opener.focus({ preventScroll: true });
  };
  // Escape closes the pinned record, the way it closes any other layer that sits
  // over the page. The figure stays tappable while it is open, so this is the
  // only dismissal a keyboard needs beyond the close button.
  useEffect(() => {
    if (!selectedRegion || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeRegionRecord();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRegion]);
  const setPriority = trpc.strengthGenome.setPriority.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.strengthGenome.overview.invalidate(), utils.strengthGenome.priorities.invalidate()]);
    },
    // An expired sign-in is not a connection fault: say the real cause, and name no
    // place to sign in again, since this build has none. main.tsx's app-wide notice
    // speaks at most once a minute, so this one still does, under that notice's id so
    // it takes the notice's place rather than stacking under it. Sonner keeps any field
    // the replaced toast had, so the notice's "Everything stays saved on this device"
    // is cleared: the focus was saved nowhere.
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("Focus was not saved because your sign-in has expired.", { id: "session-expired", description: undefined });
        return;
      }
      toast.error("Focus was not saved. Check your connection and try again.");
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
      measuredOneRmKg: measurementType === "MEASURED_1RM" && hasLoad && parsedLoad > 0 ? displayWeightToKilograms(parsedLoad, weightUnit) : undefined,
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
      const written = persistDeviceObservations(prependDeviceStrengthObservation(deviceObservations, { ...nextObservation, id: `device-strength-${Date.now()}`, observedAt: nextObservation.observedAt.toISOString() }));
      if (!written) {
        setSaveError("This lift was not saved: this device refused the write (storage full, private browsing, or storage blocked). Your entry is still here — free some space and save again.");
        toast.error("Could not save this lift on this device.");
        return;
      }
      setSaveError(null);
      setExerciseName(""); setExerciseSearch(""); setSelectedExercise(null); setLoadKg(""); setRepetitions(""); setBodyMassKg(""); setEquipment(""); setRomStandard(""); setTechniqueVariant(""); setTempo(""); setLaterality("BILATERAL"); setExternalAssistance(""); setDataQuality("SELF_REPORTED"); setPiperReferenceOpen(false); setPiperDeclaration(prefilledPiperDeclaration); setPowerliftingReferenceOpen(false); setPowerliftingDeclaration(prefilledPowerliftingDeclaration); setNotes("");
      emitInteractionFeedback([10, 30, 10]); toast.success("Lift saved on this device.");
      return;
    }
    setSaveError(null);
    addObservation.mutate(nextObservation);
  };

  const regionTotal = strengthRegionDefinitions.length;
  const recordWord = activeObservations.length === 1 ? "record" : "records";
  return <section className="strength-genome-workspace">
    {/* The metrics, distinct and named: coverage is how many regions carry a
        qualifying record, lifts is how many records there are. Neither is a rank. */}
    <section className="strength-profile-status" aria-label="Strength Genome summary">
      <h1>Strength Genome</h1>
      <p className="strength-profile-metrics"><span><b>{observedRegionCount} / {regionTotal}</b> regions covered</span><span aria-hidden="true">·</span><span><b>{activeObservations.length}</b> {activeObservations.length === 1 ? "lift" : "lifts"} recorded</span></p>
      <p className="strength-profile-coverage-note">Coverage tracks logged regions, not rank.</p>
      <div className="strength-profile-status-footnote">
        <span className="strength-profile-device-boundary"><CircleHelp className="h-3.5 w-3.5" aria-hidden="true" /> {directAccess ? "This device" : "Private record"}</span>
        {sourceMatchedObservationCount > 0 && <span className="strength-profile-reference-summary">Comparison ready on {sourceMatchedObservationCount} lift{sourceMatchedObservationCount === 1 ? "" : "s"}</span>}
      </div>
    </section>

    <StrengthGenomeBodyMap regionRanks={regionRanks} rankNotice={rankNotice || ageNotice ? <>{rankNotice}{ageNotice}</> : null} ranksPending={rankSex !== null && rankLifts.length > 0 && muscleRanks.isPending} regions={strengthRegionDefinitions.map((region) => ({ ...region, state: regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT" ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const }))} activePriorityIds={activePriorityIds} selectedRegionId={selectedRegion?.id} onSelect={(region) => { setSelectedRegion(region || null); if (!region) setSelectedObservationId(""); }} />
    {pendingObservationRemoval && <ConfirmDialog {...pendingObservationRemoval} onCancel={() => setPendingObservationRemoval(null)} />}
    {sheetRegion && <div ref={regionDetailRef} className={`strength-region-sheet${sheetLeaving ? " is-leaving" : ""}`} role="group" aria-label={`${sheetRegion.label} record`} aria-hidden={sheetLeaving || undefined}><StrengthRegionRecordDetail key={`${sheetRegion.id}-${selectedObservationId}`} regionRank={regionRanks?.get(sheetRegion.id) ?? null} rankMode={regionRanks !== null} region={sheetRegion} observations={activeObservations as StrengthObservationRecord[]} onClose={closeRegionRecord} onLogLift={() => { setSelectedRegion(null); setSelectedObservationId(""); setLogOpen(true); window.requestAnimationFrame(() => { logFormRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }); logFormRef.current?.querySelector<HTMLInputElement>('input[aria-label="Search and choose a catalog exercise"]')?.focus({ preventScroll: true }); }); }} weightUnit={weightUnit} baselineBodyWeight={baselineBodyWeight} directAccess={directAccess} onSetDeviceBodyMass={setDeviceBodyMass} initialRecordId={selectedObservationId} powerliftingNorms={powerliftingNorms} strengthChanges={comparableStrengthChanges} referenceRows={referenceRows} athleteProfile={athleteProfile} bodyWeightHistory={bodyWeightHistory} onRankProfile={onRankProfile} registryOffline={registryOfflineNotice !== null} />
      {/* Focus is kept only with an account's priorities, which direct access never
          reads, so on a device-only record the row offers training alone. */}
      <div className="strength-region-focus-row">{directAccess ? <p><strong>Want to train this?</strong> Add it to a day in Train.</p> : <p><strong>Want to prioritize this?</strong> Optional. It will not change today&apos;s workout on its own.</p>}<div><button type="button" onClick={() => { emitInteractionFeedback(); onOpenTraining(); }} className="strength-focus-secondary">Review training</button>{!directAccess && <button type="button" disabled={setPriority.isPending} onClick={() => { emitInteractionFeedback(); setPriority.mutate({ regionId: sheetRegion.id, active: !activePriorityIds.has(sheetRegion.id) }); }} className={`strength-focus-primary ${activePriorityIds.has(sheetRegion.id) ? "is-active" : ""}`}>{activePriorityIds.has(sheetRegion.id) ? "Focused" : "Set focus"}</button>}</div></div>
    </div>}

    {/* The one primary action. It opens the existing form in place - every
        field, label and validation message as before - and closes it again. */}
    <details ref={logFormRef} className="strength-log-entry" open={logOpen}>
      <summary className="strength-log-open" aria-expanded={logOpen} onClick={(event) => { event.preventDefault(); emitInteractionFeedback(); setLogOpen((current) => { const next = !current; if (next) window.requestAnimationFrame(() => logFormRef.current?.querySelector<HTMLInputElement>('input[aria-label="Search and choose a catalog exercise"]')?.focus({ preventScroll: true })); return next; }); }}><span>Log a lift</span>{logOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}</summary>
      <div className="strength-log-form">
        <div className="strength-log-form-head"><div><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Add to your record</p><p className="strength-log-form-note">For a lift the tracker did not record — a max you tested, or a session you did not log.</p></div><Dumbbell className="h-6 w-6 shrink-0 text-[var(--sg-focus-on-dark)]" aria-hidden="true" /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Choose exercise</span><input aria-label="Search and choose a catalog exercise" value={exerciseSearch} onChange={(event) => { setExerciseSearch(event.target.value); setSelectedExercise(null); setExerciseName(""); }} placeholder="Search catalog, then select" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[var(--sg-text-faint-on-dark)] focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label><LocalSearchScope scope="Searching the exercise catalog for a lift to record." query={exerciseSearch} />{exerciseSearch.trim() && !selectedExercise && <div className="strength-exercise-picker" role="listbox" aria-label="Catalog exercise results">{exerciseMatches.length ? exerciseMatches.map((exercise) => <button type="button" role="option" key={exercise.id} onClick={() => { emitInteractionFeedback(); setSelectedExercise(exercise); setExerciseName(exercise.name); setExerciseSearch(exercise.name); }}><strong>{exercise.name}</strong><span>{exercise.primaryMuscles.join(" · ")}</span></button>) : <p>No matching catalog exercise.</p>}</div>}{selectedExerciseContext && <StrengthCatalogSelectionPreview context={selectedExerciseContext} />}</div>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">How you measured it</span><select value={measurementType} onChange={(event) => setMeasurementType(event.target.value as MeasurementType)} className="h-12 rounded-xl border border-white/20 bg-[var(--sg-surface-raised)] px-3 text-sm text-white outline-none focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30">{measurementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--sg-text-subtle-on-dark)]">Date</span><input type="date" min="1970-01-02" max={localDateKey()} value={observedDate} onChange={(event) => setObservedDate(event.target.value)} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-[var(--sg-info)] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <StrengthLoadInput weightUnit={weightUnit} value={loadKg} requiresLoad={loadRequired} convention={loadConvention} onChange={setLoadKg} />
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
          {!canSave && <p className="strength-log-blocked" role="status">{!selectedExercise ? "Choose an exercise from the catalog above to save this." : !liftDateInRange ? "Enter the date this lift happened." : loadMissing ? `Enter the load in ${weightUnitLabel(weightUnit)} to save this.` : loadInvalid ? `Fix or clear the ${loadLabel.charAt(0).toLowerCase()}${loadLabel.slice(1)} to save this.` : "Enter the reps of the working set to save this."}</p>}
          {saveError && <p className="strength-log-save-error" role="alert">{saveError}</p>}
        </div>
      </div>
    </details>

    {/* History expands here, on this screen. */}
    <details className="strength-recent-lifts">
      <summary><Dumbbell className="h-5 w-5" aria-hidden="true" /><span>Recent lifts</span><small>· {activeObservations.length} {recordWord}</small><ChevronDown className="h-5 w-5 strength-disclosure-chevron" aria-hidden="true" /></summary>
      <div className="strength-progress-log">
        {activeObservations.length > 0 && <p className="strength-recent-scope">{recentObservations.length < activeObservations.length ? `The latest ${recentObservations.length} of ${activeObservations.length}. ` : ""}{workoutObservations.length ? `${workoutObservations.length} carried across from finished workouts${directAccess ? ", saved on this device only" : ""}.` : (directAccess ? "Saved on this device only." : "")}</p>}
        {recentObservations.length ? <div className="strength-recent-rows">{recentObservations.map((observation) => <div key={observation.id} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div id={`strength-recent-${observation.id}`}><p className="strength-recent-name">{observation.exerciseName}</p><p className="strength-recent-meta">{observation.source === "workout" ? `From ${observation.sessionLabel || "a workout"}` : measurementTypeLabel(observation.measurementType)} · {new Date(observation.observedAt).toLocaleDateString()}</p></div><div className="strength-log-row-actions">{strengthRegionIdsForExerciseName(observation.exerciseName).length > 0 && <StrengthObservationReviewButton observation={observation as StrengthObservationRecord} onReview={openSavedObservation} describedBy={`strength-recent-${observation.id}`} />}{observation.source !== "workout" && <button type="button" className="strength-log-remove" disabled={removeObservation.isPending} onClick={() => requestObservationRemoval(observation as StrengthObservationRecord)} aria-label={`Remove the ${observation.exerciseName} lift from ${new Date(observation.observedAt).toLocaleDateString()}`} title="Remove this lift"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div>)}</div> : <div className="strength-log-empty"><Activity className="h-5 w-5" /><p><strong>Nothing logged yet</strong></p><p>Log your first lift and your progress starts tracking from there.</p></div>}{observationRemovalError && <p className="strength-log-remove-error" role="alert">{observationRemovalError}</p>}
      </div>
    </details>

    <details className="strength-profile-reference-details">
      <summary><Info className="h-5 w-5" aria-hidden="true" /><span>How ranks work</span><ChevronDown className="h-5 w-5 strength-disclosure-chevron" aria-hidden="true" /></summary>
      <div className="strength-how-ranks">
        <p>Covered means you have lifts recorded there. It is not a rank or a score. A rank appears on a muscle group only once a lift there has a comparison group to be read against, and it is always an estimate from your own logs.</p>
        <ol className="strength-rank-scale" aria-label="Rank bands, lowest to highest">
          {RANKS.map((rank) => <li key={rank.id}><RankIcon rankId={rank.id} size={36} /><span><b>{rank.fullName}</b><small>{rankRangeLabel(rank)} percentile</small></span></li>)}
        </ol>
        <p>Sports Genome ranks, not competition titles. Percentiles put lifts in order; the gap between two percentiles is not an equal step in strength. Groups with no percentile yet are hatched and labelled Not scored.</p>
        <p data-muscle-rank-ceiling>A muscle group is read through the lifts that train it, weighted by how much each lift relies on it, so it sits a little below the lifts behind it. The comparison curves stop at the 95th percentile, so for now no muscle group can reach National or World Stage. Muscles your lifts only steady are not ranked.</p>
        {registryOfflineNotice && <p className="strength-profile-reference-offline" role="status">{registryOfflineNotice}</p>}
        <p>Your own progress is always tracked from your logs. A comparison against published numbers only appears when your exact lift, setup, and body weight line up with a study — most everyday gym lifts will not, and that is normal.</p>
        {supabaseEvidenceInventory.data?.status === "connected" && <p>Research on file: {supabaseEvidenceInventory.data.strengthNorms} strength norms, {supabaseEvidenceInventory.data.performanceNorms} performance norms, and {supabaseEvidenceInventory.data.performanceTests} test protocols. Having them on file does not by itself create a rank for you.</p>}
        {approvedReferenceExercises.length > 0 && <p>Reviewed and approved for comparison so far: {approvedReferenceExercises.join(", ")}. Every other study on file stays under review until its exact population and protocol are checked.</p>}
      </div>
    </details>
  </section>;
}
