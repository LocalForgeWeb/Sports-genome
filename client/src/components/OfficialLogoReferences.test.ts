import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const authScreen = readFileSync(new URL("./EmailAuthScreen.tsx", import.meta.url), "utf8");
const onboarding = readFileSync(new URL("./AthleteBaselineQuiz.tsx", import.meta.url), "utf8");

describe("official Sports Genome logo references", () => {
  it("uses the user-supplied official artwork in account entry and onboarding", () => {
    expect(authScreen).toContain('sports-genome-official-logo-180_8085dfd8.png');
    expect(onboarding).toContain('sports-genome-official-logo-180_8085dfd8.png');
    expect(authScreen).not.toContain('sports-genome-apple-touch-icon_06bc5f79.png');
    expect(onboarding).not.toContain('sports-genome-apple-touch-icon_06bc5f79.png');
  });
});
