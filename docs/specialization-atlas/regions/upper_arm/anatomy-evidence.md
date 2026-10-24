# Specialization atlas: upper-arm anatomy and its evidence (wave A, 22 Oct 2026)

What the upper-arm content says, what it rests on, and how far its review can be trusted. The content is `shared/specialization/regions/upper_arm/{ids,nodes,members,nodeActions,claims,review,content}.ts` and `shared/specialization/sources/upper_arm.ts`, plus the forearm's membership caveats on the biceps and brachialis in `regions/forearm/members.ts`. Its own rules are tested in `client/src/lib/specialization/upper_armAnatomy.test.ts`; the rules every region keeps, in `regionContent.test.ts`. The binding design is `../../10-multi-region.md` (§1.1–§1.3, §8, §10). The research is `research/dossier.md` and `research/dossier.json` (19 Oct 2026, with an independent second review the same day, its §13): every query and the excerpt relied on are recorded there, verbatim. This note says what the anatomy lane took from the dossier, what it decided where the dossier left a question open, what an adversarial review of the lane changed (§5), and what is still open.

The upper arm is still a `reference` region in the registry: the integration lane promotes it (label "Upper arms", status `production`) with its mapping version.

## 1. Said plainly

> "Reviewed" means an automated agent checked each sentence against web-search excerpts and generated summaries of the cited sources on the date shown. It was not checked against the full texts, and not by a clinician or anatomist. A second automated review, with the same tools and limits, looked for errors; it is not peer review. The drawings are original schematics checked against these notes, not reviewed by an anatomist.

## 2. Method and limits

The dossier's method (its §1) and limits (its §2) hold, and are the forearm's (`../../03-anatomy-evidence.md`): web search only, because the proxy refuses page fetches (ncbi, pmc, kenhub, radiopaedia, elsevier and the like); every source was seen as search excerpts, a generated summary, an abstract or a video description, and each citation's qualification says which. Search summaries can misquote; that is why each new function claim rests on three to five references.

**What this lane did on 22 Oct 2026.** It turned the dossier into code without changing any claim's statement, sources, locators or qualifications, and checked that mechanically: a one-off comparison of every claim, node and source in the code against `dossier.json` found no difference apart from the edits listed in §4. It then re-searched four points, with the same tools and limits, to confirm the facts its own decisions rest on:

- the biceps at the shoulder: the search summary of Kenhub's article again gave elbow flexion and supination plus "a weak role in flexing the arm at the glenohumeral joint"; Physiopedia (not cited) calls its part in shoulder flexion minor;
- the long head of the triceps: summaries of StatPearls, Kenhub, Radiopaedia and IMAIOS again gave it as the only head crossing the shoulder, assisting extension and adduction there, a small action next to its work at the elbow;
- the coracobrachialis: the summary gave Loyola's action as bringing the arm forward and weakly toward the midline, and Elsevier's as adduction and flexion, as the dossier has them;
- the medial head at the surface: a summary named sources saying it reaches the surface only close to the point of the elbow, but they were a training site, a wiki and a lecture handout, none of them in the evidence standard's list, so nothing was cited and the outcrop stays weakly supported (§8, open issue 4).

The fix round (§5) searched again, the same way, for the StatPearls triceps article's authors and its sentence on where the heads arise, for the Kholinne study's PubMed id, and for a source on the lateral and medial heads under load. A claim reviewed on 19 Oct and not changed since keeps `reviewedAt: "2026-10-19"`; the five claims the fix round reworded or gave a source were re-checked against their sources and are dated 22 Oct 2026, with a note that says so.

## 3. What the content holds

| | Count | Notes |
|---|---|---|
| Nodes | 7 | §1.2's: biceps and brachialis (frozen ids), the triceps parent, its long, lateral and medial heads, the coracobrachialis (adjacent). All `reviewed`. |
| Members | 8 | The seven, then the forearm's brachioradialis (`forearm.br`, short name `BR`) as an external member. Two carry the upper arm's caveats: the biceps and the brachioradialis. |
| Region actions | 5 | `elbow.flexion`, `elbow.extension`, `forearm.supination`, `shoulder.flexion`, `shoulder.extension`, as §1.2 lists them. No new action: the library already holds all five. |
| Node actions | 9 | 3 the forearm's, frozen; 6 new (§6). |
| Claims kept in the folder | 23 | The forearm's 4 on the biceps and brachialis (owner `forearm`, frozen, keys unchanged) and the upper arm's 19, all reviewed: 6 function, 7 appearance, 5 selectivity, 1 variation. The dossier's twentieth, a training-study claim, is left out (§5, open issue 1). |
| Citations (own claims) | 62 | Each with a locator and, where the source is limited, a qualification. |
| Sources | 28 new + 3 | `sources/upper_arm.ts`; the claims also cite the forearm's A4 (Kleiber 2015), A50 and A51 (StatPearls, biceps and brachialis). |

### Nodes

| Node | Short | Kind · role | Layer (§1.2) | Visibility | `databaseMuscle` |
|---|---|---|---|---|---|
| `upper_arm.biceps` | Biceps | muscle · target (stored `external`) | surface | clear | `biceps_brachii` (shipped) |
| `upper_arm.brachialis` | Brachialis | muscle · target (stored `external`) | deep (outcrop, front view) | partial | `brachialis` (shipped) |
| `upper_arm.triceps` | Triceps | muscle · group (parent) | — (written `mixed`, as the forearm's groups) | partial | none: the database holds the heads |
| `upper_arm.triceps_long` | TriLong | head · target | surface | partial | `triceps_brachii_long_head` |
| `upper_arm.triceps_lateral` | TriLat | head · target | surface | partial | `triceps_brachii_lateral_head` |
| `upper_arm.triceps_medial` | TriMed | head · target | deep (outcrop, back view) | partial | `triceps_brachii_medial_head` |
| `upper_arm.coracobrachialis` | CB | muscle · adjacent | deep | not_distinct | none: no canonical row |

The three triceps names are the app's canonical names (`shared/capabilityRank.ts`, which maps each to the `triceps` key), and production's `public.muscles` holds all three (read-only check on 22 Oct 2026, named "Triceps brachii — long head", "— lateral head" and "— medial head"). `nodes.database_muscle` is a foreign key into `public.muscles`, so the test stub (`server/fixtures/specializationPg.ts`) now holds the three rows by those names.

## 4. What the lane decided

**Biceps × `shoulder.flexion`, listed as `assist`** (the dossier's open issue 2; its second review left it to the lane). This is a product choice, recorded as one, and an open question for the owner (open issue 2):
- the evidence fixes the role, not the choice to list it: three anatomy references say the biceps flexes the shoulder weakly (Kenhub "weak", Loyola "weakly", IMAIOS "weak") and TeachMeAnatomy lists it unrated, so it can only be `assist`, never `prime`;
- the muscle-activity evidence is against it, which is why it is a choice and not a finding: with the elbow braced straight, Levy et al. 2001 recorded no activity in the biceps' long head during shoulder movement, and the scoping review of Diplock et al. 2023 calls the long head's part in raising the arm minimal in healthy shoulders (`upper_arm.biceps.selectivity.2`). So it is **not** the same kind of row as the long head of the triceps' `shoulder.extension` `assist`, which rests on four anatomy references and has no muscle-activity study against it;
- the forearm left weak extras out because they would add noise to suggestions; only `prime` rows name a missing action (`recommendations.ts`, `missingPrimeActions`), so an `assist` row does not;
- without it, no upper-arm muscle that can be mapped performs `shoulder.flexion` (its other performer, the coracobrachialis, is adjacent, and mappings refuse adjacent nodes), so a movement target on the region's own action could never be counted.

The mapping lane decides, exercise by exercise, whether any exercise credits it; the row only makes that possible. The alternative is a §1.2 deviation taking `shoulder.flexion` off the upper arm, which also takes away the coracobrachialis's only action. The node's caveat states the evidence ("Its help raising the arm forward is weak, and studies disagree on whether its long head works in shoulder movement at all."); the listing is said by the upper arm's own caveat on its membership of the biceps, "Listed only as helping raise the arm forward.", which the forearm's page, listing no shoulder action, never shows.

**The triceps parent has no node action** (the dossier's open issue 5). The platform now exempts any node that is another node's parent from "every muscle a main action" (`regionContent.test.ts`, done in wave 0), as the drawing contract does (§7.3). It keeps a reviewed function claim, so it is `reviewed`.

**The two frozen nodes' neutral text** (§1.3). The sentences that spoke from the forearm's page are now the forearm's caveats on its membership of them: "It is an upper-arm muscle and does not add forearm size." and "Shown only as another muscle that curls and palm-up turning load; not a forearm target." (biceps); "It is not a forearm muscle." and "Shown only as another muscle that curls load; not a forearm target." (brachialis). The nodes take the dossier's neutral location, what it does, shape note and caveats, with these edits by the lane:
- biceps location: "its two heads start on the shoulder blade, join, and cross the elbow" became "its two heads start on the shoulder blade, and it crosses the elbow": the second review found the lower tendon in two parts in many arms, and no excerpt describes where the heads join;
- biceps caveats: "counted as one muscle here" lost "here", and the shoulder caveat ends with the evidence, its listing moved to the upper arm's membership caveat (above), so no sentence of the node speaks from one page;
- the medial head's selectivity claim follows its function and appearance claims, as every other node's does (the dossier listed it first).

On the forearm page the two sheets therefore read differently from wave 0: the neutral text, the node's own caveats, then the forearm's two. `pageText.render.test.ts` states each changed line (its wave A rules) and `regionContent.test.ts` ("nothing moved") checks that each membership caveat is the forearm's old words on the node. Nothing else on the forearm page changes, its numbers included. The upper-arm page shows the nodes' own text and the upper arm's own caveats; `upper_armAnatomy.test.ts` refuses page words ("listed", "shown", "credited", "target", "here", a region's size or muscles) in the text of any node another region lists.

**The brachioradialis's membership caveat**, the dossier's suggestion: "A forearm muscle shown here because curls load it; it is credited as the forearm counts it." Its node, claims and node actions are the forearm's, unchanged; the upper-arm page shows its `elbow.flexion` row and `forearm:br.function` behind it.

## 5. The adversarial review's fix round (22 Oct 2026)

An independent adversarial review of the lane found no blockers. What it asked for, and what changed:

1. **The training-study claim is left out of the content.** `upper_arm.triceps_long.selectivity.2` (two studies of elbow extensions with one arm overhead: measured muscle volume and thickness) was a draft, and a draft is shown on a muscle's sheet as "not reviewed yet", which was untrue (its excerpts support it) and would have put a growth finding in a selectivity claim, which §8 forbids. It stays in the dossier with its two sources (`pmid.35819335`, Maeo et al. 2023; `mdpi.triceps_fascicle_length`, Stasinaki et al. 2018), which left the source library with it. Open issue 1 says what would bring it back.
2. **The biceps' caveat** no longer says "so it is listed only as helping there", which read on the forearm page beside no shoulder action; the upper arm's membership caveat says it (§4).
3. **The long head steadying the shoulder** keeps the references' arm positions: "references differ on the arm position, two describing it with the arm held close to the body and one with the arm raised out to the side" (StatPearls and IMAIOS, adducted; Radiopaedia, in abduction). The node's "what it does" says the references differ.
4. **The long head at the surface:** its sources say only that it is one of the two superficial heads, and the review found that its upper part lies under the back edge of the deltoid (a radiology teaching page; Radiopaedia places it between teres minor and teres major near its origin; neither is cited for it). Its appearance claim and location now say it is a surface head "from below the shoulder toward the elbow", as its shape note did, and no longer that it is at the surface all the way from the shoulder blade.
5. **The lateral head's "does not cross the shoulder":** its StatPearls citation was located on a sentence about the long and medial heads. The fix round's search showed the StatPearls sentence that the lateral and medial heads arise from the humerus, and the citation is now located there ("the lateral and medial heads arise from the upper-arm bone; the long head's origin on the shoulder blade gives it its shoulder action"); IMAIOS carries the same sentence.
6. **The selectivity test** now requires the negation itself ("not growth", "neither study measured growth", "none of these studies measured growth") and refuses a growth finding (hypertrophy, muscle volume, thickness or size) in any selectivity statement; the direction test now allows "lateral" and "medial" only in the heads' names and the lateral intermuscular septum.
7. **The lateral and medial heads under load:** their claims now say "under load both work". A 2020 muscle-activity study of push-downs (Hussain et al., Frontiers in Physiology, `frontiers.triceps_pushdown_fatigue`) summarises a 2018 review (Landin et al.) as finding that the medial head takes part in every elbow extension and the lateral and long heads join in against resistance; the review itself was not seen, and the citation says so. The atlas's search found no study of a loaded exercise that works one of the two without the other.
8. **The biceps' `assist` row** stays, and §4 now says why it differs from the long head's (above).
9. **Bibliographic details:** the StatPearls triceps article's authors are Tiwana, Sinkler and Bordoni (updated 28 Aug 2023); `aott.triceps_heads` (Kholinne et al. 2018) is PubMed 29503079, recorded in its title and note, its key unchanged; production holds the three triceps canonical names (§3).
10. **Wording:** "the dossier's open issue 5" (§4).
11. **Basis of the lateral and medial selectivity claims:** each opens with the anatomy that makes the two heads share every action (both start on the back of the upper-arm bone and cross only the elbow) before the muscle-activity findings, under the basis `experimental`. The forearm's `fds.selectivity.2` does the same (the anatomy of a shared load, then its study). The anatomy sentence is supported by the Elsevier entries it cites; the basis names what the claim adds to the function claims.

The claims changed in this round, re-checked on 22 Oct 2026: `upper_arm.triceps_long.function`, `upper_arm.triceps_long.appearance`, `upper_arm.triceps_lateral.function`, `upper_arm.triceps_lateral.selectivity.1`, `upper_arm.triceps_medial.selectivity.1`.

## 6. Node actions

| Node | Action | Role | Claim |
|---|---|---|---|
| Biceps | `elbow.flexion` | prime | `forearm:biceps.function` (frozen row) |
| Biceps | `forearm.supination` | prime | `forearm:biceps.function` (frozen row) |
| Biceps | `shoulder.flexion` | assist | `upper_arm:upper_arm.biceps.function` (§4, a product choice) |
| Brachialis | `elbow.flexion` | prime | `forearm:brachialis.function` (frozen row) |
| TriLong | `elbow.extension` | prime | `upper_arm:upper_arm.triceps_long.function` |
| TriLong | `shoulder.extension` | assist | `upper_arm:upper_arm.triceps_long.function` |
| TriLat | `elbow.extension` | prime | `upper_arm:upper_arm.triceps_lateral.function` |
| TriMed | `elbow.extension` | prime | `upper_arm:upper_arm.triceps_medial.function` |
| CB | `shoulder.flexion` | prime (a main action of this muscle, not a main shoulder flexor) | `upper_arm:upper_arm.coracobrachialis.function` |

The lateral and medial heads share every action: their mappings are written `allocation: "shared"` (§1.2), and both their selectivity claims and caveats say the work is not split. Left out on purpose, each said in its claim: the long head's and the coracobrachialis's adduction (not an upper-arm region action), and the medial head's deepest fibres at the elbow capsule (no action id, no load moved, and a dissection study disputes the action).

## 7. Claims

Statements, sources and locators are the dossier's (its §4, verbatim) except where §4 and §5 above say otherwise. Every claim reviewed on 19 Oct carries the note "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist." (appearance claims: "…as an anatomical inference from the muscle's cited location and depth; not a measured prediction…"); the five re-checked on 22 Oct carry a note saying they were reworded after an adversarial review and re-checked then.

| Node | Function | Appearance | Selectivity | Variation |
|---|---|---|---|---|
| Biceps | `forearm:biceps.function` (frozen); `upper_arm.biceps.function` | `upper_arm.biceps.appearance` (the forearm's `biceps.appearance` stays on the forearm page) | `.selectivity.1` (palm position in curls), `.selectivity.2` (the long head at the shoulder) | `.variation.1` (extra heads, no rate) |
| Brachialis | `forearm:brachialis.function` (frozen) | `upper_arm.brachialis.appearance` | | |
| Triceps | `upper_arm.triceps.function` | `.appearance` | | |
| TriLong | `.function` (re-checked 22 Oct) | `.appearance` (re-checked 22 Oct) | `.selectivity.1` (arm height, one study) | |
| TriLat | `.function` (re-checked 22 Oct) | `.appearance` | `.selectivity.1` (shares every action with the medial head; re-checked 22 Oct) | |
| TriMed | `.function` (the capsule fibres: both views stated) | `.appearance` | `.selectivity.1` (as the lateral head's; re-checked 22 Oct) | |
| CB | `.function` | `.appearance` | | |

**Single-source function claims:** none new; each new function claim rests on three to five references. The upper-arm page shows two of the forearm's, each on one source: `forearm:biceps.function` (A50) and `forearm:brachialis.function` (A51). Both are frozen; the dossier found corroboration (Elsevier, Kenhub, Loyola, TeachMeAnatomy for the biceps; Radiopaedia, Loyola, TeachMeAnatomy, Kenhub for the brachialis), which only the database lane could add, if frozen claims may gain sources at all (open issue 6). Other single-source claims: `upper_arm.biceps.variation.1` (one meta-analysis) and `upper_arm.triceps_long.selectivity.1` (one ten-person study), each said in its statement.

## 8. Deviations from §1.2

**None.** Every §1.2 row is as written: ids, names, short names, kinds, roles, layers, node keys, parents, the five region actions and the external `forearm.br` (the dossier's §11, re-checked; held by `upper_armAnatomy.test.ts`). The biceps' `assist` row (§4) is what keeps `shoulder.flexion` as §1.2 has it. Two §1.2 rows rest on weak evidence and are kept, flagged:
- the medial head's back-view outcrop: no cited source says any of it shows (open issue 4);
- the coracobrachialis's `deep` layer: supported in part (it lies behind the pectoralis major and is felt in the armpit).

## 9. Open issues for the owner

1. **The training-study claim** (`upper_arm.triceps_long.selectivity.2`, in the dossier, not in the content). §1.2 sends the long head's regional-growth findings to selectivity claims; §8 says selectivity claims are never growth. If the owner adopts §1.2's sentence over §8's for this finding, the claim ships **reviewed** (its excerpts support every sentence; both reviews agreed), with its two sources; otherwise it stays out. It would never weight credit either way.
2. **The biceps' `assist` shoulder-flexion row** is the lane's product choice, against the muscle-activity evidence (§4). The alternative is a §1.2 deviation taking `shoulder.flexion` off the upper arm, which also leaves the coracobrachialis with no action.
3. **The lateral and medial heads under load** rest, for the "under load" sentence, on one study's summary of a review not seen here; a full-text reading of Landin et al. 2018 would settle it.
4. **The medial head's outcrop** is weakly supported; keep it small in the drawing, and settle it with a full-text or human review.
5. **Closed (22 Oct 2026):** production's `public.muscles` holds the three triceps canonical names; the test stub holds them too.
6. **Frozen claims gaining sources:** if allowed, the database lane can add the corroboration found for `forearm:biceps.function` and `forearm:brachialis.function`.
7. **The frozen `forearm:brachialis.appearance`** says "may show at its sides"; both reviews confirmed only the outer side. It stays on the forearm page, frozen; a correction would be a new forearm claim.
8. **A human or full-text review** before `upper_arm_mappings_v1` is published, since publishing freezes reviewed claims: the StatPearls triceps article and the abstract-only studies first.
9. **Not taken up:** Villalba et al. 2024 (push-downs; long-head EMG highest with a palm-up handle), a candidate long-head selectivity claim seen as an abstract only, and Akima 2021, whose abstract was cut off mid-result.

## 10. Unconfirmed bibliographic details

As the dossier's §10, less what the fix round confirmed (the StatPearls triceps authors; the PubMed id of `aott.triceps_heads`): co-authors of `pmid.11408907`; authors of `wiley.biceps_accessory_heads`; the PubMed id of `pmid.16735585` (inferred from a Weill Cornell record); author lists of `mdpi.biceps_curl_grips`; the Kenhub videos (descriptions only); the partly garbled Elsevier summary for the medial head; the Loyola pages' titles and dates; whether `elsevier.biceps_brachii` lists a shoulder action (cited for the origins only); `imaios.biceps_long_head` (one summary); the PubMed id of `viamedica.subanconeus` (so its key is not a pmid); and, for `frontiers.triceps_pushdown_fatigue`, the wording of the review it summarises (Landin et al. 2018, Journal of Clinical Medicine Research), which was not seen.
