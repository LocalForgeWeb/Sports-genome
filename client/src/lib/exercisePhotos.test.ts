import { describe, expect, it } from "vitest";
import mapping from "@/data/exercisePhotos.json";
import { exercises } from "./exerciseCatalog";
import { exercisePhotoBase, exercisePhotoCount, exercisePhotoFallbackBase, exercisePhotoSet, exercisePhotoSourceRef } from "./exercisePhotos";

const entries = mapping as unknown as Record<string, [string, number]>;

describe("exercise photographs", () => {
  it("maps only exercises this catalog has, to well-formed source folders", () => {
    const ids = new Set(exercises.map((exercise) => String(exercise.id)));
    for (const [id, [source, count]] of Object.entries(entries)) {
      expect(ids.has(id), `exercise ${id} is not in the catalog`).toBe(true);
      expect(source, `source for ${id}`).toMatch(/^[A-Za-z0-9_'()\-.]+$/);
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it("covers the core lifts by hand-checked name, not by guess", () => {
    const byName = new Map(exercises.map((exercise) => [exercise.name, exercise.id]));
    const expectations: [string, string][] = [
      ["Barbell Bench Press", "Barbell_Bench_Press_-_Medium_Grip"],
      ["Conventional Deadlift", "Barbell_Deadlift"],
      ["Back Squat", "Barbell_Squat"],
      ["Barbell Overhead Press", "Standing_Military_Press"],
      ["Romanian Deadlift", "Romanian_Deadlift"],
    ];
    for (const [name, source] of expectations) {
      const id = byName.get(name);
      expect(id, name).toBeDefined();
      expect(exercisePhotoSet(id!)?.source, name).toBe(source);
    }
  });

  it("builds start and finish frames on the pinned CDN path, with a second host", () => {
    const set = exercisePhotoSet(exercises.find((exercise) => exercise.name === "Barbell Bench Press")!.id)!;
    expect(set.urls).toEqual([
      `${exercisePhotoBase}Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
      `${exercisePhotoBase}Barbell_Bench_Press_-_Medium_Grip/1.jpg`,
    ]);
    expect(set.fallbackUrls[0]).toBe(`${exercisePhotoFallbackBase}Barbell_Bench_Press_-_Medium_Grip/0.jpg`);
    expect(set.captions).toEqual(["Start", "Finish"]);
    expect(exercisePhotoBase).toContain(`@${exercisePhotoSourceRef}/`);
  });

  it("says nothing for an exercise the source does not photograph", () => {
    expect(exercisePhotoSet(-1)).toBeNull();
  });

  it("photographs a majority of the catalog", () => {
    expect(exercisePhotoCount).toBeGreaterThanOrEqual(240);
    expect(exercisePhotoCount).toBeLessThanOrEqual(exercises.length);
  });
});
