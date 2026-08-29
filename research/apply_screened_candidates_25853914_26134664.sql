with staged_raw as (
  update public.raw_imports
  set processing_status = 'staged',
      processing_note = 'Gemini screening decision: review. Structured 0-100 triage output passed shape and scale checks; no production promotion.'
  where id = 'cf7ad0c0-0785-4be0-8f3a-6336c2fb9089'
    and processing_status = 'received'
  returning id
), staged_review as (
  insert into public.staging_studies (
    original_raw_import_id, title, normalized_title, citation_fingerprint, abstract, doi, pmid,
    source_url, publication_year, study_type, population_summary, screening_decision,
    relevance_score, methodological_quality_score, population_relevance_score,
    measurement_reliability_score, specificity_score, extraction_confidence_score,
    screening_reason, validation_status, extraction_model, extraction_notes
  )
  select
    id,
    'Effects of Low- vs. High-Load Resistance Training on Muscle Strength and Hypertrophy in Well-Trained Men',
    'effects of low- vs. high-load resistance training on muscle strength and hypertrophy in well-trained men',
    'doi:10.1519/JSC.0000000000000958',
    'Randomized parallel-group comparison of low- and high-load resistance training to failure in well-trained young men.',
    '10.1519/JSC.0000000000000958',
    '25853914',
    'https://pubmed.ncbi.nlm.nih.gov/25853914/',
    2015,
    'randomized parallel-group trial',
    '18 young men experienced in resistance training.',
    'review',
    85, 80, 75, 80, 60, 95,
    'Relevant randomized load-comparison evidence; protocol and population limits require source review before any claim extraction.',
    'needs_review',
    'gemini-3.5-flash',
    'Automated triage only. No athlete-facing recommendation, norm, or sport-transfer claim extracted or promoted.'
  from staged_raw
  returning id
), rejected_raw as (
  update public.raw_imports
  set processing_status = 'failed',
      processing_note = 'Gemini screening decision: reject for current research-claim scope. Raw source retained; no staging or production promotion.'
  where id in (
    '57ef5a72-7a53-44b0-b552-765ee9ffd1f0',
    '215426bb-9d37-42ed-a986-c769b584d049',
    'e16925b2-cc1f-4731-97e4-d097de205cd1'
  )
    and processing_status = 'received'
  returning id, import_batch_id, source_external_id
), rejection_errors as (
  insert into public.validation_errors (
    import_batch_id, record_type, record_id, error_code, error_message, severity
  )
  select
    import_batch_id,
    'raw_import',
    id,
    'screening_scope_reject',
    'Automated triage rejected this acute or narrow EMG source for the current athlete-facing claim scope. Raw evidence remains available for future bounded review.',
    'warning'
  from rejected_raw
  returning id
)
select
  (select count(*) from staged_review) as staged_for_review,
  (select count(*) from rejection_errors) as rejected_from_current_scope;
