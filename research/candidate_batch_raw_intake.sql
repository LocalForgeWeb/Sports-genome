-- Generated deterministically from the ten-candidate research discovery result.
-- Raw intake only: no staging or production promotion occurs in this query.
with batch as (
  insert into public.import_batches (
    source, query, status, candidates_found, notes
  ) values (
    'candidate_research_batch',
    'Ten-candidate breadth pilot across prescription, exercise evidence, strength context, wrestling, and tennis',
    'screening',
    10,
    'Raw-intake only. Each source requires screening, validation, duplicate review, and explicit approval before any production promotion.'
  ) returning id
)
insert into public.raw_imports (
  import_batch_id, source_type, source_url, normalized_source_url, source_external_id,
  raw_payload, content_sha256, processing_status, processing_note
)
select batch.id, candidate_rows.*
from batch cross join (
  values
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/30153194/',
  'https://pubmed.ncbi.nlm.nih.gov/30153194',
  '30153194',
  '{"subject":"Resistance training volume, muscle strength, and hypertrophy in healthy adults","evidence_scope":"Supports short-term comparison of one, three, and five sets per exercise per session over 8 weeks in trained men, not untrained adults, women, clinical populations, long-term outcomes, or sport transfer.","exclusion_or_retraction_flag":"","identifiers":"PMID: 30153194; PMCID: PMC6303131; DOI: 10.1249/MSS.0000000000001764","population_summary":"34 healthy resistance-trained men randomly assigned to low-, moderate-, or high-volume resistance training groups","publication_year":2019,"qualification_note":"Review required because the sample was limited to healthy resistance-trained men, the intervention lasted 8 weeks, and the PubMed record lists related statistical-power commentary that should be considered during appraisal.","source_excerpt":"Over 8 weeks, all groups increased strength with no significant between-group differences, while higher-volume conditions produced significant hypertrophy advantages at the elbow flexors, mid-thigh, and lateral thigh.","source_type":"randomized controlled trial","source_url":"https://pubmed.ncbi.nlm.nih.gov/30153194/","title":"Resistance Training Volume Enhances Muscle Hypertrophy but Not Strength in Trained Men"}'::jsonb,
  'b33f279a3d8930d10177a873afdd4c0c856701ba3fed27ebb43c265824f54e7f',
  'received',
  'Candidate batch topic: Resistance training volume, muscle strength, and hypertrophy in healthy adults. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/27102172/',
  'https://pubmed.ncbi.nlm.nih.gov/27102172',
  '27102172',
  '{"subject":"Resistance training frequency, muscle strength, and hypertrophy in healthy adults","evidence_scope":"Supports frequency-related hypertrophy comparisons in generally healthy human participants, but does not establish individual prescriptions, athlete-specific guidance, or sport transfer, and its frequency-matched strength implications are limited.","exclusion_or_retraction_flag":"","identifiers":"PMID: 27102172; DOI: 10.1007/s40279-016-0543-8","population_summary":"Human participants without chronic disease or injury from ten eligible experimental trials","publication_year":2016,"qualification_note":"Review required because the included trials, outcome measures, volume-equating methods, and applicability to the defined Sports Genome population must be checked before any promotion.","source_excerpt":"The review identified ten eligible studies and reported that, on a volume-equated basis, training muscle groups twice weekly produced superior hypertrophic outcomes to once weekly, while whether three times weekly is superior to twice weekly remained undetermined.","source_type":"systematic review and meta-analysis","source_url":"https://pubmed.ncbi.nlm.nih.gov/27102172/","title":"Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis"}'::jsonb,
  '5cdc8225bb5f9246fcca91864c55cc49b7031cac1609da44c6670c42b56c7bd4',
  'received',
  'Candidate batch topic: Resistance training frequency, muscle strength, and hypertrophy in healthy adults. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/25853914/',
  'https://pubmed.ncbi.nlm.nih.gov/25853914',
  '25853914',
  '{"subject":"Resistance training load or intensity, muscle strength, and hypertrophy in healthy adults","evidence_scope":"Supports comparison of low-load (25–35 repetitions per set) and high-load (8–12 repetitions per set) resistance training performed to failure over 8 weeks in well-trained young men, not untrained adults, women, older adults, individual norms, or sport transfer.","exclusion_or_retraction_flag":"","identifiers":"PMID: 25853914; DOI: 10.1519/JSC.0000000000000958","population_summary":"18 young men experienced in resistance training","publication_year":2015,"qualification_note":"Enter review as a relevant primary candidate, with verification of the full text, training-to-failure protocol, outcome measurement methods, and applicability limits required before any promotion.","source_excerpt":"The PubMed abstract reports that both conditions significantly increased elbow-flexor, elbow-extensor, and quadriceps thickness without significant between-group differences, while back-squat strength improved more with high-load training than low-load training.","source_type":"randomized parallel-group trial","source_url":"https://pubmed.ncbi.nlm.nih.gov/25853914/","title":"Effects of Low- vs. High-Load Resistance Training on Muscle Strength and Hypertrophy in Well-Trained Men"}'::jsonb,
  'fb039f86aeb804af31abf704420a078e3e82454fea6fc224c0489b9370dc58a7',
  'received',
  'Candidate batch topic: Resistance training load or intensity, muscle strength, and hypertrophy in healthy adults. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/33049982/',
  'https://pubmed.ncbi.nlm.nih.gov/33049982',
  '33049982',
  '{"subject":"Bench press muscle activation or muscle involvement evidence in resistance-trained adults","evidence_scope":"Supports acute surface-EMG comparisons of pectoralis major portions, anterior deltoid, and triceps brachii medial head across five bench angles at 60% of one-repetition maximum, not long-term hypertrophy, individual muscle contribution, athlete guidance, or sport transfer.","exclusion_or_retraction_flag":"","identifiers":"PMID: 33049982; PMCID: PMC7579505; DOI: 10.3390/ijerph17197339","population_summary":"30 trained adults","publication_year":2020,"qualification_note":"Enter review as a relevant primary candidate, with verification still required for the full protocol, training status definition, EMG normalization, and applicability limits.","source_excerpt":"The abstract reports that pectoralis major upper-portion EMG was maximal at 30°, pectoralis major middle- and lower-portion EMG was higher at 0°, anterior-deltoid EMG was highest at 60°, and triceps-brachii EMG was similar across inclinations.","source_type":"experimental electromyography study","source_url":"https://pubmed.ncbi.nlm.nih.gov/33049982/","title":"Effect of Five Bench Inclinations on the Electromyographic Activity of the Pectoralis Major, Anterior Deltoid, and Triceps Brachii during the Bench Press Exercise"}'::jsonb,
  'a6a3a4977ac804bea0da3d84b1d277451a7d2ccccef1414c386db357eb221a9a',
  'received',
  'Candidate batch topic: Bench press muscle activation or muscle involvement evidence in resistance-trained adults. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/28538321/',
  'https://pubmed.ncbi.nlm.nih.gov/28538321',
  '28538321',
  '{"subject":"Back squat muscle activation or muscle involvement evidence in healthy adults","evidence_scope":"Supports comparisons of surface-EMG muscle activation between partial and full back squats at relative 10-repetition maximum loads in this trained male sample, not general population norms, long-term adaptation, or sport transfer.","exclusion_or_retraction_flag":"","identifiers":"PMID: 28538321; DOI: 10.1519/JSC.0000000000001713","population_summary":"15 young, healthy, resistance-trained men (mean age 26 ± 5 years)","publication_year":2017,"qualification_note":"Enter review because the study directly addresses back-squat muscle activation, while its small all-male resistance-trained sample and specific load and range-of-motion protocol require eligibility and applicability checks.","source_excerpt":"The PubMed abstract states that surface electromyography assessed eight muscles and that activity was higher in the partial back squat than the full back squat for the gluteus maximus, biceps femoris, and soleus.","source_type":"randomized controlled trial","source_url":"https://pubmed.ncbi.nlm.nih.gov/28538321/","title":"Muscle Activation Differs Between Partial and Full Back Squat Exercise With External Load Equated"}'::jsonb,
  '1ebf9483e639b35ca2f6daccc9a2a98d0f49878d594b78d497f74fc4ec30410a',
  'received',
  'Candidate batch topic: Back squat muscle activation or muscle involvement evidence in healthy adults. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/26134664/',
  'https://pubmed.ncbi.nlm.nih.gov/26134664',
  '26134664',
  '{"subject":"Rowing exercise muscle involvement evidence in resistance-trained adults","evidence_scope":"Supports comparison of trunk-muscle EMG during bilateral and unilateral free-weight bent-over, seated cable, and machine rows in this sample, not whole-body muscle involvement, long-term adaptation, or athlete guidance.","exclusion_or_retraction_flag":"","identifiers":"PMID: 26134664; DOI: 10.1055/s-0034-1398646","population_summary":"15 resistance-trained men, mean age 26.0 ± 4.4 years","publication_year":2015,"qualification_note":"Staging candidate for review because it directly includes resistance-trained adults and row exercises, but its measured outcomes are limited to selected core-muscle EMG rather than comprehensive muscle involvement.","source_excerpt":"The PubMed abstract states that the study compared core muscle activation across three row exercises performed unilaterally and bilaterally at matched effort levels, and reported exercise- and laterality-related differences in erector spinae, multifidus, and external-oblique EMG.","source_type":"comparative electromyography study","source_url":"https://pubmed.ncbi.nlm.nih.gov/26134664/","title":"The Effect of Performing Bi- and Unilateral Row Exercises on Core Muscle Activation"}'::jsonb,
  '775015021399628dd3add8e8176ad85c206e2eb9cf9ae44a26a08efdd8df42d5',
  'received',
  'Candidate batch topic: Rowing exercise muscle involvement evidence in resistance-trained adults. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/32084107/',
  'https://pubmed.ncbi.nlm.nih.gov/32084107',
  '32084107',
  '{"subject":"Relative-strength or body-mass-normalized strength norms in collegiate athletes","evidence_scope":"Supports investigation of body-mass-normalized preseason 1RM back-squat strength in selected Division I sports in relation to seasonal lower-extremity injury, not general collegiate strength norms or transfer to other sports, divisions, sexes, or outcomes.","exclusion_or_retraction_flag":"","identifiers":"PMID: 32084107; DOI: 10.1519/JSC.0000000000003554","population_summary":"Division I male football athletes (n=46) and female volleyball and softball athletes (n=25)","publication_year":2020,"qualification_note":"Review required because the retrospective design, selected Division I sport samples, injury-focused outcome, and reported thresholds limit use as a general collegiate normative reference.","source_excerpt":"The PubMed abstract states that maximum preseason relative (body-mass-normalized) back-squat strength and reported lower-extremity injuries were retrospectively collected from Division I male football and female volleyball and softball athletes, and that relative strength was lower in injured than uninjured athletes.","source_type":"retrospective study","source_url":"https://pubmed.ncbi.nlm.nih.gov/32084107/","title":"Barbell Squat Relative Strength as an Identifier for Lower Extremity Injury in Collegiate Athletes"}'::jsonb,
  '4c4b2981f31cab0722b0a7f8a3755ac1b970a4cadf151ad0885ce8150722e474',
  'received',
  'Candidate batch topic: Relative-strength or body-mass-normalized strength norms in collegiate athletes. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://journal.iusca.org/index.php/Journal/article/view/138',
  'https://journal.iusca.org/index.php/Journal/article/view/138',
  '10.47206/ijsc.v2i1.138',
  '{"subject":"Standardized preacher curl 10RM reference data in college-aged adults","evidence_scope":"Supports reported preacher-curl 10RM normative reference values for the studied college-aged female sample only, not male populations, other ages, individual diagnosis, or athlete performance guidance.","exclusion_or_retraction_flag":"","identifiers":"DOI: 10.47206/ijsc.v2i1.138","population_summary":"371 college-aged females aged 18–25 years","publication_year":2022,"qualification_note":"Review required to verify the full testing protocol, equipment standardization, subgroup tables, and applicability limits before any record promotion.","source_excerpt":"The study reports that its exercises included the preacher curl and that it aimed to provide 10RM normative reference values for 18- to 25-year-old females; 371 subjects participated.","source_type":"normative reference study","source_url":"https://journal.iusca.org/index.php/Journal/article/view/138","title":"Establishing Normative Data for 10RM Strength Scores in College-Aged Females"}'::jsonb,
  '7f59881e988b6d39ac9d90dc9831519cfb83dbcbbf98b87911db4a9c4fd58fab',
  'received',
  'Candidate batch topic: Standardized preacher curl 10RM reference data in college-aged adults. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/11474340/',
  'https://pubmed.ncbi.nlm.nih.gov/11474340',
  '11474340',
  '{"subject":"Physical demands and strength qualities in competitive wrestling","evidence_scope":"Supports observations about physiological and performance responses, including upper-body isometric strength and lower-body power, during a simulated tournament with prior weight loss, not general norms, causal training effects, or all wrestling populations.","exclusion_or_retraction_flag":"","identifiers":"PMID: 11474340; DOI: 10.1097/00005768-200108000-00019","population_summary":"12 Division I collegiate male wrestlers undergoing a simulated 2-day freestyle wrestling tournament","publication_year":2001,"qualification_note":"Review required because the small collegiate sample, simulated tournament design, freestyle-only context, and prescribed 6% pre-tournament weight loss limit generalisability.","source_excerpt":"The study reported that lower-body power and upper-body isometric strength were significantly reduced as the tournament progressed in the 12 collegiate wrestlers studied.","source_type":"primary research study","source_url":"https://pubmed.ncbi.nlm.nih.gov/11474340/","title":"Physiological and performance responses to tournament wrestling"}'::jsonb,
  '22b628760bfb9036e369f2f1881efbf7feaf2d2a372f6db0dc16002115a145fd',
  'received',
  'Candidate batch topic: Physical demands and strength qualities in competitive wrestling. Awaiting automated screening and source review.'
),
(
  'candidate_research',
  'https://pubmed.ncbi.nlm.nih.gov/19675471/',
  'https://pubmed.ncbi.nlm.nih.gov/19675471',
  '19675471',
  '{"subject":"Physical demands and strength qualities in competitive tennis","evidence_scope":"Examines correlations between selected sprint, jump, leg-stiffness, grip-strength, and plantar-flexor-strength measures and tournament performance ranking in competitive teenage male players; it does not establish causal effects, adult or female norms, or general match physical-demand profiles.","exclusion_or_retraction_flag":"","identifiers":"PMID: 19675471; DOI: 10.1519/JSC.0b013e3181b3df89","population_summary":"12 competitive male tennis players aged 13.6 ± 1.4 years","publication_year":2009,"qualification_note":"Enter review as a relevant primary candidate, with age, sex, small sample size, correlational design, and performance-ranking measure checked before any promotion.","source_excerpt":"The abstract reports that speed, vertical power abilities, and dominant-side maximal strength were significantly correlated with tennis performance, whereas nondominant-side strength and leg stiffness were not correlated with player ranking.","source_type":"original research","source_url":"https://pubmed.ncbi.nlm.nih.gov/19675471/","title":"Physical determinants of tennis performance in competitive teenage players"}'::jsonb,
  '22a2d30fe3628be5427cace36e14f4b006e67294d763e2c4b516467a1d7d4482',
  'received',
  'Candidate batch topic: Physical demands and strength qualities in competitive tennis. Awaiting automated screening and source review.'
)
) as candidate_rows(
  source_type, source_url, normalized_source_url, source_external_id,
  raw_payload, content_sha256, processing_status, processing_note
)
returning id, source_external_id, processing_status;
