// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import rankable from "@/data/rankableExercises.json";
import { exercises } from "./exerciseCatalog";
import { familiarRankingLift, rankingLiftHowTo, rankingLiftsForRegion, suggestedRankingLifts } from "./rankRecommendations";
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
    // Every group the map shows has a familiar lift, except the one no lift can rank.
    for (const region of regions) if (region.id !== "tibialis_anterior") expect(familiarRankingLift[region.id], region.id).toBeDefined();
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

describe("Get a Chest rank, in the muscle group's sheet", () => {
  it("lists the lifts with why each one, and opens the log with the chosen exercise", () => {
    const onLog = vi.fn();
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: [], hasRecords: false, onLog }));
    const section = screen.getByRole("region", { name: "Get a Chest rank" });
    const rows = within(section).getAllByRole("listitem");
    expect(rows[0].textContent).toContain("Barbell Bench Press");
    expect(rows[0].textContent).toContain("Most common");
    expect(rows[0].textContent).toContain("Main mover for chest · compared on this exact lift");
    expect(section.textContent).toContain("Log a set of any of these — the weight and the reps — and your chest gets a rank:");
    fireEvent.click(within(section).getByRole("button", { name: "Log Barbell Bench Press" }));
    expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ name: "Barbell Bench Press" }));
    expect(section.textContent).toMatch(/\d+ more lifts rank the chest/);
  });

  it("says plainly when logged lifts could not be ranked", () => {
    render(React.createElement(RankingLiftSuggestions, { regionId: "chest", regionLabel: "Chest", loggedNames: ["Push-Up Plus"], hasRecords: true }));
    expect(screen.getByText(/None of the lifts logged here can be ranked/)).toBeTruthy();
  });

  it("says a group cannot be ranked yet when no lift ranks it", () => {
    render(React.createElement(RankingLiftSuggestions, { regionId: "tibialis_anterior", regionLabel: "Tibialis anterior", loggedNames: [], hasRecords: false }));
    expect(screen.getByRole("region", { name: "Get a Tibialis anterior rank" }).textContent).toContain("No lift in the comparison data ranks the tibialis anterior yet");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
