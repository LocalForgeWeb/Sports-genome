import { describe, expect, it } from "vitest";
import { sportsGenomeAsset, sportsGenomeAssets } from "./sportsGenomeAssets";

const portableAssetBase =
  "https://qiccnqkypbhlwpmjcsri.supabase.co/storage/v1/object/public/sports-genome-assets/";

describe("Sports Genome portable visual assets", () => {
  it("maps every supplied visual to the public Supabase Storage bucket", () => {
    const urls = Object.values(sportsGenomeAssets);

    expect(urls).toHaveLength(12);
    expect(urls).toEqual(
      expect.arrayContaining([
        `${portableAssetBase}sports-genome-circular-header-badge_8450998e.jpg`,
        `${portableAssetBase}gym-optimizer-performance-lab_fc8df71f.jpg`,
        `${portableAssetBase}sports-genome-official-logo-180_8085dfd8.png`,
        `${portableAssetBase}sports-genome-intro-source_07000a26.mp4`,
        `${portableAssetBase}sports-genome-upright-s-silhouette-exact_349405db.png`,
        `${portableAssetBase}sports-genome-upright-dna-detail-exact_8e94e37f.png`,
        `${portableAssetBase}sports-genome-upright-s-dna-64_904d4b7b.png`,
        `${portableAssetBase}sports-genome-upright-s-dna-180_c496e9d0.png`,
        `${portableAssetBase}sports-genome-upright-s-dna-192_979589c2.png`,
        `${portableAssetBase}sports-genome-upright-s-dna-512_1a0f292a.png`,
        `${portableAssetBase}strength-qualified-reference-state_3ccc4f09.png`,
        `${portableAssetBase}strength-reference-unavailable-state_f08bbf9c.png`,
      ])
    );
    expect(urls.every(url => url.startsWith(portableAssetBase))).toBe(true);
    expect(urls.some(url => url.includes("/manus-storage/"))).toBe(false);
  });

  it("encodes object names while preserving the public bucket contract", () => {
    expect(sportsGenomeAsset("visual proof.png")).toBe(
      `${portableAssetBase}visual%20proof.png`
    );
  });
});
