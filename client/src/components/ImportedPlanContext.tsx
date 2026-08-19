/** Kinetic Field Manual: preserves non-exercise instructions from a pasted plan outside the exercise stack. */
import { ClipboardList } from "lucide-react";
import type { ImportedRoutineContext } from "@/components/StackImportPanel";

export function ImportedPlanContext({ items }: { items: ImportedRoutineContext[] }) {
  if (!items.length) return null;
  return <section className="imported-context-panel" aria-label="Imported plan context"><div><p className="metric-label">Imported plan context</p><h3><ClipboardList className="h-4 w-4" /> Kept separate from exercises</h3></div><div>{items.map((item, index) => <article key={`${item.raw}-${index}`}><span>{item.kind}</span><p>{item.raw}</p></article>)}</div></section>;
}
