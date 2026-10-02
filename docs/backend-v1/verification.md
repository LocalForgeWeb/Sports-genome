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

```text
Current branch/commit and environment: batch 4 merged as #71 (main 285dc0a), production READY.
Requirements completed and evidence: batch 4 verified live - production muscle-rank route, sent Pull-Up 12 reps unloaded and 5 reps +20 kg at 80 kg: lats 45.07 from the rep curve, the loaded set listed as added_load_not_scored, status partial. Batch 5: B108, B110, B112, B113, B114, B115 verified; B116, B119 implementing. Decision D-010; contract § Training Day coverage.
Current confirmed failure/root cause: B115 - formula (two coverage models for one target), confirmed in discovery; TR-11 capped surplus; TR-13 tag-ordered picker; TR-05 four set-count defaults; TR-12 wrong Leg Extension and Copenhagen Plank tags.
Files/migrations changed but not verified: none; catalog data edit to two exercises (171, 217).
Tests run and actual results: tsc 0; vitest all pass except the 5 live-Supabase tests; build OK. New: client/src/lib/coverageConsistency.test.ts (6), DeviceWorkoutTracker.prescription.test.ts (2); StackAnalysisPage.test.ts updated.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge batch 5; then recommendations (EN-12 equipment as a hard constraint, EN-13 structured action demands), then the latent account P0s and Supabase migrations.
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```

```text
Current branch/commit and environment: batch 5 merged as #72 (main 7067f5d).
Requirements completed and evidence: B120, B132 verified; B118, B129, B130 implementing. Decision D-011 (whizzer trace before and after, five other actions checked).
Current confirmed failure/root cause: EN-12 (no equipment input to Matches; session filtered after the cut) and EN-13 (demands read from muscle names; "press" in "pressure"; "strength" matched every pattern).
Files/migrations changed but not verified: none.
Tests run and actual results: tsc 0; vitest all pass except the 5 live-Supabase tests; build OK. New: movementRecommendations.constraints.test.ts (6).
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge; then the latent account P0s (account-scoped device storage, plan sync conflicts) and the Supabase hardening migrations, validated without applying.
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```

```text
Current branch/commit and environment: batch 6 (#73) open; batch 7 on the same branch after it.
Requirements completed and evidence: B171 verified; B019 re-verified; B163, B169, B173, B175, B262 implementing; B174 pending with the owner note. Decision D-012.
Current confirmed failure/root cause: PS-01 reproduced in a Home test (A's plan saved into B's empty record) and fixed; PS-03 profile/favourites hydrated once at mount; SV-04/PS-05 conflict re-push reproduced against a fake API (usePlanSync.test.ts); PS-14 fallback sport.
Files/migrations changed but not verified: none; no database change.
Tests run and actual results: tsc 0; vitest all pass except the 5 live-Supabase tests; build OK. New: Home.accountSwitch.test.ts (3), usePlanSync.test.ts (5), planSyncDecision.test.ts (+6, 2 rewritten), athleteSync.sport.test.ts (1). Mutation check: removing the empty-record reset fails the plan switch test.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: Supabase hardening migrations in the repo, validated without touching production.
Access/decision blockers: MySQL unreachable; sign-in not in the build (latent P0s); preview/dev point at the production Supabase project (owner).
```

```text
Current branch/commit and environment: batch 7 merged as #74 (main 1b25a11); batch 8 on claude/training-day-navigation-workouts-83ro2c.
Requirements completed and evidence: B009, B178, B190 verified; B032, B170, B179, B180, B192, B193, B194 blocked (fix prepared and proven, applying needs owner authorization); B150, B168, B181 implementing. Decision D-013.
Current confirmed failure/root cause: SB-07 (anon/authenticated hold insert/update/delete/truncate on tables with no policy for them), SB-02 (check-in accepted a focus area owned by another athlete), SB-03 (derived entry context editable after the fact), SB-04 (clients could write strength states), SB-06 (approved exercise mappings unreadable, so every lift was dropped as unmappable), PS-09 (a resent lift duplicated), PS-14 (entries required a sport). All seven reproduced in validation/before.sql against a live-equivalent schema.
Files/migrations changed but not verified: supabase/prepared/backend_v1/2026092812{0000..0600}_*.sql - verified locally, NOT applied to the production project (B009). Kept out of supabase/migrations so the GitHub integration cannot apply them.
Tests run and actual results: local PostgreSQL 16.13 - validation/run.sh (bootstrap, seed, before, migrations, after, re-apply) -> ALL VALIDATION PASSED; re-applying is harmless. tsc 0; vitest 2069 pass, 1 skip, 5 fail (the same live-Supabase tests, unreachable here); build OK. New: strengthSyncQueue.unmappable.test.ts (3) - an unmappable lift stays queued and is sent once its mapping resolves; a lift that can never form a row leaves the queue.
Open transactions/jobs or rollout state, if any: none. Nothing applied to Supabase.
Next concrete action: merge batch 8; then the remaining engine items (EN-11, EN-14, EN-16, B123), performance measurements, the gate report and handoff.
Access/decision blockers: applying the Supabase migrations (owner, B009); SB-01, SB-05, SB-11 owner decisions (README); MySQL unreachable; sign-in not in the build.
```

```text
Current branch/commit and environment: batch 8 merged as #75 (main 37d659c); batch 9 on claude/training-day-navigation-workouts-83ro2c.
Requirements completed and evidence: B109 verified; B066, B076, B084, B123, B140 implementing. Decision D-014; contracts § Muscle ranks on the map, § Research references: units.
Current confirmed failure/root cause: EN-14 re-confirmed live - 880 approved female 10RM rows (Piper 2022) in lb_10rm, matcher knew only kg/lb; the declaration route is the 2021 men's study, so women also stop at training_status_mismatch (owner/research item, not inferred). EN-16 re-confirmed live - aggregate_muscle_strength_v1 for bench at P80: pec 79.67/78.64 primary, serratus 55.11, subscapularis 54.15, infraspinatus 53.91 all stabilizer-only; ceiling ~94.9.
Files/migrations changed but not verified: none; no database change (read-only queries only).
Tests run and actual results: tsc 0; vitest 2076 pass, 1 skip, 5 fail (the same live-Supabase tests); build OK. New: normsReference.test.ts (+3, real female cut points), capabilityRank.test.ts (+1), StrengthGenomePanel.betaPercentile.render.test.ts (+1), splitStackAnalysis.revision.test.ts (2). Mutation checks: old kgToUnit fails the lb_10rm test; old regionRanksFromMuscles fails the stabilizer test.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge batch 9; performance measurements (B231-B233), gate report, handoff.
Access/decision blockers: as before; plus the women's 10RM declaration route and the muscle band ceiling (owner).
```

```text
Current branch/commit and environment: batch 9 merged as #76 (main 19ae19d); batch 10 on claude/training-day-navigation-workouts-83ro2c.
Requirements completed and evidence: B232 verified; B169, B231, B233 implementing; gate, process and earlier-delivered rows updated with evidence (status.md). Decision D-015. Records: performance.md, handoff.md.
Current confirmed failure/root cause: Home and Progress asked workoutLog.list, strengthGenome.observations and workoutLog.progressionHistory with no account; each 401 raised "Your sign-in has expired". Reproduced in Chromium against the production bundle (fake API answering as the server code does) and confirmed on production with an owner-approved read-only probe: HTTP 401 UNAUTHORIZED "Please login (10001)" for all three.
Files/migrations changed but not verified: none; no database change.
Tests run and actual results: new accountQueries.directAccess.test.ts (2) fails against the old panels and passes after; browser check after the fix: no toast, Home 4 procedures in 1 batch. Performance: scripts/perf/measure-client.cjs, 10 runs x 18 conditions, in-page timing (performance.md, raw JSON kept). An earlier run timed with Playwright waits was discarded (poll back-off quantised short flows to ~400 ms). tsc 0; vitest 2078 pass, 1 skip, 5 fail (the same live-Supabase tests); build OK. Two source-string tests (TodayActionPanel.test.ts, ProgressOverviewPanel.test.ts) pinned the ungated call and were updated with the reason inline (B290).
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge batch 10; then the September 28 regression repair brief (Home layout, next-workout ownership, strip icons, notices, Plan hierarchy).
Access/decision blockers: production server latency unmeasured (no route from the shell; Observability Plus); others as before.
```

```text
Current branch/commit and environment: batch 10 merged as #77; parallel PRs #78-#81 merged to main from another session; the Sep 28 regression repair merged as #82 (main 8be0ef3, production dpl_Hx5yP4QzysDJdrHHSqnMKap2crkG READY). Wrap-up records on claude/training-day-navigation-workouts-83ro2c.
Requirements completed and evidence: B284-B298 verified (handoff.md, gates.md); B281, B282 evidence extended. Gate verdicts in gates.md: A fail (blocked on applying the prepared Supabase migrations), B and D partly unverified, C deferred (owner), E pass.
Current confirmed failure/root cause: the Sep 28 regressions and their causes are recorded in docs/regression-sep28/README.md (Home's shared home-focus class; Home's next workout was the Plan's active day; a timer-gated notice fired on any refusal; four protected calls still reachable on the device store).
Files/migrations changed but not verified: none; no database change. The prepared Supabase migrations remain NOT applied.
Tests run and actual results: at 8be0ef3 - tsc 0; vitest 2539 pass, 1 skip, 5 fail (the same live-Supabase tests); build OK. Browser: the Sep 28 brief's mandatory journeys in Chromium at 320-430 px and 125% text (docs/regression-sep28/evidence/*.json). Not exercised: iOS/WebKit, MySQL, account-backed journeys.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: the owner applies the prepared Supabase migrations (handoff decision 1), then the paired client upsert ships; then REG-1 on an iPhone.
Access/decision blockers: applying the migrations (owner, B009); iOS shell on main (D-003); MySQL unreachable; sign-in not in the build; owner decision 10 (records after a real lapse).
```

```text
Current branch/commit and environment: main 47a528e (#83); D-016 (muscle-rank directness) on claude/training-day-navigation-workouts-83ro2c, for #84.
Requirements completed and evidence: B082 and B087 verified; B084 and B085 evidence extended (status.md). Decision D-016 with before/after deltas from live database rows; contracts § Muscle ranks on the map rewritten around the path and the directness rule.
Current confirmed failure/root cause: the chest rank drew a fly at the 86th and presses at the 60th and 67th at the same weight per lift; the more confident set led the movement pattern and the others decayed to 0.55 and 0.30. Reproduced with the live aggregate_muscle_strength_v1: 77.12 at equal confidences, 66.71 with the presses the more confident sets.
Files/migrations changed but not verified: none; no database change. The aggregation now runs on the server; the database function is unchanged and no longer called by the app.
Tests run and actual results: server/muscleAggregation.parity.test.ts (11: the transcription reproduces the database's recorded outputs for eight input sets, every muscle and evidence row); server/muscleAggregation.test.ts (11: the rule); server/supabaseStrengthProfile.test.ts rewritten to the in-process aggregation; StrengthGenomeBodyMap.rank.render.test.ts (+2: shares and the directness sentence). tsc 0. Full vitest and build: recorded in handoff.md with the merge.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: merge #84, confirm the production deployment READY and probe strengthProfile.muscleRanks for aggregationVersion sg_muscle_aggregate_v2.
Access/decision blockers: as before.
```
