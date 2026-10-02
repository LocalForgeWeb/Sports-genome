/** Kinetic Field Manual: compact grade stamps make athletic-fit reasoning easy to scan. */
import type { Grade } from "@/lib/exerciseCatalog";

const tones: Record<Grade, string> = {
  SS: "bg-[var(--sg-action-fill)] border-[var(--sg-action)]",
  S: "bg-[#f7cf6c] border-[#f7cf6c]",
  A: "bg-[#5d755c] border-[#5d755c]",
  B: "bg-[#dce1d8] border-[#dce1d8]",
  C: "bg-[#ece9e1] border-[#ece9e1]",
  D: "bg-white border-[#d8d9d3]",
  F: "bg-white border-[#e6e5df]",
};
/*
 * The letter's ink travels with the stamp's own ground, inline (Oct 2 brief §2).
 * A stamp is a <span>, and a dark sheet's `:is(p, small, span)` text rule
 * repainted it pale on its light tile; Tailwind's colour utilities sit in a
 * cascade layer that any unlayered rule outranks, so a class could not hold it.
 * D and F were lifted from #7a837d/#a1a5a1 (3.9:1 and 2.5:1 on white).
 */
const inks: Record<Grade, string> = { SS: "#ffffff", S: "#1c2937", A: "#ffffff", B: "#1c2937", C: "#3f4a52", D: "#4f5852", F: "#5c625d" };

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
      style={{ color: inks[grade] }}
      data-grade={grade}
    >
      {grade}
    </span>
  );
}
