# Strength Genome Anatomy-Led Profile Validation — 2026-08-29

## Purpose

This record documents the mobile redesign inspired by the supplied rank-and-progress reference. The implementation deliberately retains the project’s source and athlete-context gates: it does not create generalized ranks, percentile badges, strength tiers, PR claims, or inferred performance results.

| Validation item | Result | Observed behavior |
|---|---|---|
| Phone layout | Passed in generated 390 × 844 browser check | The Strength Genome heading, recorded-test profile state, and upper anatomy-map controls were visible in the first viewport without text/background collisions. |
| Anatomy-led hierarchy | Passed in generated check | The map is the primary interactive surface below the profile rail and its canvas measured 875px, allowing the full portrait workspace to remain prominent. |
| No-record state | Passed | The profile showed `0 regions` under recorded test coverage and `No comparative rank yet` under exact source match. |
| Comparison boundary | Passed | The status rail explains that comparison appears only after an exact reviewed-source match; it does not display a tier, percent, personal record, or general population claim. |
| Recorded-context visualization | Covered by regression | Regions with saved test context can be visually distinguished from untested regions; the state indicates stored test coverage only, never strength magnitude. |

## Boundary

The only current population-relative result remains the narrowly qualified Piper 2021 preacher-curl 10RM source path. It requires matching exercise identity, test type, complete protocol declaration, reviewed source population, direct observation status, pre-training status, age and sex conditions, and test-day body mass. All other exercises remain rank unavailable.

## Device limitation

This was a generated Chromium phone-width check, not physical-device testing. Real iPhone Safari/PWA rendering and installed-app behavior remain open for manual verification.
