# Sports Genome — Zercher, Neck and Bench Expansion
## Implementation handoff for Claude • 23 October 2026

**Deliver 24 new exercise definitions, reuse three confirmed existing records, and verify the complete path from search to saved workout to analysis. This is additional to the previously discussed 34 forearm additions.** Do not replace, renumber or quietly claim completion of that earlier work.

This file is self-contained. It includes repository findings, a specified execution protocol for every exercise, muscle-role decisions, logging semantics, media candidates, integration tasks, acceptance scenarios and an extractable JSON manifest. It is an implementation specification, not an already-applied patch or a clinical exercise prescription.

### Read first: actual status and integration boundaries

- The catalog was inspected at `LocalForgeWeb/Sports-genome`, commit `1056aca1fe244613fce3515fa5c6854dd8c45d8e`. Base, expansion and forearm files contain 300 + 100 + 16 records, respectively. The audited main branch has 416 catalog exercises; the earlier 34-entry local implementation is not present in that main-branch catalog.
- Main now records schema v2 and seed v2 as applied, through PR #99. **Do not edit either of those migration files.** Any earlier proposal that treated them as pending is obsolete. The current seed emitter targets `supabase/migrations/20261022120100_specialization_atlas_seed_v3.sql`; inspect whether it has since been applied before editing it.
- This task prepares additions beyond those 34. If the 34 land first and no other changes intervene, the combined catalog would have 474 rows. If only this 24-entry package lands on the audited main branch, it would have 440. Count actual IDs; never force a total by duplicating rows.
- A row in the JSON is a fully specified **proposed record**, not a database row ready for blind insertion. Its null numeric ID is intentional: allocate and persist an unused ID after reconciling all active branches. Do not allocate from array positions. Do not assume 417 is available or reserve 452 without checking.
- The latest user asks for a Claude handoff. Preparing this file does not mean the exercises have been deployed. At implementation completion, report the exact commit, tests, preview/deployed environment, and remaining gaps.

## 1. What to add, and what already exists

### A. Zercher: six useful options, four new records

| Exercise | Decision | Existing ID / new key |
|---|---|---|
| Zercher Squat | Reuse, audit muscle-role accuracy and discoverability | 164 |
| Zercher Carry | Reuse, audit timed logging and eliminate incorrect hand-grip credit | 300 |
| Zercher Deadlift — Floor | Add | `zercher_deadlift_floor` |
| Zercher Block Pull | Add; store starting height | `zercher_block_pull` |
| Zercher Good Morning | Add; top-down hinge, no floor reset | `zercher_good_morning` |
| Zercher Hold | Add; stationary, timed | `zercher_hold` |

“Zercher Romanian deadlift” is a search alias for the defined top-down hinge only. If the repository already distinguishes its protocol meaningfully from a Zercher good morning, keep that legitimate distinction and record the resolution; do not manufacture a duplicate merely to inflate the count. Do not confuse a conventional deadlift followed by a lap transfer with a direct elbow-crook floor pull.

### B. Neck: twelve records covering equipment and contraction mode

Three machine directions; one suspended-load harness extension; four cable-harness directions; four manually resisted isometric directions. Lateral flexion and rotation each accept left/right **head direction** on the same catalog row. This supports six directional efforts without twelve redundant left/right duplicates. Neck extension is not a shrug, and a shoulder press “behind the neck” is not a neck exercise.

### C. Bench/press: eight new records plus discovery fixes

Plate-loaded incline; selectorized decline; plate-loaded decline; Smith incline; Smith decline; barbell floor; paused barbell bench; Spoto press.

**Incline Machine Chest Press already exists at ID 12.** Make it findable using “incline bench machine” and “machine incline press.” Preserve its unspecified machine identity in old logs. Do not silently redefine it as selectorized, plate-loaded or a specific brand. Existing flat plate-loaded press is ID 13, Smith flat bench is 14, close-grip bench is 146; ordinary barbell/dumbbell flat/incline/decline rows already exist and must not be duplicated.

### Completion sequence

- [ ] Reconcile the audited main commit with the current branch and concurrent Claude work.
- [ ] Produce `exercise-addition-resolution.json`: every proposed key → final catalog ID, new/reused decision, reason, aliases and availability.
- [ ] Implement the four Zercher additions and two existing-row audits first.
- [ ] Implement the neck logging/data prerequisite, then all twelve neck exercises.
- [ ] Implement the eight bench variants and ID 12 search repair.
- [ ] Complete media treatment, app integration, regression tests and phone checks.
- [ ] Report the 24-row outcome individually. Do not mark a row done merely because its name appears in search.

## 2. Repository integration map — use the actual architecture

These files were inspected or identified in the audited tree. Re-read changed interfaces before modifying them; do not replace working engines with a parallel implementation.

| Concern | Existing location | Required behavior |
|---|---|---|
| Required Exercise fields / aggregation | `client/src/lib/exerciseCatalog.ts` | Append through one new module with fixed IDs; preserve old rows and calibration step. |
| Prior expansion / forearm records | `exerciseCatalogExpansion.ts`, `exerciseCatalogForearm.ts` in the same directory | Positional expansion 301–400 is closed; existing forearm IDs must remain stable. |
| Alias search | `client/src/lib/exerciseSearch.ts` | Add curated aliases using the existing index, across all pickers. |
| Muscle labels | `client/src/components/AnatomyMap.tsx` | Add a human-readable Neck label; no raw identifier on screen. |
| Muscle synonyms | `client/src/lib/muscleVocabulary.ts` | A neck filter must resolve neck exercises, not traps or random shoulder entries. |
| Equipment access | `client/src/lib/equipmentProfile.ts` | Distinguish a broad category from required accessories and actual machine availability. |
| Targeting / evidence | `client/src/lib/muscleTargetingModel.ts`, `exerciseStudyCalibration.ts` | Prevent accidental regex-based calibration and false numerical precision. |
| Volume and coverage | `weeklyVolume.ts`, `sessionVolume.ts`, `stackMuscleAnalysis.ts` in the same directory | Direct dynamic work, supporting work and holds remain distinguishable. |
| Specialization shapes | `shared/specialization/types.ts` | Respect existing modes and side rules; extend head direction explicitly. |
| Variant registry | `shared/specialization/variants/` | Stable variant IDs, execution metadata, review status and versioning. |
| Hold discovery | `shared/specialization/holdCatalogIds.ts` | Generated list presently derives from production atlas mappings; new holds must work without pretending neck is a forearm region. |
| Hold generation | `scripts/specialization/emit-logging-table.ts` | Update source of truth, regenerate table and lightweight measure list together. |
| Planner / prescriptions | `client/src/lib/workoutPlanner.ts`, `setPrescription.ts` | No reps↔seconds reinterpretation or automatic heavy neck defaults. |
| Swap / drop sets | `workoutSwap.ts`, `workoutSwapRecord.ts`, `dropSets.ts` | Preserve completed data and set grouping. |
| Ranking | `muscleRankLifts.ts`, `strengthPercentileCard.ts`, `workoutStrengthRecord.ts` | Unsupported variants remain unranked; do not borrow bench/deadlift norms. |
| Media | `client/src/lib/exercisePhotos.ts`, `scripts/exercise-photos/` | Exact-match asset or designed fallback; no false exercise demonstration. |
| Seed / migration history | `scripts/specialization/emit-seed.ts`, `server/specializationHistory.test.ts` | Append versioned content and keep applied migration hashes intact. |
| Database integration tests | `server/specializationSeed.test.ts`, `server/specializationSchemaV2.test.ts` | Verify append-only behavior and permissions without weakening publication guards. |

### Required catalog fields

The inspected `Exercise` interface requires `id`, `name`, `sourceGroup`, `category`, `equipment`, `movement`, `primaryMuscles`, `secondaryMuscles`, `qualities`, `muscleGrade`, and all five `sportFit` entries. `evidenceContext` is optional. Every proposed row in the manifest provides all required content fields; only the numeric ID awaits collision-safe allocation.

The interface does not currently expose execution instructions or machine setup fields. Add these through an appropriate shared metadata record keyed by stable exercise ID, or extend the interface and its serializers deliberately. **Do not paste unsupported keys into a TypeScript object and assume the UI consumes them.** Make the detail view actually render the execution instructions.

Grades in the manifest are conservative, explicitly provisional product judgments required for compatibility—not measured effectiveness. Persist that basis, show no claim of scientific calibration, and exclude these new exercises from automatic ranked recommendations until reviewed. Do not silently convert the provisional grade into a measured activation percentage. Do not manufacture S/SS grades to make the additions look finished.

## 3. Functional requirements that must precede catalog completion

### 3.1 Neck is a real first-class group

The audited base catalog has no neck exercise and the inspected anatomy labels do not expose a neck label. Introduce the broad catalog muscle key `neck` and the display label “Neck” across all registries that require known keys. It represents a region, not a single muscle.

- [ ] Register `neck` in labels, filters, exercise details, analysis serialization, planner coverage and any server allowlist that consumes catalog muscle keys.
- [ ] Search “neck,” “cervical,” and the exercise names consistently in Body Lab, plan picker, live-workout swap and global search.
- [ ] Add functional subgroups for flexion, extension, lateral flexion and rotation in the metadata layer. These are proposed identifiers, not assumed existing atlas node IDs.
- [ ] Do not assign neck work to `traps` to bypass missing-key errors.
- [ ] If no accurate body-map neck geometry exists, display a deliberate labeled Neck region chip/list entry that opens the neck detail. A full new 3D atlas is not a prerequisite. Do not paint a random shoulder polygon.
- [ ] Keep head-direction charts available even without a detailed anatomical model.

Anatomical context for the inspector: flexion involves SCM and deeper anterior neck muscles; extension involves posterior cervical extensors. Lateral bending recruits same-side contributors; rotation involves a cross-side muscle pattern, including contralateral SCM and ipsilateral splenius. These qualitative roles do not supply isolated-muscle set percentages. [N1, N2]

**Model decision:** use a midline neck region with head direction as a separate dimension for this release. Do not force a paired arm/leg region to stand for the neck. Do not turn “turn right” into “right SCM only.” Precise per-muscle attribution is explicitly pending until the direction-to-anatomy mapping is reviewed. Users still see useful, accurate directional exposure now.

### 3.2 Head direction is not arm side

Current `SidedBy` accepts `arm | leg | none`; `Limb` accepts `arm | leg`; the logged side model also refers to limbs. None means “the head turned right.” Add an optional structured neck context carried through the full pipeline:

```ts
type NeckDirection = 'flexion' | 'extension' |
  'lateral_flexion_left' | 'lateral_flexion_right' |
  'rotation_left' | 'rotation_right';
type NeckExecutionContext = {
  direction: NeckDirection | null; // null = genuinely unrecorded legacy context
  resistanceMode: 'machine' | 'cable_harness' | 'suspended_harness' | 'manual';
  setupKey: string | null;
};
```

This is a proposed contract; fit it into existing schemas and versioned serializers. Static flexion/extension directions can derive from the row. Lateral/rotational rows require a direction selector for new entries. Keep a legacy unknown bucket rather than inventing a direction.

- [ ] Use “Head direction: Left / Right” for lateral bending and rotation. For isometrics, label “Push/turn toward,” not “Head moved.”
- [ ] Save independent sets for left and right. Never duplicate a single logged set into two sets automatically.
- [ ] Preserve direction in plan prescriptions, live edits, drop segments, swaps, offline queue, server roundtrip, exports, history, workout repeat and shared stacks.
- [ ] Validate direction against exercise action. A flexion row cannot accept `rotation_left`.
- [ ] Continue using `sidedBy: none` for these rows; do not ask which arm performed a neck set.
- [ ] Neck 1×20 seconds right rotation produces 20 seconds of right-rotation effort, not 20 per side and not 20 reps.

### 3.3 Logging measures must not depend on faking atlas mappings

The current generated hold catalog derives from production specialization mappings. New manual neck holds and Zercher Hold need seconds even if no production region maps their fine-grained anatomy yet.

**Preferred implementation:** introduce or reuse a lightweight canonical exercise logging registry independent of atlas publication. The atlas can enrich it but must not be the only way an exercise becomes timed. Feed the existing generator from both sources, deduplicate by catalog ID, and fail on conflicting measure definitions. Avoid importing full anatomical drawings into the home bundle.

- [ ] `reps` for the 19 dynamic additions; `seconds` for four manual neck isometrics and Zercher Hold.
- [ ] Keep Zercher Carry ID 300 timed. Optional distance is an additional observation; the existing atlas SetMeasure only supports reps/seconds. Do not introduce an unconsumed `distance` enum.
- [ ] If timed logging currently requires weight, support null/unmeasured load for manual resistance. Null must not be coerced into a physical zero-force statement.
- [ ] Show “Manual resistance · force not measured” when appropriate; offer effort notes but no fabricated kg/lb.
- [ ] Keep timed totals separate from rep volume. Do not treat 30 seconds as 30 reps or kg×seconds as kg×reps.
- [ ] Do not generate e1RM for isometrics, manual-resistance neck work, unknown machine conventions or these unvalidated new variants.
- [ ] Allow users to set repetitions/time explicitly; automatic generic strength prescriptions remain off for neck until an intentional neck-specific policy is implemented and reviewed.

### 3.4 Machine-load context: essential scope, not the full machine platform

This release needs correct load recording for the new machine exercises; a global machine database and measured strength curves remain a separate feature.

Recommended structured fields: `equipmentInstanceId` (nullable), `machineLabel` (nullable), `loadConvention`, `leftLoad`/`rightLoad` when relevant, `unit`, `seatSetting`, `benchSetting`, `startingResistance` (nullable) and `startingResistanceSource` (nullable). Use existing equivalent fields where present.

Allowed conventions must distinguish total bar mass, machine-displayed mass, plates per arm, total plates, Smith plates-only, Smith total-known-resistance and suspended external mass. Validate which fields apply. Do not require both a total and per-arm value to agree unless an explicit conversion is defined.

- [ ] Machine logs retain their displayed value and machine identity/setup when available.
- [ ] Plate-loaded independent-arm press defaults to an explicitly labeled per-arm input, or the app's existing convention with equally explicit labels.
- [ ] Unequal loading remains representable; do not replace 40 kg left / 50 kg right with an unlabeled 90 kg.
- [ ] Unit conversion changes kg↔lb only, not pulley ratios, torque, effective hand force or starting resistance.
- [ ] Smith effective bar resistance stays null unless documented; never universally add a 45 lb bar.
- [ ] Machine setting changes are visible in history. Unknown old machine records remain in an unknown-machine group, rather than being retroactively assigned the user's current machine.
- [ ] Comparable PRs require the same variant, load convention and relevant setup. Effort and free-text notes are observations, not new comparison groups. Missing setup must remain clearly identified.
- [ ] An explicit user “repeat this setup” action may reuse known settings; an equipment swap must not silently reuse incompatible settings.

### 3.5 Muscle-role accounting and downstream heuristics

`primaryMuscles`/`secondaryMuscles` support discovery. They are not enough to distinguish dynamic prime movers from isometric support. Use the supplied `muscleRoles` as the explicit input to role-aware analysis, with the existing rule system's categories. Never add a separate hidden multiplier engine.

- [ ] Zercher elbow flexors hold the cradle; they are not doing dynamic curls. Forearms must not inherit farmer-hold grip credit just because a bar is present.
- [ ] Zercher squat/pull glute and quad work differs from stationary Zercher Hold. Avoid cloning one mapping across the family.
- [ ] Zercher good morning is a top-down hinge. Its loading and depth are not conventional-deadlift norms.
- [ ] Bench triceps/front delts assist pressing. Biceps are not made direct prime movers to fill a heat map.
- [ ] Neck directional work feeds neck coverage; it does not falsely close shoulder or trapezius shortfalls.
- [ ] Inspect name-based `exerciseStudyCalibration` and `muscleTargetingModel` logic. “Good morning,” “extension,” “hold” and “press” can trigger generic assumptions. Add explicit overrides/gates where necessary.
- [ ] No unsupported activation percentages, tendonitis probabilities, per-muscle force values, optimum-volume targets or machine strength curves.
- [ ] A null coefficient means uncalibrated, never zero involvement. Show role-based coverage while quantitative calibration is unavailable.
- [ ] Where the weekly engine uses global product heuristics, label estimates and keep direct/supporting/isometric lanes separate. A heuristic ranking is not a percentage of physiological recruitment.
- [ ] Do not publish draft atlas mappings as reviewed merely to satisfy the UI. Review the rationale/source and use the repository's supported publication path; display pending coverage honestly when unresolved.

## 4. Screen behavior and presentation

### Search and catalog

A search for “zercher” should expose the six options with concise distinctions: Squat, Floor pull, Elevated pull, Hip hinge, Carry, Hold. Reuse the existing card/list system. A compact sublabel explains setup; the catalog should not become six new screens.

A search for “neck” should let users filter by movement direction and available equipment. Start with a normal list; show setup detail on selection. The action selector must distinguish Rotation from Side bend. Do not show a generic “neck curl” for every direction.

A search for “incline bench machine” should return existing ID 12 and the new plate-loaded incline option with clear equipment labels. A brand name should be an equipment attribute, not a fabricated new exercise variant.

- [ ] Exact name and important aliases work in every picker, not only the catalog page.
- [ ] Search does not automatically select a result when multiple protocols match.
- [ ] Equipment filters respect accessories: Cable alone does not imply a head harness; Machine alone does not imply a neck machine. Manual additions remain possible with an explicit setup requirement.
- [ ] Generic recommendation lists do not insert new neck exercises into all plans simply because “combat” is selected.

### Exercise detail

Order: name → equipment/setup distinction → demonstration or fallback → three execution steps → logging convention → muscle-role summary → expandable evidence detail. Keep caveats with the relevant field; no full-screen warning wall.

Each detail must tell users exactly what a repetition/hold means and what load they are recording. Render sources as accessible links under “How this is mapped.” Label scientific evidence separately from manufacturer setup and coaching references. A grade or colored region cannot stand alone as explanation.

### Live logging

- [ ] Weight/reps for dynamic exercises; duration for holds; optional effort.
- [ ] Show direction chips before the first lateral/rotation neck set; remember for the next set but make the current direction always visible.
- [ ] A pause in a bench rep is setup/tempo context, not a separate set.
- [ ] Preserve one-bout grouping for drop sets with load/reps on each segment. Timed holds do not silently inherit rep-drop semantics.
- [ ] Mid-session swap preserves already completed records under the old exercise ID. Only future work changes; incompatible machine, direction and measure fields reset visibly.
- [ ] A saved session reopens with exactly the same conventions and values after a reload and after synchronization.

### Neck weekly view

Use four compact direction rows: Flexion, Extension, Side bend, Rotation. Side bend/rotation have separate Left and Right values. Show dynamic sets/reps and hold seconds in separate columns/toggles. No combined numerical “neck volume” that adds seconds to reps. Details can reveal the exercises producing each total. Empty direction = “No logged work,” not “weak” or injured.

### Phone quality

Follow repository `CLAUDE.md`: check 390×844 and 375×667, 44×44 touch targets, input text at least 16 px, safe-area padding, no hover-only actions, no horizontal overflow or footer obscuring the last exercise. Emulation is not an actual iPhone/Safari test; report accurately.

## 5. Database and migration tasks

- [ ] Inspect actual applied migration history and current schema before generating SQL. Main records schema v2/seed v2 as already applied.
- [ ] Keep all applied migration files and published mapping versions unchanged. Add a new migration for schema needs; regenerate only the current unapplied seed.
- [ ] Keep public catalog identity, specialization catalog linkage, variants, aliases and any new logger fields consistent. A catalog row is not necessarily a row in `public.exercises`; inspect the current seed/linking path and implement the missing upsert/link, rather than assuming it happens automatically.
- [ ] Seed additions idempotently under stable keys and fixed numeric IDs. A second application must not duplicate catalog entries, variants or sources.
- [ ] Do not disable region ownership/publication validation to make Zercher contributors fit the forearm atlas. Use valid home-owned mappings or keep explicit catalog-level role metadata outside an unavailable atlas region.
- [ ] Do not promote a reference region into production merely to make the hold generator accept its variant. Fix the logging dependency described above.
- [ ] Persist new metadata in the existing session/segment structure where possible. If an exposed table is necessary, add grants and RLS matching catalog-public versus user-owned data; test anonymous, owner and other-user access. [D1]
- [ ] Private machine labels, session settings and logs remain user-owned. No frontend service-role credentials.
- [ ] Preserve saved IDs and completed sets. New schema fields are nullable for legacy records; old sessions still render and sync.
- [ ] Version derived calculations separately from original observations. Do not rewrite old loads or infer missing neck directions on a backfill.
- [ ] Verify fresh database creation, upgrade from applied v2, and second-run idempotency. Include rollback/forward-fix notes without deleting user observations.

## 6. Evidence and media rules

The source list at the end is included to avoid open-ended guessing. Evidence is intentionally qualitative where quantitative data is absent. The bench EMG source supports testing angle-specific contexts; it does not prove a universal 30° optimum or that machine geometry equals a free bar. [B1] The neck research supports studying neck-specific training and directional mechanics, not individual tendon-injury predictions. [N1–N3] Zercher technique sources are coaching references, not controlled studies of muscle shares. [Z1, Z2]

Nine proposed records have metadata-confirmed Free Exercise DB media candidates. Their image files have **not** been visually approved in this handoff. Fifteen have no verified exact candidate here. The two manual front/back exercises share a dataset record, so Claude must select the correct direction-specific frame rather than showing the same image for opposite actions.

- [ ] Resolve each candidate at a pinned upstream commit and retain source path, author/attribution where available, license, checksum and review decision.
- [ ] Inspect the actual image, not just its filename. Check equipment, bench angle, head direction, body position, cropping and left/right labeling.
- [ ] Use repository curation/thumbnail scripts; do not hotlink fragile external images into production.
- [ ] Manufacturer pages are technique/equipment evidence, not permission to copy marketing images.
- [ ] For missing exact assets, use the existing deliberate equipment illustration plus the written protocol. Mark media as missing, not “verified photo.” No wrong demonstrator, broken image or unrelated bench photo.
- [ ] Do not use generated anatomy imagery as proof of movement or muscle activation. Custom licensed illustrations can be added later with technique review.
- [ ] Validate asset response, aspect ratio, alt text, lazy loading and failure fallback.

### Per-exercise specifications

Each record below is an implementation ticket. Primary/secondary catalog tags are for discovery; the muscle-role column specifies contraction behavior. The JSON appendix carries the complete proposed machine-readable records. Source IDs resolve in section 9.

### E01. Zercher Deadlift — Floor

**Stable import key:** `zercher_deadlift_floor` · **Group:** zercher · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Barbell / Hip and knee extension.
- **Primary catalog tags:** glutes, quads.
- **Supporting catalog tags:** hamstrings, adductors, lowerBack, upperBack, abs, biceps, brachialis.
- **Explicit muscle roles:** glutes — direct, dynamic; quads — direct, dynamic; hamstrings — contributing, dynamic; adductors — contributing, dynamic; abs — stabilizer, isometric; lowerBack — stabilizer, isometric; upperBack — stabilizer, isometric; biceps — stabilizer, isometric; brachialis — stabilizer, isometric.
- **Measure / load basis:** `reps` / `total_bar_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** bar_type, start_height_cm.
- **Aliases:** zercher deadlift; zercher floor pull; floor zercher deadlift.
- **Distinctness:** Starts in the elbow crooks on the floor; not a rack-start squat or a conventional deadlift.
- **Evidence:** Z1; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Start with a straight bar resting on the floor; position both elbow crooks under it before the working repetition.
2. Brace the trunk and stand by extending hips and knees while keeping the load cradled.
3. Return the bar under control and reset on the floor. A conventional hand-grip deadlift followed by a lap transfer is a different protocol.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E02. Zercher Block Pull

**Stable import key:** `zercher_block_pull` · **Group:** zercher · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Barbell / Hip and knee extension.
- **Primary catalog tags:** glutes, quads.
- **Supporting catalog tags:** hamstrings, adductors, lowerBack, upperBack, abs, biceps, brachialis.
- **Explicit muscle roles:** glutes — direct, dynamic; quads — direct, dynamic; hamstrings — contributing, dynamic; adductors — contributing, dynamic; abs — stabilizer, isometric; lowerBack — stabilizer, isometric; upperBack — stabilizer, isometric; biceps — stabilizer, isometric; brachialis — stabilizer, isometric.
- **Measure / load basis:** `reps` / `total_bar_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** start_height_cm, bar_type.
- **Aliases:** zercher rack pull; elevated zercher deadlift; zercher pin pull.
- **Distinctness:** Starting height changes the protocol and PR comparison; never merge with floor pulls.
- **Evidence:** Z1; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Support the bar on stable blocks or pins and record bar-center starting height.
2. Place the bar in both elbow crooks, brace and stand.
3. Lower to the same supports and reset each repetition.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E03. Zercher Good Morning

**Stable import key:** `zercher_good_morning` · **Group:** zercher · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Barbell / Hip hinge.
- **Primary catalog tags:** hamstrings, glutes.
- **Supporting catalog tags:** adductors, lowerBack, upperBack, abs, biceps, brachialis.
- **Explicit muscle roles:** hamstrings — direct, dynamic; glutes — direct, dynamic; adductors — contributing, dynamic; abs — stabilizer, isometric; lowerBack — stabilizer, isometric; upperBack — stabilizer, isometric; biceps — stabilizer, isometric; brachialis — stabilizer, isometric.
- **Measure / load basis:** `reps` / `total_bar_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** bar_type, rom_note.
- **Aliases:** zercher hip hinge; zercher Romanian deadlift; zercher RDL.
- **Distinctness:** RDL alias applies only to this top-down, no-floor-reset protocol. Keep floor and block pulls distinct.
- **Evidence:** Z1, Z2; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Unrack the bar into both elbow crooks and begin standing.
2. Maintain a modest knee bend; hinge the hips backward with the bar cradled close.
3. Extend the hips to stand; the bar does not reset on the floor between repetitions.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E04. Zercher Hold

**Stable import key:** `zercher_hold` · **Group:** zercher · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Barbell / Loaded stationary hold.
- **Primary catalog tags:** abs, upperBack.
- **Supporting catalog tags:** lowerBack, biceps, brachialis.
- **Explicit muscle roles:** abs — stabilizer, isometric; lowerBack — stabilizer, isometric; upperBack — stabilizer, isometric; biceps — stabilizer, isometric; brachialis — stabilizer, isometric.
- **Measure / load basis:** `seconds` / `total_bar_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** bar_type.
- **Aliases:** zercher static hold; zercher isometric hold.
- **Distinctness:** Timed trunk and elbow-flexor isometrics; not dynamic curl sets or a hand-grip hold.
- **Evidence:** Z1; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Unrack a bar into both elbow crooks and stand in a stable stance.
2. Keep the load and trunk position steady; start the timer once positioned.
3. Stop the timer when the hold ends and rerack. Walking belongs to Zercher Carry.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E05. Machine Neck Flexion

**Stable import key:** `machine_neck_flexion` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Neck flexion.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.flexors — direct, dynamic.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** effort, setup_note, machine_model, seat_setting, pad_setting.
- **Aliases:** machine neck flexion; neck curl.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3, N4; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.
2. Bring the chin and head forward through a controlled comfortable flexion range without moving the torso.
3. Return slowly to the start; count one complete out-and-back movement as one repetition.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E06. Machine Neck Extension

**Stable import key:** `machine_neck_extension` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Neck extension.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.extensors — direct, dynamic.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** effort, setup_note, machine_model, seat_setting, pad_setting.
- **Aliases:** machine neck extension; neck extension.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3, N4; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.
2. Extend the neck against resistance while keeping the torso supported; return under control without swinging.
3. Return slowly to the start; count one complete out-and-back movement as one repetition.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E07. Machine Neck Lateral Flexion

**Stable import key:** `machine_neck_lateral_flexion` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Neck lateral flexion.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.lateral_flexors — direct, dynamic, side=same.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Left or right head direction.
- **Setup fields:** effort, setup_note, machine_model, seat_setting, pad_setting.
- **Aliases:** machine neck lateral flexion; side neck bend.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3, N4; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.
2. Move the ear toward the shoulder on the selected side without turning the face or leaning the torso.
3. Return slowly to the start; count one complete out-and-back movement as one repetition.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E08. Seated Harness Neck Extension

**Stable import key:** `harness_neck_extension` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Free weights / Neck extension.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.extensors — direct, dynamic.
- **Measure / load basis:** `reps` / `suspended_external_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** effort, setup_note.
- **Aliases:** seated harness neck extension; neck extension.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Seated_Head_Harness_Neck_Resistance` — visual approval still required.

**Execution protocol**

1. Sit with a secure head harness and suspended plates; incline the torso forward so gravity opposes neck extension.
2. Extend the neck against resistance while keeping the torso supported; return under control without swinging.
3. Record suspended plate mass and torso setup; do not equate it to a neck-machine stack value.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E09. Cable Harness Neck Flexion

**Stable import key:** `cable_neck_flexion` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Cable / Neck flexion.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.flexors — direct, dynamic.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** effort, setup_note, attachment_setup.
- **Aliases:** cable harness neck flexion; neck curl.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.
2. Bring the chin and head forward through a controlled comfortable flexion range without moving the torso.
3. Keep the attachment and torso position repeatable; log pulley setting and harness configuration.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E10. Cable Harness Neck Extension

**Stable import key:** `cable_neck_extension` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Cable / Neck extension.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.extensors — direct, dynamic.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** effort, setup_note, attachment_setup.
- **Aliases:** cable harness neck extension; neck extension.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.
2. Extend the neck against resistance while keeping the torso supported; return under control without swinging.
3. Keep the attachment and torso position repeatable; log pulley setting and harness configuration.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E11. Cable Harness Neck Lateral Flexion

**Stable import key:** `cable_neck_lateral_flexion` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Cable / Neck lateral flexion.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.lateral_flexors — direct, dynamic, side=same.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Left or right head direction.
- **Setup fields:** effort, setup_note, attachment_setup.
- **Aliases:** cable harness neck lateral flexion; side neck bend.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.
2. Move the ear toward the shoulder on the selected side without turning the face or leaning the torso.
3. Keep the attachment and torso position repeatable; log pulley setting and harness configuration.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E12. Cable Harness Neck Rotation

**Stable import key:** `cable_neck_rotation` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Cable / Neck rotation.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.rotators — direct, dynamic.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Left or right head direction.
- **Setup fields:** effort, setup_note, attachment_setup.
- **Aliases:** cable harness neck rotation; neck rotation.
- **Distinctness:** Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.
2. Turn the face toward the selected side against the opposing resistance; keep the torso still.
3. Keep the attachment and torso position repeatable; log pulley setting and harness configuration.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E13. Isometric Neck Flexion — Manual Resistance

**Stable import key:** `isometric_neck_flexion` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Bodyweight / Neck flexion.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.flexors — direct, isometric.
- **Measure / load basis:** `seconds` / `manual_unmeasured`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** effort, setup_note.
- **Aliases:** isometric neck flexion; neck curl; manual neck flexion hold.
- **Distinctness:** Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Isometric_Neck_Exercise_-_Front_And_Back` — visual approval still required.

**Execution protocol**

1. Sit with the head near neutral and the torso supported.
2. Apply hand resistance at the forehead, opposing an attempt to flex forward; hold without actual head movement.
3. Build and release tension smoothly while breathing; record the hold time, intended direction and effort.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E14. Isometric Neck Extension — Manual Resistance

**Stable import key:** `isometric_neck_extension` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Bodyweight / Neck extension.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.extensors — direct, isometric.
- **Measure / load basis:** `seconds` / `manual_unmeasured`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** effort, setup_note.
- **Aliases:** isometric neck extension; neck extension; manual neck extension hold.
- **Distinctness:** Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Isometric_Neck_Exercise_-_Front_And_Back` — visual approval still required.

**Execution protocol**

1. Sit with the head near neutral and the torso supported.
2. Apply hand resistance at the back of the skull, opposing an attempt to extend backward; hold without actual head movement.
3. Build and release tension smoothly while breathing; record the hold time, intended direction and effort.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E15. Isometric Neck Lateral Flexion — Manual Resistance

**Stable import key:** `isometric_neck_lateral_flexion` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Bodyweight / Neck lateral flexion.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.lateral_flexors — direct, isometric, side=same.
- **Measure / load basis:** `seconds` / `manual_unmeasured`.
- **Required direction:** Left or right head direction.
- **Setup fields:** effort, setup_note.
- **Aliases:** isometric neck lateral flexion; side neck bend; manual neck lateral flexion hold.
- **Distinctness:** Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Isometric_Neck_Exercise_-_Sides` — visual approval still required.

**Execution protocol**

1. Sit with the head near neutral and the torso supported.
2. Apply hand resistance at the side of the head, opposing an attempt to bend toward the selected side; hold without actual head movement.
3. Build and release tension smoothly while breathing; record the hold time, intended direction and effort.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E16. Isometric Neck Rotation — Manual Resistance

**Stable import key:** `isometric_neck_rotation` · **Group:** neck · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Bodyweight / Neck rotation.
- **Primary catalog tags:** neck.
- **Supporting catalog tags:** none asserted.
- **Explicit muscle roles:** neck.rotators — direct, isometric.
- **Measure / load basis:** `seconds` / `manual_unmeasured`.
- **Required direction:** Left or right head direction.
- **Setup fields:** effort, setup_note.
- **Aliases:** isometric neck rotation; neck rotation; manual neck rotation hold.
- **Distinctness:** Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.
- **Evidence:** N1, N2, N3; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Sit with the head near neutral and the torso supported.
2. Apply hand resistance at the side of the forehead/temple, opposing an attempt to turn the face toward the selected side; hold without actual head movement.
3. Build and release tension smoothly while breathing; record the hold time, intended direction and effort.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E17. Plate-Loaded Incline Chest Press

**Stable import key:** `plate_loaded_incline_press` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Incline press.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `plates_per_arm`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** machine_model, seat_or_bench_setting, load_convention.
- **Aliases:** incline plate loaded chest press; incline lever press.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1, B2, B3, M1; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Leverage_Incline_Chest_Press` — visual approval still required.

**Execution protocol**

1. Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.
2. Press the handles away and return under control without bouncing the stop.
3. For independent arms record each arm’s plate load; for a stack record the displayed setting. Do not assume either equals hand force.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E18. Selectorized Decline Chest Press

**Stable import key:** `selectorized_decline_press` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Decline press.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `machine_display`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** machine_model, seat_or_bench_setting, load_convention.
- **Aliases:** decline stack chest press.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.
2. Press the handles away and return under control without bouncing the stop.
3. For independent arms record each arm’s plate load; for a stack record the displayed setting. Do not assume either equals hand force.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E19. Plate-Loaded Decline Chest Press

**Stable import key:** `plate_loaded_decline_press` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Decline press.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `plates_per_arm`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** machine_model, seat_or_bench_setting, load_convention.
- **Aliases:** decline lever press.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1, M1; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Leverage_Decline_Chest_Press` — visual approval still required.

**Execution protocol**

1. Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.
2. Press the handles away and return under control without bouncing the stop.
3. For independent arms record each arm’s plate load; for a stack record the displayed setting. Do not assume either equals hand force.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E20. Smith Machine Incline Bench Press

**Stable import key:** `smith_incline_bench` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Incline press.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `smith_declared`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** machine_model, seat_or_bench_setting, load_convention.
- **Aliases:** incline smith press.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1, M1; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Smith_Machine_Incline_Bench_Press` — visual approval still required.

**Execution protocol**

1. Place the appropriate incline or decline bench under the Smith bar and set the safety stops. Record bench setting and machine.
2. Lower the bar in a controlled path toward the chest, then press upward while keeping the torso supported.
3. Use the same load convention each session: plates-only or total including known effective bar resistance. Unknown effective bar resistance remains unknown.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E21. Smith Machine Decline Bench Press

**Stable import key:** `smith_decline_bench` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Machine / Decline press.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `smith_declared`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** machine_model, seat_or_bench_setting, load_convention.
- **Aliases:** decline smith press.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1, M1; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Smith_Machine_Decline_Press` — visual approval still required.

**Execution protocol**

1. Place the appropriate incline or decline bench under the Smith bar and set the safety stops. Record bench setting and machine.
2. Lower the bar in a controlled path toward the chest, then press upward while keeping the torso supported.
3. Use the same load convention each session: plates-only or total including known effective bar resistance. Unknown effective bar resistance remains unknown.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E22. Barbell Floor Press

**Stable import key:** `barbell_floor_press` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Barbell / Horizontal push.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `total_bar_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** setup_note.
- **Aliases:** floor press barbell.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1, M1; anatomical inference; quantitative calibration unavailable.
- **Media candidate:** `Floor_Press` — visual approval still required.

**Execution protocol**

1. Lie on the floor under a racked bar and establish a stable grip and shoulder position.
2. Lower until the upper arms contact the floor gently, pause without bouncing, then press.
3. The floor limits shoulder excursion. Keep this history separate from bench-supported pressing.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E23. Paused Barbell Bench Press

**Stable import key:** `paused_barbell_bench` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Barbell / Horizontal push.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `total_bar_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** pause_seconds.
- **Aliases:** pause bench; competition style paused bench.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Set up on a flat bench and unrack the bar.
2. Lower to chest contact and hold a deliberate motionless pause without bouncing.
3. Press to the finish and record pause duration when known. Pausing does not create a separate logged set.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

### E24. Spoto Press

**Stable import key:** `spoto_press` · **Group:** bench · **Status:** proposed new row, final ID unallocated.

- **Equipment / movement:** Barbell / Horizontal push.
- **Primary catalog tags:** chest.
- **Supporting catalog tags:** triceps, frontDelts.
- **Explicit muscle roles:** chest — direct, dynamic; triceps — contributing, dynamic; frontDelts — contributing, dynamic.
- **Measure / load basis:** `reps` / `total_bar_mass`.
- **Required direction:** Derived from the defined action or not applicable.
- **Setup fields:** pause_seconds, hover_distance_cm.
- **Aliases:** hover pause bench; spoto bench.
- **Distinctness:** Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.
- **Evidence:** B1; anatomical inference; quantitative calibration unavailable.
- **Media:** no verified exact candidate; use the designed fallback until an exact asset is approved.

**Execution protocol**

1. Set up on a flat bench and unrack the bar.
2. Lower to a small consistent hover above the chest; pause without touching the chest.
3. Press to the finish. Record hover distance and pause duration when known.

**Row acceptance**

- [ ] Resolve final stable ID without duplicating an existing protocol.
- [ ] Save every catalog field, aliases, instructions, source/basis and required equipment context.
- [ ] Log, reload and sync a representative set with the correct measure/load/direction.
- [ ] Confirm direct/supporting/isometric analysis and unsupported-norm behavior.
- [ ] Verify actual media or intentional fallback on a phone.
- [ ] Record final test IDs and evidence in the completion ledger.

## 7. Concrete acceptance tests — execute these, do not merely read them

| ID | Scenario | Required result |
|---|---|---|
| T01 | Search Zercher in all four pickers | Six intended protocols; squat and carry retain IDs 164/300. |
| T02 | Search incline bench machine | Existing ID 12 visible, plus clearly labeled new plate-loaded option; no duplicate generic row. |
| T03 | Log floor Zercher 3×5 at 100 kg, then block pull 3×5 at 100 kg / 30 cm start | Separate histories and comparable-setup groups; no deadlift percentile inherited. |
| T04 | Change block height from 30 cm to 45 cm | Setup difference visible; not silently presented as the same-protocol PR. |
| T05 | Log Zercher Hold 2×20 seconds at 60 kg | 40 seconds total; two hold bouts; no 40-rep total, dynamic biceps-curl credit or measured grip credit. |
| T06 | Repeat legacy Zercher Carry | Existing logs still parse; no retagging original observations or deletion. |
| T07 | Log manual right lateral hold 20 seconds, left 15 seconds | Right 20 / left 15; total 35; load unmeasured, no per-arm duplicate. |
| T08 | Right rotation neck set | Direction right; no automatic right-only SCM allocation. |
| T09 | Neck flexion with rotation direction injected | Validation rejects the inconsistent new payload. |
| T10 | Legacy record without direction | Survives in an unknown-direction bucket, never guessed or discarded. |
| T11 | Cable neck exercise without available harness | Not auto-recommended solely because Cable is available; setup requirement visible in manual picker. |
| T12 | Swap timed manual hold to dynamic machine extension | Completed hold stays seconds; upcoming set uses reps; no unit reinterpretation or stale direction. |
| T13 | Plate incline press 40 kg left / 50 kg right | Both values preserved; no ambiguous 90 kg load or artificial left/right equality. |
| T14 | Change machine model or load convention | Comparison grouping changes; no cross-machine PR claim. |
| T15 | Smith unknown effective bar weight, 20 kg plates each side | Explicit plates-only 40 kg; no automatic 20 kg/45 lb bar addition. |
| T16 | Dynamic neck 12 repetitions | Neck dynamic exposure recorded; not counted as 12 seconds. |
| T17 | Paused bench 5 reps, 2-second pause | One set with pause context; not five holds plus a set; no guarantee of competition eligibility. |
| T18 | Spoto set vs chest-contact paused set | Distinct variants and history; hover distance remains setup metadata. |
| T19 | Drop set on a machine press with three load segments | One bout with three segments under the established drop-set rules, not three fabricated independent sets. |
| T20 | Finish workout offline; reload; sync twice | One session/set per stable key; values and metadata survive without duplication. |
| T21 | Weekly review containing neck holds and dynamic sets | Separate sets/reps and seconds; no mixed-unit sum. |
| T22 | New exercise with no normative reference | Shows unranked / no comparison available, never 0th percentile or borrowed bench/deadlift rank. |
| T23 | Regenerate logging table + holds + seed | Deterministic output, no manual generated-file drift. |
| T24 | Apply new migration/seed twice over applied v2 | Idempotent; applied migration hashes and original observations unchanged. |
| T25 | User A and User B machine/log records | Neither user reads or edits the other's private records. Public catalog reads follow existing policy. |
| T26 | Failed photo request / missing exact asset | Stable fallback, useful instructions, no broken image or mismatched technique photo. |
| T27 | 375px and 390px detail, direction selector, logger and picker | No overlap, clipped units, hidden CTA, tiny targets or footer-obscured last row. |
| T28 | Existing forearm flow after the new logging registry | Holds, per-arm entries, drop sets and prior variant IDs still work; no regression from neck direction. |

### Automated verification and release evidence

- [ ] Add a data-contract test that resolves all 24 proposal keys to exactly one valid current exercise each, with no duplicate IDs or canonical names.
- [ ] Verify all three reuse targets by ID and name against the current catalog.
- [ ] Check required fields, legal equipment values, known muscle keys, five sport entries, source references, valid load conventions and at least one role per new exercise.
- [ ] Check 19 rep-based additions and five timed additions; no accidental rep defaults for holds.
- [ ] Unit-test direction validation, comparison-key construction, null load, unit conversion, hold accounting and unknown-norm behavior.
- [ ] Integration-test plan → workout → history → repeat → export/share roundtrips, including offline retry and swaps.
- [ ] Test database upgrade and role permissions in the existing Postgres-compatible fixture. Do not weaken tests that protect published records just to make new data fit.
- [ ] Run project typecheck, relevant regression suites, generators with check mode where supported, and production build. Use actual package scripts/toolchain from the current repo.
- [ ] Inspect phone screenshots and report emulated versus physical device coverage truthfully.
- [ ] Include a final ledger with `key`, final ID, code path, mapping status, media status, test evidence and deployment status.
- [ ] Do not describe production as updated until the deployed build and database are checked.

## 8. What counts as complete

### Definition-ready (this handoff)

- [x] Four distinct missing Zercher protocols specified; existing squat/carry identified.
- [x] Twelve neck protocols specified with directional and isometric behavior.
- [x] Eight missing bench/press protocols specified; existing incline machine identified.
- [x] Required catalog content, instructions, aliases, role semantics and logging contracts supplied for all 24.
- [x] Normative/reference gaps explicit rather than invented.
- [x] Every row has a media decision: candidate requiring inspection or explicit fallback.
- [x] Stable keys supplied; unsafe fixed-ID assumptions avoided.
- [x] Current repository migration status checked; old pending-v2 advice superseded.

### Implementation-ready release (Claude must achieve)

- [ ] Every new row usable in the website, not merely in a data file.
- [ ] Neck key, head direction, timed registry and required serialization changes completed.
- [ ] Media approved where exact candidates exist; all other rows have the intentional fallback.
- [ ] Qualitative mapping review completed or unresolved coverage visibly identified; no false scientific precision.
- [ ] Regression tests and production build pass with evidence.
- [ ] Actual database/publication state and deployed state reported separately.

**Known limitations of this handoff:** no live application code was changed in this task; the JSON is not a migration. No new photograph was downloaded or visually approved. No measured per-muscle percentages, machine curves or percentile norms were established. These are deliberate unknowns, not permission for Claude to fill in plausible-looking numbers. Core exercise discovery, logging and qualitative coverage can work without those measurements.

## 9. Source register and provenance

Source URLs were retrieved or metadata-checked on 23 October 2026. Some NCBI full-text requests returned an access challenge; use the primary indexed abstracts for the limited qualitative claims here. Do not claim full-text verification where it did not occur. The Supabase changelog markdown endpoint returned an unsupported-content error; the relevant RLS documentation was accessible. No live Supabase mutation was performed.

- **Z1 — practitioner technique:** https://elitefts.com/blogs/training/zerchers-simple-evaluations-of-complex-movements?constraint=powerlifting
  - Use: Distinguishing floor, elevated and top-down Zercher setups; not measured activation, superiority or injury probabilities.

- **Z2 — practitioner technique:** https://elitefts.com/blogs/training/good-mornings-understanding-a-great-exercise
  - Use: Named Zercher good-morning variation; qualitative technique reference only.

- **N1 — primary anatomical function study:** https://pubmed.ncbi.nlm.nih.gov/8610245/
  - Use: Direction-dependent neck muscle participation; not exercise-specific allocation percentages.

- **N2 — primary biomechanics study:** https://pubmed.ncbi.nlm.nih.gov/9516695/
  - Use: Neck moment-generating capacity depends on muscle and direction; not a personal load conversion.

- **N3 — primary longitudinal study:** https://pubmed.ncbi.nlm.nih.gov/9189733/
  - Use: Direct neck resistance training studied for size and strength; no universal optimum for every neck exercise.

- **N4 — manufacturer technique:** https://rogersathletic.com/updates/get-strong-blog/the-neck-machine-set-up-and-use/
  - Use: Different machine configurations for flexion, extension and side bending; settings are model-specific.

- **B1 — primary EMG study:** https://pubmed.ncbi.nlm.nih.gov/33049982/
  - Use: Bench inclination changes acute muscle excitation in the tested barbell protocol; not machine equivalence or hypertrophy percentages.

- **B2 — manufacturer equipment:** https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/plate-loaded-iso-lateral-incline-press
  - Use: Plate-loaded incline pressing with independent arms exists; no universal torque conversion.

- **B3 — manufacturer equipment:** https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/life-fitness-incline-press
  - Use: Machine design and movement path differ; user-facing machine setup matters.

- **M1 — exercise media dataset:** https://github.com/yuhonas/free-exercise-db
  - Use: Candidate exercise photographs and metadata only; requires visual inspection before mapping.

- **M2 — license:** https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md
  - Use: Repository declares Unlicense; retain provenance and check asset-specific restrictions.

- **D1 — official technical documentation:** https://supabase.com/docs/guides/database/postgres/row-level-security
  - Use: Grants and row policies both matter for exposed data; ownership tests required for user records.

Repository audit: https://github.com/LocalForgeWeb/Sports-genome/tree/1056aca1fe244613fce3515fa5c6854dd8c45d8e

Inspected catalog: `client/src/lib/exerciseCatalog.ts`, `exerciseCatalogExpansion.ts`, `exerciseCatalogForearm.ts`. Additional inspected integration files include exercise search, muscle vocabulary, targeting model, equipment profile, planner, rank selection, anatomy labels, specialization types/variants, hold registry and seed emitter. This is a targeted code audit, not a claim that every repository module was tested.

## 10. Extractable record manifest

This JSON is the source of the exercise tickets above. `catalogId` and `catalog.id` must be assigned together after reconciliation. Proposed metadata keys must be wired into actual application types and persisted paths; they are not claimed to already exist in Supabase.

Extraction from this Markdown file:

```python
from pathlib import Path
import json, re
text = Path('Sports-Genome-Zercher-Neck-Bench-Claude.md').read_text()
block = re.search(r'<!-- EXERCISE_MANIFEST_START -->\s*```json\s*(.*?)\s*```', text, re.S)
assert block, 'Manifest missing'
data = json.loads(block.group(1))
assert len(data['exercises']) == data['newCount'] == 24
assert len({row['key'] for row in data['exercises']}) == 24
Path('exercise-additions.json').write_text(json.dumps(data, indent=2) + '\n')
```

<!-- EXERCISE_MANIFEST_START -->
```json
{
  "format": "sports-genome-exercise-handoff/v1",
  "preparedDate": "2026-10-23",
  "repository": "LocalForgeWeb/Sports-genome",
  "auditedCommit": "1056aca1fe244613fce3515fa5c6854dd8c45d8e",
  "status": "specification_verified_not_implemented",
  "newCount": 24,
  "existingRowsToReuse": [
    {
      "catalogId": 164,
      "name": "Zercher Squat",
      "action": "reuse_and_audit_role_mapping",
      "reason": "Exists already; add discovery aliases and explicit elbow-flexor/trunk isometric roles without rewriting historical mapping versions."
    },
    {
      "catalogId": 300,
      "name": "Zercher Carry",
      "action": "reuse_and_audit_role_mapping",
      "reason": "Exists and is already timed. Current primary forearms tag must not produce hand-grip exposure for elbow-cradled carrying."
    },
    {
      "catalogId": 12,
      "name": "Incline Machine Chest Press",
      "action": "reuse_and_improve_discovery",
      "reason": "Exists already. Add incline bench machine/machine incline press aliases. Existing unspecified equipment must stay unspecified; never relabel old logs as selectorized."
    }
  ],
  "sources": {
    "Z1": {
      "url": "https://elitefts.com/blogs/training/zerchers-simple-evaluations-of-complex-movements?constraint=powerlifting",
      "type": "practitioner technique",
      "supports": "Distinguishing floor, elevated and top-down Zercher setups; not measured activation, superiority or injury probabilities."
    },
    "Z2": {
      "url": "https://elitefts.com/blogs/training/good-mornings-understanding-a-great-exercise",
      "type": "practitioner technique",
      "supports": "Named Zercher good-morning variation; qualitative technique reference only."
    },
    "N1": {
      "url": "https://pubmed.ncbi.nlm.nih.gov/8610245/",
      "type": "primary anatomical function study",
      "supports": "Direction-dependent neck muscle participation; not exercise-specific allocation percentages."
    },
    "N2": {
      "url": "https://pubmed.ncbi.nlm.nih.gov/9516695/",
      "type": "primary biomechanics study",
      "supports": "Neck moment-generating capacity depends on muscle and direction; not a personal load conversion."
    },
    "N3": {
      "url": "https://pubmed.ncbi.nlm.nih.gov/9189733/",
      "type": "primary longitudinal study",
      "supports": "Direct neck resistance training studied for size and strength; no universal optimum for every neck exercise."
    },
    "N4": {
      "url": "https://rogersathletic.com/updates/get-strong-blog/the-neck-machine-set-up-and-use/",
      "type": "manufacturer technique",
      "supports": "Different machine configurations for flexion, extension and side bending; settings are model-specific."
    },
    "B1": {
      "url": "https://pubmed.ncbi.nlm.nih.gov/33049982/",
      "type": "primary EMG study",
      "supports": "Bench inclination changes acute muscle excitation in the tested barbell protocol; not machine equivalence or hypertrophy percentages."
    },
    "B2": {
      "url": "https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/plate-loaded-iso-lateral-incline-press",
      "type": "manufacturer equipment",
      "supports": "Plate-loaded incline pressing with independent arms exists; no universal torque conversion."
    },
    "B3": {
      "url": "https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/life-fitness-incline-press",
      "type": "manufacturer equipment",
      "supports": "Machine design and movement path differ; user-facing machine setup matters."
    },
    "M1": {
      "url": "https://github.com/yuhonas/free-exercise-db",
      "type": "exercise media dataset",
      "supports": "Candidate exercise photographs and metadata only; requires visual inspection before mapping."
    },
    "M2": {
      "url": "https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md",
      "type": "license",
      "supports": "Repository declares Unlicense; retain provenance and check asset-specific restrictions."
    },
    "D1": {
      "url": "https://supabase.com/docs/guides/database/postgres/row-level-security",
      "type": "official technical documentation",
      "supports": "Grants and row policies both matter for exposed data; ownership tests required for user records."
    }
  },
  "exercises": [
    {
      "key": "zercher_deadlift_floor",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "zercher",
      "catalog": {
        "id": null,
        "name": "Zercher Deadlift \u2014 Floor",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Lower body & carries",
        "equipment": "Barbell",
        "movement": "Hip and knee extension",
        "primaryMuscles": [
          "glutes",
          "quads"
        ],
        "secondaryMuscles": [
          "hamstrings",
          "adductors",
          "lowerBack",
          "upperBack",
          "abs",
          "biceps",
          "brachialis"
        ],
        "qualities": [
          "strength",
          "hypertrophy",
          "bracing"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "zercher deadlift",
        "zercher floor pull",
        "floor zercher deadlift"
      ],
      "distinction": "Starts in the elbow crooks on the floor; not a rack-start squat or a conventional deadlift.",
      "setup": {
        "start": "floor",
        "barType": "straight",
        "contact": "elbow_crooks",
        "rom": "individualized_floor_to_standing",
        "lowerBodyLaterality": "bilateral"
      },
      "executionSteps": [
        "Start with a straight bar resting on the floor; position both elbow crooks under it before the working repetition.",
        "Brace the trunk and stand by extending hips and knees while keeping the load cradled.",
        "Return the bar under control and reset on the floor. A conventional hand-grip deadlift followed by a lap transfer is a different protocol."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "total_bar_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "bar_type",
          "start_height_cm"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "bar_type",
          "start_height_cm"
        ]
      },
      "muscleRoles": [
        {
          "target": "glutes",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "quads",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "hamstrings",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "adductors",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "abs",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "lowerBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "upperBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "biceps",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "brachialis",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "Z1"
      ],
      "catalogAnalogueId": 41,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "zercher_block_pull",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "zercher",
      "catalog": {
        "id": null,
        "name": "Zercher Block Pull",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Lower body & carries",
        "equipment": "Barbell",
        "movement": "Hip and knee extension",
        "primaryMuscles": [
          "glutes",
          "quads"
        ],
        "secondaryMuscles": [
          "hamstrings",
          "adductors",
          "lowerBack",
          "upperBack",
          "abs",
          "biceps",
          "brachialis"
        ],
        "qualities": [
          "strength",
          "hypertrophy",
          "bracing"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "zercher rack pull",
        "elevated zercher deadlift",
        "zercher pin pull"
      ],
      "distinction": "Starting height changes the protocol and PR comparison; never merge with floor pulls.",
      "setup": {
        "start": "elevated_support",
        "barType": "straight",
        "contact": "elbow_crooks",
        "rom": "height_defined",
        "lowerBodyLaterality": "bilateral"
      },
      "executionSteps": [
        "Support the bar on stable blocks or pins and record bar-center starting height.",
        "Place the bar in both elbow crooks, brace and stand.",
        "Lower to the same supports and reset each repetition."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "total_bar_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "start_height_cm",
          "bar_type"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "start_height_cm",
          "bar_type"
        ]
      },
      "muscleRoles": [
        {
          "target": "glutes",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "quads",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "hamstrings",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "adductors",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "abs",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "lowerBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "upperBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "biceps",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "brachialis",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "Z1"
      ],
      "catalogAnalogueId": 41,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "zercher_good_morning",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "zercher",
      "catalog": {
        "id": null,
        "name": "Zercher Good Morning",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Lower body & carries",
        "equipment": "Barbell",
        "movement": "Hip hinge",
        "primaryMuscles": [
          "hamstrings",
          "glutes"
        ],
        "secondaryMuscles": [
          "adductors",
          "lowerBack",
          "upperBack",
          "abs",
          "biceps",
          "brachialis"
        ],
        "qualities": [
          "strength",
          "hypertrophy",
          "bracing"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "zercher hip hinge",
        "zercher Romanian deadlift",
        "zercher RDL"
      ],
      "distinction": "RDL alias applies only to this top-down, no-floor-reset protocol. Keep floor and block pulls distinct.",
      "setup": {
        "start": "standing_from_rack",
        "contact": "elbow_crooks",
        "rom": "controlled_top_down_hip_hinge",
        "lowerBodyLaterality": "bilateral"
      },
      "executionSteps": [
        "Unrack the bar into both elbow crooks and begin standing.",
        "Maintain a modest knee bend; hinge the hips backward with the bar cradled close.",
        "Extend the hips to stand; the bar does not reset on the floor between repetitions."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "total_bar_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "bar_type",
          "rom_note"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "bar_type"
        ]
      },
      "muscleRoles": [
        {
          "target": "hamstrings",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "glutes",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "adductors",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "abs",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "lowerBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "upperBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "biceps",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "brachialis",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "Z1",
        "Z2"
      ],
      "catalogAnalogueId": 190,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "zercher_hold",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "zercher",
      "catalog": {
        "id": null,
        "name": "Zercher Hold",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Lower body & carries",
        "equipment": "Barbell",
        "movement": "Loaded stationary hold",
        "primaryMuscles": [
          "abs",
          "upperBack"
        ],
        "secondaryMuscles": [
          "lowerBack",
          "biceps",
          "brachialis"
        ],
        "qualities": [
          "strength",
          "endurance",
          "bracing"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "zercher static hold",
        "zercher isometric hold"
      ],
      "distinction": "Timed trunk and elbow-flexor isometrics; not dynamic curl sets or a hand-grip hold.",
      "setup": {
        "start": "standing",
        "contact": "elbow_crooks",
        "rom": "stationary",
        "lowerBodyLaterality": "bilateral"
      },
      "executionSteps": [
        "Unrack a bar into both elbow crooks and stand in a stable stance.",
        "Keep the load and trunk position steady; start the timer once positioned.",
        "Stop the timer when the hold ends and rerack. Walking belongs to Zercher Carry."
      ],
      "logging": {
        "measure": "seconds",
        "loadBasis": "total_bar_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": true,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "bar_type"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "bar_type"
        ]
      },
      "muscleRoles": [
        {
          "target": "abs",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "lowerBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "upperBack",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "biceps",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "brachialis",
          "relationship": "stabilizer",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "Z1"
      ],
      "catalogAnalogueId": 300,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "machine_neck_flexion",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Machine Neck Flexion",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Machine",
        "movement": "Neck flexion",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "machine neck flexion",
        "neck curl"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "flexion",
        "position": "controlled_individualized_range",
        "headDirection": "flexion",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.",
        "Bring the chin and head forward through a controlled comfortable flexion range without moving the torso.",
        "Return slowly to the start; count one complete out-and-back movement as one repetition."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "effort",
          "setup_note",
          "machine_model",
          "seat_setting",
          "pad_setting"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_setting",
          "pad_setting"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.flexors",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3",
        "N4"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "machine_neck_extension",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Machine Neck Extension",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Machine",
        "movement": "Neck extension",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "machine neck extension",
        "neck extension"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "extension",
        "position": "controlled_individualized_range",
        "headDirection": "extension",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.",
        "Extend the neck against resistance while keeping the torso supported; return under control without swinging.",
        "Return slowly to the start; count one complete out-and-back movement as one repetition."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "effort",
          "setup_note",
          "machine_model",
          "seat_setting",
          "pad_setting"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_setting",
          "pad_setting"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.extensors",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3",
        "N4"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "machine_neck_lateral_flexion",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Machine Neck Lateral Flexion",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Machine",
        "movement": "Neck lateral flexion",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "machine neck lateral flexion",
        "side neck bend"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "lateral_flexion",
        "position": "controlled_individualized_range",
        "headDirection": "per_set_left_or_right",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.",
        "Move the ear toward the shoulder on the selected side without turning the face or leaning the torso.",
        "Return slowly to the start; count one complete out-and-back movement as one repetition."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": true,
        "directionOptions": [
          "left",
          "right"
        ],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Direction is movement intent, not working-arm side.",
        "extraFields": [
          "effort",
          "setup_note",
          "machine_model",
          "seat_setting",
          "pad_setting"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_setting",
          "pad_setting",
          "headDirection"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.lateral_flexors",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "same",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3",
        "N4"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "harness_neck_extension",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Seated Harness Neck Extension",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Free weights",
        "movement": "Neck extension",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "seated harness neck extension",
        "neck extension"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "extension",
        "position": "controlled_individualized_range",
        "headDirection": "extension",
        "requiredAccessory": "purpose_designed_head_harness",
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Sit with a secure head harness and suspended plates; incline the torso forward so gravity opposes neck extension.",
        "Extend the neck against resistance while keeping the torso supported; return under control without swinging.",
        "Record suspended plate mass and torso setup; do not equate it to a neck-machine stack value."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "suspended_external_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "effort",
          "setup_note"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.extensors",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Seated_Head_Harness_Neck_Resistance",
        "candidateImages": [
          "Seated_Head_Harness_Neck_Resistance/0.jpg",
          "Seated_Head_Harness_Neck_Resistance/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "cable_neck_flexion",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Cable Harness Neck Flexion",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Cable",
        "movement": "Neck flexion",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "cable harness neck flexion",
        "neck curl"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "flexion",
        "position": "controlled_individualized_range",
        "headDirection": "flexion",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
        "Bring the chin and head forward through a controlled comfortable flexion range without moving the torso.",
        "Keep the attachment and torso position repeatable; log pulley setting and harness configuration."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "effort",
          "setup_note",
          "attachment_setup"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "attachment_setup"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.flexors",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "cable_neck_extension",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Cable Harness Neck Extension",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Cable",
        "movement": "Neck extension",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "cable harness neck extension",
        "neck extension"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "extension",
        "position": "controlled_individualized_range",
        "headDirection": "extension",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
        "Extend the neck against resistance while keeping the torso supported; return under control without swinging.",
        "Keep the attachment and torso position repeatable; log pulley setting and harness configuration."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "effort",
          "setup_note",
          "attachment_setup"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "attachment_setup"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.extensors",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "cable_neck_lateral_flexion",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Cable Harness Neck Lateral Flexion",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Cable",
        "movement": "Neck lateral flexion",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "cable harness neck lateral flexion",
        "side neck bend"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "lateral_flexion",
        "position": "controlled_individualized_range",
        "headDirection": "per_set_left_or_right",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
        "Move the ear toward the shoulder on the selected side without turning the face or leaning the torso.",
        "Keep the attachment and torso position repeatable; log pulley setting and harness configuration."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": true,
        "directionOptions": [
          "left",
          "right"
        ],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Direction is movement intent, not working-arm side.",
        "extraFields": [
          "effort",
          "setup_note",
          "attachment_setup"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "attachment_setup",
          "headDirection"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.lateral_flexors",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "same",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "cable_neck_rotation",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Cable Harness Neck Rotation",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Cable",
        "movement": "Neck rotation",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "cable harness neck rotation",
        "neck rotation"
      ],
      "distinction": "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
      "setup": {
        "action": "rotation",
        "position": "controlled_individualized_range",
        "headDirection": "per_set_left_or_right",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
        "Turn the face toward the selected side against the opposing resistance; keep the torso still.",
        "Keep the attachment and torso position repeatable; log pulley setting and harness configuration."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": true,
        "directionOptions": [
          "left",
          "right"
        ],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Direction is movement intent, not working-arm side.",
        "extraFields": [
          "effort",
          "setup_note",
          "attachment_setup"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "attachment_setup",
          "headDirection"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.rotators",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "isometric_neck_flexion",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Isometric Neck Flexion \u2014 Manual Resistance",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Bodyweight",
        "movement": "Neck flexion",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "isometric neck flexion",
        "neck curl",
        "manual neck flexion hold"
      ],
      "distinction": "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
      "setup": {
        "action": "flexion",
        "position": "near_neutral_hold",
        "headDirection": "flexion",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Sit with the head near neutral and the torso supported.",
        "Apply hand resistance at the forehead, opposing an attempt to flex forward; hold without actual head movement.",
        "Build and release tension smoothly while breathing; record the hold time, intended direction and effort."
      ],
      "logging": {
        "measure": "seconds",
        "loadBasis": "manual_unmeasured",
        "loadRequired": false,
        "loadUnit": null,
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": true,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "effort",
          "setup_note"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.flexors",
          "relationship": "direct",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Isometric_Neck_Exercise_-_Front_And_Back",
        "candidateImages": [
          "Isometric_Neck_Exercise_-_Front_And_Back/0.jpg",
          "Isometric_Neck_Exercise_-_Front_And_Back/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "isometric_neck_extension",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Isometric Neck Extension \u2014 Manual Resistance",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Bodyweight",
        "movement": "Neck extension",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "isometric neck extension",
        "neck extension",
        "manual neck extension hold"
      ],
      "distinction": "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
      "setup": {
        "action": "extension",
        "position": "near_neutral_hold",
        "headDirection": "extension",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Sit with the head near neutral and the torso supported.",
        "Apply hand resistance at the back of the skull, opposing an attempt to extend backward; hold without actual head movement.",
        "Build and release tension smoothly while breathing; record the hold time, intended direction and effort."
      ],
      "logging": {
        "measure": "seconds",
        "loadBasis": "manual_unmeasured",
        "loadRequired": false,
        "loadUnit": null,
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": true,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "effort",
          "setup_note"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.extensors",
          "relationship": "direct",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Isometric_Neck_Exercise_-_Front_And_Back",
        "candidateImages": [
          "Isometric_Neck_Exercise_-_Front_And_Back/0.jpg",
          "Isometric_Neck_Exercise_-_Front_And_Back/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "isometric_neck_lateral_flexion",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Isometric Neck Lateral Flexion \u2014 Manual Resistance",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Bodyweight",
        "movement": "Neck lateral flexion",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "isometric neck lateral flexion",
        "side neck bend",
        "manual neck lateral flexion hold"
      ],
      "distinction": "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
      "setup": {
        "action": "lateral_flexion",
        "position": "near_neutral_hold",
        "headDirection": "per_set_left_or_right",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Sit with the head near neutral and the torso supported.",
        "Apply hand resistance at the side of the head, opposing an attempt to bend toward the selected side; hold without actual head movement.",
        "Build and release tension smoothly while breathing; record the hold time, intended direction and effort."
      ],
      "logging": {
        "measure": "seconds",
        "loadBasis": "manual_unmeasured",
        "loadRequired": false,
        "loadUnit": null,
        "directionRequired": true,
        "directionOptions": [
          "left",
          "right"
        ],
        "deliberateHold": true,
        "sidedBy": "none",
        "notes": "Direction is movement intent, not working-arm side.",
        "extraFields": [
          "effort",
          "setup_note"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "headDirection"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.lateral_flexors",
          "relationship": "direct",
          "mode": "isometric",
          "sideRelation": "same",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Isometric_Neck_Exercise_-_Sides",
        "candidateImages": [
          "Isometric_Neck_Exercise_-_Sides/0.jpg",
          "Isometric_Neck_Exercise_-_Sides/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "isometric_neck_rotation",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "neck",
      "catalog": {
        "id": null,
        "name": "Isometric Neck Rotation \u2014 Manual Resistance",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Neck & head control",
        "equipment": "Bodyweight",
        "movement": "Neck rotation",
        "primaryMuscles": [
          "neck"
        ],
        "secondaryMuscles": [],
        "qualities": [
          "strength",
          "endurance"
        ],
        "muscleGrade": "C",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General neck strength capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "isometric neck rotation",
        "neck rotation",
        "manual neck rotation hold"
      ],
      "distinction": "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
      "setup": {
        "action": "rotation",
        "position": "near_neutral_hold",
        "headDirection": "per_set_left_or_right",
        "requiredAccessory": null,
        "recommendationScope": "explicit_neck_selection_only"
      },
      "executionSteps": [
        "Sit with the head near neutral and the torso supported.",
        "Apply hand resistance at the side of the forehead/temple, opposing an attempt to turn the face toward the selected side; hold without actual head movement.",
        "Build and release tension smoothly while breathing; record the hold time, intended direction and effort."
      ],
      "logging": {
        "measure": "seconds",
        "loadBasis": "manual_unmeasured",
        "loadRequired": false,
        "loadUnit": null,
        "directionRequired": true,
        "directionOptions": [
          "left",
          "right"
        ],
        "deliberateHold": true,
        "sidedBy": "none",
        "notes": "Direction is movement intent, not working-arm side.",
        "extraFields": [
          "effort",
          "setup_note"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "headDirection"
        ]
      },
      "muscleRoles": [
        {
          "target": "neck.rotators",
          "relationship": "direct",
          "mode": "isometric",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "N1",
        "N2",
        "N3"
      ],
      "catalogAnalogueId": null,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "plate_loaded_incline_press",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Plate-Loaded Incline Chest Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Machine",
        "movement": "Incline press",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "incline plate loaded chest press",
        "incline lever press"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "incline",
        "armMode": "bilateral_default_independent_if_equipped",
        "rom": "controlled_setup_specific"
      },
      "executionSteps": [
        "Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.",
        "Press the handles away and return under control without bouncing the stop.",
        "For independent arms record each arm\u2019s plate load; for a stack record the displayed setting. Do not assume either equals hand force."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "plates_per_arm",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1",
        "B2",
        "B3",
        "M1"
      ],
      "catalogAnalogueId": 12,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Leverage_Incline_Chest_Press",
        "candidateImages": [
          "Leverage_Incline_Chest_Press/0.jpg",
          "Leverage_Incline_Chest_Press/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "selectorized_decline_press",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Selectorized Decline Chest Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Machine",
        "movement": "Decline press",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "decline stack chest press"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "decline",
        "armMode": "bilateral",
        "rom": "controlled_setup_specific"
      },
      "executionSteps": [
        "Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.",
        "Press the handles away and return under control without bouncing the stop.",
        "For independent arms record each arm\u2019s plate load; for a stack record the displayed setting. Do not assume either equals hand force."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "machine_display",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1"
      ],
      "catalogAnalogueId": 11,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "plate_loaded_decline_press",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Plate-Loaded Decline Chest Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Machine",
        "movement": "Decline press",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "decline lever press"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "decline",
        "armMode": "bilateral_default_independent_if_equipped",
        "rom": "controlled_setup_specific"
      },
      "executionSteps": [
        "Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.",
        "Press the handles away and return under control without bouncing the stop.",
        "For independent arms record each arm\u2019s plate load; for a stack record the displayed setting. Do not assume either equals hand force."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "plates_per_arm",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1",
        "M1"
      ],
      "catalogAnalogueId": 13,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Leverage_Decline_Chest_Press",
        "candidateImages": [
          "Leverage_Decline_Chest_Press/0.jpg",
          "Leverage_Decline_Chest_Press/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "smith_incline_bench",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Smith Machine Incline Bench Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Machine",
        "movement": "Incline press",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "incline smith press"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "incline",
        "armMode": "bilateral",
        "rom": "controlled_setup_specific"
      },
      "executionSteps": [
        "Place the appropriate incline or decline bench under the Smith bar and set the safety stops. Record bench setting and machine.",
        "Lower the bar in a controlled path toward the chest, then press upward while keeping the torso supported.",
        "Use the same load convention each session: plates-only or total including known effective bar resistance. Unknown effective bar resistance remains unknown."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "smith_declared",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1",
        "M1"
      ],
      "catalogAnalogueId": 14,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Smith_Machine_Incline_Bench_Press",
        "candidateImages": [
          "Smith_Machine_Incline_Bench_Press/0.jpg",
          "Smith_Machine_Incline_Bench_Press/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "smith_decline_bench",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Smith Machine Decline Bench Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Machine",
        "movement": "Decline press",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "decline smith press"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "decline",
        "armMode": "bilateral",
        "rom": "controlled_setup_specific"
      },
      "executionSteps": [
        "Place the appropriate incline or decline bench under the Smith bar and set the safety stops. Record bench setting and machine.",
        "Lower the bar in a controlled path toward the chest, then press upward while keeping the torso supported.",
        "Use the same load convention each session: plates-only or total including known effective bar resistance. Unknown effective bar resistance remains unknown."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "smith_declared",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "machine_model",
          "seat_or_bench_setting",
          "load_convention"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1",
        "M1"
      ],
      "catalogAnalogueId": 14,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Smith_Machine_Decline_Press",
        "candidateImages": [
          "Smith_Machine_Decline_Press/0.jpg",
          "Smith_Machine_Decline_Press/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "barbell_floor_press",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Barbell Floor Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Barbell",
        "movement": "Horizontal push",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "floor press barbell"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "floor",
        "armMode": "bilateral",
        "rom": "floor_limited"
      },
      "executionSteps": [
        "Lie on the floor under a racked bar and establish a stable grip and shoulder position.",
        "Lower until the upper arms contact the floor gently, pause without bouncing, then press.",
        "The floor limits shoulder excursion. Keep this history separate from bench-supported pressing."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "total_bar_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "setup_note"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1",
        "M1"
      ],
      "catalogAnalogueId": 7,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "candidate_requires_visual_QA",
        "candidateDatasetId": "Floor_Press",
        "candidateImages": [
          "Floor_Press/0.jpg",
          "Floor_Press/1.jpg"
        ],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "paused_barbell_bench",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Paused Barbell Bench Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Barbell",
        "movement": "Horizontal push",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "pause bench",
        "competition style paused bench"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "flat_paused",
        "armMode": "bilateral",
        "rom": "controlled_setup_specific"
      },
      "executionSteps": [
        "Set up on a flat bench and unrack the bar.",
        "Lower to chest contact and hold a deliberate motionless pause without bouncing.",
        "Press to the finish and record pause duration when known. Pausing does not create a separate logged set."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "total_bar_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "pause_seconds"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "pause_seconds"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1"
      ],
      "catalogAnalogueId": 1,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    },
    {
      "key": "spoto_press",
      "operation": "add_after_live_duplicate_check",
      "catalogId": null,
      "group": "bench",
      "catalog": {
        "id": null,
        "name": "Spoto Press",
        "sourceGroup": "Zercher, neck and bench expansion \u2014 October 2026",
        "category": "Chest & push",
        "equipment": "Barbell",
        "movement": "Horizontal push",
        "primaryMuscles": [
          "chest"
        ],
        "secondaryMuscles": [
          "triceps",
          "frontDelts"
        ],
        "qualities": [
          "strength",
          "hypertrophy"
        ],
        "muscleGrade": "B",
        "sportFit": {
          "tennis": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "basketball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "soccer": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "baseball": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          },
          "combat": {
            "grade": "C",
            "movementHelp": "General resistance-training capacity; sport transfer is indirect and unquantified."
          }
        }
      },
      "aliases": [
        "hover pause bench",
        "spoto bench"
      ],
      "distinction": "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
      "setup": {
        "pressAngle": "flat_hover_pause",
        "armMode": "bilateral",
        "rom": "above_chest_hover"
      },
      "executionSteps": [
        "Set up on a flat bench and unrack the bar.",
        "Lower to a small consistent hover above the chest; pause without touching the chest.",
        "Press to the finish. Record hover distance and pause duration when known."
      ],
      "logging": {
        "measure": "reps",
        "loadBasis": "total_bar_mass",
        "loadRequired": true,
        "loadUnit": "kg_or_lb",
        "directionRequired": false,
        "directionOptions": [],
        "deliberateHold": false,
        "sidedBy": "none",
        "notes": "Preserve recorded load convention.",
        "extraFields": [
          "pause_seconds",
          "hover_distance_cm"
        ],
        "comparisonKeyFields": [
          "key",
          "loadBasis",
          "pause_seconds",
          "hover_distance_cm"
        ]
      },
      "muscleRoles": [
        {
          "target": "chest",
          "relationship": "direct",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "triceps",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        },
        {
          "target": "frontDelts",
          "relationship": "contributing",
          "mode": "dynamic",
          "sideRelation": "both",
          "basis": "inference"
        }
      ],
      "mappingBasis": "anatomical_inference",
      "mappingReviewStatus": "draft_pending_repository_review",
      "sources": [
        "B1"
      ],
      "catalogAnalogueId": 1,
      "analysis": {
        "activationPercentages": null,
        "perMuscleVolumeMultipliers": null,
        "tendonInjuryProbability": null,
        "machineResistanceCurve": null,
        "normReference": null,
        "percentileEligible": false,
        "estimated1RMEnabled": false,
        "automaticPrescriptionEnabled": false,
        "gradeBasis": "provisional_product_assumption_not_measured_effect",
        "unknownReason": "No exercise-specific quantitative calibration verified in this package."
      },
      "media": {
        "status": "no_verified_exact_asset",
        "candidateDatasetId": null,
        "candidateImages": [],
        "fallback": "intentional_equipment_icon_plus_execution_text",
        "approved": false
      }
    }
  ]
}
```
<!-- EXERCISE_MANIFEST_END -->
