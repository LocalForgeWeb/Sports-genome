import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const authScreen = readFileSync(new URL("./EmailAuthScreen.tsx", import.meta.url), "utf8");
const onboarding = readFileSync(new URL("./AthleteBaselineQuiz.tsx", import.meta.url), "utf8");
const brandMark = readFileSync(new URL("./BrandMark.tsx", import.meta.url), "utf8");

describe("official Sports Genome logo references", () => {
  it("keeps official artwork in account entry and uses the latest user-supplied circular badge in active onboarding", () => {
    // Through <BrandMark> (iOS readiness, A07): the same official files, with a drawn mark if they fail.
    expect(authScreen).toContain('<BrandMark variant="logo"');
    expect(onboarding).toContain('<BrandMark size={38} />');
    expect(brandMark).toContain('variant === "badge" ? sportsGenomeAssets.circularBadge : sportsGenomeAssets.officialLogo');
    expect(authScreen).not.toContain('sports-genome-apple-touch-icon_06bc5f79.png');
    expect(onboarding).not.toContain('sports-genome-apple-touch-icon_06bc5f79.png');
  });
});
