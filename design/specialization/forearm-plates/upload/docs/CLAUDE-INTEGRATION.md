# Claude integration guide — exact mesh-derived forearm heatmap

## Integrate the controlled component

Sports Genome owns `selectedMuscleId` and `muscleDataById`. The component sends the same stable ID when the user clicks a real rendered muscle, a heat-key item, the focus rail, or the grouped picker.

```tsx
const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleId | null>('brachioradialis');

<ForearmAnatomy
  selectedMuscleId={selectedMuscleId}
  muscleDataById={muscleDataById}
  side={side}
  dateRange={dateRange}
  mode={mode}
  onMuscleSelect={setSelectedMuscleId}
  onReturnToOverview={() => setSelectedMuscleId(null)}
  onExerciseSelect={openExercise}
  onAddExercise={openExercisePicker}
  onViewContributions={openContributions}
/>
```

## How the plate actually connects

`ForearmHeatmap.tsx` loads one shaded base plate and a PNG alpha mask for each muscle visible in its current surface/deep pass. It draws the base onto a 2D canvas, tints each mask from host volume, and reads the same mask alpha for click/tap hit-testing. This is the required identity chain:

```text
stable ID → manifest mesh names → Blender render assignment → PNG alpha mask → canvas tint + canvas hit-test → onMuscleSelect(stable ID)
```

Do not replace this with approximate SVG paths, a detached image, or coordinate-only hit boxes.

## Host data changes

No render is needed when a user’s values change. Update `muscleDataById` and the canvas recomposites from:

- **Volume**: `directDynamicSets`
- **Target**: `targetSets`

The shaded muscle surface remains visible below the color tint. Late host data should continue to be keyed by stable ID so it cannot appear under a different selected muscle.

## Layer behavior

Selecting `deep` muscles switches the local plate state to the deep pass:

- Palmar deep: FDP, FPL, Pronator quadratus.
- Dorsal deep: Supinator, APL, EPB, EPL, Extensor indicis.
- Thumb-side surface: Brachioradialis, FCR, ECRL, and ECRB.
- Thumb-side deep: Supinator, FPL, APL, EPB, and EPL.

Surface selection uses the surface passes. Each current layer shows front, back, and thumb-side plates together. The host owns selection; this local switch never writes back a different ID or creates an event loop.

## Files Claude may edit

1. `src/anatomy/muscleManifest.ts` — stable IDs and exact source mesh-name ownership.
2. `src/anatomy/ForearmHeatmap.tsx` — pass assignments, browser compositing, heat scale, and hit-test threshold.
3. `public/assets/anatomy/mesh-plates/` — shipped base plates and alpha masks.
4. `scripts/generate_mesh_heatmap_plates.py` — deterministic Blender generation for the same pass/mask contract.
5. `src/app/app.css` — presentation only.

If mesh names or pass assignments change, regenerate the assets before shipping. The browser cannot infer new muscle segmentation from the base images.

Run regeneration only when the source model or map changes:

```bash
blender -b --python scripts/generate_mesh_heatmap_plates.py -- \
  --model /absolute/path/to/upper-limb-uncompressed.glb
```

This overwrites `public/assets/anatomy/mesh-plates/` with six plates (front, back, and thumb-side at surface/deep layers) and their matching alpha masks. Commit those generated assets together with the mapping change.

## Stable IDs

```text
brachioradialis, anconeus, supinator,
flexor-digitorum-superficialis, flexor-digitorum-profundus,
flexor-carpi-ulnaris, flexor-carpi-radialis, palmaris-longus,
flexor-pollicis-longus, pronator-teres, pronator-quadratus,
extensor-digitorum, extensor-carpi-radialis-brevis,
extensor-carpi-radialis-longus, extensor-carpi-ulnaris,
extensor-digiti-minimi, extensor-indicis, extensor-pollicis-longus,
extensor-pollicis-brevis, abductor-pollicis-longus
```

## Visible anatomy IDs and tags

Every entry in `muscleManifest.ts` also has a permanent `catalogNumber` and `anatomyTag`. The component renders the number as `F01` through `F20` and pairs it with a plain-language placement tag such as `anterior radial · superficial`. These are display/index metadata only: keep the slug `id` as the host and event identity. Do not derive either identifier from the current ordering of a filtered list.

The F-number and tag appear in the quick rail, grouped picker, exact heat key, and active selection readout. This means all 20 mapped muscles retain a readable identity even when the current surface/deep plate does not show that muscle.

## Guardrails

- Preserve `MuscleId` values; never infer IDs from labels or screen pixels.
- Keep base and mask filenames synchronized with the pass configuration in `ForearmHeatmap.tsx`.
- This is educational anatomy and host-provided training data, not medical measurement or diagnosis.
- There is no runtime WebGL requirement. Asset generation is an offline Blender task, not a client dependency.
