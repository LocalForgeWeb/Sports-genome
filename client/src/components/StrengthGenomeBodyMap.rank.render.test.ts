// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { regionRanksFromMuscles, type MuscleScore } from "@shared/capabilityRank";
import { strengthRegionDefinitions } from "@shared/strengthGenomeDefinitions";

vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));

import { StrengthGenomeBodyMap } from "./StrengthGenomeBodyMap";
import { RankCard, UnscoredRankCard, displayPercentile } from "./CapabilityRank";

const communityGroup = { label: "Self-selected Strength Level community lifters (not general population)", sex: "male" as const };
const muscle = (canonicalName: string, name: string, percentile: number, confidence01: number, evidenceCount = 1): MuscleScore => ({
  muscleId: `m-${canonicalName}`, canonicalName, name, percentile, confidence01, evidenceCount, movementPatternCount: evidenceCount,
  evidence: [{ exerciseName: "Preacher Curl", role: "primary", exercisePercentile: 33.86 }], referenceGroups: [communityGroup],
});

/** From the live aggregation: bench, lat pulldown and preacher curl for an 80 kg man. */
const live = regionRanksFromMuscles([
  muscle("pectoralis_major_sternocostal", "Pectoralis major — sternocostal head", 68.5, 0.601),
  muscle("biceps_brachii", "Biceps brachii", 41.16, 0.758, 2),
  muscle("brachialis", "Brachialis", 41.33, 0.722, 2),
  muscle("latissimus_dorsi", "Latissimus dorsi", 55.09, 0.6),
]);

const regions = strengthRegionDefinitions.map((region) => ({ ...region, state: "OBSERVED_TEST_CONTEXT" as const }));

function drawMap(regionRanks: ReturnType<typeof regionRanksFromMuscles> | null) {
  return render(React.createElement(StrengthGenomeBodyMap, { regions, activePriorityIds: new Set<string>(), onSelect: vi.fn(), regionRanks }));
}

afterEach(() => { document.body.innerHTML = ""; });

describe("Coverage mode never implies rank", () => {
  /** The guarantee the old source-grep test stood for, checked on what is actually rendered. */
  it("shows no rank, percentile or rank colour without ranks", () => {
    const { container } = drawMap(null);
    expect(container.textContent).not.toMatch(/percentile|Prospect|Varsity|Regional|World Stage|Not scored/);
    expect(container.querySelector('[data-encoding="rank"]')).toBeNull();
    expect(screen.getAllByText("On record").length).toBeGreaterThan(0);
  });
});

describe("Strength/Rank mode", () => {
  it("colours each ranked region by its rank and hatches the rest", () => {
    const { container } = drawMap(live);
    expect(container.querySelector('svg[data-encoding="rank"]')).toBeTruthy();
    expect(container.querySelectorAll('.anatomy-muscle[data-rank="regional"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.anatomy-muscle[data-rank="varsity"]').length).toBeGreaterThan(0);
    // Quadriceps has no score: unscored, never the bottom rank.
    expect(container.querySelector('.anatomy-muscle[data-muscle="quads"]')?.getAttribute("data-unscored")).toBe("true");
    expect(container.querySelector('.anatomy-muscle[data-muscle="quads"]')?.getAttribute("data-rank")).toBeNull();
    expect(container.querySelector('.anatomy-muscle[data-rank="prospect"]')).toBeNull();
  });

  /** The feet are drawn but belong to no region: plain anatomy, never "not scored". */
  it("leaves anatomy outside every region neutral rather than hatched", () => {
    const { container } = drawMap(live);
    const feet = container.querySelector('.anatomy-muscle[data-muscle="feet"]');
    expect(feet).toBeTruthy();
    expect(feet?.getAttribute("data-unscored")).toBeNull();
    expect(feet?.getAttribute("data-rank")).toBeNull();
    const labels = Array.from(container.querySelectorAll(".anatomy-hit[aria-label]")).map((node) => node.getAttribute("aria-label") ?? "");
    expect(labels.some((label) => /^feet, not scored/i.test(label))).toBe(false);
    expect(labels).toContain("Feet, not part of any strength region");
  });

  it("names rank, percentile and confidence in words on the figure", () => {
    const { container } = drawMap(live);
    const labels = Array.from(container.querySelectorAll(".anatomy-hit[aria-label]")).map((node) => node.getAttribute("aria-label"));
    expect(labels).toContain("Biceps, Varsity rank, 41st percentile, estimated, moderate confidence");
    expect(labels.some((label) => label?.startsWith("Quadriceps, not scored"))).toBe(true);
  });

  /** The named path: the same rank a tap gives, reachable without touching the figure. */
  it("puts rank and percentile in every region button's name", () => {
    drawMap(live);
    const list = screen.getByRole("group", { name: "Strength Genome regions" });
    expect(within(list).getByRole("button", { name: "Biceps, Varsity · 41st" })).toBeTruthy();
    expect(within(list).getByRole("button", { name: "Chest, Regional · 68th" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /View all/ }));
    expect(within(list).getByRole("button", { name: "Quadriceps, Not scored" })).toBeTruthy();
  });

  it("shows seven labelled bands and an unscored sample outside them", () => {
    drawMap(live);
    const scale = screen.getByRole("list", { name: "Rank colours, lowest to highest" });
    expect(within(scale).getAllByRole("button")).toHaveLength(7);
    expect(within(scale).getByRole("button", { name: /^World Stage, percentiles 99–100\./ })).toBeTruthy();
    const foot = screen.getByText("Sports Genome ranks, not competition titles.").parentElement!;
    expect(within(foot).getByText("Not scored")).toBeTruthy();
  });

  /** A legend band answers "which of mine are here" in text, not only by pointing at colour. */
  it("lists the groups at a band when the band is chosen", () => {
    drawMap(live);
    fireEvent.click(screen.getByRole("button", { name: /^Varsity, percentiles 40–59\./ }));
    expect(screen.getByRole("status").textContent).toBe("At Varsity: Lats, Biceps.");
    fireEvent.click(screen.getByRole("button", { name: /^National Circuit, percentiles 95–98\./ }));
    expect(screen.getByRole("status").textContent).toBe("None of your muscle groups is at National Circuit yet.");
  });

  it("says ranks are estimates of colour, not coverage, in its boundary line", () => {
    drawMap(live);
    expect(screen.getByText(/Hatched groups have no percentile yet/)).toBeTruthy();
  });
});

describe("The rank card", () => {
  it("leads with the rank and the percentile, and names who it is against", () => {
    render(React.createElement(RankCard, { regionRank: live.get("biceps")! }));
    expect(screen.getByText("Varsity")).toBeTruthy();
    expect(screen.getByText("41st percentile")).toBeTruthy();
    expect(screen.getByText(/Compared with Self-selected Strength Level community lifters \(not general population\), men\./)).toBeTruthy();
  });

  /** Estimated is the only state this build can support, and confidence is its own label. */
  it("marks the rank estimated and labels confidence separately, never as a number", () => {
    const { container } = render(React.createElement(RankCard, { regionRank: live.get("biceps")! }));
    expect(screen.getByText("Estimated")).toBeTruthy();
    expect(screen.getByText("Moderate confidence")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Confirmed|0\.758|76%/);
  });

  /** High score, thin evidence: the colour and name stay; only the certainty changes, and says so. */
  it("keeps a high rank on thin evidence and hedges only the number", () => {
    const thin = regionRanksFromMuscles([muscle("rectus_femoris", "Rectus femoris", 96.4, 0.3)]).get("quadriceps")!;
    render(React.createElement(RankCard, { regionRank: thin }));
    expect(screen.getByText("National Circuit")).toBeTruthy();
    expect(screen.getByText("About 96th percentile")).toBeTruthy();
    expect(screen.getByText("Low confidence")).toBeTruthy();
  });

  it("says a rank is not a credential and that percentiles are not equal steps", () => {
    const { container } = render(React.createElement(RankCard, { regionRank: live.get("biceps")! }));
    expect(container.textContent).toContain("A Sports Genome rank, not a competition credential.");
    expect(container.textContent).toContain("the gap between two percentiles is not an equal step in strength");
  });

  it("explains an unscored group in words", () => {
    render(React.createElement(UnscoredRankCard, { hasRecords: false }));
    expect(screen.getByRole("note").textContent).toContain("Nothing logged for this muscle group yet");
  });
});

describe("The printed percentile stays inside its band", () => {
  /** 19.6 is Prospect; rounding would print "20th", which the legend files under JV. */
  it.each([[19.6, 19], [19.999, 19], [39.9, 39], [98.999, 98], [99, 99], [0.4, 1]])("%s prints as %s", (raw, shown) => {
    expect(displayPercentile(raw)).toBe(shown);
  });
});
