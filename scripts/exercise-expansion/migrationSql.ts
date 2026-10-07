/**
 * Builds the prepared database migration for the 50-exercise expansion from the application's own
 * records, so the database rows cannot drift from the catalog (brief §7). Written to
 * supabase/prepared/exercise_expansion_v1/ by `npx tsx scripts/exercise-expansion/migration.ts`;
 * `exerciseExpansion.migration.test.ts` fails if the committed SQL differs from this output.
 *
 * PREPARED, NOT APPLIED. Applying it needs the owner's authorization (repository rule B009).
 *
 * What it writes, all idempotent (`on conflict ... do nothing`), so a re-run inserts nothing twice:
 * - 11 muscles the database lacks: the neck flexors and extensors, and the forearm's pronators and
 *   supinator. Without them no neck or forearm-rotation mapping could name a real muscle.
 * - 50 exercises, each canonical name ending `__catalog_<id>` so the server joins it by catalog id.
 * - 50 identity mappings in app_exercise_source_mappings ("identity-only, never norm eligibility").
 * - Muscle mappings: each catalog key expanded to the database muscles it stands for, with the role
 *   from the record. `contribution_weight` is the ordinal role default written explicitly (primary
 *   0.75, secondary 0.40, stabilizer 0.20) and `confidence_score` 60 marks an authored estimate on
 *   the table's 0-100 scale; neither is a measured share or derived from a targeting score. They
 *   are inert until a norm exists for the exercise, because only scored lifts are aggregated.
 * - 50 scoring-policy rows: `scoring_mode 'unsupported'`, `is_beta_enabled false`, load semantics
 *   mirroring the app's convention. This is the explicit unsupported route: no normative reference
 *   exists for these exact exercises and protocols, so none is attached by name.
 */
import { exercises, type Exercise } from "../../client/src/lib/exerciseCatalog";
import { descriptorFor } from "../../client/src/lib/exerciseDescriptors";
import { loadConventionFor, type LoadConvention } from "../../shared/loadConventions";
import { measurementFor } from "../../shared/exerciseMeasurement";

export const MIGRATION_NAME = "20261007120000_exercise_expansion_v1";

export const NEW_MUSCLES: readonly { name: string; canonical: string; region: string; group: string }[] = [
  { name: "Sternocleidomastoid", canonical: "sternocleidomastoid", region: "neck", group: "neck flexors" },
  { name: "Scalenes", canonical: "scalenes", region: "neck", group: "neck flexors" },
  { name: "Longus colli", canonical: "longus_colli", region: "neck", group: "deep neck flexors" },
  { name: "Longus capitis", canonical: "longus_capitis", region: "neck", group: "deep neck flexors" },
  { name: "Splenius capitis", canonical: "splenius_capitis", region: "neck", group: "neck extensors" },
  { name: "Splenius cervicis", canonical: "splenius_cervicis", region: "neck", group: "neck extensors" },
  { name: "Semispinalis capitis", canonical: "semispinalis_capitis", region: "neck", group: "neck extensors" },
  { name: "Semispinalis cervicis", canonical: "semispinalis_cervicis", region: "neck", group: "neck extensors" },
  { name: "Pronator teres", canonical: "pronator_teres", region: "forearm", group: "forearm pronators" },
  { name: "Pronator quadratus", canonical: "pronator_quadratus", region: "forearm", group: "forearm pronators" },
  { name: "Supinator", canonical: "supinator", region: "forearm", group: "forearm supinators" },
];

/** The database muscles a catalog key stands for, unless an exercise says otherwise below. */
const DEFAULT_MUSCLES: Record<string, readonly string[]> = {
  chest: ["pectoralis_major_sternocostal", "pectoralis_major_clavicular"],
  frontDelts: ["anterior_deltoid"], sideDelts: ["middle_deltoid"], rearDelts: ["posterior_deltoid"],
  shoulders: ["anterior_deltoid", "middle_deltoid", "posterior_deltoid"],
  triceps: ["triceps_brachii_long_head", "triceps_brachii_lateral_head", "triceps_brachii_medial_head"],
  biceps: ["biceps_brachii"], forearms: ["forearm_flexors"],
  abs: ["rectus_abdominis", "transversus_abdominis"], obliques: ["external_oblique", "internal_oblique"],
  lowerBack: ["erector_spinae"], glutes: ["gluteus_maximus"], abductors: ["gluteus_medius", "gluteus_minimus"],
  quads: ["vastus_lateralis", "vastus_medialis", "vastus_intermedius", "rectus_femoris"],
  // The short head crosses only the knee: a hinge does not load it, a leg curl does.
  hamstrings: ["biceps_femoris_long_head", "semimembranosus", "semitendinosus"],
  adductors: ["adductor_magnus"], calves: ["gastrocnemius"], hipFlexors: ["iliopsoas"],
  lats: ["latissimus_dorsi"], upperBack: ["rhomboid_major", "rhomboid_minor", "middle_trapezius"], traps: ["upper_trapezius"],
  rotatorCuff: ["supraspinatus", "infraspinatus"], serratusAnterior: ["serratus_anterior"],
  neckFlexors: ["sternocleidomastoid", "scalenes", "longus_colli", "longus_capitis"],
  neckExtensors: ["splenius_capitis", "splenius_cervicis", "semispinalis_capitis", "semispinalis_cervicis"],
};

/** Where an exercise's named muscles differ from the key's default (from its descriptor anatomy). */
const OVERRIDES: Record<number, Record<string, readonly string[]>> = {
  409: { forearms: ["pronator_teres", "pronator_quadratus"] },
  410: { forearms: ["supinator"] },
  411: { forearms: ["forearm_flexors", "forearm_extensors"] },
  412: { forearms: ["forearm_flexors", "forearm_extensors"] },
  417: { forearms: ["forearm_extensors"] },
  437: { adductors: ["adductor_magnus", "adductor_longus"] },
  438: { hamstrings: ["biceps_femoris_long_head", "biceps_femoris_short_head", "semimembranosus", "semitendinosus"] },
  439: { hamstrings: ["biceps_femoris_long_head", "biceps_femoris_short_head", "semimembranosus", "semitendinosus"] },
  441: { lowerBack: ["quadratus_lumborum", "erector_spinae"] },
  443: { traps: ["upper_trapezius", "lower_trapezius"] },
  446: { calves: ["gastrocnemius", "soleus"] },
  448: { lowerBack: ["quadratus_lumborum"] },
  449: { lowerBack: ["quadratus_lumborum"] },
};

const ROLE_WEIGHT = { primary: 0.75, secondary: 0.4, stabilizer: 0.2 } as const;
const AUTHORED_CONFIDENCE = 60;

/** The database's policy vocabulary has no assistance, setting or no-load value. */
const POLICY_SEMANTICS: Record<LoadConvention, string> = {
  total_external_load: "total_external_load", per_implement: "per_implement", machine_displayed_load: "machine_displayed_load",
  bodyweight_reps: "bodyweight_reps", per_hand: "per_hand", assistance: "not_applicable", resistance_setting: "not_applicable", no_external_load: "not_applicable",
};

export const snakeName = (name: string) => name.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const canonicalNameFor = (exercise: Pick<Exercise, "id" | "name">) => `${snakeName(exercise.name)}__catalog_${exercise.id}`;
const sql = (value: string | null) => (value === null ? "null" : `'${value.replace(/'/g, "''")}'`);

export type PlannedMapping = { catalogId: number; canonicalName: string; muscle: string; role: keyof typeof ROLE_WEIGHT };

export function plannedMappings(list: readonly Exercise[] = expansionExercises()): PlannedMapping[] {
  return list.flatMap((exercise) => {
    const descriptor = descriptorFor(exercise.id)!;
    const musclesFor = (key: string) => OVERRIDES[exercise.id]?.[key] ?? DEFAULT_MUSCLES[key] ?? [];
    const rows: PlannedMapping[] = [];
    exercise.primaryMuscles.forEach((key) => musclesFor(key).forEach((muscle) => rows.push({ catalogId: exercise.id, canonicalName: canonicalNameFor(exercise), muscle, role: "primary" })));
    exercise.secondaryMuscles.forEach((key) => musclesFor(key).forEach((muscle) => rows.push({ catalogId: exercise.id, canonicalName: canonicalNameFor(exercise), muscle, role: descriptor.stabilizers.includes(key) ? "stabilizer" : "secondary" })));
    // One row per exercise, muscle and role; a muscle reached by two keys keeps its first, strongest role.
    const seen = new Set<string>();
    return rows.filter((row) => { const key = row.muscle; if (seen.has(key)) return false; seen.add(key); return true; });
  });
}

export function expansionExercises(): Exercise[] {
  return exercises.filter((exercise) => exercise.id >= 401 && exercise.id <= 450);
}

/** Every catalog key the expansion uses has a database expansion, and every one names a known muscle. */
export function unmappedKeys(list: readonly Exercise[] = expansionExercises()): string[] {
  return Array.from(new Set(list.flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles]).filter((key) => !DEFAULT_MUSCLES[key])));
}

export function buildExpansionMigration(): { up: string; down: string } {
  const list = expansionExercises();
  const header = `-- Exercise expansion v1 (50-exercise brief, 6 Oct 2026). PREPARED, NOT APPLIED: needs owner authorization (B009).
-- Generated by scripts/exercise-expansion/migration.ts from the app catalog; do not edit by hand.
-- Idempotent: every insert is "on conflict do nothing", so re-running it adds nothing twice.
-- Rollback: ${MIGRATION_NAME}.rollback.sql.
`;
  const muscles = `
-- 1. Muscles the database does not have yet: cervical flexors and extensors, forearm pronators and supinator.
insert into public.muscles (name, canonical_name, region, muscle_group) values
${NEW_MUSCLES.map((muscle) => `  (${sql(muscle.name)}, ${sql(muscle.canonical)}, ${sql(muscle.region)}, ${sql(muscle.group)})`).join(",\n")}
on conflict (canonical_name) do nothing;
`;
  const exerciseRows = list.map((exercise) => {
    const descriptor = descriptorFor(exercise.id)!;
    const laterality = measurementFor(exercise.id).laterality;
    const sides = laterality === "per_side" ? "unilateral" : laterality === "alternating" ? "alternating" : "bilateral";
    return `  (${sql(exercise.name)}, ${sql(canonicalNameFor(exercise))}, ${sql(descriptor.setup)}, ${sql(exercise.equipment)}, ${sql(exercise.movement)}, ${sql(sides)}, ${exercise.id}, ${sql(exercise.sourceGroup)}, ${sql(exercise.category)}, 'LocalForgeWeb/Sports-genome', 'client/src/lib/exerciseCatalogAdditions.ts')`;
  });
  const exercisesSql = `
-- 2. One exercise per catalog id 401-450; the canonical name carries the id, so the server joins by it.
insert into public.exercises (name, canonical_name, description, equipment, movement_pattern, unilateral_or_bilateral, source_catalog_id, source_group, source_category, source_repository, source_path) values
${exerciseRows.join(",\n")}
on conflict (canonical_name) do nothing;
`;
  const identity = `
-- 3. Identity mappings (identity only; never norm or scoring eligibility).
insert into public.app_exercise_source_mappings (local_catalog_id, supabase_exercise_id, mapping_status, mapping_method, review_classification, confidence_reason, reviewed_by, reviewed_at)
select e.source_catalog_id, e.id, 'approved', 'created_for_catalog_id', 'expansion_v1_new_record',
  'Created for this catalog id by exercise expansion v1; no existing row is the same exercise (docs/exercise-expansion-v1/exercise-matrix.csv).',
  'exercise_expansion_v1', now()
from public.exercises e
where e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450 and e.canonical_name like '%\\_\\_catalog\\_%'
on conflict (supabase_exercise_id) do nothing;
`;
  const mappingRows = plannedMappings(list).map((row) => `  (${sql(row.canonicalName)}, ${sql(row.muscle)}, ${sql(row.role)}, ${ROLE_WEIGHT[row.role].toFixed(2)})`);
  const mappingsSql = `
-- 4. Muscle mappings. contribution_weight is the ordinal role default written explicitly (primary 0.75,
--    secondary 0.40, stabilizer 0.20), not a measured share and not a targeting score; confidence_score 60
--    (0-100 scale) marks an authored estimate. Inert until a norm exists: only scored lifts are aggregated.
insert into public.exercise_muscle_mappings (exercise_id, muscle_id, role, contribution_weight, confidence_score, source_text, notes)
select e.id, m.id, v.role, v.weight, ${AUTHORED_CONFIDENCE},
  'Exercise expansion v1: role from the app catalog tag; muscles named in docs/exercise-expansion-v1/evidence.json.',
  'Authored estimate. contribution_weight is the ordinal role default (primary 0.75 / secondary 0.40 / stabilizer 0.20) written explicitly.'
from (values
${mappingRows.join(",\n")}
) as v(canonical_name, muscle, role, weight)
join public.exercises e on e.canonical_name = v.canonical_name
join public.muscles m on m.canonical_name = v.muscle
on conflict (exercise_id, muscle_id, role) do nothing;
`;
  const policyRows = list.map((exercise) => `  (${sql(canonicalNameFor(exercise))}, ${sql(POLICY_SEMANTICS[loadConventionFor(exercise.id)])})`);
  const policySql = `
-- 5. Scoring policy: the explicit unsupported route. No normative reference exists for these exact
--    exercises and protocols (searches recorded in evidence.json), so nothing is scored and no curve
--    is borrowed from a similarly named exercise. load_semantics mirrors shared/loadConventions.ts.
insert into public.strength_exercise_scoring_policy (exercise_id, scoring_version, scoring_mode, load_semantics, preferred_norm_method, protocol_note, confidence_modifier, is_beta_enabled)
select e.id, 'strength_beta_v1', 'unsupported', v.load_semantics, null,
  'Exercise expansion v1: no normative reference for this exact exercise and protocol. Personal tracking only.', 1.0, false
from (values
${policyRows.join(",\n")}
) as v(canonical_name, load_semantics)
join public.exercises e on e.canonical_name = v.canonical_name
on conflict (exercise_id) do nothing;
`;
  const down = `-- Rollback for ${MIGRATION_NAME}. PREPARED, NOT APPLIED.
-- Removes only what the migration added: rows keyed to catalog ids 401-450 and the 11 muscles, the
-- muscles only when nothing else maps to them.
delete from public.strength_exercise_scoring_policy p using public.exercises e
  where p.exercise_id = e.id and e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450;
delete from public.exercise_muscle_mappings mm using public.exercises e
  where mm.exercise_id = e.id and e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450;
delete from public.app_exercise_source_mappings a using public.exercises e
  where a.supabase_exercise_id = e.id and e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450;
delete from public.exercises e
  where e.source_repository = 'LocalForgeWeb/Sports-genome' and e.source_catalog_id between 401 and 450 and e.canonical_name like '%\\_\\_catalog\\_%';
delete from public.muscles m
  where m.canonical_name in (${NEW_MUSCLES.map((muscle) => sql(muscle.canonical)).join(", ")})
    and not exists (select 1 from public.exercise_muscle_mappings mm where mm.muscle_id = m.id);
`;
  return { up: header + "\nbegin;\n" + muscles + exercisesSql + identity + mappingsSql + policySql + "\ncommit;\n", down };
}
