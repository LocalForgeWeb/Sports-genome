import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Gauge, Scale, Sparkles, Target, UserRound } from "lucide-react";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { catalogEquipment, defaultEquipmentProfile, gymAccessProfiles, type AthleteEquipmentProfile, type CatalogEquipment, type GymAccess } from "@/lib/equipmentProfile";
import { getSportModifiers } from "@/lib/hierarchicalSportModel";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";
import "@/athlete-baseline-quiz.css";

export type AthleteExperience = "Beginner" | "Intermediate" | "Advanced";
export type WeightUnit = "lb" | "kg";
export type SexForReference = "female" | "male" | "intersex" | "unspecified";
export type AthleteBaseline = { preferredName?: string; experience: AthleteExperience; bodyWeight?: number; weightUnit: WeightUnit; equipment: AthleteEquipmentProfile; sportModifierId?: string; sexForReference?: SexForReference; birthYear?: number };
export type AthleteQuizSelection = { goal: TrainingGoal; trainingDays: number; sportId: string; stackMode: "suggested" | "custom"; baseline: AthleteBaseline };

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
const totalSteps = 11;

export function boundedQuizStep(value: number) { return Math.max(0, Math.min(totalSteps - 1, value)); }
function haptic(pattern: number | number[]) { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); }
function sportLabel(profile: SportProfile) { return profile.label === "American football" ? "Football" : profile.label === "Brazilian jiu-jitsu" ? "BJJ" : profile.label === "Olympic weightlifting" ? "Weightlifting" : profile.label; }

export function AthleteBaselineQuiz({ sports, onComplete }: { sports: SportProfile[]; onComplete: (selection: AthleteQuizSelection) => void }) {
  const [step, setStep] = useState(0);
  const [preferredName, setPreferredName] = useState("");
  const [experience, setExperience] = useState<AthleteExperience>("Intermediate");
  const [goal, setGoal] = useState<TrainingGoal>("Muscle growth");
  const [sportId, setSportId] = useState("");
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
   */
  const stepNotes = [
    ["Your focus", "This sets where your programme leans first. Every recommendation stays editable."],
    ["Your sport", "Gym work builds the qualities your sport asks for. It does not replace skill practice."],
    ["Your role", "Position, event or style adjusts the lens. It is not a rating of you."],
    ["Your week", "This is a scheduling choice, not a readiness score."],
    ["Your gym", "This sets a starting equipment list. You can change every item next."],
    ["Your kit", "Automatic plans use only what you have. The full catalog stays open either way."],
    ["Your name", "Only used to greet you in the app. Optional, and editable later."],
    ["Your experience", "This changes how much the app explains, not what you are worth."],
    ["Your units", "This formats what you see, and you can switch any time."],
    ["About you", "All optional. None of it is a health, body-composition, or ability score."],
    ["Your draft", "A starting point. Every day, set and rep stays yours to change."],
  ][step];

  const move = (next: number) => { haptic(next > step ? 12 : 8); setStep(boundedQuizStep(next)); };
  const choose = <T,>(setter: (value: T) => void, value: T) => { setter(value); haptic(7); };
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
    haptic([10, 28, 12]);
    onComplete({ goal, trainingDays, sportId, stackMode, baseline: { preferredName: preferredName.trim() || undefined, experience, weightUnit, bodyWeight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined, equipment: { gymAccess, availableEquipment }, sportModifierId: sportModifierId || undefined, sexForReference, birthYear: Number.isFinite(parsedBirthYear) && parsedBirthYear > currentYear - 100 && parsedBirthYear <= currentYear ? parsedBirthYear : undefined } });
  };
  const navigation = (canContinue = true, label = "Continue") => <div className="athlete-quiz-actions"><button type="button" onClick={() => move(step - 1)} disabled={step === 0} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" disabled={!canContinue} onClick={() => move(step + 1)} className="athlete-quiz-next">{label}<ArrowRight className="h-4 w-4" /></button></div>;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  return <div className="athlete-quiz-shell">
    <div className="athlete-quiz-glow" aria-hidden="true" />
    <header className="athlete-quiz-header">
      <div className="athlete-quiz-brand"><img src={sportsGenomeAssets.circularBadge} alt="" /><span>Sports Genome</span></div>
      <p className="athlete-quiz-count">{step + 1}<i>/{totalSteps}</i></p>
    </header>
    {/* A segment per step rather than one percentage bar: eleven questions feel
        finite when you can see them, and each one filling in is the reward. */}
    <div className="athlete-quiz-segments" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${step + 1} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, index) => <i key={index} className={index <= step ? "is-done" : ""} />)}
    </div>
    <main className="athlete-quiz-main"><section className="athlete-quiz-stage" key={step}>
      <p className="athlete-quiz-kicker">{stepNotes[0]}</p>
      {step === 0 && <><h1>What are you<br /><em>training for?</em></h1><p className="athlete-quiz-copy">Pick the one that matters most right now. You can change it whenever your training does.</p><div className="athlete-quiz-option-list">{goals.map((item) => { const Icon = item.icon; return <button key={item.value} onClick={() => choose(setGoal, item.value)} className={`athlete-choice ${goal === item.value ? "athlete-choice-selected" : ""}`}><Icon className="h-5 w-5" /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{goal === item.value && <Check className="h-5 w-5" />}</button>; })}</div><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}</>}
      {step === 1 && <><h1>What&apos;s your<br /><em>sport?</em></h1><p className="athlete-quiz-copy">This loads the movement demands your sport actually asks for.</p><div className="athlete-sport-grid">{sports.map((sport, index) => <button key={sport.id} onClick={() => { choose(setSportId, sport.id); setSportModifierId(""); }} className={`athlete-sport-choice ${sportId === sport.id ? "athlete-sport-choice-selected" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{sportLabel(sport)}</strong><small>{sport.movementFamilies.length} movement families</small></button>)}</div><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation(Boolean(sportId))}</>}
      {step === 2 && <><h1>Any particular<br /><em>role or event?</em></h1><p className="athlete-quiz-copy">Optional. It sharpens the movement demands for your specific role.</p>{sportModifiers.length ? <div className="athlete-quiz-option-list"><button onClick={() => choose(setSportModifierId, "")} className={`athlete-choice ${!sportModifierId ? "athlete-choice-selected" : ""}`}><span><strong>General {selectedSport ? sportLabel(selectedSport) : "sport"} profile</strong><small>Use the broad sport demand model.</small></span>{!sportModifierId && <Check className="h-5 w-5" />}</button>{sportModifiers.map((item) => <button key={item.id} onClick={() => choose(setSportModifierId, item.id)} className={`athlete-choice ${sportModifierId === item.id ? "athlete-choice-selected" : ""}`}><span><strong>{item.label}</strong><small>{item.emphasis.join(" · ")}</small></span>{sportModifierId === item.id && <Check className="h-5 w-5" />}</button>)}</div> : <div className="athlete-quiz-empty"><strong>General profile selected.</strong><p>This sport currently uses its broad evidence-bounded demand model.</p></div>}<p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}</>}
      {step === 3 && <><h1>How many days<br /><em>a week?</em></h1><p className="athlete-quiz-copy">Pick the rhythm you can actually keep. The split builds itself around it.</p><div className="athlete-schedule-grid">{scheduleOptions.map((days) => <button key={days} onClick={() => choose(setTrainingDays, days)} className={`athlete-schedule-choice ${trainingDays === days ? "athlete-schedule-choice-selected" : ""}`}><strong>{days}</strong><span>{days === 1 ? "day" : "days"}</span><small>{days <= 2 ? "Focused" : days <= 4 ? "Progressive" : "High exposure"}</small></button>)}</div><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}</>}
      {step === 4 && <><h1>Where do you<br /><em>train?</em></h1><p className="athlete-quiz-copy">This gives you a starting kit list. You will fine-tune it on the next screen.</p><div className="athlete-access-grid">{(Object.keys(gymAccessProfiles) as GymAccess[]).map((access) => <button key={access} onClick={() => chooseGymAccess(access)} className={`athlete-access-choice ${gymAccess === access ? "athlete-access-choice-selected" : ""}`}><Dumbbell className="h-5 w-5" /><span><strong>{access}</strong><small>{gymAccessProfiles[access].length} equipment categories</small></span>{gymAccess === access && <Check className="h-5 w-5" />}</button>)}</div><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}</>}
      {step === 5 && <><h1>What have you<br /><em>got to use?</em></h1><p className="athlete-quiz-copy">Tap anything you can get to. Plans will only use these.</p><div className="athlete-equipment-grid">{catalogEquipment.map((equipment) => <button key={equipment} onClick={() => toggleEquipment(equipment)} className={`athlete-equipment-choice ${availableEquipment.includes(equipment) ? "athlete-equipment-choice-selected" : ""}`}><Dumbbell className="h-4 w-4" /><span><strong>{equipment}</strong><small>{equipment === "Bodyweight" ? "Always available" : "Tap to change"}</small></span>{availableEquipment.includes(equipment) && <Check className="h-4 w-4" />}</button>)}</div><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation(availableEquipment.length > 0)}</>}
      {step === 6 && <><h1>What should we<br /><em>call you?</em></h1><p className="athlete-quiz-copy">Anything you like. Skip it if you would rather not.</p><label className="athlete-name-field"><UserRound className="h-5 w-5" /><input autoFocus value={preferredName} onChange={(event) => setPreferredName(event.target.value)} maxLength={36} placeholder="Enter your name" /></label><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation(true, preferredName.trim() ? "Continue" : "Skip for now")}</>}
      {step === 7 && <><h1>How long have you<br /><em>been training?</em></h1><p className="athlete-quiz-copy">This sets how much the app explains as you go.</p><div className="athlete-quiz-option-list">{experiences.map((item, index) => <button key={item.value} onClick={() => choose(setExperience, item.value)} className={`athlete-choice ${experience === item.value ? "athlete-choice-selected" : ""}`}><span className="athlete-choice-index">0{index + 1}</span><span><strong>{item.value}</strong><small>{item.detail}</small></span>{experience === item.value && <Check className="h-5 w-5" />}</button>)}</div><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}</>}
      {step === 8 && <><h1>Pounds or<br /><em>kilograms?</em></h1><p className="athlete-quiz-copy">Switching converts anything you have already entered.</p><div className="athlete-unit-grid">{(["kg", "lb"] as WeightUnit[]).map((unit) => <button key={unit} onClick={() => chooseWeightUnit(unit)} className={`athlete-unit-choice ${weightUnit === unit ? "athlete-unit-choice-selected" : ""}`}><Scale className="h-9 w-9" /><strong>{unit === "kg" ? "Kilograms" : "Pounds"}</strong><small>{unit.toUpperCase()}</small></button>)}</div><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}</>}
      {step === 9 && <><h1>A few numbers,<br /><em>if you want.</em></h1><p className="athlete-quiz-copy">Entering these once means the app stops asking every time you log a lift.</p><label className="athlete-weight-field"><Scale className="h-5 w-5" /><input inputMode="decimal" value={bodyWeightText} onChange={(event) => setBodyWeightText(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={`Enter weight in ${weightUnit}`} /><span>{weightUnit}</span></label><div className="athlete-quiz-option-list"><span className="athlete-quiz-kicker">Sex (used only to match published studies)</span>{(["female", "male", "intersex", "unspecified"] as SexForReference[]).map((option) => <button key={option} type="button" onClick={() => choose(setSexForReference, option)} className={`athlete-choice ${sexForReference === option ? "athlete-choice-selected" : ""}`}><span><strong>{option === "unspecified" ? "Prefer not to say" : option.charAt(0).toUpperCase() + option.slice(1)}</strong></span>{sexForReference === option && <Check className="h-5 w-5" />}</button>)}</div><label className="athlete-weight-field"><UserRound className="h-5 w-5" /><input inputMode="numeric" value={birthYearText} onChange={(event) => setBirthYearText(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="Birth year (e.g. 1998)" /></label><button type="button" onClick={() => { setBodyWeightText(""); setSexForReference(undefined); setBirthYearText(""); move(10); }} className="athlete-quiz-skip">Skip these fields</button><p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}</>}
      {step === 10 && <><h1>{preferredName.trim() ? `${preferredName.trim()}, you\u2019re` : "You\u2019re"}<br /><em>all set.</em></h1><p className="athlete-quiz-copy">Here is what we will build from. Nothing here is locked.</p>
        <div className="athlete-plan-preview">
          <div className="athlete-preview-headline"><p>Building for</p><strong>{goal}</strong><span>{selectedSport ? sportLabel(selectedSport) : "No sport yet"} · {experience}</span></div>
          <dl className="athlete-preview-facts">
            <div><dt>Training days</dt><dd>{trainingDays} <span>{trainingDays === 1 ? "day a week" : "days a week"}</span></dd></div>
            <div><dt>Focus</dt><dd>{sportModifiers.find((item) => item.id === sportModifierId)?.label || "General profile"}</dd></div>
            <div><dt>Equipment</dt><dd>{availableEquipment.length} <span>{availableEquipment.length === 1 ? "category" : "categories"}</span></dd></div>
          </dl>
        </div>
        <div className="athlete-quiz-final-actions"><button type="button" onClick={() => move(9)} className="athlete-quiz-back"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" onClick={() => finish("custom")} className="athlete-quiz-skip">Skip</button><button type="button" onClick={() => finish("suggested")} className="athlete-quiz-next">Build my plan <ArrowRight className="h-4 w-4" /></button></div></>}
    </section></main>
  </div>;
}
