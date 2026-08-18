# Research Notes — Gym Optimizer Catalog Logic

## Movement-pattern taxonomy

The NSCA describes common resistance exercises as loaded variations of generalizable multi-joint movement patterns. It highlights movement proficiency as a foundation for progressively adding load or volume and for progressing users through more difficult exercise variations.[1]

**Application in the app:** Every exercise will receive a movement-pattern label, including squat, hinge, horizontal push, vertical push, horizontal pull, vertical pull, unilateral lower, carry, rotation, anti-rotation, locomotion, and jump/throw. The app will describe catalog scores as decision-support estimates rather than medical or sport-performance guarantees.

## Source status

The current ACSM position statement page was protected by an automated access check in the browsing session, so it will not be quoted as a direct app source. The product will use broadly established training terminology while keeping prescriptions educational and adjustable.

## References

[1]: https://www.nsca.com/education/articles/ptq/teaching-resistance-training-movement-patterns/ "National Strength and Conditioning Association — Progressive Strategies for Teaching Fundamental Resistance Training Movement Patterns"

## Sport movement database framework

NSCA movement-analysis guidance recommends evaluating the actual prime movers and stabilizers, muscle action (concentric, eccentric, isometric, or combined), contraction velocity, joint range of motion, and energy-system demand before selecting supplemental exercises.[2] The new sport database will therefore represent a sporting action through these fields rather than implying that a muscle label alone determines exercise transfer.

The system will use movement-level associations—such as acceleration, braking, rotation, overhead force transfer, grip, and isometric bracing—to explain an exercise’s sport rating. These explanations remain decision-support heuristics; technical sport practice, workload, and individual context are not replaced by a gym exercise score.

[2]: https://www.nsca.com/education/articles/kinetic-select/movement-analysis-and-biomechanics-for-endurance-sports/ "National Strength and Conditioning Association — Movement Analysis and Biomechanics for Endurance Sports"

## Exercise Genome evidence boundaries

Exercise Genome values must be presented as **contextual model estimates**, not universal scientific scores. The deep-dive UI should distinguish an estimated value from its confidence category, evidence type, and reasoning notes.

The hypertrophy model should separate an exercise’s mechanical profile from adjustable programming variables. An umbrella review reports that several load ranges can support hypertrophy, volume responses may plateau, and execution variables should not be collapsed into one generic exercise rating.[3] The app will therefore treat volume, loading, range of motion, and proximity to failure as context-sensitive inputs rather than permanent exercise facts.

Fatigue will be represented as local muscular, systemic, cardiovascular, grip, axial, and technical demand instead of a singular recovery prediction. Resistance exercise can involve distinct central and peripheral fatigue mechanisms, so this data is appropriate for comparative programming support but not for precise recovery guarantees.[4]

[3]: https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2022.949021/full "Bernárdez-Vázquez et al. — Resistance Training Variables for Optimization of Muscle Hypertrophy: An Umbrella Review"
[4]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4723165/ "Pope et al. — Central and Peripheral Fatigue During Resistance Exercise: A Critical Review"
