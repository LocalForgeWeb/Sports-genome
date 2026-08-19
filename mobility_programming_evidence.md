# Mobility and Programming Evidence Notes

## Warm-up design guardrails

NSCA describes a warm-up as preparatory activity and functionally based movement, distinct from flexibility work. It highlights a general low-to-moderate intensity phase of roughly five to ten minutes followed by task-specific movement preparation. The app will therefore recommend short dynamic mobility drills and progressive rehearsal sets—not prolonged static holds—as default preparation for strength, power, and sport-transfer work. [1]

## Prescription guardrails

The app treats prescriptions as adjustable decision support rather than medical or individualized coaching. ACSM’s 2026 overview emphasizes consistency and individualization, cites 2–3 sets at heavier loads for strength, approximately 10 weekly sets per muscle group for hypertrophy as a practical reference point, and moderate loads moved quickly for power. [2]

The earlier ACSM progression position stand describes broad goal-oriented loading patterns: heavier 1–6 RM work with 3–5 minute rest for advanced strength emphasis, 6–12 RM with 1–2 minute rest and multiple sets for hypertrophy emphasis, light fast work with 3–5 minute rest for power, and 15-plus repetitions with shorter rest for local muscular endurance. These ranges will be presented as transparent starting bands, not rigid rules. [3]

## Data design decisions

- Use drill categories, movement-pattern tags, targeted regions, contraindication flags, and conservative dose ranges.
- Map warm-ups to the actual exercise stack by shared movement patterns and tissues, then cap the recommendation at six drills plus rehearsal sets.
- Store imported exercise names separately from prescription lines, set labels, RPE/failure guidance, rest, and free-form notes.
- Detect plan headings and instructional text before catalog matching so they are never listed as unmatched exercises.

## References

[1]: https://www.nsca.com/education/articles/kinetic-select/introduction-to-dynamic-warm-up/ "NSCA — Introduction to Dynamic Warm-Up"
[2]: https://acsm.org/resistance-training-guidelines-update-2026/ "ACSM — Resistance Training Guidelines Update (2026)"
[3]: https://pubmed.ncbi.nlm.nih.gov/19204579/ "ACSM Position Stand — Progression Models in Resistance Training for Healthy Adults"
[4]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/ "Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance"
