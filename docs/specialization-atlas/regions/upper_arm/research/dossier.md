# Specialization atlas: upper-arm anatomy and its evidence (19 Oct 2026)

What the upper-arm content says, what it rests on, and how far that review can be trusted. This is the anatomy lane's dossier for wave A (10-multi-region.md §1.2, §1.3, §8); the machine-readable record, with every query and excerpt, is `dossier.json` beside this file. Nothing in the repository was changed. The method, limits and wording follow the forearm's (03-anatomy-evidence.md). An independent automated second review on 19 Oct 2026 corrected this dossier in place; what it changed and why is in §13 and in `secondReview` in `dossier.json`.

## 1. Method

**What was reviewed.** The seven upper-arm nodes of §1.2 (biceps, brachialis, the triceps group and its long, lateral and medial heads, the coracobrachialis), the four shipped claims on the biceps and brachialis, and the brachioradialis as an external member (home forearm, unchanged, no new content). Result: 20 new claims owned by `upper_arm`, 8 node-action rows (3 of them the forearm's frozen rows), 2 joint-action definitions, 29 new sources and 62 citations after the second review (the first pass had 28 and 59; the second review added two sources and four citations and removed one of each).

**How.** Web search only, as for the forearm: page fetches are refused by the network proxy, so each claim was checked against what the search returned (titles, URLs, excerpts and generated summaries). For each claim:

1. Search for references in the standard's order: NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy pages (here the Loyola University Chicago LUMEN dissector), Kenhub, Elsevier Complete Anatomy, Radiopaedia, IMAIOS. Two teaching sites outside that list were also used, TeachMeAnatomy and AnatomyZone, always beside a listed reference. The first pass also cited an open medical encyclopedia (DocCheck Flexikon) once; the second review removed it as a user-edited wiki (§13). Wikipedia was read and not cited.
2. Add each relied-on reference as a source keyed `<publisher>.<topic>` or `pmid.<number>`, with a note saying exactly what the search showed and what it could not confirm.
3. Cite it with a locator and, where the source is limited, a qualification (abstract only, acute EMG, search excerpt, location only).
4. Mark the claim `reviewed` only when the excerpts supported every sentence, with `reviewedAt: "2026-10-19"` and the note "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist." Appearance claims carry the forearm's inference wording.
5. A node is `reviewed` only when every function claim on it is, including a shipped one.

Every query and the excerpt relied on are recorded verbatim in `dossier.json` (`citations`, one per claim citation).

## 2. Limits

- **Excerpts, not full texts.** StatPearls showed only its introduction and parts of "Structure and Function". The two Kenhub videos were seen as descriptions or previews. Every study was seen as an abstract or a summary of one. Each citation says so.
- **Search summaries can misquote.** Function claims rest on three to five references each. One Elsevier summary said its own citation markers were garbled; its facts matched IMAIOS and are cited with that qualification. In the second review, three searches gave contradictory accounts of whether Elsevier's biceps entries list a shoulder action, so no claim now relies on that point.
- **Automated review.** "Reviewed" means an automated agent checked each sentence against web-search excerpts and generated summaries on 19 Oct 2026. Not the full texts, and not a clinician or anatomist. A human or full-text review is worth having before wave A's version is published, because publishing freezes reviewed claims.
- **Nothing here is hypertrophy evidence for an athlete.** The selectivity claims cite acute EMG, a modelled-force study and two small training studies. They say what was measured. None of them sets a credit weight. The training-study claim is held as a draft (§6).

## 3. The shipped claims this region reads

| Key | Shown on the upper-arm page? | Notes |
|---|---|---|
| `forearm:biceps.function` | Yes. The biceps' elbow-flexion and supination node actions rest on it. | Frozen. Single source (A50), as 03 §2 says. Corroborated this time by Elsevier, Kenhub, Loyola and TeachMeAnatomy. Adding sources to a frozen claim is the database lane's call. |
| `forearm:brachialis.function` | Yes. The brachialis' elbow-flexion node action rests on it. | Frozen. Single source (A51). Corroborated by Radiopaedia, Loyola, TeachMeAnatomy and Kenhub (German). |
| `forearm:biceps.appearance` | No: it speaks about the forearm. | Replaced on this page by `upper_arm.biceps.appearance`. |
| `forearm:brachialis.appearance` | No. | Replaced by `upper_arm.brachialis.appearance`. Its "may show at its sides" was only half confirmed this time (outer edge only). It is frozen and stays on the forearm page. |

The shipped claims do not cover the biceps' part at the shoulder, so a new function claim, `upper_arm.biceps.function`, says it.

## 4. Claims by node

"Sources" gives each source key with the locator cited. All are `reviewed` on 19 Oct 2026 except where marked.

| Node | Status | Claim | Kind · basis | Review | Sources (locator) |
|---|---|---|---|---|---|
| Biceps `upper_arm.biceps` | reviewed | `upper_arm.biceps.function` | function · established_anatomy | reviewed | kenhub.biceps_brachii (Function); loyola.biceps_brachii (Action); teachmeanatomy.arm_muscles (Biceps brachii: attachments and function); elsevier.biceps_brachii (Quick Facts: Origin; origins only); imaios.biceps_long_head (Function) |
|  |  | `upper_arm.biceps.appearance` | appearance · anatomical_inference | reviewed | teachmeanatomy.arm_muscles (the most superficial muscle of the front compartment); A51 (Introduction: deeper than the biceps); teachmeanatomy.brachialis (deep to the biceps) |
|  |  | `upper_arm.biceps.selectivity.1` | selectivity · experimental | reviewed | mdpi.biceps_curl_grips (Abstract: Results); A4 (Abstract: Results) |
|  |  | `upper_arm.biceps.selectivity.2` | selectivity · experimental | reviewed | pmid.11408907 (Abstract: Results and Conclusions); pmid.26535304 (Abstract: Results); bmc.long_head_biceps_scoping_review (Abstract: Results) |
|  |  | `upper_arm.biceps.variation.1` | variation · established_anatomy | reviewed | wiley.biceps_accessory_heads (Abstract) |
| Brachialis `upper_arm.brachialis` | reviewed | `upper_arm.brachialis.appearance` | appearance · anatomical_inference | reviewed | A51 (Introduction: deeper than the biceps; part of the hollow in front of the elbow); kenhub.brachialis_video (Video description: surface parts at its outer edge and lower end); teachmeanatomy.brachialis (deep to the biceps, floor of the hollow in front of the elbow) |
| Triceps `upper_arm.triceps` (group) | reviewed | `upper_arm.triceps.function` | function · established_anatomy | reviewed | statpearls.triceps (Introduction; Structure and Function); kenhub.triceps_brachii (Origins, insertion and function); loyola.triceps_brachii (Origin and action) |
|  |  | `upper_arm.triceps.appearance` | appearance · anatomical_inference | reviewed | radiopaedia.triceps_brachii (Summary and relations); kenhub.triceps_brachii_video (palpation of the heads) |
| TriLong `upper_arm.triceps_long` | reviewed | `upper_arm.triceps_long.function` | function · established_anatomy | reviewed | statpearls.triceps (Structure and Function: long head); kenhub.triceps_brachii (Function); imaios.triceps_long_head (Function); radiopaedia.triceps_brachii (Action); loyola.triceps_brachii (Action: the long head steadies the shoulder joint) |
|  |  | `upper_arm.triceps_long.appearance` | appearance · anatomical_inference | reviewed | kenhub.triceps_brachii_video (palpation of the heads); anatomyzone.triceps_lateral_head (Overview: surface and deep heads); statpearls.triceps (origin of the long head) |
|  |  | `upper_arm.triceps_long.selectivity.1` | selectivity · experimental | reviewed | aott.triceps_heads (Abstract: Results) |
|  |  | `upper_arm.triceps_long.selectivity.2` | selectivity · experimental | **draft** (§6) | pmid.35819335 (Abstract: Results); mdpi.triceps_fascicle_length (Abstract: Results and Conclusions) |
| TriLat `upper_arm.triceps_lateral` | reviewed | `upper_arm.triceps_lateral.function` | function · established_anatomy | reviewed | elsevier.triceps_lateral_head (Quick Facts: Origin, Insertion and Action); radiopaedia.triceps_brachii (Origin: lateral head); anatomyzone.triceps_lateral_head (Origin and action); statpearls.triceps (only the long head crosses the shoulder); imaios.triceps_long_head (Function: the long head is the only head that crosses the shoulder) |
|  |  | `upper_arm.triceps_lateral.appearance` | appearance · anatomical_inference | reviewed | radiopaedia.triceps_brachii (Origin: back and outer side of the bone); loyola.triceps_brachii (Origin: upper half of the back of the humerus); kenhub.triceps_brachii_video (palpation of the heads) |
|  |  | `upper_arm.triceps_lateral.selectivity.1` | selectivity · experimental | reviewed | aott.triceps_heads (Abstract: Results); elsevier.triceps_lateral_head (Origin and Insertion); elsevier.triceps_medial_head (Origin and Insertion) |
| TriMed `upper_arm.triceps_medial` | reviewed | `upper_arm.triceps_medial.function` | function · established_anatomy | reviewed | elsevier.triceps_medial_head (Origin, Insertion and Action; fibres to the elbow joint capsule); loyola.triceps_brachii (Action: draws back the elbow joint capsule); statpearls.triceps (the medial head has no shoulder action); viamedica.subanconeus (Abstract: Results and Conclusions) |
|  |  | `upper_arm.triceps_medial.appearance` | appearance · anatomical_inference | reviewed | radiopaedia.triceps_brachii (largely deep to the lateral head); kenhub.triceps_brachii_video (cannot be felt); pmid.16735585 (Abstract: Results); loyola.triceps_brachii (deep on the lower half of the back of the humerus); kenhub.triceps_brachii (Medial head: overlapped by the long and lateral heads) |
|  |  | `upper_arm.triceps_medial.selectivity.1` | selectivity · experimental | reviewed | as the lateral head's |
| CB `upper_arm.coracobrachialis` (adjacent) | reviewed | `upper_arm.coracobrachialis.function` | function · established_anatomy | reviewed | kenhub.coracobrachialis (Overview; Function); elsevier.coracobrachialis (Quick Facts: Origin, Insertion and Action); loyola.coracobrachialis (Action); teachmeanatomy.arm_muscles (Coracobrachialis: function) |
|  |  | `upper_arm.coracobrachialis.appearance` | appearance · anatomical_inference | reviewed | kenhub.coracobrachialis (Overview and palpation: border of the armpit); elsevier.coracobrachialis (Relations) |
| BR `forearm.br` (external) | reviewed (forearm) | none new | | | Credited as the forearm counts it; its `forearm:br.function` claim supports elbow flexion. |

Totals (new, owner `upper_arm`): 6 function, 7 appearance, 6 selectivity, 1 variation; 19 reviewed, 1 draft (unchanged by the second review, which reworded 12 statements and sent none to draft). Every node is `reviewed`: each node's function claims, shipped and new, are reviewed.

### The statements

- **Biceps, function:** "The biceps also crosses the shoulder: both heads start on the shoulder blade, the long head just above the shoulder socket and the short head on the coracoid process. Anatomy references list it as helping raise the arm forward (shoulder flexion), and those that rate that help call it weak."
- **Biceps, appearance:** "The biceps is the most superficial muscle on the front of the upper arm and lies over the brachialis, so it may contribute most of the front contour of the upper arm above the elbow crease. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Biceps, selectivity 1:** "Whether the way the palm faces changes how hard the biceps works in a curl is not settled. In a surface-EMG study of ten bodybuilders, the biceps was more active with the palm up than with the palm down or the thumb up while lifting, with no difference reported while lowering; in a surface-EMG study of 16 people making slow single elbow bends, its activity did not change between the three positions. Neither study measured growth."
- **Biceps, selectivity 2:** "Studies disagree on whether the biceps' long head works in shoulder movement at all. With the elbow braced straight, a wire-electrode study of ten shoulders recorded no activity in its long head during shoulder movement; a surface-EMG study of 13 healthy people found low long-head activity that rose when the arm was raised forward or out to the side. A scoping review of the long head concluded that its part in raising the arm is minimal in healthy shoulders. None of these studies measured growth."
- **Biceps, variation 1:** "Some people have one or more extra heads of the biceps. A review pooling 78 studies found them in a minority of arms, more often on one side only than on both and more often in men, and found that they usually cause no symptoms." (No rate is given, following the palmaris longus rule: the pooled figure is not true of everyone.)
- **Brachialis, appearance:** "The brachialis lies under the biceps on the front of the lower half of the upper arm and forms part of the floor of the hollow in front of the elbow. Most of it is hidden by the biceps; its outer edge and its lower end lie close to the surface, so it may contribute to the outer side of the lower upper arm beside the biceps. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Triceps, function:** "The triceps straightens the elbow; that is its main action. Its three heads, long, lateral and medial, end together on the point of the elbow (the olecranon of the ulna). Only the long head starts on the shoulder blade and crosses the shoulder; the other two start on the back of the upper-arm bone."
- **Triceps, appearance:** "The triceps lies on the back of the upper arm. Its long and lateral heads are at the surface and its medial head lies mostly under them, so together they may make up most of the back-of-arm contour. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Long head, function:** "The long head straightens the elbow with the other two heads. It is the only head that crosses the shoulder. It starts on the shoulder blade just below the shoulder socket, and references describe a small action there: it helps move the arm down and back (shoulder extension), and some also list drawing it toward the body (adduction). It also helps hold the top of the upper-arm bone in its socket."
- **Long head, appearance:** "The long head lies at the surface on the back of the upper arm, running from the shoulder blade just below the shoulder joint to the common tendon at the elbow, so it may contribute to the back-of-arm contour between them. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Long head, selectivity 1:** "In a study of ten adults straightening the elbow with the upper arm at five heights, from down by the side to straight overhead, surface EMG and a computer model estimated that the long head was the most active head and made the most force with the arm by the side, while the medial head made the most force with the arm at shoulder height or higher. That is short-term activity and modelled force in one small study, not growth."
- **Long head, selectivity 2 (draft):** "Two small training studies compared elbow extensions done with one arm overhead and the other down by the side. In 21 adults over 12 weeks, measured muscle volume rose more in the overhead arm, in the long head and also in the lateral and medial heads together; in nine novice women over six weeks, triceps thickness and strength rose in both arms, with no clear difference between them. These are group results from short studies, not a forecast for any one person, and they are not used to weight credit."
- **Lateral head, function:** "The lateral head straightens the elbow. It starts on the back and outer side of the upper-arm bone, above the groove for the radial nerve, and on the sheet of connective tissue on the outer side of the arm, and joins the common triceps tendon on the point of the elbow. It does not cross the shoulder."
- **Lateral head, appearance:** "The lateral head lies at the surface on the back of the upper arm toward the outer side, from the upper half of the upper-arm bone toward the elbow, so it may contribute to the outer part of the back-of-arm contour. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Lateral and medial heads, selectivity 1** (one claim on each node, the two head names swapped in the first sentence): "Both the lateral and the medial head start on the back of the upper-arm bone, end on the point of the elbow and cross only the elbow, so they share every action; this review found no study showing an ordinary exercise that works one of them without the other. In one study of ten adults, a computer model driven by surface EMG estimated more force from the medial head than from the lateral head with the arm at shoulder height or higher; that is short-term modelled force in one small study, not growth."
- **Medial head, function:** "The medial head straightens the elbow. It starts on the back of the upper-arm bone below the groove for the radial nerve, ends on the point of the elbow with the other two heads and does not cross the shoulder. Some of its deepest fibres attach to the capsule at the back of the elbow joint; an anatomy teaching reference says they draw the capsule back as the elbow straightens, but a dissection study of 18 elbows found that pulling on them pressed the capsule rather than drawing it back."
- **Medial head, appearance:** "The medial head lies mostly under the long and lateral heads on the lower half of the back of the upper-arm bone; one dissection study found that its muscle reaches closer to the elbow than theirs. It has little or no contour of its own, and one anatomy reference says it cannot be felt through the skin."
- **Coracobrachialis, function:** "Coracobrachialis raises the arm forward at the shoulder (flexion) and helps draw it toward the body (adduction). It runs from the coracoid process of the shoulder blade to the inner side of the upper-arm bone about halfway down, so it does not cross the elbow."
- **Coracobrachialis, appearance:** "Coracobrachialis is a slender muscle on the inner side of the upper arm near the armpit, behind the pectoralis major and on the inner side of the biceps and brachialis, so it has little or no contour of its own. It can be felt in the armpit, where with the upper-arm bone it forms the outer edge."

## 5. Node fields

| Node | Aliases | Layer (§1.2) and evidence | Visibility | databaseMuscle |
|---|---|---|---|---|
| Biceps | biceps | surface: supported | clear: the front compartment's most superficial muscle | `biceps_brachii` (shipped) |
| Brachialis | brachialis | deep, outcrop on the front view: supported (Kenhub: surface parts at its outer edge and lower end) | partial | `brachialis` (shipped) |
| Triceps (group) | triceps | —: a parent, neither drawn nor selectable | partial (mixed layers, as the forearm's groups) | none (the database holds the heads) |
| TriLong | long head of triceps, triceps long head | surface: supported | partial | `triceps_brachii_long_head` |
| TriLat | lateral head of triceps, triceps lateral head | surface: supported | partial | `triceps_brachii_lateral_head` |
| TriMed | medial head of triceps, triceps medial head | deep, outcrop on the back view: weakly supported after the second review. Radiopaedia says "largely deep" and Madsen found its muscle reaching further toward the elbow; Kenhub's article says it is overlapped by the other two heads and its video says it cannot be felt. DocCheck, the only source saying its lower part shows, was removed. Kept as §1.2 has it, flagged. | partial | `triceps_brachii_medial_head` |
| CB (adjacent) | coracobrachialis | deep: supported in part. It lies behind the pectoralis major and on the inner side of the biceps; Kenhub says it is felt in the armpit. | not_distinct | none (no canonical row) |

The three head names come from `shared/capabilityRank.ts`, the app's map of canonical muscle names. The database lane checks them.

**Location, what it does, shape note and caveats.** These are written in full in `dossier.json`. Directions are front and back, inner and outer, and toward the shoulder or the elbow. Deep target nodes (brachialis, medial head) say "little or no contour of their own". Every contour note says that visible shape also depends on neighbouring muscles, body fat and individual anatomy (the second review added it where it was missing: the triceps claim and node, the medial head's node). Second-review changes to node text: the biceps' "crosses the front of the shoulder" is now "crosses the shoulder"; the triceps' shape note is qualified ("May make up most of the back-of-arm contour, mostly through its long and lateral heads"); the long head's caveat names one study, not "studies"; the medial head's capsule action is "debated" and its shape note no longer says its lowest part "may show a little".

**Neutral text for the two frozen nodes (§1.3).** The region-relative words move from the node to the forearm's membership of it:

- Biceps, forearm membership caveats: "It is an upper-arm muscle and does not add forearm size." and "Shown only as another muscle that curls and palm-up turning load; not a forearm target."
- Biceps node, new shape note: "May contribute most of the front contour of the upper arm above the elbow crease, since it is the surface muscle there. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- Biceps node, new caveats: "Its two heads are counted as one muscle here; anatomy references describe their elbow and forearm actions together." (the second review dropped "they end in one tendon": dissection studies found the lower tendon in two parts in many arms); weak and contested help at the shoulder, not counted (stands only if the shoulder-flexion row stays out, §6); some people have an extra head.
- Brachialis, forearm membership caveats: "It is not a forearm muscle." and "Shown only as another muscle that curls load; not a forearm target."
- Brachialis node, new shape note: "Mostly covered by the biceps, so most of it has little or no contour of its own. Its outer edge and lower end lie close to the surface and may add to the outer side of the lower upper arm, beside the biceps. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."

The brachioradialis is listed as an external member with no new fields. A suggested caveat for the upper arm's listing of it: "A forearm muscle shown here because curls load it; it is credited as the forearm counts it."

## 6. Node actions

| Node | Actions (role) | Claim |
|---|---|---|
| Biceps | elbow.flexion (prime), forearm.supination (prime) | `forearm:biceps.function` (frozen forearm rows) |
| Brachialis | elbow.flexion (prime) | `forearm:brachialis.function` (frozen forearm row) |
| TriLong | elbow.extension (prime), shoulder.extension (assist) | `upper_arm:upper_arm.triceps_long.function` |
| TriLat | elbow.extension (prime); mappings `allocation: "shared"` with TriMed | `upper_arm:upper_arm.triceps_lateral.function` |
| TriMed | elbow.extension (prime); mappings `allocation: "shared"` with TriLat | `upper_arm:upper_arm.triceps_medial.function` |
| CB | shoulder.flexion (prime: its main action, not a main shoulder flexor) | `upper_arm:upper_arm.coracobrachialis.function` |

That is 8 rows: 5 new and 3 frozen. The brachioradialis' elbow.flexion row is the forearm's and is shown, not declared.

**Left out on purpose:**

- **Biceps × shoulder.flexion.** The references that rate it call it weak (Kenhub, Loyola, IMAIOS). EMG studies disagree, and a scoping review calls its part minimal. The forearm's rule for weak extras (03 §6: FCU and ECRL at the elbow) leaves such a row out so that suggestions are not driven by it. It is said in the claim and a caveat instead. The row is ready (`assist`, on `upper_arm:upper_arm.biceps.function`) if the review prefers to list it. **Second review: the lane must decide this.** Only prime rows drive suggestions (`client/src/lib/specialization/recommendations.ts:288`), so an assist row would not; and without it no mappable upper-arm member performs `shoulder.flexion`, because the coracobrachialis is adjacent and mappings refuse adjacent nodes. Either list the row as assist, or record a §1.2 deviation removing `shoulder.flexion` from the upper arm's region actions.
- **Triceps (parent) × elbow.extension (second review, undecided).** §1.2 makes the triceps kind `muscle`, role `group`; the shared test "gives every muscle a main action, adjacent muscles aside" (`regionContent.test.ts`) requires a prime node action on every non-adjacent node of kind `muscle`, groups included (the forearm's groups pass because they are kind `compartment`). As drafted the upper arm fails it. Either add `upper_arm.triceps × elbow.extension (prime)` on `upper_arm:upper_arm.triceps.function`, which supports it, or the platform lane exempts role `group`. The deltoid, pectoralis major and trapezius parents raise the same question.
- **Long head and coracobrachialis × shoulder adduction.** Adduction is not an upper-arm region action. It is said in their claims.
- **Medial head and the elbow capsule.** There is no action id for it, it moves no load, and the second review found a dissection study disputing that it pulls the capsule back.

**Held as draft: `upper_arm.triceps_long.selectivity.2`.** The excerpts support each sentence. The claim reports measured muscle size after training. §8 says selectivity claims are never growth findings, while §1.2 sends the long head's regional-growth findings to selectivity claims. The owner or the adversarial review decides whether, and in what words, the page shows it. A draft selectivity claim does not hold the node back.

## 7. New joint actions

Both actions are shared with other regions. Second review: wave 0 has already added both to `shared/specialization/actions/joints.ts` with exactly this label and description, under the joint "Shoulder", so nothing is to be added. The wording, for reference:

- `shoulder.flexion` · Shoulder (glenohumeral joint) · "Shoulder flexion": "Raises the arm forward and up in front of the body."
- `shoulder.extension` · Shoulder (glenohumeral joint) · "Shoulder extension": "Brings the arm down and back from in front of the body, and on behind it."

## 8. Single-source claims

- **New function claims:** none. Each rests on three to five references.
- **Shipped function claims reused:** `forearm:biceps.function` (A50) and `forearm:brachialis.function` (A51). Corroboration was found (§3).
- **Other single-source claims:** `upper_arm.biceps.variation.1` rests on one meta-analysis, and `upper_arm.triceps_long.selectivity.1` on one ten-person study.

## 9. Disagreements and how the wording handles them

- **Biceps at the shoulder:** weak (Kenhub, Loyola), listed (TeachMeAnatomy) or absent (Elsevier); EMG studies disagree. The function claim says "weak help" and that one reference lists none. A selectivity claim states the EMG disagreement. There is no node action.
- **Biceps and forearm position:** Coratella 2023 found more biceps activity palm up while lifting; Kleiber 2015 (A4) found no change. Both are stated.
- **The long head steadying the shoulder:** with the arm by the side (StatPearls, IMAIOS) or in abduction (Radiopaedia). The claim names no arm position.
- **Long-head shoulder adduction:** listed by Kenhub and IMAIOS, not by Radiopaedia. The claim attributes it to "references", and it gets no node action.
- **The medial head at the surface:** after the second review removed DocCheck, no cited source says any of it shows; Radiopaedia says "largely" deep, Madsen found its muscle reaching further toward the elbow, Kenhub says it is overlapped and cannot be felt. The claim says what these say; the outcrop is weakly supported (§5).
- **The medial head and the elbow capsule (second review):** Loyola says it retracts the capsule on extension; Tubbs, Oakes and Salter (2006, 18 elbows) found that pulling on these fibres compressed the capsule and did not retract it. The claim states both.
- **The biceps at the shoulder, Elsevier (second review):** three searches disagreed on whether Elsevier's biceps entries list assisting shoulder flexion, so the claim no longer says that a reference lists none. Radiopaedia's summary, as one search showed it, gives the long head abduction and the short head adduction and flexion; not cited, since its wording was cut off.
- **The lower biceps tendon (second review, not cited):** Eames et al. (2007) found it in two distinct parts, one from each head, in 10 of 17 cadaver elbows; Cho et al. (2011) in 12 of 25. The biceps caveat no longer says the heads end in one tendon. No source shows the heads differing in action, so the single biceps node stands.
- **The triceps insertion (second review):** StatPearls and Elsevier describe one common tendon; Madsen found the medial head's own tendon deep to it, joining at the olecranon. The claims now say the heads "end together on the point of the elbow".
- **Coracobrachialis:** Elsevier lists adduction first, while Loyola and TeachMeAnatomy call it weak, so the claim says "helps draw it toward the body". For its insertion, the claim says "about halfway down" where Elsevier gives the middle third and Loyola the upper half.
- **Brachialis edges:** the shipped forearm claim says "at its sides"; only the outer edge was confirmed this time. The new text says "outer edge".
- **Arm-position training studies:** Maeo 2023 found more gain overhead in every head; Stasinaki 2018 found no difference. Both are stated, in a draft.
- **Seen but not cited:** Akima 2021 (PLOS One, PMC8174684), isometric EMG of the three heads, whose abstract was cut off mid-result (the second review saw a little more: no difference between the heads except medial against lateral at the lowest force at 60 degrees, then cut off). Also an older force-level recruitment finding, seen only second-hand. Second review: Villalba et al. 2024 (push-downs; long-head EMG highest with a palm-up handle, no lateral-head result shown), a candidate long-head selectivity claim for the lane.

## 10. Unconfirmed bibliographic details

- **aott.triceps_heads** (Kholinne 2018): DOI now given by the second review's search (10.1016/j.aott.2018.02.005); PubMed id and co-authors not confirmed.
- **pmid.11408907** (Levy 2001): journal, volume and pages now confirmed (Journal of Shoulder and Elbow Surgery 10(3):250-255); co-authors from reference lists only.
- **wiley.biceps_accessory_heads:** authors not shown; journal inferred from the DOI prefix.
- **bmc.long_head_biceps_scoping_review:** volume and article number now confirmed (24:232).
- **pmid.16735585** (Madsen 2006): PubMed id inferred from a Weill Cornell record.
- **statpearls.triceps:** authors beyond the editor not shown.
- **mdpi.triceps_fascicle_length and mdpi.biceps_curl_grips:** author lists not shown.
- **pmid.35819335:** participants' training status not confirmed.
- **The Kenhub videos:** descriptions only.
- **elsevier.triceps_medial_head:** the summary was partly garbled.
- **The Loyola pages:** titles and dates not shown; the second review saw the same text on several mirrors.
- **elsevier.biceps_brachii:** searches disagreed on whether it lists a shoulder action; cited for the origins only.
- **imaios.biceps_long_head** (added by the second review): one search summary only.
- **viamedica.subanconeus** (added by the second review): abstract via search summaries; the PubMed id 16783731 came from a reference list and is not confirmed, so the key is not a pmid.
- **mdpi.triceps_fascicle_length:** one summary said one of the nine women did not finish; not confirmed.

## 11. Deviations from §1.2

**None recorded.** Each §1.2 row was checked against the sources (two questions the second review raised are in §6 and §12):

- **Ids, names, kinds, roles and parents:** no contradiction.
- **Layers and outcrops:** supported, the medial head with a disagreement on palpability and the coracobrachialis in part (§5).
- **"The lateral and medial heads share every action":** supported. Kholinne's modelled force difference by arm height is acute and changes no action.
- **"The biceps stays one node":** supported. Its heads differ only at the shoulder, where its role is weak.
- **Region actions:** each has a performer except the biceps' weak shoulder flexion, which is left out (§6). Second review: that leaves `shoulder.flexion` with no mappable upper-arm member, since its only declared performer, the coracobrachialis, is adjacent. Not a recorded deviation yet; the lane decides (§6).
- **The brachioradialis external:** meets the externals rule.

One observation lies outside §1.2. The forearm's anconeus carries `catalogMuscleKey: "triceps"`, which is the upper arm's catalog key. Region catalog keys are explicit (§1.1), so this may be harmless, but the registry lane should look.

## 12. Open issues

1. The draft long-head training claim needs a policy decision (§6).
2. The biceps' shoulder-flexion row: leave it out (recommended) or list it as `assist` (§6).
3. Human or full-text review before wave A's version is published; the StatPearls triceps article and the abstract-only studies first.
4. Whether frozen claims may gain sources: if they may, the database lane can add the corroboration found for `forearm:biceps.function` and `forearm:brachialis.function`.
5. (Second review) The triceps parent: a prime `elbow.extension` row, or a platform exemption for role `group` in the "every muscle a main action" test (§6).
6. (Second review) The medial head's back-view outcrop is weakly supported; keep it small and settle it with a full-text or human review.
7. (Second review) The frozen `forearm:brachialis.appearance` says "may show at its sides"; only the outer side was confirmed again.

## 13. Second review (19 Oct 2026)

**What this is.** An automated second review by a separate AI agent, with the same tools and the same limits as the first pass: web search only, page fetches refused, and search results that are generated summaries and can misquote. It looked for errors and corrected the dossier in place. It is not peer review, and it is not a review by a clinician or an anatomist; a human or full-text review is still worth having before wave A's version is published.

**What it did.** Checked every reviewed claim sentence by sentence against the excerpts in `citations`; re-searched, with its own queries, 5 of the 6 new function claims (biceps, long, lateral and medial heads, coracobrachialis; the triceps group's claim was corroborated by the same searches), all 6 selectivity claims and the variation claim, plus the brachialis and medial-head appearance claims (28 searches, each recorded with its excerpt and verdict in `secondReview.queries`); checked every source's key, URL, title, evidence type and note; and checked node fields, node actions, layers and outcrops against §1.2.

**Result.** 20 claims: 19 reviewed, 1 draft, as before. 12 statements reworded so that each sentence says no more than its excerpts; none sent to draft. Two sources added (`imaios.biceps_long_head`, `viamedica.subanconeus`), one removed (`doccheck.triceps_brachii`), four citations added and one removed. Independent results agreed with every re-searched claim except two sentences, both resolved in the wording: the medial head pulling back the elbow capsule (a dissection study disputes it) and the claim that a quick reference lists no shoulder action for the biceps (searches disagreed).

**Changes** (each with its reason and evidence in `secondReview.changes`):

- upper_arm.biceps.function: 'crosses the front of the shoulder' became 'crosses the shoulder'; 'Anatomy references describe it as giving weak help ...; one quick reference lists no shoulder action for it at all' became 'Anatomy references list it as helping raise the arm forward (shoulder flexion), and those that rate that help call it weak.' Elsevier is now cited for the origins only; IMAIOS (long head of biceps) added. *Why:* No excerpt says 'front'; TeachMeAnatomy lists shoulder flexion without calling it weak, so 'references describe weak help' overstated; three independent searches disagreed on whether Elsevier lists a shoulder action, so the 'lists none' clause could not be kept.
- upper_arm.biceps.appearance and the biceps node shapeNote: 'between the shoulder and the elbow crease' became 'above the elbow crease'. *Why:* The excerpts give its layer in the front compartment, not a contour reaching the shoulder; the sentence said more than they do.
- upper_arm.biceps.selectivity.2: 'whether the biceps works in shoulder movement' became 'whether the biceps' long head works ...'. *Why:* Both EMG studies measured the long head (Chalmers found the short head did not change).
- upper_arm.brachialis.appearance: 'forms the floor of the hollow in front of the elbow' became 'forms part of the floor'; 'its outer edge near the elbow lies close to the surface' became 'its outer edge and its lower end lie close to the surface'. Same change in the brachialis node shapeNote. *Why:* A51 and an independent search say 'part of' the floor; Kenhub names two surface parts, the lateral border and the distal end, not one 'outer edge near the elbow'.
- upper_arm.triceps.function, both shared-head selectivity claims and the medial-head function: 'join in one tendon' / 'end in the common tendon' became 'end (together) on the point of the elbow'. *Why:* Madsen 2006, already in the dossier, found the medial head's own tendon deep to the common one, confluent at the olecranon; 'end together on the point of the elbow' is true on every source.
- upper_arm.triceps.appearance: removed 'which head shapes which part of it cannot be read exactly from the surface' and added the standard sentence on neighbouring muscles, body fat and individual anatomy. *Why:* No excerpt supports the removed clause; every other contour claim carries the standard qualification.
- upper_arm.triceps_long.function: shoulder adduction is now 'some also list drawing it toward the body (adduction)' instead of being given to all references; node whatItDoes says the same. *Why:* Kenhub and IMAIOS list adduction; Radiopaedia lists extension only.
- upper_arm.triceps_long.selectivity.2 (still draft): Stasinaki's result is 'rose in both arms, with no clear difference between them' instead of 'rose similarly'; the review note records the second review's agreement. *Why:* The abstract reports increases in both arms and similar area change, with no between-arm test seen; one summary said one of the nine women did not finish.
- upper_arm.triceps_lateral.function: added IMAIOS ('the long head is the only head that crosses the shoulder') as a source for 'It does not cross the shoulder'. *Why:* The StatPearls excerpt cited for that sentence speaks of the medial head; the lateral-head statement was an inference from the origin.
- upper_arm.triceps_lateral.selectivity.1 and upper_arm.triceps_medial.selectivity.1: rewritten; removed 'The atlas counts the two heads' work together and does not split it'. *Why:* That sentence is a product accounting choice inside an experimental claim (brief §2: mark accounting choices distinctly); the node caveats already say it. The rest is reordered so the anatomy comes first and the 'no study found' sentence is plainly this review's search result.
- upper_arm.triceps_medial.function: 'Some of its fibres attach to the capsule ... and pull it back as the elbow straightens' became a statement of both views; source viamedica.subanconeus added. The node's whatItDoes now says what the fibres do 'is debated'. *Why:* An independent search found a dissection study (Tubbs, Oakes and Salter 2006, 18 elbows) in which pulling on these fibres compressed the capsule and did not retract it; the authors concluded they do not retract it.
- upper_arm.triceps_medial.appearance: removed the DocCheck Flexikon citation and source; rewrote the claim to what the remaining sources say ('one dissection study found that its muscle reaches closer to the elbow'; 'one anatomy reference says it cannot be felt'); added Kenhub's article ('overlapped by the long and lateral head'). Node shapeNote, caveat, outcropSupported and surfaceVisibilityReason changed to match. *Why:* DocCheck Flexikon is a user-edited medical wiki, outside the standard's list and in the class the standard never cites (Wikipedia); it was the only source for 'its lower part shows', and an independent search found no citable reference for that.
- Every citation with a null qualification (Kenhub, Radiopaedia, Elsevier, AnatomyZone on several claims) now carries 'Seen through web-search excerpts of the page, not the full text.' *Why:* Every source in this dossier was seen only through search excerpts; a null qualification read as if the page had been read.
- Biceps node caveat: 'they end in one tendon and share their actions' became 'counted as one muscle here; anatomy references describe their elbow and forearm actions together'. Biceps whatItDoes: 'front of the shoulder, where it gives only weak help' became 'the shoulder, where references describe only weak help'. *Why:* Dissection studies found the lower biceps tendon in two distinct parts in many arms; the action wording now matches the corrected function claim.
- Triceps node shapeNote: 'Together its three heads make up most of the back of the upper arm' became 'May make up most of the back-of-arm contour, mostly through its long and lateral heads at the surface', with the standard qualification; the unsupported 'cannot be read exactly' sentence removed. *Why:* Shape notes must be qualified; the medial head lies mostly deep.
- Long-head node caveat: 'Short-term studies find' became 'One short-term study found'. *Why:* Only Kholinne 2018 is cited for it.
- Sources: aott.triceps_heads gains its DOI; pmid.11408907 its journal, volume and pages; bmc.long_head_biceps_scoping_review its volume and article number; notes on several sources record what the second review saw. New sources imaios.biceps_long_head and viamedica.subanconeus; doccheck.triceps_brachii removed. *Why:* Independent searches confirmed details the first pass listed as unconfirmed, and two claims needed new support.
- nodeActionsLeftOut: the biceps' shoulder-flexion reason now states two facts the lane must weigh; a prepared, undecided row for the triceps parent (elbow.extension, prime) added. *Why:* Only prime rows drive suggestions (recommendations.ts:288), and without the biceps row no mappable upper-arm member performs shoulder.flexion (the coracobrachialis is adjacent). The shared test 'gives every muscle a main action, adjacent muscles aside' would fail on the triceps, which §1.2 makes kind 'muscle', role 'group'.
- actions: noted that shoulder.flexion and shoulder.extension already exist in shared/specialization/actions/joints.ts with this exact wording (joint 'Shoulder'). *Why:* Wave 0 has landed them; the dossier described them as still to be added.

**Copy checks.** No claim, node text, locator or qualification contains a percentage, "per cent", a growth promise, the backend vendor, "table", "left" or "right". No Wikipedia citation remains; the one wiki-type source (DocCheck Flexikon) was removed. Source titles name reference publishers only, as the forearm's do.

**Left for the anatomy lane:**

- Biceps x shoulder.flexion: list it as assist, or record a §1.2 deviation removing shoulder.flexion from the upper arm's region actions; as drafted, no mappable upper-arm member performs that action.
- Triceps parent: add a prime elbow.extension node action, or exempt role 'group' from the shared 'every muscle a main action' test (the same question arises for the deltoid, pectoralis major and trapezius).
- upper_arm.triceps_long.selectivity.2 stays draft: the §1.2 / §8 policy question is the owner's or the adversarial review's.
- Medial-head back-view outcrop: weakly supported once DocCheck was removed; keep it small, and settle it with a full-text or human review.
- Frozen forearm:brachialis.appearance says 'may show at its sides'; the second review again found only the outer side confirmed. The claim is frozen; the lane may want a note.
- Villalba 2024 (palm-up handle raised long-head EMG in push-downs) is a candidate long-head selectivity claim, abstract only.
