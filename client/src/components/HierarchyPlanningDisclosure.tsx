export function HierarchyPlanningDisclosure({ modifierLabel, movement, demands, physicalQualities, adaptations, modality, exerciseRole, programming }: { modifierLabel: string; movement: string; demands: string[]; physicalQualities: string[]; adaptations: string[]; modality: string; exerciseRole: string; programming: string }) {
  return <details className="mx-5 mt-4 border border-[#d9e2ec] bg-white px-4 py-3 text-[#24425d]" open>
    <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[.12em] text-[#2d6cdf]">Sport-to-program hierarchy / {modifierLabel}</summary>
    <p className="mt-3 text-xs leading-5"><strong>Movement:</strong> {movement}</p>
    <p className="mt-2 text-xs leading-5"><strong>Physiological demand:</strong> {demands.join(" · ")}</p>
    <p className="mt-2 text-xs leading-5"><strong>Physical quality:</strong> {physicalQualities.join(" · ")}</p>
    <p className="mt-2 text-xs leading-5"><strong>Adaptation target:</strong> {adaptations.join(" · ")}</p>
    <p className="mt-2 text-xs leading-5"><strong>Modality:</strong> {modality}</p>
    <p className="mt-2 text-xs leading-5"><strong>Exercise role:</strong> {exerciseRole}</p>
    <p className="mt-2 text-xs leading-5"><strong>Programming boundary:</strong> {programming}</p>
  </details>;
}
