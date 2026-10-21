import type { NodeAction } from "../../types";
import { externalContributorIds as ext, forearmActionIds as a, forearmAdjacentIds as adj, forearmMuscleIds as m } from "../../ids";

/**
 * Which joint actions each node performs, each resting on a function claim.
 *
 * `prime` is a main action of the muscle; `assist` means it helps. Every row cites the
 * node's own function claim (`<node>.function` in claims.ts), and the test in
 * client/src/lib/specialization/forearmAnatomy.test.ts fails if a row points at a claim
 * of another node. Recommendations and goals read these rows, so an action is listed only
 * when the reviewed sources name it; things deliberately left out are:
 * - brachioradialis turning the forearm toward thumb-up: real, but only from either end
 *   of rotation, and listing it under pronation and supination would offer it as a
 *   pronator or supinator target. Said in its claim and caveats instead.
 * - abductor pollicis longus at the wrist: references disagree on the direction.
 * - flexor pollicis longus at the thumb knuckle: no action id exists for thumb-knuckle
 *   flexion, and adding one to ids.ts is outside this content lane. Said in its claim.
 * - small "weak" extras (FCU and ECRL at the elbow, FCR in pronation, EI, EPL and EDM at
 *   the wrist): minor roles that would only add noise to suggestions.
 */

const row = (nodeId: string, actionId: string, role: NodeAction["role"]): NodeAction => ({
  nodeId,
  actionId,
  role,
  claimId: `${nodeId.slice(nodeId.indexOf(".") + 1)}.function`,
});

export const forearmNodeActions: NodeAction[] = [
  row(m.brachioradialis, a.elbowFlexion, "prime"),

  row(m.flexorCarpiRadialis, a.wristFlexion, "prime"),
  row(m.flexorCarpiRadialis, a.radialDeviation, "prime"),

  row(m.flexorCarpiUlnaris, a.wristFlexion, "prime"),
  row(m.flexorCarpiUlnaris, a.ulnarDeviation, "prime"),

  row(m.palmarisLongus, a.palmarAponeurosisTension, "prime"),
  row(m.palmarisLongus, a.wristFlexion, "assist"),

  row(m.flexorDigitorumSuperficialis, a.fingersPipFlexion, "prime"),
  row(m.flexorDigitorumSuperficialis, a.fingersMcpFlexion, "assist"),
  row(m.flexorDigitorumSuperficialis, a.wristFlexion, "assist"),

  row(m.flexorDigitorumProfundus, a.fingersDipFlexion, "prime"),
  row(m.flexorDigitorumProfundus, a.fingersPipFlexion, "assist"),
  row(m.flexorDigitorumProfundus, a.fingersMcpFlexion, "assist"),
  row(m.flexorDigitorumProfundus, a.wristFlexion, "assist"),

  row(m.flexorPollicisLongus, a.thumbIpFlexion, "prime"),

  row(m.pronatorTeres, a.pronation, "prime"),
  row(m.pronatorTeres, a.elbowFlexion, "assist"),

  row(m.pronatorQuadratus, a.pronation, "prime"),
  row(m.pronatorQuadratus, a.distalRadioulnarStabilization, "assist"),

  row(m.extensorCarpiRadialisLongus, a.wristExtension, "prime"),
  row(m.extensorCarpiRadialisLongus, a.radialDeviation, "prime"),

  row(m.extensorCarpiRadialisBrevis, a.wristExtension, "prime"),
  row(m.extensorCarpiRadialisBrevis, a.radialDeviation, "prime"),

  row(m.extensorCarpiUlnaris, a.wristExtension, "prime"),
  row(m.extensorCarpiUlnaris, a.ulnarDeviation, "prime"),

  row(m.extensorDigitorum, a.fingersExtension, "prime"),
  row(m.extensorDigitorum, a.wristExtension, "assist"),

  row(m.extensorDigitiMinimi, a.littleFingerExtension, "prime"),

  row(m.extensorIndicis, a.indexFingerExtension, "prime"),

  row(m.abductorPollicisLongus, a.thumbCmcAbduction, "prime"),

  row(m.extensorPollicisBrevis, a.thumbMcpExtension, "prime"),

  row(m.extensorPollicisLongus, a.thumbIpExtension, "prime"),
  // Added in review: both references name MCP extension as an EPL action (A44, A45).
  row(m.extensorPollicisLongus, a.thumbMcpExtension, "assist"),

  row(m.supinator, a.supination, "prime"),

  row(adj.anconeus, a.elbowExtension, "assist"),

  row(ext.biceps, a.elbowFlexion, "prime"),
  row(ext.biceps, a.supination, "prime"),

  row(ext.brachialis, a.elbowFlexion, "prime"),
];
