# Exercise Genome — Implementation Architecture

## Product contract

Exercise Genome is the common intelligence layer connecting exercises, muscles, biomechanics, adaptations, goals, sport movements, workouts, programs, and individual user context. It does not create a universal exercise score. It stores **intrinsic characteristics** and calculates contextual utility from the user’s objective, schedule, current stack, sport movement, and practical constraints.

> **Contextual Utility = Intrinsic Exercise Genome + User Context + Goal Context + Sport Movement Context + Current Stack Context + Constraints.**

All numerical values are model estimates for comparison and decision support. The app should show why a value changes, indicate confidence, and avoid treating a calculated number as scientific certainty or medical advice.

## Intrinsic data domains

| Domain | Required attributes | User-facing value |
| --- | --- | --- |
| Muscle Genome | Per-muscle contribution, mechanical loading, long-length loading, peak contraction, stabilization demand, fatigue role, role label, and explanation | Shows what a movement trains and why. |
| Movement + joint action | Multi-label movement pattern, shoulder/scapula/elbow/spine/hip/knee/ankle actions, force direction, unilateral/bilateral status | Makes sport transfer and program balance explainable. |
| Resistance profile | Lengthened/mid/shortened bias, simplified curve, sticking region, unloading and peak-contraction regions | Enables complementary exercise comparison. |
| Adaptation Genome | Hypertrophy, strength, power, stability, skill/coordination, mobility, and conditioning vectors | Ranks an exercise against the actual objective. |
| Fatigue + practicality | Local/systemic/grip fatigue, axial and connective-tissue load, recovery cost, setup, equipment, accessibility, space, and superset practicality | Prevents impractical or redundant recommendations. |
| Evidence metadata | Confidence, evidence category, reasoning notes, and known limits | Makes uncertainty visible and avoids black-box claims. |

## Contextual engines

| Engine | Inputs | Output |
| --- | --- | --- |
| Sport Movement Transfer | Sport → movement → force, position, muscle, velocity, stability, and coordination requirements | Mechanistic transfer score plus strengths and limits. |
| Stack Complementarity | Existing exercises compared across muscle, movement, curve, adaptation, and fatigue vectors | Redundancy, marginal value, and missing stimulus. |
| Smart Addition | Current stack + goal + sport movement + constraints | The exercise that fills the largest valuable gap, not merely the highest isolated rating. |
| Replacement | Exercise to replace + retained reason (muscle, transfer, lower fatigue, equipment, complexity, curve) | Context-preserving alternatives with explained trade-offs. |
| Workout Genome | All exercises in one workout | Coverage, gaps, overlap, fatigue bottlenecks, and ordering opportunities. |
| Program Genome | Workouts across a week | Weekly distribution, repeated stress, neglected qualities, recovery interactions, and sport exposure. |

## Interface layers

| Layer | Audience | Content |
| --- | --- | --- |
| 1. Instant understanding | All users | Exercise fingerprint, main muscles, contextual fit, primary benefits, simple tiers, and sport relevance. |
| 2. Detailed analysis | Lifters and coaches | Muscle, hypertrophy, strength, power, stability, fatigue, mechanics, and sport transfer modules. |
| 3. Deep dive | Coaches and advanced users | Why-score reasoning, evidence category, confidence, raw attributes, comparisons, and assumptions. |

## Initial delivery scope

The current iteration will introduce a typed, extensible vector model for all catalog exercises; a contextual score and explanation based on current stack and selected sport action; an interactive Genome visual panel; genome-aware exercise fingerprints; redundancy and marginal-value indicators; and a Workout Genome summary. More granular muscle subdivisions, variants, prescription optimization, program-level history, and advanced natural-language search are explicit extensions of the same architecture.
