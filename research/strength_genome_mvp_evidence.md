# Strength Genome MVP Evidence and Implementation Limits

## Purpose

This register records the limited, verified evidence that may inform the first Strength Genome architecture. It does **not** authorize generic population percentiles, universal bodyweight ratios, or anatomical force measurements. A missing reference must remain an explicit `Insufficient reference data` state.

## Verified implementation anchors

| Topic | Verified finding | MVP use | Explicit limit |
| --- | --- | --- | --- |
| Direct 1RM reliability | A 2020 systematic review of 32 studies (pooled n = 1,595) reported generally good-to-excellent test–retest reliability, with a median ICC of 0.97 and a median CV of 4.2%. | Treat a documented, standardized measured 1RM as a higher-quality observation than an estimated 1RM. | Reliability varies by protocol and observation quality. Do not label a lift as a direct muscle-force measurement. |
| Multi-repetition 1RM estimation | A study of chest press and plate-loaded leg press reported better prediction accuracy from lower repetition conditions and warned that linear equations should not exceed ten repetitions for those tested actions. | Permit an exercise-specific estimated-1RM record only when the accepted range and method are declared. | Do not equate e1RM certainty with a directly measured 1RM or apply one equation universally across exercises, equipment, populations, and repetition ranges. |
| Body-mass scaling | In Division I-A collegiate football athletes, exercise- and population-specific allometric exponents reduced body-mass confounding for bench press, clean, and squat. | Store normalization method and reference-population scope with each future normative reference. | Do not use the study’s exponents for other sports, sexes, ages, exercise variations, or populations. Do not treat a simple load/body-mass ratio as universally valid. |

## Evidence-status rules

| Data state | Athlete-facing treatment | System behavior |
| --- | --- | --- |
| A valid, matching reference dataset is stored | Show percentile, reference population, normalization method, and source access. | May derive a tier as a Sports Genome presentation category. |
| A standardized performance observation has no matching reference dataset | Show exercise performance and longitudinal comparison only. | May contribute cautiously to a domain evidence record; no population percentile or tier is shown. |
| A machine/cable setup is not standardized across reference data | Show within-athlete progression only. | Do not compare machine load across models or manufacture a normative percentile. |
| Domain or region has sparse/overlapping evidence | Show `Partially characterized` or `Insufficient data`. | Recommend one non-redundant measurement; do not invent a weakness or a certainty increase. |

## Sources

1. Grgic J, et al. *Test-Retest Reliability of the One-Repetition Maximum (1RM) Strength Assessment: a Systematic Review.* Sports Medicine Open. 2020. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32681399/)
2. Reynolds JM, et al. *Prediction of one repetition maximum strength from multiple repetition maximum testing and anthropometry.* Journal of Strength and Conditioning Research. 2006. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16937972/)
3. Oba Y, Hetzler RK, et al. *Allometric scaling of strength scores in NCAA division I-A football athletes.* Journal of Strength and Conditioning Research. 2014. [PubMed](https://pubmed.ncbi.nlm.nih.gov/24875427/)
