import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSprintPowerEvidenceContext } from "@/lib/sprintPowerEvidence";
import { SprintPowerEvidenceDisclosure } from "./SprintPowerEvidenceDisclosure";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("sprint and power evidence disclosure", () => {
  it("renders verified sources, supported use, and the no-prescription boundary for a sprint movement", () => {
    const evidence = getSprintPowerEvidenceContext({ label: "Resisted sprint force-velocity test", family: "sprint", bodyActions: "horizontal drive" });
    if (!evidence) throw new Error("Expected sprint evidence context");
    const markup = renderToStaticMarkup(createElement(SprintPowerEvidenceDisclosure, { evidence }));

    expect(markup).toContain("Verified sprint and power context");
    expect(markup).toContain("29926369");
    expect(markup).toContain("30273283");
    expect(markup).toContain("deterministic individualized prescription");
  });

  it("renders RFD, power, and reactive-strength sources with task-specific uncertainty", () => {
    const evidence = getSprintPowerEvidenceContext({ label: "Rate of force development power jump", family: "plyometric power", bodyActions: ["takeoff", "rebound"] });
    if (!evidence) throw new Error("Expected power evidence context");
    const markup = renderToStaticMarkup(createElement(SprintPowerEvidenceDisclosure, { evidence }));

    expect(markup).toContain("26941023");
    expect(markup).toContain("26063470");
    expect(markup).toContain("36906633");
    expect(markup).toContain("protocol- and exercise-specific");
    expect(markup).toContain("fixed drop-height prescription");
  });
});
