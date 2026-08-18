# Gym Optimizer — Training Logic Specification

## Scope and Safety Boundary

Gym Optimizer is an educational planning tool. Its grades compare broad movement and muscle-transfer characteristics; they are **not medical advice, individualized coaching, injury-prevention guarantees, or a substitute for sport practice**. Users should progress load and complexity only with controlled, pain-free technique.

## Catalog Model

Each catalog record contains the supplied exercise name, source category, movement pattern, equipment signal, primary muscles, secondary muscles, athletic qualities, a muscle-quality score, and sport-transfer grades. A grade is an explainable heuristic produced from movement similarity, force direction, velocity potential, stability demand, and grip/carry relevance. It is not derived from a claim that a single exercise predicts sport performance.

| Data field | App purpose |
| --- | --- |
| `movement` | Enables movement balance and sport-transfer explanations. |
| `primaryMuscles` / `secondaryMuscles` | Drives the anatomical map, muscle filter, and target-quality score. |
| `qualities` | Labels strength, hypertrophy, power, unilateral stability, rotation, anti-rotation, locomotion, grip, and mobility. |
| `sportFit` | Stores per-sport grade and a plain-language transfer explanation. |
| `bodyFocus` | Maps catalog muscle groups to a clickable front/back body illustration. |

## Goal Profiles

| Goal | Planner priority | Session character |
| --- | --- | --- |
| Muscle growth | Target-muscle coverage, stable technique, moderate-to-high effort | 6–15 rep work with accessory coverage. |
| Max strength | High-skill compound movements and longer rest | 3–6 rep primary work, followed by controlled support work. |
| Athleticism | Power, unilateral control, force transfer, sprint/carry support | Low-fatigue power first, then strength and movement-control work. |
| General fitness | Full-body movement balance and sustainable volume | Mixed moderate-rep training plus carries or sleds. |
| Endurance | Local muscular endurance and capacity | Moderate loading, higher repetition and conditioning emphasis. |

The app suggests sets and repetitions as starting templates, not prescriptions: 3–5 working sets for a primary lift, 2–4 sets for assistance movements, and lower repetitions for high-intensity jumps or throws. Users can edit all recommendations.

## Split Library

### Six common split orientations

| Split | Days | Main use |
| --- | ---: | --- |
| Push / Pull / Legs | 3 or 6 | Straightforward upper/lower movement balance. |
| Upper / Lower | 4 | Repeated main-lift exposure with flexible recovery. |
| Full Body | 3 | Efficient whole-body frequency for limited schedules. |
| Body-Part Rotation | 5 | Higher local focus for muscle-growth blocks. |
| Powerbuilding 4-Day | 4 | Heavy compound work paired with hypertrophy accessories. |
| Strength + Hypertrophy 3-Day | 3 | Full-body strength exposure with targeted growth work. |

### Optimizer-designed sport orientations

| Split | Sport profile | Design logic |
| --- | --- | --- |
| Court Speed + Strength | Basketball | Alternates force production, unilateral control, jumps, and upper-body contact tolerance. |
| Tennis Rotation + Footwork | Tennis | Combines hip/trunk rotation, anti-rotation, lateral hip work, shoulder control, and lower-body braking capacity. |
| Field Speed + Resilience | Soccer | Prioritizes sprint-support posterior-chain work, unilateral strength, calves, groin/hip control, and repeated effort. |
| Diamond Rotation + Armor | Baseball | Emphasizes unilateral lower-body force transfer, trunk rotation/anti-rotation, scapular control, and grip. |
| Fight Strength + Grip | Combat | Uses carries, pulls, hip drive, stance strength, anti-rotation, and explosive throws. |

## Rating Logic

The public scale is **F, D, C, B, A, S, SS**, mapped internally to 1–7. The interface explains the factor behind a grade so it remains transparent rather than falsely precise.

| Grade | Interpretation |
| --- | --- |
| SS | Exceptional direct fit for the selected goal or sport quality. |
| S | Strong fit that commonly belongs in a supporting program. |
| A | High-value support exercise. |
| B | Useful but secondary contribution. |
| C | Context-dependent contribution. |
| D | Limited direct transfer. |
| F | Not a meaningful match for the selected focus. |

The builder selects a primary exercise, complementary patterns, targeted accessories, and one conditioning or athletic movement where appropriate. It avoids duplicate movement patterns in the same session unless the goal is targeted muscle growth. A visible balance indicator shows push/pull and knee/hip dominant coverage.

## References

The movement taxonomy is informed by the NSCA’s explanation that common resistance exercises are loaded variations of generalizable multi-joint movement patterns, and that progressive exposure supports skill and overload.[1]

[1]: https://www.nsca.com/education/articles/ptq/teaching-resistance-training-movement-patterns/ "National Strength and Conditioning Association — Progressive Strategies for Teaching Fundamental Resistance Training Movement Patterns"
