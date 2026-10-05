# Weekly review rebuild: design

Brief: `Sports-Genome-Oct05-Weekly-Review-Visual-and-Utility-Rebuild-Claude.md` (5 October 2026). This record says what is built and why, before it is built. `01-inventory.md` is the inventory it rests on; `README.md` carries the brief's checkboxes and the evidence.

## 1. What exists, in one paragraph

Train → Review is one workspace (`client/src/pages/Home.tsx`, `workspace === "review"`). It renders, in order: WarmupPanel (the open day's drills), WeeklyMuscleVolumePanel (the saved week), RecoverySpacingPanel (the saved week), ProgrammingGuidePanel (the open day), WorkoutHealthPanel "Coach scan" (the open day), ImportedPlanContext (the open day). Two of six panels are about the week; the heading says "Review your week". The week's numbers come from `getWeeklyMuscleVolume` (`client/src/lib/weeklyVolume.ts:30`): a primary-muscle set counts 1.0 to that muscle, a secondary-muscle set 0.5 (`logicCalibration.exposure.secondarySetConvention`, `evidenceTraceability.ts:214`), the set count is the saved prescription's leading integer or the goal default, else 3. The overlap check (`recoverySpacing.ts:37`) compares saved days adjacent in plan order; a muscle is shared when both days give it at least 3 attributed sets, and a pair is "heavy" when the summed minimums reach 8. The plan has no dates and no rest marker (`trainingDayPlan.ts`): a day is built or not built.

## 2. Scope model

- `reviewScope: "week" | "day"` is Home state beside `workspace`. The day view is carried in the address as `scope=day` so direct entry and Back restore it; the week is the default, so a plain `?workspace=review` is the week and the address every existing test and link already uses. It is never persisted to the plan.
- **Week** is the default on direct entry and from Home. **Day** is the scope when Review is opened from a workout: the Plan's pointer ("Warm-up, programming detail and the week's volume are on Review") and the tracker's review link, both of which name the open day.
- Home's "Your week" block gains a second link, **Review week**, beside "View plan". It opens Review in Week scope for the week Home resolved. "View plan" is unchanged.
- The scope control is a two-segment control under the title. Switching it changes `reviewScope` only: not the active day, not the active week, not `trainChoice` (Home's next workout, Sep 28 rules). Day scope reads the day Plan has open (`activeSlot`), exactly as the day panels do today.
- Week review's week selector reuses Plan's `selectWeek` with `navigate: false` (the week switches, Review stays) and names the week "Week N". Plans have no name; the title line says "Week 1 · 5-day plan" from `trainingDays`, which is what the plan is called everywhere else. The pills appear only when a second week has been generated.
- The analysis reads `homePlan.weeks[activeWeek]`, the week with the open day's draft committed synchronously (the inventory found `weeklyPlan` lagged the draft by one effect tick and a pre-hydration window), so an edit on Plan is on the board the moment Review opens.
- **Edit week** opens Plan on the same week (`navigateWorkspace("day-plan")`); Plan's existing pointer back to Review is the return path (it opens the Day scope, since it sits under a day), and the Review tab returns to the scope Review was left on. The board's own selection (a muscle, a pair, the metric) is held in the board and starts fresh on return; the analysis is recomputed from the plan, so an edit made on Plan is on the board when it reopens. **Edit [day]** and **Add exercises to [day]** select that day in Plan (the inspected-day marker, which Sep 28 §4 allows) and go there; the add action opens the picker sheet only once the page is at its top, because the sheet pins and later restores the scroll offset it finds at mount and Review's offset would otherwise come back onto Plan.

## 3. One analysis

`client/src/lib/weekReview.ts` exports `analyzeWeek(input): WeekAnalysis`. Every Week-scope component reads one result; nothing re-aggregates. Revision `week_review_v1` rides on the result.

Input: the visible week (`visibleDayPlan` plan and prescriptions), the day slots, the goal, the catalog, the sport id.

Output:
- `sessions[]`: one per slot in plan order: key, day, ordinal, label, `exerciseCount`, `workSets` (sum of parsed set counts, the same parse `getWorkoutDiagnostics` uses), `state: "built" | "empty"`. There is no rest marker in the plan, so an empty slot is reported as not built and never as rest.
- `workSets`: the week's planned work sets, the sum over sessions. This is the session total the brief asks for; it is not the attributed total.
- `muscles[]`: per catalog muscle key: label (`displayNames`), figure keys (`regionKeysForValue`), `direct`, `supporting` (weighted, 0.5 applied once here and nowhere else), `supportingPerformed` (the unweighted sets, for the caption), `total`, `byDay[]` (direct and supporting per session), `exercises[]` (session, exercise, sets, role). Sorted by total, then label. Zero rows are listed for every muscle the goal's split targets name (`getSplitRequirements`) so a zero is a zero, not an absence.
- `attributedTotal`: the sum of totals, kept for the methodology note only.
- `unmapped[]`: exercises with no primary and no secondary muscle (unknown mapping). They are counted in `workSets` and listed; they add nothing to any muscle.
- `patterns[]`: one per `Exercise.movement` value present in the week, with the contributing exercises per session. `notPlanned[]`: the catalog's twelve most common movement values that the week does not contain (Horizontal push, Horizontal pull, Vertical pull, Elbow flexion, Trunk flexion / anti-extension, Squat / knee dominant, Elbow extension, Hip hinge, Scapular control, Rotation, Knee flexion, Hip extension). `unknownPattern[]`: exercises with no movement value. No new taxonomy: the values are the catalog's own.
- `overlap`: every pair of built sessions adjacent in plan order with `shared[]` (muscle, label, a sets, b sets) under the existing criterion (3 attributed sets on both days), `sharedExposure` and `heavy` (8 or more), plus the pairs not compared because a slot between them is not built. Plan order, never dates.
- `findings[]`: see §7.
- `dataNotes[]`: facts about the data under the numbers (exercises with no muscle mapping; saved prescriptions with no leading set count, counted as 3), kept apart from findings about the plan.
- `max`: the week's largest direct and total values, the one scale every bar and the figure share.
- Not built: a sport-demand view (`qualityToDemand` counts). The brief's sections do not ask for it and the Plan's stack analysis already shows it per day; it is listed as a follow-up rather than a seventh section.

The muscle arithmetic is the inventory's existing model, moved behind one function and extended with per-day direct and supporting values. The set count is read with `sessionVolume.parseSetCount`, the same leading-integer reading `getWeeklyMuscleVolume` makes (the inventory found four parsers; the Day review's Coach scan still reads the first digits anywhere, so a prescription that does not start with a count can differ there, and the data note says when one is in the week). `getWeeklyMuscleVolume` keeps working and its tests keep passing; the new function is the one Review reads, and `weekReview.test.ts` asserts the two agree on every muscle, every day, and that the overlap pairs agree with `getRecoverySpacingAlerts`. `displayNames` gains the three catalog keys it lacked (feet, hipFlexors, serratusAnterior), which the inventory found rendering as raw identifiers.

## 4. Week review layout (brief §3)

1. Title row: "Review" eyebrow, "Week 1 · 5-day plan", week pills, the Week/Day control, Edit week.
2. Session strip: one chip per slot in plan order: day name, "4 exercises · 15 sets" or "Not built". Tapping a chip selects it for the drilldowns below; it does not open Plan.
3. Two brief points: one supported strength, one highest-priority review point, from `findings` (§7). Only what the data supports; no filler.
4. **Muscle exposure**: the anatomy figure (front/back control on phones, both views from 900 px) and the ranked bar chart side by side on wide screens, stacked on phones. One metric control: "Direct sets" (the default: sets to perform) / "With support (est.)", applied to the figure's paint, the ranking, the bars' scale and the legend together; every row's caption carries both numbers whatever the metric ("12 direct · 3 supporting (est.)"). Six rows first, "View all muscles (N)"; a split-target muscle nothing trains reads "Not planned". Selecting a muscle on either surface rings it on the other and opens its by-session detail (bars as a share of its week, Edit [day], the contributing exercises with Inspect, Find exercises for it). Selecting a built session on the strip adds that session's figure in brackets to every row.
5. **Movement coverage**: pattern rows with a marker per session (present), each row opening to the exercises that carry the pattern (Inspect on each), then "Not planned" (of the catalog's twelve commonest values, the count stated on screen) and "Unknown mapping" lists. The catalog's movement value is free text with 62 distinct values and near-duplicates ("Hip hinge" beside "Hinge"); the board shows the values as the catalog has them and groups nothing, which is the brief's rule against a new taxonomy. A week missing a pattern outside the twelve (Jump / plyometric, Vertical push) is not flagged; that is a stated limit, not an oversight.
6. **Session overlap**: the strip once more with connectors between adjacent built sessions; a selected pair shows shared muscles side by side on one scale, the criterion in one sentence, and Edit [a] / Edit [b]. Labelled Spacing only if the plan ever carries dates; it does not, so the section is Session overlap.
7. **Suggested adjustments**: at most three findings with an action each; "Show more" for the rest.

Phones: one column, 16-20 px gutters (`--sg-gutter`), body text at `--sg-text-base`/`--sg-text-md`, labels at `--sg-text-sm` and never below `--sg-text-xs`. From 900 px: the figure and the chart share a row; the strip wraps deliberately.

## 5. Anatomy exposure mode

`AnatomyFigure` gains `exposureFor?: Record<string, number | "unknown">`, a third encoding beside roles and ranks. A key with a number is painted on a five-step sequential ramp of one neutral-warm hue, from the resting muscle tone to a pale cream (`--sg-exposure-1..5`), quantised by the week's own maximum so the scale is fixed for the week whatever is sorted or filtered. A key marked `"unknown"` is hatched (the rank mode's pattern), a key absent is neutral: zero and unknown stay distinct. The ramp shares no hue with the role colours (orange, teal, champagne) or the rank colours, and a legend of five swatches with "fewer sets" and "more sets" is shown with the figure. Selection stays the ring. Opacity encodes nothing.

## 6. Resolved numbers (brief §8)

| Number in the recording | Definition | Verdict |
|---|---|---|
| 344.5 attributed sets | Σ over muscles of direct + 0.5 × secondary sets. One performed set counts toward every muscle it is tagged with. | Methodology only. The board shows planned work sets. |
| Per-muscle totals (glutes 37) | direct + supporting for that muscle over the saved week | Kept, with the unit split: "20 direct · 17 supporting (est.)". |
| By-day values (Pull 5.5, Legs 20, Sport Transfer 11.5) | the same attribution per session | Drawn as the day-contribution chart under the selected muscle, direct and supporting apart. |
| Building <6, Established 6-11, High exposure 12+ | `lowDirectSetBand` 6, `highDirectSetBand` 12 on direct sets only (`evidenceTraceability.ts:218-219`); no source recorded | Not shown as badges. Named in the methodology disclosure as the register's planning landmarks on direct sets, with "no source recorded". |
| 161 Total effort | `round(totalSets × averageRpe)`, RPE default when unset (`workoutPlanner.ts:75`) | Day review's Coach scan only, labelled "sets × average RPE". Not on the week board. |
| 24% Muscle overlap | mean exercise-pair similarity in the day's stack (`exerciseGenome.ts:241`), a 0-100 index | Day review's Coach scan only, labelled as an index with its definition. Not on the week board. |
| Managed planned load | `fatigueExposure` under the moderate review mark (`WorkoutHealthPanel.tsx`) | Day review only, with the three marks named. |
| Heavy shared exposure | summed per-muscle minimum of attributed sets across a pair ≥ 8; shared muscle ≥ 3 on both days | Kept as the overlap criterion, stated beside the pair in one sentence. |
| 23 sets (Pull) | that day's planned work sets | Shown on the session chip; the week total is the sum, stated as the week's. |

Double counting: a set is attributed once per tagged muscle; `upperBack` and `traps` are separate catalog keys, each counted from its own tag, and `rhomboids` only ever resolves to `upperBack` (`anatomyRegions.ts:36`). A broad-group row is never a sum of its parts. Unilateral prescriptions, warm-ups, circuits and supersets are not represented in the plan model: a prescription is one string per exercise and its leading integer is the set count. The analysis says so in its data-quality note rather than guessing per-side sets.

## 7. Findings

Deterministic rules over the analysis, each with headline, reason, source and action. Deduplicated by underlying cause (one finding per muscle, one per pair). At most three shown; strengths and review points both.

- Concentration: a top-three muscle whose single largest session carries at least 60 % of its total while another session also trains it, and only where the split's own targets name the muscle on two or more built sessions (in a Push / Pull / Legs week most chest work falling on Push is the split, not a review point). "Most upper back exposure falls on Pull." Action: Review distribution (selects the muscle).
- Heavy overlap: an adjacent pair with `heavy`. "Push and Pull share heavy exposure: upper back, rear delts." Action: Compare sessions (selects the pair).
- Target gap: a built session whose split targets (`analyzeSplitStack`, revision `split_targets_v1`) leave a primary muscle in `gap`. "Legs leaves hamstrings under its target." Action: Add exercises (opens Plan on that day with the picker). This is the existing, tested coverage model, not a new judgement.
- Unknown mapping: exercises with no muscle tags. A data-quality note, not a finding.
- Strength: every built session clears its primary targets; or a muscle trained on three or more sessions with no heavy overlap and no concentration finding of its own (the first build called the upper back "spread across 3 sessions" and "concentrated on Pull" on the same board). Only when true.

No finding manufactures praise or a weakness. No finding rewrites the plan.

## 8. Day review

Names the day ("Week 1 · Day 02 · Pull"), a day selector (the same strip, as buttons that move the inspected day), then the existing panels in today's order: WarmupPanel, ProgrammingGuidePanel, WorkoutHealthPanel (Coach scan: "total effort: sets × average RPE", "muscle overlap index: how alike the exercises are, 0–100", and the planned-load marks named in the panel), ImportedPlanContext, and the Open workout action, which stays the only thing on Review that sets the next workout. Nothing is lost; it is scoped. The two old week panels (WeeklyMuscleVolumePanel, RecoverySpacingPanel) are no longer rendered; their modules and tests remain as the parity record.

## 9. States

- Empty week: the title row, the strip (all "Not built") and one action, Add workout, which opens Plan. No zero chart.
- Partial week: "2 of 5 days built" on the title row; the analysis covers what exists.
- Mapping gaps: a one-line note with an expandable list of the affected exercises.
- Loading: before the plan has hydrated (`planHydrated`), the title row renders and the sections hold their layout with no numbers.
- Recalculation is synchronous (`useMemo` over the plan), so there is no stale result to cancel and nothing to retry; Review needs no network.
- One detail surface at a time: selecting a muscle replaces a selected pair and vice versa.

## 10. Verification plan

- Unit: `weekReview.test.ts` (fixtures: a shared exercise across two days, a unilateral-looking prescription, a missing prescription, an unmapped exercise, agreement with `getWeeklyMuscleVolume`, the overlap criterion, the finding rules), `AnatomyFigure` exposure encoding, component render tests (scope control, strip, chart rows, selection coordination, empty and partial states).
- Browser: the Playwright harness used for the Sep 28 and Oct 5 records, against the built client at 320, 375, 390, 430 and 1280 px, with 125 % text, dark and light: before/after captures, the journeys of brief §11, no horizontal overflow, controls above the dock.
- The brief's checklist in `README.md`, each box with its evidence or its blocker.

## 11. Not built, and why

- Move session: the plan has no reordering of days; adding one is scheduling functionality outside this brief. Not offered.
- Spacing by date: the plan has no dates. The section is Session overlap.
- Rest days: the plan cannot record a deliberate rest day; an empty slot is "Not built". Recording rest is a plan-model change, listed as a follow-up.
- Expected analytical change on preview: the analysis is cheap and synchronous, so the board recalculates on save; a preview before saving needs the editor to hold a draft, which it does not. Follow-up.
