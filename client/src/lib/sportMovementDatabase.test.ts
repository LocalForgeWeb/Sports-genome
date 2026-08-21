import { describe, expect, it } from "vitest";
import { sportMovementProfiles } from "./sportMovementDatabase";

const movement = (id: string) => sportMovementProfiles.find((entry) => entry.id === id);

describe("evidence-audited sport movement records", () => {
  it("keeps the sport database at or above its original 400-movement research scope", () => {
    expect(sportMovementProfiles.length).toBeGreaterThanOrEqual(400);
  });

  it("uses corrected sprint-acceleration terminology for the track block start", () => {
    const blockStart = movement("track-and-field-1");
    expect(blockStart?.family).toBe("sprint acceleration");
    expect(blockStart?.primaryMuscles).toMatch(/gluteus maximus.*quadriceps.*hamstrings.*plantar flexors/i);
    expect(blockStart?.gymTransferCue).toMatch(/do not guarantee sprint transfer/i);
  });

  it("adds evidence-bounded Wrestling turn and throw patterns", () => {
    expect(movement("wrestling-21")?.label).toBe("gut-wrench turn");
    expect(movement("wrestling-22")?.gymTransferCue).toMatch(/technical skill|technical coaching/i);
  });

  it("adds Volleyball defensive readiness without presenting it as a complete sport-skill replacement", () => {
    const readiness = movement("volleyball-21");
    expect(readiness?.family).toBe("defensive anticipation and first-step change of direction");
    expect(readiness?.gymTransferCue).toMatch(/perceptual skill/i);
  });

  it("expands Boxing and Ice Hockey with sport-specific repositioning patterns", () => {
    expect(movement("boxing-21")?.gymTransferCue).toMatch(/boxing skills/i);
    expect(movement("ice-hockey-21")?.family).toBe("goalie lateral repositioning and recovery");
  });
});
