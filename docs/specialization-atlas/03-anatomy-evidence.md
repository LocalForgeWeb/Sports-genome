# Specialization atlas: forearm anatomy and its evidence (16 Oct 2026)

What the forearm content says, what it rests on, and how far that review can be trusted. The content is `shared/specialization/regions/forearm/{nodes,actions,nodeActions,claims,sources}.ts`; the rules it is held to are tested in `client/src/lib/specialization/forearmAnatomy.test.ts`. The brief is `brief-2026-10-16.md` (§2, §3, §13); the design is `02-design.md`.

## 1. Method

**What was reviewed.** Every `function`, `selectivity` and `variation` claim, and every `appearance` claim, for the 19 core muscles, the two compartments, the anconeus, and the biceps and brachialis as external contributors: 60 claims on 24 nodes, and the 38 node-action rows that rest on them.

**How.** Web search only. The build environment cannot open web pages (page fetches fail), but a web-search tool works, so each claim was checked against what the search results showed: titles, URLs and excerpts or summaries of the pages. Searches were batched by muscle and by question. For each claim:

1. Search for reputable references, preferring NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy teaching pages (Texas Tech El Paso, UAMS), Kenhub, Elsevier Complete Anatomy, Radiopaedia and IMAIOS. Wikipedia was read but never cited alone (it is not cited at all).
2. Add each relied-on reference to `sources.ts` as `A<n>`, with a note saying exactly what the search result showed, and anything the search could not confirm (an author list, a Bookshelf id, a full title).
3. Cite it on the claim with a `locator` (the section or heading the excerpt came from) and a `qualification` where the source is limited (abstract only, acute EMG, a methods paper, a clinical cohort).
4. Mark the claim `reviewed` only when the results supported every sentence of it, with `reviewedAt: "2026-10-16"` and the note "Checked against the cited sources through web search on 16 Oct 2026; automated review, not a clinician or anatomist." Otherwise leave it `draft` and say why.
5. Appearance claims are reviewed only as anatomical inference from the cited location and depth, and their note says so. Their basis is always `anatomical_inference`; none is a measured or predicted change in size.
6. A node is `reviewed` only when every one of its function claims is.

Wording was then rewritten until a sentence said no more than the sources: where references disagreed (brachioradialis and forearm position, the abductor pollicis longus at the wrist), the claim says that they disagree or the action is left out.

## 2. Limits

- **Excerpts, not full texts.** Most StatPearls articles showed only their introduction and part of "Structure and Function" without a login. Several sources were seen as abstracts only (S2, S3, S6, A4, A10, A16, A25, A30). Each such citation says so in its qualification.
- **Search summaries can misquote.** The search tool returns generated summaries around its excerpts. Where it could, the review used two or more independent references per function claim. Function claims resting on a single reference: `fcu.function` (A8), `pl.function` (A9), `ecrb.function` (A29), `ecu.function` (A31), `biceps.function` (A50), `brachialis.function` (A51). All six are standard textbook actions, and each source is the StatPearls article for that muscle.
- **Unconfirmed bibliographic details.** A5 (authors and journal), A16 (exact title), A21 (Bookshelf id reported as NBK580564, not opened), A26 (journal), A34 (exact title). The claims cite what the excerpts said, not the missing details.
- **Automated review.** "Reviewed" here means checked by this automated process against search results. It is not a review by a clinician or an anatomist, and the database lane should not publish the content as clinically verified on the strength of it. A human anatomy review is the next step before calling any of it settled.
- **Nothing here is hypertrophy evidence.** The selectivity claims cite acute EMG or clinical studies. They say what was measured and that it is not growth, and they must never become set-credit weights (brief §2, "Do not convert EMG percentage into a hypertrophy coefficient").

## 3. The brief's own sources

| Id | Used? | What the search showed |
|---|---|---|
| S1 | Not cited by anatomy claims | Accounting evidence, not anatomy. Unchanged. |
| S2 | Cited by four selectivity claims | Abstract confirmed: surface EMG of ECRB, ECU, FCR, FCU in 40 healthy arms at a constant wrist torque of three quarters of the neutral maximum. ECRB higher in pronation; ECU unchanged; FCR higher in supination; FCU lower in pronation than neutral. ECRL not recorded. DOI added. |
| S3 | Cited by `fds.selectivity.1` | Abstract confirmed: one finger flexing at half its maximum activated fewer than half of the units in other fingers' FDS parts; low-force spill-over mostly to adjacent fingers; ring and little fingers the most coupled. DOI added. |
| S4 | Not cited | The forearm page never appeared in results; the same site's alphabetical upper-limb reference did (A38). Its title was reworded to drop the word "tables" (athlete copy never says "table"). |
| S5 | Not cited | Not returned by search. |
| S6 | Cited by `anterior.function` | Abstract and introduction only: eight anterior muscles in superficial and deep groups. |
| S7 | Not cited | Not returned by search; Kenhub (A6) and IMAIOS (A7) cover FCR. |
| S8 | Not cited | The Bookshelf id NBK526046 could not be matched to the FDP article. The StatPearls FDP article was found as PubMed 30252302 and is cited as A14. |
| S9 | Removed | Not anatomy and cited by nothing; removed from the region's sources on 16 Oct (see open issue 1). |

## 4. Claims by node

Every claim below is `reviewed`. "Sources" gives each source id with the locator cited on the claim.

| Node | Status | Claim | Kind · basis | Review | Sources (locator) |
|---|---|---|---|---|---|
| Palm side `forearm.anterior` | reviewed | `anterior.function` | function · established_anatomy | reviewed | A52 (Introduction; Structure and Function); A12 (Introduction: intermediate layer); S6 (Abstract) |
|  |  | `anterior.appearance` | appearance · anatomical_inference | reviewed | A53 (Overview of the superficial group); A20 (Deep flexors: under FDS, close to the bones) |
| Back side `forearm.posterior` | reviewed | `posterior.function` | function · established_anatomy | reviewed | A52 (Introduction; Structure and Function); A54 (Overview: muscles of the superficial group and their functions); A55 (Overview: functions of the deep group) |
|  |  | `posterior.appearance` | appearance · anatomical_inference | reviewed | A54 (Overview of the superficial group); A3 (Overview: most superficial muscle on the thumb side) |
| BR `forearm.br` | reviewed | `br.function` | function · established_anatomy | reviewed | A1 (Structure and Function); A2 (Quick Facts: Action) |
|  |  | `br.selectivity.1` | selectivity · experimental | reviewed | A4 (Abstract: Results); A5 (Record summary) |
|  |  | `br.appearance` | appearance · anatomical_inference | reviewed | A3 (Overview and palpation); A2 (Relations: border of the hollow in front of the elbow) |
| FCR `forearm.fcr` | reviewed | `fcr.function` | function · established_anatomy | reviewed | A6 (Key facts: Function); A7 (Function) |
|  |  | `fcr.selectivity.1` | selectivity · experimental | reviewed | S2 (Abstract: Results) |
|  |  | `fcr.appearance` | appearance · anatomical_inference | reviewed | A6 (Overview: superficial layer of the anterior forearm); A3 (Overview: most superficial muscle on the thumb side) |
| FCU `forearm.fcu` | reviewed | `fcu.function` | function · established_anatomy | reviewed | A8 (Introduction; Structure and Function) |
|  |  | `fcu.selectivity.1` | selectivity · experimental | reviewed | S2 (Abstract: Results) |
|  |  | `fcu.appearance` | appearance · anatomical_inference | reviewed | A8 (Introduction: superficial flexor; Structure: attachments); A53 (Overview of the superficial group) |
| PL `forearm.pl` | reviewed | `pl.function` | function · established_anatomy | reviewed | A9 (Structure and Function) |
|  |  | `pl.variation.1` | variation · established_anatomy | reviewed | A10 (Abstract: Results); A11 (Variant anatomy); A9 (Clinical Significance) |
|  |  | `pl.appearance` | appearance · anatomical_inference | reviewed | A9 (Structure and Function); A53 (Overview of the superficial group) |
| FDS `forearm.fds` | reviewed | `fds.function` | function · established_anatomy | reviewed | A12 (Introduction; Structure and Function); A13 (Quick Facts: Action) |
|  |  | `fds.selectivity.1` | selectivity · experimental | reviewed | S3 (Abstract) |
|  |  | `fds.selectivity.2` | selectivity · experimental | reviewed | A16 (Abstract: Results and Conclusions); A12 (Structure and Function: joints it crosses); A14 (Structure and Function: joints it crosses) |
|  |  | `fds.appearance` | appearance · anatomical_inference | reviewed | A12 (Introduction: intermediate layer); A53 (Overview: FDS beneath the superficial four) |
| FDP `forearm.fdp` | reviewed | `fdp.function` | function · established_anatomy | reviewed | A14 (Structure and Function); A15 (Quick Facts: Action) |
|  |  | `fdp.selectivity.1` | selectivity · experimental | reviewed | A16 (Abstract: Results and Conclusions); A14 (Structure and Function: joints it crosses) |
|  |  | `fdp.appearance` | appearance · anatomical_inference | reviewed | A20 (Deep flexors: under FDS, close to the bones, difficult to palpate); A14 (Structure: tendons deep to FDS) |
| FPL `forearm.fpl` | reviewed | `fpl.function` | function · established_anatomy | reviewed | A17 (Introduction); A18 (Summary: Action); A19 (Function) |
|  |  | `fpl.appearance` | appearance · anatomical_inference | reviewed | A17 (Structure: course along the thumb side, deep to FDS); A20 (Deep flexors: under FDS, close to the bones) |
| PT `forearm.pt` | reviewed | `pt.function` | function · established_anatomy | reviewed | A21 (Structure and Function); A22 (Key facts: Function) |
|  |  | `pt.appearance` | appearance · anatomical_inference | reviewed | A21 (Structure and Function: attachments and the hollow in front of the elbow); A22 (Key facts: Origin and insertion) |
| PQ `forearm.pq` | reviewed | `pq.function` | function · established_anatomy | reviewed | A23 (Summary: Action); A24 (Key facts: Function); A25 (Abstract); A26 (Dynamic stabilizers) |
|  |  | `pq.appearance` | appearance · anatomical_inference | reviewed | A23 (Summary: location); A24 (Overview) |
| ECRL `forearm.ecrl` | reviewed | `ecrl.function` | function · established_anatomy | reviewed | A27 (Key facts: Function); A28 (Quick Facts: Action) |
|  |  | `ecrl.selectivity.1` | selectivity · experimental | reviewed | A30 (Abstract); A29 (Structure and Function: works with ECRL) |
|  |  | `ecrl.appearance` | appearance · anatomical_inference | reviewed | A54 (Overview of the superficial group); A1 (Structure: the mobile wad with ECRL and ECRB) |
| ECRB `forearm.ecrb` | reviewed | `ecrb.function` | function · established_anatomy | reviewed | A29 (Introduction; Structure and Function) |
|  |  | `ecrb.selectivity.1` | selectivity · experimental | reviewed | A30 (Abstract); A29 (Structure and Function: works with ECRL) |
|  |  | `ecrb.selectivity.2` | selectivity · experimental | reviewed | S2 (Abstract: Results) |
|  |  | `ecrb.appearance` | appearance · anatomical_inference | reviewed | A29 (Introduction; Structure: partly covered by ECRL) |
| ECU `forearm.ecu` | reviewed | `ecu.function` | function · established_anatomy | reviewed | A31 (Introduction; Structure and Function) |
|  |  | `ecu.selectivity.1` | selectivity · experimental | reviewed | S2 (Abstract: Results) |
|  |  | `ecu.appearance` | appearance · anatomical_inference | reviewed | A31 (Structure: attachments); A54 (Overview of the superficial group) |
| ED `forearm.ed` | reviewed | `ed.function` | function · established_anatomy | reviewed | A32 (Quick Facts: Action); A33 (Function); A34 (Structure and Function) |
|  |  | `ed.appearance` | appearance · anatomical_inference | reviewed | A33 (Overview: belly and tendons); A54 (Overview of the superficial group) |
| EDM `forearm.edm` | reviewed | `edm.function` | function · established_anatomy | reviewed | A35 (Function); A34 (Structure and Function) |
|  |  | `edm.appearance` | appearance · anatomical_inference | reviewed | A35 (Overview); A36 (Extensor digiti minimi) |
| EI `forearm.ei` | reviewed | `ei.function` | function · established_anatomy | reviewed | A37 (Function); A36 (Extensor indicis); A34 (Structure and Function) |
|  |  | `ei.appearance` | appearance · anatomical_inference | reviewed | A37 (Overview: a deep extensor); A36 (Extensor indicis: origin) |
| APL `forearm.apl` | reviewed | `apl.function` | function · established_anatomy | reviewed | A38 (Abductor pollicis longus); A39 (Function); A40 (Quick Facts: Action) |
|  |  | `apl.appearance` | appearance · anatomical_inference | reviewed | A38 (Anatomical snuffbox note); A41 (Relations: anatomical snuffbox) |
| EPB `forearm.epb` | reviewed | `epb.function` | function · established_anatomy | reviewed | A41 (Function); A42 (Quick Facts: Action) |
|  |  | `epb.variation.1` | variation · established_anatomy | reviewed | A43 (Introduction and review of insertion studies) |
|  |  | `epb.appearance` | appearance · anatomical_inference | reviewed | A41 (Overview and relations: anatomical snuffbox) |
| EPL `forearm.epl` | reviewed | `epl.function` | function · established_anatomy | reviewed | A44 (Introduction); A45 (Function) |
|  |  | `epl.appearance` | appearance · anatomical_inference | reviewed | A44 (Structure: course and the third extensor compartment) |
| SUP `forearm.supinator` | reviewed | `supinator.function` | function · established_anatomy | reviewed | A46 (Overview and Function); A47 (Quick Facts: Action and testing with the elbow straight); A50 (Introduction: most powerful supinator when the elbow is flexed) |
|  |  | `supinator.appearance` | appearance · anatomical_inference | reviewed | A46 (Overview and relations: deep in the forearm); A55 (Overview of the deep group) |
| ANC `forearm.anconeus` | reviewed | `anconeus.function` | function · established_anatomy | reviewed | A48 (Function); A49 (Quick Facts: Action); A38 (Anconeus) |
|  |  | `anconeus.appearance` | appearance · anatomical_inference | reviewed | A48 (Overview: location); A49 (Quick Facts: location) |
| Biceps `upper_arm.biceps` | reviewed | `biceps.function` | function · established_anatomy | reviewed | A50 (Introduction) |
|  |  | `biceps.appearance` | appearance · anatomical_inference | reviewed | A50 (Introduction: attachments) |
| Brachialis `upper_arm.brachialis` | reviewed | `brachialis.function` | function · established_anatomy | reviewed | A51 (Introduction) |
|  |  | `brachialis.appearance` | appearance · anatomical_inference | reviewed | A51 (Introduction: deeper than the biceps) |

Totals: 24 function, 24 appearance, 10 selectivity, 2 variation; 60 reviewed, 0 draft. 58 of the 64 region sources are cited (the uncited ones are S1, S4, S5, S7, S8, S9).

## 5. Node actions

| Node | Actions (role) |
|---|---|
| BR | elbow.flexion (prime) |
| FCR | wrist.flexion (prime), wrist.radial_deviation (prime) |
| FCU | wrist.flexion (prime), wrist.ulnar_deviation (prime) |
| PL | hand.palmar_aponeurosis_tension (prime), wrist.flexion (assist) |
| FDS | fingers.pip_flexion (prime), fingers.mcp_flexion (assist), wrist.flexion (assist) |
| FDP | fingers.dip_flexion (prime), fingers.pip_flexion (assist), fingers.mcp_flexion (assist), wrist.flexion (assist) |
| FPL | thumb.ip_flexion (prime) |
| PT | forearm.pronation (prime), elbow.flexion (assist) |
| PQ | forearm.pronation (prime), forearm.distal_radioulnar_stabilization (assist) |
| ECRL | wrist.extension (prime), wrist.radial_deviation (prime) |
| ECRB | wrist.extension (prime), wrist.radial_deviation (prime) |
| ECU | wrist.extension (prime), wrist.ulnar_deviation (prime) |
| ED | fingers.extension (prime), wrist.extension (assist) |
| EDM | little_finger.extension (prime) |
| EI | index_finger.extension (prime) |
| APL | thumb.cmc_abduction (prime) |
| EPB | thumb.mcp_extension (prime) |
| EPL | thumb.ip_extension (prime), thumb.mcp_extension (assist) |
| SUP | forearm.supination (prime) |
| ANC | elbow.extension (assist) |
| Biceps | elbow.flexion (prime), forearm.supination (prime) |
| Brachialis | elbow.flexion (prime) |

Each row cites `<node>.function`. Against the lane's starting list: PL's two rows were added (the starting list had none for PL); EPL thumb-knuckle extension (assist) was added because both EPL references name it (A44, A45); APL radial deviation was **not** added (see §6).

## 6. Claims left draft, and what was deliberately not claimed

**Draft claims: none.** Every claim's sentences were supported by the search results once worded to the sources. Where support was missing, the content was left out rather than kept as a draft, because a draft function claim would also hold its node back from `reviewed` and the action would still be visible to the page:

- **APL at the wrist.** The brief allows radial deviation "if sources support". They disagree: Kenhub's English article lists wrist extension, its German article and video radial deviation, and Elsevier lists no wrist action. Not added; the APL caveat says references disagree.
- **Brachioradialis turning the forearm.** It returns the forearm toward thumb-up from either end of rotation (A1). Listing it under pronation and supination would offer it as a pronator or supinator target, so it is said in the claim and a caveat instead.
- **Brachioradialis and "neutral forearm".** Textbooks call it strongest half-turned (A2), but EMG studies disagree (A4 found a larger share palm down; A5 no difference). `br.function` keeps the textbook statement attributed to "anatomy references"; `br.selectivity.1` states the disagreement.
- **FPL at the thumb knuckle.** Supported (A17), but `ids.ts` has no thumb-knuckle flexion action; adding one is outside this lane. Said in `fpl.function`.
- **Minor actions** (FCU and ECRL at the elbow, FCR in pronation, EI, EPL and EDM at the wrist, EPB in thumb abduction): named by some sources as weak, left out of node actions so suggestions are not driven by them.
- **PT versus PQ selectivity.** The brief's mapping queue says pronation work is shared. No source was found on separating them in exercise, so there is no selectivity claim; both nodes carry a caveat that palm-down work loads them together, which follows from both being pronators (A21, A23). The mappings lane should mark pronation mappings `allocation: "shared"`.

## 7. Identity fields

Ids, layers, borders and catalog keys were kept. Points reviewed:

- **ECRB layer** stays `surface` with `surfaceVisibility: "partial"`: it belongs to the superficial extensor group (A29, A54) and is partly covered by ECRL, which `partial`, the shape note and the appearance claim say. The brief's display column calls it "Layered".
- **Anconeus border** stays `ulnar`. It runs from the lateral epicondyle (thumb side) to the lateral olecranon and upper ulna (A48), so it sits over the top of the ulna at the back of the elbow; the location line says this in plain words.
- **Aliases added** (no collisions; tested): FDS "flexor digitorum sublimis" (its former name, A12), EDM "extensor digiti quinti", EI "extensor indicis proprius" (A34).
- **actions.ts wording:** pronation and supination now say "palm down" and "palm up" with the elbow bent; finger actions say "the four fingers"; little-finger and index extension say "on its own"; thumb abduction says "out from the hand at its base, away from the index finger"; the distal radioulnar action is labelled "Steadies the forearm bones at the wrist" rather than "Holds the forearm bones together", which overstated a dynamic stabiliser.

## 8. Open issues

1. **S9 names the backend vendor in its title** and sits in the region's sources. Athlete copy must never name it. The page lane should list only sources cited by a claim or mapping (S9 is cited by neither), or the foundation should move S9 out of the region data. **Resolved 16 Oct:** S9 was removed from `sources.ts`, since no claim or mapping cited it; the database notes (04-database.md) keep the reference.
2. **Human review.** A clinician or anatomist should read the 60 claims before the mapping version or the seed is published as reviewed content.
3. **Full texts.** The StatPearls articles and the abstract-only studies should be read in full when the pages can be opened, and the locators tightened to exact headings.
4. **Source id prefixes.** Anatomy sources use `A<n>`; the mappings lane's `mappingSources.ts` should use a different prefix. The anatomy test fails if any source id repeats across the two lists.
