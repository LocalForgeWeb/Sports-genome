# UX correction progress

Checklist: `docs/ux-correction/checklist.md` (copied unchanged from the brief of September 26, 2026; boxes and annotations added as items were verified).

Current phase: G — complete. Every checklist item is checked, blocked (AUD-01), N/A (USER-04) or partial (PROFILE-09, VIS-12) with a reason.
Current branch/worktree: `full-merge` locally, pushed to `main` (deploys to Vercel) and `claude/repo-access-il8zy5`
Running app / preview: `npx vite build` then `npx vite preview --port 4173 --strictPort`; the probes in `docs/ux-correction/probes/` drive it with headless Chromium — browser emulation, not a physical phone
Last verified build: the commit this file ships with — `npx tsc --noEmit -p tsconfig.json` clean; `npx vite build` clean; `npx vitest run` 1863 passed, 1 skipped, 5 failed (the pre-existing `server/supabase*` credential tests, identical on `main` before this work)
Deployment: pushed to `main`; the Vercel production deployment state at delivery is recorded in the final response

## Inventory (INV-01..12)

- Framework: React 18 + TypeScript + Vite client (`client/src`), Express + tRPC server (`server/`), Drizzle/MySQL for accounts, Supabase for reference data. One page component owns every workspace: `client/src/pages/Home.tsx` (`workspace` state, `navigateWorkspace`, `?workspace=` in the URL with `pushState`/`popstate`).
- Commands: `npx tsc --noEmit -p tsconfig.json`, `npx vitest run`, `npx vite build`, `npx vite preview --port 4173 --strictPort`.
- Shell: brand row `header.apex-topbar` = logo · wordmark · context line (a button to Profile titled "Edit training preferences") · Search · Profile (single-person icon, 44px). On phones the brand row scrolls with the page; the local tab row (`WorkspaceTabs`, only where a destination has siblings, full width, no overlaid controls) is the one pinned strip. `main.apex-content.destination-*`; `SessionResumeBar` per the strip policy; `MobileBottomNav`. Main scroll is the window. `document.title` follows `workspaceTitles`. At 1024px and up the brand row, tab row and content share one 68rem column.
- Route owners (workspace id → visible label → owner):
  | Destination | workspace | Label | Owner |
  | --- | --- | --- | --- |
  | Home | `command` | Home | `TodayActionPanel` + Home blocks in `Home.tsx` |
  | Body Lab | `movement` | Movements | `MovementAtlasPanel` |
  | Body Lab | `body` | Muscles | `BodyLabNavigator` + `AnatomyMap` |
  | Body Lab | `catalog` | Exercises | `CatalogDiscoveryPanel` + `AddDestinationStrip` |
  | (retired) | `genome` | — | redirects to `catalog`; the per-exercise analysis, evidence and the Body Lab handoff live in the exercise overlay |
  | Train | `day-plan` | Plan | Plan blocks in `Home.tsx` (`TrainingPlanHeader`, `ExercisePrescriptionRow`, `DayCapacityNote`…) |
  | Train | `review` | Review | Review blocks in `Home.tsx` |
  | Train | `tracker` | Workout | `DeviceWorkoutTracker` |
  | Train | `recommended` | Matches | Matches blocks in `Home.tsx` (`RecommendationRow`) |
  | Progress | `progress` | Progress | `ProgressOverviewPanel` |
  | Progress | `strength` | Strength | `StrengthGenomePanel` + `StrengthGenomeBodyMap` |
  | Profile | `profile` | (no tab row) | `AthleteAboutMePanel` |
  | Exercise overlay | state `inspectedExercise` | — | `.exercise-intelligence` in `Home.tsx`; its own history entry so Back closes it first; focus returns to the opener |
- Record sources: workouts `client/src/lib/deviceWorkoutLog.ts`; typed lifts `client/src/lib/deviceStrengthObservations.ts`; workout-derived lifts `client/src/lib/workoutStrengthRecord.ts`; active session `client/src/lib/liveSession.ts`. **One selector:** `client/src/lib/athleteRecord.ts` (`summarizeAthleteRecord`, `useAthleteRecord`, `countCoveredRegions`) is what Home, Strength (region count) and Progress read. `directWorkspaceAccess = true`: the app runs on the device stores; tRPC account queries answer empty.
- Selected plan day: `activeDayIndex`/`activeDayLabel` in `Home.tsx`. Active session: the device session with `status: "active"`, its own `dayLabel` and its own copy of the exercises taken at start. Historical: completed device sessions.
- Add/favourite: `addExercise` (dedupes, toasts "Added to Week N · Day" with View workout and Undo), `toggleFavorite`. Action inventory: `docs/ux-correction/actions.md`.

## Completed sections

- Phase A — baseline captured with `probes/baseline.mjs`: tabs covered at 390/360 (OBS-01), empty strip on Home/Profile (OBS-02), first-lift prompt above the live workout (OBS-03), Home 0 lifts vs Strength record (OBS-04, cause: Home read the account overview, Strength read device + workout stores), no editing label on Plan (OBS-05), resume strip covering the add destination (OBS-08), hero and strip both showing Resume on Home (OBS-09), profile prompt between heading and rows (OBS-10). OBS-06 (blank Workout area) did not reproduce: on entry, via tab from a scrolled page, and on resume the live card sat 14px under the head; a regression check stays in journey F. OBS-07 did not reproduce: every destination and tab change lands at scroll 0.
- Phase B — shell rebuilt (`Home.tsx`, `WorkspaceTabs.tsx`, `index.css` "Shell" block). Evidence `probes/shellprobe.mjs`: at 320/360/390 all four Train tabs and all Body Lab tabs visible, none covered or clipped; Search and Profile 44×44 in the brand row; no tab row on Home/Profile; titles per page; LOC-06 and LOC-07 pass; `?workspace=genome` lands on Exercises.
- Phase C — Home rebuilt (`TodayActionPanel.tsx`, Home blocks, `athleteRecord.ts` + tests). Evidence `probes/homeprobe.mjs`: ordinary state leads with "Your next workout · Review workout / Edit plan" (CTA at 361px); live state leads with "Continue your workout · Resume Sport Transfer workout"; no first-lift prompt; three doors open Exercises / Movements / Strength at their headings; after finishing a workout and logging a lift, Home, Progress and Strength all read 1 lift · 1 workout, and it survives reload.
- Phase D — evidence `probes/phased.mjs`: Plan shows "Editing Week 1 · Day 02 · Pull | Sport Transfer workout in progress · Resume" while another workout runs; the capacity note sits below the rows; Resume from the strip opens the actual session; the add destination strip clears the resume strip; the plus is named "Add X to Week 1 · Pull"; the toast reads "Added to Week 1 · Pull" with Undo and View workout; a second tap answers "Already in this workout"; View workout opens Pull holding the one addition; no strip on the tracker; on Home the strip is hidden while the hero's Resume is in view and appears once it scrolls away.
- Phase E — page audit `probes/phasee.mjs`. Aligned: Movements h1 "Movement explorer" + purpose line + "Explore involved muscles"; Muscles h1 "Muscle map"; Exercises h1 "Exercise catalog"; Matches h1 "Exercise matches" + purpose + "Change movement" + a lens line for score and tag; Plan/Review open the workout as "Open workout" or "Resume {day} workout"; Review names what it checks; Strength shows "Ranking your lifts…" while ranks load; local search broadens with "Search the whole app instead"; prescription rows say "Edit sets & reps".
- Phase F — width sweep `probes/phasef.mjs` at 320/360 (20px root)/390/430/1280: no horizontal scroll; no interactive target under 44px in the sampled controls; with the resume strip up, the last row on every page sits above it (the strip publishes its real height as `--sg-resume-height`).
- Phase G — journeys A–H `probes/phaseg.mjs`: 56 of 56 checks pass (`evidence/journeys-results.json`, `evidence/README.md`). Also `probes/extras.mjs`: no text run in the first viewport of seven screens below 4.5:1 (gradients judged at their worst stop) after lifting the subtle/faint tones, the link blue and the positive green and giving the active day tab white text; rapid tab switching leaves the last tab with its own heading, URL and content; 200% text at 360px keeps the selected tab and day in view with the page width at 360 on every destination except a 6px bleed on Plan noted under A11Y-03; one 68rem column on desktop. Fixed on the way: overlay focus restoration (J-H5), a refused device write of a lift now keeps the entry and says so (J-G5, `deviceStrengthObservations.test.ts`), the selected day tab scrolls into view, "Draft this session" carries Undo, the brand row scrolls away on phones (NAV-12). First-time-user walkthrough: `docs/ux-correction/walkthrough.md` (heuristic; human validation pending).

## Completion summary

| Workstream | Status | Evidence | Remaining issue |
| --- | --- | --- | --- |
| Shared header and tabs | VERIFIED | J-H1, `evidence/train-header-360.png`, `probes/shellprobe.mjs`, phasef | — |
| Location and scroll behavior | VERIFIED | J-A, J-E5, J-C3, J-H5, J-G4 | — |
| Home rebuild | VERIFIED | J-A1/A2, J-B7, `evidence/home-*.png`, `TodayActionPanel*.test.ts` | rest-day state not modelled (no weekday schedule in the plan) |
| Record consistency | VERIFIED | J-D1–D6, `athleteRecord.ts` + tests | — |
| Action labels and feedback | VERIFIED | `actions.md`, J-C4–C8, J-G5 | — |
| Add destination flow | VERIFIED | J-C1–C7, `evidence/catalog-*.png` | — |
| Workout/plan context separation | VERIFIED | J-B1–B7, `evidence/plan-with-active-workout.png` | — |
| Blank Workout investigation/fix | NOT REPRODUCED | J-F1/F2 on four entries (largest unpainted run 64px); Phase A | the recording that showed it was not supplied (AUD-01) |
| All page completion checks | VERIFIED | `probes/phasee.mjs`, §11 annotations | PROFILE-09 partial (a refused preferences write is not surfaced separately); VIS-12 partial (some superseded selectors remain under later overrides) |
| Responsive/accessibility/states | VERIFIED | phasef, extras, J-H, `evidence/*-360.png`, `desktop-1280-*.png` | 200% text: a 6px bleed on Plan at 360px; keyboard/screen-reader passes were scripted, not run with a screen reader |
| End-to-end journeys | VERIFIED | 56/56, `evidence/journeys-results.json`, `evidence/README.md` | human usability test not run (heuristic walkthrough only) |

## Open blockers

- AUD-01 | the recording `ScreenRecording_09-26-2026 13-26-17_1.mp4` is not in the session uploads | cannot confirm timings or the exact taps | every symptom reproduced or checked from the register's descriptions | attach it if a symptom is still seen on the deployed build

## Known regressions

- (none)

## Next concrete action

- None required for the brief. If the user sees any §2 symptom on the deployed build, attach the recording and re-run `probes/baseline.mjs` against it.
