/**
 * Typed, catalog-id-keyed descriptions of an exercise's mechanics (50-exercise brief §4.1, §5).
 *
 * The Exercise Genome and the targeting model read an exercise's mechanics out of its name with
 * regular expressions. For the original 400 records that inference is the model, and it stays as
 * it is. For the expansion it was wrong often enough to be unusable: "Reverse Nordic Curl" took the
 * Nordic hamstring study, "Neck Extension" took the triceps-extension "shortened" curve, and a
 * sandbag "bear-hug" carry became Crawling. So every expansion record states its inputs here,
 * deliberately, and the engines read these instead of the name. The formulas that turn inputs
 * into scores are unchanged and live where they always have (exerciseGenome.ts,
 * muscleTargetingModel.ts); nothing here is a score.
 *
 * This is a schema extension on purpose, not a field the audited Exercise interface had.
 */
import { additionDescriptors } from "./exerciseCatalogAdditions";

export type ResistanceBias = "Lengthened" | "Mid-range" | "Shortened" | "Even" | "Isometric" | "Not established";

/** The predicates the fingerprint formula reads (exerciseGenome getFingerprint), stated rather than inferred. */
export type FingerprintPredicates = {
  /** Barbell, dumbbell, kettlebell, sandbag, trap bar or bodyweight: a load the athlete stabilises. */
  freeWeight: boolean;
  unilateral: boolean;
  ballistic: boolean;
  /** Clean/snatch/get-up class technical complexity. */
  complex: boolean;
  /** Equipment counted as a machine for the hypertrophy and practicality terms. */
  machine: boolean;
  /** Single-joint isolation (the fingerprint's "isolation" lift). */
  isolation: boolean;
  /** Heavy bar, trap bar, deadlift, squat or press pattern (the fingerprint's strength-pattern lift). */
  strengthPattern: boolean;
  /** Deep or overhead range (the fingerprint's mobility lift). */
  deepRange: boolean;
  /** Heavy axial pattern for the fatigue intermediate. */
  axialPattern: boolean;
  /** Bar, rack or sled setup cost for practicality. */
  rackCost: boolean;
};

/** The predicates the genome's fatigue and practicality fields read. */
export type GenomeTaskPredicates = {
  /** A grip-limited task (carries, deadlifts, rows, hangs). */
  gripTask: boolean;
  /** Spinal loading from the implement (squats, deadlifts, carries, overhead). */
  axialTask: boolean;
  /** Needs a lane or open floor (carries, sleds). */
  needsSpace: boolean;
  /** Needs equipment a home gym rarely has. */
  specialistEquipment: boolean;
};

/** The inputs the ten-factor targeting model reads (muscleTargetingModel), stated rather than inferred. */
export type TargetingPredicates = {
  forceVector: "cable" | "guided" | "gravity" | "band" | "self";
  unilateral: boolean;
  ballistic: boolean;
  eccentric: boolean;
  lengthened: boolean;
  /** Multi-joint pattern with a broad external moment (squat, hinge, press, row, lunge). */
  broadMoment: boolean;
  momentArm: "focused" | "compound" | "default";
  forceLength: "lengthened" | "shortened" | "default";
};

export type ExerciseDescriptor = {
  /** Catalog id; also the key. */
  id: number;
  /** The brief's candidate number, E01-E50. */
  candidate: string;
  /** The name the brief asked for, when the canonical name differs. */
  requestedName: string;
  /** The exact variation: setup, implement, path and finish. Shown on the exercise record. */
  setup: string;
  /** What the logged number means, shown where it is typed. */
  entryNote: string;
  /** What athletes call it; searched with the canonical name. */
  aliases: string[];
  /** How it differs from the catalog's closest existing records. */
  distinctFrom: string;
  movementPatterns: string[];
  jointActions: string[];
  forceDirection: string;
  chain: "Open" | "Closed" | "Mixed";
  stance: "Bilateral" | "Unilateral" | "Mixed";
  resistance: { bias: ResistanceBias; stickingRegion: string; peakRegion: string; curve: number[] };
  fingerprint: FingerprintPredicates;
  task: GenomeTaskPredicates;
  targeting: TargetingPredicates;
  /** The study-calibration record this exact variation may carry, or null for none. Never inferred from the name. */
  studyKey: string | null;
  /** What the attached study did not test about this variation, appended to its planning boundary. */
  studyQualification?: string;
  /** The named muscles behind each catalog key for this exercise ("forearms" -> "Pronator teres, pronator quadratus"). */
  anatomy: Record<string, string>;
  /** Supporting keys whose role is holding position, labelled Stabilizer rather than Synergist. */
  stabilizers: string[];
};

const byId = new Map<number, ExerciseDescriptor>(additionDescriptors.map((descriptor) => [descriptor.id, descriptor]));

/** The reviewed description of a catalog exercise, or undefined for an original record (which keeps name inference). */
export function descriptorFor(catalogExerciseId: number | null | undefined): ExerciseDescriptor | undefined {
  return catalogExerciseId == null ? undefined : byId.get(catalogExerciseId);
}

export const describedExerciseIds = (): number[] => Array.from(byId.keys());
