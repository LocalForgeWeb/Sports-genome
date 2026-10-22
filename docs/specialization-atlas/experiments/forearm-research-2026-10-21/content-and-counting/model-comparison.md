# Shipped forearm model vs the research package (docs/specialization-atlas/forearm-research-v1/)

Paths: `exposure.ts`, `rules.ts`, `types.ts` are under shared/specialization/; `mappings.ts`, `nodes.ts`, `nodeActions.ts`, `unmapped.ts` under shared/specialization/regions/forearm/; package files are named as in the package (`ref` = reference_engine.py).

## A. Concepts both have, and how they differ

| Concept | Shipped (file:line) | Package (file:line / field) | Verdict |
|---|---|---|---|
| Muscle ids | `forearm.<abbr>` (regions/forearm/ids.ts:13-33) | kebab-case ids = the 3D mesh ids (muscles.json `id`) | Map by a table, never by name (package §7.2 "reject ... display-name similarity"); 02-design.md:207-208 already plans mesh-id aliases. Table: scratchpad/forearm-v2/scripts/compare.ts `node` map |
| Role of a muscle in an exercise | categorical `relationship` + `muscleMode` + `actionId` per mapping (types.ts:342-343, 360-375) | ordinal 0-4 grade + 0-100 index + ±1 band per cell (exercises.json `targeting_grade_0_4`, `plausible_grade_band`) | Keep ours. Grades are editorial, low confidence (START-HERE §3.1); 02-design.md:66 "Fractional accounting is not offered in v1". The package's own default labels Target/Contributor/Stabilizer are our relationships |
| Joint action of the credit | every mapping names one node action resting on a reviewed function claim (mappings.ts:83-97; nodeActions.ts:23-26; database rule 7, 04-database.md:90) | none per cell; one `profile_id` per exercise | Package lacks it. Example: ED in a reverse wrist curl is credited for wrist extension, not finger extension (mappings.ts:186) |
| Buckets / categories | 6 categories, one per node per bout, `mixed` when two (rules.ts:23-31, 50-62; exposure.ts:327-331) | 5 buckets + `unmodeled` (START-HERE §3.2) | Mapping: direct_dynamic = direct_dynamic; supporting_dynamic = contributing_dynamic; deliberate_isometric = deliberate_isometric; supporting_isometric and incidental_grip both = incidental_isometric. Ours keeps stabilizer vs incidental in `parts[].relationship` (exposure.ts:317-325) but counts them as one number (types.ts:770) |
| Shared work | `allocation: "shared"` (types.ts:371; exposure.ts:366-383): FDS+FDP, PT+PQ, deviators | none: FDS and FDP each graded 4 independently | Package lacks it |
| Drop sets | one bout, stages as segments (rules.ts:16; types.ts:643-644; bouts.ts:143), shown "Drop n:" per segment (MuscleSheet.tsx:161) | one parent bout, segments (START-HERE §7.3; ref:37-45) | Same semantics |
| Duplicate records | first record per bout id wins (exposure.ts:518-528) | a conflicting duplicate is an error (ref:61-63) | The device store keeps one record per set id, so a conflict can only come from an import; low priority |
| Sides | bilateral once per arm; unknown kept apart, never on either arm (rules.ts:32; exposure.ts:104-129, 496-503) | unknown side raises an error (ref:53-54) | Ours is the stricter honest behaviour; keep |
| Straps | only mappings with `requiresNoStraps` are withheld on a strapped set; unknown straps keep credit with a note (exposure.ts:302-306, 439-446) | `grip_assisted` makes the whole limb bout unresolved (ref:91-93) | Ours is more precise and matches the package's own words "use a reviewed assisted variant or unknown grip contribution" (START-HERE §7.3) |
| Planned vs completed | two modes, never mixed (exposure.ts:530-533) | `mode` (ref:37-40) | Same |
| Unknown protocol | listed unmapped exercise with a reason, counted region-only (unmapped.ts:13-38; exposure.ts:610-628) or a draft mapping shown pending (exposure.ts:298-301, 648-653) | `blocked_protocol` → unresolved bout (ref:91-93) | Same intent |
| Model version on output | `mappingVersion` and `ruleVersion` on every summary (exposure.ts:685-686) | `model_version` per record | Same |
| Holds | seconds summed per segment, never sets (rules.ts:34; exposure.ts:480-483) | known seconds kept, never estimated (START-HERE §6.2 step 5) | Same; see C for the missing-duration count |

## B. What the shipped model has that the package lacks

- Reviewed anatomy with sources and locators per claim and per mapping (claims.ts; mappings.ts:29-67; 03-anatomy-evidence.md §1); the package's mappings rest on A01/A02 plus analog studies and every record is `draft_mapping` (exercises.json `publication_status`), so under its own engine none runs in production mode (ref:94-95).
- External members credited by their home region (biceps, brachialis: members.ts:10-17; exposure.ts:223-232).
- Side relation per mapping (types.ts:358) and per-mapping side reading (exposure.ts:84-129).
- Region total of distinct bouts and region-only bucket for tagged unmapped work (rules.ts:35-36; exposure.ts:612-631, 666-671).
- Coverage per node, hatched when no reviewed mapping (exposure.ts:239-243; 02-design.md:62).
- Goals per muscle or movement with three metrics and their own periods, no default target (types.ts:653-678; exposure.ts:744-775; 02-design.md:76).
- The 53 biceps/brachialis rows and three thumb drills the package lacks: 412 FPL, 413 EPL+EPB, 414 APL (mappings.ts:293-296).
- Directed wrist rollers 415/416 (mappings.ts:212-226), Zercher carry 300 with no grip (mappings.ts:309-311).
- Catalog-tagged rows deliberately unmapped with reasons (unmapped.ts:13-38).
- Measurements (circumference, grip force) per arm (region.ts:27-31).
- Database freeze and publication rule (04-database.md §4).

## C. What the package has that the shipped model lacks

| Package concept | Where | Shipped equivalent today | What adopting it would take |
|---|---|---|---|
| Tissue units and regional groups (medial flexor origin, lateral extensor origin, radial wrist extensors, deep digital flexors, thumb abductor/extensor region, ...) with one count per parent bout per region | muscles.json `tissue_units`, `regional_groups`; ref:104-107, 126-131 | none. Nearest: compartments as group nodes that take no credit (nodes.ts:36-55, caveats :44, :54) and the node's `border`/`layer`; region total is distinct bouts over all muscles (exposure.ts:666-671) | Attachment statements are anatomy claims; the claim kinds are fixed by schema v1 (`claims.kind in ('function','appearance','selectivity','variation')`, supabase/migrations/20261016120000_specialization_atlas_schema.sql:156), so a reviewed attachment claim needs a schema change or must live in node descriptions (editable, 04-database.md:72). A per-group bout count is a new counting clause, so a new rule version (rules.ts:5-9) or a view explicitly outside the rule |
| Warm-ups kept for tendon context | ref:71, 107-110, 128-131; START-HERE §6.2 step 8 | warm-ups excluded and only counted in `completeness.boutsExcluded.warmup` (rules.ts:17-21; exposure.ts:598, 616; 02-design.md:32) | Not a conflict with 02-design if shown apart from the totals; still a new clause (the v1 text excludes warm-ups) |
| Count of holds with no recorded seconds | ref:111-114, 124 (`segments_missing_hold_duration`) | `sum()` reads null as 0 (exposure.ts:333) and the sheet says "time not recorded" only when the bout's seconds are 0 (components/specialization/model.ts:81-84); no count on the node | Add a count to `NodeExposure` (types.ts:764-799); no rule conflict |
| Workload change vs median of at least 3 prior complete weeks; "Building your baseline"; "New exposure" | ref:139-157; START-HERE §6.2 | none in the atlas (progressSeries.ts plots performance, not exposure change) | New derived view; the package's completeness definition ("training data completeness is known") has no source in the app today |
| Symptom entries (private, dated, 0-10) | START-HERE §6.1 | none for the forearm. Nearest existing concept: the capacity-target constraint answer ("symptomatic", "Bothering me now", areaQuestion.ts:91) with target `forearm` (capacityTargets.ts:78) | Reconcile with the capacity target instead of a second concept (package §7.1 "do not duplicate an existing concept") |
| Rep profiles per task family (wrist 10-25, rotation 10-20, elbow 6-20, finger 10-25, thumb 12-25, grip hold 10-30 s) | rep-profiles.json; exercises.json `prescription_profile_id` | prescriptions come from the training goal and the exercise's position only (workoutPlanner.ts:59-64), holds default to 30 s (`holdDefaultTarget`, workoutPlanner.ts:79; 06-calculation.md §6) | Keyed by exercise family, not by muscle (package §2.2); a planner change, not an atlas count |
| Deliberate vs incidental grip as two buckets | START-HERE §3.2 | one category `incidental_isometric` for stabilizer and incidental (rules.ts:60-61) with the relationship kept in parts | Display split is possible from parts; counting change would be a new rule |
| Effort as RIR/RPE numbers | START-HERE §6.1, rep-profiles.json `default_rir_for_controlled_dynamic` | `effort: failure | not_to_failure | null` (types.ts:642; bouts.ts:142) | Logger change |
| Per-event grip orientation, equipment id, machine identity, load convention | exercises.json `required_context` | variant-level orientation and grip (variants/forearm.ts:62-92), load convention per catalog id (shared/loadConventions.ts:28-57) | Thick handle, towel friction, machine identity have no attribute; schema v2's descriptive dimensions have no handle-diameter value (10-multi-region.md §3, :288) |
| Context flags (thick_handle, lever_arm_required, unstable_object, closed_chain, device_specific_resistance, unquantified_resistance, phase_dependent, ballistic) | exercises.json `context_flags` | variant notes and `elbowAngleDeg` only | Descriptive dimensions (variant_attributes) can hold them as new values |
| Alias records (fa-22 → fa-12) and original candidate numbers | exercises.json `canonical_alias_of`, `original_candidate_number` | no alias table; duplicate catalog names are mapped identically (05-mappings.md:271) | Keep as an import mapping table outside the catalog |
| PL "not present" setting without a deficit | START-HERE §4.1 | caveat (nodes.ts:98-101) and rationale (mappings.ts:174); no per-athlete flag | Small page feature |
