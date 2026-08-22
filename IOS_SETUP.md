# Shipping Sports Genome as an iOS app

The app is a [Capacitor](https://capacitorjs.com) wrapper around the existing web
client. The React app, its CSS, and all the training logic in `client/src/lib/`
are shared verbatim — there is no second codebase. Capacitor ships the built web
bundle inside a native container and gives it access to native APIs.

The Express/tRPC server is **not** bundled into the app. It stays deployed and is
reached over the network, which is why `VITE_API_BASE_URL` is required.

## What this repo already contains

| Piece | Where |
|---|---|
| Capacitor config (bundle ID, `webDir`, iOS options) | `capacitor.config.ts` |
| Native detection | `client/src/lib/platform.ts` |
| API base URL resolution (relative on web, absolute on native) | `client/src/lib/apiBase.ts` |
| Session token storage + `Authorization: Bearer` headers | `client/src/lib/authToken.ts` |
| Native OAuth via in-app browser tab + deep link | `client/src/lib/nativeAuth.ts` |
| Status bar, keyboard, haptics | `client/src/lib/nativeShell.ts` |
| Safe-area / webview CSS (scoped to `html.is-native`) | `client/src/native-shell.css` |
| Offline outbox for workout writes | `client/src/lib/offlineQueue.ts` |
| Optimistic local set logging + session snapshot | `client/src/lib/offlineSession.ts` |
| Outbox wiring, retry/drop classification | `client/src/hooks/useWorkoutOutbox.ts` |
| Native share sheet in place of `window.print()` | `client/src/components/PrintableWorkoutSheet.tsx` |
| Privacy manifest + Info.plist entries, ready to copy | `ios-assets/` |
| Scripted native config (URL scheme, privacy manifest) | `scripts/configure-ios.sh` |
| Signing credentials without a Mac | `scripts/ios-signing.sh` |
| Cloud macOS build + TestFlight upload | `.github/workflows/ios.yml` |
| Native branch of the OAuth callback | `server/_core/oauth.ts` |
| CORS for the `capacitor://localhost` origin | `server/_core/cors.ts` |

## Prerequisites

- **macOS** — but not necessarily *your* macOS. Xcode only runs on macOS, so
  everything from `npx cap add ios` onward needs it. You can rent it instead of
  buying it: see [Building without a Mac](#building-without-a-mac) below, which
  is the recommended path if you do not already own one.
- Xcode 15+ with the iOS SDK, and its command line tools.
- [CocoaPods](https://cocoapods.org) (`sudo gem install cocoapods` or `brew install cocoapods`).
- An **Apple Developer Program** membership ($99/year) to run on a physical
  device and to submit to the App Store. A free Apple ID is enough for the
  simulator.


## Building without a Mac

You do not need to own a Mac to ship this. Compiling an iOS app needs the macOS
toolchain, but that toolchain can be rented by the minute.

`.github/workflows/ios.yml` runs the whole native build on a GitHub-hosted macOS
runner. Because `scripts/configure-ios.sh` applies the URL scheme and privacy
manifest programmatically, the build needs no manual Xcode step at all — the
`ios/` directory can be generated fresh on every run.

### Start here: the free check

Actions → **iOS** → Run workflow → `simulator`.

This installs dependencies, typechecks, tests, builds the web bundle, generates
the Xcode project, installs pods, and compiles for the simulator with
`CODE_SIGNING_ALLOWED=NO`. **No Apple account and no secrets are involved.**

It answers the only question that matters early: does the native app actually
build? A broken Capacitor config, a missing pod, or a Swift compile error all
surface here for free.

### Then: a build you can install on your phone

Getting onto a real device requires code signing, and code signing requires the
**Apple Developer Program ($99/year)**. There is no way around that part — a
free Apple ID can sign a build only through Xcode on a Mac, and the profile
expires after seven days.

With the paid account, the `testflight` job produces a signed build and uploads
it, and you install it from the TestFlight app on your phone.

The usual instructions send you to Keychain Access to make a certificate
request. That request is only an RSA key plus a PKCS#10 CSR, which openssl
produces anywhere, so `scripts/ios-signing.sh` does the whole thing off a Mac.

```bash
bash scripts/ios-signing.sh csr
#   → signing/distribution.key + signing/distribution.csr
#   Upload the .csr at developer.apple.com → Certificates → + → Apple
#   Distribution, and download the .cer into signing/

bash scripts/ios-signing.sh p12 signing/distribution.cer
#   → signing/distribution.p12

#   Then, still in the portal:
#     Identifiers  → register your bundle id
#     Profiles → + → App Store → download the .mobileprovision into signing/
#   And in App Store Connect:
#     Users and Access → Integrations → App Store Connect API → generate a key,
#     download the .p8 (offered once only), note the Key ID and Issuer ID
#     Apps → + → create the app record. The upload cannot create it for you.

bash scripts/ios-signing.sh secrets
#   → prints the base64 values to paste into GitHub
```

`signing/` is gitignored. The private key never leaves your machine.

Set these under **Settings → Secrets and variables → Actions**:

| Secret | What it is |
|---|---|
| `IOS_CERTIFICATE_P12` | Printed by `ios-signing.sh secrets` |
| `IOS_CERTIFICATE_PASSWORD` | The password you chose in the `p12` step |
| `IOS_PROVISIONING_PROFILE` | Printed by `ios-signing.sh secrets` |
| `APPSTORE_KEY_ID` | App Store Connect API key id |
| `APPSTORE_ISSUER_ID` | App Store Connect issuer id |
| `APPSTORE_PRIVATE_KEY` | Contents of the `.p8`, including the BEGIN/END lines |

Plus one **variable**: `VITE_API_BASE_URL`, the absolute origin of your deployed
API. The job fails fast if it is missing rather than shipping a build that
cannot reach the server.

The team id, profile name, and bundle id are *not* secrets — the workflow reads
them out of the provisioning profile and `capacitor.config.ts` at build time, so
they cannot drift from what you actually uploaded.

Two details worth knowing, because both produce confusing failures:

- **The `.p12` encoding matters.** OpenSSL 3 defaults to AES-256, which macOS's
  `security import` rejects with an opaque "MAC verification failed".
  `ios-signing.sh` forces the 3DES/SHA-1 encoding Keychain accepts; if you build
  the `.p12` by hand, pass `-certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES
  -macalg sha1`.
- **Signing is manual, not automatic.** Automatic signing asks Apple to mint a
  fresh certificate on every ephemeral runner, and the account limit is reached
  within a handful of builds.

Expect the first signed run to need a round of iteration anyway — signing is the
part of iOS CI that never works first try. The `.ipa` is uploaded as a build
artifact even when the TestFlight upload fails, so a credential problem does not
cost you the whole build.

### Cost

macOS runners bill at **10× the Linux rate** on private repositories, so both
jobs are manual (`workflow_dispatch`) rather than running on every push. Add a
push trigger once you know what a run costs you.

### Other options

- **Rent a Mac** — MacinCloud or MacStadium, roughly $20–30/month, if you would
  rather work in Xcode directly.
- **Ionic Appflow** — Capacitor's own hosted build service.
- **Codemagic** — also has free macOS build minutes.

## Installing without any of that

The app is also a PWA. Open it in Safari on your phone, then **Share → Add to
Home Screen**, and you get a standalone full-screen app with its own icon — no
Apple account, no build, no waiting.

It is not the App Store build and it does not exercise the native auth path or
the Capacitor plugins, so it will not tell you whether the iOS app works. What
it is good for is getting the actual interface into your hands today, on a real
phone, to find the layout and touch-target problems that only show up there.

## First-time setup

### 1. Configure the environment

Copy `.env.example` to `.env` and fill in the iOS block:

```bash
VITE_API_BASE_URL=https://your-deployed-api.example.com
NATIVE_APP_SCHEME=sportsgenome
VITE_NATIVE_APP_SCHEME=sportsgenome
```

`VITE_API_BASE_URL` is compiled into the bundle at build time. Changing it means
re-running `pnpm ios:sync`.

### 2. Set the bundle identifier

Edit `appId` in `capacitor.config.ts` to the identifier you will register in App
Store Connect. Do this **before** step 3 — changing it later means editing the
generated Xcode project as well.

### 3. Generate the iOS project

```bash
pnpm install
pnpm ios:add      # npx cap add ios  — creates ./ios, runs pod install
pnpm ios:sync     # builds the web bundle and copies it into the native project
pnpm ios:open     # opens the workspace in Xcode
```

Commit the generated `ios/` directory. It holds the Info.plist, icons, and
signing configuration. `.gitignore` already excludes the regenerated parts
(`Pods/`, the copied `public/` bundle).

### 4. Drop in the staged native files

`ios-assets/` holds the files that cannot be generated but can be written ahead
of time. After `cap add ios` creates the project:

**a. Register the URL scheme — required for login.** Login cannot complete
without it: iOS will not route `sportsgenome://auth/callback` to an app that has
not claimed the scheme. Merge the entries from
`ios-assets/Info.plist.additions.xml` into `ios/App/App/Info.plist`, or add them
through Xcode (**App** target → **Info** → **URL Types** → **+**, identifier =
your bundle ID, scheme = `sportsgenome`).

**b. Add the privacy manifest.** Required for App Store submission. Copy
`ios-assets/PrivacyInfo.xcprivacy` to `ios/App/App/`, then drag it into the Xcode
project navigator and tick **App** under Target Membership — a file that is not a
member of the target is not submitted.

It is filled in from what `drizzle/schema.ts` actually stores (account identity
plus fitness data, none of it used for tracking) and declares the `UserDefaults`
access reason `CA92.1` that `@capacitor/preferences` requires. Revisit it if the
schema starts collecting something new; a mismatch is a rejection.

**c. Generate the app icon and launch screen.** Put a 1024×1024 `icon.png` and a
2732×2732 `splash.png` in `ios-assets/`, then:

```bash
pnpm ios:assets
```

If that fails with a `sharp` error, its native build was skipped on install —
`pnpm rebuild sharp` fixes it.

### 5. Deploy the server changes

The native login flow needs the updated `server/_core/oauth.ts` and
`server/_core/cors.ts` **live** before the app can authenticate. Set
`NATIVE_APP_SCHEME` in the server environment too — the callback reads the scheme
from there, never from the request.

Also register `https://<your-api-host>/api/oauth/callback` as an allowed redirect
URI with the Manus OAuth portal if it is not already.

### 6. Run

```bash
pnpm ios:sync && pnpm ios:open
```

Then pick a simulator or device in Xcode and hit Run.

## Day-to-day

```bash
pnpm ios:sync    # after ANY web change — rebuilds and copies into the native project
```

The native project serves a **copied** bundle. Editing `client/src` and
refreshing does nothing until you re-sync.

## How native login works

The web flow ends with an httpOnly cookie on the app's own origin. That cannot
work in the app: the webview origin is `capacitor://localhost`, which is
cross-site to the API, so WKWebView's tracking prevention drops the cookie.

Instead:

1. `startLogin()` detects native and calls `startNativeLogin()`.
2. The app mints a nonce, stores it, and opens the Manus portal in an in-app
   browser tab (`SFSafariViewController`). Apple accepts a browser tab as an
   OAuth surface; a raw webview would be rejected.
3. The portal redirects to the normal `https` callback on your server.
4. The callback sees `native: true` in the OAuth `state`, and instead of setting
   a cookie it redirects to `sportsgenome://auth/callback#token=…&nonce=…`.
5. iOS hands that URL to the app, which verifies the nonce it minted, stores the
   token, and refetches.
6. Every subsequent tRPC call sends `Authorization: Bearer <token>` — a path
   `sdk.authenticateRequest` already supported.

**CSRF.** The web flow binds a login to the browser that started it with a
one-time `__Host-` nonce cookie. That cookie cannot reach the server in the
native flow, because the login runs in an out-of-process browser tab. The nonce
round-trips through the deep link and is verified client-side instead, which is
the check RFC 8252 §8.9 prescribes for native clients. The native branch sets no
cookie, so it cannot be used to log a victim's browser into an attacker's
account, and it only ever redirects to the server-configured scheme, so a forged
`state` cannot aim a token at an attacker's app.


## Offline workout logging

A gym is where signal dies, so the logger does not wait for the network.

- Tapping a set updates the UI immediately via `applyLocalSetLog`, then sends.
- If the send fails in transport, the write goes into a durable outbox
  (`offlineQueue.ts`) that survives an app relaunch, and replays in FIFO order
  when connectivity returns.
- Replay is safe because `upsertWorkoutSet` is keyed on the unique
  `(sessionExerciseId, setNumber)` index — a re-sent set overwrites rather than
  duplicating.
- FIFO ordering is load-bearing: the server rejects set logs against a session
  that is no longer `active`, so a queued `complete` must never overtake the
  sets before it. `mergeIntoQueue` therefore supersedes a repeated set log **in
  place** rather than moving it to the tail.
- A write the server actively refuses (4xx other than 401/408/429) is dropped
  rather than retried forever, so one bad entry cannot wedge everything behind
  it. Transport failures, 401s, and 5xx stay queued.
- The active session is snapshotted to device storage, so a workout survives
  iOS reclaiming a backgrounded app.
- Anything still unsynced is stated plainly in the panel rather than hidden.

**Starting** a workout still requires a connection — it needs server-generated
ids for the session and its exercises. Logging, finishing, and resuming all work
offline. Making session *creation* offline-capable would mean client-generated
ids and a schema change; it was not needed for the walk-in-with-signal case.

## Known gaps before you ship

These are real, and deliberately not done blind:

1. **Token storage is `UserDefaults`, not Keychain.** `@capacitor/preferences` is
   backed by `UserDefaults`, which is included in device backups. Replacing
   `readNativeToken`/`writeNativeToken` in `client/src/lib/authToken.ts` with a
   Keychain plugin is a two-function change — nothing else touches storage.
2. **Touch targets.** Apple's HIG asks for 44pt. A blanket `min-height` would
   distort the dense metric rows this UI relies on, so `native-shell.css` provides
   an opt-in `.native-tap-target` class instead. Auditing the controls needs a
   real device.
3. **Hover-dependent UI.** Radix hover-cards, tooltips, and context menus have no
   touch equivalent. They need press-and-hold or tap alternatives.
4. **Sign in with Apple.** Guideline 4.8 may require offering it alongside the
   Manus login. Worth confirming before submission.
5. **Artwork.** `pnpm ios:assets` is wired up, but it needs your `icon.png` and
   `splash.png` — until then the app ships Capacitor's placeholders.
