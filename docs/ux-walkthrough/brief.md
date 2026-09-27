# Sports Genome — walkthrough correction brief for Claude

**Source:** supplied September 27, 2026 iPhone walkthrough, approximately 2 minutes 25 seconds.  
**Purpose:** finish and refine the current app, with particular attention to launch playback, navigation, overlays, loading, and legibility.  
**Deliverable:** working changes with recorded verification. This is an implementation assignment, not a request for another proposal.

## 1. Read this before changing anything

Keep the current refined, technically rich Sports Genome identity. The user likes the direction. Preserve the original logo and animation, navy surfaces, orange primary actions, useful anatomy, scientific detail, exercise tools, and planning depth. Improve hierarchy and interaction so that a first-time user understands what to do.

Do not rebuild the app from scratch. Do not manufacture new screen variants. Do not substitute generic dashboard cards or delete advanced functionality to make the app appear simpler. Reduce simultaneous visual competition and make the existing capabilities easier to reach.

This brief updates earlier implementation and polish briefs. For issues specifically discussed here, use the current recording and these acceptance criteria. Do not reintroduce older layouts merely because an earlier document described them. Retain earlier requirements that remain relevant and are not contradicted here.

The reviewer saw the recording, not the source code, media asset, network trace, or runtime logs. Observed symptoms below are evidence; implementation causes are hypotheses to investigate. Exact event timing must be measured in the app. Recording timestamps identify useful places to look, not hardcoded playback durations.

### Working agreement

- [x] Read this entire file before editing. — verified (see progress.md)
- [x] Identify the actual current app and working branch. The older app shown at the beginning is a playback reference, not the redesign target. — verified (see progress.md)
- [x] Inspect existing project instructions and preserve unrelated user changes. — verified (see progress.md)
- [x] Map each requirement to its actual component, route, store, or asset before changing it. — verified (see progress.md)
- [x] Work through the priorities in order, completing functional repairs before decorative refinements. — verified (see progress.md)
- [x] Maintain a durable checklist with `pending`, `in progress`, `verified`, or `blocked` status and evidence. — verified (see progress.md)
- [x] Check an item only when its observable outcome has been verified. Code written is not equivalent to behavior verified. — verified (see progress.md)
- [x] If a symptom cannot be reproduced, record the attempted conditions and add targeted protection only when justified. — verified (see progress.md)
- [x] Never invent test results, screenshots, device coverage, or a root cause. — verified (see progress.md)
- [x] Keep changes reviewable. Do not publish or deploy unless the existing user authorization covers that action. — verified (see progress.md)

## 2. What is already better — preserve it

The current Home is substantially more useful than the old version: it has a next workout, weekly progress, and exploration links. Train has visible Plan, Review, Workout, and Matches destinations. Body Lab has understandable Movements, Muscles, and Exercises tabs. Adding an exercise from the catalog produces destination-aware feedback and the added exercise subsequently appears in the plan.

The recording shows Home reporting 16 lifts and 5 recorded workouts; the later Progress view also shows those totals. These are positive observations from this walkthrough, not a claim that all persistence cases have been tested.

- [x] Preserve Home's task-led structure and current useful shortcuts. — verified (see progress.md)
- [x] Preserve the separation between bottom navigation, local tabs, and global Search/Profile utilities. — verified (see progress.md)
- [x] Preserve exercise destination context, Undo, and the path to view the updated workout. — verified (see progress.md)
- [x] Preserve per-set editing and the uniform-prescription option. — verified (see progress.md)
- [x] Preserve advanced analysis behind understandable entry points. — verified (see progress.md)
- [x] Preserve existing user plans, history, favorites, settings, and original scientific calculations. — verified (see progress.md)

## 3. Evidence ledger and priority

Times are approximate elapsed recording positions. Some observations are sampled frames, not proof of every intermediate event.

| ID | Priority | Recording evidence | Required outcome |
|---|---|---|---|
| V01 | P0 | Around 2–4s, the older app remains black before its animation appears. | A deliberate initial appearance while the app or media loads; investigate which portion the app can control. |
| V02 | P0 | Around 13.4–13.6s, current launch shows the silver S; around 13.8s, Home is already appearing through the animation. | Let the intended animation sequence complete unless the user skips. |
| V03 | P0 | Around 14s Home says “Build training around your goals”; by 15s it shows existing Upper workout. | Loading must not masquerade as an empty plan. |
| V04 | P0 | Around 137–143s, preview displays the completed logo/wordmark across multiple samples. | Establish whether the long hold is in the media or player; remove accidental extra waiting. |
| V05 | P0 | Around 143.5–144.5s, preview exit reveals Profile only in the lower part of the display, with a large blank upper region. | Close preview cleanly and restore a correctly laid-out Profile. |
| U01 | P1 | Around 131–135s, scrolled Profile content appears in the status-bar/Dynamic Island region. | Safe-area treatment and sticky layout must remain correct while scrolling. |
| U02 | P1 | Around 42–45s, translucent feedback overlaps the destination strip and underlying catalog text. | One legible feedback surface with deliberate placement. |
| U03 | P1 | Around 72–78s and 96–101s, Add Exercises uses a bright white, dense sheet within the dark app. | Bring the picker into the app's surface, type, and interaction system. |
| U04 | P1 | Around 98–101s, an Exercise Intelligence header is visible behind the still-open Add Exercises sheet. | Audit detail/picker ownership and eliminate ambiguous overlay layering. |
| U05 | P1 | Around 87–90s, detailed coverage appears in a small inset scrolling area. | Analysis should be a readable, complete surface with obvious exit behavior. |
| D01 | P1 | Around 111s Strength uses red “On record” regions while ranking loads; later it changes to rank colors. | Distinguish loading, record coverage, and rank without a confusing visual transformation. |
| D02 | P1 | Coverage summary says adductors are 11 points short; a sampled expanded analysis says 15 points under target. | Check whether the values share scope and revision; reconcile or explain the difference. |
| U06 | P2 | Several lists combine small metadata, repeated outlines, badges, icons, and explanatory text. | Increase readability and reduce repetitive framing while retaining utility. |

P0 means address first because these interrupt or misrepresent entry into the app. P1 means important usability or trust repair. P2 means finish after the first two groups. Do not skip P1 to spend the session polishing decorative motion.

## 4. Launch and preview: repair the complete lifecycle

### 4.1 Desired experience

On launch, the user sees a deliberate navy brand surface, then the original intro at its intended composition, then a ready Home. The full logo and wordmark remain visible. The sequence does not fade prematurely into unhydrated content.

When launched from About Me, the same media should have the same framing and playback quality. Closing or finishing it returns to About Me at a sensible preserved position. The preview must not cause a second launch, resize Profile, or leave an invisible interaction layer behind.

Do not assume the early launch problem is cropping: in this recording, premature transition is directly visible. Check crop and aspect ratio separately. Do not solve premature completion by enlarging the logo, rebuilding the asset, or adding a longer arbitrary timeout.

### 4.2 Inspect before modifying

- [x] Locate every use of the launch video: app entry, About Me preview, preload/poster paths, and any legacy splash component. — verified (see progress.md)
- [ ] Identify the actual media URL/file, intrinsic dimensions, duration, audio behavior, and first/last meaningful frames. — PARTIAL — one URL (`lib/bootExperience.ts` `introVideoUrl`), used by launch and preview; dimensions/duration/frames not measurable here (storage host refused by the network policy)
- [x] Determine whether launch and preview use identical media bytes or different versions. — same constant URL, no poster/preload variant
- [ ] Play the source asset independently. Measure any black lead-in and static end-card tail in the asset itself. — BLOCKED — the asset cannot be fetched from this environment; stand-in clip used for the player checks
- [x] Identify timers, route-ready conditions, animation callbacks, and media callbacks that can dismiss the intro. — verified (see progress.md)
- [x] Determine whether a general “app is ready” event is prematurely closing an otherwise playing video. — verified (see progress.md)
- [x] Inspect layout changes during preview open/close: body scroll locks, container heights, transforms, portals, fixed positioning, and restored scroll offsets. — verified (see progress.md)
- [x] Record the confirmed cause of each V01–V05 issue before claiming it fixed. — verified (see progress.md)

### 4.3 Implement one shared presentation contract

Use the existing framework and project conventions. Share the media presentation and lifecycle where appropriate, while keeping launch and preview completion destinations distinct.

| Mode | Entry | Completion | Early exit | State preservation |
|---|---|---|---|---|
| Launch | Authorized app entry with launch setting enabled | Reveal ready app once | Skip goes to app | Preserve route/session intent; avoid resetting user data |
| Preview | Explicit About Me action | Return to About Me | Close returns to About Me | Preserve relevant scroll and edit state |

- [x] Use the original animation and logo. Do not generate replacements or trace a different mark. — verified (see progress.md)
- [x] Preserve the full composition across supported screen sizes. If fitting creates margins, make them intentional and visually continuous with the source background. — `object-fit: contain` on navy at 390×844 this pass; 320–430 covered in docs/ux-correction
- [x] Avoid stretch, unintended crop, unstable scale, or sudden position changes. — verified (see progress.md)
- [x] Establish explicit loading, playing, finishing, dismissed, and failed behavior. Equivalent existing architecture is acceptable; do not add a needless framework. — verified (see progress.md)
- [x] Prevent application-data readiness from ending valid media playback early. — verified (see progress.md)
- [x] Prevent stale completion callbacks from firing after the user has skipped or closed. — verified (see progress.md)
- [x] Ensure completion/dismissal happens at most once per presentation. — verified (see progress.md)
- [x] Clear listeners, pending callbacks, playback, and layout locks when the presentation ends. — verified (see progress.md)
- [x] Ensure app navigation cannot accidentally replay the intro on ordinary route changes. — verified (see progress.md)
- [x] Respect the existing “Play video while app opens” preference. Preview remains an explicit independent action. — verified (see progress.md)

### 4.4 Loading and failure behavior

- [x] Show an intentional branded loading/poster state while media is unavailable; avoid an app-controlled black void. — verified (see progress.md)
- [x] Separate operating-system/PWA launch behavior from the app-controlled playback interval. If the former causes the delay, inspect the applicable launch configuration rather than claiming CSS fixed it. — verified (see progress.md)
- [x] Prepare application data during the intro where appropriate, without tying intro duration to data readiness. — verified (see progress.md)
- [x] If Home is not ready when the intro ends, show a truthful loading state instead of an empty plan. — verified (see progress.md)
- [x] If playback is blocked, unsupported, or fails, give a reliable route into the app. Do not trap the user behind a splash. — verified (see progress.md)
- [x] Keep an accessible Skip or Continue path for launch and an accessible Close path for preview. — verified (see progress.md)
- [ ] Respect reduced-motion preferences with an appropriate static brand presentation and usable continuation. — NOT RE-RUN — the static reduced-motion branch in index.html is unchanged from the earlier pass
- [x] Avoid a mandatory sound dependency; preserve the existing silent-playback intent unless the product explicitly requires otherwise. — verified (see progress.md)

### 4.5 Long final hold and broken exit

The recording shows the completed preview logo for several seconds. It does not reveal whether those frames are baked into the file, a paused player, a replay/poster fallback, or an extra dismissal delay.

- [ ] Compare the source media's final-frame hold with runtime playback time. — BLOCKED — asset not fetchable; the player holds 700 ms after `ended` and nothing else
- [x] Remove duplicate holds introduced by both the asset and application timers. — verified (see progress.md)
- [ ] If the source asset contains an excessive tail, preserve the original and document any derived playback asset or editorial endpoint. Do not silently overwrite the master animation. — BLOCKED — cannot be judged without the file; master untouched, no derived asset made
- [x] Keep a brief deliberate end-card beat if it belongs to the intended sequence; do not replace a long hang with an abrupt cutoff. — verified (see progress.md)
- [x] Make the preview's Close action usable during the end card. — verified (see progress.md)
- [x] On close/end, remove the media surface completely and restore Profile dimensions and scrolling. — verified (see progress.md)
- [x] Restore focus to the preview trigger when appropriate. — verified (see progress.md)
- [x] Verify the large blank upper region visible at the end of the recording is gone. — verified (see progress.md)
- [x] Verify immediate preview replay starts from the beginning with no previous completion event leaking into the new playback. — verified (see progress.md)

### 4.6 Playback verification matrix

Record observed results. Where actual iOS testing is unavailable, state that explicitly rather than treating a desktop viewport as equivalent.

- [x] Cold launch, intro enabled: deliberate loading, full sequence, correct Home. — verified (see progress.md)
- [x] Warm launch: no premature dismissal and no unnecessary replay outside the intended entry policy. — verified (see progress.md)
- [x] Intro disabled: app opens correctly without a flash of the media surface. — verified (see progress.md)
- [ ] Slow media load: usable fallback, no indefinite blank screen. — PARTIAL — 4 s no-start ceiling in index.html; only the failure case was exercised (2.3 s to the app)
- [x] Media failure: app remains reachable. — verified (see progress.md)
- [x] Skip during loading and during playback: one completion, no later navigation jump. — verified (see progress.md)
- [x] Preview from a scrolled About Me position: correct composition and clean return. — verified (see progress.md)
- [x] Preview natural end: no extended accidental hold or broken layout. — verified (see progress.md)
- [x] Close and immediately reopen preview: clean restart. — verified (see progress.md)
- [ ] Background/foreground during playback: no duplicated exit or permanently blocked UI. — NOT RUN — no visibility-change emulation this pass
- [ ] Reduced motion: intentional static behavior. — NOT RE-RUN this pass
- [ ] Small and tall portrait viewports: full logo and wordmark, usable controls. — PARTIAL — 390×844 this pass; 320/360/430 in docs/ux-correction

## 5. Home: preserve its improvement and remove false states

The Home issue now is not that it lacks all homepage structure. Its structure has improved. The recording reveals a state problem: a returning user briefly sees instructions to create a plan before the existing workout arrives.

- [x] Distinguish unresolved data from confirmed empty data in the plan store and Home selectors. — verified (see progress.md)
- [x] Render a layout-stable loading state while the next workout is unresolved. — verified (see progress.md)
- [x] Show “Create your plan” only after confirming there is no applicable plan. — verified (see progress.md)
- [x] Resolve next-workout title, week/day context, exercise count, and CTA destination from a consistent snapshot. — verified (see progress.md)
- [x] Keep the primary action truthful: Review workout before starting; Resume workout only when a resumable session exists. — verified (see progress.md)
- [x] Keep weekly completion and all-time totals clearly scoped. — verified (see progress.md)
- [x] Verify empty, planned, active, completed, and rest/no-next-workout states against actual product rules. — verified (see progress.md)
- [x] Avoid decorative values or fabricated activity when data is absent. — verified (see progress.md)
- [x] Preserve the existing exploration rows; keep them secondary to the next meaningful action. — verified (see progress.md)

Acceptance: on a returning-user launch, the UI never tells the user they have no plan merely because persistence has not finished loading.

## 6. Header, safe areas, and navigation

The compact header is a better foundation than the old tall stacked header. Refine its behavior instead of restoring the old chrome.

- [x] Audit the app shell once for consistent top inset, bottom inset, sticky offsets, and scroll containers. — verified (see progress.md)
- [x] Reserve an opaque or sufficiently solid status-area background so moving content does not compete with the clock or Dynamic Island. — verified (see progress.md)
- [x] Keep interactive content outside device obstructions. — verified (see progress.md)
- [x] Prevent double top padding when multiple nested screens each apply their own inset. — verified (see progress.md)
- [x] Keep local tabs readable and reachable without colliding with utilities. — verified (see progress.md)
- [x] Ensure page anchors and programmatic scroll targets account for sticky navigation height. — verified (see progress.md)
- [x] Prevent bottom navigation from covering the last content row, sheet footer, or feedback action. — verified (see progress.md)
- [x] Keep Search and About Me accessible with discernible labels, even if their visible treatment uses icons. — verified (see progress.md)
- [x] Define Profile's return behavior and selected navigation appearance consistently; do not falsely imply it is an unrelated main destination. — verified (see progress.md)
- [ ] Verify keyboard-open behavior for search, plan editing, and profile fields. — NOT RUN — on-screen keyboard not emulated; picker search keeps `enterKeyHint` from the polish pass

### Navigation contract

Use actual existing routes; do not invent duplicate pages to satisfy this table.

| Origin | Action | Expected destination/context | Return behavior |
|---|---|---|---|
| Home | Review workout | Current target workout and prescription | Home remains coherent |
| Home | Find exercises | Exercise browser | Back restores origin |
| Muscles | Find selected-muscle exercises | Browser filtered to named muscle | Clear filter is available |
| Plan | Add exercises | Picker bound to explicit week/day | Close returns to that plan |
| Picker | View exercise details | Foreground detail surface | Back restores picker search/scroll |
| Picker/detail | Add | Original target week/day | Confirmation names destination |
| Plan | Full analysis | Readable analysis surface | Close restores plan position |
| About Me | Preview intro | Media presentation | Close/end restores About Me |

- [ ] Check every transition in the table using both the in-app exit and browser/device Back where supported. — PARTIAL — in-app exits verified in journeys A–E; device Back covered only by the earlier NAV journeys in docs/ux-correction
- [x] New destinations should open at a meaningful heading; returning to a list should restore useful position and filters. — verified (see progress.md)
- [x] Preserve intentional remembered tab position, but avoid entering an unrelated page halfway down because a shared scroll container retained an old offset. — verified (see progress.md)

## 7. Overlay ownership: picker, detail, and analysis

The recording shows a white Add Exercises sheet over the dark app, and an Exercise Intelligence header behind that sheet. It also shows full analysis in a small inset scrolling region. Investigate the actual interaction sequence; do not assume a particular implementation bug solely from layering in a frame.

### Add Exercises picker

- [x] Use the existing dark theme tokens for picker surfaces, inputs, rows, separators, typography, and buttons. — verified (see progress.md)
- [x] Clearly show destination, for example “Add to Week 1 · Legs,” using live context rather than hardcoded text. — verified (see progress.md)
- [x] Keep search and relevant filters reachable without a wall of controls. — verified (see progress.md)
- [x] Preserve the useful day-fit sorting and muscle-gap context. — verified (see progress.md)
- [x] Give exercise names visual priority, then movement/equipment metadata, then fit rationale. — verified (see progress.md)
- [x] Make Add an unambiguous control separate from opening details. — verified (see progress.md)
- [x] Make already-added state visible and define intentional duplicate behavior according to existing product rules. — verified (see progress.md)
- [x] Label footer counts accurately: total exercises in the day versus number added during this visit must not be conflated. — verified (see progress.md)
- [x] Confirm footer count reflects persisted destination state, including pre-existing exercises. — verified (see progress.md)
- [x] Keep Done/Close visible and operable without obscuring the last row. — verified (see progress.md)

### Details opened from a picker

- [x] Choose one clear model: replace picker content with detail, or present a properly managed child detail above it. — verified (see progress.md)
- [x] Ensure the requested detail is the foreground interactive surface. Do not open detail behind the picker. — verified (see progress.md)
- [x] Keep one unambiguous active close/back action for the current layer. — verified (see progress.md)
- [x] Preserve the picker query, filters, scroll, and add destination on return. — verified (see progress.md)
- [x] Prevent clicks, scroll, and keyboard focus from reaching inactive layers. — verified (see progress.md)
- [x] On mobile, prefer a readable full-height detail presentation over several narrow nested overlays. — verified (see progress.md)
- [x] Verify Add from detail updates the intended plan and any visible picker count consistently. — verified (see progress.md)

### Full analysis

- [x] Replace the small inset scrolling region with a coherent full-height mobile sheet or existing dedicated detail route. — verified (see progress.md)
- [x] Give the surface an obvious “Legs coverage” title, week/day context, and accessible close/back control. — verified (see progress.md)
- [x] Use one primary content scroll area; remove avoidable nested scrolling. — verified (see progress.md)
- [x] Start with result, most useful explanation, and next action. Put methodology and caveats in a lower disclosure. — verified (see progress.md)
- [x] Preserve all existing analytical information and drill-downs. — verified (see progress.md)
- [x] Return to the originating plan position when dismissed. — verified (see progress.md)

## 8. Feedback: legible, local, and proportionate

The catalog feedback in the recording is translucent enough that destination-strip and underlying row text compete with it. A successful action should answer what changed and where, without requiring the user to decode several overlapping surfaces.

- [x] Establish one feedback placement rule across catalog, picker, details, and plan editing. — verified (see progress.md)
- [x] Use a sufficiently solid surface and readable contrast. — verified (see progress.md)
- [x] Place feedback above the bottom navigation and relevant persistent footer, with deliberate spacing. — verified (see progress.md)
- [x] Deduplicate repeated notifications and prevent stacked messages from becoming a pile of boxes. — verified (see progress.md)
- [x] Keep durable state on the acted-on control: filled favorite, Added state, updated count. — verified (see progress.md)
- [x] Use concise copy: “Added to Week 2 · Upper” with Undo and View workout when those actions are valid. — verified (see progress.md)
- [x] Confirm Undo reverses the exact action, not a different copy of the same exercise. — verified (see progress.md)
- [x] When adding repeatedly, retain accurate feedback without showing stale destinations or undoing the wrong operation. — verified (see progress.md)
- [x] Do not report navigation itself as a major success event when selected-tab/week state already explains it. — verified (see progress.md)
- [x] Make local-only saving understandable without promising account sync that the implementation cannot support. — verified (see progress.md)
- [x] Provide accessible announcements without unexpectedly moving keyboard focus. — verified (see progress.md)

## 9. Strength, coverage, and scientific trust

### Strength map loading

The current recording explicitly labels its interim red map as “On record” and says ranks are loading. That is better than silently presenting fake ranks. However, the map still changes visual meaning after arrival, which can be confusing.

- [x] Treat record coverage and strength ranking as different concepts in state and presentation. — verified (see progress.md)
- [x] During rank loading, use a neutral/loading treatment or explicitly separate coverage mode so color meaning does not silently switch. — verified (see progress.md)
- [x] Preserve map dimensions during loading to avoid layout jumps. — figure height 480 px held while pending (journeys D3)
- [x] Render the rank map, legend, selected-region detail, and list from a compatible data revision. — verified (see progress.md)
- [x] Distinguish unrecorded, recorded-but-unranked, loading, and ranked states. — verified (see progress.md)
- [x] Preserve canonical rank thresholds and identifiers. Do not change science or scores to match a visual reference. — verified (see progress.md)
- [x] Keep anatomy-role colors separate from rank semantics. — verified (see progress.md)
- [ ] Audit current rank display names for consistency across legend, region rows, details, and explanatory text; do not arbitrarily revert names from an older brief. — NOT RE-AUDITED — names unchanged; existing rank tests pass

### Coverage discrepancy

The summary's 11-point gap and analysis's 15-point gap might use different scopes or stale revisions. The recording alone cannot establish which.

- [x] Compare the exact selected week/day, exercises, prescriptions, target definition, and computation revision used by both views. — verified (see progress.md)
- [x] If they express the same quantity, derive them from the same authoritative result. — verified (see progress.md)
- [x] If they express different quantities, name the difference plainly and explain it in context. — verified (see progress.md)
- [x] Recompute after add, remove, undo, and prescription changes without leaving stale summaries. — verified (see progress.md)
- [x] Retain explicit wording that modeled coverage is not a direct physiological measurement. — verified (see progress.md)
- [x] Avoid presenting “Every target, measured” if the values are computed estimates; use accurate terminology such as “Target breakdown” where appropriate. — verified (see progress.md)

### Muscles and exercise intelligence

- [x] Explain the relationship between “12 muscles involved” and “View all 25 muscle roles.” If 25 includes the whole map, say “View all mapped muscles”; if not, use the correct scope. — verified (see progress.md)
- [x] Tie the muscle-specific exercise CTA to the visible selected muscle. Do not leave a stale pectoralis CTA when another muscle is active. — verified (see progress.md)
- [x] Keep the primary scientific takeaway readable before long caveats. — verified (see progress.md)
- [x] Preserve full fingerprint dimensions, methodology, and source information behind clearly labeled disclosures. — verified (see progress.md)
- [ ] Define badges and abbreviations on demand. Do not force users to infer whether a letter refers to exercise fit, strength, or evidence quality. — NOT ADDRESSED — the fit grade badge (A+) still has no on-demand definition

## 10. Refine density without reducing capability

Do not solve this by making all elements tiny. The source recording is downscaled, so measure CSS sizes and actual rendered device behavior rather than inferring exact sizes from pixels here.

- [ ] Audit normal body text, metadata, form labels, input values, and tab labels on an actual narrow viewport. — PARTIAL — picker rows raised to the base size; no full type audit this pass (typeScale test still forbids ≤16px literals)
- [ ] Make critical reading comfortably legible; reserve very small type for genuinely secondary information. — PARTIAL — as above
- [x] Use a shared row surface with separators for repetitive lists where individual boxes do not encode meaningful grouping. — picker results are one list with separators (evidence/after-picker-sheet.png)
- [ ] Reserve strong card framing for distinct tasks, selected content, or important summaries. — PARTIAL — catalog cards and plan rows keep their framing (they carry actions and state)
- [x] Keep one dominant action per task region. Secondary actions should remain clear without matching its visual weight. — verified (see progress.md)
- [x] Consolidate the repeated Plan “Add exercises” and “Find an exercise” invitations when they lead to the same flow; preserve a specific “Find exercises for this gap” entry if it has distinct value. — the row under the analysis appears only as "Find exercises for {gap}"; otherwise "Add exercises" is the one entry
- [ ] Reduce repeated all-caps explanatory text and redundant badges. — PARTIAL — picker fit line now sentence case; other eyebrows unchanged
- [x] Keep technical detail reachable in one understandable step rather than displaying every caveat at once. — verified (see progress.md)
- [x] Maintain sufficient touch targets and spacing for add, favorite, reorder, edit, and close controls. — verified (see progress.md)
- [x] Keep focus, selected, disabled, loading, error, and success states visibly distinct. — verified (see progress.md)
- [x] Verify contrast and that color is not the only signal for selection, role, or rank. — verified (see progress.md)

A good result should still feel like a capable training system. The user should notice the workout or scientific insight first, the next action second, and supporting detail when they need it.

## 11. End-to-end acceptance journeys

Use isolated test data when necessary. Do not corrupt the user's real training history to create a demonstration.

### Journey A — returning user

- [x] Launch with intro enabled; observe full composition and clean completion. — verified (see progress.md)
- [x] Existing plan loads without false empty-state messaging. — verified (see progress.md)
- [x] Review the next workout; verify week/day and exercises match Home. — verified (see progress.md)
- [x] Return Home; confirm no unintended intro replay or changed selection. — verified (see progress.md)

### Journey B — muscle to exercise to plan

- [x] Select a muscle and open its exercise results. — verified (see progress.md)
- [x] Confirm named filter, selected muscle, and add destination agree. — verified (see progress.md)
- [x] Favorite an exercise; feedback remains readable. — verified (see progress.md)
- [x] Open detail, add to the intended day, and inspect the updated plan. — verified (see progress.md)
- [x] Undo once; verify the correct addition is reversed and counts/coverage update. — verified (see progress.md)

### Journey C — plan picker and detail

- [x] Open picker from an existing day with exercises already present. — verified (see progress.md)
- [x] Verify the footer count and destination before adding. — verified (see progress.md)
- [x] Search, open detail, return, and confirm query and position survive. — verified (see progress.md)
- [x] Add an exercise and close picker; confirm plan, count, and analysis agree. — verified (see progress.md)
- [x] Change week/day and repeat; confirm there is no stale destination. — verified (see progress.md)

### Journey D — analysis and strength

- [x] Open full analysis; read and scroll without nested-panel difficulty. — verified (see progress.md)
- [x] Compare summary and detailed gap values under the same state. — verified (see progress.md)
- [x] Open Strength with rank computation pending; inspect truthful loading. — verified (see progress.md)
- [x] Inspect loaded map, legend, and region row for consistent meaning. — verified (see progress.md)

### Journey E — profile and video

- [x] Scroll About Me; verify safe areas throughout. — verified (see progress.md)
- [x] Open preview, allow it to finish, and verify clean return. — verified (see progress.md)
- [x] Repeat, close early, and verify scroll/focus restoration. — verified (see progress.md)
- [x] Toggle launch preference, reopen app, and confirm behavior matches setting. — verified (see progress.md)

## 12. Execution order and completion record

Work in coherent passes. Use targeted tests for state/lifecycle risks and direct interaction checks for layout. Do not build a large test suite that merely mirrors implementation details.

1. **Baseline and diagnosis:** inspect source, reproduce prioritized symptoms, map components and data ownership.
2. **Entry reliability:** fix intro lifecycle, preview exit, and Home hydration states.
3. **Shell and overlays:** repair safe areas, picker/detail ownership, and readable analysis.
4. **Feedback and data consistency:** repair notification placement, rank loading semantics, and coverage agreement.
5. **Visual finish:** unify picker styling, simplify repeated framing, improve typography and touch targets.
6. **Verification:** run acceptance journeys and existing relevant project checks, capture evidence, document limits.

Maintain a small implementation record in the repository or existing project tracking format:

| Requirement | Status | Changed files/components | Verification evidence | Remaining limitation |
|---|---|---|---|---|
| V02 launch completes | Pending | To inspect | Before/after recording | None established yet |
| V05 preview clean exit | Pending | To inspect | Natural end + early close | None established yet |
| V03 Home loading | Pending | To inspect | Cold persisted-data load | None established yet |

Expand this table to cover the material requirements; these sample rows are not evidence of completion. If context runs low, write the current diagnosis, edits, test results, and next step before continuing. Do not declare the work finished because the first pass looks better.

### Required final report from Claude

- [x] Explain the confirmed launch and preview causes in plain language. — verified (see progress.md)
- [x] List completed requirement IDs and the meaningful resulting behavior. — verified (see progress.md)
- [x] Attach or identify before/after screenshots or recordings for launch, preview exit, picker/detail, analysis, and safe areas. — verified (see progress.md)
- [x] Report which acceptance journeys were exercised, in which environment. — verified (see progress.md)
- [x] List tests actually run and their results. — verified (see progress.md)
- [x] Identify anything blocked or unverified, especially actual iOS/PWA behavior. — verified (see progress.md)
- [x] Confirm preservation of original logo/media master, user data, and scientific calculations, or disclose any intentional approved change. — verified (see progress.md)
- [x] Provide remaining issues in priority order rather than claiming unsupported perfection. — verified (see progress.md)

**Definition of done:** the app enters reliably, presents truthful state, makes destinations and actions understandable, and feels visually coherent across main pages and overlays. The preferred brand richness remains; avoidable confusion does not.
