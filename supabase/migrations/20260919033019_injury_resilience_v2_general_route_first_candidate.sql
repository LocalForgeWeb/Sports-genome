-- The single study in the library that passes the general-route screen, recorded as `draft`.
-- Draft rows are invisible to app_resilience_recommendations_v2, so this makes no athlete-facing
-- claim. Its outcome is trunk muscle activation rather than function, symptoms or load tolerance,
-- so its directness is `indirect` and it is not approved.

insert into public.resilience_presentation_types (presentation_key, label, description, requires_clinician_context)
values ('chronic_low_back_pain','Chronic low back pain',
        'Persistent non-specific low back pain reported by the user. A presentation label for matching source populations; it is not a diagnosis made by the product.',
        false)
on conflict (presentation_key) do nothing;

insert into public.resilience_recommendations_general (
  target_id, presentation_type_id, exercise_id, intervention_component, target_population,
  evidence_type, evidence_directness, outcome_metric, duration_weeks, sessions_per_week,
  dose_summary, confidence_score, source_study_id, rationale, limitations, review_status
)
select
  t.id,
  p.id,
  null,
  'Prone bridge (plank) exercise progression',
  'Adults with chronic low back pain; 38 of 45 completed the 8-week intervention across three bridge-exercise groups.',
  'intervention / EMG',
  'indirect',
  'Trunk muscle activation (surface EMG)',
  8,
  null,
  null,
  null,
  s.id,
  'Only study in the current library with a non-sport clinical population, a regional musculoskeletal target and an intervention design.',
  'Reports change in trunk muscle activation, not pain, function or load tolerance. Sessions per week, per-session volume and progression are not recorded in the stored source record, so no dose can be stated. Single study, n=38 completers, 2016. Not sufficient on its own to recommend a plan change.',
  'draft'
from public.resilience_targets t
cross join public.resilience_presentation_types p
cross join public.studies s
where t.target_key = 'lumbar_spine'
  and p.presentation_key = 'chronic_low_back_pain'
  and s.id = '25fed3aa-af4d-46f7-ad0b-ebc52cf509a6'
  and not exists (
    select 1 from public.resilience_recommendations_general g
    where g.source_study_id = s.id and g.target_id = t.id
  );
