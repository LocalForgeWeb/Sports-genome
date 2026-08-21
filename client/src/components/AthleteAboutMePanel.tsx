import { Check, Dumbbell, PencilLine, Scale, UserRound } from "lucide-react";
import type { AthleteBaseline, AthleteExperience, WeightUnit } from "@/components/AthleteBaselineQuiz";
import { catalogEquipment, gymAccessProfiles, type CatalogEquipment, type GymAccess } from "@/lib/equipmentProfile";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import "@/athlete-about-me.css";

const experiences: AthleteExperience[] = ["Beginner", "Intermediate", "Advanced"];
const goals: TrainingGoal[] = ["Athleticism", "Muscle growth", "Max strength", "Capacity"];

export function AthleteAboutMePanel({ baseline, goal, trainingDays, sportId, sports, onBaseline, onGoal, onDays, onSport }: {
  baseline: AthleteBaseline;
  goal: TrainingGoal;
  trainingDays: number;
  sportId: string;
  sports: SportProfile[];
  onBaseline: (next: AthleteBaseline) => void;
  onGoal: (goal: TrainingGoal) => void;
  onDays: (days: number) => void;
  onSport: (sportId: string) => void;
}) {
  const equipment = baseline.equipment;
  const setGymAccess = (gymAccess: GymAccess) => onBaseline({ ...baseline, equipment: { gymAccess, availableEquipment: gymAccessProfiles[gymAccess] } });
  const toggleEquipment = (item: CatalogEquipment) => {
    if (item === "Bodyweight") return;
    const availableEquipment = equipment.availableEquipment.includes(item) ? equipment.availableEquipment.filter((available) => available !== item) : [...equipment.availableEquipment, item];
    onBaseline({ ...baseline, equipment: { ...equipment, availableEquipment } });
  };
  return <section className="about-me-panel">
    <div className="about-me-head"><div><p className="metric-label">Athlete profile / editable</p><h1>About <em>me.</em></h1><p>These inputs shape planning context and automatic stack availability. They do not rate health, body composition, or ability.</p></div><UserRound className="h-7 w-7 text-[#e4512e]" /></div>
    <div className="about-me-grid">
      <section className="about-me-card"><div className="about-me-card-head"><UserRound className="h-4 w-4" /><span>Identity & experience</span></div><label><span>Preferred name</span><input value={baseline.preferredName || ""} placeholder="Add a name" onChange={(event) => onBaseline({ ...baseline, preferredName: event.target.value || undefined })} /></label><label><span>Training experience</span><select value={baseline.experience} onChange={(event) => onBaseline({ ...baseline, experience: event.target.value as AthleteExperience })}>{experiences.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Bodyweight (optional)</span><div className="about-me-inline"><input inputMode="decimal" value={baseline.bodyWeight || ""} placeholder="Not added" onChange={(event) => { const bodyWeight = Number(event.target.value); onBaseline({ ...baseline, bodyWeight: Number.isFinite(bodyWeight) && bodyWeight > 0 ? bodyWeight : undefined }); }} /><select value={baseline.weightUnit} onChange={(event) => onBaseline({ ...baseline, weightUnit: event.target.value as WeightUnit })}><option value="lb">lb</option><option value="kg">kg</option></select></div></label></section>
      <section className="about-me-card"><div className="about-me-card-head"><PencilLine className="h-4 w-4" /><span>Training context</span></div><label><span>Primary goal</span><select value={goal} onChange={(event) => onGoal(event.target.value as TrainingGoal)}>{goals.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Primary sport</span><select value={sportId} onChange={(event) => onSport(event.target.value)}>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}</select></label><label><span>Training days / week</span><select value={trainingDays} onChange={(event) => onDays(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label></section>
    </div>
    <section className="about-me-equipment"><div className="about-me-equipment-head"><div><p className="metric-label">Automatic stack constraint</p><h2>Available equipment</h2><p>Recommended stacks use the selected equipment below. The catalog remains complete, so you can inspect or manually add any exercise.</p></div><Dumbbell className="h-6 w-6 text-[#e4512e]" /></div><div className="about-me-access-row">{(Object.keys(gymAccessProfiles) as GymAccess[]).map((access) => <button key={access} onClick={() => setGymAccess(access)} className={equipment.gymAccess === access ? "about-me-access-active" : ""}>{access}</button>)}</div><div className="about-me-equipment-grid">{catalogEquipment.map((item) => <button key={item} onClick={() => toggleEquipment(item)} className={equipment.availableEquipment.includes(item) ? "about-me-equipment-active" : ""}><Scale className="h-4 w-4" /><span>{item}</span>{equipment.availableEquipment.includes(item) && <Check className="ml-auto h-4 w-4" />}</button>)}</div></section>
  </section>;
}
