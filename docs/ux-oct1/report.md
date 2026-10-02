# October 1 update — photo integration, Home anatomy, Body Lab correction

Delivered as code on `main` and `claude/repo-access-il8zy5`. Evidence is in `docs/ux-oct1/evidence/` (screenshots and `acceptance.json`), produced by `docs/ux-oct1/probes/oct1.mjs` in headless Chromium at 320, 375, 390 and 430 CSS px. Every check below was executed; nothing here is claimed from code inspection alone. No physical phone was used, and the sandbox browser has no outbound network, so photographs were fetched with curl from the pinned URLs and served to the page under those same URLs.

## 1. Root cause: Hand fighting → "Find pectoralis major exercises"

**Cause.** The Body Lab's primary button was a muscle search: it opened the catalog with `filters.muscle` set to the inspected muscle, or, with nothing inspected, to the *first* muscle the action's muscle resolver returned (`getMovementMuscles(referenceMovement)[0]`), which for Hand fighting is `chest`. The action itself never reached the catalog. Separately, the catalog measured its "action links" against the profile's selected action (`selectedMovement`), not the action Body Lab was showing, so a browsed action left the catalog still describing Bridge.

**Fix.** Discovery has its own context, kept apart from the inspected muscle and the add destination (`client/src/lib/movementDiscovery.ts`, `DiscoveryContext`: movement by `sportId` + `movementId`, muscle by id, or all). The Body Lab's primary action is now "Find exercises for {action}", opening movement mode with the browsed sport and action ids (`openMovementDiscovery(browseSportId, referenceMovement.id)` in `client/src/pages/Home.tsx`); the instruction above it reads "Explore exercises that support {action}". A muscle tap opens the muscle's detail, which carries its own "Browse {muscle} exercises" action into muscle mode (`AnatomyMap` `onBrowseMuscle`). Entering movement mode clears an inherited muscle filter and keeps the equipment refinement. Results are derived synchronously from the context's ids (`useMemo` keyed on the context), so a change of action cannot be overtaken by an earlier action's result. The rows are headed "Muscle demands · {action}" so the action survives a scroll past its selector, and the list toggle now says "View all 26 muscles on the map · 13 with no role recorded": 13 is the action's record, 26 is every region the figure draws.

## 2. Changed code

- `client/src/lib/movementDiscovery.ts` (new): context type, `discoverMovementExercises`, `movementResultSet`, the contiguous-phrase name matcher.
- `client/src/components/CatalogDiscoveryPanel.tsx`: movement, muscle and all modes; scope heading, counts, tiers, reasons, explicit "All exercises" tab, unmapped notice, muscle-only disclosure; recomposed rows.
- `client/src/components/AnatomyMap.tsx`: `subjectLabel`, `onBrowseMuscle`, the counts toggle wording.
- `client/src/pages/Home.tsx`: `discovery` state, `openMovementDiscovery` / `openMuscleDiscovery`, the Body Lab CTA, catalog props, detail media.
- `client/src/components/ExerciseMedia.tsx` + `client/src/exercise-media.css` (new): the one media component (replaces `ExercisePhotos.tsx`), thumb and detail variants.
- `client/src/lib/exercisePhotos.ts`, `client/src/data/exercisePhotos.json`, `scripts/exercise-photos/{curate,dimensions}.mjs`: media record with intrinsic size and focal point; 17 wrong-variation aliases rejected.
- `client/src/components/ExercisePrescriptionRow.tsx`, `DeviceWorkoutTracker.tsx`, `mobile-training-card.css`, `workout-planner.css`: thumbnails in plan rows, workout prestart rows and the full-session list; collapsed photos on the live set card.
- `client/src/components/anatomy/AnatomyFigure.tsx` + `anatomy-figure.css`: `compact` rendering variant. `TodayActionPanel.tsx`, `index.css`: Home hero column and figure.
- `catalog-discovery.css`: rows, tiers, reasons, the action link as wrapping text.
- Tests: `movementDiscovery.test.ts`, `CatalogDiscoveryPanel.discovery.test.ts`, `ExerciseMedia.test.ts`, `Home.bodyLabDiscovery.test.ts`; pins updated in six existing suites.

## 3. Selection criteria for movement results, and data gaps

For a sport action the catalog lists, in this order and never mixed:

1. **Named in its movement record** — the enriched record's `recommendedExercises` phrases, matched as consecutive words of the exercise name with a small alias table ("cable row" → Seated Cable Row, not Cable Upright Row; "farmer carry" → Farmer's Walk). Reason: `Named in the hand fighting record as "cable row".`
2. **Train the demands its record describes** — the exercise trains at least one movement signal the sport profile's body actions describe (the same `getMovementSignals` / `exerciseMatchesSignal` the Matches ranking uses). Reason: `Trains its pulling, grip demand · works latissimus dorsi, deltoids.`
3. **Share a muscle only** — listed as exactly that, behind one line, with "Not a movement match." A shared pectoralis alone never qualifies a bench press.

For Hand fighting: 25 named, 154 demand, 109 muscle-only; the default set is 179; no bench press is in it. Gaps: the demand tier is deliberately broad (a conditioning signal from "repeated" admits battle ropes); the named tier depends on how the record phrases its exercises, so an action whose record names nothing the catalog spells the same way has an empty first tier. An action the library has no record or profile for gets an explicit "No movement mapping" notice with its muscles offered, never the catalog listed as matches. No transfer score is shown or computed.

## 4. Screenshots (all 390 px unless named)

| State | File |
| --- | --- |
| Home | `after-home-390.png`, also 320, 375, 430 and `after-home-390-zoom.png` (125% text) |
| Catalog with photos | `after-catalog-photos-390.png`, `after-catalog-photos-320.png`, `after-catalog-photos-failed-390.png`, `after-catalog-search-focus-320.png` |
| Workout with photos | `after-plan-photos-390.png`, `after-workout-prestart-photos-390.png`, `after-workout-live-photos-390.png` |
| Exercise detail | `after-detail-photos-390.png` |
| Hand fighting muscle demands and CTA | `after-bodylab-handfighting-demands-390.png`, `after-bodylab-handfighting-cta-390.png` |
| Hand fighting exercise results | `after-catalog-handfighting-results-390.png` |
| Explicit muscle-mode results | `after-catalog-muscle-mode-390.png` |

## 5. Acceptance checks executed

34 of 34 pass (`acceptance.json`). Profile action for the run: Bridge, so an inherited context had every chance to leak.

**Movement** — M1 CTA names Hand fighting with nothing selected; M2 inspecting pectoralis major leaves the CTA on Hand fighting and offers "Browse pectoralis major exercises"; M3 results head "Wrestling · exercises for / Hand fighting", named tier first with reasons, no muscle chip, no Bridge text; M3b no bench press in the set, push-ups and rows present; M4 muscle mode from the muscle's detail with a visible muscle heading; M5 Bridge then Hand fighting again, nothing of Bridge remains; M6 open an exercise and return, scope and scroll position persist; M7 adding a result changes the chosen day and Home's next workout is unchanged; M8 zero matches keeps the action and offers Clear search / Browse all; M9 All exercises is an explicit mode with its own count. Rapid change while loading: not applicable, results are synchronous and derived from the ids (no asynchronous path exists).

**Photos and workout** — P1 thumbnails 88×59, 10 px radius, inset with the content, on-screen rows loaded and off-screen rows left to lazy loading; P2 Barbell Bench Press and Incline Barbell Bench Press carry distinct media; P3 one add control and the heart at 44×44 with named targets, the tag reads "Tag A", View details visible; P4 favorite never opens the row; P5 cable flies, machines and single-arm exercises recorded by name (and the 17 wrong-variation aliases withdrawn after review); P6 detail shows start and finish at the photo's own shape with the credit and the technique boundary; P7 plan rows carry a 72 px thumbnail with the name and prescription at full width; P8 reorder controls still work; P9 workout prestart rows carry the same thumbnail; P10 live card: photos collapsed by default, opening and closing keeps the typed set values and the exercise; P11 failed media gives same-size placeholder frames, no broken icon, rows in place; P12 slow media moves no text when the photographs arrive.

**Home and layout** — H1 at 320/375/390/430: compact figure 120 wide and 176 tall in its column (stacked under the copy at 320), caption "Primary muscles", CTA full width below, no overflow, week chips never clipped; H2 painted regions are the next workout's primary muscles (the Push day's six exercises are listed in the record); H3 browsing another plan day and another sport action leaves Home unchanged; H4 125% text keeps the figure legible and the CTA intact; H5 no plan shows no map and the plan-building CTA; L1 scrolled catalog keeps the header at the top edge with the fixed status backdrop (env insets are 0 in this browser, so the safe-area check is structural); L2 no app element draws a narrow fixed handle at the left edge — the grey handle in the screenshots is not this app's UI and was left alone; L3 the last row's add control and "Browse more" are reachable above the destination strip and the dock; L4 320 px moves the actions below the identity with the name at full width.

## 6. Decisions worth knowing

- **Thumbnails are 3:2, not square.** The source photographs are 3:2 with the model centred; a square would centre-crop a third of every one, which §2 forbids. The frame follows the photograph; portrait frames are shown whole inside it. Per-image focal points are carried with the record for the day a different frame is wanted.
- **Home paints primary muscles only** and says so under the figure; supporting muscles are not drawn, matching the focus line.
- **Thumbnails fetch the source files**: the source publishes one size per photograph, so there is no smaller rendition to serve; the files are lazy-loaded and cached by the CDN.
- **Unresolved**: `env(safe-area-inset-*)` cannot be exercised in headless Chromium, so the status-area repair is verified structurally (sticky offsets and the fixed backdrop), not on an iPhone. No approved video exists, so no play affordance was added.
