// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import rankable from "@/data/rankableExercises.json";
import { exercises } from "./exerciseCatalog";
import { createHash } from "node:crypto";
import { RANKABLE_SCHEMA_VERSION, familiarRankingLift, familiarRankingLiftId, rankableSnapshotMeta, rankingLiftHowTo, rankingLiftsForRegion, suggestedRankingLifts } from "./rankRecommendations";
import { muscleCanonicalNameToRegionId } from "@shared/capabilityRank";
import { strengthRegionDefinitions } from "@shared/strengthGenomeDefinitions";
import { RankingLiftSuggestions } from "@/components/RankingLiftSuggestions";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

const table = (rankable as unknown as { exercises: Record<string, [string, string, [string, string, number][]]> }).exercises;
const regions = strengthRegionDefinitions.filter((region) => "bodyArea" in region && region.bodyArea);

describe("lifts that give an unranked muscle group a rank", () => {
  it("reads the scorer's own list: catalog exercises only, with working mappings and no stabilizers", () => {
    const ids = new Set(exercises.map((exercise) => exercise.id));
    expect(Object.keys(table).length).toBe(244);
    for (const [id, [mode, basis, mappings]] of Object.entries(table)) {
      expect(ids.has(Number(id)), id).toBe(true);
      expect(["load", "reps"]).toContain(mode);
      expect(["direct", "related"]).toContain(basis);
      for (const [muscle, role] of mappings) {
        expect(role).not.toBe("stabilizer");
        expect(muscle in muscleCanonicalNameToRegionId, muscle).toBe(true);
      }
    }
  });

  it("suggests only lifts that work the group as a mover, so logging one really produces its rank", () => {
    for (const region of regions) {
      for (const lift of suggestedRankingLifts(region.id)) {
        const [, , mappings] = table[String(lift.exercise.id)];
        expect(mappings.some(([muscle]) => muscleCanonicalNameToRegionId[muscle] === region.id), `${lift.exercise.name} for ${region.id}`).toBe(true);
      }
    }
  });

  it("leads with the lift people know: a bench press for chest, not a fly", () => {
    const chest = suggestedRankingLifts("chest");
    expect(chest[0].exercise.name).toBe("Barbell Bench Press");
    expect(chest).toHaveLength(3);
    // The rest are spread across equipment.
    expect(new Set(chest.map((lift) => lift.exercise.equipment)).size).toBe(3);
    expect(suggestedRankingLifts("quadriceps")[0].exercise.name).toBe("Back Squat");
    expect(suggestedRankingLifts("lats")[0].exercise.name).toBe("Lat Pulldown");
  });

  it("keeps every familiar lift honest: rankable, and a main mover for its group (a helper only where the data has nothing more)", () => {
    for (const [regionId, name] of Object.entries(familiarRankingLift)) {
      const lift = rankingLiftsForRegion(regionId).find((candidate) => candidate.exercise.name === name);
      expect(lift, `${name} for ${regionId}`).toBeDefined();
      if (regionId !== "hip_abductors") expect(lift!.role, name).toBe("primary");
    }
    // Every group the map shows has a familiar lift, except a group no lift can rank: the tibialis
    // anterior, and the neck (the 50-exercise expansion's neck work has no norm, so nothing scores it).
    const unrankable = regions.filter((region) => rankingLiftsForRegion(region.id).length === 0).map((region) => region.id);
    expect(unrankable.sort()).toEqual(["neck", "tibialis_anterior"]);
    for (const region of regions) {
      if (unrankable.includes(region.id)) expect(familiarRankingLift[region.id], region.id).toBeUndefined();
      else expect(familiarRankingLift[region.id], region.id).toBeDefined();
    }
  });

  it("says when no lift can rank a group, rather than suggesting one that would leave it unranked", () => {
    expect(rankingLiftsForRegion("tibialis_anterior")).toEqual([]);
  });

  it("leaves out lifts already logged for the group", () => {
    const names = suggestedRankingLifts("chest", { exclude: new Set(["barbell bench press"]) }).map((lift) => lift.exercise.name);
    expect(names).not.toContain("Barbell Bench Press");
    expect(names).toHaveLength(3);
  });

  it("logs a bodyweight movement as reps alone, and says so", () => {
    const pullUp = rankingLiftsForRegion("lats").find((lift) => lift.exercise.name === "Pull-Up")!;
    expect(pullUp.mode).toBe("reps");
    expect(rankingLiftHowTo(pullUp)).toBe("Log your best set of reps with no added weight.");
    expect(rankingLiftHowTo(suggestedRankingLifts("chest")[0])).toBeNull();
  });
});

describe("Add a comparable lift, in the muscle group's sheet", () => {
  it("lists the lifts with equipment and why each one, and opens the log with that exact exercise", () => {
    const onLog = vi.fn();
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: [], hasRecords: false, onLog }));
    const section = screen.getByRole("region", { name: "Add a comparable lift" });
    const rows = within(section).getAllByRole("listitem");
    expect(rows[0].textContent).toContain("Barbell Bench Press");
    // "Common option", not a superlative there is no usage data for.
    expect(rows[0].textContent).toContain("Common option");
    expect(section.textContent).not.toContain("Most common");
    expect(rows[0].textContent).toContain("Barbell · main mover for chest · compared on this exact lift");
    expect(section.textContent).toContain("A set of one of these — weight and reps — can give your chest a rank.");
    fireEvent.click(within(section).getByRole("button", { name: "Log this lift: Barbell Bench Press" }));
    expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: "Barbell Bench Press" }));
    expect(section.textContent).toMatch(/\d+ more lifts rank the chest/);
    // Direct and related comparisons explained on demand.
    expect(within(section).getByText("How lifts are compared")).toBeTruthy();
  });

  it("narrows to the chosen equipment, and offers any equipment again when nothing is left", () => {
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: [], hasRecords: false }));
    const section = screen.getByRole("region", { name: "Add a comparable lift" });
    fireEvent.change(within(section).getByRole("combobox", { name: "Equipment" }), { target: { value: "Machine" } });
    const rows = within(section).getAllByRole("listitem");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.textContent).toContain("Machine · ");
    // Every machine chest lift already logged: nothing to suggest on it, said so, with the way out.
    cleanup();
    const machines = rankingLiftsForRegion("chest").filter((lift) => lift.exercise.equipment === "Machine").map((lift) => lift.exercise.name);
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: machines, hasRecords: true }));
    const again = screen.getByRole("region", { name: "Add a comparable lift" });
    expect(within(again).queryByRole("option", { name: /^Machine/ })).toBeNull();
  });

  it("says what stands between a logged lift and a rank, and that the lift is saved either way", () => {
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: [], hasRecords: false, blocked: "failed" }));
    expect(screen.getByRole("status").textContent).toBe("Ranks could not be worked out just now. A lift you log is saved, and ranks when the service answers again.");
    cleanup();
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: [], hasRecords: false, blocked: "offline" }));
    expect(screen.getByRole("status").textContent).toContain("saved on this device, and ranks once you're back online");
  });

  it("says plainly when logged lifts could not be compared", () => {
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: ["Push-Up Plus"], hasRecords: true }));
    expect(screen.getByText(/None of the lifts logged here can be compared with other lifters/)).toBeTruthy();
  });

  it("says a group cannot be ranked yet without implying it does not matter", () => {
    render(React.createElement(RankingLiftSuggestions, { regionId: "tibialis_anterior", regionLabel: "Tibialis anterior", loggedNames: [], hasRecords: false }));
    const text = screen.getByRole("region", { name: "Add a comparable lift" }).textContent;
    expect(text).toContain("No lift in the comparison data ranks the tibialis anterior yet");
    expect(text).toContain("That says nothing about how much it matters");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("the snapshot is checked, not trusted by date (S01-S03, S08)", () => {
  it("records its scorer, schema and the catalog names it was built against, and the app catalog still matches", () => {
    expect(rankableSnapshotMeta.schemaVersion).toBe(RANKABLE_SCHEMA_VERSION);
    expect(rankableSnapshotMeta.scorer).toBe("score_strength_profile_v1");
    expect(rankableSnapshotMeta.resolutions).toEqual({ direct: "direct", aliased_variant: "related", aliased_rep_variant: "related" });
    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
    const ids = Object.keys(table).map(Number).sort((a, b) => a - b);
    expect(rankableSnapshotMeta.catalog.scored).toBe(ids.length);
    // The database's names for these IDs, digested when the snapshot was made; a renamed or renumbered
    // catalog entry changes this and fails here, asking for the snapshot to be regenerated.
    const digest = createHash("md5").update(ids.map((id) => `${id}:${byId.get(id)}`).join("\n")).digest("hex");
    expect(digest).toBe(rankableSnapshotMeta.catalog.namesFingerprint);
  });

  it("picks familiar lifts by catalog ID, so two entries that share a name cannot swap", () => {
    expect(exercises.filter((exercise) => exercise.name === "Romanian Deadlift").map((exercise) => exercise.id)).toEqual([42, 186]);
    expect(suggestedRankingLifts("hamstrings")[0].exercise.id).toBe(familiarRankingLiftId.hamstrings);
    for (const [regionId, id] of Object.entries(familiarRankingLiftId)) expect(familiarRankingLift[regionId]).toBe(exercises.find((exercise) => exercise.id === id)!.name);
    // Excluding by ID leaves the other Romanian Deadlift available.
    const pool = (excludeIds: Set<number>) => rankingLiftsForRegion("hamstrings").filter((lift) => !excludeIds.has(lift.exercise.id)).map((lift) => lift.exercise.id);
    expect(pool(new Set([186]))).toContain(42);
    expect(suggestedRankingLifts("hamstrings", { excludeIds: new Set([186]) }).map((lift) => lift.exercise.id)).not.toContain(186);
  });

  it("refuses a snapshot with an unknown resolution, a bad weight, a duplicate ID or no name", async () => {
    // @ts-expect-error - a plain .mjs script without types
    const { buildRankableTable } = await import("../../../scripts/strength/rankable-exercises.mjs");
    const good = [1, "load", "direct", [["pectoralis_major_sternocostal", "primary", 0.95], ["serratus_anterior", "stabilizer", null]], "Barbell Bench Press"];
    const built = buildRankableTable([good]);
    expect(built.exercises[1]).toEqual(["load", "direct", [["pectoralis_major_sternocostal", "primary", 0.95]]]);
    expect(built.warnings).toHaveLength(1);
    expect(() => buildRankableTable([[...good.slice(0, 2), "nearest_neighbour", ...good.slice(3)]])).toThrow(/unknown norm_resolution "nearest_neighbour"/);
    expect(() => buildRankableTable([[1, "load", "direct", [["pectoralis_major_sternocostal", "primary", 1.4]], "X"]])).toThrow(/outside \(0, 1\]/);
    expect(() => buildRankableTable([good, good])).toThrow(/duplicate catalogId/);
    expect(() => buildRankableTable([[1, "load", "direct", good[3], ""]])).toThrow(/missing exercise name/);
    expect(() => buildRankableTable([[1, "load", "direct", [["serratus_anterior", "stabilizer", 0.2]], "X"]])).toThrow(/only stabilizer mappings/);
  });
});
