# Get a rank for an unranked muscle group

**The ask:** someone who wants to see their chest ranking is told which exercise will give them one.

## What it does

- **Where it shows.** Open a muscle group with no rank yet: tap it on the Strength map, or pick it in the group selector. The group's sheet now has a **Get a Chest rank** section.
- **What it lists.** Three lifts that will produce the rank:
  - The familiar one comes first, tagged **Most common**: Barbell Bench Press for chest.
  - Then the best alternatives on other equipment: Cable Fly, Dumbbell Fly.
- **What each row says.**
  - How the lift works the group: "Main mover for chest", or "Helper".
  - What it's compared with: "compared on this exact lift", or "compared through a related lift".
  - Movements scored on reps (pull-ups, dips) add "Log your best set of reps with no added weight."
- **Log it.** One tap closes the sheet and opens Log a lift with that exercise already chosen. Focus lands on the load box, so the next thing is typing the set.
- **More lifts.** If others also rank the group, a line says so ("58 more lifts rank the chest…"); any of them can be searched in the log.
- **Lifts already logged here** are left out of the suggestions. If none of them could be ranked, the section says so first.
- **A comparison group is still needed.**
  - Ranks compare against men or women who lift. If neither is chosen, the "Compare against" question appears in the section, unless a lift on show already asks it.
  - With "Prefer not to say", the existing explanation of why no curve applies is shown.
- **Tibialis anterior.** No lift in the comparison data can rank it, so the section says that rather than suggesting a lift that would leave it unranked.
- **Groups that already have a rank** show no suggestions.

## Why these lifts actually produce a rank

**How a group gets ranked.** A muscle group is ranked from the lifts behind it (`regionRanksFromMuscles`). A lift ranks a group when both are true:
- the database's scorer (`score_strength_profile_v1`, behind `strengthProfile.muscleRanks`) can place it against a comparison group;
- it works one of the group's muscles as a primary or secondary mover. A muscle a lift only steadies is never ranked by it.

**How the list was built.**
- I asked the scorer itself, read-only (it is a STABLE function). Every catalog exercise was scored once, the way the app sends it: loaded movements as a weighted set, bodyweight movements as reps alone.
- The ones that came back with a percentile are the rankable list: **244 of the 400 catalog exercises**, identical for men and women.
- 114 are compared on their own data ("direct") and 130 through a closely related lift's ("related").
- Their working-muscle mappings come from `exercise_muscle_mappings`.

**The snapshot** is `client/src/data/rankableExercises.json`, about 59 KB. To regenerate it after the database changes, run `scripts/strength/rankable-exercises.sql`, then `scripts/strength/rankable-exercises.mjs`.

**Order.** Lifts are ranked by:
1. Main mover before helper.
2. Direct comparison before related.
3. More of the lift's work on this group. This is also what makes a lift count for more in the group's rank.

Then the list is spread across equipment.

**The familiar first picks** are in `familiarRankingLift`. A test checks each one is rankable and a main mover for its group. Two substitutions:
- Standing Calf Raise has no comparison data, so calves start from Seated Calf Raise.
- The catalog has no plain "Barbell Row", so upper back starts from Seated Cable Row.

## Code

| What | Where |
|---|---|
| Rankable list | `client/src/data/rankableExercises.json`, `scripts/strength/rankable-exercises.{sql,mjs}` |
| Suggestion logic | `client/src/lib/rankRecommendations.ts` |
| Section | `client/src/components/RankingLiftSuggestions.tsx`, `client/src/rank-suggestions.css` |
| Sheet wiring and "Log it" opening the log with the exercise chosen | `client/src/components/StrengthGenomePanel.tsx` |

## Checks

**Unit and component tests.**
- `client/src/lib/rankRecommendations.test.ts` (10 tests). It covers:
  - the list's integrity;
  - that every suggestion works the group;
  - the familiar lifts;
  - the tibialis anterior message;
  - excluding lifts already logged;
  - the reps-only wording;
  - the section's rows and Log it.
- Full suite: 3031 passed, typecheck clean.

**Browser** (`probes/rank-suggestions.mjs`, 11/11)
- Headless Chromium against the production build, with viewport emulation only.
- Chest at 390 px, 320 px and 1280 px: Barbell Bench Press first, rows fit, Log it buttons at least 44 px.
- Log it opens the log with Barbell Bench Press chosen and focus on the load box.
- Quadriceps → Back Squat, Lats → Lat Pulldown, Biceps → Barbell Curl.
- Tibialis anterior shows its message.

Screenshots are in `evidence/`.

**Not tested here:** the full loop of logging the suggested lift and seeing the rank appear. The sandbox can't reach the ranking service, so the browser checks run with no ranks returned. The suggestions come from the same scorer that ranking uses, which is what makes the rank appear.
