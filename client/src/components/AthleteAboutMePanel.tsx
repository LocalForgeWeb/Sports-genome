import { Check, Dumbbell, Fingerprint, PencilLine, Scale, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { AthleteBaseline, AthleteExperience, WeightUnit } from "@/components/AthleteBaselineQuiz";
import { catalogEquipment, gymAccessProfiles, type CatalogEquipment, type GymAccess } from "@/lib/equipmentProfile";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { getSportModifiers } from "@/lib/hierarchicalSportModel";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
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
  const sportModifiers = getSportModifiers(sportId);
  const passkeyOptions = trpc.auth.passkeyRegistrationOptions.useMutation();
  const passkeyVerify = trpc.auth.passkeyRegistrationVerify.useMutation();
  const accountPasskeys = trpc.auth.passkeys.useQuery();
  const removePasskey = trpc.auth.removePasskey.useMutation({ onSuccess: () => { accountPasskeys.refetch(); toast.success("Passkey removed from this account"); } });
  const passkeySupported = typeof window !== "undefined" && "PublicKeyCredential" in window;
  const setGymAccess = (gymAccess: GymAccess) => { emitInteractionFeedback(); onBaseline({ ...baseline, equipment: { gymAccess, availableEquipment: gymAccessProfiles[gymAccess] } }); };
  const toggleEquipment = (item: CatalogEquipment) => {
    if (item === "Bodyweight") return;
    const availableEquipment = equipment.availableEquipment.includes(item) ? equipment.availableEquipment.filter((available) => available !== item) : [...equipment.availableEquipment, item];
    emitInteractionFeedback();
    onBaseline({ ...baseline, equipment: { ...equipment, availableEquipment } });
  };
  const enrollPasskey = async () => {
    if (!passkeySupported) return toast.error("This device does not support passkeys");
    try {
      const options = await passkeyOptions.mutateAsync();
      const response = await startRegistration({ optionsJSON: options });
      const verified = await passkeyVerify.mutateAsync({ response });
      if (!verified.ok) return toast.error("Could not save this device passkey");
      toast.success("Face ID / device passkey is ready");
    } catch {
      toast.error("Face ID or device passkey setup was cancelled or unavailable");
    }
  };
  return <section className="about-me-panel">
    <div className="about-me-head"><div><p className="metric-label">Athlete profile / editable</p><h1>About <em>me.</em></h1><p>These inputs shape planning context and automatic stack availability. They do not rate health, body composition, or ability.</p></div><UserRound className="h-7 w-7 text-[#e4512e]" /></div>
    <div className="about-me-grid">
      <section className="about-me-card"><div className="about-me-card-head"><UserRound className="h-4 w-4" /><span>Identity & experience</span></div><label><span>Preferred name</span><input value={baseline.preferredName || ""} placeholder="Add a name" onChange={(event) => onBaseline({ ...baseline, preferredName: event.target.value || undefined })} /></label><label><span>Training experience</span><select value={baseline.experience} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, experience: event.target.value as AthleteExperience }); }}>{experiences.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Bodyweight (optional)</span><div className="about-me-inline"><input inputMode="decimal" value={baseline.bodyWeight || ""} placeholder="Not added" onChange={(event) => { const bodyWeight = Number(event.target.value); onBaseline({ ...baseline, bodyWeight: Number.isFinite(bodyWeight) && bodyWeight > 0 ? bodyWeight : undefined }); }} /><select value={baseline.weightUnit} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, weightUnit: event.target.value as WeightUnit }); }}><option value="lb">lb</option><option value="kg">kg</option></select></div></label></section>
      <section className="about-me-card"><div className="about-me-card-head"><PencilLine className="h-4 w-4" /><span>Training context</span></div><label><span>Primary goal</span><select value={goal} onChange={(event) => { emitInteractionFeedback(); onGoal(event.target.value as TrainingGoal); }}>{goals.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Primary sport</span><select value={sportId} onChange={(event) => { emitInteractionFeedback(); onSport(event.target.value); onBaseline({ ...baseline, sportModifierId: undefined }); }}><option value="">Reset sport selection</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}</select></label><label><span>Role / event / style</span><select value={baseline.sportModifierId || ""} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, sportModifierId: event.target.value || undefined }); }}><option value="">General sport profile</option>{sportModifiers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label><span>Training days / week</span><select value={trainingDays} onChange={(event) => { emitInteractionFeedback(); onDays(Number(event.target.value)); }}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label></section>
    </div>
    <section className="about-me-security"><div><p className="metric-label">Account security</p><h2>Face ID / passkey</h2><p>Use this device’s Face ID, Touch ID, or secure screen lock to sign in without typing your password. Your biometric data stays on your device.</p></div><button onClick={enrollPasskey} disabled={!passkeySupported || passkeyOptions.isPending || passkeyVerify.isPending}><Fingerprint className="h-4 w-4" /> {passkeySupported ? "Enable Face ID / passkey" : "Passkey unavailable"}</button>{accountPasskeys.data?.length ? <div className="about-me-passkey-list" aria-label="Enrolled passkeys">{accountPasskeys.data.map((passkey, index) => <div key={passkey.id} className="about-me-passkey-row"><span>Device passkey {index + 1}{passkey.lastUsedAt ? " · used before" : " · not used yet"}</span><button type="button" aria-label={`Remove device passkey ${index + 1}`} onClick={() => removePasskey.mutate({ passkeyId: passkey.id })} disabled={removePasskey.isPending}><Trash2 className="h-3.5 w-3.5" /> Remove</button></div>)}</div> : <p className="about-me-passkey-empty">No device passkeys enrolled yet.</p>}<ShieldCheck className="about-me-security-icon" /></section>
    <section className="about-me-equipment"><div className="about-me-equipment-head"><div><p className="metric-label">Automatic stack constraint</p><h2>Available equipment</h2><p>Recommended stacks use the selected equipment below. The catalog remains complete, so you can inspect or manually add any exercise.</p></div><Dumbbell className="h-6 w-6 text-[#e4512e]" /></div><div className="about-me-access-row">{(Object.keys(gymAccessProfiles) as GymAccess[]).map((access) => <button key={access} onClick={() => setGymAccess(access)} className={equipment.gymAccess === access ? "about-me-access-active" : ""}>{access}</button>)}</div><div className="about-me-equipment-grid">{catalogEquipment.map((item) => <button key={item} onClick={() => toggleEquipment(item)} className={equipment.availableEquipment.includes(item) ? "about-me-equipment-active" : ""}><Scale className="h-4 w-4" /><span>{item}</span>{equipment.availableEquipment.includes(item) && <Check className="ml-auto h-4 w-4" />}</button>)}</div></section>
  </section>;
}
