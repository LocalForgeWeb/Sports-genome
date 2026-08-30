const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qiccnqkypbhlwpmjcsri.supabase.co";
const publicAssetBaseUrl = `${configuredSupabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/sports-genome-assets`;

export function sportsGenomeAsset(name: string) {
  return `${publicAssetBaseUrl}/${encodeURIComponent(name)}`;
}

export const sportsGenomeAssets = {
  circularBadge: sportsGenomeAsset("sports-genome-circular-header-badge_8450998e.jpg"),
  heroLab: sportsGenomeAsset("gym-optimizer-performance-lab_fc8df71f.jpg"),
  officialLogo: sportsGenomeAsset("sports-genome-official-logo-180_8085dfd8.png"),
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
