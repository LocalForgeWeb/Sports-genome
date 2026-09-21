-- Canonical capacity/constraint taxonomy seed.
-- Targets are selectable goals. A target with no reviewed evidence route resolves to the
-- insufficiency state; that is the intended behaviour, not a gap to paper over.

insert into public.resilience_targets (target_key, name, region, target_type, laterality_supported, notes) values
  ('neck','Neck','neck','body_region',false,null),
  ('thoracic_spine','Thoracic spine','thoracic spine','body_region',false,null),
  ('lumbar_spine','Low back','low back','body_region',false,null),
  ('spine_general','Spine (general)','spine','body_region',false,'Broad granularity retained because source evidence is reported at this level.'),
  ('shoulder','Shoulder','shoulder','body_region',true,null),
  ('elbow','Elbow','elbow','body_region',true,null),
  ('forearm','Forearm','forearm','body_region',true,null),
  ('wrist_hand','Wrist and hand','wrist/hand','body_region',true,null),
  ('upper_limb_general','Upper limb (general)','upper limb','body_region',true,'Broad granularity retained because source evidence is reported at this level.'),
  ('hip','Hip','hip','body_region',true,null),
  ('groin_adductors','Groin and adductors','groin','body_region',true,null),
  ('hamstring','Hamstrings','hamstring','body_region',true,null),
  ('quadriceps','Quadriceps','thigh','body_region',true,null),
  ('knee','Knee','knee','body_region',true,null),
  ('calf_achilles','Calf and Achilles','lower leg','body_region',true,null),
  ('ankle','Ankle','ankle','body_region',true,null),
  ('foot','Foot','foot','body_region',true,null),
  ('lower_limb_general','Lower limb (general)','lower limb','body_region',true,'Broad granularity retained because source evidence is reported at this level.'),
  ('general_musculoskeletal','General musculoskeletal','whole body','body_region',false,'Multisite or whole-body source evidence.'),
  ('bone_general','Bone (general)','whole body','tissue_system',false,null),
  ('tibia','Tibia','lower leg','tissue_system',true,null),
  ('landing_deceleration','Landing and deceleration','lower limb','functional_task',true,null),
  ('change_of_direction','Change of direction','lower limb','functional_task',true,null),
  ('overhead_reaching','Overhead reaching and throwing','shoulder','functional_task',true,null),
  ('lifting_carrying','Lifting and carrying','trunk','functional_task',false,null),
  ('sprinting','Sprinting','lower limb','functional_task',false,null)
on conflict (target_key) do nothing;

-- Region-string mapping. Anatomy only: no evidence claim is created or transferred here.
-- Compound multi-region strings stay `ambiguous`; non-musculoskeletal strings are `out_of_scope`.
with mapping(alias, target_key, review_status, reviewer_note) as (values
  ('shoulder','shoulder','mapped',null),
  ('shoulder/scapula','shoulder','mapped','Scapular qualifier kept on the shoulder target.'),
  ('shoulder/upper limb','upper_limb_general','mapped','Source reports at upper-limb granularity.'),
  ('shoulder / upper limb','upper_limb_general','mapped','Source reports at upper-limb granularity.'),
  ('shoulder/elbow',null,'ambiguous','Two distinct regions in one string.'),
  ('shoulder_elbow',null,'ambiguous','Two distinct regions in one string.'),
  ('shoulder/forearm-wrist',null,'ambiguous','Three distinct regions in one string.'),
  ('shoulder_hip_kinetic_chain',null,'ambiguous','Spans upper and lower body.'),
  ('spine/shoulder',null,'ambiguous','Two distinct regions in one string.'),
  ('elbow','elbow','mapped',null),
  ('elbow/throwing arm','elbow','mapped','Throwing-arm qualifier; region is the elbow.'),
  ('forearm','forearm','mapped',null),
  ('wrist','wrist_hand','mapped',null),
  ('wrist/distal radius','wrist_hand','mapped','Distal radius qualifier kept on the wrist/hand target.'),
  ('neck/cervical','neck','mapped',null),
  ('head/neck',null,'ambiguous','Mixes the in-scope neck with out-of-scope head/brain content.'),
  ('head',null,'out_of_scope','Not musculoskeletal capacity.'),
  ('head/brain',null,'out_of_scope','Not musculoskeletal capacity.'),
  ('head/face',null,'out_of_scope','Not musculoskeletal capacity.'),
  ('face/head',null,'out_of_scope','Not musculoskeletal capacity.'),
  ('systemic',null,'out_of_scope','Not a musculoskeletal region.'),
  ('thoracic spine','thoracic_spine','mapped',null),
  ('spine','spine_general','mapped','Source reports at whole-spine granularity.'),
  ('lumbar spine','lumbar_spine','mapped',null),
  ('low back','lumbar_spine','mapped',null),
  ('low back / lumbar','lumbar_spine','mapped',null),
  ('low back / lumbopelvic region','lumbar_spine','mapped','Lumbopelvic qualifier kept on the low-back target.'),
  ('posterior chain / low back',null,'ambiguous','Mixes a regional target with a multi-muscle chain.'),
  ('groin and low back',null,'ambiguous','Two distinct regions in one string.'),
  ('knee/lower back/hip-groin',null,'ambiguous','Three distinct regions in one string.'),
  ('hip','hip','mapped',null),
  ('hip/groin',null,'ambiguous','Hip and groin are separate targets.'),
  ('groin/hip',null,'ambiguous','Hip and groin are separate targets.'),
  ('groin','groin_adductors','mapped',null),
  ('hamstring','hamstring','mapped',null),
  ('hamstring/posterior chain','hamstring','mapped','Posterior-chain qualifier kept on the hamstring target.'),
  ('knee','knee','mapped',null),
  ('knee/hip',null,'ambiguous','Two distinct regions in one string.'),
  ('knee/ankle',null,'ambiguous','Two distinct regions in one string.'),
  ('ankle','ankle','mapped',null),
  ('calf/ankle/foot',null,'ambiguous','Three distinct regions in one string.'),
  ('tibia','tibia','mapped',null),
  ('bone','bone_general','mapped',null),
  ('lower extremity','lower_limb_general','mapped',null),
  ('Lower extremity','lower_limb_general','mapped','Case variant of an existing string.'),
  ('lower limb','lower_limb_general','mapped',null),
  ('lower_limb','lower_limb_general','mapped','Underscore variant of an existing string.'),
  ('lower limb / multisite','lower_limb_general','mapped','Multisite qualifier kept at lower-limb granularity.'),
  ('upper extremity / trunk',null,'ambiguous','Spans upper limb and trunk.'),
  ('whole body','general_musculoskeletal','mapped',null),
  ('multisite / general musculoskeletal','general_musculoskeletal','mapped',null)
)
insert into public.resilience_target_aliases (alias, source_relation, target_id, review_status, reviewer_note)
select m.alias,
       'injury_resilience_recommendations.injury_region',
       t.id,
       m.review_status,
       m.reviewer_note
from mapping m
left join public.resilience_targets t on t.target_key = m.target_key
where exists (
  select 1 from public.injury_resilience_recommendations r where r.injury_region = m.alias
)
on conflict (alias, source_relation) do nothing;

-- Presentation strings enter the review queue untouched. Mapping a presentation is an
-- evidence judgement, not an anatomical one, so none is inferred here.
insert into public.resilience_target_aliases (alias, source_relation, review_status, reviewer_note)
select distinct r.injury_or_constraint,
       'injury_resilience_recommendations.injury_or_constraint',
       'unresolved',
       'Awaiting presentation-type review.'
from public.injury_resilience_recommendations r
where r.injury_or_constraint is not null
on conflict (alias, source_relation) do nothing;

insert into public.resilience_target_aliases (alias, source_relation, review_status, reviewer_note)
select distinct c.injury_or_constraint,
       'injury_constraints.injury_or_constraint',
       'unresolved',
       'Awaiting presentation-type review.'
from public.injury_constraints c
where c.injury_or_constraint is not null
on conflict (alias, source_relation) do nothing;
