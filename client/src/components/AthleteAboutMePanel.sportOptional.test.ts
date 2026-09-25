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

describe("The rest of Training context speaks the same way", () => {
  const panelStyles = readFileSync(new URL("../athlete-about-me.css", import.meta.url), "utf8");

  /**
   * Goal is the same kind of question as the sport one, asked in the same card. As a bare
   * dropdown above three cards it read as two different kinds of question - and it listed
   * enum values with no explanation, while the introduction described each one.
   */
  it("asks the goal with the introduction's own definition, not a second copy", () => {
    expect(quiz).toContain("export const trainingGoalChoices");
    expect(panel).toContain('import { trainingGoalChoices,');
    expect(panel).not.toContain('const goals: TrainingGoal[] =');
    expect(panel).toContain('className="about-me-goal-grid"');
    expect(panel).toContain('title={item.detail}');
  });

  /** Seven numbers, every one a tap away, and the range visible without opening anything. */
  it("makes the day count a row rather than a dropdown", () => {
    expect(panel).toContain('className="about-me-days-row"');
    expect(panel).not.toContain("<span>Training days / week</span><select");
    expect(panelStyles).toContain(".about-me-days-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));");
    // Changing it is not destructive, and the note says so rather than leaving it to be found out.
    expect(panel).toContain("Your saved days are kept if you change this.");
  });

  it("keeps both keyboard-reachable with the card carrying the state", () => {
    for (const rule of [".about-me-card .about-me-goal-choice input { position: absolute;", ".about-me-card .about-me-day-chip input { position: absolute;"]) {
      expect(panelStyles, rule).toContain(rule);
    }
    expect(panelStyles).toContain(".about-me-card .about-me-goal-choice:focus-within { outline:");
    expect(panelStyles).toContain(".about-me-card .about-me-day-chip:focus-within { outline:");
  });

  /**
   * The capacity card is a light panel inside a dark destination. Its heading set no colour,
   * so it inherited the on-dark token onto white and was very nearly unreadable - caught on
   * a screenshot pass and carried as a known defect until now.
   */
  it("states the capacity heading's colour rather than inheriting the wrong one", () => {
    expect(panelStyles).toMatch(/\.about-me-capacity-head h2 \{[^}]*color: var\(--sg-text-on-light\)/);
    expect(panelStyles).toContain(".destination-secondary .about-me-capacity-head h2 { color: var(--sg-text-on-dark); }");
  });
});
