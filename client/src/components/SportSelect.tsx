import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { SportProfile } from "@/lib/sportMovementDatabase";

/**
 * A searchable sport picker.
 *
 * Twenty sports as a grid of cards ran 1426px on a phone — the one step in
 * onboarding you could not answer without scrolling, and scrolling past
 * nineteen wrong answers to reach yours. A list you can type into finds a sport
 * in two keystrokes and finds it alphabetically when you would rather look.
 *
 * Built as a combobox rather than a native <select> because a native one cannot
 * carry a search field or the movement-family count, and because the same
 * control is wanted in the profile later. Keyboard behaviour follows the
 * listbox pattern: type to filter, arrows to move, Enter to choose, Escape to
 * close without changing anything.
 */
export function SportSelect({ sports, value, onChange, labelFor, placeholder = "Search or scroll to find your sport" }: {
  sports: SportProfile[];
  value: string;
  onChange: (sportId: string) => void;
  /** The display name, which may differ from the profile's own label. */
  labelFor: (sport: SportProfile) => string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  /** Alphabetical by what the athlete actually reads, not by the stored label. */
  const ordered = useMemo(
    () => [...sports].sort((a, b) => labelFor(a).localeCompare(labelFor(b), undefined, { sensitivity: "base" })),
    [sports, labelFor],
  );
  const matches = useMemo<{ sport: SportProfile; via?: string }[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ordered.map((sport) => ({ sport }));
    const byName = ordered.filter((sport) => labelFor(sport).toLowerCase().includes(term) || sport.label.toLowerCase().includes(term));
    // The family fallback needs a real word to be worth anything. Matching any
    // substring meant "ru" returned Rugby plus seven sports whose families merely
    // contain those letters — so it matches from a word boundary, and only once
    // the athlete has typed enough for that to mean something.
    if (term.length < 3) return byName.map((sport) => ({ sport }));
    const boundary = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    // A family match says why it is here. Searching "grappling" surfaces ice
    // hockey — which genuinely lists "contact and resisted grappling" while
    // wrestling calls the same thing a clinch — and with the reason shown that
    // reads as useful rather than as the app being wrong.
    const byFamily = ordered
      .filter((sport) => !byName.includes(sport))
      .map((sport) => ({ sport, via: sport.movementFamilies.find((family) => boundary.test(family.toLowerCase())) }))
      .filter((entry): entry is { sport: SportProfile; via: string } => Boolean(entry.via));
    return [...byName.map((sport) => ({ sport })), ...byFamily];
  }, [ordered, query, labelFor]);

  const selected = sports.find((sport) => sport.id === value);

  useEffect(() => { setActiveIndex(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Keep the highlighted row in view when arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    // Optional call: jsdom has no scrollIntoView, and neither do some embedded
    // webviews. Keeping the list still is a fine outcome; throwing is not.
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open]);

  const commit = (sport: SportProfile) => {
    onChange(sport.id);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { setOpen(false); setQuery(""); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!matches.length) return;
      setActiveIndex((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
      return;
    }
    if (event.key === "Enter" && matches[activeIndex]) { event.preventDefault(); commit(matches[activeIndex].sport); }
  };

  return <div className="athlete-sport-select" ref={rootRef}>
    <button
      type="button"
      className={`athlete-sport-trigger ${selected ? "is-chosen" : ""}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      onClick={() => setOpen((current) => !current)}
    >
      <span>
        <strong>{selected ? labelFor(selected) : "Choose your sport"}</strong>
        <small>{selected ? `${selected.movementFamilies.length} movement families` : `${sports.length} to pick from`}</small>
      </span>
      <ChevronDown className="athlete-sport-trigger-chevron h-5 w-5" aria-hidden="true" />
    </button>

    {open && <div className="athlete-sport-panel" onKeyDown={onKeyDown}>
      <div className="athlete-sport-search">
        <Search className="h-4 w-4" aria-hidden="true" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label="Search sports"
          aria-controls={listId}
          autoComplete="off"
        />
        {query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="Clear search"><X className="h-4 w-4" /></button>}
      </div>

      {matches.length ? <ul className="athlete-sport-options" role="listbox" id={listId} ref={listRef} aria-label="Sports">
        {matches.map(({ sport, via }, index) => <li key={sport.id}>
          <button
            type="button"
            role="option"
            data-index={index}
            aria-selected={sport.id === value}
            className={`athlete-sport-option ${index === activeIndex ? "is-active" : ""} ${sport.id === value ? "is-selected" : ""}`}
            onPointerEnter={() => setActiveIndex(index)}
            onClick={() => commit(sport)}
          >
            <span>
              <strong>{labelFor(sport)}</strong>
              <small>{via ? `Matches “${via}”` : `${sport.movementFamilies.length} movement families`}</small>
            </span>
            {sport.id === value && <Check className="h-4 w-4" aria-hidden="true" />}
          </button>
        </li>)}
      </ul> : <p className="athlete-sport-empty">No sport matches “{query.trim()}”. Try a shorter word, or scroll the full list.</p>}
    </div>}
  </div>;
}
