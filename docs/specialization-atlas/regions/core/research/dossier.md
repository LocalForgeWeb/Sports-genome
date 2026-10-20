# Specialization atlas: core anatomy and its evidence (19 Oct 2026)

What the core content says, what it rests on, and how far that review can be trusted. This is the anatomy lane's first-pass dossier for the core in wave C (10-multi-region.md §1.2, §1.3, §2, §8). The machine-readable record, with every query and the excerpt relied on for each citation, is `dossier.json` beside this file; the search log, in query order, is `searchlog.md`. Nothing in the repository was changed. The method, limits and wording follow the forearm's (03-anatomy-evidence.md).

## 1. Method

**What was reviewed.** The four core nodes of §1.2, all muscles and all targets: the rectus abdominis (one node, drawn in segments), the external oblique, the internal oblique and the transversus abdominis. The core is a midline region (§2): no node has a side, and every muscle is counted once. None of the four is a parent, so each has its own function claim and node actions. The external member `back.quadratus_lumborum` was not researched (it is the back's; no core claim needs it). Result: 18 claims owned by `core` (4 function, 4 appearance, 8 selectivity, 2 variation), 11 node-action rows, 4 joint actions (all already in the shared library; none new), 27 sources and 41 citations.

**How.** Web search only, as for the forearm: page fetches are refused by the network proxy, so each claim was checked against what the search returned (titles, URLs, excerpts and generated summaries). For each claim:

1. Search for references in the standard's order: NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy pages, Kenhub, Elsevier Complete Anatomy, Radiopaedia, IMAIOS. StatPearls returned only its abdominal-wall chapter's introduction and layer list, so it is cited for layer order only; the National Library of Medicine's MeSH definition of the rectus abdominis (which quotes Gray's Anatomy) and TeachMeAnatomy were added, as the upper arm and chest used TeachMeAnatomy. Wikipedia was returned and read, never cited; no user-edited wiki is cited.
2. Add each relied-on reference as a source keyed `<publisher>.<topic>` or `pmid.<number>` (where a PubMed id appeared in the results; for pmid.16649890 only in secondary citations), with a note saying exactly what the search showed and what it could not confirm.
3. Cite it with a locator and, where the source is limited, a qualification (abstract only, acute EMG, search excerpt, location only, mirror).
4. Mark the claim `reviewed` only when the recorded excerpts supported every sentence, with `reviewedAt: "2026-10-19"` and the note "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist." Appearance claims carry the forearm's inference wording.
5. A node is `reviewed` only when every function claim on it is.

Wording was then cut back until each sentence said no more than its excerpts. Where references disagree (the transversus abdominis and turning the trunk; upper versus lower rectus abdominis), the claim says so. The build script checks the content against the copy rules the tests hold (no left or right, no percentages, no "optimal" or "guarantee", no growth promise, no vendor or product name, no "table"), the claim-id form, the review-note wording, one citation record per claim source, unique labels, that every node action rests on a function claim of its own node, and that every muscle has a prime action.

## 2. Limits

- **Web search only.** This lane ran 50 web searches (Q1-Q50) on 19-20 Oct 2026; none was refused. Page fetches were not attempted (refused by the proxy for these hosts, as recorded in 10-multi-region.md §8). The full log, with every query and the excerpt text, is searchlog.md beside this file.
- **Excerpts, not full texts.** StatPearls showed only its introduction and layer list; Radiopaedia's transversus abdominis page was seen at an images.radiopaedia.org address and IMAIOS through the imaios.cn mirror; the MeSH definition through university research-profile mirrors; every study as an abstract or a summary of one. Each citation says so.
- **Search summaries can misquote.** Every function claim rests on four or five references, so none depends on one summary. Where a summary drew on several pages of one publisher (Kenhub on the rectus abdominis's location), the citation says so.
- **'Reviewed' means** an automated agent checked each sentence against web-search excerpts and generated summaries on 19 Oct 2026; not the full texts, and not a clinician or anatomist. A second automated review has not yet been run on this dossier.
- **Nothing here is hypertrophy evidence.** The selectivity claims cite acute EMG; each says it is short-term activity, not growth, and none sets a credit weight.

## 3. Claims by node

All claims are `reviewed` on 19 Oct 2026; none is draft. Each line gives the claim, its kind and basis, then each source key with the locator cited and its qualification.

### Rectus abdominis `core.rectus_abdominis` (muscle, target; node reviewed)

- Location: Front of the abdomen, at the surface: one strap on each side of the midline, from the pubic bone up to the lower end of the breastbone and the lower ribs.
- What it does: Bends your trunk forward, curling the ribs toward the pelvis, mostly through the lower back. It also helps press on the contents of the abdomen.
- Shape note: May contribute to the front contour of the abdomen. Tendinous bands divide it into segments that can show beneath the skin when body fat is low; the number of bands, and so of segments, differs between people. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Drawn in segments, but it is one muscle: work is counted for the whole muscle. | Studies disagree on whether exercises can work its upper and lower parts differently.
- Aliases: rectus abdominis muscle, rectus, abs, six-pack muscle. Short name `RA`. Catalog key: abs.
- Layer `surface` (§1.2): §1.2 'surface': supported (Kenhub: on the anterior surface of the abdominal wall). It lies inside the rectus sheath, whose front wall is the tendon sheets of the side muscles (imaios.rectus_abdominis), and the small pyramidalis lies in front of its lowest part (elsevier.rectus_abdominis); neither is a muscle belly over it, so 'surface' holds. §1.2's 'one node (drawn in segments)' matches the anatomy: the tendinous intersections divide one muscle.
- Visibility `clear`: A surface muscle at the front of the abdomen (kenhub.rectus_abdominis, imaios.rectus_abdominis); Kenhub says it is clearly visible beneath the skin in people with low body fat. Body fat hides it in many people, as for every surface muscle; the shape note says so. 'variable' would also be defensible if the lane reads visibility as dependent on body fat.
- Database muscle: `rectus_abdominis`. Seen in the recorded database fixture (server/fixtures/liveMuscleAggregation.ts: 'Rectus abdominis', muscle_group 'abdominals') and in shared/capabilityRank.ts; the database lane confirms.

**`core.rectus_abdominis.function`** · function · established_anatomy · reviewed

> The rectus abdominis bends the trunk forward by flexing the spine, mainly its lower (lumbar) part. It also helps compress the contents of the abdomen.

- nlm.mesh_rectus_abdominis (Scope note) — A controlled-vocabulary definition quoting Gray's Anatomy; seen on a university mirror of the record.
- kenhub.rectus_abdominis (Function) — Seen through web-search excerpts of the page, not the full text.
- imaios.rectus_abdominis (Function) — Seen through the imaios.cn mirror, as a web-search excerpt; two IMAIOS entries, not told apart by the summary.
- elsevier.rectus_abdominis (Quick Facts: Action) — Seen through web-search excerpts of the page, not the full text.

**`core.rectus_abdominis.appearance`** · appearance · anatomical_inference · reviewed

> The rectus abdominis lies at the surface of the front of the abdomen, one strap on each side of the midline band (linea alba), from the pubic bone up to the lower end of the breastbone and the cartilages of the fifth to seventh ribs. It sits inside a sheath formed by the tendon sheets of the other abdominal muscles. Tendinous bands cross it, usually three, at about the level of the lower end of the breastbone, the navel and midway between them, and divide it into segments; in people with low body fat these segments can show beneath the skin. It may therefore contribute to the front contour of the abdomen. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- kenhub.rectus_abdominis (Overview; tendinous intersections; surface view) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. The lines came in summaries drawing on several Kenhub pages; this page heads both result lists.
- imaios.rectus_abdominis (Origin and insertion; rectus sheath; tendinous intersections) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. Seen through the imaios.cn mirror.

**`core.rectus_abdominis.selectivity.1`** · selectivity · experimental · reviewed

> Whether exercises can work the upper and lower parts of the rectus abdominis differently is unsettled. In a surface-EMG study of 33 people, curl-ups produced more activity in the upper part among those who performed them correctly, and a backward pelvic-tilt exercise worked the lower part harder than curl-ups only in one subgroup; those who performed the exercises poorly activated both parts about equally. In a pilot study of 8 adults doing 6 abdominal exercises, the upper and lower parts showed no significant difference in any exercise. Neither study measured growth.

- pmid.8976314 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Nonrandomized trial, convenience sample; abstract only.
- pmid.12930172 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. A pilot study of eight adults; abstract only.

**`core.rectus_abdominis.selectivity.2`** · selectivity · experimental · reviewed

> In a surface-EMG study of 21 adults, the upper and lower rectus abdominis were most active in roll-outs, pikes and knee-ups on a wheeled device, hanging knee-ups with straps, and reverse crunches on a 30-degree incline, among the exercises compared. The same exercises were also the most effective at activating muscles outside the abdomen. This is short-term muscle activity, not growth.

- pmid.16649890 (Abstract: Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface electrodes; abstract only, seen through a search summary.

**`core.rectus_abdominis.selectivity.3`** · selectivity · experimental · reviewed

> In an EMG study of 12 adults holding five plank variations, planks performed on instability devices produced more activity in the rectus abdominis, the external oblique and the lower-back extensors than an ordinary stable plank. This is short-term muscle activity during a hold, not growth.

- bisp.plank_instability_emg (Abstract: Purpose, Methods and Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Twelve healthy adults; abstract only, seen through a search summary; the devices are not named in the excerpt.

**`core.rectus_abdominis.variation.1`** · variation · established_anatomy · reviewed

> The number of tendinous bands across the rectus abdominis differs between people. In two cadaver studies most had three, while others had one, two, four or five, and incomplete bands below the navel were also described.

- jcdr.tendinous_intersections (Abstract: Results) — A cadaver series from one population, described by its authors as small; abstract only.
- durham.tendinous_intersections (Abstract: Results) — A cadaver series of 82 muscles; abstract only, seen through a repository record.

**`core.rectus_abdominis.variation.2`** · variation · established_anatomy · reviewed

> The width of the midline band between the two sides of the rectus abdominis differs between people. In an ultrasound study of 933 women in early pregnancy, it was wider on average in women who had been pregnant before than in those who had not, and a gap wider than five centimetres was rare. In that study a moderately wide gap did not seem to explain back pain at the population level.

- pmc.rectus_diastasis_finnish_women (Abstract: Methods, Results and Conclusions) — Women in early pregnancy at one hospital, measured once by ultrasound; abstract only.

### External oblique `core.external_oblique` (muscle, target; node reviewed)

- Location: Side and front of the abdomen, at the surface: from the outer faces of the lower eight ribs to the crest of the hip bone, the pubic bone and the midline band.
- What it does: With both sides working, bends your trunk forward and presses on the abdomen. With one side working, bends the trunk to that side and turns it toward the other side.
- Shape note: May contribute to the contour of the side of the waist and, where its slips interlock with the serratus anterior, of the lower ribs at the side of the chest. Toward the front it becomes a thin tendon sheet, which is not muscle bulk. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Twisting work loads it together with the internal oblique of the other side, which turns the trunk the same way; how the work splits between them is not known.
- Aliases: external abdominal oblique, obliquus externus abdominis, outer oblique. Short name `EO`. Catalog key: obliques.
- Layer `surface` (§1.2): §1.2 'surface': supported by three references. For the drawing lane: its belly is at the side; the part in front of the rectus abdominis is tendon sheet, drawn as structure or not at all.
- Visibility `partial`: The most superficial of the flat muscles (kenhub.external_abdominal_oblique, teachmeanatomy.abdominal_wall, imaios.external_abdominal_oblique), but only its side part is muscle: toward the front it becomes an aponeurosis that covers the rectus abdominis (kenhub.external_abdominal_oblique). 'partial' is an inference from that.
- Database muscle: `external_oblique`. Seen in the recorded database fixture (server/fixtures/liveMuscleAggregation.ts: 'External oblique', muscle_group 'obliques') and in shared/capabilityRank.ts.

**`core.external_oblique.function`** · function · established_anatomy · reviewed

> Acting on both sides together, the external oblique bends the trunk forward and compresses the abdomen. Acting on one side, it bends the trunk to that side and turns it toward the opposite side.

- kenhub.external_abdominal_oblique (Key facts: Function) — Seen through web-search excerpts of the page, not the full text.
- elsevier.external_abdominal_oblique (Quick Facts: Action) — Seen through web-search excerpts of the page, not the full text; does not say to which side it bends or turns the trunk.
- teachmeanatomy.abdominal_wall (External oblique: actions) — Seen through web-search excerpts of the page, not the full text.
- imaios.external_abdominal_oblique (Function) — Seen through the imaios.cn mirror; lists rotation only, with no direction.

**`core.external_oblique.appearance`** · appearance · anatomical_inference · reviewed

> The external oblique is the largest and most superficial of the three flat muscles at the side of the abdomen, lying under the skin and over the internal oblique. It starts from the outer surfaces of the fifth to twelfth ribs, where its slips interlock with those of the serratus anterior and the latissimus dorsi in a zig-zag line on the side of the chest, and its fibres end in a tendon sheet attached to the midline band at the front, the pubic bone and the front of the crest of the hip bone. It may therefore contribute to the contour of the side of the waist and of the lower ribs. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- kenhub.external_abdominal_oblique (Origin and insertion; overview) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- teachmeanatomy.abdominal_wall (External oblique: the largest and most superficial flat muscle) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- imaios.external_abdominal_oblique (Overview) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. Seen through the imaios.cn mirror.

**`core.external_oblique.selectivity.1`** · selectivity · experimental · reviewed

> In a surface-EMG study of 21 adults, the external oblique was most active in roll-outs, pikes and knee-ups on a wheeled device and in hanging knee-ups with straps, among the exercises compared. This is short-term muscle activity, not growth.

- pmid.16649890 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface electrodes; abstract only, seen through a search summary.

**`core.external_oblique.selectivity.2`** · selectivity · experimental · reviewed

> In an EMG study of 12 adults holding five plank variations, planks performed on instability devices produced more activity in the external oblique, the rectus abdominis and the lower-back extensors than an ordinary stable plank. This is short-term muscle activity during a hold, not growth.

- bisp.plank_instability_emg (Abstract: Purpose, Methods and Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Twelve healthy adults; abstract only, seen through a search summary; the devices are not named in the excerpt.

### Internal oblique `core.internal_oblique` (muscle, target; node reviewed)

- Location: Side of the abdomen, middle layer: under the external oblique and over the transversus abdominis, between the lower ribs and the top of the hip bone.
- What it does: With both sides working, bends your trunk forward and presses on the abdomen. With one side working, bends the trunk to that side and turns it toward the same side. It also helps you breathe out hard.
- Shape note: Lies under the external oblique, so it has little separately visible contour; it may add to the general thickness of the side of the waist. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Twisting work loads it together with the external oblique of the other side, which turns the trunk the same way; how the work splits between them is not known.
- Aliases: internal abdominal oblique, obliquus internus abdominis, inner oblique. Short name `IO`. Catalog key: obliques.
- Layer `intermediate` (§1.2): §1.2 'intermediate', no outcrop: supported (the middle of the three flat muscles in StatPearls' layer order, under the external oblique in TeachMeAnatomy and Kenhub). The inferior lumbar triangle at the back of the waist is the one place no muscle covers it (Radiopaedia); the core's drawing has a front view only (§7.2), so no outcrop is needed. Not a deviation.
- Visibility `not_distinct`: Covered by the external oblique at the front and side (teachmeanatomy.abdominal_wall, statpearls.anterolateral_abdominal_wall, kenhub.external_abdominal_oblique). At the back of the waist it forms the floor of the small inferior lumbar triangle (radiopaedia.inferior_lumbar_triangle), covered there only by skin and fat, but no source describes a contour there; 'not_distinct' is an inference.
- Database muscle: `internal_oblique`. Listed in shared/capabilityRank.ts (internal_oblique: 'obliques'); not seen in the recorded database fixture. The database lane checks it.

**`core.internal_oblique.function`** · function · established_anatomy · reviewed

> Acting on both sides together, the internal oblique bends the trunk forward and compresses the abdomen. Acting on one side, it bends the trunk to that side and turns it toward the same side, the opposite way to the external oblique of that side. It also helps with forced breathing out.

- kenhub.internal_abdominal_oblique (Key facts: Function) — Seen through web-search excerpts of the page, not the full text.
- elsevier.internal_abdominal_oblique (Quick Facts: Action) — Seen through web-search excerpts of the page, not the full text.
- imaios.internal_abdominal_oblique (Function; antagonist) — Seen through the imaios.cn mirror, as a web-search excerpt.
- teachmeanatomy.abdominal_wall (Internal oblique: actions) — Seen through web-search excerpts of the page, not the full text.
- radiopaedia.internal_oblique (Action) — Seen through web-search excerpts of the page; does not say to which side it turns the trunk.

**`core.internal_oblique.appearance`** · appearance · anatomical_inference · reviewed

> The internal oblique is the middle of the three layers of flat muscle at the side of the abdomen, under the external oblique and over the transversus abdominis, with its fibres running across those of the external oblique. Covered by the external oblique, it has little separately visible contour; it may add to the general thickness of the side of the waist. At the back of the waist, just above the hip bone, it forms the floor of a small triangle between the external oblique and the latissimus dorsi. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.

- teachmeanatomy.abdominal_wall (Internal oblique: deep to the external oblique, fibres perpendicular) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- statpearls.anterolateral_abdominal_wall (Introduction: layers from superficial to deep) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. Introduction and layer list only.
- kenhub.external_abdominal_oblique (Overview: over the internal oblique) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.
- radiopaedia.inferior_lumbar_triangle (Boundaries and floor) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.

**`core.internal_oblique.selectivity.1`** · selectivity · experimental · reviewed

> In a study of seven young men, bracing the abdomen raised the pressure inside it far more than drawing the belly in (hollowing). At peak pressure, muscle activity was higher in bracing than in hollowing, and higher in the internal oblique than in the other three trunk muscles measured with surface electrodes (the rectus abdominis, the external oblique and the lower-back extensors). Pressure and muscle activity rose together in both tasks. The transversus abdominis was not measured, and the study measured short-term activity, not growth.

- thieme.bracing_hollowing_iap (Abstract: Methods, Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Seven young men; surface electrodes; abstract only.

**`core.internal_oblique.selectivity.2`** · selectivity · experimental · reviewed

> In a surface-EMG study of 21 adults, the internal oblique was most active in roll-outs, pikes and knee-ups on a wheeled device, hanging knee-ups with straps, and reverse crunches on a 30-degree incline, among the exercises compared. This is short-term muscle activity, not growth.

- pmid.16649890 (Abstract: Results) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Surface electrodes; abstract only, seen through a search summary.

### Transversus abdominis `core.transversus_abdominis` (muscle, target; node reviewed)

- Location: Abdominal wall, deepest layer: wraps around the abdomen from the lower ribs, the fascia of the lower back and the hip bone to the midline band at the front.
- What it does: Presses on the abdomen and raises the pressure inside it. It also helps you breathe out hard.
- Shape note: The deepest layer of the abdominal wall, under both obliques, so it has little or no contour of its own. Visible shape depends on the muscles over it, body fat and individual anatomy.
- Caveats: References disagree on whether it helps turn the trunk, so no trunk movement is counted for it here. | In one small study it was active while the trunk turned in either direction; that is muscle activity, not a measure of how much it turns the trunk.
- Aliases: transverse abdominis, transverse abdominal muscle, TVA. Short name `TrA`. Catalog key: none.
- Layer `deep` (§1.2): §1.2 'deep': supported by three references.
- Visibility `not_distinct`: The deepest of the flat muscles, under the internal oblique (radiopaedia.transversus_abdominis, statpearls.anterolateral_abdominal_wall, kenhub.transversus_abdominis).
- Database muscle: `transversus_abdominis`. Listed in shared/capabilityRank.ts (transversus_abdominis: 'abdominals'); not seen in the recorded database fixture. The database lane checks it.

**`core.transversus_abdominis.function`** · function · established_anatomy · reviewed

> The transversus abdominis compresses the abdomen. Its fibres run across the abdomen to the midline band, and when they contract they raise the pressure inside the abdomen; it also helps with forced breathing out. Anatomy references disagree on whether it helps turn the trunk: one lists turning toward the same side, while others list compression only.

- radiopaedia.transversus_abdominis (Gross anatomy: action) — Seen through a mirror of the page, as a web-search excerpt.
- kenhub.transversus_abdominis (Function) — Seen through web-search excerpts of the page, not the full text.
- imaios.transversus_abdominis (Function) — Seen through the imaios.cn mirror; two IMAIOS entries, not told apart by the summary.
- elsevier.transversus_abdominis (Quick Facts: Action) — Seen through web-search excerpts; lists compression only.

**`core.transversus_abdominis.appearance`** · appearance · anatomical_inference · reviewed

> The transversus abdominis is the deepest of the three flat muscles of the abdominal wall, under the internal oblique; toward the front it becomes a tendon sheet that blends with the midline band. Being the deepest layer, it has little or no contour of its own. Visible shape depends on the muscles over it, body fat and individual anatomy.

- radiopaedia.transversus_abdominis (Gross anatomy: deep to the internal oblique; aponeurosis to the linea alba) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. Seen through a mirror of the page, as a web-search excerpt.
- statpearls.anterolateral_abdominal_wall (Introduction: layers from superficial to deep) — Gives location and layer only; the contour statement is inferred from them, not reported by the source. Introduction and layer list only.
- kenhub.transversus_abdominis (Overview) — Gives location and layer only; the contour statement is inferred from them, not reported by the source.

**`core.transversus_abdominis.selectivity.1`** · selectivity · experimental · reviewed

> In a fine-wire EMG study of six people turning the trunk while seated, the transversus abdominis was active throughout the turn, and its upper part was recruited in the opposite pattern to its middle and lower parts depending on the direction of the turn. The rectus abdominis showed no difference between directions. This shows the muscle works during twisting; it does not show how much it turns the trunk, and it is not a measure of growth.

- springer.transversus_rotation_emg (Abstract: Methods, Results and Conclusions) — Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight. Six people; fine-wire electrodes; abstract only.

## 4. Node actions

Each row cites `<node>.function` (key `core:<node id>.function`). Only `prime` rows drive the page's missing-action suggestions; every role below is recorded on the evidence.

| Node | Action | Role | Basis in the claim |
|---|---|---|---|
| `core.rectus_abdominis` | `spine.flexion` | prime | Main action in all four references (MeSH, Kenhub, IMAIOS, Elsevier); MeSH and IMAIOS add 'particularly the lumbar portion' / 'lumbar vertebrae'. |
| `core.rectus_abdominis` | `abdomen.compression` | assist | MeSH (Gray's): 'assists in compressing the abdominal contents'. Kenhub, IMAIOS and Elsevier list compression without qualification; assist follows the one reference that grades it, and the flat muscles are the ones every reference names as compressors. The lane may weigh it; recorded as evidence, not as a product choice. |
| `core.external_oblique` | `spine.flexion` | prime | Bilateral action in Kenhub and Elsevier ('flexes ... trunk'), stated without qualification. TeachMeAnatomy and IMAIOS name only rotation; none calls it an assisting flexor. |
| `core.external_oblique` | `spine.lateral_flexion` | prime | Kenhub: 'Trunk lateral flexion (ipsilateral)'; Elsevier: 'laterally flexes'. |
| `core.external_oblique` | `spine.rotation` | prime | All four references: Kenhub and TeachMeAnatomy 'contralateral', Elsevier and IMAIOS 'rotates' (no direction). |
| `core.external_oblique` | `abdomen.compression` | prime | Kenhub (bilateral: compresses abdominal contents) and Elsevier ('compresses and provides structural support'). |
| `core.internal_oblique` | `spine.flexion` | prime | Kenhub, Elsevier, IMAIOS ('flexes the trunk bilaterally') and Radiopaedia ('flexing ... the trunk'). |
| `core.internal_oblique` | `spine.lateral_flexion` | prime | Kenhub key facts ('ipsilateral lateral flexion') and Elsevier ('laterally flexes'; one-sided contraction bends the trunk toward the same side). |
| `core.internal_oblique` | `spine.rotation` | prime | Kenhub, Elsevier, IMAIOS and TeachMeAnatomy: ipsilateral rotation. |
| `core.internal_oblique` | `abdomen.compression` | prime | All five references (Kenhub, Elsevier, IMAIOS, TeachMeAnatomy, Radiopaedia). |
| `core.transversus_abdominis` | `abdomen.compression` | prime | Its main, and in three of four references its only, listed action (Radiopaedia, IMAIOS, Elsevier; Kenhub adds rotation). |

By action: `spine.flexion` RA, EO, IO (prime); `spine.lateral_flexion` EO, IO (prime), plus the back's quadratus lumborum as an external; `spine.rotation` EO, IO (prime); `abdomen.compression` TrA, IO, EO (prime), RA (assist). Every core muscle has a prime action. Product choices: None: every prime and assist above is recorded on the evidence. If the page should not suggest the obliques for forward-bending work (crunch-type exercises), that would be a product choice to record separately; the references give the obliques' forward bending without qualification.

## 5. Joint actions this region needs

None is new: all four region actions of §1.2 are already in `shared/specialization/actions/joints.ts`, and their wording is used unchanged.

- `spine.flexion` · Spine · Spinal flexion: "Bends the trunk forward, curling the ribs toward the pelvis." Already in shared/specialization/actions/joints.ts; wording unchanged. Shared with the back.
- `spine.lateral_flexion` · Spine · Spinal lateral flexion: "Bends the trunk to one side." Already in joints.ts; wording unchanged. The back's quadratus lumborum, listed here as an external, is prime for it in the back dossier (a draft claim there).
- `spine.rotation` · Spine · Spinal rotation: "Twists the trunk, turning the shoulders relative to the hips." Already in joints.ts; wording unchanged. The obliques turn the trunk in opposite directions (external oblique toward the other side, internal oblique toward its own side); one shared action covers both, and the claims say the direction.
- `abdomen.compression` · Abdominal wall · Abdominal compression: "Draws the belly wall in and tightens it, raising the pressure inside the abdomen." Already in joints.ts (added at wave 0); wording unchanged, as instructed. Observation for the platform, not a change: in thieme.bracing_hollowing_iap, drawing the belly in (hollowing) raised the pressure inside the abdomen far less than bracing; 'Draws the belly wall in' describes hollowing more than bracing. A wording such as 'Tightens the belly wall, raising the pressure inside the abdomen, as when bracing' would match the evidence better. Left to the owner of the shared library.

## 6. Abdominal compression: what the evidence supports

What the evidence supports about abdomen.compression (bracing, raising pressure in the abdomen): every anatomy reference cited lists compressing the abdomen as an action of the three flat muscles; for the transversus abdominis it is the main and, in three of four references, the only action, with raising intra-abdominal pressure named by Radiopaedia, Kenhub and IMAIOS; the internal oblique (five references) and the external oblique (Kenhub, Elsevier) compress the abdomen when both sides act; the rectus abdominis 'assists' (MeSH) or compresses (Kenhub, IMAIOS, Elsevier). One measured study (thieme.bracing_hollowing_iap, seven men, abstract only) found that bracing raised the pressure far more than drawing the belly in, that pressure and muscle activity rose together, and that the internal oblique was the most active of the four trunk muscles recorded; the transversus abdominis was not recorded. Not supported here, so not claimed: that raised pressure steadies the spine (contested, Q27); that the diaphragm and pelvic floor share the work (seen only in a thesis and a blog, Q27); any figure for how much each muscle contributes (the 1992 intramuscular study, Q22 and Q24, was seen only as a reference-list entry). Node actions: transversus abdominis, internal oblique and external oblique prime; rectus abdominis assist.

## 7. Sources, single-source claims and unconfirmed details

| Key | Type | Title |
|---|---|---|
| `statpearls.anterolateral_abdominal_wall` | anatomy | [StatPearls: Anatomy, Abdomen and Pelvis: Anterolateral Abdominal Wall](https://www.ncbi.nlm.nih.gov/books/NBK525975/) |
| `nlm.mesh_rectus_abdominis` | anatomy | [Medical Subject Headings (MeSH) descriptor D017568, Rectus Abdominis: scope note (as shown on a university research-profiles page)](https://profiles.rush.edu/display/28663) |
| `kenhub.rectus_abdominis` | anatomy | [Kenhub: Rectus abdominis: Origin, insertion, innervation, function](https://www.kenhub.com/en/library/anatomy/rectus-abdominis-muscle) |
| `kenhub.external_abdominal_oblique` | anatomy | [Kenhub: External abdominal oblique: Anatomy, innervation, function](https://www.kenhub.com/en/library/anatomy/external-abdominal-oblique-muscle) |
| `kenhub.internal_abdominal_oblique` | anatomy | [Kenhub: Internal abdominal oblique: Origin, insertion and action](https://www.kenhub.com/en/library/anatomy/internal-abdominal-oblique-muscle) |
| `kenhub.transversus_abdominis` | anatomy | [Kenhub: Transversus abdominis: Origin, insertion and function](https://www.kenhub.com/en/library/anatomy/transversus-abdominis-muscle) |
| `elsevier.rectus_abdominis` | anatomy | [Elsevier Complete Anatomy: Rectus Abdominis Muscle](https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-abdomen/rectus-abdominis-muscle/23517) |
| `elsevier.external_abdominal_oblique` | anatomy | [Elsevier Complete Anatomy: External Abdominal Oblique Muscle](https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-abdomen/external-abdominal-oblique-muscle/21869) |
| `elsevier.internal_abdominal_oblique` | anatomy | [Elsevier Complete Anatomy: Internal Abdominal Oblique Muscle](https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-abdomen/internal-abdominal-oblique-muscle/18607) |
| `elsevier.transversus_abdominis` | anatomy | [Elsevier Complete Anatomy: Transversus Abdominis Muscle](https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-abdomen/transversus-abdominis-muscle/16784) |
| `imaios.rectus_abdominis` | anatomy | [IMAIOS e-Anatomy: Rectus abdominis muscle](https://www.imaios.cn/en/e-anatomy/anatomical-structures/musculus-rectus-abdominis-1541083804) |
| `imaios.external_abdominal_oblique` | anatomy | [IMAIOS e-Anatomy: External abdominal oblique muscle](https://www.imaios.cn/en/e-anatomy/anatomical-structures/external-oblique-14217236) |
| `imaios.internal_abdominal_oblique` | anatomy | [IMAIOS e-Anatomy: Internal abdominal oblique muscle](https://www.imaios.cn/en/e-anatomy/anatomical-structures/internal-abdominal-oblique-muscle-1541084808) |
| `imaios.transversus_abdominis` | anatomy | [IMAIOS e-Anatomy: Transversus abdominis muscle](https://www.imaios.cn/en/e-anatomy/anatomical-structures/transversus-abdominis-muscle-1541084840) |
| `radiopaedia.transversus_abdominis` | anatomy | [Radiopaedia: Transverse abdominis](https://images.radiopaedia.org/articles/transverse-abdominis?lang=us) |
| `radiopaedia.internal_oblique` | anatomy | [Radiopaedia: Internal oblique muscle](https://radiopaedia.org/articles/internal-oblique-muscle) |
| `radiopaedia.inferior_lumbar_triangle` | anatomy | [Radiopaedia: Inferior lumbar triangle](https://radiopaedia.org/articles/25486) |
| `teachmeanatomy.abdominal_wall` | anatomy | [TeachMeAnatomy: The Anterolateral Abdominal Wall](https://teachmeanatomy.info/abdomen/muscles/the-abdominal-wall/) |
| `pmid.8976314` | emg | [Sarti MA, Monfort M, Fuster MA, Villaplana LA. Muscle activity in upper and lower rectus abdominus during abdominal exercises. Arch Phys Med Rehabil 1996;77(12):1293-7](https://pubmed.ncbi.nlm.nih.gov/8976314/) · doi 10.1016/s0003-9993(96)90195-1 |
| `pmid.12930172` | emg | [Electromyographic comparison of the upper and lower rectus abdominis during abdominal exercises. J Strength Cond Res 2003;17(3):475-83](https://pubmed.ncbi.nlm.nih.gov/12930172/) · doi 10.1519/1533-4287(2003)017<0475:ecotua>2.0.co;2 |
| `pmid.16649890` | emg | [Escamilla RF, Babb E, DeWitt R, et al. Electromyographic analysis of traditional and nontraditional abdominal exercises: implications for rehabilitation and training. Phys Ther 2006;86(5):656-71](https://doi.org/10.1093/ptj/86.5.656) · doi 10.1093/ptj/86.5.656 |
| `bisp.plank_instability_emg` | emg | [Snarr RL, Esco MR. Electromyographical comparison of plank variations performed with and without instability devices. J Strength Cond Res 2014;28(11):3298-3305](https://www.bisp-surf.de/Record/PU201501000974) · doi 10.1519/JSC.0000000000000521 |
| `springer.transversus_rotation_emg` | emg | [Urquhart DM, Hodges PW. Differential activity of regions of transversus abdominis during trunk rotation. Eur Spine J 2005;14(4):393-400](https://www.springermedicine.com/differential-activity-of-regions-of-transversus-abdominis-during/21220578) · doi 10.1007/s00586-004-0799-9 |
| `thieme.bracing_hollowing_iap` | emg | [Tayashiki K, Takai Y, Maeo S, Kanehisa H. Intra-abdominal Pressure and Trunk Muscular Activities during Abdominal Bracing and Hollowing. Int J Sports Med 2016;37(2):134-143](https://thieme-connect.de/products/ejournals/html/10.1055/s-0035-1559771) · doi 10.1055/s-0035-1559771 |
| `jcdr.tendinous_intersections` | anatomy | [Anita et al. Tendinous intersections of the rectus abdominis in North Indian cadavers. J Clin Diagn Res, June 2015 (title as described by the search; exact title not shown)](https://doaj.org/article/05b3de8c84ba42f39dba8c631e7fd750) |
| `durham.tendinous_intersections` | anatomy | [Meenakshi S, Manjunath KY. The tendinous intersections of rectus abdominis muscle. J MGIMS 2008 (journal and year as described by the search)](https://durham-repository.worktribe.com/output/1500619) |
| `pmc.rectus_diastasis_finnish_women` | anatomy | [The prevalence and consequences of abdominal rectus muscle diastasis among Finnish women: an epidemiological cohort study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9012726/) · doi 10.1007/s10029-021-02484-8 |

Each source's note in `dossier.json` says what the search showed and what it could not confirm.

**Single-source function claims.** No function claim rests on one reference: the rectus abdominis's has four, the external oblique's four, the internal oblique's five, the transversus abdominis's four. Sentences or parts that rest on one reference: the external oblique bending the trunk 'to that side' (Kenhub; Elsevier says it 'laterally flexes' without a side; anatomy.app, not cited, agrees with Kenhub); the transversus abdominis's rotation, which only Kenhub lists and which the claim reports as a disagreement rather than a fact; 'mainly its lower (lumbar) part' for the rectus abdominis rests on MeSH and IMAIOS.

**Unconfirmed bibliographic details.**

- statpearls.anterolateral_abdominal_wall: NBK525975 and the update date (24 Jul 2023) come from the search summary; authors not shown; only the introduction and layer list were seen.
- nlm.mesh_rectus_abdominis: seen on university research-profiles mirrors, not on the NLM MeSH browser; the Gray's page reference (30th American edition, p. 491) is the summary's.
- elsevier.external_abdominal_oblique, elsevier.transversus_abdominis: the result titles showed only 'www.elsevier.com'; page titles inferred from the URLs.
- imaios.*: seen through the imaios.cn mirror; for the rectus abdominis and the transversus abdominis two IMAIOS entries were returned and the summary did not say which carried which line.
- radiopaedia.transversus_abdominis: seen at an images.radiopaedia.org address; authors and revision not shown.
- teachmeanatomy.abdominal_wall: exact page title not shown (result title 'the abdominal wall').
- kenhub.rectus_abdominis: the location and visibility lines came in summaries drawing on several Kenhub pages; the page heads the result lists but the summary did not tie each line to it.
- pmid.12930172: authors not shown by the search (Clark, Holt and Sinyard were in the query, not confirmed).
- pmid.16649890: the PMID and author list come from secondary citations (two blog posts, a magazine article); the PubMed page was not seen. The abstract was seen through a summary beside a Sacramento State repository record.
- bisp.plank_instability_emg, springer.transversus_rotation_emg, thieme.bracing_hollowing_iap: PMIDs not seen, so keyed by publisher.
- jcdr.tendinous_intersections: exact title, full author list and DOI not shown ('Anita et al.' per the summary).
- durham.tendinous_intersections: the journal (J MGIMS), year (2008) and second author (Manjunath) are the summary's; the record seen is a Durham University repository entry.
- pmc.rectus_diastasis_finnish_women: authors not shown; journal (Hernia) and year (2021) inferred from the DOI.

## 8. Disagreements between sources, and what was not claimed

- Transversus abdominis and turning the trunk: Kenhub lists ipsilateral rotation on one-sided contraction; Radiopaedia, IMAIOS and Elsevier list compression only (Q10, Q11, Q21). The function claim states the disagreement; no spine.rotation node action is recorded. The fine-wire study (springer.transversus_rotation_emg) shows it active during turning, which is activity, not torque; a commentary in the same results calls its moment arm for rotation small.
- External oblique, side of lateral flexion: Kenhub (and anatomy.app, not cited) say the same side; LearnMuscles (not cited) gives no side; Elsevier says 'laterally flexes' with no side. The claim says 'to that side', the anatomical reading of Kenhub's 'ipsilateral'.
- Rectus abdominis and side bending: one unidentified physiotherapy source (Q15) and an IMAIOS veterinary entry say it helps bend the trunk sideways; no human anatomy reference cited here lists it. Not claimed; no spine.lateral_flexion node action.
- Rectus abdominis and tilting the pelvis back: mentioned by an untied line in Q1 and by LearnMuscles for the group (Q7); not confirmed by Kenhub (Q5). Not claimed (not a region action either).
- Upper versus lower rectus abdominis: Sarti 1996 found differences in correct performers; the 2003 pilot found none; a later paper groups Lehman and McGill 2001 with the studies finding none (Q29, abstract not seen, not cited). The selectivity claim says the question is unsettled.
- Number of tendinous intersections: three in most references; three to four (IMAIOS, a Kenhub video); one to five in two cadaver series. The appearance claim says 'usually three'; the variation claim gives the range.
- Pressure in the abdomen as a spine stabiliser: contested (Q27: a review argues the proposed mechanism lacks experimental support; a thesis says it cannot be determined with certainty). Kenhub's line that the abdominal muscles 'stabilize the vertebral column' with the back muscles is not used. No claim says that bracing steadies the spine.
- Rectus abdominis and compression, prime or assist: MeSH (Gray's) says it 'assists'; Kenhub, IMAIOS and Elsevier list compression unqualified. Recorded as assist (see nodeActions).

Deliberately not claimed:

- Transversus abdominis rotation (references disagree).
- Rectus abdominis lateral flexion and pelvic tilt (no cited human anatomy reference).
- Expiration: named for the internal oblique and transversus abdominis in their claims, but not a region action, so no node action.
- The transversus abdominis's early activation before arm and leg movements, and its timing in people with low back pain: a known clinical literature, not searched as a selectivity claim (it is not about which exercise loads which muscle); results in Q45 also show it is disputed.
- Plank and side-plank variations beyond the one tied abstract: the long-lever posterior-tilt plank (Q37), side-bridge variants (Q36, Q50) and suspended planks (Q39) were found only as citations or untied summaries.
- Anti-rotation work (a press held against a sideways pull): the only EMG study found (Q39) is a small methodology study in a conference-abstract series; not cited.
- The 1998 intramuscular study of psoas and the abdominal wall across many tasks (Q34): abstract not seen.
- Any statement that a muscle grows, or how much an exercise loads it: no claim says either.

## 9. §1.2 checks and deviations

Contradictions of §1.2: 0. Ids, names, short names, kinds, roles, layers, node keys and region actions all stand. Observations for the lanes:

- **D0** (none found; §1.2 core rows): Nothing recorded contradicts any core row of §1.2: rectus abdominis 'surface' (Kenhub, IMAIOS), external oblique 'surface' (Kenhub, TeachMeAnatomy, IMAIOS), internal oblique 'intermediate' (StatPearls layer order, TeachMeAnatomy, Kenhub) and transversus abdominis 'deep' (Radiopaedia, StatPearls, Kenhub). Kinds, roles and short names need no change; the region actions are all in the shared library.
- **O1** (observation (not a contradiction); core.internal_oblique outcrop): The internal oblique forms the floor of the inferior lumbar triangle at the back of the waist (radiopaedia.inferior_lumbar_triangle), the one place no other muscle covers it. The core drawing has a front view only (§7.2), so §1.2's 'intermediate' with no outcrop stands; the back's drawing may show the triangle as structure.
- **O2** (observation (not a contradiction); core.external_oblique front part): Toward the front the external oblique becomes a tendon sheet over the rectus abdominis (kenhub.external_abdominal_oblique; imaios.rectus_abdominis: the rectus sheath is formed by the side muscles' tendon sheets). The drawing lane should draw the external oblique's belly at the side and not paint muscle over the rectus abdominis.
- **O3** (observation (not a contradiction); abdomen.compression wording (shared library)): See the note on abdomen.compression in actions[]: the shared wording 'Draws the belly wall in' fits hollowing, which raised pressure far less than bracing in thieme.bracing_hollowing_iap. Not reworded here.
- **O4** (observation (not a contradiction); external member back.quadratus_lumborum): §1.2 lists the back's quadratus lumborum as an external. The listing rule (a prime mover of one of the core's actions) rests on the back's function claim, which the back dossier leaves draft (its spine.lateral_flexion node action is draft too). The core page would show that node action for spine.lateral_flexion; it should not be shown as reviewed until the back lane promotes the claim. Not researched here, as instructed.

## 10. For the review

1. **Second review.** Re-search at least the selectivity and variation claims and the transversus abdominis disagreement with independent queries, as was done for the first four regions.
2. **Rectus abdominis and compression, assist or prime.** Recorded as assist from MeSH's 'assists'; three references list compression unqualified. The lane may weigh it.
3. **Shared action wording.** `abdomen.compression` says 'Draws the belly wall in'; the one measured study found drawing in raised pressure far less than bracing (O3). The owner of the shared library decides.
4. **The quadratus lumborum's claim is the back's and still draft** (O4); the core page should not show its lateral-flexion node action as reviewed until the back lane promotes it.
5. **Full texts and PubMed ids.** pmid.16649890 rests on secondary citations; three studies are keyed by publisher because no PubMed id was seen; the cadaver series' titles and authors are partly unconfirmed.
6. **Human review.** A clinician or anatomist should read these claims before the core's version is published as reviewed content (§8: publishing freezes reviewed claims).

