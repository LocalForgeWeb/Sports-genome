import { describe, expect, it } from "vitest";
import { getSprintPowerEvidenceContext } from "./sprintPowerEvidence";

describe("verified sprint and power evidence context", () => {
  it("assigns acceleration mechanics as a multidimensional demand without a single-exercise prescription", () => {
    const evidence = getSprintPowerEvidenceContext({ label: "Sprint acceleration", family: "acceleration and sprint mechanics", bodyActions: ["forward drive"] });
    expect(evidence?.sourceLabels.join(" ")).toContain("26733889");
    expect(evidence?.planningBoundary).toContain("single causal muscle, exercise, or technique");
  });

  it("keeps force-velocity and resisted-sprint context descriptive rather than deterministic", () => {
    const evidence = getSprintPowerEvidenceContext({ label: "Resisted sprint force-velocity test", family: "sprint", bodyActions: "horizontal drive" });
    expect(evidence?.sourceLabels.join(" ")).toContain("29926369");
    expect(evidence?.sourceLabels.join(" ")).toContain("30273283");
    expect(evidence?.planningBoundary).toContain("deterministic individualized prescription");
  });

  it("separates pre-planned COD and repeated-sprint maintenance from a generic speed score", () => {
    const evidence = getSprintPowerEvidenceContext({ label: "Repeated sprint change of direction", family: "change of direction", bodyActions: ["braking", "re-acceleration"] });
    expect(evidence?.sourceLabels.join(" ")).toContain("40668491");
    expect(evidence?.sourceLabels.join(" ")).toContain("21780851");
    expect(evidence?.planningBoundary).toContain("Pre-planned COD does not equal reactive agility");
  });

  it("surfaces RFD, power, and reactive-strength context with task-specific uncertainty", () => {
    const power = getSprintPowerEvidenceContext({ label: "Rate of force development power jump", family: "plyometric power", bodyActions: ["takeoff", "rebound"] });
    expect(power?.sourceLabels.join(" ")).toContain("26941023");
    expect(power?.sourceLabels.join(" ")).toContain("26063470");
    expect(power?.sourceLabels.join(" ")).toContain("36906633");
    expect(power?.planningBoundary).toContain("protocol- and exercise-specific");
    expect(power?.planningBoundary).toContain("fixed drop-height prescription");
  });
});
