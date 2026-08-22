import type { Exercise } from "./exerciseCatalog";

export type TrainingLoadout = "Athletic Power" | "Strength Foundation" | "Hypertrophy Volume" | "Capacity Circuit" | "Sport Transfer";

type TemplateRule = { keywords: RegExp; quality: RegExp; anchorCount: number; description: string };

export const loadoutTemplateRules: Record<TrainingLoadout, TemplateRule> = {
  "Athletic Power": { keywords: /clean|snatch|jump|throw|sprint|plyo|explosive|swing/i, quality: /power|speed|athletic/i, anchorCount: 1, description: "Prioritizes fast, explosive patterns before supporting strength work." },
  "Strength Foundation": { keywords: /squat|deadlift|press|row|pull.?up|chin.?up|carry/i, quality: /strength|force/i, anchorCount: 0, description: "Prioritizes repeatable compound force patterns and balanced supporting work." },
  "Hypertrophy Volume": { keywords: /raise|curl|extension|fly|pulldown|leg curl|calf|adduction|abduction/i, quality: /hypertrophy|muscle/i, anchorCount: 0, description: "Prioritizes direct regional coverage and controlled movement variety." },
  "Capacity Circuit": { keywords: /carry|sled|lunge|step.?up|rower|bike|circuit|crawl/i, quality: /capacity|conditioning|stability/i, anchorCount: 0, description: "Prioritizes repeatable work, locomotion, and lower-complexity conditioning patterns." },
  "Sport Transfer": { keywords: /rotation|anti.rotation|jump|throw|carry|sprint|sled/i, quality: /athletic|power|stability/i, anchorCount: 2, description: "Prioritizes selected sport-action anchors, then complementary transfer work." },
};

function templateScore(exercise: Exercise, rule: TemplateRule) {
  const text = `${exercise.name} ${exercise.movement} ${exercise.qualities.join(" ")}`;
  return (rule.keywords.test(text) ? 4 : 0) + (rule.quality.test(text) ? 2 : 0) + Math.min(1, exercise.primaryMuscles.length / 3);
}

export function buildVariedLoadout(pool: Exercise[], sportSeed: Exercise[], loadout: TrainingLoadout, limit: number) {
  const rule = loadoutTemplateRules[loadout];
  const anchors = sportSeed.slice(0, rule.anchorCount);
  const sorted = [...pool]
    .sort((a, b) => templateScore(b, rule) - templateScore(a, rule) || a.name.localeCompare(b.name))
    .reduce<Exercise[]>((list, exercise) => list.some((item) => item.movement === exercise.movement) ? list : [...list, exercise], []);
  return [...anchors, ...sorted]
    .filter((exercise, index, array) => array.findIndex((item) => item.id === exercise.id) === index)
    .slice(0, Math.max(1, limit));
}
