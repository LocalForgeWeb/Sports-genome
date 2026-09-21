import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Gauge, HeartPulse, Scale, ShieldAlert, Sparkles, Target, UserRound } from "lucide-react";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { catalogEquipment, defaultEquipmentProfile, gymAccessProfiles, type AthleteEquipmentProfile, type CatalogEquipment, type GymAccess } from "@/lib/equipmentProfile";
import { getSportModifiers } from "@/lib/hierarchicalSportModel";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";
import { SportSelect } from "@/components/SportSelect";
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
  { value: "sport", label: "I train for a sport", detail: "Loads the movement demands that sport asks for.", icon: Target },
  { value: "general", label: "General strength and resilience", detail: "No sport. Strength, capacity and body-region goals all stay available.", icon: Dumbbell },
  { value: "undecided", label: "Decide later", detail: "Skip it for now. You can pick a sport whenever you want.", icon: Sparkles },
];

/** Two questions, never merged: first what to build, then separately what to work around. */
const constraintOptions: { value: ConstraintType; label: string; detail: string }[] = [
  { value: "proactive_none", label: "Nothing right now", detail: "A proactive target. There is nothing to work around." },
  { value: "symptomatic", label: "It bothers me at the moment", detail: "Loading gets qualified, and your response gets watched." },
  { value: "recent_or_returning", label: "I am coming back from something there", detail: "Exposure gets rebuilt gradually." },
  { value: "prior_recurrent", label: "It has been a recurring issue", detail: "Repeat exposure gets kept an eye on." },
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
  const [focusTargetKey, setFocusTargetKey] = useState("");
  const [focusLaterality, setFocusLaterality] = useState<Laterality>("bilateral");
  const [constraintType, setConstraintType] = useState<ConstraintType>("proactive_none");
  const [reportedSignals, setReportedSignals] = useState<HighConsequenceSignal[]>([]);
  const [sportModifierId, setSportModifierId] = useState("");
  const [trainingDays, setTrainingDays] = useState(3);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [bodyWeightText, setBodyWeightText] = useState("");
  const [sexForReference, setSexForReference] = useState<SexForReference | undefined>(undefined);
  const [birthYearText, setBirthYearText] = useState("");
  const [gymAccess, setGymAccess] = useState<GymAccess>(defaultEquipmentProfile.gymAccess);
  const [availableEquipment, setAvailableEquipment] = useState<CatalogEquipment[]>(defaultEquipmentProfile.availableEquipment);
  const selectedSport = useMemo(() => sports.find((sport) => sport.id === sportId), [sports, sportId]);
  const sportModifiers = useMemo(() => getSportModifiers(sportId), [sportId]);
  /**
   * A topic word and one plain sentence per step. The labels used to read
   * "PROGRAM EFFECT", "TRANSFER BOUNDARY", "STACK FILTER" — the app's own
   * internal vocabulary shown to someone who has been using it for ten seconds.
   * The boundary each one states is worth keeping; the jargon was not.
   *
   * Keyed rather than positional: the step list changes with the answers, so an
   * index would hand the wrong sentence to whichever question moved.
   */
  const stepNotes: Record<StepId, [string, string]> = {
    goal: ["Your focus", "This sets where your programme leans first. Every recommendation stays editable."],
    "context-mode": ["Your context", "Sport is optional. General or undecided only switches off sport-specific demands; everything else works the same."],
    sport: ["Your sport", "Gym work builds the qualities your sport asks for. It does not replace skill practice."],
    "sport-modifier": ["Your role", "Position, event or style adjusts the lens. It is not a rating of you."],
    focus: ["Your target", "Choosing an area sets a training priority. It says nothing about injury, and it is not a diagnosis."],
    "focus-state": ["Right now", "What you want to build and what the plan works around are different things. Neither is guessed from the other."],
    schedule: ["Your week", "This is a scheduling choice, not a readiness score."],
    access: ["Your gym", "This sets a starting equipment list. You can change every item next."],
    equipment: ["Your kit", "Automatic plans use only what you have. The full catalog stays open either way."],
    name: ["Your name", "Only used to greet you in the app. Optional, and editable later."],
    experience: ["Your experience", "This changes how much the app explains, not what you are worth."],
    units: ["Your units", "This formats what you see, and you can switch any time."],
    measurements: ["About you", "All optional. None of it is a health, body-composition, or ability score."],
    preview: ["Your draft", "A starting point. Every day, set and rep stays yours to change."],
  };
  const stepIds = useMemo(() => quizStepIds(contextMode, Boolean(focusTargetKey)), [contextMode, focusTargetKey]);
  const totalSteps = stepIds.length;
  const stepId = stepIds[Math.min(step, totalSteps - 1)];
  const note = stepNotes[stepId];
  const catalogTargets = targetCatalog?.status === "connected" ? targetCatalog.targets : [];
  const selectedTarget = catalogTargets.find((target) => target.targetKey === focusTargetKey);
  const posture = resolveConstraintPosture(constraintType, reportedSignals);

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
    onComplete({ goal, trainingDays, sportId: mode === "sport" ? sportId : "", sportContextMode: mode, focus: focusTargetKey ? { targetKey: focusTargetKey, intent: "build_capacity", laterality: focusLaterality } : undefined, constraint: focusTargetKey ? { targetKey: focusTargetKey, constraintType, laterality: focusLaterality } : undefined, reportedSignals, stackMode, baseline: { preferredName: preferredName.trim() || undefined, experience, weightUnit, bodyWeight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined, equipment: { gymAccess, availableEquipment }, sportModifierId: sportModifierId || undefined, sexForReference, birthYear: Number.isFinite(parsedBirthYear) && parsedBirthYear > currentYear - 100 && parsedBirthYear <= currentYear ? parsedBirthYear : undefined } });
  };
  const navigation = (canContinue = true, label = "Continue") => <div className="athlete-quiz-actions"><button type="button" onClick={() => move(step - 1)} disabled={step === 0} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" disabled={!canContinue} onClick={() => move(step + 1)} className="athlete-quiz-next">{label}<ArrowRight className="h-4 w-4" /></button></div>;
  
  return <div className="athlete-quiz-shell">
    <div className="athlete-quiz-glow" aria-hidden="true" />
    <header className="athlete-quiz-header">
      <div className="athlete-quiz-brand"><img src={sportsGenomeAssets.circularBadge} alt="" /><span>Sports Genome</span></div>
      <p className="athlete-quiz-count">{step + 1}<i>/{totalSteps}</i></p>
    </header>
    {/* A segment per step rather than one percentage bar: the questions feel finite when
        you can see them, and each one filling in is the reward. The count is not fixed -
        answering "no sport" removes two questions, and the strip has to say so honestly. */}
    <div className="athlete-quiz-segments" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${step + 1} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, index) => <i key={index} className={index <= step ? "is-done" : ""} />)}
    </div>
    <main className="athlete-quiz-main"><section className="athlete-quiz-stage" key={stepId}>
      <p className="athlete-quiz-kicker">{note[0]}</p>
      {stepId === "goal" && <><h1>What are you<br /><em>training for?</em></h1><p className="athlete-quiz-copy">Pick the one that matters most right now. You can change it whenever your training does.</p><div className="athlete-quiz-option-list">{goals.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => choose(setGoal, item.value)} className={`athlete-choice ${goal === item.value ? "athlete-choice-selected" : ""}`}><Icon className="h-5 w-5" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{goal === item.value && <Check className="h-5 w-5" />}</button>; })}</div><p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "context-mode" && <><h1>Do you train<br /><em>for a sport?</em></h1><p className="athlete-quiz-copy">All three are complete answers. Saying no keeps every strength, capacity and body-region goal available.</p><div className="athlete-quiz-option-list">{contextModes.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => chooseContextMode(item.value)} className={`athlete-choice ${contextMode === item.value ? "athlete-choice-selected" : ""}`}><Icon className="h-5 w-5" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{contextMode === item.value && <Check className="h-5 w-5" />}</button>; })}</div><p className="athlete-quiz-note">{note[1]}</p>{navigation(Boolean(contextMode))}</>}
      {stepId === "sport" && <><h1>What&apos;s your<br /><em>sport?</em></h1><p className="athlete-quiz-copy">This loads the movement demands your sport actually asks for.</p><SportSelect sports={sports} value={sportId} labelFor={sportLabel} onChange={(id) => { choose(setSportId, id); setSportModifierId(""); }} /><p className="athlete-quiz-note">{note[1]}</p>{navigation(Boolean(sportId))}</>}
      {stepId === "sport-modifier" && <><h1>Any particular<br /><em>role or event?</em></h1><p className="athlete-quiz-copy">Optional. It sharpens the movement demands for your specific role.</p>{sportModifiers.length ? <div className="athlete-quiz-option-list"><button onClick={() => choose(setSportModifierId, "")} className={`athlete-choice ${!sportModifierId ? "athlete-choice-selected" : ""}`}><span><strong>General {selectedSport ? sportLabel(selectedSport) : "sport"} profile</strong><small>Use the broad sport demand model.</small></span>{!sportModifierId && <Check className="h-5 w-5" />}</button>{sportModifiers.map((item) => <button key={item.id} onClick={() => choose(setSportModifierId, item.id)} className={`athlete-choice ${sportModifierId === item.id ? "athlete-choice-selected" : ""}`}><span><strong>{item.label}</strong><small>{item.emphasis.join(" · ")}</small></span>{sportModifierId === item.id && <Check className="h-5 w-5" />}</button>)}</div> : <div className="athlete-quiz-empty"><strong>General profile selected.</strong><p>This sport currently uses its broad evidence-bounded demand model.</p></div>}<p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "focus" && <><h1>Anything you<br /><em>want to build up?</em></h1><p className="athlete-quiz-copy">Optional. Pick an area or a task you want stronger and more tolerant. How it feels is a separate question, and only if you choose something here.</p>
        <p className="athlete-quiz-copy athlete-quiz-later">Skip it if nothing comes to mind. You can add or change this any time under <strong>Profile → Something you want stronger</strong>, which is where to go if something turns up later.</p>
        {targetCatalog?.status === "connected" && catalogTargets.length > 0 ? <>
          <div className="athlete-quiz-option-list">{catalogTargets.map((target) => <button key={target.targetKey} type="button" onClick={() => chooseFocusTarget(target.targetKey)} className={`athlete-choice ${focusTargetKey === target.targetKey ? "athlete-choice-selected" : ""}`}><span><strong>{target.name}</strong><small>{target.targetType === "functional_task" ? "Movement task" : target.region}{target.supportedRoutes.length === 0 ? " \u00b7 no reviewed routine yet" : ""}</small></span>{focusTargetKey === target.targetKey && <Check className="h-5 w-5" />}</button>)}</div>
          {selectedTarget && selectedTarget.supportedRoutes.length === 0 && <p className="athlete-quiz-copy athlete-quiz-insufficiency">No reviewed exercise routine covers {selectedTarget.name.toLowerCase()} yet. You can still set it as a priority \u2014 the plan will say what is missing instead of guessing.</p>}
          {selectedTarget?.lateralitySupported && <div className="athlete-quiz-option-list">{lateralityOptions.map((option) => <button key={option.value} type="button" onClick={() => choose(setFocusLaterality, option.value)} className={`athlete-choice ${focusLaterality === option.value ? "athlete-choice-selected" : ""}`}><span><strong>{option.label}</strong></span>{focusLaterality === option.value && <Check className="h-5 w-5" />}</button>)}</div>}
        </> : <div className="athlete-quiz-empty"><strong>Targeted areas are unavailable right now.</strong><p>{targetCatalog?.boundary || "The target catalog could not be loaded. Nothing else in your plan is affected, and you can add a focus area later from your profile."}</p></div>}
        <p className="athlete-quiz-note">{note[1]}</p>{navigation(true, focusTargetKey ? "Continue" : "Skip for now")}</>}
      {stepId === "focus-state" && <><h1>Anything going on<br /><em>there right now?</em></h1><p className="athlete-quiz-copy">Only what you tell us. Sports Genome does not diagnose anything, and picking an area never implied something was wrong with it.</p>
        <div className="athlete-quiz-option-list">{constraintOptions.map((option) => <button key={option.value} type="button" onClick={() => choose(setConstraintType, option.value)} className={`athlete-choice ${constraintType === option.value ? "athlete-choice-selected" : ""}`}><span><strong>{option.label}</strong><small>{option.detail}</small></span>{constraintType === option.value && <Check className="h-5 w-5" />}</button>)}</div>
        {constraintType !== "proactive_none" && <><p className="athlete-quiz-kicker">Any of these? Tick what applies.</p><div className="athlete-quiz-option-list">{highConsequenceSignals.map((signal) => <button key={signal.value} type="button" onClick={() => toggleSignal(signal.value)} className={`athlete-choice ${reportedSignals.includes(signal.value) ? "athlete-choice-selected" : ""}`}><HeartPulse className="h-5 w-5" /><span><strong>{signal.label}</strong></span>{reportedSignals.includes(signal.value) && <Check className="h-5 w-5" />}</button>)}</div></>}
        {posture === "withhold" && <div className="athlete-quiz-escalation" role="status"><ShieldAlert className="h-5 w-5" /><div><strong>Sports Genome will not build around this on its own.</strong><p>From what you have told us, this is worth a look from a clinician who can examine you. Your plan stays available and fully editable, but nothing here will progress loading on that area by itself, and we are not telling you what the problem is.</p></div></div>}
        <p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "schedule" && <><h1>How many days<br /><em>a week?</em></h1><p className="athlete-quiz-copy">Pick the rhythm you can actually keep. The split builds itself around it.</p><div className="athlete-schedule-grid">{scheduleOptions.map((days) => <button key={days} onClick={() => choose(setTrainingDays, days)} className={`athlete-schedule-choice ${trainingDays === days ? "athlete-schedule-choice-selected" : ""}`}><strong>{days}</strong><span>{days === 1 ? "day" : "days"}</span><small>{days <= 2 ? "Focused" : days <= 4 ? "Progressive" : "High exposure"}</small></button>)}</div><p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "access" && <><h1>Where do you<br /><em>train?</em></h1><p className="athlete-quiz-copy">This gives you a starting kit list. You will fine-tune it on the next screen.</p><div className="athlete-access-grid">{(Object.keys(gymAccessProfiles) as GymAccess[]).map((access) => <button key={access} onClick={() => chooseGymAccess(access)} className={`athlete-access-choice ${gymAccess === access ? "athlete-access-choice-selected" : ""}`}><Dumbbell className="h-5 w-5" /><span><strong>{access}</strong><small>{gymAccessProfiles[access].length} equipment categories</small></span>{gymAccess === access && <Check className="h-5 w-5" />}</button>)}</div><p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "equipment" && <><h1>What have you<br /><em>got to use?</em></h1><p className="athlete-quiz-copy">Tap anything you can get to. Plans will only use these.</p><div className="athlete-equipment-grid">{catalogEquipment.map((equipment) => <button key={equipment} onClick={() => toggleEquipment(equipment)} className={`athlete-equipment-choice ${availableEquipment.includes(equipment) ? "athlete-equipment-choice-selected" : ""}`}><Dumbbell className="h-4 w-4" /><span><strong>{equipment}</strong><small>{equipment === "Bodyweight" ? "Always available" : "Tap to change"}</small></span>{availableEquipment.includes(equipment) && <Check className="h-4 w-4" />}</button>)}</div><p className="athlete-quiz-note">{note[1]}</p>{navigation(availableEquipment.length > 0)}</>}
      {stepId === "name" && <><h1>What should we<br /><em>call you?</em></h1><p className="athlete-quiz-copy">Anything you like. Skip it if you would rather not.</p><label className="athlete-name-field"><UserRound className="h-5 w-5" /><input autoFocus value={preferredName} onChange={(event) => setPreferredName(event.target.value)} maxLength={36} placeholder="Enter your name" /></label><p className="athlete-quiz-note">{note[1]}</p>{navigation(true, preferredName.trim() ? "Continue" : "Skip for now")}</>}
      {stepId === "experience" && <><h1>How long have you<br /><em>been training?</em></h1><p className="athlete-quiz-copy">This sets how much the app explains as you go.</p><div className="athlete-quiz-option-list">{experiences.map((item, index) => <button key={item.value} onClick={() => choose(setExperience, item.value)} className={`athlete-choice ${experience === item.value ? "athlete-choice-selected" : ""}`}><span className="athlete-choice-index">0{index + 1}</span><span><strong>{item.value}</strong><small>{item.detail}</small></span>{experience === item.value && <Check className="h-5 w-5" />}</button>)}</div><p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "units" && <><h1>Pounds or<br /><em>kilograms?</em></h1><p className="athlete-quiz-copy">Switching converts anything you have already entered.</p><div className="athlete-unit-grid">{(["kg", "lb"] as WeightUnit[]).map((unit) => <button key={unit} onClick={() => chooseWeightUnit(unit)} className={`athlete-unit-choice ${weightUnit === unit ? "athlete-unit-choice-selected" : ""}`}><Scale className="h-9 w-9" /><strong>{unit === "kg" ? "Kilograms" : "Pounds"}</strong><small>{unit.toUpperCase()}</small></button>)}</div><p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "measurements" && <><h1>A few numbers,<br /><em>if you want.</em></h1><p className="athlete-quiz-copy">Entering these once means the app stops asking every time you log a lift.</p><label className="athlete-weight-field"><Scale className="h-5 w-5" /><input inputMode="decimal" value={bodyWeightText} onChange={(event) => setBodyWeightText(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={`Enter weight in ${weightUnit}`} /><span>{weightUnit}</span></label><div className="athlete-quiz-option-list"><span className="athlete-quiz-kicker">Sex (used only to match published studies)</span>{(["female", "male", "intersex", "unspecified"] as SexForReference[]).map((option) => <button key={option} type="button" onClick={() => choose(setSexForReference, option)} className={`athlete-choice ${sexForReference === option ? "athlete-choice-selected" : ""}`}><span><strong>{option === "unspecified" ? "Prefer not to say" : option.charAt(0).toUpperCase() + option.slice(1)}</strong></span>{sexForReference === option && <Check className="h-5 w-5" />}</button>)}</div><label className="athlete-weight-field"><UserRound className="h-5 w-5" /><input inputMode="numeric" value={birthYearText} onChange={(event) => setBirthYearText(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="Birth year (e.g. 1998)" /></label><button type="button" onClick={() => { setBodyWeightText(""); setSexForReference(undefined); setBirthYearText(""); move(step + 1); }} className="athlete-quiz-skip">Skip these fields</button><p className="athlete-quiz-note">{note[1]}</p>{navigation()}</>}
      {stepId === "preview" && <><h1>{preferredName.trim() ? `${preferredName.trim()}, you\u2019re` : "You\u2019re"}<br /><em>all set.</em></h1><p className="athlete-quiz-copy">Here is what we will build from. Nothing here is locked.</p>
        <div className="athlete-plan-preview">
          <div className="athlete-preview-headline"><p>Building for</p><strong>{goal}</strong><span>{contextMode === "sport" && selectedSport ? sportLabel(selectedSport) : contextMode === "general" ? "General strength and resilience" : "No sport yet"} · {experience}</span></div>
          <dl className="athlete-preview-facts">
            <div><dt>Training days</dt><dd>{trainingDays} <span>{trainingDays === 1 ? "day a week" : "days a week"}</span></dd></div>
            <div><dt>Focus</dt><dd>{contextMode === "sport" ? sportModifiers.find((item) => item.id === sportModifierId)?.label || "General profile" : selectedTarget ? selectedTarget.name : "No sport context"}</dd></div>
            <div><dt>Equipment</dt><dd>{availableEquipment.length} <span>{availableEquipment.length === 1 ? "category" : "categories"}</span></dd></div>
          </dl>
        </div>
        <div className="athlete-quiz-final-actions"><button type="button" onClick={() => move(step - 1)} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" onClick={() => finish("custom")} className="athlete-quiz-skip">Skip</button><button type="button" onClick={() => finish("suggested")} className="athlete-quiz-next">Build my plan <ArrowRight className="h-4 w-4" /></button></div></>}
    </section></main>
  </div>;
}
