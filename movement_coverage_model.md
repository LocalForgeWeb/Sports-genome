# Movement Coverage and Redundancy Model

## Purpose

The model evaluates a selected workout against a **specific sport movement**, not against a generic exercise score. It reports three separate questions: whether the workout covers the movement’s listed prime movers and support muscles, whether the selected exercises duplicate each other closely enough to merit review, and which catalog exercises may add a missing movement quality.

## Muscle Coverage

Each enriched movement lists **prime movers**, **assisting muscles**, and **stabilizers**. The model aliases these full names to the catalog’s exercise-muscle tags and reports a role as covered only when at least one selected exercise has a matching primary or secondary muscle. Unmatched rows are described as *coverage opportunities*, not defects: technical practice, sport phase, athlete constraints, and total program context determine whether an additional exercise is appropriate.

## Redundancy Signals

Each pair of selected exercises is evaluated against four descriptive overlap checks: shared movement pattern, shared primary/secondary target muscles, shared qualities, and comparable fatigue emphasis. A pair is flagged only when movement pattern and target-muscle overlap are both substantial. It is labelled **purposeful overlap** when the movements differ in unilateral demand, range, force direction, or quality emphasis, even when target muscles overlap.

> The redundancy flag is a planning prompt—not a verdict. It does not replace coaching judgment, exercise tolerance, total weekly volume, or technical needs.

## Movement Assistance Recommendations

Candidate exercises are ranked using the selected movement’s listed muscle roles, force/skill demand, joint-action language, and compatible exercise qualities. Each recommendation shows the shared movement demand and explicitly states that the relationship is a mechanical-training rationale, not proof that the exercise independently improves sport performance.

## Confidence and Boundaries

The UI carries through each movement’s research confidence and source links. It avoids direct EMG claims, injury-prevention promises, diagnostic wording, or universal exercise prescriptions. Fatigue and recovery cues are contextualized because session volume, proximity to failure, exercise selection, and timing within a microcycle affect recovery demands.[1]

## Reference

[1] [Sousa et al., *The Importance of Recovery in Resistance Training Microcycle Construction*](https://pmc.ncbi.nlm.nih.gov/articles/PMC11057610/)
