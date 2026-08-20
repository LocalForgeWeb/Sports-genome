/** Apex Performance OS: a premium athlete-and-coach workspace with high-contrast intelligence panels, movement-led recommendations, and visible training logic. */
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, ArrowUpRight, BarChart3, BookOpen, BrainCircuit, ChevronDown, ChevronRight, ChevronUp, ClipboardPaste, Dna, Dumbbell, Layers3, Menu, Move3d, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy, UsersRound, X, Zap } from "lucide-react";
import { AnatomyMap, muscleLabels } from "@/components/AnatomyMap";
import { GradeStamp } from "@/components/GradeStamp";
import { ExerciseGenomePanel } from "@/components/ExerciseGenomePanel";
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
import { MovementAtlasPanel } from "@/components/MovementAtlasPanel";
import { DayExercisePicker } from "@/components/DayExercisePicker";
import { CatalogDiscoveryPanel } from "@/components/CatalogDiscoveryPanel";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { defaultCatalogFilters, type CatalogFilters } from "@/lib/catalogDiscovery";
import { getExerciseSettings, getGoalPrescription, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";
import { lookupEnrichedMovement } from "@/lib/movementProgramAnalysis";
import { sportMovementProfiles, sportProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";
import { findSportMovement, getMovementMuscles, getMovementRecommendations, getMovementSignals, getSportSession, type MovementRecommendation } from "@/lib/movementRecommendations";
import { getGymTimeBudget, gymTimeOptions } from "@/lib/gymTimeBudget";
import { nextWeekToGenerate, visibleWeeks } from "@/lib/threeWeekPlan";
import { getSplitExercisePool } from "@/lib/splitAssignment";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import type { WeeklyPrescriptionStore } from "@/lib/weeklyVolume";

type Workspace = "command" | "recommended" | "custom" | "day-plan" | "body" | "movement" | "catalog" | "genome";
type Goal = TrainingGoal;
type StackMode = "suggested" | "custom";
type StoredAthleteProfile = { version: 1; sportId: string; goal: Goal; trainingDays: number; movementId: string; gymMinutes?: number };
type WeekSnapshot = { customWorkout: Exercise[]; weeklyPlan: Record<string, Exercise[]>; prescriptions: Record<number, string>; exerciseSettings: Record<number, ExerciseSettings>; weeklyPrescriptions: WeeklyPrescriptionStore; importedPlanContext: Record<string, ImportedRoutineContext[]> };
type StoredWeekSnapshot = { customWorkoutIds: number[]; weeklyPlanIds: Record<string, number[]>; prescriptions: Record<number, string>; exerciseSettings: Record<number, ExerciseSettings>; weeklyPrescriptions?: WeeklyPrescriptionStore; importedPlanContext?: Record<string, ImportedRoutineContext[]> };
type StoredWorkoutPlan = { version: 1 | 2; customWorkoutIds: number[]; weeklyPlanIds: Record<string, number[]>; prescriptions: Record<number, string>; exerciseSettings: Record<number, ExerciseSettings>; weeklyPrescriptions?: WeeklyPrescriptionStore; importedPlanContext?: Record<string, ImportedRoutineContext[]>; weeks?: Record<string, StoredWeekSnapshot>; activeWeek?: number };
const athleteProfileKey = "gym-optimizer-athlete-profile-v1";
const workoutPlanKey = "gym-optimizer-workout-plan-v1";
const plannerTabKey = "gym-optimizer-planner-tab-v1";
const favoriteExerciseKey = "gym-optimizer-favorite-exercise-ids-v1";

type NavGroup = "Home" | "Train" | "Explore" | "Sport";
const navGroups: NavGroup[] = ["Home", "Train", "Sport", "Explore"];
const navItems: { id: Workspace; label: string; icon: typeof Target; detail: string; group: NavGroup }[] = [
  { id: "command", label: "Home", icon: Target, detail: "readiness & next decision", group: "Home" },
  { id: "day-plan", label: "Training Days", icon: Layers3, detail: "design each saved day", group: "Train" },
  { id: "recommended", label: "Recommendations", icon: Sparkles, detail: "sport-fit session plans", group: "Train" },
  { id: "custom", label: "Workout Builder", icon: SlidersHorizontal, detail: "coach-editable session", group: "Train" },
  { id: "movement", label: "Movement Atlas", icon: Move3d, detail: "400 researched sport actions", group: "Sport" },
  { id: "body", label: "Body Lab", icon: Activity, detail: "muscle-to-movement analysis", group: "Explore" },
  { id: "catalog", label: "Exercise Catalog", icon: BookOpen, detail: "400 mapped exercises", group: "Explore" },
  { id: "genome", label: "Exercise Genome", icon: Dna, detail: "contextual exercise intelligence", group: "Explore" },
];

const goalDetail: Record<Goal, string> = {
  Athleticism: "Explosive force, movement quality, and sport transfer.",
  "Muscle growth": "More target-tissue work with controlled fatigue.",
  "Max strength": "High force production, bracing, and compound-lift skill.",
  Capacity: "Repeatable output, work tolerance, and positional control.",
};

const initialCustomNames = ["Landmine Rotation", "Bulgarian Split Squat", "Medicine-Ball Rotational Wall Throw", "Farmer’s Walk"];
const splitDaysForFrequency = (days: number): SplitDay[] => days === 1 ? ["Full Body"] : days === 2 ? ["Upper", "Lower"] : days === 3 ? ["Push", "Pull", "Legs"] : days === 4 ? ["Upper", "Lower", "Upper", "Lower"] : days === 5 ? ["Push", "Pull", "Legs", "Upper", "Sport Transfer"] : days === 6 ? ["Push", "Pull", "Legs", "Upper", "Lower", "Sport Transfer"] : ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];
const splitKeywords: Record<SplitDay, string[]> = { Push: ["push", "press", "fly", "dip"], Pull: ["pull", "row", "curl"], Legs: ["squat", "hinge", "lunge", "calf"], Upper: ["push", "press", "pull", "row"], Lower: ["squat", "hinge", "lunge", "deadlift", "calf"], "Full Body": ["squat", "hinge", "push", "pull", "carry"], "Sport Transfer": [] };
const muscleSearchTerms: Record<string, string[]> = {
  chest: ["pectoral"], frontDelts: ["anterior deltoid", "shoulder"], sideDelts: ["middle deltoid", "shoulder"], rearDelts: ["posterior deltoid", "shoulder"], shoulders: ["shoulder", "deltoid"],
  triceps: ["triceps"], biceps: ["biceps"], forearms: ["forearm", "wrist", "grip"], abs: ["abdominal", "rectus abdominis"], obliques: ["oblique"],
  quads: ["quadriceps"], glutes: ["glute"], hamstrings: ["hamstring"], calves: ["calf", "soleus", "gastrocnemius"], tibialis: ["tibialis"],
  abductors: ["abductor", "gluteus medius"], adductors: ["adductor"], lats: ["latissimus"], upperBack: ["upper back", "rhomboid"], traps: ["trapezius"], lowerBack: ["spinal erector"], rotatorCuff: ["rotator cuff"],
};

function sportAbbrev(label: string) {
  return label === "American football" ? "Football" : label === "Brazilian jiu-jitsu" ? "BJJ" : label === "Olympic weightlifting" ? "Weightlifting" : label;
}

function prescriptionFor(index: number, goal: Goal) {
  return getGoalPrescription(goal, index);
}

function Metric({ label, value, detail, tone = "lime" }: { label: string; value: string; detail: string; tone?: "lime" | "orange" | "white" }) {
  return <div className="metric-card"><p className="metric-label">{label}</p><p className={`metric-value metric-${tone}`}>{value}</p><p className="metric-detail">{detail}</p></div>;
}

function RecommendationRow({ result, index, onAdd, onInspect }: { result: MovementRecommendation; index: number; onAdd: () => void; onInspect: () => void }) {
  const metrics = [
    ["Muscle", result.breakdown.muscleMatch],
    ["Joint action", result.breakdown.jointActionMatch],
    ["Quality", result.breakdown.physicalQualityMatch],
    ["Force path", result.breakdown.forceDirectionMatch],
    ["Stability", result.breakdown.stabilityMatch],
    ["Velocity", result.breakdown.velocityMatch],
  ];
  return <article className="recommendation-row"><div className="recommendation-row-main"><span className="recommendation-index">{String(index + 1).padStart(2, "0")}</span><button onClick={onInspect} className="recommendation-copy"><p>{result.exercise.name}</p><small>{result.rationale}</small></button><div className="recommendation-demand"><p>Training contribution</p><small>{result.matchedSignals.join(" · ") || "accessory support"}</small></div><button onClick={onInspect} className="recommendation-score" aria-label={`Inspect the ${result.breakdown.overall} overall match for ${result.exercise.name}`}><strong>{result.breakdown.overall}</strong><small>match</small></button><GradeStamp grade={result.grade} score={result.breakdown.overall} compact /><button onClick={onAdd} className="recommendation-add" aria-label={`Add ${result.exercise.name} to custom workout`}><Plus className="h-4 w-4" /></button></div><details className="recommendation-why"><summary>Why this rank? <span>Inspect the score evidence</span></summary><div className="recommendation-why-grid"><div className="recommendation-score-grid">{metrics.map(([label, value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="recommendation-evidence"><div><p>Strengths</p>{result.breakdown.strengths.map((item) => <span key={item}>+ {item}</span>)}</div><div><p>Limits</p>{result.breakdown.limitations.map((item) => <span key={item}>− {item}</span>)}</div></div></div></details></article>;
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

  return <div className="pulse-shell"><div className="pulse-orb pulse-orb-one" /><div className="pulse-orb pulse-orb-two" /><header className="pulse-header"><div className="flex items-center gap-2"><img src="/manus-storage/gym-optimizer-logo_32341cfa.png" alt="Gym Optimizer logo" className="h-9 w-9 object-contain" /><span className="font-display text-2xl font-bold uppercase tracking-wide text-white">Gym Optimizer</span></div><div className="pulse-progress"><span>STEP {step + 1} / 4</span><div>{[0, 1, 2, 3].map((index) => <i key={index} className={index <= step ? "pulse-progress-on" : ""} />)}</div></div></header><main className="pulse-main">
    {step === 0 && <section className="pulse-stage"><span className="pulse-kicker">Pulse Quiz / Outcome bias</span><h1>What outcome<br /><em>should we bias first?</em></h1><p className="pulse-copy">Choose the quality your next training block should prioritize. Your sport, schedule, and stack will refine the decision next.</p><div className="pulse-option-grid">{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item, index) => <button key={item} onClick={() => setGoal(item)} className={`pulse-option ${goal === item ? "pulse-option-selected" : ""}`}><span className="pulse-option-index">0{index + 1}</span><span><strong>{item}</strong><small>{goalDetail[item]}</small></span><span className="pulse-check">{goal === item ? "✓" : ""}</span></button>)}</div><button onClick={() => setStep(1)} className="pulse-next">Set training priority <ArrowUpRight className="h-4 w-4" /></button></section>}
    {step === 1 && <section className="pulse-stage"><span className="pulse-kicker">Sport context</span><h1>Where do you<br /><em>want to perform?</em></h1><p className="pulse-copy">Choose a sport to load its researched movement demands. Nothing is selected until you choose it.</p><div className="pulse-sport-grid">{sportProfiles.map((profile, index) => <button key={profile.id} onClick={() => setSportId(profile.id)} className={`pulse-sport ${sportId === profile.id ? "pulse-sport-selected" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{sportAbbrev(profile.label)}</strong><small>{profile.movementFamilies.length} movement families</small></button>)}</div><div className="pulse-actions"><button onClick={() => setStep(0)} className="pulse-back">Back</button><button disabled={!sportId} onClick={() => setStep(2)} className="pulse-next">Continue <ArrowUpRight className="h-4 w-4" /></button></div></section>}
    {step === 2 && <section className="pulse-stage"><span className="pulse-kicker">Real-world schedule</span><h1>How many days<br /><em>can you show up?</em></h1><p className="pulse-copy">We will shape the plan to the week you can actually sustain.</p><div className="pulse-frequency-grid">{[[1, "One full-body priority"], [2, "Keep it sharp"], [3, "Build momentum"], [4, "Push progress"], [5, "Train often"], [6, "High exposure"], [7, "Daily practice"]].map(([days, detail]) => <button key={days} onClick={() => setTrainingDays(days as number)} className={`pulse-frequency ${trainingDays === days ? "pulse-frequency-selected" : ""}`}><strong>{days}</strong><span>days / week</span><small>{detail}</small></button>)}</div><div className="pulse-actions"><button onClick={() => setStep(1)} className="pulse-back">Back</button><button onClick={() => setStep(3)} className="pulse-next">Choose my start <ArrowUpRight className="h-4 w-4" /></button></div></section>}
    {step === 3 && <section className="pulse-stage"><span className="pulse-kicker">Choose your start</span><h1>Your plan is<br /><em>ready to take shape.</em></h1><div className="pulse-plan-summary"><span>{sportProfiles.find((profile) => profile.id === sportId)?.label}</span><i /> <span>{goal}</span><i /> <span>{trainingDays} days/week</span></div><div className="pulse-start-grid"><button onClick={() => start("suggested")} className="pulse-start pulse-start-primary"><Sparkles className="h-7 w-7" /><strong>Make my<br />suggested stack</strong><small>Start with a sport-aware plan, then edit every part of it.</small><span>Build my plan <ArrowUpRight className="h-4 w-4" /></span></button><button onClick={() => start("custom")} className="pulse-start"><SlidersHorizontal className="h-7 w-7" /><strong>Start<br />from scratch</strong><small>Open a blank builder and shape the session yourself.</small><span>Open builder <ArrowUpRight className="h-4 w-4" /></span></button></div><button onClick={() => setStep(2)} className="pulse-back mt-7">Back</button></section>}
  </main></div>;
}

function AccountEntry({ onSignIn, passkeyAvailable, loading }: { onSignIn: () => void; passkeyAvailable: boolean; loading: boolean }) {
  return <div className="account-entry-shell"><div className="account-entry-grid" /><header className="account-entry-brand"><img src="/manus-storage/gym-optimizer-logo_32341cfa.png" alt="Gym Optimizer logo" /><div><strong>Gym Optimizer</strong><span>Sport-aware training atlas</span></div></header><main className="account-entry-card"><p className="pulse-kicker">Athlete account / first step</p><h1>Save every plan.<br /><em>Own every rep.</em></h1><p>Create or access your athlete account before building a plan. Your training weeks, saved days, and completed workout logs stay connected to one workspace.</p><button onClick={onSignIn} disabled={loading}>{passkeyAvailable ? "Continue with passkey / Face ID" : "Create account or sign in"} <ArrowUpRight className="h-4 w-4" /></button><small>{passkeyAvailable ? "Your device can use a passkey. The secure account portal will offer Face ID or your device’s biometric check when available." : "Secure sign-in is handled by the account portal. A passkey option appears there on supported devices."}</small></main></div>;
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace>("command");
  const [sportId, setSportId] = useState("");
  const [goal, setGoal] = useState<Goal>("Athleticism");
  const [trainingDays, setTrainingDays] = useState(3);
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
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [planHydrated, setPlanHydrated] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [activeSplitDay, setActiveSplitDay] = useState<SplitDay>("Sport Transfer");
  const [activeLoadout, setActiveLoadout] = useState<LoadoutMode>("Sport Transfer");
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerSide, setPlannerSide] = useState<"left" | "right">("right");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [sessionMode, setSessionMode] = useState(false);
  const favoriteQuery = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const favoriteMutation = trpc.favorites.set.useMutation();

  const selectedSport = sportProfiles.find((profile) => profile.id === sportId) || sportProfiles[0];
  const activeSportId = sportId || selectedSport.id;
  const gymTimeBudget = getGymTimeBudget(gymMinutes);
  const favoriteIds = useMemo(() => new Set<number>([...localFavoriteIds, ...(favoriteQuery.data || [])]), [localFavoriteIds, favoriteQuery.data]);
  const sportMovements = useMemo(() => sportMovementProfiles.filter((profile) => profile.sportId === activeSportId), [activeSportId]);
  const selectedMovement = sportMovements.find((movement) => movement.id === movementId) || findSportMovement(activeSportId);
  const enrichedSelectedMovement = lookupEnrichedMovement(activeSportId, selectedMovement.id);
  const movementRecommendations = useMemo(() => getMovementRecommendations(selectedMovement, 6), [selectedMovement]);
  const sessionRecommendations = useMemo(() => getSportSession(activeSportId, goal, gymTimeBudget.recommendationLimit), [activeSportId, goal, gymTimeBudget.recommendationLimit]);
  const splitDays = useMemo(() => splitDaysForFrequency(trainingDays), [trainingDays]);
  useEffect(() => {
    if (!splitDays.includes(activeSplitDay)) setActiveSplitDay(splitDays[0]);
  }, [splitDays, activeSplitDay]);
  const draftedLoadout = useMemo(() => {
    const sportSeed = getSportSession(activeSportId, goal, Math.max(8, gymTimeBudget.recommendationLimit + 3)).map((item) => item.exercise);
    const pool = getSplitExercisePool(exercises, activeSplitDay, sportSeed);
    const offset = activeLoadout === "Athletic Power" ? 4 : activeLoadout === "Strength Foundation" ? 8 : activeLoadout === "Hypertrophy Volume" ? 12 : activeLoadout === "Capacity Circuit" ? 16 : 0;
    const unique = [...pool.slice(offset), ...pool.slice(0, offset)].reduce<Exercise[]>((list, exercise) => list.some((item) => item.movement === exercise.movement) ? list : [...list, exercise], []);
    const sportAnchor = activeLoadout === "Sport Transfer" || activeSplitDay === "Sport Transfer" ? sportSeed.slice(0, 2) : [];
    return [...sportAnchor, ...unique].filter((exercise, index, array) => array.findIndex((item) => item.id === exercise.id) === index).slice(0, gymTimeBudget.recommendationLimit);
  }, [activeSportId, goal, activeSplitDay, activeLoadout, gymTimeBudget.recommendationLimit]);
  const movementSignals = getMovementSignals(selectedMovement);
  const movementMuscles = getMovementMuscles(selectedMovement);
  const filteredCatalog = useMemo(() => exercises.filter((exercise) => `${exercise.name} ${exercise.movement} ${exercise.primaryMuscles.join(" ")}`.toLowerCase().includes(catalogQuery.toLowerCase())).slice(0, 24), [catalogQuery]);
  const genomeExercise = exercises.find((exercise) => exercise.id === genomeExerciseId) || exercises[0];
  const muscleTerms = muscleSearchTerms[activeMuscle] || [activeMuscle.toLowerCase()];
  const muscleMoves = sportMovements.filter((movement) => getMovementMuscles(movement).includes(activeMuscle)).slice(0, 6);
  const completedExerciseCount = customWorkout.filter((exercise) => exerciseSettings[exercise.id]?.completed).length;
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
    let mounted = true;
    const detectPasskey = async () => {
      if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return;
      try { const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); if (mounted) setPasskeyAvailable(available); } catch { /* The provider portal still offers supported account methods. */ }
    };
    void detectPasskey();
    return () => { mounted = false; };
  }, []);

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
    try { window.localStorage.setItem(plannerTabKey, plannerSide); } catch { /* Position persistence is optional. */ }
  }, [plannerSide]);

  useEffect(() => {
    if (!profileHydrated || !onboardingComplete || !sportId) return;
    const profile: StoredAthleteProfile = { version: 1, sportId, goal, trainingDays, gymMinutes, movementId: selectedMovement.id };
    try { window.localStorage.setItem(athleteProfileKey, JSON.stringify(profile)); } catch { /* Persistence is optional. */ }
  }, [profileHydrated, onboardingComplete, sportId, goal, trainingDays, gymMinutes, movementId, selectedMovement.id]);

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
    setWorkspace("day-plan");
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
    setCustomWorkout(sessionRecommendations.map((result) => result.exercise));
    setPrescriptions({});
    setExerciseSettings({});
    toast("Smart draft loaded", { description: "A diversified sport-aware session is ready for review." });
  };
  const updateExerciseSettings = (exerciseId: number, patch: Partial<ExerciseSettings>) => setExerciseSettings((current) => ({ ...current, [exerciseId]: { ...getExerciseSettings(current, exerciseId), ...patch } }));
  const activeDayIndex = Math.max(0, splitDays.findIndex((day) => day === activeSplitDay));
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
    if (saved?.length) {
      setCustomWorkout(saved);
      setPrescriptions((current) => ({ ...current, ...(weeklyPrescriptions[`${index}-${day}`] || {}) }));
      setWorkspace("day-plan");
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
    setSessionMode(false);
    setWorkspace("day-plan");
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
    const sportSeed = getSportSession(activeSportId, goal, Math.max(10, gymTimeBudget.recommendationLimit + 4)).map((item) => item.exercise);
    const generatedPlan = Object.fromEntries(splitDays.map((day, dayIndex) => {
      const source = getSplitExercisePool(exercises, day, sportSeed);
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
  const showMovement = (movement: SportMovementProfile) => { setMovementId(movement.id); setWorkspace("recommended"); };
  const completeOnboarding = ({ goal: selectedGoal, trainingDays: selectedDays, sportId: selectedSportId, stackMode }: { goal: Goal; trainingDays: number; sportId: string; stackMode: StackMode }) => {
    setGoal(selectedGoal);
    setTrainingDays(selectedDays);
    chooseSport(selectedSportId);
    if (stackMode === "suggested") {
      setCustomWorkout(getSportSession(selectedSportId, selectedGoal, Math.min(6, selectedDays + 2)).map((result) => result.exercise));
      setWorkspace("recommended");
    } else {
      setCustomWorkout([]);
      setWorkspace("custom");
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

  if (loading) return <div className="account-entry-loading">Checking secure account access…</div>;
  if (!isAuthenticated) return <AccountEntry onSignIn={startLogin} passkeyAvailable={passkeyAvailable} loading={loading} />;
  if (!onboardingComplete) return <Onboarding onComplete={completeOnboarding} />;

  return <div className="apex-shell">
    <aside className={`apex-rail ${railOpen ? "rail-open" : ""}`}>
      {!loading && <div className="rail-account-control">{isAuthenticated ? <><span>{user?.name || "Training account"}</span><button onClick={() => logout()}>Sign out</button></> : <button onClick={startLogin}>Sign in to save workouts</button>}</div>}
      <div className="rail-brand"><img src="/manus-storage/gym-optimizer-logo_32341cfa.png" alt="Gym Optimizer logo" className="h-10 w-10 object-contain" /><div><p className="font-display text-[22px] font-bold leading-[.72] tracking-wide text-white">GYM<br />OPTIMIZER</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-[#79a9ff]">Sport-aware training atlas</p></div><button onClick={() => setRailOpen(false)} className="ml-auto text-[#8d9c95] lg:hidden"><X className="h-5 w-5" /></button></div>
      <div className="rail-athlete"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b8ff5b] font-display text-xl font-bold text-[#101a1c]">{(user?.name || "A").slice(0, 1).toUpperCase()}</div><div><p className="text-xs font-bold text-white">{user?.name || "Athlete"}</p><p className="mt-0.5 text-[10px] text-[#8d9c95]">Secure training workspace</p></div><UsersRound className="ml-auto h-4 w-4 text-[#8d9c95]" /></div>
      <nav className="rail-nav">{navGroups.map((group) => <div key={group} className="rail-nav-group"><p>{group}</p>{navItems.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { if (item.id === "day-plan" && !splitDays.includes(activeSplitDay)) setActiveSplitDay(splitDays[0]); setWorkspace(item.id); setRailOpen(false); }} className={`rail-nav-item ${workspace === item.id ? "rail-nav-active" : ""}`}><Icon className="h-4 w-4" /><span><span className="block text-xs font-bold">{item.label}</span><span className="mt-0.5 block text-[9px] text-[#7d8c85]">{item.detail}</span></span></button>; })}</div>)}</nav>
      <div className="rail-bottom"><div className="rail-data-card"><p className="metric-label">Research engine</p><div className="mt-2 flex items-end justify-between"><p className="font-display text-4xl font-bold text-white">20</p><span className="mb-1 text-[10px] font-bold text-[#b8ff5b]">SPORTS</span></div><p className="mt-1 text-[11px] leading-4 text-[#8d9c95]">400 movement profiles linked to 400 exercises.</p></div><a href="https://localforgeweb.com" target="_blank" rel="noreferrer" className="mt-4 block text-[10px] text-[#77857f] transition-colors hover:text-white">Built by Gabe Naim — LocalForgeWeb</a></div>
    </aside>

    <div className="apex-main">
      <header className="apex-topbar"><div className="flex items-center gap-3"><button onClick={() => setRailOpen(true)} className="grid h-9 w-9 place-items-center border border-[#dce0d8] text-[#3e4a44] lg:hidden"><Menu className="h-4 w-4" /></button><div><p className="metric-label">{navItems.find((item) => item.id === workspace)?.label}</p><p className="mt-1 text-sm font-bold text-[#18241f]">{selectedSport.label} <span className="mx-1.5 text-[#a2aca4]">/</span> {goal} <span className="mx-1.5 text-[#a2aca4]">/</span> {trainingDays} days</p></div></div><div className="flex items-center gap-2"><label className="hidden items-center gap-2 border border-[#cddbef] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#38658f] lg:flex">Sport<select value={sportId} onChange={(event) => chooseSport(event.target.value)} className="max-w-[150px] bg-transparent text-[#173d69] outline-none"><option value="" disabled>Choose sport</option>{sportProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select></label><button onClick={rebuildPlan} className="hidden border border-[#cddbef] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#38658f] hover:border-[#2d6cdf] hover:text-[#2d6cdf] md:inline">Rebuild plan</button><button onClick={() => setWorkspace("day-plan")} className="inline-flex items-center gap-2 bg-[#0b2240] px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-white transition-colors hover:bg-[#2d6cdf]"><Plus className="h-3.5 w-3.5" /> Design day</button></div></header>
      <main className={`apex-content ${workspace === "catalog" ? "catalog-mode-active" : ""}`}>
        {workspace === "catalog" && <section className="catalog-experience-surface"><div className="view-header"><div><p className="metric-label">06 / exercise catalog</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">400 tools.<br /><em className="text-[#e4512e]">Built for choice.</em></h1></div><div className="view-header-note"><Dumbbell className="h-5 w-5 text-[#e4512e]" /><p>Search by the way you train, filter down to the right options, and heart the exercises you want to keep close.</p></div></div><div className="light-panel p-5"><CatalogDiscoveryPanel exercises={exercises} filters={catalogFilters} favoriteIds={favoriteIds} onFiltersChange={setCatalogFilters} onToggleFavorite={toggleFavorite} onInspect={inspectExercise} onAdd={addExercise} /></div></section>}
        {workspace === "command" && <section className="home-preference-deck"><div><p className="metric-label">Training context</p><h2>Adjust your plan inputs.</h2><p>Changes update your sport lens, recommendations, and weekly split without restarting the app.</p></div><label><span>Sport</span><select value={sportId} onChange={(event) => chooseSport(event.target.value)}>{sportProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select></label><label><span>Goal</span><select value={goal} onChange={(event) => setGoal(event.target.value as Goal)}>{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>Days / week</span><select value={trainingDays} onChange={(event) => setTrainingDays(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label></section>}
        {workspace === "command" && <section className="gym-time-budget-card"><div><p className="metric-label">Gym-time budget</p><h2>How long do you have today?</h2><p>{gymTimeBudget.scopeCue} Recommended stacks now cap at {gymTimeBudget.recommendationLimit} exercises, while the builder keeps the session-time estimate visible.</p></div><label><span>Available time</span><select value={gymMinutes} onChange={(event) => setGymMinutes(Number(event.target.value))}>{gymTimeOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes === 90 ? "90+ minutes" : `${minutes} minutes`}</option>)}</select><small>{gymTimeBudget.restGuidance}</small></label></section>}
        {workspace === "movement" && <MovementAtlasPanel sportName={selectedSport.label} sportId={activeSportId} sports={sportProfiles} movements={sportMovements} selectedMovement={selectedMovement} query={atlasQuery} family={atlasFamily} onQuery={setAtlasQuery} onFamily={setAtlasFamily} onSport={(id) => { chooseSport(id); setAtlasQuery(""); setAtlasFamily("All"); }} onMovement={(movement) => setMovementId(movement.id)} onOpenBody={() => { setActiveMuscle(getMovementMuscles(selectedMovement)[0] || "abs"); setWorkspace("body"); }} />}
        {workspace === "command" && <section className="space-y-5"><div className="command-hero"><img src="/manus-storage/gym-optimizer-performance-lab_fc8df71f.jpg" alt="Athlete training in a performance laboratory" className="command-hero-image" /><div className="command-overlay" /><div className="relative z-10 max-w-3xl p-6 md:p-8"><p className="metric-label !text-[#b8ff5b]">01 / athlete command system</p><h1 className="mt-4 max-w-2xl font-display text-5xl font-bold uppercase leading-[.82] tracking-[-.02em] text-white sm:text-6xl">Train the action.<br /><em className="text-[#b8ff5b]">Not just the muscle.</em></h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#c5d1c9]">Your selected sport is mapped through body actions, muscle roles, contraction demands, and exercise-transfer logic. Every recommendation exposes the “why.”</p><div className="mt-7 grid max-w-xl grid-cols-3 divide-x divide-white/15 border-y border-white/15"><div className="py-3 pr-3"><p className="metric-label !text-[#819188]">Sport profile</p><p className="mt-1 font-display text-xl font-bold uppercase text-white">{sportAbbrev(selectedSport.label)}</p></div><div className="px-3 py-3"><p className="metric-label !text-[#819188]">Movement records</p><p className="mt-1 font-display text-xl font-bold uppercase text-white">20</p></div><div className="px-3 py-3"><p className="metric-label !text-[#819188]">Top session fit</p><div className="mt-1"><GradeStamp grade={sessionRecommendations[0]?.grade || "C"} compact /></div></div></div></div><div className="command-signal-card"><p className="metric-label !text-[#b8ff5b]">Next movement</p><p className="mt-2 font-display text-2xl font-bold uppercase leading-none text-white">{selectedMovement.label}</p><p className="mt-3 text-xs leading-5 text-[#b6c3bc]">{selectedMovement.family}</p><button onClick={() => setWorkspace("recommended")} className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#b8ff5b]">Open recommendations <ArrowUpRight className="h-4 w-4" /></button></div></div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><div className="dark-panel p-5"><div className="flex items-start justify-between gap-4"><div><p className="metric-label !text-[#91a09a]">Performance decision</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Today&apos;s movement lens</h2></div><button onClick={() => setWorkspace("movement")} className="text-[#b8ff5b]"><ArrowUpRight className="h-5 w-5" /></button></div><div className="mt-5 grid gap-3 md:grid-cols-3"><Metric label="Body action" value={movementSignals[0].toUpperCase()} detail="dominant movement signal" /><Metric label="Primary tissues" value={String(movementMuscles.length).padStart(2, "0")} detail="mapped muscle groups" tone="orange" /><Metric label="Session readiness" value="82" detail="coach-set planning marker" tone="white" /></div><div className="mt-5 border-t border-white/10 pt-4"><p className="metric-label !text-[#91a09a]">Transfer rationale</p><p className="mt-2 text-sm leading-6 text-[#d0d9d3]">{selectedMovement.gymTransferCue}</p></div></div><div className="light-panel p-5"><div className="flex items-start justify-between"><div><p className="metric-label">Coach dashboard</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-[#18241f]">Priority blocks</h2></div><BrainCircuit className="h-5 w-5 text-[#e4512e]" /></div><div className="mt-5 space-y-2">{sessionRecommendations.slice(0, 3).map((result, index) => <button key={result.exercise.id} onClick={() => inspectExercise(result.exercise)} className="flex w-full items-center gap-3 border border-[#e4e8e1] bg-white p-3 text-left transition-colors hover:border-[#b8ff5b]"><span className="font-display text-xl font-bold text-[#a4afa8]">0{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{result.exercise.name}</span><span className="mt-1 block truncate text-[10px] text-[#708078]">{result.rationale}</span></span><GradeStamp grade={result.grade} compact /></button>)}</div><button onClick={() => setWorkspace("recommended")} className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#e4512e]">View athlete recommendation <ArrowUpRight className="h-4 w-4" /></button></div></div></section>}

        {workspace === "recommended" && <section className="space-y-5"><div className="view-header"><div><p className="metric-label">02 / recommendation engine</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">Recommendations with<br /><em className="text-[#e4512e]">the reasoning attached.</em></h1></div><div className="view-header-note"><ShieldCheck className="h-5 w-5 text-[#b8ff5b]" /><p>Movement and muscle fit are visible. Sport grades are decision-support heuristics, not guarantees.</p></div></div><div className="sport-select-row">{sportProfiles.map((profile) => <button key={profile.id} onClick={() => chooseSport(profile.id)} className={`sport-chip ${sportId === profile.id ? "sport-chip-active" : ""}`}><span>{sportAbbrev(profile.label)}</span><small>{profile.movementFamilies.length} families</small></button>)}</div><div className="grid gap-5 xl:grid-cols-[.92fr_1.35fr]"><div className="dark-panel overflow-hidden"><div className="border-b border-white/10 p-5"><p className="metric-label !text-[#91a09a]">Movement selector / {selectedSport.label}</p><p className="mt-2 text-sm leading-6 text-[#c5d1c9]">Choose an action to see the body requirements and the exercise matches supporting it.</p></div><div className="max-h-[620px] overflow-y-auto p-3">{sportMovements.map((movement, index) => <button key={movement.id} onClick={() => setMovementId(movement.id)} className={`movement-list-item ${movement.id === selectedMovement.id ? "movement-list-active" : ""}`}><span className="font-display text-lg font-bold">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{movement.label}</span><span className="mt-0.5 block truncate text-[10px] text-[#8d9c95]">{movement.family}</span></span><ChevronRight className="h-4 w-4" /></button>)}</div></div><div className="space-y-5"><div className="light-panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="metric-label">Selected sport action</p><h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none text-[#17231f]">{selectedMovement.label}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f6e65]">{selectedMovement.bodyActions}</p></div><span className="border border-[#cfdbce] bg-[#eff7e7] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#2b442c]">{selectedMovement.family}</span></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="insight-cell"><p className="metric-label">Prime movers</p><p>{selectedMovement.primaryMuscles}</p></div><div className="insight-cell"><p className="metric-label">Stabilizers</p><p>{selectedMovement.stabilizers}</p></div><div className="insight-cell"><p className="metric-label">Muscle actions</p><p>{selectedMovement.muscleActions}</p></div></div><div className="mt-4 border-l-2 border-[#e4512e] bg-[#fff1eb] p-4"><p className="metric-label !text-[#c9492b]">Gym transfer cue</p><p className="mt-1 text-xs leading-5 text-[#5d6762]">{selectedMovement.gymTransferCue}</p></div></div><div className="dark-panel overflow-hidden"><div className="flex items-start justify-between border-b border-white/10 p-5"><div><p className="metric-label !text-[#91a09a]">Exercise match set</p><h3 className="mt-1 font-display text-3xl font-bold uppercase leading-none text-white">Build the qualities</h3></div><span className="text-[10px] font-bold uppercase tracking-[.13em] text-[#b8ff5b]">{movementRecommendations.length} matches</span></div><div className="divide-y divide-white/10">{movementRecommendations.map((result, index) => <RecommendationRow key={result.exercise.id} result={result} index={index} onAdd={() => addExercise(result.exercise)} onInspect={() => inspectExercise(result.exercise)} />)}</div></div></div></div></section>}

        {workspace === "custom" && <section className="space-y-5"><div className="view-header"><div><p className="metric-label">03 / custom workout builder</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">Coach controls.<br /><em className="text-[#e4512e]">Athlete-ready output.</em></h1></div><div className="flex gap-2">{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item) => <button key={item} onClick={() => setGoal(item)} className={`goal-button ${goal === item ? "goal-button-active" : ""}`}>{item}</button>)}</div></div><div className="grid gap-5 xl:grid-cols-[1.18fr_.82fr]"><div className="dark-panel"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-5"><div><p className="metric-label !text-[#91a09a]">Custom session / {selectedSport.label}</p><h2 className="mt-1 font-display text-4xl font-bold uppercase leading-none text-white">{goal}</h2><p className="mt-2 text-xs text-[#93a198]">{goalDetail[goal]}</p></div><button onClick={() => setCustomWorkout(sessionRecommendations.map((result) => result.exercise))} className="border border-[#b8ff5b] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#b8ff5b] hover:bg-[#b8ff5b] hover:text-[#142019]">Load smart draft</button></div><div className="divide-y divide-white/10">{customWorkout.length ? customWorkout.map((exercise, index) => <div key={exercise.id} className="custom-row"><span className="font-display text-2xl font-bold text-[#6d7b74]">{String(index + 1).padStart(2, "0")}</span><button onClick={() => inspectExercise(exercise)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-bold text-white">{exercise.name}</p><p className="mt-1 text-[10px] text-[#8d9c95]">{exercise.movement} · {exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></button><select value={prescriptions[exercise.id] || prescriptionFor(index, goal)} onChange={(event) => setPrescriptions((current) => ({ ...current, [exercise.id]: event.target.value }))} className="h-9 border border-white/15 bg-[#192723] px-2 text-xs font-bold text-white outline-none"><option>4 × 3–5</option><option>3 × 6–10</option><option>3 × 8–12</option><option>3 × 12–15</option><option>4 × 30 sec</option></select><button onClick={() => removeExercise(exercise.id)} className="ml-1 grid h-9 w-9 place-items-center border border-white/10 text-[#90a098] hover:border-[#e4512e] hover:text-[#e4512e]" aria-label={`Remove ${exercise.name}`}><X className="h-4 w-4" /></button></div>) : <div className="p-10 text-center"><Dumbbell className="mx-auto h-6 w-6 text-[#5f6e65]" /><p className="mt-3 text-sm font-bold text-white">No exercises selected.</p><p className="mt-1 text-xs text-[#91a09a]">Add from the catalog or load a smart sport draft.</p></div>}</div><div className="border-t border-white/10 p-5"><button onClick={() => setWorkspace("recommended")} className="inline-flex items-center gap-2 bg-[#b8ff5b] px-4 py-3 text-[10px] font-bold uppercase tracking-[.13em] text-[#132019]">Add recommendations <Plus className="h-4 w-4" /></button></div></div><div className="light-panel p-5"><p className="metric-label">Exercise finder</p><label className="mt-4 flex items-center gap-2 border border-[#dce0d8] bg-white px-3"><Search className="h-4 w-4 text-[#728078]" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-[#9ba69f]" placeholder="Search 300 exercises" /></label><div className="mt-4 max-h-[520px] space-y-1 overflow-y-auto">{filteredCatalog.map((exercise) => <div key={exercise.id} className="finder-row"><button onClick={() => inspectExercise(exercise)} className="min-w-0 flex-1 text-left"><p className="truncate text-xs font-bold">{exercise.name}</p><p className="mt-1 truncate text-[10px] text-[#748179]">{exercise.movement}</p></button><button onClick={() => addExercise(exercise)} className="grid h-8 w-8 place-items-center border border-[#ccd6cc] text-[#3f5046] hover:border-[#b8ff5b] hover:bg-[#b8ff5b]"><Plus className="h-4 w-4" /></button></div>)}</div></div></div></section>}

        {workspace === "custom" && <section className="space-y-5"><div className="builder-upgrade-head"><div><p className="metric-label">03 / custom workout builder</p><h1>Coach controls.<br /><em>Athlete-ready output.</em></h1><p>Build a session, inspect its trade-offs, then map it across the full training week.</p></div><div className="builder-head-actions"><div className="builder-goal-row">{(["Athleticism", "Muscle growth", "Max strength", "Capacity"] as Goal[]).map((item) => <button key={item} onClick={() => setGoal(item)} aria-pressed={goal === item} className={`goal-button ${goal === item ? "goal-button-active" : ""}`}>{item}</button>)}</div><button onClick={loadSmartDraft} className="builder-smart-button">Load smart draft <Sparkles className="h-4 w-4" /></button></div></div><div className="grid gap-5 xl:grid-cols-[.86fr_1.14fr]"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} /><div className="workout-programming-panel"><div className="programming-panel-head"><div><p className="metric-label">Programming detail</p><h3>Make the prescription usable</h3><p>Set effort, rest, notes, and completion without losing the current sport-aware draft.</p></div></div><div className="divide-y divide-white/10">{customWorkout.length ? customWorkout.map((exercise, index) => <ExercisePrescriptionRow key={exercise.id} exercise={exercise} index={index} prescription={prescriptions[exercise.id] || prescriptionFor(index, goal)} settings={getExerciseSettings(exerciseSettings, exercise.id)} onPrescription={(value) => setPrescriptions((current) => ({ ...current, [exercise.id]: value }))} onSettings={(patch) => updateExerciseSettings(exercise.id, patch)} onInspect={() => inspectExercise(exercise)} onRemove={() => removeExercise(exercise.id)} />) : <p className="programming-empty">Load a smart draft or add an exercise to unlock detailed programming controls.</p>}</div><WeeklyPlanBoard days={splitDays} activeIndex={activeDayIndex} plan={weeklyPlan} onChoose={chooseWeeklyDay} onSave={saveActiveDay} /><div className="builder-finder"><div className="flex items-center justify-between gap-3"><p className="metric-label">Add an exercise</p><button onClick={() => setWorkspace("recommended")} className="text-[10px] font-bold uppercase tracking-[.1em] text-[#2d6cdf]">Browse movement matches <ArrowUpRight className="inline h-3.5 w-3.5" /></button></div><label className="mt-3 flex items-center gap-2 border border-[#dce7f2] bg-white px-3"><Search className="h-4 w-4 text-[#6683a0]" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Search 300 exercises" /></label><div className="mt-3 grid gap-2 md:grid-cols-2">{filteredCatalog.slice(0, 8).map((exercise) => <div key={exercise.id} className="builder-finder-row"><button onClick={() => inspectExercise(exercise)} className="min-w-0 flex-1 text-left"><strong>{exercise.name}</strong><small>{exercise.movement}</small></button><button onClick={() => addExercise(exercise)} aria-label={`Add ${exercise.name}`}><Plus className="h-4 w-4" /></button></div>)}</div></div></div></div></section>}

        {workspace === "day-plan" && <section className={`day-design-workspace ${sessionMode ? "day-session-mode" : ""}`}><div className="day-design-hero"><div><p className="metric-label">04 / saved training-day plans</p><h1>Design the day.<br /><em>See the week.</em></h1><p>Choose a day, build it directly from the catalog or paste a plan, then save the exact set prescription that informs your weekly muscle-volume estimate.</p></div><button onClick={() => setImportOpen(true)} className="day-design-import"><ClipboardPaste className="h-4 w-4" /> Paste a stack</button></div><ThreeWeekPlanner activeWeek={activeWeek} generatedWeeks={visibleWeeks(Object.keys(planWeeks).map(Number), activeWeek)} dayCounts={Object.fromEntries([1, 2, 3].map((week) => [week, Object.values(week === activeWeek ? weeklyPlan : planWeeks[week]?.weeklyPlan || {}).filter((day) => day.length).length]))} onSelect={selectWeek} onGenerate={generateWeek} /><div className="day-design-grid"><aside className="day-design-rail"><WeeklyPlanBoard days={splitDays} activeIndex={activeDayIndex} plan={weeklyPlan} onChoose={chooseWeeklyDay} onSave={saveActiveDay} /><div className="day-design-rail-note"><p className="metric-label">Plan flow</p><p>Week {activeWeek} is active. Select a day, build its stack directly or import it, then save its set prescription before moving on.</p></div></aside><div className="day-design-main">{sessionMode && <WorkoutExecutionPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} sportId={activeSportId} goal={goal} dayLabel={`Week ${activeWeek} · ${activeSplitDay}`} isAuthenticated={isAuthenticated} onSignIn={startLogin} />}<section className="day-active-card"><div><p className="metric-label">Week {activeWeek} / active training day</p><h2>Day {String(activeDayIndex + 1).padStart(2, "0")} <span>/</span> {activeSplitDay}</h2><p>{customWorkout.length ? `${customWorkout.length} exercises currently staged in Week ${activeWeek}. Edit this day without changing any other saved week.` : "No exercises staged. Use the catalog picker below, paste a stack, or load a smart draft to begin."}</p></div><div className="day-active-actions"><button onClick={() => setSessionMode((value) => !value)}>{sessionMode ? "Hide logger" : "Start session"} <Activity className="h-4 w-4" /></button><button onClick={loadSmartDraft}>Load smart draft <Sparkles className="h-4 w-4" /></button><button onClick={() => setImportOpen(true)}><ClipboardPaste className="h-4 w-4" /> Import this plan</button></div></section><div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><div className="space-y-5"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /><ImportedPlanContext items={activeImportedContext} /></div><div className="day-programming-panel"><div className="day-programming-head"><div><p className="metric-label">Exercise prescription</p><h3>{activeSplitDay} stack</h3><p>Sets, effort, rest, notes, and order remain editable for this training day. Save when the plan is ready.</p></div><button onClick={saveActiveDay}>Save day</button></div><div className="divide-y divide-white/10">{customWorkout.length ? customWorkout.map((exercise, index) => <div key={exercise.id} className="day-orderable-exercise"><div className="day-order-controls"><button onClick={() => moveExercise(exercise.id, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} earlier`}><ChevronUp className="h-3.5 w-3.5" /></button><button onClick={() => moveExercise(exercise.id, 1)} disabled={index === customWorkout.length - 1} aria-label={`Move ${exercise.name} later`}><ChevronDown className="h-3.5 w-3.5" /></button></div><ExercisePrescriptionRow exercise={exercise} index={index} prescription={prescriptions[exercise.id] || prescriptionFor(index, goal)} settings={getExerciseSettings(exerciseSettings, exercise.id)} onPrescription={(value) => setPrescriptions((current) => ({ ...current, [exercise.id]: value }))} onSettings={(patch) => updateExerciseSettings(exercise.id, patch)} onInspect={() => inspectExercise(exercise)} onRemove={() => removeExercise(exercise.id)} /></div>) : <div className="day-plan-empty"><Dumbbell className="h-6 w-6" /><strong>Build this day from the catalog.</strong><p>Search, filter, and add exercises below. Importing a plan is optional.</p></div>}</div></div></div><DayExercisePicker exercises={exercises} activeWorkout={customWorkout} split={activeSplitDay} onAdd={addExercise} onReplace={replaceExercise} onInspect={inspectExercise} /><div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]"><div className="space-y-5"><WarmupPanel workout={customWorkout} goal={goal} /><ProgrammingGuidePanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /></div><WeeklyMuscleVolumePanel plan={weeklyPlan} prescriptions={weeklyPrescriptions} goal={goal} /></div></div></div></section>}
        {workspace === "body" && <section className="body-lab-v2 space-y-5"><div className="view-header"><div><p className="metric-label">04 / interactive body laboratory</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">Body first.<br /><em className="text-[#e4512e]">Details on demand.</em></h1></div><div className="view-header-note"><Activity className="h-5 w-5 text-[#e4512e]" /><p>Use the heat map to inspect relevant tissue. Hover for a quick read; select for biomechanics and planning detail.</p></div></div><AnatomyMap primary={movementMuscles} secondary={movementSignals.includes("rotation") ? ["abs", "obliques", "glutes"] : ["abs", "glutes"]} onSelect={setActiveMuscle} /><div className="body-lab-quick-actions"><div><p className="metric-label">Current sporting action</p><strong>{selectedMovement.label}</strong><span>{selectedMovement.family}</span></div><div><p className="metric-label">Primary support</p><strong>{muscleLabels[activeMuscle] || activeMuscle}</strong><span>Selected from the atlas</span></div><button onClick={() => setWorkspace("recommended")}>Open matched exercises <ArrowUpRight className="h-4 w-4" /></button></div></section>}

        {workspace === "movement" && <section className="space-y-5"><div className="view-header"><div><p className="metric-label">05 / sport movement atlas</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">400 actions.<br /><em className="text-[#e4512e]">One clear system.</em></h1></div><div className="view-header-note"><Layers3 className="h-5 w-5 text-[#e4512e]" /><p>Each record identifies body action, movers, stabilizers, muscle action, and a gym-transfer cue.</p></div></div><div className="grid gap-5 xl:grid-cols-[290px_1fr]"><div className="dark-panel max-h-[760px] overflow-y-auto p-3">{sportProfiles.map((profile) => <button key={profile.id} onClick={() => chooseSport(profile.id)} className={`atlas-sport-row ${sportId === profile.id ? "atlas-sport-active" : ""}`}><span className="font-display text-2xl font-bold">{String(sportProfiles.indexOf(profile) + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-bold">{profile.label}</span><span className="mt-1 block truncate text-[10px] text-[#8d9c95]">20 actions · {profile.movementFamilies.length} families</span></span><ChevronRight className="h-4 w-4" /></button>)}</div><div className="space-y-5"><div className="light-panel p-6"><p className="metric-label">{selectedSport.label} / research profile</p><h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none text-[#17231f]">Movement architecture</h2><p className="mt-4 max-w-4xl text-sm leading-6 text-[#5c6b62]">{selectedSport.summary}</p><div className="mt-5 flex flex-wrap gap-2">{selectedSport.movementFamilies.map((family) => <span key={family} className="family-tag">{family}</span>)}</div></div><div className="grid gap-3 md:grid-cols-2">{sportMovements.map((movement, index) => <button key={movement.id} onClick={() => showMovement(movement)} className={`atlas-movement-card ${movement.id === selectedMovement.id ? "atlas-movement-active" : ""}`}><div className="flex items-start gap-3"><span className="font-display text-2xl font-bold text-[#a0aca3]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 text-left"><span className="block text-sm font-bold text-[#19261f]">{movement.label}</span><span className="mt-1 block text-[10px] leading-4 text-[#748179]">{movement.family}</span></span><ChevronRight className="h-4 w-4 text-[#e4512e]" /></div><p className="mt-3 line-clamp-2 text-left text-[11px] leading-5 text-[#5d6d63]">{movement.bodyActions}</p></button>)}</div></div></div></section>}

        {workspace === "catalog" && <section className="space-y-5"><div className="view-header"><div><p className="metric-label">06 / exercise catalog</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">300 tools.<br /><em className="text-[#e4512e]">Mapped on purpose.</em></h1></div><div className="view-header-note"><Dumbbell className="h-5 w-5 text-[#e4512e]" /><p>Browse by name or movement. Open any record for its muscle map, athlete fit, and sport transfer logic.</p></div></div><div className="light-panel p-5"><label className="flex max-w-xl items-center gap-2 border border-[#d8e0d8] bg-white px-3"><Search className="h-4 w-4 text-[#748179]" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Search by exercise, movement, or muscle" /></label><div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{filteredCatalog.map((exercise) => <button key={exercise.id} onClick={() => inspectExercise(exercise)} className="catalog-card"><span className="font-display text-2xl font-bold text-[#a3ada5]">{String(exercise.id).padStart(3, "0")}</span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-bold">{exercise.name}</span><span className="mt-1 block truncate text-[10px] text-[#718078]">{exercise.movement} · {exercise.equipment}</span></span><ArrowUpRight className="h-4 w-4 text-[#e4512e]" /></button>)}</div></div></section>}
        {workspace === "genome" && <section className="space-y-5"><div className="view-header"><div><p className="metric-label">07 / Exercise Genome laboratory</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">The exercise<br /><em className="text-[#2d6cdf]">intelligence layer.</em></h1></div><div className="view-header-note"><Dna className="h-5 w-5 text-[#2d6cdf]" /><p>Intrinsic biomechanics meet the selected sport action, goal, and current workout—not a single generic exercise score.</p></div></div><div className="grid gap-5 xl:grid-cols-[280px_1fr]"><aside className="dark-panel overflow-hidden"><div className="border-b border-white/10 p-4"><p className="metric-label !text-[#9eb3cb]">Explore 300 exercises</p><label className="mt-3 flex items-center gap-2 border border-white/15 bg-white/5 px-2"><Search className="h-3.5 w-3.5 text-[#a7b8ca]" /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} className="h-9 w-full bg-transparent text-xs text-white outline-none placeholder:text-[#8195ab]" placeholder="Search the genome" /></label></div><div className="max-h-[690px] overflow-y-auto p-2">{filteredCatalog.map((exercise) => <button key={exercise.id} onClick={() => setGenomeExerciseId(exercise.id)} className={`genome-selector-row ${genomeExercise.id === exercise.id ? "genome-selector-active" : ""}`}><span className="font-display text-lg font-bold">{String(exercise.id).padStart(3, "0")}</span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-bold">{exercise.name}</span><span className="mt-0.5 block truncate text-[10px] text-[#8ba0b6]">{exercise.movement}</span></span><ChevronRight className="h-3.5 w-3.5" /></button>)}</div></aside><div><div className="light-panel p-5"><p className="metric-label">Selected exercise / contextual profile</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-4xl font-bold uppercase leading-none text-[#102947]">{genomeExercise.name}</h2><p className="mt-2 text-xs text-[#5d7389]">Use the Genome tabs to move from fast recognition, to mechanics, to why the recommendation changes for this stack.</p></div><button onClick={() => inspectExercise(genomeExercise)} className="inline-flex items-center gap-2 border border-[#2d6cdf] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#2d6cdf] hover:bg-[#2d6cdf] hover:text-white">Open full detail <ArrowUpRight className="h-4 w-4" /></button></div></div><ExerciseGenomePanel exercise={genomeExercise} context={{ goal, currentWorkout: customWorkout, sportMovement: selectedMovement }} /></div></div></section>}
        {(workspace === "recommended" || workspace === "custom") && <section className="mt-5"><MovementIntelligencePanel movement={enrichedSelectedMovement} fallback={selectedMovement} workout={customWorkout} onAdd={addExercise} onInspect={inspectExercise} compact={workspace === "custom"} /></section>}
        {workspace === "custom" && <section className="builder-prep-workspace"><div className="builder-prep-head"><div><p className="metric-label">Before the work sets</p><h2>Prepare. Then prescribe.</h2><p>Mobility and programming recommendations update from the active exercise stack and selected training goal.</p></div></div><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><div className="space-y-5"><WorkoutHealthPanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /><ImportedPlanContext items={activeImportedContext} /></div><div className="space-y-5"><WarmupPanel workout={customWorkout} goal={goal} /><ProgrammingGuidePanel workout={customWorkout} prescriptions={prescriptions} settings={exerciseSettings} goal={goal} /></div></div></section>}
      </main>
      {workspace === "custom" && <div className={`planner-float planner-float-${plannerSide}`}><button onClick={() => setPlannerOpen((value) => !value)} aria-expanded={plannerOpen} className={`planner-tab ${plannerOpen ? "planner-tab-open" : ""}`}><SlidersHorizontal className="h-4 w-4" /> {plannerOpen ? "Hide planner" : "Training day"}</button>{plannerOpen && <SplitDraftControls days={splitDays} activeDay={splitDays.includes(activeSplitDay) ? activeSplitDay : splitDays[0]} activeLoadout={activeLoadout} onDay={setActiveSplitDay} onLoadout={setActiveLoadout} onDraft={loadDraft} onClose={() => setPlannerOpen(false)} onMove={() => setPlannerSide((side) => side === "right" ? "left" : "right")} />}</div>}
    </div>

    {inspectedExercise && <div className="fixed inset-0 z-50 bg-[#09120e]/65 p-0 backdrop-blur-sm xl:p-5"><div className="ml-auto h-full w-full max-w-[720px] overflow-y-auto bg-[#f7f8f3] shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8e0d7] bg-[#f7f8f3]/95 px-5 py-4 backdrop-blur"><div><p className="metric-label">Exercise intelligence</p><p className="mt-1 font-display text-2xl font-bold uppercase leading-none text-[#15221b]">{inspectedExercise.name}</p></div><button onClick={() => setInspectedExercise(null)} className="grid h-9 w-9 place-items-center border border-[#d2dad1] bg-white"><X className="h-4 w-4" /></button></div><div className="p-5"><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><div className="light-panel p-4"><AnatomyMap primary={inspectedExercise.primaryMuscles} secondary={inspectedExercise.secondaryMuscles} onSelect={setActiveMuscle} /></div><div><p className="metric-label">Movement role</p><h3 className="mt-1 font-display text-4xl font-bold uppercase leading-none text-[#17231f]">{inspectedExercise.movement}</h3><div className="mt-4 grid gap-2"><div className="exercise-insight"><p className="metric-label">Primary target</p><p>{inspectedExercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div><div className="exercise-insight"><p className="metric-label">Support tissues</p><p>{inspectedExercise.secondaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div><div className="exercise-insight"><p className="metric-label">Useful qualities</p><p>{inspectedExercise.qualities.join(" · ")}</p></div></div><button onClick={() => { addExercise(inspectedExercise); setWorkspace("custom"); setInspectedExercise(null); }} className="mt-5 inline-flex items-center gap-2 bg-[#17271f] px-4 py-3 text-[10px] font-bold uppercase tracking-[.13em] text-white hover:bg-[#b8ff5b] hover:text-[#142019]">Add to custom workout <Plus className="h-4 w-4" /></button></div></div><div className="mt-5 dark-panel p-5"><p className="metric-label !text-[#91a09a]">Current sport-action relevance</p><p className="mt-2 text-sm leading-6 text-[#d1dcd4]">For {selectedMovement.label}, this exercise is most useful when it supports {selectedMovement.family.toLowerCase()} through its {inspectedExercise.movement.toLowerCase()} pattern. Review the sport action in the Movement Atlas to see the full body-action reasoning.</p><button onClick={() => { setInspectedExercise(null); setWorkspace("movement"); }} className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#b8ff5b]">Open sport action <ArrowUpRight className="h-4 w-4" /></button></div><ExerciseGenomePanel exercise={inspectedExercise} context={{ goal, currentWorkout: customWorkout, sportMovement: selectedMovement }} /></div></div></div>}
    {onboardingComplete && <button onClick={() => setTutorialOpen(true)} className="feature-guide-button"><BookOpen className="h-4 w-4" /> Guide</button>}
    {tutorialOpen && <FeatureTour onClose={() => setTutorialOpen(false)} onNavigate={(view) => setWorkspace(view as Workspace)} />}
    {importOpen && <StackImportPanel onClose={() => setImportOpen(false)} onImport={importRoutine} />}
  </div>;
}
