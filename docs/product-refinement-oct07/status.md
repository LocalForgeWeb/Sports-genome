# Oct 7 brief — requirement status

**Starting point and environment**

- Branch `full-merge`, pushed to `main` and `claude/repo-access-il8zy5`.
- Starting commit `07d1e6e`; this pass is `8680303` and `8b75af5`, then the commit that adds this file.
- All browser checks ran in headless Chromium against `vite preview` of the production build, with viewport emulation only. No iPhone, no WebKit and no real user were involved.
- The sandbox cannot reach the ranking service or an account, so tRPC answers null in the probes.

**Statuses** follow the brief: verified, already satisfied, implementing, not started, blocked, not applicable.

**Evidence shorthand**

- *recap probe*: `probes/recap-history.mjs`, 71/71.
- *rank probe*: `docs/rank-suggestions/probes/rank-suggestions.mjs`, 14/14.
- *swap/drop probe*: `docs/workout-swap-drop/probes/acceptance.mjs`, rerun 44/44.
- *Oct 1 probe*: `docs/ux-oct1/probes/oct1.mjs`, rerun 27/34. The seven failures are listed under O05.
- *media probe*: `docs/exercise-media-audit/probes/media.mjs`, rerun 20/20.
- Logs of the reruns are in `evidence/rerun-*.txt`.

## A — Working agreement

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| A01 | verified | — | Read the brief, `docs/backend-v1/handoff.md`, and the earlier briefs' reports in `docs/` | — |
| A02 | verified | this file | Starting commit 07d1e6e; the working tree was clean apart from in-progress Oct 7 files | — |
| A03 | verified | this file | — | — |
| A04 | verified | this file | Every row has a status and evidence | — |
| A05 | verified | `report.md` §Mounted owners | Traced from `Home.tsx` workspaces to the rendered components | — |
| A06 | verified | `report.md` §Dormant code | Live truncation reproduced: Progress rendered `slice(0, 8)`. The legacy panels were confirmed unmounted | — |
| A07 | verified | 2 commits | Each increment shipped with its tests and a probe | — |
| A08 | verified | this file | Blocked items are named below | — |
| A09 | verified | — | Recap, history and suggestions extend the existing owners (tracker, Progress, Strength sheet). No new page or route | — |
| A10 | verified | `report.md` | — | — |

## N — Navigation and state

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| N01 | verified | `report.md` §Mounted owners | Inventory of the brief's table | — |
| N02 | verified (history) | `ProgressOverviewPanel.tsx`, `Home.tsx` | Recap probe: Back from a session returns to the same paged and filtered list with the opened row focused. Unit test in `ProgressOverviewPanel.history.test.ts` | Filters are kept in component state, not in the URL, so a full reload resets them to "all" |
| N03 | already satisfied | `TodayActionPanel.tsx` | Oct 1 probe H3 PASS: browsing another day and action leaves Home's next workout unchanged | — |
| N04 | already satisfied (plan) / verified (history) | session detail meta line | The recap shows day and date. Add actions show "Week N · Day" (earlier briefs) | — |
| N05 | implementing | recap, history, Home | New actions are named for their destination: "View in Progress", "See what's next", "View session", "Log this lift", "Back to Chest" | The rest of the app was not re-audited for "Open"/"Review" labels |
| N06 | verified | `WorkoutSessionDetail.tsx` | Recap probe: an unknown `?session=` shows "Workout not found" plus All workouts | — |
| N07 | already satisfied | `ConfirmDialog`, sheets | Earlier briefs' overlay tests (ConfirmDialog.test, Strength sheet tests) | Not re-tested this pass |
| N08 | already satisfied | — | Oct 1 probe L2 PASS: no edge handle; L3 PASS: last row reachable above the strip and dock | — |
| N09 | already satisfied | `Home.tsx` `replaceWithCanonicalAddress` | It now also drops a stray `session` param outside Progress | — |
| N10 | implementing | probes | Covered: completed session (recap probe), active session (swap/drop probe), filtered Body Lab result (Oct 1 probe M6) | A partially edited plan was not separately driven this pass |

## R — End of workout

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| R01 | verified | `DeviceWorkoutTracker.finish` | The saved screen renders only after `saveDeviceWorkoutSessions` succeeds; a refused save keeps the workout open (existing test). The header says "Saved on this device" | Account sync of lifts is separate and insert-only; the recap does not show the sync state of each lift |
| R02 | already satisfied | `finish()` | Re-reads storage and refuses a session already finished (prestart test "finished in another tab"). Recap probe: exactly one stored copy after reload | — |
| R03 | verified | `lib/sessionRecap.ts` | `sessionRecap.test.ts`: built from the stored record only | — |
| R04 | verified | `finalizeSession`, recap | Unit test plus recap probe: "2 of 3 planned sets · 1 not recorded"; Cable Fly listed as "not recorded"; skipped is counted separately | Records finished before Oct 7 carry no planned count unless they kept open sets |
| R05 | verified | recap rows | Swap/drop probe: "Switched to/from …" in the session detail; the earlier exercise keeps its own name | — |
| R06 | verified | recap | Unit test and probe: a drop set counts as one working set and shows its stages; lb·reps only inside the drop detail, with units | — |
| R07 | verified | recap | Probe: no calorie, effort, score or readiness text | — |
| R08 | verified | `elapsedText` | "Start to finish … min elapsed". Hidden when under 1 minute or over 24 hours | Pauses are not modelled |
| R09 | verified | recap summary | At most three numbers: exercises, working sets, elapsed | — |
| R10 | not applicable (deliberately omitted) | — | No PR badge is shown | Setup is never recorded, so eligibility cannot be verified (P04) |
| R11 | verified (device) | `withNote`, recap | Probe: the note survives a reload | Notes are not sent to the account and are not in any export |
| R12 | verified | `correctSet`, `removeSet`, `updateFinishedSession` | Unit tests plus probe: the edit is stored once and stamped "Corrected"; Progress, Strength and Home read the same record; unsent lifts are re-queued | Lifts already sent to the account stay as sent (insert-only table). The app says so when it happens |
| R13 | verified | `requestFinishEarly` | Probe: "Finish now?" in place; Keep going returns to set 3 with drafts intact. Tests updated | — |
| R14 | verified | recap probe | Reload shows the one finished session; Home's Last workout opens it | — |

## H — History

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| H01 | verified (bug fixed) | `ProgressOverviewPanel.tsx` | Was `slice(0, 8)` with no way on. Now pages of 10, "Show N more", then "That's every workout: N." Probe reaches the oldest of 14; unit test reaches the oldest of 23 | — |
| H02 | verified | toolbar | Exercise (by catalog identity) and date filters, a count "x of y", Clear filters. Unit test plus probe | The exercise filter matches device records only; account rows carry counts only, and the list says so |
| H03 | verified | `?session=` | Probe: opened from a row, survives reload, Back returns | — |
| H04 | verified | — | Separate empty and no-match states; filters reset only via Clear filters. Unit test | — |
| H05 | verified (unit) | — | Account read failure keeps device rows and offers Try again. Unit test | Not driven in a browser (no account in the sandbox) |
| H06 | already satisfied | — | Device sessions are never uploaded as sessions (only lifts are), so device and account rows cannot duplicate | — |
| H07 | implementing | `lastCompletedSetFor` | The logger's "Last logged" now matches by catalog ID; unit test | No per-exercise history screen was added. Strength's record sheet remains the exercise history |
| H08 | already satisfied | `setWeightUnit`, `performedSetLine` | Sets show in their recorded unit (Oct 6 work) | — |
| H09 | verified | — | Opening a past session reads the stored record; nothing is copied into the live logger | — |
| H10 | not started | — | — | Repeat workout was not built this pass |
| H11 | verified | `historyExerciseKey`, `strengthSeriesKey` | Unit tests: same name with different IDs stays separate | — |
| H12 | already satisfied | — | Sessions keep the exercise name; a missing catalog entry shows the placeholder frame, and the session is never removed | No "no longer in the catalog" label was added |

## P — Progress comparisons

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| P01 | verified | `progressiveTraining.ts`, `progressComparisonFixtures.test.ts` | Traced: `getWeeklyProgressReview` → ProgressionReviewPanel → WorkoutExecutionPanel, which nothing renders. Home's approval listeners were retired. A test fails if a live file renders, imports or calls them | The dormant files remain in the repo |
| P02 | verified | `strengthSeriesKey` | Catalog ID, else an unambiguous name → ID; a shared name stays name-only. Fixture tests | Typed lifts carry no catalog ID, so a shared name such as "Romanian Deadlift" stays its own legacy series |
| P03 | implementing | series key | Laterality and added-load (bodyweight + weight) split series | Assistance, per-hand vs total load and ROM are not recorded on typed lifts |
| P04 | already satisfied | Progress copy | "Estimated change"; no "same setup" claim | — |
| P05 | already satisfied | `@shared/oneRepMaxEstimation` | One estimator with a valid rep range; out-of-range sets are excluded and counted | — |
| P06 | implementing | — | Reps-only lifts have no load and are excluded from e1RM trends | No separate reps, timed or distance series exist |
| P07 | verified | fixtures | A drop set is read by its first stage; skipped and draft sets never reach the record | — |
| P08 | not applicable | — | No actual-effort field exists; the comparison has no effort input (fixture) | — |
| P09 | not applicable | — | No effort field was added | — |
| P10 | not applicable | — | — | — |
| P11 | verified | fixtures | No pooled figure; curl and deadlift weeks stay separate series | — |
| P12 | already satisfied | Progress | Counts of logs per trend, plus a count of excluded sets | — |
| P13 | verified | fixtures | Comparisons carry first and latest dates | Progress shows the first-log date, not "last week" |
| P14 | already satisfied | Progress | Trends are text rows, not charts | — |
| P15 | not applicable | — | No chart in the live Progress | — |
| P16 | already satisfied | Progress, Strength | "est. 1RM" change vs percentile vs muscle rank are labelled separately | — |
| P17 | verified | — | No live path changes a plan from a trend (P01, Q01) | — |
| P18 | already satisfied | Progress empty copy | "Log the same lift again…" | — |

## S — Rank suggestions

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| S01 | verified | snapshot metadata plus test | Database names for all 244 IDs hash to the same md5 as the app catalog (`7ecabf4b…`). The database links 330 catalog IDs; the app has 400 | — |
| S02 | verified | `rankableExercises.json` | schemaVersion 2, scorer name, resolution map, scored count, names digest. A schema mismatch reads as an empty table | — |
| S03 | verified | `rankable-exercises.mjs` | Unit test plus a real run. Unknown `norm_resolution`, bad weight, duplicate, nameless and stabilizer-only rows are rejected. First run found 3 null-weight stabilizer mappings (Inverted Row family): a warning, since stabilizers are dropped anyway | — |
| S04 | implementing | suggestions | Copy says "can give", and states that a group, a set and reps are needed | Per-entry prerequisites are not pre-checked before logging |
| S05 | verified | `blocked` prop | Distinct copy for service failure and offline. No group / no curve keep the existing gate. Unit test | "Pending sync" is not distinguished from offline |
| S06 | verified | Equipment select | Rank probe plus unit test; an empty result offers "Show any equipment"; the profile is not changed | Not pre-filtered from the profile's equipment |
| S07 | verified | none-state copy | "That says nothing about how much it matters" | — |
| S08 | verified | `familiarRankingLiftId`, `excludeIds` | Unit test (Romanian Deadlift 42 vs 186) | — |
| S09 | verified | "How lifts are compared" | Unit test | — |
| S10 | already satisfied | Strength `onLogLift` | Rank probe: the exact exercise is chosen and focus is on the load box | — |
| S11 | verified | `logOriginRegionRef` | Rank probe: after saving, the toast offers "Back to Chest" and it reopens Chest | The rank itself could not be shown arriving (no service in the sandbox) |
| S12 | already satisfied | — | Ranking gates nothing else | — |

## Q — Recommendation actions

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| Q01 | verified | `report.md` §Recommendation actions | Live: Weekly Review "Edit <day>", "Inspect", "Find exercises for …", "Add a workout" (navigation only), plus the rank "Log this lift". The note-appending "approve" actions were dormant; their Home listeners were removed | — |
| Q02–Q11 | not applicable | — | No live action saves a note or changes a prescription from a recommendation | Applies if the legacy path is ever rebuilt |
| Q12 | already satisfied | Progress | A failed percentile request keeps the trends ("Try again") | — |

## D — Discovery

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| D01–D03, D07 | already satisfied | Body Lab, catalog | Oct 1 probe M1–M9 PASS today: Hand fighting stays the scope, a muscle is an explicit mode, zero matches keep the action | — |
| D04 | already satisfied | catalog rows | M3: named tier and reasons | — |
| D05 | not started | — | — | Search ordering was not re-audited |
| D06 | already satisfied (earlier brief) | catalog filters | — | Not re-tested this pass |
| D08 | not started | — | — | — |
| D09 | already satisfied | add destination strip | M7 PASS | — |
| D10 | not started | — | — | — |
| D11 | already satisfied | — | M6 PASS: open and return keep the scope and position | — |
| D12 | not applicable | — | No new exercises this pass | — |

## M — Media

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| M01–M05, M08, M11, M12 | already satisfied (Oct 6) | `ExerciseMedia`, `docs/exercise-media-audit` | Media probe 20/20 rerun; Oct 1 P2–P10 and P12 PASS | — |
| M06 | already satisfied | — | alt "…, start position" | — |
| M07 | already satisfied | — | No autoplay in lists (Oct 1 P10) | — |
| M09, M10 | not started | — | — | — |

## O — Home

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| O01, O02, O03, O04, O06, O07 | already satisfied | `TodayActionPanel` | Earlier briefs' render tests; Oct 1 H3 and H5 PASS. A live session puts Resume first | — |
| O05 | already satisfied (superseded check) | supplied day artwork (#87, Oct 3) | Screenshot from the rerun was viewed (the regenerated file was not committed) | Oct 1 probe H1×4, H2 and H4 fail because they target the schematic figure that #87 replaced. P11 fails because thumbnails are app files since Oct 6, so blocking the CDN no longer fails them; the media probe covers failed images instead |
| O08 | verified | `home-last-session` | Unit test plus recap probe: opens that exact session, placed under the week and never above Resume | — |
| O09 | already satisfied | — | The insight shows only with a qualifying change | — |
| O10, O11 | already satisfied | — | Earlier briefs' layout probes | Not re-measured |
| O12 | implementing | `useDeviceRecordStores` | Code: every save fires `deviceWorkoutHistoryEvent`, which Home's record store listens to; the recap probe opens the corrected record from Home | No browser check of Home's counts after a correction, swap or set removal |

## W — Weekly Review

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| W01–W07, W09, W10 | not started (this pass) | `weekReview/` | Earlier briefs' work stands | Not audited this pass |
| W08 | already satisfied | WeekReviewBoard | "Edit <day>" opens that day | Return-to-review was not re-checked |

## U — Polish

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| U01–U03 | implementing | new surfaces | One surface with row dividers; 44px controls; tokens only (CSS tests) | — |
| U06 | verified (new surfaces) | — | Probes measure ≥44px on the new buttons | — |
| U10 | verified | recap corrections | Inline persistent errors; toasts only for reversible success | — |
| U11 | verified (new surfaces) | — | Heading focus on open; Keep going returns focus; dialog focus via ConfirmDialog | — |
| U12 | verified | — | `prefers-reduced-motion` on the chevron rotation | — |
| U13 | implementing | — | 320, 390 and 1280 px in the probes | 430 px and enlarged text were not run for the new surfaces |
| U14 | blocked | — | — | No iOS or WebKit device available; everything is Chromium emulation |
| U04, U05, U07–U09 | not started (this pass) | — | — | — |

## F — Performance and recovery

| ID | Status | Where | Evidence | Remaining limitation |
|---|---|---|---|---|
| F01 | not started | — | — | No before/after timing this pass |
| F02, F05 | already satisfied | — | Set entry is local; a rank failure does not touch records | — |
| F03 | verified (small) | — | Home no longer imports the dormant WorkoutExecutionPanel module | Bundle size was not measured |
| F04 | implementing | history, suggestions | Distinct empty, no-match, error and offline copy | — |
| F06 | verified | recap edit | Invalid reps are refused inline and the draft is kept | — |
| F07–F09 | not started | — | — | — |
| F10 | implementing | — | New fields (`note`, `notPerformed`, `plannedSets`, `skippedSets`, `correctedAt`) are optional and survive storage round-trips (probe reload) | Not added to any export format |

## J — Acceptance journeys

| ID | Status | Evidence | Remaining limitation |
|---|---|---|---|
| J01 | already satisfied | Oct 1 H3 and H5; Home screenshot | — |
| J02, J03 | not started (this pass) | — | — |
| J04, J05 | verified | Swap/drop probe 44/44 | — |
| J06 | verified | Recap probe | — |
| J07 | verified | Recap probe: correction stored; Home's entry opens the corrected record | — |
| J08, J09 | already satisfied | Oct 1 probe M1–M9 | — |
| J10 | already satisfied | Oct 1 M7 | — |
| J11 | verified | Rank probe: Machine filter | — |
| J12, J13 | blocked | — | The ranking service is unreachable from the sandbox. The UI states were unit-tested |
| J14 | verified | Fixture tests | — |
| J15, J16 | verified | Recap probe | — |
| J17 | not started | — | Repeat workout (H10) |
| J18 | implementing | 320 px, failed images (media probe) | Keyboard-open, slow and offline runs were not done for the new screens |

## Z — Report

| ID | Status | Evidence |
|---|---|---|
| Z01 | verified | This table: every unverified item says why |
| Z02 | verified | Live screens changed: tracker, Progress, Strength sheet, Home. Dormant code is marked, not presented |
| Z03 | verified | No new pages, stores or routes |
| Z04 | verified | Logo and records untouched |
| Z05 | verified | `progressComparisonFixtures.test.ts`, `sessionRecap.test.ts` |
| Z06 | verified | Unit tests plus three probes |
| Z07 | implementing | See U13 |
| Z08 | verified | Copy reviewed in the report |
| Z09 | verified | tsc clean; vitest 3066 passed, 6 skipped; build OK |
| Z10 | verified | `report.md` |
