# Backend V1 verification

Commands actually run, fixtures, numeric traces and integration results (B005, B297). A test is listed as passed only when it was run; environment and device limits are stated with each result.

## Environments available to this assignment

| Environment | Reachable from the work environment | Notes |
|---|---|---|
| Supabase `qiccnqkypbhlwpmjcsri` | Yes, through the Supabase MCP tools (read-only queries and advisors) | The shell cannot reach `*.supabase.co`; the local dev server therefore cannot reach Supabase. |
| MySQL (`DATABASE_URL`) | No | No credentials in the work environment; account-saved paths are verified with unit/integration tests against mocks and by code reading, and are marked accordingly. |
| Vercel production (`sports-genome-mauve.vercel.app`) | Deploy state through the Vercel tools | Deploys follow the existing PR → squash merge → Vercel flow. |
| Desktop / simulated mobile | Yes: headless Chromium (Playwright) at phone widths | Browser emulation, not a physical phone. |
| Actual iOS build | No | No native shell on `main` (decisions D-003). |
| App Store sandbox | Not applicable | Payments deferred by owner (D-001). |

## Baseline before any Backend V1 change (B022)

`main` at 52c8f52, 28 September 2026, work environment above.

```text
npx tsc --noEmit            -> exit 0
npx vitest run              -> 236 files: 232 passed, 4 failed; 1932 tests: 1926 passed, 1 skipped, 5 failed, all live-Supabase credential/network tests
                               (server/supabaseEvidenceConnection x2, supabaseEvidenceRls, supabasePublicAssets, supabaseStorageConnection)
                               that need credentials and network this environment lacks; identical before this assignment.
```

Numeric baseline for the strength route, live database (from PR #67): male Barbell Bench Press, 81.65 kg x 1 at 65.77 kg body weight -> 48.97th percentile with no age (see decisions D-002 for the age traces).

## Checkpoints

Format from brief §17.

```text
Current branch/commit and environment: claude/training-day-navigation-workouts-83ro2c at main 52c8f52; work environment as above.
Requirements completed and evidence: B001, B012 verified; records seeded (status.md).
Current confirmed failure/root cause: none yet — discovery running.
Files/migrations changed but not verified: docs only.
Tests run and actual results: none in this checkpoint.
Open transactions/jobs or rollout state, if any: none.
Next concrete action: collect the five discovery parts, then P0 repairs.
Access/decision blockers: MySQL unreachable; no iOS shell on main.
```
