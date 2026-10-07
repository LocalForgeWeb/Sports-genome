import type { GlossaryEntry } from "@/lib/glossarySearch";
import { trainingTerms } from "@/lib/trainingTerms";

type TermDetails = Omit<GlossaryEntry, "id" | "group" | "term" | "aliases">;

/**
 * Training terms (utility brief §7): what Sports Genome means by the words it uses.
 *
 * Each "inApp" statement was written from the code that implements it, and the file and line
 * references behind every entry are kept in docs/utility-expansion/glossary-evidence.json, with
 * the places where the app uses a term inconsistently (recorded for their owners, not changed
 * here). No entry makes an external scientific claim: the scholarly hosts behind the repo's
 * RPE/RIR source could not be opened from this environment, so meanings are plain terminology
 * and every example is labelled illustrative, never a prescription.
 */
const details: Record<string, TermDetails> = {
  "set": {
    "meaning": "A group of repetitions done in a row, followed by rest before the next group.",
    "example": "Example: '4 × 10/8/6/6' is four sets with a different target for each, and the tracker builds four set rows. (Illustrative.)",
    "inApp": "Everywhere in the app, the number before × in a prescription is the set count. The tracker builds that many rows (up to 12), and a prescription with no count gets 3. A set counts as done only once you mark it complete; a drop set counts once, and so does a set with its side named."
  },
  "repetition": {
    "meaning": "One complete movement of an exercise, such as one squat down and back up.",
    "example": "Example: 8 squats in one set are 8 reps. For an exercise the app records as a timed hold, 20 seconds goes in the Hold box, not the Reps box. (Illustrative.)",
    "inApp": "Most exercises record reps in a Reps box. Exercises the app sets up as timed holds or carries ask for seconds (Hold) or distance instead, and those are never stored as reps. A drop set's reps are its stages added up.",
    "misread": "An estimated 1RM is made only from sets of 1 to 15 reps, so a set of 16 or more has none. That says nothing about the set itself."
  },
  "rep-range": {
    "meaning": "A target span of reps for a set, such as 8–12, instead of one fixed number.",
    "example": "Example: '3 × 8–12' means three sets, aiming for 8 to 12 reps in each. (Illustrative.)",
    "inApp": "The tracker shows each set's target exactly as the prescription writes it. New plan entries start from your goal's default, such as 3 × 6–15 for Muscle growth or 4 × 3–5 for the first two Max strength exercises, and you can edit it; the app treats it as a planning target, not a required dose."
  },
  "working-set": {
    "meaning": "A set done at the effort the session is built around, as opposed to a lighter preparation set.",
    "example": "Example: if you log two light sets and then three heavy sets of squats, the workout recap shows 'Working sets: 5'. (Illustrative.)",
    "inApp": "The tracker has no warm-up flag, so 'Working sets' in a workout recap counts every completed set. In Log a lift, 'Working set' is the test type for a weight × reps set, which becomes an estimated 1RM. The planner calls planned sets 'work sets'.",
    "misread": "Lighter sets you log also count toward the recap's working sets and every other completed-set count."
  },
  "warm-up-set": {
    "meaning": "A lighter set done before your working sets to prepare for them.",
    "example": "Example: an empty-bar set before heavy squats is a warm-up set. If you log it, Sports Genome counts it like any other set. (Illustrative.)",
    "inApp": "Sports Genome has no warm-up set type: a logged set is either standard or a drop set, and plans don't represent warm-ups. Warm-up comes as a separate list of preparation drills before you start. A warm-up line in a pasted plan that isn't an exercise is kept as plan context, not added as sets."
  },
  "rest-interval": {
    "meaning": "The time you rest between sets.",
    "example": "Example: if a day's exercises are set to 90 sec, 90 sec and 120 sec, the workout's rest timer starts at 90 seconds. (Illustrative.)",
    "inApp": "Each planned exercise has a rest setting: the choices offered are 60, 90, 120 and 180 sec, and 90 sec is the default. A workout keeps one rest timer, which starts from the rest the day's exercises use most often, moves in 15-second steps, and starts when you complete a set. The rest you actually take isn't recorded."
  },
  "tempo": {
    "meaning": "How fast each phase of a rep is done, sometimes written as a code such as 3-1-1.",
    "example": "Example: '3-1-1' typed in Log a lift's Tempo box is saved exactly as written, and nothing turns it into seconds. (Illustrative.)",
    "inApp": "Planned and logged workout sets have no tempo field, and the app does not measure rep speed. Log a lift has an optional Tempo text box that is saved with the lift, but neither your progress line nor any comparison reads it. In a pasted plan, a line about tempo that isn't an exercise is kept as plan context for that day."
  },
  "range-of-motion": {
    "meaning": "How far the joints move during a rep, from the start position to the end position.",
    "example": "Example: 'full depth' typed in Log a lift's Range of motion box is saved as written with that lift. (Illustrative.)",
    "inApp": "Workout sets have no range-of-motion field. Log a lift has an optional Range of motion text box that is saved with the lift, but your progress line doesn't read it, so it can't tell whether two lifts used the same range. Separately, exercise analysis uses the catalog's study-tagged range (such as Full or Long-length partial) as one factor in its muscle-targeting estimate."
  },
  "planned-vs-actual": {
    "meaning": "What the plan asked for, compared with what you actually logged.",
    "example": "Example: '3 of 4 planned sets · 1 skipped' in a recap means 4 were planned, 3 were completed and 1 was skipped on purpose. (Illustrative.)",
    "inApp": "A workout stores the prescription each exercise started with and, when you finish, how many sets were planned and skipped. Its recap is built from that stored record alone, never from the plan as it stands now. Plan screens (Week Review, the training day's analysis) read the plan, not your logs.",
    "misread": "Repeating a past workout copies only its prescriptions, never the weights you logged."
  },
  "skipped-vs-not-recorded": {
    "meaning": "A skipped set is one you chose not to do. A not-recorded set is a planned set that was never logged.",
    "example": "Example: '3 of 5 planned sets · 1 skipped · 1 not recorded' means 3 were done, 1 was passed on purpose, and 1 was left blank or typed in but never marked done. (Illustrative.)",
    "inApp": "A skipped set is resolved, so the workout moves on, but it isn't an observation. A set you typed into but never marked complete is a draft, and it's dropped when you finish. Neither one counts as work done or reaches your strength record, and an exercise with nothing completed is listed under 'Not done' as skipped or not recorded.",
    "misread": "'Not recorded' doesn't mean 0 reps or a failed set. The app has no information about it. Older workouts that didn't store planned counts show only the sets done."
  },
  "drop-set": {
    "meaning": "One set done as several stages back to back, each lighter than the one before, with no rest between them.",
    "example": "Example: 100 lb × 5 → 70 lb × 6 → 50 lb × 10 is 1 set: 3 stages, 21 reps and 1,420 lb·reps. Its strength estimate comes from 100 lb × 5 alone. (Illustrative.)",
    "inApp": "The set itself counts once in every set count. Its reps are the stages added up, and in the recap its volume (load × reps across every stage) appears only on its own detail line. Only stage 1 feeds strength estimates; a drop set needs at least two stages (a single stage is saved as an ordinary set), and a stage that isn't lighter is kept with a note asking you to check it."
  },
  "per-side": {
    "meaning": "An exercise done one side at a time, with each side doing the prescribed work.",
    "example": "Example: '3 × 8 / side' counts as 3 sets in every plan count; naming a side on a set doesn't double it. (Illustrative.)",
    "inApp": "For exercises the catalog marks as one side at a time, the tracker offers Left and Right on each set. Naming a side never makes a set count twice, and the side isn't carried over to the next set. In Log a lift, 'Which side' keeps left, right and bilateral lifts as separate progress series."
  },
  "assistance": {
    "meaning": "Help from a machine's counterweight, which takes part of your body weight and makes the exercise easier.",
    "example": "Example: going from '40 lb assist × 8' to '30 lb assist × 8' is progress, because less assistance is the stronger set. (Illustrative.)",
    "inApp": "On assisted machines the box is labelled Assistance, and a set reads back as '40 lb assist × 8': the number is help, not weight lifted. It produces no estimated 1RM and no volume, and drop sets aren't offered. The optional 'Assistance used' text box in Log a lift is a free-text note, not this number."
  },
  "load-convention": {
    "meaning": "Whether the weight you type is everything you lifted or the weight of one implement, such as one dumbbell.",
    "example": "Example: pressing two 30 lb dumbbells, you enter 30 in 'Weight per dumbbell', not 60. (Illustrative.)",
    "inApp": "Each exercise follows one rule. Barbell and similar lifts take the total (bar and plates), machines take the number on the stack or dial, dumbbell work takes one dumbbell ('Weight per dumbbell'), loaded carries take one hand ('Weight per hand'), and bodyweight movements take only added weight, with an empty box meaning bodyweight. Strength estimates and comparisons read the number by that rule, and any volume is labelled per dumbbell or per hand instead of being doubled.",
    "misread": "Entering a pair's total for a dumbbell exercise doubles the weight the comparison reads."
  },
  "rpe": {
    "meaning": "A self-rated number for how hard a set is, written like 'RPE 8'.",
    "example": "Example: the pasted line 'Barbell Bench Press — 3 x 8 @ RPE 8' imports with RPE 8 as that exercise's effort setting. (Illustrative.)",
    "inApp": "RPE is a planned setting on each exercise, shown as 'Effort', with RPE 6–9 to choose from and RPE 7 as the default. A pasted plan keeps any RPE it states; where it states none, the app default applies. The workout tracker doesn't ask for an RPE after a set, so none is recorded.",
    "misread": "In Sports Genome, an RPE is a target you set in the plan, not a record of how the set went."
  },
  "rir": {
    "meaning": "How many more reps you could have done at the point where you ended the set.",
    "example": "Example: 100 kg × 5 with 2 reps in reserve would be estimated as if 7 reps were possible, about 120 kg instead of 112.5 kg. (Illustrative; the app does not record RIR yet.)",
    "inApp": "The estimator can take a reported RIR of 0–5 and treats reps + RIR as the effective reps, but nothing in the app records RIR yet. So every working set is read as taken to failure, which gives the lowest possible estimate, and the percentile card says so."
  },
  "prescribed-vs-recorded-effort": {
    "meaning": "Prescribed effort is how hard the plan asks a set to be; recorded effort is how hard you report it was afterwards.",
    "example": "Example: a plan can say RPE 8 for squats, but Sports Genome keeps no rating of how hard your squat sets actually were. (Illustrative.)",
    "inApp": "The app only has prescribed effort: the plan's Effort (RPE) setting. Logged sets store weight, reps (or another measure) and whether the set was completed, but no effort rating, so strength estimates treat effort as unknown and read each set as taken to failure. An older progression review that read recorded RPE isn't shown anywhere in the app.",
    "misread": "A planned RPE is no evidence of how hard the session actually was."
  },
  "direct-sets": {
    "meaning": "Sets of exercises in which a muscle is one of the main (primary) targets.",
    "example": "Example: two planned exercises that both list chest as a primary muscle, at 4 sets and 3 sets, give chest 7 direct sets for that plan week. (Illustrative.)",
    "inApp": "Week Review and the training day's Workload count planned sets from the plan as written, not sets you logged. Each set counts 1 for every muscle the catalog lists as primary, and the set count is the prescription's leading number, else the goal's default, else 3. A 0 means nothing planned trains that muscle; the soleus and brachioradialis, which no catalog exercise tags, are hatched as not counted instead of shown as 0.",
    "misread": "These are planned sets, so logging or skipping a workout doesn't change them."
  },
  "supporting-exposure": {
    "meaning": "Work a muscle gets from exercises in which it helps rather than leads.",
    "example": "Example: 4 planned sets of a row that lists biceps as a secondary muscle add 2 to biceps under 'With support (est.)'. (Illustrative.)",
    "inApp": "Each set counts 0.5 for every muscle the catalog lists as secondary but not also as primary, applied once. Week Review adds it to the bars only under 'With support (est.)' and labels it estimated wherever it appears. The training day's Workload prints the sets done next to the halved number, such as '4 supporting sets (counted as 2)'.",
    "misread": "Adding up attributed sets across all muscles gives more than the sets you'll do, because one set counts toward every muscle it is tagged with. That's why the total isn't shown on the board."
  },
  "coverage-points": {
    "meaning": "A planning index of how well one training day covers the muscles its split type targets.",
    "example": "Example: on a Push day, one exercise listing chest as primary (56) plus one listing it as secondary (24) gives chest 80 points against its target of 90. That isn't a gap, because a gap means under 65% of the target. (Illustrative.)",
    "inApp": "Each exercise adds 56 points to a muscle it lists as primary and 24 to one it lists as secondary. The day's total is compared with fixed split targets (revision split_targets_v1), and anything under 65% of a target is a gap. These are catalog-tag points, not sets; the Workload panel beside them counts sets.",
    "misread": "Points aren't sets, and they don't measure activation, recovery or an individual optimum."
  },
  "movement-pattern-coverage": {
    "meaning": "Which kinds of movement, such as a hip hinge or a vertical pull, a plan contains.",
    "example": "Example: a week with squats and presses but no hinging exercise would list Hip hinge under 'Not planned', if Hip hinge is among the catalog's 12 commonest patterns. (Illustrative.)",
    "inApp": "Week Review lists each catalog movement value the plan week contains, with a marker on every session that has it. 'Not planned' names which of the catalog's 12 commonest movement values the week lacks, and exercises with no movement value appear under 'Unknown mapping'. It shows whether a pattern is present, not how much of it there is or how well it's done.",
    "misread": "This is about exercise patterns in your plan, not how well the plan supports a sport movement; that's what movement support tiers are for."
  },
  "calendar-vs-plan-week": {
    "meaning": "A calendar week is a run of dates, Monday to Sunday. A plan week is one of your plan's numbered weeks.",
    "example": "Example: finishing 'Week 2 · Day 02 · Pull' on a Wednesday marks Day 02 · Pull as done on Home for that Monday–Sunday week. Week Review for Week 2 doesn't change, because it reads the plan. (Illustrative.)",
    "inApp": "'This week' on Home is the calendar week from Monday 00:00 local time. A workout counts in the week it finished, and a plan day shows as done when a workout for that day finished this week, whichever plan week it was started from. The plan holds up to three weeks (Week 1–3) with no dates, and Week Review reads one plan week as written, so 'adjacent' sessions there are next to each other in plan order, not on consecutive days."
  },
  "e1rm": {
    "meaning": "A one-rep max calculated from a set of several reps, rather than tested with a single.",
    "example": "Example: 100 kg × 5 reps gives about 112.5 kg; 5 reps is below 8, so Brzycki is used. A set of 16 reps gives no estimate. (Illustrative.)",
    "inApp": "The app uses one estimator for sets of 1–15 reps with a weight above zero: Brzycki below 8 reps, Epley above 10, and a straight blend between the two. Effort isn't recorded, so every set is read as taken to failure. From a workout, each exercise contributes its set with the highest e1RM (a drop set by its first stage only); exercises recorded in seconds, distance, assistance or a band or gripper setting never produce one.",
    "misread": "It's an estimate from one set, not a tested max. Your progress line treats a change under 6% as stable and needs 15% or more before calling a change meaningful."
  },
  "measured-1rm": {
    "meaning": "The heaviest weight you actually lifted for one complete rep in a test.",
    "example": "Example: you work up to a single at 140 kg and log it as Measured 1RM, and 140 kg is used as your 1RM exactly as entered. (Illustrative.)",
    "inApp": "'Measured 1RM' is a test type in Log a lift and the form's default. It takes a weight and no reps, and that weight is used unchanged as the 1RM for your progress line and comparisons. Workout sets never become measured maxes; they come across as working sets and are estimated.",
    "misread": "Logging a set of several reps as Measured 1RM records that weight as your max, which is lower than the set's e1RM would be."
  },
  "percentile": {
    "meaning": "A lift's position within a comparison group, on a 0–100 scale.",
    "example": "Example: '63rd percentile' for a bench press is a position on the community curve for men who lift that exercise. It isn't 63% of anything. (Illustrative.)",
    "inApp": "A lift's e1RM is placed on a community curve for men or women who lift, in the curve's own unit (a body-weight multiple, kg or lb), between the curve's stored points. Below the lowest point or above the highest, no number is given rather than an extrapolated one. With a birth year, the comparison is adjusted for age 15–90 but the lift itself is not, and a matching published study, where one applies, is shown instead.",
    "misread": "Percentiles put lifts in order; the gap between two percentiles isn't an equal step in strength."
  },
  "comparison-group": {
    "meaning": "The group of other lifters a lift is compared with.",
    "example": "Example: with 'Women who lift' chosen, a logged squat is read against the community curve for women who logged that squat. (Illustrative.)",
    "inApp": "The community comparisons are split into men and women who lift. You choose one under 'Compare against'; it is saved to About Me and used only to pick the curve. A group the curves aren't split by (Prefer not to say, intersex) gives no percentile, though the lift still counts toward your own progress, and a rank card names the group its lifts were read against, listing several where they differ."
  },
  "rank": {
    "meaning": "A named band that a muscle group's estimated percentile falls into.",
    "example": "Example: a muscle group at a raw 41.7th percentile shows 'Varsity · 41st', since Varsity covers 40–59. (Illustrative.)",
    "inApp": "The bands are Prospect 0–19, JV 20–39, Varsity 40–59, Regional 60–79, State 80–94, National 95–98 and World Stage 99–100. A group's rank is taken from its best-evidenced muscle and is always labelled Estimated, with a confidence level ('About' is added when confidence is low); muscles your lifts only steady aren't ranked. The comparison curves stop at the 95th percentile, so no group can reach National or World Stage yet.",
    "misread": "These are Sports Genome ranks, not competition titles."
  },
  "rank-coverage": {
    "meaning": "How many of the body map's muscle groups have at least one lift logged.",
    "example": "Example: if your logged lifts reach six muscle groups, Strength shows 6 regions covered, whatever those lifts weighed. (Illustrative.)",
    "inApp": "A region counts as covered when a logged lift's primary muscles (or its reviewed route) reach it, and each region counts once however many lifts land in it. The coverage map shows 'On record' or 'Nothing logged yet' and says nothing about strength. A rank appears on a group only once one of its lifts has a comparison group; groups without one are 'Not scored'."
  },
  "unavailable-comparison": {
    "meaning": "A lift or muscle group with no comparison result, for a stated reason.",
    "example": "Example: a set of 20 reps shows 'This set has too many reps to estimate a one-rep max from, so it cannot be compared.' (Illustrative.)",
    "inApp": "Every missing comparison has a stated reason: no comparison data for the exercise, no weight logged, too many reps, no comparison group or body weight, a curve that isn't a one-rep max, or a lift beyond the curve's lowest or highest point. It's never drawn as the lowest rank, and a lift still waiting on the service shows as checking or waiting for a connection, not as unranked. The lift is saved either way and counts toward your own progress.",
    "misread": "No comparison is not a low score, and it says nothing about whether the exercise is worth training."
  },
  "muscle-role": {
    "meaning": "The part a muscle plays: driving the movement, assisting it, or holding position while other muscles move.",
    "example": "Example: in an exercise record, a muscle the catalog lists as primary is a Prime mover, and a trunk muscle on a bracing exercise can be a Stabilizer. (Illustrative.)",
    "inApp": "An exercise's record calls the catalog's primary muscles Prime mover and its secondary muscles Synergist or Stabilizer. Body Lab reads a sport action's own record (prime movers, assisting muscles, stabilizers) and shows them as Primary, Supporting and Stabilizer; training-day analysis says 'Prime mover / Supporting / Stabilizing in this day', and Week Review counts primary as direct and secondary as supporting. These are planning labels from catalog and research records, not measured activation or force.",
    "misread": "Stabilizer doesn't mean unimportant. Muscle ranks leave out a muscle your lifts only steady, because its score would describe the lift rather than the muscle."
  },
  "movement-support-vs-transfer": {
    "meaning": "Movement support says how an exercise relates to a sport movement's research record. Skill transfer would mean training it improves that skill, which the app doesn't claim.",
    "example": "Example: for the wrestling Bridge, Barbell Hip Thrust is Movement-specific because the record names 'hip thrust'. That's a record match, not proof it improves your bridge.",
    "inApp": "For the selected action, each exercise gets one tier, with a reason and no score. Movement-specific means named in the record; Related pattern means it shares a non-broad movement pattern with a named exercise and trains a prime mover; Muscle support means it trains a prime mover as a primary muscle and is shown apart, not counted as a match; anything else is Not mapped. Matches are made by exercise name and haven't been reviewed one by one by a person, and the exercise panel says the tier isn't proof that training it improves your skill on the field.",
    "misread": "The 'Training coverage' % in Movement intelligence is a different measure that also counts supporting muscles."
  },
};

export const trainingGlossary: GlossaryEntry[] = trainingTerms.map((term) => ({ ...term, ...details[term.id] }));
