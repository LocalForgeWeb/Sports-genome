import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Lifts are synced with the athlete's own sport or none (Backend V1 PS-14, B019). The browsing
 * fallback - the first sport in the list, wrestling - was written as `sport_id` on every
 * general or undecided athlete's lifts.
 */
describe("The sport sent with synced lifts", () => {
  it("is the one the athlete chose, and nothing for a general athlete", () => {
    const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
    const call = home.slice(home.indexOf("const athleteSync = useAthleteSync({"), home.indexOf("const athleteSync = useAthleteSync({") + 600);
    expect(call).toContain("sportId: hasSportContext ? sportId : undefined,");
    expect(call).not.toContain("sportId: activeSportId,");
    expect(home).toContain('const hasSportContext = sportContextMode === "sport" && Boolean(sportId);');
  });
});
