import { writeFileSync } from "node:fs";
import { scoreMuscleProfile } from "../../../server/supabaseStrengthProfile";
import { latsScreenshots as fx, screenshotLifts as L } from "../../../server/fixtures/latsScreenshots";
const key = (o: { load?: number; reps: number }) => `${o.load}x${o.reps}`;
const client = {
  getExerciseIndex: async () => [], getMuscles: async () => [],
  getMuscleMappings: async (ids: readonly string[]) => fx.mappings.filter((m) => ids.includes(m.exercise_id)),
  scoreProfile: async (_bw: number, _sex: string, observations: { load?: number; reps: number }[]) => ({ status: "ok", exercise_scores: observations.map((o) => fx.scores[key(o)]).filter(Boolean), estimated_only: [], failures: [] }),
  adjustForAge: async (_i: string, _b: number, _s: string, _a: number, score: unknown) => score,
};
const out: Record<string, unknown> = {};
for (const [name, lifts] of Object.entries({ A: [L.latPulldown187x6, L.machineLowRow600x12], B: [L.latPulldown350x1, L.machineLowRow325x8] })) {
  const result = await scoreMuscleProfile(client as never, { exercises: fx.exercises, muscles: fx.muscles }, { sex: "male", lifts: lifts.map((l) => ({ ...l, bodyMassKg: 65.77, ageYears: 17 })) });
  // The sheet also names the lift the route could not place (the screenshot's Wide-Grip pulldown).
  if (result.status !== "unavailable") result.unranked.push({ exerciseName: "Wide-Grip Cable Lat Pulldown", reason: "exercise_not_recognised" });
  out[name] = result;
}
writeFileSync(process.argv[2], JSON.stringify(out));
const a = (out.A as any).muscles.find((m: any) => m.canonicalName === "latissimus_dorsi");
console.log("A lats", a.scoreBound, a.lowerBound, a.upperBound);
