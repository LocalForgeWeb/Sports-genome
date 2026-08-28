# Initial-load dependency record — 2026-08-28

## Decision

The initial workspace retains the sport-movement data module because Home uses it to render and preserve the selected sport and movement, produce the athlete’s initial planning context, and build the direct-access recommended session. Deferring that module would require either a blank/skeleton planning state after the intro or a broader asynchronous state-model change.

## Completed safe deferral

The route-level Explore presentation modules are deferred until the athlete opens their workspace: Movement Atlas, Body Lab Navigator, Catalog Discovery, Catalog evidence detail, Strength Genome, Exercise Genome, and selected-action evidence presentation. This reduced the initial JavaScript bundle from 944 kB to 791 kB without delaying the direct-access Home planning state.

## Follow-up boundary

The remaining `movement-data` chunk contains both the lightweight sport selector records and the full movement records. Splitting it further is feasible only after separating sport metadata from movement and recommendation dependencies, then designing an intentional planning-data loading state. That is a product-level loading behavior decision, not a safe one-line optimization.
