/** Kinetic Field Manual: compact grade stamps make athletic-fit reasoning easy to scan. */
import type { Grade } from "@/lib/exerciseCatalog";

const tones: Record<Grade, string> = {
  SS: "bg-[var(--sg-action-fill)] text-white border-[var(--sg-action)]",
  S: "bg-[#f7cf6c] text-[#1c2937] border-[#f7cf6c]",
  A: "bg-[#5d755c] text-white border-[#5d755c]",
  B: "bg-[#dce1d8] text-[#1c2937] border-[#dce1d8]",
  C: "bg-[#ece9e1] text-[#53606a] border-[#ece9e1]",
  D: "bg-white text-[#7a837d] border-[#d8d9d3]",
  F: "bg-white text-[#a1a5a1] border-[#e6e5df]",
};

/**
 * The same letter scale carries more than one fact (the catalog tier, the
 * contextual fit, a muscle's involvement), so `label` names which one this is.
 */
export function GradeStamp({ grade, score, compact = false, label = "Catalog planning tier" }: { grade: Grade; score?: number; compact?: boolean; label?: string }) {
  const name = `${label} ${grade}`;
  return (
    <span
      role="img"
      aria-label={score ? `${name}, ${score} modelled overall match` : name}
      title={score ? `${name} · ${score} modelled overall match` : name}
      className={`inline-flex shrink-0 items-center justify-center border font-display font-bold leading-none ${compact ? "h-7 min-w-7 px-1 text-xs" : "h-10 min-w-10 px-2 text-lg"} ${tones[grade]}`}
    >
      {grade}
    </span>
  );
}
