import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { searchAliasesFor } from "@/lib/muscleVocabulary";
// The listbox styling this shares with SportSelect lives there. Imported
// rather than assumed: the bundle happens to carry it today because the quiz
// is in it, which is not a thing to depend on.
import "@/athlete-baseline-quiz.css";

/**
 * A searchable muscle filter.
 *
 * It was a native <select> of twenty-six muscles in catalog-key order, which
 * reads as no order at all: "Hip abductors, Rectus abdominis, Hip adductors,
 * Biceps brachii" is `abductors, abs, adductors, biceps`, alphabetical to the
 * code and arbitrary to the athlete. A native select cannot be typed into, so
 * finding one muscle meant scrolling a scrambled list on a phone.
 *
 * Built on the same listbox pattern as SportSelect, and sharing its styles: type
 * to filter, arrows to move, Enter to choose, Escape to close without changing
 * anything. It also answers to the names the rest of the app uses - typing
 * "rhomboid" finds Upper back, which is what the catalog tags the rows that
 * train them - so a muscle the app can tell you you are short of is a muscle you
 * can type in here.
 */
export function MuscleSelect({ muscles, value, labelFor, onChange, allLabel = "All muscle groups" }: {
  muscles: readonly string[];
  value: string;
  labelFor: (muscle: string) => string;
  onChange: (muscle: string) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  type Option = { key: string; label: string; via?: string };
  const options = useMemo<Option[]>(
    () => [{ key: "all", label: allLabel }, ...muscles.map((key) => ({ key, label: labelFor(key) }))],
    [muscles, labelFor, allLabel],
  );

  const matches = useMemo<Option[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    const byLabel = options.filter((option) => option.label.toLowerCase().includes(term));
    // The names the app uses elsewhere. An athlete told they are short of
    // rhomboids types "rhomboid"; the catalog calls that region Upper back, and
    // the row says which name it answered to so the jump is not a surprise.
    const byAlias = options
      .filter((option) => !byLabel.includes(option))
      .map((option) => ({ ...option, via: searchAliasesFor(option.key).find((alias) => alias.toLowerCase().includes(term)) }))
      .filter((option): option is Option & { via: string } => Boolean(option.via));
    return [...byLabel, ...byAlias];
  }, [options, query]);

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

  useEffect(() => {
    if (!open) return;
    // Optional call: jsdom has no scrollIntoView, and neither do some embedded
    // webviews. A still list is a fine outcome; throwing is not.
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open]);

  const commit = (option: Option) => {
    onChange(option.key);
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
    if (event.key === "Enter" && matches[activeIndex]) { event.preventDefault(); commit(matches[activeIndex]); }
  };

  const selected = options.find((option) => option.key === value);

  return <div className="athlete-sport-select muscle-select" ref={rootRef}>
    <button
      type="button"
      className={`athlete-sport-trigger ${value !== "all" ? "is-chosen" : ""}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-label="Filter day exercises by muscle group"
      onClick={() => setOpen((current) => !current)}
    >
      <span><strong>{selected?.label ?? labelFor(value)}</strong></span>
      <ChevronDown className="athlete-sport-trigger-chevron h-5 w-5" aria-hidden="true" />
    </button>

    {open && <div className="athlete-sport-panel" onKeyDown={onKeyDown}>
      <div className="athlete-sport-search">
        <Search className="h-4 w-4" aria-hidden="true" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search muscles"
          aria-label="Search muscles"
          aria-controls={listId}
          autoComplete="off"
        />
        {query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="Clear search"><X className="h-4 w-4" /></button>}
      </div>

      {matches.length ? <ul className="athlete-sport-options" role="listbox" id={listId} ref={listRef} aria-label="Muscle groups">
        {matches.map((option, index) => <li key={option.key}>
          <button
            type="button"
            role="option"
            data-index={index}
            aria-selected={option.key === value}
            className={`athlete-sport-option ${index === activeIndex ? "is-active" : ""} ${option.key === value ? "is-selected" : ""}`}
            onPointerEnter={() => setActiveIndex(index)}
            onClick={() => commit(option)}
          >
            <span><strong>{option.label}</strong>{option.via && <small>Also called {option.via}</small>}</span>
          </button>
        </li>)}
      </ul> : <p className="athlete-sport-empty">No muscle matches “{query}”.</p>}
    </div>}
  </div>;
}
