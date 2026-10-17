# Specialization atlas: the calculation (16 Oct 2026)

How exposure is counted, as implemented. The policy text is `exposureRuleV1` in `shared/specialization/rules.ts` (`specialization_exposure_v1`); the design is `02-design.md` §3–§5 and §8; this file says what the code does, where it had to choose, and which test holds each rule.

## 1. API

### Calculator (`shared/specialization/`, no React, no storage, no clock)

| Function | File | What it does |
|---|---|---|
| `getSpecializationSummary(request: SummaryRequest): SpecializationSummary` | `exposure.ts` | One region, one arm, one window, one mode: every node at once, the region total, region-only work, goals, completeness. |
| `indexRegion(region)` | `exposure.ts` | Lookups over a region's content, built once per region object (WeakMap): default variant per catalog id, current-version mappings per variant, coverage per node, the region's catalog keys. |
| `variantForCatalogId(region, id)`, `sharedPartnersOf(region, variant, nodeId)`, `nodeExposureIn(summary, nodeId)` | `exposure.ts` | Small readers the page and suggestions share. |
| `isValidTimeZone`, `localDateKey`, `zonedStartOfDay`, `addDaysToDateKey`, `mondayIndexOfDateKey`, `isDateKey`, `dateRangeLabel`, `intervalContains` | `time.ts` | Zone arithmetic with `Intl` only. |
| `calendarWeekInterval(nowIso, tz)`, `rolling7dInterval(nowIso, tz)`, `customInterval(from, to, tz)`, `planWeekInterval(week, tz?)` | `time.ts` | The four windows, each a `SummaryInterval` with its label ("This week · 12–18 Oct", "Rolling 7 days", "5–18 Oct", "Plan Week 2, as written"). |
| `validateGoal(goal, existing)`, `goalsForBothArms(draft)`, `isGoalActive(goal, todayKey)`, `isGoalActiveAt(goal, nowIso)`, `goalPeriodInterval(goal, nowIso)`, `goalProgressLabel(value, goal)` | `goals.ts` | Targets: validation with the reason, both arms as two goals, activity, the goal's own period, "8 of your 20". |

### Device adapters (`client/src/lib/specialization/`)

| Function | File | What it does |
|---|---|---|
| `boutsFromSessions(sessions, { catalog, variants, fallbackUnit })` | `bouts.ts` | Completed sets of finished workouts → bouts. |
| `excludedRecordsFromSessions(sessions, deps)` | `bouts.ts` | Skipped, typed-but-unlogged and unfinished-workout sets → records marked `excluded: "not_completed"`, counted in completeness only. |
| `resolveCatalogExercise`, `sideOf`, `holdSecondsOf`, `variantLookup` | `bouts.ts` | The pieces, exported for the page and tests. |
| `boutsFromPlan({ week, slots, store, variants, goal? })` | `planBouts.ts` | One plan week → one bout per planned set. |
| `plannedTarget(text, measure?)`, `prescriptionOf(saved, index, goal, measure?)`, `plannedExercisesInWeek(slots, store)` | `planBouts.ts` (`prescriptionOf` lives in `client/src/lib/workoutPlanner.ts` and is re-exported) | Written targets as reps or seconds (a bare number on a hold is seconds); the prescription every plan reader uses, Home and the tracker included, with a hold's default (§6); the week's exercises with their days. |
| `sourceRevision(sessions)`, `planRevision(store, slots?, week?, goal?)`, `stableStringify(value)` | `revision.ts` | FNV-1a fingerprints (`planFingerprint`) over only the fields exposure reads. |
| `loadSpecializationGoals`, `saveSpecializationGoals`, `upsertGoal`, `removeGoal`, `hasActiveGoalForRegion`, `useSpecializationGoals`; the same for measurements | `stores.ts` | Device stores under `scopedKey("sports-genome-specialization-goals-v1")` and `scopedKey("sports-genome-specialization-measurements-v1")`, events `sports-genome:specialization-goals` / `-measurements`. |
| `recommendFor(request)`, `previewPlannedChange({ region, before, after, side, planWeek })` | `recommendations.ts` | "Exercises for this muscle" and the add/swap preview. |
| `useSpecializationSummary(input)`, `computeSpecializationSummary(inputs)`, `summaryCacheKey(parts)`, `intervalForView(view, nowIso, tz)`, `catalogMusclesLookup(catalog)`, `useDeviceWorkoutSessions()` | `useSpecializationSummary.ts` | What the page reads. |

## 2. Rules as implemented

**Bouts.** A bout is one completed set (`isCompletedSet`) of a session with `status: "completed"`, or one planned set (`parseSetCount` of the prescription). Its id is the set's `id`, else `${session.id}/${exercise.id}/${index}` (index in the stored array); planned ids are `plan/${week}/${dayKey}/${entryId}/${n}`. A drop set is one bout; `stagesOf` gives its segments, each with its own load and reps. A duplicated bout id is read once.

**Exercise identity.** The recorded `catalogId`, else the exact catalog name (the tracker's rule: exact string, later row wins on a shared name), labelled "Matched by name". No fuzzy match. The variant read is `cat-<id>`, else the first variant listed for that catalog id.

**Load, reps, effort, holds.** Load is `setWeightKg` per segment from the unit it was typed in, shown as external load. Reps are the typed number per segment (blank or text is null). `effort` passes through; absent stays null, never "failure". `holdSeconds` (when the logger records it) goes on the first segment; zero, blank or text is null.

**Excluded.** Not credited and counted in `completeness.boutsExcluded`: `warmup: true`; `excluded: "not_completed"` (skipped sets, including the `skippedSets` stamp and fully skipped `notPerformed` exercises; typed-but-unlogged sets in finished workouts; logged sets of a workout still running). Removed workouts are simply absent.

**Window.** Completed mode: `mode === "completed"` and `performedAt` (the session's `completedAt`, else `startedAt`) in `[startAt, endAtExclusive)`; a null bound is open. Planned mode: `mode === "planned"` and `planWeek` equal to the interval's (all weeks if the interval has none).

**Arm.** `bilateral` counts for both arms (3 sets are 3 per arm), `left`/`right` only for that arm, `unknown` only in `unknownSide` and `regionUnknownSideBouts`. A bout of the other arm is not read at all, not even for completeness. Side source: the set's recorded side (`left`, `right`, `both` → bilateral); else a variant with `laterality: "bilateral"`; else unknown. Planned work: bilateral variants are `structural`; `unilateral` and `either` variants are `bilateral` with `sideSource: "plan_assumption"` and the note "Each side assumed"; no variant is unknown. A planned set count on a one-arm (`unilateral`) exercise is per arm: "3 × 12" is 3 bouts on each arm. For an athlete with an active target the tracker builds the same plan as two rows per planned set, Right then Left, arm preset (`perArmSets`, 07-logger.md), and a swap or an add in the middle of a workout keeps that count in planned sets (two one-arm rows left become one two-handed set; a two-handed set left becomes a Right and a Left row of a one-arm exercise), so the plan logged as built, swaps included, gives each arm exactly its planned bouts. Without a target the tracker builds one row per planned set, and the athlete chooses each row's arm.

**Mappings.** Only mappings whose `versionKey` is the region's `mappingVersion.key` are read, and `rejected` ones are dropped, so an older generation left in the data never adds credit. The mapping version's own `state` (draft/published) is not gated on: review status gates credit; publication is the database's job. `reviewed` mappings credit; `draft` mappings show as `pendingReviewBouts` and a `notCounted` row ("Mapping pending review") when nothing reviewed credits that node in that bout.

**Category.** `categoryFor(relationship, muscleMode, variant.deliberateHold)` per mapping. Per node per bout: one category if every credited part agrees, else `mixed`, with every part listed in `parts` (in mapping-id order). Node buckets therefore never overlap.

**Straps.** A reviewed mapping with `requiresNoStraps` gives nothing to a bout logged `straps: "yes"`; the bout is listed in that node's `notCounted` with "Strapped: grip not counted" (and the note is added to any other credit the node gets from the same bout). With straps `unknown` the credit stands and the row says "Straps not recorded". `no` adds nothing.

**Totals per node.** `directDynamicBouts`/`Reps`, `contributingDynamicBouts`/`Reps`, `deliberateHoldBouts`, `deliberateHoldSeconds` (sum of segment seconds of `deliberate_isometric` bouts only), `incidentalBouts`, `mixedBouts`, `unknownBouts`. Seconds never become sets and reps never become seconds. `contributions` holds every credited row, unknown-side rows included (marked `side: "unknown"`), oldest first, then by bout id in natural order. `sharedWith` lists the other nodes with a reviewed `shared` mapping of the same variant in the same category.

**Coverage.** Per node, independent of the window: `reviewed` if any reviewed current mapping targets it, `pending_review` if only drafts do, else `none` (draw hatched; never zero).

**Region.** `regionDistinctBouts` counts distinct bout ids with credit on a node whose `regionId` is the region's, on this arm; external contributors (an upper-arm muscle in a forearm region) are credited on their own rows but do not make a bout region work. Work on an exercise with no mapping in the region whose catalog tags (primary or secondary) include a target node's `catalogMuscleKey` goes to `regionUnclassified` and never to a node. A mapping to a compartment node credits the compartment only. Each region total keeps the set records it counts, so the page can open it down to the set (brief §1, §9 source bout ids): `regionBoutRows` (one per distinct bout behind `regionDistinctBouts`), `regionUnknownSideRows` (behind `regionUnknownSideBouts`) and `regionUnclassifiedRows` (behind `regionUnclassified.bouts`, each naming its exercise), all oldest first, then by bout id. A row is a `RegionBoutRow`: bout id, side and where it came from, catalog id, name and how it was matched, session id and label, time, kind and segments; it carries no node and no category, because a region total is distinct bouts, not credit to a muscle. The rows are an addition: no count is made from them.

**Completeness** is scoped to the region and to bouts that could reach this arm (this arm, bilateral, unknown): `boutsConsidered` = reviewed + pending-only + region-only (a partition), plus name-matched, unknown-side and the exclusions.

**Goals.** Only goals of this region and arm, active today in their own zone. Completed mode reads each goal over its own period relative to `now` (calendar week or rolling 7 days in the goal's zone), not the window on screen; planned mode reads the plan week shown. A muscle goal's value is that muscle's bucket for the metric (`direct_dynamic` or `deliberate_isometric`; seconds summed), so it equals the number on the muscle's row. A movement goal counts distinct bouts in which a credited reviewed mapping with that action, on a region node, has the metric's category; seconds once per bout. Unknown-side bouts never count. `fraction` is unbounded; `label` is "N of your T" ("… seconds" for hold seconds). No goal, no row: nothing reads as a deficit.

**Determinism.** `calculatedAt` is the request's `now`. Nodes are in region order; contributions by time then natural id; region-only exercises by bouts then name.

## 3. Windows

Calendar week: Monday 00:00 local to the next Monday 00:00 local, end excluded; 167 or 169 hours across a clock change. Rolling 7 days: exactly 168 hours back from now, end excluded. Custom: two local dates, both included (a reversed pair is read in order). Local midnight is found, not assumed: a date with no 00:00 (Havana 8 Mar 2026, Santiago 6 Sep 2026) starts at 01:00; a repeated midnight (Havana 1 Nov 2026) starts at the first one. Plan week: no dates, label "Plan Week N, as written".

## 4. Cache key

`useSpecializationSummary` memoizes in a module LRU (24 entries) keyed by `summaryCacheKey`: account scope, region, interval (kind, start, end, plan week), time zone, arm, mode, plan revision (planned mode only), source revision (completed mode only), rule version, mapping version, a fingerprint of the goals, and `now` to the minute. A completed summary carries no plan revision and a planned one no source revision, so logging a set never recalculates the planned view and a plan edit never recalculates the completed one. The workout log is re-read on `sports-genome:device-workout-history` and on a `storage` event for its key (another tab); every log, edit, removal, swap or late offline record changes the source revision. One call computes every node: there is no request per muscle.

## 5. Suggestions

Candidates come from reviewed current mappings to the selected node (or to the selected action on a region node) with relationship `direct` (dynamic → "direct dynamic"; isometric or mixed → "direct hold") or `contributing` (last). Ranked by relevance → equipment in the athlete's profile (`equipmentMatchesProfile`; no profile means all available) → not already in the plan week → one-arm work first when the selected arm trails the other on the goal's metric (else direct bouts) → name. Excluded exercises and equipment are removed and counted. A kind of work whose every target is met is left out (`skippedAtTarget`); a node with every target met returns `at_target` with a neutral note; a node or action with no reviewed mapping returns `mapping_not_reviewed`. Each candidate has one plain `why` sentence (relevance, actions, the gap or the work without a target, shared allocation, arm, plan overlap, equipment) and `alsoLoads` (every other node its reviewed mappings credit, external contributors included). `alreadyCoveredBy` lists the plan week's exercises that load the target directly or as contributing work. `previewPlannedChange` runs the calculator in planned mode on the before and after plan bouts and returns only the nodes whose values move, with the region total; completed bouts handed to it are ignored.

## 6. Where the design left room, and what was chosen

- **Types.** Optional fields were added to `types.ts`: `ExposureBout.excluded?: "not_completed"` (so completeness can count what the adapters left out without the calculator reading storage), `NodeExposure.notCounted?: Contribution[]` (the ledger rows for strapped grip and pending mappings, which earn nothing and so have no place in `contributions`), and, on 17 Oct, `SpecializationSummary.regionBoutRows?`, `regionUnknownSideRows?` and `regionUnclassifiedRows?` (`RegionBoutRow[]`, the set records behind the region totals, §2 "Region"). They sit beside `regionUnclassified` rather than inside it, so its shape, and every reader of it, is unchanged.
- **Region-only work and arms.** `regionUnclassified` lists this arm's, two-handed and unknown-side records: unmapped exercises have no variant, so their history is almost always unknown-side, and leaving it out would hide it. It is never added to a node or to `regionDistinctBouts`.
- **Mixed bouts and goals.** A goal reads the bucket strictly: a `mixed` bout is not counted toward a direct-dynamic or hold goal, so the goal and the row always agree. Hold seconds of a mixed bout are visible on its ledger row only.
- **Planned targets.** Reps and seconds read the low end of a range ("8–12" → 8, "20–30 sec" → 20 s): what the plan commits to. "m" is metres, not minutes. A bare number on an exercise measured in seconds is seconds ("3 × 40" on a hang is 40 s), as the set card reads it. An entry with no saved prescription reads the training goal's default for its position (`getGoalPrescription`), as the weekly review, Today and the tracker do, when Home passes the goal; otherwise 3 sets. On an exercise measured in seconds the default is a hold's: the goal's set count for that place with a 30-second target ("4 × 30 sec" where the goal says "4 × 3–6"; "3 × 30 sec" with no goal), and a saved prescription that is any goal's default for any place (the text the planner pins when it builds a day or a week) is read the same way, so planned hold seconds are never a rep range. Set counts are unchanged, so the planned bouts, the weekly volume map, Today and the week review count the same sets. Home's Plan editor, print and share read the same function with the measure from `shared/specialization/holdCatalogIds.ts` (07-logger.md, "One reading of a hold's prescription").
- **Shared allocation.** Grouped by variant and category, not by action: the two deep finger flexors bend different joints but share one grip, while a set's shared dynamic work stays apart from shared holding in the same set.
- **Contributing candidates.** Included as the last tier, as the design's ranking lists it; "direct" in "a reviewed direct mapping" is read as "mapped to the selected node".

## 7. Test matrix

Brief §11 rows, with the test that holds each (`describe` › `it`):

| Brief §11 scenario | Test |
|---|---|
| Bilateral 3 sets | `brief11.test.ts` › brief §11: sides › Bilateral 3 sets → 3 per side, not 6 per side |
| Left-only 3 sets | `brief11.test.ts` › brief §11: sides › Left-only 3 sets → right remains unchanged |
| Unknown historical side | `brief11.test.ts` › brief §11: sides › Unknown historical side → unassigned bucket, not guessed |
| Three-segment drop set | `brief11.test.ts` › brief §11: bouts, segments and categories › Three-segment drop set → 1 distinct bout, segments retained |
| Two actions in one bout | `brief11.test.ts` › … › Two actions in one bout → no duplicate muscle bout count |
| Same bout affects FCR and FCU | `brief11.test.ts` › … › Same bout affects FCR and FCU → both show exposure; regional bout total remains one |
| Deliberate 30-second hold | `brief11.test.ts` › … › Deliberate 30-second hold → hold duration recorded without dynamic-set conversion |
| Row with straps | `brief11.test.ts` › brief §11: straps › Row with straps → applicable reviewed grip mapping; no blanket full finger-flexor credit |
| Unknown straps | `brief11.test.ts` › brief §11: straps › Unknown straps → uncertainty preserved |
| Reverse curl | `brief11.test.ts` › brief §11: bouts, segments and categories › Reverse curl → dynamic elbow flexion and wrist stabilization separately represented |
| Generic forearm mapping | `brief11.test.ts` › brief §11: what is not node credit › Generic forearm mapping → no automatic detailed-muscle credit |
| Warm-up/skipped set | `brief11.test.ts` › … › Warm-up/skipped set → not in completed work totals |
| Mid-workout swap | `brief11.test.ts` › brief §11: changes to the records and the plan › Mid-workout swap → completed original sets preserved; the rest is the new exercise's |
| Add exercise preview | `brief11.test.ts` › … › Add exercise preview → planned summary changes; completed summary does not |
| Goal 20 direct bouts | `brief11.test.ts` › brief §11: targets › Goal 20 direct bouts → supported; displayed as the athlete's target, not a prescription |
| Goal unset | `brief11.test.ts` › brief §11: targets › Goal unset → no fake deficit |
| Mapping unavailable | `brief11.test.ts` › brief §11: what is not node credit › Mapping unavailable → hatched/unknown, not untrained |
| Mapping revision | `brief11.test.ts` › … › Mapping revision → one active generation; no double-counting |
| Edit/delete old record | `brief11.test.ts` › brief §11: changes to the records and the plan › Edit/delete old record → relevant historical total recalculated; `useSpecializationSummary.test.ts` › recalculates when a set is edited or a workout removed, including an old one, and only then |
| Calendar week / rolling 7 days | `brief11.test.ts` › brief §11: windows › (both tests); `time.test.ts` › calendar week: … › is 167 hours across a spring change and 169 across an autumn one, with exact ends; the first instant of a local day › (Havana, Santiago) |
| New deltoid region fixture | `regionAgnostic.test.ts` › the same calculator on the deltoid region › (both tests); › no region is named in the calculator, the windows, the goals or the adapters |
| View/layer change, small muscle selected | `SpecializationDiagram.render.test.ts` › selection › keeps a selection that is not on this layer, and says where it is; › tap targets on a phone › gives every muscle a square at least 44 px across at the phone's drawing width, and › places each square where it covers little of other muscles as drawn |
| User A queries user B, ordinary user edits mapping | `server/specializationSchema.test.ts` (Postgres 17 in PGlite: RLS for anon, two signed-in users and the service role; reference tables refuse writes from a signed-in user) |

Brief §5 worked fixture: `brief11.test.ts` › brief §5: the worked accounting fixture › left arm / right arm: 7 distinct bouts; flexors 2, extensors 2, grip 3 holds = 90 s; wrist-exercise grip incidental › FCR and FCU both appearing in two bouts is two wrist-curl bouts, not four › makes no claim that any muscle received seven hypertrophy sets.

Other files: `exposure.test.ts` (each rule on plain bouts, goals over their own period, movement goals by distinct bouts), `regionRows.test.ts` (the set records kept behind each region total), `bouts.test.ts` (adapters, plan defaults, revisions), `time.test.ts` (windows and DST in New York, London, Havana, Santiago), `goals.test.ts` (validation, overlap, both arms, labels), `stores.test.ts` (corrupt and refused storage, account scoping, hooks), `recommendations.test.ts` (ranking, exclusions, targets met, shared work, preview), `useSpecializationSummary.test.ts` (the hook, cache key, windows), `regionAgnostic.test.ts` (deltoid fixture, no region names, forearm content smoke test).

All calculator tests run on `__fixtures__/syntheticForearm.ts`, a forearm-shaped region whose mappings are test assumptions, so they do not depend on the reviewed forearm content; the smoke test runs the real `forearmRegionData` whatever it holds.

## 8. Known limits

- History logged before this release has no `side`, `holdSeconds`, `warmup` or `straps`: it reads as no arm recorded (except two-handed variants, which count for both arms), holds as "time not recorded" (a hold bout with no seconds; the recap, the session detail and an exercise's history say "Seconds not recorded"), no warm-ups and unknown straps. A set with reps on an exercise now measured in seconds stays a rep set: its reps are never read as hold seconds (07-logger.md). The logger keeps all four from this release on (`normalizeSet`, `loadDeviceWorkoutSessions`; 07-logger.md).
- `DiagramViewId` is the drawing's own id (any `^[a-z][a-z0-9_]*$`), and each drawing lists its views with their words in `viewOrder`: the forearm's palm, back and thumb side, the deltoid fixture's front, side and rear (02-design.md §10). The calculator reads no view.
- Planned bouts have no load, and an assumed side for one-arm work; the ledger says so. With a target, the tracker lays the same plan out per arm, so the assumption is the rows the athlete is offered.
