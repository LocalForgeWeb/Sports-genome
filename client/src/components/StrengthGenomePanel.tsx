import React, { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ChevronRight, CircleHelp, Dumbbell, Plus, ShieldCheck, X } from "lucide-react";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getStrengthCatalogSelectionContext, strengthRegionDefinitions, type StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { StrengthGenomeBodyMap } from "@/components/StrengthGenomeBodyMap";
import { resolveStrengthObservationRoute } from "../../../shared/strengthGenomeDefinitions";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { displayWeightToKilograms, formatDisplayWeight, kilogramsToDisplayWeight, weightUnitLabel, type DisplayWeightUnit } from "@/lib/weightUnits";
import { deviceStrengthObservationEvent, loadDeviceStrengthObservations, prependDeviceStrengthObservation, saveDeviceStrengthObservations, setDeviceStrengthObservationBodyMass, type DeviceStrengthObservation } from "@/lib/deviceStrengthObservations";
import { getPiper2021PreacherCurlReference, piper2021PreacherCurlReferenceId, type Piper2021PreacherCurlContext } from "../../../shared/piper2021PreacherCurlReference";
import { getVanDenHoek2024PowerliftingReference, vanDenHoek2024ReferenceId, type PowerliftingReferenceDeclaration } from "@/lib/powerliftingReference";
import type { PowerliftingNormRow } from "@shared/powerliftingNormsReference";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";
import { summarizeWithinAthleteStrengthComparisons, type ChangeState, type ComparableStrengthObservation, type WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";

const changeStateCopy: Record<ChangeState, { label: string; tone: string }> = {
  insufficient_history: { label: "Not enough history yet", tone: "#9eb3cb" },
  stable: { label: "Stable", tone: "#9eb3cb" },
  directional_signal_emerging: { label: "Starting to move", tone: "#f2c14d" },
  meaningful_change_supported: { label: "Confirmed change", tone: "#5bc07a" },
};

function normalizedName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";

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

type StrengthObservationRecord = { id: string | number; exerciseName: string; observedAt: Date | string; measurementType: string; loadKg?: number | null; repetitions?: number | null; bodyMassKgAtTest?: number | null; equipment?: string | null; romStandard?: string | null; dataQuality?: string | null; referenceContextJson?: string | null };

type PiperReferenceDeclaration = Pick<Piper2021PreacherCurlContext, "sex" | "ageYears" | "collegeStudentConfirmed" | "preTrainingConfirmed" | "exactProtocolConfirmed" | "directlyObservedConfirmed">;

const emptyPiperDeclaration: PiperReferenceDeclaration = { sex: undefined, ageYears: undefined, collegeStudentConfirmed: false, preTrainingConfirmed: false, exactProtocolConfirmed: false, directlyObservedConfirmed: false };
const emptyPowerliftingDeclaration: PowerliftingReferenceDeclaration = { sex: undefined, ageYears: undefined, drugTestedCompetitionConfirmed: false, unequippedCompetitionConfirmed: false, maximumSuccessfulLiftConfirmed: false };
const strengthReferenceStateVisuals = {
  qualified: sportsGenomeAssets.strengthQualified,
  unavailable: sportsGenomeAssets.strengthUnavailable,
} as const;

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

export function selectStrengthRegionRecord<T extends { id: string | number }>(records: T[], selectedRecordId: string) {
  return records.find((record) => String(record.id) === selectedRecordId) || records[0];
}

export function StrengthCatalogSelectionPreview({ context }: { context: ReturnType<typeof getStrengthCatalogSelectionContext> }) {
  return <div className="strength-selected-exercise" aria-live="polite"><strong>{context.exerciseName}</strong><span>Primary: {context.primaryMuscles.join(" · ")}{context.supportingMuscles.length ? ` · Supporting: ${context.supportingMuscles.join(" · ")}` : ""}</span><small>{context.domainLabels.length ? `Recorded context: ${context.domainLabels.join(" · ")}` : "Recorded context unavailable"}</small><small>{context.boundary}</small></div>;
}

export function StrengthLoadInput({ weightUnit, value, requiresLoad, onChange }: { weightUnit: DisplayWeightUnit; value: string; requiresLoad: boolean; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Load in {weightUnitLabel(weightUnit)} {requiresLoad ? "· required" : "· optional"}</span><input aria-label={`Load in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={requiresLoad ? `Enter ${weightUnit}` : "Optional"} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

export function StrengthBodyMassInput({ weightUnit, value, onChange }: { weightUnit: DisplayWeightUnit; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Body mass at test ({weightUnit})</span><input aria-label={`Body mass at test in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

export function StrengthObservationReviewButton({ observation, onReview }: { observation: StrengthObservationRecord; onReview: (observation: StrengthObservationRecord) => void }) {
  return <button type="button" onClick={() => { emitInteractionFeedback(); onReview(observation); }} className="strength-observation-review">Review</button>;
}

export function StrengthRegionRecordDetail({ region, observations, onClose, weightUnit, baselineBodyWeight, directAccess, onSetDeviceBodyMass, initialRecordId = "", powerliftingNorms = [], strengthChanges = [] }: { region: StrengthRegionDefinition; observations: StrengthObservationRecord[]; onClose: () => void; weightUnit: DisplayWeightUnit; baselineBodyWeight?: number; directAccess: boolean; onSetDeviceBodyMass: (observationId: string, bodyMassKgAtTest: number) => void; initialRecordId?: string; powerliftingNorms?: readonly PowerliftingNormRow[]; strengthChanges?: readonly WithinAthleteStrengthChange[] }) {
  const records = useMemo(() => observations.filter((observation) => resolveStrengthObservationRoute(observation.exerciseName)?.regionIds.includes(region.id)), [observations, region.id]);
  const utils = trpc.useUtils();
  const matchedReferenceRef = useRef<HTMLElement>(null);
  const [bodyMassEntry, setBodyMassEntry] = useState(() => baselineBodyWeight != null ? String(baselineBodyWeight) : "");
  const [bodyMassSaveError, setBodyMassSaveError] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecordId);
  useEffect(() => {
    setSelectedRecordId((current) => records.some((record) => String(record.id) === current) ? current : String(records[0]?.id || ""));
  }, [records]);
  const setObservationBodyMass = trpc.strengthGenome.setObservationBodyMass.useMutation({ onSuccess: async () => { emitInteractionFeedback([10, 30, 10]); setBodyMassSaveError(null); setBodyMassEntry(""); toast.success("Test body mass saved. Your recorded ratio is ready."); await Promise.all([utils.strengthGenome.observations.invalidate(), utils.strengthGenome.overview.invalidate()]); }, onError: () => { setBodyMassSaveError("Body mass was not saved. Your entry is still here—check your connection and try again."); toast.error("Could not save test body mass. Check your connection and try again."); } });
  const latestRecord = selectStrengthRegionRecord(records, selectedRecordId);
  const bodyMassRatio = latestRecord?.loadKg != null && latestRecord.bodyMassKgAtTest != null && latestRecord.bodyMassKgAtTest > 0 ? latestRecord.loadKg / latestRecord.bodyMassKgAtTest : null;
  const piperReference = latestRecord ? getPiperReferenceForObservation(latestRecord) : null;
  const powerliftingReference = latestRecord ? getPowerliftingReferenceForObservation(latestRecord, powerliftingNorms) : null;
  const strengthTrend = latestRecord ? strengthChanges.find((change) => normalizedName(change.exerciseName) === normalizedName(latestRecord.exerciseName)) : undefined;
  useEffect(() => {
    if (piperReference?.status !== "matched" || !matchedReferenceRef.current) return;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => matchedReferenceRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" }));
  }, [latestRecord?.id, piperReference?.status]);
  const parsedBodyMassEntry = Number(bodyMassEntry);
  return <section className="strength-region-record-detail" aria-label={`${region.label} recorded strength context`}>
    <div className="strength-region-record-heading"><div><p className="metric-label">Your record</p><h2 tabIndex={-1} data-strength-region-heading>{region.label}</h2></div><button type="button" onClick={() => { emitInteractionFeedback(); onClose(); }} className="strength-region-close" aria-label={`Close ${region.label} detail`}><X className="h-4 w-4" /></button></div>
    {latestRecord ? <>
      <article className="strength-region-record-card">
        {records.length > 1 && <label className="strength-region-record-picker"><span>Which lift</span><select aria-label="Choose recorded test" value={selectedRecordId || String(latestRecord.id)} onChange={(event) => setSelectedRecordId(event.target.value)}>{records.map((record) => <option key={record.id} value={String(record.id)}>{record.exerciseName} · {new Date(record.observedAt).toLocaleDateString()}</option>)}</select></label>}
        <span className="strength-region-test-name">{latestRecord.exerciseName}</span>
        {strengthTrend ? <article className="strength-reference-matched strength-reference-primary strength-rating-card" style={{ borderColor: changeStateCopy[strengthTrend.changeState].tone }}>
          <p className="metric-label">Your rating on this lift</p>
          <strong className="strength-body-mass-ratio" style={{ color: changeStateCopy[strengthTrend.changeState].tone }}>{strengthTrend.relativeChangePercent >= 0 ? "+" : ""}{strengthTrend.relativeChangePercent.toFixed(0)}%</strong>
          <span className="strength-rating-state" style={{ color: changeStateCopy[strengthTrend.changeState].tone }}>{changeStateCopy[strengthTrend.changeState].label}</span>
          <p>Change in your estimated one-rep max across {strengthTrend.observationCount} logs since {strengthTrend.firstPoint.observedAt.toLocaleDateString()}.</p>
        </article> : <p className="strength-rating-empty">Log this lift once more and your progress rating shows up here.</p>}
        {bodyMassRatio != null && <p className="strength-region-ratio-inline">{bodyMassRatio.toFixed(2)}× your body weight on that day — for your own context, not a rank.</p>}
        {powerliftingReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Compared to that competition group</p><strong>{powerliftingReference.percentileBandLabel}</strong><p>{powerliftingReference.relativeStrength.toFixed(2)}× body mass · {powerliftingReference.sourceLabel}. Exact competition context only.</p><a href={powerliftingReference.sourceUrl} target="_blank" rel="noreferrer">View van den Hoek et al. 2024 source</a></article> : piperReference?.status === "matched" ? <article ref={matchedReferenceRef} className="strength-reference-matched strength-reference-primary"><p className="metric-label">Source-sample rank range</p><strong>{piperReference.comparison}</strong><p>{piperReference.sourceLabel} · {piperReference.bodyMassBand}. This is the primary result for this exact matched test only.</p><a href="https://doi.org/10.47206/ijsc.v1i1.40" target="_blank" rel="noreferrer">View Piper et al. 2021 source</a></article> : null}
        {bodyMassRatio == null && <details className="strength-recorded-measurement"><summary>{baselineBodyWeight != null ? "Use saved profile weight" : "Add test body weight"}</summary><form className="strength-ratio-entry" onSubmit={(event) => { event.preventDefault(); if (!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0) return; const bodyMassKgAtTest = displayWeightToKilograms(parsedBodyMassEntry, weightUnit); if (directAccess) { onSetDeviceBodyMass(String(latestRecord.id), bodyMassKgAtTest); setBodyMassEntry(""); emitInteractionFeedback([10, 30, 10]); toast.success("Saved profile body weight attached to this test on this device."); return; } setBodyMassSaveError(null); setObservationBodyMass.mutate({ observationId: Number(latestRecord.id), bodyMassKgAtTest }); }}><label><span>{baselineBodyWeight != null ? `Saved profile body weight (${weightUnit})` : `Body mass on test day (${weightUnit})`}</span><input aria-label={`${baselineBodyWeight != null ? "Saved profile body weight" : "Body mass on test day"} in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={bodyMassEntry} onChange={(event) => { setBodyMassSaveError(null); setBodyMassEntry(event.target.value.replace(/[^0-9.]/g, "")); }} placeholder={weightUnit === "lb" ? "e.g. 180" : "e.g. 82"} /></label><button type="submit" aria-busy={!directAccess && setObservationBodyMass.isPending} disabled={!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0 || (!directAccess && setObservationBodyMass.isPending)}>{!directAccess && setObservationBodyMass.isPending ? "Saving" : baselineBodyWeight != null ? "Use saved weight" : "Save test body weight"}</button>{baselineBodyWeight != null && <small>Your saved profile value is ready. Change it first only if your test-day weight differed.</small>}{!directAccess && setObservationBodyMass.isPending && <p className="strength-ratio-status" role="status">Saving body mass for this test…</p>}{bodyMassSaveError && <p className="strength-ratio-error" role="alert">{bodyMassSaveError}</p>}</form></details>}
        <details className="strength-region-boundary"><summary>{(powerliftingReference?.status === "matched" || piperReference?.status === "matched") ? "About this comparison" : "Why no comparison to other people?"}</summary><p>{(powerliftingReference?.status === "matched" || piperReference?.status === "matched") ? "This matches one specific study, for this exact test only — not a general claim about how strong you are." : "A comparison to other people only appears when your exact lift, setup, and body weight match a published study — most gym lifts will not. Your rating above comes from your own logs only: it is not a percentile, universal rank, or regional force score."}</p></details>
        <span className="strength-region-test-meta">{latestRecord.loadKg != null ? formatDisplayWeight(latestRecord.loadKg, weightUnit) : "No load"}{latestRecord.repetitions ? ` · ${latestRecord.repetitions} reps` : ""} · {new Date(latestRecord.observedAt).toLocaleDateString()}</span>
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

export function StrengthGenomePanel({ onOpenTraining = () => {}, weightUnit = "lb", baselineBodyWeight, sexForReference, birthYear, defaultTestingDetailOpen = false, directAccess = false }: { onOpenTraining?: () => void; weightUnit?: DisplayWeightUnit; baselineBodyWeight?: number; sexForReference?: SexForReference; birthYear?: number; defaultTestingDetailOpen?: boolean; directAccess?: boolean }) {
  const utils = trpc.useUtils();
  const overview = trpc.strengthGenome.overview.useQuery(undefined, { enabled: !directAccess });
  const observations = trpc.strengthGenome.observations.useQuery(undefined, { enabled: !directAccess });
  const priorities = trpc.strengthGenome.priorities.useQuery(undefined, { enabled: !directAccess });
  const supabaseEvidenceInventory = trpc.researchEvidence.supabaseInventory.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const powerliftingNormsQuery = trpc.strengthGenome.powerliftingNorms.useQuery(undefined, { staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false });
  const powerliftingNorms = powerliftingNormsQuery.data || [];
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery(undefined, { enabled: !directAccess });
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
  const [selectedObservationId, setSelectedObservationId] = useState("");
  const regionDetailRef = useRef<HTMLDivElement | null>(null);
  const [deviceObservations, setDeviceObservations] = useState<DeviceStrengthObservation[]>(() => loadDeviceStrengthObservations());
  useEffect(() => {
    if (!directAccess) return;
    const refresh = () => setDeviceObservations(loadDeviceStrengthObservations());
    window.addEventListener(deviceStrengthObservationEvent, refresh);
    return () => window.removeEventListener(deviceStrengthObservationEvent, refresh);
  }, [directAccess]);
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
  const activeObservations = directAccess ? deviceObservations : (observations.data || []) as StrengthObservationRecord[];
  const recentObservations = activeObservations.slice(0, 4);
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
  const regionOverview = (regionId: string) => directAccess ? { state: activeObservations.some((observation) => resolveStrengthObservationRoute(observation.exerciseName)?.regionIds.includes(regionId)) ? "OBSERVED_TEST_CONTEXT" : "INSUFFICIENT_DATA" } : overview.data?.regions.find(region => region.id === regionId);
  const observedRegionCount = strengthRegionDefinitions.filter((region) => regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT").length;
  const sourceMatchedObservationCount = activeObservations.filter((observation) => getPiperReferenceForObservation(observation)?.status === "matched" || getPowerliftingReferenceForObservation(observation, powerliftingNorms)?.status === "matched").length;
  const recordedCoveragePercent = Math.round((observedRegionCount / strengthRegionDefinitions.length) * 100);
  const activePriorityIds = new Set(priorities.data?.map(priority => priority.regionId) || overview.data?.athleteConfirmedPriorityRegionIds || []);
  const persistDeviceObservations = (next: DeviceStrengthObservation[]) => { setDeviceObservations(next); saveDeviceStrengthObservations(next); };
  const setDeviceBodyMass = (observationId: string, bodyMassKgAtTest: number) => persistDeviceObservations(setDeviceStrengthObservationBodyMass(deviceObservations, observationId, bodyMassKgAtTest));
  useEffect(() => { if (baselineBodyWeight != null && bodyMassKg === "") setBodyMassKg(String(baselineBodyWeight)); }, [baselineBodyWeight, bodyMassKg]);
  const openSavedObservation = (observation: StrengthObservationRecord) => {
    const regionId = resolveStrengthObservationRoute(observation.exerciseName)?.regionIds[0];
    const region = strengthRegionDefinitions.find((candidate) => candidate.id === regionId);
    if (!region) return;
    setSelectedObservationId(String(observation.id));
    setSelectedRegion(region);
  };
  useEffect(() => {
    const detail = regionDetailRef.current;
    if (!selectedRegion || !detail || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const stickyOffset = window.matchMedia?.("(max-width: 640px)").matches ? 172 : 28;
      const targetTop = Math.max(0, window.scrollY + detail.getBoundingClientRect().top - stickyOffset);
      window.scrollTo({ top: targetTop, behavior: reduceMotion ? "auto" : "smooth" });
      detail.querySelector<HTMLElement>("[data-strength-region-heading]")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedRegion?.id, selectedObservationId]);
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
        <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#102947]">Your Strength<br /><em className="text-[#2d6cdf]">Genome.</em></h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#53718d]">Log what you lift and watch your strength move over time. Tap any muscle group to see what you have recorded there.</p>
      </div>
      <div className="view-header-note"><ShieldCheck className="h-5 w-5 text-[#2d6cdf]" /><p>Your own progress and any outside comparison stay separate—never blended into one made-up score.</p></div>
    </div>

	      <section className="strength-profile-status">
	        <div className="strength-profile-status-overview">
          <div><p className="metric-label">Your record</p><h2>{activeObservations.length ? "Your lifts so far" : "Start your record"}</h2><p>{observedRegionCount} muscle group{observedRegionCount === 1 ? "" : "s"} covered</p></div>
          <div className="strength-profile-status-tools"><div className={`strength-profile-coverage-ring ${sourceMatchedObservationCount ? "is-source-qualified" : ""}`} style={{ "--coverage-progress": `${recordedCoveragePercent}%` } as CSSProperties} aria-label={`${recordedCoveragePercent}% recorded test coverage; not a strength rank`}><div><strong>{recordedCoveragePercent}</strong><span>%</span><small>coverage</small></div></div><span className="strength-profile-device-boundary"><CircleHelp className="h-3.5 w-3.5" /> {directAccess ? "This device" : "Private record"}</span></div>
	        </div>
	        {sourceMatchedObservationCount > 0 && <div className="strength-profile-reference-summary" aria-label="Comparative reference status"><span>Comparison</span><strong>Ready on {sourceMatchedObservationCount} lift{sourceMatchedObservationCount === 1 ? "" : "s"}</strong></div>}
        <details className="strength-profile-reference-details"><summary>How comparison works</summary><p>Your own progress is always tracked from your logs. A comparison against published numbers only appears when your exact lift, setup, and body weight line up with a study — most everyday gym lifts will not, and that is normal.</p>{supabaseEvidenceInventory.data?.status === "connected" && <p className="mt-2">Research on file: {supabaseEvidenceInventory.data.strengthNorms} strength norms, {supabaseEvidenceInventory.data.performanceNorms} performance norms, and {supabaseEvidenceInventory.data.performanceTests} test protocols. Having them on file does not by itself create a rank for you.</p>}</details>
	        <div className="strength-reference-state-visual" aria-hidden="true"><img src={sourceMatchedObservationCount ? strengthReferenceStateVisuals.qualified : strengthReferenceStateVisuals.unavailable} alt="" /></div>
	      </section>
      <StrengthGenomeBodyMap regions={strengthRegionDefinitions.map((region) => ({ ...region, state: regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT" ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const }))} activePriorityIds={activePriorityIds} selectedRegionId={selectedRegion?.id} onSelect={(region) => { setSelectedRegion(region || null); if (!region) setSelectedObservationId(""); }} />
      {selectedRegion && <div ref={regionDetailRef}><StrengthRegionRecordDetail key={`${selectedRegion.id}-${selectedObservationId}`} region={selectedRegion} observations={activeObservations as StrengthObservationRecord[]} onClose={() => { setSelectedRegion(null); setSelectedObservationId(""); }} weightUnit={weightUnit} baselineBodyWeight={baselineBodyWeight} directAccess={directAccess} onSetDeviceBodyMass={setDeviceBodyMass} initialRecordId={selectedObservationId} powerliftingNorms={powerliftingNorms} strengthChanges={comparableStrengthChanges} /></div>}
      {selectedRegion && <div className="strength-region-focus-row"><p><strong>Want to prioritize this?</strong> Optional. It will not change today&apos;s workout on its own.</p><div><button type="button" onClick={() => { emitInteractionFeedback(); onOpenTraining(); }} className="strength-focus-secondary">Review training</button><button type="button" disabled={setPriority.isPending} onClick={() => { emitInteractionFeedback(); setPriority.mutate({ regionId: selectedRegion.id, active: !activePriorityIds.has(selectedRegion.id) }); }} className={`strength-focus-primary ${activePriorityIds.has(selectedRegion.id) ? "is-active" : ""}`}>{activePriorityIds.has(selectedRegion.id) ? "Focused" : "Set focus"}</button></div></div>}
      <div className="strength-observation-summary"><strong>{activeObservations.length} saved</strong><span>{directAccess ? (activeObservations.length ? "Saved on this device only." : "Log a lift to start your record.") : (overview.data?.nextAction || "Log a lift to start your record.")}</span></div>

    <div className="strength-progress-grid grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="strength-log-entry dark-panel p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="metric-label !text-[#9eb3cb]">Add to your record</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Log a lift.</h2><p className="mt-3 max-w-xl text-xs leading-5 text-[#c3d3e4]">Enter what you actually lifted. Everything stays private to you.</p></div><Dumbbell className="h-7 w-7 shrink-0 text-[#f2c14d]" /></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Choose exercise</span><input aria-label="Search and choose a catalog exercise" value={exerciseSearch} onChange={(event) => { setExerciseSearch(event.target.value); setSelectedExercise(null); setExerciseName(""); }} placeholder="Search catalog, then select" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>{exerciseSearch.trim() && !selectedExercise && <div className="strength-exercise-picker" role="listbox" aria-label="Catalog exercise results">{exerciseMatches.length ? exerciseMatches.map((exercise) => <button type="button" role="option" key={exercise.id} onClick={() => { emitInteractionFeedback(); setSelectedExercise(exercise); setExerciseName(exercise.name); setExerciseSearch(exercise.name); }}><strong>{exercise.name}</strong><span>{exercise.primaryMuscles.join(" · ")}</span></button>) : <p>No matching catalog exercise.</p>}</div>}{selectedExerciseContext && <StrengthCatalogSelectionPreview context={selectedExerciseContext} />}</div>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">How you measured it</span><select value={measurementType} onChange={(event) => setMeasurementType(event.target.value as MeasurementType)} className="h-12 rounded-xl border border-white/20 bg-[#102947] px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30">{measurementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Date</span><input type="date" value={observedDate} onChange={(event) => setObservedDate(event.target.value)} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <StrengthLoadInput weightUnit={weightUnit} value={loadKg} requiresLoad={needsLoad} onChange={setLoadKg} />
          {measurementType === "MULTI_REP" && <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Repetitions</span><input inputMode="numeric" value={repetitions} onChange={(event) => setRepetitions(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Enter reps" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>}
        </div>
        <button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="mt-4 block text-[10px] font-bold uppercase tracking-[.12em] text-[#9fc8f4] hover:text-white">{advancedOpen ? "Hide" : "Show"} more options</button>
        {advancedOpen && <div className="mt-3 grid gap-3 border-l-2 border-[#f2c14d] pl-3 sm:grid-cols-2">
          <StrengthBodyMassInput weightUnit={weightUnit} value={bodyMassKg} onChange={setBodyMassKg} />
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">How it was set up</span><select value={dataQuality} onChange={(event) => setDataQuality(event.target.value as ObservationDataQuality)} className="h-11 rounded-xl border border-white/20 bg-[#102947] px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30">{dataQualityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Which side</span><select value={laterality} onChange={(event) => setLaterality(event.target.value as typeof laterality)} className="h-11 rounded-xl border border-white/20 bg-[#102947] px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30"><option value="BILATERAL">Bilateral</option><option value="LEFT">Left</option><option value="RIGHT">Right</option></select></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Equipment</span><input value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="e.g. barbell, rack" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Range of motion</span><input value={romStandard} onChange={(event) => setRomStandard(event.target.value)} placeholder="e.g. full depth" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Variation</span><input value={techniqueVariant} onChange={(event) => setTechniqueVariant(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Tempo</span><input value={tempo} onChange={(event) => setTempo(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Assistance used</span><input value={externalAssistance} onChange={(event) => setExternalAssistance(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5 sm:col-span-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context for this result" className="min-h-20 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <p className="sm:col-span-2 text-xs leading-5 text-[#c3d3e4]">All optional. They just help you compare like with like later on.</p>
        </div>}
        {piperCaptureAvailable && <details className="strength-piper-capture" open={piperReferenceOpen} onToggle={(event) => setPiperReferenceOpen(event.currentTarget.open)}><summary>Check exact Piper 2021 preacher-curl 10RM conditions</summary><p>This is optional. It is the only route to the source’s narrow adult-male college sample reference; it does not rate generic curls.</p>{piperReferenceOpen && <div className="strength-piper-fields"><label><span>Sex in this source comparison</span><select value={piperDeclaration.sex || ""} onChange={(event) => setPiperDeclaration((current) => ({ ...current, sex: (event.target.value || undefined) as PiperReferenceDeclaration["sex"] }))}><option value="">Choose</option><option value="male">Male</option><option value="female">Female</option><option value="intersex">Intersex</option><option value="self_described">Self-described</option><option value="prefer_not_to_say">Prefer not to say</option></select></label><label><span>Age on test day</span><input aria-label="Age on test day for Piper 2021 reference" inputMode="numeric" value={piperDeclaration.ageYears || ""} onChange={(event) => setPiperDeclaration((current) => ({ ...current, ageYears: Number(event.target.value.replace(/[^0-9]/g, "")) || undefined }))} placeholder="18–25" /></label><label><input type="checkbox" checked={piperDeclaration.collegeStudentConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, collegeStudentConfirmed: event.target.checked }))} /> I am male, 18–25, and a college student — the same group the study used.</label><label><input type="checkbox" checked={piperDeclaration.preTrainingConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, preTrainingConfirmed: event.target.checked }))} /> I did this lift before starting a training program for it, as the study group did.</label><label><input type="checkbox" checked={piperDeclaration.directlyObservedConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, directlyObservedConfirmed: event.target.checked }))} /> This 10RM was directly observed with valid technique and no assistance.</label><label><input type="checkbox" checked={piperDeclaration.exactProtocolConfirmed} onChange={(event) => setPiperDeclaration((current) => ({ ...current, exactProtocolConfirmed: event.target.checked }))} /> I used the source’s Body Masters BE 207 seated 40° pad, 22 lb York EZ-bar, and stated technique protocol.</label></div>}</details>}
        {powerliftingCaptureAvailable && <details className="strength-piper-capture strength-powerlifting-capture" open={powerliftingReferenceOpen} onToggle={(event) => setPowerliftingReferenceOpen(event.currentTarget.open)}><summary>Competitive powerlifting reference</summary><p>Optional. This compares one exact maximum under drug-tested, unequipped competition standards for adults aged 18–35; it does not rate everyday gym lifts.</p>{powerliftingReferenceOpen && <div className="strength-piper-fields strength-powerlifting-fields"><label><span>Which competition category?</span><select value={powerliftingDeclaration.sex || ""} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, sex: (event.target.value || undefined) as PowerliftingReferenceDeclaration["sex"] }))}><option value="">Choose a category</option><option value="female">Women.s competition</option><option value="male">Men.s competition</option></select></label><label><span>Age on test day</span><input aria-label="Age on test day for powerlifting reference" inputMode="numeric" value={powerliftingDeclaration.ageYears || ""} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, ageYears: Number(event.target.value.replace(/[^0-9]/g, "")) || undefined }))} placeholder="18–35" /></label><label><input type="checkbox" checked={powerliftingDeclaration.drugTestedCompetitionConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, drugTestedCompetitionConfirmed: event.target.checked }))} /> This was a drug-tested powerlifting competition lift.</label><label><input type="checkbox" checked={powerliftingDeclaration.unequippedCompetitionConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, unequippedCompetitionConfirmed: event.target.checked }))} /> The lift was unequipped under the competition standard.</label><label><input type="checkbox" checked={powerliftingDeclaration.maximumSuccessfulLiftConfirmed} onChange={(event) => setPowerliftingDeclaration((current) => ({ ...current, maximumSuccessfulLiftConfirmed: event.target.checked }))} /> This was the maximum successful competition lift.</label><p>Use the saved profile weight only if it matches your body mass on this test day.</p></div>}</details>}
        <button type="button" disabled={!canSave || addObservation.isPending} onClick={submit} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e4512e] px-4 text-[11px] font-bold uppercase tracking-[.12em] text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Plus className="h-4 w-4" /> {addObservation.isPending ? "Saving" : "Save this lift"}</button>
      </section>

      <aside className="strength-progress-log light-panel p-5"><p className="metric-label">Your history</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[#102947]">Recent lifts</h2>{recentObservations.length ? <div className="mt-4 divide-y divide-[#d9e5ef]">{recentObservations.map((observation) => <div key={observation.id} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div><p className="text-sm font-bold text-[#153b61]">{observation.exerciseName}</p><p className="mt-1 text-[11px] text-[#607b91]">{measurementTypeLabel(observation.measurementType)} · {new Date(observation.observedAt).toLocaleDateString()}</p></div>{directAccess && resolveStrengthObservationRoute(observation.exerciseName) && <StrengthObservationReviewButton observation={observation as StrengthObservationRecord} onReview={openSavedObservation} />}</div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#c7d8e6] bg-[#f8fbff] p-4"><Activity className="h-5 w-5 text-[#2d6cdf]" /><p className="mt-3 text-sm font-bold text-[#153b61]">Nothing logged yet</p><p className="mt-1 text-xs leading-5 text-[#607b91]">Log your first lift and your progress starts tracking from there.</p></div>}</aside>
    </div>
  </section>;
}
