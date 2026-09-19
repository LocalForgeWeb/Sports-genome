import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Gauge, HeartPulse, Scale, ShieldAlert, Sparkles, Target, UserRound } from "lucide-react";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { catalogEquipment, defaultEquipmentProfile, gymAccessProfiles, type AthleteEquipmentProfile, type CatalogEquipment, type GymAccess } from "@/lib/equipmentProfile";
import { getSportModifiers } from "@/lib/hierarchicalSportModel";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";
import {
  highConsequenceSignals,
  resolveConstraintPosture,
  type AthleteConstraintSelection,
  type AthleteFocusSelection,
  type ConstraintType,
  type HighConsequenceSignal,
  type Laterality,
  type ResilienceTargetCatalog,
  type SportContextMode,
} from "@shared/resilienceContext";
import "@/athlete-baseline-quiz.css";

export type AthleteExperience = "Beginner" | "Intermediate" | "Advanced";
export type WeightUnit = "lb" | "kg";
export type SexForReference = "female" | "male" | "intersex" | "unspecified";
export type AthleteBaseline = { preferredName?: string; experience: AthleteExperience; bodyWeight?: number; weightUnit: WeightUnit; equipment: AthleteEquipmentProfile; sportModifierId?: string; sexForReference?: SexForReference; birthYear?: number };
export type AthleteQuizSelection = {
  goal: TrainingGoal;
  trainingDays: number;
  /** Empty outside sport mode. A missing sport is a real state, never a stand-in for sport #1. */
  sportId: string;
  sportContextMode: SportContextMode;
  /** What the athlete wants to build. Absent when they skipped the optional step. */
  focus?: AthleteFocusSelection;
  /** What the plan must work around. Only ever set from what the athlete reported. */
  constraint?: AthleteConstraintSelection;
  reportedSignals: HighConsequenceSignal[];
  stackMode: "suggested" | "custom";
  baseline: AthleteBaseline;
};

export function convertBodyWeight(value: number, from: WeightUnit, to: WeightUnit) {
  if (!Number.isFinite(value) || from === to) return value;
  const converted = from === "lb" ? value * 0.45359237 : value / 0.45359237;
  return Math.round(converted * 10) / 10;
}

const goals: { value: TrainingGoal; label: string; detail: string; icon: typeof Target }[] = [
  { value: "Muscle growth", label: "Build muscle", detail: "Prioritize target-tissue work with controlled fatigue.", icon: Dumbbell },
  { value: "Max strength", label: "Get stronger", detail: "Prioritize high-force practice and bracing skill.", icon: Target },
  { value: "Capacity", label: "Build endurance", detail: "Prioritize repeatable output and work tolerance.", icon: Gauge },
  { value: "Athleticism", label: "Athleticism", detail: "Prioritize movement quality, speed, and sport transfer.", icon: Sparkles },
];
const experiences: { value: AthleteExperience; detail: string }[] = [
  { value: "Beginner", detail: "Learning the patterns and building consistency." },
  { value: "Intermediate", detail: "Training regularly with familiar lifts or movements." },
  { value: "Advanced", detail: "Comfortable managing demanding, structured training." },
];
const scheduleOptions = [1, 2, 3, 4, 5, 6, 7];

/**
 * The three context states the sport-optional contract fixes. `general` and `undecided` carry
 * no sport id; neither is a synthetic "General Fitness" sport, and neither blocks completion.
 */
const contextModes: { value: SportContextMode; label: string; detail: string; icon: typeof Target }[] = [
  { value: "sport", label: "I train for a sport", detail: "Loads that sport's movement context and demand model.", icon: Target },
  { value: "general", label: "General strength and resilience", detail: "No sport. Training, strength and body-region goals all stay available.", icon: Dumbbell },
  { value: "undecided", label: "Decide later", detail: "Skip it for now. You can pick a sport whenever you want.", icon: Sparkles },
];

/** Two questions, never merged: first what to build, then separately what to work around. */
const constraintOptions: { value: ConstraintType; label: string; detail: string }[] = [
  { value: "proactive_none", label: "Nothing right now", detail: "A proactive target. There is nothing to work around." },
  { value: "symptomatic", label: "It bothers me at the moment", detail: "The plan will qualify loading and watch your response." },
  { value: "recent_or_returning", label: "I am coming back from something there", detail: "The plan will rebuild exposure gradually." },
  { value: "prior_recurrent", label: "It has been a recurring issue", detail: "The plan will keep an eye on repeat exposure." },
  { value: "clinician_restricted", label: "A clinician has restricted what I do", detail: "Their restriction leads; the app will not work around it for you." },
];

const lateralityOptions: { value: Laterality; label: string }[] = [
  { value: "bilateral", label: "Both sides" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "unspecified", label: "Not sure" },
];

type StepId =
  | "goal" | "context-mode" | "sport" | "sport-modifier" | "focus" | "focus-state"
  | "schedule" | "access" | "equipment" | "name" | "experience" | "units" | "measurements" | "preview";

const evidenceNotes: Record<StepId, [string, string]> = {
  goal: ["PROGRAM EFFECT", "The selected bias changes default repetition, effort, and rest planning language."],
  "context-mode": ["CONTEXT STATE", "Sport is optional context, not an identity. Sport-specific demands and comparisons stay switched off until you choose a sport; everything else works either way."],
  sport: ["TRANSFER BOUNDARY", "Gym work can develop shared physical qualities; it does not replace technical sport practice."],
  "sport-modifier": ["ROLE MODIFIER", "Position, event, stroke, distance, or style sharpens the context behind your recommendations."],
  focus: ["TARGETED CAPACITY", "Choosing an area sets a positive training priority. It says nothing about injury, and it is not a diagnosis."],
  "focus-state": ["SEPARATE QUESTION", "What you want to build and what the plan must work around are different things. One is never inferred from the other."],
  schedule: ["RECOVERY RULE", "Weekly frequency sets how your plan is scheduled."],
  access: ["ACCESS PROFILE", "Automatic stacks use this availability profile; every category remains editable."],
  equipment: ["STACK FILTER", "Only selected equipment enters automatic stacks. The full catalog stays open for manual additions."],
  name: ["PROFILE CONTROL", "Identity information personalizes the workspace and never changes a training-quality score."],
  experience: ["PROGRESSION LENS", "Experience changes explanation and exercise complexity, not the value of the athlete."],
  units: ["DISPLAY SETTING", "Units format information and can be changed from the athlete profile."],
  measurements: ["OPTIONAL CONTEXT", "Bodyweight is optional planning context and is never used as a health or worth judgement."],
  preview: ["DRAFT STATUS", "This preview is a draft. The athlete retains control over every prescription and day."],
};

/** The steps actually shown, given the mode and whether a focus area was chosen. */
export function quizStepIds(mode: SportContextMode | null, hasFocus: boolean): StepId[] {
  const sportSteps: StepId[] = mode === "sport" ? ["sport", "sport-modifier"] : [];
  const focusSteps: StepId[] = hasFocus ? ["focus", "focus-state"] : ["focus"];
  return ["goal", "context-mode", ...sportSteps, ...focusSteps, "schedule", "access", "equipment", "name", "experience", "units", "measurements", "preview"];
}

export function boundedQuizStep(value: number, stepCount: number) { return Math.max(0, Math.min(stepCount - 1, value)); }
function haptic(pattern: number | number[]) { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); }
function sportLabel(profile: SportProfile) { return profile.label === "American football" ? "Football" : profile.label === "Brazilian jiu-jitsu" ? "BJJ" : profile.label === "Olympic weightlifting" ? "Weightlifting" : profile.label; }

export function AthleteBaselineQuiz({ sports, targetCatalog, onComplete }: { sports: SportProfile[]; targetCatalog?: ResilienceTargetCatalog; onComplete: (selection: AthleteQuizSelection) => void }) {
  const [step, setStep] = useState(0);
  const [preferredName, setPreferredName] = useState("");
  const [experience, setExperience] = useState<AthleteExperience>("Intermediate");
  const [goal, setGoal] = useState<TrainingGoal>("Muscle growth");
  const [contextMode, setContextMode] = useState<SportContextMode | null>(null);
  const [sportId, setSportId] = useState("");
  const [sportModifierId, setSportModifierId] = useState("");
  const [focusTargetKey, setFocusTargetKey] = useState("");
  const [focusLaterality, setFocusLaterality] = useState<Laterality>("bilateral");
  const [constraintType, setConstraintType] = useState<ConstraintType>("proactive_none");
  const [reportedSignals, setReportedSignals] = useState<HighConsequenceSignal[]>([]);
  const [trainingDays, setTrainingDays] = useState(3);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [bodyWeightText, setBodyWeightText] = useState("");
  const [sexForReference, setSexForReference] = useState<SexForReference | undefined>(undefined);
  const [birthYearText, setBirthYearText] = useState("");
  const [gymAccess, setGymAccess] = useState<GymAccess>(defaultEquipmentProfile.gymAccess);
  const [availableEquipment, setAvailableEquipment] = useState<CatalogEquipment[]>(defaultEquipmentProfile.availableEquipment);

  const selectedSport = useMemo(() => sports.find((sport) => sport.id === sportId), [sports, sportId]);
  const sportModifiers = useMemo(() => getSportModifiers(sportId), [sportId]);
  const stepIds = useMemo(() => quizStepIds(contextMode, Boolean(focusTargetKey)), [contextMode, focusTargetKey]);
  const totalSteps = stepIds.length;
  const stepId = stepIds[Math.min(step, totalSteps - 1)];
  const catalogTargets = targetCatalog?.status === "connected" ? targetCatalog.targets : [];
  const selectedTarget = catalogTargets.find((target) => target.targetKey === focusTargetKey);
  const posture = resolveConstraintPosture(constraintType, reportedSignals);
  const evidenceNote = evidenceNotes[stepId];

  const move = (next: number) => { haptic(next > step ? 12 : 8); setStep(boundedQuizStep(next, totalSteps)); };
  const choose = <T,>(setter: (value: T) => void, value: T) => { setter(value); haptic(7); };
  const chooseContextMode = (mode: SportContextMode) => {
    // Leaving sport mode clears the sport rather than keeping it as a hidden default.
    if (mode !== "sport") { setSportId(""); setSportModifierId(""); }
    setContextMode(mode);
    haptic(7);
  };
  const chooseFocusTarget = (targetKey: string) => {
    const next = targetKey === focusTargetKey ? "" : targetKey;
    setFocusTargetKey(next);
    if (!next) { setConstraintType("proactive_none"); setReportedSignals([]); }
    haptic(7);
  };
  const toggleSignal = (signal: HighConsequenceSignal) => {
    setReportedSignals((current) => current.includes(signal) ? current.filter((item) => item !== signal) : [...current, signal]);
    haptic(7);
  };
  const chooseWeightUnit = (unit: WeightUnit) => {
    if (unit === weightUnit) return haptic(7);
    const parsedWeight = Number(bodyWeightText);
    if (Number.isFinite(parsedWeight) && parsedWeight > 0) setBodyWeightText(String(convertBodyWeight(parsedWeight, weightUnit, unit)));
    setWeightUnit(unit);
    haptic(7);
  };
  const chooseGymAccess = (access: GymAccess) => { setGymAccess(access); setAvailableEquipment(gymAccessProfiles[access]); haptic(7); };
  const toggleEquipment = (equipment: CatalogEquipment) => {
    if (equipment === "Bodyweight") return;
    setAvailableEquipment((current) => current.includes(equipment) ? current.filter((item) => item !== equipment) : [...current, equipment]);
    haptic(7);
  };
  const finish = (stackMode: "suggested" | "custom") => {
    const parsedWeight = Number(bodyWeightText);
    const parsedBirthYear = Number(birthYearText);
    const currentYear = new Date().getFullYear();
    const mode: SportContextMode = contextMode ?? "undecided";
    haptic([10, 28, 12]);
    onComplete({
      goal,
      trainingDays,
      sportId: mode === "sport" ? sportId : "",
      sportContextMode: mode,
      focus: focusTargetKey ? { targetKey: focusTargetKey, intent: "build_capacity", laterality: focusLaterality } : undefined,
      constraint: focusTargetKey ? { targetKey: focusTargetKey, constraintType, laterality: focusLaterality } : undefined,
      reportedSignals,
      stackMode,
      baseline: { preferredName: preferredName.trim() || undefined, experience, weightUnit, bodyWeight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined, equipment: { gymAccess, availableEquipment }, sportModifierId: sportModifierId || undefined, sexForReference, birthYear: Number.isFinite(parsedBirthYear) && parsedBirthYear > currentYear - 100 && parsedBirthYear <= currentYear ? parsedBirthYear : undefined },
    });
  };
  const navigation = (canContinue = true, label = "Continue") => <div className="athlete-quiz-actions"><button type="button" onClick={() => move(step - 1)} disabled={step === 0} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" disabled={!canContinue} onClick={() => move(step + 1)} className="athlete-quiz-next">{label}<ArrowRight className="h-4 w-4" /></button></div>;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  return <div className="athlete-quiz-shell">
    <div className="athlete-quiz-grid" />
    <header className="athlete-quiz-header"><div className="athlete-quiz-brand"><img src={sportsGenomeAssets.circularBadge} alt="Sports Genome circular badge" /><span>Sports Genome</span></div><div className="athlete-quiz-progress" aria-label={`Step ${step + 1} of ${totalSteps}`}><span>Step {step + 1} / {totalSteps}</span><div className="athlete-quiz-progress-track"><i style={{ width: `${progress}%` }} /></div></div></header>
    <main className="athlete-quiz-main"><section className="athlete-quiz-stage" key={stepId}>
      <div className="athlete-quiz-techline" aria-hidden="true"><span>CALIBRATION FIELD</span><i /><b>01</b><b>02</b><b>03</b><b>04</b></div>
      <details className="athlete-evidence-note"><summary><span>{evidenceNote[0]}</span><small>Why this matters</small></summary><p>{evidenceNote[1]}</p><i>INPUT → PROGRAMMING OUTPUT</i></details>
      {stepId === "goal" && <><div className="athlete-quiz-callout"><Target className="h-5 w-5" /><span>First, set the quality your training should express.</span></div><p className="athlete-quiz-kicker">01 / program bias / editable</p><h1>What should your<br /><em>next block build?</em></h1><p className="athlete-quiz-copy">This sets the first programming bias. Every recommendation stays editable as your training context changes.</p><div className="athlete-quiz-option-list">{goals.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => choose(setGoal, item.value)} className={`athlete-choice ${goal === item.value ? "athlete-choice-selected" : ""}`}><Icon className="h-5 w-5" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{goal === item.value && <Check className="h-5 w-5" />}</button>; })}</div>{navigation()}</>}
      {stepId === "context-mode" && <><p className="athlete-quiz-kicker">02 / training context / editable</p><h1>Do you train<br /><em>for a sport?</em></h1><p className="athlete-quiz-copy">All three answers are complete answers. Choosing general or deciding later keeps every strength, capacity and body-region goal available; it only switches off sport-specific demands and comparisons, which need a real sport to mean anything.</p><div className="athlete-quiz-option-list">{contextModes.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => chooseContextMode(item.value)} className={`athlete-choice ${contextMode === item.value ? "athlete-choice-selected" : ""}`}><Icon className="h-5 w-5" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{contextMode === item.value && <Check className="h-5 w-5" />}</button>; })}</div>{navigation(Boolean(contextMode))}</>}
      {stepId === "sport" && <><p className="athlete-quiz-kicker">03 / movement context / sport transfer</p><h1>Where do you<br /><em>want to perform?</em></h1><p className="athlete-quiz-copy">Choose a sport to load its movement context, tissue demands, and transferable gym qualities. You can switch it later.</p><div className="athlete-sport-grid">{sports.map((sport, index) => <button key={sport.id} onClick={() => { choose(setSportId, sport.id); setSportModifierId(""); }} className={`athlete-sport-choice ${sportId === sport.id ? "athlete-sport-choice-selected" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{sportLabel(sport)}</strong><small>{sport.movementFamilies.length} movement families</small></button>)}</div>{navigation(Boolean(sportId))}</>}
      {stepId === "sport-modifier" && <><p className="athlete-quiz-kicker">04 / role or event / optional modifier</p><h1>What&apos;s your<br /><em>main context?</em></h1><p className="athlete-quiz-copy">Position, event, stroke, distance, or style adjusts the planning lens. It never predicts performance or replaces skill practice.</p>{sportModifiers.length ? <div className="athlete-quiz-option-list"><button onClick={() => choose(setSportModifierId, "")} className={`athlete-choice ${!sportModifierId ? "athlete-choice-selected" : ""}`}><span><strong>General {selectedSport ? sportLabel(selectedSport) : "sport"} profile</strong><small>Use the broad sport demand model.</small></span>{!sportModifierId && <Check className="h-5 w-5" />}</button>{sportModifiers.map((item) => <button key={item.id} onClick={() => choose(setSportModifierId, item.id)} className={`athlete-choice ${sportModifierId === item.id ? "athlete-choice-selected" : ""}`}><span><strong>{item.label}</strong><small>{item.emphasis.join(" · ")}</small></span>{sportModifierId === item.id && <Check className="h-5 w-5" />}</button>)}</div> : <div className="athlete-quiz-empty"><strong>General profile selected.</strong><p>This sport currently uses its broad evidence-bounded demand model.</p></div>}{navigation()}</>}
      {stepId === "focus" && <><p className="athlete-quiz-kicker">{contextMode === "sport" ? "05" : "03"} / targeted capacity / optional</p><h1>Anything you<br /><em>want to build up?</em></h1><p className="athlete-quiz-copy">Optional. Pick an area or a task you want stronger and more tolerant. This is a training goal, not a report of a problem — we ask about that separately, and only if you choose something here.</p>
        {targetCatalog?.status === "connected" && catalogTargets.length > 0 ? <>
          <div className="athlete-quiz-option-list">{catalogTargets.map((target) => <button key={target.targetKey} type="button" onClick={() => chooseFocusTarget(target.targetKey)} className={`athlete-choice ${focusTargetKey === target.targetKey ? "athlete-choice-selected" : ""}`}><span><strong>{target.name}</strong><small>{target.targetType === "functional_task" ? "Movement task" : target.region}{target.supportedRoutes.length === 0 ? " · no reviewed routine yet" : ""}</small></span>{focusTargetKey === target.targetKey && <Check className="h-5 w-5" />}</button>)}</div>
          {selectedTarget && selectedTarget.supportedRoutes.length === 0 && <p className="athlete-quiz-copy athlete-quiz-insufficiency">No reviewed exercise routine covers {selectedTarget.name.toLowerCase()} yet. You can still set it as a priority — the plan will say what is missing instead of guessing.</p>}
          {selectedTarget?.lateralitySupported && <div className="athlete-quiz-option-list">{lateralityOptions.map((option) => <button key={option.value} type="button" onClick={() => choose(setFocusLaterality, option.value)} className={`athlete-choice ${focusLaterality === option.value ? "athlete-choice-selected" : ""}`}><span><strong>{option.label}</strong></span>{focusLaterality === option.value && <Check className="h-5 w-5" />}</button>)}</div>}
        </> : <div className="athlete-quiz-empty"><strong>Targeted areas are unavailable right now.</strong><p>{targetCatalog?.boundary || "The target catalog could not be loaded. Nothing else in your plan is affected, and you can add a focus area later from your profile."}</p></div>}
        {navigation(true, focusTargetKey ? "Continue" : "Skip for now")}</>}
      {stepId === "focus-state" && <><p className="athlete-quiz-kicker">{contextMode === "sport" ? "06" : "04"} / current state / your report</p><h1>Anything going on<br /><em>there right now?</em></h1><p className="athlete-quiz-copy">This is only what you tell us. Sports Genome does not diagnose anything, and choosing an area above never implied something was wrong with it.</p>
        <div className="athlete-quiz-option-list">{constraintOptions.map((option) => <button key={option.value} type="button" onClick={() => choose(setConstraintType, option.value)} className={`athlete-choice ${constraintType === option.value ? "athlete-choice-selected" : ""}`}><span><strong>{option.label}</strong><small>{option.detail}</small></span>{constraintType === option.value && <Check className="h-5 w-5" />}</button>)}</div>
        {constraintType !== "proactive_none" && <><p className="athlete-quiz-kicker">Any of these? Tick what applies.</p><div className="athlete-quiz-option-list">{highConsequenceSignals.map((signal) => <button key={signal.value} type="button" onClick={() => toggleSignal(signal.value)} className={`athlete-choice ${reportedSignals.includes(signal.value) ? "athlete-choice-selected" : ""}`}><HeartPulse className="h-5 w-5" /><span><strong>{signal.label}</strong></span>{reportedSignals.includes(signal.value) && <Check className="h-5 w-5" />}</button>)}</div></>}
        {posture === "withhold" && <div className="athlete-quiz-escalation" role="status"><ShieldAlert className="h-5 w-5" /><div><strong>Sports Genome will not build around this on its own.</strong><p>From what you have told us, this is worth a look from a clinician who can examine you. Your plan stays available and fully editable, but nothing here will automatically progress loading on that area, and we are not telling you what the problem is.</p></div></div>}
        {navigation()}</>}
      {stepId === "schedule" && <><p className="athlete-quiz-kicker">availability constraint / recovery</p><h1>How many days<br /><em>can you recover for?</em></h1><p className="athlete-quiz-copy">Choose the weekly rhythm you can sustain. The split adapts around exposure and recovery spacing.</p><div className="athlete-schedule-grid">{scheduleOptions.map((days) => <button key={days} onClick={() => choose(setTrainingDays, days)} className={`athlete-schedule-choice ${trainingDays === days ? "athlete-schedule-choice-selected" : ""}`}><strong>{days}</strong><span>days / week</span><small>{days <= 2 ? "Focused" : days <= 4 ? "Progressive" : "High exposure"}</small></button>)}</div>{navigation()}</>}
      {stepId === "access" && <><p className="athlete-quiz-kicker">training environment / editable</p><h1>Where do you<br /><em>usually train?</em></h1><p className="athlete-quiz-copy">This loads a starting equipment profile for automatic stacks. You can tune every item next and edit it in About Me later.</p><div className="athlete-access-grid">{(Object.keys(gymAccessProfiles) as GymAccess[]).map((access) => <button key={access} onClick={() => chooseGymAccess(access)} className={`athlete-access-choice ${gymAccess === access ? "athlete-access-choice-selected" : ""}`}><Dumbbell className="h-5 w-5" /><span><strong>{access}</strong><small>{gymAccessProfiles[access].length} equipment categories</small></span>{gymAccess === access && <Check className="h-5 w-5" />}</button>)}</div>{navigation()}</>}
      {stepId === "equipment" && <><p className="athlete-quiz-kicker">equipment inventory / editable</p><h1>What equipment<br /><em>is available?</em></h1><p className="athlete-quiz-copy">Automatic stacks will use only these categories. You can still browse every catalog exercise and add unavailable equipment manually.</p><div className="athlete-equipment-grid">{catalogEquipment.map((equipment) => <button key={equipment} onClick={() => toggleEquipment(equipment)} className={`athlete-equipment-choice ${availableEquipment.includes(equipment) ? "athlete-equipment-choice-selected" : ""}`}><Dumbbell className="h-4 w-4" /><span><strong>{equipment}</strong><small>{equipment === "Bodyweight" ? "Always available" : "Tap to change"}</small></span>{availableEquipment.includes(equipment) && <Check className="h-4 w-4" />}</button>)}</div>{navigation(availableEquipment.length > 0)}</>}
      {stepId === "name" && <><p className="athlete-quiz-kicker">athlete profile / optional</p><h1>What should we<br /><em>call you?</em></h1><p className="athlete-quiz-copy">Use any name or nickname you want to see in your plan. It is optional and editable later.</p><label className="athlete-name-field"><UserRound className="h-5 w-5" /><input autoFocus value={preferredName} onChange={(event) => setPreferredName(event.target.value)} maxLength={36} placeholder="Enter your name" /></label>{navigation(true, preferredName.trim() ? "Continue" : "Skip for now")}</>}
      {stepId === "experience" && <><p className="athlete-quiz-kicker">progression context / adjustable</p><h1>What&apos;s your<br /><em>training experience?</em></h1><p className="athlete-quiz-copy">This changes how the app explains progression and exercise complexity. It does not rate your ability or health.</p><div className="athlete-quiz-option-list">{experiences.map((item, index) => <button key={item.value} onClick={() => choose(setExperience, item.value)} className={`athlete-choice ${experience === item.value ? "athlete-choice-selected" : ""}`}><span className="athlete-choice-index">0{index + 1}</span><span><strong>{item.value}</strong><small>{item.detail}</small></span>{experience === item.value && <Check className="h-5 w-5" />}</button>)}</div>{navigation()}</>}
      {stepId === "units" && <><p className="athlete-quiz-kicker">optional measurement / units</p><h1>What units do you<br /><em>use for weight?</em></h1><p className="athlete-quiz-copy">This only formats optional profile inputs and future load displays. Changing units converts an entered optional bodyweight. Change it any time.</p><div className="athlete-unit-grid">{(["kg", "lb"] as WeightUnit[]).map((unit) => <button key={unit} onClick={() => chooseWeightUnit(unit)} className={`athlete-unit-choice ${weightUnit === unit ? "athlete-unit-choice-selected" : ""}`}><Scale className="h-9 w-9" /><strong>{unit === "kg" ? "Kilograms" : "Pounds"}</strong><small>{unit.toUpperCase()}</small></button>)}</div>{navigation()}</>}
      {stepId === "measurements" && <><p className="athlete-quiz-kicker">optional measurement / planning context</p><h1>Want to add your<br /><em>bodyweight, sex, and birth year?</em></h1><p className="athlete-quiz-copy">All optional, and you can change any of it later in About Me. Saving it once here means Strength Genome does not have to ask every time you log a lift. None of it is a health, body-composition, or ability score.</p><label className="athlete-weight-field"><Scale className="h-5 w-5" /><input inputMode="decimal" value={bodyWeightText} onChange={(event) => setBodyWeightText(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={`Enter weight in ${weightUnit}`} /><span>{weightUnit}</span></label><div className="athlete-quiz-option-list"><span className="athlete-quiz-kicker">Sex (used only to match published studies)</span>{(["female", "male", "intersex", "unspecified"] as SexForReference[]).map((option) => <button key={option} type="button" onClick={() => choose(setSexForReference, option)} className={`athlete-choice ${sexForReference === option ? "athlete-choice-selected" : ""}`}><span><strong>{option === "unspecified" ? "Prefer not to say" : option.charAt(0).toUpperCase() + option.slice(1)}</strong></span>{sexForReference === option && <Check className="h-5 w-5" />}</button>)}</div><label className="athlete-weight-field"><UserRound className="h-5 w-5" /><input inputMode="numeric" value={birthYearText} onChange={(event) => setBirthYearText(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="Birth year (e.g. 1998)" /></label><button type="button" onClick={() => { setBodyWeightText(""); setSexForReference(undefined); setBirthYearText(""); move(step + 1); }} className="athlete-quiz-skip">Skip these fields</button>{navigation()}</>}
      {stepId === "preview" && <><p className="athlete-quiz-kicker">plan preview / your inputs</p><h1>{preferredName.trim() ? `${preferredName.trim()}, your` : "Your"} plan is<br /><em>taking shape.</em></h1><p className="athlete-quiz-copy">This is a starting draft. Every exercise, day, set, repetition, effort, and rest choice remains editable.</p><div className="athlete-plan-preview"><div className="athlete-preview-device"><p>Sports Genome</p><strong>{goal}</strong><span>{contextMode === "sport" && selectedSport ? sportLabel(selectedSport) : contextMode === "general" ? "General strength and resilience" : "No sport yet"} · {experience}</span><div><i /><i /><i /></div></div><div className="athlete-preview-stack"><div><Sparkles className="h-5 w-5" /><span>Week 1</span><strong>{trainingDays} training days</strong></div><div><Target className="h-5 w-5" /><span>Context</span><strong>{contextMode === "sport" ? sportModifiers.find((item) => item.id === sportModifierId)?.label || "General profile" : selectedTarget ? selectedTarget.name : "No sport context"}</strong></div><div><Dumbbell className="h-5 w-5" /><span>Start mode</span><strong>Available gear only</strong></div></div></div><div className="athlete-quiz-final-actions"><button type="button" onClick={() => move(step - 1)} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" onClick={() => finish("custom")} className="athlete-quiz-skip">Skip to builder</button><button type="button" onClick={() => finish("suggested")} className="athlete-quiz-next">Build my plan <ArrowRight className="h-4 w-4" /></button></div></>}
    </section></main>
  </div>;
}
