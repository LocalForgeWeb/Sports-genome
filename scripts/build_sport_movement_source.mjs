import fs from 'node:fs';

const sourcePath = '/home/ubuntu/upload/Pasted_content_01.txt';
const outputPath = '/home/ubuntu/gym-optimizer/client/src/lib/sportMovementSource.ts';
const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const slugify = (value) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const profiles = lines.map((line) => {
  const match = line.match(/^(\d+)\.\s+(.+?):\s+(.+)\.$/);
  if (!match) throw new Error(`Cannot parse sport movement line: ${line}`);
  const movements = match[3].split(',').map((item) => item.trim().replace(/^and\s+/i, '')).filter(Boolean);
  if (movements.length !== 20) throw new Error(`${match[2]} has ${movements.length} movements; expected 20`);
  return { id: slugify(match[2]), label: match[2], movements };
});

if (profiles.length !== 20) throw new Error(`Expected 20 sport profiles; received ${profiles.length}`);

const source = `/** Kinetic Field Manual: user-supplied sport movements, retained verbatim as the source scope for research. */\n\nexport interface SportMovementSource {\n  id: string;\n  label: string;\n  movements: string[];\n}\n\nexport const sportMovementSource: SportMovementSource[] = ${JSON.stringify(profiles, null, 2)} as const;\n`;
fs.writeFileSync(outputPath, source);
console.log(`Generated ${profiles.length} sport profiles with ${profiles.reduce((total, profile) => total + profile.movements.length, 0)} movements.`);
