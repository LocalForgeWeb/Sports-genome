export function ModifierEvidenceDisclosure({ modifierLabel, sources }: { modifierLabel: string; sources: string[] }) {
  return <section className="mx-5 mt-4 border-l-2 border-[#2d6cdf] bg-[#eef6ff] px-4 py-3 text-[#173f67]" aria-label="Active sport modifier evidence">
    <p className="metric-label !text-[#2d6cdf]">Active sport modifier evidence</p>
    <p className="mt-1 text-xs leading-5"><strong>{modifierLabel}.</strong> These reviewed sources inform the selected planning context across recommendations, smart drafts, and generated weeks; they do not prescribe an individual program.</p>
    <p className="mt-2 text-[11px] leading-5 text-[#476b8e]"><strong>Sources:</strong> {sources.join(" · ")}</p>
  </section>;
}
