# Sports Genome — mesh-derived forearm heatmap

A reusable React + TypeScript forearm anatomy surface for Sports Genome. It displays real front/palmar, back/dorsal, and thumb-side **rendered muscle plates**, then composites host-controlled heat color through exact per-muscle alpha masks. Clicking a visible muscle hit-tests that same mask and emits its stable ID.

## Run

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

```bash
pnpm typecheck
pnpm build
```

## What the demo proves

- Six deterministic anatomy render passes: front, back, and thumb-side views at both surface and deep layers.
- Twenty independently selectable stable muscle IDs, each connected to a specific rendered mesh mask.
- Click/tap on a visible rendered muscle uses the exact alpha mask for hit-testing and calls `onMuscleSelect(muscleId)`.
- **Volume** uses host `directDynamicSets`; **Target** uses host `targetSets`. Updating host data recolors the appropriate mesh without rerendering anatomy.
- Selecting a deep muscle changes to the deep plate automatically; front, back, and thumb-side views stay visible for orientation.
- No runtime WebGL, Three.js, Draco decoder, camera, or workout data baked into image frames.

## Key files

| File | Purpose |
| --- | --- |
| `src/anatomy/ForearmAnatomy.tsx` | Host-facing controlled component and information panel. |
| `src/anatomy/ForearmHeatmap.tsx` | Canvas compositing, exact mask hit-testing, metric/layer state, and selection behavior. |
| `public/assets/anatomy/mesh-plates/` | Six shaded plates plus 30 transparent alpha masks and a manifest. |
| `src/anatomy/muscleManifest.ts` | Stable IDs, permanent visible F01–F20 numbers, location/layer tags, mesh-name mapping, groups, and layers. |
| `scripts/generate_mesh_heatmap_plates.py` | Deterministic offline Blender generator for the plate/mask bundle. |
| `docs/MESH-HEATMAP-ANATOMY-SYNTHESIS.md` | Layer decisions, source-backed anatomy rationale, and render assignments. |
| `docs/API.md` | Public inputs, outputs, and event contract. |
| `docs/CLAUDE-INTEGRATION.md` | Claude-specific integration steps and regeneration safeguards. |

## Anatomy scope

The exact mask bundle covers: Brachioradialis, Anconeus, Supinator, Flexor digitorum superficialis, Flexor digitorum profundus, Flexor carpi ulnaris, Flexor carpi radialis, Palmaris longus, Flexor pollicis longus, Pronator teres, Pronator quadratus, Extensor digitorum, Extensor carpi radialis brevis, Extensor carpi radialis longus, Extensor carpi ulnaris, Extensor digiti minimi, Extensor indicis, Extensor pollicis longus, Extensor pollicis brevis, and Abductor pollicis longus.

Every muscle has a fixed displayed anatomy index (`F01`–`F20`) and a location/layer tag. Both are sourced from the manifest, shown in the quick rail, muscle picker, heat key, and selection readout, and remain separate from the stable slug ID used by host callbacks.

## Important limitation

This is an educational training visualization, not a diagnostic or surgical atlas. The browser ships pre-rendered mesh plates and masks; regenerating them requires the documented separated-mesh anatomy source and Blender. See `docs/LIMITATIONS.md`, `docs/ATTRIBUTION.md`, and `docs/MESH-HEATMAP-ANATOMY-SYNTHESIS.md`.
