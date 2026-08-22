import type { Exercise } from "@/lib/exerciseCatalog";
import { exerciseEvidenceCoverage } from "@/lib/evidenceCoverage";

export function CatalogExerciseEvidenceCard({ exercise }: { exercise: Exercise }) {
  const evidence = exerciseEvidenceCoverage(exercise);
  return (
    <section className="mt-5 border border-[#bcd1e6] bg-[#eef6ff] p-4 text-[#173f67]" aria-label="Study calibration for this catalog exercise">
      <p className="metric-label !text-[#2d6cdf]">Study calibration / catalog record</p>
      <p className="mt-2 text-xs font-bold leading-5">{evidence.sourceRange}</p>
      <p className="mt-2 text-xs leading-5"><strong>What the source supports:</strong> {evidence.directScope}</p>
      <p className="mt-2 text-xs leading-5"><strong>Boundary:</strong> {evidence.planningBoundary}</p>
    </section>
  );
}
