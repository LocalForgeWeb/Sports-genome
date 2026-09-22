import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panel = readFileSync(new URL("./AthleteAboutMePanel.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const quiz = readFileSync(new URL("./AthleteBaselineQuiz.tsx", import.meta.url), "utf8");

describe("Not training for a sport stays sayable after onboarding", () => {
  /**
   * The introduction offers three complete answers. The profile offered one: a sport list
   * whose only way out read "Reset sport selection" and ran `resetSportSelection`, which
   * set the mode back to `sport`, cleared onboarding and emptied every week. An athlete who
   * stopped competing could not say so without losing their plan.
   */
  it("offers the same three answers the introduction does", () => {
    for (const value of ['"sport"', '"general"', '"undecided"']) {
      expect(panel, `${value} is offered on the profile`).toContain(`value: ${value}`);
    }
    expect(panel).toContain("Do you train for a sport?");
    expect(panel).toContain("General strength and resilience");
    expect(panel).toContain("Decide later");
    // The same wording as the quiz, so the two places do not describe it differently.
    expect(quiz).toContain("No sport. Strength, capacity and body-region goals all stay available.");
    expect(panel).toContain("No sport. Strength, capacity and body-region goals all stay available.");
  });

  it("changes context without destroying the plan", () => {
    expect(home).toContain("const chooseSportContextMode = (mode: SportContextMode) => {");
    const start = home.indexOf("const chooseSportContextMode");
    const body = home.slice(start, home.indexOf("\n  };", start));
    // A sport only adds sport-specific demands; days, weeks and equipment came from goal,
    // equipment and schedule, which all still apply.
    for (const destructive of ["setDayStore", "setPlanWeeks", "setOnboardingComplete", "removeItem"]) {
      expect(body, `${destructive} has no business in a context change`).not.toContain(destructive);
    }
    expect(body).toContain('setSportId("")');
  });

  /** The trapdoor is gone, not merely unreferenced. */
  it("no longer routes an empty sport into a destructive reset", () => {
    expect(home).not.toContain("const resetSportSelection");
    expect(home).not.toContain("Reset sport selection?");
    // The rendered option, not the comment above that explains why it is gone.
    expect(panel).not.toContain('<option value="">Reset sport selection</option>');
    expect(home).toContain("if (!id) return;");
  });

  it("hides the sport and role pickers when no sport applies", () => {
    expect(panel).toContain('{sportContextMode === "sport" && <>');
    // Nothing offers a blank sport any more: choosing no sport is the question above.
    expect(panel).toContain('<option value="" disabled>Choose a sport</option>');
  });

  /**
   * `value=""` matches no option, so a select listing only sports shows the first one -
   * which is how a general athlete was previously told they trained for whatever sport
   * happened to sort first.
   */
  it("never shows a general athlete a sport they did not choose", () => {
    expect(home).toContain('{!sportId && <option value="" disabled>{sportContextMode === "general" ? "No sport — general training" : "No sport chosen yet"}</option>}');
  });
});
