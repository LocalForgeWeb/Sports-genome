# Specialization atlas: back anatomy and its evidence (19 Oct 2026)

What the back's anatomy content says, what it rests on, and how far that review can be trusted. This is the anatomy lane's research dossier for wave B; the content files it feeds are `shared/specialization/regions/back/{nodes,nodeActions,claims}.ts`, `shared/specialization/sources/back.ts` and, for any action wave 0 has not already added, `shared/specialization/actions/back.ts`. Ids, names, short names, kinds, roles, layers, parents and region actions are those fixed in 10-multi-region.md §1.2; the method, limits and wording follow 03-anatomy-evidence.md. The machine-readable form, with every query and excerpt, is `dossier.json` beside this file; the raw search log is `searchlog.txt`.

**This dossier is incomplete.** The shared web-search budget for the turn ran out after this lane's seventh search. The trapezius (the parent and its three parts) is reviewed; the rhomboids, levator scapulae, latissimus dorsi, teres major, erector spinae and quadratus lumborum are draft, each with its reason and the searches that would finish it (§8). Nothing here should be merged as reviewed beyond the four trapezius nodes until a follow-up session has run those searches.

## 1. Method

**What was reviewed.** Every node of the region in §1.2: the trapezius (a parent) and its upper, middle and lower parts, the rhomboids, the levator scapulae (adjacent), the latissimus dorsi, the teres major, the erector spinae and the quadratus lumborum; 10 nodes. For each, a function and an appearance claim: 20 claims, 20 node-action rows and 10 joint actions. No selectivity or variation claim was written, because no EMG, clinical or variation finding on a back muscle was recorded before the budget ran out. The external member, the posterior deltoid, belongs to the shoulders lane.

**How.** Web search only, as for the forearm. Page fetches are refused by the network proxy, so each claim was checked against what the search results showed: titles, URLs and the tool's generated summaries with quoted excerpts. Seven searches were run (Q1 to Q7), three of them restricted to one publisher's domain so an excerpt could be tied to its page; the eighth and ninth were refused with "this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)". No workaround was tried. The chest and shoulders lanes had already recorded, on the same day and with their queries, excerpts that name back muscles (the climbing-muscles line on shoulder adduction, Loyola's adduction list, StatPearls' serratus anterior article on upward rotation, Kenhub's teres minor and infraspinatus relations); these are cited with that lane's query and marked as seen through another lane's search. For each claim:

1. Search for reputable references in the evidence standard's order: NCBI Bookshelf (StatPearls), peer-reviewed papers, university anatomy pages (Loyola University Chicago's LUMEN), Kenhub, Elsevier Complete Anatomy. Wikipedia appeared in results and was never cited.
2. Add each relied-on reference with a `<publisher>.<topic>` key and a note saying exactly what the search showed and what it could not confirm. Where another lane holds the same URL, the same key is used (`kenhub.shoulder_joint`, `kenhub.teres_minor`, `kenhub.infraspinatus`; `statpearls.serratus_anterior` is expected from the chest lane).
3. Cite it on the claim with a locator and a qualification where the source is limited (search excerpt, location only, another lane's search, link only).
4. Record, for every citation, the query and the excerpt relied on, verbatim (`citations` in the JSON). A script checked that every quoted fragment appears word for word in the three logs.
5. Mark a claim `reviewed` only when the recorded excerpts support every sentence, with `reviewedAt: "2026-10-19"` and the note "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist." Appearance claims carry the forearm's appearance note adapted to the date and are always `anatomical_inference`.
6. A node is `reviewed` only when all its function claims are.

Three Elsevier pages and one StatPearls page appeared only as result titles, with no excerpt (`elsevier.levator_scapulae`, `elsevier.latissimus_dorsi`, `elsevier.rhomboid_major`, `statpearls.back_muscles`). They are cited on draft claims as the reference to check first, with the qualification that they support nothing yet, so that no draft claim is left without a source.

## 2. Limits

- **The search budget.** Seven searches cover the trapezius well and the rhomboids partly; the other five muscles have one borrowed excerpt each or none. That is the main limit of this dossier, and it is why twelve of the twenty claims are draft.
- **Excerpts, not full texts.** StatPearls showed its introductions and parts of "Structure and Function"; section headings were not shown with the excerpts, so StatPearls locators follow the article layout. Elsevier showed its Quick Facts. Each citation says so.
- **Search summaries can misquote.** Two errors were caught: Q7's summary said Wikipedia's rhomboid insertion order "differs from the StatPearls description" when the StatPearls lines it quoted agree; and a Q2 line on the lower fibres ("effective for depression and upward rotation, with only assistance in retraction") was numbered to a result that was a patent, so it is not used. Function claims rest on two or more references.
- **Automated review.** "Reviewed" means checked by this automated process against search results, not by a clinician or an anatomist. A human anatomy review is the next step before publishing the back's version as reviewed content.
- **Nothing here is hypertrophy evidence.** No selectivity claim was written; when one is, it will say what was measured and that it is not growth, and it must never become a set-credit weight.

## 3. Claims by node

"Sources" gives each source key with the locator cited on the claim. Draft reasons are in §6.

| Node | Node status | Claim | Kind · basis | Review | Sources (locator) |
|---|---|---|---|---|---|
| Trapezius `back.trapezius` | reviewed | `back.trapezius.function` | function · established_anatomy | reviewed | statpearls.trapezius (Introduction; Structure and Function); elsevier.trapezius (Quick Facts: Action); kenhub.trapezius (Function) |
|  |  | `back.trapezius.appearance` | appearance · anatomical_inference | reviewed | statpearls.trapezius (Introduction: a broad, superficial back muscle); elsevier.trapezius_descending (Quick Facts: Origin and insertion); elsevier.trapezius_ascending (Quick Facts: Origin and insertion) |
| Upper trapezius `back.upper_trapezius` | reviewed | `back.upper_trapezius.function` | function · established_anatomy | reviewed | statpearls.trapezius (Structure and Function: upper fibres); elsevier.trapezius_descending (Quick Facts: Action); kenhub.trapezius (Function: descending fibres); statpearls.serratus_anterior (Structure and Function: upward rotation with the trapezius) |
|  |  | `back.upper_trapezius.appearance` | appearance · anatomical_inference | reviewed | elsevier.trapezius_descending (Quick Facts: Origin and insertion); statpearls.trapezius (Introduction: a broad, superficial back muscle) |
| Middle trapezius `back.middle_trapezius` | reviewed | `back.middle_trapezius.function` | function · established_anatomy | reviewed | statpearls.trapezius (Structure and Function: middle fibres); elsevier.trapezius_transverse (Quick Facts: Action); kenhub.trapezius (Function: transverse fibres) |
|  |  | `back.middle_trapezius.appearance` | appearance · anatomical_inference | reviewed | elsevier.trapezius_transverse (Quick Facts: Origin and insertion); statpearls.trapezius (Introduction: a broad, superficial back muscle) |
| Lower trapezius `back.lower_trapezius` | reviewed | `back.lower_trapezius.function` | function · established_anatomy | reviewed | statpearls.trapezius (Structure and Function: lower fibres); elsevier.trapezius_ascending (Quick Facts: Action); kenhub.trapezius (Function: inferior fibres); statpearls.serratus_anterior (Structure and Function: upward rotation with the trapezius) |
|  |  | `back.lower_trapezius.appearance` | appearance · anatomical_inference | reviewed | elsevier.trapezius_ascending (Quick Facts: Origin and insertion); statpearls.trapezius (Introduction: a broad, superficial back muscle) |
| Rhomboids `back.rhomboids` | draft | `back.rhomboids.function` | function · established_anatomy | draft | statpearls.rhomboids (Structure and Function); kenhub.rhomboids (Function); statpearls.trapezius (Structure and Function: rotation against the levator scapulae and rhomboids); elsevier.rhomboid_major (Quick Facts: Action (to check)) |
|  |  | `back.rhomboids.appearance` | appearance · anatomical_inference | draft | statpearls.rhomboids (Structure and Function: attachments); elsevier.trapezius_transverse (Quick Facts: Origin and insertion (the area the trapezius covers)) |
| Levator scapulae `back.levator_scapulae` | draft | `back.levator_scapulae.function` | function · established_anatomy | draft | kenhub.trapezius (Function: descending fibres work with levator scapulae); statpearls.trapezius (Structure and Function: rotation against the levator scapulae and rhomboids); elsevier.levator_scapulae (Quick Facts: Action (to check)) |
|  |  | `back.levator_scapulae.appearance` | appearance · anatomical_inference | draft | elsevier.levator_scapulae (Quick Facts: Origin and insertion (to check)) |
| Latissimus dorsi `back.latissimus_dorsi` | draft | `back.latissimus_dorsi.function` | function · established_anatomy | draft | kenhub.shoulder_joint (Movements: adduction); luc.upper_limb_joint_actions (Shoulder: adduction); elsevier.latissimus_dorsi (Quick Facts: Action (to check)) |
|  |  | `back.latissimus_dorsi.appearance` | appearance · anatomical_inference | draft | kenhub.infraspinatus (Relations: deep to trapezius, deltoid and latissimus dorsi); elsevier.latissimus_dorsi (Quick Facts: Origin and insertion (to check)) |
| Teres major `back.teres_major` | draft | `back.teres_major.function` | function · established_anatomy | draft | kenhub.shoulder_joint (Movements: adduction); luc.upper_limb_joint_actions (Shoulder: adduction) |
|  |  | `back.teres_major.appearance` | appearance · anatomical_inference | draft | kenhub.teres_minor (Relations: inferior neighbour) |
| Erector spinae `back.erector_spinae` | draft | `back.erector_spinae.function` | function · established_anatomy | draft | statpearls.back_muscles (Structure and Function (to check)) |
|  |  | `back.erector_spinae.appearance` | appearance · anatomical_inference | draft | statpearls.back_muscles (Structure and Function (to check)) |
| Quadratus lumborum `back.quadratus_lumborum` | draft | `back.quadratus_lumborum.function` | function · established_anatomy | draft | statpearls.back_muscles (Structure and Function (to check)) |
|  |  | `back.quadratus_lumborum.appearance` | appearance · anatomical_inference | draft | statpearls.back_muscles (Structure and Function (to check)) |

Totals: 10 function, 10 appearance, 0 selectivity, 0 variation; 8 reviewed (4 function, 4 appearance), 12 draft (6 function, 6 appearance). 17 sources, every one cited by a claim; 5 are shared with or borrowed from the chest and shoulders lanes. 45 citations, each with its query and excerpt in the JSON.

### The statements

- `back.trapezius.function` (reviewed): The trapezius moves and steadies the shoulder blade. Its upper part raises the shoulder blade and turns it upward, its middle part pulls it back toward the spine, and its lower part pulls it down and helps turn it upward. The upper part also helps move the head and neck.
- `back.trapezius.appearance` (reviewed): The trapezius is a broad surface muscle of the back of the neck and the upper and middle back, running from the base of the skull and the spine out to the collarbone and the shoulder blade. Together its parts may contribute to the slope between the neck and the shoulder and to much of the surface of the upper back. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.upper_trapezius.function` (reviewed): The upper (descending) part of the trapezius raises the shoulder blade, working with the levator scapulae, and turns it upward together with the lower part and the serratus anterior. It helps hold the shoulders up against gravity when carrying a load, and helps draw the shoulder blade toward the spine. It also extends the head and neck and bends them to the side.
- `back.upper_trapezius.appearance` (reviewed): The upper part of the trapezius lies in the surface layer, running from the base of the skull, the back of the neck and the lowest neck vertebra to the outer third of the collarbone and the point of the shoulder (acromion), so it may contribute to the slope from the neck to the point of the shoulder. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.middle_trapezius.function` (reviewed): The middle (transverse) part of the trapezius pulls the shoulder blade back toward the spine (retraction), working with the rhomboids.
- `back.middle_trapezius.appearance` (reviewed): The middle part of the trapezius lies in the surface layer of the upper back, running across from the spine (the lowest neck vertebra to the fourth chest vertebra) to the point of the shoulder and the outer part of the shoulder blade's bony ridge, so it may contribute to the contour of the upper back between the shoulder blades. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.lower_trapezius.function` (reviewed): The lower (ascending) part of the trapezius pulls the shoulder blade down (depression) and helps the upper part turn it upward, together with the serratus anterior. It also helps draw the shoulder blade toward the spine.
- `back.lower_trapezius.appearance` (reviewed): The lower part of the trapezius lies in the surface layer of the middle back, its fibres rising from the spine (the fifth to the twelfth chest vertebrae) to the inner end of the shoulder blade's bony ridge, so it may contribute to the contour of the middle back between and below the shoulder blades. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.rhomboids.function` (draft): The rhomboids, major and minor, pull the shoulder blade back toward the spine and up, and rotate it so its socket turns downward. They also hold the inner edge of the shoulder blade against the back of the rib cage, and the serratus anterior works against them.
- `back.rhomboids.appearance` (draft): The rhomboids lie between the spine and the inner edge of the shoulder blade, from the base of the neck to about the level of the fifth chest vertebra, under the trapezius, so they have little or no contour of their own; they may add to the fullness of the upper back between the shoulder blades. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.levator_scapulae.function` (draft): Levator scapulae raises the shoulder blade, working with the upper trapezius. It also helps rotate the shoulder blade so its socket turns downward, and helps bend the neck to the side.
- `back.levator_scapulae.appearance` (draft): Levator scapulae runs down the side and back of the neck from the upper neck vertebrae to the upper inner corner of the shoulder blade, mostly covered by the upper trapezius and the muscles at the side of the neck, so it has little contour of its own. It is not a back growth target.
- `back.latissimus_dorsi.function` (draft): Latissimus dorsi brings the arm down to the side (adduction) and down and back from in front of the body (extension), and turns it inward. With the pectoralis major and the teres major it is one of the strong adductors anatomy texts call the climbing muscles.
- `back.latissimus_dorsi.appearance` (draft): Latissimus dorsi is a broad surface muscle of the lower and side back, running from the lower spine and the back of the pelvis up across the side of the trunk and under the armpit to the upper-arm bone, and it covers part of the lower shoulder blade. It may contribute to the width of the back below the armpits and to the outline of the side of the trunk. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.teres_major.function` (draft): Teres major helps bring the arm down to the side (adduction) and down and back (extension), and turns it inward, working with the latissimus dorsi.
- `back.teres_major.appearance` (draft): Teres major runs from the lower outer edge of the shoulder blade, below the teres minor, to the front of the upper-arm bone at the back of the armpit, so it may contribute to a small bulge between the lower outer edge of the shoulder blade and the armpit. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.erector_spinae.function` (draft): The erector spinae straightens the back from a forward bend and holds it upright; working on one side it helps bend the trunk to that side. It is three columns on each side of the spine (iliocostalis, longissimus and spinalis).
- `back.erector_spinae.appearance` (draft): The erector spinae runs in two columns, one on each side of the spine, under other back muscles over most of its length, so there it has little or no contour of its own. In the lower back, where a sheet of connective tissue covers it, it may contribute to the two columns either side of the spine. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- `back.quadratus_lumborum.function` (draft): Quadratus lumborum bends the trunk to the side and helps hold the lower back steady; with both sides working it helps straighten the lower back.
- `back.quadratus_lumborum.appearance` (draft): Quadratus lumborum lies deep in the lower back, between the lowest rib and the top of the pelvis and in front of the erector spinae, so it has little or no contour of its own.

## 4. Node fields

**Trapezius** `back.trapezius` · muscle · group · layer — · short name Trapezius · node key traps · status reviewed

- Aliases: trapezius muscle, traps
- Location: Back of the neck and the upper and middle back, from the base of the skull and the spine out to the collarbone and the shoulder blade.
- What it does: Moves and steadies the shoulder blade. Its upper part raises it, its middle part pulls it back toward the spine, its lower part pulls it down, and the upper and lower parts turn it upward. The upper part also helps move the head and neck.
- Shape note: Together its three parts may contribute to the slope between the neck and the shoulder and to much of the surface of the upper back. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: A group here, not a single target: work is counted for its upper, middle and lower parts. / References divide it into upper, middle and lower parts (descending, transverse and ascending), each with its own attachments on the spine.
- Surface visibility: `clear`. StatPearls calls the trapezius a broad, superficial back muscle (statpearls.trapezius, Q6).
- Layer check: Parent node, not drawn (layer '—' in §1.2). StatPearls calls the whole muscle superficial, so 'surface' is the honest value if the type needs one.
- databaseMuscle candidate: none. No single 'trapezius' canonical name was seen; the recorded database fixture holds 'middle_trapezius' and 'lower_trapezius' as muscles and 'trapezius' as a muscle_group label. A parent is not drawn or selectable, so null is safe.

**Upper trapezius** `back.upper_trapezius` · head · target · layer surface · short name UpperTrap · node key traps · status reviewed

- Aliases: upper traps, upper trapezius fibres, descending part of the trapezius
- Location: Back and side of the neck, from the base of the skull and the neck vertebrae out to the outer end of the collarbone and the point of the shoulder.
- What it does: Raises your shoulder blade, as in a shrug, and turns it upward when the arm goes overhead. It helps hold the shoulders up when you carry a load, and helps extend the head and neck and bend them to the side.
- Shape note: May contribute to the slope from the neck to the point of the shoulder. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Raising the shoulder blade loads it together with the levator scapulae; this atlas does not split the work between them. / Its work on the head and neck is anatomy only; neck movements are not counted on this page.
- Surface visibility: `clear`. A surface muscle (statpearls.trapezius: superficial) running from the skull and neck to the clavicle and acromion (elsevier.trapezius_descending). That it forms the visible neck-to-shoulder slope is an inference from that location, not reported by a source.
- Layer check: §1.2 'surface': supported (StatPearls: the trapezius is superficial; Elsevier's attachments for the descending part). No outcrop note applies.
- databaseMuscle candidate: `upper_trapezius`. Candidate; not among the muscles in the recorded database fixture (server/fixtures/liveMuscleAggregation.ts), which holds only the muscles of nine exercises. The database lane checks it.

**Middle trapezius** `back.middle_trapezius` · head · target · layer surface · short name MidTrap · node key upperBack · status reviewed

- Aliases: middle traps, middle trapezius fibres, transverse part of the trapezius
- Location: Upper back, running across from the spine at the base of the neck and the upper chest vertebrae to the bony ridge of the shoulder blade and the point of the shoulder.
- What it does: Pulls your shoulder blade back toward the spine, working with the rhomboids.
- Shape note: May contribute to the contour of the upper back between the shoulder blades. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Pulling the shoulder blades back loads it together with the rhomboids; this atlas does not split the work between them.
- Surface visibility: `partial`. A surface muscle (statpearls.trapezius), but no source seen describes it as separately visible; 'partial' is an inference from its position between the upper and lower parts.
- Layer check: §1.2 'surface': supported (StatPearls: superficial; elsevier.trapezius_transverse: C7-T4 to the acromion and the spine of the scapula).
- databaseMuscle candidate: `middle_trapezius`. Seen as a canonical name in the recorded database fixture.

**Lower trapezius** `back.lower_trapezius` · head · target · layer surface · short name LowerTrap · node key traps · status reviewed

- Aliases: lower traps, lower trapezius fibres, ascending part of the trapezius
- Location: Middle of the back: from the spine between and below the shoulder blades up to the inner end of the bony ridge of the shoulder blade.
- What it does: Pulls your shoulder blade down, and helps the upper trapezius turn it upward when the arm goes overhead. It also helps draw the shoulder blade toward the spine.
- Shape note: May contribute to the contour of the middle back between and below the shoulder blades. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: References differ in how much weight they give it in turning the shoulder blade upward: one describes it as helping the upper part, another lists upward rotation among its own actions.
- Surface visibility: `partial`. A surface muscle (statpearls.trapezius); no source seen describes its visibility. Inference from location.
- Layer check: §1.2 'surface': supported (StatPearls: superficial; elsevier.trapezius_ascending: T5-T12 to the medial end of the spine of the scapula).
- databaseMuscle candidate: `lower_trapezius`. Seen as a canonical name in the recorded database fixture.

**Rhomboids** `back.rhomboids` · muscle · target · layer intermediate · short name Rhomboids · node key upperBack · status draft

- Aliases: rhomboid major, rhomboid minor, rhomboid muscles, rhomboid
- Location: Upper back between the spine and the inner edge of the shoulder blade, from the base of the neck to about the level of the fifth chest vertebra, under the trapezius.
- What it does: Pull your shoulder blade back toward the spine and up, and turn it so its socket faces down. They also hold its inner edge against the rib cage.
- Shape note: Lie under the trapezius, so they have little or no contour of their own; they may add to the fullness of the upper back between the shoulder blades. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Two muscles, rhomboid major and rhomboid minor, shown as one: they share their actions. / Pulling the shoulder blades back loads them together with the middle trapezius; this atlas does not split the work between them.
- Surface visibility: `not_distinct`. Covered by the trapezius. Not confirmed by an excerpt this session: statpearls.rhomboids places them from C7-T5 to the inner edge of the shoulder blade, inside the area the trapezius covers (elsevier.trapezius_transverse and _ascending: C7-T12 to the spine of the scapula). Inference.
- Layer check: §1.2 'intermediate': consistent with the attachments seen, which place the rhomboids inside the area the superficial trapezius covers; no excerpt states their depth. Not contradicted, not confirmed.
- databaseMuscle candidate: `rhomboid_major`. 'rhomboid_major' is seen in the recorded database fixture; no 'rhomboid_minor' or 'rhomboids' row was seen. One node stands for both muscles; the database lane decides which canonical name it refines.

**Levator scapulae** `back.levator_scapulae` · muscle · adjacent · layer intermediate · short name LevScap · node key — · status draft

- Aliases: levator scapulae muscle, levator scap
- Location: Side and back of the neck, from the upper neck vertebrae down to the upper inner corner of the shoulder blade.
- What it does: Raises your shoulder blade, working with the upper trapezius, and helps turn it so its socket faces down. It also helps bend the neck to the side.
- Shape note: Mostly covered by the upper trapezius and the muscles at the side of the neck, so it has little contour of its own. It is not a back growth target.
- Caveats: Shown beside the back muscles because of where it sits and what it does to the shoulder blade; back specialization does not target it.
- Surface visibility: `not_distinct`. Not checked this session (no excerpt on its location or depth). Textbook anatomy, unverified here.
- Layer check: §1.2 'intermediate': not checked this session. To check in a follow-up: whether part of it lies uncovered in the side of the neck, which would be a surface outcrop in the drawing's Side view.
- databaseMuscle candidate: `levator_scapulae`. Candidate; not seen in the recorded database fixture.

**Latissimus dorsi** `back.latissimus_dorsi` · muscle · target · layer surface · short name Lat · node key lats · status draft

- Aliases: lats, lat, latissimus
- Location: Lower and side back: from the lower spine and the back of the pelvis, up across the side of the trunk and under the armpit to the front of the upper-arm bone.
- What it does: Pulls your arm down to your side and down and back from in front of you, as in a pull-up or a row, and turns the arm inward.
- Shape note: May contribute to the width of the back below the armpits and to the outline of the side of the trunk. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Pull-ups, pulldowns and rows load it together with the teres major, which shares its actions at the shoulder; this atlas does not split the work between them.
- Surface visibility: `clear`. Not checked this session beyond one excerpt that has it covering part of the back of the shoulder blade (kenhub.infraspinatus, a shoulders-lane excerpt). Textbook anatomy, unverified here.
- Layer check: §1.2 'surface': consistent with the one excerpt seen (it covers part of the infraspinatus, kenhub.infraspinatus); its attachments and the extent of the lower trapezius over it were not checked. Not contradicted.
- databaseMuscle candidate: `latissimus_dorsi`. Seen as a canonical name in the recorded database fixture.

**Teres major** `back.teres_major` · muscle · target · layer surface · short name TMajor · node key — · status draft

- Aliases: teres major muscle
- Location: Lower outer edge of the shoulder blade, below the teres minor, running to the front of the upper-arm bone at the back of the armpit.
- What it does: Helps pull your arm down to your side and back, and turn it inward, working with the latissimus dorsi.
- Shape note: May contribute to a small bulge between the lower outer edge of the shoulder blade and the armpit. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: It shares the latissimus dorsi's actions at the shoulder, so pulls load them together; this atlas does not split the work between them.
- Surface visibility: `partial`. Not checked this session; the only excerpt places it below the teres minor (kenhub.teres_minor). How much of it the latissimus dorsi and the deltoid cover was not seen.
- Layer check: §1.2 'surface': not checked this session. To check: how much of it the latissimus dorsi and the deltoid cover.
- databaseMuscle candidate: `teres_major`. Seen as a canonical name in the recorded database fixture.

**Erector spinae** `back.erector_spinae` · muscle · target · layer deep (surface outcrop, lumbar window) · short name ES · node key lowerBack · status draft

- Aliases: erectors, spinal erectors, sacrospinalis, erector spinae group
- Location: Two columns along the back, one on each side of the spine, from the back of the pelvis up toward the base of the skull.
- What it does: Straightens your back from a forward bend and holds it upright; working on one side it helps bend the trunk to that side.
- Shape note: Covered by other back muscles over most of its length, so there it has little or no contour of its own. In the lower back, where it is covered mainly by a sheet of connective tissue, it may contribute to the two columns either side of the spine. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Three columns (iliocostalis, longissimus and spinalis) shown as one: they share the action of straightening the back. / The sheet of connective tissue over it in the lower back (thoracolumbar fascia) is drawn as structure, not muscle.
- Surface visibility: `partial`. Not checked this session (no excerpt on the erector spinae was returned before the budget ran out). Textbook anatomy, unverified here.
- Layer check: §1.2 'deep (surface outcrop, lumbar window)': not checked this session. Not contradicted.
- databaseMuscle candidate: `erector_spinae`. Seen as a canonical name in the recorded database fixture.

**Quadratus lumborum** `back.quadratus_lumborum` · muscle · target · layer deep · short name QL · node key — · status draft

- Aliases: quadratus lumborum muscle, QL
- Location: Deep in the lower back, one on each side of the lower spine, between the lowest rib and the top of the pelvis.
- What it does: Bends your trunk to the side and helps hold the lower back steady, as when a load is carried in one hand; with both sides working it helps straighten the lower back.
- Shape note: Deep in the lower back, in front of the erector spinae, so it has little or no contour of its own. Visible shape also depends on neighbouring muscles, body fat and individual anatomy.
- Caveats: Also listed on the core page; it is counted once, as a back muscle.
- Surface visibility: `not_distinct`. Not checked this session. Textbook anatomy, unverified here.
- Layer check: §1.2 'deep': not checked this session. Not contradicted.
- databaseMuscle candidate: `quadratus_lumborum`. Candidate; not seen in the recorded database fixture.

## 5. Node actions

Each row cites `<node>.function`; a row is reviewed only when that claim is. The trapezius parent has none: a parent is neither drawn nor selectable (§7.3).

| Node | Action | Role | Row status | What the claim rests on |
|---|---|---|---|---|
| Upper trapezius | scapula.elevation | prime | reviewed | Main action in all three references (statpearls.trapezius, elsevier.trapezius_descending, kenhub.trapezius). |
| Upper trapezius | scapula.upward_rotation | prime | reviewed | StatPearls credits the upper fibres with upward rotation and the lower fibres with helping; Elsevier lists it for the descending part; StatPearls (serratus anterior) names the upper and lower fibres together. |
| Upper trapezius | scapula.retraction | assist | reviewed | Elsevier lists retraction for the descending part and Kenhub gives its pull a medial component ('superomedially'); StatPearls names only the middle fibres as retractors. |
| Middle trapezius | scapula.retraction | prime | reviewed | Main action in all three references. |
| Lower trapezius | scapula.depression | prime | reviewed | Main action in StatPearls ('depressors') and Elsevier; Kenhub 'inferomedially'. |
| Lower trapezius | scapula.upward_rotation | assist | reviewed | StatPearls: the lower fibres 'help the upper fibers rotate the scapula upward'. Elsevier lists upward rotation among its actions without ranking; the conservative role follows StatPearls (see disagreements). |
| Lower trapezius | scapula.retraction | assist | reviewed | Elsevier lists retraction for the ascending part and Kenhub gives its pull a medial component ('inferomedially'). |
| Rhomboids | scapula.retraction | prime | draft | StatPearls 'retract'; Kenhub 'primarily retract the scapula superomedially'. |
| Rhomboids | scapula.elevation | assist | draft | StatPearls 'elevate'; Kenhub's 'superomedially' gives the retraction an upward component. |
| Rhomboids | scapula.downward_rotation | prime | draft | Direction not in the excerpts (draft): StatPearls 'rotate the scapula', Kenhub 'rotate the glenoid cavity'. |
| Levator scapulae | scapula.elevation | prime | draft | Kenhub's trapezius page: the descending fibres work with levator scapulae to elevate the scapula (draft: one reference). |
| Levator scapulae | scapula.downward_rotation | assist | draft | No excerpt (draft); inferred from StatPearls' 'rotation against the levator scapulae and rhomboids'. |
| Latissimus dorsi | shoulder.adduction | prime | draft | Kenhub: one of three powerful adductors; Loyola: the adductors are pectoralis major and latissimus dorsi. |
| Latissimus dorsi | shoulder.extension | prime | draft | No excerpt this session (draft). |
| Teres major | shoulder.adduction | prime | draft | Kenhub groups it with the latissimus dorsi and pectoralis major as 'powerful adductors'; Loyola says adduction is 'aided by teres major' (disagreement on emphasis). Prime is also what the region tests need: every target muscle needs a main action. |
| Teres major | shoulder.extension | assist | draft | No excerpt this session (draft). |
| Erector spinae | spine.extension | prime | draft | No excerpt this session (draft). |
| Erector spinae | spine.lateral_flexion | assist | draft | No excerpt this session (draft). |
| Quadratus lumborum | spine.lateral_flexion | prime | draft | No excerpt this session (draft). |
| Quadratus lumborum | spine.extension | assist | draft | No excerpt this session (draft). |

20 rows: 7 reviewed (the trapezius parts), 13 draft.

### Joint actions the back needs

All ten §1.2 back actions are new against the forearm's twenty. Three reuse the shoulders lane's wording word for word; wave 0 adds one definition of each to `shared/specialization/actions/`.

| Id | Joint | Label | Plain description | Note |
|---|---|---|---|---|
| `shoulder.extension` | Shoulder | Shoulder extension | Brings the arm down and back from in front of the body, and on behind it. | Same wording as the shoulders lane's dossier; shared with the shoulders, chest and upper arm (wave 0 adds one definition). |
| `shoulder.adduction` | Shoulder | Shoulder adduction | Brings the arm down to the side of the body from out to the side. | Shared with the chest; proposed wording. |
| `shoulder.horizontal_abduction` | Shoulder | Horizontal abduction | With the arm raised to shoulder height, moves it backward, away from the front of the chest. | Same wording as the shoulders lane's dossier. No own back muscle has a row for it in this dossier; the back lists it for its external member, the posterior deltoid. |
| `scapula.elevation` | Shoulder blade (on the rib cage) | Elevation of the shoulder blade | Raises the shoulder blade toward the ear, as in a shrug. | New with the back. |
| `scapula.retraction` | Shoulder blade (on the rib cage) | Retraction of the shoulder blade | Pulls the shoulder blade back toward the spine, drawing the shoulder blades together. | New with the back. |
| `scapula.depression` | Shoulder blade (on the rib cage) | Depression of the shoulder blade | Pulls the shoulder blade down, away from the ear. | Shared with the chest; proposed wording. |
| `scapula.upward_rotation` | Shoulder blade (on the rib cage) | Upward rotation of the shoulder blade | Turns the shoulder blade so its socket faces upward, as happens when the arm is raised overhead. | Same wording as the shoulders lane's dossier; shared with the shoulders and chest. |
| `scapula.downward_rotation` | Shoulder blade (on the rib cage) | Downward rotation of the shoulder blade | Turns the shoulder blade so its socket faces downward, as happens when a raised arm is pulled back down to the side. | New with the back. |
| `spine.extension` | Spine (trunk) | Spine extension | Straightens the trunk from a forward bend, or arches it back. | New with the back. |
| `spine.lateral_flexion` | Spine (trunk) | Side bending of the trunk | Bends the trunk to the side. | Shared with the core; proposed wording. |

## 6. Claims left draft, and what was deliberately not claimed

- `back.rhomboids.function`: The direction of rotation ('so its socket turns downward') is not in any recorded excerpt: StatPearls says 'rotate the scapula' and Kenhub 'rotate the glenoid cavity'. Downward rotation is inferred from StatPearls naming the serratus anterior (an upward rotator) as their antagonist and from the trapezius article's 'rotation against the levator scapulae and rhomboids'. The search budget ran out before a confirming search (Kenhub or Elsevier rhomboid major). Every other sentence is supported by statpearls.rhomboids and kenhub.rhomboids. Wording the recorded excerpts already support: "The rhomboids, major and minor, pull the shoulder blade back toward the spine and up, and rotate it. They also hold the inner edge of the shoulder blade against the back of the rib cage, and the serratus anterior works against them."
- `back.rhomboids.appearance`: Their depth under the trapezius is not stated in any recorded excerpt; it is inferred from the attachments (rhomboids C7-T5 to the inner edge of the shoulder blade; the superficial trapezius C7-T12 to the spine of the scapula). The location sentence is supported by statpearls.rhomboids.
- `back.levator_scapulae.function`: Only the first sentence has an excerpt, and that from another muscle's page (Kenhub's trapezius article, via a generated summary). Downward rotation and bending the neck were not searched. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted. Wording the recorded excerpts already support: "Levator scapulae raises the shoulder blade, working with the upper trapezius."
- `back.levator_scapulae.appearance`: No excerpt on its location or depth was recorded. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted.
- `back.latissimus_dorsi.function`: Adduction is supported by two references (kenhub.shoulder_joint, luc.upper_limb_joint_actions), both seen only through the chest lane's searches. Extension and turning the arm inward have no recorded excerpt. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted. Wording the recorded excerpts already support: "Latissimus dorsi brings the arm down to the side (adduction). With the pectoralis major and the teres major it is one of the strong adductors anatomy texts call the climbing muscles."
- `back.latissimus_dorsi.appearance`: Only 'it covers part of the lower shoulder blade' has an excerpt (kenhub.infraspinatus). Its attachments and its surface position over the side and lower back were not searched. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted.
- `back.teres_major.function`: Adduction with the latissimus dorsi is supported by two references (Kenhub calls the three 'powerful adductors'; Loyola says adduction is 'aided by teres major'). Extension and turning the arm inward have no recorded excerpt. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted. Wording the recorded excerpts already support: "Teres major helps bring the arm down to the side (adduction), working with the latissimus dorsi and the pectoralis major."
- `back.teres_major.appearance`: Only 'below the teres minor' has an excerpt (kenhub.teres_minor). Its attachments, its place at the back of the armpit and how much other muscles cover it were not searched. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted.
- `back.erector_spinae.function`: No excerpt on the erector spinae was recorded. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted.
- `back.erector_spinae.appearance`: No excerpt on its location, depth or the lumbar window was recorded. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted.
- `back.quadratus_lumborum.function`: No excerpt on the quadratus lumborum was recorded. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted.
- `back.quadratus_lumborum.appearance`: No excerpt on its location or depth was recorded. The shared web-search budget for this turn ran out after this lane's seventh search, before this muscle was searched; no workaround was attempted.

A draft function claim keeps its node draft and its node-action rows draft, as the forearm's rule requires. Where part of a draft function claim is supported, the supported wording is given, so a reviewer can choose between publishing the narrower claim (and fewer node actions) and waiting for the follow-up search.

**Not claimed:**

- No selectivity claims: no EMG or clinical finding on a back muscle was recorded this session. The chest lane's Ludewig 2004 push-up result (lowest upper-trapezius-to-serratus ratio in the push-up plus) is a serratus finding and is left to the chest.
- No variation claims: none was searched.
- No node actions for the trapezius parent (parents are neither drawn nor selectable, §7.3).
- No horizontal abduction rows for back muscles; the back lists the action for the posterior deltoid (external).
- Neck actions (D2).

## 7. Single-source claims, unconfirmed details and disagreements

**Single-source.** No reviewed function claim rests on one reference. Sentences inside reviewed claims that rest on one reference: the upper trapezius helping hold the shoulders up against gravity when carrying a load (kenhub.trapezius); the upper trapezius extending the head and neck (Elsevier only, its descending-part and whole-muscle pages); the middle trapezius 'working with the rhomboids' (kenhub.trapezius). Draft function claims with a single supporting reference for what is supported: back.levator_scapulae.function (elevation: kenhub.trapezius, another muscle's page).

**Unconfirmed bibliographic details.**

- statpearls.trapezius: authors and update date not shown; the Bookshelf id NBK518994 came from the search, not from opening the page; the excerpts came from the statpearls.com point-of-care copy (30528) and the Bookshelf record.
- statpearls.rhomboids: authors not shown; NBK534856 from the search.
- statpearls.serratus_anterior: seen only through the chest lane; title from that lane's log.
- statpearls.back_muscles: exact title not shown; contents beyond the trapezius unknown.
- luc.upper_limb_joint_actions: full URL not recorded by the chest lane ('meddean.luc.edu lumen ue/ueaction.html'); left empty rather than reconstructed.
- kenhub.shoulder_joint: the adduction line is tied to this page by inference from a three-page result list.
- kenhub.trapezius: lines are tied to the page by the result numbers in generated summaries; Q1 returned it once with a space in the URL.
- elsevier.levator_scapulae, elsevier.latissimus_dorsi, elsevier.rhomboid_major: titles and URLs only.

**Disagreements between sources, and how the wording handles them.**

- Lower trapezius and upward rotation. StatPearls frames the lower fibres mainly as depressors that help the upper fibres rotate the scapula upward; Elsevier lists upward rotation among the ascending part's own actions; StatPearls' serratus anterior article names the upper and lower fibres together. Wording: the lower part 'helps the upper part turn it upward'; node action 'assist'; a caveat says references differ.
- Retraction by the upper and lower parts. StatPearls names only the middle fibres as retractors; Elsevier lists retraction for all three parts; Kenhub gives the upper and lower parts' pull a medial component. Wording: 'helps draw the shoulder blade toward the spine'; node actions 'assist'.
- Teres major in adduction. Kenhub groups it with the latissimus dorsi and pectoralis major as 'powerful adductors'; Loyola says adduction is 'aided by teres major'. Wording: 'helps bring the arm down'; node action 'prime' (draft), so that the target has a main action; the follow-up should settle it.
- A second Kenhub overview (upper limb muscles and movements) assigned elevation and depression to the lower fibres and extension, elevation and retraction to the upper and middle fibres, against Kenhub's own trapezius page, StatPearls and Elsevier. Not cited.
- Elsevier frames the trapezius parts' actions at the joints of the shoulder girdle (acromioclavicular and sternoclavicular), StatPearls and Kenhub at the scapula. The claims say 'the shoulder blade', which both framings move.
- Summary errors seen: Q7's summary said Wikipedia's rhomboid insertion order 'differs from the StatPearls description', but the StatPearls lines it quoted say the same (major below minor). Q2's line that the ascending fibres are 'effective for depression and upward rotation, with only assistance in retraction' was numbered (5-5), and result 5 in that list was a patent ('Muscle stretching apparatus'); it is not used.

## 8. Deviations and open issues

**Against §1.2: 0 contradictions.** Nothing recorded contradicts a back row. The trapezius parts' `surface` layer is supported; every other layer, and the erector spinae's lumbar-window outcrop, is unchecked rather than confirmed.

- **D1 (proposed_addition (not applied)), Node actions outside the back's region actions.** §1.2 lists the latissimus dorsi and teres major as external members of the shoulders, whose region actions include shoulder.internal_rotation, and node actions are declared only by a node's home region (§1.3). The back's region actions do not include internal rotation, so as drafted the shoulders page could show these two muscles only under shoulder.extension. Both draft function claims already state that the muscle turns the arm inward. Proposal: If the follow-up search confirms it and the adversarial review accepts it: add rows (back.latissimus_dorsi, shoulder.internal_rotation, prime) and (back.teres_major, shoulder.internal_rotation, assist) resting on their function claims. The schema has no rule tying a node action to its home region's region actions (node_actions references actions only). Not applied here.
- **D2 (observation (no change proposed)), Neck actions.** The upper trapezius extends the head and neck and bends them to the side (elsevier.trapezius_descending, kenhub.trapezius), and the levator scapulae is described as bending the neck (unconfirmed this session). §1.2 has no neck action; spine.extension and spine.lateral_flexion are worded here for the trunk. The claims state the neck actions as anatomy, and no node action counts them, as the forearm left the hand's actions out.
- **D3 (to check (unevidenced)), back.levator_scapulae layer.** From textbook anatomy, not from an excerpt: part of the levator scapulae lies in the side of the neck between the upper trapezius and the sternocleidomastoid, covered only by fascia and skin. If confirmed, the drawing's Side view could show it as a surface outcrop of an intermediate node. §1.2 is unchanged.

**Open issues.**

1. **Finish the search.** This lane ran seven web searches (Q1-Q7). The eighth and ninth were refused: 'this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)'. No workaround was attempted (no curl, no reader services). Excerpts the chest and shoulders lanes recorded on 19 Oct 2026 that name back muscles were reused, each citation naming that lane's query. The trapezius (four nodes) is fully reviewed; the rhomboids, levator scapulae, latissimus dorsi, teres major, erector spinae and quadratus lumborum are draft and need a follow-up session. The searches still needed, in order:
   - Rhomboids: direction of rotation (Kenhub rhomboid muscles 'Function'; Elsevier rhomboid major 20614 'Action'); depth under the trapezius.
   - Levator scapulae: StatPearls, Kenhub, Elsevier 18540 (action, attachments, relations, the side-of-neck question in D3).
   - Latissimus dorsi: StatPearls, Kenhub, Elsevier 20795 (extension, internal rotation, attachments, surface relations, the lower trapezius over its upper edge).
   - Teres major: StatPearls, Kenhub, Elsevier (extension, internal rotation, relations to the latissimus dorsi and deltoid; prime or assist in adduction).
   - Erector spinae: StatPearls back muscles NBK537216 or its erector spinae article, Kenhub, Radiopaedia (extension, lateral flexion, columns, depth, the lumbar window and the thoracolumbar fascia).
   - Quadratus lumborum: StatPearls, Kenhub (lateral flexion, extension, steadying, depth).
   - Selectivity candidates, from the agent's own memory and NOT verified or cited: trapezius and serratus EMG across rehabilitation exercises (Ekstrom and colleagues, 2003); trapezius part ratios (Cools and colleagues, 2007); lat pulldown grip width; pull-up versus chin-up; quadratus lumborum in the side bridge (McGill's group). Each needs a search and an excerpt before it can be a claim.
   - Variation candidates, from memory and NOT verified: the axillary arch of the latissimus dorsi; accessory slips of the levator scapulae.
2. **A test rule for the integration lane.** The forearm test 'gives every muscle a main action' checks every node of kind 'muscle'. back.trapezius is kind 'muscle' with role 'group' and, as a parent, has no node actions (§7.3), so a back test copied from the forearm's would fail on it (the shoulders' deltoid is in the same position). The region test should skip parent nodes.
3. **The Loyola URL.** `luc.upper_limb_joint_actions` has no URL here; take it from the chest lane's record when that lane writes its sources, and keep one key for the page.
4. **Human review.** A clinician or anatomist should read the claims before the back's version is published as reviewed content.

## 9. Copy

Every node and claim string was checked by script for the forearm test's patterns: no 'left' or 'right', no per cent sign or 'percent', no 'optimal' or 'guarantee', no 'will grow', no vendor name, no 'table' or 'tables'; cited source titles likewise. One Elsevier page title carried a side word ("Trapezius Muscle (Left)", the left-side model); the cited title drops it and the source note keeps it. Directions are anatomical: toward the spine, the point of the shoulder, the base of the skull, the side of the trunk; "either side of the spine" and "one on each side" where both sides are meant.

