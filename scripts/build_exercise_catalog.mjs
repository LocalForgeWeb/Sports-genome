import fs from 'node:fs';

const sourcePath = '/home/ubuntu/upload/Pasted_content.txt';
const outputPath = '/home/ubuntu/gym-optimizer/client/src/lib/exerciseCatalog.ts';
const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

const sportNames = ['tennis', 'basketball', 'soccer', 'baseball', 'combat'];
const gradeFrom = (value) => ['F', 'D', 'C', 'B', 'A', 'S', 'SS'][Math.max(0, Math.min(6, value))];

const groupMeta = {
  'Chest — Free Weights, Machines & Cables': {
    category: 'Chest & push', movement: 'Horizontal push', primary: ['chest'], secondary: ['triceps', 'frontDelts'], qualities: ['strength', 'hypertrophy', 'bracing'], sport: [3, 4, 2, 3, 3], transfer: ['pressing force & shoulder control', 'contact strength & passing force', 'contact tolerance', 'upper-body force transfer', 'frames & hand-fighting'],
  },
  'Chest / Triceps Calisthenics': {
    category: 'Chest & push', movement: 'Closed-chain push', primary: ['chest', 'triceps'], secondary: ['frontDelts', 'abs'], qualities: ['strength', 'hypertrophy', 'power', 'bracing'], sport: [3, 4, 2, 3, 4], transfer: ['shoulder stability & pressing control', 'contact tolerance & finishing', 'ground-contact pushing', 'upper-body force transfer', 'posting & frames'],
  },
  'Back — Lats & Upper Back': {
    category: 'Back & pull', movement: 'Horizontal or vertical pull', primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts', 'forearms'], qualities: ['strength', 'hypertrophy', 'scapularControl', 'grip'], sport: [3, 3, 2, 4, 4], transfer: ['racquet deceleration & posture', 'rebounding position & contact', 'shielding support', 'throwing/batting deceleration', 'clinch pulling & grip'],
  },
  'Rear Delts, Traps & Scapular Muscles': {
    category: 'Scapular control', movement: 'Scapular retraction & external rotation', primary: ['rearDelts', 'traps'], secondary: ['upperBack', 'rotatorCuff'], qualities: ['hypertrophy', 'scapularControl', 'posture'], sport: [4, 3, 2, 5, 3], transfer: ['shoulder control & deceleration', 'rebound posture', 'upper-body posture', 'throwing shoulder support', 'posture under contact'],
  },
  'Shoulders': {
    category: 'Shoulders', movement: 'Vertical push or shoulder isolation', primary: ['frontDelts', 'sideDelts'], secondary: ['triceps', 'traps'], qualities: ['strength', 'hypertrophy', 'scapularControl'], sport: [4, 4, 2, 3, 3], transfer: ['overhead control', 'overhead reach & contact', 'contact tolerance', 'upper-body strength', 'frames & striking support'],
  },
  'Biceps, Brachialis & Forearms': {
    category: 'Arms & grip', movement: 'Elbow flexion & grip', primary: ['biceps', 'forearms'], secondary: ['brachialis'], qualities: ['hypertrophy', 'grip', 'endurance'], sport: [4, 3, 1, 4, 5], transfer: ['racquet grip endurance', 'ball protection', 'contact robustness', 'bat/ball control', 'grip endurance'],
  },
  'Triceps': {
    category: 'Arms & push', movement: 'Elbow extension', primary: ['triceps'], secondary: ['chest', 'frontDelts'], qualities: ['hypertrophy', 'strength'], sport: [3, 3, 1, 3, 3], transfer: ['racquet-side press support', 'passing & finishing support', 'contact support', 'upper-body force transfer', 'frames & punching support'],
  },
  'Quads': {
    category: 'Knee dominant', movement: 'Squat or lunge', primary: ['quads', 'glutes'], secondary: ['adductors', 'calves', 'abs'], qualities: ['strength', 'hypertrophy', 'unilateral', 'deceleration'], sport: [4, 4, 4, 4, 4], transfer: ['braking & lateral push-off', 'jumping & cutting', 'acceleration & cutting', 'ground-force production', 'stance drive & level changes'],
  },
  'Hamstrings & Posterior Chain': {
    category: 'Posterior chain', movement: 'Hip hinge or knee flexion', primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'forearms', 'abs'], qualities: ['strength', 'hypertrophy', 'eccentric', 'sprintSupport'], sport: [4, 4, 5, 4, 4], transfer: ['braking & re-acceleration', 'takeoff & landing support', 'sprint support & braking', 'ground-up force transfer', 'hip drive & sprawls'],
  },
  'Glutes & Hip Musculature': {
    category: 'Hips & glutes', movement: 'Hip extension or lateral hip control', primary: ['glutes'], secondary: ['hamstrings', 'adductors', 'abductors', 'abs'], qualities: ['strength', 'hypertrophy', 'unilateral', 'lateralControl'], sport: [4, 4, 4, 4, 4], transfer: ['open-stance loading & pelvic control', 'jump force & landing control', 'sprint/cutting pelvis control', 'force transfer through the hips', 'stance stability & bridging'],
  },
  'Calves, Tibialis & Lower Leg': {
    category: 'Lower leg', movement: 'Ankle plantarflexion or dorsiflexion', primary: ['calves', 'tibialis'], secondary: ['feet'], qualities: ['hypertrophy', 'elasticity', 'locomotion'], sport: [3, 4, 4, 2, 3], transfer: ['split-step and recovery support', 'jump & landing stiffness', 'sprint and running support', 'base-running support', 'footwork support'],
  },
  'Abs & Core': {
    category: 'Core', movement: 'Trunk flexion, rotation or anti-rotation', primary: ['abs', 'obliques'], secondary: ['hipFlexors', 'lowerBack'], qualities: ['strength', 'rotation', 'antiRotation', 'bracing'], sport: [4, 4, 3, 5, 4], transfer: ['stroke force transfer & bracing', 'passing & contact bracing', 'cutting/kicking bracing', 'swing/throw force transfer', 'striking and grappling bracing'],
  },
  'Landmine Exercises': {
    category: 'Landmine', movement: 'Diagonal press, pull, squat or rotation', primary: ['shoulders', 'chest', 'glutes'], secondary: ['triceps', 'upperBack', 'obliques', 'quads'], qualities: ['strength', 'rotation', 'antiRotation', 'unilateral', 'power'], sport: [4, 4, 3, 4, 4], transfer: ['diagonal force transfer', 'unilateral control & power', 'contact and bracing', 'hip-to-shoulder transfer', 'stance drive & rotation'],
  },
  'Medicine-Ball Power & Rotation': {
    category: 'Medicine ball', movement: 'Throw, slam or ballistic rotation', primary: ['obliques', 'chest', 'shoulders'], secondary: ['glutes', 'quads', 'triceps', 'abs'], qualities: ['power', 'rotation', 'throwing', 'bracing'], sport: [5, 4, 3, 6, 5], transfer: ['rotational shot power', 'passing & explosive extension', 'throw/brace support', 'swing and throw sequencing', 'striking & explosive rotation'],
  },
  'Explosive, Plyometric & Athletic': {
    category: 'Plyometric', movement: 'Jump, bound or explosive lower-body action', primary: ['quads', 'glutes', 'calves'], secondary: ['hamstrings', 'abs', 'adductors'], qualities: ['power', 'jumping', 'elasticity', 'deceleration'], sport: [4, 5, 4, 3, 4], transfer: ['split-step & lateral push-off', 'jumping and rapid takeoff', 'sprint/jump support', 'athletic acceleration', 'explosive level changes'],
  },
  'Sleds, Carries & Full-Body Conditioning': {
    category: 'Conditioning', movement: 'Locomotion, push, drag or carry', primary: ['quads', 'glutes', 'upperBack'], secondary: ['abs', 'forearms', 'calves', 'shoulders'], qualities: ['conditioning', 'locomotion', 'grip', 'bracing', 'sprintSupport'], sport: [3, 4, 4, 3, 5], transfer: ['court movement capacity', 'contact & court capacity', 'acceleration & repeated effort', 'general athletic capacity', 'drives, carries & grip'],
  },
};

function inferEquipment(name) {
  if (/Dumbbell/i.test(name)) return 'Dumbbells';
  if (/Barbell|Zercher|Pendlay|Good Morning|Skull Crusher/i.test(name)) return 'Barbell';
  if (/Cable/i.test(name)) return 'Cable';
  if (/Machine|Pec Deck|Leg Press|Captain/i.test(name)) return 'Machine';
  if (/Landmine/i.test(name)) return 'Landmine';
  if (/Medicine-Ball/i.test(name)) return 'Medicine ball';
  if (/Sled/i.test(name)) return 'Sled';
  if (/Push-Up|Pull-Up|Dip|Plank|L-Sit|V-Up|Pistol|Dead Hang|Wall Slide|Toe Walk|Heel Walk|Rope Climb|Inverted Row|Ring Row|Ring Dip|Handstand/i.test(name)) return 'Bodyweight';
  if (/Kettlebell/i.test(name)) return 'Kettlebell';
  if (/Band/i.test(name)) return 'Band';
  return 'Free weights';
}

function applyOverrides(base, name) {
  const text = name.toLowerCase();
  const meta = structuredClone(base);
  if (/deadlift|romanian|good morning|pull-through|reverse hyper|back extension|swing/.test(text)) {
    meta.movement = 'Hip hinge'; meta.primary = ['hamstrings', 'glutes']; meta.secondary = ['lowerBack', 'upperBack', 'forearms', 'abs'];
  }
  if (/row|pulldown|pull-up|chin-up|pullover|rope climb|scapular pull/.test(text)) {
    meta.movement = /pulldown|pull-up|chin-up|pullover|rope climb|scapular pull/.test(text) ? 'Vertical pull' : 'Horizontal pull'; meta.primary = ['lats', 'upperBack']; meta.secondary = ['biceps', 'rearDelts', 'forearms'];
  }
  if (/shrug/.test(text)) { meta.movement = 'Scapular elevation'; meta.primary = ['traps']; meta.secondary = ['forearms', 'upperBack']; }
  if (/face pull|rear-delt|y-raise|t-raise|w-raise|pull-apart|wall slide/.test(text)) { meta.movement = 'Scapular control'; meta.primary = ['rearDelts', 'traps']; meta.secondary = ['rotatorCuff', 'upperBack']; }
  if (/lateral raise/.test(text)) { meta.movement = 'Shoulder abduction'; meta.primary = ['sideDelts']; meta.secondary = ['traps']; }
  if (/front raise/.test(text)) { meta.movement = 'Shoulder flexion'; meta.primary = ['frontDelts']; meta.secondary = ['chest']; }
  if (/curl|wrist|pinch|hang|roller|farmer hold/.test(text)) { meta.movement = /wrist|pinch|hang|roller|farmer hold/.test(text) ? 'Grip isometric' : 'Elbow flexion'; meta.primary = /wrist|pinch|hang|roller|farmer hold/.test(text) ? ['forearms'] : ['biceps', 'brachialis']; meta.secondary = ['forearms']; }
  if (/pushdown|triceps extension|skull crusher|jm press/.test(text)) { meta.movement = 'Elbow extension'; meta.primary = ['triceps']; meta.secondary = ['frontDelts']; }
  if (/squat|leg press|leg extension|lunge|step-up|pistol/.test(text) && !/squat-to-press/.test(text)) { meta.movement = /lunge|step-up|pistol/.test(text) ? 'Unilateral knee dominant' : 'Squat / knee dominant'; meta.primary = ['quads', 'glutes']; meta.secondary = ['adductors', 'calves', 'abs']; }
  if (/leg curl|nordic|glute-ham|hamstring curl/.test(text)) { meta.movement = 'Knee flexion'; meta.primary = ['hamstrings']; meta.secondary = ['calves', 'glutes']; }
  if (/hip thrust|glute bridge|kickback/.test(text)) { meta.movement = 'Hip extension'; meta.primary = ['glutes']; meta.secondary = ['hamstrings', 'abs']; }
  if (/abduction|lateral band|cossack/.test(text)) { meta.movement = 'Lateral hip control'; meta.primary = ['abductors', 'glutes']; meta.secondary = ['adductors', 'quads']; }
  if (/adduction|copenhagen/.test(text)) { meta.movement = 'Hip adduction'; meta.primary = ['adductors']; meta.secondary = ['obliques', 'glutes']; }
  if (/calf raise|toe walk/.test(text)) { meta.movement = 'Ankle plantarflexion'; meta.primary = ['calves']; meta.secondary = ['feet']; }
  if (/tibialis|heel walk/.test(text)) { meta.movement = 'Ankle dorsiflexion'; meta.primary = ['tibialis']; meta.secondary = ['feet']; }
  if (/leg raise|l-sit|v-up|crunch|sit-up|dead bug|hollow|plank|rollout/.test(text)) { meta.movement = 'Trunk flexion / anti-extension'; meta.primary = ['abs']; meta.secondary = ['obliques', 'hipFlexors']; }
  if (/pallof|anti-rotation/.test(text)) { meta.movement = 'Anti-rotation'; meta.primary = ['obliques', 'abs']; meta.secondary = ['glutes', 'shoulders']; }
  if (/wood chop|landmine rotation|landmine 180|rotational|side throw|scoop toss|shot-put/.test(text)) { meta.movement = 'Rotation'; meta.primary = ['obliques', 'glutes']; meta.secondary = ['abs', 'shoulders', 'chest']; meta.qualities = [...new Set([...meta.qualities, 'rotation', 'power'])]; }
  if (/press|push-up|dip/.test(text) && !/leg press|pushdown|sled push|press-to/.test(text)) { meta.movement = /overhead|shoulder|handstand|z-press/.test(text) ? 'Vertical push' : 'Horizontal push'; meta.primary = /overhead|shoulder|handstand|z-press/.test(text) ? ['frontDelts', 'sideDelts'] : ['chest']; meta.secondary = ['triceps', 'frontDelts', 'abs']; }
  if (/jump|bound|pogo|explosive step/.test(text)) { meta.movement = 'Jump / plyometric'; meta.primary = ['quads', 'glutes', 'calves']; meta.secondary = ['hamstrings', 'abs']; meta.qualities = ['power', 'jumping', 'elasticity', 'deceleration']; }
  if (/sled sprint|sled push|sled drag/.test(text)) { meta.movement = /drag/.test(text) ? 'Resisted locomotion / drag' : 'Resisted locomotion / push'; meta.primary = ['quads', 'glutes']; meta.secondary = ['calves', 'abs', 'shoulders']; }
  if (/carry|farmer’s walk/.test(text)) { meta.movement = 'Loaded carry'; meta.primary = ['forearms', 'upperBack', 'abs']; meta.secondary = ['glutes', 'quads', 'calves']; }
  return meta;
}

function sportFit(meta, name) {
  const text = name.toLowerCase();
  return Object.fromEntries(sportNames.map((sport, index) => {
    let score = meta.sport[index];
    if (/medicine-ball|rotational|landmine rotation|landmine 180|wood chop/.test(text) && ['tennis', 'baseball', 'combat'].includes(sport)) score += 1;
    if (/jump|bound|pogo|sled sprint/.test(text) && ['basketball', 'soccer'].includes(sport)) score += 1;
    if (/nordic|leg curl/.test(text) && sport === 'soccer') score += 1;
    if (/towel|rope|farmer|carry|dead hang|plate pinch/.test(text) && sport === 'combat') score += 1;
    if (/single-leg|lunge|step-up|cossack|lateral band/.test(text) && ['tennis', 'soccer', 'basketball'].includes(sport)) score += 1;
    if (/push press|clean and press|split jerk|thruster/.test(text) && ['basketball', 'combat'].includes(sport)) score += 1;
    return [sport, { grade: gradeFrom(score), movementHelp: meta.transfer[index] }];
  }));
}

let group = '';
const exercises = [];
for (const raw of lines) {
  const line = raw.trim();
  const match = line.match(/^(\d+)\.\s+(.+)$/);
  if (match) {
    const source = groupMeta[group];
    if (!source) throw new Error(`Unrecognized source group: ${group}`);
    const meta = applyOverrides(source, match[2]);
    exercises.push({
      id: Number(match[1]),
      name: match[2],
      sourceGroup: group,
      category: meta.category,
      equipment: inferEquipment(match[2]),
      movement: meta.movement,
      primaryMuscles: [...new Set(meta.primary)],
      secondaryMuscles: [...new Set(meta.secondary)],
      qualities: [...new Set(meta.qualities)],
      muscleGrade: gradeFrom(meta.primary.length > 1 ? 5 : 4),
      sportFit: sportFit(meta, match[2]),
    });
  } else if (groupMeta[line]) {
    group = line;
  }
}

if (exercises.length !== 300) throw new Error(`Expected 300 exercises, received ${exercises.length}`);

const types = `/** Kinetic Field Manual: app data favors transparent training logic over false precision. */\n\nexport type Sport = 'tennis' | 'basketball' | 'soccer' | 'baseball' | 'combat';\nexport type Grade = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';\n\nexport interface Exercise {\n  id: number;\n  name: string;\n  sourceGroup: string;\n  category: string;\n  equipment: string;\n  movement: string;\n  primaryMuscles: string[];\n  secondaryMuscles: string[];\n  qualities: string[];\n  muscleGrade: Grade;\n  sportFit: Record<Sport, { grade: Grade; movementHelp: string }>;\n}\n\nexport const sports: { id: Sport; label: string; descriptor: string }[] = [\n  { id: 'tennis', label: 'Tennis', descriptor: 'rotation + court recovery' },\n  { id: 'basketball', label: 'Basketball', descriptor: 'jump + court contact' },\n  { id: 'soccer', label: 'Soccer', descriptor: 'sprint + cutting' },\n  { id: 'baseball', label: 'Baseball', descriptor: 'rotation + deceleration' },\n  { id: 'combat', label: 'Combat', descriptor: 'stance + grip' },\n];\n\n`;

fs.mkdirSync('/home/ubuntu/gym-optimizer/client/src/lib', { recursive: true });
fs.writeFileSync(outputPath, `${types}export const exercises: Exercise[] = ${JSON.stringify(exercises, null, 2)} as const;\n\nexport const gradeValue: Record<Grade, number> = { F: 1, D: 2, C: 3, B: 4, A: 5, S: 6, SS: 7 };\n`);
console.log(`Generated ${exercises.length} exercises at ${outputPath}`);
