# Exercise Genome Specification

## Purpose and scope

The **Exercise Genome** is Gym Optimizer’s transparent exercise-comparison system. It separates an exercise’s relatively stable movement characteristics from the context in which an athlete might use it. The system helps an athlete inspect patterns, likely demands, stack overlap, and sport-action fit; it does **not** measure muscle force, activation, injury risk, individual readiness, or guaranteed adaptation.

> A Genome value is a standardized planning estimate. Training dose, technique, anthropometry, equipment setup, fatigue, and the athlete’s execution can materially change the practical result.

## Contract overview

| Layer | Primary inputs | System output | Athlete-facing use |
|---|---|---|---|
| **Intrinsic exercise record** | Catalog movement, equipment, muscle tags, qualities, and exercise name/setup cues | Muscle profile, movement patterns, joint actions, resistance profile, fatigue and practicality estimates | Mechanics and Muscle Genome tabs |
| **Standardized fingerprint** | Intrinsic record only | Relative values for hypertrophy, strength, power, stability, mobility, stimulus-to-fatigue ratio, skill, and practicality | Fast comparison; never a prescription or direct test |
| **Contextual analysis** | Goal, current workout, selected sport action | Goal alignment, stack distinctness, sport-action match, recovery manageability, contextual grade | Context tab and recommendation explanation |
| **Program analysis** | Selected workout exercises | Dominant patterns, dominant muscles, redundancy estimate, pattern gaps | Stack Analysis and replacement guidance |

## Intrinsic exercise record

Each `ExerciseGenome` record contains the following analysis domains.

| Domain | Included fields | Interpretation boundary |
|---|---|---|
| **Muscle contribution** | Named anatomical label, role, contribution estimate, loading contexts, tier, and evidence-aware targeting details | A relative ranking of likely movement contribution; not EMG, force, or hypertrophy measurement |
| **Movement and joint actions** | Movement patterns, joint actions, line of force, kinetic chain, and stance | A structured description of task demands, not a complete biomechanical simulation |
| **Resistance profile** | Relative bias, sticking region, peak region, and a five-point curve | Setup-dependent comparison aid; cable and machine geometry can change it materially |
| **Adaptation and fingerprint** | Eight relative dimensions plus primary and secondary adaptation opportunities | Standardized comparison signals; realized adaptation depends on programming and athlete context |
| **Fatigue and practicality** | Local, systemic, grip, axial, and technical cost; setup, space, access, home-gym, and superset considerations | Planning estimates, not readiness or recovery measurements |
| **Evidence calibration** | Evidence quality, confidence, study calibration when available, and targeting uncertainty | Makes the difference between direct evidence and modeling inference visible |

## Fingerprint dimensions

The fingerprint is intentionally **multi-dimensional**. It does not collapse all exercise value into one generic score.

| Dimension | What the standardized estimate represents | Examples of intrinsic signals considered |
|---|---|---|
| **Hypertrophy** | Relative suitability for muscle-building-oriented loading | Catalog hypertrophy quality, modality, and isolation-pattern cues |
| **Strength** | Relative strength-training demand and transfer potential | Strength quality, free-weight context, and compound-pattern cues |
| **Power** | Relative ballistic or rapid-force-expression demand | Power/jumping tags and ballistic movement cues |
| **Stability** | Relative positional-control demand | Bracing, unilateral, and free-weight context |
| **Mobility** | Relative range-of-motion or positional demand | Overhead, deep-range, lunge, split-stance, and similar setup cues |
| **Stimulus-to-fatigue ratio** | A comparative planning estimate balancing hypertrophy-oriented signal with estimated fatigue cost | Fingerprint hypertrophy and standardized fatigue inputs |
| **Skill** | Relative coordination and technical-complexity demand | Free-weight, unilateral, ballistic, and complex-task cues |
| **Practicality** | Relative ease of access and setup | Equipment, rack/sled requirement, space, and task complexity cues |

## Contextual analysis

Contextual analysis asks a different question: **How useful is this exercise for this athlete’s current decision?** It combines multiple outputs rather than treating the intrinsic fingerprint as a recommendation.

| Contextual signal | Inputs | Planning use |
|---|---|---|
| **Goal alignment** | The goal-relevant intrinsic fingerprint dimension | Shows whether the exercise’s characteristics match the stated priority |
| **Stack distinctness** | Muscle, movement-pattern, resistance-profile, and quality overlap with the current workout | Identifies marginal value and potential redundancy |
| **Sport-action match** | Overlap with selected sport-action muscles and signals | Supports general-to-specific exercise transfer reasoning |
| **Recovery manageability** | Standardized systemic, technical, and axial fatigue estimates | Flags when an exercise may be expensive to place or dose |

The displayed **contextual score and grade** summarize these separate signals for sorting and explanation. They remain planning indices, not measurements of individual performance or sport readiness.

## Visual and interaction requirements

The interface must retain a learnable, inspectable path from summary to detail.

| Surface | Required behavior |
|---|---|
| **Fingerprint** | Full labels, readable comparison values, and keyboard-accessible label explanations |
| **Muscle Genome** | Clickable Prime mover, Synergist, and Stabilizer definitions; role, evidence tier, and uncertainty visible per muscle |
| **Mechanics** | Inspectable movement, joint-action, resistance-profile, and model-boundary explanations |
| **Context** | Explicit separation of stable standardized signals from current goal, stack, sport-action, and recovery context |
| **Body Lab handoff** | Selected exercise can open its leading muscle in Body Lab; the Body Lab can return athletes to relevant exercise discovery |

## Recommendation and planning integration

The Genome supports, but does not replace, deterministic planning. It is used to describe marginal value, redundancy, movement coverage, sport-action relevance, and replacement opportunities. The final automatic planning path remains bounded by the athlete’s selected goal, training frequency, equipment, split, gym-time budget, sport, and optional sport modifier.

Manual exercise browsing and manual additions remain available even when automatic planning filters an exercise for equipment or fit. Athlete-confirmed progression actions are also recorded as next-session notes or deliberate additions; the Genome must not silently rewrite an athlete’s plan.

## Verification map

| Verification area | Regression coverage |
|---|---|
| Multi-signal record construction, contextual analysis, cable profiles, rotation/bracing, and muscle segments | `client/src/lib/exerciseGenome.test.ts` |
| Athlete-facing disclosures, learning dialogs, and context boundary copy | `client/src/components/ExerciseGenomePanel.test.ts` and `client/src/components/ExerciseGenomeFingerprintAccessibility.test.ts` |
| Catalog inspection integration | `client/src/pages/Home.catalogInspection.test.ts` |
| Planning hierarchy and sport/modifier influence | `client/src/pages/Home.hierarchyConstruction.test.ts` and `client/src/pages/Home.modifierEvidence.test.ts` |
| Stack-level analysis | `client/src/lib/workoutPlanner.test.ts`, `client/src/lib/stackMuscleAnalysis.test.ts`, and `client/src/lib/workoutRedundancy.test.ts` |

## Maintainer guardrails

New Genome fields should be added only when their data source, interpretation, and uncertainty boundary can be stated clearly. Changes to numeric logic need focused regression coverage. Where direct exercise evidence conflicts with a generic mechanics inference, the direct evidence calibration takes precedence. Athlete-facing language must keep **planning estimate**, **standardized comparison**, and **direct measurement** distinct.
