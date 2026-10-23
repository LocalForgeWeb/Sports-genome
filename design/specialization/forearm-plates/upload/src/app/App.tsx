import { useMemo, useState } from 'react';
import { ForearmAnatomy } from '../anatomy/ForearmAnatomy';
import { demoMuscleData } from '../anatomy/demoData';
import type { Mode, MuscleData, MuscleId, Side } from '../anatomy/types';

const cloneData = () => Object.fromEntries(
  Object.entries(demoMuscleData).map(([id, data]) => [id, { ...data, exercises: data.exercises.map((exercise) => ({ ...exercise })) }]),
) as Record<MuscleId, MuscleData>;

export function App() {
  const [muscleDataById, setMuscleDataById] = useState<Record<MuscleId, MuscleData>>(cloneData);
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleId | null>('brachioradialis');
  const [side, setSide] = useState<Side>('right');
  const [mode, setMode] = useState<Mode>('completed');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>(['Host mounted with brachioradialis selected']);

  const log = (message: string) => setEventLog((items) => [message, ...items].slice(0, 4));
  const selectedName = selectedMuscleId ? muscleDataById[selectedMuscleId]?.displayName : 'overview';

  const dateRange = useMemo(() => ({ label: 'Sep 18 — Oct 16, 2026', start: '2026-09-18', end: '2026-10-16' }), []);

  const bumpVolume = () => {
    if (!selectedMuscleId) return;
    setMuscleDataById((current) => ({
      ...current,
      [selectedMuscleId]: {
        ...current[selectedMuscleId],
        directDynamicSets: current[selectedMuscleId].directDynamicSets + 2,
      },
    }));
    log(`Host updated ${selectedMuscleId} volume without rebuilding the heatmap`);
  };

  return (
    <main className="app-frame">
      <div className="demo-strip">
        <span className="demo-badge">INTEGRATION DEMO</span>
        <span>Host-controlled anatomy component · demonstration data only</span>
        <div className="demo-strip-actions">
          <button type="button" onClick={() => { setSelectedMuscleId('flexor-digitorum-profundus'); log('Host programmatically selected flexor-digitorum-profundus'); }}>Select FDP</button>
          <button type="button" onClick={bumpVolume} disabled={!selectedMuscleId}>+2 sets</button>
          <label className="motion-toggle"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> reduced motion</label>
        </div>
      </div>

      <ForearmAnatomy
        selectedMuscleId={selectedMuscleId}
        muscleDataById={muscleDataById}
        side={side}
        dateRange={dateRange}
        mode={mode}
        reducedMotion={reducedMotion}
        onMuscleSelect={(id) => { setSelectedMuscleId(id); log(`onMuscleSelect('${id}')`); }}
        onExerciseSelect={(id) => log(`onExerciseSelect('${id}')`)}
        onAddExercise={(id) => log(`onAddExercise('${id}')`)}
        onViewContributions={(id) => log(`onViewContributions('${id}')`)}
        onReturnToOverview={() => { setSelectedMuscleId(null); log('onReturnToOverview()'); }}
      />

      <footer className="host-console">
        <div className="host-console-heading">
          <span className="micro-label">Host controls</span>
          <span className="host-console-selected">controlled selection: <strong>{selectedName}</strong></span>
        </div>
        <div className="host-console-controls">
          <div className="segmented-control" aria-label="Host side control">
            <span className="segmented-label">SIDE</span>
            {(['right', 'left'] as Side[]).map((value) => <button key={value} type="button" className={side === value ? 'is-selected' : ''} onClick={() => { setSide(value); log(`Host changed side to ${value}`); }}>{value}</button>)}
          </div>
          <div className="segmented-control" aria-label="Host mode control">
            <span className="segmented-label">MODE</span>
            {(['completed', 'planned'] as Mode[]).map((value) => <button key={value} type="button" className={mode === value ? 'is-selected' : ''} onClick={() => { setMode(value); log(`Host changed mode to ${value}`); }}>{value}</button>)}
          </div>
          <div className="event-log" aria-live="polite">
            <span className="event-log-label">EVENT STREAM</span>
            <code>{eventLog[0]}</code>
          </div>
        </div>
        <p className="creator-credit"><a href="https://localforgeweb.com" target="_blank" rel="noreferrer">localforgeweb.com</a> · built by Gabe Naim-LocalForgeWeb</p>
      </footer>
    </main>
  );
}
