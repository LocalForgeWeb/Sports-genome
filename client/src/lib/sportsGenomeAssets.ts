const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qiccnqkypbhlwpmjcsri.supabase.co";
const publicAssetBaseUrl = `${configuredSupabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/sports-genome-assets`;

export function sportsGenomeAsset(name: string) {
  return `${publicAssetBaseUrl}/${encodeURIComponent(name)}`;
}

/**
 * The brand images the app cannot look right without, served from the app itself when they are
 * in the build (iOS readiness audit, A07): a native shell opened offline, or a storage outage,
 * must not leave the header with a broken image. `scripts/assets/vendor-brand-assets.mjs` copies
 * the official files from the storage bucket into client/src/assets/brand/, byte for byte, under
 * the same names; once they are committed the build bundles them and this picks them up. Until
 * then the remote address is used, and <BrandMark> draws a designed mark if it fails.
 */
const bundledBrand = import.meta.glob<string>("../assets/brand/*.{png,jpg}", { eager: true, query: "?url", import: "default" });

export function brandAsset(name: string): string {
  return bundledBrand[`../assets/brand/${name}`] ?? sportsGenomeAsset(name);
}

/** The files the vendoring script copies: the header badge and the official logo. */
export const essentialBrandFiles = ["sports-genome-circular-header-badge_8450998e.jpg", "sports-genome-official-logo-180_8085dfd8.png"] as const;

export const sportsGenomeAssets = {
  circularBadge: brandAsset("sports-genome-circular-header-badge_8450998e.jpg"),
  heroLab: sportsGenomeAsset("gym-optimizer-performance-lab_fc8df71f.jpg"),
  officialLogo: brandAsset("sports-genome-official-logo-180_8085dfd8.png"),
  introVideo: sportsGenomeAsset("sports-genome-intro-source_07000a26.mp4"),
  introSilhouette: sportsGenomeAsset("sports-genome-upright-s-silhouette-exact_349405db.png"),
  introDnaDetail: sportsGenomeAsset("sports-genome-upright-dna-detail-exact_8e94e37f.png"),
  icon64: sportsGenomeAsset("sports-genome-upright-s-dna-64_904d4b7b.png"),
  icon180: sportsGenomeAsset("sports-genome-upright-s-dna-180_c496e9d0.png"),
  icon192: sportsGenomeAsset("sports-genome-upright-s-dna-192_979589c2.png"),
  icon512: sportsGenomeAsset("sports-genome-upright-s-dna-512_1a0f292a.png"),
  strengthQualified: sportsGenomeAsset("strength-qualified-reference-state_3ccc4f09.png"),
  strengthUnavailable: sportsGenomeAsset("strength-reference-unavailable-state_f08bbf9c.png"),
} as const;
