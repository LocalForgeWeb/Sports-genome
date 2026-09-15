import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { searchEverything, searchSuggestions, type SearchResult } from "@/lib/universalSearch";
import { UNIVERSAL_SEARCH_OPEN_EVENT, type UniversalSearchOpenDetail } from "@/lib/universalSearchBus";

/**
 * The single entry the philosophy's "Universal search and retrieval contract"
 * (information_hierarchy, adopted, FIXED) requires:
 *
 *   "...retrieves canonical muscles, exercises, sports, Insights,
 *    workouts/programs, tests/measurements and metrics from one predictable
 *    entry. ... Results identify object type and disambiguating context ...
 *    Group mixed result types ... A selected result opens the canonical object
 *    and preserves return context. ... Empty results offer alias correction,
 *    broader scope or adjacent categories."
 *
 * Ranking and matching live in lib/universalSearch so they can be tested
 * against the contract directly; this file is only the surface.
 */

/** Singular type names, because a single row is one object, not a category. */
const RESULT_TYPE_BADGES: Record<SearchResult["type"], string> = {
  exercise: "Exercise",
  muscle: "Muscle",
  sport: "Sport",
  action: "Sport action",
  metric: "Metric",
  destination: "Screen",
};

/**
 * Information scent for the closed and empty states: the contract's promise is
 * only useful if the athlete can tell what the one entry covers.
 */
const SCOPE_HINT = "Muscles, exercises, sports, sport actions, strength records and screens.";

export function UniversalSearch({ onOpenResult }: { onOpenResult: (result: SearchResult) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const groups = useMemo(() => searchEverything(query), [query]);
  const flat = useMemo(() => groups.flatMap((group) => group.results), [groups]);
  const suggestions = useMemo(
    () => (query.trim().length >= 2 && !flat.length ? searchSuggestions(query) : []),
    [query, flat.length],
  );

  useEffect(() => { setActiveIndex(0); }, [query]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // The one predictable entry deserves a keyboard shortcut on desktop; on a
  // phone the trigger is the only way in, which is why it stays a real button.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A bounded local search can hand its query up here, which is how those
  // searches "offer broadening" without each one owning a sheet of its own.
  useEffect(() => {
    const onBroaden = (event: Event) => {
      setQuery((event as CustomEvent<UniversalSearchOpenDetail>).detail?.query || "");
      setOpen(true);
    };
    window.addEventListener(UNIVERSAL_SEARCH_OPEN_EVENT, onBroaden);
    return () => window.removeEventListener(UNIVERSAL_SEARCH_OPEN_EVENT, onBroaden);
  }, []);

  useEffect(() => {
    if (!open) return;
    const row = listRef.current?.querySelector<HTMLElement>(`#universal-search-result-${activeIndex}`);
    // Guarded: not every embedded WebView implements scrollIntoView on a button.
    row?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open]);

  // The sheet covers the page, so the page behind it must not scroll with it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    // Focus goes back where it came from rather than to the top of the document.
    triggerRef.current?.focus?.();
  };

  const choose = (result: SearchResult) => {
    close();
    onOpenResult(result);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { close(); return; }
    if (!flat.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % flat.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index - 1 + flat.length) % flat.length); }
    else if (event.key === "Enter") { event.preventDefault(); choose(flat[activeIndex] || flat[0]); }
  };

  let flatIndex = -1;

  return <>
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(true)}
      className="universal-search-trigger"
      aria-label="Search Sports Genome"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <span>Search</span>
    </button>

    {/* Portalled to the body: the topbar carries a backdrop-filter, which makes
        it the containing block for fixed-position descendants. Rendered in
        place, the scrim measured 51px tall and the results were invisible. */}
    {open && typeof document !== "undefined" && createPortal(<div className="universal-search-scrim" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="universal-search-sheet" role="dialog" aria-modal="true" aria-label="Search Sports Genome">
        <div className="universal-search-field">
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search muscles, exercises, sports…"
            aria-label="Search muscles, exercises, sports, sport actions, strength records and screens"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="universal-search-results"
            aria-activedescendant={flat.length ? `universal-search-result-${activeIndex}` : undefined}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" onClick={close} className="universal-search-close" aria-label="Close search"><X className="h-4 w-4" /></button>
        </div>

        <div className="universal-search-results" id="universal-search-results" ref={listRef} role="listbox" aria-label="Search results">
          {query.trim().length < 2 && <p className="universal-search-scope">{SCOPE_HINT}</p>}

          {groups.map((group) => <section key={group.type} className="universal-search-group">
            <h2 className="metric-label">{group.label}</h2>
            {group.results.map((result) => {
              flatIndex += 1;
              const index = flatIndex;
              return <button
                type="button"
                key={`${result.type}-${result.id}`}
                id={`universal-search-result-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`universal-search-result ${index === activeIndex ? "universal-search-result-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(result)}
              >
                <span className="universal-search-result-copy">
                  <strong>{result.label}</strong>
                  <small>{result.context}</small>
                </span>
                <span className="universal-search-result-type">{RESULT_TYPE_BADGES[result.type]}</span>
              </button>;
            })}
          </section>)}

          {query.trim().length >= 2 && !flat.length && <div className="universal-search-empty">
            <p>No match for “{query.trim()}”.</p>
            {suggestions.length
              ? <><p className="universal-search-scope">Did you mean:</p>
                  <div className="universal-search-suggestions">
                    {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>{suggestion}</button>)}
                  </div></>
              : <p className="universal-search-scope">{SCOPE_HINT}</p>}
          </div>}
        </div>

        <p className="universal-search-footer">Enter opens the result · Esc closes</p>
      </div>
    </div>, document.body)}
  </>;
}
