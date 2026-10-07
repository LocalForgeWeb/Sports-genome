// Curated photo matches: app exercise id -> Free Exercise DB name. Reviewed by hand; a
// fuzzy candidate not listed here is dropped, an exact name match is kept unless `rejected` lists it.
import { readFileSync, writeFileSync } from 'node:fs';
const app = JSON.parse(readFileSync('app-exercises.json', 'utf8'));
const db = JSON.parse(readFileSync('free-exercise-db.json', 'utf8')).filter((e) => e.images?.length);
const byName = new Map(db.map((e) => [e.name, e]));
const curated = {
  1: 'Barbell Bench Press - Medium Grip', 2: 'Barbell Incline Bench Press - Medium Grip', 5: 'Incline Dumbbell Press', 8: 'Close-Grip Dumbbell Press', 9: 'Dumbbell Bench Press', 10: 'One Arm Dumbbell Bench Press', 11: 'Leverage Chest Press', 12: 'Leverage Incline Chest Press', 15: 'Smith Machine Incline Bench Press', 17: 'Cable Chest Press', 18: 'Cable Crossover', 19: 'Low Cable Crossover', 20: 'Cable Crossover', 23: 'Incline Dumbbell Flyes', 24: 'Straight-Arm Dumbbell Pullover', 65: 'Straight-Arm Dumbbell Pullover', 27: 'Push-Up Wide', 28: 'Push-Ups - Close Triceps Position', 32: 'Plyo Push-up', 33: 'Plyo Push-up', 34: 'Plyo Push-up', 35: 'Pushups', 36: 'Suspended Push-Up', 37: 'Pushups',
  41: 'Barbell Deadlift', 43: 'Bent Over Barbell Row', 45: 'Reverse Grip Bent-Over Rows', 46: 'One-Arm Dumbbell Row', 50: 'T-Bar Row with Handle', 51: 'Lying T-Bar Row', 52: 'Leverage High Row', 54: 'Seated Cable Rows', 55: 'Seated Cable Rows', 56: 'Seated One-arm Cable Pulley Rows', 57: 'Wide-Grip Lat Pulldown', 59: 'V-Bar Pulldown', 60: 'Underhand Cable Pulldowns', 61: 'One Arm Lat Pulldown', 62: 'Straight-Arm Pulldown', 68: 'Pullups', 69: 'Wide-Grip Rear Pull-Up', 70: 'Weighted Pull Ups', 71: 'Chin-Up', 76: 'Inverted Row', 84: 'Cable Shrugs', 85: 'Leverage Shrug', 90: 'Seated Bent-Over Rear Delt Raise', 91: 'Lying Rear Delt Raise', 93: 'Bent Over Low-Pulley Side Lateral',
  101: 'Standing Military Press', 102: 'Seated Barbell Military Press', 104: 'Seated Dumbbell Press', 105: 'Arnold Dumbbell Press', 106: 'Machine Shoulder (Military) Press', 107: 'Smith Machine Overhead Shoulder Press', 108: 'Dumbbell One-Arm Shoulder Press', 111: 'Side Lateral Raise', 112: 'Standing Low-Pulley Deltoid Raise', 114: 'Standing Low-Pulley Deltoid Raise', 116: 'One-Arm Incline Lateral Raise', 117: 'Front Dumbbell Raise', 118: 'Front Cable Raise', 119: 'Front Plate Raise', 120: 'Handstand Push-Ups',
  123: 'Dumbbell Bicep Curl', 124: 'Dumbbell Alternate Bicep Curl', 127: 'Machine Preacher Curls', 128: 'Standing Biceps Cable Curl', 131: 'Concentration Curls', 132: 'Hammer Curls', 134: 'Cable Hammer Curls - Rope Attachment', 135: 'Reverse Barbell Curl', 139: 'Palms-Up Barbell Wrist Curl Over A Bench', 140: 'Palms-Down Wrist Curl Over A Bench',
  146: 'Close-Grip Barbell Bench Press', 148: 'EZ-Bar Skullcrusher', 149: 'Lying Dumbbell Tricep Extension', 150: 'Triceps Pushdown', 151: 'Triceps Pushdown - Rope Attachment', 152: 'Reverse Grip Triceps Pushdown', 153: 'Cable One Arm Tricep Extension', 154: 'Cable Rope Overhead Triceps Extension', 155: 'Standing Dumbbell Triceps Extension', 156: 'Dumbbell One-Arm Triceps Extension', 158: 'Bench Dips', 159: 'Ring Dips',
  163: 'Front Barbell Squat', 164: 'Zercher Squats', 171: 'Leg Extensions', 173: 'Split Squats', 175: 'Dumbbell Rear Lunge', 177: 'Barbell Walking Lunge', 179: 'Dumbbell Step Ups', 182: 'Weighted Sissy Squat', 184: 'Kettlebell Pistol Squat', 188: 'Kettlebell One-Legged Deadlift', 189: 'Stiff-Legged Dumbbell Deadlift', 191: 'Seated Good Mornings', 192: 'Natural Glute Ham Raise', 194: 'Lying Leg Curls', 196: 'Standing Leg Curl', 200: 'Hyperextensions (Back Extensions)', 202: 'Pull Through', 203: 'One-Arm Kettlebell Swings', 207: 'Smith Machine Hip Raise', 210: 'Butt Lift (Bridge)', 212: 'One-Legged Cable Kickback', 216: 'Monster Walk', 219: 'Thigh Adductor', 221: 'Standing Calf Raises', 223: 'Calf Press On The Leg Press Machine', 225: 'Donkey Calf Raises',
  234: 'Hanging Pike', 236: 'Jackknife Sit-Up', 237: 'Ab Roller', 238: 'Barbell Ab Rollout', 240: 'Ab Crunch Machine', 241: 'Decline Crunch', 246: 'Plank', 247: 'Side Bridge', 248: 'Plank', 250: 'Standing Cable Wood Chop', 251: 'Single-Arm Linear Jammer', 253: 'Single-Arm Linear Jammer', 265: "Landmine 180's", 266: "Landmine 180's",
  273: 'Overhead Slam', 277: 'Medicine Ball Scoop Throw', 279: 'Backward Medicine Ball Throw', 280: 'Standing Two-Arm Overhead Throw', 281: 'Chest Push (multiple response)', 286: 'Front Box Jump', 287: 'Depth Jump Leap', 288: 'Standing Long Jump', 293: 'Freehand Jump Squat', 294: 'Split Jump', 296: 'Sled Push', 297: 'Backward Drag', 298: 'Prowler Sprint',
  302: 'Standing Cable Chest Press', 305: 'Incline Cable Chest Press', 307: 'Cable Chest Press', 311: 'Single-Arm Cable Crossover', 312: 'Incline Cable Flye', 314: 'Cable Rear Delt Fly', 317: 'Upright Cable Row', 318: 'Cable Rope Rear-Delt Rows', 320: 'External Rotation with Cable', 321: 'Cable Internal Rotation', 327: 'Wide-Grip Lat Pulldown', 328: 'Straight-Arm Pulldown', 331: 'Seated Cable Rows', 333: 'Kneeling High Pulley Row', 336: 'Standing Biceps Cable Curl', 337: 'Cable Hammer Curls - Rope Attachment', 339: 'High Cable Curls', 343: 'Triceps Pushdown', 344: 'Triceps Pushdown - Rope Attachment', 345: 'Reverse Grip Triceps Pushdown', 346: 'Cable One Arm Tricep Extension', 349: 'Cable Rope Overhead Triceps Extension', 354: 'Cable Deadlifts', 361: 'One-Legged Cable Kickback', 362: 'One-Legged Cable Kickback', 364: 'Cable Hip Adduction', 378: 'Standing Cable Wood Chop',
  387: 'Kettlebell Dead Clean', 388: 'One-Arm Kettlebell Snatch', 390: 'Kettlebell Turkish Get-Up (Lunge style)', 392: 'Lateral Bound', 399: 'Battling Ropes', 400: 'Battling Ropes',
  // October 3 re-match of the 171 unphotographed exercises: each proposed by a curator who viewed the
  // frames, confirmed by two independent reviewers (set-up and movement), then checked again by eye.
  // Decisions for all 171, including the ones left without a photo: docs/exercise-photo-rematch/.
  13: 'Leverage Chest Press', 25: 'Svend Press', 26: 'Pushups', 39: 'Isometric Wipers', 66: 'Pullups', 86: 'Middle Back Shrug', 97: 'Dumbbell Lying Rear Lateral Raise',
  178: 'Elevated Back Lunge', 204: 'Romanian Deadlift', 232: 'Hanging Leg Raise', 255: 'Landmine Linear Jammer', 256: 'Bent Over One-Arm Long Bar Row',
  258: 'T-Bar Row with Handle', 268: 'Landmine Linear Jammer', 283: 'Supine Two-Arm Overhead Throw', 295: 'Single Leg Push-off', 310: 'Pallof Press', 313: 'Cable Crossover',
  326: 'Kneeling High Pulley Row', 329: 'Shotgun Row', 377: 'Standing Cable Lift', 385: "Landmine 180's", 395: 'Linear Depth Jump',
  // 50-exercise expansion (6 Oct 2026): each pair viewed frame by frame against the record's stated
  // setup; decisions for all 50, including the 39 left on the placeholder, are in
  // docs/exercise-expansion-v1/media.json.
  404: 'Seated Head Harness Neck Resistance', 407: 'Isometric Neck Exercise - Sides', 413: 'Cable Wrist Curl',
  414: 'Standing Palms-Up Barbell Behind The Back Wrist Curl', 415: 'Finger Curls', 419: 'Dip Machine',
  424: 'Smith Single-Leg Split Squat', 432: 'Trap Bar Deadlift', 433: 'Sumo Deadlift', 446: 'Sled Overhead Backward Walk', 449: 'Dumbbell Side Bend',
};
const byAppName = { 'Pec Deck Fly': 'Butterfly', 'Dumbbell Fly': 'Dumbbell Flyes', 'Reverse Pec Deck': 'Reverse Machine Flyes', 'Pendlay Row': 'Bent Over Barbell Row', 'Chest-Supported Dumbbell Row': 'Dumbbell Incline Row', 'Seal Row': 'Incline Bench Pull', 'Machine Low Row': 'Leverage Iso Row', 'Ring Row': 'Suspended Row', 'Rope Face Pull with External Rotation': 'Face Pull', 'Back Squat': 'Barbell Squat', 'High-Bar Back Squat': 'Barbell Full Squat', 'Forward Lunge': 'Dumbbell Lunges', 'Stiff-Leg Deadlift': 'Stiff-Legged Barbell Deadlift', 'Hip Abduction Machine': 'Thigh Abductor', 'Stability-Ball Hamstring Curl': 'Ball Leg Curl', 'Single-Leg Hip Thrust': 'Single Leg Glute Bridge', 'Captain’s-Chair Leg Raise': 'Knee/Hip Raise On Parallel Bars', 'Farmer’s Carry': "Farmer's Walk", "Farmer's Carry": "Farmer's Walk" };
// Plausible but incorrect variations (October 1 brief §2): the source photographs the
// two-arm, unloaded, standing or floor version of these, and a photo of a different setup
// teaches the wrong exercise. They show the placeholder frame instead. This table is checked
// first, so it overrides `curated`, `byAppName` and an exact name match. 231 and 254 were added
// on October 3: a bent-knee photo for a straight-leg raise, and a strict press for a push press.
const rejected = {
  9: 'alternating dumbbell press: the photo is the two-arm press', 17: 'single-arm cable chest press: the photo is two-arm', 34: 'explosive depth push-up starts on boxes; the photo is a floor plyo push-up',
  35: 'deficit push-up uses handles; the photo is a floor push-up', 37: 'weighted push-up carries a plate; the photo does not', 55: 'wide-grip cable row uses a wide bar; the photo is the V-handle row',
  71: 'weighted chin-up: no belt in the photo', 76: 'feet-elevated inverted row: feet on the floor in the photo',
  114: 'leaning lateral raise: the photo is upright', 209: 'single-leg hip thrust is on a bench, loaded; the photo is a floor bridge', 248: 'weighted plank carries a plate; the photo does not',
  361: 'quadruped hip extension: the photo is a standing kickback', 362: 'donkey kick is quadruped; the photo is a standing kickback',
  378: 'horizontal chop: the photo is a diagonal wood chop', 399: 'battle rope slams: the photo is alternating waves',
  254: 'landmine push press drives from a dip; the single-arm jammer photo is the strict press it shows for Landmine Press',
  231: 'hanging leg raise keeps the legs straight; the source photographs it with the knees bent, which is the Hanging Knee Raise (232) it now illustrates',
  // Oct 6 visual review of every mapped frame (docs/exercise-media-audit/visual-review.json).
  33: 'clap push-up: the plyo push-up photo shows no clap', 44: 'pendlay row returns the bar to the floor; the photo is a hanging bent-over row',
  48: 'seal row is prone on a flat raised bench; the photo is an incline bench pull', 68: 'neutral-grip pull-up: the photo is the pull-up photo, hands on the angled handles',
  173: 'bulgarian split squat elevates the rear foot; the photo is a floor split squat', 203: 'kettlebell swing is two-handed; the photo is the one-arm swing',
  339: 'high cable curl is standing between pulleys; the photo is lying on a bench',
  // 50-exercise expansion: same-named source photos that show a different setup.
  409: 'seated forearm pronation with a lever; the source photographs a lying setup whose own instructions describe rotating the upper arm',
  410: 'seated forearm supination with a lever; the source photographs a side-lying setup',
  450: 'half-kneeling cable lift; the source cable lift is standing (it illustrates the Cable Reverse Chop, 377)',
  448: 'low-pulley side bend away from the stack; the source is a high-pulley side crunch',
  438: 'single-leg seated curl; the source photographs both legs', 439: 'single-leg lying curl; the source photographs both legs',
};
const normName = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[()\-\/,.:]/g, ' ').replace(/\s+/g, ' ').trim();
const byNorm = new Map(db.map((e) => [normName(e.name), e]));
const out = {}; const how = { curated: 0, exact: 0, rejected: 0, none: 0 }; const missing = [];
for (const ex of app) {
  if (rejected[ex.id]) { how.rejected++; continue; }
  const name = curated[ex.id] ?? byAppName[ex.name]; let hit = null;
  if (name) { hit = byName.get(name); if (!hit) { missing.push(`${ex.id} ${ex.name} -> ${name}`); } else how.curated++; }
  else { hit = byNorm.get(normName(ex.name)) ?? null; if (hit) how.exact++; }
  if (hit) out[ex.id] = [hit.id, hit.images.length]; else how.none++;
}
if (missing.length) { console.error('unresolved curated names:', missing); process.exit(1); }
writeFileSync('exercisePhotos.json', JSON.stringify(out));
console.log(how, 'mapped', Object.keys(out).length, 'of', app.length);
