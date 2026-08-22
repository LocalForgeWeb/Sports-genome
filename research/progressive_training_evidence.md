# Progressive Training Evidence Boundary

## Purpose

This record defines what the progressive-training feature may infer from an athlete’s logged sets and what it must **not** claim. The feature should offer a repeat, repetition, load, or recovery adjustment as a transparent training recommendation—not diagnose weakness, directly measure a muscle’s strength, predict injury, or silently rewrite a plan.

## Reviewed sources

| Source | Direct finding | Safe product use | Limit |
|---|---|---|---|
| Helms et al., 2016, *Strength and Conditioning Journal*, PMID 27531969 | RIR-based RPE can help monitor resistance-training intensity. Performance and rating accuracy vary by experience, proximity to failure, fatigue, sleep, nutrition, and stress. | Accept set-level RPE/RIR as one input to a repeat/add-reps/add-load suggestion. | Do not treat an RPE/RIR record as an objective strength measurement; novice and high-RIR estimates need lower confidence. |
| Zhang et al., 2021, *PeerJ*, doi:10.7717/peerj.10663 | The systematic review found autoregulation methods can be effective within periodized resistance-training plans; daily performance changes reflect fitness, fatigue, readiness, and non-training stressors. | Use recent logged performance to offer conservative, athlete-confirmed progression options. | Do not infer a stable physiological cause from one session or use a deterministic prescription. |
| Grgic et al., 2020, *Sports Medicine*, doi:10.1186/s40798-020-00260-z | Across 32 studies, 1RM tests generally showed good-to-excellent test–retest reliability, while reported variability still existed. | Treat repeated, standardized lift performance as a useful exercise-specific reference. | A working-set estimate is not a direct 1RM test; comparisons must retain exercise and setup context. |
| Seo et al., 2012, *Journal of Sports Science & Medicine*, PMID 24149193 | Standardized 1RM testing can reliably assess named exercise performance across multiple exercises. | Support optional standardized reference lifts and within-exercise trend tracking. | Do not convert a lift into a direct isolated-muscle measurement or compare arbitrary exercises as interchangeable tests. |

## Product measurement model

### 1. Exercise performance record

For a completed set, retain the exercise identity, equipment/setup, external load, repetitions, target repetition range, RPE/RIR when supplied, and date. A derived estimated performance value may be used **only within the same exercise/setup** and labeled as an estimate.

### 2. Progression state

The planner may recommend one of five athlete-confirmed states:

| State | Example guardrail |
|---|---|
| **Repeat** | Target not yet reached, RPE/RIR uncertain, or too little recent data. |
| **Add repetitions** | Completed work is inside the planned range and has room below the effort ceiling. |
| **Increase load** | Target top of range is met across required work at or below the effort ceiling, with a known equipment increment. |
| **Hold / recover** | Recent performance is down, effort is unexpectedly high, or fatigue/recovery context conflicts. |
| **Reduce load** | Completed repetitions are materially below the planned minimum or effort exceeds the safety/technique guardrail. |

No single set should create a structural plan change. The feature should require a repeated pattern, preserve the athlete’s approval step, and provide the inputs that generated the suggestion.

### 3. Segment-level proxy

The system may show a **segment performance signal** for a muscle segment, such as anterior, lateral, or posterior deltoid, by aggregating standardized within-exercise trends weighted by the catalog’s existing primary/secondary muscle context. It must be labeled as an **exercise-context performance proxy**.

> A lateral-raise trend and an overhead-press trend are separate exercise signals. Their difference can identify a programming review opportunity for lateral versus anterior deltoid emphasis; it does not directly prove one deltoid head is objectively stronger or weaker.

Age and bodyweight may be used as optional display context and within-user normalization references. They must not be presented as a universal strength ranking without a validated, exercise-specific normative reference dataset.

## Implementation rules

1. Preserve exercise, equipment, ROM/setup, and split context; do not compare external loads across incompatible movements.
2. Use recent trend windows and minimum data requirements rather than one-session conclusions.
3. Lower confidence when RPE/RIR is missing, the athlete is new to tracking, the exercise/setup changed, or few comparable logs exist.
4. Present progression as a recommendation with a clear “why,” an override, and a conservative default.
5. Plan changes must be reviewable by the athlete; never silently alter their saved stack.
6. Distinguish direct recorded performance, derived estimate, and segment-level proxy throughout the UI.
