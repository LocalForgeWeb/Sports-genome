/**
 * Stable ids for the forearm atlas. Content (names, layers, claims) lives in
 * `regions/forearm/`; these constants are what mappings, the diagram and the database
 * seed refer to, so they never change once shipped. A muscle that is renamed keeps its id.
 */

export const FOREARM_REGION_ID = "forearm";
export const UPPER_ARM_REGION_ID = "upper_arm";

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

export const externalContributorIds = {
  biceps: "upper_arm.biceps",
  brachialis: "upper_arm.brachialis",
} as const;

export const forearmActionIds = {
  elbowFlexion: "elbow.flexion",
  elbowExtension: "elbow.extension",
  pronation: "forearm.pronation",
  supination: "forearm.supination",
  wristFlexion: "wrist.flexion",
  wristExtension: "wrist.extension",
  radialDeviation: "wrist.radial_deviation",
  ulnarDeviation: "wrist.ulnar_deviation",
  fingersMcpFlexion: "fingers.mcp_flexion",
  fingersPipFlexion: "fingers.pip_flexion",
  fingersDipFlexion: "fingers.dip_flexion",
  fingersExtension: "fingers.extension",
  littleFingerExtension: "little_finger.extension",
  indexFingerExtension: "index_finger.extension",
  thumbIpFlexion: "thumb.ip_flexion",
  thumbCmcAbduction: "thumb.cmc_abduction",
  thumbMcpExtension: "thumb.mcp_extension",
  thumbIpExtension: "thumb.ip_extension",
  palmarAponeurosisTension: "hand.palmar_aponeurosis_tension",
  distalRadioulnarStabilization: "forearm.distal_radioulnar_stabilization",
} as const;

export type ForearmActionId = (typeof forearmActionIds)[keyof typeof forearmActionIds];

export const FOREARM_MAPPING_VERSION = "forearm_mappings_v1";
export const EXPOSURE_RULE_VERSION = "specialization_exposure_v1";

/** Default variant id for a catalog exercise. */
export const variantIdFor = (catalogExerciseId: number) => `cat-${catalogExerciseId}`;
