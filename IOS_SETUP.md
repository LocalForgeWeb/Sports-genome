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
| Native branch of the OAuth callback | `server/_core/oauth.ts` |
| CORS for the `capacitor://localhost` origin | `server/_core/cors.ts` |

## Prerequisites

- **A Mac.** Xcode only runs on macOS, so the steps below cannot be done from
  Linux or CI-on-Linux. Everything up to `pnpm build:client` is platform-agnostic;
  from `npx cap add ios` onward you need the Mac.
- Xcode 15+ with the iOS SDK, and its command line tools.
- [CocoaPods](https://cocoapods.org) (`sudo gem install cocoapods` or `brew install cocoapods`).
- An **Apple Developer Program** membership ($99/year) to run on a physical
  device and to submit to the App Store. A free Apple ID is enough for the
  simulator.

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

### 4. Register the URL scheme — required for login

Login will not complete without this. In Xcode, select the **App** target →
**Info** → **URL Types** → **+**, and set:

- **Identifier:** your bundle ID
- **URL Schemes:** `sportsgenome` (must match `NATIVE_APP_SCHEME`)

Or add it directly to `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>ai.monkeypants.sportsgenome</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>sportsgenome</string>
    </array>
  </dict>
</array>
```

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
4. **`PrintableWorkoutSheet` calls `window.print()`**, which does nothing useful
   in a webview. Replace with the native share sheet.
5. **Sign in with Apple.** Guideline 4.8 may require offering it alongside the
   Manus login. Worth confirming before submission.
6. **App icon and launch screen** are still Capacitor's placeholders. Generate
   them with [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets).
7. **Privacy manifest** (`PrivacyInfo.xcprivacy`) is required for App Store
   submission. Declare the data the app collects and the reasons for any required-
   reason APIs.
