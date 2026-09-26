# Acceptance matrix — Sports Genome redesign (handoff §12)

Filled from runtime evidence, not from the source. Every screenshot in
`docs/design-handoff/screenshots/` was captured from the production build
(`npx vite build` → `npx vite preview`) in headless Chromium at 390pt, with
the profile seeded (wrestling, max strength, 5 days, 75 minutes, a drafted
Day 05), three device-logged lifts, one completed device workout and the
muscle-rank service stubbed so the Strength map can be shown in rank mode.
Supabase and tRPC network calls were stubbed; the flows below run on the
device stores the app uses when no account is available.

Verdicts: **PASS** — verified at runtime; **PASS (partial)** — verified with
a named gap; **BLOCKED** — cannot be verified in this environment, with the
reason.

| Area | Verdict | Evidence |
| --- | --- | --- |
| 01 Home | PASS | `screenshots/01-Home.png`. Journey A: Review session → Train › Session for Week 1 · Day 05 without starting it; Edit plan → Plan for the same day; a set added in Plan (4 → 5) reads back in Session; "Completed this week" stayed 0. Facts read `trainingDays` (planned days), `summarizeTrainingWeek` (completed this week) and the strength overview count (lifts logged) — each scope is named on screen. |
| 02 Movement | PASS | `screenshots/02-Movement.png`. Sport select changes the action list and picks a valid first action; stepper reads 01 / 22; Trace in Body Lab opens Body Lab with the same action selected (audit `atlas.mjs`, this session). |
| 03 Body Lab | PASS | `screenshots/03-Body-Lab.png`. Map tap and role-row tap select the same muscle; Find exercises opens Catalog with that muscle filter and the same action context; role count matches Home's count (11) after the 8-row cap was removed (audit `bodylab.mjs`). |
| 04 Catalog | PASS | `screenshots/04-Catalog.png`. Search narrows to "35 of 400"; chips remove one filter at a time; a no-result search keeps the query with Clear filters / Clear search; favorite does not navigate and Favorites tab lists it; add names the destination day in the toast; details open and close back to the same scroll (900 → 900) (audit `catalog.mjs`). |
| 05 Exercise overlay | PASS | `screenshots/05-Exercise-Details.png`. Full-height overlay hides the bottom nav; Fingerprint / Muscle demand / Mechanics tabs switch on the same exercise; the fingerprint shows four real dimensions with the other four behind one disclosure; Add names the week and day and closes; Escape closes; no overflow at 320 (audit `overlay.mjs`). |
| 06 Plan | PASS | `screenshots/06-Plan.png`. Week 1 (1 saved) / Week 2 (generate) / Week 3 (locked) and the five days each hold their own exercises; the set stepper edit persisted across navigation (Journey A); Add exercises, Start session, Import plan and Print sheet are present. Plan was not restyled this pass beyond the shared shell. |
| 07 Review | PASS | `screenshots/07-Review.png`. Review reads the open day (Day 05): six drills in order, the muscle volume map with direct and supporting sets per muscle, the spacing check and the planning guide. Review was not restyled this pass beyond the shared shell. |
| 08 Session | PASS | `screenshots/08-Session.png`. Journey D: Start workout → live set card; Log set 1 marks one set; reload resumes the live session with the set still logged; Finish workout writes exactly one device record and returns to prestart. |
| 09 Matches | PASS | `screenshots/09-Matches.png`. Ranking rows carry score, grade and "Why this match?"; the add-destination strip names Week · Day and adds to that day only (audit `matches.mjs`). |
| 10 Progress | PASS | `screenshots/10-Progress.png`. After Journey D: Workouts recorded 1, the record row reads the finished day's title, date, "1 exercise · 1 set", Device; the record opens on its own sets; Plan still shows six prescriptions with none marked done — the record is distinct from the editable plan. Trend rows say Baseline until a lift repeats. No `10-Progress.png` reference exists; built from §10 text. |
| 11 Strength | PASS | `screenshots/11-Strength.png`. Metrics "N / 18 regions covered · N lifts recorded" with "Coverage tracks logged regions, not rank."; Front/Back turn the figure; rank legend and region rows use the approved badge artwork from `RankIcon` (seven ranks, National crimson `#C93650`, World Stage silver outline, unscored hatched); a region row opens the existing record sheet showing the same rank and percentile as the map, close returns to the same scroll; Log a lift opens the existing form focused on the exercise field; a bench press at 225 lb saved once (a second Save tap was a no-op: the form had reset and Save was disabled) and appeared in Recent lifts and turned Chest / Shoulders / Triceps to On record. Rank thresholds and colours are read from `shared/capabilityRank.ts`; nothing was recalibrated. |
| 12 Profile | PASS | `screenshots/12-Profile.png`. Opened from Progress: the header profile icon is `aria-current="page"` and lit; bottom destinations neutral. Goal, days (5 → 4) and equipment preset (Commercial gym → Garage gym · 8 types) changed and survived reload; browser back returned to the prior workspace. Equipment, Training priorities (capacity focus), Account & sync (record location, sync queue, norms-pool consent), Appearance, Security (passkeys), Guides & research (guide, restart onboarding, research library) and Launch video each have one owner; the old More section is gone. The page says "Saved on this device as you change them", which is what the profile store does; it does not claim account sync. |
| Original assets | PASS | The brand logo is `sportsGenomeAssets.circularBadge` (unchanged) in the overlay bar and shell; the seven approved rank badges render via `RankIcon` (`/rank-icons/*.webp`) in the legend, rows, record sheet and How ranks work. `RankIcon.test.ts` and `capabilityRankTokens.test.ts` pass. |
| Responsive / accessibility | PASS (partial) | Journey F (`journeys.mjs`): all twelve screens at 360pt with a 20px root font, 430pt and 1280pt report no page overflow (`scrollWidth` equals the viewport) after the Home entry buttons were made to stack under 380pt; the only elements past the edge are inside the tab and filter scrollers, by design. Log a lift's exercise field stays visible in a 420pt-tall viewport. The bottom dock ends at the viewport bottom. Gap: keyboard tab-order and screen-reader passes were not run in this environment; disclosures are native `details`, the overlay is `role="dialog"` with Escape, region rows carry their state in `aria-label`. |
| Build / data integrity | PASS | `npx tsc --noEmit -p tsconfig.json` clean; `npx vite build` clean; `npx vitest run` → 1833 passed, 1 skipped, 5 failed — the five are `server/supabase*` connection tests that need `SUPABASE_SERVICE_ROLE_KEY`, unset here, and fail identically on `main` before this work. No scoring, rank, percentile or recommendation logic changed; only presentation, one robustness fix (favourites list guard) and the Body Lab 8-row cap removal. |

## Commands run

```
npx tsc --noEmit -p tsconfig.json
npx vite build
npx vite preview --port 4173 --strictPort
npx vitest run
node scratchpad/{home,atlas,bodylab,catalog,overlay,session,matches,progress,strength,profile}.mjs   # per-screen audits
node scratchpad/journeys.mjs                                                                        # journeys A, D, F
node scratchpad/capture.mjs                                                                         # the twelve screenshots
```

## Journeys

| Journey | Result |
| --- | --- |
| A — next session | PASS: Home → Session (same day, not started) → Plan (same day) → edit one set → Session shows it → completed count unchanged. |
| B — movement to training | PASS: verified across the Atlas, Body Lab, Catalog and overlay audits (Trace keeps the action; Find exercises carries muscle and action into Catalog; open → tabs → close restores scroll; add names the destination; favourite stays independent). |
| C — planning and analysis | PASS (partial): weeks and days keep their own exercises and an edit persists; Review reads the open day. Smart Draft was opened without replacing anything in the earlier Plan work; a replacement apply was not re-run this pass. |
| D — recording | PASS: start → log set → reload resumes → finish → one record in Progress, plan untouched → lift logged in Strength → history, coverage and region state refresh; duplicate save prevented. |
| E — preferences | PASS: Profile from Progress; icon lit; goal/days/equipment changes survive reload; catalog remains complete; all groups located; back restores the prior workspace. |
| F — constrained layout | PASS (partial): no page overflow at 360/20px, 430 and 1280 on all screens; field visible with a short viewport. Real on-device keyboard and OS text scaling were not exercised. |

## Unresolved blockers

- No exercise, equipment or sport-action illustrations exist; every such slot is recorded in `missing-illustrations.md` and laid out so the page reads without it.
- No `10-Progress.png` reference; Progress is built from §10's text.
- `SUPABASE_SERVICE_ROLE_KEY` is not set in this environment and anonymous sign-ins are disabled in the Supabase project, so the five server connection tests fail here and Account & sync reports "Saved on this device".
