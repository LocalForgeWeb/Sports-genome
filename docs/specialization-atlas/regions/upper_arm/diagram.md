# Specialization atlas: the upper-arm diagram (22 Oct 2026)

The upper arm's drawing for its specialization page (10-multi-region.md §7; the forearm's method is 08-diagram.md): the subject's right upper arm from the front and from behind, each in a surface and a deep layer, every selectable shape tied to a node id. It is a **schematic**: original artwork built from hand-placed control points and anatomical landmarks, not a dissection photograph, not traced from any illustration, photograph or 3D model, and not an AI-generated image. It shows where each muscle is and how deep it lies; it does not show how big anyone's muscles are or will be.

It is drawn by the shared generator, like the forearm's. The forearm's generated file did not change by a byte (`emit.mjs forearm --check`).

**Not yet on a page.** The upper arm is still a reference region (§1.3): its content carries no drawing (`regions/upper_arm/index.ts`: `diagram: null`), so the page, the region's chunk and the database seed are as they were. The integration lane promotes it: it sets `diagram: upperArmDiagram` in `regions/upper_arm/index.ts`, and seed v3 carries the drawing. Until then, the contract test checks this drawing from its generated module (below, "Tests").

## Files

| Piece | File |
|---|---|
| Ids, the views in order with their button words, canvas, crops, side policy, licence note, structure words, cover bounds | `design/specialization/upper_arm/config.mjs` |
| The arm's outline in each view, the elbow it shares with the forearm drawing (`ELBOW_DROP`, `fromForearm`), and `rowsPoints` (the points `rowsShape` draws through, so an outcrop is cut from the very outline its own layer draws) | `design/specialization/upper_arm/silhouettes.mjs` |
| The two views, layer by layer | `design/specialization/upper_arm/views/{front,back}.mjs`, `views/index.mjs` |
| What the evidence shows, and the page's seed for when the region has a page | `design/specialization/upper_arm/evidence.mjs` |
| The generated asset | `shared/specialization/regions/upper_arm/diagram.generated.ts` (`upperArmDiagram`, `upperArmDiagramOutcrops`) |
| Tests | `client/src/lib/specialization/upper_armDiagram.test.ts` (this drawing), `client/src/lib/specialization/diagramContract.test.ts` (every drawing) |
| Evidence and the tap-square gate | `docs/specialization-atlas/evidence/upper_arm/` |

```
node design/specialization/shared/check.mjs upper_arm                  # gutters, overlaps, the skin
node design/specialization/shared/preview.mjs upper_arm out.png --grid # every layer, ruled every 50 units
node design/specialization/shared/emit.mjs upper_arm [--check]         # rewrite diagram.generated.ts
node design/specialization/shared/render-evidence.mjs upper_arm        # figures at 390 and 375, and the 44 px gate
```

## How it is drawn

- **Canvas.** 360 × 760 view-box units (§7.2), at the forearm drawing's scale, about 20 units to the centimetre. Every view shares the same heights: the top edge just below the shoulder joint, the inner epicondyle at y ≈ 600, the elbow crease ≈ 610, the forearm cropped at the bottom edge about 7.5 cm below the crease. The biceps' heads, the long head of the triceps and coracobrachialis run on above the top edge toward the shoulder blade, as their tendons do; the lateral head of the triceps starts at its origin on the back of the humerus below the greater tubercle (y ≈ 52–90), since it does not cross the shoulder (tested: on the back, only the long head runs off the top edge).
- **One elbow with the forearm drawing.** The elbow is the forearm drawing's, 496 units lower: from y 548 down, the outline of the front view is the forearm palm view's, point for point, and the back view's the forearm back view's; so are the end of the humerus with its epicondyles, the tops of the radius and ulna, the elbow crease, the inner epicondyle and olecranon marks, the ulna's back border, the end of the biceps and its tendon, the end of brachialis and its tendon, and the course of brachioradialis down the outer border. Seen on the two pages, the elbow is the same elbow: tested within 1 unit, the outline across every height from y 548 to 730, the radius and ulna from just below their tops to 730, brachioradialis from 620 to 740, and the tendons, marks and lower ends point for point.
- **The same arm from both sides.** The back view's outline is the front view's mirrored, since it is the same arm seen from behind (tested).
- **Bellies as cross-sections.** Each belly is a table of horizontal slices, `[y, one edge, the other edge]`, closed by its pointed origin or its rounded end; neighbours are written at the same heights so the gutter between them stays even. Measured (`check.mjs`, 23 Oct), the narrowest gutters between bellies on a layer are 6.2 units (long head and the medial head's outcrop), 6.7 (biceps and brachialis' outcrop), 7.7 (brachioradialis and brachialis' outcrop), 9.1 (long and lateral heads), 16.6 (biceps and brachioradialis) and 18.6 (brachialis and coracobrachialis); the long and lateral heads keep at least 6.0 from the common tendon's outline. Coracobrachialis is a band along a centreline.
- **Output** is absolute `M`, `C`, `L`, `Z`, one decimal. 34 paths and 16 labels; `diagram.generated.ts` is about 31 KB.

## Orientation (right arm; the left arm is the mirror image)

- **Front.** Anatomical position, palm forward: the **outer side is on your left**, the inner side on your right, as the forearm's palm view has the thumb side on the left. The biceps' long head is on the outer side, its short head on the inner side.
- **Back.** Seen from behind: the **outer side is on your right**, the inner side on your left, as the forearm's back view has the pinky side on the left. The long head of the triceps is on the inner side, the lateral head on the outer side, the olecranon at the bottom in the middle.

Every layer is labelled "Shoulder", "Outer side", "Inner side" and "Elbow": anatomical words only, never screen left or right (tested). The page does not mirror the drawing while both arms count as one (10-multi-region.md, "Both sides as one"); the renderer can, and re-places the labels so no word is drawn backwards.

## Views and layers, and why each

| View · layer | Why it is drawn | Bellies (selectable) | Also drawn |
|---|---|---|---|
| Front · surface | The biceps is the front's surface muscle, and brachialis shows beside its lower half | biceps; **brachialis as a partial outcrop**; brachioradialis (forearm, external) | the biceps' two upper tendons running toward the shoulder blade, its lower tendon into the hollow in front of the elbow; the elbow crease; the inner epicondyle |
| Front · deep | Brachialis and coracobrachialis lie deep at the front and are drawn whole here | brachialis; coracobrachialis | brachialis' tendon to the ulna; humerus, radius, ulna; the biceps and brachioradialis as dashed ghosts |
| Back · surface | The long and lateral heads are the back's surface muscles, and the medial head shows just above the elbow | long head; lateral head; **medial head as a partial outcrop** | the long head's tendon toward the shoulder blade; the common tendon (structure); the olecranon, the inner epicondyle, the ulna's back border |
| Back · deep | The medial head lies under the other two and is drawn whole here | medial head | humerus, ulna, radius; the long and lateral heads as dashed ghosts |

No middle layer: no upper-arm muscle lies between the surface and the deep ones. The outer side's view (§7.2, dropped) would add no muscle: its brachialis outcrop is the front's. Each layer draws at least one muscle of its own layer (contract test).

**Every member is drawn at its layer** (tested): biceps, long head and lateral head on surface layers; brachialis, the medial head and coracobrachialis whole on deep layers; brachioradialis, the forearm's muscle the upper arm lists (short name `BR`), on Front · Surface, as the forearm draws it. It is not drawn from behind, where only a sliver of it shows, too thin for a tap square; it is drawn whole from the front. **The triceps itself is neither drawn nor selectable**: it is the parent of its three heads (§1.2, §7.3), drawn as its heads.

## What each shape rests on

The anatomy is the upper arm's evidence (`regions/upper_arm/research/dossier.md`, claims in `shared/specialization/regions/upper_arm/claims.ts`); the forearm's shapes it shares rest on the forearm's (03-anatomy-evidence.md).

| Shape | Rests on |
|---|---|
| Biceps on the front surface, over brachialis; its long head on the outer side and short head on the inner side, both from the shoulder blade (the long head's tendon to the top of the shoulder socket, the short head's to the coracoid process), ending in a tendon toward the radius | `upper_arm.biceps.appearance` (the front compartment's most superficial muscle, over brachialis); `upper_arm.biceps.function` (both heads start on the shoulder blade); `forearm:biceps.function` |
| Brachialis whole on the front of the lower half of the humerus, its top two shallow slips either side of the shoulder muscle's insertion, crossing the elbow to the ulna, under the biceps; its outer edge shown on the surface beside the lower biceps | `upper_arm.brachialis.appearance` ("Most of it is hidden by the biceps; its outer edge and its lower end lie close to the surface"); `forearm:brachialis.function`. Only the outer edge is drawn as an outcrop: the inner side was not confirmed (dossier §9). The two slips at its top are the standard description (Gray's Anatomy), not one of the dossier's claims |
| Coracobrachialis on the inner side of the upper half, from the coracoid process to about halfway down the humerus; deep only, no outcrop | `upper_arm.coracobrachialis.function` and `.appearance` ("behind the pectoralis major and on the inner side of the biceps and brachialis"); its node says `not_distinct` at the surface |
| Long head on the inner half of the back, from the shoulder blade just below the shoulder socket (its tendon above the top edge) to the common tendon | `upper_arm.triceps_long.appearance`, `upper_arm.triceps_long.function` (the only head that crosses the shoulder) |
| Lateral head on the outer half of the back, from its origin on the upper back of the humerus below the greater tubercle (an oblique top, high on the outer side) to the common tendon's outer border | `upper_arm.triceps_lateral.appearance`, `upper_arm.triceps_lateral.function` |
| Medial head whole on the back of the lower half of the humerus, below the groove for the radial nerve (so its top is high on the inner side and low on the outer side), down to the olecranon; a small outcrop on the inner side just above the elbow | `upper_arm.triceps_medial.function` (below the groove for the radial nerve), `upper_arm.triceps_medial.appearance` ("lies mostly under the long and lateral heads on the lower half of the back of the upper-arm bone"; one dissection study found its muscle reaching closer to the elbow than theirs). The outcrop is **weakly supported** (dossier §5, §12): no cited source says any of it shows, and one says it cannot be felt; it is kept small (6 % of the head as drawn whole). **Its side is a drawing choice**: it is drawn on the inner side only, while anatomy references often show the lower medial head on both sides of the common tendon; no source the review cited says which side shows, so no outer outcrop is drawn |
| The common tendon, between the heads in the lower third, widest between their lower ends and narrowing to the olecranon's width where it ends on it, drawn as structure (an outline, no node); both heads end on its borders | `upper_arm.triceps.function` (the three heads end together on the point of the elbow); §7.2 (shared tendons are drawn as structure, as the quadriceps tendon will be) |
| Brachioradialis from the ridge above the outer epicondyle down the outer border | the forearm's drawing and evidence (`forearm:br.function`, 03-anatomy-evidence.md) |

## Layer rules (tested)

- A belly is drawn on its node's own layer only, with two listed exceptions (`upperArmDiagramOutcrops`, each with its reason), the two §1.2 names: **brachialis on Front · Surface** and **the medial head on Back · Surface**. Coracobrachialis, deep and `not_distinct` at the surface, has none.
- **Each outcrop is cut from the very outline its deep layer draws for that muscle in the same view** (`clipToPolygon` with a convex window, from `rowsPoints`), so changing layer never moves the muscle. Brachialis' window lies between the biceps' outer edge and brachioradialis' upper inner edge, each less a gutter, below the shoulder muscle's insertion (y 335) and down to the point where the two close over it (y 538); its outer side is the muscle's own edge. The medial head's lies below the long head's lower border (parallel to it) and beside the common tendon, each less a gutter, and runs down to the head's own lower end. Both start well below their muscle's upper end, lie within it, and are a small part of it (11 % and 6 %).
- Muscles drawn on two layers end at the same height on both: the ghosts on the deep layers are the surface bellies' own outlines, and the medial head's outcrop ends where the head ends (tested within 10 units). No muscle is drawn in both views, so the views are compared by the elbow: the inner epicondyle mark is at the same height from the front and from behind (within 5 units), and so is the humerus' lower end, within 20 units (about 1 cm, the forearm drawing's tolerance for a muscle's end): it is 624 from the front and 612 from behind. Both are the forearm drawing's own outlines of the bone, moved down: from the front its lowest edge is the joint surface, which curves forward and down; from behind the drawing ends the bone where the olecranon lies over it.
- **Landmarks sit on bone**: the inner epicondyle marks (front and back) over the humerus' epicondyle in the same view's deep layer, the olecranon over the ulna, and the ulna's back border over the ulna below the elbow (tested).
- Tendons are never selectable and never coloured as muscle; no two bellies on a layer overlap; every belly is inside the skin (contract test).

## Tap squares (headless Chromium emulating an iPhone; not an iPhone, not Safari)

`render-evidence.mjs upper_arm` draws every view and layer through the real `SpecializationDiagram`, on an evidence card, at 390 × 844 and 375 × 667 pt, device scale 3, touch, and reads with `elementFromPoint` every 1.5 px which muscle a tap selects (`evidence/upper_arm/hit-targets.json`, with the SHA-256 of the drawing measured; the contract test requires it to be the committed file's).

| Width | Drawing | Smallest square on any layer | Every muscle |
|---|---|---|---|
| 390 | 324 px | 46.9 px | at least 46.9 px (the medial head on Back · Deep, alone there, 127.5 px) |
| 375 | 309 px | 44.8 px | at least 44.8 px (Front · Deep 45.0 px; the medial head on Back · Deep 121.5 px) |

Each muscle's square is its own tap square, 14.5 % of the drawing's width, whole: on every layer the squares overlap no other square. They spill over skin and gutter, and over almost no other muscle (`COVER_BOUNDS`, measured 23 Oct): under 1 square unit of another muscle on three layers; on Back · Surface about 41 square units, 0.06 % of the layer's drawn muscle, where the medial head's square takes in the tip of the long head as it ends on the common tendon. The two outcrops' squares sit on them: brachialis' at (107, 400), the medial head's at (123, 540) in view-box units. The margin at 375 is the forearm's, 0.8 px: the square's size is set by the drawing's width, not by the muscle.

## Evidence

In `docs/specialization-atlas/evidence/upper_arm/`, from `render-evidence.mjs upper_arm` (headless Chromium emulating an iPhone: viewport, `isMobile`, `hasTouch`, device scale 3; reduced to 256 colours), each at 390 and 375:

| File | Checked |
|---|---|
| `diagram-<w>-front-surface-right.png` | biceps selected and named; its two heads side by side at the top, the long head on the outer side; brachialis' outer edge between it and brachioradialis; the lower tendon into the hollow in front of the elbow |
| `diagram-<w>-front-surface-brachialis-outcrop.png`, `-front-surface-br.png` | brachialis (its outcrop) and brachioradialis selected in turn |
| `diagram-<w>-front-deep-right.png`, `-front-deep-cb.png` | brachialis whole on the lower humerus, crossing the elbow to the ulna; coracobrachialis on the inner side of the upper half; the bones; the biceps and brachioradialis as ghosts |
| `diagram-<w>-back-surface-right.png`, `-back-surface-trilat.png`, `-back-surface-trimed-outcrop.png` | the long head (inner, its tendon off the top edge) and the lateral head (outer, from its origin below the greater tubercle) ending on the borders of the common tendon, which narrows to the olecranon; the medial head's small outcrop under the long head, beside the tendon; each selected in turn |
| `diagram-<w>-back-deep-right.png` | the medial head whole, its top high on the inner side and low on the outer side; the long and lateral heads as ghosts |
| `diagram-<w>-front-surface-at-rest.png` | nothing selected and no data: the drawing still reads as an arm in one resting tone |
| `diagram-<w>-selection-not-on-layer.png` | the long head selected with the front shown: the note says where it is drawn |
| `hit-targets.json` | the gate, both widths |

At 375 × 667 the evidence card (about 750 px tall) is taller than the screen, so the capture is stitched. Until 23 Oct the shared script's fixed page background was not painted on the stitched part, and every 375 figure (and the forearm's) showed a white band behind the card's title or caption. `design/specialization/shared/render-evidence.mjs` now has each card paint the page's ground itself, and the page a dark base: no figure has a white row, and the not-on-layer note reads in full. The drawing and the measured squares do not depend on it.

The page's own screenshots (`render-page.mjs upper_arm`) wait for the region's page: `evidence.mjs` holds its seed (a week of curls and triceps work, the biceps to tap, the back view second).

## Tests

- `upper_armDiagram.test.ts`: the generator's output from this folder; key, version, canvas, one side, licence; that the content does not carry it yet; the views and layers; a path for every drawable member by its short name, and none for the triceps; each muscle at its layer and view; exactly the two outcrops, cut below their muscle's upper end and small; where each outcrop lies; the common tendon as structure between the heads; both heads' lower ends within 8 units of it, and its width where it reaches the olecranon no more than the olecranon's and 6; only the long head off the top edge on the back, the lateral head (and its ghost) starting at y 40 or below; the tendons; orientation from the front and from behind against the labels and the muscles; anatomical words only, and no word of growth or size; the back outline the front's mirrored; the elbow at one height in both views; ghosts identical to the bellies above; landmarks over bone; and the elbow shared with the forearm drawing (the outline from y 548, the radius and the ulna, brachioradialis, the tendons and marks).
- `diagramContract.test.ts` holds every drawing to the contract. A registered region drawn before its promotion is checked from its generated module, its members resolved as the page will resolve them; before 22 Oct the test checked production regions only and failed once a reference region had a drawing folder. Once the upper arm is promoted it is checked as a production region, and the extra branch finds nothing.

## Limits

- It is a schematic. Outlines are simplified, flat and separated by even gutters; real muscles overlap and change shape with the elbow's angle and with effort. Widths follow typical proportions, not any person.
- The shoulder's and chest's muscles that cover the top of the arm (the deltoid, pectoralis major, latissimus dorsi, teres major) belong to other regions and are not drawn: near the top edge the surface layers show the upper arm's own muscles as they lie under them. The forearm's muscles below the elbow are not drawn either, apart from brachioradialis, which the upper arm lists.
- The deltoid covers the upper part of the lateral head of the triceps; the drawing, which leaves the deltoid out, shows the lateral head from its origin on the humerus.
- The biceps is one node with two heads drawn as one belly; only brachialis' outer edge is drawn at the surface. The medial head's outcrop is weakly supported and kept small, and its side is a drawing choice: references often show the lower medial head on both sides of the common tendon, and no outer outcrop is drawn without a source that says so. The outer side just above the elbow, below the lateral head, is drawn as skin.
- **Open question: how high the medial head starts.** Gray's Anatomy describes the medial head as narrow and pointed above, so its top may lie higher on the inner side than drawn; the drawing starts its pointed top at about mid-arm (y 252), and the shape has not been changed for it. A reviewer with a reference atlas should settle it.
- No colour, shading or shape in it is a forecast of growth (brief §6: no pseudo-3D bulging). Brightness on the map is the page's fixed exposure bins, nothing else.
- It has not been reviewed by an anatomist; a reviewer should check the views against a reference atlas before the drawing is called reviewed. The anatomy it rests on was checked by automated review against web-search excerpts, not full texts (10-multi-region.md §8).
