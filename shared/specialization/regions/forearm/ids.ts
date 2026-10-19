/**
 * Stable ids for the forearm atlas. Content (names, layers, claims) lives beside this file;
 * these constants are what mappings, the diagram and the database seed refer to, so they
 * never change once shipped. A muscle that is renamed keeps its id.
 */
import { upperArmMuscleIds } from "../upper_arm/ids";

/** The forearm's joint actions (ids from the shared library, `actions/ids.ts`). */
export { forearmActionIds, type ForearmActionId } from "../../actions/ids";

export const FOREARM_REGION_ID = "forearm";

export const forearmMuscleIds = {
  brachioradialis: "forearm.br",
  flexorCarpiRadialis: "forearm.fcr",
  flexorCarpiUlnaris: "forearm.fcu",
  palmarisLongus: "forearm.pl",
  flexorDigitorumSuperficialis: "forearm.fds",
  flexorDigitorumProfundus: "forearm.fdp",
  flexorPollicisLongus: "forearm.fpl",
  pronatorTeres: "forearm.pt",
  pronatorQuadratus: "forearm.pq",
  extensorCarpiRadialisLongus: "forearm.ecrl",
  extensorCarpiRadialisBrevis: "forearm.ecrb",
  extensorCarpiUlnaris: "forearm.ecu",
  extensorDigitorum: "forearm.ed",
  extensorDigitiMinimi: "forearm.edm",
  extensorIndicis: "forearm.ei",
  abductorPollicisLongus: "forearm.apl",
  extensorPollicisBrevis: "forearm.epb",
  extensorPollicisLongus: "forearm.epl",
  supinator: "forearm.supinator",
} as const;

export type ForearmMuscleId = (typeof forearmMuscleIds)[keyof typeof forearmMuscleIds];

/** The 19 core muscles the brief lists (§3), in its order. */
export const coreForearmMuscleIds: readonly ForearmMuscleId[] = Object.values(forearmMuscleIds);

export const forearmGroupIds = {
  /** Flexor-pronator (anterior) compartment. */
  anterior: "forearm.anterior",
  /** Extensor-supinator (posterior) compartment, including the radial group. */
  posterior: "forearm.posterior",
} as const;

export const forearmAdjacentIds = {
  anconeus: "forearm.anconeus",
} as const;

/** The upper-arm muscles the forearm lists as external members (their home is `regions/upper_arm/`). */
export const externalContributorIds = {
  biceps: upperArmMuscleIds.biceps,
  brachialis: upperArmMuscleIds.brachialis,
} as const;

export const FOREARM_MAPPING_VERSION = "forearm_mappings_v1";
