import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { analyzeExerciseContext, buildExerciseGenome, exerciseGenomes } from "./exerciseGenome";
import { sportMovementProfiles } from "./sportMovementDatabase";

describe("Exercise Genome multi-signal model", () => {
  const exercise = exercises.find((item) => item.name === "Cable Serratus Punch") || exercises[0];

  it("exposes explicit adaptation opportunities without claiming a guaranteed outcome", () => {
    const genome = buildExerciseGenome(exercise);
    expect(genome.adaptation.primary).toHaveLength(2);
    expect(genome.adaptation.rationale).toContain("standardized exercise model");
  });

  it("keeps goal, stack, and recovery signals separate from the summary grade", () => {
    const analysis = analyzeExerciseContext(exercise, { goal: "Athleticism", currentWorkout: [exercise] });
    // The sport-action signal is gone (Sep 30 decisions: no number for movement relevance; the tier says it).
    expect(Object.keys(analysis.signals).sort()).toEqual(["goalAlignment", "recoveryManageability", "stackDistinctness"]);
    expect(analysis.strengths).toHaveLength(3);
  });

  it("gives the same fit and grade whatever sport action is in view, and no sport-action number", () => {
    const bridge = sportMovementProfiles.find((movement) => movement.sportId === "wrestling" && movement.id === "wrestling-19")!;
    const throwing = sportMovementProfiles.find((movement) => movement.sportId === "baseball" && movement.id === "baseball-4")!;
    const hipThrust = exercises.find((item) => item.name === "Barbell Hip Thrust")!;
    const without = analyzeExerciseContext(hipThrust, { goal: "Max strength", currentWorkout: [] });
    for (const sportMovement of [bridge, throwing]) {
      const analysis = analyzeExerciseContext(hipThrust, { goal: "Max strength", currentWorkout: [], sportMovement });
      expect(analysis.contextualScore).toBe(without.contextualScore);
      expect(analysis.grade).toBe(without.grade);
      expect(analysis.strengths.join(" ")).not.toMatch(/sport action/i);
    }
  });

  it("differentiates cable mechanics by the exercise setup instead of using a universal cable profile", () => {
    const byName = (name: string) => exercises.find((item) => item.name === name) || exercise;
    expect(buildExerciseGenome(byName("Cable Fly")).resistanceProfile.bias).toBe("Shortened");
    expect(buildExerciseGenome(byName("Seated Cable Row")).resistanceProfile.bias).toBe("Mid-range");
    expect(buildExerciseGenome(byName("Cable Press Around")).resistanceProfile.bias).toBe("Shortened");
    expect(buildExerciseGenome(byName("Bayesian Cable Curl")).resistanceProfile.bias).toBe("Lengthened");
  });

  it("keeps anti-rotation mechanics distinct from active rotation", () => {
    const antiRotation = exercises.find((item) => /pallof/i.test(item.name)) || exercise;
    const genome = buildExerciseGenome(antiRotation);
    expect(genome.jointActions).toContain("Trunk anti-rotation");
    expect(genome.jointActions).not.toContain("Spinal rotation");
  });

  it("adds direct-study context without converting it into a new model score", () => {
    const byName = (name: string) => exercises.find((item) => item.name === name) || exercise;
    const seatedCurl = buildExerciseGenome(byName("Seated Leg Curl"));
    const overheadExtension = buildExerciseGenome(byName("Overhead Cable Triceps Extension"));
    const nordic = buildExerciseGenome(byName("Nordic Hamstring Curl"));

    expect(seatedCurl.studyCalibration?.key).toBe("seated-leg-curl");
    expect(seatedCurl.studyCalibration?.kind).toBe("Direct longitudinal adaptation");
    expect(overheadExtension.studyCalibration?.key).toBe("overhead-triceps-extension");
    expect(nordic.studyCalibration?.rangeOfMotion).toBe("Long-length partial");
    expect(nordic.studyCalibration?.planningBoundary).toContain("not a promise of prevention");
  });

  it("keeps bench angle and equipment modality as contextual evidence rather than hypertrophy ranks", () => {
    const byName = (name: string) => exercises.find((item) => item.name === name) || exercise;
    const inclineBench = buildExerciseGenome(byName("Incline Barbell Bench Press"));
    const machinePress = buildExerciseGenome(byName("Machine Chest Press"));

    expect(inclineBench.studyCalibration?.key).toBe("bench-angle");
    expect(inclineBench.studyCalibration?.planningBoundary).toContain("not an EMG-derived hypertrophy rank");
    expect(machinePress.studyCalibration?.key).toBe("machine-modality");
    expect(machinePress.studyCalibration?.summary).toContain("similar hypertrophy");
  });

  it("retains the calibrated lower-body and posterior-chain distinctions with their explicit limits", () => {
    const byName = (name: string) => exercises.find((item) => item.name === name) || exercise;
    const standingCalf = buildExerciseGenome(byName("Standing Calf Raise"));
    const squat = buildExerciseGenome(byName("Back Squat"));
    const hipThrust = buildExerciseGenome(byName("Barbell Hip Thrust"));
    const rdl = buildExerciseGenome(byName("Romanian Deadlift"));

    expect(standingCalf.studyCalibration?.key).toBe("standing-calf-raise");
    expect(squat.studyCalibration?.key).toBe("squat-pattern");
    expect(squat.studyCalibration?.planningBoundary).toContain("not a universal glute or quadriceps ranking");
    expect(hipThrust.studyCalibration?.key).toBe("hip-thrust-pattern");
    expect(hipThrust.studyCalibration?.planningBoundary).toContain("not used here as a hypertrophy ranking");
    expect(rdl.studyCalibration?.key).toBe("rdl-hinge");
    expect(rdl.studyCalibration?.planningBoundary).toContain("EMG is not used as a growth score");
  });

  it("keeps all verified ROM contexts distinct rather than treating partial ROM as one category", () => {
    const byName = (name: string) => exercises.find((item) => item.name === name) || exercise;
    const legExtension = exercises.find((item) => /leg extension/i.test(item.name)) || exercise;
    const legPress = exercises.find((item) => /leg press/i.test(item.name)) || exercise;
    const squat = buildExerciseGenome(byName("Back Squat"));
    const nordic = buildExerciseGenome(byName("Nordic Hamstring Curl"));
    const extension = buildExerciseGenome(legExtension);
    const press = buildExerciseGenome(legPress);
    const seatedCurl = buildExerciseGenome(byName("Seated Leg Curl"));

    expect(squat.studyCalibration?.rangeOfMotion).toBe("Full");
    expect(squat.studyCalibration?.comparisonRangeContexts).toContain("Short-length partial");
    expect(nordic.studyCalibration?.rangeOfMotion).toBe("Long-length partial");
    expect(extension.studyCalibration?.comparisonRangeContexts).toContain("Short-length partial");
    expect(press.studyCalibration?.rangeOfMotion).toBe("Individualized");
    expect(seatedCurl.studyCalibration?.rangeOfMotion).toBe("Setup-dependent");
  });

  it("places targeting evidence tier, causal mechanics inputs, and uncertainty into the visible muscle explanation", () => {
    const seatedCurl = exercises.find((item) => item.name === "Seated Leg Curl") || exercise;
    const hamstrings = buildExerciseGenome(seatedCurl).muscleProfile.find((entry) => entry.muscle === "hamstrings");

    expect(hamstrings?.why).toContain("Direct longitudinal exercise evidence");
    expect(hamstrings?.why).toContain("Key mechanics inputs");
    expect(hamstrings?.why).toContain("not a measured force");
    expect(hamstrings?.targeting.mechanicsFactors).toHaveLength(10);
  });

  /** Sep 30 brief §7: a muscle listed as both primary and secondary counted twice in relative involvement. */
  it("lists each muscle once in every genome muscle profile, as a prime mover when the catalog says primary", () => {
    for (const genome of Object.values(exerciseGenomes)) {
      const muscles = genome.muscleProfile.map((entry) => entry.muscle);
      expect(new Set(muscles).size, `exercise ${genome.exerciseId} lists a muscle twice`).toBe(muscles.length);
    }
    // Barbell Overhead Press (id 101): the catalog lists frontDelts as primary and again as secondary.
    const overheadPress = exercises.find((item) => item.id === 101)!;
    expect(overheadPress.primaryMuscles).toContain("frontDelts");
    expect(overheadPress.secondaryMuscles).toContain("frontDelts");
    const frontDelts = buildExerciseGenome(overheadPress).muscleProfile.filter((entry) => entry.muscle === "frontDelts");
    expect(frontDelts.map((entry) => entry.role)).toEqual(["Prime mover"]);
  });
});
