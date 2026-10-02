# Product polish — progress record

Brief: `docs/ux-polish/brief.md` (annotated item by item). Earlier core corrections: `docs/ux-correction/` (complete before this pass began).

Branch: `full-merge` locally, pushed to `main` (Vercel) and `claude/repo-access-il8zy5`. Build: the commit this file ships with — typecheck clean, `npx vite build` clean, `npx vitest run` 1868 passed / 1 skipped / 5 failed (the pre-existing `server/supabase*` credential tests). All checks below ran in headless Chromium against the built app: emulation, not a physical phone.

## What is noticeably better

- **Finding an exercise.** The catalog says what its number means ("400 exercises", "62 of 400 exercises", "3 favorites"), drops the duplicate "N matches" under the field, and shows the scope line only once there is a query to broaden. A search with no results offers the nearest real names ("Try “Romanian Deadlift”") and names the filter to remove ("Remove the Arms & grip filter") instead of only saying nothing matched. A **Recently viewed** row (device-local, eight ids, Clear) brings back exercises opened before, and disappears the moment a query or filter is in play.
- **Logging on a phone.** The live card says what is next ("Next · Split-Stance Cable Chest Press"). A value carried from the last set reads as an offer (muted, italic) until the athlete touches it; logging stays an explicit tap. The load field's keyboard moves to reps with Next. Finishing reports the sets kept and left out and offers **View record**, which opens Progress.
- **Taking things back.** Moving an exercise in the plan reports "Moved X earlier · Now 2 of 6 in Sport Transfer" with **Undo**; loading a Smart Draft has Undo; adding already had it.
- **Getting from a gap to an action.** A Strength region with nothing on record offers "Log a lift for shoulders", which closes the sheet and focuses the lift log.
- **Feel.** Every content button acknowledges a press in one motion token and settles at once under reduced motion; numbers line up (tabular numerals) in timers, set counts and metrics; a screen still arriving shows a skeleton in place of a sentence; paragraphs keep a 75ch reading width on desktop; the Search control shows ⌘K where a keyboard exists.
- **Words.** The workout screen says Workout, Preparation and Full workout instead of Session.

## Round two (after the first report)

- **Compare two exercises** (11B): a quiet "Compare with another exercise" line in the exercise overlay marks the first; opening a second and choosing "Compare with {first}" opens one sheet with 18 aligned rows (equipment, movement, category, muscles, qualities, stance, chain, resistance bias, the eight model dimensions as N / 100, evidence). A value a record lacks reads "Not available"; nothing is ranked. Two Add buttons use the destination contract; Escape or Close returns to the catalog with its rows. The wait is visible on the catalog ("Comparing X · open another exercise · Cancel").
- **One rest for the day** (11C): after changing an exercise's rest, the row offers "Use 120 sec for the other 6 exercises in this day"; the message lists the exercises and carries Undo, which restores every setting exactly; verified after reload.
- **One front/back control**: Muscle map and Strength now share the same pressed-tab control; Strength's selected region row and Muscle map's selected row share the orange inset bar.
- **Sign-in expiry** (STATE-10): an UNAUTHORIZED answer shows one notice, is not retried, and the device record stays.
- **Words**: Session → Workout everywhere it meant a workout (planner, review, planning guide, Progress, About me "Workout length"); counts agree with their nouns (`lib/plural.ts`).
- **Rows**: catalog rows name the equipment when the exercise name does not ("Horizontal push · Machine").
- **Rest tick**: the Full workout list is memoised on the session; five seconds of rest ticking touched the DOM 35 times instead of 635.
- **Audits**: gutters 12px on every page, icons in three sizes by role, no procedure requested twice per navigation, state kept across a 390 → 1280 → 390 resize, a 137.5 lb set stored exactly, one sheet entrance on the motion tokens.

## Performance (`probes/perf.mjs`, median of three, same fixture)

| Measure | Before | After |
| --- | --- | --- |
| Cold first launch → Home action visible | 2397 ms | 2385 ms (held by the 1.58 s intro sequence in `main.tsx`, by design; unchanged) |
| Warm (returning) launch → Home action | — | 850 ms |
| JS transferred on first paint | 507 KB | 483 KB (tracker, profile, progress, day picker and quiz now load with their screens) |
| CSS transferred | 92 KB | 87 KB |
| Catalog query "press" → list updated | 80 ms | 72 ms |
| Anatomy row selection → selected | 23 ms | 22 ms |
| Log set → set counted | 14 ms | 14 ms |

Interactions were already fast; the measurable change is 24 KB less JavaScript before the first screen. No image over 100 KB exists in `client/public`; nothing was resized. No continuous animation runs; the skeleton pulse stops under reduced motion.

## Packet status

| Packet | Status | Implemented change | Evidence | Remaining dependency |
| --- | --- | --- | --- | --- |
| Earlier core corrections | Complete | — | `docs/ux-correction/` | AUD-01 recording still not supplied |
| Visual composition | Done | tabular numerals; duplicate catalog count and scope line; skeleton; one front/back control; equipment subtitles | `after/*.png`, `probes/layoutaudit.mjs` | — |
| Interaction response | Done | pressed/disabled states on one token; reduced motion; Undo on reorder, draft and day-wide rest; one sheet entrance; stable Save width | `probes/polish-qa.mjs`, `polish-qa2.mjs` | — |
| Exercise discovery | Done | count copy; suggestions and filter-specific removal; recently viewed | `polish-qa.mjs` FIND-06/08, EXTRA-A | variant subtitles not added |
| Workout ergonomics | Done | next-exercise cue; carried values marked; enterKeyHint; finish → View record | `polish-qa.mjs` LIFT-01/09/17; J-F | carry does not distinguish unilateral/machine semantics (LIFT-11) |
| Scientific visuals | Done | one selection treatment; sides from one key list; values 0–100 with "Not available" for gaps | `compare-qa.mjs`, code review | — |
| Connected journeys | Done | region → Log a lift; finish → record; ⌘K hint | `polish-qa.mjs` | — |
| Secondary states | Done | skeleton; empty-result and favorites actions; region empty action; blocked image, slow server and sign-in expiry checked | `polish-qa2.mjs`, `compare-qa.mjs` | — |
| Responsive layout | Done | 75ch reading width; landscape logging; desktop Muscle map two columns; state across a breakpoint | `after/desktop-1280-*.png`, `polish-qa2.mjs`, `reqaudit.mjs` | — |
| Measured performance | Done | five panels lazy; rest tick memoised (635 → 35 mutations / 5 s); no duplicate requests | table above, `tickcost.mjs`, `reqaudit.mjs` | intro hold is by design |
| Qualified enhancements | All four done | recently viewed; ⌘K hint; compare sheet; day-wide rest with Undo | `polish-qa.mjs`, `compare-qa.mjs` | — |
| Copy/trust pass | Done | Session → Workout across six components; plural agreement at every counted site; source labels only with a source | `compare-qa.mjs`, grep audit | — |
| Verification/delivery | Done | journeys A–H 56/56 re-run; before/after sets; this record | `../ux-correction/evidence/journeys-results.json`, `before/`, `after/` | — |

## Changed paths

`client/src/components/ExerciseCompareSheet.tsx` (new), `ExercisePrescriptionRow.tsx`, `AnatomyMap.tsx`, `SessionDraftPanel.tsx`, `WorkoutHealthPanel.tsx`, `ProgrammingGuidePanel.tsx`, `AthleteAboutMePanel.tsx`, `client/src/main.tsx`, `client/src/lib/plural.ts` (new), `client/src/components/CatalogDiscoveryPanel.tsx`, `DeviceWorkoutTracker.tsx`, `StrengthGenomePanel.tsx`, `UniversalSearch.tsx`, `client/src/pages/Home.tsx`, `client/src/lib/recentExercises.ts` (+ test), `client/src/index.css` (polish block), `client/src/catalog-discovery.css`, tests updated: `CatalogDiscoveryPanel.traceability`, `DeviceWorkoutTracker.prestart`, `Home.mobileNavigation`.

## Next action

None for this brief. The walkthrough correction brief that followed (docs/ux-walkthrough/) is the next assignment.
