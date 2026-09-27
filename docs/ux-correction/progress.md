# UX correction progress

Checklist: `docs/ux-correction/checklist.md` (copied unchanged from the brief of September 26, 2026).

Current phase: E/F — per-page completion, responsive, states, visual consistency
Current branch/worktree: `full-merge` locally, pushed to `main` and `claude/repo-access-il8zy5`
Running app / preview: `npx vite build` then `npx vite preview --port 4173 --strictPort`; audits in the session scratchpad drive it with headless Chromium (`/opt/pw-browsers/chromium`) — browser emulation, not a physical phone
Last verified build: see the latest commit on `main` (typecheck clean; vitest passes apart from the 5 pre-existing `server/supabase*` credential failures)

## Inventory (INV-01..12)

- Framework: React 18 + TypeScript + Vite client (`client/src`), Express + tRPC server (`server/`), Drizzle/MySQL for accounts, Supabase for reference data. One page component owns every workspace: `client/src/pages/Home.tsx` (`workspace` state, `navigateWorkspace`, `?workspace=` in the URL with `pushState`/`popstate`).
- Commands: `npx tsc --noEmit -p tsconfig.json`, `npx vitest run`, `npx vite build`, `npx vite preview --port 4173 --strictPort`.
- Shell (after Phase B): brand row `header.apex-topbar` = logo · wordmark · context line (a button to Profile titled "Edit training preferences") · Search · Profile (single-person icon, 44px). Local tabs (`WorkspaceTabs`) only where a destination has siblings, full width, no overlaid controls; none on Home or Profile. `main.apex-content.destination-*`; `SessionResumeBar` per the strip policy; `MobileBottomNav`. Main scroll is the window. `document.title` follows `workspaceTitles`.
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
  | Exercise overlay | state `inspectedExercise` | — | `.exercise-intelligence` in `Home.tsx`; its own history entry so Back closes it first |
- Record sources: workouts `client/src/lib/deviceWorkoutLog.ts`; typed lifts `client/src/lib/deviceStrengthObservations.ts`; workout-derived lifts `client/src/lib/workoutStrengthRecord.ts`; active session `client/src/lib/liveSession.ts`. **One selector:** `client/src/lib/athleteRecord.ts` (`summarizeAthleteRecord`, `useAthleteRecord`, `countCoveredRegions`) is what Home, Strength (region count) and Progress read. `directWorkspaceAccess = true`: the app runs on the device stores; tRPC account queries answer empty.
- Selected plan day: `activeDayIndex`/`activeDayLabel` in `Home.tsx`. Active session: the device session with `status: "active"`, its own `dayLabel` and its own copy of the exercises taken at start. Historical: completed device sessions.
- Add/favourite: `addExercise` (dedupes, toasts "Added to Week N · Day" with View workout and Undo), `toggleFavorite`.

## Completed sections

- Phase A — baseline captured with `scratchpad/baseline.mjs`: tabs covered at 390/360 (OBS-01), empty strip on Home/Profile (OBS-02), first-lift prompt above the live workout (OBS-03), Home 0 lifts vs Strength record (OBS-04, cause: Home read the account overview, Strength read device + workout stores), no editing label on Plan (OBS-05), resume strip covering the add destination (OBS-08), hero and strip both showing Resume on Home (OBS-09), profile prompt between heading and rows (OBS-10). OBS-06 (blank Workout area) did not reproduce: on entry, via tab from a scrolled page, and on resume the live card sat 14px under the head; a regression check stays in the journeys. OBS-07 did not reproduce: every destination and tab change lands at scroll 0.
- Phase B — shell rebuilt (`Home.tsx`, `WorkspaceTabs.tsx`, `index.css` "Shell" block). Evidence `scratchpad/shellprobe.mjs`: at 320/360/390 all four Train tabs and all Body Lab tabs visible, none covered or clipped; Search and Profile 44×44 in the brand row; no tab row on Home/Profile; titles per page; LOC-06 (active destination tap returns to top, keeps page) and LOC-07 (Back closes the overlay first, then history) pass; `?workspace=genome` lands on Exercises.
- Phase C — Home rebuilt (`TodayActionPanel.tsx`, Home blocks, `athleteRecord.ts` + tests). Evidence `scratchpad/homeprobe.mjs`: ordinary state leads with "Your next workout · Review workout / Edit plan" (CTA at 361px); live state leads with "Continue your workout · Resume Sport Transfer workout"; no first-lift prompt; three doors open Exercises / Movements / Strength at their headings; after finishing a workout and logging a lift, Home, Progress and Strength all read 1 lift · 1 workout, and it survives reload.
- Phase D — evidence `scratchpad/phased.mjs`: Plan shows "Editing Week 1 · Day 02 · Pull | Sport Transfer workout in progress · Resume" while another workout runs; the capacity note sits below the rows; Resume from the strip opens the actual session (Sport Transfer, set 2 of 4); the add destination strip clears the resume strip; the plus is named "Add X to Week 1 · Pull"; the toast reads "Added to Week 1 · Pull" with Undo and View workout; a second tap answers "Already in this workout"; View workout opens Pull holding the one addition; no strip on the tracker; on Home the strip is hidden while the hero's Resume is in view and appears once it scrolls away.

## In progress

- Phase E/F: per-page checks (MOV/MUS/CAT/EX/PLAN/REV/WORK/MATCH/PROG/STR/PROFILE), VIS, A11Y, STATE.

## Open blockers

- AUD-01 | the recording `ScreenRecording_09-26-2026 13-26-17_1.mp4` is not in the session uploads | cannot confirm timings or the exact taps | symptoms reproduced from the register's descriptions | attach it if a symptom cannot be reproduced

## Known regressions

- (none)

## Next concrete action

- Audit each page against §11 with `scratchpad/phasee.mjs`, fix what fails, then run journeys A–H and capture the evidence set.
