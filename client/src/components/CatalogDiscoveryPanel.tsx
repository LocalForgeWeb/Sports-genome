import { useMemo, useState } from "react";
import { Heart, Plus, Search, SlidersHorizontal, Target, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { catalogFilterOptions, defaultCatalogFilters, type CatalogFilters, filterCatalogByActionLink, filterCatalogExercises } from "@/lib/catalogDiscovery";
import { muscleLabels } from "@/components/AnatomyMap";
import type { ExerciseActionConnection } from "@/lib/movementProgramAnalysis";
import "@/catalog-discovery.css";

type CatalogDiscoveryPanelProps = {
  exercises: Exercise[];
  filters: CatalogFilters;
  favoriteIds: Set<number>;
  onFiltersChange: (next: CatalogFilters) => void;
  onToggleFavorite: (exercise: Exercise) => void;
  onInspect: (exercise: Exercise) => void;
  onAdd: (exercise: Exercise) => void;
  selectedActionLabel?: string;
  connectionForExercise?: (exercise: Exercise) => ExerciseActionConnection;
};

const visiblePerPage = 36;

export function CatalogDiscoveryPanel({ exercises, filters, favoriteIds, onFiltersChange, onToggleFavorite, onInspect, onAdd, selectedActionLabel, connectionForExercise }: CatalogDiscoveryPanelProps) {
  const [visibleCount, setVisibleCount] = useState(visiblePerPage);
  const options = useMemo(() => catalogFilterOptions(exercises), [exercises]);
  const baseResults = useMemo(() => filterCatalogExercises(exercises, filters, favoriteIds), [exercises, filters, favoriteIds]);
  const results = useMemo(() => filterCatalogByActionLink(baseResults, filters.actionLink, connectionForExercise), [baseResults, connectionForExercise, filters.actionLink]);
  const visibleResults = results.slice(0, visibleCount);
  const update = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    setVisibleCount(visiblePerPage);
    onFiltersChange({ ...filters, [key]: value });
  };
  const reset = () => onFiltersChange(defaultCatalogFilters);
  const activeFilterCount = [filters.category, filters.movement, filters.equipment, filters.muscle, filters.actionLink].filter((value) => value !== "all").length + Number(filters.favoritesOnly);

  return <section className="catalog-discovery">
    <header className="catalog-discovery-heading">
      <div><p>Exercise catalog</p><h1>Find an exercise</h1></div>
      <span>{exercises.length} options</span>
    </header>
    <div className="catalog-discovery-search"><Search className="h-4 w-4" /><input value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder="Search exercise, muscle, movement, equipment, or quality" aria-label="Search exercises" /><span>{results.length} matches</span></div>
    <details className="catalog-discovery-controls">
      <summary><span><SlidersHorizontal className="h-4 w-4" /> Filter & sort</span><small>{activeFilterCount ? `${activeFilterCount} active` : `All ${exercises.length} exercises`}</small></summary>
      <div className="catalog-discovery-filter-grid">
        <label><span>Category</span><select value={filters.category} onChange={(event) => update("category", event.target.value)}><option value="all">All categories</option>{options.categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Movement</span><select value={filters.movement} onChange={(event) => update("movement", event.target.value)}><option value="all">All movements</option>{options.movements.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Equipment</span><select value={filters.equipment} onChange={(event) => update("equipment", event.target.value)}><option value="all">All equipment</option>{options.equipment.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Muscle</span><select value={filters.muscle} onChange={(event) => update("muscle", event.target.value)}><option value="all">All muscles</option>{options.muscles.map((value) => <option key={value} value={value}>{muscleLabels[value] || value}</option>)}</select></label>
        {connectionForExercise ? <label><span>Action link</span><select value={filters.actionLink} onChange={(event) => update("actionLink", event.target.value as CatalogFilters["actionLink"])}><option value="all">All action links</option><option value="direct">Direct support</option><option value="supporting">Supporting link</option></select></label> : null}
        <button type="button" onClick={() => { setVisibleCount(visiblePerPage); onFiltersChange({ ...defaultCatalogFilters, muscle: "serratusAnterior" }); }} className={`catalog-serratus-filter ${filters.muscle === "serratusAnterior" ? "catalog-serratus-filter-on" : ""}`} aria-pressed={filters.muscle === "serratusAnterior"}><Target className="h-3.5 w-3.5" /> Serratus anterior</button>
        <button type="button" onClick={() => update("favoritesOnly", !filters.favoritesOnly)} className={`catalog-favorites-filter ${filters.favoritesOnly ? "catalog-favorites-filter-on" : ""}`} aria-pressed={filters.favoritesOnly}><Heart className="h-3.5 w-3.5" fill={filters.favoritesOnly ? "currentColor" : "none"} /> Favorites <b>{favoriteIds.size}</b></button>
        {(activeFilterCount || filters.query) ? <button type="button" onClick={reset} className="catalog-filter-reset"><X className="h-3.5 w-3.5" /> Clear filters</button> : null}
      </div>
    </details>
    {results.length ? <div className="catalog-discovery-list">
      {visibleResults.map((exercise) => {
        const isFavorite = favoriteIds.has(exercise.id);
        const connection = connectionForExercise?.(exercise);
        return <article key={exercise.id} className="catalog-discovery-card">
          <button onClick={() => onInspect(exercise)} className="catalog-discovery-card-copy" aria-label={`Inspect ${exercise.name}`}><span className="catalog-discovery-index">#{String(exercise.id).padStart(3, "0")}</span><span><strong>{exercise.name}</strong><small>{exercise.movement}</small><em>{exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(" · ")}</em>{connection ? <b className={`catalog-action-link catalog-action-link-${connection.label.toLowerCase().replace(/\s+/g, "-")}`} title={connection.detail}>{connection.label}{selectedActionLabel ? ` · ${selectedActionLabel}` : ""}</b> : null}</span><span className="catalog-discovery-tier" title="Configured catalog classification; not a population rank or strength measurement.">Catalog tag {exercise.muscleGrade}</span></button>
          <div className="catalog-discovery-actions"><button onClick={() => onToggleFavorite(exercise)} className={isFavorite ? "catalog-favorite-on" : ""} aria-label={`${isFavorite ? "Remove" : "Save"} ${exercise.name} ${isFavorite ? "from" : "to"} favorites`}><Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} /></button><button onClick={() => onAdd(exercise)} aria-label={`Add ${exercise.name} to workout`}><Plus className="h-4 w-4" /></button></div>
        </article>;
      })}
    </div> : <div className="catalog-discovery-empty"><Heart className="h-5 w-5" /><strong>{filters.favoritesOnly ? "No saved favorites yet." : "No exercises match this search."}</strong><p>{filters.favoritesOnly ? "Use the heart on any catalog exercise to save a personal shortlist." : "Clear a filter or try a broader movement, equipment, or muscle term."}</p><button onClick={reset}>Reset catalog filters</button></div>}
    {results.length > visibleResults.length ? <button className="catalog-load-more" onClick={() => setVisibleCount((count) => count + visiblePerPage)}>Show {Math.min(visiblePerPage, results.length - visibleResults.length)} more exercises</button> : null}
  </section>;
}
