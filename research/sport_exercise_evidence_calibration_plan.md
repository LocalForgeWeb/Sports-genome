# Sport and Exercise Evidence Calibration Plan

## Purpose

Gym Optimizer now maintains two project-local evidence inventories: one for the twenty sport profiles and one for the exercise catalog’s major movement and equipment families. The inventories contain the source URLs or DOIs, directly supported findings, model implications, confidence, and explicit limitations.

| Evidence inventory | Coverage | Project record |
|---|---:|---|
| Sport biomechanics and performance demands | 20 active sport profiles | `research/sport_evidence_inventory.json` |
| Exercise mechanics and programming context | 10 movement/equipment families spanning the catalog | `research/exercise_family_evidence_inventory.json` |

## Calibration Rules

The data model will preserve **direct findings**, such as observed action phases, position differences, range-of-motion effects, and device-specific measurement context. It will separately store **planning inferences**, such as a possible conditioning relevance or a substitution opportunity. No index in the app will be represented as direct activation, force, fatigue, injury-risk, or sport-performance measurement.

| Model area | Evidence-backed treatment | Boundary retained in the app |
|---|---|---|
| Sport actions | Store discrete phases, role/position context, action type, and measurement provenance where sources support them. | Avoid universal action rates, load targets, or claims that a gym drill produces sport skill. |
| Exercise mechanics | Store movement pattern, joint-action context, line of resistance, range-of-motion modifiers, support/stability demand, and task constraints. | Treat EMG and acute biomechanics as contextual evidence, not long-term adaptation or injury predictions. |
| Programming defaults | Use systematic reviews and position statements for broad starting ranges and progression context. | Keep all values as editable planning estimates; do not prescribe individualized medical or performance targets. |
| Recommendations | Match broad physical qualities to observed action demands. | Display recommendations as training hypotheses, not direct transfer guarantees. |

## High-Confidence Cross-Catalog Adjustments

The reviewed evidence supports several shared model refinements. Horizontal and vertical presses, rows and vertical pulls, knee-dominant work, hinges, cable variants, trunk tasks, and plyometric work should retain their distinct range-of-motion, resistance-direction, support/stability, action-phase, and task-constraint fields. Sport profiles should retain phase and role context rather than compressing all actions into one intensity number.

> **Interpretation boundary.** The evidence registers improve descriptive mechanics and transparent planning context. They do not establish that any individual exercise automatically improves a named sport skill, nor do they produce a diagnostic, injury-risk, or individualized medical output.

## Next Implementation Pass

The next model updates will add evidence-coverage metadata to sport movements and exercise Genome records, then expose a concise evidence statement in Movement Atlas and Exercise Genome. Source-linked coverage will be used to identify where an index remains catalog-derived rather than directly source-calibrated.
