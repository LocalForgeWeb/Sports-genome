# Relative-Strength Reference Screening — 2026-08-29

## Candidate: competitive powerlifting norms

The first candidate source is van den Hoek et al. (2024), a retrospective study of **809,986 global drug-tested, unequipped powerlifting competition entries**. It reports relative squat, bench-press, and deadlift performance as lifted weight divided by body weight, stratified by sex, United Nations age classifications, and competitive weight class. Percentiles were computed from the 10th through the 90th percentiles. [1]

The source’s male 18–35-year deciles include a bench-press relative-strength range from **1.19× body mass at the 10th percentile to 1.96× at the 90th percentile**, a squat range from **1.75× to 2.83×**, and a deadlift range from **2.03× to 3.25×**. These values are reported here for source screening, not yet for product display. [1]

The full publisher page confirms that Tables 3–6 contain age- and IPF-weight-class stratified deciles for the three lifts and identifies the article as open access under a Creative Commons licence. The recorded results came from global drug-tested, unequipped powerlifting competitions and use each athlete's maximum successful lift divided by that competition's body mass. [1] This supports a narrowly scoped, source-labelled comparison pathway; it does **not** create a general-gym or chest-muscle rank.

| Candidate | Eligible only if all documented gates match | Current integration decision |
| --- | --- | --- |
| Squat / bench press / deadlift norms from competitive powerlifting entries | Exact named lift; maximum successful competition lift; unequipped and drug-tested competition context; source comparison category; age 18–35; competition-day body mass; source-decile lookup | **Implemented as a gated route.** The athlete must declare every listed condition before the app returns a reported decile cut point or interval; the initial route uses the verified 18–35 source tables and does not interpolate an unreported percentile. |
| Piper preacher-curl benchmark | Existing explicit adult male 18–25, pre-training, preacher-curl 10RM, protocol/equipment, canonical identity, and saved test-day body-mass gates | Existing narrow route only; no expansion implied. |

## Product consequence

The Strength Genome ring must continue to mean **recorded test coverage** by default. It can display a reference-qualified visual treatment only after a candidate source passes all explicit gates. A new regional detail card can now display the reported van den Hoek 2024 decile cut point or interval for an explicitly declared eligible Back Squat, Barbell Bench Press, or Conventional Deadlift result. No source in this screening authorizes an undifferentiated “rank” for a chest selection, a general gym session, or a nonmatching lift.

## References

[1] van den Hoek DJ, et al. [*Normative data for the squat, bench press and deadlift exercises in powerlifting: Data from 809,986 competition entries*](https://pubmed.ncbi.nlm.nih.gov/39060209/). *Journal of Science and Medicine in Sport*. 2024. PMID: 39060209.
