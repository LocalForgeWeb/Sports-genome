# Specialization atlas: the forearm diagram (16 Oct 2026), and how every region's drawing is made (19 Oct)

The drawing on the specialization page (brief §6 "Diagram specification", design §7 and §12): the subject's right forearm from the palm, from behind and from the thumb side, in surface, middle and deep layers, with muscle bellies drawn apart from tendons and every selectable shape tied to a node id. It is a **schematic**: original artwork built from hand-placed landmarks, not a dissection photograph, not traced from any illustration or 3D model, and not an AI-generated image. It shows where each muscle is and how deep; it does not show how big anyone's muscles are or will be.

Since 19 Oct the forearm is drawn by a generator every region shares (10-multi-region.md §7). The forearm was its first region; its generated file did not change by a byte, and its evidence renders as it did (below, "One generator for every region").

## One generator for every region (19 Oct)

A region's drawing is its own views, written as control points, and a short config; everything else is shared.

| Piece | File |
|---|---|
| Curve helpers: centripetal Catmull-Rom, bands, tendons, cross-sections by rows (`rowsShape`) or columns (`columnsShape`), `rotate`, `fan`, cuts on any side (`clipBy`) or to a convex window (`clipToPolygon`), edges along either axis (`edgeAt`), `insetPolygon`; the per-view helpers `C`, `INSET`, `ghostOf`, `labels` | `design/specialization/shared/geometry.mjs` |
| The asset from the views: path ids, the short-name table, outcrops | `design/specialization/shared/asset.mjs` (`buildAsset(config, views, members)`) |
| Writer of the generated asset | `design/specialization/shared/emit.mjs` (`renderModule(config, views, members)`) → `shared/specialization/regions/<region>/diagram.generated.ts`, exporting `<region>Diagram` and `<region>DiagramOutcrops` (`upperArmDiagram` for `upper_arm`) |
| Gutter, overlap and skin check while drawing | `design/specialization/shared/check.mjs` |
| Quick preview, no app | `design/specialization/shared/preview.mjs` |
| Evidence through the real component, and the tap-square gate | `design/specialization/shared/render-evidence.mjs` (+ `evidence-entry.tsx`) |
| Evidence on the real page | `design/specialization/shared/render-page.mjs` |
| Headless Chromium and the local server, found once | `design/specialization/shared/browser.mjs` |
| A region's config, views and members, for the tools (members from its member list and the regions' nodes, never from its page data) | `design/specialization/shared/region.mjs` |

Per region, `design/specialization/<region>/`:

| File | Holds |
|---|---|
| `config.mjs` | `REGION`, `ASSET_KEY` (`<region>_schematic`), `ASSET_VERSION`, `CANVAS` (360 wide, its own height) and crops, `VIEW_ORDER` (ids and button words of 10 characters or fewer), `SIDES` (`one_side` for a paired region, mirrored for the left, or `both_sides` for a midline one, never mirrored; required, except where `MODULE_TEXT` pins a drawing published before the side policy, the forearm's, which is read as `one_side` and writes no `sides` line), `LICENSE_NOTE`, `STRUCTURE_WORDS` (the names skin, bone and lines may take), `COVER_BOUNDS` (per view and layer, below), and optionally `LIST_ONLY` (a target too thin for a tap square, with the reason) and `MODULE_TEXT` (the generated file's comments) |
| `silhouettes.mjs` | The outlines of each view and their edges |
| `views/*.mjs`, `views/index.mjs` | The views, layer by layer; `buildViews()` returns them all |
| `evidence.mjs` | `FIGURES` (the region's label for captions, its sides and their words, the muscle selected per view and layer, extra figures) and `PAGE` (the device seed, the muscle to tap, the side buttons, the second view, the plan day for the add preview) |

The forearm's folder is that and nothing more, plus `emit.mjs`, kept as a wrapper so its commands, the header of its generated file and `forearmDiagram.test.ts` stay as they were, and `render-logger.mjs`, the logger lane's phone check.

**Short names are the path names.** A view names a muscle by its short name (`node: "FCR"`). The table from short name to node id is derived from the region's members as its data lists them, the other regions' muscles it lists included, never kept by hand. Only muscles and heads that are no node's parent can be drawn (a muscle split into heads is drawn as its heads), so drawing a group, a compartment or a parent fails the build, as does a short name that is not letters, digits and hyphens, or two drawable members whose short names are the same in lower case.

To make or change a drawing:

```
node design/specialization/shared/check.mjs <region>                  # gutters, overlaps, the skin, per layer
node design/specialization/shared/preview.mjs <region> out.png --grid  # every layer side by side, ruled every 50 units
node design/specialization/shared/emit.mjs <region>                   # rewrite diagram.generated.ts (--check: exit 1 if stale)
npx tsx scripts/specialization/emit-seed.ts                           # the seed carries the drawing (drift guard)
node design/specialization/shared/render-evidence.mjs <region>        # figures at 390 and 375, and the 44 px gate
npx vite build && node design/specialization/shared/render-page.mjs <region>
```

For the forearm, `node design/specialization/forearm/emit.mjs [--check]` is the same as `emit.mjs forearm`. The tools read the members from TypeScript through tsx, as the seed's emitter is run; nothing is installed. They read them from the region's member list (`shared/specialization/regions/<region>/members.ts`, exporting `forearmMembers`, `upperArmMembers`, …) and every region's nodes (`regions/<home>/nodes.ts`, exporting `forearmNodes`, `upperArmNodes`, …), resolved as the page resolves them (`resolveMembers`, `compose.ts`), and never from the region's `index.ts`: that composes the page's data, which imports `diagram.generated.ts` and needs a mapping version. So `emit.mjs` rebuilds a generated file that is missing, stale or full of merge-conflict markers, and a region can be drawn before it has a page; until its `members.ts` exists, its own nodes are its members (20 Oct; the contract test holds these modules to never import a drawing).

**The contract** (`client/src/lib/specialization/diagramContract.test.ts`) holds every drawing the registry and the test fixtures provide:
- the manifest: a region's committed file is the generator's output byte for byte and 360 units wide, built from the members the page lists, read from modules that never import a drawing; every drawing is its region's, its views listed once each in the page's order; its side policy is its region's side model (`both_sides` for a midline region, else `one_side`);
- the Chromium gate on record: `evidence/<region>/hit-targets.json` exists, measured this very drawing (its SHA-256 is the committed file's), every muscle of every view and layer, and its smallest square is at least 44 px at 375 and at 390;
- path ids that name the view, layer and node's short name (or a structure word), numbered from 1 in draw order; every belly, tendon and ghost tied to a member, structure to none; muscles and heads only, and no node's parent;
- the path grammar: absolute `M`, `C`, `L`, `Z` (a test fixture's hand-written paths may also use `Q`), one decimal, closed unless a line; one skin, first, on every layer;
- every target muscle drawn as a belly on its own layer in at least one view (unless `LIST_ONLY` says why not);
- a belly off its own layer only as a listed outcrop, on a layer above its own, of a muscle that anatomy says shows there, in a view that also draws its own layer, cut from that outline: 99 % of it inside the muscle as its own layer draws it, none of it where that layer draws the tendon, under three quarters of its area;
- no layer without a muscle of that layer drawn on it (an outcrop of a deeper muscle alone does not make a layer); no two bellies on a layer overlapping; every belly inside the skin; no tendon or ghost of a muscle not drawn as a belly; labels on the canvas, their words included (by the renderer's width estimate at the labels' 14 px);
- the tap squares as the renderer places them: one per muscle, centred on it, on the canvas, overlapping no other; label anchors on the drawing; and the share of drawn muscle under another muscle's square within the region's `COVER_BOUNDS`, none above 10 %.

The generator's helpers and its refusals are tested there too. Each region keeps its orientation and landmarks in its own test (`forearmDiagram.test.ts`). The deltoid test fixture's hand-written shapes cross their skin and share an edge; those two checks run as expected failures for that fixture only, each with its reason, and fail once it is redrawn so the entry goes.

**The gate.** `render-evidence.mjs` draws every view and layer on each side through the real component on an evidence card in headless Chromium emulating a phone (390 × 844 and 375 × 667 pt, device scale 3, touch), reads with `elementFromPoint` every 1.5 px which muscle a tap selects, and records each muscle's largest square of screen shown to select it and nothing else in `evidence/<region>/hit-targets.json`. It draws the asset it builds from the views, and refuses to run unless that is the committed `diagram.generated.ts` byte for byte (emit first), so the record is always of the committed drawing; the record carries that file's SHA-256, which the contract test compares (20 Oct). A muscle's square is never rounded up: it is its own tap square, the renderer's rect measured exactly, where every point read inside it selects that muscle and no other square overlaps it, or, if larger, the span between the outermost points of the largest square of points that all select it, rounded down to 0.1 px. The script exits 1 if any is under 44 px at either width (10-multi-region.md §7.3). The forearm passes with 46.9 px at 390 (drawing 324 px wide) and 44.8 px at 375 (309 px), where most muscles' largest square is their own tap square, 14.5 % of the drawing's width. The margin over 44 px is 0.8 px at 375: a region whose squares cannot all be whole has to draw a thin muscle as structure or merge it, not shrink the square. (Until 20 Oct the gate rounded the sampled span to whole pixels, which read 45 and 47 px for the same drawing and could pass a square of 43 px; the drawing is unchanged, and its figures render pixel for pixel as before.) This is headless emulation, not an iPhone and not Safari.

**The refactor changed nothing the athlete sees.** `git diff 6738eeb -- shared/specialization/regions/forearm/diagram.generated.ts` is empty and `emit.mjs --check` passes. The forearm's evidence figures were rendered before the change (the old script, and a copy of it at 375 × 667) and after it (the shared one), 16 figures at each width: all 32 PNGs are identical pixel for pixel and the measured tap squares are the same. The page, built from 6738eeb and from this change and captured by the same `render-page.mjs` at 390 × 844 and 375 × 667, gives identical screenshots of the first screen, the map card (Palm · Back · Thumb side, FCU selected by a tap, the left arm from behind, the deep layer), the ledger and the add preview, and the same exclusive tap squares on all seven layers (smallest 47 px at 390, 45 px at 375). All in headless Chromium emulating an iPhone.

## Files (the forearm)

| Piece | File |
|---|---|
| Arm outlines and their edges | `design/specialization/forearm/silhouettes.mjs` |
| The three views, layer by layer | `design/specialization/forearm/views/{palm,back,thumb}.mjs` |
| Ids, the views in order with their button words (`VIEW_ORDER`), canvas and crops, licence note, cover bounds | `design/specialization/forearm/config.mjs` |
| What the evidence shows | `design/specialization/forearm/evidence.mjs` |
| Writer of the generated asset | `design/specialization/forearm/emit.mjs` (the shared writer) → `shared/specialization/regions/forearm/diagram.generated.ts` |
| Renderer | `client/src/components/specialization/SpecializationDiagram.tsx`, `diagramGeometry.ts`, `specialization-diagram.css` |
| Tests | `client/src/lib/specialization/diagramContract.test.ts` (the contract, every drawing), `client/src/lib/specialization/forearmDiagram.test.ts` (the forearm's views, outcrops, landmarks, orientation), `client/src/components/specialization/SpecializationDiagram.render.test.ts` (renderer) |

The contract fails if the committed asset is not exactly what the generator writes, and the seed test fails if the seed was not regenerated.

## How it is drawn

- **Canvas.** 360 × 760 view-box units. Every view shares the same heights: epicondyles at y ≈ 104, elbow crease ≈ 114, wrist crease ≈ 600, knuckles ≈ 712. The upper-arm stub is cropped at the top and the fingers at the bottom, so tendons run on toward where they attach. The forearm is drawn straight (no carrying angle) so the three views line up. Scale is about 20 units per centimetre along the forearm; the hand is shortened.
- **Outlines.** Each arm outline is a list of points along its two edges, smoothed with centripetal Catmull-Rom curves (no loops, no overshoot). The back view's outline is the palm view's mirrored, since it is the same arm seen from behind.
- **Bellies as cross-sections.** Most bellies are written as a table of horizontal slices, `[y, thumb-side edge, pinky-side edge]`, the way an atlas slices a limb, closed by a pointed origin and a tip or lobes where the muscle hands over to its tendons. Writing neighbours at the same heights is what keeps the gutter between them even; `check.mjs` reports every pair of bellies closer than 8 units, and the contract test fails on any overlap. Oblique bellies (the thumb muscles crossing to the thumb) are bands along a centreline with a width profile.
- **Tendons** are narrow bands along a centreline, pointed where they leave the belly (they start inside its tip, as the tendon forms within the muscle) and square where they attach.
- **Output** is absolute `M`, `C`, `L`, `Z` only, one decimal, so the seed and any renderer read it the same way. 127 paths and 28 labels; `diagram.generated.ts` is 114,749 bytes raw and 32,343 gzipped. In a build it sits in the specialization page's lazy chunk (`SpecializationPanel-*.js`) and in no other: Home, the logger and the recap do not load it (07-logger.md, "What each screen downloads").

## Orientation (right arm; the left arm is the mirror image)

- **Palm view.** Anatomical position, palm toward you: the **thumb side is on your left**, the pinky side on your right; lateral epicondyle top-left, medial epicondyle top-right.
- **Back view.** Seen from behind: the **thumb side is on your right**, the pinky side on your left; the point of the elbow (olecranon) top-centre-left.
- **Thumb-side view.** The radial side faces you. Walking round the thumb side from the palm view to the back view, the **back of the forearm is on your left and the palm side on your right**; the olecranon is at the back of the elbow, top-left. The hand is seen edge-on with the thumb nearest, reaching down toward the palm side.

Every palm and back layer is labelled "Thumb side", "Pinky side", "Elbow" and "Wrist"; every thumb-side layer "Palm side", "Back side", "Elbow" and "Wrist". The renderer mirrors the drawing for the left arm and re-places the labels (x mirrored, start and end anchors swapped), so the words land on the right side and are never drawn backwards.

## Views are the drawing's own

- **Ids and words are data.** `config.mjs` lists the views in `VIEW_ORDER`, in the order the page offers them, with the words on their buttons: `palm` "Palm", `back` "Back", `thumb` "Thumb side". The generator writes them into the asset as `viewOrder`. The build refuses a view that is drawn but not listed or listed but not drawn, and an id that is not `^[a-z][a-z0-9_]*$`; the contract test checks the same, and button words of 10 characters or fewer.
- **Nothing else names a view.** `DiagramViewId` is a string. The page's view buttons, the drawing's caption and accessible name, and the "drawn in Palm · Middle" note read `viewOrder`; `placementsOf` walks the views in that order. Another region draws its own views under its own ids with no code change: the deltoid fixture has `front`, `side` and `rear` (Front · Side · Rear), and the seed stores each drawing's views in `diagram_views` (04-database.md).
- **The address.** The page opens on the drawing's first view and writes `view` to the address only when another one is chosen; an address naming a view the drawing does not have shows the first view.
- **Layers** stay one anatomical vocabulary for every region: surface, intermediate (shown as Middle) and deep, each view offering the ones it draws.

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
- **The exceptions are listed in the asset** (`forearmDiagramOutcrops` in `diagram.generated.ts`, each with its reason) and tested one by one: abductor pollicis longus and extensor pollicis brevis on the back and thumb-side surface layers, where they come to the surface a few centimetres above the wrist and cross the radial wrist extensor tendons toward the thumb. Only nodes whose `surfaceVisibility` is not `not_distinct` may be listed. **Each outcrop is cut from the very outline the deep layer draws for that muscle in the same view** (`clipBelow`, a horizontal `clipBy`, in the shared `geometry.mjs`), below the height where extensor digitorum and the radial wrist extensors stop covering it: changing layer never moves the muscle, and the surface never shows muscle where the deep layer shows its tendon. The contract test, which holds every region to this rule (an outcrop of any layer above its own, cut by any side or through a window), samples each outcrop and requires it to lie within the deep belly and to be under three quarters of its area; the forearm's own test requires it to start well below that belly's upper end and to end where it ends: the square upper end is where it goes under its neighbours.
- Pronator teres is drawn partially within its own layer: its insertion lies under brachioradialis, so the belly stops at that muscle's edge.
- **The same muscle ends at the same height in every view that shows its lower end** (tested within 20 units, about 1 cm): BR and FCR in the palm and thumb-side views, ECRL and ECRB from behind and from the thumb side, FPL, and APL, EPB and EPL in both deep layers and both outcrops. Views that show only an edge of a muscle (BR from behind, ED from the thumb side, FCU from behind) are cut by the view and not compared.
- **Landmarks sit on their bones.** The back view's line between ECU and FCU is the ulna's subcutaneous border and lies over the ulna drawn in the deep layer from elbow to wrist; the olecranon and epicondyle marks on each surface layer lie over bone in the same view's deep layer (tested).
- Tendons are never selectable and never exposure-coloured. A deep muscle's tendon may appear on a surface layer where it really surfaces (EPL at the wrist); its belly does not.
- No two bellies on a layer overlap, and every belly stays inside the arm outline.

## The renderer

- **Contract.** `SpecializationDiagram` keeps the page's props (`asset`, `view`, `layer`, `mirrored`, `fillFor`, `selectedNodeId`, `onSelect`, `labelFor`, `describeFor`, `caption`) and names no region and no view: a test reads its source for region and muscle words, the deltoid fixture renders through it unchanged from each of its own views, and a view's words come from the asset's `viewOrder` (a test renames one and the note follows).
- **What is drawn and chosen** (19 Oct, 10-multi-region.md §7.3): muscles and heads; never a group or a compartment, and never a node that is another node's parent, whatever its kind (a muscle split into heads is drawn and chosen as its heads: drawn whole it would overlap them, chosen it would have no mapping of its own). `drawableNodeIds(nodes)` in `diagramGeometry.ts` is the rule; the generator applies the same one, and the contract test holds every asset to it. Given the region's members (the optional `nodes` prop), the renderer leaves out any path of a member that is not drawable, so it is neither drawn nor offered, and a selected one reads "not part of this drawing". `mirrored` means the left side of a drawing of one side; a drawing of both sides is never mirrored.
- **Fills match the legend beside it.** `bin` n paints `--sg-exposure-n` (held to 1–5), `zero` the resting muscle tone with a dashed `#9fb3c8` edge ("Mapped, no direct work"), `hatch` the legend's own hatch (`#2e3a49` with `#6f7d90` stripes slanting the same way, "Mapping not reviewed"; on the left arm the pattern is flipped back inside the mirrored drawing, so the stripes still slant the legend's way, tested), `none` the resting tone ("Not targeted"). The test compares these with `specialization.css`. Tendons are a cool neutral grey that is not on the ramp; ghosts are dashed outlines; bone is a lighter dark with its own edge. Rank colours are never used.
- **Selection** is an outline and a name, not a hue: from the edge outwards a dark keyline, a gold line, a dark keyline and a soft gold halo, drawn round the muscle's bellies and tendons as one shape (the outline is masked off inside them, so there are no crossing lines where a tendon starts inside its belly; readable on the palest exposure step and on the dark ground), and the muscle's abbreviation in a pill in the margin on its side, with a leader line to the muscle's widest point on the canvas (a belly that runs off the top, such as BR from behind, is pointed at where it is drawn), kept off the anatomy labels.
- **A selection never drops.** When the selected muscle is not on the layer shown, the caption says where it is ("FDS is not drawn on this layer. It is drawn in Palm · Middle."), as a note the drawing points to with `aria-describedby`; when it lies above the layer, its dashed ghost turns gold and the note says so.
- **Anchors.** The selected muscle's name points at the middle of its widest slice across the belly, and its tap square is tried at each slice's middle and quarter points. Slices are horizontal, unless a belly lies across the drawing (its longest horizontal slice at least twice its longest vertical one: a band from the spine toward the shoulder), when they are vertical, so its anchors run along it; where no slice gives its square room, the slices the other way are tried too (19 Oct). No forearm belly lies across, so its anchors and squares did not move. The render test holds each part (20 Oct): a band hemmed in above and below finds its square along its length, an upright belly with thin muscles beside it finds one through its vertical slices, and a wedge lying across is named at its thick end.
- **Tap targets.** One square per muscle, 14.5 % of the drawing's width: 44.5 px on a 375 pt phone when the page drew it 307 px wide (16 Oct), 45.7 px now that it draws it 315 px wide, and 46.5 px on a 390 pt phone (321 px), placed inside the muscle's own belly and clear of every other muscle's square and of the canvas edge. The squares sit above the bellies, so a tap on a neighbour under a square selects the square's muscle: among the places that keep the square clear, each takes the one that covers the least of other muscles as drawn (measured, then bounded by a test: on the back surface 4.9 % of drawn belly area lies under another muscle's square, down from 12.9 %; thumb-side surface 4.4 %, from 10.2 %). Two thin neighbours cannot both have a 44 pt square without one covering part of the other: EPB loses about a quarter of its drawn area to APL's square on the back surface and a third to EPL's on the thumb-side deep layer. Under the squares, each belly as drawn takes taps on itself, and each belly widened across its gutters takes taps in the gaps. On a 320 pt screen the drawing is about 254 px wide and the squares about 37 px; 320 pt is below the phones the app is designed for (CLAUDE.md: 375 to 430 pt). Labels and the selected muscle's name let taps through. Measured in Chromium with `elementFromPoint` on every layer, every muscle has a square of screen that selects it and nothing else at least 46.9 px across at 390 (drawing 324 px wide) and 44.8 px at 375 (309 px) (`evidence/forearm/hit-targets.json`, the gate of every region, never rounded up; `evidence/hit-targets.json` is the 390 reading from 16 Oct, unchanged, in whole pixels). On the page itself, 321 and 315 px wide, the 19 Oct reading in whole pixels gave 47 and 45 px.
- **Keyboard and assistive technology.** Each muscle is a `role="button"` with `aria-pressed` and the page's `describeFor` text; one tab stop, which moves with focus (roving tabindex), so Tab from a muscle reached with the arrows leaves the drawing and Shift+Tab comes back to it; arrow keys, Home and End move through the muscles top to bottom, Enter or Space selects. Keyboard focus draws a blue outline (the focus token, never the selection gold), and only for keyboard focus: a finger tap does not leave it behind.
- **Motion.** Fills change over `--sg-motion-base`; nothing moves on its own; reduced motion removes the transition.
- **Action glyphs** (`ActionGlyph.tsx`: the small drawing beside each action in the muscle and movement sheets, decorative, the words carry it) are picked from the verb in the action's id: bend, straighten, rotate, tilt, steady. The shoulder blade's moves are keyed by id instead (19 Oct): `scapula.protraction` and `scapula.retraction` a glide (the blade against the curve of the ribs, a two-way arrow along them), `scapula.elevation` and `scapula.depression` a ride up and down (the blade, a two-way arrow beside it); its upward and downward rotation read as a rotation. The foot's inversion and eversion tilt the sole, so they are a tilt (20 Oct). Steady, the hold drawing, is for the three holds only (`abdomen.compression`, `hand.palmar_aponeurosis_tension`, `forearm.distal_radioulnar_stabilization`): a test runs every action in the shared list, so a new action no verb matches has to be given its glyph.

## Evidence (headless Chromium emulating an iPhone; not an iPhone, not Safari)

Rendered through the real component, its CSS and the app's tokens, on a page card at 390 pt, device scale 2, with fills cycling through every kind so neighbours can be told apart and one muscle selected per figure (16 Oct; the files below are at the top of `evidence/`). The shared `render-evidence.mjs forearm` draws the same figures at 390 and at 375, device scale 3, as `evidence/forearm/diagram-<width>-<figure>.png`; on 19 Oct they were identical pixel for pixel to the same figures drawn from 6738eeb, and on 20 Oct, drawn from the asset the script builds rather than from the page's data, identical pixel for pixel to the same figures drawn by the 19 Oct script, so only their measurements (`evidence/forearm/hit-targets.json`, both widths, with the SHA-256 of the drawing measured) are committed, and the 16 Oct figures still show the drawing as it is:

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
| `hit-targets.json` | for each muscle on each layer, the largest square of screen that selects it (16 Oct, 390 only, whole pixels; the gate's own record is `evidence/forearm/hit-targets.json`) |

On the real page (`npx vite build`, served from `dist/public`, device stores seeded with a week of hammer curls, wrist curls and reverse wrist curls, `?workspace=specialization&region=forearm`), device scale 3, at 390 × 844 and 375 × 667 pt:

| File | Checked |
|---|---|
| `diagram-page-390-viewport.png`, `diagram-page-375-viewport.png` | the first screen as it was on 16 Oct; no horizontal overflow (`diagram-page-checks.json`) |
| `diagram-page-390-palm-surface-right.png`, `-375-` | the map card with its controls, the drawing (321 and 307 px wide) and the page's legend, fills agreeing with the legend |
| `diagram-page-390-fcu-selected.png`, `-375-` | FCU selected by a touchscreen tap on its target (`aria-pressed` became true): outline and name, no focus ring |
| `diagram-page-390-back-surface-left.png`, `-375-` | left arm, back view: drawing flipped, thumb side on the left, words unmirrored, FCU still selected |

These page screenshots were taken on 16 Oct (`2b977f7`), before the 17 Oct layout: they show the earlier top of the page and the map card's earlier controls. The current first screen, with the drawing's top on it, is in `evidence/page-followups-2026-10-17/` (`first-screen-fcu-*.png`, measured in 09-page.md).

On 19 Oct the shared `render-page.mjs forearm` took the same set on the current page, plus the deep layer, FCU's contribution ledger and the add-exercise preview, into `evidence/forearm/` (`diagram-page-<width>-*.png`, `diagram-page-checks.json`: no horizontal overflow, FCU pressed by the tap, the ledger heading on screen; the drawing 321 and 315 px wide). Its workouts are dated within the current week, before the run, so the ledger has bouts to open on any day. Built from 6738eeb and from the drawing platform's change, the page gave the same screenshots pixel for pixel at both sizes.

## Limits

- It is a schematic. Muscle outlines are simplified, flat and separated by even gutters; real muscles overlap, interdigitate and change shape with rotation and effort. Widths follow typical proportions, not any person.
- Overlap is shown by layers, not by depth within a layer: ECRB is partly under ECRL in life but drawn beside it; the radial head of FDS is merged into one outline; FDP and FPL tendons are drawn over pronator quadratus because they lie in front of it.
- Some muscles appear in more than one view where they wrap round (BR, FCU, ECRL, ECRB, APL, EPB, supinator). The thumb-side view is the arm in anatomical position seen from its radial side.
- The hand is a shortened stub (palm compressed, fingers cropped) whose only job is to show where tendons go. Intrinsic hand muscles are not drawn and belong to a separate region (brief §3).
- No colour, shading or shape in it is a forecast of growth (brief §6: no pseudo-3D bulging). Brightness on the map is the page's fixed exposure bins, nothing else.
- The anatomy follows the evidence file (`03-anatomy-evidence.md`: the brief's sources S2, S3 and S6 and the anatomy references A1–A55) and standard anatomical descriptions. It has not been reviewed by an anatomist; a reviewer should check the views against a reference atlas before the drawing is called reviewed.

## Open items

- The drawing's top is on the first screen at 390 × 844, 375 × 667 (except with Back to … and Custom dates together) and 430 × 932, and below it at 320 × 568, where the page's controls take a row each (09-page.md has the measurements). The whole drawing never fits the first screen of a phone: it is about 680 px tall at 390.
- The drawing is 360 × 760 view-box units, drawn at the card's width up to 26rem (416 px), so at its widest it is about 880 px tall; a lower height on wide screens is left open.
- A 3D viewer can replace this renderer behind the same props (design §12).
- The database does not hold a drawing's side policy yet: `diagram_assets` (schema v1) has no `sides` column and schema v2 adds none, so the seed would store the core's `both_sides` drawing as one side. Handed to the database lane (20 Oct): a nullable `sides` column on `diagram_assets` in schema v2 before it is applied (the forearm's row stays null), written by `emit-seed.ts` and compared by the seed test.
- The gate's record is tied to the drawing's bytes, not to the renderer's: a change to how the renderer places or sizes squares (`HIT_SQUARE_SHARE`, `drawnNodes`) is held by the render and contract tests, and needs `render-evidence.mjs` re-run by hand.
