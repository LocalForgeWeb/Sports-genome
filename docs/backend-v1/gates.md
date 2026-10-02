# Backend V1 release gates

This is the gate report required by brief §16 and §19 item 8. It records the state on `main` at 8be0ef3 (29 September 2026), which is also what production runs: `sports-genome-mauve.vercel.app`, deployment `dpl_Hx5yP4QzysDJdrHHSqnMKap2crkG`, READY. Each row's evidence is in `status.md`; this page gives the verdicts.

**Verdict: not launch-ready.**
- Gate A fails in production until the prepared Supabase migrations are applied.
- Gates B and D are partly unverified.
- Gate C is deferred by the owner.
- Gate E passes.

A long checklist, a clean compile and written code are not readiness (B296). Only what was run is reported as passed (B297).

| Gate | Row | Verdict | Evidence, and what would change it |
|---|---|---|---|
| **A: data and ownership** | B267 | **Fail (blocked)** | SB-07 (write grants with no policy) and SB-02 (check-in on another athlete's focus area) are open in production. Both reproduce on a live-equivalent schema (`supabase/prepared/backend_v1/validation/before.sql`), and the prepared migrations close them (`after.sql`). **To change it:** the owner applies them (handoff, decision 1). The MySQL routes are checked in code and mock tests only, because the database was unreachable. |
| | B268 | Unverified | Device paths are tested: one active session across tabs, restart mid-rest, refused finish stays open, and per-account plan storage with three-way sync. MySQL write paths and iOS app termination were not exercised. |
| | B269 | **Fail (blocked)** | A retried lift sync can duplicate until `client_op_id` (`20260928120500`) is applied with its client upsert. MySQL `workoutLog.start` and `workoutLog.complete` are not idempotent (SV-05). |
| | B270 | Unverified | Tested: legacy set units, per-account storage keys, and the Supabase migrations on a local copy, including re-apply. The MySQL migrations were not run against real data. |
| **B: internal logic** | B271 | Unverified | Strength placement, e1RM, load conventions, coverage and muscle ranks have contracts and fixtures pinned to database outputs. Open: the muscle aggregation coefficients are unsourced (EN-17), and the effect dimensions are heuristics (EN-22). |
| | B272 | Unverified | Unsupported inputs return reasons rather than scores. Open: the server supplies a confidence of 0.5 when a score has none (EN-17). |
| | B273 | Pass | The coverage summary, the analysis and the picker read one snapshot (`coverageConsistency.test.ts`). Card, trends and ranks share one estimator. The Sep 28 repair kept the model untouched: its model tests pass without edits, and the analysis now lists targets in the Plan's order. |
| | B274 | Pass | Each calculation change has before/after deltas in `decisions.md`, for example D-007 bench 100×5 e1RM 114.58/116.67 → 112.5. |
| | B275 | Pass | No coefficient was tuned. |
| **C: payments** | B276–B279 | **Deferred (owner)** | The owner deferred payments for this assignment (D-001). This is not a failure and does not block this assignment. Revenue collection is not ready, and nothing claims it is. |
| **D: consumer integration** | B280 | Pass | Every repaired contract is wired to its screens and was verified in the running app or production. |
| | B281 | Unverified | Simulated mobile (Chromium, 320–430 px, 100% and 125% text) passed these journeys on the device store: <br>• the brief's journeys, including Plan browsing → Home → open workout, an explicit day change, and an active session resumed across navigation and a reload (`docs/regression-sep28/`); <br>• the empty day, then a populated day; <br>• Matches add, Undo and View workout; <br>• Strength map consistency. <br>Not run: finishing a workout into Progress as one journey, any account-backed journey (MySQL unreachable), and iOS or WebKit. |
| | B282 | Unverified | Done: <br>• a refused finish stays open; <br>• a plan-sync conflict offers both choices; <br>• ranks have pending and partial states; <br>• the empty day reads "Not available yet" instead of 0/100; <br>• the sign-in notice fires once per lapse, with an action and a lasting status (Sep 28 repair). <br>Open: offline plan sync is still silent. |
| | B283 | Pass | Environments are recorded separately: desktop and simulated mobile (headless Chromium). No iOS build exists (D-003), and the store sandbox is deferred (D-001). |
| **E: maintainability** | B284 | Pass | At 8be0ef3: <br>• `tsc --noEmit` is clean; <br>• `vitest run` gives 2,539 passed, 1 skipped and 5 failed (the 5 need the Supabase network and fail identically on earlier `main`); <br>• `npm run build` passes. <br>Every behaviour change has a decision (D-001 to D-015) or a regression record (`docs/regression-sep28/`). Prepared migrations are labelled "not applied" throughout. |
| | B285 | Pass | `handoff.md` § Remaining defects ranks each risk and gives how to reproduce or verify it, with stable IDs. |
| | B286 | Pass | The baseline commands in `handoff.md` are the ones run for B284. The decisions, intentional changes and version map are all written down. |

## Counts

The row counts in `status.md` are as follows. The summary block is rewritten by `status_tool.py`.
- 30 `deferred (owner)`, all payments.
- Everything `pending` or `implementing` is unfinished V1 work, listed by area in `handoff.md` § "V1 requirements not done". It is not reclassified as V2 (B292).
