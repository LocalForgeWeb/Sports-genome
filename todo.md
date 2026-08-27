# Sport Movement Database Expansion

## Strength Genome

- [ ] Reconcile the full user-supplied Strength Genome specification with the current athlete profile, exercise catalog, evidence registry, and workout-planning architecture.
- [ ] Define a longitudinal athlete profile and strength-observation schema that preserves dated body-mass context, measured inputs, testing conditions, and data-quality metadata.
- [ ] Build source-traceable mappings from standardized exercise observations to functional strength domains and from domains to anatomical-region presentation layers.
- [ ] Add only verified normative-reference data with explicit population, normalization, age/sex, measurement-method, and coverage limits; render no percentile where a valid reference is absent.
- [ ] Implement transparent continuous strength estimates, discrete F-to-SS+ tiers, estimate confidence, imbalance logic, sport relevance, and editable athlete-confirmed training priorities without representing estimates as direct measurements.
- [ ] Create the mobile-first Strength Genome body-profile interface, regional detail flow, lift/test entry workflow, and planning handoff using source-bounded labels and no fabricated performance-transfer claims.
- [ ] Add unit, component, schema, and integration coverage; validate accessible mobile layout, tier semantics, missing-data handling, and estimate/evidence boundaries before publication.

## iPhone-First Product Polish

- [ ] Establish one reusable Sports Genome mobile design system covering colors, elevation, radii, strokes, typography, spacing, interactive states, compact chips, and motion timing.
- [ ] Rework primary mobile navigation around daily athlete actions, with persistent bottom navigation for Home, Train, Genome, Progress, and Profile while retaining the drawer for secondary tools.
- [ ] Replace dense mobile headers and persistent tutorial clutter with compact contextual controls, clear screen titles, sport/goal chips, and first-use coach marks that can be dismissed.
- [ ] Redesign the Home screen around a truthful Today action, current-plan state, weekly rhythm, Strength Genome completion, and next-best actions without invented readiness or achievement data.
- [ ] Make recommendations, Body Lab, Exercise Genome, Training Days, and catalog rows concise, tappable, rankable, and progressively disclosed before methodology or deep evidence detail.
- [ ] Create visually distinct but semantically separate treatments for athlete strength tiers, exercise transfer matches, evidence confidence, incomplete data, PRs, and major milestones.
- [ ] Build a non-destructive Progress area for tier, PR, confidence, bodyweight-relative, imbalance, and body-map history only when valid saved observations support each view.
- [ ] Verify mobile layouts at small, standard, and large iPhone widths, including standalone PWA safe areas, keyboard behavior, long labels, horizontal-overflow safeguards, and authenticated workflows.

## Official App and Home-Screen Icon

- [ ] Replace the incorrect sidebar and app-icon logo treatment with the newly supplied official Sports Genome — Decoding Performance artwork, then verify its live references.
- [x] Inspect and remove or replace conflicting favicon, Apple touch icon, and manifest icon references.
- [x] Create official edge-to-edge deep-navy square Sports Genome icon assets at 180×180, 192×192, and 512×512 from the supplied artwork without an embedded rounded mask.
- [x] Add the official Apple touch icon link, standalone PWA manifest, deep-navy theme metadata, and matching PWA icon references.
- [x] Verify icon dimensions, opaque navy edge treatment, asset paths, manifest metadata, and published Safari Add to Home Screen configuration.
- [x] Publish the official icon update and verify the live deployed domain serves the new Apple touch icon and manifest paths.
- [ ] Confirm Safari Add to Home Screen icon behavior from a real iPhone, keeping this device-only check distinct from code-level verification.

## Evidence-to-Logic and No-Placeholder Audit

- [ ] Inventory every athlete-facing numeric score, threshold, weight, volume target, rating, recommendation constant, and visible placeholder across client, server, catalog, and sport data.
- [ ] Classify each inventoried value as source-backed, transparent product-design constraint, athlete-entered value, or unsupported placeholder; retain an evidence or rationale reference for each surviving value.
- [ ] Recalibrate, relabel, or remove unsupported fixed values and athlete-facing placeholders without representing planning estimates as direct scientific measurements.
- [ ] Add central traceability metadata and regression coverage so calibrated values, source boundaries, and non-placeholder states do not silently drift.
- [ ] Complete an exhaustive evidence-to-logic inventory across remaining client components, server auth/logging paths, catalog data, and sport-data records; record every athlete-facing numeric or placeholder surface.
- [ ] Extend the traceability registry so each surviving athlete-facing value has an explicit category and a per-value source link or product-design rationale.
- [ ] Finish the remaining recalibration/relabel pass for still-untracked constants or wording, then prove full-surface usage of named calibration through regression coverage.
- [ ] Validate the full evidence-to-logic audit, checkpoint it, synchronize GitHub, and document values that remain intentionally adjustable rather than universal.

## Sidebar Navigation Repair

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
- [ ] Repair any confirmed mobile drawer slider, scroll, close, or destination-activation failure and add focused regression coverage.
- [ ] Capture the current mobile drawer at an iPhone width and verify logo, active styling, navigation, scroll behavior, and safe-area controls before publication.

## Mobile Drawer Brand and Typography Refinement

- [x] Replace the drawer brand lockup with a prominent official Sports Genome icon and concise, legible brand treatment.
- [x] Reduce sidebar typography density by simplifying labels, group headings, account context, research context, and secondary navigation metadata.
- [x] Increase vertical breathing room and preserve 44px-or-larger primary navigation targets without making the drawer feel crowded.
- [ ] Validate the simplified drawer at iPhone widths for readable hierarchy, clear active state, smooth scrolling, and no clipped content.

## Exercise-to-Action Connection Indicators

- [x] Audit existing exercise-to-movement transfer, sport-fit, and selected-action data available to catalog and Exercise Genome surfaces.
- [x] Add compact Direct support, Supporting link, or No mapped link indicators to exercise result rows for the selected sport action.
- [ ] Add the connection explanation and supported movement rationale to the selected-exercise detail without fabricating transfer certainty.
- [ ] Add regression coverage and validate readable indicators across the mobile full-width catalog list and exercise detail.
- [x] Remove the duplicate legacy Exercise Catalog grid from Home.tsx so mobile always renders the canonical full-width Catalog Discovery list.
- [ ] Mirror the selected-action Direct support, Supporting link, or Not mapped indicator into the Exercise Genome selector rows shown in the reported screen.
- [ ] Show the selected-action connection explanation in the opened exercise detail and Exercise Genome context without fabricating sport-transfer certainty.

## Visible Data Integrity and Interactive Navigation Verification

- [ ] Audit and replace every visible placeholder-style numeric display with a live athlete value, derived planning value with clear label, or explicit no-data state.
- [ ] Remove the unsupported command-center Session readiness marker and replace it with a truthful current-plan status derived from saved workout data.
- [ ] Remove the stale duplicate command-center branch containing Session readiness and 82 from Home.tsx rather than hiding it with CSS.
- [ ] Decide whether command-center plan status derives from persisted saved workout data or is explicitly labeled as active staged-plan state, then add a regression against the prior placeholder.
- [ ] Interactively activate every sidebar destination and verify active workspace, URL history, active state, desktop rail behavior, and mobile overlay closure.
- [ ] Capture and review updated desktop and mobile workspace screenshots after visible-placeholder cleanup and sidebar verification.

## Body Lab Number Semantics

- [x] Audit all Body Lab score generation, role-template defaults, heat-map intensities, model-index badges, and metric-bar display paths.
- [x] Replace default primary/synergist template numbers with qualitative role and evidence context when no exercise or stack calculation is available.
- [x] Retire Body Lab model-index displays entirely; retain relative scores only in dedicated exercise and active-stack analysis with clear non-measurement labeling.
- [ ] Add regression coverage preventing repeated role-template values from appearing as precise Body Lab scores, then validate the corrected layout on desktop and mobile.
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
- [ ] Make Body Lab role ordering depend on movement mechanics and phase context rather than scaling one muscle template across actions.
- [ ] Use source-recorded contraction and action-phase context to influence Body Lab role ordering wherever the enriched movement evidence distinguishes contribution order.
- [ ] Add regression coverage proving differing supported action-phase contexts can change qualitative Body Lab role ordering without fabricating timing or force values.
- [ ] Extend Body Lab role ordering to use explicit enriched movement mechanics and action-phase signals beyond the current isometric-context heuristic.
- [ ] Add comparative role-context regressions using multiple source-recorded phase patterns to prove qualitative ordering changes appropriately.
- [ ] Add a component-level regression proving the rendered Key Muscle Roles list follows source-recorded phase-sensitive ordering without fabricating timing or force values.
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
