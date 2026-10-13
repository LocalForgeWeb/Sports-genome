# Percentile ceilings and the 95 + 95 → 94 muscle rank

Work for the brief of 13 October 2026 ("Repair percentile ceilings and muscle-rank
calculations"). Everything here was verified locally. Nothing has been verified in preview or
production. The production database was only read, with read-only queries; nothing was written
to it.

## 1. Root causes

Both symptoms come from the muscle-rank route: `server/supabaseStrengthProfile.ts` →
`server/muscleAggregation.ts` → `shared/capabilityRank.ts` → the sheet (`CapabilityRank.tsx`,
`StrengthGenomePanel.tsx`). The single-lift card (`shared/strengthPercentile.ts`) was already
refusing to extrapolate past the top anchor and was not involved.

**Repeated 95ths.**
- `get_beta_strength_percentile_v1_core`, as deployed (read with `pg_get_functiondef` on 13
  October), handles a lift above the curve's highest anchor this way:
  `v_pct := v_max_pct; v_status := 'above_range'; v_censored := true`. It returns
  `percentile_estimate: 95` alongside `status: "above_range"` and `censored: true`.
- `score_strength_input_v1` and `apply_strengthlevel_age_adjustment_v1` keep that object intact
  under `percentile`.
- `scoreMuscleProfile` read only `score.percentile.percentile_estimate`
  (`numberOf(score?.percentile?.percentile_estimate)`).
- So every lift past the top anchor entered the aggregation, the evidence rows and the sheet as
  an exact 95. All community curves top out at the 95th, so every exceptional lift printed
  "95th".

**95 + 95 shown as 94.**
- `aggregateMuscleStrength` is a transcription of the database's `aggregate_muscle_strength_v1`.
  It converts each lift's percentile to a logit latent and multiplies it by a role "signal
  transfer", `min(1, 0.70 + 0.30 × contribution_weight)` for a prime mover, before taking the
  weighted mean.
- Lat Pulldown (contribution 0.95) gets 0.985 and Machine Low Row (0.84) gets 0.952. Two exact
  95s therefore averaged to 94.63, which `displayPercentile` floors to "94th".
- Screenshot A's "91st" has the same cause: 91.14 from the logit model, where the plain weighted
  mean the sheet's weights imply is 90.92.

**A related selection issue.** Of two lifts of one exercise, the route kept the higher percentile
and broke ties on confidence. With both lifts read as an identical 95, the more confident, often
lighter, one won.

## 2. Before/after traces

These come from the real route, using the database's own answers for the four lifts. They were
recorded on 13 October with `score_strength_profile_v1(65.8, 'male', …)`, then
`apply_strengthlevel_age_adjustment_v1(…, 17.0, …)`, and are stored in
`server/fixtures/latsScreenshots.ts`.
- 145 lb is 65.77 kg, which the route rounds to 65.8 kg.
- Age 17.0 is the age that reproduces the displayed 89th; the screenshots do not show it.
- Raw files: `trace-before.json`, `trace-after.json`, `route-responses.json`. The failing
  pre-fix run is `reproduction-before-fix.txt`.

**Per lift.** These values come from the database and are the same before and after the fix.

| Lift | e1RM (method) | Compared at | Database status | `percentile_estimate` |
|---|---|---|---|---|
| Lat Pulldown 187 lb × 6 | 98.503 kg (Brzycki) | 1.65818× BW (age-scaled; 1.497× raw) | `ok` | 89.49 |
| Machine Low Row 600 lb × 12 | 381.017 kg (Epley), via alias to Seated Cable Row | 6.41397× | `above_range`, censored | 95 |
| Lat Pulldown 350 lb × 1 | 158.757 kg | 2.67249× | `above_range`, censored | 95 |
| Machine Low Row 325 lb × 8 | 183.002 kg (8-rep blend) | 3.08062× | `above_range`, censored | 95 |

The top anchor for both curves is 1.75× body weight at the 95th
(male Strength Level x_bodyweight: 0.5 / 0.75 / 1.0 / 1.5 / 1.75 at P5 / 20 / 50 / 80 / 95).

**Weights** (same before and after): Lat Pulldown 0.68079, Machine Low Row 0.31921. Each is
mapping confidence × lift confidence × √contribution × role × directness, normalised. Confidence
is 0.783 in both versions, which is Moderate.

| | Before (v2) | After (v3) |
|---|---|---|
| A: lats | 91.14 → "State · 91st percentile". The row is shown as "95th percentile on its own" | Range 91.249 to 92.845 → "State Circuit · Benchmark score 91–92". The row is "above the 95th-percentile benchmark · placed at 6.41× against 1.75×" |
| B: lats | 94.63 → "State · 94th percentile" under two "95th" rows | At least 95 (95 to 100) → "National Circuit · Benchmark score above 95 · Minimum rank". Both rows are "above the 95th-percentile benchmark" |

Screenshot B's Machine Low Row row being 325 × 8 rather than 600 × 12 means the 600 × 12 record
had been edited or deleted. The client sends each exercise's strongest lift by age-adjusted e1RM
(`muscleRankLiftSelection`), so had 600 × 12 still existed it would have been the one sent.
Under the old rule the two would have tied at 95 anyway. Under the new rule the one further past
the benchmark (600 × 12) is kept, and the sheet names the lift the route kept.

## 3. What the numbers mean now

**Per lift.** `exact` (inside the anchors, interpolated) or a bound: `above` (strictly past the
highest anchor) or `below`. A bound is carried end to end:
- through the database status,
- `percentileBoundOf`,
- the aggregation input,
- the evidence rows,
- JSON serialization (tested),
- the sheet.

A placement the route cannot read (an unknown status, or `censored` with no status) is not
guessed at. It is listed as not counted, with the reason `unreadable_placement`.

**Per muscle: a weighted benchmark score**, `sg_muscle_benchmark_v3`.

    score = Σ wᵢ · cᵢ / Σ wᵢ

- **wᵢ** are the same weights as before, normalised over the lifts actually included. Zero,
  negative or non-numeric weights are excluded from both sums.
- **cᵢ** is what the lift counts as for the muscle.
  - A prime mover's lift counts at its own percentile.
  - A lift the muscle only assists counts through the database's unchanged latent transfer, so a
    row cannot hand the biceps the row's rank. The sheet says "counts as 86 here".
- **The score is a weighted mean on the percentile scale.** Identical inputs keep their value
  (95 and 95 give 95), and the score always lies between the smallest and largest counted value.
  It is labelled "Benchmark score", never a percentile of muscle strength: no muscle-level
  population has been measured.
- **Bounds propagate arithmetically.** An `above` lift counts as anywhere in (anchor, 100]; a
  `below` lift as anywhere in [0, anchor). The score is `exact`, `at_least`, `at_most` or a
  `range`.
- **Rank.** The rank is the band of the lower bound. It is marked "Minimum rank" when the upper
  bound reaches a higher band.
  - A bound above 95 is "National, at least", never World Stage. World Stage's cutoff (99) is
    unchanged.
  - With a bound there is no "next rank" or progress line.
- **Confidence** is unchanged and never alters the score.

**Why the mean is now taken on the percentile scale rather than the logit scale.** The sheet
shows each lift's percentile and its share. A logit mean of those numbers is not their weighted
mean: chest at 86 / 60 / 67 with shares 70 / 19 / 11 printed 80 where the shown arithmetic gives
78.9. That is the same unexplained gap the brief reports.

**Impact on the recorded inputs** (`impact-dry-run.json`, eight lift sets from low to high):
- 67 drawn muscles; 2 change band, both down: chest 80.4 → 78.9 (State → Regional), and an
  extreme 99.5 bench with a 40th-percentile fly, 77.5 → 59.8 (Regional → Varsity).
- In both, the logit scale had let one extreme lift dominate.
- A single prime-mover lift now reads at its own percentile (bench 68.75 was 68.5).

## 4. Coverage above the 95th

**No production exercise supports a percentile above 95.** Inventory: `reference-coverage.csv`.
- **Catalog-linked exercises in the database: 330.**
  - 88 have their own beta-eligible curve.
  - 107 borrow one through an active alias.
  - 135 have none.
- Every beta-eligible curve's highest anchor is P95. The only other sources stop at P90–95 and
  are not permitted for beta ranking.
- Lat Pulldown and Seated Cable Row: male and female Strength Level curves with anchors at
  5 / 20 / 50 / 80 / 95.
- Machine Low Row has no curve of its own and borrows Seated Cable Row's (multiplier 1.0,
  confidence × 0.74).

**Source research** (13 October; strengthlevel.com could not be fetched from this environment,
so this comes from search-indexed copies of its pages and needs checking on the live site):
- Strength Level defines its levels as percentiles of its users' logged lifts: Beginner "stronger
  than 5% of lifters", Novice 20%, Intermediate 50%, Advanced 80%, Elite "stronger than 95% of
  lifters". It publishes nothing above Elite. Its calculator's behaviour above Elite could not be
  confirmed.
- Its terms forbid automated access and "derivative versions of our calculators or standards".
- No other legitimate source was found. Piper et al. 2021 is 10-rep maxes in untrained college
  men. StrengthLog stops at Elite (95%). FitnessVolt and StrengthChecker are models, not
  measured upper tails.
- **So the honest result above the 95th anchor is a bound.** It is not extrapolated, and no tail
  model was fitted: five anchors cannot validate a 99th-percentile claim.

**Engine capability, proven synthetically.** `server/muscleBenchmarkScore.test.ts`, clearly
labelled SYNTHETIC, shows that a curve with 97th and 99th anchors interpolates (2.05× → 98.0),
refuses past its last anchor, and reaches National and World Stage exactly. Supplying legitimate
upper-tail anchors needs no code change.

**Limits found on the way** (reported, not changed here):
- **Stored anchors may be out of date.** At 140 / 150 lb bodyweight, Strength Level's indexed
  pages give Lat Pulldown Elite as about 1.84× / 1.79× and Seated Cable Row as about 1.89× /
  1.84×. The stored relative curve has 1.75× for both, a single ladder rather than per-bodyweight
  tables. The stored curve may be an older or rounded snapshot.
- **Licensing is unresolved.** The repo's own `research/strength_genome_normative_reference_review.md`
  says no table extraction or derived percentile is allowed until a written licence exists, while
  every beta curve is from Strength Level. Someone should confirm whether permission was
  obtained.
- **Machine loads are not comparable across machines.** Machine Low Row is ranked on the Seated
  Cable Row curve with "leverage differs" noted only as a confidence cut. A plate-loaded machine
  read at 6.41× body weight likely reflects machine leverage as much as strength. The bound is
  reported honestly, but a decision is needed: exclude plate-loaded machines from cable-row
  aliases, or lower the confidence further.
- **120 app exercises have no catalog link.** App catalog ids 301–350 and 381–450 have no
  `__catalog_<id>` row in the database. That includes Wide-Grip Cable Lat Pulldown (id 327),
  which exists as `wide_grip_cable_lat_pulldown` with an active alias to Lat Pulldown but cannot
  be found by catalog id, so the sheet says "not in the comparison library yet". The smallest fix
  is data: link those rows (`…__catalog_327`) or apply the prepared expansion migration.

## 5. Implementation

| File | Change |
|---|---|
| `server/supabaseStrengthProfile.ts` | `percentileBoundOf` reads the database's status. Bound, observed and benchmark values, unit, age scaling and the kept lift are carried. Selection is `best_placed_per_exercise_v2`. Uses the v3 aggregation and validates bounds (refuses out-of-order or non-holding ones). `scoreKind: "weighted_benchmark_score"`. |
| `server/muscleAggregation.ts` | Shared weighing factored out (`weighEvidence`). The v2 transcription is unchanged and still pinned by its parity tests. Added `aggregateMuscleBenchmarkScores` (v3) and `betterScore`. |
| `shared/capabilityRank.ts` | `PercentileBound`, `ScoreBound`, `MUSCLE_SCORE_KIND`, bound fields on evidence and scores, `muscleScoreBounds`, `rankForMuscle`. Ranks are read from the lower bound, with `rankIsMinimum`. `RANK_SCHEME_VERSION` is `sg_capability_rank_v2` (bands unchanged). |
| `client/src/components/CapabilityRank.tsx` | "Benchmark score …" (exact, range, "above", "below"), "Minimum rank", the above-benchmark note, bound-aware lift rows with "counts as" for supporting roles, and "How this is calculated" with the arithmetic. No next-rank line from a bound. The legend reads "scores". |
| `client/src/components/StrengthGenomePanel.tsx` | Sheet rows say "above the 95th-percentile benchmark" with "Placed at 2.67× body weight once scaled for age, against the 95th-percentile benchmark of 1.75×". The kept lift is named. New reason copy. |
| `client/src/components/StrengthGenomeBodyMap.tsx` | Region names and states use the score and "at least". |
| `client/src/lib/muscleRankLifts.ts` | Provenance carries the bound, counted value, observed and benchmark values, and the kept lift. |
| `client/src/lib/progressPercentiles.ts` | Progress shows "Above the 95th-percentile benchmark" instead of silently dropping the lift. |
| `client/src/capability-rank.css` | Two text styles for the new lines. |

**Database:** unchanged. No migration was needed; the route reads fields the function already
returned.

**Persistence, caches and recalculation:**
- Muscle ranks are computed on every read and never stored, on the server or on the device.
  There is no persisted query cache, so there is nothing to backfill.
- Deploying the change recomputes every rank on next view from the original lift inputs. The
  React Query key is the lift list, so editing or deleting a lift is a new request.
- The server's only cache is the five-minute catalog, which holds no scores.
- No achievement, celebration or PR reads a rank (PRs come from lift e1RMs), so rescoring cannot
  replay rewards or create false PRs.
- Rollback: revert the commit. Every response is labelled with its aggregation, selection and
  rank-scheme versions.

## 6. Validation

- `pnpm check` (tsc): passes. `npx vitest run`: all pass (see the final report for counts).
  `pnpm build`: passes.
- `server/rankScreenshots.test.ts`: both screenshots through the real route, the stronger of two
  above-anchor lifts kept, JSON round trip, the kept lift named, re-selection after a delete. All
  four screenshot tests failed before the fix (`reproduction-before-fix.txt`).
- `server/muscleBenchmarkScore.test.ts` (24 tests):
  - identical inputs; min/max bracketing; monotonic under improvement;
  - supporting-role transfer;
  - range / at least / at most, exact anchor versus beyond it;
  - duplicates; zero, negative and NaN weights; off-scale and unknown bounds refused;
  - rank boundaries at 94.999, 95, 98.999, 99 and 100;
  - database-status parsing; parity with the shared engine (89.49 and the above-anchor refusal);
    lb/kg equivalence;
  - the synthetic 97th/99th curve.
- `client/src/components/CapabilityRank.bounds.render.test.ts`, the sheet case in
  `StrengthGenomePanel.strengthDetail.render.test.ts`, and `progressPercentiles.test.ts`: the
  rendered card and sheet.
- **Browser** (`probes/lats-sheet.mjs`; production build via `vite preview`, headless Chromium
  at 390 and 320 px, rank route answered with the route's own output from
  `probes/route-responses.mts`): 26 of 26 checks pass. Screenshots are in `screenshots/`.

## 7. Release status and what remains

- **Local only.** This is on branch `claude/training-day-navigation-workouts-83ro2c`: not merged,
  not deployed, not verified in preview or production.
- **Remaining:**
  - legitimate upper-tail data, or a licence to use it, for any exercise to place above the 95th;
  - the licensing question above;
  - the catalog-link gap for 120 app exercises;
  - a decision on machine aliases;
  - refreshing the stored anchors against the current source.
