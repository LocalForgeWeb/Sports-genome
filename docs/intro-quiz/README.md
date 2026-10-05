# Intro quiz: "How is your [area] feeling?" (Oct 5 brief)

This is the question shown as step 6/14 in the Oct 4 screenshot, then headed "Anything going on there right now?".

The finished screen now makes three things clear:
- **Which area.** The question names it, and the side if one was chosen.
- **Which answer.** Six plain answers, none chosen in advance.
- **How to continue.** An orange Continue that stays on screen, with "Choose one option to continue" beside it until an answer is chosen.

## Before and after

| | Before | After |
|---|---|---|
| Phone 390 | `evidence/before/area-question-phone-390.png` (and `-full`) | `evidence/after/area-question-phone-390.png`, `-selected`, `-not-sure-full` |
| Desktop 1280 | `evidence/before/area-question-desktop-1280.png` (and `-full`) | `evidence/after/area-question-desktop-1280.png` |
| Other sizes | — | `phone-320`, `phone-375`, `phone-430`, `phone-390-large-text`, `laptop-short-1280x640`, `keyboard` |
| Other steps with the new action bar | — | `step-1-goal-phone-390.png`, `step-measurements-phone-390.png` |

**What the before shots show:**
- The heading was huge, with its second half dimmed.
- The defensive paragraph came before the choices.
- "Nothing right now" was preselected.
- On a phone, Continue sat below all six answers and the note: at 390 × 844 its top was at 760 px, near the bottom edge.
- The step opened part-way down, still at the previous step's scroll position.

## What changed, and where

**`client/src/lib/areaQuestion.ts` (new)**
- `areaQuestion()` writes the question in natural words for each of the 26 catalog targets:
  - "How is your left shoulder feeling?"
  - "How are your hamstrings feeling?" (both sides)
  - "How is your upper back feeling?" (catalog name: Thoracic spine)
  - "How does sprinting feel right now?"
  - "How does overhead reaching and throwing feel on your left side?"
- A target the catalog adds later falls back to its own name.
- With no area at all, it asks "How is the area you chose feeling?". It never prints an empty placeholder.
- `constraintChoices` holds the six answers. The quiz and the Profile card share them.

**`client/src/components/AthleteBaselineQuiz.tsx`**
- The question names the area, in one colour, with no "Right now" eyebrow.
- New copy: "Choose the closest match so we can understand what you want to work around." and "Select one".
- The answers are native radios in a `role="radiogroup"` labelled by the question and "Select one". The whole row is the target, and arrow keys move between answers.
- No answer is chosen until the person chooses one. Choosing doesn't advance; Continue does.
- Continue is disabled with "Choose one option to continue" beside it, in a live region, until an answer is chosen.
- Changing the area or its side on the previous step clears the answer, so an answer about a left knee is never carried over to a shoulder.
- Choosing "Feels fine" clears any ticked red flag. Before, a ticked flag stayed in state and was saved even after "Nothing right now".
- **Progress.** Reads "Step 6 of 14". While the branches are still open it shows a range, "Step 1 of 11–14", instead of a number that later changes. Segments that may not apply are drawn fainter. The range logic is in `quizStepRange()` and `quizProgressLabel()`.
- **All steps:**
  - Each new question opens at the top, with focus on its heading.
  - A quick double tap on Continue moves one step, not two: a pointer press arriving within 350 ms of a move is ignored, and keyboard presses are never held.
  - Back is a visible secondary button.

**`client/src/athlete-baseline-quiz.css`**
- **Heading.** `clamp(1.75rem, 3.4vw + 1.0625rem, 2.875rem)`: 28–34 px on phones, 46 px on desktop. It is in rem, so it scales with a larger text setting.
- **Answer rows.** Compact, with a 12 px gap and a radio mark on the left edge. The selected row gets an orange edge, a light tint and a filled mark, so selection doesn't rely on colour alone. Focus shows a visible ring.
- **Width.** The question uses a 720 px column, aligned with the copy and actions.
- **Action bar.** Back and Continue sit in a sticky bar at the bottom of every step:
  - In the page flow, so at the bottom of the page it rests below the last answer instead of covering it.
  - Scroll padding keeps focused answers clear of the bar.
  - The shell's `overflow-x: hidden` became `clip`; with `hidden` the bar couldn't stick.
- **Header.** The wordmark stays on one line, and the step count wraps beneath it rather than overlapping at 320 px.

**Answer wording.** The same answers are used in the Profile card (`client/src/components/CapacityFocusCard.tsx`, which also asks its question by name) and the training-day note (`client/src/components/DayCapacityNote.tsx`).

**"Not sure" is its own stored answer.**
- It is stored as `unsure` (`shared/resilienceContext.ts`).
- It is treated like any reported issue: the plan isn't adjusted automatically, and the same optional red-flag check follows.
- It is never read as "feels fine".
- The database check constraint was widened by `supabase/migrations/20261005_constraint_type_unsure.sql`, which has been applied to production. The table held 0 rows.

### Answer mapping (stored identifiers unchanged)

| Stored value | Before | Now | Description |
|---|---|---|---|
| `proactive_none` | Nothing right now | **Feels fine** | No current discomfort or limitation. |
| `symptomatic` | It bothers me at the moment | **Bothering me now** | I'm noticing discomfort or difficulty with some movements. |
| `recent_or_returning` | I am coming back from something there | **Returning after an issue** | I'm getting back to training after an injury or problem in this area. |
| `prior_recurrent` | It has been a recurring issue | **An issue that comes and goes** | It's not always present, but it has affected my training before. |
| `clinician_restricted` | A clinician has restricted what I do | **A clinician has limited what I can do** | A doctor or physio has told me to avoid or limit some movements. |
| `unsure` (new) | — | **Not sure** | I'm not sure how to classify it. |

Notes on the mapping:
- **"Time away".** The brief's suggested wording, "after an injury or time away", was narrowed to "an injury or problem in this area". This answer is about a specific area, not a holiday.
- **Clinician answer kept.** "A clinician has limited what I can do" isn't in the brief's table, but it is an existing stored answer with real behaviour: it withholds automatic progression. Dropping it would have lost that.
- **Removed promises.** "A proactive target", "Loading gets qualified, and your response gets watched", "Exposure gets rebuilt gradually" and "Repeat exposure gets kept an eye on" are gone. The app doesn't monitor responses or rebuild exposure.

### What the answer does

Traced through the code:
- The answer is saved with the area when the quiz finishes (`onComplete` → Home `capacityFocus` → Supabase `athlete_training_constraints` when signed in).
- It is shown on each training day by `DayCapacityNote`, which uses the posture the answer resolves to:
  - **Feels fine:** planned the ordinary way.
  - **Bothering me now, Returning after an issue, An issue that comes and goes, Not sure:** "This day is not adjusted for it automatically."
  - **Clinician limit, or any ticked red flag:** Sports Genome won't progress that area by itself.
- It changes nothing else, and no copy promises otherwise.
- The secondary note says the same: "Not a diagnosis. Your answer shows on your training days, and you can change it any time in Profile."

## Checks actually run

**Unit tests.**
- `npx vitest run`: 2931 passed. The 5 failures are the same `server/supabase*` tests that can't reach Supabase from this sandbox, before and after this change.
- `client/src/components/AthleteBaselineQuiz.areaQuestion.test.ts` is new (13 tests). In jsdom it covers:
  - the area and side named;
  - no answer chosen in advance;
  - the radio group's label;
  - Continue held, with the hint;
  - no auto-advance;
  - the answer kept through Back;
  - a changed area or side asked afresh;
  - "Not sure" saved as `unsure`;
  - a red flag dropped on "Feels fine";
  - the wording for each kind of target.
- Updated tests:
  - `AthleteBaselineQuiz.test.ts`: progress range, no preselection, choice-button count;
  - `CapacityFocusCard.test.ts` and `DayCapacityNote.test.ts`: the new wording.
- `npx tsc --noEmit` passes.

**Browser checks.** `probes/acceptance.mjs`: 24/24 pass, recorded in `evidence/acceptance.json`. It runs headless Chromium against the production build, with a target catalog shaped like production's. These are viewport emulations, not phones or people.

| Check | Result |
|---|---|
| A new athlete sees no answer chosen | pass |
| Area named: left shoulder, both calves and Achilles, overhead reaching and throwing on both sides | pass |
| Selecting from anywhere on the row; changing the answer; one at a time | pass |
| Continue disabled with "Choose one option to continue", then enabled; choosing doesn't advance | pass |
| Continue moves exactly one step, opening the next question at the top with focus on its heading | pass |
| A double tap on Continue moves one step | pass |
| Back keeps the answer | pass |
| A different area is asked afresh | pass |
| Not sure is followed by the optional red-flag check | pass |
| 320, 375, 390, 430 px: no sideways scroll, heading 28–34 px, Continue and Back on screen, every answer reachable (none covered by the bar), one column | pass |
| Desktop 1280 × 800 and short laptop 1280 × 640: heading 46 px, same checks | pass |
| 140% text: heading scales to 39 px, same checks | pass |
| Keyboard: Tab reaches the answers with a visible ring; Space and the arrow keys choose; Enter on Continue moves one step and focuses the next heading | pass |
| "Step 6 of 14" on the sport-and-area path; "Step 1 of 11–14" before the branches are known | pass |

**Other steps.** `probes/other-steps.mjs` spot-checks the first question and the measurements step with the new bar.

## Not tested, or remaining

- **Real devices.** No phone, screen reader or real text-size setting was used. Large text was emulated by enlarging the root font size.
- **Fonts.** The sandbox can't load Google Fonts, so screenshots show a fallback in place of Barlow Condensed and DM Sans. Barlow Condensed is narrower, so on a real device the heading takes fewer lines and the wordmark fits beside "Step 6 of 14" at 320 px.
- **Logo.** It appears as an orange square in the screenshots, because the asset host is unreachable from here.
- **Several areas.** The quiz allows one area to build, plus a side, so the several-areas case can't occur. The question names the one area, and "both sides" is asked in the plural.
- **Retry state.** The quiz keeps answers in memory and saves only when it finishes, so this step has no save to fail. Reloading mid-quiz still starts over; that hasn't changed.
- **Profile card default.** The Profile card still shows "Feels fine" as the starting value when an area is first chosen there; a select needs a value. That screen is outside this brief and is unchanged.
