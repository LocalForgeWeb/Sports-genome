# Strength → percentile — live contract audit

Completion evidence for `strength_power_benchmarks` / `audit_live_contract` (10).
Feature status `spec_ready`, priority 89, risk `critical`, evidence requirement `validated`.
Schema and counts read live on 2026-09-21.

## The disconnect in one line

The app can estimate a 1RM and the database holds sex- and bodyweight-matched percentile
curves for 168 exercises, and nothing joins them. Today a logged working set produces a
percentile for no exercise at all.

## What the app does now

`server/normsResolution.ts` binds a saved observation to the **research-grade** registry only,
and `buildAthleteContext` says so explicitly:

> A measured maximum is taken only from `measuredOneRmKg`; an estimated 1RM is deliberately not
> substituted, because the registry's 1RM populations report directly measured lifts.

That is correct for the research-grade path — Piper 2021 reports a directly measured 10RM, so an
estimate cannot enter it. But it is the only path wired up, so the consequence is that
`shared/oneRepMaxEstimation.ts` (Epley, 1–12 reps) currently feeds only within-athlete change
(`withinAthleteStrengthChange.ts`) and the powerlifting reference. It never reaches a percentile.

## What the database already holds

The research side has built the beta scoring layer and the app has never read it.

| Relation | Rows | What it is |
| --- | --- | --- |
| `strength_scoring_versions` | 1 | `strength_beta_v1`, status `beta`. States the e1RM, percentile and muscle-aggregation methods. |
| `strength_norm_source_policy` | 5 | Which source may produce which kind of percentile. |
| `strength_exercise_scoring_policy` | 147 | Per exercise: scoring mode, load semantics, preferred norm method, confidence modifier. |
| `strength_norms` | 3252 | The curves themselves. |
| `strength_scoring_readiness_v1` | 423 | Per-exercise readiness, already policy-aware. |

### The policy is restrictive, and that is the point

| Source role | Beta percentile | Research-grade | Population | Confidence cap |
| --- | --- | --- | --- | --- |
| `beta_fallback` | **yes** | no | Strength Level community lifters | 0.82 |
| `validation_only` | no | some | Healthy adults 20–29; college-aged males 10RM | 0.95 |
| `excluded` | no | no | **Competitive powerlifters** | — |

Curve rows by role: `validation_only` 1762 across 6 exercises, **`beta_fallback` 1220 across 97
exercises** (860 bodyweight-relative, both sexes, percentiles 5–95), `excluded` 270 across 3.

Only `beta_fallback` may produce the percentile this feature needs.

### Exercise coverage

`strength_scoring_readiness_v1` resolves 423 catalog exercises:

| Readiness | Norm resolution | Exercises |
| --- | --- | --- |
| `body_lab_ready` | `direct` | 97 |
| `body_lab_ready` | `aliased_variant` | 65 |
| `score_ready_body_lab_blocked` | `aliased_variant` | 6 |
| `not_configured` | `none` | 255 |

**168 exercises can produce a percentile today**; 255 cannot and must say so rather than guess.
All 147 policy rows have `is_beta_enabled = true`: 135 `loaded_e1rm`, 12 `bodyweight_reps`.

## The method the version record specifies

Copied from `strength_scoring_versions.strength_beta_v1`, because the implementation has to match
the recorded version rather than invent its own:

- **e1RM** — direct 1RM passes through unchanged. Working sets use the **mean of Epley and
  Brzycki** on effective reps = reps + optional RIR, confidence decreasing as reps/RIR increase.
- **Percentile** — prefer sex-matched bodyweight-relative curves; fall back to sex-matched
  absolute community curves. **Interpolate only between stored anchors; censor tails rather than
  extrapolate.**
- **No default age weighting. Competitive powerlifting norms excluded.**

The repo's existing estimator is Epley alone, so it does not satisfy this version and must not be
silently relabelled as if it did.

## Gaps

| # | Gap | Note |
| --- | --- | --- |
| G1 | No app-safe view exposes beta curve anchors | `app_strength_norms_v1` is **neither policy-gated nor eligibility-gated** — it would serve the excluded competitive-powerlifting rows. It must not be used for this. |
| G2 | No versioned e1RM matching `strength_beta_v1` | Epley-only exists; the mean-of-two with effective reps does not. |
| G3 | No percentile interpolation with tail censoring | Nothing in the repo reads a curve and places a value on it. |
| G4 | Nothing carries the scoring version, source role or confidence cap into a result | Required for provenance and for the uncertainty posture. |
| G5 | Aliased-variant resolution unused | 71 of the 168 scoreable exercises resolve through `alias_source_exercise_id`. |

## Reusable, and to be left alone

- `shared/oneRepMaxEstimation.ts` — keep as is. Two callers depend on Epley-only behaviour and on
  `maxValidEstimationReps`; the beta estimator belongs beside it, not on top of it.
- `shared/normsReference.ts` — the research-grade resolver, including `percentileBandLabel` and its
  "never an interpolated percentile" rule. The beta path is a **separate** route with its own
  method; it must not be folded into this one, exactly as the sport/general evidence routes are
  kept apart elsewhere.
- `server/normsResolution.ts`, `server/normsRegistry.ts` — the existing adapter shape to mirror.
- `strength_scoring_readiness_v1` — already the right gate. Do not rebuild it.

## Blocker

**B1 — two percentile routes now exist and must stay distinguishable.** The research-grade route
reports a band between published cut points from a directly measured lift. The beta route
interpolates a community curve from an estimated 1RM. They answer differently and carry different
confidence, so a result must name which route produced it, and the UI must never show them as the
same number. This is the same separation the resilience feature enforces between general and
sport-specific evidence.
