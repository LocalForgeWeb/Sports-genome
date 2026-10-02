# First-time-user comprehension check (§17)

**Status: heuristic walkthrough; human validation pending.** No person was asked to use the app for this record. What follows is the six tasks from the brief walked through the built app (commit on `main`, 390×844 emulated viewport, no coaching, only what is visible on screen), noting at each step which visible cue answers the question and where a newcomer would have to guess. Nothing here is a measured time or a success rate.

## The six tasks

### 1. Find out what you should do next

- Open the app: the first screen says **Home** (small label) and **Good morning**, then a labelled block **Your next workout · Sport Transfer · Week 1 · Day 05 · 6 exercises** with one orange button, **Review workout**, and a quieter **Edit plan** link. With a workout under way the same block reads **Continue your workout**, states the day and "1 of 20 sets logged · next: Cable Rotational Row, set 2", and the one orange button is **Resume Sport Transfer workout**.
- Cue used: the only orange button in the first screen. No guessing needed.
- Watch-out found and fixed earlier in this work: Home used to open with "Log your first lift" above the workout; it no longer does (J-D3).

### 2. Find an exercise for a muscle or sport movement

- From Home, the **Explore Sports Genome** list has three plain rows: **Find exercises** (search by exercise, muscle or equipment), **Explore muscles & movements**, **View strength progress**. Either of the first two works.
- Find exercises opens **Exercise catalog** with a search field labelled "Search exercises", "62 of 400" style counts, **Filter & sort**, and each row's own **View details**, heart and plus controls.
- Explore muscles & movements opens **Movement explorer** (the sport's actions listed, one selected) with **Explore involved muscles**; that opens **Muscle map**, whose rows are the muscles by role; picking one shows **Find gluteal complex exercises** (the muscle's own name), which opens the catalog with a removable filter chip.
- Cue used: the row labels. Guess points: the word "action" for a sport movement (the list is titled "Explore actions"); a newcomer will read it once and understand from the examples (double-leg shot, penetration step).

### 3. Add it to a specific workout and tell me which workout received it

- In the catalog the bottom strip reads **Adding to Week 1 · Pull · Change**, so the target is on screen before any add. The plus control is named "Add Barbell Overhead Press to Week 1 · Pull" for assistive technology.
- After the tap a message reads **Added to Week 1 · Pull — Barbell Overhead Press is in that day now**, with **Undo** and **View workout**. View workout opens the Plan on that day with the new row last.
- A second tap answers **Already in this workout**.
- Cue used: the strip and the message. No guessing needed; the user can name the workout from either.

### 4. Resume the workout already underway

- On Home: the orange **Resume Sport Transfer workout** button.
- On any other screen except the workout itself: the bottom strip **Sport Transfer workout in progress · 1/20 sets · Cable Rotational Row · set 2 of 4 · Resume**.
- On Plan while another day is being edited: **Editing Week 1 · Day 01 · Push** and **Sport Transfer workout in progress · Resume** on the next line.
- Cue used: the word Resume with the workout's name. No guessing.

### 5. Find your recorded strength progress

- Home → **View strength progress** ("Inspect your recorded lifts and muscle ranks") opens **Strength Genome**: "N / 18 regions covered · N lifts recorded", the body map, **Log a lift**, **Recent lifts**.
- Or bottom bar **Progress**, whose two tabs are **Progress** (workouts recorded, lifts logged) and **Strength**.
- Cue used: the Home row or the Progress destination. Guess point: "Genome" is a brand word; it is reachable from the plainly named row and tab, so the name does not have to be understood first.

### 6. Change available equipment and return to where you were

- The profile control (single-person icon, top right, named "Profile and settings") opens **About me**. The collapsed group **Equipment · Commercial gym · 7 types available** opens to the gym-access row and the equipment grid; a tap toggles an item and the group's summary count changes at once. The page states "Saved on this device as you change them."
- The device or browser Back returns to the previous screen with its state (J-G4: Plan on the same day).
- Cue used: the profile icon, which is the one control in the top right besides Search. Guess point: a newcomer must recognise the person icon as settings; it has an accessible name and no competing icons, and the context line beside the logo ("Wrestling · Max strength · 5 days" with a sliders icon) also opens the same page.

## USER-02 — places that needed a guess, and what was done

| Place | Guess required | Treatment |
| --- | --- | --- |
| Top-right icons | Person icon = profile and settings | Single-person icon only; accessible name "Profile and settings"; the sport/goal/days line beside the logo is a second, worded way in ("Edit training preferences"). |
| Catalog plus | What it adds to | The destination strip ("Adding to Week 1 · Pull") sits on the page; the control is named with the day; the result names the day. |
| Prescription chevron in Plan | Whether it navigates or edits | Labelled "Edit sets & reps" on ordinary phones; reorder arrows are named "Move … earlier/later" and sit apart from it. |
| "Genome" in Strength Genome / Sports Genome | Brand word | Reached through plain rows and tabs (View strength progress, Progress › Strength); the page explains coverage vs lifts vs rank in its first lines. |
| "Action" in Movement explorer | Sport-movement vocabulary | Kept (it is the app's term and the list shows concrete examples); the page's one-line purpose says "How your sport moves, one action at a time." |
| Match score and tag in Matches | What 0–100 means | A lens line under the heading says the score is how well the exercise serves the movement's demands and the tag is the contextual grade, not a rank of the athlete. |
| Review tab | Whether it is progress | Sub-line: "checks the planned workload, not what you have completed". |

## USER-03 — fixed rather than tutorialised

Every row above was resolved in the interface itself (labels, destination strip, named controls, purpose lines). No mandatory tutorial was added; the existing guide remains under Profile › Guides & research.

## USER-04 / USER-05

No human test took place. This document is a heuristic walkthrough by the implementer and must not be read as "usability verified by users". If a willing tester is available, run the six tasks above uncoached and record actual hesitations and wrong turns in this file.
