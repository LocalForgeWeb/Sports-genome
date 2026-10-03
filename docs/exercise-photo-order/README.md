# Exercise photo order audit

**Why.** The Free Exercise DB numbers each exercise's two photographs 0 and 1, and the app showed frame 0 as "Start". On Cable Lateral Raise frame 0 has the arm already raised, so the app called the finish the start. The numbering is not a reliable order, so every pair was checked.

**What was checked.** All 207 two-frame photo pairs the catalog uses (229 catalog exercises; several share a pair). Each pair was viewed enlarged beside the source's own instructions and judged by one question: which frame is the position the athlete is in when the rep begins? Rendering scripts: `probes/order.mjs` (app check and the corrected sheets); the enlarged review pages were generated in the session scratchpad from the pinned files.

**Result.** 30 pairs were reversed, covering 35 catalog exercises. 177 pairs are in order.

**October 3.** The photo re-match (`../exercise-photo-rematch/`) brought 14 more source pairs into use. They were checked the same way and all 14 are in order (their verdicts are in `audit.json`, now 221 pairs). Barbell Hip Hinge joined the Romanian deadlift pair, which was already reversed, so 36 catalog exercises now show a reversed pair start-first. The full verdict for every pair, with a one-line reason, is `audit.json`. The reversed list with reasons is `client/src/data/exercisePhotoOrder.json`; `framesInMovementOrder` in `client/src/lib/exercisePhotos.ts` shows frame 1 first for those, everywhere a photo appears (detail Start/Finish, the live-set disclosure, and every thumbnail, which uses the start frame).

| Source pair | Catalog exercises | Frame 0 showed |
| --- | --- | --- |
| Standing_Low-Pulley_Deltoid_Raise | Cable Lateral Raise | arm raised (the reported case) |
| Barbell_Ab_Rollout | Barbell Rollout | piked top |
| Butterfly | Pec Deck Fly | handles together |
| Cable_One_Arm_Tricep_Extension | Single-Arm Cable Pushdown, Single-Arm Cable Pressdown | arm extended |
| Cable_Rope_Overhead_Triceps_Extension | Overhead Cable Triceps Extension, Cable Overhead Triceps Extension | rope behind the head |
| Close-Grip_Barbell_Bench_Press | Close-Grip Bench Press | bar on the chest |
| Decline_Barbell_Bench_Press | Decline Barbell Bench Press | bar on the chest |
| Decline_Dumbbell_Bench_Press | Decline Dumbbell Bench Press | dumbbells at the chest |
| Dumbbell_One-Arm_Triceps_Extension | Single-Arm Dumbbell Triceps Extension | dumbbell behind the head |
| Dumbbell_Step_Ups | Step-Up | standing on the bench |
| Incline_Cable_Flye | Cable Incline Fly | arms open |
| Incline_Push-Up | Incline Push-Up | chest at the box |
| Lateral_Bound | Lateral Bound, Skater Bound | the push-off |
| Lying_Dumbbell_Tricep_Extension | Dumbbell Skull Crusher | dumbbells lowered |
| Lying_Rear_Delt_Raise | Chest-Supported Rear-Delt Raise | arms raised |
| One-Arm_Kettlebell_Snatch | Kettlebell Snatch | standing |
| One-Arm_Kettlebell_Swings | Kettlebell Swing | top of the swing |
| One_Arm_Dumbbell_Bench_Press | Single-Arm Dumbbell Bench Press | dumbbell at the chest |
| Parallel_Bar_Dip | Parallel-Bar Dip | bottom of the dip |
| Plyo_Push-up | Plyometric Push-Up, Clap Push-Up | chest lowered |
| Ring_Dips | Ring Dip | bottom of the dip |
| Romanian_Deadlift | Romanian Deadlift (both entries) | bottom of the hinge |
| Seated_Dumbbell_Press | Seated Dumbbell Shoulder Press | locked out overhead |
| Smith_Machine_Bench_Press | Smith Machine Bench Press | bar on the chest |
| Smith_Machine_Incline_Bench_Press | Smith Machine Incline Press | bar on the chest |
| Smith_Machine_Squat | Smith Machine Squat | bottom of the squat |
| Stiff-Legged_Barbell_Deadlift | Stiff-Leg Deadlift | bottom of the hinge |
| Suspended_Push-Up | Ring Push-Up | bottom of the push-up |
| Upright_Cable_Row | Cable Upright Row | bar at the chin |
| V-Bar_Pulldown | Neutral-Grip Lat Pulldown | bar at the chest |

**The rule, where the source's text disagrees with the lift.** "Start" is where the working rep begins, as the lift is coached. Five verdicts follow that over the source's wording, and are marked in `audit.json`:

- Standing, seated and Smith overhead barbell presses start at the shoulders (the source says locked out). Kept as photographed.
- Preacher Curl starts with the arms extended on the pad (the source says curled). Kept as photographed.
- Romanian Deadlift starts standing (the source says bent over). Reversed.

Bench presses with a rack start locked out, which the source and the coaching agree on. Fly variants follow the source: a pec deck and a standing cable crossover start open; a dumbbell or cable fly on a bench starts with the hands together over the chest.

**Pairs without a clear start.** Where both frames are mid-movement (alternating curls, battle ropes, sled and prowler pushes, monster walk, wrist roller, rope climb) or the two frames are nearly identical (Leverage Shrug, Reverse-Grip Bent-Over Row, Smith Machine Hip Raise), the source order was kept and the "Start"/"Finish" captions are approximate. These are noted in `audit.json`.

**Evidence.** `evidence/after-cable-lateral-raise-390.png` (the reported exercise, now arm down at Start), the same for Parallel-Bar Dip and Smith Machine Bench Press, Dumbbell Lateral Raise as an in-order control, `evidence/app-check.json` (which source frame fills each slot in the running app), and `evidence/after-reversed-1..3.png` (all 30 corrected pairs, start | finish). Captured in headless Chromium at 390 px; not on a phone.
