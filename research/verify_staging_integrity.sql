select
  'raw_imports' as metric,
  count(*)::text as value
from public.raw_imports
union all
select
  'review_staging_rows' as metric,
  count(*)::text as value
from public.staging_studies
where validation_status = 'needs_review'
union all
select
  'production_studies' as metric,
  count(*)::text as value
from public.studies
union all
select
  'duplicate_staging_fingerprints' as metric,
  count(*)::text as value
from (
  select citation_fingerprint
  from public.staging_studies
  group by citation_fingerprint
  having count(*) > 1
) duplicates
union all
select
  'duplicate_raw_source_urls' as metric,
  count(*)::text as value
from (
  select normalized_source_url
  from public.raw_imports
  group by normalized_source_url
  having count(*) > 1
) duplicates
union all
select
  'logged_validation_errors' as metric,
  count(*)::text as value
from public.validation_errors
limit 20;
