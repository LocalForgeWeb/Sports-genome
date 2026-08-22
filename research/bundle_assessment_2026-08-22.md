# Production Bundle Assessment — 2026-08-22

## Current composition

The production build already separates the high-volume movement registry from the main application code. The current compressed movement-data asset is approximately **1.07 MB uncompressed on disk** and **181 KB gzip**. The entry bundle is approximately **792 KB** on disk and the exercise-data module is approximately **236 KB**.

| Asset role | Current production asset | Approximate disk size | Assessment |
|---|---:|---:|---|
| Full sport movement registry | `movement-data-*.js` | 1.07 MB | Kept as a separate data chunk. |
| Application shell and Home orchestration | `index-*.js` | 792 KB | Includes shared workspace logic and application-level UI. |
| Exercise catalog data | `exercise-data-*.js` | 236 KB | Kept independently from movement data. |
| Exercise Genome analysis | `genome-analysis-*.js` | 72 KB | Already isolated from the main movement registry. |

## Decision boundary

The movement registry is referenced by first-visit onboarding, selected-sport initialization, recommendations, Body Lab, Movement Atlas, smart-draft construction, generated-week seeding, and the sport-switch safety helper. Deferring it as a single post-login import would risk transient empty selection state or stale action context during the core athlete journey.

> The present build warning is a Rollup size advisory, not a build failure. The asset is already separated from exercise data and analysis logic. The next meaningful optimization should split movement records **by selected sport** behind an asynchronous profile loader with loading and fallback state—not merely rename manual chunks.

## Recommended next optimization

Before adding per-sport lazy loading, extract a stable sport-profile index with the first valid movement ID for each profile. Then expose asynchronous movement loaders that preserve the existing synchronous APIs at the selection boundary. That work should include regression coverage for initial onboarding selection, sport switching, recommendations, Body Lab, smart drafts, generated weeks, and offline/error fallback.
