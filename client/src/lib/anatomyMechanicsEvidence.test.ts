import { describe, expect, it } from "vitest";
import { getAnatomyMechanicsEvidence } from "./anatomyMechanicsEvidence";

describe("anatomy mechanics evidence boundaries", () => {
  it("keeps hamstring architecture and late-swing mechanics distinct from personal force or injury prediction", () => {
    const hamstrings = getAnatomyMechanicsEvidence("hamstrings");

    expect(hamstrings.scope).toContain("not mechanically interchangeable");
    expect(hamstrings.sources.join(" ")).toContain("PMID 30117053");
    expect(hamstrings.boundary).toContain("force or injury risk");
  });

  it("labels shoulder stability and antagonist co-contraction as model-dependent context rather than a diagnosis", () => {
    const cuff = getAnatomyMechanicsEvidence("rotatorCuff");

    expect(cuff.scope).toContain("static optimization may understate antagonistic activity");
    expect(cuff.sources.join(" ")).toContain("PMID 31668905");
    expect(cuff.boundary).toContain("does not diagnose");
  });

  it("keeps the default architecture and leverage explanation source-bounded for muscles without a dedicated record", () => {
    const fallback = getAnatomyMechanicsEvidence("obliques");

    expect(fallback.scope).toContain("capacity-related descriptors");
    expect(fallback.sources.join(" ")).toContain("PMID 21502118");
    expect(fallback.boundary).toContain("does not infer individual architecture");
  });
});
