import { useState } from "react";
import { Cable, Circle, Dumbbell, PersonStanding, Weight, type LucideIcon } from "lucide-react";
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
 * before the bytes arrive, so text and controls never move when they do.
 *
 * A frame that fails on the CDN is asked for once from the second host; a frame
 * that fails there too becomes the placeholder. No broken-image icon, no retry
 * loop, no row that disappears.
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
  /** Per frame: 0 = CDN, 1 = second host, 2 = given up. */
  const [attempt, setAttempt] = useState<Record<number, number>>({});
  const Icon = placeholderIcon(equipment);
  const stateOf = (index: number) => attempt[index] ?? 0;
  const srcFor = (index: number) => (set ? (stateOf(index) === 0 ? set.urls[index] : set.fallbackUrls[index]) : "");
  const onError = (index: number) => setAttempt((current) => ({ ...current, [index]: Math.min(2, (current[index] ?? 0) + 1) }));

  // Most frames are landscape and fill the thumbnail's 3:2 box edge to edge. The few
  // portrait and square frames are shown whole inside it instead of cropped to a strip.
  const orientation = set ? (set.width > set.height * 1.2 ? "landscape" : set.width < set.height ? "portrait" : "square") : undefined;

  if (variant === "thumb") {
    const showPhoto = Boolean(set) && stateOf(0) < 2;
    return <span className="exercise-media exercise-media-thumb" data-state={showPhoto ? "photo" : "placeholder"} data-orientation={showPhoto ? orientation : undefined} aria-hidden="true">
      {showPhoto && set
        ? <img src={srcFor(0)} alt="" width={set.width} height={set.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ objectPosition: set.focal }} onError={() => onError(0)} />
        : <Icon className="exercise-media-icon" />}
    </span>;
  }

  if (!set) {
    return <figure className="exercise-media exercise-media-detail" data-state="placeholder">
      <div className="exercise-media-strip"><span className="exercise-media-frame"><Icon className="exercise-media-icon" /></span></div>
      <figcaption>No photograph of this exercise in the set yet.</figcaption>
    </figure>;
  }
  const frames = set.urls.map((_, index) => index);
  const allFailed = frames.every((index) => stateOf(index) >= 2);
  return <figure className="exercise-media exercise-media-detail" data-frames={frames.length} data-state={allFailed ? "placeholder" : "photo"}>
    <div className="exercise-media-strip">
      {allFailed
        ? <span className="exercise-media-frame"><Icon className="exercise-media-icon" /></span>
        : frames.map((index) => <span key={index} className="exercise-media-frame" data-state={stateOf(index) >= 2 ? "placeholder" : "photo"} data-orientation={orientation} style={{ aspectRatio: `${set.width} / ${set.height}` }}>
          {stateOf(index) >= 2
            ? <Icon className="exercise-media-icon" />
            : <img src={srcFor(index)} alt={`${exerciseName}, ${set.captions[index].toLowerCase()} position`} width={set.width} height={set.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ objectPosition: set.focal }} onError={() => onError(index)} />}
          <small>{set.captions[index]}</small>
        </span>)}
    </div>
    <figcaption>{allFailed ? "The photographs could not be loaded." : `${exercisePhotoCredit}. The photographs identify the exercise; they are not a full technique demonstration.`}</figcaption>
  </figure>;
}
