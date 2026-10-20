# Specialization atlas: upper-arm anatomy and its evidence (19 Oct 2026)

What the upper-arm content says, what it rests on, and how far that review can be trusted. This is the anatomy lane's dossier for wave A (10-multi-region.md §1.2, §1.3, §8); the machine-readable record, with every query and excerpt, is `dossier.json` beside this file. Nothing in the repository was changed. The method, limits and wording follow the forearm's (03-anatomy-evidence.md).

## 1. Method

**What was reviewed.** The seven upper-arm nodes of §1.2 (biceps, brachialis, the triceps group and its long, lateral and medial heads, the coracobrachialis), the four shipped claims on the biceps and brachialis, and the brachioradialis as an external member (home forearm, unchanged, no new content). Result: 20 new claims owned by `upper_arm`, 8 node-action rows (3 of them the forearm's frozen rows), 2 joint-action definitions, 28 new sources, 59 citations.

**How.** Web search only, as for the forearm: page fetches are refused by the network proxy, so each claim was checked against what the search returned (titles, URLs, excerpts and generated summaries). For each claim:

1. Search for references in the standard's order: NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy pages (here the Loyola University Chicago LUMEN dissector), Kenhub, Elsevier Complete Anatomy, Radiopaedia, IMAIOS. Two teaching sites outside that list were also used, TeachMeAnatomy and AnatomyZone, and once an open medical encyclopedia (DocCheck Flexikon), always beside a listed reference. Wikipedia was read and not cited.
2. Add each relied-on reference as a source keyed `<publisher>.<topic>` or `pmid.<number>`, with a note saying exactly what the search showed and what it could not confirm.
3. Cite it with a locator and, where the source is limited, a qualification (abstract only, acute EMG, search excerpt, location only).
4. Mark the claim `reviewed` only when the excerpts supported every sentence, with `reviewedAt: "2026-10-19"` and the note "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist." Appearance claims carry the forearm's inference wording.
5. A node is `reviewed` only when every function claim on it is, including a shipped one.

Every query and the excerpt relied on are recorded verbatim in `dossier.json` (`citations`, one per claim citation).

## 2. Limits

- **Excerpts, not full texts.** StatPearls showed only its introduction and parts of "Structure and Function". The two Kenhub videos were seen as descriptions or previews. Every study was seen as an abstract or a summary of one. Each citation says so.
- **Search summaries can misquote.** Function claims rest on three to five references each. One Elsevier summary said its own citation markers were garbled; its facts matched IMAIOS and are cited with that qualification.
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
| Biceps `upper_arm.biceps` | reviewed | `upper_arm.biceps.function` | function · established_anatomy | reviewed | kenhub.biceps_brachii (Function); loyola.biceps_brachii (Action); teachmeanatomy.arm_muscles (Biceps brachii: attachments and function); elsevier.biceps_brachii (Quick Facts: Origin and Action; lists no shoulder action) |
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
| TriLat `upper_arm.triceps_lateral` | reviewed | `upper_arm.triceps_lateral.function` | function · established_anatomy | reviewed | elsevier.triceps_lateral_head (Quick Facts: Origin, Insertion and Action); radiopaedia.triceps_brachii (Origin: lateral head); anatomyzone.triceps_lateral_head (Origin and action); statpearls.triceps (only the long head crosses the shoulder) |
|  |  | `upper_arm.triceps_lateral.appearance` | appearance · anatomical_inference | reviewed | radiopaedia.triceps_brachii (Origin: back and outer side of the bone); loyola.triceps_brachii (Origin: upper half of the back of the humerus); kenhub.triceps_brachii_video (palpation of the heads) |
|  |  | `upper_arm.triceps_lateral.selectivity.1` | selectivity · experimental | reviewed | aott.triceps_heads (Abstract: Results); elsevier.triceps_lateral_head (Origin and Insertion); elsevier.triceps_medial_head (Origin and Insertion) |
| TriMed `upper_arm.triceps_medial` | reviewed | `upper_arm.triceps_medial.function` | function · established_anatomy | reviewed | elsevier.triceps_medial_head (Origin, Insertion and Action; fibres to the elbow joint capsule); loyola.triceps_brachii (Action: draws back the elbow joint capsule); statpearls.triceps (the medial head has no shoulder action) |
|  |  | `upper_arm.triceps_medial.appearance` | appearance · anatomical_inference | reviewed | radiopaedia.triceps_brachii (largely deep to the lateral head); kenhub.triceps_brachii_video (cannot be felt); pmid.16735585 (Abstract: Results); doccheck.triceps_brachii (Medial head); loyola.triceps_brachii (deep on the lower half of the back of the humerus) |
|  |  | `upper_arm.triceps_medial.selectivity.1` | selectivity · experimental | reviewed | as the lateral head's |
| CB `upper_arm.coracobrachialis` (adjacent) | reviewed | `upper_arm.coracobrachialis.function` | function · established_anatomy | reviewed | kenhub.coracobrachialis (Overview; Function); elsevier.coracobrachialis (Quick Facts: Origin, Insertion and Action); loyola.coracobrachialis (Action); teachmeanatomy.arm_muscles (Coracobrachialis: function) |
|  |  | `upper_arm.coracobrachialis.appearance` | appearance · anatomical_inference | reviewed | kenhub.coracobrachialis (Overview and palpation: border of the armpit); elsevier.coracobrachialis (Relations) |
| BR `forearm.br` (external) | reviewed (forearm) | none new | | | Credited as the forearm counts it; its `forearm:br.function` claim supports elbow flexion. |

Totals (new, owner `upper_arm`): 6 function, 7 appearance, 6 selectivity, 1 variation; 19 reviewed, 1 draft. Every node is `reviewed`: each node's function claims, shipped and new, are reviewed.

### The statements

- **Biceps, function:** "The biceps also crosses the front of the shoulder: both heads start on the shoulder blade, the long head just above the shoulder socket and the short head on the coracoid process. Anatomy references describe it as giving weak help raising the arm forward (shoulder flexion); one quick reference lists no shoulder action for it at all."
- **Biceps, appearance:** "The biceps is the most superficial muscle on the front of the upper arm and lies over the brachialis, so it may contribute most of the front contour of the upper arm between the shoulder and the elbow crease. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Biceps, selectivity 1:** "Whether the way the palm faces changes how hard the biceps works in a curl is not settled. In a surface-EMG study of ten bodybuilders, the biceps was more active with the palm up than with the palm down or the thumb up while lifting, with no difference reported while lowering; in a surface-EMG study of 16 people making slow single elbow bends, its activity did not change between the three positions. Neither study measured growth."
- **Biceps, selectivity 2:** "Studies disagree on whether the biceps works in shoulder movement at all. With the elbow braced straight, a wire-electrode study of ten shoulders recorded no activity in its long head during shoulder movement; a surface-EMG study of 13 healthy people found low long-head activity that rose when the arm was raised forward or out to the side. A scoping review of the long head concluded that its part in raising the arm is minimal in healthy shoulders. None of these studies measured growth."
- **Biceps, variation 1:** "Some people have one or more extra heads of the biceps. A review pooling 78 studies found them in a minority of arms, more often on one side only than on both and more often in men, and found that they usually cause no symptoms." (No rate is given, following the palmaris longus rule: the pooled figure is not true of everyone.)
- **Brachialis, appearance:** "The brachialis lies under the biceps on the front of the lower half of the upper arm and forms the floor of the hollow in front of the elbow. Most of it is hidden by the biceps; its outer edge near the elbow lies close to the surface, so it may contribute to the outer side of the lower upper arm beside the biceps. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Triceps, function:** "The triceps straightens the elbow; that is its main action. Its three heads, long, lateral and medial, join in one tendon on the point of the elbow (the olecranon of the ulna). Only the long head starts on the shoulder blade and crosses the shoulder; the other two start on the back of the upper-arm bone."
- **Triceps, appearance:** "The triceps lies on the back of the upper arm. Its long and lateral heads are at the surface and its medial head lies mostly under them, so together they may make up most of the back-of-arm contour; which head shapes which part of it cannot be read exactly from the surface."
- **Long head, function:** "The long head straightens the elbow with the other two heads. It is the only head that crosses the shoulder: it starts on the shoulder blade just below the shoulder socket, and references describe a small action there, helping move the arm down and back (shoulder extension) and toward the body (adduction). It also helps hold the top of the upper-arm bone in its socket."
- **Long head, appearance:** "The long head lies at the surface on the back of the upper arm, running from the shoulder blade just below the shoulder joint to the common tendon at the elbow, so it may contribute to the back-of-arm contour between them. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Long head, selectivity 1:** "In a study of ten adults straightening the elbow with the upper arm at five heights, from down by the side to straight overhead, surface EMG and a computer model estimated that the long head was the most active head and made the most force with the arm by the side, while the medial head made the most force with the arm at shoulder height or higher. That is short-term activity and modelled force in one small study, not growth."
- **Long head, selectivity 2 (draft):** "Two small training studies compared elbow extensions done with one arm overhead and the other down by the side. In 21 adults over 12 weeks, measured muscle volume rose more in the overhead arm, in the long head and also in the lateral and medial heads together; in nine novice women over six weeks, triceps thickness and strength rose similarly in both arms. These are group results from short studies, not a forecast for any one person, and they are not used to weight credit."
- **Lateral head, function:** "The lateral head straightens the elbow. It starts on the back and outer side of the upper-arm bone, above the groove for the radial nerve, and on the sheet of connective tissue on the outer side of the arm, and joins the common triceps tendon on the point of the elbow. It does not cross the shoulder."
- **Lateral head, appearance:** "The lateral head lies at the surface on the back of the upper arm toward the outer side, from the upper half of the upper-arm bone toward the elbow, so it may contribute to the outer part of the back-of-arm contour. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- **Lateral and medial heads, selectivity 1** (one claim on each node, the two head names swapped): "This review found no study showing an ordinary exercise that loads the lateral head apart from the medial head. Both start on the back of the upper-arm bone, end in the common tendon at the point of the elbow and cross only the elbow, so they share every action. In one study of ten adults, a computer model driven by surface EMG estimated more force from the medial head than from the lateral head with the arm at shoulder height or higher; that is short-term modelled force, not growth. The atlas counts the two heads' work together and does not split it."
- **Medial head, function:** "The medial head straightens the elbow. It starts on the back of the upper-arm bone below the groove for the radial nerve, joins the common tendon on the point of the elbow and does not cross the shoulder. Some of its fibres attach to the capsule at the back of the elbow joint and pull it back as the elbow straightens."
- **Medial head, appearance:** "The medial head lies mostly under the long and lateral heads on the lower half of the back of the upper-arm bone, and its muscle reaches closer to the elbow than theirs. It has little or no contour of its own; references differ on whether its lowest part shows or can be felt just above the elbow."
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
| TriMed | medial head of triceps, triceps medial head | deep, outcrop on the back view: supported on balance. Radiopaedia says "largely deep", Madsen found it reaching further toward the elbow, DocCheck says only its lower part shows. Kenhub's video says it cannot be felt. | partial | `triceps_brachii_medial_head` |
| CB (adjacent) | coracobrachialis | deep: supported in part. It lies behind the pectoralis major and on the inner side of the biceps; Kenhub says it is felt in the armpit. | not_distinct | none (no canonical row) |

The three head names come from `shared/capabilityRank.ts`, the app's map of canonical muscle names. The database lane checks them.

**Location, what it does, shape note and caveats.** These are written in full in `dossier.json`. Directions are front and back, inner and outer, and toward the shoulder or the elbow. Deep target nodes (brachialis, medial head) say "little or no contour of their own". Every contour note says that visible shape also depends on neighbouring muscles, body fat and individual anatomy.

**Neutral text for the two frozen nodes (§1.3).** The region-relative words move from the node to the forearm's membership of it:

- Biceps, forearm membership caveats: "It is an upper-arm muscle and does not add forearm size." and "Shown only as another muscle that curls and palm-up turning load; not a forearm target."
- Biceps node, new shape note: "May contribute most of the front contour of the upper arm, between the shoulder and the elbow crease, since it is the surface muscle there. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."
- Biceps node, new caveats: one muscle with two heads that share their elbow and forearm actions; weak and contested help at the shoulder, not counted; some people have an extra head.
- Brachialis, forearm membership caveats: "It is not a forearm muscle." and "Shown only as another muscle that curls load; not a forearm target."
- Brachialis node, new shape note: "Mostly covered by the biceps, so most of it has little or no contour of its own. Its outer edge near the elbow lies close to the surface and may add to the outer side of the lower upper arm, beside the biceps. Visible shape also depends on neighbouring muscles, body fat and individual anatomy."

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

- **Biceps × shoulder.flexion.** The references that list it call it weak (Kenhub, Loyola), and Elsevier lists no shoulder action. EMG studies disagree, and a scoping review calls its part minimal. The forearm's rule for weak extras (03 §6: FCU and ECRL at the elbow) leaves such a row out so that suggestions are not driven by it. It is said in the claim and a caveat instead. The row is ready (`assist`, on `upper_arm:upper_arm.biceps.function`) if the review prefers to list it.
- **Long head and coracobrachialis × shoulder adduction.** Adduction is not an upper-arm region action. It is said in their claims.
- **Medial head pulling back the elbow capsule.** There is no action id for it, and it moves no load.

**Held as draft: `upper_arm.triceps_long.selectivity.2`.** The excerpts support each sentence. The claim reports measured muscle size after training. §8 says selectivity claims are never growth findings, while §1.2 sends the long head's regional-growth findings to selectivity claims. The owner or the adversarial review decides whether, and in what words, the page shows it. A draft selectivity claim does not hold the node back.

## 7. New joint actions

Both actions are shared with other regions. Wave 0 adds them to `shared/specialization/actions/`, so this is proposed wording, in the forearm's style:

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
- **The medial head at the surface:** sources differ (§5). The claim and a caveat say so.
- **Coracobrachialis:** Elsevier lists adduction first, while Loyola and TeachMeAnatomy call it weak, so the claim says "helps draw it toward the body". For its insertion, the claim says "about halfway down" where Elsevier gives the middle third and Loyola the upper half.
- **Brachialis edges:** the shipped forearm claim says "at its sides"; only the outer edge was confirmed this time. The new text says "outer edge".
- **Arm-position training studies:** Maeo 2023 found more gain overhead in every head; Stasinaki 2018 found no difference. Both are stated, in a draft.
- **Seen but not cited:** Akima 2021 (PLOS One, PMC8174684), isometric EMG of the three heads, whose abstract was cut off mid-result. Also an older force-level recruitment finding, seen only second-hand.

## 10. Unconfirmed bibliographic details

- **aott.triceps_heads** (Kholinne 2018): DOI, PubMed id and co-authors not confirmed.
- **pmid.11408907** (Levy 2001): journal and authors not confirmed.
- **wiley.biceps_accessory_heads:** authors not shown; journal inferred from the DOI prefix.
- **bmc.long_head_biceps_scoping_review:** volume and article number not shown.
- **pmid.16735585** (Madsen 2006): PubMed id inferred from a Weill Cornell record.
- **statpearls.triceps:** authors beyond the editor not shown.
- **mdpi.triceps_fascicle_length and mdpi.biceps_curl_grips:** author lists not shown.
- **pmid.35819335:** participants' training status not confirmed.
- **The Kenhub videos:** descriptions only.
- **elsevier.triceps_medial_head:** the summary was partly garbled.
- **The Loyola pages:** titles and dates not shown.

## 11. Deviations from §1.2

**None.** Each §1.2 row was checked against the sources:

- **Ids, names, kinds, roles and parents:** no contradiction.
- **Layers and outcrops:** supported, the medial head with a disagreement on palpability and the coracobrachialis in part (§5).
- **"The lateral and medial heads share every action":** supported. Kholinne's modelled force difference by arm height is acute and changes no action.
- **"The biceps stays one node":** supported. Its heads differ only at the shoulder, where its role is weak.
- **Region actions:** each has a performer except the biceps' weak shoulder flexion, which is left out (§6).
- **The brachioradialis external:** meets the externals rule.

One observation lies outside §1.2. The forearm's anconeus carries `catalogMuscleKey: "triceps"`, which is the upper arm's catalog key. Region catalog keys are explicit (§1.1), so this may be harmless, but the registry lane should look.

## 12. Open issues

1. The draft long-head training claim needs a policy decision (§6).
2. The biceps' shoulder-flexion row: leave it out (recommended) or list it as `assist` (§6).
3. Human or full-text review before wave A's version is published; the StatPearls triceps article and the abstract-only studies first.
4. Whether frozen claims may gain sources: if they may, the database lane can add the corroboration found for `forearm:biceps.function` and `forearm:brachialis.function`.
