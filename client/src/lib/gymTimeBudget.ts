import type { TrainingGoal } from "./workoutPlanner";

export const gymTimeOptions = [30, 45, 60, 75, 90] as const;

export type GymTimeMinutes = (typeof gymTimeOptions)[number];

export type GymTimeBudget = {
  minutes: GymTimeMinutes;
  label: string;
  recommendationLimit: number;
  sessionSetAdjustment: number;
  restGuidance: string;
  scopeCue: string;
};

const budgets: Record<GymTimeMinutes, GymTimeBudget> = {
  30: { minutes: 30, label: "30 min", recommendationLimit: 3, sessionSetAdjustment: -5, restGuidance: "Keep setup simple and prioritize the first one to two lifts; use the lower end of the planned rest range.", scopeCue: "Essential work only: one priority lift plus focused support." },
  45: { minutes: 45, label: "45 min", recommendationLimit: 4, sessionSetAdjustment: -3, restGuidance: "Use efficient transitions and keep accessory work focused; preserve longer rest for the highest-skill sets.", scopeCue: "A focused primary block with selected support work." },
  60: { minutes: 60, label: "60 min", recommendationLimit: 5, sessionSetAdjustment: 0, restGuidance: "Use the goal-specific rest range and keep transitions deliberate rather than rushed.", scopeCue: "A balanced training session with movement coverage and supporting work." },
  75: { minutes: 75, label: "75 min", recommendationLimit: 6, sessionSetAdjustment: 2, restGuidance: "Keep full goal-specific rest for priority lifts, then use the remaining window for assistance work.", scopeCue: "Full priority work with room for targeted accessories." },
  90: { minutes: 90, label: "90+ min", recommendationLimit: 7, sessionSetAdjustment: 4, restGuidance: "Allow full recovery for demanding lifts and add only assistance work that fills a clear movement or muscle need.", scopeCue: "A complete session with time for priority work, accessories, and purposeful preparation." },
};

export function normalizeGymMinutes(value: number): GymTimeMinutes {
  return gymTimeOptions.reduce((nearest, option) => Math.abs(option - value) < Math.abs(nearest - value) ? option : nearest, 60 as GymTimeMinutes);
}

export function getGymTimeBudget(value: number): GymTimeBudget {
  return budgets[normalizeGymMinutes(value)];
}

export function timeAdjustedSetBand(goal: TrainingGoal, base: [number, number], minutes: number): [number, number] {
  const adjustment = getGymTimeBudget(minutes).sessionSetAdjustment;
  return [Math.max(4, base[0] + adjustment), Math.max(6, base[1] + adjustment)];
}
