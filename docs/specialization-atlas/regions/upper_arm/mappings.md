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

**Variants.** Every mapping names a variant from the shared library, `cat-<id>`: the forearm's 119, frozen, and wave A's 125 (the variants lane's note, `../variants.md`). `variantFor(catalogId)` returns the one current variant of each exercise, so the page, the logger and the calculator read an exercise one way. A mapping lane that needs an exercise with no variant asks the variants lane for one; it never writes its own.

**Mappings.** One per variant and upper-arm muscle (the database's unique key), each naming:
- one joint action, which must be one of the muscle's node actions (no fan-out);
- a relationship: `direct` (the exercise is built on this muscle's action), `contributing` (it helps move the load), `stabilizer` (it steadies a joint that does not move: "steadying"), `incidental` (it holds the implement while something else is trained: "holding");
- a mode: `dynamic` (its joint moves through range) or `isometric` (it holds).

A stabilizer or incidental mapping is always isometric, so steadying or holding can never earn dynamic credit; both count in the category the page calls "Incidental steadying" (the method notes' words). The accounting category follows from `categoryFor` (`rules.ts`), as for the forearm.

**One row per muscle and exercise.** A two-joint muscle (the biceps, the triceps' long head) can do two things in one exercise. It is credited for the action the exercise is defined by, and its rationale says what else it does. Nothing is credited twice.

**Evidence and review** (§8). `evidenceBasis` is:
- `anatomy` where the mapping rests on what the muscle does (an elbow extensor in an elbow extension);
- `inference` where it rests on a reading of the set-up (the floor's push bending the elbows in a rollout);
- `emg` only with a muscle-activity source in hand.

A mapping is `reviewed` only with a rationale, a source with a locator and a limitation, and one of those bases; otherwise it is a `draft`, shown as pending review and never counted, and its rationale says why. Every citation of every mapping, draft or not, has a locator and a limitation, from the shared library. No growth or training study is cited as a mapping source. The version test holds all of this across the three families.

A draft is kept only where the evidence may yet support the credit (the elbow heads in slams with no photo). Where the evidence points the other way, the exercise is listed instead, so the page never shows "pending review" for credit that is not expected to come (the front raises, §4).

**Copy.** Rationales and listed reasons are shown to the athlete and freeze at publish. They are plain words of 450 characters at most (the version's rationales: median 313, longest 442), with no growth wording, percentages, screen or body sides, side or count words, "table" or internal words; the version test holds every family to it.

**Shared allocation.** The lateral and medial heads start on the back of the upper-arm bone, end on the point of the elbow and cross only the elbow: they share every action (§1.2; `upper_arm.triceps_lateral.selectivity.1`). Wherever one is mapped the other is too, with the same action, relationship, mode and status, `allocation: "shared"`, so the page says the work cannot be split between them rather than inventing a difference. The long head crosses the shoulder too and has its own row, `individual`. The biceps and brachialis are `individual`.

**Sides.** Both sides count as one on every page (the owner, 20 Oct 2026). Each row still writes its side relation, `same`: every upper-arm muscle here is loaded on the side of the arm that holds or moves the load. No variant this version maps is `not_applicable` for the arms.

**Straps.** `requiresNoStraps` is false on every row: straps decide only grip mappings, which are the forearm's.

**Coverage** (§3, the forearm's rule). The upper arm's catalog keys are `biceps`, `brachialis` and `triceps`, and its page reads primary tags only (§1.1). Every catalog row tagging one of them, as a primary or a secondary muscle, gets a mapping (reviewed or draft) or a listed reason. A secondary-tagged row is mapped where the upper arm is really loaded, or listed. Untagged rows that load the upper arm may be mapped too (the variants lane wrote 11 such variants), and a few untagged rows a reader might expect to count are listed with their reason, as the forearm lists the sleds. A listed row's sets are shown under "How this is counted" as not counted here, each with its reason.

## 3. Families

187 catalog rows tag an upper-arm key (50 as a primary muscle; 74 L-Sit Pull-Up joined them with the variants lane's catalog fix, which tags it biceps). They split into three families by the catalog's movement, each row in exactly one (tested):

| Family | File | Movements | Tagged rows |
|---|---|---|---|
| Presses and pushes | `pressesPushes.ts` | horizontal, vertical and diagonal push; anti-rotation press; diagonal press, pull, squat or rotation; scapular protraction; explosive push | 77 |
| Pulls, rows and curls | `pullsCurls.ts` | horizontal and vertical pull; elbow flexion; and 379 Cable Rotational Row by id (its movement reads "Rotation"; routing it by id keeps a future tag on a chop from going to the pulls unseen) | 79 |
| Extensions and everything else | `extensionsOther.ts` | elbow extension; throws and slams; wrist extension; forearm supination; anti-rotation; loaded transition; overhead slam; alternating arm drive | 31 |

### 3.1 Presses and pushes

Its rows: 1–17, 25–40, 101–110, 120, 146, 147, 158, 159, 249, 251–255, 267–270, 272, 301–310, 322–325, 381, 382, 386, 389 (77, all tagged).

**216 mappings on 72 exercises, all reviewed. 5 exercises listed unmapped.** Counted from `pressesPushes.ts` at integration.

- Every mapped press and push credits all three triceps heads (72 rows each): elbow extension, the long head `individual`, the lateral and medial heads `shared`. In a press the chest and shoulders lead, so the rows are `contributing dynamic` (204), and `direct dynamic` only where the exercise is built on the elbow straightening (12 rows on 28 Diamond Push-Up, 146 Close-Grip Bench Press, 147 JM Press and 158 Bench Dip).
- No biceps or brachialis row: no press or push maps an elbow flexor.
- Categories the 216 rows give a bout (`categoryFor`): contributing dynamic 204, direct dynamic 12.
- Evidence basis: anatomy 183, inference 31 (rows resting on a reading of the set-up: 28, 110, 146, 147, 158, 254, 255, 268–270, 389), EMG 2 (146's long and lateral heads).
- Rationales: 211 to 442 characters, median 319. Listed reasons: median 273, longest 298.
- Sources this family adds (`sources/upper_arm-pressesPushes.ts`): `jscr.bench_press_variations_emg`, `pmid.16095407` (Lehman), `jscr.pushup_hand_position`, `pmid.36293792` (McKenzie) and `jscr.pushup_kinetics` (Ebben 2011).

**Left unmapped on purpose** (`pressesPushesUnmapped`): each tags the triceps as a secondary muscle, and in each the elbows straighten against little load along the press.

| Id | Exercise | Reason, in short |
|---|---|---|
| 25 | Plate Squeeze Press | the plates' weight pulls across the line of the press; what the elbows do depends on an undefined hold; the squeeze is the chest's work |
| 249 | Pallof Press | the cable pulls sideways and the trunk resists turning; the work is the trunk's |
| 267 | Landmine Anti-Rotation Press | no set-up beyond the name; pressed out and held against a turn, as the Pallof press is |
| 310 | Cable Press-Out | the Pallof press by another name |
| 322 | Cable Serratus Punch | the elbow stays straight while the shoulder blade carries the arm forward; the work is the serratus anterior's |

The press family's medicine-ball rows were written twice, by this lane and the extensions lane; integration dropped this lane's unwired copy, and the extensions family maps them (§3.3).

### 3.2 Pulls, rows and curls

Its rows: 24, 43–78, 80, 121–138, 256–258, 317, 318, 326–333, 336–342, 379, 383 and 384 (79 tagged, 74 L-Sit Pull-Up among them), and the untagged 87 Face Pull, 88 Rope Face Pull with External Rotation and 335 Cable High Pull.

**177 mappings on 82 exercises: 163 reviewed, 14 draft. No exercise listed unmapped.** Counted from `pullsCurls.ts` at integration.

| | Reviewed | Draft |
|---|---|---|
| Biceps | 74 | 2 |
| Brachialis | 74 | 2 |
| Triceps, long head | 5 | 10 |
| Triceps, lateral head | 5 | 0 |
| Triceps, medial head | 5 | 0 |
| **All** | **163** | **14** |

- The rows, pulldowns and pull-ups credit the biceps and brachialis for elbow flexion, `contributing dynamic`: the back muscles lead. The curls (121–138, 336–342) are built on it: `direct dynamic`, 44 rows.
- The straight-arm pulls and pullovers (24, 62, 63, 65, 328) credit the long head `contributing dynamic` shoulder extension, and the lateral and medial heads steadying the straight elbow (`stabilizer isometric`, shared): 10 rows, counted as incidental steadying.
- By relationship and mode (all 177): contributing dynamic 123 (14 of them drafts), direct dynamic 44, stabilizer isometric 10.
- Categories the 163 reviewed rows give a bout: contributing dynamic 109, direct dynamic 44, incidental isometric 10.
- Evidence basis: anatomy 146, inference 30, EMG 1 (135's biceps).
- Rationales: 135 to 434 characters, median 332.
- Sources this family adds (`sources/upper_arm-pullsCurls.ts`): `bmc.pulldown_row_grips`, `jelekin.pull_up_grips`, `mdpi.pullover_straight_arm_pulldown`, `scielo.pullover_bar_dumbbell`, `pmid.12423182` and `jscr.pull_up_chin_up`. Integration moved `bmc.pulldown_row_grips`, `jelekin.pull_up_grips` and `jscr.pull_up_chin_up`, with the anatomy lane's three elbow-flexor sources, into `sources/upper_arm-elbowFlexors.ts`, so the forearm's page carries only the sources its two upper-arm members cite; each record keeps its place in its list. Eleven curl rows cited `kenhub.biceps_brachii` twice; integration merged each pair into one citation (one per source per row, which the seed requires).
- Drafts, by mapping id:

| Mapping id | Why it is draft |
|---|---|
| `cat-59`, `cat-60`, `cat-67`, `cat-68`, `cat-71`, `cat-72`, `cat-78`, `cat-80`, `cat-326`: `upper_arm.triceps_long` | Pulldowns, chin-ups, pull-ups and the rope climb in front of the body: the long head helps draw the arm down and back, but the elbow bends under load at the same time and the long head also straightens it, so whether it does net work is not established. |
| `cat-64:upper_arm.triceps_long` | Machine pullover: where the lever meets the arms is not described, so whether the long head shares the shoulder extension as in a free-weight pullover is not established. |
| `cat-317` and `cat-335`: `upper_arm.biceps`, `upper_arm.brachialis` | Cable upright row and high pull: the forearms hang close to the cable's line, so the load has little leverage at the elbow; as the forearm's brachioradialis is here. |

### 3.3 Extensions and everything else

Its rows:
- the 31 tagged rows above: 148–157, 160 and 343–349 (the extensions); 271, 273, 279–281, 284 and 285 (medicine-ball work); 350 (cable wrist extension); 380 (anti-rotation walkout); 390 (Turkish get-up); 399 and 400 (battle ropes); 406 (lever supination);
- the untagged rows with a variant that are not pulls: 117–119 (front raises), 164 (Zercher squat), 237 and 238 (rollouts), 283 (sit-up throw), 388 (kettlebell snatch);
- 300 Zercher Carry, untagged, whose biceps and brachialis the forearm's version credited (below);
- eight untagged rows with no variant that a reader might expect to count here, listed with their reason.

**Boundary with the other two families.** 350 Cable Wrist Extension and 406 Lever Supination are forearm exercises tagged biceps as a secondary muscle; neither is a curl, so they are this family's. 300 and 406 are the only exercises besides curls on which the forearm's version credited the biceps or brachialis (05-mappings.md): from wave A the forearm page reads those two muscles through this version (§4.2), so both are mapped here and the forearm page keeps its credit. The curls, 74, 87, 88, 317, 318 and 335 are the pulls-rows-and-curls family's.

**89 mappings on 31 exercises: 83 reviewed, 6 draft. 17 exercises listed unmapped.** (The lane's 86 on 30, with 18 listed; integration mapped 238 as 237, §4.)

| Group | Catalog ids | Mappings |
|---|---|---|
| Skull crushers | 148, 149 | long head, lateral, medial: direct dynamic elbow extension; lateral and medial shared |
| Pushdowns, pressdowns | 150–153, 343–346 | as skull crushers |
| Overhead extensions | 154–156, 349 | as skull crushers |
| Machine, bodyweight, cross-body, kickback | 157, 160, 347, 348 | as skull crushers |
| Zercher squat | 164 | biceps, brachialis: holding, incidental isometric elbow flexion |
| Zercher carry | 300 | biceps, brachialis: contributing isometric elbow flexion (a deliberate hold, as the forearm read it) |
| Ab-wheel rollout, barbell rollout | 237, 238 | long head contributing dynamic shoulder extension; lateral and medial steadying (stabilizer isometric elbow extension), shared |
| Chest passes | 271, 281 | three heads contributing dynamic elbow extension; lateral and medial shared |
| Overhead slam (photographed), forward throw | 273, 280 | as chest passes |
| Overhead slams with no photo, battle rope slams | 284, 285, 399 | long head contributing dynamic shoulder extension; lateral and medial contributing dynamic elbow extension, shared, **draft** |
| Turkish get-up | 390 | three heads steadying (stabilizer isometric elbow extension); lateral and medial shared |
| Lever supination | 406 | biceps contributing dynamic supination (EMG) |

**Per exercise.** Abbreviations: dyn dynamic, iso isometric, contrib. contributing, stab. stabilizer (steadying), incid. incidental (holding); "(shared)" allocation shared; **draft** pending review and not counted. LH, Lat, Med: the long, lateral and medial heads of the triceps. Every triceps row is elbow extension unless it names shoulder extension. The second column is the arm's position at the shoulder (the variant's `shoulder` dimension) where the rationale turns on it.

| Id | Exercise | Arm at the shoulder | Mapped muscles |
|---|---|---|---|
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
| 164 | Zercher Squat | | Biceps incid. iso elbow flexion; Brachialis incid. iso elbow flexion |
| 237 | Ab-Wheel Rollout | moves | LH contrib. dyn shoulder extension; Lat, Med stab. iso (shared) |
| 238 | Barbell Rollout | moves | as 237 |
| 271 | Medicine-Ball Chest Pass | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 273 | Medicine-Ball Overhead Slam | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 280 | Medicine-Ball Forward Overhead Throw | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 281 | Kneeling Medicine-Ball Chest Pass | moves | LH contrib. dyn; Lat, Med contrib. dyn (shared) |
| 284 | Medicine-Ball Sprawl-to-Slam | moves | LH contrib. dyn shoulder extension; Lat, Med contrib. dyn (shared) **draft** |
| 285 | Medicine-Ball Slam-to-Sprint | moves | LH contrib. dyn shoulder extension; Lat, Med contrib. dyn (shared) **draft** |
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

**Left unmapped on purpose** (`extensionsOtherUnmapped`; each reason is shown on the page with the sets it covers, as "not counted here"):

| Id | Exercise | Tag | Reason, in short |
|---|---|---|---|
| 279 | Medicine-Ball Overhead Backward Throw | biceps (secondary) | the legs and hips drive it; the arms are straight levers; no named upper-arm load |
| 350 | Cable Wrist Extension | biceps (secondary) | whether the elbow flexors hold the bent elbow or the forearm rests on a support is not defined; the forearm counts the wrist |
| 380 | Cable Anti-Rotation Walkout | triceps (secondary) | the elbows hold still; whether the cable loads the triceps or only the shoulder and trunk depends on an undefined set-up |
| 400 | Battle Rope Alternating Waves | triceps (secondary) | quick small waves for time; no defined load on one upper-arm action |
| 117, 118, 119 | the front raises | none (have a variant) | the biceps' help in raising the arm forward is weak and disputed; one study found none with the elbow kept straight (§4) |
| 283 | Medicine-Ball Sit-Up Throw | none (has a variant) | sitting up drives it; the long head helps draw the arms down, but the load on it is not defined |
| 388 | Kettlebell Snatch | none (has a variant) | ballistic; the elbow guides and briefly locks out with the load stacked over it |
| 387 | Kettlebell Clean | none | the arm guides the bell to the rack; the elbow flexors do not lift it |
| 235 | L-Sit | none | straight arms hold the body, the load along the arms; its measure (seconds or reps) is still to be decided |
| 165, 352, 391 | Goblet Squat, Cable Goblet Squat, Lateral Goblet Squat | none | the load is held at the chest with the forearms nearly upright and steadied, not held out; 391's legs are the leg pages' to decide |
| 250 | Cable Wood Chop | none | a high-to-low chop as photographed: the long head helps draw the arms down, but the trunk's turn moves the load |
| 296, 298 | Heavy Sled Push, Sled Sprint | none | the hands push on the sled's posts while the legs drive; set-up dependent |

The reasons for rows with no variant end "The app does not count this exercise for the upper arm yet."

**Not listed, by the coordinator's ruling of 22 Oct:** the 25 shoulder-isolation rows (89–100, 111–116, 314–316, 319–321, 334), the planks 217, 246, 247 and 248, 377 Cable Reverse Chop, 378 Cable Horizontal Chop, 297 Backward Sled Drag and 245 Hollow-Body Hold. None tags an upper-arm muscle and none loads an upper-arm action an athlete would expect to see counted here, so a listing would only add a line to the page.

No row this family lists tags an upper-arm muscle as a primary muscle, so the listings move nothing out of the region's totals; they only say why a set is not counted.

## 4. Judgment calls

**The long head in overhead and arm-at-side extensions.** The long head is the one triceps head that crosses the shoulder, so where the upper arm is held sets its length: longest overhead (154–156, 349), shorter with the arm raised in front (skull crushers, 157, 160), shorter again at the side (pushdowns and pressdowns), shortest behind the body (the kickback). Two small training studies compared overhead and arm-at-side extensions and found larger long-head volume gains overhead in one, similar thickness gains in the other (`pmid.35819335`, `mdpi.triceps_fascicle_length`). None of this is credit. The long head is `direct dynamic` in every elbow extension, overhead or not, and its rationale says where the arm is; no growth or training study is cited by a mapping (tested version-wide). The training finding stays where the anatomy lane put it, a draft selectivity claim the owner decides on (`upper_arm.triceps_long.selectivity.2`).

**What the triceps-heads study says, and where it is cited.** In ten adults straightening the elbow at five shoulder angles, a model driven by surface EMG estimated the most force from the long head with the arm by the side (0 degrees), and from the medial head at 90 degrees and above (`aott.triceps_heads`). It is cited on the long head's row in the pushdowns and pressdowns, and on the lateral and medial rows wherever the arm is at shoulder height or higher: the skull crushers, 157 and 160 (raised in front, about 90 degrees) and the overhead extensions (the study's 135 and 180 degrees). The credit stays the same: the medial head shares its row with the lateral head, and nothing is weighted. It is not cited on the long head's overhead rows, where it says nothing about that head, nor on 347 and 348, whose arm positions it did not test.

**A palm-up handle (152, 153, 345, 346).** Turning the palm up changes the hold; the triceps straighten the elbow either way, and the credit is the same. One study (Villalba 2024, seen as an abstract by the anatomy review and not in the source library) found the long head most active with a palm-up pushdown handle; that is short-term activity, and it would not change the credit.

**Kickbacks and the shoulder position.** In 348 the upper arm is held back beside the trunk (`shoulder: extended`). The long head is at its shortest across the shoulder, and it also helps hold the arm back there, its small second action. That holding is said in the rationale and not counted twice: one row per muscle and exercise, and the exercise is defined by the elbow straightening. The rear of the shoulder holds the arm back. The long head stays `direct`, as in every extension.

**Front raises: listed, and no shoulder-flexion row at all in v1.** A front raise is shoulder flexion with the elbow nearly straight. The anatomy lane listed the biceps' `shoulder.flexion` as `assist` so that the region's own action could be counted at all; three anatomy references rate the biceps a weak helper there (Kenhub, Loyola, IMAIOS), and TeachMeAnatomy lists it unrated. But the evidence on whether it helps at all disagrees: with the elbow braced straight, a wire-electrode study of ten shoulders recorded no activity in the biceps' long head during shoulder movement (Levy 2001, `pmid.11408907`); a scoping review calls its part in raising the arm minimal in healthy shoulders (`bmc.long_head_biceps_scoping_review`); a surface-EMG study found low activity rising with elevation (`pmid.26535304`). A front raise is exactly a straight-arm shoulder flexion. A draft row would show every front-raise set as "pending review", which implies credit to come though the evidence points the other way, so 117–119 are listed instead, with the reason "The biceps' help in raising the arm forward is weak and disputed; one study found none with the elbow kept straight." The elbow flexors also hold the nearly straight elbow, but how much depends on how straight it is kept, which is not defined, so that is not credited either.

The coracobrachialis also raises the arm forward, and is likely the upper arm's main shoulder flexor in a front raise. It is an adjacent member: explained on the page, never mapped (the platform refuses a mapping on an adjacent node), and its work is not moved onto the biceps.

**What this means: in v1 no upper-arm row at all names `shoulder.flexion`, reviewed or draft,** so no exercise counts toward a shoulder-flexion target. The biceps is the only upper-arm muscle that can be mapped for that action, and the version test refuses any row for it in v1, across all three families. A movement target on shoulder flexion can be set on the upper-arm page, but nothing will count toward it until a later version has evidence for a reviewed row, or the owner decides otherwise (§7, owner question 2).

**The Zercher lifts: elbow flexion held isometrically.** The bar sits in the crook of both elbows and the hands do not hold it, so the biceps and brachialis hold the elbows bent against it without moving: `isometric`. The relationship follows the forearm's definitions. In the squat (164) the elbow flexors hold the implement while the legs and hips are trained: `incidental`, holding, counted as incidental steadying. In the carry (300) holding the bar is part of what the carry trains: `contributing`, which a deliberate hold counts as deliberate isometric work, as the forearm's version read them. The brachioradialis does the same work in both. The forearm's version credits it on 300; it does not map 164, and its version is frozen, so the brachioradialis's work in the Zercher squat is credited nowhere until a later forearm version maps it.

**Rollouts.**
- *Ab-wheel rollout (237), kneeling, as photographed: elbow extension held, shoulder extension moved.* Rolling out takes the arms overhead; drawing them back down works against the body's weight, which the back muscles lead and the long head helps: long head `contributing dynamic` shoulder extension. The floor's push on the hands out in front tends to bend the elbows, so the lateral and medial heads hold them straight: steadying (`stabilizer isometric`), shared.
- *Barbell rollout (238): mapped as 237, word for word.* The lane listed 238 on its photograph and its source's instructions, which show a different exercise: from a push-up position the bar is rolled toward the feet into a pike, arms kept upright, which is shoulder flexion with the weight running down the arms. The variants lane then defined 238 as the barbell used as an ab wheel, as in 237 ("Not the exercise its photograph shows"), and the photograph is a name match in `scripts/exercise-photos/curate.mjs` (238 to the Free Exercise DB's "Barbell Ab Rollout"). At integration 238 is mapped exactly as 237 and taken off the listed rows. The photograph is unchanged; dropping that alias, so 238 shows no photograph rather than the pike, is an owner question for the release.

**The long head drawing the arms down.** Wherever the long head is credited for shoulder extension (237, 284, 285, 399), its rationale says the same thing in the same words: the one triceps head that crosses the shoulder helps draw the arm down from overhead, so it helps move the load (`contributing`); the back muscles lead. Where it is named in a listed reason (283, 250), the same words say why it is not credited: the trunk drives the throw or the chop, so the load on it is not defined.

**The snatch, the get-up and medicine-ball work: real elbow work, or steadying?**
- *Turkish get-up (390): steadying.* The bell is held overhead on a straight arm for the whole get-up while the legs and trunk move the body under it. The triceps keep the elbow locked without moving it: `stabilizer isometric`, counted as incidental steadying. The load runs mostly along the straight arm, so how hard they hold depends on how upright the arm stays; pressing the bell up before the get-up is set-up, not the defined movement.
- *Kettlebell snatch (388): neither, so listed.* The hips drive the bell; the arm guides it and the elbow punches through to a brief lockout with the load stacked over the joint. The elbow work is guiding and timing, not a defined load.
- *Chest passes (271, 281): real.* The elbows straighten to push the ball away: the three heads are `contributing dynamic` elbow extension, basis `anatomy` (the action itself), with no lowering phase, since the ball leaves the hands.
- *The overhead slam (273) and the forward overhead throw (280): real, read from the set-up.* The slam starts overhead with the elbows bent, as its photograph shows, and straightens them as the ball is driven down; the throw takes the ball behind the head and straightens the elbows as it is thrown, by its definition. Three heads `contributing dynamic`, basis `inference`.
- *The slams with no photo (284 and 285, a slam then a sprawl or a sprint) and the rope slam (399): the shoulder's part is defined, the elbows' is not.* An overhead slam brings the arms down from overhead, so the long head is reviewed `contributing dynamic` shoulder extension. Whether the elbows bend overhead and straighten as the ball or ropes go down is not shown, so the lateral and medial heads are `contributing dynamic` **drafts**: the elbow path may well be the photographed slam's, which a photo or a set-up would settle.
- *Backward throw (279) and sit-up throw (283): listed.* The hips and legs, or sitting up, drive the ball; the arms are nearly straight levers and the load on an upper-arm action is not defined. The alternating rope waves (400) are listed too: quick small waves for time, with no defined load on one action.

**Lever supination (406).** The forearm's exercise; the upper arm now speaks for the biceps in it. With the elbow bent at 90 degrees, as the exercise defines it, the biceps is a strong supinator and joins the supinator more as the load rises (M5, M6): `contributing dynamic`, basis `emg`, as the forearm's version had it. The forearm marked the pair `shared`; this version holds no forearm muscle, so its biceps row is `individual`, and the page never says work is split between muscles of two versions (§4.2).

**Wrist extension (350) and the walkout (380).** Both hold the elbow still under a load whose effect on the elbow depends on a set-up the catalog does not define (the forearm supported or not; how the arms are set against a sideways pull). Listed rather than guessed. 350 keeps its `biceps` tag, which the variants lane kept on purpose, and stays listed. If the tag is ever changed, the brachialis is the apt muscle: it bends the elbow in every forearm position (A51), palm down included.

**Untagged rows listed on the page.** The front raises, the barbell rollout, the sit-up throw, the snatch and clean, the L-sit, the goblet holds, the wood chop and the two sled pushes tag no upper-arm muscle. Listing them means a set of one shows under "How this is counted" as not counted here, with its reason, as the forearm shows the sleds: a plain answer to an athlete who expects arm work there. Rows nobody would expect to count here (shoulder isolation, planks on the forearms, the other chops, the sled drag) are not listed, by the coordinator's ruling; adding or dropping a listing changes this family's pinned counts in its test, nothing in the calculator.

## 5. Counts (this family)

| | Reviewed | Draft |
|---|---|---|
| Triceps, long head | 28 | 0 |
| Triceps, lateral head | 25 | 3 |
| Triceps, medial head | 25 | 3 |
| Biceps | 3 | 0 |
| Brachialis | 2 | 0 |
| **All** | **83** | **6** |

With 238 mapped as 237 at integration (the lane's own counts were 80 reviewed and 6 draft):
- By relationship and mode (all 89): direct dynamic 54; contributing dynamic 24 (6 of them drafts); stabilizer isometric 7; incidental isometric 2; contributing isometric 2.
- Categories the 83 reviewed rows give a bout (`categoryFor`): direct dynamic 54, contributing dynamic 18, deliberate isometric 2 (300), incidental isometric 9.
- Evidence basis: anatomy 69, inference 19, EMG 1.
- Rationales: 160 to 394 characters, median 280. Listed reasons: median 204, longest 359.
- Drafts, by mapping id:

| Mapping id | Why it is draft |
|---|---|
| `cat-284:upper_arm.triceps_lateral`, `cat-284:upper_arm.triceps_medial`, `cat-285:upper_arm.triceps_lateral`, `cat-285:upper_arm.triceps_medial` | Overhead slams with no photo of their own: whether the elbows bend overhead and straighten as the ball goes down is not shown. |
| `cat-399:upper_arm.triceps_lateral`, `cat-399:upper_arm.triceps_medial` | Battle rope slams: whether the elbows bend and straighten, or stay nearly straight while the shoulders work, is not defined. |

### 5.1 The version: `upper_arm_mappings_v1`

Counted from `upperArmMappings` and `upperArmUnmapped` (`mappings/index.ts`) at integration; the version is published on 23 Oct 2026 (`mappings/version.ts`).

**482 mappings on 185 exercises: 462 reviewed, 20 draft. 22 exercises listed unmapped** (5 presses and pushes, 17 extensions and everything else).

| | Reviewed | Draft |
|---|---|---|
| Triceps, long head | 105 | 10 |
| Triceps, lateral head | 102 | 3 |
| Triceps, medial head | 102 | 3 |
| Biceps | 77 | 2 |
| Brachialis | 76 | 2 |
| **All** | **462** | **20** |

| Family | Mappings | Reviewed | Draft | Exercises | Listed |
|---|---|---|---|---|---|
| Presses and pushes | 216 | 216 | 0 | 72 | 5 |
| Pulls, rows and curls | 177 | 163 | 14 | 82 | 0 |
| Extensions and everything else | 89 | 83 | 6 | 31 | 17 |
| **All** | **482** | **462** | **20** | **185** | **22** |

- By relationship and mode (all 482): contributing dynamic 351 (20 of them drafts), direct dynamic 110, stabilizer isometric 17, incidental isometric 2, contributing isometric 2.
- Categories the 462 reviewed rows give a bout (`categoryFor`): contributing dynamic 331, direct dynamic 110, incidental isometric 19, deliberate isometric 2.
- Evidence basis: anatomy 398, inference 80, EMG 4.
- Rationales: 135 to 442 characters, median 313.
- No row names `shoulder.flexion` (§4).

## 6. Sources

This family adds no source. Every row cites the shared library: the anatomy lane's upper-arm sources (`statpearls.triceps`, `kenhub.triceps_brachii`, `imaios.triceps_long_head`, `radiopaedia.triceps_brachii`, `elsevier.triceps_lateral_head`, `elsevier.triceps_medial_head`, `kenhub.biceps_brachii`, `teachmeanatomy.brachialis`, `aott.triceps_heads`) and the forearm's (A50 and A51, StatPearls on the biceps and brachialis; M5 and M6 on supination). The front-raise evidence (`pmid.11408907`, `pmid.26535304`, `bmc.long_head_biceps_scoping_review`, `loyola.biceps_brachii`) is discussed in §4 and cited by no row, since the front raises are listed. Each citation has a locator and a limitation: an anatomy reference gives the muscle's action, not how much this exercise loads it; a muscle-activity study is short-term activity, never growth or a credit weight; every source was seen through web-search excerpts or abstracts, as its note says.

No row rests on a study of the exercise itself: none was found in the library for kickbacks, rollouts, the get-up or medicine-ball work, and none was searched for in this lane. Where a row's relationship rests on a reading of the set-up, its basis is `inference` and its rationale says what the reading is: the steadying rows (237, 390), the slam whose elbow path comes from its photograph (273), the throw read from its definition (280), and the draft elbow rows of the slams with no photo (284, 285, 399).

## 7. Limits and open questions

1. **No shoulder-flexion row in v1** (§4; owner question 2, "keep the biceps' assist row for shoulder flexion?"). No upper-arm row names `shoulder.flexion`, reviewed or draft, so a shoulder-flexion target on the upper-arm page counts nothing in v1. The choice is between keeping the biceps' `assist` row with no mapping, finding evidence for one in a later version, or taking the action off the region.
2. **Steadying is credited from mechanics, not measurement.** The ab-wheel rollout's and the get-up's steadying rows rest on what the set-up does to the elbow, not on an EMG study of those exercises. They are counted apart and never as direct work, and a study could move them.
3. **The slams' elbow heads** (284, 285, 399) stay draft until the set-up is defined (a photograph or a definition of the elbows' path).
4. **The barbell rollout (238)** is mapped as 237, as its variant defines it; its photograph still shows a pike from a plank (§4), until the owner decides whether to drop the photo alias.
5. **The elbow flexors in front raises, goblet holds and the walkout** do some holding that this version does not credit, because how much depends on a set-up the catalog leaves open. A later version could credit them as steadying once the set-up is defined; the goblet squats would then need variants.
6. **The kettlebell lifts** (387, 388) and the L-sit, whose measure waits on the owner (235), are listed, not mapped. If the core's wave writes the holds' variants, the triceps' steadying in the L-sit is a candidate for a later upper-arm version.
7. **The Zercher squat's brachioradialis** is credited nowhere: the forearm's frozen version does not map 164, and the upper arm maps only its own muscles.
8. **Single-source context.** The arm-position findings cite one modelled-EMG study (`aott.triceps_heads`); no credit depends on it.
9. **A human or full-text review** before `upper_arm_mappings_v1` is published, since publishing freezes the mappings and the attributes of the variants they name (§8, §11 decision 4).

## 8. Integration (done, 23 Oct 2026)

- `pressesPushes.ts`, `pullsCurls.ts` and `extensionsOther.ts` are joined in `mappings/index.ts`; the coverage test passes, and the version test's copy, source and draft rules hold over all three families.
- The version record is published (`mappings/version.ts`: `state: "published"`, `publishedAt: "2026-10-23"`), and the region's content carries it (`content.ts`).
- On the forearm page the biceps and brachialis are credited through this version (§4.2). 300's two rows keep the forearm's reading. On 406 the biceps row is now the upper arm's `individual` row. The forearm's supinator row is unchanged: the forearm's version never paired it with the biceps, since the two are in different categories, so no partner is lost. The golden tests' allowed differences say so.
- The variants lane's note is linked from §2 (`../variants.md`).
- §3.1, §3.2 and §5.1 are counted from the code.
