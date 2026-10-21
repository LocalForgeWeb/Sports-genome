# Merging main into the training-day branch (21 October 2026)

This branch carried the 50-exercise expansion, shared links, the utility tools, the percentile-ceiling repair and the day editor. It was 16 commits ahead of main and main was 15 ahead of it. A plain merge conflicted in 23 files. The overlaps underneath the conflicts are what needed decisions.

## Catalog ids: main's forearm rows keep 401-416

Main shipped a forearm catalog first, at ids 401-416. Its specialization atlas references those ids in production (`cat-401`…`cat-416`). This branch's expansion had used 401-450 and never shipped: production has no `public.exercises` row above 400, checked read-only.

So the expansion moved, in its own commit before the merge (`Expansion v1: renumber around main's forearm catalog`).

**Retired candidates.** Eight candidates are the same exercise as a forearm row, with the same setup. They are retired onto that row and keep only their search aliases (`RETIRED_CANDIDATES`):
- E09-E12: lever pronation, supination, radial and ulnar deviation → 405-408
- E15: Finger Curl → 401
- E16: gripper close → 402
- E17: band finger extension → 404
- E41: Suitcase Carry → 409

**Moved records.** The other 42 take 417-458 in candidate order (`EXPANSION_CANDIDATE_IDS`). The change runs through:
- the catalog
- measurement modes and load conventions
- movement support
- photo curation and the photo map
- the validator and diagnostics
- the evidence, media, matrix and source ledgers

**Prepared migration.** It is regenerated and still not applied (B009):
- 42 exercises.
- 8 neck muscles. The pronators and supinator went with the retired candidates.
- A rollback that deletes its own ids by list, never by a range a forearm row could fall in.

**Forearm atlas.** Main's atlas requires every forearm-tagged row to be mapped or listed with a reason. Eleven expansion records are forearm-tagged. They are listed in `shared/specialization/regions/forearm/variants.ts`, each with a specific reason why it has no reviewed mapping yet: four at region level, seven unmapped. No reviewed mapping was invented.

## One logger for both sides' measures

**Set fields.** Main stores a hold as `holdSeconds` and a side as `left | right | both`; those fields are in production device logs. This branch's `seconds` is now `holdSeconds`, and its one-side sets use main's `side`. Its `distance`, `distanceUnit` and `setting` sit alongside them.

**The set's measure.** A set is entered in reps, seconds or distance (`doseMeasureFor` in `shared/exerciseMeasurement.ts`):
- seconds where main's atlas measures the exercise so;
- otherwise the expansion's reviewed mode: the neck and hub holds in seconds, carries and sleds in distance;
- otherwise reps.

**The boxes.** Entry fields follow main's API, with the Seconds box, or now a Distance box, as the last box. The tracker is main's, with this branch's additions ported in:
- the setting box;
- assistance;
- left/right on one-side exercises, styled as main's arm picker;
- the entry note;
- drop-set limits;
- Load the bar.

**Prescriptions.** `prescriptionOf` takes the catalog id. A hold uses its own target where it states one ("20 sec" for a neck hold), else main's "30 sec". A carry reads its distance ("20 m"). Hold targets are written in main's "sec".

## Percentiles past the 95th and muscle scores

**Per lift.** Main's 14 October decision governs. Past the top anchor a lift is placed on the curve's estimated tail, marked estimated, wherever the database's answer carries the curve. This branch's "above" bound remains only where nothing can be estimated.

**Per muscle.** The score stays this branch's weighted mean with bounds. Main's floors (sets stopped short of failure raise a score, never lower it) are applied to it.

**Wording.** A muscle keeps "Benchmark score …", with main's "≈ … (estimated)" and "at least …" markers. Details are in `docs/percentile-ceiling/README.md`, "Reconciled with main".

## Plan header

Main's "Name week" and this branch's "Edit days" both sit in the plan header. The stored plan carries main's `weekNames` and this branch's `split`.

## Checks

- **tsc:** clean. **vitest:** 461 files, 4281 tests, including main's hold-to-arrange commit, merged after. **Build:** passes.
- **`probes/logger.mjs`:** production build, headless Chromium, 390 px; 12/12. It covers:
  - the plan's defaults in each measure;
  - a neck hold logged as `holdSeconds` with its side;
  - the carry logged as distance;
  - the band, Dead Hang and squat rows asking the right boxes.
- **`docs/split-editor/probes/split-editor.mjs`:** 42/42 at 390 and 320 px, against the merged header.
- **Expansion diagnostics:** regenerated on the merged engines; 42 exercises, 0 validator errors.

This is viewport emulation, not a phone.
