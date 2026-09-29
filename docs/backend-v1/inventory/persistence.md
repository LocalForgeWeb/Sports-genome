# Persistence inventory: device, account and sync

- **Date:** 2026-09-28
- **Commit:** `52c8f52d41218276cf381685ca5ae2e9f9f60818`. All findings are against this commit.
- **Concurrent edits:** while this inventory was being written (from about 23:33 UTC on 2026-09-27), another agent left *uncommitted* changes in the working tree: `server/workoutPlanSync.ts` (a revision-conditioned UPDATE, which bears on PS-06), `client/src/main.tsx`, `server/_core/{trpc,index,serverless}.ts`, `server/db.ts`, plus new untracked files. This inventory did not make, review or verify any of them.
- **Scope:** brief §2 discovery (B019, B020), §3 semantics as they touch records, §10 (B151–B177), §15.4 fixtures B257–B266. Payments are out of scope because the owner deferred them.
- **Method:** I read the client stores, `Home.tsx`, the tracker, the sync hooks, the tRPC routers, the Drizzle schema and migration 0009. I ran the existing persistence tests: 14 files, 202 passed. I also wrote scratch tests **outside the repo** in `/tmp/claude-0/-home-user-Sports-genome/d1d9bfed-a6f9-5d87-9151-3620e8194516/scratchpad/persistence/` (config `vitest.persist.config.ts`, files `ps-*.test.ts(x)`, 30 tests, all passing as written). They render the real `Home`, `DeviceWorkoutTracker` and `usePlanSync` in jsdom, with tRPC, auth, Supabase and sonner mocked. The run command is: `npx vitest run --config <scratch>/vitest.persist.config.ts`.
- **Evidence labels:** **CONFIRMED** means I observed it in code, in an existing test, or in scratch-test output (the test is named). **HYPOTHESIS** means I inferred it but did not execute it. Line references are `file:line` in the repo.
- **Build context:** `directWorkspaceAccess = true` (`client/src/pages/Home.tsx:133`). No sign-in or sign-out control is rendered, because `EmailAuthScreen` is only shown when that flag is false (`Home.tsx:1441`) and `logout` is never called from the UI. The MySQL account paths are therefore **dormant, but they are on the V1 path**. The Supabase anonymous identity path is **live** whenever the project allows anonymous sign-ins.

---

## 1. Storage keys

No `sessionStorage`, IndexedDB or Cache Storage is used by app code. A grep of `client/src` and `client/index.html`, excluding tests, found only `localStorage`.

| Key | Owner (file:line) | Format / version | Holds | Namespaced by account (B173) | Old format migrated (B177) |
|---|---|---|---|---|---|
| `gym-optimizer-athlete-profile-v1[::<mysqlUserId>]` | `Home.tsx:128,317`; read `632-660`; write `708-715`. Also read **raw and unscoped** by `components/WorkoutHealthPanel.tsx:9` and `ProgressionReviewPanel.tsx:58,66` (the latter is only reachable through the unrendered `WorkoutExecutionPanel`) | JSON `{version:1\|2\|3, sportId, sportContextMode, capacityFocus, goal, trainingDays, gymMinutes, movementId, baseline}` | Profile, baseline (sex, birth year, weight, unit, equipment, preferred name) and capacity focus | **Writes yes, reads effectively no.** The read runs once at mount with `accountId = null`, so it reads the unscoped key (PS-03). CONFIRMED `ps-home` | v1/v2/v3 are tolerated (`Home.tsx:637-641`). A profile whose `sportId` no longer resolves is rejected entirely, which sends the athlete back to onboarding (PS-21). The legacy claim never runs for the profile because the account id is null at read time |
| `gym-optimizer-workout-plan-v1[::<mysqlUserId>]` | `Home.tsx:129,318`; hydrate `680-706`; persist `741-757`; adopt server copy `724-732`; wiped by `rebuildPlan` `1379-1391` | JSON `StoredWorkoutPlan` `{version:1\|2, weeks:{1..3:{weeklyPlanEntries:{"<index>-<Split>":[{entryId, catalogExerciseId}]}, weeklyPrescriptions, weeklySettings, importedPlanContext, activeDayIndex}}, activeWeek, …legacy top-level fields}` (`Home.tsx:100-101,578-601`) | Three-week plan, with a per-day stack, prescriptions and settings | **Yes.** Hydration waits for auth (`Home.tsx:683`). The sign-out path still leaks (PS-01) | Yes, partly: legacy top-level fields are folded into their day (`Home.tsx:602-630`), and the unscoped legacy record is claimed by the first account (`lib/deviceStorageScope.ts:37-56`). Exercises whose catalog id no longer exists are dropped silently and re-saved (`Home.tsx:603-604`) |
| `gym-optimizer-favorite-exercise-ids-v1[::<mysqlUserId>]` | `Home.tsx:130,319,669-678` | JSON `number[]`, no version | Favourite catalog ids | Writes yes, but the read runs once at mount (`[]` deps), so in practice it reads the unscoped key. Same mechanism as the profile (CONFIRMED for the profile; for favourites CONFIRMED from code) | None |
| `sports-genome-device-workout-history-v1` | `lib/deviceWorkoutLog.ts:48,51-85`; writers only in `components/DeviceWorkoutTracker.tsx:263,366` | JSON `DeviceWorkoutSession[]` `{id:"device-<ms>", title, dayLabel, startedAt, completedAt?, status:"active"\|"completed", exercises:[{id:"<catalogId>-<index>", exerciseName, plannedPrescription, sets:[{weight, reps, height, completed, skipped}]}], restSeconds, restEndsAt, bodyMassKgAtCompletion}`. No version field | The active session **and** every completed session and set | **No.** CONFIRMED in `ps-home`: account 8 sees account A's workout ("1 lift logged · 1 workout recorded") | Sets are coerced to strings on load (`deviceWorkoutLog.ts:55-60`). No schema version. `weight` carries **no unit** (PS-10) |
| `sports-genome-device-strength-observations-v1` | `lib/deviceStrengthObservations.ts:20-43`; writer `components/StrengthGenomePanel.tsx:694,783-795` | JSON array `{id:"device-strength-<ms>", exerciseName, observedAt, measurementType, loadKg (kg), repetitions, bodyMassKgAtTest, …}`. No version | Typed lifts (direct mode) | **No** | None; the load is a plain cast (`deviceStrengthObservations.ts:26-27`) |
| `sports-genome-body-weight-log-v1` | `lib/bodyWeightLog.ts:33-66`; writers `Home.tsx:652,1107` | JSON `[{bodyMassKg, enteredUnit, observedAt, source}]` | Dated body-weight log | **No** | Filtered and normalised on load (`bodyWeightLog.ts:43-54`). Seeded once from the profile weight, stamped with *now* (`Home.tsx:651`) |
| `sports-genome-strength-sync-queue-v1` | `lib/strengthSyncQueue.ts:27,53,64-68` | JSON `QueuedLift[]` `{key:"workout-<sessionId>-<exerciseId>", lift, athlete snapshot, queuedAt}` | Outbox to Supabase `athlete_strength_entries` | **No**, and not tied to the Supabase user either | None |
| `sports-genome-strength-synced-v1` | `strengthSyncQueue.ts:28,54,116-117` | JSON `string[]`, capped with `slice(-5000)` | Keys already sent (the only dedupe) | **No** (not per Supabase identity) | None |
| `sports-genome-supabase-reference-map-v1` | `lib/supabaseReferenceMap.ts:27-82` | JSON `{exerciseUuidByCatalogId, sportUuidBySlug, loadedAt}`, no TTL | Reference cache, not user data | N/A | None |
| `sports-genome-auth-v1` | `lib/supabaseClient.ts:47` (supabase-js persisted session) | supabase-js session JSON | **The athlete's Supabase identity** (an anonymous user's tokens) | Device-level; it *is* the identity. No sign-out, no sign-in | Library-managed |
| `sports-genome-user-info` | Fixed: no longer written; `_core/hooks/useAuth.ts` removes a leftover copy on mount | Was `JSON.stringify(auth.me)`, which became `"null"`/`"undefined"` when signed out | Was the MySQL user row, rewritten on every auth state change | No. Nothing read it (PS-24, fixed) | Cleared on mount |
| `sports-genome-benchmark-opt-in-v1` | `Home.tsx:1116-1122` | `"true"\|"false"` | Consent to the norms pool | **No**: the next account on the device inherits the answer shown in the UI | None |
| `sports-genome-recent-exercises-v1` | `lib/recentExercises.ts:12-31` | `number[]`, at most 8 | Recently viewed exercises | No | None |
| `sports-genome-theme-v1` | `lib/theme.ts:21`, `contexts/ThemeContext.tsx:35,66`, `client/index.html:33` | `"dark"\|"light"` | Preference | N/A (device preference) | None |
| `sports-genome-launch-experience-enabled-v1` | `lib/launchExperience.ts:1`, `Home.tsx:662-667,1398-1404` | `"on"\|"off"` | Preference | N/A | None |
| `sports-genome-launched-before-v1` | `lib/bootExperience.ts:17,145-152` | `"yes"` | Boot-intro state | N/A | None |
| `sports-genome-replay-intro-v1` | `lib/bootExperience.ts:28`, `lib/bootSplash.ts:85`, `client/index.html:34` (removed when read) | `"yes"` | One-shot replay flag | N/A | None |
| `sidebar-width` | `components/DashboardLayout.tsx:34,45,51` | number string | Layout preference. HYPOTHESIS: dead code, since no importer outside the file | N/A | None |

**In-memory only (lost on reload):** in `usePlanSync`, `revisionRef`, `pulledRef` and `lastPushedRef` (`lib/usePlanSync.ts:27-29`), which also means the pending debounced push is lost. In `useAthleteSync`, `identity`, the `running` guard and `lastCapacity` (`lib/useAthleteSync.ts:59-63,139`).

**Server stores.** MySQL through Drizzle, owned by the tRPC cookie session (`server/_core/context.ts:17`):

- `athleteWorkoutPlans` (migration 0009: one row per user, `revision`, whole JSON)
- `favoriteExercises` (unique on user and catalog id)
- `workoutSessions`, `workoutSessionExercises`, `workoutSetLogs` (unique on exercise and set number)
- `strengthObservations`, `bodyMassObservations`, `athleteStrengthPriorities`, `athleteStrengthProfiles`

Supabase, written by the browser under the anonymous JWT:

- `athlete_profiles`
- `athlete_strength_entries` (insert only)
- `athlete_focus_areas`, `athlete_training_constraints`

Reference reads are `app_exercise_source_mappings` and `sports`.

## 2. Authority per record type (B020)

| Record | Device | MySQL account | Supabase (anonymous device identity) | Authoritative today | Where mixed | Sign-in (MySQL) | Sign-out (MySQL) |
|---|---|---|---|---|---|---|---|
| **Plan** | Scoped plan key; the source while editing (`Home.tsx:717-723`) | `athleteWorkoutPlans` via `workoutPlan.get/save`, only when `isAuthenticated && onboardingComplete` (`Home.tsx:734-739`). Dormant in this build | None | Device | Pull adopts the server copy whenever the content differs (PS-04); a conflict is auto re-pushed (PS-05) | Guest plan claimed by the first account (PS-17), then replaced by the server copy if one exists (PS-04) | In-memory plan written to the shared key and claimed by the next account (**PS-01**) |
| **Active session** | `status:"active"` entry in the workout history key | Server `workoutLog.start/logSet/complete` exists, but `WorkoutExecutionPanel` is imported and never rendered (`Home.tsx:32`, 0 render sites) | None | Device | None | Visible to any account (PS-02) | Stays visible |
| **Completed sessions** | Same key | `workoutLog.list` is merged by Progress (`ProgressOverviewPanel.tsx:46,70-91`) always, and by Home only when `!directAccess` (`lib/athleteRecord.ts:89-92`) | None | Device | Progress and Home disagree once account sessions exist (PS-13) | Unscoped, so A's history shows for B (**PS-02**) | Stays |
| **Sets** | Inside sessions only | `workoutSetLogs` (dormant) | Only the **heaviest set per exercise per session** becomes an `athlete_strength_entries` row (`lib/workoutStrengthRecord.ts:116-150`, `useAthleteSync.ts:152-190`) | Device | Supabase holds a lossy projection | Unscoped | Stays |
| **Typed lifts** | Device store (direct mode) | `strengthObservations` (non-direct mode) | **Never synced** | Device (direct) | Strength and Home pick one source by `directAccess` (`StrengthGenomePanel.tsx:605`, `athleteRecord.ts:81`); Progress unions both (`ProgressOverviewPanel.tsx:97-101`) | Unscoped; device typed lifts drop out of Home and Strength when `directAccess` flips | Stays |
| **Body weight** | Log key; stamped into sessions at finish (`DeviceWorkoutTracker.tsx:360-364`) | `bodyMassObservations` via `addObservation` only (non-direct) | `athlete_profiles.default_bodyweight_kg` (current value) and per-row `bodyweight_kg` | Device | None | Unscoped | Stays |
| **Profile** | Profile key (scoped on write, unscoped on read, PS-03) | `athleteStrengthProfiles` via `strengthGenome.setProfile`, which has no client caller | `athlete_profiles` subset, write-only (`lib/athleteIdentity.ts:95-137`); capacity focus and constraint read back once when the device has none (`useAthleteSync.ts:119-133`) | Device | The profile row follows device defaults | Account reads the guest or other profile (PS-03) | Stays |
| **Favourites** | Scoped key (read at mount, as PS-03) | `favoriteExercises`; UI shows **union** of device and account (`Home.tsx:417`) | None | Both, as a union | Local-only favourites are never pushed later, even though the toast promises it (`Home.tsx:919`); a favourite removed on another device is kept on screen by the union | Union | Local list stays |
| **Priorities** | None | `athleteStrengthPriorities` only | None | Account | In direct mode the query is disabled (`StrengthGenomePanel.tsx:462`) and `setPriority` fails silently (`757-760,816`) (PS-20) | Works | n/a |

---

## 3. Session lifecycle (B151–B158)

**States (CONFIRMED, code).** On the device there are only two: `active` and `completed` (`deviceWorkoutLog.ts:27`). There is no planned, abandoned or deleted state, and "Finish workout early" also produces `completed` (`DeviceWorkoutTracker.tsx:621-623`). A finished session cannot be deleted or corrected on the device (B159: no writer besides the tracker; `saveDeviceWorkoutSessions` is called only at `DeviceWorkoutTracker.tsx:263,366`). MySQL `workoutSessions.status` also has `abandoned` (`drizzle/schema.ts:53`), but nothing sets it.

Set states are: empty; draft (typed, not logged: `isDraftSet`, `deviceWorkoutLog.ts:111-113`); `completed`; `skipped`. `finalizeSession` keeps only completed sets and drops exercises that have none (`deviceWorkoutLog.ts:156-174`).

| Transition | Where | Retry / double-tap safety |
|---|---|---|
| none → active | `start()` builds `makeSession` (`DeviceWorkoutTracker.tsx:84-102,271-280`) | A `starting` ref plus the re-render stops a same-button double tap. **Start never checks storage**, so a session started in another tab or a stale mount creates a **second active session** (CONFIRMED `ps-tracker`). The id `device-${Date.now()}` collides within one millisecond, and one session then replaces the other (CONFIRMED `ps-pure`) |
| active → active (set logged or edited, rest changed) | `persist()` (`DeviceWorkoutTracker.tsx:261-269`) writes the **in-memory** session over storage | Two tabs on one session overwrite each other; a logged set is lost (CONFIRMED `ps-tracker`) |
| active → completed | `finish()` (`DeviceWorkoutTracker.tsx:356-382`) | A duplicate finish is idempotent by id: one completed workout (CONFIRMED `ps-pure`, B258 ✓ on device). A refused write still toasts "N sets added to Progress" (CONFIRMED `ps-tracker`, PS-12) |
| Server (dormant) | `workoutLog.start` inserts with no operation id (`server/workoutSessions.ts:23-52`); `complete` is check-then-update (`:147-155`) | Not idempotent: a retried start duplicates the session; a retried complete returns NOT_FOUND. Session and exercise inserts are not in a transaction (B164) |

**Definitions (B155, B265), CONFIRMED.**

| Term | Home (`TodayActionPanel` → `athleteRecord`) | Progress (`ProgressOverviewPanel`) | Strength (`StrengthGenomePanel`) |
|---|---|---|---|
| Completed workout | Device session with `status==="completed"`, **including zero-set sessions** (`athleteRecord.ts:99`). Account sessions added only when `!directAccess`. `ps-pure`: a zero-set finish gives `workoutsRecorded 1` | Device completed **plus account completed, always** (`:70-91`) | Not counted |
| Logged lift | Typed (device, or account when `!directAccess`) plus one per exercise per completed session (`athleteRecord.ts:80-84`). When `!directAccess`, the headline switches to `overview.observationCount`, which is **typed only** (`TodayActionPanel.tsx:87`) | Account observations **plus** device typed **plus** workout-derived (`:97-101`) | Device typed (direct) or account typed, plus workout-derived (`:605-610`) |
| Completed set | `completed && !skipped` (`athleteRecord.ts:75`) | `completed` (`:75`) | Via workout-derived lifts, which need numeric reps (`workoutStrengthRecord.ts:129-132`) |

Consequences:

- A set logged with blank fields is allowed (`DeviceWorkoutTracker.tsx:305-311`). It counts as a completed set and a completed workout but yields no lift.
- The three screens agree today only because direct mode makes every account query come back empty.

**Resumability (B158), CONFIRMED `ps-tracker`.** The tracker reads the stored active session on mount (`DeviceWorkoutTracker.tsx:172-180`). A remount for a different plan day still shows the running session ("Week 1 · Day 01 · Push … 1/3 sets"). `SessionResumeBar` is shown on every other workspace (`Home.tsx:1679`). Home's `useLiveSession` listens for `storage` and `focus` events (`liveSession.ts:121-135`), but the tracker's own state does not, which is the root of the two-tab loss.

**Snapshot at start (B152), CONFIRMED `ps-tracker`.** The session copies `exerciseName`, `plannedPrescription` and the set count, with id `"<catalogId>-<index>"`. It stores **no `catalogExerciseId`, no plan revision and no stable day id**; lineage is the display label `"Week N · Day NN · Split"`. When a plan exercise has no prescription, the default `"3 × 8–12"` is written into history (`DeviceWorkoutTracker.tsx:93`).

**Plan edit after finish (B151, B260), CONFIRMED.** Plan edits never touch the history key (writers above), and a rerender with a different plan leaves the stored session unchanged (`ps-tracker`). **Caveat:** the day-state board keys on the label with no date scope (`liveSession.ts:75-84`). A session from months ago marks this week's "Day 02 · Pull" as trained, and after a frequency change "Day 02" names a different split (CONFIRMED `ps-pure`).

**Next workout (B157), CONFIRMED (code).** Home's "Your next workout" is the day currently selected in Plan (`activeDayLabel` and `customWorkout.length`, `Home.tsx:1509`, `TodayActionPanel.tsx:88-89`). It is not derived from session history or plan rules.

## 4. Add / remove / reorder / Undo (B160–B166)

Everything is **local and synchronous**; no network request is involved in an add. Operations act on `customWorkout`, the draft of the **currently selected day**. An effect writes that draft into the day recorded in `draftDayKeyRef` (`Home.tsx:470-481,533-537`). The Undo closures capture only ids or old arrays, **not the day**.

| Operation | Bound to | Undo | Finding |
|---|---|---|---|
| Add (`Home.tsx:895-907`) | Catalog id, deduplicated against the current day | `filter(catalogId !== id)` on whatever day is current when Undo is pressed | **Wrong day** (CONFIRMED `ps-home`). Added to Day 01, destination switched to Day 02, then Undo: Day 01 keeps the addition and Day 02 **loses its pre-existing instance**. Undo also removes every instance with that catalog id, including intentional duplicates |
| Duplicate (`:982-987`) | New entry id `-(Date.now()+seq)` (`:106`) | None | The only way to make an intentional second instance. Add answers "Already in this workout" (B161: a retry and an intentional add are conflated; there are no request ids) |
| Remove (`:964-981`) | Entry id and array index | Re-inserts at `removedIndex` into the **current** day | Same class as add; CONFIRMED from code, not executed |
| Reorder (`:1001-1017`) | Entry id plus adjacent swap | Swap back on the current day | Same class. Entry ids equal catalog ids, so the same id exists on several days |
| Draft / smart draft (`:1024-1038`) | Whole day | `setCustomWorkout(previous.workout)` onto the **current** day | After a day switch, Undo **overwrites the new day** with the old day's content (CONFIRMED from code) |
| Rest for whole day (`:1046-1052`) | Current day's settings | `setExerciseSettings(previous)` onto the current day | Same class |
| Sport switch (`:788-822`) | Whole three-week store | Restores all weeks | OK |

- **B263:** there is nothing asynchronous in flight. The equivalent hazard is the Undo toast, which stays actionable after the day or week changes.
- **B166:** the toast destination is computed at click time and matches, but nothing authoritative (count or revision) comes back.
- **B164:** each device write is the whole plan document, so it is atomic per write.
- **B165:** concurrent reorder across devices is resolved by whole-document overwrite (PS-05).

## 5. Sync (B167–B177)

| Channel | Durable pending op? | Idempotency | Conflict rule | Deletes | Auth expiry |
|---|---|---|---|---|---|
| Plan → MySQL (`usePlanSync`) | **No.** A 1.5 s in-memory debounce (`usePlanSync.ts:91-96`). The device document survives, but `revisionRef` does not | None beyond `baseRevision` | The server refuses stale writes (`server/workoutPlanSync.ts:46-56`), but the check is **not atomic**: two concurrent saves both succeed (CONFIRMED `ps-sync`, PS-06). The client pull always adopts a differing server copy (PS-04), and on conflict the client takes the server revision and **automatically re-pushes the stale plan**: saves `[base 5 → conflict, base 6 → saved]`, laptop's plan overwritten (CONFIRMED `ps-plansync`, PS-05). The `conflict` state is never rendered (`planSync` unused after `Home.tsx:734`) | Whole document, no tombstone | Error becomes the `offline` state, which is never shown. `pulledRef` and `revisionRef` survive an account change in the same page |
| Workout-derived lifts → Supabase (`useAthleteSync`, `strengthSyncQueue`) | **Yes.** The queue is in localStorage, and it is re-derived from device history on every sync (`useAthleteSync.ts:152-190`) | A local synced-key set only, capped at 5000. There is **no DB unique key**. Lost response, app killed before the key write, or two tabs flushing all produce **duplicate rows** (CONFIRMED `ps-sync`). Keys beyond the cap are re-enqueued (CONFIRMED `ps-pure`) | Insert only | None (device sessions cannot be deleted either) | A missing session creates **a new anonymous user** (`athleteIdentity.ts:42-61`). The synced keys are not per identity, so history is split (PS-16) |
| Profile → Supabase | No. Fire-and-forget on every change (`useAthleteSync.ts:78-87`) | Upsert on `user_id` | Device wins | n/a | Same |
| Capacity → Supabase | No. The signature is recorded **before** the write succeeds (`useAthleteSync.ts:136-143`), so a failure is not retried | Close-then-insert | Device wins after the first restore | Closes rows (status plus `effective_to`) | Same |
| Favourites → MySQL | No. Optimistic local list plus one mutation (`Home.tsx:908-921`) | Server upsert | Union on read; the full list returned by the server replaces the local one (a late response can win) | Direct delete, no tombstone | The failure toast says "will sync later"; **no code does** |

- **Guest-to-account import (B174, B175), CONFIRMED `ps-pure`.** `migrateLegacyRecord` moves the unscoped **plan** into whichever account signs in first and deletes the source. It is implicit, has no ownership prompt, and cannot be repeated. Guest work done after that goes to the next account. Profile and favourites are not claimed (PS-03). Workouts, lifts and body weight are never imported into MySQL.
- **Offline (B167).** Plan edits, workout logging, typed lifts, body weight, favourites (local) and profile all work offline on the device. Priorities, account favourites and plan sync need the network and a MySQL session. Supabase sync needs an anonymous session plus the reference map.
- **UI claims (B169), CONFIRMED (code).**
  - About Me says "Saved to an account on this device… Add an email to reach it from another one" or "Saved to your account and reachable from any device" (`AthleteAccountCard.tsx:27-35`, `AthleteAboutMePanel.tsx:158-160`). In fact nothing is ever read back from Supabase: there is no select on `athlete_strength_entries` and no Supabase sign-in anywhere in `client/src`.
  - Plan, sessions, sets, typed lifts, body weight and favourites never leave the device in this build.
  - HYPOTHESIS (not run against a live server): Home and Progress fire protected queries without `enabled` (`TodayActionPanel.tsx:70-73`, `ProgressOverviewPanel.tsx:46-48`). For every direct-mode user these return UNAUTHORIZED, which `main.tsx:16-21` turns into "Your sign-in has expired… Sign in again from About me".

## 6. Mock, seed and fallback values that can reach a real account (B019)

- **Fallback sport reaches Supabase (CONFIRMED `ps-athletesync`).** `activeSportId = sportId || sportProfiles[0].id` (`Home.tsx:407-408`) resolves to `"wrestling"`. It is passed to `useAthleteSync` (`Home.tsx:1126`), which stamps it into every queued lift (`useAthleteSync.ts:145-149`). A general-mode athlete's row was inserted with `sport_id:"uuid-wrestling"`. The profile upsert guards the mode (`athleteIdentity.ts:115-126`); the lift path does not.
- **Hard-coded production Supabase URL and publishable key** (`lib/supabaseClient.ts:33-36`). Any build without environment variables, including local dev and preview, creates anonymous users and writes lifts into the same project. CONFIRMED (code).
- **Default prescription `"3 × 8–12"`** becomes recorded history for a planned exercise with no prescription (`DeviceWorkoutTracker.tsx:93`).
- **Default `weightUnit: "lb"`** in `athleteBaseline` (`Home.tsx:330`) and in `useAthleteRecord` / `workoutStrengthRecord` defaults. Combined with unitless set weights, this decides the historical load (PS-10).
- **Body weight seeded from the profile** and stamped with the hydration time, not the time it was entered (`Home.tsx:651`, `bodyWeightLog.ts:126-134`).
- **Default equipment** `Commercial gym` (`lib/equipmentProfile.ts:20-23`) is written into the profile when a stored baseline lacks equipment (`Home.tsx:648`).
- **No sample workouts, demo lifts or seeded favourites.** The seeded plan was removed: `customWorkout` starts empty (`Home.tsx:345-353`, guarded by `Home.freshAccount.test.ts`). `server/researchEvidenceSeed.ts` is reference data, not athlete data.

## 7. Launch with a persisted plan (B264)

**Result: a false empty plan, then a silent overwrite of early edits. CONFIRMED in `ps-home` and `ps-home2`.**

1. On first render `onboardingComplete` is false and the lazily loaded quiz is returned (`Home.tsx:1451`). The profile effect flips it after commit (`Home.tsx:632-660`). HYPOTHESIS: the quiz rarely paints, because its chunk loads after the effect.
2. Plan hydration waits for `auth.me` (`Home.tsx:683`). Until it answers, Home renders "Build training around your goals / No session built yet" for an athlete with a saved plan. There is no pending state: `TodayActionPanel` receives no hydration flag.
3. An exercise added in that window is confirmed with the toast "Added to Week 1 · Push". Hydration then **replaces** it with the stored plan: Day 01 after hydration `[1]`, and the added id 4 is gone.
4. If the stored plan JSON is malformed, hydration swallows the error (`Home.tsx:703`) and the next persist writes the empty in-memory plan over it (`Home.tsx:741-757`). CONFIRMED (code).

---

## 8. Material findings

Severity: **P0** loses or duplicates performed data, or leaks one account's data into another, on a path V1 must enable. **P1** is incorrect authority or state, latent loss, or a misleading durability claim. **P2** is hygiene or design debt.

| ID | Sev | B-IDs | Status | Finding and evidence | Suggested remediation |
|---|---|---|---|---|---|
| PS-01 | P0 | B173, B175, B262 | CONFIRMED `ps-home3` | **Sign out A, sign in B, and A's plan becomes B's.** On sign-out the plan key becomes unscoped. Hydration finds nothing (`Home.tsx:690-705`) but sets `hydratedPlanKeyRef` anyway, so the persist effect writes A's in-memory plan to the shared key (`Home.tsx:741-757`). B then claims it through `migrateLegacyRecord`. Output: "B's scoped plan contains A's exercise: true". With plan sync enabled it would also be pushed to B's MySQL row. Latent today (no sign-in UI) | Clear the in-memory plan and profile on any account change before hydrating; never write under a key whose hydration found nothing; make the guest claim an explicit prompt |
| PS-02 | P0 | B173, B262, B020 | CONFIRMED `ps-home` | **Workout history (active and completed sessions, sets), typed lifts, body-weight log, sync queue and synced keys are device-global.** Account 8 renders "1 lift logged · 1 workout recorded" from A's session. The Supabase sync pushes those sessions under whatever anonymous identity the device holds (`useAthleteSync.ts:152-190`) | Namespace every athlete record by owner (Supabase `user_id` or account id), with an explicit guest bucket, and migrate the existing global keys once, with an ownership choice |
| PS-03 | P1 | B173, B177, B262 | CONFIRMED `ps-home` | **Profile and favourites hydrate once at mount, while `auth.me` is still loading** (`Home.tsx:632-660,669-674`, `[]` deps). A signed-in athlete sees the unscoped profile ("Guest"), and an athlete whose profile exists only under `::id` is sent to onboarding. The writers then save the guest profile into the account key (`Home.tsx:708-715`, CONFIRMED from code). `WorkoutHealthPanel.tsx:9` reads the unscoped key directly | Hydrate profile and favourites keyed on the resolved account (same gate as the plan); remove the raw-key readers |
| PS-04 | P1 | B171, B174, B175, B261 | CONFIRMED `ps-pure`, `ps-plansync` | **Plan pull always prefers a differing server copy.** `choosePlan` is called with device `updatedAt: null` (`usePlanSync.ts:49`), so a newer offline or guest plan is replaced by an older server plan ("adopted on pull: laptop") | Persist device edit time and base revision alongside the plan; on divergence, keep both and ask, or do a three-way merge from the base |
| PS-05 | P1 | B171, B163, B169 | CONFIRMED `ps-plansync` | **Conflict protection is defeated client-side.** On `conflict` the hook adopts the server revision (`usePlanSync.ts:78`) and the effect re-pushes the stale plan within 1.5 s: saves at base 5 then base 6, final server `"phone stale edit"`, rev 7. `conflict` and `offline` are never rendered. Refs are not reset when the account changes | On conflict, stop pushing, surface "conflict", and reconcile explicitly; reset sync refs per account |
| PS-06 | P1 | B033, B171 | CONFIRMED `ps-sync` (fake DB) | **`saveWorkoutPlan` is read-then-write** (`server/workoutPlanSync.ts:80-110`). Two saves with `baseRevision 1` both return `saved` rev 2 and the last one wins. (An uncommitted concurrent working-tree edit appears to address this; not verified here.) | `UPDATE … WHERE userId=? AND revision=?` and check affected rows, or use a transaction with `SELECT … FOR UPDATE`; handle the unique-key race on insert |
| PS-07 | P1 | B160, B162, B259, B263 | CONFIRMED `ps-home` (add); code (others) | **Undo acts on the currently selected day, not on the operation.** Add-Undo left Day 01 `[6]` and removed Day 02's pre-existing `[6]`. Remove, reorder, draft and rest Undo use the same pattern (`Home.tsx:964-1052`); draft-Undo overwrites the new day's stack | Record `{weekId, dayKey, entryId, opId}` per operation and apply Undo to that target only, with a conflict check if it was edited since |
| PS-08 | P1 | B264, B169 | CONFIRMED `ps-home`, `ps-home2` | **The launch window shows a false empty plan, and edits made in it are discarded after a success toast** (`Home.tsx:680-706,895-907`) | Add an explicit `planStatus: loading\|ready`, block or queue edits until ready, and render a pending state |
| PS-09 | P1 | B168, B170, B261 | CONFIRMED `ps-sync`, `ps-pure` | **Supabase lift sync is not idempotent.** A committed insert with a lost response is re-sent (2 insert calls), two tabs both send, and the 5000-key cap re-enqueues old lifts (`strengthSyncQueue.ts:99-118`) | Add a client-generated operation id plus a unique constraint on (`user_id`, `client_op_id`) and upsert with `onConflict`, then drop the local cap |
| PS-10 | P1 | B024, B025 | CONFIRMED `ps-pure` | **Workout set weight is stored unitless.** The same stored "100" reads as 45.36 kg (lb) or 100 kg (kg) depending on today's unit (`workoutStrengthRecord.ts:145`). Supabase rows get today's unit (`useAthleteSync.ts:171-172`) | Store the unit (and normalised kg) on every set at completion; migrate history using the unit in effect when it was logged, or mark it unknown |
| PS-11 | P1 | B154, B158 | CONFIRMED `ps-tracker` | **Start ignores an existing active session** (2 active after a start in another tab). **Two tabs overwrite each other's set logs** (set 1 reverted to not completed) (`DeviceWorkoutTracker.tsx:172-180,261-280`) | Re-read storage before start and each checkpoint; merge per set by (session id, exercise id, set index) with a revision; refuse a second active session |
| PS-12 | P1 | B169, B176 | CONFIRMED `ps-tracker` | **Finish with a refused write** toasts "1 set added to Progress", hides the warning, and leaves storage `active` (`DeviceWorkoutTracker.tsx:365-381`) | Branch on `written`: keep the live view and the warning, and offer retry |
| PS-13 | P1 | B155, B156, B265 | CONFIRMED `ps-pure` (zero-set); code | **Counts are defined differently per screen.** A zero-set finish counts as a completed workout. A blank-rep completed set counts as a set but not a lift. Progress unions account and device sources while Home and Strength select one by `directAccess`, and Home's non-direct headline uses a typed-only count (section 3 table) | One shared selector with explicit definitions, reused by Home, Progress and Strength; do not count sessions with no completed observations |
| PS-14 | P1 | B019 | CONFIRMED `ps-athletesync`; code | **The fallback sport "wrestling" is written as `sport_id`** on general or undecided athletes' Supabase lifts (`Home.tsx:407-408,1126`, `useAthleteSync.ts:145-149`). A hard-coded production Supabase URL and key make non-production builds write real rows (`supabaseClient.ts:33-36`) | Pass `hasSportContext ? sportId : undefined`; require environment configuration per environment and fail closed |
| PS-15 | P1 | B169, B167 | CONFIRMED (code); expiry toast is a HYPOTHESIS | **Durability over-claimed.** "Saved to your account and reachable from any device" is shown, but nothing is read back from Supabase and plan, sessions and typed lifts never leave the device. The favourite toast promises a later sync that does not exist. Direct users likely see "sign-in has expired" | Show per-record status (local, syncing, saved to account, failed, conflict) derived from real sync state; gate protected queries on auth |
| PS-16 | P1 | B176, B174 | CONFIRMED (code); trigger is a HYPOTHESIS | **Losing the Supabase session silently creates a new anonymous user** (`athleteIdentity.ts:42-61`). Synced keys are not per user, so earlier lifts stay on the orphaned id and new ones go to the new id. There is no sign-in to recover | Key the sync state by `user_id`; detect an identity change and prompt; provide a real sign-in or link flow before relying on anonymous ids |
| PS-17 | P2 | B174, B175 | CONFIRMED `ps-pure` | **Guest import is implicit, first-account-wins, plan-only and not repeatable** (`deviceStorageScope.ts:37-56`) | Add an explicit "import this device's data into <account>?" step, with an idempotent import id |
| PS-18 | P2 | B152, B170 | CONFIRMED `ps-sync`; code | **In a mixed batch, lifts whose exercise lacks a uuid are marked synced forever** (`strengthSyncQueue.ts:116`). Session exercises carry only a name (no `catalogExerciseId`), so lineage breaks on rename | Store `catalogExerciseId` on session exercises; keep unmappable lifts pending with a reason |
| PS-19 | P2 | B157, B160 | CONFIRMED `ps-pure`; code | **Day identity is a position-plus-label string.** Trained-day state has no date scope; "next workout" is the currently selected day | Give days and weeks stable ids; resolve next workout from plan order and completed sessions |
| PS-20 | P2 | B020 | CONFIRMED (code) | **Priorities are MySQL-only**, and in direct mode "Set focus" silently does nothing (`StrengthGenomePanel.tsx:462,757-760,816`) | Decide the authority; store on device or Supabase, or hide the control, and surface errors |
| PS-21 | P2 | B177 | CONFIRMED (code) | **Destructive load fallbacks.** A malformed plan is overwritten with an empty one; plan exercises missing from the catalog are dropped and re-saved; a profile with an unknown sport is discarded (`Home.tsx:603-604,640-641,703`) | Keep the unreadable original under a quarantine key; version every stored document with explicit migrators |
| PS-22 | P2 | B019, B033, B266 | CONFIRMED `ps-pure` (id collision); code | **Assorted weak ids and writes.** `device-<ms>` ids can collide; capacity writes are marked sent before they succeed; a late favourites response overwrites newer optimistic state (`Home.tsx:915`) | Use UUIDs; mark sent only after success; ignore stale responses by request sequence |
| PS-23 | P2 | B154, B164 | CONFIRMED (code, not exercised) | **Dormant MySQL session API**: start has no operation id, inserts are not transactional, and a retried complete returns NOT_FOUND (`server/workoutSessions.ts:23-52,147-155`) | Add a client op id with a unique constraint, a transaction, and an idempotent complete that returns the existing row |
| PS-24 | P2 | B173 | FIXED (code) | **`sports-genome-user-info` persisted the MySQL user row** on the device, and nothing read it (was `useAuth.ts:43`) | Done: the write was removed, and `useAuth` clears the leftover copy on mount (`client/src/_core/hooks/useAuth.test.ts`) |

## 9. Not verified

- **No live MySQL, Supabase or Vercel.** Server behaviour is from code or a fake DB. I did not inspect Supabase RLS or the grants on `athlete_strength_entries`, `athlete_profiles` and `athlete_focus_areas`, so cross-user Supabase access is **unverified**. The "sign-in has expired" toast for direct users is inferred.
- **The tRPC `useMutation` identity was modelled with raw `@tanstack/react-query`** in `ps-plansync`. PS-05 relies on the result object changing when mutation state changes, which the tRPC wrapper also does (HYPOTHESIS that the behaviour is identical).
- **Multi-tab, restart and offline were simulated in jsdom** (two component instances, remounts, a throwing `setItem`), not in a real browser or on iOS. Sonner's toast lifetime, which bounds the PS-07 Undo window, was not measured.
- **What happens to a real anonymous Supabase session on refresh-token expiry** (PS-16 trigger) was not exercised.
