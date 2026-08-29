select
  (select count(*) from public.studies) as production_study_count,
  (select count(*) from public.staging_studies where id = 'bdcd718c-72c6-463a-84ae-5c214c87ccef' and screening_decision = 'review' and validation_status = 'needs_review') as matching_review_stage_count,
  (select count(*) from public.raw_imports where source_external_id = '37414459' and processing_status = 'staged') as matching_raw_stage_count
limit 1;
