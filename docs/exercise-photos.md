# Exercise photographs

**Source.** The Free Exercise DB (github.com/yuhonas/free-exercise-db), released into the public domain under the Unlicense. Hugging Face mirrors its records as the dataset `sirnino/bodybuilding-exercises` (Apache-2.0 metadata; the JSON only, without the images), which is where the photos were traced from. The `SportGenome` Hugging Face account itself holds no repositories, so the mirror's upstream is used directly. Each source exercise has two photographs, the start and the finish of the movement, one model, one background.

**Serving.** Nothing is copied into this repository. Photos are loaded from the jsDelivr GitHub CDN at a pinned commit (`client/src/lib/exercisePhotos.ts`), with raw.githubusercontent.com as a second host for a frame the CDN fails to serve. A frame that fails on both hosts withdraws the strip; an exercise with no photograph shows nothing. Images carry `loading="lazy"` and no referrer.

**Matching.** `scripts/exercise-photos/match.mjs` normalises names and reports exact matches and fuzzy candidates against the source list; `scripts/exercise-photos/curate.mjs` applies only exact matches and a hand-checked alias table (a fuzzy candidate that is not listed there is dropped: a wrong photo teaches a wrong movement) and writes `client/src/data/exercisePhotos.json`, keyed by this catalog's exercise id with the source folder and frame count. Coverage: 246 of 400 exercises. Unphotographed groups are mostly landmine, cable-variant and medicine-ball movements the source does not include.

**Where they appear.** Exercise Intelligence (start and finish, captioned, credit line) and catalog rows (one frame as a 56 px thumbnail; hidden under 360 px).

**To regenerate.** Download `dist/exercises.json` from the source repository, export the catalog (`npx tsx` over `client/src/lib/exerciseCatalog.ts`) into `app-exercises.json`, run `match.mjs` to review new candidates, extend the alias table in `curate.mjs`, run it, and bump `exercisePhotoSourceRef` to the commit the photos were checked against.

**Evidence.** `docs/ux-next/evidence/after-catalog-photos-390.png` (thumbnails in the catalog rows) and `after-detail-photos-390.png` (start and finish frames on Conventional Deadlift). Captured with `docs/ux-next/probes/photo-shots.mjs`; the sandbox browser has no outbound network, so the probe fetches the pinned frames with curl and serves them to the page under their real URLs. Tests: `client/src/lib/exercisePhotos.test.ts` (ids in the catalog, five core lifts by hand-checked name, URL shape at the pinned commit, coverage floor).
