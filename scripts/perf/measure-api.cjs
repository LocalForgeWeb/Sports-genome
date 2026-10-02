/**
 * Server latency and payload size for the public routes behind the B231 flows, against a
 * deployed URL (B232). Complements measure-client.cjs, which cannot reach a server.
 *
 * Usage: node scripts/perf/measure-api.cjs https://<deployment> [runs]
 *
 * Each route is called `runs` times in sequence; the first call is reported separately as the
 * cold one (a new function instance and empty in-memory caches are likely but not guaranteed),
 * the rest as warm p50/p95. Costly routes are spaced 700 ms apart to stay inside the server's
 * per-client allowance (120 calls a minute on each instance). Read-only: every route is a query.
 */
const BASE = (process.argv[2] || "").replace(/\/$/, "");
const RUNS = Number(process.argv[3] || 10);
if (!BASE) { console.error("usage: node scripts/perf/measure-api.cjs https://<deployment> [runs]"); process.exit(1); }

const trpcGet = (path, input) => `${BASE}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input ?? null }))}`;

const lift = { catalogExerciseId: 1, exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, bodyMassKg: 80, ageYears: 30 };
const routes = [
  { name: "auth.me (Home)", url: trpcGet("auth.me") },
  { name: "resilience.targetCatalog (Home)", url: trpcGet("resilience.targetCatalog") },
  { name: "strengthGenome.referenceRows (Home, Strength)", url: trpcGet("strengthGenome.referenceRows") },
  { name: "sportsGenome.profile (Home)", url: trpcGet("sportsGenome.profile", { sportId: "wrestling" }), costly: true },
  { name: "strengthPercentile.forLift (Strength record)", url: trpcGet("strengthPercentile.forLift", { ...lift, sex: "male" }), costly: true },
  { name: "strengthProfile.muscleRanks (Strength map)", url: trpcGet("strengthProfile.muscleRanks", { sex: "male", lifts: [lift] }), costly: true },
];

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const rows = [];
  for (const route of routes) {
    const samples = [];
    let bytes = 0;
    let status = 0;
    for (let run = 0; run < RUNS; run++) {
      const t0 = performance.now();
      const response = await fetch(route.url, { headers: { accept: "application/json" } });
      const body = await response.arrayBuffer();
      samples.push(Math.round(performance.now() - t0));
      bytes = body.byteLength;
      status = response.status;
      if (route.costly) await pause(700);
    }
    const warm = samples.slice(1).sort((a, b) => a - b);
    rows.push({ route: route.name, status, bytes, cold: samples[0], warmP50: warm.length ? pct(warm, 50) : null, warmP95: warm.length ? pct(warm, 95) : null });
    console.error(`${route.name}: ${status}, ${bytes} B, cold ${samples[0]} ms, warm p50 ${rows.at(-1).warmP50} ms`);
  }
  console.log(JSON.stringify({ base: BASE, runs: RUNS, node: process.version, when: new Date().toISOString(), rows }, null, 2));
})();
