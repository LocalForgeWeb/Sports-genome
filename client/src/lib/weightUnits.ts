export type DisplayWeightUnit = "lb" | "kg";

const kilogramsPerPound = 0.45359237;

export function displayWeightToKilograms(value: number, unit: DisplayWeightUnit) {
  return unit === "lb" ? value * kilogramsPerPound : value;
}

export function kilogramsToDisplayWeight(value: number, unit: DisplayWeightUnit) {
  return unit === "lb" ? value / kilogramsPerPound : value;
}

export function formatDisplayWeight(valueKg: number, unit: DisplayWeightUnit) {
  const displayValue = kilogramsToDisplayWeight(valueKg, unit);
  return `${Math.round(displayValue * 10) / 10} ${unit}`;
}

export function weightUnitLabel(unit: DisplayWeightUnit) {
  return unit === "lb" ? "pounds" : "kilograms";
}
