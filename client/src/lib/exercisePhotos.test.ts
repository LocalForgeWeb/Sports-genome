import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import mapping from "@/data/exercisePhotos.json";
import { exercises } from "./exerciseCatalog";
import { exercisePhotoBase, exercisePhotoCount, exercisePhotoFallbackBase, exercisePhotoSet, exercisePhotoSourceRef, framesInMovementOrder, reversedPhotoSources } from "./exercisePhotos";

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

  it("shows the start first where the source numbers the finish as frame 0", () => {
    // Reported on Cable Lateral Raise: the source's frame 0 has the arm already raised.
    const lateral = exercisePhotoSet(exercises.find((exercise) => exercise.name === "Cable Lateral Raise")!.id)!;
    expect(lateral.source).toBe("Standing_Low-Pulley_Deltoid_Raise");
    expect(lateral.urls).toEqual([
      `${exercisePhotoBase}Standing_Low-Pulley_Deltoid_Raise/1.jpg`,
      `${exercisePhotoBase}Standing_Low-Pulley_Deltoid_Raise/0.jpg`,
    ]);
    expect(lateral.fallbackUrls[0]).toBe(`${exercisePhotoFallbackBase}Standing_Low-Pulley_Deltoid_Raise/1.jpg`);
    expect(lateral.captions).toEqual(["Start", "Finish"]);
    // A pair checked and found in order keeps the source's numbering.
    const dumbbell = exercisePhotoSet(exercises.find((exercise) => exercise.name === "Dumbbell Lateral Raise")!.id)!;
    expect(dumbbell.urls[0]).toBe(`${exercisePhotoBase}Side_Lateral_Raise/0.jpg`);
  });

  it("lists only two-frame sources the catalog uses, each with the reason it is reversed", () => {
    const used = new Map(Object.values(entries).map(([source, count]) => [source, count]));
    // 30 when audited; the one-arm kettlebell swing photo was withdrawn on October 6.
    expect(Object.keys(reversedPhotoSources).length).toBe(29);
    for (const [source, why] of Object.entries(reversedPhotoSources)) {
      expect(used.get(source), source).toBe(2);
      expect(why.length, source).toBeGreaterThan(20);
    }
    expect(framesInMovementOrder("Standing_Low-Pulley_Deltoid_Raise", 2)).toEqual([1, 0]);
    expect(framesInMovementOrder("Barbell_Deadlift", 2)).toEqual([0, 1]);
    expect(framesInMovementOrder("Standing_Low-Pulley_Deltoid_Raise", 1)).toEqual([0]);
  });

  it("says nothing for an exercise the source does not photograph", () => {
    expect(exercisePhotoSet(-1)).toBeNull();
  });

  it("photographs a majority of the catalog", () => {
    // 253 until the October 6 review withdrew 7 that show another variation.
    expect(exercisePhotoCount).toBeGreaterThanOrEqual(246);
    expect(exercisePhotoCount).toBeLessThanOrEqual(exercises.length);
  });

  // October 3: every unphotographed exercise was searched for in the source again;
  // docs/exercise-photo-rematch/ has the decision for each.
  const sourceOf = (name: string) => {
    const exercise = exercises.find((candidate) => candidate.name === name);
    expect(exercise, name).toBeDefined();
    return exercisePhotoSet(exercise!.id)?.source ?? null;
  };

  it("photographs the exercises the re-match found under another name", () => {
    const found: [string, string][] = [
      ["Standard Push-Up", "Pushups"],
      ["Pull-Up", "Pullups"],
      ["Landmine Row", "Bent_Over_One-Arm_Long_Bar_Row"],
      ["Cable Press-Out", "Pallof_Press"],
      ["Cable Reverse Chop", "Standing_Cable_Lift"],
      ["Hanging Knee Raise", "Hanging_Leg_Raise"],
      // Each replaces a photo rejected on October 1: one arm, not two; kneeling, not standing.
      ["Single-Arm Cable Rear-Delt Fly", "Bent_Over_Low-Pulley_Side_Lateral"],
      ["Kneeling Medicine-Ball Chest Pass", "Chest_Push_multiple_response"],
    ];
    for (const [name, source] of found) expect(sourceOf(name), name).toBe(source);
  });

  it("keeps a photo that shows another variation off the exercise", () => {
    // The source's Hanging_Leg_Raise is photographed with the knees bent: it is the knee raise.
    expect(sourceOf("Hanging Leg Raise")).toBeNull();
    // A landmine press is a standing press, not the squat-to-press the two-handle jammer shows.
    expect(sourceOf("Landmine Press")).toBe("Single-Arm_Linear_Jammer");
    expect(sourceOf("Landmine Thruster")).toBe("Landmine_Linear_Jammer");
    // Its frames barely dip, so they are the strict press: not a push press.
    expect(sourceOf("Landmine Push Press")).toBeNull();
    // Refused by the re-match's reviewers: tall boxes read as an incline, a two-foot landing for a
    // single-leg stick, sprinting strides for a march.
    for (const name of ["Deficit Push-Up", "Depth Drop to Stick", "Sled March"]) expect(sourceOf(name), name).toBeNull();
  });

  it("withdraws the photos the October 6 review found showing another variation, and keeps a thumbnail for every one it shows", () => {
    const review = JSON.parse(readFileSync(resolve(process.cwd(), "docs/exercise-media-audit/visual-review.json"), "utf8")) as Record<string, { verdict?: string }>;
    const withdrawn = Object.entries(review).filter(([, item]) => item.verdict === "wrong_variant").map(([id]) => Number(id));
    expect(withdrawn.sort((a, b) => a - b)).toEqual([33, 44, 48, 68, 173, 203, 339]);
    for (const id of withdrawn) expect(exercisePhotoSet(id), String(id)).toBeNull();
    for (const name of ["Clap Push-Up", "Pendlay Row", "Seal Row", "Neutral-Grip Pull-Up", "Bulgarian Split Squat", "Kettlebell Swing", "High Cable Curl"]) expect(sourceOf(name), name).toBeNull();
    // The owner's swap example: both ends are photographed, each with its own exercise.
    expect(sourceOf("Sissy Squat")).toBe("Weighted_Sissy_Squat");
    expect(sourceOf("Back Squat")).toBe("Barbell_Squat");
    const sources = JSON.parse(readFileSync(resolve(process.cwd(), "docs/exercise-media-audit/sources.json"), "utf8")).sources as Record<string, { thumbnail: string; licence: string; exerciseIds: number[] }>;
    const thumbs = new Set(readdirSync(resolve(process.cwd(), "client/public/exercise-thumbs")));
    for (const [id, [source]] of Object.entries(entries)) {
      expect(thumbs.has(`${source}.jpg`), source).toBe(true);
      expect(sources[source]?.exerciseIds, source).toContain(Number(id));
      expect(sources[source].licence).toMatch(/Unlicense/);
    }
    expect(thumbs.size).toBe(new Set(Object.values(entries).map(([source]) => source)).size);
  });

  it("has a frame-order verdict for every source pair the catalog shows", () => {
    const audit = JSON.parse(readFileSync(resolve(process.cwd(), "docs/exercise-photo-order/audit.json"), "utf8")) as Record<string, { verdict: string }>;
    for (const [source, count] of Object.values(entries)) {
      if (count < 2) continue;
      expect(audit[source]?.verdict, source).toMatch(/^(in order|reversed)$/);
      expect(audit[source].verdict === "reversed", source).toBe(Boolean(reversedPhotoSources[source]));
    }
  });
});
