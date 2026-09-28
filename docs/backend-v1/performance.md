# Backend V1 performance

Latency and request counts for the six flows in brief B231, under stated conditions (B232), and what the investigation found (B233). These are client measurements in a sandbox browser. **They are not a production SLA and say nothing about server or network time.**

## Conditions

| | |
|---|---|
| Build | The production client bundle (`npm run build`, `dist/public`) at batch 10, served by `serve -s` on localhost |
| Browser | Headless Chromium 1194 (Playwright), viewport 390 × 844 (phone width), no network throttling |
| Machine | Sandbox container, Intel Xeon @ 2.10 GHz, 4 vCPU, Linux 6.18, Node 22.22.2 |
| CPU | 1× (unthrottled) and 4× slower (`Emulation.setCPUThrottlingRate`), a common stand-in for a mid-range phone, not a measurement of one |
| API | `/api/trpc` answered inside the page, with no delay, the way the server's code answers a visitor without an account (auth.me null, protected routes 401, everything else empty). **Server time is excluded.** |
| Access mode | The device stores (`directWorkspaceAccess`), as shipped |
| Fixtures | *empty*: a profile only. *loaded*: a year of training, 104 finished workouts (5 lifts × 3 sets each) and 40 typed lifts, with sex and birth year on the profile |
| Cold / warm | Cold: a new browser context each run (empty HTTP cache; storage seeded before the first script runs). Warm: a reload in the same context (assets cached) |
| Timing | Inside the page. Home: from navigation start to the first animation frame in which "Your next workout" is laid out. Other flows: from the action, dispatched in the page, to the first frame in which its result is laid out (16 ms granularity) |
| Runs | 10 per row; p50 and p95 by nearest rank (with 10 runs, p95 is the slowest run) |
| Script | `scripts/perf/measure-client.cjs`; raw results of this run in `performance-run-2026-09-28.json` (re-run: `serve -s dist/public -l 4173`, then `node scripts/perf/measure-client.cjs http://localhost:4173 10`) |

An earlier run timed with Playwright's own waits reported every short flow at about 400–460 ms. Those waits poll with a back-off of up to 500 ms, so the numbers were the poll interval, not the app. They are discarded; the table below is the in-page run.

## Results

| Flow | Fixture | CPU | p50 ms | p95 ms | min–max ms | Requests (tRPC procedures) |
|---|---|---|---|---|---|---|
| Open Home, cold (new browser context) (FCP p50 2340 ms) | loaded | 1× | 2315 | 2431 | 2138–2431 | 4: auth.me, resilience.targetCatalog, sportsGenome.profile, strengthGenome.referenceRows |
| Open Home, cold (new browser context) (FCP p50 3796 ms) | loaded | 4× slower | 3751 | 3895 | 3547–3895 | 4: auth.me, resilience.targetCatalog, sportsGenome.profile, strengthGenome.referenceRows |
| Open Home, warm (reload, cached assets) | loaded | 1× | 605 | 676 | 461–676 | 4: auth.me, resilience.targetCatalog, sportsGenome.profile, strengthGenome.referenceRows |
| Open Home, warm (reload, cached assets) | loaded | 4× slower | 1553 | 1746 | 1413–1746 | 4: auth.me, resilience.targetCatalog, sportsGenome.profile, strengthGenome.referenceRows |
| Search exercises (type "romanian" → first result) | loaded | 1× | 28 | 35 | 23–35 | 0: none |
| Search exercises (type "romanian" → first result) | loaded | 4× slower | 122 | 166 | 109–166 | 0: none |
| Add to plan (tap Add → Undo confirmation in the page) | loaded | 1× | 38 | 50 | 35–50 | 0: none |
| Add to plan (tap Add → Undo confirmation in the page) | loaded | 4× slower | 188 | 262 | 143–262 | 0: none |
| Open Training Day with coverage (3 exercises → gap rows shown) | loaded | 1× | 333 | 347 | 327–347 | 0: none |
| Open Training Day with coverage (3 exercises → gap rows shown) | loaded | 4× slower | 455 | 482 | 424–482 | 0: none |
| Save a set (tap Log set 1 → set 2 ready) | loaded | 1× | 25 | 40 | 21–40 | 0: none |
| Save a set (tap Log set 1 → set 2 ready) | loaded | 4× slower | 101 | 176 | 84–176 | 0: none |
| Open Strength (tap → body map shown) | loaded | 1× | 367 | 395 | 333–395 | 4: researchEvidence.supabaseInventory, strengthGenome.powerliftingNorms, strengthGenome.referenceRegistryStatus, strengthProfile.muscleRanks |
| Open Strength (tap → body map shown) | loaded | 4× slower | 564 | 770 | 467–770 | 4: researchEvidence.supabaseInventory, strengthGenome.powerliftingNorms, strengthGenome.referenceRegistryStatus, strengthProfile.muscleRanks |
| Open Home, cold (new browser context) (FCP p50 2268 ms) | empty | 1× | 2232 | 2330 | 2103–2330 | 4: auth.me, resilience.targetCatalog, sportsGenome.profile, strengthGenome.referenceRows |
| Open Home, cold (new browser context) (FCP p50 3524 ms) | empty | 4× slower | 3485 | 3863 | 3300–3863 | 4: auth.me, resilience.targetCatalog, sportsGenome.profile, strengthGenome.referenceRows |
| Open Strength (tap → body map shown) | empty | 1× | 328 | 336 | 323–336 | 3: researchEvidence.supabaseInventory, strengthGenome.powerliftingNorms, strengthGenome.referenceRegistryStatus |
| Open Strength (tap → body map shown) | empty | 4× slower | 429 | 518 | 400–518 | 3: researchEvidence.supabaseInventory, strengthGenome.powerliftingNorms, strengthGenome.referenceRegistryStatus |

Runs per row: 10. Node v22.22.2. Measured 2026-09-28T19:14:17.511Z.

Reading it: every in-screen action (search, add, log a set) lands within a frame or two at 1× and stays under 0.3 s at 4×. Opening Training Day or Strength for the first time takes about 0.33–0.37 s, most of it loading that screen's code. The cost is the cold start: about 2.3 s to first paint on this machine with no network at all, the same with an empty device as with a year of data (finding 2).

## Findings (B233)

| # | Finding | Evidence | State |
|---|---|---|---|
| 1 | Home and Progress asked three account-only routes on every open with no account; each refusal raised "Your sign-in has expired" | Reproduced against the production bundle; production returns 401 for all three (D-015) | **Fixed.** Home: 7 procedures in 2 batches → 4 in 1 |
| 2 | Cold start is dominated by JavaScript, not data: first paint at about 2.3 s even locally, and the same with an empty or a loaded device | Home cold, empty vs loaded fixture, in the table | Recorded (Perf-1). The first load parses `App` 956 KB (236 KB gzipped), `movement-data` 815 KB (137 KB), CSS 506 KB (78 KB), `framework` 194 KB and the entry 135 KB. `movement-data` holds every sport's actions and is imported statically, so it loads for athletes with no sport. Lazy-loading it and the Body Lab explorer is the first lever |
| 3 | A general athlete's Home asks `sportsGenome.profile` for the fallback sport on every open (a costly public route that fans out to Supabase) | Request list, Home rows | Recorded (Perf-2). Its evidence grounds that sport's movement suggestions in the explorer, so the fix is to ask when the explorer opens |
| 4 | Home and Strength download the whole approved reference registry (`strengthGenome.referenceRows`) | Request list | By design (matching runs on the device so a lift never leaves it), cached for an hour. Its size needs `measure-api.cjs` against the deployment; if it is large, split it by exercise (B148) |
| 5 | Opening Strength with lifts asks `strengthProfile.muscleRanks`, which fans out up to 61 Supabase calls | Request list; server limits in inventory SV-02 | Bounded (30 lifts, rate-limited, cached 5 minutes) since batch 1 |
| 6 | Duplicate catalog names: searching "romanian" shows two identical "Romanian Deadlift" cards | Seen while scripting the search flow | Recorded (EN-24) |
| — | Recomputation on unrelated state changes | Not profiled | **Not investigated.** No React profiler run was made; the flows above are fast enough on this machine that nothing pointed at it |

## Not measured

- **Server and database latency in production.** This environment's shell cannot reach the deployment; Vercel's aggregated function metrics need Observability Plus; the one owner-approved production probe went through a tool that reports no timings. `scripts/perf/measure-api.cjs https://<deployment> 10` measures the public routes behind these flows (cold and warm p50/p95, payload bytes) from any machine that can reach it.
- Account-backed flows (MySQL unreachable), a real phone, the iOS WebView (no shell on `main`), network transfer time.
