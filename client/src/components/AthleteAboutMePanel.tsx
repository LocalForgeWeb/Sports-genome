import React, { useState } from "react";
import { Check, Dumbbell, Fingerprint, PencilLine, Scale, ShieldCheck, Sparkles, SunMoon, Target, Trash2, UserRound } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { themeOptionCopy, themePreferences, type ThemePreference } from "@/lib/theme";
import { startRegistration } from "@simplewebauthn/browser";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { trainingGoalChoices, type AthleteBaseline, type AthleteExperience, type SexForReference, type WeightUnit } from "@/components/AthleteBaselineQuiz";
import { catalogEquipment, gymAccessProfiles, type CatalogEquipment, type GymAccess } from "@/lib/equipmentProfile";
import { gymTimeOptions } from "@/lib/gymTimeBudget";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { getSportModifiers } from "@/lib/hierarchicalSportModel";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { AthleteAccountCard } from "@/components/AthleteAccountCard";
import { CapacityFocusCard, type CapacityFocusState } from "@/components/CapacityFocusCard";
import type { ResilienceTargetCatalog, SportContextMode } from "@shared/resilienceContext";
import type { IdentityState } from "@/lib/athleteIdentity";
import "@/athlete-about-me.css";

const experiences: AthleteExperience[] = ["Beginner", "Intermediate", "Advanced"];

/**
 * The same three answers the introduction gives, available for as long as they stay true.
 *
 * Taking up a sport, or stopping, is an ordinary change. It used to be unsayable here: the
 * sport list's only way out read "Reset sport selection" and deleted every saved day in
 * every week on the way to putting you back in sport mode.
 */
const contextModes: { value: SportContextMode; label: string; detail: string; icon: typeof Target }[] = [
  { value: "sport", label: "I train for a sport", detail: "Loads the movement demands that sport asks for.", icon: Target },
  { value: "general", label: "General strength and resilience", detail: "No sport. Strength, capacity and body-region goals all stay available.", icon: Dumbbell },
  { value: "undecided", label: "Decide later", detail: "Skip it for now. You can pick a sport whenever you want.", icon: Sparkles },
];

export function AthleteAboutMePanel({ baseline, goal, trainingDays, gymMinutes, onGymMinutes, sportId, sportContextMode = "sport", sports, onBaseline, onGoal, onDays, onSport, onSportContextMode = () => {}, capacityFocus = { reportedSignals: [] }, targetCatalog, onCapacityFocus = () => {}, identity, syncPending = 0, benchmarkOptIn = false, onBenchmarkOptIn = () => {} }: {
  baseline: AthleteBaseline;
  goal: TrainingGoal;
  trainingDays: number;
  /** How long a session has. Sizes drafts and recommended stacks; lived on Home before. */
  gymMinutes?: number;
  onGymMinutes?: (minutes: number) => void;
  sportId: string;
  /** Whether a sport applies at all. `general` and `undecided` are complete answers. */
  sportContextMode?: SportContextMode;
  onSportContextMode?: (mode: SportContextMode) => void;
  sports: SportProfile[];
  onBaseline: (next: AthleteBaseline) => void;
  onGoal: (goal: TrainingGoal) => void;
  onDays: (days: number) => void;
  onSport: (sportId: string) => void;
  /** What the athlete wants to build up, and what the plan must work around. */
  capacityFocus?: CapacityFocusState;
  targetCatalog?: ResilienceTargetCatalog;
  onCapacityFocus?: (next: CapacityFocusState) => void;
  identity?: IdentityState;
  syncPending?: number;
  benchmarkOptIn?: boolean;
  onBenchmarkOptIn?: (next: boolean) => void;
}) {
  const equipment = baseline.equipment;
  const sportModifiers = getSportModifiers(sportId);
  const [pendingDestructiveAction, setPendingDestructiveAction] = useState<ConfirmDialogRequest | null>(null);
  const passkeyOptions = trpc.auth.passkeyRegistrationOptions.useMutation();
  const passkeyVerify = trpc.auth.passkeyRegistrationVerify.useMutation();
  const accountPasskeys = trpc.auth.passkeys.useQuery();
  const removePasskey = trpc.auth.removePasskey.useMutation({ onSuccess: () => { accountPasskeys.refetch(); toast.success("Passkey removed from this account"); } });
  const requestRemovePasskey = (passkeyId: number, label: string) => setPendingDestructiveAction({
    title: "Remove this passkey?",
    body: `${label} will no longer be able to sign in to this account with Face ID, Touch ID, or your device's screen lock. You can enroll it again afterward, but this specific removal cannot be undone.`,
    confirmLabel: "Remove passkey",
    onConfirm: () => removePasskey.mutate({ passkeyId }),
  });
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
  const { preference, theme, setPreference } = useTheme();
  return <section className="about-me-panel">
    <div className="about-me-head"><div><p className="metric-label">Athlete profile / editable</p><h1>About <em>me.</em></h1><p>Planning context only — editable inputs that guide stack availability, not health or ability ratings.</p></div><UserRound className="h-7 w-7 text-[var(--sg-text-subtle-on-dark)]" /></div>
    <div className="about-me-grid">
      <section className="about-me-card"><div className="about-me-card-head"><UserRound className="h-4 w-4" /><span>Identity & experience</span></div><label><span>Preferred name</span><input value={baseline.preferredName || ""} placeholder="Add a name" onChange={(event) => onBaseline({ ...baseline, preferredName: event.target.value || undefined })} /></label><label><span>Training experience</span><select value={baseline.experience} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, experience: event.target.value as AthleteExperience }); }}>{experiences.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Bodyweight (optional)</span><div className="about-me-inline"><input inputMode="decimal" value={baseline.bodyWeight || ""} placeholder="Not added" onChange={(event) => { const bodyWeight = Number(event.target.value); onBaseline({ ...baseline, bodyWeight: Number.isFinite(bodyWeight) && bodyWeight > 0 ? bodyWeight : undefined }); }} /><select value={baseline.weightUnit} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, weightUnit: event.target.value as WeightUnit }); }}><option value="lb">lb</option><option value="kg">kg</option></select></div></label><label><span>Sex (used only to match published studies)</span><select value={baseline.sexForReference || ""} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, sexForReference: (event.target.value || undefined) as SexForReference | undefined }); }}><option value="">Not set</option><option value="female">Female</option><option value="male">Male</option><option value="intersex">Intersex</option><option value="unspecified">Prefer not to say</option></select></label><label><span>Birth year (optional)</span><input inputMode="numeric" value={baseline.birthYear || ""} placeholder="e.g. 1998" onChange={(event) => { const birthYear = Number(event.target.value.replace(/[^0-9]/g, "").slice(0, 4)); const currentYear = new Date().getFullYear(); onBaseline({ ...baseline, birthYear: Number.isFinite(birthYear) && birthYear > currentYear - 100 && birthYear <= currentYear ? birthYear : undefined }); }} /></label></section>
      <section className="about-me-card"><div className="about-me-card-head"><PencilLine className="h-4 w-4" /><span>Training context</span></div><fieldset className="about-me-goal-grid"><legend>Primary goal</legend>{trainingGoalChoices.map((item) => { const Icon = item.icon; const chosen = goal === item.value; return <label key={item.value} className={chosen ? "about-me-goal-choice about-me-goal-active" : "about-me-goal-choice"} title={item.detail}><input type="radio" name="about-me-goal" value={item.value} checked={chosen} onChange={() => { emitInteractionFeedback(); onGoal(item.value); }} /><i className="about-me-context-medallion" aria-hidden="true"><Icon className="h-4 w-4" /></i><strong>{item.value}</strong></label>; })}</fieldset><fieldset className="about-me-context-mode"><legend>Do you train for a sport?</legend>{contextModes.map((mode) => { const Icon = mode.icon; const chosen = sportContextMode === mode.value; return <label key={mode.value} className={chosen ? "about-me-context-choice about-me-context-active" : "about-me-context-choice"}><input type="radio" name="about-me-context-mode" value={mode.value} checked={chosen} onChange={() => { emitInteractionFeedback(); onSportContextMode(mode.value); }} /><i className="about-me-context-medallion" aria-hidden="true"><Icon className="h-5 w-5" /></i><span><strong>{mode.label}</strong><small>{mode.detail}</small></span><i className="about-me-context-check" aria-hidden="true">{chosen && <Check className="h-5 w-5" />}</i></label>; })}<p className="about-me-context-note">Changing this keeps your training days, weeks and equipment. Only sport-specific screens change.</p></fieldset>{sportContextMode === "sport" && <><label><span>Primary sport</span><select value={sportId} onChange={(event) => { if (!event.target.value) return; emitInteractionFeedback(); onSport(event.target.value); onBaseline({ ...baseline, sportModifierId: undefined }); }}><option value="" disabled>Choose a sport</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}</select></label><label><span>Role / event / style</span><select value={baseline.sportModifierId || ""} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, sportModifierId: event.target.value || undefined }); }}><option value="">General sport profile</option>{sportModifiers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></>}<fieldset className="about-me-days"><legend>Training days / week</legend><div className="about-me-days-row">{[1, 2, 3, 4, 5, 6, 7].map((days) => { const chosen = trainingDays === days; return <label key={days} className={chosen ? "about-me-day-chip about-me-day-active" : "about-me-day-chip"}><input type="radio" name="about-me-days" value={days} checked={chosen} onChange={() => { emitInteractionFeedback(); onDays(days); }} /><span>{days}</span></label>; })}</div><p className="about-me-days-note">{trainingDays} {trainingDays === 1 ? "day" : "days"} a week. Your saved days are kept if you change this.</p></fieldset>{gymMinutes !== undefined && onGymMinutes && <fieldset className="about-me-days"><legend>Session time (minutes)</legend><div className="about-me-days-row">{gymTimeOptions.map((minutes) => { const chosen = gymMinutes === minutes; return <label key={minutes} className={chosen ? "about-me-day-chip about-me-day-active" : "about-me-day-chip"}><input type="radio" name="about-me-session-minutes" value={minutes} checked={chosen} onChange={() => { emitInteractionFeedback(); onGymMinutes(minutes); }} /><span>{minutes === 90 ? "90+" : minutes}</span></label>; })}</div><p className="about-me-days-note">Drafts and recommended stacks are sized to fit this.</p></fieldset>}</section>
      <section className="about-me-card"><div className="about-me-card-head"><SunMoon className="h-4 w-4" /><span>Appearance</span></div><label><span>Theme</span><select value={preference} onChange={(event) => { emitInteractionFeedback(); setPreference(event.target.value as ThemePreference); }}>{themePreferences.map((option) => <option key={option} value={option}>{themeOptionCopy[option].label}</option>)}</select></label><p className="about-me-theme-note">{themeOptionCopy[preference].detail}{preference === "system" ? ` Right now that is ${theme === "dark" ? "dark" : "light chrome"}.` : ""}</p></section>
    </div>
    {identity && <AthleteAccountCard identity={identity} pending={syncPending} optedIn={benchmarkOptIn} onOptIn={onBenchmarkOptIn} />}
    <section className="about-me-security"><div><p className="metric-label">Account security</p><h2>Face ID / passkey</h2><p>Use this device’s Face ID, Touch ID, or secure screen lock to sign in without typing your password. Your biometric data stays on your device.</p></div><button onClick={enrollPasskey} disabled={!passkeySupported || passkeyOptions.isPending || passkeyVerify.isPending}><Fingerprint className="h-4 w-4" /> {passkeySupported ? "Enable Face ID / passkey" : "Passkey unavailable"}</button>{accountPasskeys.data?.length ? <div className="about-me-passkey-list" aria-label="Enrolled passkeys">{accountPasskeys.data.map((passkey, index) => <div key={passkey.id} className="about-me-passkey-row"><span>Device passkey {index + 1}{passkey.lastUsedAt ? " · used before" : " · not used yet"}</span><button type="button" aria-label={`Remove device passkey ${index + 1}`} onClick={() => requestRemovePasskey(passkey.id, `Device passkey ${index + 1}`)} disabled={removePasskey.isPending}><Trash2 className="h-3.5 w-3.5" /> Remove</button></div>)}</div> : <p className="about-me-passkey-empty">No device passkeys enrolled yet.</p>}<ShieldCheck className="about-me-security-icon" /></section>
    <CapacityFocusCard catalog={targetCatalog} value={capacityFocus} onChange={onCapacityFocus} />
    <section className="about-me-equipment"><div className="about-me-equipment-head"><div><p className="metric-label">Automatic stack constraint</p><h2>Available equipment</h2><p>Recommended stacks use the selected equipment below. The catalog remains complete, so you can inspect or manually add any exercise.</p></div><Dumbbell className="h-6 w-6 text-[var(--sg-text-subtle-on-dark)]" /></div><div className="about-me-access-row">{(Object.keys(gymAccessProfiles) as GymAccess[]).map((access) => <button key={access} onClick={() => setGymAccess(access)} className={equipment.gymAccess === access ? "about-me-access-active" : ""}>{access}</button>)}</div><div className="about-me-equipment-grid">{catalogEquipment.map((item) => <button key={item} onClick={() => toggleEquipment(item)} className={equipment.availableEquipment.includes(item) ? "about-me-equipment-active" : ""}><Scale className="h-4 w-4" /><span>{item}</span>{equipment.availableEquipment.includes(item) && <Check className="ml-auto h-4 w-4" />}</button>)}</div></section>
    {pendingDestructiveAction && <ConfirmDialog {...pendingDestructiveAction} onCancel={() => setPendingDestructiveAction(null)} onConfirm={() => { pendingDestructiveAction.onConfirm(); setPendingDestructiveAction(null); }} />}
  </section>;
}
