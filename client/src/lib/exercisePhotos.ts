/**
 * Exercise photographs.
 *
 * The photos are the Free Exercise DB set (github.com/yuhonas/free-exercise-db,
 * public domain under the Unlicense), the same records Hugging Face mirrors as
 * the `sirnino/bodybuilding-exercises` dataset. Each exercise there has two
 * photographs, the start and the finish of the movement, taken with one model
 * against one background, so a pair reads as one exercise rather than two
 * stock images.
 *
 * `client/src/data/exercisePhotos.json` maps this catalog's exercise ids to the
 * source exercise (its folder id and how many frames it has). It is generated
 * by `scripts/exercise-photos/curate.mjs`: exact name matches plus a hand-checked
 * alias table, never a fuzzy guess - a wrong photo teaches a wrong movement. An
 * exercise the source does not photograph has no entry and shows no photo.
 *
 * The files are served from the jsDelivr GitHub CDN, which caches the repository
 * at a pinned commit; nothing is fetched at build time and the bundle carries
 * only the map.
 */
import mapping from "@/data/exercisePhotos.json";

/** Pinned so a later change upstream cannot swap a photo out from under a name. */
export const exercisePhotoSourceRef = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5";
export const exercisePhotoSourceRepo = "yuhonas/free-exercise-db";
export const exercisePhotoBase = `https://cdn.jsdelivr.net/gh/${exercisePhotoSourceRepo}@${exercisePhotoSourceRef}/exercises/`;
/** A second host for the same bytes, used when the CDN cannot be reached. */
export const exercisePhotoFallbackBase = `https://raw.githubusercontent.com/${exercisePhotoSourceRepo}/${exercisePhotoSourceRef}/exercises/`;

export const exercisePhotoCredit = "Photos: Free Exercise DB, public domain";

export type ExercisePhotoSet = {
  /** The source folder, e.g. "Barbell_Deadlift". */
  source: string;
  /** Start and finish frames, in order; one frame for a hold. */
  urls: string[];
  fallbackUrls: string[];
  captions: string[];
};

const entries = mapping as unknown as Record<string, [string, number]>;

export function exercisePhotoSet(exerciseId: number): ExercisePhotoSet | null {
  const entry = entries[String(exerciseId)];
  if (!entry) return null;
  const [source, count] = entry;
  const frames = Array.from({ length: Math.max(1, Math.min(count, 2)) }, (_, index) => index);
  return {
    source,
    urls: frames.map((index) => `${exercisePhotoBase}${source}/${index}.jpg`),
    fallbackUrls: frames.map((index) => `${exercisePhotoFallbackBase}${source}/${index}.jpg`),
    captions: frames.length === 1 ? ["Position"] : ["Start", "Finish"],
  };
}

/** How many of the catalog's exercises have a photograph, for the record and its tests. */
export const exercisePhotoCount = Object.keys(entries).length;
