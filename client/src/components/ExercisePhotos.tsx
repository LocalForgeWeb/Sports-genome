import { useState } from "react";
import { exercisePhotoCredit, exercisePhotoSet } from "@/lib/exercisePhotos";

/**
 * The exercise's photographs: the start and the finish of the movement side by
 * side, captioned, in the app's frame. A photo that fails to load falls back to
 * the second host once and then withdraws the whole strip - a broken image icon
 * says less than nothing. Exercises without a photograph render nothing.
 */
export function ExercisePhotos({ exerciseId, exerciseName, compact = false }: { exerciseId: number; exerciseName: string; /** One frame, small: the catalog row's thumbnail. */ compact?: boolean }) {
  const set = exercisePhotoSet(exerciseId);
  const [failed, setFailed] = useState(false);
  const [fallback, setFallback] = useState<Record<number, boolean>>({});
  if (!set || failed) return null;
  const frames = compact ? [0] : set.urls.map((_, index) => index);
  const onError = (index: number) => {
    if (!fallback[index]) { setFallback((current) => ({ ...current, [index]: true })); return; }
    setFailed(true);
  };
  if (compact) {
    return <span className="exercise-photo-thumb" aria-hidden="true">
      <img src={fallback[0] ? set.fallbackUrls[0] : set.urls[0]} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => onError(0)} />
    </span>;
  }
  return <figure className="exercise-photos" data-frames={frames.length}>
    <div className="exercise-photos-strip">
      {frames.map((index) => <span key={index} className="exercise-photo">
        <img src={fallback[index] ? set.fallbackUrls[index] : set.urls[index]} alt={`${exerciseName}, ${set.captions[index].toLowerCase()} position`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => onError(index)} />
        <small>{set.captions[index]}</small>
      </span>)}
    </div>
    <figcaption>{exercisePhotoCredit}</figcaption>
  </figure>;
}
