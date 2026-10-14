# Percentiles past the 95th: the estimated tail

**Decision:** the owner, 14 Oct 2026.
**Version:** `lognormal_upper_tail_v1`.
**Code:** `estimateAboveTopAnchor` in `shared/strengthPercentile.ts`.

## Why

Every comparison curve in production has exactly five points: the 5th, 20th, 50th, 80th and 95th percentiles. That is 296 curves, read from `app_strength_beta_curves_v1` on 14 Oct.

So until now:
- A lift past the 95th point had no number. The card said "above the 95th percentile, the highest point the comparison data covers".
- The muscle ranks entered it at exactly 95, so 2.1× and 3× body weight ranked the same.
- No lift could read higher than the 95th.

## The rule

1. Below and inside the curve nothing changed. Placement is the database's interpolation, transcribed (`placeOnCurve`), and below the 5th it stays a bound.
2. Past the top point, the curve's own shape is carried on:
   - Above the median, strength is treated as log-normal.
   - `ln(value)` is fitted by least squares against the normal quantile of each point at or above the 50th (so the 50th, 80th and 95th).
   - That slope continues from the top point. The estimate therefore starts exactly where the measured curve ends and rises smoothly.
3. It stops at the **99th**, and says so.
4. It is always **labelled**:
   - the card: "≈ 97th percentile (estimated)", plus a sentence;
   - ranks and their evidence: "≈ 96th (estimated)".
5. There is no estimate when the curve has fewer than three points at or above the 50th, when those points do not climb, or when the curve already reaches the 99th. The lift then stays "above the top point", as before.

## One lift, one number

**The card.** It runs `resolveStrengthPercentile` → `estimateAboveTopAnchor` on the placed value. Age-scaled lifts use the scaled value.

**The muscle ranks.** They use the database's `score_strength_profile_v1` (plus `apply_strengthlevel_age_adjustment_v1`).
- For a lift past the top, that answer says `above_range`, holds `percentile_estimate` at 95, and carries `observed_norm_value` and the whole `curve`.
- `tailEstimateForPlacement` (`server/supabaseStrengthProfile.ts`) runs the same function on that answer.
- The value is taken to 5 decimals in both paths, as the database reports it, so they agree exactly. This is pinned in `server/strengthPercentile.parity.test.ts`.

**No database function changed.** The estimate is applied by the server, so rolling back the app rolls it back.

## What it does on the real bench-press curve

Male Barbell Bench Press anchors: 50th = 1.25×, 80th = 1.5×, 95th = 2.0× body weight. The fitted slope is 0.285.

| Lift (× body weight) | Before | Now |
|---|---|---|
| 2.0 | 95th | 95th (measured point) |
| 2.1 | above the 95th / ranked at 95 | ≈ 96.5th (estimated) |
| 2.3 | same | ≈ 98.4th (estimated) |
| ≥ about 2.43 | same | ≈ 99th (estimated; the cap) |

## Ranks

- A muscle's percentile is a weighted logit blend that pulls toward the 50th. It can only pass the 95th through an estimated lift, so a muscle above the 95th is marked estimated too (`MuscleScore.estimated`).
- **National** (95 to under 99) is now reachable, only on an estimate.
- **World Stage** (99+) is still out of reach, but not because of the cap: no lift passes all of its strength to one muscle.
  - The strongest contribution weight in `exercise_muscle_mappings` is 0.98, a transfer of 0.994.
  - So a lift at the 99th gives a muscle at most about 98.97.
  - The panel says so (`data-muscle-rank-ceiling`).
- **Confidence is unchanged** by the estimate. It is still the lift's and the source's.

## Undo

Revert the commit. Nothing is stored, because percentiles and ranks are computed per request.
