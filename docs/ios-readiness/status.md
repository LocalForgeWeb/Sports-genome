# iOS readiness: status ledger

Source: *Sports Genome — iOS readiness audit and Claude implementation checklist* (2 Nov 2026), which audited `main` at `4b7aa58614eeb9a362918f026287e3ba8e79c974`.

**Starting commit for this pass: `4b7aa586`, the audited SHA itself** (local was fast-forwarded to `origin/main` before any change), so every finding was taken as audited. `CLAUDE.md` was read: phone first, 44 pt targets, inline over popups, undo over confirm, phone screenshots. There is no `AGENTS.md`.

**Status words:** not started / in progress / verified / blocked / deferred. *Verified* means checked with evidence named here, not that the UI renders or a mock passes. Browser checks are headless Chromium with iPhone emulation, not an iPhone or Safari.

| ID | Status | Implementation commits | Tests | Evidence | Remaining blocker |
|---|---|---|---|---|---|
| **A01** Account identity | **blocked** | — (no identity switched) | — | `data-inventory.md` §1–2: device owner, Supabase anonymous UUID and Drizzle `users.id` are three unlinked identities. Production has 0 Supabase auth users (queried 2 Nov). Account screen already says "Saved on this device". | **Owner decision:** one canonical identity (recommended: Supabase auth, upgrading the anonymous UUID). Then build registration, recovery and password reset, guest-to-account conversion, and server-checked ownership. |
| **A02** Native shell / API boundary | **in progress** | `f2e8e2ca` | `apiOrigin.test.ts`, `server/nativeOrigins.test.ts`, `apiDeployment.test.ts` | API address resolved in one place; a native build with no valid HTTPS origin stops at start-up. Server answers only exact `NATIVE_APP_ORIGINS`, never a wildcard, and is inert while unset. | **Mac + owner:** Capacitor project, bundle id, signing, `NATIVE_APP_ORIGINS` in Vercel, the WKWebView session transport decided on a device (`native-build.md`). |
| **A03** Ownership, migration, backup | **in progress** | `91d13125`, `e728b60c` | `deviceRecordStore.test.ts` (17), `deviceBackup.test.ts` (11), `YourDataPanel.test.ts` (5), existing store tests | Owner-scoped history, observations, body weight, outbox and link secrets; claim-once legacy migration that is safe to retry; per-owner outbox; corrupt data quarantined, never saved over; versioned backup with validation, preview, conflict set-aside, all-or-nothing and undo; 120-workout round trip; phone screenshots of Your data and restore preview at 390/375. | **Device:** import into the real native build (Files picker in WKWebView). Durable native store for large histories. Inventory: `data-inventory.md` §3. |
| **A04** Privacy, support, deletion | **in progress** | `e728b60c` | `deviceDataDeletion.test.ts` (5), `YourDataPanel.test.ts`, `InfoPages.test.ts` (3) | `/privacy` and `/support` open without the workspace or sign-in, linked from About me and the sign-in screen. Privacy text drawn from the data inventory, marked as a draft. Delete my data turns off links, deletes cloud rows where an identity exists, removes only this owner's device data, reports each step, and is safe to repeat. Screenshots at 390/375. | **Owner/legal:** controller, contact, minimum age, legal review. **Server:** service-role endpoint to delete insert-only `athlete_focus_checkins`, `athlete_strength_states` and the auth user. **App Store:** privacy answers, privacy manifest, rights audit for media, models and fonts. |
| **A05** Workout continuity | **not started** | — | Existing logger tests pass (drop sets, resume after reload, rest end time) | Nothing new this pass. | **Device:** lock/unlock, force-close and offline runs need iOS process suspension; a browser cannot prove it. |
| **A06** Catalog reconciliation | **blocked** | — (no exercise added) | — | `catalog-report.md`: 420 runtime exercises; Zercher Squat/Carry and 20 bench/press variants present; Zercher Deadlift, Spoto and neck missing in app; neck isometrics exist only as unmapped Supabase rows; **forearm IDs 401–420 have no approved reference mapping**, so their lifts never upload. | **Owner:** the approved addition manifest (not in the repo or Supabase). **Data reviewer:** approve mappings 401–420. |
| **A07** CSS warning, essential assets | **in progress** | `0ee7bdbc` | `cssSelectors.styles.test.ts` (51), `BrandMark.render.test.ts` (4), `launchExperience.test.ts` | Invalid selector removed; it styled nothing, so there is no visual change. The build no longer warns, and a guard parses every stylesheet. Header shows a drawn SG mark at a reserved 44×44 when storage is blocked, never a broken image. Returning launch with slow storage: 2.9 s (was 4.4 s); first launch ~4.6 s with Skip. Production serves this build. | **Network:** run `scripts/assets/vendor-brand-assets.mjs` from a machine that can reach Supabase storage (the sandbox gets 403), then commit the two files. Boot-splash art is still remote. Exercise media audit not done. |
| **A08** Navigation polish | **deferred** | — | — | Not worked this pass; data and boundary work came first, per the audit's Phase 1. | Usability evidence with real athletes. |
| **A09** Native adapters | **in progress** | `b086cf47` | `platform.test.ts` (5) | Haptics, share, file save and print go through one adapter. A test fails if any app file calls `navigator.vibrate`, `navigator.share` or `window.print` directly. | **Mac:** native implementations (Capacitor Haptics/Share/Filesystem), resume handling, keyboard and links. |
| **A10** Performance, 3D | **not started** | — | — | — | **Physical iPhones** for memory, thermal and frame-time behaviour. |
| **A11** Operations, submission | **not started** | — | — | — | Signing, App Store Connect, metadata and screenshots, privacy answers: all owner-held. |
| **A12** Timezone test | **verified** | `6a56ff93` | `targetWindow.timezone.test.ts` (10) | Suite pins `TZ=UTC`; weekly targets compare canonical zones; DST weeks (1 Nov, 8 Mar) explicit. Full suite green in UTC and with `TZ=America/Chicago` (see Test runs). | — |

## Test runs

| When | Commit | Command | Result |
|---|---|---|---|
| 2 Nov, after A12+A07 | `0ee7bdbc` | `npx vitest run` | 503 files passed, 4 skipped; 5313 tests passed, 8 skipped |
| 2 Nov, after A12+A07 | `0ee7bdbc` | `TZ=America/Chicago npx vitest run` | 503 files passed, 4 skipped; 5313 tests passed, 8 skipped |
| 2 Nov, after A09+A03+A04 | `e728b60c` | `npx vitest run` | 1 failed (`typeScale.test.ts`: literal font sizes in the new stylesheet, then fixed with tokens); 508 files passed, 4 skipped; 5359 tests passed, 8 skipped |

| 2 Nov, final | `8ef00628` | `npx vitest run` | **511 files passed, 4 skipped; 5369 tests passed, 8 skipped; exit 0** |
| 2 Nov, final | `8ef00628` | `TZ=America/Chicago npx vitest run` | **511 files passed, 4 skipped; 5369 tests passed, 8 skipped; exit 0** |
| 2 Nov, final | `8ef00628` | `npx tsc --noEmit -p tsconfig.json` | no errors |
| 2 Nov, final | `8ef00628` | `pnpm build` | built; only the existing chunk-size warnings (the CSS selector warning is gone) |
| 2 Nov, final | `8ef00628` | `node scripts/ci/smoke-serverless.mjs` | all checks passed |

**Skips:** 8 tests, the same set before and after this pass. None was added, and none was newly skipped by this work.

| Skipped tests | Why |
|---|---|
| 5 tests in `server/supabasePublicAssets`, `supabaseEvidenceConnection`, `supabaseEvidenceRls`, `supabaseStorageConnection` | `skipIf` there is no Supabase project URL or credentials; the sandbox has none |
| 1 in `client/src/lib/anatomySubregions.test.ts` | `it.skip`: approximation notes await a port to the new parts (pre-existing) |
| 1 each in `pageText.render.test.ts` and `pageNumbers.render.test.ts` | Read-out modes that run only when `READ_PAGE_TEXT` / `READ_PAGE_NUMBERS` is set |

## Documents

- `data-inventory.md`: identities, every persisted key, what leaves the device, deletion.
- `backup-and-migration.md`: moving web history to the app; what the backup holds; guarantees and their tests.
- `native-build.md`: what is ready, the Mac steps, device-only acceptance items.
- `catalog-report.md`: the A06 matrix.
