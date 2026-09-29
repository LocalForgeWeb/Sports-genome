/** Apex Performance OS: a premium athlete-and-coach workspace with high-contrast intelligence panels, movement-led recommendations, and visible training logic. */
import { plural } from "@/lib/plural";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clearRecentExercises, recordRecentExercise, useRecentExerciseIds } from "@/lib/recentExercises";
const IntroPreview = lazy(() => import("@/components/IntroPreview").then((module) => ({ default: module.IntroPreview })));
const ExerciseCompareSheet = lazy(() => import("@/components/ExerciseCompareSheet").then((module) => ({ default: module.ExerciseCompareSheet })));
import type React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, ArrowRight, ArrowUpRight, BarChart3, BookOpen, BrainCircuit, ChevronDown, ChevronRight, ChevronUp, ClipboardPaste, Dumbbell, Heart, Layers3, Move3d, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy, UserRound, X, Zap, ArrowUpDown } from "lucide-react";
import { AddDestinationStrip } from "@/components/AddDestinationStrip";
import { roleMapForLists } from "@/lib/anatomyRegions";
import { AnatomyMap, muscleLabels } from "@/components/AnatomyMap";
import { UniversalSearch } from "@/components/UniversalSearch";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import type { SearchResult } from "@/lib/universalSearch";
import { GradeStamp } from "@/components/GradeStamp";
import { MovementIntelligencePanel } from "@/components/MovementIntelligencePanel";
import { StackImportPanel, type ImportedRoutine, type ImportedRoutineContext } from "@/components/StackImportPanel";
import { SessionDraftPanel } from "@/components/SessionDraftPanel";
import type { SplitDay } from "@/lib/splitCycle";
import type { TrainingLoadout as LoadoutMode } from "@/lib/loadoutTemplates";
import { FeatureTour } from "@/components/FeatureTour";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { readScopedRecord, scopedKey } from "@/lib/deviceStorageScope";
import { loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, stampLegacyWeightUnits } from "@/lib/deviceWorkoutLog";
import { usePlanSync } from "@/lib/usePlanSync";
import { WorkoutHealthPanel } from "@/components/WorkoutHealthPanel";
import { WarmupPanel } from "@/components/WarmupPanel";
import { ImportedPlanContext } from "@/components/ImportedPlanContext";
import { ProgrammingGuidePanel } from "@/components/ProgrammingGuidePanel";
import { WeeklyMuscleVolumePanel } from "@/components/WeeklyMuscleVolumePanel";
import { ExercisePrescriptionRow } from "@/components/ExercisePrescriptionRow";
import { WorkoutExecutionPanel } from "@/components/WorkoutExecutionPanel";
import { PROGRESSION_APPROVAL_EVENT, SEGMENT_PRIORITY_APPROVAL_EVENT, SEGMENT_SUGGESTION_APPROVAL_EVENT } from "@/components/WorkoutExecutionPanel";
const DeviceWorkoutTracker = lazy(() => import("@/components/DeviceWorkoutTracker").then((module) => ({ default: module.DeviceWorkoutTracker })));
const DayExercisePicker = lazy(() => import("@/components/DayExercisePicker").then((module) => ({ default: module.DayExercisePicker })));
import { PrintableWorkoutSheet, PrintWorkoutButton } from "@/components/PrintableWorkoutSheet";
import type { AthleteBaseline, AthleteQuizSelection } from "@/components/AthleteBaselineQuiz";
const AthleteBaselineQuiz = lazy(() => import("@/components/AthleteBaselineQuiz").then((module) => ({ default: module.AthleteBaselineQuiz })));
import { SportContextGate } from "@/components/SportContextGate";
import type { SportContextMode } from "@shared/resilienceContext";
import type { CapacityFocusState } from "@/components/CapacityFocusCard";
import { DayCapacityNote } from "@/components/DayCapacityNote";
import { RecoverySpacingPanel } from "@/components/RecoverySpacingPanel";
import { TrainingPlanHeader } from "@/components/TrainingPlanHeader";
import { SessionResumeBar } from "@/components/SessionResumeBar";
import { exerciseProgressFor, trainingStateByDayLabel, useLiveSession } from "@/lib/liveSession";
import { capacityProposalFor } from "@/lib/capacityTargets";
import { revealWorkspaceAnchor } from "@/lib/workspaceAnchor";
const AthleteAboutMePanel = lazy(() => import("@/components/AthleteAboutMePanel").then((module) => ({ default: module.AthleteAboutMePanel })));
import { loadBodyWeightLog, recordBodyWeight, saveBodyWeightLog, seedBodyWeightLog } from "@/lib/bodyWeightLog";
import { useAthleteSync } from "@/lib/useAthleteSync";
const ProgressOverviewPanel = lazy(() => import("@/components/ProgressOverviewPanel").then((module) => ({ default: module.ProgressOverviewPanel })));
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
import { buildDaySlots, commitDay, dayExerciseCount, emptyDayRecord, emptyDayStore, loadDay, moveWithin, placeImportedDays, remapDaysForFrequency, resolveActiveSlot, sameSplit, slotForKey, visibleDayPlan, type DayRecord, type DaySettings, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { toast } from "sonner";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { EmailAuthScreen } from "@/components/EmailAuthScreen";
import { SupabaseResearchLibraryPanel } from "@/components/SupabaseResearchLibraryPanel";
import { trpc } from "@/lib/trpc";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { isLaunchExperienceEnabled, launchExperiencePreferenceKey } from "@/lib/launchExperience";
import { buildStampLabel } from "@/lib/buildStamp";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";
import type { WeeklyPrescriptionStore } from "@/lib/weeklyVolume";

type Workspace = "command" | "profile" | "progress" | "recommended" | "review" | "day-plan" | "tracker" | "body" | "movement" | "catalog" | "strength";
type Goal = TrainingGoal;
type StackMode = "suggested" | "custom";
type StoredAthleteProfile = { version: 1 | 2 | 3; sportId: string; sportContextMode?: SportContextMode; capacityFocus?: CapacityFocusState; goal: Goal; trainingDays: number; movementId: string; gymMinutes?: number; baseline?: AthleteBaseline };
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
const SelectedActionConnectionCard = lazy(() => import("@/components/SelectedActionConnectionCard").then((module) => ({ default: module.SelectedActionConnectionCard })));

type NavGroup = "Home" | "Train" | "Explore" | "Sport";
const navGroups: NavGroup[] = ["Home", "Train", "Sport", "Explore"];
const navItems: { id: Workspace; label: string; icon: typeof Target; detail: string; group: NavGroup }[] = [
  { id: "command", label: "Home", icon: Target, detail: "plan context & next action", group: "Home" },
  { id: "profile", label: "About Me", icon: UserRound, detail: "baseline & equipment", group: "Home" },
  { id: "progress", label: "Progress", icon: BarChart3, detail: "training & observation record", group: "Home" },
  { id: "day-plan", label: "Training Days", icon: Layers3, detail: "design each saved day", group: "Train" },
  { id: "tracker", label: "Session", icon: Activity, detail: "start the day's workout and record its sets", group: "Train" },
  { id: "recommended", label: "Matches", icon: Sparkles, detail: "exercises ranked for a sport action", group: "Train" },
  { id: "review", label: "Review", icon: SlidersHorizontal, detail: "is this day any good", group: "Train" },
  { id: "movement", label: "Movement Atlas", icon: Move3d, detail: `${sportMovementProfiles.length} researched sport actions`, group: "Sport" },
  { id: "body", label: "Body Lab", icon: Activity, detail: "muscle-to-movement analysis", group: "Explore" },
  { id: "strength", label: "Strength Genome", icon: BrainCircuit, detail: "your performance profile", group: "Home" },
  { id: "catalog", label: "Exercise Catalog", icon: BookOpen, detail: `${exercises.length} mapped exercises`, group: "Explore" },
];

// FIXED DEFAULT per the Sports Genome philosophy's Mobile global navigation contract: four
// persistent labeled destinations (Home / Body Lab / Train / Progress). Sport stays a
// contextual, deep-linkable object reachable from Home/Body Lab/Progress and search rather
// than a permanent fifth tab; Profile/settings use one consistent secondary entry instead of
// occupying primary nav space, so it is intentionally absent from this array.
type PrimaryDestination = "home" | "train" | "body" | "progress" | "secondary";
type ContextualWorkspaceTab = { id: string; label: string; workspace: Workspace };
const primaryDestinations: { id: PrimaryDestination; label: string; icon: typeof Target; defaultWorkspace?: Workspace }[] = [
  { id: "home", label: "Home", icon: Target, defaultWorkspace: "command" },
  { id: "body", label: "Body Lab", icon: Activity, defaultWorkspace: "body" },
  { id: "train", label: "Train", icon: Layers3, defaultWorkspace: "day-plan" },
  { id: "progress", label: "Progress", icon: BarChart3, defaultWorkspace: "progress" },
];
export const contextualWorkspaces: Record<Exclude<PrimaryDestination, "secondary">, ContextualWorkspaceTab[]> = {
  home: [{ id: "command", label: "Home", workspace: "command" }],
  /**
   * Four places, in the order the work happens: plan it, check it, do it, and a
   * library to pull from.
   *
   * It was six. "Stack Review" and "Prep" were not pages - they scrolled the page you
   * were already on, which the navigation principle lists first among its
   * anti-patterns ("tabs that execute actions"). "Builder" was a second copy of
   * Training Day: seven panels rendered in both, which is the same principle's
   * "duplicating objects by entry path". Its one unique control, the goal switcher,
   * already lives on Home and in Profile.
   */
  train: [
    { id: "day-plan", label: "Plan", workspace: "day-plan" },
    { id: "review", label: "Review", workspace: "review" },
    { id: "tracker", label: "Workout", workspace: "tracker" },
    { id: "recommended", label: "Matches", workspace: "recommended" },
  ],
  // Body Lab is the reference library: look things up, understand them. Everything
  // here is about exercises and anatomy in general, not about this athlete.
  body: [
    { id: "movement", label: "Movements", workspace: "movement" },
    { id: "body", label: "Muscles", workspace: "body" },
    { id: "catalog", label: "Exercises", workspace: "catalog" },
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
/**
 * Which tab is highlighted is decided by the page on screen and nothing else.
 * Every tab has its own workspace (Home.noRepeatedPages.test.ts enforces it), so
 * Back, the dock and in-page links cannot leave a different tab lit.
 */
export function contextTabIdForWorkspace(workspace: Workspace): string | null {
  const destination = primaryDestinationForWorkspace(workspace);
  if (destination === "secondary") return null;
  const tabs = contextualWorkspaces[destination];
  return tabs.find((tab) => tab.workspace === workspace)?.id ?? tabs[0]?.id ?? null;
}

/**
 * What each place is called, once, for the browser tab and for anything that
 * has to name the current page in words. Pages carry their own heading in the
 * content; this is the same name, kept in step.
 */
export const workspaceTitles: Record<Workspace, string> = {
  command: "Home",
  profile: "About me",
  progress: "Your progress",
  strength: "Strength Genome",
  "day-plan": "Training plan",
  review: "Review your week",
  tracker: "Workout",
  recommended: "Exercise matches",
  movement: "Movement explorer",
  body: "Muscle map",
  catalog: "Exercise catalog",
};

export function workspaceFromLocation(value: string | null): Workspace {
  // The Genome page folded into the catalog and its overlay; old links still land.
  if (value === "genome") return "catalog";
  return navItems.some((item) => item.id === value) ? value as Workspace : "command";
}

const goalDetail: Record<Goal, string> = {
  Athleticism: "Explosive force, movement quality, and sport transfer.",
  "Muscle growth": "More target-tissue work with controlled fatigue.",
  "Max strength": "High force production, bracing, and compound-lift skill.",
  Capacity: "Repeatable output, work tolerance, and positional control.",
};

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

function RecommendationRow({ result, index, onAdd, onInspect, destinationLabel }: { result: MovementRecommendation; index: number; onAdd: () => void; onInspect: () => void; destinationLabel?: string }) {
  const metrics = [
    ["Movement transfer", result.breakdown.movementTransferSimilarity],
    ["Muscle targeting", result.breakdown.muscleMatch],
    ["Joint action", result.breakdown.jointActionMatch],
    ["Quality", result.breakdown.physicalQualityMatch],
    ["Force path", result.breakdown.forceDirectionMatch],
    ["Stability", result.breakdown.stabilityMatch],
    ["Velocity", result.breakdown.velocityMatch],
  ];
  const score = result.breakdown.overall;
  /**
   * Two numbers side by side read as one unless each says what it is. The
   * score is the modelled match for the selected action; the stamp is the
   * catalog's planning tier, which it names itself. Neither is a strength rank,
   * and the stamp is not handed the score, so the two labels stay distinct.
   */
  return <article className="recommendation-row"><div className="recommendation-row-main"><span className="recommendation-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><button type="button" onClick={onInspect} className="recommendation-copy" aria-label={`Inspect ${result.exercise.name}`}><p>{result.exercise.name}{result.registryEvidence && <span className="recommendation-registry" title={result.registryEvidence.rationale ?? "Reviewed Sports Genome research-registry recommendation"}>Registry-verified</span>}</p><small>{result.preparation}</small></button><button type="button" onClick={onInspect} className="recommendation-score" aria-label={`Match score ${score} for ${result.exercise.name}: open details`}><strong>{score}</strong><small>match</small></button><GradeStamp grade={result.grade} compact /><button type="button" onClick={onAdd} className="recommendation-add" aria-label={`Add ${result.exercise.name} to ${destinationLabel ?? "the training day"}`}><Plus className="h-5 w-5" /></button></div><details className="recommendation-why"><summary>Why this match?<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></summary><div className="recommendation-why-grid"><div className="recommendation-score-grid">{metrics.map(([label, value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="recommendation-evidence"><div><p>Strengths</p>{result.breakdown.strengths.map((item) => <span key={item}>+ {item}</span>)}</div><div><p>Limits</p>{result.breakdown.limitations.map((item) => <span key={item}>− {item}</span>)}</div></div></div><p className="recommendation-trace"><span>Matched to</span> <strong>{result.hierarchy.movement}</strong> <span>to build</span> <strong>{result.hierarchy.physicalQualities.slice(0, 2).join(" and ").toLowerCase()}</strong></p></details></article>;
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
    {step === 3 && <section className="pulse-stage"><span className="pulse-kicker">Choose your start</span><h1>Your plan is<br /><em>ready to take shape.</em></h1><div className="pulse-plan-summary"><span>{sportProfiles.find((profile) => profile.id === sportId)?.label}</span><i /> <span>{goal}</span><i /> <span>{plural(trainingDays, "day")}/week</span></div><div className="pulse-start-grid"><button onClick={() => start("suggested")} className="pulse-start pulse-start-primary"><Sparkles className="h-7 w-7" /><strong>Make my<br />suggested stack</strong><small>Start with a sport-aware plan, then edit every part of it.</small><span>Build my plan <ArrowUpRight className="h-4 w-4" /></span></button><button onClick={() => start("custom")} className="pulse-start"><SlidersHorizontal className="h-7 w-7" /><strong>Start<br />from scratch</strong><small>Open a blank builder and shape the session yourself.</small><span>Open builder <ArrowUpRight className="h-4 w-4" /></span></button></div><button onClick={() => setStep(2)} className="pulse-back mt-7">Back</button></section>}
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
  const [capacityFocus, setCapacityFocus] = useState<CapacityFocusState>({ reportedSignals: [] });
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
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(defaultCatalogFilters);
  const [localFavoriteIds, setLocalFavoriteIds] = useState<number[]>([]);
  const [atlasQuery, setAtlasQuery] = useState("");
  const [atlasFamily, setAtlasFamily] = useState("All");
  /**
   * Empty until the athlete puts something in it. This used to start as four
   * hard-coded exercises, and the write-through below saved them as Day 01 the
   * moment onboarding finished - so every new account opened on a training day
   * it had never built, with "4 planned" on a day the athlete had not planned.
   * A stack appears when it is drafted, pasted, added to, or asked for in the
   * quiz; never on its own.
   */
  const [customWorkout, setCustomWorkout] = useState<Exercise[]>([]);
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
  const [sportContextMode, setSportContextMode] = useState<SportContextMode>("sport");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  /**
   * The workout under way, if there is one. Read from the same on-device log the
   * tracker writes, so the plan, the shell and the tracker cannot disagree about
   * what has been done.
   */
  const liveSession = useLiveSession();
  /** Whether Home's own resume module is on screen; the strip yields to it while it is. */
  const [homeResumeVisible, setHomeResumeVisible] = useState(true);
  useEffect(() => {
    if (workspace !== "command" || !liveSession || typeof IntersectionObserver !== "function") { setHomeResumeVisible(workspace === "command"); return; }
    const hero = document.querySelector(".today-action-live");
    if (!hero) { setHomeResumeVisible(false); return; }
    const observer = new IntersectionObserver(([entry]) => setHomeResumeVisible(entry?.isIntersecting ?? false), { threshold: 0.2 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [workspace, liveSession?.id]);
  /**
   * Which days of this week have been trained. Recomputed whenever the live
   * session changes, which is every checkpoint the tracker writes.
   */
  const dayTrainingStates = useMemo(() => trainingStateByDayLabel(), [liveSession]);
  /** Home's schematic and week strip, bound to the selected day and the plan's own days. */
  const homeFocusMuscles = useMemo(() => Array.from(new Set(customWorkout.flatMap((exercise) => exercise.primaryMuscles))), [customWorkout]);
  // "Add exercises" opens a sheet over the day rather than scrolling the page to a panel.
  const [pickerSheetOpen, setPickerSheetOpen] = useState(false);
  // Reorder is a mode for the whole list, not twelve arrow boxes beside six rows.
  const [reorderingDay, setReorderingDay] = useState(false);
  const [loggerScrollRequest, setLoggerScrollRequest] = useState(0);
  const [searchReturn, setSearchReturn] = useState<{ workspace: Workspace; label: string } | null>(null);
  /**
   * The tracker's day chooser is a disclosure. It opens itself when the day
   * on screen has nothing to start - the choice is the only thing to do - and
   * otherwise stays as one line, because an athlete who has staged a day is
   * here to run it, not to be re-asked which one.
   */
  const [trackerDayPickerOpen, setTrackerDayPickerOpen] = useState(false);
  const [launchExperienceEnabled, setLaunchExperienceEnabled] = useState(true);
  const favoriteQuery = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  // Selectable capacity targets. Sport-independent, and safe to fail: the quiz renders an
  // explicit unavailable state rather than blocking onboarding on it.
  const resilienceCatalogQuery = trpc.resilience.targetCatalog.useQuery(undefined, { staleTime: 5 * 60 * 1000, retry: false });
  const favoriteMutation = trpc.favorites.set.useMutation();

  const selectedSport = sportProfiles.find((profile) => profile.id === sportId) || sportProfiles[0];
  const activeSportId = sportId || selectedSport.id;
  /**
   * Sport is optional context. `hasSportContext` is the single gate for anything that would
   * claim, or derive from, a sport the athlete has not chosen - previously this screen fell
   * back to sportProfiles[0] and presented it as theirs.
   */
  const hasSportContext = sportContextMode === "sport" && Boolean(sportId);
  const sportDisplayLabel = hasSportContext ? selectedSport.label : sportContextMode === "general" ? "General strength and resilience" : "No sport yet";
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
  const movementRecommendations = useMemo(() => getMovementRecommendations(selectedMovement, 6, athleteBaseline.sportModifierId, registryEvidenceMap, athleteBaseline.equipment), [selectedMovement, athleteBaseline.sportModifierId, registryEvidenceMap, athleteBaseline.equipment]);
  const sportProgrammingContext = useMemo(() => getSportProgrammingContext(activeSportId, athleteBaseline.sportModifierId), [activeSportId, athleteBaseline.sportModifierId]);
  const splitDays = useMemo(() => splitDaysForFrequency(trainingDays), [trainingDays]);
  const daySlots = useMemo(() => buildDaySlots(splitDays), [splitDays]);
  /** Home's week strip: the plan's own days, with each day's exercise count. */
  const homePlanDays = useMemo(() => daySlots.map((slot) => ({ index: slot.index, name: slot.day, label: `Week ${activeWeek} · ${slot.ordinal} · ${slot.day}`, exerciseCount: dayExerciseCount(dayStore, slot.key) })), [daySlots, activeWeek, dayStore]);
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
  /**
   * The day's prescriptions as every surface must read them: what the athlete set, else the
   * goal default for that exercise's place in the day - the one the Plan row already shows.
   * The tracker fell back to "3 × 8–12", the full analysis to 3 sets and the Plan to "4 × 3–6"
   * for the same unset exercise, so one day showed 14 planned sets and started a 12-set workout
   * (TR-05, B093, B114). Surfaces are handed this map, so their own fallbacks never fire here.
   */
  const dayPrescriptions = useMemo(
    () => Object.fromEntries(customWorkout.map((exercise, index) => [exercise.id, prescriptions[exercise.id] || prescriptionFor(index, goal)])),
    [customWorkout, prescriptions, goal],
  );
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
  /*
   * Latest plan state for handlers that run later than the render that made them: the
   * Undo in a toast is created at the edit and pressed seconds - and possibly a day
   * switch - afterwards.
   */
  const planStateRef = useRef({ customWorkout, prescriptions, exerciseSettings });
  planStateRef.current = { customWorkout, prescriptions, exerciseSettings };
  /**
   * Apply an edit to one specific day, wherever that day now lives.
   *
   * Every Undo used to write to whichever day happened to be open when it was pressed:
   * remove Leg Press on Legs, switch to Push, press Undo, and Leg Press landed in Push
   * while Legs stayed without it; undoing an add removed the same exercise from the new
   * day instead. An edit now carries the key of the day it was made on. If that day is
   * still the open one, the working draft changes; otherwise its stored record does.
   */
  const editDay = (dayKey: string, edit: (record: DayRecord) => DayRecord) => {
    if (dayKey === draftDayKeyRef.current) {
      const current = planStateRef.current;
      const next = edit({ workout: current.customWorkout, prescriptions: current.prescriptions, settings: current.exerciseSettings, context: [] });
      setCustomWorkout(next.workout);
      setPrescriptions(next.prescriptions);
      setExerciseSettings(next.settings);
      return;
    }
    setDayStore((store) => commitDay(store, dayKey, edit(loadDay(store, dayKey))));
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

  // Without a chosen sport there is no sport to seed from. An empty seed keeps the draft
  // general instead of quietly biasing it toward whichever sport happens to be first.
  // The seed depends on sport, goal, window and gym, not on the open day, so a day
  // switch does not re-rank the sport.
  const draftSportSeed = useMemo(() => hasSportContext
    ? getSportSession(activeSportId, goal, Math.max(8, gymTimeBudget.recommendationLimit + 3), athleteBaseline.equipment, athleteBaseline.sportModifierId, registryEvidenceMap).map((item) => item.exercise)
    : [], [activeSportId, hasSportContext, goal, gymTimeBudget.recommendationLimit, athleteBaseline.equipment, athleteBaseline.sportModifierId, registryEvidenceMap]);
  const draftedLoadout = useMemo(() => {
    const sportSeed = draftSportSeed;
    const pool = filterStackForEquipment(getSplitExercisePool(exercises, activeSplitDay, sportSeed), athleteBaseline.equipment);
    return buildVariedLoadout(pool, activeSplitDay === "Sport Transfer" ? sportSeed : [], activeLoadout, gymTimeBudget.recommendationLimit);
  }, [draftSportSeed, activeSplitDay, activeLoadout, gymTimeBudget.recommendationLimit, athleteBaseline.equipment]);
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
  const bodyLabRoleContext =getBodyLabRoleContext(activeSportId, selectedMovement.id, movementMuscles, movementSignals.includes("rotation") ? ["abs", "obliques", "glutes"] : ["abs", "glutes"]);
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
  /** The count Body Lab shows for this action: canonical regions, aliases collapsed. */
  const focusMuscleCount = useMemo(() => Object.keys(roleMapForLists(referenceRoleContext.primary, referenceRoleContext.supporting)).length, [referenceRoleContext]);
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

  /**
   * The profile, read per account record.
   *
   * It used to be read once at mount, so when the account resolved or changed, the profile
   * still in memory was saved into the new account's record (PS-03, B173, B177). It is read
   * at once - the app does not wait on auth to open - and read again whenever the account's
   * record changes, starting from defaults when that record is empty.
   */
  const hydratedProfileKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (hydratedProfileKeyRef.current === athleteProfileKey) return;
    if (hydratedProfileKeyRef.current !== null) {
      setProfileHydrated(false);
      setSportContextMode("sport");
      setSportId("");
      setGoal("Athleticism");
      setTrainingDays(3);
      setGymMinutes(60);
      setCapacityFocus({ reportedSignals: [] });
      setAthleteBaseline({ experience: "Intermediate", weightUnit: "lb", equipment: defaultEquipmentProfile });
      setMovementId("");
      setOnboardingComplete(false);
    }
    try {
      const stored = readScopedRecord(athleteProfileKeyBase, accountId, window.localStorage);
      if (stored) {
        const profile = JSON.parse(stored) as StoredAthleteProfile;
        const storedMode: SportContextMode = profile.version === 1 ? "sport" : profile.sportContextMode || "undecided";
        // Absent before v3, so an older profile simply has nothing selected yet.
        if (profile.capacityFocus) setCapacityFocus({ ...profile.capacityFocus, reportedSignals: profile.capacityFocus.reportedSignals || [] });
        const sportResolves = sportProfiles.some((sport) => sport.id === profile.sportId);
        if ((profile.version === 1 || profile.version === 2 || profile.version === 3) && (storedMode === "sport" ? sportResolves : true)) {
          setSportContextMode(storedMode);
          setSportId(storedMode === "sport" ? profile.sportId : "");
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
    hydratedProfileKeyRef.current = athleteProfileKey;
    setProfileHydrated(true);
  }, [athleteProfileKey]);

  useEffect(() => {
    try {
      const enabled = isLaunchExperienceEnabled(window.localStorage.getItem(launchExperiencePreferenceKey));
      setLaunchExperienceEnabled(enabled);
    } catch { /* Launch preferences are optional and default to enabled. */ }
  }, []);

  // Favourites follow the same rule: read per account, and never written into a record
  // that has not been read yet - which is how one account's shortlist became another's.
  // Like the profile and plan, the first account to sign in claims the shortlist built
  // before accounts were kept apart, or while signed out.
  const hydratedFavoritesKeyRef = useRef<string | null>(null);
  useEffect(() => {
    let next: number[] = [];
    try {
      const stored = JSON.parse(readScopedRecord(favoriteExerciseKeyBase, accountId, window.localStorage) || "[]") as unknown;
      if (Array.isArray(stored)) next = stored.filter((id): id is number => typeof id === "number" && exercises.some((exercise) => exercise.id === id));
    } catch { /* Favorites fall back to an empty local shortlist. */ }
    setLocalFavoriteIds(next);
    hydratedFavoritesKeyRef.current = favoriteExerciseKey;
  }, [favoriteExerciseKey]);

  useEffect(() => {
    if (hydratedFavoritesKeyRef.current !== favoriteExerciseKey) return;
    try { window.localStorage.setItem(favoriteExerciseKey, JSON.stringify(localFavoriteIds)); } catch { /* Device storage is an optional fallback. */ }
  }, [localFavoriteIds, favoriteExerciseKey]);

  useEffect(() => {
    // Wait for auth to settle: the key is account-scoped, and hydrating from the
    // wrong one would either show an empty plan or another athlete's.
    if (loading) return;
    // And wait for the saved profile, because the athlete's training frequency decides
    // which day slots exist. Reading the week against a default split would resolve the
    // active day to a slot the athlete does not train.
    if (!profileHydrated) return;
    if (hydratedPlanKeyRef.current === workoutPlanKey) return;
    // A different record is being read (another account, or signing out): until it has
    // been, nothing may edit or save the plan.
    if (hydratedPlanKeyRef.current !== null) {
      setPlanHydrated(false);
      // The serialised copy is the previous account's until this record has been read and
      // saved again; sync must not compare it with this account's plan.
      setSerializedPlan(null);
    }
    try {
      const stored = readScopedRecord(workoutPlanKeyBase, accountId, window.localStorage);
      if (!stored) {
        /*
         * Nothing saved under this record: it starts empty. The plan still in memory belongs to
         * whoever was signed in before, and marking this key hydrated with it in place let the
         * next save write A's plan into B's record - "sign out A, sign in B, and A's plan
         * becomes B's" (PS-01, B173, B175, B262).
         */
        const slot = resolveActiveSlot(splitDays, 0, splitDays[0]);
        setPlanWeeks({});
        setActiveWeek(1);
        setDayStore(emptyDayStore());
        adoptActiveDay(slot, emptyDayRecord());
      }
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
    if (!profileHydrated || !onboardingComplete) return;
    // Only into the record that was read: never the previous account's profile into this one.
    if (hydratedProfileKeyRef.current !== athleteProfileKey) return;
    // Only sport mode needs a sport id. Requiring one here is what used to drop a general
    // athlete's profile on every reload.
    if (sportContextMode === "sport" && !sportId) return;
    const profile: StoredAthleteProfile = { version: 3, sportId, sportContextMode, capacityFocus, goal, trainingDays, gymMinutes, movementId: selectedMovement.id, baseline: athleteBaseline };
    try { window.localStorage.setItem(athleteProfileKey, JSON.stringify(profile)); } catch { /* Persistence is optional. */ }
  }, [profileHydrated, onboardingComplete, athleteProfileKey, sportId, sportContextMode, capacityFocus, goal, trainingDays, gymMinutes, movementId, selectedMovement.id, athleteBaseline]);

  /**
   * Workouts logged before set units were stored are given one, once, from the profile's
   * unit as it stands when the profile has been read - the unit every screen already reads
   * them in - so switching lb and kg afterwards cannot rescale them (decision D-005).
   */
  useEffect(() => {
    if (!profileHydrated) return;
    const { sessions, stamped } = stampLegacyWeightUnits(loadDeviceWorkoutSessions(), athleteBaseline.weightUnit);
    if (stamped > 0) saveDeviceWorkoutSessions(sessions);
    // Once, when the profile is first read: a later unit change must not re-stamp anything.
  }, [profileHydrated]);

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
    enabled: isAuthenticated && onboardingComplete && planHydrated,
    accountId,
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


  /**
   * Switching between training for a sport and not is an ordinary edit.
   *
   * The only control that offered "no sport" was the profile's sport select, and it did
   * not mean that: it ran `resetSportSelection`, which puts the mode back to `sport`,
   * sends you through onboarding again and deletes every saved day in every week. So an
   * athlete who took up a sport, or stopped, could not say so without losing their plan.
   *
   * Nothing here is destructive, because nothing needs to be: a sport only adds
   * sport-specific demands. The days, weeks and prescriptions were built from goal,
   * equipment and schedule, and all of those still apply.
   */
  const chooseSportContextMode = (mode: SportContextMode) => {
    setSportContextMode(mode);
    if (mode === "sport") return;
    setSportId("");
    setMovementId("");
    setAthleteBaseline((current) => ({ ...current, sportModifierId: undefined }));
    toast(mode === "general" ? "Training without a sport" : "Sport left undecided", {
      description: "Your training days, weeks and equipment are unchanged. Sport-specific screens will ask for a sport when you open them.",
    });
  };

  const chooseSport = (id: string) => {
    if (id) setSportContextMode("sport");
    // Choosing no sport is not a choice of sport: it is a context change, and the profile's
    // "Do you train for a sport?" control owns it. This used to be the trapdoor.
    if (!id) return;
    const changed = Boolean(sportId) && sportId !== id;
    if (changed) {
      const previous = { sportId, movementId, activeMuscle, dayStore, planWeeks, activeWeek, catalogFilters, activeDayIndex: activeSlot.index };
      const undoSwitch = () => {
        setSportId(previous.sportId);
        setMovementId(previous.movementId);
        setActiveMuscle(previous.activeMuscle ?? null);
        setDayStore(previous.dayStore);
        setPlanWeeks(previous.planWeeks);
        setActiveWeek(previous.activeWeek);
        setCatalogFilters(previous.catalogFilters);
        const restored = resolveActiveSlot(splitDays, previous.activeDayIndex, splitDays[previous.activeDayIndex] || splitDays[0]);
        adoptActiveDay(restored, loadDay(previous.dayStore, restored.key));
      };
      setDayStore(emptyDayStore());
      adoptActiveDay(daySlots[0], emptyDayRecord());
      setPlanWeeks({});
      setActiveWeek(1);
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
  /**
   * `keepScroll` is for a navigation that is going to reveal something inside
   * the workspace it opens. Without it the two scrolls race: this one is issued
   * on the next frame and smooth, so it lands on top of the anchor's, and an
   * athlete who searched "shoulder pain" arrives focused on the right card
   * looking at the top of the page.
   */
  const navigateWorkspace = (next: Workspace, { keepScroll = false }: { keepScroll?: boolean } = {}) => {
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
    if (!keepScroll) window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };
  /** Tapping the destination you are already in returns that page to the top; it does not swap to the destination's first page. */
  const dockTarget = (item: { id: PrimaryDestination; defaultWorkspace?: Workspace }): Workspace => (item.id === activePrimaryDestination ? workspace : item.defaultWorkspace!);
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
  // Arriving at the tracker on a day with nothing in it: the only thing to do is
  // pick another, so the chooser is already open. A staged day keeps it shut.
  // It follows the day, not just the arrival: the plan hydrates after first
  // paint, so a day that reads as empty for one render and then fills must
  // close the chooser it had just opened. Toggling by hand is left alone.
  useEffect(() => {
    if (workspace === "tracker") setTrackerDayPickerOpen(!customWorkout.length);
  }, [workspace, customWorkout.length]);

  useEffect(() => {
    const restoreWorkspace = () => {
      // Browser Back is its own return path, so the search return bar goes with it.
      setSearchReturn(null);
      // Whatever entry we landed on, an open overlay is the topmost thing and closes first.
      setInspectedExercise(null);
      setWorkspaceState(workspaceFromLocation(new URLSearchParams(window.location.search).get("workspace")));
    };
    window.addEventListener("popstate", restoreWorkspace);
    return () => window.removeEventListener("popstate", restoreWorkspace);
  }, []);
  /**
   * Nothing edits the plan before the saved plan has been read. An exercise added in
   * that window was confirmed with a toast and then overwritten by the plan arriving
   * a moment later; it is now refused with a reason instead.
   */
  const planReadyForEdits = () => {
    if (planHydrated) return true;
    toast("Your plan is still loading", { id: "plan-loading", description: "Try again in a moment - nothing was changed." });
    return false;
  };
  /**
   * One add, to the day the strip names. The toast says which day received it
   * and offers the two things worth doing next: look at that day, or take it
   * back. A second tap on the same exercise is answered, not repeated.
   */
  const addExercise = (exercise: Exercise) => {
    if (!planReadyForEdits()) return;
    if (customWorkout.some((item) => catalogExerciseIdFor(item) === exercise.id)) {
      toast("Already in this workout", { id: "plan-add", description: `${exercise.name} is already in Week ${activeWeek} · ${activeSlot.day}.` });
      return;
    }
    const destination = `Week ${activeWeek} · ${activeSlot.day}`;
    const dayKey = draftDayKeyRef.current;
    setCustomWorkout((current) => current.some((item) => catalogExerciseIdFor(item) === exercise.id) ? current : [...current, exercise]);
    // One feedback surface per kind of action: a second add replaces the first
    // notice rather than stacking under it, and its Undo is bound to this exercise.
    toast(`Added to ${destination}`, {
      id: "plan-add",
      description: `${exercise.name} is in that day now.`,
      action: { label: "View workout", onClick: () => navigateWorkspace("day-plan") },
      // Takes back this entry on this day: the exact instance, even after a day switch.
      cancel: { label: "Undo", onClick: () => editDay(dayKey, (record) => ({ ...record, workout: record.workout.filter((item) => item.id !== exercise.id) })) },
    });
  };
  const toggleFavorite = (exercise: Exercise) => {
    const currentlyFavorite = favoriteIds.has(exercise.id);
    setLocalFavoriteIds((current) => currentlyFavorite ? current.filter((id) => id !== exercise.id) : Array.from(new Set([...current, exercise.id])));
    // Without an account the shortlist lives only in this device's no-account record, and favorites.set is account-only: its refusal would read as "Your sign-in has expired" (D-015).
    if (!isAuthenticated) {
      toast(currentlyFavorite ? "Removed from favorites" : "Saved to favorites", { id: "favorite", description: `${exercise.name} is ${currentlyFavorite ? "no longer" : "now"} on your shortlist on this device.` });
      return;
    }
    favoriteMutation.mutate({ catalogExerciseId: exercise.id, favorited: !currentlyFavorite }, {
      onSuccess: (ids) => {
        // The server answers with its full list. It is added to this device's list, not
        // swapped in: the device list also holds the shortlist claimed at sign-in and any
        // heart that failed to send, neither is on the server, and a swap deleted them for
        // good. This tap's own change is already in the device list. A reply that is not
        // a list is ignored.
        if (Array.isArray(ids)) setLocalFavoriteIds((current) => Array.from(new Set([...current, ...ids])));
        void favoriteQuery.refetch();
        toast(currentlyFavorite ? "Removed from favorites" : "Saved to favorites", { id: "favorite", description: `${exercise.name} is ${currentlyFavorite ? "no longer" : "now"} on your shortlist.` });
      },
      onError: () => toast("Saved on this device", { id: "favorite", description: "Your favorite is available locally and will sync when account storage is available." }),
    });
  };
  const importRoutine = (routine: ImportedRoutine) => {
    if (!planReadyForEdits()) return;
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
    if (!planReadyForEdits()) return;
    const removedIndex = customWorkout.findIndex((exercise) => exercise.id === id);
    if (removedIndex === -1) return;
    const removed = customWorkout[removedIndex];
    const removedPrescription = prescriptions[id];
    const removedSettings = exerciseSettings[id];
    const dayKey = draftDayKeyRef.current;
    setCustomWorkout((current) => current.filter((exercise) => exercise.id !== id));
    toast(`${removed.name} removed`, {
      action: {
        label: "Undo",
        // Back into the day it came from, at the place it held, with its own prescription.
        onClick: () => editDay(dayKey, (record) => record.workout.some((exercise) => exercise.id === id) ? record : {
          ...record,
          workout: [...record.workout.slice(0, removedIndex), removed, ...record.workout.slice(removedIndex)],
          prescriptions: removedPrescription !== undefined ? { ...record.prescriptions, [id]: removedPrescription } : record.prescriptions,
          settings: removedSettings !== undefined ? { ...record.settings, [id]: removedSettings } : record.settings,
        }),
      },
    });
  };
  const duplicateExercise = (exercise: Exercise, prescription: string, settings: ExerciseSettings) => {
    if (!planReadyForEdits()) return;
    const duplicate = duplicateWorkoutEntry(exercise);
    setCustomWorkout((current) => [...current, duplicate]);
    setPrescriptions((current) => ({ ...current, [duplicate.id]: prescription }));
    setExerciseSettings((current) => ({ ...current, [duplicate.id]: { ...settings, completed: false } }));
  };
  const replaceExercise = (outgoing: Exercise, incoming: Exercise) => {
    if (!planReadyForEdits()) return;
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
  const reorderExercise = (exerciseId: number, direction: -1 | 1) => setCustomWorkout((current) => moveWithin(current, exerciseId, direction));
  // A move is reported once, on one message that repeated taps keep updating,
  // and can be taken back exactly: Undo moves that same exercise the other way.
  const moveExercise = (exerciseId: number, direction: -1 | 1) => {
    if (!planReadyForEdits()) return;
    const dayKey = draftDayKeyRef.current;
    const from = customWorkout.findIndex((exercise) => exercise.id === exerciseId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= customWorkout.length) return;
    reorderExercise(exerciseId, direction);
    toast(`Moved ${customWorkout[from].name} ${direction < 0 ? "earlier" : "later"}`, { id: "plan-reorder", description: `Now ${to + 1} of ${customWorkout.length} in ${activeSlot.day}.`, cancel: { label: "Undo", onClick: () => editDay(dayKey, (record) => ({ ...record, workout: moveWithin(record.workout, exerciseId, direction < 0 ? 1 : -1) })) } });
  };
  /**
   * A draft replaces the open day, and only the open day. Clearing the loose prescription
   * and settings maps used to clear them for every day at once, because they were shared.
   */
  // A draft replaces the day in one tap, so the message that reports it carries
  // Undo: the rows, prescriptions and settings it replaced come back as they were.
  const applyDraftToActiveDay = (stack: Exercise[]) => {
    const previous = { workout: customWorkout, prescriptions, settings: exerciseSettings };
    const dayKey = draftDayKeyRef.current;
    setCustomWorkout(stack);
    setPrescriptions(Object.fromEntries(stack.map((exercise, index) => [exercise.id, prescriptionFor(index, goal)])));
    setExerciseSettings({});
    const draftedIds = stack.map((exercise) => exercise.id).join(",");
    // Restores the day it replaced - that day, and only while it still holds the draft.
    // Edited since, it is left alone rather than rolled back over the athlete's own work.
    return () => editDay(dayKey, (record) => {
      if (record.workout.map((exercise) => exercise.id).join(",") !== draftedIds) {
        toast("That day changed after the draft", { id: "draft-undo-skipped", description: "Undo was not applied, so your later edits are kept." });
        return record;
      }
      return { ...record, workout: previous.workout, prescriptions: previous.prescriptions, settings: previous.settings };
    });
  };
  const loadDraft = () => {
    if (!planReadyForEdits()) return;
    const restore = applyDraftToActiveDay(draftedLoadout);
    toast("Draft loaded", { description: `${activeSlot.ordinal} · ${activeSplitDay} is now built with the ${activeLoadout} orientation.`, cancel: { label: "Undo", onClick: restore } });
  };
  const loadSmartDraft = () => {
    if (!planReadyForEdits()) return;
	    const restore = applyDraftToActiveDay(draftedLoadout);
	    toast("Smart draft loaded", { description: `A diversified ${activeSplitDay.toLowerCase()} session is ready for review.`, cancel: { label: "Undo", onClick: restore } });
  };
  // One rest for the whole day (brief 11C): the row says how many other
  // exercises differ, the message names what changed, and Undo puts every
  // setting back exactly. Only the open day's settings are touched.
  const restMismatchFor = (exerciseId: number) => {
    const rest = getExerciseSettings(exerciseSettings, exerciseId).rest;
    return customWorkout.filter((item) => item.id !== exerciseId && getExerciseSettings(exerciseSettings, item.id).rest !== rest).length;
  };
  const applyRestToDay = (rest: string) => {
    if (!planReadyForEdits()) return;
    const previous = exerciseSettings;
    const dayKey = draftDayKeyRef.current;
    const changed = customWorkout.filter((item) => getExerciseSettings(exerciseSettings, item.id).rest !== rest);
    if (!changed.length) return;
    setExerciseSettings((current) => Object.fromEntries(customWorkout.map((item) => [item.id, { ...getExerciseSettings(current, item.id), rest }])));
    toast(`Rest set to ${rest} for ${changed.length === 1 ? "1 exercise" : `${changed.length} exercises`}`, { id: "plan-rest-all", description: `${changed.map((item) => item.name).join(", ")} · ${activeSlot.day}.`, cancel: { label: "Undo", onClick: () => editDay(dayKey, (record) => ({ ...record, settings: previous })) } });
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
      navigateWorkspace("day-plan");
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
    // Only a sport the athlete chose. The browsing fallback (the first sport in the list,
    // wrestling) was written as the sport of every general athlete's lifts (PS-14, B019).
    sportId: hasSportContext ? sportId : undefined,
    sportContextMode,
    weightUnit: athleteBaseline.weightUnit,
    appSports: sportProfiles,
    capacityFocus,
    targetCatalog: resilienceCatalogQuery.data,
    /**
     * Rows found on the account when this device had none. The reported signals
     * are not restored because they are not stored: no column on
     * `athlete_training_constraints` means "the athlete ticked neurological or
     * systemic symptoms", and putting the ticks in one that means something else
     * would be worse than losing them. A withhold posture is re-established by
     * the athlete answering again, not by the app guessing it back.
     */
    onCapacityRestored: (snapshot) => setCapacityFocus({
      focus: snapshot.focus ? { targetKey: snapshot.focus.targetKey, intent: "build_capacity", laterality: snapshot.focus.laterality } : undefined,
      constraint: snapshot.constraint,
      reportedSignals: [],
    }),
    enabled: onboardingComplete,
  });
  /**
   * Saving is already done by the time this runs. The control stays because "is this
   * written down?" is a fair question to want answered out loud, not because anything
   * depends on it being pressed.
   */
  const saveActiveDay = () => {
    setDayStore((current) => commitDay(current, activeDayKey, { workout: customWorkout, prescriptions, settings: exerciseSettings }));
    // Names the day it landed on, and stops. The description under this said
    // the day "holds 5 exercises" and that "every edit to a day is saved to
    // that day as you make it" - both of which the day's own header is already
    // showing, permanently, two inches above: "5 exercises in this day" and
    // "Saved to this day as you edit". Repeating them turned a confirmation
    // into a three-line slab across the bottom of the screen.
    toast(`${activeSlot.ordinal} · ${activeSlot.day} saved`);
  };
  /**
   * Opening a day moves the marker and nothing else. Carrying the departing day into the
   * week and reading the arriving one back happens in one effect, so the rail, the day
   * strip, the tracker and the planner dock cannot each get it subtly differently.
   */
	  /**
	   * Moving the marker and opening the day are two acts. The strip under Matches
	   * changes which day a plus adds to without leaving Matches; a day tab opens
	   * the day it names.
	   */
	  const selectTrainingDay = (index: number) => {
	    const slot = daySlots[index];
	    if (!slot || slot.key === activeSlot.key) return false;
	    setActiveSplitDayIndex(slot.index);
	    setActiveSplitDay(slot.day);
	    return true;
	  };
	  const openTrainingDay = (index: number) => {
	    if (!selectTrainingDay(index)) return;
	    if (workspace !== "day-plan" && workspace !== "tracker" && workspace !== "review") navigateWorkspace("day-plan");
	  };
  const applyWeek = (week: number, snapshot: WeekSnapshot) => {
    // A week remembers the day it was left on. Forcing every week back to Day 01 while
    // keeping the stack that was open is what made Week 2's Legs work appear under Push.
    const slot = resolveActiveSlot(splitDays, snapshot.activeDayIndex, splitDays[snapshot.activeDayIndex] || splitDays[0]);
    setActiveWeek(week);
    setDayStore(snapshot.days);
    adoptActiveDay(slot, loadDay(snapshot.days, slot.key));
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
  /**
   * The overlay is a history entry of its own, so Back closes it and leaves the
   * page underneath exactly as it was; a second Back then follows real history.
   * Closing with the button or Escape pops that same entry, so nothing is left
   * behind for the next Back to swallow.
   */
  // The control that opened the overlay gets focus back when it closes, so a
  // keyboard or screen-reader user lands where they were, not at the top.
  const inspectorReturnFocus = useRef<HTMLElement | null>(null);
  const recentExerciseIds = useRecentExerciseIds();
  // Compare (brief 11B): the first exercise waits; picking a second opens the
  // sheet. At most two, never a score, and the sheet adds through addExercise.
  const [comparePending, setComparePending] = useState<Exercise | null>(null);
  const [comparePair, setComparePair] = useState<[Exercise, Exercise] | null>(null);
  const compareWith = (exercise: Exercise) => {
    if (!comparePending || comparePending.id === exercise.id) {
      setComparePending(exercise);
      toast(`Comparing ${exercise.name}`, { id: "compare", description: "Open one more exercise and choose Compare there." });
      return;
    }
    setComparePair([comparePending, exercise]);
    setComparePending(null);
    setInspectedExercise(null);
  };
  const inspectExercise = (exercise: Exercise) => {
    if (typeof document !== "undefined" && !inspectedExercise) inspectorReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    recordRecentExercise(exercise.id);
    setInspectedExercise(exercise);
    setActiveMuscle(exercise.primaryMuscles[0] || "obliques");
    if (typeof window !== "undefined" && window.history.state?.overlay !== "exercise") window.history.pushState({ workspace, overlay: "exercise" }, "", window.location.href);
  };
  const closeInspector = () => {
    if (typeof window !== "undefined" && window.history.state?.overlay === "exercise") { window.history.back(); return; }
    setInspectedExercise(null);
  };
  /**
   * Leaving the overlay for another screen: the overlay's own history entry
   * becomes that screen's, so one Back returns to where it was opened and
   * nothing is left for a later Back to swallow. history.back() followed by
   * pushState would race: the queued back is either cancelled by the push or
   * applied after it.
   */
  const leaveInspectorFor = (next: Workspace) => {
    if (typeof window !== "undefined" && window.history.state?.overlay === "exercise") {
      const url = new URL(window.location.href);
      // Same screen: navigateWorkspace will not push, so popping the overlay entry is safe.
      if (url.searchParams.get("workspace") === next) { closeInspector(); navigateWorkspace(next); return; }
      url.searchParams.set("workspace", next);
      window.history.replaceState({ workspace: next }, "", url);
    }
    setInspectedExercise(null);
    // The URL already names `next`, so this only resets context and scrolls.
    navigateWorkspace(next);
  };
  // The overlay is the topmost transient surface, so Escape closes it and
  // nothing else; the list, filters and scroll it opened over are untouched.
  useEffect(() => {
    if (!inspectedExercise) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeInspector(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspectedExercise]);
  // Focus moves into the overlay when it opens and back to its opener when it
  // closes; an opener that left with the screen (Explore in Body Lab) is skipped.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (inspectedExercise) { document.querySelector<HTMLElement>(".exercise-intelligence-close")?.focus({ preventScroll: true }); return; }
    const opener = inspectorReturnFocus.current;
    inspectorReturnFocus.current = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }, [inspectedExercise]);
  const showMovement = (movement: SportMovementProfile) => { setMovementId(movement.id); navigateWorkspace("recommended"); };

  /**
   * "A selected result opens the canonical object and preserves return
   * context." Each type resolves to the screen that IS that object rather than
   * to a filtered list, and the screen the athlete left stays one tap away.
   */
  /**
   * The catalog actually in force. The server route needs a service-role key the
   * deployment may not have; the same view is readable by the signed-in athlete
   * under its own row-level security, and the sync hook falls back to that. Every
   * surface below reads this rather than the query, so one missing deployment
   * setting does not turn the feature off.
   */
  const resilienceCatalog = athleteSync.targetCatalog;
  /**
   * Body Lab is a primary surface for targeted capacity ("expose regional
   * targets without implying diagnosis"), and had nothing on it. A selected
   * region offers the nearest catalog target - and only when the catalog can
   * actually list it, because an offer that opens an empty picker is worse than
   * no offer.
   */
  const capacityOfferForSelection = useMemo(
    () => capacityProposalFor(activeMuscle, resilienceCatalog?.status === "connected" ? resilienceCatalog.targets : []),
    [activeMuscle, resilienceCatalog]
  );
  /**
   * Taking a target from a region tap. It sets the target and nothing else:
   * `separate-capacity-targets-from-constraints` forbids "interpreting any
   * selected region as injured", so the second question stays the card's to ask.
   *
   * A constraint the athlete already reported somewhere else is never discarded
   * by a tap on a body map. In that case the target is left alone and the card
   * opens on what they said, for them to change deliberately.
   */
  const adoptCapacityTarget = (targetKey: string) => {
    const reported = capacityFocus.constraint?.constraintType;
    const holdsAReport = Boolean(capacityFocus.focus) && reported !== undefined && reported !== "proactive_none";
    if (holdsAReport && capacityFocus.focus?.targetKey !== targetKey) return;
    const laterality = capacityFocus.focus?.laterality || "bilateral";
    setCapacityFocus({
      focus: { targetKey, intent: "build_capacity", laterality },
      constraint: { targetKey, constraintType: reported || "proactive_none", laterality },
      reportedSignals: capacityFocus.focus?.targetKey === targetKey ? capacityFocus.reportedSignals : [],
    });
  };
  const openSearchResult = (result: SearchResult) => {
    let target: Workspace | null = null;
    // A destination may name a place inside a workspace as `workspace#anchor`.
    // Landing an athlete who searched "shoulder pain" at the top of a long
    // profile and leaving them to scroll is the same as not having found it.
    let anchor = "";
    if (result.type === "destination") {
      const [workspaceId, anchorId = ""] = result.id.split("#");
      target = workspaceId as Workspace;
      anchor = anchorId;
    } else if (result.type === "muscle") {
      setActiveMuscle(result.id);
      target = "body";
    } else if (result.type === "exercise") {
      const exercise = exercises.find((item) => String(item.id) === result.id);
      if (!exercise) return;
      inspectExercise(exercise);
      target = "catalog";
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
    navigateWorkspace(target, { keepScroll: Boolean(anchor) });
    // Focus, not just scroll: §11 requires focus to land near the object the
    // athlete came for, and a scrolled page leaves a keyboard or screen-reader
    // user still at the top of it.
    if (anchor) revealWorkspaceAnchor(anchor);
    // Nothing to return to when the result opens the screen already on display.
    if (target !== origin) setSearchReturn({ workspace: origin, label: navItems.find((item) => item.id === origin)?.label || "where you were" });
  };
  const completeOnboarding = ({ goal: selectedGoal, trainingDays: selectedDays, sportId: selectedSportId, sportContextMode: selectedMode, focus, constraint, reportedSignals, stackMode, baseline }: AthleteQuizSelection) => {
    setGoal(selectedGoal);
    setTrainingDays(selectedDays);
    setAthleteBaseline(baseline);
    setSportContextMode(selectedMode);
    setCapacityFocus({ focus, constraint, reportedSignals });
    if (selectedMode === "sport") chooseSport(selectedSportId); else setSportId("");
    // The suggested stack is generated from sport demands, so it is withheld rather than
    // produced from an arbitrary sport. The builder opens instead, with everything editable.
    if (stackMode === "suggested" && selectedMode === "sport") {
      setCustomWorkout(getSportSession(selectedSportId, selectedGoal, Math.min(6, selectedDays + 2), baseline.equipment, baseline.sportModifierId).map((result) => result.exercise));
      navigateWorkspace("recommended");
    } else {
      setCustomWorkout([]);
      navigateWorkspace("day-plan");
    }
    setOnboardingComplete(true);
    setTutorialOpen(true);
  };
  const rebuildPlan = () => {
    try { window.localStorage.removeItem(athleteProfileKey); window.localStorage.removeItem(workoutPlanKey); } catch { /* Local persistence is optional. */ }
    setSportId("");
    setSportContextMode("sport");
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
  // The preview is a surface over About me, not a relaunch: nothing reloads,
  // the page keeps its scroll and its edits, and Close returns to the control.
  const [introPreviewOpen, setIntroPreviewOpen] = useState(false);
  const [introOpener, setIntroOpener] = useState<HTMLElement | null>(null);
  // U01: once the light brand row has scrolled away, the status area gets a
  // solid backdrop so content never moves under the clock.
  const [chromeScrolled, setChromeScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setChromeScrolled(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activePrimaryDestination = primaryDestinationForWorkspace(workspace);
  const contextualWorkspaceTabs = activePrimaryDestination === "secondary" ? [] : contextualWorkspaces[activePrimaryDestination];
  const activeContextTabId = contextTabIdForWorkspace(workspace);
  /**
   * The header names the place only when the tab row underneath it does not.
   *
   * On Home the two are the same word, one above the other - which is the
   * duplication that got the header deleted in the first place. On Train the
   * header says "Training Days" and the tabs say Plan / Review / Session, so
   * the destination's name is worth stating and this keeps it.
   */
  // The browser tab names the page the same way the page names itself.
  useEffect(() => { document.title = `${workspaceTitles[workspace]} · Sports Genome`; }, [workspace]);
  /**
   * A tab goes to its page. That is the whole behaviour.
   *
   * It used to also scroll and force-open a `<details>` for the two tabs that pointed
   * at an anchor inside a page you were already on, which is why pressing one could
   * look like nothing had happened except the page moving under you.
   */
  const navigateContextualWorkspace = (tab: ContextualWorkspaceTab) => navigateWorkspace(tab.workspace);

  if (!directWorkspaceAccess && loading) return <div className="account-entry-loading">Checking secure account access…</div>;
  if (!directWorkspaceAccess && !isAuthenticated) return <EmailAuthScreen onAuthenticated={() => { void refresh(); }} loading={loading} />;
  /**
   * Onboarding gets the server catalog and not the athlete's own fallback, because
   * the sync hook is disabled until onboarding finishes and so no session exists
   * yet to read the view with. Enabling it earlier would create an anonymous
   * account for everyone who opens the app and never finishes, which is a product
   * decision rather than a fix for this. The focus step therefore still depends on
   * the service-role key; every other surface no longer does, and the step is
   * skippable and editable from the profile afterwards.
   */
  if (!onboardingComplete) return <Suspense fallback={null}><AthleteBaselineQuiz sports={sportProfiles} targetCatalog={resilienceCatalogQuery.data} onComplete={completeOnboarding} /></Suspense>;

  return <div className={`apex-shell shell-${activePrimaryDestination} ${directWorkspaceAccess ? "direct-workspace-mode" : ""}`}>
    <div className="apex-main">
      {/*
        * Who you are and what you are looking at, back above the tab row.
        *
        * It was removed for the height it spent on a phone, and the screen it left
        * behind was reported as worse: the mark, the sport, the goal and the training
        * frequency all went with it, and a bare tab row over a card is not a product.
        * The two controls that lead somewhere - search and Profile - stay in the tab
        * row where they moved to, so nothing is duplicated and this carries only what
        * it says.
        */}
      <div className={`status-backdrop${chromeScrolled ? " is-solid" : ""}`} aria-hidden="true" />
      <header className="apex-topbar">
        <div className="topbar-brand">
          <img src={sportsGenomeAssets.circularBadge} alt="Sports Genome" className="topbar-brand-logo shrink-0 object-cover" />
          <div className="min-w-0">
            <p className="topbar-wordmark">Sports Genome</p>
            {/* The plan's three facts, and the one way to change them. A button,
                not decoration: it says where it goes. */}
            <button type="button" className="topbar-context-chips" onClick={() => navigateWorkspace("profile")} title="Edit training preferences" aria-label={`Edit training preferences. Current: ${sportDisplayLabel}, ${goal}, ${trainingDays} training days`}><span>{sportDisplayLabel}</span><span>{goal}</span><span>{plural(trainingDays, "day")}</span><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /></button>
          </div>
        </div>
        <div className="topbar-utilities">
          <UniversalSearch onOpenResult={openSearchResult} />
          <button
            type="button"
            onClick={() => navigateWorkspace("profile")}
            aria-label="Profile and settings"
            aria-current={workspace === "profile" ? "page" : undefined}
            className="topbar-profile-button"
          ><UserRound className="h-5 w-5" aria-hidden="true" /></button>
        </div>
      </header>
      {/* Local tabs only where a destination has sibling pages; Home and Profile
          have none, so they get no strip. The row is the tabs alone, full width. */}
      {contextualWorkspaceTabs.length > 1 && <WorkspaceTabs
        tabs={contextualWorkspaceTabs}
        activeId={activeContextTabId}
        label={`${primaryDestinations.find((item) => item.id === activePrimaryDestination)?.label} workspace pages`}
        onSelect={(tab) => navigateContextualWorkspace(contextualWorkspaceTabs.find((item) => item.id === tab.id)!)}
      />}
      {searchReturn && <div className="search-return-bar"><span>Opened from search.</span><button type="button" onClick={() => navigateWorkspace(searchReturn.workspace)}>&larr; Back to {searchReturn.label}</button></div>}
      <Suspense fallback={<main className="apex-content"><div className="workspace-skeleton" role="status" aria-label="Loading this screen"><span className="workspace-skeleton-title" /><span /><span /><span /></div></main>}><main className={`apex-content destination-${activePrimaryDestination} ${workspace === "catalog" ? "catalog-mode-active" : ""}`}>
        {workspace === "tracker" && <section className="tracker-workspace"><DeviceWorkoutTracker workout={customWorkout} prescriptions={dayPrescriptions} settings={exerciseSettings} goal={goal} dayLabel={activeDayLabel} weightUnit={athleteBaseline.weightUnit} onEditInPlan={() => navigateWorkspace("day-plan")} onInspect={inspectExercise} onOpenProgress={() => navigateWorkspace("progress")} daySwitch={<details className="tracker-day-switch" open={trackerDayPickerOpen} onToggle={(event) => setTrackerDayPickerOpen(event.currentTarget.open)}>
          {/* One line under the day the session names, not a panel above it.
              The tracker renders it only before a session starts; mid-workout
              the day cannot change under the sets being logged. */}
          <summary><em>{trackerDayPickerOpen ? "Close" : "Change day"}</em><ChevronDown className="h-4 w-4" aria-hidden /></summary>
          <div className="tracker-day-options">{daySlots.map((slot) => <button key={slot.key} type="button" onClick={() => { openTrainingDay(slot.index); setTrackerDayPickerOpen(false); }} aria-pressed={slot.index === activeDayIndex}>{slot.ordinal} · {slot.day}<small>{dayExerciseCount(dayStore, slot.key) ? `${dayExerciseCount(dayStore, slot.key)} planned` : "Empty"}</small></button>)}</div>
        </details>} /></section>}
        {workspace === "catalog" && <section className="catalog-experience-surface"><CatalogDiscoveryPanel exercises={exercises} filters={catalogFilters} favoriteIds={favoriteIds} recentIds={recentExerciseIds} onClearRecent={clearRecentExercises} comparePendingName={comparePending?.name} onCancelCompare={() => setComparePending(null)} onFiltersChange={setCatalogFilters} onToggleFavorite={toggleFavorite} onInspect={inspectExercise} onAdd={addExercise} destinationLabel={`Week ${activeWeek} · ${activeSlot.day}`} selectedActionLabel={selectedMovement.label} onChangeAction={() => navigateWorkspace("movement")} connectionForExercise={(exercise) => getExerciseActionConnection(exercise, enrichedSelectedMovement)} /><AddDestinationStrip week={activeWeek} slots={daySlots} activeIndex={activeDayIndex} exerciseCountFor={(slot) => dayExerciseCount(dayStore, slot.key)} onChoose={selectTrainingDay} /></section>}
        {workspace === "profile" && <AthleteAboutMePanel baseline={athleteBaseline} goal={goal} trainingDays={trainingDays} gymMinutes={gymMinutes} onGymMinutes={(value) => setGymMinutes(normalizeGymMinutes(value))} sportId={sportId} sportContextMode={sportContextMode} sports={sportProfiles} onBaseline={updateBaseline} onGoal={setGoal} onDays={setTrainingDays} onSport={chooseSport} onSportContextMode={chooseSportContextMode} capacityFocus={capacityFocus} targetCatalog={resilienceCatalog} onCapacityFocus={setCapacityFocus} identity={athleteSync.identity} syncPending={athleteSync.pending} benchmarkOptIn={benchmarkOptIn} onBenchmarkOptIn={setBenchmarkOptIn}
          guides={<div className="about-me-guides"><div className="more-workspace-actions"><button type="button" onClick={() => setTutorialOpen(true)}><BookOpen className="h-4 w-4" /> Open guide</button><button type="button" onClick={requestRebuildPlan}>Restart onboarding</button></div><p>Restarting onboarding deletes every saved training day and starts setup again; it asks first.</p><SupabaseResearchLibraryPanel /></div>}
          launchVideo={<div className="launch-setting" aria-label="Launch video"><p>Your supplied visual plays silently for a short moment before the workspace appears. Use preview to watch it again.</p><label><input type="checkbox" checked={launchExperienceEnabled} onChange={(event) => setLaunchPreference(event.target.checked)} /><span>Play video while app opens</span></label><button type="button" onClick={(event) => { emitInteractionFeedback(12); setIntroOpener(event.currentTarget); setIntroPreviewOpen(true); }}>Preview intro video</button></div>}
          launchVideoEnabled={launchExperienceEnabled}
          buildStamp={buildStampLabel()} />}
        {/* A plan changed on this device and on the account since they last matched. Syncing
            stops until the athlete says which to keep; nothing is overwritten on their behalf. */}
        {planSync.conflict && <div className="plan-sync-conflict" role="alert"><p><strong>Your plan changed on another device.</strong> This device and your account both have edits since they last matched, so neither was replaced.</p><div><button type="button" onClick={() => planSync.resolveConflict("device")}>Keep this device's plan</button><button type="button" onClick={() => planSync.resolveConflict("account")}>Use the account's plan</button></div></div>}
        {workspace === "command" && <TodayActionPanel stagedExerciseCount={customWorkout.length} focusMuscles={homeFocusMuscles} planDays={homePlanDays} activeDayIndex={activeSlot.index} onChooseDay={openTrainingDay} onOpenProgress={() => navigateWorkspace("progress")} trainingDays={trainingDays} activeDayLabel={activeDayLabel} live={liveSession} planHasDays={daySlots.some((slot) => dayExerciseCount(dayStore, slot.key) > 0)} planReady={planHydrated && profileHydrated} athleteName={athleteBaseline.preferredName} directAccess={directWorkspaceAccess} weightUnit={athleteBaseline.weightUnit} onOpenTracker={() => navigateWorkspace("tracker")} onOpenCatalog={() => navigateWorkspace("catalog")} sexForReference={athleteBaseline.sexForReference} birthYear={athleteBaseline.birthYear} onOpenTraining={() => navigateWorkspace("day-plan")} onOpenStrength={() => navigateWorkspace("strength")} />}
        {workspace === "movement" && !hasSportContext && <SportContextGate mode={sportContextMode} workspaceLabel="The Movement Atlas" sports={sportProfiles} onChooseSport={(id) => chooseSport(id)} onBrowseCatalog={() => navigateWorkspace("catalog")} />}
        {workspace === "movement" && hasSportContext && <><SportBrowseNotice browsing={browsingOtherSport} browsedSportLabel={browseSportLabel} ownSportLabel={selectedSport.label} onAdopt={() => { chooseSport(browseSportId); setSportBrowse(followProfileSport); }} onReturn={() => setSportBrowse(followProfileSport)} /><MovementAtlasPanel sportName={browseSportLabel} sportId={browseSportId} sports={sportProfiles} movements={referenceMovements} selectedMovement={referenceMovement} query={atlasQuery} family={atlasFamily} onQuery={setAtlasQuery} onFamily={setAtlasFamily} onSport={(id) => { setSportBrowse(browseSport(id, activeSportId)); setAtlasQuery(""); setAtlasFamily("All"); }} onMovement={(movement) => { if (browsingOtherSport) setSportBrowse(browseMovement(movement.id, sportBrowse)); else setMovementId(movement.id); }} onOpenBody={() => { setActiveMuscle(null); navigateWorkspace("body"); }} /></>}
        {/* Home, after the first viewport: what this app helps you do, as three
            named doors with one line each, and then one insight about the sport
            action the plan is built around, with the top of its ranking. */}
        {workspace === "command" && <section className="home-explore" aria-labelledby="home-explore-heading">
          <p className="metric-label" id="home-explore-heading">Explore Sports Genome</p>
          <button type="button" className="home-explore-row" onClick={() => { setCatalogFilters(defaultCatalogFilters); navigateWorkspace("catalog"); }}><Search className="h-5 w-5" aria-hidden="true" /><span><strong>Find exercises</strong><small>Search by exercise, muscle or equipment</small></span><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" className="home-explore-row" onClick={() => navigateWorkspace("movement")}><Move3d className="h-5 w-5" aria-hidden="true" /><span><strong>Explore muscles &amp; movements</strong><small>See how sport actions involve your muscles</small></span><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" className="home-explore-row" onClick={() => navigateWorkspace("strength")}><Dumbbell className="h-5 w-5" aria-hidden="true" /><span><strong>View strength progress</strong><small>Inspect your recorded lifts and muscle ranks</small></span><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
        </section>}
        {workspace === "command" && hasSportContext && <section className="home-focus" aria-label="Movement focus">
          <div className="home-section-head"><p className="metric-label">Movement focus</p><button type="button" className="home-link" onClick={() => navigateWorkspace("recommended")}>All matches <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
          <h2>{selectedMovement.label}</h2>
          <p className="home-focus-meta">{selectedMovement.family} · {focusMuscleCount} {focusMuscleCount === 1 ? "muscle" : "muscles"} involved · the action your plan is built around</p>
          {/* The top of the same ranking Matches shows in full, with the tier the
              catalog model assigns - not a grade invented for the row. */}
          <ol className="home-priority-rows" aria-label="Top exercise matches">{movementRecommendations.slice(0, 3).map((result, index) => <li key={result.exercise.id}><button type="button" className="home-priority-row" onClick={() => inspectExercise(result.exercise)} aria-label={`View ${result.exercise.name} details`}><span className="home-priority-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="home-priority-copy"><strong>{result.exercise.name}</strong><small>{result.exercise.movement} · {result.exercise.primaryMuscles.slice(0, 2).map((muscle) => muscleLabels[muscle] || muscle).join(" · ")}</small></span><GradeStamp grade={result.exercise.muscleGrade} compact /><ChevronRight className="h-4 w-4" aria-hidden="true" /></button></li>)}</ol>
          <button type="button" className="home-link" onClick={() => { setActiveMuscle(null); navigateWorkspace("body"); }}>Explore in Body Lab <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </section>}
        {workspace === "command" && !hasSportContext && <section className="home-focus" aria-label="Movement focus"><p className="metric-label">Movement focus</p><h2>No sport chosen</h2><p className="home-focus-meta">Choose a sport in Training preferences to see the action your plan is built around and the exercises ranked for it.</p><button type="button" className="home-link" onClick={() => navigateWorkspace("profile")}>Training preferences <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></section>}

        {workspace === "recommended" && !hasSportContext && <SportContextGate mode={sportContextMode} workspaceLabel="Sport recommendations" sports={sportProfiles} onChooseSport={(id) => chooseSport(id)} onBrowseCatalog={() => navigateWorkspace("catalog")} />}
        {/* Matches, one column: the sport and the action as controls, the
            ranking qualities behind one line, the matches as divided rows, and
            the day a plus adds to named at the bottom. The two-panel layout - a
            list of twenty actions beside a boxed "match set", with the action's
            anatomy repeated between them - is gone: the anatomy is the Movement
            Atlas, one tap away, and an action is something to choose, not to
            scroll past. */}
        {workspace === "recommended" && hasSportContext && <section className="matches-page" aria-label="Exercise matches">
          <div className="matches-head">
            <div><h1>Exercise matches</h1><p className="matches-purpose">Exercises picked for how your sport moves.</p></div>
            {/* The athlete's own sport, not a browse: these rank for the sport
                the plan is built on, so changing it here changes the plan's. */}
            <label className="matches-sport"><span className="sr-only">Sport</span><select value={sportId} onChange={(event) => chooseSport(event.target.value)}>{sportProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label>
          </div>
          {/* The reference draws a sport-action silhouette beside this block;
              no such asset exists (docs/design-handoff/missing-illustrations.md),
              so the block runs full width. */}
          <div className="matches-context">
            <p className="metric-label">Movement context</p>
            <label className="matches-action"><span className="sr-only">Sport action</span><select value={selectedMovement.id} onChange={(event) => setMovementId(event.target.value)}>{sportMovements.map((movement) => <option key={movement.id} value={movement.id}>{movement.label}</option>)}</select><ChevronDown className="h-5 w-5" aria-hidden="true" /></label>
            <button type="button" className="matches-link" onClick={() => navigateWorkspace("movement")}>Change movement <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <div className="matches-lens">
            <details className="matches-lens-method">
              <summary>
                <span className="matches-lens-label">Ranking qualities</span>
                <span className="matches-lens-priorities">{sportProgrammingContext.priorities.length ? sportProgrammingContext.priorities.map((priority) => <span key={priority}>{priority}</span>) : <span>No priority qualities identified for this profile</span>}</span>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div>
                <p className="matches-lens-note">{sportProgrammingContext.priorities.length ? `Ranking these matches on ${sportProgrammingContext.priorities.join(", ")}` : "Ranking these matches on movement and muscle fit alone"} — drawn from {selectedSport.label}, {sportProgrammingContext.modifierLabel.toLowerCase()}.</p>
                <p className="matches-lens-heading">How matching works</p>
                <p>The score is how well an exercise fits these qualities, 0 to 100, from its catalog profile. The tag beside it is the catalog's tier for the exercise itself; neither is a rank of you.</p>
                <p>{sportProgrammingContext.modalityBoundary}</p><p>{sportProgrammingContext.exerciseRole}</p><p>{sportProgrammingContext.programmingBoundary}</p>
              </div>
            </details>
          </div>
          <div className="matches-count">
            <h2>{movementRecommendations.length} {movementRecommendations.length === 1 ? "match" : "matches"}</h2>
            <p>Exercises supporting {selectedMovement.label.toLowerCase()}, {sportProgrammingContext.priorities.length ? "ranked on the qualities above" : `ranked for ${selectedSport.label}`}.</p>
          </div>
          {movementRecommendations.length
            ? <div className="matches-list">{movementRecommendations.map((result, index) => <RecommendationRow destinationLabel={`Week ${activeWeek} · ${activeSlot.day}`} key={result.exercise.id} result={result} index={index} onAdd={() => addExercise(result.exercise)} onInspect={() => inspectExercise(result.exercise)} />)}</div>
            : <p className="matches-empty">Nothing in the catalog matches {selectedMovement.label.toLowerCase()} closely enough to rank. Explore the movement to see what it asks of the body, or choose another action.</p>}
          <details className="matches-disclosure">
            <summary><BookOpen className="h-5 w-5" aria-hidden="true" /><span>Research context</span><ChevronDown className="h-5 w-5" aria-hidden="true" /></summary>
            <div><SportEvidencePanel sportId={activeSportId} exercises={exercises} onAdd={addExercise} onInspect={inspectExercise} /></div>
          </details>
          {/* About a sport action, not about the day you built, so it lives with
              Matches - and behind its own line, since it reads the whole day
              against the action and runs to several screens. */}
          <details className="matches-disclosure">
            <summary><Layers3 className="h-5 w-5" aria-hidden="true" /><span>Movement intelligence<small>How your day covers {selectedMovement.label.toLowerCase()}</small></span><ChevronDown className="h-5 w-5" aria-hidden="true" /></summary>
            <div><MovementIntelligencePanel movement={enrichedSelectedMovement} fallback={selectedMovement} workout={customWorkout} onAdd={addExercise} onInspect={inspectExercise} /></div>
          </details>
          <AddDestinationStrip week={activeWeek} slots={daySlots} activeIndex={activeDayIndex} exerciseCountFor={(slot) => dayExerciseCount(dayStore, slot.key)} onChoose={selectTrainingDay} />
        </section>}


        {workspace === "day-plan" && <section className="day-design-workspace">
          <TrainingPlanHeader
            weeks={[1, 2, 3].map((week) => ({ week, ready: visibleWeeks(Object.keys(planWeeks).map(Number), activeWeek).includes(week), savedDays: savedDayCount(week === activeWeek ? dayStore : planWeeks[week]?.days || emptyDayStore()) }))}
            activeWeek={activeWeek}
            onSelectWeek={selectWeek}
            onGenerateWeek={generateWeek}
            nextWeekToGenerate={[1, 2, 3].find((week) => !visibleWeeks(Object.keys(planWeeks).map(Number), activeWeek).includes(week)) ?? null}
            slots={daySlots}
            activeIndex={activeDayIndex}
            exerciseCountFor={(slot) => dayExerciseCount(dayStore, slot.key)}
            trainingStateFor={(index) => dayTrainingStates[`Week ${activeWeek} · ${daySlots[index]?.ordinal} · ${daySlots[index]?.day}`] || null}
            onChooseDay={openTrainingDay}
          />
          <div className="day-design-main">
            {/* Which day is being edited, and - when a workout is running - that
                it is a different thing: the session took its own copy of the
                exercises when it started, so edits here do not reach it. */}
            {liveSession && <p className="day-editing-context" role="status">
              <span>Editing <b>{activeDayLabel}</b>{liveSession.dayLabel === activeDayLabel ? " · this day's workout is under way; it keeps the exercises it started with" : ""}</span>
              <button type="button" onClick={() => navigateWorkspace("tracker")}>{liveSession.dayLabel.split(" · ").pop()} workout in progress · Resume <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            </p>}
            <div className={`day-plan-list${reorderingDay ? " is-reordering" : ""}`}>
              {customWorkout.length
                ? customWorkout.map((exercise, index) => <div key={exercise.id} className="day-orderable-exercise"><div className="day-order-controls"><button onClick={() => moveExercise(exercise.id, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} earlier`}><ChevronUp className="h-3.5 w-3.5" /></button><button onClick={() => moveExercise(exercise.id, 1)} disabled={index === customWorkout.length - 1} aria-label={`Move ${exercise.name} later`}><ChevronDown className="h-3.5 w-3.5" /></button></div><ExercisePrescriptionRow onApplyRestToDay={applyRestToDay} dayRestMismatch={restMismatchFor(exercise.id)} exercise={exercise} index={index} prescription={prescriptions[exercise.id] || prescriptionFor(index, goal)} settings={getExerciseSettings(exerciseSettings, exercise.id)} progress={liveSession ? exerciseProgressFor(exercise.name) : null} onPrescription={(value) => setPrescriptions((current) => ({ ...current, [exercise.id]: value }))} onSettings={(patch) => updateExerciseSettings(exercise.id, patch)} onInspect={() => inspectExercise(exercise)} onRemove={() => removeExercise(exercise.id)} /></div>)
                : <div className="day-plan-empty"><Dumbbell className="h-6 w-6" /><strong>Nothing in this day yet.</strong><p>Add exercises from the catalog, or paste a stack.</p><button type="button" onClick={() => setPickerSheetOpen(true)}><Plus className="h-4 w-4" /> Add exercises</button></div>}
            </div>
            {/* Below the day's own work, not between the heading and its rows. */}
            <DayCapacityNote capacity={capacityFocus} catalog={resilienceCatalog} onOpenProfile={() => navigateWorkspace("profile")} />
            {/* One row, in the order they are reached for: build it, then run it,
                then the two things you rarely need. It was five buttons under a
                "Build it, run it, print it" heading that named all three. */}
            <div className="day-plan-actions">
              <button type="button" className="day-action-add" onClick={() => setPickerSheetOpen(true)}><Plus className="h-4 w-4" /> Add exercises</button>
              {customWorkout.length > 1 && <button type="button" className="day-action-reorder" aria-pressed={reorderingDay} onClick={() => setReorderingDay((value) => !value)}><ArrowUpDown className="h-4 w-4" aria-hidden="true" /> {reorderingDay ? "Done reordering" : "Reorder"}</button>}
              <button type="button" className="day-action-session" onClick={() => navigateWorkspace("tracker")} disabled={!customWorkout.length}><Activity className="h-4 w-4" /> {liveSession ? `Resume ${liveSession.dayLabel.split(" · ").pop()} workout` : "Open workout"}</button>
              <button type="button" className="day-plan-link" onClick={() => setImportOpen(true)}><ClipboardPaste className="h-3.5 w-3.5" /> Import plan</button>
              <PrintWorkoutButton disabled={!customWorkout.length} />
            </div>
            <DayExercisePicker equipmentProfile={athleteBaseline.equipment} sheetOpen={pickerSheetOpen} destination={`Week ${activeWeek} · ${activeSlot.day}`} dayLabel={activeDayLabel} onOpenSheet={() => setPickerSheetOpen(true)} onCloseSheet={() => setPickerSheetOpen(false)} exercises={exercises} activeWorkout={customWorkout} split={activeSplitDay} sportId={sportId} prescriptions={dayPrescriptions} onAdd={addExercise} onReplace={replaceExercise} onInspect={inspectExercise} />
            {/* The generator is one row until it is wanted. Open, it is the panel
                it always was; closed, it was 636px of controls for a thing you do
                once a week at most. */}
            <details className="day-plan-draft">
              <summary><span><BrainCircuit className="h-4 w-4" aria-hidden="true" /><strong>Smart Draft</strong><small>Build a replacement session</small></span><ChevronRight className="h-4 w-4" aria-hidden="true" /></summary>
              <SessionDraftPanel dayLabel={`${activeSlot.ordinal} · ${activeSplitDay}`} minutes={gymMinutes} budget={gymTimeBudget} loadout={activeLoadout} exerciseCount={draftedLoadout.length} estimatedMinutes={draftedLoadoutMinutes} replacingCount={customWorkout.length} onMinutes={(value) => setGymMinutes(normalizeGymMinutes(value))} onLoadout={setActiveLoadout} onDraft={loadDraft} />
            </details>
            <p className="day-review-pointer">Warm-up, programming detail and the week's volume are on <button type="button" onClick={() => navigateContextualWorkspace({ id: "review", label: "Review", workspace: "review" })}>Review</button>.</p>
            <PrintableWorkoutSheet workout={customWorkout} prescriptions={dayPrescriptions} settings={exerciseSettings} goal={goal} sport={selectedSport.label} dayLabel={activeDayLabel} />
          </div>
        </section>}
        {workspace === "body" && <section className="body-lab-v2 space-y-5"><SportBrowseNotice browsing={browsingOtherSport} browsedSportLabel={browseSportLabel} ownSportLabel={selectedSport.label} onAdopt={() => { chooseSport(browseSportId); setSportBrowse(followProfileSport); }} onReturn={() => setSportBrowse(followProfileSport)} /><BodyLabNavigator sports={sportProfiles} activeSportId={browseSportId} movements={referenceMovements} selectedMovement={referenceMovement} onSport={(id) => setSportBrowse(browseSport(id, activeSportId))} onMovement={(movement) => { if (browsingOtherSport) setSportBrowse(browseMovement(movement.id, sportBrowse)); else setMovementId(movement.id); setActiveMuscle(null); }} onOpenAtlas={() => navigateWorkspace("movement")} /><AnatomyMap primary={referenceRoleContext.primary} secondary={referenceRoleContext.supporting} roleDetails={referenceRoleContext.rolesByMuscle} roleMethodology={referenceRoleContext.methodology} selectedKey={activeMuscle} onSelect={setActiveMuscle} nextStep={<>
          {/* The one thing to do with a muscle: find its exercises. The label
              names the selected muscle; with nothing selected it says so and
              offers the action's leading muscle, rather than pretending. */}
          {(() => { const target = activeMuscle || getMovementMuscles(referenceMovement)[0] || ""; const name = muscleLabels[target] || target; return <div className="body-lab-next-step">{!activeMuscle && <span>Choose a muscle above, or start with what {referenceMovement.label.toLowerCase()} uses most.</span>}<button type="button" onClick={() => { setCatalogFilters({ ...defaultCatalogFilters, muscle: target }); navigateWorkspace("catalog"); }}>Find {name.toLowerCase()} exercises <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>; })()}
          {capacityOfferForSelection && <div className="body-lab-capacity-step"><Target className="h-4 w-4" aria-hidden="true" /><div><p>Want {capacityOfferForSelection.name.toLowerCase()} to hold up better, or is something going on there?</p>{capacityOfferForSelection.relation === "region" && <small>{capacityOfferForSelection.name} is the area {(muscleLabels[activeMuscle!] || activeMuscle!).toLowerCase()} sits in — the closest target Sports Genome has for it.</small>}</div><button type="button" onClick={() => { adoptCapacityTarget(capacityOfferForSelection.targetKey); navigateWorkspace("profile", { keepScroll: true }); revealWorkspaceAnchor("targeted-capacity"); }}>Set it as a target <ArrowUpRight className="h-4 w-4" /></button></div>}
        </>} /></section>}
        {workspace === "review" && <section className="day-review-workspace">
          <div className="day-review-head">
            <div>
              <h1>Review your week</h1>
              <p>Week {activeWeek} · {trainingDays} planned days · {activeSlot.ordinal} open · checks the planned workload, not what you have completed</p>
            </div>
            <button type="button" className="day-review-open" onClick={() => navigateWorkspace("tracker")} disabled={!customWorkout.length}>{liveSession ? `Resume ${liveSession.dayLabel.split(" · ").pop()} workout` : "Open workout"} <ArrowUpRight className="h-4 w-4" /></button>
          </div>
          {/* Everything here reads the plan rather than changing it, in the order
              it is wanted: what to do before the session, where the week's volume
              lands, how the days are spaced, then the reference material. */}
          <div className="day-review-stack">
            <WarmupPanel workout={customWorkout} goal={goal} />
            <WeeklyMuscleVolumePanel plan={weeklyPlan} prescriptions={weeklyPrescriptions} goal={goal} />
            {/* Spacing is not a part of the volume map. It was rendered inside it,
                so "how are my sessions spaced" lived underneath a chart answering
                a different question. */}
            <RecoverySpacingPanel plan={weeklyPlan} prescriptions={weeklyPrescriptions} goal={goal} onOpenDay={(dayName) => { const index = daySlots.findIndex((slot) => slot.day === dayName); if (index >= 0) openTrainingDay(index); }} />
            <ProgrammingGuidePanel workout={customWorkout} prescriptions={dayPrescriptions} settings={exerciseSettings} goal={goal} dayLabel={activeDayLabel} />
            <WorkoutHealthPanel workout={customWorkout} prescriptions={dayPrescriptions} settings={exerciseSettings} goal={goal} />
            <ImportedPlanContext items={activeImportedContext} />
          </div>
        </section>}
        {workspace === "progress" && <ProgressOverviewPanel onOpenStrength={() => navigateWorkspace("strength")} onOpenTraining={() => navigateWorkspace("day-plan")} sexForReference={athleteBaseline.sexForReference} baselineBodyWeight={athleteBaseline.bodyWeight} weightUnit={athleteBaseline.weightUnit} birthYear={athleteBaseline.birthYear} directAccess={directWorkspaceAccess} />}
        {workspace === "strength" && <StrengthGenomePanel weightUnit={athleteBaseline.weightUnit} baselineBodyWeight={athleteBaseline.bodyWeight} sexForReference={athleteBaseline.sexForReference} birthYear={athleteBaseline.birthYear} onRankProfile={(patch) => updateBaseline({ ...athleteBaseline, ...patch })} directAccess={directWorkspaceAccess} onOpenTraining={() => navigateWorkspace("day-plan")} />}
      </main></Suspense>
    </div>
    {/* Not on the tracker itself: there it would be a bar describing the screen
        you are looking at, over the top of it. */}
    {/* One resume control per viewport: never on the tracker (it is the screen),
        never on Home while the hero's own Resume is in view. */}
    {liveSession && workspace !== "tracker" && !(workspace === "command" && homeResumeVisible) && <SessionResumeBar live={liveSession} onResume={() => navigateWorkspace("tracker")} />}
    <div className="mobile-workspace-dock" aria-label="Primary workspace navigation">
      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">{primaryDestinations.map((item) => { const Icon = item.icon; const active = activePrimaryDestination === item.id; return <button type="button" key={item.id} onPointerUp={(event) => navigateDockDestination(dockTarget(item), event)} onClick={(event) => navigateDockDestination(dockTarget(item), event)} aria-current={active ? "page" : undefined} className={active ? "mobile-bottom-nav-active" : ""}><Icon className="h-4 w-4" /><span>{item.label}</span></button>; })}</nav>
    </div>

    {/* Exercise Intelligence: one full-height overlay over whatever opened it,
        which stays mounted underneath with its list, filters and scroll. The
        bottom navigation is hidden while it is open (index.css), and Escape or
        the close control returns to the origin. Add is the same operation the
        catalog's plus performs, on the same day the strip names. */}
    {introPreviewOpen && <Suspense fallback={null}><IntroPreview returnTo={introOpener} onClose={() => setIntroPreviewOpen(false)} /></Suspense>}
    {comparePair && <Suspense fallback={null}><ExerciseCompareSheet pair={comparePair} destinationLabel={`Week ${activeWeek} · ${activeSlot.day}`} onAdd={addExercise} onClose={() => setComparePair(null)} onInspect={(exercise) => { setComparePair(null); inspectExercise(exercise); }} /></Suspense>}
    {inspectedExercise && <div className="fixed inset-0 z-50 exercise-intelligence" role="dialog" aria-modal="true" aria-labelledby="exercise-intelligence-title">
      <div className="exercise-intelligence-sheet">
        <div className="exercise-intelligence-bar">
          <img src={sportsGenomeAssets.circularBadge} alt="" className="exercise-intelligence-logo" />
          <p className="metric-label">Exercise intelligence</p>
          <button type="button" onClick={closeInspector} aria-label="Close exercise intelligence" className="exercise-intelligence-close"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <div className="exercise-intelligence-body">
          <h1 id="exercise-intelligence-title">{inspectedExercise.name}</h1>
          <p className="exercise-intelligence-meta"><GradeStamp grade={inspectedExercise.muscleGrade} compact /><span>{inspectedExercise.movement}</span>{inspectedExercise.category && <span>{inspectedExercise.category}</span>}</p>
          {/* Compare, as a quiet line rather than a second big button: the first
              choice waits here; the second opens the comparison. */}
          <button type="button" className="exercise-intelligence-compare" onClick={() => compareWith(inspectedExercise)}>{comparePending && comparePending.id !== inspectedExercise.id ? `Compare with ${comparePending.name}` : comparePending?.id === inspectedExercise.id ? "Comparing this · open another exercise" : "Compare with another exercise"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          {/* The muscles, on the real figure: primary and supporting as the
              figure's own paint, the lists as its rows, the turn control on a
              phone. Tapping a muscle carries into Body Lab's selection. */}
          <section className="exercise-intelligence-muscles" aria-label="Muscle involvement">
            <AnatomyMap primary={inspectedExercise.primaryMuscles} secondary={inspectedExercise.secondaryMuscles} onSelect={setActiveMuscle} showInspector={false} nextStep={<dl className="exercise-intelligence-roles"><div><dt>Primary</dt><dd>{inspectedExercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(" · ") || "None recorded"}</dd></div><div><dt>Supporting</dt><dd>{inspectedExercise.secondaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(" · ") || "None recorded"}</dd></div>{inspectedExercise.qualities.length > 0 && <div><dt>Qualities</dt><dd>{inspectedExercise.qualities.join(" · ")}</dd></div>}</dl>} />
            {/* The one thing the retired Genome page offered that this overlay did
                not: a way from the exercise's leading muscle into Body Lab. */}
            {inspectedExercise.primaryMuscles[0] && <button type="button" className="exercise-intelligence-explore" onClick={() => { const muscle = inspectedExercise.primaryMuscles[0]!; setActiveMuscle(muscle); leaveInspectorFor("body"); }}>Explore {muscleLabels[inspectedExercise.primaryMuscles[0]] || inspectedExercise.primaryMuscles[0]} in Body Lab <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
          </section>
          <ExerciseGenomePanel exercise={inspectedExercise} context={{ goal, currentWorkout: customWorkout, sportMovement: selectedMovement }} compactHead />
          <SelectedActionConnectionCard exercise={inspectedExercise} selectedMovement={selectedMovement} enrichedSelectedMovement={enrichedSelectedMovement} onOpenAction={() => leaveInspectorFor("movement")} />
          <details className="exercise-intelligence-disclosure"><summary><BookOpen className="h-5 w-5" aria-hidden="true" /><span>Evidence context</span><ChevronDown className="h-5 w-5" aria-hidden="true" /></summary><div><CatalogExerciseEvidenceCard exercise={inspectedExercise} /></div></details>
        </div>
        <div className="exercise-intelligence-actions">
          <button type="button" className="exercise-intelligence-add" onClick={() => { addExercise(inspectedExercise); closeInspector(); }}>Add to Week {activeWeek} · {activeSlot.day} <Plus className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" className={`exercise-intelligence-favorite ${favoriteIds.has(inspectedExercise.id) ? "is-on" : ""}`} onClick={() => toggleFavorite(inspectedExercise)} aria-pressed={favoriteIds.has(inspectedExercise.id)} aria-label={`${favoriteIds.has(inspectedExercise.id) ? "Remove" : "Save"} ${inspectedExercise.name} ${favoriteIds.has(inspectedExercise.id) ? "from" : "to"} favorites`}><Heart className="h-5 w-5" fill={favoriteIds.has(inspectedExercise.id) ? "currentColor" : "none"} /></button>
        </div>
      </div>
    </div>}
    {tutorialOpen && <FeatureTour onClose={() => setTutorialOpen(false)} onNavigate={(view) => navigateWorkspace(view as Workspace)} />}
    {importOpen && <StackImportPanel onClose={() => setImportOpen(false)} onImport={importRoutine} />}
    {pendingDestructiveAction && <ConfirmDialog {...pendingDestructiveAction} onCancel={() => { pendingDestructiveAction.onCancel?.(); setPendingDestructiveAction(null); }} onConfirm={() => { pendingDestructiveAction.onConfirm(); setPendingDestructiveAction(null); }} />}
  </div>;
}
