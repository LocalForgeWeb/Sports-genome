import { useMemo, useState } from "react";
import { ChevronDown, Focus, RotateCcw, RotateCw, Search, SlidersHorizontal, Target } from "lucide-react";
import "../anatomy-clean.css";

/** Body Lab: realistic anatomical illustration with interactive SVG overlay hotspots. */
type AnatomyMapProps = { primary: string[]; secondary: string[]; onSelect: (muscle: string) => void };
type Side = "front" | "back";
type Layer = "surface" | "deep" | "all";
type Role = "Primary" | "Synergist" | "Stabilizer";
type Region = {
  id: string; key: string; side: Side; layer: "surface" | "deep";
  label: string; action: string; why: string;
  /* percentage-based bounding box over the illustration: [x%, y%, width%, height%] */
  hitbox: [number, number, number, number];
  offset: number; stabilizer?: boolean; related?: string[]; focus: string;
};

const labels: Record<string, string> = {
  chest: "Pectoralis major", frontDelts: "Anterior deltoid", sideDelts: "Lateral deltoid",
  rearDelts: "Posterior deltoid", shoulders: "Deltoid complex", biceps: "Biceps brachii",
  brachialis: "Brachialis", brachioradialis: "Brachioradialis", triceps: "Triceps brachii",
  forearms: "Forearm compartments", abs: "Rectus abdominis", obliques: "External oblique",
  serratusAnterior: "Serratus anterior", hipFlexors: "Hip flexor complex",
  tfl: "Tensor fasciae latae", quads: "Quadriceps femoris", adductors: "Hip adductors",
  abductors: "Hip abductors", glutes: "Gluteal complex", hamstrings: "Hamstrings",
  calves: "Gastrocnemius", soleus: "Soleus", tibialis: "Tibialis anterior",
  peroneals: "Peroneus longus/brevis", lats: "Latissimus dorsi", traps: "Trapezius",
  rhomboids: "Rhomboids", lowerBack: "Spinal erectors", rotatorCuff: "Rotator cuff muscles"
};

const aliases: Record<string, string[]> = {
  chest: ["chest", "pectoral", "pectoralis", "pec"],
  frontDelts: ["frontdelts", "anteriordelt", "shoulders"],
  sideDelts: ["sidedelts", "lateraldelt", "shoulders"],
  rearDelts: ["reardelts", "posteriordelt", "shoulders"],
  biceps: ["biceps"], brachialis: ["brachialis"], brachioradialis: ["brachioradialis"],
  triceps: ["triceps"], forearms: ["forearms", "grip", "wristflexors", "wristextensors"],
  abs: ["abs", "rectusabdominis"], obliques: ["obliques", "core", "externaloblique"],
  serratusAnterior: ["serratus", "serratusanterior"],
  hipFlexors: ["hipflexors", "iliopsoas"], tfl: ["tfl", "tensorfasciaelatae"],
  quads: ["quads", "quadriceps"], adductors: ["adductors"],
  abductors: ["abductors", "glutemedius"], glutes: ["glutes", "gluteusmaximus"],
  hamstrings: ["hamstrings"], calves: ["calves", "gastrocnemius"], soleus: ["soleus"],
  tibialis: ["tibialis"], peroneals: ["peroneals", "peroneus", "fibularis"],
  lats: ["lats", "latissimus"], traps: ["traps", "trapezius"], rhomboids: ["rhomboids"],
  lowerBack: ["lowerback", "erectors", "erectorspinae"],
  rotatorCuff: ["rotatorcuff", "infraspinatus"]
};

const clean = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
const matches = (key: string, values: string[]) => values.some(v => (aliases[key] || [key]).some(a => clean(v).includes(a)));
const heat = (s: number) => s >= 90 ? "rgba(219,47,36,.55)" : s >= 75 ? "rgba(244,105,51,.50)" : s >= 60 ? "rgba(245,161,61,.45)" : s >= 40 ? "rgba(216,192,82,.40)" : s >= 20 ? "rgba(115,184,217,.35)" : "transparent";
const heatSolid = (s: number) => s >= 90 ? "#db2f24" : s >= 75 ? "#f46933" : s >= 60 ? "#f5a13d" : s >= 40 ? "#d8c052" : s >= 20 ? "#73b8d9" : "#b0bfc8";
const tier = (s: number) => s >= 90 ? "S" : s >= 80 ? "A" : s >= 65 ? "B" : s >= 45 ? "C" : s >= 25 ? "D" : "F";

/* Illustration URLs */
const ANTERIOR_IMG = "/manus-storage/anatomy-front-view_ee25f580.png";
const POSTERIOR_IMG = "/manus-storage/anatomy-posterior_6114a98a.png";

/*
 * Hitbox regions: [x%, y%, w%, h%] — percentage coordinates over the illustration image.
 * These define clickable overlay rectangles positioned over each muscle group.
 * The illustration itself shows ALL muscles at all times. The overlay only adds
 * a semi-transparent color tint for muscles that are being worked.
 */
const regions: Region[] = [
  // ─── ANTERIOR (FRONT) ───
  // Chest
  { id: "upper-pec-l", key: "chest", side: "front", layer: "surface", label: "Pectoralis major (clavicular)", action: "Shoulder flexion and horizontal adduction", why: "Upper pectoral portion drives the arm forward and inward during pressing.", hitbox: [30, 19, 18, 6], offset: 4, focus: "40% 22%" },
  { id: "upper-pec-r", key: "chest", side: "front", layer: "surface", label: "Pectoralis major (clavicular)", action: "Shoulder flexion and horizontal adduction", why: "Upper pectoral portion drives the arm forward and inward during pressing.", hitbox: [52, 19, 18, 6], offset: 4, focus: "60% 22%" },
  { id: "lower-pec-l", key: "chest", side: "front", layer: "surface", label: "Pectoralis major (sternocostal)", action: "Horizontal adduction and humeral adduction", why: "Broad chest portion is a main force contributor in horizontal pressing.", hitbox: [30, 25, 18, 7], offset: 0, focus: "40% 28%" },
  { id: "lower-pec-r", key: "chest", side: "front", layer: "surface", label: "Pectoralis major (sternocostal)", action: "Horizontal adduction and humeral adduction", why: "Broad chest portion is a main force contributor in horizontal pressing.", hitbox: [52, 25, 18, 7], offset: 0, focus: "60% 28%" },
  // Deltoids
  { id: "ant-delt-l", key: "frontDelts", side: "front", layer: "surface", label: "Anterior deltoid", action: "Shoulder flexion and forward arm drive", why: "Supports forward and upward arm force in front of the torso.", hitbox: [22, 18, 9, 9], offset: -5, focus: "26% 22%" },
  { id: "ant-delt-r", key: "frontDelts", side: "front", layer: "surface", label: "Anterior deltoid", action: "Shoulder flexion and forward arm drive", why: "Supports forward and upward arm force in front of the torso.", hitbox: [69, 18, 9, 9], offset: -5, focus: "74% 22%" },
  { id: "lat-delt-l", key: "sideDelts", side: "front", layer: "surface", label: "Lateral deltoid", action: "Shoulder abduction", why: "Lifts the arm laterally for shoulder width and overhead stability.", hitbox: [19, 19, 5, 8], offset: -8, focus: "21% 23%" },
  { id: "lat-delt-r", key: "sideDelts", side: "front", layer: "surface", label: "Lateral deltoid", action: "Shoulder abduction", why: "Lifts the arm laterally for shoulder width and overhead stability.", hitbox: [76, 19, 5, 8], offset: -8, focus: "79% 23%" },
  // Arms
  { id: "biceps-l", key: "biceps", side: "front", layer: "surface", label: "Biceps brachii", action: "Elbow flexion and forearm supination", why: "Contributes to pulling and elbow-flexion work.", hitbox: [18, 28, 8, 10], offset: 0, focus: "22% 33%" },
  { id: "biceps-r", key: "biceps", side: "front", layer: "surface", label: "Biceps brachii", action: "Elbow flexion and forearm supination", why: "Contributes to pulling and elbow-flexion work.", hitbox: [74, 28, 8, 10], offset: 0, focus: "78% 33%" },
  { id: "brachialis-l", key: "brachialis", side: "front", layer: "deep", label: "Brachialis", action: "Elbow flexion (pure)", why: "Strongest pure elbow flexor, deep to the biceps.", hitbox: [17, 35, 6, 5], offset: -4, focus: "20% 37%" },
  { id: "brachialis-r", key: "brachialis", side: "front", layer: "deep", label: "Brachialis", action: "Elbow flexion (pure)", why: "Strongest pure elbow flexor, deep to the biceps.", hitbox: [77, 35, 6, 5], offset: -4, focus: "80% 37%" },
  { id: "brachiorad-l", key: "brachioradialis", side: "front", layer: "surface", label: "Brachioradialis", action: "Elbow flexion in neutral grip", why: "Assists elbow flexion with neutral or pronated grip.", hitbox: [14, 38, 6, 8], offset: -6, focus: "17% 42%" },
  { id: "brachiorad-r", key: "brachioradialis", side: "front", layer: "surface", label: "Brachioradialis", action: "Elbow flexion in neutral grip", why: "Assists elbow flexion with neutral or pronated grip.", hitbox: [80, 38, 6, 8], offset: -6, focus: "83% 42%" },
  { id: "forearm-l", key: "forearms", side: "front", layer: "surface", label: "Forearm flexor compartment", action: "Grip and wrist flexion", why: "Grip-intensive tasks raise demand through wrist flexion control.", hitbox: [13, 39, 7, 9], offset: -4, focus: "16% 43%" },
  { id: "forearm-r", key: "forearms", side: "front", layer: "surface", label: "Forearm flexor compartment", action: "Grip and wrist flexion", why: "Grip-intensive tasks raise demand through wrist flexion control.", hitbox: [80, 39, 7, 9], offset: -4, focus: "84% 43%" },
  // Torso
  { id: "serratus-l", key: "serratusAnterior", side: "front", layer: "surface", label: "Serratus anterior", action: "Scapular protraction and upward rotation", why: "Guides and stabilizes the shoulder blade during pressing.", hitbox: [27, 30, 6, 8], offset: -6, stabilizer: true, related: ["frontDelts", "chest"], focus: "30% 34%" },
  { id: "serratus-r", key: "serratusAnterior", side: "front", layer: "surface", label: "Serratus anterior", action: "Scapular protraction and upward rotation", why: "Guides and stabilizes the shoulder blade during pressing.", hitbox: [67, 30, 6, 8], offset: -6, stabilizer: true, related: ["frontDelts", "chest"], focus: "70% 34%" },
  { id: "obliques-l", key: "obliques", side: "front", layer: "surface", label: "External oblique", action: "Trunk rotation and anti-rotation", why: "Transfers force through the torso and resists unwanted rotation.", hitbox: [28, 33, 10, 10], offset: -5, stabilizer: true, focus: "33% 38%" },
  { id: "obliques-r", key: "obliques", side: "front", layer: "surface", label: "External oblique", action: "Trunk rotation and anti-rotation", why: "Transfers force through the torso and resists unwanted rotation.", hitbox: [62, 33, 10, 10], offset: -5, stabilizer: true, focus: "67% 38%" },
  { id: "rectus", key: "abs", side: "front", layer: "surface", label: "Rectus abdominis", action: "Trunk flexion and bracing", why: "Manages trunk position and resists extension under load.", hitbox: [38, 32, 24, 14], offset: -8, stabilizer: true, focus: "50% 39%" },
  // Hips
  { id: "hip-flexor-l", key: "hipFlexors", side: "front", layer: "deep", label: "Hip flexor complex (iliopsoas)", action: "Hip flexion and proximal control", why: "Assists thigh lift and controls hip position in sprint and lunge actions.", hitbox: [33, 44, 10, 6], offset: -8, focus: "38% 47%" },
  { id: "hip-flexor-r", key: "hipFlexors", side: "front", layer: "deep", label: "Hip flexor complex (iliopsoas)", action: "Hip flexion and proximal control", why: "Assists thigh lift and controls hip position in sprint and lunge actions.", hitbox: [57, 44, 10, 6], offset: -8, focus: "62% 47%" },
  { id: "tfl-l", key: "tfl", side: "front", layer: "surface", label: "Tensor fasciae latae", action: "Hip flexion, abduction, and internal rotation", why: "Assists hip flexion and abduction while tensioning the IT band.", hitbox: [27, 44, 7, 5], offset: -12, stabilizer: true, focus: "30% 46%" },
  { id: "tfl-r", key: "tfl", side: "front", layer: "surface", label: "Tensor fasciae latae", action: "Hip flexion, abduction, and internal rotation", why: "Assists hip flexion and abduction while tensioning the IT band.", hitbox: [66, 44, 7, 5], offset: -12, stabilizer: true, focus: "70% 46%" },
  // Legs
  { id: "quads-l", key: "quads", side: "front", layer: "surface", label: "Quadriceps femoris", action: "Knee extension", why: "Produces force to straighten the knee during squats, lunges, jumps, and deceleration.", hitbox: [28, 49, 16, 20], offset: 2, focus: "36% 59%" },
  { id: "quads-r", key: "quads", side: "front", layer: "surface", label: "Quadriceps femoris", action: "Knee extension", why: "Produces force to straighten the knee during squats, lunges, jumps, and deceleration.", hitbox: [56, 49, 16, 20], offset: 2, focus: "64% 59%" },
  { id: "adductors-l", key: "adductors", side: "front", layer: "surface", label: "Hip adductor group", action: "Hip adduction and medial-leg control", why: "Contributes to femoral control and deep hip-flexion positions.", hitbox: [40, 50, 8, 16], offset: -7, stabilizer: true, focus: "44% 58%" },
  { id: "adductors-r", key: "adductors", side: "front", layer: "surface", label: "Hip adductor group", action: "Hip adduction and medial-leg control", why: "Contributes to femoral control and deep hip-flexion positions.", hitbox: [52, 50, 8, 16], offset: -7, stabilizer: true, focus: "56% 58%" },
  // Lower legs
  { id: "tibialis-l", key: "tibialis", side: "front", layer: "surface", label: "Tibialis anterior", action: "Ankle dorsiflexion", why: "Controls foot clearance and ankle position through gait and landing.", hitbox: [32, 72, 7, 12], offset: -6, focus: "35% 78%" },
  { id: "tibialis-r", key: "tibialis", side: "front", layer: "surface", label: "Tibialis anterior", action: "Ankle dorsiflexion", why: "Controls foot clearance and ankle position through gait and landing.", hitbox: [61, 72, 7, 12], offset: -6, focus: "65% 78%" },
  { id: "peroneals-l", key: "peroneals", side: "front", layer: "surface", label: "Peroneus longus and brevis", action: "Ankle eversion and lateral stability", why: "Stabilizes the ankle laterally and assists in plantarflexion.", hitbox: [27, 74, 6, 10], offset: -10, stabilizer: true, focus: "30% 79%" },
  { id: "peroneals-r", key: "peroneals", side: "front", layer: "surface", label: "Peroneus longus and brevis", action: "Ankle eversion and lateral stability", why: "Stabilizes the ankle laterally and assists in plantarflexion.", hitbox: [67, 74, 6, 10], offset: -10, stabilizer: true, focus: "70% 79%" },

  // ─── POSTERIOR (BACK) ───
  { id: "upper-trap", key: "traps", side: "back", layer: "surface", label: "Upper trapezius", action: "Scapular elevation and upward rotation", why: "Supports shoulder positioning and upward scapular rotation.", hitbox: [30, 14, 40, 6], offset: -10, stabilizer: true, focus: "50% 17%" },
  { id: "middle-trap", key: "traps", side: "back", layer: "surface", label: "Middle trapezius", action: "Scapular retraction", why: "Stabilizes and retracts the shoulder blade during pulling.", hitbox: [33, 20, 34, 7], offset: -14, stabilizer: true, focus: "50% 23%" },
  { id: "lower-trap", key: "traps", side: "back", layer: "surface", label: "Lower trapezius", action: "Scapular depression and upward rotation support", why: "Supports controlled scapular motion in overhead and pulling actions.", hitbox: [37, 27, 26, 8], offset: -22, stabilizer: true, focus: "50% 31%" },
  { id: "rhomboids", key: "rhomboids", side: "back", layer: "deep", label: "Rhomboid major and minor", action: "Scapular retraction and downward rotation", why: "Pulls shoulder blades together and maintains upright posture.", hitbox: [36, 22, 28, 8], offset: -16, stabilizer: true, focus: "50% 26%" },
  { id: "post-delt-l", key: "rearDelts", side: "back", layer: "surface", label: "Posterior deltoid", action: "Shoulder extension and horizontal abduction", why: "Supports arm drive behind the torso and posterior shoulder control.", hitbox: [20, 18, 10, 8], offset: -4, focus: "25% 22%" },
  { id: "post-delt-r", key: "rearDelts", side: "back", layer: "surface", label: "Posterior deltoid", action: "Shoulder extension and horizontal abduction", why: "Supports arm drive behind the torso and posterior shoulder control.", hitbox: [70, 18, 10, 8], offset: -4, focus: "75% 22%" },
  { id: "infraspinatus-l", key: "rotatorCuff", side: "back", layer: "deep", label: "Infraspinatus", action: "External rotation and joint centering", why: "Rotator cuff muscle that centers the humeral head during loaded movement.", hitbox: [26, 22, 12, 8], offset: -24, stabilizer: true, focus: "32% 26%" },
  { id: "infraspinatus-r", key: "rotatorCuff", side: "back", layer: "deep", label: "Infraspinatus", action: "External rotation and joint centering", why: "Rotator cuff muscle that centers the humeral head during loaded movement.", hitbox: [62, 22, 12, 8], offset: -24, stabilizer: true, focus: "68% 26%" },
  { id: "lats-l", key: "lats", side: "back", layer: "surface", label: "Latissimus dorsi", action: "Shoulder extension, adduction, and medial rotation", why: "Contributes when the arm is pulled down, back, or toward the torso.", hitbox: [24, 28, 18, 16], offset: 3, focus: "33% 36%" },
  { id: "lats-r", key: "lats", side: "back", layer: "surface", label: "Latissimus dorsi", action: "Shoulder extension, adduction, and medial rotation", why: "Contributes when the arm is pulled down, back, or toward the torso.", hitbox: [58, 28, 18, 16], offset: 3, focus: "67% 36%" },
  { id: "triceps-l", key: "triceps", side: "back", layer: "surface", label: "Triceps brachii", action: "Elbow extension", why: "Contributes to pressing and terminal elbow extension under load.", hitbox: [16, 27, 9, 11], offset: 1, focus: "20% 32%" },
  { id: "triceps-r", key: "triceps", side: "back", layer: "surface", label: "Triceps brachii", action: "Elbow extension", why: "Contributes to pressing and terminal elbow extension under load.", hitbox: [75, 27, 9, 11], offset: 1, focus: "80% 32%" },
  { id: "wrist-ext-l", key: "forearms", side: "back", layer: "surface", label: "Wrist extensor compartment", action: "Wrist stabilization and extension", why: "Supports balanced wrist position during grip and loaded hand contact.", hitbox: [12, 39, 7, 9], offset: -7, stabilizer: true, focus: "15% 43%" },
  { id: "wrist-ext-r", key: "forearms", side: "back", layer: "surface", label: "Wrist extensor compartment", action: "Wrist stabilization and extension", why: "Supports balanced wrist position during grip and loaded hand contact.", hitbox: [81, 39, 7, 9], offset: -7, stabilizer: true, focus: "85% 43%" },
  { id: "erectors", key: "lowerBack", side: "back", layer: "surface", label: "Erector spinae", action: "Spinal extension and bracing", why: "Resists trunk flexion and maintains spinal position under load.", hitbox: [40, 36, 20, 12], offset: -9, stabilizer: true, focus: "50% 42%" },
  { id: "glute-max-l", key: "glutes", side: "back", layer: "surface", label: "Gluteus maximus", action: "Hip extension and external rotation", why: "Principal hip extensor in hinge, sprint, jump, and rising patterns.", hitbox: [30, 47, 16, 10], offset: 4, focus: "38% 52%" },
  { id: "glute-max-r", key: "glutes", side: "back", layer: "surface", label: "Gluteus maximus", action: "Hip extension and external rotation", why: "Principal hip extensor in hinge, sprint, jump, and rising patterns.", hitbox: [54, 47, 16, 10], offset: 4, focus: "62% 52%" },
  { id: "glute-med-l", key: "abductors", side: "back", layer: "surface", label: "Gluteus medius", action: "Hip abduction and pelvic control", why: "Controls pelvis and femur position in single-leg work.", hitbox: [25, 44, 10, 6], offset: -18, stabilizer: true, focus: "30% 47%" },
  { id: "glute-med-r", key: "abductors", side: "back", layer: "surface", label: "Gluteus medius", action: "Hip abduction and pelvic control", why: "Controls pelvis and femur position in single-leg work.", hitbox: [65, 44, 10, 6], offset: -18, stabilizer: true, focus: "70% 47%" },
  { id: "hams-l", key: "hamstrings", side: "back", layer: "surface", label: "Hamstring group", action: "Knee flexion and hip extension", why: "Assists hip extension and controls the knee across athletic actions.", hitbox: [30, 55, 14, 18], offset: 2, focus: "37% 64%" },
  { id: "hams-r", key: "hamstrings", side: "back", layer: "surface", label: "Hamstring group", action: "Knee flexion and hip extension", why: "Assists hip extension and controls the knee across athletic actions.", hitbox: [56, 55, 14, 18], offset: 2, focus: "63% 64%" },
  { id: "gastroc-l", key: "calves", side: "back", layer: "surface", label: "Gastrocnemius", action: "Ankle plantarflexion and propulsion", why: "Contributes to lower-leg stiffness and propulsion.", hitbox: [30, 72, 12, 10], offset: 0, focus: "36% 77%" },
  { id: "gastroc-r", key: "calves", side: "back", layer: "surface", label: "Gastrocnemius", action: "Ankle plantarflexion and propulsion", why: "Contributes to lower-leg stiffness and propulsion.", hitbox: [58, 72, 12, 10], offset: 0, focus: "64% 77%" },
  { id: "soleus-l", key: "soleus", side: "back", layer: "deep", label: "Soleus", action: "Sustained ankle plantarflexion", why: "Provides endurance-based plantarflexion for posture and slow locomotion.", hitbox: [31, 80, 10, 8], offset: -8, focus: "36% 84%" },
  { id: "soleus-r", key: "soleus", side: "back", layer: "deep", label: "Soleus", action: "Sustained ankle plantarflexion", why: "Provides endurance-based plantarflexion for posture and slow locomotion.", hitbox: [59, 80, 10, 8], offset: -8, focus: "64% 84%" },
];

export function AnatomyMap({ primary, secondary, onSelect }: AnatomyMapProps) {
  const [side, setSide] = useState<Side>("front");
  const [layer, setLayer] = useState<Layer>("all");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | Role>("All");
  const [threshold, setThreshold] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [hoverId, setHoverId] = useState("");
  const [focused, setFocused] = useState(false);

  const roleFor = (r: Region): Role | null =>
    matches(r.key, primary) ? "Primary" :
    matches(r.key, secondary) ? r.stabilizer ? "Stabilizer" : "Synergist" :
    (r.related || []).some(k => matches(k, primary)) ? "Stabilizer" : null;

  const scoreFor = (r: Region) => {
    const role = roleFor(r);
    const base = role === "Primary" ? 90 : role === "Synergist" ? 65 : role === "Stabilizer" ? 42 : 0;
    return Math.max(0, Math.min(100, base + r.offset));
  };

  const computed = useMemo(() => regions.map(r => ({ ...r, role: roleFor(r), score: scoreFor(r) })), [primary, secondary]);

  const visibleOnSide = computed.filter(r => r.side === side && (layer === "all" || r.layer === layer));
  const filteredForList = visibleOnSide.filter(r =>
    (roleFilter === "All" || r.role === roleFilter) &&
    r.label.toLowerCase().includes(query.toLowerCase()) &&
    r.score >= threshold
  );

  /* Deduplicate ranked list by key (left/right are same muscle) */
  const rankedMap = new Map<string, typeof computed[number]>();
  computed.filter(r => r.role).sort((a, b) => b.score - a.score).forEach(r => {
    if (!rankedMap.has(r.key)) rankedMap.set(r.key, r);
  });
  const ranked = Array.from(rankedMap.values()).slice(0, 6);

  const selected = computed.find(r => r.id === selectedId);
  const hover = computed.find(r => r.id === hoverId);

  const select = (region: typeof computed[number]) => { setSide(region.side); setSelectedId(region.id); setFocused(false); onSelect(region.key); };
  const clearSelection = () => { setSelectedId(""); setFocused(false); };
  const reset = () => { setSide("front"); setLayer("all"); setQuery(""); setRoleFilter("All"); setThreshold(0); clearSelection(); };
  const metric = (offset: number) => selected ? Math.max(12, Math.min(98, selected.score + offset)) : 0;
  const coreMetrics = selected ? [["Force exposure", metric(1)], ["Long-length challenge", metric(-12)], ["Stability demand", metric(selected.role === "Stabilizer" ? 24 : -22)]] as const : [];
  const fullMetrics = selected ? [["Mechanical tension", metric(2)], ["Hypertrophy potential", metric(-3)], ["Strength contribution", metric(0)], ["Stabilization demand", metric(selected.role === "Stabilizer" ? 24 : -22)], ["Long-length loading", metric(-12)], ["Eccentric demand", metric(-5)], ["Concentric demand", metric(3)], ["Isometric demand", metric(selected.role === "Stabilizer" ? 19 : -18)], ["Fatigue contribution", metric(-9)]] as const : [];

  const imgSrc = side === "front" ? ANTERIOR_IMG : POSTERIOR_IMG;

  return (
    <section className="anatomy-atlas-pro">
      <div className="atlas-pro-head">
        <div>
          <p className="metric-label">Body Lab / involvement heat map</p>
          <h2>See the work. <em>Then inspect the why.</em></h2>
        </div>
        <p>Detailed anatomical model. Worked muscles are highlighted with activation intensity. Click any region to inspect.</p>
      </div>

      <div className="atlas-pro-grid">
        {/* ─── LEFT: Controls ─── */}
        <aside className="atlas-pro-controls">
          <div className="atlas-control-group">
            <span>View</span>
            <div className="atlas-pill-row">
              <button className={side === "front" ? "is-active" : ""} onClick={() => setSide("front")}>Anterior</button>
              <button className={side === "back" ? "is-active" : ""} onClick={() => setSide("back")}>Posterior</button>
            </div>
          </div>
          <div className="atlas-control-group">
            <span>Layer</span>
            <div className="atlas-pill-row">
              <button className={layer === "all" ? "is-active" : ""} onClick={() => setLayer("all")}>All</button>
              <button className={layer === "surface" ? "is-active" : ""} onClick={() => setLayer("surface")}>Surface</button>
              <button className={layer === "deep" ? "is-active" : ""} onClick={() => setLayer("deep")}>Deep</button>
            </div>
          </div>
          <label className="atlas-pro-search">
            <Search className="h-4 w-4" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search muscle" />
          </label>
          <details className="atlas-advanced">
            <summary><SlidersHorizontal className="h-3.5 w-3.5" /> Advanced filters <ChevronDown className="h-3.5 w-3.5" /></summary>
            <div>
              <div className="atlas-control-group">
                <span>Role</span>
                <div className="atlas-pill-row atlas-pill-row-wrap">
                  {(["All", "Primary", "Synergist", "Stabilizer"] as const).map(item => (
                    <button key={item} onClick={() => setRoleFilter(item)} className={roleFilter === item ? "is-active" : ""}>{item}</button>
                  ))}
                </div>
              </div>
              <label className="atlas-threshold-pro">
                Involvement threshold <b>{threshold}</b>
                <input type="range" min="0" max="90" step="5" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
              </label>
            </div>
          </details>
          <button className="atlas-reset-pro" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset view</button>
        </aside>

        {/* ─── CENTER: Anatomical Illustration with Overlay ─── */}
        <div className="atlas-pro-canvas">
          <div className="atlas-canvas-header">
            <span className="atlas-view-label">{side === "front" ? "Anterior view" : "Posterior view"}</span>
            <button className="atlas-flip-btn" onClick={() => setSide(s => s === "front" ? "back" : "front")} aria-label="Switch between front and back view">
              <RotateCw className="h-4 w-4" />
              <span>{side === "front" ? "Flip to Back" : "Flip to Front"}</span>
            </button>
          </div>
          <div className="atlas-illustration-wrap" onClick={clearSelection}>
            <img
              src={imgSrc}
              alt={`${side === "front" ? "Anterior" : "Posterior"} anatomical muscle illustration`}
              className={`atlas-illustration atlas-illustration-grey ${focused ? "atlas-illustration-focused" : ""}`}
              style={{ transformOrigin: selected?.focus || "50% 44%" }}
              draggable={false}
            />
            {/* Interactive overlay hotspots */}
            {visibleOnSide.map(region => {
              const isWorked = Boolean(region.role);
              const isInList = filteredForList.includes(region);
              const isSelected = selectedId === region.id;
              const dimmed = selectedId && !isSelected;
              const [x, y, w, h] = region.hitbox;

              return (
                <div
                  key={region.id}
                  className={`atlas-hotspot ${isWorked ? "is-worked" : ""} ${isSelected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""} ${!isInList ? "is-filtered" : ""}`}
                  style={{
                    left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`,
                    backgroundColor: isWorked ? heat(region.score) : "transparent",
                    borderColor: isSelected ? "#061f31" : isWorked ? "rgba(255,255,255,.3)" : "transparent",
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${region.label}, ${region.role || "not involved"}, ${region.score} of 100`}
                  onMouseEnter={() => setHoverId(region.id)}
                  onMouseLeave={() => setHoverId("")}
                  onFocus={() => setHoverId(region.id)}
                  onBlur={() => setHoverId("")}
                  onClick={e => { e.stopPropagation(); select(region); }}
                  onDoubleClick={() => { select(region); setFocused(true); }}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(region); } if (e.key === "Escape") clearSelection(); }}
                />
              );
            })}

            {/* Hover tooltip */}
            {hover && (
              <div className="atlas-pro-tooltip" style={{ left: `${Math.min(hover.hitbox[0] + hover.hitbox[2] + 2, 70)}%`, top: `${hover.hitbox[1]}%` }}>
                <strong>{hover.label}</strong>
                <span>{hover.role || "Not involved"}</span>
                <b>{hover.score > 0 ? `${hover.score}/100 · ${tier(hover.score)} Tier` : "No activation"}</b>
                <p>{hover.action}</p>
              </div>
            )}
          </div>

          {/* Heat legend */}
          <div className="atlas-heat-legend-pro">
            <span>Neutral</span><i className="atlas-swatch" style={{ background: "#d4dfe6" }} />
            <span>20%</span><i className="atlas-swatch" style={{ background: "#73b8d9" }} />
            <span>40%</span><i className="atlas-swatch" style={{ background: "#2d6cdf" }} />
            <span>60%</span><i className="atlas-swatch" style={{ background: "#d8c052" }} />
            <span>80%</span><i className="atlas-swatch" style={{ background: "#f46933" }} />
            <span>90+</span><i className="atlas-swatch" style={{ background: "#db2f24" }} />
          </div>

          {/* Ranked muscles strip */}
          <div className="atlas-ranking">
            <div>
              <p className="metric-label">Top muscles</p>
              <span>Click a row to focus it on the model.</span>
            </div>
            {ranked.map((region, index) => (
              <button key={region.id} onClick={() => select(region)} className={selectedId === region.id ? "is-selected" : ""}>
                <i className="atlas-rank-dot" style={{ background: heatSolid(region.score) }} />
                <span>{region.label}</span>
                <em>{region.score}%</em>
                <b className="atlas-rank-bar"><i style={{ width: `${region.score}%`, background: heatSolid(region.score) }} /></b>
              </button>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Inspector ─── */}
        <aside className={`atlas-pro-inspector ${selected ? "is-open" : ""}`}>
          {selected ? (
            <>
              <div className="atlas-inspector-title">
                <div>
                  <p className="metric-label">Selected muscle</p>
                  <h3>{selected.label}</h3>
                </div>
                <button onClick={clearSelection} aria-label="Clear muscle selection">×</button>
              </div>
              <div className="atlas-inspector-badges">
                <span>{selected.role || "Not involved"}</span>
                <b>{selected.score}/100</b>
                <i>{tier(selected.score)} Tier</i>
              </div>
              <div className="atlas-core-metrics">
                {coreMetrics.map(([name, value]) => (
                  <div key={name as string}>
                    <span>{name}</span>
                    <b>{value}</b>
                    <i><em style={{ width: `${value}%` }} /></i>
                  </div>
                ))}
              </div>
              <div className="atlas-why-pro">
                <p className="metric-label">Why it matters</p>
                <p>{selected.why}</p>
                <span>{selected.action}</span>
              </div>
              <button className="atlas-focus-button" onClick={() => setFocused(v => !v)}>
                <Focus className="h-3.5 w-3.5" /> {focused ? "Reset focus" : "Focus region"}
              </button>
              <details className="atlas-full-analysis">
                <summary>View full analysis <ChevronDown className="h-4 w-4" /></summary>
                <div>
                  {fullMetrics.map(([name, value]) => (
                    <div key={name as string}>
                      <span>{name}</span>
                      <b>{value}</b>
                      <i><em style={{ width: `${value}%` }} /></i>
                    </div>
                  ))}
                  <p><b>Confidence:</b> Structured estimate based on the movement pattern, stated muscle role, and available mechanics evidence. Not a direct force, EMG, or hypertrophy measurement.</p>
                </div>
              </details>
            </>
          ) : (
            <div className="atlas-inspector-empty-pro">
              <Target className="h-5 w-5" />
              <strong>Explore through the body</strong>
              <p>Highlighted regions show muscles being worked by the current exercise. Click any muscle to inspect its role and detailed analysis.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export { labels as muscleLabels };
