import { readFileSync, writeFileSync } from 'node:fs';
const app = JSON.parse(readFileSync('app-exercises.json', 'utf8'));
const db = JSON.parse(readFileSync('free-exercise-db.json', 'utf8')).filter((e) => e.images?.length);
const syn = { db: 'dumbbell', dumbbells: 'dumbbell', bb: 'barbell', kb: 'kettlebell', kettlebells: 'kettlebell', bw: 'bodyweight', 'body only': 'bodyweight', pushup: 'push up', pushups: 'push up', 'push-up': 'push up', pullup: 'pull up', pullups: 'pull up', 'pull-up': 'pull up', chinup: 'chin up', 'chin-up': 'chin up', situp: 'sit up', 'sit-up': 'sit up', rdl: 'romanian deadlift', ohp: 'overhead press', 'skull crusher': 'lying triceps extension', 'skullcrusher': 'lying triceps extension', conventional: '', standard: '', 'split-stance': 'split stance', hyperextension: 'back extension', 'hyperextensions': 'back extension' };
const stop = new Set(['the', 'a', 'with', 'and', 'of', 'to', 'on', 'in', 'medium', 'grip', 'version', 'standing', 'seated']);
function norm(s) { let t = s.toLowerCase().replace(/[’']/g, '').replace(/[()\-\/,.:]/g, ' ').replace(/\s+/g, ' ').trim(); for (const [k, v] of Object.entries(syn)) t = t.replace(new RegExp(`\\b${k.replace(/[-\/]/g, '\\$&')}\\b`, 'g'), v); return t.replace(/\s+/g, ' ').trim(); }
const tokens = (s) => new Set(norm(s).split(' ').filter((w) => w && !stop.has(w)).map((w) => w.replace(/s$/, '')));
const jacc = (a, b) => { const i = [...a].filter((x) => b.has(x)).length; return i / (a.size + b.size - i); };
const byNorm = new Map(db.map((e) => [norm(e.name), e]));
const eq = (a) => norm(a || '').replace('body only', 'bodyweight');
const out = {}; const rows = [];
for (const ex of app) {
  const n = norm(ex.name); let hit = byNorm.get(n); let how = 'exact';
  if (!hit) {
    const t = tokens(ex.name); let best = null; let score = 0;
    for (const e of db) { let s = jacc(t, tokens(e.name)); if (ex.equipment && eq(e.equipment).includes(eq(ex.equipment).split(' ')[0])) s += 0.08; if (ex.primary?.length && e.primaryMuscles?.length) { const pm = ex.primary.map((m) => m.toLowerCase()); if (e.primaryMuscles.some((m) => pm.some((p) => p.includes(m.slice(0, 4)) || m.includes(p.slice(0, 4))))) s += 0.06; } if (s > score) { score = s; best = e; } }
    if (best && score >= 0.5) { hit = best; how = `fuzzy:${score.toFixed(2)}`; }
  }
  rows.push([ex.id, ex.name, hit ? hit.name : '', how, hit ? hit.id : '']);
  if (hit) out[ex.id] = { source: hit.id, name: hit.name, images: hit.images, match: how };
}
writeFileSync('match-report.tsv', rows.map((r) => r.join('\t')).join('\n'));
writeFileSync('exercisePhotos.json', JSON.stringify(out, null, 0));
const exact = rows.filter((r) => r[3] === 'exact').length, fuzzy = rows.filter((r) => r[3].startsWith('fuzzy')).length, none = rows.filter((r) => !r[2]).length;
console.log({ total: app.length, exact, fuzzy, none });
