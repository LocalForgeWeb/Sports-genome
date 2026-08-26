export function ModifierEvidenceDisclosure({ modifierLabel, sources }: { modifierLabel: string; sources: string[] }) {
  return <details className="planning-evidence-card" aria-label="Active sport modifier evidence">
    <summary><span><strong>Evidence: reviewed</strong><small>{sources.length} source{sources.length === 1 ? "" : "s"} · {modifierLabel}</small></span><em>Sources</em></summary>
    <div>
      <p><strong>{modifierLabel}.</strong> These reviewed sources inform the selected planning context across recommendations, smart drafts, and generated weeks; they do not prescribe an individual program.</p>
      <p><strong>Sources:</strong> {sources.join(" · ")}</p>
    </div>
  </details>;
}
