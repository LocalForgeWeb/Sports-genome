# Deployment environment

The production deployment is a Vercel project (`sports-genome`, team `local-b96d`)
linked to `LocalForgeWeb/Sports-genome`. The client builds to `dist/public`; the API
is a single bundled serverless function at `api/[...path].js`, re-exported from
`dist/serverless.js`.

## Settings the deployment needs

These are set in the Vercel project under **Settings → Environment Variables**. Nothing
in the repository holds their values, and nothing should.

| Setting | What stops working without it | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Every research-backed surface: the approved norms registry, the evidence library, the sport profile. The API answers, but with empty results. | `https://qiccnqkypbhlwpmjcsri.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as above — the registry reads behind the service role, because `app_reference_eligibility` and the norms tables are not browser-readable and should not be. It also turns off **targeted capacity**: `resilience.targetCatalog` answers `unavailable`, so the "something you want stronger / anything going on there right now" step in onboarding and the same card in the profile collapse to a boundary sentence with nothing selectable. The 26 rows in `app_resilience_target_catalog_v1` are there and correct; nothing can read them. | Supabase → project `qiccnqkypbhlwpmjcsri` → Settings → API → `service_role` |
| `DATABASE_URL` | Accounts and anything saved to one: workout sessions, saved tests, favourites, priorities. Device-local records still work. | The MySQL connection string |
| `OWNER_OPEN_ID` | Owner-only routes. | The owner's open id |

`VITE_SUPABASE_URL` is read by the server (`server/normsRegistry.ts` and the other
Supabase adapters), despite the `VITE_` prefix. The prefix is historical; it is not a
browser-exposed value in any code path that matters, and the service-role key never
leaves the function.

`VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` are optional. The analytics
tag is emitted only when both are set, so leaving them unset ships no tag at all
rather than a broken one.

## Checking what is configured, without credentials

`GET /api/trpc/strengthGenome.referenceRegistryStatus` reports the registry's own
connection state. It names missing settings but never their values, and any
credential quoted by a transport error is redacted before it is returned.

```
{"result":{"data":{"json":{
  "available": false,
  "approvedCutPointCount": 0,
  "exerciseNames": [],
  "referenceFamilies": [],
  "connection": {"state":"unconfigured","missingSettings":["VITE_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"]}
}}}}
```

- `unconfigured` — a setting was never provided. `missingSettings` says which.
- `unreachable` — both settings exist, but the last lookup failed. `detail` carries the
  backend's own message.
- `connected` — the registry is reading. `approvedCutPointCount` then tells you whether
  anything has actually been approved, which is a separate question from connectivity.

An empty registry is never an error state for an athlete: every observation resolves to
an explicit "no comparison available", and the workspace says the library is offline
rather than implying the lift failed a gate.

Targeted capacity has no status route of its own; read its catalog directly. A healthy
answer is `"status":"connected"` with a non-empty `targets` array.

```
GET /api/trpc/resilience.targetCatalog
{"result":{"data":{"json":{"status":"unavailable","targets":[],"boundary":"…"}}}}
```

`unavailable` here means the same thing as `unconfigured` above and has the same single
cause in practice: the service-role key is not set on the deployment. It is not a
failure of the Supabase data — check `select count(*) from app_resilience_target_catalog_v1`
before looking anywhere else.

## Why the API had to be bundled

Vercel transpiles TypeScript functions without bundling them. Under `"type": "module"`
Node's ESM resolver requires file extensions, so the emitted `../server/routers` import
failed with `ERR_MODULE_NOT_FOUND` on every invocation. `pnpm build` now runs esbuild
over `server/_core/serverless.ts` and the function re-exports the bundle, which has no
internal specifiers left to resolve.

The `/api/trpc/:path*` rewrite is also explicit rather than relying on the catch-all:
under the `vite` framework preset the catch-all matched only a single path segment, so
`/api/anything` reached the function and `/api/trpc/healthcheck` did not. The rewrite
carries the procedure through as `__trpc`, and a normalizer in the function restores
the tRPC mount path. `server/apiDeployment.test.ts` pins both halves.
