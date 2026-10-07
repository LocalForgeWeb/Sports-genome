import { plural } from "@/lib/plural";
import { loadConventionFor, type LoadConvention } from "@shared/loadConventions";
import { measurementFor } from "@shared/exerciseMeasurement";
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { Activity, ArrowRight, ChevronDown, CircleHelp, Dumbbell, Info, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { expiryNotice } from "@/lib/sessionExpiryNotice";
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
import { summarizeWithinAthleteStrengthComparisons, type WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";
import { changeStateLabel, changeTone } from "@/lib/changeStateCopy";
import { estimateOneRepMaxKg, maxValidEstimationReps } from "@shared/oneRepMaxEstimation";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { strengthRegionIdsForExerciseName, workoutStrengthObservations, compareRegionRecordRelevance } from "@/lib/workoutStrengthRecord";
import { bodyWeightEntryAt, bodyWeightKgAt, bodyWeightLogEvent, loadBodyWeightLog, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { catalogExerciseIdForName, ordinal, strengthPercentileCard, strengthPercentileGapCopy } from "@/lib/strengthPercentileCard";
import { regionRanksFromMuscles, type RegionRank } from "@shared/capabilityRank";
import { PendingRankCard, RankCard, UnscoredRankCard, displayPercentile } from "@/components/CapabilityRank";
import { RankingLiftSuggestions } from "@/components/RankingLiftSuggestions";
import { RankIcon } from "@/components/RankIcon";
import { RANKS, rankRangeLabel } from "@shared/capabilityRank";
import { liftPartInRank, muscleRankLiftSelection, previousRanksForSameGroup, rankProvenance, type MuscleRankLiftSource, type ProfileWeightLift, type RankProvenance } from "@/lib/muscleRankLifts";
import { ageAtLift } from "@/lib/normsCohort";
import { countCoveredRegions } from "@/lib/athleteRecord";
import { feedbackSurfaceRef } from "@/lib/feedbackClearance";
import { holdPageBehind, trapTabWithin } from "@/lib/modalBackground";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { decimalEntryText } from "@/lib/numericEntry";
import { parseBirthYear } from "@/lib/birthYear";
import { localDateKey } from "@/lib/localDate";

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

type StrengthObservationRecord = { id: string | number; exerciseName: string; observedAt: Date | string; measurementType: string; loadKg?: number | null; repetitions?: number | null; bodyMassKgAtTest?: number | null; equipment?: string | null; romStandard?: string | null; dataQuality?: string | null; referenceContextJson?: string | null; laterality?: string | null;
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
        : convention === "assistance" ? `Assistance in ${unitLabel}`
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

/** "Sep 1", with the year only when it is not this year's: the short dates inside the record's lines. */
function shortDate(value: Date | string): string {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, date.getFullYear() === new Date().getFullYear() ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}

/** An estimated 1RM, to the whole unit: it is an estimate, and a decimal would claim more than it knows. */
function estimatedWeight(kg: number, unit: DisplayWeightUnit): string {
  return `${Math.round(kilogramsToDisplayWeight(kg, unit))} ${unit}`;
}

/**
 * Why a lift has no comparison rank, in the athlete's words, for every reason the route gives.
 * The two the athlete can act on keep their existing sentences; the rest say what is missing
 * rather than leaving the row to say only that something is.
 */
function liftComparisonGapReason(result: Extract<StrengthPercentileResult, { status: "unavailable" }>, exerciseName: string): string | null {
  switch (result.reason) {
    case "sex_required":
    case "body_mass_required":
      return strengthPercentileGapCopy[result.reason] ?? null;
    case "no_curve_for_exercise": return `No comparison data for ${exerciseName} yet.`;
    case "source_role_not_permitted": return `The only comparison data for ${exerciseName} is not approved for ranking.`;
    case "load_required": return "No weight was logged with this lift, so there is nothing to compare.";
    case "repetitions_out_of_range": return "This set has too many reps to estimate a one-rep max from, so it cannot be compared.";
    case "insufficient_anchors": return `The comparison data for ${exerciseName} is too thin to place a lift on.`;
    case "curve_is_not_one_rep_max": return `The comparison data for ${exerciseName} is not a one-rep max, so a working set cannot be placed on it.`;
    case "below_lowest_anchor": return `This lift is below ${result.censoredAt != null ? `the ${ordinal(result.censoredAt)} percentile, ` : ""}the lowest point the comparison data covers.`;
    case "above_highest_anchor": return `This lift is above ${result.censoredAt != null ? `the ${ordinal(result.censoredAt)} percentile, ` : ""}the highest point the comparison data covers.`;
    default: return null;
  }
}

/** A lift the ranks left out, as the route names it, and why. */
type UnrankedLift = { exerciseName: string; reason: string };

/** One lift sent to the rank, as the provenance line names it: what, when, and what it was read against. */
function rankLiftLine(lift: MuscleRankLiftSource, weightUnit: DisplayWeightUnit): string {
  const lifted = lift.repsOnly ? plural(lift.repetitions, "rep") : `${formatDisplayWeight(lift.loadKg, weightUnit)} × ${lift.repetitions}`;
  const basis = lift.repsOnly ? "compared on reps"
    : lift.bodyMassKg == null || lift.bodyMassSource === null ? null
    : `read against ${formatDisplayWeight(lift.bodyMassKg, weightUnit)}, ${bodyMassSourceNote[lift.bodyMassSource]}`;
  return [lifted, shortDate(lift.observedAt), basis].filter(Boolean).join(" · ");
}

/**
 * Which lifts produced a region's rank, with each lift's date, load and reps and the body weight
 * it was read against. The comparison group is named on the rank above it. Traced on this
 * device from the lifts that were sent (lib/muscleRankLifts), so when an exercise sent more than
 * one lift the line says "best of N" rather than naming one the server never identified.
 */
function RankProvenanceList({ entries, unplaced, muscleName, weightUnit }: { entries: readonly RankProvenance[]; unplaced: readonly UnrankedLift[]; muscleName: string; weightUnit: DisplayWeightUnit }) {
  return <div className="rank-provenance" data-rank-provenance>
    <p className="rank-provenance-label">{entries.length === 1 ? "From this exercise" : `Blended from ${entries.length} exercises`}</p>
    <ul>{entries.map((entry) => <li key={entry.exerciseName}>
      <p><strong>{entry.exerciseName}</strong>{` · ${ordinal(displayPercentile(entry.exercisePercentile))} percentile on its own`}{entry.role ? ` · ${entry.role}` : ""}{entries.length > 1 && entry.weightShare !== null ? ` · ${Math.round(entry.weightShare * 100)}% of this rank` : ""}</p>
      {entry.lifts.length > 1 && <p className="rank-provenance-best">Best of {entry.lifts.length} lifts:</p>}
      {entry.lifts.map((lift, index) => <p key={`${lift.observationId ?? "lift"}-${index}`} className="rank-provenance-lift">{rankLiftLine(lift, weightUnit)}</p>)}
    </li>)}</ul>
    {entries.length > 1 && <p>The most direct lift counts most: one where {muscleName.toLowerCase()} does most of the work says more about it than one it shares with several other muscles.</p>}
    {unplaced.length > 0 && <p data-rank-not-counted>Not counted: {unplaced.map((item) => `${item.exerciseName} (${unrankedReasonCopy[item.reason] ?? "could not be scored"})`).join(", ")}.</p>}
  </div>;
}

export function StrengthRegionRecordDetail({ region, observations, onClose, weightUnit, baselineBodyWeight, directAccess, onSetDeviceBodyMass, initialRecordId = "", powerliftingNorms = [], strengthChanges = [], referenceRows = [], athleteProfile = null, bodyWeightHistory = [], onRankProfile, regionRank = null, rankMode = false, rankPending = null, ranksUpdating = null, rankProvenance: provenance = [], rankUnranked = [], onLogLift, registryOffline = false, onSelectRegion, headingIds, rankGroupNeeded = null, rankUnavailable = null }: { /** The ranking service failed, or is waiting for a connection, with no rank drawn: the suggestions say a logged lift is saved and ranks later. */ rankUnavailable?: "failed" | "offline" | null; /** Ranks need a comparison group: none chosen yet ("missing"), or one the curves do not split by ("no_curve"). */ rankGroupNeeded?: "missing" | "no_curve" | null; regionRank?: RegionRank | null; /** Switches the record to another muscle group from its own header; on a phone the figure behind the sheet cannot be tapped. */ onSelectRegion?: (region: StrengthRegionDefinition) => void; /** Ids for the title and the selected-lift line, so the sheet around the record can be named by them. */ headingIds?: { title: string; lift: string }; rankMode?: boolean; /** Ranks are on their way and none has arrived yet: the rank section says so instead of looking unscored. */ rankPending?: "ranking" | "offline" | null; /** The ranks shown are the previous answer while new ones load, or while the new request waits for a connection. */ ranksUpdating?: "updating" | "offline" | null; /** The exercises and dated lifts behind this region's rank, strongest first (lib/muscleRankLifts). */ rankProvenance?: readonly RankProvenance[]; /** This region's lifts the ranks left out, each with the route's reason. */ rankUnranked?: readonly UnrankedLift[]; /** The research library could not be reached, so no comparison is a fact about the library, not the lift. */ registryOffline?: boolean; /** Opens the lift log on this page, with an exercise already chosen when one is given. */ onLogLift?: (exercise?: Exercise) => void; region: StrengthRegionDefinition; observations: StrengthObservationRecord[]; onClose: () => void; weightUnit: DisplayWeightUnit; baselineBodyWeight?: number; directAccess: boolean; /** Saves the weight of a device-held lift's day; true only when a lift took it and the device kept it. */ onSetDeviceBodyMass: (observationId: string, bodyMassKgAtTest: number) => boolean; initialRecordId?: string; powerliftingNorms?: readonly PowerliftingNormRow[]; strengthChanges?: readonly WithinAthleteStrengthChange[]; referenceRows?: readonly NormsReferenceRow[]; athleteProfile?: RegistryReferenceProfile; bodyWeightHistory?: readonly BodyWeightEntry[]; onRankProfile?: (patch: RankProfilePatch) => void }) {
  const records = useMemo(() => observations.filter((observation) => strengthRegionIdsForExerciseName(observation.exerciseName).includes(region.id)).sort((a, b) => compareRegionRecordRelevance(region.id, a, b)), [observations, region.id]);
  const utils = trpc.useUtils();
  const matchedReferenceRef = useRef<HTMLElement>(null);
  const [bodyMassEntry, setBodyMassEntry] = useState("");
  const [bodyMassSaveError, setBodyMassSaveError] = useState<string | null>(null);
  /**
   * The lift on show, decided in this render rather than corrected by an effect afterwards, so
   * the sheet never paints one lift and then another. The athlete's own pick wins; until they
   * pick, the lift behind the region's rank, so the rank above and the lift below agree; then
   * the most relevant lift for the region.
   */
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecordId);
  const isRecord = (id: string | null | undefined): id is string => id != null && records.some((record) => String(record.id) === id);
  const rankSourceRecordId = provenance.flatMap((entry) => entry.lifts.map((lift) => lift.observationId)).find(isRecord) ?? null;
  const shownRecordId = isRecord(selectedRecordId) ? selectedRecordId : rankSourceRecordId ?? String(records[0]?.id ?? "");
  const setObservationBodyMass = trpc.strengthGenome.setObservationBodyMass.useMutation({ onSuccess: async () => { emitInteractionFeedback([10, 30, 10]); setBodyMassSaveError(null); setBodyMassEntry(""); toast.success("Body weight for this lift saved. Your recorded ratio is ready."); await Promise.all([utils.strengthGenome.observations.invalidate(), utils.strengthGenome.overview.invalidate()]); }, onError: () => { setBodyMassSaveError("Body weight was not saved. Your entry is still here—check your connection and try again."); toast.error("Could not save the body weight for this lift. Check your connection and try again."); } });
  const latestRecord = selectStrengthRegionRecord(records, shownRecordId);
  /**
   * Offering today's weight for a lift from three months ago is offering the
   * wrong number, which is why this used to carry a warning telling the athlete
   * to check it themselves. The weight log knows the last weight logged on or
   * before that day, so the field offers that instead and says which day it came from.
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
  // The form starts from the weight on offer for the lift on show, set in the same render the
  // lift changes in rather than one frame later.
  const entryKey = `${latestRecord?.id ?? ""}|${offeredBodyMass ?? ""}|${weightUnit}`;
  const [entryFor, setEntryFor] = useState<string | null>(null);
  if (entryFor !== entryKey) {
    setEntryFor(entryKey);
    setBodyMassEntry(offeredBodyMass === undefined ? "" : String(Number(kilogramsToDisplayWeight(offeredBodyMass, weightUnit).toFixed(1))));
    setBodyMassSaveError(null);
  }
  const piperReference = latestRecord ? getPiperReferenceForObservation(latestRecord) : null;
  const powerliftingReference = latestRecord ? getPowerliftingReferenceForObservation(latestRecord, powerliftingNorms) : null;
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
  const percentileAsked = Boolean(latestRecord?.loadKg);
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
    { enabled: percentileAsked, staleTime: 5 * 60 * 1000, retry: false }
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
  // A lift whose comparison has not come back is "checking", never "no rank": a switch of lift
  // used to show the unranked copy until the answer arrived, then jump. Undefined fields (a test
  // double with data alone) read as settled.
  const comparisonChecking = !hasOutsideComparison && percentileAsked && betaPercentile.data === undefined && betaPercentile.isPending === true;
  const comparisonWaiting = comparisonChecking && betaPercentile.fetchStatus === "paused";
  /**
   * Everything the lift section says, derived in one place from the lift on show, so switching
   * lifts swaps every value and sentence in the same render: the comparison, the progress line,
   * the ratio and the notes.
   */
  const lift = latestRecord ? (() => {
    // The trend for this exercise and side: groups are kept by name and laterality.
    const trend = strengthChanges.find((change) => normalizedName(change.exerciseName) === normalizedName(latestRecord.exerciseName) && change.laterality === (latestRecord.laterality || "BILATERAL"));
    // Every log of this lift on the same side, whether or not it can be estimated: a trend needs
    // two that can, so a lift logged twice can still have none, and is not "one log so far".
    const logCount = records.filter((record) => normalizedName(record.exerciseName) === normalizedName(latestRecord.exerciseName) && (record.laterality || "BILATERAL") === (latestRecord.laterality || "BILATERAL")).length;
    const loadKg = latestRecord.loadKg == null ? null : Number(latestRecord.loadKg);
    const reps = latestRecord.measurementType === "MEASURED_1RM" ? 1 : latestRecord.repetitions == null ? null : Number(latestRecord.repetitions);
    const singleEstimateKg = loadKg != null && loadKg > 0 && reps != null && ["MEASURED_1RM", "MULTI_REP"].includes(latestRecord.measurementType)
      ? (latestRecord.measurementType === "MEASURED_1RM" ? loadKg : estimateOneRepMaxKg(loadKg, reps))
      : null;
    const noEstimateReason = loadKg == null || !(loadKg > 0) ? "No weight was logged with this lift, so there is no estimated 1RM to follow."
      : !["MEASURED_1RM", "MULTI_REP"].includes(latestRecord.measurementType) ? "This kind of test is not turned into an estimated 1RM, so it has no progress line."
      : reps == null || !(reps >= 1) ? "No reps were logged with this lift, so there is no estimated 1RM to follow."
      : `Sets of more than ${maxValidEstimationReps} reps are not turned into an estimated 1RM, so this one has no progress line.`;
    const ratio = loadKg != null && effectiveBodyMassKg != null && effectiveBodyMassKg > 0 ? loadKg / effectiveBodyMassKg : null;
    const weightLoggedOn = bodyMassSource === "dated" ? bodyWeightEntryAt(bodyWeightHistory, latestRecord.observedAt)?.observedAt : undefined;
    const weightSource = bodyMassSource === null || effectiveBodyMassKg == null ? null
      : bodyMassSource === "recorded" ? `${formatDisplayWeight(effectiveBodyMassKg, weightUnit)}, recorded with this lift.`
      : bodyMassSource === "dated" ? `${formatDisplayWeight(effectiveBodyMassKg, weightUnit)}, from your weight log${weightLoggedOn ? ` on ${shortDate(weightLoggedOn)}` : ""}.`
      : `${formatDisplayWeight(effectiveBodyMassKg, weightUnit)}, your current profile weight. This ratio moves if you change it.`;
    const betaReason = !percentileAsked ? "No weight was logged with this lift, so there is nothing to compare."
      : betaPercentile.isError === true && betaPercentile.data === undefined ? "The comparison could not be checked just now."
      : betaPercentile.data?.status === "unavailable" && betaPercentile.data.reason !== "sex_required" ? liftComparisonGapReason(betaPercentile.data, latestRecord.exerciseName)
      : null;
    const studyReason = registryGateExplanation ?? registryOfflineReason;
    // The reason on the row, and whatever is left over for About this data, never both.
    const comparisonReason = needsGroup ? null : betaReason ?? studyReason ?? "No comparison data covers this lift yet.";
    const comparison = hasOutsideComparison ? "study" as const
      : comparisonChecking ? "checking" as const
      : showPercentile ? "ranked" as const
      : "unranked" as const;
    // Unknown (and so unsaid) when the rank's lifts could not be traced on this device, and
    // unsaid while the rank is being worked out again: it is about to change.
    const inRegionRank = regionRank && !ranksUpdating ? liftPartInRank(provenance, String(latestRecord.id)) : null;
    return { record: latestRecord, trend, logCount, singleEstimateKg, noEstimateReason, ratio, weightSource, comparison, comparisonReason, studyNote: studyReason !== comparisonReason ? studyReason : null, inRegionRank };
  })() : null;
  useEffect(() => {
    if ((!registryMatch && piperReference?.status !== "matched") || !matchedReferenceRef.current) return;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => matchedReferenceRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" }));
  }, [latestRecord?.id, piperReference?.status, registryMatch?.referenceKey]);
  const parsedBodyMassEntry = Number(bodyMassEntry);
  const fallbackIdBase = useId();
  const ids = headingIds ?? { title: `${fallbackIdBase}-title`, lift: `${fallbackIdBase}-lift` };
  const rankTitleId = `${fallbackIdBase}-rank-title`;
  const liftTitleId = `${fallbackIdBase}-lift-title`;
  // A typed lift's record can take the weight of its day: to fill a gap, or to correct a
  // borrowed weight. A workout's lift lives in the workout log, which has no field for it.
  const bodyMassForm = latestRecord && bodyMassSource !== "recorded" && latestRecord.source !== "workout"
    ? <details className="strength-recorded-measurement"><summary>{bodyMassSource === null ? "Add test body weight" : "Not your weight that day?"}</summary><form className="strength-ratio-entry" onSubmit={(event) => { event.preventDefault(); if (!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0) return; const bodyMassKgAtTest = displayWeightToKilograms(parsedBodyMassEntry, weightUnit); if (directAccess) { if (!onSetDeviceBodyMass(String(latestRecord.id), bodyMassKgAtTest)) { setBodyMassSaveError("Body weight was not saved on this device. Your entry is still here."); return; } setBodyMassSaveError(null); setBodyMassEntry(""); emitInteractionFeedback([10, 30, 10]); toast.success("Body weight for this lift saved on this device. Your recorded ratio is ready."); return; } setBodyMassSaveError(null); setObservationBodyMass.mutate({ observationId: Number(latestRecord.id), bodyMassKgAtTest }); }}><label><span>{`Body weight on ${new Date(latestRecord.observedAt).toLocaleDateString()} (${weightUnit})`}</span><input aria-label={`Body weight on the day of this lift, in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={bodyMassEntry} onChange={(event) => { setBodyMassSaveError(null); setBodyMassEntry(decimalEntryText(event.target.value)); }} placeholder={weightUnit === "lb" ? "e.g. 180" : "e.g. 82"} /></label><button type="submit" aria-busy={!directAccess && setObservationBodyMass.isPending} disabled={!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0 || (!directAccess && setObservationBodyMass.isPending)}>{!directAccess && setObservationBodyMass.isPending ? "Saving" : "Save this body weight"}</button>{offeredBodyMass !== undefined && <small>{offeredIsDated ? "This lift is already read against the last weight in your log on or before that day. Save a different number only if you know it was different that day." : "This lift is already read against your profile weight. Save the weight you were that day if you know it was different."}</small>}{!directAccess && setObservationBodyMass.isPending && <p className="strength-ratio-status" role="status">Saving body weight for this lift…</p>}{bodyMassSaveError && <p className="strength-ratio-error" role="alert">{bodyMassSaveError}</p>}</form></details>
    : null;
  return <section className="strength-region-record-detail" aria-label={`${region.label} recorded strength context`}>
    {/* The header stays put while the record scrolls: what this is (the muscle group,
        and the lift on show with its date), the way out, and the way to another group. */}
    <header className="strength-region-record-heading">
      <div className="strength-region-record-title"><p className="metric-label">Your record</p><h2 id={ids.title} tabIndex={-1} data-strength-region-heading>{region.label}</h2><p id={ids.lift} className="strength-region-record-lift">{latestRecord ? `${latestRecord.exerciseName} · ${new Date(latestRecord.observedAt).toLocaleDateString()}` : "No lifts logged here yet"}</p></div>
      <button type="button" onClick={() => { emitInteractionFeedback(); onClose(); }} className="strength-region-close" aria-label={`Close ${region.label} detail`}><X className="h-4 w-4" aria-hidden="true" /></button>
      {onSelectRegion && <label className="strength-region-switch"><span>Muscle group</span><select aria-label="Muscle group to show" data-strength-region-select value={region.id} onChange={(event) => { const next = strengthRegionDefinitions.find((candidate) => candidate.id === event.target.value); if (!next) return; emitInteractionFeedback(); onSelectRegion(next); }}>{regionAreas.map((area) => <optgroup key={area} label={area}>{strengthRegionDefinitions.filter((candidate) => candidate.bodyArea === area).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</optgroup>)}</select></label>}
    </header>
    {/* The one scroll region on a phone; on a wide screen it simply runs in the page. Two
        sections that never borrow from each other: the region's rank, which alone carries the
        rank colour and the emblem, and the lift on show, whose own comparison and progress are
        plain facts. */}
    <div className="strength-region-record-body">
    {(rankMode || rankPending) && <section className="strength-record-section strength-region-rank-section" aria-labelledby={rankTitleId}>
      <h3 id={rankTitleId} className="strength-record-section-title">{region.label} rank</h3>
      {!rankMode ? <PendingRankCard offline={rankPending === "offline"} />
        : regionRank ? <RankCard regionRank={regionRank} provenance={provenance.length ? <RankProvenanceList entries={provenance} unplaced={rankUnranked} muscleName={regionRank.representative.name} weightUnit={weightUnit} /> : undefined} />
        : <UnscoredRankCard hasRecords={records.length > 0} />}
      {rankMode && ranksUpdating && <p className="rank-updating-note" role="status">{ranksUpdating === "offline" ? "Waiting for a connection to update ranks. This is your previous rank." : "Updating ranks…"}</p>}
    </section>}
    {/* No rank for this group: the lifts that would give it one, the familiar one first. */}
    {!regionRank && !rankPending && <>
      <RankingLiftSuggestions regionId={region.id} regionLabel={region.label} loggedNames={records.map((record) => record.exerciseName)} hasRecords={records.length > 0} blocked={rankGroupNeeded ? null : rankUnavailable ?? null} onLog={onLogLift ? (exercise) => onLogLift(exercise) : undefined} />
      {/* A rank also needs a group to compare against (the suggestions' own blocked line covers a
          service failure or no connection); without one, these lifts would be logged and still
          not ranked. Asked here only when no lift is on show: a lift's own row already asks it, once. */}
      {rankGroupNeeded === "missing" && records.length === 0 && <ComparisonGate need="group" onProfile={onRankProfile} scope="map" fallback="Ranks compare your lifts with men or women who lift. Choose a group in About Me and these lifts can rank." />}
      {rankGroupNeeded === "no_curve" && records.length === 0 && <p className="strength-rank-needs">{communityGroupWithoutCurveCopy}</p>}
    </>}
    {latestRecord && lift ? <>
      <section className="strength-region-record-card strength-record-section" aria-labelledby={liftTitleId}>
        <h3 id={liftTitleId} className="strength-record-section-title">{latestRecord.exerciseName}</h3>
        <span className="strength-region-test-meta">{latestRecord.loadKg != null ? formatDisplayWeight(latestRecord.loadKg, weightUnit) : "No load"}{latestRecord.repetitions ? ` · ${plural(latestRecord.repetitions, "rep")}` : ""} · {new Date(latestRecord.observedAt).toLocaleDateString()}{/* The weight this lift was read against, said out loud: it was saved with the lift and does not move when the profile weight changes. */}{effectiveBodyMassKg != null ? ` · at ${formatDisplayWeight(effectiveBodyMassKg, weightUnit)}` : ""}{latestRecord.source === "workout" ? ` · top set of ${latestRecord.setCount} from ${latestRecord.sessionLabel || "a workout"}` : ""}</span>
        {records.length > 1 && <label className="strength-region-record-picker"><span>Which lift</span><select aria-label="Which lift to show" value={shownRecordId} onChange={(event) => setSelectedRecordId(event.target.value)}>{records.map((record) => <option key={record.id} value={String(record.id)}>{record.exerciseName} · {new Date(record.observedAt).toLocaleDateString()}</option>)}</select></label>}
        <dl className="strength-lift-rows">
          {/* Always on screen, so an unranked lift says so in its own row instead of sitting
              under the region's percentile as if that number were its own. */}
          <div className="strength-lift-row" data-lift-row="comparison">
            <dt>Comparison rank for this lift</dt>
            <dd>
              {lift.comparison === "checking" ? <p className="strength-lift-value is-pending" role="status">{comparisonWaiting ? "Waiting for a connection to check the comparison." : "Checking comparison…"}</p>
                : lift.comparison === "ranked" && percentileCard ? <>
                  <p className="strength-lift-value">{percentileCard.headline}</p>
                  <p>{percentileCard.placement}{bodyMassSource !== null && bodyMassSource !== "recorded" ? ` Read against ${bodyMassWeightPhrase[bodyMassSource]}.` : ""}</p>
                  {!athleteProfile?.birthYear && <ComparisonGate need="birthYear" onProfile={onRankProfile} />}
                </>
                : lift.comparison === "study" ? (registryMatch ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Compared to that study group</p><strong>{registryMatch.percentileBandLabel}</strong><p>{registryMatch.unit === "x_bodyweight" ? `${registryMatch.observedValue.toFixed(2)}× body weight` : `${registryMatch.observedValue.toFixed(1)} ${registryMatch.unit}`}{studyGroupLabel(registryMatch.populationDefinition) ? ` · ${studyGroupLabel(registryMatch.populationDefinition)}` : ""}{registryMatch.sampleSize ? ` · ${registryMatch.sampleSize.toLocaleString()} people` : ""}. This exact test only.</p>{registryMatch.sourceUrl && <a href={registryMatch.sourceUrl} target="_blank" rel="noreferrer">View the source study</a>}</article> : powerliftingReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Compared to that competition group</p><strong>{powerliftingReference.percentileBandLabel}</strong><p>{powerliftingReference.relativeStrength.toFixed(2)}× body weight · {powerliftingReference.sourceLabel}. Exact competition context only.</p><a href={powerliftingReference.sourceUrl} target="_blank" rel="noreferrer">View van den Hoek et al. 2024 source</a></article> : piperReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Source-sample rank range</p><strong>{piperReference.comparison}</strong><p>{piperReference.sourceLabel} · {piperReference.bodyMassBand}. This is the primary result for this exact matched test only.</p><a href="https://doi.org/10.47206/ijsc.v1i1.40" target="_blank" rel="noreferrer">View Piper et al. 2021 source</a></article> : null)
                : <>
                  <p className="strength-lift-value is-quiet">No comparison rank available for this lift</p>
                  {needsGroup ? (groupWithoutCurve
                    ? <p className="strength-rank-needs">{communityGroupWithoutCurveCopy}</p>
                    : <ComparisonGate need="group" onProfile={onRankProfile} fallback={percentileGap} />)
                    : lift.comparisonReason && <p className="strength-lift-reason">{lift.comparisonReason}</p>}
                </>}
              {lift.inRegionRank !== null && <p className="strength-lift-in-rank">{lift.inRegionRank === false ? `Not part of the ${region.label} rank.`
                : lift.inRegionRank.considered > 1 ? `One of ${lift.inRegionRank.considered} lifts considered for the ${region.label} rank; the best of them counts.`
                : `Counts toward the ${region.label} rank.`}</p>}
            </dd>
          </div>
          {/* The athlete against their own past, never against anyone else, and never called a rank. */}
          <div className="strength-lift-row" data-lift-row="progress">
            <dt>Your progress on this lift</dt>
            <dd>
              {lift.trend ? <>
                <p className="strength-lift-value"><span>Estimated 1RM change</span> <strong style={{ color: changeTone(lift.trend) }}>{lift.trend.relativeChangePercent >= 0 ? "+" : ""}{lift.trend.relativeChangePercent.toFixed(0)}%</strong></p>
                <p className="strength-lift-state">{changeStateLabel[lift.trend.changeState]}</p>
                <p className="strength-lift-points">{estimatedWeight(lift.trend.firstPoint.estimatedOneRmKg, weightUnit)} ({shortDate(lift.trend.firstPoint.observedAt)}) → {estimatedWeight(lift.trend.latestPoint.estimatedOneRmKg, weightUnit)} ({shortDate(lift.trend.latestPoint.observedAt)}) · {plural(lift.trend.observationCount, "log")}</p>
              </> : lift.singleEstimateKg != null
                ? lift.logCount > 1
                  ? <p>Only one of your {lift.logCount} logs of this lift can be turned into an estimated 1RM (sets over {maxValidEstimationReps} reps, or without a weight, are not), so there is no progress line yet. This one: estimated 1RM {estimatedWeight(lift.singleEstimateKg, weightUnit)} on {shortDate(latestRecord.observedAt)}.</p>
                  : <p>One log so far: estimated 1RM {estimatedWeight(lift.singleEstimateKg, weightUnit)} on {shortDate(latestRecord.observedAt)}. Log it again to see your progress.</p>
                : <p>{lift.noEstimateReason}</p>}
            </dd>
          </div>
          {latestRecord.loadKg != null && <div className="strength-lift-row" data-lift-row="ratio">
            <dt>Body-weight ratio</dt>
            <dd>
              {lift.ratio != null && bodyMassSource !== null
                ? <><p>{`Load lifted: ${lift.ratio.toFixed(2)}× ${bodyMassWeightPhrase[bodyMassSource]} — for your own context, not a rank.`}</p>{lift.weightSource && <p className="strength-lift-source">{lift.weightSource}</p>}</>
                : <p>{latestRecord.source === "workout" ? "No body weight was saved for that workout day, so there is no ratio." : "No body weight to read this lift against yet."}</p>}
              {bodyMassSource === null && bodyMassForm}
            </dd>
          </div>}
        </dl>
        <details className="strength-region-boundary strength-lift-about"><summary>About this data</summary>
          <p>{hasOutsideComparison ? "This matches one specific study, for this exact test only — not a general claim about how strong you are." : showPercentile ? "Placed against lifting data from people of the same sex, on this exercise. It is a comparison on this lift alone, not a general claim about how strong you are." : "Comparisons come from community lifting data, split by sex and body weight, and from reviewed studies for a few exact tests. Your progress is measured from your own logs only."}</p>
          {lift.studyNote && <p className="strength-region-gate-reason">{lift.studyNote}</p>}
          {lift.comparison === "ranked" && percentileCard?.effort && <p>{percentileCard.effort}</p>}
          <p>Estimated 1RM change compares your first and latest logs of this lift, each turned into an estimated one-rep max. Under 6% is within the estimate's normal variation.</p>
          {/* A lift from a finished workout lives in the workout log, which keeps the weight of its day and has no field to add one afterwards; its record says what it is read against instead of offering a form that would store nothing. */}
          {bodyMassSource !== "recorded" && latestRecord.source === "workout" && <p className="strength-workout-body-mass" data-workout-body-mass-note>{bodyMassSource === null ? "This lift is from a workout, and no body weight was saved for that day." : "This lift is from a workout, so it is read against the body weight saved for that day, or your profile weight when none was saved."}</p>}
          {bodyMassSource !== null && bodyMassForm}
        </details>
      </section>
    </> : <div className="strength-region-record-empty"><p>Nothing logged for this muscle group yet.</p><p>Log a lift that trains it and your progress will show up here.</p>{onLogLift && <button type="button" onClick={() => { emitInteractionFeedback(); onLogLift(); }}>Log a lift for {region.label.toLowerCase()} <Plus className="h-4 w-4" aria-hidden="true" /></button>}</div>}
    </div>
  </section>;
}

/** The muscle-group picker's sections, in the order the map lists them. */
const regionAreas = Array.from(new Set(strengthRegionDefinitions.map((region) => region.bodyArea)));

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
  // The last entry on or before the lift, which can be months earlier: the source line under
  // the ratio gives its date, so this claims no week.
  dated: "your logged weight",
  profile: "your profile weight",
};

/** The same provenance, as a short aside on a lift behind a rank: "read against 80 kg, …". */
const bodyMassSourceNote: Record<"recorded" | "dated" | "profile", string> = {
  recorded: "recorded with the lift",
  dated: "from your weight log",
  profile: "your current profile weight",
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
 * Whether the record opens as a phone sheet: below the dock's breakpoint, where it
 * becomes a modal over the page. Read on the first render, so the first open is
 * already the right kind, and kept current as the window changes.
 */
const phoneSheetQuery = "(max-width: 1023px)";
function usePhoneSheet() {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(phoneSheetQuery).matches);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(phoneSheetQuery);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return phone;
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
 *
 * The body map asks the same group question for its ranks, with scope "map".
 */
function ComparisonGate({ need, onProfile, fallback = null, scope = "lift" }: { need: "group" | "birthYear"; onProfile?: (patch: RankProfilePatch) => void; fallback?: string | null; scope?: "lift" | "map" }) {
  const [year, setYear] = useState("");
  if (!onProfile) return fallback ? <p className="strength-rank-needs">{fallback}</p> : null;
  if (need === "group") {
    return <div className="strength-rank-gate">
      <p>{scope === "map" ? "Pick a group to compare against and this map ranks the muscle groups your lifts train." : "Choose the group to compare against and this lift gets a percentile."}</p>
      <label><span>Compare against</span><select
        value=""
        aria-label={scope === "map" ? "Group to rank your lifts against" : "Group to compare this lift against"}
        onChange={(event) => { if (!event.target.value) return; emitInteractionFeedback(); onProfile({ sexForReference: event.target.value as SexForReference }); }}
      >
        <option value="">Choose a group</option>
        <option value="female">Women who lift</option>
        <option value="male">Men who lift</option>
        <option value="unspecified">Prefer not to say</option>
      </select></label>
      <small>{scope === "map" ? "Used only to pick which community curves your lifts are read against." : "Used only to pick which community curve this lift is read against."} It is saved to About Me.</small>
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
  // The profile weight is an input default, so it only fills a box the athlete has
  // not typed in: refilling an emptied box made it impossible to clear, and typing
  // after backspace landed on the refilled number ("180" then "7" saved "1807").
  const [bodyMassTouched, setBodyMassTouched] = useState(false);
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
  /** The muscle group whose "Log this lift" opened the log, so the saved lift can lead straight back to it (S11). */
  const logOriginRegionRef = useRef<string | null>(null);
  // Below the dock's breakpoint the record is a modal sheet over the page; above it, a panel in the page.
  const phoneSheet = usePhoneSheet();
  const sheetIdBase = useId();
  const sheetHeadingIds = useMemo(() => ({ title: `${sheetIdBase}-title`, lift: `${sheetIdBase}-lift` }), [sheetIdBase]);
  const sheetScrimRef = useRef<HTMLDivElement | null>(null);
  // Undoes the hold on the page behind a phone sheet. Called before focus goes back to the
  // opener, because an inert opener cannot take focus.
  const releasePageRef = useRef<(() => void) | null>(null);
  // Where the wide page stood before opening scrolled it to the record.
  const openScrollRef = useRef<number | null>(null);
  // A muscle group picked from the record's own header remounts the record, select and all.
  const refocusRegionSelectRef = useRef(false);
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
    onSuccess: async (saved, variables) => {
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
      setBodyMassKg(baselineBodyWeight != null ? String(baselineBodyWeight) : "");
      setBodyMassTouched(false);
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
      toast.success("Lift saved. Your progress updates as you log more.", savedLiftToastOptions({ id: saved?.id ?? "", exerciseName: variables.exerciseName }));
    },
    // Every failure is reported here in fixed words: the server message is either
    // a validation list or a generic fault notice, neither of them for athletes.
    // An expired sign-in is said app-wide by main.tsx first, with "Everything stays
    // saved on this device", which is not true of a lift that was saved nowhere. So
    // this replaces that notice under its id (Sonner keeps any field not passed, so the
    // description is given), and still speaks when that notice keeps quiet (it speaks
    // once a minute at most). The reason is also written beside the button. Neither
    // names a place to sign in again: this build has none (see sessionExpiryNotice).
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        setSaveError("This lift was not saved because your sign-in has expired. Your entry is still here.");
        toast(expiryNotice.title, { id: "session-expired", description: "This lift was not saved. Your entry is still in the form." });
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
  // A hold, a carry, an assistance stack or a band setting is not a load × reps test (50-exercise
  // brief §7): those are logged in the workout log, which records them in their own units.
  const measurement = measurementFor(selectedExercise?.id);
  const measurementRefusal = selectedExercise && measurement.explicit && !measurement.e1rmEligible && measurement.mode !== "reps_only"
    ? `${selectedExercise.name} is recorded in the workout log, not as a strength test. ${measurement.e1rmReason ?? ""}`.trim()
    : null;
  const canSave = Boolean(selectedExercise) && !measurementRefusal && !loadMissing && !loadInvalid && !repsMissing && liftDateInRange;
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
   * Strength/Rank mode. The athlete's lifts, each at the body weight saved with it (or, for a
   * lift saved without one, the weight log for that day, then the profile weight), scored and
   * aggregated per muscle by the database; the map draws each region from the muscle best
   * supported by evidence. Without a sex to compare against, or with no reachable service, the
   * map stays in its coverage view rather than drawing ranks it cannot justify.
   */
  const rankSex: "male" | "female" | null = sexForReference === "male" || sexForReference === "female" ? sexForReference : null;
  const rankSelection = useMemo(
    () => muscleRankLiftSelection(activeObservations, bodyWeightHistory, baselineBodyWeight != null ? displayWeightToKilograms(baselineBodyWeight, weightUnit) : null, birthYear),
    [activeObservations, bodyWeightHistory, baselineBodyWeight, weightUnit, birthYear]
  );
  const rankLifts = rankSelection.lifts;
  const ranksWanted = rankSex !== null && rankLifts.length > 0;
  // A new lift, a saved weight or a birth year changes the request. The previous ranks stay
  // drawn under "Updating ranks…" until the new ones arrive, rather than the map dropping back
  // to coverage as if every rank had been lost; a change of comparison group keeps none. With
  // nothing left to rank there is no new answer coming, so nothing is kept: TanStack hands a
  // disabled query its placeholder too, and the last lift's ranks would stay drawn for good.
  const muscleRanks = trpc.strengthProfile.muscleRanks.useQuery(
    { sex: rankSex, lifts: rankLifts },
    { enabled: ranksWanted, staleTime: 5 * 60 * 1000, retry: false, placeholderData: ranksWanted ? previousRanksForSameGroup(rankSex) : undefined }
  );
  // A failed rank request says so and can be tried again. The server answers a
  // database outage as "unavailable: service_error" rather than as an error, so
  // both count. A missing server setting stays quiet: trying again cannot fix it.
  // Offline, the request waits for a connection and says that instead. Both
  // speak only while no ranks are drawn: a background refetch that fails, or
  // waits offline, keeps the ranks already on the map, and they still stand.
  const rankProfile = ranksWanted && muscleRanks.data && muscleRanks.data.status !== "unavailable" ? muscleRanks.data : null;
  const ranksFailed = ranksWanted && rankProfile === null && (muscleRanks.isError || (muscleRanks.data?.status === "unavailable" && muscleRanks.data.reason === "service_error"));
  const ranksOffline = ranksWanted && muscleRanks.isPending && muscleRanks.fetchStatus === "paused";
  // The ranks on screen are the previous answer, kept while the new request runs.
  const ranksUpdating = ranksWanted && rankProfile !== null && muscleRanks.isPlaceholderData === true;
  // Kept, and the new request is waiting for a connection: a placeholder reads as a success,
  // so `ranksOffline` never sees this, and "Updating ranks…" would claim work that is not under way.
  const ranksUpdateOffline = ranksUpdating && muscleRanks.fetchStatus === "paused";
  /**
   * The lifts that produced the ranks on screen. While the previous answer stands in for a new
   * request, its provenance and notes are read from the lifts it was worked out from, not from
   * the ones just changed: otherwise a weight saved a moment ago, or a lift just logged, would be
   * named under a rank that never saw it.
   */
  const [answeredSelection, setAnsweredSelection] = useState(rankSelection);
  if (muscleRanks.data !== undefined && muscleRanks.isPlaceholderData !== true && answeredSelection !== rankSelection) setAnsweredSelection(rankSelection);
  const rankBasis = ranksUpdating ? answeredSelection : rankSelection;
  // Loading, not unscored: nothing has been ranked yet and the first answer is on its way.
  const ranksFirstLoading = ranksWanted && rankProfile === null && !ranksFailed && muscleRanks.isPending === true;
  const regionRanks = useMemo(() => (rankProfile ? regionRanksFromMuscles(rankProfile.muscles) : null), [rankProfile]);
  // The lifts behind the open region's rank, traced from what was sent (lib/muscleRankLifts).
  const sheetRegionRank = sheetRegion ? regionRanks?.get(sheetRegion.id) ?? null : null;
  const sheetRankProvenance = useMemo(
    () => (sheetRegionRank ? rankProvenance(sheetRegionRank.representative.evidence, rankBasis.sources) : []),
    [sheetRegionRank, rankBasis.sources],
  );
  // The open region's lifts the ranks left out, named under its rank. The route lists them in
  // `unranked`, never as evidence: a muscle is aggregated only from exercises that placed.
  const sheetUnranked = useMemo<UnrankedLift[]>(() => {
    if (!sheetRegion || !rankProfile) return [];
    const byLift = new Map<string, UnrankedLift>();
    rankProfile.unranked
      .filter((item) => strengthRegionIdsForExerciseName(item.exerciseName).includes(sheetRegion.id))
      .forEach((item) => byLift.set(`${item.exerciseName}|${item.reason}`, { exerciseName: item.exerciseName, reason: item.reason }));
    return Array.from(byLift.values());
  }, [sheetRegion, rankProfile]);
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
  // the coverage colours are not read as ranks. One status line at a time; the
  // limitations of ranks already drawn go in the data notes below it.
  const rankStatus = ranksFailed
    ? <p className="rank-profile-partial" role="status">Ranks could not be worked out just now, so the map shows where lifts are on record. <button type="button" className="rank-profile-retry" disabled={muscleRanks.isFetching} onClick={() => { emitInteractionFeedback(); void muscleRanks.refetch(); }}>{muscleRanks.isFetching ? "Trying again…" : "Try again"}</button></p>
    : ranksOffline
    ? <p className="rank-profile-partial" role="status">Waiting for a connection to rank your lifts. Until then the map shows where lifts are on record.</p>
    : rankSex !== null && rankLifts.length > 0 && muscleRanks.isPending
    ? <p className="rank-profile-partial" role="status">Ranking your lifts… the map shows where lifts are on record until the ranks arrive.</p>
    : ranksUpdateOffline
    ? <p className="rank-profile-partial rank-updating-note" role="status" data-rank-updating>Waiting for a connection to update ranks. The colours are your previous ranks.</p>
    : ranksUpdating
    // The colours stay; this says they are about to be replaced.
    ? <p className="rank-profile-partial rank-updating-note" role="status" data-rank-updating>Updating ranks…</p>
    : rankSex === null && rankLifts.length > 0
    // Intersex and Prefer not to say are complete answers, so they are not asked again.
    ? sexForReference
      ? <p className="rank-profile-partial">Muscle ranks compare against men or women who lift, so for the group you chose this map shows where lifts are on record.</p>
      : onRankProfile
      ? <ComparisonGate need="group" scope="map" onProfile={onRankProfile} />
      : <p className="rank-profile-partial">Ranks on this map need the sex to compare against — set it in About Me.</p>
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
  // A lift is read against the weight saved with it; where the profile weight stood in, say so,
  // and name the lifts, so the athlete knows which records to open. Only a lift logged by hand
  // can take the weight of its day in its record, so only those are sent there; a lift from a
  // workout is named, and marked, without an action its record does not offer. Those lifts
  // read the profile weight as it is now, so editing it moves their ranks - said outright.
  // Counted from the lifts behind the ranks on screen, like the lifts left out beside it.
  const profileWeightLifts = rankBasis.profileWeightLifts;
  const handLoggedProfileWeightCount = profileWeightLifts.filter((lift) => !lift.fromWorkout).length;
  const profileWeightRows = Array.from(profileWeightLifts.reduce((rows, lift) => {
    const key = `${lift.exerciseName}|${lift.fromWorkout}`;
    return rows.set(key, { ...lift, count: (rows.get(key)?.count ?? 0) + 1 });
  }, new Map<string, ProfileWeightLift & { count: number }>()).values());
  const unrankedCount = rankProfile?.unranked.length ?? 0;
  /**
   * Every limitation of the ranks on the map, in one disclosure: lifts left out and why, lifts
   * read against the profile weight, and what age did. Each keeps its own count and its own
   * explanation, and the counts stay in the summary line, so closing it hides no limitation.
   */
  const dataNotes = !rankProfile ? [] : [
    unrankedLifts.length > 0 ? {
      key: "unranked",
      count: `${unrankedCount} not in these ranks`,
      body: <div className="rank-data-note" data-rank-unranked-note>
        <p><b>{unrankedCount} {unrankedCount === 1 ? "lift is" : "lifts are"} not in these ranks</b></p>
        <ul>{unrankedLifts.map((item) => <li key={`${item.exerciseName}-${item.reason}`}>{item.exerciseName}{item.count > 1 ? ` ×${item.count}` : ""} — {unrankedReasonCopy[item.reason] ?? "could not be scored"}</li>)}</ul>
      </div>,
    } : null,
    profileWeightLifts.length > 0 ? {
      key: "profile-weight",
      count: `${profileWeightLifts.length} on your profile weight`,
      body: <div className="rank-data-note" data-rank-body-mass-note>
        <p><b>{profileWeightLifts.length === 1 ? "1 lift uses" : `${profileWeightLifts.length} lifts use`} your current profile weight and will move if you change it</b></p>
        {profileWeightLifts.length === 1
          ? <p>{profileWeightLifts[0].fromWorkout
              ? `Your ${profileWeightLifts[0].exerciseName} lift from a workout has no body weight saved for its day.`
              : `Your ${profileWeightLifts[0].exerciseName} lift has no body weight saved for its day. Open its record to save what you weighed that day.`}</p>
          : <>
              <p>{`They have no body weight saved for their day.${handLoggedProfileWeightCount === 0 ? "" : handLoggedProfileWeightCount === profileWeightLifts.length ? " Open each one's record to save what you weighed that day." : " For each lift you logged by hand, open its record to save what you weighed that day."}`}</p>
              <ul>{profileWeightRows.map((row) => <li key={`${row.exerciseName}|${row.fromWorkout}`}>{row.exerciseName}{row.count > 1 ? ` ×${row.count}` : ""}{row.fromWorkout ? " — from a workout" : ""}</li>)}</ul>
            </>}
      </div>,
    } : null,
    ageSentences.length > 0 ? {
      key: "age",
      count: ageSummary && ageSummary.outsideTable > 0 ? `${ageSummary.outsideTable} outside the age adjustment` : "adjusted for age",
      body: <div className="rank-data-note" data-rank-age-note><p>{ageSentences.join(" ")}</p></div>,
    } : null,
  ].filter((note): note is { key: string; count: string; body: React.JSX.Element } => note !== null);
  const dataNotesDisclosure = dataNotes.length
    ? <details className="rank-profile-partial rank-data-notes" data-rank-data-notes>
        <summary><span>Data notes</span><small>{dataNotes.map((note) => note.count).join(" · ")}</small></summary>
        {dataNotes.map((note) => <React.Fragment key={note.key}>{note.body}</React.Fragment>)}
      </details>
    : null;
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
  // True only when a lift on this device took the weight and the device kept it, so the record
  // never says a weight was saved that went nowhere.
  const setDeviceBodyMass = (observationId: string, bodyMassKgAtTest: number): boolean => {
    const next = setDeviceStrengthObservationBodyMass(deviceObservations, observationId, bodyMassKgAtTest);
    return next !== null && persistDeviceObservations(next);
  };

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
  useEffect(() => { if (!bodyMassTouched && baselineBodyWeight != null) setBodyMassKg(String(baselineBodyWeight)); }, [baselineBodyWeight, bodyMassTouched]);
  const openSavedObservation = (observation: Pick<StrengthObservationRecord, "id" | "exerciseName">, preferredRegionId?: string) => {
    const regions = strengthRegionIdsForExerciseName(observation.exerciseName);
    const regionId = preferredRegionId && regions.includes(preferredRegionId) ? preferredRegionId : regions[0];
    const region = strengthRegionDefinitions.find((candidate) => candidate.id === regionId);
    if (!region) return;
    setSelectedObservationId(String(observation.id));
    setSelectedRegion(region);
  };
  // The saved lift's record is offered from the toast, not opened: the athlete may be logging
  // several lifts in a row. A lift no region reads gets no action, as with the Review button.
  // The toast is gone once its action runs, so it cannot take focus back when the record
  // closes: Log a lift, where the athlete came from, is made the opener instead.
  // Logged from a muscle group's "Add a comparable lift", the action goes back to that group, where
  // its rank (or why there is none yet) is shown; the lift is saved either way (S11).
  const savedLiftToastOptions = (observation: Pick<StrengthObservationRecord, "id" | "exerciseName">) => {
    const regions = strengthRegionIdsForExerciseName(observation.exerciseName);
    const origin = logOriginRegionRef.current && regions.includes(logOriginRegionRef.current) ? strengthRegionDefinitions.find((region) => region.id === logOriginRegionRef.current) : undefined;
    logOriginRegionRef.current = null;
    return regions.length
      ? { action: { label: origin ? `Back to ${origin.label}` : "View record", onClick: () => { emitInteractionFeedback(); setLogOpen(false); logFormRef.current?.querySelector<HTMLElement>(".strength-log-open")?.focus({ preventScroll: true }); openSavedObservation(observation, origin?.id); } } }
      : undefined;
  };
  // Below the dock's breakpoint the record is a sheet over the page, so it is
  // already on screen the instant a muscle is tapped, and the page behind it holds
  // still. Only the wide layout, where the record really does sit further down the
  // page, scrolls to it.
  //
  // A layout effect, so the opener is read before the phone sheet's hold makes the
  // page inert: a browser moves focus off an element that has just become inert.
  useLayoutEffect(() => {
    // However the record closed (the close button, Escape, a second tap on the
    // muscle, Log a lift), its opener is forgotten, so a later open whose click
    // leaves focus on the page never hands focus to a control from an old visit.
    if (!selectedRegion) { regionOpenerRef.current = null; openScrollRef.current = null; return; }
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
        // Kept from the first open only, so closing returns to where the athlete was.
        if (openScrollRef.current === null) openScrollRef.current = window.scrollY;
        const targetTop = Math.max(0, window.scrollY + detail.getBoundingClientRect().top - pinnedChrome - 16);
        window.scrollTo({ top: targetTop, behavior: reduceMotion ? "auto" : "smooth" });
      }
      const refocusSelect = refocusRegionSelectRef.current;
      refocusRegionSelectRef.current = false;
      detail.querySelector<HTMLElement>(refocusSelect ? "[data-strength-region-select]" : "[data-strength-region-heading]")?.focus({ preventScroll: true });
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
    // A phone sheet gives the page back first: that puts the scroll where it was, and
    // an opener still inert would refuse focus.
    releasePageRef.current?.();
    releasePageRef.current = null;
    const opener = regionOpenerRef.current;
    regionOpenerRef.current = null;
    const openScroll = openScrollRef.current;
    openScrollRef.current = null;
    if (!focusWasInRecord) return;
    // The wide page scrolled down to the record when it opened; going back to the
    // opener goes back to where the page stood.
    if (openScroll !== null && !phoneSheet) window.scrollTo({ top: openScroll, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const selectSheetRegion = (region: StrengthRegionDefinition) => {
    refocusRegionSelectRef.current = true;
    setSelectedObservationId("");
    setSelectedRegion(region);
  };
  /**
   * On a phone the record is a modal sheet. It covers the page and the bottom
   * navigation with a scrim, and everything behind it is inert: a tap meant for
   * the sheet cannot land on the figure or leave the page through the dock, and
   * Tab stays inside it. The page holds still at its scroll offset and gets it
   * back on close. Switching muscle groups moves into the sheet's own header.
   */
  const sheetIsModal = phoneSheet && selectedRegion !== null;
  useLayoutEffect(() => {
    const layer = regionDetailRef.current;
    if (!sheetIsModal || !layer) return;
    const release = holdPageBehind(layer, [sheetScrimRef.current]);
    releasePageRef.current = release;
    const onKey = (event: KeyboardEvent) => {
      // A layer opened over this one, such as search, keeps its own Tab.
      if (isKeyForAnotherLayer(event, layer)) return;
      trapTabWithin(event, layer);
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      release();
      if (releasePageRef.current === release) releasePageRef.current = null;
    };
  }, [sheetIsModal]);
  // Escape closes the record, the way it closes any other layer over the page,
  // unless the key belongs to a layer opened over it (search).
  useEffect(() => {
    if (!selectedRegion || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isKeyForAnotherLayer(event, regionDetailRef.current)) return;
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
      const saved = { ...nextObservation, id: `device-strength-${Date.now()}`, observedAt: nextObservation.observedAt.toISOString() };
      const written = persistDeviceObservations(prependDeviceStrengthObservation(deviceObservations, saved));
      if (!written) {
        setSaveError("This lift was not saved: this device refused the write (storage full, private browsing, or storage blocked). Your entry is still here — free some space and save again.");
        toast.error("Could not save this lift on this device.");
        return;
      }
      setSaveError(null);
      setExerciseName(""); setExerciseSearch(""); setSelectedExercise(null); setLoadKg(""); setRepetitions(""); setBodyMassKg(baselineBodyWeight != null ? String(baselineBodyWeight) : ""); setBodyMassTouched(false); setEquipment(""); setRomStandard(""); setTechniqueVariant(""); setTempo(""); setLaterality("BILATERAL"); setExternalAssistance(""); setDataQuality("SELF_REPORTED"); setPiperReferenceOpen(false); setPiperDeclaration(prefilledPiperDeclaration); setPowerliftingReferenceOpen(false); setPowerliftingDeclaration(prefilledPowerliftingDeclaration); setNotes("");
      emitInteractionFeedback([10, 30, 10]); toast.success("Lift saved on this device.", savedLiftToastOptions(saved));
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

    <StrengthGenomeBodyMap regionRanks={regionRanks} rankNotice={rankStatus || dataNotesDisclosure ? <>{rankStatus}{dataNotesDisclosure}</> : null} ranksPending={rankSex !== null && rankLifts.length > 0 && muscleRanks.isPending} regions={strengthRegionDefinitions.map((region) => ({ ...region, state: regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT" ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const }))} activePriorityIds={activePriorityIds} selectedRegionId={selectedRegion?.id} onSelect={(region) => { setSelectedRegion(region || null); if (!region) setSelectedObservationId(""); }} />
    {pendingObservationRemoval && <ConfirmDialog {...pendingObservationRemoval} onCancel={() => setPendingObservationRemoval(null)} />}
    {/* The scrim takes the tap that dismisses a phone sheet; a wide screen keeps the record in the page with none. */}
    {sheetRegion && phoneSheet && <div ref={sheetScrimRef} className={`strength-region-scrim${sheetLeaving ? " is-leaving" : ""}`} aria-hidden="true" onClick={() => { if (!sheetLeaving) closeRegionRecord(); }} />}
    {sheetRegion && <div ref={regionDetailRef} className={`strength-region-sheet${sheetLeaving ? " is-leaving" : ""}`} role={phoneSheet ? "dialog" : "group"} aria-modal={phoneSheet || undefined} aria-labelledby={sheetHeadingIds.title} aria-describedby={sheetHeadingIds.lift} aria-hidden={sheetLeaving || undefined}><StrengthRegionRecordDetail key={`${sheetRegion.id}-${selectedObservationId}`} headingIds={sheetHeadingIds} onSelectRegion={selectSheetRegion} regionRank={sheetRegionRank} rankMode={regionRanks !== null} rankPending={ranksFirstLoading ? (ranksOffline ? "offline" : "ranking") : null} ranksUpdating={ranksUpdateOffline ? "offline" : ranksUpdating ? "updating" : null} rankProvenance={sheetRankProvenance} rankUnranked={sheetUnranked} region={sheetRegion} observations={activeObservations as StrengthObservationRecord[]} onClose={closeRegionRecord} onLogLift={(exercise) => { logOriginRegionRef.current = exercise ? sheetRegion.id : null; setSelectedRegion(null); setSelectedObservationId(""); if (exercise) { setSelectedExercise(exercise); setExerciseName(exercise.name); setExerciseSearch(exercise.name); } setLogOpen(true); window.requestAnimationFrame(() => { logFormRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }); /* With the exercise chosen, the next thing to fill is the set itself. */ const next = exercise ? logFormRef.current?.querySelector<HTMLInputElement>('.strength-log-entry input[inputmode="decimal"], .strength-log-entry input[inputmode="numeric"]') : null; (next ?? logFormRef.current?.querySelector<HTMLInputElement>('input[aria-label="Search and choose a catalog exercise"]'))?.focus({ preventScroll: true }); }); }} weightUnit={weightUnit} baselineBodyWeight={baselineBodyWeight} directAccess={directAccess} onSetDeviceBodyMass={setDeviceBodyMass} rankGroupNeeded={rankSex !== null ? null : sexForReference ? "no_curve" : "missing"} rankUnavailable={ranksFailed ? "failed" : ranksOffline ? "offline" : null} initialRecordId={selectedObservationId} powerliftingNorms={powerliftingNorms} strengthChanges={comparableStrengthChanges} referenceRows={referenceRows} athleteProfile={athleteProfile} bodyWeightHistory={bodyWeightHistory} onRankProfile={onRankProfile} registryOffline={registryOfflineNotice !== null} />
      {/* Focus is kept only with an account's priorities, which direct access never
          reads, so on a device-only record the row offers training alone. The training
          action says where it goes: Train → Plan, on the day the plan has open. Toasts
          are lifted clear of this row (lib/feedbackClearance.ts). */}
      <div ref={feedbackSurfaceRef} className="strength-region-focus-row">{directAccess ? <p><strong>Want to train this?</strong> Add {sheetRegion.label.toLowerCase()} work to a day in your Plan.</p> : <p><strong>Want to prioritize this?</strong> Optional. It will not change today&apos;s workout on its own.</p>}<div><button type="button" onClick={() => { emitInteractionFeedback(); onOpenTraining(); }} className="strength-focus-secondary" aria-label={`Open Plan to add ${sheetRegion.label.toLowerCase()} work`}>Open Plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>{!directAccess && <button type="button" disabled={setPriority.isPending} onClick={() => { emitInteractionFeedback(); setPriority.mutate({ regionId: sheetRegion.id, active: !activePriorityIds.has(sheetRegion.id) }); }} className={`strength-focus-primary ${activePriorityIds.has(sheetRegion.id) ? "is-active" : ""}`}>{activePriorityIds.has(sheetRegion.id) ? "Focused" : "Set focus"}</button>}</div></div>
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
          <StrengthBodyMassInput weightUnit={weightUnit} value={bodyMassKg} onChange={(value) => { setBodyMassTouched(true); setBodyMassKg(value); }} />
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
        {powerliftingCaptureAvailable && <details className="strength-piper-capture strength-powerlifting-capture" open={powerliftingReferenceOpen} onToggle={(event) => setPowerliftingReferenceOpen(event.currentTarget.open)}><summary>Competitive powerlifting reference</summary><p>Optional. This compares one exact maximum under drug-tested, unequipped competition standards for adults aged 18–35; it does not rate everyday gym lifts.</p>{powerliftingReferenceOpen && <div className="strength-piper-fields strength-powerlifting-fields"><label><span>Which competition category?</span><select value={powerliftingDeclaration.sex || ""} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, sex: (event.target.value || undefined) as PowerliftingReferenceDeclaration["sex"] }))}><option value="">Choose a category</option><option value="female">Women’s competition</option><option value="male">Men’s competition</option></select></label><label><span>Age on test day</span><input aria-label="Age on test day for powerlifting reference" inputMode="numeric" value={powerliftingDeclaration.ageYears || ""} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, ageYears: Number(event.target.value.replace(/[^0-9]/g, "")) || undefined }))} placeholder="18–35" /></label><label><input type="checkbox" checked={powerliftingDeclaration.drugTestedCompetitionConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, drugTestedCompetitionConfirmed: event.target.checked }))} /> This was a drug-tested powerlifting competition lift.</label><label><input type="checkbox" checked={powerliftingDeclaration.unequippedCompetitionConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, unequippedCompetitionConfirmed: event.target.checked }))} /> The lift was unequipped under the competition standard.</label><label><input type="checkbox" checked={powerliftingDeclaration.maximumSuccessfulLiftConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, maximumSuccessfulLiftConfirmed: event.target.checked }))} /> This was the maximum successful competition lift.</label><p>Use the saved profile weight only if it matches your body weight on this test day.</p></div>}</details>}
        <div className="strength-log-submit">
          <button type="button" disabled={!canSave || addObservation.isPending} onClick={submit} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--sg-action-fill)] px-4 text-[11px] font-bold uppercase tracking-[.12em] text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Plus className="h-4 w-4" /> {addObservation.isPending ? "Saving" : "Save this lift"}</button>
          {!canSave && <p className="strength-log-blocked" role="status">{!selectedExercise ? "Choose an exercise from the catalog above to save this." : measurementRefusal ? measurementRefusal : !liftDateInRange ? "Enter the date this lift happened." : loadMissing ? `Enter the load in ${weightUnitLabel(weightUnit)} to save this.` : loadInvalid ? `Fix or clear the ${loadLabel.charAt(0).toLowerCase()}${loadLabel.slice(1)} to save this.` : "Enter the reps of the working set to save this."}</p>}
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
        <p data-muscle-rank-ceiling>A muscle group is read through the lifts that train it. A lift counts for more the more of its work the muscle does, so an isolation lift says more about it than a compound lift it shares with other muscles; and each lift is scaled by how much it relies on the muscle, so a group sits a little below the lifts behind it. The comparison curves stop at the 95th percentile, so for now no muscle group can reach National or World Stage. Muscles your lifts only steady are not ranked.</p>
        {registryOfflineNotice && <p className="strength-profile-reference-offline" role="status">{registryOfflineNotice}</p>}
        <p>Your own progress is always tracked from your logs. A comparison against published numbers only appears when your exact lift, setup, and body weight line up with a study — most everyday gym lifts will not, and that is normal.</p>
        {supabaseEvidenceInventory.data?.status === "connected" && <p>Research on file: {supabaseEvidenceInventory.data.strengthNorms} strength norms, {supabaseEvidenceInventory.data.performanceNorms} performance norms, and {supabaseEvidenceInventory.data.performanceTests} test protocols. Having them on file does not by itself create a rank for you.</p>}
        {approvedReferenceExercises.length > 0 && <p>Reviewed and approved for comparison so far: {approvedReferenceExercises.join(", ")}. Every other study on file stays under review until its exact population and protocol are checked.</p>}
      </div>
    </details>
  </section>;
}
