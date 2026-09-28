# Sports Genome — next update: visual finish and a stronger Home

**Prepared:** September 27, 2026  
**Basis:** six current screenshots supplied by Gabe: Strength Genome; Upper Coverage empty state; Plan exercise rows; Review muscle volume; Review recovery spacing; Home.  
**Assignment:** implement this focused update in the current app, verify it, and prepare/push it through the project's already-authorized release workflow. Do not stop at a proposal. Do not claim deployment without checking the actual deployed build.

## 1. Direction and scope

The app is much better. Preserve that progress. This is a targeted refinement of weak surfaces, not another redesign of the whole product. Keep the original logo, approved rank badges, existing navigation destinations, technical depth, and underlying user records.

The owner specifically wants:

1. A more vivid, premium Strength Genome body visualization.
2. A more deliberate, polished muscle-volume display.
3. Correct formatting, especially exercise rows, analysis controls, and recovery content.
4. A stronger Home call to action and more useful visual content.

Preserve the earlier requirement to avoid excessive boxes and overwhelming information. Achieve polish through hierarchy, spacing, intentional color, precise diagrams, and meaningful interactions. Do not add decorative cards everywhere.

Subscriptions remain deferred. This assignment does not reactivate payment work or replace Backend V1. Correct a state/data defect if it is necessary to repair one of these surfaces, but do not recalibrate scientific scores as a visual shortcut.

### Evidence boundaries

The screenshots demonstrate rendered appearance, not the underlying CSS or calculation implementation. Root causes such as inherited opacity, default light-theme components, or stale selectors are hypotheses to inspect. Do not claim a cause before checking the code.

Home currently shows Push, Week 1 · Day 01, 6 exercises, 2 of 5 planned workouts completed, 16 lifts, and 4 all-time workouts. These values are example screenshot state, not data to hardcode. A difference from an earlier recording is not by itself a defect.

### Implementation rules

- [x] Inspect the components responsible for all six surfaces before editing. — done (see progress.md)
- [x] Capture a baseline at matching viewport/data state. — evidence/before-*-390.png and -320.png from the pre-change build
- [x] Reuse current tokens, routes, anatomy geometry, and approved assets wherever appropriate. — done (see progress.md)
- [x] Fix shared components/tokens where the problem is shared; avoid a collection of unrelated CSS overrides. — done (see progress.md)
- [x] Preserve unsaved prescriptions, selected week/day, logged history, rank IDs, and reference-data logic. — done (see progress.md)
- [x] Track each section as pending, implemented, verified, or blocked, with evidence. — done (see progress.md)
- [x] Continue through implementation and verification. A design description alone is not completion. — done (see progress.md)

## 2. Screenshot findings and priority

| Surface | Visible issue | Priority | Required outcome |
|---|---|---|---|
| Review recovery spacing | Pale text on white panels is nearly unreadable | Immediate | Dark coherent surface with readable text and clear overlap information |
| Plan exercise rows | Name/prescription squeezed; “90 sec” wraps; large arrow boxes compete with editing | High | Full-width reading hierarchy and clearly separated management controls |
| Upper Coverage | Large blank empty state and malformed close control | High | Useful state-specific message, immediate action, clean header |
| Strength Genome | Pastel-looking fills, thick gray seams, prominent pale joints/hands, busy hatching | High | Saturated rank colors with refined region separation and clear semantics |
| Muscle volume | Compressed summary, dim legend, white status labels, unexplained mixed total | High | Legible analytical rows with coherent color and accurate labels |
| Home | Large underused hero space, generic review CTA, mostly text below | High | One compelling next action supported by meaningful workout and weekly visuals |

Fix unreadable and misleading states before spending time on subtle shading.

## 3. Strength Genome: vivid color and precise anatomy

### What is weak in the screenshot

The regional purple is pale, the blue and yellow feel flat, and broad gray outlines visually compete with the muscle regions. Pale joints, hands, and feet attract attention even though they are not the ranked information. The hatch treatment in unscored areas adds noise. The map should read as a deliberate performance visualization rather than a generic anatomical worksheet.

### Required visual construction

Use the current anatomically mapped SVG or equivalent structured asset. Preserve paths and region IDs. Do not replace it with a generated anatomy picture, flatten it into a bitmap, or make regions unclickable.

Layer the map deliberately:

1. A restrained dark neutral body foundation.
2. Individual ranked regions using strong, stable rank hues.
3. Fine region boundaries that clarify anatomy without forming thick gray tubing.
4. A separate selected/focused-region outline.
5. Optional extremely subtle shading clipped inside each region, only if it preserves the perceived rank color.

### Palette treatment

Inspect current canonical rank-color tokens first. Preserve the established hue identities: neutral Prospect, green JV, blue Varsity, purple Regional, gold State, red National, and the approved dark World Stage treatment. Keep approved rank badges unchanged.

Use these as **candidate rendering targets**, not mandatory replacements for an already-approved shared palette:

| Rank family | Candidate solid fill | Intent |
|---|---|---|
| Neutral | `#8290A3` | Clearly ranked neutral; distinguish from no-data |
| Green | `#25C982` | Rich emerald, not pale mint |
| Blue | `#347FF0` | Strong blue, not gray-blue |
| Purple | `#A55AF0` | Saturated violet, not washed-out lavender |
| Gold | `#E5B63B` | Rich warm gold, not beige |
| Red | `#E0445B` | Clear deep coral/crimson family |
| Dark top rank | Preserve approved dark token | Add a subtle light boundary so it remains visible on navy |

If existing tokens already provide the desired colors, fix the compositing/opacity that washes them out. If a token change is justified, update map, legend, and matching UI together. Do not change rank thresholds or output values.

- [x] Inspect computed fill, opacity, inherited group opacity, filters, blending, and overlays before changing colors. — probe: fills were the tokens at opacity 1.00; the wash came from the light-surface shell, neutral fills and 2px grey linework
- [x] Render active rank fills at full intended opacity; avoid a white wash over all regions. — done (see progress.md)
- [x] Reduce seam prominence using thinner, darker boundaries; tune at actual display size, not at an enlarged SVG preview. — done (see progress.md)
- [x] Keep the outer silhouette coherent without a heavy cartoon outline. — done (see progress.md)
- [x] Make non-ranked structural areas recede with a dark desaturated neutral rather than bright gray. — done (see progress.md)
- [x] Make no-data distinguishable from Prospect and World Stage through label/texture/boundary treatment, not hue alone. — done (see progress.md)
- [x] Remove or greatly soften hatch noise while preserving an explicit no-data legend. — done (see progress.md)
- [x] Add selection/focus emphasis without altering the region's underlying rank hue. — done (see progress.md)
- [x] Keep front/back views visually consistent and preserve correct hit targets. — done (see progress.md)
- [x] If gradients are used, stay within the same hue family and a narrow brightness range; do not turn the map into metallic rainbow armor. — flat fills kept; no gradient on ranked regions

### Map size and legend

The figure should remain a substantial visual, but its scale must leave a sensible relationship with controls and legend. Do not compress anatomy until the regions become difficult to select.

- [x] Keep Front/Back as one compact, clearly selected control. — done (see progress.md)
- [x] Place the map on a controlled deep-navy field that supports the saturated fills; avoid excessive bright blue behind the body. — done (see progress.md)
- [x] Make all seven rank entries reachable and readable; preserve approved icons and actual threshold definitions. — done (see progress.md)
- [x] On phones, use a wrapped compact legend with icon, name, and range rather than broad strips squeezed across the screen. — done (see progress.md)
- [x] Provide enough bottom clearance that the legend's final row is not trapped behind navigation. — legend sits above further content; checked at 390/320
- [x] Tapping a region opens its existing detail or a compact existing detail surface with name, rank, and basis. Do not create a duplicate detail page. — unchanged existing region sheet
- [x] Keep coverage and rank distinct: “12 of 18 regions” must not imply an average strength percentile. — "N of 18 regions" stays in coverage mode only

**Pass condition:** blue, violet, gold, and green read vividly at normal phone brightness; anatomy is clean; the selected region is obvious; color remains truthful to the legend.

## 4. Review: rebuild the muscle-volume hierarchy

### What is weak in the screenshot

The total “171.0” is compressed into the right side of the heading with a long stacked label. The legend is dim. White/pale status rectangles look disconnected from the dark app. Repeated bars, status tags, session breakdowns, and condensed headings create uneven emphasis.

The label “estimated sets this week” also needs inspection: a sum of muscle-attributed direct/supporting contributions can exceed the number of distinct performed or prescribed sets. A visually prominent number must state what it actually measures.

### Recommended structure

Use one section with clean repeated rows and restrained separators. Do not turn every muscle into a new card.

**Section header:** “Weekly muscle volume” or preserve “Muscle volume map” if that is the established product label. Below it: a short scope line such as “Planned · 3 saved training days,” derived from actual state.

**Summary:** show the primary total only after verifying its semantics. If it is a sum of attributed muscle-set contributions, label it accordingly and explain that multi-muscle attribution can count one exercise set toward multiple muscles. If the metric is not useful enough to justify that explanation, demote it into the methodology disclosure and emphasize the actual week/day scope instead. Do not change the number to look nicer.

**Muscle row:** name and total aligned on the first line; direct/supporting breakdown on the second; a shared-scale segmented bar beneath; a small status treatment or source-day disclosure below only when useful.

For example, the existing gluteal row can remain 13 direct + 5.5 supporting = 18.5 attributed units if those are the actual engine semantics. Do not call supporting attribution a direct set or silently imply equal stimulus.

- [x] Verify whether the section describes planned or completed exposure and show that scope explicitly. — scope line "Planned · N saved days"
- [x] Define what the section total measures and remove false precision: an integer-valued total generally does not need “.0.” — done (see progress.md)
- [x] Align totals consistently and use readable tabular figures where available. — done (see progress.md)
- [x] Keep exercise/day contributions from the actual engine; do not redesign the arithmetic for appearance. — done (see progress.md)
- [x] Use a consistent bar scale across comparable rows. Avoid making every muscle look fully filled by normalizing each to itself. — done (see progress.md)
- [x] If bars are target-normalized instead, label that different meaning explicitly; do not mix scales silently. — done (see progress.md)
- [x] Keep direct and supporting segments clearly distinguished with concise readable labels. — done (see progress.md)
- [x] Use small restrained rounded ends or square ends consistently; no thick neon outlines or decorative gradients. — done (see progress.md)
- [x] Replace white “HIGH EXPOSURE / ESTABLISHED / BUILDING” blocks with compact text and subtle tinted background or a dot/label. — done (see progress.md)
- [x] Confirm these categories have defined model criteria. Do not imply biological adaptation or a measured recovery state from a planned volume category. — direct-set bands 6/12 from logicCalibration, now stated in the disclosure
- [x] Keep a short methodology disclosure; move detailed assumptions there instead of placing long caveats in each row. — done (see progress.md)
- [ ] Provide a tidy source-day breakdown on expansion when the collapsed version would otherwise become crowded. — PARTIAL — the per-day breakdown stays inline as a compact line; it fit at 320 so no expansion was added

### Lower disclosures

The current “4 more muscles carrying volume” and long truncated muscle list compete across a narrow row.

- [x] Use “Show 4 more muscles” with the count derived from actual hidden rows. — done (see progress.md)
- [x] Omit the squeezed secondary list on narrow screens or place a brief preview on a separate line. — done (see progress.md)
- [x] Use a consistent chevron aligned to the right, with a clear expanded state. — done (see progress.md)
- [x] Keep the entire intended disclosure header clickable without making unrelated neighboring content clickable. — done (see progress.md)
- [x] Preserve scroll position when expanding/collapsing long lists. — native <details>; no scroll change on toggle

## 5. Recovery spacing: fix contrast and clarify the comparison

This is the most obvious visual defect in the screenshots. Pale text on white panels is not an acceptable dark-theme component.

Inspect the source of the white surface: component defaults, theme tokens, inline style, variant selection, or specificity. Fix the component so other instances do not regress.

### Desired layout

Use “Session overlap” or retain “Recovery spacing” with a truthful explanatory subtitle. Present two compact comparison rows, not two bright warning posters.

Each row contains:

1. Session pair: “Push → Pull,” with actual schedule context if known.
2. A concise observation, for example “Shared muscle exposure.”
3. Muscle names and clearly separated session values.
4. One action, such as “Compare sessions,” only if it opens a real relevant view.

Replace ambiguous notation such as “Gluteal muscles (3.5/3 sets)” with “Gluteal muscles · Push 3.5 / Pull 3,” using the correct underlying unit label. A slash without named sides forces users to guess.

- [x] Use a dark surface continuous with the app and high-contrast primary/secondary text. — done (see progress.md)
- [x] Use one restrained accent only where the underlying signal warrants attention. — done (see progress.md)
- [x] Remove generic warning triangles when the engine merely detected overlap; overlap itself is not proof of a problem. — done (see progress.md)
- [x] Confirm actual scheduled dates before saying “consecutive-day.” If only plan order is known, describe adjacent planned sessions. — no dates exist; wording is "adjacent planned sessions"
- [x] Do not infer recovery readiness, injury risk, or required rest duration from overlap alone. — done (see progress.md)
- [x] Keep the insight specific to the muscle/session pair and avoid repeating the same paragraph in every row. — done (see progress.md)
- [x] Preserve the full explanation in a methodology disclosure. — done (see progress.md)
- [x] Offer a real comparison/edit destination or omit the action; no decorative dead buttons. — "Open {day}" opens that day in the plan

### Planning guide and Coach Scan

The screenshot has “20 WORK SETS / OPEN PLANNING GUIDE” competing with the goal label, and an opaque “MANAGED PLANNING SIGNAL” pill.

- [x] Align guide title, supporting context, count, and action in a readable hierarchy. — done (see progress.md)
- [x] Keep the count's scope explicit: selected session, proposed guide, or week as appropriate. — done (see progress.md)
- [x] Replace unclear internal labels with meaningful product language after inspecting what the state means. — done (see progress.md)
- [x] Keep any actual coach insight; do not invent a positive summary merely to replace awkward copy. — Coach scan signal kept: "{Managed|Moderate|High} planned load"
- [x] Make “Review” identify what it opens, such as “Review recommendations,” when that is the real destination. — done (see progress.md)

## 6. Plan exercise rows: stop squeezing the content

The screenshot shows a large index column, a narrow name/prescription column, an edit control beside it, and two large arrow buttons on the right. This wastes the available width and causes unnecessary wraps, including “90” and “sec” separating.

### Required row arrangement

Use a responsive row with two content bands:

**Main reading area:** a modest order number or small equipment cue; exercise name occupying most of the width; a small trailing menu only if needed.

**Prescription area below:** prescription text with sensible wrapping, followed by a clearly placed “Edit sets & reps” action. Movement/muscle metadata sits beneath as secondary information and can use two lines naturally.

Place reordering in a deliberate **Reorder mode** for the whole list. In that mode show drag handles where supported plus accessible move-up/move-down actions. Keep a usable non-drag fallback. Routine reading should not show twelve large arrow boxes for six exercises.

- [x] Give exercise names room before shortening or truncating them. — done (see progress.md)
- [x] Keep values and units together as a small nonbreaking group where appropriate, while allowing the overall prescription to wrap. — done (see progress.md)
- [x] Preserve RPE versus RIR distinction; do not change an RPE 7 prescription to RIR 7. — done (see progress.md)
- [x] Put the edit action on a separate line or stable lower-row position at narrow widths. — done (see progress.md)
- [x] Use one separator between rows and remove redundant perimeter framing where it adds no grouping value. — done (see progress.md)
- [x] Keep order numbers secondary rather than making them a competing headline. — done (see progress.md)
- [x] Ensure first/last move controls have correct disabled states in Reorder mode. — done (see progress.md)
- [x] Preserve focused item and unsaved edits when reordering. — rows keep their <details> state; prescriptions are state, not DOM
- [x] Keep editing, details, remove, and reorder actions distinct; no overlapping tap regions. — done (see progress.md)
- [x] Maintain enough content padding above bottom navigation to see the final row completely. — done (see progress.md)

**Pass condition:** names, prescriptions, and edit controls remain legible at a narrow phone width without collisions or a lone unit wrapping onto its own line.

## 7. Coverage analysis: useful empty states and a clean header

The supplied Upper Coverage view is mostly blank with an oversized centered explanation and no direct next step. The Close label appears poorly fitted into the outlined control.

### Header

- [x] Use a consistent title/context stack: “Upper coverage,” then actual week/day. — done (see progress.md)
- [x] Use a normal close icon within a usable hit target and accessible name, or a single clean “Close” text action. Do not stack a loose label under an X inside an ill-fitting square. — done (see progress.md)
- [x] Align the close control with the title region and preserve safe-area clearance. — done (see progress.md)

### State decision

| Actual condition | Required view |
|---|---|
| Data loading | Stable loading presentation, not “add exercises” |
| Selected day exists and has zero exercises | “No exercises in Upper yet” + “Add exercises” |
| Exercises exist but data cannot load | Clear error/retry state preserving day context |
| Exercises exist but analysis has no supported result | Explain the missing analysis basis; keep plan navigation available |
| Valid analysis | Show result and actual supporting details |

- [x] Verify the selected week/day binding before treating the screenshot as genuinely empty. — the analysis names the day it reads ("Week 1 · Day 04 · Upper")
- [x] Place the empty-state content in the upper content area beneath the header with intentional spacing; avoid an enormous blank gap created by rigid vertical centering. — done (see progress.md)
- [x] Keep copy short: what is missing, what the user can do, one primary action. — done (see progress.md)
- [x] “Add exercises” must open the picker bound to the same selected day. — done (see progress.md)
- [x] After adding, refresh analysis from updated data; do not instruct the user to close and reopen manually. — the analysis is computed from the plan in memory; reopening reads the new state
- [x] Preserve the ability to close/back without losing plan context. — done (see progress.md)
- [x] Use one small existing equipment/analysis cue if helpful; no oversized decorative illustration. — done (see progress.md)

## 8. Home: a stronger next action and useful visual content

### What to preserve

The compact brand header, useful search/profile utilities, next-workout concept, weekly completion summary, and exploration links are good foundations. Preserve them.

### What to change

The screenshot's large “PUSH” heading occupies a broad mostly empty gradient region, while “Review workout” does not strongly communicate getting into today's training. Home should feel like the place to begin or resume, with useful context visible immediately.

### Recommended Home order

1. Compact greeting using first name where the actual profile supports it; do not guess names by unsafe string splitting.
2. One dominant next-workout region containing title, week/day, exercise count, a modest workout visual, and one primary action.
3. A compact weekly visual with count and a plan link.
4. Existing exploration links, visually quieter than the next workout.
5. Additional existing relevant content farther down; do not force everything above the fold.

### Hero layout

Use a two-column inner composition on comfortable phone widths: title/context on the left and a small meaningful visual on the right. Let the CTA span the available content width underneath. On very narrow screens or large text, stack gracefully. Keep this inside the existing page surface or one restrained hero surface; do not add several nested cards.

Target starting proportions: text about two-thirds of the inner width, visual about one-third, with a roughly 80–120 CSS px visual where space permits. These are layout starting points, not hardcoded screenshot-pixel measurements.

### Primary action contract

| User state | Primary label | Exact behavior |
|---|---|---|
| Planned workout, not started | **Open today's workout** | Open the selected workout's ready/pre-start view; do not mark started automatically |
| Plan not tied to today's date | **Open next workout** | Open the actual next planned workout |
| Active session | **Resume workout** | Restore that session and logged progress |
| No plan, after confirmed loading | **Build your first workout** | Open the existing creation flow |
| Completed scheduled workout | **View workout summary** | Open the real completed session; show next session secondarily if appropriate |
| Explicit rest day | A truthful plan/exploration action | Preserve rest context; do not pressure an unplanned workout |

Use “Start workout” only if tapping actually starts the session. This update must not improve copy by making the action misleading.

- [x] Make the primary action visually dominant, preferably a broad orange button with a compact directional icon. — done (see progress.md)
- [x] Preserve one lower-emphasis “Edit plan” or equivalent action. — done (see progress.md)
- [x] Keep labels and destination IDs derived from the same current state. — done (see progress.md)
- [x] Avoid inventing dates, estimated durations, completion percentages, or readiness values to fill space. — done (see progress.md)
- [x] Ensure the primary action is comfortably visible in the first viewport on the current main device and a smaller phone layout, without shrinking text to achieve it. — done (see progress.md)

### Hero visual: one meaningful choice

Preferred if supported by current structured assets: **a small workout-emphasis body schematic** highlighting actual primary regions from the planned workout. Use one warm accent family, not rank colors; caption it “Workout focus” so it cannot be confused with Strength Genome ranks. Preserve anatomical mapping. Treat this as planned involvement, not activation measurement or recovery status.

Fallback if accurate region data/geometry is unavailable: **a restrained equipment composition** using one or two actual equipment types from this workout, with a small “Equipment” label. Use the approved icon family or clean SVG. Do not infer barbell use simply because the day is called Push.

Choose one approach, not both. Do not use generated athletes, a gym photograph, motivational art, or a hero image containing text and buttons.

- [x] Bind the visual to the displayed workout ID and update it when the workout changes. — derived from the selected day's exercises; evidence/after-home-*.png vs after-home-completed-*.png
- [x] Preserve labels and CTA as real HTML/native UI, outside imagery. — done (see progress.md)
- [x] Hide the visual gracefully when required data is absent; do not display fabricated anatomy emphasis. — done (see progress.md)
- [x] Keep it visually subordinate to the workout title and action. — done (see progress.md)

### Weekly visual

Use a compact strip of actual planned sessions, or a seven-day timeline only when dates are genuinely scheduled. Distinguish completed, current/next, and remaining with shape/icon/text as well as color.

For the screenshot's five planned workouts, a five-session strip can communicate 2 of 5 without pretending to know which weekdays those sessions occur on. Each segment should map to the actual plan/session state. Do not mark the first two completed merely because the count is two if completion order differs.

- [x] Derive visible states from actual completion records. — saved sessions since Monday; TodayActionPanel.week.render.test.ts
- [x] Keep the numeric weekly summary visible alongside the visual. — done (see progress.md)
- [x] If segments are interactive, route each to the correct day/session with an accessible name; otherwise keep them clearly informational. — chips open that day; accessible name "{day}, completed this week / next up / planned"
- [x] Keep all-time lifts/workouts as quiet supporting text; do not turn every metric into a tile. — done (see progress.md)
- [x] Handle schedule changes and goals other than five days without breaking the layout. — chips size to content and wrap; 3-day fixture in the test

## 9. Shared finish rules

Use CSS-pixel values from the real viewport, not physical pixels measured in these differently sized screenshots.

- [x] Establish consistent section spacing, row padding, divider opacity, and title/body hierarchy using existing design tokens. — done (see progress.md)
- [x] Reserve the condensed display face for headings and selected large numerals; use readable normal text for explanations and controls. — done (see progress.md)
- [x] Keep supporting text visibly readable rather than using excessive opacity to make the page look quiet. — done (see progress.md)
- [x] Audit default light surfaces in dark screens, including disclosure panels, alerts, and buttons. — done (see progress.md)
- [x] Keep headings and expanded content clear of sticky tabs and device status areas. — done (see progress.md)
- [x] Ensure content flows beneath sticky bars correctly while anchor/navigation destinations do not land hidden behind them. — done (see progress.md)
- [x] Preserve sufficient bottom padding for all fixed navigation and device safe areas. — done (see progress.md)
- [ ] Inspect the white status-area appearance in the Strength screenshot against the current runtime/theme configuration. Verify whether it is app-controlled before claiming a shell fix. — NOT REPRODUCIBLE here — the status area is the device's; the app draws a navy backdrop once scrolled (docs/ux-walkthrough U01) and cannot be verified without a device
- [x] Avoid global saturation/contrast filters that would distort badges, text, or photos while trying to improve the body map. — no filter used; tokens on the figure only
- [x] Preserve focus visibility and usable hit targets when reducing visible button chrome. — done (see progress.md)
- [x] Keep reduced-motion behavior and avoid unnecessary pulsing/glowing decorations. — no new motion

## 10. Verification and release checklist

### Required before/after evidence

Capture the same six surfaces after implementation at matching data/scroll state. Include one smaller phone width, current main width, and increased text size. Show actual rendered app screenshots, not generated concept mockups.

- [x] Strength front/back: vivid fills, clean boundaries, all rank legends reachable, selection works. — after-strength-front/back/legend at 390/320/zoom
- [x] Plan: long names, varying prescriptions, edit controls, reorder mode, and final row all fit. — after-plan-rows, after-plan-reorder
- [x] Review volume: clear scope, readable legend, coherent rows, sensible totals, working disclosures. — done (see progress.md)
- [x] Review recovery: no white low-contrast panels, clearly named session values, working actions. — done (see progress.md)
- [ ] Coverage: loading, genuine empty, valid analysis, and error states have distinct behavior. — PARTIAL — empty and valid verified; loading/error do not exist for a locally computed analysis
- [ ] Home: planned, active, empty, completed, and supported rest states show the right primary action. — PARTIAL — planned, completed, empty-day and no-plan verified (probe + tests); active covered by existing tests; rest day not a plan concept
- [x] Home visual matches workout content and weekly markers match real session states. — done (see progress.md)
- [x] Changing the selected workout does not leave stale visual emphasis, counts, or destinations. — done (see progress.md)
- [x] Bottom navigation, Search/Profile, back/close, and existing workflows remain functional. — done (see progress.md)
- [x] Build and existing relevant checks pass; add targeted tests for changed state/routing logic rather than tests that merely mirror CSS. — done (see progress.md)

### Execution order

1. Fix recovery contrast and malformed controls.
2. Repair plan-row layout and coverage states.
3. Refine strength-map rendering and legend.
4. Refine volume/recovery analytical hierarchy.
5. Implement Home CTA state handling and meaningful visuals.
6. Verify complete journeys and collect matched screenshots.
7. Push/release through the project's already-authorized process; verify the target build after release. If release access or authorization is missing, leave a fully tested reviewable change and identify that exact final blocker.

### Claude's final report must include

- Components/files changed and why.
- Before/after screenshots for each supplied weak surface.
- What was fixed in layout versus state/data behavior.
- Whether color tokens changed or only the map rendering changed.
- Confirmation that rank thresholds, user data, logo, and approved badges were preserved.
- Which Home visual was selected and which real data drives it.
- Test results and device/browser coverage actually exercised.
- Commit/build/deployment status, with remaining issues clearly stated.

**Completion standard:** the app retains its depth while the weaker surfaces now match the quality of the stronger ones. Home immediately gives the user a clear next action; visual information earns its space; analytical screens look precise and readable rather than faded, crowded, or unfinished.

## Companion Home-screen concept

The owner also requested a single generated Home-screen visual reference accompanying this document. Use it to guide composition, spacing, visual hierarchy, and overall finish. Rebuild its interface as real components; never use the generated screen as the app background.

The current supplied Home screenshot remains the source for the original logo. Use the exact production logo asset even if the generated reference approximates its smallest details. Any workout-focus illustration and weekly completion markers in the concept are illustrative; bind the implemented version to real workout and completion data. Do not infer scientific mappings or a historical completion order from the mockup. If concept text/values differ from verified current data, preserve the data and this document's action/state rules.
