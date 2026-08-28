# Strength Genome Reference Qualification Review

**Reviewed:** 2026-08-27

## Candidate: one-repetition maximum test reliability

Grgic J, Lazinica B, Schoenfeld BJ, Pedisic Z. *Test–Retest Reliability of the One-Repetition Maximum (1RM) Strength Assessment: a Systematic Review.* Sports Medicine - Open. 2020;6:31. PMCID: PMC7367986. PMID: 32681399. <https://pmc.ncbi.nlm.nih.gov/articles/PMC7367986/>

The review included 32 studies (pooled sample size 1,595). Reported 1RM test–retest intraclass correlation coefficients ranged from 0.64 to 0.99 (median 0.97); reported coefficients of variation ranged from 0.5% to 12.1% (median 4.2%). The paper concludes that 1RM testing generally has good-to-excellent test–retest reliability across several examined populations and exercise types.

**Permitted Sports Genome use:** explain why repeated standardized observations can be useful and why recorded testing conditions should accompany comparisons.

**Prohibited Sports Genome use:** treat the pooled median, an ICC, or a coefficient of variation as an individual athlete error bar, a universal change threshold, a strength tier, or a sport-performance prediction. The review reports substantial protocol, population, and exercise variation.

## Candidate: international adult handgrip norms

Tomkinson GR, Lang JJ, Rubín L, et al. *International norms for adult handgrip strength: A systematic review of data on 2.4 million adults aged 20 to 100+ years from 69 countries and regions.* Journal of Sport and Health Science. 2025;14:101014. PMCID: PMC11863340. PMID: 39647778. <https://pmc.ncbi.nlm.nih.gov/articles/PMC11863340/>

The review synthesized 100 observational studies representing 2,405,863 adults aged 20 to 100+ years from 69 countries/regions. It provides sex- and age-specific norms for absolute handgrip strength and height-squared-normalized handgrip strength, using harmonization and population-weighted statistical models. The paper notes material methodological variation in the literature.

**Potential future use:** a handgrip-only reference view if the athlete records a qualifying dynamometer protocol, relevant demographics, laterality/hand information, and all source-defined population/normalization conditions.

**Current decision:** do not deploy numerical percentiles or tiers. The application currently lacks a complete protocol- and demographic-match flow, and this evidence must not be generalized to barbell lifts, regional muscle force, health screening, or sport ability.

## Supporting protocol-limit source

Massy-Westropp NM, Gill TK, Taylor AW, Bohannon RW, Hill CL. *Hand Grip Strength: age and gender stratified normative data in a population-based study.* BMC Research Notes. 2011;4:127. PMCID: PMC3101655. PMID: 21492469. <https://pmc.ncbi.nlm.nih.gov/articles/PMC3101655/>

This Australian population study illustrates why protocol matching matters: it used a Jamar analogue dynamometer, seated position, elbow at 90 degrees, neutral wrist, handle position II, support under the dynamometer, and the mean of three trials. Its authors excluded comparison studies when equipment, position, age/hand breakdown, or participant screening differed.

**Implementation boundary:** condition-aware comparison remains correct; no app value may infer a grip percentile merely from a self-entered load unless the qualifying protocol and applicable reference inputs are available and verified.

## Decision for the current release

Continue to show athlete-entered observations, documented test context, broad movement routing, athlete-confirmed priorities, and within-athlete like-for-like recorded-load changes. Keep reference percentile, universal tier, medical/health interpretation, regional-force estimate, and direct sport-performance transfer outputs unavailable until a complete, source-qualified reference implementation is built.

## Candidate: 30-second biceps curl percentiles in schoolchildren

Cossio-Bolaños M, Vidal-Espinoza R, Sulla-Torres J, et al. *Reliability of the biceps curl test and proposed percentiles in schoolchildren living at moderate altitude in Peru.* Scientific Reports. 2025;15:10045. PMCID: PMC11930944. <https://pmc.ncbi.nlm.nih.gov/articles/PMC11930944/>

The study reports age- and sex-specific percentile curves for a **30-second seated dumbbell biceps-curl endurance test** in 1,103 Peruvian schoolchildren aged 6–17 years living at moderate altitude. The protocol used a 1 kg dumbbell for ages 6–11 and 2 kg for ages 12–17; it is not a free-weight curl 1RM, is not load-to-body-mass normalized, and does not supply adult athlete references.

**Current decision:** do not apply these percentiles to adult users, loaded curls, generic biceps strength, regional force, or sport ability. It may support a future pediatric 30-second protocol only after the app collects the exact age, sex, protocol, side, load, and population-match fields. The proposed searchable catalog selection can improve exercise-to-region routing now, but does not itself unlock a generic biceps-curl benchmark.

## Candidate: college-aged male 10RM biceps-curl norms

Piper T, Furman S, Smith T, Waller M. *Establishing Normative Data for 10RM Strength Scores in College-Aged Males.* International Journal of Strength and Conditioning. 2021;1(1). DOI: <https://doi.org/10.47206/ijsc.v1i1.40>. Article: <https://journal.iusca.org/index.php/Journal/article/view/40>.

The study reports 10RM reference values for biceps curl, alongside leg press, bench press, seated overhead press, preacher curl, and lat pulldown. It used 1,095 college-aged males aged 18–25 (mean 19.94 years), testing in one facility on fixed equipment with NSCA-guided procedures. The abstract reports bodyweight-category percentile break points.

**Strict implementation limit:** This is a potential benchmark only for an intentionally selected, exact 10RM biceps-curl protocol in an athlete whose age, sex, body-mass category, bar/equipment, and test procedure match the source. It does not support a universal curl rating, a body-mass-only rank, a generic loaded-curl percentile, regional biceps force, or sports-performance inference. Exact table cut points must be extracted and independently checked before any numerical app benchmark is shown.

## User-supplied source hierarchy intake — 2026-08-28

The proposed sources must remain **separate reference populations**, not inputs to one blended “Strength Genome score.” Each source needs an explicit exercise, protocol, sex, age or age-band, body-size normalization, training/population definition, and permission-to-use review before data can enter athlete-facing logic.

### Strength Level broad exercise coverage: candidate source, not yet integrated

Strength Level states that its 2026 standards cover 287 exercises from 195,513,376 community-submitted lifts by 27,893,268 users; it frames an exercise result against other lifters by gender, bodyweight, and age. The page includes barbell, bodyweight, dumbbell, machine, and cable categories. This makes it a potential **separate community-lifter reference**, not a scientific or sport-specific normative population. It is not ingested: its terms prohibit automated or programmatic service access, including scraping, bots, scripts, and unauthorized API usage without explicit written authorization. No table extraction, copying, or derivative Sports Genome percentile is permitted until a written license or approved data-access pathway is obtained. No Sports Genome percentile, tier, or regional score is enabled from this source.

Sources: https://strengthlevel.com/strength-standards and https://strengthlevel.com/terms-and-conditions (accessed 2026-08-28)

### van den Hoek et al. 2024: narrow powerlifting reference candidate

PubMed identifies the study as a retrospective reference set of **809,986** global drug-tested, unequipped powerlifting competition entries: 571,650 male and 238,336 female samples. It covers squat, bench press, and deadlift only; results are relative lift/bodyweight ratios and are stratified by sex, United Nations age classifications, and competitive powerlifting weight class, with 10th–90th percentile values. It is a strong candidate only for comparable raw, unequipped, drug-tested competition-lift context. It must not rate a generic gym back squat, bench, or deadlift without the required protocol and population match.

Source: https://pubmed.ncbi.nlm.nih.gov/39060209/ (accessed 2026-08-28); DOI: https://doi.org/10.1016/j.jsams.2024.07.005
