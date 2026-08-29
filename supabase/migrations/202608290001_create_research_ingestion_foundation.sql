-- Sports Genome research ingestion foundation.
-- Reference data remains separate from private athlete records.

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  query text,
  status text not null default 'created' check (status in ('created','collecting','screening','extracting','validating','completed','failed','cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  candidates_found integer not null default 0 check (candidates_found >= 0),
  candidates_screened integer not null default 0 check (candidates_screened >= 0),
  approved_count integer not null default 0 check (approved_count >= 0),
  review_count integer not null default 0 check (review_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.raw_imports (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_type text not null,
  source_url text,
  normalized_source_url text,
  source_external_id text,
  raw_payload jsonb not null,
  content_sha256 text not null,
  discovered_at timestamptz not null default now(),
  processing_status text not null default 'received' check (processing_status in ('received','preprocessed','screened','extracted','staged','rejected','failed')),
  processing_note text,
  created_at timestamptz not null default now()
);
create unique index raw_imports_source_identity_unique on public.raw_imports (source_type, source_external_id) where source_external_id is not null;
create unique index raw_imports_payload_unique on public.raw_imports (content_sha256);
create index raw_imports_batch_status_idx on public.raw_imports (import_batch_id, processing_status);

create table public.studies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  normalized_title text not null,
  citation_fingerprint text not null,
  abstract text,
  doi text,
  pmid text,
  openalex_id text,
  semantic_scholar_id text,
  source_url text not null,
  publication_year integer check (publication_year between 1800 and 2200),
  publication_date date,
  journal text,
  study_type text,
  sample_size integer check (sample_size is null or sample_size >= 0),
  population_summary text,
  sex text,
  age_mean numeric(6,2),
  age_min numeric(6,2),
  age_max numeric(6,2),
  training_status text,
  sport_population text,
  methodological_quality_score numeric(5,2) check (methodological_quality_score between 0 and 100),
  relevance_score numeric(5,2) check (relevance_score between 0 and 100),
  extraction_confidence_score numeric(5,2) check (extraction_confidence_score between 0 and 100),
  evidence_level text,
  original_raw_import_id uuid references public.raw_imports(id) on delete set null,
  promoted_from_staging_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index studies_fingerprint_unique on public.studies (citation_fingerprint);
create unique index studies_doi_unique on public.studies (lower(doi)) where doi is not null;
create unique index studies_pmid_unique on public.studies (pmid) where pmid is not null;
create unique index studies_openalex_unique on public.studies (openalex_id) where openalex_id is not null;
create unique index studies_semantic_scholar_unique on public.studies (semantic_scholar_id) where semantic_scholar_id is not null;
create index studies_title_year_idx on public.studies (normalized_title, publication_year);

create table public.study_populations (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  subgroup_name text,
  sample_size integer check (sample_size is null or sample_size >= 0),
  sex text,
  age_mean numeric(6,2), age_sd numeric(6,2), age_min numeric(6,2), age_max numeric(6,2),
  bodyweight_mean_kg numeric(7,3), bodyweight_sd_kg numeric(7,3),
  training_status text, sport text, competition_level text, notes text,
  created_at timestamptz not null default now()
);
create index study_populations_study_idx on public.study_populations (study_id);

create table public.study_outcomes (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  population_id uuid references public.study_populations(id) on delete set null,
  metric text not null, value numeric(14,5), value_secondary numeric(14,5), value_text text, unit text,
  statistic_type text, percentile numeric(5,2) check (percentile is null or percentile between 0 and 100),
  effect_size numeric(10,5), confidence_interval_low numeric(14,5), confidence_interval_high numeric(14,5),
  p_value numeric(12,10), measurement_method text, subgroup text, notes text, source_text text not null,
  original_raw_import_id uuid references public.raw_imports(id) on delete set null,
  created_at timestamptz not null default now()
);
create index study_outcomes_study_metric_idx on public.study_outcomes (study_id, metric);

create table public.exercises (
  id uuid primary key default gen_random_uuid(), name text not null, canonical_name text not null unique,
  description text, equipment text, exercise_type text, movement_pattern text, unilateral_or_bilateral text,
  open_or_closed_chain text, primary_plane text, skill_complexity text, stability_requirement text, loadability text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.exercise_aliases (
  id uuid primary key default gen_random_uuid(), exercise_id uuid not null references public.exercises(id) on delete cascade,
  alias text not null, normalized_alias text not null unique, source_wording text, created_at timestamptz not null default now()
);
create table public.exercise_variants (
  id uuid primary key default gen_random_uuid(), parent_exercise_id uuid not null references public.exercises(id) on delete cascade,
  name text not null, canonical_name text not null unique, grip text, stance text, angle text, range_of_motion text,
  equipment_variant text, technique_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.muscles (
  id uuid primary key default gen_random_uuid(), name text not null, canonical_name text not null unique,
  region text, muscle_group text, created_at timestamptz not null default now()
);
create table public.muscle_aliases (
  id uuid primary key default gen_random_uuid(), muscle_id uuid not null references public.muscles(id) on delete cascade,
  alias text not null, normalized_alias text not null unique, source_wording text, created_at timestamptz not null default now()
);
create table public.movement_patterns (
  id uuid primary key default gen_random_uuid(), name text not null, canonical_name text not null unique,
  description text, created_at timestamptz not null default now()
);
create table public.athletic_attributes (
  id uuid primary key default gen_random_uuid(), name text not null, canonical_name text not null unique,
  description text, created_at timestamptz not null default now()
);
create table public.sports (
  id uuid primary key default gen_random_uuid(), name text not null, canonical_name text not null unique,
  category text, created_at timestamptz not null default now()
);

create table public.exercise_muscle_mappings (
  id uuid primary key default gen_random_uuid(), exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_id uuid not null references public.muscles(id) on delete cascade, role text not null check (role in ('primary','secondary','stabilizer')),
  contribution_weight numeric(6,5) check (contribution_weight between 0 and 1), confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  source_study_id uuid references public.studies(id) on delete set null, original_raw_import_id uuid references public.raw_imports(id) on delete set null,
  source_text text, notes text, unique (exercise_id, muscle_id, role)
);
create table public.exercise_movement_mappings (
  id uuid primary key default gen_random_uuid(), exercise_id uuid not null references public.exercises(id) on delete cascade,
  movement_pattern_id uuid not null references public.movement_patterns(id) on delete cascade,
  contribution_weight numeric(6,5) check (contribution_weight between 0 and 1), confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  source_study_id uuid references public.studies(id) on delete set null, original_raw_import_id uuid references public.raw_imports(id) on delete set null,
  source_text text, unique (exercise_id, movement_pattern_id)
);
create table public.sport_demands (
  id uuid primary key default gen_random_uuid(), sport_id uuid not null references public.sports(id) on delete cascade,
  athletic_attribute_id uuid not null references public.athletic_attributes(id) on delete cascade,
  importance_weight numeric(6,5) check (importance_weight between 0 and 1), confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  source_study_id uuid references public.studies(id) on delete set null, source_text text, notes text, unique (sport_id, athletic_attribute_id)
);
create table public.sport_movement_demands (
  id uuid primary key default gen_random_uuid(), sport_id uuid not null references public.sports(id) on delete cascade,
  movement_pattern_id uuid not null references public.movement_patterns(id) on delete cascade,
  importance_weight numeric(6,5) check (importance_weight between 0 and 1), confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  source_study_id uuid references public.studies(id) on delete set null, source_text text, unique (sport_id, movement_pattern_id)
);
create table public.sport_muscle_demands (
  id uuid primary key default gen_random_uuid(), sport_id uuid not null references public.sports(id) on delete cascade,
  muscle_id uuid not null references public.muscles(id) on delete cascade,
  importance_weight numeric(6,5) check (importance_weight between 0 and 1), confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  source_study_id uuid references public.studies(id) on delete set null, source_text text, unique (sport_id, muscle_id)
);

create table public.strength_norms (
  id uuid primary key default gen_random_uuid(), exercise_id uuid not null references public.exercises(id) on delete restrict,
  sex text, age_min numeric(6,2), age_max numeric(6,2), bodyweight_min_kg numeric(7,3), bodyweight_max_kg numeric(7,3),
  training_status text, sport text, competition_level text, percentile numeric(5,2) not null check (percentile between 0 and 100),
  value numeric(14,5) not null, unit text not null, normalization_method text not null, sample_size integer check (sample_size is null or sample_size >= 0),
  source_study_id uuid not null references public.studies(id) on delete restrict, source_text text not null,
  confidence_score numeric(5,2) check (confidence_score between 0 and 100), original_raw_import_id uuid references public.raw_imports(id) on delete set null,
  created_at timestamptz not null default now()
);
create index strength_norms_match_idx on public.strength_norms (exercise_id, sex, sport, percentile);
create table public.performance_tests (
  id uuid primary key default gen_random_uuid(), name text not null, canonical_name text not null unique,
  unit text, description text, created_at timestamptz not null default now()
);
create table public.performance_norms (
  id uuid primary key default gen_random_uuid(), performance_test_id uuid not null references public.performance_tests(id) on delete restrict,
  sex text, age_min numeric(6,2), age_max numeric(6,2), sport text, competition_level text,
  percentile numeric(5,2) not null check (percentile between 0 and 100), value numeric(14,5) not null, unit text not null,
  sample_size integer check (sample_size is null or sample_size >= 0), source_study_id uuid not null references public.studies(id) on delete restrict,
  source_text text not null, confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  original_raw_import_id uuid references public.raw_imports(id) on delete set null, created_at timestamptz not null default now()
);

create table public.staging_studies (
  id uuid primary key default gen_random_uuid(), original_raw_import_id uuid not null references public.raw_imports(id) on delete cascade,
  title text, normalized_title text, citation_fingerprint text, abstract text, doi text, pmid text, openalex_id text, semantic_scholar_id text,
  source_url text, publication_year integer, journal text, study_type text, sample_size integer, population_summary text, sex text,
  age_mean numeric(6,2), age_min numeric(6,2), age_max numeric(6,2), training_status text, sport_population text,
  screening_decision text not null check (screening_decision in ('approve','review','reject')),
  relevance_score numeric(5,2) check (relevance_score between 0 and 100), methodological_quality_score numeric(5,2) check (methodological_quality_score between 0 and 100),
  population_relevance_score numeric(5,2) check (population_relevance_score between 0 and 100), measurement_reliability_score numeric(5,2) check (measurement_reliability_score between 0 and 100),
  specificity_score numeric(5,2) check (specificity_score between 0 and 100), extraction_confidence_score numeric(5,2) check (extraction_confidence_score between 0 and 100), overall_confidence_score numeric(5,2) check (overall_confidence_score between 0 and 100),
  screening_reason text, rejection_reason text, validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid','needs_review','promoted')),
  duplicate_of_study_id uuid references public.studies(id) on delete set null, extraction_model text, extraction_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index staging_studies_raw_unique on public.staging_studies (original_raw_import_id);
create index staging_studies_decision_validation_idx on public.staging_studies (screening_decision, validation_status);
create table public.staging_exercises (
  id uuid primary key default gen_random_uuid(), original_raw_import_id uuid not null references public.raw_imports(id) on delete cascade,
  name text not null, canonical_name text, description text, equipment text, exercise_type text, movement_pattern text,
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid','needs_review','promoted')),
  duplicate_of_exercise_id uuid references public.exercises(id) on delete set null, confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  extraction_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.staging_strength_norms (
  id uuid primary key default gen_random_uuid(), original_raw_import_id uuid not null references public.raw_imports(id) on delete cascade,
  proposed_exercise_name text, sex text, age_min numeric(6,2), age_max numeric(6,2), bodyweight_min_kg numeric(7,3), bodyweight_max_kg numeric(7,3),
  training_status text, sport text, competition_level text, percentile numeric(5,2), value numeric(14,5), unit text, normalization_method text,
  sample_size integer, proposed_study_id uuid references public.studies(id) on delete set null, source_text text,
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid','needs_review','promoted')),
  confidence_score numeric(5,2) check (confidence_score between 0 and 100), extraction_notes text, created_at timestamptz not null default now()
);
create table public.staging_sport_demands (
  id uuid primary key default gen_random_uuid(), original_raw_import_id uuid not null references public.raw_imports(id) on delete cascade,
  proposed_sport_name text not null, proposed_attribute_name text, proposed_movement_name text, proposed_muscle_name text,
  importance_weight numeric(6,5) check (importance_weight between 0 and 1), confidence_score numeric(5,2) check (confidence_score between 0 and 100),
  proposed_study_id uuid references public.studies(id) on delete set null, source_text text,
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid','needs_review','promoted')),
  extraction_notes text, created_at timestamptz not null default now()
);
create table public.staging_mappings (
  id uuid primary key default gen_random_uuid(), original_raw_import_id uuid not null references public.raw_imports(id) on delete cascade,
  mapping_type text not null check (mapping_type in ('exercise_muscle','exercise_movement','sport_attribute','sport_movement','sport_muscle')),
  source_entity_name text not null, target_entity_name text not null, role text, contribution_weight numeric(6,5) check (contribution_weight between 0 and 1),
  confidence_score numeric(5,2) check (confidence_score between 0 and 100), proposed_study_id uuid references public.studies(id) on delete set null,
  source_text text, validation_status text not null default 'pending' check (validation_status in ('pending','valid','invalid','needs_review','promoted')),
  extraction_notes text, created_at timestamptz not null default now()
);
create table public.validation_errors (
  id uuid primary key default gen_random_uuid(), import_batch_id uuid references public.import_batches(id) on delete cascade,
  record_type text not null, record_id uuid, error_code text not null, error_message text not null,
  severity text not null check (severity in ('info','warning','error','critical')), created_at timestamptz not null default now(), resolved_at timestamptz, resolution_note text
);
create index validation_errors_open_idx on public.validation_errors (record_type, record_id) where resolved_at is null;

do $$
declare t text;
begin
  foreach t in array array['import_batches','raw_imports','studies','study_populations','study_outcomes','exercises','exercise_aliases','exercise_variants','muscles','muscle_aliases','movement_patterns','athletic_attributes','sports','exercise_muscle_mappings','exercise_movement_mappings','sport_demands','sport_movement_demands','sport_muscle_demands','strength_norms','performance_tests','performance_norms','staging_studies','staging_exercises','staging_strength_norms','staging_sport_demands','staging_mappings','validation_errors']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;
