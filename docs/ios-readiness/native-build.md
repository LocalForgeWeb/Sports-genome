# Native iOS build: what exists, and what needs a Mac (A02, A09, A11)

Nothing in this repository has been built, signed or run as an iOS app. This file records what is ready for that, and the exact remaining steps, which need a Mac with Xcode, an Apple Developer account and the owner's decisions.

## Ready in the code

| Piece | Where | State |
|---|---|---|
| One place decides the API address | `client/src/lib/apiOrigin.ts`, used by `main.tsx` | Web stays relative. A native build needs `VITE_NATIVE_SHELL=1` and `VITE_API_ORIGIN=https://…`; without a valid HTTPS origin it stops at start-up with an explanation. Tested. |
| Cross-origin access for the shell only | `server/_core/nativeOrigins.ts`, on `/api/trpc` in both entry points | Exact origins from `NATIVE_APP_ORIGINS` (e.g. `capacitor://localhost`), with credentials; never a wildcard; does nothing while unset. JSON-only mutations still apply. Tested. |
| Device capabilities behind one adapter | `client/src/lib/platform.ts` | Haptics, share sheet, saving files, print. The shell calls `setPlatformAdapter({ kind: "native", … })` once. A test fails if anything calls the browser APIs directly. |
| Bundled brand fallback | `client/src/components/BrandMark.tsx` | The header never shows a broken image offline. The official images are bundled once `scripts/assets/vendor-brand-assets.mjs` is run from a networked machine. |
| Owner-scoped storage, backup and restore | `deviceRecordStore.ts`, `deviceBackup.ts` | See `backup-and-migration.md`. |
| Privacy, Support, deletion | `/privacy`, `/support`, About me → Your data | The privacy text is a draft; the owner supplies the missing details. |

**Build output:** Vite writes to `dist/public` (`vite.config.ts` → `build.outDir`). That is the `webDir` for Capacitor, not the default `dist`.

## Steps on a Mac

These are not done: they need a Mac, Xcode, an Apple Developer account and owner decisions.

1. **Choose the bundle identifier and app name.** This is the owner's decision; nothing here invents one.
2. **Add Capacitor:**
   `pnpm add @capacitor/core @capacitor/ios && pnpm add -D @capacitor/cli`
   Then create `capacitor.config.ts` with:
   - `appId: "<bundle id>"`
   - `appName: "Sports Genome"`
   - `webDir: "dist/public"`
   - `server` unset, so the release bundles the app and never points at a live-reload URL.
3. **Build the web app for the shell:**
   `VITE_NATIVE_SHELL=1 VITE_API_ORIGIN=https://<api host> pnpm build`
   Then `npx cap add ios`, then `npx cap sync ios`.
4. **Set the server allowlist.** In Vercel (production, and staging separately), set `NATIVE_APP_ORIGINS=capacitor://localhost`.
5. **Environments.** Staging and production native builds differ only in `VITE_API_ORIGIN`.
   - The staging build must point at a preview deployment.
   - Preview deployments already refuse the production Supabase keys (`__SG_DEPLOY_ENV__`, Infrastructure V2 ENV05), so a staging app cannot write production athlete data.
6. **Session transport: decide it on a device.** The API session is a cookie (SameSite=None, Secure). WKWebView blocks third-party cookies by default, so a cookie set by `https://<api host>` may not be sent from `capacitor://localhost`. Test it on an iPhone. If it fails, move native requests to a bearer token kept in the Keychain (Capacitor Preferences is not secure storage), and accept it only from the listed origins. Until account sign-in is chosen (A01), the app makes no authenticated calls that need it.
7. **Native adapters.** Register real haptics (`@capacitor/haptics`), share (`@capacitor/share`), files (`@capacitor/filesystem` + share) and print through `setPlatformAdapter`. Also:
   - resynchronise the rest timer on `App` `resume` (the timer already stores an absolute end time);
   - handle the keyboard and links deliberately;
   - add no broad ATS exceptions.
8. **Privacy manifest.** Write `PrivacyInfo.xcprivacy` from the plugins actually added. Use the required-reason API declarations those plugins need, not a generic one. Use App Store privacy answers from `data-inventory.md`.
9. **Diagnostics.** Show the native version and build number next to the web build stamp (`buildStamp.ts`) on Support.
10. **Archive, sign and upload to TestFlight.** Then run the acceptance list in the audit (A02, A05, A10) on a real iPhone.

## Acceptance items that need the device

| Item | Why it cannot be done here |
|---|---|
| Fresh native install loads with no network | Needs the built app on a device |
| Authenticated request after cold start and refresh | Needs the session transport decision (step 6) and A01 |
| Staging app talks only to staging | Needs the two builds |
| Real iPhone network inspection shows the intended API host | Needs a device and a proxy |
| Lock/unlock, force-close and offline workout continuity (A05) | Needs iOS process suspension, which a browser cannot reproduce |
| 3D anatomy, memory and thermal behaviour (A10) | Needs physical iPhones |
