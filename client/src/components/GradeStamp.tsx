/** Kinetic Field Manual: compact grade stamps make athletic-fit reasoning easy to scan. */
import type { Grade } from "@/lib/exerciseCatalog";

const tones: Record<Grade, string> = {
  SS: "bg-[#e4512e] text-white border-[#e4512e]",
  S: "bg-[#f7cf6c] text-[#1c2937] border-[#f7cf6c]",
  A: "bg-[#5d755c] text-white border-[#5d755c]",
  B: "bg-[#dce1d8] text-[#1c2937] border-[#dce1d8]",
  C: "bg-[#ece9e1] text-[#53606a] border-[#ece9e1]",
  D: "bg-white text-[#7a837d] border-[#d8d9d3]",
  F: "bg-white text-[#a1a5a1] border-[#e6e5df]",
};

export function GradeStamp({ grade, compact = false }: { grade: Grade; compact?: boolean }) {
  return (
    <span
      aria-label={`Rating ${grade}`}
      className={`inline-flex shrink-0 items-center justify-center border font-display font-bold leading-none ${compact ? "h-7 min-w-7 px-1 text-xs" : "h-10 min-w-10 px-2 text-lg"} ${tones[grade]}`}
    >
      {grade}
    </span>
  );
}
