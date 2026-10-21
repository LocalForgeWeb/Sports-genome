# Choosing the training days (Train → Edit days)

**Request (Oct 21):** "in the train section you should be able to select which days you want to do. You shouldn't be forced to do a certain split based on the available days. Make it so you can easily pick which day you want to do, i.e. upper, lower, push, pull, all the stuff."

## What changed

**Before:** the number of training days decided every day's type, through `splitDaysForFrequency`. Three days was always Push / Pull / Legs, four was always Upper / Lower twice, and no day could be changed.

**The editor:** the training plan header now has **Edit days**. It opens a sheet (`SplitEditorSheet`) where:

- each day is a select offering all seven day types: Push, Pull, Legs, Upper, Lower, Full Body, Sport Transfer. A type can repeat.
- days can be added or removed, from 1 to 7.
- seven common weeks apply in one tap, and **Recommended** goes back to the split for the chosen length.
- nothing applies until **Save days**. Before then, each day shows how many exercises it will hold and, if they move, which day they come from (for example "5 exercises · from Day 03 · Legs"). A built day the new week has no place for is named, as hidden, not deleted.

**Storage:**

- The chosen week is stored in the plan JSON as `split`, and only when it differs from the recommended split for its length.
- The plan already syncs to the account. The server stores the plan as an opaque string, so there is no schema or migration change.
- The profile's day count follows the week's length.

**Profile frequency changes:** changing the day count in the profile keeps the chosen days that still fit, and fills new positions from the recommendation (`effectiveSplit`).

## Records follow the same remap as a frequency change

`remapDaysForFrequency` moves each built day's record:

1. A day that keeps its slot keeps it.
2. Otherwise a day goes to the nearest slot with the same type.
3. Otherwise it goes to the same position under the new type.
4. Otherwise it stays under its own key, hidden.

Three fixes came with this:

- **Every week moves, not only the open one.** Before, changing the frequency left Week 2 and Week 3 records under keys the week could no longer address.
- **Only built days claim slots.** An empty day could take a slot by its label and push a built day out. For example, an empty Full Body day took Day 01 of a "Full body ×2" week and hid Push.
- **A hidden day returns to its own slot.** Before, another day could be moved onto that slot and overwrite the hidden day's record.

## Adopting the account's plan re-reads it

Before, adopting the account's copy of the plan (`adoptServerPlan`) wrote it to the device and cleared the hydration marker. The hydration effect's inputs did not change, so the plan was not read again until the next reload, and saving stayed off until then. A request counter now re-runs hydration, which also brings in the account's chosen days.

## Checks

- **Unit tests:**
  - `splitCycle.test.ts`: chosen-split helpers.
  - `trainingDayPlan.test.ts`: rename, swap, empty days, hidden-day revival, carried open day, preview.
  - `SplitEditorSheet.test.ts`: the editor.
  - `TrainingPlanHeader.interaction.test.ts`: the entry point.
  - `Home.chosenSplit.test.ts`: the wiring.
- **Browser:** `probes/split-editor.mjs` ran against the production build (`vite preview`) in headless Chromium at 390×844 and 320×640. It was signed out with the network stubbed. **42/42 checks pass.** They cover:
  - editing, then saving and reloading.
  - the stored `split` and day count.
  - the hidden-day warning, and Cancel.
  - Recommended.
  - no exercise lost.
  - no sideways scroll.

  Screenshots are in `screenshots/`. This is viewport emulation, not a phone.

Run the probe with: `npx vite preview --port 4173`, then `node docs/split-editor/probes/split-editor.mjs <out-dir>`.
