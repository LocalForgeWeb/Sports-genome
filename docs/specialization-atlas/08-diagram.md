# Specialization atlas: the forearm diagram (16 Oct 2026)

The drawing on the specialization page (brief §6 "Diagram specification", design §7 and §12): the subject's right forearm from the palm, from behind and from the thumb side, in surface, middle and deep layers, with muscle bellies drawn apart from tendons and every selectable shape tied to a node id. It is a **schematic**: original artwork built from hand-placed landmarks, not a dissection photograph, not traced from any illustration or 3D model, and not an AI-generated image. It shows where each muscle is and how deep; it does not show how big anyone's muscles are or will be.

## Files

| Piece | File |
|---|---|
| Curve helpers (centripetal Catmull-Rom, bands, cross-sections) | `design/specialization/forearm/geometry.mjs` |
| Arm outlines and their edges | `design/specialization/forearm/silhouettes.mjs` |
| The three views, layer by layer | `design/specialization/forearm/views/{palm,back,thumb}.mjs` |
| Ids, node ids, licence note | `design/specialization/forearm/asset.mjs` |
| Writer of the generated asset | `design/specialization/forearm/emit.mjs` → `shared/specialization/regions/forearm/diagram.generated.ts` |
| Gutter and overlap check while drawing | `design/specialization/forearm/check.mjs` |
| Quick preview, no app | `design/specialization/forearm/preview.mjs` |
| Evidence through the real component | `design/specialization/forearm/render-evidence.mjs` (+ `evidence-entry.tsx`) |
| Evidence on the real page | `design/specialization/forearm/render-page.mjs` |
| Renderer | `client/src/components/specialization/SpecializationDiagram.tsx`, `diagramGeometry.ts`, `specialization-diagram.css` |
| Tests | `client/src/lib/specialization/forearmDiagram.test.ts` (manifest, layers, orientation), `client/src/components/specialization/SpecializationDiagram.render.test.ts` (renderer) |

To change the drawing: edit a view, then

```
node design/specialization/forearm/check.mjs        # gutters and overlaps per layer
node design/specialization/forearm/emit.mjs         # rewrite diagram.generated.ts
npx tsx scripts/specialization/emit-seed.ts         # the seed carries the drawing (drift guard)
node design/specialization/forearm/render-evidence.mjs --scale=2
```

The manifest test fails if the committed asset is not exactly what `emit.mjs` writes, and the seed test fails if the seed was not regenerated.

## How it is drawn

- **Canvas.** 360 × 760 view-box units. Every view shares the same heights: epicondyles at y ≈ 104, elbow crease ≈ 114, wrist crease ≈ 600, knuckles ≈ 712. The upper-arm stub is cropped at the top and the fingers at the bottom, so tendons run on toward where they attach. The forearm is drawn straight (no carrying angle) so the three views line up. Scale is about 20 units per centimetre along the forearm; the hand is shortened.
- **Outlines.** Each arm outline is a list of points along its two edges, smoothed with centripetal Catmull-Rom curves (no loops, no overshoot). The back view's outline is the palm view's mirrored, since it is the same arm seen from behind.
- **Bellies as cross-sections.** Most bellies are written as a table of horizontal slices, `[y, thumb-side edge, pinky-side edge]`, the way an atlas slices a limb, closed by a pointed origin and a tip or lobes where the muscle hands over to its tendons. Writing neighbours at the same heights is what keeps the gutter between them even; `check.mjs` reports every pair of bellies closer than 8 units, and the manifest test fails on any overlap. Oblique bellies (the thumb muscles crossing to the thumb) are bands along a centreline with a width profile.
- **Tendons** are narrow bands along a centreline, pointed where they leave the belly (they start inside its tip, as the tendon forms within the muscle) and square where they attach.
- **Output** is absolute `M`, `C`, `L`, `Z` only, one decimal, so the seed and any renderer read it the same way. 127 paths, 112 KB raw, about 32 KB gzipped, in the page's lazy `registry` chunk.

## Orientation (right arm; the left arm is the mirror image)

- **Palm view.** Anatomical position, palm toward you: the **thumb side is on your left**, the pinky side on your right; lateral epicondyle top-left, medial epicondyle top-right.
- **Back view.** Seen from behind: the **thumb side is on your right**, the pinky side on your left; the point of the elbow (olecranon) top-centre-left.
- **Thumb-side view.** The radial side faces you. Walking round the thumb side from the palm view to the back view, the **back of the forearm is on your left and the palm side on your right**; the olecranon is at the back of the elbow, top-left. The hand is seen edge-on with the thumb nearest, reaching down toward the palm side.

Every palm and back layer is labelled "Thumb side", "Pinky side", "Elbow" and "Wrist"; every thumb-side layer "Palm side", "Back side", "Elbow" and "Wrist". The renderer mirrors the drawing for the left arm and re-places the labels (x mirrored, start and end anchors swapped), so the words land on the right side and are never drawn backwards.

## What each layer shows

| View · layer | Bellies (selectable) | Also drawn |
|---|---|---|
| Palm · surface | brachioradialis, pronator teres, flexor carpi radialis, palmaris longus, flexor carpi ulnaris; biceps (upper-arm stub, as a landmark) | their tendons; the palmaris tendon fanning into the palm as four slips; the biceps tendon dipping into the hollow in front of the elbow; the elbow crease and the medial epicondyle (the lateral one lies under the origins of brachioradialis and the radial wrist extensors from the front, so it shows only in the deep layer) |
| Palm · middle | flexor digitorum superficialis (both heads, four slips) | its four tendons through the wrist to the fingers; the surface muscles as dashed ghosts |
| Palm · deep | flexor digitorum profundus, flexor pollicis longus, pronator quadratus, supinator (round the neck of the radius), brachialis (stub) | the four FDP tendons and the FPL tendon to the thumb, drawn over pronator quadratus; humerus, radius, ulna |
| Back · surface | brachioradialis (its edge), extensor carpi radialis longus and brevis, extensor digitorum, extensor digiti minimi, extensor carpi ulnaris, anconeus, flexor carpi ulnaris (the part behind the ulna's border); **abductor pollicis longus and extensor pollicis brevis as partial outcrops** | the tendons over the back of the hand; the extensor pollicis longus tendon where it crosses the wrist; the ulna's border; the olecranon and the medial epicondyle |
| Back · deep | supinator, abductor pollicis longus, extensor pollicis brevis, extensor pollicis longus, extensor indicis | their tendons to the thumb and the index finger; humerus, radius, ulna, the membrane between them; the surface extensors as ghosts |
| Thumb side · surface | brachioradialis (this view's contour), extensor carpi radialis longus and brevis, the edge of extensor digitorum, anconeus, the edge of flexor carpi radialis, biceps (stub); **APL and EPB as partial outcrops** | the radial wrist extensor tendons, the BR tendon to the styloid, the FCR tendon, the APL, EPB and EPL tendons to the thumb; the olecranon |
| Thumb side · deep | supinator, flexor pollicis longus, abductor pollicis longus, extensor pollicis brevis, extensor pollicis longus, brachialis (stub) | their tendons; humerus, radius, the point of the ulna; BR, ECRL and ECRB as ghosts |

All 19 core muscles are drawn as a belly in at least one view and layer (tested). The anconeus (adjacent) and the biceps and brachialis (external, upper arm) are drawn too, so selecting them from the list highlights them.

## Layer rules (tested)

- A belly is drawn only on its node's own layer (`nodes.ts`): surface muscles on surface layers, flexor digitorum superficialis on the palm's middle layer only, deep muscles on deep layers.
- **The exceptions are listed in the asset** (`forearmDiagramOutcrops` in `diagram.generated.ts`, each with its reason) and tested one by one: abductor pollicis longus and extensor pollicis brevis on the back and thumb-side surface layers, where they come to the surface a few centimetres above the wrist and cross the radial wrist extensor tendons toward the thumb. Only deep nodes whose `surfaceVisibility` is not `not_distinct` may be listed. **Each outcrop is cut from the very outline the deep layer draws for that muscle in the same view** (`clipBelow` in `geometry.mjs`), below the height where extensor digitorum and the radial wrist extensors stop covering it: changing layer never moves the muscle, and the surface never shows muscle where the deep layer shows its tendon. The test samples each outcrop and requires it to lie within the deep belly, to start well below that belly's upper end, to end where it ends, and to be under three quarters of its area; the square upper end is where it goes under its neighbours.
- Pronator teres is drawn partially within its own layer: its insertion lies under brachioradialis, so the belly stops at that muscle's edge.
- **The same muscle ends at the same height in every view that shows its lower end** (tested within 20 units, about 1 cm): BR and FCR in the palm and thumb-side views, ECRL and ECRB from behind and from the thumb side, FPL, and APL, EPB and EPL in both deep layers and both outcrops. Views that show only an edge of a muscle (BR from behind, ED from the thumb side, FCU from behind) are cut by the view and not compared.
- **Landmarks sit on their bones.** The back view's line between ECU and FCU is the ulna's subcutaneous border and lies over the ulna drawn in the deep layer from elbow to wrist; the olecranon and epicondyle marks on each surface layer lie over bone in the same view's deep layer (tested).
- Tendons are never selectable and never exposure-coloured. A deep muscle's tendon may appear on a surface layer where it really surfaces (EPL at the wrist); its belly does not.
- No two bellies on a layer overlap, and every belly stays inside the arm outline.

## The renderer

- **Contract.** `SpecializationDiagram` keeps the page's props (`asset`, `view`, `layer`, `mirrored`, `fillFor`, `selectedNodeId`, `onSelect`, `labelFor`, `describeFor`, `caption`) and names no region: a test reads its source for region and muscle words, and the deltoid fixture renders through it unchanged.
- **Fills match the legend beside it.** `bin` n paints `--sg-exposure-n` (held to 1–5), `zero` the resting muscle tone with a dashed `#9fb3c8` edge ("Mapped, no direct work"), `hatch` the legend's own hatch (`#2e3a49` with `#6f7d90` stripes slanting the same way, "Mapping not reviewed"; on the left arm the pattern is flipped back inside the mirrored drawing, so the stripes still slant the legend's way, tested), `none` the resting tone ("Not targeted"). The test compares these with `specialization.css`. Tendons are a cool neutral grey that is not on the ramp; ghosts are dashed outlines; bone is a lighter dark with its own edge. Rank colours are never used.
- **Selection** is an outline and a name, not a hue: from the edge outwards a dark keyline, a gold line, a dark keyline and a soft gold halo, drawn round the muscle's bellies and tendons as one shape (the outline is masked off inside them, so there are no crossing lines where a tendon starts inside its belly; readable on the palest exposure step and on the dark ground), and the muscle's abbreviation in a pill in the margin on its side, with a leader line to the muscle's widest point on the canvas (a belly that runs off the top, such as BR from behind, is pointed at where it is drawn), kept off the anatomy labels.
- **A selection never drops.** When the selected muscle is not on the layer shown, the caption says where it is ("FDS is not drawn on this layer. It is drawn in Palm · Middle."), as a note the drawing points to with `aria-describedby`; when it lies above the layer, its dashed ghost turns gold and the note says so.
- **Tap targets.** One square per muscle, 14.5 % of the drawing's width: 44.5 px on a 375 pt phone (drawing 307 px wide) and 46.5 px on a 390 pt phone (321 px), placed inside the muscle's own belly and clear of every other muscle's square and of the canvas edge. The squares sit above the bellies, so a tap on a neighbour under a square selects the square's muscle: among the places that keep the square clear, each takes the one that covers the least of other muscles as drawn (measured, then bounded by a test: on the back surface 4.9 % of drawn belly area lies under another muscle's square, down from 12.9 %; thumb-side surface 4.4 %, from 10.2 %). Two thin neighbours cannot both have a 44 pt square without one covering part of the other: EPB loses about a quarter of its drawn area to APL's square on the back surface and a third to EPL's on the thumb-side deep layer. Under the squares, each belly as drawn takes taps on itself, and each belly widened across its gutters takes taps in the gaps. On a 320 pt screen the drawing is about 254 px wide and the squares about 37 px; 320 pt is below the phones the app is designed for (CLAUDE.md: 375 to 430 pt). Labels and the selected muscle's name let taps through. Measured in Chromium with `elementFromPoint` on every layer, every muscle has a square of screen at least 47 px across that selects it and nothing else (`evidence/hit-targets.json`, drawing 324 px wide).
- **Keyboard and assistive technology.** Each muscle is a `role="button"` with `aria-pressed` and the page's `describeFor` text; one tab stop, which moves with focus (roving tabindex), so Tab from a muscle reached with the arrows leaves the drawing and Shift+Tab comes back to it; arrow keys, Home and End move through the muscles top to bottom, Enter or Space selects. Keyboard focus draws a blue outline (the focus token, never the selection gold), and only for keyboard focus: a finger tap does not leave it behind.
- **Motion.** Fills change over `--sg-motion-base`; nothing moves on its own; reduced motion removes the transition.

## Evidence (headless Chromium emulating an iPhone; not an iPhone, not Safari)

Rendered through the real component, its CSS and the app's tokens, on a page card at 390 pt, device scale 2, with fills cycling through every kind so neighbours can be told apart and one muscle selected per figure:

| File | Checked |
|---|---|
| `diagram-palm-surface-right.png`, `-left.png` | thumb side left (right arm) / right (left arm); BR on the thumb-side border from above the elbow to the styloid; PT, FCR, PL, FCU fanning from the medial epicondyle with PT slanting under BR; FCR tendon to the thumb side of the wrist, PL tendon to the middle and its four slips, FCU to the pisiform; FCU selected and named; labels not mirrored |
| `diagram-palm-intermediate-right.png`, `-left.png` | FDS alone as a broad belly with four tendons through the wrist to the fingers; surface muscles as dashed ghosts |
| `diagram-palm-deep-right.png`, `-left.png` | FDP on the pinky-side two thirds, FPL on the radius with its tendon to the thumb, PQ across both bones above the wrist under the tendons, supinator round the neck of the radius, brachialis to the ulna; bones visible between |
| `diagram-back-surface-right.png`, `-left.png` | thumb side right (right arm); the extensor fan from the lateral epicondyle (ECU, EDM, ED, ECRB, ECRL) with BR on the edge; anconeus between the epicondyle and the olecranon; FCU behind the ulna's border; APL and EPB crossing the ECRB and ECRL tendons toward the thumb; ED's four tendons over the back of the hand |
| `diagram-back-deep-right.png`, `-left.png` | supinator round the upper radius; APL, EPB, EPL and EI in their order down the forearm, slanting to the thumb and the index finger |
| `diagram-thumb-surface-right.png`, `-left.png` | palm side right, back side left (right arm); BR as the contour down the middle; ECRL and ECRB behind it; anconeus at the back of the elbow; FCR at the palm-side edge; APL and EPB crossing to the thumb |
| `diagram-thumb-deep-right.png`, `-left.png` | supinator round the radius, FPL at the palm-side edge, the thumb muscles crossing from the back |
| `diagram-palm-surface-at-rest.png` | nothing selected and no data: the drawing still reads as a forearm in one resting tone |
| `diagram-selection-not-on-layer.png` | FDS selected with the deep layer shown: the note names where it is drawn |
| `hit-targets.json` | for each muscle on each layer, the largest square of screen that selects it |

On the real page (`npx vite build`, served from `dist/public`, device stores seeded with a week of hammer curls, wrist curls and reverse wrist curls, `?workspace=specialization&region=forearm`), device scale 3, at 390 × 844 and 375 × 667 pt:

| File | Checked |
|---|---|
| `diagram-page-390-viewport.png`, `diagram-page-375-viewport.png` | the first screen; no horizontal overflow (`diagram-page-checks.json`) |
| `diagram-page-390-palm-surface-right.png`, `-375-` | the map card with its controls, the drawing (321 and 307 px wide) and the page's legend, fills agreeing with the legend |
| `diagram-page-390-fcu-selected.png`, `-375-` | FCU selected by a touchscreen tap on its target (`aria-pressed` became true): outline and name, no focus ring |
| `diagram-page-390-back-surface-left.png`, `-375-` | left arm, back view: drawing flipped, thumb side on the left, words unmirrored, FCU still selected |

## Limits

- It is a schematic. Muscle outlines are simplified, flat and separated by even gutters; real muscles overlap, interdigitate and change shape with rotation and effort. Widths follow typical proportions, not any person.
- Overlap is shown by layers, not by depth within a layer: ECRB is partly under ECRL in life but drawn beside it; the radial head of FDS is merged into one outline; FDP and FPL tendons are drawn over pronator quadratus because they lie in front of it.
- Some muscles appear in more than one view where they wrap round (BR, FCU, ECRL, ECRB, APL, EPB, supinator). The thumb-side view is the arm in anatomical position seen from its radial side.
- The hand is a shortened stub (palm compressed, fingers cropped) whose only job is to show where tendons go. Intrinsic hand muscles are not drawn and belong to a separate region (brief §3).
- No colour, shading or shape in it is a forecast of growth (brief §6: no pseudo-3D bulging). Brightness on the map is the page's fixed exposure bins, nothing else.
- The anatomy follows the evidence file (`03-anatomy-evidence.md`, sources S4–S8 and A-references) and standard anatomical descriptions. It has not been reviewed by an anatomist; a reviewer should check the views against a reference atlas before the drawing is called reviewed.

## Open items

- The page puts the drawing below the first screen at 390 × 844 (controls and two lines take it); the brief asks for the illustration above the fold. That is the page's layout, not the drawing's.
- The drawing is 360 × 760, so on a phone it is about 680 px tall; the page may want a height cap on wide screens.
- A 3D viewer can replace this renderer behind the same props (design §12).
