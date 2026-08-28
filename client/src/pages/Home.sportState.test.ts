import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Home sport state safeguards", () => {
  it("starts with no sport selected and resets persisted athlete sport context explicitly", () => {
    expect(source).toContain('const [sportId, setSportId] = useState("")');
    expect(source).toContain('setOnboardingComplete(false);');
    expect(source).toContain('window.localStorage.removeItem(athleteProfileKey)');
  });

  it("connects workspace sport controls to the shared switch handler and recalculates the active movement collection", () => {
    expect(source).toContain('sportMovementProfiles.filter((profile) => profile.sportId === activeSportId)');
    expect(source).toContain('onSport={chooseSport}');
    expect(source).toContain('onClick={() => chooseSport(profile.id)}');
  });

  it("resets weekly sport-specific drafts without rendering an obstructive sport-change toast", () => {
    expect(source).toContain('setPlanWeeks({});');
    expect(source).toContain('setActiveWeek(1);');
    expect(source).not.toContain('toast("Sport context updated"');
    expect(source).not.toContain("Your current workout was retained for review");
  });
});
