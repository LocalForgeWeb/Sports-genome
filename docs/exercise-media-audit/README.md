# Exercise photo audit and repair (Oct 6 brief §2)

Every catalog exercise has a photo status, by its stable catalog id. The status comes from the files themselves and from looking at every mapped photo, not from whether a URL exists.

## Results

| Status | Before | After |
|---|---|---|
| **Verified**: the file loads, is a complete JPEG at the size the app reserves, and the photo shows this exercise | 246 | 246 |
| **Wrong variant still shown**: the photo shows a different exercise or variation | 7 | **0** |
| **Wrong variant, withdrawn**: shows the equipment placeholder | 17 (Oct 1) | 24 |
| **Missing**: the source has no photo of this exercise | 130 | 130 |
| Unreachable, invalid or wrong size | 0 | 0 |
| **Total** | 400 | 400 |

The inventories are in `before/` and `after/` (`inventory.json` with each frame's HTTP status, bytes, JPEG size and content type; `inventory.tsv` with one row per exercise).

**File checks.** 492 frames were fetched at the pinned commit (`f00c92c7`). All returned HTTP 200 as `image/jpeg`, with no redirects. Every file is a complete JPEG (it starts with SOI and ends with EOI), at exactly the width and height in `exercisePhotos.json`.

**Visual check.** Every mapped exercise was checked by eye, both frames, on contact sheets made by `scripts/exercise-photos/sheets.mjs`. Doubtful ones were then checked at full size. The findings are in `visual-review.json`.

### Withdrawn on Oct 6: the photo shows another variation

| Exercise | What the photo shows |
|---|---|
| Clap Push-Up | A plyo push-up with no clap; the same photo as Plyo Push-Up |
| Pendlay Row | A bent-over row with the bar hanging; a Pendlay row returns it to the floor |
| Seal Row | An incline-bench pull; a seal row is done prone on a flat, raised bench |
| Neutral-Grip Pull-Up | The Pull-Up photo, hands on the angled handles, not palms facing |
| Bulgarian Split Squat | A split squat with the rear foot on the floor |
| Kettlebell Swing | The one-arm swing |
| High Cable Curl | Lying on a bench, not the standing curl between two pulleys |

Each now shows the placeholder frame and is in the `rejected` table of `scripts/exercise-photos/curate.mjs`, so regenerating the map cannot bring it back.

### Kept after a closer look

| Exercise | Why it stays |
|---|---|
| Wide-Grip Pull-Up | The source is titled a behind-the-neck pull-up, but both frames show a front-facing wide-grip hang and pull. |
| Single-Arm Cable Rear-Delt Fly | At full size, one arm pulls and the other rests on the knee. The contact sheet had suggested both arms. |
| Sissy Squat, RKC Plank, Lateral Band Walk, Drop Landing, Pistol Squat, Rope Face Pull with External Rotation | Kept, with notes in `visual-review.json`. |

**The owner's swap example.** Sissy Squat shows `Weighted_Sissy_Squat`: the lean-back, heels-up sissy squat, holding a plate. Back Squat ("barbell squat") shows `Barbell_Squat`. Both are verified, and a test pins both mappings.

## Rendering

All of this is in `client/src/components/ExerciseMedia.tsx`, the one shared component.

**Thumbnails come from the app's own origin.** A list row used to download the 850 px source frame from jsDelivr for an 88 × 59 px box.
- It now loads `client/public/exercise-thumbs/<source>.jpg`: the start frame, 264 px wide (180 px high for a portrait photo), about 9 KB.
- There are 217 files, 2.5 MB in total, made by `scripts/exercise-photos/thumbnails.mjs` with Chromium's high-quality resampler.
- **Provenance.** `sources.json` records, for each file: the source URL at the pinned commit, the licence (Unlicense, a public-domain dedication), SHA-256 checksums of the original and the thumbnail, and the exercise ids that use it.
- No image was generated or altered beyond scaling.

**Fallback chain.**
- Thumbnail: own file → full frame on jsDelivr → the same frame on raw.githubusercontent → placeholder.
- Detail view: jsDelivr → raw.githubusercontent → placeholder.
- A missing photo stays classified as missing. Its placeholder is the equipment icon in the same reserved frame, never another exercise's photo.

**Slow loads.** The box is reserved from the photo's intrinsic size. While the bytes are on their way, the frame shows the equipment icon dimmed (`data-state="loading"`) rather than an empty hole. Nothing moves when the photo arrives.

**Retry.** When a detail frame fails on every host, the caption says so and offers Retry, which asks every host again.

## Still without a photo (154), and what it would take

> **October 7:** Bulgarian Split Squat and High Cable Curl now show photos of the right variation (rear foot on a bench; standing between two high pulleys), so 152 remain. The warm-up drills were photographed the same way. See `docs/drill-photos/`.

- **130 missing.** These are mostly cable (53), free-weight (26), bodyweight (16) and landmine (16) variations.
  - The Oct 3 re-match searched the source again for every one of them; the decision and reason for each are in `docs/exercise-photo-rematch/decisions.json` and in `after/inventory.tsv`.
  - The source simply has no photo of them.
- **24 withdrawn as the wrong variant**, listed above and in the tsv.
- **What would resolve them:**
  - another authorised source, such as the wger exercise images (CC BY-SA, needing attribution) or a licensed shoot;
  - or new photos taken for the app.
- **Why not done here:**
  - wger.de, Wikimedia Commons and jsDelivr are unreachable from this sandbox; only raw.githubusercontent.com is.
  - The brief rules out generated images.
  - Until then, each shows the equipment placeholder and is counted as missing.

## How to re-run

```
node scripts/exercise-photos/audit.mjs <catalog.json> <cacheDir> docs/exercise-media-audit/after
PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright/index.mjs PLAYWRIGHT_EXECUTABLE=/opt/pw-browsers/chromium \
  node scripts/exercise-photos/thumbnails.mjs <cacheDir>
node docs/exercise-media-audit/probes/media.mjs    # against `vite preview` on :4173
```

`<catalog.json>` is the catalog exported as `[{ id, name, equipment, category, movement }]`.

## Browser checks (`probes/media.mjs`, 20/20, `evidence/media-acceptance.json`)

These ran in headless Chromium against `vite preview` of the production build. The third-party photo hosts were served from a curl cache of the pinned commit. This is viewport emulation, not a phone.

- **Catalog rows**
  - They load `/exercise-thumbs/…`; each is painted and at most 264 px wide.
  - A list of rows makes no request to the photo CDN.
- **Owner example rows:** Back Squat shows `Barbell_Squat`; Sissy Squat shows `Weighted_Sissy_Squat`.
- **Withdrawn photos:** Seal Row, Pendlay Row, Bulgarian Split Squat and Kettlebell Swing show the placeholder, with no image.
- **Slow photo** (2.5 s delay): both frames hold their size (116 px) and show the icon, then paint at the same size.
- **Unreachable** (every host fails): "The photographs could not be loaded." appears with Retry. After the hosts recover, Retry loads both Back Squat frames.
- **Invalid response** (HTML served as the photo): the second host serves the real photo.
- **Missing thumbnail:** falls back to the full frame.
- **Widths:** at 320, 375, 430 and 1280 px, thumbnails keep their 3:2 box and nothing scrolls sideways.
