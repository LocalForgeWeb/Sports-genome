/** Kinetic Field Manual: an asymmetric sports-science workspace that reveals the reason behind each recommendation. */
import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, BookOpen, ChevronRight, Dumbbell, Layers3, Search, Settings2, Sparkles, Target, Trophy, X } from "lucide-react";
import { AnatomyMap, muscleLabels } from "@/components/AnatomyMap";
import { GradeStamp } from "@/components/GradeStamp";
import { exercises, gradeValue, sports, type Exercise, type Grade, type Sport } from "@/lib/exerciseCatalog";

type Goal = "Muscle growth" | "Max strength" | "Athleticism" | "General fitness" | "Endurance";
type View = "command" | "workouts" | "catalog" | "performance";

const goals: { goal: Goal; note: string }[] = [
  { goal: "Muscle growth", note: "Target coverage + controlled volume" },
  { goal: "Max strength", note: "Heavy skill lifts + support work" },
  { goal: "Athleticism", note: "Power, bracing + single-leg control" },
  { goal: "General fitness", note: "Full-body capacity + consistency" },
  { goal: "Endurance", note: "Local stamina + conditioning" },
];

const splits: { id: string; name: string; frequency: string; kind: "Common" | "Optimizer"; sport?: Sport; description: string }[] = [
  { id: "ppl", name: "Push / Pull / Legs", frequency: "3 or 6 days", kind: "Common", description: "Clear movement balance for repeatable training." },
  { id: "upper-lower", name: "Upper / Lower", frequency: "4 days", kind: "Common", description: "Repeat main patterns with flexible recovery." },
  { id: "full-body", name: "Full Body", frequency: "3 days", kind: "Common", description: "High efficiency across the whole system." },
  { id: "body-part", name: "Body-Part Rotation", frequency: "5 days", kind: "Common", description: "More local focus for growth blocks." },
  { id: "powerbuilding", name: "Powerbuilding", frequency: "4 days", kind: "Common", description: "Heavy compounds plus hypertrophy accessories." },
  { id: "s-hybrid", name: "Strength + Hypertrophy", frequency: "3 days", kind: "Common", description: "Balanced strength exposure and targeted volume." },
  { id: "court", name: "Court Speed + Strength", frequency: "4 days", kind: "Optimizer", sport: "basketball", description: "Jump intent, unilateral control, force production." },
  { id: "tennis", name: "Tennis Rotation + Footwork", frequency: "4 days", kind: "Optimizer", sport: "tennis", description: "Rotation, shoulder control, lateral hip support." },
  { id: "field", name: "Field Speed + Resilience", frequency: "4 days", kind: "Optimizer", sport: "soccer", description: "Posterior chain, ankle work, sprint support." },
  { id: "diamond", name: "Diamond Rotation + Armor", frequency: "4 days", kind: "Optimizer", sport: "baseball", description: "Ground-up rotation and deceleration capacity." },
  { id: "fight", name: "Fight Strength + Grip", frequency: "4 days", kind: "Optimizer", sport: "combat", description: "Stance strength, carries, pulls, and hip drive." },
];

const goalQualities: Record<Goal, string[]> = {
  "Muscle growth": ["hypertrophy", "strength"],
  "Max strength": ["strength", "bracing"],
  Athleticism: ["power", "unilateral", "rotation", "sprintSupport", "jumping", "locomotion"],
  "General fitness": ["strength", "conditioning", "bracing", "locomotion"],
  Endurance: ["endurance", "conditioning", "locomotion", "grip"],
};

const gradeCopy: Record<Grade, string> = {
  SS: "Exceptional direct fit", S: "Strong program fit", A: "High-value support", B: "Useful secondary fit", C: "Context-dependent", D: "Limited transfer", F: "Not a direct match",
};

function sessionPrescription(exercise: Exercise, goal: Goal) {
  if (exercise.qualities.some((quality) => ["power", "jumping", "throwing", "elasticity"].includes(quality))) return "4 × 3–5";
  if (goal === "Max strength") return "4 × 3–5";
  if (goal === "Muscle growth") return "3 × 8–12";
  if (goal === "Endurance") return "3 × 12–18";
  return "3 × 6–10";
}

function sportIcon(sport: Sport) {
  return { tennis: "T", basketball: "B", soccer: "S", baseball: "B", combat: "C" }[sport];
}

export default function Home() {
  const [goal, setGoal] = useState<Goal>("Athleticism");
  const [sport, setSport] = useState<Sport>("tennis");
  const [splitId, setSplitId] = useState("tennis");
  const [view, setView] = useState<View>("command");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [selected, setSelected] = useState<Exercise>(() => exercises.find((exercise) => exercise.name === "Medicine-Ball Rotational Wall Throw") || exercises[0]);
  const [activeMuscle, setActiveMuscle] = useState<string>("obliques");
  const [showDetail, setShowDetail] = useState(true);

  const categories = useMemo(() => ["All categories", ...Array.from(new Set(exercises.map((exercise) => exercise.category)))], []);
  const selectedSplit = splits.find((split) => split.id === splitId) || splits[0];

  const plannedSession = useMemo(() => {
    const qualityTargets = goalQualities[goal];
    const preferred = selectedSplit.sport || sport;
    const seen = new Set<string>();
    return [...exercises]
      .map((exercise) => {
        const sportScore = gradeValue[exercise.sportFit[preferred].grade];
        const qualityScore = exercise.qualities.filter((quality) => qualityTargets.includes(quality)).length * 1.7;
        const varietySignal = exercise.qualities.some((quality) => ["power", "rotation", "unilateral", "sprintSupport", "conditioning"].includes(quality)) ? 0.65 : 0;
        return { exercise, score: sportScore + qualityScore + varietySignal };
      })
      .sort((a, b) => b.score - a.score || a.exercise.id - b.exercise.id)
      .filter(({ exercise }) => {
        const key = exercise.movement;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6)
      .map(({ exercise }) => exercise);
  }, [goal, sport, selectedSplit]);

  const filtered = useMemo(() => exercises.filter((exercise) => {
    const haystack = `${exercise.name} ${exercise.category} ${exercise.movement} ${exercise.primaryMuscles.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (category === "All categories" || exercise.category === category);
  }).slice(0, 18), [query, category]);

  const selectExercise = (exercise: Exercise) => {
    setSelected(exercise);
    setActiveMuscle(exercise.primaryMuscles[0]);
    setShowDetail(true);
  };

  const musclePrimary = selected.primaryMuscles.includes(activeMuscle) || (activeMuscle.includes("Delt") && selected.primaryMuscles.includes("shoulders"));
  const muscleSecondary = selected.secondaryMuscles.includes(activeMuscle) || (activeMuscle.includes("Delt") && selected.secondaryMuscles.includes("shoulders"));
  const selectedSport = selected.sportFit[sport];

  return (
    <div className="min-h-screen bg-[#f4f3ed] text-[#1c2937] lg:flex">
      <aside className="relative z-10 flex w-full shrink-0 flex-col bg-[#1c2937] text-[#eef0eb] lg:sticky lg:top-0 lg:h-screen lg:w-[248px]">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <img src="/manus-storage/gym-optimizer-logo_32341cfa.png" alt="Gym Optimizer logo" className="h-10 w-10 object-contain" />
          <div><p className="font-display text-[25px] font-bold leading-none tracking-wide text-white">GYM<br />OPTIMIZER</p></div>
        </div>
        <nav className="grid grid-cols-4 gap-1 px-3 py-4 lg:block lg:space-y-1">
          {[
            ["command", Target, "Command"], ["workouts", Dumbbell, "Workouts"], ["catalog", BookOpen, "Catalog"], ["performance", Trophy, "Performance"],
          ].map(([id, Icon, label]) => (
            <button key={id as string} onClick={() => setView(id as View)} className={`nav-item flex w-full items-center gap-3 px-3 py-3 text-left text-xs font-semibold ${view === id ? "bg-[#e4512e] text-white" : "text-[#b9c1bd] hover:bg-white/8 hover:text-white"}`}>
              <Icon className="h-4 w-4" /> <span className="hidden lg:inline">{label as string}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden p-4 lg:block">
          <div className="border border-white/10 bg-white/5 p-4">
            <p className="field-label !text-[#b9c1bd]">Catalog coverage</p>
            <p className="mt-2 font-display text-4xl font-bold text-white">300</p>
            <p className="mt-1 text-xs leading-5 text-[#b9c1bd]">Exercises, mapped to muscles, movements, and sport fit.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8e9b95]"><Settings2 className="h-3.5 w-3.5" /> Training logic v1</div>
          <a href="https://localforgeweb.com" target="_blank" rel="noreferrer" className="mt-4 block text-[10px] leading-4 text-[#8e9b95] transition-colors hover:text-white">Built by Gabe Naim — LocalForgeWeb</a>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex min-h-[73px] items-center justify-between border-b border-[#d8d9d3] bg-[#fbfaf6]/90 px-5 backdrop-blur lg:px-9">
          <div>
            <p className="field-label">{view === "command" ? "Training command" : view === "catalog" ? "Exercise atlas" : view === "workouts" ? "Workout builder" : "Performance lens"}</p>
            <p className="mt-1 text-sm font-medium text-[#5c6662]">{goal} <span className="mx-1.5 text-[#b0b4ad]">/</span> {sports.find((item) => item.id === sport)?.label}</p>
          </div>
          <button onClick={() => setShowDetail(true)} className="hidden items-center gap-2 border border-[#1c2937] px-3 py-2 text-xs font-bold text-[#1c2937] transition-colors hover:bg-[#1c2937] hover:text-white sm:flex"><Activity className="h-4 w-4" /> Open muscle map</button>
        </header>

        <div className="mx-auto max-w-[1540px] px-4 py-5 lg:px-8 lg:py-8">
          {view === "command" && <>
            <section className="field-entry overflow-hidden bg-[#1c2937] text-white">
              <div className="relative min-h-[300px] p-7 md:p-9 lg:min-h-[330px] lg:w-[67%]">
                <div className="absolute inset-0 bg-[linear-gradient(105deg,#1c2937_15%,rgba(28,41,55,.94)_47%,rgba(28,41,55,.35)_90%)]" />
                <img src="/manus-storage/gym-optimizer-hero_e17b305c.jpg" alt="Athlete preparing for a workout" className="absolute inset-0 -z-10 h-full w-full object-cover object-right" />
                <div className="relative max-w-[570px]">
                  <p className="field-label !text-[#f7cf6c]">01 / decision brief / sport-aware session</p>
                  <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.88] tracking-[-0.02em] sm:text-6xl lg:text-7xl">{sports.find((item) => item.id === sport)?.label}<br /><em className="font-display text-[#e4512e]">session brief.</em></h1>
                  <p className="mt-5 max-w-md text-sm leading-6 text-[#d7ded9]">{selectedSplit.name} is currently weighted toward {goal.toLowerCase()}, with movement fit visible before you commit to the work.</p>
                  <div className="mt-6 grid max-w-[560px] grid-cols-3 divide-x divide-white/20 border-y border-white/20">
                    <div className="py-3 pr-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#aeb9b3]">Sport lens</p><p className="mt-1 font-display text-xl font-bold uppercase">{sports.find((item) => item.id === sport)?.label}</p></div>
                    <div className="px-3 py-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#aeb9b3]">Primary intent</p><p className="mt-1 font-display text-xl font-bold uppercase">{goal}</p></div>
                    <div className="px-3 py-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#aeb9b3]">Top signal</p><p className="mt-1 flex items-center gap-2 font-display text-xl font-bold uppercase"><GradeStamp grade={plannedSession[0]?.sportFit[sport].grade || "C"} compact /> Fit</p></div>
                  </div>
                  <button onClick={() => setView("workouts")} className="mt-6 inline-flex items-center gap-2 bg-[#e4512e] px-4 py-3 text-xs font-bold uppercase tracking-[0.13em] text-white transition-colors hover:bg-[#f0613d]">Inspect today&apos;s session <ArrowUpRight className="h-4 w-4" /></button>
                </div>
              </div>
            </section>
            <section className="field-entry mt-5 grid gap-5 xl:grid-cols-[1fr_1.55fr]">
              <div className="paper-card p-5">
                <p className="field-label">01 / Parameters</p>
                <div className="mt-4">
                  <label className="field-label">Training goal</label>
                  <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-1">
                    {goals.map((item) => <button key={item.goal} onClick={() => setGoal(item.goal)} className={`flex items-center justify-between border px-3 py-2.5 text-left transition-colors ${goal === item.goal ? "border-[#e4512e] bg-[#fff1eb]" : "border-[#e3e3dd] bg-white hover:border-[#a9b2a9]"}`}><span><span className="block text-xs font-bold">{item.goal}</span><span className="mt-0.5 block text-[10px] text-[#707975]">{item.note}</span></span>{goal === item.goal && <span className="h-2 w-2 bg-[#e4512e]" />}</button>)}
                  </div>
                </div>
                <div className="mt-5 hairline-top pt-5">
                  <label className="field-label">Sport lens</label>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {sports.map((item) => <button key={item.id} onClick={() => setSport(item.id)} title={item.label} className={`aspect-square border text-xs font-bold transition-colors ${sport === item.id ? "border-[#1c2937] bg-[#1c2937] text-white" : "border-[#d8d9d3] bg-white text-[#65706a] hover:border-[#1c2937]"}`}>{sportIcon(item.id)}</button>)}
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#52605b]">{sports.find((item) => item.id === sport)?.label} <span className="text-[#9ba19d]">— {sports.find((item) => item.id === sport)?.descriptor}</span></p>
                </div>
              </div>
              <div className="paper-card p-5 lg:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="field-label">02 / Session preview</p><h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none">{selectedSplit.name}</h2></div>
                  <span className="border border-[#d8d9d3] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#65706a]">{selectedSplit.frequency}</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65706a]">{selectedSplit.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-l-2 border-[#e4512e] bg-[#fff3ed] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#68716d]"><span className="text-[#e4512e]">Logic cue</span><span>sport grade → movement variety → recovery-aware volume</span></div>
                <div className="mt-5 grid divide-y divide-[#e0e1db] border-y border-[#e0e1db]">
                  {plannedSession.slice(0, 5).map((exercise, index) => <button key={exercise.id} onClick={() => selectExercise(exercise)} className="session-row flex items-center gap-4 bg-[#fbfaf6] px-2 py-3 text-left hover:bg-white"><span className="font-display text-2xl font-bold text-[#a1a8a2]">0{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{exercise.name}</p><p className="mt-0.5 text-[11px] text-[#77807a]">{exercise.movement} <span className="mx-1">·</span> {sessionPrescription(exercise, goal)}</p></div><GradeStamp grade={exercise.sportFit[selectedSplit.sport || sport].grade} compact /><ChevronRight className="h-4 w-4 text-[#9da5a0]" /></button>)}
                </div>
                <button onClick={() => setView("workouts")} className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#e4512e]">Open full workout brief <ArrowUpRight className="h-4 w-4" /></button>
              </div>
            </section>
          </>}

          {view === "workouts" && <section className="field-entry grid gap-5 xl:grid-cols-[1fr_1.6fr]">
            <div className="paper-card p-5"><p className="field-label">Split orientation</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-none">Choose the<br />trade-off.</h1><p className="mt-4 text-sm leading-6 text-[#68716d]">Six common templates plus sport-specific orientations. They are editable starting points, not rigid programming rules.</p><div className="mt-6 grid gap-2">{splits.map((item) => <button key={item.id} onClick={() => { setSplitId(item.id); if (item.sport) setSport(item.sport); }} className={`border p-3 text-left ${splitId === item.id ? "border-[#e4512e] bg-[#fff1eb]" : "border-[#e0e1db] bg-white hover:border-[#a8b1a9]"}`}><div className="flex justify-between gap-3"><span className="text-xs font-bold">{item.name}</span><span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${item.kind === "Optimizer" ? "text-[#e4512e]" : "text-[#7d8780]"}`}>{item.kind}</span></div><p className="mt-1 text-[11px] text-[#707975]">{item.frequency} · {item.description}</p></button>)}</div></div>
            <div className="paper-card overflow-hidden"><div className="border-b border-[#d8d9d3] bg-[#1c2937] p-6 text-white"><p className="field-label !text-[#f7cf6c]">Today&apos;s field prescription</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-4xl font-bold uppercase leading-none">{selectedSplit.name}</h2><p className="mt-2 text-xs text-[#b8c0bb]">Goal: {goal} · Sport weighting: {sports.find((item) => item.id === (selectedSplit.sport || sport))?.label}</p></div><span className="bg-[#e4512e] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]">Session A</span></div></div><div className="p-5 lg:p-6"><p className="max-w-2xl text-sm leading-6 text-[#68716d]">The builder favors a varied set of movement patterns and surfaces the sport-fit logic beside every exercise. Replace any exercise with a catalog match when equipment, skill, or tolerance differs.</p><div className="mt-6 space-y-2">{plannedSession.map((exercise, index) => <button key={exercise.id} onClick={() => selectExercise(exercise)} className="session-row grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border border-[#e0e1db] bg-[#fbfaf6] px-3 py-3 text-left"><span className="font-display text-2xl font-bold text-[#e4512e]">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{exercise.name}</p><p className="mt-0.5 text-[11px] text-[#77807a]">{exercise.movement} · {exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p><p className="mt-1 text-[11px] text-[#52605b]"><span className="font-bold">{sessionPrescription(exercise, goal)}</span> <span className="mx-1.5 text-[#c4c8c2]">|</span> {exercise.sportFit[selectedSplit.sport || sport].movementHelp}</p></div><GradeStamp grade={exercise.sportFit[selectedSplit.sport || sport].grade} compact /></button>)}</div><div className="mt-6 border-t border-[#d8d9d3] pt-4"><p className="text-xs leading-5 text-[#68716d]"><strong className="text-[#1c2937]">Programming note:</strong> Start with controlled, pain-free technique; these are editable educational templates, not medical or individualized coaching advice.</p></div></div></div>
          </section>}

          {view === "performance" && <section className="field-entry grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><div className="paper-card overflow-hidden"><div className="relative min-h-[260px] p-7 text-white"><img src="/manus-storage/gym-optimizer-movement_1bbb74dc.jpg" alt="Athlete performing rotational medicine ball training" className="absolute inset-0 -z-10 h-full w-full object-cover" /><div className="absolute inset-0 -z-10 bg-[#1c2937]/75" /><p className="field-label !text-[#f7cf6c]">Performance lens / {sports.find((item) => item.id === sport)?.label}</p><h1 className="mt-3 max-w-md font-display text-5xl font-bold uppercase leading-[.9]">Move the quality.<br /><em className="text-[#e4512e]">Not just the weight.</em></h1><p className="mt-4 max-w-md text-sm leading-6 text-[#d8ded9]">Sport grades compare broad movement and force-transfer similarities. They guide exercise choice; technical practice remains decisive.</p></div><div className="p-6"><p className="field-label">Top signals in the current catalog</p><div className="mt-4 grid gap-2">{[...exercises].sort((a, b) => gradeValue[b.sportFit[sport].grade] - gradeValue[a.sportFit[sport].grade]).slice(0, 5).map((exercise) => <button key={exercise.id} onClick={() => selectExercise(exercise)} className="flex items-center gap-3 border border-[#e0e1db] p-3 text-left hover:border-[#e4512e]"><GradeStamp grade={exercise.sportFit[sport].grade} compact /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{exercise.name}</p><p className="mt-0.5 text-[11px] text-[#6f7774]">Helps with {exercise.sportFit[sport].movementHelp}</p></div><ArrowUpRight className="h-4 w-4 text-[#a2aaa4]" /></button>)}</div></div></div><div className="paper-card p-6"><p className="field-label">What the grades mean</p><div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-[#d8d9d3] bg-[#d8d9d3]">{(["SS", "S", "A", "B", "C", "D", "F"] as Grade[]).map((grade) => <div key={grade} className="flex items-center gap-3 bg-[#fbfaf6] p-3"><GradeStamp grade={grade} compact /><span className="text-xs font-medium text-[#59635e]">{gradeCopy[grade]}</span></div>)}</div><div className="mt-6 border-l-2 border-[#e4512e] bg-[#fff3ed] p-4"><p className="text-xs font-bold">Transparent by design</p><p className="mt-1 text-xs leading-5 text-[#64706a]">Ratings combine movement similarity, force direction, velocity potential, stability demand, and grip/carry relevance. They are decision-support heuristics, not performance predictions.</p></div><img src="/manus-storage/gym-optimizer-strength_b76dfe64.jpg" alt="Athlete performing front squat" className="mt-6 h-[185px] w-full object-cover" /></div></section>}

          {view === "catalog" && <section className="field-entry grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><div className="paper-card overflow-hidden"><div className="border-b border-[#d8d9d3] p-5 lg:p-6"><p className="field-label">300-exercise atlas</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-none">Find the<br />right tool.</h1><div className="mt-5 grid gap-2 sm:grid-cols-[1fr_180px]"><label className="flex items-center gap-2 border border-[#d8d9d3] bg-white px-3"><Search className="h-4 w-4 text-[#87908b]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercise or muscle" className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[#9ca39e]" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 border border-[#d8d9d3] bg-white px-3 text-xs font-semibold text-[#59635e] outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div><div className="max-h-[720px] overflow-y-auto p-3"><p className="px-2 pb-2 text-[11px] text-[#7a837d]">Showing {filtered.length} of {exercises.length} mapped exercises</p>{filtered.map((exercise) => <button key={exercise.id} onClick={() => selectExercise(exercise)} className={`mb-1 grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 border p-3 text-left ${selected.id === exercise.id ? "border-[#e4512e] bg-[#fff1eb]" : "border-transparent hover:border-[#d8d9d3] hover:bg-white"}`}><span className="font-display text-xl font-bold text-[#a0a7a1]">{String(exercise.id).padStart(3, "0")}</span><span className="min-w-0"><span className="block truncate text-sm font-bold">{exercise.name}</span><span className="mt-0.5 block truncate text-[11px] text-[#77807a]">{exercise.movement} · {exercise.equipment}</span></span><GradeStamp grade={exercise.sportFit[sport].grade} compact /></button>)}</div></div><div className="paper-card p-5 lg:p-6"><p className="field-label">Selected record</p><div className="mt-2 flex gap-3"><span className="font-display text-4xl font-bold text-[#e4512e]">{String(selected.id).padStart(3, "0")}</span><div className="min-w-0"><h2 className="font-display text-3xl font-bold uppercase leading-none">{selected.name}</h2><p className="mt-2 text-xs text-[#69736d]">{selected.category} · {selected.equipment}</p></div></div><div className="mt-5 border-y border-[#d8d9d3] py-4"><p className="field-label">Movement pattern</p><p className="mt-1 text-sm font-bold">{selected.movement}</p><div className="mt-3 flex flex-wrap gap-1.5">{selected.qualities.map((quality) => <span key={quality} className="border border-[#d8d9d3] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#5d6862]">{quality.replace(/([A-Z])/g, " $1")}</span>)}</div></div><button onClick={() => setShowDetail(true)} className="mt-5 flex w-full items-center justify-between bg-[#1c2937] px-4 py-3 text-left text-white"><span><span className="field-label !text-[#b9c1bd]">View activation</span><span className="mt-1 block text-sm font-bold">Open interactive muscle map</span></span><ArrowUpRight className="h-5 w-5" /></button></div></section>}
        </div>
      </main>

      {showDetail && <div className="fixed inset-0 z-50 flex justify-end bg-[#1c2937]/35 p-0 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Exercise details"><div className="h-full w-full max-w-[610px] overflow-y-auto bg-[#fbfaf6] shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8d9d3] bg-[#fbfaf6]/95 px-5 py-4 backdrop-blur"><div><p className="field-label">Exercise inspection</p><p className="mt-1 font-display text-2xl font-bold uppercase leading-none">{selected.name}</p></div><button onClick={() => setShowDetail(false)} className="grid h-9 w-9 place-items-center border border-[#d8d9d3] bg-white text-[#4f5d57] hover:border-[#1c2937]" aria-label="Close exercise details"><X className="h-4 w-4" /></button></div><div className="p-5"><AnatomyMap primary={selected.primaryMuscles} secondary={selected.secondaryMuscles} onSelect={setActiveMuscle} /><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><div className="border-l-2 border-[#e4512e] bg-[#fff3ed] p-4"><p className="field-label">Selected muscle</p><div className="mt-1 flex items-center gap-2"><p className="text-sm font-bold">{muscleLabels[activeMuscle] || activeMuscle}</p><GradeStamp grade={musclePrimary ? "S" : muscleSecondary ? "B" : "C"} compact /></div><p className="mt-2 text-xs leading-5 text-[#64706a]">{musclePrimary ? "Primary target in this exercise. It is a main source of force or the intended training emphasis." : muscleSecondary ? "Secondary contributor. It supports position, force transfer, or joint control." : "Not a key target for this exercise; choose a highlighted region to inspect its role."}</p></div><div className="border border-[#d8d9d3] bg-white p-4"><p className="field-label">Target quality</p><div className="mt-1 flex items-center gap-2"><GradeStamp grade={selected.muscleGrade} compact /><p className="text-xs font-bold">{gradeCopy[selected.muscleGrade]}</p></div><p className="mt-2 text-[11px] leading-4 text-[#717a75]">Relative emphasis in this catalog.</p></div></div><div className="mt-5 border-y border-[#d8d9d3] py-5"><div className="flex items-start justify-between gap-4"><div><p className="field-label">{sports.find((item) => item.id === sport)?.label} transfer</p><p className="mt-1 text-sm font-bold">May help with {selectedSport.movementHelp}</p></div><GradeStamp grade={selectedSport.grade} /></div><p className="mt-3 text-xs leading-5 text-[#68716d]">{gradeCopy[selectedSport.grade]}. This is a movement-based support rating, not a guarantee of sport performance. Skill practice, training dose, and individual context still matter.</p></div><div className="mt-5"><p className="field-label">Muscle evidence in this record</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="border border-[#f4b29f] bg-[#fff1eb] p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#c94124]">Primary</p><p className="mt-1 text-xs font-bold">{selected.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div><div className="border border-[#e0e1db] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7b857e]">Secondary</p><p className="mt-1 text-xs font-bold">{selected.secondaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ")}</p></div></div></div></div></div></div>}
    </div>
  );
}
