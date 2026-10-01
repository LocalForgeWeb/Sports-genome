import { useMemo, useState } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { ArrowRight, Heart, Plus, Search, SlidersHorizontal, Target, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { catalogFilterOptions, defaultCatalogFilters, type CatalogFilters, filterCatalogByActionLink, filterCatalogExercises } from "@/lib/catalogDiscovery";
import { suggestExerciseNames } from "@/lib/exerciseSearch";
import { muscleLabels } from "@/components/AnatomyMap";
import type { ExerciseActionConnection } from "@/lib/movementProgramAnalysis";
import { sharedConnectionSummary } from "@/lib/movementProgramAnalysis";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { labelTellsRowsApart } from "@/lib/pickerRowFacts";
import "@/catalog-discovery.css";

type CatalogDiscoveryPanelProps = {
  exercises: Exercise[];
  filters: CatalogFilters;
  favoriteIds: Set<number>;
  onFiltersChange: (next: CatalogFilters) => void;
  onToggleFavorite: (exercise: Exercise) => void;
  onInspect: (exercise: Exercise) => void;
  onAdd: (exercise: Exercise) => void;
  /** Exercises this device looked at lately, newest first; shown only while the list is unfiltered. */
  recentIds?: readonly number[];
  onClearRecent?: () => void;
  /** An exercise waiting for a second to compare with, named on the page so the wait is visible and cancellable. */
  comparePendingName?: string;
  onCancelCompare?: () => void;
  /** Where a plus puts the exercise, so the control says it: "Week 1 · Pull". */
  destinationLabel?: string;
  selectedActionLabel?: string;
  /** Where the action the links are measured against is changed: the Movement Atlas. */
  onChangeAction?: () => void;
  connectionForExercise?: (exercise: Exercise) => ExerciseActionConnection;
};

const visiblePerPage = 36;

/** The filters an athlete can take off one at a time, with the word each chip shows. */
const chipKeys = ["category", "movement", "equipment", "muscle", "actionLink"] as const;
const actionLinkLabel: Record<CatalogFilters["actionLink"], string> = { all: "All action links", direct: "Movement-specific", supporting: "Related or muscle support" };

/**
 * The catalog, one column: title and honest counts, search, the action the
 * links are measured against with a way to change it, the filters that are on
 * as chips that come off one at a time, Filter & sort, All exercises /
 * Favorites, then the exercises as open rows - title, movement, muscles, View
 * details, the catalog's tag, and favorite and add as two separate targets that
 * never open the row. The bordered grid of 36 cards is gone.
 */
export function CatalogDiscoveryPanel({ exercises, filters, favoriteIds, onFiltersChange, onToggleFavorite, onInspect, onAdd, recentIds = [], onClearRecent, comparePendingName, onCancelCompare, destinationLabel, selectedActionLabel, onChangeAction, connectionForExercise }: CatalogDiscoveryPanelProps) {
  const [visibleCount, setVisibleCount] = useState(visiblePerPage);
  const options = useMemo(() => catalogFilterOptions(exercises), [exercises]);
  const baseResults = useMemo(() => filterCatalogExercises(exercises, filters, favoriteIds), [exercises, filters, favoriteIds]);
  const results = useMemo(() => filterCatalogByActionLink(baseResults, filters.actionLink, connectionForExercise), [baseResults, connectionForExercise, filters.actionLink]);
  const visibleResults = results.slice(0, visibleCount);
  // Resolved once for the rows on screen, so the badge can be judged against
  // its neighbours rather than drawn unconditionally on each. In the default
  // view all 36 carried the same label; under a search they split, and there it
  // earns its place.
  const visibleConnections = useMemo(
    () => new Map(visibleResults.map((exercise) => [exercise.id, connectionForExercise?.(exercise)] as const)),
    [visibleResults, connectionForExercise],
  );
  const connectionTellsCardsApart = useMemo(
    () => labelTellsRowsApart(visibleResults.map((exercise) => visibleConnections.get(exercise.id)?.label ?? "Not mapped")),
    [visibleConnections, visibleResults],
  );
  const sharedConnection = useMemo(() => {
    if (connectionTellsCardsApart || !visibleResults.length) return null;
    const label = visibleConnections.get(visibleResults[0].id)?.label;
    return label ? sharedConnectionSummary(label, visibleResults.length) : null;
  }, [connectionTellsCardsApart, visibleConnections, visibleResults]);
  const update = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    setVisibleCount(visiblePerPage);
	    if (key !== "query") emitInteractionFeedback();
    onFiltersChange({ ...filters, [key]: value });
  };
	  const reset = () => { emitInteractionFeedback(); onFiltersChange(defaultCatalogFilters); };
  /** Clears the filters and keeps what was typed: a no-results state is not a reason to lose the query. */
  const clearFiltersKeepQuery = () => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); onFiltersChange({ ...defaultCatalogFilters, query: filters.query, favoritesOnly: filters.favoritesOnly }); };
  const activeChips = chipKeys.filter((key) => filters[key] !== "all").map((key) => ({
    key,
    label: key === "muscle" ? (muscleLabels[filters.muscle] || filters.muscle) : key === "actionLink" ? actionLinkLabel[filters.actionLink] : filters[key],
  }));
  const activeFilterCount = activeChips.length;
  // With nothing found: the nearest real names to what was typed, from the whole
  // catalog, so the empty state can point at something rather than only apologise.
  const listIsUnfiltered = !filters.query.trim() && !filters.favoritesOnly && activeFilterCount === 0;
  const recentExercises = useMemo(() => (listIsUnfiltered ? recentIds.map((id) => exercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is Exercise => Boolean(exercise)) : []), [listIsUnfiltered, recentIds, exercises]);
  const suggestions = useMemo(() => (results.length === 0 && filters.query.trim() ? suggestExerciseNames(exercises, filters.query) : []), [results.length, filters.query, exercises]);

  return <section className="catalog-discovery">
    <header className="catalog-discovery-heading">
      <div><h1>Exercise catalog</h1></div>
      {/* The count is the actual result set, against the catalog's actual size. */}
      <span>{filters.favoritesOnly ? `${results.length} ${results.length === 1 ? "favorite" : "favorites"}` : results.length === exercises.length ? `${exercises.length} exercises` : `${results.length} of ${exercises.length} exercises`}</span>
    </header>
    <div className="catalog-discovery-search"><Search className="h-4 w-4" aria-hidden="true" /><input value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder="Search exercises" aria-label="Search exercises" /></div>
    {comparePendingName && <p className="catalog-compare-pending" role="status"><span>Comparing <b>{comparePendingName}</b> · open another exercise and choose Compare.</span>{onCancelCompare && <button type="button" onClick={() => { emitInteractionFeedback(); onCancelCompare(); }}>Cancel</button>}</p>}
    {/* The scope line earns its place once there is a query to broaden; before that the heading's count says what is searched. */}
    {filters.query.trim() ? <LocalSearchScope scope={`Searching the ${exercises.length} exercises in this catalog.`} query={filters.query} /> : null}
    {selectedActionLabel ? <div className="catalog-discovery-context">
      <small className="catalog-discovery-action-scope"><Target className="h-3 w-3" aria-hidden="true" /> Action links below are measured against <b>{selectedActionLabel}</b>.{sharedConnection ? ` ${sharedConnection}` : ""}</small>
      {onChangeAction && <button type="button" className="catalog-discovery-change" onClick={() => { emitInteractionFeedback(); onChangeAction(); }}>Change <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
    </div> : null}
    <div className="catalog-discovery-toolbar">
      <div className="catalog-discovery-chips" aria-label="Filters on">
        {activeChips.map((chip) => <button type="button" key={chip.key} onClick={() => update(chip.key, "all" as never)} aria-label={`Remove filter ${chip.label}`}>{chip.label} <X className="h-3.5 w-3.5" aria-hidden="true" /></button>)}
      </div>
      <details className="catalog-discovery-controls">
        <summary><span><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filter & sort</span><small>{activeFilterCount ? `${activeFilterCount} active` : `All ${exercises.length} exercises`}</small></summary>
        <div className="catalog-discovery-filter-grid">
          <label><span>Category</span><select value={filters.category} onChange={(event) => update("category", event.target.value)}><option value="all">All categories</option>{options.categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Movement</span><select value={filters.movement} onChange={(event) => update("movement", event.target.value)}><option value="all">All movements</option>{options.movements.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Equipment</span><select value={filters.equipment} onChange={(event) => update("equipment", event.target.value)}><option value="all">All equipment</option>{options.equipment.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Muscle</span><select value={filters.muscle} onChange={(event) => update("muscle", event.target.value)}><option value="all">All muscles</option>{options.muscles.map((value) => <option key={value} value={value}>{muscleLabels[value] || value}</option>)}</select></label>
          {connectionForExercise ? <label><span>Action link</span><select value={filters.actionLink} onChange={(event) => update("actionLink", event.target.value as CatalogFilters["actionLink"])}><option value="all">All action links</option><option value="direct">{actionLinkLabel.direct}</option><option value="supporting">{actionLinkLabel.supporting}</option></select></label> : null}
          <button type="button" onClick={() => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); onFiltersChange({ ...defaultCatalogFilters, muscle: "serratusAnterior" }); }} className={`catalog-serratus-filter ${filters.muscle === "serratusAnterior" ? "catalog-serratus-filter-on" : ""}`} aria-pressed={filters.muscle === "serratusAnterior"}><Target className="h-3.5 w-3.5" aria-hidden="true" /> Serratus anterior</button>
          {(activeFilterCount || filters.query) ? <button type="button" onClick={reset} className="catalog-filter-reset"><X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters</button> : null}
        </div>
      </details>
    </div>
    <div className="catalog-discovery-tabs" role="tablist" aria-label="Catalog scope">
      <button type="button" role="tab" aria-selected={!filters.favoritesOnly} onClick={() => update("favoritesOnly", false)}>All exercises</button>
      <button type="button" role="tab" aria-selected={filters.favoritesOnly} className="catalog-favorites-filter" onClick={() => update("favoritesOnly", true)}>Favorites <b>{favoriteIds.size}</b></button>
    </div>
    {/* Recently viewed: separate from favourites and matches, only while the list is
        unfiltered, and gone the moment a query or filter is in play. An id that no
        longer names a catalog exercise is skipped. */}
    {recentExercises.length > 0 && <section className="catalog-recent" aria-label="Recently viewed">
      <div className="catalog-recent-head"><p className="metric-label">Recently viewed</p>{onClearRecent && <button type="button" onClick={() => { emitInteractionFeedback(); onClearRecent(); }}>Clear</button>}</div>
      <ul className="catalog-recent-row">{recentExercises.map((exercise) => <li key={exercise.id}><button type="button" onClick={() => { emitInteractionFeedback(); onInspect(exercise); }} aria-label={`View ${exercise.name} details`}>{exercise.name}</button></li>)}</ul>
    </section>}
    {results.length ? <div className="catalog-discovery-list">
      {visibleResults.map((exercise) => {
        const isFavorite = favoriteIds.has(exercise.id);
        const connection = visibleConnections.get(exercise.id);
        return <article key={exercise.id} className="catalog-discovery-card">
          <button type="button" onClick={() => { emitInteractionFeedback(); onInspect(exercise); }} className="catalog-discovery-card-copy" aria-label={`Inspect ${exercise.name}`}><span className="catalog-discovery-identity"><strong>{exercise.name}</strong><small>{exercise.movement}{exercise.equipment && !exercise.name.toLowerCase().includes(exercise.equipment.toLowerCase()) ? ` · ${exercise.equipment}` : ""}</small><em>{exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(" · ")}</em>{connectionTellsCardsApart && connection && connection.label !== "Not mapped" ? <b className={`catalog-action-link catalog-action-link-${connection.label.toLowerCase().replace(/\s+/g, "-")}`} title={connection.detail}>{connection.label}</b> : null}<span className="catalog-discovery-details">View details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span></span><span className="catalog-discovery-tier" title={`Catalog tag ${exercise.muscleGrade} — a label from the exercise catalog.`} aria-label={`Catalog tag ${exercise.muscleGrade}`}>{exercise.muscleGrade}</span></button>
          <div className="catalog-discovery-actions"><button type="button" onClick={() => { emitInteractionFeedback(); onToggleFavorite(exercise); }} className={isFavorite ? "catalog-favorite-on" : ""} aria-pressed={isFavorite} aria-label={`${isFavorite ? "Remove" : "Save"} ${exercise.name} ${isFavorite ? "from" : "to"} favorites`}><Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} /></button><button type="button" onClick={() => { emitInteractionFeedback(); onAdd(exercise); }} aria-label={`Add ${exercise.name} to ${destinationLabel ?? "the training day"}`}><Plus className="h-5 w-5" /></button></div>
        </article>;
      })}
    </div> : <div className="catalog-discovery-empty"><strong>{filters.favoritesOnly ? "No saved favorites yet." : filters.query ? `Nothing matches "${filters.query}"${activeFilterCount ? " with these filters" : ""}.` : "No exercises match these filters."}</strong><p>{filters.favoritesOnly ? "Use the heart on any exercise to save a personal shortlist." : activeFilterCount ? "Take a filter off, or try a broader movement, equipment or muscle term." : "Try a broader movement, equipment or muscle term."}</p><div>{suggestions.map((name) => <button type="button" key={name} onClick={() => update("query", name)}>Try “{name}”</button>)}{activeChips.map((chip) => <button type="button" key={chip.key} onClick={() => update(chip.key, "all" as never)}>Remove the {chip.label} filter</button>)}{activeFilterCount > 1 && <button type="button" onClick={clearFiltersKeepQuery}>Clear all filters</button>}{filters.query && <button type="button" onClick={() => update("query", "")}>Clear search</button>}{filters.favoritesOnly && <button type="button" onClick={() => update("favoritesOnly", false)}>Browse all exercises</button>}</div></div>}
    {results.length > visibleResults.length ? <button type="button" className="catalog-load-more" onClick={() => { emitInteractionFeedback(); setVisibleCount((count) => count + visiblePerPage); }}>Browse {Math.min(visiblePerPage, results.length - visibleResults.length)} more exercises <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : null}
  </section>;
}
