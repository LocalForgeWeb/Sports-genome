# Warm-up drill photographs (October 7)

**Why.** The warm-up's preparation library (`client/src/lib/preTrainingMobility.ts`) has 71 drills and stretches. It is shown on Review and before a workout, and none of its drills had a picture. The exercise catalog's photos had also left 154 exercises on the placeholder. Seven of those had been withdrawn the day before as the wrong variation, so they were looked at again.

**Source.** The same Free Exercise DB set as every exercise photo (public domain, the Unlicense), at the same pinned commit `f00c92c7`. Its 123 stretching entries and its mobility and plyometric drills were the candidates. No image was generated or taken from anywhere else. wger, Wikimedia Commons and jsDelivr are still unreachable from the build environment; only raw.githubusercontent.com is.

## Method

The same standard as the October 3 exercise re-match (`../exercise-photo-rematch/`):

1. **Curator.** One curator per batch (10 batches of drills by region, plus one of the seven exercises). Each read all 876 source names, searched by keyword, read each candidate's instructions and viewed both frames. It proposed a photo only where the frames show that drill. A drill's name and coaching cue define it, so all four of these must match:
   - the body position;
   - the equipment or support;
   - the action: a circle is not a hold, a rock is not a static stretch, a walk is not a march;
   - the part of the body that moves.

   A light rehearsal of a lift ("Light goblet squat rehearsal") is shown by that lift with its implement, whatever the load. Proposals were never:
   - the base movement for a named variation;
   - another drill for the same region.
2. **Two reviewers.** Each proposal went to two independent reviewers told to refute it, looking through different lenses: position and set-up, and the action across the two frames. A photo is kept only if both confirm it. A split is not a confirmation.
3. **Sweep.** A completeness critic re-read the source list against every drill still without a photo. It found nothing more.
4. **By eye.** Every confirmed pair was viewed again before it went in.

`decisions.json` holds all 78 decisions: what each curator viewed, its reading of the frames, and both reviewers' verdicts.

## Result

**15 of the 71 drills have photos:**

| Drill | Source pair |
| --- | --- |
| Low amplitude skip | Fast_Skipping |
| Tempo bodyweight squat | Bodyweight_Squat |
| Low step-up with knee drive | Step-up_with_Knee_Raise |
| Light farmer carry march | Farmers_Walk |
| Single-leg ankle circles | Ankle_Circles |
| Quadruped hip circle | Hip_Circles_prone |
| Band lateral walk | Monster_Walk (a band at the ankles, stepping sideways; also Lateral Band Walk's photo) |
| Band pull-apart | Band_Pull_Apart |
| Scapular pull-up | Scapular_Pull-Up |
| Band external rotation | External_Rotation_with_Band |
| Controlled arm circle | Arm_Circles |
| Wrist circle | Wrist_Circles |
| Light landmine press rehearsal | Single-Arm_Linear_Jammer (Landmine Press's photo) |
| Empty-bar hinge rehearsal | Romanian_Deadlift (shown standing first, as for the Romanian deadlift) |
| Light goblet squat rehearsal | Goblet_Squat |

**Two withdrawn exercises are back, with photos of the right variation:**
- **Bulgarian Split Squat:** Split_Squat_with_Dumbbells, rear foot on a bench with dumbbells in hand. The withdrawn photo had the rear foot on the floor.
- **High Cable Curl:** Overhead_Cable_Curl, standing between two high pulleys and curling to the head. The withdrawn photo was lying on a bench.

The other five withdrawn on October 6 have no correct photo in the source: Clap Push-Up, Pendlay Row, Seal Row, Neutral-Grip Pull-Up and Kettlebell Swing.

**Refused or split, so no photo:**

| Drill | Source photo | Why not |
| --- | --- | --- |
| Cat-camel segmental spine | Cat_Stretch | It rounds the back from neutral and holds. The arch, half of the drill, is never shown. |
| World's greatest lunge | Worlds_Greatest_Stretch | It shows the lunge and the elbow drop, but not the rotation that makes it a thoracic drill. |
| Split-stance hip flexor pulse | Standing_Hip_Flexors | Both reviewers refused it. |
| Quadruped wrist rock | Kneeling_Forearm_Stretch | Both reviewers refused it. |
| Dead bug reach | Dead_Bug | Only a leg moves. This drill is tagged for overhead work, and its reach is the arm's. |
| Split-stance row rehearsal | Shotgun_Row | The row rotates the trunk; this drill's cue is to resist exactly that. |

**One known difference.** The drill "Face pull to external rotation" has no photo, because Face_Pull ends at the face with little external rotation, and this drill's cue is hands beside the ears. The October 6 audit kept that same photo for the exercise "Rope Face Pull with External Rotation", reading the rope finish at the face as enough. The two calls differ on how much rotation the finish must show; the exercise's mapping was left as the audit decided.

**Still without a photo: 56 drills.** The source does not photograph them as the library defines them:
- gait drills: march, backpedal, carioca with hip switch, A-skip, build-up run, pogo, lateral shuffle;
- most rocks, glides and reaches: ankle rock, knee-to-wall, adductor rocks, open book, thoracic rotations, wall slides, wrist glides;
- crawls, planks and bridges with a march or a reach;
- tall-kneeling and half-kneeling versions (the source's Pallof press, for one, is standing).

Each drill's closest candidates, and the difference that rules them out, are in `decisions.json`.

## In the app

- **Drill list:** in the warm-up's "The N drills, in order" list, each drill has its start frame beside its name.
  - Where the source photographs it, the frame is a button: "Show photos of …" opens the start and finish frames under the cue, one drill at a time.
  - Where it does not, the same frame holds an icon, so the rows line up and no drill borrows another's photo.
- **Library:** the cards in the full library carry the same frame.
- **One component:** `ExerciseMedia` does all of it, taking the drill's photo set (`drillPhotoSet` in `client/src/lib/exercisePhotos.ts`). Thumbnails are same-origin copies made by `scripts/exercise-photos/thumbnails.mjs`; their provenance, with the drill ids that use each one, is in `../exercise-media-audit/sources.json`.
- **Frame order:** the 10 source pairs new to the app were checked for order and all are in order (`../exercise-photo-order/audit.json`). Empty-bar hinge shares the Romanian deadlift pair, which was already reversed to start standing.

## To regenerate

1. `node scripts/exercise-photos/drills.mjs <cacheDir>` writes `client/src/data/drillPhotos.json` from the table in the script, with each frame's size read from the file, and leaves the frames in the cache.
2. Fetch the exercise frames into the same cache (`{source}__{frame}.jpg`).
3. `PLAYWRIGHT_MODULE=… node scripts/exercise-photos/thumbnails.mjs <cacheDir>` remakes the thumbnails and `sources.json`. The existing thumbnails come out byte-identical.
