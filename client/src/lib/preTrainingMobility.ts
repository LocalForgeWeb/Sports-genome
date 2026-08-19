/** Evidence-aware dynamic preparation library: mobility, activation, and rehearsal drills for pre-training use. */
import type { Exercise } from "@/lib/exerciseCatalog";

export type MobilityTag = "general" | "squat" | "hinge" | "lunge" | "singleLeg" | "horizontalPush" | "verticalPush" | "horizontalPull" | "verticalPull" | "overhead" | "rotation" | "bracing" | "braking" | "carry" | "jump" | "sprint" | "lateral" | "ankle" | "hip" | "thoracic" | "shoulder" | "wrist" | "grip" | "knee";
export type WarmupPhase = "raise" | "mobilize" | "activate" | "rehearse";

export type MobilityDrill = {
  id: string;
  name: string;
  phase: WarmupPhase;
  tags: MobilityTag[];
  regions: string[];
  dose: string;
  minutes: number;
  cue: string;
  caution?: string;
};

export const preTrainingMobilityLibrary: MobilityDrill[] = [
  { id: "march-arm-swing", name: "March with arm swing", phase: "raise", tags: ["general", "sprint", "shoulder"], regions: ["whole body"], dose: "45–60 sec", minutes: 1, cue: "Build heat gradually; keep the ribcage stacked over the pelvis." },
  { id: "easy-skip", name: "Low amplitude skip", phase: "raise", tags: ["general", "sprint", "ankle"], regions: ["feet", "calves"], dose: "2 × 15 m", minutes: 1, cue: "Stay light through the forefoot and keep the contacts quiet." },
  { id: "lateral-shuffle-reach", name: "Lateral shuffle with reach", phase: "raise", tags: ["general", "lateral", "shoulder", "hip"], regions: ["hips", "shoulders"], dose: "2 × 10 m each way", minutes: 1, cue: "Keep the knees tracking over the mid-foot; do not cross the feet." },
  { id: "carioca", name: "Carioca hip switch", phase: "raise", tags: ["general", "lateral", "rotation", "hip"], regions: ["hips", "thoracic spine"], dose: "2 × 10 m each way", minutes: 1, cue: "Let the pelvis rotate smoothly while the chest stays tall." },
  { id: "backpedal-march", name: "Backpedal to march", phase: "raise", tags: ["general", "sprint", "bracing"], regions: ["hips", "calves"], dose: "2 × 10 m", minutes: 1, cue: "Land under the hips and finish in a controlled march." },
  { id: "pogo-pulse", name: "Ankle pogo pulse", phase: "rehearse", tags: ["jump", "sprint", "ankle"], regions: ["ankles", "calves"], dose: "2 × 15 contacts", minutes: 1, cue: "Use a small, springy bounce; stop if contacts become heavy." },
  { id: "ankle-rock", name: "Half-kneeling ankle rock", phase: "mobilize", tags: ["ankle", "squat", "lunge", "knee"], regions: ["ankle", "soleus"], dose: "8 each side", minutes: 1, cue: "Drive the knee forward over the second toe while keeping the heel down." },
  { id: "knee-wall", name: "Knee-to-wall dorsiflexion", phase: "mobilize", tags: ["ankle", "squat", "lunge", "knee"], regions: ["ankle", "calf"], dose: "6–8 each side", minutes: 1, cue: "Use only a pain-free range and avoid the arch collapsing inward." },
  { id: "ankle-circle", name: "Single-leg ankle circles", phase: "mobilize", tags: ["ankle", "singleLeg"], regions: ["ankle"], dose: "8 each direction", minutes: 1, cue: "Move from the ankle rather than twisting the knee." },
  { id: "heel-toe-walk", name: "Heel-to-toe walk", phase: "mobilize", tags: ["ankle", "sprint", "knee"], regions: ["tibialis anterior", "calves"], dose: "12 steps each", minutes: 1, cue: "Roll with control from heel strike to toe-off." },
  { id: "tibialis-raise", name: "Tibialis wall raise", phase: "activate", tags: ["ankle", "sprint", "knee"], regions: ["tibialis anterior"], dose: "10–15 reps", minutes: 1, cue: "Lift the toes without leaning back through the ribs." },
  { id: "calf-raise-walk", name: "Calf-raise walk", phase: "activate", tags: ["ankle", "jump", "sprint"], regions: ["calves", "feet"], dose: "12 slow steps", minutes: 1, cue: "Pause briefly at the top and keep the big toe connected." },
  { id: "quadruped-hip-circle", name: "Quadruped hip circle", phase: "mobilize", tags: ["hip", "hinge", "singleLeg"], regions: ["hips"], dose: "6 each direction", minutes: 1, cue: "Keep the low back quiet while the femur explores the range." },
  { id: "hip-airplane", name: "Supported hip airplane", phase: "activate", tags: ["hip", "singleLeg", "hinge", "lateral"], regions: ["gluteus medius", "hip"], dose: "5 each side", minutes: 1, cue: "Use a wall or rack if needed; rotate from the hip, not the lumbar spine." },
  { id: "ninety-ninety", name: "90/90 hip transition", phase: "mobilize", tags: ["hip", "rotation", "squat", "lunge"], regions: ["hips", "adductors"], dose: "6 controlled switches", minutes: 1, cue: "Switch with an upright chest and avoid forcing the knee down." },
  { id: "shin-box-getup", name: "Shin-box get-up", phase: "rehearse", tags: ["hip", "singleLeg", "rotation", "lunge"], regions: ["hips", "glutes"], dose: "5 each side", minutes: 1, cue: "Use the front hip to stand; keep the knee aligned with the toes." },
  { id: "frog-rock", name: "Adductor frog rock", phase: "mobilize", tags: ["hip", "squat", "lateral", "knee"], regions: ["adductors", "hips"], dose: "8 rocks", minutes: 1, cue: "Rock only as far as the groin remains comfortable." },
  { id: "adductor-rockback", name: "Half-kneeling adductor rock-back", phase: "mobilize", tags: ["hip", "squat", "lateral"], regions: ["adductors", "hamstrings"], dose: "8 each side", minutes: 1, cue: "Keep the spine long and shift the hips back slowly." },
  { id: "cossack-shift", name: "Cossack squat shift", phase: "mobilize", tags: ["hip", "squat", "lateral", "ankle"], regions: ["adductors", "ankles"], dose: "6 each side", minutes: 1, cue: "Use a shallow range first; let the straight-leg heel stay grounded." },
  { id: "split-hip-flexor", name: "Split-stance hip flexor pulse", phase: "mobilize", tags: ["hip", "lunge", "sprint", "hinge"], regions: ["hip flexors"], dose: "8 each side", minutes: 1, cue: "Tuck the pelvis slightly and reach tall without arching the low back." },
  { id: "half-kneel-reach", name: "Half-kneeling hip flexor reach", phase: "mobilize", tags: ["hip", "lunge", "overhead", "bracing"], regions: ["hip flexors", "lats"], dose: "6 each side", minutes: 1, cue: "Squeeze the rear glute as the arm reaches overhead." },
  { id: "hamstring-sweep", name: "Walking hamstring sweep", phase: "mobilize", tags: ["hinge", "sprint", "singleLeg"], regions: ["hamstrings"], dose: "8 each side", minutes: 1, cue: "Hinge from the hips and keep the back knee soft." },
  { id: "single-rdl-reach", name: "Single-leg RDL reach", phase: "rehearse", tags: ["hinge", "singleLeg", "bracing"], regions: ["hamstrings", "glutes"], dose: "6 each side", minutes: 1, cue: "Reach long through the heel and keep the pelvis square." },
  { id: "glute-bridge-march", name: "Glute bridge march", phase: "activate", tags: ["hinge", "singleLeg", "bracing"], regions: ["gluteus maximus", "hamstrings"], dose: "8 total marches", minutes: 1, cue: "Hold the pelvis level; do not let one side drop." },
  { id: "band-lateral-walk", name: "Band lateral walk", phase: "activate", tags: ["lateral", "singleLeg", "hip", "knee"], regions: ["gluteus medius", "abductors"], dose: "8–10 steps each way", minutes: 1, cue: "Keep the toes forward and the band tension even." },
  { id: "reverse-lunge-drive", name: "Reverse lunge to knee drive", phase: "rehearse", tags: ["lunge", "singleLeg", "sprint", "knee"], regions: ["hips", "quadriceps"], dose: "6 each side", minutes: 1, cue: "Own the landing before driving the knee upward." },
  { id: "squat-pry", name: "Bodyweight squat pry", phase: "mobilize", tags: ["squat", "hip", "ankle", "knee"], regions: ["hips", "ankles"], dose: "6 slow reps", minutes: 1, cue: "Use the elbows to guide the knees apart gently, not forcefully." },
  { id: "tempo-squat", name: "Tempo bodyweight squat", phase: "rehearse", tags: ["squat", "knee", "bracing"], regions: ["quadriceps", "hips"], dose: "6 reps", minutes: 1, cue: "Descend for three seconds; keep the whole foot connected." },
  { id: "lateral-lunge-rock", name: "Lateral lunge rock", phase: "rehearse", tags: ["lateral", "lunge", "hip", "knee"], regions: ["adductors", "glutes"], dose: "6 each side", minutes: 1, cue: "Sit into the hip rather than letting the knee drift inward." },
  { id: "worlds-greatest", name: "World’s greatest lunge", phase: "mobilize", tags: ["lunge", "hip", "thoracic", "rotation"], regions: ["hips", "thoracic spine"], dose: "4–6 each side", minutes: 1, cue: "Move slowly between the lunge, elbow drop, and rotation." },
  { id: "cat-camel", name: "Cat-camel segmental spine", phase: "mobilize", tags: ["thoracic", "bracing", "hinge"], regions: ["spine"], dose: "6–8 reps", minutes: 1, cue: "Explore each segment gently; this is not a loaded end-range drill." },
  { id: "quadruped-t-rotation", name: "Quadruped thoracic rotation", phase: "mobilize", tags: ["thoracic", "rotation", "horizontalPull"], regions: ["thoracic spine", "shoulders"], dose: "6 each side", minutes: 1, cue: "Keep the supporting hand planted and rotate through the upper back." },
  { id: "open-book", name: "Side-lying open book", phase: "mobilize", tags: ["thoracic", "rotation", "horizontalPush"], regions: ["thoracic spine", "chest"], dose: "6 each side", minutes: 1, cue: "Let the breath guide the rotation; do not pull the shoulder forward." },
  { id: "tall-kneel-rotation", name: "Tall-kneeling rotation reach", phase: "rehearse", tags: ["thoracic", "rotation", "bracing"], regions: ["obliques", "thoracic spine"], dose: "6 each side", minutes: 1, cue: "Squeeze the glutes and rotate the ribcage over a stable pelvis." },
  { id: "dead-bug", name: "Dead bug reach", phase: "activate", tags: ["bracing", "hinge", "squat", "overhead"], regions: ["abdominals", "hip flexors"], dose: "6 each side", minutes: 1, cue: "Exhale as the limb reaches; keep the low back from arching." },
  { id: "bird-dog", name: "Bird dog reach", phase: "activate", tags: ["bracing", "hinge", "horizontalPull"], regions: ["spine", "glutes"], dose: "6 each side", minutes: 1, cue: "Reach long from heel to fingertips without shifting the trunk." },
  { id: "plank-shoulder-tap", name: "Plank shoulder tap", phase: "activate", tags: ["bracing", "horizontalPush", "shoulder"], regions: ["abdominals", "serratus anterior"], dose: "8 total taps", minutes: 1, cue: "Minimize hip sway as the hand leaves the floor." },
  { id: "side-plank-reach", name: "Side plank reach-through", phase: "activate", tags: ["bracing", "rotation", "shoulder"], regions: ["obliques", "shoulders"], dose: "5 each side", minutes: 1, cue: "Keep the elbow stacked under the shoulder and rotate smoothly." },
  { id: "bear-crawl", name: "Bear crawl", phase: "rehearse", tags: ["bracing", "shoulder", "wrist", "carry"], regions: ["shoulders", "abdominals", "wrists"], dose: "2 × 6 steps", minutes: 1, cue: "Float the knees just off the floor and move opposite hand and foot." },
  { id: "pallof-press", name: "Tall-kneeling Pallof press", phase: "activate", tags: ["bracing", "rotation", "carry"], regions: ["obliques", "shoulders"], dose: "6 each side", minutes: 1, cue: "Press straight out while resisting trunk rotation." },
  { id: "half-kneel-chop", name: "Half-kneeling chop pattern", phase: "rehearse", tags: ["rotation", "bracing", "lunge"], regions: ["obliques", "hips"], dose: "6 each side", minutes: 1, cue: "Let the hips stay square while the ribcage moves." },
  { id: "shoulder-pass-through", name: "Shoulder pass-through", phase: "mobilize", tags: ["shoulder", "overhead", "verticalPush"], regions: ["shoulders", "chest"], dose: "8–10 reps", minutes: 1, cue: "Use a wide grip and a pain-free range; do not force the shoulders back." },
  { id: "band-pull-apart", name: "Band pull-apart", phase: "activate", tags: ["shoulder", "horizontalPull", "verticalPull"], regions: ["rear deltoids", "upper back"], dose: "12 reps", minutes: 1, cue: "Finish with the shoulder blades sliding back and down, not shrugged." },
  { id: "scap-wall-slide", name: "Scapular wall slide", phase: "activate", tags: ["shoulder", "overhead", "verticalPush"], regions: ["serratus anterior", "lower trapezius"], dose: "8 reps", minutes: 1, cue: "Keep the ribs down as the forearms glide upward." },
  { id: "serratus-pushup", name: "Push-up plus", phase: "activate", tags: ["shoulder", "horizontalPush", "bracing"], regions: ["serratus anterior", "shoulders"], dose: "8–10 reps", minutes: 1, cue: "At the top, reach the floor away without bending the elbows." },
  { id: "scap-pullup", name: "Scapular pull-up", phase: "activate", tags: ["shoulder", "verticalPull", "grip"], regions: ["lower trapezius", "lats"], dose: "6–8 reps", minutes: 1, cue: "Move only through the shoulder blades; keep the elbows long." },
  { id: "wall-shoulder-flexion", name: "Wall shoulder flexion lift-off", phase: "mobilize", tags: ["shoulder", "overhead", "verticalPush"], regions: ["shoulders", "thoracic spine"], dose: "6–8 reps", minutes: 1, cue: "Keep the ribs stacked and move slowly through a comfortable range." },
  { id: "quadruped-scap-circle", name: "Quadruped scapular circle", phase: "mobilize", tags: ["shoulder", "horizontalPush", "wrist"], regions: ["shoulders", "wrists"], dose: "5 each direction", minutes: 1, cue: "Circle from the shoulder blades with soft elbows." },
  { id: "band-external-rotation", name: "Band external rotation", phase: "activate", tags: ["shoulder", "overhead", "horizontalPull"], regions: ["rotator cuff"], dose: "10 each side", minutes: 1, cue: "Pin the elbow gently to the side; avoid rotating the whole torso." },
  { id: "face-pull-rotate", name: "Face pull to external rotation", phase: "activate", tags: ["shoulder", "horizontalPull", "overhead"], regions: ["rear deltoids", "rotator cuff"], dose: "8 reps", minutes: 1, cue: "Keep the neck relaxed and finish with the hands beside the ears." },
  { id: "prone-y-raise", name: "Prone Y raise", phase: "activate", tags: ["shoulder", "overhead", "verticalPull"], regions: ["lower trapezius", "shoulders"], dose: "8 reps", minutes: 1, cue: "Reach long, keep the thumbs up, and use a very small range." },
  { id: "arm-circle", name: "Controlled arm circle", phase: "mobilize", tags: ["shoulder", "horizontalPush", "horizontalPull"], regions: ["shoulders"], dose: "8 each direction", minutes: 1, cue: "Grow the circle only while the shoulder stays comfortable." },
  { id: "wrist-circle", name: "Wrist circle", phase: "mobilize", tags: ["wrist", "grip", "horizontalPush"], regions: ["wrists", "forearms"], dose: "8 each direction", minutes: 1, cue: "Move through the wrist, not the elbow." },
  { id: "wrist-rock", name: "Quadruped wrist rock", phase: "mobilize", tags: ["wrist", "horizontalPush", "grip"], regions: ["wrists", "forearms"], dose: "8 rocks", minutes: 1, cue: "Shift bodyweight gradually; turn the hands out or elevate them if needed." },
  { id: "wrist-extension", name: "Wrist extension glide", phase: "mobilize", tags: ["wrist", "grip", "horizontalPull"], regions: ["forearms"], dose: "8 each side", minutes: 1, cue: "Keep the fingers relaxed and avoid sharp sensation at the joint." },
  { id: "wrist-flexion", name: "Wrist flexion glide", phase: "mobilize", tags: ["wrist", "grip", "horizontalPull"], regions: ["forearms"], dose: "8 each side", minutes: 1, cue: "Use gentle pressure and keep the elbow straight but not locked." },
  { id: "pronation-supination", name: "Forearm pronation-supination", phase: "mobilize", tags: ["wrist", "grip", "horizontalPull"], regions: ["forearms"], dose: "10 each side", minutes: 1, cue: "Rotate the palm without shrugging the shoulder." },
  { id: "finger-extension", name: "Finger extension band open", phase: "activate", tags: ["wrist", "grip", "carry"], regions: ["hands", "forearms"], dose: "15 reps", minutes: 1, cue: "Open the hand fully, then relax the grip." },
  { id: "farmer-carry-march", name: "Light farmer carry march", phase: "rehearse", tags: ["carry", "grip", "bracing", "shoulder"], regions: ["hands", "obliques", "shoulders"], dose: "2 × 20 m", minutes: 2, cue: "Walk tall; keep the load close and the ribs over the hips." },
  { id: "snapdown-stick", name: "Snap-down to stick", phase: "rehearse", tags: ["jump", "braking", "squat", "knee"], regions: ["quadriceps", "hips"], dose: "5 reps", minutes: 1, cue: "Land quietly with the knees tracking and pause to own the position." },
  { id: "low-skip", name: "A-skip rhythm drill", phase: "rehearse", tags: ["sprint", "ankle", "singleLeg"], regions: ["feet", "hip flexors"], dose: "2 × 15 m", minutes: 1, cue: "Drive the knee up with a tall posture and quick ground contacts." },
  { id: "build-up-run", name: "Progressive build-up run", phase: "rehearse", tags: ["sprint", "jump", "ankle"], regions: ["whole lower body"], dose: "2 × 15–20 m", minutes: 2, cue: "Increase speed gradually; this is rehearsal, not a maximal sprint." },
  { id: "low-box-step", name: "Low step-up with knee drive", phase: "rehearse", tags: ["singleLeg", "lunge", "knee", "sprint"], regions: ["glutes", "quadriceps"], dose: "6 each side", minutes: 1, cue: "Push through the full foot and balance briefly at the top." },
  { id: "medicine-ball-scoop", name: "Light medicine-ball scoop pattern", phase: "rehearse", tags: ["rotation", "bracing", "horizontalPush"], regions: ["obliques", "hips", "shoulders"], dose: "6 each side", minutes: 1, cue: "Use a light implement and build speed only after the pattern is clean." },
  { id: "landmine-press-rehearsal", name: "Light landmine press rehearsal", phase: "rehearse", tags: ["verticalPush", "overhead", "shoulder", "bracing"], regions: ["shoulders", "serratus anterior"], dose: "6 each side", minutes: 1, cue: "Press on a smooth arc while keeping the ribs stacked." },
  { id: "empty-bar-hinge", name: "Empty-bar hinge rehearsal", phase: "rehearse", tags: ["hinge", "bracing", "horizontalPull"], regions: ["hamstrings", "spine"], dose: "8 reps", minutes: 1, cue: "Use only a light rehearsal load; feel the hips move back before loading." },
  { id: "goblet-squat-rehearsal", name: "Light goblet squat rehearsal", phase: "rehearse", tags: ["squat", "knee", "bracing", "ankle"], regions: ["hips", "quadriceps"], dose: "6 reps", minutes: 1, cue: "Use a light counterbalance and pause briefly in a stable bottom position." },
  { id: "empty-bar-press", name: "Empty-bar press rehearsal", phase: "rehearse", tags: ["horizontalPush", "verticalPush", "shoulder"], regions: ["chest", "shoulders"], dose: "8 reps", minutes: 1, cue: "Rehearse the bar path and shoulder position before working sets." },
  { id: "band-row-rehearsal", name: "Band row rehearsal", phase: "rehearse", tags: ["horizontalPull", "verticalPull", "shoulder"], regions: ["upper back", "lats"], dose: "10 reps", minutes: 1, cue: "Pause with the shoulder blades set; avoid leading with the chin." },
  { id: "controlled-dead-hang", name: "Supported dead hang", phase: "mobilize", tags: ["verticalPull", "overhead", "grip", "shoulder"], regions: ["lats", "shoulders", "hands"], dose: "2 × 10–20 sec", minutes: 1, cue: "Keep it submaximal and use foot support if the shoulders feel pinchy." },
  { id: "split-stance-row", name: "Split-stance row rehearsal", phase: "rehearse", tags: ["horizontalPull", "bracing", "lunge"], regions: ["upper back", "obliques"], dose: "8 each side", minutes: 1, cue: "Use a light load and resist trunk rotation while rowing." },
];

type WarmupGoal = "Athleticism" | "Muscle growth" | "Max strength" | "Capacity";
export type WarmupRecommendation = { drills: MobilityDrill[]; focusTags: MobilityTag[]; estimatedMinutes: number; rationale: string };

function inferExerciseTags(exercise: Exercise): MobilityTag[] {
  const text = `${exercise.movement} ${exercise.category} ${exercise.name} ${exercise.qualities.join(" ")}`.toLowerCase();
  const muscles = new Set([...exercise.primaryMuscles, ...exercise.secondaryMuscles]);
  const tags = new Set<MobilityTag>();
  if (/squat|leg press|hack squat|knee extension/.test(text)) tags.add("squat");
  if (/deadlift|hinge|good morning|hip thrust|back extension|swing/.test(text)) tags.add("hinge");
  if (/lunge|split squat|step-up/.test(text)) tags.add("lunge");
  if (/single|unilateral|split/.test(text)) tags.add("singleLeg");
  if (/horizontal push|bench|push-up|dip|fly/.test(text)) tags.add("horizontalPush");
  if (/vertical push|shoulder press|overhead press|landmine press/.test(text)) tags.add("verticalPush");
  if (/horizontal pull|row/.test(text)) tags.add("horizontalPull");
  if (/vertical pull|pull-up|pulldown/.test(text)) tags.add("verticalPull");
  if (/overhead|shoulder press|military press|landmine press|arnold press|push press|jerk/.test(text)) tags.add("overhead");
  if (/rotation|chop|twist|throw/.test(text)) tags.add("rotation");
  if (/carry|farmer/.test(text)) tags.add("carry");
  if (/jump|plyo/.test(text)) tags.add("jump");
  if (/sprint|sled/.test(text)) tags.add("sprint");
  if (/lateral|abduction|adduction/.test(text)) tags.add("lateral");
  if (exercise.qualities.includes("bracing") || muscles.has("abs") || muscles.has("obliques")) tags.add("bracing");
  if (muscles.has("calves") || muscles.has("tibialis")) tags.add("ankle");
  if (muscles.has("quads") || muscles.has("adductors")) tags.add("knee");
  if (muscles.has("glutes") || muscles.has("hamstrings") || muscles.has("abductors") || muscles.has("adductors")) tags.add("hip");
  if (muscles.has("shoulders") || muscles.has("frontDelts") || muscles.has("sideDelts") || muscles.has("rearDelts") || muscles.has("rotatorCuff")) tags.add("shoulder");
  if (muscles.has("lats") || muscles.has("upperBack") || muscles.has("traps")) tags.add("thoracic");
  if (muscles.has("forearms") || muscles.has("brachialis")) { tags.add("wrist"); tags.add("grip"); }
  return tags.size ? Array.from(tags) : ["general"];
}

function goalPhaseBoost(goal: WarmupGoal, phase: WarmupPhase) {
  if (goal === "Athleticism") return phase === "rehearse" ? 1.8 : phase === "raise" ? 0.8 : 0;
  if (goal === "Max strength") return phase === "activate" ? 1.4 : phase === "rehearse" ? 1.1 : 0;
  if (goal === "Muscle growth") return phase === "mobilize" ? 1.15 : phase === "activate" ? 0.8 : 0;
  return phase === "raise" ? 1.25 : phase === "rehearse" ? 0.75 : 0;
}

export function getStackWarmup(workout: Exercise[], goal: WarmupGoal): WarmupRecommendation {
  const wanted = new Set<MobilityTag>(["general"]);
  workout.forEach((exercise) => inferExerciseTags(exercise).forEach((tag) => wanted.add(tag)));
  const focusTags = Array.from(wanted).filter((tag): tag is Exclude<MobilityTag, "general"> => tag !== "general").slice(0, 7);
  const ranked = preTrainingMobilityLibrary.map((drill) => {
    const matched = drill.tags.filter((tag) => wanted.has(tag)).length;
    const direct = drill.tags.some((tag) => tag !== "general" && focusTags.includes(tag)) ? 1.25 : 0;
    return { drill, score: matched * 2.45 + direct + goalPhaseBoost(goal, drill.phase) };
  }).sort((a, b) => b.score - a.score || a.drill.name.localeCompare(b.drill.name));
  const selected: MobilityDrill[] = [];
  const regions = new Set<string>();
  const phases = new Set<WarmupPhase>();
  const select = (drill: MobilityDrill) => {
    if (selected.some((item) => item.id === drill.id)) return;
    selected.push(drill);
    drill.regions.forEach((region) => regions.add(region));
    phases.add(drill.phase);
  };
  (["raise", "mobilize", "activate", "rehearse"] as WarmupPhase[]).forEach((phase) => {
    const next = ranked.find(({ drill }) => drill.phase === phase && drill.tags.some((tag) => wanted.has(tag)));
    if (next) select(next.drill);
  });
  for (const { drill } of ranked) {
    const isUseful = drill.tags.some((tag) => wanted.has(tag));
    const introducesPhase = !phases.has(drill.phase);
    const introducesRegion = drill.regions.some((region) => !regions.has(region));
    if (!isUseful || (!introducesPhase && !introducesRegion && selected.length >= 4)) continue;
    select(drill);
    if (selected.length === 6) break;
  }
  const drills = selected.length ? selected : preTrainingMobilityLibrary.slice(0, 5);
  const estimatedMinutes = drills.reduce((total, drill) => total + drill.minutes, 0);
  const emphasis = focusTags.slice(0, 3).join(", ") || "whole-body preparation";
  return { drills, focusTags, estimatedMinutes, rationale: `Matched to ${emphasis} demands in the active stack. Begin easy, use a comfortable range, then rehearse the first loaded pattern with light sets.` };
}
