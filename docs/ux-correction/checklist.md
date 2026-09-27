# Sports Genome — UX completion and correction checklist for Claude

**Priority implementation brief • September 26, 2026**

**Assignment:** finish the existing redesign, fix the navigation and state problems visible in the latest recording, and make the app understandable to someone who has never used it. Implement the work in the existing application. Do not return another design proposal in place of working changes.

**Primary evidence:** `ScreenRecording_09-26-2026 13-26-17_1.mp4`, approximately 82.5 seconds. Times below are approximate positions in that recording, not claims about exact tap events or root causes.

**Design direction to preserve:** navy sports-science identity, original Sports Genome logo, refined technical typography, useful anatomy and analysis, restrained orange actions, approved strength-rank artwork, and open layouts with fewer boxes.

**Problem to solve:** the app looks better but still feels unfinished. A first-time user got lost. The top navigation is cramped and sometimes clipped; Home does not adequately orient the user; buttons do not consistently explain their effect; active workout context conflicts visually with planning context; some screens show inconsistent data or large empty areas.

This document is a correction and completion contract. It supersedes conflicting navigation, Home, interaction-feedback and scroll instructions in the earlier implementation handoff. The final 12 reference images remain visual inspiration, but this document takes priority where those images failed to describe usable behavior. Do not restart the entire application or invent another set of duplicate pages.

---

## 1. Read this first: what counts as finished

The goal is a working, coherent application, not a collection of styled components. Maintain the checklist throughout the work. Check an item only after its actual requirement is met. Coding a component is not the same as verifying the user flow.

### Status rules

- `[ ]` means unfinished or unverified.
- `[x]` means implemented and verified with appropriate evidence.
- For a genuine blocker, leave the box unchecked and append `BLOCKED — reason; dependency; work completed; next action`.
- For an item that demonstrably does not apply, leave it unchecked and append `N/A — specific reason confirmed from the repository`. Do not use N/A to discard an inconvenient requirement.
- If a regression appears, reopen the affected item.
- Do not count a build passing as proof of appearance, navigation, persistence, or usability.
- Do not mark an entire section complete because one representative screen works.

Use concise evidence grouped by section or user journey; there is no need for a separate screenshot for every checkbox. Every checked item must, however, be traceable to an actual change or verification result.

### Required working records

- [ ] **EXEC-01** Copy this document into the repository's appropriate task/documentation location without changing its requirements to make completion easier.
- [ ] **EXEC-02** Create a small progress record with current phase, completed sections, open blockers, evidence paths, and the next concrete action.
- [ ] **EXEC-03** Update that record after each meaningful implementation phase, not after every tiny edit.
- [ ] **EXEC-04** Before ending a session or losing context, record the exact remaining work and any commands needed to resume.
- [ ] **EXEC-05** On resumption, read the progress record and continue the existing work instead of restarting or assuming unchecked work is done.
- [ ] **EXEC-06** Preserve applicable repository instructions, existing release procedures, user data, original logo, and approved assets.
- [ ] **EXEC-07** Continue through all unblocked required work. A single missing asset must not stop unrelated navigation, layout or state fixes.
- [ ] **EXEC-08** Do not claim that deployment, device testing, accessibility testing or a user test occurred unless it actually did.

### Completion requires all of the following

1. Correct navigation and meaningful location cues.
2. A useful Home screen with one clear next action and understandable discovery paths.
3. Explicit action labels, destinations and visible results.
4. Correct separation of the active workout, selected plan day and historical records.
5. Consistent data across screens or clearly explained legitimate scope differences.
6. Complete, readable layouts with no accidental blank space, clipping or dead controls.
7. Retained technical depth and existing functionality.
8. Actual runtime verification and documented evidence.

Do not substitute a generic dashboard theme, strip out advanced capability, or declare that the remaining pages “follow the pattern.” Finish them.

---

## 2. Evidence register: observed symptoms versus unproven causes

The recording establishes visible symptoms. It does not expose the code, backend state, exact touch coordinates, or every loading transition. Reproduce symptoms before declaring a root cause.

| ID | Approximate recording position | Visible symptom | Required investigation / correction |
|---|---|---|---|
| OBS-01 | 18–33s and other Train views | Matches is partly obscured near the search/profile controls | Inspect header width allocation, fixed utility controls, overflow and tab sizing; fix the shared shell |
| OBS-02 | 0–3s, 42s, 75s | Home includes a mostly empty tab/utility strip with small icons and overflow-like arrows | Remove route-inappropriate tab chrome from Home; provide clear identity and page location |
| OBS-03 | 75s | Home leads with “Log your first lift” and “Nothing recorded yet” despite an active workout | Rebuild Home hierarchy and validate the actual data condition for this prompt |
| OBS-04 | 63–69s versus 75s | Strength shows 15 lifts and 12/18 coverage; Home shows 0 lifts | Trace sources, record types, hydration, user identity and scope; do not force one constant to match the other |
| OBS-05 | Throughout; particularly 33–39s | Plan is editing Upper while an active Pull workout remains present | Separate editing context from active-session context through explicit labels and independent state |
| OBS-06 | Around 18s | Session displays a large blank region above rest controls | Reproduce at entry, scroll, hydration and resume; determine whether layout, scroll or loading is responsible |
| OBS-07 | Multiple transitions | Some destinations appear partway down their content | Verify per-route scroll behavior rather than assuming every transition was intentional scrolling |
| OBS-08 | 48s and 81s | Catalog plus controls do not show an obvious destination in the captured viewport | Make the destination and add behavior explicit; do not assume an unseen confirmation fixes the visible ambiguity |
| OBS-09 | Home and most non-workout views | Persistent Resume strip consumes space and can duplicate the main Home action | Define where the compact resume control appears and when it should yield to the page's primary resume action |
| OBS-10 | 33s and 39s | A generic profile prompt interrupts the plan before exercise rows | Move nonessential profile prompting below the main task or into a contextual preference entry |
| OBS-11 | Several headers | Labels and icon placement vary; large chrome gives weak orientation | Use one shared header and a documented route-to-title mapping |
| OBS-12 | Catalog, Plan, session views | Different borders, row patterns and button styles remain mixed | Complete the shared component migration and remove obsolete CSS conflicts |

- [ ] **AUD-01** Watch the complete recording and reproduce each relevant symptom in the current build.
- [ ] **AUD-02** Record each reproduced symptom's current route, viewport, user/data state and actual cause.
- [ ] **AUD-03** Mark symptoms that cannot be reproduced as unconfirmed; retain their regression checks rather than dismissing them.
- [ ] **AUD-04** Do not infer a backend fault, CSS bug or stale data source solely from a screenshot; inspect the responsible path.
- [ ] **AUD-05** Capture a baseline of Home, the clipped Train header, Plan with another workout active, Catalog and Strength before changing them.

---

## 3. Work order and dependencies

Use this order to avoid polishing screens whose structure is still wrong.

| Phase | Priority | Work | Exit condition |
|---|---|---|---|
| A | P0 | Repository/runtime inventory and evidence reproduction | Responsible components, routes and data paths identified |
| B | P0 | Shared header, tab layout, location cues and scroll behavior | No hidden destinations; top-level entry is understandable |
| C | P0 | Home hierarchy and lift-count inconsistency | Home gives a truthful next action and understandable overview |
| D | P0 | Action feedback, add destination and workout/plan separation | Core actions are explicit and state survives navigation |
| E | P1 | Complete every page and owned overlay | No unfinished sections, duplicate pages or lost features |
| F | P1 | Responsive, accessibility, error/loading and visual consistency | Real app works on narrow mobile layouts and constrained states |
| G | P0 | End-to-end verification and delivery | Evidence supports checked items; blockers are specific |

P0 means required to address the core reported usability failures. P1 is still required for completion; it is not optional backlog. Avoid unrelated new features during this task.

- [ ] **SEQ-01** Establish the runtime and current behavior before rewriting shared components.
- [ ] **SEQ-02** Finish the shared shell before adjusting its height separately on every page.
- [ ] **SEQ-03** Fix the shared record selectors before changing the copy of the contradictory Home count.
- [ ] **SEQ-04** Define action ownership and state transitions before adding success messages.
- [ ] **SEQ-05** Finish all main pages and transient states before the final verification pass.

---

## 4. Repository and runtime inventory

Do this efficiently. The inventory is to enable implementation, not to replace it with lengthy analysis.

- [ ] **INV-01** Read applicable project instructions and determine framework, routing, state management, storage and styling conventions.
- [ ] **INV-02** Identify the running entry point and the commands actually used to build, check and test the app.
- [ ] **INV-03** Identify the shared header, global navigation, local tabs and main scroll container.
- [ ] **INV-04** Map each visible destination to one actual route/component owner.
- [ ] **INV-05** Locate both current and legacy CSS rules affecting the header, cards, lists and selected navigation.
- [ ] **INV-06** Locate Home's record count and empty-state selector, Strength's lift count, and Progress's historical data source.
- [ ] **INV-07** Locate active-session identity, selected planning-day identity and resume behavior.
- [ ] **INV-08** Locate exercise-add/favorite operations and their persistence/error paths.
- [ ] **INV-09** Locate original logo, rank configuration, approved badge assets, anatomy geometry and existing exercise media.
- [ ] **INV-10** Inventory existing functions that must remain reachable: import, print, draft generation, filtering, sorting, favorites, logging, evidence, equipment, sharing, security, guides and preferences.
- [ ] **INV-11** Identify existing deep links and compatibility behavior needed after visible label changes.
- [ ] **INV-12** Do not duplicate an existing service, store or router just to make the redesigned components easier to mock.

Required short inventory output: a route-owner table, key shared component paths, the relevant data selectors/services and specific asset gaps. Then begin implementation.

---

## 5. Shared top navigation: make it useful and complete

The request for “more” at the top means more meaningful orientation and useful structure. It does not mean more empty height, another decorative strip, or extra unlabeled buttons.

### 5.1 Header structure

Use one shared shell with these responsibilities:

**Brand row:** original circular logo and readable Sports Genome identity on the left; Search and Profile utilities on the right. Keep utility controls out of the local-tab layout. Profile uses a single-person icon, not a two-person/team icon.

**Page identity:** one readable current page heading such as Home, Training plan, Review your week, Workout, Exercise matches, Movement explorer, Muscle map, Exercise catalog, Your progress, Strength Genome or About me. It may be in the content immediately below the brand row; do not repeat the same large heading in both places.

**Context:** compact sport/goal/schedule information, secondary to location. If editable, give it a clear “Edit training preferences” affordance. Do not disguise editable settings as unlabeled decorative pills.

**Local tabs:** only for destinations with sibling screens. Occupy their own full-width row with no overlaid Search/Profile controls.

- [ ] **NAV-01** Move Search/Profile into the brand row and remove their competing width from the tab row.
- [ ] **NAV-02** Remove the empty local-tab strip from Home and Profile.
- [ ] **NAV-03** Ensure every page has an explicit readable identity on entry.
- [ ] **NAV-04** Preserve the original logo and improve its surrounding alignment; do not redesign it.
- [ ] **NAV-05** Make Search and Profile touch targets at least 44px, with accessible names and clear iconography; use short visible labels where space supports them.
- [ ] **NAV-06** Replace the two-person profile symbol with the established single-person profile meaning.
- [ ] **NAV-07** Eliminate clipped tabs, overlapping controls, orphan chevrons and unexplained overflow arrows at ordinary mobile widths.
- [ ] **NAV-08** Test tab widths with the actual font and labels, not placeholder text.
- [ ] **NAV-09** Use content-driven layout rather than absolute offsets guessed for one screenshot.
- [ ] **NAV-10** At 360–430px, show all four normal Train labels without an icon covering the last label.
- [ ] **NAV-11** At very narrow widths or large text, use an intentional accessible overflow strategy; selected tabs remain visible and all siblings reachable.
- [ ] **NAV-12** Keep the brand header compact. Let it scroll away where useful; do not trap a large stacked header over the content.
- [ ] **NAV-13** Give active tabs a consistent label/underline treatment, not a different gold/orange/blue pattern on each page.

### 5.2 Labels and route ownership

Preserve existing internal route identifiers. These visible names clarify the task; they do not create new duplicate routes.

| Global destination | Local visible labels | Existing owner mapping |
|---|---|---|
| Home | None | Existing Home |
| Body Lab | Movements / Muscles / Exercises | Existing Movement / Body Lab anatomy / Catalog |
| Train | Plan / Review / Workout / Matches | Existing Plan / Review / Session / Matches |
| Progress | Progress / Strength | Existing Progress / Strength Genome |
| Profile utility | No page-tab row | Existing consolidated profile/settings owner |

Use a short explanatory subtitle on first entry or under the page title where needed: “Matches — find exercises for your sport” or “Review — check your planned workload.” Do not add permanent verbose instructions beneath every tab.

- [ ] **NAV-14** Apply the visible labels consistently while preserving route compatibility.
- [ ] **NAV-15** Map the former Session entry to Workout everywhere; do not leave both as separate destinations.
- [ ] **NAV-16** Map anatomy to Muscles and Catalog to Exercises under Body Lab; preserve canonical actions and data ownership.
- [ ] **NAV-17** Remove any obsolete additional Genome tab inside Body Lab if it duplicates the existing Exercise overlay or Strength destination; first inspect its actual functionality and relocate/retain distinct functions rather than deleting them blindly.
- [ ] **NAV-18** Keep global bottom labels Home, Body Lab, Train and Progress consistent across all pages.
- [ ] **NAV-19** Use target, pulse, layers and chart icons consistently for those four destinations.
- [ ] **NAV-20** Profile highlights its own header control while the four bottom destinations remain neutral.
- [ ] **NAV-21** Preserve existing useful deep links with redirects/state mapping to the intended owner.

### 5.3 Location and return behavior

- [ ] **LOC-01** Entering a different global destination through the bottom bar starts at that destination's meaningful top, while retaining selections and data.
- [ ] **LOC-02** Selecting a sibling local tab starts that screen at its heading or intentional working anchor, not a reused scroll offset from another tab.
- [ ] **LOC-03** Returning from exercise details restores the originating list's query, filters, selection and scroll position.
- [ ] **LOC-04** Returning from a region sheet or lift form restores the same Strength context.
- [ ] **LOC-05** Resume workout intentionally opens the active exercise/current set, not a random retained page offset.
- [ ] **LOC-06** Tapping the already-active bottom destination returns its content to the top without discarding an active workout, draft or filter state.
- [ ] **LOC-07** Device/browser back closes the topmost overlay first, then follows actual history. It must not cycle between duplicate entries.
- [ ] **LOC-08** Back from Profile returns to the invoking location and working context.
- [ ] **LOC-09** Scrolling is tracked by actual screen identity; one global scroll value must not leak between unrelated pages.
- [ ] **LOC-10** Direct links and reloads produce a coherent heading and selected navigation state.

---

## 6. Rebuild Home as a genuine starting point

Home must answer four questions in order: **What should I do now? How is my week going? What can this app help me do? What useful insight is relevant to me?**

Keep the technical character, but make Home an understandable entry to the product instead of a stack of internal modules.

### 6.1 Required information order

1. **Home identity and compact personal context.** Optional greeting uses the real name if available; do not hardcode Gabe.
2. **One primary next action.** Active workout takes priority; otherwise next planned workout; otherwise create/build a plan.
3. **Your week.** Truthful planned/completed summary and a clear View plan link.
4. **Explore Sports Genome.** Three concise, labeled task entry points with one-line descriptions.
5. **One relevant technical insight.** Strength progress or selected movement insight; further details are optional expansion/navigation.

Do not put a generic first-lift prompt above an active workout. Do not make a full list of recommendations the main explanation of the product.

### 6.2 Primary action state table

| Actual state | Heading/content | Primary action | Secondary action |
|---|---|---|---|
| Active resumable workout | Continue your workout; actual day and current progress | Resume Pull workout, or actual day label | View workout details |
| No active workout; next day available | Your next workout; actual day/week/count | Review workout | Edit plan |
| Plan exists but no valid day chosen | Choose your next workout | Open training plan | Explore exercises |
| No plan | Build training around your goals | Create your plan | Explore exercises |
| Scheduled rest day | Rest day, based on actual schedule only | View your week | Explore a movement |

Do not infer “rest day” merely from missing data. Do not label a stale abandoned session active without inspecting the app's existing session lifecycle.

- [ ] **HOME-01** Implement this state-dependent primary module using real state, not fixed mockup text.
- [ ] **HOME-02** Show only one dominant orange primary action in the first viewport.
- [ ] **HOME-03** Place the primary action high enough that normal mobile users can find it without scrolling through metrics or science content.
- [ ] **HOME-04** Show active workout name, week/day and current set/exercise context accurately.
- [ ] **HOME-05** Review workout opens prestart/review context without starting or marking a workout complete.
- [ ] **HOME-06** Edit plan opens the same intended day, not an unrelated previously selected day.
- [ ] **HOME-07** Make the first-lift prompt conditional on the actual appropriate record state after hydration completes.
- [ ] **HOME-08** Remove contradictory “Nothing recorded yet” messaging where valid records exist.
- [ ] **HOME-09** Avoid duplicate Resume controls in the visible Home hero and a persistent strip at the same time.

### 6.3 Your week

Show a compact, understandable summary such as “2 of 5 planned workouts completed this week” only if both values share the intended scope. Where the model does not support that comparison, use separately labeled truthful metrics.

- [ ] **HOME-10** Separate planned sessions from completed sessions and recorded lifts.
- [ ] **HOME-11** State the time scope of weekly metrics.
- [ ] **HOME-12** Make View plan visibly labeled and route it to the relevant week.
- [ ] **HOME-13** Keep the summary compact; avoid a separate bordered card for each digit.
- [ ] **HOME-14** Show a neutral zero state without portraying ordinary lack of activity as a failure alert.

### 6.4 Explain the app through useful entry points

| Visible task | One-line description | Destination |
|---|---|---|
| Find exercises | Search by exercise, muscle or equipment | Body Lab → Exercises |
| Explore muscles & movements | See how sport actions involve your muscles | Body Lab → Movements |
| View strength progress | Inspect your recorded lifts and muscle ranks | Progress → Strength |

These can be elegant open rows or a restrained grouped area. Do not turn them into three giant nested cards. Technical miniature visuals may support each entry but cannot replace the label.

- [ ] **HOME-15** Add all three task entries with actual working destinations.
- [ ] **HOME-16** Preserve a valid current context where appropriate without forcing an unexplained stale filter into a general discovery action.
- [ ] **HOME-17** Make general Find exercises enter a comprehensible catalog state; clearly show any retained filters and provide clear removal.
- [ ] **HOME-18** Retain advanced analysis behind these entries; do not remove utility to simplify Home.
- [ ] **HOME-19** Keep at most one prominently expanded technical insight below the main task sections; additional recommendations can open from a clear link.
- [ ] **HOME-20** Ensure a first-time user can identify the workout, exercise-discovery and strength-progress paths without being told what the branded module names mean.

---

## 7. Resolve the Home versus Strength data contradiction

The recording shows 0 Home lifts and a first-lift empty state while Strength shows 15 lift records and 12/18 covered regions. The root cause is not established. Investigate it rather than patching the displayed number.

- [ ] **DATA-01** Trace the source and selector for Home's lift count.
- [ ] **DATA-02** Trace Strength's lift count and region coverage calculation.
- [ ] **DATA-03** Trace Progress's recorded-workout and recorded-lift totals.
- [ ] **DATA-04** Compare active user identity, local storage, synchronized records, filters and fixture/demo state across those paths.
- [ ] **DATA-05** Check whether Home renders an empty state before asynchronous data hydration finishes.
- [ ] **DATA-06** Check whether a singular/plural record-type mismatch, stale cache, schema-version migration or legacy store is involved.
- [ ] **DATA-07** Distinguish genuinely different record categories and time scopes. Do not force unrelated metrics equal.
- [ ] **DATA-08** If the intended metric is the same, make screens use the same canonical definition/selector rather than independently maintained calculations.
- [ ] **DATA-09** If legitimate scopes differ, label them explicitly and use the proper empty-state condition for each.
- [ ] **DATA-10** Preserve all actual records while repairing selectors/migrations; never delete history to make the UI consistent.
- [ ] **DATA-11** Validate zero, one and multiple records; loading; offline local-only; and any supported synchronized state.
- [ ] **DATA-12** Verify that logging a new lift updates applicable Home, Progress and Strength summaries after successful persistence.
- [ ] **DATA-13** Verify that recording a workout set does not automatically become a separately logged benchmark lift unless that is the existing product contract.
- [ ] **DATA-14** Verify counts remain correct after reload and navigating away/back.
- [ ] **DATA-15** Add a focused regression test for the confirmed cause where the existing test setup supports it.

Record the actual cause and resolution. “Changed Home from 0 to 15” is not a valid fix. Screenshots use live fixture values, not hardcoded example totals.

---

## 8. Every control must explain intent, destination and result

For each interactive element, answer: **What will happen? Which object will it affect? What changed? How can the user continue or recover?**

### 8.1 Action inventory

Create a compact inventory of clickable/tappable controls across all screens. Include label, owner, action, destination/mutation, pending state, success state and failure/return behavior. Fix dead controls; do not leave them as attractive placeholders.

- [ ] **ACT-01** Inventory visible actions and the controls inside expanders/overlays.
- [ ] **ACT-02** Replace ambiguous text where context does not make the action obvious.
- [ ] **ACT-03** Distinguish navigation links from mutations and disclosure controls.
- [ ] **ACT-04** Ensure chevrons do not misleadingly imply navigation when they only reorder or expand.
- [ ] **ACT-05** Give icon-only controls clear accessible names and visible explanatory context; use labels for unfamiliar or high-consequence actions.
- [ ] **ACT-06** Avoid nested interactive elements and accidental row activation when pressing favorite/add/reorder controls.
- [ ] **ACT-07** Provide visible pending state for asynchronous mutations and prevent accidental duplicate submissions.
- [ ] **ACT-08** Show success only when the application's actual persistence contract allows it; distinguish queued local changes from confirmed remote sync.
- [ ] **ACT-09** Preserve input on failure and provide a specific retry/recovery path.
- [ ] **ACT-10** Use inline status or a concise announcement for routine feedback. Do not open a modal confirmation for every ordinary tap.

### 8.2 Required label and behavior examples

Use these meanings; adapt dynamic day/exercise names to actual state.

| Current ambiguous pattern | Required clearer treatment |
|---|---|
| Isolated plus in Catalog | Add to workout; visible destination nearby; exercise-specific accessible name |
| “Change” with several possible targets | Change movement, Change workout, or Edit preferences according to the target |
| Bare prescription chevron | Edit sets & reps, or an equivalent clearly labeled edit entry |
| Generic “Open” | Open training plan, View exercise details, or View strength progress |
| “Back to workout” outside a clearly identified session | Resume Pull workout, with real session context |
| Reorder arrows | Move exercise up/down; separate from expand/edit control |
| “Why this match?” | Expand the actual explanation for that specific recommendation |
| “Log set” | Log set 2, with the actual ordinal and pending/success behavior |
| “Finish workout early” | Clearly indicate partial completion and preserve already recorded sets |

### 8.3 Adding exercises

- [ ] **ADD-01** Show the chosen destination before the user adds: for example, “Adding to Week 2 · Upper.”
- [ ] **ADD-02** Make Change workout open a chooser that clearly distinguishes week and day.
- [ ] **ADD-03** If no valid destination exists, let the user choose/create one before any successful-add claim.
- [ ] **ADD-04** Add the exact exercise ID to the exact destination ID, not a day matched only by its label.
- [ ] **ADD-05** After success, display “Added to Week 2 · Upper” or the actual equivalent, with View workout.
- [ ] **ADD-06** Provide Undo if it can safely reverse that exact addition under the existing mutation model.
- [ ] **ADD-07** Do not permanently turn every repeated exercise into a disabled state unless duplicates are actually prohibited by product behavior.
- [ ] **ADD-08** Prevent accidental duplicate additions from rapid taps while pending.
- [ ] **ADD-09** Ensure add feedback is visible above bottom navigation/resume chrome and announced appropriately to assistive technology.
- [ ] **ADD-10** Keep favorite toggling independent from adding and opening details.

### 8.4 Feedback must not become another source of clutter

- [ ] **FDB-01** Use concise feedback near the affected control or in one consistent status region.
- [ ] **FDB-02** Do not stack multiple persistent success banners after repeated ordinary operations.
- [ ] **FDB-03** Keep essential results visible long enough to perceive; avoid a tiny flash that disappears before it can be read.
- [ ] **FDB-04** Preserve keyboard focus and scroll where a local edit does not justify navigation.
- [ ] **FDB-05** Make validation explain the actual field problem, not “Something went wrong” for every case.

---

## 9. Separate active workout from plan editing

The recording shows an active Pull workout while Plan displays Upper. This is not necessarily incorrect state. The failure is that the distinction is not sufficiently explicit.

Required model:

- **Selected plan day:** the day the athlete is viewing/editing.
- **Active session:** the actual workout currently underway, with its own identity and progress.
- **Historical session:** a recorded completed or partially completed workout, independent of later plan edits.

These must not be aliases of a single shared “current day” variable unless the existing model intentionally prevents independent editing and makes that restriction explicit.

- [ ] **CTX-01** Identify these three state owners and verify their independence where required.
- [ ] **CTX-02** In Plan, show “Editing Upper” or equivalent explicit selected-day context when another workout is active.
- [ ] **CTX-03** In the resume strip, show “Pull workout in progress” and current progress, not only “Workout under way.”
- [ ] **CTX-04** Changing the selected plan day must not retarget the active session.
- [ ] **CTX-05** Pressing Resume must always open the actual active session, not the currently edited day.
- [ ] **CTX-06** Adding an exercise from Catalog must use the explicit add destination, not silently assume the active workout or last edited day.
- [ ] **CTX-07** Editing a plan after completion must not mutate a historical workout record.
- [ ] **CTX-08** Changing the plan used by an active session must follow the existing snapshot/live-update contract and explain any effect; do not invent silent synchronization.
- [ ] **CTX-09** If starting a different workout while one is active is supported, provide an explicit existing resolution flow. Never discard the current workout silently.
- [ ] **CTX-10** Keep partial work intact through navigation, reload and ordinary profile/preferences visits according to the app's persistence contract.

### Resume strip policy

Use one compact route-aware component, not independent copies on every page.

| Location | Resume treatment |
|---|---|
| Home while primary resume module is visible | Hide redundant persistent strip |
| Home after scrolling past primary resume module | May show one compact strip if helpful |
| Active Workout screen | No strip duplicating the screen's own active session |
| Other screens with an active session | Compact labeled resume strip, with reserved layout space |
| Modal keyboard-heavy form | Collapse/reposition as needed so fields and submit actions remain usable |
| No active session | No strip |

- [ ] **RES-01** Implement the policy centrally.
- [ ] **RES-02** Reserve real content padding for the combined bottom nav, safe area and visible resume strip.
- [ ] **RES-03** Ensure the strip never covers the final exercise row, add confirmation or form submit control.
- [ ] **RES-04** Keep one primary interactive Resume target; avoid several visually competing resume buttons in the same viewport.
- [ ] **RES-05** Verify the strip disappears or updates after completion/cancellation and does not retain stale set counts.

---

## 10. Repair the blank Workout area and unfinished layout states

Around 18 seconds, the screen shows a large blank region above rest controls. This may be a scroll/hydration/layout interaction. Do not diagnose it by guesswork or hide the entire section to eliminate the symptom.

- [ ] **BLANK-01** Reproduce direct Workout entry, Resume entry, local-tab switching, reload and navigation while a session is active.
- [ ] **BLANK-02** Inspect actual scroll position and whether the exercise content is offscreen, unmounted, invisible, or awaiting data.
- [ ] **BLANK-03** Inspect fixed/min-height rules, flex spacers, viewport-height units, hidden overflow and sticky offsets.
- [ ] **BLANK-04** Inspect loading and empty-state branches, including whether content arrives after navigation.
- [ ] **BLANK-05** Fix the actual cause without setting arbitrary negative margins or a viewport-specific height patch.
- [ ] **BLANK-06** While loading, show a purposeful skeleton or loading state in the relevant content area; do not show an unexplained giant empty panel.
- [ ] **BLANK-07** When no valid exercise exists, show a clear recovery state and an appropriate route to the plan.
- [ ] **BLANK-08** On active-session Resume, place the current exercise/set and logging action within the meaningful viewport.
- [ ] **BLANK-09** Verify rest timer, full-session disclosure and finish action remain accessible after the layout fix.
- [ ] **BLANK-10** Add a regression check for the confirmed failure mechanism rather than a test of one hardcoded pixel height.

---

## 11. Finish every screen without creating duplicates

Use these sections to audit the remaining app. Preserve the existing scientific and training functionality. The new visible tab labels map to existing owners; do not build parallel legacy/new pages.

### 11.1 Movement explorer

- [ ] **MOV-01** Show current sport and selected movement with an understandable title and short explanation of this page's purpose.
- [ ] **MOV-02** Make action browsing controls visible, labeled and valid at list boundaries.
- [ ] **MOV-03** Changing sport selects a valid action or requests a choice rather than retaining an incompatible action silently.
- [ ] **MOV-04** Keep the action illustration meaningful; do not portray an unverified generated pose as a coaching demonstration.
- [ ] **MOV-05** Use “Explore involved muscles” or equivalent clear wording for the anatomy transition.
- [ ] **MOV-06** Preserve the selected action through that transition.
- [ ] **MOV-07** Keep detailed demands/rationale available without burying the primary transition beneath them.

### 11.2 Muscle map

- [ ] **MUS-01** Show the selected action context above the anatomy so the color mapping has a clear subject.
- [ ] **MUS-02** Distinguish movement-role coloring from strength-rank coloring in label, legend and data source.
- [ ] **MUS-03** Ensure front/back controls match what is actually displayed; no Front-selected control above simultaneous front/back views.
- [ ] **MUS-04** Keep map selection and muscle-list selection synchronized through canonical IDs.
- [ ] **MUS-05** Provide a visible selected-muscle state and a dynamic “Find exercises for [muscle]” action.
- [ ] **MUS-06** Explain what tapping a muscle does with concise nearby guidance if needed.
- [ ] **MUS-07** Count involved muscles from actual mapping, not from the previous mockup's example eight or the recording's eleven as a fixed number.
- [ ] **MUS-08** Preserve a text-list alternative and usable targets where map regions are too small for direct touch.

### 11.3 Exercise catalog

- [ ] **CAT-01** Give the page one clear title and a search scope that is easy to understand.
- [ ] **CAT-02** Remove repeated Catalog/Find an exercise headers when they add no orientation.
- [ ] **CAT-03** Clearly separate exercise search from global app search; avoid an unexplained competing “Search everything” route.
- [ ] **CAT-04** Display result count and total catalog count with unambiguous scope.
- [ ] **CAT-05** Make active filters visible, removable and retained when returning from details.
- [ ] **CAT-06** Retain sorting and favorites functionality in the same owner.
- [ ] **CAT-07** Use readable open rows with title, concise metadata, separate detail/favorite/add controls and destination-aware feedback.
- [ ] **CAT-08** Avoid per-row bordered boxes returning through legacy CSS.
- [ ] **CAT-09** Verify long exercise names do not cover grade, heart or add controls.
- [ ] **CAT-10** Explain contextual grade meaning on demand; do not confuse it with the user's strength rank.
- [ ] **CAT-11** Preserve an intelligible no-results state with Clear filters and query retention.

### 11.4 Exercise Intelligence overlay

- [ ] **EX-01** Open one overlay for the selected exercise, not separate duplicate Overview/Analysis routes.
- [ ] **EX-02** Keep the name and Close control clear, with appropriate back behavior.
- [ ] **EX-03** Preserve the originating screen's search/filter/scroll/focus on close.
- [ ] **EX-04** Keep all actual Fingerprint, Muscle Genome and Mechanics functions reachable and working.
- [ ] **EX-05** Use canonical chart dimensions, real values and a readable data alternative; ignore generated chart label mistakes.
- [ ] **EX-06** Label primary/supporting muscle involvement accurately from the actual model.
- [ ] **EX-07** Explain supporting sport links without claiming proven direct skill transfer.
- [ ] **EX-08** Keep source/evidence links real and relevant to the selected exercise/context.
- [ ] **EX-09** Use the same destination-aware add/favorite operations as Catalog.
- [ ] **EX-10** Keep sticky actions and close controls usable with mobile safe areas and long content.

### 11.5 Plan

- [ ] **PLAN-01** Clearly identify the selected week and day, with a separate editing label where an unrelated workout is active.
- [ ] **PLAN-02** Keep week/day controls compact and understandable; show selected state without depending only on color.
- [ ] **PLAN-03** Move the generic “Name it in your profile” prompt out of the space between the selected-day heading and its exercises.
- [ ] **PLAN-04** Retain preference access through a purposeful secondary link or relevant expanded section.
- [ ] **PLAN-05** Give editing a clear label and keep sets/reps/RPE/rest readable.
- [ ] **PLAN-06** Separate expand/edit controls from reorder controls.
- [ ] **PLAN-07** Ensure reorder operation and accessible alternative work without accidental editing/navigation.
- [ ] **PLAN-08** Verify Saving/Saved/Failed accurately tracks persistence.
- [ ] **PLAN-09** Keep Add exercises, Import plan and Print working and easy to find.
- [ ] **PLAN-10** Retain Smart Draft controls in a named expander with a clear explanation that applying a replacement changes the selected day.
- [ ] **PLAN-11** Preserve existing confirmation/preview/undo behavior for replacement rather than silently applying on opening.
- [ ] **PLAN-12** Coverage and Full analysis use the actual selected week/day and do not imply readiness.

### 11.6 Review

- [ ] **REV-01** Explain that this page reviews the selected planned workload; do not blur it with completed workout progress.
- [ ] **REV-02** Keep preparation and weekly analysis in one page with clear section headings.
- [ ] **REV-03** Show the relevant selected day/week before drills or totals.
- [ ] **REV-04** Use actual preparation drills and accessible instructions rather than an unreadable compressed list of names.
- [ ] **REV-05** Render direct/supporting volume with real segment lengths and clear units.
- [ ] **REV-06** Explain estimates through a concise disclosure, not a large warning wall.
- [ ] **REV-07** Derive recovery spacing from actual scheduling information; do not invent weekdays or recovery hours.
- [ ] **REV-08** Label the action Review workout/Resume workout appropriately for its real destination and state.

### 11.7 Workout: prestart and active

- [ ] **WORK-01** Prestart shows day, context, prescription and one clear Start workout action.
- [ ] **WORK-02** Active view shows current exercise, set number, relevant load/reps and one clear logging action.
- [ ] **WORK-03** Logging a set visibly changes the recorded count/progress and follows existing progression behavior.
- [ ] **WORK-04** Rest controls clearly distinguish changing rest duration from skipping the current rest.
- [ ] **WORK-05** Skip exercise clearly names its effect and does not masquerade as logging completion.
- [ ] **WORK-06** Finish/cancel/partial-completion behavior preserves data and states the actual outcome.
- [ ] **WORK-07** Navigation away and Resume restore the correct exercise/set and timer semantics.
- [ ] **WORK-08** Prevent double logging or double completion from rapid taps and slow responses.
- [ ] **WORK-09** Avoid showing the global Resume strip inside the active workout itself.

### 11.8 Matches

- [ ] **MATCH-01** Explain the page in plain language: exercises selected for the chosen sport/movement demands.
- [ ] **MATCH-02** Show selected movement and make Change movement explicit.
- [ ] **MATCH-03** Keep ranking qualities clearly distinct from muscle roles and strength ranks.
- [ ] **MATCH-04** Label numeric score meaning and contextual grade meaning sufficiently for a newcomer.
- [ ] **MATCH-05** Why this match expands an exercise-specific explanation, not identical generic copy for every row unless that is truly all the source supports.
- [ ] **MATCH-06** Make individual adding use the shared destination/feedback contract.
- [ ] **MATCH-07** Retain research context and actual sources without overwhelming the first view.
- [ ] **MATCH-08** Handle no matches, missing scores and equipment/context changes honestly.

### 11.9 Progress

- [ ] **PROG-01** Label recorded workouts and logged lifts with consistent scope.
- [ ] **PROG-02** Show historical sessions as historical records, independent of later plan edits.
- [ ] **PROG-03** Keep session titles, dates and metadata readable without a boxed card for each.
- [ ] **PROG-04** Open actual historical detail from each record.
- [ ] **PROG-05** Do not fabricate a multi-point trend from one or two records.
- [ ] **PROG-06** Provide a truthful baseline/insufficient-data state where needed.
- [ ] **PROG-07** Explain comparison cohort/method only when supported; do not relabel a generic comparison “other wrestlers.”
- [ ] **PROG-08** Make View strength progress navigate to Strength without resetting unrelated history or inventing a duplicate page.

### 11.10 Strength Genome

- [ ] **STR-01** Clearly distinguish coverage count, lift count and rank.
- [ ] **STR-02** Use one canonical percentile/rank configuration and approved badge artwork.
- [ ] **STR-03** Keep National crimson, not the orange used in a generated reference; preserve all approved rank semantics.
- [ ] **STR-04** Keep unscored separate from Prospect and World Stage.
- [ ] **STR-05** Ensure map colors, region rows and details agree after loading and after a new record.
- [ ] **STR-06** Investigate any transition where an initial map appears to show a different coloring mode before rank colors; show an honest loading state instead of stale unrelated colors.
- [ ] **STR-07** Make “Tap a muscle to view its strength record” or equivalent guidance clear.
- [ ] **STR-08** Region details belong to this screen and restore context on close.
- [ ] **STR-09** Log a lift has a clearly labeled form, correct units/load semantics, pending/error states and successful persistence.
- [ ] **STR-10** Recent lifts and How ranks work remain reachable and readable.

### 11.11 Profile and settings

- [ ] **PROFILE-01** Show a clear About me/Profile identity with a labeled edit action.
- [ ] **PROFILE-02** Group preferences and settings without inventing separate duplicate Equipment/Settings pages.
- [ ] **PROFILE-03** Preserve sport and non-sport training modes, goals, days and session-time controls.
- [ ] **PROFILE-04** Equipment summaries match actual choices and changes persist.
- [ ] **PROFILE-05** Training priorities retain existing region/capacity and applicable issue/context controls.
- [ ] **PROFILE-06** Account/sync status reflects reality and keeps sharing preferences accessible.
- [ ] **PROFILE-07** Appearance and security controls call existing supported behavior.
- [ ] **PROFILE-08** Guides, research, onboarding restart and launch-video preview/settings remain available.
- [ ] **PROFILE-09** Autosave claims are shown only if reliable autosave exists; failures retain input and display truthful state.
- [ ] **PROFILE-10** Returning from Profile preserves the prior task context.

---

## 12. Visual completion: refined technical depth without box overload

Keep the visual identity that Gabe likes. The current work is about orientation, hierarchy and functional completeness, not making the app generic.

- [ ] **VIS-01** Use a consistent navy background/surface system instead of unrelated gradients and legacy panels on each route.
- [ ] **VIS-02** Use shared page-title, section-title, body, metadata and metric styles.
- [ ] **VIS-03** Keep long copy in sentence case and readable body typography; reserve condensed/all-caps styling for short headings.
- [ ] **VIS-04** Use open list rows and restrained hairlines; ordinary rows should not each require a rounded or square card border.
- [ ] **VIS-05** Remove leftover nested panel wrappers that serve no interaction or grouping purpose.
- [ ] **VIS-06** Retain useful technical anatomy, charts and exercise imagery; do not substitute empty decorative placeholders.
- [ ] **VIS-07** Prioritize accurate existing media over an attractive but incorrect exercise pose.
- [ ] **VIS-08** Keep illustrations subordinate to the primary task; they must not push basic controls far below the first viewport.
- [ ] **VIS-09** Align content gutters, row heights and control baselines across screens.
- [ ] **VIS-10** Use one action-color system and reserve dominance for the page's main action.
- [ ] **VIS-11** Keep strength rank colors semantically separate from action/selection colors.
- [ ] **VIS-12** Remove obsolete selectors/classes rather than piling contradictory overrides on top of them.
- [ ] **VIS-13** Confirm original logo and badges are real assets, not traced/cropped copies of generated screen images.
- [ ] **VIS-14** Do not use the entire reference PNG as a page background or fake functional UI.

Starting mobile guidance: 16–20px gutters, 24–32px between major sections, readable 15–17px body/row titles, approximately 13–14px secondary text, 44px minimum touch targets, and content-sized controls. Adapt to the existing system and actual device rendering rather than mechanically copying dimensions.

The status bar/browser chrome in a recording is not application header content. Do not recreate it as part of the page.

---

## 13. Responsive, accessibility and safe-area checks

Test actual interactions, not just a desktop screenshot reduced in size.

- [ ] **A11Y-01** Check core screens at 360px, 390px and 430px CSS widths.
- [ ] **A11Y-02** Check a 320px or similarly constrained width for overflow resilience.
- [ ] **A11Y-03** Check a larger text setting and approximately 200% text zoom/reflow where supported.
- [ ] **A11Y-04** Confirm no horizontal page overflow; intentional tab/list overflow must be explicit and usable.
- [ ] **A11Y-05** Confirm navigation labels never hide behind fixed utilities.
- [ ] **A11Y-06** Keep each primary touch target at least 44px, including small-looking favorite/add controls.
- [ ] **A11Y-07** Verify actual text/background contrast; white on bright orange is not automatically accessible.
- [ ] **A11Y-08** Provide visible keyboard focus and logical order.
- [ ] **A11Y-09** Use semantic buttons, links, tabs, fields and disclosures with appropriate state attributes.
- [ ] **A11Y-10** Ensure screen-reader names distinguish View details, Favorite and Add for each exercise.
- [ ] **A11Y-11** Give charts/anatomy a readable text alternative and selection that does not depend only on color.
- [ ] **A11Y-12** Manage modal focus, background interaction and focus restoration correctly.
- [ ] **A11Y-13** Test a logging form while the on-screen keyboard is open; selected fields and submit controls remain reachable.
- [ ] **A11Y-14** Reserve bottom space for navigation, safe-area inset and any visible resume strip.
- [ ] **A11Y-15** Confirm the final list row and last setting are fully visible/reachable above fixed chrome.
- [ ] **A11Y-16** Respect reduced motion and avoid continuous decorative animation behind working controls.
- [ ] **A11Y-17** Check desktop/tablet layout remains deliberate and does not simply stretch a narrow mobile list across the whole screen.

---

## 14. Loading, empty, error and offline states

Empty data is not the same as data that has not loaded. Unknown state should never briefly masquerade as a confident zero or an incorrect rank map.

- [ ] **STATE-01** Loading Home does not flash “Nothing recorded” before record hydration completes.
- [ ] **STATE-02** Loading Strength does not show movement-role colors or another stale mode as if they were ranks.
- [ ] **STATE-03** Catalog loading retains the current query/filter and gives purposeful feedback.
- [ ] **STATE-04** Add/save/log pending states prevent accidental repeat submissions without freezing unrelated navigation.
- [ ] **STATE-05** Failure messages identify the failed operation and preserve recoverable input.
- [ ] **STATE-06** Local-only/offline state follows the established storage contract and does not claim remote sync.
- [ ] **STATE-07** Zero records, empty plan, empty selected day and no search results each have an appropriate next action.
- [ ] **STATE-08** Missing assets reserve sensible space or use a neutral fallback; they do not break the layout or hide text.
- [ ] **STATE-09** Slow data responses cannot overwrite a newer selection with stale results.
- [ ] **STATE-10** Rapid tab switching does not attach the previous tab's content/state to the new heading.
- [ ] **STATE-11** Refreshing during an active workout follows the real resume/persistence contract.
- [ ] **STATE-12** Missing comparison/evidence data is described honestly without fabricated citations or metrics.

---

## 15. Data and asset boundaries

This is a UX completion task. Do not recalibrate strength norms or alter research eligibility merely to make the screenshots look plausible.

- [ ] **SAFE-01** Preserve authoritative scoring, percentile, muscle-effect and evidence calculations unless a separately authorized concrete defect requires work.
- [ ] **SAFE-02** Treat example numbers in mockups and recordings as state examples, not constants.
- [ ] **SAFE-03** Preserve canonical exercise/muscle/action/region IDs across routes and stores.
- [ ] **SAFE-04** Keep completed records independent from current plan edits.
- [ ] **SAFE-05** Do not delete, reset or overwrite real user data during visual verification.
- [ ] **SAFE-06** Use an appropriate existing fixture/test account or reversible local test data for mutations.
- [ ] **SAFE-07** Keep the approved rank artwork and configuration; no new generated badge system.
- [ ] **SAFE-08** Use native SVG for appropriate icons/charts/interactive geometry; do not claim raster badge art has been vectorized by changing its extension.
- [ ] **SAFE-09** Report specific missing production assets without abandoning unrelated implementation.
- [ ] **SAFE-10** Follow existing authorization for publishing/deployment and accurately distinguish local verification from released changes.

---

## 16. Required end-to-end journeys

Run these against the actual application after implementation. Record steps, expected result, observed result and evidence. Use current valid data; names below describe the scenario rather than a required hardcoded fixture.

### Journey A — a new visitor understands Home

- [ ] **J-A1** Open Home from a fresh page load with no active workout.
- [ ] **J-A2** Confirm Home is explicitly identified and the next action is readable in the first normal viewport.
- [ ] **J-A3** Find the entry for browsing exercises without using hidden navigation or unexplained icons.
- [ ] **J-A4** Return Home and find the entry for exploring movements/muscles.
- [ ] **J-A5** Return Home and find the entry for strength progress.
- [ ] **J-A6** Verify each destination presents an appropriate title and useful starting position.

### Journey B — resume while editing a different day

- [ ] **J-B1** Begin or load an active Pull workout in test data.
- [ ] **J-B2** Open Plan and select Upper for editing.
- [ ] **J-B3** Confirm editing context and active-workout context are separately labeled.
- [ ] **J-B4** Change a valid Upper prescription and persist it.
- [ ] **J-B5** Resume the workout and confirm it is still Pull, at the correct exercise/set.
- [ ] **J-B6** Confirm no duplicate Resume strip appears within the active Workout page.
- [ ] **J-B7** Return Home and confirm the active-workout primary module is truthful and not duplicated by another visible resume control.

### Journey C — add an exercise with a known destination

- [ ] **J-C1** Enter Exercises from a selected plan day.
- [ ] **J-C2** Confirm the intended destination is visible before adding.
- [ ] **J-C3** Open details, change analysis tabs and close; confirm query/filter/scroll are retained.
- [ ] **J-C4** Add one exercise and verify destination-specific success feedback.
- [ ] **J-C5** Use View workout and verify exactly the intended addition.
- [ ] **J-C6** Repeat with a changed destination and verify no stale-day addition.
- [ ] **J-C7** Rapidly tap during a pending add and verify no accidental duplicate mutation.
- [ ] **J-C8** Favorite an exercise and confirm it neither adds nor opens details accidentally.

### Journey D — record consistency

- [ ] **J-D1** Load a fixture with valid existing lifts.
- [ ] **J-D2** Compare Home, Progress and Strength counts according to their declared scopes.
- [ ] **J-D3** Confirm no invalid first-lift empty state is displayed.
- [ ] **J-D4** Save one valid lift and verify the appropriate summaries/history refresh.
- [ ] **J-D5** Reload and verify the record persists and summaries remain truthful.
- [ ] **J-D6** Test zero-record and delayed-hydration cases without flashing false data.

### Journey E — movement to muscle to exercise

- [ ] **J-E1** Choose a sport and movement.
- [ ] **J-E2** Explore involved muscles and verify identical action context.
- [ ] **J-E3** Select a muscle and find exercises for it.
- [ ] **J-E4** Confirm the muscle filter is visible and can be removed.
- [ ] **J-E5** Return through the flow without losing the user's intended selection or landing on an unexplained partial scroll position.

### Journey F — active workout layout and persistence

- [ ] **J-F1** Open Workout directly, through its tab, through Home Resume and through the persistent strip.
- [ ] **J-F2** Verify current exercise/set is visible and there is no unexplained giant blank panel.
- [ ] **J-F3** Log a set; verify visible feedback and real recorded progress.
- [ ] **J-F4** Navigate away and resume; verify actual rest/timer and set semantics.
- [ ] **J-F5** Exercise supported completion/partial-completion behavior and verify one intended historical record.

### Journey G — settings and recovery

- [ ] **J-G1** Open Profile from a non-Home screen and verify correct navigation emphasis.
- [ ] **J-G2** Change a reversible preference and verify persistence and clear feedback.
- [ ] **J-G3** Find equipment, sharing, appearance, security and guide/research functions.
- [ ] **J-G4** Return to the prior task with its context preserved.
- [ ] **J-G5** Exercise a representative failed save/add and verify preserved input, clear error and retry.

### Journey H — constrained mobile use

- [ ] **J-H1** At 360px, verify all Train tabs and utilities are separate and reachable.
- [ ] **J-H2** Use a long exercise name and larger text; verify control separation and wrapping.
- [ ] **J-H3** Open a numeric form with the keyboard visible; verify the input and submit action remain usable.
- [ ] **J-H4** Scroll to the last content item while the resume strip is visible; verify it is not covered.
- [ ] **J-H5** Check back/close and focus restoration on an overlay.

---

## 17. First-time-user comprehension check

Automated tests cannot prove that a newcomer understands the app. Perform an explicit heuristic walkthrough, and if an actual willing tester is available, run a short uncoached session. Do not claim a human usability test if you only simulated one.

Give the tester these tasks without explaining the interface first:

1. Find out what you should do next.
2. Find an exercise for a muscle or sport movement.
3. Add it to a specific workout and tell me which workout received it.
4. Resume the workout already underway.
5. Find your recorded strength progress.
6. Change available equipment and return to where you were.

- [ ] **USER-01** Perform a no-prior-explanation walkthrough of these tasks using only visible UI cues.
- [ ] **USER-02** Record places requiring guessed icon meanings, hidden destinations, unexplained terms or trial-and-error tapping.
- [ ] **USER-03** Fix those concrete ambiguities rather than adding a mandatory tutorial to compensate for them.
- [ ] **USER-04** If a human test occurs, report actual observed hesitation/wrong turns; do not invent timings or success rates.
- [ ] **USER-05** If a human test is unavailable, label the result “heuristic walkthrough; human validation pending,” not “usability verified by users.”

A tutorial can supplement the app, but the basic navigation must work without one. The father getting lost is evidence to improve the interface, not a reason to expect users to study a guide before ordinary use.

---

## 18. Visual evidence and verification discipline

Capture representative current runtime screens with a consistent viewport and coherent test state. Reference filenames may be descriptive; do not create multiple contradictory “final” variants.

Required evidence set:

| Evidence | Must demonstrate |
|---|---|
| Home — ordinary state | Clear next action, Your week, three understandable discovery entries |
| Home — active workout | Correct resume priority; no redundant visible resume strip |
| Shared Train header | All tabs visible, utilities separate, clear location |
| Plan with another workout active | Editing and active-session contexts are distinct |
| Catalog and add feedback | Destination before adding; destination-specific result afterward |
| Workout active | Current exercise/set, logging action and no large accidental blank area |
| Progress and Strength | Correctly scoped consistent records, valid map/legend state |
| Profile | Consolidated settings, clear state and return behavior |
| Narrow/large-text example | No clipping/overlap and usable touch controls |
| Short transition recording | Entry, add, back, resume and scroll behavior in motion |

- [ ] **PROOF-01** Capture actual runtime evidence for the required set.
- [ ] **PROOF-02** Compare the corrected views against both this behavior brief and the approved visual character.
- [ ] **PROOF-03** Verify screenshots do not accidentally use different users, fixture stores or stale bundles when comparing record counts.
- [ ] **PROOF-04** Run relevant existing build/type/lint checks and tests using the repository's actual commands.
- [ ] **PROOF-05** Add focused regressions for confirmed navigation/state bugs where needed; avoid tests that simply duplicate CSS constants.
- [ ] **PROOF-06** Record command results and distinguish pre-existing failures from new failures with evidence.
- [ ] **PROOF-07** Do not fake unavailable device coverage. State when a check used browser emulation rather than a physical iPhone.
- [ ] **PROOF-08** Recheck affected journeys after the final shared-component changes, because header/scroll fixes can regress other pages.

---

## 19. Progress and evidence templates

Use these templates or the repository's equivalent. Keep them short enough to maintain reliably.

### Working progress record

```markdown
# UX correction progress

Current phase:
Current branch/worktree (if applicable):
Running app / preview:
Last verified build:

Completed sections:
- Section + evidence reference

In progress:
- Exact task IDs and files

Open blockers:
- Task ID | dependency | user impact | work completed | next action

Known regressions:
- Reproduction and owner

Next concrete action:
- One actionable step
```

### Evidence record

```markdown
Task group / journey:
Build or revision:
Viewport/device:
Data fixture and scope:
Steps performed:
Expected result:
Observed result:
Screenshot/recording/test-output paths:
Remaining limitations:
```

### Completion summary table

| Workstream | Status | Evidence | Remaining issue |
|---|---|---|---|
| Shared header and tabs | NOT STARTED | — | — |
| Location and scroll behavior | NOT STARTED | — | — |
| Home rebuild | NOT STARTED | — | — |
| Record consistency | NOT STARTED | — | — |
| Action labels and feedback | NOT STARTED | — | — |
| Add destination flow | NOT STARTED | — | — |
| Workout/plan context separation | NOT STARTED | — | — |
| Blank Workout investigation/fix | NOT STARTED | — | — |
| All page completion checks | NOT STARTED | — | — |
| Responsive/accessibility/states | NOT STARTED | — | — |
| End-to-end journeys | NOT STARTED | — | — |

Replace statuses with verified outcomes; do not prefill PASS. A blocked item remains visible in the final report and does not make unrelated finished work disappear.

---

## 20. Final stop conditions and delivery

Do not end the implementation merely because the app builds, because Home looks better, or because a large number of files changed. End when the required work is verified, or when a specific genuine blocker prevents the remaining portion and all other work is complete.

- [ ] **DONE-01** Every required checklist item is either verified, explicitly blocked, or demonstrably not applicable with a reason.
- [ ] **DONE-02** No clipped navigation, empty Home tab strip or route-inappropriate utility layout remains.
- [ ] **DONE-03** Home clearly functions as the product's starting point in both active-workout and ordinary states.
- [ ] **DONE-04** The contradictory record displays have a documented actual resolution or a precise unresolved blocker; no hardcoded count patch is used.
- [ ] **DONE-05** Exercise adding tells the user what it affects and visibly confirms the result.
- [ ] **DONE-06** Active workout, plan editing and historical records remain distinct and correct.
- [ ] **DONE-07** The large blank Workout symptom is resolved or accurately documented with reproduction evidence and the remaining cause.
- [ ] **DONE-08** All existing features have a retained reachable owner; no duplicate legacy/new pages remain unintentionally.
- [ ] **DONE-09** Technical depth, original logo and approved rank artwork are preserved.
- [ ] **DONE-10** Final runtime screenshots and transition evidence are available.
- [ ] **DONE-11** Relevant verification commands and journeys have actual recorded outcomes.
- [ ] **DONE-12** Deliver a concise implementation summary, changed source/asset paths, completed checklist/progress record, evidence links and specific remaining blockers.

### Final response requested from Claude

Lead with the implemented user-facing improvements. Then provide:

1. What changed in navigation and Home.
2. Actual cause and fix for the inconsistent record display.
3. What changed in action feedback and workout/plan context.
4. Runtime screenshots/recording and completed verification summary.
5. Any real remaining limitation, its user impact and exact next dependency.

Do not promise that you will implement these items later after returning a plan. Implement the authorized work now, verify it in the app, maintain this checklist, and report honestly what is complete.
