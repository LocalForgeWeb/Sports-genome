import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveConstraintPosture } from "@shared/resilienceContext";

const card = readFileSync(new URL("./CapacityFocusCard.tsx", import.meta.url), "utf8");
const aboutMe = readFileSync(new URL("./AthleteAboutMePanel.tsx", import.meta.url), "utf8");
const quiz = readFileSync(new URL("./AthleteBaselineQuiz.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../athlete-about-me.css", import.meta.url), "utf8");

describe("Targeted capacity stays editable after onboarding", () => {
  it("lives in the profile, not only in the introduction", () => {
    expect(aboutMe).toContain("<CapacityFocusCard");
    expect(aboutMe).toContain("capacityFocus?: CapacityFocusState;");
    expect(aboutMe).toContain("capacityFocus = { reportedSignals: [] }");
    expect(home).toContain("capacityFocus={capacityFocus}");
    expect(home).toContain("onCapacityFocus={setCapacityFocus}");
  });

  it("says out loud that the introduction asks the same thing", () => {
    expect(card).toContain("The introduction asks this too");
    expect(card).toContain("yours to change whenever something turns up");
  });

  it("tells the athlete during onboarding where to find it later", () => {
    expect(quiz).toContain("Profile → Something you want stronger");
    expect(quiz).toContain("which is where to go if something turns up later");
  });

  it("survives a reload rather than being captured and dropped", () => {
    // The whole point: an instability reported months after signup has to persist.
    expect(home).toContain("capacityFocus?: CapacityFocusState;");
    expect(home).toContain("version: 3, sportId, sportContextMode, capacityFocus");
    expect(home).toContain("if (profile.capacityFocus) setCapacityFocus(");
    // An older stored profile simply has nothing selected; it must not be rejected.
    expect(home).toContain("profile.version === 3");
  });
});

describe("The profile keeps the two questions separate", () => {
  it("asks what to build before asking how it feels", () => {
    expect(card.indexOf("What do you want to build up?")).toBeLessThan(card.indexOf("Anything going on there right now?"));
  });

  it("only asks the second question once there is a target", () => {
    // Progressive disclosure, same rule as the quiz: no target, no symptom question.
    expect(card).toContain("{selectedTarget && <label>");
    expect(card).toContain("selectedTarget && constraintType !== \"proactive_none\"");
  });

  it("clears what was reported when the target is cleared", () => {
    expect(card).toContain('if (!nextKey) return onChange({ reportedSignals: [] });');
    expect(card).toContain('next === "proactive_none" ? [] : reportedSignals');
  });

  it("never infers a constraint from the chosen area", () => {
    // The card may only ever set a constraint the athlete picked from the list.
    expect(card).toContain("constraintType: next");
    expect(card).not.toMatch(/constraintType:\s*"symptomatic"/);
  });
});

describe("The profile withholds the same way the quiz does", () => {
  it("uses the shared posture rule rather than its own", () => {
    expect(card).toContain("resolveConstraintPosture(constraintType, reportedSignals)");
    // A partially-shaped value from an older stored profile must not crash the panel.
    expect(card).toContain("value.reportedSignals ?? []");
    // Same inputs, same answer, wherever the athlete reports it.
    expect(resolveConstraintPosture("proactive_none", [])).toBe("ordinary_action");
    expect(resolveConstraintPosture("symptomatic", [])).toBe("qualified_action");
    expect(resolveConstraintPosture("clinician_restricted", [])).toBe("withhold");
    expect(resolveConstraintPosture("symptomatic", ["neurological_or_systemic"])).toBe("withhold");
  });

  it("escalates without naming a condition", () => {
    expect(card).toContain('posture === "withhold"');
    expect(card).toContain("we are not telling you what the problem is");
    expect(styles).toContain(".about-me-capacity-escalation {");
  });

  it("states the insufficiency case rather than implying every target is covered", () => {
    expect(card).toContain("No reviewed exercise routine covers");
    expect(card).toContain("the plan will say what is missing rather than guessing");
  });

  it("renders an unavailable catalog as a sentence, not a broken control", () => {
    expect(card).toContain("about-me-capacity-unavailable");
    expect(card).toContain("Nothing else in your plan is affected.");
  });
});
