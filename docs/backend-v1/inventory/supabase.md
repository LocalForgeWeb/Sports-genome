# Supabase inventory: Backend V1 discovery

- **Date:** 2026-09-28
- **Project:** `qiccnqkypbhlwpmjcsri` ("Sports genome"), running PostgreSQL 17.6.
- **Second project:** `syzqpuurvtlprelmbomk` ("Sports Genome philosophy"). It is covered briefly in §10.
- **Method:** read-only.
  - Catalog `SELECT`s via the Supabase MCP `execute_sql` tool (`pg_class`, `pg_policies`, `pg_proc`, `pg_trigger`, `has_*_privilege`, `pg_default_acl`, `storage.*`).
  - `count(*)` runs on each table (they are all under 12k rows).
  - `get_advisors` for security and performance, plus `list_edge_functions`, `list_migrations` and `list_extensions`.
  - A repo grep at commit `29dba90`.
  - No functions were executed. No DDL or DML was run.
- **Scope:** payments (§12) are deferred and out of scope.
- **Secrets:** none recorded. A publishable-key literal exists in the client, but its value is not reproduced here.
- **Legend:**
  - **C** = CONFIRMED (a query result or code line was observed). **H** = HYPOTHESIS.
  - Grants use `S/I/U/D/T` for SELECT/INSERT/UPDATE/DELETE/TRUNCATE, and "—" means none.
  - "auth" means the `authenticated` role.
  - RLS is *forced* on **no** relation (`relforcerowsecurity = false` everywhere) (C).

---

## 1. Roles and exposed schemas

| Item | Value | Evidence |
|---|---|---|
| `authenticator` rolconfig | `session_preload_libraries=supautils, safeupdate`, `statement_timeout=8s`, `lock_timeout=8s`. No `pgrst.*` keys. | `pg_roles` / `pg_db_role_setting` (C) |
| `anon` / `authenticated` | `statement_timeout` is 3s / 8s; neither has `BYPASSRLS`. | same (C) |
| `service_role` | `BYPASSRLS`, but **no USAGE on schema `private`**. | `has_schema_privilege` (C) |
| `pgrst.db_schemas` | Not set in the DB (`current_setting` returns null), so it lives in the platform API settings. | (C) |
| Exposed schemas | `public` is exposed: the advisor cites `/rest/v1/rpc/...` for a public function. The rest of the list is probably the defaults (`public`, `graphql_public`); it cannot be read from SQL. | (C) for `public`, (H) for the rest |
| Schema USAGE for anon/auth | Yes: `public`, `auth`, `storage`, `realtime`, `extensions`, `graphql`, `graphql_public`. **No:** `private`, `peptide_research`, `vault`, `supabase_migrations`. | `has_schema_privilege` (C) |
| CREATE on `public` for anon/auth | false | (C) |
| Installed extensions | plpgsql, pgcrypto, uuid-ossp, pg_stat_statements, supabase_vault. **Not installed:** pg_cron, pg_net, pg_graphql, pgmq. | `list_extensions` (C) |
| Realtime publication | `supabase_realtime` has no tables. | `pg_publication_tables` (C) |
| Default privileges (owner `postgres` and `supabase_admin`, schema `public`) | New tables get `arwdDxtm` for **anon and authenticated**. New functions get `EXECUTE` for anon and authenticated. | `pg_default_acl` (C) |
| Supabase Auth users | `auth.users` has 0 rows (0 anonymous, 0 permanent). | `count(*)` (C) |
| Migrations | 313 applied remotely (20260829002022 to 20260924190510). The repo's `supabase/migrations/` holds **8** files. | `schema_migrations`, `find supabase` (C) |

## 2. User-owned data

All of these tables are empty. The ownership column is `user_id` (FK to `auth.users` with `ON DELETE CASCADE`) unless stated otherwise.

| Table | Rows | RLS | Policies (all `TO authenticated`, `(select auth.uid()) = user_id`) | anon grants | auth grants | Triggers |
|---|---|---|---|---|---|---|
| `athlete_profiles` (PK `user_id`) | 0 | on | SELECT, INSERT (WITH CHECK), UPDATE (USING + WITH CHECK), DELETE | — | SIUDT | BEFORE UPDATE `private.protect_athlete_profile_identity` (INVOKER) pins `user_id` and `benchmark_subject_id`. BEFORE UPDATE `set_updated_at`. AFTER UPDATE OF `benchmark_pool_opt_in` → `private.sync_benchmark_consent` (DEFINER). |
| `athlete_strength_entries` | 0 | on | SELECT, INSERT, UPDATE (USING + WITH CHECK), DELETE | — | SIUDT | **BEFORE INSERT only**: `private.prepare_athlete_strength_entry` (DEFINER). It forces `user_id := auth.uid()` and copies sex, age, experience and sport from the profile. BEFORE UPDATE `set_updated_at`. AFTER INSERT OR UPDATE → `private.sync_strength_benchmark_candidate` (DEFINER, upserts into the private pool). |
| `athlete_strength_states` | 0 | on | SELECT, INSERT only (**no UPDATE/DELETE**) | — | SIUDT | none |
| `athlete_focus_areas` | 0 | on | SELECT, INSERT, UPDATE (USING + WITH CHECK), DELETE | **SIUDT** | SIUDT | none |
| `athlete_focus_checkins` | 0 | on | SELECT, INSERT only (**no UPDATE/DELETE**) | **SIUDT** | SIUDT | none |
| `athlete_training_constraints` | 0 | on | SELECT, INSERT, UPDATE (USING + WITH CHECK), DELETE | **SIUDT** | SIUDT | none |
| `private.user_strength_benchmark_candidates` (owner via `benchmark_subject_id`) | 0 | on, 0 policies | — | — | — | AFTER INSERT/UPDATE `private.sync_strength_observation_code_v1` (DEFINER) |
| `private.strength_observation_codes_v1` | 0 | on, 0 policies | — | — | — | — |

### Ownership checks (task 6, B032/B180/B192)

| Check | Result |
|---|---|
| Owner reassignment on UPDATE | Blocked. Every UPDATE policy has `WITH CHECK auth.uid() = user_id`. `athlete_profiles` also pins `user_id` via trigger. (C) |
| INSERT as another user | Blocked by `WITH CHECK`. `athlete_strength_entries` also overwrites `user_id` in the trigger. (C) |
| Anon read/write of user tables | Blocked. No policy targets `anon`, so RLS default-denies. anon still holds table grants, including **TRUNCATE**, on `athlete_focus_areas`, `athlete_focus_checkins` and `athlete_training_constraints`. TRUNCATE ignores RLS but is not offered by PostgREST. (C) |
| Child → parent ownership | **Not enforced.** Single-column FKs, INSERT policies that check only the child's `user_id`, and no triggers: `athlete_focus_checkins.focus_area_id → athlete_focus_areas(id)`, `athlete_strength_states.source_entry_id → athlete_strength_entries(id)`, `athlete_strength_states.previous_state_id → athlete_strength_states(id)`. (C, structure) See SB-02. |
| Client-editable profile context after insert | `athlete_strength_entries` UPDATE may change `sex_code`, `age_years`, `bodyweight_kg`, `sport_id`, `experience_level_code` and `measurement_type`. The prepare trigger runs on INSERT only, and the AFTER UPDATE sync copies the edited values into the private pool. `load_kg` is `GENERATED ALWAYS … STORED`. (C) See SB-04. |
| Views over user data | `app_my_athlete_profile_v1`/`v2`, `app_my_strength_entries_v1` and `app_strength_history_v2` are all `security_invoker=true`, owned by `postgres`, with no `WHERE` of their own, so base-table RLS applies. `app_my_athlete_profile_v2` carries anon SIUDT grants, but anon has no base-table grant, so access is denied. (C) |

## 3. Curated reference and research data (public tables)

The policy wording is abbreviated: "anon,auth true" means `SELECT TO anon,authenticated USING (true)`; "auth active" means `SELECT TO authenticated USING (is_active = true)`.

| Table | Rows | Policies | anon | auth |
|---|---|---|---|---|
| exercises | 423 | anon,auth true | S | S |
| exercise_variants | 82 | anon,auth true | S | S |
| exercise_muscle_mappings | 3118 | anon,auth true | S | S |
| exercise_transfer_evidence | 305 | anon,auth true | S | S |
| muscles | 59 | anon,auth true | S | S |
| sports / sport_demands / sport_movements / sport_movement_demands / sport_muscle_demands / sport_exercise_recommendations / sport_tests | 20 / 231 / 86 / 65 / 220 / 202 / 170 | anon,auth true | S | S |
| movement_demands / athletic_attributes / physical_qualities | 775 / 42 / 11 | anon,auth true | S | S |
| performance_tests / performance_correlations / reliability_validity | 63 / 420 / 131 | anon,auth true | S | S |
| injury_constraints / injury_resilience_recommendations / training_interventions | 146 / 120 / 599 | anon,auth true | S | S |
| strength_exercise_scoring_policy | 325 | anon,auth true | S | S |
| app_performance_norm_publications | 1460 | anon,auth true | S | S |
| app_performance_test_aliases | 0 | anon,auth true | S | S |
| app_reference_eligibility | 11296 | (1) anon,auth: `source_table='performance_tests' AND family='performance_test_catalog' AND approved`. (2) auth: `source_table='strength_norms' AND family='strength_norm' AND approved`. | S | S |
| studies | 1266 | anon,auth true | S on 11 citation columns only | S on the same columns |
| **strength_norms** | 3512 | anon,auth true | — | **S (all rows, including blocked/excluded)** |
| performance_norms | 1460 | anon,auth true | — (no grant) | — |
| sport_norms | 749 | anon,auth true | — | — |
| strength_norm_source_policy / strength_scoring_versions | 5 / 2 | auth true | — | S |
| exercise_modality_contract_v1 | 54 | auth true | — | S |
| exercise_modality_composition_v1 | 54 | auth true | **SIUDT** | SIUDT |
| exercise_muscle_effect_priors | 355 | auth true | **SIUDT** | SIUDT |
| exercise_variant_muscle_numeric_effects_v1 | 0 | auth true | **SIUDT** | SIUDT |
| muscle_effect_scoring_versions | 51 | auth true | **SIUDT** | SIUDT |
| resilience_targets / resilience_target_aliases / resilience_presentation_types / resilience_recommendations_general | 26 / 288 / 1 / 1 | auth true | **SIUDT** | SIUDT |
| strength_norm_curve_aliases | 164 | auth active | **SIUDT** | SIUDT |
| exercise_variant_muscle_effect_deltas_v1 / muscle_effect_data_snapshots / muscle_effect_version_dependencies | 3 / 44 / 69 | auth true | — | SIUDT |
| isometric_research_calibrations / performance_heuristic_calibrations / performance_research_percentile_curves | 6 / 16 / 544 | auth active | — | SIUDT |
| strength_generic_variant_routes / strength_observation_contract_overrides / strength_rep_curve_aliases / strength_research_proxy_curves | 30 / 3 / 24 / 240 | auth active | — | SIUDT |
| strength_source_benchmark_thresholds / strength_source_simple_benchmarks / strength_timed_hold_norms | 90 / 448 / 356 | auth active | — | SIUDT |
| weak_strength_equipment_routes / weak_strength_research_curves / weighted_bodyweight_norm_grid | 9 / 20 / 100 | auth active | — | SIUDT |
| exercise_modality_composition_v2 | 271 | auth `false` | — | — |
| muscle_effect_replay_certificates | 1 | ALL anon,auth `false` / `false` | — | — |
| exercise_evidence_coverage | 400 | service_role true | — | — |
| app_exercise_source_mappings | 423 | none | — | — (**but read from the browser**, see SB-06) |
| exercise_aliases / exercise_movement_mappings / movement_patterns / muscle_aliases / muscle_contributions | 56 / 120 / 48 / 64 / 225 | none | — | — |
| strength_estimation_models / study_outcomes / study_populations | 23 / 6617 / 978 | none | — | — |

Where only SELECT policies exist, INSERT/UPDATE/DELETE grants are blocked by RLS (C).

**private schema (codebooks):** `exercise_compact_codebook_v1` (423 rows), `exercise_variant_compact_codebook_v1` (82), `experience_level_codebook_v1` (6), `sex_codebook_v1` (4), `sport_compact_codebook_v1` (20). Each has RLS on and 0 policies, and no role other than `postgres` can reach them. The private views `strength_observation_dataset_v1`, `user_strength_percentile_pool_v1` and `user_strength_percentile_pool_v2` are `security_invoker=true` (C).

## 4. Operational, agent and staging tables

Every table here has RLS on, no anon/auth grants, and no policies except the one noted.

| Group | Tables (rows) |
|---|---|
| Agent / feature tracking | agent_work_directives (19; `ALL TO service_role`), feature_acceptance_criteria (199), feature_data_dependencies (117), feature_dependencies (106), feature_implementation_log (19), feature_philosophy_links (456), feature_requirements (242), feature_work_item_dependencies (172), feature_work_items (222), product_features (36) |
| Ingestion | import_batches (177), raw_imports (228), validation_errors (4) |
| Staging | staging_exercises (0), staging_mappings (0), staging_sport_demands (0), staging_strength_norms (0), staging_studies (41) |
| Unrelated schema | `peptide_research`: compounds, registry_trials, studies, study_compounds. All 0 rows, **RLS disabled**, no grants, no USAGE for client roles. (C) |

## 5. Views (47 in public)

All 47 have `security_invoker=true` and owner `postgres` (C). Effective access equals the base-table grants plus RLS.

| Client grants | Views |
|---|---|
| anon S, auth S | app_approved_performance_norms_v1, app_exercise_profiles_v1, app_performance_relationships_v1, app_performance_tests_safe_v1, app_sport_movements_v1, app_sport_muscle_priorities_v1, app_sport_test_catalog_v1, app_sport_training_recommendations_v1, app_training_interventions_v1, sport_training_recommendation_feed |
| anon SIUDT, auth SIUDT | app_experience_level_catalog_v1, app_my_athlete_profile_v2, app_resilience_recommendations_v2, app_resilience_target_catalog_v1, app_sports_catalog_v1, app_strength_beta_curves_v1, app_strength_ingestion_contract_v1, app_strength_input_catalog_v1, app_strength_integration_manifest_v1, resilience_general_route_candidates_v1, resilience_target_alias_review_v1 |
| anon IUDT (no S), auth IUDT | strength_scoring_readiness_v1 |
| auth SIUDT only | app_my_athlete_profile_v1, app_my_strength_entries_v1, app_strength_function_coverage_v1, app_strength_history_v2, app_strength_ingestion_contract_v2, app_strength_input_catalog_v2, app_strength_input_contracts_v2, app_strength_scoring_catalog_v1, strength_scoring_readiness_v2 |
| none (server-only) | app_approved_strength_norms_v1, app_approved_study_outcomes_v1, app_exercise_mapping_report_v1, app_readiness_gaps, app_reference_catalog_v1, app_research_priorities_v1, app_source_catalog_v1, app_sport_norms_v1, app_strength_estimation_models_safe_v1, app_strength_norms_v1, app_study_outcome_labels_v1, claude_feature_checklist_v1, claude_feature_queue_v1, exercise_catalog_coverage, feature_build_contract_v1, feature_schema_gaps_v1 |

## 6. Functions

**public** holds 223 non-extension functions. **Every one has `search_path` pinned** (`proconfig` is set) (C).

| Class | Count | EXECUTE |
|---|---|---|
| SECURITY DEFINER | 60 | 59 are `postgres`/`service_role` only (muscle_effect_v1_36…v1_52, validation matrices, snapshot providers, replay certificate). **1 is executable by authenticated:** `get_strength_input_contract_v2(uuid)`. None by anon. |
| INVOKER, executable by authenticated | 157 | Of these, 10 are also executable by anon: `estimate_1rm_from_set`, `get_strength_percentile_v1_core`, `muscle_effect_v1_2`, `muscle_effect_v1_10`, `muscle_effect_v1_31`, `muscle_effect_input_consistency_v1`, `muscle_effect_modality_composition_v1`, `annotate_strength_reference_scope_v1`, `score_strength_v2` and `save_athlete_profile_v3`. 8 are granted to `PUBLIC`. |
| INVOKER, no client EXECUTE | 6 | — |

**DEFINER executable by authenticated.** `get_strength_input_contract_v2` is STABLE. It reads `strength_observation_contract_overrides` and calls `get_strength_input_contract_v2_legacy`, which reads `strength_exercise_scoring_policy`, `strength_research_proxy_curves`, `weighted_bodyweight_norm_grid`, `exercises`, `strength_norms`, `strength_norm_source_policy` and `strength_scoring_readiness_v2`. It writes nothing, reads no user data and does not check `auth.uid()` (C).

**User-data RPCs.** All are INVOKER and all check `auth.uid()`; none is called by the app today:

| Function | Writes | Touches `private.*` (no USAGE for `authenticated`) |
|---|---|---|
| save_athlete_profile_v1 | athlete_profiles | no |
| save_athlete_profile_v2 / v3 | athlete_profiles | `private.experience_level_from_years_v1` when training years is supplied |
| record_strength_entry_v1 | athlete_strength_entries | no |
| record_strength_entry_v2 | athlete_strength_entries + athlete_strength_states | `private.sex_codebook_v1` (always) |
| recalculate_strength_entry_v1 | athlete_strength_states | `private.sex_codebook_v1` (always) |
| get_strength_entry_state_v1 | — | no |

**private** holds 7 functions, all `postgres`-only with `search_path` pinned. The four trigger functions `prepare_athlete_strength_entry`, `sync_strength_benchmark_candidate`, `sync_benchmark_consent` and `sync_strength_observation_code_v1` are SECURITY DEFINER. `set_updated_at` and `protect_athlete_profile_identity` are INVOKER, and `experience_level_from_years_v1` is IMMUTABLE (C).

## 7. Triggers, jobs, Edge Functions, storage

- **Triggers (non-internal).** The seven on user tables are listed in §2. The rest are platform-owned `storage.*` and `realtime.subscription` triggers (C).
- **pg_cron.** Not installed, so there are no scheduled jobs (C).
- **Edge Functions (17, all `ACTIVE`, `verify_jwt=true`).** The slugs are `muscle-effect-v1-36` through `-41` and `-43` through `-52`, plus `strength-score-v1` (v3, last updated 2026-09-24). The repo has no `functions/v1` or `functions.invoke` reference to any of them (C). Their sources were not read, because `get_edge_function` is outside the allowed tool list.
- **Storage.**
  - There is one bucket, `sports-genome-assets`: `public=true`, 100 MB file limit, 12 objects. All 12 are brand images and one intro video, with `owner_id` null (C).
  - `storage.objects` and `storage.buckets` have **no** policies, so only the service role can upload, list or delete. Public objects are served via `/storage/v1/object/public/…` (C).
  - The client references these by public URL in `client/src/lib/sportsGenomeAssets.ts:1`.

## 8. Research datasets (§9, B018)

Current values only.

| Dataset | Rows | Eligibility (`app_reference_eligibility`) | Notes |
|---|---|---|---|
| strength_norms | 3512 | 1760 approved, 1490 blocked, 2 needs_review, **260 with no row** | 1220 blocked and 260 missing are from "Strength Level 2026" (`beta_fallback`). 270 blocked are from Van den Hoek powerlifting (`excluded`). 880 + 880 approved are the 10RM college male/female studies (`validation_only`). 2 needs_review are bench 20–29 (`validation_only`). Approved rows were reviewed 2026-09-14 (330 of the blocked rows have no `reviewed_at`). |
| performance_norms | 1460 | 1460 approved (reviewed ≤ 2026-09-17) | Mirrored 1:1 in `app_performance_norm_publications` (1460). |
| performance_tests | 63 | 63 approved, **`reviewed_at` null for all** | — |
| sport_norms | 749 | **none** | Exposed server-side via `app_sport_norms_v1` (749). |
| study_outcomes | 6617 | 6498 blocked, **119 with no row** | `app_approved_study_outcomes_v1` = 0 rows. |
| strength_estimation_models | 23 | 23 needs_review | — |
| studies | 1266 | n/a | 0 duplicate DOI groups, 0 duplicate PMID groups, 1 duplicate normalised-title group, 0 with no identifier. `training_status` is free text (382 distinct values). |
| study_populations | 978 | n/a | `training_status` is free text. |
| staging_studies / validation_errors | 41 / 4 | n/a | — |
| strength_norm_source_policy | 5 | n/a | `beta_fallback` (Strength Level, `allow_beta_percentile`, cap 0.82), `excluded` (Van den Hoek), 3 × `validation_only`. |
| app_strength_beta_curves_v1 (view) | 1480 | **ignores eligibility** | Gated only by `strength_norm_source_policy.allow_beta_percentile`. Every row comes from the Strength Level source. |
| app_approved_strength_norms_v1 (view) | 1760 | approved only | Server-only; no client grants. |

- **Blocking reasons:** the text is stored in `blocking_reason` and summarised in the notes above.
- **Source revision columns:** none exist. There are only `reviewed_at`, `reviewed_by` and `provenance` (jsonb) on the eligibility and publication tables, and `version_key` / `scoring_version` on engine tables (C).
- **Orphan eligibility rows:** 0 (C).

## 9. What the app actually calls (task 8)

**Browser.** Calls use the publishable key plus a Supabase session obtained through `signInAnonymously()` (`client/src/lib/athleteIdentity.ts:53`). The client is created in `client/src/lib/supabaseClient.ts:27-49` (the key literal is committed as a fallback at `:30`).

| Object | Op | Caller |
|---|---|---|
| athlete_profiles | upsert (onConflict `user_id`) | `client/src/lib/athleteIdentity.ts:131` |
| athlete_strength_entries | insert (bulk) | `client/src/lib/strengthSyncQueue.ts:109` |
| athlete_focus_areas | select / update / insert | `client/src/lib/capacityContext.ts:77,129,151,162` |
| athlete_training_constraints | select / update / insert | `client/src/lib/capacityContext.ts:80,131,156,174` |
| app_resilience_target_catalog_v1 | select | `client/src/lib/resilienceCatalogClient.ts:40` |
| **app_exercise_source_mappings** | select (`mapping_status=approved`) | `client/src/lib/supabaseReferenceMap.ts:64`. **No grant exists, so this errors** (SB-06). |
| sports | select | `client/src/lib/supabaseReferenceMap.ts:65` |
| auth | `getSession` / `signInAnonymously` / `updateUser` | `athleteIdentity.ts:47,53,143`. There is **no `signOut`** anywhere in `client/src` (C). |

**Server.** Calls use the service-role key over REST (`supabaseServiceHeaders`). The tRPC procedures that reach them are named in brackets.

| Object | Caller (file:line) | tRPC procedure (auth) |
|---|---|---|
| app_strength_beta_curves_v1 | `server/supabaseStrengthCurves.ts:201,219` | `strengthPercentile.forLift` / `forLifts` (**public**, `routers.ts:484-492`) |
| rpc/score_strength_profile_v1, rpc/aggregate_muscle_strength_v1, rpc/apply_strengthlevel_age_adjustment_v1; exercises | `server/supabaseStrengthProfile.ts:163,174,183-186` | `strengthProfile.muscleRanks` (**public**, `routers.ts:466`) |
| strength_norms (`source_text ilike *van den hoek*`) | `server/powerliftingNormsReference.ts:50` | `strengthGenome.powerliftingNorms` (**public**, `routers.ts:401`) |
| app_reference_eligibility, strength_norms, performance_norms, exercises, app_exercise_source_mappings, studies | `server/normsRegistry.ts:107,137,181,188,194,196,201` | `strengthGenome.referenceRows` / `referenceRegistryStatus` (**public**, `routers.ts:411,418`) and `referenceComparisons` (protected, `:407`) |
| sports, sport_movement_demands, sport_muscle_demands, sport_demands, sport_exercise_recommendations | `server/supabaseSportProfile.ts:117,133,146,152,158,164` | `sportsGenome.profile` (**public**, `routers.ts:436`) |
| app_resilience_target_catalog_v1 | `server/supabaseResilience.ts:49` | `resilience.targetCatalog` (**public**, `routers.ts:447`) |
| exercises (with exercise_evidence_coverage and studies embeds), strength_norms, study_outcomes, studies, and counts on performance_tests, performance_norms, strength_estimation_models, exercise_evidence_coverage | `server/supabaseEvidence.ts:238,256,271,278,301,318-325,342` | `researchEvidence.supabaseInventory` / `supabaseLibrary` / `supabaseExercise` (**public**, `routers.ts:166-173`) |

Not called by the app: any Edge Function, the RPCs `save_athlete_profile_*`, `record_strength_entry_*`, `recalculate_strength_entry_v1`, `get_strength_input_contract_v2`, and the `muscle_effect_*` family (C, grep).

## 10. Second project `syzqpuurvtlprelmbomk`

- **Contents:** 42 public tables (~3.4k estimated rows) holding product and design philosophy: principles, design decisions, competitor findings, experiments, research runs and `feature_*_blueprints`. It also has one view and a `peptide_research_private` schema (6 tables, ~419 estimated rows).
- **Users and storage:** 0 auth users, 0 buckets.
- **Access:** every public table has RLS on with **0 policies**. anon holds SELECT grants on 31 of them, but RLS denies all rows.
- **Repo references:** the project ref appears nowhere in the repo (C).

---

## Material findings

**SB-01: Anonymous sign-in makes "authenticated" equal to any visitor.**
- **Severity:** P1.
- **B-IDs:** B178, B179, B193, B148.
- **Status:** C for the client code; H for the project toggle.
- **Evidence:**
  - The client calls `signInAnonymously()` on first launch (`client/src/lib/athleteIdentity.ts:53`), and anonymous users hold the `authenticated` role.
  - No policy distinguishes `is_anonymous` (`pg_policies`).
  - Everything granted to `authenticated` is therefore reachable without credentials:
    - all 3512 `strength_norms` rows, including the powerlifting-excluded and blocked rows;
    - the strength rows of `app_reference_eligibility`;
    - 20+ research/curve tables;
    - 157 INVOKER RPCs plus 1 DEFINER RPC.
  - `auth.users` has 0 rows, so it is unknown whether the toggle is enabled in production.
- **Remediation:** decide the intended public surface explicitly. Then either restrict research tables to server or approved views, or gate them with `(auth.jwt()->>'is_anonymous')::boolean is not true` where appropriate.

**SB-02: A user can attach a child row to another user's parent.**
- **Severity:** P1.
- **B-IDs:** B032, B180, B192.
- **Status:** C for the structure; the exploit was not executed.
- **Evidence:**
  - Affected FKs: `athlete_focus_checkins.focus_area_id → athlete_focus_areas(id)`, `athlete_strength_states.source_entry_id → athlete_strength_entries(id)` and `previous_state_id → athlete_strength_states(id)`. All are single-column.
  - The INSERT policies check only the child's `user_id = auth.uid()`, and these tables have no triggers.
  - FK checks bypass RLS. As a result:
    - user B can link rows to user A's parent if B knows its uuid;
    - the FK error reveals whether a uuid exists;
    - user A's delete cascades into user B's rows.
- **Remediation:** add `UNIQUE (id, user_id)` on the parents and composite FKs `(parent_id, user_id)`, or add `WITH CHECK (exists (select 1 from parent p where p.id = parent_id and p.user_id = auth.uid()))`.

**SB-03: Profile context on strength entries is editable after insert and flows into the benchmark pool.**
- **Severity:** P1.
- **B-IDs:** B024, B031, B150, B194.
- **Status:** C.
- **Evidence:**
  - `athlete_strength_entries_prepare` fires `BEFORE INSERT` only.
  - The UPDATE policy lets the owner change `sex_code`, `age_years`, `bodyweight_kg`, `sport_id`, `experience_level_code`, `measurement_type` and `scoring_model_version`.
  - The AFTER UPDATE trigger `private.sync_strength_benchmark_candidate` (SECURITY DEFINER) copies those values into `private.user_strength_benchmark_candidates`.
  - The pool is empty today and `active_for_percentiles` defaults to false.
- **Remediation:** re-derive the context in a BEFORE UPDATE trigger (or make those columns non-updatable through column grants). Keep pool promotion server-side.

**SB-04: Clients can write derived strength states directly.**
- **Severity:** P2.
- **B-IDs:** B024, B194, §4.
- **Status:** C.
- **Evidence:**
  - `authenticated` has INSERT on `athlete_strength_states`, and the policy checks only `user_id`.
  - `state_payload`, `model_version` and `computed_at` are therefore client-supplied.
  - `app_strength_history_v2` shows the latest state by `computed_at`, so a forged row wins.
  - The impact is limited to the user's own data.
- **Remediation:** revoke client INSERT and write states only through a DEFINER RPC or the server.

**SB-05: The Supabase identity is not tied to the app account and survives logout.**
- **Severity:** P1.
- **B-IDs:** B020, B173, B175.
- **Status:** C for the code; H for the runtime behaviour.
- **Evidence:**
  - The server's own accounts (`trpc.auth.signIn`) are separate from the Supabase auth uid. Nothing in `server/`, `shared/` or `drizzle/` references a Supabase user id.
  - The client persists its session under a fixed `storageKey` (`supabaseClient.ts:47`) and never calls `supabase.auth.signOut`.
  - Account B signing in on the same device would keep syncing into account A's anonymous Supabase rows.
- **Remediation:** namespace the Supabase session per app account, or sign out of Supabase on logout. Link the Supabase uid to the account server-side.

**SB-06: Browser lift sync fails at the mapping step and drops queued items.**
- **Severity:** P1.
- **B-IDs:** B020, B168, B169, B170.
- **Status:** C for the grants; H for the runtime chain.
- **Evidence:**
  - `supabaseReferenceMap.ts:64` selects `app_exercise_source_mappings`, which has no anon/auth grant and no policy.
  - The error falls back to the cached map (`:67`).
  - `flushSyncQueue` then drops every unmappable item from the queue (`strengthSyncQueue.ts:103-105,118`).
  - `auth.users` is empty, so no browser-side athlete row has ever landed.
- **Remediation:** expose an approved-mappings read (a view or grant with a SELECT policy), and keep unmappable items queued instead of discarding them.

**SB-07: Default and actual grants exceed the policies.**
- **Severity:** P1.
- **B-IDs:** B179, B181, B194.
- **Status:** C.
- **Evidence:**
  - `pg_default_acl` gives anon and authenticated `arwdDxtm` on every new public table and EXECUTE on every new function.
  - 31 tables carry client I/U/D/T grants while having only SELECT policies. Examples: `exercise_muscle_effect_priors`, `muscle_effect_scoring_versions`, `resilience_*` and `strength_norm_curve_aliases` (anon too).
  - anon holds TRUNCATE on three user tables. TRUNCATE is not subject to RLS.
  - RLS is currently the only barrier, and a new table created without RLS would be fully writable by anon.
- **Remediation:**
  - Revoke `INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` from anon and authenticated on reference tables, and TRUNCATE everywhere.
  - Change the default privileges to grant SELECT-only, or nothing.
  - Revoke EXECUTE from `PUBLIC` and `anon` on RPCs that are not meant to be public.

**SB-08: Two eligibility gates disagree, and the rank path uses a blocked source.**
- **Severity:** P1.
- **B-IDs:** B018, B139, B143, B145.
- **Status:** C.
- **Evidence:**
  - `app_strength_beta_curves_v1` (1480 rows) filters only on `strength_norm_source_policy.allow_beta_percentile`.
  - All of its rows come from Strength Level, whose `strength_norms` rows are `blocked` (1220) or have no eligibility row (260).
  - The approved 10RM rows (1760) are `validation_only` and are not in the beta view.
  - `strengthPercentile.forLift` consumes the beta view (`supabaseStrengthCurves.ts:201`).
  - `strengthGenome.powerliftingNorms` reads the `excluded` Van den Hoek rows by `source_text ilike` (`powerliftingNormsReference.ts:50`), bypassing both gates.
- **Remediation:** make one release gate authoritative (family and protocol plus a revision). Route all app reads through approved views, and record which qualified or beta uses are allowed.

**SB-09: Public tRPC routes proxy service-role reads.**
- **Severity:** P2.
- **B-IDs:** B181, B185, B195.
- **Status:** C.
- **Evidence:**
  - The public procedures at `routers.ts:166-173,401,411,418,436,447,466,484-492` query Supabase with the service-role key, which bypasses the anon/auth grants and RLS above.
  - This includes `study_outcomes` (all blocked), the excluded powerlifting norms, and RPC scoring (`muscleRanks`: up to 31 RPC calls per request).
- **Remediation:** have public routes read only approved or publication views, use a least-privilege key or role where possible, and add rate limits.

**SB-10: Unused user RPCs would fail for authenticated callers.**
- **Severity:** P2.
- **B-IDs:** B181, B182.
- **Status:** C for the privileges; H for the runtime error (not executed).
- **Evidence:**
  - `record_strength_entry_v2` and `recalculate_strength_entry_v1` always read `private.sex_codebook_v1`.
  - `save_athlete_profile_v2` and `v3` call `private.experience_level_from_years_v1` when training years is supplied.
  - All are SECURITY INVOKER, and `authenticated` has no USAGE on `private` (neither does `service_role`).
- **Remediation:** either move the helpers to an internal DEFINER wrapper or delete the unused RPC versions. Do not grant `private` to clients.

**SB-11: A SECURITY DEFINER RPC is callable by authenticated users (advisor WARN).**
- **Severity:** P2.
- **B-IDs:** B182, B190.
- **Status:** C.
- **Evidence:**
  - `get_strength_input_contract_v2(uuid)` reads reference tables only, writes nothing and has no `auth.uid()` check.
  - `authenticated` already has SELECT on the table it reads (`strength_observation_contract_overrides`, `is_active` policy), so DEFINER is not needed for that read.
- **Remediation:** switch it to SECURITY INVOKER, or revoke its EXECUTE if it is unused.

**SB-12: Provenance and coverage defects in the reference data.**
- **Severity:** P2.
- **B-IDs:** B018, B140, B143.
- **Status:** C.
- **Evidence:**
  - The `strength_norm_source_policy` row for "…10RM … College-Aged **Females**" has `population_label` = "College-aged **males**, direct 10RM".
  - 749 `sport_norms`, 260 `strength_norms` and 119 `study_outcomes` rows have no eligibility row.
  - All 63 approved `performance_tests` rows have a null `reviewed_at`.
  - There are no source-revision columns.
- **Remediation:** correct the label, backfill eligibility rows with reasons, and add revision or release columns.

**SB-13: No user correction or deletion for check-ins and states.**
- **Severity:** P2.
- **B-IDs:** B159, B188.
- **Status:** C.
- **Evidence:** `athlete_focus_checkins` and `athlete_strength_states` have no UPDATE or DELETE policy. They can only be removed through the `auth.users` cascade.
- **Remediation:** define the correction and deletion semantics (a tombstone or an owner DELETE policy) as part of the lifecycle design.

**SB-14: Migration history drift.**
- **Severity:** P2.
- **B-IDs:** B021, §13.
- **Status:** C.
- **Evidence:** 313 remote migrations against 8 SQL files in `supabase/migrations/`. The remote schema cannot be rebuilt from the repo.
- **Remediation:** pull the remote schema or migrations into the repo before any V1 migration.

**SB-15: Edge Functions are deployed but unused.**
- **Severity:** P2.
- **B-IDs:** B178, B195.
- **Status:** H.
- **Evidence:**
  - 17 active functions with `verify_jwt=true` and no caller in the repo.
  - Their names match service-role-only DB functions (`muscle_effect_v1_36…52`).
  - Any valid project JWT, including an anonymous session, can probably invoke them. The sources were not reviewed.
- **Remediation:** read the sources. Then delete the unused functions or require a non-anonymous or role claim.

**SB-16: Performance advisors.**
- **Severity:** P2.
- **B-IDs:** B190, §14.
- **Status:** C.
- **Evidence:**
  - 95 unindexed FKs (INFO), including on user tables: `athlete_focus_checkins.user_id`, `athlete_focus_areas.target_id` and `athlete_training_constraints.target_id`.
  - 1 WARN for multiple permissive SELECT policies for `authenticated` on `app_reference_eligibility`.
  - 32 unused indexes (INFO), which is expected with 0 user rows.
- **Remediation:** index the FKs on user tables and merge the two eligibility policies into one.

**SB-17: Informational items.**
- **Severity:** P2.
- **B-IDs:** B015, B178.
- **Status:** C.
- **Evidence:**
  - 33 tables have RLS on with no policies (advisor INFO). This is intended deny-all for private, staging and agent tables.
  - The `peptide_research` schema (4 empty tables) has RLS disabled, but it has no grants and no USAGE, so it is unreachable.
  - The storage bucket is public and holds brand assets only; it has no object policies, so there are no client uploads.
- **Remediation:** keep the deny-all tables as they are, and consider moving `peptide_research` out of this project.

## Not checked

- **Exposed-schema list and Auth settings:** these live in the platform config, not SQL. That includes whether anonymous sign-ins are enabled, JWT expiry and the leaked-password setting.
- **Edge Function sources:** not read, because `get_edge_function` is not in the allowed tool list.
- **Runtime behaviour:** no live requests were made as anon, user A or user B, so the H items (SB-02 exploit, SB-06 chain, SB-10 errors) are unexercised.
- **Remote REST/OpenAPI:** the shell cannot reach `*.supabase.co`.
