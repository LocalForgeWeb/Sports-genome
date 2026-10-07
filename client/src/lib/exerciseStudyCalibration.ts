import type { Exercise } from "./exerciseCatalog";
import { descriptorFor } from "./exerciseDescriptors";

export type ExerciseEvidenceKind = "Direct longitudinal adaptation" | "Biomechanics or transfer" | "Acute mechanics context";
export type StudyRangeOfMotion = "Full" | "Long-length partial" | "Short-length partial" | "Individualized" | "Setup-dependent" | "Not study-tagged";

export interface ExerciseStudyCalibration {
  key: string;
  label: string;
  kind: ExerciseEvidenceKind;
  summary: string;
  rangeOfMotion: StudyRangeOfMotion;
  comparisonRangeContexts?: StudyRangeOfMotion[];
  planningBoundary: string;
  sources: { label: string; url: string }[];
}

const pubmed = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const pmc = (id: string) => `https://pmc.ncbi.nlm.nih.gov/articles/${id}/`;

const calibrationRecords: ExerciseStudyCalibration[] = [
  {
    key: "seated-leg-curl",
    label: "Seated knee-flexion context",
    kind: "Direct longitudinal adaptation",
    summary: "Seated leg-curl training produced greater whole- and biarticular-hamstring volume gains than prone leg-curl training in the studied 12-week protocol.",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "This is a protocol- and population-specific growth finding, not a guarantee that seated curls are superior for every athlete or hamstring goal.",
    sources: [{ label: "Maeo et al., 2021 · MRI intervention", url: pubmed("33009197") }],
  },
  {
    key: "overhead-triceps-extension",
    label: "Overhead triceps length context",
    kind: "Direct longitudinal adaptation",
    summary: "Overhead elbow-extension training produced larger measured triceps gains, including the long head, than a neutral-arm comparator in the studied protocol.",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "The tag describes shoulder-position context and does not make an overhead variation mandatory or suitable for every shoulder.",
    sources: [{ label: "Maeo et al., 2023 · MRI intervention", url: pubmed("35819335") }],
  },
  {
    key: "standing-calf-raise",
    label: "Standing calf-raise gastrocnemius context",
    kind: "Direct longitudinal adaptation",
    summary: "Standing calf-raise training produced greater measured gastrocnemius and whole-triceps-surae growth than seated training; soleus growth was similar in the studied protocol.",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "This is a gastrocnemius-bias note, not evidence that seated calf work lacks value for soleus or every training plan.",
    sources: [{ label: "Kinoshita et al., 2023 · MRI intervention", url: pubmed("38156065") }],
  },
  {
    key: "squat-pattern",
    label: "Squat inclusion context",
    kind: "Direct longitudinal adaptation",
    summary: "Back squat and hip thrust training produced similar gluteal growth in one MRI intervention, while squats produced greater quadriceps and adductor growth.",
    rangeOfMotion: "Full",
    comparisonRangeContexts: ["Short-length partial"],
    planningBoundary: "Depth, bar position, hip strategy, loading, and individual anatomy shift demand; this is not a universal glute or quadriceps ranking.",
    sources: [
      { label: "Plotkin et al., 2023 · MRI intervention", url: pubmed("37877099") },
      { label: "Bloomquist et al., 2013 · squat ROM intervention", url: pubmed("23604798") },
      { label: "Larsen et al., 2025 · trained leg-press ROM counterevidence", url: pubmed("40113586") },
    ],
  },
  {
    key: "hip-thrust-pattern",
    label: "Hip-thrust mechanical context",
    kind: "Biomechanics or transfer",
    summary: "Hip thrust is a hip-extensor-dominant, horizontally loaded pattern. Direct training evidence supports glute growth comparable to squat in one MRI study, rather than universal superiority.",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "Acute gluteal EMG and modeled force are not used here as a hypertrophy ranking; strength change remains exercise-specific.",
    sources: [
      { label: "Plotkin et al., 2023 · MRI intervention", url: pubmed("37877099") },
      { label: "Brazil et al., 2021 · hip-thrust biomechanics", url: pubmed("33780488") },
    ],
  },
  {
    key: "nordic-hamstring",
    label: "Nordic hamstring pattern",
    kind: "Direct longitudinal adaptation",
    summary: "Nordic hamstring exercise is a knee-flexion, lengthened-eccentric hamstring pattern. A 9-week trial found a selective semitendinosus-volume increase, and prevention programs including Nordic work reduced hamstring-injury rates.",
    rangeOfMotion: "Long-length partial",
    planningBoundary: "Injury-prevention evidence applies to programs that include the exercise, not a promise of prevention for an individual or a dose prescription.",
    sources: [
      { label: "Selective hamstring adaptation RCT", url: pubmed("40586278") },
      { label: "Nordic-inclusion injury-prevention meta-analysis", url: pubmed("30808663") },
    ],
  },
  {
    key: "rdl-hinge",
    label: "Hip-hinge posterior-chain pattern",
    kind: "Acute mechanics context",
    summary: "Romanian and stiff-leg deadlift variants are hip-hinge/posterior-chain patterns. Available evidence includes selective regional response and acute excitation findings rather than a universal hamstring-growth rank.",
    rangeOfMotion: "Full",
    comparisonRangeContexts: ["Individualized"],
    planningBoundary: "Exercise names, technique, load, and individual response alter the distribution of posterior-chain demand; EMG is not used as a growth score.",
    sources: [
      { label: "Selective hamstring adaptation RCT", url: pubmed("40586278") },
      { label: "Deadlift-variant EMG systematic review", url: pubmed("32107499") },
    ],
  },
  {
    key: "leg-extension-rom",
    label: "Leg-extension ROM context",
    kind: "Direct longitudinal adaptation",
    summary: "Knee-extension research distinguishes full ROM from long-length and short-length partial-ROM conditions; regional results depend on the protocol, measurement site, and population.",
    rangeOfMotion: "Long-length partial",
    comparisonRangeContexts: ["Full", "Short-length partial"],
    planningBoundary: "The model lists the studied range contexts rather than declaring a universally superior partial range or a muscle-growth prescription.",
    sources: [
      { label: "Pedrosa et al., 2022 · knee-extension ROM intervention", url: pubmed("33977835") },
      { label: "Large full-ROM versus lengthened-partial trial", url: pubmed("41055237") },
    ],
  },
  {
    key: "leg-press-rom",
    label: "Leg-press individualized ROM context",
    kind: "Direct longitudinal adaptation",
    summary: "A trained-participant leg-press study found similar quadriceps-thickness gains between a fixed and an individualized deeper knee-flexion condition.",
    rangeOfMotion: "Individualized",
    comparisonRangeContexts: ["Full"],
    planningBoundary: "This counterevidence does not show that deeper or individualized ROM always changes hypertrophy; it is specific to the studied leg-press protocol and participants.",
    sources: [{ label: "Larsen et al., 2025 · trained leg-press ROM trial", url: pubmed("40113586") }],
  },
  {
    key: "bench-angle",
    label: "Bench-angle mechanical context",
    kind: "Acute mechanics context",
    summary: "Bench angle changes regional excitation and joint demands. Moderate incline can shift acute upper-pectoralis excitation, while higher inclines increase anterior-deltoid involvement in the studied setups.",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "This is a mechanical descriptor, not an EMG-derived hypertrophy rank or a universal optimal bench angle.",
    sources: [
      { label: "Bench-angle acute EMG study", url: pubmed("33049982") },
      { label: "Bench-press biomechanics", url: pubmed("33555823") },
      { label: "Regional pectoralis intervention", url: pubmed("36334406") },
    ],
  },
  {
    key: "machine-modality",
    label: "Machine modality context",
    kind: "Biomechanics or transfer",
    summary: "Machine and free-weight programs can produce similar hypertrophy when training variables are matched; strength improvements tend to be most specific to the trained modality.",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "Equipment category does not create a default muscle-growth advantage. Preference, access, stability needs, and test-specific transfer still matter.",
    sources: [
      { label: "Matched modality trial", url: pubmed("37535335") },
      { label: "Machine vs free-weight meta-analysis", url: pubmed("34609100") },
    ],
  },
  {
    key: "free-weight-modality",
    label: "Free-weight modality context",
    kind: "Biomechanics or transfer",
    summary: "Machine and free-weight programs can produce similar hypertrophy when training variables are matched; strength improvements tend to be most specific to the trained modality.",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "Free-weight status does not create a default muscle-growth advantage. Stability, skill, access, and task-specific transfer can still change exercise selection.",
    sources: [
      { label: "Matched modality trial", url: pubmed("37535335") },
      { label: "Machine vs free-weight meta-analysis", url: pubmed("34609100") },
    ],
  },
  // Records added for the 50-exercise expansion (6 Oct 2026 brief). Each is attached only to the
  // expansion record whose exact variation the sources tested, through its descriptor; none is
  // matched by name, so no original record changes. Sources were opened and read; the summaries
  // say what was measured and stop there (docs/exercise-expansion-v1/evidence.json).
  {
    key: "prone-leg-curl",
    label: "Prone one-leg curl context",
    kind: "Direct longitudinal adaptation",
    summary: "In a 12-week within-subject trial, the leg trained on a prone (lying) one-leg curl gained hamstring volume (+9% on MRI), less than the other leg trained on a seated curl (+14%).",
    rangeOfMotion: "Setup-dependent",
    planningBoundary: "Twenty young adults without recent training, 5 × 10 at 70% of 1RM twice a week; a protocol-specific comparison, not a ruling that the lying curl is a poor choice.",
    sources: [{ label: "Maeo et al., 2021 · MRI intervention (prone-leg condition)", url: pmc("PMC7969179") }],
  },
  {
    key: "trap-bar-deadlift",
    label: "Hexagonal-bar deadlift mechanics",
    kind: "Acute mechanics context",
    summary: "Proficient lifters lifted more, faster, with a hexagonal bar than a straight bar from the floor; EMG studies summarised in a 2020 review found more vastus lateralis and less erector spinae and biceps femoris activity with the hex bar.",
    rangeOfMotion: "Full",
    planningBoundary: "Acute bar mechanics and EMG in trained men; EMG is not used as a growth score, and straight-bar deadlift norms do not describe this lift.",
    sources: [
      { label: "Lake et al., 2017 · hex vs straight bar mechanics", url: pmc("PMC5969032") },
      { label: "Martín-Fuentes et al., 2020 · deadlift-variant EMG review", url: pmc("PMC7046193") },
    ],
  },
  {
    key: "sumo-deadlift",
    label: "Sumo deadlift mechanics",
    kind: "Acute mechanics context",
    summary: "At 85% of 1RM in 30 experienced men, the sumo deadlift produced larger knee-extension and hip-adduction moments than the conventional deadlift, which produced larger hip-extension moments; an earlier EMG study found more vastus activity in sumo.",
    rangeOfMotion: "Full",
    planningBoundary: "Joint moments and EMG from trained men; the larger adduction moment does not show the adductors are a primary force producer, and it is not a hypertrophy ranking.",
    sources: [
      { label: "Frontiers in Bioengineering, 2025 · sumo vs conventional kinetics and EMG", url: pmc("PMC12148905") },
      { label: "Martín-Fuentes et al., 2020 · deadlift-variant EMG review", url: pmc("PMC7046193") },
    ],
  },
  {
    key: "safety-bar-squat",
    label: "Safety-bar squat mechanics",
    kind: "Acute mechanics context",
    summary: "Against high- and low-bar squats at 3RM, the safety-bar squat was done with less load, a more upright torso and a larger knee-extension moment than the low-bar squat; at the same absolute load, peak force and effort matched an Olympic bar.",
    rangeOfMotion: "Full",
    planningBoundary: "Acute comparisons in recreationally trained adults; back-squat norms are not measures of this bar, and EMG findings between studies conflict.",
    sources: [
      { label: "Kristiansen et al., 2021 · safety, high- and low-bar squat biomechanics", url: pmc("PMC8392107") },
      { label: "International Journal of Exercise Science, 2024 · safety vs Olympic bar", url: pmc("PMC11385282") },
    ],
  },
  {
    key: "reverse-nordic",
    label: "Reverse Nordic training context",
    kind: "Biomechanics or transfer",
    summary: "Eight weeks of bodyweight reverse Nordic training improved sprint, change-of-direction and jump tests against controls in youth karate athletes; muscle size was not measured.",
    rangeOfMotion: "Individualized",
    planningBoundary: "Twenty-seven youth athletes and field tests only: a transfer finding, not evidence of quadriceps growth, and not the Nordic hamstring curl's evidence.",
    sources: [{ label: "J Funct Morphol Kinesiol, 2024 · reverse Nordic training in youth karate", url: pmc("PMC11676464") }],
  },
  {
    key: "suitcase-carry",
    label: "Suitcase carry trunk activity",
    kind: "Acute mechanics context",
    summary: "During a one-dumbbell suitcase carry, the external oblique, longissimus and multifidus opposite the load were the most active trunk muscles, well above the same-side muscles; strongman data show the same opposite-side pattern.",
    rangeOfMotion: "Not study-tagged",
    planningBoundary: "Acute surface EMG from one 25 m carry in college-aged adults: it shows which side works, not a training effect or a load to use.",
    sources: [
      { label: "Ellestad et al., 2024 · loaded-carry EMG", url: pmc("PMC11042841") },
      { label: "Hindle et al., 2019 · strongman biomechanics review (McGill 2009 suitcase carry)", url: pmc("PMC6901656") },
    ],
  },
];

const byKey = (key: string) => calibrationRecords.find((record) => record.key === key) || null;

/**
 * The study context an exercise may carry.
 *
 * Expansion records (ids 401 on) state theirs in their descriptor, deliberately, with what the
 * study did not test appended to its planning boundary; nothing is attached to them by name. The
 * original records keep the name rules below, with two corrections (50-exercise brief §5):
 * - "Reverse Nordic" is a lengthened quadriceps exercise, so it no longer takes the Nordic
 *   hamstring study just because the word appears;
 * - the seated leg-curl study is found whichever order the name puts "seated" and "leg curl" in.
 */
export function getExerciseStudyCalibration(exercise: Exercise): ExerciseStudyCalibration | null {
  const descriptor = descriptorFor(exercise.id);
  if (descriptor) {
    const record = descriptor.studyKey ? byKey(descriptor.studyKey) : null;
    if (!record || !descriptor.studyQualification) return record;
    return { ...record, planningBoundary: `${record.planningBoundary} ${descriptor.studyQualification}` };
  }
  const text = `${exercise.name} ${exercise.movement} ${exercise.equipment}`.toLowerCase();
  if (/seated.*leg curl|leg curl.*seated/.test(text)) return byKey("seated-leg-curl");
  if (/\bnordic\b/.test(text) && !/\breverse nordic\b/.test(text)) return byKey("nordic-hamstring");
  if (/romanian|\brdl\b|stiff.?leg deadlift/.test(text)) return byKey("rdl-hinge");
  if (/overhead.*(triceps|extension)|(triceps|extension).*overhead/.test(text)) return byKey("overhead-triceps-extension");
  if (/standing.*calf/.test(text)) return byKey("standing-calf-raise");
  if (/hip thrust/.test(text)) return byKey("hip-thrust-pattern");
  if (/leg extension/.test(text)) return byKey("leg-extension-rom");
  if (/leg press/.test(text)) return byKey("leg-press-rom");
  if (/squat/.test(text)) return byKey("squat-pattern");
  if (/bench press/.test(text)) return byKey("bench-angle");
  if (exercise.equipment === "Machine") return byKey("machine-modality");
  if (["Barbell", "Dumbbells", "Kettlebell", "Free weights"].includes(exercise.equipment)) return byKey("free-weight-modality");
  return null;
}

/** Every calibration record's key, for the validator that checks descriptors name real ones. */
export const studyCalibrationKeys = (): string[] => calibrationRecords.map((record) => record.key);
