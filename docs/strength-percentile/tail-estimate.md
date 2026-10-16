# Percentiles past the 95th: the estimated tail

**Decisions:** the owner, 14 Oct 2026, twice.
1. Estimate past the 95th, capped at the 99th, labelled "estimated".
2. Later the same day: "up to 99.99 … it's ok if the numbers are a bit estimated up there, and it should be applicable to all the exercises."

**Version:** `lognormal_upper_tail_v1`.
**Code:** `estimateAboveTopAnchor` in `shared/strengthPercentile.ts`; cap `tailEstimateCapPercentile` = 99.99.

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
3. It stops at the **99.99th**, and says so.
4. It is always **labelled**:
   - the card: "≈ 97th percentile (estimated)", plus a sentence;
   - ranks and their evidence: "≈ 96th (estimated)".
5. There is no estimate when the curve has fewer than three points at or above the 50th, when those points do not climb, or when the curve already reaches the 99.99th. The lift then stays "above the top point", as before.

### How a percentile is printed

One rule, on a lift's card and in the ranks alike (`percentileFigure` in `client/src/lib/strengthPercentileCard.ts`; owner, 14 Oct 2026: "make them match"):
- A lift is taken to 2 decimals, as the ranks report it (`exercise_percentile`).
- It is then floored, never rounded up. The card used to round (96.53 read "97th") while the ranks floored the same lift ("96th"); both now read "96th".
- Below the 99th it is a whole number. Whole numbers would print 99.2 and 99.99 the same, so from the 99th up it keeps decimals:
  - a tenth from the 99th: "≈ 99.2nd";
  - a hundredth from the 99.9th: "≈ 99.95th", "≈ 99.99th".
- It never reads "0th" or "100th".

Pinned in `client/src/components/CapabilityRank.estimated.test.ts`.

## Every exercise

The tail is read the same way on every kind of curve: bodyweight multiples, pounds, and rep counts. All 296 curves qualify.

**Rep counts.** A movement the scoring policy scores on reps (`bodyweight_reps` in `shared/loadConventions.ts`, such as a pull-up or a push-up) done with no added load:
- is placed as a count on its rep curve, on the card as in the ranks;
- is not scaled for age, as the database does not scale it;
- may be up to 1000 reps (it was 100), since a long set is exactly what reaches the tail.

**Related lifts (aliases).** An exercise with no curve of its own is read on a related exercise's curve where the database links one: 161 load links (`strength_norm_curve_aliases`) and 24 rep links (`strength_rep_curve_aliases`).
- A load: the one-rep max × `e1rm_multiplier` is placed on the source curve (after age scaling, where that applies), as `get_beta_strength_percentile_v1` does.
- A rep count: `round(reps × reps_multiplier)` is placed, as `get_beta_rep_percentile_v1` does (`equivalent_source_reps`).
- Confidence is multiplied by the link's `confidence_modifier`.
- The card says "Compared through a closely related lift, which has the community data this one lacks."

The ranks already followed these links. The card now does too, so it covers the same exercises: from 123 (own curves only) to every exercise the ranks score.

## One lift, one number

**The card.** It runs `resolveStrengthPercentile` → `estimateAboveTopAnchor` on the placed value: age-scaled where that applies, and scaled by the link for a related lift.

**The muscle ranks.** They use the database's `score_strength_profile_v1` (plus `apply_strengthlevel_age_adjustment_v1`).
- For a lift past the top, that answer says `above_range`, holds `percentile_estimate` at 95, and carries the placed value and the whole `curve`:
  - `observed_norm_value` for a load;
  - `equivalent_source_reps` for a rep count on a linked curve;
  - otherwise `reps`.
- `tailEstimateForPlacement` (`server/supabaseStrengthProfile.ts`) runs the same function on that answer.
- The aggregation's ceiling for a lift is now 99.99 (`LIFT_PERCENTILE_CEILING` in `server/muscleAggregation.ts`); the database's own aggregation, which never sees a lift past 95, is unchanged.
- Pinned in:
  - `server/strengthPercentile.parity.test.ts`;
  - `server/strengthPercentile.allExercises.test.ts`, against what the database returned on 14 Oct for a related load, a related rep count and an age-scaled related load.

**No database function changed.** The estimate is applied by the server, so rolling back the app rolls it back.

## What it does on the real bench-press curve

Male Barbell Bench Press anchors: 50th = 1.25×, 80th = 1.5×, 95th = 2.0× body weight. The fitted slope is 0.285.

| Lift (× body weight) | Before | Now |
|---|---|---|
| 2.0 | 95th | 95th (measured point) |
| 2.1 | above the 95th / ranked at 95 | ≈ 96th (96.53, estimated) |
| 2.3 | same | ≈ 98th (98.36, estimated) |
| 2.5 | same | ≈ 99.2nd (estimated) |
| 3.0 | same | ≈ 99.8th (estimated) |
| 3.5 | same | ≈ 99.98th (estimated) |
| ≥ about 3.61 | same | ≈ 99.99th (estimated; the cap) |

The live male Ab-Wheel Rollout rep curve (55 reps at the 95th): 60 reps ≈ 96th (96.30); 80 ≈ 98th (98.79); 120 ≈ 99.8th; 200 reaches the cap.

## Ranks

- A muscle's percentile is a weighted logit blend that pulls toward the 50th. It can only pass the 95th through an estimated lift, so a muscle above the 95th is marked estimated too (`MuscleScore.estimated`).
- **National** (95 to under 99) and **World Stage** (99+) are reachable, only on an estimate.
- World Stage takes a lift far past the top of the data, because no lift passes all of its strength to one muscle.
  - The strongest contribution weight in `exercise_muscle_mappings` is 0.98, a transfer of 0.994.
  - A lift at the 99.99th gives a muscle at most about 99.99; at a typical transfer of 0.85, about 99.96.
  - The panel says so (`data-muscle-rank-ceiling`).
- **Confidence is unchanged** by the estimate. It is still the lift's and the source's (times a link's modifier, for a related lift).

## Not covered

- **Weighted Decline Sit-Up**: the database itself fails on it (`percentile_error`), so it has no percentile anywhere.
- **Carries** (Farmer's Walk): their curves are per hand over a distance, which neither the card nor the ranks place yet.
- **Progress trends** follow an estimated one-rep max, so a set with no load (a rep count) has no trend card there; it is placed on the Strength sheet and in the ranks.

## Undo

Revert the commit. Nothing is stored, because percentiles and ranks are computed per request.
