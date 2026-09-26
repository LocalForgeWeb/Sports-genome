import React, { useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, CalendarDays, ChevronDown, ChevronRight, Check, CloudUpload, Dumbbell, Fingerprint, Lock, Medal, Palette, PlayCircle, Scale, Sparkles, Target, Trash2, Trophy, UserRound } from "lucide-react";
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

export function AthleteAboutMePanel({ baseline, goal, trainingDays, gymMinutes, onGymMinutes, sportId, sportContextMode = "sport", sports, onBaseline, onGoal, onDays, onSport, onSportContextMode = () => {}, capacityFocus = { reportedSignals: [] }, targetCatalog, onCapacityFocus = () => {}, identity, syncPending = 0, benchmarkOptIn = false, onBenchmarkOptIn = () => {}, guides, launchVideo, launchVideoEnabled, buildStamp }: {
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
  /** The guide, onboarding restart and research library, owned by the page that has them. */
  guides?: ReactNode;
  /** The launch video setting and preview, likewise. */
  launchVideo?: ReactNode;
  launchVideoEnabled?: boolean;
  /** The build this device runs, printed once at the foot. */
  buildStamp?: string;
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
  const [editing, setEditing] = useState(false);
  /* Every collapsed group says what is inside it, from the actual state:
     the equipment preset and count, the target chosen, where the record is
     saved, the theme, whether a passkey is enrolled. Nothing here is a sample. */
  const sportLabel = sportContextMode === "sport"
    ? (sports.find((sport) => sport.id === sportId)?.label || "Choose a sport")
    : (contextModes.find((mode) => mode.value === sportContextMode)?.label || "Not set");
  const sportModifierLabel = sportContextMode === "sport" && baseline.sportModifierId ? sportModifiers.find((item) => item.id === baseline.sportModifierId)?.label : undefined;
  const selectedTargetName = targetCatalog?.status === "connected" ? targetCatalog.targets.find((target) => target.targetKey === capacityFocus.focus?.targetKey)?.name : undefined;
  const constraintReported = capacityFocus.constraint?.constraintType && capacityFocus.constraint.constraintType !== "proactive_none";
  const prioritiesSummary = selectedTargetName ? `${selectedTargetName}${constraintReported ? " · something reported there" : ""}` : "Choose a region or capacity";
  const accountSummary = !identity ? "Saved on this device"
    : identity.userId ? (identity.anonymous ? "Saved to an account on this device" : "Saved to your account")
    : "Saved on this device";
  const accountPending = syncPending > 0 ? ` · ${syncPending} ${syncPending === 1 ? "lift" : "lifts"} waiting` : "";
  const passkeyCount = accountPasskeys.data?.length ?? 0;
  const securitySummary = !passkeySupported ? "Passkey unavailable on this device" : passkeyCount ? `${passkeyCount} device ${passkeyCount === 1 ? "passkey" : "passkeys"} enrolled` : "Passkey not enrolled";
  const equipmentSummary = `${equipment.gymAccess} · ${equipment.availableEquipment.length} ${equipment.availableEquipment.length === 1 ? "type" : "types"} available`;
  const identityLine = [baseline.experience ? `${baseline.experience} athlete` : "Athlete profile", baseline.bodyWeight ? `${baseline.bodyWeight} ${baseline.weightUnit}` : null].filter(Boolean).join(" · ");
  return <section className="about-me-panel">
    <div className="about-me-head"><div><h1>About me</h1><p>Your training context</p></div></div>

    {/* Who this is, from the profile as it stands: the existing neutral identity
        mark, the name if one was given, and one line of what is on file. */}
    <div className="about-me-identity">
      <span className="about-me-avatar" aria-hidden="true"><UserRound className="h-9 w-9" /></span>
      <div><h2>{baseline.preferredName || "Athlete"}</h2><p>{identityLine}</p><button type="button" className="about-me-edit" aria-expanded={editing} aria-controls="about-me-identity-fields" onClick={() => { emitInteractionFeedback(); setEditing((current) => !current); }}>{editing ? "Done editing" : "Edit profile"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
    </div>
    {editing && <section id="about-me-identity-fields" className="about-me-card about-me-identity-fields"><p className="about-me-boundary">Planning context only — editable inputs that guide stack availability, not health or ability ratings.</p><label><span>Preferred name</span><input value={baseline.preferredName || ""} placeholder="Add a name" onChange={(event) => onBaseline({ ...baseline, preferredName: event.target.value || undefined })} /></label><label><span>Training experience</span><select value={baseline.experience} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, experience: event.target.value as AthleteExperience }); }}>{experiences.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Bodyweight (optional)</span><div className="about-me-inline"><input inputMode="decimal" value={baseline.bodyWeight || ""} placeholder="Not added" onChange={(event) => { const bodyWeight = Number(event.target.value); onBaseline({ ...baseline, bodyWeight: Number.isFinite(bodyWeight) && bodyWeight > 0 ? bodyWeight : undefined }); }} /><select value={baseline.weightUnit} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, weightUnit: event.target.value as WeightUnit }); }}><option value="lb">lb</option><option value="kg">kg</option></select></div></label><label><span>Sex (used only to match published studies)</span><select value={baseline.sexForReference || ""} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, sexForReference: (event.target.value || undefined) as SexForReference | undefined }); }}><option value="">Not set</option><option value="female">Female</option><option value="male">Male</option><option value="intersex">Intersex</option><option value="unspecified">Prefer not to say</option></select></label><label><span>Birth year (optional)</span><input inputMode="numeric" value={baseline.birthYear || ""} placeholder="e.g. 1998" onChange={(event) => { const birthYear = Number(event.target.value.replace(/[^0-9]/g, "").slice(0, 4)); const currentYear = new Date().getFullYear(); onBaseline({ ...baseline, birthYear: Number.isFinite(birthYear) && birthYear > currentYear - 100 && birthYear <= currentYear ? birthYear : undefined }); }} /></label></section>}

    {/* The preferences the plan is built from, visible at a glance. Sport and
        goal open to their full choice sets; days and session time are the chips
        themselves. Saved on this device the moment they change. */}
    <section className="about-me-preferences" aria-labelledby="about-me-preferences-heading">
      <h2 id="about-me-preferences-heading">Training preferences</h2>
      <details className="about-me-pref-row"><summary><Trophy className="h-5 w-5" aria-hidden="true" /><span>Sport</span><b>{sportLabel}{sportModifierLabel ? ` · ${sportModifierLabel}` : ""}</b><ChevronDown className="h-5 w-5 about-me-pref-chevron" aria-hidden="true" /></summary><div className="about-me-card about-me-pref-body"><fieldset className="about-me-context-mode"><legend>Do you train for a sport?</legend>{contextModes.map((mode) => { const Icon = mode.icon; const chosen = sportContextMode === mode.value; return <label key={mode.value} className={chosen ? "about-me-context-choice about-me-context-active" : "about-me-context-choice"}><input type="radio" name="about-me-context-mode" value={mode.value} checked={chosen} onChange={() => { emitInteractionFeedback(); onSportContextMode(mode.value); }} /><i className="about-me-context-medallion" aria-hidden="true"><Icon className="h-5 w-5" /></i><span><strong>{mode.label}</strong><small>{mode.detail}</small></span><i className="about-me-context-check" aria-hidden="true">{chosen && <Check className="h-5 w-5" />}</i></label>; })}<p className="about-me-context-note">Changing this keeps your training days, weeks and equipment. Only sport-specific screens change.</p></fieldset>{sportContextMode === "sport" && <><label><span>Primary sport</span><select value={sportId} onChange={(event) => { if (!event.target.value) return; emitInteractionFeedback(); onSport(event.target.value); onBaseline({ ...baseline, sportModifierId: undefined }); }}><option value="" disabled>Choose a sport</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}</select></label><label><span>Role / event / style</span><select value={baseline.sportModifierId || ""} onChange={(event) => { emitInteractionFeedback(); onBaseline({ ...baseline, sportModifierId: event.target.value || undefined }); }}><option value="">General sport profile</option>{sportModifiers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></>}</div></details>
      <details className="about-me-pref-row"><summary><Medal className="h-5 w-5" aria-hidden="true" /><span>Goal</span><b>{goal}</b><ChevronDown className="h-5 w-5 about-me-pref-chevron" aria-hidden="true" /></summary><div className="about-me-card about-me-pref-body"><fieldset className="about-me-goal-grid"><legend>Primary goal</legend>{trainingGoalChoices.map((item) => { const Icon = item.icon; const chosen = goal === item.value; return <label key={item.value} className={chosen ? "about-me-goal-choice about-me-goal-active" : "about-me-goal-choice"} title={item.detail}><input type="radio" name="about-me-goal" value={item.value} checked={chosen} onChange={() => { emitInteractionFeedback(); onGoal(item.value); }} /><i className="about-me-context-medallion" aria-hidden="true"><Icon className="h-4 w-4" /></i><strong>{item.value}</strong></label>; })}</fieldset></div></details>
      <div className="about-me-card about-me-pref-chips"><fieldset className="about-me-days"><legend><CalendarDays className="h-5 w-5" aria-hidden="true" /> Days per week</legend><div className="about-me-days-row">{[1, 2, 3, 4, 5, 6, 7].map((days) => { const chosen = trainingDays === days; return <label key={days} className={chosen ? "about-me-day-chip about-me-day-active" : "about-me-day-chip"}><input type="radio" name="about-me-days" value={days} checked={chosen} onChange={() => { emitInteractionFeedback(); onDays(days); }} /><span>{days}</span></label>; })}</div><p className="about-me-days-note">{trainingDays} {trainingDays === 1 ? "day" : "days"} a week. Your saved days are kept if you change this.</p></fieldset>{gymMinutes !== undefined && onGymMinutes && <fieldset className="about-me-days"><legend>Session time (minutes)</legend><div className="about-me-days-row">{gymTimeOptions.map((minutes) => { const chosen = gymMinutes === minutes; return <label key={minutes} className={chosen ? "about-me-day-chip about-me-day-active" : "about-me-day-chip"}><input type="radio" name="about-me-session-minutes" value={minutes} checked={chosen} onChange={() => { emitInteractionFeedback(); onGymMinutes(minutes); }} /><span>{minutes === 90 ? "90+" : minutes}</span></label>; })}</div><p className="about-me-days-note">Drafts and recommended stacks are sized to fit this.</p></fieldset>}</div>
      <p className="about-me-saved">Saved on this device as you change them.</p>
    </section>

    {/* The rest, grouped and collapsed, each row saying what it holds. Every
        control that existed still exists, inside the group that owns it. */}
    <div className="about-me-groups">
      <details className="about-me-group"><summary><Dumbbell className="h-6 w-6" aria-hidden="true" /><span><strong>Equipment</strong><small>{equipmentSummary}</small></span><ChevronRight className="h-5 w-5 about-me-group-chevron" aria-hidden="true" /></summary>
        <section className="about-me-equipment"><div className="about-me-equipment-head"><div><p>Recommended stacks use the selected equipment below. The catalog remains complete, so you can inspect or manually add any exercise.</p></div></div><div className="about-me-access-row">{(Object.keys(gymAccessProfiles) as GymAccess[]).map((access) => <button key={access} onClick={() => setGymAccess(access)} className={equipment.gymAccess === access ? "about-me-access-active" : ""}>{access}</button>)}</div><div className="about-me-equipment-grid">{catalogEquipment.map((item) => <button key={item} onClick={() => toggleEquipment(item)} className={equipment.availableEquipment.includes(item) ? "about-me-equipment-active" : ""}><Scale className="h-4 w-4" /><span>{item}</span>{equipment.availableEquipment.includes(item) && <Check className="ml-auto h-4 w-4" />}</button>)}</div></section>
      </details>
      <details className="about-me-group"><summary><Target className="h-6 w-6" aria-hidden="true" /><span><strong>Training priorities</strong><small>{prioritiesSummary}</small></span><ChevronRight className="h-5 w-5 about-me-group-chevron" aria-hidden="true" /></summary>
        <CapacityFocusCard catalog={targetCatalog} value={capacityFocus} onChange={onCapacityFocus} />
      </details>
      <details className="about-me-group"><summary><CloudUpload className="h-6 w-6" aria-hidden="true" /><span><strong>Account &amp; sync</strong><small>{accountSummary}{accountPending}</small></span><ChevronRight className="h-5 w-5 about-me-group-chevron" aria-hidden="true" /></summary>
        {identity ? <AthleteAccountCard identity={identity} pending={syncPending} optedIn={benchmarkOptIn} onOptIn={onBenchmarkOptIn} /> : <p className="about-me-group-note">Everything you log is saved on this device.</p>}
      </details>
      <details className="about-me-group"><summary><Palette className="h-6 w-6" aria-hidden="true" /><span><strong>Appearance</strong><small>{themeOptionCopy[preference].label}</small></span><ChevronRight className="h-5 w-5 about-me-group-chevron" aria-hidden="true" /></summary>
        <section className="about-me-card"><label><span>Theme</span><select value={preference} onChange={(event) => { emitInteractionFeedback(); setPreference(event.target.value as ThemePreference); }}>{themePreferences.map((option) => <option key={option} value={option}>{themeOptionCopy[option].label}</option>)}</select></label><p className="about-me-theme-note">{themeOptionCopy[preference].detail}{preference === "system" ? ` Right now that is ${theme === "dark" ? "dark" : "light chrome"}.` : ""}</p></section>
      </details>
      <details className="about-me-group"><summary><Lock className="h-6 w-6" aria-hidden="true" /><span><strong>Security</strong><small>{securitySummary}</small></span><ChevronRight className="h-5 w-5 about-me-group-chevron" aria-hidden="true" /></summary>
        <section className="about-me-security"><div><p className="metric-label">Account security</p><h3>Face ID / passkey</h3><p>Use this device’s Face ID, Touch ID, or secure screen lock to sign in without typing your password. Your biometric data stays on your device.</p></div><button onClick={enrollPasskey} disabled={!passkeySupported || passkeyOptions.isPending || passkeyVerify.isPending}><Fingerprint className="h-4 w-4" /> {passkeySupported ? "Enable Face ID / passkey" : "Passkey unavailable"}</button>{accountPasskeys.data?.length ? <div className="about-me-passkey-list" aria-label="Enrolled passkeys">{accountPasskeys.data.map((passkey, index) => <div key={passkey.id} className="about-me-passkey-row"><span>Device passkey {index + 1}{passkey.lastUsedAt ? " · used before" : " · not used yet"}</span><button type="button" aria-label={`Remove device passkey ${index + 1}`} onClick={() => requestRemovePasskey(passkey.id, `Device passkey ${index + 1}`)} disabled={removePasskey.isPending}><Trash2 className="h-3.5 w-3.5" /> Remove</button></div>)}</div> : <p className="about-me-passkey-empty">No device passkeys enrolled yet.</p>}</section>
      </details>
      {guides && <details className="about-me-group"><summary><BookOpen className="h-6 w-6" aria-hidden="true" /><span><strong>Guides &amp; research</strong><small>Onboarding, sources, and help</small></span><ChevronRight className="h-5 w-5 about-me-group-chevron" aria-hidden="true" /></summary>{guides}</details>}
      {launchVideo && <details className="about-me-group"><summary><PlayCircle className="h-6 w-6" aria-hidden="true" /><span><strong>Launch video</strong><small>{launchVideoEnabled ? "Play when the app opens" : "Off"}</small></span><ChevronRight className="h-5 w-5 about-me-group-chevron" aria-hidden="true" /></summary>{launchVideo}</details>}
    </div>
    {buildStamp && <p className="more-workspace-build" title="The build this device is running. If it does not change after an update, this device is pinned to an old address.">{buildStamp}</p>}
    {pendingDestructiveAction && <ConfirmDialog {...pendingDestructiveAction} onCancel={() => setPendingDestructiveAction(null)} onConfirm={() => { pendingDestructiveAction.onConfirm(); setPendingDestructiveAction(null); }} />}
  </section>;
}
