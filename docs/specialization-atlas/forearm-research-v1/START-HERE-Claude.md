# Sports Genome — forearm exercise intelligence, research and implementation

**Version:** forearm-model-0.1.0-research-draft  
**Research date:** 20 October 2026  
**Purpose:** Extend the existing forearm atlas, exercise catalog, logger and weekly review with defensible muscle-level exposure data. Preserve the existing app and the Manus 3D component. This is an additive research/model package, not permission to replace working infrastructure.

## 1. Read this before implementing anything

The owner wants to understand which forearm muscles their training exposes, through which actions, and whether some functions are being neglected. They also want useful tendon-loading context and practical rep guidance. Implement those capabilities without manufacturing biological precision.

This package contains **50 original candidates represented by 57 records and 1,083 exercise–muscle mapping cells**. Splits make flexion/extension machines and rice-bucket drills distinguishable; one record is an alias. Six ambiguous records remain deliberately unmapped. The remaining mappings are research-informed engineering hypotheses, not experimentally measured exercise percentages. Their draft status is intentional: verify protocol and catalog identity before publishing them.

The research does **not** establish that every one of these exercises delivers a known percentage of its stimulus to each of 19 muscles. It also does not establish a numeric tendonitis risk calculator from set count. Neither a surface-EMG percentage nor an estimated muscle activation score is a percentage of growth, force, effective sets, or tendon damage.

The usable numeric model is therefore:

1. Independent, coarse targeting grades for each muscle, with contraction and exposure classifications.
2. Actual logged counts, repetitions and time, separated by exposure type and side.
3. Anatomical tissue links and descriptive workload changes, without an injury probability.
4. Configurable rep/hold ranges based on broader training evidence and practical movement constraints, with explicit uncertainty.

**Never relabel the 0–100 targeting index as “percent activation,” “percent of growth,” or “percent tendon strain.”** A score of 100 means a clearly intended target in the reference protocol, not maximal activation. Multiple muscles may each score 100. The scores neither sum to 100 nor imply exact proportional contributions.

### Package contents

| File | Use |
|---|---|
| `START-HERE-Claude.md` | Implementation contract, research interpretation and acceptance criteria |
| `Exercise-review-ledger.md` | Per-exercise descriptions, sources, caveats and five review checkboxes per record |
| `exercises.json` | All normalized candidate records and all 19 muscle cells for each |
| `muscles.json` | Stable muscle IDs, functions, qualitative appearance notes and tissue links |
| `exercise-muscle-matrix.csv` | Flat inspection/import format; blank numeric cells mean unknown |
| `rep-profiles.json` | Coaching starting ranges, not individually proven optimal prescriptions |
| `sources.json` | Source URLs, PMIDs, scope and limitations |
| `Research-sources.md` | Human-readable annotated bibliography |
| `model-manifest.json` | Model version and import restrictions |
| `reference_engine.py` | Executable example of distinct-bout aggregation and tissue deduplication |
| `test_model.py` | Data integrity and reference-behavior checks |
| `example-events.json` | Synthetic logging example; not exercise advice or real user history |
| `Coverage-and-verification.md` | Direct-role coverage, unresolved protocols and verification results |

This package does not contain production SQL because the live database schema and current calculator implementation were not inspected. It does inspect and align with the supplied Manus handoff's `MuscleData` and manifest IDs. Reconcile existing app identifiers instead of guessing or creating a second catalog.

**Read order:** this guide → research sources → exercise ledger → JSON/CSV → reference engine/tests. First produce the adapter and a staging import report. Do not immediately execute an unreviewed seed against production.

## 2. Research conclusions that must shape the product

### 2.1 Muscles are not a pie chart

University anatomy sources establish actions and attachments [A01, A02]. Small laboratory studies show how posture, grip and movement can change recruitment [S02–S08]. Those studies do not supply a universal matrix of exercise-to-muscle percentages.

Wrist flexion commonly involves FCR and FCU; wrist extension involves ECRL, ECRB and ECU. Radial deviation combines a flexor and extensors; ulnar deviation combines FCU and ECU. This is why “flexors versus extensors” alone is insufficient. Pronation and supination must be separate functions, with biceps included as an outside contributor to supination. BR primarily flexes the elbow; it does not cross the wrist and must not receive direct wrist-extension volume merely because it sits near extensors.

Finger and thumb work needs further distinctions. FDS and FDP do not perform identical joint actions. FPL is a thumb flexor, not a substitute label for every muscle involved in pinch. Intrinsic hand muscles contribute substantially to pinch, opposition and finger support but are outside this 19-muscle atlas. Never force their contribution into the forearm scores.

In [S02], forearm rotation affected recorded wrist muscle activity under controlled isometric torque. Use this as support for recording grip orientation; it is not a measured ratio for every wrist-curl variant. In [S05], gripping recruited wrist stabilizers as well as flexors. Accordingly, a carry can produce finger-flexor isometric exposure and wrist-stabilizer exposure without producing wrist-extension repetitions.

Thick grips are not automatically a fixed multiplier. [S07] found exercise-dependent effects and reduced load/repetition performance. Applying “+30% forearm volume” to all Fat Gripz entries would be invented. Likewise, towel friction, hand size, handle diameter and straps change execution but do not supply a known conversion factor.

### 2.2 Growth responds to training, but no evidence supports unlimited volume

[S09, S10, S18] support hypertrophy across a range of loads under the studied conditions, with heavier loading generally better suited to maximal dynamic strength. They do not identify a separate optimal rep range for every small forearm muscle. [S12] supports a dose–response with diminishing returns and distinguishes direct from indirect work. It does not establish that every forearm muscle needs over 15 direct weekly sets or that more always produces more growth for an individual.

[S13] suggests proximity to failure matters for hypertrophy, but its exact quantitative relationship remains uncertain. Store reported RIR; do not turn it into an exact “effective reps” multiplier. “Unknown RIR” is not failure and not zero effort.

The practical rep ranges in this package are **implementation defaults**, not research-derived optima for each muscle. A muscle can participate in several actions, and prescription follows the exercise/task. For example, FCR involvement in a carry uses a time-based stabilization record; its wrist-flexion rep profile does not convert the carry into wrist-curl sets.

### 2.3 Tendon load is not the same as injury

Tendon loading can produce adaptation [S15]. Logged weight is not tendon force, and tendon force is not tendon strain. Strain would require information about tissue deformation; injury prediction would additionally require validation against outcomes in a relevant population.

[S16, S17] identify occupational associations involving force, repetition and posture. Occupational hazard ratios do not estimate a lifter's probability of tendonitis from gym sets. [S19] illustrates movement-dependent tendon forces in a cadaver simulator; it also cannot calibrate a gym injury model.

Implement **Tendon exposure**, with distinct bouts, known hold time, training days, exposure categories, recent workload changes and optional symptoms. Do not publish “72% tendonitis risk,” a “safe tendon budget,” or universal maximum sets for a tissue. No such validated model was found in this research.

### 2.4 What was researched and what remains uncertain

The source register contains 18 unique PubMed publications plus two university anatomy tables. Publication evidence was evaluated from retrieved abstracts and metadata; anatomy was read from page/PDF text. This is a targeted evidence synthesis, not an exhaustive systematic review or a clinical validation study. The per-exercise ledger explicitly uses anatomical analogies where exercise-specific trials were not found. It does not claim that all 50 exercises have been independently tested in all 19 muscles.

Do not treat anatomy-based hypotheses as measured values simply because they are stored as JSON. Every score in this release has low quantitative confidence. A role can be anatomically plausible while its exact numeric importance remains uncertain.

## 3. Exact numeric semantics

### 3.1 Targeting grade

| Grade | Display index | Meaning |
|---:|---:|---|
| null | null | Unmodeled or protocol unknown; never display as zero activation |
| 0 | 0 | Reserved for an explicitly reviewed exclusion from intended exposure; unused in this seed |
| 1 | 25 | Possible/minor role; needs context |
| 2 | 50 | Secondary role, grip or stabilization in the reference setup |
| 3 | 75 | Substantial contributing role without being the principal isolation target |
| 4 | 100 | Clear intended target of the relevant action or deliberate hold |

These categories are an editorial rubric. A grade of 4 is not twice the biological stimulus of grade 2. The independent index is supplied because a chart needs a consistent ordering and color input; default user-facing labels should be “Target,” “Contributor,” and “Stabilizer,” with the detailed number behind an explanation if shown at all.

`plausible_grade_band` is a simple ±1-grade sensitivity band, clipped to 1–4 for mapped entries. It is **not** a confidence interval, a probability distribution or an estimate from measured dispersion. Do not show it with statistical error bars.

`measured_activation_percent`, `tissue_force_newtons` and `validated_tendon_risk_percent` are null. They must remain null unless future appropriate evidence and a reviewed measurement/model can actually populate them.

### 3.2 Exposure buckets

| Bucket | Count | Do not infer |
|---|---|---|
| `direct_dynamic` | Distinct working parent bouts where this muscle is an intended dynamic target | Exact stimulus or isolated recruitment |
| `supporting_dynamic` | Distinct parent bouts with modeled dynamic contribution | Equivalent direct sets |
| `deliberate_isometric` | Distinct intentional hold bouts; actual seconds if recorded | Repetitions or equal hypertrophy to dynamic sets |
| `supporting_isometric` | Stabilization bouts/time when actually recorded | Direct dynamic volume |
| `incidental_grip` | Grip exposure during another primary task | Dedicated grip-training dose |
| `unmodeled` | Mark unknown coverage | Zero activation or no tendon loading |

An exercise can be dynamic overall while a forearm muscle acts isometrically. Presses, RDLs and carries make this distinction necessary. “Isotonic” is a common gym term for dynamic work, but external and internal tension are not constant across these movements. Store `dynamic_concentric_eccentric`, with phase overrides when known; display “Dynamic” and explain lifting/lowering. Do not label every machine isokinetic.

Contraction classifications describe the intended joint task. They are not measurements of individual fascicle behavior: compliant tendons and multi-joint muscles mean “joint held still” does not guarantee perfectly constant muscle-fiber length.

The same bout can appear in several muscles because muscles cooperate. Never add all muscle set counts to get total workout sets. A drop-set parent may contain multiple segments, but remains one extended bout for distinct-set reporting. Retain the segments, reps, loads and time so the additional work remains visible.

### 3.3 Tissue exposure grade

`tissue_exposure_grade_0_4` inherits the muscle-role grade solely as a **nominal involvement flag** for that musculotendinous unit. It is not a stress magnitude, tendon susceptibility or strain scale. Avoid presenting it as a medical score. Regional tissue groups use the maximum mapped grade per parent bout, not the sum across muscles.

There is no scientifically defensible universal per-muscle “damage factor” here. Set `tendon_injury_susceptibility_score` to null. A grade-4 wrist curl is not inherently more dangerous than a grade-2 stabilization task performed with a much heavier load, longer duration, unfamiliar grip or symptoms.

## 4. Exercise normalization and coverage

- [ ] Resolve all existing catalog IDs through a mapping table; preserve historical IDs.
- [ ] Treat `fa-*` IDs as external seed IDs, not automatic replacements for production IDs.
- [ ] Preserve original candidate numbers for traceability.
- [ ] Alias candidate 22 to 12 under the stated setup; do not create duplicated exercises or dose.
- [ ] Split candidate 32 into wrist flexion and wrist extension machine configurations.
- [ ] Split candidate 37 into kettlebell wrist flexion and extension.
- [ ] Split candidate 50 into individually logged rice-bucket actions; a mixed routine is a container, not six automatically credited sets.
- [ ] Resolve 7, 10, 13, 27, 39 and 40 before assigning scores. Also treat any future ambiguous protocol as blocked rather than guessing.
- [ ] Correct candidate 17: pronation moves toward palm-down. Supination moves toward palm-up.
- [ ] Require an offset lever/resistance vector for dumbbell rotation. A balanced centered dumbbell is not automatically meaningful pronation resistance.
- [ ] For deviation, confirm gravity/cable direction actually opposes radial or ulnar deviation.
- [ ] For candidate 23, treat a rope variant separately if its actual action differs from the straight-bar reference.
- [ ] For candidate 16, retain phase information; do not credit full pronator and supinator dynamic sets merely because the hand rotates between curl phases.
- [ ] For candidate 48, distinguish repeated squeezing from a sustained squeeze.
- [ ] For fingertip support, retain hand/finger tissue context and do not divide body mass equally among fingers.
- [ ] For grip-target holds, mark them as deliberate; for ordinary compound lifts, use incidental grip unless a separate hold is actually programmed and logged.
- [ ] Record machine identity, grip attachment, straps, assistance, unilateral/bilateral execution and load convention where relevant.
- [ ] Complete every checkbox in `Exercise-review-ledger.md` or leave a specific documented blocker.

The normalized count includes unresolved entries and the alias so all original requests remain accounted for. Do not delete them to make the import look complete.

### 4.1 Genuine coverage gaps

The original list is rich in grip and wrist/elbow work. It does not clearly prescribe resisted thumb abduction and thumb extension as distinct exercises. APL, EPB and EPL therefore have no confidently defined direct dynamic drill in this seed. ED has rice-bucket opening; EI/EDM are contributing in that grouped action, not independently isolated. Do not paint those muscles as fully trained merely because the user grips many implements.

Potential catalog additions for a later reviewed release are resisted thumb CMC abduction, resisted thumb MCP extension, resisted thumb IP extension, and deliberately defined individual finger-extension drills. These are candidates for protocol and evidence review, not automatically imported prescriptions. They must acknowledge intrinsic hand muscles and imperfect isolation. The package includes no invented muscle-specific growth percentages for them.

PL may be absent anatomically. Allow “not present/not applicable” without a deficit warning. The 3D model's anconeus is outside the 19-muscle forearm calculation scope: keep it selectable with an explanatory unknown state rather than assigning fabricated data or hiding the mesh.

## 5. Rep, effort and progression logic

### 5.1 Practical starting defaults

| Task family | Hypertrophy practice | Strength practice | Evidence interpretation |
|---|---|---|---|
| Controlled wrist flexion/extension/deviation | 10–25 reps | 6–12 reps | Practical defaults; no proven optimum for FCR versus FCU etc. |
| Controlled pronation/supination | 10–20 reps | 6–12 reps | Depends on torque, elbow angle and lever; no individual-muscle optimum |
| Elbow curls involving BR | 6–20 reps | 3–6 reps | Broad heavy-load strength principle; not proof of BR-specific superiority |
| Controlled finger closing/opening | 10–25 reps | 5–10 reps | Resistance/device and joint action matter; not all drills support measurable strength loading |
| Defined thumb isolation, if added | 12–25 reps | No automatic default | Small-load implement practicality; not a clinical prescription |
| Deliberate isometric grip | 10–30 seconds | 3–10 seconds | Operational ranges; not validated optimal durations or equivalent sets |
| Plate flips/mixed ballistic drills | No automatic range | No automatic range | Skill, setup and exposure require separate definition |

Use the appropriate family based on actual execution. The ranges are optional suggestions, not pass/fail bands. A 30-rep wrist-curl set is not automatically worthless; a 5-rep set is not automatically unsafe. RIR 1–3 is a configurable coaching default for controlled dynamic work, not a measured hypertrophy threshold. Do not enforce failure or progressively heavier loading through symptoms.

For a static hold, “strength practice” means producing/maintaining a high task-specific force under controlled conditions; seconds alone do not establish that force. A gripper's printed resistance is device-specific. Rice-bucket reps do not produce a valid percentage of 1RM. Where load is not calibrated, retain reps/time and subjective effort without fabricating load data.

- [ ] Do not assign different rep optima from guessed fiber-type percentages.
- [ ] Do not equate anatomical function with proven training response.
- [ ] Keep per-muscle `validated_muscle_specific_rep_optimum` null.
- [ ] Keep weekly targets unset unless the user or a reviewed program supplies them.
- [ ] Avoid a universal 15+ sets per muscle target or automatic 19-muscle volume escalation.
- [ ] Use gradual user-directed progression based on repeatable performance and tolerability, not compulsory weekly increases.
- [ ] Keep planned and completed work separate.
- [ ] Store actual ROM/technique qualifiers when available; do not invent ROM from exercise name.
- [ ] Store effort independently of targeting scores.
- [ ] Show strong load/rep improvements only for comparable exercises, equipment, assistance and technique.
- [ ] Do not compare machine stacks, gripper ratings, cable stacks and free-weight kg as equivalent forces.
- [ ] Preserve historical values when the default recommendation changes.
- [ ] Never let these heuristics alter existing strength percentiles or world-class rankings.

### 5.2 Why there is no growth calculator

Do not calculate `sets × targeting_percent × RIR_bonus = predicted_growth`. Every factor would imply calibration this evidence lacks. If the existing app offers fractional sets, show it separately as an explicitly experimental visualization. [S12]'s aggregate direct/indirect result does not validate multiplying every one of these ordinal scores by sets. The default atlas should show raw exposure categories and optional personal targets, not a combined “effective muscle dose.”

## 6. Tendon exposure feature

### 6.1 Data to collect

At minimum, retain session ID, source event/segment ID, parent bout ID, exercise/variant ID, side, timestamp, completed/planned state, warm-up/work flag, repetitions, actual hold seconds, optional total work duration, load and unit, load convention, RIR/RPE when supplied, assistance/straps, equipment ID and model version. Do not require every optional field to log a set. Show the resulting uncertainty.

For a properly defined simple lever, external moment may be estimated as mass × gravitational acceleration × perpendicular lever distance. That is an **external joint moment**, not internal tendon force or strain; real implements may need more complete mechanics. Do not calculate or display it unless geometry and load conventions are known. Never infer tendon force by multiplying kilograms by the targeting index.

Optional symptoms should be private, user-entered and time-stamped: location, side, discomfort rating 0–10, whether it occurred during/after/next morning, and an optional note. These ratings record subjective symptoms, not a diagnosis. A numeric zero is valid only if the user reports no symptoms; missing is not zero.

Tissue units in `muscles.json` are broad musculotendinous structures. Regional labels group related exposures for navigation; they do not represent uniform sharing of force. FDS/FDP aggregate multiple digital tendons, so a finger-specific view must not pretend these rows distinguish each digit. The medial flexor group does not mean FDP and FPL share the common flexor origin. ECRL must not be assigned to the common extensor origin simply because ECRB is. Ligaments, joint contact and finger pulleys are not measured by this model.

### 6.2 Calculation and display

For each side and selected date interval:

1. Select completed records, or planned records in an explicitly separate mode.
2. Deduplicate by stable source segment ID. Reject conflicting duplicates; do not silently choose one.
3. Resolve exercise alias and the exact approved protocol/version.
4. Build a per-muscle ledger of distinct parent bouts by exposure bucket.
5. Retain known hold seconds as time; never estimate them from reps.
6. Link each modeled muscle exposure to its tissue unit and regional group.
7. Count each parent bout once per tissue region regardless of how many contributing muscles share that region.
8. Preserve warm-up exposure for tendon context, with a distinct warm-up count rather than pretending it has zero tissue exposure.
9. Report incomplete coverage, unknown duration and unresolved exercises alongside totals.

Suggested chart: seven-day columns with separate counts for dynamic target bouts, hold bouts and other exposures; a separate seconds line/summary for recorded holds. Do not stack seconds on top of set counts. Selecting a day reveals the actual exercises and sessions.

For recent change, compare the latest complete seven-day window to the median of preceding complete seven-day windows using the **same measure, side, mapping version and filter**. Require at least three prior complete windows. “Complete” means training data completeness is known, not merely an absence of entries. Without adequate history, show “Building your baseline.” If the baseline is zero, show “New exposure”; do not divide by zero. For small positive denominators, emphasize absolute change rather than dramatic percentages.

Example: `8 modeled target bouts this week; previous weekly median 5; +3 bouts`. Optionally show `+60%` with the base numbers. This is a change description, not an injury-risk prediction. Do not use an acute:chronic ratio to label a universal safe/unsafe zone. Do not select an arbitrary 10%, 30% or 50% threshold and call it scientifically validated.

- [ ] Title the section “Tendon exposure,” not “Tendonitis predictor.”
- [ ] Explain that mapped exposure is incomplete and does not measure tissue strain.
- [ ] Separate medial elbow, lateral elbow, wrist/thumb and digital exposure views where anatomy supports it.
- [ ] Deduplicate shared-region bouts and avoid summed muscle-grade heatmaps implying force.
- [ ] Keep actual symptoms separate from inferred exposure.
- [ ] Display “Not enough information” when tracking is incomplete.
- [ ] Let users inspect the source workouts behind a workload change.
- [ ] Provide a neutral prompt to review a new or rapidly changed workload without asserting an injury probability.
- [ ] Do not label no symptoms/no logged work as “safe.”
- [ ] Do not encourage users to push through new or worsening pain to meet an exposure target.
- [ ] Allow users to reduce, replace or defer a planned exercise from this screen.
- [ ] Do not make individualized injury-prevention or rehabilitation prescriptions from these fields.

## 7. Application architecture and import contract

### 7.1 First inspect, then adapt

- [ ] Locate current catalog tables, canonical muscle identifiers, logger event types and calculation owners.
- [ ] Find existing direct/supporting/isometric/incident-grip definitions before adding new ones.
- [ ] Read the existing atlas and 3D integration briefs; this package extends them.
- [ ] Produce a short field-by-field adapter map from this JSON to the actual schema.
- [ ] Identify whether historical results are calculated live or cached.
- [ ] Identify current ownership/RLS patterns and migration conventions.
- [ ] Do not duplicate an existing concept under a new table name merely to match this package.
- [ ] Import reference content into staging first; no production enablement of draft mappings by default.

### 7.2 Logical records to support

These are logical entities; reuse existing equivalents. They are not assumptions about current table names.

| Entity | Identity / relationships | Required behavior |
|---|---|---|
| Model release | Version, research date, review state | Immutable released versions; explicit activation |
| Muscle | Existing stable muscle ID | Function, qualitative appearance, applicability |
| Source | Stable source ID, URL/PMID | Provenance and applicability notes |
| Exercise protocol | Existing exercise ID + variant/setup | Canonical alias, approval status, geometry/context requirements |
| Exercise–muscle mapping | Model version + protocol + muscle | Nullable ordinal grade, contraction, bucket, evidence and uncertainty |
| Tissue association | Muscle + tissue unit + regional group | Anatomy linkage, no injury coefficient |
| Bout / segment | Existing session + parent bout + stable segment | Raw reps/time/load; original history retained |
| Exposure projection | User + source IDs + version + side | Recomputable derived results; not the historical source of truth |
| User target | User + muscle/action + mode + period | Optional, editable; not a universal medical limit |
| Symptom entry | User + side + location + timestamp | Private, optional, nullable ratings |

For Supabase, use the project's migration process and verify current documentation before implementation. Public reference content may be read-only to clients; publishing it must require the app's appropriate administrative path. Personal workout and symptom rows must be protected by ownership-based RLS and explicit grants. Do not expose service-role credentials in the browser. An authenticated user is not automatically authorized to read every other user's row. Protect derived views/functions as well as base tables.

- [ ] Add unique constraints for model/protocol/muscle mapping identity.
- [ ] Validate grades as null or integers 0–4; indices must equal grade × 25 if present.
- [ ] Reject missing or unknown muscle IDs rather than mapping them by display-name similarity.
- [ ] Keep alias chains cycle-free and resolve them to a canonical exercise.
- [ ] Preserve nulls through JSON, CSV, SQL and frontend adapters.
- [ ] Add provenance and mapping version to derived output.
- [ ] Make import idempotent and report inserted/updated/skipped/blocked counts.
- [ ] Publish reviewed mappings only; unresolved records can remain searchable with an honest unavailable-analysis state.
- [ ] Verify cross-user isolation using two distinct users, not only an administrator account.
- [ ] Keep optional symptom data out of public analytics and shared workout cards by default.
- [ ] Plan rollback to the previous mapping version without losing raw logs.
- [ ] Recompute historical projections on activation; do not ask users to re-enter old sets.
- [ ] Backfill in resumable batches with stable source IDs and a completion report.
- [ ] Invalidate cached atlas/weekly analysis consistently after edits, deletes, swaps and version changes.

### 7.3 Logging edge cases

**Drop set:** 5 reps at 100 lb, 6 at 70, 10 at 50, same exercise and no meaningful reset, should retain three segments under one extended parent bout. The muscle ledger gets one parent-bout count per relevant bucket. Total reps are 21; known duration is retained; never claim it equals exactly one conventional set physiologically. Show “1 drop-set bout · 3 segments.”

**Swap mid-workout:** completed old-exercise segments retain their original protocol. New exercise segments use the new protocol. Do not retroactively convert earlier sissy squats, curls or holds into the replacement exercise. If the app groups different exercises under a common container, each actually performed exercise needs its own bout identity beneath that container.

**Bilateral work:** one bilateral event gives one exposure bout to each involved side, not two bouts per side. An “all sides” total must clarify whether it counts session bouts or limb exposures. Do not add left and right into a single per-muscle target silently.

**Warm-ups:** exclude from the work-set hypertrophy display by default but retain as separate exposure in the tendon context. **Straps:** do not apply an arbitrary 0.2 grip multiplier; use a reviewed assisted variant or unknown grip contribution. **Missing duration:** show known seconds and missing-duration count; do not infer every hang lasted 30 seconds.

## 8. 3D atlas integration and visual clarity

The supplied Manus `MuscleData` interface already has `directDynamicSets`, `supportingExerciseExposure`, `deliberateIsometricBouts`, `isometricHoldSeconds`, `incidentalGripExposure`, `targetSets`, `exercises`, `dataStatus` and `dataNote`. Keep rendering separate from calculation.

| Existing field | Mapping |
|---|---|
| `directDynamicSets` | Distinct completed working parent bouts in `direct_dynamic`; label drop bouts honestly |
| `supportingExerciseExposure` | Distinct union of supporting dynamic and supporting isometric parent bouts; do not add overlapping counts twice |
| `deliberateIsometricBouts` | Distinct deliberate hold parent bouts |
| `isometricHoldSeconds` | Known deliberate hold seconds only; disclose missing duration |
| `incidentalGripExposure` | Distinct incidental-grip parent bouts |
| `targetSets` | User/program-supplied optional target, omitted if none |
| `exercises` | Actual source exercises contributing to selected side/window/mode |
| `dataStatus` | `complete`, `partial`, `uncertain`, `missing` based on coverage and evidence |
| `dataNote` | Short explanation of modeled estimates, missing contexts and unknowns |

Extend the adapter if necessary to retain supporting dynamic/isometric separately. Do not flatten them into a single biological-dose number. Existing numeric-only fields may require zero as a renderer compatibility value for unavailable data; if so, guard the view using `dataStatus` so that zero is **never shown as a measured zero**. Prefer nullable display-model fields where feasible.

Suggested muscle detail hierarchy:

1. Name and selected side; animation reveals the anatomical structure.
2. One sentence of function: “Bends the wrist toward the palm and thumb side.”
3. Four compact values: direct dynamic bouts, contributing bouts, deliberate hold seconds, incidental grip bouts.
4. A small timeline and the exercises that produced the values.
5. A collapsible “How this is estimated” with evidence and uncertainty.
6. Optional “Tendon exposure” and personal target controls.

Use plain-language action labels alongside anatomical names. Keep muscle-targeting color separate from weekly exposure color and from strength rank. Provide a legend and selected-metric label. Unknown muscles need a distinct neutral/hatched state rather than an empty red warning. Do not use green to imply safety or an orange region to imply injury. APL/EPB/EPL coverage gaps should read “No mapped direct exercise in this selection,” not “untrained” or “deficient.”

- [ ] Match all 19 IDs to the actual manifest and preserve mesh names.
- [ ] Keep anconeus explicitly outside this calculation scope.
- [ ] Show planned/completed mode and date range in the same visible context.
- [ ] Switch metrics without changing the selected muscle unexpectedly.
- [ ] Restore selection and scroll position when returning from an exercise.
- [ ] Keep the animation interruptible and support reduced motion.
- [ ] Keep tap targets usable with one hand on an iPhone.
- [ ] Provide a list/table alternative to the 3D model.
- [ ] Never embed dynamic user facts into a fixed video or texture; bind them from the live adapter.
- [ ] Do not render demo statistics as real history during loading or errors.
- [ ] Show three or four useful measures initially, not 19 simultaneous technical panels.
- [ ] Drill-down must reveal the exact counted bouts and exclusions.
- [ ] “Find exercises” must retain selected movement/muscle context and indicate it clearly.
- [ ] Label evidence-based actions separately from the heuristic numerical grades.

## 9. Calculation examples Claude must reproduce

### Example A: two wrist curls plus a carry

Two right-side completed dumbbell wrist-curl parent bouts and one right-side 20-second farmer hold:

- FCR: two direct dynamic bouts; one supporting isometric bout.
- FCU: same under the reference protocols.
- FDS/FDP: two supporting dynamic bouts plus one deliberate isometric bout and 20 known hold seconds.
- BR: unmodeled for these actions, not credited elbow-flexion sets.
- FPL: incidental grip from the wrist curls plus supporting isometric exposure in the carry.

The grip/stabilizer roles are hypotheses; do not infer percentages of muscle growth from this result. Regional tissue counts deduplicate shared musculotendinous contributors per bout. The carry is not five separate medial-elbow bouts just because several linked muscles are involved.

### Example B: one drop-set bout

Three wrist-curl segments with one parent ID yield one FCR direct dynamic bout and 21 recorded reps. They do not yield three conventional sets. Duplicate delivery of the same segment must not change anything. Editing a segment must update the existing event, not leave both versions in the completed stream.

### Example C: unknown protocol

Logging “barbell wrist roll” without identifying the action records a real workout event but produces unavailable muscle allocation. Weekly review displays one unresolved bout. It does not silently classify the event as abdominal rollout, wrist extension or finger flexion.

### Example D: apparent coverage

A week of curls, carries and wrist curls must not give automatic direct thumb-extension volume to EPL/EPB or direct thumb-abduction volume to APL. Incidental gripping does not establish those actions. Show a coverage gap with an optional exploration link, not a required exercise or injury warning.

## 10. Verification and release gates

- [ ] Run `python3 -m unittest -v test_model.py` from this package directory.
- [ ] Port the meaningful behavioral cases to the app's real calculator and tests.
- [ ] Retain whole-exercise prescriptions for rows, pull-ups, presses, RDLs and mixed movements; forearm guidance must not overwrite their primary programming.
- [ ] Validate all 50 original candidates remain traceable after normalization.
- [ ] Verify all 57 records contain all 19 mapping cells, including unknowns.
- [ ] Verify alias resolution and blocked-protocol behavior.
- [ ] Confirm the UI never renders an unknown as a measured zero.
- [ ] Test reps, seconds and loads independently; none may be silently substituted for another.
- [ ] Test left-only, right-only and bilateral logging.
- [ ] Test drop sets, duplicate segment delivery and edited/deleted logs.
- [ ] Test straps/assistance uncertainty.
- [ ] Test shared tendon-region deduplication.
- [ ] Test warm-up versus working exposure.
- [ ] Test old-history recomputation and cache invalidation.
- [ ] Test baseline-zero, sparse history and incomplete-week displays.
- [ ] Verify low-confidence scores remain labeled as estimates after import/export.
- [ ] Verify no ranking/percentile behavior changes as an accidental side effect.
- [ ] Check reduced-motion mode, keyboard/list access and small-screen layouts.
- [ ] Verify symptom-row access isolation and share-card exclusions.
- [ ] Have anatomy/content reviewers resolve the six blocked candidates and review numerical assumptions before broad release.
- [ ] Provide the final approved/draft/blocked matrix, tests run, screenshots, migration/backfill status and remaining limitations.

Do not claim this feature is scientifically validated because tests pass. Tests validate implementation consistency; biological validation requires appropriate independent evidence and outcome evaluation. Ship the reviewed descriptive exposure feature first. A future validated risk or individualized growth model would be a separate research project with a defined population, calibration data, uncertainty and external validation.

## 11. What Claude must deliver back

1. A completed audit and adapter map, with actual repository paths and owners.
2. An idempotent reviewed-data import and reversible model activation process.
3. An exposure calculation path used consistently by the atlas, exercise details and weekly review.
4. Accurate historical recomputation without requiring re-entry of workouts.
5. A clear, responsive UI with explicit data limitations and drill-down provenance.
6. A completion checklist with evidence for each implemented item, plus specific blockers for unresolved protocols.

Continue independently on everything the repository and supplied protocols make clear. Do not use ambiguous entries as a reason to abandon the resolved work. Do not substitute invented activation percentages or tendon-risk scores to make a checklist appear complete.
