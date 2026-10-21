import { forearmAdjacentIds, forearmMuscleIds as m, FOREARM_REGION_ID } from "@shared/specialization/ids";
import type { NodeId, RegionId } from "@shared/specialization/types";
import { muscleManifest } from "./muscleManifest";

/**
 * Which structure of the 3D model is which atlas muscle (SG-FOREARM-INTEGRATION-20261019 §4).
 *
 * The model's manifest names its 20 structures by its own source ids ("flexor-carpi-ulnaris");
 * the app, the database and every summary use the canonical atlas ids ("forearm.fcu"). This
 * table is the only bridge between them: one explicit row per structure, written out by hand.
 * Nothing is matched by substring or by display name, no record is renamed, and the GLB is
 * untouched. Anconeus is the 20th structure: an adjacent muscle with its own canonical id,
 * kept apart from the 19 core muscles exactly as the atlas keeps it.
 *
 * A multi-head muscle (FDS, FCU, pronator teres, ECU) is one source id whose manifest entry
 * lists every head's mesh, so selecting the muscle lights all of its heads together.
 */
export const forearmModelSourceToCanonical = {
  brachioradialis: m.brachioradialis,
  anconeus: forearmAdjacentIds.anconeus,
  supinator: m.supinator,
  "flexor-digitorum-superficialis": m.flexorDigitorumSuperficialis,
  "flexor-digitorum-profundus": m.flexorDigitorumProfundus,
  "flexor-carpi-ulnaris": m.flexorCarpiUlnaris,
  "flexor-carpi-radialis": m.flexorCarpiRadialis,
  "palmaris-longus": m.palmarisLongus,
  "flexor-pollicis-longus": m.flexorPollicisLongus,
  "pronator-teres": m.pronatorTeres,
  "pronator-quadratus": m.pronatorQuadratus,
  "extensor-digitorum": m.extensorDigitorum,
  "extensor-carpi-radialis-brevis": m.extensorCarpiRadialisBrevis,
  "extensor-carpi-radialis-longus": m.extensorCarpiRadialisLongus,
  "extensor-carpi-ulnaris": m.extensorCarpiUlnaris,
  "extensor-digiti-minimi": m.extensorDigitiMinimi,
  "extensor-indicis": m.extensorIndicis,
  "extensor-pollicis-longus": m.extensorPollicisLongus,
  "extensor-pollicis-brevis": m.extensorPollicisBrevis,
  "abductor-pollicis-longus": m.abductorPollicisLongus,
} as const satisfies Record<string, NodeId>;

export type ForearmModelSourceId = keyof typeof forearmModelSourceToCanonical;

const toCanonical = new Map<string, NodeId>(Object.entries(forearmModelSourceToCanonical));
const toSource = new Map<NodeId, ForearmModelSourceId>(
  (Object.entries(forearmModelSourceToCanonical) as [ForearmModelSourceId, NodeId][]).map(([source, canonical]) => [canonical, source]),
);

/** The canonical atlas id for a structure the model reports, or null for an id it does not know (never a guess). */
export function canonicalForModelSource(sourceId: string | null | undefined): NodeId | null {
  return sourceId ? toCanonical.get(sourceId) ?? null : null;
}

/** The model's structure for a canonical id, or null when the model does not draw that muscle (biceps, a compartment, an unknown id). */
export function modelSourceForCanonical(nodeId: string | null | undefined): ForearmModelSourceId | null {
  return nodeId ? toSource.get(nodeId) ?? null : null;
}

/** Every canonical id the model draws, in the manifest's order. */
export const forearmModelCanonicalIds: readonly NodeId[] = muscleManifest.map((entry) => toCanonical.get(entry.id)).filter((id): id is NodeId => Boolean(id));

/** The regions with a 3D model, and where its files are. Only the forearm has one. */
export type AnatomyModelConfig = {
  regionId: RegionId;
  /** The GLB, served from client/public. Overridable at build time for a CDN copy of the same file. */
  modelUrl: string;
  /** The folder holding draco_decoder.js / .wasm / draco_wasm_wrapper.js, with a trailing slash. */
  decoderPath: string;
};

const base = (import.meta.env?.BASE_URL as string | undefined) ?? "/";
const withBase = (path: string) => `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

export function anatomyModelFor(regionId: RegionId): AnatomyModelConfig | null {
  if (regionId !== FOREARM_REGION_ID) return null;
  return {
    regionId,
    modelUrl: (import.meta.env?.VITE_ANATOMY_FOREARM_MODEL_URL as string | undefined) || withBase("assets/anatomy/upper-limb-open3dmodel.glb"),
    decoderPath: (import.meta.env?.VITE_ANATOMY_DRACO_PATH as string | undefined) || withBase("draco/"),
  };
}
