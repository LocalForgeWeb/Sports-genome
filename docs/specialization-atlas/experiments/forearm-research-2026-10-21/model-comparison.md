# The shipped forearm model against forearm-research-v1

Repository at 95f4cdf (branch claude/vigilant-galileo-u91fr3, which contains b69212c). Package at
docs/specialization-atlas/forearm-research-v1/ (SHA256SUMS verified; its 16 tests pass when run from
a scratch copy). PKG = that folder. Every app path is from the repository root.

## A. What the app has that the package lacks

| Concept | App (file:line) | Package |
|---|---|---|
| Joint action on every mapping, resting on a node action and a reviewed, sourced function claim | mappings.ts:83-97 (`actionId`), nodeActions.ts:28-84 (38 rows, prime/assist), claims.ts; DB rules 7-9 (04-database.md:83-94) | `physical_function` free text per muscle (PKG/muscles.json:7 etc.); grades per muscle with no action named |
| Relationship and mode kept apart, category derived by one rule | types.ts:342-343; rules.ts:50-62; 02-design.md:38-48 | one `exposure_bucket` per cell (PKG/START-HERE-Claude.md:101-110) |
| `mixed` (one bout loads a node two ways, counted once) | rules.ts:28, 31; exposure.ts:338-342 | none; a muscle has one bucket per record |
| Shared allocation (FDS with FDP, PT with PQ, the deviators) | types.ts:370-371; mappings.ts:102-120, 228-233, 279-280; exposure.ts:385-394 | none; each muscle graded independently, several may each be 4 |
| Review status per mapping (draft never counted) and a frozen published version | mappings.ts:22, 95; exposure.ts:309-312; 04-database.md:62-98 | `publication_status` per record, all `draft_mapping` (PKG/model-manifest.json:4, 18) |
| Sides read per mapping, six rules, unknown kept apart and never added to an arm | exposure.ts:84-129; rules.ts:32; 02-design.md:54-58 | reference engine refuses an unknown side (PKG/reference_engine.py:53-54) |
| Planned one-sided sets per arm, "Each side assumed" | 06-calculation.md:48, §9.2; exposure.ts:454 | planned/completed modes only (PKG/reference_engine.py:39-48) |
| External members credited by their home region (biceps, brachialis) | members.ts:10-17; exposure.ts:198-232; 10-multi-region.md §4.2 | `external_contributors` text only (PKG/exercises.json, e.g. fa-18) |
| Region-only bucket for tagged, unmapped work; listed unmapped rows with reasons | exposure.ts:320-325, 717-734; unmapped.ts:14-37 | `blocked_protocol` records only (PKG/model-manifest.json:30-37) |
| Matching by catalog id, then exact name ("Matched by name") | 02-design.md:36; exposure.ts:455 | `canonical_alias_of` (PKG/reference_engine.py:19-28); alias fa-22 → fa-12 |
| Per-set straps with per-mapping withholding; unknown straps credited and noted | types.ts:372-373; exposure.ts:313-318, 450-457; rules.ts:33 | `grip_assisted` sends the whole bout to unresolved (PKG/reference_engine.py:91-93) |
| Completeness counts | exposure.ts:602-611, 626-642 | `limb_bouts`, `unresolved_limb_bouts` (PKG/reference_engine.py:134) |
| Targets (muscle or movement, per side, three metrics, no default, no auto increase) | goals.ts; exposure.ts:736-786; 02-design.md:78-79 | "User target: optional, editable" (PKG/START-HERE-Claude.md:263), weekly_set_target null (PKG/rep-profiles.json) |
| Measurements (circumference, grip force) with protocol | region.ts:27-31; MeasurementsPanel.tsx | none |
| Thumb and finger-extension rows already reviewed | exerciseCatalogForearm.ts:87-105, 239-295; mappings.ts:290-296 | none (PKG/Coverage-and-verification.md:36-38; PKG/START-HERE-Claude.md:149-151) |
| Variant dimensions (orientation, wrist, grip, straps, laterality, phase, measure, deliberate hold, elbow angle) | types.ts:306-340; variants/forearm.ts:14-36 | `required_context` list per record, values not stored (PKG/exercises.json:20-27) |
| Version and rule on every summary; cache keyed by both | exposure.ts:696-697; useSpecializationSummary.ts:154; 06-calculation.md:74 | `model_version` per record (PKG/exercises.json `model_version`) |

## B. What the package has that the app lacks

| Concept | Package (file:line) | App today (file:line) | Conflict with 02-design.md? |
|---|---|---|---|
| Tissue units and regional groups per muscle, a parent bout counted once per region | PKG/muscles.json:14-18, 37-41 … (one unit and one group per muscle); PKG/reference_engine.py:104-108; PKG/START-HERE-Claude.md:201, 211-214 | nothing; the nearest are the compartments (ids.ts:40-45; nodes.ts:36-55, "A group, not a muscle", never credited) and the region total of distinct bouts (rules.ts:36) | No, but it is a new counted measure: a new rule clause (rules.ts:7-8, "a new version id") and reviewed tissue claims under 03-anatomy-evidence.md §1 |
| Rep profiles per task family (wrist, rotation, elbow, finger, thumb, isometric grip, ballistic) | PKG/rep-profiles.json:1-169; PKG/muscles.json `rep_profile_id`; PKG/exercises.json `prescription_profile_id` | prescriptions by training goal and position only (workoutPlanner.ts:59-64); a hold's default 30 s (workoutPlanner.ts:79-81) | No (planner content, not counting) |
| Supporting isometric distinct from incidental grip | PKG/START-HERE-Claude.md:107-109 | one category, `incidental_isometric`, for stabilizer and incidental (rules.ts:61; 02-design.md:45-46); the relationship survives in each contribution's `parts` (exposure.ts:328-336) | Yes: the category table is binding. Keep it; show the split from `parts` if wanted |
| Deliberate vs incidental grip | bucket per cell (PKG/START-HERE-Claude.md:107, 141) | variant `deliberateHold` + relationship (variants/forearm.ts:30-32, 88-92; rules.ts:60-61) | Same idea, already built |
| Straps | "no arbitrary 0.2 multiplier; reviewed assisted variant or unknown" (PKG/START-HERE-Claude.md:291) | built: per-mapping withholding (exposure.ts:313-318) | No |
| Drop-set parent bout with segments | PKG/START-HERE-Claude.md:116, 285; PKG/reference_engine.py:79-89 | built: one bout, `kind: "drop"`, segments from `stagesOf` (rules.ts:16; bouts.ts:104, 143; exposure.ts:346-348, 442) | No |
| Conflicting duplicate segments rejected | PKG/reference_engine.py:61-64 | first record kept silently (exposure.ts:529-539) | No; device ids are unique, keep the app's |
| Warm-ups kept as tendon context | PKG/START-HERE-Claude.md:214, 291; PKG/reference_engine.py:105-110, 130-131 | warm-ups excluded from every total, counted only in `completeness.boutsExcluded.warmup` (exposure.ts:627; rules.ts:19; 02-design.md:34) | Compatible only as a separate disclosure outside the work totals, under a new rule clause |
| Known seconds vs missing duration count | PKG/reference_engine.py:111-114, 124 | null seconds add 0 (exposure.ts:344, 491-494); a node shows "time not recorded" only when its total is 0 (model.ts:82-84); the recap says "Seconds not recorded" per set (sessionRecap.ts:129-132) | No; a missing-seconds count per node is a gap |
| Symptoms (private, side, location, 0-10, timing) | PKG/START-HERE-Claude.md:199, 227, 264, 277 | none; session notes only | Yes: 02-design.md:81 "the session note that already exists … No new questionnaire". 02-design wins |
| Workload change vs median of prior complete weeks | PKG/reference_engine.py:138-157; PKG/START-HERE-Claude.md:219-221 | none | No (new, descriptive) |
| RIR/RPE | PKG/START-HERE-Claude.md:64, 195 | `effort: "failure" | "not_to_failure" | null` (types.ts:649) | No |
| PL absent: "not applicable" without a deficit | PKG/START-HERE-Claude.md:153 | caveat only (nodes.ts:98-101; mappings.ts:174) | No |
| Ordinal 0-4 grades and index | PKG/START-HERE-Claude.md:84-99 | none on purpose (mappings.ts:24-26; 02-design.md:68) | Yes as a counted value: refuse. Not imported |

## C. Where a matched exercise is credited differently

See package-vs-app-exercises.md beside this file. In every matched pair the app's forearm rows are a
subset of the package's: the app never credits a forearm muscle the package leaves out. The package
adds wrist stabilizers (FCR, FCU, and ECRL/ECRB/ECU where the app has none) to curls, rows, levers,
holds and grippers, FPL incidental grip almost everywhere, PQ steadying in supination, FPL supporting
dynamic in the gripper. Three disagreements on a role both credit:
- FDS/FDP in wrist curls (fa-01, fa-11): package supporting dynamic (wrist-flexion assist, which
  nodeActions.ts:42, 47 also list); app incidental grip (mappings.ts:175). One mapping per variant
  and muscle (05-mappings.md:27) means it is one or the other.
- BR in a supinated thick-grip curl (fa-08): package direct; app contributing (mappings.ts:142,
  M1 = package S06).
- FPL in carries and the towel hang (fa-21, fa-33, fa-43): package supporting isometric; app draft
  contributing isometric, which on a deliberate-hold variant counts as a deliberate hold (rules.ts:60).
