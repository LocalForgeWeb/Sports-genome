import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ModifierEvidenceDisclosure } from "./ModifierEvidenceDisclosure";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("modifier evidence disclosure", () => {
  it("renders selected modifier sources and makes their planning scope explicit", () => {
    const markup = renderToStaticMarkup(createElement(ModifierEvidenceDisclosure, {
      modifierLabel: "Wide receiver / defensive back",
      sources: ["NFL positional player-tracking evidence", "Reviewed football performance inventory"],
    }));

    expect(markup).toContain("Active sport modifier evidence");
    expect(markup).toContain("recommendations, smart drafts, and generated weeks");
    expect(markup).toContain("NFL positional player-tracking evidence");
    expect(markup).toContain("do not prescribe an individual program");
  });
});
