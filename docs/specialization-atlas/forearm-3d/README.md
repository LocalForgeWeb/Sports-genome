# The 3D forearm (SG-FOREARM-INTEGRATION-20261019)

> **20 Oct 2026, owner: "there's no reason for a left and right arm."** The atlas now counts both arms as one. See [Both arms as one](#both-arms-as-one-20-oct-2026) below. Wherever this page mentions a left arm, an arm switch or a mirrored model, it describes the first release (`11ee5aa9`).

The supplied 3D forearm viewer runs inside the existing forearm atlas. It is the map on **Body Lab → Specialize**. Its numbers come from the atlas's own calculator. The task ledger, with evidence, is in [SG-FOREARM-INTEGRATION-20261019.md](SG-FOREARM-INTEGRATION-20261019.md).

## Route and behaviour

- **Route:** `/?workspace=specialization&region=forearm`. The page keeps its parameters: `node`, `limb`, `window`, `from`/`to`, `mode`, `view`, `layer`, `map` and `pweek`. One new parameter, `fig=model|drawing`, records the athlete's choice of figure. With no `fig` the page picks automatically: the 3D model when the region has one and the browser can draw WebGL, otherwise the drawing.
- **Deep links** from Review your week and from Body Lab work as before. `node=forearm.fcu` opens with that muscle framed on the model.
- **Layout on a phone, top to bottom:**
  1. Heading and Back.
  2. Completed/Planned, the arm, and the window.
  3. **Muscle map**, with a **3D model | Drawing** switch.
  4. The **row of muscles** (since 20 Oct 2026; it replaced "Choose muscle"): Overview, then the model's 20 structures, numbered. Swipe along it, tap one.
  5. The stage. It is a fixed `clamp(300px, 54svh, 540px)` tall and shows the **Selected structure** box (name and layer) at its top left, as the supplied demo did.
  6. The panel:
     - the muscle's function;
     - its direct dynamic bouts, and the athlete's target when its period is the window on screen;
     - supporting, holds and incidental work, each on its own row;
     - the contributing exercises (View);
     - **View contributions** (opens the muscle sheet's ledger) and **Add exercise** (the existing add flow, with week and day);
     - folded sections for shape, what the numbers mean, and **About the 3D model** (credits).

   The muscle list, findings and disclosures follow unchanged. The 22-muscle list never sits between the model and its panel.
- **The row of muscles** (`ModelMuscleRail.tsx`) is the supplied demo's focus rail, rebuilt for a phone after the owner sent a recording of it ("it should be more like this", 20 Oct 2026):
  - Overview first, then the 20 structures in the manifest's order, numbered 1–20.
  - One tap selects a muscle and the model frames it at once; there is no sheet.
  - Each chip is a 44 px target in the app's type, solid at rest, the selected one lit orange.
  - The row scrolls sideways by itself and brings the selected chip into view; the page does not move (checked in the browser: 0 px across six taps).
  - The upper-arm muscles credited here are not in the model, so they are not in the row; they open from the page's muscle list, and the model's box says "Not in the 3D model".
  - It replaced the "Choose muscle" sheet of the first release, which took two taps and moved the page.
- **One selection state:** `state.nodeId`, a canonical id, kept in the URL.
  - A tap on the model maps the source id to its canonical id and selects that muscle. Tapping the selected muscle again keeps it. **Overview** clears the selection.
  - An address naming an unknown muscle shows the whole forearm, with a line saying which id was not found.

## Identity adapter (`client/src/components/specialization/anatomy3d/modelIdentity.ts`)

`forearmModelSourceToCanonical` holds one explicit row for each of the 20 structures, mapping the viewer's source id (`flexor-carpi-ulnaris`) to its canonical atlas id (`forearm.fcu`).
- Anconeus is the 20th row: `forearm.anconeus`, adjacent, kept apart from the 19 core muscles.
- `canonicalForModelSource` and `modelSourceForCanonical` are exact lookups. An unknown id returns `null`.
- Nothing is matched by substring, name or case. No database record is renamed. The GLB is untouched.
- Multi-head muscles are one manifest entry each, listing every head's mesh: FDS (humero-ulnar and radial heads), FCU, pronator teres and ECU (humeral and ulnar heads). Selecting the muscle lights every head.

`modelIdentity.test.ts` checks:
- 20 rows, one to one in both directions;
- every manifest entry is covered;
- every canonical id is a selectable node;
- no substring or name matches;
- multi-head entries list at least two meshes;
- no mesh belongs to two muscles;
- **every mesh name is in the GLB that ships**, read from the GLB's JSON chunk, with the file's SHA-256 equal to `SHA256SUMS.txt`.

## Data adapter (`viewerData.ts`)

`viewerMuscleData({ data, nodeId, state, view })` turns the page's summary into the panel's fields. It reads the summary for the arm, mode and window on screen; there is no second calculation.

| Viewer field | From the summary | Notes |
|---|---|---|
| `directDynamicSets` | `directDynamicBouts`, `directDynamicReps` | One bout per set. A drop set is one bout. Two-handed work counts for each arm. |
| `supportingExerciseExposure` | `contributingDynamicBouts`, unit `bouts` | |
| `deliberateIsometricBouts` | `deliberateHoldBouts` | |
| `isometricHoldSeconds` | `deliberateHoldSeconds` | `null` when holds were logged with no time. |
| `incidentalGripExposure` | `incidentalBouts`, unit `bouts` | Never direct sets. |
| `targetSets` | the athlete's `direct_dynamic_bouts` goal | Only when its period is the window: calendar week with This week (same time zone), rolling 7 days with Rolling 7 days, or a plan week. Otherwise listed under Your targets with its own period. There is no default. |
| `exercises` | `ledgerByExercise(contributions)` | The real records, with catalog ids. |
| `physicalFunction` | `node.whatItDoes` and the node's actions | Flagged when the node is not reviewed. |
| `visibleShapeContribution` | `node.shapeNote`, `caveats` | Flagged when no appearance claim is reviewed. |
| `dataStatus` / `dataNote` | | See the list below. |

`dataStatus` takes one of these values:
- `loading` and `error` carry no numbers;
- `unavailable` is an id the region does not have;
- `missing` means no reviewed mapping: every number is `null`, never 0;
- `partial` covers pending review, no arm recorded, unclassified bouts, or matches by name;
- `zero`;
- `complete`.

The summary is computed synchronously on the device, so a slow, stale response cannot reach the panel. It is cached by account scope, so accounts stay separate as before. A data change never touches the canvas: the canvas receives only the selected source id, the arm and the reduced-motion setting.

## The canvas (`ForearmCanvas.tsx`) and what changed from the supplied one

These parts are kept as supplied:
- renderer settings: ACES tone mapping, exposure 1.46, soft shadows, fog `#061827`, field of view 31°;
- the five lights;
- the material palette and per-mesh tones;
- the filtering of the GLB down to the forearm;
- the reveal presets: outer, superficial and deep;
- the orange selection: a 58% tint toward `#F15A32`, emissive 0.12, and an edge outline;
- the camera presets and easing;
- the 7 px tap-versus-drag threshold.

The integration made these changes:
- The model and decoder URLs are props. They come from `anatomyModelFor()`, which uses `import.meta.env.BASE_URL` and can be overridden by `VITE_ANATOMY_FOREARM_MODEL_URL` and `VITE_ANATOMY_DRACO_PATH`.
- **Left arm (first release only).** The camera presets' x was mirrored with the model (the supplied code mirrored the model but not the camera), and picking on the mirrored model was checked in the browser. Since 20 Oct 2026 the page always shows the one right-arm model, unmirrored. The canvas keeps its `side` prop for a region that may need it.
- **Overview** frames the middle of the forearm and hand it shows. The supplied target was the middle of the whole upper-limb file, most of which is hidden, so the forearm sat low and to one side.
- **`depthTest = false` review.** The selected muscle still draws over the faded context, which is the approved look. While selected it draws front faces only, so its far side cannot paint over its near side. There is one outline per mesh and no added halo.
- **Rendering on demand.** Frames run while the camera eases, while the controls move, and for 90 frames after a drag, so the damping is spent. Rendering pauses while the page is hidden or the canvas is off screen. Measured: 0 frames in 2 s idle.
- Dragging cancels an automatic camera move. A new selection starts from the current camera, so it interrupts the old move.
- Reduced motion jumps to the final pose. There is no orbit and no tracer: the supplied tracer was never created and has been removed. There is no "Show function" animation.
- Failures are reported apart, and the list and the row of muscles keep working through all of them:
  - `webgl`: WebGL cannot start. The page offers the drawing.
  - `model`: the GLB, the decoder or the lazy chunk failed. **Try again** builds a new canvas.
  - `context-lost`: the device dropped the context. **Reload the model**.
- Cleanup disposes geometries, materials, **textures**, the decoder's workers, the controls, the render lists and the renderer, then calls `forceContextLoss()`.
- The pixel ratio is capped at 1.7.
- three.js (0.179.0, the supplied version) loads only in the lazy `ForearmModelView` chunk: 613 kB, 158 kB gzipped. It loads only when the 3D stage is on screen, and only on this page.

## Assets

| File | What | Provenance |
|---|---|---|
| `client/public/assets/anatomy/upper-limb-open3dmodel.glb` | 6,799,076 bytes | Open3Dmodel upper limb, unmodified. SHA-256 `9a8b8249…9d82dfe`, as in `SHA256SUMS.txt`. |
| `client/public/draco/draco_decoder.js`, `.wasm`, `draco_wasm_wrapper.js` | The glTF Draco decoder | Byte-identical to three.js 0.179 `examples/jsm/libs/draco/gltf/`. |

Both are served from the app's origin. The SPA rewrite in `vercel.json` skips paths that contain a dot. The report-only CSP now lists `'wasm-unsafe-eval'` so that the decoder's WebAssembly is not reported. No compression was added.

## Attribution and licences

The model is **third-party work**; Sports Genome did not make it.
- **Open3Dmodel** upper-limb model: https://anatomytool.org/open3dmodel-create. Download: https://caskanatomy.info/open3dmodelfiles/upper-limb/upper-limb-glb.zip
- **BodyParts3D**, The Database Center for Life Science, CC-BY-SA 2.1 Japan: https://lifesciencedb.jp/bp3d/?lng=en
- **Z-Anatomy**, the libre 3D atlas of anatomy, CC-BY-SA 4.0: https://github.com/Z-Anatomy/Models-of-human-anatomy
- **Open3Dmodel viewer code** (open3dviewer), GPL-3.0: https://github.com/djansma/open3dviewer

The share-alike terms apply to the model and to anything derived from it. The page credits these sources in **About the 3D model** (`AnatomyModelCredits.tsx`) and says that the model is for education, not diagnosis.

Since 23 Oct the forearm's **Drawing** is derived from this model too: the owner's rendered plates (`client/public/assets/anatomy/forearm-plates/`, adapted renders shared under CC BY-SA 4.0), credited under the drawing in the same terms ([08-diagram.md, "Plates"](../08-diagram.md)).

The supplied attribution note asks for a legal review before commercial redistribution. That review is still open and is the owner's decision. If the terms cannot be accepted, replace the GLB and the manifest; do not present the asset as proprietary.

**Code provenance:**
- `muscleManifest.ts` and `settings.ts` are the supplied files, kept as supplied, with headers that say so.
- `ForearmCanvas.tsx` is the supplied scene, adapted. Its header lists the changes.
- Everything else under `anatomy3d/` is new integration code:
  - `modelIdentity.ts`, `viewerData.ts`, `ForearmModelView.tsx`;
  - `AnatomyModelStage.tsx`, `ModelMusclePanel.tsx`, `ChooseMuscleSheet.tsx`, `AnatomyModelCredits.tsx`;
  - `anatomy3d.css`, `modelTypes.ts`;
  - the tests.
- These parts of the supplied demo were not imported:
  - the demo shell (`ForearmAnatomy.tsx`, with its header, the 20-pill focus rail, number-key shortcuts, info column with `?? 0` fallbacks, legend, footer and event log);
  - `App.tsx` and `app.css` (global `:root`, `body` and `button` styles, and the Google Fonts import);
  - `demoData.ts`.

## Corrections to the supplied docs

- The supplied `LIMITATIONS.md` says "three required muscles" and describes "a slow visual camera orbit and a selected-muscle tracer". In fact there are 20 structures, and the supplied code ran neither an orbit (`autoRotate` was always false) nor a tracer (never created). The integration has neither.
- The supplied stack was React 19.1, Vite 6.3 and Google Fonts. The app is React 19.2 and Vite 7 with its own type. Only `three@0.179.0` and `@types/three@0.179.0` were added, and the lockfile was updated by pnpm, not replaced.

## Maintenance

- **Re-framing a muscle:** edit `settings.ts`, which holds the presets for the right-arm model the page shows.
- **A new or renamed mesh:** edit `muscleManifest.ts`. `modelIdentity.test.ts` fails if a name is not in the GLB.
- **A new structure:** add a manifest entry, a canonical node, and one row in `forearmModelSourceToCanonical`. The tests require a one-to-one mapping.
- **A different GLB:** replace the file, update `SHA256SUMS.txt`, and rerun `modelIdentity.test.ts`.
- **Another region:** `anatomyModelFor(regionId)` returns `null` for every region except the forearm. A region's model is a new config there plus its own manifest and adapter.
- **Tests:**
  - `modelIdentity.test.ts` (9 tests);
  - `viewerData.test.ts` (14, traced from real logged workouts through the calculator);
  - `Atlas3d.render.test.ts` (23, the page with only the WebGL canvas replaced).
- **Browser checks:** `evidence/browser-checks.json`. They ran in headless Chromium 141 with SwiftShader WebGL and iPhone emulation, not on an iPhone or in Safari.

## Both arms as one (20 Oct 2026)

The owner's instruction was "there's no reason for a left and right arm". What changed:

- **The calculator** gained a summary side `"both"` (`SummarySide`). It counts each set once per muscle, whichever arm did it:
  - a one-arm set and a two-handed set count once each;
  - a set with no arm recorded counts too;
  - nothing is kept apart as "no arm recorded" (`unknownSide` stays 0);
  - a target counts work from either arm.

  The per-arm sides still work, and their tests are unchanged. Tests: `exposure.bothArms.test.ts`.
- **The page** reads one summary, `side: "both"`:
  - the Left arm / Right arm switch is gone, along with the other-arm comparison finding and the "trailing arm" suggestion;
  - the arm is gone from every heading, sentence and caption;
  - the 3D model is never mirrored and has no arm caption;
  - "How this is counted" states the both-arms rule.

  The address no longer has `limb`: an old link's `limb=left` is dropped on the page's first rewrite.
- **Targets** name no arm and have no "Which arm" choice. A new target is saved once; its stored `side` is a placeholder that nothing reads. A target saved earlier as "Both arms" (two copies, one per arm) reads as one: `collapseArmPairs` keeps the right copy, and the next write drops the other. A target saved for one arm only stays, and counts work from either arm.
- **Measurements** show every reading in one series, with no arm chooser. A new reading's stored arm is a placeholder.
- **The logger** asks no arm (`askSide: false`), and a planned one-arm set is one row per planned set (`oneArm: false`; the per-arm rows for athletes with a target are off). A set logged with an arm before this change keeps it, and the page counts it like any other set. The plan already counted a one-arm set as one bout per planned set, so planned and logged agree.
- **Fixes made along the way.** Several helpers had skipped sets with no arm recorded, because a one-arm summary keeps those apart. In a both-arms summary such a set is ordinary work, and they now count it: the drawing's shading (`directWorkBouts`), the per-day bars, "Exercises in this window", overlaps, the movement ledger and suggestions.
- **Not changed:** the database schema. Goals and measurements are stored on the device; the schema's `side` check stays `left`/`right`, and nothing writes "both" to it. The overlap message no longer names an arm.

Evidence (headless Chromium, iPhone emulation): `evidence/both-arms-*.png`. In the browser, the page showed no arm buttons, an old `limb=left` address was cleaned, and a one-arm exercise in the logger asked no arm.
