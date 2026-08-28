import { useMemo, useState } from "react";
import { Activity, ChevronRight, CircleHelp, Dumbbell, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { strengthRegionDefinitions, type StrengthRegionDefinition } from "../../../shared/strengthGenomeDefinitions";
import { StrengthGenomeBodyMap } from "@/components/StrengthGenomeBodyMap";
import { resolveStrengthObservationRoute } from "../../../shared/strengthGenomeDefinitions";

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

function StrengthRegionRecordDetail({ region, observations }: { region: StrengthRegionDefinition; observations: StrengthObservationRecord[] }) {
  const records = observations.filter((observation) => resolveStrengthObservationRoute(observation.exerciseName)?.regionIds.includes(region.id));
  return <section className="strength-region-record-detail"><div><p className="metric-label">Recorded observation context</p><h2>{region.label} <em>records.</em></h2></div>{records.length ? <div className="strength-region-record-list">{records.slice(0, 4).map((record) => { const bodyMassRatio = record.loadKg != null && record.bodyMassKgAtTest != null && record.bodyMassKgAtTest > 0 ? record.loadKg / record.bodyMassKgAtTest : null; return <article key={record.id}><strong>{record.exerciseName}</strong><span>{new Date(record.observedAt).toLocaleDateString()} · {record.measurementType.replace(/_/g, " ")}</span><span>{record.loadKg != null ? `${record.loadKg} kg` : "No load recorded"}{record.repetitions ? ` · ${record.repetitions} reps` : ""}{record.equipment ? ` · ${record.equipment}` : ""}</span>{bodyMassRatio != null ? <b className="strength-body-mass-ratio">{bodyMassRatio.toFixed(2)}× <small>recorded load / test body mass</small></b> : <small className="strength-body-mass-missing">Add body mass from this test to show a relative load ratio.</small>}</article>; })}</div> : <p className="strength-region-record-empty">No routed athlete record for this region yet. Add a standardized test to preserve its raw result and setup.</p>}<div className="strength-region-reference-boundary"><strong>Reference context unavailable.</strong> Sports Genome has not connected a reviewed, matching population reference for this region and test setup, so no percentile or strength rank is shown.</div></section>;
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

export function StrengthGenomePanel({ onOpenTraining = () => {} }: { onOpenTraining?: () => void }) {
  const utils = trpc.useUtils();
  const overview = trpc.strengthGenome.overview.useQuery();
  const observations = trpc.strengthGenome.observations.useQuery();
  const priorities = trpc.strengthGenome.priorities.useQuery();
  const [exerciseName, setExerciseName] = useState("");
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<StrengthRegionDefinition | null>(null);
  const addObservation = trpc.strengthGenome.addObservation.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.strengthGenome.overview.invalidate(),
        utils.strengthGenome.observations.invalidate(),
      ]);
      setExerciseName("");
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
  const canSave = Boolean(exerciseName.trim()) && (!needsLoad || (Number.isFinite(parsedLoad) && parsedLoad >= 0));
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
      loadKg: Number.isFinite(parsedLoad) && loadKg !== "" ? parsedLoad : undefined,
      repetitions: Number.isFinite(parsedRepetitions) && repetitions !== "" ? parsedRepetitions : undefined,
      measuredOneRmKg: measurementType === "MEASURED_1RM" && Number.isFinite(parsedLoad) ? parsedLoad : undefined,
      bodyMassKgAtTest: Number.isFinite(parsedBodyMass) && bodyMassKg !== "" ? parsedBodyMass : undefined,
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
      <StrengthGenomeBodyMap regions={strengthRegionDefinitions.map((region) => ({ ...region, state: regionOverview(region.id)?.state === "OBSERVED_TEST_CONTEXT" ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const }))} activePriorityIds={activePriorityIds} selectedRegionId={selectedRegion?.id} onSelect={setSelectedRegion} />
      {selectedRegion && <div className="border-t border-[#d5e3ef] bg-[#f8fbff] px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="metric-label">Regional detail / no score yet</p><h3 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[#102947]">{selectedRegion.label}</h3><p className="mt-3 max-w-2xl text-xs leading-5 text-[#5b758c]">{regionOverview(selectedRegion.id)?.message || selectedRegion.description} Sports Genome has not assigned a regional strength rank because the required calibration and matching reference data are not yet available.</p></div><button type="button" onClick={() => setSelectedRegion(null)} className="min-h-10 rounded-xl border border-[#c8d9e8] bg-white px-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#365b7e] hover:border-[#2d6cdf] hover:text-[#2d6cdf]">Close detail</button></div><div className="mt-4 border-l-2 border-[#f2c14d] pl-3 text-xs leading-5 text-[#4d6c86]"><strong className="text-[#153b61]">Next useful data:</strong> add a standardized, repeatable performance test with its date and setup. This records the observation; it does not claim direct regional muscle-force measurement.</div></div>}
      {selectedRegion && <div className="border-t border-[#d5e3ef] bg-white px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="metric-label">Athlete-confirmed training focus</p><p className="mt-1 text-xs leading-5 text-[#5b758c]">Choose this only if you want your planning conversations to prioritize {selectedRegion.label.toLowerCase()}. It is your stated focus, not an inferred weakness, score, or diagnosis.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onOpenTraining} className="min-h-11 rounded-xl border border-[#c8d9e8] bg-white px-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#365b7e] hover:border-[#2d6cdf] hover:text-[#2d6cdf]">Review in Training Day</button><button type="button" disabled={setPriority.isPending} onClick={() => setPriority.mutate({ regionId: selectedRegion.id, active: !activePriorityIds.has(selectedRegion.id) })} className={`min-h-11 rounded-xl px-3 text-[10px] font-bold uppercase tracking-[.1em] transition disabled:opacity-50 ${activePriorityIds.has(selectedRegion.id) ? "border border-[#c8d9e8] bg-white text-[#365b7e]" : "bg-[#e4512e] text-white hover:bg-[#c84323]"}`}>{activePriorityIds.has(selectedRegion.id) ? "Remove focus" : "Set as my focus"}</button></div></div><p className="mt-3 text-[10px] leading-4 text-[#668198]">This opens planning for your review. It does not automatically change your workout or prescribe a correction.</p></div>}
      <div className="border-t border-[#d5e3ef] bg-white px-5 py-4 text-xs leading-5 text-[#5b758c]"><strong className="text-[#153b61]">{overview.data?.observationCount || 0} observations saved.</strong> {overview.data?.nextAction || "Loading your Strength Genome state…"}</div>
    </section>

    {selectedRegion && <StrengthRegionRecordDetail region={selectedRegion} observations={(observations.data || []) as StrengthObservationRecord[]} />}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="dark-panel p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="metric-label !text-[#9eb3cb]">Add a performance test</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Log a lift.</h2><p className="mt-3 max-w-xl text-xs leading-5 text-[#c3d3e4]">Start with the result you already know. Test date and measurement context remain attached to the private performance record.</p></div><Dumbbell className="h-7 w-7 shrink-0 text-[#f2c14d]" /></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 sm:col-span-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Exercise or test</span><input value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} placeholder="e.g. Barbell back squat" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Measurement</span><select value={measurementType} onChange={(event) => setMeasurementType(event.target.value as MeasurementType)} className="h-12 rounded-xl border border-white/20 bg-[#102947] px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30">{measurementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Test date</span><input type="date" value={observedDate} onChange={(event) => setObservedDate(event.target.value)} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Load in kilograms {needsLoad ? "· required" : "· optional"}</span><input inputMode="decimal" value={loadKg} onChange={(event) => setLoadKg(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={needsLoad ? "Enter load" : "Optional"} className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
          {measurementType === "MULTI_REP" && <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Repetitions</span><input inputMode="numeric" value={repetitions} onChange={(event) => setRepetitions(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Enter reps" className="h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>}
        </div>
        <button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-[#9fc8f4] hover:text-white">{advancedOpen ? "Hide" : "Show"} testing detail</button>
        {advancedOpen && <div className="mt-3 grid gap-3 border-l-2 border-[#f2c14d] pl-3 sm:grid-cols-2">
          <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9eb3cb]">Body mass at test (kg)</span><input inputMode="decimal" value={bodyMassKg} onChange={(event) => setBodyMassKg(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="Optional" className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-[#829ab3] focus:border-[#5b9cf1] focus:ring-2 focus:ring-[#5b9cf1]/30" /></label>
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
