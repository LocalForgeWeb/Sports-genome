export function HierarchyPlanningDisclosure({ modifierLabel, movement, demands, physicalQualities, adaptations, modality, exerciseRole, programming }: { modifierLabel: string; movement: string; demands: string[]; physicalQualities: string[]; adaptations: string[]; modality: string; exerciseRole: string; programming: string }) {
  return <details className="planning-disclosure-card">
    <summary>
      <span><strong>Program lens</strong><small>{movement} · {physicalQualities.slice(0, 2).join(" · ")}</small></span>
      <em>View methodology</em>
    </summary>
    <div className="planning-disclosure-detail">
      <p className="metric-label">Sport-to-program hierarchy / {modifierLabel}</p>
      <p><strong>Movement:</strong> {movement}</p>
      <p><strong>Physiological demand:</strong> {demands.join(" · ")}</p>
      <p><strong>Physical quality:</strong> {physicalQualities.join(" · ")}</p>
      <p><strong>Adaptation target:</strong> {adaptations.join(" · ")}</p>
      <p><strong>Modality:</strong> {modality}</p>
      <p><strong>Exercise role:</strong> {exerciseRole}</p>
      <p><strong>Programming boundary:</strong> {programming}</p>
    </div>
  </details>;
}
