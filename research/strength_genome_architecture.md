# Strength Genome Architecture

## Product boundary

Strength Genome is a **performance-observation and inference system**, not a direct measure of muscle force, health, injury risk, or sport performance. It will maintain four separate concepts throughout the product:

| Concept | Definition | Eligible output | Ineligible claim |
| --- | --- | --- | --- |
| Exercise performance | A dated athlete-entered result under a documented protocol. | Measured load, repetitions, test type, body-mass context, and within-athlete progression. | A direct anatomical strength measurement. |
| Functional-domain estimate | A transparent model inference from relevant observations. | A continuous internal value, evidence coverage, uncertainty, and contributing tests. | A verified population percentile without matching reference data. |
| Anatomical-region presentation | A display aggregation from several functional domains. | Tier, evidence status, contributing domains, and imbalance alerts when supported. | A claim that a compound lift measured a specific muscle’s force. |
| Tier | A Sports Genome presentation category layered over an eligible percentile or model estimate. | F–SS+ display plus an evidence/estimate label. | A scientifically standardized diagnosis or universal athletic ranking. |

## MVP evidence states

| State | When used | User-facing output | Planning behavior |
| --- | --- | --- | --- |
| `OBSERVATION_ONLY` | A valid lift/test exists but no matching normative record is stored. | Performance result, protocol context, and personal trend. | May contribute to future inference coverage; does not produce a percentile tier. |
| `INFERRED_PENDING_EVIDENCE` | An exercise-to-domain relationship is architected but lacks approved calibration. | `Awaiting evidence calibration`. | Must not alter a stack automatically. |
| `REFERENCE_SUPPORTED` | A reference record matches measurement type, protocol, population, normalization, and source. | Percentile, tier, source, and confidence rationale. | Can inform an athlete-confirmed planning priority. |
| `INSUFFICIENT_DATA` | No qualifying measurement or no relevant mapping exists. | Neutral `?` state and the single highest-information next test. | Must not be reframed as a deficit or weakness. |

## Initial data model

The database will preserve raw records and generated outputs separately. Every estimate stores its model version and source status, so a later calibration cannot silently rewrite historic output.

| Entity | Role | Key safeguards |
| --- | --- | --- |
| `athleteStrengthProfiles` | Optional profile data for reference matching, including date of birth, sex, height, and strength-training age. | Body mass is not stored as one mutable value. |
| `bodyMassObservations` | Dated body-mass records. | A lift links to the nearest recorded body-mass context, preserved at save time. |
| `strengthObservations` | Dated lifts/tests, protocol conditions, raw and derived performance. | Measured 1RM and e1RM remain distinct; protocol/machine variation is explicit. |
| `strengthDomains` | Functional-domain dictionary. | Domains are separate from anatomical display regions. |
| `strengthRegions` | Athlete-facing anatomical presentation dictionary. | Regions receive evidence from domains, not direct unsourced lift labels. |
| `strengthExerciseDomainMappings` | Source-traceable exercise-to-domain relationships. | No production weight until evidence is approved. |
| `strengthDomainRegionMappings` | Source-traceable domain-to-region relationships. | Mapping evidence grade and source references are required. |
| `strengthNormativeReferences` | Eligible population reference datasets. | Population, protocol, normalization, range, source, and coverage are required; percentile values are nullable. |
| `strengthEstimateSnapshots` | Historical domain/region outputs. | Holds model version, reference ID where present, uncertainty, and explanation inputs. |
| `strengthImbalanceFlags` | Transparent candidate imbalances. | Created only after meaningful, confident, and relevant relationships are configured. |

## Initial functional-domain registry

This registry is a **naming and routing structure**, not a set of numeric exercise weights. Calibrated mappings and normative references remain unavailable until their sources are loaded and reviewed.

| Group | Functional domains | Initial region connections |
| --- | --- | --- |
| Pressing | Horizontal pressing, incline/angled pressing, vertical pressing, shoulder abduction, shoulder extension, shoulder external rotation, shoulder internal rotation | Chest, shoulders, triceps, upper back where biomechanically supported |
| Pulling and arms | Horizontal pulling, vertical pulling, elbow flexion, elbow extension, grip, wrist flexion, wrist extension | Upper back, lats, biceps, triceps, forearms/grip |
| Trunk | Trunk flexion, trunk extension, anti-extension, anti-flexion, anti-rotation, rotation, lateral trunk strength | Abdominals, obliques, spinal erectors |
| Hip and knee | Hip extension, hip flexion, hip abduction, hip adduction, knee extension, knee flexion | Glutes, hip flexors, adductors, abductors, quadriceps, hamstrings |
| Lower leg | Plantarflexion, dorsiflexion | Calves, tibialis anterior |

## Estimation policy

The first implementation will support **data entry, provenance, and honest empty states** before turning on athlete-specific tiers or automated stack changes. It will use a fixed model version for each snapshot. A tier can appear only when its percentile is backed by a matching stored normative reference. An estimate based on an e1RM must declare the estimation method and be less certain than a standardized measured 1RM. Repeated variations in one independence group may enrich longitudinal history but cannot be treated as mechanically independent evidence.

## Mobile integration policy

The primary mobile flow is: **Genome tab → Strength Profile → choose region → quick bottom sheet → Full analysis → Add a test or review training implication**. Strength, confidence, evidence, and sport relevance will use different labels and colors. The Strength Genome mode must not recolor the qualitative Body Lab sport-role mode; athletes choose the mode explicitly.

## Initial sources

The research anchors and limits are maintained in [strength_genome_mvp_evidence.md](./strength_genome_mvp_evidence.md). The initial system must remain in `OBSERVATION_ONLY`, `INFERRED_PENDING_EVIDENCE`, or `INSUFFICIENT_DATA` states until the reference population and mapping requirements above are fulfilled.
