# Exercise Intelligence and anatomy redesign — completion report (October 4)

The brief: make the Exercise Intelligence sheet say which exercise it is, what its profile means and what you can do, with the radar repaired rather than recoloured, and correct the anatomy map it and Body Lab share. No score was invented or recalculated. Every number on the sheet is the catalog model's (`client/src/lib/exerciseGenome.ts`), shown as it is or shown as unavailable.

## The new hierarchy

One dialog in four fixed parts. On a phone it is a full-height sheet. From 720px it is a centred dialog up to 920px wide, with 20px of page around it and the full dynamic viewport height.

1. **Header.** The exercise name is the title, full width, wrapping at full size. Above it, small, sit the logo and "Exercise intelligence". Below it is what the catalog records: equipment, movement and category. Close sits top right. Scrolled down, the header keeps only the name (smaller) and Close.
2. **Tabs.** Fingerprint, Muscle Genome, Mechanics and Context, now directly under the header. They used to sit halfway down the body, under two disclosures. They follow the ARIA tab pattern: one tab stop, arrow keys plus Home/End, the active tab underlined in orange. On a phone the row scrolls sideways with an edge fade, and the chosen tab is brought into view.
3. **One scrolling body.** Each tab, and each newly opened exercise, starts at its top.
   - **Fingerprint:**
     - *At a glance:* one sentence quoting the highest and lowest scores, then two labelled lines, *Workout fit* and *Movement link · {movement}*.
     - The start and finish photographs.
     - *Profile:* all eight scores as rows, with the radar as an overview.
     - *How this profile works* (method and evidence) at the foot.
   - **Muscle Genome:**
     - The anatomy, titled "Muscle roles · {exercise}".
     - Muscle-by-muscle rows.
     - Explore in Body Lab.
   - **Mechanics:**
     - How it moves.
     - Resistance profile.
     - Fatigue cost, as rows where higher means more cost.
     - Mechanics evidence scope.
   - **Context:**
     - The sport card. It was shown twice before; now it appears once.
     - Contextual fit with its grade and four signals.
     - What supports it / trade-offs.
     - The day's workout genome.
     - Catalog record (tier and its note).
     - Evidence context.
4. **Footer.** "Adding to **Week 1 · Push**" with *Change day*. Then the one orange action, *Add to workout*, and Favorite as the quiet square beside it. On a phone the destination is its own line; from 720px it is one row. The footer is a solid surface with a top hairline and the safe-area inset. Content never runs under it, because it is a grid row rather than an overlay.

### What the scores now say

- **The scale, once:** "Each score is out of 100 and compares this exercise with the others in the catalog. They are not percentages." The model clamps every fingerprint value to 0–100 (`logicCalibration.exerciseGenome.relativeScaleMinimum/Maximum`). No `%` anywhere.
- **Grouped by what higher means, each group saying it once:**
  - *Training potential* (hypertrophy, strength, power): "Higher means more potential."
  - *Demands* (stability, mobility, skill): "Higher means it asks more, not that it is better."
  - *Trade-offs* (stimulus-to-fatigue ratio, practicality): "more stimulus for the fatigue it costs, and easier to set up and run."
  - Each group follows its definition in `genomeTermInfo`.
- **One neutral bar colour for every magnitude** (#5FB3E4). Orange is only the Add button and the selected tab.
- **The radar's mislabelled axis.** It labelled the stimulus-to-fatigue ratio "Fatigue cost", but in the model a higher value is the *better* trade-off (`sfr = hypertrophy − fatigue × k + base`). The axis is now "Stimulus/fatigue", on two lines.
- **Unavailable is not zero.** A missing, non-numeric or out-of-range value shows "Not available" with a dashed empty track. The radar is not drawn (it says how many scores are missing), and the summary leaves that dimension out (`profileScore`).
- **No high/low thresholds.** The model documents none for the fingerprint, so the summary ranks and quotes ("Highest in strength expression (95) and stimulus-to-fatigue ratio (93); lowest in power expression (20).") and calls nothing high or low.
- **No overall score is computed.**

### The radar

- **Labels sit outside the outer ring, anchored by angle:** start on the right, end on the left, centred at top and bottom. The viewBox (336 × 264) is sized for the longest label at the 45° positions.
- **Restrained grid and shape.** Four octagonal rings at 25/50/75/100 with a slightly stronger outer edge, thin spokes, a 2px outline and an 18% fill.
- **Scale explained in words, not a colour ramp.** The low/high ramp is gone. The caption says "Distance from the centre is the score: 0 at the centre, 100 at the outer edge, rings every 25." The chart is `role="img"`, and its name lists all eight values.
- **Layout decided by the profile's own width (a container query, not the window).**
  - At 680px or wider: two columns, chart (sticky) beside all eight rows.
  - Narrower: the first four rows, then "Show all 8 dimensions — Also mobility demand, stimulus-to-fatigue ratio, technical skill demand and practicality", then "Show profile chart".
  - At the brief's ~800px viewport the profile is 710px wide, so it shows two columns.
  - At 768px the profile is 678px, so it shows one column. That is the brief's own rule; see Open items.
- **Fixed axis order** (hypertrophy, strength, power, stability, mobility, stimulus/fatigue, skill, practicality), so two exercises' shapes can be compared.

### Workout fit and movement link

- **Workout fit says what the model compared.**
  - With no other exercise in the destination day: "Nothing is in Week 1 · Push yet, so there is nothing to compare it with." It never says "without repeating the stack" when nothing was compared.
  - With other exercises, it uses the model's redundancy against its documented review line (`highRedundancyReview`, 62): "Adds a relatively distinct exposure next to the 6 other exercises in Week 1 · Push." or "Overlaps with the … : best as a replacement for something similar, or to fill a specific gap."
  - If the day already holds the exercise, it says so first.
  - It then adds one sentence on the goal: "For your goal, max strength, the profile reads strength expression: 95." That is the same dimension the model's goal alignment uses (`goalDimensionFor`, extracted without change).
  - Changing the destination day changes the comparison.
- **Movement link names the movement:** "No mapped link to Hand fighting in this catalog.", or the tier and the record's reason ("Movement-specific · Named in the Bridge movement record: hip thrust."). It links to the Context view.
- **The sport-transfer caveat appears once,** on the sport card.
- **The Demand / Potential / Expression pills are gone.** The group headings carry that meaning.

### Footer and behaviour

- **Add has no request behind it.** It is a local plan edit, synced later, so there is no pending state to show. Its states are:
  - **Success:** the existing toast, "Added to Week 1 · Pull" with Undo and View workout, then the sheet closes.
  - **Refused:** if the saved plan is still loading, the footer says "Your plan is still loading, so nothing was added. Try again in a moment.", the sheet stays open and the button becomes *Try again*. That case used to show a toast and close the sheet anyway.
  - **Already in the day:** the button reads "Already added", is `aria-disabled`, and the line reads "Already in Week 1 · Push". The app's existing policy refuses duplicates.
  - **No double add:** a second tap during the close no longer adds again, and no longer replaces the "Added" toast with "Already in this workout".
- **Change day** lists the week's days with their counts, and changes the destination without adding.
- **Modal for real.** While the sheet is open, the page behind it is inert and held at its scroll offset (`lib/modalBackground`, the same hold the Strength sheet uses). Tab wraps inside the sheet. Close, Escape and Back each restore the page's scroll and return focus to the control that opened the sheet.
- **One exercise per sheet.** The analysis is keyed by exercise, so an exercise opened over another (from search) brings nothing of the last one with it: no open tab, open disclosure or late answer.

### Anatomy (the sheet's Muscle Genome view, and Body Lab)

- **Front and Back are drawn in the figure, centred over each body.** `AnatomyFigure`'s new `captions` prop puts them above the drawing. They used to be HTML columns under a letterboxed drawing, which put the labels toward the outer edges. On a phone, the single body has a centred Front/Back switch above it. If the selected muscle isn't on the view being shown, a line says which view it is on.
- **Ground:** deep navy (#091C30, with a faint #0E2742 lift behind the bodies) in a rounded panel, in place of the saturated destination blue.
- **Boundaries and neutral tissue:** internal boundaries #71869B at 1.15px (were bright #A9B6C8 at 2px). A slightly lighter outer silhouette (#8799AD, 1.75px) is drawn on the body shell, so only its outside edge shows. Neutral tissue is #34495F. The thinner lines and silhouette are scoped to these two surfaces; the Strength rank map keeps its own.
- **Role colours (measured against the rank colours):**
  - Primary #FF783D.
  - Supporting #25BCC3.
  - Stabilizing is a pale champagne gold, **#FCE3A8**, in place of the fluorescent lime. **This deviates from the brief's #D8B65B,** which is ΔE00 **4.1** from the State rank's #DCAF3C, the same collision the September 28 brief removed. Every saturated gold falls within 15 of State. #FCE3A8 is 15.4 from State, at least 30 from every other rank, 31.5 from primary and 36.7 from supporting (`anatomyRoleColors.test.ts`).
  - No muscle was reclassified.
- **The legend is a list of swatch + word, at 14px.** It wraps to two columns under 520px. The entries are *Primary*, *Supporting*, *Stabilizing* (only where something can be stabilizing) and **No role recorded**. That last one was "Neutral", and the figure's own accessible names said "not involved".
- **In the exercise sheet, the roles are described as the catalog's**, not a "selected sporting action": "the muscles it lists as primary are drawn as primary…". The *Stabilizing* swatch is not offered there, because the catalog records no stabilizers.
- **Role colour is never the only cue.** The muscle rows say each role in words.
- **"Select a muscle"** is not shown in the sheet, where a tap only marks the figure. Body Lab, which has a selection inspector, keeps "Tap a muscle to see its role here."

## Before and after (same viewport, same exercise: Barbell Bench Press, Week 1 · Push, Hand fighting in view)

| | Before (eaf8d5f) | After |
| --- | --- | --- |
| Mobile 390 × 844, top | `evidence/before-top-390.png` | `evidence/after-top-390.png` |
| Mobile 390 × 844, profile | `evidence/before-fingerprint-390.png` | `evidence/after-fingerprint-390.png` |
| Wide 1024 × 768, profile | `evidence/before-fingerprint-1024.png` | `evidence/after-fingerprint-1024.png` |
| ~800 × 900 (the brief's screenshot width), profile | `evidence/before-fingerprint-800.png` | `evidence/after-fingerprint-800.png` |
| Wide 1024, "Fast read" → At a glance | `evidence/before-fastread-1024.png` | `evidence/after-top-1024.png` |
| Anatomy in the sheet, 390 and 1024 | `evidence/before-anatomy-390.png`, `-1024.png` | `evidence/after-anatomy-390.png`, `-1024.png` |
| Body Lab map, 390 and 1024 | `evidence/before-bodylab-390.png`, `-1024.png` | `evidence/after-bodylab-390.png`, `-1024.png`, `after-bodylab-captions-1024.png` |

Also: `after-mechanics-*`, `after-context-*`, `after-short-390x568.png`, `after-text125-320.png`.

## Checks performed

**Interactive, in headless Chromium** (`probes/acceptance.mjs`; results in `evidence/acceptance.json`). These are emulated viewports against `vite preview`, with no network: tRPC answers null, and the photographs are served from a curl cache of their pinned URLs. **56 of 56 pass.**

- **V1–V5, at 320, 375, 390, 430, 768, 800 and 1024px:**
  - No horizontal overflow on the page, sheet or body.
  - The name clear of Close; Close at least 44px and inside the viewport.
  - Add (at least 48px tall) and Favorite inside the viewport.
  - Rows aligned: no label or help icon reaching its value. Labels at 16px; tabs at least 44px tall.
  - The last content ends above the footer.
  - **All eight radar labels at rendered size:** inside the figure, outside the plotted octagon (corner and centre points tested against the polygon), no pair overlapping. They render at 13.5px from 375px up and 11.6px at 320px.
  - Two columns exactly where the profile is at least 680px wide.
- **V6, short heights and larger text:** 390 × 568, 1024 × 600, and 125% root text at 390 and 320. The body scrolls, Add and Close stay reachable, nothing sits under the footer, no sideways scroll.
- **V7, long names at 320px:** "Rope Face Pull with External Rotation", "Single-Arm Dumbbell Triceps Extension" and "Landmine Single-Leg Romanian Deadlift" wrap at full size (at least 26px), clear of Close and the tabs.
- **B1–B2, two exercises:**
  - Bench Press, then Romanian Deadlift: name, metadata, summary, all eight values and the painted anatomy all change, and the sheet reopens on Fingerprint.
  - Back Squat chosen from search over an open sheet replaces it entirely: one panel, its own values.
- **B3, movement context:** the movement link reads "No mapped link to Hand fighting in this catalog." with Hand fighting in view, and "Movement-specific … Bridge" with Bridge. No number in either.
- **B4–B5, disclosures, help and keyboard:**
  - All 8 rows, the chart, the method and a help card open and close.
  - Escape closes only the help card, and focus returns to its button.
  - Arrow keys move between tabs.
  - 60 presses of Tab never leave the sheet.
- **B6–B7, Add:**
  - Change day to Pull, then Add: the saved plan gains one entry in `1-Pull` and none in Push. The toast says "Added to Week 1 · Pull". A second tap adds nothing.
  - With `auth.me` held pending, so the plan cannot load: the refusal shows in the footer, the sheet stays, the button reads *Try again*. Released, the retry adds.
- **B8, Favorite:** pressed state persists across close, reopen and a page reload.
- **B9, every way out:** close by button, Escape and Back. While open, the page is `position: fixed` at its offset and inert, and a wheel over the sheet does not move it. After closing, scroll is restored to the pixel, focus is back on the row that opened the sheet, and nothing is left inert.
- **B10, the four views:** each still shows its content and opens at its top.
- **B11, anatomy in the sheet:** the Front/Back captions are within 6px of each body's centre and above it, the two bodies are the same height, the subject is named above, and the legend is 14px with "No role recorded".
- **B12, contrast on #091C30:**
  - Title, active tab and role rows: 15.5:1.
  - Metadata, inactive tabs and destination: 9.0:1.
  - Legend: 9.2:1.
  - Change day: 9.5:1.
  - White on the Add fill: 4.54:1.
- **B13, Body Lab at 390 and 1024:**
  - Boundaries #71869B at 1.15px, neutral #34495F, navy chart ground, stabilizing #FCE3A8.
  - Legend: Primary / Supporting / Stabilizing / No role recorded.
  - At 390: a two-column legend and a Front/Back switch. At 1024: names over both bodies.

**Unit tests** (vitest, jsdom and static render): 2843 pass. The 5 failures are the pre-existing `server/supabase*` tests that need credentials this sandbox does not have. New or rewritten tests check:

- The eight row values equal the model's for three exercises.
- Every label is printed once and has a named help control.
- The scale is stated once and there is no `%`.
- The groups say what higher means.
- `profileScore` rejects null, NaN, negatives, values over 100 and strings.
- The summary pattern, and that workout fit never claims a comparison it did not make.
- The goal-to-dimension mapping is unchanged.
- Tab semantics, plus arrow / Home / End movement.
- The radar's short labels, its text alternative, no ramp, four rings.
- The header name on every view; Change day without adding; an exercise already in the day cannot be added; the page is inert while the sheet is open.
- Captions inside the figure; the legend wording; neutral as "no role recorded".
- `tsc --noEmit` is clean and `vite build` succeeds.

**By code inspection only:**

- Safe-area padding (top on the header, bottom on the footer). No notched device was emulated.
- `prefers-reduced-motion` on the disclosure chevrons.
- Focus rings on every new control (`:focus-visible` outlines in the stylesheet). Focus movement itself was tested; the ring's look was not checked on screen.

**Not done:** no testing on a real phone or tablet, with a screen reader, or with any user.

## Open items and choices to review

- **Stabilizing colour:** #FCE3A8 instead of the brief's #D8B65B (see Anatomy above; the measurements are in the CSS comment). A saturated gold would be read as the State rank.
- **One column at 768px:** there the profile is 678px wide, 2px under the 680px two-column rule, so the radar is behind *Show profile chart*. The brief asked for the layout to follow the component's width, not the window's. Lowering the rule to about 660px would put two columns on most tablets, with a narrower rows column.
- **Radar labels at 320px** render at 11.6px, the app's readable floor. The chart is behind its toggle at that width, and the rows carry the full names and values.
- **Photos placement:** the start/finish photographs sit in the Fingerprint view, after At a glance and before the profile. They are not in the shared header, and not moved to Mechanics, where they would be a tap further away.
- **Screenshot fonts:** the sandbox cannot load Barlow Condensed, so the screenshots use a wider fallback face, and the logo is a stand-in square (the Supabase asset is unreachable from here). On a device, names are narrower than shown.
- **Exercises with no catalog profile:** an imported exercise the catalog does not hold is left out of the day comparison, because it has no profile to compare. Before, the model threw on one. Comparisons between catalog exercises are unchanged.
- **Unchanged model values:** the stimulus-to-fatigue value is the model's. Bench press shows 93, so "Highest in … stimulus-to-fatigue ratio (93)" is what the model says, not a display choice.

## Files

- `client/src/pages/Home.tsx`:
  - The sheet's header, tabs, body and footer.
  - `addExercise` returns its outcome.
  - The page-behind hold and the Tab wrap.
  - Scroll reset per view and per exercise.
  - The header's scrolled state.
  - Change day.
  - The Add states.
- `client/src/components/ExerciseGenomePanel.tsx`: rewritten views, rows, radar, At a glance, `profileScore` / `profileSummary` / `workoutFitSummary`. The term glossary is unchanged.
- `client/src/components/ExerciseAnalysisTabs.tsx` (new): the tab list, also used inside the panel when it stands alone.
- `client/src/exercise-intelligence.css` (new): the views' styles.
- `client/src/index.css`: the sheet shell, tab and footer rules. The old overlay and "genome on dark" repaints are removed.
- `client/src/surfaces.css`: retired repaints removed.
- `client/src/lib/exerciseGenome.ts`: `goalDimensionFor` extracted with no change to any value.
- `client/src/components/AnatomyMap.tsx`: `figureTitle`, the `exercise` role source, the legend as a list, Front/Back above the figure, the side note.
- `client/src/components/anatomy/AnatomyFigure.tsx`: the `captions` prop; neutral is "no role recorded".
- `client/src/components/anatomy/anatomy-figure.css`, `client/src/anatomy-clean.css`: the palette, boundaries, silhouette, navy ground and legend.
- Tests: `ExerciseGenomeFingerprintAccessibility`, `ExerciseGenomePanel` (+ `.termDialog`, `.gradeStamp`), `AnatomyMap` (+ `.wide`), `AnatomyFigure`, `Home.overlayExits`, `Home.movementDiscovery`, `Home.reviewMatches`, `surfaces.styles`, `phoneGutter.styles`, `anatomySubregions`.
- Probes: `docs/exercise-intelligence/probes/` (`shared.mjs`, `before.mjs`, `before-bodylab.mjs`, `look.mjs`, `acceptance.mjs`, `bodylab-captions.mjs`).
