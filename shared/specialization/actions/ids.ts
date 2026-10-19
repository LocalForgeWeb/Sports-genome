/**
 * Joint action ids, shared by every region (docs/specialization-atlas/10-multi-region.md §1.3).
 * One id per joint action, whichever region names it: the forearm's elbow flexion and the upper
 * arm's are one action. Ids never change once shipped; the records are in `forearm.ts` (as
 * shipped with the forearm atlas) and `joints.ts` (the other regions' actions of §1.2), and a
 * region lane adds an action only in `actions/<region>.ts`.
 */

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

export const shoulderActionIds = {
  flexion: "shoulder.flexion",
  extension: "shoulder.extension",
  abduction: "shoulder.abduction",
  adduction: "shoulder.adduction",
  horizontalAdduction: "shoulder.horizontal_adduction",
  horizontalAbduction: "shoulder.horizontal_abduction",
  externalRotation: "shoulder.external_rotation",
  internalRotation: "shoulder.internal_rotation",
} as const;

export const scapulaActionIds = {
  elevation: "scapula.elevation",
  depression: "scapula.depression",
  protraction: "scapula.protraction",
  retraction: "scapula.retraction",
  upwardRotation: "scapula.upward_rotation",
  downwardRotation: "scapula.downward_rotation",
} as const;

export const spineActionIds = {
  flexion: "spine.flexion",
  extension: "spine.extension",
  lateralFlexion: "spine.lateral_flexion",
  rotation: "spine.rotation",
} as const;

export const abdomenActionIds = {
  compression: "abdomen.compression",
} as const;

export const hipActionIds = {
  flexion: "hip.flexion",
  extension: "hip.extension",
  abduction: "hip.abduction",
  adduction: "hip.adduction",
  externalRotation: "hip.external_rotation",
  internalRotation: "hip.internal_rotation",
} as const;

export const kneeActionIds = {
  flexion: "knee.flexion",
  extension: "knee.extension",
} as const;

export const ankleActionIds = {
  plantarFlexion: "ankle.plantar_flexion",
  dorsiflexion: "ankle.dorsiflexion",
} as const;

export const footActionIds = {
  inversion: "foot.inversion",
  eversion: "foot.eversion",
} as const;
