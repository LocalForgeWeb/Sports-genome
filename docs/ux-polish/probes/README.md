# Polish probes

Scripts behind the before/after sets and the checks in `../progress.md`. Same requirements as `../../ux-correction/probes/README.md` (a build served at :4173, Playwright and Chromium at the paths named at the top of each script). Browser emulation, not a physical phone.

| Script | What it does |
| --- | --- |
| `polish-shots.mjs <folder>` | Every main surface at 390×844 into a folder (`../before`, `../after`). |
| `desk.mjs` | Muscle map and the exercise overlay at 1280. |
| `perf.mjs` | PERF-01: cold and warm time to Home's action, transferred JS/CSS, one catalog query, one anatomy selection, one set log; median of three. |
| `polish-qa.mjs` | Count copy, recently viewed, no-result suggestions and filter removal, next-exercise cue, carried values, finish → View record, reorder Undo, region → Log a lift, ⌘K. |
| `polish-qa2.mjs` | Landscape logging, reduced motion, a blocked image, a slow server. |
| `compare-qa.mjs` | Compare sheet (11B), day-wide rest with Undo (11C), one front/back control, a 137.5 lb set, the sign-in-expired notice. |
| `reqaudit.mjs` | tRPC procedures requested per navigation (duplicates), and state across a 390 → 1280 → 390 resize. |
| `layoutaudit.mjs` | Left edges, section rhythm and icon sizes per page. |
| `tickcost.mjs` | DOM mutations in five seconds of rest-clock ticking. |
