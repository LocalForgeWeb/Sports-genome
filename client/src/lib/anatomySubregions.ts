/**
 * NOT CURRENTLY WIRED IN.
 *
 * This names the exact sub-region under the finger — the mid lats rather than
 * just "Latissimus dorsi" — and is keyed to the path ids of the `body-muscles`
 * package the Body Lab figure used to render. That package has been replaced,
 * so those ids no longer exist and nothing calls this today.
 *
 * It is kept because the capability is worth restoring: the new geometry
 * carries a `part` on every path (`chest/clavicular`, `quads/vastus_lateralis`,
 * `biceps/long_head`), which is the same idea under different keys. Re-pointing
 * this at those parts is the port, not a rewrite.
 */
/**
 * Precise identity for the anatomy chart's individual regions.
 *
 * The chart draws the latissimus dorsi as three separate bands and the trapezius as
 * three separate parts, but the app collapsed every one of them to its parent catalog
 * key on click. Tapping the mid lats and the lower lats produced the same reading -
 * "Latissimus dorsi" - so the subdivision the illustration was drawing carried no
 * meaning, and the three bands were indistinguishable once selected.
 *
 * This module is the missing layer: the exact region under the finger, named the way
 * an anatomy reference names it, plus what distinguishes that part from its neighbours.
 * The parent key still drives roles and evidence, which are catalogued per muscle
 * rather than per band.
 */

export type SubregionAnatomy = {
  /** The catalog key that owns this region, for role and evidence lookups. */
  parentKey: string;
  /** Full anatomical name of the muscle this region belongs to. */
  muscle: string;
  /** Which part of that muscle, or "" when the muscle is not subdivided here. */
  part: string;
  side: "left" | "right" | "";
  /** What sets this part apart from the rest of the muscle. */
  distinction?: string;
};

/**
 * The library's own names are informal ("Left Lats (Mid)") and in places imprecise.
 * These are the names and distinctions an athlete can act on.
 */
const back: Record<string, Omit<SubregionAnatomy, "side">> = {
  "traps-upper": { parentKey: "traps", muscle: "Trapezius", part: "Descending (upper) fibres", distinction: "Elevates the scapula and upwardly rotates it; the part loaded by shrugs and overhead carries." },
  "traps-mid": { parentKey: "traps", muscle: "Trapezius", part: "Transverse (middle) fibres", distinction: "Retracts the scapula. Overlies the rhomboids, which the chart cannot draw separately." },
  "traps-lower": { parentKey: "traps", muscle: "Trapezius", part: "Ascending (lower) fibres", distinction: "Depresses the scapula and assists upward rotation; the part most often underused." },
  "lats-upper": { parentKey: "lats", muscle: "Latissimus dorsi", part: "Upper (costal/scapular) fibres", distinction: "Runs closest to horizontal, so it contributes most to pulling the arm backward." },
  "lats-mid": { parentKey: "lats", muscle: "Latissimus dorsi", part: "Middle (thoracic) fibres", distinction: "The bulk of the muscle, running obliquely from the thoracolumbar fascia to the humerus." },
  "lats-lower": { parentKey: "lats", muscle: "Latissimus dorsi", part: "Lower (iliac) fibres", distinction: "Runs closest to vertical, so it contributes most to pulling the arm down from overhead." },
  "deltoid-rear": { parentKey: "rearDelts", muscle: "Deltoid", part: "Posterior (spinal) head", distinction: "Extends and externally rotates the shoulder. Covers the rotator cuff, which sits deep to it." },
  "triceps-long": { parentKey: "triceps", muscle: "Triceps brachii", part: "Long head", distinction: "The only head crossing the shoulder, so it also extends the arm at the shoulder." },
  "triceps-lateral": { parentKey: "triceps", muscle: "Triceps brachii", part: "Lateral head", distinction: "The most superficial head on the outside of the upper arm." },
  "lower-back-erectors": { parentKey: "lowerBack", muscle: "Erector spinae", part: "Lumbar portion", distinction: "The column either side of the spine that extends the trunk." },
  "lower-back-ql": { parentKey: "lowerBack", muscle: "Quadratus lumborum", part: "", distinction: "A separate deep muscle from the erectors: it side-bends the trunk and stabilises the twelfth rib." },
  "gluteus-maximus": { parentKey: "glutes", muscle: "Gluteus maximus", part: "", distinction: "The hip extensor; the largest muscle in the body." },
  "gluteus-medius": { parentKey: "abductors", muscle: "Gluteus medius", part: "", distinction: "Abducts the hip and keeps the pelvis level in single-leg stance." },
  "hamstrings-medial": { parentKey: "hamstrings", muscle: "Hamstrings", part: "Semitendinosus and semimembranosus", distinction: "The inner two; they also internally rotate the flexed knee." },
  "hamstrings-lateral": { parentKey: "hamstrings", muscle: "Biceps femoris", part: "Long and short heads", distinction: "The outer hamstring; it externally rotates the flexed knee." },
  "calves-gastroc-medial": { parentKey: "calves", muscle: "Gastrocnemius", part: "Medial head", distinction: "Crosses the knee as well as the ankle, so knee angle changes how it loads." },
  "calves-gastroc-lateral": { parentKey: "calves", muscle: "Gastrocnemius", part: "Lateral head", distinction: "Crosses the knee as well as the ankle, so knee angle changes how it loads." },
  "calves-soleus": { parentKey: "soleus", muscle: "Soleus", part: "", distinction: "Deep to the gastrocnemius and crosses only the ankle, so it works with the knee bent." },
  "forearm-flexors": { parentKey: "forearms", muscle: "Forearm flexor compartment", part: "", distinction: "Flexes the wrist and fingers; the grip muscles." },
  "forearm-extensors": { parentKey: "forearms", muscle: "Forearm extensor compartment", part: "", distinction: "Extends the wrist and fingers." },
};

const front: Record<string, Omit<SubregionAnatomy, "side">> = {
  "chest-upper": { parentKey: "chest", muscle: "Pectoralis major", part: "Clavicular (upper) head", distinction: "Runs upward to the collarbone, so inclined pressing loads it most." },
  "chest-lower": { parentKey: "chest", muscle: "Pectoralis major", part: "Sternocostal (lower) head", distinction: "The larger head, running from the sternum and ribs." },
  "shoulder-front": { parentKey: "frontDelts", muscle: "Deltoid", part: "Anterior (clavicular) head", distinction: "Flexes and internally rotates the shoulder." },
  "shoulder-side": { parentKey: "sideDelts", muscle: "Deltoid", part: "Lateral (acromial) head", distinction: "The pure abductor; the head that widens the shoulder." },
  "abs-upper": { parentKey: "abs", muscle: "Rectus abdominis", part: "Upper segments", distinction: "One muscle crossed by tendinous bands, not separate muscles." },
  "abs-lower": { parentKey: "abs", muscle: "Rectus abdominis", part: "Lower segments", distinction: "One muscle crossed by tendinous bands, not separate muscles." },
  obliques: { parentKey: "obliques", muscle: "External oblique", part: "", distinction: "Rotates and side-bends the trunk; overlies the internal oblique." },
  "serratus-anterior": { parentKey: "serratusAnterior", muscle: "Serratus anterior", part: "", distinction: "Protracts the scapula and holds it against the ribcage." },
  biceps: { parentKey: "biceps", muscle: "Biceps brachii", part: "", distinction: "Flexes the elbow and supinates the forearm; brachialis lies deep to it." },
  forearm: { parentKey: "forearms", muscle: "Forearm", part: "", distinction: "Flexor and extensor compartments together." },
  "hip-flexor": { parentKey: "hipFlexors", muscle: "Iliopsoas", part: "", distinction: "The deep hip flexor, from the lumbar spine and pelvis to the femur." },
  quads: { parentKey: "quads", muscle: "Quadriceps femoris", part: "", distinction: "Four heads; only rectus femoris also crosses the hip." },
  adductors: { parentKey: "adductors", muscle: "Hip adductors", part: "", distinction: "The inner-thigh group that draws the leg toward the midline." },
  "tibialis-anterior": { parentKey: "tibialis", muscle: "Tibialis anterior", part: "", distinction: "Dorsiflexes the ankle; the shin muscle." },
};

const anatomyByStem: Record<string, Omit<SubregionAnatomy, "side">> = { ...back, ...front };

/** Regions the chart draws that are landmarks rather than trainable muscles. */
const landmarks: Record<string, string> = {
  spine: "Vertebral column",
  nape: "Nape",
  "head-back": "Head",
  head: "Head",
};

/**
 * Splits a chart id into its stem and side. Ids are `<stem>-left` / `<stem>-right`,
 * except for a handful drawn as a single midline region.
 */
export function splitRegionId(id: string): { stem: string; side: "left" | "right" | "" } {
  if (id.endsWith("-left")) return { stem: id.slice(0, -"-left".length), side: "left" };
  if (id.endsWith("-right")) return { stem: id.slice(0, -"-right".length), side: "right" };
  return { stem: id, side: "" };
}

/** The precise anatomy of one chart region, or null when it is not a mapped muscle. */
export function describeSubregion(id: string): SubregionAnatomy | null {
  const { stem, side } = splitRegionId(id);
  const entry = anatomyByStem[stem];
  if (!entry) return null;
  return { ...entry, side };
}

/** Landmark name for a region that is not a trainable muscle, if it is one. */
export function landmarkName(id: string): string | null {
  const { stem } = splitRegionId(id);
  return landmarks[stem] ?? null;
}

const sideWord = { left: "Left", right: "Right", "": "" } as const;

/**
 * The label shown under the finger and in the selection strip.
 *
 * Reads "Latissimus dorsi · middle fibres · right" rather than the chart library's
 * "Right Lats (Mid)", so the three bands are told apart by what they are rather than
 * by an abbreviation.
 */
export function regionDisplayName(id: string, fallback = ""): string {
  const landmark = landmarkName(id);
  if (landmark) return landmark;
  const anatomy = describeSubregion(id);
  if (!anatomy) return fallback || id;
  const parts = [anatomy.muscle];
  if (anatomy.part) parts.push(anatomy.part.toLowerCase());
  if (anatomy.side) parts.push(sideWord[anatomy.side].toLowerCase());
  return parts.join(" · ");
}

/**
 * Catalog keys whose chart position is an approximation, and why.
 *
 * The chart has no path for these muscles, so they borrow the nearest region it does
 * draw. Saying so is the honest option: the alternative is an athlete reading a
 * highlighted posterior deltoid as their rotator cuff, which is a different muscle at
 * a different depth doing a different job.
 */
export const approximateRegionNotes: Record<string, string> = {
  rhomboids: "Shown on the middle trapezius, which covers the rhomboids. The rhomboids themselves lie deeper and are not drawn separately.",
  rotatorCuff: "Shown on the posterior deltoid. The cuff — supraspinatus, infraspinatus, teres minor and subscapularis — lies deep to the deltoid and around the shoulder blade, and is not drawn separately.",
  peroneals: "Shown on the lateral calf. The peroneals run in the lateral compartment alongside the gastrocnemius rather than within it.",
  brachialis: "Shown on the biceps, which covers it. The brachialis lies directly beneath and crosses only the elbow.",
  tfl: "Shown on the hip flexor region. The tensor fasciae latae sits further out on the side of the hip.",
  abductors: "Shown on the gluteus medius, the main hip abductor. The smaller gluteus minimus beneath it is not drawn separately.",
};
