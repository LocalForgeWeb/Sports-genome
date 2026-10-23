import type { NodeId, RegionHomeContent } from "../../types";
import { actionsFor } from "../../actions";
import { forearmActionIds as a, shoulderActionIds as sh } from "../../actions/ids";
import { bmcPulldownRowGrips, jelekinPullUpGrips, jscrPullUpChinUp, kenhubBicepsBrachii, mdpiBicepsCurlGrips, teachMeAnatomyBrachialis } from "../../sources/upper_arm-elbowFlexors";
import { upperArmMuscleIds } from "../upper_arm/ids";
import { upperArmRegion } from "../upper_arm/region";
import { upperArmElbowFlexorNodes } from "../upper_arm/elbowFlexorNodes";
import { upperArmNodeActions } from "../upper_arm/nodeActions";
import { forearmClaimsOnUpperArm } from "../upper_arm/forearmClaims";
import { leverSupination, zercherCarry, zercherSquat } from "../upper_arm/mappings/extensionsOther.elbowFlexors";
import { pullsCurlsMappings } from "../upper_arm/mappings/pullsCurls";
import { upperArmMappingVersion } from "../upper_arm/mappings/version";
import { homeVariants } from "./libraryVariants.generated";
import { forearmVariants } from "./variants";

/** The upper arm's muscles the forearm lists (members.ts): the biceps and the brachialis. */
export const forearmUpperArmMembers: ReadonlySet<NodeId> = new Set<NodeId>([upperArmMuscleIds.biceps, upperArmMuscleIds.brachialis]);

const listed = (record: { nodeId: NodeId }) => forearmUpperArmMembers.has(record.nodeId);
const rows = [...pullsCurlsMappings, ...zercherSquat, ...zercherCarry, leverSupination].filter(listed);
const mapped = new Set(rows.map((row) => row.variantId));

/**
 * The upper arm as the forearm's page reads it, as the home of the biceps and brachialis
 * (docs/specialization-atlas/10-multi-region.md §4.2, §6.1): the two nodes, the forearm's four
 * claims on them (forearmClaims.ts), their node actions, `upper_arm_mappings_v1`'s record and its
 * rows for them (the pulls and curls, and the extensions-and-other family's elbow-flexor rows,
 * extensionsOther.elbowFlexors.ts: no press or push maps either muscle), the
 * variants those rows map (the forearm's own records and the library's others,
 * libraryVariants.generated.ts) and the six upper-arm sources they cite. Not the triceps, the
 * coracobrachialis, the upper arm's own claims, its other sources and rows, or its drawing.
 *
 * The forearm composes with this in place of the upper arm's whole content (`upperArmHomeContent`,
 * upper_arm/content.ts), so its chunk carries what crediting and explaining its two upper-arm
 * members needs and not the whole region (§6.1's download gate). Composing with this or with the
 * whole content gives the same page data, record for record
 * (client/src/lib/specialization/regionContent.test.ts).
 */
export const upperArmAsForearmHome: RegionHomeContent = {
  region: upperArmRegion,
  nodes: upperArmElbowFlexorNodes.filter((node) => forearmUpperArmMembers.has(node.id)),
  members: [],
  actions: actionsFor([a.elbowFlexion, a.elbowExtension, a.supination, sh.flexion, sh.extension]),
  nodeActions: upperArmNodeActions.filter(listed),
  claims: forearmClaimsOnUpperArm,
  sources: [kenhubBicepsBrachii, teachMeAnatomyBrachialis, mdpiBicepsCurlGrips, bmcPulldownRowGrips, jelekinPullUpGrips, jscrPullUpChinUp],
  variants: [...forearmVariants, ...homeVariants].filter((variant) => mapped.has(variant.id)),
  mappings: rows,
  mappingVersion: upperArmMappingVersion,
  unmappedTagged: [],
};
