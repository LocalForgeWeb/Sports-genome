# Forearm mesh-plate heatmap API

`ForearmAnatomy` is a controlled React component. It renders front/palmar, back/dorsal, and thumb-side anatomy plates from prebuilt PNG mesh renders, composites live heat tint in a standard 2D canvas, and uses matching alpha masks for direct muscle selection.

```tsx
import { ForearmAnatomy } from './anatomy';

<ForearmAnatomy
  selectedMuscleId={selectedMuscleId}
  muscleDataById={muscleDataById}
  side="right"
  dateRange={{ label: 'Sep 18 — Oct 16', start: '2026-09-18', end: '2026-10-16' }}
  mode="completed"
  onMuscleSelect={setSelectedMuscleId}
  onExerciseSelect={openExercise}
  onAddExercise={openExercisePicker}
  onViewContributions={openContributions}
  onReturnToOverview={() => setSelectedMuscleId(null)}
/>
```

## Primary inputs

| Input | Purpose |
| --- | --- |
| `selectedMuscleId: MuscleId \| null` | Controlled selection. Deep IDs automatically show the deep plate pass. `null` is overview. |
| `muscleDataById: Record<string, MuscleData>` | Values, readable copy, exercise rows, uncertainty notes, and mesh heat intensity. |
| `side: 'left' \| 'right'` | Mirrors the plate and inverts canvas pointer coordinates while keeping the same stable IDs. |
| `dateRange` | Host-selected date context. |
| `mode: 'planned' \| 'completed'` | Host-selected training mode. |
| `loading`, `error` | Host state rendered as ordinary interface feedback. |
| `theme` | Optional surface/background/accent overrides. |

`reducedMotion` remains accepted for host API compatibility. The plate has no automatic motion.

## `MuscleData` fields used

- `displayName` — readable heat-key and selection name.
- `directDynamicSets` — **Volume** heat metric.
- `targetSets` — **Target** heat metric.
- `physicalFunction`, `shapeContribution`, `layer`, `mappingStatus`, and `dataNote` — panel context.
- `supportingExposure`, `isometricBouts`, `isometricHoldSeconds`, `incidentalExposure`, and `exercises` — panel context.

The component never calculates training exposure. Missing values use the low heat color and preserve host mapping-status messaging.

## Muscle identity labels

`src/anatomy/muscleManifest.ts` gives each of the 20 stable slug IDs two display fields:

| Field | Example | Purpose |
| --- | --- | --- |
| `catalogNumber` | `7` → `F07` | Permanent visible anatomy index, not a changing list position. |
| `anatomyTag` | `anterior radial · superficial` | Concise location/layer descriptor displayed beside the index. |

These labels are available in the quick rail, group picker, exact heat key, and selected-muscle readout. They are anatomy metadata owned by the manifest; `MuscleData` remains host-owned training data.

## Events

| Event | Trigger |
| --- | --- |
| `onMuscleSelect(muscleId)` | Exact rendered muscle mask click/tap, heat-key item, focus rail, or grouped list. |
| `onExerciseSelect(exerciseId)` | Contribution row selection. |
| `onAddExercise(muscleId)` | Add-exercise action. |
| `onViewContributions(muscleId)` | Contributions action. |
| `onReturnToOverview()` | Overview/reset action. |

Use the same stable ID in host state and callbacks. The alpha mask is a visual hit-test implementation detail, never an ID source.

## Local display control

`ForearmHeatmap` exposes two local presentational controls:

- **Surface / Deep** chooses the pre-rendered anatomical pass.
- **Volume / Target** chooses `directDynamicSets` or `targetSets` as the heat scale.

Each selected layer presents three synchronized plates: front/palmar, back/dorsal, and thumb-side/lateral. Neither control mutates host data. New host values trigger canvas recompositing only; they do not rebuild mesh assets.
