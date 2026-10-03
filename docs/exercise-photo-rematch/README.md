# Exercise photo re-match (October 3)

**Why.** 171 of the 400 catalog exercises had no photograph and showed the equipment placeholder. The October 1 curation had matched names and a hand-made alias table; it had not searched the source exhaustively for each missing exercise, so some easy matches were never made (Standard Push-Up and Pull-Up both had none, although the source photographs both).

**Source.** The same one: the Free Exercise DB at the pinned commit `f00c92c7` (public domain, the Unlicense). No photograph was generated, edited or taken from anywhere else.

**Method.** The 171 were grouped into 27 batches by movement family (push-ups, chest presses, pull-ups and hangs, rows, shoulders, arms, knee-dominant, hinge and glutes, lower leg and core, landmine, medicine ball and plyometrics).

1. A curator per batch read all 876 source names, ran keyword searches, read each plausible candidate's instructions and viewed both of its frames. It proposed a photo only if the frames show the same exercise: same implement and attachment, same laterality (single-arm, alternating or two-arm), same body position (standing, kneeling, prone, bench angle, box or deficit), the load the name states, and the same movement. A near miss (the base exercise for a named variation, a dumbbell photo for a cable exercise, a floor photo for a box exercise) was recorded as no photo, with the closest candidates and the disqualifying difference.
2. Every proposal went to two independent reviewers, each told to refute it and to judge from the frames, not the curator's words. One looked through a set-up lens (implement, attachment, laterality, position, stance, support, load), the other through a movement lens (joint actions, path, plane, range). A photo was kept only if both confirmed it.
3. A completeness sweep re-read the full source list against every exercise still without a photo, looking for matches under other names.
4. Every confirmed pair was then viewed again side by side before it went into the alias table.

**Result.** 29 photos were proposed. Both reviewers confirmed 26 of them and refused three:
- Deficit Push-Up → Drop_Push: the boxes are tall, so it reads as an incline push-up.
- Depth Drop to Stick → Linear_Depth_Jump: the catalog's exercise is the single-leg landing, and the photo lands on two feet. The same photo is correct for Drop Landing.
- Sled March → Prowler_Sprint: it shows sprinting strides, and Sled Sprint already uses it.

The sweep found nothing further. `decisions.json` records all 171: the curator's reading of the frames, what was viewed, and both reviewers' verdicts.

The 26 new photographs:

| Catalog exercise | Source pair |
| --- | --- |
| Standard Push-Up | Pushups |
| Typewriter Push-Up | Isometric_Wipers |
| Plate-Loaded Chest Press | Leverage_Chest_Press |
| Plate Squeeze Press | Svend_Press |
| Cable Press-Out | Pallof_Press |
| Cable Decline Fly | Cable_Crossover (high-to-low) |
| Pull-Up | Pullups |
| Hanging Knee Raise | Hanging_Leg_Raise (photographed with the knees bent) |
| Cable Single-Arm Bent-Over Row | Shotgun_Row |
| Landmine Row | Bent_Over_One-Arm_Long_Bar_Row |
| Landmine T-Bar Row | T-Bar_Row_with_Handle |
| Incline Dumbbell Shrug | Middle_Back_Shrug |
| Single-Arm Cable Rear-Delt Fly | Bent_Over_Low-Pulley_Side_Lateral (one arm; replaces the two-arm photo rejected on October 1) |
| Prone T-Raise | Dumbbell_Lying_Rear_Lateral_Raise |
| Kneeling Cable Lat Pulldown | Kneeling_High_Pulley_Row |
| Deficit Reverse Lunge | Elevated_Back_Lunge |
| Barbell Hip Hinge | Romanian_Deadlift |
| Cable Reverse Chop | Standing_Cable_Lift |
| Landmine Full Contact Twist | Landmine_180s |
| Landmine Push Press | Single-Arm_Linear_Jammer |
| Landmine Squat-to-Press, Landmine Thruster | Landmine_Linear_Jammer |
| Kneeling Medicine-Ball Chest Pass | Chest_Push_multiple_response (kneeling; replaces the standing photo rejected on October 1) |
| Medicine-Ball Sit-Up Throw | Supine_Two-Arm_Overhead_Throw |
| Explosive Step-Up | Single_Leg_Push-off |
| Drop Landing | Linear_Depth_Jump |

**Two corrections to photos already shown.** Assigning these pairs exposed two existing ones that teach a different movement:
- **Hanging Leg Raise.** The source's Hanging_Leg_Raise text says straight legs, but its photo shows the knees bent to 90°, which is a hanging knee raise. That photo now illustrates Hanging Knee Raise. Hanging Leg Raise shows the placeholder (`rejected` in `curate.mjs`), because the source has no straight-leg hang.
- **Landmine Press.** It showed Landmine_Linear_Jammer, a half squat into a two-handle press, i.e. the thruster. It now shows Single-Arm_Linear_Jammer, the standing press from the shoulder. That pair also illustrates Single-Arm Standing Landmine Press and Landmine Push Press.

**Frame order.** The 14 source pairs new to the catalog were checked the same way as the original 207 (`../exercise-photo-order/`). All 14 are in movement order, so none was added to `exercisePhotoOrder.json`. Barbell Hip Hinge uses the Romanian deadlift pair, which was already reversed to start standing. Typewriter Push-Up's two frames are both the low traverse, one hand then the other; like Landmine 180s, they keep the source's order.

**Coverage.** The catalog goes from 229 to 254 of 400 photographed (26 added, 1 withdrawn), using 221 source pairs.

**Still without a photograph: 146.** The source does not photograph these as the catalog defines them. Each one's closest candidates, and why they are not the exercise, are in `decisions.json`.
- **Push-ups and bodyweight pressing (8):** Archer Push-Up, Explosive Depth Push-Up, Deficit Push-Up, Weighted Push-Up, Spiderman Push-Up, Explosive Medicine-Ball Push-Up, Cable Resisted Push-Up, Bodyweight Triceps Extension.
- **Chest presses (10):** Alternating Dumbbell Bench Press, Single-Arm Cable Chest Press, Cable Press Around, Half-Kneeling Cable Chest Press, Cable Squeeze Press, Cable Decline Press, Single-Arm Cable Floor Press, Cable Standing Punch, Cable Incline Press-Around, Cable Front-Foot-Elevated Press.
- **Pull-ups, hangs and core on the bar (10):** Weighted Chin-Up, Commando Pull-Up, Archer Pull-Up, L-Sit Pull-Up, Towel Pull-Up, Dead Hang, Towel Dead Hang, L-Sit, Chin-Up Curl, Hanging Leg Raise.
- **Rows (9):** Meadows Row, Wide-Grip Cable Row, Feet-Elevated Inverted Row, Chest-Supported Cable Row, Rope Cable Row, Cable Rotational Row, Meadows Landmine Row, Chest-Supported Landmine Row, Offset Landmine Row.
- **Shoulders and scapular (16):** Trap-Bar Shrug, Dumbbell Y-Raise, Cable Y-Raise, Prone Y-Raise, Prone W-Raise, Scapular Wall Slide, Z-Press, Machine Lateral Raise, Leaning Cable Lateral Raise, Behind-the-Back Cable Lateral Raise, Cable Y Raise, Cable Scaption Raise, Cable Cuban Rotation, Cable Serratus Punch, Cable Trap Raise, Cable High Pull.
- **Arms, pullovers and grip (11):** Bayesian Cable Curl, Farmer Hold, Incline Cable Curl, Cable Concentration Curl, Cable Spider Curl, Cross-Body Cable Curl, Cross-Body Cable Triceps Extension, Cable Triceps Kickback, Cable Wrist Extension, Cable Pullover, Machine Pullover.
- **Knee-dominant (18):** Pendulum Squat, Single-Leg Leg Press, Front-Foot-Elevated Split Squat, Peterson Step-Up, Cyclist Squat, Spanish Squat, Assisted Pistol Squat, Cossack Squat, Lateral Goblet Squat, Cable Belt Squat, Cable Goblet Squat, Cable Front Squat, Cable Step-Up, Cable Lateral Step-Up, Cable Skater Squat, Cable Reverse Lunge, Cable Lateral Lunge, Cable Crossover Step Lunge.
- **Hinge, hamstrings and glutes (20):** Assisted Nordic Curl, Slider Hamstring Curl, B-Stance Romanian Deadlift, Dumbbell Hip Thrust, Single-Leg Hip Thrust, Machine Glute Kickback, Cable Hip Abduction, Cable Good Morning, Cable Single-Leg Deadlift, Cable Hip Thrust, Cable Quadruped Hip Extension, Cable Donkey Kick, Cable Fire Hydrant, Cable Standing Hip Abduction, Cable Hamstring Curl, Cable Standing Leg Curl, Cable Leg Extension, Assisted Nordic Hamstring Curl, Side Plank Hip Adduction, Copenhagen Plank.
- **Lower leg and core (15):** Single-Leg Calf Raise, Tibialis Raise, Weighted Tibialis Raise, Toe Walk, Heel Walk, Cable Calf Raise, Cable Tibialis Raise, Weighted Decline Sit-Up, Hollow-Body Hold, Weighted Plank, Cable Dead Bug, Cable Horizontal Chop, Cable Anti-Rotation Walkout, Cable Forward March, Cable Standing Knee Drive.
- **Landmine (13):** Half-Kneeling Landmine Press, Landmine Squat, Landmine Hack Squat, Landmine Reverse Lunge, Landmine Lateral Lunge, Landmine Romanian Deadlift, Landmine Single-Leg Romanian Deadlift, Landmine Anti-Rotation Press, Landmine Clean and Press, Landmine Split Jerk, Alternating Landmine Press, Tall-Kneeling Landmine Press, Landmine Split Press.
- **Medicine ball, plyometrics, carries and conditioning (16):** Medicine-Ball Rotational Slam, Medicine-Ball Side Throw, Medicine-Ball Rotational Wall Throw, Medicine-Ball Shot-Put Throw, Half-Kneeling Rotational Throw, Medicine-Ball Sprawl-to-Slam, Medicine-Ball Slam-to-Sprint, Weighted Box Jump, Single-Leg Broad Jump, Pogo Jump, Zercher Carry, Single-Leg Box Jump, Depth Drop to Stick, Sled March, Battle Rope Slams, Kettlebell Clean and Press.

**Other sources considered for the remainder.** None was used:
- hasaneyldrm/exercises-dataset: its MIT licence excludes the media, which are © Gym visual.
- RepDB free tier (sergei-argutin/exercise-dataset): AI-generated flat illustrations, not photographs, under a custom licence that requires a visible credit and forbids redistribution. In the samples checked, the movement was drawn wrong: the "battle rope double slam" never raises the ropes overhead, and the "archer pull-up" barely leaves the hang.
- exercemus/exercises: data only, no images.
- wger and Wikimedia Commons have openly licensed exercise photos (mostly CC BY-SA, with per-photo author credit), but neither host is reachable from the environment this was built in, so no photo from them could be viewed and verified.

Photographing the remaining exercises, or a licensed set with per-photo credit, would need a decision on source and credit display first.
