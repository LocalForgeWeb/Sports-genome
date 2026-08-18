import fs from 'node:fs';

const researchPath = '/home/ubuntu/research_sport_movement_profiles.json';
const sourcePath = '/home/ubuntu/gym-optimizer/client/src/lib/sportMovementSource.ts';
const outputPath = '/home/ubuntu/gym-optimizer/client/src/lib/sportMovementDatabase.ts';

const research = JSON.parse(fs.readFileSync(researchPath, 'utf8')).results;
const sourceText = fs.readFileSync(sourcePath, 'utf8');
const sourceMatch = sourceText.match(/export const sportMovementSource:[\s\S]*?=\s*(\[[\s\S]*?\])\s+as const;/);
if (!sourceMatch) throw new Error('Could not parse the sport movement source dataset.');
const sourceProfiles = JSON.parse(sourceMatch[1]);

const normalize = (value) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const sportByLabel = new Map(sourceProfiles.map((profile) => [normalize(profile.label), profile]));

function unpackResearchLine(line) {
  const [, details = line] = line.split(/\s*=\s*>\s*/, 2);
  const pieces = details.split(';').map((piece) => piece.trim()).filter(Boolean);
  return {
    bodyActions: pieces[0] || 'Sport-specific body action and coordination demand.',
    primaryMuscles: pieces[1] || 'Prime movers vary with execution and context.',
    stabilizers: pieces[2] || 'Trunk, joint, and positional stabilizers.',
    muscleActions: pieces[3] || 'Mixed concentric, eccentric, and isometric actions.',
    family: pieces[4] || 'Sport movement pattern',
    gymTransferCue: pieces.slice(5).join('; ') || 'Choose supplemental exercises that preserve the relevant movement quality.',
  };
}

const sportProfiles = [];
const movementProfiles = [];

for (const result of research) {
  const output = result.output;
  const source = sportByLabel.get(normalize(output.sport));
  if (!source) throw new Error(`No source profile found for ${output.sport}`);
  const researchLines = output.movement_profiles.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (researchLines.length !== source.movements.length) {
    throw new Error(`${output.sport}: expected ${source.movements.length} researched movements, received ${researchLines.length}`);
  }
  const families = output.movement_families.split(';').map((family) => family.trim()).filter(Boolean);
  sportProfiles.push({
    id: source.id,
    label: source.label,
    movementFamilies: families,
    summary: output.sport_summary,
    confidence: output.source_confidence,
  });
  source.movements.forEach((movement, index) => {
    const researchFields = unpackResearchLine(researchLines[index]);
    movementProfiles.push({
      id: `${source.id}-${index + 1}`,
      sportId: source.id,
      sportLabel: source.label,
      label: movement,
      ...researchFields,
    });
  });
}

if (sportProfiles.length !== 20 || movementProfiles.length !== 400) {
  throw new Error(`Expected 20 sports and 400 movements; received ${sportProfiles.length} and ${movementProfiles.length}.`);
}

const file = `/** Kinetic Field Manual: research-backed sport movement records for transparent exercise-transfer explanations. */\n\nexport interface SportProfile {\n  id: string;\n  label: string;\n  movementFamilies: string[];\n  summary: string;\n  confidence: string;\n}\n\nexport interface SportMovementProfile {\n  id: string;\n  sportId: string;\n  sportLabel: string;\n  label: string;\n  bodyActions: string;\n  primaryMuscles: string;\n  stabilizers: string;\n  muscleActions: string;\n  family: string;\n  gymTransferCue: string;\n}\n\nexport const sportProfiles: SportProfile[] = ${JSON.stringify(sportProfiles, null, 2)} as const;\n\nexport const sportMovementProfiles: SportMovementProfile[] = ${JSON.stringify(movementProfiles, null, 2)} as const;\n`;
fs.writeFileSync(outputPath, file);
console.log(`Generated ${sportProfiles.length} sport profiles and ${movementProfiles.length} movement records.`);
