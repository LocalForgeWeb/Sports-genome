import type { SportMovementProfile } from "@/lib/sportMovementDatabase";

export function getAdjacentMovement(movements: SportMovementProfile[], selectedId: string, direction: -1 | 1) {
  if (!movements.length) return undefined;
  const selectedIndex = Math.max(0, movements.findIndex((movement) => movement.id === selectedId));
  return movements[(selectedIndex + direction + movements.length) % movements.length];
}
