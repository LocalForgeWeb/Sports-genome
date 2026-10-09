// CI12/OBS06: post-deploy smoke check for a live deployment. READ-ONLY - it writes nothing,
// so it is safe to run repeatedly against production or any preview:
//   node scripts/ops/smoke-deploy.mjs https://sports-genome-local-b96d.vercel.app
// Optional: HEALTH_CHECK_TOKEN=... also checks /api/health/ready (dependency readiness).
// Exits non-zero when any check fails; prints one line per check and the release it saw.
const base = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) { console.error('usage: node scripts/ops/smoke-deploy.mjs <https://deployment>'); process.exit(2); }
const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`); if (!ok) failures.push(name); };
const get = (path, init = {}) => fetch(base + path, { redirect: 'manual', ...init, headers: { 'x-request-id': `smoke-${Date.now()}`, ...(init.headers || {}) } });

const root = await get('/');
const html = await root.text();
check('root serves the app shell', root.status === 200 && html.includes('<div id="root">'));
for (const name of ['x-content-type-options', 'x-frame-options', 'content-security-policy', 'content-security-policy-report-only', 'referrer-policy', 'strict-transport-security']) {
  check(`security header ${name}`, Boolean(root.headers.get(name)));
}
check('nested app route serves the shell', (await get('/?workspace=progress&session=smoke')).status === 200);

const chunk = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
const asset = chunk ? await get(chunk) : null;
check('the shell\'s entry chunk loads as JavaScript', asset?.status === 200 && /javascript/.test(asset.headers.get('content-type') || ''), chunk || 'no chunk found');
check('hashed assets are cached immutably', /immutable/.test(asset?.headers.get('cache-control') || ''), asset?.headers.get('cache-control') || '');
const missing = await get('/assets/smoke-missing-chunk.js');
check('a missing asset is a 404, not the HTML shell', missing.status === 404, `status ${missing.status}, ${missing.headers.get('content-type')}`);

const health = await get('/api/health');
const body = await health.json().catch(() => null);
check('/api/health reaches the backend (JSON, not the shell)', health.status === 200 && body?.status === 'ok', body ? `release ${body.release?.commit} (${body.release?.environment})` : `status ${health.status}`);
check('API responses are not cacheable', health.headers.get('cache-control') === 'no-store');
check('responses carry a request id', Boolean(health.headers.get('x-request-id')));
if (process.env.HEALTH_CHECK_TOKEN) {
  const ready = await get('/api/health/ready', { headers: { 'x-health-token': process.env.HEALTH_CHECK_TOKEN } });
  const readyBody = await ready.json().catch(() => null);
  check('dependencies ready', ready.status === 200, JSON.stringify(readyBody?.dependencies ?? readyBody));
}
const unknown = await get('/api/no-such-route');
check('unknown /api path is a JSON 404', unknown.status === 404 && /json/.test(unknown.headers.get('content-type') || ''));
check('unknown tRPC procedure is a 404', (await get('/api/trpc/no.such.procedure')).status === 404);
check('a form-encoded mutation is refused (415)', (await get('/api/trpc/auth.logout', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'a=1' })).status === 415);
const share = await get('/s/smoke-not-a-real-token');
check('an unknown share link still opens the app, uncached', share.status === 200 && share.headers.get('cache-control') === 'no-store');

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
