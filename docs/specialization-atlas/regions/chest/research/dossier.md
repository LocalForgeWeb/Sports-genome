# Specialization atlas: chest anatomy and its evidence (19 Oct 2026)

What the chest content says, what it rests on, and how far that review can be trusted. This is the anatomy lane's dossier for the chest in wave B (10-multi-region.md §1.2, §1.3, §8). The machine-readable record, with every query and the excerpt relied on for each citation, is `dossier.json` beside this file; the search log, in query order, is `searchlog.md`. Nothing in the repository was changed. The method, limits and wording follow the forearm's (03-anatomy-evidence.md). An independent automated second review on 19 Oct 2026 corrected this dossier in place; what it changed and why is in §11 and in `secondReview` in `dossier.json`.

## 1. Method

**What was reviewed.** The five chest nodes of §1.2: the pectoralis major (a parent, neither drawn nor selectable), its clavicular and sternocostal heads, the pectoralis minor and the serratus anterior. Result: 19 claims owned by `chest` (5 function, 5 appearance, 7 selectivity, 2 variation), 12 node-action rows, 8 joint actions (all already in the shared library), 46 sources and 88 citations (the first pass had 44 and 83; §11). The external member `shoulders.anterior_deltoid` was checked against the listing rule only; its content belongs to the shoulders.

**How.** Web search only, as for the forearm: page fetches are refused by the network proxy, so each claim was checked against what the search returned (titles, URLs, excerpts and generated summaries). For each claim:

1. Search for references in the standard's order: NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy pages (the University of Washington musculoskeletal atlas, the Loyola LUMEN dissector, a Washington University nerve-surgery page), Kenhub, Elsevier Complete Anatomy, Radiopaedia, IMAIOS. TeachMeAnatomy was used as the upper arm used it; one clinical reference outside the list (GPnotebook) was used once, beside Kenhub; a second (DocCheck Flexikon, a user-edited medical wiki) was removed by the second review. Wikipedia was read and not cited; one exact-phrase search was run to find out where a quoted sentence came from (§8).
2. Add each relied-on reference as a source keyed `<publisher>.<topic>` or `pmid.<number>`, with a note saying exactly what the search showed and what it could not confirm.
3. Cite it with a locator and, where the source is limited, a qualification (abstract only, acute EMG, search excerpt, location only).
4. Mark the claim `reviewed` only when the excerpts supported every sentence, with `reviewedAt: "2026-10-19"` and the note "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist." Appearance claims carry the forearm's inference wording.
5. A node is `reviewed` only when every function claim on it is.

Wording was then cut back until each sentence said no more than its excerpts: where a statement rested on one reference it says "one reference", and where references disagree the claim says so. A build script checks the content against the forearm test's copy rules (no left or right, no percentages, no "optimal" or "guarantee", no growth promise, no vendor name, no "table"), the claim-id form, the review-note wording, one citation record per claim source, and that every node action rests on a function claim of its own node.

## 2. Limits

- Web search only, as for the forearm: page fetches are refused by the network proxy, and every excerpt is a search-tool summary that can misquote (one misquote was caught; see the disagreements notes).
- The shared web-search budget for the turn ran out after 62 queries (Q1–Q62 in searchlog.md; Q63 refused). The 1997 decline-bench study and further confirmation of a few bibliographic details could not be searched.
- 'Reviewed' means an automated agent checked each sentence against web-search excerpts and generated summaries on 19 Oct 2026; not the full texts, and not a clinician or anatomist.
- Nothing here is hypertrophy evidence. The selectivity claims cite acute EMG; none sets a credit weight. Regional-growth training studies on bench angle exist but were not searched, by policy (§8: selectivity claims are never growth).
- **Excerpts, not full texts.** StatPearls showed introductions and parts of "Structure and Function"; Radiopaedia and IMAIOS were seen partly through mirrors; every study was seen as an abstract or a summary of one. Each citation says so.
- **Second review.** A separate automated agent re-checked the dossier with the same tools and limits (28 more searches, SR1–SR28 in `secondReview.queries`); it is not peer review and not a clinician or anatomist (§11).
- **Search summaries can misquote, and one did.** A summary gave Wikipedia's wording about the sternocostal head as StatPearls'. It was caught by an exact-phrase search and StatPearls is not cited for it (§8). Function claims rest on six to nine references each, so no function claim depends on one summary. The second review found summaries disagreeing about one more page (Elsevier on the sternocostal head and extension); that page is no longer cited for extension either way.

## 3. Claims by node

All claims are `reviewed` on 19 Oct 2026; none is draft. Each line gives the claim, its kind and basis, then each source key with the locator cited. The second review reworded ten of them (§11).

### Pectoralis major `chest.pec_major` (muscle, group; node reviewed)

- Location: Front of the chest, at the surface: a fan from the collarbone, the breastbone and the upper rib cartilages to the upper-arm bone near the shoulder.
- What it does: Draws your arm in toward your body, turns it inward and brings it across your chest. Its upper (clavicular) head also raises the arm forward; its larger lower (sternocostal) head helps bring a raised arm back down.
- Shape note: Together its two heads may make up most of the front contour of the chest, from the collarbone to the front fold of the armpit. In many women breast tissue lies over much of it. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: A muscle with two heads, not a target itself: work is counted for the heads inside it. | The heads are shown apart because their actions differ: the upper head raises the arm forward, the lower head helps bring a raised arm back down.
- Aliases: pectoralis major, pec major, pecs. Short name `PecMajor`. Layer: — (§1.2; parent, neither drawn nor selectable; the TypeScript value follows the platform lane, the forearm's groups use 'mixed'). Visibility `variable`: Both heads are at the surface (teachmeanatomy.pectoral_region: the most superficial muscle of the pectoral region), but in many women breast tissue lies over much of the muscle between the second and sixth ribs (statpearls.mammary_gland; statpearls.pectoralis_major), so how much of it shows differs between people. 'partial', the forearm's value for its mixed-layer groups, would also fit; the review may prefer it.
- Database muscle: none. The canonical list holds the two heads (pectoralis_major_clavicular, pectoralis_major_sternocostal in shared/capabilityRank.ts), not the whole muscle, as for the triceps.

**`chest.pec_major.function`** · function · established_anatomy · reviewed

> The pectoralis major has two heads: a clavicular head from the inner half of the collarbone and a sternocostal head from the breastbone, the upper six rib cartilages and the tendon sheet of the outer abdominal muscle. Both attach to the upper-arm bone near the shoulder. Acting together they draw the arm in toward the body (adduction), turn it inward (internal rotation) and bring it across the chest. Acting apart, the clavicular head raises the arm forward (flexion) and the sternocostal head helps bring a raised arm back down (extension).

- kenhub.pectoralis_major (Function) — Seen through web-search excerpts of the page, not the full text.
- statpearls.pectoralis_major (Structure and Function) — Seen through web-search excerpts; the article's function list says 'sternoclavicular head' where the sternocostal head is meant.
- teachmeanatomy.pectoral_region (Pectoralis major: attachments and actions) — Seen through web-search excerpts of the page, not the full text.
- uw.pectoralis_major (Origin; Action) — Seen through web-search excerpts of the page, not the full text.
- imaios.pectoralis_major (Clavicular head: origin) — Seen through web-search excerpts of the page, not the full text.
- radiopaedia.pectoralis_major (Gross anatomy: action) — Seen through a mirror of the page, as a web-search excerpt.
- elsevier.pectoralis_major (Quick Facts: Action) — Lists transverse adduction for the whole muscle; lists no extension.
- kenhub.upper_limb_muscles_and_movements (Shoulder: pectoralis major) — Seen through web-search excerpts of the page, not the full text.

**`chest.pec_major.appearance`** · appearance · anatomical_inference · reviewed

> The pectoralis major is the most superficial muscle of the front of the chest: a large fan from the collarbone, breastbone and rib cartilages to the upper-arm bone, whose outer edge forms the front fold of the armpit. It may therefore make up most of the front contour of the chest. In many women breast tissue lies over much of it. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- teachmeanatomy.pectoral_region (Pectoralis major: the most superficial muscle of the pectoral region) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- pmc.chest_wall_flaps (Pectoralis major flap: anatomy (the outer edge forms the front fold of the armpit)) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- imaios.anterior_axillary_fold (Definition) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- statpearls.pectoralis_major (Structure and Function: beneath the breast tissue) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- statpearls.mammary_gland (Structure: extent and base on the pectoral fascia) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.

### Pectoralis major, clavicular head `chest.pec_major_clavicular` (head, target; node reviewed)

- Location: Upper front of the chest, at the surface: from the inner half of the collarbone down and outward to the upper-arm bone near the shoulder.
- What it does: Raises your arm forward and up in front of you, and with the lower head brings it across your chest. It also helps draw the arm in toward your body and turn it inward.
- Shape note: May contribute to the contour of the upper chest just below the collarbone, toward the front of the shoulder. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Raising the arm forward is shared with the front of the deltoid, so forward-raising work loads them together. | Muscle-activity studies disagree on how much the bench angle changes its share of a press.
- Aliases: clavicular head, upper pec, pars clavicularis. Short name `PecClav`. Layer: surface. Visibility `clear`: At the surface on the upper chest, below the inner half of the collarbone (imaios.pectoralis_major; teachmeanatomy.pectoral_region), above where breast tissue usually begins at the second rib (statpearls.mammary_gland). That the head's outline therefore shows is an inference from location, not a reported finding.
- Database muscle: `pectoralis_major_clavicular`. Exists in the canonical list (shared/capabilityRank.ts); the database lane confirms.

**`chest.pec_major_clavicular.function`** · function · established_anatomy · reviewed

> The clavicular head starts on the front of the inner half of the collarbone. Acting on its own it raises the arm forward (shoulder flexion), especially from a position with the arm down or back; one reference says up to about 90 degrees. One anatomy reference names it, with the front of the deltoid, as a main forward-raising muscle of the shoulder. With the sternocostal head it brings the arm across the chest, draws the arm in toward the body and turns it inward; references give these three actions to the muscle as a whole, and one dissection guide also lists drawing in for this head. One quick reference describes its part in raising the arm as assisting rather than main.

- imaios.pectoralis_major (Clavicular head: origin and primary action) — Seen through web-search excerpts of the page, not the full text.
- statpearls.pectoralis_major (Structure and Function: clavicular head) — Seen through web-search excerpts of the page, not the full text.
- kenhub.pectoralis_major (Function: the clavicular part acting independently) — Seen through web-search excerpts of the page, not the full text.
- kenhub.shoulder_joint (Movements: the prime flexors) — Seen through web-search excerpts of the page, not the full text.
- uw.pectoralis_major (Action: the upper fibres acting alone) — Seen through web-search excerpts of the page, not the full text.
- loyola.pectoralis_major (Action: clavicular head) — Seen through web-search excerpts of the page, not the full text.
- loyola.upper_limb_joint_actions (Shoulder: flexion) — Names the pectoralis major, not a head, among the shoulder flexors.
- radiopaedia.pectoralis_major (Gross anatomy: action of the whole muscle) — Seen through a mirror of the page; describes the whole muscle, not the head.
- elsevier.pectoralis_major (Quick Facts: Action) — Credits the clavicular head with assisting flexion; cited for that difference between references.

**`chest.pec_major_clavicular.appearance`** · appearance · anatomical_inference · reviewed

> The clavicular head is the upper part of the pectoralis major, at the surface, running down and outward from the inner half of the collarbone toward the upper-arm bone near the shoulder; a groove separates the pectoralis major from the deltoid at the front of the shoulder. It may contribute to the contour of the upper chest just below the collarbone. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- imaios.pectoralis_major (Clavicular head: origin and fibre direction) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- teachmeanatomy.pectoral_region (Pectoralis major: attachments) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- radiopaedia.deltopectoral_groove (Definition) — Names the groove between the deltoid and the pectoralis major; that the clavicular head borders it is inferred from where the head lies.

**`chest.pec_major_clavicular.selectivity.1`** · selectivity · experimental · reviewed

> Bench-press studies measured upper-chest activity at different bench angles and do not fully agree. In 15 men pressing at four angles, the clavicular head was more active at inclines of 44 and 56 degrees than on a flat bench. In 30 trained adults, the upper portion of the muscle was most active at a 30-degree incline, and above 45 degrees front-deltoid activity rose while the pectoralis major's performance fell. In 14 trained men, upper-chest activity over the whole press did not differ between a 15-degree decline, a flat bench and inclines of 30 and 45 degrees, though both inclines gave more during part of the upward push. In an older study of 6 men, the clavicular head was no more active on an incline than on a flat bench, and less active on a decline. These are short-term activity measurements; they do not show which angle grows the muscle more.

- lww.chest_press_angles (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface EMG, 15 healthy men, seven tenths of one-repetition maximum. Abstract only.
- pmid.33049982 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 30 trained adults, six tenths of one-repetition maximum; reports an upper portion, not the clavicular head by name. Abstract only.
- pmid.25799093 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface EMG, 14 resistance-trained men, about two thirds of one-repetition maximum; reports upper and lower parts of the muscle, not the heads by name. Abstract only, seen in two search summaries.
- bisp.bench_press_five_shoulder_muscles (Abstract) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Six men; library-record abstract seen in one search summary.

**`chest.pec_major_clavicular.selectivity.2`** · selectivity · experimental · reviewed

> In a high-density surface-EMG study of 29 healthy young women holding steady efforts in several directions, the clavicular, upper sternocostal and middle sternocostal regions were about equally active when pushing the arm forward or across the body; the one exception was pushing forward at a quarter of maximal force, where the clavicular region was more active than the upper sternocostal region. This study therefore found no consistent difference between the heads in raising the arm forward. It is short-term activity measured in women only, not a measurement of growth.

- pmid.35093733 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Isometric ramp-and-hold tasks in 29 healthy young women; abstract only.

### Pectoralis major, sternocostal head `chest.pec_major_sternocostal` (head, target; node reviewed)

- Location: Middle and lower front of the chest, at the surface: from the breastbone, the upper six rib cartilages and the tendon sheet of the outer abdominal muscle to the upper-arm bone near the shoulder.
- What it does: Draws your arm in toward your body, turns it inward and brings it across your chest. From a raised position in front, it helps pull the arm back down.
- Shape note: The larger part of the muscle; may contribute most of the contour of the middle and lower chest and of the front fold of the armpit. In many women breast tissue lies over much of it. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Drawing the arm in toward the body is shared with the latissimus dorsi and teres major of the back, so that work is not chest-only. | One reference describes a small third, abdominal part of the muscle; here it is counted with this head. | Some people are born without it on one side.
- Aliases: sternocostal head, sternal head, pars sternocostalis. Short name `PecStern`. Layer: surface. Visibility `variable`: At the surface over the breastbone and upper ribs and the larger part of the muscle (radiopaedia.pectoralis_major), but in many women breast tissue lies over much of it (statpearls.mammary_gland; statpearls.pectoralis_major), and a few people lack it (Poland syndrome; chest.pec_major_sternocostal.variation.1).
- Database muscle: `pectoralis_major_sternocostal`. Exists in the canonical list (shared/capabilityRank.ts); the database lane confirms.

**`chest.pec_major_sternocostal.function`** · function · established_anatomy · reviewed

> The sternocostal head is the larger part of the pectoralis major. It starts on the front of the breastbone, the cartilages of the upper six ribs and the tendon sheet of the outer abdominal muscle (the external oblique aponeurosis), and attaches to the upper-arm bone near the shoulder. Its main actions are drawing the arm in toward the body (adduction) and turning it inward (internal rotation), and with the clavicular head it brings the arm across the chest. From a raised position in front, it helps pull the arm back down (extension); two references describe its part as contributing to or facilitating that movement, and one dissection guide does not list it.

- statpearls.pectoralis_major (Structure and Function: sternocostal head) — Seen through web-search excerpts; the article's function list says 'sternoclavicular head' for this head.
- imaios.pectoralis_major (Sternocostal head: origin, primary actions and contribution to extension) — Seen through web-search excerpts of the page, not the full text.
- kenhub.pectoralis_major (Function: the sternocostal part acting independently) — Seen through web-search excerpts of the page, not the full text.
- uw.pectoralis_major (Origin; Action: the lower fibres acting alone) — Seen through web-search excerpts of the page, not the full text.
- teachmeanatomy.pectoral_region (Pectoralis major: attachments) — Seen through web-search excerpts of the page, not the full text.
- pmc.hypogenic_pectoralis_major (Background anatomy) — A case report; cited only for the textbook anatomy in its background.
- radiopaedia.pectoralis_major (Gross anatomy: the sternocostal portion; action of the whole muscle) — Seen through a mirror of the page, as a web-search excerpt.
- loyola.pectoralis_major (Action: sternal head) — Lists adduction and medial rotation only; cited for that difference between references.
- elsevier.pectoralis_major (Quick Facts: Action (transverse adduction)) — Cited only for bringing the arm across the chest (transverse adduction). Search summaries disagree on whether the page lists extension for this head (the first pass saw none; one second-review summary quoted 'assists in extension of the arm ... via its sternocostal head'; another was cut off), so it is not cited for extension either way.

**`chest.pec_major_sternocostal.appearance`** · appearance · anatomical_inference · reviewed

> The sternocostal head is the larger, lower part of the pectoralis major, at the surface over the upper ribs from the breastbone outward; the muscle's outer edge, which forms the front fold of the armpit, lies along this part. It may contribute most of the contour of the middle and lower chest and of that fold. In many women breast tissue, which lies on the muscle between the second and sixth ribs, covers much of it. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- radiopaedia.pectoralis_major (Gross anatomy: the sternocostal portion is most of the muscle) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- teachmeanatomy.pectoral_region (Pectoralis major: attachments) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- pmc.chest_wall_flaps (Pectoralis major flap: anatomy (the outer edge forms the front fold of the armpit)) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. That this edge lies along the sternocostal head is inferred from where the head lies.
- statpearls.mammary_gland (Structure: extent and base on the pectoral fascia) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- statpearls.pectoralis_major (Structure and Function: beneath the breast tissue) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.

**`chest.pec_major_sternocostal.selectivity.1`** · selectivity · experimental · reviewed

> Three of the four bench-press studies cited here found the sternocostal part most active on a flat bench among the angles each tested. In 15 men it was more active flat than at inclines of 28, 44 and 56 degrees; in 30 trained adults the middle and lower portions of the muscle were most active with no incline; and in an older study of 6 men it was more active on a flat bench than on a decline. In 14 trained men, though, the lower part was about as active on a 15-degree decline as on a flat bench, and the decline, the flat bench and a 30-degree incline all gave more activity than a 45-degree incline. These are short-term activity measurements; they do not show which bench angle grows the muscle more.

- lww.chest_press_angles (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface EMG, 15 healthy men, seven tenths of one-repetition maximum. Abstract only.
- pmid.33049982 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 30 trained adults; reports middle and lower portions, not the sternocostal head by name. Abstract only.
- pmid.25799093 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface EMG, 14 resistance-trained men, about two thirds of one-repetition maximum; reports a lower part of the muscle, not the sternocostal head by name. Abstract only, seen in two search summaries.
- bisp.bench_press_five_shoulder_muscles (Abstract) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Six men; library-record abstract seen in one search summary.

**`chest.pec_major_sternocostal.selectivity.2`** · selectivity · experimental · reviewed

> In a high-density surface-EMG study of 29 healthy young women holding steady efforts, the middle sternocostal region was more active than the clavicular and upper sternocostal regions, from about an eighth more to about twice as active, when pulling the arm down and back (extension), when drawing it in with the arm turned out, and when turning it inward with the arm raised high. The extension result fits the anatomy references, which give pulling a raised arm back down to this head. It is short-term activity measured in women only, not a measurement of growth.

- pmid.35093733 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Isometric ramp-and-hold tasks in 29 healthy young women; abstract only.

**`chest.pec_major_sternocostal.variation.1`** · variation · established_anatomy · reviewed

> Some people are born without the sternocostal head of the pectoralis major, usually on one side only. This is the most common feature of Poland syndrome, a rare condition in which the pectoralis minor, ribs, breast and hand on the same side may also be underdeveloped; it is reported more often in males.

- statpearls.poland_syndrome (Introduction) — Seen through web-search excerpts of the page, not the full text. The epidemiology section was not seen; incidence figures differ widely between sources, so none is given.
- radiopaedia.poland_syndrome (Clinical presentation; case discussion) — Seen through a mirror of the page and two case pages, as web-search excerpts.
- pamj.poland_syndrome (Introduction: incidence) — A clinical article seen only through a web-search summary; cited for how uncommon the condition is.

### Pectoralis minor `chest.pec_minor` (muscle, target; node reviewed)

- Location: Front of the chest, deep layer under the pectoralis major: from the third to fifth ribs up and outward to the coracoid process, a bony hook at the front of the shoulder blade.
- What it does: Draws your shoulder blade forward around the rib cage and down, and holds it against the chest wall. When the shoulder blade is held still, it can help lift the upper ribs in deep breathing.
- Shape note: Lies under the pectoralis major, which almost completely covers it, so it has little or no contour of its own.
- Caveats: Pushing the shoulder blade forward loads it together with the serratus anterior. | It also rotates the shoulder blade downward; that is not a chest action and is not counted here. | Where it attaches varies between people.
- Aliases: pec minor. Short name `PecMinor`. Layer: deep. Visibility `not_distinct`: Under the pectoralis major, which almost completely covers it (kenhub.pectoralis_minor; imaios.pectoralis_minor). No source said it can be felt; the search could not confirm palpability either way.
- Database muscle: `pectoralis_minor`. Exists in the canonical list (shared/capabilityRank.ts); the database lane confirms.

**`chest.pec_minor.function`** · function · established_anatomy · reviewed

> The pectoralis minor runs from the third to fifth ribs, near their cartilages, up and outward to the coracoid process at the front of the shoulder blade. It draws the shoulder blade forward around the rib cage (protraction) and down (depression), holding it against the chest wall, and it also rotates the shoulder blade downward. When the shoulder blade is held still it can help lift the third to fifth ribs in forced breathing.

- statpearls.pectoral_muscles (Structure and Function: pectoralis minor) — Seen through web-search excerpts of the page, not the full text.
- statpearls.thorax_muscles (Pectoralis minor) — One summary line from the search; the article was not otherwise seen.
- kenhub.pectoralis_minor (Function) — Seen through web-search excerpts; the summaries did not always name which Kenhub page each action came from.
- elsevier.pectoralis_minor (Quick Facts: Origin, Insertion and Action)
- uw.pectoralis_minor (Origin; Insertion; Action) — Seen through web-search excerpts of the page, not the full text.
- teachmeanatomy.pectoral_region (Pectoralis minor: attachments and function) — Seen through web-search excerpts of the page, not the full text.

**`chest.pec_minor.appearance`** · appearance · anatomical_inference · reviewed

> The pectoralis minor is a thin, triangular muscle under the pectoralis major, which almost completely covers it, so it has little or no contour of its own.

- kenhub.pectoralis_minor (Relations: covered by the pectoralis major) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- imaios.pectoralis_minor (Description) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.

**`chest.pec_minor.selectivity.1`** · selectivity · experimental · reviewed

> In a study of 26 healthy people that recorded the serratus anterior with surface electrodes and the pectoralis minor with fine wires, a forward punching movement (the serratus punch) activated the serratus anterior more than the pectoralis minor, while two push-up-plus variations, against a wall and from the knees on the floor, activated the two about equally. Every exercise activated the pectoralis minor to some degree. This is short-term activity in healthy people, not a measurement of growth.

- pmid.26749459 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 26 healthy subjects; fine-wire EMG of the pectoralis minor. Abstract only.

**`chest.pec_minor.variation.1`** · variation · established_anatomy · reviewed

> Where the pectoralis minor attaches varies between people. Its rib origin differs (from the second to fourth ribs in some people and the third and fourth in others, against the usual third to fifth). In a minority of shoulders, part or all of its tendon runs over the coracoid process instead of ending on it, and attaches on structures of the shoulder joint such as the supraspinatus tendon.

- cureus.pectoralis_minor_variations (Abstract) — Systematic review of cadaveric and imaging reports; abstract portion only.
- springer.pectoralis_minor_ectopic_insertion (Abstract: pooled estimate) — Systematic review and meta-analysis of cadaveric and imaging studies; abstract only, as summarised.
- plos.pectoralis_minor_ectopic_tendons (Introduction: types of ectopic tendon) — Cadaveric study; seen only through web-search summaries; cited for its description of the tendon types, not for its own prevalence figure.

### Serratus anterior `chest.serratus_anterior` (muscle, target; node reviewed)

- Location: Side of the chest: from the upper eight or nine ribs back around the rib cage, mostly under the shoulder blade, to the shoulder blade's inner edge; its lower slips lie at the surface below the armpit.
- What it does: Moves your shoulder blade forward around the rib cage, as when you push your arms forward, and turns it so you can raise your arm overhead. It holds the shoulder blade against the rib cage.
- Shape note: Its lower slips may contribute to a ridged contour along the ribs on the side of the chest below the armpit, between the chest muscle and the latissimus dorsi; they can often be seen in athletic people. Most of the muscle lies under the shoulder blade and the chest muscles, where it has little or no contour of its own. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Pushing the shoulder blade forward also loads the pectoralis minor, so that work is not serratus-only. | References give its lowest slip on the eighth or the ninth rib. | One reference says its lowest fibres may help pull the shoulder blade down; that is not counted here. | When it is weak or its nerve is injured, the inner edge of the shoulder blade lifts off the rib cage.
- Aliases: serratus. Short name `SA`. Layer: surface (§1.2, kept; see DEVIATION D1: the evidence places most of the belly deep, with a surface part on the side of the chest). Visibility `partial`: Lower slips on the side of the chest below the armpit can be seen and felt, often in athletic people (kenhub.serratus_anterior; gpnotebook.serratus_anterior); the rest lies under the shoulder blade and the pectoral muscles.
- Database muscle: `serratus_anterior`. Exists in the canonical list (shared/capabilityRank.ts); the database lane confirms.

**`chest.serratus_anterior.function`** · function · established_anatomy · reviewed

> The serratus anterior starts by separate slips on the outer surfaces of the upper eight or nine ribs and runs back around the rib cage, under the shoulder blade, to the inner edge of the shoulder blade; its lowest and strongest part reaches the blade's lower corner. It draws the shoulder blade forward around the rib cage (protraction) and, working with the trapezius, turns it so the arm can be raised above shoulder height (upward rotation). It holds the shoulder blade against the rib cage: when the muscle is weak or its nerve is injured, the blade's inner edge lifts away (winging). One reference says its lowest fibres may help pull the shoulder blade down.

- statpearls.serratus_anterior (Structure and Function) — Seen through web-search excerpts of the page, not the full text.
- kenhub.serratus_anterior (Origin, insertion and function) — Seen through web-search excerpts of the page, not the full text.
- elsevier.serratus_anterior (Quick Facts: Origin, Insertion and Action)
- teachmeanatomy.serratus_anterior (Function; clinical relevance) — Seen through web-search excerpts of the page, not the full text.
- radiopaedia.serratus_anterior (Gross anatomy; related pathology) — Seen through a mirror of the page; partial text only.
- statpearls.scapular_winging (Etiology) — Seen through web-search excerpts; the summary did not always name which StatPearls article a sentence came from.
- kenhub.trapezius (Function: upward rotation shared with the serratus anterior) — Seen through web-search excerpts of the page, not the full text.
- pmid.27757809 (Abstract: three divisions) — Cadaveric study of eight muscles; abstract only.
- wustl.serratus_anterior (Action) — Gives the downward pull as a possible action of the lowest fibres only.

**`chest.serratus_anterior.appearance`** · appearance · anatomical_inference · reviewed

> Most of the serratus anterior lies under the shoulder blade and behind the pectoral muscles, where it has little or no contour of its own. Its lower slips lie on the side of the chest between the pectoralis major and the latissimus dorsi, interlocking with the slips of the external oblique; there they can often be seen and felt in athletic people, so they may contribute to a ridged contour along the ribs below the armpit. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- kenhub.serratus_anterior (Overview; palpation) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- elsevier.serratus_anterior (Relations) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- gpnotebook.serratus_anterior (Testing) — Says the slips are often seen and felt in young, athletic people; the contour statement is inferred from that and from their location.
- imaios.serratus_anterior (Description: slips interlocking with the external oblique) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.

**`chest.serratus_anterior.selectivity.1`** · selectivity · experimental · reviewed

> In a study of 26 healthy people, a forward punching movement (the serratus punch) activated the serratus anterior more than the pectoralis minor, while two push-up-plus variations activated the two about equally, and the pectoralis minor was active in every exercise. In all three exercises, then, pushing the shoulder blade forward worked the two muscles together. This is short-term activity, not a measurement of growth.

- pmid.26749459 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 26 healthy subjects; surface EMG of the serratus anterior. Abstract only.

**`chest.serratus_anterior.selectivity.2`** · selectivity · experimental · reviewed

> In a study of 30 people, healthy or with mild shoulder problems, the standard push-up plus (a push-up finished by pushing the shoulder blades forward) produced, in that final push, the highest serratus anterior activity of the push-up variations tested, with the least upper-trapezius activity relative to it. This is short-term activity, not a measurement of growth.

- pmid.14977678 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 30 subjects, some with mild shoulder dysfunction. Abstract only.

## 4. Node actions

| Node | Action | Role | Rests on | Note |
|---|---|---|---|---|
| `chest.pec_major_clavicular` | `shoulder.flexion` | prime | `chest:chest.pec_major_clavicular.function` | IMAIOS calls flexion its primary action and Kenhub names it a prime flexor with the anterior deltoid; Elsevier says it assists. The function claim states the difference. |
| `chest.pec_major_clavicular` | `shoulder.horizontal_adduction` | prime | `chest:chest.pec_major_clavicular.function` | Whole-muscle action (Radiopaedia: brings the humerus across the chest; Elsevier: transverse adduction); regional EMG found the clavicular region as active as the sternocostal regions in horizontal flexion (pmid.35093733). |
| `chest.pec_major_clavicular` | `shoulder.adduction` | assist | `chest:chest.pec_major_clavicular.function` | Loyola lists adduction for the clavicular head; Kenhub, IMAIOS and the PMC case report give adduction to the muscle acting as a whole. Head-specific accounts give it flexion as its own action, so assist. |
| `chest.pec_major_clavicular` | `shoulder.internal_rotation` | assist | `chest:chest.pec_major_clavicular.function` | Whole-muscle action (Kenhub, IMAIOS, UW, TeachMeAnatomy); head-specific accounts give inward turning to the sternocostal head, so assist here. |
| `chest.pec_major_sternocostal` | `shoulder.adduction` | prime | `chest:chest.pec_major_sternocostal.function` |  |
| `chest.pec_major_sternocostal` | `shoulder.internal_rotation` | prime | `chest:chest.pec_major_sternocostal.function` |  |
| `chest.pec_major_sternocostal` | `shoulder.horizontal_adduction` | prime | `chest:chest.pec_major_sternocostal.function` | Whole-muscle action (Radiopaedia, Elsevier); regional EMG found the sternocostal regions as active as the clavicular region in horizontal flexion (pmid.35093733). StatPearls is NOT cited for it (see notes: misattributed wording). |
| `chest.pec_major_sternocostal` | `shoulder.extension` | assist | `chest:chest.pec_major_sternocostal.function` | Only from a raised position in front back toward the side (StatPearls: extension of a flexed arm; Kenhub: 'facilitates' it by pulling the arm downwards; IMAIOS: 'contributes'; UW). Second review: assist, not prime. No reference consulted calls the head a main extensor; those that grade its part say it contributes or facilitates, and an independent search described it as working with the latissimus dorsi, teres major and back of the deltoid, which most references treat as the main extensors. The head split does not need a prime row: the clavicular head carries flexion and this head extension either way. The shared action's description also covers moving the arm behind the body, which no source gives this head. |
| `chest.pec_minor` | `scapula.protraction` | prime | `chest:chest.pec_minor.function` |  |
| `chest.pec_minor` | `scapula.depression` | prime | `chest:chest.pec_minor.function` | Elsevier says it 'assists in depressing'; StatPearls (thorax muscles) says it primarily depresses the shoulder; Kenhub says it can forcefully depress the scapula. |
| `chest.serratus_anterior` | `scapula.protraction` | prime | `chest:chest.serratus_anterior.function` |  |
| `chest.serratus_anterior` | `scapula.upward_rotation` | prime | `chest:chest.serratus_anterior.function` |  |

Every region action of §1.2 has a performer. Not listed, and why:

- `chest.serratus_anterior` · scapula.depression: Only one cited reference gives it, and as a possible action of the lowest fibres (wustl.serratus_anterior: 'may depress'; Brookbush and LearnMuscles, not cited, say the same); Kenhub summaries were inconsistent about which part pulls down. Left out under the forearm's rule for weak or disputed extras (03-anatomy-evidence.md §6); said in the function claim and a caveat.
- `chest.pec_minor` · scapula.downward_rotation: Supported (Elsevier, Kenhub) but not a chest region action (§1.2; the back owns it). Said in the claim and a caveat. If the review wants it, the back's action id exists in §1.2 and the row would be 'assist'.
- `chest.pec_major` · (any): Parent node, neither drawn nor selectable (§1.2, §7.3): its actions are declared on the two heads, as the upper arm does for the triceps group. Second review: the shared test regionContent.test.ts:408-411 ('gives every muscle a main action, adjacent muscles aside') does not skip parents, and the pectoralis major is kind 'muscle', role 'group', so it fails as written; the lane or the platform adds a prime row here or exempts role 'group'.
- `chest.pec_major_* (both heads)` · scapula.depression / scapula.protraction: UW and TeachMeAnatomy say the pectoralis major draws the scapula forward and down; it attaches to the upper-arm bone, not the shoulder blade, so the effect is through the arm. Listing it would offer the pectoralis major as a shoulder-blade target.
- `chest.serratus_anterior` · shoulder.flexion: StatPearls says protraction 'allows for anteversion of the arm'; that is a shoulder-blade action that helps the arm forward, not a shoulder-joint action of the serratus.
- `chest.pec_minor, chest.serratus_anterior` · (breathing): Both can help lift ribs in forced breathing; there is no action id and it moves no load. Said in the pectoralis minor's claim.

## 5. Joint actions this region needs

All eight chest actions already exist in `shared/specialization/actions/joints.ts` (wave 0), so nothing is to be added. The first pass proposed its own wordings; the second review replaced them with the landed definitions below, and each note keeps the first pass's wording where it differed.

- `shoulder.horizontal_adduction` · Shoulder · **Horizontal adduction**: "Moves an arm held out at shoulder height forward and across the chest." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. First pass proposed: joint 'Shoulder (glenohumeral joint)', label 'Horizontal adduction', "With the arm raised to shoulder height, brings it forward and across the front of the chest.".)
- `shoulder.flexion` · Shoulder · **Shoulder flexion**: "Raises the arm forward and up in front of the body." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. First pass proposed: joint 'Shoulder (glenohumeral joint)', label 'Shoulder flexion', "Raises the arm forward and up in front of the body.".)
- `shoulder.extension` · Shoulder · **Shoulder extension**: "Brings the arm down and back from in front of the body, and on behind it." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. The sternocostal head does only the first half (down from in front), as an assist; its node action says so. First pass proposed: joint 'Shoulder (glenohumeral joint)', label 'Shoulder extension', "Brings the arm down and back from in front of the body, and on behind it.".)
- `shoulder.adduction` · Shoulder · **Shoulder adduction**: "Brings an arm raised out to the side back down toward the body." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. The landed wording is adduction from a raised-out-to-the-side position; the pectoralis major's adduction fits it. First pass proposed: joint 'Shoulder (glenohumeral joint)', label 'Shoulder adduction', "Brings the arm down and in toward the side of the body.".)
- `shoulder.internal_rotation` · Shoulder · **Shoulder internal rotation**: "Turns the upper arm inward on its long axis: with the elbow bent, the hand swings toward the belly." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. First pass proposed: joint 'Shoulder (glenohumeral joint)', label 'Internal rotation', "Turns the upper arm inward, so the forearm swings in toward the body (with the elbow bent).".)
- `scapula.protraction` · Shoulder blade · **Scapular protraction**: "Slides the shoulder blade forward around the ribs, away from the spine, as when reaching forward." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. First pass proposed: joint 'Shoulder blade (scapulothoracic)', label 'Shoulder-blade protraction', "Moves the shoulder blade forward around the rib cage, away from the spine, as when pushing the arms forward.".)
- `scapula.depression` · Shoulder blade · **Scapular depression**: "Pulls the shoulder blade down, away from the ear." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. First pass proposed: joint 'Shoulder blade (scapulothoracic)', label 'Shoulder-blade depression', "Draws the shoulder blade down, away from the ear and toward the hip.".)
- `scapula.upward_rotation` · Shoulder blade · **Scapular upward rotation**: "Turns the shoulder blade so the shoulder socket faces up, as the arm rises overhead." (Already in shared/specialization/actions/joints.ts (wave 0) with this joint, label and description; nothing to add. First pass proposed: joint 'Shoulder blade (scapulothoracic)', label 'Upward rotation', "Turns the shoulder blade so the shoulder socket faces upward, which lets the arm be raised above shoulder height.".)

## 6. Sources, single-source claims and unconfirmed details

46 sources, every one cited by at least one claim. Keys, URLs, titles and notes are in `dossier.json`; the notes say exactly what the search showed and what it could not confirm.

**Single-source claims.**

- None. Each of the five function claims rests on six or more references: chest.pec_major (8), chest.pec_major_clavicular (9), chest.pec_major_sternocostal (9), chest.pec_minor (6), chest.serratus_anterior (9).
- Non-function claims resting on one source: chest.pec_major_clavicular.selectivity.2 and chest.pec_major_sternocostal.selectivity.2 (both pmid.35093733), chest.pec_minor.selectivity.1 and chest.serratus_anterior.selectivity.1 (both pmid.26749459), chest.serratus_anterior.selectivity.2 (pmid.14977678). Each study's abstract was seen in two or three independent search summaries that agreed, and the second review found the same results again with its own queries (SR12, SR15, SR17).

**Unconfirmed bibliographic details.**

- statpearls.pectoralis_major: Bookshelf listing confirmed by the second review (NBK525991, PubMed 30252247, Solari and Burns, updated 24 July 2023 as summarised); the listing's title reads 'Anatomy, Thorax, Pectoralis Major Major'; its function list says 'Sternoclavicular head' for the sternocostal head.
- statpearls.pectoral_muscles, statpearls.thorax_muscles, statpearls.serratus_anterior, statpearls.scapular_winging, statpearls.mammary_gland: authors not shown; for the serratus and winging, summaries did not always say which StatPearls article a sentence came from. NBK545241 and NBK538321 confirmed by listing (second review).
- statpearls.poland_syndrome: listed as archived (Tafti and Cecava; PubMed 30335292); the maintained article, 'Poland Syndrome in Children' (NBK560788), was not seen.
- lww.chest_press_angles (Trebs et al. 2010): PubMed id not confirmed; 20508462 is a different study.
- pmid.33049982 (Rodríguez-Ridao et al. 2020): full author list not shown; DOI confirmed by the second review.
- bisp.bench_press_five_shoulder_muscles (Barnett et al. 1995): the record lists Kippers, Turner and Barnett; PubMed id and DOI not seen; a later review describes its sternocostal comparison differently from the abstract.
- pmid.26749459 (Castelein et al. 2016): DOI not shown; the letter to the editor (PubMed 27133020) was not read.
- pmid.14977678 (Ludewig et al. 2004): authors, volume and pages confirmed by the second review.
- pmid.25799093 (Lauver et al. 2016): volume, pages and DOI not shown.
- cureus.pectoralis_minor_variations (AlHarbi 2023): journal read from the PDF host; volume, article number and the author's full name not shown.
- springer.pectoralis_minor_ectopic_insertion (Asghar et al.): year 2020 online or 2021 print; PubMed id not seen.
- plos.pectoralis_minor_ectopic_tendons (Schwarz and Hirtler 2019): DOI not shown.
- pamj.poland_syndrome: authors, year and article type not shown.
- pmid.27757809 (Webb et al.): year 2016 (online) or 2018 (print); DOI read from a Springer URL only.
- pmc.chest_wall_flaps and pmc.hypogenic_pectoralis_major: authors and journals not shown.
- radiopaedia.pectoralis_major, radiopaedia.serratus_anterior, radiopaedia.poland_syndrome: seen through mirrors of the pages (images.radiopaedia.org, a static-assets host); the canonical radiopaedia.org URLs are recorded.
- imaios.pectoralis_major and imaios.serratus_anterior: seen through the imaios.cn mirror, whose URLs are recorded, with imaios.com pages for the clavicular head, the pectoralis minor and the axillary fold.
- gpnotebook.serratus_anterior, wustl.serratus_anterior: authors and dates not shown; GPnotebook is outside the standard's list and is cited only beside Kenhub; the WUSTL page is a university page.

## 7. The split of the pectoralis major

- Supported by the function claims. Head-specific actions are named by StatPearls (NBK525991), Kenhub (two pages), IMAIOS, the UW atlas, TeachMeAnatomy and the PMC case report: the clavicular head flexes the arm, the sternocostal head extends a flexed arm; together they adduct and turn the arm inward. Loyola names no extension, and Elsevier calls the clavicular head's flexion 'assisting': the claims say so. Second review: the sternocostal head's extension is now 'assist' (references say it contributes or facilitates); the split does not depend on that role.
- Muscle-activity evidence supports half of the split clearly. In isometric tasks (pmid.35093733) the middle sternocostal region was much more active than the clavicular region in extension and in adduction with the arm turned out, but in forward and horizontal flexion the three regions were about equally active, except forward pushing at a quarter of maximal force, where the clavicular region was more active than the upper sternocostal region. Bench-press studies disagree on whether an incline raises clavicular activity (lww.chest_press_angles yes at 44 and 56 degrees; pmid.33049982 most at 30 degrees; bisp.bench_press_five_shoulder_muscles no; pmid.25799093 no difference over the whole press, more at 30 and 45 degrees during part of it). The split therefore stands on anatomy, and the claims say that the forward-raising difference is not a measured difference in activity. The atlas resting the clavicular head's forward-raising action on anatomy references is an accounting choice; the second review moved that sentence out of the selectivity claim and into this note.

## 8. Disagreements between sources, and how the wording handles them

- Clavicular head in raising the arm: main (IMAIOS 'primary action'; Kenhub 'prime flexors' with the anterior deltoid; StatPearls; UW; TeachMeAnatomy) against 'assists' (Elsevier) and 'secondary' for the whole muscle (Radiopaedia). The claim says one quick reference calls it assisting; the node action is prime.
- Sternocostal head bringing the arm down: named by StatPearls, Kenhub ('facilitates'), UW, IMAIOS ('contributes') and the PMC case report; not listed by Loyola. Elsevier: summaries disagree (none in the first pass; 'assists' in one second-review summary; cut off in another), so it is not cited for it. The claim says two references describe the head's part as contributing or facilitating and one dissection guide does not list it. The node action is now 'assist' (second review).
- Misattributed wording caught: one summary (Q11) attributed 'the muscle fibers attaching to the sternocostal head permit the horizontal and vertical adduction, extension, and internal rotation' to StatPearls; an exact-phrase search (Q62) found it is Wikipedia's wording. StatPearls is not cited for horizontal adduction; Radiopaedia ('bring the humerus across the chest') and Elsevier ('transversely adducts') carry it, with regional EMG beside them.
- Kenhub video transcript says the pectoralis major turns the arm outward; Kenhub's written pages and every other reference say inward. The video is not cited.
- Decline bench: Barnett et al. found the sternocostal head more active flat than on a decline. Glass and Armstrong (1997) is often cited for the opposite; the second review found only its reference, not its results. The second review added Lauver et al. 2016, in which the lower part was about as active on a 15-degree decline as flat; the claim now says three of the four studies found flat best and states Lauver's result. No decline recommendation is made.
- Serratus anterior pulling the shoulder blade down: 'may' for the lowest fibres (WUSTL; Brookbush, not cited), stated flatly by LearnMuscles (not cited); one Kenhub summary said the superior part pulls the scapula down while the German Kenhub page says the superior part elevates it. No node action; the claim says 'one reference says its lowest fibres may help'.
- Serratus rib count: first to eighth (TeachMeAnatomy, StatPearls), first to ninth (Elsevier), eighth or ninth (Kenhub, Radiopaedia). The claims say 'eight or nine'.
- Pectoralis minor depression: 'assists' (Elsevier) against 'primarily depresses the shoulder' (StatPearls thorax muscles) and 'can forcefully depress' (Kenhub). Node action prime, noted.
- Pectoralis minor innervation was given inconsistently by Kenhub pages; not used.
- Poland syndrome incidence: figures differ widely between sources (StatPearls' own figure not seen), so the variation claim says 'rare' and gives no figure; side preference is not stated (copy never names a side).
- Clavicular head and how far it raises the arm: Kenhub says up to 90 degrees; a university teaching page seen in a second-review search said up to 60. The claim keeps 'one reference says up to about 90 degrees'.
- Pectoralis minor ectopic insertion: the first pass cited a pooled 22 in 100 from an IJHS abstract and linked it to Asghar et al.; the second review found Asghar et al. is a separate meta-analysis (25 studies, about 19 in 100). The claim says 'a minority of shoulders' and cites Asghar et al. and Schwarz and Hirtler; the IJHS abstract is no longer cited, and the coracohumeral ligament, which only it named as a common site, is no longer named.

## 9. §1.2 checks and deviations

- chest.pec_major: kind muscle, role group, parent of both heads, layer —: supported (two heads joining on the humerus).
- chest.pec_major_clavicular and chest.pec_major_sternocostal: kind head, target, surface: supported (most superficial muscle of the pectoral region). The split is supported by function claims; see the notes on the split.
- chest.pec_minor: deep: supported (deep only to the pectoralis major, which almost completely covers it).
- chest.serratus_anterior: surface with no outcrop note: NOT supported as stated; deviation D1.
- Region actions: every one of the eight has a performer: horizontal adduction (both heads), flexion (clavicular), extension (sternocostal, assist after the second review), adduction (sternocostal prime, clavicular assist), internal rotation (sternocostal prime, clavicular assist), protraction (pectoralis minor, serratus), depression (pectoralis minor), upward rotation (serratus). shoulder.extension now has no prime performer in the chest; no registry or content test requires one, and only prime rows drive the page's missing-action suggestion (client/src/lib/specialization/recommendations.ts:288).
- External member shoulders.anterior_deltoid: the listing rule holds on what this search saw. Kenhub (Q56) names the deltoid's anterior fibres with the clavicular pectoralis major as the prime flexors of the shoulder; Elsevier's clavicular-deltoid page lists flexion as a direct action (Q3); bench-press studies record anterior-deltoid activity that rises with incline (lww.chest_press_angles; pmid.33049982). No content is written for it here; its home is the shoulders.
- Contested placement: serratus anterior in the chest, listed by the shoulders (§1.2): no anatomy reason against. Suggested membership caveats for the shoulders lane are in membershipSuggestions.
- Abdominal part: IMAIOS describes a small abdominal part from the external oblique aponeurosis; TeachMeAnatomy and UW include that origin in the sternocostal head. §1.2's two heads hold; the sternocostal head carries a caveat.
- Parent and the shared content test: regionContent.test.ts:408-411 ('gives every muscle a main action, adjacent muscles aside') checks every node of kind 'muscle' that is not adjacent; chest.pec_major is kind 'muscle', role 'group', with no node action, so it fails as written. The upper arm's triceps raises the same question; the lane or the platform decides (a prime row on the parent, or exempting role 'group').

**Deviation D1: `chest.serratus_anterior` layer.** §1.2 says: surface (no outcrop note).

- kenhub.serratus_anterior (Q37, Q40): 'Its main part lies deep under the scapula and the pectoral muscles.'
- elsevier.serratus_anterior (Q37): 'deep to the scapula, the latissimus dorsi, trapezius, and subscapularis muscles ... posterior to the pectoralis major and minor muscles.'
- kenhub.serratus_anterior, gpnotebook.serratus_anterior (Q39, Q40): the lower slips lie between the pectoralis major and the latissimus dorsi on the side of the chest and can be seen and felt, often in athletic people; the inferior part is the most prominent (kenhub.serratus_anterior).
- Second review (SR24): an independent search returned the same: 'The main part of the serratus anterior lies deep to the scapula and the pectoral muscles and is easily palpated between the pectoralis major and latissimus dorsi muscles'; Elsevier: deep to the scapula, latissimus dorsi and trapezius; GPnotebook: the digitations are often seen and felt against the lateral thoracic wall.

Proposal: Record the serratus anterior as 'deep (surface outcrop, side view)' with surfaceVisibility 'partial', as §1.2 does for the infraspinatus and as the forearm does for APL (deep, partly at the surface). Consequence for §7.2 and §7.3: a view holding an outcrop needs the outcrop node's own layer, so the chest's Side view would need a deep layer (Side: surface, deep), or the belly is drawn whole on Front-deep and the outcrop on Side-surface with Side-deep added. Alternative, if the review keeps 'surface': the chest diagram note must say that only the lower slips are drawn and the part under the shoulder blade is not, and the shape note above already says most of the muscle has little or no contour of its own.

Status: Not applied. §1.2 is unchanged in this dossier; the node record keeps 'surface' and flags the deviation. Second review: the evidence for D1 holds, with DocCheck Flexikon removed as a source. Both readings are defensible: the main part lies deep, but the part at the surface is the lowest and strongest. Under D1 the chest's Side view (§7.2: Side: surface) would need a deep layer, since a view holding an outcrop must hold the outcrop node's own layer (§7.3). The anatomy lane and the adversarial review decide before the drawing lane starts.

## 10. For the review

- Sternocostal head shoulder.extension: changed to 'assist' by the second review (no reference calls it a main extensor). If the lane wants it 'prime' for the page's missing-action suggestions, that is a product choice to record as such, not an evidence finding.
- Serratus anterior layer: deviation D1 needs a decision before the drawing lane starts (§1.2 rows change only through an accepted deviation); the chest's Side view would need a deep layer under D1.
- surfaceVisibility 'variable' for the pectoralis major and its sternocostal head: the forearm used 'variable' for a muscle absent in some people; here it is used because breast tissue covers much of the muscle in many women. The review may prefer 'partial'.
- The regional-EMG claims on the two heads say the forward-raising difference was not measured. They are honest but may read as weakening the split; the review decides whether the page shows them.
- chest.pec_major has no prime node action and fails the shared 'every muscle a main action' test as written (see section12Checks).
- Membership caveats for the shoulders' listing of the two heads and the serratus are suggested in `membershipSuggestions` (dossier.json); the node text is neutral and the shoulders lane owns that wording (§1.3).
- Human review. A clinician or anatomist should read these claims before the chest's mapping version is published: publishing freezes reviewed claims (§8).

> "Reviewed" means an automated agent checked each sentence against web-search excerpts and generated summaries of the cited sources on the date shown. It was not checked against the full texts, and not by a clinician or anatomist. A second automated review, with the same tools and limits, looked for errors; it is not peer review.

## 11. Second review (19 Oct 2026)

**What this is.** An automated second review by a separate AI agent, with the same tools and the same limits as the first pass: web search only, page fetches refused, and search results that are generated summaries and can misquote. It looked for errors and corrected the dossier in place. It is not peer review, and it is not a review by a clinician or an anatomist; a human or full-text review is still worth having before the chest's version is published, since publishing freezes reviewed claims.

**What it did.** Checked every claim sentence by sentence against the excerpts in `citations`; re-searched, with its own queries, 4 of the 5 function claims (clavicular head, sternocostal head, pectoralis minor, serratus anterior; the pectoralis major group claim was corroborated by the same searches), all 7 selectivity claims and both variation claims (28 searches, SR1–SR28, each recorded with its excerpt and verdict in `secondReview.queries`); checked every source's key, URL, title, evidence type and note; and checked node fields, node actions, layers and outcrops against §1.2.

**Result.** 19 claims, all still reviewed; none sent to draft. 10 statements reworded so that each sentence says no more than its excerpts, with the disagreements found now stated in the wording. One node action changed: the sternocostal head's shoulder extension, from prime to assist. 4 sources added and 2 removed (44 became 46); 7 citations added and 2 removed (83 became 88). Independent results agreed with every re-searched claim except on three points, each resolved in the wording: Elsevier's wording on the sternocostal head and extension (summaries disagree, so the page is no longer cited for it either way); the bench-angle claims (a fourth study, Lauver et al. 2016, found a 15-degree decline equal to flat for the lower part and no whole-press difference between angles for the upper part); and the pectoralis minor's insertion (the first pass's prevalence source was a different and weaker work than it suspected). One plural, 'anatomy references name it ... as a main forward-raising muscle', was confirmed by no independent result and became 'one anatomy reference'. The shoulders' listing of the sternocostal head is unaffected: it stays prime for internal rotation and horizontal adduction, both shoulder region actions.

**The split of the pectoralis major.** Supported, on anatomy. The head-specific references (StatPearls, Kenhub, IMAIOS, the UW atlas, TeachMeAnatomy, the PMC case report) give the clavicular head forward raising and the sternocostal head the downward pull of a raised arm; one dissection guide (Loyola) lists no extension for either head. The function claims say so and the node actions rest on them. Muscle-activity evidence supports the sternocostal half (extension) and found no consistent difference between the heads in forward raising, and the claims say that plainly. With extension now 'assist', the heads still differ in their actions: flexion only on the clavicular head (prime), extension only on the sternocostal head (assist).

**Changes** (each with its reason and evidence in `secondReview.changes`):

- chest.pec_major_sternocostal × shoulder.extension: role 'prime' became 'assist'; note rewritten. *Why:* Prime vs assist was the first pass's open question. No reference consulted, in either pass, calls the head a main extensor: Kenhub says it 'facilitates', IMAIOS that it 'contributes', StatPearls lists it after the head's main work; an independent search described it as a synergist of the latissimus dorsi, teres major and back of the deltoid, and one Elsevier summary said 'assists'. The split does not need a prime row.
- chest.pec_major_sternocostal.function: 'it pulls the arm back down (extension). Two of the references consulted, a dissection guide and a quick reference, do not list that downward pull.' became 'it helps pull the arm back down (extension); two references describe its part as contributing to or facilitating that movement, and one dissection guide does not list it.' The Elsevier citation now supports bringing the arm across the chest only; TeachMeAnatomy added for the attachment on the upper-arm bone. *Why:* An independent search quoted Elsevier as 'assists in extension of the arm ... via its sternocostal head', contradicting 'does not list'; another summary was cut off; with summaries disagreeing, Elsevier cannot be cited either way. No excerpt on the claim supported the attachment to the upper-arm bone.
- chest.pec_major.function, the pectoralis major node's whatItDoes and second caveat, and the sternocostal node's whatItDoes: the sternocostal head 'brings' / 'pulls' a raised arm down became 'helps bring' / 'helps pull'. IMAIOS cited on chest.pec_major.function for the inner half of the collarbone. *Why:* Matches the assist role and the references' 'facilitates' and 'contributes'. The inner-half origin had no excerpt on this claim (TeachMeAnatomy says 'medial clavicle').
- chest.pec_major_clavicular.function: 'Anatomy references name it, with the front of the deltoid, as a main forward-raising muscle' became 'One anatomy reference names it ...'; 'With the sternocostal head it brings the arm across the chest, and it helps draw the arm in ... and turn it inward' became '... draws the arm in toward the body and turns it inward; references give these three actions to the muscle as a whole, and one dissection guide also lists drawing in for this head.' *Why:* Only Kenhub's shoulder-joint page names the clavicular head with the anterior deltoid as prime flexors; an independent search found no textbook passage saying so. The excerpts give horizontal adduction, adduction and inward turning to the whole muscle (Radiopaedia, Elsevier, Kenhub), and only Loyola gives adduction to this head.
- chest.pec_major_clavicular.selectivity.1: added Lauver et al. 2016 (14 trained men: no difference in upper-chest activity between a 15-degree decline, flat, 30 and 45 degrees over the whole press; both inclines higher during part of it). New source pmid.25799093. *Why:* A fourth bench-angle study found independently, bearing on whether incline raises upper-chest activity; the claim already said the studies do not fully agree, and now says how.
- chest.pec_major_clavicular.selectivity.2: removed 'The atlas therefore rests the clavicular head's forward-raising action on anatomy references, not on a measured difference in activity'; added 'This study therefore found no consistent difference between the heads in raising the arm forward'. The accounting sentence moved to notes.theHeadSplit. *Why:* A product accounting choice inside an experimental claim (the brief asks for accounting choices to be marked apart; the upper-arm second review made the same correction). The replacement sentence says only what the abstract found.
- chest.pec_major_sternocostal.selectivity.1: 'Bench-press studies found the sternocostal part most active on a flat bench' became 'Three of the four bench-press studies cited here found ...'; Lauver et al. 2016 added: the lower part was about as active on a 15-degree decline as flat, and decline, flat and 30 degrees all gave more than 45 degrees. *Why:* The first pass could not search the decline question. An independent study found decline equal to flat for the lower part, so 'studies found flat best' overgeneralised; the disagreement is now stated in the wording.
- chest.pec_major_sternocostal.selectivity.2: 'This fits the anatomy references' split between the two heads' became 'The extension result fits the anatomy references, which give pulling a raised arm back down to this head.' *Why:* Only the extension result bears on the split; adduction with the arm turned out and high-elevation inward turning are not head-specific actions in any reference.
- chest.pec_major_sternocostal.variation.1: new citation and source pamj.poland_syndrome for 'rare'; statpearls.poland_syndrome retitled 'StatPearls: Poland Syndrome (archived)' with authors and PubMed id in its note. *Why:* No excerpt on the claim said 'rare'. Bookshelf and PubMed list the cited StatPearls article as archived (historical reference only).
- chest.pec_minor.variation.1: 'in a minority of shoulders its tendon passes beyond the coracoid process to attach on structures over the top of the shoulder joint, such as the supraspinatus tendon or the coracohumeral ligament' became 'In a minority of shoulders, part or all of its tendon runs over the coracoid process instead of ending on it, and attaches on structures of the shoulder joint such as the supraspinatus tendon.' ijhs.pectoralis_minor_anomalous_insertion removed; springer.pectoralis_minor_ectopic_insertion (Asghar et al., meta-analysis of 25 studies) and plos.pectoralis_minor_ectopic_tendons (Schwarz and Hirtler 2019, tendon types) added. *Why:* No excerpt said the tendon passes beyond or over the coracoid. The IJHS abstract, the only support for the coracohumeral ligament, is in an open-access journal whose peer review this review could not confirm, and is not the Asghar meta-analysis the first pass suspected; a peer-reviewed meta-analysis with a similar pooled figure replaces it.
- chest.serratus_anterior.appearance: doccheck.serratus_anterior citation and source removed; the serratus node's outcropSupported and deviation D1's evidence no longer cite it. *Why:* DocCheck Flexikon is a user-edited medical wiki, in the class the standard never cites (Wikipedia); the upper-arm second review removed it for the same reason. The claim's sentences are all supported by Kenhub, GPnotebook, IMAIOS and Elsevier, and an independent search returned the same facts.
- chest.serratus_anterior.selectivity.1: 'Pushing the shoulder blade forward therefore loads the two together, and the atlas does not treat that work as serratus-only' became 'In all three exercises, then, pushing the shoulder blade forward worked the two muscles together.' *Why:* The removed clause is an accounting choice inside an experimental claim; 'therefore loads' generalised from three exercises to all protraction.
- chest.pec_minor.selectivity.1: 'against a wall and on the floor' became 'against a wall and from the knees on the floor'. *Why:* The floor version in the study is a modified knee push-up plus.
- Pectoralis major node shapeNote: 'Together its two heads make up most of the front contour' became 'may make up'; removed 'Which head shapes which part of that outline cannot be read exactly from the surface.' *Why:* Shape notes are qualified; no excerpt supports the removed sentence (the upper-arm second review removed the same sentence from the triceps).
- Serratus node shapeNote: 'they show mainly in athletic people' became 'they can often be seen in athletic people'. *Why:* Kenhub says the slips 'may be even visible' in athletic bodies and GPnotebook that they are 'often seen and felt ... particularly in young, athletic subjects'; neither says they show mainly in athletes.
- actions: all eight replaced by the definitions wave 0 has already landed in shared/specialization/actions/joints.ts (joint 'Shoulder' or 'Shoulder blade'); six of the first pass's proposed wordings differed and are kept in each note. *Why:* The dossier described the actions as still to be added; they exist, so the lane has nothing to add and its copy should match them.
- Sources: DOI for pmid.33049982; title, authors, volume and pages for pmid.14977678; Bookshelf and PubMed ids and authors for the StatPearls pectoralis major, thorax muscles and Poland syndrome articles; second-review notes on lww.chest_press_angles, bisp.bench_press_five_shoulder_muscles, pmid.35093733, pmid.26749459, pmid.27757809, cureus.pectoralis_minor_variations, gpnotebook.serratus_anterior and elsevier.pectoralis_major. Four sources added, two removed (44 became 46). The two pmc.chest_wall_flaps citation records now carry their claims' locators. *Why:* Independent searches confirmed details the first pass listed as unconfirmed, and found two that needed correcting (the archived StatPearls article; Elsevier's extension wording). The citation and claim locators for pmc.chest_wall_flaps differed.
- notes: theHeadSplit, singleSourceFunctionClaims, unconfirmedBibliographicDetails, disagreementsAndWording, section12Checks, policyQuestions and limits updated; deviation D1's status records the second review's view and the Side-view consequence. *Why:* To match the changes above, and to record that chest.pec_major fails the shared 'every muscle a main action' test as written (regionContent.test.ts:408-411).

**Copy checks.** No claim, node text, locator, qualification, action or source title contains a percentage, "per cent", a growth promise, the backend vendor, "table", "left" or "right"; "growth" appears only where a selectivity claim says it is not a measurement of growth. Source titles name reference publishers only, as the forearm's do. No Wikipedia citation remains; the one wiki-type source (DocCheck Flexikon) was removed.

**Left for the anatomy lane:**

- Sternocostal head × shoulder.extension is now 'assist'. If the lane wants 'prime' so the page names extension as a missing action for this head (only prime rows drive that, recommendations.ts:288), record it as a product choice; the evidence does not call the head a main extensor.
- Deviation D1 (serratus anterior layer): the evidence holds. Decide 'deep (surface outcrop, side view)' with a deep layer added to the chest's Side view, or keep 'surface' with a diagram note that only the lower slips are drawn.
- chest.pec_major (kind 'muscle', role 'group', no node action) fails regionContent.test.ts:408-411 as written: add a prime row on the parent or exempt role 'group' (the same question as the upper arm's triceps, and the deltoid and trapezius to come).
- The StatPearls Poland syndrome article is archived; the maintained 'Poland Syndrome in Children' (NBK560788) was not seen. Swap it in after a full-text read, or keep the archived one with its label.
- Glass and Armstrong 1997 (decline bench) is still unread; Lauver et al. 2016 now covers the decline question in part.
- surfaceVisibility 'variable' versus 'partial' for the pectoralis major and its sternocostal head (unchanged; the first pass's question).
- Whether the page shows the two regional-EMG claims, which say the forward-raising difference between the heads was not measured (unchanged; the first pass's question).
