# October 1 update — photo integration, Home anatomy, Body Lab correction

Delivered as code on `main` and `claude/repo-access-il8zy5`. Evidence is in `docs/ux-oct1/evidence/` (screenshots and `acceptance.json`), produced by `docs/ux-oct1/probes/oct1.mjs` in headless Chromium at 320, 375, 390 and 430 CSS px. Every check below was executed; nothing here is claimed from code inspection alone. No physical phone was used, and the sandbox browser has no outbound network, so photographs were fetched with curl from the pinned URLs and served to the page under those same URLs.

## 1. Root cause: Hand fighting → "Find pectoralis major exercises"

**Cause.** The Body Lab's primary button was a muscle search: it opened the catalog with `filters.muscle` set to the inspected muscle, or, with nothing inspected, to the *first* muscle the action's muscle resolver returned (`getMovementMuscles(referenceMovement)[0]`), which for Hand fighting is `chest`. The action itself never reached the catalog. Separately, the catalog measured its "action links" against the profile's selected action (`selectedMovement`), not the action Body Lab was showing, so a browsed action left the catalog still describing Bridge.

**Fix.** Two sessions corrected this in parallel. The discovery context that shipped is the one merged to `main` as #85 (`client/src/lib/exerciseDiscovery.ts`: movement by `sportId` + `movementId`, muscle by id, or all, carried in the address so Back, Forward and reload keep it; `client/src/lib/movementSupport.ts`: the movement's tiers from its own record). The Body Lab's primary action is "Find exercises for {Movement}", opening movement mode with the browsed sport and action ids (`openDiscovery({ mode: "movement", sportId: referenceMovement.sportId, movementId: referenceMovement.id })` in `client/src/pages/Home.tsx`); the line above it reads "Explore exercises that support this movement." A muscle tap opens the muscle's detail, which now carries its own "Browse {muscle} exercises" action into muscle mode (`AnatomyMap` `onBrowseMuscle`, added here), beside the secondary button #85 placed under the rows. A fresh movement entry starts with no refinements; each discovery keeps its own filters and page. Results are derived synchronously from the context's ids, so a change of action cannot be overtaken by an earlier action's result. Added here as well: the rows are headed "Muscle demands · {action}" so the action survives a scroll past its selector, and the list toggle says "View all 26 muscles on the map · 13 with no role recorded": 13 is the action's record, 26 is every region the figure draws. My own parallel implementation of the same context (`movementDiscovery.ts`) was dropped in favour of #85's at merge.

## 2. Changed code

- Discovery modes, tiers, address state and the catalog panel's modes: #85 on `main` (`exerciseDiscovery.ts`, `movementSupport.ts`, `CatalogDiscoveryPanel.tsx`, `Home.tsx`).
- `client/src/components/CatalogDiscoveryPanel.tsx`: the row's photograph through the one media component.
- `client/src/components/AnatomyMap.tsx`: `subjectLabel`, `onBrowseMuscle`, the counts toggle wording.
- `client/src/pages/Home.tsx`: the muscle map's subject label and in-detail browse action; detail media.
- `client/src/components/ExerciseMedia.tsx` + `client/src/exercise-media.css` (new): the one media component (replaces `ExercisePhotos.tsx`), thumb and detail variants.
- `client/src/lib/exercisePhotos.ts`, `client/src/data/exercisePhotos.json`, `scripts/exercise-photos/{curate,dimensions}.mjs`: media record with intrinsic size and focal point; 17 wrong-variation aliases rejected.
- `client/src/components/ExercisePrescriptionRow.tsx`, `DeviceWorkoutTracker.tsx`, `mobile-training-card.css`, `workout-planner.css`: thumbnails in plan rows, workout prestart rows and the full-session list; collapsed photos on the live set card.
- `client/src/components/anatomy/AnatomyFigure.tsx` + `anatomy-figure.css`: `compact` rendering variant. `TodayActionPanel.tsx`, `index.css`: Home hero column and figure.
- `catalog-discovery.css`: rows, tiers, reasons, the action link as wrapping text.
- Tests: `ExerciseMedia.test.ts`, `Home.bodyLabMuscleDetail.test.ts`; pins updated in the Home figure and media suites. #85's `Home.movementDiscovery.test.ts` and `CatalogDiscoveryPanel.modes.test.ts` cover the modes.

## 3. Selection criteria for movement results, and data gaps

For a sport action the catalog lists, in this order and never mixed (`movementSupport.ts`, #85):

1. **Movement-specific** — the exercise is named in the movement record (`recommendedExercises`), matched by name with a reviewed same-exercise synonym table and a not-the-same list.
2. **Related pattern** — the same catalog pattern as a movement-specific exercise, and it trains one of the record's prime movers as a primary muscle.
3. **Muscle support** — trains a prime mover but is not specific to the movement; a separate closed section, never counted as a match. A shared pectoralis alone never qualifies a bench press.

Every row says why it appears; "How matches work" states the method and the record's confidence and source count. Gaps: an action whose record names nothing the catalog spells the same way reports "no named matches" honestly and offers its muscles; no transfer score is shown or computed.

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

- **Two parallel corrections.** #85 landed on `main` with the discovery modes while this update was in progress; this update keeps #85's discovery and adds on top of it. The acceptance probe was re-run against the merged build.
- **Thumbnails are 3:2, not square.** The source photographs are 3:2 with the model centred; a square would centre-crop a third of every one, which §2 forbids. The frame follows the photograph; portrait frames are shown whole inside it. Per-image focal points are carried with the record for the day a different frame is wanted.
- **Home paints primary muscles only** and says so under the figure; supporting muscles are not drawn, matching the focus line.
- **Thumbnails fetch the source files**: the source publishes one size per photograph, so there is no smaller rendition to serve; the files are lazy-loaded and cached by the CDN.
- **Unresolved**: `env(safe-area-inset-*)` cannot be exercised in headless Chromium, so the status-area repair is verified structurally (sticky offsets and the fixed backdrop), not on an iPhone. No approved video exists, so no play affordance was added.
