# Sports Genome Portability Migration

## Scope and result

Sports Genome’s active web interface now builds as a **standard Vite React application** and serves every currently referenced image and video from the public `sports-genome-assets` bucket in the existing Supabase project. The application no longer requires a Manus runtime plugin, a Manus storage redirect, Forge APIs, a Manus OAuth portal, or the Manus debug collector to build or render the athlete-facing interface.

This release deliberately does **not** rewrite working workout-planning, local device persistence, research-gating, animation, PWA, or visual-design code. Its purpose is controlled portability rather than an application redesign.

## Asset migration

All migrated objects preserve their existing filenames. Public object URLs take this form:

```text
https://qiccnqkypbhlwpmjcsri.supabase.co/storage/v1/object/public/sports-genome-assets/<filename>
```

| Purpose | Object filename |
|---|---|
| Command hero | `gym-optimizer-performance-lab_fc8df71f.jpg` |
| Circular header/onboarding badge | `sports-genome-circular-header-badge_8450998e.jpg` |
| Intro sequence video | `sports-genome-intro-source_07000a26.mp4` |
| Official sign-in mark | `sports-genome-official-logo-180_8085dfd8.png` |
| Intro DNA detail | `sports-genome-upright-dna-detail-exact_8e94e37f.png` |
| Intro S silhouette | `sports-genome-upright-s-silhouette-exact_349405db.png` |
| Favicon | `sports-genome-upright-s-dna-64_904d4b7b.png` |
| Apple touch icon | `sports-genome-upright-s-dna-180_c496e9d0.png` |
| PWA icon | `sports-genome-upright-s-dna-192_979589c2.png` |
| PWA icon | `sports-genome-upright-s-dna-512_1a0f292a.png` |
| Qualified Strength state visual | `strength-qualified-reference-state_3ccc4f09.png` |
| Unavailable Strength state visual | `strength-reference-unavailable-state_f08bbf9c.png` |

The shared `client/src/lib/sportsGenomeAssets.ts` map is the application’s canonical asset boundary. It uses `VITE_SUPABASE_URL` where supplied and has a non-secret fallback to the connected Supabase project URL so a standard Vite build does not emit blank asset paths.

## Removed or replaced platform dependencies

| Legacy dependency | Status | Portable replacement or disposition |
|---|---|---|
| `vite-plugin-manus-runtime` | Removed | Standard `@vitejs/plugin-react` plus `@tailwindcss/vite` configuration. |
| `@builder.io/vite-plugin-jsx-loc` | Removed | Source-location instrumentation was development-only and not required by the product. |
| Manus browser debug collector | Removed | Deleted `client/public/__manus__` collector assets and Vite middleware that received `/__manus__/logs`. |
| `/manus-storage/*` visual URLs | Replaced | Public Supabase Storage object URLs via `sportsGenomeAssets`. |
| Forge S3 presigning helper | Removed | `server/storage.ts` was unused after the visual migration. No athlete-facing upload flow currently requires a storage helper. |
| Forge image generation helper | Removed | Unused template infrastructure; it had no caller in the app. Future AI image generation must use a separately configured provider and a server-only secret. |
| Forge data, map, transcription, LLM, notification, and heartbeat helpers | Removed | Unused template infrastructure with no active Sports Genome caller. |
| Forge-backed Google Maps component | Removed | Unused client template component. |
| Manus storage proxy route | Removed | All active asset references point directly to Supabase. |
| Manus OAuth routes, SDK, and client OAuth utility | Removed | Current email/password and WebAuthn/passkey flow remains standard Express/tRPC code. |
| Manus system notification router | Removed | Unused template endpoint. |
| Manus environment abstraction | Removed | Active MySQL user-admin comparison reads the standard `OWNER_OPEN_ID` process environment variable directly. |

## Deployment architecture

### Static frontend on Vercel

`vercel.json` deploys `dist/public` and sends deep links to `index.html`, so the Wouter single-page interface can resolve its own routes. Vercel needs no Manus runtime or Forge variable for this static frontend. Configure `VITE_SUPABASE_URL` in Vercel if a deployment should target a Supabase project other than the included non-secret project URL. The public `VITE_SUPABASE_PUBLISHABLE_KEY` is not required solely to display the public asset bucket, but is the correct browser-safe credential for a later direct Supabase client integration.

```bash
pnpm install --frozen-lockfile
pnpm build
```

### Current backend boundary

The repository still includes an ordinary Express/tRPC server and existing MySQL/Drizzle local-email/passkey implementation. Those authenticated APIs require a separately deployed standard Node service with `DATABASE_URL` and any related non-public environment variables. The static Vercel configuration intentionally does **not** claim to deploy those APIs.

The frontend’s planner, catalog, visual assets, animation, PWA manifest, and device-local workflow remain independently renderable without that server. When the backend moves to Supabase, replace or migrate the current MySQL local-auth/tRPC persistence deliberately; do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## Security boundary

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It is used by the integration connection test and was used for the one-time bucket transfer; it is not imported into browser code and must not be committed. Public Storage URLs and the project URL are not secret. The bucket’s public-read posture is intentional for static visual assets only.

## Validation contract

The project includes three relevant safeguards:

1. `client/src/lib/sportsGenomeAssets.test.ts` asserts all twelve canonical URLs use the mapped Supabase public bucket and none use `/manus-storage/`.
2. `server/supabasePublicAssets.test.ts` checks each copied public object with `HEAD`, including expected media type.
3. `server/supabaseStorageConnection.test.ts` checks authenticated bucket metadata access using the server-only service-role key.

In addition to these focused tests, use `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build` before release. A generated browser inspection can validate current layout and resource requests; physical iPhone Safari and installed-PWA cache behavior must still be checked on a device before being described as device-verified.

## Recorded transition validation

On 2026-08-30, the static `dist/public` output was served through a fresh Vite preview rather than the managed development runtime. The document completed its preserved S/DNA/wordmark launch, mounted the athlete onboarding, and loaded its favicon, intro video, intro artwork, and circular badge directly from the public Supabase Storage bucket. Browser resource inspection found Supabase object requests and no requests to `/manus-storage/` or `/__manus__/`.

The refreshed project preview also completed the same launch sequence and mounted the existing Sports Genome home workspace, including the circular header badge and performance-laboratory command art sourced from Supabase. A deep-link request returned the application entry document and its client-owned not-found surface, which confirms a static SPA fallback rather than a host-level 404. These are generated-browser checks only; they are not a claim of physical iPhone Safari or installed-PWA validation.
