-- Which catalog exercises the muscle ranks can score, and the muscles each one works.
-- Read-only: score_strength_profile_v1 is STABLE. Each catalog exercise is scored once the way the
-- app sends it (strengthProfile.muscleRanks): loaded movements as 40 kg x 5, movements scored on
-- reps (load_semantics = bodyweight_reps) as 10 reps with no load. An exercise that comes back with
-- a percentile is rankable; the result does not depend on the numbers chosen, only on whether a
-- comparison exists. Male and female were checked to score the same 244 exercises on 2026-10-07.
-- Each row is [catalogId, mode, norm_resolution, mappings, name]; the generator rejects a resolution it
-- does not know, and records a digest of the names so the app can check its catalog still matches.
-- Run it, save the single `snapshot` value as JSON, then:
--   node scripts/strength/rankable-exercises.mjs <saved.json>
with cat as (select e.id, e.name, (regexp_match(e.canonical_name, '__catalog_(\d+)$'))[1]::int as cid from exercises e where e.canonical_name like '%\_\_catalog\_%'),
loaded as (select score_strength_profile_v1(80, 'male', (select jsonb_agg(jsonb_build_object('exercise_id', id, 'load', 40, 'unit', 'kg', 'reps', 5, 'exercise_name', name)) from cat)) as r),
reps as (select score_strength_profile_v1(80, 'male', (select jsonb_agg(jsonb_build_object('exercise_id', id, 'reps', 10, 'exercise_name', name)) from cat)) as r),
scored as (
  select s->>'exercise_id' as id, 'load' as mode, s->'percentile'->>'norm_resolution' as res from loaded, jsonb_array_elements(r->'exercise_scores') s where s->'scoring_policy'->>'load_semantics' <> 'bodyweight_reps' and (s->'percentile'->>'percentile_estimate') is not null
  union all
  select s->>'exercise_id', 'reps', s->'percentile'->>'norm_resolution' from reps, jsonb_array_elements(r->'exercise_scores') s where s->'scoring_policy'->>'load_semantics' = 'bodyweight_reps' and (s->'percentile'->>'percentile_estimate') is not null
)
select jsonb_agg(jsonb_build_array(c.cid, sc.mode, sc.res, (select jsonb_agg(jsonb_build_array(m.canonical_name, mm.role, mm.contribution_weight::float) order by mm.contribution_weight desc) from exercise_muscle_mappings mm join muscles m on m.id = mm.muscle_id where mm.exercise_id = c.id), c.name) order by c.cid) as snapshot
from scored sc join cat c on c.id::text = sc.id;
