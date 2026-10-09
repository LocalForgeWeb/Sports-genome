// RL02/RL03: the shared allowance holds across independent server instances.
// Four separate Node processes run the real API bundle (dist/serverless.js). Their Supabase URL
// points at a stand-in for PostgREST's RPC endpoint that runs the real migration's function on a
// local PostgreSQL 16 - the same SQL production runs. Each instance alone allows 12 share
// creations a minute (rateLimit.ts); together they must allow only the shared 30.
// Run: PGHOST=<socket dir> PGPORT=55432 node docs/infrastructure-v2/probes/shared-rate-limit.mjs
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const KEY = 'local-test-service-key';
const PG = ['-h', process.env.PGHOST, '-p', process.env.PGPORT ?? '55432', '-U', 'postgres', '-At'];
execFileSync('psql', [...PG, '-c', 'truncate private.rate_limit_windows']);
let rpcCalls = 0;
const shim = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    if (req.method !== 'POST' || req.url !== '/rest/v1/rpc/sg_rate_limit_hit' || req.headers.apikey !== KEY) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return; }
    rpcCalls += 1;
    const { p_bucket, p_window_seconds, p_max_calls } = JSON.parse(body);
    const child = spawn('psql', [...PG, '-v', `b=${p_bucket}`, '-v', `w=${p_window_seconds}`, '-v', `m=${p_max_calls}`]);
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.on('close', () => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(out.trim()); });
    child.stdin.end("select public.sg_rate_limit_hit(:'b', (:'w')::int, (:'m')::int);\n");
  });
}).listen(0);
await new Promise((r) => shim.once('listening', r));
const shimUrl = `http://127.0.0.1:${shim.address().port}`;

const ports = [43101, 43102, 43103, 43104];
const instances = ports.map((port) => spawn(process.execPath, ['-e', `import('${process.cwd()}/dist/serverless.js').then((m) => m.default.listen(${port}))`], {
  env: { ...process.env, NODE_ENV: 'production', VITE_SUPABASE_URL: shimUrl, SUPABASE_SERVICE_ROLE_KEY: KEY, SHARE_STORE: '' }, stdio: ['ignore', 'pipe', 'pipe'],
}));
// Count fail-open events: a slow or failing store makes an instance fall back to its local limit.
let failOpen = 0;
instances.forEach((p) => p.stderr.on('data', (d) => { failOpen += (String(d).match(/rate_limit_store_unavailable/g) || []).length; }));
await new Promise((r) => setTimeout(r, 2500));

const create = (port, i) => fetch(`http://127.0.0.1:${port}/api/trpc/shares.create`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ json: { requestKey: `probe-request-${String(i).padStart(8, '0')}`, manageSecret: 'm'.repeat(40), snapshot: { probe: true } } }),
}).then((r) => ({ port, status: r.status, retryAfter: r.headers.get('retry-after') }));

// 20 rounds, each sending one call to every instance at the same moment: 80 calls, 48 of which
// the instances would allow on their own. Rounds keep the local stand-in for PostgREST (a psql
// process per call) inside the limiter's 700 ms budget; concurrency inside the database itself
// is proven separately (200 calls over 50 connections, see status.md RL03).
const results = [];
for (let round = 0; round < 20; round++) results.push(...await Promise.all(ports.map((port, n) => create(port, n * 100 + round))));
const throttled = results.filter((r) => r.status === 429);
const passed = results.filter((r) => r.status !== 429);
const perInstance = Object.fromEntries(ports.map((port) => [port, passed.filter((r) => r.port === port).length]));
const stored = Number(execFileSync('psql', [...PG, '-c', "select coalesce(sum(calls),0) from private.rate_limit_windows where bucket like 'share-create:%'"]).toString().trim());
const report = {
  instances: ports.length, callsSent: results.length, passedLimiter: passed.length, throttled: throttled.length,
  perInstancePassed: perInstance, sharedCounterCalls: stored, rpcCalls,
  retryAfterOnThrottle: throttled.every((r) => Number(r.retryAfter) >= 1),
  failOpenEvents: failOpen,
  expectation: 'passedLimiter === 30 (shared), not 48 (4 x 12 per instance)',
  pass: passed.length === 30 && failOpen === 0,
};
instances.forEach((p) => p.kill()); shim.close();
writeFileSync(new URL('../evidence/shared-rate-limit.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
