# Action inventory (§8.1)

Every tappable control on the main screens, with its owner, what it does, where it leads or what it changes, and what the user sees while it is pending, when it succeeds, and when it fails or returns. "Device store" means the on-device record (`localStorage`) the app runs on; writes are synchronous, so there is no pending state unless stated, and a refused write is reported (J-G5).

## Shell (every screen)

| Control | Owner | Action | Destination / mutation | Pending | Success | Failure / return |
| --- | --- | --- | --- | --- | --- | --- |
| Logo + wordmark | `Home.tsx` topbar | none (identity) | — | — | — | — |
| Context line "Wrestling · Max strength · 5 days" (button, "Edit training preferences") | topbar | navigate | Profile | — | Profile opens | Back returns to the prior screen (J-G4) |
| Search | `UniversalSearch` | opens the app-wide search | overlay; a result opens its owner screen | — | result screen | close returns |
| Profile (single-person icon, "Profile and settings") | topbar | navigate | Profile; icon lit `aria-current="page"` | — | — | Back returns (J-G4) |
| Local tabs (Plan / Review / Workout / Matches; Movements / Muscles / Exercises; Progress / Strength) | `WorkspaceTabs` | navigate within the destination | sibling screen at its heading | — | underline moves, title changes | — |
| Bottom bar Home / Body Lab / Train / Progress | `MobileBottomNav` | navigate | the destination's remembered sibling; tapping the active one returns to top (LOC-06) | — | — | keeps drafts, filters, live workout |
| Resume strip "… workout in progress · Resume" | `SessionResumeBar` | navigate | Workout, the live session at its current set (J-B5) | — | — | shown only per the strip policy (§9) |

## Home

| Control | Action | Destination / mutation | Success | Failure / return |
| --- | --- | --- | --- | --- |
| Review workout | navigate | Workout prestart for the same day; nothing starts | — | — |
| Resume {day} workout (live state) | navigate | Workout, current set | — | — |
| View workout details (live) | navigate | Workout | — | — |
| Edit plan | navigate | Plan on the same day | — | — |
| Open training plan / Create your plan (empty states) | navigate | Plan | — | — |
| View plan | navigate | Plan, current week | — | — |
| Lifts / workouts line (button) | navigate | Progress | — | — |
| Find exercises / Explore muscles & movements / View strength progress | navigate | Exercises (default filters) / Movements / Strength at their headings (J-A3–5) | — | — |
| Movement focus rows (View X details) | opens the exercise overlay | — | overlay; Back or Close returns with focus (J-H5) | — |
| All matches / Explore in Body Lab | navigate | Matches / Muscles | — | — |

## Body Lab

| Control | Action | Destination / mutation | Success | Failure / return |
| --- | --- | --- | --- | --- |
| Sport / modifier selects (Movements) | change the selected sport | a valid first action is selected | list and figure update | — |
| Previous / Next action, action rows, family chips, search, sort | change the selected action or the list | selection kept across tabs (J-E) | — | disabled at list ends |
| Explore involved muscles | navigate | Muscles with the same action (J-E2) | — | — |
| Front / Back of the body | toggle the figure | — | figure turns | — |
| Muscle rows and map regions | select a muscle | selection shared by list and figure | selected strip shows role and confidence | Clear muscle selection |
| Find {muscle} exercises | navigate | Exercises with that muscle filter as a removable chip (J-E3/E4) | — | Back returns to Muscles with the selection (J-E5) |
| Search exercises, Filter & sort, chips (Remove filter X), All / Favorites, Load more | filter the list | list count "N of 400" | — | no results: Clear filters, query kept |
| Row: View details (Inspect X) | opens the overlay | history entry | Close / Escape / Back returns query, scroll, filters and focus (J-C3, J-H5) | — |
| Row: heart (Save/Remove X to/from favorites) | toggle | favourites store | "Saved to favorites"; Favorites tab count | never adds or opens (J-C8) |
| Row: plus (Add X to Week N · Day) | add | the day the strip names (J-C1/C2) | "Added to Week N · Day" with Undo and View workout (J-C4/C5) | duplicate: "Already in this workout" (J-C7) |
| Adding to Week N · Day · Change | change the add destination | week/day chooser | strip updates; next add goes there (J-C6) | — |
| Overlay: Add to Week N · Day, heart, Explore {muscle} in Body Lab, Evidence context, Close | same operations as the catalog | — | — | — |

## Train

| Control | Action | Destination / mutation | Success | Failure / return |
| --- | --- | --- | --- | --- |
| Week pills (Week 1 · saved / Week 2 · Generate / Week 3 · Locked) | select or generate a week | plan store | pill selected; days update | Locked is inactive |
| Day tabs | select the day to edit | `activeDayIndex`; never the live session (J-B3) | "Editing …" line when a workout is live | — |
| {day} workout in progress · Resume | navigate | the live session (J-B5) | — | — |
| Row: Edit sets & reps (chevron) | expand the prescription | — | steppers for sets, reps, RPE, rest | — |
| Row: Move X earlier / later | reorder | day store, written through | order changes; "Saved" | disabled at the ends |
| Row: remove | remove the exercise | day store | row gone | — |
| Add exercises / Open workout (or Resume {day} workout) / Import plan / Print | navigate or open | Exercises / Workout / import flow / print sheet | — | — |
| Smart Draft (expander) → Draft this session | replace the day's rows with a draft | day store | rows replaced, "Draft loaded" message | see PLAN-11 note in the checklist |
| Review: Open workout / Resume {day} workout | navigate | Workout | — | — |
| Workout prestart: Start workout | start | creates the live session (a snapshot of the day) | live card | — |
| Workout prestart: Edit this day, row details, rest stepper | navigate / adjust | Plan / overlay / rest length | — | — |
| Log set N | log | the live session on the device | set counted, next set shown, rest starts (J-F3) | refused write: alert, entry kept, retry (J-G5) |
| Skip {exercise} | skip the exercise | marked skipped, not logged | next exercise | Put back in Full session |
| −15s / +15s / Skip (rest) | adjust or end the rest | session rest | clock updates | — |
| Full session → per-set Log set / Undo, Skip / Put back | edit earlier sets | session | — | — |
| Finish workout early / Finish workout · add N sets to Progress | finish | one completed record; plan untouched (J-F5) | prestart returns; Progress, Home and Strength update | — |
| Matches: sport select, Change movement, Why this match?, Match score, plus | change context / disclose / add | same add contract as the catalog | — | — |

## Progress

| Control | Action | Destination / mutation | Success | Failure / return |
| --- | --- | --- | --- | --- |
| Workouts recorded / Lifts logged | navigate | records list / Strength | — | — |
| Session records | open the record's sets | — | — | — |
| Strength: map regions, region rows | open the region record sheet | — | same rank and percentile as the map; close restores scroll | — |
| Log a lift → exercise search, result, measurement, date, load, reps, more options, Save this lift | record a lift | device store (or the account when signed in) | "Lift saved on this device."; Recent lifts, coverage and Home update (J-D4) | Save disabled with the reason ("Choose an exercise…", "Enter the load in lb…"); refused write: alert, entry kept (J-G5) |
| Recent lifts → review, Remove | open / delete a typed lift | device store | — | remove error shown inline |
| Set it as a target / Review training | adopt a capacity target / navigate | profile / Plan | — | — |

## Profile

| Control | Action | Destination / mutation | Success | Failure / return |
| --- | --- | --- | --- | --- |
| Edit profile / Done editing | show or hide identity fields | profile store, written through | "Saved on this device as you change them." | — |
| Sport, Goal (expanders), Days per week, Session time | change the preference | profile store | topbar context line updates; survives reload (J-G2) | — |
| Equipment: gym access, equipment grid | toggle | profile store | summary count updates (J-G3) | — |
| Training priorities | choose a region/capacity | profile store | — | — |
| Account & sync | opt in/out, sign in | account | status line | — |
| Appearance: Theme | change | theme store | applies at once | — |
| Security: Enable Face ID / passkey, Remove | passkey enrol/remove | account | list updates | error toast |
| Guides & research, Launch video | open | guide / research / onboarding restart / video setting | — | — |
