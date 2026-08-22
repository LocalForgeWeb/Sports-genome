import type { Exercise } from "./exerciseCatalog";

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
];

export function getExerciseStudyCalibration(exercise: Exercise): ExerciseStudyCalibration | null {
  const text = `${exercise.name} ${exercise.movement} ${exercise.equipment}`.toLowerCase();
  if (/seated.*leg curl/.test(text)) return calibrationRecords.find((record) => record.key === "seated-leg-curl") || null;
  if (/nordic/.test(text)) return calibrationRecords.find((record) => record.key === "nordic-hamstring") || null;
  if (/romanian|\brdl\b|stiff.?leg deadlift/.test(text)) return calibrationRecords.find((record) => record.key === "rdl-hinge") || null;
  if (/overhead.*(triceps|extension)|(triceps|extension).*overhead/.test(text)) return calibrationRecords.find((record) => record.key === "overhead-triceps-extension") || null;
  if (/standing.*calf/.test(text)) return calibrationRecords.find((record) => record.key === "standing-calf-raise") || null;
  if (/hip thrust/.test(text)) return calibrationRecords.find((record) => record.key === "hip-thrust-pattern") || null;
  if (/leg extension/.test(text)) return calibrationRecords.find((record) => record.key === "leg-extension-rom") || null;
  if (/leg press/.test(text)) return calibrationRecords.find((record) => record.key === "leg-press-rom") || null;
  if (/squat/.test(text)) return calibrationRecords.find((record) => record.key === "squat-pattern") || null;
  if (/bench press/.test(text)) return calibrationRecords.find((record) => record.key === "bench-angle") || null;
  if (exercise.equipment === "Machine") return calibrationRecords.find((record) => record.key === "machine-modality") || null;
  if (["Barbell", "Dumbbells", "Kettlebell", "Free weights"].includes(exercise.equipment)) return calibrationRecords.find((record) => record.key === "free-weight-modality") || null;
  return null;
}
