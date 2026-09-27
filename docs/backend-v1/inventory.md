# Backend V1 inventory

The system as found on 27 September 2026 (`main` at 52c8f52), before this assignment changed anything. Each part below was produced by reading the code and querying the live database read-only; findings are marked CONFIRMED or HYPOTHESIS in the parts.

## Architecture in one paragraph

A React 19 + TypeScript + Vite client (`client/src`, one page component `client/src/pages/Home.tsx` owning every workspace) talks to an Express + tRPC v11 server (`server/`) deployed as a single Vercel serverless function (`api/[...path].js` → `dist/serverless.js`). Accounts and account-saved records are in MySQL through Drizzle (`drizzle/schema.ts`, migrations 0000–0010). Research and reference data — norms, curves, evidence, the exercise and muscle catalog, scoring functions — are in Supabase project `qiccnqkypbhlwpmjcsri`, read server-side with the service role. Day-to-day records currently live on the device (`directWorkspaceAccess = true`). Deployment settings: `deployment_environment.md`.

## Parts

| Part | Scope | File |
|---|---|---|
| Supabase | schemas, tables, views, functions, policies, grants, storage, advisors, research dataset counts, app consumers | [inventory/supabase.md](inventory/supabase.md) |
| App server and MySQL | auth, every tRPC procedure, ownership and idempotency, schema, migrations, secrets | [inventory/server.md](inventory/server.md) |
| Client persistence | storage keys, authority per record, session lifecycle, add/Undo, sync, seeds, launch state | [inventory/persistence.md](inventory/persistence.md) |
| Calculation engines | strength, muscle effect, coverage, recommendations, sports transfer, duplications, units | [inventory/engines.md](inventory/engines.md) |
| Traces | one lift, one addition, one coverage value, one rank, input to display; the B115 gap discrepancy | [inventory/traces.md](inventory/traces.md) |

## Versions (B021)

| Component | Version |
|---|---|
| Node | 22.22.2 |
| TypeScript | 5.9.3 |
| React | ^19.2.1 |
| Vite | ^7.1.7 |
| tRPC server/client | ^11.6.0 |
| TanStack Query | ^5.90.2 |
| zod | ^4.1.12 |
| Express | ^4.21.2 |
| Drizzle ORM / kit | ^0.44.5 / ^0.31.4 (MySQL, mysql2 ^3.15.0) |
| supabase-js | ^2.116.0 |
| Postgres (Supabase) | 17.6 |
| vitest | ^2.1.4 |

## iOS

See decisions D-003: no native shell on `main`; the Capacitor work sits on an unmerged branch with unrelated history.
