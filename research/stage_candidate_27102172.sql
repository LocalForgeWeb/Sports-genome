with staged_raw as (
  update public.raw_imports
  set processing_status = 'staged',
      processing_note = 'Gemini screening decision: review. Structured 0-100 triage output passed shape and scale checks; no production promotion.'
  where id = 'b88937ce-ef24-4266-9d51-611016134a86'
    and processing_status = 'received'
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
    'Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis',
    'effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis',
    'doi:10.1007/s40279-016-0543-8',
    'Systematic review and meta-analysis of resistance-training frequency and muscle hypertrophy in human participants from ten eligible experimental trials.',
    '10.1007/s40279-016-0543-8',
    '27102172',
    'https://pubmed.ncbi.nlm.nih.gov/27102172/',
    2016,
    'systematic review and meta-analysis',
    'Human participants without chronic disease or injury from ten eligible experimental trials.',
    'review',
    95,
    90,
    92,
    88,
    95,
    95,
    'Relevant frequency and hypertrophy evidence, but full volume-equating methods and population limits require review before any claim extraction.',
    'needs_review',
    'gemini-3.5-flash',
    'Automated triage only. No norm, recommendation, activation claim, or sport-transfer claim extracted or promoted.'
  from staged_raw
  returning id, pmid, screening_decision, validation_status
)
select id, pmid, screening_decision, validation_status from staged limit 1;
