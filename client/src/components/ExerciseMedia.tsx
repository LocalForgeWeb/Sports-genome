import { useState } from "react";
import { Cable, Circle, Dumbbell, PersonStanding, RotateCw, Weight, type LucideIcon } from "lucide-react";
import { exercisePhotoCredit, exercisePhotoSet } from "@/lib/exercisePhotos";
import "../exercise-media.css";

/**
 * The one exercise-media component, in two sizes.
 *
 *   thumb  - a small frame beside the exercise's name: the catalog row, a plan
 *            row, a workout row. One photograph (the start of the movement);
 *            identifies the exercise, says nothing about technique.
 *   detail - the movement, start and finish side by side, captioned, with the
 *            source credit: Exercise Intelligence.
 *
 * Media is chosen by the exercise's stable catalog id through the curated map
 * (`exercisePhotos.ts`); never by position in a list or a name resemblance at
 * render time. An exercise without a photograph gets the same frame holding its
 * equipment's icon, so a list's rows line up and no row ever borrows another
 * exercise's photo. The frame's box is reserved from the photo's intrinsic size
 * before the bytes arrive, so text and controls never move when they do; while
 * a slow photo is on its way the frame shows the icon, not an empty hole.
 *
 * A thumbnail is the app's own scaled copy of the start frame; if that fails it
 * falls back to the full frame on the CDN, then the second host. A detail frame
 * tries the CDN, then the second host. A frame that fails everywhere becomes the
 * placeholder - no broken-image icon, no retry loop, no row that disappears - and
 * the detail view offers one Retry, which starts the chain again.
 */
export type ExerciseMediaProps = {
  exerciseId: number;
  exerciseName: string;
  equipment?: string;
  variant?: "thumb" | "detail";
};

/** A restrained stand-in from the app's own icon family, by the exercise's equipment. */
function placeholderIcon(equipment: string | undefined): LucideIcon {
  const key = (equipment ?? "").toLowerCase();
  if (key.includes("cable") || key.includes("band")) return Cable;
  if (key.includes("bodyweight")) return PersonStanding;
  if (key.includes("medicine")) return Circle;
  if (key.includes("sled")) return Weight;
  return Dumbbell;
}

export function ExerciseMedia({ exerciseId, exerciseName, equipment, variant = "thumb" }: ExerciseMediaProps) {
  const set = exercisePhotoSet(exerciseId);
  /** Per frame: how many sources have failed so far. */
  const [attempt, setAttempt] = useState<Record<number, number>>({});
  /** Per frame: the photograph has painted. */
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  /** Bumped by Retry so the same URLs are requested again rather than served from the failed state. */
  const [round, setRound] = useState(0);
  const Icon = placeholderIcon(equipment);
  const stateOf = (index: number) => attempt[index] ?? 0;
  const chainFor = (index: number) => (!set ? [] : variant === "thumb" ? [set.thumbUrl, set.urls[0], set.fallbackUrls[0]] : [set.urls[index], set.fallbackUrls[index]]);
  const failed = (index: number) => stateOf(index) >= chainFor(index).length;
  const srcFor = (index: number) => { const url = chainFor(index)[stateOf(index)] ?? ""; return round && url ? `${url}${url.includes("?") ? "&" : "?"}retry=${round}` : url; };
  const onError = (index: number) => setAttempt((current) => ({ ...current, [index]: (current[index] ?? 0) + 1 }));
  const onLoad = (index: number) => setLoaded((current) => (current[index] ? current : { ...current, [index]: true }));
  const retry = () => { setAttempt({}); setLoaded({}); setRound((value) => value + 1); };

  // Most frames are landscape and fill the thumbnail's 3:2 box edge to edge. The few
  // portrait and square frames are shown whole inside it instead of cropped to a strip.
  const orientation = set ? (set.width > set.height * 1.2 ? "landscape" : set.width < set.height ? "portrait" : "square") : undefined;

  if (variant === "thumb") {
    const showPhoto = Boolean(set) && !failed(0);
    return <span className="exercise-media exercise-media-thumb" data-state={showPhoto ? (loaded[0] ? "photo" : "loading") : "placeholder"} data-orientation={showPhoto ? orientation : undefined} aria-hidden="true">
      {(!showPhoto || !loaded[0]) && <Icon className="exercise-media-icon" />}
      {showPhoto && set && <img key={srcFor(0)} src={srcFor(0)} alt="" width={set.width} height={set.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ objectPosition: set.focal }} onLoad={() => onLoad(0)} onError={() => onError(0)} />}
    </span>;
  }

  if (!set) {
    return <figure className="exercise-media exercise-media-detail" data-state="placeholder">
      <div className="exercise-media-strip"><span className="exercise-media-frame"><Icon className="exercise-media-icon" /></span></div>
      <figcaption>No photograph of this exercise in the set yet.</figcaption>
    </figure>;
  }
  const frames = set.urls.map((_, index) => index);
  const allFailed = frames.every((index) => failed(index));
  const someFailed = frames.some((index) => failed(index));
  return <figure className="exercise-media exercise-media-detail" data-frames={frames.length} data-state={allFailed ? "placeholder" : "photo"}>
    <div className="exercise-media-strip">
      {allFailed
        ? <span className="exercise-media-frame"><Icon className="exercise-media-icon" /></span>
        : frames.map((index) => <span key={index} className="exercise-media-frame" data-state={failed(index) ? "placeholder" : loaded[index] ? "photo" : "loading"} data-orientation={orientation} style={{ aspectRatio: `${set.width} / ${set.height}` }}>
          {(failed(index) || !loaded[index]) && <Icon className="exercise-media-icon" />}
          {!failed(index) && <img key={srcFor(index)} src={srcFor(index)} alt={`${exerciseName}, ${set.captions[index].toLowerCase()} position`} width={set.width} height={set.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ objectPosition: set.focal }} onLoad={() => onLoad(index)} onError={() => onError(index)} />}
          <small>{set.captions[index]}</small>
        </span>)}
    </div>
    <figcaption>
      {allFailed ? "The photographs could not be loaded." : someFailed ? "One photograph could not be loaded." : `${exercisePhotoCredit}. The photographs identify the exercise; they are not a full technique demonstration.`}
      {someFailed && <button type="button" className="exercise-media-retry" onClick={retry}><RotateCw aria-hidden="true" />Retry</button>}
    </figcaption>
  </figure>;
}
