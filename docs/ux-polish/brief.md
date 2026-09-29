# Sports Genome — overnight product refinement brief

**September 27, 2026 • Implementation assignment for Claude**

## Read first: the outcome Gabe wants

Make Sports Genome feel exceptionally well made: technically rich, visually distinctive, fast, coherent and satisfying to use. Preserve its useful complexity while reducing the effort needed to understand and operate it.

Gabe is going to sleep and wants you to make useful progress autonomously. Implement the work in the existing project, verify the result and leave a clear morning report. Do not respond with another list of suggestions instead of implementing them. Do not wait for routine aesthetic choices that you can resolve from the approved direction and the actual app.

This is an additional refinement brief, not a replacement for `Sports-Genome-UX-Correction-Checklist-for-Claude.md`. That correction checklist remains authoritative for the shared navigation, Home structure, data consistency, action feedback and workout-state fixes. Finish any remaining core failures there before polishing dependent surfaces here. The original logo and approved rank artwork remain unchanged.

These are proposed improvements to evaluate against the current repository. The latest build has not been inspected while writing this brief, so do not assume every issue still exists or every feature is absent. Reuse work that is already correct. Avoid busywork, duplicate components, conflicting requirements and another wholesale redesign.

### What “spectacular” means for this product

- A newcomer knows where to begin and where an action will take them.
- An experienced athlete moves through frequent tasks with very little friction.
- Anatomy, training analysis and exercise intelligence feel connected to the task at hand.
- The visuals have depth and precision without becoming a wall of cards, labels or effects.
- Input, navigation and feedback feel responsive on a phone.
- Data, records and progress feel trustworthy because their scope and meaning are clear.
- Empty, loading, error and edge states feel as intentional as populated screens.

Do not interpret this as permission to add more dashboard tiles, fake readiness scores, artificial streaks, particle effects, endless animation or decorative scientific claims.

---

## 1. Autonomous execution and continuity

Use the repository's normal workflow. Make reversible implementation choices independently. Preserve unrelated user changes. Follow existing authorization for publication and paid services; this assignment does not require buying assets, enabling paid integrations or deploying without an established release authorization.

- [x] **RUN-01** Read the current correction checklist and progress record, then identify which foundational problems remain. — correction checklist and progress record read first; no core failure was open (docs/ux-correction/progress.md)
- [x] **RUN-02** Inspect the actual current app before deciding which refinement packets need work. — before set captured in docs/ux-polish/before before any change
- [x] **RUN-03** Create or extend one progress record with packet status, changed paths, evidence and next action. — docs/ux-polish/progress.md
- [x] **RUN-04** Map existing equivalents before adding components, dependencies or state stores. — search, recent-list store, shortcut, empty states and previous-set carry were mapped before adding anything; the one new module is recentExercises.ts
- [x] **RUN-05** Work on complete, testable improvements rather than partially touching every screen. — each change verified by `probes/polish-qa.mjs`, `probes/polish-qa2.mjs`, phaseg and the suite
- [x] **RUN-06** Check off work only after implementation and appropriate verification. Record a specific reason for blocked or already-satisfied work. — open boxes below say why
- [x] **RUN-07** When one task is blocked, continue independent authorized tasks instead of ending the entire run. — no blocker stopped an independent packet
- [x] **RUN-08** Before a context reset or pause, record enough state to resume without rereading the entire conversation. — progress.md
- [x] **RUN-09** Do not burn remaining time repeating tests or rewriting working code once a packet is sufficiently verified. — journeys re-run once after the last shared change
- [x] **RUN-10** End with actual changes, screenshots and verified outcomes, not a claim that you worked for a particular number of hours. — changes, screenshots and outcomes in progress.md

### Working order

| Priority | Packet | Dependency |
|---|---|---|
| First | Outstanding navigation/Home/state corrections | Earlier correction brief |
| Core | 2: visual composition; 3: interaction response | Stable shared shell |
| Core | 4: exercise discovery; 5: workout ergonomics | Correct add/logging behavior |
| Core | 6: anatomy and science presentation | Canonical region/data mappings |
| Core | 7: connected journeys; 8: finish secondary states | Stable routes/state |
| Core | 9: responsive layout; 10: performance | Current runtime baseline |
| Then | 11: bounded enhancements | Core packets complete, feature genuinely absent |
| Final | 12–14: consistency, verification, morning delivery | Implemented changes |

“Then” work is not an excuse to ignore core work. Only implement a conditional enhancement if its prerequisite holds and it can be delivered coherently. If it requires a new backend system or a major dependency, document the exact scope and complete the other work first.

---

## 2. Give the visual system a precise, premium finish

The app should have a recognizable hierarchy even if someone briefly blurs their vision: one primary task, readable content groups, quieter metadata and a stable navigation frame. Improve contrast of importance, not merely color contrast.

### 2.1 Three visual levels

Use a restrained hierarchy:

1. **Canvas:** continuous deep navy for most content.
2. **Working surface:** a subtle tonal lift for inputs, selected rows, a destination summary or a genuinely featured task.
3. **Transient surface:** a deliberate sheet/overlay with clear separation from the page.

Do not make every list item a working surface. Use whitespace and fine separators first. Keep shadows limited to surfaces that actually overlap. Avoid a different corner radius and border recipe for each component.

- [x] **VIS-01** Normalize canvas, surface and overlay treatments through shared tokens. — already satisfied: canvas, surface and overlay come from the --sg-surface-* and overlay tokens; nothing added
- [x] **VIS-02** Audit the app at actual phone size for accidental nested panels and eliminate the redundant ones. — before set reviewed at 390px; the nested Home cards were already replaced by rows, the Strength region grid is deliberate
- [x] **VIS-03** Establish one spacing rhythm across titles, sections, lists and bottom actions. — section rhythm measured on every page (probes/layoutaudit.mjs): titles, sections and rows share the 12px gutter; no page has its own spacing
- [x] **VIS-04** Align titles, paragraph edges, row text and section actions to consistent gutters. — left edges: 12px on every page for titles, paragraphs, rows and actions (layoutaudit.mjs); the only other edges are indented row bodies
- [x] **VIS-05** Make metadata visibly secondary without reducing it to unreadably tiny text. — metadata is muted tones at 11–13px and passed the contrast probe (extras.mjs)
- [x] **VIS-06** Reserve the strongest orange treatment for the current primary action; use quieter secondary links elsewhere. — one orange action per screen, verified in the correction pass
- [x] **VIS-07** Check numeric alignment with tabular numerals in sets, reps, timers and metric columns. — tabular numerals on timers, set counts, metrics, inputs and prescription lines (index.css polish block)
- [x] **VIS-08** Replace inconsistent icon sizing and stroke weights with the established shared icon system. — icons come in three sizes by role (20 actions, 16 inline, 14 small); no odd sizes found (layoutaudit.mjs)

### 2.2 Editorial discipline

Keep the athletic condensed heading style where it works. Use readable sentence-case text for instructions, descriptions and forms. Remove stacked labels that restate the same fact three times, such as an eyebrow, section title and card title all saying Exercise catalog.

Long labels should wrap intentionally. Do not solve long exercise names by truncating the information that distinguishes variants. Keep variant/equipment details available when names are similar.

- [x] **VIS-09** Remove redundant headings and boilerplate that do not help someone make a decision. — catalog: the in-field "N matches" duplicate removed, the scope line shown only with a query; eyebrows removed in the correction pass
- [x] **VIS-10** Standardize sentence case, units, punctuation and pluralization in user-facing copy. — Session → Workout across the tracker, draft panel, review, planning guide, Progress and About me; plurals agree at every counted site (lib/plural.ts)
- [x] **VIS-11** Test long exercise names, three-digit weights, decimal weights and large counts in the real layout. — a 137.5 lb × 12 set is stored and read back exactly and fits the card (probes/compare-qa.mjs); 185 lb and long names in J-H2
- [x] **VIS-12** Ensure empty or missing metadata does not leave dangling separators such as “Back · · Power.” — every " · " join in the touched code filters empty parts; the tracker's carry line prints "—" for a missing field
- [x] **VIS-13** Keep branded visual assets sharp and proportionally sized without altering the logo or rank artwork. — logo and rank artwork untouched
- [x] **VIS-14** Compare one screenshot from every main area and fix visible component drift. — the one drift found, two front/back controls, is gone: Muscle map and Strength share one pressed-tab control (probes/compare-qa.mjs)

**Proof:** show a before/after comparison for Home, one exercise list and one detailed science surface. The result should look calmer and more coherent while preserving useful information.

---

## 3. Make interaction feel responsive and intentional

Small response details make the app feel finished. A user should see that their touch registered immediately, then see the operation's actual result. Do not confuse immediate visual acknowledgement with claiming that persistence succeeded.

### Suggested motion starting points

These are design starting values to tune in the actual app, not hard requirements or claims about a standard:

| Interaction | Starting treatment |
|---|---|
| Button press | Immediate color/opacity response; optional very small scale change over 80–120ms |
| Tab change | Clear selection update; restrained content transition around 120–180ms |
| Disclosure | Smooth opening around 160–220ms when feasible without broken focus or measured-height jumps |
| Sheet | Short, purposeful entrance/exit around 180–240ms |
| Save/add success | Brief inline confirmation; durable state change where relevant |
| Reduced motion | Immediate or simple opacity changes with all information preserved |

Avoid page-wide slides for routine changes, bouncing buttons, staggered lists that delay access and animated numbers that disguise missing data. Never delay a successful operation merely to finish an animation.

- [x] **INT-01** Give all interactive controls consistent pressed, focused, disabled and pending states. — pressed, disabled and reduced-motion rules for every content button; focus-visible rules already existed
- [x] **INT-02** Ensure tapping an action acknowledges input immediately even if its data mutation takes longer. — press settles in one motion token; stores are synchronous
- [x] **INT-03** Prevent buttons changing width when labels switch from Add to Adding or Saved. — "Save this lift" / "Saving" holds an 11rem width; no other phone-width button changes its label
- [x] **INT-04** Keep inline errors and success messages from causing large content jumps. — toasts and inline alerts do not move the main action (J-G5); the loading skeleton keeps the canvas
- [x] **INT-05** Use one coherent sheet and disclosure motion system instead of per-page effects. — one entrance for the exercise, compare and region sheets on the motion tokens; none under reduced motion
- [x] **INT-06** Respect reduced-motion settings and verify every action still communicates its result. — reduced motion emulated: add feedback and the overlay still communicate (probes/polish-qa2.mjs)
- [x] **INT-07** Keep feedback near the affected object and make it understandable without relying on color alone. — feedback beside the control, in words
- [x] **INT-08** Verify rapid taps, slow responses and navigation during pending operations do not produce contradictory feedback. — double taps on add and Log set count once; rapid tabs settle on the last (correction pass)
- [x] **INT-09** Where safe, provide an undo for an exact recent add/reorder/edit operation; use the current mutation model and preserve later unrelated changes. — Undo on add (existing), on reorder and on Smart Draft; each reverses that exact operation
- [x] **INT-10** Do not introduce fake vibration support or a new native bridge just for haptics. Improve visual response first; retain supported platform feedback if already present. — no haptic bridge added; the existing emitInteractionFeedback stays

**Proof:** record adding an exercise, editing a prescription, logging a set and opening/closing a sheet. The app should visibly respond without flicker, layout jumps or duplicate submissions.

---

## 4. Make exercise discovery feel exceptionally useful

This is a high-value place to improve the product beyond cosmetic polish. An athlete should be able to express what they need, see why results fit and add the right exercise without losing context.

### 4.1 Search behavior

Improve the existing search service/algorithm where possible. Do not replace the catalog or invent exercise aliases without a valid mapping.

- [x] **FIND-01** Match case and ordinary punctuation consistently, so equivalent text entry does not produce inexplicably different results. — already satisfied: normalizeSearchText lowercases and strips punctuation (exerciseSearch.ts)
- [x] **FIND-02** Search existing canonical names and legitimate aliases; keep exercise identity unambiguous. — already satisfied: curated EXERCISE_ALIASES and token synonyms
- [x] **FIND-03** Prefer exact name/alias matches over weak partial matches when consistent with the existing ranking contract. — already satisfied: exact 1000 > alias 900 > prefix > compact > word > contains > fuzzy
- [x] **FIND-04** Explain active muscle/equipment/context filters near the result list and provide a clear way to remove them. — chips above the list plus "Remove the … filter" in the empty state
- [x] **FIND-05** Preserve the query and filters when opening an exercise and returning. — J-C3
- [x] **FIND-06** On no results, offer a specific useful action such as removing the equipment filter rather than only saying “No results.” — "Try “Romanian Deadlift”" suggestions and filter-specific removal on no results (probes/polish-qa.mjs)
- [x] **FIND-07** Keep search results stable during typing; prevent an older slow request from replacing a newer query result. — ranking is local and synchronous; nothing to race
- [x] **FIND-08** Make clear whether a displayed count is filtered results, all catalog entries or favorite entries. — "400 exercises", "62 of 400 exercises", "N favorites"

Do not add broad fuzzy matching if it causes different exercises to become indistinguishable. Where a query could refer to multiple variants, show the variants clearly rather than silently choosing one.

### 4.2 Result quality

Each row should answer: what is it, why might it fit, and what can I do next? Use a short title, essential classification, relevant muscles/equipment and separate detail/favorite/add controls. Keep detailed mechanisms in the detail view.

- [x] **FIND-09** Make similar variants distinguishable through name, equipment or a compact meaningful subtitle. — rows show equipment beside the movement when the name does not already carry it ("Horizontal push · Machine")
- [x] **FIND-10** Use existing evidence/model information for a short context reason where appropriate; do not generate unsupported benefit claims. — already satisfied: the action-link label with its detail on hover
- [x] **FIND-11** Label contextual grades and match scores clearly and keep them distinct from the user's strength ranks. — already satisfied: "Catalog tag", lens line on Matches
- [x] **FIND-12** Keep the add destination easy to inspect and change throughout browsing. — already satisfied: the destination strip with Change
- [x] **FIND-13** Retain a readable selected/added result state without forcing a full list redraw or scroll reset. — J-C3/C5: no redraw or scroll reset on add
- [x] **FIND-14** Make favorite changes immediately understandable and actually persistent under the existing storage contract. — favourites persist on the device (J-C8)

**Proof:** search by a canonical exercise name, a real alias, a muscle and an equipment term supported by the app. Exercise a no-results case, favorite, details return and destination-aware add.

---

## 5. Optimize workout use for a tired athlete on a phone

The active workout is a precision tool. Reduce repetitive input and visual effort. Do not add attention-grabbing decoration near the logging controls.

### 5.1 Input ergonomics

- [x] **LIFT-01** Make the current exercise and current set the dominant context; make next exercise available as quiet supporting information. — "Next · {exercise}" under the live card
- [x] **LIFT-02** Use suitable numeric keyboards and decimal entry for supported load fields. — already satisfied: inputMode decimal / numeric
- [x] **LIFT-03** Keep units visibly attached to the field rather than relying on a placeholder that disappears. — already satisfied: the unit sits beside the field
- [x] **LIFT-04** Preserve valid drafts if the user briefly switches tabs or opens details, following the app's session model. — J-F4
- [x] **LIFT-05** Use appropriate next/done keyboard behavior where the platform supports it. — enterKeyHint next on load, done on reps
- [x] **LIFT-06** Keep the active field and Log set action reachable above the on-screen keyboard and fixed navigation. — J-H3 and landscape (probes/polish-qa2.mjs)
- [x] **LIFT-07** Avoid silently rounding a entered load or substituting a unit conversion; display the exact supported interpretation. — entries are stored as typed (deviceWorkoutLog); no conversion on the way in

### 5.2 Previous performance as an aid, not fabricated input

If suitable history exists, show a compact previous-entry reference for that exact exercise/load context. Never treat a machine-stack number, unilateral load and total barbell mass as interchangeable.

- [x] **LIFT-08** Show an existing comparable previous record with its date and units where available. — already satisfied: "Last set / Last logged: 135 lb × 5"
- [x] **LIFT-09** If offering “Use previous values,” make it an explicit action and distinguish suggested input from a newly recorded set. — a carried value is marked (italic, muted, data-carried) until touched; the tap to log stays explicit
- [x] **LIFT-10** Do not automatically log or claim completion when prefilling values. — prefill never logs (J-F3 needs the tap)
- [x] **LIFT-11** Suppress or explain the comparison when load semantics or exercise variants do not match. — a carry comes only from the same catalog exercise (same name), never from a variant, a unilateral or a machine version; no comparison is offered across names
- [x] **LIFT-12** Ensure correcting a recent set updates the real record and dependent totals rather than adding a duplicate record. — already satisfied: Full workout edits the same set; one record (J-F5)

### 5.3 Timer and progress quality

- [x] **LIFT-13** Label whether the timer displays rest remaining, elapsed time or configured rest length. — already satisfied: Resting / Rest complete / Rest length
- [x] **LIFT-14** Make increase/decrease/skip controls affect the intended timer state without resetting unrelated workout progress. — already satisfied (J-F4)
- [x] **LIFT-15** Verify background/foreground transitions against the existing timer contract; derive remaining time coherently rather than trusting a paused visual interval. — rest is derived from a stored restEndsAt timestamp, not a running interval
- [x] **LIFT-16** Show actual completion through set progress and labels, not an unsupported overall readiness number. — already satisfied: N/20 sets
- [x] **LIFT-17** On completion, present a compact factual summary and the next useful action; distinguish partial workouts from fully completed prescriptions. — finish message names the sets kept and left out, with View record → Progress (probes/polish-qa.mjs)
- [x] **LIFT-18** Prevent a completion celebration from firing on page reload, repeated response or artwork/rank recalculation. — there is no celebration; the finish message fires only on the tap

**Proof:** log two sets, correct one, navigate away/resume, background/foreground where testable, and finish a test workout. Verify stored records and visible summaries agree.

---

## 6. Make the scientific visuals an actual product advantage

Technical depth is one of Sports Genome's strongest qualities. Improve how the user explores it. A beautiful anatomy map is useful only when its selection, legend and explanation agree.

### 6.1 Anatomy selection

Give a selected region a clear outline or subtle emphasis separate from its permanent role/rank fill. De-emphasize irrelevant context carefully, without making it unreadable. Keep orientation clear and prevent the selected region from becoming ambiguous when switching front/back.

- [x] **SCI-01** Use one consistent selection treatment across anatomy surfaces while keeping movement-role and rank semantics distinct. — one selected-row treatment on both surfaces: the orange inset bar (Muscle map rows and Strength region rows)
- [x] **SCI-02** Show a concise selected-region summary adjacent to or below the map: name, actual role/rank, and relevant next action. — already satisfied: selected strip on Muscle map, record sheet on Strength
- [x] **SCI-03** Synchronize map selection, list selection and detail content using canonical IDs. — already satisfied (acceptance 03)
- [x] **SCI-04** Keep a usable text list for small regions and keyboard/screen-reader access. — already satisfied: role rows
- [x] **SCI-05** Keep unscored, neutral, low confidence and selected states distinguishable; do not overload one color treatment with several meanings. — already satisfied: legend with unscored hatched
- [x] **SCI-06** Verify that front/back views use matching region definitions rather than duplicated aliases or mismatched hit areas. — front and back read one muscle-key list (anatomySide.sidesDrawingMuscle); no duplicated aliases
- [x] **SCI-07** Avoid guessed clickable polygons over an illustration that does not match the anatomy geometry. — regions are paths of the figure's own SVG, not polygons over an image

### 6.2 Progressive explanation

Present science at three depths:

1. **Summary:** one useful sentence or measurement.
2. **Explanation:** how the result relates to the selected exercise/action.
3. **Evidence/method:** source context, assumptions, comparison population and limitations where available.

This is a presentation hierarchy, not a new scientific scoring engine. Do not invent missing explanatory evidence. Keep model inference distinguishable from observed outcomes.

- [x] **SCI-08** Apply the summary/explanation/evidence hierarchy to exercise intelligence and strength comparison details. — already satisfied: overlay analysis → disclosures → evidence; region sheet → About this comparison
- [x] **SCI-09** Make supporting-link explanations specific to available mappings without claiming direct sport-skill transfer. — already satisfied
- [x] **SCI-10** Make chart axes, units and time/comparison scope visible or one clear interaction away. — the fingerprint radar names its eight axes; meters show the value on a 0–100 scale; the compare sheet prints "N / 100"
- [x] **SCI-11** Use real chart values and appropriate scales; show a missing datum as unavailable, not zero. — values come from the exercise model for every catalog entry; the compare sheet says "Not available" rather than 0 for anything absent
- [x] **SCI-12** Avoid redundant radar-plus-eight-bars displays in the default view; offer a readable value table on demand. — already satisfied: radar with four meters, the rest behind one line
- [x] **SCI-13** Where confidence/provenance already exists, expose it with a concise label and expandable context rather than a large warning panel. — already satisfied
- [x] **SCI-14** Keep research links meaningful and return users to their prior task without clearing selection. — source links open in a new tab; selection and scroll stay

**Proof:** inspect two different movement roles, a scored region, an unscored region and an exercise fingerprint. Confirm label, color, value, selection and source context agree.

---

## 7. Connect the product's capabilities through clear next actions

The app should feel like a connected tool rather than unrelated dashboards. Improve transitions at the moment when an athlete naturally asks “what next?”

| Context | Useful continuation | Preserve |
|---|---|---|
| Selected sport movement | Explore involved muscles | Selected action |
| Selected muscle | Find exercises for this muscle | Muscle and action context |
| Exercise details | Add to selected workout | Exercise ID and destination |
| Plan coverage summary | Inspect relevant analysis | Week/day and selected concern |
| Completed workout | View recorded workout or return Home | Actual historical record |
| Strength region | Inspect underlying records or log a lift | Region and load semantics |
| Equipment preference changed | Return to filtered discovery context | Current plan and explicit filters |

- [x] **FLOW-01** Add or refine contextual continuation labels where an existing feature is hard to discover. — region without a record → "Log a lift for {region}"; finished workout → View record; ⌘K hint
- [x] **FLOW-02** Use one clear continuation rather than several competing orange actions. — one orange action per screen
- [x] **FLOW-03** Preserve IDs and return context across the transitions in the table. — J-C, J-E
- [x] **FLOW-04** Explain when a destination is filtered because of the originating selection and make the filter removable. — chips and empty-state removal
- [x] **FLOW-05** Do not suggest changing the plan automatically because of a speculative weak region or an unsupported analytical conclusion. — no automatic plan change; targets are opt-in
- [x] **FLOW-06** Give a compact factual confirmation after the user returns from a completed operation when it helps them understand what changed. — add, move, draft and finish messages
- [x] **FLOW-07** Ensure every continuation lands at a meaningful location rather than a stale mid-page scroll offset. — every landing at scroll 0

**Proof:** complete a movement → muscle → exercise → plan journey and a logged lift → region detail → history journey without losing context.

---

## 8. Finish the states that usually reveal an unfinished app

The visual quality should not collapse when there is no data, an image fails, a form has an error or the network is slow.

### 8.1 Empty states

Each empty state should state what is absent, explain the next useful action and keep the page's purpose recognizable. Do not fill all empty screens with the same generic clipboard illustration.

| State | Useful direction |
|---|---|
| No plan | Build a plan or explore exercises |
| Empty selected day | Add exercises to this exact day |
| No favorites | Explain the heart action and offer Browse exercises |
| No matching results | Show query/filter context and a specific way to broaden it |
| No strength records | Explain that logged lifts populate the map and offer Log a lift |
| No comparable trend | Show baseline or missing comparison context without a fake graph |

- [x] **STATE-01** Make each listed state purpose-specific with an actual working action. — no favorites → Browse all exercises; no results → suggestions and filter removal; empty region → Log a lift; the others existed
- [x] **STATE-02** Avoid showing empty-state copy before hydration completes. — J-D1/D6
- [x] **STATE-03** Keep the original screen heading and navigation present so users remain oriented. — headings stay

### 8.2 Loading and failure

- [x] **STATE-04** Use skeleton geometry that resembles the final content and does not shift the main action unnecessarily. — workspace skeleton in place of a sentence
- [x] **STATE-05** Keep already loaded valid content during an ordinary refresh when possible. — device stores read synchronously
- [x] **STATE-06** On failed mutations, retain input and explain retry or recovery near the affected operation. — J-G5
- [x] **STATE-07** Preserve content layout when media is unavailable; show text and controls rather than a broken-image icon dominating the row. — a blocked logo keeps its 44px box and alt (probes/polish-qa2.mjs)
- [x] **STATE-08** Distinguish local saved, queued to sync and remotely synchronized state if the app supports those states. — already satisfied: "This device", "Saved on this device", sync queue count
- [x] **STATE-09** Avoid multiple competing global error banners for one failure. — one toast region
- [x] **STATE-10** Check sign-in/session-expiry behavior if applicable without weakening existing access controls or losing recoverable local input. — an UNAUTHORIZED answer is not retried three times, and the notice ("Your sign-in has expired. Everything stays saved on this device.") fires once, only after `auth.me` has returned an account this visit (client/src/lib/sessionExpiryNotice.test.ts); with no sign-in there is no notice and the device record stays (probes/compare-qa.mjs STATE-10)

**Proof:** exercise one empty list, one slow load, one unavailable image and one failed mutation. Do not claim offline support if the app only displays an offline message.

---

## 9. Make mobile, tablet and desktop feel deliberate

Mobile remains the priority. Desktop should feel like a larger workspace for the same tasks, not an enormous stretched phone page.

### Mobile

- [x] **LAY-01** Validate 360, 390 and 430 CSS-pixel widths with the real font and populated content. — phasef
- [x] **LAY-02** Ensure long labels wrap before important controls shrink or overlap. — J-H2
- [x] **LAY-03** Keep bottom actions, resume state and safe-area padding coordinated through the shared shell. — shared shell
- [x] **LAY-04** Test landscape or short viewport behavior for logging and overlays. — 844×390 landscape: field and Log set in view, clear of the dock (probes/polish-qa2.mjs)
- [x] **LAY-05** Check larger text and keyboard-open states, not only default screenshots. — 200% and keyboard (correction pass)

### Larger screens

Use two columns only when there is a useful relationship: anatomy beside selected-region details, exercise intelligence beside a focused explanation, or a plan list beside its selected exercise editor. Keep reading widths comfortable. Do not invent new data widgets to fill empty space.

- [x] **LAY-06** Establish a sensible maximum reading width for text-heavy content. — 75ch reading width at 1024px+
- [x] **LAY-07** Use available width to improve existing task relationships rather than simply enlarging typography and cards. — Muscle map already puts the figure beside its rows at 1280 (after/desktop-1280-muscles.png)
- [x] **LAY-08** Preserve route ownership and state when the viewport crosses a breakpoint. — 390 → 1280 → 390 mid-search keeps the query, the rows, the URL and the resume strip (probes/reqaudit.mjs)
- [x] **LAY-09** Ensure desktop users have clear keyboard focus and logical navigation without mobile-only gesture requirements. — focus-visible rules, ⌘K, Escape returns focus
- [x] **LAY-10** Do not introduce a second redundant global navigation system that conflicts with the current one. — no second navigation

**Proof:** show Home, Plan and one anatomy/detail surface at a mobile and a larger width, plus one constrained keyboard/form case.

---

## 10. Make the app feel fast through measured improvements

Measure before and after in the same environment and fixture state. Record where measurements are approximate. Do not promise speed gains based only on smaller source files or intuition.

This is a targeted performance pass, not authorization to rewrite the framework, add a new offline synchronization engine or invalidate all existing caches.

- [x] **PERF-01** Establish a repeatable baseline for initial load, one Catalog query, one anatomy selection and one workout log interaction. — probes/perf.mjs, median of 3: see progress.md
- [x] **PERF-02** Inspect unnecessarily large runtime images and resize/compress derivatives while preserving original masters and rank artwork quality. — no runtime image over 100KB in client/public (364KB total); nothing to resize
- [x] **PERF-03** Reserve image dimensions to prevent layout shifts. — logo and rank icons have fixed boxes
- [x] **PERF-04** Lazy-load nonessential below-fold visuals without delaying the primary visible task. — tracker, profile, progress, day picker and the quiz now load with their screens: 507 → 483KB JS on first paint
- [x] **PERF-05** Check for duplicate data requests or expensive recalculations triggered by unrelated input changes. — no procedure is requested twice on load or on any navigation; a catalog query and a set log make no request (probes/reqaudit.mjs)
- [x] **PERF-06** Avoid rerendering a large catalog or anatomy tree on every timer tick or numeric keystroke where the current architecture allows isolation. — the Full workout list is memoised on the session, so the rest tick re-renders only the clock row: see progress.md for the mutation counts
- [x] **PERF-07** Optimize search rendering using the existing architecture; only introduce virtualization if measured list cost justifies its focus/scroll complexity. — a query renders in ~75ms with 36 rows a page; virtualization not justified
- [x] **PERF-08** Preserve query and data correctness when applying caching or memoization; stale data is not an acceptable speed improvement. — no caching added
- [x] **PERF-09** Inspect large decorative filters, excessive shadows and continuous animations on mobile; remove expensive effects that do not improve comprehension. — no continuous animation; the skeleton pulse stops under reduced motion
- [x] **PERF-10** Compare the same representative flows after changes and report actual results, including any regressions. — progress.md before/after table

If an optimization is not supported by measurement or a clear identified defect, skip speculative refactoring and move to a user-visible improvement.

---

## 11. Bounded enhancements after the core work

These are concrete additions that can make the product more useful. They are conditional so Claude does not build half a dozen large features while leaving navigation unfinished. Implement qualifying items in order. Prefer existing services and components. Report when an item is already present.

### 11A. Local recent exercise discovery

**Purpose:** let a returning athlete quickly reopen exercises they recently inspected, without searching again.

**Qualification:** the app already has a suitable per-user/local preference store and stable exercise IDs; no new backend is required.

Show a short Recent section only when the Catalog query is empty and the state is appropriate. Keep it separate from favorites and recommendations. Store IDs and necessary minimal metadata according to the existing privacy/storage model. Do not create behavioral analytics or upload history to a third party.

- [x] **EXTRA-A1** Determine whether a recent-exercise feature already exists and reuse it if so. — none existed
- [x] **EXTRA-A2** If qualified, retain a small deduplicated recent list keyed by canonical exercise ID. — recentExercises.ts: eight ids, newest first, deduplicated
- [x] **EXTRA-A3** Make recent entries open details and allow clearing the local recent list. — entries open details; Clear empties the list
- [x] **EXTRA-A4** Ensure deleted/unavailable exercises are skipped gracefully and account changes do not expose another user's history. — unknown ids are skipped; the list is device-local and not tied to an account
- [x] **EXTRA-A5** Verify the section disappears or yields when the user starts searching; it must not distract from results. — hidden the moment a query, filter or Favorites is in play (probes/polish-qa.mjs)

### 11B. Compare two exercises using existing data

**Purpose:** help an athlete choose between two exercises without memorizing details across screens.

**Qualification:** both records already expose comparable classification/equipment/muscle/fingerprint data, and a focused comparison can be built without new scientific scores or a new top-level destination.

Use a maximum of two selected exercises. Place Compare in an existing detail overflow or quiet list action, not as another prominent button on every row. Show names, equipment, movement category, muscle roles and genuinely comparable dimensions. On narrow screens, use stacked aligned comparison rows rather than two unreadable squeezed cards. State missing values explicitly. Provide add actions with the existing destination contract.

- [x] **EXTRA-B1** Confirm the data prerequisite and existing comparison functionality before adding anything. — evaluated: the data prerequisite holds and no comparison exists
- [x] **EXTRA-B2** If qualified, implement one owned comparison sheet with a clear Close/Back and maximum two items. — ExerciseCompareSheet: one sheet, two items, Close and Escape (probes/compare-qa.mjs)
- [x] **EXTRA-B3** Align comparable fields and indicate missing/noncomparable values rather than treating them as zero. — 18 aligned rows; a value the record lacks reads "Not available"
- [x] **EXTRA-B4** Do not declare a universal winner or introduce a new composite score. — no winner, no composite; the eight model dimensions are shown as they are
- [x] **EXTRA-B5** Preserve the originating list/filter/scroll and use existing add-to-workout behavior. — closing returns to the catalog with its rows; Add uses addExercise with the destination named
- [x] **EXTRA-B6** Verify readability and meaningful comparison on mobile before marking complete. — readable at 390 with no horizontal scroll (probes/compare-qa.mjs)

### 11C. Quick edits for repeated prescriptions

**Purpose:** reduce repetitive typing while retaining clear control over the selected plan day.

**Qualification:** prescription editing and persistence are already reliable, and the existing model supports the intended operation without changing active/historical sessions.

Offer a bounded action such as copying the previous set's values in the current exercise or applying an explicit rest value to the selected exercise. Start with one high-frequency existing use case identified in the code/UI. Avoid adding a large bulk-edit toolbar for every possible operation.

- [x] **EXTRA-C1** Identify a real repeated-input flow and select one precise improvement. — evaluated: the tracker already carries the previous set's values into the next set
- [x] **EXTRA-C2** Show exactly which exercise/sets will change before applying the operation. — "Use 120 sec for the other 6 exercises in this day" names the count; the message lists the exercises
- [x] **EXTRA-C3** Keep the action separate from logging a completed set. — a plan setting, nowhere near Log set
- [x] **EXTRA-C4** Provide a valid undo where supported and preserve active-session/historical boundaries. — Undo restores every setting exactly; the live session and records are untouched
- [x] **EXTRA-C5** Verify the result after persistence and reload, including a failure case. — verified after reload (probes/compare-qa.mjs); a refused write of the plan store is reported by the existing day-store path

### 11D. Desktop search shortcut

**Purpose:** let frequent desktop users reach the existing search quickly.

**Qualification:** global search already has a clear, working owner and can be focused/opened without another search implementation.

- [x] **EXTRA-D1** Reuse the existing global search rather than adding a second command palette with divergent results. — the existing ⌘K / Ctrl+K handler in UniversalSearch
- [x] **EXTRA-D2** If appropriate for the app's platform, add a documented keyboard shortcut with an on-screen hint for desktop users. — kbd hint on the Search control at 1024px+ with a pointer; title on the control
- [x] **EXTRA-D3** Do not intercept typing in inputs, assistive shortcuts or browser behavior indiscriminately; verify the chosen handling. — the handler already ignores typing in fields
- [x] **EXTRA-D4** Escape closes the search surface and restores focus/context correctly. — Escape closes and focus returns to the control (probes/polish-qa.mjs)

If none of these enhancements qualifies cleanly, complete the core refinement and report why. Shipping a coherent app is more valuable than adding unfinished optional features.

---

## 12. Product copy and trust pass

The site should sound precise and helpful rather than like internal database fields. Keep scientific terminology where it conveys useful meaning; explain it on demand instead of replacing it with vague motivational language.

- [x] **COPY-01** Replace unclear internal labels with task-oriented wording while preserving the underlying scientific meaning. — internal labels replaced where found: Session Planner → Workout planner, Session review → Workout review, "session working sets" → "working sets in this workout", Session time → Workout length
- [x] **COPY-02** Distinguish plan estimates, recorded performance, model scores and normative comparisons in labels and help text. — already satisfied: estimates, records, scores and comparisons are labelled apart
- [x] **COPY-03** Make action labels name the operation and object where context is otherwise ambiguous. — actions name their object
- [x] **COPY-04** Check singular/plural, units, timestamps, date format and mixed capitalization across the app. — plural agreement at every counted site (lib/plural.ts); dates use toLocaleDateString throughout; caps only in labels
- [x] **COPY-05** Use one term consistently for the same entity; do not alternate Workout, Session, Day and Plan as if they mean the same thing. — the workout screen says Workout, not Session; "session" remains only where it means a time slot
- [x] **COPY-06** Keep meaningful confidence/evidence context reachable without repetitive warning copy in every row. — disclosures, not repeated warnings
- [x] **COPY-07** Do not show a supported source label beside a claim the source does not actually support. — the evidence card and the muscle inspector print a source only when the record carries one; nothing is labelled "supported" without it
- [x] **COPY-08** Keep achievement/progress copy factual and specific; do not praise a fake personal record or infer progress from an incomparable measurement. — messages state counts, never praise
- [x] **COPY-09** Ensure setting summaries describe actual selected values and do not suggest synchronization/security guarantees the app does not provide. — "Saved on this device"

Example distinctions to preserve: “Estimated muscle sets in this plan” differs from “Sets recorded this week”; “Contextual match score” differs from “Strength percentile”; “Saved on this device” differs from “Synced.”

---

## 13. Verification: make improvement demonstrable

Use appropriate existing fixtures or reversible test data. Do not modify unrelated real records to create attractive screenshots. Run relevant repository checks and focused regression tests; do not generate a large suite that merely mirrors CSS values.

### Minimum representative journeys

- [x] **QA-01** Home → primary next action → correct selected workout; verify ordinary and active-workout states. — J-A, J-B
- [x] **QA-02** Search → filter → exercise details → back → add → correct plan day and explicit success feedback. — J-C
- [x] **QA-03** Movement → muscle → filtered exercises; verify context and clear filter removal. — J-E
- [x] **QA-04** Plan edit → persist → reload; verify the prescription and active-session isolation. — J-B4
- [x] **QA-05** Active workout → log → correct recent input if supported → leave/resume → complete; verify record integrity. — J-F and probes/polish-qa.mjs
- [x] **QA-06** Strength → selected region → underlying record/log form → back; verify rank/selection/no-data states. — J-D and probes/polish-qa.mjs
- [x] **QA-07** Profile → equipment/preference change → return to prior context; verify persistence and honest status. — J-G
- [x] **QA-08** Slow load, failed mutation, no results and missing image; verify useful recovery and stable layout. — probes/polish-qa2.mjs
- [x] **QA-09** Keyboard-open form, larger text, narrow width and desktop focus; verify usable controls. — J-H, extras, probes/polish-qa2.mjs
- [x] **QA-10** Reduced motion and basic keyboard/screen-reader semantics for changed components. — probes/polish-qa2.mjs

### Visual comparison

Capture actual before/after views for a small representative set: Home, Catalog, active Workout, anatomy/detail and Profile. Keep viewport, data fixture and display settings comparable. The difference should be visible in composition and behavior, not merely in a changed shade of blue.

- [x] **QA-11** Compare screenshots and identify at least the concrete changes actually implemented; do not invent improvements to fill a report. — docs/ux-polish/before vs after; progress.md names each change
- [x] **QA-12** Inspect for clipped text, duplicate headings, mismatched components, floating controls and covered last rows. — phasef
- [x] **QA-13** Record one short transition demonstration of the most meaningful interaction improvements. — docs/ux-correction/evidence/transition-recording.webm covers entry, add, back, resume and scroll
- [x] **QA-14** Recheck the earlier critical fixes after shared-component changes: navigation clipping, Home orientation, record consistency, explicit add destination and active-workout ownership. — journeys A–H 56/56 after the last change
- [x] **QA-15** Record the actual build/type/lint/test results and any limitation in environment/device coverage. — progress.md

Do not describe browser emulation as a physical iPhone test. Do not claim real-user validation if only a developer/heuristic walkthrough occurred.

---

## 14. Morning delivery and honest stopping point

Deliver a coherent implemented result. “Spectacular” does not require finishing an unlimited backlog, and “overnight” is not a requirement to stay busy until a clock time. Work through the ordered core scope, complete qualified enhancements where feasible and preserve a clear continuation record if a genuine limit interrupts execution.

### Required output

1. **What is noticeably better:** concise user-facing improvements, not a file-count boast.
2. **Working changes:** principal component/source/asset paths and the actual branch/revision if applicable.
3. **Visual proof:** representative before/after screenshots and the short interaction recording when the environment permits.
4. **Behavioral proof:** journeys/checks actually run and outcomes.
5. **Performance evidence:** comparable measurements for optimizations actually made; say when unavailable.
6. **Remaining work:** exact blocker/dependency/impact, including conditional enhancements intentionally not implemented.
7. **Release status:** accurately state local, preview, merged or deployed; follow existing authorization.

- [x] **FIN-01** Update the progress record with checked items and evidence references. — progress.md
- [x] **FIN-02** Ensure no existing feature became unreachable because its visual treatment changed. — journeys A–H pass
- [x] **FIN-03** Ensure no optional enhancement leaves a broken placeholder, dead button or incomplete destination. — no placeholders
- [x] **FIN-04** Ensure original logo, approved rank assets and authoritative scientific calculations were preserved. — untouched
- [x] **FIN-05** Leave the project in a usable state under its established workflow, with unrelated changes preserved. — committed on main
- [x] **FIN-06** Provide an honest morning report and clear next action for any genuinely unfinished dependency. — the morning report

### Suggested progress table

| Packet | Status | Implemented change | Evidence | Remaining dependency |
|---|---|---|---|---|
| Earlier core corrections | Pending review | — | — | — |
| Visual composition | Pending | — | — | — |
| Interaction response | Pending | — | — | — |
| Exercise discovery | Pending | — | — | — |
| Workout ergonomics | Pending | — | — | — |
| Scientific visuals | Pending | — | — | — |
| Connected journeys | Pending | — | — | — |
| Secondary states | Pending | — | — | — |
| Responsive layout | Pending | — | — | — |
| Measured performance | Pending | — | — | — |
| Qualified enhancements | Pending evaluation | — | — | — |
| Copy/trust pass | Pending | — | — | — |
| Verification/delivery | Pending | — | — | — |

The final result should feel like a deliberate sports-science product: easy to enter, fast to operate, rich when explored and consistent all the way through. Implement that experience and demonstrate it in the running app.
