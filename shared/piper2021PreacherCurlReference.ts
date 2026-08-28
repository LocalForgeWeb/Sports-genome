export const piper2021PreacherCurlReferenceId = "piper_2021_preacher_curl_10rm";

export type Piper2021PreacherCurlContext = {
  exerciseName: string;
  measurementType: string;
  repetitions?: number | null;
  loadLb?: number | null;
  bodyMassLb?: number | null;
  sex?: "male" | "female" | "intersex" | "self_described" | "prefer_not_to_say";
  ageYears?: number | null;
  collegeStudentConfirmed?: boolean;
  preTrainingConfirmed?: boolean;
  exactProtocolConfirmed?: boolean;
  directlyObservedConfirmed?: boolean;
};

export type Piper2021ReferenceResult =
  | { status: "unavailable"; missing: string[] }
  | { status: "matched"; bodyMassBand: string; comparison: string; sourceLabel: string };

type Band = { label: string; max?: number; min?: number; cutPoints: readonly [number, number, number, number, number, number, number, number, number, number, number] };

const bands: readonly Band[] = [
  { label: "≤135 lb", max: 135, cutPoints: [30, 40, 40, 41.5, 50, 50, 50, 58.5, 64, 70, 70] },
  { label: "135.1–150 lb", min: 135.1, max: 150, cutPoints: [40, 40, 45, 50, 50, 55, 60, 60, 70, 70, 74.5] },
  { label: "150.1–165 lb", min: 150.1, max: 165, cutPoints: [40, 40, 50, 55, 60, 60, 65, 70, 70, 75, 80] },
  { label: "165.1–190 lb", min: 165.1, max: 190, cutPoints: [40, 45, 50, 60, 60, 65, 70, 70, 75, 85, 90] },
  { label: "190.1–210 lb", min: 190.1, max: 210, cutPoints: [45, 50, 60, 62.5, 70, 70, 75, 75, 80, 90, 96.25] },
  { label: "210.1–240 lb", min: 210.1, max: 240, cutPoints: [41.5, 50, 60, 60, 65, 70, 70, 75, 80, 90, 103.5] },
  { label: "240.1–270 lb", min: 240.1, max: 270, cutPoints: [40, 50, 60, 64.5, 70, 70, 74, 75, 85, 95, 103.5] },
  { label: "≥270.1 lb", min: 270.1, cutPoints: [41.75, 45, 60, 70, 70, 70, 75, 79.5, 90, 110, 110] },
];
const percentiles = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const;

export function getPiper2021PreacherCurlReference(context: Piper2021PreacherCurlContext): Piper2021ReferenceResult {
  const missing: string[] = [];
  if (context.sex !== "male") missing.push("adult male source population");
  if (!context.ageYears || context.ageYears < 18 || context.ageYears > 25) missing.push("age 18–25");
  if (!context.collegeStudentConfirmed) missing.push("college-student source population confirmation");
  if (!context.preTrainingConfirmed) missing.push("pre-training condition confirmation");
  if (!context.exactProtocolConfirmed) missing.push("Body Masters BE 207 / 22 lb York EZ-bar protocol confirmation");
  if (!context.directlyObservedConfirmed) missing.push("directly observed 10RM confirmation");
  if (context.exerciseName !== "Preacher Curl") missing.push("selected preacher-curl test");
  if (context.measurementType !== "MULTI_REP" || context.repetitions !== 10) missing.push("directly observed 10RM");
  if (!context.loadLb || context.loadLb < 0) missing.push("test load");
  if (!context.bodyMassLb || context.bodyMassLb <= 0) missing.push("test-day body mass");
  if (missing.length) return { status: "unavailable", missing };
  const band = bands.find((candidate) => (candidate.min == null || context.bodyMassLb! >= candidate.min) && (candidate.max == null || context.bodyMassLb! <= candidate.max))!;
  const firstAbove = band.cutPoints.findIndex((cutPoint) => context.loadLb! < cutPoint);
  const comparison = firstAbove === 0 ? "Below the source sample’s 5th-percentile cut point" : firstAbove === -1 ? "At or above the source sample’s 95th-percentile cut point" : `Between the source sample’s ${percentiles[firstAbove - 1]}th and ${percentiles[firstAbove]}th percentile cut points`;
  return { status: "matched", bodyMassBand: band.label, comparison, sourceLabel: "Piper et al. 2021 pre-training college-aged male preacher-curl 10RM reference" };
}
