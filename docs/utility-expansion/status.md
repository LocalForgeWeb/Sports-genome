# Utility expansion: status

The separate utility workstream (brief of 7 October 2026): Load the bar, My setup, Training
terms, plan blocks and saved preparation routines. One row per requirement, with its evidence,
the files that carry it and what it still depends on.

## How each row was verified

- **Local browser**: headless Chromium against the production build (`pnpm build`, served
  statically), signed out, the API answering empty. Each width was emulated, not a real phone:
  320 px, 390 px and 1280 px. The probes are at the end of this file; screenshots are in
  `screenshots/`.
- **Unit**: vitest, in `jsdom` where a component is rendered.
- **Live**: nothing here is verified live. This branch is not deployed, and no row claims live
  behaviour.

Status words: **done** (reachable in the app and its journey passed in the local browser),
**done (unit)** (logic only, no screen to reach), **partial** (what is missing is named),
**deferred** (the owner and the smallest interface needed are named), **n/a**.

## C: coordination

| ID | Status | Evidence |
|---|---|---|
| C01 | done | Started on `claude/training-day-navigation-workouts-83ro2c` at `68872fc` with a clean tree. The other workstream (Oct 7 product depth) works on its own branch and lands on `main`; its files at the time were Home, the logger, the finish/recap/history surfaces, rank suggestions, catalog media and Weekly Review (see its `docs/product-refinement-oct07/status.md`). |
| C02 | done | Read that brief's `status.md` and `report.md` before starting, then again after its later commits. Merged `main` twice instead of assuming files were free: `c1d14d8` (main at `5178e75`) and `9193291` (main at `b74c9d3`, which brought exercise history and the drill photographs). |
| C03 | done | Separate branch, never the other process's checkout. No stash, no reset, no force push. |
| C04 | done | Ownership map below. |
| C05 | done | One local stylesheet, `client/src/utility-tools.css`; every class is prefixed (`ut-`, `plt-`, `su-`, `ei-yours-`, `blk-`, `prep-`, `gl-`, `live-plates-link`). It uses the existing tokens and type scale (the repo's `typeScale.test.ts` passes). No change to global CSS, navigation, anatomy assets or the logo. |
| C06 | done | Every tool's rules are a pure module with its own tests (`plateLoading`, `setupNotebook`, `planBlocks`, `preparationRoutines`, `glossarySearch`), written before its sheet. |
| C07 | done | Nothing below is marked done until it was reached in the built app. |
| C08 | done | Entry points were wired after the merges; the other workstream's journeys were rerun on the merged build (I11). |
| C09 | done | Each conflict kept both sides (the merge commit message lists them). `carriedEntryFor` keeps this branch's seconds, distance and setting and main's "typed in the other unit". The logger's "Last set" line does both. The photo map and its manifest take the union of both sides. Nothing was resolved by taking a whole old file. |
| C10 | done | This file. |

### Ownership map

| Kind | Files |
|---|---|
| New, owned here | `client/src/lib/{plateLoading,setupNotebook,planBlocks,preparationRoutines,glossarySearch,trainingGlossary,trainingTerms,utilityStore,utilityTools}.ts`, `client/src/components/{PlateLoaderSheet,MySetupSheet,ExerciseYoursRow,PlanBlocksSheet,PreparationRoutinePanel,PreparationRoutinesSheet,TrainingTermsSheet,UtilitySheet,UtilityToolsHost}.tsx`, `client/src/utility-tools.css`, their tests, `docs/utility-expansion/` |
| Reused, unchanged | `save-to-plan.css` sheet classes and focus helpers, `deviceStorageScope` (account namespacing), `storedPrescription` (prescription reader), `preTrainingMobilityLibrary` and `getStackWarmup`, `drillPhotoSet` and `ExerciseMedia`, `LocalSearchScope` and `openUniversalSearch`, `copyText`, the planner's `editDay` and duplicate-entry rule |
| Shared, touched minimally | `Home.tsx` (host mount, account context, Blocks buttons, insertion with Undo, Training terms button, `tool:` and `term` search results); `DeviceWorkoutTracker.tsx` (Preparation panel before the warm-up; Load the bar under the weight field); `ExerciseGenomePanel.tsx` (one "Yours" row under "Your history"); `universalSearch.ts` (two tool destinations, one result type for terms); `UniversalSearch.tsx` (the "Term" badge) |
| Waits on the other workstream | Contextual glossary links on its screens (GL10); a setup recorded with logged sets (SN10) |

## §3 Load the bar

| ID | Status | Evidence |
|---|---|---|
| PL01 | done | No calculator existed: no plate math anywhere in `client/`, `server/` or `shared/`. `plateLoading.ts` imports nothing from the logger. |
| PL02 | done | Separate lb and kg inventories, an editable bar, and the field "Target total … bar included". |
| PL03 | done | Bar presets are only shortcuts (45/35/25/15 lb, 20/15/10 kg); any positive bar can be typed. `plateLoading.test.ts` "uses a custom bar". |
| PL04 | done | Counts are individual plates, and pairs are shown beside them ("4 plates · 2 pairs"). |
| PL05 | done | total = bar + 2 × one side, plus collars only when "Count collars" is ticked. |
| PL06 | done | Bounded search over pairs, so a single plate is never used. Test: "one plate of a size cannot be paired". |
| PL07 | done | Amounts are integer hundredths, divided by the plates' common factor; there is no float equality anywhere. Test: "adds small fractional plates exactly". |
| PL08 | done | Fewest plates first, then more of the larger plates; documented in `plateLoading.ts`. Test: the 165 lb fixture is 30 + 30, which a 45-first greedy fill never finds. |
| PL09 | done | Not exact: the nearest lower and higher loadable totals, each with its own loading. Past the inventory the sheet says how far the plates reach rather than inventing a load. Fixture: 182.5 gives 180 and 185. |
| PL10 | done | Inline messages for malformed, negative, non-finite or over-precise input. A target below the bar says so; one equal to the bar is the empty bar. |
| PL11 | done | Each unit keeps its own target draft, so switching never reads 185 lb as kg (component test "switches units"). |
| PL12 | done | Mixed lb/kg plates are not combined, and the sheet says so in "Available plates". |
| PL13 | done | `sg-plate-inventory-v1`, through `deviceStorageScope` (per account). |
| PL14 | done | "Copy loading instructions" copies the same text the screen shows. The sheet writes only its inventory: the probe found the plan, the workout log and the profile byte-identical after using it (`platesChangedOtherKeys: []`). |
| PL15 | done | Universal search ("Load the bar"), a barbell exercise's detail ("Yours" row) and the live logger's weight field. The logger link only opens the sheet and fills nothing. |
| PL16 | done | The text result is complete and comes from the same `PlateResult` the diagram draws; the diagram is `aria-hidden`. |
| PL17 | done (unit) | `plateLoading.test.ts`, 16 tests: every fixture in the brief, malformed input, inventory exhaustion, custom bars and fractional plates. |
| PL18 | done | Removing the 25s recomputes to 45 + 10 + 10 + 5 and keeps 185 in the field, in both the component test and the browser. |

## §4 My setup

| ID | Status | Evidence |
|---|---|---|
| SN01 | done | The existing notes have other meanings: a plan entry's `notes` are planned instructions, and a session note describes one workout. Neither is a reusable equipment setup, so this is a separate record. |
| SN02 | done | `SetupProfile`: `id`, `catalogExerciseId`, `label`, optional `location`, `settings[]`, optional `reminder`, `createdAt`/`updatedAt`, `archivedAt`. It is owned per account through the scoped key. |
| SN03 | done | Location is a typed label. No location permission is asked. |
| SN04 | done | Several setups per catalog id; the catalog is untouched. |
| SN05 | done | Create, edit, choose, duplicate, archive and restore. |
| SN06 | done | Setups are not part of the plan record, so the share snapshot (`shareSnapshot.ts`) cannot carry them. |
| SN07 | done | The whole form is one draft, so opening "+ Add where" or "+ Add a note", or adding and removing settings, keeps everything typed. Closing with typed text asks "Discard what you typed?"; closing without typed text does not ask. |
| SN08 | done | Nothing is chosen until the athlete taps "Use this" (`selectedSetup` returns explicit choices only). |
| SN09 | done | The sheet says "choosing one doesn't change your past workouts". No set is linked to a setup. |
| SN10 | deferred | No comparability schema was added. Owner: the logger (other workstream). Smallest interface: an optional `setupId` on a logged set that the logger writes and reads, with this notebook as its source. |
| SN11 | done | "My setup" and "My note" labels, kept apart from the catalog's instructions. The sheet says they "aren't checked by Sports Genome". |
| SN12 | done | Long text wraps (`overflow-wrap: anywhere`). The sheet has a saved/failed status line. No overflow and no undersized targets at 320 px. |
| SN13 | done | Unit tests cover two profiles, the same name on different exercises, archive and a corrupt store. Component tests cover account switching (athlete-2 doesn't see athlete-1's setup), reload and a failed save that keeps the draft. |
| SN14 | done | One "Yours" row in the canonical exercise detail, under main's "Your history". There is no second detail page. |

Browser journey (390 px and the other widths): School gym with Seat 4, Cable height low and a
note; save; duplicate as Home gym with Seat 6; choose School gym. The detail then reads "School
gym · Seat 4 · Cable height low".

## §5 Plan blocks

| ID | Status | Evidence |
|---|---|---|
| BL01 | done | `loadoutTemplates.ts` is a rule set for generating a day, not a saved selection, and sharing/import moves whole days between people. Neither saves part of a day to reuse, so there was nothing to extend. |
| BL02 | done | `PlanBlock` schema 1, defined before the UI: catalog id, a fallback name, the prescription as the planner stores it, and RPE, rest and notes. It has no completion, history, timestamps of training or session state. |
| BL03 | done | Save chooses entries in day order; the day is unchanged ("This day is unchanged.", test "leaves the day as it was"). |
| BL04 | done | A repeat inside a block is kept as its own entry. Insertion uses the planner's rule: an exercise already in the day is not added twice, and the preview says so. |
| BL05 | done | Name required. Rename, duplicate, archive/restore, and editing entries (reorder, remove, prescription) through `editBlockEntries`. |
| BL06 | done | The preview shows the week and day, the place (default "After the last exercise"), each entry's prescription and the count on the button. Insertion never replaces. |
| BL07 | done | Fresh ids for repeats, block order kept (test "inserts independent copies with new ids, in order"). |
| BL08 | done | The preview says "Adds independent copies…". |
| BL09 | done | A missing catalog id shows by its saved name and blocks Add until it is resolved or left out (unit test, and the browser: "Retired Grip Squeeze" gives "Left out: Retired Grip Squeeze", and the block keeps both entries). |
| BL10 | done | `validBlockPrescription` uses the planner's `storedPrescription`. Nothing is replaced with a default. |
| BL11 | done | One Undo removes only that insertion's entries (unit test; in the browser the Push day was byte-identical after insert + Undo). |
| BL12 | done | The preview reads the day live. The place is held as an entry id and resolved against the day at the moment of inserting; if that entry has gone, the block goes after the last entry and the status says so (test "keeps the chosen place when the day changes"). Insertion runs through `editDay` on the current record, so an edit made while the preview was open is kept. |
| BL13 | done | Insertion edits the plan only. When a workout for that day is running, the preview says "Your workout in progress isn't changed". |
| BL14 | done | Private and per account; no link, table or service. |
| BL15 | done | A compact list with the name, exercise count and a 3-entry preview. No undersized targets at 320 px. No block search (lists are short). |
| BL16 | done (unit) | Test "save → edit the source day → insert → edit the block: every copy keeps its own content". |
| BL17 | done | In the mounted planner (browser): insertion, Undo, a missing catalog reference, and a save failure ("Couldn't save on this device… What you entered is kept"; the name stays typed). A stale destination is covered by the unit test, because the open sheet is modal and the day cannot be edited behind it in the browser. |

## §6 Preparation routines

| ID | Status | Evidence |
|---|---|---|
| PR01 | done | Steps are drill ids from `preTrainingMobilityLibrary`. Names, cues and default doses come from the library; there is no second catalog. |
| PR02 | done | A step stores `drillId` plus the athlete's own `dose` and `note`. The library dose shows as "(library dose)" when none was set. |
| PR03 | done | Create from today's suggestion or from scratch, rename, reorder, add/remove, dose override, duplicate, archive/restore. |
| PR04 | done | "about N min, estimated", only when every step has a time: a library step uses the library's minutes, and an athlete's dose in reps hides the estimate (test "estimates duration only when every step supports it"). |
| PR05 | done | "Assign to {day}" stores `dayLabel → routineId`; the day's exercises are untouched ("Its exercises are unchanged."). |
| PR06 | done | "Use for today only" is kept apart from the assignment and clears with "Clear today's choice". |
| PR07 | done | Progress lives in `sg-prep-progress-v1`, apart from the workout log. In the browser the plan, workout log and profile were byte-identical after saving, assigning and ticking (`prepChangedOtherKeys: []`), so Weekly Review, ranks and PRs have nothing new to count. |
| PR08 | done | Drills carry no muscle volume here; nothing is inferred. |
| PR09 | done | Today's progress stores a snapshot of the routine; a later edit does not rewrite it (unit test). |
| PR10 | done | "Skip preparation today", with no scolding. Start stays available with no routine, a skipped one or a half-done one (`startStillAvailable: 1`). |
| PR11 | done | A drill's photographs open inline under its step, one at a time, the way the warm-up list shows them. Ticks and order stay put (browser: 2 of 6 done before and after opening photos). There is no full-screen player or timer. |
| PR12 | done | A drill missing from the library is shown by its saved name with "no longer in the library", never as another drill (unit test). |
| PR13 | done | Uses main's `drillPhotoSet` and `ExerciseMedia` exactly as they are. |
| PR14 | done | Unit tests cover the assigned routine, the today-only override, partial completion, skip and a later edit. The browser covers reload (2 of 6 ticked steps kept) and unchanged plan and workout records. |

## §7 Training terms

| ID | Status | Evidence |
|---|---|---|
| GL01 | done | There was no glossary. Help is "Guides & research" in About me, where Training terms now sits. Definitions live in one place: names and aliases in `trainingTerms.ts` (all search needs) and explanations in `trainingGlossary.ts` (loaded with the sheet). |
| GL02 | done | Each entry has a stable id, term, aliases, meaning, example, "In Sports Genome", and "Often read as" where useful. |
| GL03 | done | 31 entries cover every listed term, plus coverage points and rank. Warm-up set exists only partly (preparation drills, no warm-up set type), and the entry says so. |
| GL04 | done | Search order: exact name or alias, then prefix, then contains, then the explanation; ties keep group order. e1RM and estimated one-rep max, reps and repetitions all find their entries (tests). |
| GL05 | done | Every example starts "Example:", and any example with numbers is marked "(Illustrative…)" (test). |
| GL06 | done | Each "In Sports Genome" was written from the code, with file:line references kept per entry in `glossary-evidence.json`. Spot-checked against the code: 12-set cap, 1–15 rep window, rest options, goal defaults, the 6%/15% thresholds, rank bands, RPE 6–9 with default 7. |
| GL07 | partial | No entry makes an external scientific claim. The repo's only RPE/RIR source (a PMC page) could not be opened through this environment's network, so no sources are cited and none were invented. Before any entry claims how an effort scale is anchored, a reviewer should verify that source and add it to the entry's `sources`. |
| GL08 | done | The skipped-vs-not-recorded and unavailable-comparison entries say that missing is not zero. |
| GL09 | done | Every term is a universal search result ("Term"); choosing one opens the sheet at that entry. Closing returns to the page as it was (browser: RIR opened from search on About me, which was unchanged after closing). "All terms" goes back with the search kept and focus on the row. |
| GL10 | deferred | The standalone glossary is published. Contextual links wait for the other workstream's screens to settle (owner: that workstream). Smallest interface: `openUtility({ tool: "glossary", termId })`, which already works from any screen. |
| GL11 | done | Component tests: empty query, alias, no match, a direct link, an unknown id, and back with focus. Browser: the same, plus broadening ("Search the whole app instead" carries "deload" to the app's search, closes the sheet and focuses the search field). |
| GL12 | done | Short entries, no warning panels; the meaning is one sentence. |

Discrepancies found while checking definitions (recorded for their owners; no calculation was
changed here), with references in `glossary-evidence.json`:

- **D1:** muscle role labels differ between the exercise figure and the genome panel ("Supporting" vs "Stabilizer").
- **D2:** "coverage" names four different measures. Movement intelligence's Training coverage % counts secondary muscles, which the movement support tiers exclude.
- **D3:** "Working sets" in the recap counts every completed set, unlike Log a lift and the planner.
- **D4:** a comment calls the logged lift the heaviest set; the code picks the highest e1RM.
- **D5:** `evidenceTraceability.ts` lists RPE as a recorded observation, but the live tracker records none.
- **D6:** percentile rounding differs: the lift card rounds and rank text floors (19.6 shows as 20th and 19th).
- **D7:** Week Review says the 6/12-set landmarks have no recorded source and doesn't show them; the training day's Workload uses them.
- **D8:** holds and carries before catalog id 401 still log reps and can produce an e1RM.
- **D9:** Log a lift's optional details are said to help comparison; the progress line ignores them.
- **D10:** lifts carried over from workouts have no side recorded.
- **D11:** "week" is the calendar week on Home and plan week 1–3 in Review.
- **D12:** supporting work is weighted three different ways on the training-day analysis page.

## §8 Integration rules

| ID | Status | Evidence |
|---|---|---|
| I01 | done | `UtilitySheet` reuses the save-to-plan sheet's classes, Escape/Tab helpers and focus return. The search scope line is `LocalSearchScope`. No new tokens. |
| I02 | done | No horizontal overflow and no target under 44 px in any tool at 320, 390 and 1280 px, including every view of Blocks (list, insert, edit, save) and of the preparation sheet (editor, choose list). The scope line's link is 28 px tall with a 44 px hit area, by design in `index.css`. Inside the workout screen the light preparation panel restates its text colours, because the tracker paints every paragraph for a dark surface; they measure #102947 and #5d7186 on white. |
| I03 | done | Each tool has an empty state ("Save a group of exercises to reuse it in another day.", "Nothing saved yet", "No term matches…"), saved and failed states, and keeps the draft after a failed save (setups and blocks, tested). Sheets load lazily with no spinner. |
| I04 | done | Every record goes through `deviceStorageScope`. A component test shows another account doesn't see a setup. |
| I05 | done | No new service, provider, AI call, analytics or sync queue. |
| I06 | partial | There is no export/delete mechanism to join. The new private records are `sg-plate-inventory-v1`, `sg-setup-notebook-v1`, `sg-plan-blocks-v1`, `sg-prep-routines-v1` and `sg-prep-progress-v1`, each `::<accountId>` when signed in. Owner: account/reliability. Smallest interface: a list of per-account keys that an export would read and a delete would remove, these five included. |
| I07 | done | Setups, routines and blocks are outside the plan record, so sharing is unchanged. A block's notes are the plan entry's planned notes, never a setup. |
| I08 | done | Every record has a string id and a versioned store. Assignments and choices hold ids, so renaming changes nothing. |
| I09 | done | Calculating, copying, viewing and saving preferences create no workout (probe: other keys unchanged). |
| I10 | done | Nothing was added to Home's dashboard. Entry points: search, About me → Guides, the plan day's actions, the exercise detail, and the workout's prestart and set entry. |
| I11 | done | On the merged build: recap/history 85/85, swap/drop 44/44, rank 14/14, week-review journeys with no errors. Two probes have failures that are not this work's (see "Regression probes" below). |
| I12 | done | The deferrals above (SN10, GL10, I06, GL07) each name an owner and the smallest interface. |

## Regression probes (I11)

Run on the merged build (`9193291` plus this commit's changes) with `vite preview`:

| Probe | Result | Note |
|---|---|---|
| `docs/product-refinement-oct07/probes/recap-history.mjs` | 85/85 | finish, recap, history, Home's last workout, repeat |
| `docs/workout-swap-drop/probes/acceptance.mjs` | 44/44 | live logger, swap, drop sets, kg decimals |
| `docs/rank-suggestions/probes/rank-suggestions.mjs` | 14/14 | |
| Week-review journeys (Oct 5 brief) | no errors | selected week, finding → edit → updated week, Day scope, Home's link |
| `docs/exercise-media-audit/probes/media.mjs` | 19/20 | The failure expects Bulgarian Split Squat to show the placeholder. Main restored its photo in `b74c9d3` but did not update this probe, so it fails on main too. Owner: the other workstream. |
| `docs/ux-oct1/probes/oct1.mjs` | 26/34 | Seven failures are the known ones listed under O05 in the other workstream's status. The eighth, M9, expects "400 exercises"; the catalog has 450 since this branch's 50-exercise work. Stale count, not a utility regression. |

## Tests and checks

- `pnpm check` (tsc): passes.
- `npx vitest run`: 386 files and 3,197 tests pass (6 skipped). Of these, 64 tests in 7 files are this work's: plateLoading 16, setupNotebook 9, planBlocks 10, preparationRoutines 7, glossarySearch 7, utilityTools 2, UtilityTools (components) 13.
- `pnpm build`: passes.
- Browser probes (scratch scripts, not in the repo): the five tools at three widths, block edge cases, and broadening.

## Screenshots (`screenshots/`, local browser)

Plates: `plates-inexact-390`, `plates-inexact-desktop`, `plates-inventory-320`. My setup:
`setup-390`, `setup-desktop`. Blocks: `blocks-list-390`, `blocks-insert-390`,
`blocks-insert-desktop`, `blocks-missing-390`, `blocks-save-failed-390`. Preparation:
`prep-390`, `prep-photos-390`, `prep-reload-320`. Training terms: `terms-list-320`,
`terms-detail-390`, `terms-detail-desktop`, `terms-from-search-390`, `terms-scope-390`,
`terms-broadened-390`.
