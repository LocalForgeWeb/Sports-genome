import { describe, expect, it } from "vitest";
import { equipmentMatchesProfile, filterStackForEquipment, gymAccessProfiles } from "./equipmentProfile";

describe("equipment profiles", () => {
  it("keeps automatic bodyweight-only stacks inside the available profile", () => {
    const exercises = [{ equipment: "Bodyweight" }, { equipment: "Cable" }, { equipment: "Dumbbells" }];
    expect(filterStackForEquipment(exercises, { gymAccess: "Bodyweight only", availableEquipment: gymAccessProfiles["Bodyweight only"] })).toEqual([{ equipment: "Bodyweight" }]);
  });

  it("allows free-weight catalog records when a compatible free-weight tool is available", () => {
    expect(equipmentMatchesProfile("Free weights", ["Dumbbells"])).toBe(true);
    expect(equipmentMatchesProfile("Cable", ["Dumbbells"])).toBe(false);
  });
});
