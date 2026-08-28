import React, { useMemo, useState } from "react";
import { Activity, ChevronRight, CircleHelp, Dumbbell, Plus, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getStrengthCatalogSelectionContext, strengthRegionDefinitions, type StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { StrengthGenomeBodyMap } from "@/components/StrengthGenomeBodyMap";
import { resolveStrengthObservationRoute } from "../../../shared/strengthGenomeDefinitions";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { displayWeightToKilograms, formatDisplayWeight, weightUnitLabel, type DisplayWeightUnit } from "@/lib/weightUnits";

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

type StrengthObservationRecord = { id: string | number; exerciseName: string; observedAt: Date | string; measurementType: string; loadKg?: number | null; repetitions?: number | null; bodyMassKgAtTest?: number | null; equipment?: string | null; romStandard?: string | null; dataQuality?: string | null };

export function StrengthCatalogSelectionPreview({ context }: { context: ReturnType<typeof getStrengthCatalogSelectionContext> }) {
  return <div className="strength-selected-exercise" aria-live="polite"><strong>{context.exerciseName}</strong><span>Primary: {context.primaryMuscles.join(" · ")}{context.supportingMuscles.length ? ` · Supporting: ${context.supportingMuscles.join(" · ")}` : ""}</span><small>{context.domainLabels.length ? `Recorded context: ${context.domainLabels.join(" · ")}` : "Recorded context unavailable"}</small><small>{context.boundary}</small></div>;
}

export function StrengthLoadInput({ weightUnit, value, requiresLoad, onChange }: { weightUnit: DisplayWeightUnit; value: string; requiresLoad: boolean; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Load in {weightUnitLabel(weightUnit)} {requiresLoad ? "· required" : "· optional"}</span><input aria-label={`Load in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={requiresLoad ? `Enter ${weightUnit}` : "Optional"} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

export function StrengthBodyMassInput({ weightUnit, value, onChange }: { weightUnit: DisplayWeightUnit; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Body mass at test ({weightUnit})</span><input aria-label={`Body mass at test in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>;
}

function StrengthRegionRecordDetail({ region, observations, onClose, weightUnit }: { region: StrengthRegionDefinition; observations: StrengthObservationRecord[]; onClose: () => void; weightUnit: DisplayWeightUnit }) {
  const records = observations.filter((observation) => resolveStrengthObservationRoute(observation.exerciseName)?.regionIds.includes(region.id));
  const utils = trpc.useUtils();
  const [bodyMassEntry, setBodyMassEntry] = useState("");
  const setObservationBodyMass = trpc.strengthGenome.setObservationBodyMass.useMutation({ onSuccess: async () => { emitInteractionFeedback([10, 30, 10]); setBodyMassEntry(""); toast.success("Test body mass saved. Your recorded ratio is ready."); await Promise.all([utils.strengthGenome.observations.invalidate(), utils.strengthGenome.overview.invalidate()]); }, onError: () => toast.error("Could not save test body mass. Check your connection and try again.") });
  const latestRecord = records[0];
  const bodyMassRatio = latestRecord?.loadKg != null && latestRecord.bodyMassKgAtTest != null && latestRecord.bodyMassKgAtTest > 0 ? latestRecord.loadKg / latestRecord.bodyMassKgAtTest : null;
  const parsedBodyMassEntry = Number(bodyMassEntry);
  return <section className="strength-region-record-detail" aria-label={`${region.label} recorded strength context`}><div className="strength-region-record-heading"><div><p className="metric-label">Regional record</p><h2>{region.label}</h2></div><button type="button" onClick={() => { emitInteractionFeedback(); onClose(); }} className="strength-region-close" aria-label={`Close ${region.label} detail`}><X className="h-4 w-4" /></button></div>{latestRecord ? <article className="strength-region-record-card"><span className="strength-region-test-name">{latestRecord.exerciseName}</span>{bodyMassRatio != null ? <><b className="strength-body-mass-ratio">{bodyMassRatio.toFixed(2)}×</b><span className="strength-ratio-label">Recorded load / test body mass</span></> : <form className="strength-ratio-entry" onSubmit={(event) => { event.preventDefault(); if (Number.isFinite(parsedBodyMassEntry) && parsedBodyMassEntry > 0) setObservationBodyMass.mutate({ observationId: Number(latestRecord.id), bodyMassKgAtTest: displayWeightToKilograms(parsedBodyMassEntry, weightUnit) }); }}><label><span>Body mass on test day ({weightUnit})</span><input aria-label={`Body mass on test day in ${weightUnitLabel(weightUnit)}`} inputMode="decimal" value={bodyMassEntry} onChange={(event) => setBodyMassEntry(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={weightUnit === "lb" ? "e.g. 180" : "e.g. 82"} /></label><button type="submit" disabled={!Number.isFinite(parsedBodyMassEntry) || parsedBodyMassEntry <= 0 || setObservationBodyMass.isPending}>{setObservationBodyMass.isPending ? "Saving" : "Calculate ratio"}</button></form>}<span className="strength-region-test-meta">{latestRecord.loadKg != null ? formatDisplayWeight(latestRecord.loadKg, weightUnit) : "No load"}{latestRecord.repetitions ? ` · ${latestRecord.repetitions} reps` : ""} · {new Date(latestRecord.observedAt).toLocaleDateString()}</span></article> : <p className="strength-region-record-empty">No recorded test for this region yet.</p>}<details className="strength-region-boundary"><summary>About this rating</summary><p>This is your recorded lift relative to the body mass logged with that same test. A percentile, universal rank, and regional force score are not shown without a matching validated reference.</p></details></section>;
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

const dataQualityOptions: { value: ObservationDataQuality; label: string }[] = [
  { value: "SELF_REPORTED", label: "Self-reported" },
  { value: "STANDARDIZED", label: "Standardized setup" },
  { value: "VERIFIED", label: "Verified result" },
  { value: "UNCERTAIN", label: "Setup uncertain" },
];

export function StrengthGenomePanel({ onOpenTraining = () => {}, weightUnit = "lb", defaultTestingDetailOpen = false }: { onOpenTraining?: () => void; weightUnit?: DisplayWeightUnit; defaultTestingDetailOpen?: boolean }) {
  const utils = trpc.useUtils();
  const overview = trpc.strengthGenome.overview.useQuery();
  const observations = trpc.strengthGenome.observations.useQuery();
  const priorities = trpc.strengthGenome.priorities.useQuery();
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [measurementType, setMeasurementType] = useState<MeasurementType>("MEASURED_1RM");
  const [loadKg, setLoadKg] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [observedDate, setObservedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bodyMassKg, setBodyMassKg] = useState("");
  const [equipment, setEquipment] = useState("");
  const [romStandard, setRomStandard] = useState("");
  const [techniqueVariant, setTechniqueVariant] = useState("");
  const [tempo, setTempo] = useState("");
  const [laterality, setLaterality] = useState<"BILATERAL" | "LEFT" | "RIGHT">("BILATERAL");
  const [externalAssistance, setExternalAssistance] = useState("");
  const [dataQuality, setDataQuality] = useState<ObservationDataQuality>("SELF_REPORTED");
  const [notes, setNotes] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(defaultTestingDetailOpen);
  const [selectedRegion, setSelectedRegion] = useState<StrengthRegionDefinition | null>(null);
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
      setNotes("");
      toast.success("Performance observation saved. Your Strength Genome will update only when calibrated evidence supports it.");
    },
  });

  const parsedLoad = useMemo(() => Number(loadKg), [loadKg]);
  const parsedRepetitions = useMemo(() => Number(repetitions), [repetitions]);
  const parsedBodyMass = useMemo(() => Number(bodyMassKg), [bodyMassKg]);
  const needsLoad = ["MEASURED_1RM", "MULTI_REP"].includes(measurementType);
  const exerciseMatches = useMemo(() => exercises.filter((exercise) => exercise.name.toLowerCase().includes(exerciseSearch.trim().toLowerCase())).slice(0, 8), [exerciseSearch]);
  const selectedExerciseContext = useMemo(() => selectedExercise ? getStrengthCatalogSelectionContext(selectedExercise) : null, [selectedExercise]);
  const canSave = Boolean(selectedExercise) && (!needsLoad || (Number.isFinite(parsedLoad) && parsedLoad >= 0));
  const recentObservations = observations.data?.slice(0, 4) || [];
  const regionOverview = (regionId: string) => overview.data?.regions.find(region => region.id === regionId);
  const activePriorityIds = new Set(priorities.data?.map(priority => priority.regionId) || overview.data?.athleteConfirmedPriorityRegionIds || []);
  const setPriority = trpc.strengthGenome.setPriority.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.strengthGenome.overview.invalidate(), utils.strengthGenome.priorities.invalidate()]);
    },
  });

  const submit = () => {
    if (!canSave || !observedDate) return;
    addObservation.mutate({
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
      notes: notes.trim() || undefined,
    });
  };

  return <section className="space-y-5">
    <div className="view-header">
      <div>
        <p className="metric-label">Personal performance profile</p>
        <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#102947]">Your Strength<br /><em className="text-[#2d6cdf]">Genome.</em></h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#53718d]">Build a dated record of standardized lifts and tests. Strength regions appear only when Sports Genome has an evidence-calibrated mapping and a matching reference population.</p>
      </div>
      <div className="view-header-note"><ShieldCheck className="h-5 w-5 text-[#2d6cdf]" /><p>Performance observations, estimate confidence, and population comparison stay separate—never one generic score.</p></div>
    </div>

      <section className="light-panel overflow-hidden p-0">
      <div className="border-b border-[#d5e3ef] bg-[#f5faff] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="metric-label">Strength profile state</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[#102947]">{overview.data?.observationCount ? "Test context recorded" : "Build your baseline"}</h2></div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#c8d9e8] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#42647f]"><CircleHelp className="h-3.5 w-3.5" /> Observation routing only</span>
        </div>
      </div>
      <StrengthGenomeBodyMap regions={strengthRegionDefinitions.map((region) => ({ ...region, state: regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT" ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const }))} activePriorityIds={activePriorityIds} selectedRegionId={selectedRegion?.id} onSelect={(region) => { emitInteractionFeedback(); setSelectedRegion(region); }} />
      {selectedRegion && <StrengthRegionRecordDetail region={selectedRegion} observations={(observations.data || []) as StrengthObservationRecord[]} onClose={() => setSelectedRegion(null)} weightUnit={weightUnit} />}
      {selectedRegion && <div className="strength-region-focus-row"><p><strong>Planning focus</strong> Optional. Does not change this day automatically.</p><div><button type="button" onClick={() => { emitInteractionFeedback(); onOpenTraining(); }} className="strength-focus-secondary">Review training</button><button type="button" disabled={setPriority.isPending} onClick={() => { emitInteractionFeedback(); setPriority.mutate({ regionId: selectedRegion.id, active: !activePriorityIds.has(selectedRegion.id) }); }} className={`strength-focus-primary ${activePriorityIds.has(selectedRegion.id) ? "is-active" : ""}`}>{activePriorityIds.has(selectedRegion.id) ? "Focused" : "Set focus"}</button></div></div>}
      <div className="strength-observation-summary"><strong>{overview.data?.observationCount || 0} saved</strong><span>{overview.data?.nextAction || "Add a result to build your record."}</span></div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="dark-panel p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="metric-label !text-[#9eb3cb]">Add a performance test</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Log a lift.</h2><p className="mt-3 max-w-xl text-xs leading-5 text-[#c3d3e4]">Start with the result you already know. Test date and measurement context remain attached to the private performance record.</p></div><Dumbbell className="h-7 w-7 shrink-0 text-[#f2c14d]" /></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Choose exercise</span><input aria-label="Search and choose a catalog exercise" value={exerciseSearch} onChange={(event) => { setExerciseSearch(event.target.value); setSelectedExercise(null); setExerciseName(""); }} placeholder="Search catalog, then select" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>{exerciseSearch.trim() && !selectedExercise && <div className="strength-exercise-picker" role="listbox" aria-label="Catalog exercise results">{exerciseMatches.length ? exerciseMatches.map((exercise) => <button type="button" role="option" key={exercise.id} onClick={() => { emitInteractionFeedback(); setSelectedExercise(exercise); setExerciseName(exercise.name); setExerciseSearch(exercise.name); }}><strong>{exercise.name}</strong><span>{exercise.primaryMuscles.join(" · ")}</span></button>) : <p>No matching catalog exercise.</p>}</div>}{selectedExerciseContext && <StrengthCatalogSelectionPreview context={selectedExerciseContext} />}</div>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Measurement</span><select value={measurementType} onChange={(event) => setMeasurementType(event.target.value as MeasurementType)} className="h-12 rounded-xl border border-white/20 bg-[#102947] px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30">{measurementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Test date</span><input type="date" value={observedDate} onChange={(event) => setObservedDate(event.target.value)} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <StrengthLoadInput weightUnit={weightUnit} value={loadKg} requiresLoad={needsLoad} onChange={setLoadKg} />
          {measurementType === "MULTI_REP" && <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Repetitions</span><input inputMode="numeric" value={repetitions} onChange={(event) => setRepetitions(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Enter reps" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>}
        </div>
        <button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-[#9fc8f4] hover:text-white">{advancedOpen ? "Hide" : "Show"} testing detail</button>
        {advancedOpen && <div className="mt-3 grid gap-3 border-l-2 border-[#f2c14d] pl-3 sm:grid-cols-2">
          <StrengthBodyMassInput weightUnit={weightUnit} value={bodyMassKg} onChange={setBodyMassKg} />
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Data quality</span><select value={dataQuality} onChange={(event) => setDataQuality(event.target.value as ObservationDataQuality)} className="h-11 rounded-xl border border-white/20 bg-[#102947] px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30">{dataQualityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Laterality</span><select value={laterality} onChange={(event) => setLaterality(event.target.value as typeof laterality)} className="h-11 rounded-xl border border-white/20 bg-[#102947] px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30"><option value="BILATERAL">Bilateral</option><option value="LEFT">Left</option><option value="RIGHT">Right</option></select></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Equipment</span><input value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="e.g. barbell, rack" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Range or test standard</span><input value={romStandard} onChange={(event) => setRomStandard(event.target.value)} placeholder="e.g. full depth" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Variation / technique</span><input value={techniqueVariant} onChange={(event) => setTechniqueVariant(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Tempo</span><input value={tempo} onChange={(event) => setTempo(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Assistance / support</span><input value={externalAssistance} onChange={(event) => setExternalAssistance(event.target.value)} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5 sm:col-span-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Context note</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context for this result" className="min-h-20 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <p className="sm:col-span-2 text-xs leading-5 text-[#c3d3e4]">These fields preserve test context for your own future comparison. They do not create a body-mass ratio, universal estimate, tier, or population comparison.</p>
        </div>}
        <button type="button" disabled={!canSave || addObservation.isPending} onClick={submit} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#e4512e] px-4 text-[11px] font-bold uppercase tracking-[.12em] text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> {addObservation.isPending ? "Saving observation" : "Save performance observation"}</button>
      </section>

      <aside className="light-panel p-5"><p className="metric-label">Recent observations</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[#102947]">Performance log</h2>{recentObservations.length ? <div className="mt-4 divide-y divide-[#d9e5ef]">{recentObservations.map((observation) => <div key={observation.id} className="py-3 first:pt-0"><p className="text-sm font-bold text-[#153b61]">{observation.exerciseName}</p><p className="mt-1 text-[11px] text-[#607b91]">{observation.measurementType.replace(/_/g, " ")} · {new Date(observation.observedAt).toLocaleDateString()}</p></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#c7d8e6] bg-[#f8fbff] p-4"><Activity className="h-5 w-5 text-[#2d6cdf]" /><p className="mt-3 text-sm font-bold text-[#153b61]">No performance data yet</p><p className="mt-1 text-xs leading-5 text-[#607b91]">One standardized result begins your private performance history. No regional strength tier is shown until supporting evidence is available.</p></div>}</aside>
    </div>
  </section>;
}
