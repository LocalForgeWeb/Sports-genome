# Backend V1 decisions

Each decision names what was chosen, what else was possible, the evidence, and which requirements it touches. Scientific assumptions are recorded here rather than left in code comments alone (brief §1, B068, B101).

## D-001 — Payments deferred by owner (27 September 2026)

**Decision.** Section 12 (B196–B220), Gate C (B276–B279), B189 and the payment portions of B184, B185, B194, B238, B239, B240 and B283 are out of this assignment, recorded as `deferred (owner)`.

**Why.** Owner instruction. They are neither incomplete work nor launch blockers *for this assignment*; `status_tool.py` refuses to reopen them without the owner.

**Consequence carried forward.** No entitlement model exists or is designed here. Server endpoints are not gated by paid access. When payments return, B184/B185 must be revisited so premium access comes from verified provider evidence and never from profile metadata or a client flag.

## D-002 — Age adjusts the comparison, only when the athlete gives a birth year (27 September 2026, PR #67)

**Decision.** When a birth year is known, every Strength Level-sourced placement is made at the athlete's age *on the day of the lift*, using the database's `strengthlevel_age_factor_v1` (published Strength Level age table, ages 15–90, factor 1.0 from 25 to 40, linear interpolation between anchors). The lift is compared as `lift / factor` on the same curve; the recorded lift is unchanged. Outside 15–90 nothing is extrapolated and the interface says so. Without a birth year no age weighting is applied.

**Alternatives.** (a) No age weighting at all — the recorded `strength_beta_v1` contract; rejected because the owner explicitly wants age relevance (brief §5.3). (b) Age-specific norms — not available for these exercises. (c) Extrapolating below 15 from the 15-year factor — rejected (B070: no silent extrapolation).

**Stage (B069).** The adjustment is applied to the observed metric's comparison value (divide the e1RM by the factor) before curve placement — equivalent to multiplying the reference by the factor. It is applied exactly once; the curves themselves are all-ages community data with no age adjustment of their own (B067 — audit to confirm under Strength work).

**Evidence.** Live database traces for a 180 lb bench at 145 lb body weight, male: 48.97 with no age; 74.44 at 15, 69.60 at 16, 60.67 at 18, 52.64 at 20, 48.97 at 30, 67.95 at 50. Tests: `server/strengthPercentile.age.test.ts` (engine pinned to the database outputs), `server/supabaseStrengthProfile.age.test.ts`, `client/src/lib/ageAtLift.scoring.test.ts`. Record: `docs/strength-percentile/live-contract-audit.md` § Age.

**Touches.** B031, B067–B070, B247, B250.

## D-003 — iOS integration status (B002)

**Finding.** `main` contains no native shell: no `capacitor.config.*`, no `ios/`, no Capacitor dependency. The iOS work — Capacitor shell with native auth, CORS and safe-area handling; an offline workout outbox (`client/src/lib/offlineQueue.ts`, `offlineSession.ts`, `hooks/useWorkoutOutbox.ts`); a native share sheet; cloud iOS CI (`.github/workflows/ios.yml`); App Store submission files (`IOS_SETUP.md`, `ios-assets/`) — exists only on `origin/claude/ios-app-conversion-snuz36`, 86 commits from 18–22 August 2026, with **no common history with `main`** (`git merge-base` finds none). Its `Home.tsx` is 582 lines; `main`'s is 1,726.

**Decision for this assignment.** Do not merge or port the shell inside the backend work: it is an app-packaging change with its own verification path, and the branch predates a month of product work. Treat it as the source to port from, not a branch to merge. Its offline outbox is prior art for B168/B170: any durable offline queue built here must be reconciled with it rather than become a second, competing design (B003, B197 spirit).

**Consequence.** Anything that needs an actual iOS build (B283's iOS portion, B226 installed-client compatibility, B261 app termination on device) is `blocked` on the shell being ported to `main`. The 10 October iOS release depends on that port; it is named as a release risk in the gate report.

## D-004 — No competitor rank for a gym lift (27 September 2026, batch 1) — intentional behavior change

**Decision.** The Strength Genome panel no longer ranks an ordinary gym lift against the van den Hoek 2024 powerlifting population. That card appeared whenever the athlete had a sex on file, for any squat, bench or deadlift, and replaced the community percentile. Competitors are a selected, trained, tested population; a gym lift does not match their protocol or selection (B065). The competition comparison still appears, labelled "Compared to that competition group", only when the entry *is* an exact competition-context match (the existing `powerliftingReference` route). The default placement is the community `strength_beta_v1` percentile, whose card names its group ("among men who lift") in the same line as the number.

**What replaces the gate.** Where a comparison needs something the athlete has not given, the panel asks for it with neutral options ("Women who lift", "Men who lift", "Prefer not to say") and an optional birth-year prompt; declining leaves progress tracking intact.

**Not a regression.** Tests that pinned the old card (`StrengthGenomePanel.rankGate.test.ts`, `…registryReference.render.test.ts`, `StrengthGenomePanel.test.ts`, `strengthGenomeDefinitions.test.ts`) were rewritten to pin its absence. V2 should not restore it (B290).

**Touches.** B065, B066, B290.

## D-005 — Units for history logged before units were stored (28 September 2026, batch 2)

**Finding.** Device sets stored a bare number. The tracker's box always said "lb", while every reader converted the number with the profile's unit *of the day* (inventory PS-10, EN-08, TR-06). Nothing recorded which unit a past set was typed in.

**Decision.** Each set now stores its unit, and each session the unit it started with (see contracts.md § Logged weights and units). History without a unit is assigned the profile's unit once — when the profile has first been read after this build loads — and marked `weightUnitInferred: true`.

**Why the profile's unit.** It is what every screen, rank and sync has already used for these sets, so the assignment changes no number the athlete has seen. The alternative, the box label ("lb"), would silently change every kg athlete's history by a factor of 2.2. Marking the rows "unknown" and excluding them would drop all existing history from ranks. The flag keeps the inference visible for any later correction.

**Consequence.** For kg athletes whose history was typed against the "lb" label, the ambiguity that already existed is frozen, not resolved. From now on a unit switch cannot rescale a past lift.

**Touches.** B024, B025, B048, B243; PS-10, EN-08, TR-06.

## D-006 — A finish with nothing logged is not a workout (28 September 2026, batch 2) — intentional behavior change

**Decision.** "Finish workout early" with no completed set ends the session and stores nothing (it used to store a completed session with no exercises, counted as a workout on Home and Progress and marking the day trained). Counts everywhere use `isCompletedWorkout` / `isCompletedSet`, so any such session already stored is no longer counted either. Progress now selects typed lifts and sessions by the same `directAccess` rule as Home and Strength; it used to add the device's and the account's together.

**Not a regression.** `athleteRecord.test.ts` pinned the old count (`workoutsRecorded: 1` for an empty finish) and now pins 0; `TodayActionPanel.test.ts` and `ProgressOverviewPanel.test.ts` were updated for the shared selector (B290).

**Touches.** B155, B156, B265.

## D-007 — One e1RM, and the best lift counts (28 September 2026, batch 3) — intentional behavior change

**Finding.** Three estimators read the same set: the card averaged Epley and Brzycki up to 12 reps, the muscle ranks used the database's Strength Level calculator up to 15, trends used Epley up to 12. 180 lb × 3 at 145 lb read 60.8 on the card and 57.74 in the ranks (EN-03). The ranks saw the newest 30 lifts only (EN-02), a workout contributed its heaviest set rather than its strongest, and the database aggregation kept an exercise's most confident observation rather than its best, so logging 80 × 3 after 100 × 10 took a chest rank from 84.67 to 27.35 (EN-01, reproduced live).

**Decision.**
1. The database's estimators are canonical, transcribed into `shared/strengthPercentile.ts` and pinned to its outputs. The Strength Level curves come from Strength Level's calculator protocol, so reading a set with that calculator is the protocol-matched choice (B057). Trends, the workout record and the competition comparison use the same estimator.
2. Muscle ranks are best historical: the client sends each exercise's strongest lifts by age-adjusted e1RM regardless of date; the server keeps each exercise's highest percentile for the aggregation. No database change was needed: sent one observation per exercise, the aggregation's confidence-first dedup has nothing to choose between.
3. A finished workout's observation is its strongest set by e1RM.

**Alternatives.** Changing the database aggregation's dedup order (a migration outside this assignment's authorization, B009) — unnecessary given (2). Keeping the card's mean estimator and changing the database — rejected; the database is the research side's record and the curves' own protocol.

**Not a regression.** Numbers on the card change for multi-rep sets (e.g. 100 kg × 5 → 112.5 kg; it was 114.58 on the card (mean) and 116.67 in trends (Epley)). Tests pinning the old estimator (`server/strengthPercentile.test.ts`, `powerliftingRank.test.ts`), the newest-30 rule (`muscleRankLifts.test.ts`, `ageAtLift.scoring.test.ts`) and the heaviest-set rule (`workoutStrengthRecord.test.ts`) were rewritten to the new values with the reason inline (B290).

**Touches.** B017, B056, B057, B061, B063, B083, B287; EN-01–EN-04, EN-18, EN-19.

## D-008 — Unrecorded effort (28 September 2026, batch 3)

**Finding.** No surface records reps in reserve. Missing RIR was silently equal to 0 in the card, and the database treats it as a set to failure with a confidence penalty (EN-06).

**Decision.** Keep the source protocol — a set without recorded effort is read as taken to failure, which makes the estimate and the placement a **floor** — and say so: the result carries `repsInReserve: null`, confidence drops by 0.08 as in the database, and the card adds "Read as a set taken to failure, because effort was not recorded; if reps were left in reserve, the lift places higher." A reported RIR is used as effective reps (e.g. 70 kg × 5 @ 2 RIR places at 53.26 against 43.68 unknown, both the database's numbers).

**Not done.** Collecting RIR in the tracker: a product decision about the live-set surface, outside the backend work. When it is added, `repsInReserve` already flows through the engine; the muscle-rank route does not yet send it (`supabaseStrengthProfile.ts`), noted for V2.

**Touches.** B059, B093, B253; EN-06.

## D-009 — What a logged weight means (28 September 2026, batch 4)

**Finding.** The database scores 40 dumbbell movements by one dumbbell and 50 bodyweight movements by reps alone, but the app said neither. The weight box read "Weight" for a dumbbell bench (entering the pair's total doubled the load: 43.10 → 95.00 in the bench trace), every lift was synced as `total_external_load`, and a pull-up with 20 kg added scored 15.71 — exactly as one without (reproduced live). Unloaded bodyweight sets never reached the muscle ranks at all (EN-07, EN-09).

**Decision.** The policy's convention per catalog exercise is copied into `shared/loadConventions.ts` and used everywhere a weight is entered, stored or sent: the box names what to enter; the observation and the sync carry the convention; a bodyweight movement goes to the muscle ranks as reps alone, and a loaded set of one is reported as not scored rather than ranked as if the load were absent. The policy wins over the catalog's equipment field (Chin-Up is "Free weights" in the catalog but scored on reps).

**Alternatives.** Route loaded pull-ups to `score_weighted_pull_chin_v1` — it has no curve for any catalog exercise, so it returns `estimated_only`. Fetch the policy at run time instead of copying it — a request per load for a table that changes with the research record, not with use; the copy is pinned by a test and names its source.

**Consequence carried forward.** Dumbbell sets logged before this change may be pair totals; nothing recorded which. They are read as the database reads them (one dumbbell). Laterality and variant context (B050) are still not recorded per set.

**Touches.** B025, B040, B049, B050, B051, B052, B244; EN-07, EN-09.

## D-010 — One coverage model for a Training Day (28 September 2026, batch 5) — intentional behavior change

**Finding.** The walkthrough's adductor gap read −11 on the panel and −15 in the full analysis because two formulas graded one target (B115; TR-01): catalog tag points (Model A) on the panel and picker, and exercise-genome involvement normalised to the day's most-worked muscle (Model B) in the analysis. Model B's "gap" moved when an exercise that does not train the muscle was added (adductors −7 → −15 after a hip thrust, TR-02). Since discovery, main already hands the panel's ratings to the analysis for its rows and tips; what remained was the analysis' own fallback to Model B, Model B's numbers labelled "coverage", a capped score that hid surpluses and contradicted its own state (TR-11), a picker ordered by tags rather than by what it closes (TR-13), four different set-count defaults for one unset prescription (TR-05), and two wrong catalog tags driving the adductor gap (TR-12).

**Decision.** Model A is the coverage model: it is the one with targets in its own unit. Model B stays as a separate, labelled measure — "relative involvement" — for the breakdown. Bands and deltas read the uncapped sum. The picker ranks by shortfall closed under Model A. All Training Day surfaces take one resolved prescription map. Leg Extension is tagged quads only (machine), Copenhagen Plank adductors first.

**Root cause of B115.** Formula, not scope or stale state: the two numbers were two models.

**Not done.** Set count in coverage (EN-11), a target revision (B109), per-exercise Model A contributions on screen (B107), planned vs completed exposure (B091, B117). Recorded for V2.

**Not a regression.** `StackAnalysisPage.test.ts` pinned the "% coverage" label on relative involvement and now pins "relative involvement" (B290).

**Touches.** B110, B112, B113, B114, B115, B119; TR-01, TR-02, TR-03, TR-05, TR-11, TR-12, TR-13.

## D-011 — Recommendations read the action, and respect the equipment (28 September 2026, batch 6) — intentional behavior change

**Finding.** (EN-12, EN-13.) The Matches list had no equipment input, so the saved equipment profile was not a hard constraint; the sport session filtered by equipment only after cutting each movement's list to ten. An action's demands were read by substring over its text *including the muscle list*, and an exercise "matched" a demand if it shared any quality with it — nearly every exercise has "strength", which sat in the push, pull, knee and posterior rules alike.

**Trace — wrestling overhook/whizzer (B132).**
- Text: "downward and inward shoulder-arm *pressure* with trunk rotation…"; muscles "*posterior deltoid*, latissimus dorsi, pectorals, obliques…"; family "anti-underhook and rotational clinch"; the movement's own gym cue: "one-arm cable rows, carries, and anti-rotation presses".
- Before: "pressure" matched `press` → **push**; "posterior deltoid" matched `posterior` → **hip extension**. Top picks: Split-Stance Cable Chest Press, Half-Kneeling Cable Chest Press, Alternating Landmine Press, landmine thruster and jerk.
- After: demands **rotation, pull** (from the action text only; `press` no longer matches "pressure"). An exercise meets a demand by a distinctive quality (not "strength", "hypertrophy", "power", "endurance"), or, for push, pull, overhead and grip, by a prime mover. Top picks: Cable Standing Punch, Cable Reverse Chop, Cable Single-Arm Bent-Over Row, Landmine Row, Meadows Landmine Row, Landmine T-Bar Row.
- Checked against other actions: sprawl → sled push, sled drag, sled sprint, carries; tackle absorption → medicine-ball passes and slams; tennis serve → punch, landmine press and jerk, medicine-ball throws; acceleration → depth drop, sled march, box jumps; snapdown → kettlebell snatch and rows. Matching lower-body demands on muscles was tried and rejected: it put hip abduction machines at the top of a sprawl.

**Equipment (B118, B120).** The profile filters candidates before ranking and before any cut in the Matches list, the sport session and the day's suggested fixes. The catalog stays whole for manual additions, as the profile screen already says.

**Not done.** Structured demand dimensions from the enriched action data (force direction, contraction, range: B129, B131), reason codes (B123), the breakdown's percentages that sit at 99 for most top picks, and redundancy/time/fatigue in ranking (B121). Recorded for V2.

**Touches.** B118, B120, B129, B130, B132; EN-12, EN-13.

## D-012 — One account's records stay its own on a shared device, and two devices never overwrite each other silently (28 September 2026, batch 7)

**Context.** The shipped build has no sign-in control (`directWorkspaceAccess = true`), so these defects are latent — but each one silently loses or leaks data the moment sign-in or plan sync is turned on.

**Decisions.**
1. **Plan, profile and favourites are read per account record, and nothing is written into a record before it has been read** (PS-01, PS-03). On an account change the in-memory plan is cleared when the new record is empty, the profile resets to defaults and re-reads, and favourites re-read. The app still opens without waiting for auth; it re-reads when the account resolves. Reproduced first: "sign out A, sign in B, and A's plan becomes B's" (`Home.accountSwitch.test.ts`, which fails against the old code).
2. **Plan sync is three-way** (SV-04, PS-04, PS-05). The device keeps, per account, the revision it last agreed with and a fingerprint of the plan then (`planSyncBase`). Only one side changed → that side wins; both changed, or no record of agreement and the copies differ → **conflict**: syncing stops, nothing is overwritten, and the athlete chooses "Keep this device's plan" or "Use the account's plan". The old hook adopted the account's revision on a conflict and pushed again 1.5 s later, overwriting the other device.
3. **The sport sent with synced lifts is the athlete's chosen one or none** (PS-14); the browsing fallback (wrestling) was written as every general athlete's sport.

**Deferred to the owner.**
- **Workout history, typed lifts, body-weight log and the lift sync queue stay device-level** (PS-02, SV-06). Scoping them per account needs an ownership decision for history already on devices (B175) and an explicit guest-import step (B174, PS-17). With no sign-in in the build every record belongs to the one device user. **Before sign-in ships, this is launch-blocking.**
- **Preview and development builds use the production Supabase project** (PS-14, second half). `VITE_SUPABASE_URL` is configured to the production project for production, preview and development alike, and the client falls back to the production publishable key. Isolating previews needs a separate Supabase project or branch — an environment decision, not made here (B009).

**Touches.** B019, B163, B171, B173, B174, B175, B177, B262; PS-01, PS-02, PS-03, PS-04, PS-05, PS-14, SV-04, SV-06.
