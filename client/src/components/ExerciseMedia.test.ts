// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseMedia } from "./ExerciseMedia";
import { exercises } from "@/lib/exerciseCatalog";
import { exercisePhotoBase, exercisePhotoFallbackBase, exercisePhotoSet, exerciseThumbBase } from "@/lib/exercisePhotos";

afterEach(cleanup);
const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press")!;
const unphotographed = exercises.find((exercise) => exercisePhotoSet(exercise.id) === null)!;
const css = readFileSync(resolve(process.cwd(), "client/src/exercise-media.css"), "utf8");

describe("the one exercise media component", () => {
  it("reserves the photograph's intrinsic box and loads the app's own scaled thumbnail lazily", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: bench.id, exerciseName: bench.name, equipment: bench.equipment, variant: "thumb" }));
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(`${exerciseThumbBase}Barbell_Bench_Press_-_Medium_Grip.jpg`);
    expect(img.getAttribute("src")?.startsWith("/")).toBe(true);
    expect(img.getAttribute("width")).toBe("850");
    expect(img.getAttribute("height")).toBe("567");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(container.querySelector(".exercise-media-thumb")?.getAttribute("data-orientation")).toBe("landscape");
  });

  it("shows the equipment icon in the reserved frame while a slow photo is on its way, and only the photo once it paints", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: bench.id, exerciseName: bench.name, equipment: bench.equipment, variant: "thumb" }));
    const frame = container.querySelector(".exercise-media-thumb")!;
    expect(frame.getAttribute("data-state")).toBe("loading");
    expect(frame.querySelector(".exercise-media-icon")).toBeTruthy();
    fireEvent.load(container.querySelector("img")!);
    expect(frame.getAttribute("data-state")).toBe("photo");
    expect(frame.querySelector(".exercise-media-icon")).toBeNull();
  });

  it("falls back to the full frame on the CDN, then the second host, then the placeholder - never a broken image or nothing", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: bench.id, exerciseName: bench.name, equipment: bench.equipment, variant: "thumb" }));
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(`${exercisePhotoBase}Barbell_Bench_Press_-_Medium_Grip/0.jpg`);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(`${exercisePhotoFallbackBase}Barbell_Bench_Press_-_Medium_Grip/0.jpg`);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".exercise-media-thumb")?.getAttribute("data-state")).toBe("placeholder");
    expect(container.querySelector(".exercise-media-icon")).toBeTruthy();
  });

  it("offers Retry in the detail view when a frame cannot be loaded, and asks every host again", () => {
    const { container } = render(React.createElement(ExerciseMedia, { exerciseId: bench.id, exerciseName: bench.name, equipment: bench.equipment, variant: "detail" }));
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    for (let pass = 0; pass < 2; pass += 1) for (const img of Array.from(container.querySelectorAll("img"))) fireEvent.error(img);
    expect(container.querySelector(".exercise-media-detail")?.getAttribute("data-state")).toBe("placeholder");
    expect(container.querySelector("figcaption")?.textContent).toContain("The photographs could not be loaded.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    const again = Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src"));
    expect(again).toEqual([`${exercisePhotoBase}Barbell_Bench_Press_-_Medium_Grip/0.jpg?retry=1`, `${exercisePhotoBase}Barbell_Bench_Press_-_Medium_Grip/1.jpg?retry=1`]);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
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
