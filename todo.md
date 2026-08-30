# Sport Movement Database Expansion

## User-Authorized Completion Sequence

- [x] Inventory and replace all Manus-specific runtime, storage, debug, Forge, and server dependencies with portable Supabase, standard Vite, or normal server equivalents while preserving current behavior.
- [x] Migrate every current `/manus-storage/` asset reference into Supabase Storage with a durable filename mapping and update all frontend references.
- [x] Verify independent production build, Supabase asset loading, Vercel frontend readiness, visual parity, and GitHub migration commit.
- [x] Verify the current GitHub synchronization and whether deployed Sports Genome code is connected to Supabase at runtime.
- [x] Inspect and report the current connected Supabase research-ingestion inventory without changing database data.
- [x] Export the current complete Sports Genome exercise catalog in a readable file for the user.
- [x] Temporarily bypass the Sports Genome sign-in gate so the workspace opens directly, while preserving isolated email/password and passkey implementation for later reactivation.
- [ ] Complete the remaining safe Sports Genome work without adding new external API or integration dependencies.
- [ ] Complete and publish the remaining non-device Sports Genome work in priority order: evidence-bounded Strength Genome, iPhone-first workflow polish, Body Lab refinement, and visible-data integrity cleanup.
- [ ] Complete each active implementation milestone through user-facing integration, full validation, publication, and GitHub synchronization before moving to the next milestone.
- [ ] Keep physical-device, authenticated, and Safari verification tasks explicitly open until they are observed rather than inferred from source or automated tests.
- [x] Design a Supabase-backed raw-to-staging research-ingestion foundation that preserves provenance, duplicate checks, explicit validation status, and separation from private athlete data.
- [x] Connect the approved Zapier data path for a small manual and ten-candidate research-ingestion pilot before any larger-scale import.
- [ ] Expand research only through provenance-preserving raw intake, staging validation, duplicate review, explicit approval, and versioned integration; audit athlete-facing values against exact source and user-data qualification gates.

## Strength Genome

- [x] Replace free-text Strength Genome exercise entry with a searchable catalog picker that requires deliberate exercise selection and preserves exercise-to-region routing.
- [x] Show a one-test population-relative benchmark only when the selected standardized exercise, test type, normalization, and athlete reference fields match a reviewed source; otherwise retain a clear unavailable state.
- [x] Verify the complete Piper 2021 pre-training preacher-curl 10RM table, body-mass bands, and standardization details against the publisher source before encoding any cut point.
- [x] Capture explicit adult-male age-18–25 source-population confirmation, body-mass band, standardized preacher-curl 10RM protocol, and pre-training condition for the narrow benchmark.
- [x] Keep all curls, unstandardized protocols, different rep counts, missing conditions, and nonmatching athletes in the current unavailable-reference state.
- [x] Browser-verify the fully matched Piper 2021 result at phone width and confirm its source-sample boundary remains visible beside the recorded ratio.
- [x] Use saved athlete baseline body weight automatically for Strength Genome test context when a same-day body-mass entry is absent, with a clear editable fallback only when no baseline weight exists.
- [x] Apply the saved profile body weight as the visible comparison fallback for existing Strength records with no same-day body-mass entry, while labeling it as a profile fallback rather than test-day measurement.
- [x] Make the verified Piper 2021 source-sample percentile interval the primary matched-record result, while moving the recorded load/body-mass ratio into optional supporting detail.
- [x] Replace the Strength Genome map’s recorded/focus/no-context dot legend with a simpler selected-test navigation treatment that does not imply an unrelated muscle ranking.
- [x] Keep nonmatching tests visibly rank-unavailable and never substitute ratio, color, focus, or catalog routing for a population rank.
- [x] Validate rank-first matching and no-rank fallback in the mounted mobile Strength Genome experience using saved profile body weight.
- [x] Show selected primary and supporting catalog muscles for the logged exercise, with verified curl routing to biceps context.
- [x] Verify selected Strength Genome catalog exercises across multiple movement families map cleanly from catalog selection into recorded region/domain routing.
- [x] Route the real Machine Preacher Curl catalog entry to biceps/elbow-flexion context and protect the selected-region history workflow from this alias gap.
- [x] Add focused coverage for multiple catalog exercises displaying primary/supporting muscles and routing expected Strength Genome context.
- [x] Render the selected-catalog Strength Genome preview for multiple real exercise families and assert primary, supporting, and broad recorded context remain distinct from scores or benchmarks.
- [x] Expose concise selected-catalog primary, supporting, and broad recorded-context labels in Strength Genome without introducing a score, rank, or benchmark.
- [x] Add focused test coverage for catalog selection and biceps-curl routing; retain the one-test benchmark and unmatched-reference coverage as a separate task.
- [x] Replace verbose Strength Genome region-detail methodology copy with a compact rating-first summary and one optional evidence-boundary disclosure.
- [x] Let athletes complete missing body mass for a selected recorded test so its load-to-body-mass ratio can be calculated without a fabricated score.
- [ ] Add best-effort browser interaction feedback on supported devices and reliable visual press feedback everywhere, without claiming native iPhone web haptics.
- [x] Add an interaction test for missing-body-mass submission that confirms the saved observation updates and the selected-region ratio appears afterward.
- [x] Make body-mass completion usable in temporary direct-entry mode, or explicitly explain and route to authentication before the protected save path.
- [x] Persist direct-access Strength Genome observations only in local device storage, keeping them visibly distinct from account-backed observations.
- [x] Support device-local Strength observation body-mass completion and ratio display with the athlete’s saved pound or kilogram preference.
- [x] Add focused and browser validation for direct-access Strength test save, reload persistence, and unit-aware ratio display.
- [x] Let athletes select a specific recorded test within a Strength region before adding missing body mass or reading its recorded ratio.
- [x] Validate direct-access body-mass completion and ratio display for both pound and kilogram profiles through rendered or live browser workflow checks.
- [x] Add loading and error UI plus regression coverage for body-mass completion failures.
- [x] Keep a failed account-backed body-mass value in place and provide inline retry guidance without affecting device-local completion.
- [x] Add an interaction regression that mocks account-backed body-mass save success and confirms the selected-region ratio appears after mutation completion.
- [x] Add an interaction regression that mocks account-backed body-mass save failure and confirms loading state, inline alert, preserved value, and retry behavior.
- [x] Test the account-backed body-mass completion pending state with visible saving text and `aria-busy` before driving its error and retry path.
- [x] Confirm the direct-access body-mass completion flow remains local and unaffected by account-save failure handling.
- [x] Verify the interaction-feedback utility behavior and visible press states for Strength map regions and region-detail actions without claiming native iPhone web haptics.
- [x] Apply and test visible pressed-state feedback on Strength map-region, record-history, review, close, and ratio-completion actions while retaining optional browser vibration only.
- [x] Wire optional nonblocking feedback into Strength region-detail close, record-history selection, review, and ratio-completion actions.
- [x] Add behavioral region-detail interaction coverage for optional feedback on close, history selection, review, and ratio completion alongside pressed-state CSS safeguards.
- [x] Confirm the rendered saved-record Review action invokes optional feedback, opens its routed region detail, and has an equivalent visible pressed state.
- [x] Add an integrated Strength Genome panel test that clicks a rendered device-local Review control and opens its routed regional detail.
- [x] Implement and test a visible keyboard and pressed state for actual clickable body-map muscle regions, not only the accessible selector fallback.
- [x] Add rendered SVG evidence that a real body-map muscle path exposes button keyboard semantics and the dedicated pressed/focus styling hooks.
- [x] Extend interaction-style coverage to assert rendered Review and Close controls carry their dedicated pressed-state class hooks.
- [x] Browser-verify the actual mounted body-muscles SVG paths expose keyboard button semantics and `.body-chart-muscle` pressed/focus hooks.
- [x] Add a jsdom regression against the actual `body-muscles` renderer output rather than a mocked chart path.
- [x] Ensure a Strength body-map region selection emits one optional feedback signal rather than duplicating it through nested callbacks.
- [x] Add source-level regression coverage confirming browser vibration is optional and non-blocking when unavailable.
- [x] Show selected-region raw load-to-body-mass ratios only when both athlete-entered test load and body mass from that same test are recorded.
- [x] Label body-mass-relative values as test-specific recorded ratios and keep percentiles, generic ranks, and regional force scores unavailable.
- [x] Add focused ratio and no-body-mass regression coverage in the Strength Genome region detail.
- [x] Replace the Strength Genome long regional no-data list with the existing interactive full-body qualitative map.
- [x] Use categorical color to distinguish recorded test context, athlete-confirmed focus, and no mapped test context without implying activation or strength rank.
- [x] Open a region detail panel on body-map selection showing raw athlete records, valid reference context when available, and explicit no-data or non-comparable boundaries instead of invented percentiles or ranks.
- [x] Render selected-region raw observation history by filtering saved observations through the recorded Strength Genome region/domain routing.
- [x] Add evidence-bounded selected-region reference context only when a reviewed reference exists, with explicit no-reference and non-comparable states otherwise.
- [x] Add focused Strength Genome body-map coverage for observed-region detail, no-data detail, and the prohibition on invented percentile or rank output.
- [x] Provide a compact accessible region selector alongside the interactive body map so athletes can inspect unrecorded as well as recorded regions without relying only on SVG clicks.
- [x] Browser-verify that the Strength Genome region selector opens both a recorded test detail and a no-test detail at phone width without displaying a percentile or rank.
- [x] Present selected-region direct-access record history with a concise explicit unavailable-reference state when no exact reviewed reference applies.
- [x] Move a newly selected Strength Genome region detail into a readable mobile position and focus its accessible heading without forcing motion for reduced-motion users.
- [x] Require matching recorded test conditions for within-athlete Strength Genome load comparisons, returning an explicit non-comparable state rather than a misleading change card.
- [x] Return an explicit non-comparable result when matching exercise/test/laterality observations differ by recorded testing conditions.
- [x] Render concise Progress copy explaining when recorded test conditions prevent a like-for-like comparison.
- [x] Add regression coverage proving mismatched equipment, range, technique, tempo, assistance, or data quality returns an explicit non-comparable state.
- [x] Add an explicit athlete-controlled Strength Genome-to-Training Day handoff that carries no inferred deficit, tier, or automatic plan rewrite.
- [x] Reconcile the full user-supplied Strength Genome specification with the current athlete profile, exercise catalog, evidence registry, and workout-planning architecture.
- [x] Define a longitudinal athlete profile and strength-observation schema that preserves dated body-mass context, measured inputs, testing conditions, and data-quality metadata.
- [x] Add transparent non-numeric routing for recognized athlete-entered tests to broad functional domains and anatomical regions, with no regional-force estimate, tier, percentile, or cross-test comparison.
- [x] Add an exact-match within-athlete recorded-load comparison for repeated named tests, retaining clear test-type, laterality, repetition, and non-estimate boundaries.
- [x] Add reversible athlete-confirmed regional training priorities that are account-scoped and explicitly separate from inferred deficits, strength ranks, and diagnoses.
- [x] Capture athlete-entered test date, body mass, equipment, range standard, technique, tempo, laterality, assistance, data quality, and notes alongside raw Strength Genome observations.
- [x] Document reviewed 1RM reliability and adult handgrip-reference limits, and add regression protection against unqualified percentile or tier output.
- [ ] Build source-traceable mappings from standardized exercise observations to functional strength domains and from domains to anatomical-region presentation layers.
- [ ] Add only verified normative-reference data with explicit population, normalization, age/sex, measurement-method, and coverage limits; render no percentile where a valid reference is absent.
- [ ] Implement transparent continuous strength estimates, discrete F-to-SS+ tiers, estimate confidence, imbalance logic, sport relevance, and editable athlete-confirmed training priorities without representing estimates as direct measurements.
- [ ] Create the mobile-first Strength Genome body-profile interface, regional detail flow, lift/test entry workflow, and planning handoff using source-bounded labels and no fabricated performance-transfer claims.
- [ ] Add unit, component, schema, and integration coverage; validate accessible mobile layout, tier semantics, missing-data handling, and estimate/evidence boundaries before publication.

## iPhone-First Product Polish

- [x] Correct Push-day automatic stack generation so lower-body-dominant and rotational exercises do not appear unless the athlete manually adds them.
- [x] Make Push-day stack analysis grade and map only Push target muscles by default, with non-target involvement available separately as supporting context.
- [x] Prevent selecting an empty Push day from reusing a previously active mixed or lower-body stack, without deleting manually saved athlete workouts.
- [x] Add a short silent Sports Genome first-entry animation with visible skip and replay behavior plus a Settings toggle to disable future launch animation.
- [x] Ensure the launch experience does not initiate or require music/audio playback.
- [x] Replace the Catalog’s oversized marketing headline and explanatory paragraph with a compact discovery header.
- [x] Compress Catalog exercise results into clear search, filters, exercise name, key muscle, connection label, favorite, and add controls without oversized white cards.
- [x] Add a short intentional Sports Genome first-entry loading experience inspired by the user-supplied motion reference, with clear skip and replay behavior.
- [x] Do not add launch sound design in this batch; the athlete explicitly requested a sound-free experience.
- [x] Apply best-effort browser interaction feedback and reliable visual feedback to launch and first-use interactions, without claiming native iPhone web haptics.
- [x] Respect reduced-motion preference and ensure the launch experience never blocks direct entry into onboarding or the workspace.
- [x] Remove the legacy Catalog marketing header and explanatory paragraph markup from Home so Catalog is driven only by the compact discovery header.
- [x] Bypass the automatic first-entry overlay for reduced-motion preference while retaining optional explicit replay and visible skip behavior.
- [x] Make the normal first-entry visual transition nonblocking while retaining an immediately available skip control and the optional replay path.
- [x] Keep the normal first-entry launch compact enough that onboarding and workspace controls remain visibly available, and protect that behavior with focused coverage.
- [x] Browser-verify the compact first-entry transition at phone width with a mounted workspace, recording that primary content remains visible and reachable.
- [x] Replace the automatic in-workspace launch transition with a black document-level boot screen that renders while Sports Genome initializes.
- [x] Honor the existing launch preference before React mounts, while retaining More controls to enable, disable, or replay the boot presentation.
- [x] Remove automatic launch content from the opened workspace so active screens are never covered after initialization.
- [x] Validate the configurable boot screen at a phone viewport and publish the corrected launch behavior.
- [x] Slow the silent document-level Sports Genome boot animation and make its line, mark, and label transitions continuous and restrained.
- [x] Replace the sideways document boot mark with the user-supplied upright Sports Genome S/DNA logo, preserving its silver loop, vermilion genetic lines, and vertical proportions.
- [x] Remove non-logo boot-mark overlays so the supplied upright S/DNA artwork remains the only visible symbol during the launch sequence.
- [x] Reveal the supplied upright S/DNA artwork itself through a restrained vertical boot transition rather than substituting a separate DNA animation.
- [x] Validate the upright logo during the silent boot sequence at phone width and confirm it clears before the workspace opens.
- [x] Remove the pasted-image-card appearance from the document boot mark while preserving the upright Sports Genome S/DNA logo itself.
- [x] Replace the slide-up boot behavior with a silent approximately two-second staged reveal: S silhouette first, DNA-line detail second, wordmark third, then workspace transition.
- [x] Keep the staged boot reveal smooth, reduced-motion safe, and visually centered without audio, rotation, sideways marks, or substitute/orbit graphics.
- [x] Add regression and phone-width visual validation for the corrected staged boot sequence before publication.
- [x] Preload the exact boot silhouette and DNA-detail layers so the short staged launch does not wait for image loading.
- [x] Evaluate the supplied intro video and, if suitable, integrate it as a muted short launch visual without replacing the protected upright Sports Genome mark.
- [x] Preserve the existing silent staged logo fallback for reduced-motion, failed video loading, or unavailable autoplay.
- [x] Validate video-led intro playback, muting, fallback, and mobile handoff before publication.
- [x] Diagnose and correct any live launch-preference, preview, caching, or asset-delivery issue that prevents the supplied intro video from being visible after publication.
- [x] Verify the visible video-led launch on the live site at phone and browser width without weakening reduced-motion or athlete preference controls.
- [x] Smooth the video-ready wordmark entrance and video-to-workspace handoff using only GPU-friendly transform and opacity transitions.
- [x] Validate the smoother silent intro at phone and browser width without extending its brief launch duration or weakening fallback behavior.
- [x] Profile and remove remaining video-intro motion bottlenecks that cause a choppy startup on constrained phones.
- [x] Verify the corrected silent launch under constrained phone performance while preserving reduced-motion and fallback paths.
- [x] Retain the smooth staged logo-formation timing while shortening the post-logo hold and fading promptly into the workspace.
- [x] Validate that the final boot-to-workspace transition is one continuous composited fade at phone and browser width.
- [x] Shorten the silent staged S/DNA logo intro further while preserving its smooth formation and continuous fade into the workspace.
- [x] Make the circular Sports Genome badge more prominent and slow the silent logo reveal slightly while preserving its smooth formation, dynamic wordmark bounce, and prompt workspace fade.
- [x] Refine the silent launch into a brief dynamic sequence where the S appears, DNA lines resolve smoothly, the wordmark arrives, and the app fades in cleanly.
- [x] Audit the user-supplied normative source hierarchy for exact protocols, population boundaries, reproducibility, and permitted data use before adding any benchmark data.
- [x] Define source-specific athlete, test, normalization, and population gates so no source can become an undifferentiated generic strength percentile.
- [x] Expand the Strength Genome reference-qualification registry so every audited normative source has its own athlete, test, normalization, population, and licensing gate instead of a grouped-source fallback.
- [x] Add representative youth, sport-specific, competition-only, and license-blocked regression paths proving unmatched source conditions remain unavailable.
- [x] Require an explicitly installed exact test identity for every audited source before a fully populated source gate can become qualified.
- [x] Require an explicit source-specific normalization identity before any reference candidate can qualify.
- [x] Machine-gate each audited source’s licensing or access-review state rather than relying on narrative boundary text.
- [x] Add sport-specific and competition-only mismatch regressions alongside youth and license-blocked reference tests.
- [x] Wire source qualification into the athlete-facing Strength Genome unavailable-reference flow so no comparison bypasses access, population, protocol, test, or normalization gates.
- [x] Add audit-backed coverage verifying every preserved source record has one registry entry with a corresponding machine access state.
- [x] Add athlete-facing unavailable-state coverage across youth, sport-specific, competition-only, context-only, and license-blocked source categories.
- [x] Make Strength Genome load and body-mass fields follow the athlete’s saved pound or kilogram preference, converting transparently only at the persistence boundary.
- [x] Add focused conversion and UI-label coverage proving a pound-profile athlete is never asked to enter kilograms by default.
- [x] Render the Strength Genome entry interface with a pound profile and assert its visible load and body-mass prompts are pound-first with no kilogram default.
- [x] Browser-verify the live pound-profile Strength Genome advanced testing detail, including its body-mass unit label.
- [x] Mount the actual Strength Genome panel with a pound profile and the advanced detail open to test its fully wired entry labels.
- [x] Capture browser-DOM text assertions for the live pound-profile advanced entry detail rather than relying only on visual review.
- [x] Repair low-contrast Training Day text and controls so every active planning and stack-analysis label is readable on its blue/black surface.
- [x] Keep whole-body involvement visible in Training Day analysis while calculating the split rating and coverage guidance only from the selected split’s target muscles.
- [x] Label split-target rating and whole-body context distinctly so relative planning indices are not confused with muscle activation measurements.
- [x] Visually audit the full Training Day stack-analysis overlay and add regression coverage for its dark-surface label and control contrast.
- [x] Add explicit high-contrast dark-surface styles for Stack Analysis headings, labels, metric text, rows, and controls.
- [x] Add focused regression coverage for Stack Analysis overlay contrast tokens and controls, separate from split-target scoring semantics.
- [x] Reduce broad white surfaces by giving Train a deep operational navy theme and Tracker a focused dark execution theme.
- [x] Convert the visible Training Day weekly-planning and Tracker execution panels from broad white cards to readable layered navy operational surfaces.
- [x] Give Explore a layered blue discovery-lab theme, Progress a dark measured-review theme, Profile a personal-control theme, and More a compact utility theme.
- [x] Audit the mounted Explore, Progress, Profile, and More canvases at phone width before applying destination-specific surface refinements.
- [x] Establish accessible dark-surface typography, panel, divider, and interaction tokens so the destination themes remain cohesive and readable.
- [x] Ensure Strength Genome selected-record and source-comparison detail content has sufficient bottom safe-area clearance above the fixed six-destination mobile navigation.
- [x] Ensure programmatic navigation to a matched Strength source-comparison card respects the mobile bottom-nav safe area as well as manual scrolling.
- [x] Reduce repeated Progress empty-state and methodology copy to concise recorded-status cards with one relevant next action.
- [x] Retain comparison-condition explanation in an optional disclosure rather than the default Progress canvas.
- [ ] Reduce Training Day’s default canvas to day selection, saved stack, split-target index, and one next action; move diagnostics, preparation detail, and catalog expansion behind Train contextual tabs or disclosures.
- [ ] Remove repeated set, time, fatigue, equipment, planning-band, and methodology prose from the default Training Day view while retaining concise editable prescription controls.
- [x] Compress the Training Day mobile hero and three-week selector so the first viewport prioritizes the day heading, week choice, and weekly map without removing planning controls.
- [x] Make Training Day a planning-only workspace for building, selecting, reviewing, and rating saved training days.
- [x] Make Tracker a distinct execution workspace where athletes select a saved day and enter completed weight, repetitions, optional effort, and completion state.
- [x] Feed completed tracker records into Progress as recorded session data, without showing planned stack diagnostics as execution history.
- [x] Remove repeated planning boxes and long instructional copy from the Tracker default screen.
- [x] Render completed Tracker sessions in Progress as actual recorded workout entries or summaries, including completed-set information where appropriate, rather than only a count and latest title.
- [x] Merge and sort device-local and account-backed completed sessions consistently in Progress so latest-session and history views reflect true recorded chronology.
- [x] Add focused regression coverage for the Tracker-to-Progress handoff without restoring planned stack diagnostics into Tracker.
- [x] Repair the blank Training Day and Tracker canvases reported after the mobile navigation changes, then add rendering regression coverage.
- [ ] Verify populated Training Day and Tracker content at an iPhone viewport and desktop viewport before publishing the repair.
- [x] Give Train an operational session-planning visual system distinct from exploration, review, and profile surfaces.
- [ ] Give Explore a discovery-lab visual system with clearer atlas, anatomy, catalog, and genome modes.
- [x] Compress the Movement Atlas mobile hero and preserve its complete action-family filter set in a readable horizontal discovery rail.
- [x] Clean up Movement Atlas with a shorter integrated count hero, compact athlete-facing filters, advanced taxonomy disclosure, useful sorting, and lighter tappable results while preserving all data and navigation.
- [x] Refine Body Lab mobile so the full anatomical model fits as the primary workspace element, role rows and context are compact and tappable, and evidence detail remains progressively disclosed.
- [x] Allow athletes to edit Training Day set counts and rep targets freely and duplicate an exercise into distinct working or test prescriptions without merging stack entries.
- [x] Reorganize Training Day mobile into a compact build flow with grouped prescription rows, optional Stack Analysis, and an on-demand exercise finder while preserving all planning data and controls.
- [x] Repair the reported Push stack data-loss regression and prevent saved workout entries from being overwritten during hydration or navigation.
- [x] Make split-target exercise discovery easier and show direct split-compatible exercise recommendations when Stack Analysis finds a missing target muscle.
- [x] Clarify exercise-score scope and source so exercise scores such as pec-fly `71/100` cannot be mistaken for an overall quality, activation, strength, or athlete rating.
- [x] Restore readable contrast for Training Day labels, descriptions, controls, selected states, and evidence disclosures against their actual navy, white, and blue surfaces.
- [x] Redesign Strength Genome as a larger anatomy-led rank-and-progress workspace, inspired by the supplied reference but without fabricated tiers, percentiles, personal records, or performance claims.
- [x] Present comparative status only behind exact reviewed-source, test, protocol, population, and body-mass gates; otherwise show a concise unavailable-reference state beside athlete-recorded progress.
- [x] Redesign Tracker as a polished execution-focused mobile flow with clear exercise, set progress, editable weight and reps, and one clear set-completion action.
- [x] Remove RPE from the athlete-facing Tracker and completed-session records while preserving weight, repetitions, completion state, saved session history, and Progress handoff.
- [x] Audit and repair text contrast across every Sports Genome destination, control, disclosure, state, and surface at phone and desktop widths.
- [x] Audit athlete-facing numerical values so each either names its source and calculation scope or is withheld when no qualifying data exists.
- [x] Create premium Strength Genome visual assets for qualified comparative outcomes and the equally intentional unavailable-reference state, never generating invented rank, percentile, tier, or record imagery.
- [x] Allow a second tap on a selected Strength Genome body-map region or accessible region control to clear the active selection and close the detail state.
- [x] Add a ring-style Strength Genome status visual that represents recorded test coverage by default and a source-qualified comparison only when the exact reference gate passes, never an invented strength rank.
- [x] Repair Stack Analysis mobile target rows so labels, descriptors, values, selection, and navigation have one consistent full-width readable layout with no overlapping or irregular cards.
- [x] Reorganize Stack Analysis into a compact split-target summary with optional supporting detail and direct gap recommendations, without automatically opening or interrupting the flow with Body Lab content.
- [x] Further compact Stack Analysis mobile hierarchy and surface the best direct split-compatible gap recommendations directly beneath the coverage summary before the detailed target list.
- [x] Simplify the Strength Genome default screen by moving coverage methodology and unavailable-reference explanation behind a concise on-demand disclosure.
- [ ] Research and integrate additional relative-strength references only when exercise identity, test protocol, equipment, population, athlete context, licensing/access, and source provenance can support a gated comparative result.
- [x] Confirm the reported device notification is not a Sports Genome product issue; make no notification-code change and keep the athlete experience work focused on the requested interfaces.
- [x] Repair the mobile bottom navigation so one deliberate tap changes the selected destination without requiring a second tap.
- [x] Deliver a source-qualified relative-strength percentile and rank workflow for explicitly eligible lift tests, with visible protocol/population context and an unavailable state for every nonmatching test.
- [x] Give Progress a measured review visual system, Profile a personal-control visual system, and More a compact utility visual system.
- [ ] Preserve a coherent Sports Genome navy, bone, gold, vermilion, and workflow-blue design language while differentiating destination hierarchy and panel rhythm.
- [x] Consolidate mobile navigation into six stable bottom-bar slots—Home, Train, Explore, Progress, Profile, and More—while preserving every existing page through contextual top-level subnavigation.
- [x] Group Training Day, Workout Builder, Recommendations, Stack Review, and preparation into one Train destination with a context-aware top switcher.
- [x] Group Movement Atlas, Body Lab, Exercise Genome, and Exercise Catalog into one Explore destination with context-aware top subnavigation.
- [x] Update the bottom bar, More-menu rail, deep-link behavior, and regression coverage so the active destination and contextual page remain clear and navigable.
- [x] Remove the contextual action strip from the bottom dock so the bottom edge contains only the six primary navigation items.
- [x] Surface Train and Explore contextual controls beside or below the changing top header, with only the relevant group visible for the active primary destination.
- [x] Remove the persistent desktop and mobile sidebar entirely, moving primary entry points to a responsive bottom bar and retaining contextual navigation at the top.
- [x] Make More a true sixth bottom destination with a lightweight utility surface rather than a sidebar trigger.
- [x] Move the official Sports Genome mark into the compact top header as a larger unboxed, blended brand anchor.
- [x] Expose the six primary destinations through the bottom navigation at desktop widths after sidebar removal, with regression and browser verification.
- [x] Ensure contextual top navigation has exactly one active tab for every Train and Explore state, including Tracker, Stack Review, and Prep routes.
- [x] Increase mobile top-navigation type size and spacing, prevent tight tab labels, and simplify the header presentation so the shell feels app-first rather than website-like.
- [x] Make mobile contextual tabs retain 44px touch targets, readable type, and a visible single-active state while allowing horizontal scroll without clipped labels.
- [x] Audit any header-layer media or visual element that obscures the top controls in the reported mobile view; no application-owned overlay was present in the inspected DOM.
- [x] Document that the reported vertical media overlay is external to the inspected Sports Genome interface.
- [ ] Visually verify the mobile header and top navigation remain readable and unobscured with real device/browser chrome present, separately from the overlay-source audit.
- [ ] Further adjust top and bottom navigation label size and spacing if the live device view remains cramped, then revalidate its single-active-state behavior.
- [ ] Increase the Sports Genome header mark and the mobile bottom/top navigation labels to a comfortably readable app-scale size.
- [ ] Establish cohesive navy, bone, gold, vermilion, and workflow-blue app-surface styling for the mobile shell and its primary planning panels.
- [x] Remove persistent Automatic Stacks, Evidence, and Program Lens cards from the primary mobile canvas, replacing them with a single optional Plan Context disclosure.
- [x] Preserve access to equipment editing and source/methodology detail from the compact Plan Context disclosure without repeating those blocks on every workspace.
- [x] Remove Plan Context from the default workspace canvas.
- [x] Verify dedicated, on-demand access to equipment editing and evidence/methodology after Plan Context removal.
- [x] Correct contextual Train and Explore visual state so exactly one top tab receives the active underline at a time, with local Tracker and Body Lab browser checks.
- [x] Add interaction or render coverage for each Train and Explore contextual tab, asserting exactly one `aria-current="page"` and active visual class after navigation.
- [x] Verify explicit on-demand routes for equipment editing and evidence/methodology after Plan Context removal, then protect them with focused regression coverage.
- [x] Reduce mobile recommendation and action cards to decision-critical exercise name, role, and primary action; move list provenance and evidence detail behind concise disclosure.
- [x] Rework the mobile recommendation overview so sport-program evidence and mechanics are available on demand rather than consuming the initial screen.
- [x] Enlarge the official Sports Genome rail logo and remove its contrasting boxed treatment so it blends with the navy navigation background.
- [x] Remove nonessential destination-description copy from the mobile workspace dock so its context strip leads with the active task and actions.
- [x] Collapse repeated Athlete Baseline evidence banners into concise optional disclosure so quiz questions lead with the decision, not methodology.
- [x] Replace the redundant recommendation-header explanation with a single action-oriented line, leaving equipment context solely in its compact constraint strip.
- [x] Add an action-oriented recommendation header cue that directs the athlete to choose an action, then inspect or add relevant exercise matches.
- [x] Replace the floating five-icon mobile navigation with a connected safe-area workspace bar that exposes context-relevant controls for each active destination.
- [x] Replace the prior Training Day dock-action model with top-level Train navigation for Training Day, Tracker, Matches, Builder, Stack Review, and Prep.
- [x] Wire contextual Train controls to the distinct Training Day, workout-tracker, stack-review, and preparation workflows with focused regression coverage.
- [x] Verify explicit logger, stack-review, and preparation anchors exist and protect their contextual Train navigation with source-level regression coverage.
- [x] Ensure Movement Atlas action rows and selected-action controls retain full-width 44px-or-larger touch targets at narrow mobile widths.
- [x] Convert the mobile workspace header’s long sport/goal/days text string into compact accessible context chips with overflow-safe labels.
- [ ] Establish one reusable Sports Genome mobile design system covering colors, elevation, radii, strokes, typography, spacing, interactive states, compact chips, and motion timing.
- [x] Rework primary mobile navigation around daily athlete actions, with persistent bottom navigation for Home, Train, Genome, Progress, and Profile while retaining the drawer for secondary tools.
- [ ] Replace dense mobile headers and persistent tutorial clutter with compact contextual controls, clear screen titles, sport/goal chips, and first-use coach marks that can be dismissed.
- [x] Relocate the persistent floating mobile guide control into the contextual Home dock, keeping the tutorial available without covering the content canvas.
- [ ] Redesign the Home screen around a truthful Today action, current-plan state, weekly rhythm, Strength Genome completion, and next-best actions without invented readiness or achievement data.
- [ ] Make recommendations, Body Lab, Exercise Genome, Training Days, and catalog rows concise, tappable, rankable, and progressively disclosed before methodology or deep evidence detail.
- [x] Replace activation-style Body Lab guide language with the established qualitative-role-map boundary.
- [ ] Create visually distinct but semantically separate treatments for athlete strength tiers, exercise transfer matches, evidence confidence, incomplete data, PRs, and major milestones.
- [ ] Build a non-destructive Progress area for tier, PR, confidence, bodyweight-relative, imbalance, and body-map history only when valid saved observations support each view.
- [ ] Verify mobile layouts at small, standard, and large iPhone widths, including standalone PWA safe areas, keyboard behavior, long labels, horizontal-overflow safeguards, and authenticated workflows.

## Official App and Home-Screen Icon

- [x] Replace the visible top-header logo mark with the newly supplied upright S/DNA artwork while preserving the Home title and sport, goal, and days context chips unchanged.
- [x] Replace the visible top-left in-app header mark with the newly supplied circular Sports Genome badge while preserving the Home title and sport, goal, and days context chips unchanged.
- [x] Render the supplied circular badge as a natural larger round mark in the workspace header as well as the active onboarding header, preserving all adjacent controls.
- [x] Replace the iPhone Home Screen and PWA icon assets with the supplied upright S/DNA artwork while leaving the in-app header title and context chips unchanged.
- [x] Replace the visible top-left sidebar logo mark with the user-supplied official Sports Genome — Decoding Performance artwork.
- [x] Remove any legacy rail pseudo-mark styling that hides or recolors the supplied official sidebar artwork.
- [x] Replace remaining athlete-visible legacy Gym Optimizer labels in the document title, sign-in copy, and passkey relying-party prompt with Sports Genome.
- [ ] Verify the authenticated sidebar/rail renders the newly supplied official Sports Genome — Decoding Performance artwork on the live site, separately from source-level and signed-out checks.
- [x] Publish and browser-verify the official Sports Genome app-icon and PWA manifest references while keeping physical iPhone cache behavior separate.
- [x] Inspect and remove or replace conflicting favicon, Apple touch icon, and manifest icon references.
- [x] Create official edge-to-edge deep-navy square Sports Genome icon assets at 180×180, 192×192, and 512×512 from the supplied artwork without an embedded rounded mask.
- [x] Add the official Apple touch icon link, standalone PWA manifest, deep-navy theme metadata, and matching PWA icon references.
- [x] Verify icon dimensions, opaque navy edge treatment, asset paths, manifest metadata, and published Safari Add to Home Screen configuration.
- [x] Publish the official icon update and verify the live deployed domain serves the new Apple touch icon and manifest paths.
- [ ] Confirm Safari Add to Home Screen icon behavior from a real iPhone, keeping this device-only check distinct from code-level verification.

## Evidence-to-Logic and No-Placeholder Audit

- [ ] Inventory every athlete-facing numeric score, threshold, weight, volume target, rating, recommendation constant, and visible placeholder across client, server, catalog, and sport data.
- [ ] Classify each inventoried value as source-backed, transparent product-design constraint, athlete-entered value, or unsupported placeholder; retain an evidence or rationale reference for each surviving value.
- [x] Clarify the Exercise Genome sport-action 0–100 value as a catalog mapping input rather than a skill, performance, population, or strength rank.
- [x] Remove the obstructive post-sport-change feedback message from mobile Profile and retain only nonblocking state updates.
- [x] Replace the confusing Catalog sport-fit selector with a simple action-link filter that offers Direct support and Supporting link only.
- [x] Correct low-contrast athlete-facing text across the reported mobile Movement, Profile, and Catalog dark surfaces.
- [x] Add regression and phone-width validation for the sport-change, action-link-filter, and contrast corrections before publication.
- [x] Reset stale Catalog query and filters after a sport change so exercise discovery starts clean for the new athlete context.
- [x] Hide non-actionable Not mapped labels from Catalog rows while retaining no-mapping context in opened exercise detail.
- [x] Reduce initial-load cost by lazy-loading appropriate Explore-only workspaces without changing direct-access navigation or evidence behavior.
- [ ] Separate movement-data consumers not required for the first visible Home state from the initial application mount to improve post-intro responsiveness.
- [x] Compress the Profile mobile hero into one clear planning-context boundary without hiding editable athlete details or evidence limits.
- [x] Make the first-run mobile onboarding header show the official Sports Genome mark with a concise readable wordmark while preserving quiz progress.
- [x] Replace the small square onboarding-header logo with the supplied circular Sports Genome badge, rendered larger as a natural round mark while preserving the quiz title and progress controls.
- [ ] Recalibrate, relabel, or remove unsupported fixed values and athlete-facing placeholders without representing planning estimates as direct scientific measurements.
- [x] Add central traceability metadata and regression coverage so calibrated values, source boundaries, and non-placeholder states do not silently drift.
- [ ] Complete an exhaustive evidence-to-logic inventory across remaining client components, server auth/logging paths, catalog data, and sport-data records; record every athlete-facing numeric or placeholder surface.
- [ ] Extend the traceability registry so each surviving athlete-facing value has an explicit category and a per-value source link or product-design rationale.
- [ ] Expand traceability from current surface-level groups to per-value or per-constant entries for remaining athlete-facing scores, thresholds, and display rules, with explicit category and source or rationale metadata.
- [ ] Add regression coverage proving remaining athlete-facing value surfaces resolve through named traceability metadata rather than uncategorized literals.
- [ ] Finish the remaining recalibration/relabel pass for still-untracked constants or wording, then prove full-surface usage of named calibration through regression coverage.
- [ ] Validate the full evidence-to-logic audit, checkpoint it, synchronize GitHub, and document values that remain intentionally adjustable rather than universal.

## Sidebar Navigation Repair

- [x] Replace the remaining Home navigation detail “readiness & next decision” with wording that reflects plan context rather than a readiness claim.
- [x] Audit the reported non-moving sidebar across click, keyboard, mobile-menu, active-section, and browser-history behavior.
- [ ] Repair sidebar navigation so every visible destination changes the active workspace and closes the mobile overlay when appropriate.
- [x] Add focused regression coverage for desktop rail visibility, mobile overlay dismissal, active-state semantics, and browser-history-aware workspace changes.
- [ ] Confirm every sidebar destination changes the populated signed-in workspace on both desktop and mobile after publication.
- [ ] Add interaction-level sidebar tests that activate every destination and assert active workspace, aria-current, history state, and mobile-rail closure behavior.
- [ ] Visually verify the repaired sidebar in an authenticated mobile viewport and record the result separately from code-level validation.
- [x] Audit visible navigation controls that call setWorkspace(...) directly and route sidebar-consistent controls through navigateWorkspace where appropriate.

## Current Mobile Drawer, Branding, and Theme Repair

- [x] Audit the reported mobile drawer against the live build for legacy Gym Optimizer logo assets, neon-green active states, old account labels, and theme-token overrides.
- [x] Replace remaining legacy drawer branding and active-state styling with the official Sports Genome icon, navy/bone/gold/vermilion system, and accessible active indication.
- [ ] Remove residual athlete-facing neon-green accent classes from Home and Exercise Genome surfaces, retaining navy, bone, gold, vermilion, and workflow-blue semantics.
- [ ] Replace remaining legacy neon utility classes with explicit Sports Genome palette tokens and prove their removal with a focused source audit.
- [ ] Repair any confirmed mobile drawer slider, scroll, close, or destination-activation failure and add focused regression coverage.
- [ ] Capture the current mobile drawer at an iPhone width and verify logo, active styling, navigation, scroll behavior, and safe-area controls before publication.

## Mobile Drawer Brand and Typography Refinement

- [x] Replace the drawer brand lockup with a prominent official Sports Genome icon and concise, legible brand treatment.
- [x] Reduce sidebar typography density by simplifying labels, group headings, account context, research context, and secondary navigation metadata.
- [x] Increase vertical breathing room and preserve 44px-or-larger primary navigation targets without making the drawer feel crowded.
- [ ] Validate the simplified drawer at iPhone widths for readable hierarchy, clear active state, smooth scrolling, and no clipped content.

## Exercise-to-Action Connection Indicators

- [x] Remove the duplicate legacy Exercise Genome workspace branch so only the canonical connection-aware selector and exercise-detail flow render.
- [x] Audit existing exercise-to-movement transfer, sport-fit, and selected-action data available to catalog and Exercise Genome surfaces.
- [x] Add compact Direct support, Supporting link, or No mapped link indicators to exercise result rows for the selected sport action.
- [x] Add the connection explanation and supported movement rationale to the selected-exercise detail without fabricating transfer certainty.
- [x] Add regression coverage and validate readable indicators across the mobile full-width catalog list and exercise detail.
- [x] Remove the duplicate legacy Exercise Catalog grid from Home.tsx so mobile always renders the canonical full-width Catalog Discovery list.
- [x] Mirror the selected-action Direct support, Supporting link, or Not mapped indicator into the Exercise Genome selector rows shown in the reported screen.
- [x] Show the selected-action connection explanation in the opened exercise detail and Exercise Genome context without fabricating sport-transfer certainty.

## Visible Data Integrity and Interactive Navigation Verification

- [ ] Audit and replace every visible placeholder-style numeric display with a live athlete value, derived planning value with clear label, or explicit no-data state.
- [x] Remove the unsupported command-center Session readiness marker and replace it with a truthful current-plan status derived from saved workout data.
- [x] Remove the stale duplicate command-center branch containing Session readiness and 82 from Home.tsx rather than hiding it with CSS.
- [x] Decide whether command-center plan status derives from persisted saved workout data or is explicitly labeled as active staged-plan state, then add a regression against the prior placeholder.
- [ ] Interactively activate every sidebar destination and verify active workspace, URL history, active state, desktop rail behavior, and mobile overlay closure.
- [ ] Capture and review updated desktop and mobile workspace screenshots after visible-placeholder cleanup and sidebar verification.

## Body Lab Number Semantics

- [x] Replace Body Lab’s internal 9/6 role-derived anatomy intensity values with categorical Primary and Supporting presentation states.
- [x] Audit all Body Lab score generation, role-template defaults, heat-map intensities, model-index badges, and metric-bar display paths.
- [x] Replace default primary/synergist template numbers with qualitative role and evidence context when no exercise or stack calculation is available.
- [x] Retire Body Lab model-index displays entirely; retain relative scores only in dedicated exercise and active-stack analysis with clear non-measurement labeling.
- [x] Add regression coverage preventing repeated role-template values from appearing as precise Body Lab scores, then validate the corrected layout on desktop and mobile.
- [x] Compress Body Lab’s default navigator, anatomy-map, inspector-empty, and role-list copy to decision-critical qualitative context while retaining on-demand methodology and source boundaries.
- [x] Remove or compress the remaining oversized Body Lab workspace hero so sport/action selection and the qualitative anatomy map lead the initial screen.
- [x] Remove all Body Lab Model index, score badge, tier, and numeric role-index display paths, including when an exercise or stack context is supplied.
- [x] Replace numeric Body Lab exercise/stack score copy with a qualitative statement that context is available without assigning an activation, force, or capacity value.
- [x] Restore visible relative involvement percentages and scores for specific exercise and active-stack analysis only, with explicit relative-model labeling.
- [x] Keep general Body Lab sport/action exploration qualitative, without role-template or unsupported fallback scores.
- [x] Add context-sensitive score regression coverage proving exercise/stack views retain score displays while general Body Lab does not.
- [x] Add a StackAnalysisPage regression proving whole-stack involvement and contribution scores retain non-measurement boundary copy.
- [x] Add a comparative regression proving general Body Lab has no template score while Exercise Genome and Stack Analysis retain clearly labeled relative scores.

## Qualitative Muscle Role and Unified Mobile Design System

- [x] Replace single primary/synergist assumptions with movement-specific multiple role tags: Primary Mover, Synergist, Stabilizer, and Supporting.
- [x] Attach direct, strong indirect, moderate biomechanical, or low-confidence evidence labels to every displayed muscle-role judgment.
- [x] Make Body Lab role ordering depend on movement mechanics and phase context rather than scaling one muscle template across actions.
- [x] Use source-recorded contraction and action-phase context to influence Body Lab role ordering wherever the enriched movement evidence distinguishes contribution order.
- [x] Add regression coverage proving differing supported action-phase contexts can change qualitative Body Lab role ordering without fabricating timing or force values.
- [x] Extend Body Lab role ordering to use explicit enriched movement mechanics and action-phase signals beyond the current isometric-context heuristic.
- [x] Add comparative role-context regressions using multiple source-recorded phase patterns to prove qualitative ordering changes appropriately.
- [x] Add a component-level regression proving the rendered Key Muscle Roles list follows source-recorded phase-sensitive ordering without fabricating timing or force values.
- [x] Convert the Body Lab legend and heat map to categorical Neutral, Supporting, and Primary states, with selection styling kept separate from role color.
- [x] Rename Leading Muscle Signals to Key Muscle Roles and rewrite inspector copy to distinguish sporting-action role from exercise or stack context.
- [x] Tighten Body Lab inspector hierarchy to muscle name, role, confidence, explanation, and compact source context with expandable methodology.
- [ ] Separate grouped anatomical regions internally where meaningful while retaining clear athlete-facing group labels and advanced anatomical detail.
- [x] Add a compact muscle-role methodology control, concise boundaries, ranked sources, and direct/indirect evidence labels without repeated disclaimer walls.
- [ ] Establish reusable typography, color, spacing, radius, border, icon, button, safe-area, and floating-control tokens for the unified dark-performance and light-lab system.
- [ ] Compress mobile header context and breadcrumbs; standardize compact context controls, relevant primary actions, touch targets, and safe-area spacing.
- [ ] Audit every primary screen for overflow, accidental horizontal scrolling, inconsistent color meaning, clipped long labels, and small tap targets at small, medium, and large iPhone widths.
- [x] Add recommendation-purpose and evidence-confidence labels, compact tappable source access, clear evidence-gap states, and explicit sport-practice specificity boundaries.
- [x] Add compact evidence-confidence text to each visible Key Muscle Roles row, not only the selected-muscle inspector.
- [x] Remove the remaining Low/Medium/High gradient legend path and numeric heat color logic from Body Lab, retaining categorical role colors even when an exercise or stack score exists.
- [x] Add evidence-confidence text to Vector Anatomy fallback role controls so fallback Body Lab views use the same confidence semantics as the main map.
- [x] Add regression coverage proving Vector Anatomy fallback role controls include both qualitative role and evidence-confidence context.
- [x] Audit Body Lab selected-state styling so it remains visually distinct from qualitative role color without implying measured activation intensity.

- [x] Push all current Gym Optimizer code, tests, research records, and data additions to LocalForgeWeb/Sports-genome and verify the remote branch is synchronized.
- [x] Push the latest validated progressive-training, RPE, and segment-priority updates to LocalForgeWeb/Sports-genome and verify the remote branch tip.
- [x] Push the latest validated mobile Training Day action-layout repair to LocalForgeWeb/Sports-genome and verify the remote branch tip.
- [x] Push the latest validated segment-priority review and optional exercise-addition updates to LocalForgeWeb/Sports-genome and verify the remote branch tip.
- [x] Commit and push the actual within-athlete segment progress dashboard source and test changes to LocalForgeWeb/Sports-genome, then verify the remote history includes those files.
- [x] Verify GitHub main history includes the all-sport modifier evidence source and test files before recording the synchronization complete.
- [x] Push the latest validated signed-in passkey management update to LocalForgeWeb/Sports-genome and verify the remote checkpoint history includes its source and regression files.
- [x] Push the latest authenticated RPE logging contract coverage to LocalForgeWeb/Sports-genome and verify the remote history includes the contract test.
- [x] Add optional athlete bodyweight context and explicit within-athlete normalization boundaries to progression proxies, or narrow the UI copy to load/repetition context only.
- [x] Add actual RPE inputs to the set-log schema, workout logger, and progression-history API with a conservative high-effort hold guardrail.
- [x] Add focused RPE-aware model coverage for the add-repetition branch alongside repeat, add-load, hold, and reduce-load cases.
- [x] Add an athlete-facing progression review integration test showing returned history records with high actual RPE change the visible recommendation.
- [x] Add a higher-level authenticated logging test that records actual RPE, retrieves progression history, and verifies the returned effort value.
- [x] Normalize real catalog muscle labels for anterior, lateral, and posterior deltoid segment signals and add catalog-based regressions.
- [x] Build a true weekly progress review with week-bucketed trend comparison, segment-priority review, and plan-adjustment opportunities.
- [x] Integrate approved progression and segment-priority suggestions into the planner as athlete-confirmed changes, never silent automatic rewrites.
- [x] Add a bounded within-athlete segment progress index to weekly review cards, explicitly distinguished from direct muscle-strength measurement or cross-person ranking.
- [x] Integrate athlete-confirmed exercise progression recommendations into the planner as saved next-session notes, never as silent automatic rewrites.
- [x] Add athlete-confirmed segment-priority suggestions that adjust future planner emphasis without altering an existing plan silently.
- [ ] Add unit, component, and live-workflow validation for progression recommendations and segment-level plan adjustments.
- [x] Verify the GitHub backup inventory includes all tracked Gym Optimizer code, tests, research records, datasets, and project tracking files; document intentionally local-only exclusions.
- [x] Add a split-aware Rate Stack with split-only muscle coverage scores, gap flags, overemphasis flags, and catalog-backed correction advice.
- [x] Replace the compact Rate Stack block with a dedicated whole-stack analysis view that maps all worked muscles, ranks involvement, and opens per-muscle detail across the active Training Day.
- [x] Repair Stack Analysis so each selected muscle has distinct aggregate involvement and movement-specific mechanical detail instead of a shared normalized breakdown.
- [ ] Run and document a focused bug sweep across onboarding, Training Days, Stack Analysis, Body Lab, catalog discovery, mobile layout, and authenticated history.
- [x] Inspect StackAnalysisPage and CatalogDiscoveryPanel directly, resolve or explicitly reject prior audit candidates with source evidence, and add focused regression coverage where needed.
- [ ] Perform and document a mobile-layout bug sweep across populated Training Day, Stack Analysis, Body Lab, and catalog flows, separating code-verified findings from device-only limits.
- [ ] Expand the bug-sweep record to cover authenticated-history and Training Day behavior, with a clear distinction between source-verified safeguards and live-device-only checks.
- [ ] Run an end-to-end authenticated workout: start a session, save set logs, complete it, and confirm the resulting timeline entry.
- [ ] Visually verify the populated mobile Training Day action-card layout after the latest control redesign and record the result in the bug-sweep report.
- [x] Guard sport-movement selection against an invalid persisted sport identifier so recommendation rendering cannot dereference an undefined movement.
- [x] Audit all athlete-facing numeric exercise, set, repetition, volume, and stack-analysis fields against authoritative resistance-training evidence.
- [x] Extract every study and source cited in the user-provided training material, verify each against the original evidence, and map only validated findings to calibration logic.
- [x] Build a source-backed evidence register for all 20 sport profiles and the exercise catalog, including sport biomechanics and exercise-mechanics findings.
- [ ] Recalibrate sport-action and exercise insight models only where evidence supports the adjustment, while preserving explicit planning-inference boundaries.
- [x] Recalibrate cable resistance profiles as setup-dependent moment-arm tasks rather than universally shortened-range exercises.
- [x] Distinguish active rotation from anti-rotation/bracing in the Exercise Genome joint-action model and add focused regression coverage.
- [x] Differentiate cable resistance profiles by setup, body position, and movement pattern instead of applying a universal cable fallback.
- [x] Add focused cable fly, row, press, and curl regression coverage showing setup-dependent profile differences.
- [x] Present evidence coverage and source limitations clearly in the Movement Atlas and Exercise Genome rather than implying individual measurements.
- [x] Extract and verify the 100 studies in the new sport-science packet, recording the evidence scope, source quality, and unresolved limits for each sport.
- [x] Extract and verify the 100 studies in the new exercise-science packet, distinguishing direct longitudinal or biomechanics findings from EMG-only evidence.
- [x] Extract, deduplicate by PMID, and verify the supplied sprint, acceleration, force-velocity, RFD, power, plyometric, COD, and repeated-sprint evidence packet.
- [x] Add source-bounded sprint and power findings to athlete-facing Movement Intelligence disclosures without treating F-V profiling as deterministic individualized prescription.
- [x] Integrate verified sprint and power evidence boundaries into actual exercise-transfer and recommendation model outputs.
- [x] Add registry and recommendation-model regression coverage for RFD, power, plyometric/reactive-strength, and F-V uncertainty behavior.
- [x] Add athlete-facing component-render coverage for RFD, power, and reactive-strength uncertainty disclosures.
- [x] Audit existing muscle-targeting scores, weight fallbacks, and athlete-facing labels against the requested causal mechanics pathway.
- [x] Materially incorporate the causal mechanics pathway into the muscle-targeting rank rather than exposing it only as explanatory metadata.
- [x] Strengthen direct longitudinal evidence precedence over mechanics-only inference in the final targeting rank.
- [x] Render muscle-targeting evidence tier, uncertainty, and the key conditional mechanics factors in athlete-facing Exercise Genome detail.
- [x] Add stable component-render regression coverage for athlete-facing muscle-targeting disclosures.
- [x] Extract and verify the supplied muscle-architecture and musculoskeletal-modeling studies, separating foundational mechanics from direct athlete or exercise evidence.
- [x] Add source-bounded architecture, moment-arm, antagonist-coactivation, and model-uncertainty rules to anatomy and Exercise Genome mechanics disclosures.
- [x] Add regression coverage proving anatomy and Exercise Genome surfaces preserve the new measurement and model-inference boundaries.
- [x] Populate distinct shared range-of-motion evidence descriptors for full, long-length partial, short-length partial, individualized, and setup-dependent contexts where the verified packet supports each label.
- [x] Render calibrated study notes and counterevidence in athlete-facing Exercise Genome detail.
- [x] Render calibrated study notes, ROM context, sources, and counterevidence on catalog exercise-inspection surfaces.
- [x] Add stable component-render coverage across calibrated exercise families and modality examples, including the catalog inspection route.
- [x] Expose and test the full hierarchy path in athlete-facing planning, including the distinct physical-quality layer.
- [x] Add evidence-bounded position, event, stroke, distance, and style modifiers for the sports specified in the new schema.
- [x] Separate exercise-to-movement transfer similarity from muscle targeting and distinguish general, special, and highly specific physical preparation.
- [x] Add direct Home smart-draft and generated-week integration tests proving typed hierarchy priorities alter constructed outputs.
- [x] Expose physiological demand, adaptation target, modality choice, exercise role, and programming context as distinct source-bounded layers in athlete-facing recommendations.
- [x] Add the hierarchy layers and explicit planning-boundary language directly to recommendation rows, smart drafts, and generated stack explanations.
- [x] Add focused smart-draft and generated-week surface tests asserting movement, demand, physical quality, adaptation, modality, exercise role, and programming are all visible.
- [x] Expand modifier coverage to the requested football positions, hockey roles, track events, and swimming stroke/distance splits with source metadata.
- [x] Add tests proving modifier-aware recommendations change downstream exercise and programming outputs rather than only Atlas explanations.
- [x] Add an editable athlete-selected sport role, event, stroke, distance, or style modifier to baseline persistence and About Me.
- [x] Use the saved athlete modifier in automatic stack construction and disclose its evidence-bounded influence on the recommended session.
- [x] Attach sport/modifier-specific evidence metadata, source identifiers, or reviewed evidence ranges to football, hockey, track, and swimming modifiers.
- [x] Surface modifier-specific source metadata in Movement Atlas and recommendation context with regression coverage for expanded modifiers.
- [x] Add concrete evidence references or reviewed evidence ranges directly to each football, hockey, track, and swimming modifier record.
- [x] Render selected modifier sources in athlete-facing recommendation, smart-draft, and generated-stack context.
- [x] Add integration coverage proving modifier source metadata appears in the actual recommendation workspace.
- [x] Explicitly render selected modifier evidence sources on smart-draft and generated-stack UI surfaces, not just recommendation context data.
- [x] Add integration coverage proving modifier source metadata appears on the actual smart-draft and generated-week planning surfaces.
- [x] Add an editable Athlete Baseline intro-quiz sequence for experience level, goal, optional bodyweight, and preferred units.
- [x] Keep baseline measurements optional, editable, and explicitly scoped as planning context rather than health or ability scores.
- [x] Add resilient Back and Continue navigation to every intro-quiz step, including progress updates and preserved answers.
- [x] Add reduced-motion-safe question transitions and supported-device haptic feedback for selections and navigation.
- [x] Add an optional, editable preferred-name intro step that personalizes the quiz and final preview.
- [x] Add a final animated plan-preview screen with Back, Skip, and Build my plan controls before onboarding completion.
- [x] Start the intro quiz with a training-relevant goal or sport decision before optional identity information.
- [x] Refine the Athlete Baseline visual hierarchy with field-manual evidence cues and reserve vermilion for decisive active actions.
- [x] Add explicit Athlete Baseline field-manual treatment: inspection labels, calibration ticks, annotated evidence markers, hairline dividers, and bone-paper answer surfaces.
- [x] Visually verify the refined Athlete Baseline quiz on mobile after adding the field-manual treatment.
- [x] Add question-specific evidence callouts and a consistent bone-paper answer-surface system across Athlete Baseline quiz choices.
- [x] Add editable gym-access and equipment selection to onboarding with clear preconfigured profiles and manual equipment toggles.
- [x] Persist equipment availability in the athlete profile and use it to constrain automatically generated recommended stacks.
- [x] Keep the full exercise catalog visible for manual inspection and manual addition, even when an exercise uses unselected equipment.
- [x] Disclose the active equipment constraint wherever a stack is generated or loaded.
- [x] Add an About Me section for viewing and editing athlete baseline, gym access, and equipment.
- [x] Add standalone Gym Optimizer email/password account registration and sign-in with no Manus-facing login option.
- [x] Store credential secrets securely, enforce validation and rate-aware error handling, and preserve account-scoped workout data.
- [x] Add a supported-device passkey sign-in option, enabling Face ID or device biometrics where the platform supports it.
- [ ] Verify standalone email registration, sign-in, and device passkey enrollment on a live user device.
- [x] Remove any remaining global Manus redirect fallback so expired or unauthenticated requests stay in the standalone email-auth experience.
- [x] Add persistent passkey enrollment and management for existing signed-in email accounts, then cover email lockout and passkey option flows with focused auth tests.
- [x] Add a visible equipment-constraint notice to every automatic stack-generation or load surface, including Recommendations, Load smart draft, Generate Week, and the Training Days active day.
- [ ] Visually verify the equipment-aware Recommendations, Load smart draft, Generate Week, and Training Days active-day surfaces after explicit notices are added.
- [x] Audit all twenty sport movement profiles for biomechanical action, prime movers, stabilizers, and transfer rationale, correcting unsupported claims.
- [x] Add a maintained evidence register that labels planning estimates, source-supported facts, and unresolved research gaps.
- [ ] Report future evidence-backed work in completed, verifiable scopes rather than promised wall-clock duration.
- [ ] Before accepting any future requested multi-hour work duration, state whether that literal duration can be completed and report it accurately.
- [x] Expand sport-movement records only where the evidence audit identifies a material coverage gap, with source-aware rationale.
- [x] Label or recalibrate remaining hardcoded stack-coverage targets and involvement weights as planning estimates rather than measured physiology.
- [x] Apply evidence-audit corrections across the remaining sport profiles and record regression coverage for the corrected movement text.
- [x] Expand additional material sport-movement gaps identified in the multi-sport audit beyond the Wrestling profile.
- [x] Add a muscle-group filter to the direct Training Days exercise picker using full anatomical labels.
- [x] Repair the responsive Training Days prescription card layout so ordering, removal, prescription, completion, and notes controls do not overlap on mobile.
- [x] Rebuild the mobile Training Day action markup so prescription and remove controls occupy a dedicated row below exercise content on narrow screens.
- [x] Add a populated Training Day card render regression covering separate order, title, prescription, and removal action regions.
- [x] Add an in-context serratus discovery cue confirming that Cable Serratus Punch and Scapular Wall Slide are available.
- [ ] Visually verify the updated mobile Training Day card on a populated small-screen workout before closing the overlap repair.
- [x] Validate the split-stack test, complete Vitest suite, TypeScript check, and production build.
- [x] Add a one-click Rate Stack replacement action that preserves the outgoing exercise prescription and settings.
- [x] Analyze saved consecutive training days for overlapping high-exposure muscle demands and present transparent recovery-spacing alerts.
- [x] Expand authenticated completed-session history into a scannable chronological timeline with concise training-volume context.
- [x] Add a print-ready Training Day workout sheet with exercise prescriptions and coaching details.
- [x] Include each exercise’s saved coaching note and prescription-derived tracking rows in the printed workout sheet.
- [x] Test printable notes, four-set prescriptions, and timed work formatting.
- [x] Make serratus anterior exercise discovery explicit in the catalog and direct day builder, including a clear no-results fallback.
- [x] Repair the live serratus anterior discovery path so the quick filter, full-name search, and Body Lab finder always return tagged exercises.
- [x] Add a direct Exercise Genome-to-Body-Lab handoff for the selected exercise’s primary muscle.
- [x] Add compact Body Lab sport and movement navigation so athletes can switch or return to another movement without leaving the anatomy workflow.

- [x] Normalize the user-supplied movement lists for wrestling, American football, basketball, soccer, and baseball.
- [x] Normalize the movement lists for track and field, swimming, tennis, volleyball, and boxing.
- [x] Normalize the movement lists for MMA, Brazilian jiu-jitsu, ice hockey, lacrosse, and rugby.
- [x] Normalize the movement lists for golf, gymnastics, rowing, skiing, and Olympic weightlifting.
- [x] Research movement families, body actions, muscle demands, and exercise-transfer constraints for all twenty profiles.
- [x] Create a typed sport-movement-muscle database with transparent transfer signals and no medical-performance guarantees.
- [x] Recalculate exercise sport fit using movement-level matches and present the reasoning in the interface.
- [ ] Test database filtering, sports views, details panels, and responsive layouts.
- [x] Add model and component-render coverage for sport database family/search filtering, sport-switch controls, movement details, and the Body Lab handoff.
- [ ] Visually verify the Movement Atlas at desktop and mobile breakpoints after the database filtering coverage update.
- [x] Redesign navigation for rapid switching between command, workouts, catalog, sport movements, and body analysis.
- [x] Add a premium athlete-and-coach visual system with clearer hierarchy, performance metrics, and coach-ready views.
- [x] Expand the body model with click-to-inspect muscle roles, linked sport movements, and exercise recommendations.
- [x] Build distinct recommended-workout and custom-workout flows with editable session contents.
- [x] Validate the new navigation, workout builder, body analysis, and responsive interactions.
- [x] Add a blank first-visit state that opens a short personalized onboarding flow.
- [x] Capture training goal, available training days, selected sport, and preferred planning mode in the quiz.
- [x] Add a custom-stack versus suggested-stack decision with a clear skip path.
- [x] Add a short in-app tutorial for navigating the command center, movement atlas, body lab, and workout builder.
- [x] Shift the premium visual system toward a performance-blue accent while keeping clear navigation and contrast.
- [ ] Validate the quiz-to-workspace path and personalized suggested-session initialization.
- [x] Extract the Exercise Genome specification into intrinsic, contextual, visual, and recommendation requirements.
- [x] Define multi-dimensional exercise records for muscle, movement, joint actions, resistance curve, adaptation, stability, skill, fatigue, mobility, and practicality.
- [x] Implement contextual scoring that combines intrinsic exercise data with athlete, goal, program, and sport-movement context without using a single generic score.
- [x] Build the Exercise Genome analysis view with progressive disclosure, visual comparisons, and interactive anatomical explanations.
- [x] Connect Genome insights to exercise catalog details, body map interactions, sport movement recommendations, and workout stack decisions.
- [ ] Validate the Genome data model, contextual explanations, and user-facing visuals.
- [x] Replace the field-manual onboarding treatment with a more modern, playful quiz-first product flow.
- [x] Make the quiz the default entry screen and remove the pre-quiz product-tour emphasis.
- [x] Add clear quiz progress, lively selection feedback, and a smooth completion transition into the personalized workspace.
- [x] Refresh navigation, cards, typography, color, and motion so the workspace feels current and enjoyable to use.
- [x] Validate the full quiz-to-workspace journey across desktop and mobile layouts.
- [x] Define a detailed muscle-atlas scope with named subdivisions, front/back placement, roles, and evidence labels.
- [x] Research functional actions for shoulder, trunk, arm, hip, thigh, lower-leg, chest, and back muscle subdivisions from authoritative anatomy and biomechanics sources.
- [x] Replace broad anatomical regions with precise named muscle records and full scientific labels in the interface.
- [x] Build a high-detail front/back interactive body map with distinct clickable muscle subdivisions, including anterior, middle, and posterior deltoid regions.
- [x] Link each selected muscle region to primary actions, sport-movement relevance, supporting exercises, and evidence-confidence notes.
- [x] Replace abbreviated Genome dimension labels with full terms and explicitly label standardized estimates versus directly measured evidence.
- [x] Validate atlas interactions, front/back switching, mobile readability, and factual-boundary disclosures.
- [x] Apply a consistent blue interface with gold-and-white logo and secondary accents.
- [x] Use the user-supplied reference only as a visual blueprint for a front/back labeled anatomy layout; create an original atlas illustration and labels.
- [x] Add a pasted-stack import flow that recognizes exercise names and optional set/rep notation, previews matched and unmatched items, and imports confirmed matches.
- [x] Expand custom workout programming controls to include sets, repetitions or time, load/RPE, rest, and notes.
- [x] Expand the onboarding schedule selector and recommendation logic from one through seven training days per week.
- [x] Validate blue/gold contrast, atlas detail, import parsing, programming edits, and seven-day plans.
- [x] Define diverse plan-loadout templates with distinct exercise pools, movement priorities, and session structures.
- [x] Add a day-strip control that cycles through split days such as push, pull, legs, upper, lower, full body, and sport-specific sessions.
- [x] Make split selection adapt to the chosen training frequency while preserving manual day overrides.
- [x] Simplify the detailed anatomy map visual hierarchy and reduce unnecessary surface clutter while preserving named subdivisions.
- [ ] Improve interface responsiveness by reducing visual density and using smoother transitions for tab, day, and loadout changes.
- [ ] Validate day cycling, loadout variety, anatomy readability, and responsive interactions.
- [ ] Replace the current single-toggle anatomy view with a simultaneous front-and-back anatomy board.
- [ ] Add original anatomy callout cards with connection lines, full muscle names, role tags, and relevance intensity labels.
- [ ] Keep the reference-inspired layout original rather than copying its illustration, labels, or visual assets.
- [ ] Preserve click-to-select regions and link selected anatomy to exercise and sport-action rationale.
- [ ] Make the dual-view anatomy board readable on desktop and collapse its callout layout gracefully on mobile.
- [x] Create plain-language definitions for Hypertrophy, Strength, Power, Stability, Mobility, Skill, and Practicality.
- [x] Explain the intrinsic exercise characteristics and contextual inputs that influence every Genome dimension without presenting the values as direct laboratory measurements.
- [x] Make every displayed Genome dimension label clickable from the fingerprint and metric list.
- [x] Add clear labels and a readable legend to the fingerprint chart so each spoke, dimension, and intensity value can be identified at a glance.
- [ ] Validate term dialogs, keyboard access, fingerprint labels, and mobile readability.
- [ ] Recompose each anatomy half so the figure is centered and callouts sit around the outside perimeter rather than in a stacked grid.
- [ ] Add visible connector lines from individual muscle regions toward their corresponding callout cards on desktop.
- [ ] Preserve a side-by-side anterior/posterior comparison on desktop and use a compact figure plus stacked label cards on mobile.
- [ ] Match the clarified reference’s information hierarchy while retaining original Gym Optimizer vector figures, colors, labels, and interactions.
- [ ] Validate the anatomy board against desktop and mobile reference compositions before delivery.
- [ ] Replace the dense twelve-card-per-side arrangement with a sparse flanking-label anatomy layout.
- [ ] Increase figure scale substantially and reserve most horizontal space for each centered anterior/posterior figure.
- [ ] Position callout cards outside the visual figure zone with long visible leader lines terminating near target muscle regions.
- [ ] Use a true comparison-board composition that makes the reference influence immediately visible, not only a CSS spacing adjustment.
- [ ] Capture a Body Lab verification view before delivery and confirm that the change is visually substantial.
- [ ] Hide anatomical regions with no direct or supported role for the selected exercise rather than presenting them as low engagement.
- [ ] Keep only primary, secondary, and clearly relevant stabilizing muscles visible, with lower-relevance roles disclosed in text rather than painted on the model.
- [ ] Repair the deployed anatomy illustration asset so the detailed model renders reliably in the published app.
- [x] Reset persisted onboarding sport state so no sport is preselected on first use or after a reset.
- [x] Add a prominent sport-switch control in the workspace and verify recommendations refresh after sport changes.
- [ ] Validate a shoulder-isolation exercise, asset rendering, onboarding reset, and sport switching in the live app.
- [x] Audit all Muscle Genome and Mechanics labels to identify terms that still lack a click-to-learn definition.
- [x] Add full definitions, score inputs, interpretation guidance, and evidence boundaries for every Muscle Genome and Mechanics term.
- [x] Make each Muscle Genome and Mechanics label discoverable and keyboard-accessible from the Exercise Genome panel.
- [x] Add an in-app vector anatomy fallback that remains visible if the external anatomy illustration fails to load.
- [ ] Validate the learning dialog from Muscle Genome and Mechanics tabs plus the image-failure fallback in the live app.
- [ ] Audit every existing sport movement record for muscle roles, joint actions, exercise recommendations, and data gaps.
- [ ] Conduct a deep wrestling expansion across stance, hand-fighting, level change, penetration, shots, sprawls, lifts, turns, mat returns, bridges, and grip fighting.
- [ ] Enrich all 400 sport-movement records with named prime movers, assisting muscles, stabilizers, contraction roles, joint actions, and transferable exercise rationale.
- [x] Build an evidence-aware redundancy model that distinguishes useful overlap from low-value duplicate movement, muscle, fatigue, and skill demands.
- [x] Show movement-specific muscle use and ranked supporting exercises from every sport movement detail view.
- [x] Add a program-level coverage report that identifies movement gaps, redundant exercise clusters, and high-value additions.
- [ ] Validate wrestling movement depth, cross-sport movement coverage, redundancy flags, and recommendation explanations.
- [ ] Audit the onboarding, recommended plan, custom-builder, anatomy, movement atlas, catalog, Genome, import, and sport-switch user journeys.
- [ ] Identify and resolve data-model gaps in sport movement, muscle coverage, program load, exercise matching, and recommendation explanations.
- [ ] Add higher-value personalization and planning controls that improve weekly program construction and adaptation.
- [ ] Improve workout-level insight with volume, movement balance, fatigue exposure, and actionable redundancy resolution.
- [ ] Improve discoverability, empty states, responsive layouts, keyboard access, motion, and visual consistency across the app.
- [ ] Audit client performance and eliminate unnecessary rendering, oversized views, and interaction friction where practical.
- [ ] Test first visit, sport switching, recommended workouts, custom planning, imports, anatomy, Genome lessons, and movement analysis end to end.
- [ ] Audit each primary workspace for text density, repeated metadata, competing headings, and unclear reading order.
- [ ] Create concise top-level summaries for Command Center, custom planning, Body Lab, Movement Atlas, catalog, and Exercise Genome.
- [ ] Move secondary evidence, full lists, and long explanations behind expandable details or focused inspection panels.
- [ ] Improve typography scale, line length, spacing, label contrast, and section rhythm for rapid scanning.
- [ ] Simplify navigation labels and introduce context-aware subnavigation where it reduces cognitive load.
- [ ] Validate readability and task completion on desktop and mobile after the information-architecture refresh.
- [ ] Audit and document the correct destination workspace for planning, movement research, exercise intelligence, and anatomy information.
- [ ] Simplify navigation labels and route each primary action to its most useful workspace without duplicated panels.
- [x] Expand pasted-routine support to recognize workout titles, day labels, exercise lines, sets, repetitions, time, RPE, rest, and notes.
- [x] Add a clear parsed-routine preview with match confidence, unmatched-line feedback, and a confirm-to-load handoff into Custom Builder.
- [x] Ensure imported routines populate editable prescriptions, weekly plan days, and builder context rather than only adding loose exercises.
- [ ] Validate import of multi-day and single-session pasted routines alongside navigation and responsive task flows.
- [ ] Audit the fixed Training Day drafting dock and identify all screen-obstruction cases across desktop and mobile.
- [x] Replace the blocking dock with a compact movable or repositionable planning tab that can be dismissed and reopened.
- [x] Persist the tab’s open/closed state and keep it reachable from Custom Builder without covering active programming controls.
- [x] Add a concise post-quiz feature tour covering Command Center, recommendations, Custom Builder, Body Lab, Movement Atlas, and Exercise Genome.
- [x] Make the feature tour skippable, restartable, and respectful of returning users’ saved preferences.
- [ ] Validate drag or reposition behavior, dismissal, reopening, tutorial progression, keyboard use, and mobile clearance.
- [ ] Replace the callout-heavy Body Lab layout with a body-first three-panel atlas: controls, large anatomy canvas, and on-demand inspector.
- [ ] Create a normalized muscle-region data model with region IDs, layer, front/back view, role, involvement, tier, and evidence-aware metrics.
- [ ] Add front/back, surface/deep, role, threshold, search, reset, and optional compare controls without cluttering the anatomy canvas.
- [ ] Build hover tooltips, selected-muscle dimming, an inspector panel, and a sortable involved-muscles disclosure list.
- [ ] Use a single involvement heat scale on the body, reserving role information for text, filters, and inspector badges.
- [ ] Add optional comparison and range-of-motion demand views while keeping the default Body Lab simple.
- [ ] Implement mobile anatomy-first layout with a compact control bar and selected-muscle bottom sheet.
- [ ] Finish and validate the movable planner tab plus the post-quiz, restartable feature tour.
- [ ] Validate data-driven anatomy rendering for exercises, sport movements, and workout stacks across desktop and mobile.
- [ ] Audit selected Pulse Quiz cards to identify every checkmark, number, or tag overlap at desktop and mobile breakpoints.
- [ ] Reposition or restyle the selected-state check indicator so it remains clear of headline, description, and technical-label copy.
- [x] Expand the six-step overview into a task-based tutorial with practical walkthroughs for onboarding, recommendations, Custom Builder, imports, Body Lab, Movement Atlas, Exercise Genome, and sport switching.
- [x] Add readable lesson grouping, plain-language controls, navigation shortcuts, and restart/skip behavior to the detailed tutorial.
- [ ] Validate the quiz selected state, tutorial progression, keyboard controls, and responsive readability before delivery.
- [ ] Replace all simplified or rectangular muscle regions with individually addressable, anatomically contoured front and back SVG muscle paths.
- [ ] Make one large anatomy figure the default focal point, with Front/Back as an obvious view switch rather than simultaneous cramped figures.
- [ ] Add numerical heat-map intensity driven by muscle involvement and reserve Primary, Synergist, and Stabilizer roles for badges and filters.
- [ ] Reduce the left controls to view, layer, search, and filter essentials; move role and threshold controls into Advanced filters.
- [ ] Add hover tooltips, click-to-lock selection, dimming, a visible outline, focus/reset behavior, and a compact heat legend under the figure.
- [ ] Replace permanent metric bars with a progressive inspector showing role, score/tier, three metrics, a short explanation, and expandable full analysis.
- [ ] Add a top-muscles ranking strip that selects the matching anatomical muscle region.
- [ ] Implement anatomy-first mobile layout with a compact toolbar and selected-muscle bottom sheet.
- [ ] Validate anatomical shape recognition, selection clarity, no overlaps, default scanability, and desktop/mobile visual hierarchy.

## Workspace Readability and Cohesion Pass

- [x] Replace the remaining base-stylesheet neon rail active-state token with the established Sports Genome active palette.
- [x] Remove the duplicate legacy Movement Atlas branch so athletes see only the canonical compact action-discovery experience.
- [x] Replace remaining athlete-facing legacy neon-green command and inspection accents with Sports Genome gold, workflow blue, and vermilion semantic tokens.
- [x] Remove the duplicate legacy Custom Builder workspace branch so the athlete sees one coherent builder rather than competing repeated panels and controls.
- [x] Audit the support-exercise panel and every primary workspace for text collisions, clipped labels, and obstructed controls.
- [x] Correct line-height, row structure, responsive spacing, and overflow behavior without changing existing product content.
- [x] Strengthen card hierarchy, interactive states, and visual rhythm to make the workspace feel more cohesive and engaging.
- [x] Validate representative desktop and mobile views before publishing the readability update.

## Mobility and Programming Intelligence

- [x] Research dynamic warm-up, mobility, and resistance-training programming guidance from credible coaching and sport-science sources.
- [x] Create a structured library of at least 60 warm-up mobility drills with movement demands, tissues, dose ranges, and caution flags.
- [x] Build exercise-aware warm-up recommendations that use the current stack’s movement patterns and training goal.
- [x] Add transparent set, repetition, RPE, rest, and volume diagnostics that identify excessive or incomplete programming.
- [x] Repair routine import so set headers, warm-up text, RPE instructions, and rest notes are preserved as prescription context rather than parsed as exercises.
- [x] Validate varied multi-day pasted routines and publish the completed workflow.

## Weekly Volume and Import Confidence

- [x] Inspect saved weekly-plan, prescription, and catalog muscle data to define a transparent per-muscle weekly volume estimate.
- [x] Aggregate direct and supporting exercise exposure across saved weekly days with an explicit estimation boundary.
- [x] Add a readable weekly muscle-volume view with targets, current totals, and day-level contribution context.
- [x] Add import confidence levels and candidate matches for exact, likely, ambiguous, and unmatched routine lines.
- [x] Let the user accept, replace, or keep unresolved an imported exercise match before loading a routine.
- [x] Validate volume updates after saving days and manual import corrections across desktop and mobile.

## Dedicated Training-Day Design Flow

- [x] Review the current weekly day rail, planner tab, custom-builder controls, and stack-import entry point.
- [x] Create a dedicated training-day workspace that clearly separates day selection, day design, saved prescriptions, and weekly overview.
- [x] Place the stack-import action inside the day-design workspace and preserve its parsed routine review.
- [x] Ensure opening a saved day restores that day’s intended exercise stack and prescriptions before editing.
- [x] Integrate the weekly per-muscle volume view into the dedicated planning workspace without crowding day design.
- [x] Validate day switching, import-to-day flow, confidence correction, and mobile layout before publishing.

## Product-Quality UX/UI Refinement

- [x] Audit primary pages, navigation, cards, badges, filters, empty states, and mobile layouts against the supplied conclusion-first product brief.
- [x] Establish documented tokens for typography, spacing, surface hierarchy, buttons, tiers, score displays, and expandable analysis.
- [x] Consolidate primary navigation into clear user destinations while keeping technical systems accessible as deeper exploration.
- [x] Refactor recommendation reasoning so each exercise communicates a distinct score-derived reason and expandable ranking breakdown.
- [x] Translate movement and program data into immediate coverage conclusions with optional deeper requirements and evidence views.
- [x] Apply consistent tap/inspect, add, expand, save, and secondary-action interaction patterns across high-value screens.
- [x] Improve mobile hierarchy, touch targets, visibility of key actions, and empty states without removing data or shortcuts for advanced users.
- [x] Validate desktop and mobile experience, production build, and data preservation before publishing the refinement.

## Authenticated Workout Logging

- [x] Upgrade the project with user accounts and a database suitable for account-scoped training history.
- [x] Define workout session, exercise-entry, and set-log records that preserve planned and actual training data.
- [x] Add sign-in-aware entry points and a clear account state in the workspace.
- [x] Add Start Workout, per-set actual weight and repetitions, set completion, and Finish Workout interactions.
- [x] Persist completed workout sessions and display a concise account-scoped training history.
- [x] Validate authentication, account isolation, saved sessions, mobile set logging, and completion flows before publishing.

## Import Navigation and Home Preferences

- [x] Audit the paste-plan dialog layout and overflow behavior across mobile and desktop viewports.
- [x] Make parsed plan previews and confidence review independently scrollable while keeping import controls reachable.
- [x] Add clear Home controls for changing sport, training goal, and available training days without rebuilding onboarding.
- [x] Validate preference persistence, recommendation refresh, import navigation, and mobile touch behavior.

## Gym-Time Planning Budget

- [x] Audit profile persistence, session recommendation generation, and diagnostics for a reusable time-available input.
- [x] Define practical gym-time bands and transparent exercise-count, set-volume, and rest-budget behavior for each band.
- [x] Add a time-available selector to Home and retain the selected budget in the athlete profile.
- [x] Adapt session recommendations, smart drafts, and planning diagnostics to the selected gym-time budget.
- [x] Validate time-budget persistence, estimated session length, and responsive control behavior before publishing.

## Sport-Relevant Exercise Catalog Expansion

- [x] Research 100 familiar exercises with a strong emphasis on cable variations and sport-relevant movement patterns.
- [x] Verify primary muscles, supporting muscles, movement patterns, equipment, and physical qualities for every added exercise.
- [x] Add the 100 structured exercise records to the catalog without duplicate names or IDs.
- [x] Confirm added cable options participate in catalog search, recommendation scoring, warm-up inference, and workout planning.
- [x] Validate catalog counts, cable coverage, TypeScript, and production build before publishing.

## Authenticated Three-Week Planning

- [x] Inspect current account entry, saved training days, plan persistence, and session-generation flows for multi-week support.
- [x] Define up to three named weeks that each preserve stored day exercise stacks, prescriptions, and imported plan context.
- [x] Add a clear Generate Week action and visible Week 1–Week 3 switcher to the planning workflow.
- [x] Ensure switching weeks restores that week’s saved days without overwriting another week.
- [x] Make sign-in or account creation the first actionable entry point before onboarding and plan construction.
- [x] Validate three-week generation, account-first entry, persistence, responsive controls, and production build before publishing.

## Passkey and Biometric Account Access

- [x] Inspect the supported Manus OAuth account flow and browser WebAuthn capability for passkey and Face ID access.
- [x] Document the secure integration boundary and maintain an OAuth sign-in fallback for unsupported devices.
- [x] Add an accurate passkey or biometric entry path only where the account provider supports credential enrollment and verification.
- [x] Validate supported-device messaging, fallback sign-in, and account safety before publishing.

## Interface Restoration with Catalog Retention

- [x] Restore the pre-simplification interface checkpoint while retaining the 400-exercise catalog expansion and cable-focused data.
- [x] Validate the restored interface and confirm the expanded catalog remains available before publishing.

## Catalog Search and Favorites

- [x] Audit catalog data fields, existing catalog controls, and local or account-based preference storage.
- [x] Add text search and clear filters for muscle group, movement pattern, equipment, sport relevance, and favorite status.
- [x] Add favorite and unfavorite controls to catalog records and a focused Favorites view.
- [x] Persist favorites for signed-in athletes, with a graceful device-local fallback before sign-in.
- [x] Add favorites-to-builder handoff and validate search, filters, persistence, and mobile use before publishing.

## GitHub Source Push

- [x] Verify refreshed repository authorization and push the complete current source to LocalForgeWeb/Sports-genome.

## Split Category Integrity

- [x] Audit draft and weekly-generation logic for Push, Pull, Legs, Upper, Lower, Full Body, and Sport Transfer category leakage.
- [x] Define strict exercise-category matching and safe sport-transfer exceptions for every split day.
- [x] Apply category-safe selection to drafts and generated weeks, with automated split-integrity tests.
- [x] Validate all split-day outputs and saved-week behavior before publishing.

## Manual Training-Day Builder

- [x] Audit the current active-day editor and identify friction in adding exercises without importing a routine.
- [x] Add a searchable, filterable catalog picker directly inside Training Days for the selected active day.
- [x] Add direct add, remove, move up, and move down controls for custom day composition.
- [x] Keep per-exercise prescriptions editable and save the manually assembled day into the active week.
- [x] Validate manual day building across desktop, mobile, and week switching before publishing.

## Native iOS App Store Release

- [ ] Audit the recovered web product and define a native iOS athlete-app MVP that reuses the Sports Genome backend, catalog, workout data, and recommendation logic.
- [ ] Establish an Expo/React Native mobile application foundation with Sports Genome visual tokens, safe-area navigation, and shared data contracts.
- [ ] Build the core native athlete flows: account entry, onboarding, Training Day, workout set logging, catalog discovery, and account history.
- [ ] Add Sign in with Apple account creation and return sign-in using a secure configured Apple identity-provider flow while retaining email/password and device passkey access.
- [ ] Prepare App Store release configuration, privacy disclosures, application identifiers, native testing, icons/screenshots, and TestFlight submission prerequisites.

## Batch 2: Architecture, Moment Arms, Tendons, and Modeling

- [x] Inventory the uploaded architecture, moment-arm, tendon, force-length/velocity, and musculoskeletal-modeling studies by PMID, topic, priority, and proposed model use.
- [x] Deduplicate Batch 2 against existing Sports Genome evidence records and preserve new tags or relationships for already-known studies.
- [x] Verify high-priority Batch 2 studies against authoritative bibliographic sources and record only source-supported claims and limitations.
- [x] Reconcile verified Batch 2 findings with muscle-targeting, Exercise Genome, and Body Lab inference boundaries; avoid treating model outputs as direct individual measurements.
- [x] Implement only justified evidence registry, user-facing explanation, or mechanics-model updates with focused regression coverage.

## Batch 3: Sport-Specific Performance and Training Transfer

- [x] Inventory the uploaded sport-performance records by sport, position/event/style modifier, study identifier, evidence type, and proposed algorithm use.
- [x] Deduplicate Batch 3 study identifiers against the Sports Genome research records and note entries that require a complete citation before use.
- [x] Verify the highest-priority identifier-complete sport records against authoritative bibliographic sources and record only bounded sport-model implications.
- [x] Compare verified Batch 3 findings against existing sport and modifier records; keep sport, position, event, style, competition-level, and competition-context differences explicit.
- [x] Implement only justified sport-profile, quality-priority, athlete-facing disclosure, or recommendation-model updates with focused regression coverage.
- [x] Verify the remaining thirteen identifier-complete Batch 3 sport records against authoritative sources and record bounded findings, safe uses, and limitations.
- [x] Reconcile the complete Batch 3 record set with existing sport profiles and modifiers, implementing only additional source metadata or transparent boundary clarifications justified by those records.

## Navigation Reliability and Placeholder Removal

- [x] Audit every side-navigation item, including its click handler, keyboard behavior, active state, and intended destination workspace.
- [x] Repair side navigation so each visible destination is reachable by pointer and keyboard and opens a usable non-placeholder workspace.
- [x] Remove or replace remaining athlete-facing placeholder language, dead-end actions, and nonfunctional destination states.
- [ ] Validate side navigation and destination behavior on desktop and mobile, including touch, keyboard focus, and browser history handling.

## Mobile-First Information Hierarchy

- [x] Collapse sport-modifier evidence and Sport-to-Program hierarchy details behind compact one-tap summaries while retaining all source and methodology content.
- [x] Replace the cramped mobile exercise catalog grid with a full-width ranked result list, sticky search, and compact filter/sort controls.
- [x] Compress the mobile sticky header to preserve sport, goal, training-day, and Design Day context within a compact two-row layout.
- [x] Tighten Exercise Genome and Body Lab mobile layout, tabs, score treatment, anatomy focus, and selected-muscle information without removing data.
- [x] Reduce the floating guide control to a safe-area-aware compact help affordance that never blocks training controls.
- [x] Standardize mobile touch targets, card density, disclosure behavior, typography, score bars, and visual hierarchy across affected athlete workflows.
- [ ] Validate mobile hierarchy, no-overflow behavior, readable catalog results, and reachable controls at 375px, 390px, 402px, and 430px.
