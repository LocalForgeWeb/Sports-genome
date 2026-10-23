import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { registeredRegionContents } from "@shared/specialization/registry";
import { forearmContent, forearmRegionData } from "@shared/specialization/regions/forearm";
import { externalContributorIds, forearmAdjacentIds, forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { tendonAreaExtras as forearm } from "@shared/specialization/regions/forearm/tendonAreas";
import { sourceLibrary } from "@shared/specialization/sources";
import { forearmTendonSources } from "@shared/specialization/sources/forearmTendon";
import type { NodeId, RegionExtras, SpecializationRegionData, TendonGroup, TendonMember } from "@shared/specialization/types";
import { muscleNodeByCode } from "../../../../scripts/specialization/research/forearm-v1/import";
import { deltoidIds, deltoidRegionData, deltoidTendonAreas } from "./__fixtures__/deltoidRegion";

/**
 * Tendon exposure's attachment areas as region data (docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §4.1, §4.6): the content tests of §4.1, run on the forearm and,
 * where they are region-agnostic, on the deltoid fixture. Every own target muscle is a reviewed member
 * of a group or listed as not placed with a reason; the adjacent and external members are in none;
 * each muscle carries the package's regional groups by code; the package's §6.1 exclusions hold;
 * every citation resolves with a locator; every membership, single-source or not, is named in
 * regions/forearm/tendon-areas.md; and no text says a word §4.4 keeps out of the section, or a side.
 */

/** §4.4, "Never in the section": matched anywhere in a string, ignoring case, and "%". */
const keptOut = ["risk", "safe", "unsafe", "danger", "injury", "injure", "tendonitis", "tendinitis", "tendinopathy", "overuse", "overload", "strain", "damage", "warning", "alert", "limit", "budget", "threshold", "zone", "spike", "red flag", "acwr", "acute:chronic", "push through", "%"];
/** A side of the body or a limb counted on its own (both sides count as one, the owner's rule of 20 Oct 2026). */
const sideWords = /\b(left|right)\b|\b(arms?|legs?)\b|\b(each|per|both|either|one|other) (arm|side|leg|hand|forearm|wrist)s?\b/i;

const groupsOf = (extras: RegionExtras): TendonGroup[] => (extras.tendonAreas ?? []).flatMap((area) => area.groups);
const pairsOf = (extras: RegionExtras): { areaLabel: string; group: TendonGroup; member: TendonMember }[] =>
  (extras.tendonAreas ?? []).flatMap((area) => area.groups.flatMap((group) => group.members.map((member) => ({ areaLabel: area.label, group, member }))));
const ownTargets = (region: SpecializationRegionData): NodeId[] => region.nodes.filter((node) => node.role === "target" && node.regionId === region.region.id).map((node) => node.id);

/** Every string the section could show or a reviewer reads from these records, labelled for a useful failure. */
function textsOf(extras: RegionExtras): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const area of extras.tendonAreas ?? []) {
    out.push({ where: `${area.id}.label`, text: area.label }, { where: `${area.id}.description`, text: area.description });
    for (const group of area.groups) {
      out.push({ where: `${group.id}.label`, text: group.label });
      if (group.caveat !== null) out.push({ where: `${group.id}.caveat`, text: group.caveat });
      for (const member of group.members) {
        out.push({ where: `${group.id} → ${member.nodeId}.reviewNote`, text: member.reviewNote });
        for (const ref of member.citations) {
          out.push({ where: `${group.id} → ${member.nodeId} → ${ref.sourceId} locator`, text: ref.locator });
          if (ref.qualification !== null) out.push({ where: `${group.id} → ${member.nodeId} → ${ref.sourceId} qualification`, text: ref.qualification });
        }
      }
    }
  }
  for (const item of extras.tendonNotPlaced ?? []) out.push({ where: `not placed ${item.nodeId}`, text: item.reason });
  for (const source of extras.referenceSources ?? []) {
    out.push({ where: `${source.id}.title`, text: source.title });
    if (source.notes) out.push({ where: `${source.id}.notes`, text: source.notes });
  }
  return out;
}

const cases: [string, SpecializationRegionData, RegionExtras][] = [["forearm", forearmRegionData, forearm], ["deltoid fixture", deltoidRegionData, deltoidTendonAreas]];

describe.each(cases)("%s tendon areas", (_name, region, extras) => {
  const areas = extras.tendonAreas ?? [];
  const pairs = pairsOf(extras);

  it("are the region's, with unique ids, filled labels and no empty group", () => {
    expect(extras.regionId).toBe(region.region.id);
    expect(areas.length).toBeGreaterThan(0);
    const ids = [...areas.map((area) => area.id), ...groupsOf(extras).map((group) => group.id)];
    expect(new Set(ids).size, "area and group ids").toBe(ids.length);
    for (const area of areas) {
      expect(area.label.trim(), area.id).not.toBe("");
      expect(area.description.trim(), area.id).not.toBe("");
      expect(area.groups.length, area.id).toBeGreaterThan(0);
      for (const group of area.groups) {
        expect(group.label.trim(), group.id).not.toBe("");
        expect(group.members.length, group.id).toBeGreaterThan(0);
        expect(new Set(group.members.map((member) => member.nodeId)).size, `${group.id}: a muscle once per group`).toBe(group.members.length);
        if (group.caveat !== null) expect(group.caveat.trim(), group.id).not.toBe("");
      }
    }
    // Labels are what the page names: no two areas, and no two groups in one area, share one.
    expect(new Set(areas.map((area) => area.label)).size).toBe(areas.length);
    for (const area of areas) expect(new Set(area.groups.map((group) => group.label)).size, area.id).toBe(area.groups.length);
  });

  it("hold only the region's own target muscles, each pair with its status, its note and its sources", () => {
    const own = new Set(ownTargets(region));
    for (const { group, member } of pairs) {
      const where = `${group.id} → ${member.nodeId}`;
      expect(own.has(member.nodeId), where).toBe(true);
      expect(["reviewed", "draft"], where).toContain(member.reviewStatus);
      expect(member.reviewNote.trim().length, where).toBeGreaterThan(20);
      if (member.reviewStatus === "reviewed") expect(member.citations.length, where).toBeGreaterThan(0);
      // One source alone: the pair says so, and tendon-areas.md names it (below, for the forearm).
      if (new Set(member.citations.map((ref) => ref.sourceId)).size === 1) expect(member.singleSource, where).toBe(true);
    }
  });

  it("place every own target muscle in a reviewed group, or list it as not placed with a reason, never both", () => {
    const notPlaced = new Map((extras.tendonNotPlaced ?? []).map((item) => [item.nodeId, item.reason] as const));
    expect(notPlaced.size).toBe((extras.tendonNotPlaced ?? []).length);
    const own = ownTargets(region);
    for (const nodeId of Array.from(notPlaced.keys())) expect(own, nodeId).toContain(nodeId);
    for (const nodeId of own) {
      const reviewed = pairs.filter(({ member }) => member.nodeId === nodeId && member.reviewStatus === "reviewed").length;
      expect(reviewed > 0 !== notPlaced.has(nodeId), `${nodeId}: exactly one of a reviewed group and a reason`).toBe(true);
      if (notPlaced.has(nodeId)) expect(notPlaced.get(nodeId)!.length, nodeId).toBeGreaterThan(20);
    }
  });

  it("leave every adjacent and external member out of every group", () => {
    const others = region.nodes.filter((node) => node.role === "adjacent" || node.role === "external").map((node) => node.id);
    expect(others.length).toBeGreaterThan(0);
    const placed = new Set(pairs.map(({ member }) => member.nodeId));
    const notPlaced = new Set((extras.tendonNotPlaced ?? []).map((item) => item.nodeId));
    for (const nodeId of others) {
      expect(placed.has(nodeId), nodeId).toBe(false);
      expect(notPlaced.has(nodeId), nodeId).toBe(false);
    }
  });

  it("cite sources the page holds, each with a locator", () => {
    const held = new Set([...region.sources, ...(extras.referenceSources ?? [])].map((source) => source.id));
    for (const { group, member } of pairs) {
      expect(new Set(member.citations.map((ref) => ref.sourceId)).size, `${group.id} → ${member.nodeId}: a source once`).toBe(member.citations.length);
      for (const ref of member.citations) {
        const where = `${group.id} → ${member.nodeId} → ${ref.sourceId}`;
        expect(held.has(ref.sourceId), where).toBe(true);
        expect(ref.locator.trim(), where).not.toBe("");
        if (ref.qualification !== null) expect(ref.qualification.trim(), where).not.toBe("");
      }
    }
  });

  it("say no word the section keeps out (§4.4), and no side", () => {
    for (const { where, text } of textsOf(extras)) {
      for (const word of keptOut) expect(text.toLowerCase().includes(word), `${where}: "${word}"`).toBe(false);
      expect(text, where).not.toMatch(sideWords);
    }
  });
});

describe("the forearm's tendon areas", () => {
  const pairs = pairsOf(forearm);
  const groupById = new Map(groupsOf(forearm).map((group) => [group.id, group] as const));
  const nodeById = new Map(forearmRegionData.nodes.map((node) => [node.id, node] as const));
  const membersOf = (groupId: string, status?: TendonMember["reviewStatus"]) => (groupById.get(groupId)?.members ?? []).filter((member) => !status || member.reviewStatus === status).map((member) => member.nodeId);

  it("are the four areas of §4.1, in its order, with their groups and members as tabled", () => {
    const table: [string, [string, NodeId[]][]][] = [
      ["Inner elbow", [["Common flexor origin", [m.pronatorTeres, m.flexorCarpiRadialis, m.palmarisLongus, m.flexorCarpiUlnaris, m.flexorDigitorumSuperficialis]]]],
      ["Outer elbow", [
        ["Common extensor origin", [m.extensorCarpiRadialisBrevis, m.extensorDigitorum, m.extensorDigitiMinimi, m.extensorCarpiUlnaris]],
        ["Ridge above the outer elbow", [m.extensorCarpiRadialisLongus, m.brachioradialis]],
        ["Supinator", [m.supinator]],
      ]],
      ["Wrist and thumb", [
        ["Front of the wrist", [m.flexorCarpiRadialis, m.flexorCarpiUlnaris, m.palmarisLongus]],
        ["Back of the wrist", [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris]],
        ["Thumb side of the wrist", [m.abductorPollicisLongus, m.extensorPollicisBrevis]],
        // EPB passes the wrist with APL and ends on the thumb, so it is in both (the attachment rule).
        ["Thumb", [m.flexorPollicisLongus, m.extensorPollicisLongus, m.extensorPollicisBrevis]],
        ["Radial styloid", [m.brachioradialis]],
        ["Above the wrist, deep", [m.pronatorQuadratus]],
      ]],
      ["Fingers", [["Finger flexors", [m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus]], ["Finger extensors", [m.extensorDigitorum, m.extensorDigitiMinimi, m.extensorIndicis]]]],
    ];
    const actual = (forearm.tendonAreas ?? []).map((area): [string, [string, NodeId[]][]] => [area.label, area.groups.map((group): [string, NodeId[]] => [group.label, group.members.map((member) => member.nodeId)])]);
    expect(actual).toEqual(table);
  });

  it("keep the package's exclusions (its §6.1): ECRL never in the common extensor origin, FDP and FPL never in the common flexor origin", () => {
    const extensorOrigin = groupById.get("forearm.tendon.common_extensor_origin")!;
    const flexorOrigin = groupById.get("forearm.tendon.common_flexor_origin")!;
    expect(extensorOrigin.label).toBe("Common extensor origin");
    expect(flexorOrigin.label).toBe("Common flexor origin");
    expect(membersOf(extensorOrigin.id)).not.toContain(m.extensorCarpiRadialisLongus);
    expect(membersOf(flexorOrigin.id)).not.toContain(m.flexorDigitorumProfundus);
    expect(membersOf(flexorOrigin.id)).not.toContain(m.flexorPollicisLongus);
    // ECRL's place at the outer elbow is the ridge, and its caveats say what two sources add.
    expect(membersOf("forearm.tendon.outer_ridge", "reviewed")).toContain(m.extensorCarpiRadialisLongus);
    expect(extensorOrigin.caveat).toMatch(/ECRL is not counted here/);
    expect(flexorOrigin.caveat).toMatch(/FDP\b.*FPL\b.*not counted here/);
  });

  it("leave the anconeus and the upper arm's biceps and brachialis out of every group", () => {
    const placed = new Set(pairs.map(({ member }) => member.nodeId));
    for (const nodeId of [forearmAdjacentIds.anconeus, externalContributorIds.biceps, externalContributorIds.brachialis]) {
      expect(nodeById.has(nodeId), nodeId).toBe(true);
      expect(placed.has(nodeId), nodeId).toBe(false);
    }
  });

  it("carry each muscle's package groups, read from muscles.json by code", () => {
    const muscles = JSON.parse(readFileSync(join(process.cwd(), "docs/specialization-atlas/forearm-research-v1/muscles.json"), "utf8")) as { id: string; code: string; regional_groups: string[] }[];
    expect(muscles).toHaveLength(19);
    const groupsByNode = new Map(muscles.map((muscle) => {
      const row = muscleNodeByCode[muscle.code];
      expect(row, muscle.code).toBeDefined();
      expect(row.packageId, muscle.code).toBe(muscle.id);
      return [row.nodeId, muscle.regional_groups] as const;
    }));
    for (const { group, member } of pairs) expect(member.packageGroups, `${group.id} → ${member.nodeId}`).toEqual(groupsByNode.get(member.nodeId));
    // Every package muscle is placed somewhere, so every package group is traced.
    expect(new Set(pairs.map(({ member }) => member.nodeId))).toEqual(new Set(groupsByNode.keys()));
  });

  it("rest every reviewed pair on two or more sources, or mark it single-source", () => {
    for (const { group, member } of pairs) {
      if (member.reviewStatus !== "reviewed") continue;
      const distinct = new Set(member.citations.map((ref) => ref.sourceId)).size;
      expect(distinct >= 2 || member.singleSource, `${group.id} → ${member.nodeId}`).toBe(true);
      expect(member.reviewNote, `${group.id} → ${member.nodeId}`).toMatch(/^Checked against the cited sources' web-search excerpts on \d+ \w+ 2026/);
    }
    // The three pairs §4.1 held as drafts until a second source agreed say that one did.
    for (const [groupId, nodeId] of [["forearm.tendon.common_extensor_origin", m.extensorCarpiUlnaris], ["forearm.tendon.supinator", m.supinator], ["forearm.tendon.above_wrist_deep", m.pronatorQuadratus]] as const) {
      const member = groupById.get(groupId)!.members.find((item) => item.nodeId === nodeId)!;
      if (member.reviewStatus === "reviewed") expect(member.reviewNote, `${groupId} → ${nodeId}`).toMatch(/Held as a draft in the design until a second source agreed\./);
    }
  });

  it("cite library sources, the new ones only as reference sources the seed never writes", () => {
    const libraryIds = new Set(sourceLibrary.map((source) => source.id));
    for (const { member } of pairs) for (const ref of member.citations) expect(libraryIds.has(ref.sourceId), ref.sourceId).toBe(true);
    expect(forearm.referenceSources).toBe(forearmTendonSources);
    for (const source of forearmTendonSources) expect(sourceLibrary, source.id).toContain(source);
    const seeded = new Set(registeredRegionContents.flatMap((content) => content.sources.map((source) => source.id)));
    for (const source of forearmTendonSources) expect(seeded.has(source.id), `${source.id} is seeded`).toBe(false);
    // Each reference source is cited, and each cited source the page's data lacks is a reference source.
    const cited = new Set(pairs.flatMap(({ member }) => member.citations.map((ref) => ref.sourceId)));
    for (const source of forearmTendonSources) expect(cited.has(source.id), `${source.id} is cited`).toBe(true);
    const onPage = new Set(forearmRegionData.sources.map((source) => source.id));
    const reference = new Set(forearmTendonSources.map((source) => source.id));
    for (const id of Array.from(cited)) expect(onPage.has(id) || reference.has(id), id).toBe(true);
    // Each new record says what the search showed, as the library's anatomy records do.
    for (const source of forearmTendonSources) expect(source.notes, source.id).toMatch(/search/i);
  });

  it("name every membership in tendon-areas.md, with its status and whether one source alone places it", () => {
    const doc = readFileSync(join(process.cwd(), "docs/specialization-atlas/regions/forearm/tendon-areas.md"), "utf8");
    const rows = doc.split("\n").filter((line) => line.startsWith("|")).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
    const membershipRows = rows.filter((cells) => cells.length >= 6 && ["reviewed", "draft"].includes(cells[3]));
    expect(membershipRows).toHaveLength(pairs.length);
    for (const { areaLabel, group, member } of pairs) {
      const shortName = nodeById.get(member.nodeId)!.shortName;
      const row = membershipRows.find((cells) => cells[0] === areaLabel && cells[1] === group.label && cells[2] === shortName);
      expect(row, `${group.label} → ${shortName}`).toBeDefined();
      expect(row![3], `${group.label} → ${shortName}`).toBe(member.reviewStatus);
      expect(row![4], `${group.label} → ${shortName}`).toBe(member.singleSource ? "yes" : "no");
      // The same sources, exactly, both ways: each id is written in backticks in the row.
      const inDoc = Array.from(row![5].matchAll(/`([^`]+)`/g), (match) => match[1]).sort();
      expect(inDoc, `${group.label} → ${shortName} sources`).toEqual(member.citations.map((ref) => ref.sourceId).sort());
    }
  });

  it("name every cited source, by its id, in the pair's review note", () => {
    const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const { group, member } of pairs) {
      for (const ref of member.citations) {
        // "A1:" never matches inside "A12:", and an id is never read as part of a longer one.
        expect(member.reviewNote, `${group.id} → ${member.nodeId} names ${ref.sourceId}`).toMatch(new RegExp(`(^|[^A-Za-z0-9_.])${escape(ref.sourceId)}:`));
      }
    }
  });

  it("describe each area by naming only its groups' reviewed members, never a class of muscles", () => {
    const muscles = forearmRegionData.nodes.filter((node) => node.kind === "muscle" && node.role !== "group");
    const wordIn = (text: string, word: string, caseSensitive: boolean) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, caseSensitive ? "" : "i").test(text);
    for (const area of forearm.tendonAreas ?? []) {
      const reviewed = new Set(area.groups.flatMap((group) => group.members.filter((member) => member.reviewStatus === "reviewed").map((member) => member.nodeId)));
      for (const node of muscles) {
        const named = wordIn(area.description, node.shortName, true) || [node.name, ...node.aliases].some((form) => wordIn(area.description, form, false));
        if (named) expect(reviewed.has(node.id), `${area.label} names ${node.shortName}, which it does not hold`).toBe(true);
      }
      expect(area.description, area.label).not.toMatch(/\b(flexors|extensors|wrist muscles|thumb muscles)\b/i);
    }
  });

  it("are opted into by the content's section flag, and never loaded with the page", () => {
    expect(forearmContent.sections?.tendonExposure).toBe(true);
    expect(forearmRegionData.sections?.tendonExposure).toBe(true);
    for (const file of ["content.ts", "index.ts"]) {
      const text = readFileSync(join(process.cwd(), "shared/specialization/regions/forearm", file), "utf8");
      expect(text, file).not.toMatch(/from "\.\/tendonAreas"|sources\/forearmTendon/);
    }
  });
});

describe("the deltoid fixture's tendon areas", () => {
  const pairs = pairsOf(deltoidTendonAreas);

  it("run every path once: a head in two areas, a draft pair, a head not placed, an external member in none", () => {
    const areasOf = (nodeId: string) => new Set(pairs.filter(({ member }) => member.nodeId === nodeId && member.reviewStatus === "reviewed").map(({ areaLabel }) => areaLabel));
    expect(deltoidTendonAreas.tendonAreas).toHaveLength(2);
    expect(areasOf(deltoidIds.lateral).size).toBe(2);
    expect(areasOf(deltoidIds.anterior).size).toBe(1);
    expect(pairs.filter(({ member }) => member.nodeId === deltoidIds.anterior && member.reviewStatus === "draft")).toHaveLength(1);
    expect((deltoidTendonAreas.tendonNotPlaced ?? []).map((item) => item.nodeId)).toEqual([deltoidIds.posterior]);
    expect(pairs.some(({ member }) => member.nodeId === deltoidIds.triceps)).toBe(false);
    expect(deltoidRegionData.sections?.tendonExposure).toBe(true);
  });
});
