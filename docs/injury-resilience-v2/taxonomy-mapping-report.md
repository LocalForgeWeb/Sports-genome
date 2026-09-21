# Target taxonomy — mapping report

Completion evidence for checklist item `build_resilience_taxonomy` (22, data).
Required output: canonical catalog, alias/mapping report, unresolved queue, app-safe catalog view.

Applied to the live project on 2026-09-19 as migration
`20260919030732_injury_resilience_v2_target_taxonomy_seed`.

## Canonical catalog

26 targets in `resilience_targets`, exposed through `app_resilience_target_catalog_v1`
(`security_invoker`, active rows only):

| Type | Count | Targets |
| --- | --- | --- |
| `body_region` | 19 | neck, thoracic_spine, lumbar_spine, spine_general, shoulder, elbow, forearm, wrist_hand, upper_limb_general, hip, groin_adductors, hamstring, quadriceps, knee, calf_achilles, ankle, foot, lower_limb_general, general_musculoskeletal |
| `tissue_system` | 2 | bone_general, tibia |
| `functional_task` | 5 | landing_deceleration, change_of_direction, overhead_reaching, lifting_carrying, sprinting |

Broad targets (`spine_general`, `upper_limb_general`, `lower_limb_general`,
`general_musculoskeletal`) exist because the source evidence genuinely reports at that
granularity. Inventing a finer target to hold a "lower extremity" finding would overstate what the
study measured.

Functional targets carry no evidence route yet. They are in the catalog because the feature must
let someone choose a *function* rather than a region; they resolve to the insufficiency state until
routes exist.

## Region mapping — all 51 source strings accounted for

| Result | Count | Meaning |
| --- | --- | --- |
| `mapped` | 31 | Unambiguous anatomical match, sometimes with a qualifier note |
| `ambiguous` | 15 | Compound strings naming two or more distinct regions — left for review |
| `out_of_scope` | 5 | Not musculoskeletal capacity |

Nothing was force-mapped, and no source string was rewritten. The mapping is anatomical only: it
creates and transfers no evidence claim.

**Ambiguous (15):** `shoulder/elbow`, `shoulder_elbow`, `shoulder/forearm-wrist`,
`shoulder_hip_kinetic_chain`, `spine/shoulder`, `head/neck`, `posterior chain / low back`,
`groin and low back`, `knee/lower back/hip-groin`, `hip/groin`, `groin/hip`, `knee/hip`,
`knee/ankle`, `calf/ankle/foot`, `upper extremity / trunk`.

Each names more than one canonical target, and a single `target_id` cannot represent two regions
without silently discarding one. Resolving them needs either a many-to-many mapping or a
per-row judgement against the source study.

**Out of scope (5):** `head`, `head/brain`, `head/face`, `face/head`, `systemic`.

Head and brain content is not musculoskeletal capacity. `head/neck` is *ambiguous* rather than
out-of-scope because neck strength work is in scope while the head component is not — that
distinction is a source-level judgement, not a string match.

**Notable alias collapses:** four spellings of the same idea (`lower extremity`,
`Lower extremity`, `lower limb`, `lower_limb`, plus `lower limb / multisite`) now resolve to one
target, as do six shoulder-family spellings.

## Unresolved queue

237 presentation strings loaded as `unresolved` and readable through
`resilience_target_alias_review_v1`:

| Source | Strings |
| --- | --- |
| `injury_resilience_recommendations.injury_or_constraint` | 113 |
| `injury_constraints.injury_or_constraint` | 124 |

None was mapped. Deciding that a presentation string matches a given clinical presentation is an
evidence judgement about population and applicability, not an anatomical one, so no automated
inference was applied. `resilience_presentation_types` is intentionally still empty: a presentation
type will be authored when a reviewed route needs it.

## Effect on routability

| Measure | Value |
| --- | --- |
| Recommendation rows now routable to a canonical target | 84 of 120 |
| Rows visible through `app_resilience_recommendations_v2` | 84 |
| ... of which `route_type = sport_specific` | 84 |
| ... of which `route_type = general` | **0** |
| Catalog targets with at least one route | 18 of 26 |
| Catalog targets with no route (insufficiency state) | 8 |

The 36 rows not yet routable are the ones whose region string is ambiguous or out of scope.

**The zero is the point.** Every routable row is sport-scoped, so a general-mode user still gets the
insufficiency state for every target — which is what `no_fake_sport_fallback` requires while
`promote_general_evidence_routes` is outstanding. The structure now makes the alternative
impossible rather than merely discouraged: general routes live in
`resilience_recommendations_general`, a table with no `sport_id` column, so a sport-derived row
cannot be relabelled as general by nulling a field.

## Verified after applying

- All 7 new tables have RLS enabled with policies (4 owner-scoped each on `athlete_focus_areas` and
  `athlete_training_constraints`; select + insert only on `athlete_focus_checkins`; read policy on
  the four reference tables).
- Supabase security advisor reports no new findings. All 36 `rls_enabled_no_policy` notices are
  pre-existing tables.
- `save_athlete_profile_v2` and `app_my_athlete_profile_v1` are unchanged.
