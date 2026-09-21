# Musculoskeletal Capacity & Injury Resilience (v2) — live contract and sport-path audit

Feature key `injury_resilience` · canonical spec version 2 · scope tier `core` · risk `critical` ·
evidence requirement `validated`.

This document is the logged completion evidence for two checklist items:

| Checklist key | Required output |
| --- | --- |
| `audit_live_contract` (10) | Reusable code/data, exact gaps, affected interfaces, blocking ambiguity |
| `audit_sport_optional_path` (11) | Gap map with exact relations/functions/components, counts, security boundaries, migration impact |

Read before editing code, per the canonical work-item instructions. Nothing here invents a table or a
concept: every relation named below was read from the live schema on 2026-09-19.

Governance state at audit time:

- Philosophy `feature_creation_contract_v1.philosophy_creation_readiness` = **creation_ready**.
- Canonical `claude_feature_checklist_v1.contract_readiness` = **dependency_pending** (four hard
  runtime dependencies are themselves `spec_ready`, not verified).
- 10 MUST requirements, 9 blocking acceptance criteria, 13 required checklist items, all unstarted.

---

## 1. What already exists and must be reused

| Relation / function | Kind | Rows | Reuse verdict |
| --- | --- | --- | --- |
| `injury_resilience_recommendations` | table | 120 | **Reuse as the sport-specific route.** Do not widen it. |
| `injury_constraints` | table | 146 | Reuse as population-level risk-factor evidence only. |
| `training_interventions` | table | 599 | Reuse for dose; 503 rows carry structured dose fields. |
| `exercises` / `exercise_aliases` / `exercise_variants` | tables | 423 / 56 / 82 | Canonical exercise identity. Never mint new exercise IDs for interventions. |
| `movement_patterns`, `muscles`, `physical_qualities`, `athletic_attributes` | tables | 48 / 59 / 11 / 42 | Existing vocabularies the target catalog must map to, not duplicate. |
| `athlete_profiles` | table | 0 | Reusable as-is; `primary_sport_id` is already **nullable**. |
| `save_athlete_profile_v2` | function | — | Keep for legacy sport-mode clients; must not be edited in place. |
| `app_my_athlete_profile_v1` | view | — | `security_invoker=true`; extend by a successor view, not a breaking edit. |
| `app_sport_training_recommendations_v1` | view | — | Sport-scoped read contract; stays sport-scoped. |
| `studies`, `study_populations`, `study_outcomes` | tables | 1260 / 978 / 6617 | Provenance backbone for any promoted general route. |

Repo-side reusable assets: `shared/` typed contracts, the `supabase/migrations/` convention, the
tRPC server boundary in `server/`, and the existing evidence-boundary copy patterns in
`client/src/components/ExerciseGenomePanel.tsx` and `RecoverySpacingPanel.tsx`.

---

## 2. Required relations that do not exist yet

Eight of the nine required data contracts are absent from the live schema. Confirmed by
`information_schema` on 2026-09-19:

| Required contract | Kind | Present? |
| --- | --- | --- |
| `injury_resilience_recommendations` | table | **yes** |
| `save_athlete_profile_v3` | function | no |
| `athlete_focus_areas` | table | no |
| `athlete_training_constraints` | table | no |
| `athlete_focus_checkins` | table | no |
| `app_resilience_target_catalog_v1` | view | no |
| `app_resilience_recommendations_v2` | view | no |
| `resilience_plan_v2` | function | no |
| (only `save_athlete_profile_v1` / `_v2` exist) | function | — |

No `resilience`, `focus`, `capacity`, or `constraint`-owning athlete table exists today. The feature
therefore starts from an empty private-data surface, which is why `model_context_focus_constraints`
and `build_resilience_taxonomy` are both startable now.

---

## 3. Gap map — every place that assumes a sport is mandatory

### 3.1 Database

| Location | Exact assumption | Impact |
| --- | --- | --- |
| `save_athlete_profile_v2` | `if p_primary_sport_id is null then raise exception 'SPORT_REQUIRED'` | **Hard gate.** The canonical profile write path cannot represent a general or undecided user. |
| `athlete_profiles` | No `sport_context_mode` column | NULL `primary_sport_id` is unlabelled, so "general" and "not yet answered" are indistinguishable — the exact anti-pattern named by `sport-optional-context-not-fake-sport` ("silently treating NULL as general"). |
| `injury_resilience_recommendations.sport_id` | `NOT NULL` | No sport-agnostic resilience row can physically exist in the canonical table. |
| `injury_constraints` | 0 of 146 rows have `sport_id IS NULL` | No sport-agnostic risk-factor coverage. |
| `training_interventions` | 2 of 599 rows have `sport_id IS NULL` | Effectively no general intervention route. |
| `app_my_athlete_profile_v1` | Projects `primary_sport_id` with no mode column | Clients cannot tell mode from the view. |

### 3.2 Frontend

| Location | Exact assumption | Impact |
| --- | --- | --- |
| `client/src/components/AthleteBaselineQuiz.tsx:102` | Step 2 of onboarding renders the sport grid and calls `navigation(Boolean(sportId))` | **Hard gate.** The user cannot advance without selecting one of the 20 sports. No General / Decide later option exists. |
| `client/src/components/AthleteBaselineQuiz.tsx:14` | `AthleteQuizSelection.sportId: string` (non-optional) | The onboarding type itself cannot express "no sport". |
| `client/src/pages/Home.tsx:330` | `sportProfiles.find(p => p.id === sportId) \|\| sportProfiles[0]` | **Silent fake-sport fallback.** A user with no sport is rendered, labelled and programmed as the first sport in the list. |
| `client/src/pages/Home.tsx:1084` | Context chips always assert `selectedSport.label` | A general user is told they have a sport. |
| `client/src/pages/Home.tsx:1098,1102,1106` | `CommandHero`, recommendations, and day planning all take a required sport | Sport-derived output is not gated by mode. |
| `onboarding_spec.md` step 4 | "Sport lens — choose from the twenty researched sports" | The written spec itself mandates a sport and needs a v2 revision. |

### 3.3 Client/server boundary

`save_athlete_profile_v2` is **not called anywhere in the repository** (`grep` over `*.ts`/`*.tsx`
returns no match). The web app keeps sport, goal and baseline in local component state via
`chooseSport`/`completeOnboarding`. Two consequences:

1. The `SPORT_REQUIRED` exception is currently dormant for web, so fixing the RPC alone changes
   nothing user-visible.
2. `single_contract_across_clients` (blocking) is **not satisfiable today** — there is no shared
   server contract for web and iOS to agree on. This is the largest architectural gap in the feature.

---

## 4. Evidence coverage — quantified

`injury_resilience_recommendations`, n = 120, drawn from 95 distinct studies:

| Property | Count | Note |
| --- | --- | --- |
| Sport-scoped rows | 120 / 120 | All 20 sports represented. |
| Sport-agnostic rows | **0** | Structurally impossible (`NOT NULL`). |
| Rows with `exercise_id` | 29 | Exercise-linkable. |
| Intervention-only rows | 91 | Education, policy, equipment, manual therapy, multicomponent protocols. |
| Rows with `dose_summary` | 84 | |
| Rows with `limitations` | 114 | |
| Rows with `quality_id` | 10 | Weak link into the quality ontology. |
| Rows with `movement_id` | 2 | Effectively no movement linkage. |
| Rows with null `confidence_score` | 0 | Confidence is uniformly populated. |

String fragmentation in the same table:

- **51 distinct `injury_region` strings** for what is realistically ~15 regions. Observed aliases for
  one region: `shoulder`, `shoulder/scapula`, `shoulder/elbow`, `shoulder_elbow`,
  `shoulder / upper limb`, `shoulder/upper limb`, `shoulder/forearm-wrist`,
  `shoulder_hip_kinetic_chain`, `spine/shoulder`. Case variants exist too
  (`lower extremity` vs `Lower extremity`).
- **113 distinct `injury_or_constraint` strings** (presentation), plus 124 more in
  `injury_constraints` — no controlled vocabulary anywhere.

Coverage by region for the three regions the release criteria name explicitly:

| Region (raw strings merged by hand for this audit only) | Rows | With exercise | General route |
| --- | --- | --- | --- |
| Shoulder family | 27 | 5 | none |
| Knee family | 15 | 3 | none |
| Low back / lumbar family | 8 | 2 | none |

**Blocking finding.** The acceptance criterion `no_fake_sport_fallback` requires that a general-mode
user asking for shoulder, knee or back capacity gets either a passing sport-agnostic route or an
honest insufficiency state. Today **zero** sport-agnostic routes exist, so until
`promote_general_evidence_routes` lands, the only correct behaviour for general mode is the
insufficiency state. The engine must therefore ship with insufficiency as a first-class result, not
as an afterthought.

---

## 5. Security boundaries

- `athlete_profiles` and `athlete_strength_entries` carry four owner-scoped RLS policies each
  (`select`/`insert`/`update`/`delete`, role `authenticated`, predicate
  `(select auth.uid()) = user_id`). The three new private tables must match this shape exactly.
- `app_my_athlete_profile_v1` is `security_invoker=true`. Both new app views must be too, or RLS is
  bypassed.
- `save_athlete_profile_v2` is `SECURITY INVOKER` PL/pgSQL with
  `SET search_path TO 'pg_catalog','public','private'` and an `AUTHENTICATION_REQUIRED` guard. The v3
  successor must keep the same guard, search path and error vocabulary.
- Research tables (`injury_resilience_recommendations`, `injury_constraints`,
  `training_interventions`) are reference data, not athlete data. Athlete focus and constraint rows
  must never be written into them.

---

## 6. Migration impact

1. **Additive only.** `athlete_profiles` has 0 rows, so adding `sport_context_mode` is free; no
   backfill is needed and no user data can be lost.
2. **`save_athlete_profile_v2` stays.** v3 is a new function with a new signature. v2 keeps raising
   `SPORT_REQUIRED`, which remains correct for explicit sport mode.
3. **`app_my_athlete_profile_v1` is not edited.** Adding a column to a versioned app view is a
   breaking change under directive `preserve_app_surface_compatibility`; the mode is exposed through
   a successor view.
4. **`injury_resilience_recommendations` is not altered.** Its `sport_id NOT NULL` constraint is the
   thing that keeps sport evidence from silently becoming general evidence. The route split happens
   in the new `app_resilience_recommendations_v2` view, which labels every row with `route_type`.
5. **Taxonomy mapping is non-destructive.** The 51 region strings and 113 presentation strings are
   mapped through an alias table with a reviewable unresolved queue. No UPDATE touches the source
   strings.

---

## 7. Blockers and ambiguities recorded, not resolved

| # | Blocker | Why it cannot be closed in this work item |
| --- | --- | --- |
| B1 | Zero sport-agnostic evidence routes exist | Requires `promote_general_evidence_routes`: real source review against `studies`, with population, presentation, dose, directness and limitations preserved. Fabricating coverage would violate `evidence_requirement = validated` and `missing_data_fails_honestly`. |
| B2 | No shared web/iOS server contract for profile or plan | `single_contract_across_clients` cannot pass while the web client holds onboarding state locally and never calls the profile RPC. Needs `implement_resilience_plan_v2` plus a client migration. |
| B3 | Four hard runtime dependencies are `spec_ready`, not verified | `athlete_profile_context`, `evidence_explainability`, `workout_builder`, `muscle_effect_engine`. Feature `contract_readiness` stays `dependency_pending` until they are resolved. |
| B4 | `quality_id` populated on only 10 / 120 rows; `movement_id` on 2 | Quality- and movement-driven stack crediting will be sparse at launch. Directive `repair_quality_links_from_same_study_evidence` owns the repair; do not guess links. |
| B5 | Six linked open questions remain `open` | They govern weak-point action choice, Sport Profile ranking, and Body Lab cue/identity behaviour. They must stay configurable parameters, never hard-coded defaults. |
| B6 | 91 of 120 rows are intervention-only | Per directive `distinguish_intervention_only_injury_rows_from_missing_exercise_links`, these must not be forced onto catalog exercises. The plan engine needs a non-exercise recommendation shape. |

---

## 8. Conclusion

The foundation is startable and the first three checklist items are unblocked. The correct build
order given this audit is: model the private context tables and the v3 write path, build the
non-destructive target taxonomy, then promote general evidence routes **before** the plan engine —
because without B1 closed, the engine can only ever return insufficiency for general-mode users.
