# Sports Genome Backend V1
## Internal logic, data integrity, subscriptions, and an extensible implementation baseline

**Prepared:** September 27, 2026  
**Owner:** Gabe Naim  
**Target:** initial public iOS release October 10, 2026; continued development toward January 2027 and beyond  
**Assignment:** inspect, repair, connect, implement, and verify the existing backend and calculation systems. Do not stop at an architecture proposal.

## 0. What V1 means

V1 is the first installment of this backend work program. It is not permission to reset the existing backend, replace prior scientific work, or build a disposable implementation. V2 and later briefs will inherit the working system, tests, decisions, migrations, and unresolved issues produced here. Later work may extend existing modules or add independent capabilities.

Version this document separately from database schemas, calculation engines, API contracts, and dataset releases. A document called Backend V2 must not automatically cause a database reset, renamed tables, recalibrated scores, or a new API namespace.

This brief was prepared from product discussions and an app walkthrough. **The author has not inspected the current repository or live database for this assignment.** Existing implementation names, data counts, and relationships must be discovered. Names suggested below describe logical responsibilities; they are not instructions to create duplicate objects with those names.

### Product intent

Sports Genome connects exercise characteristics, recorded performance, muscle effects, workout construction, and sport demands. Its value depends on those connections behaving coherently. The app should provide useful estimates where direct data is incomplete, while keeping their basis and limits inspectable. Unsupported precision, silent fallback, and arbitrary scores damage the product more than a plainly labeled estimate.

The owner wants sophisticated utility, not generic recommendations. Preserve useful existing research, approved mappings, age-aware normalization, equipment distinctions, and advanced calculations. Do not reduce everything to squat/bench/deadlift, raw tonnage, or a single opaque score.

### Non-negotiable execution rules

- [ ] **B001:** Read the whole brief and existing repository instructions before editing.
- [ ] **B002:** Identify the current repository, branch, database project, environments, deployed app, and actual iOS integration status.
- [ ] **B003:** Inventory existing engines before adding new ones. Reuse and improve compatible modules.
- [ ] **B004:** Preserve user data, source provenance, canonical IDs, migration history, and unrelated work.
- [ ] **B005:** Never mark work verified on the basis of code inspection alone when a runtime or calculation test is required.
- [ ] **B006:** Do not invent scientific coefficients, supporting studies, database contents, or successful tests.
- [ ] **B007:** Continue through authorized implementation and verification; do not stop after producing a plan.
- [ ] **B008:** Treat absent access as a specific blocker. Complete independent work, state exactly what remains unverified, and do not pretend production was audited.
- [ ] **B009:** Do not perform destructive production changes or deploy outside existing authorization. Prepare concrete migrations and evidence first.
- [ ] **B010:** Maintain a resumable work record. Large task size is not a reason to forget partially completed requirements.

## 1. Priority and deliverables

### Priority classes

| Priority | Meaning | Examples |
|---|---|---|
| P0 | Required before accepting real users or payments | Cross-user isolation, correct purchase entitlement, no lost workouts, durable saves, migration integrity |
| P1 | Required for exposed core product logic | Correct units, defensible norm selection, consistent coverage, plan/session separation, traceable recommendation output |
| P2 | Important completion work | Evaluation reports, performance tuning against measurements, robust optional dimensions and developer diagnostics |
| V2 candidate | Explicit follow-on work outside the current dependency path | New inference methods, additional sports, larger normative research expansion, new commercial tiers |

Do not classify a broken advertised feature as optional merely to meet a date. If an exposed feature cannot be made reliable, provide a concrete release decision: repair it, constrain its supported scope honestly, or keep the incomplete surface out of the release while preserving the work. Do not silently hide large amounts of functionality.

### Required durable artifacts

Use the repository's existing documentation structure where possible. Suggested filenames are illustrative:

1. `backend-v1-inventory.md`: current system map, table/function/module owners, actual frontend consumers.
2. `backend-v1-contracts.md`: calculation and data contracts mapped to existing code.
3. `backend-v1-decisions.md`: decisions, alternatives, scientific assumptions, and change rationale.
4. `backend-v1-status.md`: every B-ID, status, evidence, blocker, next step.
5. `backend-v1-verification.md`: actual commands, fixtures, numeric traces, integration results, and device limitations.
6. `backend-v1-handoff.md`: final state and explicit carry-forward instructions for V2.
7. Versioned implementation, migrations, and meaningful automated tests in normal project locations.

- [ ] **B011:** Create or extend these records without duplicating an equivalent existing tracking system.
- [ ] **B012:** Give each requirement one of: pending, implementing, implemented-unverified, verified, blocked, or explicitly deferred with rationale.
- [ ] **B013:** Attach evidence to verified items and dependency information to blocked items.
- [ ] **B014:** Separate what this assignment actually changes from pre-existing behavior it merely confirms.

## 2. Discover the real system first

Trace these existing product paths: Home next workout; Plan selection/editing; Workout start/log/finish; exercise add and Undo; muscle-specific search; coverage detail; Strength ranks; Profile edits; local/cloud save; purchase/restore if present.

For each path document the source record, client state, API/RPC/view/function, calculation layer, cache, and rendered consumer. A diagram is useful only if it identifies actual ownership and dependencies.

### Discovery checklist

- [ ] **B015:** Inventory tables, views, functions, triggers, jobs, Edge Functions, exposed schemas, storage buckets, and relevant policies.
- [ ] **B016:** Identify existing norm, eligibility, muscle-effect, sports-transfer, and strength-engine components. Treat historical names such as `muscle_effect_v1` or `app_reference_eligibility` as search leads, not proof of current schema.
- [ ] **B017:** Identify calculations duplicated in SQL, server functions, frontend utilities, or hardcoded component logic.
- [ ] **B018:** Inventory research datasets with current row counts, eligible counts, review reasons, source revisions, and actual app consumption. Historical counts are not acceptance targets.
- [ ] **B019:** Identify mock, seed, placeholder, and fallback values that can reach a real account.
- [ ] **B020:** Identify where local storage is authoritative, where server storage is authoritative, and where the app currently mixes them.
- [ ] **B021:** Record current schema/library/runtime versions and verify applicable current documentation before using version-dependent APIs.
- [ ] **B022:** Establish representative baseline fixtures and outputs before modifying calculations.
- [ ] **B023:** List current failures and uncertain behavior separately. Do not present an untested hypothesis as a confirmed defect.

**Discovery exit condition:** you can trace one logged lift, one exercise addition, one coverage value, and one strength rank from input to display. Continue to repairs after this; do not spend the entire assignment writing inventory prose.

## 3. Establish canonical data semantics

Reuse existing equivalent entities. Add only the missing constraints or fields justified by real behavior. Avoid a speculative enterprise schema.

| Concept | Required meaning |
|---|---|
| Exercise identity | Stable canonical ID plus variants with protocol/equipment distinctions |
| Exercise alias | Search/ingestion term linked to an identity, not automatic evidence of mechanical equivalence |
| Prescription | Intended sets, reps/time/distance/load/effort; editable plan data |
| Session | An actual workout instance with an explicit lifecycle and plan lineage |
| Set observation | What the user actually performed, including units and relevant context |
| Performance result | A derived or direct metric from eligible observations |
| Norm reference | A defined measurement protocol and reference population with provenance |
| Muscle effect | A modeled contribution from exercise, prescription, and/or observation |
| Sport relevance | A scoped mapping between physical demands and exercise capacities |
| Entitlement | Verified access state derived from a supported purchase/account source |

- [ ] **B024:** Preserve submitted measurements separately from normalized values and derived estimates.
- [ ] **B025:** Store explicit units, load convention, side/laterality, exercise variant, and equipment context where needed.
- [ ] **B026:** Distinguish unknown from zero and not-applicable from missing.
- [ ] **B027:** Define completed, skipped, warm-up, working, failed, and deleted observations consistently with the existing product.
- [ ] **B028:** Record event time and ingestion time separately where offline sync or delayed imports matter.
- [ ] **B029:** Define user timezone, date boundaries, and week-start behavior; do not infer the workout date from UTC ingestion alone.
- [ ] **B030:** Keep historical bodyweight and relevant profile context available for historical calculations. Do not silently apply today's weight to every past lift.
- [ ] **B031:** Preserve the recorded context when a user later changes age-related information, sex/reference-population choice, sport, or experience.
- [ ] **B032:** Enforce referential integrity and correct ownership across child rows, not just parent records.
- [ ] **B033:** Define stable operation IDs and revision/conflict handling for retryable writes.

### Input validation

Validation must reject malformed input while allowing legitimate unusual performance. Separate impossible values from plausible outliers that require confirmation or exclusion from aggregate statistics.

- [ ] **B034:** Reject non-finite numeric values, invalid unit codes, malformed IDs, impossible timestamps where relevant, and structurally invalid records.
- [ ] **B035:** Validate negative values by field meaning: negative added load may represent assistance only through an explicit supported convention, not a universal ban or implicit interpretation.
- [ ] **B036:** Define permissible combinations for reps, duration, distance, assistance, and load by exercise/test protocol.
- [ ] **B037:** Confirm unusually large entries without silently clamping legitimate user input.
- [ ] **B038:** Return actionable structured validation errors while preserving the user's unsaved input.

## 4. Shared calculation contracts

The same input snapshot, engine version, and evidence revision must produce the same result. Client/server implementations may both exist for offline use, but their semantics must be shared or tested for equivalence.

A result should expose the following logical information where relevant; do not bolt every field onto every endpoint indiscriminately:

```text
status: ready | partial | unsupported | pending | failed
value and unit: nullable; null is not zero
scope: user / session / day / week / exercise / muscle / sport
input_revision or stable input fingerprint
engine_version and reference-data revision
method: direct observation / derived estimate / modeled transfer
reference population and protocol when a norm is used
uncertainty or evidence classification with reason codes
source references and applied adjustments
computed_at and stale/current state
```

This is a semantic example, not a mandated schema or a claim that those field names already exist.

- [ ] **B039:** Establish a typed boundary for each engine and validate requests/responses at external boundaries.
- [ ] **B040:** Define unsupported and partial outcomes explicitly. Do not return an ordinary success score with hidden fallback behavior.
- [ ] **B041:** Separate numerical uncertainty, evidence quality, data completeness, and protocol compatibility; they are not interchangeable confidence concepts.
- [ ] **B042:** Do not invent numeric confidence percentages unless the method has a defensible calibration. Categorical confidence with reason codes is acceptable.
- [ ] **B043:** Include stable reason codes so the frontend can explain results without parsing prose.
- [ ] **B044:** Specify rounding at display boundaries; compare and aggregate with appropriate underlying precision.
- [ ] **B045:** Define tie-breaking for equally ranked results and guarantee deterministic order.
- [ ] **B046:** Include relevant input/data/model versions in cache invalidation. Do not treat a user ID alone as a sufficient calculation cache key.
- [ ] **B047:** Keep raw events immutable where useful and version derived results so later recalculation does not erase original evidence.

## 5. Strength Genome: measurement to comparison

### 5.1 Load and protocol normalization

A displayed number is not enough to identify an equivalent performance. A machine-stack value, total barbell load, per-hand dumbbell load, added bodyweight load, and assistance all mean different things.

- [ ] **B048:** Normalize compatible units without losing original entry units.
- [ ] **B049:** Make total-load versus per-hand conventions explicit and test both.
- [ ] **B050:** Distinguish unilateral results, bilateral totals, and paired dumbbells; do not double every unilateral entry.
- [ ] **B051:** Treat assistance as assistance. More assistance for the same task must not be ranked as greater unassisted performance.
- [ ] **B052:** Preserve bodyweight-exercise conventions. Do not assume every push-up or dip moves exactly full bodyweight through an equivalent external-load protocol.
- [ ] **B053:** Do not apply a universal machine-to-free-weight conversion. Preserve machine/protocol specificity and mark unsupported comparisons explicitly.
- [ ] **B054:** Keep range-of-motion, paused/touch-and-go, grip, tempo, and equipment differences where the reference actually depends on them.
- [ ] **B055:** Define which observations are eligible for strength inference and why others are excluded.

### 5.2 Estimated maximum and observation selection

- [ ] **B056:** Inventory existing estimated-maximum methods, coefficients, supported rep ranges, and eligible exercise families.
- [ ] **B057:** Verify formulas against their actual sources and intended protocols before broad application.
- [ ] **B058:** Do not run a repetitions-to-maximum formula on timed carries, jumps, distance tests, or isometric holds without a separate supported method.
- [ ] **B059:** Define handling of effort/RIR when available; missing effort must not silently become maximal effort.
- [ ] **B060:** Define how warm-ups, failed repetitions, partial sets, implausible records, and imported entries affect eligibility.
- [ ] **B061:** Document whether the product shows best historical, recent best, or another estimator. Keep those concepts separate.
- [ ] **B062:** Preserve sample count, recency, and source-observation IDs behind the displayed result.
- [ ] **B063:** Avoid accidental score decreases caused only by adding a weaker record to a best-performance summary; if a rolling estimator behaves differently, document and test its intended behavior.

### 5.3 Reference population and adjustments

The owner wants age relevance even where there are not separate empirical norms for every age/exercise combination. Evidence-supported multiplicative adjustments or hierarchical estimates are acceptable. Do not reject that architecture solely because direct data is sparse. Do not invent multipliers or force results to match a desired percentile.

- [ ] **B064:** Identify the intended comparison population for each norm family: general population, trained people, athletes, competitors, or another defined cohort.
- [ ] **B065:** Do not treat powerlifting competitors as the default population for all exercises or all users.
- [ ] **B066:** Separate direct exercise-specific references from transferred or adjusted references.
- [ ] **B067:** Audit age, sex/reference-population, bodyweight, and training-status effects already present in the source so they are not applied twice.
- [ ] **B068:** For each multiplier or interpolation, record equation, source, applicable domain, direction, assumptions, and validation cases.
- [ ] **B069:** Apply an adjustment at a defined stage—observed metric, expected metric, distribution parameters, or another explicit layer. Do not multiply a percentile casually.
- [ ] **B070:** Test age-boundary continuity and behavior at the edges of the supported range. Do not extrapolate outside the domain silently.
- [ ] **B071:** Verify whether bodyweight normalization uses a ratio, allometry, weight classes, regression, or another source-supported model. Avoid double normalization.
- [ ] **B072:** Keep experienced-athlete expectations distinct from measured capability; do not automatically raise someone's performance score because they report more training experience.
- [ ] **B073:** If a direct comparison is unavailable, use a clearly identified estimate only when the transfer method is defensible; otherwise return unsupported with the missing requirement.

### 5.4 Percentiles and rank labels

- [ ] **B074:** Specify whether the reference provides an empirical distribution, percentiles, quantiles, means/SD, or only category thresholds.
- [ ] **B075:** Do not fabricate a normal distribution solely because mean and SD are convenient; justify the distribution or avoid overprecise percentile output.
- [ ] **B076:** Distinguish a true reference percentile from a normalized product score or rank band.
- [ ] **B077:** Handle lower-is-better metrics correctly, including completion time.
- [ ] **B078:** Preserve canonical rank identifiers and approved display mapping unless an independently justified change is required.
- [ ] **B079:** Verify threshold inclusivity at every rank boundary and keep rounding from moving an underlying score across the wrong boundary.
- [ ] **B080:** Keep unranked/pending separate from the lowest rank.
- [ ] **B081:** Produce numeric traces for representative high, medium, low, missing-context, and unsupported performances.

### 5.5 Muscle-region strength inference

A region estimate inferred from compound lifts is not a directly measured isolated-muscle maximum.

- [ ] **B082:** Document the mapping from eligible exercise performances to each region.
- [ ] **B083:** Prevent repeated copies of the same lift or tightly correlated variants from falsely creating independent evidence.
- [ ] **B084:** Keep primary muscle contribution, stabilization, and normative comparability distinct.
- [ ] **B085:** Define region aggregation and confidence rules rather than averaging unrelated exercise percentiles by default.
- [ ] **B086:** Preserve left/right asymmetry when supported; do not generate a weaker-side score from missing side data.
- [ ] **B087:** Explain which observations drive a region result and which regions lack enough evidence.
- [ ] **B088:** Keep coverage-of-records and rank strength as separate outputs, eliminating misleading loading-state color changes.

## 6. Muscle Effect engine: prescription and execution

Preserve or extend existing dimensions such as hypertrophy stimulus, strength stimulus, mechanical loading, long-length loading, shortened-position emphasis, stabilization/isometric demand, fatigue cost, and effective volume. These are distinct constructs. A single high “muscle activation” number must not substitute for all of them.

- [ ] **B089:** Inventory existing dimensions and specify their meaning, scale, units or unitless status, and intended use.
- [ ] **B090:** Separate exercise-level attributes from prescription-level modifiers and observed-execution modifiers.
- [ ] **B091:** Keep planned stimulus and logged stimulus distinct. An unperformed prescription must not become completed training exposure.
- [ ] **B092:** Define the effect of set count, repetition scheme, load/relative intensity, effort, range, contraction type, and muscle role where supported.
- [ ] **B093:** If a field is absent, expose the actual default/assumption and its consequence. Do not assume unreported RIR equals zero.
- [ ] **B094:** Audit for double counting when exercise tags and prescription modifiers encode the same characteristic.
- [ ] **B095:** Keep prime mover, synergist/supporting, and stabilizer roles explicit; stabilizer involvement must not automatically count as a full hypertrophy set.
- [ ] **B096:** Allow multiple muscles to receive contribution without treating contribution weights as a mandatory probability distribution summing to one unless the model requires that.
- [ ] **B097:** Keep volume-load calculations within compatible units/protocols. Do not aggregate kilograms, seconds, and meters into a physically meaningless tonnage.
- [ ] **B098:** Do not infer growth in grams, injury probability, or exact recovery hours from heuristic effect points.
- [ ] **B099:** Keep fatigue cost separate from useful stimulus; adding work may increase one while providing diminishing benefit in another.
- [ ] **B100:** Preserve side-specific exposure and define how unilateral sets count for whole-session and per-side summaries.
- [ ] **B101:** Record whether coefficients are empirical, transferred, expert-authored, or product heuristics. Heuristic does not mean hidden.
- [ ] **B102:** Verify saturation/diminishing-return functions where used. Test their actual mathematical properties instead of assuming more always increases every output.

### Evidence interpretation

- [ ] **B103:** Match evidence to the claim being supported. An acute activation measurement alone does not establish long-term hypertrophy magnitude.
- [ ] **B104:** Preserve study population, intervention/protocol, outcome, and source location for important coefficients.
- [ ] **B105:** Keep incompatible outcome measures separate unless a documented transformation is justified.
- [ ] **B106:** Distinguish an evidence-supported exercise trait from an empirically calibrated per-user prediction.
- [ ] **B107:** Provide inspectable per-exercise/per-muscle contributions so a reviewer can explain a result without reverse engineering the whole engine.

## 7. Workout coverage, targets, and recommendations

### 7.1 Coverage semantics

Coverage is a comparison against an intended target, not a measurement of readiness, recovery, or muscle health. Define the target and time scope before calculating a score.

- [ ] **B108:** Identify the source of day/week targets and whether they depend on split, goal, schedule, sport, and user preferences.
- [ ] **B109:** Store or reconstruct the target revision used by a result. A changed target must not masquerade as changed training.
- [ ] **B110:** Define per-muscle contribution, target, shortfall, surplus, and global aggregation separately.
- [ ] **B111:** Specify behavior for zero targets and missing targets; avoid division by zero and invented perfect scores.
- [ ] **B112:** Define whether oversupply can compensate for a different missing muscle. Do not let that happen accidentally through simple totals.
- [ ] **B113:** Explain any caps, weights, penalties, and saturation. Preserve per-region gaps alongside the headline score.
- [ ] **B114:** Use the same calculation snapshot for summary and detailed analysis.
- [ ] **B115:** Reproduce the walkthrough's 11-point versus 15-point adductor-gap discrepancy if possible. Determine whether it is scope, stale state, or formula divergence; fix the actual cause.
- [ ] **B116:** Ensure edit, add, remove, reorder when relevant, and Undo invalidate exactly the necessary derived results.
- [ ] **B117:** Distinguish planned weekly coverage from completed weekly exposure in API contracts and UI consumers.

### 7.2 Recommendation utility

Do not recommend an exercise only because it contains a tag that matches a gap. Evaluate its marginal contribution under the same model used to report coverage.

- [ ] **B118:** Define candidate eligibility before ranking: equipment, selected day, supported movement, user exclusions, time, and other actual constraints.
- [ ] **B119:** Calculate candidate marginal effect against the current snapshot and a specified candidate prescription.
- [ ] **B120:** Separate hard constraints from preferences. A recommendation should not violate a hard equipment restriction just to improve a score.
- [ ] **B121:** Consider redundancy, session time, and fatigue cost where the existing model supports them.
- [ ] **B122:** Prevent duplicate candidates arising from aliases; distinguish legitimate variants.
- [ ] **B123:** Provide reason codes such as closes target gap, supports selected sport demand, available equipment, or lower redundancy.
- [ ] **B124:** Explain infeasible requests rather than generating impossible plans.
- [ ] **B125:** Preview a generated/replacement plan before committing; preserve the current plan unless the user accepts replacement.
- [ ] **B126:** Make recommendation order deterministic for a fixed snapshot, or expose/control the seed if diversity is intentional.
- [ ] **B127:** Re-evaluate after a candidate is added; the next suggestion should reflect the new plan.

### Worked arithmetic fixture — deliberately synthetic

This fixture tests a proposed weighted capped-coverage implementation **only if that is the chosen model**. It is not a scientific target prescription and must not replace the current engine automatically.

```text
Two regions, equal weights:
A target = 4 model units; contribution = 3
B target = 2 model units; contribution = 0
Capped ratios = min(3/4,1)=0.75 and min(0/2,1)=0
Weighted coverage = (0.75 + 0)/2 = 0.375 = 37.5%
Shortfalls = 1 and 2 model units

Candidate adds A=1, B=1:
New ratios = 1 and 0.5
New coverage = 75%; marginal change = +37.5 percentage points

Oversupplying A to 8 while B remains 0:
Coverage = 50%, not 100%, under this specific capped model.
```

- [ ] **B128:** If this model is adopted, verify the fixture independently. If a different existing model is retained, supply an equally explicit fixture for that model and explain its tradeoffs.

## 8. Sports Transfer mapping

Preserve the distinction between physical relevance to a sport movement and demonstrated improvement in sport performance. The engine may infer relevance without claiming a validated causal effect size.

- [ ] **B129:** Map sport/action IDs to actual demand dimensions: force direction, contraction, range, timing, stability, coordination, or others already supported.
- [ ] **B130:** Keep physical demand mapping separate from superficial movement resemblance.
- [ ] **B131:** Define how exercise capacity profiles match demands and how training goal changes the weighting.
- [ ] **B132:** Trace at least one wrestling action, such as the currently shown overhook/whizzer, through demands, candidates, rationale, and prescription context.
- [ ] **B133:** Keep direct evidence, mechanistic inference, and expert-authored mappings distinguishable.
- [ ] **B134:** Do not assign a causal transfer percentage when the evidence only supports a relevance score.
- [ ] **B135:** Verify that selecting a new sport/action updates filters and explanations without retaining the previous context.
- [ ] **B136:** Provide a coherent non-sport/general-training path; absence of a sport is not an error.
- [ ] **B137:** Treat self-reported limitations and training priorities as explicit inputs, not automatically diagnosed injuries. Preserve supported exclusions without inventing treatment claims.
- [ ] **B138:** Explain why the top recommendations differ from the next candidates and which constraints affected the ranking.

## 9. Reference data, eligibility, and evidence releases

The goal is useful, traceable data—not the largest possible eligible-row count. Do not blanket-promote review queues to make dashboards look complete.

- [ ] **B139:** Audit evidence eligibility by normative family and protocol, not only row by row or by global switch.
- [ ] **B140:** Preserve provenance, population, test protocol, units, outcome direction, sample information, and transformation history.
- [ ] **B141:** Keep exact exercise matches separate from aliases, related movements, and inferred transfers.
- [ ] **B142:** Detect duplicated studies/data reported across multiple sources; do not inflate evidence volume by counting copies as independent samples.
- [ ] **B143:** Record promotion/rejection reasons and the revision in which they changed.
- [ ] **B144:** Validate source completeness and licensing/usage constraints where applicable before promoting an external dataset.
- [ ] **B145:** Compare candidate reference releases against a frozen benchmark fixture set before activation.
- [ ] **B146:** Quantify which outputs change, by how much, and for which reference families; investigate large unexpected movements.
- [ ] **B147:** Preserve rollback to the previous reference release without deleting newly collected raw evidence.
- [ ] **B148:** Expose concise evidence/reason metadata to app consumers while keeping large research payloads out of routine screen requests.
- [ ] **B149:** Keep personal user records separate from research norms and aggregate community data.
- [ ] **B150:** Do not automatically feed early users into population norms. Document opt-in/permission, deduplication, outlier handling, selection bias, and minimum-quality criteria before such a pipeline becomes active.

## 10. Plans, sessions, events, and reliable persistence

### 10.1 Separate intention from history

- [ ] **B151:** Keep plan templates and actual workout sessions separate. Editing tomorrow's prescription must not rewrite yesterday's performed sets.
- [ ] **B152:** Capture appropriate plan lineage/snapshot when a workout starts, using the existing architecture.
- [ ] **B153:** Define explicit session transitions: planned/not-started, active, completed, abandoned, and any existing additional states.
- [ ] **B154:** Make start/finish retry-safe so double taps or network retries do not create duplicate sessions or completion counts.
- [ ] **B155:** Define what counts as a completed workout, logged lift, and completed set. Use the same definitions in Home, Progress, and Strength.
- [ ] **B156:** Do not count a saved plan as a completed workout or a prescribed set as a logged observation.
- [ ] **B157:** Resolve Home's next workout from explicit plan/session rules rather than array position or a stale cached selection.
- [ ] **B158:** Keep an in-progress workout resumable across route changes and app restarts.
- [ ] **B159:** Define deletion/correction of a historical set and its effect on aggregates, records, and derived results.

### 10.2 Reliable add, remove, reorder, and Undo

- [ ] **B160:** Bind operations to stable week/day/session IDs, not visible labels or a mutable global selected index.
- [ ] **B161:** Distinguish a duplicate network request from the user intentionally adding another instance of an exercise.
- [ ] **B162:** Make Undo reference the exact operation/instance it reverses.
- [ ] **B163:** Prevent Undo from deleting another user's change or an independently edited record without conflict handling.
- [ ] **B164:** Make multi-row mutations atomic where partial success would corrupt the plan.
- [ ] **B165:** Preserve ordering deterministically and handle concurrent reorder/edit operations explicitly.
- [ ] **B166:** Return authoritative destination, count, and revision after mutation so feedback and downstream calculations agree.

### 10.3 Offline and local-to-account sync

Do not replace functional offline behavior with mandatory network access. Also do not call a local-only save cloud-backed when it is not.

- [ ] **B167:** Document which actions work offline and which require verification/network access.
- [ ] **B168:** Use durable pending operations with stable IDs where offline writes are supported; survive app termination before sync.
- [ ] **B169:** Distinguish saved locally, syncing, saved to account, failed, and conflicting states.
- [ ] **B170:** Reconcile retries idempotently; an app restart during sync must not duplicate sets.
- [ ] **B171:** Define conflict rules for two-device edits. Do not choose last-write-wins everywhere without considering lost workout data.
- [ ] **B172:** Preserve deletion intent through tombstones or an equivalent mechanism so stale devices do not resurrect deleted records.
- [ ] **B173:** Namespace local records/caches by account. Signing out and into another account must not reveal or merge the first account's data.
- [ ] **B174:** Make guest-to-account import explicit and repeatable without duplicate imports.
- [ ] **B175:** Avoid attaching ambiguous shared-device local data to a newly signed-in account without a clear ownership decision.
- [ ] **B176:** Define behavior when authentication expires during a save. Keep legitimate unsynced work recoverable.
- [ ] **B177:** Implement stable schema migration for existing local data if its format changes.

## 11. Supabase access control and server authority

Follow the project's actual Supabase version and current official documentation. The current RLS guidance distinguishes object grants from row policies: both need review. Enabling RLS is not a complete authorization design, and possessing an authenticated session is not proof of ownership. See source S1.

- [ ] **B178:** Enumerate exposed tables, views, RPCs, Edge Functions, and storage paths with their intended anonymous/user/server access.
- [ ] **B179:** Apply row-level restrictions to user-owned data and appropriate read-only rules to shared reference data.
- [ ] **B180:** Test ownership on create, read, update, and delete, including attempted owner reassignment and foreign child-parent combinations.
- [ ] **B181:** Audit view/function privileges and execution context so an indirect endpoint cannot bypass intended ownership checks.
- [ ] **B182:** Review privileged functions individually. Do not add elevated execution merely to make a permission error disappear.
- [ ] **B183:** Keep server secrets out of frontend builds, logs, screenshots, and generated reports.
- [ ] **B184:** Do not trust user-editable profile metadata for roles, paid access, evidence promotion, or administrative authorization.
- [ ] **B185:** Validate ownership and premium access on relevant server endpoints; hiding frontend buttons is not enforcement.
- [ ] **B186:** Verify session/token handling with the actual runtime and current guidance, including stale claims and sign-out behavior.
- [ ] **B187:** Test storage access if profile images, imports, or exports are used.
- [ ] **B188:** Provide account deletion and export behavior appropriate to actual stored data; include derived records, storage, and background jobs in the lifecycle audit.
- [ ] **B189:** Ensure account deletion does not silently imply a separately billed App Store subscription has been canceled; make the subscription-management path clear.
- [ ] **B190:** Run relevant database/security advisors and investigate material findings rather than suppressing them.

### Required access test identities

Use an unauthenticated client, user A, user B, and an authorized server role in an isolated environment. Exercise real API paths. A test executed only as database administrator cannot prove user isolation.

- [ ] **B191:** A can operate on A's authorized records.
- [ ] **B192:** B cannot read, mutate, attach children to, or infer sensitive details about A's records through tables, joins, views, RPCs, search, or storage.
- [ ] **B193:** Anonymous requests receive only explicitly intended public information.
- [ ] **B194:** User clients cannot alter curated evidence, engine configuration, subscription state, or privileged flags.
- [ ] **B195:** Server operations use only the necessary privilege and leave an appropriate operational trace without leaking sensitive payloads.

## 12. iOS subscriptions and grandfathered pricing

### Confirmed commercial policy

The owner has selected the following **target US-dollar pricing**, subject to selecting the actual available App Store price points and localized prices during setup:

- Early subscription: approximately **$8 per month**.
- After the broader January 2027 release/price change: approximately **$10 per month for new subscribers**.
- Existing early subscribers retain their price **indefinitely**, including future product updates, using Apple's supported preserved-price behavior.
- Monthly billing remains cancellable; this is not an annual commitment or a 12-month introductory offer.
- The owner accepts Apple's preserved-price resubscription behavior, including its documented 60-day window after expiration. Do not implement a stricter custom immediate-forfeiture rule. See S2.
- The exact January price-change date is not established. Do not hardcode January 1 or schedule an increase without an actual date decision.

**Important separation:** App Store billing determines the charged price; the app backend determines verified access from transaction/subscription evidence. A local `founder=true` flag is neither proof of purchase nor authority to bill a price.

### Architecture and product setup

- [ ] **B196:** Inspect existing StoreKit/native wrapper/payment integration and decide how it connects to the actual iOS app. If there is no iOS build yet, identify that dependency explicitly.
- [ ] **B197:** Reuse an existing competent purchase provider if already integrated; otherwise choose a supported architecture and document the decision. Do not build two competing entitlement systems.
- [ ] **B198:** Prefer a monthly product with a later price change preserving existing subscribers where that matches the supported configuration; verify details in App Store Connect rather than inventing separate founder products unnecessarily.
- [ ] **B199:** Keep product IDs, app identity, subscription group, and sandbox/production configuration explicit and environment-specific.
- [ ] **B200:** Load localized price/display data from the store; do not hardcode a dollar symbol and US price for every user.
- [ ] **B201:** Record planned pricing separately from live configured pricing. Do not claim that subscriptions are set up merely because a paywall renders.
- [ ] **B202:** Define which capabilities require paid access in an explicit entitlement matrix. Existing paid/free product decisions take precedence; unresolved commercial choices must remain named decisions, not invented restrictions.

### Verification and event processing

Apple documents signed transaction/subscription information and App Store Server Notifications V2. Verify authenticity using supported tooling; decoding a payload is not verification. Use current APIs and installed library versions. See S3–S4.

- [ ] **B203:** Verify relevant signed transaction/notification data, app identity, expected product, environment, and ownership association before granting access.
- [ ] **B204:** Prevent replaying another account's transaction to claim entitlement. Define legitimate restore/account-linking behavior without silently transferring ownership.
- [ ] **B205:** Keep stable original-transaction lineage and individual event/transaction IDs in the purchase record model.
- [ ] **B206:** Process duplicated and out-of-order events safely; an older expiration event must not overwrite a verified later renewal blindly.
- [ ] **B207:** Persist incoming verified events or equivalent provider records durably enough to retry processing after failures.
- [ ] **B208:** Separate event receipt/verification from completed entitlement processing and expose failure/retry state operationally.
- [ ] **B209:** Implement reconciliation with the authoritative provider when notifications are missed or state is uncertain.
- [ ] **B210:** Support purchase success, pending/deferred purchase, user cancellation of purchase UI, renewal, expiration, refund/revocation, billing retry, and grace-period behavior as applicable.
- [ ] **B211:** Do not treat turning off auto-renewal as immediate expiration; preserve access through the verified paid period.
- [ ] **B212:** Do not equate billing retry with active paid entitlement. Apply actual configured grace-period and authoritative subscription state.
- [ ] **B213:** Keep sandbox transactions from unlocking production accounts except through an explicitly isolated test configuration.
- [ ] **B214:** Support restore purchases and reconcile an existing purchase on a new device.
- [ ] **B215:** Define a bounded offline-access policy for recently verified subscribers without allowing a client clock edit or permanent cached boolean to grant unlimited access.
- [ ] **B216:** Never delete workout history because a subscription expires. Access policy and data retention are separate concerns.
- [ ] **B217:** Keep any support/admin access override narrowly authorized, time-bounded where appropriate, and auditable.

### Subscription acceptance matrix

| Scenario | Required evidence |
|---|---|
| Valid new purchase | Correct account receives entitlement from verified transaction |
| Purchase sheet canceled | No entitlement or charge-success message fabricated |
| Purchase pending | Pending state survives without false unlock or false failure |
| Auto-renew disabled | Access lasts through verified entitlement expiry |
| Duplicate renewal notification | No duplicate financial record or incorrect extra duration |
| Older event after newer event | Final state agrees with authoritative current subscription |
| Refund/revocation | Access updates according to verified provider state |
| Notification outage | Reconciliation recovers correct state |
| Restore on another device | Same rightful account recovers access without repurchase |
| Transaction presented by unrelated account | Rejected or resolved through defined ownership procedure |
| Preserved early price | Store configuration preserves eligible subscribers; app messaging agrees |
| Return during/after preserved-price window | Behavior follows Apple's actual rules; no conflicting custom promise |

- [ ] **B218:** Execute supported sandbox tests and distinguish simulated fixtures from actual store tests.
- [ ] **B219:** Record configuration/setup blockers such as absent credentials or developer account access without fabricating a purchase integration.
- [ ] **B220:** Produce the exact remaining App Store Connect configuration checklist for the owner, with screenshots/identifiers where available and no exposed secrets.

## 13. Transactions, migrations, and compatibility

- [ ] **B221:** Keep a migration for every intended durable schema change and follow current project tooling conventions.
- [ ] **B222:** Test migrations against both a fresh database and a representative existing schema with populated fixtures.
- [ ] **B223:** Prefer additive changes and staged backfills when replacing a field or computation.
- [ ] **B224:** Check constraints, null/default behavior, foreign keys, indexes, and policies after backfill—not only before it.
- [ ] **B225:** Make backfills resumable, bounded, and observable; do not run unbounded production rewrites merely to simplify code.
- [ ] **B226:** Preserve old-client compatibility where installed iOS versions may continue calling an endpoint after release.
- [ ] **B227:** Give changed contracts an explicit compatibility or deprecation path.
- [ ] **B228:** Test rollback/recovery on staging. Recognize that reverting code does not necessarily reverse transformed data.
- [ ] **B229:** Do not reset migrations, truncate user tables, or recreate production datasets to force a clean test.
- [ ] **B230:** Ensure necessary backups/recovery access are available before an authorized material production migration; document what was actually verified.

## 14. Performance and operations

Optimize observed bottlenecks rather than inventing an infrastructure platform before launch.

- [ ] **B231:** Measure representative latency and query count for opening Home, searching exercises, adding to a plan, saving a set, computing coverage, and opening Strength.
- [ ] **B232:** Define environment, fixture size, cold/warm conditions, and percentile when reporting performance. A single local timing is not a production SLA.
- [ ] **B233:** Investigate repeated queries, unnecessary full-dataset downloads, and recomputation on unrelated state changes.
- [ ] **B234:** Use indexes and bounded/paginated queries justified by actual access patterns.
- [ ] **B235:** Keep search results stable across pagination and updates where the product needs that consistency.
- [ ] **B236:** Prevent public or authenticated endpoints from triggering unbounded expensive analysis without appropriate bounds/rate controls.
- [ ] **B237:** Make background calculations retryable and prevent stale job results from replacing newer input revisions.
- [ ] **B238:** Track error counts, failed saves/syncs, unsupported norm reasons, calculation failures, and entitlement-processing failures.
- [ ] **B239:** Use correlation IDs or equivalent tracing across relevant client/server operations without logging entire private workouts, auth tokens, or signed purchase payloads unnecessarily.
- [ ] **B240:** Provide a small operational runbook for failed sync, bad reference release, stale calculation, missed purchase event, and unavailable service.
- [ ] **B241:** Verify that error monitoring itself does not expose secrets or sensitive profile details.

## 15. Numeric and behavioral fixtures

These examples distinguish product invariants from scientific assumptions. Use actual source-backed formulas for science tests; use clearly synthetic values for pure arithmetic and state tests. Independently calculate expected results instead of asking the same production function to generate its own expected answer.

### 15.1 Exact unit and load fixtures

- [ ] **B242:** Convert 100 lb to 45.359237 kg using the exact mass conversion, then round only for display.
- [ ] **B243:** Verify equivalent pound/kilogram representations produce equivalent normalized results within declared floating-point tolerance.
- [ ] **B244:** A pair of 25 kg dumbbells under a total-external-load convention normalizes to 50 kg; the same entry explicitly recorded as 25 kg total remains 25 kg.
- [ ] **B245:** A unilateral 25 kg lift is not automatically converted to 50 kg merely because the user has two limbs.
- [ ] **B246:** For a deliberately defined assisted-pull-up protocol, verify increasing assistance cannot improve the inferred unassisted performance with everything else held fixed.

### 15.2 Adjustment fixture — synthetic, not a coefficient recommendation

```text
A reference metric for a chosen percentile is 100 units.
A justified age-group multiplier would hypothetically be 0.90.
If the model adjusts expected performance, the adjusted reference is 90 units.
An observed 90 units should therefore match the original percentile anchor.
Do not both multiply the reference by 0.90 and divide the observation by 0.90
within an already adjusted comparison; that applies the effect twice.
```

- [ ] **B247:** Create a similar independent fixture for each actual adjustment stage, including inverse direction and already-adjusted reference data.
- [ ] **B248:** Verify bodyweight changes do not alter a historical score unless the selected historical-context policy explicitly calls for recalculation.
- [ ] **B249:** Verify lower-is-better tests reverse comparison direction correctly.
- [ ] **B250:** Verify unknown age/context leads to the documented estimate or missing-context state, not silently the best-performing demographic.

### 15.3 Scientific-engine behavior fixtures

- [ ] **B251:** Demonstrate how a compound lift contributes to multiple muscles without making every muscle's isolated strength equal to the whole lift.
- [ ] **B252:** Demonstrate planned versus performed exposure using a workout with prescribed sets that were not all completed.
- [ ] **B253:** Demonstrate what changes when RIR is known versus missing; explain the assumption rather than inventing an exact physiological difference.
- [ ] **B254:** Demonstrate an unsupported exercise/test returning an honest status while preserving its valid workout log.
- [ ] **B255:** Demonstrate two nearly synonymous exercise names resolving to one canonical search identity without merging mechanically distinct variants.
- [ ] **B256:** Demonstrate a reference-data version change with preserved original inputs and a traceable output delta.

### 15.4 State and integration fixtures

- [ ] **B257:** Add → retry same request → one addition; add a new intentional instance → expected additional instance.
- [ ] **B258:** Finish workout → duplicate finish event → one completed workout count.
- [ ] **B259:** Undo one addition → only that addition removed; derived totals match.
- [ ] **B260:** Edit plan after completing a session → historical performed data unchanged.
- [ ] **B261:** Log offline → terminate app → reopen → reconnect → one durable record.
- [ ] **B262:** Sign out A → sign in B → no A profile/plan/history leaks from caches.
- [ ] **B263:** Change week/day while a request is in flight → response updates its intended destination, not the newly selected day.
- [ ] **B264:** Launch with persisted plan loading → pending state, not false empty plan.
- [ ] **B265:** Home/Plan/analysis/Progress use matching definitions and revisions for shared counts and scores.
- [ ] **B266:** Simulate late calculation response → newer input result remains authoritative.

## 16. Release gates and definition of done

A successful build alone does not establish backend readiness. Use a layered verification approach: pure calculation tests; real database/policy tests; API/mutation tests; app journeys; store sandbox tests where applicable. Reuse the existing test framework and avoid tests that merely assert implementation details.

### Gate A — data and ownership

- [ ] **B267:** No known cross-user access path in exercised endpoints.
- [ ] **B268:** Plan/session writes survive the tested restart/offline/retry flows.
- [ ] **B269:** No duplicate completion or addition from retried operations.
- [ ] **B270:** Migrations and existing-user upgrade paths pass representative tests.

### Gate B — internal logic

- [ ] **B271:** Core exposed scores have explicit input semantics, a documented calculation path, source or assumption basis, and independent fixtures.
- [ ] **B272:** Unsupported inputs do not produce fabricated ordinary scores.
- [ ] **B273:** Summary/detail results agree for the same scope and input revision.
- [ ] **B274:** Major calculation changes have a before/after delta report and an explanation.
- [ ] **B275:** No tuning solely to make the owner's personal score look higher or to fit screenshots. Expected-case disagreement triggers source/method investigation.

### Gate C — payments

- [ ] **B276:** Paid access depends on verified entitlement and survives tested purchase/restore/renewal paths.
- [ ] **B277:** Cancellation, expiration, grace/retry, and revocation are not collapsed into one boolean.
- [ ] **B278:** Founders pricing configuration and app messaging agree with the actual store setup.
- [ ] **B279:** Missing live-store configuration is clearly identified; no claim that revenue collection is ready without it.

### Gate D — consumer integration

- [ ] **B280:** Frontend consumers use the repaired contracts. An unused correct backend does not fix the app.
- [ ] **B281:** Home, Plan, Workout, Progress, Strength, and exercise recommendations pass their relevant complete journeys.
- [ ] **B282:** Loading/error/partial states preserve usable data and understandable next steps.
- [ ] **B283:** Record what was tested on desktop, simulated mobile, actual iOS build, and store sandbox separately.

### Gate E — maintainability

- [ ] **B284:** Tests, migrations, decisions, and documentation match the implemented state.
- [ ] **B285:** Known remaining risks are prioritized and have specific reproduction or verification steps.
- [ ] **B286:** V2 can begin by reading the handoff and running the baseline without reconstructing undocumented decisions.

## 17. Work sequence and checkpoints

Execute in this order unless discovery demonstrates a concrete dependency requiring a change:

1. Inventory and baseline traces.
2. Canonical IDs, units, input contracts, and ownership rules.
3. Reliable plan/session persistence and synchronization.
4. Repair currently exposed strength, effect, coverage, and transfer logic.
5. Connect consistent results to all consumers.
6. Implement/complete purchase entitlement integration and required store setup artifacts.
7. Run cross-system, migration, and permission tests.
8. Measure important performance paths and repair observed bottlenecks.
9. Produce release-gate report and V2 handoff.

Payment integration may proceed earlier if it is the critical dependency for the launch, but do not leave data-loss or ownership problems unaddressed. Research expansion should not displace fixing an already-visible contradictory score.

### Checkpoint format

At each meaningful stopping point, record:

```text
Current branch/commit and environment:
Requirements completed and evidence:
Current confirmed failure/root cause:
Files/migrations changed but not verified:
Tests run and actual results:
Open transactions/jobs or rollout state, if any:
Next concrete action:
Access/decision blockers:
```

Do not record credentials, tokens, or private data dumps. If context becomes constrained, update this checkpoint before continuing. Resume from it; do not restart the architecture discussion.

## 18. Backend V2 inheritance contract

The next brief builds on this work. The following rules apply now so later work remains incremental:

- [ ] **B287:** Record existing engine versions and assign new versions only for meaningful calculation/contract changes.
- [ ] **B288:** Maintain a compatibility map between client contract, engine version, schema revision, and reference-data revision.
- [ ] **B289:** Preserve baseline fixtures and add regression cases for every material bug repaired in V1.
- [ ] **B290:** Mark intentional behavior changes explicitly so V2 does not mistake them for regressions.
- [ ] **B291:** Carry unresolved issues forward with stable IDs, dependencies, attempted approaches, and evidence.
- [ ] **B292:** Separate V2 ideas from unfinished V1 requirements. Do not quietly reclassify incomplete launch-critical work as a future enhancement.
- [ ] **B293:** For each candidate extension, identify whether it adds a module, expands supported inputs, improves evidence, or changes existing semantics.
- [ ] **B294:** Keep deprecated paths until their actual consumers have migrated, then remove them through a deliberate follow-up.
- [ ] **B295:** Ensure model/data rollback does not require erasing user observations.

### Potential V2 directions — not automatic V1 scope

After the real V1 state is known, useful follow-on work may include broader age-aware normative families, better-calibrated uncertainty, expanded sport actions, more precise effect dimensions, improved personalization from longitudinal records, richer plan optimization, and research-backed evaluation of recommendation quality. These are candidates, not permission to invent unsupported coefficients or activate an unreviewed community-norm pipeline.

## 19. Required final response from Claude

Lead with what now works and what remains blocked. Include:

1. **Actual architecture found:** what existed, what was reused, what was added.
2. **Implementation summary:** requirements completed and files/modules/migrations affected.
3. **Calculation evidence:** at least one full trace for strength, muscle effects, coverage, and sport relevance where those systems exist.
4. **Data integrity proof:** tested save, restart, sync, retry, Undo, history-preservation, and ownership cases.
5. **Subscription status:** actual integration/configuration completed versus owner/provider steps outstanding.
6. **Verification:** commands, results, environment, fixtures, and device/store coverage actually exercised.
7. **Numerical deltas:** what changed in representative outputs and why.
8. **Release gates:** pass, fail, blocked, or unverified with evidence for each gate.
9. **V2 handoff:** stable baseline, remaining defects, recommended independent extensions, and compatibility constraints.

- [ ] **B296:** Do not claim the app is launch-ready solely because this checklist is long, tests compile, or all code has been written.
- [ ] **B297:** Do not describe an unrun test as passed or a proposed migration as applied.
- [ ] **B298:** End with a concrete next-state handoff, not a vague invitation to start the work later.

## 20. Official implementation references

These sources inform platform-specific portions of this brief. They do not validate Sports Genome's scientific coefficients. During implementation, inspect current project versions and current primary research/documentation for each actual method.

- **S1 — Supabase Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **S2 — Apple subscription pricing and preserved prices:** https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions/
- **S3 — Receiving App Store Server Notifications:** https://developer.apple.com/documentation/appstoreservernotifications/receiving-app-store-server-notifications
- **S4 — App Store Server API:** https://developer.apple.com/documentation/appstoreserverapi
- **S5 — Supabase changelog:** https://supabase.com/changelog

Platform documentation was consulted while preparing this brief. No live backend, purchase configuration, scientific dataset, or repository was audited by the author for this assignment. Claude's first implementation pass must establish that evidence.

**Completion standard:** preserve the product's depth, make its internal reasoning inspectable, ensure its records and payments are dependable, and leave an extensible working baseline. V1 is the start of a continuing engineering program, not a reset and not the last version.
