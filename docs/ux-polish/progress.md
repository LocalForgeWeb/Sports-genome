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
| Visual composition | Partial | tabular numerals; duplicate catalog count and scope line; skeleton | `after/*.png`, `probes/polish-qa.mjs` | spacing/gutter/icon audit not done; two front/back controls remain (Muscle map vs Strength) |
| Interaction response | Done | pressed/disabled states on one token; reduced motion; Undo on reorder and draft | `probes/polish-qa.mjs`, `polish-qa2.mjs` | sheet motion left as is |
| Exercise discovery | Done | count copy; suggestions and filter-specific removal; recently viewed | `polish-qa.mjs` FIND-06/08, EXTRA-A | variant subtitles not added |
| Workout ergonomics | Done | next-exercise cue; carried values marked; enterKeyHint; finish → View record | `polish-qa.mjs` LIFT-01/09/17; J-F | carry does not distinguish unilateral/machine semantics (LIFT-11) |
| Scientific visuals | Already satisfied, not extended | — | before set, correction-pass acceptance | selection treatment not unified; axes/values not re-verified |
| Connected journeys | Done | region → Log a lift; finish → record; ⌘K hint | `polish-qa.mjs` | — |
| Secondary states | Done | skeleton; empty-result and favorites actions; region empty action; blocked image and slow server checked | `polish-qa2.mjs` | sign-in expiry not exercised |
| Responsive layout | Done | 75ch reading width; landscape logging verified; desktop Muscle map two columns confirmed | `after/desktop-1280-*.png`, `polish-qa2.mjs` | breakpoint crossing not tested |
| Measured performance | Done | five panels lazy | table above | intro hold is by design |
| Qualified enhancements | A and D done; B and C evaluated, not built | recently viewed; ⌘K hint | `polish-qa.mjs` | compare sheet and plan quick edit: prerequisites hold, scope reserved |
| Copy/trust pass | Partial | tracker wording; count copy | — | no app-wide label/plural/date audit |
| Verification/delivery | Done | journeys A–H 56/56 re-run; before/after sets; this record | `../ux-correction/evidence/journeys-results.json`, `before/`, `after/` | — |

## Changed paths

`client/src/components/CatalogDiscoveryPanel.tsx`, `DeviceWorkoutTracker.tsx`, `StrengthGenomePanel.tsx`, `UniversalSearch.tsx`, `client/src/pages/Home.tsx`, `client/src/lib/recentExercises.ts` (+ test), `client/src/index.css` (polish block), `client/src/catalog-discovery.css`, tests updated: `CatalogDiscoveryPanel.traceability`, `DeviceWorkoutTracker.prestart`, `Home.mobileNavigation`.

## Next action

If the compare sheet (11B) or the plan quick edit (11C) is wanted, both prerequisites hold; each is a bounded component on existing data. Otherwise: an app-wide copy audit (COPY-01/04/07) and a spacing pass (VIS-03/04) are the open polish items.
