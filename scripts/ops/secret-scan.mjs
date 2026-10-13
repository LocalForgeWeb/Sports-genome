// SEC06: look for credentials in the built bundle, the tracked files and every commit in history.
// Prints WHERE and WHICH KIND only - never the matched value. Exit 1 when anything is found.
//   node scripts/ops/secret-scan.mjs
// Not findings: the Supabase publishable key (meant to ship in the bundle), and test fixtures:
// values containing TESTONLY, and service_role JWTs without Supabase's own `iss`/`ref` claims.
import { execFileSync, spawn } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const detectors = [
  ['supabase secret key', /sb_secret_[A-Za-z0-9_-]{10,}/g],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['AWS access key', /AKIA[0-9A-Z]{16}/g],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9]{36}/g],
  ['Hugging Face token', /hf_[A-Za-z0-9]{30,}/g],
  ['Stripe live key', /sk_live_[A-Za-z0-9]{20,}/g],
  ['Slack token', /xox[baprs]-[A-Za-z0-9-]{10,}/g],
  ['database URL with password', /postgres(?:ql)?:\/\/[^:@/\s]+:[^@/\s]{6,}@|mysql:\/\/[^:@/\s]+:[^@/\s]{6,}@/g],
  ['service_role JWT', /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)/g],
];
const isFixture = (match, groups) => /TESTONLY/.test(match) || (groups?.[2] && /^(signature|sig|test)$/i.test(Buffer.from(groups[2], "base64url").toString()));

function scan(text, where, out) {
  for (const [kind, pattern] of detectors) {
    for (const m of text.matchAll(pattern)) {
      if (isFixture(m[0], m)) continue;
      if (kind === 'service_role JWT') {
        let claims = {};
        try { claims = JSON.parse(Buffer.from(m[1], 'base64url').toString()); } catch { /* not JSON */ }
        // A real Supabase key always names its issuer and project; a test stand-in does not.
        if (claims.role !== 'service_role' || !(claims.iss === 'supabase' || claims.ref)) continue;
      }
      out.add(`${where}: ${kind}`);
    }
  }
}

const findings = { bundle: new Set(), tree: new Set(), history: new Set() };
const walk = (dir) => readdirSync(dir).flatMap((name) => { const p = join(dir, name); return statSync(p).isDirectory() ? walk(p) : [p]; });
try { for (const file of walk('dist/public')) if (/\.(js|css|html|json|map|webmanifest)$/.test(file)) scan(readFileSync(file, 'utf8'), file, findings.bundle); } catch { /* no build */ }
for (const file of execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)) {
  if (file === 'pnpm-lock.yaml') continue;
  let text; try { text = readFileSync(file, 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue;
  scan(text, file, findings.tree);
}
await new Promise((resolve) => {
  const git = spawn('git', ['log', '--all', '-p', '--no-color', '--unified=0']);
  let commit = '', file = '';
  createInterface({ input: git.stdout }).on('line', (line) => {
    if (line.startsWith('commit ')) commit = line.slice(7, 17);
    else if (line.startsWith('+++ b/')) file = line.slice(6);
    else if (line.startsWith('+') && !line.startsWith('+++')) scan(line, `${commit} ${file}`, findings.history);
  }).on('close', resolve);
});
let total = 0;
for (const [area, set] of Object.entries(findings)) {
  console.log(`== ${area}: ${set.size ? '' : 'none'}`);
  for (const item of [...set].sort()) console.log(`  ${item}`);
  total += set.size;
}
console.log(total ? `RESULT: ${total} location(s) to review` : 'RESULT: no credential patterns found');
process.exit(total ? 1 : 0);
