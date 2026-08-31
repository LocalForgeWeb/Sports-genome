# Supabase Runtime Integration Audit

## Inspected project

The connected Supabase project is `Sports genome` (`qiccnqkypbhlwpmjcsri`), reported as `ACTIVE_HEALTHY` on PostgreSQL 17 in `us-west-2`. This document records metadata observed through read-only project inspection on 2026-08-31 before any runtime integration code is written.

## Populated data inventory

| Table or storage entity | Observed rows | Runtime integration role |
|---|---:|---|
| `studies` | 134 | Citation metadata and source-bounded evidence context. |
| `study_populations` | 53 | Population, sex, age, training-status, sport, and competition context. |
| `study_outcomes` | 1,407 | Source-specific outcomes; do not surface as generic scores. |
| `exercises` | 422 | Canonical upstream exercise metadata. |
| `exercise_evidence_coverage` | 400 | Explicit linkage from upstream exercises to evidence coverage and source study. |
| `strength_norms` | 2,172 | Candidate comparisons only; require exact source, protocol, population, and unit gates. |
| `performance_tests` | 56 | Standardized test identity vocabulary. |
| `performance_norms` | 1,094 | Candidate performance comparisons only; require source and athlete-context gates. |
| `strength_estimation_models` | 23 | Model registry; no automatic athlete estimate without a reviewed integration rule. |
| `staging_studies` | 41 | Staging only; not athlete-facing evidence. |
| `raw_imports` / `import_batches` | 55 / 13 | Provenance/audit intake; not athlete-facing evidence. |
| `sports-genome-assets` Storage bucket | 12 objects | Public application visual assets, already live. |

## Confirmed catalog linkage

The live local catalog uses numeric exercise identifiers. Supabase has 422 exercises, of which 400 carry `source_catalog_id`; all 400 are joined to a row in `exercise_evidence_coverage`. The coverage distribution is 17 `direct_norm`, 204 `direct_outcome`, 175 `variant_derived`, and 4 `movement_derived` rows. This supports a deterministic local-catalog-ID-to-Supabase-evidence lookup without replacing the local exercise objects that existing planner logic depends on.

## Data-quality and safety observations

The norm dataset uses multiple incompatible unit and normalization schemes: 880 `lb`, 880 `lb_10rm`, 140 `lb_1rm`, 270 `x_bodyweight`, and 2 `kg_1rm` records. Normalization methods include 10RM bodyweight classes, pre/post-training 10RM percentiles, community 1RM percentiles, relative 1RM by age/sex, and load/bodyweight. Consequently, a runtime adapter must not merge records or render a generic rank solely because the exercise name matches.

Observed study score fields also use mixed magnitudes—for example, some quality/relevance/extraction values are proportions while others are 0–100. These values can be shown as provenance metadata only after normalization is explicitly reviewed; they must not become athlete-facing confidence scores by direct display or arithmetic.

`public.exercise_evidence_coverage` currently has Row Level Security disabled. Do not query it directly from the browser or enable RLS without a dedicated policy decision, because a bare enable action would block current access. The runtime integration should use a server-only service-role Supabase client and expose narrow, read-only tRPC response shapes.

## Recommended first runtime boundary

The initial release should create a server-only Supabase evidence adapter that joins the local numeric catalog ID to `exercises`, `exercise_evidence_coverage`, and the linked `studies` record. It should return only a concise evidence card: coverage class, anchor metric, canonical exercise name, citation title/year/source URL, study type, population descriptor, and an explicit planning boundary. It must have a no-data fallback and must not modify catalog muscle grades, sport-fit grades, workout generation, strength percentiles, or source-qualified reference gates.

Strength and performance norms should be connected as a source-presence registry first. They may be listed as available records in developer/audit surfaces, but the existing Piper and van den Hoek athlete-facing match gates remain authoritative until each Supabase norm family has an explicit reviewed protocol, unit, population, and athlete-declaration mapper.

## Running-app verification

On 2026-08-31, the live Exercise Genome view loaded the selected Barbell Bench Press through the new adapter and displayed its connected `direct_norm` record, citation URL, study type, and 442 linked source norm rows. The existing heuristic evidence description remained visible alongside the new record, and the UI explicitly stated that source linkage does not replace local mechanics, alter catalog grades, or create a personal rank. The launch sequence and current workspace navigation continued to render normally.

The live Strength Genome view also displayed a concise on-demand connected-library status: 2,172 strength-norm records, 1,094 performance-norm records, and 56 standardized tests. The existing profile remained unavailable-by-default because no athlete record was declared under an exact reviewed reference protocol; the new repository count did not manufacture a rank or alter the current qualification logic.

After the source-outcome metadata extension, the live Incline Barbell Bench Press context showed its direct-outcome classification, six indexed source outcomes, and a capped list of named outcome variables from its linked crossover study. It displayed no outcome values, arithmetic, generic score, recommendation rewrite, or personal rank. This validates that the populated `study_outcomes` table is connected to the existing exercise detail flow only through a factual, source-specific metadata boundary.

## Current source-only exercise boundary

Twenty-two upstream exercise rows do not carry a `source_catalog_id`, including generic duplicate labels such as `Biceps Curl`, `Chest Press`, and `Leg Curl`, plus several specialist isometric or machine-controlled sport records. Some have no equipment, plane, stability, or loadability data; others use a protocol-specific device not represented in the active catalog. They are counted in the connected repository but are intentionally not auto-added to workout generation, muscle maps, or sport scoring. Adding them to those surfaces without a reviewed canonical merge and explicit muscle/programming mapping would fabricate a level of certainty that the database does not currently contain.

## Access-control change

The Supabase security advisor identified `public.exercise_evidence_coverage` as an exposed table with Row Level Security disabled. The integration now enables RLS, revokes all direct `anon` and `authenticated` privileges, and adds an explicit `service_role` `SELECT` policy. The application uses that server-only role and returns only curated evidence response shapes through tRPC. A live regression now verifies both sides of this boundary: the publishable browser key cannot read coverage rows directly, while the server adapter can still read the linked source record.

The database advisor still reports pre-existing informational notices for other RLS-enabled tables that intentionally have no browser policies, along with separate pre-existing findings for the `exercise_catalog_coverage` security-definer view and `estimate_1rm_from_set` search path. Those objects are outside this narrow integration release and were not changed.
