import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Gauge, Scale, Sparkles, Target, UserRound } from "lucide-react";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import "@/athlete-baseline-quiz.css";

export type AthleteExperience = "Beginner" | "Intermediate" | "Advanced";
export type WeightUnit = "lb" | "kg";
export type AthleteBaseline = { preferredName?: string; experience: AthleteExperience; bodyWeight?: number; weightUnit: WeightUnit };
export type AthleteQuizSelection = { goal: TrainingGoal; trainingDays: number; sportId: string; stackMode: "suggested" | "custom"; baseline: AthleteBaseline };

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
const totalSteps = 8;

export function boundedQuizStep(value: number) {
  return Math.max(0, Math.min(totalSteps - 1, value));
}

function haptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

function sportLabel(profile: SportProfile) {
  return profile.label === "American football" ? "Football" : profile.label === "Brazilian jiu-jitsu" ? "BJJ" : profile.label === "Olympic weightlifting" ? "Weightlifting" : profile.label;
}

export function AthleteBaselineQuiz({ sports, onComplete }: { sports: SportProfile[]; onComplete: (selection: AthleteQuizSelection) => void }) {
  const [step, setStep] = useState(0);
  const [preferredName, setPreferredName] = useState("");
  const [experience, setExperience] = useState<AthleteExperience>("Intermediate");
  const [goal, setGoal] = useState<TrainingGoal>("Muscle growth");
  const [sportId, setSportId] = useState("");
  const [trainingDays, setTrainingDays] = useState(3);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [bodyWeightText, setBodyWeightText] = useState("");
  const selectedSport = useMemo(() => sports.find((sport) => sport.id === sportId), [sports, sportId]);
  const evidenceNote = [
    ["PROGRAM EFFECT", "The selected bias changes the default repetition, effort, and rest planning language."],
    ["TRANSFER BOUNDARY", "Gym work can develop shared physical qualities; it does not replace technical sport practice."],
    ["RECOVERY RULE", "Weekly frequency is a scheduling input. It is not a measured readiness score."],
    ["PROFILE CONTROL", "Identity information personalizes the workspace and never changes a training-quality score."],
    ["PROGRESSION LENS", "Experience changes explanation and exercise complexity, not the value of the athlete."],
    ["DISPLAY SETTING", "Units format information and can be changed from the athlete profile."],
    ["OPTIONAL CONTEXT", "Bodyweight is optional planning context and is never used as a health or worth judgement."],
    ["DRAFT STATUS", "This preview is a draft. The athlete retains control over every prescription and day."],
  ][step];

  const move = (next: number) => {
    haptic(next > step ? 12 : 8);
    setStep(boundedQuizStep(next));
  };
  const choose = <T,>(setter: (value: T) => void, value: T) => { setter(value); haptic(7); };
  const finish = (stackMode: "suggested" | "custom") => {
    const parsedWeight = Number(bodyWeightText);
    haptic([10, 28, 12]);
    onComplete({ goal, trainingDays, sportId, stackMode, baseline: { preferredName: preferredName.trim() || undefined, experience, weightUnit, bodyWeight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined } });
  };

  const progress = Math.round(((step + 1) / totalSteps) * 100);
  const navigation = (canContinue = true, label = "Continue") => <div className="athlete-quiz-actions"><button type="button" onClick={() => move(step - 1)} disabled={step === 0} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" disabled={!canContinue} onClick={() => move(step + 1)} className="athlete-quiz-next">{label}<ArrowRight className="h-4 w-4" /></button></div>;

  return <div className="athlete-quiz-shell">
    <div className="athlete-quiz-grid" />
    <header className="athlete-quiz-header"><div className="athlete-quiz-brand"><img src="/manus-storage/gym-optimizer-logo_32341cfa.png" alt="Gym Optimizer logo" /><span>Gym Optimizer</span></div><div className="athlete-quiz-progress" aria-label={`Step ${step + 1} of ${totalSteps}`}><span>Step {step + 1} / {totalSteps}</span><div className="athlete-quiz-progress-track"><i style={{ width: `${progress}%` }} /></div></div></header>
    <main className="athlete-quiz-main"><section className="athlete-quiz-stage" key={step}>
      <div className="athlete-quiz-techline" aria-hidden="true"><span>CALIBRATION FIELD</span><i /><b>01</b><b>02</b><b>03</b><b>04</b></div>
      <div className="athlete-evidence-note"><span>{evidenceNote[0]}</span><p>{evidenceNote[1]}</p><i>INPUT → PROGRAMMING OUTPUT</i></div>
      {step === 0 && <><div className="athlete-quiz-callout"><Target className="h-5 w-5" /><span>First, set the quality your training should express.</span></div><p className="athlete-quiz-kicker">01 / program bias / editable</p><h1>What should your<br /><em>next block build?</em></h1><p className="athlete-quiz-copy">This sets the first programming bias. Every recommendation stays editable as your training context changes.</p><div className="athlete-quiz-option-list">{goals.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => choose(setGoal, item.value)} className={`athlete-choice ${goal === item.value ? "athlete-choice-selected" : ""}`}><Icon className="h-5 w-5" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{goal === item.value && <Check className="h-5 w-5" />}</button>; })}</div>{navigation()}</>}
      {step === 1 && <><p className="athlete-quiz-kicker">02 / movement context / sport transfer</p><h1>Where do you<br /><em>want to perform?</em></h1><p className="athlete-quiz-copy">Choose a sport to load its movement context, tissue demands, and transferable gym qualities. You can switch it later.</p><div className="athlete-sport-grid">{sports.map((sport, index) => <button key={sport.id} onClick={() => choose(setSportId, sport.id)} className={`athlete-sport-choice ${sportId === sport.id ? "athlete-sport-choice-selected" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{sportLabel(sport)}</strong><small>{sport.movementFamilies.length} movement families</small></button>)}</div>{navigation(Boolean(sportId))}</>}
      {step === 2 && <><p className="athlete-quiz-kicker">03 / availability constraint / recovery</p><h1>How many days<br /><em>can you recover for?</em></h1><p className="athlete-quiz-copy">Choose the weekly rhythm you can sustain. The split adapts around exposure and recovery spacing.</p><div className="athlete-schedule-grid">{scheduleOptions.map((days) => <button key={days} onClick={() => choose(setTrainingDays, days)} className={`athlete-schedule-choice ${trainingDays === days ? "athlete-schedule-choice-selected" : ""}`}><strong>{days}</strong><span>days / week</span><small>{days <= 2 ? "Focused" : days <= 4 ? "Progressive" : "High exposure"}</small></button>)}</div>{navigation()}</>}
      {step === 3 && <><p className="athlete-quiz-kicker">04 / athlete profile / optional</p><h1>What should we<br /><em>call you?</em></h1><p className="athlete-quiz-copy">Use any name or nickname you want to see in your plan. It is optional and editable later.</p><label className="athlete-name-field"><UserRound className="h-5 w-5" /><input autoFocus value={preferredName} onChange={(event) => setPreferredName(event.target.value)} maxLength={36} placeholder="Enter your name" /></label>{navigation(true, preferredName.trim() ? "Continue" : "Skip for now")}</>}
      {step === 4 && <><p className="athlete-quiz-kicker">05 / progression context / adjustable</p><h1>What&apos;s your<br /><em>training experience?</em></h1><p className="athlete-quiz-copy">This changes how the app explains progression and exercise complexity. It does not rate your ability or health.</p><div className="athlete-quiz-option-list">{experiences.map((item, index) => <button key={item.value} onClick={() => choose(setExperience, item.value)} className={`athlete-choice ${experience === item.value ? "athlete-choice-selected" : ""}`}><span className="athlete-choice-index">0{index + 1}</span><span><strong>{item.value}</strong><small>{item.detail}</small></span>{experience === item.value && <Check className="h-5 w-5" />}</button>)}</div>{navigation()}</>}
      {step === 5 && <><p className="athlete-quiz-kicker">Optional measurement / units</p><h1>What units do you<br /><em>use for weight?</em></h1><p className="athlete-quiz-copy">This only formats optional profile inputs and future load displays. Change it any time.</p><div className="athlete-unit-grid">{(["kg", "lb"] as WeightUnit[]).map((unit) => <button key={unit} onClick={() => choose(setWeightUnit, unit)} className={`athlete-unit-choice ${weightUnit === unit ? "athlete-unit-choice-selected" : ""}`}><Scale className="h-9 w-9" /><strong>{unit === "kg" ? "Kilograms" : "Pounds"}</strong><small>{unit.toUpperCase()}</small></button>)}</div>{navigation()}</>}
      {step === 6 && <><p className="athlete-quiz-kicker">Optional measurement / planning context</p><h1>Want to add your<br /><em>current bodyweight?</em></h1><p className="athlete-quiz-copy">Optional and editable later. It is stored only as planning context—never as a health, body-composition, or ability score.</p><label className="athlete-weight-field"><Scale className="h-5 w-5" /><input inputMode="decimal" value={bodyWeightText} onChange={(event) => setBodyWeightText(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={`Enter weight in ${weightUnit}`} /><span>{weightUnit}</span></label><button type="button" onClick={() => { setBodyWeightText(""); move(7); }} className="athlete-quiz-skip">Skip measurement</button>{navigation()}</>}
      {step === 7 && <><p className="athlete-quiz-kicker">Plan preview / your inputs</p><h1>{preferredName.trim() ? `${preferredName.trim()}, your` : "Your"} plan is<br /><em>taking shape.</em></h1><p className="athlete-quiz-copy">This is a starting draft. Every exercise, day, set, repetition, effort, and rest choice remains editable.</p><div className="athlete-plan-preview"><div className="athlete-preview-device"><p>Gym Optimizer</p><strong>{goal}</strong><span>{selectedSport ? sportLabel(selectedSport) : "Sport context"} · {experience}</span><div><i /><i /><i /></div></div><div className="athlete-preview-stack"><div><Sparkles className="h-5 w-5" /><span>Week 1</span><strong>{trainingDays} training days</strong></div><div><Target className="h-5 w-5" /><span>First focus</span><strong>{goal}</strong></div><div><Dumbbell className="h-5 w-5" /><span>Start mode</span><strong>Suggested stack</strong></div></div></div><div className="athlete-quiz-final-actions"><button type="button" onClick={() => move(6)} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" onClick={() => finish("custom")} className="athlete-quiz-skip">Skip to builder</button><button type="button" onClick={() => finish("suggested")} className="athlete-quiz-next">Build my plan <ArrowRight className="h-4 w-4" /></button></div></>}
    </section></main>
  </div>;
}
