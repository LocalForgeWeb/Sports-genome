with staged_raw as (
  update public.raw_imports
  set processing_status = 'staged',
      processing_note = 'Gemini screening decision: review. Structured 0-100 triage output passed shape and scale checks; no production promotion.'
  where id in (
    'a4061f1e-0c05-475b-a480-6c63d82cf4d1',
    'f7e41f5a-f96b-48c0-adc3-4b58fc67c872',
    'b8636fbc-18f3-4e58-b676-a0de8ce6de68',
    'fafc8735-3bb2-4118-8745-83a8cd9ff1f7'
  )
    and processing_status = 'received'
  returning id
), candidate_staging (
  raw_id, title, normalized_title, citation_fingerprint, abstract, doi, pmid, source_url,
  publication_year, study_type, population_summary, relevance_score, methodological_quality_score,
  population_relevance_score, measurement_reliability_score, specificity_score,
  extraction_confidence_score, screening_reason, extraction_notes
) as (
  values
  (
    'a4061f1e-0c05-475b-a480-6c63d82cf4d1'::uuid,
    'Barbell Squat Relative Strength as an Identifier for Lower Extremity Injury in Collegiate Athletes',
    'barbell squat relative strength as an identifier for lower extremity injury in collegiate athletes',
    'doi:10.1519/JSC.0000000000003554',
    'Retrospective analysis of preseason body-mass-normalized back-squat strength and recorded lower-extremity injuries in selected Division I sport samples.',
    '10.1519/JSC.0000000000003554', '32084107', 'https://pubmed.ncbi.nlm.nih.gov/32084107/', 2020,
    'retrospective study',
    'Division I male football athletes and female volleyball and softball athletes.',
    85, 70, 80, 75, 80, 95,
    'Relevant body-mass-normalized strength context; injury association is non-causal and not a general normative comparison.',
    'Safety flag: injury risk association. No diagnostic, causal, or general population claim extracted.'
  ),
  (
    'f7e41f5a-f96b-48c0-adc3-4b58fc67c872'::uuid,
    'Establishing Normative Data for 10RM Strength Scores in College-Aged Females',
    'establishing normative data for 10rm strength scores in college-aged females',
    'doi:10.47206/ijsc.v2i1.138',
    'Normative reference study including preacher curl 10RM values in college-aged females.',
    '10.47206/ijsc.v2i1.138', null, 'https://journal.iusca.org/index.php/Journal/article/view/138', 2022,
    'normative reference study',
    '371 college-aged females aged 18–25 years.',
    70, 80, 65, 85, 70, 95,
    'Potentially relevant preacher-curl normative source, restricted to the studied female college-aged population and protocol.',
    'Do not combine with male, other-age, or different-equipment records. Full protocol review required.'
  ),
  (
    'b8636fbc-18f3-4e58-b676-a0de8ce6de68'::uuid,
    'Physiological and performance responses to tournament wrestling',
    'physiological and performance responses to tournament wrestling',
    'doi:10.1097/00005768-200108000-00019',
    'Primary research on physiological and performance responses during a simulated two-day freestyle wrestling tournament with a prescribed weight-loss context.',
    '10.1097/00005768-200108000-00019', '11474340', 'https://pubmed.ncbi.nlm.nih.gov/11474340/', 2001,
    'primary research study',
    '12 Division I collegiate male freestyle wrestlers.',
    75, 60, 70, 70, 75, 95,
    'Sport-specific tournament context is relevant, but the small sample and weight-loss protocol require strict scope review.',
    'Safety flag: weight-loss protocol. Do not extract or promote weight-loss guidance.'
  ),
  (
    'fafc8735-3bb2-4118-8745-83a8cd9ff1f7'::uuid,
    'Physical determinants of tennis performance in competitive teenage players',
    'physical determinants of tennis performance in competitive teenage players',
    'doi:10.1519/JSC.0b013e3181b3df89',
    'Correlational study of selected physical measures and tournament ranking in competitive teenage male tennis players.',
    '10.1519/JSC.0b013e3181b3df89', '19675471', 'https://pubmed.ncbi.nlm.nih.gov/19675471/', 2009,
    'original research',
    '12 competitive male tennis players aged 13.6 ± 1.4 years.',
    70, 60, 60, 75, 70, 95,
    'Sport-specific source with small adolescent correlational sample; cannot support adult, female, or causal athlete claims.',
    'No athlete rank, recommendation, or causal sport-transfer claim extracted.'
  )
)
insert into public.staging_studies (
  original_raw_import_id, title, normalized_title, citation_fingerprint, abstract, doi, pmid,
  source_url, publication_year, study_type, population_summary, screening_decision,
  relevance_score, methodological_quality_score, population_relevance_score,
  measurement_reliability_score, specificity_score, extraction_confidence_score,
  screening_reason, validation_status, extraction_model, extraction_notes
)
select
  raw_id, title, normalized_title, citation_fingerprint, abstract, doi, pmid, source_url,
  publication_year, study_type, population_summary, 'review', relevance_score,
  methodological_quality_score, population_relevance_score, measurement_reliability_score,
  specificity_score, extraction_confidence_score, screening_reason, 'needs_review',
  'gemini-3.5-flash', extraction_notes
from candidate_staging
where raw_id in (select id from staged_raw)
returning id, pmid, screening_decision, validation_status;
