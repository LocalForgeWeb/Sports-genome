/** Apex Performance OS: a premium athlete-and-coach workspace with high-contrast intelligence panels, movement-led recommendations, and visible training logic. */
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, ArrowUpRight, BarChart3, BookOpen, BrainCircuit, ChevronDown, ChevronRight, ChevronUp, ClipboardPaste, Dna, Dumbbell, Layers3, Menu, Move3d, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy, UsersRound, X, Zap } from "lucide-react";
import { AnatomyMap, muscleLabels } from "@/components/AnatomyMap";
import { BodyLabNavigator } from "@/components/BodyLabNavigator";
import { GradeStamp } from "@/components/GradeStamp";
import { MovementIntelligencePanel } from "@/components/MovementIntelligencePanel";
import { StackImportPanel, type ImportedRoutine, type ImportedRoutineContext } from "@/components/StackImportPanel";
import { SplitDraftControls, type LoadoutMode, type SplitDay } from "@/components/SplitDraftControls";
import { FeatureTour } from "@/components/FeatureTour";
import { WorkoutHealthPanel } from "@/components/WorkoutHealthPanel";
import { WarmupPanel } from "@/components/WarmupPanel";
import { ImportedPlanContext } from "@/components/ImportedPlanContext";
import { ProgrammingGuidePanel } from "@/components/ProgrammingGuidePanel";
import { WeeklyPlanBoard } from "@/components/WeeklyPlanBoard";
import { ThreeWeekPlanner } from "@/components/ThreeWeekPlanner";
import { WeeklyMuscleVolumePanel } from "@/components/WeeklyMuscleVolumePanel";
import { ExercisePrescriptionRow } from "@/components/ExercisePrescriptionRow";
import { WorkoutExecutionPanel } from "@/components/WorkoutExecutionPanel";
import { PROGRESSION_APPROVAL_EVENT, SEGMENT_PRIORITY_APPROVAL_EVENT, SEGMENT_SUGGESTION_APPROVAL_EVENT } from "@/components/WorkoutExecutionPanel";
import { MovementAtlasPanel } from "@/components/MovementAtlasPanel";
import { DayExercisePicker } from "@/components/DayExercisePicker";
import { PrintableWorkoutSheet, PrintWorkoutButton } from "@/components/PrintableWorkoutSheet";
import { CatalogDiscoveryPanel } from "@/components/CatalogDiscoveryPanel";
import { CatalogExerciseEvidenceCard } from "@/components/CatalogExerciseEvidenceCard";
import { AthleteBaselineQuiz, type AthleteBaseline, type AthleteQuizSelection } from "@/components/AthleteBaselineQuiz";
import { AthleteAboutMePanel } from "@/components/AthleteAboutMePanel";
import { ProgressOverviewPanel } from "@/components/ProgressOverviewPanel";
import { StrengthGenomePanel } from "@/components/StrengthGenomePanel";
import { ExerciseGenomeWorkspace } from "@/components/ExerciseGenomeWorkspace";
import { SelectedActionConnectionCard } from "@/components/SelectedActionConnectionCard";
import { TodayActionPanel } from "@/components/TodayActionPanel";
import { EquipmentConstraintStrip } from "@/components/EquipmentConstraintStrip";
import { ModifierEvidenceDisclosure } from "@/components/ModifierEvidenceDisclosure";
import { HierarchyPlanningDisclosure } from "@/components/HierarchyPlanningDisclosure";
import { defaultEquipmentProfile, equipmentProfileSummary, filterStackForEquipment } from "@/lib/equipmentProfile";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { defaultCatalogFilters, type CatalogFilters } from "@/lib/catalogDiscovery";
import { getExerciseSettings, getGoalPrescription, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";
import { getExerciseActionConnection, lookupEnrichedMovement } from "@/lib/movementProgramAnalysis";
import { getBodyLabRoleContext } from "@/lib/bodyLabRoleContext";
import { sportMovementProfiles, sportProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";
import { findSportMovement, getMovementMuscles, getMovementRecommendations, getMovementSignals, getSportProgrammingContext, getSportSession, orderHierarchyConstructedSession, type MovementRecommendation } from "@/lib/movementRecommendations";
import { getGymTimeBudget, gymTimeOptions } from "@/lib/gymTimeBudget";
import { buildApprovedProgressionNote, buildApprovedSegmentPriorityNote } from "@/lib/progressiveTraining";
import { nextWeekToGenerate, visibleWeeks } from "@/lib/threeWeekPlan";
import { getSplitExercisePool } from "@/lib/splitAssignment";
import { buildVariedLoadout } from "@/lib/loadoutTemplates";
import { cycleSplitIndex, splitDaysForFrequency } from "@/lib/splitCycle";
import { toast } from "sonner";
import { EmailAuthScreen } from "@/components/EmailAuthScreen";
import { trpc } from "@/lib/trpc";
import type { WeeklyPrescriptionStore } from "@/lib/weeklyVolume";

type Workspace = "command" | "profile" | "progress" | "recommended" | "custom" | "day-plan" | "body" | "movement" | "catalog" | "genome" | "strength";
type Goal = TrainingGoal;
type StackMode = "suggested" | "custom";
type StoredAthleteProfile = { version: 1; sportId: string; goal: Goal; trainingDays: number; movementId: string; gymMinutes?: number; baseline?: AthleteBaseline };
type WeekSnapshot = { customWorkout: Exercise[]; weeklyPlan: Record<string, Exercise[]>; prescriptions: Record<number, string>; exerciseSettings: Record<number, ExerciseSettings>; weeklyPrescriptions: WeeklyPrescriptionStore; importedPlanContext: Record<string, ImportedRoutineContext[]> };
type StoredWeekSnapshot = { customWorkoutIds: number[]; weeklyPlanIds: Record<string, number[]>; prescriptions: Record<number, string>; exerciseSettings: Record<number, ExerciseSettings>; weeklyPrescriptions?: WeeklyPrescriptionStore; importedPlanContext?: Record<string, ImportedRoutineContext[]> };
type StoredWorkoutPlan = { version: 1 | 2; customWorkoutIds: number[]; weeklyPlanIds: Record<string, number[]>; prescriptions: Record<number, string>; exerciseSettings: Record<number, ExerciseSettings>; weeklyPrescriptions?: WeeklyPrescriptionStore; importedPlanContext?: Record<string, ImportedRoutineContext[]>; weeks?: Record<string, StoredWeekSnapshot>; activeWeek?: number };

export function buildSmartDraftWorkout(results: MovementRecommendation[]) {
  return orderHierarchyConstructedSession(results).map((result) => result.exercise);
}

export function buildGeneratedWeekSportSeed(sportId: string, goal: TrainingGoal, limit: number, equipment?: Parameters<typeof getSportSession>[3], modifierId?: string) {
  const broaderSession = orderHierarchyConstructedSession(getSportSession(sportId, goal, Math.max(limit * 2, 12), equipment, modifierId));
  const modifierText = broaderSession[0]?.hierarchy.modifier.toLowerCase() || "";
  const modifierTokens = ["acceleration", "speed", "elastic", "aerobic", "endurance", "economy", "jump", "rotation", "bracing", "mobility", "grip", "landing", "lateral", "power"];
  const hierarchyRelevant = broaderSession.filter((result) => {
    const exerciseText = `${result.exercise.name} ${result.exercise.movement} ${result.exercise.qualities.join(" ")}`.toLowerCase();
    return modifierTokens.some((token) => modifierText.includes(token) && exerciseText.includes(token));
  });
  const orderedSeed = [...hierarchyRelevant, ...broaderSession.filter((result) => !hierarchyRelevant.some((preferred) => preferred.exercise.id === result.exercise.id))].slice(0, limit);
  return orderedSeed.map((result) => result.exercise);
}

const athleteProfileKey = "gym-optimizer-athlete-profile-v1";
const workoutPlanKey = "gym-optimizer-workout-plan-v1";
const plannerTabKey = "gym-optimizer-planner-tab-v1";
const plannerOpenKey = "gym-optimizer-planner-open-v1";
const favoriteExerciseKey = "gym-optimizer-favorite-exercise-ids-v1";
// Temporary product-access switch. The email/password and passkey implementation
// remains intact below and can be restored by setting this to false.
const directWorkspaceAccess = true;
const ExerciseGenomePanel = lazy(() => import("@/components/ExerciseGenomePanel").then((module) => ({ default: module.ExerciseGenomePanel })));

type NavGroup = "Home" | "Train" | "Explore" | "Sport";
const navGroups: NavGroup[] = ["Home", "Train", "Sport", "Explore"];
const navItems: { id: Workspace; label: string; icon: typeof Target; detail: string; group: NavGroup }[] = [
  { id: "command", label: "Home", icon: Target, detail: "plan context & next action", group: "Home" },
  { id: "profile", label: "About Me", icon: UsersRound, detail: "baseline & equipment", group: "Home" },
  { id: "progress", label: "Progress", icon: BarChart3, detail: "training & observation record", group: "Home" },
  { id: "day-plan", label: "Training Days", icon: Layers3, detail: "design each saved day", group: "Train" },
  { id: "recommended", label: "Recommendations", icon: Sparkles, detail: "sport-fit session plans", group: "Train" },
  { id: "custom", label: "Workout Builder", icon: SlidersHorizontal, detail: "coach-editable session", group: "Train" },
  { id: "movement", label: "Movement Atlas", icon: Move3d, detail: `${sportMovementProfiles.length} researched sport actions`, group: "Sport" },
  { id: "body", label: "Body Lab", icon: Activity, detail: "muscle-to-movement analysis", group: "Explore" },
  { id: "strength", label: "Strength Genome", icon: BrainCircuit, detail: "your performance profile", group: "Explore" },
  { id: "catalog", label: "Exercise Catalog", icon: BookOpen, detail: `${exercises.length} mapped exercises`, group: "Explore" },
  { id: "genome", label: "Exercise Genome", icon: Dna, detail: "contextual exercise intelligence", group: "Explore" },
];

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
const muscleSearchTerms: Record<string, string[]> = {
  chest: ["pectoral"], frontDelts: ["anterior deltoid", "shoulder"], sideDelts: ["middle deltoid", "shoulder"], rearDelts: ["posterior deltoid", "shoulder"], shoulders: ["shoulder", "deltoid"],
  triceps: ["triceps"], biceps: ["biceps"], forearms: ["forearm", "wrist", "grip"], abs: ["abdominal", "rectus abdominis"], obliques: ["oblique"], serratusAnterior: ["serratus", "serratus anterior", "scapular protraction"],
  quads: ["quadriceps"], glutes: ["glute"], hamstrings: ["hamstring"], calves: ["calf", "soleus", "gastrocnemius"], tibialis: ["tibialis"],
  abductors: ["abductor", "gluteus medius"], adductors: ["adductor"], lats: ["latissimus"], upperBack: ["upper back", "rhomboid"], traps: ["trapezius"], lowerBack: ["spinal erector"], rotatorCuff: ["rotator cuff"],
};

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
  return <article className="recommendation-row"><div className="recommendation-row-main"><span className="recommendation-index">{String(index + 1).padStart(2, "0")}</span><button onClick={onInspect} className="recommendation-copy" aria-label={`Inspect ${result.exercise.name}`}><p>{result.exercise.name}</p><small>{result.preparation}</small></button><button onClick={onInspect} className="recommendation-score" aria-label={`Inspect the ${result.breakdown.overall} relative match for ${result.exercise.name}`}><strong>{result.breakdown.overall}</strong><small>match</small></button><GradeStamp grade={result.grade} score={result.breakdown.overall} compact /><button onClick={onAdd} className="recommendation-add" aria-label={`Add ${result.exercise.name} to custom workout`}><Plus className="h-4 w-4" /></button></div><details className="recommendation-why"><summary>Why this match?</summary><div className="recommendation-why-grid"><div className="recommendation-score-grid">{metrics.map(([label, value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="recommendation-evidence"><div><p>Strengths</p>{result.breakdown.strengths.map((item) => <span key={item}>+ {item}</span>)}</div><div><p>Limits</p>{result.breakdown.limitations.map((item) => <span key={item}>− {item}</span>)}</div></div></div><div className="mt-4 border-l-2 border-[#2d6cdf] bg-[#eef6ff] p-3 text-xs leading-5 text-[#234e76]"><p className="metric-label !text-[#2d6cdf]">Hierarchy trace</p><p className="mt-1"><strong>Movement:</strong> {result.hierarchy.movement}. <strong>Demand:</strong> {result.hierarchy.physiologicalDemands.slice(0, 2).join(" · ")}. <strong>Physical quality:</strong> {result.hierarchy.physicalQualities.slice(0, 2).join(" · ")}. <strong>Adaptation:</strong> {result.hierarchy.adaptations.slice(0, 2).join(" · ")}. <strong>Modality:</strong> {result.hierarchy.modality} <strong>Exercise role:</strong> {result.hierarchy.exerciseRole} <strong>Programming:</strong> {result.hierarchy.programming}</p></div></details></article>;
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

  return <div className="pulse-shell"><div className="pulse-orb pulse-orb-one" /><div className="pulse-orb pulse-orb-two" /><header className="pulse-header"><div className="flex items-center gap-2"><img src="/manus-storage/sports-genome-icon-192_ae889a25.png" alt="Sports Genome icon" className="h-9 w-9 object-contain" /><span className="font-display text-2xl font-bold uppercase tracking-wide text-white">Sports Genome</span></div><div className="pulse-progress"><span>STEP {step + 1} / 4</span><div>{[0, 1, 2, 3].map((index) => <i key={index} className={index <= step ? "pulse-progress-on" : ""} />)}</div></div></header><main className="pulse-main">
    {step === 0 && <section className="pulse-stage"><span className="pulse-kicker">Pulse Quiz / Outcome bias</span><h1>What outcome<br /><em>should we bias first?</em></h1><p className="pulse-copy">Choose the quality your next training block should prioritize. Your sport, schedule, and stack will refine the decision next.</p><div className="pulse-option-grid">{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item, index) => <button key={item} onClick={() => setGoal(item)} className={`pulse-option ${goal === item ? "pulse-option-selected" : ""}`}><span className="pulse-option-index">0{index + 1}</span><span><strong>{item}</strong><small>{goalDetail[item]}</small></span><span className="pulse-check">{goal === item ? "✓" : ""}</span></button>)}</div><button onClick={() => setStep(1)} className="pulse-next">Set training priority <ArrowUpRight className="h-4 w-4" /></button></section>}
    {step === 1 && <section className="pulse-stage"><span className="pulse-kicker">Sport context</span><h1>Where do you<br /><em>want to perform?</em></h1><p className="pulse-copy">Choose a sport to load its researched movement demands. Nothing is selected until you choose it.</p><div className="pulse-sport-grid">{sportProfiles.map((profile, index) => <button key={profile.id} onClick={() => setSportId(profile.id)} className={`pulse-sport ${sportId === profile.id ? "pulse-sport-selected" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{sportAbbrev(profile.label)}</strong><small>{profile.movementFamilies.length} movement families</small></button>)}</div><div className="pulse-actions"><button onClick={() => setStep(0)} className="pulse-back">Back</button><button disabled={!sportId} onClick={() => setStep(2)} className="pulse-next">Continue <ArrowUpRight className="h-4 w-4" /></button></div></section>}
    {step === 2 && <section className="pulse-stage"><span className="pulse-kicker">Real-world schedule</span><h1>How many days<br /><em>can you show up?</em></h1><p className="pulse-copy">We will shape the plan to the week you can actually sustain.</p><div className="pulse-frequency-grid">{[[1, "One full-body priority"], [2, "Keep it sharp"], [3, "Build momentum"], [4, "Push progress"], [5, "Train often"], [6, "High exposure"], [7, "Daily practice"]].map(([days, detail]) => <button key={days} onClick={() => setTrainingDays(days as number)} className={`pulse-frequency ${trainingDays === days ? "pulse-frequency-selected" : ""}`}><strong>{days}</strong><span>days / week</span><small>{detail}</small></button>)}</div><div className="pulse-actions"><button onClick={() => setStep(1)} className="pulse-back">Back</button><button onClick={() => setStep(3)} className="pulse-next">Choose my start <ArrowUpRight className="h-4 w-4" /></button></div></section>}
    {step === 3 && <section className="pulse-stage"><span className="pulse-kicker">Choose your start</span><h1>Your plan is<br /><em>ready to take shape.</em></h1><div className="pulse-plan-summary"><span>{sportProfiles.find((profile) => profile.id === sportId)?.label}</span><i /> <span>{goal}</span><i /> <span>{trainingDays} days/week</span></div><div className="pulse-start-grid"><button onClick={() => start("suggested")} className="pulse-start pulse-start-primary"><Sparkles className="h-7 w-7" /><strong>Make my<br />suggested stack</strong><small>Start with a sport-aware plan, then edit every part of it.</small><span>Build my plan <ArrowUpRight className="h-4 w-4" /></span></button><button onClick={() => start("custom")} className="pulse-start"><SlidersHorizontal className="h-7 w-7" /><strong>Start<br />from scratch</strong><small>Open a blank builder and shape the session yourself.</small><span>Open builder <ArrowUpRight className="h-4 w-4" /></span></button></div><button onClick={() => setStep(2)} className="pulse-back mt-7">Back</button></section>}
  </main></div>;
}

export default function Home() {
  let { user, loading, error, isAuthenticated, logout, refresh } = useAuth();
  const startLogin = () => toast.error("Please sign in with your Sports Genome email account.");

  const [workspace, setWorkspaceState] = useState<Workspace>(() => typeof window === "undefined" ? "command" : workspaceFromLocation(new URLSearchParams(window.location.search).get("workspace")));
  const setWorkspace = (next: Workspace) => navigateWorkspace(next);
  const [sportId, setSportId] = useState("");
  const [goal, setGoal] = useState<Goal>("Athleticism");
  const [trainingDays, setTrainingDays] = useState(3);
  const [athleteBaseline, setAthleteBaseline] = useState<AthleteBaseline>({ experience: "Intermediate", weightUnit: "lb", equipment: defaultEquipmentProfile });
  const [gymMinutes, setGymMinutes] = useState(60);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [movementId, setMovementId] = useState("");
  const [activeMuscle, setActiveMuscle] = useState("obliques");
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
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, Exercise[]>>({});
  const [weeklyPrescriptions, setWeeklyPrescriptions] = useState<WeeklyPrescriptionStore>({});
  const [importedPlanContext, setImportedPlanContext] = useState<Record<string, ImportedRoutineContext[]>>({});
  const [planWeeks, setPlanWeeks] = useState<Record<number, WeekSnapshot>>({});
  const [activeWeek, setActiveWeek] = useState(1);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [planHydrated, setPlanHydrated] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [activeSplitDay, setActiveSplitDay] = useState<SplitDay>("Sport Transfer");
  const [activeSplitDayIndex, setActiveSplitDayIndex] = useState(0);
  const [activeLoadout, setActiveLoadout] = useState<LoadoutMode>("Sport Transfer");
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerSide, setPlannerSide] = useState<"left" | "right">("right");
  const [plannerPreferenceHydrated, setPlannerPreferenceHydrated] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [sessionMode, setSessionMode] = useState(false);
  const [loggerScrollRequest, setLoggerScrollRequest] = useState(0);
  const favoriteQuery = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const favoriteMutation = trpc.favorites.set.useMutation();

  const selectedSport = sportProfiles.find((profile) => profile.id === sportId) || sportProfiles[0];
  const activeSportId = sportId || selectedSport.id;
  const gymTimeBudget = getGymTimeBudget(gymMinutes);
  const favoriteIds = useMemo(() => new Set<number>([...localFavoriteIds, ...(favoriteQuery.data || [])]), [localFavoriteIds, favoriteQuery.data]);
  const sportMovements = useMemo(() => sportMovementProfiles.filter((profile) => profile.sportId === activeSportId), [activeSportId]);
  const selectedMovement = sportMovements.find((movement) => movement.id === movementId) || findSportMovement(activeSportId);
  const enrichedSelectedMovement = lookupEnrichedMovement(activeSportId, selectedMovement.id);
  const movementRecommendations = useMemo(() => getMovementRecommendations(selectedMovement, 6, athleteBaseline.sportModifierId), [selectedMovement, athleteBaseline.sportModifierId]);
  const sessionRecommendations = useMemo(() => getSportSession(activeSportId, goal, gymTimeBudget.recommendationLimit, athleteBaseline.equipment, athleteBaseline.sportModifierId), [activeSportId, goal, gymTimeBudget.recommendationLimit, athleteBaseline.equipment, athleteBaseline.sportModifierId]);
  const sportProgrammingContext = useMemo(() => getSportProgrammingContext(activeSportId, athleteBaseline.sportModifierId), [activeSportId, athleteBaseline.sportModifierId]);
  const splitDays = useMemo(() => splitDaysForFrequency(trainingDays), [trainingDays]);
  useEffect(() => {
    const indexedDay = splitDays[activeSplitDayIndex];
    if (indexedDay === activeSplitDay) return;
    const matchingIndex = splitDays.findIndex((day) => day === activeSplitDay);
    if (matchingIndex >= 0) { setActiveSplitDayIndex(matchingIndex); return; }
    setActiveSplitDayIndex(0);
    setActiveSplitDay(splitDays[0]);
  }, [splitDays, activeSplitDay, activeSplitDayIndex]);
  useEffect(() => {
    if (!sessionMode || !loggerScrollRequest) return;
    document.querySelector<HTMLElement>("#workout-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sessionMode, loggerScrollRequest]);
  const draftedLoadout = useMemo(() => {
    const sportSeed = getSportSession(activeSportId, goal, Math.max(8, gymTimeBudget.recommendationLimit + 3), athleteBaseline.equipment, athleteBaseline.sportModifierId).map((item) => item.exercise);
    const pool = filterStackForEquipment(getSplitExercisePool(exercises, activeSplitDay, sportSeed), athleteBaseline.equipment);
    return buildVariedLoadout(pool, activeSplitDay === "Sport Transfer" ? sportSeed : [], activeLoadout, gymTimeBudget.recommendationLimit);
  }, [activeSportId, goal, activeSplitDay, activeLoadout, gymTimeBudget.recommendationLimit, athleteBaseline.equipment, athleteBaseline.sportModifierId]);
  const movementSignals = getMovementSignals(selectedMovement);
  const movementMuscles = getMovementMuscles(selectedMovement);
  const bodyLabRoleContext = getBodyLabRoleContext(activeSportId, selectedMovement.id, movementMuscles, movementSignals.includes("rotation") ? ["abs", "obliques", "glutes"] : ["abs", "glutes"]);
  const filteredCatalog = useMemo(() => exercises.filter((exercise) => `${exercise.name} ${exercise.movement} ${exercise.primaryMuscles.join(" ")}`.toLowerCase().includes(catalogQuery.toLowerCase())).slice(0, 24), [catalogQuery]);
  const genomeExercise = exercises.find((exercise) => exercise.id === genomeExerciseId) || exercises[0];
  const muscleTerms = muscleSearchTerms[activeMuscle] || [activeMuscle.toLowerCase()];
  const muscleMoves = sportMovements.filter((movement) => getMovementMuscles(movement).includes(activeMuscle)).slice(0, 6);
  const completedExerciseCount = customWorkout.filter((exercise) => exerciseSettings[exercise.id]?.completed).length;
  const activePlanStatus = customWorkout.length ? `${customWorkout.length} staged` : "Build a day";
  const activePlanStatusDetail = customWorkout.length ? `${completedExerciseCount} marked complete in the active workspace` : "No exercises are staged in the current Training Day";
  const createWeekSnapshot = (): WeekSnapshot => ({
    customWorkout: [...customWorkout],
    weeklyPlan: Object.fromEntries(Object.entries(weeklyPlan).map(([key, workout]) => [key, [...workout]])),
    prescriptions: { ...prescriptions },
    exerciseSettings: Object.fromEntries(Object.entries(exerciseSettings).map(([key, settings]) => [key, { ...settings }])),
    weeklyPrescriptions: Object.fromEntries(Object.entries(weeklyPrescriptions).map(([key, values]) => [key, { ...values }])),
    importedPlanContext: Object.fromEntries(Object.entries(importedPlanContext).map(([key, items]) => [key, [...items]])),
  });
  const serializeWeekSnapshot = (snapshot: WeekSnapshot): StoredWeekSnapshot => ({
    customWorkoutIds: snapshot.customWorkout.map((exercise) => exercise.id),
    weeklyPlanIds: Object.fromEntries(Object.entries(snapshot.weeklyPlan).map(([key, workout]) => [key, workout.map((exercise) => exercise.id)])),
    prescriptions: snapshot.prescriptions,
    exerciseSettings: snapshot.exerciseSettings,
    weeklyPrescriptions: snapshot.weeklyPrescriptions,
    importedPlanContext: snapshot.importedPlanContext,
  });
  const restoreWeekSnapshot = (snapshot: StoredWeekSnapshot): WeekSnapshot => {
    const fromIds = (ids: number[]) => ids.map((id) => exercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is Exercise => Boolean(exercise));
    return { customWorkout: fromIds(snapshot.customWorkoutIds || []), weeklyPlan: Object.fromEntries(Object.entries(snapshot.weeklyPlanIds || {}).map(([key, ids]) => [key, fromIds(ids)])), prescriptions: snapshot.prescriptions || {}, exerciseSettings: snapshot.exerciseSettings || {}, weeklyPrescriptions: snapshot.weeklyPrescriptions || {}, importedPlanContext: snapshot.importedPlanContext || {} };
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(athleteProfileKey);
      if (stored) {
        const profile = JSON.parse(stored) as StoredAthleteProfile;
        if (profile.version === 1 && sportProfiles.some((sport) => sport.id === profile.sportId)) {
          setSportId(profile.sportId);
          setGoal(profile.goal);
          setTrainingDays(Math.max(1, Math.min(7, profile.trainingDays)));
          setGymMinutes(Math.max(30, Math.min(90, profile.gymMinutes || 60)));
          if (profile.baseline) setAthleteBaseline({ ...profile.baseline, equipment: profile.baseline.equipment || defaultEquipmentProfile });
          setMovementId(profile.movementId);
          setOnboardingComplete(true);
        }
      }
    } catch { /* Stored context is optional and may be cleared safely. */ }
    setProfileHydrated(true);
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
    try {
      const stored = window.localStorage.getItem(workoutPlanKey);
      if (stored) {
        const plan = JSON.parse(stored) as StoredWorkoutPlan;
        const legacy: StoredWeekSnapshot = { customWorkoutIds: plan.customWorkoutIds || [], weeklyPlanIds: plan.weeklyPlanIds || {}, prescriptions: plan.prescriptions || {}, exerciseSettings: plan.exerciseSettings || {}, weeklyPrescriptions: plan.weeklyPrescriptions || {}, importedPlanContext: plan.importedPlanContext || {} };
        const restoredWeeks = Object.fromEntries(Object.entries(plan.weeks || { "1": legacy }).map(([week, snapshot]) => [Number(week), restoreWeekSnapshot(snapshot)]));
        const nextActiveWeek = Math.max(1, Math.min(3, plan.activeWeek || 1));
        const activeSnapshot = restoredWeeks[nextActiveWeek] || restoredWeeks[1] || restoreWeekSnapshot(legacy);
        setPlanWeeks(restoredWeeks);
        setActiveWeek(nextActiveWeek);
        setCustomWorkout(activeSnapshot.customWorkout);
        setWeeklyPlan(activeSnapshot.weeklyPlan);
        setPrescriptions(activeSnapshot.prescriptions);
        setExerciseSettings(activeSnapshot.exerciseSettings);
        setWeeklyPrescriptions(activeSnapshot.weeklyPrescriptions);
        setImportedPlanContext(activeSnapshot.importedPlanContext);
      }
    } catch { /* A malformed saved plan should never block the workout builder. */ }
    setPlanHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(plannerTabKey);
      if (stored === "left" || stored === "right") setPlannerSide(stored);
    } catch { /* The planner remains usable without storage. */ }
  }, []);

  useEffect(() => {
    try { setPlannerOpen(window.localStorage.getItem(plannerOpenKey) === "open"); } catch { /* The planner stays collapsed without storage. */ }
    setPlannerPreferenceHydrated(true);
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(plannerTabKey, plannerSide); } catch { /* Position persistence is optional. */ }
  }, [plannerSide]);

  useEffect(() => {
    if (!plannerPreferenceHydrated) return;
    try { window.localStorage.setItem(plannerOpenKey, plannerOpen ? "open" : "closed"); } catch { /* Visibility persistence is optional. */ }
  }, [plannerOpen, plannerPreferenceHydrated]);

  useEffect(() => {
    if (!profileHydrated || !onboardingComplete || !sportId) return;
    const profile: StoredAthleteProfile = { version: 1, sportId, goal, trainingDays, gymMinutes, movementId: selectedMovement.id, baseline: athleteBaseline };
    try { window.localStorage.setItem(athleteProfileKey, JSON.stringify(profile)); } catch { /* Persistence is optional. */ }
  }, [profileHydrated, onboardingComplete, sportId, goal, trainingDays, gymMinutes, movementId, selectedMovement.id, athleteBaseline]);

  useEffect(() => {
    if (!planHydrated || !onboardingComplete) return;
    const currentWeek = createWeekSnapshot();
    const allWeeks = { ...planWeeks, [activeWeek]: currentWeek };
    const plan: StoredWorkoutPlan = {
      version: 2,
      customWorkoutIds: customWorkout.map((exercise) => exercise.id),
      weeklyPlanIds: Object.fromEntries(Object.entries(weeklyPlan).map(([key, workout]) => [key, workout.map((exercise) => exercise.id)])),
      prescriptions,
      exerciseSettings,
      weeklyPrescriptions,
      importedPlanContext,
      weeks: Object.fromEntries(Object.entries(allWeeks).map(([week, snapshot]) => [week, serializeWeekSnapshot(snapshot)])),
      activeWeek,
    };
    try { window.localStorage.setItem(workoutPlanKey, JSON.stringify(plan)); } catch { /* Persistence is optional. */ }
  }, [planHydrated, onboardingComplete, customWorkout, weeklyPlan, prescriptions, exerciseSettings, weeklyPrescriptions, importedPlanContext, planWeeks, activeWeek]);

  useEffect(() => {
    const nextMuscle = getMovementMuscles(selectedMovement)[0];
    if (nextMuscle) setActiveMuscle(nextMuscle);
  }, [selectedMovement.id]);

  const chooseSport = (id: string) => {
    if (!id) {
      setSportId("");
      setMovementId("");
      setAthleteBaseline((current) => ({ ...current, sportModifierId: undefined }));
      setOnboardingComplete(false);
      setWeeklyPlan({});
      setWeeklyPrescriptions({});
      setPlanWeeks({});
      setActiveWeek(1);
      try { window.localStorage.removeItem(athleteProfileKey); } catch { /* Reset remains usable without storage. */ }
      toast("Sport selection reset", { description: "Choose a sport again in the Pulse Quiz before building a new sport-aware plan." });
      return;
    }
    const changed = Boolean(sportId) && sportId !== id;
    setSportId(id);
    const first = sportMovementProfiles.find((movement) => movement.sportId === id);
    if (first) {
      setMovementId(first.id);
      setActiveMuscle(getMovementMuscles(first)[0] || "abs");
    }
    if (changed) {
      setWeeklyPlan({});
      setWeeklyPrescriptions({});
      setPlanWeeks({});
      setActiveWeek(1);
      toast("Sport context updated", { description: "Your current workout was retained for review; weekly drafts were cleared to avoid a silent mismatch." });
    }
  };
  const navigateWorkspace = (next: Workspace) => {
    if (next === "day-plan" && !splitDays.includes(activeSplitDay)) setActiveSplitDay(splitDays[0]);
    setWorkspaceState(next);
    setRailOpen(false);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("workspace") !== next) {
      url.searchParams.set("workspace", next);
      window.history.pushState({ workspace: next }, "", url);
    }
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };
  useEffect(() => {
    const restoreWorkspace = () => setWorkspaceState(workspaceFromLocation(new URLSearchParams(window.location.search).get("workspace")));
    window.addEventListener("popstate", restoreWorkspace);
    return () => window.removeEventListener("popstate", restoreWorkspace);
  }, []);
  const addExercise = (exercise: Exercise) => setCustomWorkout((current) => {
    if (current.some((item) => item.id === exercise.id)) {
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
    const nextPlan: Record<string, Exercise[]> = {};
    const nextPrescriptions: Record<number, string> = {};
    const nextSettings: Record<number, ExerciseSettings> = {};
    const nextWeeklyPrescriptions: WeeklyPrescriptionStore = {};
    const nextContext: Record<string, ImportedRoutineContext[]> = {};
    const assignments = importedDays.map((day, pastedIndex) => {
      const requested = day.label.toLowerCase();
      const aliases = requested.includes("lower") ? ["lower", "legs"] : requested.includes("upper") ? ["upper", "push", "pull"] : requested.includes("full") ? ["full body", "push"] : requested.includes("condition") || requested.includes("recovery") ? ["sport transfer", "full body"] : [requested];
      const matchedIndex = splitDays.findIndex((split) => aliases.some((alias) => split.toLowerCase().includes(alias) || alias.includes(split.toLowerCase())));
      const index = matchedIndex >= 0 ? matchedIndex : Math.min(pastedIndex, splitDays.length - 1);
      const splitDay = splitDays[index];
      const unique = day.items.filter((item, itemIndex) => day.items.findIndex((candidate) => candidate.exercise.id === item.exercise.id) === itemIndex);
      const dayExercises = unique.map((item) => item.exercise);
      const planKey = `${index}-${splitDay}`;
      nextPlan[planKey] = dayExercises;
      nextContext[planKey] = day.context;
      nextWeeklyPrescriptions[planKey] = Object.fromEntries(unique.map((item) => [item.exercise.id, item.prescription]));
      unique.forEach((item) => {
        nextPrescriptions[item.exercise.id] = item.prescription;
        nextSettings[item.exercise.id] = { rpe: item.rpe || "RPE 7", rest: item.rest || "90 sec", notes: item.notes || "", completed: false };
      });
      return { splitDay, exercises: dayExercises };
    });
    const first = assignments[0];
    setCustomWorkout(first.exercises);
    setPrescriptions(nextPrescriptions);
    setExerciseSettings(nextSettings);
    setWeeklyPlan((current) => ({ ...current, ...nextPlan }));
    setWeeklyPrescriptions((current) => ({ ...current, ...nextWeeklyPrescriptions }));
    setImportedPlanContext((current) => ({ ...current, ...nextContext }));
    setActiveSplitDay(first.splitDay);
    setActiveSplitDayIndex(Math.max(0, splitDays.findIndex((day) => day === first.splitDay)));
    navigateWorkspace("day-plan");
    setImportOpen(false);
    toast("Routine loaded", { description: `${importedDays.length}-day routine loaded with ${Object.values(nextPlan).flat().length} matched exercise${Object.values(nextPlan).flat().length === 1 ? "" : "s"}.` });
  };
  const removeExercise = (id: number) => setCustomWorkout((current) => current.filter((exercise) => exercise.id !== id));
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
  const loadDraft = () => {
    setCustomWorkout(draftedLoadout);
    setPrescriptions({});
    setExerciseSettings({});
    const activeIndex = Math.max(0, splitDays.findIndex((day) => day === activeSplitDay));
    setWeeklyPlan((current) => ({ ...current, [`${activeIndex}-${activeSplitDay}`]: draftedLoadout }));
    setWeeklyPrescriptions((current) => ({ ...current, [`${activeIndex}-${activeSplitDay}`]: Object.fromEntries(draftedLoadout.map((exercise, index) => [exercise.id, prescriptionFor(index, goal)])) }));
    toast("Draft loaded", { description: `${activeSplitDay} is now built with the ${activeLoadout} orientation.` });
  };
  const loadSmartDraft = () => {
    setCustomWorkout(buildSmartDraftWorkout(sessionRecommendations));
    setPrescriptions({});
    setExerciseSettings({});
    toast("Smart draft loaded", { description: "A diversified sport-aware session is ready for review." });
  };
  const updateExerciseSettings = (exerciseId: number, patch: Partial<ExerciseSettings>) => setExerciseSettings((current) => ({ ...current, [exerciseId]: { ...getExerciseSettings(current, exerciseId), ...patch } }));
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
  const activeDayIndex = Math.min(activeSplitDayIndex, splitDays.length - 1);
  const activeImportedContext = importedPlanContext[`${activeDayIndex}-${activeSplitDay}`] || Object.values(importedPlanContext).find((items) => items.length) || [];
  const saveActiveDay = () => {
    const key = `${activeDayIndex}-${activeSplitDay}`;
    setWeeklyPlan((current) => ({ ...current, [key]: customWorkout }));
    setWeeklyPrescriptions((current) => ({ ...current, [key]: Object.fromEntries(customWorkout.map((exercise, index) => [exercise.id, prescriptions[exercise.id] || prescriptionFor(index, goal)])) }));
    toast("Weekly day saved", { description: `${activeSplitDay} now has ${customWorkout.length} exercise${customWorkout.length === 1 ? "" : "s"} saved.` });
  };
  const chooseWeeklyDay = (index: number) => {
    const day = splitDays[index];
    const saved = weeklyPlan[`${index}-${day}`];
    setActiveSplitDay(day);
    setActiveSplitDayIndex(index);
    if (saved?.length) {
      setCustomWorkout(saved);
      setPrescriptions((current) => ({ ...current, ...(weeklyPrescriptions[`${index}-${day}`] || {}) }));
      navigateWorkspace("day-plan");
      toast("Saved day loaded", { description: `${day} was restored from your weekly map.` });
    }
  };
  const applyWeek = (week: number, snapshot: WeekSnapshot) => {
    setActiveWeek(week);
    setCustomWorkout(snapshot.customWorkout);
    setWeeklyPlan(snapshot.weeklyPlan);
    setPrescriptions(snapshot.prescriptions);
    setExerciseSettings(snapshot.exerciseSettings);
    setWeeklyPrescriptions(snapshot.weeklyPrescriptions);
    setImportedPlanContext(snapshot.importedPlanContext);
    setActiveSplitDay(splitDays[0]);
    setActiveSplitDayIndex(0);
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
    const sportSeed = buildGeneratedWeekSportSeed(activeSportId, goal, Math.max(10, gymTimeBudget.recommendationLimit + 4), athleteBaseline.equipment, athleteBaseline.sportModifierId);
    const generatedPlan = Object.fromEntries(splitDays.map((day, dayIndex) => {
      const source = filterStackForEquipment(getSplitExercisePool(exercises, day, sportSeed), athleteBaseline.equipment);
      const offset = (nextWeek * 3) + (dayIndex * 2);
      const rotated = [...source.slice(offset), ...source.slice(0, offset)].filter((exercise, index, values) => values.findIndex((item) => item.id === exercise.id) === index).slice(0, gymTimeBudget.recommendationLimit);
      return [`${dayIndex}-${day}`, rotated];
    }));
    const generatedPrescriptions = Object.fromEntries(Object.entries(generatedPlan).map(([key, workout]) => [key, Object.fromEntries(workout.map((exercise, index) => [exercise.id, prescriptionFor(index, goal)]))]));
    const firstDay = splitDays[0];
    const generated: WeekSnapshot = { customWorkout: generatedPlan[`0-${firstDay}`] || [], weeklyPlan: generatedPlan, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: generatedPrescriptions, importedPlanContext: {} };
    setPlanWeeks((current) => ({ ...current, [activeWeek]: createWeekSnapshot(), [nextWeek]: generated }));
    applyWeek(nextWeek, generated);
    toast(`Week ${nextWeek} generated`, { description: `${splitDays.length} training days were built around your ${goal.toLowerCase()} goal and ${gymTimeBudget.label.toLowerCase()} budget.` });
  };
  const inspectExercise = (exercise: Exercise) => { setInspectedExercise(exercise); setActiveMuscle(exercise.primaryMuscles[0] || "obliques"); };
  const showMovement = (movement: SportMovementProfile) => { setMovementId(movement.id); navigateWorkspace("recommended"); };
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
    setWeeklyPlan({});
    setWeeklyPrescriptions({});
    setImportedPlanContext({});
    setPlanWeeks({});
    setActiveWeek(1);
    setOnboardingComplete(false);
  };

  if (!directWorkspaceAccess && loading) return <div className="account-entry-loading">Checking secure account access…</div>;
  if (!directWorkspaceAccess && !isAuthenticated) return <EmailAuthScreen onAuthenticated={() => { void refresh(); }} loading={loading} />;
  if (!onboardingComplete) return <AthleteBaselineQuiz sports={sportProfiles} onComplete={completeOnboarding} />;

  return <div className={`apex-shell ${directWorkspaceAccess ? "direct-workspace-mode" : ""}`}>
    {railOpen && <button type="button" className="rail-scrim" aria-label="Close workspace navigation" onClick={() => setRailOpen(false)} />}
    <aside className={`apex-rail ${railOpen ? "rail-open" : ""}`}>
      <div className="rail-brand"><img src="/manus-storage/sports-genome-decoding-performance-logo_0544e065.png" alt="Sports Genome — Decoding Performance logo" className="rail-brand-logo shrink-0 object-contain" /><p className="font-display text-[26px] font-bold uppercase tracking-wide text-white">Sports Genome</p><button onClick={() => setRailOpen(false)} className="ml-auto text-[#c8d8e7] lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button></div>
      <div className="rail-athlete"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4512e] font-display text-xl font-bold text-white">{(user?.name || "A").slice(0, 1).toUpperCase()}</div><div><p className="text-sm font-bold text-white">{user?.name || "Athlete"}</p><p className="mt-0.5 text-[10px] text-[#b8cbe0]">Athlete workspace</p></div><button type="button" onClick={() => logout()} className="ml-auto text-[10px] font-bold uppercase tracking-[.1em] text-[#f7cf6c]">Sign out</button></div>
      <nav className="rail-nav" aria-label="Primary workspace navigation">{navGroups.map((group) => <div key={group} className="rail-nav-group"><p>{group}</p>{navItems.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => navigateWorkspace(item.id)} aria-current={workspace === item.id ? "page" : undefined} className={`rail-nav-item ${workspace === item.id ? "rail-nav-active" : ""}`}><Icon className="h-4 w-4" /><span><span className="block text-xs font-bold">{item.label}</span><span className="mt-0.5 block text-[9px] text-[#7d8c85]">{item.detail}</span></span></button>; })}</div>)}</nav>
      <div className="rail-bottom"><div className="rail-data-line"><span>{sportProfiles.length} sports</span><span>{sportMovementProfiles.length} movement maps</span></div><a href="https://localforgeweb.com" target="_blank" rel="noreferrer" className="mt-4 block text-[10px] text-[#9ab1ca]">built by Gabe Naim-LocalForgeWeb</a></div>
    </aside>

    <div className="apex-main">
      <header className="apex-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => setRailOpen(true)} className="grid h-9 w-9 place-items-center border border-[#dce0d8] text-[#3e4a44] lg:hidden" aria-label="Open navigation"><Menu className="h-4 w-4" /></button>
          <div className="min-w-0"><p className="metric-label">{navItems.find((item) => item.id === workspace)?.label}</p><div className="topbar-context-chips" aria-label={`Current planning context: ${selectedSport.label}, ${goal}, ${trainingDays} training days`}><span title={selectedSport.label}>{selectedSport.label}</span><span title={goal}>{goal}</span><span>{trainingDays} days</span></div></div>
        </div>
        <div className="flex items-center gap-2"><label className="hidden items-center gap-2 border border-[#cddbef] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#38658f] lg:flex">Sport<select value={sportId} onChange={(event) => chooseSport(event.target.value)} className="max-w-[150px] bg-transparent text-[#173d69] outline-none"><option value="" disabled>Choose sport</option>{sportProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select></label><button onClick={rebuildPlan} className="hidden border border-[#cddbef] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#38658f] hover:border-[#2d6cdf] hover:text-[#2d6cdf] md:inline">Rebuild plan</button><button onClick={() => navigateWorkspace("day-plan")} className="inline-flex items-center gap-2 bg-[#0b2240] px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-white transition-colors hover:bg-[#2d6cdf]"><Plus className="h-3.5 w-3.5" /> Design day</button></div>
      </header>
      <Suspense fallback={<main className="apex-content"><div className="light-panel p-6 text-sm text-[#58728e]">Loading Exercise Genome analysis…</div></main>}><main className={`apex-content ${workspace === "catalog" ? "catalog-mode-active" : ""}`}>
        <EquipmentConstraintStrip profile={athleteBaseline.equipment} onOpenProfile={() => navigateWorkspace("profile")} actionCue="Choose an action, then inspect or add matches." />
        <div className="planning-disclosure-row"><ModifierEvidenceDisclosure modifierLabel={sportProgrammingContext.modifierLabel} sources={sportProgrammingContext.modifierEvidenceSources} /><HierarchyPlanningDisclosure modifierLabel={sportProgrammingContext.modifierLabel} movement={selectedMovement.label} demands={sportProgrammingContext.physiologicalDemands} physicalQualities={sportProgrammingContext.physicalQualities} adaptations={sportProgrammingContext.adaptationTargets} modality={sportProgrammingContext.modalityBoundary} exerciseRole={sportProgrammingContext.exerciseRole} programming={sportProgrammingContext.programmingBoundary} /></div>
        {workspace === "catalog" && <section className="catalog-experience-surface"><div className="view-header"><div><p className="metric-label">06 / exercise catalog</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">{exercises.length} tools.<br /><em className="text-[#e4512e]">Built for choice.</em></h1></div><div className="view-header-note"><Dumbbell className="h-5 w-5 text-[#e4512e]" /><p>Search by the way you train, filter down to the right options, and heart the exercises you want to keep close. Connection badges compare each tool with the currently selected sport action; they describe mapped support, not guaranteed transfer.</p></div></div><div className="light-panel p-5"><CatalogDiscoveryPanel exercises={exercises} filters={catalogFilters} favoriteIds={favoriteIds} onFiltersChange={setCatalogFilters} onToggleFavorite={toggleFavorite} onInspect={inspectExercise} onAdd={addExercise} selectedActionLabel={selectedMovement.label} connectionForExercise={(exercise) => getExerciseActionConnection(exercise, enrichedSelectedMovement)} /></div></section>}
        {workspace === "profile" && <AthleteAboutMePanel baseline={athleteBaseline} goal={goal} trainingDays={trainingDays} sportId={sportId} sports={sportProfiles} onBaseline={setAthleteBaseline} onGoal={setGoal} onDays={setTrainingDays} onSport={chooseSport} />}
        {workspace === "command" && <TodayActionPanel stagedExerciseCount={customWorkout.length} trainingDays={trainingDays} activeDayLabel={`Week ${activeWeek} · ${activeSplitDay}`} onOpenTraining={() => navigateWorkspace("day-plan")} onOpenStrength={() => navigateWorkspace("strength")} />}
        {workspace === "command" && <section className="home-preference-deck"><div><p className="metric-label">Training context</p><h2>Adjust your plan inputs.</h2><p>Changes update your sport lens, recommendations, and weekly split without restarting the app.</p></div><label><span>Sport</span><select value={sportId} onChange={(event) => chooseSport(event.target.value)}>{sportProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select></label><label><span>Goal</span><select value={goal} onChange={(event) => setGoal(event.target.value as Goal)}>{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>Days / week</span><select value={trainingDays} onChange={(event) => setTrainingDays(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label></section>}
        {workspace === "command" && <section className="gym-time-budget-card"><div><p className="metric-label">Gym-time budget</p><h2>How long do you have today?</h2><p>{gymTimeBudget.scopeCue} Recommended stacks now cap at {gymTimeBudget.recommendationLimit} exercises, while the builder keeps the session-time estimate visible.</p></div><label><span>Available time</span><select value={gymMinutes} onChange={(event) => setGymMinutes(Number(event.target.value))}>{gymTimeOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes === 90 ? "90+ minutes" : `${minutes} minutes`}</option>)}</select><small>{gymTimeBudget.restGuidance}</small></label></section>}
        {workspace === "movement" && <MovementAtlasPanel sportName={selectedSport.label} sportId={activeSportId} sports={sportProfiles} movements={sportMovements} selectedMovement={selectedMovement} query={atlasQuery} family={atlasFamily} onQuery={setAtlasQuery} onFamily={setAtlasFamily} onSport={(id) => { chooseSport(id); setAtlasQuery(""); setAtlasFamily("All"); }} onMovement={(movement) => setMovementId(movement.id)} onOpenBody={() => { setActiveMuscle(getMovementMuscles(selectedMovement)[0] || "abs"); navigateWorkspace("body"); }} />}
        {workspace === "command" && <section className="space-y-5"><div className="command-hero"><img src="/manus-storage/gym-optimizer-performance-lab_fc8df71f.jpg" alt="Athlete training in a performance laboratory" className="command-hero-image" /><div className="command-overlay" /><div className="relative z-10 max-w-3xl p-6 md:p-8"><p className="metric-label !text-[#b8ff5b]">01 / athlete command system</p><h1 className="mt-4 max-w-2xl font-display text-5xl font-bold uppercase leading-[.82] tracking-[-.02em] text-white sm:text-6xl">Train the action.<br /><em className="text-[#b8ff5b]">Not just the muscle.</em></h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#c5d1c9]">Your selected sport is mapped through body actions, muscle roles, contraction demands, and exercise-transfer logic. Every recommendation exposes the “why.”</p><div className="mt-7 grid max-w-xl grid-cols-3 divide-x divide-white/15 border-y border-white/15"><div className="py-3 pr-3"><p className="metric-label !text-[#819188]">Sport profile</p><p className="mt-1 font-display text-xl font-bold uppercase text-white">{sportAbbrev(selectedSport.label)}</p></div><div className="px-3 py-3"><p className="metric-label !text-[#819188]">Movement records</p><p className="mt-1 font-display text-xl font-bold uppercase text-white">{sportMovements.length}</p></div><div className="px-3 py-3"><p className="metric-label !text-[#819188]">Top session fit</p><div className="mt-1"><GradeStamp grade={sessionRecommendations[0]?.grade || "C"} compact /></div></div></div></div><div className="command-signal-card"><p className="metric-label !text-[#b8ff5b]">Active plan</p><p className="mt-2 font-display text-2xl font-bold uppercase leading-none text-white">{activePlanStatus}</p><p className="mt-3 text-xs leading-5 text-[#b6c3bc]">{activePlanStatusDetail}</p><button onClick={() => navigateWorkspace("recommended")} className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#b8ff5b]">Open recommendations <ArrowUpRight className="h-4 w-4" /></button></div></div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><div className="dark-panel p-5"><div className="flex items-start justify-between gap-4"><div><p className="metric-label !text-[#91a09a]">Performance decision</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Today&apos;s movement lens</h2></div><button onClick={() => setWorkspace("movement")} className="text-[#b8ff5b]"><ArrowUpRight className="h-5 w-5" /></button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><Metric label="Body action" value={movementSignals[0].toUpperCase()} detail="dominant movement signal" /><Metric label="Primary tissues" value={String(movementMuscles.length).padStart(2, "0")} detail="mapped muscle groups" tone="orange" /></div><div className="mt-5 border-t border-white/10 pt-4"><p className="metric-label !text-[#91a09a]">Transfer rationale</p><p className="mt-2 text-sm leading-6 text-[#d0d9d3]">{selectedMovement.gymTransferCue}</p></div></div><div className="light-panel p-5"><div className="flex items-start justify-between"><div><p className="metric-label">Coach dashboard</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[#18241f]">Priority blocks</h2></div><BrainCircuit className="h-5 w-5 text-[#e4512e]" /></div><div className="mt-5 space-y-2">{sessionRecommendations.slice(0, 3).map((result, index) => <button key={result.exercise.id} onClick={() => inspectExercise(result.exercise)} className="flex w-full items-center gap-3 border border-[#e4e8e1] bg-white p-3 text-left transition-colors hover:border-[#b8ff5b]"><span className="font-display text-xl font-bold text-[#a4afa8]">0{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{result.exercise.name}</span><span className="mt-1 block truncate text-[10px] text-[#708078]">{result.rationale}</span></span><GradeStamp grade={result.grade} compact /></button>)}</div><button onClick={() => setWorkspace("recommended")} className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#e4512e]">View athlete recommendation <ArrowUpRight className="h-4 w-4" /></button></div></div></section>}

        {workspace === "recommended" && <section className="space-y-5"><div className="view-header"><div><p className="metric-label">02 / recommendation engine</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">Recommendations with<br /><em className="text-[#e4512e]">the reasoning attached.</em></h1></div><div className="view-header-note"><ShieldCheck className="h-5 w-5 text-[#b8ff5b]" /><p>Movement and muscle fit are visible. {equipmentProfileSummary(athleteBaseline.equipment)}</p></div></div><div className="sport-select-row">{sportProfiles.map((profile) => <button key={profile.id} onClick={() => chooseSport(profile.id)} className={`sport-chip ${sportId === profile.id ? "sport-chip-active" : ""}`}><span>{sportAbbrev(profile.label)}</span><small>{profile.movementFamilies.length} families</small></button>)}</div><div className="border-l-2 border-[#e4512e] bg-[#fff1eb] p-4"><p className="metric-label !text-[#c9492b]">Active sport-program lens</p><p className="mt-1 text-xs leading-5 text-[#5d6762]"><strong>{sportProgrammingContext.modifierLabel}:</strong> {sportProgrammingContext.physiologicalDemands.join(" · ")}. <strong>Adaptations:</strong> {sportProgrammingContext.adaptationTargets.join(" · ")}. <strong>Modality:</strong> {sportProgrammingContext.modalityBoundary} <strong>Exercise role:</strong> {sportProgrammingContext.exerciseRole} <strong>Programming context:</strong> {sportProgrammingContext.programmingBoundary}</p></div><div className="grid gap-5 xl:grid-cols-[.92fr_1.35fr]"><div className="dark-panel overflow-hidden"><div className="border-b border-white/10 p-5"><p className="metric-label !text-[#91a09a]">Movement selector / {selectedSport.label}</p><p className="mt-2 text-sm leading-6 text-[#c5d1c9]">Choose an action to see the body requirements and the exercise matches supporting it.</p></div><div className="max-h-[620px] overflow-y-auto p-3">{sportMovements.map((movement, index) => <button key={movement.id} onClick={() => setMovementId(movement.id)} className={`movement-list-item ${movement.id === selectedMovement.id ? "movement-list-active" : ""}`}><span className="font-display text-lg font-bold">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{movement.label}</span><span className="mt-0.5 block truncate text-[10px] text-[#8d9c95]">{movement.family}</span></span><ChevronRight className="h-4 w-4" /></button>)}</div></div><div className="space-y-5"><div className="light-panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="metric-label">Selected sport action</p><h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none text-[#17231f]">{selectedMovement.label}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f6e65]">{selectedMovement.bodyActions}</p></div><span className="border border-[#cfdbce] bg-[#eff7e7] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#2b442c]">{selectedMovement.family}</span></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="insight-cell"><p className="metric-label">Prime movers</p><p>{selectedMovement.primaryMuscles}</p></div><div className="insight-cell"><p className="metric-label">Stabilizers</p><p>{selectedMovement.stabilizers}</p></div><div className="insight-cell"><p className="metric-label">Muscle actions</p><p>{selectedMovement.muscleActions}</p></div></div><div className="mt-4 border-l-2 border-[#e4512e] bg-[#fff1eb] p-4"><p className="metric-label !text-[#c9492b]">Gym transfer cue</p><p className="mt-1 text-xs leading-5 text-[#5d6762]">{selectedMovement.gymTransferCue}</p></div></div><div className="dark-panel overflow-hidden"><div className="flex items-start justify-between border-b border-white/10 p-5"><div><p className="metric-label !text-[#91a09a]">Exercise match set</p><h3 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Build the qualities</h3></div><span className="text-[10px] font-bold uppercase tracking-[.13em] text-[#b8ff5b]">{movementRecommendations.length} matches</span></div><div className="divide-y divide-white/10">{movementRecommendations.map((result, index) => <RecommendationRow key={result.exercise.id} result={result} index={index} onAdd={() => addExercise(result.exercise)} onInspect={() => inspectExercise(result.exercise)} />)}</div></div></div></div></section>}

        {workspace === "custom" && <section className="space-y-5"><div className="builder-upgrade-head"><div><p className="metric-label">03 / custom workout builder</p><h1>Coach controls.<br /><em>Athlete-ready output.</em></h1><p>Build a session, inspect its trade-offs, then map it across the full training week.</p></div><div className="builder-head-actions"><div className="builder-goal-row">{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item) => <button key={item} onClick={() => setGoal(item)} aria-pressed={goal === item} className={`goal-button ${goal === item ? "goal-button-active" : ""}`}>{item}</button>)}</div><button onClick={loadSmartDraft} className="builder-smart-button">Load smart draft <Sparkles className="h-4 w-4" /></button></div></div><div className="grid gap-5 xl:grid-cols-[.86fr_1.14fr]"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} /><div className="workout-programming-panel"><div className="programming-panel-head"><div><p className="metric-label">Programming detail</p><h3>Make the prescription usable</h3><p>Set effort, rest, notes, and completion without losing the current sport-aware draft.</p></div></div><div className="divide-y divide-white/10">{customWorkout.length ? customWorkout.map((exercise, index) => <ExercisePrescriptionRow key={exercise.id} exercise={exercise} index={index} prescription={prescriptions[exercise.id] || prescriptionFor(index, goal)} settings={getExerciseSettings(exerciseSettings, exercise.id)} onPrescription={(value) => setPrescriptions((current) => ({ ...current, [exercise.id]: value }))} onSettings={(patch) => updateExerciseSettings(exercise.id, patch)} onInspect={() => inspectExercise(exercise)} onRemove={() => removeExercise(exercise.id)} />) : <p className="programming-empty">Load a smart draft or add an exercise to unlock detailed programming controls.</p>}</div><WeeklyPlanBoard days={splitDays} activeIndex={activeDayIndex} plan={weeklyPlan} onChoose={chooseWeeklyDay} onSave={saveActiveDay} /><div className="builder-finder"><div className="flex items-center justify-between gap-3"><p className="metric-label">Add an exercise</p><button onClick={() => setWorkspace("recommended")} className="text-[10px] font-bold uppercase tracking-[.1em] text-[#2d6cdf]">Browse movement matches <ArrowUpRight className="inline h-3.5 w-3.5" /></button></div><label className="mt-3 flex items-center gap-2 border border-[#dce7f2] bg-white px-3"><Search className="h-4 w-4 text-[#6683a0]" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Search 300 exercises" /></label><div className="mt-3 grid gap-2 md:grid-cols-2">{filteredCatalog.slice(0, 8).map((exercise) => <div key={exercise.id} className="builder-finder-row"><button onClick={() => inspectExercise(exercise)} className="min-w-0 flex-1 text-left"><strong>{exercise.name}</strong><small>{exercise.movement}</small></button><button onClick={() => addExercise(exercise)} aria-label={`Add ${exercise.name}`}><Plus className="h-4 w-4" /></button></div>)}</div></div></div></div></section>}

        {workspace === "day-plan" && <section className={`day-design-workspace ${sessionMode ? "day-session-mode" : ""}`}><div className="day-design-hero"><div><p className="metric-label">04 / saved training-day plans</p><h1>Design the day.<br /><em>See the week.</em></h1><p>Choose a day, build it directly from the catalog or paste a plan, then save the exact set prescription that informs your weekly muscle-volume estimate.</p></div><button onClick={() => setImportOpen(true)} className="day-design-import"><ClipboardPaste className="h-4 w-4" /> Paste a stack</button></div><ThreeWeekPlanner activeWeek={activeWeek} generatedWeeks={visibleWeeks(Object.keys(planWeeks).map(Number), activeWeek)} dayCounts={Object.fromEntries([1, 2, 3].map((week) => [week, Object.values(week === activeWeek ? weeklyPlan : planWeeks[week]?.weeklyPlan || {}).filter((day) => day.length).length]))} onSelect={selectWeek} onGenerate={generateWeek} /><div className="day-design-grid"><aside className="day-design-rail"><WeeklyPlanBoard days={splitDays} activeIndex={activeDayIndex} plan={weeklyPlan} onChoose={chooseWeeklyDay} onSave={saveActiveDay} /><div className="day-design-rail-note"><p className="metric-label">Plan flow</p><p>Week {activeWeek} is active. Select a day, build its stack directly or import it, then save its set prescription before moving on.</p></div></aside><div className="day-design-main">{sessionMode && <WorkoutExecutionPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} sportId={activeSportId} goal={goal} dayLabel={`Week ${activeWeek} · ${activeSplitDay}`} isAuthenticated={isAuthenticated} onSignIn={startLogin} />}<section className="day-active-card"><div><p className="metric-label">Week {activeWeek} / active training day</p><h2>Day {String(activeDayIndex + 1).padStart(2, "0")} <span>/</span> {activeSplitDay}</h2><p>{customWorkout.length ? `${customWorkout.length} exercises currently staged in Week ${activeWeek}. Edit this day without changing any other saved week.` : "No exercises staged. Use the catalog picker below, paste a stack, or load a smart draft to begin."}</p></div><div className="day-active-actions"><button onClick={() => setSessionMode((value) => !value)}>{sessionMode ? "Hide logger" : "Start session"} <Activity className="h-4 w-4" /></button><button onClick={loadSmartDraft}>Load smart draft <Sparkles className="h-4 w-4" /></button><button onClick={() => setImportOpen(true)}><ClipboardPaste className="h-4 w-4" /> Import this plan</button><PrintWorkoutButton disabled={!customWorkout.length} /></div></section><div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><div className="space-y-5"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /><ImportedPlanContext items={activeImportedContext} /></div><div className="day-programming-panel"><div className="day-programming-head"><div><p className="metric-label">Exercise prescription</p><h3>{activeSplitDay} stack</h3><p>Sets, effort, rest, notes, and order remain editable for this training day. Save when the plan is ready.</p></div><button onClick={saveActiveDay}>Save day</button></div><div className="divide-y divide-white/10">{customWorkout.length ? customWorkout.map((exercise, index) => <div key={exercise.id} className="day-orderable-exercise"><div className="day-order-controls"><button onClick={() => moveExercise(exercise.id, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} earlier`}><ChevronUp className="h-3.5 w-3.5" /></button><button onClick={() => moveExercise(exercise.id, 1)} disabled={index === customWorkout.length - 1} aria-label={`Move ${exercise.name} later`}><ChevronDown className="h-3.5 w-3.5" /></button></div><ExercisePrescriptionRow exercise={exercise} index={index} prescription={prescriptions[exercise.id] || prescriptionFor(index, goal)} settings={getExerciseSettings(exerciseSettings, exercise.id)} onPrescription={(value) => setPrescriptions((current) => ({ ...current, [exercise.id]: value }))} onSettings={(patch) => updateExerciseSettings(exercise.id, patch)} onInspect={() => inspectExercise(exercise)} onRemove={() => removeExercise(exercise.id)} /></div>) : <div className="day-plan-empty"><Dumbbell className="h-6 w-6" /><strong>Build this day from the catalog.</strong><p>Search, filter, and add exercises below. Importing a plan is optional.</p></div>}</div></div></div><DayExercisePicker exercises={exercises} activeWorkout={customWorkout} split={activeSplitDay} onAdd={addExercise} onReplace={replaceExercise} onInspect={inspectExercise} /><div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><div className="space-y-5"><WarmupPanel workout={customWorkout} goal={goal} /><ProgrammingGuidePanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /></div><WeeklyMuscleVolumePanel plan={weeklyPlan} prescriptions={weeklyPrescriptions} goal={goal} /></div><PrintableWorkoutSheet workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} sport={selectedSport.label} dayLabel={`Week ${activeWeek} · ${activeSplitDay}`} /></div></div></section>}
        {workspace === "body" && <section className="body-lab-v2 space-y-5"><div className="view-header"><div><p className="metric-label">04 / interactive body laboratory</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">Body first.<br /><em className="text-[#e4512e]">Details on demand.</em></h1></div><div className="view-header-note"><Activity className="h-5 w-5 text-[#e4512e]" /><p>Switch sport actions directly below, then use the role map to inspect relevant tissue and open exercises for the selected muscle.</p></div></div><BodyLabNavigator sports={sportProfiles} activeSportId={activeSportId} movements={sportMovements} selectedMovement={selectedMovement} onSport={chooseSport} onMovement={(movement) => { setMovementId(movement.id); setActiveMuscle(getMovementMuscles(movement)[0] || "abs"); }} onOpenAtlas={() => navigateWorkspace("movement")} /><AnatomyMap primary={bodyLabRoleContext.primary} secondary={bodyLabRoleContext.supporting} roleDetails={bodyLabRoleContext.rolesByMuscle} roleMethodology={bodyLabRoleContext.methodology} onSelect={setActiveMuscle} /><div className="body-lab-quick-actions"><div><p className="metric-label">Current sporting action</p><strong>{selectedMovement.label}</strong><span>{selectedMovement.family}</span></div><div><p className="metric-label">Selected muscle</p><strong>{muscleLabels[activeMuscle] || activeMuscle}</strong><span>Selected from the atlas</span></div><button onClick={() => { setCatalogFilters({ ...defaultCatalogFilters, muscle: activeMuscle }); navigateWorkspace("catalog"); }}>Find {muscleLabels[activeMuscle] || activeMuscle} exercises <ArrowUpRight className="h-4 w-4" /></button></div></section>}
        {(workspace === "recommended" || workspace === "custom") && <section className="mt-5"><MovementIntelligencePanel movement={enrichedSelectedMovement} fallback={selectedMovement} workout={customWorkout} onAdd={addExercise} onInspect={inspectExercise} compact={workspace === "custom"} /></section>}
        {workspace === "custom" && <section className="builder-prep-workspace"><div className="builder-prep-head"><div><p className="metric-label">Before the work sets</p><h2>Prepare. Then prescribe.</h2><p>Mobility and programming recommendations update from the active exercise stack and selected training goal.</p></div></div><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><div className="space-y-5"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /><ImportedPlanContext items={activeImportedContext} /></div><div className="space-y-5"><WarmupPanel workout={customWorkout} goal={goal} /><ProgrammingGuidePanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /></div></div></section>}
        {workspace === "genome" && <ExerciseGenomeWorkspace exercises={filteredCatalog} selectedExercise={genomeExercise} selectedMovement={selectedMovement} enrichedSelectedMovement={enrichedSelectedMovement} currentWorkout={customWorkout} goal={goal} query={catalogQuery} onQueryChange={setCatalogQuery} onSelectExercise={setGenomeExerciseId} onOpenBody={(muscle) => { setActiveMuscle(muscle); navigateWorkspace("body"); }} onInspect={inspectExercise} />}
        {workspace === "progress" && <ProgressOverviewPanel onOpenStrength={() => navigateWorkspace("strength")} onOpenTraining={() => navigateWorkspace("day-plan")} />}
        {workspace === "strength" && <StrengthGenomePanel onOpenTraining={() => navigateWorkspace("day-plan")} />}
      </main></Suspense>
      {workspace === "custom" && <div className={`planner-float planner-float-${plannerSide}`}><button onClick={() => setPlannerOpen((value) => !value)} aria-expanded={plannerOpen} className={`planner-tab ${plannerOpen ? "planner-tab-open" : ""}`}><SlidersHorizontal className="h-4 w-4" /> {plannerOpen ? "Hide planner" : "Training day"}</button>{plannerOpen && <SplitDraftControls days={splitDays} activeDayIndex={activeDayIndex} activeLoadout={activeLoadout} onDay={(day, index) => { setActiveSplitDay(day); setActiveSplitDayIndex(index); }} onCycle={(direction) => { const nextIndex = cycleSplitIndex(splitDays, activeDayIndex, direction); setActiveSplitDayIndex(nextIndex); setActiveSplitDay(splitDays[nextIndex]); }} onLoadout={setActiveLoadout} onDraft={loadDraft} onClose={() => setPlannerOpen(false)} onMove={() => setPlannerSide((side) => side === "right" ? "left" : "right")} />}</div>}
    </div>
    <div className="mobile-workspace-dock lg:hidden" aria-label="Current workspace actions">
      <div className="mobile-workspace-actions">
        {workspace === "day-plan" && <><span><strong>Training day</strong></span><button type="button" onClick={() => document.querySelector(".day-design-rail")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Choose split</button><button type="button" onClick={() => { setSessionMode(true); setLoggerScrollRequest((request) => request + 1); }}>Track workout</button><button type="button" onClick={() => document.querySelector("#stack-review")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Review stack</button></>}
        {workspace === "command" && <><span><strong>Today</strong></span><button type="button" onClick={() => navigateWorkspace("recommended")}>Recommendations</button><button type="button" onClick={() => navigateWorkspace("day-plan")}>Design day</button></>}
        {workspace === "strength" && <><span><strong>Strength Genome</strong></span><button type="button" onClick={() => navigateWorkspace("day-plan")}>Review training day</button><button type="button" onClick={() => navigateWorkspace("progress")}>View progress</button></>}
        {workspace === "progress" && <><span><strong>Progress</strong></span><button type="button" onClick={() => navigateWorkspace("strength")}>Log a test</button><button type="button" onClick={() => navigateWorkspace("day-plan")}>Training days</button></>}
        {workspace === "profile" && <><span><strong>About me</strong></span><button type="button" onClick={() => navigateWorkspace("recommended")}>Recommendations</button><button type="button" onClick={() => navigateWorkspace("day-plan")}>Review plan</button></>}
        {workspace === "movement" && <><span><strong>Movement Atlas</strong></span><button type="button" onClick={() => { setActiveMuscle(getMovementMuscles(selectedMovement)[0] || "abs"); navigateWorkspace("body"); }}>Open Body Lab</button><button type="button" onClick={() => navigateWorkspace("recommended")}>View matches</button></>}
        {workspace === "body" && <><span><strong>Body Lab</strong></span><button type="button" onClick={() => { setCatalogFilters({ ...defaultCatalogFilters, muscle: activeMuscle }); navigateWorkspace("catalog"); }}>Find exercises</button><button type="button" onClick={() => navigateWorkspace("movement")}>Change action</button></>}
        {workspace === "genome" && <><span><strong>Exercise Genome</strong></span><button type="button" onClick={() => { setActiveMuscle(genomeExercise.primaryMuscles[0] || "abs"); navigateWorkspace("body"); }}>Open Body Lab</button><button type="button" onClick={() => navigateWorkspace("day-plan")}>Review training day</button></>}
        {workspace === "catalog" && <><span><strong>Exercise Catalog</strong></span><button type="button" onClick={() => navigateWorkspace("recommended")}>View matches</button><button type="button" onClick={() => navigateWorkspace("day-plan")}>Training day</button></>}
        {workspace === "recommended" && <><span><strong>Recommendations</strong></span><button type="button" onClick={() => navigateWorkspace("movement")}>Change action</button><button type="button" onClick={() => navigateWorkspace("day-plan")}>Review training day</button></>}
        {workspace === "custom" && <><span><strong>Workout Builder</strong></span><button type="button" onClick={() => document.querySelector("#stack-review")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Review stack</button><button type="button" onClick={() => navigateWorkspace("day-plan")}>Training day</button></>}
      </div>
      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">{[
      { id: "command" as Workspace, label: "Home", icon: Target },
      { id: "day-plan" as Workspace, label: "Train", icon: Layers3 },
      { id: "strength" as Workspace, label: "Genome", icon: BrainCircuit },
      { id: "progress" as Workspace, label: "Progress", icon: BarChart3 },
      { id: "profile" as Workspace, label: "Profile", icon: UsersRound },
    ].map((item) => { const Icon = item.icon; const active = workspace === item.id; return <button type="button" key={item.id} onClick={() => navigateWorkspace(item.id)} aria-current={active ? "page" : undefined} className={active ? "mobile-bottom-nav-active" : ""}><Icon className="h-4 w-4" /><span>{item.label}</span></button>; })}</nav>
    </div>

    {inspectedExercise && <div className="fixed inset-0 z-50 bg-[#09120e]/65 p-0 backdrop-blur-sm xl:p-5"><div className="ml-auto h-full w-full max-w-[720px] overflow-y-auto bg-[#f7f8f3] shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8e0d7] bg-[#f7f8f3]/95 px-5 py-4 backdrop-blur"><div><p className="metric-label">Exercise intelligence</p><p className="mt-1 font-display text-2xl font-bold uppercase leading-none text-[#15221b]">{inspectedExercise.name}</p></div><button onClick={() => setInspectedExercise(null)} className="grid h-9 w-9 place-items-center border border-[#d2dad1] bg-white"><X className="h-4 w-4" /></button></div><div className="p-5"><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><div className="light-panel p-4"><AnatomyMap primary={inspectedExercise.primaryMuscles} secondary={inspectedExercise.secondaryMuscles} onSelect={setActiveMuscle} /></div><div><p className="metric-label">Movement role</p><h3 className="mt-1 font-display text-4xl font-bold uppercase leading-none text-[#17231f]">{inspectedExercise.movement}</h3><div className="mt-4 grid gap-2"><div className="exercise-insight"><p className="metric-label">Primary target</p><p>{inspectedExercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div><div className="exercise-insight"><p className="metric-label">Support tissues</p><p>{inspectedExercise.secondaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div><div className="exercise-insight"><p className="metric-label">Useful qualities</p><p>{inspectedExercise.qualities.join(" · ")}</p></div></div><button onClick={() => { addExercise(inspectedExercise); setWorkspace("custom"); setInspectedExercise(null); }} className="mt-5 inline-flex items-center gap-2 bg-[#17271f] px-4 py-3 text-[10px] font-bold uppercase tracking-[.13em] text-white hover:bg-[#b8ff5b] hover:text-[#142019]">Add to custom workout <Plus className="h-4 w-4" /></button></div></div><CatalogExerciseEvidenceCard exercise={inspectedExercise} /><div className="mt-5 dark-panel p-5"><p className="metric-label !text-[#91a09a]">Current sport-action relevance</p><p className="mt-2 text-sm leading-6 text-[#d1dcd4]">For {selectedMovement.label}, this exercise is most useful when it supports {selectedMovement.family.toLowerCase()} through its {inspectedExercise.movement.toLowerCase()} pattern. Review the sport action in the Movement Atlas to see the full body-action reasoning.</p><button onClick={() => { setInspectedExercise(null); setWorkspace("movement"); }} className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#b8ff5b]">Open sport action <ArrowUpRight className="h-4 w-4" /></button></div><ExerciseGenomePanel exercise={inspectedExercise} context={{ goal, currentWorkout: customWorkout, sportMovement: selectedMovement }} /></div></div></div>}
    {inspectedExercise && <div className="inspection-action-connection-float"><SelectedActionConnectionCard exercise={inspectedExercise} selectedMovement={selectedMovement} enrichedSelectedMovement={enrichedSelectedMovement} /></div>}
    {onboardingComplete && <button type="button" onClick={() => setTutorialOpen(true)} className="feature-guide-button" aria-label="Open Sports Genome guide"><BookOpen className="h-4 w-4" /><span>Guide</span></button>}
    {tutorialOpen && <FeatureTour onClose={() => setTutorialOpen(false)} onNavigate={(view) => navigateWorkspace(view as Workspace)} />}
    {importOpen && <StackImportPanel onClose={() => setImportOpen(false)} onImport={importRoutine} />}
  </div>;
}
