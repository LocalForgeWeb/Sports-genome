/** Apex Performance OS: a premium athlete-and-coach workspace with high-contrast intelligence panels, movement-led recommendations, and visible training logic. */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, ArrowUpRight, BarChart3, BookOpen, BrainCircuit, ChevronDown, ChevronRight, ChevronUp, ClipboardPaste, Dna, Dumbbell, Layers3, Move3d, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy, UsersRound, X, Zap } from "lucide-react";
import { AnatomyMap, muscleLabels } from "@/components/AnatomyMap";
import { UniversalSearch } from "@/components/UniversalSearch";
import { deviceWorkoutHistoryEvent, hasActiveDeviceSession } from "@/lib/deviceWorkoutLog";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import type { SearchResult } from "@/lib/universalSearch";
import { GradeStamp } from "@/components/GradeStamp";
import { MovementIntelligencePanel } from "@/components/MovementIntelligencePanel";
import { StackImportPanel, type ImportedRoutine, type ImportedRoutineContext } from "@/components/StackImportPanel";
import { SessionDraftPanel } from "@/components/SessionDraftPanel";
import type { SplitDay } from "@/lib/splitCycle";
import type { TrainingLoadout as LoadoutMode } from "@/lib/loadoutTemplates";
import { FeatureTour } from "@/components/FeatureTour";
import { TrainingWeekPanel } from "@/components/TrainingWeekPanel";
import { CommandHero } from "@/components/CommandHero";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { readScopedRecord, scopedKey } from "@/lib/deviceStorageScope";
import { usePlanSync } from "@/lib/usePlanSync";
import { WorkoutHealthPanel } from "@/components/WorkoutHealthPanel";
import { WarmupPanel } from "@/components/WarmupPanel";
import { ImportedPlanContext } from "@/components/ImportedPlanContext";
import { ProgrammingGuidePanel } from "@/components/ProgrammingGuidePanel";
import { WeeklyPlanBoard } from "@/components/WeeklyPlanBoard";
import { TrainingDayNav } from "@/components/TrainingDayNav";
import { ThreeWeekPlanner } from "@/components/ThreeWeekPlanner";
import { WeeklyMuscleVolumePanel } from "@/components/WeeklyMuscleVolumePanel";
import { ExercisePrescriptionRow } from "@/components/ExercisePrescriptionRow";
import { WorkoutExecutionPanel } from "@/components/WorkoutExecutionPanel";
import { PROGRESSION_APPROVAL_EVENT, SEGMENT_PRIORITY_APPROVAL_EVENT, SEGMENT_SUGGESTION_APPROVAL_EVENT } from "@/components/WorkoutExecutionPanel";
import { DeviceWorkoutTracker } from "@/components/DeviceWorkoutTracker";
import { DayExercisePicker } from "@/components/DayExercisePicker";
import { PrintableWorkoutSheet, PrintWorkoutButton } from "@/components/PrintableWorkoutSheet";
import { AthleteBaselineQuiz, type AthleteBaseline, type AthleteQuizSelection } from "@/components/AthleteBaselineQuiz";
import { AthleteAboutMePanel } from "@/components/AthleteAboutMePanel";
import { loadBodyWeightLog, recordBodyWeight, saveBodyWeightLog, seedBodyWeightLog } from "@/lib/bodyWeightLog";
import { useAthleteSync } from "@/lib/useAthleteSync";
import { ProgressOverviewPanel } from "@/components/ProgressOverviewPanel";
import { TodayActionPanel } from "@/components/TodayActionPanel";
import { EquipmentConstraintStrip } from "@/components/EquipmentConstraintStrip";
import { ModifierEvidenceDisclosure } from "@/components/ModifierEvidenceDisclosure";
import { SportEvidencePanel } from "@/components/SportEvidencePanel";
import { SportBrowseNotice } from "@/components/SportBrowseNotice";
import { HierarchyPlanningDisclosure } from "@/components/HierarchyPlanningDisclosure";
import { defaultEquipmentProfile, equipmentProfileSummary, filterStackForEquipment } from "@/lib/equipmentProfile";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { defaultCatalogFilters, type CatalogFilters } from "@/lib/catalogDiscovery";
import { getExerciseSettings, getGoalPrescription, getWorkoutDiagnostics, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";
import { getExerciseActionConnection, lookupEnrichedMovement } from "@/lib/movementProgramAnalysis";
import { getBodyLabRoleContext } from "@/lib/bodyLabRoleContext";
import { sportMovementProfiles, sportProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";
import { findSportMovement, getMovementMuscles, getMovementRecommendations, getMovementSignals, getSportProgrammingContext, getSportSession, orderHierarchyConstructedSession, type MovementRecommendation, type RegistryEvidenceMap } from "@/lib/movementRecommendations";
import { getGymTimeBudget, gymTimeOptions, normalizeGymMinutes } from "@/lib/gymTimeBudget";
import { buildApprovedProgressionNote, buildApprovedSegmentPriorityNote } from "@/lib/progressiveTraining";
import { nextWeekToGenerate, visibleWeeks } from "@/lib/threeWeekPlan";
import { getSplitExercisePool } from "@/lib/splitAssignment";
import { browseAction, browseMovement, browseSport, followProfileSport, isBrowsingOtherSport, referenceMovementId, referenceSportId, type SportBrowseState } from "@/lib/sportBrowsing";
import { buildVariedLoadout } from "@/lib/loadoutTemplates";
import { cycleSplitIndex, splitDaysForFrequency } from "@/lib/splitCycle";
import { buildDaySlots, commitDay, dayExerciseCount, emptyDayRecord, emptyDayStore, loadDay, placeImportedDays, remapDaysForFrequency, resolveActiveSlot, sameSplit, slotForKey, visibleDayPlan, type DayRecord, type DaySettings, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { toast } from "sonner";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { EmailAuthScreen } from "@/components/EmailAuthScreen";
import { SupabaseResearchLibraryPanel } from "@/components/SupabaseResearchLibraryPanel";
import { trpc } from "@/lib/trpc";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { replayBootSplash } from "@/lib/bootSplash";
import { isLaunchExperienceEnabled, launchExperiencePreferenceKey } from "@/lib/launchExperience";
import { buildStampLabel } from "@/lib/buildStamp";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";
import type { WeeklyPrescriptionStore } from "@/lib/weeklyVolume";

type Workspace = "command" | "profile" | "progress" | "recommended" | "custom" | "day-plan" | "tracker" | "body" | "movement" | "catalog" | "genome" | "strength";
type Goal = TrainingGoal;
type StackMode = "suggested" | "custom";
type StoredAthleteProfile = { version: 1; sportId: string; goal: Goal; trainingDays: number; movementId: string; gymMinutes?: number; baseline?: AthleteBaseline };
type StoredWorkoutEntry = { entryId: number; catalogExerciseId: number };
type WorkoutEntry = Exercise & { catalogExerciseId?: number };
/**
 * A week is its saved days plus which one you were on. The day you are editing is not a
 * second copy of a stack living beside the week - it is read out of, and written back
 * to, that week's day records, so there is never a version of a day that disagrees with
 * the week that contains it.
 */
type WeekSnapshot = { days: WeeklyDayStore; activeDayIndex: number };
type StoredWeekSnapshot = { customWorkoutIds: number[]; weeklyPlanIds: Record<string, number[]>; customWorkoutEntries?: StoredWorkoutEntry[]; weeklyPlanEntries?: Record<string, StoredWorkoutEntry[]>; prescriptions: Record<number, string>; exerciseSettings: Record<number, ExerciseSettings>; weeklyPrescriptions?: WeeklyPrescriptionStore; weeklySettings?: Record<string, DaySettings>; importedPlanContext?: Record<string, ImportedRoutineContext[]>; activeDayIndex?: number };
type StoredWorkoutPlan = StoredWeekSnapshot & { version: 1 | 2; weeks?: Record<string, StoredWeekSnapshot>; activeWeek?: number };

let duplicateEntrySequence = 0;
const catalogExerciseIdFor = (exercise: WorkoutEntry) => exercise.catalogExerciseId || exercise.id;
const serializeWorkoutEntries = (workout: Exercise[]): StoredWorkoutEntry[] => workout.map((exercise) => ({ entryId: exercise.id, catalogExerciseId: catalogExerciseIdFor(exercise) }));
const duplicateWorkoutEntry = (exercise: Exercise): WorkoutEntry => ({ ...exercise, id: -(Date.now() + ++duplicateEntrySequence), catalogExerciseId: catalogExerciseIdFor(exercise) });

export function buildSmartDraftWorkout(results: MovementRecommendation[]) {
  return orderHierarchyConstructedSession(results).map((result) => result.exercise);
}

export function buildGeneratedWeekSportSeed(sportId: string, goal: TrainingGoal, limit: number, equipment?: Parameters<typeof getSportSession>[3], modifierId?: string, registryEvidence?: RegistryEvidenceMap) {
  const broaderSession = orderHierarchyConstructedSession(getSportSession(sportId, goal, Math.max(limit * 2, 12), equipment, modifierId, registryEvidence));
  const modifierText = broaderSession[0]?.hierarchy.modifier.toLowerCase() || "";
  const modifierTokens = ["acceleration", "speed", "elastic", "aerobic", "endurance", "economy", "jump", "rotation", "bracing", "mobility", "grip", "landing", "lateral", "power"];
  const hierarchyRelevant = broaderSession.filter((result) => {
    const exerciseText = `${result.exercise.name} ${result.exercise.movement} ${result.exercise.qualities.join(" ")}`.toLowerCase();
    return modifierTokens.some((token) => modifierText.includes(token) && exerciseText.includes(token));
  });
  const orderedSeed = [...hierarchyRelevant, ...broaderSession.filter((result) => !hierarchyRelevant.some((preferred) => preferred.exercise.id === result.exercise.id))].slice(0, limit);
  return orderedSeed.map((result) => result.exercise);
}

/**
 * Base names only. Each is namespaced per account at use, because a shared device
 * otherwise means one athlete reads and overwrites another's plan.
 */
const athleteProfileKeyBase = "gym-optimizer-athlete-profile-v1";
const workoutPlanKeyBase = "gym-optimizer-workout-plan-v1";
const favoriteExerciseKeyBase = "gym-optimizer-favorite-exercise-ids-v1";
// Temporary product-access switch. The email/password and passkey implementation
// remains intact below and can be restored by setting this to false.
const directWorkspaceAccess = true;
const ExerciseGenomePanel = lazy(() => import("@/components/ExerciseGenomePanel").then((module) => ({ default: module.ExerciseGenomePanel })));
const MovementAtlasPanel = lazy(() => import("@/components/MovementAtlasPanel").then((module) => ({ default: module.MovementAtlasPanel })));
const BodyLabNavigator = lazy(() => import("@/components/BodyLabNavigator").then((module) => ({ default: module.BodyLabNavigator })));
const CatalogDiscoveryPanel = lazy(() => import("@/components/CatalogDiscoveryPanel").then((module) => ({ default: module.CatalogDiscoveryPanel })));
const CatalogExerciseEvidenceCard = lazy(() => import("@/components/CatalogExerciseEvidenceCard").then((module) => ({ default: module.CatalogExerciseEvidenceCard })));
const StrengthGenomePanel = lazy(() => import("@/components/StrengthGenomePanel").then((module) => ({ default: module.StrengthGenomePanel })));
const ExerciseGenomeWorkspace = lazy(() => import("@/components/ExerciseGenomeWorkspace").then((module) => ({ default: module.ExerciseGenomeWorkspace })));
const SelectedActionConnectionCard = lazy(() => import("@/components/SelectedActionConnectionCard").then((module) => ({ default: module.SelectedActionConnectionCard })));

type NavGroup = "Home" | "Train" | "Explore" | "Sport";
const navGroups: NavGroup[] = ["Home", "Train", "Sport", "Explore"];
const navItems: { id: Workspace; label: string; icon: typeof Target; detail: string; group: NavGroup }[] = [
  { id: "command", label: "Home", icon: Target, detail: "plan context & next action", group: "Home" },
  { id: "profile", label: "About Me", icon: UsersRound, detail: "baseline & equipment", group: "Home" },
  { id: "progress", label: "Progress", icon: BarChart3, detail: "training & observation record", group: "Home" },
  { id: "day-plan", label: "Training Days", icon: Layers3, detail: "design each saved day", group: "Train" },
  { id: "tracker", label: "Tracker", icon: Activity, detail: "record completed workout sets", group: "Train" },
  { id: "recommended", label: "Recommendations", icon: Sparkles, detail: "sport-fit session plans", group: "Train" },
  { id: "custom", label: "Workout Builder", icon: SlidersHorizontal, detail: "coach-editable session", group: "Train" },
  { id: "movement", label: "Movement Atlas", icon: Move3d, detail: `${sportMovementProfiles.length} researched sport actions`, group: "Sport" },
  { id: "body", label: "Body Lab", icon: Activity, detail: "muscle-to-movement analysis", group: "Explore" },
  { id: "strength", label: "Strength Genome", icon: BrainCircuit, detail: "your performance profile", group: "Home" },
  { id: "catalog", label: "Exercise Catalog", icon: BookOpen, detail: `${exercises.length} mapped exercises`, group: "Explore" },
  { id: "genome", label: "Exercise Genome", icon: Dna, detail: "contextual exercise intelligence", group: "Explore" },
];

// FIXED DEFAULT per the Sports Genome philosophy's Mobile global navigation contract: four
// persistent labeled destinations (Home / Body Lab / Train / Progress). Sport stays a
// contextual, deep-linkable object reachable from Home/Body Lab/Progress and search rather
// than a permanent fifth tab; Profile/settings use one consistent secondary entry instead of
// occupying primary nav space, so it is intentionally absent from this array.
type PrimaryDestination = "home" | "train" | "body" | "progress" | "secondary";
type ContextualWorkspaceTab = { id: string; label: string; workspace: Workspace; scrollTarget?: string };
const primaryDestinations: { id: PrimaryDestination; label: string; icon: typeof Target; defaultWorkspace?: Workspace }[] = [
  { id: "home", label: "Home", icon: Target, defaultWorkspace: "command" },
  { id: "body", label: "Body Lab", icon: Activity, defaultWorkspace: "body" },
  { id: "train", label: "Train", icon: Layers3, defaultWorkspace: "day-plan" },
  { id: "progress", label: "Progress", icon: BarChart3, defaultWorkspace: "progress" },
];
const contextualWorkspaces: Record<Exclude<PrimaryDestination, "secondary">, ContextualWorkspaceTab[]> = {
  home: [{ id: "command", label: "Home", workspace: "command" }],
  train: [
    { id: "day-plan", label: "Training Day", workspace: "day-plan" },
    { id: "tracker", label: "Tracker", workspace: "tracker" },
    { id: "recommended", label: "Matches", workspace: "recommended" },
    { id: "custom", label: "Builder", workspace: "custom" },
    { id: "stack-review", label: "Stack Review", workspace: "day-plan", scrollTarget: "#stack-review" },
    { id: "prep", label: "Prep", workspace: "custom", scrollTarget: "#session-prep" },
  ],
  // Body Lab is the reference library: look things up, understand them. Everything
  // here is about exercises and anatomy in general, not about this athlete.
  body: [
    { id: "movement", label: "Movement", workspace: "movement" },
    { id: "body", label: "Body Lab", workspace: "body" },
    { id: "catalog", label: "Catalog", workspace: "catalog" },
    { id: "genome", label: "Genome", workspace: "genome" },
  ],
  /**
   * Progress is the athlete's own record, so logging a lift belongs here.
   *
   * Strength Genome sat under Body Lab, which meant the screen where you record a
   * lift lived behind a tab named after an anatomy viewer, while the screen
   * reporting on those lifts sat under Progress - showing "No lifts logged yet"
   * with no route to the thing that fixes it. One record, one destination.
   */
  progress: [
    { id: "progress", label: "Progress", workspace: "progress" },
    { id: "strength", label: "Strength", workspace: "strength" },
  ],
};
export function primaryDestinationForWorkspace(workspace: Workspace): PrimaryDestination {
  if (workspace === "profile") return "secondary";
  if (contextualWorkspaces.train.some((tab) => tab.workspace === workspace)) return "train";
  if (contextualWorkspaces.body.some((tab) => tab.workspace === workspace)) return "body";
  if (contextualWorkspaces.progress.some((tab) => tab.workspace === workspace)) return "progress";
  return "home";
}

export function workspaceFromLocation(value: string | null): Workspace {
  return navItems.some((item) => item.id === value) ? value as Workspace : "command";
}

const goalDetail: Record<Goal, string> = {
  Athleticism: "Explosive force, movement quality, and sport transfer.",
  "Muscle growth": "More target-tissue work with controlled fatigue.",
  "Max strength": "High force production, bracing, and compound-lift skill.",
  Capacity: "Repeatable output, work tolerance, and positional control.",
};

const initialCustomNames = ["Landmine Rotation", "Bulgarian Split Squat", "Medicine-Ball Rotational Wall Throw", "Farmer’s Walk"];
const splitKeywords: Record<SplitDay, string[]> = { Push: ["push", "press", "fly", "dip"], Pull: ["pull", "row", "curl"], Legs: ["squat", "hinge", "lunge", "calf"], Upper: ["push", "press", "pull", "row"], Lower: ["squat", "hinge", "lunge", "deadlift", "calf"], "Full Body": ["squat", "hinge", "push", "pull", "carry"], "Sport Transfer": [] };

function sportAbbrev(label: string) {
  return label === "American football" ? "Football" : label === "Brazilian jiu-jitsu" ? "BJJ" : label === "Olympic weightlifting" ? "Weightlifting" : label;
}

function prescriptionFor(index: number, goal: Goal) {
  return getGoalPrescription(goal, index);
}

export function shouldRenderMetric(detail: string) {
  return detail !== "coach-set planning marker";
}

function Metric({ label, value, detail, tone = "lime" }: { label: string; value: string; detail: string; tone?: "lime" | "orange" | "white" }) {
  if (!shouldRenderMetric(detail)) return null;
  return <div className="metric-card"><p className="metric-label">{label}</p><p className={`metric-value metric-${tone}`}>{value}</p><p className="metric-detail">{detail}</p></div>;
}

function RecommendationRow({ result, index, onAdd, onInspect }: { result: MovementRecommendation; index: number; onAdd: () => void; onInspect: () => void }) {
  const metrics = [
    ["Movement transfer", result.breakdown.movementTransferSimilarity],
    ["Muscle targeting", result.breakdown.muscleMatch],
    ["Joint action", result.breakdown.jointActionMatch],
    ["Quality", result.breakdown.physicalQualityMatch],
    ["Force path", result.breakdown.forceDirectionMatch],
    ["Stability", result.breakdown.stabilityMatch],
    ["Velocity", result.breakdown.velocityMatch],
  ];
  return <article className="recommendation-row"><div className="recommendation-row-main"><span className="recommendation-index">{String(index + 1).padStart(2, "0")}</span><button onClick={onInspect} className="recommendation-copy" aria-label={`Inspect ${result.exercise.name}`}><p>{result.exercise.name}{result.registryEvidence && <span className="ml-2 inline-flex items-center border border-[#2d6cdf]/40 bg-[#2d6cdf]/10 px-1.5 py-0.5 align-middle text-[11px] font-bold uppercase tracking-[.08em] text-[var(--sg-info-strong)]" title={result.registryEvidence.rationale ?? "Reviewed Sports Genome research-registry recommendation"}>Registry-verified</span>}</p><small>{result.preparation}</small></button><button onClick={onInspect} className="recommendation-score" aria-label={`Inspect the ${result.breakdown.overall} relative match for ${result.exercise.name}`}><strong>{result.breakdown.overall}</strong><small>match</small></button><GradeStamp grade={result.grade} score={result.breakdown.overall} compact /><button onClick={onAdd} className="recommendation-add" aria-label={`Add ${result.exercise.name} to custom workout`}><Plus className="h-4 w-4" /></button></div><details className="recommendation-why"><summary>Why this match?</summary><div className="recommendation-why-grid"><div className="recommendation-score-grid">{metrics.map(([label, value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="recommendation-evidence"><div><p>Strengths</p>{result.breakdown.strengths.map((item) => <span key={item}>+ {item}</span>)}</div><div><p>Limits</p>{result.breakdown.limitations.map((item) => <span key={item}>− {item}</span>)}</div></div></div><p className="recommendation-trace"><span>Matched to</span> <strong>{result.hierarchy.movement}</strong> <span>to build</span> <strong>{result.hierarchy.physicalQualities.slice(0, 2).join(" and ").toLowerCase()}</strong></p></details></article>;
}

function Onboarding({ onComplete }: { onComplete: (profile: { goal: Goal; trainingDays: number; sportId: string; stackMode: StackMode }) => void }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("Athleticism");
  const [trainingDays, setTrainingDays] = useState(3);
  const [sportId, setSportId] = useState("");
  const start = (stackMode: StackMode) => onComplete({ goal, trainingDays, sportId, stackMode });
  const tour = [
    [Target, "Command Center", "See the sport lens, selected movement, and the training decision driving today’s work."],
    [Move3d, "Movement Atlas", "Inspect 20 actions for each sport, including body actions, movers, stabilizers, and transfer cues."],
    [Activity, "Body Lab", "Click muscle regions to connect a sporting action to anatomy and matching exercise support."],
    [SlidersHorizontal, "Workout Builder", "Start with a transparent recommended stack or edit every exercise, prescription, and priority yourself."],
  ] as const;

  return <div className="pulse-shell"><div className="pulse-orb pulse-orb-one" /><div className="pulse-orb pulse-orb-two" /><header className="pulse-header"><div className="flex items-center gap-2"><img src={sportsGenomeAssets.circularBadge} alt="Sports Genome circular badge" className="pulse-brand-badge" /><span className="font-display text-2xl font-bold uppercase tracking-wide text-white">Sports Genome</span></div><div className="pulse-progress"><span>STEP {step + 1} / 4</span><div>{[0, 1, 2, 3].map((index) => <i key={index} className={index <= step ? "pulse-progress-on" : ""} />)}</div></div></header><main className="pulse-main">
    {step === 0 && <section className="pulse-stage"><span className="pulse-kicker">Pulse Quiz / Outcome bias</span><h1>What outcome<br /><em>should we bias first?</em></h1><p className="pulse-copy">Choose the quality your next training block should prioritize. Your sport, schedule, and stack will refine the decision next.</p><div className="pulse-option-grid">{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item, index) => <button key={item} onClick={() => setGoal(item)} className={`pulse-option ${goal === item ? "pulse-option-selected" : ""}`}><span className="pulse-option-index">0{index + 1}</span><span><strong>{item}</strong><small>{goalDetail[item]}</small></span><span className="pulse-check">{goal === item ? "✓" : ""}</span></button>)}</div><button onClick={() => setStep(1)} className="pulse-next">Set training priority <ArrowUpRight className="h-4 w-4" /></button></section>}
    {step === 1 && <section className="pulse-stage"><span className="pulse-kicker">Sport context</span><h1>Where do you<br /><em>want to perform?</em></h1><p className="pulse-copy">Choose a sport to load its researched movement demands. Nothing is selected until you choose it.</p><div className="pulse-sport-grid">{sportProfiles.map((profile, index) => <button key={profile.id} onClick={() => setSportId(profile.id)} className={`pulse-sport ${sportId === profile.id ? "pulse-sport-selected" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{sportAbbrev(profile.label)}</strong><small>{profile.movementFamilies.length} movement families</small></button>)}</div><div className="pulse-actions"><button onClick={() => setStep(0)} className="pulse-back">Back</button><button disabled={!sportId} onClick={() => setStep(2)} className="pulse-next">Continue <ArrowUpRight className="h-4 w-4" /></button></div></section>}
    {step === 2 && <section className="pulse-stage"><span className="pulse-kicker">Real-world schedule</span><h1>How many days<br /><em>can you show up?</em></h1><p className="pulse-copy">We will shape the plan to the week you can actually sustain.</p><div className="pulse-frequency-grid">{[[1, "One full-body priority"], [2, "Keep it sharp"], [3, "Build momentum"], [4, "Push progress"], [5, "Train often"], [6, "High exposure"], [7, "Daily practice"]].map(([days, detail]) => <button key={days} onClick={() => setTrainingDays(days as number)} className={`pulse-frequency ${trainingDays === days ? "pulse-frequency-selected" : ""}`}><strong>{days}</strong><span>days / week</span><small>{detail}</small></button>)}</div><div className="pulse-actions"><button onClick={() => setStep(1)} className="pulse-back">Back</button><button onClick={() => setStep(3)} className="pulse-next">Choose my start <ArrowUpRight className="h-4 w-4" /></button></div></section>}
    {step === 3 && <section className="pulse-stage"><span className="pulse-kicker">Choose your start</span><h1>Your plan is<br /><em>ready to take shape.</em></h1><div className="pulse-plan-summary"><span>{sportProfiles.find((profile) => profile.id === sportId)?.label}</span><i /> <span>{goal}</span><i /> <span>{trainingDays} days/week</span></div><div className="pulse-start-grid"><button onClick={() => start("suggested")} className="pulse-start pulse-start-primary"><Sparkles className="h-7 w-7" /><strong>Make my<br />suggested stack</strong><small>Start with a sport-aware plan, then edit every part of it.</small><span>Build my plan <ArrowUpRight className="h-4 w-4" /></span></button><button onClick={() => start("custom")} className="pulse-start"><SlidersHorizontal className="h-7 w-7" /><strong>Start<br />from scratch</strong><small>Open a blank builder and shape the session yourself.</small><span>Open builder <ArrowUpRight className="h-4 w-4" /></span></button></div><button onClick={() => setStep(2)} className="pulse-back mt-7">Back</button></section>}
  </main></div>;
}

export default function Home() {
  let { user, loading, error, isAuthenticated, logout, refresh } = useAuth();
  /**
   * Device records belong to an athlete, not to the browser. Until these were
   * namespaced, a second account on the same device read and overwrote the first
   * one's plan, profile and favourites.
   */
  /** The exact document written to the device, so sync pushes that and not a re-serialisation. */
  const [serializedPlan, setSerializedPlan] = useState<string | null>(null);
  /** Which account's plan is currently in memory, so the writer cannot cross accounts. */
  const hydratedPlanKeyRef = useRef<string | null>(null);
  const accountId = user?.id ?? null;
  const athleteProfileKey = scopedKey(athleteProfileKeyBase, accountId);
  const workoutPlanKey = scopedKey(workoutPlanKeyBase, accountId);
  const favoriteExerciseKey = scopedKey(favoriteExerciseKeyBase, accountId);

  const startLogin = () => toast.error("Please sign in with your Sports Genome email account.");

  const [workspace, setWorkspaceState] = useState<Workspace>(() => typeof window === "undefined" ? "command" : workspaceFromLocation(new URLSearchParams(window.location.search).get("workspace")));
  const dockTouchNavigationRef = useRef<{ destination: Workspace; timestamp: number } | null>(null);
  const setWorkspace = (next: Workspace) => navigateWorkspace(next);
  const [sportId, setSportId] = useState("");
  const [goal, setGoal] = useState<Goal>("Athleticism");
  const [trainingDays, setTrainingDays] = useState(3);
  const [athleteBaseline, setAthleteBaseline] = useState<AthleteBaseline>({ experience: "Intermediate", weightUnit: "lb", equipment: defaultEquipmentProfile });
  const [gymMinutes, setGymMinutes] = useState(60);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [pendingDestructiveAction, setPendingDestructiveAction] = useState<ConfirmDialogRequest | null>(null);
  const [movementId, setMovementId] = useState("");
  /** Reference-library state only: never persisted, never part of the plan. */
  const [sportBrowse, setSportBrowse] = useState<SportBrowseState>(followProfileSport);
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [inspectedExercise, setInspectedExercise] = useState<Exercise | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [genomeExerciseId, setGenomeExerciseId] = useState(1);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(defaultCatalogFilters);
  const [localFavoriteIds, setLocalFavoriteIds] = useState<number[]>([]);
  const [atlasQuery, setAtlasQuery] = useState("");
  const [atlasFamily, setAtlasFamily] = useState("All");
  const [customWorkout, setCustomWorkout] = useState<Exercise[]>(() => initialCustomNames.map((name) => exercises.find((exercise) => exercise.name === name)).filter((exercise): exercise is Exercise => Boolean(exercise)));
  const [prescriptions, setPrescriptions] = useState<Record<number, string>>({});
  const [exerciseSettings, setExerciseSettings] = useState<Record<number, ExerciseSettings>>({});
  /** The saved week: one record per training day. Nothing else stores a day's work. */
  const [dayStore, setDayStore] = useState<WeeklyDayStore>(emptyDayStore);
  const [planWeeks, setPlanWeeks] = useState<Record<number, WeekSnapshot>>({});
  const [activeWeek, setActiveWeek] = useState(1);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [planHydrated, setPlanHydrated] = useState(false);
  const [activeSplitDay, setActiveSplitDay] = useState<SplitDay>("Sport Transfer");
  const [activeSplitDayIndex, setActiveSplitDayIndex] = useState(0);
  const [activeLoadout, setActiveLoadout] = useState<LoadoutMode>("Sport Transfer");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [sessionMode, setSessionMode] = useState(false);
  const [loggerScrollRequest, setLoggerScrollRequest] = useState(0);
  const [activeContextTab, setActiveContextTab] = useState<string | null>(null);
  const [searchReturn, setSearchReturn] = useState<{ workspace: Workspace; label: string } | null>(null);
  const [trackerSessionLive, setTrackerSessionLive] = useState(false);
  const [launchExperienceEnabled, setLaunchExperienceEnabled] = useState(true);
  const favoriteQuery = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const favoriteMutation = trpc.favorites.set.useMutation();

  const selectedSport = sportProfiles.find((profile) => profile.id === sportId) || sportProfiles[0];
  const activeSportId = sportId || selectedSport.id;
  const gymTimeBudget = getGymTimeBudget(gymMinutes);
  const favoriteIds = useMemo(() => new Set<number>([...localFavoriteIds, ...(favoriteQuery.data || [])]), [localFavoriteIds, favoriteQuery.data]);
  // Grounds recommendation scoring in reviewed Sports Genome research-registry (Supabase) evidence
  // for this sport when it exists, rather than the local heuristic model alone.
  const sportProfileQuery = trpc.sportsGenome.profile.useQuery({ sportId: activeSportId }, { staleTime: 5 * 60 * 1000 });
  const registryEvidenceMap = useMemo<RegistryEvidenceMap>(() => {
    const map: RegistryEvidenceMap = new Map();
    if (sportProfileQuery.data?.status === "connected") {
      for (const recommendation of sportProfileQuery.data.recommendations) {
        if (recommendation.catalogExerciseId === null) continue;
        map.set(recommendation.catalogExerciseId, {
          confidenceScore: recommendation.confidenceScore,
          rationale: recommendation.rationale,
          recommendationRole: recommendation.recommendationRole,
        });
      }
    }
    return map;
  }, [sportProfileQuery.data]);
  const sportMovements = useMemo(() => sportMovementProfiles.filter((profile) => profile.sportId === activeSportId), [activeSportId]);
  const selectedMovement = sportMovements.find((movement) => movement.id === movementId) || findSportMovement(activeSportId);
  /**
   * What the reference library is showing, which is not always the athlete's sport.
   *
   * The Movement Atlas and the Body Lab exist to look things up. Choosing Soccer
   * there used to call the same handler the profile uses, so reading another
   * sport's actions rewrote the athlete's own sport and cleared every saved
   * training day. These two screens now follow a browse overlay; every screen
   * the athlete's plan is built from keeps reading `activeSportId` below, so
   * browsing cannot reach a single one of them.
   */
  const browseSportId = referenceSportId(activeSportId, sportBrowse);
  const browsingOtherSport = isBrowsingOtherSport(activeSportId, sportBrowse);
  const referenceMovements = useMemo(() => browseSportId === activeSportId ? sportMovements : sportMovementProfiles.filter((profile) => profile.sportId === browseSportId), [activeSportId, browseSportId, sportMovements]);
  const referenceMovement = referenceMovements.find((movement) => movement.id === referenceMovementId(movementId, sportBrowse)) || findSportMovement(browseSportId);
  const browseSportLabel = sportProfiles.find((profile) => profile.id === browseSportId)?.label || browseSportId;
  const enrichedSelectedMovement = lookupEnrichedMovement(activeSportId, selectedMovement.id);
  const movementRecommendations = useMemo(() => getMovementRecommendations(selectedMovement, 6, athleteBaseline.sportModifierId, registryEvidenceMap), [selectedMovement, athleteBaseline.sportModifierId, registryEvidenceMap]);
  const sessionRecommendations = useMemo(() => getSportSession(activeSportId, goal, gymTimeBudget.recommendationLimit, athleteBaseline.equipment, athleteBaseline.sportModifierId, registryEvidenceMap), [activeSportId, goal, gymTimeBudget.recommendationLimit, athleteBaseline.equipment, athleteBaseline.sportModifierId, registryEvidenceMap]);
  const sportProgrammingContext = useMemo(() => getSportProgrammingContext(activeSportId, athleteBaseline.sportModifierId), [activeSportId, athleteBaseline.sportModifierId]);
  const splitDays = useMemo(() => splitDaysForFrequency(trainingDays), [trainingDays]);
  const daySlots = useMemo(() => buildDaySlots(splitDays), [splitDays]);
  /**
   * The active day, resolved rather than remembered.
   *
   * The position and the split label were previously two independent pieces of state,
   * and every screen keyed off whichever it happened to read. When they disagreed - a
   * changed frequency, a restored week - the app wrote a day's stack under a slot that
   * did not exist. One derived slot means they cannot disagree.
   */
  const activeSlot = useMemo(() => resolveActiveSlot(splitDays, activeSplitDayIndex, activeSplitDay), [splitDays, activeSplitDayIndex, activeSplitDay]);
  const activeDayIndex = activeSlot.index;
  const activeDayKey = activeSlot.key;
  const activeDayLabel = `Week ${activeWeek} · ${activeSlot.ordinal} · ${activeSlot.day}`;
  /** The day the working draft belongs to, so an edit can never be filed against another day. */
  const draftDayKeyRef = useRef(activeSlot.key);
  const splitDaysRef = useRef(splitDays);
  const activeDraft = (): DayRecord => ({ workout: customWorkout, prescriptions, settings: exerciseSettings, context: dayStore.context[draftDayKeyRef.current] || [] });
  const adoptActiveDay = (slot: DaySlot, record: DayRecord) => {
    draftDayKeyRef.current = slot.key;
    setActiveSplitDayIndex(slot.index);
    setActiveSplitDay(slot.day);
    setCustomWorkout(record.workout);
    setPrescriptions(record.prescriptions);
    setExerciseSettings(record.settings);
  };
  const visibleWeek = useMemo(() => visibleDayPlan(dayStore, splitDays), [dayStore, splitDays]);
  const weeklyPlan = visibleWeek.plan;
  const weeklyPrescriptions: WeeklyPrescriptionStore = visibleWeek.prescriptions;
  const savedDayCount = (store: WeeklyDayStore) => Object.values(visibleDayPlan(store, splitDays).plan).filter((day) => day.length).length;

  /**
   * Changing how many days a week you train must not lose the days you already built.
   *
   * Saved days are addressed by position and split label, so raising the frequency used
   * to rename every slot underneath the athlete: the work stayed in storage while the
   * week read as empty. The records are rehomed with the split, and the day being edited
   * follows its own record rather than snapping back to Day 01.
   */
  useEffect(() => {
    const previous = splitDaysRef.current;
    // Hold still until both halves of the saved plan are in memory, or the reconciliation
    // would run against a default split and shuffle a week it has not actually read yet.
    if (!profileHydrated || !planHydrated) { splitDaysRef.current = splitDays; return; }
    if (sameSplit(previous, splitDays)) return;
    splitDaysRef.current = splitDays;
    const committed = commitDay(dayStore, draftDayKeyRef.current, activeDraft());
    const { store, moved } = remapDaysForFrequency(committed, previous, splitDays);
    const carried = moved[draftDayKeyRef.current];
    const slot = (carried && slotForKey(splitDays, carried)) || resolveActiveSlot(splitDays, activeSplitDayIndex, activeSplitDay);
    setDayStore(store);
    adoptActiveDay(slot, loadDay(store, slot.key));
  }, [splitDays, profileHydrated, planHydrated]);

  /**
   * One route in and out of a training day.
   *
   * Whatever moved the marker - the day strip, the weekly rail, the tracker, the planner
   * dock - the departing day's work is written to the week first and the arriving day is
   * then read back whole. Nothing is merged, so the day you open shows its own sets and
   * only its own.
   */
  useEffect(() => {
    const departing = draftDayKeyRef.current;
    if (departing === activeSlot.key) return;
    const carried = commitDay(dayStore, departing, activeDraft());
    setDayStore(carried);
    adoptActiveDay(activeSlot, loadDay(carried, activeSlot.key));
  }, [activeSlot.key]);

  /**
   * Every edit belongs to the day it was made on, the moment it is made.
   *
   * Saving used to be a button an athlete had to remember, and anything built between
   * two presses of it was discarded by the next day switch, week switch or paste. There
   * is nothing left to forget: the draft is written through to its day on change.
   */
  useEffect(() => {
    if (!planHydrated || !onboardingComplete) return;
    const key = draftDayKeyRef.current;
    setDayStore((current) => commitDay(current, key, { workout: customWorkout, prescriptions, settings: exerciseSettings }));
  }, [planHydrated, onboardingComplete, customWorkout, prescriptions, exerciseSettings]);

  useEffect(() => {
    if (!sessionMode) return;
    setSessionMode(false);
    navigateWorkspace("tracker");
  }, [sessionMode]);
  const draftedLoadout = useMemo(() => {
    const sportSeed = getSportSession(activeSportId, goal, Math.max(8, gymTimeBudget.recommendationLimit + 3), athleteBaseline.equipment, athleteBaseline.sportModifierId, registryEvidenceMap).map((item) => item.exercise);
    const pool = filterStackForEquipment(getSplitExercisePool(exercises, activeSplitDay, sportSeed), athleteBaseline.equipment);
    return buildVariedLoadout(pool, activeSplitDay === "Sport Transfer" ? sportSeed : [], activeLoadout, gymTimeBudget.recommendationLimit);
  }, [activeSportId, goal, activeSplitDay, activeLoadout, gymTimeBudget.recommendationLimit, athleteBaseline.equipment, athleteBaseline.sportModifierId, registryEvidenceMap]);
  /**
   * What the draft would cost in time, at the current settings.
   *
   * Stated before the draft is made rather than discovered after it: choosing a
   * 30-minute window and being handed 50 minutes of work is how the time control
   * would quietly become decorative.
   */
  const draftedLoadoutMinutes = useMemo(
    () => getWorkoutDiagnostics(draftedLoadout, {}, {}, goal, gymMinutes).estimatedMinutes,
    [draftedLoadout, goal, gymMinutes],
  );
  const movementSignals = getMovementSignals(selectedMovement);
  const movementMuscles = getMovementMuscles(selectedMovement);
  const bodyLabRoleContext = getBodyLabRoleContext(activeSportId, selectedMovement.id, movementMuscles, movementSignals.includes("rotation") ? ["abs", "obliques", "glutes"] : ["abs", "glutes"]);
  /**
   * The same three, resolved for whatever the reference library is showing.
   *
   * Identical to the three above whenever the athlete is on their own sport, so
   * the Body Lab is unchanged at rest; only a browsed sport makes them diverge.
   */
  const referenceSignals = getMovementSignals(referenceMovement);
  const referenceMuscles = getMovementMuscles(referenceMovement);
  const referenceRoleContext = browsingOtherSport
    ? getBodyLabRoleContext(browseSportId, referenceMovement.id, referenceMuscles, referenceSignals.includes("rotation") ? ["abs", "obliques", "glutes"] : ["abs", "glutes"])
    : bodyLabRoleContext;
  const filteredCatalog = useMemo(() => exercises.filter((exercise) => `${exercise.name} ${exercise.movement} ${exercise.primaryMuscles.join(" ")}`.toLowerCase().includes(catalogQuery.toLowerCase())).slice(0, 24), [catalogQuery]);
  const genomeExercise = exercises.find((exercise) => exercise.id === genomeExerciseId) || exercises[0];
  const completedExerciseCount = customWorkout.filter((exercise) => exerciseSettings[exercise.id]?.completed).length;
  const activePlanStatus = customWorkout.length ? `${customWorkout.length} staged` : "Build a day";
  const activePlanStatusDetail = customWorkout.length ? `${completedExerciseCount} marked complete in the active workspace` : "No exercises are staged in the current Training Day";
  const createWeekSnapshot = (): WeekSnapshot => ({
    days: commitDay(dayStore, draftDayKeyRef.current, activeDraft()),
    activeDayIndex: activeSlot.index,
  });
  /**
   * The stored document keeps the loose active-stack fields alongside the per-day
   * records, so a plan written here still opens in a build that predates them.
   */
  const serializeWeekSnapshot = (snapshot: WeekSnapshot): StoredWeekSnapshot => {
    const slot = resolveActiveSlot(splitDays, snapshot.activeDayIndex, splitDays[snapshot.activeDayIndex] || splitDays[0]);
    const draft = loadDay(snapshot.days, slot.key);
    return {
      customWorkoutIds: draft.workout.map((exercise) => exercise.id),
      weeklyPlanIds: Object.fromEntries(Object.entries(snapshot.days.plan).map(([key, workout]) => [key, workout.map((exercise) => exercise.id)])),
      customWorkoutEntries: serializeWorkoutEntries(draft.workout),
      weeklyPlanEntries: Object.fromEntries(Object.entries(snapshot.days.plan).map(([key, workout]) => [key, serializeWorkoutEntries(workout)])),
      prescriptions: draft.prescriptions,
      exerciseSettings: draft.settings,
      weeklyPrescriptions: snapshot.days.prescriptions,
      weeklySettings: snapshot.days.settings,
      importedPlanContext: snapshot.days.context,
      activeDayIndex: snapshot.activeDayIndex,
    };
  };
  const restoreWeekSnapshot = (snapshot: StoredWeekSnapshot): WeekSnapshot => {
    const fromIds = (ids: number[]) => ids.map((id) => exercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is Exercise => Boolean(exercise));
    const fromEntries = (entries: StoredWorkoutEntry[] | undefined, fallbackIds: number[] = []) => entries?.map((entry) => { const catalogExercise = exercises.find((exercise) => exercise.id === entry.catalogExerciseId); return catalogExercise ? { ...catalogExercise, id: entry.entryId, ...(entry.entryId === entry.catalogExerciseId ? {} : { catalogExerciseId: entry.catalogExerciseId }) } : null; }).filter((exercise): exercise is Exercise => Boolean(exercise)) || fromIds(fallbackIds);
    const planKeys = new Set([...Object.keys(snapshot.weeklyPlanEntries || {}), ...Object.keys(snapshot.weeklyPlanIds || {})]);
    const days: WeeklyDayStore = {
      plan: Object.fromEntries(Array.from(planKeys).map((key) => [key, fromEntries(snapshot.weeklyPlanEntries?.[key], snapshot.weeklyPlanIds?.[key] || [])])),
      prescriptions: snapshot.weeklyPrescriptions || {},
      settings: snapshot.weeklySettings || {},
      context: snapshot.importedPlanContext || {},
    };
    const activeDayIndex = Math.max(0, Math.min(splitDays.length - 1, snapshot.activeDayIndex ?? 0));
    const slot = resolveActiveSlot(splitDays, activeDayIndex, splitDays[activeDayIndex] || splitDays[0]);
    /**
     * A plan saved before a day owned its own prescriptions kept the open day's stack,
     * sets and effort in three loose top-level maps. Fold them into the day they were
     * built for rather than letting them apply to every day at once, or to none.
     */
    const stored = days.plan[slot.key] || [];
    const workout = stored.length ? stored : fromEntries(snapshot.customWorkoutEntries, snapshot.customWorkoutIds || []);
    if (!workout.length) return { days, activeDayIndex: slot.index };
    return {
      days: commitDay(days, slot.key, {
        workout,
        prescriptions: { ...(snapshot.prescriptions || {}), ...(days.prescriptions[slot.key] || {}) },
        settings: { ...(snapshot.exerciseSettings || {}), ...(days.settings[slot.key] || {}) },
      }),
      activeDayIndex: slot.index,
    };
  };

  useEffect(() => {
    try {
      const stored = readScopedRecord(athleteProfileKeyBase, accountId, window.localStorage);
      if (stored) {
        const profile = JSON.parse(stored) as StoredAthleteProfile;
        if (profile.version === 1 && sportProfiles.some((sport) => sport.id === profile.sportId)) {
          setSportId(profile.sportId);
          setGoal(profile.goal);
          setTrainingDays(Math.max(1, Math.min(7, profile.trainingDays)));
          setGymMinutes(Math.max(30, Math.min(90, profile.gymMinutes || 60)));
          if (profile.baseline) {
            setAthleteBaseline({ ...profile.baseline, equipment: profile.baseline.equipment || defaultEquipmentProfile });
            // An athlete who entered a weight before the log existed should not
            // look like they have no history; seeded once, never re-applied.
            const seeded = seedBodyWeightLog(loadBodyWeightLog(), profile.baseline.bodyWeight, profile.baseline.weightUnit || "lb");
            if (seeded.length) saveBodyWeightLog(seeded);
          }
          setMovementId(profile.movementId);
          setOnboardingComplete(true);
        }
      }
    } catch { /* Stored context is optional and may be cleared safely. */ }
    setProfileHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const enabled = isLaunchExperienceEnabled(window.localStorage.getItem(launchExperiencePreferenceKey));
      setLaunchExperienceEnabled(enabled);
    } catch { /* Launch preferences are optional and default to enabled. */ }
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(favoriteExerciseKey) || "[]") as unknown;
      if (Array.isArray(stored)) setLocalFavoriteIds(stored.filter((id): id is number => typeof id === "number" && exercises.some((exercise) => exercise.id === id)));
    } catch { /* Favorites fall back to an empty local shortlist. */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(favoriteExerciseKey, JSON.stringify(localFavoriteIds)); } catch { /* Device storage is an optional fallback. */ }
  }, [localFavoriteIds]);

  useEffect(() => {
    // Wait for auth to settle: the key is account-scoped, and hydrating from the
    // wrong one would either show an empty plan or another athlete's.
    if (loading) return;
    // And wait for the saved profile, because the athlete's training frequency decides
    // which day slots exist. Reading the week against a default split would resolve the
    // active day to a slot the athlete does not train.
    if (!profileHydrated) return;
    if (hydratedPlanKeyRef.current === workoutPlanKey) return;
    try {
      const stored = readScopedRecord(workoutPlanKeyBase, accountId, window.localStorage);
      if (stored) {
        const plan = JSON.parse(stored) as StoredWorkoutPlan;
        const legacy: StoredWeekSnapshot = { customWorkoutIds: plan.customWorkoutIds || [], weeklyPlanIds: plan.weeklyPlanIds || {}, customWorkoutEntries: plan.customWorkoutEntries, weeklyPlanEntries: plan.weeklyPlanEntries, prescriptions: plan.prescriptions || {}, exerciseSettings: plan.exerciseSettings || {}, weeklyPrescriptions: plan.weeklyPrescriptions || {}, weeklySettings: plan.weeklySettings, importedPlanContext: plan.importedPlanContext || {}, activeDayIndex: plan.activeDayIndex };
        const restoredWeeks = Object.fromEntries(Object.entries(plan.weeks || { "1": legacy }).map(([week, snapshot]) => [Number(week), restoreWeekSnapshot(snapshot)]));
        const nextActiveWeek = Math.max(1, Math.min(3, plan.activeWeek || 1));
        const activeSnapshot = restoredWeeks[nextActiveWeek] || restoredWeeks[1] || restoreWeekSnapshot(legacy);
        const slot = resolveActiveSlot(splitDays, activeSnapshot.activeDayIndex, splitDays[activeSnapshot.activeDayIndex] || splitDays[0]);
        setPlanWeeks(restoredWeeks);
        setActiveWeek(nextActiveWeek);
        setDayStore(activeSnapshot.days);
        adoptActiveDay(slot, loadDay(activeSnapshot.days, slot.key));
      }
    } catch { /* A malformed saved plan should never block the workout builder. */ }
    setPlanHydrated(true);
    hydratedPlanKeyRef.current = workoutPlanKey;
  }, [workoutPlanKey, loading, profileHydrated]);

  useEffect(() => {
    if (!profileHydrated || !onboardingComplete || !sportId) return;
    const profile: StoredAthleteProfile = { version: 1, sportId, goal, trainingDays, gymMinutes, movementId: selectedMovement.id, baseline: athleteBaseline };
    try { window.localStorage.setItem(athleteProfileKey, JSON.stringify(profile)); } catch { /* Persistence is optional. */ }
  }, [profileHydrated, onboardingComplete, sportId, goal, trainingDays, gymMinutes, movementId, selectedMovement.id, athleteBaseline]);

  /**
   * The account's copy of the plan, alongside the device's.
   *
   * The device copy stays the source of truth while editing - instant, offline-safe,
   * and what the builder already reads. This adds the account copy so a week built
   * on a phone is there on a laptop.
   */
  const adoptServerPlan = useCallback((incoming: string) => {
    try {
      window.localStorage.setItem(workoutPlanKey, incoming);
    } catch { /* The plan is still adopted in memory below. */ }
    // Re-run hydration against the adopted document rather than duplicating the
    // parsing here: one reader, one set of rules.
    hydratedPlanKeyRef.current = null;
    setPlanHydrated(false);
  }, [workoutPlanKey]);

  const planSync = usePlanSync({
    enabled: isAuthenticated && onboardingComplete,
    planJson: serializedPlan,
    planVersion: 2,
    onAdoptServerPlan: adoptServerPlan,
  });

  useEffect(() => {
    if (!planHydrated || !onboardingComplete) return;
    // Hydration for this key has to have happened first, or the plan still in memory
    // from the previous account would be written into this one's record.
    if (hydratedPlanKeyRef.current !== workoutPlanKey) return;
    const currentWeek = createWeekSnapshot();
    const allWeeks = { ...planWeeks, [activeWeek]: currentWeek };
    const plan: StoredWorkoutPlan = {
      version: 2,
      ...serializeWeekSnapshot(currentWeek),
      weeks: Object.fromEntries(Object.entries(allWeeks).map(([week, snapshot]) => [week, serializeWeekSnapshot(snapshot)])),
      activeWeek,
    };
    const serialized = JSON.stringify(plan);
    setSerializedPlan(serialized);
    try { window.localStorage.setItem(workoutPlanKey, serialized); } catch { /* Persistence is optional. */ }
  }, [planHydrated, onboardingComplete, workoutPlanKey, customWorkout, prescriptions, exerciseSettings, dayStore, planWeeks, activeWeek, splitDays]);

  // A new action is a new map; whatever was selected on the old one is not
  // selected on this one. It used to pick the action's first muscle here, which
  // is how a page nobody had touched came to say "Selected muscle: Pectoralis".
  useEffect(() => { setActiveMuscle(null); }, [selectedMovement.id]);

  const resetSportSelection = () => {
    setSportId("");
    setMovementId("");
    setAthleteBaseline((current) => ({ ...current, sportModifierId: undefined }));
    setOnboardingComplete(false);
    setDayStore(emptyDayStore());
    setPlanWeeks({});
    setActiveWeek(1);
    try { window.localStorage.removeItem(athleteProfileKey); } catch { /* Reset remains usable without storage. */ }
    toast("Sport selection reset", { description: "Choose a sport again in the Pulse Quiz before building a new sport-aware plan." });
  };

  const chooseSport = (id: string) => {
    if (!id) {
      setPendingDestructiveAction({
        title: "Reset sport selection?",
        body: "This clears your current sport, sends you back through the Pulse Quiz, and removes every saved training day across all weeks. This cannot be undone.",
        confirmLabel: "Reset sport",
        onConfirm: resetSportSelection,
      });
      return;
    }
    const changed = Boolean(sportId) && sportId !== id;
    if (changed) {
      const previous = { sportId, movementId, activeMuscle, dayStore, planWeeks, activeWeek, catalogQuery, catalogFilters, activeDayIndex: activeSlot.index };
      const undoSwitch = () => {
        setSportId(previous.sportId);
        setMovementId(previous.movementId);
        setActiveMuscle(previous.activeMuscle ?? null);
        setDayStore(previous.dayStore);
        setPlanWeeks(previous.planWeeks);
        setActiveWeek(previous.activeWeek);
        setCatalogQuery(previous.catalogQuery);
        setCatalogFilters(previous.catalogFilters);
        const restored = resolveActiveSlot(splitDays, previous.activeDayIndex, splitDays[previous.activeDayIndex] || splitDays[0]);
        adoptActiveDay(restored, loadDay(previous.dayStore, restored.key));
      };
      setDayStore(emptyDayStore());
      adoptActiveDay(daySlots[0], emptyDayRecord());
      setPlanWeeks({});
      setActiveWeek(1);
      setCatalogQuery("");
      setCatalogFilters(defaultCatalogFilters);
      toast("Sport changed", { description: "Saved training days for the previous sport were cleared.", action: { label: "Undo", onClick: undoSwitch } });
    }
    setSportId(id);
    const first = sportMovementProfiles.find((movement) => movement.sportId === id);
    if (first) {
      setMovementId(first.id);
      setActiveMuscle(null);
    }
  };
  const navigateWorkspace = (next: Workspace) => {
    setActiveContextTab(null);
    // Any ordinary navigation supersedes the return context a search result left.
    setSearchReturn(null);
    /**
     * Browsing lives in the reference library and does not outlive it.
     *
     * The Atlas and the Body Lab are one destination, so moving between them
     * keeps the sport you are reading. Leaving for Train, Home or Progress drops
     * it - otherwise it becomes a mode the athlete cannot see from screens that
     * do not honour it, and coming back days later would show someone else's
     * sport with no memory of having asked for it.
     */
    if (primaryDestinationForWorkspace(next) !== "body") setSportBrowse(followProfileSport);
    // The active day no longer needs correcting on arrival: it is resolved from the split
    // on every render, so it cannot be pointing at a day this week does not have.
    setWorkspaceState(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("workspace") !== next) {
      url.searchParams.set("workspace", next);
      window.history.pushState({ workspace: next }, "", url);
    }
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };
  const navigateDockDestination = (next: Workspace, event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (event.type === "pointerup" && "pointerType" in event && event.pointerType !== "mouse") {
      dockTouchNavigationRef.current = { destination: next, timestamp: Date.now() };
      navigateWorkspace(next);
      return;
    }
    const handledTouch = dockTouchNavigationRef.current;
    if (handledTouch && handledTouch.destination === next && Date.now() - handledTouch.timestamp < 650) {
      dockTouchNavigationRef.current = null;
      return;
    }
    navigateWorkspace(next);
  };
  // The tracker's day chooser is pre-session setup. Once a session is running
  // it is dead weight above the execution surface, and the "Live workout glance
  // contract" wants the active exercise and set legible on the first view.
  useEffect(() => {
    const syncTrackerSession = () => setTrackerSessionLive(hasActiveDeviceSession());
    syncTrackerSession();
    window.addEventListener(deviceWorkoutHistoryEvent, syncTrackerSession);
    return () => window.removeEventListener(deviceWorkoutHistoryEvent, syncTrackerSession);
  }, []);

  useEffect(() => {
    const restoreWorkspace = () => {
      // Browser Back is its own return path, so the search return bar goes with it.
      setSearchReturn(null);
      setWorkspaceState(workspaceFromLocation(new URLSearchParams(window.location.search).get("workspace")));
    };
    window.addEventListener("popstate", restoreWorkspace);
    return () => window.removeEventListener("popstate", restoreWorkspace);
  }, []);
  const addExercise = (exercise: Exercise) => setCustomWorkout((current) => {
    if (current.some((item) => catalogExerciseIdFor(item) === exercise.id)) {
      toast("Already in this workout", { description: `${exercise.name} is already part of the active session.` });
      return current;
    }
    toast("Exercise added", { description: `${exercise.name} was added to the active session.` });
    return [...current, exercise];
  });
  const toggleFavorite = (exercise: Exercise) => {
    const currentlyFavorite = favoriteIds.has(exercise.id);
    setLocalFavoriteIds((current) => currentlyFavorite ? current.filter((id) => id !== exercise.id) : Array.from(new Set([...current, exercise.id])));
    favoriteMutation.mutate({ catalogExerciseId: exercise.id, favorited: !currentlyFavorite }, {
      onSuccess: (ids) => {
        setLocalFavoriteIds(ids);
        void favoriteQuery.refetch();
        toast(currentlyFavorite ? "Removed from favorites" : "Saved to favorites", { description: `${exercise.name} is ${currentlyFavorite ? "no longer" : "now"} on your shortlist.` });
      },
      onError: () => toast("Saved on this device", { description: "Your favorite is available locally and will sync when account storage is available." }),
    });
  };
  const importRoutine = (routine: ImportedRoutine) => {
    const importedDays = routine.days.filter((day) => day.items.length);
    if (!importedDays.length) return;
    // Each pasted day claims its own slot. Two days of the same family used to resolve to
    // the same one and the second quietly replaced the first.
    const { placements, unplacedLabels } = placeImportedDays(importedDays.map((day) => day.label), splitDays);
    // Whatever is open right now is part of the week too, so it is written down before
    // the paste lands rather than being the one day a paste can destroy.
    let nextStore = commitDay(dayStore, draftDayKeyRef.current, activeDraft());
    const overwrittenDayLabels: string[] = [];
    let landingSlot: DaySlot | null = null;
    let matchedCount = 0;
    for (const placement of placements) {
      const day = importedDays[placement.pastedIndex];
      const slot = daySlots[placement.slotIndex];
      const unique = day.items.filter((item, itemIndex) => day.items.findIndex((candidate) => candidate.exercise.id === item.exercise.id) === itemIndex);
      const dayExercises = unique.map((item) => item.exercise);
      if (dayExerciseCount(nextStore, slot.key)) overwrittenDayLabels.push(`${slot.ordinal} · ${slot.day}`);
      nextStore = commitDay(nextStore, slot.key, {
        workout: dayExercises,
        prescriptions: Object.fromEntries(unique.map((item) => [item.exercise.id, item.prescription])),
        settings: Object.fromEntries(unique.map((item) => [item.exercise.id, { rpe: item.rpe || "RPE 7", rest: item.rest || "90 sec", notes: item.notes || "", completed: false }])),
        context: day.context,
      });
      matchedCount += dayExercises.length;
      if (!landingSlot) landingSlot = slot;
    }
    setDayStore(nextStore);
    if (landingSlot) adoptActiveDay(landingSlot, loadDay(nextStore, landingSlot.key));
    navigateWorkspace("day-plan");
    setImportOpen(false);
    toast("Routine loaded", {
      description: overwrittenDayLabels.length
        ? `${placements.length}-day routine loaded with ${matchedCount} matched exercise${matchedCount === 1 ? "" : "s"}. Replaced your previously saved ${overwrittenDayLabels.join(", ")}.`
        : `${placements.length}-day routine loaded with ${matchedCount} matched exercise${matchedCount === 1 ? "" : "s"}.`,
    });
    // A pasted day with nowhere to go is reported rather than dropped onto a day that
    // already has work in it.
    if (unplacedLabels.length) toast("Some pasted days did not fit this week", {
      description: `You train ${splitDays.length} day${splitDays.length === 1 ? "" : "s"} a week, so ${unplacedLabels.join(", ")} ${unplacedLabels.length === 1 ? "was" : "were"} left out. Raise your days per week in About Me, then paste again to keep ${unplacedLabels.length === 1 ? "it" : "them"}.`,
    });
  };
  const removeExercise = (id: number) => {
    const removedIndex = customWorkout.findIndex((exercise) => exercise.id === id);
    if (removedIndex === -1) return;
    const removed = customWorkout[removedIndex];
    const removedPrescription = prescriptions[id];
    const removedSettings = exerciseSettings[id];
    setCustomWorkout((current) => current.filter((exercise) => exercise.id !== id));
    toast(`${removed.name} removed`, {
      action: {
        label: "Undo",
        onClick: () => {
          setCustomWorkout((current) => current.some((exercise) => exercise.id === id) ? current : [...current.slice(0, removedIndex), removed, ...current.slice(removedIndex)]);
          if (removedPrescription !== undefined) setPrescriptions((current) => ({ ...current, [id]: removedPrescription }));
          if (removedSettings !== undefined) setExerciseSettings((current) => ({ ...current, [id]: removedSettings }));
        },
      },
    });
  };
  const duplicateExercise = (exercise: Exercise, prescription: string, settings: ExerciseSettings) => {
    const duplicate = duplicateWorkoutEntry(exercise);
    setCustomWorkout((current) => [...current, duplicate]);
    setPrescriptions((current) => ({ ...current, [duplicate.id]: prescription }));
    setExerciseSettings((current) => ({ ...current, [duplicate.id]: { ...settings, completed: false } }));
  };
  const replaceExercise = (outgoing: Exercise, incoming: Exercise) => {
    if (outgoing.id === incoming.id || customWorkout.some((exercise) => exercise.id === incoming.id)) return;
    setCustomWorkout((current) => current.map((exercise) => exercise.id === outgoing.id ? incoming : exercise));
    setPrescriptions((current) => {
      const { [outgoing.id]: previous, ...rest } = current;
      return { ...rest, ...(previous ? { [incoming.id]: previous } : {}) };
    });
    setExerciseSettings((current) => {
      const { [outgoing.id]: previous, ...rest } = current;
      return { ...rest, ...(previous ? { [incoming.id]: previous } : {}) };
    });
    toast("Stack correction applied", { description: `${outgoing.name} was replaced with ${incoming.name}; its prescription and coaching settings were preserved.` });
  };
  const moveExercise = (exerciseId: number, direction: -1 | 1) => setCustomWorkout((current) => {
    const from = current.findIndex((exercise) => exercise.id === exerciseId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= current.length) return current;
    const next = [...current];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  });
  /**
   * A draft replaces the open day, and only the open day. Clearing the loose prescription
   * and settings maps used to clear them for every day at once, because they were shared.
   */
  const applyDraftToActiveDay = (stack: Exercise[]) => {
    setCustomWorkout(stack);
    setPrescriptions(Object.fromEntries(stack.map((exercise, index) => [exercise.id, prescriptionFor(index, goal)])));
    setExerciseSettings({});
  };
  const loadDraft = () => {
    applyDraftToActiveDay(draftedLoadout);
    toast("Draft loaded", { description: `${activeSlot.ordinal} · ${activeSplitDay} is now built with the ${activeLoadout} orientation.` });
  };
  const loadSmartDraft = () => {
	    applyDraftToActiveDay(draftedLoadout);
	    toast("Smart draft loaded", { description: `A diversified ${activeSplitDay.toLowerCase()} session is ready for review.` });
  };
  const updateExerciseSettings = (exerciseId: number, patch: Partial<ExerciseSettings>) => setExerciseSettings((current) => ({ ...current, [exerciseId]: { ...getExerciseSettings(current, exerciseId), ...patch } }));
  useEffect(() => {
    const duplicateFromPrescription = (event: Event) => {
      const detail = (event as CustomEvent<{ exercise?: Exercise; prescription?: string; settings?: ExerciseSettings }>).detail;
      if (detail?.exercise && detail.prescription && detail.settings) duplicateExercise(detail.exercise, detail.prescription, detail.settings);
    };
    window.addEventListener("duplicate-training-exercise", duplicateFromPrescription);
    return () => window.removeEventListener("duplicate-training-exercise", duplicateFromPrescription);
  }, [customWorkout, prescriptions, exerciseSettings]);
  useEffect(() => {
    const applyApprovedProgression = (event: Event) => {
      const recommendation = (event as CustomEvent<{ exerciseId: number; exerciseName: string; action: string; rationale: string }>).detail;
      if (!recommendation?.exerciseId) return;
      setExerciseSettings((current) => {
        const existing = getExerciseSettings(current, recommendation.exerciseId);
        return { ...current, [recommendation.exerciseId]: { ...existing, notes: buildApprovedProgressionNote(recommendation, existing.notes) } };
      });
      toast("Progression note applied", { description: `${recommendation.exerciseName} now has an athlete-approved next-session note in the planner.` });
    };
    window.addEventListener(PROGRESSION_APPROVAL_EVENT, applyApprovedProgression);
    const applyApprovedSegmentPriority = (event: Event) => {
      const signal = (event as CustomEvent<{ muscle: string; rationale: string }>).detail;
      if (!signal?.muscle) return;
      const target = customWorkout.find((exercise) => exercise.primaryMuscles.includes(signal.muscle));
      if (!target) { toast("No direct exercise in this day", { description: "The segment focus was not applied because this Training Day has no directly tagged exercise for it." }); return; }
      setExerciseSettings((current) => {
        const existing = getExerciseSettings(current, target.id);
        return { ...current, [target.id]: { ...existing, notes: buildApprovedSegmentPriorityNote(signal, existing.notes) } };
      });
      toast("Segment focus added", { description: `${target.name} now carries an athlete-approved ${signal.muscle.replace(/_/g, " ")} review note.` });
    };
    window.addEventListener(SEGMENT_PRIORITY_APPROVAL_EVENT, applyApprovedSegmentPriority);
    const applyApprovedSegmentSuggestion = (event: Event) => {
      const suggestion = (event as CustomEvent<{ exerciseId: number; exerciseName: string; targetMuscle: string }>).detail;
      const target = exercises.find((exercise) => exercise.id === suggestion?.exerciseId);
      if (!target) return;
      if (customWorkout.some((exercise) => exercise.id === target.id)) { toast("Already in this Training Day", { description: `${target.name} is already included for review.` }); return; }
      setCustomWorkout((current) => [...current, target]);
      navigateWorkspace("custom");
      toast("Optional segment addition applied", { description: `${target.name} was added after your explicit ${suggestion.targetMuscle.replace(/_/g, " ")} review choice.` });
    };
    window.addEventListener(SEGMENT_SUGGESTION_APPROVAL_EVENT, applyApprovedSegmentSuggestion);
    return () => { window.removeEventListener(PROGRESSION_APPROVAL_EVENT, applyApprovedProgression); window.removeEventListener(SEGMENT_PRIORITY_APPROVAL_EVENT, applyApprovedSegmentPriority); window.removeEventListener(SEGMENT_SUGGESTION_APPROVAL_EVENT, applyApprovedSegmentSuggestion); };
  }, [customWorkout]);
	  const activeImportedContext = dayStore.context[activeDayKey] || [];
  /**
   * Body weight is a measurement with a date, not a setting. Editing it here
   * appends to the weight log so the value a past lift was measured against
   * stays exactly as it was; the profile keeps the latest value for prefilling.
   */
  const updateBaseline = (next: AthleteBaseline) => {
    setAthleteBaseline(next);
    const changed = next.bodyWeight !== athleteBaseline.bodyWeight || next.weightUnit !== athleteBaseline.weightUnit;
    if (!changed || !next.bodyWeight || next.bodyWeight <= 0) return;
    saveBodyWeightLog(recordBodyWeight(loadBodyWeightLog(), next.bodyWeight, next.weightUnit));
  };
  /**
   * The account chain, entirely in the background: an id on first launch, the
   * profile kept current, and every finished lift pushed to Supabase. Nothing
   * here can block logging — a failure just leaves the queue to drain later.
   */
  // The norms-pool answer lives beside the profile and defaults to off, matching
  // the column. It is only written to Supabase when the athlete actually answers.
  const [benchmarkOptIn, setBenchmarkOptIn] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("sports-genome-benchmark-opt-in-v1") === "true"; } catch { return false; }
  });
  useEffect(() => {
    try { window.localStorage.setItem("sports-genome-benchmark-opt-in-v1", String(benchmarkOptIn)); } catch { /* optional. */ }
  }, [benchmarkOptIn]);
  const athleteSync = useAthleteSync({
    sexForReference: athleteBaseline.sexForReference,
    birthYear: athleteBaseline.birthYear,
    sportId: activeSportId,
    weightUnit: athleteBaseline.weightUnit,
    appSports: sportProfiles,
    enabled: onboardingComplete,
  });
  /**
   * Saving is already done by the time this runs. The control stays because "is this
   * written down?" is a fair question to want answered out loud, not because anything
   * depends on it being pressed.
   */
  const saveActiveDay = () => {
    setDayStore((current) => commitDay(current, activeDayKey, { workout: customWorkout, prescriptions, settings: exerciseSettings }));
    toast("Training day saved", { description: `${activeSlot.ordinal} · ${activeSlot.day} holds ${customWorkout.length} exercise${customWorkout.length === 1 ? "" : "s"}. Every edit to a day is saved to that day as you make it.` });
  };
  /**
   * Opening a day moves the marker and nothing else. Carrying the departing day into the
   * week and reading the arriving one back happens in one effect, so the rail, the day
   * strip, the tracker and the planner dock cannot each get it subtly differently.
   */
	  const openTrainingDay = (index: number) => {
	    const slot = daySlots[index];
	    if (!slot || slot.key === activeSlot.key) return;
	    setActiveSplitDayIndex(slot.index);
	    setActiveSplitDay(slot.day);
	    if (workspace !== "day-plan" && workspace !== "tracker" && workspace !== "custom") navigateWorkspace("day-plan");
	  };
  const applyWeek = (week: number, snapshot: WeekSnapshot) => {
    // A week remembers the day it was left on. Forcing every week back to Day 01 while
    // keeping the stack that was open is what made Week 2's Legs work appear under Push.
    const slot = resolveActiveSlot(splitDays, snapshot.activeDayIndex, splitDays[snapshot.activeDayIndex] || splitDays[0]);
    setActiveWeek(week);
    setDayStore(snapshot.days);
    adoptActiveDay(slot, loadDay(snapshot.days, slot.key));
    setSessionMode(false);
    navigateWorkspace("day-plan");
  };
  const selectWeek = (week: number) => {
    if (week === activeWeek) return;
    const snapshot = planWeeks[week];
    if (!snapshot) return;
    setPlanWeeks((current) => ({ ...current, [activeWeek]: createWeekSnapshot() }));
    applyWeek(week, snapshot);
    toast(`Week ${week} loaded`, { description: "Its saved training days and prescriptions are ready to edit." });
  };
  const generateWeek = () => {
    const nextWeek = nextWeekToGenerate(Object.keys(planWeeks).map(Number), activeWeek);
    if (!nextWeek) { toast("Three weeks are already generated", { description: "Switch between Week 1, Week 2, and Week 3 to review each plan." }); return; }
    const sportSeed = buildGeneratedWeekSportSeed(activeSportId, goal, Math.max(10, gymTimeBudget.recommendationLimit + 4), athleteBaseline.equipment, athleteBaseline.sportModifierId, registryEvidenceMap);
    let generatedDays = emptyDayStore();
    daySlots.forEach((slot) => {
      const source = filterStackForEquipment(getSplitExercisePool(exercises, slot.day, sportSeed), athleteBaseline.equipment);
      const offset = (nextWeek * 3) + (slot.index * 2);
      const rotated = [...source.slice(offset), ...source.slice(0, offset)].filter((exercise, index, values) => values.findIndex((item) => item.id === exercise.id) === index).slice(0, gymTimeBudget.recommendationLimit);
      generatedDays = commitDay(generatedDays, slot.key, { workout: rotated, prescriptions: Object.fromEntries(rotated.map((exercise, index) => [exercise.id, prescriptionFor(index, goal)])), settings: {}, context: [] });
    });
    const generated: WeekSnapshot = { days: generatedDays, activeDayIndex: 0 };
    setPlanWeeks((current) => ({ ...current, [activeWeek]: createWeekSnapshot(), [nextWeek]: generated }));
    applyWeek(nextWeek, generated);
    toast(`Week ${nextWeek} generated`, { description: `${splitDays.length} training days were built around your ${goal.toLowerCase()} goal and ${gymTimeBudget.label.toLowerCase()} budget.` });
  };
  const inspectExercise = (exercise: Exercise) => { setInspectedExercise(exercise); setActiveMuscle(exercise.primaryMuscles[0] || "obliques"); };
  const showMovement = (movement: SportMovementProfile) => { setMovementId(movement.id); navigateWorkspace("recommended"); };

  /**
   * "A selected result opens the canonical object and preserves return
   * context." Each type resolves to the screen that IS that object rather than
   * to a filtered list, and the screen the athlete left stays one tap away.
   */
  const openSearchResult = (result: SearchResult) => {
    let target: Workspace | null = null;
    if (result.type === "destination") {
      target = result.id as Workspace;
    } else if (result.type === "muscle") {
      setActiveMuscle(result.id);
      target = "body";
    } else if (result.type === "exercise") {
      const exercise = exercises.find((item) => String(item.id) === result.id);
      if (!exercise) return;
      inspectExercise(exercise);
      setGenomeExerciseId(exercise.id);
      target = "genome";
    } else if (result.type === "sport") {
      // Opening a sport from search is reading, not adopting. This used to call
      // chooseSport, which rewrites the athlete's sport and clears every saved
      // training day across all three weeks - from one tap on a search result.
      setSportBrowse(browseSport(result.id, activeSportId));
      target = "movement";
    } else if (result.type === "action") {
      const action = sportMovementProfiles.find((item) => item.id === result.id);
      if (!action) return;
      const browse = browseAction(action, activeSportId);
      setSportBrowse(browse);
      // An action in the athlete's own sport is their own selection; one in
      // another sport travels on the browse overlay and leaves theirs alone.
      if (!browse.sportId) setMovementId(action.id);
      target = "movement";
    } else if (result.type === "metric") {
      target = "strength";
    }
    if (!target) return;
    const origin = workspace;
    navigateWorkspace(target);
    // Nothing to return to when the result opens the screen already on display.
    if (target !== origin) setSearchReturn({ workspace: origin, label: navItems.find((item) => item.id === origin)?.label || "where you were" });
  };
  const completeOnboarding = ({ goal: selectedGoal, trainingDays: selectedDays, sportId: selectedSportId, stackMode, baseline }: AthleteQuizSelection) => {
    setGoal(selectedGoal);
    setTrainingDays(selectedDays);
    setAthleteBaseline(baseline);
    chooseSport(selectedSportId);
    if (stackMode === "suggested") {
      setCustomWorkout(getSportSession(selectedSportId, selectedGoal, Math.min(6, selectedDays + 2), baseline.equipment, baseline.sportModifierId).map((result) => result.exercise));
      navigateWorkspace("recommended");
    } else {
      setCustomWorkout([]);
      navigateWorkspace("custom");
    }
    setOnboardingComplete(true);
    setTutorialOpen(true);
  };
  const rebuildPlan = () => {
    try { window.localStorage.removeItem(athleteProfileKey); window.localStorage.removeItem(workoutPlanKey); } catch { /* Local persistence is optional. */ }
    setSportId("");
    setMovementId("");
    setCustomWorkout([]);
    setPrescriptions({});
    setExerciseSettings({});
    setDayStore(emptyDayStore());
    setPlanWeeks({});
    setActiveWeek(1);
    setOnboardingComplete(false);
  };
  const requestRebuildPlan = () => setPendingDestructiveAction({
    title: "Restart onboarding?",
    body: "This permanently deletes every saved training day across all weeks, your current sport, movement, and custom workout, then sends you back through setup. This cannot be undone.",
    confirmLabel: "Restart onboarding",
    onConfirm: rebuildPlan,
  });
  const setLaunchPreference = (enabled: boolean) => {
    emitInteractionFeedback(12);
    setLaunchExperienceEnabled(enabled);
    try {
      window.localStorage.setItem(launchExperiencePreferenceKey, enabled ? "on" : "off");
    } catch { /* The setting remains effective for this session if storage is unavailable. */ }
  };
  const replayLaunchExperience = () => {
    emitInteractionFeedback(12);
    replayBootSplash();
  };

  const activePrimaryDestination = primaryDestinationForWorkspace(workspace);
  const contextualWorkspaceTabs = activePrimaryDestination === "secondary" ? [] : contextualWorkspaces[activePrimaryDestination];
  const activeContextTabId = activeContextTab ?? contextualWorkspaceTabs.find((tab) => tab.workspace === workspace && !tab.scrollTarget)?.id ?? contextualWorkspaceTabs[0]?.id ?? null;
  const navigateContextualWorkspace = (tab: ContextualWorkspaceTab) => {
    navigateWorkspace(tab.workspace);
    setActiveContextTab(tab.id);
    if (tab.id === "tracker") return;
    const scrollTarget = tab.scrollTarget;
    if (scrollTarget) window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = document.querySelector(scrollTarget);
      if (tab.id === "stack-review") target?.querySelector<HTMLDetailsElement>("details")?.setAttribute("open", "");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  };

  if (!directWorkspaceAccess && loading) return <div className="account-entry-loading">Checking secure account access…</div>;
  if (!directWorkspaceAccess && !isAuthenticated) return <EmailAuthScreen onAuthenticated={() => { void refresh(); }} loading={loading} />;
  if (!onboardingComplete) return <AthleteBaselineQuiz sports={sportProfiles} onComplete={completeOnboarding} />;

  return <div className={`apex-shell shell-${activePrimaryDestination} ${directWorkspaceAccess ? "direct-workspace-mode" : ""}`}>
    <div className="apex-main">
      <header className="apex-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <img src={sportsGenomeAssets.circularBadge} alt="Sports Genome circular badge" className="topbar-brand-logo shrink-0 object-cover" />
          <div className="min-w-0"><p className="metric-label">{navItems.find((item) => item.id === workspace)?.label}</p><div className="topbar-context-chips" aria-label={`Current planning context: ${selectedSport.label}, ${goal}, ${trainingDays} training days`}><span title={selectedSport.label}>{selectedSport.label}</span><span title={goal}>{goal}</span><span>{trainingDays} days</span></div></div>
        </div>
        <div className="flex items-center gap-2"><label className="hidden items-center gap-2 border border-[#cddbef] bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[.1em] text-[#38658f] lg:flex">Sport<select value={sportId} onChange={(event) => chooseSport(event.target.value)} className="max-w-[150px] bg-transparent text-[#173d69] outline-none"><option value="" disabled>Choose sport</option>{sportProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select></label><button onClick={requestRebuildPlan} className="hidden border border-[#cddbef] bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#38658f] hover:border-[var(--sg-info-strong)] hover:text-[var(--sg-info-strong)] md:inline">Rebuild plan</button><UniversalSearch onOpenResult={openSearchResult} /><button type="button" onClick={() => navigateWorkspace("profile")} aria-label="Profile and settings" aria-current={workspace === "profile" ? "page" : undefined} className="topbar-profile-button inline-flex h-9 w-9 items-center justify-center border border-[#cddbef] bg-white text-[#38658f] transition-colors hover:border-[var(--sg-info-strong)] hover:text-[var(--sg-info-strong)]"><UsersRound className="h-4 w-4" /></button><button onClick={() => navigateWorkspace("day-plan")} className="inline-flex items-center gap-2 bg-[var(--sg-surface-raised)] px-3 py-2 text-[11px] font-bold uppercase tracking-[.13em] text-white transition-colors hover:bg-[var(--sg-info-strong)]"><Plus className="h-3.5 w-3.5" /> Design day</button></div>
      </header>
      {contextualWorkspaceTabs.length > 1 && <WorkspaceTabs tabs={contextualWorkspaceTabs} activeId={activeContextTabId} label={`${primaryDestinations.find((item) => item.id === activePrimaryDestination)?.label} workspace pages`} onSelect={(tab) => navigateContextualWorkspace(contextualWorkspaceTabs.find((item) => item.id === tab.id)!)} />}
      {searchReturn && <div className="search-return-bar"><span>Opened from search.</span><button type="button" onClick={() => navigateWorkspace(searchReturn.workspace)}>&larr; Back to {searchReturn.label}</button></div>}
      <Suspense fallback={<main className="apex-content"><div className="light-panel p-6 text-sm text-[var(--sg-text-subtle-on-light)]">Preparing this workspace…</div></main>}><main className={`apex-content destination-${activePrimaryDestination} ${workspace === "catalog" ? "catalog-mode-active" : ""}`}>
        {workspace === "tracker" && <section className="tracker-workspace">{trackerSessionLive ? <p className="tracker-live-context">Logging {activeSlot.ordinal} · {activeSplitDay}</p> : <div className="tracker-day-selector"><div><p className="metric-label">Workout tracker</p><h1>Log {activeSlot.ordinal} / {activeSplitDay}</h1><p>Choose the planned day you are completing, then record actual work. Training Day stays focused on building and rating the plan.</p></div><div className="tracker-day-options">{daySlots.map((slot) => <button key={slot.key} type="button" onClick={() => openTrainingDay(slot.index)} aria-pressed={slot.index === activeDayIndex}>{slot.ordinal} · {slot.day}<small>{dayExerciseCount(dayStore, slot.key) ? `${dayExerciseCount(dayStore, slot.key)} planned` : "Empty"}</small></button>)}</div></div>}<DeviceWorkoutTracker workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} dayLabel={activeDayLabel} /></section>}
        {workspace === "catalog" && <section className="catalog-experience-surface"><div className="light-panel p-5"><CatalogDiscoveryPanel exercises={exercises} filters={catalogFilters} favoriteIds={favoriteIds} onFiltersChange={setCatalogFilters} onToggleFavorite={toggleFavorite} onInspect={inspectExercise} onAdd={addExercise} selectedActionLabel={selectedMovement.label} connectionForExercise={(exercise) => getExerciseActionConnection(exercise, enrichedSelectedMovement)} /></div></section>}
        {workspace === "profile" && <AthleteAboutMePanel baseline={athleteBaseline} goal={goal} trainingDays={trainingDays} sportId={sportId} sports={sportProfiles} onBaseline={updateBaseline} onGoal={setGoal} onDays={setTrainingDays} onSport={chooseSport} identity={athleteSync.identity} syncPending={athleteSync.pending} benchmarkOptIn={benchmarkOptIn} onBenchmarkOptIn={setBenchmarkOptIn} />}
        {workspace === "profile" && <section className="more-workspace"><div><p className="metric-label">Sports Genome</p><h1>More tools.</h1><p>Open the guide or restart onboarding when you need to change the foundation of your plan.</p></div><div className="more-workspace-actions"><button type="button" onClick={() => setTutorialOpen(true)}><BookOpen className="h-4 w-4" /> Open guide</button><button type="button" onClick={requestRebuildPlan}>Restart onboarding</button></div><SupabaseResearchLibraryPanel /><div className="launch-setting"><div><p className="metric-label">Launch video</p><h2>Video intro before app opens</h2><p>Your supplied visual plays silently for a short moment before the workspace appears. Use preview to watch it again.</p></div><label><input type="checkbox" checked={launchExperienceEnabled} onChange={(event) => setLaunchPreference(event.target.checked)} /><span>Play video while app opens</span></label><button type="button" onClick={replayLaunchExperience} disabled={!launchExperienceEnabled}>Preview intro video</button></div><p className="more-workspace-build" title="The build this device is running. If it does not change after an update, this device is pinned to an old address.">{buildStampLabel()}</p></section>}
        {workspace === "command" && <TodayActionPanel stagedExerciseCount={customWorkout.length} trainingDays={trainingDays} activeDayLabel={activeDayLabel} sexForReference={athleteBaseline.sexForReference} birthYear={athleteBaseline.birthYear} onOpenTraining={() => navigateWorkspace("day-plan")} onOpenStrength={() => navigateWorkspace("strength")} />}
        {workspace === "movement" && <><SportBrowseNotice browsing={browsingOtherSport} browsedSportLabel={browseSportLabel} ownSportLabel={selectedSport.label} onAdopt={() => { chooseSport(browseSportId); setSportBrowse(followProfileSport); }} onReturn={() => setSportBrowse(followProfileSport)} /><MovementAtlasPanel sportName={browseSportLabel} sportId={browseSportId} sports={sportProfiles} movements={referenceMovements} selectedMovement={referenceMovement} query={atlasQuery} family={atlasFamily} onQuery={setAtlasQuery} onFamily={setAtlasFamily} onSport={(id) => { setSportBrowse(browseSport(id, activeSportId)); setAtlasQuery(""); setAtlasFamily("All"); }} onMovement={(movement) => { if (browsingOtherSport) setSportBrowse(browseMovement(movement.id, sportBrowse)); else setMovementId(movement.id); }} onOpenBody={() => { setActiveMuscle(null); navigateWorkspace("body"); }} /></>}
        {workspace === "command" && <TrainingWeekPanel plannedDays={trainingDays} onOpenTracker={() => navigateWorkspace("tracker")} onOpenProgress={() => navigateWorkspace("progress")} />}
        {workspace === "command" && <section className="space-y-5"><CommandHero heroImage={sportsGenomeAssets.heroLab} sportLabel={selectedSport.label} sportAbbrev={sportAbbrev(selectedSport.label)} trainingDays={trainingDays} topGrade={sessionRecommendations[0]?.grade || "C"} planStatus={activePlanStatus} planStatusDetail={activePlanStatusDetail} stagedExerciseCount={customWorkout.length} onOpenRecommendations={() => navigateWorkspace("recommended")} gradeStamp={<GradeStamp grade={sessionRecommendations[0]?.grade || "C"} compact />} />
          <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><div className="dark-panel p-5"><div className="flex items-start justify-between gap-4"><div><p className="metric-label !text-[#91a09a]">Performance decision</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Today&apos;s movement lens</h2></div><button onClick={() => setWorkspace("movement")} className="text-[var(--sg-info)]"><ArrowUpRight className="h-5 w-5" /></button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><Metric label="Body action" value={movementSignals[0].toUpperCase()} detail="dominant movement signal" /><Metric label="Primary tissues" value={String(movementMuscles.length).padStart(2, "0")} detail="mapped muscle groups" tone="orange" /></div><div className="mt-5 border-t border-white/10 pt-4"><p className="metric-label !text-[#91a09a]">Transfer rationale</p><p className="mt-2 text-sm leading-6 text-[#d0d9d3]">{selectedMovement.gymTransferCue}</p></div></div><div className="light-panel p-5"><div className="flex items-start justify-between"><div><p className="metric-label">Coach dashboard</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[#18241f]">Priority blocks</h2></div><BrainCircuit className="h-5 w-5 text-[var(--sg-text-subtle-on-dark)]" /></div><div className="mt-5 space-y-2">{sessionRecommendations.slice(0, 3).map((result, index) => <button key={result.exercise.id} onClick={() => inspectExercise(result.exercise)} className="flex w-full items-center gap-3 border border-[#e4e8e1] bg-white p-3 text-left transition-colors hover:border-[var(--sg-action)]"><span className="font-display text-xl font-bold text-[#a4afa8]">0{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{result.exercise.name}</span><span className="mt-1 block truncate text-[11px] text-[#708078]">{result.rationale}</span></span><GradeStamp grade={result.grade} compact /></button>)}</div><button onClick={() => setWorkspace("recommended")} className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-[var(--sg-action-strong)]">View athlete recommendation <ArrowUpRight className="h-4 w-4" /></button></div></div></section>}
        {workspace === "command" && <details className="home-input-disclosure"><summary>Adjust plan inputs — sport, goal, days, and time available</summary><div className="home-input-disclosure-body"><section className="home-preference-deck"><div><p className="metric-label">Training context</p><h2>Adjust your plan inputs.</h2><p>Changes update your sport lens, recommendations, and weekly split without restarting the app.</p></div><label><span>Sport</span><select value={sportId} onChange={(event) => chooseSport(event.target.value)}>{sportProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select></label><label><span>Goal</span><select value={goal} onChange={(event) => setGoal(event.target.value as Goal)}>{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>Days / week</span><select value={trainingDays} onChange={(event) => setTrainingDays(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label></section><section className="gym-time-budget-card"><div><p className="metric-label">Gym-time budget</p><h2>How long do you have today?</h2><p>{gymTimeBudget.scopeCue} Recommended stacks now cap at {gymTimeBudget.recommendationLimit} exercises, while the builder keeps the session-time estimate visible.</p></div><label><span>Available time</span><select value={gymMinutes} onChange={(event) => setGymMinutes(Number(event.target.value))}>{gymTimeOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes === 90 ? "90+ minutes" : `${minutes} minutes`}</option>)}</select><small>{gymTimeBudget.restGuidance}</small></label></section></div></details>}

        {workspace === "recommended" && <section className="space-y-5"><div className="view-header"><div><p className="metric-label">02 / recommendation engine</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">Recommendations with<br /><em className="text-[var(--sg-info)]">the reasoning attached.</em></h1></div><div className="view-header-note"><ShieldCheck className="h-5 w-5 text-[var(--sg-info)]" /><p>Movement and muscle fit are visible. {equipmentProfileSummary(athleteBaseline.equipment)}</p></div></div><div className="sport-select-row">{sportProfiles.map((profile) => <button key={profile.id} onClick={() => chooseSport(profile.id)} className={`sport-chip ${sportId === profile.id ? "sport-chip-active" : ""}`}><span>{sportAbbrev(profile.label)}</span><small>{profile.movementFamilies.length} families</small></button>)}</div><div className="matches-lens"><p className="metric-label">Ranking these matches on</p><div className="matches-lens-priorities">{sportProgrammingContext.priorities.map((priority) => <span key={priority}>{priority}</span>)}</div><p className="matches-lens-note">Drawn from {selectedSport.label} — {sportProgrammingContext.modifierLabel.toLowerCase()}.</p><details className="matches-lens-method"><summary>How matching works</summary><div><p>{sportProgrammingContext.modalityBoundary}</p><p>{sportProgrammingContext.exerciseRole}</p><p>{sportProgrammingContext.programmingBoundary}</p></div></details></div><div className="grid gap-5 xl:grid-cols-[.92fr_1.35fr]"><div className="dark-panel overflow-hidden"><div className="border-b border-white/10 p-5"><p className="metric-label !text-[#91a09a]">Movement selector / {selectedSport.label}</p><p className="mt-2 text-sm leading-6 text-[#c5d1c9]">Choose an action to see the body requirements and the exercise matches supporting it.</p></div><div className="max-h-[620px] overflow-y-auto p-3">{sportMovements.map((movement, index) => <button key={movement.id} onClick={() => setMovementId(movement.id)} className={`movement-list-item ${movement.id === selectedMovement.id ? "movement-list-active" : ""}`}><span className="font-display text-lg font-bold">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{movement.label}</span><span className="mt-0.5 block truncate text-[11px] text-[#8d9c95]">{movement.family}</span></span><ChevronRight className="h-4 w-4" /></button>)}</div></div><div className="space-y-5"><div className="light-panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="metric-label">Selected sport action</p><h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none text-[#17231f]">{selectedMovement.label}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f6e65]">{selectedMovement.bodyActions}</p></div><span className="border border-[#cfdbce] bg-[#eff7e7] px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#2b442c]">{selectedMovement.family}</span></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="insight-cell"><p className="metric-label">Prime movers</p><p>{selectedMovement.primaryMuscles}</p></div><div className="insight-cell"><p className="metric-label">Stabilizers</p><p>{selectedMovement.stabilizers}</p></div><div className="insight-cell"><p className="metric-label">Muscle actions</p><p>{selectedMovement.muscleActions}</p></div></div><div className="mt-4 border-l-2 border-[var(--sg-action)] bg-[#fff1eb] p-4"><p className="metric-label !text-[#bf4326]">Gym transfer cue</p><p className="mt-1 text-xs leading-5 text-[#5d6762]">{selectedMovement.gymTransferCue}</p></div></div><div className="dark-panel overflow-hidden"><div className="flex items-start justify-between border-b border-white/10 p-5"><div><p className="metric-label !text-[#91a09a]">Exercise match set</p><h3 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Build the qualities</h3></div><span className="text-[11px] font-bold uppercase tracking-[.13em] text-[var(--sg-text-subtle-on-dark)]">{movementRecommendations.length} matches</span></div><div className="divide-y divide-white/10">{movementRecommendations.map((result, index) => <RecommendationRow key={result.exercise.id} result={result} index={index} onAdd={() => addExercise(result.exercise)} onInspect={() => inspectExercise(result.exercise)} />)}</div></div><SportEvidencePanel sportId={activeSportId} exercises={exercises} onAdd={addExercise} onInspect={inspectExercise} /></div></div></section>}

        {workspace === "custom" && <section className="space-y-5"><div className="builder-upgrade-head"><div><p className="metric-label">03 / custom workout builder</p><h1>Coach controls.<br /><em>Athlete-ready output.</em></h1><p>Build a session, inspect its trade-offs, then map it across the full training week.</p></div><div className="builder-head-actions"><div className="builder-goal-row">{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item) => <button key={item} onClick={() => setGoal(item)} aria-pressed={goal === item} className={`goal-button ${goal === item ? "goal-button-active" : ""}`}>{item}</button>)}</div><button onClick={loadSmartDraft} className="builder-smart-button">Load smart draft <Sparkles className="h-4 w-4" /></button></div></div><SessionDraftPanel dayLabel={`${activeSlot.ordinal} · ${activeSplitDay}`} minutes={gymMinutes} budget={gymTimeBudget} loadout={activeLoadout} exerciseCount={draftedLoadout.length} estimatedMinutes={draftedLoadoutMinutes} replacingCount={customWorkout.length} onMinutes={(value) => setGymMinutes(normalizeGymMinutes(value))} onLoadout={setActiveLoadout} onDraft={loadDraft} /><div className="grid gap-5 xl:grid-cols-[.86fr_1.14fr]"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} /><div className="workout-programming-panel"><div className="programming-panel-head"><div><p className="metric-label">Programming detail</p><h3>Make the prescription usable</h3><p>Set effort, rest, notes, and completion without losing the current sport-aware draft.</p></div></div><div className="divide-y divide-white/10">{customWorkout.length ? customWorkout.map((exercise, index) => <ExercisePrescriptionRow key={exercise.id} exercise={exercise} index={index} prescription={prescriptions[exercise.id] || prescriptionFor(index, goal)} settings={getExerciseSettings(exerciseSettings, exercise.id)} onPrescription={(value) => setPrescriptions((current) => ({ ...current, [exercise.id]: value }))} onSettings={(patch) => updateExerciseSettings(exercise.id, patch)} onInspect={() => inspectExercise(exercise)} onRemove={() => removeExercise(exercise.id)} />) : <p className="programming-empty">Load a smart draft or add an exercise to unlock detailed programming controls.</p>}</div><WeeklyPlanBoard days={splitDays} activeIndex={activeDayIndex} plan={weeklyPlan} onChoose={openTrainingDay} onSave={saveActiveDay} /><div className="builder-finder"><div className="flex items-center justify-between gap-3"><p className="metric-label">Add an exercise</p><button onClick={() => setWorkspace("recommended")} className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--sg-info-strong)]">Browse movement matches <ArrowUpRight className="inline h-3.5 w-3.5" /></button></div><label className="mt-3 flex items-center gap-2 border border-[var(--sg-divider-on-light)] bg-white px-3"><Search className="h-4 w-4 text-[var(--sg-text-subtle-on-light)]" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder={`Search ${exercises.length} exercises`} /></label><LocalSearchScope scope={`Searching the ${exercises.length} exercises in this catalog.`} query={catalogQuery} /><div className="mt-3 grid gap-2 md:grid-cols-2">{filteredCatalog.slice(0, 8).map((exercise) => <div key={exercise.id} className="builder-finder-row"><button onClick={() => inspectExercise(exercise)} className="min-w-0 flex-1 text-left"><strong>{exercise.name}</strong><small>{exercise.movement}</small></button><button onClick={() => addExercise(exercise)} aria-label={`Add ${exercise.name}`}><Plus className="h-4 w-4" /></button></div>)}</div></div></div></div></section>}

        {workspace === "day-plan" && <section className={`day-design-workspace ${sessionMode ? "day-session-mode" : ""}`}><div className="day-design-hero"><div><p className="metric-label">04 / saved training-day plans</p><h1>Design the day.<br /><em>See the week.</em></h1><p>Pick a week, pick a day, then build it from the catalog or paste one in. Every edit is saved to the day you are on.</p></div><button onClick={() => setImportOpen(true)} className="day-design-import"><ClipboardPaste className="h-4 w-4" /> Paste a stack</button></div><ThreeWeekPlanner activeWeek={activeWeek} generatedWeeks={visibleWeeks(Object.keys(planWeeks).map(Number), activeWeek)} dayCounts={Object.fromEntries([1, 2, 3].map((week) => [week, savedDayCount(week === activeWeek ? dayStore : planWeeks[week]?.days || emptyDayStore())]))} onSelect={selectWeek} onGenerate={generateWeek} /><TrainingDayNav week={activeWeek} slots={daySlots} activeIndex={activeDayIndex} exerciseCountFor={(slot) => dayExerciseCount(dayStore, slot.key)} onOpen={openTrainingDay} onCycle={(direction) => openTrainingDay(cycleSplitIndex(splitDays, activeDayIndex, direction))} /><div className="day-design-grid"><aside className="day-design-rail"><WeeklyPlanBoard days={splitDays} activeIndex={activeDayIndex} plan={weeklyPlan} onChoose={openTrainingDay} onSave={saveActiveDay} /><div className="day-design-rail-note"><p className="metric-label">Plan flow</p><p>Week {activeWeek} is active. Pick a day above, build its stack directly or import it, and move on when you like — the day you leave keeps what you put in it.</p></div></aside><div className="day-design-main">{sessionMode && <WorkoutExecutionPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} sportId={activeSportId} goal={goal} dayLabel={activeDayLabel} isAuthenticated={isAuthenticated} onSignIn={startLogin} />}<section className="day-active-card"><div><p className="metric-label">{activeSlot.ordinal} · {activeSplitDay} / session tools</p><h2>Build it<span>,</span> run it<span>,</span> print it</h2><p>{customWorkout.length ? `${customWorkout.length} exercise${customWorkout.length === 1 ? "" : "s"} in this day. Editing it changes only this day, in Week ${activeWeek}.` : "No exercises in this day yet. Use the catalog picker below, paste a stack, or load a smart draft to begin."}</p></div><div className="day-active-actions"><button onClick={() => setSessionMode((value) => !value)}>{sessionMode ? "Hide logger" : "Start session"} <Activity className="h-4 w-4" /></button><button onClick={loadSmartDraft}>Load smart draft <Sparkles className="h-4 w-4" /></button><button onClick={() => setImportOpen(true)}><ClipboardPaste className="h-4 w-4" /> Import this plan</button><PrintWorkoutButton disabled={!customWorkout.length} /></div></section><div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><div className="space-y-5"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /><ImportedPlanContext items={activeImportedContext} /></div><div className="day-programming-panel"><div className="day-programming-head"><div><p className="metric-label">Exercise prescription</p><h3>{activeSlot.ordinal} · {activeSplitDay} stack</h3><p>Sets, effort, rest, notes, and order belong to this training day and are saved to it as you edit.</p></div><button onClick={saveActiveDay}>Save day</button></div><div className="divide-y divide-white/10">{customWorkout.length ? customWorkout.map((exercise, index) => <div key={exercise.id} className="day-orderable-exercise"><div className="day-order-controls"><button onClick={() => moveExercise(exercise.id, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} earlier`}><ChevronUp className="h-3.5 w-3.5" /></button><button onClick={() => moveExercise(exercise.id, 1)} disabled={index === customWorkout.length - 1} aria-label={`Move ${exercise.name} later`}><ChevronDown className="h-3.5 w-3.5" /></button></div><ExercisePrescriptionRow exercise={exercise} index={index} prescription={prescriptions[exercise.id] || prescriptionFor(index, goal)} settings={getExerciseSettings(exerciseSettings, exercise.id)} onPrescription={(value) => setPrescriptions((current) => ({ ...current, [exercise.id]: value }))} onSettings={(patch) => updateExerciseSettings(exercise.id, patch)} onInspect={() => inspectExercise(exercise)} onRemove={() => removeExercise(exercise.id)} /></div>) : <div className="day-plan-empty"><Dumbbell className="h-6 w-6" /><strong>Build this day from the catalog.</strong><p>Search, filter, and add exercises below. Importing a plan is optional.</p></div>}</div></div></div><SessionDraftPanel dayLabel={`${activeSlot.ordinal} · ${activeSplitDay}`} minutes={gymMinutes} budget={gymTimeBudget} loadout={activeLoadout} exerciseCount={draftedLoadout.length} estimatedMinutes={draftedLoadoutMinutes} replacingCount={customWorkout.length} onMinutes={(value) => setGymMinutes(normalizeGymMinutes(value))} onLoadout={setActiveLoadout} onDraft={loadDraft} /><DayExercisePicker exercises={exercises} activeWorkout={customWorkout} split={activeSplitDay} sportId={sportId} prescriptions={prescriptions} onAdd={addExercise} onReplace={replaceExercise} onInspect={inspectExercise} /><div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><div className="space-y-5"><WarmupPanel workout={customWorkout} goal={goal} /><ProgrammingGuidePanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /></div><WeeklyMuscleVolumePanel plan={weeklyPlan} prescriptions={weeklyPrescriptions} goal={goal} /></div><PrintableWorkoutSheet workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} sport={selectedSport.label} dayLabel={activeDayLabel} /></div></div></section>}
        {workspace === "body" && <section className="body-lab-v2 space-y-5"><SportBrowseNotice browsing={browsingOtherSport} browsedSportLabel={browseSportLabel} ownSportLabel={selectedSport.label} onAdopt={() => { chooseSport(browseSportId); setSportBrowse(followProfileSport); }} onReturn={() => setSportBrowse(followProfileSport)} /><BodyLabNavigator sports={sportProfiles} activeSportId={browseSportId} movements={referenceMovements} selectedMovement={referenceMovement} onSport={(id) => setSportBrowse(browseSport(id, activeSportId))} onMovement={(movement) => { if (browsingOtherSport) setSportBrowse(browseMovement(movement.id, sportBrowse)); else setMovementId(movement.id); setActiveMuscle(null); }} onOpenAtlas={() => navigateWorkspace("movement")} /><AnatomyMap primary={referenceRoleContext.primary} secondary={referenceRoleContext.supporting} roleDetails={referenceRoleContext.rolesByMuscle} roleMethodology={referenceRoleContext.methodology} selectedKey={activeMuscle} onSelect={setActiveMuscle} />{(() => { const target = activeMuscle || getMovementMuscles(referenceMovement)[0] || ""; const name = muscleLabels[target] || target; return <div className="body-lab-next-step"><span>{activeMuscle ? `Train the ${name.toLowerCase()} this action uses` : `Train what ${referenceMovement.label.toLowerCase()} uses most`}</span><button type="button" onClick={() => { setCatalogFilters({ ...defaultCatalogFilters, muscle: target }); navigateWorkspace("catalog"); }}>Find {name} exercises <ArrowUpRight className="h-4 w-4" /></button></div>; })()}</section>}
        {(workspace === "recommended" || workspace === "custom") && <section className="mt-5"><MovementIntelligencePanel movement={enrichedSelectedMovement} fallback={selectedMovement} workout={customWorkout} onAdd={addExercise} onInspect={inspectExercise} compact={workspace === "custom"} /></section>}
        {workspace === "custom" && <section className="builder-prep-workspace"><div className="builder-prep-head"><div><p className="metric-label">Before the work sets</p><h2>Prepare. Then prescribe.</h2><p>Mobility and programming recommendations update from the active exercise stack and selected training goal.</p></div></div><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><div className="space-y-5"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /><ImportedPlanContext items={activeImportedContext} /></div><div className="space-y-5"><WarmupPanel workout={customWorkout} goal={goal} /><ProgrammingGuidePanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /></div></div></section>}
        {workspace === "genome" && <ExerciseGenomeWorkspace exercises={filteredCatalog} selectedExercise={genomeExercise} selectedMovement={selectedMovement} enrichedSelectedMovement={enrichedSelectedMovement} currentWorkout={customWorkout} goal={goal} query={catalogQuery} onQueryChange={setCatalogQuery} onSelectExercise={setGenomeExerciseId} onOpenBody={(muscle) => { setActiveMuscle(muscle); navigateWorkspace("body"); }} onInspect={inspectExercise} />}
        {workspace === "progress" && <ProgressOverviewPanel onOpenStrength={() => navigateWorkspace("strength")} onOpenTraining={() => navigateWorkspace("day-plan")} />}
        {workspace === "strength" && <StrengthGenomePanel weightUnit={athleteBaseline.weightUnit} baselineBodyWeight={athleteBaseline.bodyWeight} sexForReference={athleteBaseline.sexForReference} birthYear={athleteBaseline.birthYear} directAccess={directWorkspaceAccess} onOpenTraining={() => navigateWorkspace("day-plan")} />}
      </main></Suspense>
    </div>
    <div className="mobile-workspace-dock" aria-label="Primary workspace navigation">
      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">{primaryDestinations.map((item) => { const Icon = item.icon; const active = activePrimaryDestination === item.id; return <button type="button" key={item.id} onPointerUp={(event) => navigateDockDestination(item.defaultWorkspace!, event)} onClick={(event) => navigateDockDestination(item.defaultWorkspace!, event)} aria-current={active ? "page" : undefined} className={active ? "mobile-bottom-nav-active" : ""}><Icon className="h-4 w-4" /><span>{item.label}</span></button>; })}</nav>
    </div>

    {inspectedExercise && <div className="fixed inset-0 z-50 bg-[#09120e]/65 p-0 backdrop-blur-sm xl:p-5"><div className="ml-auto h-full w-full max-w-[720px] overflow-y-auto bg-[var(--sg-surface-light)] shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8e0d7] bg-[#f7f8f3]/95 px-5 py-4 backdrop-blur"><div><p className="metric-label">Exercise intelligence</p><p className="mt-1 font-display text-2xl font-bold uppercase leading-none text-[#15221b]">{inspectedExercise.name}</p></div><button onClick={() => setInspectedExercise(null)} className="grid h-9 w-9 place-items-center border border-[#d2dad1] bg-white"><X className="h-4 w-4" /></button></div><div className="p-5"><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><div className="light-panel p-4"><AnatomyMap primary={inspectedExercise.primaryMuscles} secondary={inspectedExercise.secondaryMuscles} onSelect={setActiveMuscle} /></div><div><p className="metric-label">Movement role</p><h3 className="mt-1 font-display text-4xl font-bold uppercase leading-none text-[#17231f]">{inspectedExercise.movement}</h3><div className="mt-4 grid gap-2"><div className="exercise-insight"><p className="metric-label">Primary target</p><p>{inspectedExercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div><div className="exercise-insight"><p className="metric-label">Support tissues</p><p>{inspectedExercise.secondaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div><div className="exercise-insight"><p className="metric-label">Useful qualities</p><p>{inspectedExercise.qualities.join(" · ")}</p></div></div><button onClick={() => { addExercise(inspectedExercise); setWorkspace("custom"); setInspectedExercise(null); }} className="mt-5 inline-flex items-center gap-2 bg-[var(--sg-action-fill)] px-4 py-3 text-[11px] font-bold uppercase tracking-[.13em] text-[var(--sg-action-on)] hover:bg-[var(--sg-action-strong)]">Add to custom workout <Plus className="h-4 w-4" /></button></div></div><CatalogExerciseEvidenceCard exercise={inspectedExercise} /><div className="mt-5 dark-panel p-5"><p className="metric-label !text-[#91a09a]">Current sport-action relevance</p><p className="mt-2 text-sm leading-6 text-[#d1dcd4]">For {selectedMovement.label}, this exercise is most useful when it supports {selectedMovement.family.toLowerCase()} through its {inspectedExercise.movement.toLowerCase()} pattern. Review the sport action in the Movement Atlas to see the full body-action reasoning.</p><button onClick={() => { setInspectedExercise(null); setWorkspace("movement"); }} className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-[var(--sg-info)]">Open sport action <ArrowUpRight className="h-4 w-4" /></button></div><ExerciseGenomePanel exercise={inspectedExercise} context={{ goal, currentWorkout: customWorkout, sportMovement: selectedMovement }} /></div></div></div>}
    {inspectedExercise && <div className="inspection-action-connection-float"><SelectedActionConnectionCard exercise={inspectedExercise} selectedMovement={selectedMovement} enrichedSelectedMovement={enrichedSelectedMovement} /></div>}
    {tutorialOpen && <FeatureTour onClose={() => setTutorialOpen(false)} onNavigate={(view) => navigateWorkspace(view as Workspace)} />}
    {importOpen && <StackImportPanel onClose={() => setImportOpen(false)} onImport={importRoutine} />}
    {pendingDestructiveAction && <ConfirmDialog {...pendingDestructiveAction} onCancel={() => { pendingDestructiveAction.onCancel?.(); setPendingDestructiveAction(null); }} onConfirm={() => { pendingDestructiveAction.onConfirm(); setPendingDestructiveAction(null); }} />}
  </div>;
}
