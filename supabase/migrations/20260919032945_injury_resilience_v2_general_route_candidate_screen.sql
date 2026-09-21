-- Screening queue for `promote_general_evidence_routes`.
--
-- A general resilience route needs two things a sport row cannot supply: a population that is
-- genuinely not sport-defined, and a design that reports an outcome rather than a mechanism.
-- This view makes both testable instead of leaving them to a reviewer's eye, and it exists
-- because `sport_population IS NULL` does NOT mean "general population": a large share of
-- sport-null studies describe pitchers, swimmers, rowers or golfers in their population text.
-- Promoting on the null alone would silently convert sport evidence into general evidence.

create or replace view public.resilience_general_route_candidates_v1
with (security_invoker = true) as
with classified as (
  select
    s.id as study_id,
    s.title,
    s.study_type,
    s.publication_year,
    s.pmid,
    s.doi,
    s.sample_size,
    s.population_summary,
    s.sport_population,
    case
      when s.title ~* '(rotator cuff|shoulder|subacromial|scapul)' then 'shoulder'
      when s.title ~* '(patellofemoral|knee|acl|anterior cruciate|patellar tendin)' then 'knee'
      when s.title ~* '(low back|lumbar|lumbopelvic|back pain)' then 'low_back'
      when s.title ~* '(hamstring|nordic)' then 'hamstring'
      when s.title ~* '(achilles|calf|plantar|triceps surae)' then 'calf_achilles'
      when s.title ~* '(ankle|balance board|proprioceptive training)' then 'ankle'
      when s.title ~* '(groin|adductor|copenhagen)' then 'groin_adductors'
      when s.title ~* '(neck|cervical)' then 'neck'
      when s.title ~* '(hip|gluteal)' then 'hip'
      when s.title ~* '(elbow|epicondyl|wrist|forearm)' then 'elbow_wrist'
      else null
    end as region_guess,
    case
      when s.sport_population is not null then 'sport_labelled'
      when s.population_summary ~* '(player|pitcher|athlete|collegiate|professional|elite|team|league|competitiv|rower|swimmer|golfer|sprinter|dancer|crossfit)' then 'sport_text_unlabelled'
      when s.population_summary ~* '(patient|chronic|clinical|sedentary|office worker|general population|untrained|community-dwelling|older adult|healthy adult|healthy participant|healthy subject)' then 'clinical_or_general'
      else 'unclassified'
    end as population_class,
    case
      when s.study_type ~* '(systematic|meta-analysis)' then 'review'
      when s.study_type ~* '(randomi|trial|intervention|longitudinal|cohort)' then 'intervention_outcome'
      when s.study_type ~* '(emg|electromyograph|biomechanic|modeling|modelling|kinematic|kinetic)' then 'mechanism_emg_biomechanics'
      when s.study_type ~* '(reliability|normative|reference|test-retest|descriptive|cross-sectional|observational|case-control|survey)' then 'reliability_normative'
      else 'other'
    end as design_class
  from public.studies s
  where s.title ~* '(exercis|strength|resistance train|rehabilit|loading|eccentric|training program|therapy|prevention|tendinopath|impingement)'
)
select
  study_id,
  title,
  study_type,
  publication_year,
  pmid,
  doi,
  sample_size,
  population_summary,
  sport_population,
  region_guess,
  population_class,
  design_class,
  (region_guess is not null
   and population_class = 'clinical_or_general'
   and design_class in ('intervention_outcome','review')) as eligible_for_general_route,
  case
    when region_guess is null then 'No resilience region identified in the title'
    when population_class = 'sport_labelled' then 'Sport-labelled population: belongs to the sport_specific route'
    when population_class = 'sport_text_unlabelled' then 'sport_population is NULL but the population text is sport-specific; the label needs correcting before any reuse'
    when population_class = 'unclassified' then 'Population not classifiable from the stored summary'
    when design_class = 'mechanism_emg_biomechanics' then 'Mechanism evidence (EMG/biomechanics): describes activation, not an outcome a recommendation can rest on'
    when design_class = 'reliability_normative' then 'Reliability or normative design: no intervention outcome'
    when design_class = 'other' then 'Design not classifiable from the stored study_type'
    else null
  end as disqualifying_reason
from classified;

comment on view public.resilience_general_route_candidates_v1 is
  'Screening queue for promoting sport-agnostic resilience routes. eligible_for_general_route = true is a necessary, not sufficient, condition: a reviewer still confirms presentation, dose, directness and limitations against the source before a row enters resilience_recommendations_general.';
