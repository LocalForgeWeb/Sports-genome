import { describe, expect, it } from "vitest";

const publicAssetBase =
  "https://qiccnqkypbhlwpmjcsri.supabase.co/storage/v1/object/public/sports-genome-assets";

const expectedAssets = [
  ["gym-optimizer-performance-lab_fc8df71f.jpg", "image/jpeg"],
  ["sports-genome-circular-header-badge_8450998e.jpg", "image/jpeg"],
  ["sports-genome-intro-source_07000a26.mp4", "video/mp4"],
  ["sports-genome-official-logo-180_8085dfd8.png", "image/png"],
  ["sports-genome-upright-dna-detail-exact_8e94e37f.png", "image/png"],
  ["sports-genome-upright-s-dna-64_904d4b7b.png", "image/png"],
  ["sports-genome-upright-s-dna-180_c496e9d0.png", "image/png"],
  ["sports-genome-upright-s-dna-192_979589c2.png", "image/png"],
  ["sports-genome-upright-s-dna-512_1a0f292a.png", "image/png"],
  ["sports-genome-upright-s-silhouette-exact_349405db.png", "image/png"],
  ["strength-qualified-reference-state_3ccc4f09.png", "image/png"],
  ["strength-reference-unavailable-state_f08bbf9c.png", "image/png"],
] as const;

describe("Supabase public Sports Genome assets", () => {
  it("serves all twelve migrated visual assets with their expected MIME type", async () => {
    const responses = await Promise.all(
      expectedAssets.map(async ([fileName, expectedContentType]) => {
        const response = await fetch(`${publicAssetBase}/${fileName}`, {
          method: "HEAD",
        });
        return { fileName, expectedContentType, response };
      })
    );

    for (const { fileName, expectedContentType, response } of responses) {
      expect(response.ok, `${fileName} should be publicly reachable`).toBe(true);
      expect(response.headers.get("content-type"), `${fileName} MIME type`).toContain(
        expectedContentType
      );
    }
  }, 30_000);
});
