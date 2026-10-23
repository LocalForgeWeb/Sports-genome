# Sports Genome Forearm Anatomy — delivery checklist

## Reusable anatomy viewer and selection experience

- [x] Create a real interactive forearm model with individually selectable muscles; make it refined and dimensional with smooth camera movement, anatomical reveals, and coordinated information panels.
- [x] When a user selects a muscle, immediately acknowledge the selection; smoothly rotate and frame the forearm; fade obstructing structures when necessary; highlight the selected muscle with a restrained `#F15A32` accent and clear outline; reveal a readable information panel connected visually to the selection; and keep enough surrounding anatomy visible for orientation.
- [x] Switch muscles continuously from the current view without resetting the whole scene between selections; provide clear return-to-overview and reset-view controls.
- [x] Allow selection through both the 3D model and an accessible muscle list; allow deep muscles to be selected from the list when hidden beneath other structures.
- [x] Complete working selections for Brachioradialis, Flexor carpi radialis, and Flexor digitorum profundus, demonstrating an outer muscle, a superficial flexor, and a deep-muscle reveal; keep the architecture extensible.

## External data contract and host integration

- [x] All user-specific information must come from external data supplied by the host app; do not bake text, numbers, charts, or workout data into video frames, textures, or the model.
- [x] Accept replaceable data for stable muscle ID and display name; physical function; qualitative contribution to visible shape; selected date range; planned versus completed mode; left or right side; direct dynamic sets or bouts; supporting exercise exposure; deliberate isometric bouts and hold duration; incidental grip/stabilization exposure; user-defined target if present; exercises contributing to totals; and missing-data or uncertain-mapping status.
- [x] Display supplied information as ordinary readable interface elements beside or below the animated model and allow Claude to change it without editing or re-rendering visual assets.
- [x] Use clearly labeled demonstration data initially; do not build a new workout calculator or database.
- [x] Document inputs equivalent to `selectedMuscleId`, `muscleDataById`, `side`, `dateRange`, `mode` (planned or completed), loading and error states, `reducedMotion`, and theme settings.
- [x] Document events equivalent to `onMuscleSelect(muscleId)`, `onExerciseSelect(exerciseId)`, `onAddExercise(muscleId)`, `onViewContributions(muscleId)`, and `onReturnToOverview()`.
- [x] Support host-controlled programmatic muscle selection; notify the host from model selection using the same stable ID; avoid feedback loops between external selection and emitted selection events.
- [x] Demonstrate model selection emitting an ID, host-supplied information, an external volume update changing the panel without rebuilding the model, and an external button selecting a muscle programmatically.
- [x] Ensure rapid switching cancels or redirects the current animation smoothly and late data for a previous selection never appears under the newly selected muscle.

## Anatomy asset, mapping, and licensing

- [x] Use a suitable existing anatomical model with identifiable, separately selectable muscle meshes; verify its source and usage permissions; include required attribution.
- [x] Do not invent anatomical shapes using generic cylinders or decorative muscle-like objects.
- [x] Preserve the relationship between muscle bellies, tendons, superficial layers, and deep structures; reveal a deep muscle beneath the superficial layer rather than painting it onto the skin surface.
- [x] Keep the muscle-ID-to-mesh mapping in a separate manifest that Claude can adapt to Sports Genome IDs.
- [x] Include the anatomical model and supporting assets where redistribution is permitted, plus source and licensing/attribution documentation.
- [x] If credible movement animation is unavailable, deliver selection/reveal fully and document that limitation separately; do not fake function by arbitrarily stretching or pulsing a mesh.

## Visual, responsive, and technical quality

- [x] Use deep navy `#081B30`, subdued blue-gray surrounding structures, orange `#F15A32` selection accent, off-white main text, muted blue-gray secondary text, and restrained lighting.
- [x] Keep the model as the visual centerpiece; avoid excessive cards, neon effects, spinning idle animations, cluttered labels, and altering or generating the Sports Genome logo.
- [x] Use camera and reveal transitions generally in the 450–800ms range with immediate selection feedback; respect reduced-motion preferences.
- [x] On mobile place the model above the information panel; on larger screens place the panel beside it; keep text readable and controls touch-friendly.
- [x] Optimize for mobile browsers; load the viewer only when needed; keep the selected muscle visible above an open information panel.
- [x] Handle loading failures and unavailable 3D rendering with a usable muscle list and information panel.
- [x] Do not require autoplay audio; avoid turning normal page scrolling into unwanted model rotation.
- [x] Clean up rendering resources when the component unmounts; include a reset-view control; keep data-panel changes independent of the 3D rendering loop.

## Reference-led atlas restart

- [x] Replace the single specimen treatment with a fully visible, naturally colored forearm atlas derived from the real GLB: show muscular anatomy, bone/tendon context, and a restrained orange selected muscle against the deep navy field.
- [x] Add descriptive leader-line callouts for Brachioradialis, Flexor carpi radialis, Flexor digitorum profundus, Pronator teres, Extensor digitorum, and Flexor pollicis longus; the three mapped callouts remain accessible selection controls and the others remain context-only labels.
- [x] Add the requested calm around-the-arm movement: a slow idle camera orbit, a selected-muscle tracer that travels around and along the active anatomical region, selection redirection without a reset, manual drag support, and reduced-motion behavior that holds a stable pose.
- [x] Keep the host-data panel, controlled stable-ID selection, programmatic selection, deep-muscle reveal, mobile layout, fallback list, asset attribution, and reusable component contract intact.

## Muscle depth and navigation refinement

- [x] Give the real muscle meshes richer region-based crimson/burgundy material treatment, sculpting warm/cool light, visible selected-muscle outline, and sufficient opacity contrast so the active structure reads dimensional rather than flat.
- [x] Make navigation immediate through a persistent Overview/muscle focus rail with active state, direct label/model/list selection, drag-to-rotate and scroll/pinch zoom guidance, plus `0`–`3` keyboard shortcuts outside form controls.
- [x] Map ten real, separately selectable GLB structures—Brachioradialis, FDS, FDP, FCU, FCR, Pronator teres, ED, ECRB, ECRL, and ECU—and present them as distinct muscles inside three clear groups: Landmark, Flexors · anterior, and Extensors · posterior.
- [x] Expand the real GLB-backed anatomy map to 20 independently selectable muscles by adding Palmaris longus, Flexor pollicis longus, Pronator quadratus, Supinator, Anconeus, Extensor digiti minimi, Extensor indicis, Extensor pollicis longus, Extensor pollicis brevis, and Abductor pollicis longus; retain individual stable IDs, host-data entries, camera settings, and three clear navigation groups.
- [x] Anchor the active atlas label and leader-dot to the projected center of the actual selected mesh while the camera moves, restore mapped outer/superficial muscle continuity in overview, and use richer material/light treatment without restoring unwanted vessels, nerves, or connective-sheet clutter.
- [x] Remove abbreviated on-model muscle names and all arrow/leader annotations; show a simple stationary box with the full selected muscle name and layer instead.
- [x] Superseded: keep the camera/viewpoint fixed whenever a muscle is selected from the top focus rail, model, grouped picker, or host control; selection may only change highlighting and layer reveal, while drag/zoom remain manual and Return to overview stays the explicit reset.
- [x] Superseded: give every selected muscle, including small/deep/thumb structures, the same strong camera-stable visual reveal with a halo through faded context.
- [x] Frame the original selected mesh using its camera preset, remove all duplicate/halo muscle geometry, and make covering muscles extra transparent—most aggressively for deep/small targets—so the actual selected muscle is unmistakable.
- [x] Render each selected original mesh as a fully filled foreground surface over the faded context, without cloning, mirroring, or inflating its geometry.
- [x] Keep the original selected muscle’s regional color variation, lighting, and texture legible beneath a restrained orange tint; do not replace its material with a flat orange overlay.
- [x] Replace the 3D viewer with a rigorous 2D SVG forearm volume heatmap: separate front/palmar and back/dorsal drawings; individually defined clickable regions for all 20 mapped muscles; visible superficial/intermediate/deep distinctions; host-driven color intensity for direct-set volume; a clear shared heat key; and no baked workout values or 3D rendering dependency.
- [x] Refine the front/palmar drawing into an original elbow-to-fingertips muscle-belly and tendon schematic: distinct radial, central, and ulnar shapes; visible tendon routes into the hand; and no biceps or upper-arm drawing.
- [x] Reorient the palmar drawing hand-up to follow the supplied anatomical-reference logic and include distinct flexor-retinaculum, palmar-aponeurosis, and tendon-fan landmarks without copying the source image.
- [x] Replace the remaining slab-like SVG composition with an original illustrated anatomy plate: tapered fusiform muscle bellies, fine muscle-fiber texture, individually routed tendon bundles, a matching dorsal plate, and the same 20 host-keyed heatmap regions.
- [x] Superseded: use the user-authorized public-use anatomy illustration as the visible forearm/wrist/hand-only front/back base with a separate heat key. It did not create a real anatomy/data connection.
- [x] Replace the disconnected reference plate with a model-derived front/back heatmap: generate shaded surface and deep render passes plus per-muscle alpha masks from the 20 separately named anatomical meshes; composite host volume directly on those masks, let click/tap hit-test the same masks, and switch to the appropriate layer for deep selections. Evidence: 20 stable IDs validated across 4 passes/25 PNG assets; direct canvas hit-test emits a stable ID; host volume update recomposites without rebuilding the asset bundle.
- [x] Add a third exact thumb-side/lateral view to both surface and deep modes, with real mesh-rendered base plates, matching alpha masks, click/tap hit-testing, and a readable three-view layout alongside front/palmar and back/dorsal. Evidence: 6 passes / 36 PNG assets validated; all 20 stable IDs remain covered across layer passes.
- [x] Give every mapped muscle a permanent visible anatomy number (`F01`–`F20`) and concise anatomical location/layer tag in the manifest, quick rail, grouped picker, heat key, and selected-muscle readout without changing the stable host/event `MuscleId`. Evidence: 20 catalog numbers and tags validated; live F20 deep-thumb selection carried its ID/tag through the heat key and selected readout.

## Handoff artifacts and validation evidence

- [x] Deliver a working interactive demo.
- [x] Deliver downloadable source code and dependency/version information.
- [x] Deliver the anatomical model and supporting assets where redistribution is permitted.
- [x] Deliver source and licensing/attribution documentation.
- [x] Deliver the muscle-ID-to-mesh manifest.
- [x] Deliver editable camera and reveal settings for each supported muscle.
- [x] Deliver example host integration with replaceable demonstration data.
- [x] Deliver a concise integration guide specifically for Claude.
- [x] Deliver known limitations and any external service requirements.
- [x] Before finishing, demonstrate selecting all three muscles, revealing FDP beneath the superficial layer, changing displayed volume through external data, and selecting a muscle programmatically.
