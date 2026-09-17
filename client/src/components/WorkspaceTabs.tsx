import { useCallback, useEffect, useRef, useState } from "react";

export type WorkspaceTab = { id: string; label: string };

/**
 * The contextual tab row, with its overflow made visible.
 *
 * The row scrolls horizontally and hides its own scrollbar, so on a phone the Train
 * group's six tabs simply ran off the edge with nothing to say they were there. The
 * only hint an athlete got was a tab clipped mid-word, and only if one happened to
 * land under the edge.
 *
 * Two fixes, both about the same thing - never hide a destination without saying so:
 * an edge fade appears on whichever side has more tabs, and the active tab is
 * scrolled into view, so arriving at an off-screen tab does not look like arriving
 * nowhere.
 */
export function WorkspaceTabs({ tabs, activeId, label, onSelect }: {
  tabs: readonly WorkspaceTab[];
  activeId: string;
  label: string;
  onSelect: (tab: WorkspaceTab) => void;
}) {
  const listRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const node = listRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    // A pixel of tolerance: sub-pixel layout leaves a residue that would otherwise
    // keep a fade permanently lit on a row that does not actually scroll.
    setEdges({ start: node.scrollLeft > 1, end: node.scrollLeft < maxScroll - 1 });
  }, []);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [measure, tabs.length]);

  // Arriving at a tab that sits off-screen should not look like arriving nowhere.
  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const active = node.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [activeId]);

  return (
    <div
      className="workspace-top-switcher-shell"
      data-overflow-start={edges.start ? "yes" : "no"}
      data-overflow-end={edges.end ? "yes" : "no"}
    >
      <nav className="workspace-top-switcher" aria-label={label} ref={listRef as React.RefObject<HTMLElement>}>
        {tabs.map(tab => {
          const active = tab.id === activeId;
          return <button
            type="button"
            key={tab.id}
            onClick={() => onSelect(tab)}
            aria-current={active ? "page" : undefined}
            className={active ? "workspace-top-switcher-active" : ""}
          >{tab.label}</button>;
        })}
      </nav>
    </div>
  );
}
