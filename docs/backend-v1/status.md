# Backend V1 status

One row per requirement in `docs/backend-v1/brief.md` (copied unchanged from the owner's brief of 27 September 2026). This file is the resumable record (B010, B011): update a row's status and evidence as the work lands, never delete a row.

**Status vocabulary (B012):** `pending` · `implementing` · `implemented-unverified` · `verified` (evidence attached) · `blocked` (dependency named) · `deferred (owner)` · `deferred` (rationale given) · `confirmed-existing` (pre-existing behaviour checked, not changed by this assignment — B014).

## Owner decision: payments deferred

On 27 September 2026 the owner (Gabe Naim) directed: skip Section 12 (B196–B220), Gate C (B276–B279) and the other payment-specific tasks, and record them as **deferred by owner** — not incomplete, and not launch-blocking for this assignment. That covers:

- **Section 12, iOS subscriptions and grandfathered pricing:** B196–B220, in full.
- **Gate C, payments:** B276–B279, in full.
- **B189** (account deletion must not imply a cancelled App Store subscription), in full.
- **The payment portion only** of B184, B185, B194, B238, B239, B240 and B283; the rest of each stays in scope and is tracked on its row.
- The purchase-entitlement example in the §1 P0 row, §17 step 6 (purchase entitlement integration) and §19 item 5 (subscription status) of the final report.

## Summary

<!-- summary:start -->
298 requirements.
- `pending`: 121
- `implementing`: 58
- `verified`: 80
- `blocked`: 9
- `deferred (owner)`: 30
<!-- summary:end -->


## 0. What V1 means

_No requirement IDs in this section._

### Product intent

_No requirement IDs in this section._

### Non-negotiable execution rules

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B001 | Read the whole brief and existing repository instructions before editing. | verified | Read the whole brief (copied to docs/backend-v1/brief.md). The repository has no CLAUDE.md or AGENTS.md; .claude/settings.json (permission allowlist) and the prior program convention in docs/ux-correction/ (copied brief + progress file) were read and followed. |
| B002 | Identify the current repository, branch, database project, environments, deployed app, and actual iOS integration status. | verified | Repository LocalForgeWeb/Sports-genome; work branch claude/training-day-navigation-workouts-83ro2c merged to main by PR; databases: Supabase project qiccnqkypbhlwpmjcsri (reference data, service-role reads) and MySQL via DATABASE_URL (accounts, unreachable from the work environment); environments: Vercel production sports-genome-mauve.vercel.app plus per-branch previews, no staging; iOS: no native shell on main, Capacitor work only on an unmerged branch with unrelated history (decisions D-003). |
| B003 | Inventory existing engines before adding new ones. Reuse and improve compatible modules. | verified | Engines inventoried before any change (inventory/engines.md). Existing modules repaired in place; the database's estimators were transcribed and pinned rather than a new engine written (D-007). No parallel engine added. |
| B004 | Preserve user data, source provenance, canonical IDs, migration history, and unrelated work. | implementing | No user record deleted or rewritten destructively: legacy units stamped once and flagged (D-005); per-account keys read before written (D-012); prepared migrations are additive with rollback. Open: PS-21 destructive load fallbacks (malformed plan overwritten, unknown sport discarded) remain from before V1. |
| B005 | Never mark work verified on the basis of code inspection alone when a runtime or calculation test is required. | verified | Every verified row cites a test run, a live query or a production probe; items supported by code reading alone are implementing or blocked (e.g. MySQL paths, SV-05). |
| B006 | Do not invent scientific coefficients, supporting studies, database contents, or successful tests. | verified | Every coefficient in changed code comes from the database or a cited source and is pinned by a test (strengthPercentile.parity, loadConventions, age tests). Unsourced pre-existing aggregation coefficients are flagged, not tuned (EN-17). Fixtures use real registry values where they claim to. |
| B007 | Continue through authorized implementation and verification; do not stop after producing a plan. | verified | Ten implementation batches merged and deployed (#68-#77); each ends in tests, a build and a production deploy. |
| B008 | Treat absent access as a specific blocker. Complete independent work, state exactly what remains unverified, and do not pretend production was… | verified | Blockers named with what remains unverified: MySQL unreachable (account paths mock-tested only), no iOS shell (D-003), Supabase migrations not applied (D-013), production server latency not measured (performance.md). |
| B009 | Do not perform destructive production changes or deploy outside existing authorization. Prepare concrete migrations and evidence first. | verified | No production change or deploy outside authorization: Supabase fixes are prepared and proven locally in supabase/prepared/backend_v1 (not in supabase/migrations, which a GitHub integration could apply). App deploys go through the owner-established Vercel flow. D-013. |
| B010 | Maintain a resumable work record. Large task size is not a reason to forget partially completed requirements. | verified | status.md (every B-ID), verification.md checkpoints and decisions.md carried the work across several context resets without loss. |

## 1. Priority and deliverables

_No requirement IDs in this section._

### Priority classes

_No requirement IDs in this section._

### Required durable artifacts

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B011 | Create or extend these records without duplicating an equivalent existing tracking system. | verified | Records live in docs/backend-v1/ (brief, inventory, contracts, decisions, status, verification, performance, handoff); no second tracker. |
| B012 | Give each requirement one of: pending, implementing, implemented-unverified, verified, blocked, or explicitly deferred with rationale. | verified | Every one of the 298 IDs has exactly one row and one status from the vocabulary above; status_tool.py refuses unknown statuses and refuses to reopen an owner-deferred row. |
| B013 | Attach evidence to verified items and dependency information to blocked items. | verified | Verified rows carry evidence; each blocked row names its dependency (owner authorization for the prepared migrations, iOS shell, MySQL access). |
| B014 | Separate what this assignment actually changes from pre-existing behavior it merely confirms. | implementing | Decisions separate Finding (pre-existing) from Decision (this assignment); intentional changes are labelled. Not every confirmed-existing behaviour has its own status row. |

## 2. Discover the real system first

_No requirement IDs in this section._

### Discovery checklist

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B015 | Inventory tables, views, functions, triggers, jobs, Edge Functions, exposed schemas, storage buckets, and relevant policies. | verified | docs/backend-v1/inventory/supabase.md (tables, views, functions, triggers, cron, Edge Functions, storage, policies, grants, advisors) and inventory/server.md (MySQL schema, migrations 0000-0010, every tRPC procedure). |
| B016 | Identify existing norm, eligibility, muscle-effect, sports-transfer, and strength-engine components. Treat historical names such as… | verified | inventory/engines.md: norm routes (research band, strength_beta_v1 curves, powerlifting, Piper, registry), eligibility views, muscle aggregation (aggregate_muscle_strength_v1), sport transfer, and the DB muscle-effect engine the app never calls. |
| B017 | Identify calculations duplicated in SQL, server functions, frontend utilities, or hardcoded component logic. | verified | Duplicates identified in inventory/engines.md; the three e1RM implementations are now one (shared/strengthPercentile.ts estimateOneRepMax, used by shared/oneRepMaxEstimation.ts). D-007. |
| B018 | Inventory research datasets with current row counts, eligible counts, review reasons, source revisions, and actual app consumption. Historical… | verified | inventory/supabase.md research datasets: row, eligible and review-status counts per family (e.g. 3,512 strength_norms; app_strength_beta_curves_v1 1,480 rows all Strength Level, 1,220 blocked + 260 without eligibility rows). |
| B019 | Identify mock, seed, placeholder, and fallback values that can reach a real account. | verified | inventory/persistence.md PS-14. The 'wrestling' fallback no longer reaches synced lifts (athleteSync.sport.test.ts); the production Supabase project used by preview/dev builds is an owner environment decision (D-012). |
| B020 | Identify where local storage is authoritative, where server storage is authoritative, and where the app currently mixes them. | verified | inventory/persistence.md authority table: everything day-to-day is device-local (directWorkspaceAccess = true); MySQL holds plan (sync), priorities and dormant session APIs; Supabase receives lift sync only. |
| B021 | Record current schema/library/runtime versions and verify applicable current documentation before using version-dependent APIs. | implementing | Versions recorded in inventory.md § Versions. Current documentation is checked when a version-dependent API is used; noted per change in verification.md. |
| B022 | Establish representative baseline fixtures and outputs before modifying calculations. | implementing | Suite/typecheck baseline recorded in verification.md; per-engine numeric baselines are added before each calculation change. |
| B023 | List current failures and uncertain behavior separately. Do not present an untested hypothesis as a confirmed defect. | verified | Every inventory finding is labelled CONFIRMED (with the test, probe or query) or HYPOTHESIS. |

## 3. Establish canonical data semantics

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B024 | Preserve submitted measurements separately from normalized values and derived estimates. | implementing | Device sets keep the weight as typed and its unit; kg is derived on read, never stored in their place (contracts.md § Logged weights and units). Account-side tracker rows already store weightUnit; typed tests audited with EN-03/04. |
| B025 | Store explicit units, load convention, side/laterality, exercise variant, and equipment context where needed. | implementing | Units per set and session (batch 2) and the policy's load convention per exercise, carried on each observation and in sync (D-009, shared/loadConventions.ts). Laterality and variant context are still not recorded per set. |
| B026 | Distinguish unknown from zero and not-applicable from missing. | pending |  |
| B027 | Define completed, skipped, warm-up, working, failed, and deleted observations consistently with the existing product. | pending |  |
| B028 | Record event time and ingestion time separately where offline sync or delayed imports matter. | pending |  |
| B029 | Define user timezone, date boundaries, and week-start behavior; do not infer the workout date from UTC ingestion alone. | pending |  |
| B030 | Keep historical bodyweight and relevant profile context available for historical calculations. Do not silently apply today's weight to every past… | pending |  |
| B031 | Preserve the recorded context when a user later changes age-related information, sex/reference-population choice, sport, or experience. | implementing | Each lift is placed at the age on its own day, so a birth year given later re-reads every lift correctly (D-002, ageAtLift.scoring.test.ts); body weight at completion is frozen per session. Server-side, derived entry context becomes immutable only with prepared migration 20260928120200 (D-013). |
| B032 | Enforce referential integrity and correct ownership across child rows, not just parent records. | blocked | Fix prepared and proven: 20260928120100 (check-in parent ownership) and 20260928120300 (no client state writes). validation/before.sql shows B attaching to A's focus area; after.sql shows it refused. Applying needs owner authorization (B009). |
| B033 | Define stable operation IDs and revision/conflict handling for retryable writes. | implementing | Plan save: revision check and write are now one statement; a lost race returns conflict, concurrent first saves return one save and one conflict (0afbd64, server/workoutPlanSync.atomic.test.ts renders the real WHERE). Remaining: operation ids for workout start/complete and observation writes (SV-05, dormant MySQL routes), Supabase lift sync (PS-09). |

### Input validation

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B034 | Reject non-finite numeric values, invalid unit codes, malformed IDs, impossible timestamps where relevant, and structurally invalid records. | pending |  |
| B035 | Validate negative values by field meaning: negative added load may represent assistance only through an explicit supported convention, not a… | pending |  |
| B036 | Define permissible combinations for reps, duration, distance, assistance, and load by exercise/test protocol. | pending |  |
| B037 | Confirm unusually large entries without silently clamping legitimate user input. | pending |  |
| B038 | Return actionable structured validation errors while preserving the user's unsaved input. | pending |  |

## 4. Shared calculation contracts

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B039 | Establish a typed boundary for each engine and validate requests/responses at external boundaries. | pending |  |
| B040 | Define unsupported and partial outcomes explicitly. Do not return an ordinary success score with hidden fallback behavior. | implementing | Explicit outcomes added: added_load_not_scored and load_required instead of an ordinary score with the load ignored; estimated_only and failures stay visible in unranked. Wider audit of fallbacks continues. |
| B041 | Separate numerical uncertainty, evidence quality, data completeness, and protocol compatibility; they are not interchangeable confidence concepts. | pending |  |
| B042 | Do not invent numeric confidence percentages unless the method has a defensible calibration. Categorical confidence with reason codes is acceptable. | pending |  |
| B043 | Include stable reason codes so the frontend can explain results without parsing prose. | pending |  |
| B044 | Specify rounding at display boundaries; compare and aggregate with appropriate underlying precision. | verified | Placement and banding use unrounded values; e1RM kept to 3 dp as the database places it; the card rounds only for display (ordinal). EN-19 fixed. contracts.md § Estimated 1RM and placement. |
| B045 | Define tie-breaking for equally ranked results and guarantee deterministic order. | pending |  |
| B046 | Include relevant input/data/model versions in cache invalidation. Do not treat a user ID alone as a sufficient calculation cache key. | pending |  |
| B047 | Keep raw events immutable where useful and version derived results so later recalculation does not erase original evidence. | pending |  |

## 5. Strength Genome: measurement to comparison

_No requirement IDs in this section._

### 5.1 Load and protocol normalization

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B048 | Normalize compatible units without losing original entry units. | verified | Entry unit kept on every set; kg derived exactly; sync sends the original value and unit. Tests: client/src/lib/deviceWorkoutLog.units.test.ts, DeviceWorkoutTracker.units.test.ts. D-005 for pre-existing history. |
| B049 | Make total-load versus per-hand conventions explicit and test both. | verified | Conventions explicit per exercise and tested: per implement, per hand, total, machine, bodyweight reps (server/loadConventions.test.ts, setEntryFields.test.ts, StrengthGenomePanel.weightUnit.render.test.ts). contracts.md § Load conventions. |
| B050 | Distinguish unilateral results, bilateral totals, and paired dumbbells; do not double every unilateral entry. | implementing | Paired dumbbells are entered and scored per implement (the database's convention), never doubled. Unilateral vs bilateral laterality is still not recorded per set. |
| B051 | Treat assistance as assistance. More assistance for the same task must not be ranked as greater unassisted performance. | implementing | Assistance is free text and never scored, so it cannot be ranked as performance; assisted exercises have no scoring policy. No numeric assistance convention exists yet (B246 depends on one). |
| B052 | Preserve bodyweight-exercise conventions. Do not assume every push-up or dip moves exactly full bodyweight through an equivalent external-load… | verified | Bodyweight movements are scored on reps alone, never converted to an external load; a loaded set is reported as added_load_not_scored. Tests: supabaseStrengthProfile.test.ts 'A movement scored on reps', muscleRankLifts.test.ts. |
| B053 | Do not apply a universal machine-to-free-weight conversion. Preserve machine/protocol specificity and mark unsupported comparisons explicitly. | pending |  |
| B054 | Keep range-of-motion, paused/touch-and-go, grip, tempo, and equipment differences where the reference actually depends on them. | pending |  |
| B055 | Define which observations are eligible for strength inference and why others are excluded. | pending |  |

### 5.2 Estimated maximum and observation selection

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B056 | Inventory existing estimated-maximum methods, coefficients, supported rep ranges, and eligible exercise families. | verified | contracts.md § Estimated 1RM and placement: both database estimators, coefficients, rep and RIR ranges, confidence tables, and which exercises get which (get_strength_e1rm_estimator_v1). |
| B057 | Verify formulas against their actual sources and intended protocols before broad application. | implementing | TS transcription verified against the database's own outputs (server/strengthPercentile.parity.test.ts, 10 sets within 0.005 percentile). The database's claim that its blend matches Strength Level's public calculator is not yet checked against that calculator. |
| B058 | Do not run a repetitions-to-maximum formula on timed carries, jumps, distance tests, or isometric holds without a separate supported method. | pending |  |
| B059 | Define handling of effort/RIR when available; missing effort must not silently become maximal effort. | verified | Unrecorded RIR is explicit (repsInReserve: null), read as the source protocol's set to failure, costs 0.08 confidence, and the card states the assumption and that the estimate is a floor. D-008. Test: strengthPercentileCard.effort.test.ts. |
| B060 | Define how warm-ups, failed repetitions, partial sets, implausible records, and imported entries affect eligibility. | pending |  |
| B061 | Document whether the product shows best historical, recent best, or another estimator. Keep those concepts separate. | verified | contracts.md § Which observation counts: muscle ranks are best historical by percentile; the card and Progress read the lift in view or a trend's latest; a workout contributes its strongest set. |
| B062 | Preserve sample count, recency, and source-observation IDs behind the displayed result. | pending |  |
| B063 | Avoid accidental score decreases caused only by adding a weaker record to a best-performance summary; if a rolling estimator behaves differently,… | verified | Adding a weaker lift cannot lower a muscle rank: server keeps the best percentile per exercise (live repro 84.67 -> 27.35 fixed), client sends each exercise's strongest lifts. Tests: supabaseStrengthProfile.test.ts 'Which observation speaks for an exercise', muscleRankLifts.test.ts. |

### 5.3 Reference population and adjustments

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B064 | Identify the intended comparison population for each norm family: general population, trained people, athletes, competitors, or another defined… | pending |  |
| B065 | Do not treat powerlifting competitors as the default population for all exercises or all users. | verified | Competitor rank removed from the default panel; the competition comparison appears only for an exact competition-context match. D-004. Tests: StrengthGenomePanel.rankGate.test.ts (7), StrengthGenomePanel.registryReference.render.test.ts. |
| B066 | Separate direct exercise-specific references from transferred or adjusted references. | implementing | Unit parsing fixed for protocol-suffixed units (lb_10rm): female Piper 2022 10RM rows now match on unit when the population is declared (normsReference.test.ts). Direct vs transferred references otherwise unchanged; women's declaration route needs the 2022 protocol reviewed (D-014). |
| B067 | Audit age, sex/reference-population, bodyweight, and training-status effects already present in the source so they are not applied twice. | pending |  |
| B068 | For each multiplier or interpolation, record equation, source, applicable domain, direction, assumptions, and validation cases. | pending |  |
| B069 | Apply an adjustment at a defined stage—observed metric, expected metric, distribution parameters, or another explicit layer. Do not multiply a… | pending |  |
| B070 | Test age-boundary continuity and behavior at the edges of the supported range. Do not extrapolate outside the domain silently. | verified | Age table edges tested: unadjusted and explained at 14, no extrapolation beyond the curve (censored), unadjusted without a birth year (server/strengthPercentile.age.test.ts, pinned to database outputs; D-002). |
| B071 | Verify whether bodyweight normalization uses a ratio, allometry, weight classes, regression, or another source-supported model. Avoid double… | pending |  |
| B072 | Keep experienced-athlete expectations distinct from measured capability; do not automatically raise someone's performance score because they… | pending |  |
| B073 | If a direct comparison is unavailable, use a clearly identified estimate only when the transfer method is defensible; otherwise return unsupported… | pending |  |

### 5.4 Percentiles and rank labels

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B074 | Specify whether the reference provides an empirical distribution, percentiles, quantiles, means/SD, or only category thresholds. | pending |  |
| B075 | Do not fabricate a normal distribution solely because mean and SD are convenient; justify the distribution or avoid overprecise percentile output. | pending |  |
| B076 | Distinguish a true reference percentile from a normalized product score or rank band. | implementing | Muscle score is labelled as read through lifts, with its ceiling stated (How ranks work, data-muscle-rank-ceiling); National/World Stage unreachable for muscles is disclosed. Re-mapping bands is an owner decision (D-014). |
| B077 | Handle lower-is-better metrics correctly, including completion time. | pending |  |
| B078 | Preserve canonical rank identifiers and approved display mapping unless an independently justified change is required. | verified | Canonical rank ids and the approved display mapping are unchanged (capabilityRank.test.ts pins the seven ids and bands). The muscle ceiling is disclosed rather than re-mapped (D-014). |
| B079 | Verify threshold inclusivity at every rank boundary and keep rounding from moving an underlying score across the wrong boundary. | implementing | Piper 2021 preacher-curl bands made contiguous with an explicit inclusive/exclusive rule and a stored-value tolerance (shared/piper2021PreacherCurlReference.ts bandFor; client/src/lib/piper2021PreacherCurlReference.test.ts). Remaining rank boundaries reviewed with EN-16. |
| B080 | Keep unranked/pending separate from the lowest rank. | verified | Confirmed existing and kept: an invalid or missing value returns no rank, never Prospect; a region with no scored muscle is absent and drawn Not scored (capabilityRank.test.ts, StrengthGenomeBodyMap.rank.render.test.ts). |
| B081 | Produce numeric traces for representative high, medium, low, missing-context, and unsupported performances. | implementing | Traces recorded: bench across ages 15-50 (D-002), chest 27.35 vs 84.67 (D-007), dumbbell and pull-up (D-009), P95 ceiling 94.79 and stabilizer muscles (D-014), female 10RM band (normsReference.test.ts). No single table of high/medium/low/missing/unsupported yet. |

### 5.5 Muscle-region strength inference

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B082 | Document the mapping from eligible exercise performances to each region. | pending |  |
| B083 | Prevent repeated copies of the same lift or tightly correlated variants from falsely creating independent evidence. | implementing | Identical lifts sent once; one observation per exercise reaches the aggregation; correlated variants decay by movement pattern in the database (0.55). Variant-level correlation (e.g. two bench variants) not yet reviewed. |
| B084 | Keep primary muscle contribution, stabilization, and normative comparability distinct. | implementing | Stabilizer-only muscles are no longer ranked (isStabilizerOnly, capabilityRank.test.ts; live trace bench P80 -> serratus 55.11, infraspinatus 53.91). Primary vs secondary contribution weighting remains the DB aggregation's (EN-17 coefficients unsourced). |
| B085 | Define region aggregation and confidence rules rather than averaging unrelated exercise percentiles by default. | implementing | Region = best-evidenced muscle, never a blend; stabilizer-only muscles excluded (contracts § Muscle ranks on the map). Aggregation coefficients themselves are the database's and unsourced (EN-17). |
| B086 | Preserve left/right asymmetry when supported; do not generate a weaker-side score from missing side data. | pending |  |
| B087 | Explain which observations drive a region result and which regions lack enough evidence. | pending |  |
| B088 | Keep coverage-of-records and rank strength as separate outputs, eliminating misleading loading-state color changes. | pending |  |

## 6. Muscle Effect engine: prescription and execution

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B089 | Inventory existing dimensions and specify their meaning, scale, units or unitless status, and intended use. | pending |  |
| B090 | Separate exercise-level attributes from prescription-level modifiers and observed-execution modifiers. | pending |  |
| B091 | Keep planned stimulus and logged stimulus distinct. An unperformed prescription must not become completed training exposure. | pending |  |
| B092 | Define the effect of set count, repetition scheme, load/relative intensity, effort, range, contraction type, and muscle role where supported. | pending |  |
| B093 | If a field is absent, expose the actual default/assumption and its consequence. Do not assume unreported RIR equals zero. | verified | The card names the default (read as a set to failure) and its consequence (the lift places higher if reps were left in reserve). strengthPercentileCard.effort.test.ts. |
| B094 | Audit for double counting when exercise tags and prescription modifiers encode the same characteristic. | pending |  |
| B095 | Keep prime mover, synergist/supporting, and stabilizer roles explicit; stabilizer involvement must not automatically count as a full hypertrophy set. | implementing | Stabilizer-only muscles no longer receive a rank from the lifts that steady them (D-014). Role weighting inside the database aggregation unchanged. |
| B096 | Allow multiple muscles to receive contribution without treating contribution weights as a mandatory probability distribution summing to one unless… | pending |  |
| B097 | Keep volume-load calculations within compatible units/protocols. Do not aggregate kilograms, seconds, and meters into a physically meaningless… | pending |  |
| B098 | Do not infer growth in grams, injury probability, or exact recovery hours from heuristic effect points. | pending |  |
| B099 | Keep fatigue cost separate from useful stimulus; adding work may increase one while providing diminishing benefit in another. | pending |  |
| B100 | Preserve side-specific exposure and define how unilateral sets count for whole-session and per-side summaries. | pending |  |
| B101 | Record whether coefficients are empirical, transferred, expert-authored, or product heuristics. Heuristic does not mean hidden. | pending |  |
| B102 | Verify saturation/diminishing-return functions where used. Test their actual mathematical properties instead of assuming more always increases… | pending |  |

### Evidence interpretation

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B103 | Match evidence to the claim being supported. An acute activation measurement alone does not establish long-term hypertrophy magnitude. | pending |  |
| B104 | Preserve study population, intervention/protocol, outcome, and source location for important coefficients. | pending |  |
| B105 | Keep incompatible outcome measures separate unless a documented transformation is justified. | pending |  |
| B106 | Distinguish an evidence-supported exercise trait from an empirically calibrated per-user prediction. | pending |  |
| B107 | Provide inspectable per-exercise/per-muscle contributions so a reviewer can explain a result without reverse engineering the whole engine. | pending |  |

## 7. Workout coverage, targets, and recommendations

_No requirement IDs in this section._

### 7.1 Coverage semantics

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B108 | Identify the source of day/week targets and whether they depend on split, goal, schedule, sport, and user preferences. | verified | Targets are constants per split label (splitStackAnalysis.ts requirements); they do not depend on goal, schedule, sport or preference. Stated in contracts.md § Training Day coverage. |
| B109 | Store or reconstruct the target revision used by a result. A changed target must not masquerade as changed training. | verified | Targets carry revision split_targets_v1 on every analysis (targetRevision); splitStackAnalysis.revision.test.ts fingerprints the targets and fails if one changes without a new revision. contracts.md § Training Day coverage. |
| B110 | Define per-muscle contribution, target, shortfall, surplus, and global aggregation separately. | verified | Contribution, target, reached, shortfall/surplus and the day score are defined separately (contracts.md § Training Day coverage) and computed separately in splitStackAnalysis.ts / stackCoverageVisual.ts. |
| B111 | Specify behavior for zero targets and missing targets; avoid division by zero and invented perfect scores. | pending |  |
| B112 | Define whether oversupply can compensate for a different missing muscle. Do not let that happen accidentally through simple totals. | verified | Each target's share is capped before averaging, so a surplus cannot offset another muscle's gap; a gap moves only with work on that muscle. coverageConsistency.test.ts 'A surplus does not pay for a gap', TR-02 case. |
| B113 | Explain any caps, weights, penalties, and saturation. Preserve per-region gaps alongside the headline score. | verified | Weights (56/24) and the display cap are stated in the panel boundary text and the contract; the cap now applies to bar length only, so surpluses are shown (TR-11). coverageConsistency.test.ts. |
| B114 | Use the same calculation snapshot for summary and detailed analysis. | verified | Panel, full analysis and picker read one analyzeSplitStack snapshot; the analysis receives the panel's ratings or computes the same analysis. contracts.md § Training Day coverage. |
| B115 | Reproduce the walkthrough's 11-point versus 15-point adductor-gap discrepancy if possible. Determine whether it is scope, stale state, or formula… | verified | Reproduced in discovery (TR-01: Model A -11 vs Model B -15, browser and numeric). Root cause: formula - two coverage models graded one target. One model now (D-010); the analysis never grades from relative involvement. coverageConsistency.test.ts, StackAnalysisPage.test.ts. |
| B116 | Ensure edit, add, remove, reorder when relevant, and Undo invalidate exactly the necessary derived results. | implementing | Edits and Undo write through one path (batch 1); every Training Day surface now reads one resolved prescription map and one coverage snapshot, recomputed from the committed day (batch 5). |
| B117 | Distinguish planned weekly coverage from completed weekly exposure in API contracts and UI consumers. | pending |  |

### 7.2 Recommendation utility

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B118 | Define candidate eligibility before ranking: equipment, selected day, supported movement, user exclusions, time, and other actual constraints. | implementing | Equipment eligibility applied before ranking (D-011). Exclusions and time as eligibility filters are not yet modelled. |
| B119 | Calculate candidate marginal effect against the current snapshot and a specified candidate prescription. | implementing | Picker ranks by the shortfall a candidate closes under the current snapshot (TR-13). The candidate's prescription does not enter because coverage ignores set count (EN-11). |
| B120 | Separate hard constraints from preferences. A recommendation should not violate a hard equipment restriction just to improve a score. | verified | Saved equipment is a hard constraint for every automatic recommendation (Matches, sport session, the day's suggested fixes), applied before ranking and cut; manual catalog browsing stays whole. D-011. Test: movementRecommendations.constraints.test.ts. |
| B121 | Consider redundancy, session time, and fatigue cost where the existing model supports them. | pending |  |
| B122 | Prevent duplicate candidates arising from aliases; distinguish legitimate variants. | pending |  |
| B123 | Provide reason codes such as closes target gap, supports selected sport demand, available equipment, or lower redundancy. | implementing | Picker results carry why they rank: fillsGap (closes a target gap directly), supportsGap, closesPoints; equipment is a hard filter before ranking (batch 6). Typed codes for sport demand and redundancy are V2. |
| B124 | Explain infeasible requests rather than generating impossible plans. | pending |  |
| B125 | Preview a generated/replacement plan before committing; preserve the current plan unless the user accepts replacement. | pending |  |
| B126 | Make recommendation order deterministic for a fixed snapshot, or expose/control the seed if diversity is intentional. | pending |  |
| B127 | Re-evaluate after a candidate is added; the next suggestion should reflect the new plan. | pending |  |

### Worked arithmetic fixture — deliberately synthetic

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B128 | If this model is adopted, verify the fixture independently. If a different existing model is retained, supply an equally explicit fixture for that… | pending |  |

## 8. Sports Transfer mapping

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B129 | Map sport/action IDs to actual demand dimensions: force direction, contraction, range, timing, stability, coordination, or others already supported. | implementing | Demands now come from the action text only, and an exercise meets one by a distinctive quality or, for upper-body patterns, a prime mover (D-011). Structured force-direction/contraction/range dimensions are not yet used. |
| B130 | Keep physical demand mapping separate from superficial movement resemblance. | implementing | Muscle names no longer create action demands (the whizzer's 'posterior deltoid' read as hip extension); muscle overlap is scored separately. Further separation depends on structured demand dimensions (B129). |
| B131 | Define how exercise capacity profiles match demands and how training goal changes the weighting. | pending |  |
| B132 | Trace at least one wrestling action, such as the currently shown overhook/whizzer, through demands, candidates, rationale, and prescription context. | verified | Overhook/whizzer traced through text, demands, candidates and rationale before and after the fix in decisions.md D-011, with five other actions checked. |
| B133 | Keep direct evidence, mechanistic inference, and expert-authored mappings distinguishable. | pending |  |
| B134 | Do not assign a causal transfer percentage when the evidence only supports a relevance score. | pending |  |
| B135 | Verify that selecting a new sport/action updates filters and explanations without retaining the previous context. | pending |  |
| B136 | Provide a coherent non-sport/general-training path; absence of a sport is not an error. | implementing | General mode is a first-class choice (no sport sent with lifts, PS-14; 'General strength and resilience' label). The movement explorer still defaults to the first sport for browsing. |
| B137 | Treat self-reported limitations and training priorities as explicit inputs, not automatically diagnosed injuries. Preserve supported exclusions… | pending |  |
| B138 | Explain why the top recommendations differ from the next candidates and which constraints affected the ranking. | pending |  |

## 9. Reference data, eligibility, and evidence releases

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B139 | Audit evidence eligibility by normative family and protocol, not only row by row or by global switch. | pending |  |
| B140 | Preserve provenance, population, test protocol, units, outcome direction, sample information, and transformation history. | implementing | Units keep their protocol suffix end to end and are checked against the row's repetition count before conversion (D-014). Transformation history beyond unit conversion is not recorded. |
| B141 | Keep exact exercise matches separate from aliases, related movements, and inferred transfers. | pending |  |
| B142 | Detect duplicated studies/data reported across multiple sources; do not inflate evidence volume by counting copies as independent samples. | pending |  |
| B143 | Record promotion/rejection reasons and the revision in which they changed. | pending |  |
| B144 | Validate source completeness and licensing/usage constraints where applicable before promoting an external dataset. | pending |  |
| B145 | Compare candidate reference releases against a frozen benchmark fixture set before activation. | pending |  |
| B146 | Quantify which outputs change, by how much, and for which reference families; investigate large unexpected movements. | pending |  |
| B147 | Preserve rollback to the previous reference release without deleting newly collected raw evidence. | pending |  |
| B148 | Expose concise evidence/reason metadata to app consumers while keeping large research payloads out of routine screen requests. | pending |  |
| B149 | Keep personal user records separate from research norms and aggregate community data. | pending |  |
| B150 | Do not automatically feed early users into population norms. Document opt-in/permission, deduplication, outlier handling, selection bias, and… | implementing | Entries without a sport, and entries whose derived context was edited, no longer reach the benchmark pool (prepared migrations). The pool stays opt-in and inactive (active_for_percentiles false) as found; its full documentation is V2. |

## 10. Plans, sessions, events, and reliable persistence

_No requirement IDs in this section._

### 10.1 Separate intention from history

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B151 | Keep plan templates and actual workout sessions separate. Editing tomorrow's prescription must not rewrite yesterday's performed sets. | pending |  |
| B152 | Capture appropriate plan lineage/snapshot when a workout starts, using the existing architecture. | pending |  |
| B153 | Define explicit session transitions: planned/not-started, active, completed, abandoned, and any existing additional states. | pending |  |
| B154 | Make start/finish retry-safe so double taps or network retries do not create duplicate sessions or completion counts. | verified | Start picks up a session already running instead of opening a second (double taps were already guarded); Finish reads the stored copy and refuses to complete a session already finished. Tests: DeviceWorkoutTracker.tabs.test.ts. |
| B155 | Define what counts as a completed workout, logged lift, and completed set. Use the same definitions in Home, Progress, and Strength. | verified | Definitions in contracts.md § Counts, implemented once (isCompletedSet, isCompletedWorkout, recordedLifts) and used by Home, Progress and Strength. Tests: athleteRecord.test.ts, DeviceWorkoutTracker.tabs.test.ts (empty finish records nothing). D-006. |
| B156 | Do not count a saved plan as a completed workout or a prescribed set as a logged observation. | verified | An empty finish stores nothing; stored empty sessions are not counted; a planned set is never a completed set; trainingStateByDayLabel no longer marks a day trained by an empty finish. |
| B157 | Resolve Home's next workout from explicit plan/session rules rather than array position or a stale cached selection. | pending |  |
| B158 | Keep an in-progress workout resumable across route changes and app restarts. | verified | Active session restored on mount with a resume cue (DeviceWorkoutTracker.live.test.ts resume cases); another tab's writes are picked up via the storage event and never overwritten (DeviceWorkoutTracker.tabs.test.ts). |
| B159 | Define deletion/correction of a historical set and its effect on aggregates, records, and derived results. | pending |  |

### 10.2 Reliable add, remove, reorder, and Undo

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B160 | Bind operations to stable week/day/session IDs, not visible labels or a mutable global selected index. | implementing | Plan edits and Undo now go through editDay(dayKey, …) keyed on the stable day key, not the open day; reorder uses moveWithin by entry id. Week binding and session ids are reviewed with plan sync in batch 6. |
| B161 | Distinguish a duplicate network request from the user intentionally adding another instance of an exercise. | pending |  |
| B162 | Make Undo reference the exact operation/instance it reverses. | verified | Every Undo captures the day key at the time of the edit and reverses only that entry; draft Undo refuses when the day changed after the draft. Test: client/src/pages/Home.undoAndLoading.test.ts. |
| B163 | Prevent Undo from deleting another user's change or an independently edited record without conflict handling. | implementing | Plan sync no longer overwrites another device's plan on a conflict (it stops and asks). Undo acting on another user's record is covered by per-account records; Undo against a remotely edited plan is not specifically guarded. |
| B164 | Make multi-row mutations atomic where partial success would corrupt the plan. | pending |  |
| B165 | Preserve ordering deterministically and handle concurrent reorder/edit operations explicitly. | pending |  |
| B166 | Return authoritative destination, count, and revision after mutation so feedback and downstream calculations agree. | pending |  |

### 10.3 Offline and local-to-account sync

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B167 | Document which actions work offline and which require verification/network access. | pending |  |
| B168 | Use durable pending operations with stable IDs where offline writes are supported; survive app termination before sync. | implementing | The lift sync queue keeps unmappable lifts pending across restarts (localStorage) instead of dropping them (strengthSyncQueue.unmappable.test.ts); stable ids ride with the client_op_id migration. |
| B169 | Distinguish saved locally, syncing, saved to account, failed, and conflicting states. | implementing | Refused finish stays open (batch 1). Plan sync shows a real conflict state with both choices. A device-store athlete is no longer told their sign-in expired (D-015). Offline is still silent; per-record 'saved to account' states for history are not built. |
| B170 | Reconcile retries idempotently; an app restart during sync must not duplicate sets. | blocked | Idempotent lift sync prepared: client_op_id unique per user (20260928120500, proven: a resent lift is ignored) with the paired client upsert recorded in the README. Needs the migration applied first. |
| B171 | Define conflict rules for two-device edits. Do not choose last-write-wins everywhere without considering lost workout data. | verified | Two-device rule defined and implemented: three-way reconcile; only-one-changed wins; both changed = conflict, no overwrite, athlete chooses (contracts.md § Account records on a device and plan sync). Tests: planSyncDecision.test.ts, usePlanSync.test.ts. |
| B172 | Preserve deletion intent through tombstones or an equivalent mechanism so stale devices do not resurrect deleted records. | pending |  |
| B173 | Namespace local records/caches by account. Signing out and into another account must not reveal or merge the first account's data. | implementing | Plan, profile, favourites and plan-sync base are per account and read before written (D-012). History records remain device-level pending an ownership decision (B175). |
| B174 | Make guest-to-account import explicit and repeatable without duplicate imports. | pending | Guest-to-account import is still implicit (first account claims the unscoped plan, PS-17). Recorded in D-012 for the sign-in work. |
| B175 | Avoid attaching ambiguous shared-device local data to a newly signed-in account without a clear ownership decision. | implementing | No device plan/profile/favourites attach to an account they were not read from. History ownership on shared devices is an owner decision recorded in D-012. |
| B176 | Define behavior when authentication expires during a save. Keep legitimate unsynced work recoverable. | implementing | Local finish failure keeps the session recoverable (not closed). Auth-expiry during account save is latent while no sign-in control ships; handled with batch 6. |
| B177 | Implement stable schema migration for existing local data if its format changes. | pending |  |

## 11. Supabase access control and server authority

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B178 | Enumerate exposed tables, views, RPCs, Edge Functions, and storage paths with their intended anonymous/user/server access. | verified | inventory/supabase.md enumerates tables, views, RPCs, Edge Functions, storage and grants with their actual anon/authenticated/service access; intended access is set by the prepared migrations and the SB-01 owner decision. |
| B179 | Apply row-level restrictions to user-owned data and appropriate read-only rules to shared reference data. | blocked | Reference tables become read-only for clients and user tables keep only policy-backed writes (20260928120000, proven locally). Applying needs owner authorization. |
| B180 | Test ownership on create, read, update, and delete, including attempted owner reassignment and foreign child-parent combinations. | blocked | Ownership tested on create/update across users and foreign child-parent combinations in the local validation (before/after). Applying the fixes needs owner authorization. |
| B181 | Audit view/function privileges and execution context so an indirect endpoint cannot bypass intended ownership checks. | implementing | Table privileges audited and a fix prepared; RPC EXECUTE grants and the SECURITY DEFINER RPC (SB-11) need a per-function review - owner decision in D-013. |
| B182 | Review privileged functions individually. Do not add elevated execution merely to make a permission error disappear. | pending |  |
| B183 | Keep server secrets out of frontend builds, logs, screenshots, and generated reports. | implementing | SV-01/SV-12 (0afbd64): unexpected API errors no longer return SQL or bound values; a malformed DATABASE_URL is no longer logged with its password. Live probe with an unreachable database: response carried only a reference; log line had no email, password or URL. Remaining: SV-07 hard-coded production Supabase URL/key in the client build (PS-14). |
| B184 | Do not trust user-editable profile metadata for roles, paid access, evidence promotion, or administrative authorization. | pending | Payment portion (paid access must not come from profile metadata) deferred by owner; roles, evidence promotion and admin authorization remain in scope. |
| B185 | Validate ownership and premium access on relevant server endpoints; hiding frontend buttons is not enforcement. | pending | Premium-access enforcement deferred by owner; ownership validation remains in scope. |
| B186 | Verify session/token handling with the actual runtime and current guidance, including stale claims and sign-out behavior. | implementing | Cross-site form sign-out closed by refusing non-JSON POSTs (415), keeping SameSite=None for the future native shell (live probe). Expired sessions are now swept per athlete at each sign-in. Remaining SV-11 session hygiene: sliding expiry, sign-out-all, revocation on passkey removal. |
| B187 | Test storage access if profile images, imports, or exports are used. | pending |  |
| B188 | Provide account deletion and export behavior appropriate to actual stored data; include derived records, storage, and background jobs in the… | pending |  |
| B189 | Ensure account deletion does not silently imply a separately billed App Store subscription has been canceled; make the subscription-management… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B190 | Run relevant database/security advisors and investigate material findings rather than suppressing them. | verified | Security and performance advisors were run in discovery (inventory/supabase.md SB-11, SB-16); material findings are addressed by the prepared migrations or recorded as owner decisions (D-013). |

### Required access test identities

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B191 | A can operate on A's authorized records. | pending |  |
| B192 | B cannot read, mutate, attach children to, or infer sensitive details about A's records through tables, joins, views, RPCs, search, or storage. | blocked | Cross-user attach (SB-02) and FK-existence probing closed by the prepared migrations, proven locally. Applying needs owner authorization. |
| B193 | Anonymous requests receive only explicitly intended public information. | blocked | What anonymous visitors may read (SB-01: every anonymous visitor holds 'authenticated') is an owner decision on the public surface; the gating pattern is written in supabase/prepared/backend_v1/README.md. |
| B194 | User clients cannot alter curated evidence, engine configuration, subscription state, or privileged flags. | blocked | Client write privileges on curated evidence and engine configuration tables are revoked by 20260928120000; derived states become server-only (20260928120300), entry context immutable (20260928120200); proven locally. Applying needs owner authorization. Subscription-state portion deferred by owner. |
| B195 | Server operations use only the necessary privilege and leave an appropriate operational trace without leaking sensitive payloads. | implementing | Server faults leave one JSON log line (reference, procedure, error class and driver code; no payload) — server/_core/apiErrors.ts, tests in apiErrors.test.ts. Server-role operations beyond the API not yet reviewed. |

## 12. iOS subscriptions and grandfathered pricing

**Whole section deferred by owner (27 September 2026).** Not incomplete and not launch-blocking for this assignment.

_No requirement IDs in this section._

### Confirmed commercial policy

_No requirement IDs in this section._

### Architecture and product setup

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B196 | Inspect existing StoreKit/native wrapper/payment integration and decide how it connects to the actual iOS app. If there is no iOS build yet,… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B197 | Reuse an existing competent purchase provider if already integrated; otherwise choose a supported architecture and document the decision. Do not… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B198 | Prefer a monthly product with a later price change preserving existing subscribers where that matches the supported configuration; verify details… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B199 | Keep product IDs, app identity, subscription group, and sandbox/production configuration explicit and environment-specific. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B200 | Load localized price/display data from the store; do not hardcode a dollar symbol and US price for every user. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B201 | Record planned pricing separately from live configured pricing. Do not claim that subscriptions are set up merely because a paywall renders. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B202 | Define which capabilities require paid access in an explicit entitlement matrix. Existing paid/free product decisions take precedence; unresolved… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |

### Verification and event processing

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B203 | Verify relevant signed transaction/notification data, app identity, expected product, environment, and ownership association before granting access. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B204 | Prevent replaying another account's transaction to claim entitlement. Define legitimate restore/account-linking behavior without silently… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B205 | Keep stable original-transaction lineage and individual event/transaction IDs in the purchase record model. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B206 | Process duplicated and out-of-order events safely; an older expiration event must not overwrite a verified later renewal blindly. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B207 | Persist incoming verified events or equivalent provider records durably enough to retry processing after failures. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B208 | Separate event receipt/verification from completed entitlement processing and expose failure/retry state operationally. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B209 | Implement reconciliation with the authoritative provider when notifications are missed or state is uncertain. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B210 | Support purchase success, pending/deferred purchase, user cancellation of purchase UI, renewal, expiration, refund/revocation, billing retry, and… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B211 | Do not treat turning off auto-renewal as immediate expiration; preserve access through the verified paid period. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B212 | Do not equate billing retry with active paid entitlement. Apply actual configured grace-period and authoritative subscription state. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B213 | Keep sandbox transactions from unlocking production accounts except through an explicitly isolated test configuration. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B214 | Support restore purchases and reconcile an existing purchase on a new device. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B215 | Define a bounded offline-access policy for recently verified subscribers without allowing a client clock edit or permanent cached boolean to grant… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B216 | Never delete workout history because a subscription expires. Access policy and data retention are separate concerns. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B217 | Keep any support/admin access override narrowly authorized, time-bounded where appropriate, and auditable. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |

### Subscription acceptance matrix

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B218 | Execute supported sandbox tests and distinguish simulated fixtures from actual store tests. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B219 | Record configuration/setup blockers such as absent credentials or developer account access without fabricating a purchase integration. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B220 | Produce the exact remaining App Store Connect configuration checklist for the owner, with screenshots/identifiers where available and no exposed… | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |

## 13. Transactions, migrations, and compatibility

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B221 | Keep a migration for every intended durable schema change and follow current project tooling conventions. | implementing | Every intended Supabase schema change has a timestamped migration (supabase/prepared/backend_v1), kept out of supabase/migrations so the GitHub integration cannot apply it before the owner authorizes (D-013). |
| B222 | Test migrations against both a fresh database and a representative existing schema with populated fixtures. | implementing | Migrations tested against a live-equivalent schema with populated fixtures, including re-apply (validation/run.sh on PostgreSQL 16.13). Not against a fresh Supabase branch or MySQL. |
| B223 | Prefer additive changes and staged backfills when replacing a field or computation. | verified | Prepared changes are additive: a nullable client_op_id with a unique index, a new read policy, a trigger; grants narrowed only where no policy allowed the write. No field replaced; no backfill needed. |
| B224 | Check constraints, null/default behavior, foreign keys, indexes, and policies after backfill—not only before it. | implementing | after.sql checks policies, grants, the unique index and the immutability trigger after applying, with legitimate writes still working. Production post-apply checks await the apply. |
| B225 | Make backfills resumable, bounded, and observable; do not run unbounded production rewrites merely to simplify code. | pending |  |
| B226 | Preserve old-client compatibility where installed iOS versions may continue calling an endpoint after release. | pending |  |
| B227 | Give changed contracts an explicit compatibility or deprecation path. | pending |  |
| B228 | Test rollback/recovery on staging. Recognize that reverting code does not necessarily reverse transformed data. | pending |  |
| B229 | Do not reset migrations, truncate user tables, or recreate production datasets to force a clean test. | verified | Nothing was reset, truncated or recreated: production Supabase was read-only throughout; migrations were proven on a local copy. |
| B230 | Ensure necessary backups/recovery access are available before an authorized material production migration; document what was actually verified. | pending |  |

## 14. Performance and operations

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B231 | Measure representative latency and query count for opening Home, searching exercises, adding to a plan, saving a set, computing coverage, and… | implementing | Client side measured for all six flows with request counts (performance.md; scripts/perf/measure-client.cjs, 10 runs, 1x and 4x CPU, empty and loaded fixtures). Server latency in production not measured: the shell cannot reach the deployment and aggregated metrics need Observability Plus; scripts/perf/measure-api.cjs is ready for a machine that can. |
| B232 | Define environment, fixture size, cold/warm conditions, and percentile when reporting performance. A single local timing is not a production SLA. | verified | performance.md states environment, build, browser, CPU throttling, fixture sizes, cold/warm definitions, timing method, runs and percentile method, and says the numbers are not a production SLA. |
| B233 | Investigate repeated queries, unnecessary full-dataset downloads, and recomputation on unrelated state changes. | implementing | Repeated/unneeded queries: account-only routes on the device store fixed (D-015, 7 -> 4 procedures on Home); fallback sport profile request recorded (Perf-2). Full downloads: movement data for every sport in the first load (Perf-1), whole reference registry on Home (by design, size unmeasured). Recomputation on unrelated state changes not profiled. |
| B234 | Use indexes and bounded/paginated queries justified by actual access patterns. | pending |  |
| B235 | Keep search results stable across pagination and updates where the product needs that consistency. | pending |  |
| B236 | Prevent public or authenticated endpoints from triggering unbounded expensive analysis without appropriate bounds/rate controls. | verified | SV-02 (0afbd64): maxBatchSize 10 (client splits at 10); per-client allowance of 120 calls/min per instance on the five public routes that fan out to Supabase; 8 s deadline on every Supabase call; muscle-rank route at most 4 upstream calls in flight; caller-keyed caches bounded (500/200/1000, LRU); caller curve id must be a UUID. Live probe: batch of 11 refused, 10 accepted; bad id rejected. Tests: server/boundedCache.test.ts. |
| B237 | Make background calculations retryable and prevent stale job results from replacing newer input revisions. | pending |  |
| B238 | Track error counts, failed saves/syncs, unsupported norm reasons, calculation failures, and entitlement-processing failures. | implementing | Server faults are counted as structured log lines (scope=api). No aggregate counters for failed saves/syncs, unsupported norms or calculation failures yet. Entitlement failures: deferred by owner. |
| B239 | Use correlation IDs or equivalent tracing across relevant client/server operations without logging entire private workouts, auth tokens, or signed… | implementing | Every server fault gets a reference returned to the caller and logged with it (0afbd64). Client-side correlation not yet propagated. Signed purchase payloads: deferred by owner. |
| B240 | Provide a small operational runbook for failed sync, bad reference release, stale calculation, missed purchase event, and unavailable service. | pending | Missed-purchase-event runbook entry deferred by owner; the other runbook entries remain in scope. |
| B241 | Verify that error monitoring itself does not expose secrets or sensitive profile details. | pending |  |

## 15. Numeric and behavioral fixtures

_No requirement IDs in this section._

### 15.1 Exact unit and load fixtures

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B242 | Convert 100 lb to 45.359237 kg using the exact mass conversion, then round only for display. | implementing | Piper lookup tolerates the 0.02 lb storage error from lb->kg->lb round trips (STORAGE_TOLERANCE_LB) instead of crashing or skipping a band. Per-set unit storage in batch 2. |
| B243 | Verify equivalent pound/kilogram representations produce equivalent normalized results within declared floating-point tolerance. | verified | 100 kg and 220.46226218487757 lb give the same kg within 1e-9; 100 lb = 45.359237 kg exactly; a 225 lb set stays 102.058 kg after a unit switch (deviceWorkoutLog.units.test.ts). |
| B244 | A pair of 25 kg dumbbells under a total-external-load convention normalizes to 50 kg; the same entry explicitly recorded as 25 kg total remains 25 kg. | implementing | A dumbbell entry is one implement and stays so (25 kg is 25 kg per implement); nothing normalizes it to a total because both scoring routes read per implement. A pair-total entry path does not exist to test the other half. |
| B245 | A unilateral 25 kg lift is not automatically converted to 50 kg merely because the user has two limbs. | pending |  |
| B246 | For a deliberately defined assisted-pull-up protocol, verify increasing assistance cannot improve the inferred unassisted performance with… | pending |  |

### 15.2 Adjustment fixture — synthetic, not a coefficient recommendation

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B247 | Create a similar independent fixture for each actual adjustment stage, including inverse direction and already-adjusted reference data. | pending |  |
| B248 | Verify bodyweight changes do not alter a historical score unless the selected historical-context policy explicitly calls for recalculation. | verified | A session keeps the body weight at completion, and a weight change later does not re-measure it (workoutStrengthRecord.test.ts 'bodyMassKgAtCompletion' cases). |
| B249 | Verify lower-is-better tests reverse comparison direction correctly. | pending |  |
| B250 | Verify unknown age/context leads to the documented estimate or missing-context state, not silently the best-performing demographic. | verified | Without a birth year the lift is placed unadjusted and says so (strengthPercentile.age.test.ts 'places the lift unadjusted when there is no birth year'; D-002); without sex the comparison asks for it. |

### 15.3 Scientific-engine behavior fixtures

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B251 | Demonstrate how a compound lift contributes to multiple muscles without making every muscle's isolated strength equal to the whole lift. | pending |  |
| B252 | Demonstrate planned versus performed exposure using a workout with prescribed sets that were not all completed. | pending |  |
| B253 | Demonstrate what changes when RIR is known versus missing; explain the assumption rather than inventing an exact physiological difference. | verified | 70 kg x 5 unknown effort places at 43.68, at 2 RIR at 53.26 (database numbers, reproduced by the engine); confidence 0.84 vs 0.83. strengthPercentileCard.effort.test.ts. |
| B254 | Demonstrate an unsupported exercise/test returning an honest status while preserving its valid workout log. | verified | A loaded bodyweight set returns added_load_not_scored and a lift without load returns load_required, listed by reason while the workout log stays intact (supabaseStrengthProfile.test.ts; live probe batch 4). |
| B255 | Demonstrate two nearly synonymous exercise names resolving to one canonical search identity without merging mechanically distinct variants. | pending |  |
| B256 | Demonstrate a reference-data version change with preserved original inputs and a traceable output delta. | pending |  |

### 15.4 State and integration fixtures

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B257 | Add → retry same request → one addition; add a new intentional instance → expected additional instance. | pending |  |
| B258 | Finish workout → duplicate finish event → one completed workout count. | implementing | Finishing in one tab closes the workout in the other, and an edit to a workout another tab already finished is refused; an empty finish records nothing (DeviceWorkoutTracker.tabs.test.ts). No explicit duplicate-finish-event test, and none for account (MySQL) completion. |
| B259 | Undo one addition → only that addition removed; derived totals match. | verified | Undo removes exactly the entry that was added, from the day it was added to, even after switching days (Home.undoAndLoading.test.ts; batch 1). |
| B260 | Edit plan after completing a session → historical performed data unchanged. | pending |  |
| B261 | Log offline → terminate app → reopen → reconnect → one durable record. | pending |  |
| B262 | Sign out A → sign in B → no A profile/plan/history leaks from caches. | implementing | Plan, profile and favourites: no leak on sign out A -> sign in B (Home.accountSwitch.test.ts, which fails against the old code). Workout history, typed lifts and body-weight log are still device-level (D-012) - launch-blocking before sign-in ships. |
| B263 | Change week/day while a request is in flight → response updates its intended destination, not the newly selected day. | pending |  |
| B264 | Launch with persisted plan loading → pending state, not false empty plan. | verified | Today holds a 'Loading your plan' status until the saved plan and profile are read (main's planReady, merged), and every plan edit is refused with a toast before then, so nothing is confirmed and then overwritten. Test: client/src/pages/Home.undoAndLoading.test.ts. |
| B265 | Home/Plan/analysis/Progress use matching definitions and revisions for shared counts and scores. | implementing | Home and Progress now share the record selector and definitions (D-006). Plan/analysis revisions are reviewed with coverage unification (B115, batch 5). |
| B266 | Simulate late calculation response → newer input result remains authoritative. | pending |  |

## 16. Release gates and definition of done

_No requirement IDs in this section._

### Gate A — data and ownership

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B267 | No known cross-user access path in exercised endpoints. | blocked | FAIL in production until the prepared migrations are applied: SB-07 (anon/authenticated write grants with no policy) and SB-02 (check-in on another athlete's focus area) reproduced on a live-equivalent schema (validation/before.sql) and closed by 20260928120000/120100 (after.sql). MySQL routes: ownership checked in code and mock tests only (DB unreachable). Needs owner authorization (B009, D-013). |
| B268 | Plan/session writes survive the tested restart/offline/retry flows. | implementing | Device: one active session across tabs, stored-copy merge, refused finish stays open, restart resumes mid-rest (DeviceWorkoutTracker.tabs/units tests); plan per account read-before-write and three-way sync (usePlanSync.test.ts). Unverified: MySQL write paths (unreachable), iOS app termination (no shell). |
| B269 | No duplicate completion or addition from retried operations. | blocked | Undo bound to its operation and plan save atomic (batch 1, 0afbd64). Retried lift sync can duplicate until client_op_id (20260928120500, proven locally) is applied with its paired client upsert; MySQL workout writes are not idempotent (SV-05). |
| B270 | Migrations and existing-user upgrade paths pass representative tests. | implementing | Tested upgrade paths: legacy set units (deviceWorkoutLog.units.test.ts), per-account storage keys (Home.accountSwitch.test.ts), Supabase migrations on a live-equivalent local copy incl. re-apply (validation/run.sh). Not exercised: MySQL migrations 0000-0010 against real data (unreachable). |

### Gate B — internal logic

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B271 | Core exposed scores have explicit input semantics, a documented calculation path, source or assumption basis, and independent fixtures. | implementing | Strength placement, e1RM, load conventions, coverage and muscle ranks have contracts (contracts.md) and fixtures pinned to database outputs. Muscle aggregation coefficients have no recorded source (EN-17); muscle effect dimensions are heuristics (EN-22). |
| B272 | Unsupported inputs do not produce fabricated ordinary scores. | implementing | Unsupported inputs return reasons, not scores: added_load_not_scored, load_required, sex/age gates, stabilizer-only muscles unranked, protocol-mismatched units declined, rank null for invalid percentiles. Open: the server supplies confidence 0.5 when a score lacks one (EN-17). |
| B273 | Summary/detail results agree for the same scope and input revision. | verified | Coverage panel, full analysis and picker read one snapshot (coverageConsistency.test.ts); card, trends and ranks share one estimator (strengthPercentile.parity.test.ts); every count reads the shared record (athleteRecord tests). |
| B274 | Major calculation changes have a before/after delta report and an explanation. | verified | Before/after deltas recorded with each calculation change: chest 27.35 -> 84.67 (D-007, live), bench 100x5 e1RM 114.58/116.67 -> 112.5 (D-007), dumbbell 43.10 vs 95.00 and pull-up 15.71 (D-009), adductor -11/-15 (D-010), whizzer picks (D-011), stabilizer muscles and ceiling (D-014). |
| B275 | No tuning solely to make the owner's personal score look higher or to fit screenshots. Expected-case disagreement triggers source/method… | verified | No coefficient was tuned. Every numeric change follows the database's protocol or a reproduced defect, and is pinned to database outputs or real registry values. |

### Gate C — payments

**Gate deferred by owner (27 September 2026).** Not a failed or blocked gate for this assignment.

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B276 | Paid access depends on verified entitlement and survives tested purchase/restore/renewal paths. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B277 | Cancellation, expiration, grace/retry, and revocation are not collapsed into one boolean. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B278 | Founders pricing configuration and app messaging agree with the actual store setup. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |
| B279 | Missing live-store configuration is clearly identified; no claim that revenue collection is ready without it. | deferred (owner) | Payments deferred by owner for this assignment; not incomplete and not launch-blocking for it. |

### Gate D — consumer integration

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B280 | Frontend consumers use the repaired contracts. An unused correct backend does not fix the app. | verified | Each repaired contract is wired to its screens and was verified in the running app or production: muscle ranks (batch 3 and 4 live probes), load labels, coverage panel/picker, recommendations, plan-sync conflict banner, rank legend. Dormant components not mounted (WorkoutExecutionPanel, ProgressionReviewPanel) still carry the old 3 x 8-12 fallback. |
| B281 | Home, Plan, Workout, Progress, Strength, and exercise recommendations pass their relevant complete journeys. | implementing | Simulated mobile (Chromium, 320-430 px, 100% and 125% text, device stores): the Sep 28 brief's journeys passed on 8be0ef3 (docs/regression-sep28: cold/warm Home, Plan browsing -> Home -> open workout, explicit day change, active session resumed across navigation and reload, empty day then populated, Matches add/Undo/View workout, Strength map consistency), plus the batch 10 flows (search, add, coverage, start and log a set, Strength). Not run: finishing a workout into Progress as one journey, recommendations beyond Matches, any account-backed journey (MySQL unreachable), iOS/WebKit. |
| B282 | Loading/error/partial states preserve usable data and understandable next steps. | implementing | Refused finish stays open; plan-sync conflict shown with both choices; ranks pending/partial states; the empty day reads 'Not available yet' instead of 0/100; the sign-in notice fires once per lapse with a close button, an action and a lasting status (Sep 28 repair, #82). Offline plan sync is still silent. |
| B283 | Record what was tested on desktop, simulated mobile, actual iOS build, and store sandbox separately. | verified | verification.md § Environments and performance.md record desktop/simulated mobile (headless Chromium) separately; actual iOS build not available (D-003); store sandbox deferred by owner (D-001). |

### Gate E — maintainability

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B284 | Tests, migrations, decisions, and documentation match the implemented state. | verified | At 8be0ef3 (production): tsc --noEmit exit 0; vitest 2,539 passed, 1 skipped, 5 failed (live-Supabase network tests, same five as every batch); npm run build passes. Decisions D-001-D-015 and docs/regression-sep28 record every behaviour change; prepared migrations labelled not applied everywhere (gates.md, handoff.md). |
| B285 | Known remaining risks are prioritized and have specific reproduction or verification steps. | verified | handoff.md 'Remaining defects' lists each open risk with priority, a reproduction or verification step, the next step and its dependency (stable IDs from inventory/*.md, plus REG-1 from the Sep 28 repair). |
| B286 | V2 can begin by reading the handoff and running the baseline without reconstructing undocumented decisions. | verified | handoff.md 'Run the baseline' gives the commands run for B284 with their expected results; decisions.md, the intentional-change table and the version map carry every decision V2 needs (gates.md). |

## 17. Work sequence and checkpoints

_No requirement IDs in this section._

### Checkpoint format

_No requirement IDs in this section._

## 18. Backend V2 inheritance contract

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B287 | Record existing engine versions and assign new versions only for meaningful calculation/contract changes. | verified | handoff.md 'Versions and compatibility map' records each engine's identifier; strength_beta_v2 was the only new version, assigned for the estimator change (D-007); UI-only changes (Sep 28 repair) assigned none. |
| B288 | Maintain a compatibility map between client contract, engine version, schema revision, and reference-data revision. | verified | handoff.md 'Versions and compatibility map': client contract, engine versions, coverage target revision (split_targets_v1), device storage keys, Supabase and MySQL schema states, with the migration ordering constraint. |
| B289 | Preserve baseline fixtures and add regression cases for every material bug repaired in V1. | verified | Each repaired defect has a regression test that failed against the old code (mutation checks recorded in verification.md for batches 2-10); baseline fixtures kept, rewritten ones carry the reason inline. |
| B290 | Mark intentional behavior changes explicitly so V2 does not mistake them for regressions. | verified | handoff.md 'Intentional behaviour changes' lists D-004-D-015 and the #82 changes; every rewritten test carries an inline 'Intentional change' note with its reason. |
| B291 | Carry unresolved issues forward with stable IDs, dependencies, attempted approaches, and evidence. | verified | handoff.md 'Remaining defects' carries each unresolved issue with its stable ID, dependency, attempted approach where one was tried (e.g. prepared migrations, D-013) and evidence. |
| B292 | Separate V2 ideas from unfinished V1 requirements. Do not quietly reclassify incomplete launch-critical work as a future enhancement. | verified | handoff.md 'V1 requirements not done' lists unfinished V1 work by area, kept apart from the V2 candidates table; status.md keeps each as pending/implementing. |
| B293 | For each candidate extension, identify whether it adds a module, expands supported inputs, improves evidence, or changes existing semantics. | verified | handoff.md 'V2 candidates' classifies each as adds a module, expands inputs/outputs, improves evidence, or changes existing semantics. |
| B294 | Keep deprecated paths until their actual consumers have migrated, then remove them through a deliberate follow-up. | verified | Legacy unscoped storage keys still read; dormant components and MySQL profile plumbing kept until nothing mounts them (handoff.md 'Constraints for V2'). sessionExpiryNotice.ts was reduced, not removed, because StrengthGenomePanel and About me still read its words (#82). |
| B295 | Ensure model/data rollback does not require erasing user observations. | verified | Every V1 model change is code-only and never rewrote a stored observation; each prepared migration has a rollback that deletes no data (supabase/prepared/backend_v1/README.md). |

### Potential V2 directions — not automatic V1 scope

_No requirement IDs in this section._

## 19. Required final response from Claude

| ID | Requirement | Status | Evidence / note |
|---|---|---|---|
| B296 | Do not claim the app is launch-ready solely because this checklist is long, tests compile, or all code has been written. | verified | gates.md and the final response state 'not launch-ready' with the failing and unverified gates named. |
| B297 | Do not describe an unrun test as passed or a proposed migration as applied. | verified | gates.md reports only commands run on 8be0ef3; the prepared Supabase migrations are reported as not applied; untested platforms (iOS, WebKit, MySQL) are reported as unverified. |
| B298 | End with a concrete next-state handoff, not a vague invitation to start the work later. | verified | handoff.md ends with owner decisions (numbered, with what each blocks), remaining defects with next steps, and the baseline to run; gates.md names what would change each failing gate. |

## 20. Official implementation references

_No requirement IDs in this section._
