# Tendon exposure: tables (area review, 20 Oct 2026)

Repository read at 963715b (branch claude/vigilant-galileo-u91fr3). Package: docs/specialization-atlas/forearm-research-v1/.
Prototype: tendon-exposure-prototype.ts beside this file; its output in tendon-exposure-prototype-output.txt and .json.

## T1. The package's regional groups as data on our nodes

The package gives ONE regional group per muscle (muscles.json `regional_groups`), 11 distinct groups, plus one tissue unit per muscle (`<id>-musculotendinous-unit`, which is our node row already). The "four views" (START-HERE §6.2 checklist: medial elbow, lateral elbow, wrist/thumb, digital) are not defined in the data; they are proposed here as navigation headings over the 11 groups, with no union total.

| Area heading (page words) | Group id (proposed) | Package group | Our nodes | Library sources to cite (existing ids; locator to be written) | Anatomy caution for the claim |
|---|---|---|---|---|---|
| Inner elbow | `forearm.common_flexor_origin` | medial-flexor-origin | forearm.fcr, forearm.pl, forearm.fcu, forearm.fds, forearm.pt | A52 (StatPearls Forearm Muscles, NBK536975), A53 (Kenhub superficial flexors), A8 (FCU humeral head), A12 (FDS humeroulnar head), A21/A22 (PT humeral head), A6 (FCR); candidate new: Radiopaedia "Common flexor origin of the elbow" | FDS has a second (radial) head and is the middle layer; PT and FCU also have ulnar heads; PL can be absent (A10): a group member that is absent is "not present", never a deficit. Not FDP, not FPL (package §6.1). |
| Outer elbow | `forearm.common_extensor_origin` | lateral-extensor-origin | forearm.ecrb, forearm.ed, forearm.edm, forearm.ecu | A54 (Kenhub superficial extensors), A29 (StatPearls ECRB, common tendon from the lateral epicondyle), A31 (ECU), A33 (ED), A35 (EDM); candidate new: Radiopaedia "Common extensor origin of the elbow" | ECU also arises from the posterior ulna; its origin is separable by fascia (Radiopaedia excerpt). Not ECRL (package §6.1). |
| Outer elbow | `forearm.ecrl_origin` | radial-wrist-extensors | forearm.ecrl | A27, A28 (lateral supracondylar ridge) | Just above the common extensor tendon; a separate structure. |
| Outer elbow | `forearm.brachioradialis_origin` | br-attachments | forearm.br | A1, A3 (lateral supracondylar ridge; distal radius) | Package group spans both ends. BR is loaded (contributing) in every row and pulldown, so this row is large for most athletes: show it as its own row, never merged into the outer-elbow tendon. |
| Outer elbow | `forearm.supinator_attachments` | proximal-supinator-attachments | forearm.supinator | A46, A47 | Web search (20 Oct) confirmed the lateral epicondyle origin only; the ligament and supinator-crest attachments still need an excerpt before the claim is reviewed. |
| Wrist and thumb | `forearm.thumb_first_compartment` | thumb-abductor-extensor-region | forearm.apl, forearm.epb | A39–A43 (A43 Jabir EPB review); candidate new: PMC2586286 (first dorsal compartment landmarks, Eplasty) | EPB has its own sub-compartment in a sizeable share of specimens (35% in that cadaver study); APL often has several slips. Label as the thumb side of the wrist, never as a diagnosis. |
| Wrist and thumb | `forearm.epl_route` | thumb-long-extensor | forearm.epl | A44, A45 (third compartment, around the dorsal radial tubercle) | |
| Wrist and thumb | `forearm.fpl` | thumb-flexor | forearm.fpl | A17, A18, A19 (radius and interosseous membrane origin) | Pinch also loads intrinsic hand muscles, outside the atlas (package §2.1). |
| Wrist and thumb | `forearm.pronator_quadratus` | distal-rotators | forearm.pq | A23, A24 (distal ulna to radius) | |
| Fingers | `forearm.deep_finger_flexor` | deep-digital-flexors | forearm.fdp | A14, A15, A20 (ulna and interosseous membrane) | FDS/FDP rows aggregate four digital tendons each; no per-finger claim (package §6.1). |
| Fingers | `forearm.index_extensor` | deep-digital-extensors | forearm.ei | A37 | |
| (none) | — | — | forearm.anconeus (adjacent), upper_arm.biceps, upper_arm.brachialis (external) | — | Outside the 19-muscle scope (package §4.1). The front-of-elbow (distal biceps, brachialis) area belongs to the upper arm's content, not invented on the forearm page. |

Every group can receive reviewed credit under forearm_mappings_v1 (scratch dump variants-and-mappings.tsv): APL (414 Band Thumb Abduction, direct), EPB and EPL (413 Band Thumb Extension, direct), FPL (412 Band Thumb Flexion, direct; 142 Plate Pinch, deliberate hold), PQ (405), supinator (406), EI (404, contributing). The package's own seed has no direct drill for APL/EPB/EPL (START-HERE §4.1); our catalog already has rows 412–414, so its "potential catalog additions" exist here (reconcile, do not duplicate).

## T2. What is already true, with evidence

| Package requirement | Already true? | Where (file:line) |
|---|---|---|
| Distinct parent bouts; never sum muscle sets (§3.2, START-HERE:116) | Yes | exposure.ts:327-331 (one category per node per bout), :666-671 (region total distinct); rules.ts:36 regionTotal |
| Drop set = one bout, stages kept as segments, reps kept (§7.3, Example B) | Yes | bouts.ts:103-114 (one segment per stage, stage ids), :143 (kind drop); deviceWorkoutLog.ts:235-245 (stages normalized, ids kept), :422-427 (settle on finish); BoutItem.tsx:35 ("Drop 1:" lines). Prototype: drop-1 = 1 bout, 3 segments, 21 reps |
| Duplicate delivery of a segment changes nothing (Example B) | Partly | exposure.ts:519-528 reads an id once, silently keeping the FIRST record; a conflicting duplicate (same id, other content) is not rejected or reported (package reference_engine.py:62-63 raises) |
| Edited log updates, not duplicates (Example B) | Yes | Recap corrections edit the set in place (deviceWorkoutLog.ts:155-156 `correctedAt`); summaries are recomputed from current records (01-reconciliation.md:17) and keyed by revision (revision.ts:25 lists warmup, holdSeconds, side, stages) |
| Swap: old sets keep their protocol, new ones get theirs (§7.3) | Yes | deviceWorkoutLog.ts:83-95, :114-117; bouts.ts:148-152. Prototype: 16 Oct Reverse Wrist Curl (1, own mapping) then Cable Wrist Extension (2) |
| Bilateral = one bout per side, not two (§7.3) | Yes | rules.ts:32; exposure.ts:119-125 |
| Unknown side kept apart, never bilateral (reference_engine.py:52-53) | Yes | exposure.ts:126-128, :496-503; 02-design.md:52 |
| Warm-ups excluded from work (§7.3) | Yes | exposure.ts:616; rules.ts:19; progressSeries.ts:270; workoutStrengthRecord.ts:164 |
| Warm-ups retained as separate tendon exposure (§6.2 step 8) | No | exposure.ts:616 drops them before any contribution is made; only `completeness.boutsExcluded.warmup` counts them. Also the logger never sets `warmup` (deviceWorkoutLog.ts:62-66; 01-reconciliation.md:16): only imports carry it today |
| Straps: no arbitrary multiplier; unknown grip contribution (§7.3) | Yes, more finely | exposure.ts:302-306 (only `requiresNoStraps` grip mappings withheld; BR on a strapped row still credited), :441-442 notes; deviceWorkoutLog.ts:127-133; the package engine instead makes the whole bout unresolved (reference_engine.py:91) |
| Holds stay seconds, never reps or sets (§6.2 step 5) | Yes | bouts.ts:81-85, :112; exposure.ts:480-483; rules.ts:34 |
| Missing hold duration shown as a count, never assumed (§7.3) | Partly | model.ts:81-84 says "time not recorded" only when a node's TOTAL is 0 s; three holds with one untimed read as the other two's seconds, with no word about the third. 06-calculation.md §8 names the history case |
| Recompute history on a mapping change; same version across windows (§6.2 change, §7.2) | Yes, by construction | On-demand calculation from device records (01-reconciliation.md:9, :17); `indexRegion` reads only the current version (exposure.ts:219-232) |
| Planned and completed kept apart (§6.2 step 1) | Yes | exposure.ts:530-533; page toggle SpecializationPanel.tsx:637-640 |
| Unresolved exercises reported (§6.2 step 9, Example C) | Partly | Region-only (exposure.ts:622-628) and listed-unmapped rows (:706-723) are shown; a set whose exercise the catalog does not know (`matchedBy: "none"`) is `unrelated` (exposure.ts:612) and appears nowhere on the page. Prototype: "Barbell wrist roll" ×2 invisible today |
| Seven-day columns that open the day's sets (§6.2 chart) | Partly | Region-level bars only: SpecializationPanel.tsx:523-540, :758-768; model.ts:396-410, :489-491; no split by kind, no per-area columns |
| Weekly history on the device's calculator | Yes, for the region | MeasurementsPanel.tsx:291-305 (8 calendar weeks, one summary per week), :432-454; progressSeries.ts:139-149 (8-week axis) |
| Symptoms private, never in share cards (§6.1, §7.2) | Nothing to leak today | No symptom field exists. WorkoutShareSheet.tsx:185 shares planned exercises only ("Never your logged sets, history, body measures or profile."); shareSnapshot.ts reads no storage; no code enumerates localStorage keys |

## T3. Conflicts with 02-design.md, and the decision

| # | Package says | 02-design.md / shipped rule says | Decision |
|---|---|---|---|
| C1 | Keep warm-up exposure, counted separately, in the tendon context (§6.2 step 8, §7.3) | Warm-ups are excluded from completed totals (02-design.md:32; rules.ts:19, published and frozen) | No change to `specialization_exposure_v1` or any v1 number. Tendon exposure is a separate, separately versioned method (`tendon_exposure_v1`) that reads warm-ups in a second pass and shows them on their own line, never in the columns or the change line. The golden test stays identical. |
| C2 | Optional structured symptoms: location, side, 0–10, during/after/next morning, note (§6.1) | "Notes: the session note that already exists … No new questionnaire." (02-design.md:79) | Build it as an optional, never-prompted note entered only inside Tendon exposure; nothing is asked on the set card, recap or finish. Amend 02-design.md §5 to say so. Blank rating is stored as null; 0 only when typed. |
| C3 | Five buckets incl. `supporting_isometric` and `incidental_grip` (§3.2) | Six categories; stabilizer and non-deliberate isometric both become `incidental_isometric` (02-design.md:36-46; rules.ts:50-62) | Keep ours (binding). The tendon view needs only three kinds per area (target, hold, other), derived from our parts. |
| C4 | Strapped (`grip_assisted`) bout is wholly unresolved (reference_engine.py:91) | Only grip mappings that need a bare hand are withheld (02-design.md:58) | Keep ours; in the tendon view a strapped set appears per area as "grip not counted (straps)", unknown, never zero. |
| C5 | Reject conflicting duplicate segments (§6.2 step 2) | Read an id once, first wins, silently (exposure.ts:518-528) | Do not throw on device data. Next rule version (v2, wave A): count duplicate ids in completeness; a conflicting pair is excluded from every total and listed. Low priority: the device cannot produce one; only an import can. |
| C6 | "Complete" window means tracking completeness is known (§6.2) | The app cannot know what was not logged | Operational definition, said on the page: a week counts toward a baseline when it has ended, at least one finished workout is logged in it, and no set touching that area has no arm recorded. Weeks before the first logged workout never count. |
| C7 | Optional percentage with base numbers (§6.2) | (none) | Never show a percentage. Absolute change and both base numbers only; no threshold anywhere. |
| C8 | Four views: medial elbow, lateral elbow, wrist/thumb, digital (§6.2 checklist) | (none; package data has 11 groups) | Four headings (Inner elbow, Outer elbow, Wrist and thumb, Fingers) over the 11 groups; counts per group only; no union number per heading. |

## T4. Copy (proposed exact strings) and what the section never says

| Place | Text |
|---|---|
| Disclosure summary | **Tendon exposure** · small: "Sets by attachment area, right arm" (planned: "…, Plan Week 2, as written") |
| Lede | "How many sets loaded the muscles that attach at each area. A set counts once per area, however many of its muscles worked. It counts sets; it does not measure tendon strain, and the exercise mappings do not cover everything you do." |
| Row | "Common flexor origin · 25 sets" / small "6 target · 7 holds · 12 other". "Other" defined once: "Other: helping or steadying, mostly grip during pulls and rows." |
| Zero groups (one line) | "No mapped work in this window: supinator, APL and EPB, EPL, pronator quadratus, EI." Thumb groups with no direct work: "No mapped direct exercise in this selection" (START-HERE:320) |
| Change, comparison | "Last week (12–18 Oct): 25 sets. Your weekly median before it: 16, from 4 weeks. +9 sets." |
| Change, new | "New exposure: 3 sets last week; none in the 4 weeks before." |
| Change, sparse | "Building your baseline: 2 of the 3 earlier weeks needed are logged." |
| Change, incomplete | "Not enough information: 2 sets last week have no arm recorded." / "…: no workout is logged for last week." |
| Review link (always beside a change line; no threshold) | "See the sets behind this" |
| Holds | "Holds: 7 sets, 3 min 10 s recorded; 1 with no time recorded." |
| Warm-ups (only when > 0) | "Warm-ups: 1 set, kept out of the columns." |
| Not counted | "Not counted here: 5 sets with straps (grip not counted) · 0 with no arm recorded · 0 under review." |
| Not placed | "Not placed in an area: 2 Kettlebell Clean sets count for the forearm as a whole. 2 sets of an exercise the catalog does not know." |
| Notes heading | "Your notes · optional · kept only on this device, never shared or synced" |
| Notes fields | When · Arm (Left, Right, Both) · Where (Inner elbow, Outer elbow, Wrist and thumb, Fingers, Other) · Discomfort 0 to 10 (optional) · Noticed (During, After, Next morning) · Note |
| Remove | "Note removed." + Undo |
| Never in the section (test-scanned) | risk, safe, unsafe, danger, warning, overuse, overload, too much, limit, budget, zone, spike, red flag, tendinitis, tendonitis, tendinopathy, injury (the rule's own "No number here predicts growth, recovery or injury." stays in How this is counted) ; no green/amber/red state colours; no "%". |

## T5. Phone layout (390 × 844 first; 375 × 667; 430 × 932)

| Order | Block | Phone notes |
|---|---|---|
| — | Not on the first screen | The first screen stays as 09-page.md and SpecializationPanel.phone.render.test.ts hold it: controls, window line, map card with strip and drawing top |
| 1 | Closed disclosure in `.spz-disclosures`, after "Exercises in this window" (SpecializationPanel.tsx:754-787), before "Targets" (:789) | Mounted on first open and kept, as Progress is (:361, :794-797) |
| 2 | Lede (3 lines at 390 px) + "How this is counted" link to its own method block | |
| 3 | Four headings, group rows under each; each row a full-width button ≥ 44 px | Zero groups folded into one line |
| 4 | Selected row expands inline (aria-expanded): seven-day columns reusing `.spz-days`/`.spz-day` (7 columns from 370 px, 4 below), each column a stacked target/hold/other bar with the day's total; a day with work is a button that opens BoutListSheet with that group's rows | Columns already measured 44 px tall (specialization.css:241); colours from the existing category keys |
| 5 | Under the columns: holds line, warm-ups line, not-counted line; then the change line with "See the sets behind this" | Text, no seconds on the bars |
| 6 | Not placed line | |
| 7 | Your notes: list (newest first, 3 shown) + "Add a note" opens an inline fieldset (16 px inputs, 44 px controls), Save; Remove acts at once with Undo | Same pattern as MeasurementsPanel's inline reading form and Undo |
| — | Muscle sheet: one line "Attaches at: inner elbow (common flexor origin). See tendon exposure" | Opens the disclosure the way openMethod does (SpecializationPanel.tsx:466-475) |
