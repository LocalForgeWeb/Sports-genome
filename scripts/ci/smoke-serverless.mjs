// CI04/CI05/CI06: the BUILT artifacts behave, not just the sources. Run after `pnpm build`.
// Loads the function exactly as the platform does (api/[...path].js re-exporting
// dist/serverless.js), serves it on a local port, and checks the answers a deployment depends on.
// Also checks the client build: every asset index.html references exists, so a deploy cannot
// ship a shell that points at missing chunks. No network beyond localhost; no secrets needed.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`); if (!ok) failures.push(name); };

// Client build: the shell and everything it references.
const html = readFileSync(resolve('dist/public/index.html'), 'utf8');
const referenced = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
check('index.html references hashed assets', referenced.length >= 2, `${referenced.length} referenced`);
const missing = referenced.filter((path) => !existsSync(resolve('dist/public' + path)));
check('every asset index.html references exists in the build', missing.length === 0, missing.join(', '));

// The function, loaded through the platform's own entry file.
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.NODE_ENV = 'production';
process.env.HEALTH_CHECK_TOKEN = 'ci-smoke-token';
const handler = (await import(pathToFileURL(resolve('api/[...path].js')).href)).default;
check('api/[...path].js resolves the bundle (no ERR_MODULE_NOT_FOUND)', typeof handler === 'function');
const server = handler.listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
const get = (path, init) => fetch(base + path, init);

const health = await get('/api/health');
const healthBody = await health.json().catch(() => null);
check('GET /api/health is the backend, in JSON', health.status === 200 && healthBody?.status === 'ok' && health.headers.get('content-type')?.includes('json'));
check('readiness is hidden without its token', (await get('/api/health/ready')).status === 404);
const ready = await get('/api/health/ready', { headers: { 'x-health-token': 'ci-smoke-token' } });
check('readiness without Supabase config says degraded (503), not ready', ready.status === 503);
const unknownApi = await get('/api/no-such-route?x=1');
check('unknown /api path: JSON 404 without the query echoed', unknownApi.status === 404 && JSON.stringify(await unknownApi.json()) === JSON.stringify({ error: 'Not found', path: '/api/no-such-route' }));
const unknownProc = await get('/api/trpc/no.such.procedure');
check('unknown tRPC procedure: 404, not cached', unknownProc.status === 404 && unknownProc.headers.get('cache-control') === 'no-store');
const malformed = await get('/api/trpc/auth.logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
check('malformed JSON: 400 JSON, no stack trace', malformed.status === 400 && !/<html|\.js:\d+/i.test(await malformed.text()));
const form = await get('/api/trpc/auth.logout', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' });
check('non-JSON mutation: 415', form.status === 415);
check('unsupported method on a known path: 404 JSON', (await get('/api/health', { method: 'DELETE' })).status === 404);
const share = await get('/api/x?__sharePage=not-a-real-token');
check('share page for an unknown token: HTML, never cached', share.status === 200 && share.headers.get('cache-control') === 'no-store' && (await share.text()).includes('<html'));
check('every response carries a request id', Boolean(health.headers.get('x-request-id')) && Boolean(unknownApi.headers.get('x-request-id')));

server.close();
if (failures.length) { console.error(`\n${failures.length} smoke check(s) failed`); process.exit(1); }
console.log('\nserverless smoke: all checks passed');
