# Variants: wave A (the upper arm)

The variants lane's note for wave A (`../10-multi-region.md` §3, §9.2). It covers:
- the exercises wave A writes variants for, and how the list was derived;
- the counting attributes, and the both-limb decisions with their reasons;
- the descriptive dimensions, including the one this wave adds;
- the catalog fixes, with before and after;
- what was seen and left for other waves.

| | |
|---|---|
| Records | `shared/specialization/variants/upperArm.ts` (125 variants), registered in `variants/index.ts` after the forearm's 119 |
| Both-limb decisions | `shared/specialization/variants/bothLimbs.ts`, read by `regionContent.test.ts` and `variants.test.ts` |
| New dimension | `shoulder`, in `variants/dimensions.ts` |
| Tests | `client/src/lib/specialization/variants.test.ts` |
| Checkpoint 1 | `efd56cd`: the records and their counting attributes |

Bare § numbers refer to `../10-multi-region.md`; "section N" refers to this note.

The forearm's 119 records are unchanged. `variants.test.ts` compares their columns with the published `forearmRegionData.6738eeb.json` and pins their `sidedBy`. No wave A record uses a forearm catalog id.

## 1. Which exercises, and how many

**Rule.** The upper arm reads primary tags only (§1.1). The coverage test (§3) still needs a decision on every row tagging one of its catalog keys (`biceps`, `brachialis`, `triceps`):
- a primary-tagged row needs a mapping or a listed reason;
- a secondary-tagged row is mapped where the upper arm is really loaded, or listed.

The plan gives every such row a variant, whether it ends up mapped or listed (§9.1's 121 counts them all). A row listed as unmapped needs only a reason, but this way a mapping lane never waits on a record. So:

1. Rows tagging an upper-arm key, primary or secondary, after this lane's catalog fixes (section 5): **186** (50 primary, 136 secondary only). §9.1 estimated 194 before the fixes.
2. Of these, 72 already have a forearm variant. Those are frozen and are reused, not rewritten. That leaves **114 new records**.
3. Plus **11 untagged rows** that load the upper arm's actions (elbow flexion and extension, forearm supination, shoulder flexion and extension) under load. The upper arm's mapping lanes may map these, so they are written now rather than waiting for a request.
4. Total: **125 new variants.**

Before the fixes, the same rule gave 121, the figure in §9.1. The fixes:
- took out 18–23 (flys tagged triceps) and 223 (a calf raise tagged chest and triceps);
- took out 79 Scapular Pull-Up, a forearm-variant row tagged biceps;
- moved no row in.

`variants.test.ts` recomputes the list from the catalog and fails if a tag change adds or drops a row without a record to match.

**By exercise family.** The mapping lanes start from these lists.
- In the lists, a laterality other than bilateral is given in brackets; every other row is bilateral.
- `sidedBy` is `arm` for every row marked unilateral or either, and `none` for the rest.

*Presses and pushes (77):*
- **Bench presses:** 1 Barbell Bench Press, 2 Incline Barbell Bench Press, 3 Decline Barbell Bench Press, 4 Dumbbell Bench Press, 5 Incline Dumbbell Bench Press, 6 Decline Dumbbell Bench Press, 7 Dumbbell Floor Press, 8 Dumbbell Squeeze Press, 9 Alternating Dumbbell Bench Press, 10 Single-Arm Dumbbell Bench Press (unilateral), 14 Smith Machine Bench Press, 15 Smith Machine Incline Press.
- **Machine presses:** 11 Machine Chest Press (either), 12 Incline Machine Chest Press (either), 13 Plate-Loaded Chest Press (either).
- **Cable presses:**
  - 16 Cable Chest Press, 17 Single-Arm Cable Chest Press (unilateral);
  - 301 Cable Press Around (either), 302 Split-Stance Cable Chest Press, 303 Half-Kneeling Cable Chest Press (either), 304 Cable Squeeze Press, 305 Cable Incline Press, 306 Cable Decline Press, 307 Neutral-Grip Cable Chest Press, 308 Single-Arm Cable Floor Press (unilateral);
  - 310 Cable Press-Out, 322 Cable Serratus Punch (either), 323 Cable Standing Punch (unilateral), 324 Cable Incline Press-Around (either), 325 Cable Front-Foot-Elevated Press (either);
  - 249 Pallof Press.
- **Plate press:** 25 Plate Squeeze Press.
- **Overhead presses:** 101 Barbell Overhead Press, 102 Seated Barbell Overhead Press, 103 Dumbbell Shoulder Press, 104 Seated Dumbbell Shoulder Press, 105 Arnold Press, 106 Machine Shoulder Press (either), 107 Smith Machine Shoulder Press, 108 Single-Arm Dumbbell Overhead Press (unilateral), 109 Z-Press, 110 Push Press, 120 Handstand Push-Up.
- **Landmine and kettlebell presses:**
  - 251 Landmine Press (unilateral), 252 Half-Kneeling Landmine Press (either), 253 Single-Arm Standing Landmine Press (unilateral), 254 Landmine Push Press (either), 255 Landmine Squat-to-Press;
  - 267 Landmine Anti-Rotation Press (either), 268 Landmine Thruster, 269 Landmine Clean and Press (either), 270 Landmine Split Jerk (either);
  - 381 Alternating Landmine Press, 382 Tall-Kneeling Landmine Press (either), 386 Landmine Split Press (either);
  - 389 Kettlebell Clean and Press (either).
- **Close-grip presses:** 146 Close-Grip Bench Press, 147 JM Press.
- **Push-ups:** 26 Standard, 27 Wide-Grip, 28 Diamond, 29 Decline, 30 Incline, 31 Archer, 32 Plyometric, 33 Clap, 34 Explosive Depth, 35 Deficit, 36 Ring, 37 Weighted, 38 Spiderman, 39 Typewriter, 272 Explosive Medicine-Ball Push-Up, 309 Cable Resisted Push-Up.
- **Dips:** 40 Parallel-Bar Dip, 158 Bench Dip, 159 Ring Dip.

*Pulls and rows (13):*
- **Pullovers and straight-arm pulls** (the triceps' long head extends the shoulder): 24 and 65 Dumbbell Pullover (the catalog holds the exercise twice), 63 Cable Pullover, 64 Machine Pullover, 328 Cable Straight-Arm Pulldown.
- **Rows and pulls:** 318 Cable Rear-Delt Row, 326 Kneeling Cable Lat Pulldown, 329 Cable Single-Arm Bent-Over Row (unilateral), 330 Chest-Supported Cable Row, 333 Cable High Row.
- **Untagged, elbow flexion under load:** 87 Face Pull, 88 Rope Face Pull with External Rotation, 335 Cable High Pull.

*Curls (0):* all 25 curl rows (121–138, 336–342) already have forearm variants. The upper arm maps those records as they are.

*Extensions (18):*
- **Skull crushers:** 148 Skull Crusher, 149 Dumbbell Skull Crusher.
- **Pushdowns:** 150 Cable Triceps Pushdown, 151 Rope Triceps Pushdown, 152 Reverse-Grip Pushdown, 153 Single-Arm Cable Pushdown (unilateral).
- **Pressdowns:** 343 Cable Triceps Pressdown, 344 Rope Cable Pressdown, 345 Reverse-Grip Cable Pressdown, 346 Single-Arm Cable Pressdown (unilateral).
- **Overhead extensions:** 154 Overhead Cable Triceps Extension, 155 Dumbbell Overhead Triceps Extension, 156 Single-Arm Dumbbell Triceps Extension (unilateral), 349 Cable Overhead Triceps Extension.
- **Others:** 157 Machine Triceps Extension (either), 160 Bodyweight Triceps Extension, 347 Cross-Body Cable Triceps Extension (either), 348 Cable Triceps Kickback (either).

*Other (17):*
- **Front raises (untagged):** 117 Dumbbell Front Raise, 118 Cable Front Raise (unilateral, as photographed), 119 Plate Front Raise. They are shoulder flexion; the biceps assists, and the anatomy lane's node action exists for exactly this.
- **Zercher Squat (untagged):** 164. The bar sits in the elbows, as on the forearm's 300 Zercher Carry, whose biceps and brachialis rows the forearm already maps.
- **Rollouts (untagged):** 237 Ab-Wheel Rollout, 238 Barbell Rollout. The arms are drawn back down by shoulder extension.
- **Throws and slams:** 271 Medicine-Ball Chest Pass, 273 Medicine-Ball Overhead Slam, 279 Medicine-Ball Overhead Backward Throw, 280 Medicine-Ball Forward Overhead Throw, 281 Kneeling Medicine-Ball Chest Pass, 283 Medicine-Ball Sit-Up Throw (untagged), 284 Medicine-Ball Sprawl-to-Slam, 285 Medicine-Ball Slam-to-Sprint.
- **Kettlebell:** 388 Kettlebell Snatch (unilateral; untagged, an overhead lockout), 390 Turkish Get-Up (unilateral).
- **Cable:** 380 Cable Anti-Rotation Walkout.

**Seen and left out, with the reason.** A mapping lane that wants one of these sends a missing-variant request.
- **18–23, the flys.** Their triceps tag was wrong (section 5), so they are not tagged for the upper arm.
  - The elbow is held, not extended. In a dumbbell fly the load tends to straighten the elbow, so the biceps steadies it.
  - That would be a stabilizer row. The chest's wave (B) makes these variants.
- **223 Leg-Press Calf Raise.** After its fix it is a calf exercise; the lower leg's wave (D) makes its variant.
- **235 L-Sit, 245–248 (Hollow-Body Hold, the planks), 217 Copenhagen Plank.** The core's (and the hips') holds. §11 decision 2 decides their measure (seconds or reps) in the release that maps them. A wave A record would freeze `measure` first.
- **391 Lateral Goblet Squat.** The legs may be one-sided, which the leg waves decide.
  - An upper-arm mapping published in wave A would freeze `sidedBy: none` before they have looked.
  - The same holds for any leg-dominant row whose legs may work one at a time.
- **165 Goblet Squat and 352 Cable Goblet Squat.** The bell is held close in front of the chest with the forearms nearly upright, so the elbow flexors steady it.
  - The forearm's precedent maps that kind of steadying only where the load sits on the elbows (the Zercher work).
  - Written on request.
- **250, 377 and 378, the chops.** Straight arms pass the trunk's rotation to the cable. The shoulder moves, but the load is the trunk's.
- **296–298, the sled push, drag and sprint.** The arms brace the sled. The forearm lists them unmapped too.
- **387 Kettlebell Clean.** The arm guides the bell into the rack; the elbow flexors do not lift it.
- **Shoulder isolation:** 89–100, 111–116, 314–316, 319–321 and 334 (rear-delt flys, the Y, T and W raises, lateral raises, scaption, rotations, the trap raise). The elbow does not move, and the shoulder actions are not the upper arm's (abduction, horizontal abduction, rotation, scapular movement).

## 2. How the columns are read

The same way as the forearm's 119 (`../05-mappings.md` "Method"; the header of `upperArm.ts`):
- The exercise's name decides, then its photograph.
- The photographs were checked by eye from `client/public/exercise-thumbs/`, the thumbnails the app ships, named in `client/src/data/exercisePhotos.json`.
  - "(as photographed)" marks what only the photograph says.
  - `variants.test.ts` refuses a note that cites a photograph on an exercise that has none.
- The catalog's `unilateral` quality is never read.

Points particular to this wave:
- **`laterality`.**
  - `either` wherever neither the name nor the photograph settles one hand or two: generic machines with handles that may move apart, most landmine and cable presses with no photograph, 347 and 348.
  - Arms taking turns within a set are `bilateral` (9, 381, 38's legs), as the forearm reads them.
  - 31 Archer Push-Up is `bilateral`, as 73 Archer Pull-Up is.
  - 118 Cable Front Raise is `unilateral` because it is photographed one-armed.
- **No `not_applicable` laterality.** Every exercise on the list uses the hands: as supports (push-ups, dips), as holders, or as the crook of the elbow (164). The forearm columns are filled with what the hands really do:
  - `gripType`: `none` for flat supporting hands and the Zercher bar; `open_hand` for a ball, plates squeezed between the palms (25) and a dumbbell cupped by its end (24, 65, 155).
  - `wristPosition`: `extended` where flat hands bear weight; `neutral` on single-joint arm work; `unknown` on presses and pulls, which do not define it.
  - `straps`: `unknown` on pulls (straps can be used); `not_applicable` on pushes, throws, the kettlebell lifts and arm isolation.
- **`measure`** is `reps` for all 125; nothing here is a timed hold.
- **`elbowAngleDeg`** is null for all 125; none defines an angle.
- **`phase`** is `unspecified` on throws and slams (the ball leaves the hands), on the walkout and on the get-up.

## 3. Counting attributes

**Written, explicitly, on every record.**
- `sidedBy` is `arm` where `laterality` is `unilateral` or `either`, and `none` where it is `bilateral`. That is the forearm's wave-0 rule, so the upper arm reads every one-sided record by the arm.
- `variants.test.ts` holds the rule over the whole library (§3's laterality ⇄ `sided_by` test). The both-limb variants below are the listed exceptions.

**Not written.** `legLaterality`, `sideAnchor`, and the `stance` and `knee` dimensions are leg-only (§3). They are the leg waves' to write, so no wave A publish freezes them before a leg lane has looked. The tests refuse them on wave A records.

**Both-limb variants.** These are one-sided for the arms and for the legs, so this wave decides which limb's side is recorded. Each is decided **`arm`**, recorded in `bothLimbs.ts`. The reasons below apply to all six:
- Wave A maps them first, and the upper arm is an arm region.
- `leg` would make publication rule 11 require `leg_laterality` and `side_anchor` at wave A's publish, before any leg lane has reviewed the legs. That is the argument of `../11-forearm-research-and-stack.md` §10 decision 4 for 188 and 264.
- Both sides count as one (the owner, 20 Oct 2026) and no side is asked, so the choice changes no number today. It decides only what a recorded side would mean if sides came back.

| Catalog | Exercise | Arms | Legs | `sidedBy` | Reason |
|---|---|---|---|---|---|
| 252 | Half-Kneeling Landmine Press | either | one knee down, the other foot forward | arm | The pressing hand names the set. The legs brace and do not move. The catalog does not tie the down knee to a side. |
| 270 | Landmine Split Jerk | either | the feet split into a lunge to catch the bar | arm | The pressing hand names the set. Which foot goes forward is not defined. |
| 303 | Half-Kneeling Cable Chest Press | either | one knee down | arm | As 252. |
| 325 | Cable Front-Foot-Elevated Press | either | split, front foot raised | arm | The pressing hand names the set. The legs brace. The catalog does not tie the raised foot to a side. |
| 386 | Landmine Split Press | either | split stance | arm | As 325. |
| 390 | Turkish Get-Up | unilateral | the bell side's knee bends and drives | arm | The bell's hand names the side. The driving leg is that side's by definition, so a leg side would add nothing. |
| 188, 264 | the single-leg Romanian deadlifts (forearm) | either | standing leg | arm (pinned) | Kept by `../11-forearm-research-and-stack.md` §10 decision 4. |

**One premise the leg waves inherit: a static stance under arm work is two-legged.** These exercises hold a split, staggered or kneeling stance while the arms work:
- 302 Split-Stance Cable Chest Press;
- 251, 253 and 329, photographed in a staggered or split stance;
- 17 and 323, standing, with the stance not defined;
- 382 Tall-Kneeling Landmine Press.

On them both legs brace in every set and neither moves the load. So this lane reads their legs as working together, which is not one-sided. Where the arms are bilateral (302), `sidedBy: none` is decided on that premise.

A leg region that credits the legs on these exercises credits them on both sides (side relation `both`) and writes `leg_laterality: bilateral`. If a leg lane reads one of them as one-sided instead, §3's limb test will fail until it is added to `bothLimbs.ts`. That is a change to the list, not to a frozen attribute, and its frozen `sidedBy` stays.

## 4. Descriptive dimensions

Set where the name or photograph defines them, and left out where it does not. No rule reads them; the upper arm's mapping rationales cite them.

- **`shoulder`** (new; the variants lane may add a dimension through the seed, §3): where the upper arm is held at the shoulder. It sets the length of the two heads that cross the shoulder, the biceps' long head and the triceps' long head.

  | Value | Meaning | Examples |
  |---|---|---|
  | `extended` | Arm behind the body | 348 kickback |
  | `neutral` | Arm at the side | pushdowns and pressdowns |
  | `flexed` | Arm raised in front | skull crushers, 157, 160, the serratus punch, the walkout |
  | `overhead` | Arm overhead | overhead extensions |
  | `changing` | Moves through the set | presses, pulls, push-ups, dips, raises, throws |

  It is appended after `range`, so every existing dimension keeps its sort order. The seed's vocabulary gains one dimension and five values. The pinned lists in `regionContent.test.ts` and `server/specializationSeed.test.ts` gain `shoulder`.
- **`plane`**: the line of a press or pull relative to the trunk, as the catalog's movement patterns name it.
  - `horizontal`: away from or toward the chest (bench press, push-up, row).
  - `vertical`: overhead, or down from overhead (overhead press, dip, pulldown, slam).
  - `diagonal`: between them (incline and decline presses, the landmine, decline and incline push-ups).
  - It is not set on single-joint arm work.
- **`bench`, `torso`, `grip_width`.** On every bench exercise; `bench: none` on standing presses, the Z-press (seated on the floor) and floor presses.
  - Seated upright presses leave `bench` unset: the vocabulary's incline means a reclined bench.
  - `grip_width` only where the name or photograph says it: medium grip `shoulder` (1, 2, 26), `wide` (27, 31, 39), `narrow` (8, 25, 28, 146, 147, 304).
- **`range`** is not set. The floor presses' shortened bottom (7, 308) is in their notes, because "partial" depends on which muscle is read.

## 5. Catalog fixes (§11 decision 6)

Made on rows wave A decides: its new records, and 62 and 79, which keep their frozen forearm variants (only their catalog tags change).
- No fix adds or removes a `forearms` tag, so the forearm's tagged rows, its region-only reading and its 137 decisions are unchanged.
- Each fix is pinned by `variants.test.ts`.
- The fixes change what Review and the Muscles map show for these exercises. That is the effect decision 6 accepts.

Kinds of fix:
- **Duplicate tag.** `frontDelts` as both primary and secondary on the overhead presses. Review counted that as 1.5 per set; the forearm's 139–145 fix is the precedent.
- **Chest-primary template copies.** On exercises that are not chest presses, the catalog's own rows for the same lift give the right tags:
  - the landmine presses, as 381 and 382;
  - the Pallof press, as 310, the same exercise and photograph;
  - the squat-to-press, as 268, the same lift;
  - the overhead presses, as 103 and 104.
- **Upper-arm tags on the wrong muscle.**
  - Triceps on flys: the elbow is held. The catalog's own cable flys 311–313 tag no triceps.
  - Biceps on pullovers and straight-arm work: the elbows stay straight and the triceps' long head extends the shoulder, as the catalog's own 328 tags it.
  - Biceps on the scapular pull-up: only the shoulder blades move.
  - Biceps on the forward overhead throw, which extends the elbow.
  - Biceps on a reverse-grip pressdown: the biceps is the triceps' antagonist.
- **Front delts on pushdowns.** The arm hangs at the side; the catalog's own 343–346 tag none.
- **Movement.** Dips are vertical pushes. The overhead throws are throws, not horizontal pulls.
- **Equipment that contradicts the exercise or its photograph.** "Free weights" matches any barbell, dumbbell or kettlebell in the equipment profile, so a rope pushdown was offered to athletes with no cable.

| Catalog | Exercise | Before → after |
|---|---|---|
| 13 | Plate-Loaded Chest Press | equipment: Free weights → Machine |
| 18 | Cable Fly | secondary: triceps, frontDelts → frontDelts |
| 19 | Low-to-High Cable Fly | secondary: triceps, frontDelts → frontDelts |
| 20 | High-to-Low Cable Fly | secondary: triceps, frontDelts → frontDelts |
| 21 | Pec Deck Fly | secondary: triceps, frontDelts → frontDelts |
| 22 | Dumbbell Fly | secondary: triceps, frontDelts → frontDelts |
| 23 | Incline Dumbbell Fly | secondary: triceps, frontDelts → frontDelts |
| 24 | Dumbbell Pullover | secondary: biceps, rearDelts, forearms → triceps, rearDelts, forearms |
| 40 | Parallel-Bar Dip | movement: Horizontal push → Vertical push |
| 62 | Straight-Arm Cable Pulldown | secondary: biceps, rearDelts, forearms → triceps, rearDelts, forearms |
| 63 | Cable Pullover | secondary: biceps, rearDelts, forearms → triceps, rearDelts, forearms |
| 64 | Machine Pullover | secondary: biceps, rearDelts, forearms → triceps, rearDelts, forearms |
| 65 | Dumbbell Pullover | secondary: biceps, rearDelts, forearms → triceps, rearDelts, forearms |
| 79 | Scapular Pull-Up | secondary: biceps, rearDelts, forearms → rearDelts, forearms |
| 87 | Face Pull | equipment: Free weights → Cable |
| 88 | Rope Face Pull with External Rotation | equipment: Free weights → Cable |
| 101 | Barbell Overhead Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 102 | Seated Barbell Overhead Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 103 | Dumbbell Shoulder Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 104 | Seated Dumbbell Shoulder Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 105 | Arnold Press | equipment: Free weights → Dumbbells; movement: Horizontal push → Vertical push; primary: chest → frontDelts, sideDelts; secondary: triceps, frontDelts, abs → triceps, abs |
| 106 | Machine Shoulder Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 107 | Smith Machine Shoulder Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 108 | Single-Arm Dumbbell Overhead Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 109 | Z-Press | secondary: triceps, frontDelts, abs → triceps, abs |
| 110 | Push Press | equipment: Free weights → Barbell; movement: Horizontal push → Vertical push; primary: chest → frontDelts, sideDelts; secondary: triceps, frontDelts, abs → triceps, abs |
| 120 | Handstand Push-Up | secondary: triceps, frontDelts, abs → triceps, abs |
| 146 | Close-Grip Bench Press | equipment: Free weights → Barbell |
| 147 | JM Press | equipment: Free weights → Barbell; primary: chest → triceps; secondary: triceps, frontDelts, abs → chest, frontDelts, abs |
| 150 | Cable Triceps Pushdown | secondary: frontDelts → (none) |
| 151 | Rope Triceps Pushdown | equipment: Free weights → Cable; secondary: frontDelts → (none) |
| 152 | Reverse-Grip Pushdown | equipment: Free weights → Cable; secondary: frontDelts → (none) |
| 153 | Single-Arm Cable Pushdown | secondary: frontDelts → (none) |
| 158 | Bench Dip | movement: Horizontal push → Vertical push; primary: chest → triceps; secondary: triceps, frontDelts, abs → chest, frontDelts, abs |
| 159 | Ring Dip | movement: Horizontal push → Vertical push |
| 160 | Bodyweight Triceps Extension | equipment: Free weights → Bodyweight |
| 223 | Leg-Press Calf Raise | equipment: Free weights → Machine; movement: Horizontal push → Ankle plantarflexion; primary: chest → calves; secondary: triceps, frontDelts, abs → feet (as 221, 222, 224–226) |
| 249 | Pallof Press | equipment: Free weights → Cable; movement: Horizontal push → Anti-rotation press; primary: chest → abs, obliques; secondary: triceps, frontDelts, abs → chest, triceps, frontDelts |
| 251 | Landmine Press | movement: Horizontal push → Diagonal push; primary: chest → frontDelts, chest; secondary: triceps, frontDelts, abs → triceps, abs |
| 252 | Half-Kneeling Landmine Press | as 251 |
| 253 | Single-Arm Standing Landmine Press | as 251 |
| 254 | Landmine Push Press | as 251 |
| 255 | Landmine Squat-to-Press | movement: Horizontal push → Diagonal press, pull, squat or rotation; primary: chest → shoulders, chest, glutes; secondary: triceps, frontDelts, abs → triceps, upperBack, obliques, quads (as 268 Landmine Thruster) |
| 279 | Medicine-Ball Overhead Backward Throw | movement: Horizontal pull → Throw, slam or ballistic rotation |
| 280 | Medicine-Ball Forward Overhead Throw | movement: Horizontal pull → Throw, slam or ballistic rotation; secondary: biceps, rearDelts, forearms → triceps, rearDelts, forearms |
| 345 | Reverse-Grip Cable Pressdown | secondary: forearms, biceps → forearms |

Forty-six rows. Region by region, decisions are rows tagging a region's catalog keys, and primary counts are in brackets:

| Region | Before → after |
|---|---|
| Upper arm | 194 → 186 (48 → 50) |
| Shoulders | 209 → 204 (56 → 63) |
| Chest | 98 → 95 (82 → 76) |
| Back | 122 → 123 |
| Core | 237 → 236 (48 → 49) |
| Hips | 170 → 171 (115 → 116) |
| Thigh | 122 → 123 |
| Lower leg | 73 → 74 (24 → 25) |
| Forearm | 137 → 137 |

**Seen and not fixed.** Each is another region's reading, or the right tags are not certain from the catalog; their waves' variants lanes decide them:
- **267 Landmine Anti-Rotation Press and 269 Landmine Clean and Press.** They still carry the chest-primary press template, but the catalog defines neither set-up beyond the name.
- **271, 273, 281, 284 and 285, the medicine-ball chest passes and slams.** They carry the rotational-throw template (primary obliques, chest, shoulders) though they do not rotate. The right primaries are the chest's, back's and core's call (waves B and C).
- **279 Medicine-Ball Overhead Backward Throw.** Still tagged primary lats and upper back with secondary biceps, though the legs and hips drive it. It keeps its upper-arm tag, so the upper arm decides it (likely listed unmapped).
- **110 Push Press and 254 Landmine Push Press.** Their leg drive is not tagged. A missing tag is not a wrong one.
- **146 Close-Grip Bench Press and 28 Diamond Push-Up.** Chest primary is defensible; the triceps are secondary.
- **The bench-template `abs` secondary on lying presses.** The core's (wave C).
- **350 Cable Wrist Extension.** Keeps its biceps tag: if the forearm is not supported, the elbow flexors hold it bent against the cable.
- **Face pulls (87, 88) and goblet holds.** Not tagged with the elbow flexors they use. The face pulls get variants anyway (section 1); no tag is added.
- **The catalog's `unilateral` quality.** Wrong on many rows; never read, not changed.
- **The forearm's 72 upper-arm-tagged records.** These are frozen and carry no descriptive dimensions. Two exceptions to the lists above:
  - the curls the upper arm will cite by shoulder position (125 incline, 129 Bayesian, 137 drag: `extended`; 126 preacher, 130 spider: `flexed`) could take `shoulder` as an attribute, which §3 allows without touching a frozen column;
  - this lane was told not to edit those records, so that is left to whoever owns the next forearm-record change.

## 6. What this does elsewhere

- **The seed.** Variants reach the seed only once a region maps them, so the new records add nothing yet. The `shoulder` dimension adds one row to `variant_dimensions` and five to `variant_dimension_values`.
  - `emit-seed.ts --check` reports the seed stale. It was already stale at this lane's base (5080ffe, the anatomy checkpoint). Not regenerated here: the integration lane owns it.
  - Until then, `specializationSeed.test.ts`'s dimension check fails with the drift guard.
- **The logging table** reads only production regions' mappings. `emit-logging-table.ts --check` reports it current.
- **§11 decision 11(c), as planned.** Fifteen forearm-tagged exercises the forearm does not map now have a variant: 24, 63, 64, 65, 279, 280, 335, 343, 344, 345, 346, 348, 388, 389 and 390. Ten are two-handed; 346, 348, 388, 389 and 390 are one-sided or either. On the forearm page, a two-handed one's region-only sets now count on both arms instead of "no arm recorded". A one-sided one's still need a recorded arm (none is asked now, so they count as before in the both-arms summary).
  - The golden edge week logs 24 (fixture `x10`), so `golden.test.ts` (six edge-week cases: one row's side `unknown` → `bilateral`, `boutsUnknownSide` 7 → 6) and `golden.both.test.ts` (three cases) fail.
  - So do `regionRows.test.ts` (its example of an exercise with no variant is 24) and `planBouts.test.ts` (it pins the forearm's planning list to the library's 119).
  - These are the release's allowed differences. The golden tests and their list are the integration lane's, so they are left to it.
- **Download.** The new records add about 25 KB minified (5.2 KB gzipped) to the shared variants chunk every Specialize page loads; 11.4 KB of it is notes text. `bothLimbs.ts` is imported only by tests.
  - §6.1's gate counts raw bytes. Wave 0 measured +24.8 KB of its 42.9 KB allowance, so this alone would exceed the remaining headroom.
  - The integration lane measures it at the release. Options are splitting the library's records out of the page's first chunk, or trimming notes.

## 7. Limits

- The definitions rest on each exercise's name and on the app's own photograph thumbnails, read by eye at small size. No external source was consulted for laterality or set-up.
- Where the thumbnail was unclear, or there is none, the column says `unknown` rather than a guess. Unclear: the hand orientation on 7, 108 and 156, and the handles of 12 and 157. No photograph: 9 and 17, among others.
- The judgement calls are listed where they are made:
  - the 11 untagged rows (section 1);
  - the static-stance premise (section 3);
  - the fixes and the rows left alone (section 5).
