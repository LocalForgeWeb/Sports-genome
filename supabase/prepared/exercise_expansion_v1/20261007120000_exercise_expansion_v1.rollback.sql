-- Rollback for 20261007120000_exercise_expansion_v1. PREPARED, NOT APPLIED.
-- Removes only what the migration added: rows keyed to catalog ids 401-450 and the 11 muscles, the
-- muscles only when nothing else maps to them.
delete from public.strength_exercise_scoring_policy p using public.exercises e
  where p.exercise_id = e.id and e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450;
delete from public.exercise_muscle_mappings mm using public.exercises e
  where mm.exercise_id = e.id and e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450;
delete from public.app_exercise_source_mappings a using public.exercises e
  where a.supabase_exercise_id = e.id and e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450;
delete from public.exercises e
  where e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450 and e.canonical_name like '%\_\_catalog\_%';
delete from public.muscles m
  where m.canonical_name in ('sternocleidomastoid', 'scalenes', 'longus_colli', 'longus_capitis', 'splenius_capitis', 'splenius_cervicis', 'semispinalis_capitis', 'semispinalis_cervicis', 'pronator_teres', 'pronator_quadratus', 'supinator')
    and not exists (select 1 from public.exercise_muscle_mappings mm where mm.muscle_id = m.id);
