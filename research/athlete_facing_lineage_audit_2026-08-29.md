# Athlete-Facing Number and Recommendation Lineage Audit — Initial Pass

## Purpose and current boundary

This initial source audit separates the app’s visible numeric values into their correct provenance classes before any reviewed Supabase record is integrated. The new Supabase research store contains **zero production studies**. Its seven staged records remain `needs_review`, so they have not changed exercise recommendations, programming defaults, catalog labels, sports coverage, or athlete-facing strength comparisons.

> A staged research candidate is not evidence in product logic. Only an explicitly approved, protocol- and population-qualified source mapping may alter an athlete-facing claim.

| Visible value family | Current lineage | Athlete-facing boundary |
|---|---|---|
| Exact Preacher Curl 10RM rank range | Source-qualified Piper 2021 reference plus an exact athlete record, test conditions, and saved body mass | The narrow source-sample rank stays unavailable for all other curls, equipment, repetition schemes, populations, and incomplete records. |
| Recorded load, repetitions, RPE, body mass, and session counts | Athlete-entered records | These are personal observations, not diagnoses, readiness scores, or cross-athlete ranks. |
| Set, rep, rest, volume, and RPE defaults | Source-informed editable planning anchors | Defaults are not a personal optimum, clinical prescription, or direct laboratory measurement. |
| Exercise Genome, muscle-targeting, sport-fit, coverage, and redundancy values | Declared configured planning estimates in `evidenceTraceability.ts` | Relative ordering is not EMG, force, activation, injury risk, or a guarantee of sport transfer. |
| Catalog identifiers, display order, pagination, and interface limits | Product constraints | These values are not represented as exercise science or athlete performance findings. |

## Initial conclusion

The application correctly isolates the only currently approved cross-person strength comparison from wider configured planning models. However, the broader composite planning values are **not direct research measurements** and must remain labeled as configured planning estimates until each claim has an approved evidence mapping. The completed raw-to-staging pilot makes that review process auditable but does not make the staged studies eligible for live logic.

## Next approval gate

Before an approved source can change a number or recommendation, review must preserve its citation fingerprint, population, test/protocol, equipment and normalization conditions, result metric, safe claim wording, and explicit UI surface. The integration must then be versioned, tested for in- and out-of-scope records, and documented in the evidence traceability registry.
