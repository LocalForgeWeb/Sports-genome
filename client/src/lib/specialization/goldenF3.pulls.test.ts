import { describe, expect, it } from "vitest";
import { pullsWeekSummaries } from "./__fixtures__/releaseGateHistories";
import { waveAInputs } from "./__fixtures__/goldenWaveA";
import { f3Moves } from "./__fixtures__/goldenF3";

/**
 * Release F3's pulls case (the release review of 24 Oct 2026): `forearm_mappings_v2` adds the
 * brachioradialis, as other (contributing) work, to seven pulls none of which is tagged `forearms`
 * (87, 88, 318, 326, 329, 330, 333). v1 already credits the muscle on rows and pulldowns; these
 * exercises had no variant until wave A, and v2 reads them the same way. Unlike the release
 * golden histories, here v2 puts sets in the forearm's region that v1 left out of it, so region
 * totals and completeness move too. One week of the seven beside a wrist curl
 * (releaseGateHistories.ts `pullsWeekSummaries`), computed as wave A left the tree (the forearm
 * under v1) and as the tree computes it, both arms as one and per arm: every moved number is
 * listed, generated, and held to __fixtures__/goldenF3.moved.pulls.txt (the release's list).
 */
const sides = ["both", "left", "right"] as const;

describe("F3's pulls case: forearm_mappings_v1 to v2 on the seven pulls whose brachioradialis v2 adds", () => {
  it("lists every moved number, region totals and completeness included, generated", async () => {
    const waveA = new Map(pullsWeekSummaries(sides, waveAInputs).map((item) => [item.id, item.summary]));
    const tree = pullsWeekSummaries(sides);
    const lines = tree.map((item) => f3Moves(item.id, waveA.get(item.id)!, item.summary, { regionMayMove: true }));
    // Every case moves, and only the region and the brachioradialis do.
    expect(lines.every((line) => typeof line === "string")).toBe(true);
    for (const line of lines as string[]) expect(line.split(": ").slice(1).join(": ").split("; ").map((part) => part.split(" ")[0]), line).toEqual(["region", "br"]);
    // Region totals only rise: v2 adds sets to the region and takes none away.
    for (const item of tree) expect(item.summary.regionDistinctBouts, item.id).toBeGreaterThan(waveA.get(item.id)!.regionDistinctBouts);
    console.log(`F3, the pulls case's moved numbers:\n${(lines as string[]).join("\n")}`);
    await expect(`${(lines as string[]).join("\n")}\n`).toMatchFileSnapshot("./__fixtures__/goldenF3.moved.pulls.txt");
  });
});
