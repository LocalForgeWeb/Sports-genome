/**
 * How the exercise catalog was entered, and so what it is showing.
 *
 * The catalog is one page with three modes:
 *
 *   movement  "Find exercises for {movement}" from the Body Lab or the Movement
 *             explorer. The sport and the movement are the base of the page; the
 *             results come from that movement's support tiers (movementSupport).
 *   muscle    "Browse {muscle} exercises", only after the athlete picked a muscle.
 *   all       Every other way in: the tabs, the dock, Home, search.
 *
 * It used to have one mode and a muscle filter. The Body Lab's only way into
 * exercises wrote a muscle chip - the one the athlete had tapped, or else the first
 * muscle a text alias list found in the movement's notes - so "Bridge" opened a
 * Shoulders-filtered catalog with nothing about bridging in it.
 *
 * The context is held by stable ids only, mirrored in the URL beside
 * `workspace=catalog`, and checked whenever it comes in: a movement must belong to
 * the sport named with it, a muscle must be a muscle the app knows. Anything else
 * is the whole catalog, never a mix of two contexts. Labels are worked out from the
 * ids when shown. The day an add goes to is a separate thing (Plan's open day) and
 * nothing here touches it.
 */
import { sportMovementProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";
import { movementDisplayLabel } from "@/lib/movementLabel";

export type ExerciseDiscoveryContext =
  | { mode: "movement"; sportId: string; movementId: string }
  | { mode: "muscle"; muscleId: string }
  | { mode: "all" };

export const allExercisesDiscovery: ExerciseDiscoveryContext = { mode: "all" };

/** The query parameters the context is written to, beside `workspace=catalog`. */
export const discoveryParamNames = ["discover", "sport", "movement", "muscle"] as const;

/** The sport movement a movement-mode context names, if that movement exists in that sport. */
export function discoveryMovementProfile(context: ExerciseDiscoveryContext): SportMovementProfile | null {
  if (context.mode !== "movement") return null;
  return sportMovementProfiles.find((movement) => movement.id === context.movementId && movement.sportId === context.sportId) ?? null;
}

/**
 * The context as the app may use it. A movement that is not in the sport named with
 * it, or a muscle key the app does not know, becomes the whole catalog. A fresh
 * object is returned, so nothing extra rides along on the one passed in.
 */
export function validDiscovery(context: ExerciseDiscoveryContext, knownMuscles: ReadonlySet<string>): ExerciseDiscoveryContext {
  if (context.mode === "movement") return discoveryMovementProfile(context) ? { mode: "movement", sportId: context.sportId, movementId: context.movementId } : allExercisesDiscovery;
  if (context.mode === "muscle") return knownMuscles.has(context.muscleId) ? { mode: "muscle", muscleId: context.muscleId } : allExercisesDiscovery;
  return allExercisesDiscovery;
}

/**
 * The context a catalog address carries. `discover` says which mode; only that
 * mode's own parameters are read, and they are validated. No `discover`, or one
 * that is not a mode, is the whole catalog.
 */
export function discoveryFromParams(params: URLSearchParams, knownMuscles: ReadonlySet<string>): ExerciseDiscoveryContext {
  const mode = params.get("discover");
  if (mode === "movement") return validDiscovery({ mode, sportId: params.get("sport") ?? "", movementId: params.get("movement") ?? "" }, knownMuscles);
  if (mode === "muscle") return validDiscovery({ mode, muscleId: params.get("muscle") ?? "" }, knownMuscles);
  return allExercisesDiscovery;
}

/** Writes the context's parameters, removing every discovery parameter it does not use. Other parameters are left alone. */
export function writeDiscoveryParams(params: URLSearchParams, context: ExerciseDiscoveryContext): void {
  for (const name of discoveryParamNames) params.delete(name);
  if (context.mode === "movement") {
    params.set("discover", "movement");
    params.set("sport", context.sportId);
    params.set("movement", context.movementId);
  } else if (context.mode === "muscle") {
    params.set("discover", "muscle");
    params.set("muscle", context.muscleId);
  }
}

/** One string per context, for keys and comparisons: "movement:wrestling/wrestling-19", "muscle:glutes", "all". */
export function discoveryKey(context: ExerciseDiscoveryContext): string {
  if (context.mode === "movement") return `movement:${context.sportId}/${context.movementId}`;
  if (context.mode === "muscle") return `muscle:${context.muscleId}`;
  return "all";
}

/** The page's title in each mode: "Exercises for Bridge", "Gluteal complex exercises", "Exercise catalog". */
export function discoveryTitle(context: ExerciseDiscoveryContext, muscleLabels: Readonly<Record<string, string>>): string {
  if (context.mode === "movement") {
    const movement = discoveryMovementProfile(context);
    return movement ? `Exercises for ${movementDisplayLabel(movement.label)}` : "Exercise catalog";
  }
  if (context.mode === "muscle") return `${muscleLabels[context.muscleId] || context.muscleId} exercises`;
  return "Exercise catalog";
}
