# Weekly review rebuild (5 October 2026)

Brief: `Sports-Genome-Oct05-Weekly-Review-Visual-and-Utility-Rebuild-Claude.md`. Records in this folder: `01-inventory.md` (what Review was, every number traced), `02-design.md` (what was built and why), `evidence/` (captures and the journey log). Every box below is ticked only where the evidence named beside it was produced in this session; what is blocked or untested says so.

## Changed code

| Where | What |
|---|---|
| `client/src/lib/weekReview.ts`, `.test.ts` | `analyzeWeek(input): WeekAnalysis`, revision `week_review_v1`: sessions in plan order, planned work sets, per-muscle direct / supporting / total with per-session values and contributing exercises, zero rows for split-target muscles, attributed total (methodology only), movement patterns present / not planned / unknown, adjacent-session overlap with the register's criterion, findings (strengths and review points), data notes. 17 tests, including agreement with `getWeeklyMuscleVolume` on every muscle and day and with `getRecoverySpacingAlerts` on every pair. |
| `client/src/components/weekReview/WeekReviewBoard.tsx`, `ReviewHead.tsx`, `week-review.css`, `WeekReviewBoard.render.test.ts` | The Week board (strip, two points, muscle exposure with the figure and the ranked chart, selected-muscle detail, movement coverage, session overlap with pair detail, suggested adjustments, empty / loading / unknown-mapping states) and the head with the Week / Day control and week pills. 12 render tests. |
| `client/src/components/anatomy/AnatomyFigure.tsx`, `exposurePaint.ts`, `anatomy-figure.css`, `AnatomyFigure.exposure.test.ts` | A third paint encoding, `exposureFor` + `exposureMax`: five steps of one muted sand hue quantised against the week's maximum, unknown hatched, zero left as the resting muscle. 4 tests. |
| `client/src/pages/Home.tsx`, `Home.reviewScope.test.ts`, `Home.review.test.ts`, `Home.reviewMatches.test.ts` | `reviewScope` state carried as `scope=day` on Review's address (the week is the plain address), restored on load and Back; `navigateWorkspace(..., { reviewScope })`; `selectWeek(week, { navigate: false })` for Review's pills; `weekAnalysis` memo over the week with the open day's draft committed; the Review branch in two scopes; Plan's pointer opens the Day scope; Home's "Review week" opens the Week scope. 3 jsdom journeys. |
| `client/src/components/TodayActionPanel.tsx` | "Review week" beside "View plan" on Home's Your week. |
| `client/src/components/WorkoutHealthPanel.tsx` | The Coach scan's numbers explained in place: total effort = sets × average RPE; muscle overlap = mean pairwise exercise similarity, 0-100; the planned-load marks named. |
| `client/src/lib/weeklyVolume.ts` | `displayNames` gains feet, hipFlexors, serratusAnterior (they rendered as raw identifiers). |
| `client/src/index.css` | `.home-section-links` for the two Home links. |

Not rendered any more, kept with their tests as the parity record: `WeeklyMuscleVolumePanel`, `RecoverySpacingPanel`.

## Resolved calculation definitions

- **Direct sets**: a set counts 1.0 to each muscle the catalog tags as primary. **Supporting contribution (estimated)**: 0.5 to each muscle tagged as secondary and not primary (`logicCalibration.exposure.secondarySetConvention`), applied once, in `analyzeWeek` alone; totals, bars, the day chart and the pair comparison all read that one result.
- **Set count**: the saved prescription's leading integer, else the goal default, else 3 (`sessionVolume.parseSetCount`, the same reading the old map made). A saved prescription with no leading count above zero is counted as 3 and a data note says how many.
- **Planned work sets** (the session chips and the title): the sum of set counts, sets to perform. **Attributed total** (the recording's 344.5): the sum of every muscle's direct + supporting, stated only in "How these numbers are counted", because one performed set counts toward every muscle it is tagged with.
- **Session overlap**: sessions adjacent in plan order; a muscle is shared when both give it at least 3 attributed sets; heavy from 8 summed shared sets. Plan order, never dates; a built session with an unbuilt slot between it and the next is listed as not compared.
- **Split-target gap**: `analyzeSplitStack`, revision `split_targets_v1`, primary-role gaps under 65 % of the day's target in catalog-tag points.
- **Concentration**: a top-three muscle, trained on two or more sessions, with 60 % or more of its attributed sets on one session, only where the split's own targets name it on two or more built sessions.
- **Total effort** (Day review): sets × average RPE (default 7). **Muscle overlap** (Day review): the mean similarity index of every pair of the day's exercises, 0-100. **Planned load**: the systemic fatigue index, Managed below 52, Moderate from 52, High from 72.
- **Bands** (Building < 6, Established 6-11, High exposure 12+): the register's planning landmarks on direct sets; no recorded source; not shown as badges, named in the methodology note.

## Tests performed

- `npx tsc --noEmit`: clean.
- `npx vitest run`: 366 files and 2969 tests pass; the 5 failures are `server/supabaseEvidenceConnection.test.ts`, `supabaseEvidenceRls.test.ts`, `supabasePublicAssets` and `supabaseStorageConnection`, which assert on `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` being set and fail in this sandbox on `main` as well (no secrets here). Not touched by this change.
- Edge cases run as a scratch script against the shipped calculators (`scratchpad/review/edge.ts`): a 1-day split, a 7-day split with repeated exercise ids and a "0 x 10" prescription, "AMRAP" and "3 × 8 / side" prescriptions, a plan key outside the split, every catalog exercise across five days on all four goals, and 300 random plans: every muscle, every day and every pair agrees with `getWeeklyMuscleVolume` and `getRecoverySpacingAlerts` (shared-muscle ties order differently, by label here); no duplicate finding ids; no muscle both "spread" and "concentrated"; per-session values sum to the week's on every row.
- Browser, against the built client (Playwright, Chromium), `evidence/review-shots-after.json` and `evidence/journeys-after.json`: 320, 375, 390 and 430 CSS px, desktop 1280, 390 at 125 % text, dark and light theme; no horizontal overflow and no page errors at any width; the journeys of §11 below.

## The brief's checklist

Ticked = implemented and verified in this session, with the evidence named. Unticked = blocked, out of scope or untested, with the reason.

### §2 One canonical Review destination with explicit scope
- [x] Train → Review stays the canonical location (one `review` workspace; `Home.noRepeatedPages.test.ts` passes).
- [x] Week / Day control beside the title (`ReviewScopeControl`; `evidence/review-390-after.jpg`, `day-scope-390.jpg`).
- [x] From Home's weekly summary, "Review week" opens the Week with the correct plan week (`journeys-after.json` → `home`: `?workspace=review`, "Week 1 · 5-day plan"; `Home.reviewScope.test.ts`).
- [x] From a workout's review action (Plan's pointer under the day), Review opens on that exact day (`journeys-after.json` → `day`: `?workspace=review&scope=day`, "Week 1 · Day 02 · Pull").
- [x] Direct entry restores the scope from the address and names it; the tab keeps the scope Review was left on; nothing reuses day context silently (`Home.reviewScope.test.ts`, three journeys).
- [x] Week review shows "Week 1 · 5-day plan" and a week selector. Plans have no name (`01-inventory.md` §4); the plan is named by its frequency, as everywhere else. The pills appear once a second week exists (`ReviewWeekPills`; render test).
- [x] Day review names the day and keeps warm-up, planning guide and Coach scan (`day-scope-390.jpg`; `Home.review.test.ts`).
- [x] Day-only sections removed from the Week reading flow and kept in Day review.
- [x] Edit week in Week review; return by Plan's pointer (Day scope) or the Review tab (last scope), the board recomputed from the plan (`journeys-after.json` → `journey`).
- [x] Switching scope changes neither the active plan nor the next workout: only Open workout sets `trainChoice` (`Home.review.test.ts` pins the board contains no `chooseDayToTrain`; `Home.reviewScope.test.ts`).

### §3 Week review layout
- [x] Title, week, scope control, Edit week; session strip; one strength and one review point; Muscle exposure; Movement coverage; Session overlap; Suggested adjustments, in that order (`review-390-after.jpg`, `review-desktop-after.jpg`).
- [x] One column on phones; the figure and the chart share a row from 900 px (`review-desktop-after.jpg`).
- [x] First viewport: week identity, the strip, the two points and the start of the exposure section at 390 (`review-390-after.jpg`).
- [x] Body-text scale for headings and chart labels (`--sg-text-sm` and above; `typeScale.test.ts` passes).
- [x] 16-20 px gutters (`--sg-gutter`), shared surfaces and dividers; no box per insight (`week-review.css`).
- [x] Dark navy ground, orange for the primary action (Add a workout, Open workout) and for direct sets, not for statuses.
- [x] No overall score.

### §4 Coordinated visual muscle overview
- [x] The canonical `AnatomyFigure` with catalog muscle keys; `shoulders` painted on the three deltoid regions (`weekReview.test.ts`).
- [x] Front / Back control on phones; both bodies from 900 px (`metric-support-back-390.jpg`, `desktop-light-selected.jpg`).
- [x] Labelled exposure scale: five swatches "fewer to more", the top step stated; more colour is more of the metric, nothing else (`AnatomyFigure.exposure.test.ts`).
- [x] Unknown mapping hatched, zero left as the resting muscle (render test "names the data it cannot speak for").
- [x] Selecting a muscle on the figure rings it, selects its row and opens its by-session detail; the same from the text list (render test; `muscle-detail-390.jpg`, `desktop-light-selected.jpg`).
- [x] Role, rank and exposure paints are separate encodings with separate tokens and this mode's own legend (`AnatomyFigure.exposure.test.ts` checks no ramp step equals a role colour).
- [x] Direct sets and estimated supporting contribution named on every row; bars on one zero-based scale, the week's largest, fixed while sorting or switching the metric (`review-390-after.jpg`; render test).
- [x] No status badges; the bands' basis stated on demand (methodology note).
- [ ] Supported targets as a subtle range: not shown. The register's 6 / 12 landmarks have no recorded source (`01-inventory.md` §2), so the chart stays descriptive.
- [x] Six rows first, "View all muscles (N)", split-target zero rows in the full view (render test).
- [x] Metric control "Direct sets / With support (est.)" updating the figure, the ranking, the bars and the legend together (render test "applies the metric…"; `metric-support-back-390.jpg`).
- [x] No card or paragraph per muscle.
- [x] Selected-muscle detail: a bar per built session, zero included (`muscle-detail-390.jpg`).
- [x] The recorded Pull 5.5 / Legs 20 / Sport Transfer 11.5 are not hardcoded anywhere; the fixtures are the catalog's own exercises.
- [x] The contributing exercises with their sets and role, each with Inspect (opens the exercise sheet: `journeys-after.json` → `muscle.inspect`), and Edit [day] per session, and Find exercises for the muscle (muscle-mode catalog).
- [ ] Return to the same selected muscle and scroll position after Edit / Inspect: Inspect is an overlay and returns to the same board; Edit leaves for Plan, and on return the board recomputes and starts with no selection, at the top (the app's navigation rule). Follow-up.
- [x] Calculations inspectable on demand ("How these numbers are counted"), not in the default view.

### §5 Weekly structure and missing coverage
- [x] Each planned session once, with exercise and work-set counts (`review-390-after.jpg`).
- [ ] Deliberate rest vs an empty draft day: the plan model has no rest marker (`01-inventory.md` §4); an empty slot is shown as "Not built", never as rest. Recording rest is a plan-model change; follow-up.
- [x] Pattern rows with a labelled marker per session (`review-desktop-after.jpg`); stacked rows with chips on phones.
- [x] Patterns are the catalog's own `movement` values; nothing regrouped (`01-inventory.md` §2).
- [x] Present, Not planned (of the catalog's twelve commonest values, the count stated) and Unknown mapping, distinct.
- [x] A pattern row opens to its contributing exercises with Inspect (render test "marks movement coverage…").
- [ ] Missing coverage judged against the goal or explicit priorities: the "Not planned" list is relative to the catalog's commonest patterns, not the goal; the split-target gap findings are the goal-relative part. Follow-up.
- [ ] A secondary Sport demands view: not built (day-scope `analyzeStackQualities` exists; a week version would need to say what it does not show). Follow-up.
- [ ] Routing a movement gap to exercises supporting that movement: the catalog has no pattern discovery mode; the pattern row lists the exercises it has, and the muscle detail's discovery is muscle-keyed. Follow-up.
- [x] No sport-skill conclusions anywhere on the board.

### §6 Session overlap comparison
- [x] The section is "Session overlap" and says the plan has no dates.
- [x] The sequence once, as selectable pair chips with one-line summaries; no repeated blocks.
- [x] Selected pair: both names, shared muscles side by side on one scale, the criterion in one sentence (`pair-compare-390.jpg`).
- [x] Compare (the chip), Edit [a], Edit [b] (`journeys-after.json` → `pair.afterEdit`).
- [x] No Move session: the plan has no reordering of days.
- [ ] Date-based Spacing: no dates exist; not applicable.
- [ ] Adjacent-week boundary context: not built; follow-up.
- [x] Overlap stays descriptive.

### §7 Adjustments
- [x] At most three findings by default, "Show N more" after; deduplicated by cause (one id per muscle, pair or day; 300 random plans produce no duplicate).
- [x] Strengths as well as review points, only when true; the two-point block is omitted when neither exists.
- [x] "Most [muscle] exposure falls on [day]" with its distribution and Review distribution (which opens the muscle's detail).
- [ ] "No planned exercise is mapped to [pattern]" with Find exercises: not a finding, because the catalog has no pattern-keyed discovery to route to; the Not planned list shows the gap. Follow-up.
- [x] Suggestions are labelled as such and never rewrite the plan.
- [ ] Expected analytical change on preview: the editor holds no draft to preview; the board recalculates on save. Follow-up.
- [x] Saving an edit updates the board and its findings (`journeys-after.json` → `journey`: 53 → 56 planned sets; the Sport Transfer gap finding narrows from three muscles to one after Cable Wood Chop is added).
- [x] Actions are routes into Plan (with the picker open on the day), the exercise sheet and the catalog.

### §8 Numbers
- [x] 344.5 traced (`01-inventory.md` §2, §6): Σ of overlapping attributions; methodology only.
- [x] Planned work sets shown per session and summed for the week, scoped as the week's.
- [x] The Pull day's 23 sets stays a day figure (chip and Day review).
- [x] 161 total effort traced and defined; Day review only, labelled.
- [x] 24 % muscle overlap traced (numerator, denominator, scope, algorithm); Day review only, labelled an index.
- [x] 0.5 applied once; the same result feeds totals, bars, the day chart and the pair comparison (`weekReview.test.ts`; edge script).
- [x] Direct-set statuses no longer sit beside attributed totals; no statuses at all.
- [x] No region is a sum of its parts; each tag is its own row (methodology note; `01-inventory.md` §2).
- [x] Per-side, warm-ups, circuits and supersets are stated as not represented; missing prescriptions take the goal default and are said when unreadable.
- [x] No combined time / distance / reps / load number.
- [x] Absent mappings are unknown, not zero: a data note, no muscle credit, and hatched regions.
- [x] Every Week-scope surface reads one `WeekAnalysis` with its revision (`Home.review.test.ts` pins the board uses no other calculator).

### §9 States, responsiveness, polish
- [x] Empty week: the strip and Add a workout (`review-empty-390-after.jpg`).
- [x] Partial week: "1 of 5 days built" and analysis of what exists (`review-partial-390-after.jpg`).
- [x] Mapping gaps: a data note naming the exercises; the figure's zero regions hatched.
- [x] Loading: the head and a placeholder board, no zero figure (render test).
- [x] Recalculation is synchronous (`useMemo` over the plan); the latest valid result is always on screen.
- [x] Rapid week switching: the analysis is a pure function of the active week's store, recomputed in the same render; no stale asynchronous result exists to render under the wrong week.
- [ ] Network failure: Review needs no network; nothing to retry. Not applicable.
- [x] Keyboard and touch: every control is a button with a name; the figure is one tab stop with arrow keys; chips carry text, not colour alone.
- [x] One detail surface at a time (selecting a muscle closes a pair and the reverse; render test).
- [x] Enlarged text (390 at 125 %: no overflow, `review-390-text125-after.jpg`), reduced motion (transitions off), the dock's safe area (page padding unchanged).
- [x] Final rows and controls scroll above the dock (full-page captures end with the last finding above the dock).
- [x] No horizontal overflow at 320, 375, 390, 430 or 1280 (`review-shots-after.json`).

### §11 Acceptance
- [x] From Home, weekly review opens on the correct plan week.
- [x] From a workout (Plan's pointer), Day review opens on the correct day.
- [x] Open a muscle, see which sessions create its total, reach the exercise sheet and the editor.
- [x] Edit (add an exercise through a finding's action) and return to updated bars, totals and findings; the week and scope are kept, the selection is not (follow-up above).
- [x] A zero-exposure region and an unmapped region are visibly distinct (resting tone vs hatch; render test).
- [x] The recorded pairs: on the five-day fixture Push → Pull and Pull → Legs share no muscle at the criterion and say so; the heavy-pair journey uses two sessions built from the same presses (`pair-compare-390.jpg`).
- [ ] The same sessions on different schedules: the plan has no schedules; not applicable.
- [x] Unscheduled plan order fabricates no recovery interval (no interval is shown; the section says so).
- [x] Direct / supporting arithmetic reproduces the source fixtures (`weekReview.test.ts` agreement tests).
- [x] The week's work-set total (53) differs from the attributed sum (shown only in the methodology note).
- [x] Partial prescriptions, unmapped exercises, "/ side" and "0 x 10" prescriptions: no silent loss or double counting (tests and the edge script).
- [x] 320, 375, 390, 430, desktop and enlarged text checked, whole page.
- [ ] A tester's unassisted run: not available in this session. Untested.
- [x] No regression in plans, workout history, discovery or Day review: the full suite passes (the five Supabase environment tests aside) and the Day review keeps its panels.

## Blockers and follow-ups

- Workflow agents (the adversarial review and the inventory synthesis) stopped on the session's usage limit; the inventory record and the review were done by hand (edge script, source re-read, browser journeys). An independent review is still worth running.
- Rest days, adjacent-week context, a sport-demands week view, pattern-keyed discovery, goal-relative pattern coverage, a preview of an edit's effect, and keeping the board's selection across an edit round trip: listed above, each needing a model or editor change outside this brief.
- Pre-existing and untouched: `splitAssignment.ts` excludes machine presses from Push and Upper because "machine" contains "chin"; 50 catalog exercises match no split; the two label vocabularies (`displayNames`, `muscleLabels`) still word the same key differently.
