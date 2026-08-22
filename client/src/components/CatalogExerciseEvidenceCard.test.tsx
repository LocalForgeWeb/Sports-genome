import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { CatalogExerciseEvidenceCard } from "./CatalogExerciseEvidenceCard";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("catalog exercise evidence card", () => {
  it("renders calibrated source, ROM context, and counterevidence for catalog inspection", () => {
    const seatedCurl = exercises.find((exercise) => exercise.name === "Seated Leg Curl") || exercises[0];
    const markup = renderToStaticMarkup(createElement(CatalogExerciseEvidenceCard, { exercise: seatedCurl }));

    expect(markup).toContain("Study calibration / catalog record");
    expect(markup).toContain("Maeo et al., 2021");
    expect(markup).toContain("ROM: Setup-dependent");
    expect(markup).toContain("protocol- and population-specific growth finding");
  });
});
