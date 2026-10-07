import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
import { UtilitySheet } from "@/components/UtilitySheet";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { UNIVERSAL_SEARCH_OPEN_EVENT } from "@/lib/universalSearchBus";
import { trainingGlossary } from "@/lib/trainingGlossary";
import { glossaryGroups, searchGlossary, type GlossaryEntry } from "@/lib/glossarySearch";

/**
 * Training terms: short, searchable explanations of the words Sports Genome uses, each saying
 * what the term means, an example, how this app uses it, and - where people often read it
 * differently - what it doesn't mean. Opened from Guides & research, from search, or straight
 * to one term; closing returns to wherever it was opened from, as it was.
 */
export function TrainingTermsSheet({ termId, onClose }: { termId?: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(() => (termId && trainingGlossary.some((entry) => entry.id === termId) ? termId : null));
  const results = useMemo(() => searchGlossary(trainingGlossary, query), [query]);
  const open = openId ? trainingGlossary.find((entry) => entry.id === openId) ?? null : null;
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const backRef = useRef<HTMLButtonElement>(null);
  const lastOpened = useRef<string | null>(null);

  // Broadening hands the query to the app's search, which takes over from this sheet.
  useEffect(() => {
    window.addEventListener(UNIVERSAL_SEARCH_OPEN_EVENT, onClose);
    return () => window.removeEventListener(UNIVERSAL_SEARCH_OPEN_EVENT, onClose);
  }, [onClose]);

  useEffect(() => {
    if (open) { lastOpened.current = open.id; backRef.current?.focus({ preventScroll: true }); }
    // Back from a term puts focus on that term's row, where the reader was.
    else if (lastOpened.current) rowRefs.current.get(lastOpened.current)?.focus({ preventScroll: true });
  }, [open]);

  return <UtilitySheet eyebrow="Guides & research" title="Training terms" labelId="training-terms-title" onClose={onClose} wide>
    <div className="stp-body gl-body">
      {open ? <TermDetail entry={open} backRef={backRef} onBack={() => setOpenId(null)} onOpen={setOpenId} /> : <>
        <label className="ut-field gl-search"><span className="sr-only">Search training terms</span><span className="ut-input-unit"><Search className="h-5 w-5" aria-hidden="true" /><input type="search" value={query} placeholder="Search terms, e.g. RPE or e1RM" aria-label="Search training terms" autoComplete="off" onChange={(event) => setQuery(event.target.value)} /></span></label>
        <LocalSearchScope scope="Searches the training terms only." query={query} />
        <p className="ut-status" role="status" aria-live="polite">{query.trim() ? `${results.length} term${results.length === 1 ? "" : "s"}` : `${trainingGlossary.length} terms`}</p>
        {results.length === 0 ? <p className="ut-empty">No term matches “{query.trim()}”. Try a shorter word, or an abbreviation such as RPE.</p>
          : query.trim() ? <ul className="gl-list">{results.map((entry) => <TermRow key={entry.id} entry={entry} rowRefs={rowRefs} onOpen={setOpenId} showGroup />)}</ul>
          : glossaryGroups.map((group) => {
            const inGroup = results.filter((entry) => entry.group === group);
            return inGroup.length ? <section key={group} className="gl-group" aria-labelledby={`gl-group-${group.replace(/\s+/g, "-")}`}>
              <h3 id={`gl-group-${group.replace(/\s+/g, "-")}`} className="stp-eyebrow">{group}</h3>
              <ul className="gl-list">{inGroup.map((entry) => <TermRow key={entry.id} entry={entry} rowRefs={rowRefs} onOpen={setOpenId} />)}</ul>
            </section> : null;
          })}
      </>}
    </div>
  </UtilitySheet>;
}

function TermRow({ entry, rowRefs, onOpen, showGroup = false }: { entry: GlossaryEntry; rowRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>; onOpen: (id: string) => void; showGroup?: boolean }) {
  return <li><button type="button" className="gl-row" ref={(node) => { if (node) rowRefs.current.set(entry.id, node); else rowRefs.current.delete(entry.id); }} onClick={() => onOpen(entry.id)}>
    <span><b>{entry.term}</b><small>{showGroup ? `${entry.group} · ` : ""}{entry.meaning}</small></span>
    <ChevronRight className="h-5 w-5" aria-hidden="true" />
  </button></li>;
}

function TermDetail({ entry, backRef, onBack }: { entry: GlossaryEntry; backRef: React.RefObject<HTMLButtonElement | null>; onBack: () => void; onOpen: (id: string) => void }) {
  return <article className="gl-detail" aria-labelledby="gl-term-title">
    <button ref={backRef} type="button" className="ut-link gl-back" onClick={onBack}><ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />All terms</button>
    <p className="stp-eyebrow">{entry.group}</p>
    <h3 id="gl-term-title" className="gl-term">{entry.term}</h3>
    <p className="gl-meaning">{entry.meaning}</p>
    <dl className="gl-facts">
      <div><dt>Example</dt><dd>{entry.example}</dd></div>
      <div><dt>In Sports Genome</dt><dd>{entry.inApp}</dd></div>
      {entry.misread && <div><dt>Often read as</dt><dd>{entry.misread}</dd></div>}
    </dl>
    {entry.sources && entry.sources.length > 0 && <details className="ut-disclosure"><summary>Sources <small>{entry.sources.length}</small></summary><ul className="gl-sources">{entry.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" /></a></li>)}</ul></details>}
  </article>;
}
