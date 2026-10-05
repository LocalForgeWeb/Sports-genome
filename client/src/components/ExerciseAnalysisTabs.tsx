import { useRef, type KeyboardEvent } from "react";
import { Activity, BrainCircuit, CircleGauge, Dna } from "lucide-react";

/**
 * The four views of an exercise's analysis, as one tab list.
 *
 * Kept apart from ExerciseGenomePanel so the Exercise intelligence sheet can
 * draw the list in its fixed header, above the one scrolling body, without
 * pulling the analysis model into the page's first chunk. The panel draws the
 * same list itself when it is used on its own.
 */
export type GenomeTab = "fingerprint" | "muscles" | "mechanics" | "context";

export const genomeTabs: { id: GenomeTab; label: string; icon: typeof Dna }[] = [
  { id: "fingerprint", label: "Fingerprint", icon: Dna },
  { id: "muscles", label: "Muscle Genome", icon: Activity },
  { id: "mechanics", label: "Mechanics", icon: CircleGauge },
  { id: "context", label: "Context", icon: BrainCircuit },
];

export const genomeTabId = (tab: GenomeTab) => `exercise-analysis-tab-${tab}`;
export const genomePanelId = (tab: GenomeTab) => `exercise-analysis-panel-${tab}`;

/**
 * Tabs in the ARIA pattern: one tab stop, arrow keys (and Home/End) move between
 * the views and show each as it is reached. On a narrow sheet the row scrolls
 * sideways rather than squeezing four labels until none can be read, and the
 * chosen tab is brought into view.
 */
export function ExerciseAnalysisTabs({ tab, onChange, className = "" }: { tab: GenomeTab; onChange: (tab: GenomeTab) => void; className?: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const choose = (next: GenomeTab, focus: boolean) => {
    onChange(next);
    const button = listRef.current?.querySelector<HTMLButtonElement>(`#${genomeTabId(next)}`);
    if (focus) button?.focus({ preventScroll: true });
    button?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = genomeTabs.findIndex((item) => item.id === tab);
    const last = genomeTabs.length - 1;
    const next = event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : -1;
    if (next < 0) return;
    event.preventDefault();
    choose(genomeTabs[next].id, true);
  };
  return <div ref={listRef} className={`ei-tabs ${className}`} role="tablist" aria-label="Exercise analysis views" onKeyDown={onKeyDown}>
    {genomeTabs.map((item) => {
      const Icon = item.icon;
      const selected = item.id === tab;
      return <button key={item.id} id={genomeTabId(item.id)} type="button" role="tab" aria-selected={selected} aria-controls={genomePanelId(item.id)} tabIndex={selected ? 0 : -1} className={`ei-tab ${selected ? "is-active" : ""}`} onClick={() => choose(item.id, false)}>
        <Icon className="h-4 w-4" aria-hidden="true" />{item.label}
      </button>;
    })}
  </div>;
}
