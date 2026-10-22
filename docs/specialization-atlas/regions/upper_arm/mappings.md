# Specialization atlas: upper-arm mappings (wave A, 22 Oct 2026)

Which catalog exercises `upper_arm_mappings_v1` maps, which upper-arm muscles each works and in what way, and which it leaves unmapped and why. The binding design is `../../10-multi-region.md` (§1.2 the muscles and actions, §3 variants, §4.1–§4.2 versions and externals, §8 the evidence standard, §9.2–§9.3 lanes and review); the method is the forearm's (`../../05-mappings.md`), applied to the upper arm. The data:

- `shared/specialization/regions/upper_arm/mappings/`: one file per exercise family, joined by `index.ts` (`upperArmMappings`, `upperArmUnmapped`, and the version record `upperArmMappingVersion`, a draft until the release publishes it).
- `shared/specialization/regions/upper_arm/methodNotes.ts`: the version's method notes, shown under "How this is counted".
- `shared/specialization/variants/upperArm.ts` and `variants/forearm.ts`: the shared variants the rows name (`cat-<id>`). No family declares its own.
- `client/src/lib/specialization/upper_armMappings.test.ts`: the rules over the whole version; `upper_armMappings.<family>.test.ts`: each family's own.

The upper arm's own muscles are the biceps, the brachialis and the three triceps heads. The triceps parent is a group and is never mapped; the coracobrachialis is an adjacent member, explained and never mapped; the brachioradialis is the forearm's, listed here and credited as the forearm's version credits it (§4.2). Region actions: `elbow.flexion`, `elbow.extension`, `forearm.supination`, `shoulder.flexion`, `shoulder.extension`.

## 1. Said plainly

> "Reviewed" means an automated agent checked each sentence against web-search excerpts and generated summaries of the cited sources on the date shown. It was not checked against the full texts, and not by a clinician or anatomist. A second automated review, with the same tools and limits, looked for errors; it is not peer review. The drawings are original schematics checked against these notes, not reviewed by an anatomist.

The version's method notes open with §8's words, with the upper arm's incidental word:

> A reviewed mapping says the muscle does that joint action in that exercise, from anatomy references and, where cited, muscle-activity studies. It does not say how much the exercise loads the muscle. "Incidental steadying" credit means the muscle holds a position while other muscles move the load; it is counted apart and never as direct work.

They go on to say what this version decided: one shared variant per exercise; one muscle, one action, a relationship and a mode per mapping; the lateral and medial heads credited together; the long head's credit never weighted by arm position or by training studies; no exercise counting toward a shoulder-flexion target; the coracobrachialis never credited, the brachioradialis credited as the forearm counts it; drafts shown as pending and never counted.

## 2. Method

**Variants.** Every mapping names a variant from the shared library, `cat-<id>`: the forearm's 119, frozen, and wave A's 125 (`../variants.md`, the variants lane's note). `variantFor(catalogId)` returns the one current variant of each exercise, so the page, the logger and the calculator read an exercise one way. A mapping lane that needs an exercise with no variant asks the variants lane for one; it never writes its own.

**Mappings.** One per variant and upper-arm muscle (the database's unique key), each naming:
- one joint action, which must be one of the muscle's node actions (no fan-out);
- a relationship: `direct` (the exercise is built on this muscle's action), `contributing` (it helps move the load), `stabilizer` (it steadies a joint that does not move), `incidental` (it holds the implement while something else is trained);
- a mode: `dynamic` (its joint moves through range) or `isometric` (it holds).

A stabilizer or incidental mapping is always isometric, so steadying can never earn dynamic credit. The accounting category follows from `categoryFor` (`rules.ts`), as for the forearm.

**One row per muscle and exercise.** A two-joint muscle (the biceps, the triceps' long head) can do two things in one exercise. It is credited for the action the exercise is defined by, and its rationale says what else it does. Nothing is credited twice.

**Evidence and review** (§8). `evidenceBasis` is:
- `anatomy` where the mapping rests on what the muscle does (an elbow extensor in an elbow extension);
- `inference` where it rests on a reading of the set-up (the floor's push bending the elbows in a rollout);
- `emg` only with a muscle-activity source in hand.

A mapping is `reviewed` only with a rationale, a source with a locator and a limitation, and one of those bases; otherwise it is a `draft`, shown as pending review and never counted, and its rationale says why. Every mapping, draft or not, cites a source from the shared library. No growth or training study is cited as a mapping source.

**Shared allocation.** The lateral and medial heads start on the back of the upper-arm bone, end on the point of the elbow and cross only the elbow: they share every action (§1.2; `upper_arm.triceps_lateral.selectivity.1`). Wherever one is mapped the other is too, with the same action, relationship, mode and status, `allocation: "shared"`, so the page says the work cannot be split between them rather than inventing a difference. The long head crosses the shoulder too and has its own row, `individual`. The biceps and brachialis are `individual`.

**Sides.** Both sides count as one on every page (the owner, 20 Oct 2026). Each row still writes its side relation, `same`: every upper-arm muscle here is loaded on the side of the arm that holds or moves the load. No variant this version maps is `not_applicable` for the arms.

**Straps.** `requiresNoStraps` is false on every row: straps decide only grip mappings, which are the forearm's.

**Coverage** (§3, the forearm's rule). The upper arm's catalog keys are `biceps`, `brachialis` and `triceps`, and its page reads primary tags only (§1.1). Every catalog row tagging one of them, as a primary or a secondary muscle, gets a mapping (reviewed or draft) or a listed reason. A secondary-tagged row is mapped where the upper arm is really loaded, or listed. Untagged rows that load the upper arm may be mapped too (the variants lane wrote 11 such variants), and untagged rows a reader might expect to count are listed with their reason, as the forearm lists the sleds. A listed row's sets are shown under "How this is counted" as not counted here, each with its reason.

## 3. Families

186 catalog rows tag an upper-arm key (50 as a primary muscle). They split into three families by the catalog's movement, each row in exactly one (tested):

| Family | File | Movements | Tagged rows |
|---|---|---|---|
| Presses and pushes | `pressesPushes.ts` | horizontal, vertical and diagonal push; anti-rotation press; diagonal press, pull, squat or rotation; scapular protraction; explosive push | 77 |
| Pulls, rows and curls | `pullsCurls.ts` | horizontal and vertical pull; elbow flexion; rotation (379, a row) | 78 |
| Extensions and everything else | `extensionsOther.ts` | elbow extension; throws and slams; wrist extension; forearm supination; anti-rotation; loaded transition; overhead slam; alternating arm drive | 31 |

### 3.1 Presses and pushes

*Integration fills this section from the presses-and-pushes lane's report.* Rows: 1–17, 25–40, 101–110, 120, 146, 147, 158, 159, 249, 251–255, 267–270, 272, 301–310, 322–325, 381, 382, 386, 389.

### 3.2 Pulls, rows and curls

*Integration fills this section from the pulls-rows-and-curls lane's report.* Rows: 24, 43–73, 75–78, 80, 121–138, 256–258, 317, 318, 326–333, 336–342, 379, 383, 384, and the untagged 74, 87, 88 and 335.

### 3.3 Extensions and everything else

Its rows:
- the 31 tagged rows above: 148–157, 160 and 343–349 (the extensions); 271, 273, 279–281, 284 and 285 (medicine-ball work); 350 (cable wrist extension); 380 (anti-rotation walkout); 390 (Turkish get-up); 399 and 400 (battle ropes); 406 (lever supination);
- the untagged rows with a variant that are not pulls: 117–119 (front raises), 164 (Zercher squat), 237 and 238 (rollouts), 283 (sit-up throw), 388 (kettlebell snatch);
- 300 Zercher Carry, untagged, whose biceps and brachialis the forearm's version credited (below);
- the untagged rows the variants lane left without a variant for this family to list.

**Boundary with the other two families.** 350 Cable Wrist Extension and 406 Lever Supination are forearm exercises tagged biceps as a secondary muscle; neither is a curl, so they are this family's. 300 and 406 are the only exercises besides curls on which the forearm's version credited the biceps or brachialis (05-mappings.md): from wave A the forearm page reads those two muscles through this version (§4.2), so both are mapped here and the forearm keeps its credit. The curls themselves are the pulls-rows-and-curls family's.

**92 mappings on 34 exercises: 87 reviewed, 5 draft. 46 exercises listed unmapped.**

| Group | Catalog ids | Mappings |
|---|---|---|
| Skull crushers | 148, 149 | long head, lateral, medial: direct dynamic elbow extension; lateral and medial shared |
| Pushdowns, pressdowns | 150–153, 343–346 | as skull crushers |
| Overhead extensions | 154–156, 349 | as skull crushers |
| Machine, bodyweight, cross-body, kickback | 157, 160, 347, 348 | as skull crushers |
| Front raises | 117–119 | biceps contributing dynamic shoulder flexion, **draft**; nothing else |
| Zercher squat | 164 | biceps, brachialis incidental isometric elbow flexion |
| Zercher carry | 300 | biceps, brachialis contributing isometric elbow flexion (deliberate hold, as the forearm read it) |
| Rollouts | 237, 238 | long head contributing dynamic shoulder extension; lateral and medial stabilizer isometric elbow extension, shared |
| Chest passes | 271, 281 | three heads contributing dynamic elbow extension; lateral and medial shared |
| Overhead slams, forward throw | 273, 284, 285, 280 | as chest passes |
| Battle rope slams | 399 | long head contributing dynamic shoulder extension; lateral and medial contributing dynamic elbow extension, shared, **draft** |
| Turkish get-up | 390 | three heads stabilizer isometric elbow extension; lateral and medial shared |
| Lever supination | 406 | biceps contributing dynamic supination (EMG) |

**Per exercise.** Abbreviations: dyn dynamic, iso isometric, contrib. contributing, stab. stabilizer; "(shared)" allocation shared; **draft** pending review and not counted. LH, Lat, Med: the long, lateral and medial heads of the triceps. The variant column gives the arm's position at the shoulder (the `shoulder` dimension) where the rationale turns on it.

| Id | Exercise | Arm at the shoulder | Mapped muscles |
|---|---|---|---|
| 117 | Dumbbell Front Raise | moves | Biceps contrib. dyn shoulder flexion **draft** |
| 118 | Cable Front Raise | moves | Biceps contrib. dyn shoulder flexion **draft** |
| 119 | Plate Front Raise | moves | Biceps contrib. dyn shoulder flexion **draft** |
| 148 | Skull Crusher | raised in front | LH direct dyn; Lat, Med direct dyn (shared) |
| 149 | Dumbbell Skull Crusher | raised in front | LH direct dyn; Lat, Med direct dyn (shared) |
| 150 | Cable Triceps Pushdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 151 | Rope Triceps Pushdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 152 | Reverse-Grip Pushdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 153 | Single-Arm Cable Pushdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 154 | Overhead Cable Triceps Extension | overhead | LH direct dyn; Lat, Med direct dyn (shared) |
| 155 | Dumbbell Overhead Triceps Extension | overhead | LH direct dyn; Lat, Med direct dyn (shared) |
| 156 | Single-Arm Dumbbell Triceps Extension | overhead | LH direct dyn; Lat, Med direct dyn (shared) |
| 157 | Machine Triceps Extension | raised in front | LH direct dyn; Lat, Med direct dyn (shared) |
| 160 | Bodyweight Triceps Extension | raised in front | LH direct dyn; Lat, Med direct dyn (shared) |
| 164 | Zercher Squat | | Biceps incidental iso elbow flexion; Brachialis incidental iso elbow flexion |
| 237 | Ab-Wheel Rollout | moves | LH contrib. dyn shoulder extension; Lat, Med stab. iso (shared) |
| 238 | Barbell Rollout | moves | LH contrib. dyn shoulder extension; Lat, Med stab. iso (shared) |
| 271 | Medicine-Ball Chest Pass | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 273 | Medicine-Ball Overhead Slam | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 280 | Medicine-Ball Forward Overhead Throw | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 281 | Kneeling Medicine-Ball Chest Pass | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 284 | Medicine-Ball Sprawl-to-Slam | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 285 | Medicine-Ball Slam-to-Sprint | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 300 | Zercher Carry | | Biceps contrib. iso elbow flexion; Brachialis contrib. iso elbow flexion (both deliberate hold) |
| 343 | Cable Triceps Pressdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 344 | Rope Cable Pressdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 345 | Reverse-Grip Cable Pressdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 346 | Single-Arm Cable Pressdown | at the side | LH direct dyn; Lat, Med direct dyn (shared) |
| 347 | Cross-Body Cable Triceps Extension | not defined | LH direct dyn; Lat, Med direct dyn (shared) |
| 348 | Cable Triceps Kickback | behind the body | LH direct dyn; Lat, Med direct dyn (shared) |
| 349 | Cable Overhead Triceps Extension | overhead | LH direct dyn; Lat, Med direct dyn (shared) |
| 390 | Turkish Get-Up | moves | LH stab. iso; Lat, Med stab. iso (shared) |
| 399 | Battle Rope Slams | | LH contrib. dyn shoulder extension; Lat, Med contrib. dyn (shared) **draft** |
| 406 | Lever Supination | | Biceps contrib. dyn supination |

Every triceps row above is elbow extension unless it names shoulder extension.

**Left unmapped on purpose** (`extensionsOtherUnmapped`; each reason is shown on the page with the sets it covers):

| Id | Exercise | Tag | Reason, in short |
|---|---|---|---|
| 279 | Medicine-Ball Overhead Backward Throw | biceps (secondary) | the legs and hips drive it; the arms are straight levers; no defined upper-arm load |
| 350 | Cable Wrist Extension | biceps (secondary) | whether the elbow flexors hold the bent elbow or the forearm rests on a support is not defined; the forearm counts the wrist |
| 380 | Cable Anti-Rotation Walkout | triceps (secondary) | the elbows hold still; whether the cable loads the triceps or only the shoulder and trunk depends on an undefined set-up |
| 400 | Battle Rope Alternating Waves | triceps (secondary) | quick small waves for time; no defined load on one upper-arm action |
| 283 | Medicine-Ball Sit-Up Throw | none (has a variant) | sitting up drives it; the long head's help is not a defined load |
| 388 | Kettlebell Snatch | none (has a variant) | ballistic; the elbow guides and briefly locks out with the load stacked over it |
| 387 | Kettlebell Clean | none | the arm guides the bell to the rack; the elbow flexors do not lift it |
| 235, 246, 247, 248, 217 | L-Sit, RKC Plank, Side Plank, Weighted Plank, Copenhagen Plank | none | the arms prop or hold the body without the elbow moving; the measure (seconds or reps) waits on the owner, so they have no variant |
| 165, 352, 391 | Goblet Squat, Cable Goblet Squat, Lateral Goblet Squat | none | the load is held at the chest with the forearms nearly upright and steadied, not held out; 391's legs are the leg waves' to decide |
| 250, 377, 378 | the cable chops | none | straight arms pass the trunk's turn; the elbows hold still |
| 296, 297, 298 | the sleds | none | the arms brace (or hold straps) while the legs drive; set-up dependent |
| 89–100, 111–116, 314–316, 319–321, 334 | shoulder isolation (rear-delt flys, Y, T and W raises, wall slide, band pull-apart, lateral raises, scaption, rotations, trap raise) | none | abduction, horizontal abduction, rotation and shoulder-blade work are not the upper arm's actions, and the elbow does not move |

245 Hollow-Body Hold is not listed: the arms hold nothing and no upper-arm action is loaded, so a listing would only add a line to the page.

No row this family lists tags an upper-arm muscle as a primary muscle, so the listings move nothing out of the region's totals; they only say why a set is not counted.

## 4. Judgment calls

**The long head in overhead and arm-at-side extensions.** The long head is the one triceps head that crosses the shoulder, so where the upper arm is held sets its length: longest overhead (154–156, 349), shorter with the arm raised in front (skull crushers, 157, 160), shorter again at the side (pushdowns and pressdowns), shortest behind the body (the kickback). In one small study a model driven by surface EMG estimated that the long head made the most force of the three heads with the arm by the side, and the medial head the most at shoulder height or above (`aott.triceps_heads`); two small training studies compared overhead and arm-at-side extensions and found larger long-head volume gains overhead in one, similar thickness gains in the other (`pmid.35819335`, `mdpi.triceps_fascicle_length`). None of this is credit. The long head is `direct dynamic` in every elbow extension, overhead or not, and its rationale says where the arm is; no growth or training study is cited by a mapping (tested). The training finding stays where the anatomy lane put it, a draft selectivity claim the owner decides on (`upper_arm.triceps_long.selectivity.2`).

**Kickbacks and the shoulder position.** In 348 the upper arm is held back beside the trunk (`shoulder: extended`). The long head is at its shortest across the shoulder, and it also helps hold the arm back there, its small second action. That holding is said in the rationale and not credited as a second row: one row per muscle and exercise, and the exercise is defined by the elbow straightening. The rear of the shoulder holds the arm back. The long head stays `direct`, as in every extension.

**Front raises: shoulder flexion, the biceps and the coracobrachialis.** A front raise is shoulder flexion with the elbow nearly straight. The anatomy lane listed the biceps' `shoulder.flexion` as `assist` so that the region's own action could be counted at all; four anatomy references call the biceps a weak helper there. But the evidence on whether it helps at all disagrees: with the elbow braced straight, a wire-electrode study of ten shoulders recorded no activity in the biceps' long head during shoulder movement (Levy 2001, `pmid.11408907`); a scoping review calls its part in raising the arm minimal in healthy shoulders (`bmc.long_head_biceps_scoping_review`); a surface-EMG study found low activity rising with elevation (`pmid.26535304`). A front raise is exactly a straight-arm shoulder flexion, so the biceps' row on 117–119 is a **draft**, citing Levy 2001 as the contrary evidence: pending review, never counted. The elbow flexors also hold the nearly straight elbow against the weight at the hand, but how much depends on how straight the elbow is kept (a locked elbow rests on the joint), which is not defined, so that is not credited either.

The coracobrachialis also raises the arm forward, and is likely the upper arm's main shoulder flexor in a front raise. It is an adjacent member: explained on the page, never mapped (the platform refuses a mapping on an adjacent node), and its work is not moved onto the biceps.

**What this means: in v1 no reviewed upper-arm exercise counts toward a `shoulder.flexion` target.** The biceps is the only upper-arm muscle that can be mapped for that action, and no reviewed row credits it (a version-wide test holds this across all three families). A movement target on shoulder flexion can be set on the upper-arm page, but nothing will count toward it until a later version has evidence for a reviewed row, or the owner decides otherwise (owner question 2).

**The Zercher lifts: elbow flexion held isometrically.** The bar sits in the crook of both elbows and the hands do not hold it, so the biceps and brachialis hold the elbows bent against it without moving: `isometric`. The relationship follows the forearm's definitions. In the squat (164) the elbow flexors hold the implement while the legs and hips are trained: `incidental`, counted as incidental steadying. In the carry (300) holding the bar is part of what the carry trains: `contributing`, which a deliberate hold counts as deliberate isometric work, as the forearm's version read them. The forearm's brachioradialis does the same and is credited by the forearm.

**Rollouts: elbow extension held, shoulder extension moved.** Rolling out lets the arms reach overhead; drawing them back is shoulder extension against the body's weight, which the back muscles lead and the long head helps: long head `contributing dynamic` shoulder extension. The floor's push on the hands out in front tends to bend the elbows, so the lateral and medial heads hold them straight: `stabilizer isometric`, shared. The long head also holds the elbow; its row names the shoulder, which is the one thing only it does.

**The snatch, the get-up and medicine-ball work: real elbow work, or steadying?**
- *Turkish get-up (390): steadying.* The bell is held overhead on a straight arm for the whole get-up while the legs and trunk move the body under it. The triceps keep the elbow locked without moving it: `stabilizer isometric`, counted apart as steadying. The load runs mostly along the straight arm, so how hard they hold depends on how upright the arm stays; pressing the bell up before the get-up is set-up, not the defined movement.
- *Kettlebell snatch (388): neither, so unmapped.* The hips drive the bell; the arm guides it and the elbow punches through to a brief lockout with the load stacked over the joint. The elbow work is guiding and timing, not a defined load.
- *Chest passes (271, 281), overhead slams (273, 284, 285) and the forward overhead throw (280): real.* Each straightens both elbows to drive the ball: the chest pass from the chest; the slam from overhead with the elbows bent, as the catalog's photograph of the slam shows (284 and 285 are that slam followed by a sprawl or a sprint); the throw from behind the head. The three heads are `contributing dynamic` elbow extension (the chest, shoulders, back and trunk lead), with no lowering phase, since the ball leaves the hands.
- *Backward throw (279) and sit-up throw (283): unmapped.* The hips and legs, or sitting up, drive the ball; the arms are nearly straight levers and the load on an upper-arm action is not defined.
- *Battle ropes.* In the rope slam (399, tagged triceps as a primary muscle) the arms are driven down from overhead, shoulder extension the long head helps: `contributing dynamic`, reviewed. Whether the elbows bend and straighten as well is not defined (no photograph, no set-up), so the lateral and medial heads are `contributing dynamic` **drafts**. The alternating waves (400) are listed: quick small waves for time, with no defined load on one action.

**Lever supination (406).** The forearm's exercise; the upper arm now speaks for the biceps in it. With the elbow bent at 90 degrees, as the exercise defines it, the biceps is a strong supinator and joins the supinator more as the load grows (M5, M6): `contributing dynamic`, basis `emg`, as the forearm's version had it. The forearm marked the pair `shared`; this version holds no forearm muscle, so its biceps row is `individual`, and the page never says work is split between muscles of two versions (§4.2).

**Wrist extension (350) and the walkout (380).** Both hold the elbow still under a load whose effect on the elbow depends on a set-up the catalog does not define (the forearm supported or not; how the arms are set against a sideways pull). Listed rather than guessed.

350's `biceps` tag is weak. The variants lane kept it on purpose (if the forearm is not supported, the elbow flexors hold it bent against the cable). This lane proposes dropping it, for the variants lane to decide:
- the exercise is wrist extension, and whether the elbow is held at all depends on a support the catalog does not define;
- with the palm down, the biceps is the elbow flexor at the greatest mechanical disadvantage (M1), so of the three it is the least apt tag.

Either way 350 stays listed, so coverage does not depend on the tag. Dropping it touches no `forearms` tag.

**Untagged rows listed on the page.** The planks, holds, goblet holds, chops, sleds and shoulder-isolation rows tag no upper-arm muscle and have no variant. Listing them means a set of one shows under "How this is counted" as not counted here, with its reason, as the forearm shows the sleds. That says plainly that a plank or a lateral raise is not upper-arm work here. The shoulder-isolation rows are 25 of the 46; if the page should not mention them, deleting that group from `extensionsOtherUnmapped` changes nothing else.

## 5. Counts (this family)

| | Reviewed | Draft |
|---|---|---|
| Triceps, long head | 28 | 0 |
| Triceps, lateral head | 27 | 1 |
| Triceps, medial head | 27 | 1 |
| Biceps | 3 | 3 |
| Brachialis | 2 | 0 |
| **All** | **87** | **5** |

- By relationship and mode (all 92): direct dynamic 54; contributing dynamic 27 (5 of them drafts); stabilizer isometric 7; incidental isometric 2; contributing isometric 2.
- Categories the 87 reviewed rows give a bout (`categoryFor`): direct dynamic 54, contributing dynamic 22, deliberate isometric 2 (300), incidental isometric 9.
- Evidence basis: anatomy 73, inference 18, EMG 1.
- Drafts, by mapping id:

| Mapping id | Why it is draft |
|---|---|
| `cat-117:upper_arm.biceps`, `cat-118:upper_arm.biceps`, `cat-119:upper_arm.biceps` | Front raises: whether the biceps helps a straight-arm shoulder flexion at all is disputed (Levy 2001 found no long-head activity with the elbow braced straight). |
| `cat-399:upper_arm.triceps_lateral`, `cat-399:upper_arm.triceps_medial` | Battle rope slams: whether the elbows bend and straighten, or stay nearly straight while the shoulders work, is not defined. |

Integration adds the version's totals here once the three families are joined.

## 6. Sources

This family adds no source. Every row cites the shared library: the anatomy lane's upper-arm sources (`statpearls.triceps`, `kenhub.triceps_brachii`, `imaios.triceps_long_head`, `radiopaedia.triceps_brachii`, `elsevier.triceps_lateral_head`, `elsevier.triceps_medial_head`, `kenhub.biceps_brachii`, `loyola.biceps_brachii`, `teachmeanatomy.brachialis`, `aott.triceps_heads`, `pmid.11408907`, `pmid.26535304`, `bmc.long_head_biceps_scoping_review`) and the forearm's (A50 and A51, StatPearls on the biceps and brachialis; M5 and M6 on supination). Each citation has a locator and a limitation: an anatomy reference gives the muscle's action, not how much this exercise loads it; a muscle-activity study is short-term activity, never growth or a credit weight; every source was seen through web-search excerpts or abstracts, as its note says.

No row rests on a study of the exercise itself: none was found in the library for kickbacks, rollouts, the get-up or medicine-ball work, and none was searched for in this lane. Where a row's relationship rests on the set-up (the steadying rows, the throws read from the catalog's definitions), its basis is `inference` and its rationale says what the reading is.

## 7. Limits and open questions

1. **Shoulder flexion counts nothing in v1** (§4, owner question 2). The choice is between keeping the biceps' `assist` row with no reviewed mapping, finding evidence for one, or taking the action off the region.
2. **Steadying is credited from mechanics, not measurement.** The rollouts' and the get-up's steadying rows rest on what the set-up does to the elbow, not on an EMG study of those exercises. They are counted apart and never as dynamic work, and a study could move them.
3. **The rope slams' elbow heads** stay draft until the set-up is defined (a photograph or a definition of the elbows' path).
4. **The elbow flexors in front raises, goblet holds and the walkout** do some holding that this version does not credit, because how much depends on a set-up the catalog leaves open. A later version could credit them as steadying once the set-up is defined; the goblet squats would then need variants.
5. **The kettlebell lifts** (387, 388) and the holds whose measure waits on the owner (235, 246–248, 217) are listed, not mapped. If the core's wave writes the holds' variants, the triceps' steadying in the L-sit is a candidate for a later upper-arm version.
6. **Single-source rows.** The long head's credit at each arm position cites one modelled-EMG study (`aott.triceps_heads`) for context only; its credit does not depend on it.
7. **A human or full-text review** before `upper_arm_mappings_v1` is published, since publishing freezes the mappings and the attributes of the variants they name (§8, §11 decision 4).

## 8. For integration

- Wire `pressesPushes.ts` and `pullsCurls.ts` into `mappings/index.ts` at the marked places; the coverage test in `upper_armMappings.test.ts` then passes (in this branch it fails for exactly the 155 rows those two families own: 77 presses and pushes, 78 pulls, rows and curls).
- Set the version record's `state` and `publishedAt` when the region's content takes it (`content.ts`: `mappings`, `variants: variantsMappedBy(upperArmMappings)`, `mappingVersion`, `unmappedTagged: upperArmUnmapped`).
- On the forearm page, from wave A, the biceps and brachialis are credited through this version (§4.2). For the exercises this family maps that the forearm's version also credited: 300's two rows keep the forearm's reading; on 406 the biceps row is now `individual` in this version, so the forearm's supinator row, still `shared`, no longer names the biceps as its partner. That belongs in the golden test's allowed differences.
- The front raises' draft biceps rows name `shoulder.flexion`, which is no forearm action: the forearm page lists it among the home's actions it names (`ExternalMappingVersion.actions`).
- Fill §3.1 and §3.2, and the version's counts in §5, from the other two lanes' reports.
