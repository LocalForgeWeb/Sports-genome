// Oct 6 brief §2, §7 (media): the shared ExerciseMedia component in the production build, in
// headless Chromium against `vite preview`. Third-party photo hosts are served from a curl cache
// of the pinned commit (the sandbox reaches raw.githubusercontent.com only); the thumbnails are
// the app's own files. Viewport emulation, not a phone.
import { writeFileSync } from 'node:fs';
import { browser, base, seed, page, wait, openExercise } from '../../exercise-intelligence/probes/shared.mjs';

const out = new URL('../evidence/', import.meta.url).pathname;
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass: Boolean(pass), detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
const rowState = (p, name) => p.evaluate((n) => { const row = [...document.querySelectorAll('.catalog-discovery-row')].find((r) => r.querySelector('strong')?.textContent?.trim() === n); const t = row?.querySelector('.exercise-media-thumb'); const img = t?.querySelector('img'); return { state: t?.dataset.state, src: img?.getAttribute('src') ?? null, loaded: img ? img.complete && img.naturalWidth > 0 : null, natural: img ? [img.naturalWidth, img.naturalHeight] : null }; }, name);
const searchCatalog = async (p, q) => { await p.goto(`${base}/?workspace=catalog`); await wait(p, 1500); await p.locator('.catalog-discovery input').first().fill(q); await wait(p, 1200); };

// 1. Rows load the same-origin thumbnail, at its small size, and nothing from the photo CDN.
{
  const [ctx, p] = await page(390, 844);
  const cdn = []; p.on('request', (r) => { if (/free-exercise-db/.test(r.url())) cdn.push(r.url()); });
  await seed(p);
  await searchCatalog(p, 'squat');
  await p.evaluate(() => window.scrollBy(0, 300)); await wait(p, 1200);
  const rows = await p.evaluate(() => [...document.querySelectorAll('.catalog-discovery-row')].slice(0, 10).map((r) => { const img = r.querySelector('.exercise-media-thumb img'); return { name: r.querySelector('strong')?.textContent?.trim(), state: r.querySelector('.exercise-media-thumb')?.dataset.state, src: img?.getAttribute('src'), w: img?.naturalWidth ?? 0 }; }));
  const photographed = rows.filter((r) => r.src);
  check('Catalog rows load same-origin thumbnails (/exercise-thumbs/), each painted', photographed.length > 3 && photographed.every((r) => r.src.startsWith('/exercise-thumbs/') && r.w > 0 && r.state === 'photo'), photographed.map((r) => `${r.name}:${r.w}px`).join(', '));
  check('Thumbnails are small (≤ 264 px wide), not the 850 px source', photographed.every((r) => r.w <= 264));
  check('No photo-CDN request for a list of rows', cdn.length === 0, `${cdn.length} CDN requests`);
  const back = await rowState(p, 'Back Squat');
  check('Back Squat row shows its own photo (Barbell_Squat)', back.src === '/exercise-thumbs/Barbell_Squat.jpg' && back.loaded, JSON.stringify(back));
  await p.screenshot({ path: `${out}catalog-squat-thumbs-390.png` });
  await searchCatalog(p, 'sissy squat');
  const sissy = await rowState(p, 'Sissy Squat');
  check('Sissy Squat row shows its own photo (Weighted_Sissy_Squat)', sissy.src === '/exercise-thumbs/Weighted_Sissy_Squat.jpg' && sissy.loaded, JSON.stringify(sissy));
  for (const name of ['Seal Row', 'Pendlay Row', 'Bulgarian Split Squat', 'Kettlebell Swing']) {
    await searchCatalog(p, name);
    const state = await rowState(p, name);
    check(`Withdrawn photo: ${name} shows the equipment placeholder, no image`, state.state === 'placeholder' && state.src === null, JSON.stringify(state));
  }
  await p.screenshot({ path: `${out}catalog-withdrawn-placeholder-390.png` });
  await ctx.close();
}

// 2. Detail view: both frames from the CDN; the box is reserved before the bytes arrive.
{
  const [ctx, p] = await page(390, 844);
  await seed(p);
  await p.route(/free-exercise-db/, async (route) => { await new Promise((r) => setTimeout(r, 2500)); return route.fallback(); });
  await openExercise(p, 'Sissy Squat');
  await p.locator('.exercise-intelligence .exercise-media-detail').first().scrollIntoViewIfNeeded().catch(() => {});
  await wait(p, 400);
  const slow = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence .exercise-media-frame')].map((f) => ({ state: f.dataset.state, h: Math.round(f.getBoundingClientRect().height), icon: Boolean(f.querySelector('.exercise-media-icon')) })));
  check('Slow photo: frames hold their reserved size and show the icon while loading', slow.length === 2 && slow.every((f) => f.state === 'loading' && f.h > 80 && f.icon), JSON.stringify(slow));
  await p.screenshot({ path: `${out}detail-slow-loading-390.png` });
  await wait(p, 4000);
  const later = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence .exercise-media-frame')].map((f) => ({ state: f.dataset.state, h: Math.round(f.getBoundingClientRect().height), ok: f.querySelector('img')?.naturalWidth > 0, src: f.querySelector('img')?.getAttribute('src')?.split('/exercises/')[1] })));
  check('…then both frames paint, at the same size (no layout shift)', later.every((f) => f.state === 'photo' && f.ok) && later.every((f, i) => f.h === slow[i].h), JSON.stringify(later));
  check('Sissy Squat detail shows Weighted_Sissy_Squat start and finish', later.map((f) => f.src).join(',') === 'Weighted_Sissy_Squat/0.jpg,Weighted_Sissy_Squat/1.jpg');
  await p.screenshot({ path: `${out}detail-sissy-squat-390.png` });
  await ctx.close();
}

// 3. Unreachable everywhere: placeholder, a message and Retry; Retry loads once the hosts answer.
{
  const [ctx, p] = await page(390, 844);
  await seed(p);
  let blocked = true;
  await p.route(/free-exercise-db/, (route) => (blocked ? route.abort() : route.fallback()));
  await openExercise(p, 'Back Squat');
  await p.locator('.exercise-intelligence .exercise-media-detail').first().scrollIntoViewIfNeeded().catch(() => {}); await wait(p, 1500);
  const caption = await p.locator('.exercise-intelligence .exercise-media-detail figcaption').first().textContent();
  const retry = p.locator('.exercise-intelligence .exercise-media-retry').first();
  check('Unreachable: "The photographs could not be loaded." with a Retry button, no broken image', caption.includes('The photographs could not be loaded.') && await retry.count() === 1 && await p.locator('.exercise-intelligence .exercise-media-detail img').count() === 0, caption);
  await p.screenshot({ path: `${out}detail-unreachable-retry-390.png` });
  blocked = false;
  await retry.click(); await wait(p, 2500);
  const after = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence .exercise-media-frame img')].map((img) => ({ ok: img.naturalWidth > 0, src: img.getAttribute('src').split('/exercises/')[1] })));
  check('Retry asks again and both Back Squat frames load (Barbell_Squat)', after.length === 2 && after.every((f) => f.ok && f.src.startsWith('Barbell_Squat/')), JSON.stringify(after));
  await ctx.close();
}

// 4. Invalid bytes (an HTML page served as the photo): the second host is tried, then the placeholder.
{
  const [ctx, p] = await page(390, 844);
  await seed(p);
  await p.route(/cdn\.jsdelivr\.net.*free-exercise-db/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html>not an image</html>' }));
  await openExercise(p, 'Front Squat');
  await p.locator('.exercise-intelligence .exercise-media-detail').first().scrollIntoViewIfNeeded().catch(() => {}); await wait(p, 2500);
  const frames = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence .exercise-media-frame img')].map((img) => ({ ok: img.naturalWidth > 0, host: new URL(img.src).host })));
  check('Invalid response from the CDN: the second host serves the real photo', frames.length === 2 && frames.every((f) => f.ok && f.host === 'raw.githubusercontent.com'), JSON.stringify(frames));
  // A same-origin thumbnail that fails falls back to the full frame.
  await p.route('**/exercise-thumbs/**', (route) => route.fulfill({ status: 404, body: '' }));
  await searchCatalog(p, 'front squat');
  const row = await rowState(p, 'Front Squat');
  check('A missing thumbnail falls back to the full frame on the second host', row.loaded && /raw\.githubusercontent\.com/.test(row.src ?? ''), JSON.stringify(row));
  await ctx.close();
}

// 5. Widths: the catalog rows and the detail view keep their boxes and never scroll sideways.
for (const [w, h] of [[320, 640], [375, 812], [430, 932], [1280, 800]]) {
  const [ctx, p] = await page(w, h);
  await seed(p);
  await searchCatalog(p, 'squat');
  const fits = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && [...document.querySelectorAll('.exercise-media-thumb')].slice(0, 8).every((t) => { const r = t.getBoundingClientRect(); return r.width >= 60 && Math.abs(r.height - r.width * 2 / 3) < 2; }));
  check(`${w}px: thumbnails keep their 3:2 box, no sideways scroll`, fits);
  await p.screenshot({ path: `${out}catalog-${w}.png` });
  await ctx.close();
}

writeFileSync(`${out}media-acceptance.json`, JSON.stringify({ ranAt: new Date().toISOString(), environment: 'headless Chromium, vite preview of the production build; photo hosts served from a curl cache of the pinned commit', results }, null, 1));
console.log(`${results.filter((r) => r.pass).length}/${results.length} pass`);
await browser.close();
