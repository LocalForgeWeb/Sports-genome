-- App-safe beta percentile curves.
--
-- app_strength_norms_v1 is neither policy-gated nor eligibility-gated: it exposes every row in
-- strength_norms, including the competitive-powerlifting curves that strength_norm_source_policy
-- marks `excluded`. Serving a percentile from those would compare an ordinary lifter against
-- competition entrants. This view carries the policy with the data instead, so the only rows an
-- app client can reach are the ones allowed to produce a beta percentile.

create or replace view public.app_strength_beta_curves_v1
with (security_invoker = true) as
select
  n.exercise_id,
  e.canonical_name as exercise_canonical_name,
  e.name as exercise_name,
  lower(n.sex) as sex,
  n.normalization_method,
  p.source_role,
  p.confidence_cap,
  n.percentile,
  n.value,
  n.unit,
  n.sample_size,
  n.source_study_id,
  pol.scoring_mode,
  pol.load_semantics,
  pol.confidence_modifier
from public.strength_norms n
join public.strength_norm_source_policy p on p.source_study_id = n.source_study_id
join public.exercises e on e.id = n.exercise_id
left join public.strength_exercise_scoring_policy pol
  on pol.exercise_id = n.exercise_id and pol.scoring_version = 'strength_beta_v1'
where p.allow_beta_percentile
  and lower(n.sex) in ('male', 'female')
  and n.percentile is not null
  and n.value is not null;

comment on view public.app_strength_beta_curves_v1 is
  'Curve anchors admitted by strength_norm_source_policy for a strength_beta_v1 percentile. Excluded sources (competitive powerlifting) and validation-only sources cannot appear here by construction, so a client cannot reach them by forgetting a filter.';
