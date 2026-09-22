import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { searchEverything } from "./universalSearch";
import { capacityProposalFor, capacityTargetForMuscle, capacityTargetSearchTerms } from "./capacityTargets";
import { muscleLabels } from "@/components/AnatomyMap";

const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const card = readFileSync(new URL("../components/CapacityFocusCard.tsx", import.meta.url), "utf8");

/** Every target the live catalog lists, as the app receives them. */
const catalogTargets = [
  { targetKey: "ankle", name: "Ankle" },
  { targetKey: "calf_achilles", name: "Calf and Achilles" },
  { targetKey: "foot", name: "Foot" },
  { targetKey: "forearm", name: "Forearm" },
  { targetKey: "groin_adductors", name: "Groin and adductors" },
  { targetKey: "hamstring", name: "Hamstrings" },
  { targetKey: "hip", name: "Hip" },
  { targetKey: "knee", name: "Knee" },
  { targetKey: "lumbar_spine", name: "Low back" },
  { targetKey: "quadriceps", name: "Quadriceps" },
  { targetKey: "shoulder", name: "Shoulder" },
];

const found = (query: string) =>
  searchEverything(query).flatMap((group) => group.results).map((result) => result.id);

/**
 * The interaction contract fixes where this feature may live - §6, "resilience
 * is a cross-cutting lens, not a destination... never a permanent resilience
 * tab" - and §11 requires "a named/search/list path with the same authority as
 * any spatial tap". It had neither: the setting existed only inside the profile,
 * under a heading nobody searches for, reachable only by scrolling to it.
 */
describe("targeted capacity can be found without knowing where it lives", () => {
  it("is reachable by the words an athlete actually types", () => {
    for (const term of ["injury", "weak point", "rehab", "pain", "focus area", "sore"]) {
      expect(found(term), `"${term}" finds it`).toContain("profile#targeted-capacity");
    }
  });

  it("tolerates the spelling, like every other search on this app", () => {
    // The contract's universal-search rule requires tolerant matching, and
    // someone typing one-handed with a sore shoulder is exactly the case.
    expect(found("injry")).toContain("profile#targeted-capacity");
    expect(found("rehabb")).toContain("profile#targeted-capacity");
  });

  /**
   * `trainable-gaps-not-athlete-identities`: "Avoid person/trait labels". The
   * words people search with and the words the product says back are held to
   * different rules, and the split has to stay that way round.
   */
  it("takes those words as input without repeating them back as labels", () => {
    const results = searchEverything("weak point").flatMap((group) => group.results);
    const entry = results.find((result) => result.id === "profile#targeted-capacity");
    expect(entry).toBeTruthy();
    expect(entry!.label).toBe("Something you want stronger");
    for (const trait of ["weak", "injur", "deficit"]) {
      expect(entry!.label.toLowerCase(), `the label avoids "${trait}"`).not.toContain(trait);
      expect(entry!.context.toLowerCase(), `the context avoids "${trait}"`).not.toContain(trait);
    }
  });

  it("does not hijack a search for something else", () => {
    // "shoulder" is a muscle and a body region before it is a setting.
    const shoulder = searchEverything("shoulder").flatMap((group) => group.results);
    expect(shoulder[0]?.id, "the anatomy still wins").not.toBe("profile#targeted-capacity");
    expect(found("bench")).not.toContain("profile#targeted-capacity");
  });

  it("lands on the card rather than the top of the profile", () => {
    // Search results may name a place inside a workspace; the profile is long
    // enough that arriving at its top is the same as not arriving.
    expect(home).toContain('const [workspaceId, anchorId = ""] = result.id.split("#");');
    expect(home).toContain("if (anchor) revealWorkspaceAnchor(anchor);");
    expect(card).toContain('<section id="targeted-capacity" tabIndex={-1}');
  });

  /**
   * Measured before this: focused on the card, page at the top, card 1,962px
   * below the fold. Every workspace navigation schedules its own smooth
   * scroll-to-top on the next frame, which lands after the anchor's scroll and
   * wins. Arriving at the right element and showing the wrong screen is the bug
   * this whole change exists to remove, so it is pinned rather than trusted.
   */
  it("does not let the workspace's own scroll-to-top land on top of the anchor", () => {
    expect(home).toContain("if (!keepScroll) window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: \"smooth\" }));");
    expect(home).toContain("navigateWorkspace(target, { keepScroll: Boolean(anchor) });");
    expect(home).toContain('navigateWorkspace("profile", { keepScroll: true }); revealWorkspaceAnchor("targeted-capacity");');
  });

  it("keeps every search term out of sight of the label rules by living with the feature", () => {
    expect(capacityTargetSearchTerms).toContain("weak point");
    expect(capacityTargetSearchTerms.every((term) => term === term.toLowerCase())).toBe(true);
  });
});

/**
 * Body Lab is a primary surface for this feature in the blueprint - "expose
 * regional targets without implying diagnosis" - and carried nothing at all.
 */
describe("a region in Body Lab offers the nearest target", () => {
  it("names every mapped muscle with a key the anatomy map actually draws", () => {
    // A mapping keyed on a muscle that does not exist is a mapping that never
    // fires, and nothing else would say so.
    for (const muscle of Object.keys(capacityTargetForMuscle)) {
      expect(muscleLabels[muscle], `${muscle} is a Body Lab region`).toBeTruthy();
    }
  });

  it("points every mapping at a target the catalog really lists", () => {
    const keys = new Set(catalogTargets.map((target) => target.targetKey));
    const unlisted = Object.entries(capacityTargetForMuscle)
      .filter(([, mapped]) => !keys.has(mapped.targetKey))
      .map(([muscle, mapped]) => `${muscle} -> ${mapped.targetKey}`);
    expect(unlisted.join(", "), "these offers would open an empty picker").toBe("");
  });

  it("offers the same structure where the target is the same structure", () => {
    expect(capacityProposalFor("hamstrings", catalogTargets)).toEqual({ targetKey: "hamstring", relation: "same", name: "Hamstrings" });
    expect(capacityProposalFor("quads", catalogTargets)?.relation).toBe("same");
  });

  /**
   * The rotator cuff is not the shoulder. Offering the shoulder target for it is
   * useful; passing it off as the same object is not, so the copy says which.
   */
  it("says so when the nearest target is the region rather than the muscle", () => {
    const offer = capacityProposalFor("rotatorCuff", catalogTargets);
    expect(offer).toEqual({ targetKey: "shoulder", relation: "region", name: "Shoulder" });
    expect(home).toContain('capacityOfferForSelection.relation === "region"');
    expect(home).toContain("is the area");
  });

  it("offers nothing rather than guessing", () => {
    // Latissimus dorsi has no region target, and inventing one would be the
    // muscle-to-joint promotion the mapping exists to avoid.
    expect(capacityProposalFor("lats", catalogTargets)).toBeNull();
    expect(capacityProposalFor("biceps", catalogTargets)).toBeNull();
    expect(capacityProposalFor(null, catalogTargets)).toBeNull();
  });

  it("offers nothing when the catalog cannot list the target", () => {
    expect(capacityProposalFor("hamstrings", [])).toBeNull();
    expect(home).toContain('resilienceCatalogQuery.data?.status === "connected" ? resilienceCatalogQuery.data.targets : []');
  });

  /**
   * `separate-capacity-targets-from-constraints`, anti-pattern: "interpreting
   * any selected region as injured". A tap on a body map sets a target and asks
   * nothing; the second question stays the card's.
   */
  it("sets a target from a region tap and never a constraint", () => {
    expect(home).toContain('constraintType: reported || "proactive_none"');
    expect(home).toContain("const adoptCapacityTarget = (targetKey: string) => {");
    // And it never quietly throws away something the athlete did report.
    expect(home).toContain('if (holdsAReport && capacityFocus.focus?.targetKey !== targetKey) return;');
  });

  it("adds no destination for it, because the contract forbids one", () => {
    // §6 FIXED: "Resilience is a cross-cutting lens, not a destination."
    expect(home).not.toMatch(/type Workspace = [^;]*"resilience"/);
    expect(home).not.toMatch(/type Workspace = [^;]*"capacity"/);
  });
});
