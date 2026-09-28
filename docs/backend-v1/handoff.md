# Backend V1 handoff

Final state of the Backend V1 assignment and what V2 inherits (brief §18, B284–B298). Written 28 September 2026. Read this first; everything it cites is in `docs/backend-v1/`.

## Where things stand

**Not launch-ready.** The calculation engines now agree with each other and with the research database, logged data keeps its meaning, and the running app uses the repaired contracts. But four things stand between this build and a launch, and none can be closed from inside this assignment:

1. **Supabase access holes are open in production.** Seven fixes are written and proven on a live-equivalent copy (`supabase/prepared/backend_v1`, D-013), not applied. Gate A fails until they are.
2. **No iOS build exists on `main`** (D-003). Nothing iOS-specific has been exercised.
3. **Sign-in is not in the build** (`directWorkspaceAccess = true`). Account paths are proven against mocks only (MySQL was unreachable). Before sign-in ships, history must become per-account (D-012) and account deletion/export must exist (SV-09).
4. **Payments are deferred by the owner** (D-001). Gate C is out of scope, not failed.

What works and was verified in the running app or production: strength placement (one estimator, pinned to the database; best lift per exercise; age at the lift), load conventions (per dumbbell, bodyweight by reps), muscle ranks (no stabilizer echoes, ceiling disclosed), a single Training Day coverage model with a versioned target set, recommendations constrained by equipment and read from the action, account-scoped device records with three-way plan sync, and a device store that no longer fires account-only requests or a false "sign-in has expired" message.

| | |
|---|---|
| Repository / branch | `LocalForgeWeb/Sports-genome`, work branch `claude/training-day-navigation-workouts-83ro2c` (restarted from `main` after each merge) |
| `main` | See the last checkpoint in `verification.md` (batch 10) |
| Production | Vercel project `sports-genome` (team `local-b96d`), `sports-genome-mauve.vercel.app`; every batch deployed READY |
| Supabase | `qiccnqkypbhlwpmjcsri`, read-only throughout; nothing applied |
| Status | `status.md`: 298 requirements, every one with a status; 30 `deferred (owner)` (payments) |

## Run the baseline (B286)

```sh
npm ci
npx tsc --noEmit                   # exit 0
npx vitest run                     # all pass except 5 live-Supabase tests that need network + credentials:
                                   #   server/supabaseEvidenceConnection (x2), supabaseEvidenceRls,
                                   #   supabasePublicAssets, supabaseStorageConnection
npm run build                      # client + server bundles
# Supabase migrations, on any PostgreSQL 16 (see supabase/prepared/backend_v1/README.md):
supabase/prepared/backend_v1/validation/run.sh -h <socket dir> -p <port> -U postgres   # ALL VALIDATION PASSED
# Client flow timings (performance.md):
serve -s dist/public -l 4173 & node scripts/perf/measure-client.cjs http://localhost:4173 10
# Server route timings, from a machine that can reach the deployment:
node scripts/perf/measure-api.cjs https://<deployment> 10
```

## What V1 changed

| Batch | PR | What | Records |
|---|---|---|---|
| 1 | #68 | Gym lifts no longer ranked against competitive powerlifters (EN-05); Piper band gap crash (EN-15); Undo bound to its operation; empty plan at launch; refused finish stays open; server hardening (rate limits, batch cap, error redaction) | D-004 |
| 2 | #69 | Units stored per set and per session; one active workout across tabs; one definition of a completed set and workout | D-005, D-006 |
| 3 | #70 | One e1RM (the database's), best lift per exercise for muscle ranks, strongest set per workout, unrecorded effort disclosed | D-007, D-008 |
| 4 | #71 | Load conventions (per dumbbell, per hand, machine, bodyweight by reps) end to end | D-009 |
| 5 | #72 | One coverage model; uncapped surplus; picker ranked by what it closes; one set-count resolver; two catalog tag fixes | D-010 |
| 6 | #73 | Recommendations: equipment as a hard constraint; demands read from the action, not its muscle list | D-011 |
| 7 | #74 | Per-account device records, read before written; three-way plan sync with a conflict choice; no fallback sport on synced lifts | D-012 |
| 8 | #75 | Supabase hardening migrations prepared and proven locally, **not applied**; unmappable lifts stay queued | D-013 |
| 9 | #76 | Female `lb_10rm` references readable; stabilizer-only muscles unranked; muscle ceiling disclosed; coverage target revision | D-014 |
| 10 | #77 | Performance measured (client flows, request counts); account-only queries off on the device store (false "sign-in has expired") | D-015, `performance.md` |

## Intentional behaviour changes (B290)

V2 must not read these as regressions. Each rewrote the tests that pinned the old behaviour, with the reason inline.

| Decision | Before | After |
|---|---|---|
| D-004 | A gym squat/bench/deadlift was ranked against competitive powerlifters whenever a sex was on file | Community percentile; the competition comparison only on an exact competition declaration |
| D-006 | "Finish early" with nothing logged stored a workout and marked the day trained | Nothing stored; not counted anywhere |
| D-007 | Card (mean of Epley/Brzycki), trends (Epley) and ranks (Strength Level) disagreed; ranks saw the newest 30 lifts; a workout gave its heaviest set | One estimator everywhere; best lift per exercise regardless of date; a workout gives its strongest set (e.g. 100 kg × 5 → e1RM 112.5, was 114.58 / 116.67) |
| D-009 | A dumbbell box said "Weight"; a pull-up with +20 kg scored as bodyweight | "Weight per dumbbell"; loaded bodyweight sets reported as not scored |
| D-010 | Analysis graded coverage with relative involvement; capped surplus | Model A tag points everywhere; "relative involvement" labelled as such; surplus shown |
| D-011 | "press" matched "pressure"; any exercise with "strength" met any demand; equipment filtered after the cut | Action-text demands, distinctive qualities or prime movers; equipment before ranking |
| D-012 | A conflicting account plan was adopted and re-pushed over the other device | Syncing stops; the athlete chooses |
| D-014 | Stabilizer-only muscles were ranked (e.g. infraspinatus 53.91 from a P80 bench) | Not ranked; the legend states National/World Stage are unreachable for muscles |
| D-015 | Home and Progress asked account-only routes on the device store and showed "Your sign-in has expired" | Not asked without an account; no false message |

## Versions and compatibility map (B287, B288)

| Component | Identifier | Where | Changes when |
|---|---|---|---|
| Strength scoring | `strength_beta_v2` (reported per score; joined with "+" when a response mixes versions) | `shared/strengthPercentile.ts`, `server/supabaseStrengthProfile.ts` | Curve placement or estimator changes |
| Estimator | `strengthlevel_compatible_v1` (Strength Level curves), `sports_genome_generic_v1` (others) | same | Only with the database's estimator |
| Muscle evidence selection | `best_percentile_per_exercise_v1` | `server/supabaseStrengthProfile.ts` | Selection rule changes |
| Muscle aggregation | database `aggregate_muscle_strength_v1` (unchanged) | Supabase | Research side |
| Muscle confidence calibration | `muscle_aggregate_structural_v1` (provisional) | `shared/capabilityRank.ts` | Calibrated replacement |
| Rank scheme / palette | `sg_capability_rank_v1` / `sg_rank_palette_v2` (unchanged) | `shared/capabilityRank.ts` | Band edges or colours |
| Coverage targets | `split_targets_v1` (returned as `targetRevision`) | `client/src/lib/splitStackAnalysis.ts` | Any target edit (a fingerprint test fails otherwise) |
| Load conventions | snapshot of `strength_exercise_scoring_policy`, read 28 Sep 2026 | `shared/loadConventions.ts` | Policy table changes (pinned test) |
| Device storage | `…-v1` keys, per account as `<key>::<account>` (plan, profile, favourites, plan-sync base); legacy unscoped keys read for the signed-out user | `client/src/pages/Home.tsx`, `lib/planSyncBase.ts` | Format change needs a migrator (B177) |
| Supabase schema | live as found + prepared `20260928120000`–`120600` (not applied) | `supabase/prepared/backend_v1` | Owner applies |
| MySQL schema | Drizzle migrations 0000–0010 (unchanged) | `drizzle/` | — |

**Ordering constraint.** `20260928120500` (client_op_id) must be applied before the client upsert described in the README ships; the current client is compatible with both states. `20260928120600` (sport optional) must be applied before general athletes' lifts can sync at all.

## Owner decisions waiting

| # | Decision | Blocks | Where |
|---|---|---|---|
| 1 | Apply the seven prepared Supabase migrations, then ship the paired client upsert | Gate A (B267, B269), B032, B170, B179, B180, B192–B194 | `supabase/prepared/backend_v1/README.md`, D-013 |
| 2 | Anonymous public surface (SB-01), RPC EXECUTE grants and the SECURITY DEFINER RPC (SB-11), tying the Supabase identity to the app account (SB-05) | B181, B182 | D-013 |
| 3 | Ownership of history already on devices and an explicit guest-import step — **launch-blocking before sign-in ships** | B174, B175 | D-012 |
| 4 | Isolate preview/development from the production Supabase project | — | D-012 |
| 5 | Port the iOS shell to `main` — **launch-blocking for the iOS release** | B226, B261, B283 (iOS) | D-003 |
| 6 | Review the Piper 2022 women's 10RM protocol before a women's declaration route is offered | B066 | D-014 |
| 7 | Muscle-rank ceiling: re-map bands or change the aggregation | B076 | D-014 |
| 8 | Set count / dose in coverage (a model change) | EN-11, B092 | D-010 |
| 9 | Payments | Gate C | D-001 |

## Remaining defects (B285, B291)

Stable IDs from the discovery inventory (`inventory/*.md`, which has file and line evidence for each). P0/P1 first.

| ID | Pri | Defect | Reproduce / verify | Next step | Depends on |
|---|---|---|---|---|---|
| SB-02, SB-03, SB-04, SB-06, SB-07, PS-09 | P0/P1 | Supabase ownership and grant holes | `validation/before.sql` shows each open on a live-equivalent schema | Apply the prepared migrations | Owner (#1) |
| SV-09 | P0 (iOS) | No account deletion or export (App Store 5.1.1(v)) | No account deletion or export route in `server/routers.ts` (only per-record deletes) | Build deletion/export over MySQL, Supabase and device stores | Sign-in, iOS |
| PS-02, SV-06 | P0 before sign-in | History, typed lifts, body-weight log and the sync queue are device-level, not per account | `Home.accountSwitch.test.ts` covers only the scoped records | Scope them per account with a guest-import step | Owner (#3) |
| SV-05 | P1 | MySQL workout writes are not idempotent: `start` has no operation id and two inserts without a transaction; `complete` returns NOT_FOUND on retry | Read `server/routers.ts` `workoutLog.start/complete`; needs MySQL | Operation ids + a transaction; `complete` idempotent | MySQL access |
| EN-17 | P2 | Aggregation coefficients unsourced; the server supplies confidence 0.5 when missing | `server/supabaseStrengthProfile.ts` (`?? 0.5`) | Record each coefficient's source; refuse when missing | Research side |
| EN-21 | P2 | Dormant e1RM paths remain (progression Epley without a cap in unmounted components) | `WorkoutExecutionPanel.tsx`, `ProgressionReviewPanel` (not mounted; still "3 × 8–12") | Delete or route through the shared estimator before re-mounting | — |
| EN-20 | P2 | Several age-at-test computations with different semantics | inventory/engines.md §6 | One helper | — |
| EN-22 | P2 | Client muscle-effect dimensions are exercise-level heuristics; the database `muscle_effect_v1_*` engine is unused | inventory/engines.md | Decide which engine is canonical (B089–B107) | Product |
| EN-23 | P2 | The card names the cohort "men who lift"; the database asks for "Community-lifter percentile" | `strengthPercentileCard.ts` | Align the label | — |
| EN-24 | P2 | Duplicate catalog names (Romanian Deadlift 42/186, Dumbbell Pullover 24/65); name→id maps pick the last | Catalog search for "romanian" shows two identical cards (seen in the perf run) | Rename or merge with a mapping | Catalog owner |
| EN-25 | P2 | Match breakdown percentages are synthesized from counts | `movementRecommendations.ts` breakdown | Replace with reason codes (B123) | — |
| EN-27, SV-15 | P2 | Manual observations keep kg at 2 dp only; unbounded `observedAt`; `loggedAt` is ingestion time | `drizzle/schema.ts`, `server/routers.ts` | Store entry value + unit; bound dates; separate event and ingestion time (B028) | MySQL |
| SV-10, SV-11 | P2 | `SameSite=None` cookie with multipart accepted (cross-site logout); session hygiene | inventory/server.md | Lax cookie or reject multipart; session rotation and revocation | Sign-in |
| SV-16 | P2 | Public evidence routes run ~200 sequential MySQL upserts per cold instance | inventory/server.md | Move seeding out of the request path | MySQL |
| SV-17 | P2 | Hard deletes, no tombstones; listing caps truncate Progress/Strength inputs silently | inventory/server.md | Tombstones (B172); paginate | MySQL |
| SV-19 | P2 | Isolation tests are mocks; the one live RLS test covers one table | inventory/server.md | Run the prepared `before/after` as CI against a Supabase branch | Owner (#4) |
| SV-20, PS-24 | P2 | Dead auth/profile plumbing; the MySQL user row persisted on the device and never read | inventory | Remove after consumers migrate (B294) | — |
| PS-20 | P2 | Priorities are MySQL-only; "Set focus" does nothing on the device store | Tap "Set focus" in Strength on the device store | Device-store priorities or hide the control | — |
| PS-21 | P2 | Destructive load fallbacks (malformed plan overwritten, unknown sport discarded) | `Home.tsx` load paths | Quarantine key + versioned migrators (B177) | — |
| B088 | P2 | Coverage colours show while ranks load (status line added; whether it misleads is unverified) | Open Strength with lifts on a slow network | Neutral pending state | — |
| Perf-1 | P2 | First open parses ~2.5 MB of JS, including all sports' movement data for athletes with no sport | `performance.md` | Lazy-load `movement-data` | — |
| Perf-2 | P2 | General athletes' Home asks `sportsGenome.profile` for the fallback sport on every open | `performance.md` request counts | Ask when the movement explorer opens | — |

## V1 requirements not done (B292)

Not V2 ideas — unfinished V1 work, by area, with `status.md` as the authority: canonical data semantics and validation (B026–B047), muscle-effect engine (B089–B107), reference-release process (B139–B149), plan/session lineage and transitions (B151–B166), offline documentation and tombstones (B167, B172), migration staging and rollback on staging (B225–B230), operations runbook (B240), the state fixtures that need MySQL or an iOS device (B257, B260, B261, B263, B266).

## V2 candidates (B293)

| Candidate | Kind |
|---|---|
| Reps in reserve captured in the tracker and sent to muscle ranks (the engine already accepts it, D-008) | Expands supported inputs |
| Structured action demands from the enriched sport data (force direction, contraction, range) | Improves evidence |
| Completed-exposure computation from logged sets beside planned coverage (B091, B117) | Adds a module |
| Set count / dose in coverage (EN-11) | Changes existing semantics |
| A women's 10RM declaration route | Expands supported inputs (after owner review) |
| Calibrated muscle confidence replacing `muscle_aggregate_structural_v1` | Improves evidence |
| Reason codes on recommendations (sport demand, redundancy) | Expands outputs |

## Constraints for V2 (B294, B295)

- Keep the legacy unscoped storage keys readable until every device has been read once under an account (D-012); keep `weightUnitInferred` rows distinguishable (D-005).
- Removing the dormant components or the unused MySQL profile plumbing is a deliberate follow-up once nothing mounts them.
- Model changes in V1 are code-only and never rewrote a stored observation; rolling one back needs a revert, not a data change. The prepared migrations each have a rollback in the README; none deletes data.
- Do not restore the competitor rank for gym lifts (D-004) or rank stabilizer-only muscles (D-014) without new evidence.
