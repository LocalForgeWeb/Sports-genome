import { sportMovementProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";

/** Returns the first valid action for a sport so changing sport never leaves an incompatible movement selected. */
export function initialMovementForSport(sportId: string): SportMovementProfile | undefined {
  return sportMovementProfiles.find((movement) => movement.sportId === sportId);
}
