# Sport-agnostic evidence routes — coverage report

Outcome of checklist item `promote_general_evidence_routes` (24, research).
Required output: evidence-graded sport-agnostic recommendation families and a coverage report
exposed through safe app views.

**Result: the item is blocked, and no route was promoted.** The library does not contain the
evidence this work item is meant to promote. One study across all regions passes the necessary
screen, and its outcome is muscle activation rather than function. The screen, the counts and the
single candidate are all recorded; what is missing is source coverage, and no amount of code
supplies it.

## How candidates were screened

`resilience_general_route_candidates_v1` (applied 2026-09-19, `security_invoker`) classifies every
study whose title mentions an exercise or rehabilitation term, on two axes:

**Population class** — `sport_labelled` · `sport_text_unlabelled` · `clinical_or_general` ·
`unclassified`.

**Design class** — `intervention_outcome` · `review` · `mechanism_emg_biomechanics` ·
`reliability_normative` · `other`.

A study is `eligible_for_general_route` only when it names a resilience region, has a
`clinical_or_general` population, and uses an intervention or review design. Eligibility is
necessary, not sufficient: a reviewer still reads the source for presentation, dose, directness and
limitations before any row is written.

### Why `sport_population IS NULL` was not used as the test

It is the obvious shortcut and it is wrong. 66 of the 413 sport-null studies describe a
sport-specific cohort in their population text — pitchers, swimmers, rowers, golfers, sprinters.
21 of those fall inside the region-tagged resilience candidate pool. A NULL sport label currently
means both "general population" and "sport not recorded", so promoting on the null alone would
silently convert sport evidence into general evidence: exactly what
`no_fake_sport_fallback` and the sport-optional contract forbid.

Both facts are now directives: `ingest_general_population_resilience_evidence` (priority 97) and
`correct_sport_null_population_labels` (priority 93).

## Coverage

162 region-tagged candidate studies.

| Population class | Studies |
| --- | --- |
| `sport_labelled` | 71 |
| `unclassified` | 56 |
| `sport_text_unlabelled` | 21 |
| `clinical_or_general` | 19 |

| Design class | Studies |
| --- | --- |
| `mechanism_emg_biomechanics` | 50 |
| `reliability_normative` | 46 |
| `intervention_outcome` | 42 |
| `other` | 23 |
| `review` | 1 |

The two distributions explain the problem between them. The library is rich in **mechanism**
evidence (which muscles an exercise activates) and in **sport** evidence (what worked for pitchers
or rowers). General-population **outcome** evidence — what regional exercise does for the function,
symptoms or load tolerance of someone who does not play a sport — is the cell that is nearly empty.

### By region

| Region | Candidates | Mislabelled sport population | Eligible |
| --- | --- | --- | --- |
| shoulder | 56 | 4 | 0 |
| hip | 30 | 3 | 0 |
| hamstring | 22 | 5 | 0 |
| groin_adductors | 11 | 1 | 0 |
| low_back | 10 | 0 | **1** |
| elbow_wrist | 9 | 1 | 0 |
| neck | 9 | 0 | 0 |
| knee | 7 | 2 | 0 |
| calf_achilles | 4 | 0 | 0 |
| ankle | 4 | 0 | 0 |

Shoulder, knee and low back are the three regions the release criteria name. Shoulder has the
largest candidate pool in the library and yields nothing: its 56 candidates are EMG and
biomechanics studies, plus two RCTs in high-school baseball pitchers whose `sport_population` was
never set.

## The one candidate, recorded as draft

`Change in trunk muscle activities with prone bridge exercise in patients with chronic low back
pain` (PMID 26957771, 2016, 38 of 45 completers, 8 weeks).

Written to `resilience_recommendations_general` with `review_status = 'draft'`,
`evidence_directness = 'indirect'`, no dose and no confidence score, against a new
`chronic_low_back_pain` presentation type. Its limitations field states plainly that the outcome is
trunk muscle activation, not pain, function or load tolerance, and that sessions per week and
per-session volume are not in the stored record — so no dose can be claimed.

Draft rows are invisible to `app_resilience_recommendations_v2`. It makes no athlete-facing claim;
it exists so the review pipeline has its one real candidate on file rather than in prose.

## Verified state after this pass

| Measure | Value |
| --- | --- |
| Rows in `resilience_recommendations_general` | 1 |
| ... approved | **0** |
| App-visible `general` or `presentation_matched` rows | **0** |
| Catalog targets carrying a general route | **0** |

General mode still returns the insufficiency state for every target. That is the correct answer
while the evidence does not exist, and the schema keeps the alternative unavailable rather than
merely discouraged: `resilience_recommendations_general` has no `sport_id` column, so a
sport-derived row cannot be relabelled as general by nulling a field.

## What unblocks this

New source ingestion, in the priority order set by the directive: shoulder (rotator-cuff related
and subacromial pain), knee (patellofemoral pain, patellar tendinopathy), low back (non-specific
low back pain), then Achilles tendinopathy, lateral ankle sprain history and adductor-related groin
pain. Accept only sources whose population is not sport-defined and whose outcome is function,
symptoms, load tolerance, strength or recurrence — not muscle activation.
