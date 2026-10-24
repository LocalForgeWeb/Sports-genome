import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { actionById, actionLibrary, actionsFor } from "@shared/specialization/actions";
import { claimKeyOf, composeRegionData, diagramSidesOf, memberRole, resolveMembers, sideRelationOf, versionedMappingKey } from "@shared/specialization/compose";
import { defaultSpecializationRegionId, onSide, regionForBodyMapKey, regionIndexEntry, registeredRegionIndex, specializationRegionIndex } from "@shared/specialization/regionIndex";
import { regionContentFor, regionDataFor, registeredRegionContents, specializationRegions } from "@shared/specialization/registry";
import { forearmContent, forearmRegionData } from "@shared/specialization/regions/forearm";
import { upperArmAsForearmHome } from "@shared/specialization/regions/forearm/upperArmHome";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import { categoryFor } from "@shared/specialization/rules";
import { sourceLibrary } from "@shared/specialization/sources";
import { isCurrentVariant, variantById, variantFor, variantLibrary, variantsMappedBy } from "@shared/specialization/variants";
import { bothLimbCatalogIds as libraryBothLimbCatalogIds } from "@shared/specialization/variants/bothLimbs";
import { countingDimensions, descriptiveDimensions } from "@shared/specialization/variants/dimensions";
import { forearmV1Variants } from "@shared/specialization/variants/forearm";
import type { AnatomyNode, Claim, ExerciseVariant, Limb, MappingVersion, RegionContent, SpecializationRegionData, VariantMapping } from "@shared/specialization/types";
import { emitSeedSql } from "../../../../scripts/specialization/emit-seed";
import { deltoidIds, deltoidRegionData } from "./__fixtures__/deltoidRegion";
import { forearmContentV1, forearmRegionDataV1 } from "./__fixtures__/forearmV1";
import { forearmMappingsV1 } from "@shared/specialization/__fixtures__/forearmMappingsV1";
import { forearmResearchSources } from "@shared/specialization/sources/forearmResearch";
import { forearmResearchVariants } from "@shared/specialization/variants/forearmResearch";
import { regionVariantRecords } from "@shared/specialization/variants";
import { versionVariants } from "@shared/specialization/regions/forearm/libraryVariants.generated";

/**
 * The multi-region model (docs/specialization-atlas/10-multi-region.md §1–§4): every registered
 * region's content held to the same rules, the registry rules that keep regions from claiming one
 * another's muscles, keys or words, the shared libraries, and proof that moving the forearm's
 * records into those libraries changed nothing the page or the database reads. The content lives
 * in shared/, which vitest does not collect, so its tests live here; facts about one region stay
 * in that region's own tests (forearmAnatomy.test.ts, forearmMappings.test.ts).
 */

const root = process.cwd();
const fixture = (name: string) => JSON.parse(readFileSync(join(root, "client/src/lib/specialization/__fixtures__", name), "utf8"));

const contents = registeredRegionContents;
const pages = specializationRegions;
const contentOf = (regionId: string) => contents.find((content) => content.region.id === regionId);
const allNodes = contents.flatMap((content) => content.nodes);
const homeNodeById = new Map(allNodes.map((node) => [node.id, node]));
const allClaims = contents.flatMap((content) => content.claims);
const claimByKey = new Map(allClaims.map((claim) => [claimKeyOf(claim), claim]));
const catalogById = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const shortOf = (nodeId: string) => nodeId.slice(nodeId.indexOf(".") + 1);
const forPage = (data: SpecializationRegionData) => data.region.id;

// ---------------------------------------------------------------- seed v1, as applied

const seedV1 = readFileSync(join(root, "supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql"), "utf8");

/** One section of a generated seed, from its `-- <title>` line to the next section. */
function seedSection(sql: string, title: string): string {
  const start = sql.indexOf(`\n-- ${title}\n`);
  if (start === -1) throw new Error(`The seed has no section "${title}"`);
  const end = sql.indexOf("\n\n-- ", start + 1);
  return sql.slice(start, end === -1 ? undefined : end);
}

const claimKeysIn = (sql: string) => Array.from(seedSection(sql, "Claims (key: <region>:<claim id>)").matchAll(/^ {2}\(\$\$([^$]+)\$\$, \$\$/gm), (match) => match[1]);
/** Each node-action row as `<node> <action> <role> <claim key>`. */
const nodeActionsIn = (sql: string) =>
  Array.from(seedSection(sql, "Node actions (each rests on a function claim of its own node)").matchAll(/^ {2}\(\$\$([^$]+)\$\$, \$\$([^$]+)\$\$, \$\$([a-z]+)\$\$, \$\$([^$]+)\$\$\)/gm), (match) => match.slice(1, 5).join(" "));

/** The claim keys seed v1 wrote: the only claims that keep the shipped short id form (§1.3). */
const seedV1ClaimKeys = new Set(claimKeysIn(seedV1));

/** A row's values, split at the commas outside dollar quotes, brackets and parentheses. */
function sqlValues(row: string): string[] {
  const values: string[] = [];
  let depth = 0;
  let quoted = false;
  let from = 0;
  for (let i = 0; i < row.length; i += 1) {
    if (row.startsWith("$$", i)) {
      quoted = !quoted;
      i += 1;
    } else if (!quoted && (row[i] === "[" || row[i] === "(")) depth += 1;
    else if (!quoted && (row[i] === "]" || row[i] === ")")) depth -= 1;
    else if (!quoted && depth === 0 && row[i] === ",") {
      values.push(row.slice(from, i).trim());
      from = i + 1;
    }
  }
  values.push(row.slice(from).trim());
  return values;
}

/** The rows a seed's `insert into specialization.<table>` writes, by their first value, each as column → SQL literal. */
function insertedRows(sql: string, table: string): Map<string, Record<string, string>> {
  const head = `insert into specialization.${table} as t (`;
  const start = sql.indexOf(head);
  if (start === -1) throw new Error(`The seed writes no ${table}`);
  const valuesAt = sql.indexOf(") values\n", start);
  const columns = sql.slice(start + head.length, valuesAt).split(", ");
  const rows = new Map<string, Record<string, string>>();
  for (const line of sql.slice(valuesAt + ") values\n".length).split("\n")) {
    if (!line.startsWith("  (")) break;
    const values = sqlValues(line.trim().replace(/,$/, "").slice(1, -1));
    expect(values, line).toHaveLength(columns.length);
    rows.set(values[0], Object.fromEntries(columns.map((column, index) => [column, values[index]])));
  }
  return rows;
}

/** The fields the multi-region model added, taken off so the rest can be compared with the data as it was at 6738eeb. */
function asAt6738eeb(data: SpecializationRegionData) {
  const { sides: _sides, catalogKeys: _keys, regionOnlyTagScope: _scope, measurementDefaults: _defaults, wording, ...region } = data.region;
  const { externalHeading: _heading, sideWord: _word, sideWordPlural: _words, onSideTemplate: _template, ...v1Wording } = wording;
  const diagram = data.diagram && (({ sides: _drawn, ...asset }) => asset)(data.diagram);
  return {
    region: { ...region, wording: v1Wording },
    nodes: data.nodes,
    actions: data.actions,
    nodeActions: data.nodeActions.map(({ claimKey: _key, ...row }) => row),
    claims: data.claims.map(({ ownerRegionId: _owner, ...claim }) => claim),
    sources: data.sources,
    // The attributes §3 stores beside the frozen columns, which a later wave may add to these
    // variants. `replaces` stays: it is only ever on a new record, never on one of these.
    variants: data.variants.map(({ sidedBy: _sidedBy, legLaterality: _legs, sideAnchor: _anchor, dimensions: _dimensions, ...variant }) => variant),
    mappings: data.mappings,
    mappingVersion: data.mappingVersion,
    diagram,
  };
}

/**
 * The one field 6738eeb's data had that changed since: the Progress subtitle, which said "by arm"
 * until both sides counted as one (owner, 20 Oct 2026; the release review, 22 Oct). Checked to be
 * the old words before it is set to the new ones, so nothing else may differ.
 */
function withSubtitle(at6738eeb: ReturnType<typeof asAt6738eeb>, was: string, now: string): ReturnType<typeof asAt6738eeb> {
  expect(at6738eeb.region.wording.progressSubtitle).toBe(was);
  return { ...at6738eeb, region: { ...at6738eeb.region, wording: { ...at6738eeb.region.wording, progressSubtitle: now } } };
}

/**
 * The words of the biceps and brachialis that moved since 6738eeb (wave A; 10-multi-region.md
 * §1.3): their home, the upper arm, keeps neutral anatomy text on the nodes, and the sentences that
 * spoke from the forearm's page are the forearm's caveats on its membership of them, said after the
 * node's own. Each such caveat is checked to be the forearm's old words on the node before the
 * node's text is set to its home's, so nothing else of the two nodes, or of any other, may differ.
 */
function withMovedWords(at6738eeb: ReturnType<typeof asAt6738eeb>): ReturnType<typeof asAt6738eeb> {
  const moved = new Map(forearmContent.members.filter((member) => member.caveats?.length).map((member) => [member.nodeId, member.caveats!]));
  expect(Array.from(moved.keys())).toEqual(["upper_arm.biceps", "upper_arm.brachialis"]);
  return {
    ...at6738eeb,
    nodes: at6738eeb.nodes.map((node) => {
      const caveats = moved.get(node.id);
      if (!caveats) return node;
      const said = [node.shapeNote, ...node.caveats].join(" ");
      for (const caveat of caveats) expect(said, node.id).toContain(caveat);
      const home = upperArmContent.nodes.find((item) => item.id === node.id)!;
      return { ...node, location: home.location, whatItDoes: home.whatItDoes, shapeNote: home.shapeNote, caveats: [...home.caveats, ...caveats] };
    }),
  };
}

/**
 * What wave A adds to the forearm's page data (10-multi-region.md §4.2): the upper arm's published
 * version credits the biceps and brachialis, so the page also lists the variants those rows map
 * that the forearm's version does not, and the sources they cite that the forearm's list lacks, each
 * after the forearm's own, as composition appends a home's. Checked to be exactly those before they
 * are added, so nothing else may differ.
 */
function withUpperArmCredit(at6738eeb: ReturnType<typeof asAt6738eeb>): ReturnType<typeof asAt6738eeb> {
  const [external] = forearmRegionDataV1.externalMappingVersions;
  expect(external.regionId).toBe("upper_arm");
  const own = new Set(at6738eeb.variants.map((variant) => variant.id));
  const addedVariants = variantsMappedBy(external.mappings).filter((variant) => !own.has(variant.id));
  const listed = new Set(at6738eeb.sources.map((source) => source.id));
  const cited = new Set(external.mappings.flatMap((mapping) => mapping.sources.map((ref) => ref.sourceId)));
  const addedSources = sourceLibrary.filter((source) => cited.has(source.id) && !listed.has(source.id));
  expect(addedVariants.map((variant) => variant.catalogExerciseId)).toEqual([318, 326, 329, 330, 333, 87, 88, 335, 164]);
  expect(addedSources.map((source) => source.id).sort()).toEqual(["bmc.pulldown_row_grips", "jelekin.pull_up_grips", "jscr.pull_up_chin_up", "kenhub.biceps_brachii", "mdpi.biceps_curl_grips", "teachmeanatomy.brachialis"]);
  const strip = (variant: ExerciseVariant) => (({ sidedBy: _sidedBy, legLaterality: _legs, sideAnchor: _anchor, dimensions: _dimensions, ...rest }) => rest)(variant);
  return { ...at6738eeb, variants: [...at6738eeb.variants, ...addedVariants.map(strip)], sources: [...at6738eeb.sources, ...forearmRegionDataV1.sources.filter((source) => addedSources.includes(source))] };
}

describe("nothing moved: the forearm and the deltoid fixture as composed", () => {
  it("gives the forearm page the data it read at 6738eeb, record for record, apart from the fields the model added, the subtitle that said \"by arm\", the biceps' and brachialis' words (§1.3) and wave A's upper-arm credit (§4.2), under forearm_mappings_v1", () => {
    expect(asAt6738eeb(forearmRegionDataV1)).toEqual(withUpperArmCredit(withMovedWords(withSubtitle(fixture("forearmRegionData.6738eeb.json"), "Circumference and grip, by arm", "Circumference and grip"))));
  });

  it("changes it at F3 only by forearm_mappings_v2: the version, its rows, the variants they map and the sources they cite (11-forearm §1.7)", () => {
    const { mappingVersion, mappings, variants, sources, ...rest } = forearmRegionData;
    const { mappingVersion: v1Version, mappings: v1Mappings, variants: v1Variants, sources: v1Sources, ...v1Rest } = forearmRegionDataV1;
    expect(rest).toEqual(v1Rest);
    expect([v1Version.key, mappingVersion.key]).toEqual(["forearm_mappings_v1", "forearm_mappings_v2"]);
    expect(v1Mappings).toBe(forearmMappingsV1);
    expect(mappings).toBe(forearmContent.mappings);
    // The variants: v1's, with the four new rows after the forearm's 119, its own records first as before; the seven of the
    // upper arm's records its brachioradialis rows map are now its own, in the place they had as the upper arm's.
    expect(variants.map((variant) => variant.id)).toEqual([...v1Variants.slice(0, 119), ...forearmResearchVariants, ...v1Variants.slice(119)].map((variant) => variant.id));
    expect(variants.filter((variant) => !v1Variants.some((old) => old.id === variant.id))).toEqual(forearmResearchVariants);
    // The sources: the four v2's rows cite (sources/forearmResearch.ts), after v1's own list and before the upper arm's.
    const ownCount = forearmContentV1.sources.length;
    expect(sources).toEqual([...v1Sources.slice(0, ownCount), ...forearmResearchSources, ...v1Sources.slice(ownCount)]);
  });

  it("reads the same page data through what it reads of the upper arm (upperArmHome.ts) as through the upper arm's whole content", () => {
    expect(composeRegionData(forearmContent, [upperArmAsForearmHome])).toEqual(composeRegionData(forearmContent, [upperArmContent]));
    expect(forearmRegionData).toEqual(composeRegionData(forearmContent, [upperArmContent]));
  });

  it("fills the forearm's added fields with what it did before: arm sides, the forearms key from any tag; and from wave A the upper arm's version for the biceps and brachialis", () => {
    const { region } = forearmRegionData;
    expect(region.sides).toEqual({ model: "paired", limb: "arm" });
    // regionCatalogKeys used to derive this from the target nodes' keys.
    const derived = new Set(forearmRegionData.nodes.filter((node) => node.regionId === region.id && node.role === "target" && node.catalogMuscleKey).map((node) => node.catalogMuscleKey));
    expect(region.catalogKeys).toEqual(Array.from(derived));
    expect(region.catalogKeys).toEqual(["forearms"]);
    expect(region.regionOnlyTagScope).toBe("any");
    expect(region.wording.externalHeading).toBe("Forearm muscles credited here");
    expect(region.wording.externalGroup).toBe(upperArmContent.region.wording.externalHeading);
    // Wave A: the upper arm's published version credits the biceps and brachialis (§4.2), its rows for them alone.
    expect(forearmRegionData.externalMappingVersions.map((external) => [external.regionId, external.version.key, external.version.state, external.mappings.length, external.actions.map((action) => action.id)])).toEqual([
      ["upper_arm", "upper_arm_mappings_v1", "published", 157, ["elbow.flexion", "forearm.supination"]],
    ]);
    expect(forearmRegionData.externalMappingVersions[0].mappings).toEqual(upperArmContent.mappings.filter((mapping) => mapping.nodeId === "upper_arm.biceps" || mapping.nodeId === "upper_arm.brachialis"));
    expect(forearmRegionData.unmappedTagged.length).toBe(24);
    expect(diagramSidesOf(forearmRegionData.diagram!)).toBe("one_side");
    for (const mapping of forearmRegionData.mappings) expect(sideRelationOf(mapping), mapping.id).toBe("same");
  });

  it("hands the page the folder's own region, variants and mappings, record for record", () => {
    expect(forearmRegionData.region).toBe(forearmContent.region);
    // Its own variants first, the very records; then the two more the upper arm's rows for its members map (wave A: nine, of
    // which F3's brachioradialis rows made seven the forearm's own).
    forearmContent.variants.forEach((variant, index) => expect(forearmRegionData.variants[index]).toBe(variant));
    expect(forearmRegionData.variants).toHaveLength(forearmContent.variants.length + 2);
    expect(forearmRegionData.mappings).toBe(forearmContent.mappings);
  });

  it("changes the deltoid fixture only by its renames (§5.2), the shared library's action words and the subtitle that said \"by arm\"", () => {
    const at6738eeb = withSubtitle(fixture("deltoidRegionData.6738eeb.json") as ReturnType<typeof asAt6738eeb>, "Circumference, by arm", "Circumference");
    const renamed = JSON.parse(JSON.stringify(at6738eeb).replaceAll('"upper_arm.triceps"', '"fixture_arm.triceps"').replace(/"cat-(\d+)"/g, '"fx-$1"')) as typeof at6738eeb;
    const expected = {
      ...renamed,
      nodes: renamed.nodes.map((node) => (node.id === deltoidIds.triceps ? { ...node, regionId: "fixture_arm" } : node)),
      actions: actionsFor(renamed.actions.map((action) => action.id)),
    };
    expect(asAt6738eeb(deltoidRegionData)).toEqual(expected);
    // No id of the fixture's is a production id any more, but the joint actions.
    const production = new Set([...allNodes.map((node) => node.id), ...variantLibrary.map((variant) => variant.id)]);
    expect([...deltoidRegionData.nodes.map((node) => node.id), ...deltoidRegionData.variants.map((variant) => variant.id)].filter((id) => production.has(id))).toEqual([]);
  });
});

describe("the registry and the light index", () => {
  it("list the same regions in the same body order, the index holding each region's very record", () => {
    expect(registeredRegionIndex.map((region) => region.id)).toEqual(contents.map((content) => content.region.id));
    registeredRegionIndex.forEach((region, index) => expect(region).toBe(contents[index].region));
    const orders = registeredRegionIndex.map((region) => region.sortOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("give the production regions their page data, and only them", () => {
    expect(specializationRegionIndex.map((region) => region.id)).toEqual(pages.map(forPage));
    pages.forEach((data, index) => expect(data.region).toBe(specializationRegionIndex[index]));
    expect(pages.every((data) => data.region.status === "production")).toBe(true);
    expect(contents.filter((content) => content.region.status === "production").map((content) => content.region.id)).toEqual(pages.map(forPage));
    expect(contents.every((content) => content.region.status === "production" || content.region.status === "reference")).toBe(true);
    for (const data of pages) expect(regionDataFor(data.region.id)).toBe(data);
    for (const content of contents) {
      expect(regionContentFor(content.region.id)).toBe(content);
      expect(regionIndexEntry(content.region.id)).toBe(content.region);
    }
    // Wave A: the upper arm is a production region, the second.
    expect(pages.map(forPage)).toEqual(["upper_arm", "forearm"]);
    expect(regionDataFor(upperArmContent.region.id)?.region).toBe(upperArmContent.region);
    expect(regionDataFor("deltoid")).toBeNull();
    expect(regionDataFor(defaultSpecializationRegionId)?.region.status).toBe("production");
  });

  it("open a page from a body-map key only for a production region", () => {
    expect(regionForBodyMapKey("forearms")?.id).toBe("forearm");
    expect(regionForBodyMapKey("brachioradialis")?.id).toBe("forearm");
    // Wave A: the upper arm is in production, so its keys open it (§1.1's key table): the biceps and brachialis with
    // the muscle selected, the triceps (a group) with nothing selected.
    for (const key of ["biceps", "brachialis", "triceps"]) expect(regionForBodyMapKey(key)?.id, key).toBe("upper_arm");
    expect(upperArmContent.region.nodeForBodyMapKey).toEqual({ biceps: "upper_arm.biceps", brachialis: "upper_arm.brachialis" });
    expect(regionForBodyMapKey("lats")).toBeNull();
    expect(regionForBodyMapKey(null)).toBeNull();
  });

  it("keep the index light: it reaches the region records and ids, never the content", () => {
    const valueImports = (file: string) =>
      readFileSync(join(root, file), "utf8").split("\n").filter((line) => /^\s*(import|export)\b.*\bfrom\b/.test(line) && !/^\s*(import|export) type\b/.test(line));
    expect(valueImports("shared/specialization/regionIndex.ts").every((line) => /"\.\/regions\/[a-z_]+\/region"/.test(line))).toBe(true);
    for (const region of readdirSync(join(root, "shared/specialization/regions"))) {
      expect(valueImports(`shared/specialization/regions/${region}/region.ts`).every((line) => /"\.\/ids"/.test(line)), region).toBe(true);
      expect(valueImports(`shared/specialization/regions/${region}/ids.ts`).every((line) => /"(\.\.\/[a-z_]+\/ids|\.\.\/\.\.\/actions\/ids)"/.test(line)), region).toBe(true);
    }
  });
});

describe("each region's record", () => {
  for (const { region } of contents) {
    it(region.id, () => {
      expect(region.id).toMatch(/^[a-z][a-z_]*$/);
      for (const text of [region.label, region.heading, region.entryLabel, region.wording.externalGroup, region.wording.incidentalWork, region.wording.progressSubtitle]) expect(text.trim()).not.toBe("");
      expect(region.wording.externalHeading).toMatch(/^[A-Z][a-z-]+ muscles credited here$/);
      if (region.sides.model === "paired") {
        expect(["arm", "leg"]).toContain(region.sides.limb);
        expect(region.wording.sideWord?.trim()).toBeTruthy();
        expect(region.wording.sideWordPlural?.trim()).toBeTruthy();
        expect(region.wording.onSideTemplate.split("{side}")).toHaveLength(2);
        expect(onSide(region, "right")).toMatch(/\bright\b/);
        expect(() => onSide(region, "midline")).toThrow();
      } else {
        expect(region.wording.sideWord).toBeUndefined();
        expect(region.wording.onSideTemplate).not.toContain("{side}");
        expect(onSide(region, "midline")).toBe(region.wording.onSideTemplate);
      }
      expect(region.catalogKeys.length).toBeGreaterThan(0);
      expect(new Set(region.catalogKeys).size).toBe(region.catalogKeys.length);
      expect(["any", "primary"]).toContain(region.regionOnlyTagScope);
      for (const metric of region.measurementMetrics) expect(region.measurementDefaults[metric]?.landmark.trim(), metric).toBeTruthy();
      for (const [key, nodeId] of Object.entries(region.nodeForBodyMapKey ?? {})) {
        expect(region.bodyMapKeys, key).toContain(key);
        const node = homeNodeById.get(nodeId);
        expect(node?.regionId, `${key} → ${nodeId}`).toBe(region.id);
        expect(node?.role, `${key} → ${nodeId}`).toBe("target");
      }
    });
  }

  it("say a side in a sentence from the region's own words", () => {
    expect(onSide(forearmRegionData.region, "right")).toBe("your right forearm");
    expect(onSide(forearmRegionData.region, "left")).toBe("your left forearm");
    expect(onSide({ id: "core", wording: { ...forearmRegionData.region.wording, onSideTemplate: "your core" } }, "midline")).toBe("your core");
  });
});

describe("registry rules (§1.2, §1.3)", () => {
  it("give every node one home: listed there with its home role, and external wherever else it is listed", () => {
    expect(new Set(allNodes.map((node) => node.id)).size).toBe(allNodes.length);
    for (const content of contents) {
      for (const node of content.nodes) {
        expect(node.regionId, node.id).toBe(content.region.id);
        expect(node.role, node.id).not.toBe("external");
      }
      const listed = content.members.map((member) => member.nodeId);
      expect(new Set(listed).size, content.region.id).toBe(listed.length);
      expect(new Set(content.members.map((member) => member.sortOrder)).size, content.region.id).toBe(listed.length);
      for (const node of content.nodes) expect(listed, `${content.region.id} lists its own ${node.id}`).toContain(node.id);
      for (const nodeId of listed) expect(homeNodeById.has(nodeId), `${content.region.id} lists ${nodeId}`).toBe(true);
    }
    // A node is a non-external member of its home region only.
    for (const content of contents) {
      for (const member of content.members) {
        const node = homeNodeById.get(member.nodeId)!;
        if (memberRole(content.region.id, node) !== "external") expect(node.regionId, member.nodeId).toBe(content.region.id);
      }
    }
  });

  it("give every node a flat id under its home region, `<region>.<slug>`", () => {
    // Claim ids and the seed's short claim ids cut a node id at its first dot (§1.2).
    for (const node of [...allNodes, ...deltoidRegionData.nodes]) expect(node.id).toMatch(new RegExp(`^${node.regionId}\\.[a-z0-9_]+$`));
  });

  it("keep the stored role apart from the home role on exactly the two frozen upper-arm muscles", () => {
    expect(allNodes.filter((node) => node.storedRole !== undefined).map((node) => [node.id, node.storedRole, node.role])).toEqual([
      ["upper_arm.biceps", "external", "target"],
      ["upper_arm.brachialis", "external", "target"],
    ]);
    // A page's copies carry the role in that page, never the stored one.
    for (const data of [...pages, deltoidRegionData]) for (const node of data.nodes) expect(node.storedRole, node.id).toBeUndefined();
    expect(forearmRegionData.nodes.filter((node) => node.role === "external").map((node) => [node.id, node.regionId])).toEqual([
      ["upper_arm.biceps", "upper_arm"],
      ["upper_arm.brachialis", "upper_arm"],
    ]);
  });

  it("give each catalog key and each body-map key to one region at most", () => {
    const catalogKeys = contents.flatMap((content) => content.region.catalogKeys);
    expect(new Set(catalogKeys).size).toBe(catalogKeys.length);
    const bodyMapKeys = contents.flatMap((content) => content.region.bodyMapKeys);
    expect(new Set(bodyMapKeys).size).toBe(bodyMapKeys.length);
  });

  it("list another region's muscle only from a registered production or reference home paired by the same limb, unless the listing region is midline", () => {
    for (const content of contents) {
      for (const member of content.members) {
        const node = homeNodeById.get(member.nodeId)!;
        if (node.regionId === content.region.id) continue;
        const home = contentOf(node.regionId);
        expect(home, `${content.region.id} lists ${node.id} from ${node.regionId}`).toBeDefined();
        expect(["production", "reference"], node.regionId).toContain(home!.region.status);
        if (content.region.sides.model === "midline") continue;
        expect(home!.region.sides, `${content.region.id} lists ${node.id}`).toEqual(content.region.sides);
      }
    }
  });

  it("key claims by their owner, once each, and refuse an owner that is not registered", () => {
    const keys = allClaims.map(claimKeyOf);
    expect(new Set(keys).size).toBe(keys.length);
    for (const claim of allClaims) {
      expect(contentOf(claim.ownerRegionId), claim.id).toBeDefined();
      expect(claimKeyOf(claim)).toBe(`${claim.ownerRegionId}:${claim.id}`);
      expect(homeNodeById.has(claim.nodeId), claim.id).toBe(true);
    }
    // The forearm's four claims on the upper-arm muscles stay the forearm's, beside their nodes.
    expect(upperArmContent.claims.filter((claim) => claim.ownerRegionId === "forearm").map(claimKeyOf)).toEqual(["forearm:biceps.function", "forearm:biceps.appearance", "forearm:brachialis.function", "forearm:brachialis.appearance"]);
  });

  it("declare each node action once, in the node's home region, on a function claim of the same node", () => {
    const rows = contents.flatMap((content) => content.nodeActions.map((row) => ({ row, content })));
    const keys = rows.map(({ row }) => `${row.nodeId} ${row.actionId}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const { row, content } of rows) {
      const where = `${row.nodeId} ${row.actionId}`;
      expect(homeNodeById.get(row.nodeId)?.regionId, where).toBe(content.region.id);
      expect(content.actions.map((action) => action.id), where).toContain(row.actionId);
      const claim = claimByKey.get(row.claimKey);
      expect(claim, `${where} → ${row.claimKey}`).toBeDefined();
      expect(claim!.nodeId, where).toBe(row.nodeId);
      expect(claim!.kind, where).toBe("function");
      expect(claim!.id, where).toBe(row.claimId);
    }
  });

  it("keep short names unique, ignoring case, among each region's drawable members, external ones included", () => {
    const parents = new Set(allNodes.map((node) => node.parentId).filter((id): id is string => id !== null));
    for (const content of contents) {
      const drawable = content.members.map((member) => homeNodeById.get(member.nodeId)!).filter((node) => (node.kind === "muscle" || node.kind === "head") && !parents.has(node.id));
      for (const node of drawable) expect(node.shortName, node.id).toMatch(/^[A-Za-z][A-Za-z0-9-]*$/);
      const names = drawable.map((node) => node.shortName.toLowerCase());
      expect(new Set(names).size, content.region.id).toBe(names.length);
    }
  });
});

describe("what seed v1 wrote, byte for byte (§1.3, §5.2)", () => {
  let seed: string | undefined;
  /** The seed the emitter writes now, once per run. */
  const emitted = () => (seed ??= emitSeedSql());

  it("holds the forearm's 60 claims and 38 node actions, every claim the forearm's", () => {
    expect(claimKeysIn(seedV1)).toHaveLength(60);
    expect(new Set(claimKeysIn(seedV1)).size).toBe(60);
    expect(claimKeysIn(seedV1).every((key) => key.startsWith("forearm:"))).toBe(true);
    expect(nodeActionsIn(seedV1)).toHaveLength(38);
  });

  // Inclusion, not equality: a later region adds claims and node actions; none of seed v1's may change.
  it("keeps every claim key and node-action row of seed v1 in the content", () => {
    expect(allClaims.map(claimKeyOf)).toEqual(expect.arrayContaining(claimKeysIn(seedV1)));
    expect(contents.flatMap((content) => content.nodeActions.map((row) => `${row.nodeId} ${row.actionId} ${row.role} ${row.claimKey}`))).toEqual(expect.arrayContaining(nodeActionsIn(seedV1)));
  });

  it("keeps every claim key and node-action row of seed v1 in what the seed emitter writes", () => {
    expect(claimKeysIn(emitted())).toEqual(expect.arrayContaining(claimKeysIn(seedV1)));
    expect(nodeActionsIn(emitted())).toEqual(expect.arrayContaining(nodeActionsIn(seedV1)));
  });

  it("keeps every region row seed v1 wrote, its v1 columns unchanged until the region's status changes (the upper arm's promotion), but for the forearm's subtitle", () => {
    const v1Rows = insertedRows(seedV1, "regions");
    const rows = insertedRows(emitted(), "regions");
    expect(Array.from(v1Rows.keys())).toEqual(["$$forearm$$", "$$upper_arm$$"]);
    // The one v1 value the current seed rewrites (10-multi-region.md, appendix "Both sides as one"): the forearm's Progress subtitle,
    // which said "by arm". The upper arm's is a reference region's, null as seed v1 wrote it, and stays so until its promotion.
    const rewritten: Record<string, Record<string, [string, string]>> = { $$forearm$$: { progress_subtitle: ["$$Circumference and grip, by arm$$", "$$Circumference and grip$$"] } };
    for (const [key, v1Row] of v1Rows) {
      const region = regionContentFor(key.replaceAll("$$", ""))?.region;
      expect(region, key).toBeDefined();
      const row = rows.get(key);
      expect(row, key).toBeDefined();
      if (`$$${region!.status}$$` !== v1Row.status) continue;
      // The upper arm's row is seed v1's reference row (a label, no heading, sort 0, no keys or
      // words) until its promotion, though its record already holds §1.1's (upper_arm/region.ts).
      for (const [column, value] of Object.entries(v1Row)) {
        const change = rewritten[key]?.[column];
        if (change) expect([value, row![column]], `${key} ${column}`).toEqual(change);
        else expect(row![column], `${key} ${column}`).toBe(value);
      }
    }
    expect(v1Rows.get("$$upper_arm$$")!.progress_subtitle).toBe("null");
  });
});

/**
 * How a page credits its external members (§4.2), as problems: only through each home's published
 * version, each mapping on an external member of that home, for an action the version names
 * (`actions`) and the library's current variant of its exercise, which the page lists.
 */
function externalCreditProblems(data: SpecializationRegionData): string[] {
  const problems: string[] = [];
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
  const listed = new Set(data.variants.map((variant) => variant.id));
  for (const external of data.externalMappingVersions) {
    const where = `${data.region.id} ← ${external.version.key}`;
    if (external.version.state !== "published") problems.push(`${where}: not published`);
    for (const action of external.actions) if (actionById.get(action.id) !== action) problems.push(`${where}: ${action.id} is not the library's record`);
    const named = new Set(external.actions.map((action) => action.id));
    for (const mapping of external.mappings) {
      const at = `${where} ${mapping.id}`;
      if (mapping.versionKey !== external.version.key) problems.push(`${at}: under ${mapping.versionKey}`);
      if (mapping.id !== `${mapping.variantId}:${mapping.nodeId}`) problems.push(`${at}: not keyed by its variant and node`);
      const node = nodeById.get(mapping.nodeId);
      if (node?.role !== "external" || node.regionId !== external.regionId) problems.push(`${at}: not an external member whose home is ${external.regionId}`);
      if (mapping.actionId === null || !named.has(mapping.actionId)) problems.push(`${at}: ${mapping.actionId} is not among the version's actions`);
      const variant = variantById.get(mapping.variantId);
      if (!variant || variantFor(variant.catalogExerciseId) !== variant) problems.push(`${at}: not the current library variant`);
      if (!listed.has(mapping.variantId)) problems.push(`${at}: the page does not list its variant`);
    }
  }
  return problems;
}

describe("composition (§1.3, §4.2)", () => {
  const draft: MappingVersion = { key: "upper_arm_test_v1", state: "draft", publishedAt: null, methodNotes: "Test version." };
  // A biceps row to stand for a home's (forearm_mappings_v1's: since F3 the forearm's own version maps no upper-arm muscle).
  const curl = forearmMappingsV1.find((mapping) => mapping.id === "cat-121:upper_arm.biceps")!;
  const homeMapping: VariantMapping = { ...curl, versionKey: draft.key, rationale: "The upper arm's own reading, for this test." };
  /** The upper arm with its own version published, crediting the biceps with these mappings. */
  const publishedWith = (...mappings: VariantMapping[]): RegionContent => ({ ...upperArmContent, mappingVersion: { ...draft, state: "published", publishedAt: "2026-10-20" }, mappings, variants: variantsMappedBy(mappings) });

  it("resolves each member to its home record and the role the region lists it with", () => {
    const members = resolveMembers(forearmContent, [upperArmContent]);
    expect(members.map(({ node }) => node.id)).toEqual(forearmRegionData.nodes.map((node) => node.id));
    expect(members.filter(({ role }) => role === "external").map(({ node, home }) => [node.id, home.region.id, node.role, node.storedRole])).toEqual([
      ["upper_arm.biceps", "upper_arm", "target", "external"],
      ["upper_arm.brachialis", "upper_arm", "target", "external"],
    ]);
    expect(members.filter(({ home }) => home === forearmContent).every(({ node, role }) => role === node.role)).toBe(true);
  });

  it("shows another region's muscle with its home's node actions for the page's own actions only", () => {
    const upperArm: RegionContent = {
      ...upperArmContent,
      nodeActions: [...upperArmContent.nodeActions, { nodeId: "upper_arm.biceps", actionId: "shoulder.flexion", role: "assist", claimId: "biceps.function", claimKey: "forearm:biceps.function" }],
    };
    const page = composeRegionData(forearmContent, [upperArm]);
    expect(page.nodeActions.filter((row) => row.nodeId === "upper_arm.biceps").map((row) => row.actionId)).toEqual(["elbow.flexion", "forearm.supination"]);
  });

  it("shows the claims a page owns on its members and the function claims behind its node actions, nothing else", () => {
    // The upper arm as a page: the forearm's function claims rest under its node actions; the forearm's appearance claims are not its own.
    // Held as rules, so the upper arm's own claims, members and sources can join without changing the test.
    const page = composeRegionData({ ...upperArmContent, mappingVersion: draft }, [forearmContent]);
    const shown = page.claims.map(claimKeyOf);
    expect(shown).toEqual(expect.arrayContaining(["forearm:biceps.function", "forearm:brachialis.function"]));
    expect(shown).not.toContain("forearm:biceps.appearance");
    expect(shown).not.toContain("forearm:brachialis.appearance");
    const memberIds = new Set(page.nodes.map((node) => node.id));
    const behind = new Set(page.nodeActions.map((row) => row.claimKey));
    for (const claim of page.claims) expect((claim.ownerRegionId === "upper_arm" && memberIds.has(claim.nodeId)) || behind.has(claimKeyOf(claim)), claimKeyOf(claim)).toBe(true);
    expect(page.nodes.filter((node) => node.id === "upper_arm.biceps" || node.id === "upper_arm.brachialis").map((node) => [node.id, node.role])).toEqual([["upper_arm.biceps", "target"], ["upper_arm.brachialis", "target"]]);
    expect(page.sources.map((source) => source.id)).toEqual(expect.arrayContaining(["A50", "A51"]));
  });

  it("adds a membership's caveats after the node's own, on that page's copy only", () => {
    const listed: RegionContent = { ...forearmContent, members: forearmContent.members.map((member) => (member.nodeId === "upper_arm.biceps" ? { ...member, caveats: ["Not a forearm target."] } : member)) };
    const biceps = composeRegionData(listed, [upperArmContent]).nodes.find((node) => node.id === "upper_arm.biceps")!;
    const home = upperArmContent.nodes.find((node) => node.id === "upper_arm.biceps")!;
    expect(biceps.caveats).toEqual([...home.caveats, "Not a forearm target."]);
    expect(home.caveats).not.toContain("Not a forearm target.");
  });

  it("credits an external member through its home's published version, keeping each mapping's version key", () => {
    const published = publishedWith(homeMapping);
    const page = composeRegionData(forearmContent, [published]);
    expect(page.externalMappingVersions).toEqual([{ regionId: "upper_arm", version: published.mappingVersion, mappings: [homeMapping], actions: [actionById.get("elbow.flexion")] }]);
    expect(page.mappings).toBe(forearmContent.mappings);
    expect(versionedMappingKey(homeMapping)).not.toBe(versionedMappingKey(curl));
    expect(externalCreditProblems(page)).toEqual([]);
    // A home whose version is still a draft credits nothing here: the page reads its own rows.
    expect(composeRegionData(forearmContent, [{ ...published, mappingVersion: draft }]).externalMappingVersions).toEqual([]);
  });

  it("names the home's actions an external member is credited for, apart from the page's own", () => {
    // The upper arm may credit the biceps for shoulder flexion, which is no forearm action.
    const raise: VariantMapping = { ...homeMapping, actionId: "shoulder.flexion" };
    const page = composeRegionData(forearmContent, [publishedWith(raise)]);
    const [external] = page.externalMappingVersions;
    expect(external.mappings).toEqual([raise]);
    expect(external.actions).toEqual([actionById.get("shoulder.flexion")]);
    expect(external.actions[0]).toBe(upperArmContent.actions.find((action) => action.id === "shoulder.flexion"));
    // Movement targets read the page's own actions, which stay the forearm's 20.
    expect(page.actions).toBe(forearmContent.actions);
    expect(page.actions.map((action) => action.id)).not.toContain("shoulder.flexion");
    expect(externalCreditProblems(page)).toEqual([]);
  });

  it("finds external credit a page could not name or place", () => {
    const page = composeRegionData(forearmContent, [publishedWith(homeMapping)]);
    const [external] = page.externalMappingVersions;
    const onOwnMuscle: VariantMapping = { ...homeMapping, id: "cat-121:forearm.br", nodeId: "forearm.br" };
    const unnamed: VariantMapping = { ...homeMapping, actionId: "shoulder.extension" };
    const broken: SpecializationRegionData = { ...page, externalMappingVersions: [{ ...external, mappings: [onOwnMuscle, unnamed] }] };
    expect(externalCreditProblems(broken)).toEqual([
      "forearm ← upper_arm_test_v1 cat-121:forearm.br: not an external member whose home is upper_arm",
      "forearm ← upper_arm_test_v1 cat-121:upper_arm.biceps: shoulder.extension is not among the version's actions",
    ]);
    expect(externalCreditProblems({ ...page, variants: forearmContent.variants.filter((variant) => variant.id !== "cat-121") })).toEqual([
      "forearm ← upper_arm_test_v1 cat-121:upper_arm.biceps: the page does not list its variant",
    ]);
  });

  it("refuses a member it cannot find and a region with no version", () => {
    expect(() => composeRegionData(forearmContent, [])).toThrow(/upper_arm\.biceps/);
    expect(() => composeRegionData({ ...upperArmContent, mappingVersion: null }, [forearmContent])).toThrow(/no mapping version/);
  });
});

// ---------------------------------------------------------------- content, every region

/** Every string an athlete may read from a region's records, labelled for a useful failure. */
function copyStrings(content: RegionContent): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const node of content.nodes) {
    for (const [field, text] of [["name", node.name], ["location", node.location], ["whatItDoes", node.whatItDoes], ["shapeNote", node.shapeNote]] as const) out.push({ where: `${node.id}.${field}`, text });
    node.caveats.forEach((caveat, i) => out.push({ where: `${node.id}.caveats[${i}]`, text: caveat }));
  }
  for (const member of content.members) (member.caveats ?? []).forEach((caveat, i) => out.push({ where: `${content.region.id} member ${member.nodeId}.caveats[${i}]`, text: caveat }));
  for (const claim of content.claims) {
    out.push({ where: `${claimKeyOf(claim)}.statement`, text: claim.statement });
    for (const ref of claim.sources) {
      if (ref.locator) out.push({ where: `${claimKeyOf(claim)} → ${ref.sourceId} locator`, text: ref.locator });
      if (ref.qualification) out.push({ where: `${claimKeyOf(claim)} → ${ref.sourceId} qualification`, text: ref.qualification });
    }
  }
  return out;
}

const actionCopy = actionLibrary.flatMap((action) => [{ where: `${action.id}.label`, text: action.label }, { where: `${action.id}.plainDescription`, text: action.plainDescription }]);

/** What no copy says (§8): a growth promise (a percentage, "optimal", "guarantee", "will grow"), the backend vendor, or "table". */
const forbiddenInCopy = [/%|\bper ?cent\b/i, /optimal|guarantee/i, /\bwill (grow|get bigger|increase)\b/i, /supabase|\btables?\b/i];

describe("anatomy content, in every region", () => {
  for (const content of contents) {
    describe(content.region.id, () => {
      const claimsOf = (nodeId: string, kind?: Claim["kind"]) => allClaims.filter((claim) => claim.nodeId === nodeId && (!kind || claim.kind === kind));

      it("fills location, what it does and the shape note on every node", () => {
        for (const node of content.nodes) {
          expect(node.location.trim(), `${node.id}.location`).not.toBe("");
          expect(node.whatItDoes.trim(), `${node.id}.whatItDoes`).not.toBe("");
          expect(node.shapeNote.trim(), `${node.id}.shapeNote`).not.toBe("");
        }
      });

      it("marks a node reviewed only when all its function claims are reviewed", () => {
        for (const node of content.nodes.filter((item) => item.status === "reviewed")) {
          const functions = claimsOf(node.id, "function");
          expect(functions.length, node.id).toBeGreaterThan(0);
          for (const claim of functions) expect(claim.reviewStatus, `${node.id} ← ${claimKeyOf(claim)}`).toBe("reviewed");
        }
      });

      // A parent (the deltoid over its three heads, the triceps over its heads) acts through its parts and
      // is neither drawn nor selected (10-multi-region.md §7.3), so it needs no action of its own.
      it("gives every muscle a main action, and an adjacent muscle at least one action, parents aside", () => {
        const parents = new Set(content.nodes.map((item) => item.parentId).filter(Boolean));
        for (const node of content.nodes.filter((item) => item.kind === "muscle" && !parents.has(item.id))) {
          expect(content.nodeActions.some((row) => row.nodeId === node.id && (row.role === "prime" || node.role === "adjacent")), node.id).toBe(true);
        }
      });

      it("gives every claim an id of its node's full id and its kind, the forearm's shipped claims keeping their short form", () => {
        for (const claim of content.claims) {
          const key = claimKeyOf(claim);
          const node = (seedV1ClaimKeys.has(key) ? shortOf(claim.nodeId) : claim.nodeId).replace(/[.]/g, "\\.");
          expect(claim.id, key).toMatch(new RegExp(`^${node}\\.${claim.kind}(\\.\\d+)?$`));
        }
      });

      it("gives every reviewed claim a date, a note and a located source, and keeps appearance as inference", () => {
        for (const claim of content.claims) {
          const where = claimKeyOf(claim);
          expect(claim.sources.length, where).toBeGreaterThan(0);
          if (claim.reviewStatus === "reviewed") {
            expect(claim.reviewedAt, where).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(claim.reviewNote, where).toMatch(/not a clinician or anatomist/);
            expect(claim.sources.some((ref) => !!ref.locator?.trim()), `${where} needs a located source`).toBe(true);
          } else {
            expect(claim.reviewedAt, where).toBeNull();
          }
          if (claim.kind === "appearance") {
            expect(claim.basis, where).toBe("anatomical_inference");
            if (claim.reviewStatus === "reviewed") expect(claim.reviewNote, where).toMatch(/anatomical inference/i);
          }
        }
      });

      it("cites only library sources, each of them listed with the region", () => {
        const listed = new Set(content.sources.map((source) => source.id));
        for (const source of content.sources) expect(sourceLibrary, source.id).toContain(source);
        for (const claim of content.claims) for (const ref of claim.sources) expect(listed.has(ref.sourceId), `${claimKeyOf(claim)} → ${ref.sourceId}`).toBe(true);
        for (const mapping of content.mappings) for (const ref of mapping.sources) expect(listed.has(ref.sourceId), `${mapping.id} → ${ref.sourceId}`).toBe(true);
      });

      it("lists the library's own action and variant records", () => {
        for (const action of content.actions) expect(actionLibrary, action.id).toContain(action);
        expect(new Set(content.actions.map((action) => action.id)).size).toBe(content.actions.length);
        const mapped = variantsMappedBy(content.mappings);
        expect(content.variants).toHaveLength(mapped.length);
        // The very records, but for those another region's lane wrote that a page reading its own lane's records copies from its
        // generated list (the forearm's `versionVariants`, held to the library by loggingTable.test.ts): equal, not the same object.
        const own = regionVariantRecords[content.region.id];
        content.variants.forEach((variant, index) => {
          if (own && !own.includes(mapped[index])) expect(variant, variant.id).toEqual(mapped[index]);
          else expect(variant, variant.id).toBe(mapped[index]);
        });
        if (content.region.id === "forearm") expect(content.variants.filter((variant) => !own!.includes(variant))).toEqual(versionVariants);
      });

      it("makes no growth promise and never names the backend vendor or says 'table'", () => {
        for (const { where, text } of copyStrings(content)) for (const pattern of forbiddenInCopy) expect(text, where).not.toMatch(pattern);
        const cited = new Set(content.claims.flatMap((claim) => claim.sources.map((ref) => ref.sourceId)));
        for (const source of content.sources.filter((item) => cited.has(item.id))) expect(source.title, source.id).not.toMatch(/supabase|\btables?\b/i);
      });
    });
  }
});

describe("each page's data", () => {
  for (const data of pages) {
    describe(data.region.id, () => {
      const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
      const claimKeys = new Map(data.claims.map((claim) => [claimKeyOf(claim), claim]));
      const sourceById = new Map(data.sources.map((source) => [source.id, source]));

      it("rests every node action it shows on a function claim it shows, for a member and an action of its own", () => {
        const keys = data.nodeActions.map((row) => `${row.nodeId}|${row.actionId}`);
        expect(new Set(keys).size).toBe(keys.length);
        const actionIds = new Set(data.actions.map((action) => action.id));
        for (const row of data.nodeActions) {
          const claim = claimKeys.get(row.claimKey);
          expect(claim, `${row.nodeId} ${row.actionId} → ${row.claimKey}`).toBeDefined();
          expect(claim!.nodeId, row.claimKey).toBe(row.nodeId);
          expect(claim!.kind, row.claimKey).toBe("function");
          expect(nodeById.has(row.nodeId), row.nodeId).toBe(true);
          expect(actionIds.has(row.actionId), row.actionId).toBe(true);
        }
      });

      it("keeps names, short names and aliases unique across the nodes it lists", () => {
        const owner = new Map<string, string>();
        for (const node of data.nodes) {
          for (const label of new Set([node.name, node.shortName, ...node.aliases].map((item) => item.trim().toLowerCase()))) {
            expect(label, node.id).not.toBe("");
            const previous = owner.get(label);
            expect(previous === undefined || previous === node.id, `"${label}" is used by ${previous} and ${node.id}`).toBe(true);
            owner.set(label, node.id);
          }
        }
      });

      it("lists each source once and holds every source it cites", () => {
        expect(sourceById.size).toBe(data.sources.length);
        for (const claim of data.claims) for (const ref of claim.sources) expect(sourceById.has(ref.sourceId), `${claimKeyOf(claim)} → ${ref.sourceId}`).toBe(true);
        for (const mapping of [...data.mappings, ...data.externalMappingVersions.flatMap((external) => external.mappings)]) {
          for (const ref of mapping.sources) expect(sourceById.has(ref.sourceId), `${mapping.id} → ${ref.sourceId}`).toBe(true);
        }
      });

      it("maps current library variants, members that are muscles and actions of the region, under its own version", () => {
        const actionIds = new Set(data.actions.map((action) => action.id));
        const ids = data.mappings.map((mapping) => mapping.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const mapping of data.mappings) {
          expect(mapping.versionKey, mapping.id).toBe(data.mappingVersion.key);
          expect(mapping.id).toBe(`${mapping.variantId}:${mapping.nodeId}`);
          const variant = variantById.get(mapping.variantId);
          expect(variant, mapping.id).toBeDefined();
          expect(variantFor(variant!.catalogExerciseId), mapping.id).toBe(variant);
          const node = nodeById.get(mapping.nodeId);
          expect(node, `${mapping.id}: a member`).toBeDefined();
          expect(node!.kind === "group" || node!.kind === "compartment" || node!.role === "group" || node!.role === "adjacent", mapping.id).toBe(false);
          expect(mapping.actionId !== null && actionIds.has(mapping.actionId), `${mapping.id}: action`).toBe(true);
        }
      });

      it("credits its external members only through their homes' published versions, for actions and current variants it can name", () => {
        expect(externalCreditProblems(data)).toEqual([]);
      });

      it("cites a source for every mapping, a located one where reviewed, and EMG only with an EMG source in hand", () => {
        for (const mapping of data.mappings) {
          expect(mapping.sources.length, mapping.id).toBeGreaterThan(0);
          if (mapping.reviewStatus === "reviewed") expect(mapping.sources.some((ref) => Boolean(ref.locator)), mapping.id).toBe(true);
          expect(mapping.rationale.length, mapping.id).toBeGreaterThan(40);
          if (mapping.evidenceBasis === "emg") expect(mapping.sources.some((ref) => sourceById.get(ref.sourceId)?.evidenceType === "emg"), mapping.id).toBe(true);
        }
      });

      it("gives every reviewed mapping a countable category and never lets steadying earn dynamic credit", () => {
        for (const mapping of data.mappings) {
          const variant = variantById.get(mapping.variantId)!;
          const category = categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
          if (mapping.reviewStatus === "reviewed") expect(category, mapping.id).not.toBe("unknown");
          if (mapping.relationship === "stabilizer" || mapping.relationship === "incidental") expect(mapping.muscleMode, mapping.id).toBe("isometric");
        }
      });

      it("maps a muscle only for an action its node actions name, where it has them", () => {
        const actionsOf = new Map<string, Set<string>>();
        for (const row of data.nodeActions) actionsOf.set(row.nodeId, (actionsOf.get(row.nodeId) ?? new Set()).add(row.actionId));
        for (const mapping of data.mappings) {
          const known = actionsOf.get(mapping.nodeId);
          if (known?.size) expect(known.has(mapping.actionId!), `${mapping.id}: ${mapping.actionId} is not among ${Array.from(known).join(", ")}`).toBe(true);
        }
      });

      it("reads a side from a limb the variant uses, or credits both sides (§2.1 rule 5)", () => {
        if (data.region.sides.model !== "paired") return;
        const limb = data.region.sides.limb;
        for (const mapping of data.mappings) {
          const variant = variantById.get(mapping.variantId)!;
          const laterality = limb === "arm" ? variant.laterality : variant.legLaterality;
          if (laterality === "not_applicable") expect(sideRelationOf(mapping), mapping.id).toBe("both");
        }
      });

      it("says what its mapping version claims (method notes)", () => {
        expect(data.mappingVersion.methodNotes.length).toBeGreaterThan(200);
        for (const external of data.externalMappingVersions) expect(external.version.methodNotes.length, external.version.key).toBeGreaterThan(200);
      });

      it("maps or lists with a reason every catalog row tagged with its catalog keys", () => {
        const keys = new Set(data.region.catalogKeys);
        const mapped = new Set(data.variants.filter((variant) => data.mappings.some((mapping) => mapping.variantId === variant.id)).map((variant) => variant.catalogExerciseId));
        const listed = new Map(data.unmappedTagged.map((entry) => [entry.catalogId, entry]));
        expect(listed.size).toBe(data.unmappedTagged.length);
        for (const exercise of exercises) {
          const primary = exercise.primaryMuscles.some((key) => keys.has(key));
          const secondary = exercise.secondaryMuscles.some((key) => keys.has(key));
          if (primary || secondary) expect(mapped.has(exercise.id) || listed.has(exercise.id), `${exercise.id} ${exercise.name}`).toBe(true);
        }
        for (const [id, entry] of listed) {
          expect(catalogById.has(id), String(id)).toBe(true);
          expect(mapped.has(id), `${id} is both mapped and listed as unmapped`).toBe(false);
          expect(entry.reason.length, String(id)).toBeGreaterThan(20);
        }
      });
    });
  }

  it("holds the library's own record for every exercise it can count, so the page reads no other variant (§3, §6.1; wave A)", () => {
    // The calculator reads a region-only set with the library's variant (§11 decision 11(c)); a region-only set is tagged with
    // the region's keys within its tag scope. Every such exercise's current library variant is in the page data, as the library
    // holds it, mapped (`variants`) or not (`taggedVariants`); nothing else is in `taggedVariants`.
    for (const data of pages) {
      const keys = new Set(data.region.catalogKeys);
      const inScope = (exercise: Exercise) => exercise.primaryMuscles.some((key) => keys.has(key)) || (data.region.regionOnlyTagScope === "any" && exercise.secondaryMuscles.some((key) => keys.has(key)));
      const read = new Map([...data.variants, ...(data.taggedVariants ?? [])].map((variant) => [variant.catalogExerciseId, variant] as const));
      for (const exercise of exercises.filter(inScope)) {
        const library = variantFor(exercise.id);
        if (library) expect(read.get(exercise.id), `${data.region.id}: ${exercise.id} ${exercise.name}`).toEqual(library);
      }
      const mapped = new Set(data.variants.map((variant) => variant.catalogExerciseId));
      for (const variant of data.taggedVariants ?? []) {
        expect(mapped.has(variant.catalogExerciseId), `${data.region.id}: ${variant.id} is mapped`).toBe(false);
        expect(inScope(exercises.find((exercise) => exercise.id === variant.catalogExerciseId)!), `${data.region.id}: ${variant.id}`).toBe(true);
      }
      for (const variant of data.variants) expect(variant, `${data.region.id}: ${variant.id}`).toEqual(variantById.get(variant.id));
    }
    expect(forearmRegionData.taggedVariants?.map((variant) => variant.catalogExerciseId)).toEqual([389, 343, 344, 345, 346, 348, 24, 65, 63, 64, 279, 280, 388, 390]);
  });

  it("keys every mapping uniquely where versions meet", () => {
    for (const data of pages) {
      const keys = [...data.mappings, ...data.externalMappingVersions.flatMap((external) => external.mappings)].map(versionedMappingKey);
      expect(new Set(keys).size, data.region.id).toBe(keys.length);
    }
  });
});

// ---------------------------------------------------------------- the shared libraries

/** The region actions §1.2 names (10-multi-region.md), each of which the library must define. */
const regionActions: Record<string, string[]> = {
  shoulders: ["shoulder.flexion", "shoulder.abduction", "shoulder.extension", "shoulder.horizontal_adduction", "shoulder.horizontal_abduction", "shoulder.external_rotation", "shoulder.internal_rotation", "scapula.upward_rotation"],
  chest: ["shoulder.horizontal_adduction", "shoulder.flexion", "shoulder.extension", "shoulder.adduction", "shoulder.internal_rotation", "scapula.protraction", "scapula.depression", "scapula.upward_rotation"],
  back: ["shoulder.extension", "shoulder.adduction", "shoulder.horizontal_abduction", "scapula.elevation", "scapula.retraction", "scapula.depression", "scapula.upward_rotation", "scapula.downward_rotation", "spine.extension", "spine.lateral_flexion"],
  upper_arm: ["elbow.flexion", "elbow.extension", "forearm.supination", "shoulder.flexion", "shoulder.extension"],
  core: ["spine.flexion", "spine.lateral_flexion", "spine.rotation", "abdomen.compression"],
  hips: ["hip.extension", "hip.flexion", "hip.abduction", "hip.adduction", "hip.external_rotation", "hip.internal_rotation"],
  thigh: ["knee.extension", "knee.flexion", "hip.extension", "hip.flexion"],
  lower_leg: ["ankle.plantar_flexion", "ankle.dorsiflexion", "foot.inversion", "foot.eversion"],
};

describe("the action library", () => {
  it("defines each action once, and every region action §1.2 names", () => {
    const ids = actionLibrary.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [region, actions] of Object.entries(regionActions)) for (const id of actions) expect(ids, `${region}: ${id}`).toContain(id);
    expect(actionsFor(regionActions.upper_arm).map((action) => action.id)).toEqual(upperArmContent.actions.map((action) => action.id));
  });

  it("gives each a joint, a label and a plain description, in anatomical directions", () => {
    for (const action of actionLibrary) {
      expect(action.id).toMatch(/^[a-z_]+\.[a-z_]+$/);
      for (const text of [action.joint, action.label, action.plainDescription]) expect(text.trim(), action.id).not.toBe("");
    }
    for (const { where, text } of actionCopy) {
      expect(text, where).not.toMatch(/\b(left|right)\b/i);
      for (const pattern of forbiddenInCopy) expect(text, where).not.toMatch(pattern);
    }
  });
});

describe("the source library", () => {
  /** A4 (anatomy review) and M1 (mapping review) were both filed for one paper in the forearm's review; both keys are frozen. */
  const shippedDuplicateUrls = [["A4", "M1"]];

  it("never uses a key twice, and never files one URL under two keys", () => {
    const ids = sourceLibrary.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    const byUrl = new Map<string, string[]>();
    for (const source of sourceLibrary) {
      const url = source.url.trim().replace(/\/+$/, "").toLowerCase();
      byUrl.set(url, [...(byUrl.get(url) ?? []), source.id]);
    }
    expect(Array.from(byUrl.values()).filter((keys) => keys.length > 1)).toEqual(shippedDuplicateUrls);
  });

  it("keeps the forearm's keys and gives new ones stable slugs", () => {
    const forearmKeys = sourceLibrary.map((source) => source.id).filter((id) => /^[SAM]\d+$/.test(id));
    expect(forearmKeys).toHaveLength(71);
    for (const source of sourceLibrary) {
      expect(source.id).toMatch(/^[A-Za-z][A-Za-z0-9_.-]*$/);
      if (!/^[SAM]\d+$/.test(source.id)) expect(source.id).toMatch(/^([a-z][a-z0-9_]*\.[a-z0-9_]+|pmid\.\d+)$/);
    }
  });
});

/**
 * Both-limb variants: one-sided for the arms and for the legs, so the first wave that maps one in a
 * new version decides which limb records its side, and the variants lane lists each with its
 * decision in docs/specialization-atlas/regions/variants.md (§3). 188 and 264, the single-leg
 * Romanian deadlifts, are read by the arm now and may move to the standing leg (§11 decision 9).
 */
// The list and each decision's reason are the variant library's (variants/bothLimbs.ts).
const bothLimbCatalogIds = libraryBothLimbCatalogIds;

const oneSided = (laterality: string | undefined) => laterality === "unilateral" || laterality === "either";

/**
 * §3's limb rules for every variant a paired page maps, by its own version or a home's, as
 * problems: a one-sided or either variant is read by the side of the page's limb, both-limb
 * variants aside; a leg page also needs each variant's legLaterality, and a one-sided or either
 * one's side anchor. A midline page reads no side.
 */
function limbSideProblems(data: SpecializationRegionData): string[] {
  if (data.region.sides.model !== "paired") return [];
  const limb = data.region.sides.limb;
  const listed = new Map(data.variants.map((variant) => [variant.id, variant]));
  const mapped = new Set([...data.mappings, ...data.externalMappingVersions.flatMap((external) => external.mappings)].map((mapping) => mapping.variantId));
  const problems: string[] = [];
  for (const id of Array.from(mapped)) {
    const variant = listed.get(id);
    if (!variant) {
      problems.push(`${id}: not among the page's variants`);
      continue;
    }
    const bothLimbs = bothLimbCatalogIds.has(variant.catalogExerciseId);
    const laterality = limb === "arm" ? variant.laterality : variant.legLaterality;
    if (laterality === undefined) {
      problems.push(`${id}: no legLaterality`);
      continue;
    }
    if (!oneSided(laterality)) continue;
    if (variant.sidedBy !== limb && !bothLimbs) problems.push(`${id}: ${laterality} for the ${limb}s, sided by ${variant.sidedBy}`);
    if (limb === "leg" && variant.sideAnchor === undefined) problems.push(`${id}: no side anchor`);
  }
  return problems;
}

describe("the variant library", () => {
  it("holds one current variant per catalog exercise, a replaced one only behind its link", () => {
    const ids = variantLibrary.map((variant) => variant.id);
    expect(new Set(ids).size).toBe(ids.length);
    const current = variantLibrary.filter(isCurrentVariant);
    expect(new Set(current.map((variant) => variant.catalogExerciseId)).size).toBe(current.length);
    for (const variant of variantLibrary) {
      expect(catalogById.get(variant.catalogExerciseId)?.name, variant.id).toBe(variant.catalogName);
      if (variant.replaces) expect(variantById.get(variant.replaces)?.catalogExerciseId, variant.id).toBe(variant.catalogExerciseId);
      if (isCurrentVariant(variant)) expect(variantFor(variant.catalogExerciseId)).toBe(variant);
    }
    expect(variantFor(null)).toBeNull();
    // No catalog row has id 0; every catalog exercise may get a variant as the waves map them.
    expect(variantFor(0)).toBeNull();
  });

  it("holds the forearm's 119 records as published, with sidedBy pinned: the arm where the arms are not bilateral", () => {
    expect(forearmV1Variants).toHaveLength(119);
    for (const variant of forearmV1Variants) expect(variantLibrary).toContain(variant);
    const arm = [46, 49, 52, 53, 56, 61, 127, 129, 131, 142, 188, 256, 257, 264, 338, 340, 342, 350, 379, 383, 384, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414];
    // The both-limb variants 188 and 264 are the only listed exceptions: a later wave may read them by the standing leg (§3, §11 decision 9).
    for (const variant of forearmV1Variants) {
      const pinned = arm.includes(variant.catalogExerciseId) ? "arm" : "none";
      expect(pinned, variant.id).toBe(variant.laterality === "bilateral" ? "none" : "arm");
      if (bothLimbCatalogIds.has(variant.catalogExerciseId)) expect(["arm", "leg"], variant.id).toContain(variant.sidedBy);
      else expect(variant.sidedBy, variant.id).toBe(pinned);
    }
  });

  it("writes the counting attributes a side needs, and descriptive values from the vocabulary", () => {
    for (const variant of variantLibrary) {
      expect(Object.keys(countingDimensions.sided_by.values), variant.id).toContain(variant.sidedBy);
      if (variant.legLaterality !== undefined) expect(Object.keys(countingDimensions.leg_laterality.values), variant.id).toContain(variant.legLaterality);
      if (variant.sideAnchor !== undefined) expect(Object.keys(countingDimensions.side_anchor.values), variant.id).toContain(variant.sideAnchor);
      if (variant.sidedBy === "leg") {
        expect(variant.legLaterality, variant.id).toBeDefined();
        expect(variant.sideAnchor, variant.id).toBeDefined();
      }
      if (variant.sideAnchor !== undefined) expect(variant.sidedBy === "leg" || variant.legLaterality === "unilateral" || variant.legLaterality === "either", variant.id).toBe(true);
      for (const [dimension, value] of Object.entries(variant.dimensions ?? {})) {
        expect(Object.keys(descriptiveDimensions), variant.id).toContain(dimension);
        expect(Object.keys(descriptiveDimensions[dimension as keyof typeof descriptiveDimensions].values), `${variant.id} ${dimension}`).toContain(value);
      }
    }
  });

  it("is read by the side of a page's limb wherever the page maps a one-sided or either variant, both-limb variants aside", () => {
    for (const data of pages) expect(limbSideProblems(data), data.region.id).toEqual([]);
    // Each listed both-limb variant has its limb written out.
    for (const catalogId of Array.from(bothLimbCatalogIds)) expect(["arm", "leg"], String(catalogId)).toContain(variantFor(catalogId)?.sidedBy);
  });

  it("holds an arm page and a leg page to those rules, through their homes' versions too", () => {
    const pageFor = (limb: Limb, variants: ExerciseVariant[]): SpecializationRegionData => ({
      ...forearmRegionData,
      region: { ...forearmRegionData.region, sides: { model: "paired", limb } },
      variants,
      mappings: variants.map((variant) => ({ ...forearmRegionData.mappings[0], id: `${variant.id}:forearm.br`, variantId: variant.id })),
      externalMappingVersions: [],
    });
    const oneArm = variantFor(46)!;
    expect(oneArm).toMatchObject({ laterality: "unilateral", sidedBy: "arm" });
    // 188 as §11 decision 9 would read it, from the release that maps it in a new version.
    const standingLeg: ExerciseVariant = { ...variantFor(188)!, sidedBy: "leg", legLaterality: "unilateral", sideAnchor: "stance_leg" };

    expect(limbSideProblems(pageFor("arm", [oneArm, standingLeg]))).toEqual([]);
    expect(limbSideProblems(pageFor("arm", [{ ...oneArm, sidedBy: "none" }]))).toEqual(["cat-46: unilateral for the arms, sided by none"]);
    expect(limbSideProblems(pageFor("leg", [standingLeg]))).toEqual([]);
    expect(limbSideProblems(pageFor("leg", [{ ...oneArm, legLaterality: "bilateral" }]))).toEqual([]);
    expect(limbSideProblems(pageFor("leg", [oneArm]))).toEqual(["cat-46: no legLaterality"]);
    expect(limbSideProblems(pageFor("leg", [{ ...oneArm, legLaterality: "either" }]))).toEqual(["cat-46: either for the legs, sided by arm", "cat-46: no side anchor"]);
    // A variant the page maps only through a home's version is held to the page's limb as well.
    const leg = pageFor("leg", [oneArm]);
    const throughHome: SpecializationRegionData = { ...leg, mappings: [], externalMappingVersions: [{ regionId: "upper_arm", version: leg.mappingVersion, mappings: leg.mappings, actions: [] }] };
    expect(limbSideProblems(throughHome)).toEqual(["cat-46: no legLaterality"]);
    expect(limbSideProblems({ ...forearmRegionData, region: { ...forearmRegionData.region, sides: { model: "midline" } } })).toEqual([]);
  });

  it("names its dimensions and values as the database stores them", () => {
    expect(Object.keys(descriptiveDimensions)).toEqual(["knee", "hip", "torso", "bench", "plane", "grip_width", "stance", "range", "shoulder"]);
    for (const [id, dimension] of Object.entries({ ...countingDimensions, ...descriptiveDimensions })) {
      expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(dimension.label.trim(), id).not.toBe("");
      for (const [value, label] of Object.entries(dimension.values)) {
        expect(value, id).toMatch(/^[a-z0-9][a-z0-9_]*$/);
        expect(String(label).trim(), `${id} ${value}`).not.toBe("");
      }
    }
  });
});

describe("node records the page reads", () => {
  it("keep the home's region on another region's node, its home role read from the home's record", () => {
    const biceps = forearmRegionData.nodes.find((node) => node.id === "upper_arm.biceps") as AnatomyNode;
    expect(biceps).toMatchObject({ regionId: "upper_arm", role: "external" });
    // The page's copy says external, which is no home role: memberRole refuses it rather than answer for the home.
    expect(() => memberRole("upper_arm", biceps)).toThrow(/home record/);
    const home = regionContentFor(biceps.regionId)!.nodes.find((node) => node.id === biceps.id)!;
    expect(home).toBe(upperArmContent.nodes.find((node) => node.id === "upper_arm.biceps"));
    expect(memberRole("upper_arm", home)).toBe("target");
    expect(memberRole("forearm", home)).toBe("external");
    // A page's copy of its own node keeps its home role, so a page may still ask about its own members.
    const fcu = forearmRegionData.nodes.find((node) => node.id === "forearm.fcu")!;
    expect(memberRole("forearm", fcu)).toBe("target");
  });
});
