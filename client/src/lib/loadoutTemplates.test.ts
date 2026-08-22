import { describe, expect, it } from "vitest";
import { buildVariedLoadout, loadoutTemplateRules } from "./loadoutTemplates";
import type { Exercise } from "./exerciseCatalog";

const exercise = (id: number, name: string, movement: string, qualities: string[]): Exercise => ({ id, name, movement, qualities, primaryMuscles: ["Pectoralis Major"], secondaryMuscles: [], equipment: "Dumbbell", category: "Strength", instructions: [], sportFit: {} } as unknown as Exercise);
const pool = [
  exercise(1, "Barbell Back Squat", "Squat", ["Strength"]),
  exercise(2, "Dumbbell Lateral Raise", "Shoulder abduction", ["Hypertrophy"]),
  exercise(3, "Box Jump", "Jump", ["Power"]),
  exercise(4, "Farmer Carry", "Carry", ["Capacity", "Stability"]),
  exercise(5, "Medicine Ball Rotational Throw", "Rotation", ["Athletic", "Power"]),
];

describe("varied training loadouts", () => {
  it("uses distinct template priorities rather than a fixed offset through one exercise pool", () => {
    const strength = buildVariedLoadout(pool, [pool[4]], "Strength Foundation", 3);
    const hypertrophy = buildVariedLoadout(pool, [pool[4]], "Hypertrophy Volume", 3);
    const power = buildVariedLoadout(pool, [pool[4]], "Athletic Power", 3);

    expect(strength[0]?.name).toBe("Barbell Back Squat");
    expect(hypertrophy[0]?.name).toBe("Dumbbell Lateral Raise");
    expect(power.map((exercise) => exercise.name)).toContain("Box Jump");
    expect(power[0]?.name).not.toBe("Barbell Back Squat");
  });

  it("keeps sport anchors only in sport-transfer loadouts and publishes a transparent priority description", () => {
    const transfer = buildVariedLoadout(pool, [pool[4]], "Sport Transfer", 3);
    const strength = buildVariedLoadout(pool, [pool[4]], "Strength Foundation", 3);

    expect(transfer[0]?.id).toBe(5);
    expect(strength[0]?.id).not.toBe(5);
    expect(loadoutTemplateRules["Sport Transfer"].description).toContain("sport-action anchors");
  });
});
