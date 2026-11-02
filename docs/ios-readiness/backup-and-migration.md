# Moving a web history to the iOS app (A03)

Safari's storage and an installed app's storage are separate. Installing the iOS app does not bring an athlete's web workouts across, and account sync is not finished (see `data-inventory.md`). Until it is, the move is a backup file.

## For an athlete

**On the web (Safari or any browser):**

1. Open Sports Genome, then **About me → Your data → Save a backup**.
2. A file named `sports-genome-backup-YYYY-MM-DD.json` is saved.
   - On iPhone Safari it goes to Files → Downloads.
   - The message says how many workouts, typed lifts and body-weight entries it holds.
3. Keep that file somewhere the other device can reach: Files / iCloud Drive, AirDrop, or email to yourself.

**In the iOS app (or another browser):**

1. Finish the short onboarding, then open **About me → Your data → Restore from a backup** and pick the file.
2. Read the preview before importing. It says, per kind of record:
   - how many will be added;
   - how many are already there;
   - how many differ from what this device has. Those are kept aside, never replaced.
3. The profile and plan are taken from the backup only if this device has none. To use the backup's instead (for example over the plan onboarding just made), tick **Use the backup's profile and plan instead of this device's**. This device's own are kept aside, so nothing is lost.
4. Tap **Import**. If the plan or profile changed, tap **Reload to open the imported plan**.
5. Check one workout you know, in Progress, against the web. **Undo** puts the device back exactly as it was before the import.

**Running the import twice is safe.** The second preview says everything is already there, and Import stays disabled.

## What the backup contains, and what it never contains

| Contains | Never contains |
|---|---|
| every workout as stored: sets, drop-set stages, sides, holds, units (including old unit-less sessions), swaps, notes, an unfinished workout, and fields from releases newer than this one | sign-in tokens (`sports-genome-auth-v1`), cached account details |
| typed lifts, body-weight history | shared links' manage secrets |
| profile, plan, week names, favourites | the upload queue (rebuilt from the workouts) |
| specialization targets, measurements, stacks, exclusions | another account's records |

**Format:** JSON, `{"format":"sports-genome-device-backup","version":1,"exportedAt",...,"build":{...},"records":{...}}`.

**What import refuses, with a reason and no change to the device:**
- a newer version of the format;
- anything that is not this format;
- a file over 25 MB;
- the wrong shapes.

Keys that could reach an object's prototype are dropped while parsing.

## Guarantees, and the tests that hold them

| Guarantee | Test |
|---|---|
| 120 workouts with old schemas, a drop set, a swap, a hold, unilateral sets, notes, units and an unknown field round-trip exactly | `deviceBackup.test.ts`: "brings across every workout…" |
| Import goes to the signed-in owner, not the shared keys | "imports into the signed-in owner's records" |
| A second import changes nothing | "is safe to run twice" |
| A clash keeps the device's copy and sets the imported one aside | "keeps the device's copy of a clashing workout" |
| Only one running workout | "does not start a second running workout" |
| Undo is exact | "can be undone exactly" |
| A refused write leaves the device exactly as it was | "leaves the device exactly as it was when storage refuses part of the import" |
| Bad files are refused before anything is written; invalid and duplicate records are counted and skipped | "a file that is not a good backup" |
| The screen previews, imports only on request and undoes | `YourDataPanel.test.ts` |

## Not yet verified

- **The real move into the native build.** The audit's acceptance step — export on web, then import into the iOS app — needs the native build and a device (`native-build.md`). In headless Chromium the file picker and the import work. On iOS, the Files picker must be checked in WKWebView before athletes are told to move.
- **Storage for very large histories.** For years of history, localStorage's size limit (about 5 MB per origin in Safari) is the ceiling. The native app should move workout records to a durable store (SQLite or a file) behind the same `readOwnedList` / `writeOwnedList` interface, with a migration test. That is not done.
