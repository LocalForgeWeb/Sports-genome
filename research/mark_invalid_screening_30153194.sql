with invalid_raw as (
  update public.raw_imports
  set processing_status = 'failed',
      processing_note = 'Automated screening output rejected: required 0-100 score scale was not honored; output used a 0-5 scale. Raw candidate retained for retry with a corrected schema.'
  where id = '6df50d47-c84f-4d77-bb07-1458b5a98ef3'
  returning id, import_batch_id
)
insert into public.validation_errors (
  import_batch_id, record_type, record_id, error_code, error_message, severity
)
select
  import_batch_id,
  'raw_import',
  id,
  'screening_score_scale_invalid',
  'Automated screening response used a 0-5 scale despite the required 0-100 scale. The candidate was not staged or promoted.',
  'error'
from invalid_raw
returning id, error_code, severity;
