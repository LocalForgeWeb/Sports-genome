# Next update — visual finish and a stronger Home: implementation record

Brief: `docs/ux-next/brief.md` (annotated item by item). Basis: the six surfaces the brief names. The six screenshots and the companion Home concept were not attached to the brief as received; each surface was reproduced in the built app at the brief's described state and the visible issues matched the brief's findings (see `evidence/before-*`).

Branch: `full-merge` locally, pushed to `main` (Vercel) and `claude/repo-access-il8zy5`. Build: typecheck clean, `npx vite build` clean, `npx vitest run` 2037 passed / 1 skipped / 5 failed after merging main's Backend V1 batches (the pre-existing `server/supabase*` credential tests, unchanged). All screenshots are headless Chromium at 390×844 and 320×844 (2×), plus 390 with the root font size at 125% for large text. No physical device.

## Layout versus state

| Surface | Layout fixed | State/data behaviour fixed |
|---|---|---|
| Review recovery spacing | dark surface; rows on separators; values named per session ("Push 4.5 / Pull 7 sets"); no warning icons | wording says "adjacent planned sessions" (the plan has no dates); "Open {day}" opens that day in the plan |
| Plan exercise rows | index secondary; name has the width; prescription parts unbreakable; edit action on its own line on phones | Reorder is a mode for the list (`Reorder` / `Done reordering`); arrows only in that mode; first/last disabled states kept |
| Upper coverage | close as one pill; empty state under the header, left-aligned | empty state names the day and offers "Add exercises", which closes the analysis and opens the picker bound to the same day; the analysis recomputes from the plan when reopened |
| Strength Genome | dark desaturated body, thin dark seams, receding hands/feet/joints, softer no-data hatch | no colour, threshold or score change |
| Muscle volume | rows: name and total on one line, breakdown under, shared-scale bar, status as dot + word; "Show 4 more muscles"; squeezed preview hidden on phones | total re-labelled as attributed sets with the double-counting explained; ".0" dropped; band criteria stated in the disclosure |
| Home | two-column hero (title 2/3, schematic 1/3), full-width primary action, chip strip for the week | action contract by state; week strip and the completed state read the same saved sessions the weekly count reads |

## Colour tokens

Rank tokens are unchanged (`--sg-rank-*-color`, `shared/capabilityRank.ts`), and the badges are untouched. The rank fills were already the full-opacity tokens; what changed is the compositing around them: the figure's light-surface defaults (pale shell, pale neutral muscles, 2px mid-grey linework) are replaced in rank encoding and on the Strength chart by `--anatomy-shell #2c3a4f`, `--anatomy-muscle #33425a`, `--anatomy-line #0a182b` at 1.1px, the keyline on ranked regions goes from 1.25 to 1px, and the not-scored pattern uses a thinner stroke (1.5 of 16 units) on `--sg-rank-unavailable-fill #283446` / `-hatch #4b5a6e`. The legend's not-scored swatch follows.

## Home visual and data

The schematic is the **workout-emphasis body**, not equipment: `AnatomyFigure` in a non-interactive picture mode, coloured from the selected day's exercises' `primaryMuscles` through the same `roleMapForLists` the atlas uses, drawn in the action orange (`--anatomy-primary-1/2` overridden under `.home-focus`), never rank colours, and captioned "Workout focus". It hides when the day names no muscles and during a live workout. The week strip has one chip per plan day in plan order; a chip is *completed* when a saved session for that day label finished since Monday (the same `startOfTrainingWeek` scope as "N of M completed"), *under way* when it is the live session, *next* when it is the selected day, otherwise *planned* (dashed). Chips open that day in the plan.

Primary action contract as implemented:

| State | Label | Behaviour |
|---|---|---|
| Live session | Resume {day} workout | tracker, restores progress |
| Selected day staged, not completed this week | Open next workout | tracker prestart; nothing starts |
| Selected day already completed this week | View workout summary (secondary: Open {day} again) | Progress |
| Plan has days, selected day empty | Open training plan | plan |
| No plan, after hydration | Build your first workout | plan |
| Explicit rest day | not modelled in the plan; no change | — |

## Changed files

`RecoverySpacingPanel.tsx`, `recovery-spacing.css` (rewritten); `ProgrammingGuidePanel.tsx`, `WorkoutHealthPanel.tsx` (summaries); `ExercisePrescriptionRow.tsx` (no-break spaces inside parts), `mobile-training-card.css`, `workout-planner.css` (Reorder mode, Review summaries, volume map); `StackAnalysisPage.tsx`, `RateStackPanel.tsx`, `DayExercisePicker.tsx`, `stack-analysis.css` (empty state, header, add action); `capability-rank.css`, `anatomy/AnatomyFigure.tsx` (dark foundation, hatch, picture mode); `WeeklyMuscleVolumePanel.tsx` (rewritten); `TodayActionPanel.tsx`, `pages/Home.tsx`, `index.css`, `lib/athleteRecord.ts` (`completedDayLabelsThisWeek`) (Home); tests: `TodayActionPanel.week.render.test.ts` (new), `TodayActionPanel.test.ts`, `TodayActionPanel.render.test.ts` (labels).

## Verification

- Unit: full suite above; the new `TodayActionPanel.week.render.test.ts` covers strip states from saved sessions (not from order), the completed-state action, last week's session excluded, and the picture-mode schematic.
- Probes (`probes/next-shots.mjs`): before/after of every surface at 390 and 320, and after at 125% text. Earlier journeys A–E (`docs/ux-walkthrough/probes/walk-journeys.mjs`, updated for the new Home label) and the 56-journey regression were re-run on this build: 18/18 and 56/56 (the regression probe now measures the reorder arrows in Reorder mode).
- Not exercised: a real device; the account (signed-in) path for the week strip uses the same code with account sessions but was not run against a live service.

## Remaining

1. The strip's *completed* marks come from `useAthleteRecord`'s new `completedDayLabelsThisWeek`, the same sessions and week as its count (a finished session with nothing logged is not a workout, per Backend V1); a session completed on another device shows once it syncs.
2. Explicit rest days are not a plan concept, so the contract's rest-day row has no implementation.
3. The Strength figure's no-data hatch is softened, not removed; removing it would leave no-data indistinguishable from a dark neutral region.
