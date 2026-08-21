import type { Exercise } from "@/lib/exerciseCatalog";

export const catalogEquipment = ["Bodyweight", "Band", "Dumbbells", "Kettlebell", "Barbell", "Cable", "Machine", "Landmine", "Medicine ball", "Sled"] as const;
export type CatalogEquipment = (typeof catalogEquipment)[number];
export type GymAccess = "Commercial gym" | "Small gym" | "Garage gym" | "At home" | "Bodyweight only";

export type AthleteEquipmentProfile = {
  gymAccess: GymAccess;
  availableEquipment: CatalogEquipment[];
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

export function filterStackForEquipment<T extends Pick<Exercise, "equipment">>(items: T[], profile: AthleteEquipmentProfile) {
  return items.filter((item) => equipmentMatchesProfile(item.equipment, profile.availableEquipment));
}

export function equipmentProfileSummary(profile: AthleteEquipmentProfile) {
  if (profile.gymAccess === "Commercial gym") return "Commercial gym profile: automatic stacks can use the full catalog equipment range.";
  return `${profile.gymAccess} profile: automatic stacks use only your ${profile.availableEquipment.length} selected equipment categories. The full catalog remains available for manual additions.`;
}
