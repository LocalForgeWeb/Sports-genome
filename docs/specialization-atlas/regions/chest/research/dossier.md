# Specialization atlas: chest anatomy and its evidence (19 Oct 2026)

What the chest content says, what it rests on, and how far that review can be trusted. This is the anatomy lane's dossier for the chest in wave B (10-multi-region.md §1.2, §1.3, §8). The machine-readable record, with every query and the excerpt relied on for each citation, is `dossier.json` beside this file; the search log, in query order, is `searchlog.md`. Nothing in the repository was changed. The method, limits and wording follow the forearm's (03-anatomy-evidence.md).

## 1. Method

**What was reviewed.** The five chest nodes of §1.2: the pectoralis major (a parent, neither drawn nor selectable), its clavicular and sternocostal heads, the pectoralis minor and the serratus anterior. Result: 19 claims owned by `chest` (5 function, 5 appearance, 7 selectivity, 2 variation), 12 node-action rows, 8 joint-action definitions (none exists in the forearm), 44 sources and 83 citations. The external member `shoulders.anterior_deltoid` was checked against the listing rule only; its content belongs to the shoulders.

**How.** Web search only, as for the forearm: page fetches are refused by the network proxy, so each claim was checked against what the search returned (titles, URLs, excerpts and generated summaries). For each claim:

1. Search for references in the standard's order: NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy pages (the University of Washington musculoskeletal atlas, the Loyola LUMEN dissector, a Washington University nerve-surgery page), Kenhub, Elsevier Complete Anatomy, Radiopaedia, IMAIOS. TeachMeAnatomy was used as the upper arm used it; two clinical references outside the list (GPnotebook, DocCheck Flexikon) were used once each, always beside Kenhub. Wikipedia was read and not cited; one exact-phrase search was run to find out where a quoted sentence came from (§8).
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
- **Search summaries can misquote, and one did.** A summary gave Wikipedia's wording about the sternocostal head as StatPearls'. It was caught by an exact-phrase search and StatPearls is not cited for it (§8). Function claims rest on six to nine references each, so no function claim depends on one summary.

## 3. Claims by node

All claims are `reviewed` on 19 Oct 2026; none is draft. Each line gives the claim, its kind and basis, then each source key with the locator cited.

### Pectoralis major `chest.pec_major` (muscle, group; node reviewed)

- Location: Front of the chest, at the surface: a fan from the collarbone, the breastbone and the upper rib cartilages to the upper-arm bone near the shoulder.
- What it does: Draws your arm in toward your body, turns it inward and brings it across your chest. Its upper (clavicular) head also raises the arm forward; its larger lower (sternocostal) head brings a raised arm back down.
- Shape note: Together its two heads make up most of the front contour of the chest, from the collarbone to the front fold of the armpit. Which head shapes which part of that outline cannot be read exactly from the surface. In many women breast tissue lies over much of it. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: A muscle with two heads, not a target itself: work is counted for the heads inside it. | The heads are shown apart because their actions differ: the upper head raises the arm forward, the lower head brings a raised arm back down.
- Aliases: pectoralis major, pec major, pecs. Short name `PecMajor`. Layer: — (§1.2; parent, neither drawn nor selectable; the TypeScript value follows the platform lane, the forearm's groups use 'mixed'). Visibility `variable`: Both heads are at the surface (teachmeanatomy.pectoral_region: the most superficial muscle of the pectoral region), but in many women breast tissue lies over much of the muscle between the second and sixth ribs (statpearls.mammary_gland; statpearls.pectoralis_major), so how much of it shows differs between people. 'partial', the forearm's value for its mixed-layer groups, would also fit; the review may prefer it.
- Database muscle: none. The canonical list holds the two heads (pectoralis_major_clavicular, pectoralis_major_sternocostal in shared/capabilityRank.ts), not the whole muscle, as for the triceps.

**`chest.pec_major.function`** · function · established_anatomy · reviewed

> The pectoralis major has two heads: a clavicular head from the inner half of the collarbone and a sternocostal head from the breastbone, the upper six rib cartilages and the tendon sheet of the outer abdominal muscle. Both attach to the upper-arm bone near the shoulder. Acting together they draw the arm in toward the body (adduction), turn it inward (internal rotation) and bring it across the chest. Acting apart, the clavicular head raises the arm forward (flexion) and the sternocostal head brings a raised arm back down (extension).

- kenhub.pectoralis_major (Function) — Seen through web-search excerpts of the page, not the full text.
- statpearls.pectoralis_major (Structure and Function) — Seen through web-search excerpts; the article's function list says 'sternoclavicular head' where the sternocostal head is meant.
- teachmeanatomy.pectoral_region (Pectoralis major: attachments and actions) — Seen through web-search excerpts of the page, not the full text.
- uw.pectoralis_major (Origin; Action) — Seen through web-search excerpts of the page, not the full text.
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

> The clavicular head starts on the front of the inner half of the collarbone. Acting on its own it raises the arm forward (shoulder flexion), especially from a position with the arm down or back; one reference says up to about 90 degrees. Anatomy references name it, with the front of the deltoid, as a main forward-raising muscle of the shoulder. With the sternocostal head it brings the arm across the chest, and it helps draw the arm in toward the body and turn it inward. One quick reference describes its part in raising the arm as assisting rather than main.

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

> Bench-press studies measured upper-chest activity at different bench angles and do not fully agree. In 15 men pressing at four angles, the clavicular head was more active at inclines of 44 and 56 degrees than on a flat bench. In 30 trained adults, the upper portion of the muscle was most active at a 30-degree incline, and above 45 degrees front-deltoid activity rose while the pectoralis major's performance fell. In an older study of 6 men, the clavicular head was no more active on an incline than on a flat bench, and less active on a decline. These are short-term activity measurements; they do not show which angle grows the muscle more.

- lww.chest_press_angles (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface EMG, 15 healthy men, seven tenths of one-repetition maximum. Abstract only.
- pmid.33049982 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 30 trained adults, six tenths of one-repetition maximum; reports an upper portion, not the clavicular head by name. Abstract only.
- bisp.bench_press_five_shoulder_muscles (Abstract) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Six men; library-record abstract seen in one search summary.

**`chest.pec_major_clavicular.selectivity.2`** · selectivity · experimental · reviewed

> In a high-density surface-EMG study of 29 healthy young women holding steady efforts in several directions, the clavicular, upper sternocostal and middle sternocostal regions were about equally active when pushing the arm forward or across the body; the one exception was pushing forward at a quarter of maximal force, where the clavicular region was more active than the upper sternocostal region. The atlas therefore rests the clavicular head's forward-raising action on anatomy references, not on a measured difference in activity. Neither finding is a measurement of growth.

- pmid.35093733 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Isometric ramp-and-hold tasks in 29 healthy young women; abstract only.

### Pectoralis major, sternocostal head `chest.pec_major_sternocostal` (head, target; node reviewed)

- Location: Middle and lower front of the chest, at the surface: from the breastbone, the upper six rib cartilages and the tendon sheet of the outer abdominal muscle to the upper-arm bone near the shoulder.
- What it does: Draws your arm in toward your body, turns it inward and brings it across your chest. From a raised position in front, it pulls the arm back down.
- Shape note: The larger part of the muscle; may contribute most of the contour of the middle and lower chest and of the front fold of the armpit. In many women breast tissue lies over much of it. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Drawing the arm in toward the body is shared with the latissimus dorsi and teres major of the back, so that work is not chest-only. | One reference describes a small third, abdominal part of the muscle; here it is counted with this head. | Some people are born without it on one side.
- Aliases: sternocostal head, sternal head, pars sternocostalis. Short name `PecStern`. Layer: surface. Visibility `variable`: At the surface over the breastbone and upper ribs and the larger part of the muscle (radiopaedia.pectoralis_major), but in many women breast tissue lies over much of it (statpearls.mammary_gland; statpearls.pectoralis_major), and a few people lack it (Poland syndrome; chest.pec_major_sternocostal.variation.1).
- Database muscle: `pectoralis_major_sternocostal`. Exists in the canonical list (shared/capabilityRank.ts); the database lane confirms.

**`chest.pec_major_sternocostal.function`** · function · established_anatomy · reviewed

> The sternocostal head is the larger part of the pectoralis major. It starts on the front of the breastbone, the cartilages of the upper six ribs and the tendon sheet of the outer abdominal muscle (the external oblique aponeurosis), and attaches to the upper-arm bone near the shoulder. Its main actions are drawing the arm in toward the body (adduction) and turning it inward (internal rotation), and with the clavicular head it brings the arm across the chest. From a raised position in front, it pulls the arm back down (extension). Two of the references consulted, a dissection guide and a quick reference, do not list that downward pull.

- statpearls.pectoralis_major (Structure and Function: sternocostal head) — Seen through web-search excerpts; the article's function list says 'sternoclavicular head' for this head.
- imaios.pectoralis_major (Sternocostal head: origin, primary actions and contribution to extension) — Seen through web-search excerpts of the page, not the full text.
- kenhub.pectoralis_major (Function: the sternocostal part acting independently) — Seen through web-search excerpts of the page, not the full text.
- uw.pectoralis_major (Origin; Action: the lower fibres acting alone) — Seen through web-search excerpts of the page, not the full text.
- pmc.hypogenic_pectoralis_major (Background anatomy) — A case report; cited only for the textbook anatomy in its background.
- radiopaedia.pectoralis_major (Gross anatomy: the sternocostal portion; action of the whole muscle) — Seen through a mirror of the page, as a web-search excerpt.
- loyola.pectoralis_major (Action: sternal head) — Lists adduction and medial rotation only; cited for that difference between references.
- elsevier.pectoralis_major (Quick Facts: Action) — Lists no extension; cited for that difference between references.

**`chest.pec_major_sternocostal.appearance`** · appearance · anatomical_inference · reviewed

> The sternocostal head is the larger, lower part of the pectoralis major, at the surface over the upper ribs from the breastbone outward; the muscle's outer edge, which forms the front fold of the armpit, lies along this part. It may contribute most of the contour of the middle and lower chest and of that fold. In many women breast tissue, which lies on the muscle between the second and sixth ribs, covers much of it. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- radiopaedia.pectoralis_major (Gross anatomy: the sternocostal portion is most of the muscle) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- teachmeanatomy.pectoral_region (Pectoralis major: attachments) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- pmc.chest_wall_flaps (Pectoralis major flap: anatomy (the outer edge forms the front fold of the armpit)) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. That this edge lies along the sternocostal head is inferred from where the head lies.
- statpearls.mammary_gland (Structure: extent and base on the pectoral fascia) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- statpearls.pectoralis_major (Structure and Function: beneath the breast tissue) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.

**`chest.pec_major_sternocostal.selectivity.1`** · selectivity · experimental · reviewed

> Bench-press studies found the sternocostal part most active on a flat bench. In 15 men it was more active flat than at inclines of 28, 44 and 56 degrees; in 30 trained adults the middle and lower portions of the muscle were most active with no incline; and in an older study of 6 men it was more active on a flat bench than on a decline. These are short-term activity measurements; they do not show which bench angle grows the muscle more.

- lww.chest_press_angles (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface EMG, 15 healthy men, seven tenths of one-repetition maximum. Abstract only.
- pmid.33049982 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 30 trained adults; reports middle and lower portions, not the sternocostal head by name. Abstract only.
- bisp.bench_press_five_shoulder_muscles (Abstract) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Six men; library-record abstract seen in one search summary.

**`chest.pec_major_sternocostal.selectivity.2`** · selectivity · experimental · reviewed

> In a high-density surface-EMG study of 29 healthy young women holding steady efforts, the middle sternocostal region was more active than the clavicular and upper sternocostal regions, from about an eighth more to about twice as active, when pulling the arm down and back (extension), when drawing it in with the arm turned out, and when turning it inward with the arm raised high. This fits the anatomy references' split between the two heads. It is short-term activity measured in women only, not a measurement of growth.

- pmid.35093733 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Isometric ramp-and-hold tasks in 29 healthy young women; abstract only.

**`chest.pec_major_sternocostal.variation.1`** · variation · established_anatomy · reviewed

> Some people are born without the sternocostal head of the pectoralis major, usually on one side only. This is the most common feature of Poland syndrome, a rare condition in which the pectoralis minor, ribs, breast and hand on the same side may also be underdeveloped; it is reported more often in males.

- statpearls.poland_syndrome (Introduction) — Seen through web-search excerpts of the page, not the full text. The epidemiology section was not seen; incidence figures differ widely between sources, so none is given.
- radiopaedia.poland_syndrome (Clinical presentation; case discussion) — Seen through a mirror of the page and two case pages, as web-search excerpts.

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

> In a study of 26 healthy people that recorded the serratus anterior with surface electrodes and the pectoralis minor with fine wires, a forward punching movement (the serratus punch) activated the serratus anterior more than the pectoralis minor, while two push-up-plus variations, against a wall and on the floor, activated the two about equally. Every exercise activated the pectoralis minor to some degree. This is short-term activity in healthy people, not a measurement of growth.

- pmid.26749459 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. 26 healthy subjects; fine-wire EMG of the pectoralis minor. Abstract only.

**`chest.pec_minor.variation.1`** · variation · established_anatomy · reviewed

> Where the pectoralis minor attaches varies between people. Its rib origin differs (from the second to fourth ribs in some people and the third and fourth in others, against the usual third to fifth), and in a minority of shoulders its tendon passes beyond the coracoid process to attach on structures over the top of the shoulder joint, such as the supraspinatus tendon or the coracohumeral ligament.

- cureus.pectoralis_minor_variations (Abstract) — Systematic review of cadaveric and imaging reports; abstract portion only.
- ijhs.pectoralis_minor_anomalous_insertion (Abstract: pooled prevalence) — Pooled cadaveric studies; abstract as summarised, authors and year not confirmed.

### Serratus anterior `chest.serratus_anterior` (muscle, target; node reviewed)

- Location: Side of the chest: from the upper eight or nine ribs back around the rib cage, mostly under the shoulder blade, to the shoulder blade's inner edge; its lower slips lie at the surface below the armpit.
- What it does: Moves your shoulder blade forward around the rib cage, as when you push your arms forward, and turns it so you can raise your arm overhead. It holds the shoulder blade against the rib cage.
- Shape note: Its lower slips may contribute to a ridged contour along the ribs on the side of the chest below the armpit, between the chest muscle and the latissimus dorsi; they show mainly in athletic people. Most of the muscle lies under the shoulder blade and the chest muscles, where it has little or no contour of its own. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
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
- doccheck.serratus_anterior (Pars inferior) — German-language encyclopaedia entry seen through a web-search summary.

**`chest.serratus_anterior.selectivity.1`** · selectivity · experimental · reviewed

> In a study of 26 healthy people, a forward punching movement (the serratus punch) activated the serratus anterior more than the pectoralis minor, while two push-up-plus variations activated the two about equally, and the pectoralis minor was active in every exercise. Pushing the shoulder blade forward therefore loads the two together, and the atlas does not treat that work as serratus-only. This is short-term activity, not a measurement of growth.

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
| `chest.pec_major_sternocostal` | `shoulder.extension` | prime | `chest:chest.pec_major_sternocostal.function` | Only from a raised position in front back toward the side (StatPearls: extension of a flexed arm; Kenhub: pulling it downwards; UW; IMAIOS 'contributes'). The shared action's description also covers moving the arm behind the body, which no source gives this head. IMAIOS's word 'contributes' would support 'assist'; prime is chosen because it is the head-specific action the split rests on and regional EMG found the middle sternocostal region most active in extension. Flagged for review. |
| `chest.pec_minor` | `scapula.protraction` | prime | `chest:chest.pec_minor.function` |  |
| `chest.pec_minor` | `scapula.depression` | prime | `chest:chest.pec_minor.function` | Elsevier says it 'assists in depressing'; StatPearls (thorax muscles) says it primarily depresses the shoulder; Kenhub says it can forcefully depress the scapula. |
| `chest.serratus_anterior` | `scapula.protraction` | prime | `chest:chest.serratus_anterior.function` |  |
| `chest.serratus_anterior` | `scapula.upward_rotation` | prime | `chest:chest.serratus_anterior.function` |  |

Every region action of §1.2 has a performer. Not listed, and why:

- `chest.serratus_anterior` · scapula.depression: Only one cited reference gives it, and as a possible action of the lowest fibres (wustl.serratus_anterior: 'may depress'; Brookbush and LearnMuscles, not cited, say the same); Kenhub summaries were inconsistent about which part pulls down. Left out under the forearm's rule for weak or disputed extras (03-anatomy-evidence.md §6); said in the function claim and a caveat.
- `chest.pec_minor` · scapula.downward_rotation: Supported (Elsevier, Kenhub) but not a chest region action (§1.2; the back owns it). Said in the claim and a caveat. If the review wants it, the back's action id exists in §1.2 and the row would be 'assist'.
- `chest.pec_major` · (any): Parent node, neither drawn nor selectable (§1.2, §7.3): its actions are declared on the two heads, as the upper arm does for the triceps group. A generic test like the forearm's 'every muscle has a prime action' must skip parents (the pectoralis major is kind 'muscle').
- `chest.pec_major_* (both heads)` · scapula.depression / scapula.protraction: UW and TeachMeAnatomy say the pectoralis major draws the scapula forward and down; it attaches to the upper-arm bone, not the shoulder blade, so the effect is through the arm. Listing it would offer the pectoralis major as a shoulder-blade target.
- `chest.serratus_anterior` · shoulder.flexion: StatPearls says protraction 'allows for anteversion of the arm'; that is a shoulder-blade action that helps the arm forward, not a shoulder-joint action of the serratus.
- `chest.pec_minor, chest.serratus_anterior` · (breathing): Both can help lift ribs in forced breathing; there is no action id and it moves no load. Said in the pectoralis minor's claim.

## 5. Joint actions this region needs

None of the eight chest actions exists in the forearm's list. Wave 0 adds every §1.2 region action to the shared library, so these are proposed wordings for one shared definition each; flexion and extension repeat the upper-arm dossier's wording word for word.

- `shoulder.horizontal_adduction` · Shoulder (glenohumeral joint) · **Horizontal adduction**: "With the arm raised to shoulder height, brings it forward and across the front of the chest." (Shared with the shoulders (§1.2); proposed wording for the shared library.)
- `shoulder.flexion` · Shoulder (glenohumeral joint) · **Shoulder flexion**: "Raises the arm forward and up in front of the body." (Word for word as the upper-arm dossier proposed; one definition in the shared library.)
- `shoulder.extension` · Shoulder (glenohumeral joint) · **Shoulder extension**: "Brings the arm down and back from in front of the body, and on behind it." (Word for word as the upper-arm dossier proposed. The sternocostal head does only the first half (down from in front); its node action says so.)
- `shoulder.adduction` · Shoulder (glenohumeral joint) · **Shoulder adduction**: "Brings the arm down and in toward the side of the body." (Shared with the back (§1.2); proposed wording.)
- `shoulder.internal_rotation` · Shoulder (glenohumeral joint) · **Internal rotation**: "Turns the upper arm inward, so the forearm swings in toward the body (with the elbow bent)." (Shared with the shoulders (§1.2); proposed wording, following the forearm's 'with the elbow bent' convention for rotations.)
- `scapula.protraction` · Shoulder blade (scapulothoracic) · **Shoulder-blade protraction**: "Moves the shoulder blade forward around the rib cage, away from the spine, as when pushing the arms forward." (Chest only in §1.2; proposed wording.)
- `scapula.depression` · Shoulder blade (scapulothoracic) · **Shoulder-blade depression**: "Draws the shoulder blade down, away from the ear and toward the hip." (Shared with the back (§1.2); proposed wording.)
- `scapula.upward_rotation` · Shoulder blade (scapulothoracic) · **Upward rotation**: "Turns the shoulder blade so the shoulder socket faces upward, which lets the arm be raised above shoulder height." (Shared with the shoulders and back (§1.2); proposed wording. The socket-faces-up wording is the usual definition; no claim cites it.)

## 6. Sources, single-source claims and unconfirmed details

44 sources, every one cited by at least one claim. Keys, URLs, titles and notes are in `dossier.json`; the notes say exactly what the search showed and what it could not confirm.

**Single-source claims.**

- None. Each of the five function claims rests on six or more references: chest.pec_major (7), chest.pec_major_clavicular (9), chest.pec_major_sternocostal (8), chest.pec_minor (6), chest.serratus_anterior (9).
- Non-function claims resting on one source: chest.pec_major_clavicular.selectivity.2 and chest.pec_major_sternocostal.selectivity.2 (both pmid.35093733), chest.pec_minor.selectivity.1 and chest.serratus_anterior.selectivity.1 (both pmid.26749459), chest.serratus_anterior.selectivity.2 (pmid.14977678). Each study's abstract was seen in two or three independent search summaries that agreed.

**Unconfirmed bibliographic details.**

- statpearls.pectoralis_major: authors and update date not shown; the listing's title reads 'Anatomy, Thorax, Pectoralis Major Major'; its function list says 'Sternoclavicular head' for the sternocostal head.
- statpearls.pectoral_muscles, statpearls.thorax_muscles, statpearls.serratus_anterior, statpearls.scapular_winging, statpearls.poland_syndrome, statpearls.mammary_gland: authors not shown; for the serratus and winging, summaries did not always say which StatPearls article a sentence came from.
- lww.chest_press_angles (Trebs et al. 2010): PubMed id not confirmed; 20508462 is a different study.
- pmid.33049982 (Rodríguez-Ridao et al. 2020): DOI and full author list not shown.
- bisp.bench_press_five_shoulder_muscles (Barnett et al. 1995): the record lists Kippers, Turner and Barnett; PubMed id and DOI not seen; abstract seen in one summary only.
- pmid.26749459 (Castelein et al. 2016): DOI not shown; the letter to the editor (PubMed 27133020) was not read.
- pmid.14977678 (Ludewig et al. 2004): volume, pages and full author list not shown.
- cureus.pectoralis_minor_variations (AlHarbi 2023): journal read from the PDF host; volume, article number and the author's full name not shown.
- ijhs.pectoralis_minor_anomalous_insertion: authors and year not shown; whether it is the same work as Asghar et al. 2021 (Surgical and Radiologic Anatomy 43(5):631–643) not confirmed.
- pmid.27757809 (Webb et al.): year 2018 from one listing; DOI read from a Springer URL only.
- pmc.chest_wall_flaps and pmc.hypogenic_pectoralis_major: authors and journals not shown.
- radiopaedia.pectoralis_major, radiopaedia.serratus_anterior, radiopaedia.poland_syndrome: seen through mirrors of the pages (images.radiopaedia.org, a static-assets host); the canonical radiopaedia.org URLs are recorded.
- imaios.pectoralis_major and imaios.serratus_anterior: seen through the imaios.cn mirror, with imaios.com pages for the clavicular head, the pectoralis minor and the axillary fold.
- gpnotebook.serratus_anterior, doccheck.serratus_anterior, wustl.serratus_anterior: authors and dates not shown; GPnotebook and DocCheck are outside the standard's list and are cited only beside Kenhub; the WUSTL page is a university page.

## 7. The split of the pectoralis major

- Supported by the function claims. Head-specific actions are named by StatPearls (NBK525991), Kenhub (two pages), IMAIOS, the UW atlas, TeachMeAnatomy and the PMC case report: the clavicular head flexes the arm, the sternocostal head extends a flexed arm; together they adduct and turn the arm inward. Loyola and Elsevier name no extension, and Elsevier calls the clavicular head's flexion 'assisting': the claims say so.
- Muscle-activity evidence supports half of the split clearly. In isometric tasks (pmid.35093733) the middle sternocostal region was much more active than the clavicular region in extension and in adduction with the arm turned out, but in forward and horizontal flexion the three regions were about equally active, except forward pushing at a quarter of maximal force, where the clavicular region was more active than the upper sternocostal region. Bench-press studies disagree on whether an incline raises clavicular activity (lww.chest_press_angles yes at 44 and 56 degrees; pmid.33049982 most at 30 degrees; bisp.bench_press_five_shoulder_muscles no). The split therefore stands on anatomy, and the claims say that the forward-raising difference is not a measured difference in activity.

## 8. Disagreements between sources, and how the wording handles them

- Clavicular head in raising the arm: main (IMAIOS 'primary action'; Kenhub 'prime flexors' with the anterior deltoid; StatPearls; UW; TeachMeAnatomy) against 'assists' (Elsevier) and 'secondary' for the whole muscle (Radiopaedia). The claim says one quick reference calls it assisting; the node action is prime.
- Sternocostal head bringing the arm down: named by StatPearls, Kenhub, UW, IMAIOS ('contributes') and the PMC case report; not listed by Loyola or Elsevier. The claim says two references do not list it. The node action is prime, flagged for review ('assist' is defensible from IMAIOS's word).
- Misattributed wording caught: one summary (Q11) attributed 'the muscle fibers attaching to the sternocostal head permit the horizontal and vertical adduction, extension, and internal rotation' to StatPearls; an exact-phrase search (Q62) found it is Wikipedia's wording. StatPearls is not cited for horizontal adduction; Radiopaedia ('bring the humerus across the chest') and Elsevier ('transversely adducts') carry it, with regional EMG beside them.
- Kenhub video transcript says the pectoralis major turns the arm outward; Kenhub's written pages and every other reference say inward. The video is not cited.
- Decline bench: Barnett et al. found the sternocostal head more active flat than on a decline. A 1997 study (Glass and Armstrong) is often cited for the opposite; it could not be searched (budget), so the claim states only what the three cited studies found and makes no decline recommendation.
- Serratus anterior pulling the shoulder blade down: 'may' for the lowest fibres (WUSTL; Brookbush, not cited), stated flatly by LearnMuscles (not cited); one Kenhub summary said the superior part pulls the scapula down while the German Kenhub page says the superior part elevates it. No node action; the claim says 'one reference says its lowest fibres may help'.
- Serratus rib count: first to eighth (TeachMeAnatomy, StatPearls), first to ninth (Elsevier), eighth or ninth (Kenhub, Radiopaedia). The claims say 'eight or nine'.
- Pectoralis minor depression: 'assists' (Elsevier) against 'primarily depresses the shoulder' (StatPearls thorax muscles) and 'can forcefully depress' (Kenhub). Node action prime, noted.
- Pectoralis minor innervation was given inconsistently by Kenhub pages; not used.
- Poland syndrome incidence: figures differ widely between sources (StatPearls' own figure not seen), so the variation claim says 'rare' and gives no figure; side preference is not stated (copy never names a side).

## 9. §1.2 checks and deviations

- chest.pec_major: kind muscle, role group, parent of both heads, layer —: supported (two heads joining on the humerus).
- chest.pec_major_clavicular and chest.pec_major_sternocostal: kind head, target, surface: supported (most superficial muscle of the pectoral region). The split is supported by function claims; see the notes on the split.
- chest.pec_minor: deep: supported (deep only to the pectoralis major, which almost completely covers it).
- chest.serratus_anterior: surface with no outcrop note: NOT supported as stated; deviation D1.
- Region actions: every one of the eight has a performer: horizontal adduction (both heads), flexion (clavicular), extension (sternocostal), adduction (sternocostal prime, clavicular assist), internal rotation (sternocostal prime, clavicular assist), protraction (pectoralis minor, serratus), depression (pectoralis minor), upward rotation (serratus).
- External member shoulders.anterior_deltoid: the listing rule holds on what this search saw. Kenhub (Q56) names the deltoid's anterior fibres with the clavicular pectoralis major as the prime flexors of the shoulder; Elsevier's clavicular-deltoid page lists flexion as a direct action (Q3); bench-press studies record anterior-deltoid activity that rises with incline (lww.chest_press_angles; pmid.33049982). No content is written for it here; its home is the shoulders.
- Contested placement: serratus anterior in the chest, listed by the shoulders (§1.2): no anatomy reason against. Suggested membership caveats for the shoulders lane are in membershipSuggestions.
- Abdominal part: IMAIOS describes a small abdominal part from the external oblique aponeurosis; TeachMeAnatomy and UW include that origin in the sternocostal head. §1.2's two heads hold; the sternocostal head carries a caveat.

**Deviation D1: `chest.serratus_anterior` layer.** §1.2 says: surface (no outcrop note).

- kenhub.serratus_anterior (Q37, Q40): 'Its main part lies deep under the scapula and the pectoral muscles.'
- elsevier.serratus_anterior (Q37): 'deep to the scapula, the latissimus dorsi, trapezius, and subscapularis muscles ... posterior to the pectoralis major and minor muscles.'
- kenhub.serratus_anterior, gpnotebook.serratus_anterior, doccheck.serratus_anterior (Q39, Q40, Q35): the lower slips lie between the pectoralis major and the latissimus dorsi on the side of the chest and can be seen and felt, often in athletic people; the inferior part is the most prominent.

Proposal: Record the serratus anterior as 'deep (surface outcrop, side view)' with surfaceVisibility 'partial', as §1.2 does for the infraspinatus and as the forearm does for APL (deep, partly at the surface). Consequence for §7.2 and §7.3: a view holding an outcrop needs the outcrop node's own layer, so the chest's Side view would need a deep layer (Side: surface, deep), or the belly is drawn whole on Front-deep and the outcrop on Side-surface with Side-deep added. Alternative, if the review keeps 'surface': the chest diagram note must say that only the lower slips are drawn and the part under the shoulder blade is not, and the shape note above already says most of the muscle has little or no contour of its own.

Status: Not applied. §1.2 is unchanged in this dossier; the node record keeps 'surface' and flags the deviation.

## 10. For the review

- Sternocostal head shoulder.extension: prime or assist (see node action note).
- Serratus anterior layer: deviation D1 needs a decision before the drawing lane starts (§1.2 rows change only through an accepted deviation).
- surfaceVisibility 'variable' for the pectoralis major and its sternocostal head: the forearm used 'variable' for a muscle absent in some people; here it is used because breast tissue covers much of the muscle in many women. The review may prefer 'partial'.
- The regional-EMG claims on the two heads say the forward-raising difference was not measured. They are honest but may read as weakening the split; the review decides whether the page shows them.
- Membership caveats for the shoulders' listing of the two heads and the serratus are suggested in `membershipSuggestions` (dossier.json); the node text is neutral and the shoulders lane owns that wording (§1.3).
- Human review. A clinician or anatomist should read these claims before the chest's mapping version is published: publishing freezes reviewed claims (§8).

> "Reviewed" means an automated agent checked each sentence against web-search excerpts and generated summaries of the cited sources on the date shown. It was not checked against the full texts, and not by a clinician or anatomist. The second automated review that §8 describes has not yet been run on this dossier.
