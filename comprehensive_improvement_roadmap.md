# Comprehensive Improvement Roadmap

## Priority 1 — Trust, continuity, and safe state

The app will preserve an athlete’s selected sport, goal, training frequency, active movement, workout stack, and programming notes locally after a deliberate onboarding completion. Derived recommendations will use one validated sport-and-movement context so a missing, stale, or switched selection never creates an unrelated recommendation. Sport changes will explicitly reconcile the selected movement and refresh Body Lab focus.

## Priority 2 — Planning that behaves like a real training tool

The Custom Builder will move beyond a bare exercise list. Each selected exercise will carry a prescription, perceived-effort target, rest period, optional coach note, and completion state. A weekly split board will make each scheduled day visible, identify the active draft, and let athletes recover a session without rebuilding it from scratch.

## Priority 3 — Decision-quality diagnostics

Session analysis will expose set count, movement-pattern balance, lower- and upper-body distribution, high-fatigue exposure, direct overlap flags, and practical next actions. It will distinguish a useful repeated pattern from a duplicate that likely adds fatigue without adding a meaningful quality.

## Priority 4 — Discoverability and accessibility

The Movement Atlas, Catalog, Body Lab, and Genome will expose count-aware search, selected-state context, clearer empty states, keyboard-accessible muscle and navigation controls, and direct add-to-workout behavior. Interfaces will keep their data-rich nature while reducing hidden actions and scroll-only discovery.

## Priority 5 — Performance and polish

Heavy derived data will be memoized against stable identifiers. Animation and visual layers will respect reduced-motion preferences, focus states will remain visible, and mobile controls will retain access to sport switching, imports, and plan actions.

## Validation note

The refreshed Pulse Quiz remains readable and intentional through its outcome and sport-context stages. The sport grid exposes all twenty researched profiles before a plan is generated.

The sport-context validation also surfaced an interaction issue: the current selected state is too subtle to verify confidently and the Continue action remains unavailable in the browser path. The next implementation pass will make selection state explicit and accessible while preserving the required explicit-sport choice.

The enhanced Custom Builder now renders as one planning workspace: session diagnostics, programming detail, weekly map, exercise finder, movement intelligence, and the split-draft dock appear together without conflicting panel states. The blank custom start correctly communicates that no working sets are counted until an athlete adds or loads exercises.

The current implementation also adds local persistence for athlete context and weekly workout work, explicit feedback for plan-building actions, a diversified sport-session selector to avoid near-identical exercise clusters, and production chunking for framework, icon, exercise, movement, and Genome modules. The main application chunk has been reduced substantially; the researched movement dataset remains intentionally cacheable as its own module.

For QA, a disposable local wrestling profile was used to enter the workspace directly after confirming that the standard first-visit route remains quiz-first. This validates persistence without changing the explicit sport-selection requirement for new athletes.

The searchable Wrestling Movement Atlas successfully exposes the twenty-action research profile with a sport selector, family filters, free-text search, action list, and a focused mechanics card. Validation surfaced a duplicated temporary render from the integration retry; it was removed so the new master-detail atlas now appears once.
