# Specialization atlas: upper-arm anatomy and its evidence (wave A, 22 Oct 2026)

What the upper-arm content says, what it rests on, and how far its review can be trusted. The content is `shared/specialization/regions/upper_arm/{ids,nodes,members,nodeActions,claims,review,content}.ts` and `shared/specialization/sources/upper_arm.ts`, plus the forearm's membership caveats on the biceps and brachialis in `regions/forearm/members.ts`. Its own rules are tested in `client/src/lib/specialization/upper_armAnatomy.test.ts`; the rules every region keeps, in `regionContent.test.ts`. The binding design is `../../10-multi-region.md` (§1.1–§1.3, §8, §10). The research is `research/dossier.md` and `research/dossier.json` (19 Oct 2026, with an independent second review the same day, its §13): every query and the excerpt relied on are recorded there, verbatim. This note says what the anatomy lane took from the dossier, what it decided where the dossier left a question open, and what is still open.

The upper arm is still a `reference` region in the registry: the integration lane promotes it (label "Upper arms", status `production`) with its mapping version.

## 1. Said plainly

> "Reviewed" means an automated agent checked each sentence against web-search excerpts and generated summaries of the cited sources on the date shown. It was not checked against the full texts, and not by a clinician or anatomist. A second automated review, with the same tools and limits, looked for errors; it is not peer review. The drawings are original schematics checked against these notes, not reviewed by an anatomist.

## 2. Method and limits

The dossier's method (its §1) and limits (its §2) hold, and are the forearm's (`../../03-anatomy-evidence.md`): web search only, because the proxy refuses page fetches (ncbi, pmc, kenhub, radiopaedia, elsevier and the like); every source was seen as search excerpts, a generated summary, an abstract or a video description, and each citation's qualification says which. Search summaries can misquote; that is why each new function claim rests on three to five references.

**What this lane did on 22 Oct 2026.** It turned the dossier into code without changing any claim's statement, sources, locators or qualifications, and checked that mechanically: a one-off comparison of every claim, node and source in the code against `dossier.json` found no difference apart from the three edits listed in §4 (two sentences of the biceps node and the draft claim's note). It then re-searched four points, with the same tools and limits, to confirm the facts its own decisions rest on:

- the biceps at the shoulder: the search summary of Kenhub's article again gave elbow flexion and supination plus "a weak role in flexing the arm at the glenohumeral joint"; Physiopedia (not cited) calls its part in shoulder flexion minor;
- the long head of the triceps: summaries of StatPearls, Kenhub, Radiopaedia and IMAIOS again gave it as the only head crossing the shoulder, assisting extension and adduction there, a small action next to its work at the elbow;
- the coracobrachialis: the summary gave Loyola's action as bringing the arm forward and weakly toward the midline, and Elsevier's as adduction and flexion, as the dossier has them;
- the medial head at the surface: a summary named sources saying it reaches the surface only close to the point of the elbow, but they were a training site, a wiki and a lecture handout, none of them in the evidence standard's list, so nothing was cited and the outcrop stays weakly supported (§7, open issue 3).

These re-searches confirmed and added nothing cited. No claim was re-dated: every reviewed upper-arm claim keeps `reviewedAt: "2026-10-19"`, the date its excerpts were checked.

## 3. What the content holds

| | Count | Notes |
|---|---|---|
| Nodes | 7 | §1.2's: biceps and brachialis (frozen ids), the triceps parent, its long, lateral and medial heads, the coracobrachialis (adjacent). All `reviewed`. |
| Members | 8 | The seven, then the forearm's brachioradialis (`forearm.br`, short name `BR`) as an external member. |
| Region actions | 5 | `elbow.flexion`, `elbow.extension`, `forearm.supination`, `shoulder.flexion`, `shoulder.extension`, as §1.2 lists them. No new action: the library already holds all five. |
| Node actions | 9 | 3 the forearm's, frozen; 6 new (§5). |
| Claims kept in the folder | 24 | The forearm's 4 on the biceps and brachialis (owner `forearm`, frozen, keys unchanged) and the upper arm's 20: 6 function, 7 appearance, 6 selectivity, 1 variation; 19 reviewed, 1 draft. |
| Citations (own claims) | 62 | Each with a locator and, where the source is limited, a qualification. |
| Sources | 29 new + 3 | `sources/upper_arm.ts`; the claims also cite the forearm's A4 (Kleiber 2015), A50 and A51 (StatPearls, biceps and brachialis). |

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

The three triceps names are the app's canonical names (`shared/capabilityRank.ts`, which maps each to the `triceps` key). They are **not** in the test stub of `public.muscles` (`server/fixtures/specializationPg.ts`, which holds the five forearm-era names), and `nodes.database_muscle` is a foreign key into `public.muscles`: production must be read, read-only, to confirm the three rows exist before seed v3 is applied, and the stub then gains them.

## 4. What the lane decided

**Biceps × `shoulder.flexion`, listed as `assist`** (the dossier's open issue 2; its second review left it to the lane). This is a product choice, recorded as one:
- the evidence fixes the role, not the choice to list it: four anatomy references list the action (Kenhub "weak", Loyola "weakly", IMAIOS "weak", TeachMeAnatomy unrated), and EMG studies disagree on whether the long head is active at all (`upper_arm.biceps.selectivity.2`), so it can only be `assist`, never `prime`;
- the forearm left weak extras out because they would add noise to suggestions; only `prime` rows name a missing action (`recommendations.ts`, `missingPrimeActions`), so an `assist` row does not;
- without it, no upper-arm muscle that can be mapped performs `shoulder.flexion` (its other performer, the coracobrachialis, is adjacent, and mappings refuse adjacent nodes), so a movement target on the region's own action could never be counted;
- it is the same kind of row as the long head's `shoulder.extension`, which the dossier lists as `assist` on the same kind of evidence.

The mapping lane decides, exercise by exercise, whether any exercise credits it; the row only makes that possible. The biceps' caveat says it plainly: "Its help raising the arm forward is weak, and studies disagree on whether its long head works in shoulder movement at all, so it is listed only as helping there." (the dossier's "so that is not counted as a shoulder action here" stood only if the row stayed out). The alternative, a §1.2 deviation removing `shoulder.flexion` from the region, would also take the coracobrachialis's only action away.

**The triceps parent has no node action** (open issue 5). The platform now exempts any node that is another node's parent from "every muscle a main action" (`regionContent.test.ts`, done in wave 0), as the drawing contract does (§7.3). It keeps a reviewed function claim, so it is `reviewed`.

**`upper_arm.triceps_long.selectivity.2` stays a draft** (open issue 1), as both reviews left it: its excerpts support every sentence, but it reports muscle size measured after training, which §8 keeps out of selectivity claims while §1.2 sends the long head's regional-growth findings to them. Its review note says so in plain words. A draft is shown as "not reviewed yet" and never credits anything; the owner decides whether, and in what words, it is shown.

**The two frozen nodes' neutral text** (§1.3). The sentences that spoke from the forearm's page are now the forearm's caveats on its membership of them: "It is an upper-arm muscle and does not add forearm size." and "Shown only as another muscle that curls and palm-up turning load; not a forearm target." (biceps); "It is not a forearm muscle." and "Shown only as another muscle that curls load; not a forearm target." (brachialis). The nodes take the dossier's neutral location, what it does, shape note and caveats, with two edits by this lane:
- biceps location: "its two heads start on the shoulder blade, join, and cross the elbow" became "its two heads start on the shoulder blade, and it crosses the elbow": the second review found the lower tendon in two parts in many arms, and no excerpt describes where the heads join;
- the biceps' shoulder caveat, reworded for the `assist` row (above).

On the forearm page the two sheets therefore read differently from wave 0: the neutral text, the node's own caveats, then the forearm's two. `pageText.render.test.ts` states each changed line (its wave A rules) and `regionContent.test.ts` ("nothing moved") checks that each membership caveat is the forearm's old words on the node. Nothing else on the forearm page changes, its numbers included. The upper-arm page shows the nodes' own text only.

**The brachioradialis's membership caveat**, the dossier's suggestion: "A forearm muscle shown here because curls load it; it is credited as the forearm counts it." Its node, claims and node actions are the forearm's, unchanged; the upper-arm page shows its `elbow.flexion` row and `forearm:br.function` behind it.

**Claim order.** The medial head's selectivity claim follows its function and appearance claims, as every other node's does (the dossier listed it first).

## 5. Node actions

| Node | Action | Role | Claim |
|---|---|---|---|
| Biceps | `elbow.flexion` | prime | `forearm:biceps.function` (frozen row) |
| Biceps | `forearm.supination` | prime | `forearm:biceps.function` (frozen row) |
| Biceps | `shoulder.flexion` | assist | `upper_arm:upper_arm.biceps.function` (§4) |
| Brachialis | `elbow.flexion` | prime | `forearm:brachialis.function` (frozen row) |
| TriLong | `elbow.extension` | prime | `upper_arm:upper_arm.triceps_long.function` |
| TriLong | `shoulder.extension` | assist | `upper_arm:upper_arm.triceps_long.function` |
| TriLat | `elbow.extension` | prime | `upper_arm:upper_arm.triceps_lateral.function` |
| TriMed | `elbow.extension` | prime | `upper_arm:upper_arm.triceps_medial.function` |
| CB | `shoulder.flexion` | prime (a main action of this muscle, not a main shoulder flexor) | `upper_arm:upper_arm.coracobrachialis.function` |

The lateral and medial heads share every action: their mappings are written `allocation: "shared"` (§1.2), and both their selectivity claims and caveats say the work is not split. Left out on purpose, each said in its claim: the long head's and the coracobrachialis's adduction (not an upper-arm region action), and the medial head's deepest fibres at the elbow capsule (no action id, no load moved, and a dissection study disputes the action).

## 6. Claims

Statements, sources and locators are the dossier's (§4 there, verbatim); every reviewed one is dated 19 Oct 2026 with the note "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist." (appearance claims: "…as an anatomical inference from the muscle's cited location and depth; not a measured prediction…").

| Node | Function | Appearance | Selectivity | Variation |
|---|---|---|---|---|
| Biceps | `forearm:biceps.function` (frozen); `upper_arm.biceps.function` | `upper_arm.biceps.appearance` (the forearm's `biceps.appearance` stays on the forearm page) | `.selectivity.1` (palm position in curls), `.selectivity.2` (the long head at the shoulder) | `.variation.1` (extra heads, no rate) |
| Brachialis | `forearm:brachialis.function` (frozen) | `upper_arm.brachialis.appearance` | | |
| Triceps | `upper_arm.triceps.function` | `.appearance` | | |
| TriLong | `.function` | `.appearance` | `.selectivity.1` (arm height, one study); `.selectivity.2` **draft** (training studies) | |
| TriLat | `.function` | `.appearance` | `.selectivity.1` (shares every action with the medial head) | |
| TriMed | `.function` (the capsule fibres: both views stated) | `.appearance` | `.selectivity.1` (as the lateral head's) | |
| CB | `.function` | `.appearance` | | |

**Single-source function claims:** none new; each new function claim rests on three to five references. The upper-arm page shows two of the forearm's, each on one source: `forearm:biceps.function` (A50) and `forearm:brachialis.function` (A51). Both are frozen; the dossier found corroboration (Elsevier, Kenhub, Loyola, TeachMeAnatomy for the biceps; Radiopaedia, Loyola, TeachMeAnatomy, Kenhub for the brachialis), which only the database lane could add, if frozen claims may gain sources at all (open issue 5). Other single-source claims: `upper_arm.biceps.variation.1` (one meta-analysis) and `upper_arm.triceps_long.selectivity.1` (one ten-person study), each said in its statement.

## 7. Deviations from §1.2

**None.** Every §1.2 row is as written: ids, names, short names, kinds, roles, layers, node keys, parents, the five region actions and the external `forearm.br` (the dossier's §11, re-checked; held by `upper_armAnatomy.test.ts`). The lane's decisions in §4 keep §1.2 as written; the biceps' `assist` row is what lets them. Two §1.2 rows rest on weak evidence and are kept, flagged:
- the medial head's back-view outcrop: no cited source says any of it shows (open issue 3);
- the coracobrachialis's `deep` layer: supported in part (it lies behind the pectoralis major and is felt in the armpit).

## 8. Open issues for the owner

1. **The draft training claim** (`upper_arm.triceps_long.selectivity.2`): show it, reword it, or drop it. §8 and §1.2 disagree on whether a regional-growth finding belongs in a selectivity claim.
2. **The biceps' `assist` shoulder-flexion row** is the lane's product choice (§4). The alternative is a §1.2 deviation taking `shoulder.flexion` off the upper arm, which also leaves the coracobrachialis with no action.
3. **The medial head's outcrop** is weakly supported; keep it small in the drawing, and settle it with a full-text or human review.
4. **The three triceps canonical names** must be confirmed in production's `public.muscles` (read-only) before seed v3; the test stub lacks them.
5. **Frozen claims gaining sources:** if allowed, the database lane can add the corroboration found for `forearm:biceps.function` and `forearm:brachialis.function`.
6. **The frozen `forearm:brachialis.appearance`** says "may show at its sides"; both reviews confirmed only the outer side. It stays on the forearm page, frozen; a correction would be a new forearm claim.
7. **A human or full-text review** before `upper_arm_mappings_v1` is published, since publishing freezes reviewed claims: the StatPearls triceps article and the abstract-only studies first.
8. **Not taken up:** Villalba et al. 2024 (push-downs; long-head EMG highest with a palm-up handle), a candidate long-head selectivity claim seen as an abstract only, and Akima 2021, whose abstract was cut off mid-result.

## 9. Unconfirmed bibliographic details

As the dossier's §10: the PubMed id of `aott.triceps_heads` (DOI confirmed); co-authors of `pmid.11408907`; authors of `wiley.biceps_accessory_heads`; the PubMed id of `pmid.16735585` (inferred from a Weill Cornell record); authors of `statpearls.triceps` beyond its editor; author lists of the two MDPI papers; the training status in `pmid.35819335`; the Kenhub videos (descriptions only); the partly garbled Elsevier summary for the medial head; the Loyola pages' titles and dates; whether `elsevier.biceps_brachii` lists a shoulder action (cited for the origins only); `imaios.biceps_long_head` (one summary); the PubMed id of `viamedica.subanconeus` (so its key is not a pmid); and whether one of the nine women in `mdpi.triceps_fascicle_length` did not finish.
