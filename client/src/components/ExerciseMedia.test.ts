// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseMedia } from "./ExerciseMedia";
import { exercises } from "@/lib/exerciseCatalog";
import { exercisePhotoBase, exercisePhotoFallbackBase, exercisePhotoSet } from "@/lib/exercisePhotos";

afterEach(cleanup);
const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press")!;
const unphotographed = exercises.find((exercise) => exercisePhotoSet(exercise.id) === null)!;
const css = readFileSync(resolve(process.cwd(), "client/src/exercise-media.css"), "utf8");

describe("the one exercise media component", () => {
  it("reserves the photograph's intrinsic box and loads it lazily from the CDN", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: bench.id, exerciseName: bench.name, equipment: bench.equipment, variant: "thumb" }));
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(`${exercisePhotoBase}Barbell_Bench_Press_-_Medium_Grip/0.jpg`);
    expect(img.getAttribute("width")).toBe("850");
    expect(img.getAttribute("height")).toBe("567");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(container.querySelector(".exercise-media-thumb")?.getAttribute("data-orientation")).toBe("landscape");
  });

  it("asks the second host once, then shows the placeholder frame rather than a broken image or nothing", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: bench.id, exerciseName: bench.name, equipment: bench.equipment, variant: "thumb" }));
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(`${exercisePhotoFallbackBase}Barbell_Bench_Press_-_Medium_Grip/0.jpg`);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".exercise-media-thumb")?.getAttribute("data-state")).toBe("placeholder");
    expect(container.querySelector(".exercise-media-icon")).toBeTruthy();
  });

  it("gives an unphotographed exercise the same frame with its equipment's icon, never another exercise's photo", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: unphotographed.id, exerciseName: unphotographed.name, equipment: unphotographed.equipment, variant: "thumb" }));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".exercise-media-thumb")?.getAttribute("data-state")).toBe("placeholder");
  });

  it("shows the start and finish in the detail variant, captioned, with the credit and the technique boundary", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: bench.id, exerciseName: bench.name, equipment: bench.equipment, variant: "detail" }));
    const images = Array.from(container.querySelectorAll("img"));
    expect(images.map((img) => img.getAttribute("alt"))).toEqual(["Barbell Bench Press, start position", "Barbell Bench Press, finish position"]);
    expect(container.querySelector("figcaption")?.textContent).toContain("Free Exercise DB, public domain");
    expect(container.querySelector("figcaption")?.textContent).toContain("not a full technique demonstration");
    expect((container.querySelector(".exercise-media-frame") as HTMLElement).style.aspectRatio).toBe("850 / 567");
  });

  it("keeps one treatment: 3:2 frames, one radius, a restrained ground, and no photo cropped to a square", () => {
    expect(css).toContain("--exercise-media-radius: 10px");
    expect(css).toContain("height: calc(var(--exercise-media-thumb-width, 5.5rem) * 2 / 3)");
    // The image is laid over a box the frame sizes itself, so a late or missing photo moves nothing.
    expect(css).toContain(".exercise-media-thumb img { position: absolute; inset: 0;");
    expect(css).toMatch(/\.exercise-media-thumb\[data-orientation="portrait"\] img[^{]*\{ object-fit: contain; \}/);
    expect(css).not.toMatch(/width: 3\.5rem; height: 3\.5rem/);
  });
});
