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

  it("adds Brazilian Jiu-Jitsu standing grappling without treating gym drills as technique substitutes", () => {
    const standingCycle = movement("brazilian-jiu-jitsu-21");
    expect(standingCycle?.family).toBe("standing grappling and takedown defense");
    expect(standingCycle?.gymTransferCue).toMatch(/grappling skills/i);
  });

  it("adds contact and deceleration gaps without reducing either sport to isolated muscle action", () => {
    expect(movement("american-football-21")?.gymTransferCue).toMatch(/football skills/i);
    expect(movement("basketball-21")?.family).toBe("deceleration, pivot, and change of direction");
  });

  it("adds Soccer support-leg transfer without reducing the kick to one isolated muscle", () => {
    const supportLeg = movement("soccer-21");
    expect(supportLeg?.family).toBe("kicking support and force transfer");
    expect(supportLeg?.gymTransferCue).toMatch(/soccer skills/i);
  });

  it("adds Swimming starts and turns as a distinct phase from the surface stroke", () => {
    const transition = movement("swimming-21");
    expect(transition?.family).toBe("start, turn, and underwater transition");
    expect(transition?.gymTransferCue).toMatch(/swimming skills/i);
  });

  it("keeps Track and Field jump-event phases distinct from sprinting", () => {
    const jumpSequence = movement("track-and-field-21");
    expect(jumpSequence?.family).toBe("jump-event approach, takeoff, flight, and landing");
    expect(jumpSequence?.gymTransferCue).toMatch(/track-and-field skills/i);
  });
});
