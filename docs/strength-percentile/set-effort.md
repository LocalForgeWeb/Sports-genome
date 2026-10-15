# Sets not taken to failure

**Decision:** the owner, 15 Oct 2026: "you should be able to specify a set isn't being taken to failure. For example, good mornings are usually low weight, and that shouldn't be used to give someone a lower ranking, especially when they have more strenuous and demanding exercises, unless the good morning is specifically a 1 rep max."

On how to ask: "succinct", "not like a popup", and "not for every exercise".

**Code:**
- the rule: `shared/setEffort.ts`;
- the ranks: `aggregateMuscleStrengthWithFloors` in `server/muscleAggregation.ts`;
- the control: `client/src/components/SetEffortChoice.tsx`.

## The rule

A set taken to failure is a **measurement**: the athlete could do that much and no more. A set stopped short of failure is a **floor**: they could do at least that much.

1. A floor may **raise** a rank, never **lower** it.
   - The measured lifts are aggregated as before.
   - Then, muscle by muscle, the floors that read that muscle are tried strongest first. Each is kept only where it raises the muscle.
   - A kept floor weighs exactly as a measured lift would; only the decision to keep it differs.
2. A muscle read from nothing but floors is still ranked, shown as **"At least 41st percentile"** (`MuscleScore.atLeast`).
3. A logged **one-rep max** always counts in full, whatever else is said.
4. The single-lift card shows a floor as **"At least …"**, with one sentence saying why.

### What counts as not to failure

- **The athlete said so:** `effort: "not_to_failure"` on a workout set or a typed lift.
- **A usually-light exercise left unmarked.** The athlete can mark the set "To failure" and it then counts in full.
- **Anything else left unmarked** counts as before, as a measurement. The card keeps its note that effort was not recorded.

## The usually-light list

The list is `usuallyLightExercises` in `shared/setEffort.ts`. It holds only exercises the ranks actually score (a comparison curve, or a related lift's), because anywhere else the answer changes nothing.

| Why it is usually light | Exercises |
|---|---|
| Hinges done light for the lower back and hamstrings | Good Morning, Seated Good Morning, Cable Good Morning, Barbell Hip Hinge, Cable Pull-Through, Reverse Hyperextension |
| Single-leg hinges, held back by balance | Single-Leg Romanian Deadlift, Landmine Single-Leg RDL, Cable Single-Leg Deadlift |
| Shoulder-health pulls | Face Pull, Rope Face Pull with External Rotation, Cable Y-Raise |
| Glute activation, read on curves of far heavier hip extensions | Cable Glute Kickback, Machine Glute Kickback, Cable Quadruped Hip Extension, Cable Donkey Kick, Cable Fire Hydrant |
| Chops, done for control | Cable Wood Chop, Cable Reverse Chop, Cable Horizontal Chop |

**Not on it:** lifts trained heavy as strength lifts, such as deadlifts, Zercher lifts, squats, the Romanian deadlift and the hip thrust. Ordinary isolation work is also left off, because its comparison data is itself light.

To add or remove an exercise, edit the map. A test pins every entry to its catalog name.

## How it is asked

There is never a dialog.

| Where | Usually-light exercise | Any other exercise |
|---|---|---|
| Live workout, set card | One line, "Usually done light. This set was", with **Not to failure** already chosen and **To failure** beside it | A quiet "Not to failure" toggle, off unless pressed |
| Live workout, a logged set | A small "Not to failure" chip, to change it afterwards | Same chip |
| Strength log, typed lift | Same line as the set card (hidden for a measured 1RM) | Same toggle |

"How ranks work" carries the rule in two sentences (`data-rank-effort`).

## Where it is kept

The effort is stored with the set on this device:
- `DeviceSetLog.effort` on a workout set;
- `DeviceStrengthObservation.effort` on a typed lift.

It travels to the ranks as `notToFailure` on the lift, goes through `score_strength_profile_v1` as `not_to_failure` on the observation, and comes back on its score as `input_observation`. No database function changed.

The account sync (off in this build) does not send it yet.

## Pinned in

- `server/setEffortRanks.test.ts`: a weak not-to-failure Romanian deadlift beside a squat leaves the lower back as the squat ranked it; a strong one raises it; a muscle only it reads shows "at least".
- `client/src/lib/setEffort.test.ts`: the list, the rule, storage, the card.
- `client/src/components/DeviceWorkoutTracker.addRemoveEffort.test.ts`: the control in the workout.

## Undo

Revert the commit. Stored efforts stay on the device and are simply ignored.
