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

describe("The context question is drawn like the question it is", () => {
  const panelStyles = readFileSync(new URL("../athlete-about-me.css", import.meta.url), "utf8");

  /**
   * The quiz asks this exact question with an icon, the answer and a check on the one that
   * is chosen. Three bordered rectangles with native radio dots read as a form control for
   * something incidental; this is one of the four things the whole plan is built from.
   */
  it("uses the same card the introduction uses for the same question", () => {
    for (const icon of ["icon: Target", "icon: Dumbbell", "icon: Sparkles"]) {
      expect(panel, `${icon} is on the profile's answers`).toContain(icon);
    }
    expect(panel).toContain('<i className="about-me-context-medallion" aria-hidden="true"><Icon className="h-5 w-5" /></i>');
    expect(panel).toContain('<i className="about-me-context-check" aria-hidden="true">{chosen && <Check className="h-5 w-5" />}</i>');
  });

  /**
   * Choosing is the one moment this control has, so it answers back: the card lifts, the
   * medallion takes the action colour, the accent runs down the leading edge, and the
   * check arrives under its own motion instead of appearing fully formed.
   */
  it("answers back when an answer is chosen", () => {
    expect(panelStyles).toContain("@keyframes about-me-context-check-in");
    expect(panelStyles).toContain(".about-me-context-mode .about-me-context-active::before");
    expect(panelStyles).toContain(".about-me-context-mode .about-me-context-active .about-me-context-medallion");
    expect(panelStyles).toMatch(/\.about-me-context-active \{[^}]*linear-gradient/);
    expect(panelStyles).toContain(".about-me-context-mode .about-me-context-choice:hover { transform: translateY(-1px)");
  });

  it("assembles rather than appearing, and briefly", () => {
    expect(panelStyles).toContain("@keyframes about-me-context-in");
    expect(panelStyles).toContain(".about-me-context-mode .about-me-context-choice:nth-of-type(3) { animation-delay: 140ms; }");
  });

  /**
   * `.about-me-card label` is (0,1,1) and set a stacked grid, so a single-class rule lost
   * to it and the icon, answer and check stacked down the card instead of sitting in a row.
   */
  it("outranks the card's own label layout", () => {
    expect(panelStyles).toContain(".about-me-context-mode .about-me-context-choice {");
    expect(panelStyles).not.toMatch(/^\.about-me-context-choice \{/m);
  });

  it("keeps the radio for the keyboard while the card carries the selected state", () => {
    // Visually hidden, not display:none - removing it from the tree takes it off the
    // keyboard and out of the accessibility tree with it.
    expect(panelStyles).toContain(".about-me-context-mode .about-me-context-choice input { position: absolute;");
    expect(panelStyles).not.toMatch(/\.about-me-context-choice input \{[^}]*display: none/);
    expect(panelStyles).toContain(".about-me-context-mode .about-me-context-choice:focus-within { outline:");
    expect(panel).toContain('<input type="radio" name="about-me-context-mode"');
  });

  /**
   * All of it is decoration over a state the card already states, so the entrance goes
   * too - otherwise it is the one piece of motion a reduced-motion athlete cannot avoid.
   */
  it("holds still for an athlete who asked it to", () => {
    const guard = panelStyles.slice(panelStyles.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(guard).toContain("animation: none; transition: none;");
    expect(guard).toContain(".about-me-context-check svg");
    expect(guard).toContain(".about-me-context-mode .about-me-context-choice:hover,");
    expect(guard).toContain("transform: none;");
  });
});
