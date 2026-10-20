import type {
  AnatomyNode,
  Claim,
  DiagramAsset,
  DiagramSides,
  ExerciseVariant,
  ExternalMappingVersion,
  NodeAction,
  NodeRole,
  RegionContent,
  RegionId,
  RegionMember,
  SideRelation,
  Source,
  SpecializationRegionData,
  VariantMapping,
} from "./types";

/**
 * One region's page data, composed from its own content and the content of the regions its
 * external members belong to (docs/specialization-atlas/10-multi-region.md §1.3, §4.2). Pure:
 * it imports no content, so a region's loader passes in exactly what the page needs.
 *
 * - Nodes, in the region's member order, as region-relative copies: the role the region lists
 *   the node with, `regionId` still the node's home, membership caveats after the node's own.
 * - Node actions: all of the region's own nodes', and an external member's only for the
 *   region's own actions (the forearm page shows the biceps' elbow flexion and supination).
 * - Claims: those the region owns on its members, wherever their records are kept, then the
 *   function claims behind the node actions it shows.
 * - Sources: the region's own list, then any its claims cite from a home region's list.
 * - Mappings: the region's own version; the external members' home versions, where published,
 *   in `externalMappingVersions`, each with the home's actions its mappings name.
 */

/**
 * The role a region lists a node with: its home role in its home region, `external` anywhere else.
 * It takes the node's home record (in its region's content, `regionContentFor(node.regionId)`): a
 * page's copy of another region's node says `external`, which is no home role, so it is refused.
 */
export function memberRole(regionId: RegionId, node: Pick<AnatomyNode, "regionId" | "role">): NodeRole {
  if (node.role === "external") throw new Error(`memberRole takes a node's home record, not a page's copy (role external) of a node of ${node.regionId}`);
  return node.regionId === regionId ? node.role : "external";
}

/** A claim's key: `<owner region>:<claim id>` ("forearm:biceps.function"). */
export const claimKeyOf = (claim: Pick<Claim, "ownerRegionId" | "id">): string => `${claim.ownerRegionId}:${claim.id}`;

/** Where a mapping's muscle is loaded relative to the recorded side. A mapping that does not say is `same`. */
export const sideRelationOf = (mapping: Pick<VariantMapping, "sideRelation">): SideRelation => mapping.sideRelation ?? "same";

/** A mapping's key wherever mappings of two versions meet (the ledger, also-loads): `<version key>/<mapping id>`. */
export const versionedMappingKey = (mapping: Pick<VariantMapping, "versionKey" | "id">): string => `${mapping.versionKey}/${mapping.id}`;

/** How a drawing covers the sides: a drawing that does not say is `one_side`, mirrored for the left. */
export const diagramSidesOf = (asset: Pick<DiagramAsset, "sides">): DiagramSides => asset.sides ?? "one_side";

/** The page's copy of a node: its role in this region and this region's caveats. The stored role is the database's, not the page's. */
function memberNode(regionId: RegionId, node: AnatomyNode, member: RegionMember): AnatomyNode {
  const role = memberRole(regionId, node);
  const caveats = member.caveats?.length ? [...node.caveats, ...member.caveats] : node.caveats;
  if (role === node.role && caveats === node.caveats && node.storedRole === undefined) return node;
  const copy: AnatomyNode = { ...node, role, caveats };
  delete copy.storedRole;
  return copy;
}

function uniqueById<T extends { id: string }>(lists: readonly (readonly T[])[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of lists.flat()) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** One of a region's members with the node's home record, the content it is kept in, and the role this region lists it with. */
export interface ResolvedMember {
  member: RegionMember;
  /** The node as its home region holds it (home role, stored role). */
  node: AnatomyNode;
  home: RegionContent;
  role: NodeRole;
}

/**
 * A region's members in its order, each resolved against the region's own nodes and its homes'
 * (`homes`: the content of the regions its external members belong to). What the database's
 * region_nodes rows hold, and what a page groups its external rows by (`node.regionId`).
 */
export function resolveMembers(content: RegionContent, homes: readonly RegionContent[]): ResolvedMember[] {
  const regionId = content.region.id;
  // The region's own records last, so they are the ones found.
  const byId = new Map([...homes, content].flatMap((home) => home.nodes.map((node) => [node.id, { node, home }] as const)));
  return [...content.members]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((member) => {
      const found = byId.get(member.nodeId);
      if (!found) throw new Error(`Region ${regionId} lists ${member.nodeId}, which is neither its own node nor one of the home regions passed in`);
      return { member, node: found.node, home: found.home, role: memberRole(regionId, found.node) };
    });
}

/**
 * `homes` are the content of the regions the external members belong to. A region with no
 * mapping version (a reference region) has no page and cannot be composed.
 */
export function composeRegionData(content: RegionContent, homes: readonly RegionContent[]): SpecializationRegionData {
  const regionId = content.region.id;
  if (!content.mappingVersion) throw new Error(`Region ${regionId} has no mapping version, so it has no page data`);
  const members = resolveMembers(content, homes);
  const nodes = members.map(({ member, node }) => memberNode(regionId, node, member));
  const externals = members.filter((resolved) => resolved.home !== content);
  const externalIds = new Set(externals.map(({ node }) => node.id));
  const memberIds = new Set(nodes.map((node) => node.id));

  const actionIds = new Set(content.actions.map((action) => action.id));
  const nodeActions: NodeAction[] = [
    ...content.nodeActions,
    ...externals.flatMap(({ node, home }) => home.nodeActions.filter((row) => row.nodeId === node.id && actionIds.has(row.actionId))),
  ];

  const behindNodeActions = new Set(nodeActions.map((row) => row.claimKey));
  const claimKeys = new Set<string>();
  const claims = [content, ...homes].flatMap((source) => source.claims).filter((claim) => {
    const key = claimKeyOf(claim);
    const shown = (claim.ownerRegionId === regionId && memberIds.has(claim.nodeId)) || behindNodeActions.has(key);
    if (!shown || claimKeys.has(key)) return false;
    claimKeys.add(key);
    return true;
  });

  const externalHomes = Array.from(new Set(externals.map(({ home }) => home)));
  const externalMappingVersions: ExternalMappingVersion[] = externalHomes.flatMap((home) => {
    const version = home.mappingVersion;
    if (!version || version.state !== "published") return [];
    const mappings = home.mappings.filter((mapping) => mapping.versionKey === version.key && externalIds.has(mapping.nodeId));
    const named = new Set(mappings.map((mapping) => mapping.actionId));
    return [{ regionId: home.region.id, version, mappings, actions: home.actions.filter((action) => named.has(action.id)) }];
  });

  const cited = new Set([
    ...claims.flatMap((claim) => claim.sources.map((ref) => ref.sourceId)),
    ...content.mappings.flatMap((mapping) => mapping.sources.map((ref) => ref.sourceId)),
    ...externalMappingVersions.flatMap((external) => external.mappings.flatMap((mapping) => mapping.sources.map((ref) => ref.sourceId))),
  ]);
  const listed = new Set(content.sources.map((source) => source.id));
  const sources: Source[] = [...content.sources, ...uniqueById(homes.map((home) => home.sources.filter((source) => cited.has(source.id) && !listed.has(source.id))))];

  // The very array the logger reads when no home version adds a variant (shared/specialization/loggingRegions.ts).
  const externallyMapped = new Set(externalMappingVersions.flatMap((external) => external.mappings.map((mapping) => mapping.variantId)));
  const variants: ExerciseVariant[] = externallyMapped.size
    ? uniqueById([content.variants, ...externalHomes.map((home) => home.variants.filter((variant) => externallyMapped.has(variant.id)))])
    : content.variants;

  return {
    region: content.region,
    nodes,
    actions: content.actions,
    nodeActions,
    claims,
    sources,
    variants,
    mappings: content.mappings,
    mappingVersion: content.mappingVersion,
    externalMappingVersions,
    unmappedTagged: content.unmappedTagged,
    diagram: content.diagram,
  };
}
