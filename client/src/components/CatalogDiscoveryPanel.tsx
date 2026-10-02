import { useMemo, useState } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { ArrowRight, ChevronDown, Heart, Plus, Search, SlidersHorizontal, Target, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { catalogFilterOptions, defaultCatalogFilters, type CatalogFilters, filterCatalogByActionLink, filterCatalogExercises } from "@/lib/catalogDiscovery";
import { suggestExerciseNames } from "@/lib/exerciseSearch";
import { muscleLabels } from "@/components/AnatomyMap";
import type { ExerciseActionConnection } from "@/lib/movementProgramAnalysis";
import { sharedConnectionSummary } from "@/lib/movementProgramAnalysis";
import { browseAllExercises, movementResultSet, type DiscoveryContext, type MovementDiscovery, type MovementExerciseMatch } from "@/lib/movementDiscovery";
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
  /**
   * What the list is scoped to: one sport action, one muscle, or the whole catalog. Kept apart
   * from the filters, the inspected muscle and the add destination (October 1 brief §6).
   */
  discovery?: DiscoveryContext;
  onDiscoveryChange?: (next: DiscoveryContext) => void;
  /** The action's matches, worked out once by the owner for the context above. */
  movement?: MovementDiscovery | null;
};

const visiblePerPage = 36;

/** The filters an athlete can take off one at a time, with the word each chip shows. */
const chipKeys = ["category", "movement", "equipment", "muscle", "actionLink"] as const;
const actionLinkLabel: Record<CatalogFilters["actionLink"], string> = { all: "All action links", direct: "Direct support", supporting: "Supporting link" };

/**
 * The catalog, one column: what the list is scoped to and honest counts, search,
 * the filters that are on as chips that come off one at a time, Filter & sort,
 * the scope tabs, then the exercises as open rows - photo, title, movement,
 * muscles, the reason it is listed when the scope is a sport action, View
 * details, the catalog's tag, and favorite and add as two separate targets that
 * never open the row.
 */
export function CatalogDiscoveryPanel({ exercises, filters, favoriteIds, onFiltersChange, onToggleFavorite, onInspect, onAdd, recentIds = [], onClearRecent, comparePendingName, onCancelCompare, destinationLabel, selectedActionLabel, onChangeAction, connectionForExercise, discovery = browseAllExercises, onDiscoveryChange, movement = null }: CatalogDiscoveryPanelProps) {
  const [visibleCount, setVisibleCount] = useState(visiblePerPage);
  const [showMuscleOnly, setShowMuscleOnly] = useState(false);
  const options = useMemo(() => catalogFilterOptions(exercises), [exercises]);
  const movementMode = discovery.mode === "movement" && movement !== null && movement.mapped;
  /** A movement scope the library has no mapping for: nothing is listed as if it supported the action. */
  const unmapped = discovery.mode === "movement" && movement !== null && !movement.mapped;
  const muscleMode = discovery.mode === "muscle";
  const muscleName = muscleMode ? (muscleLabels[discovery.muscleId] || discovery.muscleId) : "";
  /**
   * The pool the filters and search narrow. In movement mode it is the action's result set
   * in its own order (named first, then by shared demands); the search keeps that order when
   * there is no query. Muscle-only matches join the pool only when asked for.
   */
  const matchByExercise = useMemo(() => {
    const map = new Map<number, MovementExerciseMatch>();
    if (!movementMode || !movement) return map;
    [...movementResultSet(movement), ...movement.muscleOnly].forEach((match) => map.set(match.exercise.id, match));
    return map;
  }, [movementMode, movement]);
  const pool = useMemo(() => {
    if (unmapped) return [];
    if (!movementMode || !movement) return exercises;
    const set = showMuscleOnly ? [...movementResultSet(movement), ...movement.muscleOnly] : movementResultSet(movement);
    return set.map((match) => match.exercise);
  }, [unmapped, movementMode, movement, showMuscleOnly, exercises]);
  const baseResults = useMemo(() => filterCatalogExercises(pool, filters, favoriteIds), [pool, filters, favoriteIds]);
  const results = useMemo(() => (movementMode ? baseResults : filterCatalogByActionLink(baseResults, filters.actionLink, connectionForExercise)), [movementMode, baseResults, connectionForExercise, filters.actionLink]);
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
    () => !movementMode && labelTellsRowsApart(visibleResults.map((exercise) => visibleConnections.get(exercise.id)?.label ?? "Not mapped")),
    [movementMode, visibleConnections, visibleResults],
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
  const clearFiltersKeepQuery = () => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); onFiltersChange({ ...defaultCatalogFilters, query: filters.query, favoritesOnly: filters.favoritesOnly, muscle: muscleMode ? filters.muscle : "all" }); };
  /** Leaves a movement or muscle scope for the whole catalog; the muscle filter goes with the muscle scope. */
  const browseAll = () => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); setShowMuscleOnly(false); onDiscoveryChange?.(browseAllExercises); onFiltersChange({ ...filters, muscle: muscleMode ? "all" : filters.muscle, favoritesOnly: false }); };
  // The muscle scope is the muscle chip; taking the chip off leaves the scope too.
  const removeChip = (key: (typeof chipKeys)[number]) => {
    if (key === "muscle" && muscleMode) { browseAll(); return; }
    update(key, "all" as never);
  };
  const activeChips = chipKeys.filter((key) => filters[key] !== "all" && !(movementMode && key === "actionLink")).map((key) => ({
    key,
    label: key === "muscle" ? (muscleLabels[filters.muscle] || filters.muscle) : key === "actionLink" ? actionLinkLabel[filters.actionLink] : filters[key],
  }));
  const activeFilterCount = activeChips.length;
  // With nothing found: the nearest real names to what was typed, from the whole
  // catalog, so the empty state can point at something rather than only apologise.
  const listIsUnfiltered = !filters.query.trim() && !filters.favoritesOnly && activeFilterCount === 0 && !movementMode;
  const recentExercises = useMemo(() => (listIsUnfiltered ? recentIds.map((id) => exercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is Exercise => Boolean(exercise)) : []), [listIsUnfiltered, recentIds, exercises]);
  const suggestions = useMemo(() => (results.length === 0 && filters.query.trim() ? suggestExerciseNames(exercises, filters.query) : []), [results.length, filters.query, exercises]);
  // The scoped filters, without the scope itself, so "with these filters" is true of the chips the athlete can see.
  const scopedFilterCount = muscleMode ? activeChips.filter((chip) => chip.key !== "muscle").length : activeFilterCount;

  /** The count in the heading: the actual result set against the scope it was drawn from. */
  const countLine = filters.favoritesOnly
    ? `${results.length} ${results.length === 1 ? "favorite" : "favorites"}`
    : movementMode && movement
      ? `${results.length} ${results.length === 1 ? "exercise" : "exercises"}`
      : results.length === pool.length ? `${pool.length} exercises` : `${results.length} of ${pool.length} exercises`;
  const namedCount = movement ? movement.named.length : 0;
  const demandCount = movement ? movement.demand.length : 0;
  const muscleOnlyCount = movement ? movement.muscleOnly.length : 0;

  /** Where a row sits in the action's set, drawn once at the top of each tier. */
  const tierHeading = (tier: MovementExerciseMatch["tier"]) => tier === "named" ? "Named in its movement record" : tier === "demand" ? "Train the demands its record describes" : "Share a muscle only · not movement matches";

  return <section className="catalog-discovery" data-scope={movementMode ? "movement" : muscleMode ? "muscle" : "all"}>
    <header className="catalog-discovery-heading">
      <div>
        {movementMode && movement
          ? <><p className="catalog-discovery-scope-label">{movement.sportLabel} · exercises for</p><h1>{movement.label}</h1></>
          : muscleMode
            ? <><p className="catalog-discovery-scope-label">Exercises that use the</p><h1>{muscleName}</h1></>
            : <h1>Exercise catalog</h1>}
      </div>
      {/* The count is the actual result set, against the scope's actual size. */}
      <span>{countLine}</span>
    </header>
    {movementMode && movement && <p className="catalog-discovery-scope-line">
      {movement.hasRecord
        ? <>{namedCount} named in its movement record · {demandCount} train the demands it describes{muscleOnlyCount ? ` · ${muscleOnlyCount} share a muscle only` : ""}.</>
        : <>No reviewed movement record for {movement.label.toLowerCase()} yet: these exercises train the demands its sport profile describes{muscleOnlyCount ? `; ${muscleOnlyCount} more share a muscle only` : ""}.</>}
    </p>}
    {muscleMode && <p className="catalog-discovery-scope-line">Every exercise in which the {muscleName.toLowerCase()} has a primary or supporting role.</p>}
    <div className="catalog-discovery-search"><Search className="h-4 w-4" aria-hidden="true" /><input value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder={`Search ${movementMode && movement ? `${movement.label.toLowerCase()} ` : muscleMode ? `${muscleName.toLowerCase()} ` : ""}exercises`} aria-label="Search exercises" /></div>
    {comparePendingName && <p className="catalog-compare-pending" role="status"><span>Comparing <b>{comparePendingName}</b> · open another exercise and choose Compare.</span>{onCancelCompare && <button type="button" onClick={() => { emitInteractionFeedback(); onCancelCompare(); }}>Cancel</button>}</p>}
    {/* The scope line earns its place once there is a query to broaden; before that the heading's count says what is searched. */}
    {filters.query.trim() ? <LocalSearchScope scope={movementMode && movement ? `Searching the ${pool.length} exercises for ${movement.label.toLowerCase()}.` : muscleMode ? `Searching the ${muscleName.toLowerCase()} exercises.` : `Searching the ${exercises.length} exercises in this catalog.`} query={filters.query} /> : null}
    {!movementMode && selectedActionLabel ? <div className="catalog-discovery-context">
      <small className="catalog-discovery-action-scope"><Target className="h-3 w-3" aria-hidden="true" /> Action links below are measured against <b>{selectedActionLabel}</b>.{sharedConnection ? ` ${sharedConnection}` : ""}</small>
      {onChangeAction && <button type="button" className="catalog-discovery-change" onClick={() => { emitInteractionFeedback(); onChangeAction(); }}>Change <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
    </div> : null}
    <div className="catalog-discovery-toolbar">
      <div className="catalog-discovery-chips" aria-label="Filters on">
        {activeChips.map((chip) => <button type="button" key={chip.key} onClick={() => removeChip(chip.key)} aria-label={`Remove filter ${chip.label}`}>{chip.label} <X className="h-3.5 w-3.5" aria-hidden="true" /></button>)}
      </div>
      <details className="catalog-discovery-controls">
        <summary><span><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filter & sort</span><small>{activeFilterCount ? `${activeFilterCount} active` : movementMode ? `All ${pool.length} for this action` : `All ${exercises.length} exercises`}</small></summary>
        <div className="catalog-discovery-filter-grid">
          <label><span>Category</span><select value={filters.category} onChange={(event) => update("category", event.target.value)}><option value="all">All categories</option>{options.categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Movement</span><select value={filters.movement} onChange={(event) => update("movement", event.target.value)}><option value="all">All movements</option>{options.movements.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Equipment</span><select value={filters.equipment} onChange={(event) => update("equipment", event.target.value)}><option value="all">All equipment</option>{options.equipment.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Muscle</span><select value={filters.muscle} onChange={(event) => update("muscle", event.target.value)}><option value="all">All muscles</option>{options.muscles.map((value) => <option key={value} value={value}>{muscleLabels[value] || value}</option>)}</select></label>
          {connectionForExercise && !movementMode ? <label><span>Action link</span><select value={filters.actionLink} onChange={(event) => update("actionLink", event.target.value as CatalogFilters["actionLink"])}><option value="all">All action links</option><option value="direct">Direct support</option><option value="supporting">Supporting link</option></select></label> : null}
          <button type="button" onClick={() => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); onFiltersChange({ ...defaultCatalogFilters, muscle: "serratusAnterior" }); }} className={`catalog-serratus-filter ${filters.muscle === "serratusAnterior" ? "catalog-serratus-filter-on" : ""}`} aria-pressed={filters.muscle === "serratusAnterior"}><Target className="h-3.5 w-3.5" aria-hidden="true" /> Serratus anterior</button>
          {(activeFilterCount || filters.query) ? <button type="button" onClick={reset} className="catalog-filter-reset"><X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters</button> : null}
        </div>
      </details>
    </div>
    {/* The scope, as tabs: the action or muscle this list is for, the whole catalog as an explicit broader
        mode rather than a fallback, and favorites. */}
    <div className="catalog-discovery-tabs" role="tablist" aria-label="Catalog scope">
      {movementMode && movement && <button type="button" role="tab" aria-selected={!filters.favoritesOnly} onClick={() => update("favoritesOnly", false)}>{movement.label}</button>}
      {muscleMode && <button type="button" role="tab" aria-selected={!filters.favoritesOnly} onClick={() => update("favoritesOnly", false)}>{muscleName}</button>}
      <button type="button" role="tab" aria-selected={!movementMode && !muscleMode && !filters.favoritesOnly} onClick={() => (movementMode || muscleMode ? browseAll() : update("favoritesOnly", false))}>All exercises</button>
      <button type="button" role="tab" aria-selected={filters.favoritesOnly} className="catalog-favorites-filter" onClick={() => update("favoritesOnly", true)}>Favorites <b>{favoriteIds.size}</b></button>
    </div>
    {/* Recently viewed: separate from favourites and matches, only while the list is
        unfiltered, and gone the moment a query or filter is in play. An id that no
        longer names a catalog exercise is skipped. */}
    {recentExercises.length > 0 && <section className="catalog-recent" aria-label="Recently viewed">
      <div className="catalog-recent-head"><p className="metric-label">Recently viewed</p>{onClearRecent && <button type="button" onClick={() => { emitInteractionFeedback(); onClearRecent(); }}>Clear</button>}</div>
      <ul className="catalog-recent-row">{recentExercises.map((exercise) => <li key={exercise.id}><button type="button" onClick={() => { emitInteractionFeedback(); onInspect(exercise); }} aria-label={`View ${exercise.name} details`}>{exercise.name}</button></li>)}</ul>
    </section>}
    {discovery.mode === "movement" && movement && !movement.mapped && <div className="catalog-discovery-unmapped" role="status">
      <strong>No movement mapping for {movement.label.toLowerCase()} yet.</strong>
      <p>Its record is not in the library, so there is no reviewed set of supporting exercises. Browse by the muscles it uses, or the whole catalog.</p>
      <div>{movement.muscles.slice(0, 4).map((muscle) => <button type="button" key={muscle} onClick={() => { emitInteractionFeedback(); onDiscoveryChange?.({ mode: "muscle", muscleId: muscle }); onFiltersChange({ ...defaultCatalogFilters, muscle }); }}>{muscleLabels[muscle] || muscle} exercises</button>)}<button type="button" onClick={browseAll}>Browse all exercises</button></div>
    </div>}
    {results.length ? <div className="catalog-discovery-list">
      {visibleResults.map((exercise, index) => {
        const isFavorite = favoriteIds.has(exercise.id);
        const connection = visibleConnections.get(exercise.id);
        const match = matchByExercise.get(exercise.id);
        const previous = index > 0 ? matchByExercise.get(visibleResults[index - 1].id) : undefined;
        const startsTier = Boolean(match) && (!previous || previous!.tier !== match!.tier);
        return <article key={exercise.id} className="catalog-discovery-card" data-tier={match?.tier}>
          {startsTier && match && <h2 className="catalog-discovery-tier-head">{tierHeading(match.tier)}</h2>}
          <div className="catalog-discovery-row">
            <button type="button" onClick={() => { emitInteractionFeedback(); onInspect(exercise); }} className="catalog-discovery-card-copy" aria-label={`Inspect ${exercise.name}`}>
              <ExerciseMedia exerciseId={exercise.id} exerciseName={exercise.name} equipment={exercise.equipment} variant="thumb" />
              <span className="catalog-discovery-identity">
                <strong>{exercise.name}</strong>
                <small>{exercise.movement}{exercise.equipment && !exercise.name.toLowerCase().includes(exercise.equipment.toLowerCase()) ? ` · ${exercise.equipment}` : ""}</small>
                <em>{exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(" · ")}</em>
                {match && <b className={`catalog-match-reason catalog-match-reason-${match.tier}`}>{match.reason}</b>}
                {/* The link, said as the relationship it is rather than a bare pill: "Supporting link · shares a listed prime-mover demand". */}
                {connectionTellsCardsApart && connection && connection.label !== "Not mapped" ? <b className={`catalog-action-link catalog-action-link-${connection.label.toLowerCase().replace(/\s+/g, "-")}`}><span>{connection.label}</span> · {connection.detail.replace(/\.$/, "").replace(/^Named in the selected action’s movement record$/, "named in its movement record").replace(/with the selected action$/, "with it").replace(/^./, (first) => first.toLowerCase())}</b> : null}
                <span className="catalog-discovery-details">View details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
              </span>
            </button>
            <div className="catalog-discovery-actions">
              {/* The catalog's own tag, with the word that says what it is: a label from the catalog, never a match score. */}
              <span className="catalog-discovery-tier"><small aria-hidden="true">Tag</small><span title={`Catalog tag ${exercise.muscleGrade} — a label from the exercise catalog.`} aria-label={`Catalog tag ${exercise.muscleGrade}`}>{exercise.muscleGrade}</span></span>
              <button type="button" onClick={() => { emitInteractionFeedback(); onToggleFavorite(exercise); }} className={isFavorite ? "catalog-favorite-on" : ""} aria-pressed={isFavorite} aria-label={`${isFavorite ? "Remove" : "Save"} ${exercise.name} ${isFavorite ? "from" : "to"} favorites`}><Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} /></button>
              <button type="button" className="catalog-discovery-add" onClick={() => { emitInteractionFeedback(); onAdd(exercise); }} aria-label={`Add ${exercise.name} to ${destinationLabel ?? "the training day"}`}><Plus className="h-5 w-5" /></button>
            </div>
          </div>
        </article>;
      })}
    </div> : unmapped ? null : <div className="catalog-discovery-empty">
      <strong>{filters.favoritesOnly ? "No saved favorites yet." : filters.query ? `Nothing matches "${filters.query}"${scopedFilterCount ? " with these filters" : ""}${movementMode && movement ? ` among the ${movement.label.toLowerCase()} exercises` : muscleMode ? ` among the ${muscleName.toLowerCase()} exercises` : ""}.` : movementMode && movement ? `Nothing in the ${movement.label.toLowerCase()} set matches these filters.` : "No exercises match these filters."}</strong>
      <p>{filters.favoritesOnly ? "Use the heart on any exercise to save a personal shortlist." : scopedFilterCount ? (movementMode ? "Take a filter off to see the action's exercises again." : "Take a filter off, or try a broader movement, equipment or muscle term.") : "Try a broader movement, equipment or muscle term."}</p>
      <div>
        {suggestions.map((name) => <button type="button" key={name} onClick={() => update("query", name)}>Try “{name}”</button>)}
        {activeChips.filter((chip) => !(muscleMode && chip.key === "muscle")).map((chip) => <button type="button" key={chip.key} onClick={() => update(chip.key, "all" as never)}>Remove the {chip.label} filter</button>)}
        {scopedFilterCount > 1 && <button type="button" onClick={clearFiltersKeepQuery}>Clear all filters</button>}
        {filters.query && <button type="button" onClick={() => update("query", "")}>Clear search</button>}
        {filters.favoritesOnly && <button type="button" onClick={() => update("favoritesOnly", false)}>Browse all exercises</button>}
        {(movementMode || muscleMode) && !filters.favoritesOnly && <button type="button" onClick={browseAll}>Browse all exercises</button>}
      </div>
    </div>}
    {results.length > visibleResults.length ? <button type="button" className="catalog-load-more" onClick={() => { emitInteractionFeedback(); setVisibleCount((count) => count + visiblePerPage); }}>Browse {Math.min(visiblePerPage, results.length - visibleResults.length)} more exercises <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : null}
    {/* A shared muscle on its own is not a movement match; those exercises wait behind their own line. */}
    {movementMode && movement && muscleOnlyCount > 0 && !filters.favoritesOnly && <button type="button" className="catalog-muscle-only-toggle" aria-expanded={showMuscleOnly} onClick={() => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); setShowMuscleOnly((value) => !value); }}>
      {showMuscleOnly ? `Hide the ${muscleOnlyCount} exercises that only share a muscle` : `Show ${muscleOnlyCount} more that only share a muscle with ${movement.label.toLowerCase()}`} <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </button>}
  </section>;
}
