import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, isAuthenticated: false }) }));
vi.mock("@/lib/trpc", () => ({ trpc: {} }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { buildGeneratedWeekSportSeed, buildSmartDraftWorkout } from "./Home";
import { getSportSession } from "@/lib/movementRecommendations";

describe("Home hierarchy construction", () => {
  it("orders the actual smart-draft construction from hierarchy-prioritized session results", () => {
    const session = getSportSession("track-and-field", "Athleticism", 8, undefined, "sprint");
    const draft = buildSmartDraftWorkout([...session].reverse());
    expect(draft.map((exercise) => exercise.id)).not.toEqual([...session].reverse().map((item) => item.exercise.id));
  });

  it("changes the generated-week sport seed when the active hierarchy modifier changes", () => {
    const sprintSeed = buildGeneratedWeekSportSeed("track-and-field", "Athleticism", 10, undefined, "sprint");
    const distanceSeed = buildGeneratedWeekSportSeed("track-and-field", "Athleticism", 10, undefined, "distance");
    expect(sprintSeed.map((exercise) => exercise.id)).not.toEqual(distanceSeed.map((exercise) => exercise.id));
  });
});
