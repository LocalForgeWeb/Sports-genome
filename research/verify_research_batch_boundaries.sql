select
  (select count(*) from public.raw_imports) as raw_imports,
  (select count(*) from public.raw_imports where processing_status = 'staged') as raw_staged,
  (select count(*) from public.raw_imports where processing_status = 'failed') as raw_rejected_or_invalid,
  (select count(*) from public.staging_studies) as staging_studies,
  (select count(*) from public.studies) as production_studies
limit 1;
