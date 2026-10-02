import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { SearchField } from "@/components/SearchField";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Heart, Plus, SlidersHorizontal, Target, X } from "lucide-react";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import type { Exercise } from "@/lib/exerciseCatalog";
import { catalogFilterOptions, catalogPageSize, defaultCatalogFilters, type CatalogFilters, filterCatalogByActionLink, filterCatalogExercises, muscleModeExercises, refineMovementSupport, spokenDestination } from "@/lib/catalogDiscovery";
import { suggestExerciseNames } from "@/lib/exerciseSearch";
import { muscleLabels } from "@/components/AnatomyMap";
import type { ExerciseActionConnection } from "@/lib/movementProgramAnalysis";
import { sharedConnectionSummary } from "@/lib/movementProgramAnalysis";
import { allExercisesDiscovery, discoveryKey, type ExerciseDiscoveryContext } from "@/lib/exerciseDiscovery";
import { movementMatchCount, supportTierLabel, type MovementSupport, type SupportRow } from "@/lib/movementSupport";
import { movementDisplayLabel } from "@/lib/movementLabel";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { catalogMuscleKeyFor } from "@/lib/recordMuscleKeys";
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
  /** Exercises this device looked at lately, newest first; shown only while the whole catalog is unfiltered. */
  recentIds?: readonly number[];
  onClearRecent?: () => void;
  /** An exercise waiting for a second to compare with, named on the page so the wait is visible and cancellable. */
  comparePendingName?: string;
  onCancelCompare?: () => void;
  /** Where a plus puts the exercise, as the strip shows it: "Week 1 · Pull". Read aloud as "Week 1, Pull". */
  destinationLabel?: string;
  /** Catalog ids already in that day: their rows show as added, and their plus does not add again. */
  addedIds?: ReadonlySet<number>;
  /** The athlete's own action, which the whole catalog's action links are measured against. */
  selectedActionLabel?: string;
  /** Where the action the links are measured against is changed: the Movement Atlas. */
  onChangeAction?: () => void;
  connectionForExercise?: (exercise: Exercise) => ExerciseActionConnection;
  /**
   * How many rows are loaded, when the page that owns the catalog keeps it: then
   * Back from an exercise's details, or from a screen it led to, returns to the
   * same rows. Left out, the panel keeps its own count.
   */
  visibleCount?: number;
  onVisibleCountChange?: (count: number) => void;
  /** How the catalog was entered: movement, muscle or the whole catalog (lib/exerciseDiscovery). */
  discovery?: ExerciseDiscoveryContext;
  /** In movement mode, that movement's support tiers before any refinement (lib/movementSupport). */
  movementSupport?: MovementSupport;
  /** Movement mode: back to the movement the catalog was opened from. */
  onBackToMovement?: () => void;
  /** Leaves movement or muscle mode for the whole catalog. */
  onShowAllExercises?: () => void;
  /** Opens muscle mode for one muscle, on an explicit tap (the missing-data action names the movement's first prime mover). */
  onBrowseMuscle?: (muscleId: string) => void;
};

const visiblePerPage = catalogPageSize;

/** The filters an athlete can take off one at a time, with the word each chip shows. */
const chipKeys = ["category", "movement", "equipment", "muscle", "actionLink"] as const;
const actionLinkLabel: Record<CatalogFilters["actionLink"], string> = { all: "All action links", direct: "Movement-specific", supporting: "Related or muscle support" };

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The catalog, in one of three modes (Sep 30 brief, sections 3-5): the exercises
 * for a sport movement, for one muscle, or the whole catalog. One column, top to
 * bottom: the mode's title; in movement and muscle mode a compact context row;
 * search; one wrapping row of refinements (Filters, the filters that are on as
 * chips, a Favorites toggle, Clear filters); the count, saying what it counts;
 * then the rows.
 *
 * In movement mode the rows are the movement's support tiers, refined but never
 * added to: movement-specific and related-pattern exercises are the matches, each
 * with the reason it appears; muscle support is a separate closed section that is
 * never counted as a match. The sport and movement are the base, not a chip, so
 * Clear filters keeps them; Show all exercises leaves the mode.
 *
 * A row is the name and why it appears on the left, and favorite and add as a
 * fixed column on the right that never opens the row. The catalog's letter tier is
 * not on the rows: it rates nothing about a movement, so it is shown, explained,
 * only in an exercise's details.
 */
export function CatalogDiscoveryPanel({ exercises, filters, favoriteIds, onFiltersChange, onToggleFavorite, onInspect, onAdd, recentIds = [], onClearRecent, comparePendingName, onCancelCompare, destinationLabel, addedIds, selectedActionLabel, onChangeAction, connectionForExercise, visibleCount: keptVisibleCount, onVisibleCountChange, discovery = allExercisesDiscovery, movementSupport, onBackToMovement, onShowAllExercises, onBrowseMuscle }: CatalogDiscoveryPanelProps) {
  const [ownVisibleCount, setOwnVisibleCount] = useState(visiblePerPage);
  const visibleCount = keptVisibleCount ?? ownVisibleCount;
  const setVisibleCount = (next: number | ((count: number) => number)) => {
    const count = typeof next === "function" ? next(visibleCount) : next;
    if (onVisibleCountChange) onVisibleCountChange(count); else setOwnVisibleCount(count);
  };
  // Movement mode needs the movement's tiers; without them the whole catalog is the honest list.
  const support = discovery.mode === "movement" ? movementSupport : undefined;
  const muscleId = discovery.mode === "muscle" ? discovery.muscleId : null;
  const muscleName = muscleId ? (muscleLabels[muscleId] || muscleId) : "";
  // The catalog key the muscle's exercises carry. A region the figure draws but the
  // catalog never tags (soleus) reads through the key for the same tissue (calves);
  // one with no such key (peroneals) has none, and the list says so.
  const catalogMuscleId = muscleId ? catalogMuscleKeyFor(muscleId) : null;
  const catalogMuscleName = catalogMuscleId ? (muscleLabels[catalogMuscleId] || catalogMuscleId) : "";
  const muscleFolded = Boolean(muscleId && catalogMuscleId && catalogMuscleId !== muscleId);
  const movementName = support?.movementLabel ?? "";
  const title = support ? `Exercises for ${movementName}` : muscleId ? `${muscleName} exercises` : "Exercise catalog";

  const options = useMemo(() => catalogFilterOptions(exercises), [exercises]);
  const refined = useMemo(() => (support ? refineMovementSupport(support, filters, favoriteIds) : null), [support, filters, favoriteIds]);
  const muscleBase = useMemo(() => (muscleId ? muscleModeExercises(exercises, muscleId) : exercises), [exercises, muscleId]);
  const baseResults = useMemo(() => (support ? [] : filterCatalogExercises(muscleBase, filters, favoriteIds)), [support, muscleBase, filters, favoriteIds]);
  // Action links belong to the whole catalog: a movement list has its tiers, and a
  // muscle list is about the muscle, not the athlete's own action.
  const showsActionLinks = discovery.mode === "all";
  const listResults = useMemo(() => (showsActionLinks ? filterCatalogByActionLink(baseResults, filters.actionLink, connectionForExercise) : baseResults), [showsActionLinks, baseResults, connectionForExercise, filters.actionLink]);
  // In movement mode the list is the matches: movement-specific, then related pattern.
  const matchRows = useMemo(() => (refined ? [...refined.specific, ...refined.related] : []), [refined]);
  const results = refined ? matchRows.map((row) => row.exercise) : listResults;
  const visibleResults = results.slice(0, visibleCount);

  // Action links (whole catalog only): measured against the athlete's own action,
  // drawn on a row only where they tell rows apart, and otherwise said once beside
  // the count.
  const linkRows = showsActionLinks ? visibleResults : [];
  const visibleConnections = useMemo(
    () => new Map(linkRows.map((exercise) => [exercise.id, connectionForExercise?.(exercise)] as const)),
    [linkRows, connectionForExercise],
  );
  const connectionTellsCardsApart = useMemo(
    () => labelTellsRowsApart(linkRows.map((exercise) => visibleConnections.get(exercise.id)?.label ?? "Not mapped")),
    [visibleConnections, linkRows],
  );
  const sharedConnection = useMemo(() => {
    if (connectionTellsCardsApart || !linkRows.length) return null;
    const label = visibleConnections.get(linkRows[0].id)?.label;
    return label ? sharedConnectionSummary(label, linkRows.length) : null;
  }, [connectionTellsCardsApart, visibleConnections, linkRows]);

  const update = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    setVisibleCount(visiblePerPage);
    if (key !== "query") emitInteractionFeedback();
    onFiltersChange({ ...filters, [key]: value });
  };
  /** Clears every refinement, the search and Favorites included. The mode is not a refinement: a movement or muscle stays. */
  const reset = () => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); onFiltersChange(defaultCatalogFilters); };
  /** Clears the filters and keeps what was typed: a no-results state is not a reason to lose the query. */
  const clearFiltersKeepQuery = () => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); onFiltersChange({ ...defaultCatalogFilters, query: filters.query, favoritesOnly: filters.favoritesOnly }); };
  const activeChips = chipKeys.filter((key) => filters[key] !== "all" && (showsActionLinks || key !== "actionLink")).map((key) => ({
    key,
    label: key === "muscle" ? (muscleLabels[filters.muscle] || filters.muscle) : key === "actionLink" ? actionLinkLabel[filters.actionLink] : filters[key],
  }));
  const activeFilterCount = activeChips.length;
  const anyRefinement = activeFilterCount > 0 || filters.favoritesOnly || Boolean(filters.query.trim());
  const listIsUnfiltered = !anyRefinement;
  const recentExercises = useMemo(() => (discovery.mode === "all" && listIsUnfiltered ? recentIds.map((id) => exercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is Exercise => Boolean(exercise)) : []), [discovery.mode, listIsUnfiltered, recentIds, exercises]);
  // With nothing found: the nearest real names to what was typed, from the whole
  // catalog, so the empty state can point at something rather than only apologise.
  const suggestions = useMemo(() => (!support && results.length === 0 && filters.query.trim() ? suggestExerciseNames(exercises, filters.query) : []), [support, results.length, filters.query, exercises]);

  /*
   * Adding. A row whose exercise is already in the destination day shows as added,
   * and its plus no longer adds. Between a tap and the owner's answer, a second tap
   * on the same row is dropped here too, so a double tap writes once and does not
   * turn the "Added" notice into "Already in this workout".
   */
  const addsInFlight = useRef(new Set<number>());
  const addedHere = useRef(new Set<number>());
  useEffect(() => { addsInFlight.current.clear(); });
  const spokenDay = destinationLabel ? spokenDestination(destinationLabel) : "the training day";
  const add = (exercise: Exercise) => {
    if (addedIds?.has(exercise.id) || addsInFlight.current.has(exercise.id)) return;
    addsInFlight.current.add(exercise.id);
    addedHere.current.add(exercise.id);
    emitInteractionFeedback();
    onAdd(exercise);
  };

  const muscleReason = (exercise: Exercise) => (exercise.primaryMuscles.includes(catalogMuscleId ?? "") ? `Trains ${catalogMuscleName} as a primary muscle` : `Trains ${catalogMuscleName} as a supporting muscle`);

  const renderRow = (exercise: Exercise, reason?: string) => {
    const isFavorite = favoriteIds.has(exercise.id);
    const added = Boolean(addedIds?.has(exercise.id));
    const connection = visibleConnections.get(exercise.id);
    const reasonId = `catalog-row-reason-${exercise.id}`;
    return <article key={exercise.id} className={`catalog-discovery-row${added ? " is-added" : ""}${added && addedHere.current.has(exercise.id) ? " is-added-now" : ""}`}>
      <button type="button" onClick={() => { emitInteractionFeedback(); onInspect(exercise); }} className="catalog-discovery-row-copy" aria-label={`Inspect ${exercise.name}`} aria-describedby={reason ? reasonId : undefined}>
        <ExerciseMedia exerciseId={exercise.id} exerciseName={exercise.name} equipment={exercise.equipment} variant="thumb" />
        <span className="catalog-discovery-identity">
          <strong>{exercise.name}</strong>
          {reason ? <span className="catalog-row-reason" id={reasonId}>{reason}</span> : null}
          <small>{exercise.movement}{exercise.equipment && !exercise.name.toLowerCase().includes(exercise.equipment.toLowerCase()) ? ` · ${exercise.equipment}` : ""}</small>
          {!reason ? <em>{exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(" · ")}</em> : null}
          {connectionTellsCardsApart && connection && connection.label !== "Not mapped" ? <b className={`catalog-action-link catalog-action-link-${connection.label.toLowerCase().replace(/\s+/g, "-")}`} title={connection.detail}>{connection.label}</b> : null}
        </span>
        <ChevronRight className="catalog-row-chevron h-4 w-4" aria-hidden="true" />
      </button>
      <div className="catalog-discovery-actions">
        <button type="button" onClick={() => { emitInteractionFeedback(); onToggleFavorite(exercise); }} className={`catalog-favorite${isFavorite ? " catalog-favorite-on" : ""}`} aria-pressed={isFavorite} aria-label={`Save ${exercise.name} to favorites`}><Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" /></button>
        <button type="button" onClick={() => add(exercise)} className={`catalog-add${added ? " is-added" : ""}`} aria-disabled={added || undefined} aria-label={added ? `${exercise.name} is already in ${spokenDay}` : `Add ${exercise.name} to ${spokenDay}`}>{added ? <Check className="h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}</button>
      </div>
    </article>;
  };

  const matchCount = refined ? movementMatchCount(refined) : 0;
  const countLine = support
    ? (support.status === "ok" && matchCount > 0 ? <p className="catalog-results-count" aria-live="polite"><b>{plural(matchCount, "movement match", "movement matches")}</b> <small>{refined!.specific.length} movement-specific · {refined!.related.length} related pattern</small></p> : null)
    : <p className="catalog-results-count" aria-live="polite"><b>{muscleId
      ? plural(results.length, `${muscleName} exercise`, `${muscleName} exercises`)
      : filters.favoritesOnly ? plural(results.length, "favorite", "favorites")
      : results.length === exercises.length ? plural(exercises.length, "exercise", "exercises") : `${results.length} of ${exercises.length} exercises`}</b></p>;
  // The one fact about every action link on screen, said once beside the count.
  const actionScope = showsActionLinks && selectedActionLabel && connectionForExercise && results.length > 0
    ? <div className="catalog-discovery-action-scope"><p><Target className="h-3 w-3" aria-hidden="true" /> Action links are measured against <b>{movementDisplayLabel(selectedActionLabel)}</b>.{sharedConnection ? ` ${sharedConnection}` : ""}</p>{onChangeAction && <button type="button" className="catalog-discovery-change" onClick={() => { emitInteractionFeedback(); onChangeAction(); }}>Change action</button>}</div>
    : null;

  const visibleMatchRows = matchRows.slice(0, visibleCount);
  const tierGroups = refined ? (["specific", "related"] as const).map((tier) => ({ tier, total: refined[tier].length, rows: visibleMatchRows.filter((row) => row.tier === tier) })) : [];

  return <section className="catalog-discovery">
    <header className="catalog-discovery-heading">
      <h1>{title}</h1>
    </header>
    {support ? <div className="catalog-discovery-context">
      {/* Compact: the sport and movement with both ways off the page on one wrapping
          line, then the method behind its toggle. No sentence repeats what the list
          holds: the count and the tier headings under it say that. At 320px with
          125% text this block was 276px tall and pushed the first row under the strip. */}
      <div className="catalog-context-head">
        <p className="catalog-context-line">{support.sportLabel} · {movementName}</p>
        {onBackToMovement && <button type="button" className="catalog-context-back" onClick={() => { emitInteractionFeedback(); onBackToMovement(); }}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to {movementName}</button>}
        {onShowAllExercises && <button type="button" className="catalog-context-all" onClick={() => { emitInteractionFeedback(); onShowAllExercises(); }}>Show all exercises</button>}
      </div>
      <details className="catalog-discovery-how" key={discoveryKey(discovery)}>
        <summary>How matches work <ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <div>
          <p><b>{supportTierLabel.specific}:</b> the exercise is named in the {movementName} movement record. It is matched by exercise name to the movement record.</p>
          <p><b>{supportTierLabel.related}:</b> the same catalog pattern as a movement-specific exercise, and it trains one of {movementName}'s prime movers as a primary muscle.</p>
          <p><b>{supportTierLabel.muscle}:</b> it trains a prime mover of {movementName} but is not specific to the movement. It is listed separately and never counted as a match.</p>
          <p>Equipment, the other filters, search and Favorites only narrow these groups; they never add exercises. The catalog tier in an exercise's details is a general catalog label, not a movement match.</p>
          {support.record ? <p>The {movementName} record is rated {support.record.confidence} confidence, from {plural(support.record.sourceCount, "source", "sources")}.</p> : <p>There is no movement record for {movementName} yet.</p>}
        </div>
      </details>
    </div> : muscleId ? <div className="catalog-discovery-context">
      <p className="catalog-context-explain">{muscleFolded ? `The catalog tags ${muscleName} work under ${catalogMuscleName}: these train ${catalogMuscleName} as a primary or supporting muscle, primary first.` : `Exercises that train ${muscleName} as a primary or supporting muscle, primary first.`}</p>
      {onShowAllExercises && <div className="catalog-context-actions"><button type="button" className="catalog-context-all" onClick={() => { emitInteractionFeedback(); onShowAllExercises(); }}>Show all exercises</button></div>}
    </div> : null}
    <SearchField className="catalog-discovery-search" value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder={`Search ${discovery.mode === "all" ? "exercises" : "these exercises"}`} aria-label="Search exercises" />
    {comparePendingName && <p className="catalog-compare-pending" role="status"><span>Comparing <b>{comparePendingName}</b> · open another exercise and choose Compare.</span>{onCancelCompare && <button type="button" onClick={() => { emitInteractionFeedback(); onCancelCompare(); }}>Cancel</button>}</p>}
    {/* The scope line earns its place once there is a query to broaden. */}
    {filters.query.trim() ? <LocalSearchScope scope={support ? `Searching the exercises listed for ${movementName}.` : muscleId ? `Searching the ${muscleBase.length} ${muscleName} exercises.` : `Searching the ${exercises.length} exercises in this catalog.`} query={filters.query} /> : null}
    <div className="catalog-discovery-refine">
      <details className="catalog-discovery-controls">
        <summary><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filters{activeFilterCount ? <small>{activeFilterCount} on</small> : null}</summary>
        <div className="catalog-discovery-filter-grid">
          <label><span>Category</span><select value={filters.category} onChange={(event) => update("category", event.target.value)}><option value="all">All categories</option>{options.categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Exercise pattern</span><select value={filters.movement} onChange={(event) => update("movement", event.target.value)}><option value="all">All patterns</option>{options.movements.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Equipment</span><select value={filters.equipment} onChange={(event) => update("equipment", event.target.value)}><option value="all">All equipment</option>{options.equipment.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Muscle</span><select value={filters.muscle} onChange={(event) => update("muscle", event.target.value)}><option value="all">All muscles</option>{options.muscles.map((value) => <option key={value} value={value}>{muscleLabels[value] || value}</option>)}</select></label>
          {connectionForExercise && showsActionLinks ? <label><span>Action link</span><select value={filters.actionLink} onChange={(event) => update("actionLink", event.target.value as CatalogFilters["actionLink"])}><option value="all">All action links</option><option value="direct">{actionLinkLabel.direct}</option><option value="supporting">{actionLinkLabel.supporting}</option></select></label> : null}
          <button type="button" onClick={() => { emitInteractionFeedback(); setVisibleCount(visiblePerPage); onFiltersChange({ ...defaultCatalogFilters, muscle: "serratusAnterior" }); }} className={`catalog-serratus-filter ${filters.muscle === "serratusAnterior" ? "catalog-serratus-filter-on" : ""}`} aria-pressed={filters.muscle === "serratusAnterior"}><Target className="h-3.5 w-3.5" aria-hidden="true" /> Serratus anterior</button>
        </div>
      </details>
      <div className="catalog-discovery-chips" role="group" aria-label="Filters on">
        {activeChips.map((chip) => <button type="button" key={chip.key} onClick={() => update(chip.key, "all" as never)} aria-label={`Remove filter ${chip.label}`}>{chip.label} <X className="h-3.5 w-3.5" aria-hidden="true" /></button>)}
      </div>
      <button type="button" className="catalog-favorites-toggle" aria-pressed={filters.favoritesOnly} onClick={() => update("favoritesOnly", !filters.favoritesOnly)}><Heart className="h-4 w-4" fill={filters.favoritesOnly ? "currentColor" : "none"} aria-hidden="true" /> Favorites <b>{favoriteIds.size}</b></button>
      {anyRefinement ? <button type="button" onClick={reset} className="catalog-filter-reset"><X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters</button> : null}
    </div>
    {countLine}
    {actionScope}
    {/* Recently viewed: the whole catalog only, while it is unfiltered, and gone
        the moment a query or filter is in play. An id that no longer names a
        catalog exercise is skipped. */}
    {recentExercises.length > 0 && <section className="catalog-recent" aria-label="Recently viewed">
      <div className="catalog-recent-head"><p className="metric-label">Recently viewed</p>{onClearRecent && <button type="button" onClick={() => { emitInteractionFeedback(); onClearRecent(); }}>Clear</button>}</div>
      <ul className="catalog-recent-row">{recentExercises.map((exercise) => <li key={exercise.id}><button type="button" onClick={() => { emitInteractionFeedback(); onInspect(exercise); }} aria-label={`View ${exercise.name} details`}>{exercise.name}</button></li>)}</ul>
    </section>}
    {support && refined ? <>
      {support.status !== "ok" ? <div className="catalog-discovery-empty catalog-movement-missing">
        <strong>Movement-specific matches aren't available yet for {movementName}.</strong>
        <p>{support.status === "no-record" ? `There is no movement record for ${movementName} yet, so no exercise is matched to it.` : `The ${movementName} movement record names no exercise that is in this catalog yet.`}</p>
        <div>
          {support.primeMoverKeys[0] && onBrowseMuscle ? <button type="button" onClick={() => { emitInteractionFeedback(); onBrowseMuscle(support.primeMoverKeys[0]); }}>Browse exercises for its muscles</button> : null}
          {onShowAllExercises ? <button type="button" onClick={() => { emitInteractionFeedback(); onShowAllExercises(); }}>Open the full catalog</button> : null}
        </div>
      </div> : matchCount === 0 ? <div className="catalog-discovery-empty catalog-movement-filtered">
        <strong>No {movementName} matches with these filters.</strong>
        <p>{plural(movementMatchCount(support), "exercise matches", "exercises match")} {movementName} without them.</p>
        <div><button type="button" onClick={reset}>Clear filters</button></div>
      </div> : <div className="catalog-discovery-list">
        {tierGroups.map((group) => group.rows.length ? <section key={group.tier} className="catalog-tier-group" aria-labelledby={`catalog-tier-${group.tier}`}>
          <h2 className="catalog-tier-heading" id={`catalog-tier-${group.tier}`}>{supportTierLabel[group.tier]} <small>{group.total}</small></h2>
          {group.rows.map((row) => renderRow(row.exercise, row.reason))}
        </section> : null)}
      </div>}
      {results.length > visibleResults.length ? <button type="button" className="catalog-load-more" onClick={() => { emitInteractionFeedback(); setVisibleCount((count) => count + visiblePerPage); }}>Browse {Math.min(visiblePerPage, results.length - visibleResults.length)} more matches <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : null}
      {refined.muscle.length > 0 ? <MuscleSupportSection key={discoveryKey(discovery)} movementName={movementName} rows={refined.muscle} renderRow={renderRow} /> : null}
    </> : <>
      {results.length ? <div className="catalog-discovery-list">
        {visibleResults.map((exercise) => renderRow(exercise, muscleId ? muscleReason(exercise) : undefined))}
      </div> : muscleId && muscleBase.length === 0 ? <div className="catalog-discovery-empty catalog-muscle-missing">
        {/* Not a filter problem: no catalog exercise carries this muscle at all. */}
        <strong>No catalog exercise is tagged with {muscleName} yet.</strong>
        <p>The catalog lists the muscles each exercise trains, and none lists {muscleName}.</p>
        {onShowAllExercises ? <div><button type="button" onClick={() => { emitInteractionFeedback(); onShowAllExercises(); }}>Open the full catalog</button></div> : null}
      </div> : <div className="catalog-discovery-empty"><strong>{filters.favoritesOnly && favoriteIds.size === 0 ? "No saved favorites yet." : filters.query ? `Nothing matches "${filters.query}"${activeFilterCount ? " with these filters" : ""}.` : "No exercises match these filters."}</strong><p>{filters.favoritesOnly && favoriteIds.size === 0 ? "Use the heart on any exercise to save a personal shortlist." : activeFilterCount ? "Take a filter off, or try a broader movement, equipment or muscle term." : "Try a broader movement, equipment or muscle term."}</p><div>{suggestions.map((name) => <button type="button" key={name} onClick={() => update("query", name)}>Try “{name}”</button>)}{activeChips.map((chip) => <button type="button" key={chip.key} onClick={() => update(chip.key, "all" as never)}>Remove the {chip.label} filter</button>)}{activeFilterCount > 1 && <button type="button" onClick={clearFiltersKeepQuery}>Clear all filters</button>}{filters.query && <button type="button" onClick={() => update("query", "")}>Clear search</button>}{filters.favoritesOnly && <button type="button" onClick={() => update("favoritesOnly", false)}>Turn off Favorites</button>}</div></div>}
      {results.length > visibleResults.length ? <button type="button" className="catalog-load-more" onClick={() => { emitInteractionFeedback(); setVisibleCount((count) => count + visiblePerPage); }}>Browse {Math.min(visiblePerPage, results.length - visibleResults.length)} more exercises <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : null}
    </>}
  </section>;
}

/**
 * Muscle support: exercises that train one of the movement's prime movers but are
 * not specific to it. Closed until opened, counted on its own line, and never part
 * of the match count. Keyed by the movement, so it closes and starts over when the
 * movement changes.
 */
function MuscleSupportSection({ movementName, rows, renderRow }: { movementName: string; rows: SupportRow[]; renderRow: (exercise: Exercise, reason?: string) => ReactElement }) {
  const [shown, setShown] = useState(visiblePerPage);
  return <details className="catalog-muscle-support">
    <summary><span>{supportTierLabel.muscle} <small>{rows.length}</small></span><em>Not counted as matches <ChevronDown className="h-4 w-4" aria-hidden="true" /></em></summary>
    <p className="catalog-muscle-support-note">These train a prime mover of {movementName} but are not specific to the movement.</p>
    <div className="catalog-discovery-list">{rows.slice(0, shown).map((row) => renderRow(row.exercise, row.reason))}</div>
    {rows.length > shown ? <button type="button" className="catalog-load-more" onClick={() => { emitInteractionFeedback(); setShown((count) => count + visiblePerPage); }}>Browse {Math.min(visiblePerPage, rows.length - shown)} more <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : null}
  </details>;
}
