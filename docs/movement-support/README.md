# Movement support: which exercises support a sport movement, and why

Sep 30 correction, brief section 4. This page describes how the app decides which catalog
exercises to show for a sport movement ("Exercises for Bridge"), lists the results for three
audited movements, and records the gaps in the data for the owner to review.

The matches are made by exercise name against the movement's research record. **No person has
reviewed them exercise by exercise.** The app says so: a match is "named in the movement record",
never "reviewed".

The data sections below the method are generated. To regenerate them after a change to the
catalog, the movement records, the synonym list, the not-the-same list or the broad patterns, run
from the repo root:

```
npx tsx scripts/movement-support-report.ts
```

## Method

### One source

Each sport movement (for example `wrestling-19`, Bridge) has an enriched research record in
`client/src/lib/enrichedSportMovementDatabase.ts`, keyed `${sportId}/${movementId}`. The record
names exercises (`recommendedExercises`), lists prime movers, and carries an evidence confidence
and its sources. That record is the only thing that places an exercise in a tier.

Not used to place an exercise: the catalog's `qualities` (copied across whole catalog groups), the
Matches engine's regular-expression "signals", fields derived in `exerciseGenome`, the catalog's
`muscleGrade` (S or A) and `sportFit` grades, and the sport-level research registry. The Matches
page (`?workspace=recommended`) and its `getMovementRecommendations` engine are unchanged in this
correction and are not part of this model.

### Three tiers

1. **Movement-specific.** The exercise's name contains an exercise the record names, as a run of
   whole words: "Barbell Hip Thrust" contains "hip thrust"; "Landmine Anti-Rotation Press" does not
   contain "landmine press". Before comparing, both sides are normalized: lower case, apostrophes
   dropped, hyphens and other punctuation read as spaces, a simple plural made singular, spaces
   collapsed. A short list of exact same-exercise synonyms (below) covers names the record and the
   catalog write differently, such as "rear-foot-elevated split squat" for the Bulgarian Split
   Squat. A second short list, Not the same exercise, removes pairs the rule would match although
   the catalog exercise is a different one ("row" in Cable Upright Row). Order: the record's own
   order of named exercises, then catalog id.
   Why it appears: "Named in the Bridge movement record: hip thrust".
2. **Related pattern.** Not movement-specific; the exercise's catalog `movement` pattern is the
   pattern of a movement-specific exercise; that pattern is not one of the broad patterns (below);
   and one of the exercise's primary muscles is a prime mover in the record. Order: most shared
   prime movers first, then catalog id. Why it appears: "Same hip hinge pattern as Romanian
   Deadlift".
3. **Muscle support.** Neither of the above; one of the exercise's primary muscles is a prime
   mover in the record. Shown in a separate collapsed section and never counted as a match. Order:
   the record's prime-mover order, then catalog id, so an exercise tagged with many muscles is not
   lifted by that. Why it appears: "Trains gluteus maximus, a prime mover in Bridge; not specific to
   the movement."

An assisting or stabilizing muscle alone never relates an exercise: before this correction any
shared muscle role made a "Supporting link", which covered 17 to 98 percent of the catalog
depending on the movement (median 70 percent, measured while mapping this correction).

There are no numbers, percentages or letter grades for relevance. The tier and its reason are the
whole answer. The movement-mode count ("{n} movement matches") counts movement-specific and
related-pattern rows only.

### Broad patterns

A catalog pattern is broad when it labels more than 15 of the 400 exercises (more than one in 25).
Every pattern above that size names a direction of force or a single joint action rather than one
exercise family: "Horizontal push" holds bench presses, flys, push-ups, dips, the landmine presses
and the mis-tagged Pallof Press. Without the rule, the landmine press that overhand throwing names
would bring the other 61 Horizontal push exercises (bench presses, flys, push-ups, dips) in as
"related", because they all train its pectoralis major. The largest pattern below the line, "Hip hinge"
(15), is one family: deadlifts, good mornings, back extensions, swings. The list is
`BROAD_PATTERNS` in `movementSupport.ts`; a test recomputes the rule against the catalog.

### Same-exercise synonyms

Only two names for one exercise belong in the list: two established names (rear-foot-elevated split
squat and Bulgarian split squat), a spelling or abbreviation (woodchop, RDL), or a word every
version of the exercise has and one side leaves out (the back squat is a barbell lift). A general
name and one specific variant of it ("medicine-ball rotational throw" and the catalog's
Medicine-Ball Rotational Wall Throw) do not belong; those stay unmatched and are listed for review.
The list, with each reason, is under Reference lists.

The opposite case has its own list, `NOT_THE_SAME_EXERCISE`: a catalog exercise whose name contains
a phrase the record names but which is a different exercise (a handstand push-up for "push-up", a
split-squat jump for "split squat"). Each entry names the record phrase, the catalog id and why. The
name rule skips that pair only; the exercise can still be related pattern or muscle support on its
own pattern and muscles. The entries were read by hand from the phrases that reach the most
catalog names (Phrases the name rule stretches, at the end); the table is under Reference lists.

### Muscles

The record names muscles in anatomical language ("obliquus externus abdominis", "triceps surae").
One shared alias list, `client/src/lib/recordMuscleKeys.ts`, turns them into the app's muscle keys.
Body Lab draws roles with it and the tiers match exercises with it, so the prime movers on the map
are the prime movers the tiers use. Five keys are regions the body map draws but the catalog never
tags (soleus, rhomboids, brachioradialis, tensor fasciae latae, peroneals); for exercise matching
they fold into the catalog key for the same tissue (calves, upper back, forearms, hip abductors)
or, for the peroneals, into nothing. Group words that are not a muscle ("trunk", "scapular
stabilizers") map to nothing.

This list replaced three that disagreed. What changed as a result:

- Body Lab roles change in 51 of 400 records, all corrections: "triceps surae" is now drawn as the
  calf and soleus, not the triceps; "biceps femoris" no longer lights the biceps; a hyphenated
  "rotator-cuff" is now read; the named forearm muscles (flexor digitorum, flexor and extensor
  carpi, the pronators) are drawn as the forearm, and iliacus and psoas as the hip flexors.
- The training coverage in Movement intelligence now reads "obliquus", serratus anterior,
  iliopsoas, the abdominal wall, the named forearm muscles, TFL and triceps surae, which it missed
  before. Gluteus medius and minimus now count as hip abductors only (not also the glutes key,
  which is the gluteus maximus on the map); the parts of the trapezius count as the trapezius only;
  "scapular stabilizers" no longer counts as the upper back.

### Missing data

- **No enriched record** (status `no-record`): "Movement-specific matches aren't available yet for
  {Movement}", with "Browse exercises for its muscles" and "Open the full catalog". No tier has rows.
- **A record that names nothing in the catalog** (status `no-named-matches`): the same message;
  muscle support may still be offered, collapsed, because the record has prime movers.
- **Refinements that remove every match** (equipment, search, favorites): "No {Movement} matches
  with these filters" with "Clear filters", which keeps the movement. Refinements apply inside each
  tier, only ever remove rows, and never re-rank a tier.

### Where it lives

- `client/src/lib/movementSupport.ts`: the normalizer and matcher, `SAME_EXERCISE_SYNONYMS`,
  `NOT_THE_SAME_EXERCISE`, `BROAD_PATTERNS`, `classifyExerciseForMovement`, `getMovementSupport` (one result per movement,
  kept), `movementMatchCount`. Re-exported from `movementProgramAnalysis.ts`.
- `client/src/lib/catalogDiscovery.ts`: `refineMovementSupport`, the refinements inside each tier.
- `client/src/lib/movementProgramAnalysis.ts`: `getExerciseActionConnection` and
  `createActionConnectionLookup` read the tiers, so the catalog rows, the exercise details (Sport
  context), the genome panel and Movement intelligence all say what the movement list says.
- `client/src/lib/recordMuscleKeys.ts`: the shared muscle alias list.

<!-- generated:start (scripts/movement-support-report.ts) -->

## Audited movements

### Wrestling · Bridge (`wrestling-19`)

- Record: moderate confidence, 3 sources.
- Named exercises, in record order: "hip thrust", "glute bridge", "Romanian deadlift", "cable anti-rotation".
- Prime movers: gluteus maximus, hamstrings, erector spinae, obliquus externus abdominis (catalog keys: glutes, hamstrings, lowerBack, obliques).
- Named exercises with no catalog match: none.
- Counts: 15 movement-specific, 12 related pattern (27 movement matches); 104 muscle support, shown apart and not counted.

#### Movement-specific (15)

| Id | Exercise | Pattern | Why it appears |
|---:|---|---|---|
| 206 | Barbell Hip Thrust | Hip extension | Named in the Bridge movement record: hip thrust |
| 207 | Smith Machine Hip Thrust | Hip extension | Named in the Bridge movement record: hip thrust |
| 208 | Dumbbell Hip Thrust | Hip extension | Named in the Bridge movement record: hip thrust |
| 209 | Single-Leg Hip Thrust | Hip extension | Named in the Bridge movement record: hip thrust |
| 360 | Cable Hip Thrust | Hip extension | Named in the Bridge movement record: hip thrust |
| 210 | Glute Bridge | Hip extension | Named in the Bridge movement record: glute bridge |
| 211 | Single-Leg Glute Bridge | Hip extension | Named in the Bridge movement record: glute bridge |
| 42 | Romanian Deadlift | Hip hinge | Named in the Bridge movement record: Romanian deadlift |
| 186 | Romanian Deadlift | Hip hinge | Named in the Bridge movement record: Romanian deadlift |
| 188 | Single-Leg Romanian Deadlift | Hip hinge | Named in the Bridge movement record: Romanian deadlift |
| 189 | Dumbbell Romanian Deadlift | Hip hinge | Named in the Bridge movement record: Romanian deadlift |
| 205 | B-Stance Romanian Deadlift | Hip hinge | Named in the Bridge movement record: Romanian deadlift |
| 263 | Landmine Romanian Deadlift | Hip hinge | Named in the Bridge movement record: Romanian deadlift |
| 264 | Landmine Single-Leg Romanian Deadlift | Hip hinge | Named in the Bridge movement record: Romanian deadlift |
| 380 | Cable Anti-Rotation Walkout | Anti-rotation | Named in the Bridge movement record: cable anti-rotation |

#### Related pattern (12)

| Id | Exercise | Pattern | Why it appears |
|---:|---|---|---|
| 41 | Conventional Deadlift | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 187 | Stiff-Leg Deadlift | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 190 | Good Morning | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 191 | Seated Good Morning | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 200 | 45-Degree Back Extension | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 201 | Reverse Hyperextension | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 202 | Cable Pull-Through | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 203 | Kettlebell Swing | Hip hinge | Same hip hinge pattern as Romanian Deadlift |
| 212 | Cable Glute Kickback | Hip extension | Same hip extension pattern as Barbell Hip Thrust |
| 213 | Machine Glute Kickback | Hip extension | Same hip extension pattern as Barbell Hip Thrust |
| 361 | Cable Quadruped Hip Extension | Hip extension | Same hip extension pattern as Barbell Hip Thrust |
| 362 | Cable Donkey Kick | Hip extension | Same hip extension pattern as Barbell Hip Thrust |

<details><summary>Muscle support (104), shown collapsed and never counted as matches</summary>

| Id | Exercise | Why it appears |
|---:|---|---|
| 161 | Back Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 162 | High-Bar Back Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 163 | Front Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 164 | Zercher Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 165 | Goblet Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 166 | Hack Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 167 | Pendulum Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 168 | Smith Machine Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 169 | Leg Press | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 170 | Single-Leg Leg Press | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 172 | Single-Leg Leg Extension | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 173 | Bulgarian Split Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 174 | Front-Foot-Elevated Split Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 175 | Reverse Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 176 | Forward Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 177 | Walking Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 178 | Deficit Reverse Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 179 | Step-Up | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 180 | Peterson Step-Up | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 181 | Cyclist Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 182 | Sissy Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 183 | Spanish Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 184 | Pistol Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 185 | Assisted Pistol Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 204 | Barbell Hip Hinge | Trains gluteus maximus and hamstrings, prime movers in Bridge; not specific to the movement. |
| 214 | Hip Abduction Machine | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 215 | Cable Hip Abduction | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 216 | Lateral Band Walk | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 220 | Cossack Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 250 | Cable Wood Chop | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 259 | Landmine Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 260 | Landmine Hack Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 261 | Landmine Reverse Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 262 | Landmine Lateral Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 265 | Landmine Rotation | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 266 | Landmine 180 | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 268 | Landmine Thruster | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 270 | Landmine Split Jerk | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 274 | Medicine-Ball Rotational Slam | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 275 | Medicine-Ball Side Throw | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 276 | Medicine-Ball Rotational Wall Throw | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 277 | Medicine-Ball Scoop Toss | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 278 | Medicine-Ball Shot-Put Throw | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 282 | Half-Kneeling Rotational Throw | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 286 | Box Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 287 | Depth Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 288 | Broad Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 289 | Weighted Box Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 290 | Lateral Bound | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 291 | Single-Leg Broad Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 292 | Pogo Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 293 | Jump Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 294 | Split-Squat Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 295 | Explosive Step-Up | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 296 | Heavy Sled Push | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 297 | Backward Sled Drag | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 298 | Sled Sprint | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 351 | Cable Belt Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 352 | Cable Goblet Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 353 | Cable Front Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 354 | Cable Deadlift | Trains gluteus maximus and hamstrings, prime movers in Bridge; not specific to the movement. |
| 355 | Cable Good Morning | Trains gluteus maximus and hamstrings, prime movers in Bridge; not specific to the movement. |
| 356 | Cable Single-Leg Deadlift | Trains gluteus maximus and hamstrings, prime movers in Bridge; not specific to the movement. |
| 357 | Cable Step-Up | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 358 | Cable Lateral Step-Up | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 359 | Cable Skater Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 371 | Cable Reverse Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 372 | Cable Lateral Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 373 | Cable Crossover Step Lunge | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 374 | Cable Forward March | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 385 | Landmine Full Contact Twist | Trains gluteus maximus and obliquus externus abdominis, prime movers in Bridge; not specific to the movement. |
| 387 | Kettlebell Clean | Trains gluteus maximus and hamstrings, prime movers in Bridge; not specific to the movement. |
| 388 | Kettlebell Snatch | Trains gluteus maximus and hamstrings, prime movers in Bridge; not specific to the movement. |
| 389 | Kettlebell Clean and Press | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 390 | Turkish Get-Up | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 391 | Lateral Goblet Squat | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 392 | Skater Bound | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 393 | Single-Leg Box Jump | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 394 | Depth Drop to Stick | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 395 | Drop Landing | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 398 | Sled March | Trains gluteus maximus, a prime mover in Bridge; not specific to the movement. |
| 192 | Nordic Hamstring Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 193 | Assisted Nordic Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 194 | Lying Leg Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 195 | Seated Leg Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 196 | Standing Single-Leg Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 197 | Stability-Ball Hamstring Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 198 | Slider Hamstring Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 199 | Glute-Ham Raise | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 366 | Cable Hamstring Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 367 | Cable Standing Leg Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 396 | Assisted Nordic Hamstring Curl | Trains hamstrings, a prime mover in Bridge; not specific to the movement. |
| 234 | Toes-to-Bar | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 271 | Medicine-Ball Chest Pass | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 273 | Medicine-Ball Overhead Slam | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 281 | Kneeling Medicine-Ball Chest Pass | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 284 | Medicine-Ball Sprawl-to-Slam | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 285 | Medicine-Ball Slam-to-Sprint | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 310 | Cable Press-Out | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 376 | Cable Dead Bug | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 377 | Cable Reverse Chop | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 378 | Cable Horizontal Chop | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 379 | Cable Rotational Row | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |
| 397 | Side Plank Hip Adduction | Trains obliquus externus abdominis, a prime mover in Bridge; not specific to the movement. |

</details>

### Wrestling · Penetration step (`wrestling-1`)

- Record: moderate confidence, 3 sources.
- Named exercises, in record order: "rear-foot-elevated split squat", "walking lunge", "sled push", "landmine press".
- Prime movers: gluteus maximus, quadriceps, adductor magnus, soleus (catalog keys: glutes, quads, adductors, calves).
- Named exercises with no catalog match: none.
- Counts: 8 movement-specific, 10 related pattern (18 movement matches); 109 muscle support, shown apart and not counted.

#### Movement-specific (8)

| Id | Exercise | Pattern | Why it appears |
|---:|---|---|---|
| 173 | Bulgarian Split Squat | Squat / knee dominant | Named in the Penetration step movement record: rear-foot-elevated split squat (the same exercise as the Bulgarian split squat) |
| 177 | Walking Lunge | Unilateral knee dominant | Named in the Penetration step movement record: walking lunge |
| 296 | Heavy Sled Push | Resisted locomotion / push | Named in the Penetration step movement record: sled push |
| 251 | Landmine Press | Horizontal push | Named in the Penetration step movement record: landmine press |
| 252 | Half-Kneeling Landmine Press | Horizontal push | Named in the Penetration step movement record: landmine press |
| 253 | Single-Arm Standing Landmine Press | Horizontal push | Named in the Penetration step movement record: landmine press |
| 381 | Alternating Landmine Press | Diagonal push | Named in the Penetration step movement record: landmine press |
| 382 | Tall-Kneeling Landmine Press | Diagonal push | Named in the Penetration step movement record: landmine press |

#### Related pattern (10)

| Id | Exercise | Pattern | Why it appears |
|---:|---|---|---|
| 175 | Reverse Lunge | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 176 | Forward Lunge | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 178 | Deficit Reverse Lunge | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 179 | Step-Up | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 180 | Peterson Step-Up | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 184 | Pistol Squat | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 185 | Assisted Pistol Squat | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 261 | Landmine Reverse Lunge | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 262 | Landmine Lateral Lunge | Unilateral knee dominant | Same unilateral knee dominant pattern as Walking Lunge |
| 298 | Sled Sprint | Resisted locomotion / push | Same resisted locomotion / push pattern as Heavy Sled Push |

<details><summary>Muscle support (109), shown collapsed and never counted as matches</summary>

| Id | Exercise | Why it appears |
|---:|---|---|
| 41 | Conventional Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 42 | Romanian Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 161 | Back Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 162 | High-Bar Back Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 163 | Front Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 164 | Zercher Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 165 | Goblet Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 166 | Hack Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 167 | Pendulum Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 168 | Smith Machine Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 169 | Leg Press | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 170 | Single-Leg Leg Press | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 172 | Single-Leg Leg Extension | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 174 | Front-Foot-Elevated Split Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 181 | Cyclist Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 182 | Sissy Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 183 | Spanish Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 186 | Romanian Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 187 | Stiff-Leg Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 188 | Single-Leg Romanian Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 189 | Dumbbell Romanian Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 190 | Good Morning | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 191 | Seated Good Morning | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 200 | 45-Degree Back Extension | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 201 | Reverse Hyperextension | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 202 | Cable Pull-Through | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 203 | Kettlebell Swing | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 204 | Barbell Hip Hinge | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 205 | B-Stance Romanian Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 206 | Barbell Hip Thrust | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 207 | Smith Machine Hip Thrust | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 208 | Dumbbell Hip Thrust | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 209 | Single-Leg Hip Thrust | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 210 | Glute Bridge | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 211 | Single-Leg Glute Bridge | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 212 | Cable Glute Kickback | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 213 | Machine Glute Kickback | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 214 | Hip Abduction Machine | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 215 | Cable Hip Abduction | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 216 | Lateral Band Walk | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 220 | Cossack Squat | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 250 | Cable Wood Chop | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 259 | Landmine Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 260 | Landmine Hack Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 263 | Landmine Romanian Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 264 | Landmine Single-Leg Romanian Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 265 | Landmine Rotation | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 266 | Landmine 180 | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 268 | Landmine Thruster | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 270 | Landmine Split Jerk | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 274 | Medicine-Ball Rotational Slam | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 275 | Medicine-Ball Side Throw | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 276 | Medicine-Ball Rotational Wall Throw | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 277 | Medicine-Ball Scoop Toss | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 278 | Medicine-Ball Shot-Put Throw | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 282 | Half-Kneeling Rotational Throw | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 286 | Box Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 287 | Depth Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 288 | Broad Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 289 | Weighted Box Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 290 | Lateral Bound | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 291 | Single-Leg Broad Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 292 | Pogo Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 293 | Jump Squat | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 294 | Split-Squat Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 295 | Explosive Step-Up | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 297 | Backward Sled Drag | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 351 | Cable Belt Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 352 | Cable Goblet Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 353 | Cable Front Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 354 | Cable Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 355 | Cable Good Morning | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 356 | Cable Single-Leg Deadlift | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 357 | Cable Step-Up | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 358 | Cable Lateral Step-Up | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 359 | Cable Skater Squat | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 360 | Cable Hip Thrust | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 361 | Cable Quadruped Hip Extension | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 362 | Cable Donkey Kick | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 371 | Cable Reverse Lunge | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 372 | Cable Lateral Lunge | Trains gluteus maximus, quadriceps and adductor magnus, prime movers in Penetration step; not specific to the movement. |
| 373 | Cable Crossover Step Lunge | Trains gluteus maximus, quadriceps and adductor magnus, prime movers in Penetration step; not specific to the movement. |
| 374 | Cable Forward March | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 385 | Landmine Full Contact Twist | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 387 | Kettlebell Clean | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 388 | Kettlebell Snatch | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 389 | Kettlebell Clean and Press | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 390 | Turkish Get-Up | Trains gluteus maximus, a prime mover in Penetration step; not specific to the movement. |
| 391 | Lateral Goblet Squat | Trains gluteus maximus, quadriceps and adductor magnus, prime movers in Penetration step; not specific to the movement. |
| 392 | Skater Bound | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 393 | Single-Leg Box Jump | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 394 | Depth Drop to Stick | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 395 | Drop Landing | Trains gluteus maximus and quadriceps, prime movers in Penetration step; not specific to the movement. |
| 398 | Sled March | Trains gluteus maximus, quadriceps and soleus, prime movers in Penetration step; not specific to the movement. |
| 171 | Leg Extension | Trains quadriceps, a prime mover in Penetration step; not specific to the movement. |
| 368 | Cable Leg Extension | Trains quadriceps, a prime mover in Penetration step; not specific to the movement. |
| 375 | Cable Standing Knee Drive | Trains quadriceps, a prime mover in Penetration step; not specific to the movement. |
| 217 | Copenhagen Plank | Trains adductor magnus, a prime mover in Penetration step; not specific to the movement. |
| 218 | Cable Hip Adduction | Trains adductor magnus, a prime mover in Penetration step; not specific to the movement. |
| 219 | Hip Adduction Machine | Trains adductor magnus, a prime mover in Penetration step; not specific to the movement. |
| 364 | Cable Standing Hip Adduction | Trains adductor magnus, a prime mover in Penetration step; not specific to the movement. |
| 397 | Side Plank Hip Adduction | Trains adductor magnus, a prime mover in Penetration step; not specific to the movement. |
| 221 | Standing Calf Raise | Trains soleus, a prime mover in Penetration step; not specific to the movement. |
| 222 | Seated Calf Raise | Trains soleus, a prime mover in Penetration step; not specific to the movement. |
| 224 | Single-Leg Calf Raise | Trains soleus, a prime mover in Penetration step; not specific to the movement. |
| 225 | Donkey Calf Raise | Trains soleus, a prime mover in Penetration step; not specific to the movement. |
| 226 | Smith Machine Calf Raise | Trains soleus, a prime mover in Penetration step; not specific to the movement. |
| 229 | Toe Walk | Trains soleus, a prime mover in Penetration step; not specific to the movement. |
| 369 | Cable Calf Raise | Trains soleus, a prime mover in Penetration step; not specific to the movement. |

</details>

### Baseball · Overhand throwing (`baseball-4`)

- Record: moderate confidence, 3 sources.
- Named exercises, in record order: "medicine-ball rotational throw", "cable lift", "landmine press", "one-arm cable row".
- Prime movers: gluteus maximus, internal oblique, external oblique, pectoralis major, subscapularis (catalog keys: glutes, obliques, chest, rotatorCuff).
- Named exercises with no catalog match: "medicine-ball rotational throw", "cable lift".
- Counts: 6 movement-specific, 6 related pattern (12 movement matches); 185 muscle support, shown apart and not counted.

#### Movement-specific (6)

| Id | Exercise | Pattern | Why it appears |
|---:|---|---|---|
| 251 | Landmine Press | Horizontal push | Named in the Overhand throwing movement record: landmine press |
| 252 | Half-Kneeling Landmine Press | Horizontal push | Named in the Overhand throwing movement record: landmine press |
| 253 | Single-Arm Standing Landmine Press | Horizontal push | Named in the Overhand throwing movement record: landmine press |
| 381 | Alternating Landmine Press | Diagonal push | Named in the Overhand throwing movement record: landmine press |
| 382 | Tall-Kneeling Landmine Press | Diagonal push | Named in the Overhand throwing movement record: landmine press |
| 56 | Single-Arm Cable Row | Horizontal pull | Named in the Overhand throwing movement record: one-arm cable row (the same exercise as the single-arm cable row) |

#### Related pattern (6)

| Id | Exercise | Pattern | Why it appears |
|---:|---|---|---|
| 305 | Cable Incline Press | Diagonal push | Same diagonal push pattern as Alternating Landmine Press |
| 306 | Cable Decline Press | Diagonal push | Same diagonal push pattern as Alternating Landmine Press |
| 312 | Cable Incline Fly | Diagonal push | Same diagonal push pattern as Alternating Landmine Press |
| 313 | Cable Decline Fly | Diagonal push | Same diagonal push pattern as Alternating Landmine Press |
| 323 | Cable Standing Punch | Diagonal push | Same diagonal push pattern as Alternating Landmine Press |
| 324 | Cable Incline Press-Around | Diagonal push | Same diagonal push pattern as Alternating Landmine Press |

<details><summary>Muscle support (185), shown collapsed and never counted as matches</summary>

| Id | Exercise | Why it appears |
|---:|---|---|
| 41 | Conventional Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 42 | Romanian Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 161 | Back Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 162 | High-Bar Back Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 163 | Front Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 164 | Zercher Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 165 | Goblet Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 166 | Hack Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 167 | Pendulum Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 168 | Smith Machine Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 169 | Leg Press | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 170 | Single-Leg Leg Press | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 172 | Single-Leg Leg Extension | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 173 | Bulgarian Split Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 174 | Front-Foot-Elevated Split Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 175 | Reverse Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 176 | Forward Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 177 | Walking Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 178 | Deficit Reverse Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 179 | Step-Up | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 180 | Peterson Step-Up | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 181 | Cyclist Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 182 | Sissy Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 183 | Spanish Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 184 | Pistol Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 185 | Assisted Pistol Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 186 | Romanian Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 187 | Stiff-Leg Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 188 | Single-Leg Romanian Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 189 | Dumbbell Romanian Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 190 | Good Morning | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 191 | Seated Good Morning | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 200 | 45-Degree Back Extension | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 201 | Reverse Hyperextension | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 202 | Cable Pull-Through | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 203 | Kettlebell Swing | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 204 | Barbell Hip Hinge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 205 | B-Stance Romanian Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 206 | Barbell Hip Thrust | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 207 | Smith Machine Hip Thrust | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 208 | Dumbbell Hip Thrust | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 209 | Single-Leg Hip Thrust | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 210 | Glute Bridge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 211 | Single-Leg Glute Bridge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 212 | Cable Glute Kickback | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 213 | Machine Glute Kickback | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 214 | Hip Abduction Machine | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 215 | Cable Hip Abduction | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 216 | Lateral Band Walk | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 220 | Cossack Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 250 | Cable Wood Chop | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 259 | Landmine Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 260 | Landmine Hack Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 261 | Landmine Reverse Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 262 | Landmine Lateral Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 263 | Landmine Romanian Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 264 | Landmine Single-Leg Romanian Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 265 | Landmine Rotation | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 266 | Landmine 180 | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 268 | Landmine Thruster | Trains gluteus maximus and pectoralis major, prime movers in Overhand throwing; not specific to the movement. |
| 270 | Landmine Split Jerk | Trains gluteus maximus and pectoralis major, prime movers in Overhand throwing; not specific to the movement. |
| 274 | Medicine-Ball Rotational Slam | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 275 | Medicine-Ball Side Throw | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 276 | Medicine-Ball Rotational Wall Throw | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 277 | Medicine-Ball Scoop Toss | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 278 | Medicine-Ball Shot-Put Throw | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 282 | Half-Kneeling Rotational Throw | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 286 | Box Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 287 | Depth Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 288 | Broad Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 289 | Weighted Box Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 290 | Lateral Bound | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 291 | Single-Leg Broad Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 292 | Pogo Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 293 | Jump Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 294 | Split-Squat Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 295 | Explosive Step-Up | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 296 | Heavy Sled Push | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 297 | Backward Sled Drag | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 298 | Sled Sprint | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 351 | Cable Belt Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 352 | Cable Goblet Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 353 | Cable Front Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 354 | Cable Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 355 | Cable Good Morning | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 356 | Cable Single-Leg Deadlift | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 357 | Cable Step-Up | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 358 | Cable Lateral Step-Up | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 359 | Cable Skater Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 360 | Cable Hip Thrust | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 361 | Cable Quadruped Hip Extension | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 362 | Cable Donkey Kick | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 371 | Cable Reverse Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 372 | Cable Lateral Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 373 | Cable Crossover Step Lunge | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 374 | Cable Forward March | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 385 | Landmine Full Contact Twist | Trains gluteus maximus, internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 387 | Kettlebell Clean | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 388 | Kettlebell Snatch | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 389 | Kettlebell Clean and Press | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 390 | Turkish Get-Up | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 391 | Lateral Goblet Squat | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 392 | Skater Bound | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 393 | Single-Leg Box Jump | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 394 | Depth Drop to Stick | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 395 | Drop Landing | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 398 | Sled March | Trains gluteus maximus, a prime mover in Overhand throwing; not specific to the movement. |
| 234 | Toes-to-Bar | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 271 | Medicine-Ball Chest Pass | Trains internal oblique, external oblique and pectoralis major, prime movers in Overhand throwing; not specific to the movement. |
| 273 | Medicine-Ball Overhead Slam | Trains internal oblique, external oblique and pectoralis major, prime movers in Overhand throwing; not specific to the movement. |
| 281 | Kneeling Medicine-Ball Chest Pass | Trains internal oblique, external oblique and pectoralis major, prime movers in Overhand throwing; not specific to the movement. |
| 284 | Medicine-Ball Sprawl-to-Slam | Trains internal oblique, external oblique and pectoralis major, prime movers in Overhand throwing; not specific to the movement. |
| 285 | Medicine-Ball Slam-to-Sprint | Trains internal oblique, external oblique and pectoralis major, prime movers in Overhand throwing; not specific to the movement. |
| 310 | Cable Press-Out | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 376 | Cable Dead Bug | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 377 | Cable Reverse Chop | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 378 | Cable Horizontal Chop | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 379 | Cable Rotational Row | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 380 | Cable Anti-Rotation Walkout | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 397 | Side Plank Hip Adduction | Trains internal oblique and external oblique, prime movers in Overhand throwing; not specific to the movement. |
| 1 | Barbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 2 | Incline Barbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 3 | Decline Barbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 4 | Dumbbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 5 | Incline Dumbbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 6 | Decline Dumbbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 7 | Dumbbell Floor Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 8 | Dumbbell Squeeze Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 9 | Alternating Dumbbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 10 | Single-Arm Dumbbell Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 11 | Machine Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 12 | Incline Machine Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 13 | Plate-Loaded Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 14 | Smith Machine Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 15 | Smith Machine Incline Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 16 | Cable Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 17 | Single-Arm Cable Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 18 | Cable Fly | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 19 | Low-to-High Cable Fly | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 20 | High-to-Low Cable Fly | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 21 | Pec Deck Fly | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 22 | Dumbbell Fly | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 23 | Incline Dumbbell Fly | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 25 | Plate Squeeze Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 26 | Standard Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 27 | Wide-Grip Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 28 | Diamond Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 29 | Decline Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 30 | Incline Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 31 | Archer Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 32 | Plyometric Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 33 | Clap Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 34 | Explosive Depth Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 35 | Deficit Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 36 | Ring Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 37 | Weighted Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 38 | Spiderman Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 39 | Typewriter Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 40 | Parallel-Bar Dip | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 105 | Arnold Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 110 | Push Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 146 | Close-Grip Bench Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 147 | JM Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 158 | Bench Dip | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 159 | Ring Dip | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 223 | Leg-Press Calf Raise | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 249 | Pallof Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 254 | Landmine Push Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 255 | Landmine Squat-to-Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 267 | Landmine Anti-Rotation Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 269 | Landmine Clean and Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 272 | Explosive Medicine-Ball Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 301 | Cable Press Around | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 302 | Split-Stance Cable Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 303 | Half-Kneeling Cable Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 304 | Cable Squeeze Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 307 | Neutral-Grip Cable Chest Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 308 | Single-Arm Cable Floor Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 309 | Cable Resisted Push-Up | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 311 | Single-Arm Cable Fly | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 321 | Cable 90/90 Internal Rotation | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 325 | Cable Front-Foot-Elevated Press | Trains pectoralis major, a prime mover in Overhand throwing; not specific to the movement. |
| 315 | Cable Y Raise | Trains subscapularis, a prime mover in Overhand throwing; not specific to the movement. |
| 319 | Cable Cuban Rotation | Trains subscapularis, a prime mover in Overhand throwing; not specific to the movement. |
| 320 | Cable 90/90 External Rotation | Trains subscapularis, a prime mover in Overhand throwing; not specific to the movement. |

</details>

## Coverage across all movements

425 sport movements. 386 have at least one movement-specific match; 14 have an enriched record that names nothing in the catalog; 25 have no enriched record. The last two show "Movement-specific matches aren't available yet".

| Sport | Movements | With movement-specific matches | Record names nothing in the catalog | No enriched record |
|---|---:|---:|---:|---:|
| Wrestling | 22 | 20 | 0 | 2 |
| American football | 21 | 20 | 0 | 1 |
| Basketball | 21 | 18 | 2 | 1 |
| Soccer | 21 | 20 | 0 | 1 |
| Baseball | 21 | 20 | 0 | 1 |
| Track & field | 21 | 20 | 0 | 1 |
| Swimming | 21 | 20 | 0 | 1 |
| Tennis | 21 | 20 | 0 | 1 |
| Volleyball | 22 | 18 | 2 | 2 |
| Boxing | 22 | 20 | 0 | 2 |
| MMA | 21 | 18 | 2 | 1 |
| Brazilian jiu-jitsu | 22 | 20 | 0 | 2 |
| Ice hockey | 23 | 20 | 0 | 3 |
| Lacrosse | 21 | 20 | 0 | 1 |
| Rugby | 21 | 17 | 3 | 1 |
| Golf | 21 | 20 | 0 | 1 |
| Gymnastics | 20 | 18 | 2 | 0 |
| Rowing | 21 | 20 | 0 | 1 |
| Skiing | 21 | 18 | 2 | 1 |
| Olympic weightlifting | 21 | 19 | 1 | 1 |

Movement-specific matches per movement that has any: median 4, range 1 to 36.

Record names nothing in the catalog:

- Basketball · Dunk takeoff (`basketball-8`): "countermovement jump", "trap-bar jump", "bounding"
- Basketball · Drive initiation (`basketball-12`): "sled acceleration", "split-stance jump", "resisted march"
- Volleyball · Roll recovery (`volleyball-11`): "Technical floor rolls", "Turkish get-up segments", "Half-kneeling-to-stand drills", "Bear-crawl transitions"
- Volleyball · Low defensive stance (`volleyball-12`): "Squat holds", "Split-stance holds", "Lateral-resistance stance work", "Goblet squat holds"
- MMA · Cross (`mma-2`): "split-stance cable punch", "landmine rotational press", "medicine-ball rotational throw", "cable chop"
- MMA · Hook (`mma-3`): "landmine rotational press", "cable rotational punch", "medicine-ball rotational throw", "split-stance cable press"
- Rugby · Tackle absorption (`rugby-6`): "split squat isometric", "loaded carry", "reverse sled drag", "landing-stick drill"
- Rugby · Lineout jump (`rugby-10`): "countermovement jump", "trap-bar jump", "loaded jump", "landing-stick drill"
- Rugby · Jumping catch (`rugby-16`): "countermovement jump", "medicine-ball catch", "loaded jump", "landing-stick drill"
- Gymnastics · V-sit (`gymnastics-10`): "L-sit hold", "seated leg lift", "compression lift", "parallel-bar support hold"
- Gymnastics · Press-to-handstand (`gymnastics-15`): "pike press", "seated leg lift", "wall handstand hold", "negative handstand press"
- Skiing · Mogul absorption (`skiing-7`): "step-downs", "split-squat isometrics", "snap-downs", "loaded carries"
- Skiing · Downhill stabilization (`skiing-16`): "isometric squat holds", "split-squat isometrics", "single-leg balance", "suitcase carries"
- Olympic weightlifting · Second pull (`olympic-weightlifting-2`): "clean pull", "snatch pull", "hang clean", "jump shrug"

No enriched record:

- Wrestling · Gut-wrench turn (`wrestling-21`)
- Wrestling · Upper-body throw / hip-toss pattern (`wrestling-22`)
- American football · Contact and displacement (`american-football-21`)
- Basketball · Stop, decelerate, and pivot (`basketball-21`)
- Soccer · Kicking support-leg and pelvic transfer (`soccer-21`)
- Baseball · Whole-body batting sequence (`baseball-21`)
- Track & field · Jump-event approach, takeoff, flight, and landing (`track-and-field-21`)
- Swimming · Start, turn, and underwater transition (`swimming-21`)
- Tennis · Split-step and first-step court movement (`tennis-21`)
- Volleyball · Reactive readiness step (`volleyball-21`)
- Volleyball · Approach jump, aerial action, and landing sequence (`volleyball-22`)
- Boxing · Angle step / cut-off step (`boxing-21`)
- Boxing · Lead-straight initiation and sequential acceleration-braking (`boxing-22`)
- MMA · Grappling transition and positional control (`mma-21`)
- Brazilian jiu-jitsu · Standing clinch and takedown-defense cycle (`brazilian-jiu-jitsu-21`)
- Brazilian jiu-jitsu · Guard-passing, sweep, and positional-stabilization transition (`brazilian-jiu-jitsu-22`)
- Ice hockey · Goalie shuffle / T-push transition (`ice-hockey-21`)
- Ice hockey · Explosive skating acceleration (`ice-hockey-22`)
- Ice hockey · Outside-skate ninety-degree turn and re-acceleration (`ice-hockey-23`)
- Lacrosse · Shooting on the run and under defensive constraint (`lacrosse-21`)
- Rugby · Ruck, maul, and contact transition (`rugby-21`)
- Golf · On-course walking, bending, and setup transitions (`golf-21`)
- Rowing · Sweep versus scull stroke organization (`rowing-21`)
- Skiing · Terrain adaptation and turn transition (`skiing-21`)
- Olympic weightlifting · Under-bar receipt and fixation (`olympic-weightlifting-21`)

## Named exercises that resolve to nothing

208 distinct phrases (after normalizing) that movement records name and no catalog exercise contains. They are listed for the owner to review: each is either an exercise the catalog lacks, or a name the catalog writes differently that could earn an entry in the synonym list. The last column lists catalog names that contain every word of the phrase (words of three letters or more). It is a review aid only; these exercises are **not** matched.

| Phrase (as first written) | Movements | Movement ids | Catalog names containing every word (not matched) |
|---|---:|---|---|
| medicine-ball rotational throw | 57 | american-football-16, soccer-10, soccer-19, baseball-1, baseball-2, baseball-4 and 51 more | Medicine-Ball Rotational Wall Throw (276) |
| suitcase carry | 27 | wrestling-3, wrestling-14, wrestling-16, wrestling-18, wrestling-20, american-football-9 and 21 more |  |
| cable chop | 21 | wrestling-10, baseball-1, swimming-4, swimming-14, swimming-17, volleyball-4 and 15 more | Cable Wood Chop (250); Cable Reverse Chop (377); Cable Horizontal Chop (378) |
| single-leg squat-to-stick | 17 | american-football-5, american-football-9, american-football-11, american-football-12, american-football-13, american-football-18 and 11 more |  |
| front plank | 16 | american-football-7, soccer-12, soccer-13, soccer-20, track-and-field-6, track-and-field-11 and 10 more |  |
| countermovement jump | 15 | american-football-14, basketball-6, basketball-8, baseball-12, track-and-field-10, volleyball-1 and 9 more |  |
| split-squat isometric | 15 | basketball-10, basketball-15, basketball-17, soccer-15, baseball-10, baseball-14 and 9 more |  |
| bear-hug carry | 12 | wrestling-2, wrestling-11, wrestling-12, american-football-10, american-football-20, mma-6 and 6 more |  |
| cable rotation | 11 | soccer-6, soccer-7, soccer-8, soccer-9, soccer-10, soccer-17 and 5 more | Cable Cuban Rotation (319); Cable 90/90 External Rotation (320); Cable 90/90 Internal Rotation (321); Cable Anti-Rotation Walkout (380) |
| resisted sprint | 11 | american-football-1, american-football-6, american-football-13, american-football-19, volleyball-19, lacrosse-7 and 5 more |  |
| single-leg balance | 10 | basketball-11, baseball-16, baseball-18, boxing-8, boxing-10, boxing-13 and 4 more |  |
| chest-supported row | 9 | wrestling-15, wrestling-16, swimming-7, golf-4, golf-12, rowing-4 and 3 more | Chest-Supported Dumbbell Row (47); Chest-Supported T-Bar Row (51); Chest-Supported Cable Row (330); Chest-Supported Landmine Row (383) |
| clean pull | 9 | mma-12, olympic-weightlifting-1, olympic-weightlifting-2, olympic-weightlifting-3, olympic-weightlifting-4, olympic-weightlifting-6 and 3 more |  |
| cable lift | 8 | wrestling-20, baseball-4, baseball-17, volleyball-18, boxing-5, boxing-6 and 2 more |  |
| overhead carry | 8 | american-football-17, swimming-11, swimming-15, swimming-18, volleyball-16, boxing-12 and 2 more |  |
| overhead squat | 8 | olympic-weightlifting-5, olympic-weightlifting-7, olympic-weightlifting-8, olympic-weightlifting-9, olympic-weightlifting-11, olympic-weightlifting-13 and 2 more |  |
| single-leg squat | 8 | american-football-3, american-football-4, basketball-3, soccer-18, ice-hockey-2, ice-hockey-4 and 2 more |  |
| snap-down | 8 | american-football-12, volleyball-15, lacrosse-19, lacrosse-20, gymnastics-16, gymnastics-18 and 2 more |  |
| step-down | 8 | soccer-5, soccer-18, ice-hockey-6, ice-hockey-7, golf-6, golf-20 and 2 more |  |
| serratus wall slide | 7 | swimming-11, swimming-18, swimming-20, volleyball-3, volleyball-7, volleyball-16 and 1 more |  |
| snatch pull | 7 | olympic-weightlifting-2, olympic-weightlifting-3, olympic-weightlifting-5, olympic-weightlifting-8, olympic-weightlifting-9, olympic-weightlifting-11 and 1 more |  |
| split-stance cable press | 7 | basketball-11, baseball-1, baseball-2, baseball-13, baseball-15, tennis-2 and 1 more | Split-Stance Cable Chest Press (302) |
| trap-bar deadlift | 7 | wrestling-2, wrestling-11, wrestling-12, brazilian-jiu-jitsu-13, lacrosse-11, rowing-16 and 1 more |  |
| reverse sled drag | 6 | soccer-16, lacrosse-14, rugby-3, rugby-6, rugby-19, skiing-18 |  |
| single-arm cable press | 6 | american-football-15, american-football-16, american-football-17, ice-hockey-9, ice-hockey-10, ice-hockey-13 | Single-Arm Cable Chest Press (17); Single-Arm Cable Floor Press (308) |
| trap bar jump | 6 | american-football-6, american-football-14, basketball-8, basketball-9, swimming-15, rugby-10 |  |
| crossover step-up | 5 | american-football-5, american-football-18, basketball-3, basketball-20, volleyball-9 | Cable Crossover Step Lunge (373) |
| hang clean | 5 | olympic-weightlifting-2, olympic-weightlifting-4, olympic-weightlifting-6, olympic-weightlifting-7, olympic-weightlifting-10 |  |
| jerk drive | 5 | olympic-weightlifting-14, olympic-weightlifting-15, olympic-weightlifting-16, olympic-weightlifting-17, olympic-weightlifting-18 |  |
| lateral sled drag | 5 | american-football-4, basketball-2, basketball-20, boxing-13, lacrosse-13 |  |
| medicine-ball overhead throw | 5 | basketball-18, soccer-20, track-and-field-17, volleyball-4, volleyball-5 | Medicine-Ball Overhead Backward Throw (279); Medicine-Ball Forward Overhead Throw (280) |
| neutral-grip row | 5 | brazilian-jiu-jitsu-9, brazilian-jiu-jitsu-10, brazilian-jiu-jitsu-13, brazilian-jiu-jitsu-18, brazilian-jiu-jitsu-19 |  |
| bear crawl | 4 | baseball-10, baseball-11, mma-20, rugby-17 |  |
| flying sprint | 4 | track-and-field-3, track-and-field-4, track-and-field-11, track-and-field-16 |  |
| hang snatch | 4 | olympic-weightlifting-5, olympic-weightlifting-8, olympic-weightlifting-9, olympic-weightlifting-11 |  |
| lateral squat | 4 | swimming-8, boxing-9, boxing-18, lacrosse-13 | Lateral Goblet Squat (391) |
| loaded jumps | 4 | rugby-2, rugby-10, rugby-16, skiing-8 |  |
| push jerk | 4 | olympic-weightlifting-14, olympic-weightlifting-15, olympic-weightlifting-16, olympic-weightlifting-18 |  |
| ring support hold | 4 | gymnastics-5, gymnastics-6, gymnastics-7, gymnastics-8 |  |
| towel hang | 4 | brazilian-jiu-jitsu-9, brazilian-jiu-jitsu-19, ice-hockey-15, ice-hockey-16 | Towel Dead Hang (144) |
| controlled step-downs | 3 | skiing-6, skiing-9, skiing-18 |  |
| Deceleration lunge | 3 | lacrosse-7, lacrosse-9, lacrosse-20 |  |
| half-kneeling cable press | 3 | wrestling-9, track-and-field-13, brazilian-jiu-jitsu-3 | Half-Kneeling Cable Chest Press (303) |
| hip airplanes | 3 | skiing-3, skiing-5, skiing-19 |  |
| landing-stick drill | 3 | rugby-6, rugby-10, rugby-16 |  |
| landmine rotational press | 3 | mma-2, mma-3, mma-4 |  |
| lateral sled push | 3 | ice-hockey-1, ice-hockey-18, ice-hockey-20 |  |
| Loaded carry | 3 | lacrosse-11, rugby-6, skiing-7 |  |
| one-arm cable press | 3 | boxing-11, boxing-19, rugby-12 |  |
| seated leg lift | 3 | gymnastics-9, gymnastics-10, gymnastics-15 |  |
| single-arm press | 3 | wrestling-7, wrestling-8, wrestling-10 | Single-Arm Dumbbell Bench Press (10); Single-Arm Cable Chest Press (17); Single-Arm Dumbbell Overhead Press (108); Single-Arm Standing Landmine Press (253) |
| split-squat isometric hold | 3 | ice-hockey-12, ice-hockey-15, ice-hockey-17 |  |
| wall handstand hold | 3 | gymnastics-1, gymnastics-2, gymnastics-15 |  |
| adductor ball squeeze | 2 | brazilian-jiu-jitsu-5, brazilian-jiu-jitsu-8 |  |
| approach jump | 2 | basketball-7, volleyball-5 |  |
| assisted pull-up | 2 | swimming-2, swimming-5 |  |
| band internal rotation | 2 | swimming-19, boxing-11 |  |
| Bear-crawl transitions | 2 | volleyball-10, volleyball-11 |  |
| belt-squat hold | 2 | basketball-10, rugby-9 |  |
| body-wave drill | 2 | swimming-10, swimming-16 |  |
| cable knee drive | 2 | mma-5, mma-6 | Cable Standing Knee Drive (375) |
| cable punch | 2 | boxing-1, skiing-11 | Cable Serratus Punch (322); Cable Standing Punch (323) |
| compression lift | 2 | gymnastics-9, gymnastics-10 |  |
| Deceleration runs | 2 | volleyball-9, volleyball-15 |  |
| external-rotation cable work | 2 | baseball-3, baseball-19 |  |
| front-loaded carry | 2 | brazilian-jiu-jitsu-14, skiing-14 |  |
| Goblet squat holds | 2 | volleyball-6, volleyball-12 |  |
| Half-kneeling cable lift | 2 | golf-1, golf-16 |  |
| half-kneeling cable pulldown | 2 | swimming-1, swimming-2 |  |
| half-kneeling cable punch | 2 | mma-7, mma-16 |  |
| half-kneeling get-up | 2 | ice-hockey-19, ice-hockey-20 |  |
| Hang power cleans | 2 | volleyball-1, volleyball-14 |  |
| hip flexor raise | 2 | swimming-3, swimming-6 |  |
| hurdle jump | 2 | gymnastics-18, gymnastics-19 |  |
| hurdle mobility drill | 2 | track-and-field-7, track-and-field-20 |  |
| incline treadmill work | 2 | skiing-13, skiing-15 |  |
| isometric squat holds | 2 | skiing-6, skiing-16 |  |
| jump shrug | 2 | olympic-weightlifting-2, olympic-weightlifting-3 |  |
| Lateral-resistance stance work | 2 | volleyball-12, volleyball-20 |  |
| Loaded jump squats | 2 | volleyball-1, volleyball-14 |  |
| Medicine-ball catch | 2 | lacrosse-5, rugby-16 |  |
| medicine-ball scoop throws | 2 | boxing-5, boxing-7 |  |
| Medicine-ball throws | 2 | volleyball-17, lacrosse-19 | Medicine-Ball Side Throw (275); Medicine-Ball Rotational Wall Throw (276); Medicine-Ball Shot-Put Throw (278); Medicine-Ball Overhead Backward Throw (279) |
| parallel-bar support hold | 2 | gymnastics-9, gymnastics-10 |  |
| pike push-up | 2 | gymnastics-1, gymnastics-2 |  |
| resisted march | 2 | basketball-1, basketball-12 |  |
| rotational split squat | 2 | basketball-13, soccer-17 |  |
| Rower intervals | 2 | rowing-17, rowing-19 |  |
| sandbag load | 2 | wrestling-11, wrestling-12 |  |
| scapular push-up | 2 | gymnastics-1, gymnastics-3 |  |
| side plank rotation | 2 | swimming-4, swimming-17 |  |
| single-arm farmer carry | 2 | brazilian-jiu-jitsu-3, brazilian-jiu-jitsu-13 |  |
| single-leg balance reach | 2 | basketball-14, mma-5 |  |
| single-leg bound | 2 | basketball-7, volleyball-13 |  |
| slow-tempo split squats | 2 | skiing-6, skiing-18 |  |
| split-stance jump | 2 | basketball-12, volleyball-19 |  |
| split-stance rotational strength | 2 | skiing-10, skiing-20 |  |
| split-stance row | 2 | mma-8, mma-9 |  |
| step-up jump | 2 | baseball-13, volleyball-13 |  |
| straight-leg raise | 2 | swimming-3, swimming-6 |  |
| towel-grip row | 2 | mma-19, lacrosse-10 |  |
| adductor slide | 1 | swimming-8 |  |
| air-bike | 1 | rowing-19 |  |
| air-bike intervals | 1 | rowing-17 |  |
| alternating split-stance drives | 1 | skiing-15 |  |
| anti-rotation hold | 1 | mma-17 |  |
| arch-body hold | 1 | gymnastics-17 |  |
| back lever tuck hold | 1 | gymnastics-5 |  |
| backpedal-to-sprint | 1 | basketball-16 |  |
| backward shuffle | 1 | rugby-19 |  |
| band-resisted shuffle | 1 | american-football-4 |  |
| Band-resisted shuffle intervals | 1 | volleyball-8 |  |
| banded hand-fighting | 1 | mma-17 |  |
| banded hip rotation | 1 | brazilian-jiu-jitsu-4 |  |
| bear-hug hold | 1 | mma-19 |  |
| bird dog | 1 | gymnastics-12 |  |
| bounding | 1 | basketball-8 |  |
| broad jump and stick | 1 | mma-10 |  |
| Cable external rotation | 1 | golf-4 | Cable 90/90 External Rotation (320) |
| cable hip rotation | 1 | mma-4 |  |
| cable internal rotation | 1 | swimming-19 | Cable 90/90 Internal Rotation (321) |
| Cable-resisted anti-rotation | 1 | volleyball-6 |  |
| cable rotational punch | 1 | mma-3 |  |
| calf raise isometric | 1 | brazilian-jiu-jitsu-18 |  |
| chest-to-bar pull-up | 1 | gymnastics-6 |  |
| controlled cable row eccentric | 1 | rowing-6 |  |
| controlled seated cable row | 1 | rowing-20 |  |
| Controlled sprawls | 1 | volleyball-10 |  |
| Copenhagen-style adductor work | 1 | skiing-5 |  |
| Crossover bound | 1 | lacrosse-8 |  |
| curve sprint | 1 | american-football-9 |  |
| curved sprint | 1 | baseball-9 |  |
| deceleration drill | 1 | rugby-20 |  |
| deceleration steps | 1 | skiing-17 |  |
| Dowel hip hinge | 1 | rowing-13 |  |
| Eccentric hamstring curl | 1 | lacrosse-20 |  |
| eccentric pull-up | 1 | gymnastics-14 |  |
| Eccentric row | 1 | lacrosse-5 |  |
| Eccentric squat | 1 | lacrosse-14 |  |
| fly sprint | 1 | american-football-2 |  |
| front lever tuck hold | 1 | gymnastics-4 |  |
| front-rack carry | 1 | basketball-17 |  |
| front-rack hold | 1 | mma-16 |  |
| Half-kneeling cable hold | 1 | golf-9 |  |
| half-kneeling cable row | 1 | wrestling-16 |  |
| half-kneeling press | 1 | mma-13 | Half-Kneeling Landmine Press (252); Half-Kneeling Cable Chest Press (303) |
| Half-kneeling-to-stand drills | 1 | volleyball-11 |  |
| handstand snap-down | 1 | gymnastics-19 |  |
| hip switch | 1 | mma-14 |  |
| hollow rock | 1 | gymnastics-11 |  |
| isometric calf raise | 1 | track-and-field-4 |  |
| isometric chest fly | 1 | gymnastics-8 |  |
| jump-and-stick | 1 | basketball-9 |  |
| L-sit hold | 1 | gymnastics-10 |  |
| land-and-stick drills | 1 | skiing-10 |  |
| landing drill | 1 | soccer-11 |  |
| landmine punch | 1 | mma-1 |  |
| lateral bear crawl | 1 | mma-15 |  |
| lateral-loaded carry | 1 | brazilian-jiu-jitsu-16 |  |
| lateral shuffle | 1 | mma-20 |  |
| lateral shuffle-to-stick drills | 1 | skiing-17 |  |
| lateral step-down | 1 | track-and-field-7 |  |
| medicine-ball chest press | 1 | swimming-14 |  |
| Medicine-ball chest-to-overhead passes | 1 | volleyball-7 |  |
| medicine-ball pullover | 1 | swimming-9 |  |
| Multidirectional shuttle drills | 1 | volleyball-20 |  |
| negative handstand press | 1 | gymnastics-15 |  |
| one-arm dumbbell row | 1 | rowing-4 |  |
| pike press | 1 | gymnastics-15 |  |
| planche lean | 1 | gymnastics-3 |  |
| pseudo-planche push-up | 1 | gymnastics-3 |  |
| push-up-plus | 1 | swimming-18 |  |
| reaction-step drill | 1 | baseball-8 |  |
| rotational sandbag lift | 1 | mma-11 |  |
| Rower steady-state | 1 | rowing-19 |  |
| sandbag bear-hug carry | 1 | rugby-8 |  |
| sandbag carry | 1 | brazilian-jiu-jitsu-16 |  |
| Sandbag clean | 1 | golf-17 |  |
| sandbag lift | 1 | rugby-11 |  |
| sandbag shouldering | 1 | mma-12 |  |
| scapular depression | 1 | gymnastics-8 |  |
| Short shuttle starts | 1 | volleyball-19 |  |
| single-arm row | 1 | wrestling-13 | Single-Arm Cable Row (56); Cable Single-Arm Bent-Over Row (329) |
| single-leg deceleration | 1 | skiing-3 |  |
| sit-to-stand | 1 | mma-13 |  |
| sled acceleration | 1 | basketball-12 |  |
| split-stance cable punch | 1 | mma-2 |  |
| Split-stance deadlift | 1 | lacrosse-12 |  |
| split-stance drives | 1 | skiing-8 |  |
| Split-stance holds | 1 | volleyball-12 |  |
| Split-stance isometric holds | 1 | volleyball-6 |  |
| split-stance leg press | 1 | swimming-12 |  |
| Split-stance reaches | 1 | volleyball-10 |  |
| split-stance rotational lift | 1 | mma-12 |  |
| sprawl-to-stand | 1 | rugby-17 |  |
| sprawled plank hold | 1 | mma-10 |  |
| sprint-to-stop | 1 | basketball-15 |  |
| Squat holds | 1 | volleyball-12 |  |
| squat snatch | 1 | olympic-weightlifting-13 |  |
| step-behind lunge | 1 | basketball-13 |  |
| straight-bar dip | 1 | gymnastics-6 |  |
| superman hold | 1 | gymnastics-12 |  |
| Technical floor rolls | 1 | volleyball-11 |  |
| technical get-up | 1 | rugby-17 |  |
| thoracic rotation | 1 | brazilian-jiu-jitsu-20 |  |
| tuck roll | 1 | swimming-13 |  |
| Turkish get-up segments | 1 | volleyball-11 |  |
| Unilateral row | 1 | lacrosse-6 |  |

## Reference lists

### Same-exercise synonyms

| Record phrase | Catalog name | Why it is the same exercise | Catalog exercises it reaches |
|---|---|---|---|
| rear-foot-elevated split squat | Bulgarian split squat | A Bulgarian split squat is the split squat with the rear foot raised on a bench; the two names describe one exercise. | Bulgarian Split Squat (173) |
| farmer carry | farmer's walk | Farmer's carry and farmer's walk are two names for one exercise: a heavy weight in each hand, walked for distance. | Farmer’s Walk (299) |
| one-arm cable row | single-arm cable row | One-arm and single-arm mean the same thing; it is one unilateral cable row. | Single-Arm Cable Row (56) |
| single-leg RDL | single-leg Romanian deadlift | RDL is the standard abbreviation of Romanian deadlift. | Single-Leg Romanian Deadlift (188); Landmine Single-Leg Romanian Deadlift (264) |
| cable woodchop | cable wood chop | Woodchop and wood chop are one word written two ways. | Cable Wood Chop (250) |
| neutral-grip pulldown | neutral-grip lat pulldown | A pulldown is the lat pulldown; the catalog writes the muscle into the name. | Neutral-Grip Lat Pulldown (59) |
| barbell back squat | back squat | The back squat is a barbell lift; the catalog leaves the barbell implied. | Back Squat (161); High-Bar Back Squat (162) |

### Not the same exercise

Catalog exercises whose name contains a phrase a record names but which are a different exercise. The name rule skips these pairs; the exercise can still be related pattern or muscle support on its own data.

| Record phrase | Catalog exercise | Why it is a different exercise | Records naming the phrase |
|---|---|---|---:|
| leg press | Leg-Press Calf Raise (223) | A leg-press calf raise is a calf raise done on the leg-press machine with the knees held straight; it is not the leg press. | 3 |
| row | Cable Upright Row (317) | An upright row pulls the bar up the front of the body to the chest for the shoulders and traps; a row pulls toward the trunk. | 5 |
| push-up | Handstand Push-Up (120) | A handstand push-up is an overhead press done upside down, a vertical push, not the horizontal push-up. | 7 |
| split squat | Split-Squat Jump (294) | A split-squat jump is a plyometric jump from the split stance, not the loaded split squat. | 100 |
| cable press | Cable Press-Out (310) | A cable press-out is an anti-rotation press for the trunk, like the Pallof press, not a cable chest or shoulder press. | 7 |
| plank | Side Plank Hip Adduction (397) | A side plank with hip adduction works the adductors from a side plank, in the manner of a Copenhagen plank; it is not the plank named. | 1 |

### Broad patterns

| Catalog pattern | Exercises |
|---|---:|
| Horizontal push | 64 |
| Horizontal pull | 31 |
| Vertical pull | 26 |
| Elbow flexion | 25 |
| Trunk flexion / anti-extension | 19 |
| Squat / knee dominant | 19 |
| Elbow extension | 18 |

The next largest pattern is "Hip hinge" (15), "Scapular control" (13), "Rotation" (13).

## Deficiencies noticed

Recorded, not fixed: this correction does not edit the catalog or the movement records.

### Catalog: duplicate names

- "Dumbbell Pullover" appears 2 times: id 24 (Chest & push, Vertical pull) and id 65 (Back & pull, Vertical pull). Both copies are matched, so a movement that names it lists it twice.
- "Romanian Deadlift" appears 2 times: id 42 (Back & pull, Hip hinge) and id 186 (Posterior chain, Hip hinge). Both copies are matched, so a movement that names it lists it twice.

### Catalog: tags that do not fit the exercise

The tiers read `movement` (pattern) and `primaryMuscles`, so these change results.

- Pallof Press (249): an anti-rotation core exercise, tagged primary chest and the Horizontal push pattern.
- Leg-Press Calf Raise (223): a calf exercise, tagged primary chest and the Horizontal push pattern.
- Landmine Anti-Rotation Press (267): an anti-rotation press, tagged primary chest and the Horizontal push pattern.
- Arnold Press (105): an overhead press, tagged primary chest and the Horizontal push pattern.
- Push Press (110): an overhead press, tagged primary chest and the Horizontal push pattern.
- Single-Leg Leg Extension (172): a knee extension, tagged primary glutes (Leg Extension, 171, is quads only).
- Hanging Knee Raise (232): tagged Grip isometric while Hanging Leg Raise (231) is Trunk flexion / anti-extension.
- Half-Kneeling Rotational Throw (282): a medicine-ball throw, tagged Free weights equipment.
- The landmine presses are split across patterns: Horizontal push (251, 252, 253) and Diagonal push (381, 382). Diagonal push is not broad, so only the second group relates other exercises (cable incline presses, flys and punches for overhand throwing).
- Barbell Hip Thrust (206) and Back Squat (161) carry the "unilateral" quality. Qualities are copied across catalog groups and are not used by the tiers.

### Movement records

- skiing-1: the movement is "downhill squat stance" but its enriched record is labelled "carving turn". The tiers use the record and show the movement's label, so they may describe a different action.
- skiing-2: the movement is "carving turn" but its enriched record is labelled "parallel turn". The tiers use the record and show the movement's label, so they may describe a different action.
- 25 movements have no enriched record (listed under coverage).
- 183 records keep a separate `recommendedExercisePatterns` list of pattern descriptions ("Hip-hinge power", "Sprint exposure"); the other 217 repeat `recommendedExercises` there. Only `recommendedExercises`, the named exercises, are matched.
- Prime-mover entries the shared muscle list maps to no catalog muscle key, so they cannot relate any exercise (some are joint actions, some are muscles the catalog has no key for): "teres major" (9), "knee extension" (2), "ankle plantarflexion" (2), "deep hip rotators" (2), "deep hip rotator muscles", "hip rotation/flexion", "ankle stabilization", "hip extension/flexion and rotation", "hip/knee extension", "cervical flexion/extension control", "sartorius", "quadratus lumborum".
- Prime-mover keys that no catalog exercise has as a primary muscle, so they never relate an exercise: `lowerBack` (a prime mover in 20 movements). Bridge's erector spinae is one: it maps to `lowerBack`, which the catalog only ever tags as a secondary muscle.

### Phrases the name rule stretches

A phrase matches every catalog name that contains it as whole words, so short or generic phrases reach variants the record may not mean. Phrases reaching five or more exercises (after the Not the same exercise list):

- "row" (5 movements) reaches 29: Barbell Bent-Over Row; Pendlay Row; Underhand Barbell Row; Dumbbell Row; Chest-Supported Dumbbell Row; Seal Row; Meadows Row; T-Bar Row; Chest-Supported T-Bar Row; Machine High Row; Machine Low Row; Seated Cable Row; Wide-Grip Cable Row; Single-Arm Cable Row; Inverted Row; Feet-Elevated Inverted Row; Ring Row; Landmine Row; Meadows Landmine Row; Landmine T-Bar Row; Cable Rear-Delt Row; Cable Single-Arm Bent-Over Row; Chest-Supported Cable Row; Low Cable Row; Rope Cable Row; Cable High Row; Cable Rotational Row; Chest-Supported Landmine Row; Offset Landmine Row.
- "push-up" (7 movements) reaches 16: Standard Push-Up; Wide-Grip Push-Up; Diamond Push-Up; Decline Push-Up; Incline Push-Up; Archer Push-Up; Plyometric Push-Up; Clap Push-Up; Explosive Depth Push-Up; Deficit Push-Up; Ring Push-Up; Weighted Push-Up; Spiderman Push-Up; Typewriter Push-Up; Explosive Medicine-Ball Push-Up; Cable Resisted Push-Up.
- "deadlifts" (3 movements) reaches 11: Conventional Deadlift; Romanian Deadlift; Romanian Deadlift; Stiff-Leg Deadlift; Single-Leg Romanian Deadlift; Dumbbell Romanian Deadlift; B-Stance Romanian Deadlift; Landmine Romanian Deadlift; Landmine Single-Leg Romanian Deadlift; Cable Deadlift; Cable Single-Leg Deadlift.
- "bench press" (2 movements) reaches 10: Barbell Bench Press; Incline Barbell Bench Press; Decline Barbell Bench Press; Dumbbell Bench Press; Incline Dumbbell Bench Press; Decline Dumbbell Bench Press; Alternating Dumbbell Bench Press; Single-Arm Dumbbell Bench Press; Smith Machine Bench Press; Close-Grip Bench Press.
- "pull-up" (3 movements) reaches 9: Pull-Up; Neutral-Grip Pull-Up; Wide-Grip Pull-Up; Weighted Pull-Up; Commando Pull-Up; Archer Pull-Up; L-Sit Pull-Up; Towel Pull-Up; Scapular Pull-Up.
- "Romanian deadlift" (28 movements) reaches 7: Romanian Deadlift; Romanian Deadlift; Single-Leg Romanian Deadlift; Dumbbell Romanian Deadlift; B-Stance Romanian Deadlift; Landmine Romanian Deadlift; Landmine Single-Leg Romanian Deadlift.
- "calf raise" (11 movements) reaches 7: Standing Calf Raise; Seated Calf Raise; Leg-Press Calf Raise; Single-Leg Calf Raise; Donkey Calf Raise; Smith Machine Calf Raise; Cable Calf Raise.
- "lat pulldown" (8 movements) reaches 7: Lat Pulldown; Wide-Grip Lat Pulldown; Neutral-Grip Lat Pulldown; Underhand Lat Pulldown; Single-Arm Lat Pulldown; Kneeling Cable Lat Pulldown; Wide-Grip Cable Lat Pulldown.
- "triceps extension" (3 movements) reaches 7: Overhead Cable Triceps Extension; Dumbbell Overhead Triceps Extension; Single-Arm Dumbbell Triceps Extension; Machine Triceps Extension; Bodyweight Triceps Extension; Cross-Body Cable Triceps Extension; Cable Overhead Triceps Extension.
- "cable row" (18 movements) reaches 6: Seated Cable Row; Wide-Grip Cable Row; Single-Arm Cable Row; Chest-Supported Cable Row; Low Cable Row; Rope Cable Row.
- "landmine press" (26 movements) reaches 5: Landmine Press; Half-Kneeling Landmine Press; Single-Arm Standing Landmine Press; Alternating Landmine Press; Tall-Kneeling Landmine Press.
- "step-up" (8 movements) reaches 5: Step-Up; Peterson Step-Up; Explosive Step-Up; Cable Step-Up; Cable Lateral Step-Up.
- "hip thrust" (17 movements) reaches 5: Barbell Hip Thrust; Smith Machine Hip Thrust; Dumbbell Hip Thrust; Single-Leg Hip Thrust; Cable Hip Thrust.
- "hamstring curl" (5 movements) reaches 5: Nordic Hamstring Curl; Stability-Ball Hamstring Curl; Slider Hamstring Curl; Cable Hamstring Curl; Assisted Nordic Hamstring Curl.

Names containing a phrase that are a different exercise from the one named, and so are skipped by the name rule (Not the same exercise, under Reference lists): "leg press" in Leg-Press Calf Raise; "row" in Cable Upright Row; "push-up" in Handstand Push-Up; "split squat" in Split-Squat Jump; "cable press" in Cable Press-Out; "plank" in Side Plank Hip Adduction.

<!-- generated:end -->
