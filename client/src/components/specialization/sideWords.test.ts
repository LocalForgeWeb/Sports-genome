import { describe, expect, it } from "vitest";
import { deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { fxBack, fxCore, fxThigh } from "@/lib/specialization/__fixtures__/multiRegion";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { sideWordsFor } from "./sideWords";

/**
 * The one thing the page still says about sides comes from the region (docs/specialization-atlas/
 * 10-multi-region.md §1.1, §2.2 and the appendix "Both sides as one"): both sides count as one
 * (owner, 20 Oct 2026, extended to every paired region), said in the region's side word ("arm",
 * "side", "leg") and the limb the logger records. A midline region has no sides, and says that.
 */

const forearm = sideWordsFor(forearmRegionData.region);
const thigh = sideWordsFor(fxThigh.region);
const back = sideWordsFor(fxBack.region);
const core = sideWordsFor(fxCore.region);

describe("the side words", () => {
  it("are main's sentence on the forearm, word for word (4dac1ae SpecializationPanel.tsx bothArmsRule and the 3D panel's)", () => {
    expect([forearm.paired, forearm.limb, forearm.one, forearm.many]).toEqual([true, "arm", "arm", "arms"]);
    expect(forearm.countedTogether).toBe("Both arms count together: a set counts once, whichever arm or arms did it, and a set with no arm recorded counts like any other.");
    expect(forearm.countedOnce).toBe("Both arms count together: a set counts once, whichever arm or arms did it.");
  });

  it("say leg on a region paired by the leg", () => {
    expect([thigh.limb, thigh.one, thigh.many]).toEqual(["leg", "leg", "legs"]);
    expect(thigh.countedTogether).toBe("Both legs count together: a set counts once, whichever leg or legs did it, and a set with no leg recorded counts like any other.");
  });

  it("say side on the back, and still name the arm the logger records", () => {
    expect([back.limb, back.one, back.many]).toEqual(["arm", "side", "sides"]);
    expect(back.countedTogether).toBe("Both sides count together: a set counts once, whichever side or sides did it, and a set with no arm recorded counts like any other.");
    expect(back.countedOnce).toBe("Both sides count together: a set counts once, whichever side or sides did it.");
  });

  it("are the region's own on another region paired by the arm", () => {
    expect(sideWordsFor(deltoidRegionData.region).countedOnce).toBe("Both arms count together: a set counts once, whichever arm or arms did it.");
  });

  it("name no side on a midline region, which says it has none", () => {
    expect([core.paired, core.limb, core.one, core.many]).toEqual([false, null, "", ""]);
    expect(core.countedTogether).toBe("Each set counts once for the fixture core, which has no left or right.");
    expect(core.countedOnce).toBe(core.countedTogether);
  });

  it("never name a left or a right side, on any region", () => {
    for (const words of [forearm, thigh, back, core]) {
      // "no left or right" is the midline's statement that it has none, not a side.
      expect(`${words.countedTogether} ${words.countedOnce}`.replaceAll("no left or right", "")).not.toMatch(/\b(left|right)\b/i);
    }
  });
});
