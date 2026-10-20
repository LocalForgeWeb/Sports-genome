# Regions beyond the forearm: working notes

One folder per region of `../10-multi-region.md` §1.2. Each region's anatomy, mappings and drawing notes land here as its wave is built (§8: `anatomy-evidence.md`, `mappings.md`, `diagram.md`).

`<region>/research/` holds the first evidence pass, written on 19 Oct 2026 before the region's anatomy lane starts: `dossier.json` (nodes, claims, node actions, joint actions, sources, and one citation per claim source with the search query and the excerpt relied on, verbatim) and `dossier.md` (the same, readable, with method, limits and deviations from §1.2). It follows the evidence standard of §8 and was produced the way the forearm's was: web search only, because page fetches are refused here, so every citation rests on search excerpts and generated summaries, never the full text.

Status on 20 Oct 2026: **first pass and independent second review done.** A second automated agent re-searched every selectivity and variation claim and most function claims with its own queries, checked every sentence against its recorded excerpts, and corrected the dossier in place; each `dossier.json` carries a `secondReview` block (queries with excerpts, and every change with what, why and evidence) and each `dossier.md` a "Second review" section. That review used the same tools and limits as the first: it is not peer review, and not a clinician or anatomist. A dossier is still raw material for the region's anatomy lane, not content: nothing in it reaches the app or the database until the lane has turned it into `shared/specialization/regions/<region>/` and that has passed its own adversarial review. Do not re-run the first pass's build scripts: they would overwrite the second review's corrections.

| Region | Nodes | Claims (reviewed / draft) | Sources | Citations | Deviations from §1.2 |
|---|---|---|---|---|---|
| upper_arm | 8 | 20 (19 / 1) | 29 | 62 | 0 |
| shoulders | 9 | 26 (26 / 0) | 42 | 80 | 1 |
| chest | 5 | 19 (19 / 0) | 46 | 88 | 1 |
| back | 10 | 20 (8 / 12) | 29 | 58 | 4 |

Questions the second reviews left for the anatomy lanes and the platform, besides each dossier's own:
- **Parent muscles and the "main action" test.** The deltoid, pectoralis major, trapezius and triceps are kind `muscle`, role `group`, with no node action of their own; `regionContent.test.ts` ("gives every muscle a main action") must skip any node that is another node's parent, as the drawing contract does (§7.3). A platform fix, before any of these regions lands.
- **One wording per shared action.** The shoulders, chest and back lanes worded `shoulder.adduction`, `scapula.depression` and `scapula.upward_rotation` differently; the shared library's wording (`shared/specialization/actions/joints.ts`) is the one used.
- **One key per publisher.** Loyola pages are `loyola.` in the chest and `luc.` in the shoulders; the integration lane picks one.
- **Prime versus assist where only prime drives suggestions** (`recommendations.ts`): the sternocostal head's shoulder extension is assist on the evidence; no mappable upper-arm muscle is prime for `shoulder.flexion`. Each lane records a product choice as a product choice, never as evidence.
- **Back:** six draft claims ready to promote after their excerpts are checked, six that still need an excerpt tied to one page.
