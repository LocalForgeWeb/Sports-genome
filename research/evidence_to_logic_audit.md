# Sports Genome Evidence-to-Logic Audit

## Rule of interpretation

Every athlete-facing quantitative value must be recorded as one of four categories. **Source-backed anchors** use a verified study or review as a population-level reference. **Planning estimates** are explicit model settings used to order or summarize options; they are not physiological measurements. **Product constraints** are interface or safety choices, such as list limits and missing-data requirements. **Athlete-entered values** are recorded observations and must never be rebranded as a score from the model.

> No rank, grade, percentage, or index in Sports Genome may be described as a laboratory measurement, a personal diagnosis, or a universal prescription unless the cited evidence supports that use.

## Initial high-impact inventory

| Surface | Current values or rule | Classification | Evidence/rationale status | Required action |
|---|---|---|---|---|
| `trainingEvidence.ts` hypertrophy anchors | 6–15 repetitions, 10 weekly hard sets starting reference, 12–20 trained-study context, 60-second rest floor | Source-backed anchor | Existing DOI/PMID links attached in code | Retain with population-level boundary. |
| `trainingEvidence.ts` strength anchors | 1–6 repetitions and 180-second trained-athlete rest floor | Source-backed anchor | Existing DOI/PMID links attached in code | Retain with population-level boundary. |
| `workoutPlanner.ts` session set bands and preset prescriptions | Goal-specific 9–24 set bands and `3–4` set defaults | Planning estimate | Existing UI boundary is present, but values need a central rationale record | Move to shared calibrated planning config and label as editable planning bands. |
| `progressiveTraining.ts` estimated performance, RPE holds, confidence, and change triggers | Repetition divisor `30`; two/three-session confidence; RPE 8.5/9/9.5; 3%/10% change triggers | Mixed: athlete-log heuristic / source-backed anchor pending | Explicit individual boundary exists; source metadata is incomplete | Add source/rationale metadata and convert fixed triggers to named conservative review guards. |
| `hierarchicalSportModel.ts` demand scores | 0.32, 0.78, 0.08 modifier boost, 0.90 cap | Planning estimate | Sport evidence supports demand inclusion, not those decimal magnitudes | Centralize as ordinal display calibration; never expose as a physiological quantity. |
| `movementRecommendations.ts` fit scores, grades, diversity penalties, and 0–99 breakdowns | Match weights, grade thresholds, goal boosts, diversification constants | Planning estimate | Sport and exercise evidence supports the categories but not universal weights | Replace scattered literals with named relative-ranking calibration and render the value as model relevance, not a measured sport-fit percentage. |
| `exerciseGenome.ts` fingerprints, fatigue, practicality, curves, contextual score, and tiers | 0–100 mechanics estimates, grade cutoffs, similarity weights, fatigue/redundancy thresholds | Planning estimate with selected source-linked mechanics | Direct evidence/calibrations exist for some ROM and mechanics descriptors, but not the composite values | Centralize calibration, preserve study notes, and label all composites as standardized relative estimates. |
| `muscleTargetingModel.ts` role priors and mechanics/direct-evidence precedence | 78/50/30 role priors and direct-evidence floor of 82 | Mixed: evidence-priority rule plus planning estimate | The evidence-precedence principle is documented; numeric translation needs traceability | Retain precedence rule, centralize ordinal calibration, and prevent clinical or EMG-like interpretation. |
| `weeklyVolume.ts` direct/support exposure | Direct sets count fully; secondary-muscle sets count at `0.5`; 6/12 direct-set status bands | Planning estimate | The UI identifies volume as an estimate, but the support fraction and display bands need explicit calibration metadata | Retain as transparent exposure bookkeeping, label `0.5` as a conservative support-set convention, and remove any implication of measured muscle dose. |
| `stackMuscleAnalysis.ts` role weighting and normalization | Prime mover `1.0`, synergist `0.65`, stabilizer `0.4`; stack-highest exposure normalized to `100` | Planning estimate | Role distinctions are evidence-informed, but fractions are not direct physiology | Centralize as within-stack ordinal exposure calibration and keep `100` explicitly relative to that stack only. |
| `workoutRedundancy.ts` classifications | Same movement plus shared primary muscles plus similar intent → duplicate; shared primary muscle alone → reinforcement | Product-design rule using catalog taxonomy | The rule is transparent and does not claim a recovery measurement | Retain as a categorical screening rule; do not add unsupported numeric redundancy “precision.” |
| `recoverySpacing.ts` consecutive-day flags | Secondary exposure `0.5`; shared-muscle 3-set inclusion; 8-set priority alert | Planning estimate | The current boundary should state that it does not diagnose recovery | Centralize with weekly-volume support-set convention and rename as a consecutive-day exposure review, not a recovery measurement. |
| `gymTimeBudget.ts` time bands and set adjustments | 30/45/60/75/90-minute buckets; 3–7 exercise cap; -5 to +4 set adjustment; 4/6 set floors | Product-design planning constraint | The existing boundary calls it a scheduling heuristic | Retain as an editable time-budget tool, centralize values, and prevent “optimal dose” wording. |
| `catalogDiscovery.ts` and catalog grade maps | F–SS values mapped to ordered integers for filter/sort | Product constraint | The numbers are ordering keys, not performance evidence | Retain internally; avoid exposing the integer map. |
| `preTrainingMobility.ts` drill match scoring | Tag, direct-match, and goal-phase boosts; 4–6 drill selection | Planning estimate | Drill library is source-informed, but ranking weights are not study constants | Centralize as a rule-based sequence preference and expose no numeric score to athletes. |
| `splitStackAnalysis.ts` coverage state | 65% target gap, target +35 high-exposure state, score-to-target normalization | Planning estimate | Split requirements are model targets, not verified muscle-dose thresholds | Rename output as split-coverage review and attach model-boundary copy. |
| `exerciseGenome.ts` composite context | 0–100 fingerprint, redundancy, transfer, fatigue, and grade cutoffs | Planning estimate | Some inputs have direct study calibration; composite arithmetic does not | Convert copied constants into named calibration, retain only relative-rank language, and never treat the scale as a scientific measurement. |
| `movementRecommendations.ts` F–SS transfer grade and ranking arithmetic | Signal/muscle match increments, sport-power adjustment, goal and diversity adjustments | Planning estimate | Sources justify movement categories and evidence modifiers, not universal point weights | Replace hidden weights with named relevance calibration and render grades as relative model tiers. |
| `hierarchicalSportModel.ts` demand decimals | 0.32/0.78 base and 0.08 modifier boost with 0.90 cap | Planning estimate | Evidence supports included demands and context, not decimal magnitudes | Use explicit ordinal priority calibration and retain sport/modifier sources alongside it. |
| `muscleTargetingModel.ts` mechanics factors | Role priors plus fixed mechanics signals and direct-evidence floor | Planning estimate with source-linked mechanics | Source links exist for mechanics uncertainty and direct-study precedence | Centralize numeric conversion while maintaining direct longitudinal evidence precedence. |

## Placeholder boundary

Text-field `placeholder` attributes, empty-state prompts, optional-profile labels, and test mocks are not fake athlete data. The audit treats a placeholder as defective only when it is rendered as a real recommendation, score, research claim, workout record, athlete metric, or interactive destination without usable functionality.

## Implementation disposition

The application now centralizes its high-impact athlete-facing planning and comparison settings in `client/src/lib/evidenceTraceability.ts`. The registry categorizes population-level programming anchors, relative-model calibration, product constraints, and athlete-entered observations. Sport demand, recommendation relevance, targeting, volume/exposure, recovery spacing, progression review, workout-review defaults, split coverage, warm-up preference, and Exercise Genome composite settings consume named calibration values rather than scattered anonymous literals.

Remaining static data such as individual catalog tags, exercise-study descriptors, movement-family labels, generated resistance-curve illustrations, available time buckets, and stored athlete observations are not covert scientific scores. They are respectively catalog content, model descriptors, interface constraints, or athlete-entered records. They remain subject to the same boundary: no value is rendered as a laboratory measurement, diagnosis, individual optimum, or universal prescription.

## No-placeholder disposition

The direct source review found no athlete-facing mock training record, fabricated user review, fake research result, dead-end “coming soon” recommendation, or visual score presented as live data. Native form placeholder text remains for normal inputs only. Legacy Gym Optimizer wording and old-brand icons in onboarding, standalone authentication, guided navigation, dashboard access, and printable workout surfaces were replaced with Sports Genome identity.

## Regression coverage

`evidenceTraceability.test.ts` protects the four-category registry and core calibration presence. `ExerciseGenomePanel.traceability.test.ts` ensures athletes can open a compact methodology explanation that differentiates source-backed anchors from relative planning estimates. Existing recommendation, targeting, training, split, mobility, onboarding, account-entry, and Exercise Genome suites validate that the calibrated constants preserve their prior bounded behavior.

## Remaining-surface classification pass

| Surface family | Classification decision | Implementation disposition |
|---|---|---|
| Server authentication, validation, session, and history limits | Product constraints | Registered as security, reliability, input-validation, and display rules; none is described as a training finding. |
| Stored loads, repetitions, RPE, completion, bodyweight, and session counts | Athlete-entered observations | Retained as the athlete’s own record, with no automatic medical, readiness, strength, or cross-person interpretation. |
| Seeded study durations, percentages, protocol loads, repetitions, and outcomes | Source-backed only inside the cited record | Kept attached to PMID/DOI/source scope; blank optional outcome fields are unavailable data, not results. |
| Sport movement tags, role/event/style records, and catalog exercise IDs | Catalog/source data or identifiers | Preserved as taxonomy and record data; numeric identifiers are never presented as performance values. |
| Catalog grades, sport cues, movement coverage, overlap review, ranking, and list breadth | Relative planning estimate or product constraint | Catalog output is labeled as a rank; named calibration controls scoring, truncation, overlap review, and assistance limits. |
| Exercise mechanics, targeting, Genome, redundancy, progression, exposure, recovery, and warm-up scores | Relative planning estimate | Coefficients are named in `logicCalibration`, displayed with relative-model language, and guarded by direct-evidence precedence and uncertainty disclosures. |
| Resistance-curve five-point arrays in Exercise Genome | Qualitative display profile | These arrays depict named lengthened, shortened, even, mid-range, or setup-dependent resistance contexts for visual comparison only. They are not measured torque curves, individual moment-arm values, EMG, activation, or a prescription. |
| Gym-time options, history pagination, set-log input bounds, visible list sizes, chart geometry, and unit formatting | Product constraint | Treated as interface or record-integrity behavior, not physiology or prescription. |
| Empty-state prompts, input placeholders, and missing data | Interface state | Kept only where they accurately express absence or request normal form input; no fake athlete record, fabricated recommendation, or simulated research finding remains. |

The audit’s complete rule is not that every integer originates in a study. It is that **every athlete-facing value has a declared role**: source-backed population anchor, bounded relative planning estimate, product constraint, or athlete-entered observation. Exact numerical coefficients remain visibly non-measurement model settings unless an individual cited study itself supplies the value and scope.

Optional `primaryOutcomes` values in the research-evidence API now normalize to `null` when the source summary did not supply them. This preserves the difference between an unavailable field and a real negative or empty finding, and prevents a blank placeholder from being rendered as evidence content.

## External evidence check used for programming anchors

Currier et al. conducted a systematic review and Bayesian network meta-analysis of resistance-training prescription combinations in healthy adults. The review found that all included resistance-training prescriptions improved strength and hypertrophy relative to no exercise; higher-load prescriptions ranked highest for strength, while multiple-set prescriptions ranked highly for hypertrophy. The comparison concerns populations and programmed combinations of load, sets, and frequency, not a universal individual dose. Sports Genome therefore uses this source to support editable population-level anchors and retains an explicit boundary against “optimal for every athlete” claims.[1]

[1]: https://bjsm.bmj.com/content/57/18/1211 "Currier et al., 2023 — Resistance-training prescription network meta-analysis"
