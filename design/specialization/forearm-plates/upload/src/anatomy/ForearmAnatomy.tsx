import { useCallback, useEffect, useMemo, useState } from 'react';
import { ForearmHeatmap } from './ForearmHeatmap';
import { manifestById, muscleManifest } from './muscleManifest';
import type { ForearmAnatomyProps, MuscleData, MuscleId } from './types';

const defaultAccent = '#F15A32';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function statusLabel(status: MuscleData['dataStatus']) {
  if (status === 'uncertain') return 'Mapping needs review';
  if (status === 'partial') return 'Partial mapping';
  if (status === 'missing') return 'No mapped data';
  return 'Host-supplied data';
}

function anatomyIdLabel(id: MuscleId | null | undefined) {
  const entry = id ? manifestById[id] : undefined;
  return entry ? `F${entry.catalogNumber.toString().padStart(2, '0')}` : '—';
}

export function ForearmAnatomy({
  selectedMuscleId,
  muscleDataById,
  side,
  dateRange,
  mode,
  loading = false,
  error = null,
  theme,
  onMuscleSelect,
  onExerciseSelect,
  onAddExercise,
  onViewContributions,
  onReturnToOverview,
}: ForearmAnatomyProps) {
  const isControlled = selectedMuscleId !== undefined;
  const [internalSelection, setInternalSelection] = useState<MuscleId | null>(muscleManifest[0]?.id ?? null);
  const activeId = isControlled ? selectedMuscleId ?? null : internalSelection;
  const activeData = activeId ? muscleDataById[activeId] : undefined;
  const accent = theme?.accent ?? defaultAccent;
  const availableMuscles = useMemo(
    () => muscleManifest.filter((entry) => muscleDataById[entry.id]),
    [muscleDataById],
  );
  const groupedMuscles = useMemo(() => ([
    { id: 'landmark', label: 'Outer & lateral', note: 'orientation and rotation', entries: availableMuscles.filter((entry) => entry.group === 'landmark') },
    { id: 'flexors', label: 'Flexors & pronators · anterior', note: 'finger, wrist and palm-down control', entries: availableMuscles.filter((entry) => entry.group === 'flexors') },
    { id: 'extensors', label: 'Extensors & thumb · posterior', note: 'wrist, finger and thumb control', entries: availableMuscles.filter((entry) => entry.group === 'extensors') },
  ].filter((group) => group.entries.length)), [availableMuscles]);

  const selectMuscle = useCallback((id: MuscleId) => {
    if (!isControlled) setInternalSelection(id);
    onMuscleSelect?.(id);
  }, [isControlled, onMuscleSelect]);

  const resetToOverview = useCallback(() => {
    if (!isControlled) setInternalSelection(null);
    onReturnToOverview?.();
  }, [isControlled, onReturnToOverview]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return;
      if (event.key === '0') {
        event.preventDefault();
        resetToOverview();
        return;
      }
      const index = Number.parseInt(event.key, 10) - 1;
      const entry = availableMuscles[index];
      if (entry) {
        event.preventDefault();
        selectMuscle(entry.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [availableMuscles, resetToOverview, selectMuscle]);

  const progress = activeData?.targetSets ? Math.min(activeData.directDynamicSets / activeData.targetSets, 1.25) : 0;
  const progressDegrees = `${Math.min(progress, 1) * 360}deg`;
  const activeManifest = activeId ? manifestById[activeId] : undefined;
  const rootStyle = {
    '--anatomy-bg': theme?.background ?? '#081B30',
    '--anatomy-accent': accent,
    '--anatomy-panel': theme?.panel ?? '#0e2943',
    '--anatomy-text': theme?.mainText ?? '#f6f3ed',
    '--anatomy-muted': theme?.secondaryText ?? '#8da5b7',
  } as React.CSSProperties;

  return (
    <section className="anatomy-shell" style={rootStyle} aria-label="Forearm anatomy explorer">
      <header className="anatomy-topbar">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> Sports Genome / anatomy surface</p>
          <h1>Forearm, <em>in view.</em></h1>
        </div>
        <div className="topbar-meta">
          <span className="topbar-note">{dateRange.label}</span>
          <span className="topbar-divider" aria-hidden="true" />
          <span className="topbar-note">{side} side</span>
        </div>
      </header>

      <div className="anatomy-layout">
        <div className="model-column">
          <div className="model-bay">
            <div className="model-bay-header">
              <div>
                <p className="micro-label">Forearm volume heatmap</p>
                <p className="model-helper">Front, back, and thumb-side mesh plates · click a rendered muscle or use the heat key to inspect host-supplied volume</p>
              </div>
              <div className="model-status" data-state="ready">
                <span className="status-dot" /> exact mesh map
              </div>
            </div>
            <nav className="model-focus-rail" aria-label="Quick anatomy navigation">
              <button className={`focus-rail-button ${!activeId ? 'is-active' : ''}`} type="button" onClick={resetToOverview} aria-pressed={!activeId} title="Overview — press 0">
                <span className="focus-rail-icon" aria-hidden="true">◎</span> Overview
              </button>
              {availableMuscles.map((entry, index) => {
                const anatomyId = anatomyIdLabel(entry.id);
                return (
                  <button className={`focus-rail-button ${entry.id === activeId ? 'is-active' : ''}`} type="button" key={entry.id} onClick={() => selectMuscle(entry.id)} aria-pressed={entry.id === activeId} title={`Focus ${entry.displayName} — anatomy ID ${anatomyId}, ${entry.anatomyTag}${index < 9 ? ` — press ${index + 1}` : ''}`}>
                    <span className="focus-rail-index" aria-hidden="true">{anatomyId}</span> {entry.displayName}
                  </button>
                );
              })}
              <span className="focus-rail-help">Click a muscle · heat = host volume</span>
            </nav>
            <div className="heatmap-stage">
              <ForearmHeatmap
                selectedMuscleId={activeId}
                muscleDataById={muscleDataById}
                side={side}
                onMuscleSelect={selectMuscle}
              />
              {loading && (
                <div className="heatmap-overlay">
                  <span className="loader-ring" />
                  <span>Updating heatmap data</span>
                </div>
              )}
            </div>
            <div className="model-bay-footer">
              <span><span className="footer-key">Front</span> / <span className="footer-key">Back</span> / <span className="footer-key">Side</span> separately mapped muscle meshes</span>
              <span className="model-source">exact alpha masks · host volume data</span>
            </div>
          </div>

          <div className="muscle-picker" aria-label="Selectable forearm muscles">
            <div className="section-heading">
              <div>
                <p className="micro-label">Muscle map</p>
                <h2>Choose a structure</h2>
              </div>
              <span className="map-count">{availableMuscles.length.toString().padStart(2, '0')} mapped</span>
            </div>
            <div className="muscle-groups" role="list">
              {groupedMuscles.map((group) => (
                <section className={`muscle-group muscle-group-${group.id}`} key={group.id} aria-label={group.label}>
                  <div className="muscle-group-heading"><strong>{group.label}</strong><span>{group.note}</span></div>
                  <div className="muscle-list">
                    {group.entries.map((entry) => {
                      const isActive = entry.id === activeId;
                      const data = muscleDataById[entry.id];
                      const anatomyId = anatomyIdLabel(entry.id);
                      return (
                        <button
                          className={`muscle-row ${isActive ? 'is-active' : ''}`}
                          type="button"
                          role="listitem"
                          aria-pressed={isActive}
                          key={entry.id}
                          onClick={() => selectMuscle(entry.id)}
                        >
                          <span className="muscle-row-copy">
                            <strong><span className="muscle-row-id">{anatomyId}</span>{entry.displayName}</strong>
                            <small>{entry.anatomyTag} · {entry.layer} layer · {data?.directDynamicSets ?? 0} direct sets</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <aside className="info-column" aria-live="polite">
          <div className="info-column-top">
            <div>
              <p className="micro-label">Selection readout</p>
              <span className="selection-ack"><span className="selection-ack-dot" /> {activeData ? 'Selection acknowledged' : 'Overview'}</span>
            </div>
            <button className="reset-button" type="button" onClick={resetToOverview} disabled={!activeId}>
              <span aria-hidden="true">↺</span> Return to overview
            </button>
          </div>

          {activeData ? (
            <>
              <div className="selected-heading">
                <p className="selected-catalog"><span>Anatomy ID {anatomyIdLabel(activeId)}</span><span>{activeManifest?.anatomyTag}</span></p>
                <p className="selected-layer">{activeManifest?.layer ?? 'mapped'} layer / {side} side</p>
                <h2>{activeData.displayName}</h2>
                <p className="selected-function">{activeData.physicalFunction}</p>
              </div>

              <div className="reveal-callout">
                <span className="callout-line" />
                <div>
                  <strong>{activeManifest?.layer === 'deep' ? 'Deep layer surfaced' : 'Structure in context'}</strong>
                  <span>{activeManifest?.layer === 'deep' ? `Superficial structures fade while ${activeData.displayName} remains oriented against the forearm.` : activeData.visibleShapeContribution}</span>
                </div>
              </div>

              <div className="volume-block">
                <div className="volume-heading">
                  <div>
                    <p className="micro-label">{mode} exposure · {dateRange.label}</p>
                    <strong>{formatNumber(activeData.directDynamicSets)} <span>direct sets</span></strong>
                  </div>
                  {activeData.targetSets ? (
                    <div className="volume-ring" style={{ '--volume-progress': progressDegrees } as React.CSSProperties}>
                      <span>{Math.round(progress * 100)}%</span>
                    </div>
                  ) : <span className="no-target">No target set</span>}
                </div>
                <div className="volume-meter" aria-label={`${activeData.directDynamicSets} direct sets${activeData.targetSets ? ` of ${activeData.targetSets} target` : ''}`}>
                  <span style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                </div>
                <div className="volume-footnotes"><span>Target {activeData.targetSets ?? '—'}</span><span>{statusLabel(activeData.dataStatus)}</span></div>
              </div>

              <div className="exposure-grid">
                <div><span>Support</span><strong>{activeData.supportingExerciseExposure}</strong><small>exercise exposures</small></div>
                <div><span>Isometric</span><strong>{activeData.deliberateIsometricBouts}</strong><small>bouts · {activeData.isometricHoldSeconds}s holds</small></div>
                <div><span>Incidental</span><strong>{activeData.incidentalGripExposure}</strong><small>grip / stability</small></div>
              </div>

              <div className="contribution-block">
                <div className="block-title"><span>Contributing exercises</span><span className="block-rule" /></div>
                {activeData.exercises.map((exercise) => (
                  <button key={exercise.id} className="exercise-row" type="button" onClick={() => onExerciseSelect?.(exercise.id)}>
                    <span>{exercise.name}</span><small>{exercise.exposure}</small><b>↗</b>
                  </button>
                ))}
                <button className="text-action" type="button" onClick={() => onViewContributions?.(activeData.id)}>View all contributions <span>→</span></button>
              </div>

              <div className={`data-note data-note-${activeData.dataStatus ?? 'complete'}`}>
                <span className="data-note-mark">{activeData.dataStatus === 'uncertain' ? '!' : 'i'}</span>
                <span>{activeData.dataNote ?? 'Values are supplied by the host app and update independently of the model-derived heatmap plates.'}</span>
              </div>

              <button className="add-exercise" type="button" onClick={() => onAddExercise?.(activeData.id)}><span>＋</span> Add an exercise to this map</button>
            </>
          ) : (
            <div className="overview-readout">
              <p className="overview-kicker">Anatomy surface ready</p>
              <h2>Follow the contribution trail.</h2>
              <p>Select a mapped muscle to read its host-supplied training exposure and view its front, back, or thumb-side heatmap region.</p>
              <button className="add-exercise" type="button" onClick={() => selectMuscle(muscleManifest[0]?.id ?? '')}>Start with {muscleManifest[0]?.displayName}</button>
            </div>
          )}

          {error && <div className="host-error" role="alert"><strong>Host data issue</strong><span>{error}</span></div>}
        </aside>
      </div>
    </section>
  );
}
