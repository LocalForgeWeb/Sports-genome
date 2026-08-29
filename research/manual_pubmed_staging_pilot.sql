with new_batch as (
  insert into public.import_batches (
    source, query, status, candidates_found, candidates_screened, review_count, notes
  ) values (
    'manual_pubmed',
    'PMID 37414459 manual staging pilot',
    'validating',
    1,
    1,
    1,
    'One manually sourced, Gemini-screened candidate. Staging only; no production promotion.'
  ) returning id
), new_raw as (
  insert into public.raw_imports (
    import_batch_id, source_type, source_url, normalized_source_url, source_external_id,
    raw_payload, content_sha256, processing_status, processing_note
  )
  select
    id,
    'pubmed',
    'https://pubmed.ncbi.nlm.nih.gov/37414459/',
    'https://pubmed.ncbi.nlm.nih.gov/37414459',
    '37414459',
    jsonb_build_object(
      'title', 'Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis',
      'source_url', 'https://pubmed.ncbi.nlm.nih.gov/37414459/',
      'doi', '10.1136/bjsports-2023-106807',
      'pmid', '37414459',
      'publication_year', 2023,
      'source_type', 'systematic_review_bayesian_network_meta_analysis',
      'source_excerpt', 'All resistance-training prescriptions promoted strength and hypertrophy versus non-exercise control; direct athlete-specific prescriptions, individual norms, activation claims, and sport-transfer claims are outside scope.'
    ),
    '142970d7f6c60c2089a90a01ed7e8f4da676d4f9b05923e62daf40271c1e6e38',
    'staged',
    'Gemini screening decision: review. Candidate has not been promoted.'
  from new_batch
  returning id
), staged as (
  insert into public.staging_studies (
    original_raw_import_id, title, normalized_title, citation_fingerprint, abstract, doi, pmid,
    source_url, publication_year, study_type, population_summary, screening_decision,
    relevance_score, methodological_quality_score, population_relevance_score,
    measurement_reliability_score, specificity_score, extraction_confidence_score,
    screening_reason, validation_status, extraction_model, extraction_notes
  )
  select
    id,
    'Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis',
    'resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and bayesian network meta-analysis',
    'doi:10.1136/bjsports-2023-106807',
    'Systematic review and Bayesian network meta-analysis of load, sets, and frequency effects on muscle strength and hypertrophy in healthy adults.',
    '10.1136/bjsports-2023-106807',
    '37414459',
    'https://pubmed.ncbi.nlm.nih.gov/37414459/',
    2023,
    'systematic review and Bayesian network meta-analysis',
    'Healthy adults in included randomised trials.',
    'review',
    95,
    90,
    90,
    85,
    80,
    100,
    'Relevant to generic resistance-training prescription evidence but not eligible for individual norms, activation, medical, or sport-transfer claims without further scoped review.',
    'needs_review',
    'gemini-3.5-flash',
    'Automated triage only. No outcome, norm, or recommendation extracted or promoted.'
  from new_raw
  returning id, citation_fingerprint, screening_decision, validation_status
)
select id, citation_fingerprint, screening_decision, validation_status from staged limit 1;
