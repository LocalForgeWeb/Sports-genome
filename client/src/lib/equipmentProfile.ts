import type { Exercise } from "@/lib/exerciseCatalog";
import { requiredAccessoriesOf, requiredAccessoryLabels, type RequiredAccessory } from "@/lib/exerciseExecution";

export const catalogEquipment = ["Bodyweight", "Band", "Dumbbells", "Kettlebell", "Barbell", "Cable", "Machine", "Landmine", "Medicine ball", "Sled"] as const;
export type CatalogEquipment = (typeof catalogEquipment)[number];
export type GymAccess = "Commercial gym" | "Small gym" | "Garage gym" | "At home" | "Bodyweight only";

/**
 * Accessories the broad equipment words do not imply (2 Nov 2026): "Cable" is not a head harness and
 * "Machine" is not a neck machine, so a cable or machine neck exercise needs one of these as well.
 * None is part of any gym-access profile: each is off until the athlete says they have it.
 */
export const equipmentAccessories: readonly RequiredAccessory[] = ["neck_machine", "head_harness"];
export const equipmentAccessoryLabels = requiredAccessoryLabels;

export type AthleteEquipmentProfile = {
  gymAccess: GymAccess;
  availableEquipment: CatalogEquipment[];
  /** Accessories the athlete has (equipmentAccessories). Absent on a profile saved before them: none. */
  accessories?: RequiredAccessory[];
};

export const gymAccessProfiles: Record<GymAccess, CatalogEquipment[]> = {
  "Commercial gym": [...catalogEquipment],
  "Small gym": ["Bodyweight", "Band", "Dumbbells", "Barbell", "Cable", "Machine"],
  "Garage gym": ["Bodyweight", "Band", "Dumbbells", "Kettlebell", "Barbell", "Landmine", "Medicine ball", "Sled"],
  "At home": ["Bodyweight", "Band", "Dumbbells", "Kettlebell", "Medicine ball"],
  "Bodyweight only": ["Bodyweight"],
};

export const defaultEquipmentProfile: AthleteEquipmentProfile = {
  gymAccess: "Commercial gym",
  availableEquipment: gymAccessProfiles["Commercial gym"],
};

export function equipmentMatchesProfile(exerciseEquipment: string, availableEquipment: CatalogEquipment[]) {
  if (availableEquipment.includes(exerciseEquipment as CatalogEquipment)) return true;
  if (exerciseEquipment === "Free weights") return availableEquipment.some((item) => ["Barbell", "Dumbbells", "Kettlebell"].includes(item));
  return false;
}

/** The accessories an exercise needs that this profile does not have (none for most exercises). */
export function missingAccessories(exercise: Pick<Exercise, "id">, profile: Pick<AthleteEquipmentProfile, "accessories">): RequiredAccessory[] {
  const has = new Set(profile.accessories ?? []);
  return requiredAccessoriesOf(exercise.id).filter((accessory) => !has.has(accessory));
}

/** The equipment word and every accessory the exercise needs: what an automatic stack may use. */
export function exerciseFitsProfile(exercise: Pick<Exercise, "id" | "equipment">, profile: AthleteEquipmentProfile): boolean {
  return equipmentMatchesProfile(exercise.equipment, profile.availableEquipment) && missingAccessories(exercise, profile).length === 0;
}

export function filterStackForEquipment<T extends Pick<Exercise, "equipment"> & Partial<Pick<Exercise, "id">>>(items: T[], profile: AthleteEquipmentProfile) {
  return items.filter((item) => equipmentMatchesProfile(item.equipment, profile.availableEquipment) && (item.id === undefined || missingAccessories({ id: item.id }, profile).length === 0));
}

export function equipmentProfileSummary(profile: AthleteEquipmentProfile) {
  if (profile.gymAccess === "Commercial gym") return "Commercial gym profile: automatic stacks can use the full catalog equipment range.";
  return `${profile.gymAccess} profile: automatic stacks use only your ${profile.availableEquipment.length} selected equipment categories. The full catalog remains available for manual additions.`;
}
