# Sports Genome Forearm Anatomy — implementation plan

## Scope and outcome

Build a reusable, client-side React + TypeScript component demo that Claude can lift into Sports Genome. The demo will use the Open3Dmodel upper-limb GLB as real anatomical source content, load it lazily through Three.js, and keep all workout/user-specific information in replaceable host data. The first complete interaction set is:

- Brachioradialis (`brachioradialis`): outer muscle selection and framing.
- Flexor carpi radialis (`flexor-carpi-radialis`): superficial flexor selection and framing.
- Flexor digitorum profundus (`flexor-digitorum-profundus`): deep-muscle list selection and reveal beneath the superficial layer.

The demo is intentionally not a workout calculator, database, or Sports Genome logo recreation. It demonstrates the integration contract and a polished anatomy interaction with clearly labeled demonstration data.

## Asset decision and constraints

Use the Open3Dmodel upper-limb GLB from the AnatomyTOOL/LUMC project. The archive was verified to contain an `upper-limb.glb` scene with separately named nodes for `Brachioradialis muscle.r`, `Flexor carpi radialis.r`, and `Flexor digitorum profundus.r`, plus surrounding forearm structures. Include the GLB under `public/assets/anatomy/` only with the attribution/license files required by its source terms. Keep the mesh-name mapping in `src/anatomy/muscleManifest.ts`, separate from display/data code.

Source and attribution references:

- Open3Dmodel source/download page: https://anatomytool.org/open3dmodel-create
- Open3Dmodel viewer source and GPL-3.0 notice: https://github.com/djansma/open3dviewer
- Open3Dmodel upper-limb GLB download: https://caskanatomy.info/open3dmodelfiles/upper-limb/upper-limb-glb.zip
- Z-Anatomy source attribution and CC BY-SA 4.0 terms: https://github.com/Z-Anatomy/Models-of-human-anatomy
- BodyParts3D attribution and CC BY-SA 2.1 Japan terms: https://lifesciencedb.jp/bp3d/?lng=en

The model source is suitable for the demo, but its source disclaimers say it is educational and provided as-is; document that it is not medical advice and that attribution/share-alike requirements must be preserved in downstream distribution. If the downstream Sports Genome distribution cannot accept those terms, Claude should replace the GLB through the documented asset boundary rather than silently shipping it.

## Design direction

### Considered directions

- **Clinical instrument panel** — probability 0.07: dense instrument-like controls and clinical white surfaces.
- **Nocturnal sports lab** — probability 0.06: deep navy field, warm orange focal energy, technical typography, and quiet measurement cues.
- **Editorial anatomy plate** — probability 0.04: paper-like background, restrained rules, and archival labeling.

### Chosen: Nocturnal sports lab

**Design movement:** a dark, precision sports-science interface where the model reads like a specimen under a focused examination light.

**Core principles:** the anatomy is the hero; controls are sparse and purposeful; every label explains orientation or action; animation is continuous and physical rather than theatrical.

**Color philosophy:** `#081B30` is the quiet room around the specimen. Blue-gray structures recede without disappearing. `#F15A32` is used only for the active muscle, selection acknowledgement, and meaningful action states. Off-white text carries the actual reading load; muted blue-gray text marks context rather than decoration.

**Layout paradigm:** a left model bay with a small orientation rail and a right reading column on desktop; on mobile the model bay leads and the reading column follows. The panel is not a floating dashboard over the model; it is a connected annotation surface that preserves the selected muscle above it.

**Signature elements:**

1. A slim orange selection rail that links the active muscle label to the information panel.
2. A small “layer” status line that explains when a deeper structure is being surfaced.
3. Quiet segmented controls for `planned` / `completed` and `left` / `right`, styled as instrumentation rather than generic pills.

**Interaction philosophy:** selection is acknowledged instantly in UI state, then the model catches up over 450–800ms. Deep selection comes from the accessible list even when geometry is occluded. Changing selection redirects the current camera/reveal animation instead of resetting to overview. Reduced motion removes the travel/opacity choreography but preserves the final state and clear feedback.

**Animation:** use cancellable GSAP-free native Three.js interpolation for camera target/position, material opacity, and selection outline state. Maintain one transition token per selection so late callbacks cannot apply stale data. Avoid idle spinning and scroll-to-rotate behavior. Reset returns to overview through the same transition pipeline.

**Typography system:** use `Space Grotesk` for headings and section labels, `Inter` for readable body/data copy, and `IBM Plex Mono` for small IDs, units, and status lines. Use sentence case, compact uppercase only for technical eyebrow labels, and a clear numeric hierarchy for volume/target values.

**Brand essence:** Sports Genome turns training exposure into an anatomy-aware readout; precise, calm, teachable.

**Brand voice:** direct and observational. Example lines: “Select a muscle to inspect its contribution.” “Your completed volume is above target for this range.”

**Wordmark/logo:** do not create or alter the Sports Genome logo. The demo uses a text label only to identify the integration surface.

**Signature brand color:** `#F15A32`, reserved for selection and deliberate action.

## Implementation approach

1. Create a Vite React TypeScript app with Three.js and `@react-three/fiber`/`@react-three/drei` only if they reduce implementation risk; otherwise use Three.js directly inside a reusable `ForearmViewer` component to keep the integration surface small. Prefer direct Three.js for predictable resource cleanup and an explicit render loop.
2. Lazy-load the Three.js viewer and GLB only when the component enters the viewport or the user activates the anatomy surface. If WebGL or model load fails, keep the muscle list, panel, and events fully usable.
3. Normalize the host contract in `src/anatomy/types.ts`:
   - `selectedMuscleId`, `muscleDataById`, `side`, `dateRange`, `mode`, `loading`, `error`, `reducedMotion`, and `theme` inputs.
   - `onMuscleSelect`, `onExerciseSelect`, `onAddExercise`, `onViewContributions`, and `onReturnToOverview` events.
   - `MuscleData` fields for function, visible-shape contribution, volume fields, target, contributing exercises, and data-quality status.
4. Load the GLB once per mounted viewer. Index nodes by normalized mesh name. Apply the manifest to stable muscle IDs, visibility layer, camera framing, and reveal settings. Preserve surrounding structures as context.
5. Keep the selected muscle state controlled-but-safe: derive visual selection from the external ID, emit events only from user-originated actions, and use an internal transition token/animation controller so rapid changes and late data cannot mix.
6. Implement camera presets and reveal settings as editable JSON/TypeScript data under `src/anatomy/settings.ts`; deep FDP selection reduces opacity of the mapped superficial layer while keeping bones/context visible.
7. Use an outline pass only for the selected muscle. If the outline path is unavailable on a device, use a restrained emissive/material edge fallback without blocking selection.
8. Render the information panel entirely from `muscleDataById[selectedMuscleId]`; changing volume or any supplied field must update React UI only and must not recreate the Three.js scene.
9. Include a host example with an external “Select FDP” button, a “+10 sets” demo mutation, and event logging. The example must show host-supplied data replacing the initial demonstration data.
10. Add responsive CSS, keyboard navigation, visible focus states, `prefers-reduced-motion` support, touch-friendly controls, and no page-scroll hijacking.

## Project structure

```text
forearm/
├── public/
│   └── manus-routes.json
├── src/
│   ├── anatomy/
│   │   ├── ForearmAnatomy.tsx       # public component and controlled contract
│   │   ├── ForearmHeatmap.tsx       # accessible SVG heatmap and controls
│   │   ├── forearmHeatmapMap.ts     # 20 front/back SVG regions
│   │   ├── types.ts                 # host inputs, events, MuscleData
│   │   ├── muscleManifest.ts        # stable ID metadata and grouping
│   │   └── demoData.ts              # clearly labeled demonstration data
│   ├── app/
│   │   ├── App.tsx                  # host integration example
│   │   └── app.css                  # visual system and responsive layout
│   ├── main.tsx
│   └── vite-env.d.ts
├── docs/
│   ├── CLAUDE-INTEGRATION.md        # direct integration guide for Claude
│   ├── API.md                       # props/events/data contract
│   ├── LIMITATIONS.md               # anatomy and runtime limitations
│   ├── HEATMAP-ANATOMY-SOURCES.md   # anatomy placement sources
│   └── ATTRIBUTION.md               # legacy prototype provenance only
├── package.json
├── tsconfig.json
├── vite.config.ts
├── plan.md
└── TODO.md
```

## Scope boundaries

- No backend, database, workout aggregation, or authentication.
- No new Sports Genome logo or branding asset.
- No anatomically credible articulation is promised in the first pass; the demo focuses on selection, framing, reveal, and data-panel integration. A “Show function” action should be omitted or marked unavailable unless the asset supports credible articulation without stretching meshes.
- The asset is a full upper-limb model, so mobile performance may require Draco/meshopt compression or a narrower derivative later. The first demo should load the verified archive directly, measure the experience, and document the tradeoff.

## Revision — reference-led forearm atlas motion

The specimen-panel treatment is replaced with a quieter **moving forearm atlas** based on the supplied references. The real GLB remains the source of anatomy and selection; it is now presented as a naturally colored, fully visible forearm against the deep-navy field. Bones, tendons, and neurovascular structures supply context while the muscle layer reads in restrained anatomical burgundy. The active muscle remains orange.

The view gains a small editorial set of leader-line callouts—Brachioradialis, Flexor carpi radialis, Flexor digitorum profundus, Pronator teres, Extensor digitorum, and Flexor pollicis longus—so it teaches visible forearm structures without embedding workout facts in the scene. The three supported labels remain selectable; the additional labels are explanatory context only.

The camera makes a slow, seamless orbit around the arm while idle, echoing the supplied around-object reference. Selecting a muscle redirects the camera without a reset and starts a restrained orange tracer that travels around and along the active anatomical region. Reduced motion disables auto-orbit and tracer travel while retaining the selected pose and labels. Manual drag remains available and pauses automatic travel briefly before it resumes.

## Revision — vivid muscle material and direct navigation

The forearm should read as dimensional tissue rather than a flat color plate. Muscle meshes use varied crimson and burgundy tones by anatomical region, low roughness, a subtle matching emissive lift, a warm sculpting key light, a cool edge light, and soft lower fill so bellies and separations hold up against the navy stage. The selected muscle keeps the `#F15A32` signal, a brighter edge, and a clear opacity contrast from surrounding muscle meshes.

Navigation is promoted into a persistent model focus rail: Overview plus every supported muscle are one click away above the model, with visible active state and `0`–`3` keyboard shortcuts outside form controls. The original label controls, drag-to-rotate, scroll/pinch zoom, external controlled selection, and accessible list stay available, so a user can enter by the fastest path for their context.

## Revision — complete ten-muscle map with presentation groups

The verified GLB's separate mesh nodes are now mapped for Brachioradialis, Flexor digitorum superficialis, Flexor digitorum profundus, Flexor carpi ulnaris, Flexor carpi radialis, Pronator teres, Extensor digitorum, Extensor carpi radialis brevis, Extensor carpi radialis longus, and Extensor carpi ulnaris. Multi-head structures retain all relevant source meshes under one stable muscle ID. The UI presents three groups—Landmark, Flexors · anterior, and Extensors · posterior—but every muscle remains independently selectable, controllable, and host-data keyed.

## Revision — 20-muscle forearm atlas

Expand the verified, mesh-backed map to 20 independently selectable forearm structures. The additional ten are Palmaris longus, Flexor pollicis longus, Pronator quadratus, Supinator, Anconeus, Extensor digiti minimi, Extensor indicis, Extensor pollicis longus, Extensor pollicis brevis, and Abductor pollicis longus. They stay in the same three navigation groups—outer/lateral landmarks, flexors/pronators anteriorly, and extensors/posterior-thumb structures—without merging their stable IDs or their host data. Delicate deep or distal meshes remain unobtrusive in overview and are explicitly surfaced when selected, so complete mapping does not reintroduce distracting hand-tendon strands.

## Revision — mesh-tracked labels and filled muscle continuity

The active callout is now anchored to the projected center of the selected real mesh on every render frame, so it moves with the model, camera, and left/right mirror rather than relying on a fixed screen position. Its leader dot terminates at the selected muscle. The overview keeps mapped outer/superficial muscles visible as a more continuous surface, while deep/distal structures remain selectively revealed. Richer region-based muscle color, retained low-level emissive light, reduced fog, and stronger sculpting lights improve separations and volume without adding invented anatomy.

## Revision — full-name selection box

Remove model arrows, leader lines, and abbreviated on-model names. A stationary **Selected structure** box in the model stage now states the full selected muscle name and its layer, while the focus rail and grouped picker remain the interaction controls. The visual model stays free of directional annotation clutter.

## Revision — fixed viewpoint on selection

Muscle selection is a pure anatomical state change: it highlights/reveals the selected mesh but does not move the camera or rotate the model. The viewer has no idle camera orbit. The user alone controls viewpoint through drag and zoom; Return to overview remains the explicit reset action. This preserves visual orientation and makes rapid navigation among the 20 muscles predictable.

## Revision — strong small-muscle reveal

All selections use the original mesh only, including small/deep/distal structures: an emissive orange selected surface and a depth-independent edge outline, with no mirrored or duplicate halo geometry. Selecting a muscle uses its editable camera preset to frame the real mesh. Covering muscles become strongly transparent—most aggressively for deep structures—so the selected source mesh becomes obvious without a confusing second form.

## Revision — filled selected source surface

The selected original mesh draws as a full foreground surface over the transparent context, while retaining its real source geometry. This makes the selection read as a filled anatomical structure rather than a partial strand, with no mesh clone, mirroring, artificial volume, or changed workout data.

## Revision — texture-preserving orange selection

The orange selection state is a restrained tint, not a flat material replacement. It blends from each mesh’s existing regional crimson/burgundy color toward the orange signal and keeps a low emissive lift, preserving the source material’s texture, raking-light shading, and muscle form while still clearly distinguishing the selected structure.

## Revision — rigorous 2D front/back volume heatmap

Replace the rendered 3D viewer with a native SVG forearm heatmap designed for the Sports Genome specialization screen. The stage contains side-by-side **front / palmar** and **back / dorsal** drawn views with 20 separately defined, clickable muscle regions. The front view differentiates superficial flexors/pronators, the intermediate FDS, and the deep FDP/FPL/PQ regions; the back view differentiates the superficial extensors, lateral landmarks, and the deep supinator/thumb/index group. Every SVG region remains keyed to the existing stable muscle ID and receives its fill from host-provided direct-set volume. A shared heat key exposes the date-range maximum; selection opens the existing information panel and adds a crisp outline without creating a 3D surface, arrow, or baked workout values.

### Illustration refinement

Redraw the palmar panel as an original elbow-to-fingertips anatomical schematic closer in logic to the supplied superficial anterior-forearm reference: organic muscle bellies that narrow into individual wrist/hand tendon routes, clearly distinct radial/central/ulnar structures, and no biceps or upper-arm region. Keep this a functional SVG heatmap, not a copied source image or a static illustration.

### Full anatomy-plate redraw

Discard the remaining slab-like schematic geometry. Replace it with a purpose-built hand-up front/palmar and back/dorsal plate: tapered fusiform bellies, fine non-interactive fiber texture, explicit tendon bundles, palmar and dorsal landmark layers, and proportionally narrow wrists/hands. Preserve every stable ID, region click target, host-driven heat fill, accessibility label, and layer control; visual rigor must not turn the diagram into a static image.

### User-authorized illustration base

The supplied anatomy images are authorized by the user for this project. Replace the custom-drawn plate as the visual foundation with cropped front/palmar and back/dorsal portions of that reference artwork. Retain the interactive SVG paths as a low-opacity data layer precisely above the artwork: values alter only the transparent heat tint, selected outline, tooltip/readout, and accessible click target. This separates credible medical illustration from application-state visualization; it also keeps all 20 stable IDs, dynamic host values, layer controls, and the original artwork visually legible.

### Reference plate + exact heat key

The attempted overlay is removed because approximate vector paths compromise the supplied medical artwork. The final visual base is the intact user-authorized forearm/wrist/hand reference plate, cropped to exclude upper-arm/biceps anatomy. The app’s interactive data layer is a separate exact 20-muscle heat key: color intensity, selected state, metric switching, keyboard interaction, and host callbacks occur in ordinary UI, while the medical illustration remains unmodified. This favors clear anatomy and reliable data identity over misleading pseudo-segmentation.

### Exact mesh-derived interactive plates

The separated-mesh anatomical model becomes the actual interaction substrate. A deterministic Blender build will create shaded orthographic anterior/posterior/lateral plates at surface and deep layer settings, along with one transparent alpha mask for every visible stable muscle ID. The browser composites host-derived heat color directly through these masks and uses the same alpha pixels for click/tap hit-testing. This creates a verifiable one-to-one connection between what appears on a plate and the selected ID; it does not rely on approximate traced SVG regions or a detached value grid. The UI shows front, back, and thumb-side plates together, switches passes for surface/deep selection, preserves the normal muscle texture below the color tint, and retains the supplied diagrams only as anatomy references for validation.

### Three-view mesh plate expansion

Add a **thumb-side / lateral** orthographic pass beside the front/palmar and back/dorsal plates. The surface lateral plate emphasizes Brachioradialis, the radial wrist extensors, and Flexor carpi radialis; its deep counterpart emphasizes Supinator plus the thumb flexor/extensor/abductor group. Both passes receive their own rendered base image and exact per-muscle masks. The browser will show three synchronized, same-layer plates on wide screens and stack them on mobile, so the user can inspect front, back, and side relationships without replacing real mesh selection with a proxy control.

### Permanent anatomy IDs and tags

Every one of the 20 entries gains a permanent human-readable anatomy number (`F01`–`F20`) and a location/layer tag in the stable manifest. The label is never derived from filtered display order. The quick rail, grouped picker, exact heat key, and active selection readout all expose both the F-number and tag, while the host and events continue to use the unchanged slug `MuscleId`.

## Build and handoff workflow

- Configure TypeScript diagnostics before the first application-code batch.
- Add `public/manus-routes.json` before starting the preview server.
- Install pinned dependencies with the project’s package manager, build locally, and run the preview on the configured port.
- Validate by code inspection, typecheck/build, then inspect the live preview on desktop and mobile sizes because this task has visual/interaction requirements.
- Demonstrate all three muscle selections, the FDP deep reveal, an external volume change, and programmatic selection from the host example.
- Commit source, asset, attribution, manifest, settings, docs, and build metadata to the managed project’s `main` branch so the checkpoint is recoverable. Do not publish automatically unless the project’s existing publishing setting already authorizes it.
