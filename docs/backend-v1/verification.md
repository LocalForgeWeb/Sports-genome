# Backend V1 verification

Commands actually run, fixtures, numeric traces and integration results (B005, B297). A test is listed as passed only when it was run; environment and device limits are stated with each result.

## Environments available to this assignment

| Environment | Reachable from the work environment | Notes |
|---|---|---|
| Supabase `qiccnqkypbhlwpmjcsri` | Yes, through the Supabase MCP tools (read-only queries and advisors) | The shell cannot reach `*.supabase.co`; the local dev server therefore cannot reach Supabase. |
| MySQL (`DATABASE_URL`) | No | No credentials in the work environment; account-saved paths are verified with unit/integration tests against mocks and by code reading, and are marked accordingly. |
| Vercel production (`sports-genome-mauve.vercel.app`) | Deploy state through the Vercel tools | Deploys follow the existing PR → squash merge → Vercel flow. |
| Desktop / simulated mobile | Yes: headless Chromium (Playwright) at phone widths | Browser emulation, not a physical phone. |
| Actual iOS build | No | No native shell on `main` (decisions D-003). |
| App Store sandbox | Not applicable | Payments deferred by owner (D-001). |

## Baseline before any Backend V1 change (B022)

`main` at 52c8f52, 27 September 2026, work environment above.

```text
npx tsc --noEmit            -> exit 0
npx vitest run              -> 236 files: 232 passed, 4 failed; 1932 tests: 1926 passed, 1 skipped, 5 failed, all live-Supabase credential/network tests
                               (server/supabaseEvidenceConnection x2, supabaseEvidenceRls, supabasePublicAssets, supabaseStorageConnection)
                               that need credentials and network this environment lacks; identical before this assignment.
```

Numeric baseline for the strength route, live database (from PR #67): male Barbell Bench Press, 81.65 kg x 1 at 65.77 kg body weight -> 48.97th percentile with no age (see decisions D-002 for the age traces).

## Checkpoints

Format from brief §17.

```text
Current branch/commit and environment: claude/training-day-navigation-workouts-83ro2c at main 52c8f52; work environment as above.
Requirements completed and evidence: B001, B012 verified; records seeded (status.md).
Current confirmed failure/root cause: none yet — discovery running.
Files/migrations changed but not verified: docs only.
Tests run and actual results: none in this checkpoint.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: collect the five discovery parts, then P0 repairs.
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```

```text
Current branch/commit and environment: batch 1 merged as #68 (main 27f9b3c); production deployment dpl_8CMVritJtbW6s1mqiPcMqPwSPojW READY at sports-genome-mauve.vercel.app.
Requirements completed and evidence: B065, B162, B264 verified (Home.undoAndLoading.test.ts, StrengthGenomePanel tests); server hardening from 0afbd64 in the same merge.
Current confirmed failure/root cause: none open from batch 1.
Files/migrations changed but not verified: none.
Tests run and actual results: tsc 0; vitest 1952 pass, 1 skip, 5 fail (the live-Supabase tests, unreachable from this sandbox - identical on main); npm run build OK.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: batch 2 - units per set, one active session across tabs, shared count definitions.
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```

```text
Current branch/commit and environment: claude/training-day-navigation-workouts-83ro2c from main 27f9b3c; work environment as above.
Requirements completed and evidence: B048, B243, B154, B158, B155, B156 verified; B024, B025, B265 implementing (status.md). Decisions D-005 (legacy units), D-006 (empty finish, shared counts). Contracts: § Logged weights and units, § Counts, § Active workout.
Current confirmed failure/root cause: PS-10/EN-08/TR-06 - the weight box always said lb while readers used the profile unit; PS-11 - each tab wrote its whole session copy back; PS-13 - per-screen count rules. All reproduced by the new tests failing against the old code (mutation checks on the migration and on the stored-copy merge).
Files/migrations changed but not verified: none. No database change.
Tests run and actual results: tsc 0; vitest 1976 pass, 1 skip, 5 fail (same live-Supabase tests); npm run build OK. New: deviceWorkoutLog.units.test.ts (11), DeviceWorkoutTracker.units.test.ts (3), DeviceWorkoutTracker.tabs.test.ts (7), Home.undoAndLoading.test.ts (+1), athleteRecord.test.ts (+2, 1 rewritten).
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge batch 2; then batch 3 - strength selection and e1RM parity (EN-01..04, EN-06, EN-07, EN-09).
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```

```text
Current branch/commit and environment: batch 2 merged as #69 (main 84682e0), production READY. Branch restarted from it for batch 3.
Requirements completed and evidence: B017, B044, B056, B059, B061, B063, B093, B253 verified; B057, B083, B287 implementing. Decisions D-007 (one e1RM, best lift counts), D-008 (unrecorded effort). Contracts § Estimated 1RM and placement, § Which observation counts.
Current confirmed failure/root cause: EN-01 reproduced live (bench 100x10 + 80x3 at 80 kg: chest 27.35 sent together, 84.67 best alone); EN-03 card/rank disagreement from three estimators; EN-02 newest-30 selection and heaviest-set choice.
Files/migrations changed but not verified: none. No database change; the strength_scoring_versions v2 description fix is deferred to the batch 7 prepared migrations.
Tests run and actual results: tsc 0; vitest 2010 pass, 1 skip, 5 fail (live-Supabase, unreachable here); build OK. New: server/strengthPercentile.parity.test.ts (13, pinned to database outputs), strengthPercentileCard.effort.test.ts (3), supabaseStrengthProfile.test.ts (+2), muscleRankLifts.test.ts (+6 replacing 1), workoutStrengthRecord.test.ts (+1, 2 rewritten), ageAtLift.scoring.test.ts (+1, 2 rewritten).
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge batch 3; probe the live muscle-rank route with a strong and a weak set of one exercise; then load conventions (EN-07, EN-09).
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```

```text
Current branch/commit and environment: batch 3 merged as #70 (main 837a505); production dpl_CyaDyxAmnmTUrJ6LwXPJu5b1pbtK READY.
Requirements completed and evidence: batch 3 verified live - the production muscle-rank route, sent bench 100x10 and 80x3 at 80 kg, returned the chest at 84.67 under strength_beta_v2 / best_percentile_per_exercise_v1 (27.35 on the previous production build an hour earlier). Batch 4: B049, B052 verified; B025, B040, B050, B051, B244 implementing. Decision D-009; contract § Load conventions.
Current confirmed failure/root cause: EN-07 (dumbbell box never said per dumbbell; every lift synced as total_external_load) and EN-09 (Pull-Up +20 kg x 5 = bodyweight x 5 = 15.71, reproduced live; unloaded bodyweight sets never reached ranks).
Files/migrations changed but not verified: none; no database change.
Tests run and actual results: tsc 0; vitest 2030 pass, 1 skip, 5 fail (live-Supabase, unreachable here); build OK. New: server/loadConventions.test.ts (10), setEntryFields.test.ts (+2), workoutStrengthRecord.test.ts (+1), muscleRankLifts.test.ts (+3), supabaseStrengthProfile.test.ts (+3), StrengthGenomePanel.weightUnit.render.test.ts (+1).
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge batch 4 and probe production with an unloaded and a loaded pull-up; then coverage unification (B115).
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```
