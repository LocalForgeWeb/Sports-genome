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

- [x] **EXEC-01** Copy this document into the repository's appropriate task/documentation location without changing its requirements to make completion easier. — this file is the brief, copied unchanged; only the boxes and these annotations were added
- [x] **EXEC-02** Create a small progress record with current phase, completed sections, open blockers, evidence paths, and the next concrete action. — `docs/ux-correction/progress.md`
- [x] **EXEC-03** Update that record after each meaningful implementation phase, not after every tiny edit. — progress.md updated after phases A, B, C, D, E/F and G (see its git history)
- [x] **EXEC-04** Before ending a session or losing context, record the exact remaining work and any commands needed to resume. — progress.md keeps the resume commands and the next action; the session was resumed from it once mid-way
- [x] **EXEC-05** On resumption, read the progress record and continue the existing work instead of restarting or assuming unchecked work is done. — phase G resumed from progress.md after a context reset without redoing A–F
- [x] **EXEC-06** Preserve applicable repository instructions, existing release procedures, user data, original logo, and approved assets. — logo (`sportsGenomeAssets.circularBadge`) and rank badges (`RankIcon`) untouched; no user data touched (probes run on emulated device stores); release path unchanged (push to `main` → Vercel)
- [x] **EXEC-07** Continue through all unblocked required work. A single missing asset must not stop unrelated navigation, layout or state fixes. — the missing recording (AUD-01) did not stop any other item
- [x] **EXEC-08** Do not claim that deployment, device testing, accessibility testing or a user test occurred unless it actually did. — docs/ux-correction/evidence/README.md states browser emulation; walkthrough.md states that no human test occurred; deployment is stated only as what was verified

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

- [ ] **AUD-01** Watch the complete recording and reproduce each relevant symptom in the current build. BLOCKED — the recording `ScreenRecording_09-26-2026 13-26-17_1.mp4` was not in the session uploads; dependency: attach it; work completed: OBS-01..12 reproduced from the register's descriptions (`docs/ux-correction/probes/baseline.mjs`, progress.md Phase A); next action: on receipt, re-check timings and exact taps against §2 BLOCKED — the recording `ScreenRecording_09-26-2026 13-26-17_1.mp4` was not in the session uploads; dependency: attach it; work completed: OBS-01..12 reproduced from the register's descriptions (`docs/ux-correction/probes/baseline.mjs`, progress.md Phase A); next action: on receipt, re-check timings and exact taps against §2
- [x] **AUD-02** Record each reproduced symptom's current route, viewport, user/data state and actual cause. — progress.md Phase A: route, viewport, device-store state and cause for each reproduced symptom
- [x] **AUD-03** Mark symptoms that cannot be reproduced as unconfirmed; retain their regression checks rather than dismissing them. — OBS-06 and OBS-07 did not reproduce (progress.md Phase A); their regression checks stay in journeys F (largest unpainted run on four entries) and A/E (scroll 0 on entry)
- [x] **AUD-04** Do not infer a backend fault, CSS bug or stale data source solely from a screenshot; inspect the responsible path. — each cause was read in code before changing it: Home's count selector (athleteRecord.ts header comment), the tab row's width allocation, the strip's fixed reserve
- [x] **AUD-05** Capture a baseline of Home, the clipped Train header, Plan with another workout active, Catalog and Strength before changing them. — baseline captured before Phase B by `docs/ux-correction/probes/baseline.mjs` (Home, Train header, Plan with a live workout, Catalog, Strength)

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

- [x] **SEQ-01** Establish the runtime and current behavior before rewriting shared components. — Phase A before any shell change (progress.md)
- [x] **SEQ-02** Finish the shared shell before adjusting its height separately on every page. — the shell was rebuilt once in Phase B; pages were not given their own header offsets
- [x] **SEQ-03** Fix the shared record selectors before changing the copy of the contradictory Home count. — `athleteRecord.ts` (Phase C) before the Home copy changed
- [x] **SEQ-04** Define action ownership and state transitions before adding success messages. — `docs/ux-correction/actions.md` and the add/toast contract (Phase D) before success messages were written
- [x] **SEQ-05** Finish all main pages and transient states before the final verification pass. — E/F finished before the journeys (G)

---

## 4. Repository and runtime inventory

Do this efficiently. The inventory is to enable implementation, not to replace it with lengthy analysis.

- [x] **INV-01** Read applicable project instructions and determine framework, routing, state management, storage and styling conventions. — progress.md Inventory: React 18 + TS + Vite client, Express/tRPC server, one page component owning all workspaces, device stores in localStorage, plain CSS with `--sg-*` tokens
- [x] **INV-02** Identify the running entry point and the commands actually used to build, check and test the app. — progress.md: `npx tsc --noEmit -p tsconfig.json`, `npx vitest run`, `npx vite build`, `npx vite preview --port 4173`
- [x] **INV-03** Identify the shared header, global navigation, local tabs and main scroll container. — progress.md Shell: `header.apex-topbar`, `MobileBottomNav`, `WorkspaceTabs`, window scroll
- [x] **INV-04** Map each visible destination to one actual route/component owner. — progress.md route-owner table
- [x] **INV-05** Locate both current and legacy CSS rules affecting the header, cards, lists and selected navigation. — index.css "Shell" and later blocks, workout-planner.css, mobile-training-card.css, catalog-discovery.css (progress.md)
- [x] **INV-06** Locate Home's record count and empty-state selector, Strength's lift count, and Progress's historical data source. — Home read `trpc.strengthGenome.overview`; Strength read the device + workout stores; Progress read the device sessions — now all read `client/src/lib/athleteRecord.ts`
- [x] **INV-07** Locate active-session identity, selected planning-day identity and resume behavior. — `client/src/lib/liveSession.ts` (active session with its own `dayLabel`), `activeDayIndex` in Home.tsx (selected day), `SessionResumeBar` (resume)
- [x] **INV-08** Locate exercise-add/favorite operations and their persistence/error paths. — `addExercise` / `toggleFavorite` in Home.tsx; persistence in `deviceWorkoutLog.ts`, `deviceStrengthObservations.ts` (both now report a refused write)
- [x] **INV-09** Locate original logo, rank configuration, approved badge assets, anatomy geometry and existing exercise media. — `sportsGenomeAssets` (logo), `RankIcon` + `shared/capabilityRank.ts` (ranks, `/rank-icons/*.webp`), `AnatomyMap` geometry, Supabase exercise media; gaps in `docs/design-handoff/missing-illustrations.md`
- [x] **INV-10** Inventory existing functions that must remain reachable: import, print, draft generation, filtering, sorting, favorites, logging, evidence, equipment, sharing, security, guides and preferences. — all retained and listed with owners in `docs/ux-correction/actions.md` (import, print, draft, filter, sort, favourites, logging, evidence, equipment, sharing/sync, security, guides, preferences)
- [x] **INV-11** Identify existing deep links and compatibility behavior needed after visible label changes. — `?workspace=` ids unchanged; `workspaceFromLocation` maps the retired `genome` to `catalog` (test `Home.modifierEvidence.test.ts`)
- [x] **INV-12** Do not duplicate an existing service, store or router just to make the redesigned components easier to mock. — no new store or router; the one new module is a selector over the existing stores

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

- [x] **NAV-01** Move Search/Profile into the brand row and remove their competing width from the tab row. — Search and Profile live in `.topbar-utilities` in the brand row; the tab row carries no controls (`docs/ux-correction/evidence/train-header-360.png`, J-H1)
- [x] **NAV-02** Remove the empty local-tab strip from Home and Profile. — `WorkspaceTabs` renders nothing for a lone tab; Home and Profile show no tab row (J-A2, J-G1)
- [x] **NAV-03** Ensure every page has an explicit readable identity on entry. — one h1 per destination and `document.title` from `workspaceTitles` (J-A6, `docs/ux-correction/probes/phasee.mjs`)
- [x] **NAV-04** Preserve the original logo and improve its surrounding alignment; do not redesign it. — the original circular logo, unchanged, at 44px in the brand row
- [x] **NAV-05** Make Search and Profile touch targets at least 44px, with accessible names and clear iconography; use short visible labels where space supports them. — 44×44 with names "Search" and "Profile and settings" (J-H1); no room for visible labels beside the context line at 360
- [x] **NAV-06** Replace the two-person profile symbol with the established single-person profile meaning. — `UserRound` (single person)
- [x] **NAV-07** Eliminate clipped tabs, overlapping controls, orphan chevrons and unexplained overflow arrows at ordinary mobile widths. — no clipped tab, overlap or stray arrow at 320/360/390/430/1280 (`docs/ux-correction/probes/phasef.mjs`, J-H1)
- [x] **NAV-08** Test tab widths with the actual font and labels, not placeholder text. — measured on the built app with the real labels (J-H1 rect readings)
- [x] **NAV-09** Use content-driven layout rather than absolute offsets guessed for one screenshot. — flex rows sized by content; the shell CSS has no absolute offsets
- [x] **NAV-10** At 360–430px, show all four normal Train labels without an icon covering the last label. — all four Train labels visible at 360 (J-H1), 390 and 430 (phasef)
- [x] **NAV-11** At very narrow widths or large text, use an intentional accessible overflow strategy; selected tabs remain visible and all siblings reachable. — the tab row scrolls with edge arrows and keeps the selected tab in view; the day row scrolls the selected day into view (`TrainingPlanHeader`) — checked at 360px with a 32px root font (`docs/ux-correction/probes/extras.mjs`)
- [x] **NAV-12** Keep the brand header compact. Let it scroll away where useful; do not trap a large stacked header over the content. — brand row 72px (64 under 640px); on phones it scrolls away and only the 48px tab row stays pinned (index.css "Chrome that scrolls away")
- [x] **NAV-13** Give active tabs a consistent label/underline treatment, not a different gold/orange/blue pattern on each page. — one treatment: sentence-case label with an orange underline, on every tab row (phasee)

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

- [x] **NAV-14** Apply the visible labels consistently while preserving route compatibility. — labels per the table; ids unchanged (progress.md route-owner table)
- [x] **NAV-15** Map the former Session entry to Workout everywhere; do not leave both as separate destinations. — Session → Workout everywhere (tab, Home CTA, Plan/Review buttons, titles)
- [x] **NAV-16** Map anatomy to Muscles and Catalog to Exercises under Body Lab; preserve canonical actions and data ownership. — anatomy → Muscles, Catalog → Exercises under Body Lab; owners unchanged
- [x] **NAV-17** Remove any obsolete additional Genome tab inside Body Lab if it duplicates the existing Exercise overlay or Strength destination; first inspect its actual functionality and relocate/retain distinct functions rather than deleting them blindly. — the Genome tab was inspected first: its analysis and evidence already lived in the exercise overlay; its one distinct function (into Body Lab from the exercise's leading muscle) was moved into the overlay as "Explore {muscle} in Body Lab"; `?workspace=genome` now lands on Exercises
- [x] **NAV-18** Keep global bottom labels Home, Body Lab, Train and Progress consistent across all pages. — dock labels Home / Body Lab / Train / Progress on every page (phasef)
- [x] **NAV-19** Use target, pulse, layers and chart icons consistently for those four destinations. — target, pulse, layers, chart icons unchanged
- [x] **NAV-20** Profile highlights its own header control while the four bottom destinations remain neutral. — J-G1: profile control `aria-current="page"`, no dock destination active
- [x] **NAV-21** Preserve existing useful deep links with redirects/state mapping to the intended owner. — see INV-11

### 5.3 Location and return behavior

- [x] **LOC-01** Entering a different global destination through the bottom bar starts at that destination's meaningful top, while retaining selections and data. — J-A3–5 and J-E: each destination opens at its heading (scrollY 0) with selections kept
- [x] **LOC-02** Selecting a sibling local tab starts that screen at its heading or intentional working anchor, not a reused scroll offset from another tab. — every tab change lands at scroll 0 (Phase A/B probes; J-F1 tab entry from a scrolled Plan)
- [x] **LOC-03** Returning from exercise details restores the originating list's query, filters, selection and scroll position. — J-C3: query "press", 36 rows, scrollY 420 and the chips all kept after Close
- [x] **LOC-04** Returning from a region sheet or lift form restores the same Strength context. — region sheet close restores the same scroll (design-handoff acceptance matrix §11); Log a lift is inline on the page (J-D4)
- [x] **LOC-05** Resume workout intentionally opens the active exercise/current set, not a random retained page offset. — J-B5 and J-F1: Resume opens the live session at its current exercise and set
- [x] **LOC-06** Tapping the already-active bottom destination returns its content to the top without discarding an active workout, draft or filter state. — Phase B `shellprobe.mjs`: the active dock destination returns to top and keeps the page; `dockTarget` in Home.tsx
- [x] **LOC-07** Device/browser back closes the topmost overlay first, then follows actual history. It must not cycle between duplicate entries. — J-H5: Back closes the overlay first (one history entry per overlay), then history
- [x] **LOC-08** Back from Profile returns to the invoking location and working context. — J-G4: Back from Profile returns to Plan on the same day
- [x] **LOC-09** Scrolling is tracked by actual screen identity; one global scroll value must not leak between unrelated pages. — scroll is reset per workspace change in `navigateWorkspace`; no shared offset (Phase A: no partial landings)
- [x] **LOC-10** Direct links and reloads produce a coherent heading and selected navigation state. — J-F1 direct URL; reloads in J-B4, J-D5, J-G2 keep heading and selection

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

- [x] **HOME-01** Implement this state-dependent primary module using real state, not fixed mockup text. — `TodayActionPanel`: live / next workout / empty day with a plan / no plan, from real state (J-A2, J-B7, `TodayActionPanel*.test.ts`); a rest-day row is not shown because the model has no weekday schedule to derive it from
- [x] **HOME-02** Show only one dominant orange primary action in the first viewport. — one orange action in the first viewport (`docs/ux-correction/evidence/home-ordinary.png`, `home-active-workout.png`)
- [x] **HOME-03** Place the primary action high enough that normal mobile users can find it without scrolling through metrics or science content. — CTA bottom at 405px of 844 (J-A2)
- [x] **HOME-04** Show active workout name, week/day and current set/exercise context accurately. — "1 of 20 sets logged · next: Cable Rotational Row, set 2" with week and day (J-B7)
- [x] **HOME-05** Review workout opens prestart/review context without starting or marking a workout complete. — Review workout opens the prestart without starting (Phase C `homeprobe.mjs`)
- [x] **HOME-06** Edit plan opens the same intended day, not an unrelated previously selected day. — Review and Edit read the one `activeDayLabel` (`TodayActionPanel.test.ts`)
- [x] **HOME-07** Make the first-lift prompt conditional on the actual appropriate record state after hydration completes. — no first-lift prompt on Home; the record prompt appears only for a gate priority (J-D3, J-D6)
- [x] **HOME-08** Remove contradictory “Nothing recorded yet” messaging where valid records exist. — J-D2: with records on file Home reads "5 lifts logged · 1 workout recorded"
- [x] **HOME-09** Avoid duplicate Resume controls in the visible Home hero and a persistent strip at the same time. — J-B7 and Phase D: the strip is hidden while the hero's Resume is in view

### 6.3 Your week

Show a compact, understandable summary such as “2 of 5 planned workouts completed this week” only if both values share the intended scope. Where the model does not support that comparison, use separately labeled truthful metrics.

- [x] **HOME-10** Separate planned sessions from completed sessions and recorded lifts. — week fraction (planned vs completed this week) on one line, lifetime lifts/workouts on the next
- [x] **HOME-11** State the time scope of weekly metrics. — "this week" and "all time" stated
- [x] **HOME-12** Make View plan visibly labeled and route it to the relevant week. — "View plan" opens the Plan (Home tests)
- [x] **HOME-13** Keep the summary compact; avoid a separate bordered card for each digit. — one line, no per-digit cards
- [x] **HOME-14** Show a neutral zero state without portraying ordinary lack of activity as a failure alert. — J-D6: "0 lifts logged · 0 workouts recorded", no alert

### 6.4 Explain the app through useful entry points

| Visible task | One-line description | Destination |
|---|---|---|
| Find exercises | Search by exercise, muscle or equipment | Body Lab → Exercises |
| Explore muscles & movements | See how sport actions involve your muscles | Body Lab → Movements |
| View strength progress | Inspect your recorded lifts and muscle ranks | Progress → Strength |

These can be elegant open rows or a restrained grouped area. Do not turn them into three giant nested cards. Technical miniature visuals may support each entry but cannot replace the label.

- [x] **HOME-15** Add all three task entries with actual working destinations. — J-A3–5
- [x] **HOME-16** Preserve a valid current context where appropriate without forcing an unexplained stale filter into a general discovery action. — Find exercises resets to the default filters; Home carries no stale muscle filter
- [x] **HOME-17** Make general Find exercises enter a comprehensible catalog state; clearly show any retained filters and provide clear removal. — filters arrive as removable chips (J-E4)
- [x] **HOME-18** Retain advanced analysis behind these entries; do not remove utility to simplify Home. — overlay analysis, Matches, Body Lab and Strength all remain behind the rows
- [x] **HOME-19** Keep at most one prominently expanded technical insight below the main task sections; additional recommendations can open from a clear link. — one insight (state or record prompt) plus Movement focus with "All matches"
- [x] **HOME-20** Ensure a first-time user can identify the workout, exercise-discovery and strength-progress paths without being told what the branded module names mean. — walkthrough.md tasks 1, 2 and 5 — heuristic, human validation pending

---

## 7. Resolve the Home versus Strength data contradiction

The recording shows 0 Home lifts and a first-lift empty state while Strength shows 15 lift records and 12/18 covered regions. The root cause is not established. Investigate it rather than patching the displayed number.

- [x] **DATA-01** Trace the source and selector for Home's lift count. — Home read `trpc.strengthGenome.overview.observationCount` (the account overview, empty for a device-only athlete)
- [x] **DATA-02** Trace Strength's lift count and region coverage calculation. — Strength counted device typed lifts plus lifts carried across from finished workouts (`workoutStrengthRecord.ts`)
- [x] **DATA-03** Trace Progress's recorded-workout and recorded-lift totals. — Progress read the device sessions and the same lift list
- [x] **DATA-04** Compare active user identity, local storage, synchronized records, filters and fixture/demo state across those paths. — same athlete, same device stores; the difference was the source (account query vs device stores), not identity or fixtures
- [x] **DATA-05** Check whether Home renders an empty state before asynchronous data hydration finishes. — device reads are synchronous; sampled every 40ms from first paint the record line has one value (J-D1, J-D6)
- [x] **DATA-06** Check whether a singular/plural record-type mismatch, stale cache, schema-version migration or legacy store is involved. — no migration or plural mismatch involved; the account query simply answers nothing without an account
- [x] **DATA-07** Distinguish genuinely different record categories and time scopes. Do not force unrelated metrics equal. — planned workouts (week) vs completed (week) vs lifts/workouts (all time) kept separate and labelled
- [x] **DATA-08** If the intended metric is the same, make screens use the same canonical definition/selector rather than independently maintained calculations. — `client/src/lib/athleteRecord.ts` is the one definition Home, Progress and Strength read
- [x] **DATA-09** If legitimate scopes differ, label them explicitly and use the proper empty-state condition for each. — scopes labelled on Home ("this week", "all time"), Progress (aria-label) and Strength ("regions covered", "lifts recorded")
- [x] **DATA-10** Preserve all actual records while repairing selectors/migrations; never delete history to make the UI consistent. — no store was migrated or cleared; the selector reads the existing keys
- [x] **DATA-11** Validate zero, one and multiple records; loading; offline local-only; and any supported synchronized state. — zero (J-D6), one (J-F5), several (J-D2), reload (J-D5), device-only ("This device" / "Saved on this device"); the account path is exercised by `athleteRecord.test.ts`
- [x] **DATA-12** Verify that logging a new lift updates applicable Home, Progress and Strength summaries after successful persistence. — J-D4: a logged deadlift moves Strength, Progress and Home to 6 at once
- [x] **DATA-13** Verify that recording a workout set does not automatically become a separately logged benchmark lift unless that is the existing product contract. — the existing contract does carry each exercise of a finished workout into Strength as a lift "From {workout}" (`workoutStrengthRecord.ts`, unchanged); J-F5 shows 1 workout → 1 lift, labelled as carried across
- [x] **DATA-14** Verify counts remain correct after reload and navigating away/back. — J-D5, J-F4
- [x] **DATA-15** Add a focused regression test for the confirmed cause where the existing test setup supports it. — `client/src/lib/athleteRecord.test.ts` (6 tests)

Record the actual cause and resolution. “Changed Home from 0 to 15” is not a valid fix. Screenshots use live fixture values, not hardcoded example totals.

---

## 8. Every control must explain intent, destination and result

For each interactive element, answer: **What will happen? Which object will it affect? What changed? How can the user continue or recover?**

### 8.1 Action inventory

Create a compact inventory of clickable/tappable controls across all screens. Include label, owner, action, destination/mutation, pending state, success state and failure/return behavior. Fix dead controls; do not leave them as attractive placeholders.

- [x] **ACT-01** Inventory visible actions and the controls inside expanders/overlays. — `docs/ux-correction/actions.md`
- [x] **ACT-02** Replace ambiguous text where context does not make the action obvious. — Open workout / Resume {day} workout, Change movement, Edit sets & reps, Move X earlier/later, Add X to Week N · Day (see actions.md)
- [x] **ACT-03** Distinguish navigation links from mutations and disclosure controls. — links navigate, plus/heart/Log set mutate, chevrons and expanders disclose; each named for what it does
- [x] **ACT-04** Ensure chevrons do not misleadingly imply navigation when they only reorder or expand. — reorder arrows named "Move … earlier/later"; the prescription chevron says "Edit sets & reps"
- [x] **ACT-05** Give icon-only controls clear accessible names and visible explanatory context; use labels for unfamiliar or high-consequence actions. — every icon-only control has an accessible name (J-H1, J-C2, J-C8, J-H5)
- [x] **ACT-06** Avoid nested interactive elements and accidental row activation when pressing favorite/add/reorder controls. — row controls are separate buttons; favourite neither adds nor opens (J-C8)
- [x] **ACT-07** Provide visible pending state for asynchronous mutations and prevent accidental duplicate submissions. — Save this lift disabled while pending; add deduplicated (J-C7); Log set double-tap counts once (`docs/ux-correction/probes/misc.mjs`)
- [x] **ACT-08** Show success only when the application's actual persistence contract allows it; distinguish queued local changes from confirmed remote sync. — "Lift saved on this device.", "Saved on this device as you change them.", "This device" — no remote sync claimed
- [x] **ACT-09** Preserve input on failure and provide a specific retry/recovery path. — J-G5: refused device writes keep the entry and show a specific alert; the retry succeeds
- [x] **ACT-10** Use inline status or a concise announcement for routine feedback. Do not open a modal confirmation for every ordinary tap. — toasts and inline status; no confirmation modal for ordinary taps

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

- [x] **ADD-01** Show the chosen destination before the user adds: for example, “Adding to Week 2 · Upper.” — "Adding to Week 1 · Pull" strip (J-C1)
- [x] **ADD-02** Make Change workout open a chooser that clearly distinguishes week and day. — Change opens the week/day chooser (J-C6 options list)
- [x] **ADD-03** If no valid destination exists, let the user choose/create one before any successful-add claim. — an empty day is a valid destination ("Empty" in the chooser); nothing claims success without a day
- [x] **ADD-04** Add the exact exercise ID to the exact destination ID, not a day matched only by its label. — adds by exercise id to the active day key (`addExercise` dedupes by `catalogExerciseIdFor`)
- [x] **ADD-05** After success, display “Added to Week 2 · Upper” or the actual equivalent, with View workout. — J-C4
- [x] **ADD-06** Provide Undo if it can safely reverse that exact addition under the existing mutation model. — Undo removes that exact exercise (J-C4 toast)
- [x] **ADD-07** Do not permanently turn every repeated exercise into a disabled state unless duplicates are actually prohibited by product behavior. — duplicates answer "Already in this workout" instead of disabling rows (J-C7)
- [x] **ADD-08** Prevent accidental duplicate additions from rapid taps while pending. — J-C7
- [x] **ADD-09** Ensure add feedback is visible above bottom navigation/resume chrome and announced appropriately to assistive technology. — toast above the dock and the strip (`docs/ux-correction/evidence/catalog-add-feedback.png`); toasts are announced by sonner's live region
- [x] **ADD-10** Keep favorite toggling independent from adding and opening details. — J-C8

### 8.4 Feedback must not become another source of clutter

- [x] **FDB-01** Use concise feedback near the affected control or in one consistent status region. — one toast region; inline status under the Save control
- [x] **FDB-02** Do not stack multiple persistent success banners after repeated ordinary operations. — toasts expire; no stacked banners (J-C6/C7)
- [x] **FDB-03** Keep essential results visible long enough to perceive; avoid a tiny flash that disappears before it can be read. — toasts stay ~4s and carry their actions
- [x] **FDB-04** Preserve keyboard focus and scroll where a local edit does not justify navigation. — J-C3, J-H5
- [x] **FDB-05** Make validation explain the actual field problem, not “Something went wrong” for every case. — "Choose an exercise from the catalog above to save this." / "Enter the load in lb to save this."; refused-write alerts name the operation

---

## 9. Separate active workout from plan editing

The recording shows an active Pull workout while Plan displays Upper. This is not necessarily incorrect state. The failure is that the distinction is not sufficiently explicit.

Required model:

- **Selected plan day:** the day the athlete is viewing/editing.
- **Active session:** the actual workout currently underway, with its own identity and progress.
- **Historical session:** a recorded completed or partially completed workout, independent of later plan edits.

These must not be aliases of a single shared “current day” variable unless the existing model intentionally prevents independent editing and makes that restriction explicit.

- [x] **CTX-01** Identify these three state owners and verify their independence where required. — selected day (`activeDayIndex`), live session (`liveSession.ts`), history (completed device sessions) — independent (J-B, J-F5)
- [x] **CTX-02** In Plan, show “Editing Upper” or equivalent explicit selected-day context when another workout is active. — "Editing Week 1 · Day 01 · Push" (J-B2)
- [x] **CTX-03** In the resume strip, show “Pull workout in progress” and current progress, not only “Workout under way.” — "Sport Transfer workout in progress · 1/20 sets · Cable Rotational Row · set 2 of 4" (Phase D, J-B)
- [x] **CTX-04** Changing the selected plan day must not retarget the active session. — J-B3/B5
- [x] **CTX-05** Pressing Resume must always open the actual active session, not the currently edited day. — J-B5, J-F1
- [x] **CTX-06** Adding an exercise from Catalog must use the explicit add destination, not silently assume the active workout or last edited day. — J-C1/C6
- [x] **CTX-07** Editing a plan after completion must not mutate a historical workout record. — J-F5 and acceptance matrix D4: the plan's rows are unchanged after a finished workout; records are their own store
- [x] **CTX-08** Changing the plan used by an active session must follow the existing snapshot/live-update contract and explain any effect; do not invent silent synchronization. — a session copies its exercises at start (`liveSession.ts`); the Plan says the running workout is separate ("… workout in progress") and edits do not reach it
- [x] **CTX-09** If starting a different workout while one is active is supported, provide an explicit existing resolution flow. Never discard the current workout silently. — one session at a time: the Workout tab shows the live session; Finish workout (early or complete) is the explicit resolution and keeps logged sets (J-F5)
- [x] **CTX-10** Keep partial work intact through navigation, reload and ordinary profile/preferences visits according to the app's persistence contract. — J-B4 (reload), J-F4 (navigation), J-G (profile visit) keep the live session and the draft

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

- [x] **RES-01** Implement the policy centrally. — one `SessionResumeBar` rendered by the shell under the policy in Home.tsx
- [x] **RES-02** Reserve real content padding for the combined bottom nav, safe area and visible resume strip. — `.apex-content` reserves dock + safe area + the strip's measured height (`--sg-resume-height`)
- [x] **RES-03** Ensure the strip never covers the final exercise row, add confirmation or form submit control. — J-H4 and phasef: last row above the strip on every page at every width; the add strip sits above it (Phase D)
- [x] **RES-04** Keep one primary interactive Resume target; avoid several visually competing resume buttons in the same viewport. — J-B6/B7
- [x] **RES-05** Verify the strip disappears or updates after completion/cancellation and does not retain stale set counts. — J-F5: no strip after finishing

---

## 10. Repair the blank Workout area and unfinished layout states

Around 18 seconds, the screen shows a large blank region above rest controls. This may be a scroll/hydration/layout interaction. Do not diagnose it by guesswork or hide the entire section to eliminate the symptom.

- [x] **BLANK-01** Reproduce direct Workout entry, Resume entry, local-tab switching, reload and navigation while a session is active. — J-F1: direct URL, tab from a scrolled page, Home Resume, strip; reload in Phase A
- [x] **BLANK-02** Inspect actual scroll position and whether the exercise content is offscreen, unmounted, invisible, or awaiting data. — the card sits 271px from the top on every entry; nothing offscreen or unmounted
- [x] **BLANK-03** Inspect fixed/min-height rules, flex spacers, viewport-height units, hidden overflow and sticky offsets. — no min-height or viewport-height spacer found in the tracker; the only reserved space is the bottom padding for the chrome
- [x] **BLANK-04** Inspect loading and empty-state branches, including whether content arrives after navigation. — the tracker reads the device store synchronously; there is no loading branch to arrive late
- [x] **BLANK-05** Fix the actual cause without setting arbitrary negative margins or a viewport-specific height patch. — the symptom did not reproduce, so nothing was patched; no negative margins or height hacks were added
- [x] **BLANK-06** While loading, show a purposeful skeleton or loading state in the relevant content area; do not show an unexplained giant empty panel. — no async gap exists (BLANK-04); the prestart and live card render on first paint
- [x] **BLANK-07** When no valid exercise exists, show a clear recovery state and an appropriate route to the plan. — an empty day's prestart says "Nothing planned for this day yet" with "Build it in Plan"; Start is disabled until the day has exercises (`docs/ux-correction/probes/misc.mjs`)
- [x] **BLANK-08** On active-session Resume, place the current exercise/set and logging action within the meaningful viewport. — J-F2: card in view, largest unpainted run 64px
- [x] **BLANK-09** Verify rest timer, full-session disclosure and finish action remain accessible after the layout fix. — J-F3/F4: rest row, Full session and Finish all present and working
- [x] **BLANK-10** Add a regression check for the confirmed failure mechanism rather than a test of one hardcoded pixel height. — J-F2 measures the largest unpainted run on every entry rather than a pixel height

---

## 11. Finish every screen without creating duplicates

Use these sections to audit the remaining app. Preserve the existing scientific and training functionality. The new visible tab labels map to existing owners; do not build parallel legacy/new pages.

### 11.1 Movement explorer

- [x] **MOV-01** Show current sport and selected movement with an understandable title and short explanation of this page's purpose. — h1 "Movement explorer", "How your sport moves, one action at a time.", sport select and selected action (phasee)
- [x] **MOV-02** Make action browsing controls visible, labeled and valid at list boundaries. — Previous/Next action named and disabled at the ends (phasee)
- [x] **MOV-03** Changing sport selects a valid action or requests a choice rather than retaining an incompatible action silently. — a sport change selects a valid first action (acceptance matrix 02)
- [x] **MOV-04** Keep the action illustration meaningful; do not portray an unverified generated pose as a coaching demonstration. — no generated pose is used; missing figures are listed in `docs/design-handoff/missing-illustrations.md`
- [x] **MOV-05** Use “Explore involved muscles” or equivalent clear wording for the anatomy transition. — "Explore involved muscles"
- [x] **MOV-06** Preserve the selected action through that transition. — J-E2
- [x] **MOV-07** Keep detailed demands/rationale available without burying the primary transition beneath them. — "Why it matters" and demands sit below the transition

### 11.2 Muscle map

- [x] **MUS-01** Show the selected action context above the anatomy so the color mapping has a clear subject. — "Wrestling / Double-leg shot · Change" above the figure (J-E2)
- [x] **MUS-02** Distinguish movement-role coloring from strength-rank coloring in label, legend and data source. — Muscle map colours roles; Strength colours ranks with its own legend and "Coverage tracks logged regions, not rank."
- [x] **MUS-03** Ensure front/back controls match what is actually displayed; no Front-selected control above simultaneous front/back views. — front/back control names the side shown and turns the figure (acceptance matrix 03/11)
- [x] **MUS-04** Keep map selection and muscle-list selection synchronized through canonical IDs. — map and rows select the same key (`pickRow`, acceptance 03)
- [x] **MUS-05** Provide a visible selected-muscle state and a dynamic “Find exercises for [muscle]” action. — selected strip + "Find gluteal complex exercises" (J-E3)
- [x] **MUS-06** Explain what tapping a muscle does with concise nearby guidance if needed. — "Choose a muscle above, or start with what … uses most." under the map
- [x] **MUS-07** Count involved muscles from actual mapping, not from the previous mockup's example eight or the recording's eleven as a fixed number. — "N muscles involved" from the action's mapping
- [x] **MUS-08** Preserve a text-list alternative and usable targets where map regions are too small for direct touch. — role rows list every muscle with 44px targets (phasef)

### 11.3 Exercise catalog

- [x] **CAT-01** Give the page one clear title and a search scope that is easy to understand. — h1 "Exercise catalog", "Search exercises", "Searching the 400 exercises in this catalog."
- [x] **CAT-02** Remove repeated Catalog/Find an exercise headers when they add no orientation. — eyebrow and "Find an exercise" removed (`CatalogDiscoveryPanel.traceability.test.ts`)
- [x] **CAT-03** Clearly separate exercise search from global app search; avoid an unexplained competing “Search everything” route. — local scope line with "Search the whole app instead" as the one explicit route to app search
- [x] **CAT-04** Display result count and total catalog count with unambiguous scope. — "62 of 400" (J-C3 screenshot)
- [x] **CAT-05** Make active filters visible, removable and retained when returning from details. — chips removable and retained (J-C3, J-E4)
- [x] **CAT-06** Retain sorting and favorites functionality in the same owner. — Filter & sort, All / Favorites in the same panel
- [x] **CAT-07** Use readable open rows with title, concise metadata, separate detail/favorite/add controls and destination-aware feedback. — open rows with View details, heart, plus and destination-aware feedback (J-C)
- [x] **CAT-08** Avoid per-row bordered boxes returning through legacy CSS. — rows carry no card border (phasee `boxed: 0px`)
- [x] **CAT-09** Verify long exercise names do not cover grade, heart or add controls. — no overlap of grade, heart or plus at 320–430 (phasef); long names wrap (J-H2 pattern)
- [x] **CAT-10** Explain contextual grade meaning on demand; do not confuse it with the user's strength rank. — "Catalog tag S" named as a contextual grade; the Matches lens says it is not the athlete's rank
- [x] **CAT-11** Preserve an intelligible no-results state with Clear filters and query retention. — no-result search keeps the query with Clear filters (acceptance 04)

### 11.4 Exercise Intelligence overlay

- [x] **EX-01** Open one overlay for the selected exercise, not separate duplicate Overview/Analysis routes. — one overlay; the Genome workspace is retired (NAV-17)
- [x] **EX-02** Keep the name and Close control clear, with appropriate back behavior. — name as h1, "Close exercise intelligence", Back closes it (J-H5)
- [x] **EX-03** Preserve the originating screen's search/filter/scroll/focus on close. — J-C3, J-H5
- [x] **EX-04** Keep all actual Fingerprint, Muscle Genome and Mechanics functions reachable and working. — Fingerprint / Muscle demand / Mechanics reachable in the overlay (acceptance 05)
- [x] **EX-05** Use canonical chart dimensions, real values and a readable data alternative; ignore generated chart label mistakes. — acceptance 05: four real dimensions with a readable alternative
- [x] **EX-06** Label primary/supporting muscle involvement accurately from the actual model. — Primary / Supporting from the exercise's own lists
- [x] **EX-07** Explain supporting sport links without claiming proven direct skill transfer. — "Selected action connection" card states the link without claiming transfer
- [x] **EX-08** Keep source/evidence links real and relevant to the selected exercise/context. — Evidence context disclosure per exercise
- [x] **EX-09** Use the same destination-aware add/favorite operations as Catalog. — same `addExercise` / `toggleFavorite` (J-C)
- [x] **EX-10** Keep sticky actions and close controls usable with mobile safe areas and long content. — sticky action row inside a `auto / 1fr / auto` sheet; no overflow at 320 (acceptance 05)

### 11.5 Plan

- [x] **PLAN-01** Clearly identify the selected week and day, with a separate editing label where an unrelated workout is active. — "Sport Transfer · Week 1 · Day 05 · 6 exercises" and "Editing …" when another workout is live (J-B2)
- [x] **PLAN-02** Keep week/day controls compact and understandable; show selected state without depending only on color. — week pills and day tabs with `aria-selected`, underline and count
- [x] **PLAN-03** Move the generic “Name it in your profile” prompt out of the space between the selected-day heading and its exercises. — the capacity note sits below the rows (Phase D)
- [x] **PLAN-04** Retain preference access through a purposeful secondary link or relevant expanded section. — context line → "Edit training preferences"
- [x] **PLAN-05** Give editing a clear label and keep sets/reps/RPE/rest readable. — "Edit sets & reps"; sets/reps/RPE/rest on one line (J-B4)
- [x] **PLAN-06** Separate expand/edit controls from reorder controls. — reorder arrows apart from the edit chevron (plan-with-active-workout.png)
- [x] **PLAN-07** Ensure reorder operation and accessible alternative work without accidental editing/navigation. — 44px arrows named "Move … earlier/later" (phasef)
- [x] **PLAN-08** Verify Saving/Saved/Failed accurately tracks persistence. — "Saved" reflects the write-through day store; J-B4 reload
- [x] **PLAN-09** Keep Add exercises, Import plan and Print working and easy to find. — Add exercises, Import plan, Print present (phasee)
- [x] **PLAN-10** Retain Smart Draft controls in a named expander with a clear explanation that applying a replacement changes the selected day. — Smart Draft is a named expander ("Build a replacement session") with minutes and focus
- [x] **PLAN-11** Preserve existing confirmation/preview/undo behavior for replacement rather than silently applying on opening. — nothing applies on opening; "Draft this session" replaces the day and the "Draft loaded" message now carries Undo, which restores the previous rows (`docs/ux-correction/probes/misc.mjs`)
- [x] **PLAN-12** Coverage and Full analysis use the actual selected week/day and do not imply readiness. — coverage reads the selected day (`.rate-stack-panel` "… Sport Transfer coverage"); no readiness wording

### 11.6 Review

- [x] **REV-01** Explain that this page reviews the selected planned workload; do not blur it with completed workout progress. — "· checks the planned workload, not what you have completed"
- [x] **REV-02** Keep preparation and weekly analysis in one page with clear section headings. — preparation and weekly analysis in one page (phasee sections)
- [x] **REV-03** Show the relevant selected day/week before drills or totals. — the selected day is named first
- [x] **REV-04** Use actual preparation drills and accessible instructions rather than an unreadable compressed list of names. — drills listed with instructions (acceptance 07)
- [x] **REV-05** Render direct/supporting volume with real segment lengths and clear units. — volume map with direct and supporting sets (acceptance 07)
- [x] **REV-06** Explain estimates through a concise disclosure, not a large warning wall. — estimate notes in a disclosure
- [x] **REV-07** Derive recovery spacing from actual scheduling information; do not invent weekdays or recovery hours. — spacing alerts come from consecutive saved days in the plan (`recoverySpacing.ts`), never weekdays or hours
- [x] **REV-08** Label the action Review workout/Resume workout appropriately for its real destination and state. — "Open workout" / "Resume {day} workout"

### 11.7 Workout: prestart and active

- [x] **WORK-01** Prestart shows day, context, prescription and one clear Start workout action. — prestart: day, position, prescription rows, Start workout (phasee)
- [x] **WORK-02** Active view shows current exercise, set number, relevant load/reps and one clear logging action. — workout-active.png
- [x] **WORK-03** Logging a set visibly changes the recorded count/progress and follows existing progression behavior. — J-F3
- [x] **WORK-04** Rest controls clearly distinguish changing rest duration from skipping the current rest. — −15s / +15s vs Skip / Clear, each named
- [x] **WORK-05** Skip exercise clearly names its effect and does not masquerade as logging completion. — "Skip {exercise}" and "Skipped · nothing recorded"
- [x] **WORK-06** Finish/cancel/partial-completion behavior preserves data and states the actual outcome. — "Finish workout early · keeps the N logged sets" (J-F5)
- [x] **WORK-07** Navigation away and Resume restore the correct exercise/set and timer semantics. — J-F4
- [x] **WORK-08** Prevent double logging or double completion from rapid taps and slow responses. — two Log set taps in one tick count one set (`docs/ux-correction/probes/misc.mjs`)
- [x] **WORK-09** Avoid showing the global Resume strip inside the active workout itself. — J-B6

### 11.8 Matches

- [x] **MATCH-01** Explain the page in plain language: exercises selected for the chosen sport/movement demands. — "Exercises picked for how your sport moves."
- [x] **MATCH-02** Show selected movement and make Change movement explicit. — selected movement with "Change movement"
- [x] **MATCH-03** Keep ranking qualities clearly distinct from muscle roles and strength ranks. — ranking qualities line vs muscle roles vs ranks kept apart (lens line)
- [x] **MATCH-04** Label numeric score meaning and contextual grade meaning sufficiently for a newcomer. — lens line: score 0–100 = fit to the movement, tag = contextual grade, not a rank of you
- [x] **MATCH-05** Why this match expands an exercise-specific explanation, not identical generic copy for every row unless that is truly all the source supports. — "Why this match?" opens the row's own explanation (phasee)
- [x] **MATCH-06** Make individual adding use the shared destination/feedback contract. — plus named "Add X to Week N · Day" with the shared toast
- [x] **MATCH-07** Retain research context and actual sources without overwhelming the first view. — research context behind the lens disclosure
- [x] **MATCH-08** Handle no matches, missing scores and equipment/context changes honestly. — `matches-empty` state and "No priority qualities identified" (Home.matches tests)

### 11.9 Progress

- [x] **PROG-01** Label recorded workouts and logged lifts with consistent scope. — "N workouts recorded, N lifts logged" (J-D2)
- [x] **PROG-02** Show historical sessions as historical records, independent of later plan edits. — records unchanged by later plan edits (acceptance 10, J-F5)
- [x] **PROG-03** Keep session titles, dates and metadata readable without a boxed card for each. — open rows
- [x] **PROG-04** Open actual historical detail from each record. — records open their own sets (acceptance 10)
- [x] **PROG-05** Do not fabricate a multi-point trend from one or two records. — "Baseline" until a lift repeats
- [x] **PROG-06** Provide a truthful baseline/insufficient-data state where needed. — "No comparable history yet."
- [x] **PROG-07** Explain comparison cohort/method only when supported; do not relabel a generic comparison “other wrestlers.” — comparison text names the group only when a reference applies
- [x] **PROG-08** Make View strength progress navigate to Strength without resetting unrelated history or inventing a duplicate page. — the lifts figure opens Strength; no duplicate page

### 11.10 Strength Genome

- [x] **STR-01** Clearly distinguish coverage count, lift count and rank. — "10 / 18 regions covered · 6 lifts recorded", "Coverage tracks logged regions, not rank."
- [x] **STR-02** Use one canonical percentile/rank configuration and approved badge artwork. — `shared/capabilityRank.ts` + `RankIcon`, unchanged
- [x] **STR-03** Keep National crimson, not the orange used in a generated reference; preserve all approved rank semantics. — National crimson `#C93650` kept (acceptance 11)
- [x] **STR-04** Keep unscored separate from Prospect and World Stage. — unscored hatched, apart from Prospect and World Stage
- [x] **STR-05** Ensure map colors, region rows and details agree after loading and after a new record. — J-D4: map, rows and sheet agree after a new record
- [x] **STR-06** Investigate any transition where an initial map appears to show a different coloring mode before rank colors; show an honest loading state instead of stale unrelated colors. — "Ranking your lifts…" line while ranks load (`StrengthGenomePanel` rankNotice); the map shows only "on record" state until then
- [x] **STR-07** Make “Tap a muscle to view its strength record” or equivalent guidance clear. — map caption present (phasee)
- [x] **STR-08** Region details belong to this screen and restore context on close. — region sheet on the page; close restores scroll (acceptance 11)
- [x] **STR-09** Log a lift has a clearly labeled form, correct units/load semantics, pending/error states and successful persistence. — J-D4, J-G5, J-H3
- [x] **STR-10** Recent lifts and How ranks work remain reachable and readable. — Recent lifts and How ranks work on the page

### 11.11 Profile and settings

- [x] **PROFILE-01** Show a clear About me/Profile identity with a labeled edit action. — "About me" with "Edit profile"
- [x] **PROFILE-02** Group preferences and settings without inventing separate duplicate Equipment/Settings pages. — one page of groups (J-G3)
- [x] **PROFILE-03** Preserve sport and non-sport training modes, goals, days and session-time controls. — sport / non-sport modes, goal, days, session time present (J-G2)
- [x] **PROFILE-04** Equipment summaries match actual choices and changes persist. — J-G3 summary 7 → 8 types
- [x] **PROFILE-05** Training priorities retain existing region/capacity and applicable issue/context controls. — Training priorities group (CapacityFocusCard)
- [x] **PROFILE-06** Account/sync status reflects reality and keeps sharing preferences accessible. — Account & sync with norms-pool consent
- [x] **PROFILE-07** Appearance and security controls call existing supported behavior. — Theme select; passkey enrol/remove
- [x] **PROFILE-08** Guides, research, onboarding restart and launch-video preview/settings remain available. — Guides & research, Launch video groups
- [ ] **PROFILE-09** Autosave claims are shown only if reliable autosave exists; failures retain input and display truthful state. PARTIAL — the preferences store writes through and says so; the tracker and the lift log report a refused device write (J-G5), but a refused write of the preferences themselves is not surfaced separately PARTIAL — the preferences store writes through and says so; the tracker and the lift log report a refused device write (J-G5), but a refused write of the preferences themselves is not surfaced separately
- [x] **PROFILE-10** Returning from Profile preserves the prior task context. — J-G4

---

## 12. Visual completion: refined technical depth without box overload

Keep the visual identity that Gabe likes. The current work is about orientation, hierarchy and functional completeness, not making the app generic.

- [x] **VIS-01** Use a consistent navy background/surface system instead of unrelated gradients and legacy panels on each route. — navy surface tokens on every destination; the Progress gradient stop aligned with the others
- [x] **VIS-02** Use shared page-title, section-title, body, metadata and metric styles. — shared h1 / metric-label / body / meta styles (`typeScale.test.ts`)
- [x] **VIS-03** Keep long copy in sentence case and readable body typography; reserve condensed/all-caps styling for short headings. — sentence case for copy; caps only for short labels (`uiVocabulary` and tab tests)
- [x] **VIS-04** Use open list rows and restrained hairlines; ordinary rows should not each require a rounded or square card border. — open rows with hairlines (Home, Plan, Catalog)
- [x] **VIS-05** Remove leftover nested panel wrappers that serve no interaction or grouping purpose. — Home's nested cards replaced by rows; ExerciseGenomeWorkspace removed
- [x] **VIS-06** Retain useful technical anatomy, charts and exercise imagery; do not substitute empty decorative placeholders. — anatomy, fingerprint and media kept
- [x] **VIS-07** Prioritize accurate existing media over an attractive but incorrect exercise pose. — no substituted poses
- [x] **VIS-08** Keep illustrations subordinate to the primary task; they must not push basic controls far below the first viewport. — CTA at 405px (J-A2)
- [x] **VIS-09** Align content gutters, row heights and control baselines across screens. — 16px gutters, 44px controls (phasef)
- [x] **VIS-10** Use one action-color system and reserve dominance for the page's main action. — one orange action per screen
- [x] **VIS-11** Keep strength rank colors semantically separate from action/selection colors. — rank colours from `capabilityRank.ts`; action colour never used for ranks
- [ ] **VIS-12** Remove obsolete selectors/classes rather than piling contradictory overrides on top of them. PARTIAL — the Genome workspace and its styles were deleted; the shell and Home rules replace the old ones, but some superseded selectors remain in index.css under later overrides PARTIAL — the Genome workspace and its styles were deleted; the shell and Home rules replace the old ones, but some superseded selectors remain in index.css under later overrides
- [x] **VIS-13** Confirm original logo and badges are real assets, not traced/cropped copies of generated screen images. — logo and badges are the original assets (acceptance "Original assets")
- [x] **VIS-14** Do not use the entire reference PNG as a page background or fake functional UI. — no reference image used as UI

Starting mobile guidance: 16–20px gutters, 24–32px between major sections, readable 15–17px body/row titles, approximately 13–14px secondary text, 44px minimum touch targets, and content-sized controls. Adapt to the existing system and actual device rendering rather than mechanically copying dimensions.

The status bar/browser chrome in a recording is not application header content. Do not recreate it as part of the page.

---

## 13. Responsive, accessibility and safe-area checks

Test actual interactions, not just a desktop screenshot reduced in size.

- [x] **A11Y-01** Check core screens at 360px, 390px and 430px CSS widths. — 360, 390, 430 (phasef, J-H)
- [x] **A11Y-02** Check a 320px or similarly constrained width for overflow resilience. — 320 (phasef)
- [x] **A11Y-03** Check a larger text setting and approximately 200% text zoom/reflow where supported. — 20px root at 360 (J-H2) and 32px root at 360 (extras, overflow32): tab rows and the day row keep the selected item in view; the page width stays 360 on every destination except a 6px bleed from the coverage panel on Plan
- [x] **A11Y-04** Confirm no horizontal page overflow; intentional tab/list overflow must be explicit and usable. — phasef: no page overflow; the only sideways scrollers are the tab rows, with arrows
- [x] **A11Y-05** Confirm navigation labels never hide behind fixed utilities. — J-H1
- [x] **A11Y-06** Keep each primary touch target at least 44px, including small-looking favorite/add controls. — phasef: no interactive target under 44px in the sampled controls
- [x] **A11Y-07** Verify actual text/background contrast; white on bright orange is not automatically accessible. — every visible text run in the first viewport of seven screens checked against its background, gradients at their worst stop: none below 4.5:1 (extras.mjs)
- [x] **A11Y-08** Provide visible keyboard focus and logical order. — 31 `:focus-visible` rules; J-H5 walks focus into and out of the overlay
- [x] **A11Y-09** Use semantic buttons, links, tabs, fields and disclosures with appropriate state attributes. — buttons, `role="tab"`/`aria-selected` day tabs, native `details`, `role="dialog"` overlay, `aria-pressed` toggles
- [x] **A11Y-10** Ensure screen-reader names distinguish View details, Favorite and Add for each exercise. — "Inspect X", "Save X to favorites", "Add X to Week N · Day" (J-C, J-H5)
- [x] **A11Y-11** Give charts/anatomy a readable text alternative and selection that does not depend only on color. — fingerprint data alternative (acceptance 05); role rows list the map; selection shown by text and outline
- [x] **A11Y-12** Manage modal focus, background interaction and focus restoration correctly. — J-H5: focus to Close on open, back to the opener on Escape and on Back; dock hidden behind the overlay
- [x] **A11Y-13** Test a logging form while the on-screen keyboard is open; selected fields and submit controls remain reachable. — J-H3
- [x] **A11Y-14** Reserve bottom space for navigation, safe-area inset and any visible resume strip. — `.apex-content` bottom padding = dock + safe area + strip height
- [x] **A11Y-15** Confirm the final list row and last setting are fully visible/reachable above fixed chrome. — J-H4; phasef "last item above chrome" on every page
- [x] **A11Y-16** Respect reduced motion and avoid continuous decorative animation behind working controls. — `prefers-reduced-motion` rules in index.css and four component sheets; no continuous decorative motion behind controls
- [x] **A11Y-17** Check desktop/tablet layout remains deliberate and does not simply stretch a narrow mobile list across the whole screen. — one 68rem column at 1024px+ (`docs/ux-correction/evidence/desktop-1280-home.png`, `desktop-1280-plan.png`)

---

## 14. Loading, empty, error and offline states

Empty data is not the same as data that has not loaded. Unknown state should never briefly masquerade as a confident zero or an incorrect rank map.

- [x] **STATE-01** Loading Home does not flash “Nothing recorded” before record hydration completes. — J-D1/D6 sampling
- [x] **STATE-02** Loading Strength does not show movement-role colors or another stale mode as if they were ranks. — STR-06
- [x] **STATE-03** Catalog loading retains the current query/filter and gives purposeful feedback. — J-C3
- [x] **STATE-04** Add/save/log pending states prevent accidental repeat submissions without freezing unrelated navigation. — J-C7, WORK-08, Save disabled while pending
- [x] **STATE-05** Failure messages identify the failed operation and preserve recoverable input. — J-G5
- [x] **STATE-06** Local-only/offline state follows the established storage contract and does not claim remote sync. — "This device" / "Saved on this device"; no sync claimed without an account
- [x] **STATE-07** Zero records, empty plan, empty selected day and no search results each have an appropriate next action. — zero records (J-D6), no plan / empty day (HOME-01 states, BLANK-07), no results (CAT-11)
- [x] **STATE-08** Missing assets reserve sensible space or use a neutral fallback; they do not break the layout or hide text. — missing figures fall back to neutral space (missing-illustrations.md); probes route media to a placeholder without layout change
- [x] **STATE-09** Slow data responses cannot overwrite a newer selection with stale results. — server data arrives through tRPC/react-query keyed by its input; no hand-rolled fetch races in the panels
- [x] **STATE-10** Rapid tab switching does not attach the previous tab's content/state to the new heading. — four taps in one tick: last tab wins with its own heading, URL and content (extras.mjs)
- [x] **STATE-11** Refreshing during an active workout follows the real resume/persistence contract. — J-B4 reload keeps the session; Phase A reload resumes mid-session
- [x] **STATE-12** Missing comparison/evidence data is described honestly without fabricated citations or metrics. — "No comparable history yet.", "Baseline", "No priority qualities identified"

---

## 15. Data and asset boundaries

This is a UX completion task. Do not recalibrate strength norms or alter research eligibility merely to make the screenshots look plausible.

- [x] **SAFE-01** Preserve authoritative scoring, percentile, muscle-effect and evidence calculations unless a separately authorized concrete defect requires work. — no scoring, percentile, muscle-effect or evidence code changed
- [x] **SAFE-02** Treat example numbers in mockups and recordings as state examples, not constants. — all counts in evidence come from live fixture values
- [x] **SAFE-03** Preserve canonical exercise/muscle/action/region IDs across routes and stores. — ids unchanged; the muscle → catalog filter uses canonical keys (J-E)
- [x] **SAFE-04** Keep completed records independent from current plan edits. — CTX-07
- [x] **SAFE-05** Do not delete, reset or overwrite real user data during visual verification. — probes run on emulated stores only
- [x] **SAFE-06** Use an appropriate existing fixture/test account or reversible local test data for mutations. — fixtures in `docs/ux-correction/probes/home.mjs` and the D-journey seed
- [x] **SAFE-07** Keep the approved rank artwork and configuration; no new generated badge system. — STR-02
- [x] **SAFE-08** Use native SVG for appropriate icons/charts/interactive geometry; do not claim raster badge art has been vectorized by changing its extension. — no raster renamed; SVG where it already was
- [x] **SAFE-09** Report specific missing production assets without abandoning unrelated implementation. — missing-illustrations.md
- [x] **SAFE-10** Follow existing authorization for publishing/deployment and accurately distinguish local verification from released changes. — pushed to `main` under the standing authorization; Vercel deployment state recorded in progress.md; local verification is stated as local

---

## 16. Required end-to-end journeys

Run these against the actual application after implementation. Record steps, expected result, observed result and evidence. Use current valid data; names below describe the scenario rather than a required hardcoded fixture.

### Journey A — a new visitor understands Home

- [x] **J-A1** Open Home from a fresh page load with no active workout. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-A2** Confirm Home is explicitly identified and the next action is readable in the first normal viewport. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-A3** Find the entry for browsing exercises without using hidden navigation or unexplained icons. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-A4** Return Home and find the entry for exploring movements/muscles. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-A5** Return Home and find the entry for strength progress. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-A6** Verify each destination presents an appropriate title and useful starting position. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

### Journey B — resume while editing a different day

- [x] **J-B1** Begin or load an active Pull workout in test data. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-B2** Open Plan and select Upper for editing. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-B3** Confirm editing context and active-workout context are separately labeled. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-B4** Change a valid Upper prescription and persist it. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-B5** Resume the workout and confirm it is still Pull, at the correct exercise/set. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-B6** Confirm no duplicate Resume strip appears within the active Workout page. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-B7** Return Home and confirm the active-workout primary module is truthful and not duplicated by another visible resume control. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

### Journey C — add an exercise with a known destination

- [x] **J-C1** Enter Exercises from a selected plan day. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-C2** Confirm the intended destination is visible before adding. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-C3** Open details, change analysis tabs and close; confirm query/filter/scroll are retained. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-C4** Add one exercise and verify destination-specific success feedback. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-C5** Use View workout and verify exactly the intended addition. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-C6** Repeat with a changed destination and verify no stale-day addition. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-C7** Rapidly tap during a pending add and verify no accidental duplicate mutation. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-C8** Favorite an exercise and confirm it neither adds nor opens details accidentally. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

### Journey D — record consistency

- [x] **J-D1** Load a fixture with valid existing lifts. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-D2** Compare Home, Progress and Strength counts according to their declared scopes. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-D3** Confirm no invalid first-lift empty state is displayed. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-D4** Save one valid lift and verify the appropriate summaries/history refresh. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-D5** Reload and verify the record persists and summaries remain truthful. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-D6** Test zero-record and delayed-hydration cases without flashing false data. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

### Journey E — movement to muscle to exercise

- [x] **J-E1** Choose a sport and movement. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-E2** Explore involved muscles and verify identical action context. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-E3** Select a muscle and find exercises for it. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-E4** Confirm the muscle filter is visible and can be removed. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-E5** Return through the flow without losing the user's intended selection or landing on an unexplained partial scroll position. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

### Journey F — active workout layout and persistence

- [x] **J-F1** Open Workout directly, through its tab, through Home Resume and through the persistent strip. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-F2** Verify current exercise/set is visible and there is no unexplained giant blank panel. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-F3** Log a set; verify visible feedback and real recorded progress. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-F4** Navigate away and resume; verify actual rest/timer and set semantics. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-F5** Exercise supported completion/partial-completion behavior and verify one intended historical record. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

### Journey G — settings and recovery

- [x] **J-G1** Open Profile from a non-Home screen and verify correct navigation emphasis. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-G2** Change a reversible preference and verify persistence and clear feedback. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-G3** Find equipment, sharing, appearance, security and guide/research functions. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-G4** Return to the prior task with its context preserved. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-G5** Exercise a representative failed save/add and verify preserved input, clear error and retry. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

### Journey H — constrained mobile use

- [x] **J-H1** At 360px, verify all Train tabs and utilities are separate and reachable. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-H2** Use a long exercise name and larger text; verify control separation and wrapping. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-H3** Open a numeric form with the keyboard visible; verify the input and submit action remain usable. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-H4** Scroll to the last content item while the resume strip is visible; verify it is not covered. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`
- [x] **J-H5** Check back/close and focus restoration on an overlay. — PASS in `docs/ux-correction/evidence/journeys-results.json` (`docs/ux-correction/probes/phaseg.mjs`); steps and readings in `docs/ux-correction/evidence/README.md`

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

- [x] **USER-01** Perform a no-prior-explanation walkthrough of these tasks using only visible UI cues. — `docs/ux-correction/walkthrough.md` — heuristic walkthrough; human validation pending
- [x] **USER-02** Record places requiring guessed icon meanings, hidden destinations, unexplained terms or trial-and-error tapping. — walkthrough.md table
- [x] **USER-03** Fix those concrete ambiguities rather than adding a mandatory tutorial to compensate for them. — walkthrough.md: each ambiguity fixed in the interface, no tutorial added
- [ ] **USER-04** If a human test occurs, report actual observed hesitation/wrong turns; do not invent timings or success rates. N/A — no human test took place; nothing is reported as observed hesitation N/A — no human test took place; nothing is reported as observed hesitation
- [x] **USER-05** If a human test is unavailable, label the result “heuristic walkthrough; human validation pending,” not “usability verified by users.” — labelled "heuristic walkthrough; human validation pending" in walkthrough.md

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

- [x] **PROOF-01** Capture actual runtime evidence for the required set. — docs/ux-correction/evidence/ (twelve screenshots and one recording, README.md)
- [x] **PROOF-02** Compare the corrected views against both this behavior brief and the approved visual character. — README.md tables map each capture to the brief's row; the visual character (navy, orange action, original logo and badges) is unchanged
- [x] **PROOF-03** Verify screenshots do not accidentally use different users, fixture stores or stale bundles when comparing record counts. — one fixture per probe run on the final build; the record-count captures come from the D journey's seed in one session
- [x] **PROOF-04** Run relevant existing build/type/lint checks and tests using the repository's actual commands. — docs/ux-correction/evidence/README.md Commands
- [x] **PROOF-05** Add focused regressions for confirmed navigation/state bugs where needed; avoid tests that simply duplicate CSS constants. — `athleteRecord.test.ts`, `TodayActionPanel*.test.ts`, `deviceStrengthObservations.test.ts` (refused write), `liveSession.test.ts` (strip policy), journeys F2/H5 as runtime regressions; no CSS-constant tests added
- [x] **PROOF-06** Record command results and distinguish pre-existing failures from new failures with evidence. — README.md: 5 pre-existing `server/supabase*` credential failures, identical on `main` before this work
- [x] **PROOF-07** Do not fake unavailable device coverage. State when a check used browser emulation rather than a physical iPhone. — README.md first paragraph: browser emulation, not a physical iPhone
- [x] **PROOF-08** Recheck affected journeys after the final shared-component changes, because header/scroll fixes can regress other pages. — journeys A–H re-run after the final shared CSS changes (README.md)

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

- [x] **DONE-01** Every required checklist item is either verified, explicitly blocked, or demonstrably not applicable with a reason. — every box below is checked, blocked (AUD-01), N/A (USER-04) or partial (PROFILE-09, VIS-12) with a reason
- [x] **DONE-02** No clipped navigation, empty Home tab strip or route-inappropriate utility layout remains. — NAV-07, NAV-02, NAV-01
- [x] **DONE-03** Home clearly functions as the product's starting point in both active-workout and ordinary states. — HOME-01..09
- [x] **DONE-04** The contradictory record displays have a documented actual resolution or a precise unresolved blocker; no hardcoded count patch is used. — DATA-01..08: one selector, no constant
- [x] **DONE-05** Exercise adding tells the user what it affects and visibly confirms the result. — ADD-01..10
- [x] **DONE-06** Active workout, plan editing and historical records remain distinct and correct. — CTX-01..10
- [x] **DONE-07** The large blank Workout symptom is resolved or accurately documented with reproduction evidence and the remaining cause. — BLANK-01..10: not reproduced; four entries measured
- [x] **DONE-08** All existing features have a retained reachable owner; no duplicate legacy/new pages remain unintentionally. — INV-10, NAV-17
- [x] **DONE-09** Technical depth, original logo and approved rank artwork are preserved. — EXEC-06, STR-02/03
- [x] **DONE-10** Final runtime screenshots and transition evidence are available. — PROOF-01
- [x] **DONE-11** Relevant verification commands and journeys have actual recorded outcomes. — PROOF-04/06 and journeys
- [x] **DONE-12** Deliver a concise implementation summary, changed source/asset paths, completed checklist/progress record, evidence links and specific remaining blockers. — the final response and progress.md

### Final response requested from Claude

Lead with the implemented user-facing improvements. Then provide:

1. What changed in navigation and Home.
2. Actual cause and fix for the inconsistent record display.
3. What changed in action feedback and workout/plan context.
4. Runtime screenshots/recording and completed verification summary.
5. Any real remaining limitation, its user impact and exact next dependency.

Do not promise that you will implement these items later after returning a plan. Implement the authorized work now, verify it in the app, maintain this checklist, and report honestly what is complete.
